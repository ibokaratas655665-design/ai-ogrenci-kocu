/**
 * 📊 GELİŞİM ANALİTİĞİ — türetilmiş istatistik katmanı
 *
 * ══════════════════════════════════════════════════════════════
 *  BU DOSYA VERİ YAZMAZ.
 * ══════════════════════════════════════════════════════════════
 * Tek bir `localStorage.setItem`, tek bir Firestore yazımı yoktur.
 * Bütün değerler MEVCUT kaynaklardan ANLIK türetilir:
 *
 *   study_log              → çözülen soru, süre, ders/konu dağılımı
 *   deneme_analizleri      → net, hata nedeni, öz değerlendirme
 *   v2_results_data        → koçun yüklediği deneme sonuçları
 *   error_notebook         → hata kayıtları
 *   student_programs_{id}  → koçun yazdığı program (SALT OKUNUR)
 *   program_progress       → etüt tamamlama (SALT OKUNUR)
 *   topic_progress         → konu ilerlemesi
 *
 * Program motoruna, program dağıtımına, senkronizasyona ve etüt
 * tamamlama mantığına DOKUNULMAZ; buradan yalnızca okunur.
 *
 * ── YETERLİ VERİ İLKESİ ────────────────────────────────────────
 * Her ölçüm `{ veri: bool, ... }` döner. `veri:false` ise arayüz
 * sayı DEĞİL, dürüst bir boş durum gösterir. Küçük örneklemde
 * trend iddia edilmez — iki deneme bir eğilim değildir.
 *
 * ── ARAŞTIRMA DAYANAĞI ─────────────────────────────────────────
 * [A] Yorum desteği olmayan gösterge tablosu, öğrenciye fayda
 *     sağlamadan bilişsel yük bindirir. Bu yüzden her ölçümün
 *     `yorum` alanı vardır: sayının düz Türkçe okunuşu.
 *     — Design Principles and Impact of a Learning Analytics
 *       Dashboard (randomize MOOC deneyi, 2025)
 * [B] Akran karşılaştırması (norm-referenced) öğrencide rekabet ve
 *     kaygı üretebilir; ÖĞRENCİ tarafında kendi geçmişiyle
 *     karşılaştırma (self-referenced) esastır. Akran kıyası yalnızca
 *     KOÇ tarafında, karar desteği olarak kullanılır.
 *     — Social Comparison in LAD (2023); Students' Emotional
 *       Reactions to Social Comparison via a Learner Dashboard (2021)
 * [C] Öğrenciye "tahmin" değil "betimleme" sunulur; kestirimci dil
 *     istatistik kaygısını artırır.
 *     — Predict or describe? (2021)
 * [D] Öz düzenlemeli öğrenme döngüseldir: hazırlık → performans →
 *     değerlendirme. Sekmeler bu döngüye karşılık gelir:
 *     BUGÜN (hazırlık) · PROGRAM/ÇALIŞMALARIM (performans) ·
 *     GELİŞİMİM (değerlendirme).
 *     — Students' Use of a LAD and Influence of Reference Frames
 *       (JCAL, 2025)
 */

import { listeOku, nesneOku } from './veriDeposu';
import { getEntries } from './studyLogService';
import { ogrencininKayitlari } from './denemeKayitlari';
import { birlesikDenemeler } from '../utils/denemeAnalizi';
import { nedenAdi } from '../data/hataNedenleri';

/* ══════════════════════════════════════════════════════════════
   YARDIMCILAR
   ══════════════════════════════════════════════════════════════ */

const sayi = (v) => Number(v) || 0;

/** Gün başlangıcına yuvarlar. */
const gunBasi = (d = new Date()) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
};

/** N gün öncesinin başlangıcı. */
export const gunOnce = (n, d = new Date()) => {
    const x = gunBasi(d);
    x.setDate(x.getDate() - n);
    return x;
};

/**
 * Bir tarihi 'YYYY-MM-DD' anahtarına çevirir — YEREL takvime göre.
 *
 * ⚠️ NEDEN ZAMAN DAMGASIYLA KARŞILAŞTIRMIYORUZ
 * Kayıtlardaki tarih 'YYYY-MM-DD' metnidir ve `new Date('2026-08-23')`
 * bunu UTC gece yarısı olarak ayrıştırır. Pencere sınırları ise yerel
 * gece yarısıdır. UTC+3'te bu 3 saatlik kayma demektir: bugünün kaydı
 * (yerel 03:00) üst sınırın (yerel 00:00) ÜSTÜNDE kalır ve pencereden
 * sessizce düşer. Ölçüldü: 30 günlük pencerede 1295 sorunun 1211'i
 * sayılıyordu — bugünün 84 sorusu kayboluyordu.
 *
 * Metin anahtarı karşılaştırması saat diliminden bağımsızdır ve
 * 'YYYY-MM-DD' biçiminde sözlük sırası = takvim sırasıdır.
 */
