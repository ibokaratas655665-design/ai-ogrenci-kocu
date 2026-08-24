/**
 * ⚙️ PROGRAM MOTORU 2.0 — bilimsel/veri odaklı haftalık program üretici
 *
 * Saf modül: DOM yok, localStorage yok — girdiler parametre, çıktı
 * { schedule, stats, uyarilar }. Bütün sayısal dayanaklar
 * data/sinavYapisi.js'ten gelir (kaynaklarıyla); koç, kriterlerle
 * ezebilir. Kod içinde açıklamasız sabit YASAK.
 *
 * Hücre modeli mevcut sistemle birebir uyumludur:
 *   anahtar: m{ay}-w{hafta}-{GünAdı}-{etütIndex}
 *   değer:   { subject, topic, type, exam, round? }
 *   type ∈ konu | soru | tekrar | deneme | analiz | paragraf | kitap | mola
 *
 * KESİN KURALLAR (talimat 22.08.2026):
 *  - Günlük "en fazla X ders" ve "en fazla Y konu" sınırları HİÇBİR
 *    yerleştirme yolunda aşılmaz (ders sayımına yalnız konu/soru/tekrar
 *    girer; deneme/analiz/paragraf/kitap/esnek EXTRA_STUDY'dir).
 *  - Konu etütleri bitmeden o konunun soru etüdü gelmez; biter bitmez
 *    soru etütleri zincirin devamına yerleşir.
 *  - Aynı konunun etüt ihtiyacı sürerken 2 etüt üst üste (blok) verilir;
 *    bloklar arasında sayısal/sözel dönüşümü gözetilir [5].
 *  - Deneme etüdü sayısı gerçek oturum süresinden hesaplanır; analiz
 *    ayrı çalışma türüdür ve denemenin hemen ardından gelir [6].
 */

import {
    OTURUMLAR, bolumOturumu, bolumDersSorulari, OTURUM_KATKISI,
    soruSuresiDk, ANA_DERSLER, bilisselGrup,
    TEKRAR_ARALIKLARI_GUN, EKSTRA_KONUM, MOTOR_VARSAYILANLARI as M,
} from '../data/sinavYapisi';

const GUNLER_VARSAYILAN = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

/** Koçun ayarladığı kriterlerin varsayılanları (UI: Program Kriterleri). */
export const KRITER_VARSAYILANLARI = {
    gunlukMaxDers: 3,          // günde en fazla farklı ders (konu/soru/tekrar)
    gunlukMaxKonu: 2,          // günde en fazla farklı KONU çalışması
    etutSuresiDk: M.ETUT_SURESI_DK,
    pratikCarpani: M.PRATIK_CARPANI,
    denemeAcik: true,
    denemeGunu: 'Pazar',
    analizEtut: M.ANALIZ_ETUT,
    esnekHaftalik: M.ESNEK_ETUT_HAFTALIK,   // 0..4, koç belirler
    paragrafAcik: true,
    kitapAcik: true,
    gunTekrariAcik: false,     // günün tekrarı (gün sonu) — kapasite yer
    tekrarAcik: true,
    tekrarAraliklari: TEKRAR_ARALIKLARI_GUN,
    soruEtutleriAcik: true,
    tekrarErtelemeEnCok: 5,    // vadesi dolan tekrar en çok bu kadar gün ertelenir
};

const zorlukFaktoru = (z) => M.ZORLUK_FAKTORU[z] ?? M.ZORLUK_FAKTORU[2];
const sinir = (v, alt, ust) => Math.max(alt, Math.min(ust, v));

/**
 * Bir konunun etüt ihtiyacı — ağırlık × zorluk / etüt kapasitesi [1].
 * Bitmiş konu (pekiştirme) yarı yükle döner.
 */
export const konuEtutIhtiyaci = (konu) => {
    const ham = Math.ceil((konu.agirlik ?? 1) * zorlukFaktoru(konu.zorluk) / M.KONU_PUAN_KAPASITESI);
    const taban = sinir(ham, M.KONU_ETUT_MIN, M.KONU_ETUT_MAX);
    return konu.bitti ? Math.max(1, Math.round(taban * M.BITMIS_KONU_CARPANI)) : taban;
};

/**
 * Soru etüdü ihtiyacı — kalan hedef soru × soru süresi × pratik payı /
 * etüt süresi [1][4]. "120 soru = 2 etüt" gibi sabit eşleme YOK.
 */
export const soruEtutIhtiyaci = (konu, kriterler = {}, sinavId = null) => {
    const kalan = Math.max(0, konu.kalanSoru ?? konu.hedef ?? 0);
    if (!kalan) return konu.bitti ? 1 : 0;   // bitmişe 1 pekiştirme sorusu etüdü
    const dakika = kalan
        * soruSuresiDk(konu.bolum, konu.ders, sinavId)
        * (kriterler.pratikCarpani ?? M.PRATIK_CARPANI);
    return sinir(Math.ceil(dakika / (kriterler.etutSuresiDk ?? M.ETUT_SURESI_DK)), 1, M.SORU_ETUT_MAX);
};

/**
 * Deneme kaç etüt sürer — o sınavın GERÇEK oturum süresi / etüt süresi.
 * Hiçbir sınavın süresi diğerinden kopyalanmaz [1][8][9][10].
 */
export const denemeEtutSayisi = (bolumId, kriterler = {}, sinavId = null) => {
    const oturum = OTURUMLAR[bolumOturumu(sinavId, bolumId) || bolumId];
    if (!oturum) return 3; // oturumu bilinmeyen sınav — QA uyarısı üretir
    return Math.max(1, Math.ceil(oturum.sureDk / (kriterler.etutSuresiDk ?? M.ETUT_SURESI_DK)));
};

/**
 * Haftalık ders payları — o sınavın kendi soru dağılımı × oturum
 * katkısı. YKS'de TYT %40 / alan %60; tek oturumlu sınavlarda katkı 1.
 */
export const dersPaylari = (konular, sinavId = null) => {
    /**
     * RESMÎ SORU SAYISI OLMAYAN DERSLER
     *
     * Sınav kurumu her dersin soru sayısını ayrı yayımlamaz. Somut örnek:
     * ÖSYM, KPSS Genel Yetenek için yalnızca "Sözel Bölüm %50 · Sayısal
     * Bölüm %50" der; Sayısal Bölüm'ün içindeki matematik/geometri
     * ayrımını hiç yayımlamaz. Bu yüzden `DERS_SORULARI.GY` tablosunda
     * geometri satırı yok — ama katalogda 6 geometri konusu var.
     *
     * Eski davranış boşluğu "ilk konunun ağırlığı × 4" ile dolduruyordu:
     * dersin payı listede hangi konunun ÖNCE geldiğine bağlıydı ve
     * geometri programda neredeyse hiç yer bulmuyordu.
     *
     * Yerine dersin KENDİ konu ağırlıkları toplanır. `agirlik`, katalogda
     * "bu konudan sınavda tipik olarak kaç soru gelir" demek — yani resmî
     * soru sayısıyla aynı ölçekte. Böylece uydurma bir sabit konmadan,
     * eldeki bilgiden tutarlı bir pay türetilir.
     */
    const agirlikToplami = new Map();
    for (const k of konular) {
        const anahtar = `${k.bolum}:${k.ders}`;
        agirlikToplami.set(anahtar, (agirlikToplami.get(anahtar) || 0) + (k.agirlik ?? 1));
    }

    const pay = new Map();
    for (const k of konular) {
        const anahtar = `${k.bolum}:${k.ders}`;
        if (pay.has(anahtar)) continue;
        const soru = bolumDersSorulari(sinavId, k.bolum)?.[k.ders]
            ?? agirlikToplami.get(anahtar);
        const katki = k.bolum === 'TYT' ? OTURUM_KATKISI.TYT
            : (k.bolum.startsWith('AYT') || k.bolum === 'YDT') ? OTURUM_KATKISI.ALAN
            : OTURUM_KATKISI.TEK_BOLUM;
        pay.set(anahtar, Math.max(1, soru) * katki);
    }
    return pay;
};

