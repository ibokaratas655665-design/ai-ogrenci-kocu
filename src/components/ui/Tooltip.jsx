import React, { useState, useId } from 'react';
import { cn } from '../../lib/cn';

/**
 * İpucu balonu.
 *
 * Yalnızca `title` özniteliği kullanılıyordu: gecikmeli çıkar,
 * biçimlendirilemez ve dokunmatikte hiç görünmez.
 *
 * Burada odak (klavye) ve dokunma da balonu açar; `aria-describedby`
 * ile bağlanır, böylece ekran okuyucu da metni duyurur.
 *
 * ⚠️ İpucu ek bilgi içindir. Bir düğmenin ne yaptığı SADECE ipucunda
 * yazıyorsa tasarım hatalıdır — dokunmatikte kaybolur.
 */

const YONLER = {
    ust: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    alt: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    sol: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    sag: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
};

export default function Tooltip({ metin, yon = 'ust', className, children }) {
    const [acik, setAcik] = useState(false);
    const id = `ipucu-${useId()}`;

    if (!metin) return children;

    return (
        <span
            className={cn('relative inline-flex', className)}
            onMouseEnter={() => setAcik(true)}
            onMouseLeave={() => setAcik(false)}
            onFocus={() => setAcik(true)}
            onBlur={() => setAcik(false)}
            onTouchStart={() => setAcik((a) => !a)}
        >
            {React.isValidElement(children)
                ? React.cloneElement(children, { 'aria-describedby': acik ? id : undefined })
                : children}

            {acik && (
                <span
                    id={id}
                    role="tooltip"
                    className={cn(
                        'absolute z-notify pointer-events-none whitespace-nowrap max-w-[240px]',
                        'bg-surface-inv text-page px-2.5 py-1.5 rounded-dsm shadow-acilir',
                        'tip-caption font-medium animate-fade-in',
                        YONLER[yon] || YONLER.ust
                    )}
                >
                    {metin}
                </span>
            )}
        </span>
    );
}
