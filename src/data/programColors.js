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
 *
 * TEK KAYNAK: ders → renk eşlemesi YALNIZCA burada yapılır. Hiçbir
 * bileşen kendi rengini üretmez; hepsi `getSubjectColor`/`getCellColor`
 * çağırır. Böylece aynı ders koç programında, öğrenci programında ve
 * Bugün ekranında aynı renktedir.
 */

import { DERS_ADLARI } from './examTopics';

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
        // Koyu vişne: hiçbir ders bu tonu kullanmıyor (Edebiyat #BE123C ile çakışıyordu)
        color: { bg: '#FDE7EA', border: '#9D174D', text: '#7F1027', accent: '#9D174D' },
        description: 'Tam veya branş denemesi',
    },
    analiz: {
        id: 'analiz',
        label: 'Deneme Analizi',
        short: 'ANALİZ',
        icon: '🔍',
        // Fuşya: hiçbir ders bu tonu kullanmıyor.
        // (Önceki mor ton Fizik ile birebir aynıydı, ayırt edilemiyordu.)
        // Koyu kehribar: Kelime Bilgisi #A21CAF ile çakışıyordu
        color: { bg: '#FEF3C7', border: '#92400E', text: '#78350F', accent: '#92400E' },
        description: 'Yanlış analizi + hata defterine işleme',
    },
    paragraf: {
        id: 'paragraf',
        label: 'Paragraf',
        short: 'PARAGRAF',
        icon: '📄',
        // Koyu gök: Muhasebe #0284C7 ile çakışıyordu
        color: { bg: '#E0F2FE', border: '#075985', text: '#0C4A6E', accent: '#075985' },
        description: 'Günlük paragraf çözümü (okuduğunu anlama refleksi)',
    },
    kitap: {
        id: 'kitap',
        label: 'Kitap Okuma',
        short: 'KİTAP',
        icon: '📚',
        // Koyu orman: Güncel Bilgiler #16A34A ile çakışıyordu
        color: { bg: '#DCFCE7', border: '#166534', text: '#14532D', accent: '#166534' },
        description: 'Serbest okuma — kelime dağarcığı ve okuma hızı',
    },
    problem: {
        id: 'problem',
        label: 'Problemler',
        short: 'PROBLEM',
        icon: '🧮',
        // Kahverengi-turuncu: hiçbir ders/aktivite bu tonu kullanmıyor,
        // Matematik'in mavisinden bilerek ayrık (Paragraf da Türkçe'nin
        // kırmızısından ayrık — ekstra bloklar ders renginden bağımsız).
        color: { bg: '#FFF7ED', border: '#7C2D12', text: '#431407', accent: '#7C2D12' },
        description: 'Günlük problem/işlem pratiği (Matematik ağırlıklı)',
    },
    mola: {
        id: 'mola',
        label: 'Esnek / Telafi',
        short: 'ESNEK',
        icon: '🫧',
        // Kurşun: Genel #94A3B8 ile çakışıyordu
        color: { bg: '#F1F5F9', border: '#475569', text: '#334155', accent: '#475569' },
        description: 'Yetişemeyenleri tamamlama veya dinlenme payı',
    },
};

export const ACTIVITY_ORDER = ['konu', 'soru', 'tekrar', 'deneme', 'analiz', 'paragraf', 'problem', 'kitap', 'mola'];

/** Ders gerektirmeyen, tek başına programa eklenebilen aktiviteler. */
export const STANDALONE_ACTIVITIES = ['tekrar', 'deneme', 'analiz', 'paragraf', 'problem', 'kitap', 'mola'];

// ════════════════════════════════════════════════════════════
//  Ders renkleri
// ════════════════════════════════════════════════════════════

