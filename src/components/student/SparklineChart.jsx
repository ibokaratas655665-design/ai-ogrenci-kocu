import React from 'react';

/**
 * Madde 7: Sparkline grafiği — öğrenci başına net trendi gösteren mini SVG çizgi grafik
 * Kullanım: <SparklineChart nets={[12.5, 15, 18, 14, 22]} />
 */
const SparklineChart = ({ nets = [], width = 64, height = 24 }) => {
    if (!nets || nets.length < 2) {
        return <span className="text-ink-3 text-xs">—</span>;
    }

    const values = nets.map(n => parseFloat(n) || 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const points = values.map((v, i) => {
        const x = (i / (values.length - 1)) * (width - 4) + 2;
        const y = height - 4 - ((v - min) / range) * (height - 8) + 2;
        return `${x},${y}`;
    }).join(' ');

    const lastTwo = values.slice(-2);
    const trend = lastTwo[1] >= lastTwo[0];
    const color = trend ? 'var(--ok)' : 'var(--c5)';

    return (
        <svg width={width} height={height} className="inline-block" aria-label="net trend">
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
            />
            {/* Son nokta vurgusu */}
            {values.length >= 2 && (() => {
                const last = points.split(' ').at(-1)?.split(',');
                if (!last) return null;
                return (
                    <circle
                        cx={parseFloat(last[0])}
                        cy={parseFloat(last[1])}
                        r="2.5"
                        fill={color}
                    />
                );
            })()}
        </svg>
    );
};

export default SparklineChart;