export const gunAnahtari = (d = new Date()) => {
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

/** Kayıttaki tarihi anahtara indirger; hangi alanda olursa olsun. */
const kayitAnahtari = (kayit, ...alanlar) => {
    for (const alan of alanlar) {
        const v = kayit?.[alan];
        if (!v) continue;
        // Zaten 'YYYY-MM-DD' ise olduğu gibi kullan (ayrıştırma yok)
        const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(v));
        if (m) return m[1];
        const t = new Date(v);
        if (!Number.isNaN(t.getTime())) return gunAnahtari(t);
    }
    return null;
};

/**
 * Yüzde değişim — payda sıfırken YANLIŞ sonuç üretmemek için
 * `null` döner. "0'dan 5'e çıktı" bir yüzde değildir; arayüz bunu
 * "yeni başladı" olarak sunmalıdır.
 */
export const yuzdeDegisim = (yeni, eski) => {
    const a = sayi(eski);
    const b = sayi(yeni);
    if (a === 0) return null;
    return Math.round(((b - a) / Math.abs(a)) * 100);
};

/** Güvenli oran (0-100). Payda 0 ise null. */
export const oran = (pay, payda) => {
    const p = sayi(payda);
    if (p <= 0) return null;
    return Math.round((sayi(pay) / p) * 100);
};

/**
 * Basit doğrusal eğim (en küçük kareler). Serinin yönünü verir.
 * Nokta sayısı `enAz`dan azsa null — iki nokta bir eğilim değildir.
 */
export const egim = (degerler = [], enAz = 3) => {
    const y = degerler.map(sayi).filter((v) => Number.isFinite(v));
    if (y.length < enAz) return null;
    const n = y.length;
    const xOrt = (n - 1) / 2;
    const yOrt = y.reduce((a, b) => a + b, 0) / n;
    let pay = 0, payda = 0;
    for (let i = 0; i < n; i++) {
        pay += (i - xOrt) * (y[i] - yOrt);
        payda += (i - xOrt) ** 2;
    }
    if (payda === 0) return null;
    return +(pay / payda).toFixed(3);
};

/** Eğimi okunur yöne çevirir. */
export const yon = (e, esik = 0.05) => {
    if (e === null) return 'belirsiz';
    if (e > esik) return 'yukselis';
    if (e < -esik) return 'dusus';
    return 'sabit';
};

/* ══════════════════════════════════════════════════════════════
   1. ÇALIŞMA — study_log
   ══════════════════════════════════════════════════════════════ */

/**
 * Belirtilen gün penceresindeki çalışma toplamı ve bir önceki
 * eşit pencereyle karşılaştırması.
 *
 * Karşılaştırma KENDİ GEÇMİŞİYLEDİR [B] — akran verisi kullanılmaz.
 */
export const calismaOzeti = (studentId, gun = 7) => {
    const hepsi = getEntries(studentId);
    const simdi = gunBasi();
    const buBas = gunOnce(gun - 1);
    const oncekiBas = gunOnce(gun * 2 - 1);

    const topla = (liste) => liste.reduce((t, e) => {
        const soru = e.kind === 'kitap' ? 0 : sayi(e.correct) + sayi(e.wrong) + sayi(e.blank);
        return {
            soru: t.soru + soru,
            dogru: t.dogru + (e.kind === 'kitap' ? 0 : sayi(e.correct)),
            yanlis: t.yanlis + (e.kind === 'kitap' ? 0 : sayi(e.wrong)),
            bos: t.bos + (e.kind === 'kitap' ? 0 : sayi(e.blank)),
            dakika: t.dakika + sayi(e.minutes),
            kayit: t.kayit + 1,
        };
    }, { soru: 0, dogru: 0, yanlis: 0, bos: 0, dakika: 0, kayit: 0 });

    /* Sınırlar da kayıtlar da 'YYYY-MM-DD' anahtarına indirgenir;
       saat dilimi kayması bu karşılaştırmada oluşamaz. */
    const araliktaki = (bas, bit) => {
        const a = gunAnahtari(bas);
        const b = gunAnahtari(bit);
        return hepsi.filter((e) => {
            const k = kayitAnahtari(e, 'date', 'createdAt');
            return k && k >= a && k <= b;
        });
    };

    const bu = topla(araliktaki(buBas, simdi));
    const onceki = topla(araliktaki(oncekiBas, gunOnce(gun)));

    const isabet = bu.dogru + bu.yanlis > 0
        ? Math.round((bu.dogru / (bu.dogru + bu.yanlis)) * 100)
        : null;

    return {
        veri: bu.kayit > 0,
        gun,
        ...bu,
        isabet,
        oncekiSoru: onceki.soru,
        oncekiDakika: onceki.dakika,
        soruDegisim: onceki.kayit > 0 ? yuzdeDegisim(bu.soru, onceki.soru) : null,
        dakikaDegisim: onceki.kayit > 0 ? yuzdeDegisim(bu.dakika, onceki.dakika) : null,
        karsilastirilabilir: onceki.kayit > 0,
    };
};

