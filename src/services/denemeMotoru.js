/**
 * 📝 DENEME MOTORU
 *
 * Uygulama içi deneme sistemi — üç depo, tek yaşam döngüsü:
 *
 *   deneme_kaynaklari  koçun tanımladığı denemeler (PDF kitapçık +
 *                      cevap anahtarı + soru listesi)
 *   deneme_atamalari   hangi kaynak hangi öğrencilere, hangi tarihte
 *   deneme_oturumlari  öğrencinin çözüm oturumu (cevaplar, süreler, sonuç)
 *
 * Oturum bittiğinde sonuç OTOMATİK puanlanır ve deneme_analizleri
 * merkezine yazılır (denemeKayitlari.kaydet) — konu hataları oradan
 * Hata Defteri'ni ve konu motorunu besler.
 *
 * PDF saklama iki yolla: küçük dosyalar data-URI olarak kayda gömülür
 * (senkronla cihazlar arası taşınır), büyükler Firebase Storage'a
 * yüklenir ve kayda yalnız url/yol yazılır.
 */
import { listeOku, yaz } from './veriDeposu';
import denemeKayitlari from './denemeKayitlari';

const KAYNAK = 'deneme_kaynaklari';
const ATAMA = 'deneme_atamalari';
const OTURUM = 'deneme_oturumlari';

/** Base64 PDF'lerin kayda gömülebileceği üst sınır (~5MB dosya ≈ 6.8M karakter). */
const PDF_GOMME_SINIRI = 6800000;

export const SINAV_TURLERI = ['TYT', 'AYT', 'YDT', 'TYT+AYT', 'TYT+YDT', 'LGS', 'KPSS', 'AGS'];

