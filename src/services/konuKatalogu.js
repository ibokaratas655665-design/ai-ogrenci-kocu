/**
 * 🗂 KANONİK KONU KATALOĞU + EŞLEŞTİRME MOTORU
 *
 * Amaç: aynı konunun farklı yazımları ("Sözcük Anlamı", "Sözcükte Anlam",
 * "İşçi - Havuz Problemleri"…) TEK kalıcı topicId altında toplansın ki
 * deneme analizleri, hata defteri ve konu ilerlemesi aynı konuda birleşsin.
 *
 * Katman sırası (konuEsle):
 *  1. ELLE VERİLMİŞ KARARLAR (ESLEME_KARARLARI): N_TO_1 / 1_TO_N / CONTEXT
 *     — müfredat listeleriyle katalog arasındaki bilinen yapı farkları.
 *  2. Kanonik ad eşitliği (normalize) → 1_TO_1.
 *  3. Alias tablosu (ALIAS_TABLOSU) → ALIAS.
 *  4. Hiçbiri değilse UNRESOLVED — TAHMİN ÜRETİLMEZ; kayıt "karar bekliyor"
 *     olarak kalır. Yanlış konuya bağlamaktansa bağlamamak tercih edilir.
 *
 * Eski kimlik köprüsü: examTopics.konuKimligi ('yks:tyt:matematik:…')
 * çıktıları eskiKimliktenTopicId ile deterministik olarak topicId'ye çevrilir.
 */
import {
    SINAVLAR, tumKonular, dersAdi, DERS_ADLARI, hedefSoruHesapla,
} from '../data/examTopics';
import { KATALOG_KIMLIKLERI } from '../data/konuKimlikleri';

export const KATALOG_YILI = 2026;
export const KATALOG_SURUMLERI = {
    YKS: 'yks-2026.1', LGS: 'lgs-2026.1', KPSS: 'kpss-2026.1', AGS: 'ags-2026.1',
};
export const surumAdi = (examId) =>
    KATALOG_SURUMLERI[examId] || `${String(examId || 'genel').toLowerCase()}-2026.1`;

/** "SINAV|BOLUM|ders|Konu" → topicId (katalogda yoksa null). */
export const topicIdBul = (examId, bolumId, ders, konuAd) =>
    KATALOG_KIMLIKLERI[`${examId}|${bolumId}|${ders}|${konuAd}`] || null;

export const subjectIdUret = (bolumId, ders) =>
    `s_${String(bolumId).toLowerCase()}_${String(ders).toLowerCase()}`;

/**
 * Alias tablosu: kanonik ad → eski/farklı yazımlar.
 * Buraya eklenen her yazım otomatik olarak kanonik kimliğe bağlanır.
 */
export const ALIAS_TABLOSU = {
    'Sözcükte Anlam': ['Sözcük Anlamı'],
    'Paragrafta Anlam': ['Paragraf Anlama'],
    'EBOB-EKOK': ['EBOB - EKOK'],
    'Oran-Orantı': ['Oran - Orantı'],
    'Problemler: Yaş': ['Yaş Problemleri', 'Problemler (Yaş)'],
    'Edat, Bağlaç, Ünlem': ['Edat - Bağlaç - Ünlem'],
    'Analitik Geometri: Doğru': ['Analitik Geometri - Doğru'],
    'Analitik Geometri: Çember': ['Analitik Geometri - Çember'],
    'Hareket ve Kuvvet': ['Kuvvet ve Hareket'],
    'MÖ 6 – MS 2. Yüzyıl Felsefesi': ['MÖ 6. - MS 2. Yüzyıl Felsefesi'],
    'MS 2 – 15. Yüzyıl Felsefesi': ['MS 2. - 15. Yüzyıl Felsefesi'],
    '15 – 17. Yüzyıl Felsefesi': ['15. - 17. Yüzyıl Felsefesi'],
    '18 – 19. Yüzyıl Felsefesi': ['18. - 19. Yüzyıl Felsefesi'],
    'İlk Türk-İslam Devletleri': ['İlk Türk - İslam Devletleri'],
    'Türk-İslam Devletleri': ['Türk - İslam Devletleri'],
    '1982 Anayasası: Temel İlkeler': ['1982 Anayasası - Temel İlkeler'],
    'Ahlak Gelişimi (Piaget, Kohlberg)': ['Ahlak Gelişimi (Kohlberg, Piaget)'],
    'Transfer ve Güdülenme': ['Güdülenme ve Transfer'],
    'Rehberlik Türleri ve Hizmet Alanları': ['Rehberlik Hizmet Alanları ve Türleri'],
    'Materyal Tasarımı ve Öğretim Teknolojileri': ['Öğretim Teknolojileri ve Materyal Tasarımı'],
    'Bölme-Bölünebilme, EBOB-EKOK': ['Bölme, Bölünebilme, EBOB-EKOK'],
    'Permütasyon-Kombinasyon-Olasılık': ['Permütasyon, Kombinasyon, Olasılık'],
};