/**
 * Günlük çalışma serisi — ısı haritası ve çizgi grafik için.
 * Kayıt olmayan gün 0 olarak DEĞİL, `kayit:false` ile döner;
 * "çalışmadı" ile "veri girmedi" ayrımı arayüze bırakılır.
 */
export const gunlukSeri = (studentId, gun = 30) => {
    const hepsi = getEntries(studentId);
    const harita = new Map();
    hepsi.forEach((e) => {
        const g = harita.get(e.date) || { soru: 0, dakika: 0, kayit: 0 };
        if (e.kind !== 'kitap') g.soru += sayi(e.correct) + sayi(e.wrong) + sayi(e.blank);
        g.dakika += sayi(e.minutes);
        g.kayit += 1;
        harita.set(e.date, g);
    });

    const seri = [];
    for (let i = gun - 1; i >= 0; i--) {
        const d = gunOnce(i);
        const anahtar = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const g = harita.get(anahtar);
        seri.push({
            tarih: anahtar,
            gunAdi: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'][d.getDay()],
            soru: g?.soru ?? 0,
            dakika: g?.dakika ?? 0,
            kayit: Boolean(g),
        });
    }
    return seri;
};

/**
 * Çalışma istikrarı — pencerede kaç günde kayıt var.
 * "Ne kadar çok" değil "ne kadar düzenli" sorusunu yanıtlar;
 * öz düzenlemede süreklilik tek seferlik yüklenmeden değerlidir [D].
 */
export const istikrar = (studentId, gun = 28) => {
    const seri = gunlukSeri(studentId, gun);
    const aktif = seri.filter((g) => g.kayit).length;

    // En uzun kesintisiz çalışma zinciri
    let enUzun = 0, sayac = 0;
    seri.forEach((g) => {
        if (g.kayit) { sayac += 1; enUzun = Math.max(enUzun, sayac); }
        else sayac = 0;
    });

    // Güncel zincir — sondan geriye
    let guncel = 0;
    for (let i = seri.length - 1; i >= 0; i--) {
        if (seri[i].kayit) guncel += 1; else break;
    }

    return {
        veri: aktif > 0,
        gun,
        aktifGun: aktif,
        oran: oran(aktif, gun),
        enUzunZincir: enUzun,
        guncelZincir: guncel,
    };
};

/* ══════════════════════════════════════════════════════════════
   2. PROGRAM UYUMU — SALT OKUNUR
   ══════════════════════════════════════════════════════════════
   Programın kendisi burada ÜRETİLMEZ, DEĞİŞTİRİLMEZ. Koçun yazdığı
   çizelge ve öğrencinin tamamlama kayıtları yalnızca okunur.

   Uyum = tamamlanan ÷ o güne kadar planlanmış (vadesi gelmiş).
   Gelecek etütler paydaya KATILMAZ — henüz yapılmamış olmaları
   bir başarısızlık değildir. Yanlış payda burada en kolay yapılan
   istatistik hatasıdır.
   ══════════════════════════════════════════════════════════════ */

/**
 * DERS SAYILAN ETÜT TÜRLERİ.
 *
 * programProgressService içindeki STUDY_TYPES ile aynı kümedir; ders
 * bazlı her kırılım (uyum, risk) bu üç türle sınırlıdır. Deneme, kitap
 * okuma, paragraf ve analiz blokları birer ETKİNLİKTİR, ders değil.
 */
const DERS_TURLERI = new Set(['konu', 'soru', 'tekrar']);

/** Koçun yazdığı çizelgeyi okur (iki eski anahtar da denenir). */
export const cizelgeOku = (studentId) => {
    const a = nesneOku(`student_programs_${studentId}`);
    if (a && typeof a === 'object') {
        const s = a.schedule && typeof a.schedule === 'object' ? a.schedule : a;
        if (s && Object.keys(s).length) return s;
    }
    const b = nesneOku(`program_schedule_${studentId}`);
    if (b && typeof b === 'object') {
        const s = b.schedule && typeof b.schedule === 'object' ? b.schedule : b;
        if (s && Object.keys(s).length) return s;
    }
    return {};
};

/** Öğrencinin etüt tamamlama kayıtları. */
export const ilerlemeOku = (studentId) => {
    const depo = nesneOku('program_progress');
    return depo[String(studentId)] || {};
};

/**
 * Program uyumu. `hucreTarihi` ile aynı takvim mantığını kullanır;
 * vadesi gelmemiş etüt hesaba katılmaz.
 *
 * @param {Function} tarihCoz  (cellKey) => Date | null — çağıran taraf
 *   programProgressService'ten geçirir; bu servis oraya bağımlı olmasın
 *   diye enjekte edilir.
 */
