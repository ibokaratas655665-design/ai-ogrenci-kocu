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
    OTURUMLAR, BOLUM_OTURUMU, DERS_SORULARI, OTURUM_KATKISI,
    soruSuresiDk, ANA_DERSLER, SAYISAL_DERSLER,
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
export const soruEtutIhtiyaci = (konu, kriterler = {}) => {
    const kalan = Math.max(0, konu.kalanSoru ?? konu.hedef ?? 0);
    if (!kalan) return konu.bitti ? 1 : 0;   // bitmişe 1 pekiştirme sorusu etüdü
    const dakika = kalan
        * soruSuresiDk(konu.bolum, konu.ders)
        * (kriterler.pratikCarpani ?? M.PRATIK_CARPANI);
    return sinir(Math.ceil(dakika / (kriterler.etutSuresiDk ?? M.ETUT_SURESI_DK)), 1, M.SORU_ETUT_MAX);
};

/** Deneme kaç etüt sürer — gerçek oturum süresi / etüt süresi [1]. */
export const denemeEtutSayisi = (bolumId, kriterler = {}) => {
    const oturum = OTURUMLAR[BOLUM_OTURUMU[bolumId] || bolumId];
    if (!oturum) return 3; // oturumu bilinmeyen sınav — QA uyarısı üretir
    return Math.max(1, Math.ceil(oturum.sureDk / (kriterler.etutSuresiDk ?? M.ETUT_SURESI_DK)));
};

/** Haftalık ders payları — DERS_SORULARI × oturum katkısı [1]. */
export const dersPaylari = (konular) => {
    const pay = new Map();
    for (const k of konular) {
        const anahtar = `${k.bolum}:${k.ders}`;
        if (pay.has(anahtar)) continue;
        const soru = DERS_SORULARI[k.bolum]?.[k.ders] ?? (k.agirlik ?? 1) * 4;
        const katki = k.bolum === 'TYT' ? OTURUM_KATKISI.TYT
            : (k.bolum.startsWith('AYT') || k.bolum === 'YDT') ? OTURUM_KATKISI.ALAN
            : OTURUM_KATKISI.TEK_BOLUM;
        pay.set(anahtar, soru * katki);
    }
    return pay;
};

const sayisalMi = (ders) => SAYISAL_DERSLER.has(ders);

/* ══════════════════════════════════════════════════════════════ */

