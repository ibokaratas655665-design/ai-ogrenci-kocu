/**
 * 🔔 SEKME BİLDİRİM ROZETLERİ
 *
 * Bir tarafta yapılan çalışma diğer tarafta anında görünsün diye:
 * koç görev atadığında öğrencinin "Görevler" sekmesinde, öğrenci mesaj
 * yazdığında koçun "WhatsApp" sekmesinde yuvarlak bir sayaç belirir.
 * Sekmeye girilince o sekmenin rozeti sıfırlanır.
 *
 * NEDEN KİMLİK LİSTESİ, NEDEN SADECE ZAMAN DAMGASI DEĞİL
 * ──────────────────────────────────────────────────────
 * İlk sürüm yalnızca "sekmeyi en son ne zaman açtın" bilgisini tutuyor
 * ve kaydın tarihiyle karşılaştırıyordu. Ama uygulamadaki kayıtların bir
 * kısmında kullanılabilir bir tarih alanı YOK (onay bekleyen öğrenci,
 * elle eklenen veli…). Onay sekmesinde bu durum şu satırla ele alınmıştı:
 *
 *     return !gorulen.approvals || !t || t > gorulen.approvals;
 *                                  ↑ tarihi olmayan kayıt HER ZAMAN sayılır
 *
 * Sonuç: sekmeye tıklansa da rozet kaybolmuyordu. Artık her sekme için
 * o an "işlem bekleyen" kayıtların KİMLİKLERİ tutulur; sekmeye girildiğinde
 * bu kimlikler "görüldü" olarak işaretlenir. Rozet = görülmemiş kimlik
 * sayısı. Tarih alanı olsun olmasın doğru çalışır ve yeni bir kayıt
 * geldiğinde rozet kendiliğinden geri gelir.
 */

import { listeOku } from './veriDeposu';
/* 05.09 denetimi: rozetler ölü anahtarlardan besleniyordu —
   whatsapp_messages (üretimde hiç yazılmıyor), eski student_tasks blobu,
   soneksiz assigned_tests, demo-dışı boş exam_results. Rozet kaynakları
   gerçek depolara bağlandı. */
import mesajKanali from './mesajKanali';
import gorevDeposu from './gorevDeposu';

const SEEN_KEY = (rol, userId) => `tab_seen_${rol}_${userId || 'anon'}`;

/** Sekme başına saklanacak en fazla kimlik — depo şişmesin. */
const AZAMI_KIMLIK = 400;

const guvenliJson = (key, def) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw || !raw.trim()) return def;
        return JSON.parse(raw) ?? def;
    } catch {
        return def;
    }
};

/**
 * Liste okuma tek kapıdan: veriDeposu.listeOku bozuk JSON'u da
 * dizi olmayan değeri de boş diziye indirger.
 */
const dizi = (key) => listeOku(key);

/**
 * Görülmüş kayıtlar: { [tabId]: { at: ISO, ids: [...] } }
 * Eski biçim ({ [tabId]: ISO }) da okunabilir; geçişte kimse kayıp yaşamaz.
 */
export const ziyaretler = (rol, userId) => {
    const ham = guvenliJson(SEEN_KEY(rol, userId), {}) || {};
    const cikti = {};
    Object.entries(ham).forEach(([tab, v]) => {
        if (typeof v === 'string') cikti[tab] = { at: v, ids: [] };
        else if (v && typeof v === 'object') cikti[tab] = { at: v.at || null, ids: v.ids || [] };
    });
    return cikti;
};

/**
 * Bir kaydın kimliği. Kimliği olmayan kayıtlar için alanlardan
 * kararlı bir imza üretilir — aynı kayıt her hesaplamada aynı
 * imzayı almalı, yoksa rozet hiç sıfırlanmaz.
 */