export const programUyumu = (studentId, { tarihCoz, gun = null } = {}) => {
    const cizelge = cizelgeOku(studentId);
    const ilerleme = ilerlemeOku(studentId);
    const anahtarlar = Object.keys(cizelge);

    if (!anahtarlar.length) {
        return { veri: false, sebep: 'program-yok' };
    }

    const simdi = gunBasi();
    const alt = gun ? gunOnce(gun - 1) : null;

    let planlanan = 0, tamamlanan = 0, kacirilan = 0, bekleyen = 0;
    const dersBazli = new Map();

    anahtarlar.forEach((k) => {
        const h = cizelge[k];
        if (!h || !(h.topic || h.subject)) return;
        // Ders sayılmayan bloklar (esnek/telafi, mola) uyuma girmez
        if (h.type === 'mola') return;

        const t = tarihCoz ? tarihCoz(k) : null;
        if (t && t.getTime() > simdi.getTime()) { bekleyen += 1; return; }   // vadesi gelmedi
        if (alt && t && t.getTime() < alt.getTime()) return;                  // pencere dışı

        planlanan += 1;
        const yapildi = ilerleme[k]?.status === 'done';
        if (yapildi) tamamlanan += 1; else kacirilan += 1;

        /**
         * DERS KIRILIMI — yalnızca gerçek ders blokları.
         *
         * Çizelgedeki `subject` alanı iki farklı şey taşır:
         *   konu/soru/tekrar        → ders adı      ("Matematik")
         *   deneme/analiz/kitap/... → etkinlik adı  ("Kitap Okuma")
         *
         * Ayrılmazsa koç panelinde "Kitap Okuma %75 uyum" diye bir DERS
         * satırı belirir ve risk haritasına "Paragraf" bir dersmiş gibi
         * düşer. Genel oran bütün blokları sayar — öğrenci denemeyi de
         * yapmakla yükümlüdür — ama kırılım yalnızca dersleri sayar.
         */
        if (!DERS_TURLERI.has(h.type || 'konu') || !h.subject) return;

        const ders = h.subject;
        const d = dersBazli.get(ders) || { ders, planlanan: 0, tamamlanan: 0 };
        d.planlanan += 1;
        if (yapildi) d.tamamlanan += 1;
        dersBazli.set(ders, d);
    });

    /**
     * EN DÜŞÜK UYUM ÖNCE. Bu liste "hangi derste geride kalıyorum?"
     * sorusunu yanıtlar; en iyileri başa almak o soruyu görünmez kılardı.
     */
    const dersler = [...dersBazli.values()]
        .map((d) => ({ ...d, oran: oran(d.tamamlanan, d.planlanan) }))
        .sort((a, b) => (a.oran ?? 101) - (b.oran ?? 101) || b.planlanan - a.planlanan);

    return {
        veri: planlanan > 0,
        sebep: planlanan > 0 ? null : 'vadesi-gelmis-etut-yok',
        planlanan,
        tamamlanan,
        kacirilan,
        bekleyen,
        oran: oran(tamamlanan, planlanan),
        dersler,
    };
};

/**
 * Haftalık uyum serisi — "programıma ne kadar uyuyorum?" sorusunun
 * zaman içindeki cevabı. Görünür tempo göstergesi öz düzenlemeyi
 * destekler [A][D].
 */
export const uyumSerisi = (studentId, { tarihCoz, hafta = 6 } = {}) => {
    const cizelge = cizelgeOku(studentId);
    const ilerleme = ilerlemeOku(studentId);
    if (!Object.keys(cizelge).length || !tarihCoz) return [];

    const simdi = gunBasi();
    const kovalar = [];
    for (let i = hafta - 1; i >= 0; i--) {
        const bit = gunOnce(i * 7);
        const bas = gunOnce(i * 7 + 6);
        kovalar.push({ bas, bit, planlanan: 0, tamamlanan: 0 });
    }

    Object.entries(cizelge).forEach(([k, h]) => {
        if (!h || !(h.topic || h.subject) || h.type === 'mola') return;
        const t = tarihCoz(k);
        if (!t || t.getTime() > simdi.getTime()) return;
        const kova = kovalar.find((v) => t.getTime() >= v.bas.getTime() && t.getTime() <= v.bit.getTime());
        if (!kova) return;
        kova.planlanan += 1;
        if (ilerleme[k]?.status === 'done') kova.tamamlanan += 1;
    });

    // "27.7" bir ondalık sayı gibi okunuyordu; ay kısaltmasıyla yazılır.
    const AYLAR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
        'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

    return kovalar
        .filter((v) => v.planlanan > 0)
        .map((v) => ({
            etiket: `${v.bas.getDate()} ${AYLAR[v.bas.getMonth()]}`,
            planlanan: v.planlanan,
            tamamlanan: v.tamamlanan,
            oran: oran(v.tamamlanan, v.planlanan),
        }));
};

