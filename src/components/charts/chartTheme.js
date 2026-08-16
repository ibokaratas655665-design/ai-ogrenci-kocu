/**
 * 📈 GRAFİK TEMASI
 *
 * Uygulamadaki grafikler her dosyada ayrı renk ve eksen ayarı kullanıyordu;
 * aynı veri iki ekranda farklı görünüyordu. Bu dosya tek kaynak.
 *
 * Kararlar:
 *  - Kategorik palet birbirinden ayırt edilebilir 8 renkle sınırlı.
 *    Daha fazlası okunabilirliği düşürüyor; 8'i aşan seri "Diğer"e toplanmalı.
 *  - Eksen ve kılavuz çizgileri düşük kontrastta; veri öne çıksın.
 *  - İpucu (tooltip) kutusu her yerde aynı: yuvarlak köşe, yumuşak gölge.
 *  - Koyu ve açık tema için ayrı eksen rengi.
 */

/** Kategorik seri renkleri — sırayla kullanılır. */
export const SERIES = [
    'var(--c1)', // lacivert  — marka
    'var(--c2)', // turkuaz
    'var(--c3)', // amber
    'var(--c4)', // mor
    'var(--c5)', // pembe
    'var(--ok)', // yesil
    'var(--danger)', // kirmizi
    'var(--info)', // mavi
];

export const seriesColor = (i) => SERIES[i % SERIES.length];

/** Değer temelli renk: iyi → orta → kötü */
export const scaleColor = (percent, invert = false) => {
    const p = invert ? 100 - (percent ?? 0) : (percent ?? 0);
    if (p >= 70) return 'var(--ok)';
    if (p >= 40) return 'var(--warn)';
    return 'var(--danger)';
};

/** Koyu tema (koç + öğrenci paneli) */
export const darkAxis = {
    tick: { fontSize: 11, fill: 'var(--ink-3)' },
    axisLine: false,
    tickLine: false,
};

export const darkGrid = {
    strokeDasharray: '3 3',
    stroke: 'var(--line)',
    vertical: false,
};

export const darkTooltip = {
    contentStyle: {
        borderRadius: 14,
        border: '1px solid var(--line-2)',
        background: 'var(--surface)',
        fontSize: 12,
        color: 'var(--ink)',
        boxShadow: 'var(--sh-2)',
    },
    labelStyle: { color: 'var(--ink-3)', fontWeight: 800, fontSize: 11 },
    cursor: { fill: 'var(--surface-3)' },
};

/** Açık tema (veli portalı + PDF) */
export const lightAxis = {
    tick: { fontSize: 11, fill: 'var(--ink-3)' },
    axisLine: false,
    tickLine: false,
};

export const lightGrid = {
    strokeDasharray: '3 3',
    stroke: 'var(--line)',
    vertical: false,
};

export const lightTooltip = {
    contentStyle: {
        borderRadius: 14,
        border: '1px solid var(--line-2)',
        background: 'var(--surface)',
        fontSize: 12,
        color: 'var(--ink)',
        boxShadow: 'var(--sh-2)',
    },
    labelStyle: { color: 'var(--ink-3)', fontWeight: 800, fontSize: 11 },
    cursor: { fill: 'var(--surface-3)' },
};

/** Tek çağrıyla tema seti */
export const chartTheme = (mode = 'dark') =>
    mode === 'light'
        ? { axis: lightAxis, grid: lightGrid, tooltip: lightTooltip, series: SERIES }
        : { axis: darkAxis, grid: darkGrid, tooltip: darkTooltip, series: SERIES };

/**
 * Çizgi grafiklerde alan dolgusu için degrade tanımı üretir.
 * <defs>{areaGradient('net', 'var(--brand)')}</defs> şeklinde kullanılır.
 */
export const gradientId = (key) => `grad-${key}`;

export default { SERIES, seriesColor, scaleColor, chartTheme, gradientId };
