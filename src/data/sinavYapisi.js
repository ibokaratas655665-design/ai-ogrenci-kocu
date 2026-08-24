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

/* ── 1. OTURUM SÜRELERİ VE SORU SAYILARI ──────────────────────────
   Her sınav KENDİ resmî süresiyle hesaplanır; hiçbir sınavın süresi
   diğerine kopyalanmaz (Program Motoru 3.0 kuralı).

   [1] YKS   — TYT 120s/165dk · AYT 160s/180dk · YDT 80s/120dk
   [8] LGS   — Sözel 50s/75dk · Sayısal 40s/80dk (MEB 2026; iki oturum
       arasında 45 dk ara). Kaynak: MEB okul duyuruları, unirehberi.
   [9] KPSS  — GY-GK 120s/130dk (Lisans/Ön Lisans/Ortaöğretim aynı
       soru dağılımı, farklı zorluk) · Eğitim Bilimleri 80s/100dk.
       Kaynak: ÖSYM kılavuz özetleri, kpss.digital, kpssasistan.
   [10] AGS  — 80 soru/110 dk (ÖSYM 2026 konu dağılımı duyurusu):
       Sözel Yetenek 15, Sayısal Yetenek 15, Tarih 6, T. Coğrafyası 6,
       Eğitimin Temelleri + TMES 30, Mevzuat 8.                         */
export const OTURUMLAR = {
    // YKS
    TYT:  { ad: 'TYT', soru: 120, sureDk: 165 },
    AYT:  { ad: 'AYT', soru: 160, sureDk: 180 },   // aday alanına göre 80 soru işaretler
    YDT:  { ad: 'YDT', soru: 80,  sureDk: 120 },
    // LGS — iki ayrı oturum, ayrı süreler
    LGS_SOZEL:   { ad: 'LGS Sözel', soru: 50, sureDk: 75 },
    LGS_SAYISAL: { ad: 'LGS Sayısal', soru: 40, sureDk: 80 },
    // KPSS
    KPSS_GYGK: { ad: 'KPSS GY-GK', soru: 120, sureDk: 130 },
    KPSS_EB:   { ad: 'KPSS Eğitim Bilimleri', soru: 80, sureDk: 100 },
    /**
     * KPSS ALAN BİLGİSİ — her test 40 soru / 50 dakika.
     * Kaynak: 2026 KPSS Lisans Kılavuzu s. 16, test başına cevaplama
     * süresi tablosu. İSTATİSTİK, 9 test içinde 50 dakika OLMAYAN tek
     * testtir (60 dk); bu yüzden ayrı oturum olarak tanımlıdır.
     */
    KPSS_AB:            { ad: 'KPSS Alan Bilgisi', soru: 40, sureDk: 50 },
    KPSS_AB_ISTATISTIK: { ad: 'KPSS İstatistik', soru: 40, sureDk: 60 },
    // AGS
    AGS: { ad: 'AGS', soru: 80, sureDk: 110 },
};

/**
 * Bölüm kimliğinden deneme oturumu (deneme günü süre hesabı için).
 * ⚠️ 'EB' hem KPSS'de hem AGS'de var; sınav kapsamlı anahtar önce
 * denenir (bkz. bolumOturumu).
 */
export const BOLUM_OTURUMU = {
    TYT: 'TYT', AYT_SAY: 'AYT', AYT_EA: 'AYT', AYT_SOZ: 'AYT', YDT: 'YDT',
    SOZEL: 'LGS_SOZEL', SAYISAL: 'LGS_SAYISAL',
    GY: 'KPSS_GYGK', GK: 'KPSS_GYGK', 'KPSS:EB': 'KPSS_EB',
    // KPSS Alan Bilgisi — İstatistik dışında hepsi 50 dk
    HUKUK: 'KPSS_AB', IKTISAT: 'KPSS_AB', ISLETME: 'KPSS_AB', MALIYE: 'KPSS_AB',
    MUHASEBE: 'KPSS_AB', CEKO: 'KPSS_AB', KAMU_YONETIMI: 'KPSS_AB',
    ULUSLARARASI: 'KPSS_AB', ISTATISTIK: 'KPSS_AB_ISTATISTIK',
    // AGS — 'GENEL' hem AGS bölümü hem KPSS alan kimliği; sınav kapsamlı
    // anahtar önce denendiği için karışmaz
    GENEL: 'AGS', MEVZUAT: 'AGS', 'AGS:EB': 'AGS',
};

