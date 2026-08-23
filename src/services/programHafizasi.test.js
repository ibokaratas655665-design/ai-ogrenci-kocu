/**
 * PROGRAM HAFIZASI testleri.
 *
 * Kilitlenen davranışlar:
 *   §8/§32  Eksik soru ÇİFT SAYILMAZ — her seferinde yeniden hesaplanır.
 *   §10     Planlanan ≠ gerçekleşen; ikisi ayrı tutulur.
 *   §13     Zor/başarısız konu daha erken, kolay/başarılı konu daha geç tekrar.
 *   §48     Veri yoksa sahte sayı değil, dürüst `veri:false`.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
    eksikSorular, eksikEtutler, tekrarAraligi, tekrarZamanlari,
    hafizaOzeti, listeyeCevir,
} from './programHafizasi';

const OGR = 'hafiza_test_ogr';

/** n gün önce, 'YYYY-MM-DD'. */
const gunOnce = (n) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const cizelgeKur = (hucreler) =>
    localStorage.setItem(`student_programs_${OGR}`, JSON.stringify(hucreler));

const soruKur = (kayitlar) =>
    localStorage.setItem('study_log', JSON.stringify(
        kayitlar.map((k, i) => ({ id: `s${i}`, studentId: OGR, kind: 'soru', ...k })),
    ));

const ilerlemeKur = (kayit) =>
    localStorage.setItem('program_progress', JSON.stringify({ [OGR]: kayit }));

const KONULAR = [
    { dersAd: 'Türkçe', konu: 'Sözcükte Anlam', hedef: 120, zorluk: 2 },
    { dersAd: 'Matematik', konu: 'Türev', hedef: 200, zorluk: 3 },
];

beforeEach(() => localStorage.clear());

/* ══════════════════════════════════════════════════════════ */
describe('eksik soru — çift sayma yasağı', () => {
    /**
     * Talimattaki senaryo (§44):
     *   1. hafta: hedef 120, çözülen 85 → eksik 35
     *   2. hafta: 20 soru daha         → eksik 15  (35+20 DEĞİL)
     *   3. hafta: aynı veriyle         → yine 15
     */
    it('hedef 120, çözülen 85 → eksik 35', () => {
        cizelgeKur({ 'm1-w1-Pazartesi-0': { subject: 'Türkçe', topic: 'Sözcükte Anlam', type: 'konu' } });
        soruKur([{ date: gunOnce(3), topic: 'Sözcükte Anlam', correct: 60, wrong: 20, blank: 5 }]);

        const r = eksikSorular(OGR, KONULAR);
        const satir = r.satirlar.find((s) => s.konu === 'Sözcükte Anlam');
        expect(satir.hedef).toBe(120);
        expect(satir.cozulen).toBe(85);
        expect(satir.eksik).toBe(35);
    });

    it('20 soru daha çözülünce eksik 15 olur — 55 DEĞİL', () => {
        cizelgeKur({ 'm1-w1-Pazartesi-0': { subject: 'Türkçe', topic: 'Sözcükte Anlam', type: 'konu' } });
        soruKur([
            { date: gunOnce(9), topic: 'Sözcükte Anlam', correct: 60, wrong: 20, blank: 5 },
            { date: gunOnce(2), topic: 'Sözcükte Anlam', correct: 15, wrong: 5, blank: 0 },
        ]);

        const satir = eksikSorular(OGR, KONULAR).satirlar.find((s) => s.konu === 'Sözcükte Anlam');
        expect(satir.cozulen).toBe(105);
        expect(satir.eksik).toBe(15);
    });

    it('arka arkaya çağrılarda değer BİRİKMEZ', () => {
        cizelgeKur({ 'm1-w1-Pazartesi-0': { subject: 'Türkçe', topic: 'Sözcükte Anlam', type: 'konu' } });
        soruKur([{ date: gunOnce(1), topic: 'Sözcükte Anlam', correct: 80, wrong: 5, blank: 0 }]);

        const bir = eksikSorular(OGR, KONULAR).toplamEksik;
        const iki = eksikSorular(OGR, KONULAR).toplamEksik;
        const uc = eksikSorular(OGR, KONULAR).toplamEksik;
        expect(bir).toBe(iki);
        expect(iki).toBe(uc);
    });

    it('hedef aşılırsa eksik negatif değil SIFIR olur', () => {
        cizelgeKur({ 'm1-w1-Pazartesi-0': { subject: 'Türkçe', topic: 'Sözcükte Anlam', type: 'konu' } });
        soruKur([{ date: gunOnce(1), topic: 'Sözcükte Anlam', correct: 200, wrong: 0, blank: 0 }]);
        const satir = eksikSorular(OGR, KONULAR).satirlar.find((s) => s.konu === 'Sözcükte Anlam');
        expect(satir.eksik).toBe(0);
    });

    it('PLANLANAN ile GERÇEKLEŞEN ayrı tutulur', () => {
        cizelgeKur({ 'm1-w1-Pazartesi-0': { subject: 'Matematik', topic: 'Türev', type: 'konu' } });
        soruKur([{ date: gunOnce(1), topic: 'Türev', correct: 30, wrong: 10, blank: 0 }]);
        const satir = eksikSorular(OGR, KONULAR).satirlar.find((s) => s.konu === 'Türev');
        expect(satir.hedef).toBe(200);       // plan
        expect(satir.cozulen).toBe(40);      // gerçek
        expect(satir.eksik).toBe(160);       // fark
    });

    it('hedefi olmayan konuda eksik UYDURULMAZ', () => {
        cizelgeKur({ 'm1-w1-Pazartesi-0': { subject: 'Fizik', topic: 'Kuvvet', type: 'konu' } });
        soruKur([]);
        const satir = eksikSorular(OGR, []).satirlar.find((s) => s.konu === 'Kuvvet');
        expect(satir.hedef).toBeNull();
        expect(satir.eksik).toBeNull();
    });
});

