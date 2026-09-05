/**
 * ✅ KONU TAKİP MOTORU
 *
 * Sınav konu listesini öğrencinin GERÇEK çalışmasıyla birleştirir.
 * Konunun durumu üç kaynaktan hesaplanır; hiçbiri elle ikinci kez
 * girilmez:
 *
 *   1. DERS PROGRAMI  (`student_programs_*` + `program_progress`)
 *      Koç konuyu programa yazdıysa "planlandı"; öğrenci o etüdü
 *      "yaptım" işaretlediyse "çalışıldı" sayılır.
 *   2. SORU TAKİBİ    (`study_log`)
 *      Konuya girilen doğru/yanlış/boş soru sayısı ve başarı oranı.
 *   3. ÖĞRENCİ İŞARETİ (`topic_progress`)
 *      Öğrenci bir konuyu elle bitmiş sayabilir; koç bunu görür.
 *
 * Yeşil tik (tamamlandı) tek bir tıkla değil, ÇALIŞMAYLA gelir:
 * hedef soru sayısı çözülmüş ve başarı oranı eşiğin üstünde olmalı.
 * Böylece liste "işaretleyip geçilen" bir yapılacak listesi değil,
 * gerçek ilerlemenin aynası olur.
 *
 * Öğrenciyi çalışmaya iten yan: her konu bir ilerleme çubuğu taşır,
 * "bitmesine 6 soru kaldı" gibi somut bir hedef gösterilir ve
 * yarım kalan konular listenin başına çekilir.
 */

import { nesneOku, damgala } from './veriDeposu';
import {
    sinavBul, ogrencininSinavi, ogrencininAlani, ogrencininBolumleri,
    dersAdi as dersAdiKatalog, hedefSoruHesapla, ZORLUK_ADI,
    konuKimligi, bolumBul,
} from '../data/examTopics';
import { eskiKimliktenTopicId } from './konuKatalogu';

const KEY = 'topic_progress';

/** Yeşil tik ölçütleri. Koç Ayarlar'dan değiştirebilir. */
export const VARSAYILAN_OLCUT = {
    // Hedef soru sayısı artık konuya özeldir (ağırlık × zorluk).
    // `carpan` bütün hedefleri birden sıkılaştırır/gevşetir:
    // 0.7 → hedefler %30 düşer, 1.5 → %50 artar.
    carpan: 1,
    basariEsigi: 60,      // yüzde — altındaysa tekrar önerilir
    tekrarEsigi: 50,      // yüzde — altındaysa "tekrar gerekli" uyarısı
};

export const DURUMLAR = {
    tamamlandi: { id: 'tamamlandi', ad: 'Tamamlandı', renk: 'var(--ok)', ikon: '✅', sira: 4 },
    tekrar: { id: 'tekrar', ad: 'Tekrar Gerekli', renk: 'var(--danger)', ikon: '🔁', sira: 1 },
    calisiliyor: { id: 'calisiliyor', ad: 'Çalışılıyor', renk: 'var(--warn)', ikon: '📖', sira: 2 },
    planlandi: { id: 'planlandi', ad: 'Programda', renk: 'var(--info)', ikon: '📅', sira: 3 },
    baslanmadi: { id: 'baslanmadi', ad: 'Başlanmadı', renk: 'var(--ink-3)', ikon: '⚪', sira: 5 },
};

// ══════════════════════════════════════════════════════════════
//  DEPO
// ══════════════════════════════════════════════════════════════

const oku = () => {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw || !raw.trim()) return {};
        const v = JSON.parse(raw);
        return v && typeof v === 'object' ? v : {};
    } catch {
        return {};
    }
};

// Arka arkaya işaretlemede tek bulut yazımı yeter; her tık için ayrı
// yazım gönderilirse geri dönen eski anlık görüntü yenileri eziyor.
let syncTimer = null;
const yaz = (depo) => {
    localStorage.setItem(KEY, JSON.stringify(depo));
    /* Bulut yazımı 1,5 sn gecikmeli; damga hemen atılmazsa o aralıkta
       yapılan yenileme buluttaki eski kopyayı geri getirir. */
    damgala(KEY);
    try { window.dispatchEvent(new StorageEvent('storage', { key: KEY })); } catch { /* ignore */ }
    try { window.dispatchEvent(new Event('topic-progress-updated')); } catch { /* ignore */ }
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
        syncTimer = null;
        try { window.firebaseSync?.syncKey?.(KEY); } catch { /* senkron yoksa sorun değil */ }
    }, 1500);
};

const guvenliJson = (key, def) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw || !raw.trim()) return def;
        return JSON.parse(raw) ?? def;
    } catch {
        return def;
    }
};

// ══════════════════════════════════════════════════════════════
//  KONU EŞLEŞTİRME
// ══════════════════════════════════════════════════════════════

