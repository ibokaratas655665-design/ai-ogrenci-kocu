import React, { useRef } from 'react';
import { cn } from '../../lib/cn';
import { Sayac } from './Badge';

/**
 * Sekme şeridi.
 *
 * Erişilebilirlik denetiminde `role="tab"` yalnızca 1 yerde bulunmuştu;
 * sekmeler klavyeyle gezilemiyordu. Burada ok tuşlarıyla gezinme,
 * `role="tablist"/"tab"` ve `aria-selected` standart olarak gelir.
 *
 * Telefonda şerit yatay kayar (öğrenci panelinde 15 sekme ölçüldü,
 * 375px ekranda 2107px genişlik) — seçili sekme görünür alana getirilir.
 */

const VARYANTLAR = {
    /** Alt çizgili — sayfa içi ana bölümler */
    cizgi: {
        seritler: 'border-b border-line gap-1',
        sekme: 'px-3 py-2.5 border-b-2 border-transparent -mb-px',
        aktif: 'border-brand text-brand',
        pasif: 'text-ink-3 hover:text-ink-2 hover:border-line-2',
    },
    /** Hap — süzgeç ve alt kırılımlar */
    hap: {
        seritler: 'gap-1 p-1 bg-surface-2 rounded-dmd',
        sekme: 'px-3 py-2 rounded-dsm flex-1 justify-center',
        aktif: 'bg-surface text-brand shadow-kart',
        pasif: 'text-ink-3 hover:text-ink-2',
    },
};

export default function Tabs({
    sekmeler = [],
    aktif,
    onDegis,
    varyant = 'cizgi',
    className,
    etiket = 'Bölümler',
}) {
    const v = VARYANTLAR[varyant] || VARYANTLAR.cizgi;
    const ref = useRef(null);

    const tusa = (e) => {
        const yon = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!yon) return;
        e.preventDefault();
        const i = sekmeler.findIndex((s) => s.id === aktif);
        const sonraki = sekmeler[(i + yon + sekmeler.length) % sekmeler.length];
        onDegis?.(sonraki.id);
        ref.current?.querySelector(`[data-sekme="${sonraki.id}"]`)?.focus();
    };

    return (
        <div
            ref={ref}
            role="tablist"
            aria-label={etiket}
            onKeyDown={tusa}
            className={cn('flex items-center overflow-x-auto', v.seritler, className)}
        >
            {sekmeler.map((s) => {
                const secili = s.id === aktif;
                const Simge = s.simge;
                return (
                    <button
                        key={s.id}
                        type="button"
                        role="tab"
                        data-sekme={s.id}
                        aria-selected={secili}
                        tabIndex={secili ? 0 : -1}
                        onClick={() => onDegis?.(s.id)}
                        ref={(el) => {
                            // Seçili sekme kaydırılan şeritte görünür kalsın
                            if (secili && el) el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
                        }}
                        className={cn(
                            'tip-tab shrink-0 inline-flex items-center gap-1.5 min-h-[44px] whitespace-nowrap',
                            'transition-colors duration-hizli',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset',
                            v.sekme,
                            secili ? v.aktif : v.pasif
                        )}
                    >
                        {Simge && <Simge size={15} aria-hidden="true" />}
                        {s.etiket}
                        {s.sayac ? <Sayac deger={s.sayac} ton={s.sayacTon || 'hata'} /> : null}
                    </button>
                );
            })}
        </div>
    );
}