/* ══════════════════════════════════════════════════════════ */
describe('eksik etüt', () => {
    it('planlanan ama yapılmayan etütler sayılır', () => {
        cizelgeKur({
            'm1-w1-Pazartesi-0': { subject: 'Matematik', topic: 'Türev', type: 'konu' },
            'm1-w1-Pazartesi-1': { subject: 'Matematik', topic: 'Türev', type: 'soru' },
            'm1-w1-Salı-0': { subject: 'Türkçe', topic: 'Paragraf', type: 'konu' },
        });
        ilerlemeKur({ 'm1-w1-Pazartesi-0': { status: 'done' } });

        const r = eksikEtutler(OGR);
        expect(r.veri).toBe(true);
        expect(r.toplam).toBe(2);           // Türev/soru + Paragraf/konu
    });

    it('program yoksa dürüst boş durum', () => {
        expect(eksikEtutler(OGR).veri).toBe(false);
        expect(eksikEtutler(OGR).sebep).toBe('program-yok');
    });
});

/* ══════════════════════════════════════════════════════════ */
describe('tekrar aralığı — zorluk ve isabete duyarlı', () => {
    it('ZOR + DÜŞÜK isabet → aralık kısalır', () => {
        const zor = tekrarAraligi(30, 3, 20);
        expect(zor).toBeLessThan(30);
    });

    it('KOLAY + YÜKSEK isabet → aralık uzar', () => {
        const kolay = tekrarAraligi(30, 1, 95);
        expect(kolay).toBeGreaterThan(30);
    });

    it('orta zorluk + veri yok → temel aralık korunur', () => {
        expect(tekrarAraligi(30, 2, null)).toBe(30);
    });

    it('zor konu kolay konudan daha erken tekrar ister', () => {
        expect(tekrarAraligi(30, 3, 60)).toBeLessThan(tekrarAraligi(30, 1, 60));
    });

    it('çarpan sınırlıdır — aralık uçlarda saçmalamaz', () => {
        expect(tekrarAraligi(30, 3, 0)).toBeGreaterThanOrEqual(15);
        expect(tekrarAraligi(30, 1, 100)).toBeLessThanOrEqual(45);
    });
});

