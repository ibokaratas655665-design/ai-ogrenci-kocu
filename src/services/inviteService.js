/**
 * 🔗 ÖĞRENCİ DAVET SİSTEMİ
 *
 * Rakip sistemlerde (Canlıkoç, DB Takip, NetKoç) öğrenci koça
 * "davet linki ya da QR kodu" ile saniyeler içinde bağlanıyor.
 * Bu uygulamada ise öğrenci yalnızca koç tarafından elle ya da Excel
 * listesiyle ekleniyordu; öğrencinin kendi bilgilerini girmesi,
 * telefonundan katılması mümkün değildi.
 *
 * Akış
 * ────
 *   1. Koç davet üretir → 6 haneli kod + link + QR
 *   2. Öğrenci linki açar / kodu girer, ad-soyad ve şifresini belirler
 *   3. Kayıt koçun listesine `ownerCoachId` damgasıyla düşer ve
 *      ONAY BEKLER — davet linkini ele geçiren biri doğrudan içeri
 *      giremesin diye.
 *
 * Davetin kendisi de sınırlıdır: kullanım hakkı, son kullanma tarihi
 * ve paket öğrenci limiti kontrol edilir.
 */

import subscription from './subscriptionService';

const KEY = 'student_invites';

/** Karışması kolay karakterler dışarıda (O/0, I/1, L). */
const ALFABE = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

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
    try { window.dispatchEvent(new Event('invites-updated')); } catch { /* ignore */ }
    try { window.firebaseSync?.syncKey?.(KEY); } catch { /* senkron yoksa sorun değil */ }
};

export const normalize = (kod) =>
    String(kod || '').toLocaleUpperCase('tr-TR').replace(/[^A-Z0-9]/g, '');

const kodUret = () => {
    const mevcut = new Set(oku().map((d) => d.kod));
    for (let deneme = 0; deneme < 50; deneme += 1) {
        let s = '';
        for (let i = 0; i < 6; i += 1) s += ALFABE[Math.floor(Math.random() * ALFABE.length)];
        if (!mevcut.has(s)) return s;
    }
    return Date.now().toString(36).toUpperCase().slice(-6);
};

/** Öğrencinin açacağı bağlantı. */
export const davetLinki = (kod) => {
    const taban = `${window.location.origin}${window.location.pathname}`;
    return `${taban}#/katil?kod=${kod}`;
};

// ══════════════════════════════════════════════════════════════
//  ÜRETME VE YÖNETİM
// ══════════════════════════════════════════════════════════════

/**
 * Davet üretir.
 * @param {object} p
 * @param {object} p.koc            { id, name }
 * @param {number} [p.kullanimHakki] Kaç öğrenci katılabilir (varsayılan 1)
 * @param {number} [p.gecerlilikGun] Kaç gün geçerli (varsayılan 14)
 * @param {string} [p.sinif]         Ön doldurulacak sınıf
 * @param {string} [p.not]
 */
export const uret = (p = {}) => {
    if (!p?.koc?.id) return null;

    const gun = Math.max(1, parseInt(p.gecerlilikGun, 10) || 14);
    const son = new Date();
    son.setDate(son.getDate() + gun);

    const davet = {
        kod: kodUret(),
        kocId: String(p.koc.id),
        kocAd: p.koc.name || '',
        kullanimHakki: Math.max(1, parseInt(p.kullanimHakki, 10) || 1),
        sonTarih: son.toISOString().slice(0, 10),
        sinif: p.sinif || '',
        not: p.not || '',
        aktif: true,
        katilanlar: [],
        olusturma: new Date().toISOString(),
    };

    yaz([davet, ...oku()]);
    return davet;
};

export const tumu = () => oku();

export const kocDavetleri = (kocId) =>
    oku().filter((d) => String(d.kocId) === String(kocId));

export const bul = (kod) => oku().find((d) => d.kod === normalize(kod)) || null;

export const durumDegistir = (kod, aktif) => {
    yaz(oku().map((d) => (d.kod === normalize(kod) ? { ...d, aktif: Boolean(aktif) } : d)));
};

export const sil = (kod) => {
    yaz(oku().filter((d) => d.kod !== normalize(kod)));
};

// ══════════════════════════════════════════════════════════════
//  DOĞRULAMA VE KATILIM
// ══════════════════════════════════════════════════════════════

