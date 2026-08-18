import { describe, it, expect, beforeEach } from 'vitest';
import depo from './veriDeposu';

/**
 * Veri deposu testleri.
 *
 * Buradaki her senaryo, bu üründe GERÇEKTEN yaşanmış bir hatadan
 * türetildi; hiçbiri varsayımsal değil.
 */

beforeEach(() => {
    localStorage.clear();
});

describe('bozuk veri uygulamayı çökertmez', () => {
    it('geçersiz JSON varsayılana döner', () => {
        localStorage.setItem('coach_students', '{bozuk json');
        expect(depo.ogrencileriGetir()).toEqual([]);
    });

    it('"undefined" metni varsayılana döner', () => {
        localStorage.setItem('coach_students', 'undefined');
        expect(depo.ogrencileriGetir()).toEqual([]);
    });

    it('dizi beklenen yerde nesne varsa boş dizi döner', () => {
        localStorage.setItem('coach_students', '{"a":1}');
        expect(depo.ogrencileriGetir()).toEqual([]);
    });
});

describe('öğrenci kayıtları', () => {
    it('ekler ve kimliğe göre bulur', () => {
        depo.ogrenciKaydet({ id: 1, name: 'Ali' });
        expect(depo.ogrenciGetir(1)).toMatchObject({ name: 'Ali' });
    });

    it('aynı kimlikle ikinci kez kaydetmek KOPYA OLUŞTURMAZ', () => {
        // Bağlı davet akışında öğrencinin çoğalması en büyük risklerden biriydi
        depo.ogrenciKaydet({ id: 1, name: 'Ali' });
        depo.ogrenciKaydet({ id: 1, name: 'Ali Veli' });
        expect(depo.ogrencileriGetir()).toHaveLength(1);
        expect(depo.ogrenciGetir(1).name).toBe('Ali Veli');
    });

    it('sayısal ve metin kimlik aynı kaydı gösterir', () => {
        // Elle eklenen öğrencilerin kimliği sayı, davetle gelenlerin metin
        depo.ogrenciKaydet({ id: 1786990973495, name: 'Ecrin' });
        expect(depo.ogrenciGetir('1786990973495')).not.toBeNull();
    });

    it('alan güncellemesi diğer alanları KORUR', () => {
        depo.ogrenciKaydet({ id: 1, name: 'Ali', target: 'Tıp', grade: '11' });
        depo.ogrenciAlanGuncelle(1, { schoolNumber: '790' });
        const o = depo.ogrenciGetir(1);
        expect(o.target).toBe('Tıp');
        expect(o.grade).toBe('11');
        expect(o.schoolNumber).toBe('790');
    });

    it('olmayan kaydı güncellemek sessizce başarısız olmaz', () => {
        const r = depo.ogrenciAlanGuncelle(999, { name: 'Yok' });
        expect(r.basarili).toBe(false);
    });

    it('siler', () => {
        depo.ogrenciKaydet({ id: 1, name: 'Ali' });
        depo.ogrenciSil(1);
        expect(depo.ogrencileriGetir()).toHaveLength(0);
    });
});

describe('kayıt düzeyinde güncelleme (çakışma stratejisi)', () => {
    it('bir kaydı değiştirmek diğerlerine dokunmaz', () => {
        depo.ogrenciKaydet({ id: 1, name: 'Ali', not: 'a' });
        depo.ogrenciKaydet({ id: 2, name: 'Veli', not: 'b' });
        depo.ogrenciAlanGuncelle(1, { not: 'guncel' });
        expect(depo.ogrenciGetir(2).not).toBe('b');
    });
});

describe('görevler — iki farklı biçim', () => {
    it('nesne biçimini okur', () => {
        localStorage.setItem('student_tasks', JSON.stringify({ 5: [{ id: 'g1' }] }));
        expect(depo.gorevleriGetir(5)).toHaveLength(1);
    });

    it('dizi biçimini okur', () => {
        // Bu biçim varsayımı yüzünden tamamlanan görevler kayboluyordu
        localStorage.setItem('student_tasks', JSON.stringify([
            { id: 'g1', studentId: 5 }, { id: 'g2', studentId: 9 },
        ]));
        expect(depo.gorevleriGetir(5)).toHaveLength(1);
        expect(depo.gorevleriGetir(9)).toHaveLength(1);
    });

    it('nesne biçiminde kaydetmek başka öğrencinin görevlerini silmez', () => {
        localStorage.setItem('student_tasks', JSON.stringify({ 5: [{ id: 'a' }], 9: [{ id: 'b' }] }));
        depo.gorevleriKaydet(5, [{ id: 'a', done: true }]);
        expect(depo.gorevleriGetir(9)).toHaveLength(1);
    });

    it('dizi biçiminde kaydetmek başka öğrencinin görevlerini silmez', () => {
        localStorage.setItem('student_tasks', JSON.stringify([
            { id: 'a', studentId: 5 }, { id: 'b', studentId: 9 },
        ]));
        depo.gorevleriKaydet(5, [{ id: 'a', studentId: 5, done: true }]);
        expect(depo.gorevleriGetir(9)).toHaveLength(1);
    });
});

describe('mesajlar', () => {
    it('öğrenci başına ayrı tutulur', () => {
        depo.mesajEkle(1, { text: 'merhaba' });
        depo.mesajEkle(2, { text: 'selam' });
        expect(depo.mesajlariGetir(1)).toHaveLength(1);
        expect(depo.mesajlariGetir(2)[0].text).toBe('selam');
    });

    it('mesaj eklemek öncekileri silmez', () => {
        depo.mesajEkle(1, { text: 'bir' });
        depo.mesajEkle(1, { text: 'iki' });
        expect(depo.mesajlariGetir(1)).toHaveLength(2);
    });
});

describe('yazma arayüzü haberdar eder', () => {
    it('storage olayı yayınlanır', () => {
        let tetiklendi = null;
        const bitir = depo.izle('coach_students', (v) => { tetiklendi = v; });
        depo.ogrenciKaydet({ id: 1, name: 'Ali' });
        bitir();
        expect(tetiklendi).toHaveLength(1);
    });
});