/** Sınav kapsamını gözeterek bölümün deneme oturumunu döner. */
export const bolumOturumu = (sinavId, bolumId) =>
    BOLUM_OTURUMU[`${sinavId}:${bolumId}`] ?? BOLUM_OTURUMU[bolumId] ?? null;

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

    /* LGS [8] — Sözel 50: Türkçe 20, İnkılap 10, Din 10, İngilizce 10
                 Sayısal 40: Matematik 20, Fen 20 */
    SOZEL:   { turkce: 20, inkilap: 10, din: 10, ingilizce: 10 },
    SAYISAL: { matematik: 20, fen: 20 },

    /* KPSS [9] — GY 60: Türkçe 30, Matematik 30
                  GK 60: Tarih 27, Coğrafya 18, Vatandaşlık 9, Güncel 6
                  EB 80: alt dağılım ÖSYM'ce ilan edilmez; yaygın
                  gözlem — gelişim 12, öğrenme 14, öğretim 22,
                  ölçme 12, rehberlik 20 (koç değiştirebilir) */
    GY: { turkce: 30, matematik: 30 },
    GK: { tarih: 27, cografya: 18, vatandaslik: 9, guncel: 6 },
    'KPSS:EB': { gelisim: 12, ogrenme: 14, ogretim: 22, olcme: 12, rehberlik: 20 },

    /* AGS [10] — 80 soru: Sözel Yet. 15, Sayısal Yet. 15, Tarih 6,
       T. Coğrafyası 6, Eğitimin Temelleri + TMES 30, Mevzuat 8.
       ⚠️ AGS ve KPSS'nin ikisinde de 'EB' bölüm kimliği var ama soru
       sayıları farklı (30 ↔ 80) — sınav kapsamlı anahtar şart. */
    GENEL:     { turkce: 15, matematik: 15, tarih: 6, cografya: 6 },
    'AGS:EB':  { gelisim: 5, ogrenme: 6, ogretim: 9, olcme: 5, rehberlik: 5 },
    MEVZUAT:   { mevzuat: 8 },

    /* KPSS ALAN BİLGİSİ — her test 40 soru, tek ders.
       Kaynak: 2026 KPSS Lisans Kılavuzu TABLO-1 (s. 34-35).
       Testler tek dersten oluştuğu için tablo birebir 40'tır; ders
       içi konu ağırlıkları examTopics.js'te ÖSYM yüzdelerinden
       türetilmiştir. */
    HUKUK:         { hukuk: 40 },
    IKTISAT:       { iktisat: 40 },
    ISLETME:       { isletme: 40 },
    MALIYE:        { maliye: 40 },
    MUHASEBE:      { muhasebe: 40 },
    CEKO:          { ceko: 40 },
    ISTATISTIK:    { istatistik: 40 },
    KAMU_YONETIMI: { kamuYonetimi: 40 },
    ULUSLARARASI:  { uluslararasiIliskiler: 40 },
};

/**
 * Bölümün ders→soru tablosu. Önce sınav kapsamlı anahtar
 * (`AGS:EB`), sonra düz bölüm kimliği denenir.
 */