/**
 * Konu adlarını karşılaştırılabilir hâle getirir.
 *
 * Program "Problemler (Hareket)", soru kaydı "problemler hareket"
 * yazabiliyor; birebir metin eşleşmesi bu ikisini ayrı konu sayardı.
 * Noktalama atılır, Türkçe küçük harfe çevrilir, boşluk sadeleşir.
 */
export const anahtar = (metin) =>
    String(metin || '')
        .toLocaleLowerCase('tr-TR')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();

/**
 * Bir konunun elle işaret kaydını bulur.
 *
 * ÖNCE sınav bağlamlı kimlik (§24), BULUNAMAZSA eski isim anahtarı.
 * Sıralama geriye dönük uyum için şart: kimlik sistemi gelmeden önce
 * yazılmış bütün kayıtlar isim anahtarındadır ve silinmez.
 *
 * @param {object} depo   öğrencinin işaret kayıtları
 * @param {string} kimlik konu kimliği ('yks:tyt:matematik:turev') | null
 * @param {string} isim   normalize edilmiş konu adı
 */
export const isaretBul = (depo, kimlik, isim) =>
    (kimlik ? depo?.[kimlik] : undefined) ?? depo?.[isim];

/**
 * Bir sınavın istenen bölümündeki dersler.
 * @param {string} sinavId  'YKS' | 'LGS' | 'KPSS' | 'AGS'
 * @param {string} [bolumId] Verilmezse ilk bölüm
 */
export const konuListesi = (sinavId = 'YKS', bolumId = null) => {
    const sinav = sinavBul(sinavId);
    if (!sinav) return {};
    // Sınıf müfredatı bölümleri (SINIF_5…) sınavın listesinde olmadığı
    // için doğrudan arama yetmez; `bolumBul` ikisine de bakar.
    const bolum = bolumId ? bolumBul(sinavId, bolumId) : sinav.bolumler[0];
    return bolum?.dersler || {};
};

/** Sınavın bölüm listesi (TYT/AYT, Genel Yetenek/Genel Kültür…). */
export const bolumler = (sinavId = 'YKS') => sinavBul(sinavId)?.bolumler || [];

export const dersAdi = dersAdiKatalog;

export { ogrencininSinavi, ogrencininAlani, ogrencininBolumleri };

// ══════════════════════════════════════════════════════════════
//  KAYNAKLARDAN TOPLAMA
// ══════════════════════════════════════════════════════════════

/**
 * Soru kaydından konu bazlı toplamlar.
 * @returns {Map<string, {dogru,yanlis,bos,toplam,dakika,sonTarih}>}
 */
const soruToplamlari = (studentId) => {
    const kayitlar = guvenliJson('study_log', []);
    const harita = new Map();
    if (!Array.isArray(kayitlar)) return harita;

    kayitlar.forEach((k) => {
        if (String(k.studentId) !== String(studentId)) return;
        if (k.kind && k.kind !== 'soru') return;      // kitap kaydı konuya sayılmaz
        const a = anahtar(k.topic);
        if (!a) return;

        const mevcut = harita.get(a) || {
            dogru: 0, yanlis: 0, bos: 0, toplam: 0, dakika: 0, sonTarih: null,
        };
        const d = Number(k.correct) || 0;
        const y = Number(k.wrong) || 0;
        const b = Number(k.blank) || 0;

        mevcut.dogru += d;
        mevcut.yanlis += y;
        mevcut.bos += b;
        mevcut.toplam += d + y + b;
        mevcut.dakika += Number(k.minutes) || 0;
        if (!mevcut.sonTarih || String(k.date) > mevcut.sonTarih) mevcut.sonTarih = k.date;

        harita.set(a, mevcut);
    });
    return harita;
};

/**
 * Ders programından konu durumu.
 * @returns {Map<string, {programda:number, yapildi:number}>}
 */
const programToplamlari = (studentId) => {
    const harita = new Map();

    // Program birden çok anahtarda tutulabiliyor; ikisi de taranır
    const programlar = [
        guvenliJson(`student_programs_${studentId}`, null),
        guvenliJson('student_programs', null),
    ];

    const ilerleme = (guvenliJson('program_progress', {}) || {})[String(studentId)] || {};

    /* ⚠️ ÇİFT SAYIM (05.09'da ölçüldü): koç kaydı AYNI çizelgeyi hem
       `program_schedule_<id>` hem `student_programs_<id>` anahtarına
       yazar. İki kopya da tarandığı için her etüt 2 kez sayılıyor,
       "programda 4 / yapıldı 2" gibi şişkin rakamlar çıkıyordu. Hücre
       anahtarı üzerinden tekilleştirilir. */
    const sayilanHucreler = new Set();

    programlar.forEach((p) => {
        if (!p) return;
        // Program ya doğrudan {hücre: {subject, topic}} ya da { schedule: {...} }
        const schedule = p.schedule && typeof p.schedule === 'object' ? p.schedule
            : (typeof p === 'object' ? p : null);
        if (!schedule) return;

        Object.entries(schedule).forEach(([hucre, deger]) => {
            if (!deger || typeof deger !== 'object') return;
            if (sayilanHucreler.has(hucre)) return;
            sayilanHucreler.add(hucre);
            const a = anahtar(deger.topic);
            if (!a) return;

            const mevcut = harita.get(a) || { programda: 0, yapildi: 0 };
            mevcut.programda += 1;
            if (ilerleme[hucre]?.status === 'done') mevcut.yapildi += 1;
            harita.set(a, mevcut);
        });
    });

    return harita;
};

