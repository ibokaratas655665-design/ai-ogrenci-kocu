/**
 * 📅 AKADEMİK TAKVİM MERKEZİ
 *
 * Ulusal bayramlar sabittir; dinî bayramlar ve eğitim-öğretim takvimi
 * her yıl değişir. Resmî tarihler açıklandığında Ayarlar'dan güncellenir
 * (app_settings.takvim); girilmeyen yıl için buradaki TAHMİNÎ varsayılan
 * kullanılır ve "tahmini" bayrağıyla işaretlenir. Genel Bakış takvimi ve
 * gün-bazlı hesaplar tek kaynağı buradan okur.
 */
import { nesneOku } from './veriDeposu';

/** Sabit ulusal bayramlar (her yıl aynı gün — düzenlenmez). */
export const ULUSAL_BAYRAMLAR = [
    { ay: 1, gun: 1, ad: 'Yılbaşı' },
    { ay: 4, gun: 23, ad: 'Ulusal Egemenlik ve Çocuk Bayramı' },
    { ay: 5, gun: 1, ad: 'Emek ve Dayanışma Günü' },
    { ay: 5, gun: 19, ad: 'Atatürk’ü Anma, Gençlik ve Spor Bayramı' },
    { ay: 7, gun: 15, ad: 'Demokrasi ve Millî Birlik Günü' },
    { ay: 8, gun: 30, ad: 'Zafer Bayramı' },
    { ay: 10, gun: 29, ad: 'Cumhuriyet Bayramı' },
];

/** Dinî bayram varsayılanları (takvim hesabına göre TAHMİNÎ). */
export const DINI_VARSAYILAN = {
    2026: [
        { bas: '2026-03-20', son: '2026-03-22', ad: 'Ramazan Bayramı', tahmini: true },
        { bas: '2026-05-27', son: '2026-05-30', ad: 'Kurban Bayramı', tahmini: true },
    ],
    2027: [
        { bas: '2027-03-10', son: '2027-03-12', ad: 'Ramazan Bayramı', tahmini: true },
        { bas: '2027-05-16', son: '2027-05-19', ad: 'Kurban Bayramı', tahmini: true },
    ],
};

/** Eğitim-öğretim yılı varsayılanları (MEB duyurusuna dek TAHMİNÎ). */
export const OGRETIM_VARSAYILAN = {
    '2026-2027': [
        { bas: '2026-09-07', son: '2026-09-07', ad: 'Okulların açılışı', tur: 'okul', tahmini: true },
        { bas: '2026-11-16', son: '2026-11-20', ad: '1. ara tatil', tur: 'aratatil', tahmini: true },
        { bas: '2027-01-26', son: '2027-02-06', ad: 'Yarıyıl (sömestr) tatili', tur: 'aratatil', tahmini: true },
        { bas: '2027-03-15', son: '2027-03-19', ad: '2. ara tatil', tur: 'aratatil', tahmini: true },
        { bas: '2027-06-19', son: '2027-06-19', ad: 'Karne · yaz tatili başlangıcı', tur: 'okul', tahmini: true },
    ],
};

/** Ayarlar'da yeni yıl/dönem açılırken kullanılan boş şablonlar. */
export const YENI_YIL_SABLONU = [
    { ad: 'Ramazan Bayramı', bas: '', son: '', tahmini: true },
    { ad: 'Kurban Bayramı', bas: '', son: '', tahmini: true },
];
export const YENI_DONEM_SABLONU = [
    { ad: 'Okulların açılışı', tur: 'okul', bas: '', son: '', tahmini: true },
    { ad: '1. ara tatil', tur: 'aratatil', bas: '', son: '', tahmini: true },
    { ad: 'Yarıyıl (sömestr) tatili', tur: 'aratatil', bas: '', son: '', tahmini: true },
    { ad: '2. ara tatil', tur: 'aratatil', bas: '', son: '', tahmini: true },
    { ad: 'Karne · yaz tatili başlangıcı', tur: 'okul', bas: '', son: '', tahmini: true },
];