/* ══════════════════════════════════════════════════════════════
   3. DENEME VE NET
   ══════════════════════════════════════════════════════════════ */

/**
 * Net trendi. İki denemeyle eğilim iddia edilmez — `enAz` 3'tür [C].
 */
export const netTrendi = (studentId, ogrenciAdi, { enAz = 3 } = {}) => {
    const v2 = listeOku('v2_results_data');
    const manuel = ogrencininKayitlari(studentId);
    let birlesik = [];
    try {
        birlesik = birlesikDenemeler(v2, manuel, ogrenciAdi, 'all') || [];
    } catch {
        birlesik = [];
    }

    // Alan adları `birlesikDenemeler` çıktısına göredir: totalNet / tarihMs.
    // Yanlış alan okunursa bütün netler 0 çıkar ve trend sessizce "sabit"
    // görünür — bu yüzden testle kilitlenmiştir.
    const seri = birlesik
        .map((d, i) => ({
            sira: i + 1,
            ad: d.ad || `Deneme ${i + 1}`,
            // Grafik ekseni için kısa ve BENZERSİZ etiket. Uzun adlar
            // kırpılınca ("TYT Deneme 1" → "TYT Deneme") bütün noktalar
            // aynı görünüyordu; sıra numarası ayrımı garanti eder.
            kisaAd: `D${i + 1}`,
            tur: d.tur || null,
            kaynak: d.kaynak || null,
            tarih: d.tarihMs ? new Date(d.tarihMs).toISOString().slice(0, 10) : null,
            net: Number(d.totalNet),
        }))
        .filter((d) => Number.isFinite(d.net));

    if (seri.length === 0) return { veri: false, sebep: 'deneme-yok', adet: 0, seri: [] };

    const netler = seri.map((d) => d.net);
    const son = netler.at(-1);
    const ilk = netler[0];
    const e = egim(netler, enAz);

    return {
        veri: true,
        yeterliTrend: seri.length >= enAz,
        sebep: seri.length >= enAz ? null : 'trend-icin-az-deneme',
        adet: seri.length,
        seri,
        sonNet: son,
        ilkNet: ilk,
        enYuksek: Math.max(...netler),
        degisim: seri.length >= 2 ? +(son - netler.at(-2)).toFixed(2) : null,
        toplamDegisim: +(son - ilk).toFixed(2),
        egim: e,
        yon: yon(e, 0.2),
    };
};

/* ══════════════════════════════════════════════════════════════
   4. HATA ANALİZİ — error_notebook
   ══════════════════════════════════════════════════════════════ */

export const hataOzeti = (studentId, gun = 30) => {
    const hepsi = listeOku('error_notebook')
        .filter((h) => String(h.studentId) === String(studentId));
    if (!hepsi.length) return { veri: false, sebep: 'hata-kaydi-yok', toplam: 0 };

    // Anahtar karşılaştırması — bkz. gunAnahtari'ndeki saat dilimi notu
    const alt = gunAnahtari(gunOnce(gun - 1));
    const oncekiAlt = gunAnahtari(gunOnce(gun * 2 - 1));
    const anahtar = (h) => kayitAnahtari(h, 'date', 'tarih', 'createdAt');

    const bu = hepsi.filter((h) => { const k = anahtar(h); return k && k >= alt; });
    const onceki = hepsi.filter((h) => { const k = anahtar(h); return k && k >= oncekiAlt && k < alt; });

    /**
     * `errorType` depoda KİMLİK olarak tutulur ('islem', 'dikkat'…).
     * Ham kimliği ekrana basmak kullanıcıya kod göstermek olur; katalogdaki
     * okunur ada çevrilir. Katalogda karşılığı olmayan (elle yazılmış)
     * değerler olduğu gibi kalır — `nedenAdi` bilinmeyeni aynen döndürür.
     */
    const grupla = (liste, alan, adCoz = null) => {
        const m = new Map();
        liste.forEach((h) => {
            const ham = h[alan] || 'Belirtilmemiş';
            const k = adCoz ? adCoz(ham) : ham;
            m.set(k, (m.get(k) || 0) + 1);
        });
        return [...m.entries()]
            .map(([ad, adet]) => ({ ad, adet, oran: oran(adet, liste.length) }))
            .sort((a, b) => b.adet - a.adet);
    };

    return {
        veri: bu.length > 0,
        gun,
        toplam: bu.length,
        oncekiToplam: onceki.length,
        degisim: onceki.length > 0 ? yuzdeDegisim(bu.length, onceki.length) : null,
        karsilastirilabilir: onceki.length > 0,
        derslere: grupla(bu, 'subject'),
        turlere: grupla(bu, 'errorType', nedenAdi),
        konulara: grupla(bu, 'topic').slice(0, 8),
    };
};

