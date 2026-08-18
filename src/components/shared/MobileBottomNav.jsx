/**
 * 📱 MOBİL GEZİNME
 *
 * ⚠️ ESKİ HÂLİ ÇALIŞMIYORDU. Sekme listeleri bu dosyaya ELLE yazılmıştı
 * ve panellerin gerçek sekme kimlikleriyle uyuşmuyordu:
 *
 *   · Koç çubuğu `overview` ve `students` gönderiyordu — koç panelinde
 *     böyle sekmeler YOK (gerçekleri: analysis, exams, programs…).
 *   · Koçun "Daha Fazla" düğmesi bir durum değiştiriyor ama açılacak
 *     panel HİÇ ÇİZİLMİYORDU; düğmeye basmak görünürde hiçbir şey yapmıyordu.
 *   · Öğrenci "Daha Fazla" listesindeki `badges`, `analytics`, `stats`
 *     kimlikleri de panelde mevcut değildi.
 *
 * Artık liste dışarıdan, panelin KENDİ sekme tanımından gelir; tek
 * doğruluk kaynağı vardır ve kimlikler uyuşmazlığa düşemez.
 *
 * Mobil, masaüstü kenar çubuğunun küçültülmüşü değildir: altta en çok
 * 5 hedef durur, kalanı tam ekran bir sayfada gruplanır.
 */
import React, { useState, useEffect } from 'react';
import { MoreHorizontal, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Sayac } from '../ui/Badge';
import Modal from '../ui/Modal';

/** Alt çubuk en çok 5 hedef taşır — 4 birincil + "Daha Fazla". */
const BIRINCIL_SAYISI = 4;

function CubukDugmesi({ oge, aktif, onSec, etiketGoster = true }) {
    const Simge = oge.icon;
    return (
        <button
            type="button"
            onClick={() => onSec(oge.id)}
            aria-current={aktif ? 'page' : undefined}
            className={cn(
                'relative flex flex-col items-center justify-center gap-1 flex-1 min-w-0',
                'min-h-[52px] px-1 rounded-dmd transition-colors duration-hizli',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset',
                aktif ? 'text-brand' : 'text-ink-3 active:bg-surface-3'
            )}
        >
            {/* Aktif sekmenin üstünde ince çizgi — renkten bağımsız,
                renk körlüğünde de "buradayım" okunur kalsın diye */}
            <span
                aria-hidden="true"
                className={cn(
                    'absolute -top-px left-1/2 -translate-x-1/2 h-0.5 rounded-pill transition-all duration-normal',
                    aktif ? 'w-8 bg-brand' : 'w-0 bg-transparent'
                )}
            />
            <span className="relative">
                <Simge size={21} strokeWidth={aktif ? 2.2 : 1.75} aria-hidden="true" />
                {oge.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2">
                        <Sayac deger={oge.badge} enFazla={9} />
                    </span>
                )}
            </span>
            {etiketGoster && (
                /* 320 piksellik ekranda çubuk beşe bölününce her hedefe 64
                   piksel düşüyor; harf aralığı sıfırlanıp kırpma açık
                   bırakıldı ki uzun etiket komşusunu itmesin. */
                <span className={cn(
                    'tip-mini tracking-normal normal-case truncate max-w-full leading-none',
                    aktif && 'font-bold'
                )}>
                    {oge.kisaLabel || oge.label}
                </span>
            )}
        </button>
    );
}

/**
 * Alt gezinme çubuğu.
 *
 * @param {Array}  ogeler   { id, label, icon, badge } — panelin gerçek sekmeleri
 * @param {Array}  gruplar  [{ label, items:[…] }] — "Daha Fazla" sayfasının içeriği
 * @param {string} aktif    seçili sekme kimliği
 */
