/**
 * 📄 REHBERLİK MATERYAL ŞABLONLARI
 *
 * Materyal üreticinin gerçek içerik kaynağı. Eskiden bu ekran sahteydi:
 * "üret" düğmesi 3 saniye bekleyip listeye bir satır ekliyor, indirme
 * düğmesi hiçbir şey yapmıyordu. Artık her materyal türü, danışmanın
 * doldurduğu alanlara göre GERÇEK bir belge gövdesi üretir ve resmî
 * yazı düzeninde PDF olarak iner.
 *
 * Şablonlar rehberlik servisinin fiilen ürettiği materyallere göre
 * hazırlanmıştır; her biri bir desimal dosyaya bağlanır (`dosya`).
 */

export const MATERYAL_TURLERI = [
    {
        id: 'veli-brosur',
        ad: 'Veli Bilgilendirme Broşürü',
        icon: '👨‍👩‍👧',
        dosya: '6',
        aciklama: 'Velilere dağıtılan bilgilendirme metni — görüşme dosyasına eklenir.',
        alanlar: [
            { k: 'konu', ad: 'Konu', zorunlu: true, ipucu: 'Örn. Ergenlik döneminde iletişim' },
            { k: 'hedef', ad: 'Hedef Kitle', ipucu: 'Örn. 7. sınıf velileri' },
            { k: 'mesajlar', ad: 'Ana Mesajlar', cokSatir: true, ipucu: 'Her satıra bir madde yazın' },
            { k: 'oneriler', ad: 'Veliye Öneriler', cokSatir: true },
            { k: 'iletisim', ad: 'İletişim / Randevu Bilgisi', cokSatir: true },
        ],
    },
    {
        id: 'sinif-pano',
        ad: 'Sınıf Panosu Metni',
        icon: '📌',
        dosya: '7',
        aciklama: 'Sınıf panosuna asılacak rehberlik metni — sınıf dosyasına eklenir.',
        alanlar: [
            { k: 'konu', ad: 'Pano Konusu', zorunlu: true, ipucu: 'Örn. Sınav kaygısıyla baş etme' },
            { k: 'hedef', ad: 'Sınıf / Şube', ipucu: 'Örn. 9/A' },
            { k: 'mesajlar', ad: 'Panoda Yer Alacak Maddeler', cokSatir: true },
            { k: 'oneriler', ad: 'Öğrenciye Öneriler', cokSatir: true },
        ],
    },
    {
        id: 'etkinlik',
        ad: 'Grup Rehberliği Etkinlik Planı',
        icon: '🎯',
        dosya: '7',
        aciklama: 'Sınıf içi etkinliğin kazanım, süreç ve değerlendirme planı.',
        alanlar: [
            { k: 'konu', ad: 'Etkinlik Adı', zorunlu: true },
            { k: 'hedef', ad: 'Sınıf Düzeyi', ipucu: 'Örn. 5. sınıflar' },
            { k: 'kazanim', ad: 'Kazanımlar', cokSatir: true, zorunlu: true },
            { k: 'sure', ad: 'Süre', ipucu: 'Örn. 1 ders saati' },
            { k: 'materyal', ad: 'Kullanılacak Materyaller', cokSatir: true },
            { k: 'surec', ad: 'Etkinlik Süreci', cokSatir: true, zorunlu: true },
            { k: 'degerlendirme', ad: 'Değerlendirme', cokSatir: true },
        ],
    },
    {
        id: 'calisma-kagidi',
        ad: 'Öğrenci Çalışma Kâğıdı',
        icon: '📝',
        dosya: '7',
        aciklama: 'Öğrencinin dolduracağı form — boş satırlarla birlikte basılır.',
        alanlar: [
            { k: 'konu', ad: 'Çalışma Konusu', zorunlu: true },
            { k: 'hedef', ad: 'Sınıf Düzeyi' },
            { k: 'yonerge', ad: 'Yönerge', cokSatir: true, zorunlu: true },
            { k: 'sorular', ad: 'Sorular / Maddeler', cokSatir: true, zorunlu: true, ipucu: 'Her satıra bir soru' },
        ],
    },
    {
        id: 'sunum',
        ad: 'Sunum Planı',
        icon: '📊',
        dosya: '3',
        aciklama: 'Seminer/sunum akışı — eylem planı dosyasına eklenir.',
        alanlar: [
            { k: 'konu', ad: 'Sunum Başlığı', zorunlu: true },
            { k: 'hedef', ad: 'Katılımcı Grubu' },
            { k: 'kazanim', ad: 'Amaç', cokSatir: true },
            { k: 'slaytlar', ad: 'Slayt Başlıkları', cokSatir: true, zorunlu: true, ipucu: 'Her satıra bir slayt' },
            { k: 'sure', ad: 'Toplam Süre' },
        ],
    },
    {
        id: 'seminer',
        ad: 'Öğretmen Semineri Notu',
        icon: '🧑‍🏫',
        dosya: '3',
        aciklama: 'Öğretmenler kuruluna sunulacak bilgilendirme metni.',
        alanlar: [
            { k: 'konu', ad: 'Seminer Konusu', zorunlu: true },
            { k: 'hedef', ad: 'Katılımcılar', ipucu: 'Örn. Sınıf rehber öğretmenleri' },
            { k: 'mesajlar', ad: 'Ana Başlıklar', cokSatir: true, zorunlu: true },
            { k: 'oneriler', ad: 'Öğretmenlere Öneriler', cokSatir: true },
        ],
    },
];

export const turBul = (id) => MATERYAL_TURLERI.find((t) => t.id === id) || MATERYAL_TURLERI[0];

/** Çok satırlı alanı madde listesine çevirir. */
export const satirlar = (metin) =>
    String(metin || '')
        .split('\n')
        .map((s) => s.replace(/^[-•*\d.)\s]+/, '').trim())
        .filter(Boolean);

export default { MATERYAL_TURLERI, turBul, satirlar };
