/**
 * 🧾 REHBERLİK DEĞERLENDİRME VE RAPOR MOTORU
 *
 * Her envanterin sonucu farklı şekilde hesaplanıyordu; ortada
 * standart bir "sonuç nesnesi" yoktu, dolayısıyla ortak bir rapor
 * veya PDF üretilemiyordu.
 *
 * Bu servis her testin ham cevaplarını TEK bir rapor şemasına çevirir:
 *
 *   {
 *     testId, title, category, completedAt,
 *     scaleType,                      // problem | need | likert5 | open | peer | form
 *     total: { raw, max, percent },
 *     subscales: [{ key, label, raw, max, percent, band, items }],
 *     highlights: [...],              // dikkat çeken maddeler
 *     interpretation: string,         // koç için yorum
 *     recommendations: [string],      // önerilen müdahaleler
 *     openAnswers: [{ question, answer }],
 *   }
 *
 * Böylece rapor ekranı ve PDF tek bir yapıyı okur.
 */

import { TEST_DATA } from '../data/tests';
import { PROBLEM_AREAS } from '../data/mebGuidanceForms';

// ── Yorum bantları ────────────────────────────────────────────
const BANDS = {
    problem: [
        { max: 20, band: 'low', label: 'Sorun bildirimi düşük', color: 'var(--ok)' },
        { max: 45, band: 'medium', label: 'İzlenmeli', color: 'var(--warn)' },
        { max: 100, band: 'high', label: 'Öncelikli müdahale alanı', color: 'var(--danger)' },
    ],
    need: [
        { max: 40, band: 'low', label: 'Belirgin ihtiyaç yok', color: 'var(--ok)' },
        { max: 70, band: 'medium', label: 'Destek yararlı olur', color: 'var(--warn)' },
        { max: 100, band: 'high', label: 'Yüksek rehberlik ihtiyacı', color: 'var(--danger)' },
    ],
    likert5: [
        { max: 40, band: 'low', label: 'Düşük düzey', color: 'var(--danger)' },
        { max: 70, band: 'medium', label: 'Orta düzey', color: 'var(--warn)' },
        { max: 100, band: 'high', label: 'Yüksek düzey', color: 'var(--ok)' },
    ],
};

const bandFor = (scaleType, percent) => {
    const table = BANDS[scaleType] || BANDS.likert5;
    return table.find((b) => percent <= b.max) || table[table.length - 1];
};

// ── Alan etiketleri ───────────────────────────────────────────
const CATEGORY_LABELS = {
    ...PROBLEM_AREAS,
    academic: 'Eğitsel Rehberlik',
    career: 'Mesleki Rehberlik',
    personal: 'Kişisel / Sosyal Rehberlik',
    social: 'Sosyal İlişkiler',
    safety: 'Güvenli Yaşam',
    professional: 'Mesleki Gelişim (Öğretmen)',
    student: 'Öğrenci İzleme',
    special: 'Özel Eğitim',
};

const labelFor = (key) => CATEGORY_LABELS[key] || key;

// ── Öneri havuzu ──────────────────────────────────────────────
const RECOMMENDATIONS = {
    saglik: ['Okul sağlık taramasına yönlendirin', 'Uyku ve beslenme düzeni için veli görüşmesi planlayın'],
    okul: ['Verimli ders çalışma semineri / bireysel çalışma planı', 'Sınav kaygısıyla baş etme çalışması', 'Ders öğretmenleriyle durum paylaşımı'],
    aile: ['Veli görüşmesi planlayın', 'Aile içi iletişim broşürü paylaşın', 'Gerekirse RAM/aile danışmanlığına yönlendirin'],
    kendini_tanima: ['Bireysel görüşme ile benlik algısı çalışın', 'Güçlü yönler envanteri uygulayın'],
    sosyal: ['Sosyometri uygulayıp sınıf içi konumu inceleyin', 'Sosyal beceri grup çalışmasına dâhil edin', 'Akran zorbalığı takibi başlatın'],
    duygusal: ['Bireysel psikolojik danışma görüşmesi planlayın', 'Gerekirse RAM / il sağlık müdürlüğüne yönlendirin', 'Aile ile ivedi görüşme'],
    meslek: ['Mesleki ilgi envanteri uygulayın', 'Meslek tanıtım etkinliğine yönlendirin', 'Tercih danışmanlığı görüşmesi planlayın'],
    ekonomik: ['Sosyal yardım / burs imkânları için okul idaresiyle görüşün', 'Kaynak desteği sağlayın'],
    bos_zaman: ['Kulüp / sosyal etkinliklere yönlendirin', 'Hobi edinme çalışması yapın'],
    academic: ['Eğitsel rehberlik oturumu planlayın', 'Çalışma programı oluşturun'],
    career: ['Mesleki rehberlik oturumu planlayın', 'İlgi-yetenek envanteri uygulayın'],
    personal: ['Bireysel görüşme planlayın'],
    safety: ['Güvenli yaşam / bağımlılıkla mücadele etkinliğine dâhil edin'],
    special: ['BEP sürecini başlatın veya gözden geçirin', 'RAM ile iletişime geçin'],
    professional: ['Öğretmen mesleki gelişim çalışması planlayın'],
    student: ['Öğrenci izleme dosyası açın'],
};

