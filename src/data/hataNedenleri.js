/**
 * 🧭 HATA NEDENİ SINIFLANDIRMASI (Deneme Analizi sistemi)
 *
 * Araştırma temeli: YKS deneme analizi kaynakları hatayı üç ana eksende
 * sınıflandırıyor — "bilgi mi, süre mi, dikkat mi?" — ve her eksen farklı
 * bir aksiyon gerektiriyor (bilgi → konu çalış; süre → strateji; dikkat →
 * çözüm alışkanlığı). Buradaki 8+1 kategori o üç ekseni, öğrenciye form
 * yükü bindirmeden kapsayacak en sade kırılımdır.
 *
 * `aksiyon` alanı analizde öneri metnine dönüşür; `eksen` alanı grafikte
 * gruplama içindir. `eskiKarsilik` mevcut Hata Defteri türleriyle köprü
 * kurar (iki sistem AYNI dili konuşur, veri iki kez tanımlanmaz).
 */

export const HATA_NEDENLERI = [
    { id: 'bilgi', ad: 'Konu / bilgi eksiği', eksen: 'bilgi', aksiyon: 'Konunun anlatımına geri dön', eskiKarsilik: 'knowledge' },
    { id: 'kavram', ad: 'Kavram yanılgısı / yanlış yöntem', eksen: 'bilgi', aksiyon: 'Çözümlü örneklerle yöntemi düzelt', eskiKarsilik: null },
    { id: 'okuma', ad: 'Soruyu yanlış okuma / anlama', eksen: 'dikkat', aksiyon: 'Soru kökünün altını çizerek oku', eskiKarsilik: 'misread' },
    { id: 'islem', ad: 'İşlem hatası', eksen: 'dikkat', aksiyon: 'İşlemleri düzenli yaz, sağlama yap', eskiKarsilik: 'calculation' },
    { id: 'dikkat', ad: 'Dikkatsizlik / acele', eksen: 'dikkat', aksiyon: 'Hız yerine doğruluğa odaklan', eskiKarsilik: 'careless' },
    { id: 'sure', ad: 'Süre yetmedi / süre baskısı', eksen: 'sure', aksiyon: 'Soru başına süre stratejisi kur', eskiKarsilik: 'time' },
    { id: 'ikilem', ad: 'İki seçenek arasında kaldım', eksen: 'bilgi', aksiyon: 'Çeldirici analizi çalış', eskiKarsilik: null },
    { id: 'tanima', ad: 'Soru tipini tanıyamadım', eksen: 'bilgi', aksiyon: 'O konunun farklı soru tiplerini gör', eskiKarsilik: null },
    { id: 'diger', ad: 'Diğer', eksen: 'diger', aksiyon: null, eskiKarsilik: null },
];

export const nedenAdi = (id) => HATA_NEDENLERI.find((n) => n.id === id)?.ad || id;

export const EKSEN_ADI = { bilgi: 'Bilgi', dikkat: 'Dikkat', sure: 'Süre', diger: 'Diğer' };

export default HATA_NEDENLERI;
