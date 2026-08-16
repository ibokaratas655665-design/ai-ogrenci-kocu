/**
 * 🎨 PROGRAM RENK SİSTEMİ
 *
 * Neden Tailwind sınıfı değil de hex?
 *  - Tailwind JIT, çalışma anında üretilen sınıf adlarını (`bg-${x}-100`) purge eder.
 *    Eski SUBJECT_COLORS haritasında olmayan her ders gri kalıyordu.
 *  - html2canvas ile PDF alırken inline stiller birebir korunur, sınıf tabanlı
 *    renklerde bazı tarayıcılarda kayıp yaşanıyor.
 *
 * Buradaki her fonksiyon { bg, border, text, accent } döner — doğrudan
 * style prop'una verilebilir.
 */

// ════════════════════════════════════════════════════════════
//  Aktivite tipleri (ders dışı program öğeleri)
// ════════════════════════════════════════════════════════════

export const ACTIVITY_TYPES = {
    konu: {
        id: 'konu',
        label: 'Konu Çalışması',
        short: 'KONU',
        icon: '📘',
        color: null,           // ders rengini kullanır
        description: 'Yeni konu anlatımı / öğrenme',
    },
    soru: {
        id: 'soru',
        label: 'Soru Çözümü',
        short: 'SORU',
        icon: '✏️',
        color: null,           // ders rengini kullanır (koyu tonda)
        description: 'Öğrenilen konunun soru pratiği',
    },
    tekrar: {
        id: 'tekrar',
        label: 'Ders Tekrarı',
        short: 'TEKRAR',
        icon: '🔁',
        color: { bg: '#FFF4E5', border: '#F5A524', text: '#7A4A00', accent: '#F5A524' },
        description: 'Aralıklı tekrar — daha önce işlenen konunun gözden geçirilmesi',
    },
    deneme: {
        id: 'deneme',
        label: 'Deneme Sınavı',
        short: 'DENEME',
        icon: '📝',
        color: { bg: '#FDE7EA', border: '#BE123C', text: '#7F1027', accent: '#BE123C' },
        description: 'Tam veya branş denemesi',
    },
    analiz: {
        id: 'analiz',
        label: 'Deneme Analizi',
        short: 'ANALİZ',
        icon: '🔍',
        // Fuşya: hiçbir ders bu tonu kullanmıyor.
        // (Önceki mor ton Fizik ile birebir aynıydı, ayırt edilemiyordu.)
        color: { bg: '#FAE8FF', border: '#A21CAF', text: '#701A75', accent: '#A21CAF' },
        description: 'Yanlış analizi + hata defterine işleme',
    },
    paragraf: {
        id: 'paragraf',
        label: 'Paragraf',
        short: 'PARAGRAF',
        icon: '📄',
        color: { bg: '#E0F2FE', border: '#0284C7', text: '#075985', accent: '#0284C7' },
        description: 'Günlük paragraf çözümü (okuduğunu anlama refleksi)',
    },
    kitap: {
        id: 'kitap',
        label: 'Kitap Okuma',
        short: 'KİTAP',
        icon: '📚',
        color: { bg: '#DCFCE7', border: '#16A34A', text: '#14532D', accent: '#16A34A' },
        description: 'Serbest okuma — kelime dağarcığı ve okuma hızı',
    },
    mola: {
        id: 'mola',
        label: 'Esnek / Telafi',
        short: 'ESNEK',
        icon: '🫧',
        color: { bg: '#F1F5F9', border: '#94A3B8', text: '#475569', accent: '#94A3B8' },
        description: 'Yetişemeyenleri tamamlama veya dinlenme payı',
    },
};

export const ACTIVITY_ORDER = ['konu', 'soru', 'tekrar', 'deneme', 'analiz', 'paragraf', 'kitap', 'mola'];

/** Ders gerektirmeyen, tek başına programa eklenebilen aktiviteler. */
export const STANDALONE_ACTIVITIES = ['tekrar', 'deneme', 'analiz', 'paragraf', 'kitap', 'mola'];

// ════════════════════════════════════════════════════════════
//  Ders renkleri
// ════════════════════════════════════════════════════════════

