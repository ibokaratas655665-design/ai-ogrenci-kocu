/**
 * 🧠 PROGRAM HAFIZASI — koçun karar desteği katmanı
 *
 * ══════════════════════════════════════════════════════════════
 *  BU DOSYA VERİ YAZMAZ, YENİ KOLEKSİYON AÇMAZ.
 * ══════════════════════════════════════════════════════════════
 * Talimat §49: "Mevcut verilerle çözüm mümkünse YENİ KOLEKSİYON
 * OLUŞTURMA." Mümkün — hafızanın tamamı hâlihazırdaki üç kaynaktan
 * ANLIK türetilir:
 *
 *   student_programs_{id} / program_schedule_{id}
 *       koçun yazdığı çizelge → PLANLANAN
 *   program_progress
 *       öğrencinin etüt işaretleri → GERÇEKLEŞEN ETÜT
 *   study_log
 *       öğrencinin çözdüğü sorular → GERÇEKLEŞEN SORU
 *
 * Program motoruna, senkronizasyona ve etüt tamamlama mantığına
 * dokunulmaz; buradan yalnızca okunur.
 *
 * ── PLANLANAN ≠ GERÇEKLEŞEN (§10) ─────────────────────────────
 * Programda "120 soru" yazması öğrencinin 120 soru çözdüğü anlamına
 * gelmez. Bu katman üçünü ayrı tutar:
 *     hedef (plan) · cozulen (gerçek) · eksik (fark)
 *
 * ── ÇİFT SAYMA YASAĞI (§8, §32) ───────────────────────────────
 * Eksik her seferinde `hedef − çözülen` olarak YENİDEN hesaplanır;
 * hiçbir yerde biriktirilmez. 35 eksikken 20 soru çözülürse sonuç
 * 15'tir, 55 değil. Depoya yazılmadığı için sayfa yenilense de,
 * program yeniden oluşturulsa da aynı sonuç çıkar.
 *
 * ── SAHTE VERİ YASAĞI (§48) ───────────────────────────────────
 * Geçmiş veri yoksa uydurma sayı üretilmez; `veri: false` döner.
 */

import { listeOku, nesneOku } from './veriDeposu';
import { getProgress, getCarryOverQueue } from './programProgressService';
import { anahtar as konuAnahtari } from './topicProgressService';
import { TEKRAR_ARALIKLARI_GUN, DONEMLIK_TEKRAR_GUN } from '../data/sinavYapisi';
import { SINAV_LISTESI, tumKonular } from '../data/examTopics';

const sayi = (v) => Number(v) || 0;
const gun = 86400000;

/**
 * İki tarih arasındaki TAM GÜN farkı — yerel takvime göre.
 *
 * ⚠️ Doğrudan zaman damgası çıkarmak yanlış sonuç verir:
 * `new Date('2026-06-25')` UTC gece yarısını, `new Date()` ise yerel
 * anı gösterir. UTC+3'te bu fark 60 günlük aralığı 59 gün gösteriyordu
 * — tekrar zamanı bir gün geç geliyordu. Her iki uç da yerel gün
 * başına yuvarlanarak karşılaştırılır.
 */
const gunFarki = (tarihMetni, bugun) => {
    const p = String(tarihMetni || '').slice(0, 10).split('-').map(Number);
    if (p.length !== 3 || p.some(Number.isNaN)) return null;
    const bas = new Date(p[0], p[1] - 1, p[2]);      // yerel gün başı
    const son = new Date(bugun);
    son.setHours(0, 0, 0, 0);
    return Math.round((son - bas) / gun);
};

/** Ders sayılan etüt türleri — etkinlik blokları hafızaya girmez. */
const DERS_TURLERI = new Set(['konu', 'soru', 'tekrar']);