/** Müfredatta olmayıp katalogda tutulan ek konular. */
export const EK_KONULAR = [
    {
        topicId: 't_ek_tyt_matematik_0001', examId: 'YKS', bolumId: 'TYT',
        ders: 'matematik', ad: 'Modüler Aritmetik', agirlik: 1, zorluk: 2,
        hedef: null, eskiAdlar: [],
    },
];

let sinavOnbellek = null;
let topicIdOnbellek = null;
let eskiKimlikOnbellek = null;
let indeksOnbellek = null;

/** Katalog: sınav → konular (examTopics + kimlik haritası + ek konular). */
export const katalogSinavlari = () => {
    if (sinavOnbellek) return sinavOnbellek;
    const liste = [];
    for (const examId of Object.keys(SINAVLAR)) {
        const sinav = SINAVLAR[examId];
        const surum = surumAdi(examId);
        const konular = [];
        for (const k of tumKonular(examId)) {
            konular.push({
                topicId: topicIdBul(examId, k.bolum, k.ders, k.konu),
                subjectId: subjectIdUret(k.bolum, k.ders),
                examId,
                bolumId: k.bolum,
                bolumAd: k.bolumAd,
                ders: k.ders,
                dersAd: dersAdi(k.ders),
                examYear: KATALOG_YILI,
                curriculumVersion: surum,
                ad: k.konu,
                eskiAdlar: (ALIAS_TABLOSU[k.konu] || []).slice(),
                agirlik: k.agirlik,
                zorluk: k.zorluk,
                hedef: k.hedef,
                eskiKimlik: k.topicId,
            });
        }
        liste.push({ examId, ad: sinav.ad, kademe: sinav.kademe, examYear: KATALOG_YILI, curriculumVersion: surum, konular });
    }
    for (const ek of EK_KONULAR) {
        const sinav = liste.find(s => s.examId === ek.examId);
        if (!sinav) continue;
        const bolumAd = sinav.konular.find(k => k.bolumId === ek.bolumId)?.bolumAd || ek.bolumId;
        sinav.konular.push({
            topicId: ek.topicId,
            subjectId: subjectIdUret(ek.bolumId, ek.ders),
            examId: ek.examId,
            bolumId: ek.bolumId,
            bolumAd,
            ders: ek.ders,
            dersAd: dersAdi(ek.ders),
            examYear: KATALOG_YILI,
            curriculumVersion: surumAdi(ek.examId),
            ad: ek.ad,
            eskiAdlar: [...(ALIAS_TABLOSU[ek.ad] || []), ...(ek.eskiAdlar || [])],
            agirlik: ek.agirlik,
            zorluk: ek.zorluk,
            hedef: ek.hedef ?? hedefSoruHesapla(ek.agirlik, ek.zorluk),
            eskiKimlik: null,
            ekKaynak: true,
        });
    }
    sinavOnbellek = liste;
    return liste;
};

/** Tüm katalog konuları (examId verilirse o sınavla sınırlı). */
export const katalogKonulari = (examId = null) => {
    const liste = katalogSinavlari();
    return examId
        ? liste.find(s => s.examId === examId)?.konular || []
        : liste.flatMap(s => s.konular);
};

const normalize = (s) => String(s ?? '').trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ');

