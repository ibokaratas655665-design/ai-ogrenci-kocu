/**
 * 🧠 BİLİMSEL DERS DAĞITIM MOTORU (v2)
 * ════════════════════════════════════════════════════════════════════
 *
 * Haftalık etüt ızgarasının ana mantığı korundu (gün × etüt hücreleri,
 * kapalı etütler, elle boyama). Değişen şey: hücrelere NE konduğu.
 *
 * ── Uygulanan verimli program kriterleri ──────────────────────────
 *
 *  1. TESTING EFFECT (Roediger & Karpicke, 2006)
 *     Her yeni konunun ardından SORU ÇÖZÜMÜ bloğu gelir. Pasif okuma
 *     tek başına kalıcılık üretmiyor; bilgi geri çağrıldığında pekişiyor.
 *
 *  2. SPACED REPETITION (Ebbinghaus / Cepeda et al., 2006)
 *     İşlenen konu +1, +7 ve +21. günlerde TEKRAR olarak geri gelir.
 *     Eski sürümde "tekrar" yoktu; konu listesi bitince baştan
 *     sarılıyordu ki bu aralıklı tekrar değil, sadece döngüdür.
 *
 *  3. INTERLEAVING (Karıştırma)
 *     Sayısal ↔ sözel dersler gün içinde dönüşümlü yerleşir.
 *     Aynı ders günde en fazla 2 etüt, arka arkaya en fazla 2 gün.
 *
 *  4. CIRCADIAN / COGNITIVE LOAD ORDERING
 *     Zihinsel yükü yüksek işler (yeni sayısal konu) günün ilk
 *     etütlerine; tekrar, paragraf ve okuma son etütlere yerleşir.
 *     Eski sürümde etüt sırası tamamen rastgeleydi.
 *
 *  5. HAFTALIK DENEME + ANINDA ANALİZ
 *     Deneme bloğunun hemen ardından analiz bloğu gelir. Analizi
 *     ertelenen deneme, öğrenme değeri neredeyse sıfır olan denemedir.
 *
 *  6. GÜNLÜK ALIŞKANLIK BLOKLARI
 *     Paragraf ve kitap okuma her güne sabitlenir — bunlar "vakit
 *     kalırsa" yapılan işler değil, günlük rutinin parçasıdır.
 *
 *  7. ESNEKLİK PAYI (Telafi)
 *     Haftada bir etüt boş bırakılır. %100 dolu programlar ilk
 *     aksamada çöker; telafi payı programın sürdürülebilirliğidir.
 *
 *  8. GÜNDE KAÇ FARKLI DERS? (maxSubjectsPerDay)
 *     Literatürde deneysel olarak sabitlenmiş bir sayı YOK. Ancak üç
 *     bulgu birlikte bir aralık veriyor:
 *
 *       a) Interleaving çalışmaları (Rohrer & Taylor; Kornell & Bjork)
 *          tek ders/gün'ün (blocked practice) uzun vadede en kötü
 *          seçenek olduğunu gösteriyor → alt sınır: 2 ders.
 *
 *       b) Sürekli dikkat pencereleri 45–90 dk. Bir dersin verimli
 *          işlenmesi için en az 1–2 kesintisiz etüt gerekiyor
 *          → ders sayısı ≈ ders etüdü / 2.
 *
 *       c) Retroaktif ket vurma (retroactive interference): benzer
 *          içerikler arka arkaya çalışıldığında geri çağırma düşüyor.
 *          Çok sayıda dersi aynı güne sıkıştırmak bu riski artırıyor
 *          → üst sınır pratikte 4.
 *
 *     Bu yüzden varsayılan 3'tür ve ders etüdü sayısına göre
 *     otomatik daraltılır. Paragraf, kitap okuma, tekrar, deneme ve
 *     analiz bu sayıma DAHİL DEĞİLDİR — bunlar rutin/pekiştirme
 *     blokları, yeni bilişsel yük değil.
 *
 *  9. DETERMİNİSTİK ÜRETİM
 *     Eski sürüm Math.random() kullanıyordu — aynı girdiyle her
 *     seferinde farklı program çıkıyordu, sonuç tekrarlanamıyordu.
 *     Derslerin başlangıç kaydırması artık altın oran dizisiyle
 *     yapılıyor: rastgelelik yok, aynı girdi hep aynı programı verir.
 */

