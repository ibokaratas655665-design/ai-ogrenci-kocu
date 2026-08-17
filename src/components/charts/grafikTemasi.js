/**
 * 📊 GRAFİK TEMASI — tek görsel dil
 *
 * Denetimde 23 dosyada 156 grafik bulundu; her biri kendi rengini,
 * ızgarasını ve ipucunu tanımlıyordu:
 *
 *   · Izgara çizgileri SABİT kodlanmıştı (#e5e7eb, #f3f4f6, #f0f0f0,
 *     #d1d5db) — karanlık temada ya kayboluyor ya da zeminden daha
 *     parlak kalıyordu.
 *   · 52 ızgara ve 51 efsaneye karşılık yalnızca 34 ipucu vardı: grafik
 *     süsleniyor ama okunmasına yardım edilmiyordu.
 *   · 117 `ResponsiveContainer` vardı ama yükseklikler sabitti
 *     (280/300/350/400) — telefonda grafik eziliyordu.
 *   · Recharts'ın varsayılan animasyonu 1500 ms; sayfa ağır açılıyordu.
 *
 * Kural: seri renkleri tasarım dizgesinin `--c1..--c5` belirteçlerinden
 * gelir. Bunlar hem açık hem koyu temada kontrast doğrulanmıştır ve
 * grafik dolgusu kadar efsane YAZISI olarak da okunur.
 */

/** CSS değişkenini gerçek renge çevirir (Recharts SVG'ye doğrudan var() veremez). */
export const renkOku = (ad, yedek = '#64748b') => {
    if (typeof window === 'undefined') return yedek;
    const v = getComputedStyle(document.documentElement).getPropertyValue(ad);
    return (v && v.trim()) || yedek;
};

/** Kategorik seri paleti — 5 ayırt edilebilir ton, sırayla kullanılır. */
export const SERI_RENKLERI = () => [
    renkOku('--c1', '#1E3A8A'),
    renkOku('--c2', '#0F766E'),
    renkOku('--c3', '#B45309'),
    renkOku('--c4', '#7C3AED'),
    renkOku('--c5', '#BE185D'),
];

/** Anlam taşıyan renkler — iyi/kötü göstermek için. Seri paletinden AYRI. */
export const ANLAM_RENKLERI = () => ({
    iyi: renkOku('--ok', '#15803D'),
    uyari: renkOku('--warn', '#B45309'),
    kotu: renkOku('--danger', '#B91C1C'),
    bilgi: renkOku('--info', '#1D4ED8'),
    notr: renkOku('--ink-3', '#5B6779'),
});

/**
 * Eksen ve ızgara varsayılanları.
 *
 * Izgara YALNIZCA yatay: dikey çizgiler zaman serisinde bilgi taşımıyor,
 * yalnızca gürültü ekliyordu. Çizgi temadan gelir, kesikli ve soluktur —
 * veriyi değil zemini tarif etmelidir.
 */
export const izgaraOzellikleri = () => ({
    stroke: renkOku('--line', '#E2E8F0'),
    strokeDasharray: '3 3',
    vertical: false,
});

export const eksenOzellikleri = () => ({
    stroke: 'transparent',
    tick: { fill: renkOku('--ink-3', '#5B6779'), fontSize: 11 },
    tickLine: false,
    axisLine: false,
});

/**
 * Animasyon: kısa ve tek seferlik.
 * Recharts varsayılanı 1500 ms — veri yenilendiğinde grafik uzun süre
 * "yürüyor" ve sayfa yavaş hissettiriyordu.
 */
export const ANIMASYON = 300;

/** Kullanıcı hareketi azaltmak istiyorsa animasyon tamamen kapanır. */
export const animasyonAcik = () => {
    if (typeof window === 'undefined') return false;
    return !window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
};

/** Sayı biçimi — grafik etiketlerinde ve özetlerde aynı olsun. */
export const sayiBicim = (v, basamak = 1) => {
    if (v == null || Number.isNaN(Number(v))) return '—';
    const n = Number(v);
    return Number.isInteger(n) ? String(n) : n.toFixed(basamak);
};

/**
 * İki uçtan değişim özeti. Yorum ÜRETMEZ; yalnızca ölçer.
 * "Harika gidiyorsun" gibi cümleler veriye dayanmadığı için burada yok.
 */
export const degisimOzeti = (dizi = []) => {
    const sayilar = dizi.filter((v) => typeof v === 'number' && !Number.isNaN(v));
    if (sayilar.length < 2) return null;
    const ilk = sayilar[0];
    const son = sayilar[sayilar.length - 1];
    const fark = son - ilk;
    const yuzde = ilk !== 0 ? (fark / Math.abs(ilk)) * 100 : null;
    return {
        ilk, son, fark,
        yuzde,
        yon: fark > 0 ? 'artis' : fark < 0 ? 'azalis' : 'sabit',
    };
};

export default {
    renkOku, SERI_RENKLERI, ANLAM_RENKLERI,
    izgaraOzellikleri, eksenOzellikleri,
    ANIMASYON, animasyonAcik, sayiBicim, degisimOzeti,
};
