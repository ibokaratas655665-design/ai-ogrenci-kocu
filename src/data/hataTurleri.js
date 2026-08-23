/**
 * ❌ HATA TÜRLERİ — TEK KAYNAK
 *
 * Bu liste dört ayrı dosyada, dört ayrı kopya hâlinde duruyordu:
 *
 *   ErrorNotebook   → knowledge, careless, interpretation, time, calculation
 *   DenemeAnalizi   → knowledge, misread, time, calculation, careless
 *   KocDegerlendirme→ knowledge, misread, time, …
 *   KocGenelBakis   → knowledge, misread, time, …
 *
 * Öğrenci hata defterine kayıt girerken YALNIZCA birinci listeden
 * seçebiliyor, diğer üç ekran ise ikinci listeye bakıyordu. Sonuç
 * ölçüldü: "Yorum Hatası" seçilen kayıtlar deneme analizinde ve koç
 * panellerinde ham kimlikle, "interpretation: 4" diye görünüyordu.
 * Üç kopyada da bulunan `misread` ise hiçbir yerde ÜRETİLMİYOR —
 * kullanılmayan eski bir kimlik, geriye dönük uyum için burada
 * tutulur ama seçilebilir türler arasında değildir.
 *
 * ⚠️ Kimlikler (`id`) kayıtlarda saklanıyor; DEĞİŞTİRİLEMEZ.
 * Değişirse geçmiş kayıtların türü çözülemez hâle gelir.
 */

/** Öğrencinin hata defterinde seçebildiği türler — sıra ekranda da bu. */
export const HATA_TURLERI = [
    { id: 'knowledge', label: 'Bilgi Eksiği', color: 'var(--danger)', hint: 'Konuyu tam bilmiyordum' },
    { id: 'careless', label: 'Dikkatsizlik', color: 'var(--highlight)', hint: 'Biliyordum ama yanlış işaretledim' },
    { id: 'interpretation', label: 'Yorum Hatası', color: 'var(--c4)', hint: 'Soruyu yanlış anladım' },
    { id: 'time', label: 'Zaman Yetmedi', color: 'var(--info)', hint: 'Süre bitti, boş bıraktım' },
    { id: 'calculation', label: 'İşlem Hatası', color: 'var(--accent)', hint: 'Yol doğruydu, işlemde hata yaptım' },
];

/**
 * Artık üretilmeyen ama eski kayıtlarda geçebilecek kimlikler.
 * Yalnızca OKUNUR: yeni kayıt bu türlerle açılmaz, ama açılmış
 * kayıt ham kimlikle görünmesin diye adı burada durur.
 */
const ESKI_TURLER = {
    misread: 'Soruyu Yanlış Okuma',
};

const AD = Object.fromEntries(HATA_TURLERI.map((t) => [t.id, t.label]));

/** Tür kimliğinin okunabilir adı. Bilinmeyen kimlik kendi hâliyle döner. */
export const hataTuruAdi = (id) => AD[id] || ESKI_TURLER[id] || id || '—';

/** Tür kimliğinin rengi. Bilinmeyen kimlik nötr. */
export const hataTuruRengi = (id) =>
    HATA_TURLERI.find((t) => t.id === id)?.color || 'var(--ink-3)';

export default { HATA_TURLERI, hataTuruAdi, hataTuruRengi };
