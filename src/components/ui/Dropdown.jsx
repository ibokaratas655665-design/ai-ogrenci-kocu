import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../../lib/cn';

/**
 * Açılır menü.
 *
 * Kod tabanındaki açılır menüler `group-hover` ile çalışıyordu —
 * dokunmatik ekranda "hover" olmadığı için telefonda HİÇ açılmıyorlardı
 * (ders programındaki PDF menüsü buna örnekti).
 *
 * Burada tıklama ile açılır; dışarı tıklama ve Escape kapatır, ok
 * tuşlarıyla gezilir. Menü ekranın alt kenarına sığmıyorsa yukarı açılır.
 */
export default function Dropdown({
    tetik,
    ogeler = [],
    hiza = 'sag',
    className,
    menuClassName,
}) {
    const [acik, setAcik] = useState(false);
    const [yukari, setYukari] = useState(false);
    const sarmalRef = useRef(null);
    const menuRef = useRef(null);

    const kapat = useCallback(() => setAcik(false), []);

    useEffect(() => {
        if (!acik) return;

        const disariTikla = (e) => {
            if (!sarmalRef.current?.contains(e.target)) kapat();
        };
        const tusa = (e) => {
            if (e.key === 'Escape') { kapat(); return; }
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
            e.preventDefault();
            const hedefler = [...(menuRef.current?.querySelectorAll('[role="menuitem"]:not([disabled])') || [])];
            if (!hedefler.length) return;
            const i = hedefler.indexOf(document.activeElement);
            const yon = e.key === 'ArrowDown' ? 1 : -1;
            hedefler[(i + yon + hedefler.length) % hedefler.length].focus();
        };

        document.addEventListener('mousedown', disariTikla);
        document.addEventListener('keydown', tusa);

        // Ekranın altına taşacaksa yukarı aç
        const kutu = sarmalRef.current?.getBoundingClientRect();
        if (kutu) setYukari(window.innerHeight - kutu.bottom < 260);

        return () => {
            document.removeEventListener('mousedown', disariTikla);
            document.removeEventListener('keydown', tusa);
        };
    }, [acik, kapat]);

    return (
        <div ref={sarmalRef} className={cn('relative inline-block', className)}>
            {React.cloneElement(tetik, {
                onClick: (e) => { tetik.props.onClick?.(e); setAcik((a) => !a); },
                'aria-haspopup': 'menu',
                'aria-expanded': acik,
            })}

            {acik && (
                <div
                    ref={menuRef}
                    role="menu"
                    className={cn(
                        'absolute z-modal-high min-w-[200px] max-w-[calc(100vw-2rem)] py-1',
                        'bg-surface-e border border-line rounded-dmd shadow-acilir',
                        'animate-scale-in origin-top',
                        yukari ? 'bottom-full mb-1' : 'top-full mt-1',
                        hiza === 'sag' ? 'right-0' : 'left-0',
                        menuClassName
                    )}
                >
                    {ogeler.map((o, i) => {
                        if (o.ayrac) return <div key={`ayrac-${i}`} className="my-1 border-t border-line" role="separator" />;
                        const Simge = o.simge;
                        return (
                            <button
                                key={o.id || o.etiket}
                                type="button"
                                role="menuitem"
                                disabled={o.pasif}
                                onClick={() => { o.onSec?.(); kapat(); }}
                                className={cn(
                                    'w-full text-left px-3 py-2.5 min-h-[44px] tip-small flex items-center gap-2.5',
                                    'transition-colors duration-hizli',
                                    'hover:bg-surface-3 focus-visible:outline-none focus-visible:bg-surface-3',
                                    'disabled:text-disabled-ink disabled:cursor-not-allowed disabled:hover:bg-transparent',
                                    o.tehlikeli ? 'text-danger hover:bg-danger-soft' : 'text-ink-2'
                                )}
                            >
                                {Simge && <Simge size={15} className="shrink-0" aria-hidden="true" />}
                                <span className="flex-1 min-w-0">{o.etiket}</span>
                                {o.kisayol && <span className="tip-mini text-ink-3">{o.kisayol}</span>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