export const bolumDersSorulari = (sinavId, bolumId) =>
    DERS_SORULARI[`${sinavId}:${bolumId}`] ?? DERS_SORULARI[bolumId] ?? null;

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

    /* LGS [8] — Sözel 75dk/50s = 1.5 ort.; Sayısal 80dk/40s = 2.0 ort.
       Türkçe LGS'de uzun paragraf ağırlıklıdır, Din/İnkılap bilgi
       sorusudur; toplam satır süreyi verir (20×1.9+10×1.2+10×1.1+10×1.3
       ≈ 74 dk ✓). */
    SOZEL:   { turkce: 1.9, inkilap: 1.2, din: 1.1, ingilizce: 1.3, varsayilan: 1.5 },
    SAYISAL: { matematik: 2.2, fen: 1.8, varsayilan: 2.0 },

    /* KPSS [9] — GY-GK 130dk/120s ≈ 1.08 ort.; GY işlem/paragraf
       ağırlıklı, GK bilgi ağırlıklı ve hızlıdır
       (30×1.5+30×1.6+27×0.7+18×0.7+9×0.6+6×0.5 ≈ 130 dk ✓).
       EB 100dk/80s = 1.25 ort. */
    GY: { turkce: 1.5, matematik: 1.6, varsayilan: 1.55 },
    GK: { tarih: 0.7, cografya: 0.7, vatandaslik: 0.6, guncel: 0.5, varsayilan: 0.7 },
    'KPSS:EB': { varsayilan: 1.25 },

    /* AGS [10] — 110dk/80s ≈ 1.38 ort.; yetenek testleri yavaş,
       mevzuat/GK hızlıdır (15×1.6+15×1.8+6×0.8+6×0.8+30×1.2+8×0.9
       ≈ 110 dk ✓). */
    GENEL:    { turkce: 1.6, matematik: 1.8, tarih: 0.8, cografya: 0.8, varsayilan: 1.4 },
    'AGS:EB': { varsayilan: 1.2 },
    MEVZUAT:  { mevzuat: 0.9, varsayilan: 0.9 },

    /* KPSS ALAN BİLGİSİ — resmî süreden birebir: 40 soru / 50 dakika
       = 1.25 dk. İstatistik tek istisnadır: 40 soru / 60 dakika = 1.5 dk
       (2026 KPSS Lisans Kılavuzu s. 16). Bu testler tek dersten oluşur,
       bu yüzden ders kırılımı gerekmez — süre doğrudan resmîdir. */
    HUKUK:         { varsayilan: 1.25 },
    IKTISAT:       { varsayilan: 1.25 },
    ISLETME:       { varsayilan: 1.25 },
    MALIYE:        { varsayilan: 1.25 },
    MUHASEBE:      { varsayilan: 1.25 },
    CEKO:          { varsayilan: 1.25 },
    KAMU_YONETIMI: { varsayilan: 1.25 },
    ULUSLARARASI:  { varsayilan: 1.25 },
    ISTATISTIK:    { varsayilan: 1.5 },

    varsayilan: 1.5,
};

/**
 * Bir sorunun ortalama çözüm süresi (dk). Sınav kapsamlı anahtar
 * önce denenir; sözel ve sayısal dersler asla aynı süreyi almaz.
 */
export const soruSuresiDk = (bolumId, ders, sinavId = null) => {
    const tablo = (sinavId && SORU_SURESI_DK[`${sinavId}:${bolumId}`])
        || SORU_SURESI_DK[bolumId];
    if (!tablo) return SORU_SURESI_DK.varsayilan;
    return tablo[ders] ?? tablo.varsayilan ?? SORU_SURESI_DK.varsayilan;
};

/* ── 4. ANA DERSLER — sınav/alan bazlı ────────────────────────────
   "Kapasite elverdikçe her hafta programda bulunmalı" listesi.
   Sıra = öncelik sırası. Anahtarlar `{bolumId}:{ders}` biçiminde.
   YKS alan bazlı; diğer sınavlarda alan yoksa sınav kimliği kullanılır. */