const kimlik = (k, onEk = '') => {
    if (k?.id != null) return `${onEk}${k.id}`;
    const parcalar = [k?.name, k?.email, k?.phone, k?.schoolNumber, k?.title, k?.date]
        .filter(Boolean).join('|');
    return `${onEk}${parcalar || JSON.stringify(k).slice(0, 80)}`;
};

/** Kaydın tarihi (varsa) — yeni gelen kaydı ayırt etmeye yardım eder. */
const tarihAl = (k) => {
    const v = k?.createdAt || k?.assignedAt || k?.olusturma || k?.atamaTarihi
        || k?.date || k?.tarih || k?.timestamp || k?.time;
    if (!v) return null;
    if (typeof v === 'number') return new Date(v).toISOString();
    const s = String(v);
    return s.length === 10 ? `${s}T23:59:59.000Z` : s;
};

// ══════════════════════════════════════════════════════════════
//  SEKME BAŞINA "İŞLEM BEKLEYEN" KAYITLAR
// ══════════════════════════════════════════════════════════════

/**
 * Koç panelinde hangi sekmede hangi kayıtlar bekliyor.
 * @returns {Object<string, Array<string>>} tabId → kimlik listesi
 */
const kocBekleyenler = (user, bolum = 'kocluk') => {
    const uid = String(user?.id ?? '');
    const harita = {};

    // Görevler — bu koça atanmış, kapanmamış işler
    harita['coach-tasks'] = dizi('coach_tasks')
        .filter((g) => String(g.kocId) === uid && g.durum !== 'tamam' && g.durum !== 'iptal')
        .map((g) => kimlik(g, 'gorev:'));

    // Onaylar — onay bekleyen koç/öğrenci/veli
    const bekleyen = (key, onEk) => dizi(key)
        .filter((k) => k.approvalStatus === 'bekliyor' || k.approved === false)
        .map((k) => kimlik(k, onEk));
    harita.approvals = [
        ...bekleyen('managed_coaches', 'koc:'),
        ...bekleyen('coach_students', 'ogr:'),
        ...bekleyen('parent_accounts', 'veli:'),
    ];

    // Mesajlar — öğrencilerden gelen okunmamışlar (yön-ayrımlı kanal)
    harita.whatsapp = mesajKanali.kocOkunmamisIdler();
    harita.inbox = harita.whatsapp;

    // Randevular — alınan randevular
    harita.appointments = dizi('appointments').map((a) => kimlik(a, 'rnd:'));

    // Denemeler — yüklenen deneme sonuçları (exam_results ölü anahtardı)
    harita.exams = dizi('v2_results_data').map((e) => kimlik(e, 'dnm:'));

    /* Davet rozeti kaldırıldı: davetler artık sunucuda yaşıyor
       (InviteManager) — `student_invites` yereline hiçbir yer yazmıyor,
       satır hep boş dönüyordu. */

    // PDR bölümü arşivlendi — pdr-* sekme rozetleri artık üretilmez.

    return harita;
};

const ogrenciBekleyenler = (user) => {
    const uid = String(user?.id ?? '');
    const harita = {};

    /* Görevler — birleşik depo (tanım + ilerleme); okul numarası altında
       duran eski tanımlar da sayılır. */
    const gorevler = [
        ...gorevDeposu.birlesikOku(uid),
        ...(user?.schoolNumber ? gorevDeposu.birlesikOku(user.schoolNumber) : []),
    ];
    harita.tasks = gorevler
        .filter((g) => !g.completed && g.status !== 'Tamamlandı')
        .map((g) => kimlik(g, 'gorev:'));

    // Mesajlar — koçtan gelen okunmamışlar (yön-ayrımlı kanal)
    harita.messages = mesajKanali.ogrenciOkunmamisIdler(uid);

    /* Program — çizelge dizi değil NESNE; listeOku hep [] veriyordu.
       Programın "yeni" sayılması için meta güncelleme damgası kullanılır. */
    const programMeta = guvenliJson(`program_meta_${uid}`, null);
    harita.program = programMeta?.updatedAt ? [`prg:${programMeta.updatedAt}`] : [];

    harita.tests = dizi(`assigned_tests_${uid}`)
        .filter((t) => t.status === 'pending' || !t.status)
        .map((t) => kimlik(t, 'tst:'));

    harita.appointments = dizi('appointments')
        .filter((a) => String(a.studentId) === uid)
        .map((a) => kimlik(a, 'rnd:'));

    // Konu takibi — tekrar gereken konular öğrenciye hatırlatılır
    const konuDepo = guvenliJson('topic_progress', {}) || {};
    harita.topics = Object.keys(konuDepo[uid] || {}).map((x) => `konu:${x}`);

    return harita;
};

