/**
 * 📊 DENEME ANALİZİ MOTORU (V1.1)
 *
 * YENİ MEKANİZMA — NEDEN ZORUNLU?
 * Deneme verisi (`v2_results_data`) yıllardır ders bazında D/Y/B/net
 * tutuyor ama uygulamada yalnızca toplam net gösteriliyordu; hata
 * defteri ve günlük kayıt da analizle hiç buluşmuyordu. Bu modül üç
 * mevcut kaynağı (deneme + hata defteri + günlük kayıt) SAF
 * fonksiyonlarla analize çevirir — veri üretmez, sadece okur; geçmişi
 * asla değiştirmez/silmez.
 *
 * Ölçülemeyen metrik RAPORLANMAZ: bir alan veride yoksa (ör. konu
 * bilgisi girilmemiş denemeler) o analiz boş döner, uydurulmaz.
 *
 * Kayıt şekilleri (mevcut sistemden, değiştirilmedi):
 *  deneme: { student, examType, uploadedAt, totalNet,
 *            subjects: { <anahtar>: { correct?, wrong?, blank?, net } } }
 *  hata:   { studentId, subject, topic, errorType, createdAt, mastered }
 *  günlük: { studentId, kind:'soru'|'kitap', subject, topic, date,
 *            correct, wrong, blank }
 */
import { dersAdi } from '../data/examTopics';

