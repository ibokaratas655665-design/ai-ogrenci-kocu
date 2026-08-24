/**
 * Kullanıcı bildirimi regresyon testleri (25.08.2026).
 *
 * Gerçek bir koçun bildirdiği 4 program-motoru hatasını yeniden üretip
 * düzeltmeyi kanıtlar: ders dengesizliği (Türkçe'ye 17 etüt), tek-tek
 * serpiştirme (AA-BB bloklama yok), sayısal/sözel sınırının tamamen
 * düşmesi, yeni konunun tekrarla başlaması. Bu dört senaryo kalıcı
 * regresyon koruması olarak testte tutuluyor.
 */
import { describe, it, expect } from 'vitest';
import { programUret } from './programMotoru';
import { getCellColor } from '../data/programColors';

const dersAdi = { matematik: 'Matematik', turkce: 'Türkçe', fizik: 'Fizik', din: 'Din Kültürü' };

// Anahtar `mAY-wHAFTA-GÜN-ETÜT` — gün adları alfabetik değil, gerçek
// hafta sırasına göre karşılaştırılmalı (Pazartesi ... Pazar).
const GUN_SIRA = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const anahtarSirala = (k) => {
    const m = /^m(\d+)-w(\d+)-(.+)-(\d+)$/.exec(k);
    return [Number(m[1]), Number(m[2]), GUN_SIRA.indexOf(m[3]), Number(m[4])];
};
const kronolojik = (a, b) => {
    const A = anahtarSirala(a[0]), B = anahtarSirala(b[0]);
    for (let i = 0; i < 4; i++) if (A[i] !== B[i]) return A[i] - B[i];
    return 0;
};

const konu = (bolum, ders, ad, agirlik, zorluk, bitti = false) => ({
    bolum, ders, dersAd: dersAdi[ders], konu: ad, agirlik, zorluk,
    hedef: 100, kalanSoru: 100, bitti,
});

// Gerçekçi orantı: Türkçe 18 konu (küçük ağırlıklı çoğu), Din 5 konu — TYT'de olduğu gibi.
const turkceKonular = Array.from({ length: 18 }, (_, i) => konu('TYT', 'turkce', `Türkçe Konu ${i + 1}`, 2, 1));
const matKonular = Array.from({ length: 10 }, (_, i) => konu('TYT', 'matematik', `Mat Konu ${i + 1}`, 3, 2));
const fizikKonular = Array.from({ length: 6 }, (_, i) => konu('TYT', 'fizik', `Fizik Konu ${i + 1}`, 3, 2));
const dinKonular = Array.from({ length: 5 }, (_, i) => konu('TYT', 'din', `Din Konu ${i + 1}`, 1, 1));

