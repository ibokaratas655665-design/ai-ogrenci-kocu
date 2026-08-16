/**
 * 🎓 BEP SÜRECİ VERİ KATMANI
 *
 * Bireyselleştirilmiş Eğitim Programı, tek bir belge değil bir SÜREÇTİR:
 *
 *   1. Öğrenci kaydı        → RAM raporu, yetersizlik türü, kaynaştırma durumu
 *   2. BEP birimi           → derse giren öğretmenler, birim üyeleri
 *   3. Performans alma      → her ders için mevcut performans düzeyi
 *   4. BEP planı            → uzun/kısa dönemli amaçlar, yöntem, materyal
 *   5. BEP toplantıları     → tutanak, kararlar, katılımcılar
 *   6. Gelişim raporu       → dönemsel ilerleme ve amaç gerçekleşme oranı
 *
 * Hepsi tek bir senkronize anahtarda (`bep_data`) tutulur; koç, öğrenci ve
 * ana koç aynı veriyi görür.
 */

const KEY = 'bep_data';

const emptyStore = () => ({
    students: [],     // { id, studentId, name, class, disabilityType, ramReport, ramDate, iepStartDate, inclusionType, notes }
    teachers: [],     // { id, bepStudentId, name, branch, role, phone, email }
    performances: [], // { id, bepStudentId, course, term, level, strengths, needs, assessedBy, date }
    plans: [],        // { id, bepStudentId, course, longTermGoals[], shortTermGoals[], methods, materials, evaluation, startDate, endDate }
    meetings: [],     // { id, bepStudentId, date, type, attendees[], agenda, decisions, nextDate, createdBy }
    reports: [],      // { id, bepStudentId, term, period, goalProgress[], summary, recommendation, date }
});

const safeParse = () => {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw || !raw.trim()) return emptyStore();
        const parsed = JSON.parse(raw);
        return { ...emptyStore(), ...(parsed || {}) };
    } catch {
        return emptyStore();
    }
};

// Arka arkaya kayıt girildiğinde tek bulut yazımı yeter
let syncTimer = null;
const scheduleSync = () => {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
        syncTimer = null;
        try { window.firebaseSync?.syncKey?.(KEY); } catch { /* senkron yoksa sorun değil */ }
    }, 1500);
};

const persist = (store) => {
    localStorage.setItem(KEY, JSON.stringify(store));
    try { window.dispatchEvent(new StorageEvent('storage', { key: KEY })); } catch { /* ignore */ }
    scheduleSync();
};

const uid = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// ══════════════════════════════════════════════════════════════
//  Genel CRUD
// ══════════════════════════════════════════════════════════════

/**
 * Eski kayıt düzeltmesi: form eskiden HER role ders sorduğu için
 * rehber öğretmen / müdür yardımcısı / veli / öğrenci gibi derse
 * girmeyen üyelere de branş yazılabiliyordu. Bu kayıtlar tutanak ve
 * plan PDF'lerinde yanlış görünüyor; bir kez temizlenir.
 */
const NON_TEACHING = [
    'rehber', 'psikolojik danışman', 'birim başkanı', 'müdür',
    'veli', 'öğrenci', 'ram temsilcisi',
];

const migrateTeacherBranches = () => {
    const store = safeParse();
    const rows = store.teachers || [];
    let touched = false;

    store.teachers = rows.map((t) => {
        if (!t.branch) return t;
        const role = String(t.role || '').toLocaleLowerCase('tr-TR');
        // "Ders Öğretmeni" / "Özel Eğitim Öğretmeni" derse girer — dokunma
        if (/ders öğretmeni|özel eğitim öğretmeni|destek eğitim odası/.test(role)) return t;
        if (!NON_TEACHING.some((k) => role.includes(k))) return t;
        touched = true;
        return { ...t, branch: '' };
    });

    if (touched) persist(store);
};

try { migrateTeacherBranches(); } catch { /* bozuk kayıt varsa sessiz geç */ }

export const getStore = () => safeParse();

export const list = (collection, filter = {}) => {
    const store = safeParse();
    let rows = store[collection] || [];
    for (const [k, v] of Object.entries(filter)) {
        if (v == null) continue;
        rows = rows.filter((r) => String(r[k]) === String(v));
    }
    return rows;
};

export const add = (collection, record) => {
    const store = safeParse();
    const row = { id: uid(collection.slice(0, 3)), createdAt: new Date().toISOString(), ...record };
    store[collection] = [row, ...(store[collection] || [])];
    persist(store);
    return row;
};

export const update = (collection, id, patch) => {
    const store = safeParse();
    store[collection] = (store[collection] || []).map((r) =>
        r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r
    );
    persist(store);
    return store[collection].find((r) => r.id === id);
};

export const remove = (collection, id) => {
    const store = safeParse();
    store[collection] = (store[collection] || []).filter((r) => r.id !== id);
    // Öğrenci silinirse bağlı tüm kayıtlar da temizlenir
    if (collection === 'students') {
        for (const c of ['teachers', 'performances', 'plans', 'meetings', 'reports']) {
            store[c] = (store[c] || []).filter((r) => r.bepStudentId !== id);
        }
    }
    persist(store);
    return store[collection];
};

// ══════════════════════════════════════════════════════════════
//  Sabitler — MEB Özel Eğitim Hizmetleri Yönetmeliği terimleri
// ══════════════════════════════════════════════════════════════

