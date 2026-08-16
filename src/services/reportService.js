/**
 * 📊 MERKEZİ RAPOR MOTORU
 *
 * Tüm raporlama/analiz yüzeylerinin (veli portalı, WhatsApp şablonları,
 * PDF karne, koç paneli) tek bir veri kaynağından beslenmesi için.
 *
 * Buradaki fonksiyonlar saf: localStorage'dan okur, hesaplar, döner.
 * Hiçbir UI bağımlılığı yok.
 */

// ════════════════════════════════════════════════════════════
//  Yardımcılar
// ════════════════════════════════════════════════════════════

const safeParse = (key, fallback = []) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw || !raw.trim() || raw === 'undefined' || raw === 'null') return fallback;
        const parsed = JSON.parse(raw);
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
};

/** Türkçe karakterleri normalize ederek karşılaştırılabilir hale getirir. */
export const normTR = (str = '') =>
    String(str)
        .toLocaleLowerCase('tr-TR')
        .replace(/ı/g, 'i').replace(/İ/g, 'i')
        .replace(/ş/g, 's').replace(/ğ/g, 'g')
        .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/\s+/g, ' ')
        .trim();

const DAY_MS = 24 * 60 * 60 * 1000;

const daysAgo = (n) => Date.now() - n * DAY_MS;

const toTime = (value) => {
    if (!value) return 0;
    const t = new Date(value).getTime();
    return Number.isNaN(t) ? 0 : t;
};

/** Bir kaydın tarihini olası alanlardan çıkarır. */
const recordTime = (rec) =>
    toTime(rec?.date || rec?.uploadedAt || rec?.createdAt || rec?.startedAt || rec?.completedAt || rec?.assignedAt);

const round = (n, d = 1) => {
    const f = Math.pow(10, d);
    return Math.round((Number(n) || 0) * f) / f;
};

// ════════════════════════════════════════════════════════════
//  Ders etiketleri
// ════════════════════════════════════════════════════════════

export const SUBJECT_LABELS = {
    tyt_turkce: 'Türkçe',
    tyt_matematik: 'Matematik',
    tyt_geometri: 'Geometri',
    tyt_fen: 'Fen Bilimleri',
    tyt_fizik: 'Fizik',
    tyt_kimya: 'Kimya',
    tyt_biyoloji: 'Biyoloji',
    tyt_sosyal: 'Sosyal Bilimler',
    tyt_tarih: 'Tarih',
    tyt_cografya: 'Coğrafya',
    tyt_felsefe: 'Felsefe',
    tyt_din: 'Din Kültürü',
    // Excel parser'ın ürettiği sade anahtarlar
    turkce: 'Türkçe',
    matematik: 'Matematik',
    geometri: 'Geometri',
    fizik: 'Fizik',
    kimya: 'Kimya',
    biyoloji: 'Biyoloji',
    tarih: 'Tarih',
    cografya: 'Coğrafya',
    felsefe: 'Felsefe',
    din: 'Din Kültürü',
    edebiyat: 'Edebiyat',
    mat: 'Matematik',
    fen: 'Fen Bilimleri',
    sosyal: 'Sosyal Bilimler',
};

/**
 * Ders değil, toplam satırı olan anahtarlar.
 * Excel parser hem ders bazlı hem grup toplamı üretiyor
 * (sosyal_toplam, mat_toplam, fen_toplam, toplam_genel) — bunlar
 * ders analizine girerse "en güçlü ders: Toplam" gibi saçma sonuç çıkıyor.
 */
const isAggregateKey = (key = '', name = '') =>
    /(^|_)toplam(_|$)|^genel/.test(String(key).toLowerCase()) ||
    normTR(name) === 'toplam' ||
    normTR(name) === 'genel toplam';

const labelFor = (key, fallbackName) =>
    SUBJECT_LABELS[key] || fallbackName || key;

// ════════════════════════════════════════════════════════════
//  Öğrenci ↔ Deneme sonucu eşleştirme
// ════════════════════════════════════════════════════════════

/**
 * Deneme sonuçları Excel'den geldiği için öğrenci kaydına doğrudan ID ile
 * bağlı değil. Sırayla okul numarası → tam isim → ad/soyad parçası denenir.
 */
