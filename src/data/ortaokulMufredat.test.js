/**
 * 5, 6 ve 7. SINIF MÜFREDATI testleri.
 *
 * Düzeltilen kusur: `ogrencininSinavi` 5–8. sınıfı LGS'ye yönlendiriyor,
 * LGS katalogunda ise yalnızca 8. sınıf konuları vardı. 5. sınıf öğrencisi
 * kendi müfredatı yerine 8. sınıf konu listesini görüyordu.
 */
import { describe, it, expect } from 'vitest';
import { ORTAOKUL_MUFREDAT, MUFREDAT_SINIFLARI, sinifBolumu } from './ortaokulMufredat';
import { ogrencininBolumleri, ogrencininSinavi, bolumBul, DERS_ADLARI } from './examTopics';
import { konuListesi, konuHaritasi } from '../services/topicProgressService';

const ogrenci = (sinif) => ({ id: 'x', grade: String(sinif) });

describe('ortaokul müfredatı verisi', () => {
    it('5, 6 ve 7. sınıf tanımlı', () => {
        expect(MUFREDAT_SINIFLARI).toEqual([5, 6, 7]);
        MUFREDAT_SINIFLARI.forEach((s) => expect(ORTAOKUL_MUFREDAT[s]).toBeTruthy());
    });

    it('her sınıfta altı dersin tamamı var ve hiçbiri boş değil', () => {
        const beklenen = ['turkce', 'matematik', 'fen', 'sosyal', 'ingilizce', 'din'];
        MUFREDAT_SINIFLARI.forEach((s) => {
            expect(Object.keys(ORTAOKUL_MUFREDAT[s]).sort()).toEqual([...beklenen].sort());
            beklenen.forEach((d) => {
                expect(ORTAOKUL_MUFREDAT[s][d].length, `${s}. sınıf ${d} boş`).toBeGreaterThan(0);
            });
        });
    });

    it('her konu geçerli ad, ağırlık ve zorluk taşır', () => {
        MUFREDAT_SINIFLARI.forEach((s) => {
            Object.entries(ORTAOKUL_MUFREDAT[s]).forEach(([ders, konular]) => {
                konular.forEach((t) => {
                    const yer = `${s}:${ders}:${t.ad}`;
                    expect(String(t.ad || '').trim(), yer).not.toBe('');
                    expect(t.a, yer).toBeGreaterThan(0);
                    expect([1, 2, 3], yer).toContain(t.z);
                });
            });
        });
    });

    it('kullanılan her ders anahtarının okunur adı var', () => {
        MUFREDAT_SINIFLARI.forEach((s) => {
            Object.keys(ORTAOKUL_MUFREDAT[s]).forEach((d) => {
                expect(DERS_ADLARI[d], `${d} için ad yok`).toBeTruthy();
            });
        });
    });

    it('sınıf bölümü katalog bölümüyle aynı biçimdedir', () => {
        const b = sinifBolumu(6);
        expect(b.id).toBe('SINIF_6');
        expect(b.ad).toBe('6. Sınıf Müfredatı');
        expect(b.sinavsiz).toBe(true);
        expect(Object.keys(b.dersler).length).toBe(6);
    });

    it('müfredatı olmayan sınıf için bölüm üretilmez', () => {
        expect(sinifBolumu(8)).toBeNull();
        expect(sinifBolumu(11)).toBeNull();
    });
});

describe('sınıf düzeyine göre yönlendirme', () => {
    it('5-8. sınıf LGS öğrencisidir', () => {
        [5, 6, 7, 8].forEach((s) => expect(ogrencininSinavi(ogrenci(s))).toBe('LGS'));
    });

    it('5, 6 ve 7. sınıf KENDİ müfredatını görür', () => {
        [5, 6, 7].forEach((s) => {
            const bolumler = ogrencininBolumleri(ogrenci(s));
            expect(bolumler.length, `${s}. sınıf`).toBe(1);
            expect(bolumler[0].id).toBe(`SINIF_${s}`);
        });
    });

    it('8. sınıf LGS sınav içeriğini görür — davranış değişmedi', () => {
        const bolumler = ogrencininBolumleri(ogrenci(8));
        expect(bolumler.map((b) => b.id).sort()).toEqual(['SAYISAL', 'SOZEL']);
    });

    it('5. sınıf artık 8. sınıf konularını almıyor', () => {
        const besinci = ogrencininBolumleri(ogrenci(5))[0];
        const adlar = Object.values(besinci.dersler).flat().map((t) => t.ad);
        // 8. sınıf LGS matematiğinin ayırt edici konuları
        expect(adlar).not.toContain('Üslü İfadeler');
        expect(adlar).not.toContain('Kareköklü İfadeler');
        // Kendi 5. sınıf konusu ise var
        expect(adlar).toContain('Kesirlerin Karşılaştırılması');
    });

    it('her sınıfın müfredatı diğerlerinden farklıdır', () => {
        const kume = (s) => new Set(
            Object.values(ogrencininBolumleri(ogrenci(s))[0].dersler).flat().map((t) => t.ad)
        );
        const b5 = kume(5), b6 = kume(6), b7 = kume(7);
        expect(b5).not.toEqual(b6);
        expect(b6).not.toEqual(b7);
        // Matematik konuları sınıflar arasında ayrışmalı
        const mat = (s) => ORTAOKUL_MUFREDAT[s].matematik.map((t) => t.ad);
        expect(mat(5).some((a) => mat(7).includes(a))).toBe(false);
    });
});

describe('sınıf bölümü konu takibine bağlanır', () => {
    it('bolumBul sınıf bölümünü çözer', () => {
        expect(bolumBul('LGS', 'SINIF_6')?.id).toBe('SINIF_6');
        expect(bolumBul('LGS', 'SOZEL')?.id).toBe('SOZEL');
        expect(bolumBul('LGS', 'YOK')).toBeNull();
    });

    it('konuListesi sınıf bölümünün derslerini döner', () => {
        const liste = konuListesi('LGS', 'SINIF_7');
        expect(Object.keys(liste).length).toBe(6);
        expect(liste.matematik.length).toBeGreaterThan(0);
    });

    it('konuHaritasi sınıf bölümü için durum üretir', () => {
        localStorage.clear();
        const { dersler, ozet } = konuHaritasi('ogr_test', 'LGS', undefined, 'SINIF_5');
        expect(ozet.bolumId).toBe('SINIF_5');
        expect(ozet.toplamKonu).toBeGreaterThan(0);
        expect(dersler.length).toBe(6);
        // Kimlik sınav bağlamını taşır
        expect(dersler[0].konular[0].topicId).toMatch(/^lgs:sinif-5:/);
    });
});
