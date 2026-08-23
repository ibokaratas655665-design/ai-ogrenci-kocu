/**
 * GELİŞİM ANALİTİĞİ testleri.
 *
 * İki şey kilitleniyor:
 *   1. İSTATİSTİKSEL DOĞRULUK (§26) — özellikle payda hataları.
 *   2. SAHTE VERİ ÜRETMEME (§23, §34) — veri yoksa sayı değil,
 *      dürüst bir "yetersiz" işareti dönmeli.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
    yuzdeDegisim, oran, egim, yon, gunOnce,
    calismaOzeti, gunlukSeri, istikrar,
    programUyumu, uyumSerisi, netTrendi, hataOzeti,
    dersRiskleri, gelisimZinciri, yorumla, motivasyon,
} from './gelisimAnalitik';

const OGR = 'analitik_test_ogr';

/** YYYY-MM-DD anahtarı, n gün önce. */
const gunAnahtar = (n) => {
    const d = gunOnce(n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const calismaKur = (kayitlar) =>
    localStorage.setItem('study_log', JSON.stringify(
        kayitlar.map((k, i) => ({ id: `s${i}`, studentId: OGR, kind: 'soru', ...k }))
    ));

/** Sahte takvim çözücü: cellKey içindeki gün ofsetini tarihe çevirir. */
const tarihCozTest = (k) => {
    const m = /gun(-?\d+)/.exec(k);
    return m ? gunOnce(Number(m[1])) : null;
};

beforeEach(() => localStorage.clear());

/* ══════════════════════════════════════════════════════════ */
describe('istatistiksel temeller', () => {
    it('yüzde değişim doğru hesaplanır', () => {
        expect(yuzdeDegisim(120, 100)).toBe(20);
        expect(yuzdeDegisim(80, 100)).toBe(-20);
    });

    it('PAYDA SIFIRKEN yüzde uydurmaz', () => {
        // "0'dan 5'e çıktı" bir yüzde değildir — Infinity/NaN dönmemeli
        expect(yuzdeDegisim(5, 0)).toBeNull();
        expect(yuzdeDegisim(0, 0)).toBeNull();
    });

    it('oran paydası sıfırsa null döner', () => {
        expect(oran(3, 4)).toBe(75);
        expect(oran(0, 10)).toBe(0);
        expect(oran(5, 0)).toBeNull();
    });

    it('eğim yeterli nokta yoksa null — iki nokta trend değildir', () => {
        expect(egim([1, 2])).toBeNull();
        expect(egim([1, 2, 3])).toBeGreaterThan(0);
        expect(egim([3, 2, 1])).toBeLessThan(0);
        expect(egim([2, 2, 2])).toBe(0);
    });

    it('yön eşiği aşmayan değişimi "sabit" sayar', () => {
        expect(yon(null)).toBe('belirsiz');
        expect(yon(0.5)).toBe('yukselis');
        expect(yon(-0.5)).toBe('dusus');
        expect(yon(0.01)).toBe('sabit');
    });
});

/* ══════════════════════════════════════════════════════════ */
/**
 * SESSİZ VERİ KAYBI SINIFI — saat dilimi kayması.
 *
 * Kayıt tarihleri 'YYYY-MM-DD' metnidir ve `new Date('2026-08-23')`
 * bunu UTC gece yarısı olarak ayrıştırır; pencere sınırları ise yerel
 * gece yarısıdır. UTC+3'te bugünün kaydı üst sınırın üstünde kalır ve
 * pencereden DÜŞER. Ölçülen etki: 30 günlük pencerede 1295 sorunun
 * yalnızca 1211'i sayılıyordu.
 *
 * Hata sessizdir — sayı yine de makul görünür. Bu yüzden testle
 * kilitlenmiştir.
 */
describe('pencere sınırları — saat dilimi', () => {
    it('BUGÜNÜN kaydı pencereye dahildir', () => {
        calismaKur([{ date: gunAnahtar(0), correct: 10, wrong: 0, blank: 0, minutes: 30 }]);
        const o = calismaOzeti(OGR, 7);
        expect(o.veri).toBe(true);
        expect(o.soru).toBe(10);
    });

    it('pencerenin ilk ve son günü dahil, dışı hariç', () => {
        calismaKur([
            { date: gunAnahtar(0), correct: 1, wrong: 0, blank: 0 },   // bugün
            { date: gunAnahtar(6), correct: 2, wrong: 0, blank: 0 },   // 7 günlük pencerenin ilk günü
            { date: gunAnahtar(7), correct: 4, wrong: 0, blank: 0 },   // pencere DIŞI
        ]);
        const o = calismaOzeti(OGR, 7);
        expect(o.soru).toBe(3);            // 1 + 2, dışarıdaki 4 sayılmaz
    });

    it('hiçbir kayıt kaybolmaz — pencere tüm geçmişi kapsıyorsa toplam eşittir', () => {
        const kayitlar = [0, 1, 2, 5, 10, 20].map((g) => ({
            date: gunAnahtar(g), correct: 10, wrong: 5, blank: 1,
        }));
        calismaKur(kayitlar);
        const o = calismaOzeti(OGR, 30);
        expect(o.soru).toBe(kayitlar.length * 16);
    });

    it('bugünün hata kaydı da pencereye girer', () => {
        localStorage.setItem('error_notebook', JSON.stringify([
            { id: 'h1', studentId: OGR, subject: 'Matematik', topic: 'Türev', date: gunAnahtar(0) },
        ]));
        const h = hataOzeti(OGR, 30);
        expect(h.veri).toBe(true);
        expect(h.toplam).toBe(1);
    });
});

/* ══════════════════════════════════════════════════════════ */
describe('çalışma özeti', () => {
    it('veri yokken veri:false döner, sıfır uydurmaz', () => {
        const o = calismaOzeti(OGR, 7);
        expect(o.veri).toBe(false);
        expect(o.karsilastirilabilir).toBe(false);
        expect(o.soruDegisim).toBeNull();
    });

    it('pencere içindeki soruları toplar, dışındakini almaz', () => {
        calismaKur([
            { date: gunAnahtar(1), correct: 10, wrong: 5, blank: 5, minutes: 60 },
            { date: gunAnahtar(3), correct: 20, wrong: 0, blank: 0, minutes: 30 },
            { date: gunAnahtar(20), correct: 99, wrong: 99, blank: 99 },   // pencere dışı
        ]);
        const o = calismaOzeti(OGR, 7);
        expect(o.veri).toBe(true);
        expect(o.soru).toBe(40);        // 20 + 20
        expect(o.dakika).toBe(90);
        expect(o.isabet).toBe(86);      // 30 doğru / 35 cevaplanan
    });

    it('önceki dönemde kayıt yoksa değişim iddia etmez', () => {
        calismaKur([{ date: gunAnahtar(1), correct: 10, wrong: 0, blank: 0 }]);
        const o = calismaOzeti(OGR, 7);
        expect(o.karsilastirilabilir).toBe(false);
        expect(o.soruDegisim).toBeNull();
    });

    it('önceki dönem varsa değişim doğru hesaplanır', () => {
        calismaKur([
            { date: gunAnahtar(1), correct: 60, wrong: 0, blank: 0 },   // bu hafta 60
            { date: gunAnahtar(9), correct: 40, wrong: 0, blank: 0 },   // önceki hafta 40
        ]);
        const o = calismaOzeti(OGR, 7);
        expect(o.soru).toBe(60);
        expect(o.oncekiSoru).toBe(40);
        expect(o.soruDegisim).toBe(50);
    });

    it('kitap kaydı soru sayısına girmez ama süreye girer', () => {
        localStorage.setItem('study_log', JSON.stringify([
            { id: 'k1', studentId: OGR, kind: 'kitap', date: gunAnahtar(1), minutes: 45, subject: 'Roman' },
        ]));
        const o = calismaOzeti(OGR, 7);
        expect(o.soru).toBe(0);
        expect(o.dakika).toBe(45);
    });
});

/* ══════════════════════════════════════════════════════════ */
describe('istikrar', () => {
    it('aktif gün ve zincirleri sayar', () => {
        calismaKur([0, 1, 2, 5].map((n) => ({ date: gunAnahtar(n), correct: 5, wrong: 0, blank: 0 })));
        const i = istikrar(OGR, 7);
        expect(i.veri).toBe(true);
        expect(i.aktifGun).toBe(4);
        expect(i.guncelZincir).toBe(3);    // bugün, dün, evvelsi gün
        expect(i.enUzunZincir).toBe(3);
    });

    it('günlük seride kayıtsız gün "kayit:false" ile ayrılır', () => {
        calismaKur([{ date: gunAnahtar(0), correct: 5, wrong: 0, blank: 0 }]);
        const seri = gunlukSeri(OGR, 3);
        expect(seri).toHaveLength(3);
        expect(seri.at(-1).kayit).toBe(true);
        expect(seri[0].kayit).toBe(false);   // çalışmadı DEĞİL, kayıt yok
    });
});

/* ══════════════════════════════════════════════════════════ */
describe('program uyumu', () => {
    const cizelgeKur = (hucreler) =>
        localStorage.setItem(`student_programs_${OGR}`, JSON.stringify({ schedule: hucreler }));
    const ilerlemeKur = (kayit) =>
        localStorage.setItem('program_progress', JSON.stringify({ [OGR]: kayit }));

    it('program yoksa veri:false', () => {
        expect(programUyumu(OGR, { tarihCoz: tarihCozTest }).veri).toBe(false);
    });

    it('GELECEK etütler paydaya girmez — yapılmamış olmak başarısızlık değil', () => {
        cizelgeKur({
            'gun3-a': { subject: 'Matematik', topic: 'Türev', type: 'konu' },
            'gun1-b': { subject: 'Matematik', topic: 'Limit', type: 'konu' },
            'gun-5-c': { subject: 'Matematik', topic: 'İntegral', type: 'konu' },  // 5 gün SONRA
        });
        ilerlemeKur({ 'gun3-a': { status: 'done' }, 'gun1-b': { status: 'done' } });

        const u = programUyumu(OGR, { tarihCoz: tarihCozTest });
        expect(u.planlanan).toBe(2);      // gelecekteki hariç
        expect(u.bekleyen).toBe(1);
        expect(u.oran).toBe(100);         // 2/2 — gelecek etüt oranı düşürmemeli
    });

    it('esnek/telafi bloğu uyuma katılmaz', () => {
        cizelgeKur({
            'gun1-a': { subject: 'Matematik', topic: 'Türev', type: 'konu' },
            'gun1-b': { subject: 'Esnek / Telafi', topic: 'Yetişemediklerini tamamla', type: 'mola' },
        });
        ilerlemeKur({ 'gun1-a': { status: 'done' } });
        const u = programUyumu(OGR, { tarihCoz: tarihCozTest });
        expect(u.planlanan).toBe(1);
        expect(u.oran).toBe(100);
    });

    it('ders bazlı uyum doğru bölünür', () => {
        cizelgeKur({
            'gun1-a': { subject: 'Matematik', topic: 'A', type: 'konu' },
            'gun2-b': { subject: 'Matematik', topic: 'B', type: 'konu' },
            'gun3-c': { subject: 'Türkçe', topic: 'C', type: 'konu' },
            'gun4-d': { subject: 'Türkçe', topic: 'D', type: 'konu' },
        });
        ilerlemeKur({ 'gun1-a': { status: 'done' }, 'gun2-b': { status: 'done' }, 'gun3-c': { status: 'done' } });

        const u = programUyumu(OGR, { tarihCoz: tarihCozTest });
        expect(u.oran).toBe(75);
        const mat = u.dersler.find((d) => d.ders === 'Matematik');
        const tur = u.dersler.find((d) => d.ders === 'Türkçe');
        expect(mat.oran).toBe(100);
        expect(tur.oran).toBe(50);
    });

    /**
     * Çizelgede `subject` iki farklı şey taşır: ders bloklarında ders
     * adı, etkinlik bloklarında etkinlik adı ("Kitap Okuma", "Deneme").
     * Ayrılmazsa koç panelinde "Kitap Okuma" bir DERS satırı olarak
     * belirir ve risk haritasına ders gibi düşer.
     */
    it('etkinlik blokları DERS kırılımına girmez ama genel orana girer', () => {
        cizelgeKur({
            'gun1-a': { subject: 'Matematik', topic: 'Türev', type: 'konu' },
            'gun2-b': { subject: 'Matematik', topic: 'Türev', type: 'soru' },
            'gun3-c': { subject: 'Kitap Okuma', topic: 'Roman', type: 'kitap' },
            'gun4-d': { subject: 'Deneme', topic: 'TYT Denemesi', type: 'deneme' },
            'gun5-e': { subject: 'Deneme Analizi', topic: 'Yanlış analizi', type: 'analiz' },
            'gun6-f': { subject: 'Paragraf', topic: 'Paragraf çalışması', type: 'paragraf' },
        });
        ilerlemeKur({ 'gun1-a': { status: 'done' }, 'gun3-c': { status: 'done' } });

        const u = programUyumu(OGR, { tarihCoz: tarihCozTest });

        // Genel oran BÜTÜN blokları sayar — deneme de yapılması gereken iştir
        expect(u.planlanan).toBe(6);
        expect(u.tamamlanan).toBe(2);
        expect(u.oran).toBe(33);

        // Ders kırılımında YALNIZCA gerçek ders var
        expect(u.dersler.map((d) => d.ders)).toEqual(['Matematik']);
        const mat = u.dersler[0];
        expect(mat.planlanan).toBe(2);      // konu + soru
        expect(mat.tamamlanan).toBe(1);
        expect(mat.oran).toBe(50);
    });

    it('etkinlik blokları risk haritasına DERS olarak düşmez', () => {
        cizelgeKur({
            'gun1-a': { subject: 'Kitap Okuma', topic: 'Roman', type: 'kitap' },
            'gun2-b': { subject: 'Paragraf', topic: 'Paragraf', type: 'paragraf' },
            'gun3-c': { subject: 'Biyoloji', topic: 'Hücre', type: 'konu' },
        });
        ilerlemeKur({});   // hiçbiri yapılmamış

        const r = dersRiskleri(OGR, { tarihCoz: tarihCozTest });
        const adlar = (r.dersler || []).map((d) => d.ders);
        expect(adlar).not.toContain('Kitap Okuma');
        expect(adlar).not.toContain('Paragraf');
        expect(adlar).toContain('Biyoloji');
    });

    it('uyum serisi yalnızca planı olan haftaları döner', () => {
        cizelgeKur({
            'gun2-a': { subject: 'Matematik', topic: 'A', type: 'konu' },
            'gun3-b': { subject: 'Matematik', topic: 'B', type: 'konu' },
        });
        ilerlemeKur({ 'gun2-a': { status: 'done' } });
        const s = uyumSerisi(OGR, { tarihCoz: tarihCozTest, hafta: 4 });
        expect(s.length).toBe(1);          // yalnızca bu hafta
        expect(s[0].oran).toBe(50);
    });
});

/* ══════════════════════════════════════════════════════════ */
describe('net trendi', () => {
    const denemeKur = (netler) =>
        localStorage.setItem('deneme_analizleri', JSON.stringify(
            netler.map((n, i) => ({
                id: `d${i}`, studentId: OGR, studentName: 'Test',
                ad: `Deneme ${i + 1}`, tur: 'TYT',
                tarih: gunAnahtar(netler.length - i),
                dersler: { Matematik: { dogru: n, yanlis: 0, bos: 0, net: n } },
            }))
        ));

    it('deneme yoksa veri:false', () => {
        const t = netTrendi(OGR, 'Test');
        expect(t.veri).toBe(false);
        expect(t.adet).toBe(0);
    });

    it('İKİ deneme trend saymaz ama veriyi gösterir', () => {
        denemeKur([50, 55]);
        const t = netTrendi(OGR, 'Test');
        expect(t.veri).toBe(true);
        expect(t.adet).toBe(2);
        expect(t.yeterliTrend).toBe(false);
        expect(t.sebep).toBe('trend-icin-az-deneme');
        expect(t.egim).toBeNull();
    });

    it('üç denemeden itibaren yön belirlenir', () => {
        denemeKur([40, 50, 60]);
        const t = netTrendi(OGR, 'Test');
        expect(t.yeterliTrend).toBe(true);
        expect(t.yon).toBe('yukselis');
        expect(t.toplamDegisim).toBe(20);
    });
});

/* ══════════════════════════════════════════════════════════ */
describe('hata özeti ve risk', () => {
    it('hata kaydı yoksa veri:false', () => {
        expect(hataOzeti(OGR).veri).toBe(false);
    });

    it('hatalar derse ve türe göre gruplanır', () => {
        localStorage.setItem('error_notebook', JSON.stringify([
            { studentId: OGR, date: gunAnahtar(1), subject: 'Matematik', errorType: 'Dikkat', topic: 'Türev' },
            { studentId: OGR, date: gunAnahtar(2), subject: 'Matematik', errorType: 'Bilgi', topic: 'Türev' },
            { studentId: OGR, date: gunAnahtar(3), subject: 'Türkçe', errorType: 'Dikkat', topic: 'Paragraf' },
        ]));
        const h = hataOzeti(OGR, 30);
        expect(h.toplam).toBe(3);
        expect(h.derslere[0]).toMatchObject({ ad: 'Matematik', adet: 2 });
        expect(h.konulara[0]).toMatchObject({ ad: 'Türev', adet: 2 });
    });

    it('risk EKSİK sinyalden üretilmez', () => {
        // Hiç veri yok → risk listesi boş, "yüksek risk" uydurulmaz
        const r = dersRiskleri(OGR, { tarihCoz: tarihCozTest });
        expect(r.veri).toBe(false);
        expect(r.yuksek).toBe(0);
    });

    it('iki sinyal birleşince ders yüksek riskli sayılır', () => {
        localStorage.setItem(`student_programs_${OGR}`, JSON.stringify({
            schedule: {
                'gun1-a': { subject: 'Matematik', topic: 'A', type: 'konu' },
                'gun2-b': { subject: 'Matematik', topic: 'B', type: 'konu' },
                'gun3-c': { subject: 'Matematik', topic: 'C', type: 'konu' },
            },
        }));
        localStorage.setItem('program_progress', JSON.stringify({ [OGR]: {} }));   // hiçbiri yapılmadı
        calismaKur([{ date: gunAnahtar(1), subject: 'Matematik', correct: 8, wrong: 12, blank: 5 }]);

        const r = dersRiskleri(OGR, { tarihCoz: tarihCozTest, gun: 30 });
        const mat = r.dersler.find((d) => d.ders === 'Matematik');
        expect(mat.seviye).toBe('yuksek');
        expect(mat.dayanak).toContain('program uyumu düşük');
        expect(mat.dayanak).toContain('isabet oranı düşük');
    });
});

/* ══════════════════════════════════════════════════════════ */
describe('gelişim zinciri', () => {
    it('halka eksikse zincir kurulmuş sayılmaz', () => {
        const z = gelisimZinciri(OGR, 'Test', { tarihCoz: tarihCozTest });
        expect(z.veri).toBe(false);
        expect(z.eksik.length).toBeGreaterThan(0);
        expect(z.halkalar).toHaveLength(4);
    });
});

/* ══════════════════════════════════════════════════════════ */
describe('yorum ve motivasyon', () => {
    it('veri yoksa yorum üretilmez', () => {
        expect(yorumla('programUyumu', { veri: false })).toBeNull();
        expect(yorumla('net', null)).toBeNull();
    });

    it('yorum gerçek sayıları metne taşır', () => {
        const y = yorumla('programUyumu', { veri: true, oran: 90, planlanan: 20, tamamlanan: 18, kacirilan: 2 });
        expect(y.ton).toBe('iyi');
        expect(y.metin).toContain('20');
        expect(y.metin).toContain('18');
    });

    it('düşük uyum "dikkat" tonuyla dürüstçe söylenir', () => {
        const y = yorumla('programUyumu', { veri: true, oran: 40, planlanan: 20, tamamlanan: 8, kacirilan: 12 });
        expect(y.ton).toBe('dikkat');
        expect(y.metin).toContain('geride');
    });

    it('az denemede trend iddia edilmez', () => {
        const y = yorumla('net', { veri: true, yeterliTrend: false, adet: 2 });
        expect(y.ton).toBe('notr');
        expect(y.metin).toContain('en az 3');
    });

    it('MOTİVASYON: hiçbir koşul yoksa null — sahte övgü üretilmez', () => {
        expect(motivasyon({
            uyum: { veri: false }, calisma: { veri: false },
            net: { veri: false }, istikrar: { veri: false },
        })).toBeNull();
    });

    it('MOTİVASYON: düşük performansta övgü üretmez', () => {
        expect(motivasyon({
            uyum: { veri: true, oran: 35 },
            calisma: { veri: true, soruDegisim: -40 },
            net: { veri: true, yeterliTrend: true, yon: 'dusus', adet: 4 },
            istikrar: { veri: true, guncelZincir: 0 },
        })).toBeNull();
    });

    it('MOTİVASYON: gerçek başarıyı en yüksek öncelikle anlatır', () => {
        const m = motivasyon({
            uyum: { veri: true, oran: 88 },
            calisma: { veri: true, soruDegisim: 25 },
            net: { veri: true, yeterliTrend: true, yon: 'yukselis', adet: 4 },
            istikrar: { veri: true, guncelZincir: 5 },
        });
        expect(m).toContain('netlerin yükseliyor');   // öncelik 4
    });
});

/* ══════════════════════════════════════════════════════════
   SALT OKUNURLUK — mimari güvence
   ══════════════════════════════════════════════════════════
   Talimatın en katı şartı: analitik katman mevcut veri akışına
   DOKUNMAZ. Bir gün biri buraya "hesabı önbelleğe alalım" diye
   bir setItem eklerse, o an türetilmiş değer ikinci bir doğruluk
   kaynağına dönüşür ve senkron kaybı sınıfı geri gelir.
   Bu test o anı yakalar.
   ══════════════════════════════════════════════════════════ */
describe('analitik katmanı veri yazmaz', () => {
    it('hiçbir ölçüm localStorage’a yazmaz veya silmez', () => {
        localStorage.clear();
        // Gerçekçi bir veri seti kur
        calismaKur([{ date: gunAnahtar(1), correct: 10, wrong: 2, blank: 1, minutes: 40, subject: 'Matematik' }]);
        localStorage.setItem(`student_programs_${OGR}`, JSON.stringify({
            schedule: { 'gun1-a': { subject: 'Matematik', topic: 'A', type: 'konu' } },
        }));
        localStorage.setItem('program_progress', JSON.stringify({ [OGR]: { 'gun1-a': { status: 'done' } } }));
        localStorage.setItem('error_notebook', JSON.stringify([
            { studentId: OGR, date: gunAnahtar(1), subject: 'Matematik', errorType: 'islem', topic: 'A' },
        ]));

        // Yazma çağrılarını izle
        const setItem = localStorage.setItem;
        const removeItem = localStorage.removeItem;
        const clear = localStorage.clear;
        const cagrilar = [];
        localStorage.setItem = (...a) => { cagrilar.push(['setItem', a[0]]); return setItem.apply(localStorage, a); };
        localStorage.removeItem = (...a) => { cagrilar.push(['removeItem', a[0]]); return removeItem.apply(localStorage, a); };
        localStorage.clear = (...a) => { cagrilar.push(['clear']); return clear.apply(localStorage, a); };

        try {
            const tc = tarihCozTest;
            calismaOzeti(OGR, 30);
            gunlukSeri(OGR, 30);
            istikrar(OGR, 30);
            programUyumu(OGR, { tarihCoz: tc });
            uyumSerisi(OGR, { tarihCoz: tc, hafta: 4 });
            netTrendi(OGR, 'Test');
            hataOzeti(OGR, 30);
            dersRiskleri(OGR, { tarihCoz: tc });
            gelisimZinciri(OGR, 'Test', { tarihCoz: tc });
            yorumla('programUyumu', programUyumu(OGR, { tarihCoz: tc }));
            motivasyon({ uyum: { veri: false }, calisma: { veri: false }, net: { veri: false }, istikrar: { veri: false } });
        } finally {
            localStorage.setItem = setItem;
            localStorage.removeItem = removeItem;
            localStorage.clear = clear;
        }

        expect(cagrilar).toEqual([]);
    });
});
