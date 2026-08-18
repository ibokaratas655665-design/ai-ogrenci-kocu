import { describe, it, expect } from 'vitest';
import {
    ogrencininDenemeleri, dersOzeti, trendSerisi,
    gucluZayifAnalizi, konuHatalari, calismaOncelikleri, gunlukSeri,
} from './denemeAnalizi';

/**
 * Deneme analizi motoru testleri (V1.1).
 * Veri şekilleri gerçek sistemden alındı (v2_results_data / error_notebook
 * / study_log) — analiz uydurma metrik ÜRETMEMELİ, eksik veride boş dönmeli.
 */

const deneme = (student, gun, totalNet, subjects = {}, examType = 'TYT') => ({
    student, examType, totalNet,
    uploadedAt: new Date(2026, 0, gun).toISOString(),
    subjects,
});

describe('ogrencininDenemeleri', () => {
    const veri = [
        deneme('Ecrin Acar', 10, 62),
        deneme('ECRİN ACAR', 5, 55),      // büyük harf + Türkçe İ
        deneme('Başka Öğrenci', 7, 40),
    ];

    it('adı Türkçe harf ve büyük/küçük farkına rağmen eşler, ESKİDEN YENİYE sıralar', () => {
        const sonuc = ogrencininDenemeleri(veri, 'Ecrin Acar');
        expect(sonuc).toHaveLength(2);
        expect(sonuc[0].totalNet).toBe(55);
        expect(sonuc[1].totalNet).toBe(62);
    });

    it('başka öğrencinin denemesini sızdırmaz', () => {
        const sonuc = ogrencininDenemeleri(veri, 'Ecrin Acar');
        expect(sonuc.some((d) => d.student === 'Başka Öğrenci')).toBe(false);
    });

    it('ad boşsa boş döner (tüm listeyi döndürmez)', () => {
        expect(ogrencininDenemeleri(veri, '')).toEqual([]);
    });

    it('sınav türü süzgeci çalışır', () => {
        const karisik = [deneme('X Y', 1, 10, {}, 'TYT'), deneme('X Y', 2, 20, {}, 'AYT')];
        expect(ogrencininDenemeleri(karisik, 'X Y', 'AYT')).toHaveLength(1);
    });
});

describe('dersOzeti', () => {
    it('ders bazında son D/Y/B/net ve ortalama neti çıkarır', () => {
        const d = [
            deneme('A', 1, 30, { mat: { correct: 20, wrong: 8, blank: 12, net: 18 } }),
            deneme('A', 2, 40, { mat: { correct: 30, wrong: 4, blank: 6, net: 29 } }),
        ];
        const ozet = dersOzeti(d);
        expect(ozet).toHaveLength(1);
        expect(ozet[0].son).toMatchObject({ dogru: 30, yanlis: 4, bos: 6, net: 29 });
        expect(ozet[0].ortalamaNet).toBe(23.5);
    });

    it('subjects alanı olmayan denemede ders satırı UYDURMAZ', () => {
        expect(dersOzeti([deneme('A', 1, 50)])).toEqual([]);
    });
});

describe('gucluZayifAnalizi', () => {
    it('son yarı ortalaması artan dersi "gelişen", düşeni "gerileyen" sayar', () => {
        const d = [
            deneme('A', 1, 0, { mat: { net: 10 }, fizik: { net: 30 } }),
            deneme('A', 2, 0, { mat: { net: 12 }, fizik: { net: 28 } }),
            deneme('A', 3, 0, { mat: { net: 20 }, fizik: { net: 15 } }),
            deneme('A', 4, 0, { mat: { net: 22 }, fizik: { net: 13 } }),
        ];
        const g = gucluZayifAnalizi(d);
        expect(g.gelisen.map((x) => x.anahtar)).toContain('mat');
        expect(g.gerileyen.map((x) => x.anahtar)).toContain('fizik');
    });

    it('tek denemede gelişim iddiası yapmaz', () => {
        const g = gucluZayifAnalizi([deneme('A', 1, 0, { mat: { net: 10 } })]);
        expect(g.gelisen).toEqual([]);
        expect(g.gerileyen).toEqual([]);
    });
});

describe('konuHatalari', () => {
    it('aynı konudan 2+ hatayı "tekrar eden" olarak işaretler, tür dağılımını sayar', () => {
        const hatalar = [
            { subject: 'Matematik', topic: 'Türev', errorType: 'knowledge' },
            { subject: 'Matematik', topic: 'Türev', errorType: 'calculation' },
            { subject: 'Fizik', topic: 'Optik', errorType: 'knowledge' },
        ];
        const k = konuHatalari(hatalar);
        expect(k.tekrarEden).toHaveLength(1);
        expect(k.tekrarEden[0]).toMatchObject({ konu: 'Türev', sayi: 2 });
        expect(k.turDagilimi[0]).toEqual({ tur: 'knowledge', adet: 2 });
    });
});

describe('calismaOncelikleri', () => {
    it('gerileyen ders ve çözülmemiş konu hatalarını önceliğe çevirir', () => {
        const d = [
            deneme('A', 1, 0, { fizik: { net: 30 } }),
            deneme('A', 2, 0, { fizik: { net: 10 } }),
        ];
        const hatalar = [
            { subject: 'Kimya', topic: 'Mol', errorType: 'knowledge', mastered: false },
            { subject: 'Kimya', topic: 'Mol', errorType: 'knowledge', mastered: false },
        ];
        const o = calismaOncelikleri(d, hatalar);
        expect(o.some((x) => x.tur === 'gerileyen-ders')).toBe(true);
        expect(o.some((x) => x.baslik.includes('Mol'))).toBe(true);
    });

    it('veri yoksa boş döner — uydurma öneri yok', () => {
        expect(calismaOncelikleri([], [])).toEqual([]);
    });
});

describe('gunlukSeri', () => {
    it('soru kayıtlarını haftaya toplar, isabet oranını hesaplar', () => {
        const g = [
            { kind: 'soru', date: '2026-01-05', correct: 8, wrong: 2, blank: 0 },  // pazartesi
            { kind: 'soru', date: '2026-01-07', correct: 12, wrong: 8, blank: 0 }, // aynı hafta
            { kind: 'soru', date: '2026-01-12', correct: 5, wrong: 5, blank: 0 },  // sonraki hafta
            { kind: 'kitap', date: '2026-01-05', pages: 30 },                       // sayılmaz
        ];
        const seri = gunlukSeri(g);
        expect(seri).toHaveLength(2);
        expect(seri[0].cozulen).toBe(30);
        expect(seri[0].isabet).toBe(67);
        expect(seri[1].cozulen).toBe(10);
    });
});

describe('trendSerisi', () => {
    it('deneme sırası ve toplam net serisini üretir', () => {
        const seri = trendSerisi([deneme('A', 1, 40.5), deneme('A', 2, 44)]);
        expect(seri.map((s) => s.toplamNet)).toEqual([40.5, 44]);
        expect(seri[1].sira).toBe(2);
    });
});
