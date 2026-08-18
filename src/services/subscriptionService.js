/**
 * 📦 ABONELİK VE PAKET DURUMU
 *
 * Paket seçimi, deneme süresi ve öğrenci limitinin GERÇEKTEN
 * uygulandığı katman. Eskiden paketler yalnızca giriş ekranında
 * gösterilen bir liste idi; hiçbir yerde bir sınır uygulanmıyordu.
 *
 * Kayıt her koç için ayrı tutulur:
 *   { planId, baslangic, bitis, deneme, kuponKodu, indirim, odenen }
 *
 * ⚠️ Bu katman tahsilat yapmaz. Ödeme sağlayıcı bağlanana kadar paket
 * ataması "beklemede" olarak işaretlenir ve ana koç tarafından
 * onaylanır; böylece ödeme yapılmadan tam erişim açılmaz.
 */

import { planBul, sezonBilgisi, DENEME_GUN } from '../data/pricingPlans';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { nesneOku, yaz as depoYaz } from './veriDeposu';

const KEY = 'coach_subscriptions';

const oku = () => nesneOku(KEY);

/**
 * Yazma `veriDeposu` üzerinden: yerel kayıt, storage olayı ve bulut
 * senkronu orada bir kez çözülüyor. Burada yalnızca bu servise özel
 * `subscription-updated` olayı kalıyor.
 */
const yaz = (depo) => {
    depoYaz(KEY, depo);
    try { window.dispatchEvent(new Event('subscription-updated')); } catch { /* eski tarayıcı */ }
};

const bugun = () => new Date().toISOString().slice(0, 10);

const gunEkle = (gun) => {
    const d = new Date();
    d.setDate(d.getDate() + gun);
    return d.toISOString().slice(0, 10);
};

// ══════════════════════════════════════════════════════════════
//  SUNUCU KAYNAĞI — paketin DOĞRULUK KAYNAĞI burasıdır
//
//  ⚠️ `abonelikler/{kocUid}` belgesi Firestore kurallarında koça SALT
//  OKUNUR yapılmıştı (koç kendi paketini yükseltemesin diye), ama
//  UYGULAMA BU BELGEYİ HİÇ OKUMUYORDU. Bütün paket/kontenjan kararı
//  yerel `coach_subscriptions` anahtarından veriliyordu.
//
//  Ölçülerek kanıtlandı: koç konsoldan
//      localStorage.setItem('coach_subscriptions',
//          JSON.stringify({ [kocId]: { planId: 'rehberlik', durum: 'aktif' } }))
//  yazdığında `ogrenciEklenebilir(kocId, 500)` → { izin: true, limit: null }
//  dönüyordu. Yani sunucudaki koruma vardı ama BAĞLI DEĞİLDİ.
//
//  Artık kritik karar sunucudan okunur. Sunucuda kayıt yoksa ücretsiz
//  kademe uygulanır — yerel kayıt ne yazarsa yazsın yükseltme sayılmaz.
// ══════════════════════════════════════════════════════════════

/** Sunucudaki abonelik belgesi. Yoksa (ya da okunamazsa) null. */
export const sunucuAboneligiOku = async (kocUid) => {
    if (!kocUid) return null;
    try {
        const snap = await getDoc(doc(db, 'abonelikler', String(kocUid)));
        return snap.exists() ? snap.data() : null;
    } catch {
        // Yetki reddi ya da ağ yok: paket YÜKSELTİLMİŞ sayılmaz.
        return null;
    }
};

/**
 * Öğrenci limiti kontrolü — SUNUCU ESASLI.
 *
 * Yerel kayıt yalnızca gösterim/çevrimdışı içindir; limit kararında
 * sunucudaki belge esastır. Belge yoksa ücretsiz kademe uygulanır.
 *
 * ⚠️ Bu bir istemci kontrolüdür ve DevTools ile aşılabilir. Gerçek
 * zorlama için sunucu tarafı gerekir (Firestore kuralları kayıt
 * SAYAMADIĞI için sayaç + Cloud Function şart — Blaze planı).
 * Buradaki kazanç: localStorage kurcalayarak limit aşmak artık işe
 * yaramıyor.
 *
 * @returns {Promise<{izin:boolean, limit:number|null, mevcut:number, mesaj:string|null, kaynak:string}>}
 */