const sayi = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/** Türkçe uyumlu ad sadeleştirme — ClassRanking ile aynı eşleme mantığı. */
const adSadelestir = (s) => String(s || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' }[c]))
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Bir öğrencinin denemeleri, tarihe göre ESKİDEN YENİYE sıralı.
 * v2 kayıtları öğrenciyi adla taşır; eşleme ClassRanking'teki gibi
 * ilk-isim içerme kuralıyla yapılır (aynı standart, ikinci bir eşleme
 * kuralı icat edilmedi).
 */
export const ogrencininDenemeleri = (v2Results, ogrenciAdi, sinavTuru = 'all') => {
    const hedef = adSadelestir(ogrenciAdi);
    if (!hedef) return [];
    return (v2Results || [])
        .filter((r) => {
            const rAd = adSadelestir(r.student);
            if (!rAd) return false;
            return rAd.includes(hedef.split(' ')[0]) || hedef.includes(rAd.split(' ')[0]);
        })
        .filter((r) => sinavTuru === 'all' || (r.examType || 'TYT') === sinavTuru)
        .sort((a, b) => new Date(a.uploadedAt || 0) - new Date(b.uploadedAt || 0));
};

/**
 * Ders bazlı özet: son deneme D/Y/B/net + tüm denemelerin ortalama neti.
 * `subjects` alanı olmayan denemeler ders satırı üretmez (uydurma yok).
 */
export const dersOzeti = (denemeler) => {
    const dersler = new Map();
    denemeler.forEach((d, i) => {
        Object.entries(d.subjects || {}).forEach(([anahtar, s]) => {
            if (!s || typeof s !== 'object') return;
            /* Birleştirme anahtarı GÖRÜNEN ad: koç kaydı 'mat', öğrenci
               kaydı 'Matematik' yazar — ikisi tek satırda toplanmalı */
            const gorunen = dersAdi(anahtar);
            if (!dersler.has(gorunen)) dersler.set(gorunen, { anahtar, ad: gorunen, netler: [], son: null });
            const kayit = dersler.get(gorunen);
            kayit.netler.push(sayi(s.net));
            kayit.son = { dogru: sayi(s.correct), yanlis: sayi(s.wrong), bos: sayi(s.blank), net: sayi(s.net), denemeSira: i };
        });
    });
    return [...dersler.values()].map((k) => ({
        ...k,
        ortalamaNet: k.netler.length ? +(k.netler.reduce((a, b) => a + b, 0) / k.netler.length).toFixed(2) : 0,
    }));
};

/** Trend serisi: her deneme için tarih + toplam net (+ ders netleri). */
export const trendSerisi = (denemeler) => denemeler.map((d, i) => {
    const nokta = {
        sira: i + 1,
        ad: d.examName || d.name || `Deneme ${i + 1}`,
        tarih: d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '',
        toplamNet: +sayi(d.totalNet).toFixed(2),
    };
    Object.entries(d.subjects || {}).forEach(([anahtar, s]) => { nokta[anahtar] = sayi(s?.net); });
    return nokta;
});

/**
 * Güçlü / zayıf / gelişen / gerileyen dersler.
 * Gelişim = son yarı ortalaması − ilk yarı ortalaması (≥2 deneme ister).
 */
export const gucluZayifAnalizi = (denemeler) => {
    const ozet = dersOzeti(denemeler);
    if (!ozet.length) return { guclu: [], zayif: [], gelisen: [], gerileyen: [] };

    const gelisimli = ozet.map((d) => {
        if (d.netler.length < 2) return { ...d, degisim: null };
        const yari = Math.floor(d.netler.length / 2);
        const ilk = d.netler.slice(0, yari);
        const son = d.netler.slice(yari);
        const ort = (x) => x.reduce((a, b) => a + b, 0) / x.length;
        return { ...d, degisim: +(ort(son) - ort(ilk)).toFixed(2) };
    });

    const siralamaNet = [...gelisimli].sort((a, b) => b.ortalamaNet - a.ortalamaNet);
    const ustDilim = Math.max(1, Math.ceil(siralamaNet.length / 3));
    return {
        guclu: siralamaNet.slice(0, ustDilim),
        zayif: siralamaNet.slice(-ustDilim).reverse(),
        gelisen: gelisimli.filter((d) => d.degisim !== null && d.degisim > 0.5).sort((a, b) => b.degisim - a.degisim),
        gerileyen: gelisimli.filter((d) => d.degisim !== null && d.degisim < -0.5).sort((a, b) => a.degisim - b.degisim),
    };
};

/**
 * Hata defterinden konu analizi: konu başına sayı, tekrar edenler
 * (aynı konudan ≥2 hata) ve hata türü dağılımı.
 */
export const konuHatalari = (hatalar) => {
    const konular = new Map();
    const turler = new Map();
    (hatalar || []).forEach((h) => {
        const konu = String(h.topic || '').trim();
        const ders = String(h.subject || '').trim();
        if (konu) {
            const anahtar = `${ders}|${konu}`;
            if (!konular.has(anahtar)) konular.set(anahtar, { ders, konu, sayi: 0, cozulen: 0 });
            const k = konular.get(anahtar);
            k.sayi += 1;
            if (h.mastered) k.cozulen += 1;
        }
        if (h.errorType) turler.set(h.errorType, (turler.get(h.errorType) || 0) + 1);
    });
    const liste = [...konular.values()].sort((a, b) => b.sayi - a.sayi);
    return {
        konular: liste,
        tekrarEden: liste.filter((k) => k.sayi >= 2),
        turDagilimi: [...turler.entries()].map(([tur, adet]) => ({ tur, adet })).sort((a, b) => b.adet - a.adet),
    };
};

/**
 * Çalışma öncelikleri: zayıf dersler + gerileyen dersler + en çok
 * hata biriken (çözülmemiş) konular. En fazla `adet` madde.
 */
export const calismaOncelikleri = (denemeler, hatalar, adet = 5) => {
    const { zayif, gerileyen } = gucluZayifAnalizi(denemeler);
    const { konular } = konuHatalari(hatalar);
    const oncelikler = [];
    gerileyen.slice(0, 2).forEach((d) =>
        oncelikler.push({ tur: 'gerileyen-ders', baslik: d.ad, sebep: `Net ${Math.abs(d.degisim)} düştü` }));
    zayif.slice(0, 2).forEach((d) => {
        if (!oncelikler.some((o) => o.baslik === d.ad)) {
            oncelikler.push({ tur: 'zayif-ders', baslik: d.ad, sebep: `Ortalama net ${d.ortalamaNet}` });
        }
    });
    konular.filter((k) => k.cozulen < k.sayi).slice(0, 3).forEach((k) =>
        oncelikler.push({ tur: 'hatali-konu', baslik: `${k.ders} · ${k.konu}`, sebep: `${k.sayi} hata kaydı` }));
    return oncelikler.slice(0, adet);
};

/**
 * Günlük soru kayıtlarından haftalık seri: hafta başına çözülen soru,
 * yanlış ve isabet oranı — "soru çözüm sayısındaki değişim" trendi.
 */
export const gunlukSeri = (gunlukler) => {
    const haftalar = new Map();
    (gunlukler || []).filter((g) => g.kind === 'soru').forEach((g) => {
        const t = new Date(g.date || g.createdAt || 0);
        if (Number.isNaN(t.getTime())) return;
        // Hafta anahtarı: o haftanın pazartesi tarihi
        const gun = (t.getDay() + 6) % 7;
        const pazartesi = new Date(t); pazartesi.setDate(t.getDate() - gun);
        const anahtar = pazartesi.toISOString().slice(0, 10);
        if (!haftalar.has(anahtar)) haftalar.set(anahtar, { hafta: anahtar, cozulen: 0, dogru: 0, yanlis: 0 });
        const h = haftalar.get(anahtar);
        h.dogru += sayi(g.correct); h.yanlis += sayi(g.wrong);
        h.cozulen += sayi(g.correct) + sayi(g.wrong) + sayi(g.blank);
    });
    return [...haftalar.values()]
        .sort((a, b) => a.hafta.localeCompare(b.hafta))
        .map((h) => ({
            ...h,
            etiket: new Date(h.hafta).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
            isabet: h.dogru + h.yanlis ? Math.round((h.dogru / (h.dogru + h.yanlis)) * 100) : null,
        }));
};

/* ══════════════════════════════════════════════════════════════
 *  DENEME ANALİZİ SİSTEMİ EKLERİ
 *  Öğrencinin kendi girdiği kayıtlar (deneme_analizleri) ile koçun
 *  yüklediği v2 sonuçları TEK zaman çizgisinde birleşir; hata nedeni
 *  ve süre analizi yalnızca öğrenci kayıtlarından gelir (v2'de o veri
 *  YOKTUR — uydurulmaz).
 * ══════════════════════════════════════════════════════════════ */

/**
 * v2 (koç) + manuel (öğrenci) denemelerini tek listede, tarihe göre
 * ESKİDEN YENİYE birleştirir. Ortak biçim:
 * { kaynak:'koc'|'ogrenci', ad, tur, tarihMs, totalNet, subjects,
 *   konuHatalari?, degerlendirme?, sureDk?, kayitId? }
 */
export const birlesikDenemeler = (v2Results, manuelKayitlar, ogrenciAdi, sinavTuru = 'all') => {
    const v2 = ogrencininDenemeleri(v2Results, ogrenciAdi, sinavTuru).map((d) => ({
        kaynak: 'koc',
        ad: d.examName || d.name || 'Deneme',
        tur: d.examType || 'TYT',
        tarihMs: new Date(d.uploadedAt || 0).getTime(),
        totalNet: sayi(d.totalNet),
        subjects: d.subjects || {},
    }));
    const manuel = (manuelKayitlar || [])
        .filter((k) => sinavTuru === 'all' || k.tur === sinavTuru)
        .map((k) => ({
            kaynak: 'ogrenci',
            ad: k.ad, tur: k.tur,
            tarihMs: new Date(k.tarih || k.olusturma || 0).getTime(),
            totalNet: +Object.values(k.dersler || {}).reduce((a, d) => a + sayi(d.net), 0).toFixed(2),
            subjects: k.dersler || {},
            konuHatalari: k.konuHatalari || [],
            degerlendirme: k.degerlendirme || null,
            sureDk: k.sureDk || null,
            kayitId: k.id,
        }));
    return [...v2, ...manuel].sort((a, b) => a.tarihMs - b.tarihMs);
};

/**
 * Hata NEDENLERİNİN deneme deneme değişimi (yalnızca öğrenci kayıtları).
 * Dönen: { seriler: [{ad, tarih, <nedenId>: adet…}], toplamlar: [{neden, adet}] }
 * "Dikkat hatası: D1→5, D2→3, D3→1" görünümünün veri kaynağı budur.
 */
export const nedenTrendi = (manuelKayitlar) => {
    const sirali = [...(manuelKayitlar || [])]
        .sort((a, b) => new Date(a.tarih || a.olusturma) - new Date(b.tarih || b.olusturma));
    const toplamMap = new Map();
    const seriler = sirali.map((k, i) => {
        const nokta = {
            sira: i + 1, ad: k.ad,
            tarih: k.tarih ? new Date(k.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '',
        };
        (k.konuHatalari || []).forEach((h) => {
            (h.nedenler || []).forEach((n) => {
                nokta[n] = (nokta[n] || 0) + (sayi(h.adet) || 1);
                toplamMap.set(n, (toplamMap.get(n) || 0) + (sayi(h.adet) || 1));
            });
        });
        return nokta;
    });
    return {
        seriler,
        toplamlar: [...toplamMap.entries()].map(([neden, adet]) => ({ neden, adet })).sort((a, b) => b.adet - a.adet),
    };
};

/** Süre serisi + soru başına ortalama süre (süre girilen kayıtlarda). */
export const sureSerisi = (manuelKayitlar) =>
    [...(manuelKayitlar || [])]
        .filter((k) => sayi(k.sureDk) > 0)
        .sort((a, b) => new Date(a.tarih || 0) - new Date(b.tarih || 0))
        .map((k, i) => {
            const soru = Object.values(k.dersler || {})
                .reduce((a, d) => a + sayi(d.dogru) + sayi(d.yanlis) + sayi(d.bos), 0);
            return {
                sira: i + 1, ad: k.ad,
                tarih: k.tarih ? new Date(k.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '',
                sureDk: sayi(k.sureDk),
                soruBasinaSn: soru > 0 ? Math.round((sayi(k.sureDk) * 60) / soru) : null,
            };
        });

/**
 * Koç özeti — mevcut veriden türetilen kartlar (yapay zekâ değil):
 * en sık hata nedeni, son denemelerde tekrar eden konu, gelişen ve
 * gerileyen alan, takip edilmesi gereken konu.
 */
export const kocOzeti = (birlesik, manuelKayitlar) => {
    const ozet = [];
    const { toplamlar } = nedenTrendi(manuelKayitlar);
    if (toplamlar.length) ozet.push({ tur: 'neden', deger: toplamlar[0].neden, adet: toplamlar[0].adet });

    const konuSay = new Map();
    (manuelKayitlar || []).forEach((k) => (k.konuHatalari || []).forEach((h) => {
        const anahtar = h.ders + ' · ' + h.konu;
        konuSay.set(anahtar, (konuSay.get(anahtar) || 0) + 1);
    }));
    const tekrar = [...konuSay.entries()].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]);
    if (tekrar.length) ozet.push({ tur: 'tekrar-konu', deger: tekrar[0][0], adet: tekrar[0][1] });

    const sozde = birlesik.map((b) => ({ subjects: b.subjects, uploadedAt: new Date(b.tarihMs).toISOString(), totalNet: b.totalNet }));
    const guc = gucluZayifAnalizi(sozde);
    if (guc.gelisen.length) ozet.push({ tur: 'gelisen', deger: guc.gelisen[0].ad, adet: guc.gelisen[0].degisim });
    if (guc.gerileyen.length) ozet.push({ tur: 'gerileyen', deger: guc.gerileyen[0].ad, adet: guc.gerileyen[0].degisim });
    if (tekrar.length || guc.gerileyen.length) {
        ozet.push({ tur: 'takip', deger: tekrar.length ? tekrar[0][0] : guc.gerileyen[0].ad, adet: null });
    }
    return ozet;
};

export default {
    ogrencininDenemeleri, dersOzeti, trendSerisi,
    gucluZayifAnalizi, konuHatalari, calismaOncelikleri, gunlukSeri,
    birlesikDenemeler, nedenTrendi, sureSerisi, kocOzeti,
};