/** Bilinen derslerin sabit renkleri — yıllardır alışılmış eşleşmeler korundu. */
const NAMED_SUBJECT_COLORS = {
    matematik: { bg: '#DBEAFE', border: '#1D4ED8', text: '#1E3A8A', accent: '#1D4ED8' },
    geometri: { bg: '#DBEAFE', border: '#1D4ED8', text: '#1E3A8A', accent: '#1D4ED8' },
    fizik: { bg: '#EDE9FE', border: '#6D28D9', text: '#3F1D8C', accent: '#6D28D9' },
    kimya: { bg: '#D1FAE5', border: '#047857', text: '#064E3B', accent: '#047857' },
    biyoloji: { bg: '#CCFBF1', border: '#0F766E', text: '#134E4A', accent: '#0F766E' },
    fen: { bg: '#EDE9FE', border: '#6D28D9', text: '#3F1D8C', accent: '#6D28D9' },

    turkce: { bg: '#FEE2E2', border: '#B91C1C', text: '#7F1D1D', accent: '#B91C1C' },
    edebiyat: { bg: '#FFE4E6', border: '#BE123C', text: '#881337', accent: '#BE123C' },
    dilbilgisi: { bg: '#FECACA', border: '#B91C1C', text: '#7F1D1D', accent: '#B91C1C' },

    tarih: { bg: '#FEF3C7', border: '#B45309', text: '#78350F', accent: '#B45309' },
    inkilap: { bg: '#FFEDD5', border: '#C2410C', text: '#7C2D12', accent: '#C2410C' },
    cografya: { bg: '#FEF9C3', border: '#A16207', text: '#713F12', accent: '#A16207' },
    felsefe: { bg: '#E0E7FF', border: '#4F46E5', text: '#312E81', accent: '#4F46E5' },
    mantik: { bg: '#EEF2FF', border: '#4F46E5', text: '#312E81', accent: '#4F46E5' },
    psikoloji: { bg: '#FCE7F3', border: '#BE185D', text: '#831843', accent: '#BE185D' },
    sosyoloji: { bg: '#FFE4E6', border: '#9F1239', text: '#881337', accent: '#9F1239' },
    din: { bg: '#ECFCCB', border: '#4D7C0F', text: '#365314', accent: '#4D7C0F' },

    ingilizce: { bg: '#E0F2FE', border: '#0369A1', text: '#0C4A6E', accent: '#0369A1' },
    almanca: { bg: '#F3E8FF', border: '#9333EA', text: '#581C87', accent: '#9333EA' },

    vatandaslik: { bg: '#CFFAFE', border: '#0E7490', text: '#164E63', accent: '#0E7490' },
    egitim: { bg: '#E0F2FE', border: '#0EA5E9', text: '#0C4A6E', accent: '#0EA5E9' },
    mevzuat: { bg: '#F1F5F9', border: '#64748B', text: '#334155', accent: '#64748B' },
    genel: { bg: '#F1F5F9', border: '#64748B', text: '#334155', accent: '#64748B' },
};

/**
 * Bilinmeyen dersler için yedek palet.
 * Renkler tonlama açısından birbirinden ayrılabilir seçildi; ders adının
 * hash'i ile eşlenir, böylece aynı ders her açılışta aynı rengi alır.
 */
const FALLBACK_PALETTE = [
    { bg: '#FCE7F3', border: '#BE185D', text: '#831843', accent: '#BE185D' },
    { bg: '#E0E7FF', border: '#4338CA', text: '#312E81', accent: '#4338CA' },
    { bg: '#D1FAE5', border: '#047857', text: '#064E3B', accent: '#047857' },
    { bg: '#FEF3C7', border: '#B45309', text: '#78350F', accent: '#B45309' },
    { bg: '#F3E8FF', border: '#7E22CE', text: '#581C87', accent: '#7E22CE' },
    { bg: '#CFFAFE', border: '#0E7490', text: '#164E63', accent: '#0E7490' },
    { bg: '#FFE4E6', border: '#BE123C', text: '#881337', accent: '#BE123C' },
    { bg: '#ECFCCB', border: '#4D7C0F', text: '#365314', accent: '#4D7C0F' },
    { bg: '#FFEDD5', border: '#C2410C', text: '#7C2D12', accent: '#C2410C' },
    { bg: '#E2E8F0', border: '#475569', text: '#1E293B', accent: '#475569' },
];

/**
 * Müfredat verisindeki anahtarlar ASCII (Turkce, Cografya, Ingilizce...).
 * Ekranda ve PDF'te bunların düzgün Türkçe yazımı gösterilir.
 */
const DISPLAY_NAMES = {
    turkce: 'Türkçe',
    cografya: 'Coğrafya',
    ingilizce: 'İngilizce',
    inkilap: 'İnkılap Tarihi',
    mantik: 'Mantık',
    psikoloji: 'Psikoloji',
    sosyoloji: 'Sosyoloji',
    din: 'Din Kültürü',
    vatandaslik: 'Vatandaşlık',
    egitim: 'Eğitim Bilimleri',
    fen: 'Fen Bilimleri',
    mat: 'Matematik',
    sosyal: 'Sosyal Bilimler',
};

