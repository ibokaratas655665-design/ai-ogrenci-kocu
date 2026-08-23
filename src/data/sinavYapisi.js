/**
 * 📐 SINAV YAPISI VE PROGRAM MOTORU PARAMETRELERİ — TEK KAYNAK
 *
 * Program Motoru 2.0'ın bütün sayısal dayanakları BU dosyadadır.
 * Kural: motorda "sihirli sayı" yasak — her sabit burada, kaynağı ve
 * gerekçesiyle durur; koçun değiştirebildikleri program kriterlerinden
 * ezilebilir (bkz. programMotoru.js → kriterler).
 *
 * ── KAYNAKLAR (23.08.2026'da doğrulandı) ─────────────────────────
 * [1] ÖSYM 2026 YKS yapısı (kılavuz özetleri):
 *     TYT 120 soru / 165 dk; AYT 160 soru / 180 dk; YDT 80 soru / 120 dk.
 *     TYT: Türkçe 40, Matematik 40 (mat+geo), Fen 20 (F7/K7/B6),
 *     Sosyal 20 (Tarih 5, Coğrafya 5, Felsefe 5, Din 5).
 *     AYT: Matematik 40 (~31 mat + ~9 geo), Fen 40 (F14/K13/B13),
 *     Edebiyat–Sosyal-1 40 (Edb 24, Tarih-1 10, Coğ-1 6),
 *     Sosyal-2 40 (Tarih-2 11, Coğ-2 11, Felsefe gr. 12, Din 6).
 *     Puan: her yerleştirme puanında TYT %40 + alan testleri %60.
 *     (egitim.net.tr, unikazan.com, unirehberi.com — ÖSYM kılavuzunu
 *     aktaran güncel kaynaklar; test toplamları yıllardır sabit.)
 * [2] YDT alt dağılımı ÖSYM tarafından resmî ilan edilmez; güncel
 *     kitapçık analizlerine göre yaklaşık: okuma-paragraf ~%35,
 *     kelime ~%15, dil bilgisi ~%15, çeviri ~%19, iletişim ~%16
 *     (rehberpanda.com 2026 YDT rehberi). YAKLAŞIKTIR — koç
 *     ağırlıkları program kriterlerinden değiştirebilir.
 * [3] Aralıklı tekrar: Ebbinghaus (1885) unutma eğrisi;
 *     Cepeda ve ark. (2006, Psychological Bulletin) meta-analizi —
 *     dağıtılmış tekrar toplu tekrardan üstün;
 *     Cepeda ve ark. (2008, Psychological Science) — en verimli
 *     tekrar aralığı, hedef sınava kalan sürenin ~%10-20'si.
 * [4] Geri getirme alıştırması (retrieval practice):
 *     Roediger & Karpicke (2006, Psychological Science) — test ederek
 *     çalışmak yeniden okumaktan kalıcıdır → tekrar etütleri SORU
 *     ÇÖZEREK yapılır; Dunlosky ve ark. (2013, PSPI) — en yüksek
 *     faydalı iki teknik: practice testing + distributed practice.
 * [5] Serpiştirme (interleaving): Rohrer & Taylor (2007, Instr Sci) —
 *     ders/konu türlerini dönüşümlü çalışmak bloklamadan üstün →
 *     sayısal/sözel ardışıklık kuralının dayanağı. Yeni konu
 *     kazanımında kısa bloklar (aynı konu 2 etüt) makuldür.
 * [6] Geri bildirim zamanı: Butler & Roediger (2007, Mem&Cog) —
 *     sınav sonrası geri bildirim öğrenmeyi kalıcılaştırır →
 *     deneme analizi denemeyle AYNI GÜN, mümkünse hemen sonra.
 * [7] Gün içi bilişsel performans: Pope (2016, REStat — okul saati
 *     çalışması) ve ergen kronotipi literatürü — yoğun bilişsel iş
 *     günün erken/orta dilimlerinde daha verimli → paragraf/problem
 *     gibi yüksek yüklü ekstralar günün İLK yarısına, günün tekrarı
 *     ve serbest okuma SON etüde (uyku öncesi pekiştirme,
 *     Rasch & Born 2013, Physiol Rev).
 */

/* ── 1. OTURUM SÜRELERİ VE SORU SAYILARI [1] ──────────────────── */
export const OTURUMLAR = {
    TYT:  { ad: 'TYT', soru: 120, sureDk: 165 },
    AYT:  { ad: 'AYT', soru: 160, sureDk: 180 },   // aday alanına göre 80 soru işaretler
    YDT:  { ad: 'YDT', soru: 80,  sureDk: 120 },
    LGS:  { ad: 'LGS', soru: 90,  sureDk: 155 },   // Sözel 50/75dk + Sayısal 40/80dk
    KPSS: { ad: 'KPSS GY-GK', soru: 120, sureDk: 130 }, // yaklaşık — koç değiştirebilir
    AGS:  { ad: 'AGS', soru: 80, sureDk: 120 },         // yaklaşık — koç değiştirebilir
};

