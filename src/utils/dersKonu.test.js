import { describe, it, expect } from 'vitest';
import { ogrencininDersleri, dersinKonulari } from './dersKonu';

/**
 * Ders → konu seçim testleri (V1.1).
 * Kural: öğrenci yalnızca ALANINA uygun dersleri görür; konu kutusu
 * yalnızca seçilen dersin müfredat konularını listeler.
 */

describe('ogrencininDersleri', () => {
    it('Sözel öğrencisi AYT Sayısal konularını görmez (TYT ortak Fen kalır — sistem mantığı)', () => {
        const sozel = ogrencininDersleri({ examType: 'YKS', alan: 'Sözel', grade: '12' });
        const adlar = sozel.map((d) => d.ad);
        // TYT herkese ortak: Fen dersleri LİSTEDE KALIR (TYT Fen 20 soru)
        expect(adlar.some((a) => /Tarih/.test(a))).toBe(true);
        // ama AYT Sayısal derinliği sızmamalı: Sözel'in Matematik'inde Türev yok
        const matKonular = dersinKonulari(sozel, 'Matematik').join();
        expect(matKonular).not.toMatch(/Türev|İntegral/);
        // Sayısal öğrencide ise var
        const sayisal = ogrencininDersleri({ examType: 'YKS', alan: 'Sayısal', grade: '12' });
        expect(dersinKonulari(sayisal, 'Matematik').join()).toMatch(/Türev/);
    });

    it('Sayısal öğrencisi Fizik görür', () => {
        const dersler = ogrencininDersleri({ examType: 'YKS', alan: 'Sayısal', grade: '12' });
        expect(dersler.some((d) => /Fizik/.test(d.ad))).toBe(true);
    });

    it('TYT ortak dersleri her alanda korunur (Türkçe + Matematik)', () => {
        for (const alan of ['Sayısal', 'Sözel', 'Eşit Ağırlık']) {
            const adlar = ogrencininDersleri({ examType: 'YKS', alan, grade: '12' }).map((d) => d.ad).join();
            expect(adlar).toMatch(/Türkçe/);
            expect(adlar).toMatch(/Matematik/);
        }
    });

    it('alan bilinmiyorsa boş dönmez (sınavın tüm bölümlerine genişler)', () => {
        const dersler = ogrencininDersleri({ grade: '11' });
        expect(dersler.length).toBeGreaterThan(0);
    });

    it('her ders konu listesi taşır', () => {
        const dersler = ogrencininDersleri({ examType: 'YKS', alan: 'Sayısal', grade: '12' });
        const mat = dersler.find((d) => d.ad === 'Matematik');
        expect(mat).toBeTruthy();
        expect(mat.konular.length).toBeGreaterThan(5);
    });
});

describe('dersinKonulari', () => {
    it('seçilen dersin konularını döner, bilinmeyen derste boş döner', () => {
        const dersler = ogrencininDersleri({ examType: 'YKS', alan: 'Sayısal', grade: '12' });
        const matKonular = dersinKonulari(dersler, 'Matematik');
        expect(matKonular.length).toBeGreaterThan(0);
        expect(dersinKonulari(dersler, 'Olmayan Ders')).toEqual([]);
    });

    it('başka dersin konusunu sızdırmaz', () => {
        const dersler = ogrencininDersleri({ examType: 'YKS', alan: 'Sayısal', grade: '12' });
        const turkce = dersinKonulari(dersler, 'Türkçe');
        expect(turkce.join()).not.toMatch(/Türev|İntegral/);
    });
});
