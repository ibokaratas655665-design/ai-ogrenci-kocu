/**
 * 🎨 TASARIM 2.0 ORTAK PARÇALARI (23.08.2026)
 *
 * Referans tasarımın üç yapı taşı — her ekran kendi kopyasını
 * yazmasın diye tek dosyada:
 *
 *   <GelisimKarti>   degrade gelişim kartı (Net Artışı, Soru Çözümü…)
 *   <IstatistikCipi> renkli ikon baloncuklu mini istatistik
 *   <SegmentliSecim> hap biçimli bölüm seçici (Günlük Kayıt | Hata…)
 *   <BolumSeridi>    telefon için kaydırmalı bölüm şeridi (ok + nokta)
 *
 * Biçim styles/tasarim2.css'te; burada yalnızca davranış var.
 */
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * Degrade gelişim kartı. Sayı + etiket + isteğe bağlı delta ve mini
 * grafik (children). Ton referans paletinden: mor/turuncu/yesil/mavi.
 */
export function GelisimKarti({ etiket, deger, alt, ton = 'mor', simge: Simge, children, className }) {
    return (
        <div className={cn('gkart on-color', `gkart-${ton}`, className)}>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="gk-etiket">{etiket}</p>
                    <p className="gk-deger rakam">{deger}</p>
                    {alt && <p className="gk-alt">{alt}</p>}
                </div>
                {Simge && (
                    <span className="shrink-0 w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                        <Simge size={18} />
                    </span>
                )}
            </div>
            {children && <div className="mt-2">{children}</div>}
        </div>
    );
}

/** Renkli ikon baloncuklu mini istatistik çipi ("Bu Hafta" şeridi). */
export function IstatistikCipi({ simge: Simge, deger, etiket, ton = 'mor' }) {
    return (
        <div className="cipp">
            <span className={cn('cip-ikon', `cip-${ton}`)}>
                {Simge && <Simge size={16} />}
            </span>
            <span className="cip-deger">{deger}</span>
            <span className="cip-etiket">{etiket}</span>
        </div>
    );
}

/**
 * Hap biçimli segment seçici.
 * @param {Array<{id:string, etiket:string, rozet?:number}>} ogeler
 */
export function SegmentliSecim({ ogeler = [], deger, onSec, etiket, className }) {
    return (
        <div className={cn('segmentli', className)} role="tablist" aria-label={etiket || 'Bölüm seç'}>
            {ogeler.map((o) => (
                <button
                    key={o.id}
                    type="button"
                    role="tab"
                    aria-selected={deger === o.id}
                    className={cn('seg-dugme', deger === o.id && 'seg-on')}
                    onClick={() => onSec?.(o.id)}
                >
                    {o.etiket}
                    {o.rozet > 0 && (
                        <span className="ml-1.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-white/25 text-[9px] font-black align-middle">
                            {o.rozet}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}

/**
 * 📱 Telefon için bölüm şeridi. Masaüstünde kendini gizler (lg:hidden).
 *
 * SegmentliSecim dar ekranda sıkışıyordu: dört hap yan yana sığmıyor,
 * taşan seçenek görünmez oluyordu. Bu şerit üç şey ekler:
 *   · sol/sağ ok — bölümler sırayla gezilir ("Önceki/Sonraki bölüm")
 *   · aktif hap otomatik görüş alanına kayar (scrollIntoView)
 *   · altta nokta göstergesi — kaç bölüm olduğu ve neresi olduğun görünür
 *
 * @param {Array<{id:string, baslik:string, icon?:Function}>} bolumler
 */
export function BolumSeridi({ bolumler = [], aktif, onSec, className }) {
    const seritRef = React.useRef(null);
    const aktifSira = Math.max(0, bolumler.findIndex((b) => b.id === aktif));

    const kaydir = (yon) => {
        const yeni = aktifSira + yon;
        if (yeni < 0 || yeni >= bolumler.length) return;
        onSec?.(bolumler[yeni].id);
    };

    React.useEffect(() => {
        const el = seritRef.current?.querySelector('[data-aktif="1"]');
        el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, [aktif]);

    return (
        <div className={cn('lg:hidden', className)}>
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={() => kaydir(-1)}
                    disabled={aktifSira <= 0}
                    aria-label="Önceki bölüm"
                    className="shrink-0 grid place-items-center w-8 h-8 rounded-full text-ink-3 disabled:opacity-25 active:bg-surface-3 transition-colors"
                >
                    <ChevronLeft size={18} strokeWidth={2.2} />
                </button>

                <div ref={seritRef} className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                    {bolumler.map((b) => {
                        const secili = b.id === aktif;
                        const Ikon = b.icon;
                        return (
                            <button
                                key={b.id}
                                type="button"
                                data-aktif={secili ? '1' : '0'}
                                onClick={() => onSec?.(b.id)}
                                aria-current={secili ? 'true' : undefined}
                                className={cn(
                                    'shrink-0 inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full text-[13px] font-bold whitespace-nowrap',
                                    'transition-all duration-hizli focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                                    secili ? 'text-white' : 'text-ink-2 bg-surface-2 active:bg-surface-3'
                                )}
                                style={secili
                                    ? { background: 'var(--brand)', boxShadow: '0 5px 14px -3px color-mix(in srgb, var(--brand) 55%, transparent)' }
                                    : undefined}
                            >
                                {Ikon && <Ikon size={14} strokeWidth={secili ? 2.4 : 1.9} />}
                                {b.baslik}
                            </button>
                        );
                    })}
                </div>

                <button
                    type="button"
                    onClick={() => kaydir(1)}
                    disabled={aktifSira >= bolumler.length - 1}
                    aria-label="Sonraki bölüm"
                    className="shrink-0 grid place-items-center w-8 h-8 rounded-full text-ink-3 disabled:opacity-25 active:bg-surface-3 transition-colors"
                >
                    <ChevronRight size={18} strokeWidth={2.2} />
                </button>
            </div>

            <div className="flex justify-center items-center gap-1.5 mt-2" aria-hidden="true">
                {bolumler.map((b) => {
                    const secili = b.id === aktif;
                    return (
                        <span
                            key={b.id}
                            className={cn('h-1.5 rounded-full transition-all duration-normal', secili ? 'w-5' : 'w-1.5')}
                            style={{ background: secili ? 'var(--brand)' : 'var(--line-2)' }}
                        />
                    );
                })}
            </div>
        </div>
    );
}

export default { GelisimKarti, IstatistikCipi, SegmentliSecim, BolumSeridi };