// ══════════════════════════════════════════════════════════════
//  DURUM HESABI
// ══════════════════════════════════════════════════════════════

/**
 * Tek bir konunun durumu.
 *
 * Sıralama önemli: "tekrar gerekli", "tamamlandı"dan ÖNCE bakılır.
 * Öğrenci 40 soru çözüp %35 başarı aldıysa konu bitmiş değildir;
 * yeşil tik vermek yanlış bir güven duygusu yaratırdı.
 */
export const konuDurumu = (tanim, { soru, program, elle, olcut = VARSAYILAN_OLCUT }) => {
    // Konu ya düz metin ya da { ad, a, z } kaydı olabilir
    const konu = typeof tanim === 'string' ? tanim : tanim.ad;
    const agirlik = typeof tanim === 'string' ? 1 : (tanim.a ?? 1);
    const zorluk = typeof tanim === 'string' ? 2 : (tanim.z ?? 2);

    /**
     * Hedef soru sayısı konuya ÖZELDİR: sınavdaki ağırlığı ve zorluğu
     * belirler. Tek bir sabit hedef (eskiden 20) hem TYT Problemler
     * hem de Din Kültürü için aynı eşiği koyuyordu; biri yetersiz,
     * diğeri gereksiz ağırdı. Koç isterse Ayarlar'dan bir çarpanla
     * hepsini birden sıkılaştırıp gevşetebilir.
     */
    const hedef = Math.max(
        5,
        Math.round(hedefSoruHesapla(agirlik, zorluk) * (olcut.carpan ?? 1))
    );

    const s = soru || { dogru: 0, yanlis: 0, bos: 0, toplam: 0, dakika: 0, sonTarih: null };
    const p = program || { programda: 0, yapildi: 0 };

    const cevaplanan = s.dogru + s.yanlis;
    const basari = cevaplanan > 0 ? Math.round((s.dogru / cevaplanan) * 100) : null;

    // Hedefe ne kadar kalındığı — arayüzde "6 soru kaldı" olarak gösterilir
    const kalan = Math.max(0, hedef - s.toplam);
    const oran = Math.min(100, Math.round((s.toplam / hedef) * 100));

    let durum;
    if (s.toplam >= hedef && basari != null && basari < olcut.tekrarEsigi) {
        durum = 'tekrar';
    } else if (elle?.tamam) {
        // Öğrenci elle bitirdi dediyse saygı gösterilir ama kaynak belli edilir
        durum = 'tamamlandi';
    } else if (p.programda > 0 && p.yapildi >= p.programda) {
        /* 05.09 talimatı: konunun PROGRAMDAKİ bütün etütleri (konu →
           soru → tekrar zinciri) "yapıldı" işaretlendiyse konu BİTER —
           hem öğrenci hem koç panelindeki konu listesinde "biten"
           kategorisine düşer. Soru hedefi dolmasa bile programın
           tamamlanması koçun planladığı çalışmanın bittiği anlamına
           gelir; başarı düşükse üstteki 'tekrar' dalı zaten önce yakalar. */
        durum = 'tamamlandi';
    } else if (s.toplam >= hedef && (basari == null || basari >= olcut.basariEsigi)) {
        durum = 'tamamlandi';
    } else if (s.toplam > 0 || p.yapildi > 0) {
        durum = 'calisiliyor';
    } else if (p.programda > 0) {
        durum = 'planlandi';
    } else {
        durum = 'baslanmadi';
    }

    return {
        konu,
        agirlik,
        zorluk,
        zorlukAdi: ZORLUK_ADI[zorluk] || 'Orta',
        hedef,
        durum,
        tamam: durum === 'tamamlandi',
        soru: s.toplam,
        dogru: s.dogru,
        yanlis: s.yanlis,
        bos: s.bos,
        basari,
        dakika: s.dakika,
        sonTarih: s.sonTarih,
        programda: p.programda,
        programYapildi: p.yapildi,
        elleIsaretli: Boolean(elle?.tamam),
        oran,
        kalan,
    };
};

// ══════════════════════════════════════════════════════════════
//  Konu risk ve öncelik skorlayıcıları
// ══════════════════════════════════════════════════════════════

