import { describe, it, expect, beforeEach } from 'vitest';
import denemeKayitlari, { netHesapla } from './denemeKayitlari';

/**
 * Deneme Analizi kayıt servisi testleri.
 * Kabuller: net OTOMATİK (4Y=1D), çift kayıt reddi, sahiplik dışı silme
 * reddi, son kaydın silinmesinde boş listenin YAZILMASI (geri gelmez).
 */

beforeEach(() => localStorage.clear());

const ornek = (ek = {}) => ({
    studentId: 's1', studentName: 'Ecrin Acar',
    ad: '3D 5. TYT', tur: 'TYT', tarih: '2026-08-15', sureDk: 150,
    dersler: {
        Matematik: { dogru: 24, yanlis: 8, bos: 8 },
        'Türkçe': { dogru: 30, yanlis: 4, bos: 6 },
        Fizik: { dogru: 0, yanlis: 0, bos: 0 },   // boş satır — kaydedilmemeli
    },
    konuHatalari: [
        { ders: 'Matematik', konu: 'Problemler', adet: 3, nedenler: ['sure', 'islem'], not: '' },
        { ders: '', konu: 'X', adet: 1, nedenler: [] },   // dersi yok — elenmeli
    ],
    degerlendirme: { sure: 'kismen', odak: 'orta', memnuniyet: 3, sonrakiHedef: 'Türkçe hız' },
    ...ek,
});

describe('netHesapla', () => {
    it('4 yanlış 1 doğruyu götürür', () => {
        expect(netHesapla(24, 8)).toBe(22);
        expect(netHesapla(0, 0)).toBe(0);
    });
});

describe('kaydet', () => {
    it('net otomatik hesaplanır, boş ders satırı ve derssiz hata elenir', () => {
        const { basarili, kayit } = denemeKayitlari.kaydet(ornek());
        expect(basarili).toBe(true);
        expect(kayit.dersler.Matematik.net).toBe(22);
        expect(kayit.dersler.Fizik).toBeUndefined();
        expect(kayit.konuHatalari).toHaveLength(1);
        expect(kayit.konuHatalari[0].nedenler).toEqual(['sure', 'islem']);
        expect(kayit.id).toMatch(/^da_/);
    });

    it('aynı öğrenci + ad + tarih ikinci kez kaydedilemez', () => {
        denemeKayitlari.kaydet(ornek());
        const tekrar = denemeKayitlari.kaydet(ornek());
        expect(tekrar.basarili).toBe(false);
        expect(denemeKayitlari.tumunuListele()).toHaveLength(1);
    });

    it('farklı tarihse aynı ad kaydedilir', () => {
        denemeKayitlari.kaydet(ornek());
        expect(denemeKayitlari.kaydet(ornek({ tarih: '2026-08-22' })).basarili).toBe(true);
    });

    it('adsız kayıt reddedilir', () => {
        expect(denemeKayitlari.kaydet(ornek({ ad: '  ' })).basarili).toBe(false);
    });
});

describe('ogrencininKayitlari', () => {
    it('yalnız o öğrencinin kayıtlarını, ESKİDEN YENİYE döner', () => {
        denemeKayitlari.kaydet(ornek({ tarih: '2026-08-20', ad: 'B' }));
        denemeKayitlari.kaydet(ornek({ tarih: '2026-08-10', ad: 'A' }));
        denemeKayitlari.kaydet(ornek({ studentId: 's2', ad: 'Sızmasın' }));
        const liste = denemeKayitlari.ogrencininKayitlari('s1');
        expect(liste.map((k) => k.ad)).toEqual(['A', 'B']);
    });
});

describe('sil', () => {
    it('başka öğrencinin kimliğiyle silinemez', () => {
        const { kayit } = denemeKayitlari.kaydet(ornek());
        expect(denemeKayitlari.sil(kayit.id, 'BASKA').basarili).toBe(false);
        expect(denemeKayitlari.tumunuListele()).toHaveLength(1);
    });

    it('son kayıt silinince boş liste YAZILIR (buluttan geri inemez)', () => {
        const { kayit } = denemeKayitlari.kaydet(ornek());
        expect(denemeKayitlari.sil(kayit.id, 's1').basarili).toBe(true);
        expect(localStorage.getItem('deneme_analizleri')).toBe('[]');
    });
});