// ══════════════════════════════════════════════════════════════
//  Ana rapor üreteci
// ══════════════════════════════════════════════════════════════

/**
 * @param {string} testId
 * @param {object} answers  - { questionIndex: value } veya { questionIndex: 'metin' }
 * @param {object} meta     - { studentName, className, completedAt }
 */
export const buildTestReport = (testId, answers = {}, meta = {}) => {
    const test = TEST_DATA[testId];
    if (!test) return null;

    const questions = test.questions || [];
    const scaleType = test.scaleType || inferScaleType(test);
    const scaleValues = (test.scale || []).map((s) => s.value);
    const minVal = scaleValues.length ? Math.min(...scaleValues) : 0;
    const maxVal = scaleValues.length ? Math.max(...scaleValues) : 1;

    // ── Açık uçlu / form tipi ────────────────────────────────
    if (scaleType === 'open' || scaleType === 'form' || scaleType === 'peer') {
        const openAnswers = questions.map((q, i) => ({
            question: q.text || q.label,
            answer: answers[i] ?? answers[q.id] ?? '',
        })).filter((a) => String(a.answer).trim() !== '');

        return {
            testId,
            title: test.title,
            category: test.category || 'Bireyi Tanıma',
            source: test.source,
            scaleType,
            completedAt: meta.completedAt || new Date().toISOString(),
            student: meta.studentName || '',
            className: meta.className || '',
            total: null,
            subscales: [],
            highlights: [],
            openAnswers,
            answeredCount: openAnswers.length,
            questionCount: questions.length,
            interpretation: openAnswers.length
                ? `${openAnswers.length}/${questions.length} soru yanıtlanmış. Yanıtlar nitel olarak değerlendirilmelidir; puanlama yapılmaz.`
                : 'Form henüz doldurulmamış.',
            recommendations: scaleType === 'peer'
                ? ['Sonuçları sosyogram ile birlikte değerlendirin', 'Dışlanan/gözde öğrencileri sınıf öğretmeniyle paylaşın']
                : ['Yanıtları bireysel görüşmede derinleştirin'],
        };
    }

    // ── Puanlanabilir ölçekler ───────────────────────────────
    const subMap = new Map();
    const highlights = [];
    let raw = 0;
    let answered = 0;

    questions.forEach((q, i) => {
        const val = Number(answers[i] ?? answers[q.id]);
        if (!Number.isFinite(val)) return;
        answered++;
        raw += val;

        const key = q.category || 'genel';
        if (!subMap.has(key)) subMap.set(key, { key, label: labelFor(key), raw: 0, count: 0, items: [] });
        const sub = subMap.get(key);
        sub.raw += val;
        sub.count++;
        sub.items.push({ text: q.text, value: val });

        // En yüksek değerli maddeler dikkat çekici sayılır
        if (val >= maxVal) highlights.push({ text: q.text, category: labelFor(key), value: val });
    });

    const max = answered * maxVal;
    const min = answered * minVal;
    const percent = max > min ? Math.round(((raw - min) / (max - min)) * 100) : 0;

    const subscales = [...subMap.values()]
        .map((s) => {
            const sMax = s.count * maxVal;
            const sMin = s.count * minVal;
            const sPercent = sMax > sMin ? Math.round(((s.raw - sMin) / (sMax - sMin)) * 100) : 0;
            const b = bandFor(scaleType, sPercent);
            return {
                key: s.key,
                label: s.label,
                raw: s.raw,
                max: sMax,
                count: s.count,
                percent: sPercent,
                band: b.band,
                bandLabel: b.label,
                color: b.color,
                items: s.items,
            };
        })
        .sort((a, b) => b.percent - a.percent);

    const overallBand = bandFor(scaleType, percent);
    const priority = subscales.filter((s) => s.band === 'high');

    // ── Öneriler ─────────────────────────────────────────────
    const recs = [];
    for (const s of priority.slice(0, 4)) {
        for (const r of RECOMMENDATIONS[s.key] || []) {
            if (!recs.includes(r)) recs.push(r);
        }
    }
    if (!recs.length) recs.push('Belirgin bir öncelik alanı çıkmadı; rutin izlemeye devam edin.');

    return {
        testId,
        title: test.title,
        category: test.category || 'Envanter',
        source: test.source,
        scaleType,
        completedAt: meta.completedAt || new Date().toISOString(),
        student: meta.studentName || '',
        className: meta.className || '',
        total: { raw, max, min, percent, band: overallBand.band, bandLabel: overallBand.label, color: overallBand.color },
        subscales,
        priority,
        highlights: highlights.slice(0, 15),
        openAnswers: [],
        answeredCount: answered,
        questionCount: questions.length,
        interpretation: buildInterpretation(test, scaleType, percent, overallBand, priority),
        recommendations: recs,
    };
};