/**
 * KATALOG SORU HEDEFLERİ — konu adı → hedef soru.
 *
 * Dört sınavın bütün konuları taranıp `hedefSoruHesapla` ile hedefleri
 * çıkarılır. Tembel kurulur ve bir kez hesaplanır; her çağrıda binlerce
 * konuyu yeniden dolaşmak gereksiz.
 *
 * Aynı konu adı birden çok sınavda geçebilir (TYT ve KPSS "Paragraf").
 * Bu durumda EN YÜKSEK hedef alınır: hedefi düşük tutup öğrenciyi
 * eksiksiz göstermektense yüksek tutup eksiği görünür kılmak daha
 * güvenlidir.
 */
let _katalogHedef = null;
const katalogHedefHaritasi = () => {
    if (_katalogHedef) return _katalogHedef;
    _katalogHedef = new Map();
    try {
        for (const sinav of SINAV_LISTESI) {
            for (const t of tumKonular(sinav.id)) {
                const a = konuAnahtari(t.konu);
                const mevcut = _katalogHedef.get(a) || 0;
                if (t.hedef > mevcut) _katalogHedef.set(a, t.hedef);
            }
        }
    } catch { /* katalog okunamazsa hedefsiz devam — uydurma yapılmaz */ }
    return _katalogHedef;
};

/** Koçun yazdığı çizelgeyi okur (iki eski anahtar da denenir). */
export const cizelgeOku = (studentId) => {
    for (const anahtar of [`student_programs_${studentId}`, `program_schedule_${studentId}`]) {
        const v = nesneOku(anahtar);
        if (!v || typeof v !== 'object') continue;
        const s = v.schedule && typeof v.schedule === 'object' ? v.schedule : v;
        if (s && Object.keys(s).length) return s;
    }
    return {};
};

/**
 * Öğrencinin konu bazlı soru geçmişi.
 * @returns {Map<string, {cozulen, dogru, yanlis, sonTarih}>}
 */
const soruGecmisi = (studentId) => {
    const harita = new Map();
    const kayitlar = listeOku('study_log');
    if (!Array.isArray(kayitlar)) return harita;

    for (const k of kayitlar) {
        if (String(k.studentId) !== String(studentId)) continue;
        if (k.kind && k.kind !== 'soru') continue;      // kitap kaydı soruya sayılmaz
        const a = konuAnahtari(k.topic);
        if (!a) continue;

        const m = harita.get(a) || { cozulen: 0, dogru: 0, yanlis: 0, sonTarih: null };
        const d = sayi(k.correct); const y = sayi(k.wrong); const b = sayi(k.blank);
        m.cozulen += d + y + b;
        m.dogru += d;
        m.yanlis += y;
        if (k.date && (!m.sonTarih || String(k.date) > m.sonTarih)) m.sonTarih = k.date;
        harita.set(a, m);
    }
    return harita;
};

/* ══════════════════════════════════════════════════════════════
   1. EKSİK SORU  (§6, §8, §32)
   ══════════════════════════════════════════════════════════════ */

/**
 * Programda geçen her konu için: hedef, çözülen, eksik.
 *
 * Hedef, çizelgeye giren konunun katalogdaki soru hedefidir; koç
 * konu listesine eklerken bu değer `konular` üzerinden gelir. Çizelge
 * hedefi taşımıyorsa (eski kayıtlar) o konu hedefsiz sayılır ve
 * eksik hesaplanmaz — uydurma hedef üretilmez.
 *
 * @param {Array} konular Koçun seçim listesi [{dersAd, konu, hedef}]
 */
