/**
 * 📗 GÜNLÜK ÇALIŞMA KAYDI
 *
 * Öğrencinin gün gün, konu konu girdiği:
 *   - çözülen soru sayısı (doğru / yanlış / boş)
 *   - okunan kitap sayfası
 *   - çalışma süresi
 *
 * Tek bir senkronize anahtarda (`study_log`) tutulur ki koç anlık görebilsin.
 * Kayıtlar diziye eklenir; düzeltme/silme id üzerinden yapılır.
 *
 * Kayıt şekli:
 *   {
 *     id, studentId, date: 'YYYY-MM-DD',
 *     kind: 'soru' | 'kitap',
 *     subject, topic,            // kitap için subject = kitap adı
 *     correct, wrong, blank,     // soru
 *     pages,                     // kitap
 *     minutes, note, createdAt
 *   }
 */

const KEY = 'study_log';

const safeParse = () => {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw || !raw.trim()) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

// Arka arkaya birkaç kayıt girilirse tek bulut yazımı yeter; her giriş için
// ayrı yazım gönderilirse geri dönen eski anlık görüntü yenileri ezebiliyor.
let syncTimer = null;

const scheduleSync = () => {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
        syncTimer = null;
        try { window.firebaseSync?.syncKey?.(KEY); } catch { /* senkron yoksa sorun değil */ }
    }, 1500);
};

const persist = (entries) => {
    localStorage.setItem(KEY, JSON.stringify(entries));
    try {
        window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
    } catch { /* ignore */ }
    scheduleSync();
};

/** 'YYYY-MM-DD' — yerel saate göre, UTC kaymasına takılmadan. */
export const todayKey = (d = new Date()) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const dateKeyFrom = (date) => todayKey(new Date(date));

/**
 * N GÜNLÜK PENCERENİN İLK GÜNÜ — 'YYYY-MM-DD'.
 * `gun = 7` → bugün dahil son 7 gün, yani 6 gün öncesi.
 *
 * ⚠️ NEDEN ANAHTARLA ÇALIŞIYORUZ
 * Pencere eskiden `Date.now() − gün × 86400000` ile kuruluyor, kayıt
 * tarihi ise `new Date('2026-08-24')` ile çözülüyordu. Bu tarih UTC gece
 * yarısıdır, sınır ise yerel "şu an"; UTC+3'te pencere fiilen 8 gün
 * geniş oluyordu. Ölçüldü: bugün 10 + 6 gün önce 20 + 7 gün önce 40 soru
 * girildiğinde `getSummary(id, 7)` 70 döndürdü — doğrusu 30.
 *
 * Aynı ekranda üst KPI kartları bunu, alttaki gelişim panosu
 * `gelisimAnalitik.calismaOzeti`yi kullandığı için "Son 7 gün" etiketi
 * iki farklı sayı gösteriyordu. Artık iki taraf da yerel gün anahtarı
 * karşılaştırıyor.
 */
export const pencereBasi = (gun = 7, d = new Date()) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - (Math.max(1, gun) - 1));
    return todayKey(x);
};

// ════════════════════════════════════════════════════════════
//  CRUD
// ════════════════════════════════════════════════════════════

/**
 * @param {string} [opts.since]    'YYYY-MM-DD' — bu gün DAHİL sonrası
 * @param {string} [opts.date]     tek gün
 */
export const getEntries = (studentId, { since, date } = {}) => {
    let list = safeParse().filter((e) => String(e.studentId) === String(studentId));
    if (date) list = list.filter((e) => e.date === date);
    if (since) {
        /* Metin karşılaştırması: 'YYYY-MM-DD' biçiminde sözlük sırası =
           takvim sırasıdır ve saat diliminden etkilenmez. Eski sayısal
           zaman damgası desteği geriye dönük uyum için korunur. */
        const alt = typeof since === 'number' ? todayKey(new Date(since)) : String(since).slice(0, 10);
        list = list.filter((e) => String(e.date || '').slice(0, 10) >= alt);
    }
    return list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
};

export const addEntry = (studentId, entry) => {
    const all = safeParse();
    const record = {
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        studentId,
        date: entry.date || todayKey(),
        createdAt: new Date().toISOString(),
        ...entry,
    };
    const next = [record, ...all];
    persist(next);
    return record;
};