const ZORLUK_FAKTORU = { 1: 0.8, 2: 1, 3: 1.3 };
const sayi = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const sinirla = (v, alt, ust) => Math.max(alt, Math.min(ust, v));

/* Risk üç bileşenin ağırlıklı toplamıdır; toplam ağırlıkla normalize
   edilir ki tek bileşen dolu olduğunda bile 0-100 bandı kullanılabilsin. */
const RISK_AGIRLIK = { deneme: 0.35, isabet: 0.3, hedef: 0.2 };
const RISK_AGIRLIK_TOPLAMI = RISK_AGIRLIK.deneme + RISK_AGIRLIK.isabet + RISK_AGIRLIK.hedef;

export const riskSeviyesi = (skor) => (
    skor >= 80 ? 'kritik' : skor >= 60 ? 'yuksek' : skor >= 30 ? 'orta' : 'dusuk'
);

/**
 * Bir konunun risk skoru (0-100) ve gerekçeleri.
 *
 * Girdi, konuDurumu çıktısının üzerine deneme analizi sayaçları eklenmiş
 * hâlidir: { ...konuDurumu, denemeHatasi, denemeKayitSayisi }.
 *
 * Bileşenler:
 *  - deneme hataları (en ağır sinyal — gerçek sınav davranışı)
 *  - konu isabeti (yeterli örneklem varsa: en az 10 cevaplanmış soru)
 *  - hedefe uzaklık (hiç başlanmamış konu cezalandırılmaz; p=0)
 * Zorluk çarpan olarak en sona uygulanır: zor konuda aynı belirti daha risklidir.
 */
export const konuRisk = (k = {}) => {
    const hata = sayi(k.denemeHatasi);
    const kayit = sayi(k.denemeKayitSayisi);
    const dogru = sayi(k.dogru);
    const yanlis = sayi(k.yanlis);
    const cozulen = sayi(k.soru);
    const hedef = sayi(k.hedef);
    const basari = k.basari == null ? null : sayi(k.basari);
    const zorluk = sayi(k.zorluk) || 2;
    const nedenler = [];

    let deneme = Math.min(1, hata / 8);
    // Aynı hata birden çok denemede tekrarlanıyorsa tesadüf değildir
    if (hata > 0 && kayit >= 2) deneme = Math.min(1, deneme * 1.25);
    if (hata > 0) {
        nedenler.push(kayit >= 2
            ? `Denemelerde ${hata} konu hatası (${kayit} ayrı deneme)`
            : `Denemelerde ${hata} konu hatası`);
    }

    const orneklemYeterli = dogru + yanlis >= 10 && basari != null;
    const isabet = orneklemYeterli ? sinirla((100 - basari) / 100, 0, 1) : 0;
    if (orneklemYeterli && basari < 60) nedenler.push(`Konu isabeti %${Math.round(basari)}`);

    const hedefVar = hedef > 0 && Number.isFinite(hedef);
    const tamamlanma = hedefVar ? Math.min(1, cozulen / hedef) : 1;
    let uzaklik = hedefVar ? sinirla(1 - tamamlanma, 0, 1) : 0;
    if (cozulen === 0) uzaklik = 0; // başlanmamış konu risk değil, plan işidir
    if (hedefVar && uzaklik >= 0.5) {
        nedenler.push(`Hedefin yalnız %${Math.round(tamamlanma * 100)}'i tamamlandı`);
    }

    const ham = RISK_AGIRLIK.deneme * deneme + RISK_AGIRLIK.isabet * isabet + RISK_AGIRLIK.hedef * uzaklik;
    const faktor = ZORLUK_FAKTORU[zorluk] ?? 1;
    const skor = sinirla(Math.round((ham / RISK_AGIRLIK_TOPLAMI) * faktor * 100), 0, 100);

    if (zorluk >= 3 && skor > 0) nedenler.push('Konu zor seviyede');
    if (k.durum === 'tekrar') nedenler.push('Yeterince çözülmüş ama isabet düşük (tekrar gerekli)');

    return { skor, seviye: riskSeviyesi(skor), nedenler };
};

/** Son çalışmadan bu yana geçen sürenin öncelik katkısı. */
const tazelikPuani = (sonTarih, bugun) => {
    if (bugun == null || !Number.isFinite(bugun)) return { deger: 0.5, neden: null };
    if (!sonTarih) return { deger: 0.7, neden: 'Bu konuda hiç soru çözülmemiş' };
    const t = Date.parse(sonTarih);
    if (!Number.isFinite(t)) return { deger: 0.5, neden: null };
    const gun = Math.floor((bugun - t) / 86400000);
    if (!Number.isFinite(gun) || gun < 0) return { deger: 0.5, neden: null };
    if (gun <= 7) return { deger: 0.1, neden: null };
    if (gun <= 21) return { deger: 0.5, neden: `${gun} gündür çalışılmadı` };
    return { deger: 1, neden: `${gun} gündür çalışılmadı` };
};

