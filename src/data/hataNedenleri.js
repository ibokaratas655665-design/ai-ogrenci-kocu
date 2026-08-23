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

import { HATA_TURLERI } from './hataTurleri';

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

/**
 * Neden kimliğinin okunur adı.
 *
 * ⚠️ İKİ SÖZLÜK, TEK KAPI
 * Uygulamada hata iki ayrı yerde etiketleniyor:
 *   · Deneme analizi  → bu dosyadaki kimlikler ('bilgi', 'dikkat'…)
 *   · Hata defteri     → data/hataTurleri ('knowledge', 'careless'…)
 *
 * `gelisimAnalitik.hataOzeti` hata DEFTERİ kayıtlarını gruplarken bu
 * fonksiyonu çağırıyordu; kimlikler bu katalogda bulunmadığı için
 * koç panelinde "Hata türüne göre" listesi ham İngilizce kimlik
 * gösteriyordu: "careless 14, knowledge 7". Ölçüldü.
 *
 * Çözüm üç adımlı: önce bu katalog, sonra `eskiKarsilik` köprüsü,
 * sonra hata defteri sözlüğü. Hiçbirinde yoksa kimlik aynen döner —
 * elle yazılmış bir değer uydurma bir adla değiştirilmez.
 */
export const nedenAdi = (id) => {
    if (!id) return 'Belirtilmemiş';
    const dogrudan = HATA_NEDENLERI.find((n) => n.id === id);
    if (dogrudan) return dogrudan.ad;
    const kopru = HATA_NEDENLERI.find((n) => n.eskiKarsilik === id);
    if (kopru) return kopru.ad;
    const defter = HATA_TURLERI.find((t) => t.id === id);
    return defter ? defter.label : id;
};

export const EKSEN_ADI = { bilgi: 'Bilgi', dikkat: 'Dikkat', sure: 'Süre', diger: 'Diğer' };

export default HATA_NEDENLERI;
