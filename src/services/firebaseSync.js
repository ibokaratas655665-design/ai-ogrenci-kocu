import {
    doc, getDoc, setDoc, collection, getDocs, onSnapshot, serverTimestamp, deleteDoc,
    query, where
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebaseConfig';
import { havuzSahibiUid } from './kimlikKopru';
import LZString from 'lz-string';
import { oku, listeOku } from './veriDeposu';

/**
 * Firebase oturumunun geri yüklenmesini bekler.
 *
 * ⚠️ SAYFA YENİLENDİĞİNDE `auth.currentUser` HEMEN DOLMUYOR: oturum
 * IndexedDB'den asenkron okunuyor. `AuthContext` ise oturumu
 * localStorage'dan anında geri yükleyip `init()` çağırıyor. Doğrudan
 * `auth.currentUser` okunsaydı yenilemeden sonra hep `null` görülür,
 * sahiplik damgası yazılamaz ve senkron sessizce kapanırdı.
 *
 * @returns {Promise<string|null>} Firebase kimliği
 */
const authHazir = () => new Promise((coz) => {
    if (auth?.currentUser) { coz(auth.currentUser.uid); return; }
    let bitti = false;
    const bitir = (uid) => { if (!bitti) { bitti = true; coz(uid); } };
    const dur = onAuthStateChanged(auth, (k) => { dur(); bitir(k?.uid || null); });
    // Oturum hiç yoksa onAuthStateChanged null ile tetiklenir; yine de
    // takılı kalmamak için üst sınır konur.
    setTimeout(() => bitir(auth?.currentUser?.uid || null), 8000);
});

const SYNC_KEYS = [
    'coach_students', 'users_db', 'student_tasks', 'exams_data', 'trials_data',
    'v2_trials_data', 'v2_results_data', 'v2_obp_data', 'student_messages', 'coach_messages',
    'student_programs', 'student_guidance_results', 'module_permissions',
    'app_settings', 'student_feature_approvals', 'student_groups',
    'user_notifications',   // bildirim paneli (services/notificationService)
    'student_projects', 'pdr_cases', 'presentations', 'remote_sessions',
    'leaderboard_data', 'managed_coaches', 'custom_curriculum', 'exam_resources',
    'whatsapp_custom_templates', 'whatsapp_settings', 'whatsapp_message_log',
    // Koçun görev şablonları — sablon sekmesi menüye bağlanınca kapsama alındı
    'task_templates',
    // V1.1: PDR okul öğrenci havuzu — koçluk listesinden ayrı anahtar
    'pdr_students',
    // Deneme Analizi sistemi: öğrencinin kendi deneme kayıtları
    'deneme_analizleri',
    'error_notebook', 'program_progress', 'study_log', 'bep_data',
    /**
     * ⚠️ BU DÖRT ANAHTAR SENKRON LİSTESİNDE YOKTU ve her biri gerçek bir
     * ürün hatasına yol açıyordu:
     *
     *   parent_links       → veli portalı VELİNİN CİHAZINDA HİÇ AÇILMIYORDU.
     *                        Belirteç→öğrenci eşlemesi yalnızca koçun
     *                        tarayıcısındaydı; veli bağlantıya tıklayınca
     *                        her koşulda "Öğrenci Bulunamadı" görüyordu.
     *   messages           → koçun gönderdiği TOPLU MESAJ öğrenciye hiç
     *                        ulaşmıyordu. Koç panelinde "gönderildi"
     *                        görünüyor, öğrenci hiçbir şey almıyordu.
     *   appointments       → randevular koçun cihazına hapsti.
     *   coach_subscriptions→ paket/kontenjan bilgisi cihaz başına ayrıydı;
     *                        koç başka cihazda farklı limit görüyordu.
     */
    'parent_links', 'messages', 'appointments', 'coach_subscriptions',
    /**
     * ⚠️ BU ANAHTARLAR DA LİSTE DIŞINDAYDI — aynı hata sınıfı.
     *
     * Yukarıdaki dört anahtar (parent_links, messages, appointments,
     * coach_subscriptions) bulunduktan sonra kapsam TEKRAR tarandı ve
     * altı anahtar daha listede olmadığı için cihaza hapsoluyordu:
     *
     *   student_study_plan      → öğrencinin ÇALIŞMA PLANI. Öğrenci planı
     *   student_exam_type         oluşturuyor, koç panelinde hiç görünmüyor;
     *   student_closed_slots      öğrenci cihaz değiştirince planı kayboluyordu.
     *   pdr_events              → rehberlik etkinlikleri yalnızca oluşturan
     *                             cihazda kalıyordu.
     *   public_test_submissions → halka açık testten gelen gönderimler koça
     *                             ulaşmıyordu.
     *   all_self_assessments    → öğrencinin öz değerlendirmesi ve onun koç
     *                             indeksi senkronlanmıyordu.
     */
    'student_study_plan', 'student_exam_type', 'student_closed_slots',
    'pdr_events', 'public_test_submissions', 'all_self_assessments',
    'tp_name', 'tp_teachers', 'tp_students', 'tp_pairings', 'tp_schedule', 'tp_blocked', 'tp_avail'
];

const NEVER_SYNC = ['user_session', 'current_user', 'USER'];
const PROTECTED_KEYS = ['coach_students', 'users_db', 'student_tasks', 'v2_trials_data', 'v2_results_data', 'v2_obp_data', 'exams_data', 'student_programs', 'pdr_cases'];

/**
 * 🪣 VERİ HAVUZU KİMLİĞİ
 *
 * ⚠️ ESKİ HÂLİ HERKESİ AYNI HAVUZA KOYUYORDU:
 *
 *     const getBucketId = () => 'global';
 *
 * Yorumunda "bu uygulama tek okula aittir" yazıyordu. Uygulama artık
 * birden fazla koçun kullandığı bir sistem ve kullanıcının en kritik
 * şartı şu: HER KOÇ YALNIZCA KENDİ EKLEDİĞİ ÖĞRENCİLERİ GÖRMELİ.
 *
 * Tek havuzda bu sağlanamıyordu: arayüzdeki sahiplik filtresi
 * (accessControl.js) veriyi tarayıcıda gizliyordu ama veri yine de
 * tümüyle iniyordu; konsolu açan koç diğer koçların öğrencilerini
 * okuyabiliyordu.
 *
 * Artık havuz SAHİBİN kimliğidir:
 *   · Koç      → kendi kimliği
 *   · Öğrenci  → kendisini ekleyen koçun kimliği (programını, görevini
 *                o koç yazıyor; aynı havuzu okumaları gerekiyor)
 *   · Ana koç  → kendi havuzu; diğer havuzları okuma yetkisi Firestore
 *                kurallarındaki rol kaydıyla verilir.
 */
const HAVUZ_YOK = null;

export const havuzKimligi = (kullanici) => {
    if (!kullanici) return HAVUZ_YOK;

    // Öğrenci, kendisini ekleyen koçun havuzunu kullanır
    if (kullanici.role === 'student') {
        const koc = kullanici.coachId ?? kullanici.ownerCoachId ?? kullanici.createdBy;
        return koc ? `koc_${String(koc)}` : HAVUZ_YOK;
    }

    // Koç ve yönetici kendi havuzunda
    const kimlik = kullanici.id ?? kullanici.uid;
    return kimlik ? `koc_${String(kimlik)}` : HAVUZ_YOK;
};

/** Firestore belge kimliği güvenli karakterlere indirgenir. */
const temizle = (s) => String(s).replace(/[^a-zA-Z0-9_]/g, '_');

const keyToDocId = (havuz, key) => `${temizle(havuz)}__${temizle(key)}`;

/**
 * Öğrenci başına açılan dinamik anahtarlar.
 *
 * Eskiden yalnızca program anahtarları senkronlanıyordu; envanter sonuçları,
 * XP/rozet, pomodoro kaydı ve atanan testler cihazda kalıyordu. Sonuç:
 * öğrenci telefonunda test çözüyor, koç panelinde hiçbir şey görünmüyordu.
 * Karne ve veli portalı bu verileri okuduğu için sıfır gösteriyorlardı.
 */
const DYNAMIC_KEY_PATTERNS = [
    /^program_schedule_/,
    /^program_closed_slots_/,
    /^program_meta_/,
    // Program Motoru 2.0 (23.08.2026): koçun program kriterleri ve
    // konu takibi köprüsü. İkisi de kapsam dışıydı — kriterler cihazda
    // kalıyor, konu takibi programı hiç görmüyordu.
    /^program_kriterleri_/,
    /^student_programs_/,
    /^program_.+_(monthly_grid|config)$/,
    /^test_results_/,
    /^test_result_[a-z0-9_]+_/,
    /^assigned_tests_/,
    /**
     * ⚠️ ANAHTAR AYRILIĞI (24.08.2026'da bulundu): yazıcı
     * (GamificationContext) `gamification_<id>` yazar; eski desen yalnız
     * `gamification_stats_` idi — XP/rozet/seri buluta HİÇ gitmiyordu.
     * `gamification_guest` bilerek dışarıda: girişsiz cihaz verisi
     * kimseye ait değildir, buluta taşınmaz.
     */
    /^gamification_(?!guest$)/,
    /^user_stats_/,
    // pomodoro_log_ dardı: pomodoro_<id>_total ve _daily_<tarih> kapsam dışı kalıyordu
    /^pomodoro_/,
    /^tracker_/,
    /^coach_email_/,
    /^self_assessment_/,
    /^completed_topics_/,
    /^student_goals_/,
    // GoalSettingModule 'goals_<id>_*' yazar (student_goals_ değil!) —
    // koç GoalComparisonPanel bu anahtarları okur, kapsamda olmalı
    /^goals_/,
    /^coach_notes_/,
    /**
     * ⚠️ BU DESEN EKSİKTİ. StudentDetailPage koç notunu `koc_notu_<id>`
     * anahtarına yazıyor ama desen listesinde yalnızca `coach_notes_`
     * vardı. Açık `syncKey` çağrısı sayesinde not buluta gidiyordu; ancak
     * TOPLU senkron (`saveToFirebase`) ve ÇIKIŞ TEMİZLİĞİ bu anahtarı
     * atlıyordu — yani not bazen gitmiyor, çıkışta da cihazda kalıyordu.
     */
    /^koc_notu_/,
    /^notebook_/,
    /^calendar_events_/,
    /^ai_plan_(config|schedule)_/,
    /^appt_slots_/,
];

const getDynamicKeys = () => {
    const keys = [];
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!k) continue;
            if (DYNAMIC_KEY_PATTERNS.some((re) => re.test(k))) keys.push(k);
        }
    } catch (e) { }
    return [...new Set(keys)];
};