/**
 * "Şimdi hangi konuya çalışmalı?" skoru (0-100).
 * Risk (%50) + programda sarkan iş (%30) + tazelik (%20).
 * 'tekrar' durumundaki konu tabandan 55'e çekilir: tekrar bekleyen konu
 * hiçbir zaman listenin dibine düşmez.
 */
export const konuOncelik = (k = {}, { konuRisk: hazirRisk = null, bugun = null } = {}) => {
    const risk = hazirRisk || konuRisk(k);
    const riskPay = sinirla(sayi(risk.skor) / 100, 0, 1);
    const programda = sayi(k.programda);
    const yapildi = sayi(k.programYapildi);
    const sarkan = programda > 0 && yapildi < programda ? 1 : 0;
    const tazelik = tazelikPuani(k.sonTarih, bugun);

    let skor = sinirla(Math.round(100 * (0.5 * riskPay + 0.3 * sarkan + 0.2 * tazelik.deger)), 0, 100);
    const tekrarMi = k.durum === 'tekrar';
    if (tekrarMi && skor < 55) skor = 55;

    const nedenler = [];
    if (tekrarMi) nedenler.push({ agirlik: 1, metin: 'Tekrar gerekli — öncelikli gözden geçir' });
    if (sarkan) nedenler.push({ agirlik: 0.3, metin: 'Programda tamamlanmamış çalışma var' });
    if (tazelik.neden) nedenler.push({ agirlik: 0.2 * tazelik.deger, metin: tazelik.neden });
    if (risk.seviye === 'yuksek' || risk.seviye === 'kritik') {
        nedenler.push({ agirlik: 0.5 * riskPay, metin: `Risk seviyesi ${risk.seviye === 'kritik' ? 'kritik' : 'yüksek'}` });
    }

    return { skor, nedenler: nedenler.sort((a, b) => b.agirlik - a.agirlik).map((n) => n.metin) };
};

/**
 * Bir öğrencinin belirli sınav-bölüm için konu listesi ve durumları.
 *
 * @param {string|number} studentId
 * @param {string} sinavId  'YKS' | 'LGS' | 'KPSS' | 'AGS'
 * @param {object} [olcut]
 * @param {string} [bolumId] 'TYT' | 'GY' … — verilmezse sınavın ilk bölümü
 * @returns {{dersler:Array, ozet:object}}
 */
export const konuHaritasi = (studentId, sinavId = 'YKS', olcut = VARSAYILAN_OLCUT, bolumId = null) => {
    const liste = konuListesi(sinavId, bolumId);
    const soru = soruToplamlari(studentId);
    const program = programToplamlari(studentId);
    const elleDepo = (oku()[String(studentId)] || {});

    const aktifBolum = bolumId || bolumler(sinavId)[0]?.id || null;

    const dersler = Object.entries(liste).map(([ders, konular]) => {
        const satirlar = konular.map((k) => {
            const ad = typeof k === 'string' ? k : k.ad;
            const a = anahtar(ad);
            const kimlik = konuKimligi(sinavId, aktifBolum, ders, ad);
            return {
                ...konuDurumu(k, {
                    soru: soru.get(a),
                    program: program.get(a),
                    elle: isaretBul(elleDepo, kimlik, a),
                    olcut,
                }),
                topicId: kimlik,
                ders,
                bolum: aktifBolum,
            };
        });

        const tamam = satirlar.filter((s) => s.tamam).length;
        const tekrar = satirlar.filter((s) => s.durum === 'tekrar').length;
        const calisilan = satirlar.filter((s) => s.durum === 'calisiliyor').length;

        return {
            ders,
            ad: dersAdi(ders),
            konular: satirlar,
            toplam: satirlar.length,
            tamam,
            tekrar,
            calisilan,
            oran: satirlar.length ? Math.round((tamam / satirlar.length) * 100) : 0,
            toplamSoru: satirlar.reduce((t, s) => t + s.soru, 0),
            toplamHedef: satirlar.reduce((t, s) => t + s.hedef, 0),
        };
    });

    const toplamKonu = dersler.reduce((t, d) => t + d.toplam, 0);
    const toplamTamam = dersler.reduce((t, d) => t + d.tamam, 0);

    return {
        dersler,
        ozet: {
            sinavId,
            sinavTuru: sinavId,          // eski çağrılar için
            bolumId: aktifBolum,
            toplamKonu,
            tamam: toplamTamam,
            tekrar: dersler.reduce((t, d) => t + d.tekrar, 0),
            calisilan: dersler.reduce((t, d) => t + d.calisilan, 0),
            kalan: toplamKonu - toplamTamam,
            oran: toplamKonu ? Math.round((toplamTamam / toplamKonu) * 100) : 0,
            toplamSoru: dersler.reduce((t, d) => t + d.toplamSoru, 0),
            toplamHedef: dersler.reduce((t, d) => t + d.toplamHedef, 0),
        },
    };
};