export const matchResultsForStudent = (student, allResults) => {
    if (!student) return [];
    const results = Array.isArray(allResults) ? allResults : safeParse('v2_results_data');

    const sNo = String(student.schoolNumber || '').trim();
    const sName = normTR(student.name || '');
    const sParts = sName.split(' ').filter((p) => p.length > 1);

    if (sNo) {
        const byNumber = results.filter(
            (r) => String(r.number ?? r.schoolNumber ?? '').trim() === sNo
        );
        if (byNumber.length > 0) return byNumber;
    }

    const byId = results.filter(
        (r) => r.studentId != null && String(r.studentId) === String(student.id)
    );
    if (byId.length > 0) return byId;

    if (!sName) return [];

    const byExactName = results.filter((r) => normTR(r.student || r.name || '') === sName);
    if (byExactName.length > 0) return byExactName;

    if (sParts.length === 0) return [];
    return results.filter((r) => {
        const rName = normTR(r.student || '');
        if (!rName) return false;
        const rParts = rName.split(' ').filter((p) => p.length > 1);
        // Ad ve soyadın ikisi de eşleşmeli — tek parça eşleşmesi yanlış öğrenciyi getiriyor
        const matches = sParts.filter((sp) => rParts.some((rp) => rp === sp));
        return matches.length >= Math.min(2, sParts.length);
    });
};

/** Öğrencinin görevlerini döner. student_tasks hem dizi hem map olabiliyor. */
export const getStudentTasks = (student, allTasks) => {
    if (!student) return [];
    const raw = allTasks ?? safeParse('student_tasks');

    if (Array.isArray(raw)) {
        return raw.filter(
            (t) =>
                String(t.studentId) === String(student.id) ||
                (t.selectedStudents && t.selectedStudents.some((id) => String(id) === String(student.id)))
        );
    }
    if (raw && typeof raw === 'object') {
        return Array.isArray(raw[student.id]) ? raw[student.id] : [];
    }
    return [];
};

const isTaskDone = (t) =>
    Boolean(t?.completed || t?.done || t?.status === 'Tamamlandı' || t?.status === 'completed');

// ════════════════════════════════════════════════════════════
//  Program uyumu
// ════════════════════════════════════════════════════════════

/**
 * Öğrenciye atanan haftalık programın ne kadarının yapıldığı.
 * Bu, karnenin en canlı göstergesi: deneme sonuçları haftada bir
 * gelirken program uyumu her gün güncelleniyor.
 */