export const eksikSorular = (studentId, konular = []) => {
    const gecmis = soruGecmisi(studentId);
    const cizelge = cizelgeOku(studentId);

    /* Hedefler: önce koçun seçim listesinden, yoksa çizelgeden. */
    const hedefler = new Map();
    for (const k of konular) {
        if (!k?.konu) continue;
        hedefler.set(konuAnahtari(k.konu), {
            ders: k.dersAd || k.ders || '', konu: k.konu, hedef: sayi(k.hedef),
        });
    }
    /**
     * Çizelgedeki konular için hedef KATALOGDAN çözülür.
     *
     * Koç programı kaydedip modalı kapattığında dağıtım listesi boşalır;
     * sonraki açılışta `konular` boş gelir ve hiçbir hedef bilinmezdi —
     * "eksik soru" bölümü hep boş görünüyordu. Oysa hedef katalogda
     * duruyor (konunun ağırlık ve zorluğundan hesaplanıyor); uydurmaya
     * gerek yok, okumak yeterli.
     */
    const katalogHedefi = katalogHedefHaritasi();
    for (const h of Object.values(cizelge)) {
        if (!h || !DERS_TURLERI.has(h.type || 'konu') || !h.topic) continue;
        const a = konuAnahtari(h.topic);
        if (hedefler.has(a)) continue;
        hedefler.set(a, {
            ders: h.subject || '',
            konu: h.topic,
            hedef: katalogHedefi.get(a) || 0,
        });
    }

    const satirlar = [];
    for (const [a, bilgi] of hedefler) {
        const g = gecmis.get(a) || { cozulen: 0, dogru: 0, yanlis: 0, sonTarih: null };
        // ⚠️ Eksik BİRİKTİRİLMEZ, her seferinde yeniden hesaplanır (§8)
        const eksik = bilgi.hedef > 0 ? Math.max(0, bilgi.hedef - g.cozulen) : null;
        const cevaplanan = g.dogru + g.yanlis;
        satirlar.push({
            ders: bilgi.ders,
            konu: bilgi.konu,
            hedef: bilgi.hedef || null,
            cozulen: g.cozulen,
            eksik,
            isabet: cevaplanan > 0 ? Math.round((g.dogru / cevaplanan) * 100) : null,
            sonTarih: g.sonTarih,
        });
    }

    const eksigiOlan = satirlar.filter((s) => s.eksik > 0);
    return {
        veri: satirlar.length > 0,
        sebep: satirlar.length ? null : 'program-yok',
        satirlar,
        eksigiOlan: eksigiOlan.sort((a, b) => b.eksik - a.eksik),
        toplamEksik: eksigiOlan.reduce((t, s) => t + s.eksik, 0),
    };
};

/* ══════════════════════════════════════════════════════════════
   2. EKSİK ETÜT  (§9)
   ══════════════════════════════════════════════════════════════ */

/**
 * Planlanmış ama tamamlanmamış etütler. Hesabın kendisi
 * `getCarryOverQueue`tedir; burada yalnızca özetlenir.
 */
export const eksikEtutler = (studentId) => {
    const cizelge = cizelgeOku(studentId);
    if (!Object.keys(cizelge).length) {
        return { veri: false, sebep: 'program-yok', satirlar: [], toplam: 0 };
    }
    let kuyruk = [];
    try { kuyruk = getCarryOverQueue(studentId, cizelge) || []; } catch { kuyruk = []; }

    return {
        veri: kuyruk.length > 0,
        sebep: kuyruk.length ? null : 'eksik-etut-yok',
        satirlar: kuyruk.map((k) => ({
            ders: k.subject, konu: k.topic, exam: k.exam,
            eksikEtut: sayi(k.weight),
        })).sort((a, b) => b.eksikEtut - a.eksikEtut),
        toplam: kuyruk.reduce((t, k) => t + sayi(k.weight), 0),
    };
};

/* ══════════════════════════════════════════════════════════════
   3. TEKRAR ZAMANI  (§11, §13, §45)
   ══════════════════════════════════════════════════════════════ */

/**
 * TEKRAR ARALIĞI — konunun zorluğuna ve öğrencinin isabetine göre.
 *
 * Temel dizi `TEKRAR_ARALIKLARI_GUN` (1·7·30 gün) genişleyen aralık
 * ilkesine dayanır: kısa ilk tekrar unutma eğrisini kırar, sonrakiler
 * kalıcılığı uzatır. Buradaki tek ekleme, talimat §13'ün istediği
 * uyarlamadır:
 *
 *     ZOR konu  + DÜŞÜK isabet → aralık KISALIR
 *     KOLAY konu + YÜKSEK isabet → aralık UZAR
 *
 * Çarpan uydurma bir katsayı değil, iki uçtan türetilir: en zor/en
 * başarısız durumda aralık yarıya iner, en kolay/en başarılı durumda
 * bir buçuk katına çıkar. Aradaki değerler doğrusal geçer.
 *
 * @param {number} zorluk 1 kolay · 2 orta · 3 zor
 * @param {number|null} isabet 0-100, veri yoksa null
 */
