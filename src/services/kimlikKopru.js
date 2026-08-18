/**
 * 🔗 KİMLİK KÖPRÜSÜ
 *
 * ═════════════════════════════════════════════════════════════════
 * ÇÖZDÜĞÜ PROBLEM
 * ═════════════════════════════════════════════════════════════════
 *
 * Uygulamada İKİ AYRI KİMLİK yaşıyor ve birbirlerini tanımıyorlar:
 *
 *   · Uygulama kimliği : `coach_<zaman>` — kayıt sırasında üretilir,
 *                        `users_db` içinde tutulur, veri havuzunun adını
 *                        belirler (`syncData/koc_<kocId>__<anahtar>`).
 *   · Firebase kimliği : `request.auth.uid` — Firestore kurallarının
 *                        gördüğü TEK kimlik.
 *
 * Oturum nesnesindeki `uid` alanı yanıltıcıdır: `hybridAuth` onu
 * `localCoach.id` ile dolduruyor, yani orada da uygulama kimliği var.
 *
 * Sonuç: kural yazarken karşılaştıracak bir şey yok. "Bu belge bu
 * kullanıcıya mı ait?" sorusunun sunucuda cevabı olmadığı için
 * `syncData` kuralı `girisYapmis()` demekten öteye gidemedi — yani
 * kimliği doğrulanmış HERKES bütün koçların verisini okuyabiliyor.
 *
 * Bu modül eksik halkayı kurar: girişten sonra iki kimliği eşleyen
 * kayıtları SUNUCUYA yazar. Kurallar artık sahipliği doğrulayabilir.
 *
 * ═════════════════════════════════════════════════════════════════
 * VERİ MODELİ
 * ═════════════════════════════════════════════════════════════════
 *
 *   kullaniciProfil/{firebaseUid}
 *     rol     'coach' | 'student' | 'admin'
 *     kocUid  Verinin sahibi koçun FIREBASE kimliği
 *             · koç  → kendi uid'i
 *             · öğrenci → bağlı olduğu koçun uid'i
 *     kocId   Uygulama içi koç kimliği (havuz adını çözmek için)
 *     ad      Görüntüleme amaçlı
 *
 *     ⚠️ ÖĞRENCİNİN `kocUid` ALANI KENDİ BEYANINA BIRAKILAMAZ.
 *     Bırakılsaydı, öğrenci profiline başka bir koçun uid'ini yazıp
 *     o koçun bütün veri havuzunu okuyabilirdi. Kural bu alanı
 *     `ogrenciKimlik/{uid}` kaydından doğrular — o kaydı yalnızca
 *     koç yazabilir.
 *
 *   kocDizin/{uygulamaKocId}
 *     kocUid  Uygulama kimliğinden Firebase kimliğine çeviri
 *
 *     Öğrenci kaydı yalnızca `coachId` (uygulama kimliği) taşıyor;
 *     havuzun sahibinin Firebase kimliğini bulmak için bu dizin gerekli.
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

const PROFIL = 'kullaniciProfil';
const DIZIN = 'kocDizin';

/** Firestore belge kimliği güvenli karakterlere indirgenir. */
const temizle = (s) => String(s ?? '').replace(/[^a-zA-Z0-9_-]/g, '_');

/**
 * Koçun kimlik kayıtlarını yazar.
 *
 * İki kayıt birden: kendi profili ve uygulama kimliği → Firebase
 * kimliği çevirisi. İkincisi olmadan koçun öğrencileri havuzun
 * sahibini bulamaz.
 *
 * @param {object} kullanici Oturum nesnesi ({ id, name, role })
 * @param {string} uid       Firebase kimliği
 */