/* ══════════════════════════════════════════════════════════════
   5. RİSK HARİTASI — koç karar desteği
   ══════════════════════════════════════════════════════════════
   Risk bir KESTİRİM değil, mevcut sinyallerin özetidir. Öğrenciye
   "başarısız olacaksın" denmez [C]; koça "buraya bak" denir.
   ══════════════════════════════════════════════════════════════ */

/**
 * Ders bazlı risk. Üç sinyal birleştirilir:
 *   1. program uyumu düşük      (planladığını yapmıyor)
 *   2. isabet oranı düşük       (yapıyor ama tutmuyor)
 *   3. hata yoğunluğu yüksek    (aynı yerde takılıyor)
 *
 * Her sinyal kendi verisi yoksa hesaba KATILMAZ; eksik sinyalden
 * risk üretilmez.
 */
export const dersRiskleri = (studentId, { tarihCoz, gun = 30 } = {}) => {
    const uyum = programUyumu(studentId, { tarihCoz, gun });
    /* `getEntries`'in `since` süzgeci zaman damgası karşılaştırır ve
       saat dilimi kaymasına açıktır (bkz. gunAnahtari notu). Pencereyi
       burada anahtarla kendimiz uygularız. */
    const altAnahtar = gunAnahtari(gunOnce(gun - 1));
    const calisma = getEntries(studentId).filter((e) => {
        const k = kayitAnahtari(e, 'date', 'createdAt');
        return k && k >= altAnahtar;
    });
    const hata = hataOzeti(studentId, gun);

    const dersler = new Map();
    const al = (ad) => {
        if (!dersler.has(ad)) {
            dersler.set(ad, { ders: ad, uyum: null, isabet: null, hata: 0, soru: 0, sinyal: 0 });
        }
        return dersler.get(ad);
    };

    (uyum.dersler || []).forEach((d) => { al(d.ders).uyum = d.oran; });

    const isabetHarita = new Map();
    calisma.forEach((e) => {
        if (e.kind === 'kitap' || !e.subject) return;
        const m = isabetHarita.get(e.subject) || { d: 0, y: 0, t: 0 };
        m.d += sayi(e.correct); m.y += sayi(e.wrong);
        m.t += sayi(e.correct) + sayi(e.wrong) + sayi(e.blank);
        isabetHarita.set(e.subject, m);
    });
    isabetHarita.forEach((m, ad) => {
        const r = al(ad);
        r.soru = m.t;
        r.isabet = m.d + m.y > 0 ? Math.round((m.d / (m.d + m.y)) * 100) : null;
    });

    (hata.derslere || []).forEach((h) => { al(h.ad).hata = h.adet; });

    const liste = [...dersler.values()].map((r) => {
        let sinyal = 0, dayanak = [];
        if (r.uyum !== null && r.uyum < 60) { sinyal += 1; dayanak.push('program uyumu düşük'); }
        if (r.isabet !== null && r.isabet < 55 && r.soru >= 20) { sinyal += 1; dayanak.push('isabet oranı düşük'); }
        if (r.hata >= 10) { sinyal += 1; dayanak.push('hata yoğunluğu yüksek'); }

        const seviye = sinyal >= 2 ? 'yuksek' : sinyal === 1 ? 'orta' : 'dusuk';
        return { ...r, sinyal, seviye, dayanak };
    });

    return {
        veri: liste.length > 0,
        gun,
        dersler: liste.sort((a, b) => b.sinyal - a.sinyal || (a.uyum ?? 100) - (b.uyum ?? 100)),
        yuksek: liste.filter((r) => r.seviye === 'yuksek').length,
    };
};

/* ══════════════════════════════════════════════════════════════
   6. GELİŞİM ZİNCİRİ
   ══════════════════════════════════════════════════════════════
   Talimattaki en önemli analitik bağ:
     PROGRAM → ÇALIŞMA → KONU → DENEME → NET
   Halkalardan biri eksikse zincir kurulmaz; olmayan bağlantı
   varmış gibi gösterilmez.
   ══════════════════════════════════════════════════════════════ */

export const gelisimZinciri = (studentId, ogrenciAdi, { tarihCoz, gun = 28 } = {}) => {
    const uyumSon = programUyumu(studentId, { tarihCoz, gun });
    const calismaSon = calismaOzeti(studentId, gun);
    const net = netTrendi(studentId, ogrenciAdi);

    const halkalar = [
        {
            id: 'program', ad: 'Program uyumu',
            veri: uyumSon.veri,
            deger: uyumSon.oran,
            birim: '%',
        },
        {
            id: 'calisma', ad: 'Çözülen soru',
            veri: calismaSon.veri,
            deger: calismaSon.soru,
            degisim: calismaSon.soruDegisim,
            birim: '',
        },
        {
            id: 'deneme', ad: 'Deneme',
            veri: net.veri,
            deger: net.adet,
            birim: '',
        },
        {
            id: 'net', ad: 'Net',
            veri: net.veri && net.adet >= 2,
            deger: net.sonNet,
            degisim: net.toplamDegisim,
            birim: '',
        },
    ];

    const eksik = halkalar.filter((h) => !h.veri).map((h) => h.ad);

    return {
        veri: eksik.length === 0,
        eksik,
        halkalar,
        gun,
    };
};

