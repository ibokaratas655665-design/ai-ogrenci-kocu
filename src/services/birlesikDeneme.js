/**
 * 🔗 BİRLEŞİK DENEME HATTI
 *
 * Deneme verisi üç kaynaktan gelir: koçun Excel'den yüklediği sonuçlar
 * (v2_results_data / v2_trials_data), öğrencinin kendi girdikleri ve
 * UYGULAMA İÇİ deneme motorunun sonuçları (deneme_analizleri,
 * kaynak: uygulama-ici-deneme). Analiz ekranları eskiden yalnız ilkini
 * okuyordu — motorda çözülen deneme "Deneme Merkezi"nde görünmüyordu.
 *
 * Bu servis üçünü TEK listede birleştirir:
 *  - Koç kaydı esastır; aynı öğrenci+deneme için motor kaydı varsa
 *    çözüm istatistiği (istatistik) koç kaydına AŞILANIR.
 *  - Koçta karşılığı olmayan motor sonuçları listeye eklenir
 *    (_ogrenci: true damgasıyla).
 *  - Motor denemeleri, en az bir birleşik sonucu varsa deneme listesine
 *    sanal deneme olarak girer (id: ogr_<ad>_<tur>).
 *
 * Ayrıca merkezî öğrenci-sonuç eşleştirme (matchResultsForStudent):
 * id → okul numarası → normalize TAM AD eşitliği. Alt-dize (includes)
 * eşleşmesi YASAK — "Ali" araması "Alican"ı yakalayıp yanlış öğrenciye
 * sonuç yazdırıyordu.
 */
import { listeOku } from './veriDeposu';

/** Türkçe duyarlı, karşılaştırma-güvenli normalizasyon. */
export const adNormalize = (s) => String(s || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');

/** Ders adı → v2 sonuç anahtarları (Excel akışıyla aynı şema). */
const DERS_ANAHTARI = {
    turkce: 'turkce', matematik: 'mat', mat: 'mat', geometri: 'geometri',
    fizik: 'fizik', kimya: 'kimya', biyoloji: 'biyoloji', tarih: 'tarih',
    cografya: 'cografya', felsefe: 'felsefe', din: 'din', dink: 'din',
    dinkulturu: 'din', sosyal: 'sosyal', fen: 'fen', edebiyat: 'edebiyat',
    ingilizce: 'ingilizce',
};

/**
 * Motor kayıtlarını (deneme_analizleri) v2 trial/result biçimine çevirir.
 * Aynı ad+tür taşıyan kayıtlar TEK sanal denemede toplanır — koç
 * "PDF'li Deneme"yi 5 öğrenciye atadıysa listede 1 deneme görünür.
 */
export const motorKayitlari = () => {
    const kayitlar = listeOku('deneme_analizleri');
    const trialHarita = new Map();
    const sonuclar = [];

    kayitlar.forEach((k) => {
        if (!k || !k.studentId || !k.ad) return;
        const tur = k.tur || 'TYT';
        const trialId = `ogr_${adNormalize(k.ad).slice(0, 24) || 'deneme'}_${adNormalize(tur)}`;
        if (!trialHarita.has(trialId)) {
            trialHarita.set(trialId, {
                id: trialId, name: k.ad, examType: tur, date: k.tarih || null, _ogrenci: true,
            });
        }
        const subjects = {};
        let toplamNet = 0;
        Object.entries(k.dersler || {}).forEach(([ders, d]) => {
            const net = Number(d?.net) || 0;
            subjects[DERS_ANAHTARI[adNormalize(ders)] || adNormalize(ders)] = {
                net,
                d: Number(d?.dogru ?? d?.d) || 0,
                y: Number(d?.yanlis ?? d?.y) || 0,
                b: Number(d?.bos ?? d?.b) || 0,
            };
            toplamNet += net;
        });
        sonuclar.push({
            id: `v2ogr_${k.id}`,
            studentId: k.studentId,
            student: k.studentName || '',
            trialId,
            examName: k.ad,
            examType: tur,
            totalNet: +toplamNet.toFixed(2),
            subjects,
            date: k.tarih || null,
            examDate: k.tarih || null,
            _ogrenci: true,
            istatistik: k.degerlendirme?.istatistik || null,
            _kaynakTipi: k.degerlendirme?.kaynak || null,
        });
    });

    return { trials: [...trialHarita.values()], results: sonuclar };
};

const sonucAnahtari = (r) => `${r.studentId}|${(r.examName || '').toLocaleLowerCase('tr-TR').trim()}`;

/**
 * Koç sonuçları + motor sonuçları → tek liste.
 * Koç kaydı esas; istatistiği yoksa eşleşen motor kaydından aşılanır.
 */
export const birlesikSonuclar = (v2Results, motor = motorKayitlari()) => {
    const kocList = Array.isArray(v2Results) ? v2Results : [];
    const motorMap = new Map();
    motor.results.forEach((r) => { if (!motorMap.has(sonucAnahtari(r))) motorMap.set(sonucAnahtari(r), r); });
    const kocAnahtarlar = new Set(kocList.map(sonucAnahtari));

    return [
        ...kocList.map((r) => {
            if (r.istatistik) return r;
            const m = motorMap.get(sonucAnahtari(r));
            return m?.istatistik ? { ...r, istatistik: m.istatistik, _kaynakTipi: m._kaynakTipi } : r;
        }),
        ...motor.results.filter((r) => !kocAnahtarlar.has(sonucAnahtari(r))),
    ];
};

/** Koç denemeleri + (birleşik listede sonucu olan) motor denemeleri. */
export const birlesikDenemeler = (v2Trials, sonuclar, motor = motorKayitlari()) => {
    const kocList = Array.isArray(v2Trials) ? v2Trials : [];
    const kocIdler = new Set(kocList.map((t) => String(t?.id)));
    const kullanilan = new Set(
        (sonuclar || []).filter((r) => r._ogrenci).map((r) => String(r.trialId)),
    );
    const ek = motor.trials.filter((t) => !kocIdler.has(String(t.id)) && kullanilan.has(String(t.id)));
    return [...kocList, ...ek];
};

/**
 * MERKEZÎ öğrenci-sonuç eşleştirme.
 * Sıra: studentId eşitliği → okul numarası eşitliği → normalize TAM AD
 * eşitliği. Alt-dize eşleşmesi bilinçli olarak YOK.
 */
export const matchResultsForStudent = (student, results) => {
    if (!student) return [];
    const sid = student.id != null ? String(student.id) : null;
    const okulNo = student.schoolNumber != null ? String(student.schoolNumber).trim() : '';
    const ad = adNormalize(student.name);

    return (Array.isArray(results) ? results : []).filter((r) => {
        if (sid && r.studentId != null && String(r.studentId) === sid) return true;
        const rNo = r.number != null ? String(r.number).trim() : '';
        if (okulNo && rNo && okulNo === rNo) return true;
        const rAd = adNormalize(r.student || r.name);
        return !!ad && !!rAd && ad === rAd;
    });
};

export default { adNormalize, motorKayitlari, birlesikSonuclar, birlesikDenemeler, matchResultsForStudent };
