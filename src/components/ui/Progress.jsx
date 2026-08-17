import React from 'react';
import { cn } from '../../lib/cn';

/**
 * İlerleme göstergeleri.
 *
 * Kod tabanında ilerleme çubukları her ekranda elle çiziliyordu; kimi
 * yüzdeyi yazmıyor, kimi ekran okuyucuya hiçbir şey söylemiyordu.
 *
 * Renk anlamı rozetlerle aynı: `basari` tamamlandı, `uyari` geride,
 * `hata` riskli. Renk verilmezse tamamlanma oranına göre otomatik seçilir
 * — böylece "%30 kırmızı, %90 yeşil" kuralı tüm uygulamada aynı olur.
 */

const TONLAR = {
    marka: 'bg-brand',
    basari: 'bg-ok',
    uyari: 'bg-warn',
    hata: 'bg-danger',
    bilgi: 'bg-info',
};

const otomatikTon = (yuzde) => (yuzde >= 80 ? 'basari' : yuzde >= 45 ? 'uyari' : 'hata');

const KALINLIK = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' };

export default function Progress({
    deger = 0,
    enFazla = 100,
    ton,
    kalinlik = 'md',
    etiket,
    yuzdeGoster = false,
    className,
}) {
    const yuzde = Math.min(100, Math.max(0, (Number(deger) / (Number(enFazla) || 100)) * 100));
    const secilenTon = ton || otomatikTon(yuzde);

    return (
        <div className={cn('w-full', className)}>
            {(etiket || yuzdeGoster) && (
                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                    {etiket && <span className="tip-label text-ink-2">{etiket}</span>}
                    {yuzdeGoster && <span className="rakam tip-caption font-bold text-ink">%{Math.round(yuzde)}</span>}
                </div>
            )}
            <div
                role="progressbar"
                aria-valuenow={Math.round(yuzde)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={etiket || 'İlerleme'}
                className={cn('w-full rounded-pill bg-surface-3 overflow-hidden', KALINLIK[kalinlik] || KALINLIK.md)}
            >
                <div
                    className={cn('h-full rounded-pill transition-[width] duration-yavas', TONLAR[secilenTon])}
                    style={{ width: `${yuzde}%` }}
                />
            </div>
        </div>
    );
}

/** Halka ilerleme — KPI kartlarında ve konu tamamlama oranında. */
export function HalkaProgress({
    deger = 0,
    enFazla = 100,
    boyut = 64,
    kalinlik = 6,
    ton,
    className,
    children,
}) {
    const yuzde = Math.min(100, Math.max(0, (Number(deger) / (Number(enFazla) || 100)) * 100));
    const secilenTon = ton || otomatikTon(yuzde);
    const r = (boyut - kalinlik) / 2;
    const cevre = 2 * Math.PI * r;

    const RENK = {
        marka: 'var(--brand)', basari: 'var(--ok)', uyari: 'var(--warn)',
        hata: 'var(--danger)', bilgi: 'var(--info)',
    };

    return (
        <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: boyut, height: boyut }}>
            <svg width={boyut} height={boyut} className="-rotate-90" aria-hidden="true">
                <circle cx={boyut / 2} cy={boyut / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={kalinlik} />
                <circle
                    cx={boyut / 2} cy={boyut / 2} r={r} fill="none"
                    stroke={RENK[secilenTon]} strokeWidth={kalinlik} strokeLinecap="round"
                    strokeDasharray={cevre}
                    strokeDashoffset={cevre - (yuzde / 100) * cevre}
                    style={{ transition: 'stroke-dashoffset var(--sure-yavas) var(--egri)' }}
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center rakam tip-caption font-bold text-ink">
                {children ?? `%${Math.round(yuzde)}`}
            </span>
        </div>
    );
}
