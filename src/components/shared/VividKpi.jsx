import React, { useEffect, useRef, useState } from 'react';

/**
 * 📊 CANLI KPI KARTI
 *
 * Eski kartlar düz degrade bloklardı; sayı değiştiğinde hiçbir şey
 * belli olmuyordu. Bu kart:
 *   · kendi renk kimliğini taşır (üst şerit + ikon halesi)
 *   · değeri sayarak yükseltir (count-up)
 *   · değer değişince kısa bir parlama verir ("veri güncellendi")
 *   · isteğe bağlı mini sparkline ile trendi gösterir
 *   · tıklanabilirse üzerine gelince hafifçe kalkar
 */

/** Sayıyı hedefe doğru yumuşak biçimde sayar. */
const useCountUp = (target, duration = 700) => {
    const numeric = typeof target === 'number' && Number.isFinite(target);
    const [shown, setShown] = useState(numeric ? 0 : target);
    const fromRef = useRef(0);
    const rafRef = useRef(0);

    useEffect(() => {
        // setState yalnızca rAF geri çağrısı içinde — effect gövdesinde
        // senkron setState zincirleme render'a yol açıyor.
        const from = fromRef.current;
        let start = 0;

        const tick = (now) => {
            if (!start) start = now;
            if (!numeric || target === from) {
                fromRef.current = numeric ? target : from;
                setShown(target);
                return;
            }
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            const v = from + (target - from) * eased;
            setShown(Number.isInteger(target) ? Math.round(v) : Math.round(v * 10) / 10);
            if (t < 1) rafRef.current = requestAnimationFrame(tick);
            else fromRef.current = target;
        };

        rafRef.current = requestAnimationFrame(tick);

        // Güvenlik ağı: sekme arka plandayken veya sayfa görüntülenmiyorken
        // requestAnimationFrame hiç tetiklenmez ve sayı 0'da takılı kalırdı.
        // Süre dolduğunda değeri her hâlükârda yerine oturt.
        const settle = setTimeout(() => {
            fromRef.current = numeric ? target : fromRef.current;
            setShown(target);
        }, duration + 120);

        return () => {
            cancelAnimationFrame(rafRef.current);
            clearTimeout(settle);
        };
    }, [target, duration, numeric]);

    return shown;
};

/** Basit, bağımsız SVG sparkline — Recharts yükü olmadan trend gösterir. */
const Sparkline = ({ data = [], color = 'var(--c1)' }) => {
    if (!data || data.length < 2) return null;
    const w = 100;
    const h = 26;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / span) * (h - 4) - 2;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const id = `spark-${color.replace('#', '')}`;

    return (
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-6 mt-2">
            <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity=".45" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon points={`0,${h} ${pts.join(' ')} ${w},${h}`} fill={`url(#${id})`} />
            <polyline
                points={pts.join(' ')}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

const VividKpi = ({
    label,
    value,
    sub,
    icon,
    color = 'var(--c1)',
    trend = null,      // sayı dizisi → sparkline
    delta = null,      // yüzde/adet değişimi
    onClick = null,
}) => {
    const Icon = icon;
    const shown = useCountUp(value);
    const clickable = typeof onClick === 'function';

    return (
        <div
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            onClick={onClick || undefined}
            onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
            className={`vivid-kpi ${clickable ? 'cursor-pointer' : ''}`}
            style={{ '--kpi': color }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[.18em] text-ink-3 truncate">
                        {label}
                    </p>
                    {/* key={value} → değer değişince eleman yenilenir ve
                        parlama animasyonu kendiliğinden yeniden başlar */}
                    <p key={value} className="kpi-value text-[28px] mt-1.5 value-flash">
                        {shown}
                    </p>
                    {(sub || delta != null) && (
                        <p className="text-[10px] font-bold text-ink-3 mt-1.5 flex items-center gap-1.5">
                            {delta != null && (
                                <span style={{ color: delta >= 0 ? 'var(--ok)' : 'var(--danger)' }}>
                                    {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}
                                </span>
                            )}
                            {sub}
                        </p>
                    )}
                </div>
                {Icon && (
                    <div className="kpi-icon shrink-0">
                        <Icon size={19} />
                    </div>
                )}
            </div>

            {trend && trend.length > 1 && <Sparkline data={trend} color={color} />}
        </div>
    );
};

export { Sparkline };
export default VividKpi;
