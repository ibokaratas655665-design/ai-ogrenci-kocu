import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * Ortak açılır pencere.
 *
 * Denetimde 56 dosyada elle kurulmuş pencere bulundu; ortak bir bileşen
 * yoktu. 43'ünde kaydırma tanımlı değildi, 13'ünde yükseklik sınırı olup
 * kaydırma olmadığı için kaydet düğmesine ULAŞMAK mümkün değildi.
 *
 * Burada bir kez çözülen ve her yerde elle yazıldığında unutulan şeyler:
 *
 *   · yükseklik `dvh` ile ölçülür — `vh` mobilde adres çubuğunu saymaz ve
 *     pencerenin altını (yani kaydet düğmesini) ekran dışında bırakır
 *   · gövde kayar, başlık ve alt düğme çubuğu yapışık kalır
 *   · Escape ile kapanır, odak pencerede hapsolur, kapanınca odak geri döner
 *   · arkadaki sayfa kaydırması kilitlenir
 *   · role="dialog" + aria-modal — ekran okuyucu pencereyi tanır
 *   · çentikli telefonlarda alt güvenli alan payı bırakılır
 */

const GENISLIKLER = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    tam: 'max-w-none w-full h-full',
};

/** Odaklanabilir öğeleri bulur (odak tuzağı için). */
const ODAKLANABILIR =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
    acik = true,
    onClose,
    baslik,
    aciklama,
    genislik = 'md',
    altCubuk = null,
    kapatilamaz = false,
    className,
    govdeClassName,
    children,
}) {
    const panelRef = useRef(null);
    const oncekiOdakRef = useRef(null);

    const kapat = useCallback(() => {
        if (!kapatilamaz && onClose) onClose();
    }, [kapatilamaz, onClose]);

    // Escape + odak tuzağı
    useEffect(() => {
        if (!acik) return;

        oncekiOdakRef.current = document.activeElement;

        const tusa = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                kapat();
                return;
            }
            if (e.key !== 'Tab') return;

            const panel = panelRef.current;
            if (!panel) return;
            const hedefler = [...panel.querySelectorAll(ODAKLANABILIR)]
                .filter((el) => el.offsetParent !== null);
            if (!hedefler.length) return;

            const ilk = hedefler[0];
            const son = hedefler[hedefler.length - 1];

            // Odak pencerenin dışına çıkmasın
            if (e.shiftKey && document.activeElement === ilk) {
                e.preventDefault();
                son.focus();
            } else if (!e.shiftKey && document.activeElement === son) {
                e.preventDefault();
                ilk.focus();
            }
        };

        document.addEventListener('keydown', tusa, true);

        // Açılışta ilk odaklanabilir öğeye odaklan
        const zamanlayici = setTimeout(() => {
            const panel = panelRef.current;
            if (!panel) return;
            const ilk = panel.querySelector(ODAKLANABILIR);
            (ilk || panel).focus?.();
        }, 40);

        return () => {
            document.removeEventListener('keydown', tusa, true);
            clearTimeout(zamanlayici);
            // Kapanınca odağı açan öğeye geri ver
            oncekiOdakRef.current?.focus?.();
        };
    }, [acik, kapat]);

    // Arkadaki sayfa kaymasın
    useEffect(() => {
        if (!acik) return;
        const onceki = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = onceki; };
    }, [acik]);

    if (!acik || typeof document === 'undefined') return null;

    const tamEkran = genislik === 'tam';

    return createPortal(
        <div
            className="pencere-tam-ekran fixed inset-0 z-modal-base flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
            onMouseDown={(e) => { if (e.target === e.currentTarget) kapat(); }}
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={typeof baslik === 'string' ? baslik : undefined}
                tabIndex={-1}
                /* styles/mobil.css'teki genel pencere kuralı bu işareti
                   taşıyanlara uygulanmaz — düzeni burada yönetiliyor */
                data-ui-pencere=""
                className={cn(
                    // Yükseltilmiş yüzey + modal gölgesi: sayfadan kopuk okunur
                    'bg-surface-e shadow-modal flex flex-col w-full outline-none',
                    'rounded-t-dlg sm:rounded-dlg',
                    tamEkran ? 'h-full sm:rounded-none' : 'max-h-[92dvh]',
                    GENISLIKLER[genislik] || GENISLIKLER.md,
                    className
                )}
            >
                {/* Başlık — yapışık */}
                {(baslik || !kapatilamaz) && (
                    <div className="shrink-0 flex items-start justify-between gap-3 px-5 py-4 border-b border-line">
                        <div className="min-w-0">
                            {baslik && <h2 className="tip-h4">{baslik}</h2>}
                            {aciklama && <p className="tip-caption mt-0.5">{aciklama}</p>}
                        </div>
                        {!kapatilamaz && (
                            <button
                                type="button"
                                onClick={kapat}
                                aria-label="Kapat"
                                className="shrink-0 -mr-1 -mt-1 p-2 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                )}

                {/* Gövde — tek kayan alan */}
                <div
                    className={cn(
                        'flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4',
                        govdeClassName
                    )}
                >
                    {children}
                </div>

                {/* Alt düğme çubuğu — yapışık, güvenli alan paylı */}
                {altCubuk && (
                    <div className="shrink-0 flex flex-wrap gap-2 justify-end px-5 py-4 border-t border-line bg-surface pencere-alt-cubuk">
                        {altCubuk}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
