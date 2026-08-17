import React from 'react';
import { cn } from '../../lib/cn';

/**
 * Avatar.
 *
 * Öğrenci ve koç baş harfleri her ekranda farklı boyut ve renkte
 * çiziliyordu. Burada renk isimden TÜRETİLİR: aynı kişi uygulamanın
 * her yerinde aynı rengi alır, böylece listede tanınır hâle gelir.
 *
 * Renkler grafik serisi belirteçlerinden gelir (--c1..--c5) — hepsi
 * açık ve koyu temada kontrast doğrulanmış tonlardır.
 */

const BOYUTLAR = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-10 h-10 text-[13px]',
    lg: 'w-14 h-14 text-[18px]',
    xl: 'w-20 h-20 text-[26px]',
};

const SERILER = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)'];

/** İsimden kararlı (her seferinde aynı) renk seçer. */
const renkSec = (ad = '') => {
    let toplam = 0;
    for (let i = 0; i < ad.length; i++) toplam = (toplam + ad.charCodeAt(i)) % 997;
    return SERILER[toplam % SERILER.length];
};

const basHarfler = (ad = '') => String(ad).trim().split(/\s+/).filter(Boolean)
    .slice(0, 2).map((k) => k[0]).join('').toLocaleUpperCase('tr-TR') || '?';

export default function Avatar({
    ad = '',
    gorsel,
    boyut = 'md',
    durum,          // 'cevrimici' | 'mesgul' | 'cevrimdisi'
    className,
}) {
    const DURUM_RENK = {
        cevrimici: 'bg-ok',
        mesgul: 'bg-warn',
        cevrimdisi: 'bg-ink-3',
    };

    return (
        <span className={cn('relative inline-flex shrink-0', className)}>
            {gorsel ? (
                <img loading="lazy" decoding="async"
                    src={gorsel}
                    alt={ad ? `${ad} profil görseli` : ''}
                    className={cn('rounded-pill object-cover border border-line', BOYUTLAR[boyut] || BOYUTLAR.md)}
                />
            ) : (
                <span
                    aria-hidden="true"
                    className={cn(
                        'rounded-pill inline-flex items-center justify-center font-bold text-ink-on select-none',
                        BOYUTLAR[boyut] || BOYUTLAR.md
                    )}
                    style={{ backgroundColor: renkSec(ad) }}
                >
                    {basHarfler(ad)}
                </span>
            )}

            {durum && (
                <span
                    aria-label={durum}
                    className={cn(
                        'absolute -bottom-0 -right-0 rounded-pill border-2 border-surface',
                        boyut === 'xs' || boyut === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3',
                        DURUM_RENK[durum] || DURUM_RENK.cevrimdisi
                    )}
                />
            )}
        </span>
    );
}

/** Üst üste binen avatar grubu — grup ve sınıf listelerinde. */
export function AvatarGrubu({ kisiler = [], enFazla = 4, boyut = 'sm' }) {
    const gosterilen = kisiler.slice(0, enFazla);
    const kalan = kisiler.length - gosterilen.length;
    return (
        <div className="flex items-center -space-x-2">
            {gosterilen.map((k, i) => (
                <Avatar key={k.id || k.name || i} ad={k.name || k.ad} gorsel={k.gorsel} boyut={boyut}
                    className="ring-2 ring-surface rounded-pill" />
            ))}
            {kalan > 0 && (
                <span className={cn(
                    'rounded-pill inline-flex items-center justify-center bg-surface-3 text-ink-2 font-bold ring-2 ring-surface',
                    BOYUTLAR[boyut] || BOYUTLAR.sm
                )}>
                    +{kalan}
                </span>
            )}
        </div>
    );
}
