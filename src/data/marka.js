/**
 * 🏷️ MARKA
 *
 * Uygulamanın adı, amblemi ve marka renkleri TEK KAYNAKTAN okunur.
 *
 * Önceden ad ("AI Öğrenci Koçu", "YZ Öğrenci Koçu", "AI Koç") ve kurucunun
 * kişi adı yirmiye yakın dosyaya elle yazılmıştı; biri değişince diğerleri
 * geride kalıyordu. Marka bilgisi buradan okunursa bir daha dağılmaz.
 *
 * Renkler amblemden alındı: lacivert yazı, turuncu vurgu, mavi yay.
 */

export const MARKA = {
    /** Kısa ad — sekme başlığı, ikon altı, dar alanlar. */
    ad: 'Başarı Kampı',

    /** Uzun ad — karşılama sayfası, uygulama mağazası, manifest. */
    tamAd: 'Başarı Kampı — Koçluk ve Rehberlik Sistemi',

    /** Adın hemen altında görünen tanım satırı. */
    altBaslik: 'Koçluk Platformu',

    /** Tek cümlelik tanım. */
    tanim: 'Özel öğrenci koçluğu ve okul rehberlik servisi için program, '
        + 'deneme analizi, görev takibi ve MEB düzenine uygun dosya yönetimi.',

    /** Amblem + yazı. Karşılama ve giriş ekranında kullanılır. */
    /* 640 piksel: giriş ekranında en fazla 288 piksel genişlikte
       gösteriliyor, 2x ekran için fazlasıyla yeter. Önceki 1254 piksellik
       dosya beş kat fazla veri indiriyordu. */
    logo: '/logo-640.jpg',

    /** Yalnızca amblem (yazısız) — dar alanlar ve PDF başlıkları. */
    amblem: '/amblem-256.png',

    /**
     * Adın YAZI hâli, logodaki el yazısı stiliyle (saydam zeminli).
     *
     * Ad, sistemde bulunmayan bir fırça yazı tipiyle çizilmiş; düz metinle
     * taklit edilemez. Başlıklarda metin yerine bu görsel kullanılır ki
     * arayüzdeki ad logoyla aynı görünsün.
     */
    adYazisi: '/ad-yazisi-256.png',

    renk: {
        lacivert: '#16294A',   // "Başarı" yazısı, siluetler
        turuncu: '#F47B20',    // "Kampı" yazısı, onay işareti
        mavi: '#2B7CC4',       // amblemin sağ yayı
    },
};

/**
 * Adın iki parçası. Amblemde "Başarı" lacivert, "Kampı" turuncu yazılı;
 * arayüzde de aynı ayrımı koruyoruz ki logo ile metin birbirini tutsun.
 */
export const MARKA_PARCALI = { birinci: 'Başarı', ikinci: 'Kampı' };

export default MARKA;