/**
 * ══════════════════════════════════════════════════════════════
 *  DERS → RENK: TEK KAYNAK, ÇAKIŞMASIZ
 * ══════════════════════════════════════════════════════════════
 *
 * KESİN KURAL: iki farklı ders aynı rengi ALMAZ. Renk günden güne,
 * haftadan haftaya, kutudan kutuya değişmez — ders neyse rengi odur.
 *
 * ⚠️ NEDEN YENİDEN YAZILDI
 * Eski harita ölçüldüğünde 37 dersin yalnızca 17 farklı renk aldığı,
 * 10 çakışma grubu oluştuğu görüldü. En kötüsü tek bir pembe tonunu
 * altı ders paylaşıyordu (Fen, Kamu Yönetimi, Gelişim, Öğrenme, Ölçme,
 * Okuma). Ayrıca Matematik ile Geometri birebir aynı maviydi; oysa
 * program ızgarasında bu ikisinin ayırt edilmesi şart.
 *
 * İkinci kusur: arama GÖRÜNEN ADLA yapılıyordu ("Fen Bilimleri") ama
 * harita KISA KİMLİKLE yazılmıştı ("fen"); eşleşmeyen dersler yedek
 * palete düşüyor ve orada da birbirleriyle çakışıyordu. Artık her ders
 * hem kimliğiyle hem görünen adıyla aranabiliyor (bkz. AD_KIMLIK).
 *
 * Renkler ton ailesine göre gruplandı — sayısal dersler soğuk, sözel
 * dersler sıcak taraftan — ama her birinin `accent` değeri benzersiz.
 */