/**
 * Birbirine yakın/karışabilir ders grupları.
 * Aynı gruptan iki ders arka arkaya gelirse retroaktif ket vurma riski artar.
 */
const SIMILAR_GROUPS = [
    ['matematik', 'geometri'],
    ['fizik', 'kimya', 'biyoloji', 'fen'],
    ['tarih', 'cografya', 'felsefe', 'din', 'inkilap'],
    ['turkce', 'edebiyat', 'dilbilgisi'],
];

const normSubject = (s = '') =>
    String(s).toLocaleLowerCase('tr-TR')
        .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ş/g, 's')
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '');

const similarityGroup = (subject) => {
    const k = normSubject(subject);
    const idx = SIMILAR_GROUPS.findIndex((g) => g.includes(k));
    return idx === -1 ? `solo:${k}` : `grp:${idx}`;
};

// ════════════════════════════════════════════════════════════
//  Varsayılan ayarlar
// ════════════════════════════════════════════════════════════

export const DEFAULT_PLAN_OPTIONS = {
    /** Haftalık deneme + analiz bloğu */
    examEnabled: true,
    examDay: 'Pazar',
    examSlots: 2,
    analysisSlots: 1,

    /** Konu → soru çözümü eşleştirmesi */
    practiceEnabled: true,
    practiceRatio: 1,          // her 1 konu etüdüne 1 soru etüdü

    /** Aralıklı tekrar */
    reviewEnabled: true,
    reviewIntervals: [1, 7, 21],   // gün

    /** Günlük alışkanlıklar */
    paragraphEnabled: true,
    readingEnabled: true,

    /** Haftalık telafi payı */
    flexEnabled: true,

    /** Zihinsel yük sıralaması (zor işler güne erken) */
    cognitiveOrdering: true,

    /** Sınırlar */
    maxSubjectsPerDay: 3,          // günde kaç FARKLI ders (paragraf/kitap/tekrar hariç)
    maxSlotsPerSubjectPerDay: 3,   // konu + soru + tekrar toplamı
    maxKonuPerSubjectPerDay: 2,    // aynı dersten günde en fazla 2 YENİ konu
    maxConsecutiveDays: 2,
    /** Benzer dersleri arka arkaya koyma (retroaktif ket vurma) */
    avoidSimilarAdjacent: true,
    /** Bir tekrar en fazla kaç gün ertelenebilir; sonra düşer */
    maxReviewDefer: 5,
};

const DEFAULT_NUMERIC = new Set([
    'Matematik', 'Geometri', 'Fizik', 'Kimya', 'Biyoloji', 'Fen',
    'Trigonometri', 'Analitik Geometri', 'Logaritma', 'Sayılar', 'Olasılık',
]);

// ════════════════════════════════════════════════════════════
//  Yardımcılar
// ════════════════════════════════════════════════════════════

const WEEKEND = new Set(['Cumartesi', 'Pazar']);

// ════════════════════════════════════════════════════════════
//  Ana fonksiyon
// ════════════════════════════════════════════════════════════

/**
 * @param {Array}  queue  - [{ subject, topic, weight, exam, color }]
 * @param {object} config
 * @param {number} config.months
 * @param {number} config.weeksPerMonth
 * @param {number} config.slotsPerDay
 * @param {object} config.closedSlots      - { 'Pazartesi': [0,2] }
 * @param {object} config.existingSchedule - üzerine yazılmaz
 * @param {string[]} config.DAYS
 * @param {Set}    config.numericSet
 * @param {object} config.options          - DEFAULT_PLAN_OPTIONS ile birleşir
 * @returns {{ schedule: object, stats: object }}
 */
