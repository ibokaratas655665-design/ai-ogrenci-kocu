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

// ══════════════════════════════════════════════════════════════
//  ONAY KUTUSU VE SEÇENEK DÜĞMESİ
//
//  Denetimde 16 yerde `type="checkbox"`, 4 yerde `type="radio"` elle
//  kurulmuştu. Elle kurulanlarda tekrar eden üç sorun vardı:
//    · etiket girdiye bağlanmıyor (tıklanınca kutu değişmiyor,
//      ekran okuyucu ne olduğunu söyleyemiyor),
//    · dokunma hedefi 44 pikselin altında kalıyor,
//    · odak halkası görünmüyor.
//  Burada üçü de bir kez çözülüyor.
// ══════════════════════════════════════════════════════════════

/** Kutu ve düğme için ortak kabuk — 44px dokunma hedefi garanti. */
const secimKabugu = (devreDisi) => cn(
    'flex items-start gap-3 min-h-[44px] py-2 rounded-dmd',
    'cursor-pointer select-none',
    devreDisi && 'opacity-50 cursor-not-allowed'
);

const secimKutusu = (tur) => cn(
    'mt-0.5 shrink-0 w-5 h-5 border-2 border-line bg-surface',
    'text-brand accent-[var(--brand)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1',
    'disabled:cursor-not-allowed',
    tur === 'radio' ? 'rounded-full' : 'rounded-[6px]'
);

/**
 * Tek onay kutusu.
 *
 *   <Checkbox etiket="Cihazı hatırla" ipucu="Güvenliğiniz için önerilir"
 *             checked={x} onChange={e => setX(e.target.checked)} />
 */
export const Checkbox = React.forwardRef(function Checkbox(
    { etiket, ipucu, className, disabled, ...kalan }, ref
) {
    const id = useId();
    const ipucuId = ipucu ? `${id}-ipucu` : undefined;

    return (
        <div className={className}>
            <label htmlFor={id} className={secimKabugu(disabled)}>
                <input
                    ref={ref}
                    id={id}
                    type="checkbox"
                    disabled={disabled}
                    aria-describedby={ipucuId}
                    className={secimKutusu('checkbox')}
                    {...kalan}
                />
                <span className="min-w-0">
                    <span className="tip-small text-ink block">{etiket}</span>
                    {ipucu && <span id={ipucuId} className="tip-caption text-ink-3 block">{ipucu}</span>}
                </span>
            </label>
        </div>
    );
});

/**
 * Seçenek düğmesi grubu — `role="radiogroup"` ile.
 *
 *   <RadioGrubu etiket="Rol" ad="rol" deger={rol} onChange={setRol}
 *               secenekler={[{ deger: 'coach', etiket: 'Koç' }]} />
 */
export function RadioGrubu({ etiket, ad, deger, onChange, secenekler = [], className, disabled }) {
    const id = useId();
    return (
        <div className={cn('flex flex-col gap-1.5', className)} role="radiogroup" aria-labelledby={etiket ? `${id}-b` : undefined}>
            {etiket && <span id={`${id}-b`} className="tip-label text-ink-2">{etiket}</span>}
            {secenekler.map((s) => {
                const sid = `${id}-${s.deger}`;
                return (
                    <label key={s.deger} htmlFor={sid} className={secimKabugu(disabled || s.disabled)}>
                        <input
                            id={sid}
                            type="radio"
                            name={ad}
                            value={s.deger}
                            checked={String(deger) === String(s.deger)}
                            disabled={disabled || s.disabled}
                            onChange={(e) => onChange?.(e.target.value, e)}
                            className={secimKutusu('radio')}
                        />
                        <span className="min-w-0">
                            <span className="tip-small text-ink block">{s.etiket}</span>
                            {s.ipucu && <span className="tip-caption text-ink-3 block">{s.ipucu}</span>}
                        </span>
                    </label>
                );
            })}
        </div>
    );
}
