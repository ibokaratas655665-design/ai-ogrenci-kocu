import React from 'react';
import { sayiBicim } from './grafikTemasi';

/**
 * Grafik ipucu.
 *
 * Recharts'ın varsayılan ipucu beyaz zeminli, keskin köşeli bir kutu;
 * karanlık temada okunmuyordu ve sayılar hizalanmıyordu. Kod tabanında
 * 52 ızgaraya karşılık yalnızca 34 ipucu vardı — grafikler süsleniyor
 * ama okunmalarına yardım edilmiyordu.
 *
 * Bu ipucu tasarım dizgesinin yüzey, kenar ve gölge belirteçlerini
 * kullanır; sayılar `tabular-nums` ile hizalanır, sıfır değerler
 * gizlenmez (veri yok ile sıfır aynı şey değildir).
 */
export default function OrtakTooltip({
    active,
    payload,
    label,
    birim = '',
    basamak = 1,
    /** Etiketi biçimlendirmek için (tarih vb.) */
    etiketBicim,
}) {
    if (!active || !payload || !payload.length) return null;

    const satirlar = payload.filter((p) => p && p.value != null);
    if (!satirlar.length) return null;

    return (
        <div
            className="rounded-dmd border border-line bg-surface-e shadow-acilir px-3 py-2 min-w-[140px]"
            role="tooltip"
        >
            {label != null && label !== '' && (
                <p className="tip-mini text-ink-3 mb-1.5">
                    {etiketBicim ? etiketBicim(label) : label}
                </p>
            )}
            <ul className="space-y-1">
                {satirlar.map((p, i) => (
                    <li key={`${p.dataKey}-${i}`} className="flex items-center gap-2">
                        <span
                            className="w-2 h-2 rounded-pill shrink-0"
                            style={{ backgroundColor: p.color || p.stroke || p.fill }}
                            aria-hidden="true"
                        />
                        <span className="tip-caption text-ink-2 flex-1 min-w-0 truncate">
                            {p.name || p.dataKey}
                        </span>
                        <span className="rakam tip-caption font-bold text-ink">
                            {sayiBicim(p.value, basamak)}{birim}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