export const ogrenciEklenebilirGuvenli = async (kocId, mevcutSayi) => {
    // Kimlik oturumdan okunur; parametre olarak alınsaydı çağıran
    // başka bir koçun uid'ini vererek onun paketini kullanabilirdi.
    const kocUid = auth?.currentUser?.uid || null;
    const sunucu = await sunucuAboneligiOku(kocUid);

    let plan;
    let kaynak;
    if (sunucu && sunucu.durum === 'aktif') {
        const gecerli = !sunucu.bitis || sunucu.bitis >= bugun();
        plan = planBul(gecerli ? sunucu.planId : 'ucretsiz');
        kaynak = gecerli ? 'sunucu' : 'sunucu-suresi-dolmus';
    } else {
        plan = planBul('ucretsiz');
        kaynak = sunucu ? 'sunucu-pasif' : 'sunucu-kayit-yok';
    }

    const limit = plan.ogrenciLimiti;
    if (limit == null) return { izin: true, limit: null, mevcut: mevcutSayi, mesaj: null, kaynak };
    if (mevcutSayi < limit) return { izin: true, limit, mevcut: mevcutSayi, mesaj: null, kaynak };

    return {
        izin: false,
        limit,
        mevcut: mevcutSayi,
        mesaj: `${plan.ad} paketi ${limit} öğrenci ile sınırlı. `
            + 'Daha fazlası için paketinizi yükseltin.',
        kaynak,
    };
};

/**
 * Yönetici paketi onaylarken sunucuya da yazar.
 * Kural gereği yalnızca yönetici uid'i başarılı olur; koç çağırırsa
 * sessizce reddedilir ve yerel kayıt tek başına yetki vermez.
 */
export const sunucuAboneligiYaz = async (kocUid, kayit) => {
    if (!kocUid) return { basarili: false, hata: 'kocUid yok' };
    try {
        await setDoc(doc(db, 'abonelikler', String(kocUid)), kayit, { merge: true });
        return { basarili: true };
    } catch (e) {
        return { basarili: false, hata: e?.code || e?.message };
    }
};

// ══════════════════════════════════════════════════════════════
//  OKUMA
// ══════════════════════════════════════════════════════════════

/**
 * Koçun abonelik kaydı. Kaydı yoksa ücretsiz kademe döner —
 * hiçbir koç "paketsiz" kalıp sistemden kilitlenmez.
 */
export const abonelik = (kocId) => {
    const kayit = oku()[String(kocId)];
    if (!kayit) {
        return {
            planId: 'ucretsiz',
            baslangic: null,
            bitis: null,
            deneme: false,
            durum: 'aktif',
            varsayilan: true,
        };
    }
    return kayit;
};

/** Abonelik hâlâ geçerli mi? */
export const gecerliMi = (kocId) => {
    const a = abonelik(kocId);
    if (a.planId === 'ucretsiz') return true;      // süresiz
    if (a.durum !== 'aktif') return false;
    if (!a.bitis) return true;
    return a.bitis >= bugun();
};

/** Kalan gün (ücretsiz pakette null). */
export const kalanGun = (kocId) => {
    const a = abonelik(kocId);
    if (!a.bitis) return null;
    const fark = Math.ceil((new Date(`${a.bitis}T23:59:59`) - new Date()) / 86400000);
    return Math.max(0, fark);
};

/**
 * Yürürlükteki plan. Süresi dolmuşsa ücretsiz kademeye düşer —
 * koç verisini kaybetmez ama yeni öğrenci ekleyemez.
 */
export const yururluktekiPlan = (kocId) => {
    const a = abonelik(kocId);
    return gecerliMi(kocId) ? planBul(a.planId) : planBul('ucretsiz');
};

/**
 * Öğrenci limiti kontrolü.
 * @returns {{izin:boolean, limit:number|null, mevcut:number, mesaj:string|null}}
 */
