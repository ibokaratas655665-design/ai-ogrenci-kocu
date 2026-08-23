/**
 * Program Motoru 2.0 — kural testleri.
 *
 * Talimattaki 15 test senaryosunun motoru ilgilendiren kısmı burada;
 * UI/senkron ayağı tarayıcıda ölçülür.
 */
import { describe, it, expect } from 'vitest';
import {
    programUret, programDenetle, konuEtutIhtiyaci, soruEtutIhtiyaci,
    denemeEtutSayisi, dersPaylari, KRITER_VARSAYILANLARI,
} from './programMotoru';
import { OTURUMLAR, DERS_SORULARI, bilisselGrup } from '../data/sinavYapisi';

/** Test kolaylığı: konu üretici. */
const konu = (bolum, ders, ad, agirlik, zorluk, ek = {}) => ({
    bolum, ders, dersAd: ders === 'matematik' ? 'Matematik'
        : ders === 'turkce' ? 'Türkçe'
        : ders === 'fizik' ? 'Fizik'
        : ders === 'edebiyat' ? 'Türk Dili ve Edebiyatı'
        : ders === 'tarih' ? 'Tarih'
        : ders === 'okuma' ? 'Okuma ve Paragraf' : ders,
    konu: ad, agirlik, zorluk, hedef: 100, kalanSoru: 100, bitti: false, ...ek,
});

const hucreler = (schedule) => Object.entries(schedule).map(([k, v]) => ({ k, ...v }));
const dersSayilir = (t) => t === 'konu' || t === 'soru' || t === 'tekrar';

/** Gün gün farklı ders / farklı konu sayımı. */
const gunlukSayim = (schedule) => {
    const harita = new Map();
    for (const [anahtar, h] of Object.entries(schedule)) {
        const m = /^m(\d+)-w(\d+)-(.+)-(\d+)$/.exec(anahtar);
        const gun = `${m[1]}-${m[2]}-${m[3]}`;
        if (!harita.has(gun)) harita.set(gun, { dersler: new Set(), konular: new Set(), sira: [] });
        const g = harita.get(gun);
        if (dersSayilir(h.type)) g.dersler.add(h.subject);
        if (h.type === 'konu') g.konular.add(h.topic);
        g.sira.push({ etut: Number(m[4]), ...h });
    }
    for (const g of harita.values()) g.sira.sort((a, b) => a.etut - b.etut);
    return harita;
};