export function distributeToSlots(queue, config = {}) {
    const {
        months = 1,
        weeksPerMonth = 4,
        slotsPerDay = 6,
        closedSlots = {},
        existingSchedule = {},
        DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'],
        numericSet = DEFAULT_NUMERIC,
    } = config;

    const opt = { ...DEFAULT_PLAN_OPTIONS, ...(config.options || {}) };

    if (!queue?.length) return { schedule: {}, stats: emptyStats() };

    // ── 1. Gün zaman çizelgesi ───────────────────────────────
    const timeline = [];
    for (let m = 1; m <= months; m++) {
        for (let w = 1; w <= weeksPerMonth; w++) {
            for (let d = 0; d < DAYS.length; d++) {
                const day = DAYS[d];
                const closed = closedSlots[day] || [];
                const open = [];
                for (let s = 0; s < slotsPerDay; s++) {
                    const key = `m${m}-w${w}-${day}-${s}`;
                    if (!closed.includes(s) && !existingSchedule[key]) {
                        open.push({ key, slotIndex: s });
                    }
                }
                timeline.push({
                    day,
                    month: m,
                    week: w,
                    weekIndex: (m - 1) * weeksPerMonth + (w - 1),
                    isWeekend: WEEKEND.has(day),
                    open,
                });
            }
        }
    }

    const usableDays = timeline.filter((t) => t.open.length > 0);
    if (!usableDays.length) return { schedule: {}, stats: emptyStats() };

    const result = {};
    /** Gün bazında hangi hücrelerin dolduğunu izler. */
    const taken = new Set();

    const place = (cellKey, payload) => {
        if (taken.has(cellKey)) return false;
        result[cellKey] = payload;
        taken.add(cellKey);
        return true;
    };

    const freeSlots = (dayEntry) => dayEntry.open.filter((s) => !taken.has(s.key));

    // ══════════════════════════════════════════════════════════
    //  2. RİTİM BLOKLARI — konumu sabit olanlar önce yerleşir
    // ══════════════════════════════════════════════════════════

    const stats = emptyStats();

    // ── 2a. Haftalık deneme + hemen ardından analiz ───────────
    if (opt.examEnabled) {
        const examDays = timeline.filter((t) => t.day === opt.examDay && t.open.length > 0);
        for (const dayEntry of examDays) {
            const free = freeSlots(dayEntry).sort((a, b) => a.slotIndex - b.slotIndex);
            if (free.length < 2) continue;

            const examCount = Math.min(opt.examSlots, Math.max(1, free.length - 1));
            for (let i = 0; i < examCount; i++) {
                if (place(free[i].key, {
                    subject: 'Deneme',
                    topic: examCount > 1 && i === 0 ? 'Deneme Sınavı (başla)' : 'Deneme Sınavı',
                    type: 'deneme',
                    exam: '',
                })) stats.deneme++;
            }

            const analysisCount = Math.min(opt.analysisSlots, free.length - examCount);
            for (let i = 0; i < analysisCount; i++) {
                const slot = free[examCount + i];
                if (!slot) break;
                if (place(slot.key, {
                    subject: 'Deneme Analizi',
                    topic: 'Yanlış analizi + hata defteri',
                    type: 'analiz',
                    exam: '',
                })) stats.analiz++;
            }
        }
    }

    // ── 2b. Kitap okuma — her günün SON etüdü ────────────────
    if (opt.readingEnabled) {
        for (const dayEntry of usableDays) {
            const free = freeSlots(dayEntry);
            if (free.length < 2) continue; // tek etüt kaldıysa derse ayır
            const last = free.reduce((a, b) => (b.slotIndex > a.slotIndex ? b : a));
            if (place(last.key, {
                subject: 'Kitap Okuma',
                topic: 'Serbest okuma (30 dk)',
                type: 'kitap',
                exam: '',
            })) stats.kitap++;
        }
    }

    // ── 2c. Paragraf — hafta içi her gün, orta etütlerden biri ─
    if (opt.paragraphEnabled) {
        for (const dayEntry of usableDays) {
            if (dayEntry.isWeekend) continue;
            const free = freeSlots(dayEntry);
            if (free.length < 3) continue; // az etüt varsa derse öncelik
            // Ortadaki etüt: dikkat düşüşünün başladığı yerde hafif ama aktif iş
            const mid = free[Math.floor(free.length / 2)];
            if (place(mid.key, {
                subject: 'Paragraf',
                topic: 'Günlük paragraf (20 soru)',
                type: 'paragraf',
                exam: '',
            })) stats.paragraf++;
        }
    }

    // ── 2d. Haftalık telafi payı ─────────────────────────────
    if (opt.flexEnabled) {
        const byWeek = new Map();
        for (const t of usableDays) {
            if (!byWeek.has(t.weekIndex)) byWeek.set(t.weekIndex, []);
            byWeek.get(t.weekIndex).push(t);
        }
        for (const days of byWeek.values()) {
            // Cumartesi tercih edilir; yoksa haftanın son dolu günü
            const target = days.find((d) => d.day === 'Cumartesi') || days[days.length - 1];
            const free = freeSlots(target);
            if (free.length < 2) continue;
            const last = free.reduce((a, b) => (b.slotIndex > a.slotIndex ? b : a));
            if (place(last.key, {
                subject: 'Esnek / Telafi',
                topic: 'Yetişemediklerini tamamla',
                type: 'mola',
                exam: '',
            })) stats.mola++;
        }
    }

    // ══════════════════════════════════════════════════════════
    //  3. DERS HAVUZU
    // ══════════════════════════════════════════════════════════

    const subjectMap = {};
    for (const item of queue) {
        const subj = item.subject;
        if (!subj) continue;
        if (!subjectMap[subj]) {
            subjectMap[subj] = {
                subject: subj,
                kind: numericSet.has(subj) ? 'num' : 'vrb',
                topics: [],
                totalWeight: 0,
                tPtr: 0,
                remaining: 0,
                slotsGiven: 0,
                consecutiveDays: 0,
                lastDayIndex: -99,
                token: 0,
                exhausted: false,
            };
        }
        const w = Math.max(1, Number(item.weight) || 1);
        subjectMap[subj].topics.push({
            topic: item.topic,
            exam: item.exam || '',
            weight: w,
        });
        subjectMap[subj].totalWeight += w;
    }

    const allSubjects = Object.values(subjectMap);
    if (!allSubjects.length) return { schedule: result, stats };

    allSubjects.forEach((sq) => {
        if (sq.topics.length) sq.remaining = sq.topics[0].weight;
    });

    // Kalan (ders için kullanılabilir) etüt sayısı
    const studyDays = usableDays
        .map((d) => ({ ...d, free: freeSlots(d) }))
        .filter((d) => d.free.length > 0);

    const totalStudySlots = studyDays.reduce((s, d) => s + d.free.length, 0);
    if (totalStudySlots === 0) return { schedule: result, stats };

    // Soru çözümü etkinse, etütlerin bir kısmı soruya ayrılır
    const practiceShare = opt.practiceEnabled
        ? opt.practiceRatio / (1 + opt.practiceRatio)
        : 0;
    const konuSlotBudget = Math.max(1, Math.round(totalStudySlots * (1 - practiceShare)));

    const totalWeight = allSubjects.reduce((s, sq) => s + sq.totalWeight, 0) || 1;
    allSubjects.forEach((sq, i) => {
        sq.slotTarget = Math.max(1, Math.round((sq.totalWeight / totalWeight) * konuSlotBudget));
        sq.dailyAvg = sq.slotTarget / studyDays.length;
        // Deterministik kademeli başlangıç: her ders farklı günde "açılır"
        sq.token = ((i * 0.618033988749895) % 1) * sq.dailyAvg;
    });

    const numSubjects = allSubjects.filter((sq) => sq.kind === 'num');
    const vrbSubjects = allSubjects.filter((sq) => sq.kind === 'vrb');
    const numW = numSubjects.reduce((s, sq) => s + sq.totalWeight, 0);
    const vrbW = vrbSubjects.reduce((s, sq) => s + sq.totalWeight, 0);
    const numRatio = (numW + vrbW) > 0 ? numW / (numW + vrbW) : 0;

    // ── Konu ilerletme yardımcıları ──────────────────────────
    const advance = (sq) => {
        while (sq.tPtr < sq.topics.length && sq.remaining <= 0) {
            sq.tPtr++;
            if (sq.tPtr < sq.topics.length) sq.remaining = sq.topics[sq.tPtr].weight;
        }
    };
    const hasMore = (sq) => {
        let p = sq.tPtr, r = sq.remaining;
        while (p < sq.topics.length && r <= 0) {
            p++;
            r = p < sq.topics.length ? sq.topics[p].weight : 0;
        }
        return p < sq.topics.length;
    };
    const takeTopic = (sq) => {
        advance(sq);
        if (sq.tPtr >= sq.topics.length) { sq.exhausted = true; return null; }
        const t = sq.topics[sq.tPtr];
        sq.remaining--;
        sq.slotsGiven++;
        return { subject: sq.subject, topic: t.topic, exam: t.exam };
    };

    // ══════════════════════════════════════════════════════════
    //  4. GÜN GÜN DAĞITIM
    // ══════════════════════════════════════════════════════════

    /** Aralıklı tekrar kuyruğu: { dueDay, subject, topic, exam, round } */
    const reviewQueue = [];
    /** Konu → soru eşleşme kuyruğu (aynı gün veya ertesi gün) */
    const practiceQueue = [];

    studyDays.forEach((dayEntry, dayIndex) => {
        const free = freeSlots(dayEntry).sort((a, b) => a.slotIndex - b.slotIndex);
        if (!free.length) return;

        // Günlük ders sayacı — "aynı ders günde max N etüt" kuralı.
        // Konu, soru ve tekrar; hepsi aynı derse ait yük olarak sayılır.
        const perSubjectToday = new Map();
        const usedToday = (subject) => perSubjectToday.get(subject) || 0;
        const noteUse = (subject, n = 1) => perSubjectToday.set(subject, usedToday(subject) + n);
        const hasRoom = (subject, n = 1) =>
            usedToday(subject) + n <= opt.maxSlotsPerSubjectPerDay;

        const perSubjectKonuToday = new Map();
        const konuRoom = (subject, n = 1) =>
            (perSubjectKonuToday.get(subject) || 0) + n <= opt.maxKonuPerSubjectPerDay;
        const noteKonu = (subject, n = 1) =>
            perSubjectKonuToday.set(subject, (perSubjectKonuToday.get(subject) || 0) + n);

        // ── Günde kaç farklı ders? ───────────────────────────
        // Sayıma yalnızca konu ve soru girer; paragraf, kitap, tekrar,
        // deneme ve analiz rutin/pekiştirme blokları olduğu için hariç.
        //
        // Her dersin en az bir kesintisiz etüdü olmalı (dikkat penceresi),
        // dolayısıyla ders sayısı o günün ders etüdü sayısını aşamaz.
        // Az etüt kalan günlerde (ör. deneme günü) sayı kendiliğinden düşer.
        const subjectsToday = new Set();
        const dailySubjectCap = Math.max(1, Math.min(opt.maxSubjectsPerDay, free.length));
        const subjectSlotAvailable = (subject) =>
            subjectsToday.has(subject) || subjectsToday.size < dailySubjectCap;

        const canTakeMore = (sq) =>
            hasRoom(sq.subject) && konuRoom(sq.subject) && subjectSlotAvailable(sq.subject);

        allSubjects.forEach((sq) => {
            sq.token += sq.dailyAvg;
            if (sq.lastDayIndex !== dayIndex - 1) sq.consecutiveDays = 0;
        });

        // ── 4a. Bugün vadesi gelen tekrarlar ─────────────────
        const dueReviews = [];
        for (let i = reviewQueue.length - 1; i >= 0; i--) {
            if (reviewQueue[i].dueDay <= dayIndex) {
                dueReviews.push(reviewQueue[i]);
                reviewQueue.splice(i, 1);
            }
        }

        // ── 4b. Bekleyen soru çözümleri ──────────────────────
        const duePractice = practiceQueue.splice(0, practiceQueue.length);

        // ── 4c. Yeni konu seçimi ─────────────────────────────
        // Tekrar ve soru bloklarından arta kalan kadar yeni konu alınır;
        // böylece program "sürekli yeni konu" değil, öğrenme döngüsü olur.
        const reservedForReview = Math.min(dueReviews.length, Math.floor(free.length / 3));
        const reservedForPractice = Math.min(duePractice.length, Math.floor(free.length / 2));
        let konuBudget = Math.max(0, free.length - reservedForReview - reservedForPractice);

        // Hafta sonu yeni konu yükünü azalt, pekiştirmeye ağırlık ver
        if (dayEntry.isWeekend) konuBudget = Math.ceil(konuBudget * 0.6);

        const pickFrom = (group, budget) => {
            const picks = [];
            let rem = budget;
            const sorted = [...group]
                .filter((sq) => sq.topics.length > 0)
                .sort((a, b) => {
                    const pa = a.consecutiveDays >= opt.maxConsecutiveDays ? -1000 : 0;
                    const pb = b.consecutiveDays >= opt.maxConsecutiveDays ? -1000 : 0;
                    return (b.token + pb) - (a.token + pa);
                });

            for (const sq of sorted) {
                if (rem <= 0) break;
                if (!hasMore(sq)) continue;
                if (sq.consecutiveDays >= opt.maxConsecutiveDays) continue;
                if (!subjectSlotAvailable(sq.subject)) continue;
                if (!canTakeMore(sq)) continue;
                if (sq.token < 1) continue;

                // Aynı ders için gün içi blok: hem toplam hem yeni-konu sınırına uy
                const room = Math.min(
                    opt.maxSlotsPerSubjectPerDay - usedToday(sq.subject),
                    opt.maxKonuPerSubjectPerDay - (perSubjectKonuToday.get(sq.subject) || 0)
                );
                const count = Math.min(sq.token >= 2 ? 2 : 1, rem, room);
                if (count <= 0) continue;

                picks.push({ sq, count });
                rem -= count;
                sq.token -= count;
                noteUse(sq.subject, count);
                noteKonu(sq.subject, count);
                subjectsToday.add(sq.subject);
            }
            return picks;
        };

        const numBudget = numSubjects.length ? Math.round(konuBudget * numRatio) : 0;
        const numPicks = pickFrom(numSubjects, numBudget);
        const vrbPicks = pickFrom(vrbSubjects, konuBudget - numBudget);

        // INTERLEAVING: sayısal ↔ sözel dönüşümlü sırala
        const interleaved = [];
        const maxLen = Math.max(numPicks.length, vrbPicks.length);
        for (let i = 0; i < maxLen; i++) {
            if (i < numPicks.length) interleaved.push(numPicks[i]);
            if (i < vrbPicks.length) interleaved.push(vrbPicks[i]);
        }

        // ── 4d. Günün iş listesini oluştur ───────────────────
        /** { payload, load } — load: zihinsel yük (yüksek = güne erken) */
        const dayPlan = [];

        for (const { sq, count } of interleaved) {
            for (let k = 0; k < count; k++) {
                const t = takeTopic(sq);
                if (!t) break;
                dayPlan.push({
                    payload: { ...t, type: 'konu' },
                    load: sq.kind === 'num' ? 100 : 85,
                });

                if (opt.practiceEnabled) {
                    practiceQueue.push({ ...t });
                }
                if (opt.reviewEnabled) {
                    for (const gap of opt.reviewIntervals) {
                        reviewQueue.push({ ...t, dueDay: dayIndex + gap, round: gap });
                    }
                }
            }
            sq.lastDayIndex = dayIndex;
            sq.consecutiveDays++;
        }

        // Soru blokları — günlük ders yükü sınırına uyanlar bugün yerleşir
        const practiceLeftovers = [];
        let practicePlaced = 0;
        for (const p of duePractice) {
            if (practicePlaced < reservedForPractice && hasRoom(p.subject) && subjectSlotAvailable(p.subject)) {
                dayPlan.push({
                    payload: { subject: p.subject, topic: p.topic, type: 'soru', exam: p.exam },
                    load: 70,
                });
                noteUse(p.subject);
                subjectsToday.add(p.subject);
                practicePlaced++;
            } else {
                practiceLeftovers.push(p);
            }
        }
        practiceQueue.unshift(...practiceLeftovers);

        // Tekrarlar — aynı sınır, yerleşemeyen ertesi güne kayar
        let reviewPlaced = 0;
        for (const r of dueReviews) {
            if (reviewPlaced < reservedForReview && hasRoom(r.subject)) {
                dayPlan.push({
                    payload: { subject: r.subject, topic: r.topic, type: 'tekrar', exam: r.exam, round: r.round },
                    load: 40,
                });
                noteUse(r.subject);
                reviewPlaced++;
            } else {
                // Sürekli ertelenen tekrar programı tıkamasın — bir noktada düşer
                const deferred = (r.deferred || 0) + 1;
                if (deferred <= opt.maxReviewDefer) {
                    reviewQueue.push({ ...r, dueDay: dayIndex + 1, deferred });
                }
            }
        }

        // ── 4e. Zihinsel yük sıralaması ──────────────────────
        if (opt.cognitiveOrdering) {
            dayPlan.sort((a, b) => b.load - a.load);
            // Sıralama sonrası aynı dersin yan yana yığılmasını kır
            deClump(dayPlan);
        }

        // ── 4f. Hücrelere yaz ────────────────────────────────
        let cursor = 0;
        for (const entry of dayPlan) {
            if (cursor >= free.length) break;
            if (place(free[cursor].key, entry.payload)) {
                cursor++;
                bumpStat(stats, entry.payload.type);
            }
        }

        // ── 4g. Kalan etütler ────────────────────────────────
        // Öncelik: VADESİ GELMİŞ tekrar → bekleyen soru → yeni konu → esnek.
        // Vadesi gelmemiş tekrarı buraya çekmek aralıklı tekrarı bozar:
        // sabah işlenen konu akşam "tekrar" olarak geri gelirse aralık kalmaz.
        while (cursor < free.length) {
            let filled = false;

            const dueIdx = reviewQueue.findIndex(
                (r) => r.dueDay <= dayIndex && hasRoom(r.subject)
            );
            const practiceIdx = practiceQueue.findIndex(
                (p) => hasRoom(p.subject) && subjectSlotAvailable(p.subject)
            );

            if (dueIdx > -1) {
                const [r] = reviewQueue.splice(dueIdx, 1);
                if (place(free[cursor].key, {
                    subject: r.subject, topic: r.topic, type: 'tekrar', exam: r.exam, round: r.round,
                })) { noteUse(r.subject); cursor++; stats.tekrar++; filled = true; }
            } else if (practiceIdx > -1) {
                const [p] = practiceQueue.splice(practiceIdx, 1);
                if (place(free[cursor].key, {
                    subject: p.subject, topic: p.topic, type: 'soru', exam: p.exam,
                })) { noteUse(p.subject); subjectsToday.add(p.subject); cursor++; stats.soru++; filled = true; }
            } else {
                const candidate = [...allSubjects]
                    .filter((sq) => hasMore(sq) && canTakeMore(sq))
                    .sort((a, b) => (a.slotsGiven / (a.totalWeight || 1)) - (b.slotsGiven / (b.totalWeight || 1)))[0];

                if (candidate) {
                    const t = takeTopic(candidate);
                    if (t && place(free[cursor].key, { ...t, type: 'konu' })) {
                        noteUse(candidate.subject);
                        noteKonu(candidate.subject);
                        subjectsToday.add(candidate.subject);
                        candidate.lastDayIndex = dayIndex;
                        cursor++;
                        stats.konu++;
                        filled = true;
                        if (opt.practiceEnabled) practiceQueue.push({ ...t });
                        if (opt.reviewEnabled) {
                            for (const gap of opt.reviewIntervals) {
                                reviewQueue.push({ ...t, dueDay: dayIndex + gap, round: gap });
                            }
                        }
                    }
                }
            }

            if (!filled) {
                // Doldurulacak anlamlı iş kalmadı — zorlama, esnek bırak
                if (place(free[cursor].key, {
                    subject: 'Esnek / Telafi',
                    topic: 'Serbest çalışma',
                    type: 'mola',
                    exam: '',
                })) { cursor++; stats.mola++; }
                else break;
            }
        }

        // ── 4h. Yük sıralamasını garantiye al ────────────────
        // Yedek doldurma yolu (4g) plan sırasını atlayabildiği için,
        // gün tamamlandıktan sonra ders etütleri yeniden sıralanır:
        // yeni konu → soru → tekrar. Sabit ritim blokları yerinde kalır.
        if (opt.cognitiveOrdering) {
            reorderByLoad(free, result, opt.avoidSimilarAdjacent);
        }
    });

    stats.totalPlaced = Object.keys(result).length;

    // Gerçekleşen "günde kaç farklı ders" — ayar bir ÜST SINIR olduğu için
    // fiilen kaça ulaşıldığını da bildiriyoruz; koç ikisini karşılaştırabilsin.
    const perDaySubjects = [];
    for (const dayEntry of usableDays) {
        const subs = new Set();
        for (const slot of dayEntry.open) {
            const cell = result[slot.key];
            if (cell && (cell.type === 'konu' || cell.type === 'soru')) subs.add(cell.subject);
        }
        if (subs.size) perDaySubjects.push(subs.size);
    }
    stats.subjectsPerDay = {
        cap: opt.maxSubjectsPerDay,
        min: perDaySubjects.length ? Math.min(...perDaySubjects) : 0,
        max: perDaySubjects.length ? Math.max(...perDaySubjects) : 0,
        avg: perDaySubjects.length
            ? Math.round((perDaySubjects.reduce((a, b) => a + b, 0) / perDaySubjects.length) * 10) / 10
            : 0,
    };

    return { schedule: result, stats };
}