/* ══════════════════════════════════════════════════════════════ */

export function programUret({
    konular = [],          // [{bolum, ders, dersAd, konu, agirlik, zorluk, hedef, kalanSoru, bitti}]
    sinavId = 'YKS',       // YKS | LGS | KPSS | AGS
    alanId = null,         // YKS: SAY|EA|SOZ|DIL|TYT · KPSS: GENEL|OGRETMEN · diğer: null
    kriterler: kriterlerGiris = {},
    aylar = 1,
    haftaPerAy = 4,
    gunlukEtut = 6,
    gunler = GUNLER_VARSAYILAN,
    kapaliEtutler = {},    // { 'Pazartesi': [0,2] }
    mevcutSchedule = {},   // dolu hücrelerin üzerine yazılmaz
}) {
    const kriterler = { ...KRITER_VARSAYILANLARI, ...kriterlerGiris };
    const uyarilar = [];
    const schedule = {};
    const grubu = (ders) => bilisselGrup(sinavId, ders);

    /* ── 1. Zaman çizelgesi ─────────────────────────────────── */
    const gunListesi = [];
    for (let ay = 1; ay <= aylar; ay++) {
        for (let hafta = 1; hafta <= haftaPerAy; hafta++) {
            for (const gun of gunler) {
                const acik = [];
                for (let e = 0; e < gunlukEtut; e++) {
                    const anahtar = `m${ay}-w${hafta}-${gun}-${e}`;
                    if ((kapaliEtutler[gun] || []).includes(e)) continue;
                    if (mevcutSchedule[anahtar]) continue;
                    acik.push({ anahtar, etut: e });
                }
                gunListesi.push({
                    gun, ay, hafta,
                    haftaIndex: (ay - 1) * haftaPerAy + (hafta - 1),
                    gunIndex: gunListesi.length,
                    acik,
                });
            }
        }
    }

    const yaz = (hucre, deger) => { schedule[hucre.anahtar] = deger; };
    const al = (g, konum = 'ilk') => {
        if (!g.acik.length) return null;
        if (konum === 'son') return g.acik.pop();
        if (konum === 'orta') return g.acik.splice(Math.floor(g.acik.length / 2), 1)[0];
        return g.acik.shift();
    };

    /* ── 2. Deneme + analiz — her sınav KENDİ oturumuyla [1][6][8][9][10] ──
       Deneme bölümü haftalara dönüşümlü verilir: YKS'de TYT ↔ alan
       bölümü, LGS'de Sözel ↔ Sayısal, KPSS'de GY-GK ↔ EB. */
    const DENEME_BOLUMLERI = {
        YKS: { SAY: ['TYT', 'AYT_SAY'], EA: ['TYT', 'AYT_EA'], SOZ: ['TYT', 'AYT_SOZ'], DIL: ['TYT', 'YDT'], TYT: ['TYT'] },
        LGS: { _: ['SOZEL', 'SAYISAL'] },
        KPSS: { OGRETMEN: ['GY', 'EB'], GENEL: ['GY'], _: ['GY'] },
        AGS: { _: ['GENEL', 'EB'] },
    };
    const denemeBolumleri = (() => {
        const tablo = DENEME_BOLUMLERI[sinavId] || DENEME_BOLUMLERI.YKS;
        const secilen = tablo[alanId] || tablo._ || Object.values(tablo)[0];
        // Yalnızca koçun konu seçtiği bölümlerle sınırla; yoksa hepsi
        const secilenBolumler = new Set(konular.map((k) => k.bolum));
        const suzulmus = secilen.filter((b) => secilenBolumler.has(b));
        return suzulmus.length ? suzulmus : secilen;
    })();

    if (kriterler.denemeAcik) {
        let sira = 0;
        for (const g of gunListesi) {
            if (g.gun !== kriterler.denemeGunu || !g.acik.length) continue;
            const bolumId = denemeBolumleri[sira % denemeBolumleri.length];
            const gerekli = denemeEtutSayisi(bolumId, kriterler, sinavId);
            const denemeAdi = OTURUMLAR[bolumOturumu(sinavId, bolumId) || bolumId]?.ad || bolumId;
            const konacak = Math.min(gerekli, Math.max(1, g.acik.length - 1));
            if (konacak < gerekli) {
                uyarilar.push({
                    tur: 'deneme-suresi', hafta: g.haftaIndex + 1,
                    mesaj: `${denemeAdi} denemesi gerçek süresiyle ${gerekli} etüt ister; ${g.gun} gününde ${konacak} etüt ayrılabildi. Etüt sayısını/saatlerini gözden geçirin.`,
                });
            }
            for (let i = 0; i < konacak; i++) {
                const h = al(g, 'ilk');
                if (!h) break;
                yaz(h, {
                    subject: 'Deneme', type: 'deneme', exam: bolumId,
                    topic: `${denemeAdi} Denemesi${gerekli > 1 ? ` (${i + 1}/${gerekli})` : ''}`,
                });
            }
            // Analiz — denemenin HEMEN ardından, ayrı çalışma türü [6]
            let analizKaldi = kriterler.analizEtut;
            while (analizKaldi > 0 && g.acik.length) {
                const h = al(g, 'ilk');
                yaz(h, {
                    subject: 'Deneme Analizi', type: 'analiz', exam: bolumId,
                    topic: 'Yanlış/boş analizi + hata defterine işleme',
                });
                analizKaldi--;
            }
            if (analizKaldi > 0) {
                // Aynı güne sığmadı — ertesi günün ilk boş etüdü
                const ertesi = gunListesi[g.gunIndex + 1];
                if (ertesi?.acik.length) {
                    const h = al(ertesi, 'ilk');
                    yaz(h, {
                        subject: 'Deneme Analizi', type: 'analiz', exam: bolumId,
                        topic: 'Yanlış/boş analizi + hata defterine işleme',
                    });
                } else {
                    uyarilar.push({
                        tur: 'analiz-yerlesmedi', hafta: g.haftaIndex + 1,
                        mesaj: 'Deneme analizi için boş etüt bulunamadı — analiz denemeyle aynı gün yapılmalı.',
                    });
                }
            }
            sira++;
        }
    }

    /* ── 3. Ekstralar — ders sayılmaz [7] ───────────────────── */
    for (const g of gunListesi) {
        const haftaSonu = g.gun === 'Cumartesi' || g.gun === 'Pazar';
        if (kriterler.paragrafAcik && !haftaSonu && g.acik.length >= 3) {
            const h = al(g, EKSTRA_KONUM.paragraf);
            yaz(h, { subject: 'Paragraf', type: 'paragraf', exam: '', topic: 'Günlük paragraf çözümü' });
        }
        if (kriterler.kitapAcik && g.acik.length >= 2) {
            const h = al(g, EKSTRA_KONUM.kitap);
            yaz(h, { subject: 'Kitap Okuma', type: 'kitap', exam: '', topic: 'Serbest okuma (30 dk)' });
        }
        if (kriterler.gunTekrariAcik && g.acik.length >= 2) {
            const h = al(g, EKSTRA_KONUM.tekrar);
            yaz(h, { subject: 'Günün Tekrarı', type: 'tekrar', exam: '', topic: 'Bugün işlenenlerin geri getirme provası', round: 0 });
        }
    }

    // Esnek/telafi — koçun belirlediği HAFTALIK sayı kadar (0..N)
    const esnekAdet = sinir(kriterler.esnekHaftalik ?? 1, 0, M.ESNEK_ETUT_EN_COK);
    if (esnekAdet > 0) {
        const haftalar = new Map();
        gunListesi.forEach((g) => {
            if (!haftalar.has(g.haftaIndex)) haftalar.set(g.haftaIndex, []);
            haftalar.get(g.haftaIndex).push(g);
        });
        for (const gunlerH of haftalar.values()) {
            let kalanEsnek = esnekAdet;
            // Haftanın sonundan geriye: Cumartesi tercihli
            const sirali = [...gunlerH].sort((a, b) => {
                const oncelik = (g) => (g.gun === 'Cumartesi' ? 0 : 1);
                return oncelik(a) - oncelik(b) || b.gunIndex - a.gunIndex;
            });
            for (const g of sirali) {
                if (!kalanEsnek) break;
                if (g.acik.length < 2) continue;
                yaz(al(g, 'son'), { subject: 'Esnek / Telafi', type: 'mola', exam: '', topic: 'Yetişemediklerini tamamla' });
                kalanEsnek--;
            }
        }
    }

    /* ── 4. Konu → soru zincirleri ──────────────────────────── */
    const paylar = dersPaylari(konular, sinavId);
    const dersler = new Map(); // 'bolum:ders' → durum
    /**
     * ⚠️ HİÇ ÇALIŞILMAMIŞ KONULAR ZİNCİRİN BAŞINA.
     *
     * `konular` girdi sırasında (katalog sırası) geliyordu; bir dersin
     * zaten `bitti:true` (daha önce çalışılmış) konuları ile YENİ
     * eklenen `bitti:false` konusu karışık sırada olabiliyordu. Bitmiş
     * konular zincirde ÖNCE gelirse hızla tamamlanıp tekrar kuyruğuna
     * giriyor ve programın erken haftalarında o dersin İLK görünen
     * hücreleri "tekrar" oluyordu — koç, henüz sırası gelmemiş yeni
     * konuyu değil, eski bir konunun tekrarını "bu dersin ilk etüdü"
     * sanıyordu. Kararlı sıralama: bitmemiş (gerçekten çalışılacak)
     * konular her dersin zincirinde önce yer alır.
     */
    const siraliKonular = [...konular].sort((a, b) => (a.bitti ? 1 : 0) - (b.bitti ? 1 : 0));
    for (const k of siraliKonular) {
        const anahtar = `${k.bolum}:${k.ders}`;
        if (!dersler.has(anahtar)) {
            dersler.set(anahtar, {
                anahtar, bolum: k.bolum, ders: k.ders,
                ad: k.dersAd || k.ders,
                grup: grubu(k.ders),          // bilişsel grup (sınava özgü)
                pay: paylar.get(anahtar) || 1,
                token: 0,
                zincir: [],   // sıralı iş: {tip:'konu'|'soru', konu, kalan}
            });
        }
        const d = dersler.get(anahtar);
        // Koç elle etüt sayısı belirlediyse KOÇUN KARARI ÜSTÜNDÜR
        const konuE = k.sabitKonuEtut ?? konuEtutIhtiyaci(k);
        const soruE = kriterler.soruEtutleriAcik ? soruEtutIhtiyaci(k, kriterler, sinavId) : 0;
        d.zincir.push({ tip: 'konu', konu: k, kalan: konuE, toplam: konuE, soruE });
    }

    const dersListesi = [...dersler.values()];
    const toplamPay = dersListesi.reduce((a, d) => a + d.pay, 0) || 1;
    const toplamAcik = gunListesi.reduce((a, g) => a + g.acik.length, 0);

    /* ══ KAPASİTE DENGELEME [talimat §8] ═══════════════════════════
       TOTAL_CAPACITY (kalan boş etüt) ile TOTAL_WORKLOAD (zincirdeki
       iş) karşılaştırılır. Kapasite iş yükünden büyükse — ki 10 ay ×
       6 etüt gibi uzun programlarda hep öyledir — konuların soru
       etütleri hedefe kadar GENİŞLETİLİR ve pekiştirme turları
       eklenir. Böylece son ay boş kalmaz; boşluk anlamsız A-B-C
       döngüsüyle DEĞİL, gerçek çalışmayla dolar.                   */
    /**
     * TOPLAM İŞ YÜKÜ — konu etütleri VE onları izleyecek soru etütleri.
     *
     * ⚠️ BURASI KRİTİK. Eskiden yalnızca `z.kalan` toplanıyordu; `kalan`
     * ise bir konu işinde SADECE konu etüdü sayısıdır, ardından gelecek
     * `soruE` hesaba katılmıyordu. Ölçüldü (YKS/SAY, 184 konu):
     *
     *     gerçek iş   = 194 konu etüdü + 702 soru etüdü = 896
     *     motorun sandığı                                = 194
     *
     * Motor 1680 hücrelik programda 766 etütlük hayalî bir kapasite
     * fazlası görüyor, her konunun soru etüdünü tavana çekiyor ve
     * yüzlerce pekiştirme turu ekliyordu. Sonuç: ilk ~96 konu bütün
     * kapasiteyi yiyor, KALAN 84 KONU PROGRAMA HİÇ GİRMİYORDU.
     * Program dolu görünüyordu (boş etüt 0) ama müfredatın yarısı yoktu.
     */
    const zincirYuku = () => dersListesi.reduce(
        (a, d) => a + d.zincir.reduce(
            (s, z) => s + z.kalan + (z.tip === 'konu' ? (z.soruE || 0) : 0), 0,
        ), 0,
    );
    const kapasite = toplamAcik;

    /**
     * ARALIKLI TEKRAR YÜKÜ — kapasite hesabına DAHİL.
     *
     * Her konu, konu etütleri bittikten sonra tekrar kuyruğuna girer ve
     * `tekrarAraliklari` kadar (varsayılan 1·7·30 gün) tekrar etüdü
     * üretir. Bu etütler zincirde durmadığı için `zincirYuku` onları
     * göremez. Hesaba katılmayınca motor kapasiteyi fazla sanıp soru
     * etütlerini şişiriyor, sonra gelen tekrarlar son konuları programın
     * dışına itiyordu. Ölçüldü: 50 konuluk 6 aylık programda 6 konu
     * dışarıda kalıyordu.
     */
    const tekrarYuku = kriterler.tekrarAcik
        ? konular.length * (kriterler.tekrarAraliklari?.length || 0)
        : 0;

    const ilkYuk = zincirYuku() + tekrarYuku;

    if (kapasite > ilkYuk && dersListesi.length) {
        // Ne kadar ek iş gerekiyor? (ekstra/deneme etütleri zaten
        // yerleşti; buradaki açık yalnızca ders etütleriyle dolar)
        let acik = kapasite - ilkYuk;
        /* Genişletme sırası = talimattaki öncelik merdiveni:
           1) soru etüdü tavana kadar  2) pekiştirme turu.
           Ağırlığı yüksek dersten başlanır — sınav ağırlığı korunur. */
        const sirali = [...dersListesi].sort((a, b) => b.pay - a.pay);

        /**
         * 1. TUR — soru etütlerini tavana çıkar, ama TUR TUR.
         *
         * Eski hâlinde dersin bütün zinciri tek geçişte tavana
         * çekiliyordu; ilk dersin ilk konuları açığın tamamını yutup
         * geri kalan konulara sıra bırakmıyordu. Artık her turda her
         * konuya BİRER etüt eklenir; açık bitene ya da her şey tavana
         * ulaşana kadar dönülür. Böylece fazla kapasite bütün konulara
         * yayılır [§11, §12].
         */
        /**
         * ⚠️ DERS DENGESİZLİĞİ DÜZELTMESİ (25.08.2026)
         *
         * Eskiden iç döngü `d.zincir`'deki HER konuya birer soru etüdü
         * ekliyordu — yani bir turda bir derse eklenen miktar o dersin
         * KONU SAYISIYLA orantılıydı (18 konulu Türkçe bir turda 18
         * birim tüketirken 5 konulu Din 5 birim tüketiyordu). `acik`
         * tükenince döngü kırıldığı için yüksek paylı+çok konulu dersler
         * kapasitenin çoğunu ilk birkaç turda yutuyor, ölçüldü: bir
         * haftalık programda Türkçe'ye 17 etüt düşüyordu.
         *
         * Artık 2. TUR'daki desenle birebir aynı: her tam geçişte HER
         * DERSE (konu sayısından bağımsız) en fazla BİR birim eklenir,
         * o dersin kendi konuları arasında sırayla döner. Konu sayısı
         * artık payı büyütmüyor; dersler arasında denge `sirali`
         * sıralamasının (ağırlığa göre) ve tur sayısının belirlediği
         * oranla korunuyor.
         */
        let tavanTuru = 0;
        const soruIndeksi = new Map(sirali.map((d) => [d.anahtar, 0]));
        while (acik > 0 && tavanTuru < M.SORU_ETUT_MAX) {
            tavanTuru++;
            let eklendi = false;
            for (const d of sirali) {
                if (acik <= 0) break;
                const uygunlar = d.zincir.filter((z) => z.tip === 'konu' && z.soruE && z.soruE < M.SORU_ETUT_MAX);
                if (!uygunlar.length) continue;
                const i = soruIndeksi.get(d.anahtar) % uygunlar.length;
                soruIndeksi.set(d.anahtar, i + 1);
                uygunlar[i].soruE += 1;
                acik -= 1;
                eklendi = true;
            }
            if (!eklendi) break;
        }

        /**
         * 2. TUR — pekiştirme turu, KONU KONU dolaşarak.
         *
         * Eskiden `d.zincir.find(z => z.tip === 'konu')` ile hep dersin
         * İLK konusu seçiliyordu: yüzlerce pekiştirme etüdü tek bir
         * konuya yığılıyordu. Artık her ders kendi konuları arasında
         * sırayla ilerler; pekiştirme bütün konulara eşit dağılır.
         */
        const konuIndeksi = new Map(sirali.map((d) => [d.anahtar, 0]));
        let guvenlik = 0;
        while (acik > 0 && guvenlik < 20000) {
            guvenlik++;
            let eklendi = false;
            for (const d of sirali) {
                if (acik <= 0) break;
                const konuIsleri = d.zincir.filter((z) => z.tip === 'konu');
                if (!konuIsleri.length) continue;
                const i = konuIndeksi.get(d.anahtar) % konuIsleri.length;
                konuIndeksi.set(d.anahtar, i + 1);
                d.zincir.push({
                    tip: 'soru', konu: konuIsleri[i].konu,
                    kalan: 1, toplam: 1, pekistirme: true,
                });
                acik--; eklendi = true;
            }
            if (!eklendi) break;
        }
    }

    dersListesi.forEach((d) => {
        d.gunlukPay = (d.pay / toplamPay) * (toplamAcik / Math.max(1, gunListesi.filter((g) => g.acik.length).length));
    });

    /* Ana ders listesi: YKS alan bazlı; alanı olmayan sınavlarda
       sınav kimliği (KPSS'de alan varsa KPSS_OGRETMEN gibi). */
    const anaListeAnahtari = (sinavId === 'KPSS' && alanId === 'OGRETMEN') ? 'KPSS_OGRETMEN'
        : (ANA_DERSLER[alanId] ? alanId : sinavId);
    const anaDersAnahtarlari = (ANA_DERSLER[anaListeAnahtari] || [])
        .filter((a) => dersler.has(a));

    /* ── 5. Gün gün yerleştirme ─────────────────────────────── */
    const tekrarKuyrugu = []; // {vadeGun, ders(d), konu, ertelendi}
    const haftaAnaDers = new Map(); // haftaIndex → Set(yerleşen ana ders)

    const dersSayilir = (tip) => tip === 'konu' || tip === 'soru' || tip === 'tekrar';

    for (const g of gunListesi) {
        if (!g.acik.length) continue;
        const bugunDersler = new Set();       // konu/soru/tekrar dersleri
        const bugunKonular = new Set();       // farklı KONU çalışması
        let sonYerlesenDers = null;
        /* Ardışıklık sayaçları [talimat §5, §6] — aynı dersin ve aynı
           bilişsel grubun arka arkaya kaç etüt sürdüğü. 4+ blok
           (Türkçe·Türkçe·Türkçe·Türkçe) burada engellenir. */
        let ardisikDers = 0, ardisikGrup = 0, sonGrup = null;

        const dersSigar = (dAd) => bugunDersler.has(dAd) || bugunDersler.size < kriterler.gunlukMaxDers;
        const konuSigar = (konuAd) => bugunKonular.has(konuAd) || bugunKonular.size < kriterler.gunlukMaxKonu;

        /**
         * Bu ders şu an arka arkaya konabilir mi?
         *
         * KESİN SINIR: aynı ders en fazla 2 ardışık etüt. Konu etüdü,
         * soru etüdü ve tekrar AYNI DERS sayılır — etüt türünü
         * değiştirerek sınır aşılamaz.
         *
         * ⚠️ Eskiden aynı KONUNUN zinciri sürerken sınır 3'e esniyordu
         * (`AYNI_KONU_ZINCIR_ESNEMESI`). Ölçüldü: bu esneme yüzünden
         * her programda "Matematik/soru · Matematik/soru · Matematik/soru"
         * gibi üçlü bloklar oluşuyordu. Serpiştirme ilkesine aykırı
         * olduğu için esneme KALDIRILDI.
         */
        const ardisiklikUygun = (d) => {
            /* ⚠️ Karşılaştırma NESNE değil GÖRÜNEN AD üzerinden:
               TYT:matematik ile AYT_SAY:matematik ayrı kayıtlardır ama
               programda ikisi de "Matematik" yazar; nesne kimliğiyle
               bakınca ekranda 3-4 "Matematik" arka arkaya çıkıyordu. */
            if (sonYerlesenDers?.ad !== d.ad) return true;
            return ardisikDers < M.AYNI_DERS_ARDISIK_EN_COK;
        };
        const grupUygun = (d) => (
            d.grup !== sonGrup || ardisikGrup < M.AYNI_GRUP_ARDISIK_EN_COK
        );

        /**
         * Tek yerleştirme kapısı. Bloklama kuralı BURADA uygulanır —
         * tekrar/konu/soru hangi yoldan gelirse gelsin aynı sınıra
         * tabidir. `zorla` yalnızca boşluk doldurma merdiveninin son
         * basamağında kullanılır (boş etüt yasağı ondan üstün).
         */
        const yerlestir = (d, is_, tip, zorla = false) => {
            // Aynı ders en fazla 2 ardışık — konu/soru/tekrar ayrımı yok
            if (!zorla && sonYerlesenDers?.ad === d.ad
                && ardisikDers >= M.AYNI_DERS_ARDISIK_EN_COK) return false;
            const h = al(g, 'ilk');
            if (!h) return false;
            yaz(h, {
                subject: d.ad, topic: is_.konu.konu, type: tip,
                exam: is_.konu.bolum, grup: d.grup,
                ...(tip === 'tekrar' ? { round: is_.round } : {}),
            });
            if (dersSayilir(tip)) bugunDersler.add(d.ad);
            if (tip === 'konu') bugunKonular.add(is_.konu.konu);
            // Ardışıklık sayaçlarını güncelle (görünen ada göre)
            if (sonYerlesenDers?.ad === d.ad) {
                ardisikDers += 1;
            } else {
                ardisikDers = 1;
            }
            ardisikGrup = (sonGrup === d.grup) ? ardisikGrup + 1 : 1;
            sonGrup = d.grup;
            sonYerlesenDers = d;
            const hIdx = g.haftaIndex;
            if (!haftaAnaDers.has(hIdx)) haftaAnaDers.set(hIdx, new Set());
            haftaAnaDers.get(hIdx).add(d.anahtar);
            return true;
        };

        // 5a. Vadesi gelen ARALIKLI TEKRARLAR önce [3][4]
        for (let i = tekrarKuyrugu.length - 1; i >= 0; i--) {
            if (!g.acik.length) break;
            const t = tekrarKuyrugu[i];
            if (t.vadeGun > g.gunIndex) continue;
            const d = t.ders;
            if (!dersSigar(d.ad)) {
                t.ertelendi = (t.ertelendi || 0) + 1;
                if (t.ertelendi > kriterler.tekrarErtelemeEnCok) {
                    uyarilar.push({
                        tur: 'tekrar-dustu',
                        mesaj: `${d.ad} · ${t.konu.konu} tekrarı ${kriterler.tekrarErtelemeEnCok} gün ertelendi ve yerleştirilemedi.`,
                    });
                    tekrarKuyrugu.splice(i, 1);
                } else {
                    t.vadeGun = g.gunIndex + 1;
                }
                continue;
            }
            if (yerlestir(d, { konu: t.konu, round: t.aralik }, 'tekrar')) {
                tekrarKuyrugu.splice(i, 1);
            }
        }

        // 5b. Konu/soru zincirleri — pay + ana ders önceliği + interleave [5]
        dersListesi.forEach((d) => { d.token += d.gunlukPay; });

        while (g.acik.length) {
            const hIdx = g.haftaIndex;
            const buHafta = haftaAnaDers.get(hIdx) || new Set();
            const tumAdaylar = dersListesi
                .filter((d) => d.zincir.length && dersSigar(d.ad))
                .filter((d) => {
                    const is_ = d.zincir[0];
                    if (is_.tip === 'konu' && !konuSigar(is_.konu.konu)) return false;
                    return true;
                });
            if (!tumAdaylar.length) break;

            /**
             * Ardışıklık süzgeci [§5]: aynı ders/grup üst üste sınırı
             * dolduysa o aday elenir. Hepsi elenirse sınır gevşetilir —
             * yoksa boş etüt kalır ve §9 (boş etüt yasağı) ihlal olur.
             *
             * ⚠️ Eskiden grup süzgeci boşalınca TAMAMEN düşüyordu — yani
             * `gunlukMaxDers` (vars. 3) yüzünden o gün açık kalan
             * derslerin hepsi aynı bilişsel grupsa (örn. Matematik+Fizik,
             * ikisi de "sayısal"), sınır sonsuza kadar aşılabiliyordu.
             * Ölçüldü: 4-5-6 ardışık sayısal etüt. Artık önce sınır
             * SADECE 1 birim gevşetilir (tam kaldırmak yerine); yalnızca
             * o da yetmezse tamamen düşer.
             */
            let adaylar = tumAdaylar.filter((d) => ardisiklikUygun(d) && grupUygun(d));
            if (!adaylar.length) {
                const grupUygunGevsek = (d) => d.grup !== sonGrup || ardisikGrup < M.AYNI_GRUP_ARDISIK_EN_COK + 1;
                adaylar = tumAdaylar.filter((d) => ardisiklikUygun(d) && grupUygunGevsek(d));
            }
            if (!adaylar.length) adaylar = tumAdaylar.filter((d) => ardisiklikUygun(d));
            /* Gevşetme sırası önemli: ders sınırı dolduysa bile ÖNCE
               farklı bir ders denenir; aynı dersi üst üste uzatmak
               ancak başka ders hiç kalmadıysa kabul edilir. */
            if (!adaylar.length) adaylar = tumAdaylar.filter((d) => d.ad !== sonYerlesenDers?.ad);
            if (!adaylar.length) adaylar = tumAdaylar;

            const anaSirasi = (d) => {
                const i = anaDersAnahtarlari.indexOf(d.anahtar);
                return i === -1 ? 99 : i;
            };
            adaylar.sort((a, b) => {
                // 1) Bu hafta hiç girmemiş ANA ders öne [§15]
                const aAna = anaSirasi(a) < 99 && !buHafta.has(a.anahtar) ? 0 : 1;
                const bAna = anaSirasi(b) < 99 && !buHafta.has(b.anahtar) ? 0 : 1;
                if (aAna !== bAna) return aAna - bAna;
                // 2) Bilişsel grup dönüşümü — sınava özgü [§6]
                if (sonGrup) {
                    const aDon = a.grup !== sonGrup ? 0 : 1;
                    const bDon = b.grup !== sonGrup ? 0 : 1;
                    if (aDon !== bDon) return aDon - bDon;
                }
                // 3) Birikmiş pay (sınav ağırlığı)
                return b.token - a.token;
            });

            /**
             * İSTİSNA: aynı DERS art arda 2 etüt tamamlasın (AA-BB-CC),
             * sonra başka derse geçilsin.
             *
             * ⚠️ Eskiden bu yalnızca aynı KONUNUN zinciri sürerken
             * (`blokAcik` + aynı `sonKonuAdi`) tetikleniyordu. Katalogdaki
             * konuların çoğu TEK etütlük olduğu için (bkz.
             * `konuEtutIhtiyaci`) bu istisna neredeyse hiç devreye
             * girmiyor, ilk konu biter bitmez sıralama kriteri #2
             * (bilişsel grup dönüşümü) farklı derse geçmeyi ödüllendirip
             * A-B-A-C-B tarzı serpiştirme üretiyordu. Artık koşul aynı
             * KONUYA değil aynı DERSE bakıyor: konu bitse bile dersin
             * zincirinde iş kaldıysa (bir sonraki konu) ve ardışıklık
             * sınırı dolmadıysa aynı derse devam edilir.
             */
            const sirali = [...adaylar];
            if (sonYerlesenDers
                && sonYerlesenDers.zincir.length
                && dersSigar(sonYerlesenDers.ad)
                && ardisikDers < M.AYNI_DERS_ARDISIK_EN_COK) {
                const is0 = sonYerlesenDers.zincir[0];
                if (is0.tip !== 'konu' || konuSigar(is0.konu.konu)) {
                    sirali.unshift(sonYerlesenDers);
                }
            }

            /* Adayları SIRAYLA dene: `yerlestir` bloklama kuralına
               takılırsa bir sonrakine geç. Eskiden ilk ret döngüyü
               kırıyor ve etüt boş kalıyordu. */
            let secilen = null, is2 = null;
            for (const aday of sirali) {
                const is_ = aday.zincir[0];
                if (!is_) continue;
                if (is_.tip === 'konu' && !konuSigar(is_.konu.konu)) continue;
                if (yerlestir(aday, is_, is_.tip)) { secilen = aday; is2 = is_; break; }
            }
            if (!secilen) break;   // hiçbiri yerleşemedi → 5c doldurur

            is2.kalan--;
            secilen.token -= 1;
            // Aynı konudan bir etüt daha gerekiyorsa bir sonraki turda
            // blok olarak devam etsin (esneme sınırına kadar)
            is2.blokAcik = is2.kalan > 0;

            if (is2.kalan <= 0) {
                secilen.zincir.shift();
                if (is2.tip === 'konu') {
                    // KONU BİTTİ → soru etütleri zincirin BAŞINA [KESİN KURAL]
                    if (is2.soruE > 0) {
                        secilen.zincir.unshift({
                            tip: 'soru', konu: is2.konu,
                            kalan: is2.soruE, toplam: is2.soruE,
                        });
                    }
                    // Aralıklı tekrar halkaları [3]
                    if (kriterler.tekrarAcik) {
                        for (const aralik of kriterler.tekrarAraliklari) {
                            tekrarKuyrugu.push({
                                vadeGun: g.gunIndex + aralik, aralik,
                                ders: secilen, konu: is2.konu,
                            });
                        }
                    }
                }
            }
        }
    }

    /* ── 5c. BOŞ ETÜT YASAĞI [§9] ───────────────────────────────
       Buraya kadar dolmayan etütler kalırsa (ör. günlük ders limiti
       yüzünden) öncelik merdiveninden gerçek çalışmayla doldurulur:
       vadesi geçmiş tekrar → bekleyen soru → esnek/telafi.
       Anlamsız A-B-C döngüsü kurulmaz.                            */
    for (const g of gunListesi) {
        if (!g.acik.length) continue;
        /* O günün mevcut durumu: hangi dersler kullanılmış, son ders ne,
           kaç kez arka arkaya gelmiş. Doldurma ASLA günlük ders/konu
           limitini delmez — §7 kesin kuraldır, §9 ona tabidir. */
        /** O günün etüt indeksine göre dizilmiş hücreleri. */
        const gunDizisi = () => {
            const dizi = [];
            for (const [k, v] of Object.entries(schedule)) {
                if (!k.startsWith(`m${g.ay}-w${g.hafta}-${g.gun}-`)) continue;
                dizi[Number(k.split('-').pop())] = v;
            }
            return dizi;
        };

        /**
         * Bu dersi `idx` konumuna koyarsak 2'den uzun bir blok oluşur mu?
         *
         * ⚠️ NEDEN KONUMA BAKILIYOR
         * Doldurma, günün İLK BOŞ hücresini kullanır; bu hücre günün
         * sonunda değil ORTASINDA olabilir (etkinlik blokları sabit
         * konumlara yazıldığı için). Eskiden ardışıklık günün son
         * hücresinden geriye sayılarak ölçülüyordu; ortaya yazılan
         * hücrede bu ölçüm yanlış çıkıyor ve dört ardışık etüt
         * oluşabiliyordu. Ölçüldü: 6 aylık programda 14 ihlal, hepsi
         * "Fizik/tekrar · Fizik/soru · Fizik/tekrar · Fizik/tekrar"
         * biçiminde. Artık hem SOL hem SAĞ komşuya bakılır.
         */
        const komsuUygun = (idx, dersAd) => {
            const dizi = gunDizisi();
            const ayniMi = (i) => {
                const c = dizi[i];
                return c && dersSayilir(c.type) && c.subject === dersAd;
            };
            let sol = 0;
            for (let i = idx - 1; i >= 0 && ayniMi(i); i--) sol++;
            let sag = 0;
            for (let i = idx + 1; i < gunlukEtut && ayniMi(i); i++) sag++;
            // Yeni hücre dahil toplam blok uzunluğu
            return sol + 1 + sag <= M.AYNI_DERS_ARDISIK_EN_COK;
        };

        /**
         * BİLİŞSEL GRUP KOMŞULUĞU (§15) — sayısal/sözel dönüşümü.
         *
         * Aynı ders sınırı tutuluyordu ama aynı GRUP sınırı doldurma
         * yolunda hiç bakılmıyordu. Ölçüldü: YKS senaryolarında dört
         * ardışık sayısal etüt oluşuyordu (sınır 3). Farklı dersler
         * olduğu için ders kuralı devreye girmiyor, ama bilişsel yük
         * açısından "Matematik · Fizik · Kimya · Geometri" tek blok.
         *
         * ⚠️ Bu sınır ders sınırından YUMUŞAKTIR: §17 uyarınca imkânsız
         * bir dağılımı zorlamak için program bozulmaz. Kural yalnızca
         * BAŞKA SEÇENEK VARKEN uygulanır; yoksa gevşetilir.
         */
        const grupKomsuUygun = (idx, grup) => {
            if (!grup) return true;
            const dizi = gunDizisi();
            const ayniMi = (i) => {
                const c = dizi[i];
                return c && dersSayilir(c.type) && c.grup === grup;
            };
            let sol = 0;
            for (let i = idx - 1; i >= 0 && ayniMi(i); i--) sol++;
            let sag = 0;
            for (let i = idx + 1; i < gunlukEtut && ayniMi(i); i++) sag++;
            return sol + 1 + sag <= M.AYNI_GRUP_ARDISIK_EN_COK;
        };

        while (g.acik.length) {
            const mevcut = gunDizisi().filter(Boolean);
            const gunDersleri = new Set(mevcut.filter((c) => dersSayilir(c.type)).map((c) => c.subject));

            const h = al(g, 'ilk');
            const idx = h.etut;

            /**
             * Hangi dersler bu hücreye konabilir?
             *
             * Öncelik o gün ZATEN açılmış derslerdedir (yeni ders açmak
             * günlük ders çeşidini artırır). Ama gün henüz `gunlukMaxDers`
             * sınırına ulaşmadıysa YENİ bir ders açmak serbesttir ve
             * tercih edilir: aksi hâlde ardışıklık kuralı yüzünden
             * yerleştirilemeyen etütler gereksiz yere esnek/telafi
             * bloğuna dönüşüyordu.
             */
            const yeniDersAcilabilir = gunDersleri.size < kriterler.gunlukMaxDers;
            const uygunDersler = dersListesi.filter((d) => (
                d.zincir.length && (gunDersleri.has(d.ad) || yeniDersAcilabilir)
            ));
            const farkliOlan = uygunDersler.filter((d) => {
                if (!komsuUygun(idx, d.ad)) return false;
                const is_ = d.zincir[0];
                // Günlük KONU çeşidi sınırı doldurmada da delinmez
                if (is_.tip === 'konu') {
                    const gunKonulari = new Set(
                        mevcut.filter((c) => c.type === 'konu').map((c) => c.topic),
                    );
                    if (!gunKonulari.has(is_.konu.konu)
                        && gunKonulari.size >= kriterler.gunlukMaxKonu) return false;
                }
                return true;
            });

            /**
             * BİLİŞSEL GRUP SÜZGECİ (§15) — YUMUŞAK.
             *
             * Grup kuralını sağlayan aday varsa yalnızca onlar kullanılır;
             * hiç yoksa süzgeç düşürülür. §17: imkânsız bir dağılımı
             * zorlamak için program bozulmaz, en iyi mümkün dizilim üretilir.
             */
            const grupUyanlar = farkliOlan.filter((d) => grupKomsuUygun(idx, d.grup));
            const dersAdaylari = grupUyanlar.length ? grupUyanlar : farkliOlan;

            // 1) Bekleyen tekrar — gündeki dersler ya da yeni açılabilir ders
            const tekrarUygun = (x) => (
                (gunDersleri.has(x.ders.ad) || yeniDersAcilabilir) && komsuUygun(idx, x.ders.ad)
            );
            // Önce grup kuralına da uyan tekrar aranır, yoksa herhangi biri
            let tIdx = tekrarKuyrugu.findIndex(
                (x) => tekrarUygun(x) && grupKomsuUygun(idx, x.ders.grup),
            );
            if (tIdx < 0) tIdx = tekrarKuyrugu.findIndex(tekrarUygun);
            if (tIdx >= 0) {
                const t = tekrarKuyrugu.splice(tIdx, 1)[0];
                yaz(h, {
                    subject: t.ders.ad, topic: t.konu.konu, type: 'tekrar',
                    exam: t.konu.bolum, grup: t.ders.grup, round: t.aralik,
                });
                continue;
            }
            // 2) Zincirde kalan iş — limit ve bloklama gözetilerek
            const kalanDers = dersAdaylari[0];
            if (kalanDers) {
                const is_ = kalanDers.zincir[0];
                yaz(h, {
                    subject: kalanDers.ad, topic: is_.konu.konu,
                    type: is_.tip, exam: is_.konu.bolum, grup: kalanDers.grup,
                });
                is_.kalan--;
                if (is_.kalan <= 0) kalanDers.zincir.shift();
                continue;
            }
            /**
             * 3) Son çare: esnek/telafi DOLGUSU.
             *
             * `dolgu: true` bunu KOÇUN PLANLADIĞI esnek seanstan ayırır.
             * İkisi de EXTRA_STUDY'dir (ders sayılmaz, limiti delmez) ama
             * anlamları farklıdır: planlı esnek seans koçun kararıdır,
             * dolgu ise "buraya kural gereği başka hiçbir şey konamadı"
             * demektir. Ayırmazsak koç "esnek seans: 0" dediğinde
             * programda esnek blok görüp haklı olarak şaşırır.
             */
            yaz(h, {
                subject: 'Esnek / Telafi', type: 'mola', exam: '', dolgu: true,
                topic: 'Eksiklerini tamamla / serbest çalışma',
            });
        }
    }

    /* ── 6. Denetim (QA) ────────────────────────────────────── */
    uyarilar.push(...programDenetle(schedule, {
        kriterler, gunler, gunlukEtut, aylar, haftaPerAy,
        sinavId, alanId, anaDersAnahtarlari, dersler: dersListesi,
        beklenenHucre: toplamAcik,
    }));

    /* ── 7. İstatistik ──────────────────────────────────────── */
    const stats = { toplamYerlesen: 0, turler: {}, dersDagilimi: {}, bosEtut: 0 };
    for (const g of gunListesi) stats.bosEtut += g.acik.length;
    for (const hucre of Object.values(schedule)) {
        stats.toplamYerlesen++;
        stats.turler[hucre.type] = (stats.turler[hucre.type] || 0) + 1;
        if (dersSayilir(hucre.type)) {
            stats.dersDagilimi[hucre.subject] = (stats.dersDagilimi[hucre.subject] || 0) + 1;
        }
    }
    /**
     * KAPSAM RAPORU — koçun görmesi gereken asıl sayı.
     *
     * Eskiden yalnızca "şu derste N etüt sığmadı" deniyordu. Koç için
     * kritik olan bilgi ise KAÇ KONUNUN programa hiç girmediğidir:
     * program dolu görünürken (boş etüt 0) seçilen konuların yarısı
     * dışarıda kalabiliyor ve bu hiçbir yerde yazmıyordu.
     */
    const programlananKonular = new Set();
    for (const hucre of Object.values(schedule)) {
        if (!hucre || !dersSayilir(hucre.type)) continue;
        programlananKonular.add(`${hucre.subject}|${hucre.topic}`);
    }
    const disardaKalan = konular.filter(
        (k) => !programlananKonular.has(`${k.dersAd || k.ders}|${k.konu}`),
    );
    stats.secilenKonu = konular.length;
    stats.programlananKonu = konular.length - disardaKalan.length;
    stats.disardaKalanKonu = disardaKalan.length;
    stats.disardaKalanlar = disardaKalan.slice(0, 30).map((k) => `${k.dersAd || k.ders} · ${k.konu}`);

    // Kalan iş: konu etütleri VE onları izleyecek soru etütleri
    stats.kalanZincir = dersListesi
        .filter((d) => d.zincir.length)
        .map((d) => ({
            ders: d.ad,
            kalanIs: d.zincir.reduce(
                (a, z) => a + z.kalan + (z.tip === 'konu' ? (z.soruE || 0) : 0), 0,
            ),
        }));

    if (disardaKalan.length) {
        /**
         * KOÇA SOMUT SEÇENEK SUN.
         *
         * "Kapasite yetmedi" tek başına eyleme dönüşmez. Günlük kitap ve
         * paragraf blokları koçun açıp kapatabildiği ayarlardır ve uzun
         * programlarda ciddi yer tutar — ölçüldü: 10 aylık YKS/SAY
         * programında bu iki blok 440 hücre kaplıyor ve kapatıldığında
         * dışarıda kalan 54 konunun tamamı programa giriyor. Koçun bu
         * bedeli görmeden karar vermesi beklenemez.
         */
        const serbestlesecek = (stats.turler.kitap || 0) + (stats.turler.paragraf || 0);
        const oneri = serbestlesecek > 0
            ? ` Günlük kitap/paragraf bloklarını kapatırsanız ${serbestlesecek} etüt boşalır.`
            : '';
        uyarilar.push({
            tur: 'kapsam',
            mesaj: `Seçilen ${konular.length} konudan ${disardaKalan.length} tanesi programa GİRMEDİ.`
                + ` Süreyi ya da günlük etüt sayısını artırın, konu seçimini daraltın.${oneri}`,
        });
    }
    if (stats.kalanZincir.length) {
        uyarilar.push({
            tur: 'kapasite',
            mesaj: `Kapasite yetmedi: ${stats.kalanZincir.map((z) => `${z.ders} (${z.kalanIs} etüt)`).join(', ')} programa sığmadı.`,
        });
    }

    return { schedule, stats, uyarilar };
}

