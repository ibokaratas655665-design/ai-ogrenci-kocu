/**
 * ✅ ONAY SERVİSİ
 *
 * Ana koç; koç, öğrenci ve veli kayıtlarını tek tek ya da toplu onaylar.
 * Onay üç depoda birden yürür çünkü aynı kişi birden çok yerde tutuluyor:
 *
 *   koç     → managed_coaches + users_db   (giriş users_db'den yapılır)
 *   öğrenci → coach_students   + users_db
 *   veli    → parent_accounts  + users_db
 *
 * Bir kaydı sadece managed_coaches'ta onaylamak yetmez; giriş akışı
 * users_db'ye baktığı için oradaki `approved` alanı da güncellenmelidir.
 * Eski sürümde bu ikilik yüzünden "onayladım ama giriş yapamıyor"
 * durumu oluşuyordu.
 */

import { ONAY } from './accessControl';

export const TURLER = {
    koc: {
        id: 'koc',
        ad: 'Koçlar',
        tekil: 'Koç',
        depo: 'managed_coaches',
        icon: '🧑‍🏫',
    },
    ogrenci: {
        id: 'ogrenci',
        ad: 'Öğrenciler',
        tekil: 'Öğrenci',
        depo: 'coach_students',
        icon: '🎓',
    },
    veli: {
        id: 'veli',
        ad: 'Veliler',
        tekil: 'Veli',
        depo: 'parent_accounts',
        icon: '👨‍👩‍👧',
    },
};

export const TUR_LISTESI = Object.values(TURLER);

const oku = (key) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw || !raw.trim()) return [];
        const v = JSON.parse(raw);
        return Array.isArray(v) ? v : [];
    } catch {
        return [];
    }
};

const yaz = (key, liste) => {
    localStorage.setItem(key, JSON.stringify(liste));
    try { window.dispatchEvent(new StorageEvent('storage', { key })); } catch { /* ignore */ }
    try { window.firebaseSync?.syncKey?.(key); } catch { /* senkron yoksa sorun değil */ }
};

/**
 * users_db'deki eşleşen kaydın onay alanlarını da günceller.
 * Eşleşme kimlik, telefon veya e-posta üzerinden kurulur — kayıtlar
 * farklı depolarda farklı kimliklerle tutulabiliyor.
 */
const girisKaydiniGuncelle = (kayit, durum) => {
    const users = oku('users_db');
    if (!users.length) return;

    const ayni = (u) =>
        (kayit.id != null && String(u.id) === String(kayit.id)) ||
        (kayit.phone && u.phone && String(u.phone).replace(/\D/g, '') === String(kayit.phone).replace(/\D/g, '')) ||
        (kayit.email && u.email && String(u.email).toLocaleLowerCase('tr-TR') === String(kayit.email).toLocaleLowerCase('tr-TR'));

    let degisti = false;
    const yeni = users.map((u) => {
        if (!ayni(u)) return u;
        degisti = true;
        return { ...u, approved: durum === 'onayli', approvalStatus: durum };
    });
    if (degisti) yaz('users_db', yeni);
};

/** Tür için tüm kayıtlar. */
export const liste = (tur) => oku(TURLER[tur]?.depo || '');

/**
 * Bir kaydın onay durumunu değiştirir.
 * @param {string} tur     'koc' | 'ogrenci' | 'veli'
 * @param {string|number} id
 * @param {string} durum   'onayli' | 'bekliyor' | 'reddedildi'
 * @param {object} [onaylayan] { id, name }
 */
export const durumDegistir = (tur, id, durum, onaylayan = null) => {
    const tanim = TURLER[tur];
    if (!tanim || !ONAY[durum]) return false;

    const kayitlar = oku(tanim.depo);
    let hedef = null;

    const yeni = kayitlar.map((k) => {
        if (String(k.id) !== String(id)) return k;
        hedef = k;
        return {
            ...k,
            approvalStatus: durum,
            approved: durum === 'onayli',
            approvedAt: new Date().toISOString(),
            approvedBy: onaylayan?.name || onaylayan?.id || null,
        };
    });

    if (!hedef) return false;
    yaz(tanim.depo, yeni);
    girisKaydiniGuncelle(hedef, durum);
    return true;
};

/**
 * Toplu onay/ret.
 * @returns {number} etkilenen kayıt sayısı
 */
export const topluDurum = (tur, idler, durum, onaylayan = null) => {
    const tanim = TURLER[tur];
    if (!tanim || !ONAY[durum]) return 0;

    const kume = new Set(idler.map(String));
    const kayitlar = oku(tanim.depo);
    const etkilenen = [];

    const yeni = kayitlar.map((k) => {
        if (!kume.has(String(k.id))) return k;
        etkilenen.push(k);
        return {
            ...k,
            approvalStatus: durum,
            approved: durum === 'onayli',
            approvedAt: new Date().toISOString(),
            approvedBy: onaylayan?.name || onaylayan?.id || null,
        };
    });

    if (!etkilenen.length) return 0;
    yaz(tanim.depo, yeni);
    // Giriş kayıtları tek tek eşlenir; kayıt sayısı düşük olduğu için
    // toplu yazımdan daha güvenli.
    etkilenen.forEach((k) => girisKaydiniGuncelle(k, durum));
    return etkilenen.length;
};

/** Türün onay özeti: bekleyen / onaylı / reddedilen sayıları. */
export const ozet = (tur) => {
    const kayitlar = liste(tur);
    const say = { bekliyor: 0, onayli: 0, reddedildi: 0, toplam: kayitlar.length };
    kayitlar.forEach((k) => {
        const d = k.approvalStatus && ONAY[k.approvalStatus]
            ? k.approvalStatus
            : (k.approved === false ? 'bekliyor' : 'onayli');
        say[d] += 1;
    });
    return say;
};

/** Tüm türlerdeki toplam bekleyen sayısı — rozet için. */
export const bekleyenToplam = () =>
    TUR_LISTESI.reduce((t, x) => t + ozet(x.id).bekliyor, 0);

export default {
    TURLER, TUR_LISTESI, liste, durumDegistir, topluDurum, ozet, bekleyenToplam,
};