/** Bir ders adının ekranda gösterilecek halini döner. */
export const getSubjectLabel = (subject) => {
    const key = normalizeKey(subject);
    return DISPLAY_NAMES[key] || subject || '';
};

/** Türkçe karakterleri sadeleştirip anahtar üretir. */
const normalizeKey = (name = '') =>
    String(name)
        .toLocaleLowerCase('tr-TR')
        .replace(/ı/g, 'i').replace(/İ/g, 'i')
        .replace(/ş/g, 's').replace(/ğ/g, 'g')
        .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '');

const hashString = (str) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = (h << 5) - h + str.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
};

/**
 * Bir dersin renk setini döner. Bilinmeyen ders adları da
 * kendine özgü, tutarlı bir renk alır — hiçbir ders "gri" kalmaz.
 */
export const getSubjectColor = (subject) => {
    const key = normalizeKey(subject);
    if (!key) return NAMED_SUBJECT_COLORS.genel;

    if (NAMED_SUBJECT_COLORS[key]) return NAMED_SUBJECT_COLORS[key];

    // "TYT Matematik", "Matematik-1" gibi varyantları yakala
    const partial = Object.keys(NAMED_SUBJECT_COLORS).find(
        (k) => k.length > 3 && (key.includes(k) || k.includes(key))
    );
    if (partial) return NAMED_SUBJECT_COLORS[partial];

    return FALLBACK_PALETTE[hashString(key) % FALLBACK_PALETTE.length];
};

/**
 * Bir program hücresinin nihai rengini belirler.
 *
 * - Ders dışı aktiviteler (deneme, kitap, paragraf...) kendi sabit rengini kullanır.
 * - "Soru çözümü" dersin rengini alır ama daha koyu kenarlıkla ayrışır.
 * - Diğer her şey dersin rengidir.
 */
/**
 * Hücre bir ders mi, yoksa program bloğu mu (deneme, tekrar, kitap...)?
 * Program blokları ızgarada daha belirgin kenarlıkla çizilir; böylece
 * renk tonları yakın düşse bile ikisi karışmaz.
 */
export const isActivityBlock = (cell) => Boolean(ACTIVITY_TYPES[cell?.type]?.color);

export const getCellColor = (cell) => {
    if (!cell) return null;

    const type = cell.type || 'konu';
    const activity = ACTIVITY_TYPES[type];

    if (activity?.color) return activity.color;

    const base = getSubjectColor(cell.subject);
    if (type === 'soru') {
        // Soru çözümü: aynı ders ailesi, daha doygun görünüm
        return { ...base, bg: mix(base.bg, base.accent, 0.18) };
    }
    return base;
};

/** İki hex rengi oranla karıştırır (0 = a, 1 = b). */
function mix(a, b, ratio) {
    const pa = hexToRgb(a);
    const pb = hexToRgb(b);
    if (!pa || !pb) return a;
    const c = (k) => Math.round(pa[k] + (pb[k] - pa[k]) * ratio);
    return `#${[c('r'), c('g'), c('b')].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex).trim());
    if (!m) return null;
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

/** Programda kullanılan tüm dersler + aktiviteler için lejant verisi. */
export const buildLegend = (schedule = {}) => {
    const subjects = new Map();
    const activities = new Map();

    for (const cell of Object.values(schedule)) {
        if (!cell) continue;
        const type = cell.type || 'konu';
        if (ACTIVITY_TYPES[type]?.color) {
            if (!activities.has(type)) {
                activities.set(type, {
                    key: type,
                    label: ACTIVITY_TYPES[type].label,
                    icon: ACTIVITY_TYPES[type].icon,
                    color: ACTIVITY_TYPES[type].color,
                    count: 0,
                });
            }
            activities.get(type).count++;
        } else if (cell.subject) {
            if (!subjects.has(cell.subject)) {
                subjects.set(cell.subject, {
                    key: cell.subject,
                    label: getSubjectLabel(cell.subject),
                    color: getSubjectColor(cell.subject),
                    count: 0,
                });
            }
            subjects.get(cell.subject).count++;
        }
    }

    return {
        subjects: [...subjects.values()].sort((a, b) => b.count - a.count),
        activities: [...activities.values()].sort(
            (a, b) => ACTIVITY_ORDER.indexOf(a.key) - ACTIVITY_ORDER.indexOf(b.key)
        ),
    };
};

export default {
    ACTIVITY_TYPES,
    getSubjectLabel,
    ACTIVITY_ORDER,
    STANDALONE_ACTIVITIES,
    getSubjectColor,
    getCellColor,
    isActivityBlock,
    buildLegend,
};