/**
 * Sıradaki konu önerisi — öğrenci "ne çalışayım?" diye düşünmesin.
 * Önce yarım kalanlar, sonra tekrar gerekenler, sonra programdakiler.
 */
export const sonrakiKonular = (
    studentId, sinavId = 'YKS', adet = 3, olcut = VARSAYILAN_OLCUT, hedefBolumler = null
) => {
    /**
     * Öneri, öğrencinin ÇÖZDÜĞÜ bölümlerden gelir. `hedefBolumler`
     * verilmezse sınavın tamamı taranır; sözel öğrencisine sayısal
     * konusu önerilmesin diye çağıran taraf kendi bölümlerini geçer.
     */
    const kaynak = hedefBolumler?.length ? hedefBolumler : bolumler(sinavId);
    const hepsi = kaynak.flatMap((b) => {
        const { dersler } = konuHaritasi(studentId, sinavId, olcut, b.id);
        return dersler.flatMap((d) => d.konular.map((k) => ({ ...k, ders: d.ad, bolum: b.ad })));
    });

    /**
     * SIRALAMA — üç kademe
     *
     * 1) PROGRAM ÖNCELİĞİ (koçun kararı her şeyin önünde)
     *    a. Programda ve etüdü henüz işaretlenmemiş  → "program borcu"
     *    b. Programda, etütleri işaretlenmiş
     *    c. Programda hiç yok
     *
     *    "Programda mı" sorusu duruma bakmaz: koç konuyu programa
     *    yazdıysa, öğrenci o konuda soru çözmeye başlamış olsa bile
     *    (durum `calisiliyor`) program borcu olarak önde kalır.
     *    Program ayrı bir bölüm/hafta ayrımı tutmadığı için "bu hafta"
     *    ölçülemiyor; işaretlenmemiş etüt en yakın karşılığı.
     *
     * 2) DURUM (tekrar → çalışılıyor → programda → başlanmadı)
     *    Program içinde de dışında da aynı mantık işler; böylece
     *    "tekrar gerekli" uyarısı kaybolmaz, yalnızca program
     *    konularının arkasına düşer.
     *
     * 3) HEDEFE YAKINLIK — aynı kademedeyse bitmeye en yakın olan önce.
     */
    const programKademesi = (k) => {
        if (k.programda > 0 && k.programYapildi < k.programda) return 0;  // borç
        if (k.programda > 0) return 1;                                    // programda, işaretli
        return 2;                                                          // programda değil
    };

    return hepsi
        .filter((k) => !k.tamam)
        .sort((a, b) => {
            const pa = programKademesi(a);
            const pb = programKademesi(b);
            if (pa !== pb) return pa - pb;

            const sa = DURUMLAR[a.durum]?.sira ?? 9;
            const sb = DURUMLAR[b.durum]?.sira ?? 9;
            if (sa !== sb) return sa - sb;

            return b.oran - a.oran;
        })
        .slice(0, adet);
};

// ══════════════════════════════════════════════════════════════
//  ELLE İŞARETLEME
// ══════════════════════════════════════════════════════════════

/**
 * Öğrenci konuyu elle bitmiş/bitmemiş işaretler.
 *
 * `baglam` verilirse (§24) kayıt sınav bağlamlı kimlikle yazılır; böylece
 * LGS "Üslü İfadeler" ile TYT "Üslü Sayılar" ayrı satırlarda tutulur.
 * Bağlam verilmeyen eski çağrılar isim anahtarını kullanmayı sürdürür.
 *
 * İşareti KALDIRIRKEN her iki anahtar da temizlenir — kimlikten önce
 * yazılmış eski kayıt kalırsa konu "bitmedi" denmesine rağmen yeşil
 * görünmeye devam ederdi.
 *
 * @param {object} [baglam] {sinavId, bolumId, ders}
 */
export const elleIsaretle = (studentId, konu, tamam, kaynak = 'ogrenci', baglam = null) => {
    const depo = oku();
    const sid = String(studentId);
    const a = anahtar(konu);
    if (!a) return false;

    // Bağlam ya hazır kimliği ya da onu kuracak parçaları taşır
    const kimlik = baglam?.topicId
        ?? (baglam ? konuKimligi(baglam.sinavId, baglam.bolumId, baglam.ders, konu) : null);

    depo[sid] = { ...(depo[sid] || {}) };
    if (tamam) {
        depo[sid][kimlik || a] = {
            tamam: true, konu, kaynak, topicId: kimlik,
            tarih: new Date().toISOString(),
        };
    } else {
        if (kimlik) delete depo[sid][kimlik];
        delete depo[sid][a];
    }
    yaz(depo);
    return true;
};