/* ══════════════════════════════════════════════════════════ */
describe('tekrar zamanı önerisi', () => {
    it('uzun süre önce çalışılan konu tekrar listesine girer', () => {
        cizelgeKur({ 'm1-w1-Pazartesi-0': { subject: 'Matematik', topic: 'Türev', type: 'konu' } });
        soruKur([{ date: gunOnce(60), topic: 'Türev', correct: 40, wrong: 10, blank: 0 }]);

        const r = tekrarZamanlari(OGR, KONULAR);
        expect(r.veri).toBe(true);
        expect(r.satirlar[0].konu).toBe('Türev');
        expect(r.satirlar[0].gecenGun).toBeGreaterThanOrEqual(60);
    });

    it('dün çalışılan konu için tekrar önerilmez', () => {
        cizelgeKur({ 'm1-w1-Pazartesi-0': { subject: 'Matematik', topic: 'Türev', type: 'konu' } });
        // 1 günlük ilk halka zor konuda kısalır; 0 gün geçmişse hiç girmez
        soruKur([{ date: gunOnce(0), topic: 'Türev', correct: 40, wrong: 10, blank: 0 }]);
        expect(tekrarZamanlari(OGR, KONULAR).veri).toBe(false);
    });

    it('hiç çalışılmamış konu için tekrar ÖNERİLMEZ', () => {
        cizelgeKur({ 'm1-w1-Pazartesi-0': { subject: 'Matematik', topic: 'Türev', type: 'konu' } });
        soruKur([]);
        expect(tekrarZamanlari(OGR, KONULAR).veri).toBe(false);
    });

    it('en çok geciken konu başa gelir', () => {
        cizelgeKur({
            'm1-w1-Pazartesi-0': { subject: 'Matematik', topic: 'Türev', type: 'konu' },
            'm1-w1-Salı-0': { subject: 'Türkçe', topic: 'Sözcükte Anlam', type: 'konu' },
        });
        soruKur([
            { date: gunOnce(15), topic: 'Türev', correct: 20, wrong: 5, blank: 0 },
            { date: gunOnce(120), topic: 'Sözcükte Anlam', correct: 20, wrong: 5, blank: 0 },
        ]);
        expect(tekrarZamanlari(OGR, KONULAR).satirlar[0].konu).toBe('Sözcükte Anlam');
    });
});

/* ══════════════════════════════════════════════════════════ */
describe('hafıza özeti', () => {
    it('geçmiş veri yoksa SAHTE SAYI üretmez', () => {
        const r = hafizaOzeti(OGR, []);
        expect(r.veri).toBe(false);
        expect(r.sebep).toBe('yeterli-gecmis-veri-yok');
    });

    it('rozet sayıları gerçek veriden gelir', () => {
        cizelgeKur({
            'm1-w1-Pazartesi-0': { subject: 'Türkçe', topic: 'Sözcükte Anlam', type: 'konu' },
            'm1-w1-Salı-0': { subject: 'Matematik', topic: 'Türev', type: 'soru' },
        });
        soruKur([{ date: gunOnce(40), topic: 'Sözcükte Anlam', correct: 60, wrong: 25, blank: 0 }]);
        ilerlemeKur({});

        const r = hafizaOzeti(OGR, KONULAR);
        expect(r.veri).toBe(true);
        expect(r.rozet.eksikSoru).toBe(235);       // Sözcükte 35 + Türev 200 (hiç çözülmemiş)
        expect(r.rozet.eksikEtut).toBe(2);         // iki etüt de yapılmamış
        expect(r.rozet.tekrarSayisi).toBeGreaterThan(0);
    });

    it('hafıza satırı dağıtım listesi biçimine çevrilir', () => {
        const satir = { ders: 'Türkçe', konu: 'Sözcükte Anlam', hedef: 120, eksik: 35, zorluk: 2 };
        const kayit = listeyeCevir(satir, 'soru');
        expect(kayit.dersAd).toBe('Türkçe');
        expect(kayit.konu).toBe('Sözcükte Anlam');
        expect(kayit.kalanSoru).toBe(35);
        expect(kayit.hafizadan).toBe('soru');
    });
});