export const tekrarAraligi = (temelGun, zorluk = 2, isabet = null) => {
    /* Zorluk katkısı: 1 → +0.25, 2 → 0, 3 → −0.25 */
    const zorlukPay = (2 - (Number(zorluk) || 2)) * 0.25;
    /* İsabet katkısı: %100 → +0.25, %50 → 0, %0 → −0.25.
       Veri yoksa nötr (0) — tahmin yürütülmez. */
    const isabetPay = isabet === null ? 0 : ((isabet - 50) / 100) * 0.5;
    const carpan = Math.max(0.5, Math.min(1.5, 1 + zorlukPay + isabetPay));
    return Math.max(1, Math.round(temelGun * carpan));
};

/**
 * Tekrar zamanı gelen konular.
 *
 * Bir konu, son çalışıldığı günden bu yana geçen süre uyarlanmış
 * tekrar aralığını aştıysa listeye girer. ÖNERİDİR — programa
 * otomatik EKLENMEZ (§12); son karar koçundur.
 */
export const tekrarZamanlari = (studentId, konular = [], bugun = new Date()) => {
    const gecmis = soruGecmisi(studentId);
    const zorlukHarita = new Map();
    for (const k of konular) {
        if (k?.konu) zorlukHarita.set(konuAnahtari(k.konu), k);
    }

    /* Çizelgedeki konular da hafızaya girer — koç listeyi kapatmış
       olabilir ama öğrenci o konuyu çalışmıştır. */
    const cizelge = cizelgeOku(studentId);
    for (const h of Object.values(cizelge)) {
        if (!h || !DERS_TURLERI.has(h.type || 'konu') || !h.topic) continue;
        const a = konuAnahtari(h.topic);
        if (!zorlukHarita.has(a)) {
            zorlukHarita.set(a, { konu: h.topic, dersAd: h.subject, zorluk: 2 });
        }
    }

    const aralikDizisi = [...TEKRAR_ARALIKLARI_GUN, DONEMLIK_TEKRAR_GUN];
    const satirlar = [];

    for (const [a, k] of zorlukHarita) {
        const g = gecmis.get(a);
        if (!g?.sonTarih) continue;              // hiç çalışılmamış → tekrar önerilmez

        const gecenGun = gunFarki(g.sonTarih, bugun);
        if (gecenGun === null || gecenGun < 1) continue;

        const cevaplanan = g.dogru + g.yanlis;
        const isabet = cevaplanan >= 10 ? Math.round((g.dogru / cevaplanan) * 100) : null;

        /* Geçen süreye uyan en büyük halka: konunun hangi tekrar
           aşamasında olduğunu gösterir. */
        let vadesiGelen = null;
        for (const temel of aralikDizisi) {
            const aralik = tekrarAraligi(temel, k.zorluk, isabet);
            if (gecenGun >= aralik) vadesiGelen = { temel, aralik };
        }
        if (!vadesiGelen) continue;

        satirlar.push({
            ders: k.dersAd || k.ders || '',
            konu: k.konu,
            zorluk: k.zorluk ?? 2,
            isabet,
            sonTarih: g.sonTarih,
            gecenGun,
            onerilenAralik: vadesiGelen.aralik,
            /* Gecikme = ne kadar aşıldı; sıralama önceliği budur. */
            gecikme: gecenGun - vadesiGelen.aralik,
        });
    }

    satirlar.sort((a, b) => b.gecikme - a.gecikme);
    return {
        veri: satirlar.length > 0,
        sebep: satirlar.length ? null : 'tekrar-zamani-gelen-yok',
        satirlar,
        toplam: satirlar.length,
    };
};