export const kocKimligiYaz = async (kullanici, uid) => {
    if (!uid || !kullanici?.id) return { basarili: false, hata: 'Kimlik eksik.' };
    const kocId = String(kullanici.id);

    try {
        await setDoc(doc(db, PROFIL, uid), {
            rol: kullanici.role === 'admin' ? 'admin' : 'coach',
            kocUid: uid,               // koç kendi havuzunun sahibidir
            kocId,
            ad: kullanici.name || '',
            guncelleme: serverTimestamp(),
        }, { merge: true });

        await setDoc(doc(db, DIZIN, temizle(kocId)), {
            kocUid: uid,
            ad: kullanici.name || '',
            guncelleme: serverTimestamp(),
        }, { merge: true });

        return { basarili: true };
    } catch (e) {
        console.warn('Koç kimlik kaydı yazılamadı:', e?.code || e?.message);
        return { basarili: false, hata: e?.code || e?.message };
    }
};

/**
 * Öğrencinin kimlik kaydını yazar.
 *
 * `kocUid` uydurulamaz: kural `ogrenciKimlik/{uid}` kaydıyla karşılaştırır.
 * Bu yüzden yazma yalnızca koçu tarafından onaylanmış öğrencide başarılı olur.
 *
 * @param {string} uid    Öğrencinin Firebase kimliği
 * @param {string} kocUid Koçun Firebase kimliği (ogrenciKimlik'ten gelir)
 * @param {string} kocId  Koçun uygulama kimliği
 */
export const ogrenciKimligiYaz = async (uid, kocUid, kocId, ad = '') => {
    if (!uid || !kocUid) return { basarili: false, hata: 'Kimlik eksik.' };
    try {
        await setDoc(doc(db, PROFIL, uid), {
            rol: 'student',
            kocUid: String(kocUid),
            kocId: String(kocId ?? ''),
            ad,
            guncelleme: serverTimestamp(),
        }, { merge: true });
        return { basarili: true };
    } catch (e) {
        /**
         * Reddedilme normal bir durum olabilir: koçun elle eklediği,
         * henüz sunucu kimliği olmayan öğrencide `ogrenciKimlik` kaydı
         * yoktur. Uygulama çevrimdışı çalışmaya devam eder.
         */
        console.warn('Öğrenci kimlik kaydı yazılamadı:', e?.code || e?.message);
        return { basarili: false, hata: e?.code || e?.message };
    }
};

/** Uygulama koç kimliğinden Firebase kimliğini çözer. */
export const kocUidCoz = async (uygulamaKocId) => {
    if (!uygulamaKocId) return null;
    try {
        const snap = await getDoc(doc(db, DIZIN, temizle(uygulamaKocId)));
        return snap.exists() ? (snap.data().kocUid || null) : null;
    } catch {
        return null;
    }
};

/** Kullanıcının kendi profili. */
export const profilOku = async (uid) => {
    if (!uid) return null;
    try {
        const snap = await getDoc(doc(db, PROFIL, uid));
        return snap.exists() ? { uid, ...snap.data() } : null;
    } catch {
        return null;
    }
};

/**
 * Oturumdaki kullanıcının veri havuzunun SAHİBİ olan Firebase kimliği.
 *
 * `firebaseSync` bunu her yazımda belgeye damgalar; kural da bununla
 * karşılaştırır. Bulunamazsa senkron kapatılır — yanlış havuza yazmaktansa
 * hiç yazmamak doğrudur.
 *
 * @param {object} kullanici Oturum nesnesi
 * @returns {Promise<string|null>}
 */
export const havuzSahibiUid = async (kullanici) => {
    const uid = auth?.currentUser?.uid || null;
    if (!kullanici || !uid) return null;

    // Koç ve yönetici kendi havuzunun sahibidir
    if (kullanici.role !== 'student') return uid;

    // Öğrenci: önce sunucudaki kendi profili
    const profil = await profilOku(uid);
    if (profil?.kocUid) return profil.kocUid;

    // Profil henüz yazılmamışsa uygulama kimliğinden dizine bak
    const kocId = kullanici.coachId ?? kullanici.ownerCoachId ?? kullanici.createdBy;
    if (kocId) return await kocUidCoz(kocId);

    return null;
};

export default {
    kocKimligiYaz, ogrenciKimligiYaz, kocUidCoz, profilOku, havuzSahibiUid,
};