export const buildProgramSummary = (student) => {
    const schedule = safeParse(`program_schedule_${student?.id}`, {});
    const empty = {
        hasProgram: false, planned: 0, done: 0, missed: 0, pending: 0,
        rate: null, lastWeek: null, weeks: [], weakSubjects: [], unfinished: [],
    };
    if (!student?.id || !schedule || Object.keys(schedule).length === 0) return empty;

    const progress = safeParse('program_progress', {})[String(student.id)] || {};

    // Programda kaç ay/hafta var, anahtarlardan çıkar
    let maxMonth = 1;
    for (const k of Object.keys(schedule)) {
        const m = /^m(\d+)-w(\d+)-/.exec(k);
        if (m) maxMonth = Math.max(maxMonth, Number(m[1]));
    }

    const STUDY = new Set(['konu', 'soru', 'tekrar']);
    const weeks = [];
    let planned = 0, done = 0, missed = 0;
    const subjectMap = new Map();
    const unfinished = [];

    for (let m = 1; m <= maxMonth; m++) {
        for (let w = 1; w <= 4; w++) {
            const prefix = `m${m}-w${w}-`;
            const keys = Object.keys(schedule).filter((k) => k.startsWith(prefix));
            if (!keys.length) continue;

            let wp = 0, wd = 0, wm = 0;
            for (const key of keys) {
                const cell = schedule[key];
                if (!cell) continue;
                const status = progress[key]?.status;
                wp++; planned++;
                if (status === 'done') { wd++; done++; }
                else if (status === 'missed') { wm++; missed++; }

                if (STUDY.has(cell.type || 'konu') && cell.subject) {
                    if (!subjectMap.has(cell.subject)) {
                        subjectMap.set(cell.subject, { subject: cell.subject, planned: 0, done: 0 });
                    }
                    const s = subjectMap.get(cell.subject);
                    s.planned++;
                    if (status === 'done') s.done++;
                }

                if (status !== 'done' && STUDY.has(cell.type || 'konu')) {
                    unfinished.push({ month: m, week: w, subject: cell.subject, topic: cell.topic, status: status || 'pending' });
                }
            }

            weeks.push({
                month: m, week: w, planned: wp, done: wd, missed: wm,
                rate: wp ? Math.round((wd / wp) * 100) : null,
            });
        }
    }

    const bySubject = [...subjectMap.values()]
        .map((s) => ({ ...s, rate: s.planned ? Math.round((s.done / s.planned) * 100) : null }))
        .sort((a, b) => (a.rate ?? 101) - (b.rate ?? 101));

    // "Son hafta" = programdaki son hafta DEĞİL, üzerinde çalışılmış son hafta.
    // Aksi halde bugün oluşturulan 4 haftalık bir program, 4. haftası
    // henüz gelmediği için anında %0 uyum ve yüksek risk gösterirdi.
    const workedWeeks = weeks.filter((w) => w.done + w.missed > 0);
    const lastWorkedWeek = workedWeeks.length ? workedWeeks[workedWeeks.length - 1] : null;

    return {
        hasProgram: true,
        planned,
        done,
        missed,
        pending: planned - done - missed,
        rate: planned ? Math.round((done / planned) * 100) : null,
        // Henüz hiç işaretleme yoksa uyum oranı "kötü" değil, "bilinmiyor"
        started: workedWeeks.length > 0,
        weeks,
        lastWeek: lastWorkedWeek,
        bySubject,
        // Uyum %60'ın altındaki dersler koçun müdahale etmesi gereken yerler
        weakSubjects: bySubject.filter((s) => s.rate != null && s.rate < 60 && s.planned >= 2),
        unfinished: unfinished.slice(0, 20),
    };
};

// ════════════════════════════════════════════════════════════
//  Ders bazlı analiz
// ════════════════════════════════════════════════════════════

/** Tek bir deneme sonucundan { key, label, net } listesi çıkarır. */
const extractSubjects = (result) => {
    if (!result) return [];
    const out = [];

    if (result.subjects && typeof result.subjects === 'object') {
        for (const [key, val] of Object.entries(result.subjects)) {
            const name = typeof val === 'object' ? val?.name : null;
            if (isAggregateKey(key, name)) continue; // toplam satırları ders değil
            const net = typeof val === 'object' ? Number(val?.net) : Number(val);
            if (!Number.isFinite(net)) continue;
            out.push({ key, label: labelFor(key, name), net });
        }
    }

    if (out.length === 0) {
        for (const key of ['turkce', 'mat', 'fen', 'sosyal']) {
            const net = Number(result[key]);
            if (Number.isFinite(net)) out.push({ key, label: labelFor(key), net });
        }
    }

    return out;
};

/**
 * Son denemedeki ders netlerini, bir önceki denemeye göre değişimiyle birlikte döner.
 * Güçlü/zayıf ders tespiti bunun üzerinden yapılır.
 */
export const buildSubjectBreakdown = (sortedResults) => {
    if (!sortedResults || sortedResults.length === 0) return [];

    const latest = extractSubjects(sortedResults[0]);
    if (latest.length === 0) return [];

    const previous = sortedResults.length > 1 ? extractSubjects(sortedResults[1]) : [];
    const prevMap = new Map(previous.map((s) => [s.key, s.net]));

    // Ortalama: öğrencinin tüm denemelerindeki ders ortalaması
    const history = new Map();
    for (const r of sortedResults) {
        for (const s of extractSubjects(r)) {
            if (!history.has(s.key)) history.set(s.key, []);
            history.get(s.key).push(s.net);
        }
    }

    return latest
        .map((s) => {
            const prev = prevMap.get(s.key);
            const all = history.get(s.key) || [s.net];
            const avg = all.reduce((a, b) => a + b, 0) / all.length;
            const delta = Number.isFinite(prev) ? round(s.net - prev) : null;
            return {
                key: s.key,
                label: s.label,
                net: round(s.net),
                avg: round(avg),
                delta,
                trend: delta == null ? 'stable' : delta > 0.5 ? 'up' : delta < -0.5 ? 'down' : 'stable',
            };
        })
        .sort((a, b) => b.net - a.net);
};

