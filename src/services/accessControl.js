/**
 * 🔐 ERİŞİM VE SAHİPLİK KATMANI
 *
 * Uygulama tek bölüm çalışır: KOÇLUK — özel öğrenci koçluğu (program,
 * deneme, hedef, materyal). PDR bölümü 22.08.2026'da arşivlendi
 * (archive/pdr_module); eski kayıtların `sections`/`bolum` alanları
 * geriye dönük uyum için okunmaya devam eder.
 *
 * Kimin neyi görebileceği tek yerden belirlenir:
 *
 *   ANA KOÇ (master)   → TÜM öğrenci ve veliler, koç yönetimi
 *   KOÇ (subCoach)     → YALNIZCA kendi eklediği öğrenci ve veliler
 *
 * Eskiden böyle bir ayrım yoktu: eklenen her koç bütün öğrenci listesini
 * görüyor ve üzerinde işlem yapabiliyordu.
 */

import { yoneticiHesabiMi } from '../data/yoneticiHesabi';

const OGRENCI_KEY = 'coach_students';
const KOC_KEY = 'managed_coaches';

const safeParse = (key, def = []) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw || !raw.trim()) return def;
        const v = JSON.parse(raw);
        return v ?? def;
    } catch {
        return def;
    }
};

// ══════════════════════════════════════════════════════════════
//  ROLLER VE BÖLÜMLER
// ══════════════════════════════════════════════════════════════

/** Uygulamanın tek aktif bölümü (PDR arşivlendi). */
export const BOLUMLER = {
    kocluk: {
        id: 'kocluk',
        ad: 'Koçluk Çalışmaları',
        kisa: 'Koçluk',
        aciklama: 'Özel öğrenci koçluğu: program, deneme analizi, hedef takibi',
        renk: 'var(--brand)',
    },
};

export const BOLUM_LISTESI = Object.values(BOLUMLER);

/** Oturumdaki kullanıcı ana koç mu? */
export const isAnaKoc = (user) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.coachRole === 'masterCoach' || user.coachRole === 'master') return true;
    // Kurucu hesap
    return user.id === 'admin_master' || yoneticiHesabiMi(user.email);
};

/**
 * Kullanıcının erişebildiği bölümler. Tek bölüm kaldığı için sabittir;
 * eski kayıtlardaki `sections: ['pdr']` değerleri BOLUMLER süzgecine
 * takılır ve koçluğa düşer.
 */
export const erisilenBolumler = () => ['kocluk'];

export const bolumeErisebilir = (user, bolum) => erisilenBolumler(user).includes(bolum);

/** managed_coaches içindeki koç kaydı. */
export const kocKaydi = (coachId) => {
    if (!coachId) return null;
    return safeParse(KOC_KEY).find((c) => String(c.id) === String(coachId)) || null;
};

// ══════════════════════════════════════════════════════════════
//  SAHİPLİK
// ══════════════════════════════════════════════════════════════

/**
 * Bir kaydın sahibi olan koç kimliği.
 * Eski kayıtlarda sahip alanı yok — bunlar "kurumsal" sayılır ve
 * yalnızca ana koça görünür (yanlışlıkla herkese açılmasın diye).
 */
export const sahipKoc = (kayit) =>
    kayit?.ownerCoachId ?? kayit?.coachId ?? kayit?.createdBy ?? null;

/** Kullanıcı bu kaydı görebilir mi? */
export const gorebilir = (user, kayit) => {
    if (isAnaKoc(user)) return true;
    const sahip = sahipKoc(kayit);
    if (sahip == null) return false;            // sahipsiz kayıt = kurumsal
    return String(sahip) === String(user?.id);
};

/** Kullanıcı bu kayıtta değişiklik yapabilir mi? */
export const duzenleyebilir = (user, kayit) => gorebilir(user, kayit);

/** Listeyi kullanıcının görebileceklerine indirger. */
export const filtrele = (user, liste = []) => {
    if (isAnaKoc(user)) return liste;
    return liste.filter((k) => gorebilir(user, k));
};

/** Yeni kayda sahiplik damgası basar. */
export const sahiplikEkle = (user, kayit) => ({
    ...kayit,
    ownerCoachId: kayit?.ownerCoachId ?? user?.id ?? null,
    ownerCoachName: kayit?.ownerCoachName ?? user?.name ?? null,
    createdAt: kayit?.createdAt ?? new Date().toISOString(),
});

// ══════════════════════════════════════════════════════════════
//  ONAY DURUMU
// ══════════════════════════════════════════════════════════════

export const ONAY = {
    bekliyor: { id: 'bekliyor', ad: 'Onay Bekliyor', renk: 'var(--warn)' },
    onayli: { id: 'onayli', ad: 'Onaylı', renk: 'var(--ok)' },
    reddedildi: { id: 'reddedildi', ad: 'Reddedildi', renk: 'var(--danger)' },
};

/**
 * Kaydın onay durumu.
 * Eski kayıtlarda alan yok — çalışmayı durdurmamak için onaylı sayılır;
 * yeni eklenenler `bekliyor` ile başlar.
 */
export const onayDurumu = (kayit) => {
    const v = kayit?.approvalStatus;
    if (v && ONAY[v]) return v;
    if (kayit?.approved === false) return 'bekliyor';
    return 'onayli';
};

export const onayli = (kayit) => onayDurumu(kayit) === 'onayli';

// ══════════════════════════════════════════════════════════════
//  ÖĞRENCİ LİSTESİ YARDIMCILARI
// ══════════════════════════════════════════════════════════════

/** Kullanıcının görebileceği öğrenciler. */
export const gorunurOgrenciler = (user, hepsi = null) => {
    const liste = hepsi ?? safeParse(OGRENCI_KEY);
    return filtrele(user, liste);
};

/** Kullanıcının görebileceği öğrenci kimlikleri (hızlı üyelik testi için). */
export const gorunurOgrenciIdSeti = (user, hepsi = null) =>
    new Set(gorunurOgrenciler(user, hepsi).map((s) => String(s.id)));

/**
 * Öğrenciye bağlı kayıtları (görev, program, görüşme…) kullanıcının
 * görebileceklerine indirger.
 */
export const ogrenciBazliFiltrele = (user, kayitlar = [], alan = 'studentId') => {
    if (isAnaKoc(user)) return kayitlar;
    const izin = gorunurOgrenciIdSeti(user);
    return kayitlar.filter((k) => izin.has(String(k?.[alan])));
};

export default {
    BOLUMLER, BOLUM_LISTESI, ONAY,
    isAnaKoc, erisilenBolumler, bolumeErisebilir, kocKaydi,
    sahipKoc, gorebilir, duzenleyebilir, filtrele, sahiplikEkle,
    onayDurumu, onayli,
    gorunurOgrenciler, gorunurOgrenciIdSeti, ogrenciBazliFiltrele,
};