const NAMED_SUBJECT_COLORS = {
    /* ── Sayısal: mavi–mor–yeşil ailesi ─────────────────────── */
    matematik:  { bg: '#DBEAFE', border: '#1D4ED8', text: '#1E3A8A', accent: '#1D4ED8' }, // mavi
    geometri:   { bg: '#FEF08A', border: '#A16207', text: '#713F12', accent: '#CA8A04' }, // sarı
    fizik:      { bg: '#EDE9FE', border: '#6D28D9', text: '#3F1D8C', accent: '#6D28D9' }, // mor
    kimya:      { bg: '#D1FAE5', border: '#047857', text: '#064E3B', accent: '#047857' }, // yeşil
    biyoloji:   { bg: '#CCFBF1', border: '#0F766E', text: '#134E4A', accent: '#0F766E' }, // turkuaz
    fen:        { bg: '#DDD6FE', border: '#7C3AED', text: '#4C1D95', accent: '#7C3AED' }, // açık mor
    istatistik: { bg: '#CFFAFE', border: '#0891B2', text: '#164E63', accent: '#0891B2' }, // camgöbeği

    /* ── Sözel: kırmızı–pembe ailesi ─────────────────────────── */
    turkce:     { bg: '#FEE2E2', border: '#B91C1C', text: '#7F1D1D', accent: '#B91C1C' }, // kırmızı
    edebiyat:   { bg: '#FFE4E6', border: '#BE123C', text: '#881337', accent: '#BE123C' }, // gül
    dilbilgisi: { bg: '#FECDD3', border: '#9F1239', text: '#881337', accent: '#9F1239' }, // koyu gül
    okuma:      { bg: '#FCE7F3', border: '#DB2777', text: '#831843', accent: '#DB2777' }, // pembe
    kelime:     { bg: '#FBCFE8', border: '#A21CAF', text: '#701A75', accent: '#A21CAF' }, // fuşya
    ceviri:     { bg: '#F5D0FE', border: '#86198F', text: '#701A75', accent: '#86198F' }, // erguvan
    iletisim:   { bg: '#FAE8FF', border: '#C026D3', text: '#701A75', accent: '#C026D3' }, // orkide
    ingilizce:  { bg: '#E0F2FE', border: '#0369A1', text: '#0C4A6E', accent: '#0369A1' }, // gök
    almanca:    { bg: '#F3E8FF', border: '#9333EA', text: '#581C87', accent: '#9333EA' }, // menekşe

    /* ── Sosyal: turuncu–amber ailesi ────────────────────────── */
    tarih:      { bg: '#FEF3C7', border: '#B45309', text: '#78350F', accent: '#B45309' }, // amber
    inkilap:    { bg: '#FFEDD5', border: '#C2410C', text: '#7C2D12', accent: '#C2410C' }, // turuncu
    cografya:   { bg: '#FEF9C3', border: '#A16207', text: '#713F12', accent: '#A16207' }, // hardal
    sosyal:     { bg: '#FFE8CC', border: '#EA580C', text: '#7C2D12', accent: '#EA580C' }, // koyu turuncu
    felsefe:    { bg: '#E0E7FF', border: '#4F46E5', text: '#312E81', accent: '#4F46E5' }, // indigo
    mantik:     { bg: '#EEF2FF', border: '#6366F1', text: '#312E81', accent: '#6366F1' }, // açık indigo
    psikoloji:  { bg: '#FCE7F3', border: '#BE185D', text: '#831843', accent: '#BE185D' }, // magenta
    sosyoloji:  { bg: '#FFE4E6', border: '#E11D48', text: '#881337', accent: '#E11D48' }, // canlı gül
    din:        { bg: '#ECFCCB', border: '#4D7C0F', text: '#365314', accent: '#4D7C0F' }, // fıstık
    guncel:     { bg: '#F0FDF4', border: '#16A34A', text: '#14532D', accent: '#16A34A' }, // taze yeşil

    /* ── KPSS / AGS alan dersleri ────────────────────────────── */
    vatandaslik:          { bg: '#CFFAFE', border: '#0E7490', text: '#164E63', accent: '#0E7490' },
    mevzuat:              { bg: '#F1F5F9', border: '#64748B', text: '#334155', accent: '#64748B' },
    hukuk:                { bg: '#E2E8F0', border: '#334155', text: '#1E293B', accent: '#334155' },
    iktisat:              { bg: '#DCFCE7', border: '#15803D', text: '#14532D', accent: '#15803D' },
    isletme:              { bg: '#FEF2F2', border: '#DC2626', text: '#7F1D1D', accent: '#DC2626' },
    maliye:               { bg: '#FFF7ED', border: '#EA580C', text: '#7C2D12', accent: '#F97316' },
    muhasebe:             { bg: '#F0F9FF', border: '#0284C7', text: '#0C4A6E', accent: '#0284C7' },
    ceko:                 { bg: '#FDF4FF', border: '#A855F7', text: '#581C87', accent: '#A855F7' },
    kamuYonetimi:         { bg: '#EFF6FF', border: '#2563EB', text: '#1E3A8A', accent: '#2563EB' },
    uluslararasiIliskiler:{ bg: '#F0FDFA', border: '#0D9488', text: '#134E4A', accent: '#0D9488' },

    /* ── Eğitim Bilimleri ────────────────────────────────────── */
    gelisim:    { bg: '#FFF1F2', border: '#F43F5E', text: '#881337', accent: '#F43F5E' },
    ogrenme:    { bg: '#F5F3FF', border: '#8B5CF6', text: '#4C1D95', accent: '#8B5CF6' },
    ogretim:    { bg: '#ECFEFF', border: '#06B6D4', text: '#164E63', accent: '#06B6D4' },
    olcme:      { bg: '#FFFBEB', border: '#D97706', text: '#78350F', accent: '#D97706' },
    rehberlik:  { bg: '#F7FEE7', border: '#65A30D', text: '#365314', accent: '#65A30D' },
    egitim:     { bg: '#E0F2FE', border: '#0EA5E9', text: '#0C4A6E', accent: '#0EA5E9' },

    /* ── Genel / bilinmeyen ──────────────────────────────────── */
    genel:      { bg: '#F8FAFC', border: '#94A3B8', text: '#334155', accent: '#94A3B8' },
};