/** "YYYY-AA-GG" → yerel Date (saat kaymasız). */
export const tarihe = (s) => {
    const [y, a, g] = String(s).split('-').map(Number);
    return new Date(y, (a || 1) - 1, g || 1);
};

/** app_settings.takvim (yoksa boş nesne). */
export const takvimAyarlari = () => {
    try {
        const t = nesneOku('app_settings')?.takvim;
        return t && typeof t === 'object' ? t : {};
    } catch {
        return {};
    }
};

/** Bir yılın dinî bayram listesi (ayar ?? varsayılan). */
export const diniTatiller = (yil) => {
    const dini = takvimAyarlari().dini || {};
    const liste = dini[yil] ?? dini[String(yil)] ?? DINI_VARSAYILAN[yil];
    return Array.isArray(liste) ? liste : [];
};

/** Bir öğretim döneminin takvimi (ayar ?? varsayılan). */
export const ogretimTakvimi = (donem = '2026-2027') => {
    const liste = (takvimAyarlari().ogretim || {})[donem] ?? OGRETIM_VARSAYILAN[donem];
    return Array.isArray(liste) ? liste : [];
};

/**
 * Bir günün takvim bilgisi: ulusal bayram → dinî bayram → öğretim
 * takvimi sırasıyla aranır. Bulunursa {ad, tur, tatil, tahmini},
 * bulunmazsa null.
 */
export function gunBilgisi(tarihStr) {
    if (!tarihStr || typeof tarihStr !== 'string') return null;
    const [y, a, g] = tarihStr.split('-');
    const yil = Number(y), ay = Number(a), gun = Number(g);
    if (!yil || !ay || !gun) return null;

    const ulusal = ULUSAL_BAYRAMLAR.find(b => b.ay === ay && b.gun === gun);
    if (ulusal) return { ad: ulusal.ad, tur: 'ulusal', tatil: true, tahmini: false };

    const zaman = tarihe(tarihStr).getTime();
    for (const bakYil of [yil - 1, yil]) {
        for (const b of diniTatiller(bakYil)) {
            if (zaman >= tarihe(b.bas).getTime() && zaman <= tarihe(b.son).getTime()) {
                return { ad: b.ad, tur: 'dini', tatil: true, tahmini: !!b.tahmini };
            }
        }
    }

    const donemler = (() => {
        const ayarli = takvimAyarlari().ogretim || {};
        return [...new Set([...Object.keys(OGRETIM_VARSAYILAN), ...Object.keys(ayarli)])];
    })();
    for (const donem of donemler) {
        for (const k of ogretimTakvimi(donem)) {
            if (zaman >= tarihe(k.bas).getTime() && zaman <= tarihe(k.son).getTime()) {
                return { ad: k.ad, tur: k.tur, tatil: k.tur === 'aratatil', tahmini: !!k.tahmini };
            }
        }
    }
    return null;
}

/** app_settings.sinav — merkezî sınav tarihleri: { YKS: {2027:'2027-06-19'}, ... } */
export const sinavTarihleri = () => {
    try {
        const s = nesneOku('app_settings')?.sinav;
        return s && typeof s === 'object' ? s : {};
    } catch {
        return {};
    }
};

/** Bir sınav+yıl için tanımlı tarih ("YYYY-AA-GG") ya da null — sistem tarih UYDURMAZ. */
export const sinavTarihi = (sinav, yil) => {
    const s = sinavTarihleri()[sinav] || {};
    return s[yil] ?? s[String(yil)] ?? null;
};

export default {
    ULUSAL_BAYRAMLAR, DINI_VARSAYILAN, OGRETIM_VARSAYILAN,
    YENI_YIL_SABLONU, YENI_DONEM_SABLONU,
    tarihe, takvimAyarlari, diniTatiller, ogretimTakvimi, gunBilgisi,
    sinavTarihleri, sinavTarihi,
};
