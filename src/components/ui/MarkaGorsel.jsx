import React from 'react';
import { cn } from '../../lib/cn';

/**
 * 🖼️ MARKA GÖRSELİ
 *
 * Amblem ve ad yazısı arayüzde 12 yerde ayrı ayrı `<img>` ile
 * yazılmıştı. Hiçbirinde `loading`, `decoding` yoktu ve çoğunda
 * `width`/`height` eksikti:
 *
 *   · Boyut verilmeyince tarayıcı görselin yerini önceden ayıramıyor,
 *     görsel inince sayfa ZIPLIYOR (layout shift).
 *   · `loading="lazy"` olmadığı için ekranın altındaki logo bile ilk
 *     yüklemede indiriliyordu.
 *
 * Burada ayrıca `<picture>` ile WebP eşi sunulur: destekleyen tarayıcı
 * onu indirir (amblem 19 KB PNG yerine 9 KB WebP), desteklemeyen PNG'de
 * kalır. Dosyalar `scripts/gorsel-optimize.mjs` ile üretilir.
 */
export default function MarkaGorsel({
    src,
    alt = '',
    width,
    height,
    /**
     * Marka görselleri neredeyse her zaman ÜST ŞERİTTE, yani ilk ekranda.
     * Bu yüzden varsayılan `eager`: `lazy` yapıldığında logo geç iniyor ve
     * başlık bir an boş kalıyordu. Sayfa altında kullanılacaksa
     * `tembel` verilerek geciktirilir.
     */
    tembel = false,
    className,
    ...kalan
}) {
    const webp = typeof src === 'string' ? src.replace(/\.(png|jpe?g)$/i, '.webp') : null;

    /**
     * Ad yazısı arayüzde en fazla 168 piksel genişlikte gösteriliyor;
     * servis edilen 605 piksellik dosya 2x ekranda bile fazlaydı.
     * 176/352 varyantları üretildi (12 KB / 32 KB) ve tarayıcı ekran
     * yoğunluğuna göre kendisi seçiyor.
     *
     * (Vektöre çevrilmedi: isim, sistemde bulunmayan bir fırça yazı
     * tipiyle çizilmiş. Vektör kaynağı olmadan izleme yapmak yumuşak
     * kenarları bozar — doğru boyutlu raster daha temiz sonuç veriyor.)
     */
    const adYazisiMi = typeof src === 'string' && /ad-yazisi/.test(src);
    const srcSetWebp = adYazisiMi
        ? '/ad-yazisi-176.webp 1x, /ad-yazisi-352.webp 2x'
        : undefined;
    const srcSetPng = adYazisiMi
        ? '/ad-yazisi-176.png 1x, /ad-yazisi-352.png 2x'
        : undefined;

    return (
        <picture>
            {webp && webp !== src && (
                <source srcSet={srcSetWebp || webp} type="image/webp" />
            )}
            {srcSetPng && <source srcSet={srcSetPng} type="image/png" />}
            <img
                src={src}
                alt={alt}
                width={width}
                height={height}
                /* Üst şerittekiler hemen; sayfa altındakiler görünürken */
                loading={tembel ? 'lazy' : 'eager'}
                /* Çözümleme ana iş parçacığını bloke etmesin */
                decoding="async"
                className={cn('object-contain', className)}
                {...kalan}
            />
        </picture>
    );
}
