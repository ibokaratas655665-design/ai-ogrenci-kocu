/**
 * 👨‍👩‍👧 VELİ PORTALI BAĞLANTISI
 *
 * ⚠️ NEDEN VAR:
 *
 * Veli portalı tasarımı gereği oturum istemez — veli, WhatsApp'a gelen
 * bağlantıya tıklayıp çocuğunun raporunu görür. Bu doğru bir tercih;
 * veliye ayrı şifre vermek pratikte kimsenin kullanmadığı bir adım olur.
 *
 * Ama bağlantı `#/veli/5` biçimindeydi. Öğrenci kimlikleri 1, 2, 3 diye
 * sıralı olduğu için adres satırına sırayla sayı yazan biri BÜTÜN
 * öğrencilerin deneme sonuçlarını, çalışma verisini ve koç notlarını
 * okuyabiliyordu. Tahmin etmek bile gerekmiyordu, saymak yetiyordu.
 *
 * Çözüm: bağlantıdaki kimlik artık öğrenci numarası değil, 128 bitlik
 * rastgele bir belirteç. Tahmin edilemez, tek tek denemekle bulunamaz.
 * Bağlantı sızarsa koç tek tuşla yenileyebilir — eskisi anında ölür.
 *
 * Bu "yetki taşıyan adres" (capability URL) yöntemidir: bağlantıyı bilen
 * görebilir. Veliye şifre sormadığımız için güvenlik tamamen bağlantının
 * gizliliğine dayanır; o yüzden belirteç uzun, yenilenebilir ve iptal
 * edilebilir olmak zorunda.
 */

const KEY = 'parent_links';

// ══════════════════════════════════════════════════════════════
//  DEPO
// ══════════════════════════════════════════════════════════════

const oku = () => {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw || !raw.trim()) return {};
        const v = JSON.parse(raw);
        return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
    } catch {
        return {};
    }
};

const yaz = (depo) => {
    localStorage.setItem(KEY, JSON.stringify(depo));
    try { window.dispatchEvent(new StorageEvent('storage', { key: KEY })); } catch { /* ignore */ }
    try { window.firebaseSync?.syncKey?.(KEY); } catch { /* senkron yoksa sorun değil */ }
};

// ══════════════════════════════════════════════════════════════
//  BELİRTEÇ ÜRETİMİ
// ══════════════════════════════════════════════════════════════

/**
 * 16 bayt (128 bit) rastgelelik, base64url ile 22 karaktere iner.
 *
 * `Math.random()` KULLANILMAZ: tahmin edilebilir bir üreteçtir ve
 * bu belirteç tek güvenlik katmanımız.
 */
const belirtecUret = () => {
    const bayt = new Uint8Array(16);
    const kripto = globalThis.crypto || globalThis.msCrypto;
    if (!kripto?.getRandomValues) {
        // Tarayıcı WebCrypto sunmuyorsa tahmin edilebilir bir belirteç
        // üretip güvendeymiş gibi davranmaktansa açıkça hata veririz.
        throw new Error('Bu tarayıcı güvenli bağlantı üretemiyor (WebCrypto yok).');
    }
    kripto.getRandomValues(bayt);
    let ikili = '';
    bayt.forEach((b) => { ikili += String.fromCharCode(b); });
    return btoa(ikili).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

// ══════════════════════════════════════════════════════════════
//  OKUMA
// ══════════════════════════════════════════════════════════════

/** Öğrencinin yürürlükteki belirteci (yoksa null). */
export const mevcutBelirtec = (ogrenciId) => {
    const depo = oku();
    const kayit = Object.entries(depo).find(
        ([, v]) => String(v.ogrenciId) === String(ogrenciId) && !v.iptal
    );
    return kayit ? kayit[0] : null;
};

/**
 * Belirteci öğrenciye çevirir. Portal bunu kullanır.
 * @returns {{ogrenciId:string}|null}  Geçersiz/iptal edilmişse null
 */
export const cozumle = (belirtec) => {
    if (!belirtec) return null;
    const kayit = oku()[belirtec];
    if (!kayit || kayit.iptal) return null;
    return { ogrenciId: kayit.ogrenciId, olusturma: kayit.olusturma };
};

/** Bağlantı adresi biçiminde döner. */
export const baglantiAdresi = (belirtec) => {
    if (!belirtec) return null;
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}#/veli/${belirtec}`;
};

// ══════════════════════════════════════════════════════════════
//  YAZMA
// ══════════════════════════════════════════════════════════════

/**
 * Öğrencinin veli bağlantısını verir; yoksa üretir.
 * Aynı öğrenci için tekrar tekrar çağrılabilir, hep aynı bağlantıyı
 * döndürür — koç her paylaşımda yeni bağlantı üretip velinin elindeki
 * eskisini bozmasın diye.
 */
export const baglantiAl = (ogrenciId) => {
    if (ogrenciId == null || ogrenciId === '') return null;
    const varolan = mevcutBelirtec(ogrenciId);
    if (varolan) return varolan;

    const belirtec = belirtecUret();
    const depo = oku();
    depo[belirtec] = {
        ogrenciId: String(ogrenciId),
        olusturma: new Date().toISOString(),
        iptal: false,
    };
    yaz(depo);
    return belirtec;
};

/**
 * Bağlantıyı yeniler: eski belirteç iptal edilir, yenisi üretilir.
 * Bağlantı yanlış kişiye gittiyse koçun elindeki tek çare budur.
 */
export const yenile = (ogrenciId) => {
    const depo = oku();
    Object.keys(depo).forEach((b) => {
        if (String(depo[b].ogrenciId) === String(ogrenciId)) {
            depo[b] = { ...depo[b], iptal: true, iptalTarihi: new Date().toISOString() };
        }
    });
    const belirtec = belirtecUret();
    depo[belirtec] = {
        ogrenciId: String(ogrenciId),
        olusturma: new Date().toISOString(),
        iptal: false,
    };
    yaz(depo);
    return belirtec;
};

/** Öğrencinin veli erişimini tamamen kapatır (yenisi üretilmez). */
export const iptalEt = (ogrenciId) => {
    const depo = oku();
    let sayi = 0;
    Object.keys(depo).forEach((b) => {
        if (String(depo[b].ogrenciId) === String(ogrenciId) && !depo[b].iptal) {
            depo[b] = { ...depo[b], iptal: true, iptalTarihi: new Date().toISOString() };
            sayi += 1;
        }
    });
    if (sayi) yaz(depo);
    return sayi;
};

export default {
    baglantiAl, yenile, iptalEt, cozumle, mevcutBelirtec, baglantiAdresi,
};