/** @returns {{gecerli:boolean, davet?:object, hata?:string}} */
export const dogrula = (kod) => {
    const temiz = normalize(kod);
    if (!temiz) return { gecerli: false, hata: 'Davet kodu boş' };

    const davet = bul(temiz);
    if (!davet) return { gecerli: false, hata: 'Böyle bir davet bulunamadı' };
    if (!davet.aktif) return { gecerli: false, hata: 'Bu davet kapatılmış' };

    const bugun = new Date().toISOString().slice(0, 10);
    if (davet.sonTarih < bugun) {
        return { gecerli: false, hata: `Davetin süresi ${davet.sonTarih} tarihinde doldu` };
    }
    if (davet.katilanlar.length >= davet.kullanimHakki) {
        return { gecerli: false, hata: 'Davetin kullanım hakkı dolmuş' };
    }

    return { gecerli: true, davet };
};

const safeParse = (key, def = []) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw || !raw.trim()) return def;
        const v = JSON.parse(raw);
        return Array.isArray(v) ? v : def;
    } catch {
        return def;
    }
};

/**
 * Öğrenciyi davetle koçun listesine ekler.
 *
 * @param {string} kod
 * @param {object} ogrenci { name, schoolNumber, grade, section, parentName,
 *                           parentPhone, sifreOzeti }
 * @returns {{basarili:boolean, hata?:string, kayit?:object}}
 */
export const katil = (kod, ogrenci = {}) => {
    const kontrol = dogrula(kod);
    if (!kontrol.gecerli) return { basarili: false, hata: kontrol.hata };

    const davet = kontrol.davet;
    if (!ogrenci.name?.trim()) return { basarili: false, hata: 'Ad soyad zorunludur' };
    if (!ogrenci.schoolNumber?.toString().trim()) {
        return { basarili: false, hata: 'Okul numarası zorunludur' };
    }

    const liste = safeParse('coach_students');

    // Aynı koçta aynı okul numarası iki kez olamaz
    const cakisma = liste.some((s) =>
        String(s.ownerCoachId ?? s.coachId) === davet.kocId
        && String(s.schoolNumber || '').trim() === String(ogrenci.schoolNumber).trim());
    if (cakisma) {
        return { basarili: false, hata: 'Bu okul numarası koçunuzun listesinde zaten var.' };
    }

    // Koçun paket limiti dolmuşsa davet de öğrenci ekleyemez —
    // aksi hâlde limit davet üzerinden aşılabilirdi.
    const kocunOgrencileri = liste.filter(
        (s) => String(s.ownerCoachId ?? s.coachId) === davet.kocId
    ).length;
    const paket = subscription.ogrenciEklenebilir(davet.kocId, kocunOgrencileri);
    if (!paket.izin) {
        return { basarili: false, hata: 'Koçunuzun öğrenci kontenjanı dolmuş. Koçunuzla görüşün.' };
    }

    const kayit = {
        id: `ogr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: ogrenci.name.trim(),
        schoolNumber: String(ogrenci.schoolNumber).trim(),
        grade: ogrenci.grade || davet.sinif || '',
        section: ogrenci.section || '',
        class: [ogrenci.grade || davet.sinif, ogrenci.section].filter(Boolean).join('/'),
        parentName: ogrenci.parentName || '',
        parentPhone: ogrenci.parentPhone || '',
        password: ogrenci.sifreOzeti || null,
        status: 'Aktif',
        progress: 0,
        lastAction: 'Davetle katıldı',
        ownerCoachId: davet.kocId,
        ownerCoachName: davet.kocAd,
        coachId: davet.kocId,
        coachName: davet.kocAd,
        // Davet linkini ele geçiren biri doğrudan içeri girmesin:
        // katılım her hâlükârda koç onayına düşer.
        approved: false,
        approvalStatus: 'bekliyor',
        katildigiDavet: davet.kod,
        createdAt: new Date().toISOString(),
    };

    localStorage.setItem('coach_students', JSON.stringify([...liste, kayit]));
    try { window.firebaseSync?.syncKey?.('coach_students'); } catch { /* ignore */ }

    yaz(oku().map((d) => (d.kod === davet.kod
        ? {
            ...d,
            katilanlar: [...d.katilanlar, {
                ogrenciId: kayit.id,
                ad: kayit.name,
                tarih: new Date().toISOString(),
            }],
        }
        : d)));

    return { basarili: true, kayit };
};

export default {
    uret, tumu, kocDavetleri, bul, durumDegistir, sil,
    dogrula, katil, davetLinki, normalize,
};
