/**
 * 🗂️ ALT SEKME ŞERİDİ
 *
 * Üst navigasyondaki buton kalabalığını azaltmak için: birbirine yakın
 * işler tek bir üst sekme altında toplanır, aralarında bu şeritle gezilir.
 *
 * Seçili sekme localStorage'a yazılır — koç sayfayı yenilediğinde
 * kaldığı yerden devam eder.
 */
import React, { useState, useCallback } from 'react';

const SectionTabs = ({ id, sections, children, accent = 'var(--brand)' }) => {
    const storageKey = `section_tab_${id}`;

    const [stored, setStored] = useState(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) return saved;
        } catch { /* ignore */ }
        return null;
    });

    // Seçili sekme türetilir: kayıtlı değer listede yoksa ilk sekmeye düşer.
    // (Effect içinde setState ile düzeltmek gereksiz bir render turu doğuruyordu.)
    const active = sections.some((s) => s.id === stored) ? stored : sections[0]?.id;

    const select = useCallback((sectionId) => {
        setStored(sectionId);
        try { localStorage.setItem(storageKey, sectionId); } catch { /* ignore */ }
    }, [storageKey]);

    const current = sections.find((s) => s.id === active) || sections[0];

    return (
        <div className="space-y-5">
            {/* Şerit */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {sections.map((s) => {
                    const isActive = s.id === active;
                    return (
                        <button
                            key={s.id}
                            onClick={() => select(s.id)}
                            className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all ${
                                isActive
                                    ? 'text-ink-on shadow-lg'
                                    : 'bg-surface/[0.04] text-ink-3 hover:text-ink-2 hover:bg-surface/[0.07]'
                            }`}
                            style={isActive ? { backgroundColor: accent, boxShadow: `0 8px 24px -8px ${accent}` } : undefined}
                        >
                            {s.icon && <s.icon size={14} />}
                            {s.label}
                            {s.badge > 0 && (
                                <span
                                    className="px-1.5 py-0.5 rounded-md text-[10px] font-black"
                                    style={{
                                        backgroundColor: isActive ? 'rgba(0,0,0,0.15)' : `${accent}22`,
                                        color: isActive ? 'var(--bg)' : accent,
                                    }}
                                >
                                    {s.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Bölüm başlığı */}
            {current?.description && (
                <div className="flex items-start gap-3 px-1">
                    <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: accent }} />
                    <div>
                        <h2 className="text-lg font-black text-ink syne uppercase tracking-tight">
                            {current.title || current.label}
                        </h2>
                        <p className="text-[11px] text-ink-3 leading-snug mt-0.5">{current.description}</p>
                    </div>
                </div>
            )}

            {/* İçerik */}
            <div key={active} className="rise-in">{typeof children === 'function' ? children(active) : children}</div>
        </div>
    );
};

export default SectionTabs;
