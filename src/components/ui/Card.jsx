import React from 'react';
import { cn } from '../../lib/cn';

/**
 * Kart — sayfadaki her kutunun tek biçimi.
 *
 * Kod tabanında `premium-card`, `card`, `card-flat`, `chart-card`,
 * `surface-3d` ve onlarca tek seferlik `bg-surface rounded-2xl border…`
 * kalıbı yan yana yaşıyordu; yarıçap 8 farklı değerdeydi.
 *
 * Ayrım renkten değil KENAR ÇİZGİSİ ve GÖLGEden gelir — açık temada
 * kart beyaz, zemin neredeyse beyaz olduğu için (bkz. theme.css).
 */

const TONLAR = {
    /** Varsayılan: sayfada duran kart */
    duz: 'bg-surface border border-line shadow-kart',
    /** Çerçevesiz, gölgesiz — kart içinde iç bölüm */
    sade: 'bg-surface-2 border border-line',
    /** Yükseltilmiş: sayfadan kopuk katman (açılır panel) */
    yuksek: 'bg-surface-e border border-line shadow-acilir',
    /** Vurgulu: dikkat çeken kart (marka kenarlı) */
    vurgu: 'bg-brand-soft border border-brand-line',
};

const DOLGULAR = {
    yok: 'p-0',
    sm: 'p-4',
    md: 'p-kart',
    lg: 'p-6',
};

export default function Card({
    ton = 'duz',
    dolgu = 'md',
    tiklanabilir = false,
    className,
    children,
    ...kalan
}) {
    return (
        <div
            className={cn(
                'rounded-dlg',
                TONLAR[ton] || TONLAR.duz,
                DOLGULAR[dolgu] || DOLGULAR.md,
                /* Yükselme `kart-etkilesim` sınıfından gelir: yalnızca FARE
                   varken uygulanır. Dokunmatikte hover "takılı" kalıp kartı
                   sürekli havada bırakıyordu (bkz. styles/etkilesim.css). */
                tiklanabilir && [
                    'kart-etkilesim basilabilir cursor-pointer hover:border-line-2',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-page',
                ],
                className
            )}
            {...kalan}
        >
            {children}
        </div>
    );
}

/** Kart başlığı — başlık, açıklama ve sağ üstteki eylemler. */
export function CardBaslik({ baslik, aciklama, eylem, className }) {
    return (
        <div className={cn('flex items-start justify-between gap-3 mb-4', className)}>
            <div className="min-w-0">
                {baslik && <h3 className="tip-h4">{baslik}</h3>}
                {aciklama && <p className="tip-caption mt-0.5">{aciklama}</p>}
            </div>
            {eylem && <div className="shrink-0 flex items-center gap-2">{eylem}</div>}
        </div>
    );
}