export const removeEntry = (entryId) => {
    const next = safeParse().filter((e) => e.id !== entryId);
    persist(next);
    return next;
};

// ════════════════════════════════════════════════════════════
//  Özetler
// ════════════════════════════════════════════════════════════

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/** Bir kayıt listesinin toplamları. */
const totals = (list) => {
    const t = {
        questions: 0, correct: 0, wrong: 0, blank: 0,
        pages: 0, minutes: 0, entries: list.length,
    };
    for (const e of list) {
        if (e.kind === 'kitap') {
            t.pages += num(e.pages);
        } else {
            t.correct += num(e.correct);
            t.wrong += num(e.wrong);
            t.blank += num(e.blank);
        }
        t.minutes += num(e.minutes);
    }
    t.questions = t.correct + t.wrong + t.blank;
    t.net = Math.round((t.correct - t.wrong / 4) * 100) / 100;
    t.accuracy = t.correct + t.wrong > 0
        ? Math.round((t.correct / (t.correct + t.wrong)) * 100)
        : null;
    return t;
};

/**
 * Dönem özeti + ders bazlı dağılım + günlük seri.
 * @param {number} days - kaç günlük pencere (varsayılan 7)
 */
export const getSummary = (studentId, days = 7) => {
    // Bugün DAHİL son `days` gün — bkz. pencereBasi'ndaki saat dilimi notu
    const list = getEntries(studentId, { since: pencereBasi(days) });

    const overall = totals(list);

    // Ders bazlı soru dağılımı
    const bySubjectMap = new Map();
    for (const e of list) {
        if (e.kind === 'kitap' || !e.subject) continue;
        if (!bySubjectMap.has(e.subject)) {
            bySubjectMap.set(e.subject, { subject: e.subject, correct: 0, wrong: 0, blank: 0, topics: new Set() });
        }
        const s = bySubjectMap.get(e.subject);
        s.correct += num(e.correct);
        s.wrong += num(e.wrong);
        s.blank += num(e.blank);
        if (e.topic) s.topics.add(e.topic);
    }

    const bySubject = [...bySubjectMap.values()]
        .map((s) => {
            const questions = s.correct + s.wrong + s.blank;
            return {
                subject: s.subject,
                questions,
                correct: s.correct,
                wrong: s.wrong,
                blank: s.blank,
                net: Math.round((s.correct - s.wrong / 4) * 100) / 100,
                accuracy: s.correct + s.wrong > 0 ? Math.round((s.correct / (s.correct + s.wrong)) * 100) : null,
                topicCount: s.topics.size,
            };
        })
        .sort((a, b) => b.questions - a.questions);

    // Gün gün seri (grafik için, eskiden yeniye)
    const byDayMap = new Map();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        byDayMap.set(todayKey(d), { date: todayKey(d), questions: 0, pages: 0 });
    }
    for (const e of list) {
        const bucket = byDayMap.get(e.date);
        if (!bucket) continue;
        if (e.kind === 'kitap') bucket.pages += num(e.pages);
        else bucket.questions += num(e.correct) + num(e.wrong) + num(e.blank);
    }
    const byDay = [...byDayMap.values()];

    const activeDays = byDay.filter((d) => d.questions > 0 || d.pages > 0).length;

    return {
        ...overall,
        days,
        bySubject,
        byDay,
        activeDays,
        avgQuestionsPerDay: days ? Math.round(overall.questions / days) : 0,
        avgPagesPerDay: days ? Math.round(overall.pages / days) : 0,
        // En çok yanlış yapılan ders — koçun ilk bakacağı yer
        weakestSubject: [...bySubject]
            .filter((s) => s.correct + s.wrong >= 10)
            .sort((a, b) => (a.accuracy ?? 101) - (b.accuracy ?? 101))[0] || null,
    };
};

/** Bugünün özeti — öğrenci ekranındaki "bugün" kartı için. */
export const getToday = (studentId) => totals(getEntries(studentId, { date: todayKey() }));

export default {
    todayKey,
    dateKeyFrom,
    getEntries,
    addEntry,
    removeEntry,
    getSummary,
    getToday,
};