const kimlikUret = (onek) => `${onek}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const net = (dogru, yanlis) => +(((Number(dogru) || 0) - (Number(yanlis) || 0) / 4)).toFixed(2);
const bugunISO = () => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

const kaynaklar = () => listeOku(KAYNAK);
const atamalar = () => listeOku(ATAMA);
const oturumlar = () => listeOku(OTURUM);

/**
 * Tek satırlık ders anahtarlarından soru listesi üretir.
 * Girdi: [{ders, konu?, anahtar: "ABDCE..."}] — şıklar BİTİŞİK dizi.
 */
export const anahtardanSorular = (dersAnahtarlari) => {
    const gecerli = new Set(['A', 'B', 'C', 'D', 'E']);
    const sorular = [];
    (Array.isArray(dersAnahtarlari) ? dersAnahtarlari : []).forEach((satir) => {
        const ders = String(satir?.ders || '').trim();
        const konu = satir?.konu ? String(satir.konu).trim() : null;
        String(satir?.anahtar || '')
            .toUpperCase()
            .replace(/[^A-E]/g, '')
            .split('')
            .forEach((sik) => {
                if (ders && gecerli.has(sik)) {
                    sorular.push({ id: `s${sorular.length + 1}`, ders, konu, no: sorular.length + 1, dogru: sik });
                }
            });
    });
    return sorular;
};

// ══════════════════════════════════════════════════════════════
//  KAYNAK (koç tarafı)
// ══════════════════════════════════════════════════════════════

export const kaynaklariListele = kaynaklar;

export const kaynakOlustur = ({
    ad, tur = 'TYT', alan = null, olusturanId, olusturanAd, sureDk, sorular, dersAnahtarlari,
    pdfAd, pdfData, pdfUrl, pdfYol, pdfCevapAd, pdfCevapData, pdfCevapUrl, pdfCevapYol,
}) => {
    const temizAd = String(ad || '').trim();
    if (!temizAd) return { basarili: false, hata: 'Deneme adı zorunludur.' };

    const soruListesi = Array.isArray(sorular) && sorular.length
        ? sorular
            .filter((s) => s && s.ders && s.dogru)
            .map((s, i) => ({
                id: s.id || `s${i + 1}`,
                ders: String(s.ders).trim(),
                konu: s.konu ? String(s.konu).trim() : null,
                no: s.no || i + 1,
                dogru: String(s.dogru).trim().toUpperCase(),
            }))
        : anahtardanSorular(dersAnahtarlari);

    // Soru listesi yoksa otomatik puanlama yapılamaz; en azından öğrencinin
    // bakacağı bir cevap anahtarı PDF'i şart.
    if (soruListesi.length === 0 && !pdfCevapData && !pdfCevapUrl) {
        return { basarili: false, hata: 'Cevap anahtarı gerekli: PDF yükleyin ya da tek satırlık anahtarı (Ders: ABCDE) girin.' };
    }
    if (String(pdfData || '').length + String(pdfCevapData || '').length > PDF_GOMME_SINIRI) {
        return { basarili: false, hata: 'PDF(ler) çok büyük. Buluta yüklenemedi; toplam ~5MB altında tutun ya da Storage’ı etkinleştirin.' };
    }

    const kaynak = {
        id: kimlikUret('dk'),
        ad: temizAd,
        tur,
        alan,
        olusturanId: olusturanId || null,
        olusturanAd: String(olusturanAd || 'Koç').trim(),
        sureDk: Number(sureDk) || null,
        sorular: soruListesi,
        toplamSoru: soruListesi.length,
        otomatikPuan: soruListesi.length > 0,
        pdfAd: pdfAd ? String(pdfAd) : null,
        pdfData: pdfData || null,
        pdfUrl: pdfUrl || null,
        pdfYol: pdfYol || null,
        pdfCevapAd: pdfCevapAd ? String(pdfCevapAd) : null,
        pdfCevapData: pdfCevapData || null,
        pdfCevapUrl: pdfCevapUrl || null,
        pdfCevapYol: pdfCevapYol || null,
        createdAt: new Date().toISOString(),
    };
    yaz(KAYNAK, [...kaynaklar(), kaynak]);
    return { basarili: true, kaynak };
};

export const kaynakSil = (kaynakId) => {
    yaz(KAYNAK, kaynaklar().filter((k) => k.id !== kaynakId), { zorla: true });
    yaz(ATAMA, atamalar().filter((a) => a.kaynakId !== kaynakId), { zorla: true });
    return { basarili: true };
};

// ══════════════════════════════════════════════════════════════
//  ATAMA (koç → öğrenciler)
// ══════════════════════════════════════════════════════════════

export const atamalariListele = atamalar;

export const ata = ({ kaynakId, studentIds, atayanId, atayanAd, acilisTarihi, sonTarih }) => {
    if (!kaynakId) return { basarili: false, hata: 'Kaynak seçilmedi.' };
    const kimlikler = (Array.isArray(studentIds) ? studentIds : []).map(String).filter(Boolean);
    if (kimlikler.length === 0) return { basarili: false, hata: 'En az bir öğrenci seçin.' };

    const atama = {
        id: kimlikUret('at'),
        kaynakId,
        studentIds: kimlikler,
        atayanId: atayanId || null,
        atayanAd: String(atayanAd || 'Koç').trim(),
        acilisTarihi: acilisTarihi || null,
        sonTarih: sonTarih || null,
        createdAt: new Date().toISOString(),
    };
    yaz(ATAMA, [...atamalar(), atama]);
    return { basarili: true, atama };
};

export const atamaSil = (atamaId) => {
    yaz(ATAMA, atamalar().filter((a) => a.id !== atamaId), { zorla: true });
    return { basarili: true };
};

/** Kaynağın TÜM atamalarını geri alır; çözülmüş sonuçlar korunur. */
export const atamalariGeriAl = (kaynakId) => {
    yaz(ATAMA, atamalar().filter((a) => a.kaynakId !== kaynakId), { zorla: true });
    return { basarili: true };
};

export const ogrenciyiCikar = (kaynakId, studentId) => {
    const sid = String(studentId);
    const yeni = atamalar()
        .map((a) => (a.kaynakId === kaynakId
            ? { ...a, studentIds: (a.studentIds || []).map(String).filter((x) => x !== sid) }
            : a))
        .filter((a) => a.kaynakId !== kaynakId || (a.studentIds || []).length > 0);
    yaz(ATAMA, yeni, { zorla: true });
    return { basarili: true };
};

/**
 * Öğrencinin görebileceği atamalar: kaynağıyla birlikte, çözülmüşlük ve
 * açılış tarihi bilgisiyle. Açılışı gelmemiş deneme listede görünür ama
 * kilitlidir (acik: false) — sona sıralanır.
 */
export const ogrenciyeAtananlar = (studentId) => {
    const sid = String(studentId);
    const tumKaynaklar = kaynaklar();
    const cozulmus = new Set(
        oturumlar()
            .filter((o) => String(o.studentId) === sid && o.durum === 'bitti')
            .map((o) => o.kaynakId),
    );
    const bugun = bugunISO();
    return atamalar()
        .filter((a) => a.studentIds.map(String).includes(sid))
        .map((a) => {
            const kaynak = tumKaynaklar.find((k) => k.id === a.kaynakId);
            if (!kaynak) return null;
            const acik = !a.acilisTarihi || String(a.acilisTarihi) <= bugun;
            return { atama: a, kaynak, cozuldu: cozulmus.has(a.kaynakId), acik, acilisTarihi: a.acilisTarihi || null };
        })
        .filter(Boolean)
        .sort((a, b) => (a.acik === b.acik ? 0 : a.acik ? -1 : 1));
};

// ══════════════════════════════════════════════════════════════
//  OTURUM (öğrenci tarafı)
// ══════════════════════════════════════════════════════════════

export const oturumlariListele = oturumlar;

/** Devam eden oturum varsa ona döner; yoksa yenisini açar. */
export const oturumBaslat = (kaynakId, studentId) => {
    const sid = String(studentId);
    const devam = oturumlar().find(
        (o) => o.kaynakId === kaynakId && String(o.studentId) === sid && o.durum === 'devam',
    );
    if (devam) return { basarili: true, oturum: devam, yeni: false };

    const oturum = {
        id: kimlikUret('ot'),
        kaynakId,
        studentId: sid,
        cevaplar: {},
        baslangic: new Date().toISOString(),
        bitis: null,
        durum: 'devam',
    };
    yaz(OTURUM, [...oturumlar(), oturum]);
    return { basarili: true, oturum, yeni: true };
};

export const cevapKaydet = (oturumId, soruId, cevap) => {
    const liste = oturumlar();
    const i = liste.findIndex((o) => o.id === oturumId);
    if (i < 0) return { basarili: false, hata: 'Oturum bulunamadı.' };
    if (liste[i].durum === 'bitti') return { basarili: false, hata: 'Oturum kapandı.' };
    liste[i] = { ...liste[i], cevaplar: { ...liste[i].cevaplar, [soruId]: cevap } };
    yaz(OTURUM, liste);
    return { basarili: true };
};

/**
 * Oturumu kapatır, puanlar ve deneme_analizleri merkezine yazar.
 *
 * @param {object} davranis  çözüm davranışı istatistiği:
 *   sureler: {soruId: ms} · degisimler: {soruId: adet} · ilkDers: string
 * @param {string|null} cizim  öğrencinin karalama tuvali (data-URI, isteğe bağlı)
 */
export const oturumBitir = (oturumId, { studentName, davranis = {}, cizim = null } = {}) => {
    const liste = oturumlar();
    const i = liste.findIndex((o) => o.id === oturumId);
    if (i < 0) return { basarili: false, hata: 'Oturum bulunamadı.' };

    const oturum = liste[i];
    const kaynak = kaynaklar().find((k) => k.id === oturum.kaynakId);
    if (!kaynak) return { basarili: false, hata: 'Deneme kaynağı bulunamadı.' };

    const sureler = davranis.sureler || {};
    const dersSayac = {};
    const konuSayac = {};
    const yanlisSorular = [];
    let dogru = 0, yanlis = 0, bos = 0;

    kaynak.sorular.forEach((soru) => {
        const ders = soru.ders;
        const konu = soru.konu || null;
        if (!dersSayac[ders]) dersSayac[ders] = { dogru: 0, yanlis: 0, bos: 0 };
        const konuAnahtari = konu ? `${ders}||${konu}` : null;
        if (konuAnahtari && !konuSayac[konuAnahtari]) {
            konuSayac[konuAnahtari] = { ders, konu, dogru: 0, yanlis: 0, bos: 0, sureMs: 0 };
        }
        const verilen = oturum.cevaplar[soru.id];
        if (verilen == null || verilen === '') {
            dersSayac[ders].bos++; bos++;
            if (konuAnahtari) konuSayac[konuAnahtari].bos++;
        } else if (String(verilen) === String(soru.dogru)) {
            dersSayac[ders].dogru++; dogru++;
            if (konuAnahtari) konuSayac[konuAnahtari].dogru++;
        } else {
            dersSayac[ders].yanlis++; yanlis++;
            if (konuAnahtari) konuSayac[konuAnahtari].yanlis++;
            yanlisSorular.push({ no: soru.no, ders, konu, verilen, dogru: soru.dogru });
        }
        if (konuAnahtari) konuSayac[konuAnahtari].sureMs += Number(sureler[soru.id]) || 0;
    });

    const dersler = {};
    Object.entries(dersSayac).forEach(([ders, s]) => {
        dersler[ders] = { dogru: s.dogru, yanlis: s.yanlis, bos: s.bos, net: net(s.dogru, s.yanlis) };
    });
    const netSonuc = net(dogru, yanlis);

    const konular = Object.values(konuSayac)
        .map((k) => ({
            ders: k.ders, konu: k.konu, dogru: k.dogru, yanlis: k.yanlis, bos: k.bos,
            net: net(k.dogru, k.yanlis), sureMs: k.sureMs, sureDk: +(k.sureMs / 60000).toFixed(1),
        }))
        .sort((a, b) => b.yanlis - a.yanlis || b.sureMs - a.sureMs);
    const konuHatalari = konular
        .filter((k) => k.yanlis > 0)
        .map((k) => ({ ders: k.ders, konu: k.konu, adet: k.yanlis, nedenler: [], not: '' }));

    // Davranış istatistiği: soru başına süre, en uzun soru, cevap değişimi
    const degisimler = davranis.degisimler || {};
    const dersSureMs = {};
    let toplamSureMs = 0;
    let enUzunSoru = null;
    kaynak.sorular.forEach((soru) => {
        const ms = Number(sureler[soru.id]) || 0;
        toplamSureMs += ms;
        dersSureMs[soru.ders] = (dersSureMs[soru.ders] || 0) + ms;
        if (ms > 0 && (!enUzunSoru || ms > enUzunSoru.ms)) {
            enUzunSoru = { no: soru.no, ders: soru.ders, konu: soru.konu || null, ms };
        }
    });
    const soruSayisi = kaynak.sorular.length || 1;
    const istatistik = {
        ilkDers: davranis.ilkDers || null,
        toplamSureMs,
        toplamSureDk: +(toplamSureMs / 60000).toFixed(1),
        ortSoruSaniye: +(toplamSureMs / soruSayisi / 1000).toFixed(1),
        dersSureMs,
        enUzunSoru,
        toplamDegisim: Object.values(degisimler).reduce((t, d) => t + (Number(d) || 0), 0),
        yanlisSorular,
        konular,
    };

    liste[i] = {
        ...oturum,
        bitis: new Date().toISOString(),
        durum: 'bitti',
        dogruSayisi: dogru,
        yanlisSayisi: yanlis,
        bosSayisi: bos,
        netSonuc,
        istatistik,
        cizim: cizim || null,
    };
    yaz(OTURUM, liste);

    // Merkeze yaz: konu hataları buradan Hata Defteri'ni ve konu motorunu besler
    let merkeze = null;
    try {
        merkeze = denemeKayitlari.kaydet({
            studentId: oturum.studentId,
            studentName: studentName || '',
            ad: kaynak.ad,
            tur: kaynak.tur || 'TYT',
            alan: kaynak.alan || null,
            tarih: bugunISO(),
            sureDk: kaynak.sureDk || null,
            dersler,
            konuHatalari,
            degerlendirme: { kaynak: 'uygulama-ici-deneme', motorOturumId: oturum.id, istatistik },
        });
    } catch (e) {
        merkeze = { basarili: false, hata: String(e) };
    }

    return { basarili: true, oturumId, netSonuc, dogruSayisi: dogru, yanlisSayisi: yanlis, bosSayisi: bos, dersler, istatistik, merkeze };
};

// ══════════════════════════════════════════════════════════════
//  PDF SAKLAMA — Firebase Storage (büyük dosyalar için)
// ══════════════════════════════════════════════════════════════

const storageHatasi = (e) => {
    const kod = e?.code || '';
    if (kod === 'storage/unauthorized') return 'Storage izni yok — güvenlik kuralları yüklenmemiş olabilir.';
    if (kod === 'storage/unauthenticated') return 'Oturum gerekli — çıkış yapıp tekrar girin.';
    if (kod === 'storage/retry-limit-exceeded') return 'Ağ yavaş, yükleme zaman aşımına uğradı.';
    if (/quota/i.test(kod)) return 'Storage kotası doldu.';
    if (/object-not-found|bucket/i.test(kod)) return 'Storage kovası bulunamadı — konsolda Storage etkinleştirilmeli.';
    return e?.message || 'Yükleme hatası';
};

/** PDF'i Storage'a yükler; {url, yol} döner. Storage modülü tembel yüklenir. */
export const pdfYukle = async ({ dataUrl, ad, klasor = 'denemeler' }) => {
    if (!dataUrl) return { basarili: false, hata: 'Dosya yok.' };
    try {
        const [{ getStorage, ref, uploadString, getDownloadURL }, { default: app, auth }] = await Promise.all([
            import('firebase/storage'),
            import('../firebaseConfig'),
        ]);
        const storage = getStorage(app);
        if (!storage) return { basarili: false, hata: 'Storage başlatılamadı.' };
        const guvenliAd = String(ad || 'dosya').replace(/[^\w.\-]+/g, '_').slice(-80);
        const yol = `${klasor}/${auth?.currentUser?.uid || 'anon'}/${Date.now()}_${guvenliAd}`;
        const dosyaRef = ref(storage, yol);
        await uploadString(dosyaRef, dataUrl, 'data_url');
        const url = await getDownloadURL(dosyaRef);
        return { basarili: true, url, yol };
    } catch (e) {
        return { basarili: false, hata: storageHatasi(e) };
    }
};

export const pdfSil = async (yol) => {
    if (!yol) return;
    try {
        const [{ getStorage, ref, deleteObject }, { default: app }] = await Promise.all([
            import('firebase/storage'),
            import('../firebaseConfig'),
        ]);
        await deleteObject(ref(getStorage(app), yol));
    } catch { /* silinemeyen artık dosya kritik değil */ }
};

/**
 * Bir kaynağın PDF bağlantısını çözer: gömülü data → doğrudan;
 * url → doğrudan; yalnız yol varsa Storage'dan indirilebilir adres alınır.
 * @param {'soru'|'cevap'} hangisi
 */
export const pdfBaglantiAl = async (kaynak, hangisi = 'soru') => {
    const data = hangisi === 'cevap' ? kaynak?.pdfCevapData : kaynak?.pdfData;
    const url = hangisi === 'cevap' ? kaynak?.pdfCevapUrl : kaynak?.pdfUrl;
    const yol = hangisi === 'cevap' ? kaynak?.pdfCevapYol : kaynak?.pdfYol;
    if (data) return { basarili: true, adres: data };
    if (url) return { basarili: true, adres: url };
    if (yol) {
        try {
            const [{ getStorage, ref, getDownloadURL }, { default: app }] = await Promise.all([
                import('firebase/storage'),
                import('../firebaseConfig'),
            ]);
            return { basarili: true, adres: await getDownloadURL(ref(getStorage(app), yol)) };
        } catch (e) {
            return { basarili: false, hata: storageHatasi(e) };
        }
    }
    return { basarili: false, hata: 'PDF bulunamadı.' };
};

// ══════════════════════════════════════════════════════════════
//  KOÇ DONUTU — deneme öncesi kısa moral notu 🍩
// ══════════════════════════════════════════════════════════════

const DONUT = 'koc_donutleri';
const donutlar = () => listeOku(DONUT);

export const donutOku = (studentId) => {
    const sid = String(studentId || '');
    return (sid && donutlar().find((d) => String(d.studentId) === sid)) || null;
};

/** Boş metin yazmak notu siler — ayrı silme ucu gerekmez. */
export const donutYaz = ({ studentId, metin, kocId, kocAd }) => {
    const sid = String(studentId || '');
    if (!sid) return { basarili: false, hata: 'Öğrenci belirsiz.' };
    const liste = donutlar();
    const i = liste.findIndex((d) => String(d.studentId) === sid);
    const temiz = String(metin || '').trim();
    if (!temiz) {
        if (i >= 0) {
            liste.splice(i, 1);
            yaz(DONUT, liste, { zorla: true });
        }
        return { basarili: true, silindi: true };
    }
    const donut = {
        id: i >= 0 ? liste[i].id : `kd_${Date.now()}`,
        studentId: sid,
        metin: temiz,
        kocId: kocId || null,
        kocAd: String(kocAd || 'Koç').trim(),
        tarih: new Date().toISOString(),
    };
    if (i >= 0) liste[i] = donut; else liste.push(donut);
    yaz(DONUT, liste);
    return { basarili: true, donut };
};

export default {
    SINAV_TURLERI,
    anahtardanSorular,
    kaynaklariListele, kaynakOlustur, kaynakSil,
    atamalariListele, ata, atamaSil, atamalariGeriAl, ogrenciyiCikar, ogrenciyeAtananlar,
    oturumlariListele, oturumBaslat, cevapKaydet, oturumBitir,
    pdfYukle, pdfSil, pdfBaglantiAl,
    donutOku, donutYaz,
};