// ════════════════════════════════════════════════════════════
//  Günlük çalışma kaydı özeti
// ════════════════════════════════════════════════════════════

/**
 * Öğrencinin kendi girdiği günlük soru/sayfa kayıtlarını özetler.
 * Deneme sonuçları haftada bir gelirken bu veri her gün akıyor —
 * karnedeki en taze sinyal.
 */
export const buildDailyLogSummary = (student, days = 7) => {
    const empty = {
        hasData: false, questions: 0, correct: 0, wrong: 0, blank: 0,
        net: 0, accuracy: null, pages: 0, activeDays: 0,
        avgQuestionsPerDay: 0, avgPagesPerDay: 0, bySubject: [], weakestSubject: null,
    };
    if (!student?.id) return empty;

    const since = Date.now() - days * DAY_MS;
    const all = safeParse('study_log', []);
    const list = all.filter(
        (e) => String(e.studentId) === String(student.id) && toTime(e.date) >= since
    );
    if (!list.length) return empty;

    const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

    let correct = 0, wrong = 0, blank = 0, pages = 0;
    const dates = new Set();
    const subjMap = new Map();

    for (const e of list) {
        dates.add(e.date);
        if (e.kind === 'kitap') {
            pages += n(e.pages);
            continue;
        }
        correct += n(e.correct);
        wrong += n(e.wrong);
        blank += n(e.blank);

        if (!e.subject) continue;
        if (!subjMap.has(e.subject)) {
            subjMap.set(e.subject, { subject: e.subject, correct: 0, wrong: 0, blank: 0 });
        }
        const s = subjMap.get(e.subject);
        s.correct += n(e.correct);
        s.wrong += n(e.wrong);
        s.blank += n(e.blank);
    }

    const questions = correct + wrong + blank;
    const bySubject = [...subjMap.values()]
        .map((s) => ({
            ...s,
            questions: s.correct + s.wrong + s.blank,
            net: round(s.correct - s.wrong / 4, 2),
            accuracy: s.correct + s.wrong > 0 ? Math.round((s.correct / (s.correct + s.wrong)) * 100) : null,
        }))
        .sort((a, b) => b.questions - a.questions);

    return {
        hasData: true,
        questions,
        correct,
        wrong,
        blank,
        net: round(correct - wrong / 4, 2),
        accuracy: correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : null,
        pages,
        activeDays: dates.size,
        avgQuestionsPerDay: days ? Math.round(questions / days) : 0,
        avgPagesPerDay: days ? Math.round(pages / days) : 0,
        bySubject,
        weakestSubject: [...bySubject]
            .filter((s) => s.correct + s.wrong >= 10)
            .sort((a, b) => (a.accuracy ?? 101) - (b.accuracy ?? 101))[0] || null,
    };
};

// ════════════════════════════════════════════════════════════
//  Risk skoru
// ════════════════════════════════════════════════════════════

/**
 * 0–100 arası risk skoru. Yüksek = müdahale gerekiyor.
 * Bileşenler: net düşüşü, görev tamamlama oranı, çalışma süresi, son aktivite.
 */
export const computeRiskScore = ({ netTrend, taskCompletion, studyMinutes, daysSinceActivity, examCount, programRate }) => {
    let score = 0;
    const reasons = [];

    // Program uyumu en taze sinyal: deneme haftada bir gelirken
    // program her gün işaretleniyor.
    if (programRate != null) {
        if (programRate < 40) {
            score += 30;
            reasons.push(`Haftalık programın yalnızca %${programRate}'i yapıldı`);
        } else if (programRate < 70) {
            score += 14;
            reasons.push(`Program uyumu düşük (%${programRate})`);
        }
    }

    if (examCount >= 2 && netTrend != null && netTrend < -2) {
        score += 30;
        reasons.push(`Son denemede ${Math.abs(round(netTrend))} net düşüş`);
    } else if (examCount >= 2 && netTrend != null && netTrend < 0) {
        score += 12;
        reasons.push('Netlerde hafif gerileme');
    }

    if (taskCompletion != null) {
        if (taskCompletion < 0.3) {
            score += 30;
            reasons.push(`Görevlerin yalnızca %${Math.round(taskCompletion * 100)}'i tamamlandı`);
        } else if (taskCompletion < 0.6) {
            score += 15;
            reasons.push(`Görev tamamlama oranı düşük (%${Math.round(taskCompletion * 100)})`);
        }
    }

    if (studyMinutes < 120) {
        score += 20;
        reasons.push('Haftalık çalışma süresi 2 saatin altında');
    } else if (studyMinutes < 300) {
        score += 8;
    }

    if (daysSinceActivity == null) {
        score += 15;
        reasons.push('Hiç aktivite kaydı yok');
    } else if (daysSinceActivity > 7) {
        score += 20;
        reasons.push(`${daysSinceActivity} gündür aktivite yok`);
    } else if (daysSinceActivity > 3) {
        score += 8;
    }

    score = Math.max(0, Math.min(100, score));
    const level = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';
    const levelLabel = { high: 'Yüksek Risk', medium: 'İzlenmeli', low: 'İyi Durumda' }[level];

    return { score, level, levelLabel, reasons };
};