export const ogrenciEklenebilir = (kocId, mevcutSayi) => {
    const plan = yururluktekiPlan(kocId);
    const limit = plan.ogrenciLimiti;

    if (limit == null) return { izin: true, limit: null, mevcut: mevcutSayi, mesaj: null };
    if (mevcutSayi < limit) return { izin: true, limit, mevcut: mevcutSayi, mesaj: null };

    return {
        izin: false,
        limit,
        mevcut: mevcutSayi,
        mesaj: `${plan.ad} paketi ${limit} öğrenci ile sınırlı. `
            + 'Daha fazlası için paketinizi yükseltin.',
    };
};

// ══════════════════════════════════════════════════════════════
//  YAZMA
// ══════════════════════════════════════════════════════════════

/**
 * Ücretsiz deneme başlatır. Bir koç bir kez deneme alabilir.
 * @returns {{basarili:boolean, mesaj:string}}
 */
export const denemeBaslat = (kocId, planId = 'koc10') => {
    const depo = oku();
    const anahtar = String(kocId);

    if (depo[anahtar]?.denemeKullanildi) {
        return { basarili: false, mesaj: 'Deneme hakkınızı daha önce kullandınız.' };
    }

    depo[anahtar] = {
        planId,
        baslangic: bugun(),
        bitis: gunEkle(DENEME_GUN),
        deneme: true,
        denemeKullanildi: true,
        durum: 'aktif',
        odenen: 0,
        guncelleme: new Date().toISOString(),
    };
    yaz(depo);
    return { basarili: true, mesaj: `${DENEME_GUN} günlük ücretsiz deneme başladı.` };
};

/**
 * Paket talebi oluşturur. Ödeme sağlayıcı bağlanana kadar kayıt
 * `beklemede` durumundadır; ana koç onaylayınca aktifleşir.
 */
export const paketTalepEt = (kocId, { planId, kuponKodu = null, indirim = 0, odenecek = 0 }) => {
    const depo = oku();
    const anahtar = String(kocId);
    const sezon = sezonBilgisi();
    const onceki = depo[anahtar] || {};

    depo[anahtar] = {
        ...onceki,
        planId,
        baslangic: bugun(),
        bitis: sezon.bitis,
        sezon: sezon.etiket,
        deneme: false,
        durum: 'beklemede',
        kuponKodu,
        indirim,
        odenen: 0,
        tutar: odenecek,
        talepTarihi: new Date().toISOString(),
    };
    yaz(depo);
    return depo[anahtar];
};

/** Ana koç ödemeyi doğrulayıp paketi aktifleştirir. */
export const paketOnayla = (kocId, onaylayan = null) => {
    const depo = oku();
    const anahtar = String(kocId);
    if (!depo[anahtar]) return false;

    depo[anahtar] = {
        ...depo[anahtar],
        durum: 'aktif',
        odenen: depo[anahtar].tutar ?? 0,
        onaylayan: onaylayan?.name || onaylayan?.id || null,
        onayTarihi: new Date().toISOString(),
    };
    yaz(depo);
    return true;
};

export const paketIptal = (kocId) => {
    const depo = oku();
    const anahtar = String(kocId);
    if (!depo[anahtar]) return false;
    depo[anahtar] = { ...depo[anahtar], durum: 'iptal', iptalTarihi: new Date().toISOString() };
    yaz(depo);
    return true;
};

/** Onay bekleyen paket talepleri — ana koç ekranı için. */
export const bekleyenTalepler = () =>
    Object.entries(oku())
        .filter(([, v]) => v.durum === 'beklemede')
        .map(([kocId, v]) => ({ kocId, ...v }));

export default {
    abonelik, gecerliMi, kalanGun, yururluktekiPlan, ogrenciEklenebilir,
    denemeBaslat, paketTalepEt, paketOnayla, paketIptal, bekleyenTalepler,
    // Sunucu esaslı — kontenjan kararı bunlarla verilir
    sunucuAboneligiOku, ogrenciEklenebilirGuvenli, sunucuAboneligiYaz,
};