export const elleIsaretliMi = (studentId, konu, baglam = null) => {
    const depo = oku()[String(studentId)] || {};
    // Bağlam ya hazır kimliği ya da onu kuracak parçaları taşır
    const kimlik = baglam?.topicId
        ?? (baglam ? konuKimligi(baglam.sinavId, baglam.bolumId, baglam.ders, konu) : null);
    return Boolean(isaretBul(depo, kimlik, anahtar(konu))?.tamam);
};

/**
 * ══════════════════════════════════════════════════════════════
 *  TOPLU ÖZET — öğrenci listesi için
 *
 *  Koç panelindeki listede 50 öğrencinin tamamlanan konu sayısı
 *  gösteriliyor. Her öğrenci için `konuHaritasi` çağırmak `study_log`
 *  ve `program_progress`'i öğrenci × bölüm kadar (50 × 5 = 250 kez)
 *  yeniden okuyup ayrıştırırdı; liste gözle görülür şekilde takılır.
 *
 *  Bu fonksiyon depoları BİR KEZ okur, soru toplamlarını tek geçişte
 *  öğrenciye göre gruplar ve her öğrenci için yalnızca kendi
 *  bölümlerindeki konuları dolaşır.
 * ══════════════════════════════════════════════════════════════
 */
export const topluOzet = (ogrenciler = [], olcut = VARSAYILAN_OLCUT) => {
    const kayitlar = guvenliJson('study_log', []);
    const ilerlemeDepo = guvenliJson('program_progress', {}) || {};
    const elleDepo = oku();
    const bugun = Date.now();

    /* Deneme analizlerindeki konu hataları: öğrenci → topicId → sayaçlar.
       Kayıtlar deneme analiz akışından gelir (konuHatalari: [{topicId, adet}]);
       depo boşsa harita boş kalır, özet eskisi gibi çalışır. */
    const denemeKayitlari = guvenliJson('deneme_analizleri', []);
    const denemeHarita = new Map();
    (Array.isArray(denemeKayitlari) ? denemeKayitlari : []).forEach((dk) => {
        const sid = String(dk.studentId);
        const tarih = dk.tarih || (dk.olusturma ? String(dk.olusturma).slice(0, 10) : null);
        (Array.isArray(dk.konuHatalari) ? dk.konuHatalari : []).forEach((h) => {
            if (!h || !h.topicId) return;
            if (!denemeHarita.has(sid)) denemeHarita.set(sid, new Map());
            const ic = denemeHarita.get(sid);
            const adet = Number(h.adet) || 0;
            const m = ic.get(h.topicId) || { adet: 0, kayit: 0, sonHataTarihi: null };
            m.adet += adet;
            m.kayit += 1;
            if (adet > 0 && tarih && (!m.sonHataTarihi || tarih > m.sonHataTarihi)) m.sonHataTarihi = tarih;
            ic.set(h.topicId, m);
        });
    });

    // Soru kayıtlarını tek geçişte öğrenci → konu haritasına indir
    const soruHarita = new Map();
    (Array.isArray(kayitlar) ? kayitlar : []).forEach((k) => {
        if (k.kind && k.kind !== 'soru') return;
        const a = anahtar(k.topic);
        if (!a) return;
        const sid = String(k.studentId);
        if (!soruHarita.has(sid)) soruHarita.set(sid, new Map());
        const ic = soruHarita.get(sid);
        const m = ic.get(a) || { dogru: 0, yanlis: 0, bos: 0, toplam: 0, dakika: 0, sonTarih: null };
        const d = Number(k.correct) || 0;
        const y = Number(k.wrong) || 0;
        const b = Number(k.blank) || 0;
        m.dogru += d; m.yanlis += y; m.bos += b; m.toplam += d + y + b;
        m.dakika += Number(k.minutes) || 0;
        if (!m.sonTarih || String(k.date) > m.sonTarih) m.sonTarih = k.date;
        ic.set(a, m);
    });

    const cikti = new Map();

    ogrenciler.forEach((ogr) => {
        const sid = String(ogr.id);
        const sinav = ogrencininSinavi(ogr);
        const bolumListesi = ogrencininBolumleri(ogr, sinav);

        // Program kayıtları öğrenci başına bir kez
        const prgHarita = new Map();
        const ilerleme = ilerlemeDepo[sid] || {};
        /* Çift sayım düzeltmesi (05.09): iki anahtar AYNI çizelgenin
           kopyası — hücre anahtarıyla tekilleştirilir (bkz.
           programToplamlari'ndaki not). */
        const sayilanHucreler = new Set();
        [guvenliJson(`student_programs_${sid}`, null), guvenliJson(`program_schedule_${sid}`, null)]
            .forEach((p) => {
                if (!p) return;
                const schedule = p.schedule && typeof p.schedule === 'object' ? p.schedule : p;
                if (!schedule || typeof schedule !== 'object') return;
                Object.entries(schedule).forEach(([hucre, deger]) => {
                    if (!deger || typeof deger !== 'object') return;
                    if (sayilanHucreler.has(hucre)) return;
                    sayilanHucreler.add(hucre);
                    const a = anahtar(deger.topic);
                    if (!a) return;
                    const m = prgHarita.get(a) || { programda: 0, yapildi: 0 };
                    m.programda += 1;
                    if (ilerleme[hucre]?.status === 'done') m.yapildi += 1;
                    prgHarita.set(a, m);
                });
            });

        const soru = soruHarita.get(sid) || new Map();
        const elle = elleDepo[sid] || {};
        const denemeOgr = denemeHarita.get(sid);

        let toplamKonu = 0, tamam = 0, tekrar = 0, calisilan = 0;
        const oncelikler = [];
        const hataliTamamlar = [];

        bolumListesi.forEach((b) => {
            Object.entries(b.dersler).forEach(([ders, konular]) => {
                konular.forEach((t) => {
                    const ad = typeof t === 'string' ? t : t.ad;
                    const a = anahtar(ad);
                    const kimlik = konuKimligi(sinav, b.id, ders, ad);
                    const d = konuDurumu(t, {
                        soru: soru.get(a),
                        program: prgHarita.get(a),
                        elle: isaretBul(elle, kimlik, a),
                        olcut,
                    });
                    toplamKonu += 1;
                    if (d.tamam) tamam += 1;
                    else if (d.durum === 'tekrar') tekrar += 1;
                    else if (d.durum === 'calisiliyor') calisilan += 1;

                    /* Deneme hatalarıyla zenginleştirilmiş kayıt üzerinden
                       risk + öncelik: "şimdi neye çalışmalı?" ve "bitti ama
                       denemede dökülüyor" listelerinin hammaddesi.
                       04.09: deneme hataları KATALOG topicId'siyle saklanır;
                       eski kimlik köprüden geçirilmeden bulunamaz. */
                    const katalogId = eskiKimliktenTopicId(kimlik);
                    const dh = katalogId ? denemeOgr?.get(katalogId) : undefined;
                    const genis = {
                        ...d,
                        denemeHatasi: dh?.adet || 0,
                        denemeKayitSayisi: dh?.kayit || 0,
                    };
                    const risk = konuRisk(genis);
                    const oncelik = konuOncelik(genis, { konuRisk: risk, bugun });
                    oncelikler.push({
                        ders: dersAdi(ders), konu: d.konu,
                        oncelik: oncelik.skor, riskSeviye: risk.seviye,
                        neden: oncelik.nedenler[0] || risk.nedenler[0] || null,
                    });
                    if (d.tamam && genis.denemeHatasi > 0) {
                        hataliTamamlar.push({
                            ders: dersAdi(ders), konu: d.konu,
                            denemeHatasi: genis.denemeHatasi,
                            sonHataTarihi: dh?.sonHataTarihi || null,
                        });
                    }
                });
            });
        });

        cikti.set(sid, {
            sinav, toplamKonu, tamam, tekrar, calisilan,
            oran: toplamKonu ? Math.round((tamam / toplamKonu) * 100) : 0,
            // En acil 3 konu ve "tamamlandı ✓ ama denemelerde hata" ilk 3'ü
            topOncelik: oncelikler.sort((x, y) => y.oncelik - x.oncelik).slice(0, 3),
            tamamHatali: hataliTamamlar.sort((x, y) => y.denemeHatasi - x.denemeHatasi).slice(0, 3),
        });
    });

    return cikti;
};

/** Koçun belirlediği ölçütler (Ayarlar → Genel). */
export const olcutOku = () => {
    try {
        const s = nesneOku('app_settings');
        const t = s?.topic || {};
        return {
            carpan: Number(t.carpan) > 0 ? Number(t.carpan) : VARSAYILAN_OLCUT.carpan,
            basariEsigi: Number(t.basariEsigi) > 0 ? Number(t.basariEsigi) : VARSAYILAN_OLCUT.basariEsigi,
            tekrarEsigi: Number(t.tekrarEsigi) > 0 ? Number(t.tekrarEsigi) : VARSAYILAN_OLCUT.tekrarEsigi,
        };
    } catch {
        return { ...VARSAYILAN_OLCUT };
    }
};

export default {
    DURUMLAR, VARSAYILAN_OLCUT,
    konuListesi, bolumler, konuHaritasi, konuDurumu, sonrakiKonular, topluOzet,
    ogrencininSinavi, ogrencininAlani, ogrencininBolumleri,
    elleIsaretle, elleIsaretliMi, olcutOku, anahtar, dersAdi,
    konuKimligi, isaretBul,
};