export const DISABILITY_TYPES = [
    'Özel Öğrenme Güçlüğü',
    'Hafif Düzeyde Zihinsel Yetersizlik',
    'Orta Düzeyde Zihinsel Yetersizlik',
    'Ağır Düzeyde Zihinsel Yetersizlik',
    'Dil ve Konuşma Güçlüğü',
    'Görme Yetersizliği',
    'İşitme Yetersizliği',
    'Bedensel Yetersizlik (Ortopedik)',
    'Otizm Spektrum Bozukluğu',
    'Dikkat Eksikliği ve Hiperaktivite Bozukluğu',
    'Duygusal ve Davranış Bozukluğu',
    'Süreğen Hastalık',
    'Üstün Yetenekli / Özel Yetenekli',
    'Birden Fazla Yetersizlik',
];

export const INCLUSION_TYPES = [
    'Tam zamanlı kaynaştırma / bütünleştirme',
    'Yarı zamanlı kaynaştırma',
    'Özel eğitim sınıfı',
    'Destek eğitim odası',
    'Evde eğitim',
    'Hastane sınıfı',
];

export const BEP_TEAM_ROLES = [
    'Okul Müdürü / Müdür Yardımcısı (Birim Başkanı)',
    'Rehber Öğretmen / Psikolojik Danışman',
    'Sınıf Öğretmeni',
    'Ders Öğretmeni',
    'Özel Eğitim Öğretmeni',
    'Veli',
    'Öğrenci',
    'RAM Temsilcisi',
];

export const MEETING_TYPES = [
    'BEP Geliştirme Birimi İlk Toplantısı',
    'Dönem Başı Değerlendirme Toplantısı',
    'Ara Değerlendirme Toplantısı',
    'Dönem Sonu Değerlendirme Toplantısı',
    'Yıl Sonu BEP Değerlendirme Toplantısı',
    'Olağanüstü Toplantı',
];

export const PERFORMANCE_LEVELS = [
    { value: 1, label: 'Bağımsız yapamıyor', color: 'var(--danger)' },
    { value: 2, label: 'Fiziksel yardımla yapıyor', color: 'var(--warn)' },
    { value: 3, label: 'Sözel ipucuyla yapıyor', color: 'var(--highlight)' },
    { value: 4, label: 'Model olunduğunda yapıyor', color: 'var(--c2)' },
    { value: 5, label: 'Bağımsız yapıyor', color: 'var(--ok)' },
];

// ══════════════════════════════════════════════════════════════
//  Özet / durum hesaplama
// ══════════════════════════════════════════════════════════════

/**
 * Bir BEP öğrencisinin süreç tamamlanma durumu.
 * Rehber öğretmenin "hangi öğrencide ne eksik" sorusunun cevabı.
 */
export const getStudentStatus = (bepStudentId) => {
    const store = safeParse();
    const has = (c) => (store[c] || []).some((r) => r.bepStudentId === bepStudentId);
    const count = (c) => (store[c] || []).filter((r) => r.bepStudentId === bepStudentId).length;

    const steps = [
        { key: 'student', label: 'Öğrenci kaydı', done: true },
        { key: 'teachers', label: 'BEP birimi kuruldu', done: has('teachers'), count: count('teachers') },
        { key: 'performances', label: 'Performans alındı', done: has('performances'), count: count('performances') },
        { key: 'plans', label: 'BEP planı hazırlandı', done: has('plans'), count: count('plans') },
        { key: 'meetings', label: 'Toplantı yapıldı', done: has('meetings'), count: count('meetings') },
        { key: 'reports', label: 'Gelişim raporu yazıldı', done: has('reports'), count: count('reports') },
    ];

    const doneCount = steps.filter((s) => s.done).length;
    return {
        steps,
        completion: Math.round((doneCount / steps.length) * 100),
        missing: steps.filter((s) => !s.done).map((s) => s.label),
    };
};

/** Tüm BEP öğrencileri için özet — liste ekranı bunu kullanır. */
export const getOverview = () => {
    const store = safeParse();
    const students = store.students || [];
    const rows = students.map((s) => ({ ...s, status: getStudentStatus(s.id) }));

    return {
        total: students.length,
        complete: rows.filter((r) => r.status.completion === 100).length,
        incomplete: rows.filter((r) => r.status.completion < 100).length,
        avgCompletion: rows.length
            ? Math.round(rows.reduce((a, r) => a + r.status.completion, 0) / rows.length)
            : 0,
        byDisability: Object.entries(
            students.reduce((acc, s) => {
                const k = s.disabilityType || 'Belirtilmemiş';
                acc[k] = (acc[k] || 0) + 1;
                return acc;
            }, {})
        ).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
        rows,
    };
};

/** Amaç gerçekleşme oranı — gelişim raporunun sayısal tarafı. */
export const getGoalProgress = (bepStudentId) => {
    const plans = list('plans', { bepStudentId });
    const reports = list('reports', { bepStudentId });

    const allGoals = plans.flatMap((p) =>
        (p.shortTermGoals || []).map((g) => ({ plan: p.course, goal: typeof g === 'string' ? g : g.text }))
    );
    if (!allGoals.length) return { total: 0, achieved: 0, percent: null, goals: [] };

    // En güncel rapordaki gerçekleşme kayıtları
    const latest = reports[0];
    const progressMap = new Map(
        (latest?.goalProgress || []).map((g) => [g.goal, g.status])
    );

    const goals = allGoals.map((g) => ({
        ...g,
        status: progressMap.get(g.goal) || 'pending',
    }));

    const achieved = goals.filter((g) => g.status === 'achieved').length;
    return {
        total: goals.length,
        achieved,
        percent: Math.round((achieved / goals.length) * 100),
        goals,
    };
};

export default {
    getStore, list, add, update, remove,
    getStudentStatus, getOverview, getGoalProgress,
    DISABILITY_TYPES, INCLUSION_TYPES, BEP_TEAM_ROLES, MEETING_TYPES, PERFORMANCE_LEVELS,
};
