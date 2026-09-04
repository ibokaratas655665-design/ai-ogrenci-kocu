/**
 * 📝 DENEME ANALİZİ KAYITLARI (Deneme Analizi sistemi)
 *
 * YENİ MEKANİZMA — NEDEN ZORUNLU?
 * Mevcut deneme verisi (`v2_results_data`) KOÇUN yüklediği sonuç
 * listesidir: ad ile eşleşir, konu/hata nedeni/öz değerlendirme alanı
 * yoktur ve öğrenci yazamaz. "Öğrencinin kendi deneme analizi" için
 * konu bazlı hata + MANUEL hata nedeni + öz değerlendirme taşıyan ayrı
 * bir kayıt gövdesi gerekir. v2'yi genişletmek koç analiz borusunu
 * (ClassRanking, ExamAnalytics…) riske atardı; bu yüzden AYRI anahtar
 * (`deneme_analizleri`) kullanılır, analiz katmanı iki kaynağı okurken
 * birleştirir (bkz. utils/denemeAnalizi.birlesikDenemeler).
 *
 * Kayıt şekli:
 * {
 *   id: 'da_…', studentId, studentName,
 *   ad, tur: 'TYT'|'AYT'|'Branş'|'Diğer', tarih: 'YYYY-MM-DD', sureDk,
 *   dersler: { <dersAdı>: { dogru, yanlis, bos, net } },   // net otomatik
 *   konuHatalari: [ { ders, konu, adet, nedenler: [nedenId…], not } ],
 *   degerlendirme: { sure, odak, duygu, zorlanilanDers,
 *                    memnuniyet, sonrakiHedef, not },
 *   olusturma
 * }
 *
 * OTOMATİK ve MANUEL ayrımı: D/Y/B/net/toplamlar otomatik hesaplanır;
 * hata NEDENLERİ ve öz değerlendirme yalnızca öğrencinin girdisidir —
 * hiçbir neden otomatik tahmin edilmez.
 */
import { listeOku, yaz } from './veriDeposu';

const ANAHTAR = 'deneme_analizleri';

/** TYT/AYT net kuralı: 4 yanlış 1 doğruyu götürür. */
export const netHesapla = (dogru, yanlis) =>
    +(((Number(dogru) || 0) - (Number(yanlis) || 0) / 4)).toFixed(2);

export const tumunuListele = () => listeOku(ANAHTAR);

export const ogrencininKayitlari = (studentId) =>
    tumunuListele()
        .filter((k) => String(k.studentId) === String(studentId))
        .sort((a, b) => new Date(a.tarih || a.olusturma) - new Date(b.tarih || b.olusturma));

/**
 * Yeni deneme analizi kaydeder.
 * Çift kayıt koruması: aynı öğrenci + aynı ad + aynı tarih reddedilir.
 */
export const kaydet = ({ studentId, studentName, ad, tur, alan = null, tarih, sureDk, dersler, konuHatalari, degerlendirme }) => {
    const temizAd = String(ad || '').trim();
    if (!studentId) return { basarili: false, hata: 'Öğrenci kimliği yok.' };
    if (!temizAd) return { basarili: false, hata: 'Deneme adı zorunludur.' };

    const liste = tumunuListele();
    const ayni = liste.some((k) =>
        String(k.studentId) === String(studentId) &&
        String(k.ad).trim().toLocaleLowerCase('tr-TR') === temizAd.toLocaleLowerCase('tr-TR') &&
        k.tarih === tarih);
    if (ayni) return { basarili: false, hata: 'Bu ad ve tarihle bir deneme zaten kayıtlı.' };

    // Ders satırları: net OTOMATİK hesaplanır, elle gelen net ezilir
    const dersOzet = {};
    Object.entries(dersler || {}).forEach(([dersAd, s]) => {
        const dogru = Number(s?.dogru) || 0;
        const yanlis = Number(s?.yanlis) || 0;
        const bos = Number(s?.bos) || 0;
        if (dogru + yanlis + bos === 0) return; // boş satır kaydedilmez
        dersOzet[dersAd] = { dogru, yanlis, bos, net: netHesapla(dogru, yanlis) };
    });

    const kayit = {
        id: `da_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        studentId, studentName: String(studentName || '').trim(),
        ad: temizAd,
        tur: tur || 'TYT',
        alan: alan || null, // AYT için alan bilgisi (SAY/EA/SOZ); TYT'de null
        tarih: tarih || new Date().toISOString().slice(0, 10),
        sureDk: Number(sureDk) || null,
        dersler: dersOzet,
        konuHatalari: (konuHatalari || [])
            .filter((h) => h.ders && h.konu && (Number(h.adet) || 0) > 0)
            .map((h) => ({
                ders: String(h.ders).trim(),
                konu: String(h.konu).trim(),
                adet: Number(h.adet) || 1,
                nedenler: Array.isArray(h.nedenler) ? h.nedenler.filter(Boolean) : [],
                not: String(h.not || '').trim(),
            })),
        degerlendirme: degerlendirme || null,
        olusturma: new Date().toISOString(),
    };
    yaz(ANAHTAR, [...liste, kayit]);
    return { basarili: true, kayit };
};

/**
 * Kayıt siler. Sahiplik: çağıran, kaydın öğrencisini bilmek zorundadır
 * (öğrenci kendi kimliğiyle, koç baktığı öğrencinin kimliğiyle çağırır).
 * `zorla`: son kayıt silinince boş liste de buluta gider — geri gelmez.
 */
export const sil = (id, studentId) => {
    const liste = tumunuListele();
    const hedef = liste.find((k) => k.id === id);
    if (!hedef) return { basarili: false, hata: 'Kayıt bulunamadı.' };
    if (String(hedef.studentId) !== String(studentId)) {
        return { basarili: false, hata: 'Bu kayıt bu öğrenciye ait değil.' };
    }
    yaz(ANAHTAR, liste.filter((k) => k.id !== id), { zorla: true });
    return { basarili: true };
};

export default { tumunuListele, ogrencininKayitlari, kaydet, sil, netHesapla };