/* ══════════════════════════════════════════════════════════════
   QA DENETÇİSİ — üretimden sonra kural ihlali/bilgi taraması.
   Uyarı türleri: limit ihlali (olmamalı — hata), ana ders eksiği,
   deneme süresi, kapasite.
   ══════════════════════════════════════════════════════════════ */
export function programDenetle(schedule, {
    kriterler = KRITER_VARSAYILANLARI,
    gunler = GUNLER_VARSAYILAN,
    aylar = 1, haftaPerAy = 4,
    sinavId = 'YKS',
    alanId = null, anaDersAnahtarlari = null, dersler = [],
    beklenenHucre = null,
} = {}) {
    const uyarilar = [];
    const dersSayilir = (tip) => tip === 'konu' || tip === 'soru' || tip === 'tekrar';

    // Gün bazlı sayımlar + etüt sırası (bloklama denetimi için)
    const gunlukHarita = new Map();
    for (const [anahtar, hucre] of Object.entries(schedule)) {
        const m = /^m(\d+)-w(\d+)-(.+)-(\d+)$/.exec(anahtar);
        if (!m) continue;
        const gunAnahtari = `${m[1]}-${m[2]}-${m[3]}`;
        if (!gunlukHarita.has(gunAnahtari)) {
            gunlukHarita.set(gunAnahtari, {
                dersler: new Set(), konular: new Set(), sira: [],
                ay: Number(m[1]), hafta: (Number(m[1]) - 1) * haftaPerAy + Number(m[2]),
            });
        }
        const g = gunlukHarita.get(gunAnahtari);
        if (dersSayilir(hucre.type)) g.dersler.add(hucre.subject);
        if (hucre.type === 'konu') g.konular.add(hucre.topic);
        g.sira.push({ etut: Number(m[4]), ...hucre });
    }
    for (const g of gunlukHarita.values()) g.sira.sort((a, b) => a.etut - b.etut);

    /* §5 — Aynı ders gereksiz uzun blok.
       KESİN SINIR 2: konu/soru/tekrar ayrımı yapılmaz, etüt türü
       değiştirilerek sınır aşılamaz. Konu zinciri esnemesi kaldırıldı. */
    for (const [gunAnahtari, g] of gunlukHarita) {
        let ard = 0, oncekiDers = null;
        for (const h of g.sira) {
            if (!dersSayilir(h.type)) { ard = 0; oncekiDers = null; continue; }
            ard = (h.subject === oncekiDers) ? ard + 1 : 1;
            if (ard > M.AYNI_DERS_ARDISIK_EN_COK) {
                uyarilar.push({
                    tur: 'ders-bloklama', gun: gunAnahtari,
                    mesaj: `${gunAnahtari}: ${h.subject} dersi arka arkaya ${ard} etüt — en çok ${M.AYNI_DERS_ARDISIK_EN_COK} olmalı (serpiştirme ilkesi).`,
                });
                break;
            }
            oncekiDers = h.subject;
        }
    }

    /**
     * §6 · §10 · §31 — HAFTALIK VE AYLIK YÜK DENGESİ
     *
     * Hücre SAYISI her hafta zaten eşittir (ızgara sabit: 7 gün ×
     * günlük etüt). Ölçülmesi gereken şey İŞ YÜKÜdür: aynı sayıda
     * hücre, zor ve geniş kapsamlı konularla dolduğunda çok daha
     * ağır bir haftadır.
     *
     * Yük ölçüsü olarak ders etüdü sayısı ile ağırlıklı yük birlikte
     * kullanılır; ağırlık bilgisi çağırandan gelmezse (dersler boşsa)
     * ders etüdü sayısına düşülür.
     *
     * Eşik: değişim katsayısı (standart sapma ÷ ortalama). Bu ölçü
     * program uzunluğundan bağımsızdır — 4 haftalık ve 40 haftalık
     * programda aynı şekilde okunur. "Her hafta birebir aynı olsun"
     * DEĞİL; gereksiz aşırı dalgalanma yakalanır [§37].
     */
    const haftaYuk = new Map();
    const ayYuk = new Map();
    for (const [anahtar, hucre] of Object.entries(schedule)) {
        const m = /^m(\d+)-w(\d+)-/.exec(anahtar);
        if (!m || !hucre || !dersSayilir(hucre.type)) continue;
        const ay = Number(m[1]);
        const hKey = `m${m[1]}-w${m[2]}`;
        haftaYuk.set(hKey, (haftaYuk.get(hKey) || 0) + 1);
        ayYuk.set(ay, (ayYuk.get(ay) || 0) + 1);
    }

    const dengeDenetle = (harita, etiket, tur) => {
        const v = [...harita.values()];
        if (v.length < 2) return;
        const ort = v.reduce((a, b) => a + b, 0) / v.length;
        if (ort <= 0) return;
        const sapma = Math.sqrt(v.reduce((a, b) => a + (b - ort) ** 2, 0) / v.length);
        const kat = sapma / ort;
        if (kat > M.YUK_DEGISIM_ESIGI) {
            const enAz = Math.min(...v);
            const enCok = Math.max(...v);
            uyarilar.push({
                tur,
                mesaj: `${etiket} yükü dengesiz: en az ${enAz}, en çok ${enCok} ders etüdü `
                    + `(değişim %${Math.round(kat * 100)}, eşik %${Math.round(M.YUK_DEGISIM_ESIGI * 100)}).`,
            });
        }
    };
    dengeDenetle(haftaYuk, 'Haftalık', 'hafta-yuk-dengesizligi');
    dengeDenetle(ayYuk, 'Aylık', 'ay-yuk-dengesizligi');

    /* §9 — Boş etüt yasağı: beklenen hücre sayısı verilmişse eksik
       yerleşim ihlaldir. */
    if (beklenenHucre != null) {
        const yerlesen = Object.keys(schedule).length;
        if (yerlesen < beklenenHucre) {
            uyarilar.push({
                tur: 'bos-etut',
                mesaj: `${beklenenHucre - yerlesen} etüt boş kaldı — program tüm açık etütleri doldurmalı.`,
            });
        }
    }

    /* §8 — Son ay boş kalmamalı. */
    if (aylar > 1) {
        const sonAyHucre = Object.keys(schedule).filter((k) => k.startsWith(`m${aylar}-`)).length;
        if (sonAyHucre === 0) {
            uyarilar.push({
                tur: 'son-ay-bos',
                mesaj: `Son ay (${aylar}. ay) tamamen boş — çalışma yükü programın tamamına yayılmalı.`,
            });
        }
    }

    for (const [gunAnahtari, g] of gunlukHarita) {
        if (g.dersler.size > kriterler.gunlukMaxDers) {
            uyarilar.push({
                tur: 'limit-ders', gun: gunAnahtari,
                mesaj: `${gunAnahtari}: ${g.dersler.size} ders var — günlük en fazla ${kriterler.gunlukMaxDers} ders kriteri aşılmış.`,
            });
        }
        if (g.konular.size > kriterler.gunlukMaxKonu) {
            uyarilar.push({
                tur: 'limit-konu', gun: gunAnahtari,
                mesaj: `${gunAnahtari}: ${g.konular.size} farklı konu var — günlük en fazla ${kriterler.gunlukMaxKonu} konu kriteri aşılmış.`,
            });
        }
    }

    // Ana ders haftalık varlık kontrolü — bilgilendirme [ANA_DERSLER]
    const anaListe = anaDersAnahtarlari ?? (ANA_DERSLER[alanId] || []);
    if (anaListe.length && dersler.length) {
        const adUzayi = new Map(dersler.map((d) => [d.anahtar, d.ad]));
        const haftaDers = new Map();
        for (const [anahtar, hucre] of Object.entries(schedule)) {
            const m = /^m(\d+)-w(\d+)-/.exec(anahtar);
            if (!m || !dersSayilir(hucre.type)) continue;
            const h = (Number(m[1]) - 1) * haftaPerAy + Number(m[2]);
            if (!haftaDers.has(h)) haftaDers.set(h, new Set());
            haftaDers.get(h).add(hucre.subject);
        }
        for (const [h, set] of haftaDers) {
            for (const ana of anaListe) {
                const ad = adUzayi.get(ana);
                if (!ad) continue; // koç bu dersi hiç seçmemiş
                if (!set.has(ad)) {
                    uyarilar.push({
                        tur: 'ana-ders', hafta: h,
                        mesaj: `${h}. haftada ana ders "${ad}" hiç yok — kapasite izin veriyorsa her hafta bulunmalı.`,
                    });
                }
            }
        }
    }

    return uyarilar;
}

export default { programUret, programDenetle, konuEtutIhtiyaci, soruEtutIhtiyaci, denemeEtutSayisi, dersPaylari, KRITER_VARSAYILANLARI };
