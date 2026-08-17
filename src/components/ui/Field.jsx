import React, { useId } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * Form alanı — etiket, girdi, yardım metni ve hata tek yerde.
 *
 * Denetimde 256 `<label>` etiketten yalnızca 4'ü `htmlFor` ile girdiye
 * bağlıydı. Bağlantı olmayınca ekran okuyucu alanın ne olduğunu
 * söyleyemiyor, etikete dokunmak alanı odaklamıyor.
 *
 * Burada `id` otomatik üretilir ve `htmlFor` / `aria-describedby` /
 * `aria-invalid` kendiliğinden bağlanır — çağıran tarafın unutma
 * ihtimali kalmaz.
 *
 *   <Field etiket="Okul Numarası" ipucu="Karnende yazan numara">
 *     <Input inputMode="numeric" />
 *   </Field>
 */

/** Girdi/textarea/select için ortak görsel kabuk. */
export const girdiSinifi = (durum = 'default') => cn(
    'w-full rounded-dmd border bg-surface text-ink',
    'px-3 py-2.5 min-h-[44px] leading-normal',
    'placeholder:text-ink-3',
    'transition-[border-color,box-shadow] duration-hizli',
    'focus:outline-none focus-visible:outline-none',
    /* iOS, 16 pikselin altındaki bir alana dokunulduğunda sayfayı
       yakınlaştırır ve geri uzaklaştırmaz. Telefonda 16px zorunlu;
       masaüstünde 14px'e iner. `tip-small` sınıfı BİLEREK kullanılmadı:
       dizge.css Tailwind'den sonra yüklendiği için punto ayarını ezer
       ve mobil yakınlaştırma sorunu geri gelir. */
    'text-[16px] sm:text-[0.875rem]',
    durum === 'error' && 'border-danger focus:ring-2 focus:ring-danger/40 focus:border-danger',
    durum === 'success' && 'border-ok focus:ring-2 focus:ring-ok/40 focus:border-ok',
    durum === 'default' && 'border-line focus:ring-2 focus:ring-brand/40 focus:border-brand',
    'disabled:bg-disabled disabled:text-disabled-ink disabled:cursor-not-allowed disabled:border-line'
);

export const Input = React.forwardRef(function Input(
    { durum = 'default', className, ...kalan }, ref
) {
    return <input ref={ref} className={cn(girdiSinifi(durum), className)} {...kalan} />;
});

export const Textarea = React.forwardRef(function Textarea(
    { durum = 'default', className, ...kalan }, ref
) {
    return <textarea ref={ref} className={cn(girdiSinifi(durum), 'min-h-[96px] py-2', className)} {...kalan} />;
});

export const Select = React.forwardRef(function Select(
    { durum = 'default', className, children, ...kalan }, ref
) {
    return (
        <select ref={ref} className={cn(girdiSinifi(durum), 'pr-8', className)} {...kalan}>
            {children}
        </select>
    );
});

export default function Field({
    etiket,
    ipucu,
    hata,
    basari,
    zorunlu = false,
    id: disId,
    className,
    children,
}) {
    const uretilen = useId();
    const id = disId || `alan-${uretilen}`;
    const yardimId = `${id}-yardim`;

    const durum = hata ? 'error' : basari ? 'success' : 'default';
    const altMetin = hata || basari || ipucu;

    // Tek çocuk girdiye id ve aria bağlantılarını geçir
    const govde = React.isValidElement(children)
        ? React.cloneElement(children, {
            id,
            durum: children.props.durum || durum,
            'aria-invalid': hata ? true : undefined,
            'aria-describedby': altMetin ? yardimId : undefined,
            'aria-required': zorunlu || undefined,
        })
        : children;

    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            {etiket && (
                <label htmlFor={id} className="tip-label text-ink-2">
                    {etiket}
                    {zorunlu && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
                </label>
            )}

            {govde}

            {altMetin && (
                <p
                    id={yardimId}
                    className={cn(
                        'tip-caption flex items-start gap-1.5',
                        hata && 'text-danger',
                        basari && 'text-ok'
                    )}
                >
                    {hata && <AlertCircle size={13} className="shrink-0 mt-0.5" aria-hidden="true" />}
                    {basari && !hata && <CheckCircle2 size={13} className="shrink-0 mt-0.5" aria-hidden="true" />}
                    <span>{altMetin}</span>
                </p>
            )}
        </div>
    );
}
