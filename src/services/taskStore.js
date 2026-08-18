import { nesneOku } from './veriDeposu';
/**
 * 📋 GÖREV DEPOSU — tek okuma noktası
 *
 * `student_tasks` localStorage'da öğrenci kimliğine göre gruplanmış bir
 * NESNE olarak tutulur:  { "<studentId>": [ {...görev}, ... ] }
 *
 * Ancak bazı ekranlar (AI koç sohbeti, veli portalı) bunu DİZİ sanıp
 * doğrudan `.filter()` çağırıyordu. Nesnede `.filter` bulunmadığı için
 * çağrı TypeError fırlatıyor, try/catch onu yutuyor ve o ekranlarda
 * görevler hep "yok" görünüyordu. Okuma mantığı buraya alındı ki
 * yapı tek yerde bilinsin ve iki biçim de güvenle desteklensin.
 */

const KEY = 'student_tasks';

const isDone = (t) => Boolean(t?.completed) || t?.status === 'Tamamlandı';

/** Ham deposu döndürür (bozuksa boş nesne). */
export const readStore = () => {
    try {
        const parsed = nesneOku(KEY);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
};

/** Tüm görevleri düz bir dizi olarak döndürür — hem nesne hem eski dizi biçimi. */
export const allTasks = () => {
    const store = readStore();
    if (Array.isArray(store)) return store;
    return Object.entries(store).flatMap(([studentId, rows]) =>
        (Array.isArray(rows) ? rows : []).map((t) => ({ studentId, ...t }))
    );
};

/** Belirli bir öğrencinin görevleri. */
export const tasksFor = (studentId) => {
    if (studentId == null) return [];
    const id = String(studentId);
    const store = readStore();
    if (Array.isArray(store)) {
        return store.filter((t) => String(t?.studentId) === id);
    }
    const direct = store[id];
    if (Array.isArray(direct)) return direct.map((t) => ({ studentId: id, ...t }));
    // Anahtar farklı yazılmışsa (sayı/metin) düz listeden yakala
    return allTasks().filter((t) => String(t.studentId) === id);
};

/** Bekleyen görevler — istenirse ilk N tanesi. */
export const pendingFor = (studentId, limit = null) => {
    const rows = tasksFor(studentId).filter((t) => !isDone(t));
    return limit ? rows.slice(0, limit) : rows;
};

/** Tamamlanma özeti. */
export const summaryFor = (studentId) => {
    const rows = tasksFor(studentId);
    const done = rows.filter(isDone).length;
    return {
        total: rows.length,
        done,
        pending: rows.length - done,
        rate: rows.length ? Math.round((done / rows.length) * 100) : 0,
    };
};

export default { readStore, allTasks, tasksFor, pendingFor, summaryFor };