/** Bölüm kimliğinden deneme oturumu (deneme günü süre hesabı için). */
export const BOLUM_OTURUMU = {
    TYT: 'TYT', AYT_SAY: 'AYT', AYT_EA: 'AYT', AYT_SOZ: 'AYT', YDT: 'YDT',
    SOZEL: 'LGS', SAYISAL: 'LGS', GY: 'KPSS', GK: 'KPSS', EB: 'KPSS',
    GENEL: 'AGS', MEVZUAT: 'AGS',
};

/* ── 2. BÖLÜM İÇİ DERS SORU SAYILARI [1][2] ───────────────────────
   Anahtarlar examTopics.js ders anahtarlarıyla BİREBİR aynıdır.
   AYT matematik testinin mat/geo kırılımı ve YDT alt dağılımı
   yaklaşıktır (ÖSYM ilan etmez), toplamlar resmîdir.               */
export const DERS_SORULARI = {
    TYT: {
        turkce: 40, matematik: 32, geometri: 8,
        fizik: 7, kimya: 7, biyoloji: 6,
        tarih: 5, cografya: 5, felsefe: 5, din: 5,
    },
    AYT_SAY: { matematik: 31, geometri: 9, fizik: 14, kimya: 13, biyoloji: 13 },
    AYT_EA:  { matematik: 31, geometri: 9, edebiyat: 24, tarih: 10, cografya: 6 },
    AYT_SOZ: { edebiyat: 24, tarih: 21, cografya: 17, felsefe: 12, din: 6 },
    YDT:     { okuma: 28, ceviri: 15, iletisim: 13, kelime: 12, dilbilgisi: 12 },
    // LGS/KPSS/AGS: bölüm toplamları examTopics.SINAVLAR'da; ders
    // kırılımı motorda konu ağırlıklarından türetilir.
};

/**
 * Puan katkı katsayıları [1]: her YKS puan türünde TYT %40, alan
 * testleri %60. Haftalık ders payı bu katkıyla ağırlıklanır —
 * "Matematik ve Türkçe, Fen ve Sosyalın 2 katı kapsam" ilkesinin
 * sayısal hâli.
 */
export const OTURUM_KATKISI = { TYT: 0.4, ALAN: 0.6, TEK_BOLUM: 1 };

/* ── 3. SORU BAŞINA SÜRE (dk) — sınav temposundan [1] ─────────────
   Türetme: bölüm süresi, test içi tempoya bölüştürüldü (ör. TYT'de
   paragraf ağırlıklı Türkçe ve işlem ağırlıklı Matematik, bilgi
   ağırlıklı Sosyalden yavaştır; satır toplamları oturum süresini
   verir: TYT 40×1.5+40×1.75+20×1.0+20×0.75 = 165 dk ✓).
   ÇALIŞMA temposu için PRATIK_CARPANI uygulanır (çözüm + kontrol +
   işaretleme payı); koç program kriterlerinden değiştirebilir.      */
export const SORU_SURESI_DK = {
    TYT: {
        turkce: 1.5, matematik: 1.75, geometri: 1.75,
        fizik: 1.0, kimya: 1.0, biyoloji: 1.0,
        tarih: 0.75, cografya: 0.75, felsefe: 0.75, din: 0.75,
    },
    AYT_SAY: { matematik: 2.5, geometri: 2.5, fizik: 2.0, kimya: 2.0, biyoloji: 2.0 },
    AYT_EA:  { matematik: 2.5, geometri: 2.5, edebiyat: 2.0, tarih: 2.0, cografya: 2.0 },
    AYT_SOZ: { edebiyat: 2.25, tarih: 2.25, cografya: 2.25, felsefe: 2.25, din: 2.25 },
    YDT:     { okuma: 1.6, ceviri: 1.6, iletisim: 1.4, kelime: 1.3, dilbilgisi: 1.4 },
    SOZEL:   { varsayilan: 1.5 },   // LGS sözel 75dk/50s
    SAYISAL: { varsayilan: 2.0 },   // LGS sayısal 80dk/40s
    varsayilan: 1.5,
};

export const soruSuresiDk = (bolumId, ders) => {
    const tablo = SORU_SURESI_DK[bolumId];
    if (!tablo) return SORU_SURESI_DK.varsayilan;
    return tablo[ders] ?? tablo.varsayilan ?? SORU_SURESI_DK.varsayilan;
};

/* ── 4. PUAN TÜRÜNE GÖRE ANA DERSLER ──────────────────────────────
   "Kapasite elverdikçe her hafta programda bulunmalı" listesi.
   Sıra = öncelik sırası. Anahtarlar `{bolumId}:{ders}` biçiminde.   */