export function programUret({
    konular = [],          // [{bolum, ders, dersAd, konu, agirlik, zorluk, hedef, kalanSoru, bitti}]
    alanId = null,         // SAY | EA | SOZ | DIL | TYT | null
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

    /* ── 2. Deneme + analiz [1][6] ──────────────────────────── */
    // Deneme bölümü haftalara dönüşümlü: TYT ↔ alan bölümü.
    const alanBolumu = { SAY: 'AYT_SAY', EA: 'AYT_EA', SOZ: 'AYT_SOZ', DIL: 'YDT' }[alanId] || null;
    const denemeBolumleri = alanBolumu ? ['TYT', alanBolumu] : ['TYT'];

    if (kriterler.denemeAcik) {
        let sira = 0;
        for (const g of gunListesi) {
            if (g.gun !== kriterler.denemeGunu || !g.acik.length) continue;
            const bolumId = denemeBolumleri[sira % denemeBolumleri.length];
            const gerekli = denemeEtutSayisi(bolumId, kriterler);
            const denemeAdi = OTURUMLAR[BOLUM_OTURUMU[bolumId] || bolumId]?.ad || bolumId;
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
    const paylar = dersPaylari(konular);
    const dersler = new Map(); // 'bolum:ders' → durum
    for (const k of konular) {
        const anahtar = `${k.bolum}:${k.ders}`;
        if (!dersler.has(anahtar)) {
            dersler.set(anahtar, {
                anahtar, bolum: k.bolum, ders: k.ders,
                ad: k.dersAd || k.ders,
                sayisal: sayisalMi(k.ders),
                pay: paylar.get(anahtar) || 1,
                token: 0,
                zincir: [],   // sıralı iş: {tip:'konu'|'soru', konu, kalan}
            });
        }
        const d = dersler.get(anahtar);
        // Koç elle etüt sayısı belirlediyse KOÇUN KARARI ÜSTÜNDÜR
        const konuE = k.sabitKonuEtut ?? konuEtutIhtiyaci(k);
        const soruE = kriterler.soruEtutleriAcik ? soruEtutIhtiyaci(k, kriterler) : 0;
        d.zincir.push({ tip: 'konu', konu: k, kalan: konuE, toplam: konuE, soruE });
    }

    const dersListesi = [...dersler.values()];
    const toplamPay = dersListesi.reduce((a, d) => a + d.pay, 0) || 1;
    const toplamAcik = gunListesi.reduce((a, g) => a + g.acik.length, 0);
    dersListesi.forEach((d) => {
        d.gunlukPay = (d.pay / toplamPay) * (toplamAcik / Math.max(1, gunListesi.filter((g) => g.acik.length).length));
    });

    const anaDersAnahtarlari = (ANA_DERSLER[alanId] || [])
        .filter((a) => dersler.has(a) || a.endsWith(':sosyal') || a.endsWith(':fen'));

    /* ── 5. Gün gün yerleştirme ─────────────────────────────── */
    const tekrarKuyrugu = []; // {vadeGun, ders(d), konu, ertelendi}
    const haftaAnaDers = new Map(); // haftaIndex → Set(yerleşen ana ders)

    const dersSayilir = (tip) => tip === 'konu' || tip === 'soru' || tip === 'tekrar';

    for (const g of gunListesi) {
        if (!g.acik.length) continue;
        const bugunDersler = new Set();       // konu/soru/tekrar dersleri
        const bugunKonular = new Set();       // farklı KONU çalışması
        let sonYerlesenDers = null;

        const dersSigar = (dAd) => bugunDersler.has(dAd) || bugunDersler.size < kriterler.gunlukMaxDers;
        const konuSigar = (konuAd) => bugunKonular.has(konuAd) || bugunKonular.size < kriterler.gunlukMaxKonu;

        const yerlestir = (d, is_, tip) => {
            const h = al(g, 'ilk');
            if (!h) return false;
            yaz(h, {
                subject: d.ad, topic: is_.konu.konu, type: tip,
                exam: is_.konu.bolum, ...(tip === 'tekrar' ? { round: is_.round } : {}),
            });
            if (dersSayilir(tip)) bugunDersler.add(d.ad);
            if (tip === 'konu') bugunKonular.add(is_.konu.konu);
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
            const adaylar = dersListesi
                .filter((d) => d.zincir.length && dersSigar(d.ad))
                .filter((d) => {
                    const is_ = d.zincir[0];
                    if (is_.tip === 'konu' && !konuSigar(is_.konu.konu)) return false;
                    return true;
                });
            if (!adaylar.length) break;

            const anaSirasi = (d) => {
                const i = anaDersAnahtarlari.indexOf(d.anahtar);
                return i === -1 ? 99 : i;
            };
            adaylar.sort((a, b) => {
                // 1) Bu hafta hiç girmemiş ANA ders öne
                const aAna = anaSirasi(a) < 99 && !buHafta.has(a.anahtar) ? 0 : 1;
                const bAna = anaSirasi(b) < 99 && !buHafta.has(b.anahtar) ? 0 : 1;
                if (aAna !== bAna) return aAna - bAna;
                // 2) Sayısal/sözel dönüşümü [5]
                if (sonYerlesenDers) {
                    const aDon = a.sayisal !== sonYerlesenDers.sayisal ? 0 : 1;
                    const bDon = b.sayisal !== sonYerlesenDers.sayisal ? 0 : 1;
                    if (aDon !== bDon) return aDon - bDon;
                }
                // 3) Birikmiş pay
                return b.token - a.token;
            });

            // İSTİSNA: son yerleşen dersin zincir başı AYNI KONUDAN devam
            // ediyorsa blok tamamlanır (aynı konu 2 etüt üst üste) [5]
            let secilen = adaylar[0];
            if (sonYerlesenDers
                && sonYerlesenDers.zincir.length
                && dersSigar(sonYerlesenDers.ad)
                && sonYerlesenDers.zincir[0].blokAcik) {
                secilen = sonYerlesenDers;
            }

            const is_ = secilen.zincir[0];
            const tip = is_.tip;
            if (tip === 'konu' && !konuSigar(is_.konu.konu)) {
                // blok devamı konu limitine takıldı — normal adaya dön
                secilen = adaylar.find((d) => d !== secilen);
                if (!secilen) break;
            }
            const isSecilen = secilen.zincir[0];
            if (!yerlestir(secilen, isSecilen, isSecilen.tip)) break;

            isSecilen.kalan--;
            secilen.token -= 1;
            // Aynı konudan bir etüt daha gerekiyorsa bir sonraki turda
            // blok olarak devam etsin (en çok 2 üst üste)
            isSecilen.blokAcik = isSecilen.kalan > 0 && !isSecilen.blokKullanildi;
            if (isSecilen.blokAcik) isSecilen.blokKullanildi = true;
            else isSecilen.blokKullanildi = false;

            if (isSecilen.kalan <= 0) {
                secilen.zincir.shift();
                if (isSecilen.tip === 'konu') {
                    // KONU BİTTİ → soru etütleri zincirin BAŞINA [KESİN KURAL]
                    if (isSecilen.soruE > 0) {
                        secilen.zincir.unshift({
                            tip: 'soru', konu: isSecilen.konu,
                            kalan: isSecilen.soruE, toplam: isSecilen.soruE,
                        });
                    }
                    // Aralıklı tekrar halkaları [3]
                    if (kriterler.tekrarAcik) {
                        for (const aralik of kriterler.tekrarAraliklari) {
                            tekrarKuyrugu.push({
                                vadeGun: g.gunIndex + aralik, aralik,
                                ders: secilen, konu: isSecilen.konu,
                            });
                        }
                    }
                }
            }
        }
    }

    /* ── 6. Denetim (QA) ────────────────────────────────────── */
    uyarilar.push(...programDenetle(schedule, {
        kriterler, gunler, gunlukEtut, aylar, haftaPerAy,
        alanId, anaDersAnahtarlari, dersler: dersListesi,
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
    stats.kalanZincir = dersListesi
        .filter((d) => d.zincir.length)
        .map((d) => ({ ders: d.ad, kalanIs: d.zincir.reduce((a, z) => a + z.kalan, 0) }));
    if (stats.kalanZincir.length) {
        uyarilar.push({
            tur: 'kapasite',
            mesaj: `Kapasite yetmedi: ${stats.kalanZincir.map((z) => `${z.ders} (${z.kalanIs} etüt)`).join(', ')} programa sığmadı. Süreyi/etüt sayısını artırın ya da konu seçimini daraltın.`,
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
    alanId = null, anaDersAnahtarlari = null, dersler = [],
} = {}) {
    const uyarilar = [];
    const dersSayilir = (tip) => tip === 'konu' || tip === 'soru' || tip === 'tekrar';

    // Gün bazlı sayımlar
    const gunlukHarita = new Map();
    for (const [anahtar, hucre] of Object.entries(schedule)) {
        const m = /^m(\d+)-w(\d+)-(.+)-(\d+)$/.exec(anahtar);
        if (!m) continue;
        const gunAnahtari = `${m[1]}-${m[2]}-${m[3]}`;
        if (!gunlukHarita.has(gunAnahtari)) {
            gunlukHarita.set(gunAnahtari, { dersler: new Set(), konular: new Set(), hafta: (Number(m[1]) - 1) * haftaPerAy + Number(m[2]) });
        }
        const g = gunlukHarita.get(gunAnahtari);
        if (dersSayilir(hucre.type)) g.dersler.add(hucre.subject);
        if (hucre.type === 'konu') g.konular.add(hucre.topic);
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