// ════════════════════════════════════════════════════════════
//  Yardımcı: aynı dersin yan yana yığılmasını dağıt
// ════════════════════════════════════════════════════════════

/**
 * Yük sıralaması sonrası aynı ders arka arkaya 3+ kez gelirse
 * araya farklı ders sokar (interleaving'i korumak için).
 */
function deClump(plan) {
    for (let i = 2; i < plan.length; i++) {
        const a = plan[i - 2]?.payload?.subject;
        const b = plan[i - 1]?.payload?.subject;
        const c = plan[i]?.payload?.subject;
        if (a && a === b && b === c) {
            const swapIdx = plan.findIndex((p, j) => j > i && p.payload.subject !== c);
            if (swapIdx > -1) {
                const tmp = plan[i];
                plan[i] = plan[swapIdx];
                plan[swapIdx] = tmp;
            }
        }
    }
}

/** Zihinsel yük ağırlıkları — yüksek olan güne daha erken yerleşir. */
const LOAD_BY_TYPE = { konu: 100, soru: 70, tekrar: 40 };

/**
 * Bir günün ders etütlerini (konu/soru/tekrar) zihinsel yüke göre
 * yeniden sıralar. Deneme, analiz, paragraf, kitap ve esnek blokları
 * konumu anlamlı olduğu için dokunulmadan bırakılır.
 */