// ════════════════════════════════════════════════════════════
//  Ana rapor üreteci
// ════════════════════════════════════════════════════════════

/**
 * Bir öğrenci için tam performans raporu üretir.
 *
 * @param {object} student - coach_students kaydı
 * @param {object} [options]
 * @param {number} [options.periodDays=7] - Dönem uzunluğu (7 = haftalık, 30 = aylık)
 * @returns {object} rapor
 */
export const buildStudentReport = (student, options = {}) => {
    const { periodDays = 7 } = options;
    const periodStart = daysAgo(periodDays);
    const prevPeriodStart = daysAgo(periodDays * 2);

    const allResults = safeParse('v2_results_data');
    const results = matchResultsForStudent(student, allResults);
    const sorted = [...results].sort((a, b) => recordTime(b) - recordTime(a));

    // ── Netler ──────────────────────────────────────────────
    const nets = sorted.map((r) => Number(r.totalNet) || 0);
    const lastNet = nets.length ? round(nets[0]) : null;
    const prevNet = nets.length > 1 ? round(nets[1]) : null;
    const netTrend = lastNet != null && prevNet != null ? round(lastNet - prevNet) : null;
    const avgNet = nets.length ? round(nets.reduce((a, b) => a + b, 0) / nets.length) : null;
    const bestNet = nets.length ? round(Math.max(...nets)) : null;

    // ── Görevler ────────────────────────────────────────────
    const allTasks = getStudentTasks(student);
    const periodTasks = allTasks.filter((t) => recordTime(t) >= periodStart);
    const doneTasks = periodTasks.filter(isTaskDone).length;
    const taskCompletion = periodTasks.length > 0 ? doneTasks / periodTasks.length : null;
    const overdueTasks = allTasks.filter(
        (t) => !isTaskDone(t) && t.dueDate && toTime(t.dueDate) < Date.now()
    );

    // ── Çalışma süresi (pomodoro) ───────────────────────────
    const pomLogs = safeParse(`pomodoro_log_${student?.id}`);
    const periodPom = pomLogs.filter((l) => recordTime(l) >= periodStart);
    const prevPom = pomLogs.filter((l) => {
        const t = recordTime(l);
        return t >= prevPeriodStart && t < periodStart;
    });
    const studyMinutes = periodPom.reduce((s, l) => s + (Number(l.minutes) || 25), 0);
    const prevStudyMinutes = prevPom.reduce((s, l) => s + (Number(l.minutes) || 25), 0);
    const studyDelta = prevStudyMinutes > 0 ? studyMinutes - prevStudyMinutes : null;

    // ── Oyunlaştırma ────────────────────────────────────────
    const gam = safeParse(`gamification_stats_${student?.id}`, {});

    // ── Son aktivite ────────────────────────────────────────
    // Günlük çalışma kaydı ve program işaretlemeleri de aktivitedir;
    // bunlar sayılmazsa her gün soru çözen bir öğrenci "hiç aktivite yok"
    // diye riskli görünüyordu.
    const logTimes = safeParse('study_log', [])
        .filter((e) => String(e.studentId) === String(student?.id))
        .map((e) => toTime(e.createdAt || e.date));

    const progressTimes = Object.values(
        safeParse('program_progress', {})[String(student?.id)] || {}
    ).map((p) => toTime(p?.at));

    const activityTimes = [
        ...periodPom.map(recordTime),
        ...allTasks.filter(isTaskDone).map(recordTime),
        ...sorted.map(recordTime),
        ...logTimes,
        ...progressTimes,
    ].filter(Boolean);
    const lastActivity = activityTimes.length ? Math.max(...activityTimes) : null;
    const daysSinceActivity = lastActivity ? Math.floor((Date.now() - lastActivity) / DAY_MS) : null;

    // ── Ders analizi ────────────────────────────────────────
    const subjects = buildSubjectBreakdown(sorted);
    const strongest = subjects.length ? subjects[0] : null;
    const weakest = subjects.length ? subjects[subjects.length - 1] : null;
    const mostImproved = subjects
        .filter((s) => s.delta != null)
        .sort((a, b) => b.delta - a.delta)[0] || null;
    const mostDropped = subjects
        .filter((s) => s.delta != null)
        .sort((a, b) => a.delta - b.delta)[0] || null;

    // ── Program uyumu ───────────────────────────────────────
    const program = buildProgramSummary(student);

    // ── Günlük çalışma kaydı (soru / kitap sayfası) ─────────
    const dailyLog = buildDailyLogSummary(student, periodDays);

    // ── Risk ────────────────────────────────────────────────
    const risk = computeRiskScore({
        netTrend,
        taskCompletion,
        studyMinutes,
        daysSinceActivity,
        examCount: results.length,
        // Programa hiç dokunulmamışsa uyum oranını risk hesabına katma —
        // yeni atanmış bir program "yapılmamış" sayılmamalı.
        programRate: program.hasProgram && program.started ? program.lastWeek?.rate ?? null : null,
    });

    // ── Hedef ───────────────────────────────────────────────
    const goals = safeParse(`student_goals_${student?.id}`, {});
    const targetNet = Number(goals.targetNet) || Number(student?.targetNet) || null;
    const goalProgress =
        targetNet && lastNet != null ? Math.min(100, Math.round((lastNet / targetNet) * 100)) : null;

    return {
        student: {
            id: student?.id,
            name: student?.name || '',
            firstName: (student?.name || '').split(' ')[0] || '',
            schoolNumber: student?.schoolNumber || '',
            grade: student?.grade || '',
            section: student?.section || '',
            target: student?.target || '',
            parentName: student?.parentName || '',
            parentPhone: student?.parentPhone || '',
            phone: student?.phone || '',
        },
        period: { days: periodDays, label: periodDays <= 7 ? 'Haftalık' : 'Aylık', start: periodStart },
        exams: {
            count: results.length,
            lastNet,
            prevNet,
            netTrend,
            avgNet,
            bestNet,
            lastExamName: sorted[0]?.name || sorted[0]?.trialName || null,
            lastExamDate: sorted[0] ? recordTime(sorted[0]) : null,
            lastExamType: sorted[0]?.examType || null,
            classRank: sorted[0]?.ranks?.sinif || null,
            schoolRank: sorted[0]?.ranks?.kurum || null,
            history: sorted
                .slice(0, 10)
                .reverse()
                .map((r) => ({
                    name: r.name || r.trialName || 'Deneme',
                    net: round(Number(r.totalNet) || 0),
                    date: recordTime(r),
                    examType: r.examType || null,
                })),
        },
        tasks: {
            total: periodTasks.length,
            done: doneTasks,
            completion: taskCompletion,
            completionPct: taskCompletion == null ? null : Math.round(taskCompletion * 100),
            overdue: overdueTasks.length,
            overdueTitles: overdueTasks.slice(0, 5).map((t) => t.title || 'Görev'),
        },
        study: {
            minutes: studyMinutes,
            hours: round(studyMinutes / 60),
            delta: studyDelta,
            sessions: periodPom.length,
        },
        gamification: {
            xp: Number(gam.totalXP) || 0,
            level: Number(gam.level) || 1,
            streak: Number(gam.currentStreak) || 0,
            badges: Array.isArray(gam.badges) ? gam.badges.length : 0,
        },
        program,
        dailyLog,
        subjects,
        highlights: { strongest, weakest, mostImproved, mostDropped },
        risk,
        goal: { targetNet, progress: goalProgress },
        activity: { lastActivity, daysSinceActivity },
        generatedAt: Date.now(),
    };
};