export const ANA_DERSLER = {
    SAY: ['TYT:turkce', 'TYT:matematik', 'AYT_SAY:matematik', 'AYT_SAY:fizik', 'AYT_SAY:kimya', 'AYT_SAY:biyoloji'],
    EA:  ['TYT:turkce', 'TYT:matematik', 'AYT_EA:matematik', 'AYT_EA:edebiyat', 'AYT_EA:tarih', 'AYT_EA:cografya'],
    SOZ: ['TYT:turkce', 'TYT:sosyal', 'TYT:matematik', 'AYT_SOZ:edebiyat', 'AYT_SOZ:tarih', 'AYT_SOZ:cografya', 'AYT_SOZ:felsefe'],
    DIL: ['TYT:turkce', 'TYT:matematik', 'YDT:okuma', 'YDT:kelime', 'YDT:dilbilgisi'],
    TYT: ['TYT:turkce', 'TYT:matematik', 'TYT:fen', 'TYT:sosyal'],
};

/** Sayısal karakterli dersler — sayısal/sözel ardışıklığı için [5]. */
export const SAYISAL_DERSLER = new Set([
    'matematik', 'geometri', 'fizik', 'kimya', 'biyoloji', 'fen',
]);

/* ── 5. TEKRAR SİSTEMİ [3][4] ─────────────────────────────────────
   Konu işlendiği günden itibaren gün cinsinden aralıklar. Genişleyen
   dizi: kısa aralıklı ilk tekrar unutma eğrisini kırar, sonrakiler
   kalıcılığı uzatır. Tekrar etüdü SORU ÇÖZEREK yapılır [4].
   Koç program kriterlerinden diziyi değiştirebilir.                 */
export const TEKRAR_ARALIKLARI_GUN = [1, 7, 30];
export const DONEMLIK_TEKRAR_GUN = 90;   // uzun programlarda isteğe bağlı 4. halka

/* ── 6. EKSTRA ÇALIŞMALARIN GÜN İÇİ KONUMU [4][6][7] ─────────────
   'ilk'  = günün ilk yarısındaki en erken boş etüt
   'orta' = günün ortası
   'son'  = günün son boş etüdü
   Ekstralar DERS SAYILMAZ (günlük ders limitine girmez) ama etüt
   kapasitesi tüketir.                                               */
export const EKSTRA_KONUM = {
    paragraf: 'ilk',    // yüksek dikkat işi — erken dilim [7]
    problem:  'ilk',    // yüksek işlem yükü — erken dilim [7]
    tekrar:   'son',    // günün tekrarı — gün sonu pekiştirme [4][7]
    kitap:    'son',    // serbest okuma — düşük yük, gün kapanışı
    analiz:   'deneme-sonrasi', // deneme ile aynı gün, hemen ardından [6]
};

/* ── 7. MOTOR VARSAYILANLARI (koç kriterlerinden ezilebilir) ────── */
export const MOTOR_VARSAYILANLARI = {
    /** Bir etüdün dakikası — soru etüdü hesabının paydası. */
    ETUT_SURESI_DK: 40,
    /** Çalışma temposu = sınav temposu × bu çarpan (kontrol payı). */
    PRATIK_CARPANI: 1.2,
    /**
     * Konu etüdü ihtiyacı: ceil(agirlik × zorlukFaktörü / KONU_PUAN_KAPASITESI).
     * "Bir etütte işlenebilecek ağırlık×zorluk puanı" — ör. Paragrafta
     * Anlam (a=12, z=2) → 12×1.0/3 = 4 etüt; dar-kolay konu → 1 etüt.
     */
    KONU_PUAN_KAPASITESI: 3,
    /** Zorluk çarpanları (z=1 kolay, 2 orta, 3 zor). */
    ZORLUK_FAKTORU: { 1: 0.8, 2: 1.0, 3: 1.3 },
    /** Konu başına etüt sınırları (tek konu programı yutmasın). */
    KONU_ETUT_MIN: 1,
    KONU_ETUT_MAX: 4,
    /** Soru etüdü üst sınırı (konu başına). */
    SORU_ETUT_MAX: 6,
    /** Bitmiş konu yine seçildiyse iş yükü çarpanı (pekiştirme). */
    BITMIS_KONU_CARPANI: 0.5,
    /** Deneme analizi için ayrılan etüt sayısı [6]. */
    ANALIZ_ETUT: 1,
    /** Haftalık esnek/telafi etüdü — koç 0..4 arası seçer. */
    ESNEK_ETUT_HAFTALIK: 1,
    ESNEK_ETUT_EN_COK: 4,
};

export default {
    OTURUMLAR, BOLUM_OTURUMU, DERS_SORULARI, OTURUM_KATKISI,
    SORU_SURESI_DK, soruSuresiDk, ANA_DERSLER, SAYISAL_DERSLER,
    TEKRAR_ARALIKLARI_GUN, DONEMLIK_TEKRAR_GUN, EKSTRA_KONUM,
    MOTOR_VARSAYILANLARI,
};