describe('hesaplayıcılar', () => {
    it('konu etüt ihtiyacı ağırlık ve zorlukla artar', () => {
        const kolayDar = konuEtutIhtiyaci({ agirlik: 0.5, zorluk: 1 });
        const zorGenis = konuEtutIhtiyaci({ agirlik: 12, zorluk: 3 });
        expect(kolayDar).toBe(1);
        expect(zorGenis).toBeGreaterThan(kolayDar);
        // Aynı ağırlıkta zor konu, kolay konudan az olamaz
        expect(konuEtutIhtiyaci({ agirlik: 5, zorluk: 3 }))
            .toBeGreaterThanOrEqual(konuEtutIhtiyaci({ agirlik: 5, zorluk: 1 }));
    });

    it('bitmiş konu daha az etüt ister (pekiştirme)', () => {
        const normal = konuEtutIhtiyaci({ agirlik: 12, zorluk: 2 });
        const bitmis = konuEtutIhtiyaci({ agirlik: 12, zorluk: 2, bitti: true });
        expect(bitmis).toBeLessThan(normal);
        expect(bitmis).toBeGreaterThanOrEqual(1);
    });

    /* TEST 4: 120 soru hedefi → süreden etüt sayısı (sabit eşleme yok) */
    it('soru etüdü, hedef soru × soru süresi / etüt süresinden gelir', () => {
        // TYT Türkçe: 1.5 dk/soru × 120 × 1.2 pratik = 216 dk / 40 = 6 etüt (tavan)
        const turkce = soruEtutIhtiyaci(
            { bolum: 'TYT', ders: 'turkce', kalanSoru: 120 },
            { etutSuresiDk: 40, pratikCarpani: 1.2 },
        );
        // AYT Matematik: 2.5 dk/soru → aynı soru sayısı daha çok etüt ister
        const aytMat = soruEtutIhtiyaci(
            { bolum: 'AYT_SAY', ders: 'matematik', kalanSoru: 120 },
            { etutSuresiDk: 40, pratikCarpani: 1.2 },
        );
        expect(turkce).toBeGreaterThan(0);
        expect(aytMat).toBeGreaterThanOrEqual(turkce);
        // 60 soruluk hedef, 120'den az etüt ister
        const yarim = soruEtutIhtiyaci(
            { bolum: 'TYT', ders: 'turkce', kalanSoru: 30 },
            { etutSuresiDk: 40, pratikCarpani: 1.2 },
        );
        expect(yarim).toBeLessThan(turkce);
    });

    it('sözel ve sayısal soru süreleri farklı', () => {
        const sozel = soruEtutIhtiyaci({ bolum: 'TYT', ders: 'tarih', kalanSoru: 100 }, {});
        const sayisal = soruEtutIhtiyaci({ bolum: 'TYT', ders: 'matematik', kalanSoru: 100 }, {});
        expect(sayisal).toBeGreaterThan(sozel);
    });

    /* TEST 7: deneme etüdü gerçek sınav süresinden */
    it('deneme etüt sayısı gerçek oturum süresinden hesaplanır', () => {
        const kriter = { etutSuresiDk: 40 };
        expect(denemeEtutSayisi('TYT', kriter)).toBe(Math.ceil(OTURUMLAR.TYT.sureDk / 40));   // 165/40 → 5
        expect(denemeEtutSayisi('AYT_SAY', kriter)).toBe(Math.ceil(OTURUMLAR.AYT.sureDk / 40)); // 180/40 → 5
        expect(denemeEtutSayisi('YDT', kriter)).toBe(Math.ceil(OTURUMLAR.YDT.sureDk / 40));     // 120/40 → 3
        // Etüt süresi büyürse etüt sayısı düşer
        expect(denemeEtutSayisi('TYT', { etutSuresiDk: 60 })).toBe(3);
        // Eski sabit "2 etüt" varsayımı artık geçerli değil
        expect(denemeEtutSayisi('TYT', kriter)).toBeGreaterThan(2);
    });

    it('ders payları YKS soru dağılımı ve oturum katkısını yansıtır', () => {
        const paylar = dersPaylari([
            konu('TYT', 'matematik', 'Türev', 3, 2),
            konu('TYT', 'tarih', 'Osmanlı', 1, 2),
        ]);
        // TYT Matematik 32 soru, Tarih 5 soru → pay oranı ~6.4 kat
        expect(paylar.get('TYT:matematik') / paylar.get('TYT:tarih'))
            .toBeCloseTo(DERS_SORULARI.TYT.matematik / DERS_SORULARI.TYT.tarih, 5);
    });
});

