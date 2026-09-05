/**
 * 🗂️ ALT SEKME ŞERİDİ (canlı 04.09 eşlemesi)
 *
 * Üst navigasyondaki buton kalabalığını azaltmak için: birbirine yakın
 * işler tek bir üst sekme altında toplanır, aralarında bu şeritle gezilir.
 *
 * Seçili sekme localStorage'a yazılır — koç sayfayı yenilediğinde
 * kaldığı yerden devam eder.
 *
 * 04.09 canlı sürümündeki biçim:
 *   · telefonda oklu/noktalı BolumSeridi + içerikte kaydırma hareketi
 *   · masaüstünde paletten renklenen 3B hap butonlar
 *   · kokpit zinciri — içerik gövdesi kendi içinde kayar (≥1280px)
 */
import React, { useState, useCallback, useMemo } from 'react';
import { BolumSeridi } from '../ui/Gelisim';
import { useDokunmaGecisi } from '../../lib/dokunmaGecisi';

/* Hap renk paleti — sekme sırasına göre döner. */
const PALET = ['var(--c1)', 'var(--c4)', 'var(--c5)', 'var(--brand)', 'var(--info)', 'var(--ok)'];

const SectionTabs = ({ id, sections, children }) => {
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

    const mobilBolumler = useMemo(
        () => sections.map((s) => ({ id: s.id, baslik: s.label, icon: s.icon })),
        [sections]
    );

    /* İçerik gövdesi üzerinde sola/sağa kaydırma bölüm değiştirir.
       Eleman state'te tutulur (ref değil): key={active} ile yeniden
       yaratılan düğüm effect'i ancak böyle tetikler. */
    const [govdeEl, setGovdeEl] = useState(null);
    useDokunmaGecisi(govdeEl, mobilBolumler, active, select, mobilBolumler.length > 1);

    return (
        <div className="space-y-5 xl:flex-1 xl:min-h-0 xl:flex xl:flex-col xl:overflow-hidden">
            {/* 📱 Telefon: oklu/noktalı şerit */}
            <BolumSeridi bolumler={mobilBolumler} aktif={active} onSec={select} className="shrink-0" />

            {/* 🖥️ Masaüstü: paletten renklenen 3B hap butonlar */}
            <div className="shrink-0 hidden lg:flex flex-wrap gap-2">
                {sections.map((s, i) => {
                    const isActive = s.id === active;
                    const renk = PALET[i % PALET.length];
                    return (
                        <button
                            key={s.id}
                            onClick={() => select(s.id)}
                            aria-pressed={isActive}
                            className="group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                            style={isActive
                                ? {
                                    color: '#fff',
                                    background: `linear-gradient(180deg, color-mix(in srgb, ${renk} 88%, white 12%), ${renk})`,
                                    boxShadow: `inset 0 1px 0 rgba(255,255,255,.35), 0 2px 6px -1px color-mix(in srgb, ${renk} 55%, transparent), 0 9px 20px -9px color-mix(in srgb, ${renk} 60%, transparent)`,
                                }
                                : {
                                    color: 'var(--ink-2)',
                                    background: `linear-gradient(180deg, color-mix(in srgb, ${renk} 10%, var(--surface)), var(--surface))`,
                                    border: `1px solid color-mix(in srgb, ${renk} 32%, var(--line))`,
                                    boxShadow: 'inset 0 1px 0 var(--lit), 0 1px 2px -1px rgba(var(--cast), .2), 0 4px 10px -6px rgba(var(--cast), .4)',
                                }}
                        >
                            {s.icon && <s.icon size={14} />}
                            {s.label}
                            {s.badge > 0 && (
                                <span
                                    className="px-1.5 py-0.5 rounded-md text-[10px] font-black"
                                    style={{
                                        background: isActive ? 'rgba(255,255,255,.25)' : `color-mix(in srgb, ${renk} 18%, var(--surface))`,
                                        color: isActive ? '#fff' : renk,
                                    }}
                                >
                                    {s.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* İçerik — kokpitte kendi gövdesinde kayar */}
            <div ref={setGovdeEl} key={active} className="rise-in xl:flex-1 xl:min-h-0 xl:overflow-y-auto xl:pr-1.5 tek-ekran-govde">
                {typeof children === 'function' ? children(active) : children}
            </div>
        </div>
    );
};

export default SectionTabs;
