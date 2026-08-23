/**
 * Tarih kilidi testleri (§3): geçmiş/bugün işaretlenebilir,
 * GELECEK işaretlenemez — kontrol yazma katmanında.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import programProgress, {
    haftaBasi, hucreTarihi, isaretlenebilirMi, setCellStatus, getProgress,
} from './programProgressService';

const OGRENCI = 'test_tarih_ogr';

/** Programı N hafta önce başlatılmış gibi kur. */
const metaKur = (haftaOnce = 0) => {
    const d = haftaBasi();
    d.setDate(d.getDate() - haftaOnce * 7);
    localStorage.setItem(`program_meta_${OGRENCI}`, JSON.stringify({
        programDurationMonths: 10,
        dailySlotCount: 6,
        baslangicTarihi: d.toISOString(),
    }));
};

describe('program tarih kilidi', () => {
    beforeEach(() => {
        localStorage.clear();
        metaKur(0);   // program bu hafta başladı
    });

    it('hücre anahtarından takvim tarihi çözülür', () => {
        const b = haftaBasi();
        // m1-w1-Pazartesi-0 → başlangıç haftasının pazartesisi
        const t1 = hucreTarihi('m1-w1-Pazartesi-0', b);
        expect(t1.getTime()).toBe(b.getTime());
        // m1-w2-Pazartesi-0 → 7 gün sonra
        const t2 = hucreTarihi('m1-w2-Pazartesi-0', b);
        expect((t2 - b) / 86400000).toBe(7);
        // m2-w1-Pazartesi-0 → 4 hafta sonra
        const t3 = hucreTarihi('m2-w1-Pazartesi-0', b);
        expect((t3 - b) / 86400000).toBe(28);
        // Gün adı sırası: Pazar, pazartesiden 6 gün sonra
        const t4 = hucreTarihi('m1-w1-Pazar-0', b);
        expect((t4 - b) / 86400000).toBe(6);
    });

    it('bu haftanın pazartesisi (geçmiş/bugün) işaretlenebilir', () => {
        const k = isaretlenebilirMi(OGRENCI, 'm1-w1-Pazartesi-0');
        expect(k.izin).toBe(true);
    });

    it('gelecek haftanın etüdü işaretlenemez', () => {
        const k = isaretlenebilirMi(OGRENCI, 'm2-w1-Pazartesi-0');   // 4 hafta sonra
        expect(k.izin).toBe(false);
        expect(k.sebep).toMatch(/gelecek/i);
    });

    it('YAZMA katmanı gelecek etüdü reddeder (arayüz atlansa bile)', () => {
        setCellStatus(OGRENCI, 'm5-w3-Salı-2', 'done');
        expect(getProgress(OGRENCI)['m5-w3-Salı-2']).toBeUndefined();
    });

    it('geçmiş etüt yazılır ve tarih damgası tutulur', () => {
        setCellStatus(OGRENCI, 'm1-w1-Pazartesi-0', 'done');
        const kayit = getProgress(OGRENCI)['m1-w1-Pazartesi-0'];
        expect(kayit?.status).toBe('done');
        expect(kayit?.at).toBeTruthy();
    });

    it('tamamlama geri alınabilir (temizleme her zaman serbest)', () => {
        setCellStatus(OGRENCI, 'm1-w1-Pazartesi-0', 'done');
        setCellStatus(OGRENCI, 'm1-w1-Pazartesi-0', null);
        expect(getProgress(OGRENCI)['m1-w1-Pazartesi-0']).toBeUndefined();
    });

    it('program geçmişte başladıysa ilk aylar açılır', () => {
        metaKur(8);   // 8 hafta önce başladı → 1. ve 2. ay geçmiş
        expect(isaretlenebilirMi(OGRENCI, 'm1-w1-Pazartesi-0').izin).toBe(true);
        expect(isaretlenebilirMi(OGRENCI, 'm2-w4-Cuma-3').izin).toBe(true);
        // 3. ay hâlâ gelecek
        expect(isaretlenebilirMi(OGRENCI, 'm3-w4-Cuma-3').izin).toBe(false);
    });

    it('toplu yazımda da gelecek etütler atlanır', () => {
        programProgress.setManyStatuses(OGRENCI, [
            { cellKey: 'm1-w1-Salı-1', status: 'done' },
            { cellKey: 'm6-w1-Salı-1', status: 'done' },
        ]);
        const p = getProgress(OGRENCI);
        expect(p['m1-w1-Salı-1']?.status).toBe('done');
        expect(p['m6-w1-Salı-1']).toBeUndefined();
    });
});

/* ══════════════════════════════════════════════════════════════
   VERİ KALICILIĞI — "sayfa yenilenince eski veri geliyor" sınıfı
   ══════════════════════════════════════════════════════════════ */
describe('bulut damgası (veri kaybı koruması)', () => {
    /**
     * Senkron katmanı açılışta `_fbtime_{anahtar}` okur; damga yoksa
     * (`localTime === 0`) kaydı "bu cihazda hiç yok" sayar ve BULUTTAKİ
     * kopyayı yerelin üstüne yazar. Bulut yazımı gecikmeli olduğu için
     * damga hemen atılmazsa, o aralıktaki bir yenileme taze işaretlemeyi
     * eski kopyayla ezer — öğrencinin "yaptım" dediği etüt geri döner.
     */
    it('etüt işaretlenince zaman damgası ANINDA atılır', () => {
        localStorage.removeItem('_fbtime_program_progress');
        metaKur(0);
        setCellStatus(OGRENCI, 'm1-w1-Pazartesi-0', 'done');

        const damga = localStorage.getItem('_fbtime_program_progress');
        expect(damga).toBeTruthy();
        expect(Number(damga)).toBeGreaterThan(0);
    });

    it('işaret geri alınınca da damga tazelenir', () => {
        metaKur(0);
        setCellStatus(OGRENCI, 'm1-w1-Pazartesi-0', 'done');
        const ilk = Number(localStorage.getItem('_fbtime_program_progress'));
        setCellStatus(OGRENCI, 'm1-w1-Pazartesi-0', null);
        const son = Number(localStorage.getItem('_fbtime_program_progress'));
        expect(son).toBeGreaterThanOrEqual(ilk);
    });
});
