/**
 * ✅ PROGRAM GERÇEKLEŞME SERVİSİ
 *
 * Öğrencinin programdaki her etüdü yapıp yapmadığının TEK kaynağı.
 *
 * Neden yeni bir servis?
 *  Eskiden işaretlemeler `program_completed_{userId}` anahtarında tutuluyordu.
 *  Bu anahtar firebaseSync'in ne sabit listesinde ne de dinamik desenindeydi;
 *  yani öğrencinin "yaptım" demesi koçun ekranına HİÇ ulaşmıyordu.
 *  Artık tek bir `program_progress` anahtarı var ve senkronize ediliyor.
 *
 * Veri şekli:
 *   {
 *     [studentId]: {
 *       "m1-w2-Salı-3": { status: 'done'|'missed', at: ISO, note?: string }
 *     }
 *   }
 */

const KEY = 'program_progress';

/** Ders/aktivite tipleri — hangileri "çalışma" sayılır. */
const STUDY_TYPES = new Set(['konu', 'soru', 'tekrar']);

const safeParse = () => {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw || !raw.trim()) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
};

/**
 * Yerel yazma anında, buluta yazma geciktirilerek yapılır.
 *
 * Neden: öğrenci arka arkaya 10 etüt işaretlediğinde her tık için ayrı bir
 * Firestore yazımı tetikleniyordu. Bu yazımlar yarışa giriyor ve geri dönen
 * eski anlık görüntü yereldeki yeni işaretlemeleri eziyordu — testte 38
 * işaretlemenin 7'ye düştüğünü gördük. Tek bir gecikmeli yazım hem bu yarışı
 * hem de gereksiz kota tüketimini ortadan kaldırıyor.
 */
let syncTimer = null;

const scheduleSync = () => {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
        syncTimer = null;
        try { window.firebaseSync?.syncKey?.(KEY); } catch { /* senkron yoksa sorun değil */ }
    }, 1500);
};

const persist = (all) => {
    localStorage.setItem(KEY, JSON.stringify(all));
    try {
        window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
    } catch { /* ignore */ }
    scheduleSync();
};

// ════════════════════════════════════════════════════════════
//  Okuma / yazma
// ════════════════════════════════════════════════════════════

export const getProgress = (studentId) => {
    if (!studentId) return {};
    return safeParse()[String(studentId)] || {};
};

/* ════════════════════════════════════════════════════════════
   TARİH DOĞRULAMASI (23.08.2026 talimatı §3)

   Geçmiş ve bugünün etüdü işaretlenebilir; GELECEK tarihli etüt
   işaretlenemez. Kontrol yalnızca arayüzde değil, YAZMA
   katmanında da yapılır — arayüz atlansa bile kayıt reddedilir.

   Hücre anahtarı `m{ay}-w{hafta}-{GünAdı}-{etüt}` takvim tarihi
   taşımaz; tarih, programın başlangıç haftasına göre hesaplanır.
   Başlangıç `program_meta_{id}.baslangicTarihi`, yoksa
   `updatedAt`, o da yoksa bugünün haftası kabul edilir.
   ════════════════════════════════════════════════════════════ */

const GUN_SIRASI = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

/** Verilen tarihin içinde bulunduğu haftanın PAZARTESİ'si (00:00). */
export const haftaBasi = (d = new Date()) => {
    const t = new Date(d);
    t.setHours(0, 0, 0, 0);
    t.setDate(t.getDate() - ((t.getDay() + 6) % 7));
    return t;
};

/** Programın başlangıç haftası (Pazartesi). */
export const programBaslangici = (studentId) => {
    try {
        const ham = localStorage.getItem(`program_meta_${studentId}`);
        if (ham) {
            const meta = JSON.parse(ham);
            const kaynak = meta.baslangicTarihi || meta.updatedAt;
            if (kaynak) {
                const d = new Date(kaynak);
                if (!Number.isNaN(d.getTime())) return haftaBasi(d);
            }
        }
    } catch { /* meta okunamazsa bugüne düş */ }
    return haftaBasi();
};

/**
 * Hücre anahtarının takvim tarihi.
 * @returns {Date|null} çözümlenemezse null (kısıt uygulanmaz)
 */
export const hucreTarihi = (cellKey, baslangic, haftaPerAy = 4) => {
    const m = /^m(\d+)-w(\d+)-(.+)-(\d+)$/.exec(String(cellKey || ''));
    if (!m) return null;
    const gunIdx = GUN_SIRASI.indexOf(m[3]);
    if (gunIdx < 0) return null;
    const haftaIndex = (Number(m[1]) - 1) * haftaPerAy + (Number(m[2]) - 1);
    const t = new Date(baslangic);
    t.setDate(t.getDate() + haftaIndex * 7 + gunIdx);
    t.setHours(0, 0, 0, 0);
    return t;
};