export const ANA_DERSLER = {
    // YKS — alan bazlı
    SAY: ['TYT:turkce', 'TYT:matematik', 'AYT_SAY:matematik', 'AYT_SAY:fizik', 'AYT_SAY:kimya', 'AYT_SAY:biyoloji'],
    EA:  ['TYT:turkce', 'TYT:matematik', 'AYT_EA:matematik', 'AYT_EA:edebiyat', 'AYT_EA:tarih', 'AYT_EA:cografya'],
    SOZ: ['TYT:turkce', 'TYT:matematik', 'AYT_SOZ:edebiyat', 'AYT_SOZ:tarih', 'AYT_SOZ:cografya', 'AYT_SOZ:felsefe'],
    DIL: ['TYT:turkce', 'TYT:matematik', 'YDT:okuma', 'YDT:kelime', 'YDT:dilbilgisi'],
    TYT: ['TYT:turkce', 'TYT:matematik'],
    // LGS [8] — en yüksek soru ağırlıklı iki ders
    LGS: ['SOZEL:turkce', 'SAYISAL:matematik', 'SAYISAL:fen'],
    // KPSS [9] — GY iki ders + GK'nin en ağır dersi
    KPSS: ['GY:turkce', 'GY:matematik', 'GK:tarih'],
    KPSS_OGRETMEN: ['GY:turkce', 'GY:matematik', 'EB:ogretim', 'EB:rehberlik'],
    /**
     * KPSS A Grubu: GY-GK zorunlu, üstüne adayın kendi Alan Bilgisi
     * testi gelir. Alan testi 40 soruyla tek başına GY veya GK kadar
     * ağırlıktadır; haftalık sürekliliği bu yüzden garanti edilir.
     */
    KPSS_A_HUKUK:         ['GY:turkce', 'GY:matematik', 'HUKUK:hukuk'],
    KPSS_A_IKTISAT:       ['GY:turkce', 'GY:matematik', 'IKTISAT:iktisat'],
    KPSS_A_ISLETME:       ['GY:turkce', 'GY:matematik', 'ISLETME:isletme'],
    KPSS_A_MALIYE:        ['GY:turkce', 'GY:matematik', 'MALIYE:maliye'],
    KPSS_A_MUHASEBE:      ['GY:turkce', 'GY:matematik', 'MUHASEBE:muhasebe'],
    KPSS_A_CEKO:          ['GY:turkce', 'GY:matematik', 'CEKO:ceko'],
    KPSS_A_ISTATISTIK:    ['GY:turkce', 'GY:matematik', 'ISTATISTIK:istatistik'],
    KPSS_A_KAMU_YONETIMI: ['GY:turkce', 'GY:matematik', 'KAMU_YONETIMI:kamuYonetimi'],
    KPSS_A_ULUSLARARASI:  ['GY:turkce', 'GY:matematik', 'ULUSLARARASI:uluslararasiIliskiler'],
    // AGS [10] — ağırlık merkezi Eğitim Bilimleri (30/80)
    AGS: ['EB:ogretim', 'EB:rehberlik', 'GENEL:turkce', 'GENEL:matematik'],
};

/* ── 4b. BİLİŞSEL GEÇİŞ KURALLARI — sınava özgü [5][7] ────────────
   Amaç: aynı zihinsel yükteki dersler gereksiz uzun bloklar hâlinde
   arka arkaya gelmesin. YKS'nin sayısal/sözel ikilisi diğer
   sınavlara KÖR kopyalanmaz; her sınavın gerçek ders yapısına göre
   grup tanımlanır. Motor yalnızca "grup" adını bilir.               */
export const COGNITIVE_SWITCHING_RULES = {
    YKS: {
        gruplar: {
            sayisal: ['matematik', 'geometri', 'fizik', 'kimya', 'biyoloji', 'fen'],
            sozel: ['turkce', 'edebiyat', 'tarih', 'cografya', 'felsefe', 'din',
                'kelime', 'dilbilgisi', 'okuma', 'ceviri', 'iletisim', 'ingilizce'],
        },
        varsayilanGrup: 'sozel',
    },
    LGS: {
        // LGS'de İngilizce ezber+dil, Din/İnkılap bilgi ağırlıklı;
        // Matematik/Fen işlem-akıl yürütme.
        gruplar: {
            islem: ['matematik', 'fen'],
            dil: ['turkce', 'ingilizce'],
            bilgi: ['inkilap', 'din'],
        },
        varsayilanGrup: 'bilgi',
    },
    KPSS: {
        // GY işlem/dil çözümleme, GK ve EB ezber-kavrama ağırlıklı.
        gruplar: {
            islem: ['matematik', 'geometri', 'istatistik', 'muhasebe'],
            dil: ['turkce'],
            ezber: ['tarih', 'cografya', 'vatandaslik', 'guncel'],
            kuram: ['gelisim', 'ogrenme', 'ogretim', 'olcme', 'rehberlik'],
            /**
             * Alan Bilgisi testleri mevzuat/kuram okuma-kavrama
             * ağırlıklıdır; İstatistik ve Muhasebe ise işlem yükü
             * taşır ve yukarıda `islem` grubuna alınmıştır.
             */
            alan: ['hukuk', 'iktisat', 'isletme', 'maliye', 'ceko',
                'kamuYonetimi', 'uluslararasiIliskiler'],
        },
        varsayilanGrup: 'ezber',
    },
    AGS: {
        gruplar: {
            islem: ['matematik'],
            dil: ['turkce'],
            ezber: ['tarih', 'cografya', 'mevzuat'],
            kuram: ['gelisim', 'ogrenme', 'ogretim', 'olcme', 'rehberlik'],
        },
        varsayilanGrup: 'ezber',
    },
};