function reorderByLoad(freeSlots, schedule, avoidSimilarAdjacent = true) {
    const movable = freeSlots
        .filter((s) => LOAD_BY_TYPE[schedule[s.key]?.type] != null)
        .sort((a, b) => a.slotIndex - b.slotIndex);

    if (movable.length < 2) return;

    const payloads = movable.map((s) => schedule[s.key]);
    payloads.sort((a, b) => {
        const diff = LOAD_BY_TYPE[b.type] - LOAD_BY_TYPE[a.type];
        if (diff !== 0) return diff;
        return String(a.subject).localeCompare(String(b.subject), 'tr');
    });

    // Retroaktif ket vurma: aynı benzerlik grubundan iki ders yan yana
    // gelirse (ör. Fizik → Kimya), yük seviyesi aynı olan başka bir işle
    // yer değiştirilir. Yük sıralaması bozulmaz, sadece komşuluk değişir.
    if (avoidSimilarAdjacent) {
        for (let i = 1; i < payloads.length; i++) {
            if (similarityGroup(payloads[i - 1].subject) !== similarityGroup(payloads[i].subject)) continue;

            const swapIdx = payloads.findIndex((p, j) =>
                j > i &&
                LOAD_BY_TYPE[p.type] === LOAD_BY_TYPE[payloads[i].type] &&
                similarityGroup(p.subject) !== similarityGroup(payloads[i - 1].subject)
            );
            if (swapIdx > -1) {
                const tmp = payloads[i];
                payloads[i] = payloads[swapIdx];
                payloads[swapIdx] = tmp;
            }
        }
    }

    movable.forEach((slot, i) => { schedule[slot.key] = payloads[i]; });
}

function emptyStats() {
    return {
        konu: 0, soru: 0, tekrar: 0, deneme: 0,
        analiz: 0, paragraf: 0, kitap: 0, mola: 0,
        totalPlaced: 0,
    };
}

function bumpStat(stats, type) {
    if (type && Object.prototype.hasOwnProperty.call(stats, type)) stats[type]++;
}

export default distributeToSlots;
