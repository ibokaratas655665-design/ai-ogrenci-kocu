import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * Ortak düğme.
 *
 * Denetimde 75 farklı düğme sınıf kalıbı sayıldı. Bedeli görsel
 * tutarsızlıktan ibaret değildi: odak halkası, devre dışı hâli,
 * yükleniyor hâli ve dokunma hedefi boyutu her yerde farklıydı ya da
 * hiç yoktu.
 *
 * Altı varyantın hepsi altı durumu (default/hover/active/focus/disabled/
 * loading) aynı kurallarla karşılar:
 *   · hover  → bir kademe koyu/dolgulu
 *   · active → %98 ölçek (dokunmatikte "bastım mı?" belirsizliğini keser)
 *   · focus  → yalnızca klavyede görünen 2px marka halkası
 *   · disabled → gerçek `bg-disabled` rengi; `opacity-50` taklidi değil,
 *                çünkü saydamlık arkadaki içeriği gösterip okunaksızlaştırır
 *   · loading → dönen simge + `aria-busy`, düğme tıklanamaz
 */

const VARYANTLAR = {
    primary: 'bg-brand text-ink-on hover:bg-brand-hover shadow-kart',
    secondary: 'bg-accent text-ink-on hover:brightness-110 shadow-kart',
    outline: 'bg-transparent text-brand border border-brand-line hover:bg-brand-soft',
    ghost: 'bg-transparent text-ink-2 hover:bg-surface-3 hover:text-ink',
    danger: 'bg-danger text-ink-on hover:brightness-110 shadow-kart',
    success: 'bg-ok text-ink-on hover:brightness-110 shadow-kart',
};

const BOYUTLAR = {
    sm: 'min-h-[36px] px-3 gap-1.5',
    md: 'min-h-[44px] px-4 gap-2',
    lg: 'min-h-[52px] px-6 gap-2.5',
};

/** Yalnızca simge taşıyan düğmede genişlik = yükseklik (kare dokunma hedefi) */
const SIMGE_BOYUTLARI = {
    sm: 'min-h-[36px] w-9 p-0',
    md: 'min-h-[44px] w-11 p-0',
    lg: 'min-h-[52px] w-[52px] p-0',
};

const SIMGE_PUNTO = { sm: 15, md: 17, lg: 19 };

const Button = React.forwardRef(function Button(
    {
        varyant = 'primary',
        boyut = 'md',
        yukleniyor = false,
        simge: Simge = null,
        simgeSagda = false,
        tamGenislik = false,
        /** Yalnızca simge — `etiket` erişilebilirlik için ZORUNLU */
        yalnizSimge = false,
        etiket,
        className,
        children,
        disabled,
        type = 'button',
        ...kalan
    },
    ref
) {
    const pasif = disabled || yukleniyor;
    const punto = SIMGE_PUNTO[boyut] || SIMGE_PUNTO.md;

    return (
        <button
            ref={ref}
            type={type}
            disabled={pasif}
            aria-busy={yukleniyor || undefined}
            aria-label={yalnizSimge ? etiket : undefined}
            title={yalnizSimge ? etiket : undefined}
            className={cn(
                'tip-button inline-flex items-center justify-center rounded-dmd select-none',
                'transition-[background-color,color,border-color,transform] duration-hizli',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-page',
                'active:scale-[.98] motion-reduce:active:scale-100',
                'disabled:bg-disabled disabled:text-disabled-ink disabled:border-transparent',
                'disabled:shadow-none disabled:cursor-not-allowed disabled:active:scale-100',
                VARYANTLAR[varyant] || VARYANTLAR.primary,
                (yalnizSimge ? SIMGE_BOYUTLARI : BOYUTLAR)[boyut] || BOYUTLAR.md,
                tamGenislik && 'w-full',
                className
            )}
            {...kalan}
        >
            {yukleniyor ? (
                <Loader2 size={punto} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
            ) : (
                Simge && !simgeSagda && <Simge size={punto} aria-hidden="true" />
            )}
            {!yalnizSimge && children}
            {!yukleniyor && !yalnizSimge && Simge && simgeSagda && <Simge size={punto} aria-hidden="true" />}
        </button>
    );
});

export default Button;