const veliBekleyenler = (user) => {
    const cocukId = String(user?.studentId ?? user?.childId ?? '');
    const harita = {};

    // Koçtan çocuğa giden mesajlar (yön-ayrımlı kanal)
    harita.messages = mesajKanali.ogrenciOkunmamisIdler(cocukId);

    harita.exams = dizi('v2_results_data')
        .filter((e) => String(e.studentId) === cocukId)
        .map((e) => kimlik(e, 'dnm:'));

    /* Görüşme rozeti kaldırıldı: `guidance_sessions` PDR arşiviyle
       birlikte ölü anahtar — hiçbir aktif ekran yazmıyor. */

    harita.tasks = gorevDeposu.birlesikOku(cocukId)
        .filter((g) => !g.completed && g.status !== 'Tamamlandı')
        .map((g) => kimlik(g, 'gorev:'));

    return harita;
};

const BEKLEYEN_URETICI = {
    coach: kocBekleyenler,
    student: (u) => ogrenciBekleyenler(u),
    parent: (u) => veliBekleyenler(u),
};

// ══════════════════════════════════════════════════════════════
//  ROZET SAYIMI
// ══════════════════════════════════════════════════════════════

/**
 * @param {'coach'|'student'|'parent'} rol
 * @returns {Object<string, number>} yalnızca sıfırdan büyük sayaçlar
 */
export const rozetler = (rol, user, bolum = 'kocluk') => {
    const uretici = BEKLEYEN_URETICI[rol];
    if (!uretici) return {};

    const bekleyen = uretici(user, bolum);
    const gorulen = ziyaretler(rol, user?.id);
    const say = {};

    Object.entries(bekleyen).forEach(([tab, idler]) => {
        const seen = new Set(gorulen[tab]?.ids || []);
        const yeni = idler.filter((x) => !seen.has(x)).length;
        if (yeni > 0) say[tab] = yeni;
    });

    return say;
};

/**
 * Sekme açıldı: o an bekleyen kayıtların hepsi "görüldü" sayılır.
 * Rozet ancak YENİ bir kayıt geldiğinde geri döner.
 */
export const ziyaretIsaretle = (rol, userId, tabId, user = null, bolum = 'kocluk') => {
    if (!tabId) return;

    const uretici = BEKLEYEN_URETICI[rol];
    const bekleyen = uretici ? uretici(user || { id: userId }, bolum) : {};
    const idler = (bekleyen[tabId] || []).slice(-AZAMI_KIMLIK);

    const mevcut = ziyaretler(rol, userId);
    mevcut[tabId] = { at: new Date().toISOString(), ids: idler };

    localStorage.setItem(SEEN_KEY(rol, userId), JSON.stringify(mevcut));
    try { window.dispatchEvent(new Event('tab-badges-updated')); } catch { /* ignore */ }
};

// ── Geriye dönük uyumlu sarmalayıcılar ────────────────────────
export const kocRozetleri = (user, bolum = 'kocluk') => rozetler('coach', user, bolum);
export const ogrenciRozetleri = (user) => rozetler('student', user);
export const veliRozetleri = (user) => rozetler('parent', user);

export default {
    ziyaretler, ziyaretIsaretle, rozetler,
    kocRozetleri, ogrenciRozetleri, veliRozetleri,
    tarihAl,
};