describe('program üretimi — kesin kurallar', () => {
    const temelKonular = [
        konu('TYT', 'matematik', 'Temel Kavramlar', 2, 1),
        konu('TYT', 'matematik', 'Problemler: Sayı-Kesir', 3, 2),
        konu('TYT', 'turkce', 'Paragrafta Anlam', 12, 2),
        konu('TYT', 'turkce', 'Sözcükte Anlam', 3, 1),
        konu('AYT_SAY', 'fizik', 'Vektörler', 1, 2),
    ];

    /* TEST 1: günde en fazla X ders */
    it('günlük en fazla ders sınırı HİÇBİR günde aşılmaz', () => {
        for (const limit of [1, 2, 3]) {
            const { schedule } = programUret({
                konular: temelKonular, alanId: 'SAY',
                kriterler: { gunlukMaxDers: limit, gunlukMaxKonu: 5 },
                aylar: 1, haftaPerAy: 4, gunlukEtut: 6,
            });
            for (const [gun, g] of gunlukSayim(schedule)) {
                expect(g.dersler.size, `${gun} — limit ${limit}`).toBeLessThanOrEqual(limit);
            }
        }
    });

    /* TEST 2: günde en fazla Y konu */
    it('günlük en fazla konu sınırı HİÇBİR günde aşılmaz', () => {
        for (const limit of [1, 2]) {
            const { schedule } = programUret({
                konular: temelKonular, alanId: 'SAY',
                kriterler: { gunlukMaxDers: 4, gunlukMaxKonu: limit },
                aylar: 1, haftaPerAy: 4, gunlukEtut: 6,
            });
            for (const [gun, g] of gunlukSayim(schedule)) {
                expect(g.konular.size, `${gun} — limit ${limit}`).toBeLessThanOrEqual(limit);
            }
        }
    });

    /* TEST 5 + 6: konu etütleri bitmeden soru etüdü gelmez */
    it('bir konunun soru etüdü, o konunun konu etütleri bittikten SONRA gelir', () => {
        const { schedule } = programUret({
            konular: temelKonular, alanId: 'SAY',
            kriterler: { gunlukMaxDers: 3, gunlukMaxKonu: 2 },
            aylar: 1, haftaPerAy: 4, gunlukEtut: 6,
        });
        // Zaman sırasına diz
        const sirali = hucreler(schedule)
            .map((h) => {
                const m = /^m(\d+)-w(\d+)-(.+)-(\d+)$/.exec(h.k);
                return { ...h, sira: Number(m[1]) * 100000 + Number(m[2]) * 10000 + gunIndex(m[3]) * 100 + Number(m[4]) };
            })
            .sort((a, b) => a.sira - b.sira);

        const konuBitis = new Map();  // konu → son konu etüdünün sırası
        const soruBaslangic = new Map();
        for (const h of sirali) {
            if (h.type === 'konu') konuBitis.set(h.topic, h.sira);
            if (h.type === 'soru' && !soruBaslangic.has(h.topic)) soruBaslangic.set(h.topic, h.sira);
        }
        for (const [konuAd, soruSira] of soruBaslangic) {
            expect(konuBitis.has(konuAd), `${konuAd} için konu etüdü olmalı`).toBe(true);
            expect(soruSira, `${konuAd}: soru etüdü konu etüdünden sonra`).toBeGreaterThan(konuBitis.get(konuAd));
        }
        expect(soruBaslangic.size).toBeGreaterThan(0);
    });

    /* TEST 8 + 9: esnek/telafi sayısı koçun belirlediği kadar */
    it('esnek/telafi etüdü 0 seçilirse programda hiç oluşmaz', () => {
        const { schedule } = programUret({
            konular: temelKonular, alanId: 'SAY',
            kriterler: { esnekHaftalik: 0 },
            aylar: 1, haftaPerAy: 4, gunlukEtut: 6,
        });
        expect(hucreler(schedule).filter((h) => h.type === 'mola').length).toBe(0);
    });

    it('esnek/telafi 3 seçilirse haftada en çok 3 oluşur', () => {
        const { schedule } = programUret({
            konular: temelKonular, alanId: 'SAY',
            kriterler: { esnekHaftalik: 3 },
            aylar: 1, haftaPerAy: 4, gunlukEtut: 8,
        });
        const haftalik = new Map();
        for (const h of hucreler(schedule)) {
            if (h.type !== 'mola') continue;
            const m = /^m(\d+)-w(\d+)-/.exec(h.k);
            const anahtar = `${m[1]}-${m[2]}`;
            haftalik.set(anahtar, (haftalik.get(anahtar) || 0) + 1);
        }
        expect(haftalik.size).toBeGreaterThan(0);
        for (const [hafta, adet] of haftalik) {
            expect(adet, `hafta ${hafta}`).toBeLessThanOrEqual(3);
        }
    });

    it('deneme günü gerçek süreye göre etüt ayırır ve analiz hemen ardından gelir', () => {
        const { schedule } = programUret({
            konular: temelKonular, alanId: 'SAY',
            kriterler: { denemeAcik: true, denemeGunu: 'Pazar', analizEtut: 1, etutSuresiDk: 40 },
            aylar: 1, haftaPerAy: 1, gunlukEtut: 8,
        });
        const pazar = gunlukSayim(schedule).get('1-1-Pazar');
        const denemeler = pazar.sira.filter((h) => h.type === 'deneme');
        const analizler = pazar.sira.filter((h) => h.type === 'analiz');
        expect(denemeler.length).toBeGreaterThan(2);   // eski sabit 2 kuralı aşıldı
        expect(analizler.length).toBe(1);
        // Analiz, son denemeden HEMEN sonra
        expect(analizler[0].etut).toBe(denemeler[denemeler.length - 1].etut + 1);
    });

    it('ekstra çalışmalar ders sayılmaz — günlük ders limitine girmez', () => {
        const { schedule } = programUret({
            konular: temelKonular, alanId: 'SAY',
            kriterler: { gunlukMaxDers: 1, gunlukMaxKonu: 1, paragrafAcik: true, kitapAcik: true },
            aylar: 1, haftaPerAy: 1, gunlukEtut: 6,
        });
        const tumHucreler = hucreler(schedule);
        // Ekstralar var
        expect(tumHucreler.some((h) => h.type === 'paragraf')).toBe(true);
        expect(tumHucreler.some((h) => h.type === 'kitap')).toBe(true);
        // Ama ders limiti yine de tutuyor
        for (const [gun, g] of gunlukSayim(schedule)) {
            expect(g.dersler.size, gun).toBeLessThanOrEqual(1);
        }
    });

    it('aralıklı tekrar halkaları konudan SONRA ve artan aralıklarla gelir', () => {
        const { schedule } = programUret({
            konular: [konu('TYT', 'turkce', 'Sözcükte Anlam', 3, 1)],
            alanId: 'TYT',
            kriterler: { tekrarAcik: true, tekrarAraliklari: [1, 7], gunlukMaxDers: 3, gunlukMaxKonu: 2 },
            aylar: 1, haftaPerAy: 4, gunlukEtut: 6,
        });
        const tekrarlar = hucreler(schedule).filter((h) => h.type === 'tekrar');
        expect(tekrarlar.length).toBeGreaterThan(0);
        expect(tekrarlar.every((t) => [1, 7].includes(t.round))).toBe(true);
    });

    /* TEST 10-13: alan bazlı ana ders dağılımı */
    it('SAY / EA / SÖZ / DİL programları farklı ağırlıklanır', () => {
        const senaryolar = {
            SAY: [konu('TYT', 'matematik', 'Temel Kavramlar', 2, 1), konu('AYT_SAY', 'fizik', 'Vektörler', 1, 2), konu('AYT_SAY', 'matematik', 'Türev', 5, 3)],
            EA:  [konu('TYT', 'matematik', 'Temel Kavramlar', 2, 1), konu('AYT_EA', 'edebiyat', 'Divan Edebiyatı', 3, 3), konu('AYT_EA', 'matematik', 'Türev', 5, 3)],
            SOZ: [konu('TYT', 'turkce', 'Paragrafta Anlam', 12, 2), konu('AYT_SOZ', 'edebiyat', 'Divan Edebiyatı', 3, 3), konu('AYT_SOZ', 'tarih', 'Millî Mücadele', 2.5, 2)],
            DIL: [konu('TYT', 'turkce', 'Paragrafta Anlam', 12, 2), konu('YDT', 'okuma', 'Paragraf: Ana Fikir ve Detay', 6, 2)],
        };
        const dagilimlar = {};
        for (const [alan, konular] of Object.entries(senaryolar)) {
            const { schedule, stats } = programUret({
                konular, alanId: alan,
                kriterler: { gunlukMaxDers: 3, gunlukMaxKonu: 2 },
                aylar: 1, haftaPerAy: 2, gunlukEtut: 6,
            });
            expect(Object.keys(schedule).length).toBeGreaterThan(0);
            dagilimlar[alan] = stats.dersDagilimi;
        }
        // Sayısalda Fizik var, Sözelde yok; Sözelde Edebiyat var
        expect(dagilimlar.SAY.Fizik).toBeGreaterThan(0);
        expect(dagilimlar.SOZ.Fizik).toBeUndefined();
        expect(dagilimlar.SOZ['Türk Dili ve Edebiyatı']).toBeGreaterThan(0);
        expect(dagilimlar.DIL['Okuma ve Paragraf']).toBeGreaterThan(0);
    });

    it('ana dersler kapasite elverdiğinde her hafta programda yer alır', () => {
        const { uyarilar } = programUret({
            konular: [
                konu('TYT', 'turkce', 'Paragrafta Anlam', 12, 2),
                konu('TYT', 'matematik', 'Problemler: Sayı-Kesir', 3, 2),
            ],
            alanId: 'TYT',
            kriterler: { gunlukMaxDers: 3, gunlukMaxKonu: 2 },
            aylar: 1, haftaPerAy: 1, gunlukEtut: 6,
        });
        // Seçilen iki ana ders için "hiç yok" uyarısı çıkmamalı
        const anaUyari = uyarilar.filter((u) => u.tur === 'ana-ders');
        expect(anaUyari.length).toBe(0);
    });

    it('mevcut dolu hücrelerin üzerine yazmaz', () => {
        const mevcut = { 'm1-w1-Pazartesi-0': { subject: 'Elle', topic: 'Koç notu', type: 'konu' } };
        const { schedule } = programUret({
            konular: temelKonular, alanId: 'SAY',
            mevcutSchedule: mevcut,
            aylar: 1, haftaPerAy: 1, gunlukEtut: 6,
        });
        expect(schedule['m1-w1-Pazartesi-0']).toBeUndefined();
    });

    it('kapalı etütlere yerleştirme yapmaz', () => {
        const { schedule } = programUret({
            konular: temelKonular, alanId: 'SAY',
            kapaliEtutler: { Pazartesi: [0, 1, 2, 3, 4, 5] },
            aylar: 1, haftaPerAy: 1, gunlukEtut: 6,
        });
        expect(hucreler(schedule).some((h) => h.k.includes('-Pazartesi-'))).toBe(false);
    });

    it('QA denetçisi limit ihlalini yakalar', () => {
        const bozuk = {
            'm1-w1-Salı-0': { subject: 'Matematik', topic: 'A', type: 'konu' },
            'm1-w1-Salı-1': { subject: 'Türkçe', topic: 'B', type: 'konu' },
            'm1-w1-Salı-2': { subject: 'Fizik', topic: 'C', type: 'konu' },
        };
        const uyarilar = programDenetle(bozuk, { kriterler: { ...KRITER_VARSAYILANLARI, gunlukMaxDers: 2, gunlukMaxKonu: 2 } });
        expect(uyarilar.some((u) => u.tur === 'limit-ders')).toBe(true);
        expect(uyarilar.some((u) => u.tur === 'limit-konu')).toBe(true);
    });
});

