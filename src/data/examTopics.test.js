/**
 * KONU KATALOĞU BÜTÜNLÜK TESTLERİ
 *
 * Katalog elle yazılıyor; bu testler elle yazımın sessizce bozabileceği
 * şeyleri yakalar: iki sınavın aynı nesneyi paylaşması, ağırlıkların
 * bölümün resmî soru sayısıyla bağını koparması, boş ders/konu.
 */
import { describe, it, expect } from 'vitest';
import {
    SINAVLAR, SINAV_LISTESI, tumKonular, DERS_ADLARI, alanListesi, ogrencininBolumleri,
} from './examTopics';
import { bolumDersSorulari, bolumOturumu, OTURUMLAR, soruSuresiDk } from './sinavYapisi';

/** Bölümün ağırlık toplamı. */
const agirlikToplami = (bolum) =>
    Object.values(bolum.dersler)
        .reduce((t, konular) => t + konular.reduce((s, x) => s + x.a, 0), 0);

const tumBolumler = SINAV_LISTESI.flatMap((s) => s.bolumler.map((b) => ({ sinav: s, bolum: b })));

describe('katalog yapısı', () => {
    it('dört sınav da tanımlı ve bölümlü', () => {
        expect(Object.keys(SINAVLAR).sort()).toEqual(['AGS', 'KPSS', 'LGS', 'YKS']);
        SINAV_LISTESI.forEach((s) => expect(s.bolumler.length).toBeGreaterThan(0));
    });

    it('hiçbir bölüm boş ders, hiçbir ders boş konu listesi taşımaz', () => {
        tumBolumler.forEach(({ sinav, bolum }) => {
            const dersler = Object.entries(bolum.dersler);
            expect(dersler.length, `${sinav.id}:${bolum.id} dersi yok`).toBeGreaterThan(0);
            dersler.forEach(([ders, konular]) => {
                expect(konular.length, `${sinav.id}:${bolum.id}:${ders} konusuz`).toBeGreaterThan(0);
            });
        });
    });

    it('her konu ad/ağırlık/zorluk taşır ve zorluk 1-3 arası', () => {
        tumBolumler.forEach(({ sinav, bolum }) => {
            Object.entries(bolum.dersler).forEach(([ders, konular]) => {
                konular.forEach((t) => {
                    const yer = `${sinav.id}:${bolum.id}:${ders}:${t.ad}`;
                    expect(String(t.ad || '').trim(), yer).not.toBe('');
                    expect(t.a, yer).toBeGreaterThan(0);
                    expect([1, 2, 3], yer).toContain(t.z);
                });
            });
        });
    });

    it('kullanılan her ders anahtarının okunur adı var', () => {
        tumBolumler.forEach(({ bolum }) => {
            Object.keys(bolum.dersler).forEach((ders) => {
                expect(DERS_ADLARI[ders], `${ders} için ad yok`).toBeTruthy();
            });
        });
    });

    it('bir bölüm içinde aynı konu adı iki kez geçmez', () => {
        tumBolumler.forEach(({ sinav, bolum }) => {
            Object.entries(bolum.dersler).forEach(([ders, konular]) => {
                const adlar = konular.map((t) => t.ad);
                expect(new Set(adlar).size, `${sinav.id}:${bolum.id}:${ders} tekrarlı konu`)
                    .toBe(adlar.length);
            });
        });
    });
});

describe('sınavlar arası nesne paylaşımı', () => {
    /**
     * KPSS ve AGS'nin Eğitim Bilimleri havuzu aynı kaynaktan gelir ama
     * soru sayıları farklıdır (80 ↔ 30). Aynı nesneyi paylaşırlarsa
     * ağırlıklar yalnızca birinde doğru olur ve birine yapılan değişiklik
     * diğerini sessizce bozar.
     */
    it('KPSS ve AGS Eğitim Bilimleri ayrı nesnelerdir', () => {
        const kpss = SINAVLAR.KPSS.bolumler.find((b) => b.id === 'EB');
        const ags = SINAVLAR.AGS.bolumler.find((b) => b.id === 'EB');

        expect(kpss.dersler).not.toBe(ags.dersler);
        expect(kpss.dersler.gelisim).not.toBe(ags.dersler.gelisim);
        expect(kpss.dersler.gelisim[0]).not.toBe(ags.dersler.gelisim[0]);
    });

    it('AGS Eğitim Bilimleri ağırlıkları KPSS\'ninkinden düşüktür (30 < 80 soru)', () => {
        const kpss = SINAVLAR.KPSS.bolumler.find((b) => b.id === 'EB');
        const ags = SINAVLAR.AGS.bolumler.find((b) => b.id === 'EB');
        expect(agirlikToplami(ags)).toBeLessThan(agirlikToplami(kpss));
    });

    it('ölçekleme konular arasındaki ORANI korur', () => {
        const kpss = SINAVLAR.KPSS.bolumler.find((b) => b.id === 'EB').dersler.gelisim;
        const ags = SINAVLAR.AGS.bolumler.find((b) => b.id === 'EB').dersler.gelisim;

        // En ağır konu her iki sınavda da aynı konu olmalı
        const enAgir = (liste) => liste.reduce((a, b) => (b.a > a.a ? b : a)).ad;
        expect(enAgir(ags)).toBe(enAgir(kpss));
        // Konu adları ve zorluklar aynı kalmalı — yalnızca ağırlık ölçeklenir
        expect(ags.map((t) => t.ad)).toEqual(kpss.map((t) => t.ad));
        expect(ags.map((t) => t.z)).toEqual(kpss.map((t) => t.z));
    });
});

