/**
 * 🎯 ALAN → DERS → KONU seçim yardımcısı (V1.1)
 *
 * Günlük Kayıt ve Hata Defteri'nde ders kutusu eskiden SABİT bir liste
 * gösteriyordu: Sözel öğrencisine Fizik, TYT öğrencisine Edebiyat
 * çıkıyordu ve konu kutusu tamamen serbest metindi.
 *
 * Burada dersler öğrencinin SINAV ve ALANINA göre `data/examTopics`
 * kataloğundan türetilir (TYT ortak dersleri alanın bölüm listesinde
 * zaten var); konular seçilen dersin müfredat konularıdır. Katalog tek
 * kaynaktır — alan/ders/konu verisi bir daha elle kopyalanmaz.
 *
 * Kayıt biçimi DEĞİŞMEZ: `subject` görünen ders adı, `topic` konu adı
 * olarak yazılır — eski kayıtlar ve koç tarafı aynı standardı okur.
 */
import { ogrencininSinavi, ogrencininBolumleri, dersAdi } from '../data/examTopics';

/**
 * Öğrencinin alanına düşen dersler, her biri konu listesiyle.
 * Dönen kayıt: { anahtar, ad, konular: [konu adı, …] }
 * Alan bilinmiyorsa sınavın tüm bölümleri döner (güvenli genişleme).
 */
export const ogrencininDersleri = (ogrenci) => {
    const sinav = ogrencininSinavi(ogrenci);
    const bolumler = ogrencininBolumleri(ogrenci, sinav) || [];

    const sira = [];
    const gorulen = new Map();
    bolumler.forEach((b) => {
        Object.entries(b.dersler || {}).forEach(([anahtar, konular]) => {
            if (!gorulen.has(anahtar)) {
                const kayit = { anahtar, ad: dersAdi(anahtar), konular: [] };
                gorulen.set(anahtar, kayit);
                sira.push(kayit);
            }
            const kayit = gorulen.get(anahtar);
            const mevcut = new Set(kayit.konular);
            (konular || []).forEach((t) => {
                if (!mevcut.has(t.ad)) { mevcut.add(t.ad); kayit.konular.push(t.ad); }
            });
        });
    });
    return sira;
};

/** Görünen ders adından konu listesi (ders bulunamazsa boş). */
export const dersinKonulari = (dersler, gorunenAd) =>
    dersler.find((d) => d.ad === gorunenAd)?.konular || [];

export default { ogrencininDersleri, dersinKonulari };