// 🛰️ Hashing helper to detect actual changes
const getHash = (str) => {
    if (!str) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return hash;
};

// 📦 Compression Helpers for Firestore 1 MiB Quota Bypass
const processFirebaseValue = (fbValue) => {
    if (fbValue && typeof fbValue === 'string' && fbValue.startsWith('LZ64:')) {
        try {
            const decompressed = LZString.decompressFromBase64(fbValue.substring(5));
            return decompressed || fbValue; // Fallback if decompression somehow yields null/empty
        } catch (e) {
            console.warn('Decompression failed for value:', e);
            return fbValue;
        }
    }
    return fbValue;
};

const prepareFirebaseValue = (localValue) => {
    // Compress everything larger than 50,000 chars (~50KB) to safely fit under 1MB
    if (localValue && typeof localValue === 'string' && localValue.length > 50000) {
        return 'LZ64:' + LZString.compressToBase64(localValue);
    }
    return localValue;
};

class FirebaseSync {
    constructor() {
        this.userId = null;
        /** Bu oturumun veri havuzu — `koc_<kimlik>` (bkz. havuzKimligi). */
        this.havuz = null;
        /**
         * Havuzun SAHİBİ olan Firebase kimliği.
         *
         * Firestore kuralları yalnızca `request.auth.uid` görür; havuz adı
         * (`koc_<uygulamaKimligi>`) ise uygulama kimliğinden türüyor. Bu alan
         * ikisini belgede buluşturur ve sahiplik kontrolünü mümkün kılar.
         */
        this.sahipUid = null;
        this.isInitialized = false;
        this.isInitializing = false; // 🛰️ Initializing guard
        this.autoSyncInterval = null;
        this.debounceTimer = null;
        this.isSyncing = false;
        this.realtimeUnsubscribe = null;
        this.lastSyncHashes = new Map(); // key -> hash
        // Demo sürümü açıkken buluta HİÇBİR yazma yapılmaz; aksi hâlde
        // örnek veri kurumun gerçek kaydının üzerine biner.
        this.paused = false;
    }

