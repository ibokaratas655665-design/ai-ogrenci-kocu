import {
    doc, getDoc, setDoc, collection, getDocs, onSnapshot, serverTimestamp, deleteDoc,
    query, where
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import LZString from 'lz-string';

const SYNC_KEYS = [
    'coach_students', 'users_db', 'student_tasks', 'exams_data', 'trials_data',
    'v2_trials_data', 'v2_results_data', 'v2_obp_data', 'student_messages', 'coach_messages',
    'student_programs', 'student_guidance_results', 'module_permissions',
    'app_settings', 'student_feature_approvals', 'student_groups',
    'user_notifications',   // bildirim paneli (services/notificationService)
    'student_projects', 'pdr_cases', 'presentations', 'remote_sessions',
    'leaderboard_data', 'managed_coaches', 'custom_curriculum', 'exam_resources',
    'whatsapp_custom_templates', 'whatsapp_settings', 'whatsapp_message_log',
    'error_notebook', 'program_progress', 'study_log', 'bep_data',
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

const havuzKimligi = (kullanici) => {
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
    /^program_.+_(monthly_grid|config)$/,
    /^test_results_/,
    /^test_result_[a-z0-9_]+_/,
    /^assigned_tests_/,
    /^gamification_stats_/,
    /^user_stats_/,
    /^pomodoro_log_/,
    /^completed_topics_/,
    /^student_goals_/,
    /^coach_notes_/,
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

    pause() { this.paused = true; }

    resume() { this.paused = false; }

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

                // 🔥 KURAL: Eğer yerel veri boşsa ([], {}, null) VEYA Firebase daha yeniyse → Firebase'i al
                const isEmptyLocal = !localVal || localVal === '[]' || localVal === '{}' || localVal === '""';
                const isFbNewer = fbTime > 0 && fbTime > localTime;
                const isNewDevice = localTime === 0;
                
                if (isEmptyLocal || isNewDevice || isFbNewer) {
                    localStorage.setItem(data.key, data.value);
                    if (fbTime) localStorage.setItem(`_fbtime_${data.key}`, String(fbTime));
                    else localStorage.setItem(`_fbtime_${data.key}`, String(Date.now()));
                    updatedCount++;
                }
            });
            console.log(`☁️ Firebase'den ${updatedCount} anahtar yüklendi.`);
        } catch (e) { console.warn('Load all error:', e.message); }
    }

    async writeKeyToFirebase(key, force = false) {
        if (this.paused) return;
        if (!this.userId) return;
        if (NEVER_SYNC.some(ns => key === ns || key.startsWith(ns))) return;
        
        const value = localStorage.getItem(key);
        if (value === null) return;
        
        // 🔥 KORUMA: Boş dizilerin veya objelerin (ilk yüklemede oluşan) bulutu silmesini engelle
        if ((value === '[]' || value === '{}' || value === '""') && !force) return;

        // 🛰️ Change-Detection: Only write if value actually changed from last sync
        const currentHash = getHash(value);
        if (!force && this.lastSyncHashes.get(key) === currentHash) return;

        try {
            const bucketId = this.havuz;
            const saveValue = prepareFirebaseValue(value);
            await setDoc(doc(db, 'syncData', keyToDocId(this.havuz, key)), {
                key, value: saveValue, updatedAt: serverTimestamp(), updatedBy: this.userId, bucketId: bucketId
            }, { merge: true });
            
            // Update tracking state
            this.lastSyncHashes.set(key, currentHash);
            const optimisticTime = String(Date.now() + 5000);
            localStorage.setItem(`_fbtime_${key}`, optimisticTime);
        } catch (e) {
            console.error(`Firebase write error for ${key}:`, e.message);
            // Handle resource-exhausted by backing off if needed (SDK does some itself)
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

    async syncKey(key) { await this.writeKeyToFirebase(key, true); }

    debouncedSync() {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.saveToFirebase(), 5000); // 5 sec debounce
    }

    async sync() { await this.saveToFirebase(); }

    startAutoSync() {
        if (this.autoSyncInterval) clearInterval(this.autoSyncInterval);
        this.autoSyncInterval = setInterval(() => this.saveToFirebase(), 120000); // 2 min interval
    }

    destroy() {
        if (this.autoSyncInterval) clearInterval(this.autoSyncInterval);
        if (this.realtimeUnsubscribe) this.realtimeUnsubscribe();
        this.userId = null;
        this.isInitialized = false;
    }
}

const firebaseSync = new FirebaseSync();
if (typeof window !== 'undefined') window.firebaseSync = firebaseSync;
export default firebaseSync;

