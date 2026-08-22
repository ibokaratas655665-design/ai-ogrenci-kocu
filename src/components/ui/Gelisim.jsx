/**
 * 🎨 TASARIM 2.0 ORTAK PARÇALARI (23.08.2026)
 *
 * Referans tasarımın üç yapı taşı — her ekran kendi kopyasını
 * yazmasın diye tek dosyada:
 *
 *   <GelisimKarti>   degrade gelişim kartı (Net Artışı, Soru Çözümü…)
 *   <IstatistikCipi> renkli ikon baloncuklu mini istatistik
 *   <SegmentliSecim> hap biçimli bölüm seçici (Günlük Kayıt | Hata…)
 *
 * Biçim styles/tasarim2.css'te; burada yalnızca davranış var.
 */
import React from 'react';
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

export default { GelisimKarti, IstatistikCipi, SegmentliSecim };
