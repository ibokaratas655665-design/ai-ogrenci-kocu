/**
 * ✅ GÖREV DEPOSU — öğrenci başına tanım + ilerleme ayrımı
 *
 * ESKİ SORUN: tüm görevler tek `student_tasks` blobundaydı. Koç görevi
 * güncellerken bloğu komple yazıyor, öğrencinin "tamamladım" işareti
 * senkron yarışında eziliyordu (iki cihaz aynı bloğu itince kaybeden
 * taraf öğrencinin ilerlemesiydi).
 *
 * YENİ DÜZEN (04.09, canlı eşleme):
 *   · `student_tasks_<sid>`          → görev TANIMLARI (koç yazar)
 *   · `student_task_progress_<sid>`  → görev İLERLEMESİ (öğrenci yazar)
 *   · eski `student_tasks` blobu     → salt-okunur geri düşüş
 * Okuma her zaman BİRLEŞİK yapılır: tanım + o kaydın ilerlemesi.
 * Böylece koç ve öğrenci farklı anahtarlara yazar, çakışma biter.
 */

const BLOB_ANAHTARI = 'student_tasks';
export const tanimAnahtar = (sid) => `student_tasks_${sid}`;
export const progressAnahtar = (sid) => `student_task_progress_${sid}`;

const guvenliOku = (anahtar, varsayilan) => {
    try {
        const ham = localStorage.getItem(anahtar);
        return ham == null ? varsayilan : JSON.parse(ham);
    } catch {
        return varsayilan;
    }
};

const yazVeSenkronla = (anahtar, deger) => {
    try {
        localStorage.setItem(anahtar, JSON.stringify(deger));
        window.firebaseSync?.syncKey?.(anahtar);
    } catch { /* depolama dolu/erişilemez — sessiz geç */ }
};

/** Eski blobdan bu öğrencinin görevleri (dizi VEYA {sid: []} biçimi). */
export const blobTanimlari = (sid) => {
    const ham = guvenliOku(BLOB_ANAHTARI, {});
    if (Array.isArray(ham)) {
        return ham.filter((g) => String(g?.studentId ?? g?.ogrenciId) === String(sid));
    }
    const liste = ham?.[String(sid)];
    return Array.isArray(liste) ? liste : [];
};

/** Görev tanımları: yeni anahtar; yoksa eski blob. */
export const tanimlariOku = (sid) => {
    const liste = guvenliOku(tanimAnahtar(sid), null);
    return Array.isArray(liste) ? liste : blobTanimlari(sid);
};

export const tanimYaz = (sid, gorevler) => {
    if (sid == null || !Array.isArray(gorevler)) return;
    yazVeSenkronla(tanimAnahtar(sid), gorevler);
};

export const progressOku = (sid) => {
    const p = guvenliOku(progressAnahtar(sid), {});
    return p && typeof p === 'object' && !Array.isArray(p) ? p : {};
};

export const progressGuncelle = (sid, gorevId, yama) => {
    if (sid == null || gorevId == null) return;
    const mevcut = progressOku(sid);
    yazVeSenkronla(progressAnahtar(sid), { ...mevcut, [String(gorevId)]: { ...yama } });
};

/** Tanım + ilerleme birleşik görünüm — okuyucular hep bunu kullanır. */
export const birlesikOku = (sid) => {
    const tanimlar = tanimlariOku(sid);
    const ilerleme = progressOku(sid);
    return tanimlar.map((g) => {
        const p = ilerleme[String(g?.id)];
        return p ? { ...g, ...p } : g;
    });
};

/** Görev kaydı olan tüm öğrenci kimlikleri (blob + yeni anahtarlar). */
export const tumSidler = () => {
    const sidler = new Set();
    const ham = guvenliOku(BLOB_ANAHTARI, {});
    if (Array.isArray(ham)) {
        ham.forEach((g) => {
            const sid = g?.studentId ?? g?.ogrenciId;
            if (sid != null) sidler.add(String(sid));
        });
    } else {
        Object.keys(ham || {}).forEach((sid) => sidler.add(String(sid)));
    }
    try {
        for (let i = 0; i < localStorage.length; i += 1) {
            const anahtar = localStorage.key(i);
            if (anahtar && anahtar.startsWith('student_tasks_')) {
                sidler.add(anahtar.slice('student_tasks_'.length));
            }
        }
    } catch { /* erişim yoksa blob yeter */ }
    return [...sidler];
};

/** {sid: birleşik görevler} — koç panelinin toplu okuyucuları için. */
export const gorevHaritasiBirlesik = () => {
    const harita = {};
    tumSidler().forEach((sid) => { harita[sid] = birlesikOku(sid); });
    return harita;
};

export default {
    tanimAnahtar, progressAnahtar,
    blobTanimlari, tanimlariOku, tanimYaz,
    progressOku, progressGuncelle,
    birlesikOku, tumSidler, gorevHaritasiBirlesik,
};