/* ══════════════════════════════════════════════════════════════
   7. YORUM ÜRETİCİ
   ══════════════════════════════════════════════════════════════
   [A] gereği her ölçümün düz Türkçe okunuşu. Kurallar açıktır ve
   yalnızca GERÇEK veriden çalışır.

   ⚠️ Buradan dönen metin SİSTEM ANALİZİDİR, koçun sözü değildir.
   Arayüz bunu "SİSTEM ANALİZİ" etiketiyle göstermek zorundadır;
   koçun yazdığı dönüt ayrı bir alanda, ayrı etiketle durur.
   ══════════════════════════════════════════════════════════════ */

/** Eşikler tek yerde — koda gömülü açıklamasız sabit bırakılmaz. */
export const YORUM_ESIKLERI = {
    uyumIyi: 80,          // bu oranın üstü "planına uyuyor"
    uyumOrta: 60,         // altı "plan geride kalıyor"
    isabetIyi: 70,
    isabetDusuk: 55,
    istikrarIyi: 70,      // penceredeki aktif gün oranı
    artisAnlamli: 10,     // yüzde — altındaki değişim "yatay" sayılır
};

/**
 * Bir ölçümü düz Türkçeye çevirir.
 *
 * ── KİME KONUŞULUYOR ───────────────────────────────────────────
 * Aynı cümle iki ekranda birden görünür: öğrencinin gelişim panosu ve
 * koçun analiz panosu. Koça "kaydın var, düzenin oturmuş" demek yanlış
 * muhatap seçmektir — koç üçüncü bir kişinin verisine bakıyor.
 * `kisi` bu yüzden ikinci/üçüncü şahıs arasında geçiş yapar.
 *
 * @param {string} tur    ölçüm türü
 * @param {object} olcum  ölçüm nesnesi
 * @param {'ogrenci'|'koc'} kisi  hitap edilen taraf
 * @returns {{metin:string, ton:'iyi'|'notr'|'dikkat'}|null}
 */
