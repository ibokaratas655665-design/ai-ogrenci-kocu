import React from 'react';
import { cn } from '../../lib/cn';

/**
 * ✅ ONAY KUTUSU — görev/etüt tamamlama geri bildirimi
 *
 * Öğrencinin uygulamada en sık yaptığı iş bir şeyi "tamamlandı"
 * işaretlemek. Buranın hissi ürünün genel hissini belirliyor.
 *
 * Üç katman, toplam 320 ms:
 *   1. Onay işareti ÇİZİLİR — anında belirmek yerine yol boyunca
 *      ilerler; "işlendi" duygusunu veren asıl şey bu.
 *   2. Kutu bir kez nefes alır (%114) — dokunuşun karşılık bulduğunu
 *      söyler.
 *   3. Halka dışa doğru sönerek kaybolur — kutlama değil onay.
 *
 * Neden konfeti yok: öğrenci günde 4–6 etüt işaretliyor. Her birinde
 * konfeti patlatmak ikinci günde rahatsız edici olur; ama hiçbir şey
 * olmaması da "kaydoldu mu?" sorusu bırakır. Aradaki denge bu.
 *
 * Hareket azaltma tercihinde animasyonlar susar, işaret yine görünür
 * (bkz. styles/etkilesim.css).
 */
export default function OnayKutusu({
    isaretli = false,
    /** Yeni işaretlendi mi? Yalnızca o an animasyon oynar. */
    yeni = false,
    boyut = 24,
    className,
}) {
    return (
        <span
            className={cn('relative inline-flex shrink-0', className)}
            style={{ width: boyut, height: boyut }}
        >
            {/* Dışa açılan halka — yalnızca yeni işaretlemede */}
            {yeni && isaretli && (
                <span
                    aria-hidden="true"
                    className="onay-halka absolute inset-0 rounded-dsm bg-ok"
                />
            )}

            <span
                aria-hidden="true"
                className={cn(
                    'relative inline-flex items-center justify-center w-full h-full rounded-dsm border-2',
                    'transition-[background-color,border-color] duration-hizli',
                    isaretli ? 'bg-ok border-ok' : 'border-line-2 bg-transparent',
                    yeni && isaretli && 'onay-nefes'
                )}
            >
                {isaretli && (
                    <svg
                        viewBox="0 0 24 24"
                        width={boyut * 0.62}
                        height={boyut * 0.62}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-white"
                    >
                        {/* pathLength ile yol uzunluğu 26'ya sabitlenir;
                            etkilesim.css'teki stroke-dasharray ile eşleşir */}
                        <path
                            d="M4.5 12.5 L9.5 17.5 L19.5 6.5"
                            className={yeni ? 'onay-ciz' : undefined}
                        />
                    </svg>
                )}
            </span>
        </span>
    );
}