const indeksler = () => {
    if (indeksOnbellek) return indeksOnbellek;
    const kanonik = new Map();
    const alias = new Map();
    const subjectler = new Set();
    const dersKeys = new Set();
    const displayToDers = new Map();
    for (const konu of katalogKonulari()) {
        const ad = normalize(konu.ad);
        if (!kanonik.has(ad)) kanonik.set(ad, []);
        kanonik.get(ad).push(konu);
        for (const eski of konu.eskiAdlar || []) {
            const e = normalize(eski);
            if (!alias.has(e)) alias.set(e, []);
            alias.get(e).push(konu);
        }
        subjectler.add(konu.subjectId);
        dersKeys.add(String(konu.ders));
    }
    for (const [dersKey, gorunen] of Object.entries(DERS_ADLARI)) {
        displayToDers.set(normalize(gorunen), dersKey);
    }
    indeksOnbellek = { kanonik, alias, subjectler, dersKeys, displayToDers };
    return indeksOnbellek;
};

const baglamaUyar = (konu, baglam = {}) => {
    if (baglam.examId && normalize(konu.examId) !== normalize(baglam.examId)) return false;
    if (baglam.bolumId && normalize(konu.bolumId) !== normalize(baglam.bolumId)) return false;
    if (baglam.subjectId && konu.subjectId !== baglam.subjectId) return false;
    const ders = baglam.ders || baglam.dersKey;
    return !ders || normalize(konu.ders) === normalize(ders);
};

/** Aday listesinden bağlamla TEK konu kalıyorsa onu döndür — belirsizlik = null. */
const tekEslesme = (adaylar, baglam) => {
    const kalan = (adaylar || []).filter(k => baglamaUyar(k, baglam));
    return kalan.length === 1 ? kalan[0] : null;
};

/**
 * Elle verilmiş eşleme kararları — müfredat listesi ile katalog arasında
 * bilinen yapı farkları. Bunlar denetimde tek tek incelenip karara bağlandı;
 * otomatik eşleştirici bu farkları asla tahmin ETMEZ.
 */
export const ESLEME_KARARLARI = [
    { examId: 'YKS', bolumId: 'TYT', ders: 'matematik', curriculumAdlar: ['Sayı Problemleri', 'Kesir Problemleri'], tip: 'N_TO_1', hedefAd: 'Problemler: Sayı-Kesir', guven: 'kesin', not: 'Katalog "Sayı-Kesir"i tek başlıkta toplar; curriculum ikiye ayırmış.' },
    { examId: 'YKS', bolumId: 'TYT', ders: 'matematik', curriculumAdlar: ['Yüzde Problemleri', 'Kar - Zarar Problemleri'], tip: 'N_TO_1', hedefAd: 'Problemler: Yüzde-Kâr-Faiz', guven: 'yuksek', not: "Katalog Yüzde+Kâr+Faiz birleşik; curriculum Yüzde ve Kar-Zarar ayrı (Faiz curriculum TYT'de yok)." },
    { examId: 'YKS', bolumId: 'TYT', ders: 'matematik', curriculumAdlar: ['Grafik Problemleri', 'Rutin Olmayan Problemler'], tip: 'N_TO_1', hedefAd: 'Problemler: Grafik ve Rutin Olmayan', guven: 'kesin', not: 'Katalog "Grafik ve Rutin Olmayan"ı tek başlıkta toplar.' },
    { examId: 'YKS', bolumId: 'TYT', ders: 'matematik', curriculumAdlar: ['Permütasyon', 'Kombinasyon'], tip: 'N_TO_1', hedefAd: 'Permütasyon-Kombinasyon', guven: 'kesin', not: 'Katalog Permütasyon-Kombinasyon birleşik; curriculum ikiye ayırmış.' },
    { examId: 'YKS', bolumId: 'TYT', ders: 'matematik', curriculumAd: 'İşçi - Havuz Problemleri', tip: '1_TO_1', hedefAd: 'Problemler: İşçi-Havuz', guven: 'yuksek', not: '"Problemleri" son eki ↔ "Problemler:" ön eki biçim farkı; kavram aynı.' },
    { examId: 'YKS', bolumId: 'TYT', ders: 'matematik', curriculumAd: 'Hız - Hareket Problemleri', tip: '1_TO_1', hedefAd: 'Problemler: Hareket-Hız', guven: 'yuksek', not: 'Kelime sırası (Hız-Hareket ↔ Hareket-Hız) + biçim farkı; kavram aynı.' },
    { examId: 'YKS', bolumId: 'TYT', ders: 'matematik', curriculumAd: 'Karışım Problemleri', tip: '1_TO_1', hedefAd: 'Problemler: Karışım', guven: 'yuksek', not: '"Problemleri" ↔ "Problemler:" biçim farkı; kavram aynı.' },
    { examId: 'YKS', bolumId: 'AYT_SAY', ders: 'matematik', curriculumAd: 'Analitik Geometri Uygulamaları', tip: '1_TO_N', hedefAdlar: ['Analitik Geometri: Doğru', 'Analitik Geometri: Çember'], hedefBolumId: 'AYT_SAY', hedefDers: 'geometri', guven: 'orta', not: "curriculum tek \"uygulamalar\" başlığı (Matematik altında); katalog geometri'de Doğru ve Çember olarak ikiye ayırır." },
    ...['Sinir Sistemi', 'Endokrin Sistem', 'Duyu Organları', 'Destek ve Hareket Sistemi', 'Sindirim Sistemi', 'Dolaşım ve Bağışıklık Sistemi', 'Solunum Sistemi'].map(ad => ({
        examId: 'YKS', bolumId: 'TYT', ders: 'biyoloji', curriculumAd: ad, tip: 'CONTEXT',
        hedefAd: ad, hedefBolumId: 'AYT_SAY', guven: 'yuksek',
        not: "Fizyoloji sistemleri katalogda AYT_SAY Biyoloji (12. sınıf); curriculum TYT'ye koymuş.",
    })),
    { examId: 'YKS', bolumId: 'TYT', ders: 'matematik', curriculumAd: '2. Dereceden Denklemler', tip: 'CONTEXT', hedefAd: '2. Dereceden Denklemler', hedefBolumId: 'AYT_SAY', guven: 'yuksek', not: "Katalog bu konuyu AYT matematik'e koyar; curriculum TYT'ye. Bağlam farkı — zorla TYT kimliği ÜRETİLMEDİ." },
];