/**
 * Tüm sınıf için toplu rapor — koç panelindeki genel bakış ve
 * risk listesi bunun üzerinden çalışır.
 */
export const buildClassReport = (students = [], options = {}) => {
    const reports = students.map((s) => buildStudentReport(s, options));
    const withNet = reports.filter((r) => r.exams.lastNet != null);

    const avgNet = withNet.length
        ? round(withNet.reduce((sum, r) => sum + r.exams.lastNet, 0) / withNet.length)
        : null;

    const totalStudyMinutes = reports.reduce((sum, r) => sum + r.study.minutes, 0);
    const completions = reports.map((r) => r.tasks.completion).filter((c) => c != null);
    const avgCompletion = completions.length
        ? completions.reduce((a, b) => a + b, 0) / completions.length
        : null;

    return {
        studentCount: students.length,
        activeCount: reports.filter((r) => r.activity.daysSinceActivity != null && r.activity.daysSinceActivity <= 7).length,
        avgNet,
        avgCompletionPct: avgCompletion == null ? null : Math.round(avgCompletion * 100),
        totalStudyHours: round(totalStudyMinutes / 60),
        atRisk: reports.filter((r) => r.risk.level === 'high').sort((a, b) => b.risk.score - a.risk.score),
        watchList: reports.filter((r) => r.risk.level === 'medium'),
        topPerformers: [...withNet].sort((a, b) => b.exams.lastNet - a.exams.lastNet).slice(0, 5),
        mostImproved: [...withNet]
            .filter((r) => r.exams.netTrend != null && r.exams.netTrend > 0)
            .sort((a, b) => b.exams.netTrend - a.exams.netTrend)
            .slice(0, 5),
        reports,
        generatedAt: Date.now(),
    };
};

