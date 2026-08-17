import React from 'react';
import { cn } from '../../lib/cn';

/**
 * Rozet — durum, sayaç ve etiket.
 *
 * ⚠️ Renk ANLAM taşır ve uygulamanın her yerinde aynıdır:
 *   basari  → tamamlandı, onaylı, aktif
 *   uyari   → dikkat, beklemede, gecikme riski
 *   hata    → başarısız, reddedildi, riskli
 *   bilgi   → nötr bilgi, sayaç
 *   marka   → seçili/öne çıkarılmış
 *   notr    → sınıflandırma etiketi (anlam yüklemez)
 *
 * Aynı durumu bir ekranda yeşil, başka ekranda mavi göstermek
 * kullanıcının renkten anlam çıkarmasını imkânsız kılar.
 */

const TONLAR = {
    basari: 'bg-ok-soft text-ok',
    uyari: 'bg-warn-soft text-warn',
    hata: 'bg-danger-soft text-danger',
    bilgi: 'bg-info-soft text-info',
    marka: 'bg-brand-soft text-brand',
    notr: 'bg-surface-3 text-ink-2',
};

const BOYUTLAR = {
    sm: 'px-1.5 py-0.5 tip-mini',
    md: 'px-2.5 py-1 tip-mini',
};

export default function Badge({
    ton = 'notr',
    boyut = 'md',
    nokta = false,
    hap = false,
    simge: Simge = null,
    className,
    children,
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 font-bold whitespace-nowrap',
                hap ? 'rounded-pill' : 'rounded-dsm',
                TONLAR[ton] || TONLAR.notr,
                BOYUTLAR[boyut] || BOYUTLAR.md,
                className
            )}
        >
            {nokta && <span className="w-1.5 h-1.5 rounded-pill bg-current shrink-0" aria-hidden="true" />}
            {Simge && <Simge size={11} aria-hidden="true" />}
            {children}
        </span>
    );
}

/**
 * Sayaç rozeti — sekme ve bildirim zili üstündeki rakam.
 * Sıfırsa hiç çizilmez; "0" göstermek gürültüdür.
 */
export function Sayac({ deger, ton = 'hata', enFazla = 99, className }) {
    const sayi = Number(deger) || 0;
    if (sayi <= 0) return null;
    return (
        <span
            className={cn(
                'rakam inline-flex items-center justify-center rounded-pill',
                'min-w-[18px] h-[18px] px-1 tip-mini font-bold tracking-normal',
                TONLAR[ton] || TONLAR.hata,
                className
            )}
        >
            {sayi > enFazla ? `${enFazla}+` : sayi}
        </span>
    );
}
