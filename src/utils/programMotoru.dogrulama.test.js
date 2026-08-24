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
        expect(oran).toBeLessThan(1.5);
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
});