/**
 * 🧾 LİSTE İÇİN HAFİF DURUM ÖZETİ
 *
 * Koç ana listesinde 50+ öğrenciyi tek bakışta taramak için.
 * buildStudentReport her öğrenci için grafik geçmişi, ders kırılımı vb.
 * üretiyor — liste için gereksiz. Bu fonksiyon ortak verileri BİR KEZ
 * okuyup her öğrenci için yalnızca göstergeye giren alanları döner.
 */
export const buildRosterStatus = (students = []) => {
    const allResults = safeParse('v2_results_data');
    const allProgress = safeParse('program_progress', {});
    const allLogs = safeParse('study_log', []);
    const allTasks = safeParse('student_tasks');
    const weekAgo = daysAgo(7);

    // Günlük kayıtları öğrenciye göre grupla (tek geçiş)
    const logsByStudent = new Map();
    for (const e of allLogs) {
        const sid = String(e.studentId);
        if (!logsByStudent.has(sid)) logsByStudent.set(sid, []);
        logsByStudent.get(sid).push(e);
    }

    return students.map((student) => {
        const sid = String(student.id);

        // ── Program uyumu (yalnızca çalışılmış haftalar) ──
        const schedule = safeParse(`program_schedule_${sid}`, {});
        const progress = allProgress[sid] || {};
        let planned = 0, done = 0, marked = 0;
        const weekAgg = new Map();

        for (const [key, cell] of Object.entries(schedule)) {
            if (!cell) continue;
            planned++;
            const status = progress[key]?.status;
            if (status === 'done') done++;
            if (status) marked++;

            const m = /^m(\d+)-w(\d+)-/.exec(key);
            if (!m) continue;
            const wk = `${m[1]}-${m[2]}`;
            if (!weekAgg.has(wk)) weekAgg.set(wk, { order: Number(m[1]) * 10 + Number(m[2]), planned: 0, done: 0, marked: 0 });
            const agg = weekAgg.get(wk);
            agg.planned++;
            if (status === 'done') agg.done++;
            if (status) agg.marked++;
        }

        const workedWeeks = [...weekAgg.values()]
            .filter((w) => w.marked > 0)
            .sort((a, b) => a.order - b.order);
        const lastWorked = workedWeeks.length ? workedWeeks[workedWeeks.length - 1] : null;

        const programRate = lastWorked && lastWorked.planned
            ? Math.round((lastWorked.done / lastWorked.planned) * 100)
            : null;

        // ── Denemeler ──
        const results = matchResultsForStudent(student, allResults);
        const sorted = [...results].sort((a, b) => recordTime(b) - recordTime(a));
        const lastNet = sorted.length ? round(Number(sorted[0].totalNet) || 0) : null;
        const prevNet = sorted.length > 1 ? round(Number(sorted[1].totalNet) || 0) : null;
        const netTrend = lastNet != null && prevNet != null ? round(lastNet - prevNet) : null;

        // ── Günlük kayıt (7 gün) ──
        const logs = (logsByStudent.get(sid) || []).filter((e) => toTime(e.date) >= weekAgo);
        let questions = 0, pages = 0, correct = 0, wrong = 0;
        for (const e of logs) {
            if (e.kind === 'kitap') pages += Number(e.pages) || 0;
            else {
                correct += Number(e.correct) || 0;
                wrong += Number(e.wrong) || 0;
                questions += (Number(e.correct) || 0) + (Number(e.wrong) || 0) + (Number(e.blank) || 0);
            }
        }

        /**
         * BUGÜNKÜ kayıt ayrıca tutulur. Liste satırında "bu hafta 240 soru"
         * ile "bugün 0 soru" çok farklı iki bilgi; koç öğrencinin bugün
         * çalışıp çalışmadığını haftalık toplamdan göremiyordu.
         */
        const bugunKey = (() => {
            const d = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        })();
        let todayQuestions = 0, todayPages = 0;
        for (const e of (logsByStudent.get(sid) || [])) {
            if (String(e.date) !== bugunKey) continue;
            if (e.kind === 'kitap') todayPages += Number(e.pages) || 0;
            else todayQuestions += (Number(e.correct) || 0) + (Number(e.wrong) || 0) + (Number(e.blank) || 0);
        }

        // Haftalık isabet oranı — soru sayısı tek başına yanıltıcı olabilir
        const accuracy = (correct + wrong) > 0
            ? Math.round((correct / (correct + wrong)) * 100)
            : null;

        // ── Görevler ──
        const tasks = getStudentTasks(student, allTasks).filter((t) => recordTime(t) >= weekAgo);
        const tasksDone = tasks.filter(isTaskDone).length;
        const taskCompletion = tasks.length ? tasksDone / tasks.length : null;

        // ── Son aktivite ──
        const times = [
            ...logs.map((e) => toTime(e.createdAt || e.date)),
            ...Object.values(progress).map((p) => toTime(p?.at)),
            ...sorted.map(recordTime),
        ].filter(Boolean);
        const lastActivity = times.length ? Math.max(...times) : null;
        const daysSinceActivity = lastActivity
            ? Math.floor((Date.now() - lastActivity) / DAY_MS)
            : null;

        const pomLogs = safeParse(`pomodoro_log_${sid}`);
        const studyMinutes = pomLogs
            .filter((l) => recordTime(l) >= weekAgo)
            .reduce((s, l) => s + (Number(l.minutes) || 25), 0);

        const risk = computeRiskScore({
            netTrend,
            taskCompletion,
            studyMinutes: studyMinutes + logs.reduce((s, e) => s + (Number(e.minutes) || 0), 0),
            daysSinceActivity,
            examCount: results.length,
            programRate,
        });

        return {
            id: student.id,
            hasProgram: planned > 0,
            programStarted: workedWeeks.length > 0,
            programRate,
            programOverallRate: planned ? Math.round((done / planned) * 100) : null,
            lastNet,
            netTrend,
            examCount: results.length,
            questions,
            pages,
            accuracy,
            todayQuestions,
            todayPages,
            examLastDate: sorted.length ? new Date(recordTime(sorted[0])).toISOString().slice(0, 10) : null,
            tasksDone,
            tasksTotal: tasks.length,
            daysSinceActivity,
            risk,
        };
    });
};

export default {
    buildStudentReport,
    buildRosterStatus,
    buildProgramSummary,
    buildDailyLogSummary,
    buildClassReport,
    matchResultsForStudent,
    getStudentTasks,
    buildSubjectBreakdown,
    computeRiskScore,
    normTR,
    SUBJECT_LABELS,
};
