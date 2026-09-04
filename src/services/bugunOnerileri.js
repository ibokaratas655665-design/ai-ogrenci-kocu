/**
 * 🧭 BUGÜN ÖNERİLERİ
 *
 * Bugün ekranının "şimdi neye bakmalısın?" kartlarını derler. Üç kaynaktan
 * en fazla üç öneri çıkar, her biri tek cümlelik gerekçe taşır:
 *
 *  1. dikkat        → konu haritasında "tamamlandı ✓ ama denemelerde hata"
 *  2. review-due    → Hata Defteri'nde tekrar vadesi gelen ilk kayıt
 *  3. oncelik-onerisi → konu motorunun en acil bulduğu konu (bugünün
 *     programında ZATEN görünen konular önerilmez — aynı işi iki kez söylemek
 *     güven kaybettirir)
 *
 * Salt okunurdur: hiçbir depoya yazmaz; veri yoksa boş liste döner.
 */
import { topluOzet, olcutOku, anahtar } from './topicProgressService';

const DEFTER_KEY = 'error_notebook';

const defterOku = () => {
    try {
        const raw = localStorage.getItem(DEFTER_KEY);
        if (!raw || !raw.trim()) return [];
        const v = JSON.parse(raw);
        return Array.isArray(v) ? v : [];
    } catch {
        return [];
    }
};

/** Öğrencinin tekrar vadesi gelmiş (ustalaşılmamış) hataları, en eskisi önce. */
export const vadesiGelenHatalar = (studentId, simdi = Date.now()) => (
    defterOku()
        .filter((e) => String(e.studentId) === String(studentId)
            && !e.mastered && (e.nextReviewAt ?? 0) <= simdi)
        .sort((a, b) => (a.nextReviewAt ?? 0) - (b.nextReviewAt ?? 0))
);

/**
 * Toplu vade sayacı — koç panosunun "Tekrar · N" rozetleri için.
 * Defter TEK geçişte taranır; öğrenci başına ayrı okuma yapılmaz.
 * @returns {Map<string, {count:number}>}
 */
export const vadesiGelenSayilari = (studentIds = [], simdi = Date.now()) => {
    const harita = new Map();
    const kimlikler = new Set((studentIds || []).map(String));
    defterOku().forEach((e) => {
        const sid = String(e.studentId);
        if (kimlikler.size && !kimlikler.has(sid)) return;
        if (e.mastered || (e.nextReviewAt ?? 0) > simdi) return;
        const m = harita.get(sid) || { count: 0 };
        m.count += 1;
        harita.set(sid, m);
    });
    return harita;
};

/**
 * 04.09 (canlı eşleme): öneri seçimi programın durumuna göre daralır —
 * bugün planlı etüt VARSA öğrencinin önüne EN FAZLA bir ek iş konur
 * (tekrar vadesi > konu önerisi); program boşsa tekrar → öneri → "bugün
 * planın yok" sırasıyla tek kart. "dikkat" kartı her durumda öndedir.
 * Toplam en fazla 2 öğe.
 *
 * @param {object} ogrenci  coach_students kaydı (en az { id })
 * @param {object} [secenekler]
 * @param {number} [secenekler.bugun]  ms; test edilebilirlik için dışarıdan verilebilir
 * @param {boolean} [secenekler.programBugunVar]  bugün yapılmamış planlı etüt var mı
 * @param {Set<string>} [secenekler.programKonular]  bugünkü programda görünen
 *        konuların anahtar() ile normalize edilmiş adları
 * @returns {{items: Array, reviewToplam: number, reviewFazla: number}}
 */
export const bugunOnerileri = (ogrenci, {
    bugun = Date.now(),
    programBugunVar = false,
    programKonular = new Set(),
} = {}) => {
    if (!ogrenci?.id) return { items: [], reviewToplam: 0, reviewFazla: 0 };
    const sid = String(ogrenci.id);

    let ozet = null;
    try {
        ozet = topluOzet([ogrenci], olcutOku()).get(sid);
    } catch {
        ozet = null;
    }

    const items = [];

    // 1 · Tamamlandı işaretli ama denemelerde hâlâ hata üreten konu
    const hatali = (ozet?.tamamHatali || [])[0];
    if (hatali) {
        items.push({
            type: 'dikkat', source: 'konuHaritasi',
            subject: hatali.ders, topic: hatali.konu, topicId: null,
            action: 'hata-analizi',
            reason: `Tamamlandı ✓ ama denemelerde ${hatali.denemeHatasi} hata — bu konuya dikkat.`,
            programRelation: 'ek', risk: null, priority: null, reviewDue: false,
        });
    }

    // 2 · Hata Defteri'nde tekrar vadesi gelen ilk kayıt
    const vadesi = vadesiGelenHatalar(sid, bugun);
    const ilkVade = vadesi[0];
    const tekrarKarti = ilkVade ? {
        type: 'review-due', source: 'error_notebook',
        subject: ilkVade.subject || null, topic: ilkVade.topic || null,
        topicId: ilkVade.topicId || null,
        action: 'tekrar-et',
        reason: 'Bu hatanın tekrar zamanı geldi.',
        programRelation: 'ek', risk: null, priority: null, reviewDue: true,
    } : null;

    // 3 · Konu motorunun en acil önerisi — bugünkü programda olmayanlardan
    const oncelik = (ozet?.topOncelik || []).find((k) => (
        k?.neden && (k.oncelik || 0) >= 30
        && !programKonular.has(anahtar(k.konu))
    ));
    const oneriKarti = oncelik ? {
        type: 'oncelik-onerisi', source: 'konuHaritasi',
        subject: oncelik.ders, topic: oncelik.konu, topicId: null,
        action: 'calis',
        reason: oncelik.neden,
        programRelation: 'ek', risk: oncelik.riskSeviye, priority: oncelik.oncelik,
        reviewDue: false,
    } : null;

    if (programBugunVar) {
        if (tekrarKarti) items.push(tekrarKarti);
        else if (oneriKarti) items.push(oneriKarti);
    } else if (tekrarKarti) {
        items.push(tekrarKarti);
    } else if (oneriKarti) {
        items.push(oneriKarti);
    } else {
        items.push({
            type: 'bos', source: 'konuHaritasi',
            subject: null, topic: null, topicId: null,
            action: null,
            reason: 'Bugün planlanmış bir etüdün yok.',
            programRelation: 'yok', risk: null, priority: null, reviewDue: false,
        });
    }

    return {
        items: items.slice(0, 2),
        reviewToplam: vadesi.length,
        reviewFazla: Math.max(0, vadesi.length - (tekrarKarti && items.includes(tekrarKarti) ? 1 : 0)),
    };
};
