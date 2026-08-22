import { describe, it, expect, beforeEach } from 'vitest';
import pdrHavuz from './pdrOgrencileri';
import { listeOku } from './veriDeposu';

/**
 * PDR öğrenci havuzu testleri (V1.1).
 * Kritik kabuller: koçluk listesiyle karışmaz (ayrı anahtar + pdr_ önekli
 * kimlik), aynı öğrenci iki kez eklenmez, silme boş listeyi de yazar.
 */

beforeEach(() => {
    localStorage.clear();
});

describe('pdrOgrencileri', () => {
    it('eklenen kayıt pdr_ önekli kimlik alır ve coach_students anahtarına DOKUNMAZ', () => {
        localStorage.setItem('coach_students', JSON.stringify([{ id: 'student_790', name: 'Koçluk Öğrencisi' }]));
        const sonuc = pdrHavuz.ekle({ name: 'Ayşe Yılmaz', schoolNumber: '245', grade: '11', section: 'A' });
        expect(sonuc.basarili).toBe(true);
        expect(sonuc.kayit.id).toMatch(/^pdr_/);
        // koçluk listesi değişmedi
        expect(JSON.parse(localStorage.getItem('coach_students'))).toHaveLength(1);
        expect(listeOku('pdr_students')).toHaveLength(1);
    });

    it('adsız kayıt reddedilir', () => {
        expect(pdrHavuz.ekle({ name: '  ' }).basarili).toBe(false);
    });

    it('aynı okul numarası ikinci kez eklenmez', () => {
        pdrHavuz.ekle({ name: 'Ayşe Yılmaz', schoolNumber: '245' });
        const tekrar = pdrHavuz.ekle({ name: 'Ayşe Y.', schoolNumber: '245' });
        expect(tekrar.basarili).toBe(false);
        expect(listeOku('pdr_students')).toHaveLength(1);
    });

    it('numarasız kayıtta ad+sınıf ikilisi çift kaydı engeller', () => {
        pdrHavuz.ekle({ name: 'Mehmet Demir', grade: '10' });
        expect(pdrHavuz.ekle({ name: 'mehmet demir', grade: '10' }).basarili).toBe(false);
        expect(pdrHavuz.ekle({ name: 'Mehmet Demir', grade: '11' }).basarili).toBe(true);
    });

    it('toplu yükleme satırları ayrıştırır, bozuk ve mükerrer satırları atlar', () => {
        const { eklenen, atlanan } = pdrHavuz.topluEkle(
            'Ayşe Yılmaz; 245; 11; A\n' +
            'Mehmet Demir\t246\t11\tA\n' +
            '; 300; 9\n' +               // adsız → atlanır
            'Ayşe Yılmaz; 245; 11; A\n'  // mükerrer → atlanır
        );
        expect(eklenen).toBe(2);
        expect(atlanan).toHaveLength(2);
        expect(listeOku('pdr_students')).toHaveLength(2);
    });

    it('silme kaydı kaldırır; SON kayıt silinince boş liste de YAZILIR (geri gelmez)', () => {
        const { kayit } = pdrHavuz.ekle({ name: 'Tek Öğrenci' });
        const sonuc = pdrHavuz.sil(kayit.id);
        expect(sonuc.basarili).toBe(true);
        // anahtar hâlâ mevcut ve boş liste — silinen kayıt buluttan geri inemez
        expect(localStorage.getItem('pdr_students')).toBe('[]');
    });

    it('olmayan kimlik silinmeye çalışılınca hata döner, liste bozulmaz', () => {
        pdrHavuz.ekle({ name: 'Kalan Öğrenci' });
        expect(pdrHavuz.sil('pdr_yok_boyle').basarili).toBe(false);
        expect(listeOku('pdr_students')).toHaveLength(1);
    });
});