/* ══════════════════════════════════════════════════════════════
   4. HAFTA ÖZETİ  (§34)
   ══════════════════════════════════════════════════════════════ */

/** Geçen haftanın tamamlanma oranı — plan ne kadar tutmuş. */
export const gecenHaftaOzeti = (studentId, tarihCoz) => {
    const cizelge = cizelgeOku(studentId);
    const ilerleme = getProgress(studentId);
    const anahtarlar = Object.keys(cizelge);
    if (!anahtarlar.length || !tarihCoz) {
        return { veri: false, sebep: 'program-yok' };
    }

    const simdi = new Date(); simdi.setHours(0, 0, 0, 0);
    const haftaBas = new Date(simdi);
    haftaBas.setDate(haftaBas.getDate() - ((haftaBas.getDay() === 0 ? 7 : haftaBas.getDay()) - 1));
    const gecenBas = new Date(haftaBas.getTime() - 7 * gun);

    let planlanan = 0, tamamlanan = 0;
    for (const k of anahtarlar) {
        const h = cizelge[k];
        if (!h || h.type === 'mola') continue;
        const t = tarihCoz(k);
        if (!t || t < gecenBas || t >= haftaBas) continue;
        planlanan += 1;
        if (ilerleme[k]?.status === 'done') tamamlanan += 1;
    }

    if (!planlanan) return { veri: false, sebep: 'gecen-hafta-plan-yok' };
    return {
        veri: true,
        planlanan,
        tamamlanan,
        oran: Math.round((tamamlanan / planlanan) * 100),
    };
};

/* ══════════════════════════════════════════════════════════════
   5. TEK ÇAĞRIDA HAFIZA ÖZETİ
   ══════════════════════════════════════════════════════════════ */

/**
 * Koça gösterilecek hafıza paketi. Yeni hafta oluşturulurken
 * §14'teki karar destek verileri buradan gelir.
 */
export const hafizaOzeti = (studentId, konular = [], { tarihCoz } = {}) => {
    const soru = eksikSorular(studentId, konular);
    const etut = eksikEtutler(studentId);
    const tekrar = tekrarZamanlari(studentId, konular);
    const gecen = tarihCoz ? gecenHaftaOzeti(studentId, tarihCoz) : { veri: false, sebep: 'tarih-cozucu-yok' };

    const bosMu = !soru.eksigiOlan.length && !etut.satirlar.length && !tekrar.satirlar.length;

    return {
        veri: !bosMu,
        sebep: bosMu ? 'yeterli-gecmis-veri-yok' : null,
        eksikSoru: soru,
        eksikEtut: etut,
        tekrar,
        gecenHafta: gecen,
        rozet: {
            eksikKonu: soru.eksigiOlan.length,
            eksikSoru: soru.toplamEksik,
            eksikEtut: etut.toplam,
            tekrarSayisi: tekrar.toplam,
            gecenHaftaOran: gecen.veri ? gecen.oran : null,
        },
    };
};

/**
 * Hafızadaki bir satırı koçun dağıtım listesine eklenebilir biçime
 * çevirir. Motorun beklediği alan adları korunur.
 */
export const listeyeCevir = (satir, tur) => ({
    bolum: satir.exam || satir.bolum || '',
    ders: satir.ders,
    dersAd: satir.ders,
    konu: satir.konu,
    agirlik: 1,
    zorluk: satir.zorluk ?? 2,
    hedef: satir.hedef ?? null,
    kalanSoru: tur === 'soru' ? satir.eksik : null,
    bitti: false,
    hafizadan: tur,        // 'soru' | 'etut' | 'tekrar'
    subject: satir.ders,
    topic: satir.konu,
    exam: satir.exam || '',
});

export default {
    cizelgeOku, eksikSorular, eksikEtutler, tekrarAraligi,
    tekrarZamanlari, gecenHaftaOzeti, hafizaOzeti, listeyeCevir,
};
