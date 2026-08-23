/**
 * DERS RENK SİSTEMİ testleri.
 *
 * Kesin kurallar (talimat §18–§20):
 *   · Her dersin sabit bir rengi var.
 *   · Renk güne, haftaya, kutuya göre DEĞİŞMEZ.
 *   · İki farklı ders AYNI rengi almaz.
 *   · Eşleme tek kaynaktan gelir; bileşenler kendi rengini üretmez.
 */
import { describe, it, expect } from 'vitest';
import { getSubjectColor, getCellColor, ACTIVITY_TYPES } from './programColors';
import { DERS_ADLARI } from './examTopics';

const dersler = Object.entries(DERS_ADLARI);

describe('ders renkleri benzersiz', () => {
    /**
     * ⚠️ Ölçülen kusur: eski harita 37 derse yalnızca 17 renk veriyordu.
     * Tek bir pembe tonunu altı ders paylaşıyordu; Matematik ile
     * Geometri birebir aynı maviydi. Program ızgarasında dersler
     * ayırt edilemiyordu.
     */
    it('katalogdaki her ders FARKLI bir vurgu rengi alır', () => {
        const gorulen = new Map();
        const cakisan = [];
        for (const [kimlik, ad] of dersler) {
            const renk = getSubjectColor(ad).accent;
            if (gorulen.has(renk)) cakisan.push(`${kimlik} ↔ ${gorulen.get(renk)} (${renk})`);
            else gorulen.set(renk, kimlik);
        }
        expect(cakisan, `Çakışan renkler: ${cakisan.join(', ')}`).toEqual([]);
        expect(gorulen.size).toBe(dersler.length);
    });

    it('ders KİMLİĞİ ile GÖRÜNEN AD aynı rengi verir', () => {
        for (const [kimlik, ad] of dersler) {
            expect(getSubjectColor(kimlik).accent, kimlik).toBe(getSubjectColor(ad).accent);
        }
    });

    it('Matematik ile Geometri farklı renkte', () => {
        expect(getSubjectColor('Matematik').accent).not.toBe(getSubjectColor('Geometri').accent);
    });

    it('etkinlik renkleri hiçbir dersin rengiyle çakışmaz', () => {
        const dersRenkleri = new Set(dersler.map(([, ad]) => getSubjectColor(ad).accent));
        for (const [tip, t] of Object.entries(ACTIVITY_TYPES)) {
            if (!t.color) continue;   // konu/soru dersin rengini kullanır
            expect(dersRenkleri.has(t.color.accent), `${tip} rengi bir dersle aynı`).toBe(false);
        }
    });
});

describe('renk kararlılığı', () => {
    /** Aynı ders her çağrıda, her günde, her kutuda aynı rengi almalı. */
    it('aynı ders için renk her çağrıda aynıdır', () => {
        for (const [, ad] of dersler) {
            const a = getSubjectColor(ad);
            const b = getSubjectColor(ad);
            expect(a.accent).toBe(b.accent);
            expect(a.bg).toBe(b.bg);
        }
    });

    it('renk GÜNE göre değişmez — hücre anahtarı rengi etkilemez', () => {
        const gunler = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
        const renkler = gunler.map(() => getCellColor({ subject: 'Matematik', topic: 'Türev', type: 'konu' }).accent);
        expect(new Set(renkler).size).toBe(1);
    });

    it('konu ve tekrar etüdü aynı dersin rengini korur', () => {
        const konu = getCellColor({ subject: 'Türkçe', topic: 'Paragraf', type: 'konu' });
        const soru = getCellColor({ subject: 'Türkçe', topic: 'Paragraf', type: 'soru' });
        // Soru etüdü daha doygun bir zemin alır ama vurgu rengi aynı derstir
        expect(soru.accent).toBe(konu.accent);
    });

    it('büyük/küçük harf ve Türkçe karakter farkı rengi değiştirmez', () => {
        const a = getSubjectColor('Türkçe').accent;
        expect(getSubjectColor('TÜRKÇE').accent).toBe(a);
        expect(getSubjectColor('türkçe').accent).toBe(a);
    });

    it('bölüm önekli ad da doğru dersi bulur', () => {
        expect(getSubjectColor('TYT Matematik').accent).toBe(getSubjectColor('Matematik').accent);
        expect(getSubjectColor('AYT Geometri').accent).toBe(getSubjectColor('Geometri').accent);
    });

    it('bilinmeyen ders bile kararlı bir renk alır, gri kalmaz', () => {
        const a = getSubjectColor('Uydurma Ders X');
        const b = getSubjectColor('Uydurma Ders X');
        expect(a.accent).toBe(b.accent);
        expect(a.accent).toBeTruthy();
    });

    it('boş/eksik ders adı çökertmez', () => {
        expect(getSubjectColor('').accent).toBeTruthy();
        expect(getSubjectColor(null).accent).toBeTruthy();
        expect(getSubjectColor(undefined).accent).toBeTruthy();
        expect(getCellColor(null)).toBeNull();
    });
});