/**
 * Bu etüt işaretlenebilir mi? Geçmiş/bugün → evet, gelecek → hayır.
 * @returns {{izin:boolean, tarih:Date|null, sebep?:string}}
 */
export const isaretlenebilirMi = (studentId, cellKey, haftaPerAy = 4) => {
    const tarih = hucreTarihi(cellKey, programBaslangici(studentId), haftaPerAy);
    if (!tarih) return { izin: true, tarih: null };   // tarih çözülemedi — engelleme
    const bugun = new Date();
    bugun.setHours(23, 59, 59, 999);
    if (tarih.getTime() > bugun.getTime()) {
        return {
            izin: false, tarih,
            sebep: `Bu etüt ${tarih.toLocaleDateString('tr-TR')} tarihli — gelecekteki etütler tamamlanamaz.`,
        };
    }
    return { izin: true, tarih };
};

/**
 * Bir etüdün durumunu yazar.
 * @param {string} status - 'done' | 'missed' | null (temizler)
 */
export const setCellStatus = (studentId, cellKey, status, note) => {
    if (!studentId || !cellKey) return {};
    /* Gelecek tarihli etüt işaretlenemez — arayüz atlansa bile burada
       reddedilir (§3: "yalnızca UI tarafında yapılmayacak"). Temizleme
       (status=null) her zaman serbesttir. */
    if (status) {
        const kontrol = isaretlenebilirMi(studentId, cellKey);
        if (!kontrol.izin) {
            try { window.dispatchEvent(new CustomEvent('program-gelecek-etut', { detail: kontrol })); } catch { /* ignore */ }
            return getProgress(studentId);
        }
    }
    const all = safeParse();
    const sid = String(studentId);
    const mine = { ...(all[sid] || {}) };

    if (!status) {
        delete mine[cellKey];
    } else {
        mine[cellKey] = {
            status,
            at: new Date().toISOString(),
            ...(note ? { note } : {}),
        };
    }

    all[sid] = mine;
    persist(all);
    return mine;
};

/**
 * Birden çok etüdü tek yazımda işaretler.
 * @param {Array} entries - [{ cellKey, status }]
 */
export const setManyStatuses = (studentId, entries = []) => {
    if (!studentId || !entries.length) return {};
    const all = safeParse();
    const sid = String(studentId);
    const mine = { ...(all[sid] || {}) };
    const at = new Date().toISOString();

    for (const { cellKey, status } of entries) {
        if (!cellKey) continue;
        if (!status) { delete mine[cellKey]; continue; }
        // Toplu yazımda da gelecek tarih kilidi geçerlidir
        if (!isaretlenebilirMi(studentId, cellKey).izin) continue;
        mine[cellKey] = { status, at };
    }

    all[sid] = mine;
    persist(all);
    return mine;
};

/** boş → yaptım → yapamadım → boş */
export const cycleCellStatus = (studentId, cellKey) => {
    const cur = getProgress(studentId)[cellKey]?.status;
    const next = cur === 'done' ? 'missed' : cur === 'missed' ? null : 'done';
    setCellStatus(studentId, cellKey, next);
    return next;
};

/**
 * Eski `program_completed_{id}` kaydını yeni yapıya taşır.
 * Bir kez çalışır; taşınan anahtar silinmez (geri dönüş güvenliği).
 */
export const migrateLegacy = (studentId) => {
    if (!studentId) return;
    const all = safeParse();
    const sid = String(studentId);
    if (all[sid] && Object.keys(all[sid]).length) return; // zaten veri var

    try {
        const raw = localStorage.getItem(`program_completed_${sid}`);
        if (!raw) return;
        const legacy = JSON.parse(raw);
        if (!legacy || typeof legacy !== 'object') return;

        const migrated = {};
        for (const [cellKey, done] of Object.entries(legacy)) {
            if (done) migrated[cellKey] = { status: 'done', at: null, migrated: true };
        }
        if (Object.keys(migrated).length) {
            all[sid] = migrated;
            persist(all);
        }
    } catch { /* eski veri bozuksa yoksay */ }
};

// ════════════════════════════════════════════════════════════
//  Hafta / dönem özetleri
// ════════════════════════════════════════════════════════════

const cellKeysForWeek = (schedule, month, week) => {
    const prefix = `m${month}-w${week}-`;
    return Object.keys(schedule || {}).filter((k) => k.startsWith(prefix));
};

/**
 * Bir haftanın gerçekleşme özeti.
 *
 * @returns {{
 *   planned:number, done:number, missed:number, pending:number,
 *   rate:number|null, byType:object, bySubject:Array, unfinished:Array
 * }}
 */