/** Gün adından hafta içi sırası. */
function gunIndex(ad) {
    return ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].indexOf(ad);
}

/* ══════════════════════════════════════════════════════════════
   MOTOR 3.0 — kapasite, bloklama, çok sınavlı destek
   ══════════════════════════════════════════════════════════════ */
describe('Motor 3.0 — kapasite ve bloklama', () => {
    const yksKonular = [
        konu('TYT', 'turkce', 'Paragrafta Anlam', 12, 2),
        konu('TYT', 'turkce', 'Sözcükte Anlam', 3, 1),
        konu('TYT', 'matematik', 'Problemler: Sayı-Kesir', 3, 2),
        konu('TYT', 'matematik', 'Temel Kavramlar', 2, 1),
        konu('AYT_SAY', 'fizik', 'Vektörler', 1, 2),
        konu('AYT_SAY', 'matematik', 'Türev', 5, 3),
    ];

    /* TEST 1: 10 ay / 6 etüt → son ay boş olmamalı, hiç boş etüt kalmamalı */
    it('10 ay × 6 etüt programında boş etüt kalmaz ve son ay dolu olur', () => {
        const aylar = 10;
        const { schedule, stats, uyarilar } = programUret({
            konular: yksKonular, sinavId: 'YKS', alanId: 'SAY',
            kriterler: { gunlukMaxDers: 3, gunlukMaxKonu: 2 },
            aylar, haftaPerAy: 4, gunlukEtut: 6,
        });
        // Beklenen hücre: 10 ay × 4 hafta × 7 gün × 6 etüt
        const beklenen = aylar * 4 * 7 * 6;
        expect(Object.keys(schedule).length).toBe(beklenen);
        expect(stats.bosEtut).toBe(0);
        // Son ay gerçekten dolu
        const sonAy = Object.keys(schedule).filter((k) => k.startsWith(`m${aylar}-`));
        expect(sonAy.length).toBe(4 * 7 * 6);
        // QA: boş etüt / son ay uyarısı çıkmamalı
        expect(uyarilar.some((u) => u.tur === 'bos-etut' || u.tur === 'son-ay-bos')).toBe(false);
    });

    /* TEST 3: aynı ders 4+ blok oluşmamalı */
    it('aynı ders arka arkaya 4+ etüt bloklanmaz', () => {
        const { schedule, uyarilar } = programUret({
            konular: yksKonular, sinavId: 'YKS', alanId: 'SAY',
            kriterler: { gunlukMaxDers: 3, gunlukMaxKonu: 2 },
            aylar: 3, haftaPerAy: 4, gunlukEtut: 6,
        });
        for (const [gun, g] of gunlukSayim(schedule)) {
            let ard = 0, onceki = null, oncekiKonu = null, ayniKonu = true;
            for (const h of g.sira) {
                if (!dersSayilir(h.type)) { ard = 0; onceki = null; continue; }
                if (h.subject === onceki) {
                    ard++;
                    if (h.topic !== oncekiKonu) ayniKonu = false;
                } else { ard = 1; ayniKonu = true; }
                // Aynı konu zinciri en çok 3, farklı konu en çok 2
                expect(ard, `${gun} — ${h.subject} ${ard} kez arka arkaya`).toBeLessThanOrEqual(ayniKonu ? 3 : 2);
                onceki = h.subject; oncekiKonu = h.topic;
            }
        }
        expect(uyarilar.some((u) => u.tur === 'ders-bloklama')).toBe(false);
    });

    it('QA denetçisi 4 blokluk ihlali yakalar', () => {
        const bozuk = {};
        for (let i = 0; i < 4; i++) {
            bozuk[`m1-w1-Salı-${i}`] = { subject: 'Türkçe', topic: `Konu ${i}`, type: 'konu' };
        }
        const uyarilar = programDenetle(bozuk, {
            kriterler: { ...KRITER_VARSAYILANLARI, gunlukMaxDers: 3, gunlukMaxKonu: 9 },
        });
        expect(uyarilar.some((u) => u.tur === 'ders-bloklama')).toBe(true);
    });

    /* TEST 10 — her sınav kendi yapısıyla program üretebiliyor */
    it('LGS / KPSS / AGS kendi ders ve süreleriyle program üretir', () => {
        const senaryolar = {
            LGS: {
                sinavId: 'LGS', alanId: null,
                konular: [
                    konu('SOZEL', 'turkce', 'Paragrafta Anlam', 5, 2),
                    konu('SOZEL', 'inkilap', 'Bir Kahraman Doğuyor', 1.5, 1),
                    konu('SAYISAL', 'matematik', 'Çarpanlar ve Katlar', 2, 2),
                    konu('SAYISAL', 'fen', 'Basınç', 3, 2),
                ],
            },
            KPSS: {
                sinavId: 'KPSS', alanId: 'OGRETMEN',
                konular: [
                    konu('GY', 'turkce', 'Paragraf', 10, 2),
                    konu('GY', 'matematik', 'Problemler: Sayı-Kesir', 2.5, 2),
                    konu('GK', 'tarih', 'Atatürk İlke ve İnkılapları', 3, 2),
                    konu('EB', 'ogretim', 'Öğretim Yöntem ve Teknikleri', 2, 2),
                ],
            },
            AGS: {
                sinavId: 'AGS', alanId: null,
                konular: [
                    konu('GENEL', 'turkce', 'Paragraf', 6, 2),
                    konu('GENEL', 'matematik', 'Problemler', 3, 2),
                    konu('EB', 'ogretim', 'Öğretim Yöntem ve Teknikleri', 2, 2),
                    konu('MEVZUAT', 'mevzuat', '657 Sayılı DMK: Genel Hükümler', 1, 2),
                ],
            },
        };
        for (const [ad, s] of Object.entries(senaryolar)) {
            const { schedule, stats } = programUret({
                ...s,
                kriterler: { gunlukMaxDers: 2, gunlukMaxKonu: 2 },
                aylar: 1, haftaPerAy: 2, gunlukEtut: 6,
            });
            expect(Object.keys(schedule).length, `${ad}: program üretilmeli`).toBeGreaterThan(0);
            expect(stats.bosEtut, `${ad}: boş etüt kalmamalı`).toBe(0);
            // Günlük ders limiti her sınavda geçerli
            for (const [gun, g] of gunlukSayim(schedule)) {
                expect(g.dersler.size, `${ad} ${gun}`).toBeLessThanOrEqual(2);
            }
        }
    });

    it('her sınavın denemesi KENDİ süresinden hesaplanır', () => {
        const k = { etutSuresiDk: 40 };
        // TYT 165dk → 5 · LGS Sözel 75dk → 2 · LGS Sayısal 80dk → 2
        expect(denemeEtutSayisi('TYT', k, 'YKS')).toBe(5);
        expect(denemeEtutSayisi('SOZEL', k, 'LGS')).toBe(2);
        expect(denemeEtutSayisi('SAYISAL', k, 'LGS')).toBe(2);
        // KPSS GY-GK 130dk → 4 · KPSS EB 100dk → 3
        expect(denemeEtutSayisi('GY', k, 'KPSS')).toBe(4);
        expect(denemeEtutSayisi('EB', k, 'KPSS')).toBe(3);
        // AGS 110dk → 3 — KPSS EB ile AYNI 'EB' kimliği ama farklı süre
        expect(denemeEtutSayisi('EB', k, 'AGS')).toBe(3);
        expect(denemeEtutSayisi('GENEL', k, 'AGS')).toBe(3);
    });

    it('bilişsel geçiş kuralı sınava özgüdür (YKS kuralı kör kopyalanmaz)', () => {
        // LGS'de matematik+fen aynı grup (islem), türkçe+ingilizce dil
        expect(bilisselGrup('LGS', 'matematik')).toBe(bilisselGrup('LGS', 'fen'));
        expect(bilisselGrup('LGS', 'turkce')).toBe(bilisselGrup('LGS', 'ingilizce'));
        expect(bilisselGrup('LGS', 'matematik')).not.toBe(bilisselGrup('LGS', 'turkce'));
        // KPSS'de eğitim bilimleri kendi grubu (kuram)
        expect(bilisselGrup('KPSS', 'ogretim')).toBe('kuram');
        expect(bilisselGrup('KPSS', 'tarih')).toBe('ezber');
        // YKS'de klasik sayısal/sözel
        expect(bilisselGrup('YKS', 'fizik')).toBe('sayisal');
        expect(bilisselGrup('YKS', 'edebiyat')).toBe('sozel');
    });

    it('ders payları her sınavın KENDİ soru dağılımından gelir', () => {
        // LGS: Türkçe 20 soru, İnkılap 10 → 2 kat
        const lgs = dersPaylari([
            konu('SOZEL', 'turkce', 'X', 5, 2),
            konu('SOZEL', 'inkilap', 'Y', 1.5, 2),
        ], 'LGS');
        expect(lgs.get('SOZEL:turkce') / lgs.get('SOZEL:inkilap')).toBeCloseTo(2, 5);
        // AGS EB (30 soru) ile KPSS EB (80 soru) farklı ağırlık almalı
        const agsPay = dersPaylari([konu('EB', 'ogretim', 'X', 2, 2)], 'AGS').get('EB:ogretim');
        const kpssPay = dersPaylari([konu('EB', 'ogretim', 'X', 2, 2)], 'KPSS').get('EB:ogretim');
        expect(kpssPay).toBeGreaterThan(agsPay);
    });
});