    /* Demo, bekleyen dinleyiciyi de kapatmalı: bayrak tek başına yazmayı
       durduruyor ama açık kalan onSnapshot kimliksiz oturumda sürekli
       permission-denied üretiyordu. */
    pause() {
        this.paused = true;
        if (this.realtimeUnsubscribe) { this.realtimeUnsubscribe(); this.realtimeUnsubscribe = null; }
    }

    resume() {
        this.paused = false;
        if (this.userId && !this.realtimeUnsubscribe) this.startRealtimeListener();
    }

    /**
     * @param {object|string} kullanici Tam kullanıcı nesnesi (tercih edilen)
     *   ya da geriye dönük uyumluluk için yalnızca kimlik.
     *
     * Nesne geçilmesi gerekir: havuz kimliği artık kullanıcının ROLÜNE ve
     * öğrenciyse BAĞLI OLDUĞU KOÇA göre belirleniyor. Yalnızca kimlik
     * geçilirse koç varsayılır.
     */
    async init(kullanici) {
        if (!kullanici) return;

        const kul = typeof kullanici === 'string'
            ? { id: kullanici, role: 'coach' }
            : kullanici;

        const userId = kul.id ?? kul.uid;
        if (!userId) return;

        const havuz = havuzKimligi(kul);
        if (!havuz) {
            console.warn('🪣 Veri havuzu belirlenemedi (öğrencinin koçu yok?); senkron kapalı.');
            return;
        }

        // 🛰️ Stable identity and initialization check
        if (this.isInitialized && this.userId === userId && this.havuz === havuz) return;
        if (this.isInitializing) return;

        this.userId = userId;
        this.havuz = havuz;
        this.isInitializing = true;
        console.log(`🔌 Initializing Firebase Sync for User: ${userId}`);

        try {
            /**
             * Sahiplik kimliği ÖNCE çözülür — bundan sonraki her yazım
             * belgeye bu damgayı basar ve kural bununla karar verir.
             * Çözülemezse yazma yapılmaz: yanlış havuza yazmaktansa
             * hiç yazmamak doğrudur.
             */
            await authHazir();
            this.sahipUid = await havuzSahibiUid(kul);
            if (!this.sahipUid) {
                console.warn('🔑 Havuz sahibi kimliği çözülemedi; bulut yazımı kapalı (çevrimdışı mod).');
            }

            this.lastSyncHashes.clear();
            
            // 🛡️ Safety: Wrap loadAll in a race to prevent hanging the whole app
            const loadPromise = this.loadAllFromFirebase();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Firebase Load Timeout')), 15000)
            );

            await Promise.race([loadPromise, timeoutPromise]).catch(e => {
                console.warn('Firebase individual load partial failure/timeout:', e.message);
                // We proceed anyway to show the UI
            });

            // Eski belgelerde sahiplik damgası yok; koç kendi havuzunu sahiplenir
            await this.havuzuSahiplen();

            this.startRealtimeListener();
            this.startAutoSync();
            this.isInitialized = true;
            console.log(`✅ Firebase Sync Initialization Complete [${userId}]`);
        } catch (error) {
            console.error('CRITICAL: Firebase Sync init error:', error);
            // Even on error, mark as initialized to prevent infinite retry loops
            this.isInitialized = true; 
        } finally {
            this.isInitializing = false;
        }
    }

    startRealtimeListener() {
        if (this.realtimeUnsubscribe) this.realtimeUnsubscribe();
        if (!this.userId) return;

        try {
            const syncCollection = collection(db, 'syncData');
            const bucketId = this.havuz;
            const q = query(syncCollection, where('bucketId', '==', bucketId));

            this.realtimeUnsubscribe = onSnapshot(q, (snapshot) => {
                let updatedCount = 0;
                snapshot.docChanges().forEach((change) => {
                    const data = change.doc.data();
                    if (!data?.key) return;
                    if (NEVER_SYNC.some(ns => data.key === ns || data.key.startsWith(ns))) return;

                    // 🛡️ Protection: Skip local changes that haven't hit server yet
                    if (change.doc.metadata.hasPendingWrites) return;

                    data.value = processFirebaseValue(data.value);

                    const fbTime = data.updatedAt?.toMillis?.() || 0;
                    const localTime = parseInt(localStorage.getItem(`_fbtime_${data.key}`) || '0');

                    if (change.type === 'added' || change.type === 'modified') {
                        if (data.value !== undefined) {
                            // 🛰️ Strict "Newer-Wins" Check
                            if (fbTime && fbTime < localTime) return;

                            const currentLocal = localStorage.getItem(data.key);
                            if (currentLocal !== data.value) {
                                // 🛡️ Protection: Don't overwrite populated local results with empty or smaller FB data
                                if (PROTECTED_KEYS.includes(data.key)) {
                                    try {
                                        const fbVal = JSON.parse(data.value);
                                        const locVal = JSON.parse(currentLocal);
                                        
                                        if (Array.isArray(fbVal) && Array.isArray(locVal)) {
                                            if (locVal.length > fbVal.length) return;
                                            if (fbVal.length === 0 && locVal.length > 0) return;
                                        }
                                        if (!Array.isArray(fbVal) && typeof fbVal === 'object' && locVal && typeof locVal === 'object') {
                                            if (Object.keys(locVal).length > Object.keys(fbVal).length) return;
                                            if (Object.keys(fbVal).length === 0 && Object.keys(locVal).length > 0) return;
                                        }
                                    } catch (err) { }
                                }

                                // Update local storage and hash track
                                localStorage.setItem(data.key, data.value);
                                if (fbTime) localStorage.setItem(`_fbtime_${data.key}`, String(fbTime));
                                this.lastSyncHashes.set(data.key, getHash(data.value));
                                
                                updatedCount++;
                                
                                // Dispatch event so UI can update
                                window.dispatchEvent(new StorageEvent('storage', { 
                                    key: data.key, 
                                    newValue: data.value, 
                                    oldValue: currentLocal,
                                    isSync: true // 🛰️ Flag for internal sync to avoid recursive loops
                                }));
                            }
                        }
                    } else if (change.type === 'removed') {
                        localStorage.removeItem(data.key);
                        localStorage.removeItem(`_fbtime_${data.key}`);
                        this.lastSyncHashes.delete(data.key);
                        window.dispatchEvent(new StorageEvent('storage', { key: data.key, newValue: null, oldValue: 'exists', isSync: true }));
                        updatedCount++;
                    }
                });
                if (updatedCount > 0) console.log(`📡 Real-time Sync: ${updatedCount} keys updated`);
            }, (e) => {
                /* ⚠️ HATA GERİ ÇAĞRISI EKSİKTİ: kimliksiz oturumda (örn.
                   demo) her sunucu yanıtı "Uncaught Error in snapshot
                   listener: permission-denied" olarak konsola düşüyordu.
                   SDK hata sonrası dinleyiciyi zaten sonlandırır; referans
                   temizlenir ki resume/yeniden başlatma sağlıklı olsun. */
                console.warn('Senkron dinleyicisi durdu:', e?.code || e?.message);
                this.realtimeUnsubscribe = null;
            });
        } catch (e) { console.warn('Real-time listener error:', e.message); }
    }

    async loadAllFromFirebase() {
        if (!this.userId) return;
        try {
            const syncCollection = collection(db, 'syncData');
            const bucketId = this.havuz;
            const q = query(syncCollection, where('bucketId', '==', bucketId));
            const querySnapshot = await getDocs(q);
            
            let updatedCount = 0;
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if (!data?.key || data.value === undefined) return;
                if (NEVER_SYNC.some(ns => data.key === ns || data.key.startsWith(ns))) return;

                data.value = processFirebaseValue(data.value);

                const localVal = localStorage.getItem(data.key);
                const fbTime = data.updatedAt?.toMillis?.() || 0;
                const localTime = parseInt(localStorage.getItem(`_fbtime_${data.key}`) || '0');

                // Initialize hash tracking
                this.lastSyncHashes.set(data.key, getHash(data.value));

                // 🔥 KURAL: Yeni cihaz VEYA Firebase daha yeniyse → Firebase'i al.
                //
                // ⚠️ "Yerel boşsa her koşulda bulutu al" KURALI KALDIRILDI:
                // koç programda Temizle'ye basınca yerel değer bilinçli olarak
                // `{}` olur ve damgalanır; bulut yazımı henüz yetişmeden sayfa
                // yenilenirse eski kural buluttaki ESKİ programı geri
                // getiriyordu ("Temizle çalışmıyor" belirtisi). Boş yerel
                // yalnızca damga bulut kaydından ESKİYSE doldurulur — yani
                // boşluk kasıtlı değil, ilk-açılış artığıysa. 30 sn tolerans,
                // iyimser damganın (+5 sn) sunucu saatiyle farkını karşılar.
                const isEmptyLocal = !localVal || localVal === '[]' || localVal === '{}' || localVal === '""';
                const isFbNewer = fbTime > 0 && fbTime > localTime;
                const isNewDevice = localTime === 0;
                const isFbFresh = fbTime > 0 && fbTime > localTime - 30000;

                if (isNewDevice || isFbNewer || (isEmptyLocal && isFbFresh)) {
                    localStorage.setItem(data.key, data.value);
                    if (fbTime) localStorage.setItem(`_fbtime_${data.key}`, String(fbTime));
                    else localStorage.setItem(`_fbtime_${data.key}`, String(Date.now()));
                    updatedCount++;
                }
            });
            console.log(`☁️ Firebase'den ${updatedCount} anahtar yüklendi.`);
        } catch (e) { console.warn('Load all error:', e.message); }
    }

    /**
     * 🏷️ HAVUZU SAHİPLENME (geriye uyumlu geçiş)
     *
     * Sahiplik alanı sonradan eklendi; mevcut belgelerde yok. Kural
     * sıkılaştırıldığında damgasız belgeler okunamaz hâle gelirdi — yani
     * koçlar bütün verilerini kaybetmiş gibi görürdü.
     *
     * Koç girişte kendi havuzundaki damgasız belgeleri sahiplenir. İşlem
     * tek seferliktir, veriye dokunmaz, yalnızca alan ekler.
     *
     * ⚠️ Yalnızca KOÇ sahiplenir. Öğrenci kendi koçunun havuzunu
     * sahiplenseydi, havuzun sahibi öğrenci olurdu.
     */
    async havuzuSahiplen() {
        if (this.paused) return;
        if (!this.sahipUid || !this.havuz) return;
        if (auth?.currentUser?.uid !== this.sahipUid) return;  // öğrenci ise atla

        try {
            const q = query(collection(db, 'syncData'), where('bucketId', '==', this.havuz));
            const anlik = await getDocs(q);
            let sahiplenilen = 0;

            for (const belge of anlik.docs) {
                if (belge.data()?.sahipUid) continue;           // zaten damgalı
                try {
                    await setDoc(doc(db, 'syncData', belge.id), { sahipUid: this.sahipUid }, { merge: true });
                    sahiplenilen += 1;
                } catch (e) {
                    console.warn(`Belge sahiplenilemedi (${belge.id}):`, e?.code || e?.message);
                }
            }
            if (sahiplenilen > 0) console.log(`🏷️ ${sahiplenilen} belge sahiplenildi.`);
        } catch (e) {
            console.warn('Havuz sahiplenme atlandı:', e?.code || e?.message);
        }
    }

    /**
     * @returns {Promise<true|false|null>}
     *   true  → bulut kaydı yazıldı
     *   false → yazılMALIydı ama yazılamadı (oturum/sahiplik yok ya da
     *           Firestore hatası) — çağıran kullanıcıyı UYARMALI
     *   null  → yazım bilerek atlandı (duraklatılmış, değer yok,
     *           değişmemiş, korumalı) — uyarı gerekmez
     *
     * Eskiden her yol sessizce `undefined` dönüyordu; koç "kaydettim"
     * sanıyor, kayıt buluta hiç gitmemiş olabiliyordu (yenileyince ya da
     * öğrenci tarafında "eski program" belirtisi).
     */
    async writeKeyToFirebase(key, force = false) {
        if (this.paused) return null;
        if (!this.userId) return false;
        /**
         * Sahiplik damgası olmadan yazım YAPILMAZ. Damgasız belge, kural
         * sıkılaştırıldıktan sonra kimsenin okuyamayacağı ölü bir kayıt olur.
         */
        if (!this.sahipUid) return false;
        if (NEVER_SYNC.some(ns => key === ns || key.startsWith(ns))) return null;

        const value = localStorage.getItem(key);
        if (value === null) return null;

        // 🔥 KORUMA: Boş dizilerin veya objelerin (ilk yüklemede oluşan) bulutu silmesini engelle
        if ((value === '[]' || value === '{}' || value === '""') && !force) return null;

        // 🛰️ Change-Detection: Only write if value actually changed from last sync
        const currentHash = getHash(value);
        if (!force && this.lastSyncHashes.get(key) === currentHash) return null;

        try {
            const bucketId = this.havuz;
            const saveValue = prepareFirebaseValue(value);
            await setDoc(doc(db, 'syncData', keyToDocId(this.havuz, key)), {
                key, value: saveValue, updatedAt: serverTimestamp(), updatedBy: this.userId,
                bucketId,
                // Kuralın sahiplik kontrolü yaptığı alan
                sahipUid: this.sahipUid,
            }, { merge: true });
            
            // Update tracking state
            this.lastSyncHashes.set(key, currentHash);
            const optimisticTime = String(Date.now() + 5000);
            localStorage.setItem(`_fbtime_${key}`, optimisticTime);
            return true;
        } catch (e) {
            console.error(`Firebase write error for ${key}:`, e.message);
            // Handle resource-exhausted by backing off if needed (SDK does some itself)
            return false;
        }
    }

    async saveToFirebase() {
        if (this.paused) return;
        if (!this.userId || this.isSyncing) return;
        this.isSyncing = true;
        try {
            const dynamicKeys = getDynamicKeys();
            const allKeys = [...new Set([...SYNC_KEYS, ...dynamicKeys])];
            
            // Use for...of for sequential writes to avoid SDK write-stream exhaustion
            for (const key of allKeys) {
                await this.writeKeyToFirebase(key);
            }
        } catch (e) { }
        this.isSyncing = false;
    }

    async deleteKey(key) {
        if (this.paused) return;
        if (!key || !this.userId) return;
        localStorage.removeItem(key);
        localStorage.removeItem(`_fbtime_${key}`);
        this.lastSyncHashes.delete(key);
        try {
            await deleteDoc(doc(db, 'syncData', keyToDocId(this.havuz, key)));
        } catch (e) { }
    }

    /**
     * 🛰️ FORCE CLOUD RECOVERY
     * Local datayı tamamen ezerek buluttaki veriyi geri getirir.
     */
    async forceCloudRecovery() {
        if (!this.userId || !this.havuz) return { success: false, error: 'Kullanıcı oturumu yok' };
        try {
            /**
             * ⚠️ Bu sorgu eskiden TÜM `syncData` koleksiyonunu okuyordu:
             *     query(collection(db, 'syncData'))
             * Yani "buluttan kurtar" düğmesine basan koç, bütün koçların
             * verisini kendi cihazına indiriyordu. Artık yalnızca kendi
             * havuzu okunuyor.
             */
            const q = query(collection(db, 'syncData'), where('bucketId', '==', this.havuz));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if (!data?.key || data.value === undefined) return;
                
                data.value = processFirebaseValue(data.value);
                
                localStorage.setItem(data.key, data.value);
                const fbTime = data.updatedAt?.toMillis?.() || Date.now();
                localStorage.setItem(`_fbtime_${data.key}`, String(fbTime));
            });
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async syncKey(key) { return this.writeKeyToFirebase(key, true); }

    /**
     * 🔬 TANI — canlı ortamda kimlik zinciri ve veri envanteri
     *
     * SALT OKUNUR. Hiçbir belge yazmaz, silmez, taşımaz.
     *
     * Faz 1'in gerçek kullanıcı verisi üzerinde doğrulanabilmesi için
     * eklendi: kimlik köprüsünün doğru kurulduğu, havuzun doğru açıldığı
     * ve yerel veriyle bulut verisinin örtüştüğü ancak çalışan sistemde
     * ölçülerek kanıtlanabilir.
     *
     * Konsoldan: `await firebaseSync.tani()`
     */
    async tani() {
        const sayim = (metin) => {
            if (metin == null) return null;
            try {
                const v = JSON.parse(metin);
                if (Array.isArray(v)) return v.length;
                if (v && typeof v === 'object') return Object.keys(v).length;
                return 1;
            } catch { return `${metin.length}b`; }
        };

        const rapor = {
            kimlik: {
                firebaseUid: auth?.currentUser?.uid || null,
                epostaTakma: auth?.currentUser?.email || null,
                saglayici: auth?.currentUser?.providerData?.[0]?.providerId || null,
            },
            oturum: {},
            senkron: {
                havuz: this.havuz,
                sahipUid: this.sahipUid,
                baslatildi: this.isInitialized,
                duraklatildi: this.paused,
            },
            sunucuKayitlari: {},
            yerel: {},
            bulut: {},
            karsilastirma: { yalnizcaBulutta: [], yalnizcaYerelde: [], farkli: [] },
            ogrenciler: { toplam: 0, sunucuKimligiOlan: 0, sunucuKimligiOlmayan: [] },
            uyarilar: [],
        };

        // ── Oturum ───────────────────────────────────────────
        try {
            const o = oku('user_session', null);
            rapor.oturum = o ? { id: o.id, uid: o.uid, rol: o.role, ad: o.name, kocId: o.coachId ?? o.ownerCoachId ?? null } : null;
        } catch { rapor.oturum = null; }

        // ── Sunucudaki kimlik kayıtları ──────────────────────
        const uid = rapor.kimlik.firebaseUid;
        if (uid) {
            try {
                const p = await getDoc(doc(db, 'kullaniciProfil', uid));
                rapor.sunucuKayitlari.kullaniciProfil = p.exists() ? p.data() : 'YOK';
            } catch (e) { rapor.sunucuKayitlari.kullaniciProfil = `HATA: ${e.code || e.message}`; }

            const kocId = rapor.oturum?.id;
            if (kocId) {
                try {
                    const dz = await getDoc(doc(db, 'kocDizin', String(kocId).replace(/[^a-zA-Z0-9_-]/g, '_')));
                    rapor.sunucuKayitlari.kocDizin = dz.exists() ? dz.data() : 'YOK';
                } catch (e) { rapor.sunucuKayitlari.kocDizin = `HATA: ${e.code || e.message}`; }
            }
        }

        // ── Yerel envanter ───────────────────────────────────
        const ilgili = [...new Set([...SYNC_KEYS, ...getDynamicKeys()])];
        ilgili.forEach((k) => {
            const v = localStorage.getItem(k);
            if (v != null) rapor.yerel[k] = sayim(v);
        });

        // ── Bulut envanteri ──────────────────────────────────
        if (this.havuz) {
            try {
                const s = await getDocs(query(collection(db, 'syncData'), where('bucketId', '==', this.havuz)));
                s.forEach((d) => {
                    const v = d.data();
                    const deger = processFirebaseValue(v.value);
                    rapor.bulut[v.key || d.id] = {
                        adet: sayim(deger),
                        damgali: Boolean(v.sahipUid),
                        guncelleme: v.updatedAt?.toDate?.()?.toISOString?.()?.slice(0, 16) || null,
                    };
                    if (!v.sahipUid) rapor.uyarilar.push(`DAMGASIZ: ${v.key || d.id}`);
                });
            } catch (e) {
                rapor.uyarilar.push(`Bulut okunamadı: ${e.code || e.message}`);
            }
        }

        // ── Karşılaştırma ────────────────────────────────────
        const yerelAnahtarlar = new Set(Object.keys(rapor.yerel));
        const bulutAnahtarlar = new Set(Object.keys(rapor.bulut));
        bulutAnahtarlar.forEach((k) => { if (!yerelAnahtarlar.has(k)) rapor.karsilastirma.yalnizcaBulutta.push(k); });
        yerelAnahtarlar.forEach((k) => { if (!bulutAnahtarlar.has(k)) rapor.karsilastirma.yalnizcaYerelde.push(k); });
        bulutAnahtarlar.forEach((k) => {
            if (!yerelAnahtarlar.has(k)) return;
            if (rapor.yerel[k] !== rapor.bulut[k].adet) {
                rapor.karsilastirma.farkli.push({ anahtar: k, yerel: rapor.yerel[k], bulut: rapor.bulut[k].adet });
            }
        });

        // ── Öğrencilerin sunucu kimliği var mı? ──────────────
        try {
            const liste = listeOku('coach_students');
            rapor.ogrenciler.toplam = liste.length;
            if (uid) {
                const s = await getDocs(query(collection(db, 'ogrenciKimlik'), where('kocUid', '==', uid)));
                const bagli = new Set(s.docs.map((d) => String(d.data().ogrenciId)));
                liste.forEach((o) => {
                    if (bagli.has(String(o.id))) rapor.ogrenciler.sunucuKimligiOlan += 1;
                    else rapor.ogrenciler.sunucuKimligiOlmayan.push({ ad: o.name, no: o.schoolNumber, id: o.id });
                });
            }
        } catch (e) { rapor.uyarilar.push(`Öğrenci kimlikleri okunamadı: ${e.code || e.message}`); }

        // ── Davetler ve katılım talepleri ────────────────────
        if (uid) {
            rapor.davetler = [];
            rapor.talepler = [];
            try {
                const s = await getDocs(query(collection(db, 'davetler'), where('kocUid', '==', uid)));
                s.forEach((d) => {
                    const v = d.data();
                    rapor.davetler.push({
                        kod: d.id,
                        bagliOgrenciId: v.ogrenciId ?? null,
                        bagliOgrenciAd: v.ogrenciAd ?? null,
                        kullanilan: v.kullanilan,
                        hakki: v.kullanimHakki,
                        aktif: v.aktif,
                        sonZaman: v.sonZaman?.toDate?.()?.toISOString?.()?.slice(0, 16) || null,
                    });
                });
            } catch (e) { rapor.uyarilar.push(`Davetler okunamadı: ${e.code || e.message}`); }

            try {
                const s = await getDocs(query(collection(db, 'katilimTalepleri'), where('kocUid', '==', uid)));
                s.forEach((d) => {
                    const v = d.data();
                    rapor.talepler.push({
                        uid: d.id.slice(0, 10),
                        ad: v.ad,
                        okulNo: v.okulNo,
                        kod: v.kod,
                        durum: v.durum,
                        bagliOgrenciId: v.ogrenciId ?? null,
                        olusturma: v.olusturma?.toDate?.()?.toISOString?.()?.slice(0, 16) || null,
                    });
                });
                if (rapor.talepler.length === 0) {
                    rapor.uyarilar.push('Sunucuda bu koça ait HİÇ katılım talebi yok.');
                }
            } catch (e) { rapor.uyarilar.push(`Talepler okunamadı: ${e.code || e.message}`); }
        }

        // ── Tutarlılık kontrolleri ───────────────────────────
        if (!rapor.kimlik.firebaseUid) rapor.uyarilar.push('KRİTİK: Firebase oturumu yok — bulut yazımı kapalı.');
        if (!rapor.senkron.sahipUid) rapor.uyarilar.push('KRİTİK: sahipUid çözülemedi — bulut yazımı kapalı.');
        if (rapor.oturum?.rol !== 'student' && rapor.kimlik.firebaseUid !== rapor.senkron.sahipUid) {
            rapor.uyarilar.push('KRİTİK: Koç için firebaseUid ile sahipUid eşleşmiyor.');
        }
        if (rapor.sunucuKayitlari.kullaniciProfil === 'YOK') rapor.uyarilar.push('KRİTİK: kullaniciProfil kaydı yok.');
        if (rapor.sunucuKayitlari.kocDizin === 'YOK') rapor.uyarilar.push('UYARI: kocDizin kaydı yok — öğrenciler koçu çözemeyebilir.');
        if (rapor.senkron.havuz && rapor.oturum?.id && rapor.senkron.havuz !== `koc_${rapor.oturum.id}`) {
            rapor.uyarilar.push(`UYARI: havuz (${rapor.senkron.havuz}) oturum kimliğiyle (${rapor.oturum.id}) örtüşmüyor.`);
        }

        console.log('%c🔬 FAZ 1 TANI RAPORU', 'font-weight:bold;font-size:14px');
        console.log(JSON.stringify(rapor, null, 2));
        return rapor;
    }

    debouncedSync() {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.saveToFirebase(), 5000); // 5 sec debounce
    }

    async sync() { await this.saveToFirebase(); }

    startAutoSync() {
        if (this.autoSyncInterval) clearInterval(this.autoSyncInterval);
        this.autoSyncInterval = setInterval(() => this.saveToFirebase(), 120000); // 2 min interval
    }

    /**
     * 🧹 ÇIKIŞTA ÖNBELLEĞİ TEMİZLE
     *
     * ⚠️ ÇIKIŞ YAPMAK VERİYİ CİHAZDA BIRAKIYORDU. `logout` yalnızca
     * `user_session` anahtarını siliyordu; koçun bütün öğrenci listesi,
     * deneme sonuçları, rehberlik dosyaları ve veli bağlantıları
     * localStorage'da duruyordu. Ortak kullanılan bir bilgisayarda
     * ARDINDAN GİREN KULLANICI, önceki kullanıcının verisini görüyordu —
     * kendi verisi buluttan inene kadar, hatta bazı anahtarlarda hiç
     * inmediği için kalıcı olarak.
     *
     * Temizlemeden önce bekleyen değişiklikler buluta gönderilir; aksi
     * hâlde senkronlanmamış bir yazım silinmiş olurdu.
     *
     * Tema, dil, kurulum tercihi gibi kullanıcıya özel olmayan ayarlar
     * KORUNUR — bunlar veri değil, cihaz tercihidir.
     */
    async oturumOnbelleginiTemizle() {
        const KORUNACAK = new Set([
            'theme_mode', 'veri_donemi', 'device_id',
            'pwa_install_dismissed', 'gemini_api_key',
        ]);

        // Bekleyen yazımları önce buluta gönder — veri kaybetmemek için
        try { await this.saveToFirebase(); } catch { /* çevrimdışıysa devam */ }

        try {
            const dinamik = getDynamicKeys();
            const silinecek = [...new Set([...SYNC_KEYS, ...dinamik])]
                .filter((k) => !KORUNACAK.has(k));

            silinecek.forEach((k) => {
                try {
                    localStorage.removeItem(k);
                    localStorage.removeItem(`_fbtime_${k}`);
                } catch { /* ignore */ }
            });
            console.log(`🧹 Çıkış: ${silinecek.length} veri anahtarı cihazdan temizlendi.`);
        } catch (e) {
            console.warn('Oturum önbelleği temizlenemedi:', e?.message);
        }
    }

    destroy() {
        if (this.autoSyncInterval) clearInterval(this.autoSyncInterval);
        if (this.realtimeUnsubscribe) this.realtimeUnsubscribe();
        this.userId = null;
        this.havuz = null;
        // Çıkışta sahiplik kimliği de temizlenmeli; kalırsa bir sonraki
        // kullanıcı önceki kullanıcının havuzuna yazabilir.
        this.sahipUid = null;
        this.lastSyncHashes.clear();
        this.isInitialized = false;
    }
}

const firebaseSync = new FirebaseSync();
if (typeof window !== 'undefined') window.firebaseSync = firebaseSync;
export default firebaseSync;

