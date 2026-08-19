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

/* ── Deneme Analizi sistemi ekleri ─────────────────────────── */
import { birlesikDenemeler, nedenTrendi, sureSerisi, kocOzeti } from './denemeAnalizi';

const manuel = (ad, tarih, dersler = {}, konuHatalari = [], sureDk = null) => ({
    id: 'da_' + ad, studentId: 's1', ad, tur: 'TYT', tarih, sureDk,
    dersler, konuHatalari, olusturma: tarih + 'T10:00:00.000Z',
});

describe('birlesikDenemeler', () => {
    it('koç (v2) ve öğrenci kayıtlarını tarihe göre tek çizgide birleştirir', () => {
        const v2 = [deneme('Ecrin Acar', 10, 50)];
        const man = [manuel('Kendi Denemem', '2026-01-05', { Matematik: { net: 20 } })];
        const b = birlesikDenemeler(v2, man, 'Ecrin Acar');
        expect(b).toHaveLength(2);
        expect(b[0].kaynak).toBe('ogrenci');   // 5 Oca < 10 Oca
        expect(b[1].kaynak).toBe('koc');
        expect(b[0].totalNet).toBe(20);        // ders netlerinden otomatik toplam
    });

    it('tür süzgeci öğrenci kayıtlarına da uygulanır', () => {
        const man = [manuel('A', '2026-01-05'), { ...manuel('B', '2026-01-06'), tur: 'AYT' }];
        expect(birlesikDenemeler([], man, 'X', 'AYT')).toHaveLength(1);
    });
});

describe('nedenTrendi', () => {
    it('nedenlerin deneme deneme değişimini ve toplamını çıkarır', () => {
        const man = [
            manuel('D1', '2026-01-05', {}, [{ ders: 'Mat', konu: 'X', adet: 5, nedenler: ['dikkat'] }]),
            manuel('D2', '2026-01-12', {}, [{ ders: 'Mat', konu: 'X', adet: 3, nedenler: ['dikkat'] }]),
            manuel('D3', '2026-01-19', {}, [{ ders: 'Mat', konu: 'X', adet: 1, nedenler: ['dikkat', 'sure'] }]),
        ];
        const t = nedenTrendi(man);
        expect(t.seriler.map((s) => s.dikkat)).toEqual([5, 3, 1]);   // azalış görünür
        expect(t.toplamlar[0]).toEqual({ neden: 'dikkat', adet: 9 });
    });

    it('neden girilmemişse trend uydurmaz', () => {
        const t = nedenTrendi([manuel('D1', '2026-01-05')]);
        expect(t.toplamlar).toEqual([]);
    });
});

describe('sureSerisi', () => {
    it('süre girilen denemelerden soru başına saniye hesaplar', () => {
        const man = [manuel('D1', '2026-01-05', { Matematik: { dogru: 20, yanlis: 10, bos: 10, net: 17.5 } }, [], 80)];
        const s = sureSerisi(man);
        expect(s).toHaveLength(1);
        expect(s[0].soruBasinaSn).toBe(120);   // 80dk*60 / 40 soru
    });

    it('süresiz kayıtları seriye almaz', () => {
        expect(sureSerisi([manuel('D1', '2026-01-05')])).toEqual([]);
    });
});

describe('kocOzeti', () => {
    it('en sık neden ve tekrar eden konuyu mevcut veriden çıkarır', () => {
        const man = [
            manuel('D1', '2026-01-05', {}, [{ ders: 'Mat', konu: 'Problemler', adet: 2, nedenler: ['bilgi'] }]),
            manuel('D2', '2026-01-12', {}, [{ ders: 'Mat', konu: 'Problemler', adet: 1, nedenler: ['bilgi'] }]),
        ];
        const b = birlesikDenemeler([], man, 'X');
        const o = kocOzeti(b, man);
        expect(o.find((x) => x.tur === 'neden')?.deger).toBe('bilgi');
        expect(o.find((x) => x.tur === 'tekrar-konu')?.deger).toBe('Mat · Problemler');
        expect(o.find((x) => x.tur === 'takip')).toBeTruthy();
    });
});

import { hataTrendi, gunlukDersDagilimi } from './denemeAnalizi';

describe('hataTrendi', () => {
    it('hataları haftaya toplar, azalış görünür', () => {
        const h = [
            { createdAt: '2026-01-05', mastered: false },
            { createdAt: '2026-01-06', mastered: true },
            { createdAt: '2026-01-13', mastered: false },
        ];
        const t = hataTrendi(h);
        expect(t.map((x) => x.adet)).toEqual([2, 1]);
        expect(t[0].cozulen).toBe(1);
    });
});

describe('gunlukDersDagilimi', () => {
    it('ders başına toplar, isabet hesaplar, kitap kayıtlarını saymaz', () => {
        const g = [
            { kind: 'soru', subject: 'Matematik', correct: 16, wrong: 4, blank: 0 },
            { kind: 'soru', subject: 'Matematik', correct: 8, wrong: 2, blank: 2 },
            { kind: 'soru', subject: 'Türkçe', correct: 10, wrong: 0, blank: 0 },
            { kind: 'kitap', subject: 'Roman', pages: 40 },
        ];
        const d = gunlukDersDagilimi(g);
        expect(d[0]).toMatchObject({ ders: 'Matematik', cozulen: 32, isabet: 80 });
        expect(d.find((x) => x.ders === 'Roman')).toBeUndefined();
    });
});