const karariBul = (ad, baglam) => {
    const n = normalize(ad);
    return ESLEME_KARARLARI.find(k =>
        (!baglam.examId || k.examId === baglam.examId)
        && (!baglam.bolumId || k.bolumId === baglam.bolumId)
        && (!baglam.ders || k.ders === baglam.ders)
        && (k.curriculumAd
            ? normalize(k.curriculumAd) === n
            : !!k.curriculumAdlar && k.curriculumAdlar.some(a => normalize(a) === n))
    ) || null;
};

const topicIdIle = (konuAd, examId, bolumId, ders) =>
    topicIdBul(examId, bolumId, ders, konuAd);

const adlaEsle = (ad, baglam = {}) => {
    const idx = indeksler();
    const n = normalize(ad);
    if (!n) return null;
    let konu = tekEslesme(idx.kanonik.get(n), baglam);
    if (!konu) konu = tekEslesme(idx.alias.get(n), baglam);
    return konu ? konu.topicId : null;
};

const topicIdHaritasi = () => {
    if (!topicIdOnbellek) {
        topicIdOnbellek = new Map();
        for (const konu of katalogKonulari()) {
            if (konu.topicId) topicIdOnbellek.set(konu.topicId, konu);
        }
    }
    return topicIdOnbellek;
};

export const topicBilgisi = (topicId) => topicIdHaritasi().get(topicId) || null;

/**
 * Bir konu ADINI bağlam içinde katalog kimliğine çözer.
 * Dönen: {tip, hedefTopicId|hedefTopicIdler, guven, not}
 * tip: 1_TO_1 | ALIAS | CONTEXT | N_TO_1 | 1_TO_N | UNRESOLVED
 */