describe('tumKonular', () => {
    it('her sınav için konu döner ve kayıtlar eksiksizdir', () => {
        SINAV_LISTESI.forEach((s) => {
            const liste = tumKonular(s.id);
            expect(liste.length, `${s.id} konusuz`).toBeGreaterThan(0);
            liste.forEach((t) => {
                expect(t.topicId).toBeTruthy();
                expect(t.konu).toBeTruthy();
                expect(t.hedef).toBeGreaterThan(0);
            });
        });
    });

    it('bilinmeyen sınav için boş liste döner', () => {
        expect(tumKonular('YOKSINAV')).toEqual([]);
    });
});

/**
 * KPSS ALAN BİLGİSİ — 2026 KPSS Lisans Kılavuzu TABLO-1 ve s.16.
 * Sayılar resmîdir; test bunların sessizce kaymasını engeller.
 */
describe('KPSS Alan Bilgisi', () => {
    const AB = ['HUKUK', 'IKTISAT', 'ISLETME', 'MALIYE', 'MUHASEBE',
        'CEKO', 'ISTATISTIK', 'KAMU_YONETIMI', 'ULUSLARARASI'];

    const bolum = (id) => SINAVLAR.KPSS.bolumler.find((b) => b.id === id);

    it('dokuz Alan Bilgisi testinin tamamı tanımlı', () => {
        AB.forEach((id) => {
            expect(bolum(id), `${id} bölümü yok`).toBeTruthy();
            expect(bolum(id).alanBilgisi).toBe(true);
        });
    });

    it('her test 40 sorudur ve konu ağırlıkları 40\'a oturur', () => {
        AB.forEach((id) => {
            const b = bolum(id);
            expect(b.soru, id).toBe(40);
            expect(agirlikToplami(b), `${id} ağırlık toplamı`).toBe(40);
        });
    });

    it('her testin soru sayısı tablosu katalogla uyuşur', () => {
        AB.forEach((id) => {
            const tablo = bolumDersSorulari('KPSS', id);
            expect(tablo, `${id} soru tablosu yok`).toBeTruthy();
            // Tablo anahtarları katalogdaki ders anahtarlarıyla birebir
            expect(Object.keys(tablo).sort()).toEqual(Object.keys(bolum(id).dersler).sort());
            expect(Object.values(tablo).reduce((a, b) => a + b, 0)).toBe(40);
        });
    });

    it('süre resmî kaynaktan gelir — İstatistik 60 dk, diğerleri 50 dk', () => {
        AB.filter((id) => id !== 'ISTATISTIK').forEach((id) => {
            expect(OTURUMLAR[bolumOturumu('KPSS', id)].sureDk, id).toBe(50);
        });
        expect(OTURUMLAR[bolumOturumu('KPSS', 'ISTATISTIK')].sureDk).toBe(60);
    });

    it('soru çözme süresi resmî süreyle tutarlıdır (süre / 40 soru)', () => {
        AB.forEach((id) => {
            const ders = Object.keys(bolum(id).dersler)[0];
            const beklenen = OTURUMLAR[bolumOturumu('KPSS', id)].sureDk / 40;
            expect(soruSuresiDk(id, ders, 'KPSS'), id).toBeCloseTo(beklenen, 5);
        });
    });

    it('her Alan Bilgisi testi için bir alan seçeneği var (GY + GK + test)', () => {
        const alanlar = alanListesi('KPSS');
        AB.forEach((id) => {
            const alan = alanlar.find((a) => a.id === `A_${id}`);
            expect(alan, `A_${id} alanı yok`).toBeTruthy();
            expect(alan.bolumler).toEqual(['GY', 'GK', id]);
        });
    });

    it('alanı seçilmemiş KPSS öğrencisine Alan Bilgisi testleri açılmaz', () => {
        const bolumler = ogrencininBolumleri({ examType: 'KPSS' }, 'KPSS');
        const idler = bolumler.map((b) => b.id);
        expect(idler).toEqual(['GY', 'GK', 'EB']);   // EB eski veri için duruyor
        AB.forEach((id) => expect(idler).not.toContain(id));
    });

    it('alan seçilince yalnızca o testin bölümü eklenir', () => {
        const idler = ogrencininBolumleri({ examType: 'KPSS', alan: 'Maliye' }, 'KPSS')
            .map((b) => b.id);
        expect(idler).toEqual(['GY', 'GK', 'MALIYE']);
    });

    it('Muhasebe\'de Genel Muhasebe ÖSYM\'nin %70\'ini taşır', () => {
        const gm = bolum('MUHASEBE').dersler.muhasebe.find((t) => t.ad === 'Genel Muhasebe');
        expect(gm.a).toBe(28);   // %70 × 40
    });
});

describe('KPSS Eğitim Bilimleri devre dışı işareti', () => {
    /**
     * 2026 KPSS Lisans Kılavuzu'nda Eğitim Bilimleri oturumu yok;
     * içerik AGS'ye taşındı. Bölüm SİLİNMEZ (eski ilerleme verisi
     * duruyor) ama devre dışı olduğu işaretlenir.
     */
    it('bölüm duruyor ama devreDisi işaretli', () => {
        const eb = SINAVLAR.KPSS.bolumler.find((b) => b.id === 'EB');
        expect(eb).toBeTruthy();
        expect(eb.devreDisi).toBe(true);
        expect(Object.keys(eb.dersler).length).toBe(5);
    });

    it('AGS Eğitim Bilimleri devre dışı DEĞİL — geçerli sınav', () => {
        const eb = SINAVLAR.AGS.bolumler.find((b) => b.id === 'EB');
        expect(eb.devreDisi).toBeUndefined();
        expect(eb.soru).toBe(30);
    });
});
