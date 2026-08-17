/**
 * 🩹 HATA MESAJI ÇEVİRİCİSİ
 *
 * Denetimde 14 yerde ham teknik hata doğrudan kullanıcıya gösteriliyordu:
 *
 *   "Yükleme Hatası: Cannot read properties of undefined (reading 'net')"
 *   "PDF oluşturulurken hata: Failed to execute 'toDataURL' on 'HTMLCanvasElement'"
 *   "Detaylı Hata: NetworkError when attempting to fetch resource."
 *
 * Bunlar öğrenciye ve koça hiçbir şey anlatmıyor; dahası uygulamanın iç
 * yapısını sızdırıyor. Teknik metin KONSOLA yazılır (hata ayıklama için
 * gerekli), kullanıcıya ne olduğu ve ne yapabileceği söylenir.
 *
 * Kullanım:
 *   import { hataAnlat } from '../services/hataMesaji';
 *   catch (err) { bildir(hataAnlat(err, 'excel'), 'hata'); }
 */

/**
 * Teknik metinden tanınabilir kalıplar. Sıra önemlidir: ilk eşleşen kazanır.
 * Her kayıt "ne oldu" + "ne yapabilirsin" içerir.
 */
const KALIPLAR = [
    {
        test: /network|fetch|failed to fetch|net::|ERR_INTERNET|offline/i,
        mesaj: 'İnternet bağlantısı kurulamadı. Bağlantını kontrol edip tekrar dene — girdiğin bilgiler kaybolmadı.',
    },
    {
        test: /permission|insufficient|unauthorized|denied|403/i,
        mesaj: 'Bu işlem için yetkin görünmüyor. Hesabın yeni açıldıysa koçunun onayı gerekebilir.',
    },
    {
        test: /quota|storage|QuotaExceeded/i,
        mesaj: 'Cihazının depolama alanı dolu. Tarayıcı verilerini temizleyip tekrar dene.',
    },
    {
        test: /timeout|timed out|deadline/i,
        mesaj: 'İşlem beklenenden uzun sürdü ve durduruldu. Birkaç saniye sonra tekrar dene.',
    },
    {
        test: /JSON|Unexpected token|parse/i,
        mesaj: 'Dosyanın içeriği okunamadı; biçimi beklenenden farklı görünüyor.',
    },
    {
        test: /canvas|toDataURL|html2canvas|jsPDF|tainted/i,
        mesaj: 'Belge oluşturulamadı. Sayfayı yenileyip tekrar dene; sorun sürerse tarayıcıyı güncellemek çözebilir.',
    },
    {
        test: /xlsx|excel|sheet|workbook/i,
        mesaj: 'Excel dosyası okunamadı. Dosyanın bozuk olmadığından ve doğru şablonla hazırlandığından emin ol.',
    },
    {
        test: /undefined|null|not a function|cannot read/i,
        mesaj: 'Beklenmeyen bir durum oluştu. Sayfayı yenilemek genellikle çözüyor.',
    },
];

/** Bağlama özel mesajlar — kalıplardan daha önce denenir. */
const BAGLAMLAR = {
    excel: 'Excel dosyası yüklenemedi. Dosyanın doğru şablonla hazırlandığını ve sütun başlıklarının değişmediğini kontrol et.',
    pdf: 'PDF hazırlanamadı. Sayfayı yenileyip tekrar dene; sorun sürerse ekranı biraz daraltmak yardımcı olabilir.',
    mesaj: 'Mesaj gönderilemedi. Bağlantını kontrol edip tekrar dene — yazdığın metin kaybolmadı.',
    kaydet: 'Kaydedilemedi. Bağlantını kontrol edip tekrar dene; verilerin bu cihazda duruyor.',
    yukle: 'Veriler yüklenemedi. Sayfayı yenilemek genellikle çözüyor.',
    sonuc: 'Sonuç hesaplanamadı. Girdiğin cevapların eksiksiz olduğunu kontrol et.',
};

/**
 * @param {Error|string} hata     yakalanan hata
 * @param {string}       baglam   'excel' | 'pdf' | 'mesaj' | 'kaydet' | 'yukle' | 'sonuc'
 * @returns {string} kullanıcıya gösterilecek metin
 */
export function hataAnlat(hata, baglam) {
    const teknik = String(hata?.message || hata || '');

    // Teknik metin geliştirici için konsolda kalır
    if (teknik) console.error(`[${baglam || 'hata'}]`, hata);

    // Bağlam verildiyse önce onun cümlesi
    if (baglam && BAGLAMLAR[baglam]) {
        // Ağ hatası her bağlamdan önce gelir — çözümü farklıdır
        if (/network|fetch|offline|net::/i.test(teknik)) return KALIPLAR[0].mesaj;
        return BAGLAMLAR[baglam];
    }

    for (const k of KALIPLAR) {
        if (k.test.test(teknik)) return k.mesaj;
    }

    return 'Beklenmeyen bir durum oluştu. Sayfayı yenileyip tekrar dene; sorun sürerse koçuna bildir.';
}

export default hataAnlat;