const inferScaleType = (test) => {
    if (test.scaleType) return test.scaleType;
    if (Array.isArray(test.options) && test.options.length) return 'likert5';
    return 'likert5';
};

const buildInterpretation = (test, scaleType, percent, band, priority) => {
    const head = `Genel düzey: %${percent} — ${band.label}.`;
    if (!priority.length) {
        return `${head} Alt boyutların hiçbirinde öncelikli düzeyde bir bulgu yok.`;
    }
    const names = priority.map((p) => p.label).join(', ');
    if (scaleType === 'problem') {
        return `${head} Öğrencinin en çok zorlandığı alanlar: ${names}. Bu alanlardaki maddeler bireysel görüşmede önce ele alınmalıdır.`;
    }
    if (scaleType === 'need') {
        return `${head} Öğrencinin en yüksek rehberlik ihtiyacı bildirdiği alanlar: ${names}. Yıllık rehberlik planına bu alanlar öncelikle yazılmalıdır.`;
    }
    return `${head} Öne çıkan alanlar: ${names}.`;
};

// ══════════════════════════════════════════════════════════════
//  Sınıf geneli özet — aynı testi çözen tüm öğrenciler
// ══════════════════════════════════════════════════════════════

/**
 * Rehber öğretmenin yıllık plan yaparken ihtiyacı olan şey:
 * "Bu sınıfta en çok hangi alanda ihtiyaç var?"
 */
export const buildClassTestSummary = (testId, results = []) => {
    const test = TEST_DATA[testId];
    if (!test || !results.length) return null;

    const reports = results
        .map((r) => buildTestReport(testId, r.answers || {}, { studentName: r.studentName }))
        .filter(Boolean)
        .filter((r) => r.total);

    if (!reports.length) return null;

    const subMap = new Map();
    for (const rep of reports) {
        for (const s of rep.subscales) {
            if (!subMap.has(s.key)) subMap.set(s.key, { key: s.key, label: s.label, sum: 0, n: 0, highCount: 0 });
            const agg = subMap.get(s.key);
            agg.sum += s.percent;
            agg.n++;
            if (s.band === 'high') agg.highCount++;
        }
    }

    const subscales = [...subMap.values()]
        .map((s) => ({
            key: s.key,
            label: s.label,
            avgPercent: Math.round(s.sum / s.n),
            highCount: s.highCount,
            highRate: Math.round((s.highCount / reports.length) * 100),
        }))
        .sort((a, b) => b.avgPercent - a.avgPercent);

    return {
        testId,
        title: test.title,
        studentCount: reports.length,
        avgPercent: Math.round(reports.reduce((a, r) => a + r.total.percent, 0) / reports.length),
        subscales,
        topNeeds: subscales.slice(0, 3),
        atRiskStudents: reports
            .filter((r) => r.total.band === 'high')
            .map((r) => ({ name: r.student, percent: r.total.percent, areas: r.priority.map((p) => p.label) })),
    };
};

export default { buildTestReport, buildClassTestSummary };
