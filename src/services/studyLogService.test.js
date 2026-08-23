/**
 * ÇALIŞMA KAYDI — pencere hesabı testleri.
 *
 * Kilitlenen kusur: "Son 7 gün" iki farklı sayı veriyordu.
 * `getSummary` penceresi ham zaman damgası karşılaştırıyor, kayıt tarihi
 * ise UTC olarak ayrıştırılıyordu; UTC+3'te pencere fiilen 8 gün genişti.
 * Aynı ekranda üst KPI kartları (getSummary) 70, alttaki gelişim panosu
 * (calismaOzeti) 30 gösteriyordu.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { getSummary, getEntries, pencereBasi, todayKey } from './studyLogService';
import { calismaOzeti } from './gelisimAnalitik';

const OGR = 'pencere_test_ogr';

/** n gün önce, 'YYYY-MM-DD' (yerel). */
const gunOnce = (n) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - n);
    return todayKey(d);
};

const kur = (kayitlar) =>
    localStorage.setItem('study_log', JSON.stringify(
        kayitlar.map((k, i) => ({
            id: `p${i}`, studentId: OGR, kind: 'soru', subject: 'Matematik', topic: 'T', ...k,
        })),
    ));

const soruSayisi = (ozet) => ozet.totals?.questions ?? ozet.questions;

beforeEach(() => localStorage.clear());

describe('pencere sınırı', () => {
    it('pencereBasi bugünü DAHİL eder — 7 gün → 6 gün öncesi', () => {
        expect(pencereBasi(7)).toBe(gunOnce(6));
        expect(pencereBasi(1)).toBe(gunOnce(0));
        expect(pencereBasi(30)).toBe(gunOnce(29));
    });

    it('sınırdaki gün içeride, dışındaki gün hariç', () => {
        kur([
            { date: gunOnce(0), correct: 10, wrong: 0, blank: 0 },
            { date: gunOnce(6), correct: 20, wrong: 0, blank: 0 },   // pencerenin ilk günü
            { date: gunOnce(7), correct: 40, wrong: 0, blank: 0 },   // pencere DIŞI
        ]);
        expect(soruSayisi(getSummary(OGR, 7))).toBe(30);
        expect(soruSayisi(getSummary(OGR, 30))).toBe(70);
    });

    /**
     * Asıl kilit: aynı etiket, aynı sonuç. İki farklı servis aynı
     * pencereyi farklı yorumlarsa kullanıcı aynı ekranda iki sayı görür.
     */
    it('getSummary ile calismaOzeti AYNI sayıyı verir', () => {
        kur([
            { date: gunOnce(0), correct: 10, wrong: 0, blank: 0 },
            { date: gunOnce(3), correct: 15, wrong: 5, blank: 0 },
            { date: gunOnce(6), correct: 20, wrong: 0, blank: 0 },
            { date: gunOnce(7), correct: 40, wrong: 0, blank: 0 },
            { date: gunOnce(20), correct: 99, wrong: 0, blank: 0 },
        ]);
        for (const gun of [1, 7, 14, 30]) {
            expect(soruSayisi(getSummary(OGR, gun)), `${gun} günlük pencere`)
                .toBe(calismaOzeti(OGR, gun).soru);
        }
    });

    it('byDay uzunluğu istenen gün sayısı kadardır', () => {
        kur([{ date: gunOnce(0), correct: 5, wrong: 0, blank: 0 }]);
        expect(getSummary(OGR, 7).byDay).toHaveLength(7);
        expect(getSummary(OGR, 30).byDay).toHaveLength(30);
    });

    it('byDay son günü BUGÜNdür ve kaydı taşır', () => {
        kur([{ date: gunOnce(0), correct: 7, wrong: 0, blank: 0 }]);
        const son = getSummary(OGR, 7).byDay.at(-1);
        expect(son.date).toBe(gunOnce(0));
        expect(son.questions).toBe(7);
    });

    it('getEntries metin anahtarıyla süzer, saat diliminden etkilenmez', () => {
        kur([
            { date: gunOnce(0), correct: 1, wrong: 0, blank: 0 },
            { date: gunOnce(5), correct: 1, wrong: 0, blank: 0 },
            { date: gunOnce(9), correct: 1, wrong: 0, blank: 0 },
        ]);
        expect(getEntries(OGR, { since: pencereBasi(7) })).toHaveLength(2);
        expect(getEntries(OGR, { since: pencereBasi(10) })).toHaveLength(3);
    });

    it('veri yokken sıfır döner, uydurma yapmaz', () => {
        const o = getSummary(OGR, 7);
        expect(soruSayisi(o)).toBe(0);
        expect(o.activeDays).toBe(0);
    });
});