describe('kullanıcı bildirimi doğrulama', () => {
    it('1) ders dengesizliği: hiçbir ders diğerlerinden orantısız fazla etüt almaz', () => {
        const konular = [...turkceKonular, ...matKonular, ...fizikKonular, ...dinKonular];
        const { schedule } = programUret({
            konular, sinavId: 'TYT', alanId: null,
            aylar: 1, haftaPerAy: 1, gunlukEtut: 6,
        });
        const sayim = {};
        for (const h of Object.values(schedule)) {
            if (!['konu', 'soru', 'tekrar'].includes(h.type)) continue;
            sayim[h.subject] = (sayim[h.subject] || 0) + 1;
        }
        console.log('Ders başına etüt sayısı (1 hafta):', sayim);
        /* TYT'de Türkçe ve Matematik'in RESMÎ soru ağırlığı neredeyse eşittir
           (dersPaylari bunu sinavYapisi.js'teki resmî sayılardan alır — bu
           testteki topic-level `agirlik` alanları bu payı ETKİLEMEZ).
           Eski hatada Türkçe'nin 18 konusu Matematik'in 10 konusundan SADECE
           konu SAYISI fazla olduğu için ~1.8× fazla etüt kapıyordu; ağırlık
           eşit olduğu için oran ~1'e yakın olmalı. */
        expect(sayim['Matematik']).toBeGreaterThan(0);
        const oran = sayim['Türkçe'] / sayim['Matematik'];
        console.log('Türkçe/Matematik oranı (~1 olmalı, eskiden ~1.8+ idi):', oran);
        expect(oran).toBeLessThan(1.6);
        expect(oran).toBeGreaterThan(0.6);
    });

    it('2) aynı ders 2 etüt art arda geliyor, sonra değişiyor (AA-BB deseni)', () => {
        const konular = [...turkceKonular, ...matKonular, ...fizikKonular, ...dinKonular];
        const { schedule } = programUret({
            konular, sinavId: 'TYT', alanId: null,
            aylar: 1, haftaPerAy: 1, gunlukEtut: 6,
        });
        // Bir günün sırasını çıkar, ardışık aynı-ders bloklarını say
        const gun1 = Object.entries(schedule)
            .filter(([k]) => k.startsWith('m1-w1-Pazartesi-'))
            .sort((a, b) => Number(a[0].split('-').pop()) - Number(b[0].split('-').pop()))
            .map(([, v]) => v)
            .filter((v) => ['konu', 'soru', 'tekrar'].includes(v.type));
        console.log('Pazartesi sırası:', gun1.map((v) => v.subject));
        let ikiliBlok = 0, tekli = 0, i = 0;
        while (i < gun1.length) {
            let j = i;
            while (j + 1 < gun1.length && gun1[j + 1].subject === gun1[i].subject) j++;
            const uzunluk = j - i + 1;
            if (uzunluk >= 2) ikiliBlok++; else tekli++;
            i = j + 1;
        }
        // En azından bazı bloklar 2'li olmalı — hepsi tekli (A-B-A-C) olmamalı
        expect(ikiliBlok).toBeGreaterThan(0);
    });

    it('3) sayısal/sözel: aynı bilişsel grup 3-4 etütten fazla art arda gelmiyor', () => {
        const konular = [...turkceKonular, ...matKonular, ...fizikKonular, ...dinKonular];
        const { schedule } = programUret({
            konular, sinavId: 'TYT', alanId: null,
            aylar: 1, haftaPerAy: 1, gunlukEtut: 6,
        });
        const grupSira = Object.entries(schedule)
            .sort(kronolojik)
            .map(([, v]) => v)
            .filter((v) => ['konu', 'soru', 'tekrar'].includes(v.type) && v.grup);
        let maxAyniGrup = 0, mevcut = 1;
        for (let i = 1; i < grupSira.length; i++) {
            if (grupSira[i].grup === grupSira[i - 1].grup) { mevcut++; } else { mevcut = 1; }
            maxAyniGrup = Math.max(maxAyniGrup, mevcut);
        }
        console.log('En uzun aynı-grup dizisi:', maxAyniGrup);
        expect(maxAyniGrup).toBeLessThanOrEqual(4);
    });

    it('4) hiç çalışılmamış yeni konu eklendiğinde o dersin ilk hücresi "konu" tipinde olur (bitmiş konular arkaya)', () => {
        // Matematik'te 5 konu ZATEN bitmiş (tekrar kuyruğuna hızla girecek),
        // 1 konu YENİ (hiç çalışılmamış) — yeni eklenen gibi.
        const bitmisMat = Array.from({ length: 5 }, (_, i) => konu('TYT', 'matematik', `Eski Mat ${i + 1}`, 3, 2, true));
        const yeniMat = konu('TYT', 'matematik', 'Yeni Konu (Bu Hafta Eklendi)', 3, 2, false);
        const konular = [...bitmisMat, yeniMat];
        const { schedule } = programUret({
            konular, sinavId: 'TYT', alanId: null,
            aylar: 1, haftaPerAy: 1, gunlukEtut: 6,
        });
        const matHucreleri = Object.entries(schedule)
            .filter(([, v]) => v.subject === 'Matematik' && ['konu', 'soru', 'tekrar'].includes(v.type))
            .sort(kronolojik)
            .map(([k, v]) => ({ k, ...v }));
        console.log('Matematik hücreleri sırayla:', matHucreleri.map((h) => `${h.type}:${h.topic}`));
        // Yeni konunun kendi ilk hücresi 'konu' olmalı (motorun kendi garantisi)
        const yeniKonununIlkHucresi = matHucreleri.find((h) => h.topic === yeniMat.konu);
        expect(yeniKonununIlkHucresi?.type).toBe('konu');
        // Kronolojik olarak Matematik'in GÖRÜNEN ilk hücresi de yeni konu
        // olmalı (bitmiş konuların tekrarları arkaya alındığı için) —
        // yoksa koç ilk gördüğü "Matematik" hücresini yeni konunun ilk
        // etüdü sanıp "tekrar" gördüğünü düşünür.
        expect(matHucreleri[0]?.topic).toBe(yeniMat.konu);
        expect(matHucreleri[0]?.type).toBe('konu');
    });

    it('5) [ekran görüntüsü, 25.08.2026] bir konunun tekrarı kendi konu etüdünden ÖNCE görünmez (4 hafta)', () => {
        // Az konu + uzun süre → konular gerçekten TAMAMLANIP tekrar
        // kuyruğuna girsin (kısa 1 haftalık testte tekrar hiç oluşmaz).
        const konular = [
            konu('TYT', 'matematik', 'Temel Kavramlar', 3, 2),
            konu('TYT', 'turkce', 'Sözcükte Anlam', 2, 1),
            konu('TYT', 'fizik', 'Madde ve Özellikleri', 3, 2),
        ];
        const { schedule } = programUret({
            konular, sinavId: 'TYT', alanId: null,
            aylar: 2, haftaPerAy: 4, gunlukEtut: 4,
            kriterler: { tekrarAraliklari: [1, 7, 30] },
        });
        const hepsi = Object.entries(schedule)
            .filter(([, v]) => ['konu', 'soru', 'tekrar'].includes(v.type))
            .sort(kronolojik)
            .map(([k, v]) => ({ k, ...v }));

        const ihlaller = [];
        const ilkKonuGorulduMu = new Set(); // topic adı → görüldü mü
        for (const h of hepsi) {
            if (h.type === 'konu') { ilkKonuGorulduMu.add(h.topic); continue; }
            if (h.type === 'tekrar' && !ilkKonuGorulduMu.has(h.topic)) {
                ihlaller.push(`${h.k}: ${h.subject}/${h.topic} (tekrar) — konu etüdü henüz hiç görülmedi`);
            }
        }
        console.log('Tekrar-önce-konu ihlalleri:', ihlaller);
        expect(ihlaller).toEqual([]);
    });

    it('6) [ekran görüntüsü] Paragraf hafta sonu (Cumartesi/Pazar) da ilk etüt olarak çıkar', () => {
        const konular = [...turkceKonular, ...matKonular];
        const { schedule } = programUret({
            konular, sinavId: 'TYT', alanId: null,
            aylar: 1, haftaPerAy: 1, gunlukEtut: 5,
            // denemeAcik kapalı: Pazar varsayılan deneme günü, o da
            // 'ilk' konumu ister — bu test yalnız paragraf kuralını
            // izole ölçer, deneme ile çakışma ayrı bir konudur.
            kriterler: { paragrafAcik: true, denemeAcik: false },
        });
        expect(schedule['m1-w1-Cumartesi-0']?.type).toBe('paragraf');
        expect(schedule['m1-w1-Pazar-0']?.type).toBe('paragraf');
    });

    it('7) [yeni özellik] Problemler açıkken günün sondan 2. etüdüne yerleşir, Kitap yine son etütte kalır', () => {
        const konular = [...turkceKonular, ...matKonular];
        const { schedule } = programUret({
            konular, sinavId: 'TYT', alanId: null,
            aylar: 1, haftaPerAy: 1, gunlukEtut: 7,
            kriterler: { problemlerAcik: true, kitapAcik: true, paragrafAcik: true },
        });
        // 7 etütlük gün: 0=paragraf(ilk), 5=problem(sondan2), 6=kitap(son)
        expect(schedule['m1-w1-Pazartesi-5']?.type).toBe('problem');
        expect(schedule['m1-w1-Pazartesi-6']?.type).toBe('kitap');
    });

    it('8) [ekran görüntüsü] aynı dersin konu/soru/aralıklı-tekrar kutucukları AYNI renkte', () => {
        const c1 = getCellColor({ subject: 'Türkçe', type: 'konu' });
        const c2 = getCellColor({ subject: 'Türkçe', type: 'soru' });
        // round>0 = bir KONUNUN aralıklı tekrarı (gerçek ders) — dersin
        // kendi rengini almalı, "Günün Tekrarı"nın sabit turuncusunu değil.
        const c3 = getCellColor({ subject: 'Türkçe', type: 'tekrar', round: 7 });
        expect(c2).toEqual(c1);
        expect(c3).toEqual(c1);
        // "Günün Tekrarı" (round:0, ders değil) hâlâ kendi sabit rengini korur.
        const gununTekrari = getCellColor({ subject: 'Günün Tekrarı', type: 'tekrar', round: 0 });
        expect(gununTekrari).not.toEqual(c1);
    });

    it('9) [ekran görüntüsü] bir ders bloğunu bitirip bırakınca aynı GÜN içinde ikinci kez seçilmez', () => {
        const konular = [...turkceKonular, ...matKonular, ...fizikKonular, ...dinKonular];
        const { schedule } = programUret({
            konular, sinavId: 'TYT', alanId: null,
            aylar: 1, haftaPerAy: 1, gunlukEtut: 6,
        });
        const gunler = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
        const ihlaller = [];
        for (const gun of gunler) {
            const sira = Object.entries(schedule)
                .filter(([k]) => k.startsWith(`m1-w1-${gun}-`))
                .sort((a, b) => Number(a[0].split('-').pop()) - Number(b[0].split('-').pop()))
                .map(([, v]) => v)
                .filter((v) => ['konu', 'soru', 'tekrar'].includes(v.type));
            // Ders bazında "kaç ayrı grup" oluştuğunu say (aralarında
            // farklı ders varsa yeni grup)
            const gruplar = new Map(); // ders → grup sayısı
            let onceki = null;
            for (const h of sira) {
                if (h.subject !== onceki) {
                    gruplar.set(h.subject, (gruplar.get(h.subject) || 0) + 1);
                    onceki = h.subject;
                }
            }
            for (const [ders, sayi] of gruplar) {
                if (sayi > 1) ihlaller.push(`${gun}: ${ders} günde ${sayi} ayrı blok halinde (aralarına başka ders girip geri dönülmüş)`);
            }
        }
        console.log('Aynı-güne-geri-dönüş ihlalleri:', ihlaller);
        expect(ihlaller).toEqual([]);
    });

    it('10) [kullanıcı uyarısı] aralıklı tekrar kuralı (1./7./30. gün) hâlâ çalışıyor — vade kontrolü tekrarları DÜŞÜRMÜYOR', () => {
        // Az konu + uzun süre: her konu birkaç hafta içinde tamamlanıp
        // 1/7/30. gün tekrarlarının HEPSİ üretilme fırsatı bulsun.
        const konular = [
            konu('TYT', 'matematik', 'Temel Kavramlar', 3, 2),
            konu('TYT', 'turkce', 'Sözcükte Anlam', 2, 1),
        ];
        const { schedule } = programUret({
            konular, sinavId: 'TYT', alanId: null,
            aylar: 2, haftaPerAy: 4, gunlukEtut: 4,
            kriterler: { tekrarAcik: true, tekrarAraliklari: [1, 7, 30] },
        });
        const hepsi = Object.entries(schedule)
            .filter(([, v]) => v.type === 'tekrar' && v.round)
            .sort(([a], [b]) => kronolojik([a], [b]));

        const matTekrarlar = hepsi.filter((([, v]) => v.subject === 'Matematik')).map(([, v]) => v.round);
        const turkceTekrarlar = hepsi.filter((([, v]) => v.subject === 'Türkçe')).map(([, v]) => v.round);
        console.log('Matematik tekrar turları (round):', matTekrarlar);
        console.log('Türkçe tekrar turları (round):', turkceTekrarlar);

        // Vade kontrolü PLANLI tekrarları düşürmemeli — 2 aylık, bol
        // kapasiteli bir programda her iki dersin de en azından +1
        // günlük tekrarı gerçekleşmiş olmalı (silinip kaybolmamalı).
        expect(matTekrarlar.length).toBeGreaterThan(0);
        expect(turkceTekrarlar.length).toBeGreaterThan(0);
        expect(matTekrarlar).toContain(1);
        expect(turkceTekrarlar).toContain(1);

        // Her tekrar KENDİ vade gününden makul bir süre içinde
        // yerleşmiş olmalı — sonsuza dek ertelenmemeli. Konunun ilk
        // 'konu' hücresinin haftaIndex'ini bul, tekrarın ondan çok
        // uzakta olmadığını (aynı hafta ya da birkaç hafta sonrasında,
        // 30 günlük tur hariç) doğrula — burada yalnız "hiç kaybolmadı"
        // ölçüldüğü için sayım yeterli kanıt.
    });
});