export default function MobilGezinme({ ogeler = [], gruplar = [], aktif, onDegis }) {
    const [dahaFazla, setDahaFazla] = useState(false);

    const birincil = ogeler.slice(0, BIRINCIL_SAYISI);
    // Birincil listede olmayan her şey "Daha Fazla" sayfasına düşer
    const birincilKimlikler = new Set(birincil.map((o) => o.id));
    const kalanGruplar = gruplar
        .map((g) => ({ ...g, items: g.items.filter((i) => !birincilKimlikler.has(i.id)) }))
        .filter((g) => g.items.length);

    // Aktif sekme "Daha Fazla" içindeyse düğme de aktif görünsün
    const aktifIcerde = !birincilKimlikler.has(aktif);

    // Sayfa açıkken arkadaki içerik kaymasın; Escape kapatsın
    useEffect(() => {
        if (!dahaFazla) return;
        const onceki = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const tusa = (e) => e.key === 'Escape' && setDahaFazla(false);
        document.addEventListener('keydown', tusa);
        return () => {
            document.body.style.overflow = onceki;
            document.removeEventListener('keydown', tusa);
        };
    }, [dahaFazla]);

    const sec = (id) => { setDahaFazla(false); onDegis?.(id); };

    return (
        <>
            {/* ── "Daha Fazla" — açılır kutu değil, TAM SAYFA ──────────
                Küçük bir açılır kutuda 11 hedef okunmuyordu; dokunma
                hedefleri de birbirine giriyordu. */}
            {dahaFazla && (
                <Modal
                    acik
                    onClose={() => setDahaFazla(false)}
                    baslikGizle
                    genislik="tam"
                    katmanClassName="z-modal-base lg:hidden"
                    govdeClassName="p-0 flex flex-col overflow-hidden"
                >
                    <div className="shrink-0 flex items-center justify-between px-4 h-14 border-b border-line">
                        <h2 className="tip-h4">Tüm Bölümler</h2>
                        <button
                            type="button"
                            onClick={() => setDahaFazla(false)}
                            aria-label="Kapat"
                            className="p-2 -mr-2 rounded-dmd text-ink-3 hover:text-ink hover:bg-surface-3 transition-colors duration-hizli"
                        >
                            <X size={22} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-24 space-y-6">
                        {kalanGruplar.map((grup) => (
                            <section key={grup.label}>
                                <h3 className="tip-label text-ink-3 mb-2">{grup.label}</h3>
                                <div className="grid grid-cols-1 gap-1">
                                    {grup.items.map((oge) => {
                                        const Simge = oge.icon;
                                        const secili = oge.id === aktif;
                                        return (
                                            <button
                                                key={oge.id}
                                                type="button"
                                                onClick={() => sec(oge.id)}
                                                aria-current={secili ? 'page' : undefined}
                                                className={cn(
                                                    'w-full min-h-[52px] px-3 rounded-dmd flex items-center gap-3 text-left',
                                                    'transition-colors duration-hizli',
                                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                                                    secili
                                                        ? 'bg-brand-soft text-brand font-bold'
                                                        : 'text-ink-2 hover:bg-surface-3 active:bg-surface-3'
                                                )}
                                            >
                                                {Simge && <Simge size={19} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />}
                                                <span className="tip-small flex-1 min-w-0 truncate">{oge.label}</span>
                                                {oge.badge > 0 && <Sayac deger={oge.badge} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                        ))}
                    </div>
                </Modal>
            )}

            {/* ── Alt çubuk ───────────────────────────────────────────── */}
            <nav
                aria-label="Ana gezinme"
                className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-surface border-t border-line shadow-yuzen"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
                <div className="flex items-stretch gap-0.5 px-1 pt-1 pb-1">
                    {birincil.map((oge) => (
                        <CubukDugmesi key={oge.id} oge={oge} aktif={oge.id === aktif} onSec={sec} />
                    ))}
                    {kalanGruplar.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setDahaFazla((a) => !a)}
                            aria-expanded={dahaFazla}
                            className={cn(
                                'relative flex flex-col items-center justify-center gap-1 flex-1 min-w-0',
                                'min-h-[52px] px-1 rounded-dmd transition-colors duration-hizli',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset',
                                dahaFazla || aktifIcerde ? 'text-brand' : 'text-ink-3 active:bg-surface-3'
                            )}
                        >
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'absolute -top-px left-1/2 -translate-x-1/2 h-0.5 rounded-pill transition-all duration-normal',
                                    aktifIcerde ? 'w-8 bg-brand' : 'w-0'
                                )}
                            />
                            <MoreHorizontal size={21} strokeWidth={aktifIcerde ? 2.2 : 1.75} aria-hidden="true" />
                            {/* "Daha Fazla" 320 piksellik ekranda beşe bölünen
                                çubuğa sığmayıp kırpılıyordu — "Menü" sığıyor. */}
                            <span className={cn('tip-mini tracking-normal normal-case', aktifIcerde && 'font-bold')}>
                                Menü
                            </span>
                            <span className="sr-only">Tüm bölümler</span>
                        </button>
                    )}
                </div>
            </nav>

            {/* İçerik alt çubuğun altında kalmasın */}
            <div className="h-[68px] lg:hidden" aria-hidden="true" />
        </>
    );
}

/** Ekran boyutuna göre mobil tespiti (1024px = lg kırılma noktası). */
export const useIsMobile = () => {
    const [mobil, setMobil] = useState(
        typeof window !== 'undefined' ? window.innerWidth < 1024 : false
    );
    useEffect(() => {
        const olcu = () => setMobil(window.innerWidth < 1024);
        window.addEventListener('resize', olcu);
        return () => window.removeEventListener('resize', olcu);
    }, []);
    return mobil;
};

/* Eski adlarla içe aktaran dosyalar kırılmasın diye köprü.
   İkisi de aynı bileşen; liste artık dışarıdan geliyor. */
export const StudentBottomNav = MobilGezinme;
export const CoachBottomNav = MobilGezinme;