export const getWeekStats = (studentId, schedule, month, week) => {
    const progress = getProgress(studentId);
    const keys = cellKeysForWeek(schedule, month, week);

    const stats = {
        planned: 0, done: 0, missed: 0, pending: 0,
        rate: null, byType: {}, bySubject: [], unfinished: [],
    };
    if (!keys.length) return stats;

    const subjectMap = new Map();

    for (const key of keys) {
        const cell = schedule[key];
        if (!cell) continue;
        stats.planned++;

        const type = cell.type || 'konu';
        if (!stats.byType[type]) stats.byType[type] = { planned: 0, done: 0, missed: 0 };
        stats.byType[type].planned++;

        const status = progress[key]?.status;
        if (status === 'done') { stats.done++; stats.byType[type].done++; }
        else if (status === 'missed') { stats.missed++; stats.byType[type].missed++; }
        else stats.pending++;

        if (status !== 'done') {
            stats.unfinished.push({ cellKey: key, ...cell, status: status || 'pending' });
        }

        if (STUDY_TYPES.has(type) && cell.subject) {
            if (!subjectMap.has(cell.subject)) {
                subjectMap.set(cell.subject, { subject: cell.subject, planned: 0, done: 0, missed: 0 });
            }
            const s = subjectMap.get(cell.subject);
            s.planned++;
            if (status === 'done') s.done++;
            else if (status === 'missed') s.missed++;
        }
    }

    stats.rate = stats.planned ? Math.round((stats.done / stats.planned) * 100) : null;
    stats.bySubject = [...subjectMap.values()]
        .map((s) => ({ ...s, rate: s.planned ? Math.round((s.done / s.planned) * 100) : null }))
        .sort((a, b) => (a.rate ?? 101) - (b.rate ?? 101)); // en düşük uyum önce

    return stats;
};

/** Programın tamamı için özet + hafta hafta seri. */
export const getOverallStats = (studentId, schedule, months = 1, weeksPerMonth = 4) => {
    const weeks = [];
    let planned = 0, done = 0, missed = 0;

    for (let m = 1; m <= months; m++) {
        for (let w = 1; w <= weeksPerMonth; w++) {
            const s = getWeekStats(studentId, schedule, m, w);
            if (!s.planned) continue;
            weeks.push({ month: m, week: w, ...s });
            planned += s.planned;
            done += s.done;
            missed += s.missed;
        }
    }

    return {
        planned,
        done,
        missed,
        pending: planned - done - missed,
        rate: planned ? Math.round((done / planned) * 100) : null,
        weeks,
        lastWeek: weeks.length ? weeks[weeks.length - 1] : null,
    };
};

/**
 * Bir sonraki programa taşınacak eksikler.
 *
 * Yalnızca gerçek çalışma blokları (konu/soru/tekrar) taşınır — yapılmayan
 * bir "kitap okuma" bloğunu telafi kuyruğuna eklemek anlamsız olurdu.
 * Aynı konu birden fazla kez eksik kaldıysa tek kayıt olarak, ağırlığı
 * artırılmış şekilde döner.
 *
 * @returns {Array} distributionQueue formatında: { subject, topic, weight, exam, carriedOver }
 */
export const getCarryOverQueue = (studentId, schedule, { month, week } = {}) => {
    const progress = getProgress(studentId);
    const keys = month && week
        ? cellKeysForWeek(schedule, month, week)
        : Object.keys(schedule || {});

    const byTopic = new Map();

    for (const key of keys) {
        const cell = schedule[key];
        if (!cell) continue;
        const type = cell.type || 'konu';
        if (!STUDY_TYPES.has(type)) continue;

        const status = progress[key]?.status;
        if (status === 'done') continue;

        const id = `${cell.subject}||${cell.topic}`;
        if (!byTopic.has(id)) {
            byTopic.set(id, {
                subject: cell.subject,
                topic: cell.topic,
                exam: cell.exam || '',
                weight: 0,
                missedCount: 0,
                pendingCount: 0,
                carriedOver: true,
            });
        }
        const entry = byTopic.get(id);
        entry.weight += 1;
        if (status === 'missed') entry.missedCount++;
        else entry.pendingCount++;
    }

    // "Yapamadım" denenler, hiç dokunulmayanlardan önce gelsin
    return [...byTopic.values()].sort((a, b) => b.missedCount - a.missedCount);
};

export const _tarihYardimcilari = { haftaBasi, programBaslangici, hucreTarihi, isaretlenebilirMi };

export default {
    getProgress,
    setCellStatus,
    setManyStatuses,
    cycleCellStatus,
    migrateLegacy,
    getWeekStats,
    getOverallStats,
    getCarryOverQueue,
    // Tarih kilidi (§3)
    haftaBasi,
    programBaslangici,
    hucreTarihi,
    isaretlenebilirMi,
};
