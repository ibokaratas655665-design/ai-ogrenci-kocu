/**
 * 🧑‍🏫 KOÇA GÖREV ATAMA
 *
 * Ana koç, eklediği koçlara iş atar. Bu, öğrenciye verilen ödevden
 * farklıdır: burada görev bir ÇALIŞMAYA bağlanır —
 *
 *   · bölüm  → koçluk mesaisi mi, rehberlik (PDR) mesaisi mi
 *   · sekme  → uygulamada hangi ekranda yapılacak (Denemeler, Rehberlik…)
 *
 * Koç görevi açtığında doğrudan o sekmeye gidebilir; "nerede yapacağım"
 * sorusu ortadan kalkar. Görev yalnızca atanan koça ve ana koça görünür.
 */

import { notify } from './notificationService';

const KEY = 'coach_tasks';

export const DURUMLAR = {
    atandi: { id: 'atandi', ad: 'Atandı', renk: 'var(--info)' },
    basladi: { id: 'basladi', ad: 'Devam Ediyor', renk: 'var(--warn)' },
    tamam: { id: 'tamam', ad: 'Tamamlandı', renk: 'var(--ok)' },
    iptal: { id: 'iptal', ad: 'İptal', renk: 'var(--ink-3)' },
};

export const ONCELIKLER = {
    dusuk: { id: 'dusuk', ad: 'Düşük', renk: 'var(--ink-3)' },
    normal: { id: 'normal', ad: 'Normal', renk: 'var(--info)' },
    yuksek: { id: 'yuksek', ad: 'Yüksek', renk: 'var(--warn)' },
    acil: { id: 'acil', ad: 'Acil', renk: 'var(--danger)' },
};

const oku = () => {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw || !raw.trim()) return [];
        const v = JSON.parse(raw);
        return Array.isArray(v) ? v : [];
    } catch {
        return [];
    }
};

const yaz = (liste) => {
    localStorage.setItem(KEY, JSON.stringify(liste));
    try { window.dispatchEvent(new StorageEvent('storage', { key: KEY })); } catch { /* ignore */ }
    try { window.dispatchEvent(new Event('coach-tasks-updated')); } catch { /* ignore */ }
    try { window.firebaseSync?.syncKey?.(KEY); } catch { /* senkron yoksa sorun değil */ }
};

const uid = () => `ct_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * Bir ya da birden çok koça görev atar.
 * @param {object} p
 * @param {Array} p.kocIdler   Hedef koç kimlikleri
 * @param {string} p.baslik
 * @param {string} [p.aciklama]
 * @param {string} p.bolum     'kocluk' | 'pdr'
 * @param {string} [p.sekme]   Sekme kimliği ('exams', 'guidance'…)
 * @param {string} [p.sekmeAd] Sekme görünen adı
 * @param {string} [p.sonTarih]
 * @param {string} [p.oncelik]
 * @param {object} p.atayan    { id, name }
 * @returns {number} oluşturulan görev sayısı
 */
export const ata = (p) => {
    if (!p?.kocIdler?.length || !p?.baslik?.trim()) return 0;

    const simdi = new Date().toISOString();
    const yeniler = p.kocIdler.map((kocId) => ({
        id: uid(),
        kocId: String(kocId),
        kocAd: p.kocAdlari?.[String(kocId)] || '',
        baslik: p.baslik.trim(),
        aciklama: p.aciklama || '',
        bolum: p.bolum || 'kocluk',
        sekme: p.sekme || null,
        sekmeAd: p.sekmeAd || null,
        sonTarih: p.sonTarih || '',
        oncelik: ONCELIKLER[p.oncelik] ? p.oncelik : 'normal',
        durum: 'atandi',
        atayanId: p.atayan?.id ?? null,
        atayanAd: p.atayan?.name || '',
        atamaTarihi: simdi,
        guncelleme: simdi,
        notlar: [],
    }));

    yaz([...yeniler, ...oku()]);

    // Koç bildirimi görsün; sekme bilgisi de gitsin ki tıklayınca oraya gitsin
    yeniler.forEach((g) => {
        try {
            notify({
                toUserId: g.kocId,
                type: 'task',
                title: 'Yeni görev atandı',
                body: `${g.baslik}${g.sekmeAd ? ` · ${g.sekmeAd}` : ''}`,
                // action, bildirime tıklayınca doğru bölüm+sekmeye gitmeyi sağlar
                action: { tur: 'kocGorev', taskId: g.id, bolum: g.bolum, sekme: g.sekme },
            });
        } catch { /* bildirim başarısızsa görev yine de duruyor */ }
    });

    return yeniler.length;
};

export const tumu = () => oku();

/** Bir koça atanmış görevler (yeniden eskiye). */
export const kocGorevleri = (kocId) =>
    oku()
        .filter((g) => String(g.kocId) === String(kocId))
        .sort((a, b) => String(b.atamaTarihi).localeCompare(String(a.atamaTarihi)));

/** Ana koçun kendi atadığı görevler. */
export const atananlar = (atayanId) =>
    oku()
        .filter((g) => String(g.atayanId) === String(atayanId))
        .sort((a, b) => String(b.atamaTarihi).localeCompare(String(a.atamaTarihi)));

/** Belirli bir sekmeye bağlı görevler — sekme başlığında rozet göstermek için. */
export const sekmeGorevleri = (kocId, sekme, bolum = null) =>
    kocGorevleri(kocId).filter((g) =>
        g.sekme === sekme &&
        g.durum !== 'tamam' && g.durum !== 'iptal' &&
        (!bolum || g.bolum === bolum));

export const durumDegistir = (id, durum, not = '') => {
    if (!DURUMLAR[durum]) return false;
    const liste = oku();
    let bulundu = false;
    const yeni = liste.map((g) => {
        if (g.id !== id) return g;
        bulundu = true;
        return {
            ...g,
            durum,
            guncelleme: new Date().toISOString(),
            notlar: not
                ? [...(g.notlar || []), { metin: not, tarih: new Date().toISOString() }]
                : (g.notlar || []),
        };
    });
    if (!bulundu) return false;
    yaz(yeni);

    // Ana koç işin bittiğini görsün
    const gorev = liste.find((g) => g.id === id);
    if (gorev?.atayanId && durum === 'tamam') {
        try {
            notify({
                toUserId: String(gorev.atayanId),
                type: 'success',
                title: 'Görev tamamlandı',
                body: `${gorev.kocAd || 'Koç'}: ${gorev.baslik}`,
                action: { tur: 'kocGorev', taskId: id },
            });
        } catch { /* ignore */ }
    }
    return true;
};

export const sil = (id) => {
    yaz(oku().filter((g) => g.id !== id));
};

/** Koçun açık görev sayısı — sekme rozetleri ve özet için. */
export const acikSayi = (kocId) =>
    kocGorevleri(kocId).filter((g) => g.durum === 'atandi' || g.durum === 'basladi').length;

/** Gecikmiş görevler. */
export const gecikenler = (kocId = null) => {
    const bugun = new Date().toISOString().slice(0, 10);
    return (kocId ? kocGorevleri(kocId) : oku()).filter(
        (g) => g.sonTarih && g.sonTarih < bugun && g.durum !== 'tamam' && g.durum !== 'iptal'
    );
};

export default {
    DURUMLAR, ONCELIKLER,
    ata, tumu, kocGorevleri, atananlar, sekmeGorevleri,
    durumDegistir, sil, acikSayi, gecikenler,
};