export const konuEsle = (ad, baglam = {}) => {
    const karar = karariBul(ad, baglam);
    if (karar) {
        const bolum = karar.hedefBolumId || karar.bolumId;
        const ders = karar.hedefDers || karar.ders;
        if (karar.tip === '1_TO_N') {
            return {
                tip: karar.tip,
                hedefTopicIdler: karar.hedefAdlar.map(a => topicIdIle(a, karar.examId, bolum, ders)),
                guven: karar.guven, not: karar.not,
            };
        }
        return {
            tip: karar.tip,
            hedefTopicId: karar.hedefAd ? topicIdIle(karar.hedefAd, karar.examId, bolum, ders) : null,
            guven: karar.guven, not: karar.not,
        };
    }
    const topicId = adlaEsle(ad, baglam);
    if (topicId) {
        const konu = topicBilgisi(topicId);
        const kanonikMi = !!konu && normalize(konu.ad) === normalize(ad);
        return {
            tip: kanonikMi ? '1_TO_1' : 'ALIAS',
            hedefTopicId: topicId,
            guven: 'kesin',
            not: kanonikMi ? 'Tam kanonik eşleşme.' : 'aliases.js ile çözüldü.',
        };
    }
    return { tip: 'UNRESOLVED', hedefTopicId: null, guven: null, not: 'Katalogda kesin karşılık bulunamadı; karar bekliyor.' };
};

/** konuEsle tip → kayıt üzerindeki eslemeTip etiketi. */
export const ESLEME_TIP_ETIKETI = {
    '1_TO_1': 'MATCH', ALIAS: 'ALIAS', CONTEXT: 'CONTEXT',
    N_TO_1: 'N_TO_1', '1_TO_N': 'ONE_TO_N', UNRESOLVED: 'UNRESOLVED',
};

/** Basit sınav-türü etiketi → katalog (examId, bolumId) bağlam listesi. */
export const EXAM_BOLUMLERI = {
    TYT: [{ examId: 'YKS', bolumId: 'TYT' }],
    AYT: [{ examId: 'YKS', bolumId: 'AYT_SAY' }, { examId: 'YKS', bolumId: 'AYT_EA' }, { examId: 'YKS', bolumId: 'AYT_SOZ' }],
    YDT: [{ examId: 'YKS', bolumId: 'YDT' }],
    LGS: [{ examId: 'LGS', bolumId: 'SOZEL' }, { examId: 'LGS', bolumId: 'SAYISAL' }],
    KPSS: [{ examId: 'KPSS', bolumId: 'GY' }, { examId: 'KPSS', bolumId: 'GK' }, { examId: 'KPSS', bolumId: 'EB' }],
    AGS: [{ examId: 'AGS', bolumId: 'EB' }, { examId: 'AGS', bolumId: 'GENEL' }, { examId: 'AGS', bolumId: 'MEVZUAT' }],
};

/** Eski kimlik ('yks:tyt:matematik:…') → topicId — deterministik köprü. */
export const eskiKimliktenTopicId = (eskiKimlik) => {
    if (!eskiKimlikOnbellek) {
        eskiKimlikOnbellek = new Map();
        for (const konu of katalogKonulari()) {
            if (konu.eskiKimlik) eskiKimlikOnbellek.set(konu.eskiKimlik, konu.topicId);
        }
    }
    return eskiKimlikOnbellek.get(eskiKimlik) || null;
};

/**
 * Serbest ders metnini ('Matematik', 'mat', 's_tyt_matematik') katalog ders
 * anahtarına çözer; çözülmezse null.
 */
export const dersCozumle = (dersMetni, examId, bolumId) => {
    const subjectId = (() => {
        const idx = indeksler();
        const n = normalize(dersMetni);
        if (!n) return null;
        const dogrudan = `s_${n.replace(/ /g, '_')}`;
        if (idx.subjectler.has(dogrudan)) return dogrudan;
        let dersKey = null;
        if (idx.dersKeys.has(n)) dersKey = n;
        else if (idx.displayToDers.has(n)) dersKey = idx.displayToDers.get(n);
        if (!dersKey || !bolumId) return null;
        const aday = subjectIdUret(bolumId, dersKey);
        return idx.subjectler.has(aday) ? aday : null;
    })();
    if (!subjectId) return null;
    const onEk = `s_${String(bolumId).toLowerCase()}_`;
    return subjectId.startsWith(onEk) ? subjectId.slice(onEk.length) : null;
};

