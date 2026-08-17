import React from 'react';
import { cn } from '../../lib/cn';

/**
 * Simge sarmalayıcısı.
 *
 * Uygulamada iki simge dili yan yana yaşıyor: `lucide-react` (kurulu ve
 * yaygın) ve düğme etiketlerine gömülü emoji (`🚀 AKILLI DAĞIT`,
 * `🔓 Etütleri Aç`). Emoji her işletim sisteminde farklı çizilir, tema
 * rengini almaz ve ücretli üründe amatör durur.
 *
 * Kural:
 *   · Arayüz simgesi  → Lucide, bu sarmalayıcı üzerinden
 *   · Emoji           → yalnızca öğrenciye dönük kutlama/rozet içeriği
 *
 * Punto ölçeği sabittir; keyfi `size={13}` yazılmaz. Çizgi kalınlığı
 * tüm uygulamada aynı (1.75) — Lucide varsayılanı 2, küçük puntoda
 * kalın ve kirli duruyor.
 */

export const SIMGE_PUNTO = {
    xs: 12,
    sm: 14,
    md: 16,   // varsayılan — gövde metniyle aynı hizada
    lg: 20,
    xl: 24,
    xxl: 32,
};

export default function Icon({
    ikon: Bilesen,
    boyut = 'md',
    ton = 'kalit',       // 'kalit' = üstündeki metnin rengini alır
    className,
    etiket,              // verilirse simge anlam taşır ve duyurulur
    ...kalan
}) {
    if (!Bilesen) return null;

    const TONLAR = {
        kalit: '',
        marka: 'text-brand',
        soluk: 'text-ink-3',
        basari: 'text-ok',
        uyari: 'text-warn',
        hata: 'text-danger',
        bilgi: 'text-info',
    };

    return (
        <Bilesen
            size={SIMGE_PUNTO[boyut] ?? SIMGE_PUNTO.md}
            strokeWidth={1.75}
            className={cn('shrink-0', TONLAR[ton] ?? '', className)}
            aria-hidden={etiket ? undefined : 'true'}
            aria-label={etiket}
            role={etiket ? 'img' : undefined}
            {...kalan}
        />
    );
}