/** Bir dersin bilişsel grubu — sınava göre. */
export const bilisselGrup = (sinavId, ders) => {
    const kural = COGNITIVE_SWITCHING_RULES[sinavId] || COGNITIVE_SWITCHING_RULES.YKS;
    for (const [grup, dersler] of Object.entries(kural.gruplar)) {
        if (dersler.includes(ders)) return grup;
    }
    return kural.varsayilanGrup;
};

/** Geriye dönük: YKS sayısal dersleri (eski çağrılar kırılmasın). */
export const SAYISAL_DERSLER = new Set(COGNITIVE_SWITCHING_RULES.YKS.gruplar.sayisal);

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
    paragraf: 'ilk',      // yüksek dikkat işi — erken dilim [7]
    /* 25.08.2026: 'ilk' idi ama hiç yerleştirme kodu yoktu (tanımlı,
       hiç okunmuyordu). Koç isteği: günün SONDAN 2. etüdü — kitap
       okuma (gün kapanışı, 'son') ondan hemen önce. */
    problem:  'sondan2',  // günün kapanışına yakın, kitaptan hemen önce
    tekrar:   'son',      // günün tekrarı — gün sonu pekiştirme [4][7]
    kitap:    'son',      // serbest okuma — düşük yük, gün kapanışı
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
    /**
     * Aynı dersin arka arkaya en çok kaç etüdü gelebilir.
     * 3+ blok (Türkçe·Türkçe·Türkçe) serpiştirme ilkesine aykırıdır [5];
     * konu sürekliliği için 2 yeterlidir.
     *
     * ⚠️ KESİN SINIR — konu etüdü, soru etüdü ve tekrar AYNI DERS
     * sayılır; etüt türü değiştirilerek aşılamaz. Eskiden aynı konunun
     * zinciri sürerken 3'e esneyen bir istisna vardı; ölçüldüğünde her
     * programda üçlü "Matematik·Matematik·Matematik" blokları ürettiği
     * görüldü ve kaldırıldı.
     */
    AYNI_DERS_ARDISIK_EN_COK: 2,
    /** Aynı bilişsel grubun arka arkaya en çok etüdü [5][7]. */
    AYNI_GRUP_ARDISIK_EN_COK: 3,
    /**
     * HAFTALIK / AYLIK YÜK DENGESİ EŞİĞİ — değişim katsayısı
     * (standart sapma ÷ ortalama).
     *
     * Neden oran, neden mutlak fark değil: program uzunluğundan
     * bağımsız okunur; 4 haftalık ve 40 haftalık programda aynı anlamı
     * taşır. %20, "her hafta birebir eşit olsun" demek değildir —
     * sınav haftası, tatil ve konu bitişi gibi gerçek nedenlerle
     * dalgalanmaya yer bırakır, ama 30/11/28/9 gibi (değişim ~%50)
     * savunulamaz dağılımları yakalar [§10, §37].
     */
    YUK_DEGISIM_ESIGI: 0.20,
};

export default {
    OTURUMLAR, BOLUM_OTURUMU, bolumOturumu, DERS_SORULARI, bolumDersSorulari,
    OTURUM_KATKISI, SORU_SURESI_DK, soruSuresiDk, ANA_DERSLER,
    COGNITIVE_SWITCHING_RULES, bilisselGrup, SAYISAL_DERSLER,
    TEKRAR_ARALIKLARI_GUN, DONEMLIK_TEKRAR_GUN, EKSTRA_KONUM,
    MOTOR_VARSAYILANLARI,
};