/**
 * Ham bir konu kaydını (hata defteri / deneme konu hatası / eski slug)
 * katalog kimliğine bağlamayı DENER; sonucu gerekçesiyle raporlar.
 * girdi: {kaynakDepo, slug?, exam?|examId?, bolumId?, subject?|ders?, ad?}
 */
export const kayitKimlikCoz = (girdi = {}) => {
    const taban = {
        kaynakDepo: girdi.kaynakDepo || null,
        eskiKimlik: girdi.slug || null,
        exam: girdi.exam || girdi.examId || null,
        subject: girdi.subject || girdi.ders || null,
        topic: girdi.ad || null,
        oneriTopicId: null,
        eslemeTip: 'ORPHAN',
        guven: null,
        gerekce: '',
    };
    if (girdi.slug) {
        const topicId = eskiKimliktenTopicId(girdi.slug);
        if (topicId) {
            return { ...taban, oneriTopicId: topicId, eslemeTip: 'MATCH', guven: 'kesin', gerekce: 'eskiKimlik(slug) → topicId deterministik köprü.' };
        }
        if (!girdi.ad) return { ...taban, eslemeTip: 'ORPHAN', gerekce: 'slug katalogda yok ve ad bilgisi yok.' };
    }
    if (!girdi.ad) return { ...taban, eslemeTip: 'ORPHAN', gerekce: 'ad ve slug yok → bağlam kurulamaz.' };

    let baglamlar;
    if (girdi.examId && girdi.bolumId) {
        baglamlar = [{ examId: girdi.examId, bolumId: girdi.bolumId }];
    } else {
        if (!girdi.exam || !EXAM_BOLUMLERI[girdi.exam]) {
            return { ...taban, eslemeTip: 'ORPHAN', gerekce: 'exam bağlamı katalog bölümüne eşlenemedi.' };
        }
        baglamlar = EXAM_BOLUMLERI[girdi.exam];
    }

    const sonuclar = [];
    let baglamKuruldu = false;
    for (const b of baglamlar) {
        const ders = girdi.ders || dersCozumle(girdi.subject, b.examId, b.bolumId);
        if (!ders) continue;
        baglamKuruldu = true;
        const sonuc = konuEsle(girdi.ad, { examId: b.examId, bolumId: b.bolumId, ders });
        if (sonuc.tip !== 'UNRESOLVED') sonuclar.push({ ...sonuc, ctx: { ...b, ders } });
    }
    if (sonuclar.length === 0) {
        return baglamKuruldu
            ? { ...taban, eslemeTip: 'UNRESOLVED', gerekce: 'Bağlam geçerli ama konu adı katalogda kesin eşleşmiyor → TAHMİN YOK.' }
            : { ...taban, eslemeTip: 'ORPHAN', gerekce: 'subject/ders katalog bağlamına eşlenemedi → yetim kayıt.' };
    }
    const hedefler = new Set(sonuclar.map(s => s.hedefTopicId || (s.hedefTopicIdler || []).join(',')));
    if (hedefler.size > 1) {
        return { ...taban, eslemeTip: 'CONFLICT', gerekce: `Birden çok bölümde farklı topicId çözülüyor (${[...hedefler].join(' | ')}) → elle karar.` };
    }
    const secilen = sonuclar[0];
    const tip = ESLEME_TIP_ETIKETI[secilen.tip] || 'UNRESOLVED';
    return tip === 'ONE_TO_N'
        ? { ...taban, oneriTopicIdler: secilen.hedefTopicIdler, eslemeTip: tip, guven: secilen.guven, gerekce: secilen.not }
        : { ...taban, oneriTopicId: secilen.hedefTopicId, eslemeTip: tip, guven: secilen.guven, gerekce: secilen.not };
};

export default {
    KATALOG_YILI, KATALOG_SURUMLERI, surumAdi,
    topicIdBul, subjectIdUret, topicBilgisi,
    ALIAS_TABLOSU, EK_KONULAR, ESLEME_KARARLARI, ESLEME_TIP_ETIKETI, EXAM_BOLUMLERI,
    katalogSinavlari, katalogKonulari,
    konuEsle, eskiKimliktenTopicId, dersCozumle, kayitKimlikCoz,
};