export const yorumla = (tur, olcum, kisi = 'ogrenci') => {
    const E = YORUM_ESIKLERI;
    if (!olcum || olcum.veri === false) return null;

    const koc = kisi === 'koc';
    /** İkinci şahıs ↔ üçüncü şahıs seçici: iy('çözdün', 'çözmüş') */
    const iy = (ikinci, ucuncu) => (koc ? ucuncu : ikinci);

    switch (tur) {
        case 'programUyumu': {
            const o = olcum.oran;
            if (o === null) return null;
            if (o >= E.uyumIyi) {
                return { ton: 'iyi', metin: koc
                    ? `Vadesi gelen ${olcum.planlanan} etüdün ${olcum.tamamlanan} tanesi tamamlanmış. Öğrenci planına uyuyor.`
                    : `Vadesi gelen ${olcum.planlanan} etüdün ${olcum.tamamlanan} tanesini tamamladın. Planına uyuyorsun.` };
            }
            if (o >= E.uyumOrta) {
                return { ton: 'notr', metin: `${olcum.planlanan} etüdün ${olcum.tamamlanan} tanesi tamam. ${olcum.kacirilan} etüt açıkta kaldı.` };
            }
            return { ton: 'dikkat', metin: `Vadesi gelen ${olcum.planlanan} etüdün ${olcum.kacirilan} tanesi yapılmadı. Program geride kalıyor.` };
        }

        case 'calisma': {
            if (!olcum.karsilastirilabilir) {
                return { ton: 'notr', metin: `Son ${olcum.gun} günde ${olcum.soru} soru ${iy('çözdün', 'çözmüş')}. Karşılaştırma için bir önceki dönemde kayıt yok.` };
            }
            const d = olcum.soruDegisim;
            if (d === null) return { ton: 'notr', metin: `Son ${olcum.gun} günde ${olcum.soru} soru ${iy('çözdün', 'çözmüş')}.` };
            if (d >= E.artisAnlamli) {
                return { ton: 'iyi', metin: `${iy('Soru sayın', 'Soru sayısı')} önceki ${olcum.gun} güne göre %${d} arttı.` };
            }
            if (d <= -E.artisAnlamli) {
                return { ton: 'dikkat', metin: `${iy('Soru sayın', 'Soru sayısı')} önceki ${olcum.gun} güne göre %${Math.abs(d)} azaldı.` };
            }
            return { ton: 'notr', metin: `${iy('Soru sayın', 'Soru sayısı')} önceki döneme yakın seyrediyor (${olcum.soru} soru).` };
        }

        case 'istikrar': {
            const o = olcum.oran;
            if (o === null) return null;
            if (o >= E.istikrarIyi) {
                return { ton: 'iyi', metin: `Son ${olcum.gun} günün ${olcum.aktifGun} gününde çalışma ${iy('kaydın var. Düzenin', 'kaydı var. Düzeni')} oturmuş.` };
            }
            return { ton: 'notr', metin: `Son ${olcum.gun} günün ${olcum.aktifGun} gününde kayıt ${iy('girdin', 'girmiş')}. En uzun kesintisiz ${iy('serin', 'seri')} ${olcum.enUzunZincir} gün.` };
        }

        case 'net': {
            if (!olcum.yeterliTrend) {
                return { ton: 'notr', metin: `${olcum.adet} deneme kayıtlı. Eğilim çıkarmak için en az 3 deneme gerekiyor.` };
            }
            if (olcum.yon === 'yukselis') {
                return { ton: 'iyi', metin: `Son ${olcum.adet} denemede ${iy('netlerin', 'netleri')} yükseliş eğiliminde (${olcum.ilkNet} → ${olcum.sonNet}).` };
            }
            if (olcum.yon === 'dusus') {
                return { ton: 'dikkat', metin: `Son ${olcum.adet} denemede ${iy('netlerin', 'netleri')} düşüş eğiliminde (${olcum.ilkNet} → ${olcum.sonNet}).` };
            }
            return { ton: 'notr', metin: `${iy('Netlerin', 'Öğrencinin netleri')} ${olcum.adet} denemedir yatay seyrediyor (son: ${olcum.sonNet}).` };
        }

        case 'hata': {
            if (!olcum.karsilastirilabilir) {
                return { ton: 'notr', metin: `Son ${olcum.gun} günde ${olcum.toplam} hata ${iy('kaydettin', 'kaydedilmiş')}.` };
            }
            const d = olcum.degisim;
            if (d !== null && d <= -E.artisAnlamli) {
                return { ton: 'iyi', metin: `${iy('Hata sayın', 'Hata sayısı')} önceki ${olcum.gun} güne göre %${Math.abs(d)} azaldı.` };
            }
            if (d !== null && d >= E.artisAnlamli) {
                return { ton: 'dikkat', metin: `${iy('Hata sayın', 'Hata sayısı')} önceki ${olcum.gun} güne göre %${d} arttı. En çok: ${olcum.derslere[0]?.ad || '—'}.` };
            }
            return { ton: 'notr', metin: `Son ${olcum.gun} günde ${olcum.toplam} hata ${iy('kaydın', 'kaydı')} var.` };
        }

        default:
            return null;
    }
};

/**
 * Öğrenciye gösterilecek motivasyon cümlesi.
 *
 * ⚠️ SAHTE BAŞARI ÜRETMEZ. Yalnızca gerçekten olmuş bir olayı
 * anlatır; hiçbir koşul sağlanmazsa `null` döner ve arayüz
 * motivasyon kartını HİÇ göstermez.
 */
export const motivasyon = ({ uyum, calisma, net, istikrar: ist }) => {
    const E = YORUM_ESIKLERI;
    const adaylar = [];

    if (uyum?.veri && uyum.oran >= E.uyumIyi) {
        adaylar.push({
            oncelik: 3,
            metin: `Bu dönem planladığın etütlerin %${uyum.oran}'ini tamamladın.`,
        });
    }
    if (net?.veri && net.yeterliTrend && net.yon === 'yukselis') {
        adaylar.push({
            oncelik: 4,
            metin: `Son ${net.adet} denemede netlerin yükseliyor. Çalışman sonuç vermeye başladı.`,
        });
    }
    if (calisma?.veri && calisma.soruDegisim !== null && calisma.soruDegisim >= E.artisAnlamli) {
        adaylar.push({
            oncelik: 2,
            metin: `Soru sayını önceki döneme göre %${calisma.soruDegisim} artırdın.`,
        });
    }
    if (ist?.veri && ist.guncelZincir >= 3) {
        adaylar.push({
            oncelik: 1,
            metin: `${ist.guncelZincir} gündür aralıksız çalışıyorsun.`,
        });
    }

    if (!adaylar.length) return null;
    return adaylar.sort((a, b) => b.oncelik - a.oncelik)[0].metin;
};

export default {
    gunOnce, yuzdeDegisim, oran, egim, yon,
    calismaOzeti, gunlukSeri, istikrar,
    cizelgeOku, ilerlemeOku, programUyumu, uyumSerisi,
    netTrendi, hataOzeti, dersRiskleri, gelisimZinciri,
    yorumla, motivasyon, YORUM_ESIKLERI,
};