/**
 * GÖRÜNEN AD → KİMLİK köprüsü.
 *
 * Program hücresinde `subject` ders KİMLİĞİ değil GÖRÜNEN ADIDIR
 * ("Fen Bilimleri", "Türk Dili ve Edebiyatı"). Harita ise kimlikle
 * yazılı. Bu köprü olmadan çoğu ders eşleşmiyor ve yedek palete
 * düşüyordu — çakışmaların asıl kaynağı buydu.
 *
 * `DERS_ADLARI` katalogdan gelir; burada tersine çevrilir.
 */
let _adKimlik = null;
const adKimlikHaritasi = () => {
    // Tembel kurulur: `normalizeKey` bu satırdan SONRA tanımlı olduğu
    // için modül yüklenirken çağrılamaz.
    if (_adKimlik) return _adKimlik;
    _adKimlik = {};
    for (const [kimlik, ad] of Object.entries(DERS_ADLARI || {})) {
        _adKimlik[normalizeKey(ad)] = kimlik;
    }
    return _adKimlik;
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

    /* 1) Doğrudan kimlik ("matematik") */
    if (NAMED_SUBJECT_COLORS[key]) return NAMED_SUBJECT_COLORS[key];

    /* 2) Görünen ad → kimlik ("fenbilimleri" → "fen").
          Program hücresi görünen adı taşıdığı için ASIL yol budur;
          eskiden bu adım yoktu ve dersler yedek palete düşüyordu. */
    const kimlik = adKimlikHaritasi()[key];
    if (kimlik && NAMED_SUBJECT_COLORS[kimlik]) return NAMED_SUBJECT_COLORS[kimlik];

    /* 3) "TYT Matematik", "Matematik-1" gibi varyantlar.
          En UZUN eşleşme seçilir: "fen" ile "felsefe" arasında
          kısa olanın kazanması yanlış renk üretiyordu. */
    let enIyi = null;
    for (const k of Object.keys(NAMED_SUBJECT_COLORS)) {
        if (k.length <= 3) continue;
        if (key.includes(k) && (!enIyi || k.length > enIyi.length)) enIyi = k;
    }
    if (enIyi) return NAMED_SUBJECT_COLORS[enIyi];

    /* 4) Katalogda olmayan ders — yedek palet. Hash kararlıdır, aynı ad
          her açılışta aynı rengi alır. */
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

    /**
     * ⚠️ 25.08.2026: 'tekrar' tipi İKİ farklı şeyi karıştırıyordu.
     *
     *  1) "Günün Tekrarı" — gün sonu genel provası, `subject` sabit bir
     *     metin ("Günün Tekrarı"), `round: 0`. Bunun kendi sabit rengi
     *     doğrudur (bir derse ait değil).
     *  2) Bir KONUNUN aralıklı tekrarı (örn. Türkçe/Sözcükte Anlam'ın
     *     +7. gün provası) — `subject` GERÇEK ders adı, `round` pozitif
     *     bir sayı (tekrar aralığı: 1/7/30 gün). Bu hücre "bir ders =
     *     bir renk" kuralına tabi olmalı; ikisi de aynı sabit turuncuyu
     *     aldığı için koç aynı dersin konu/soru/tekrar kutucuklarının
     *     farklı renkte olduğunu fark etti (round ile ayrıştırılmadan
     *     hepsi ACTIVITY_TYPES.tekrar'ın sabit rengine düşüyordu).
     */
    if (type === 'tekrar' && cell.round) return getSubjectColor(cell.subject);

    const activity = ACTIVITY_TYPES[type];

    if (activity?.color) return activity.color;

    /* ⚠️ 25.08.2026: 'soru' türü eskiden kendi rengini `mix()` ile
       koyulaştırıyordu — aynı dersin konu/soru/tekrar kutucukları farklı
       tonda görünüyordu ("bir ders = bir renk" kuralını ihlal ediyordu,
       koç ekran görüntüsünde işaretledi). Tip zaten simge + etiketle
       (📘 KONU / ✏️ SORU / 🔁 TEKRAR) ayrışıyor; renk sadece DERSE bağlı
       kalmalı. */
    return getSubjectColor(cell.subject);
};

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
