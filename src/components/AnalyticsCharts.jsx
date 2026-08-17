/**
 * AnalyticsCharts — Yüklenen denemelerden gerçek gelişim grafikleri
 * TYT veya AYT, bireysel öğrenci için deneme bazlı ilerleme gösterir
 */
import React, { useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, BarChart, Bar, ReferenceLine,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, BookOpen, BarChart2 } from 'lucide-react';

// ─── Yardımcı: subj objesinden net al ────────────────────────────
const getSubjNet = (val) => {
    if (val == null) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'object') return parseFloat(val.net ?? val.d ?? 0);
    return parseFloat(val) || 0;
};

// ─── Tooltip özelleştirilmiş ─────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-surface border border-line rounded-xl p-3 shadow-lg text-sm">
            <p className="font-bold text-ink mb-1">{label}</p>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-ink-2">{p.name}:</span>
                    <span className="font-black" style={{ color: p.color }}>{p.value}</span>
                </div>
            ))}
        </div>
    );
};

// ─── Ana Bileşen ─────────────────────────────────────────────────
const AnalyticsCharts = ({ examData }) => {
    const [view, setView] = useState('progress'); // 'progress' | 'subject' | 'compare'

    if (!examData || examData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-10 bg-surface rounded-2xl border border-line h-48">
                <BarChart2 size={36} className="text-ink-3 mb-3"  animationDuration={300} />
                <p className="text-ink-3 font-medium">Henüz deneme sonucu yok.</p>
                <p className="text-xs text-ink-3 mt-1">Koçun deneme yüklediğinde grafikler burada belirecek.</p>
            </div>
        );
    }

    // ── Deneme sırasına göre sırala (date veya trialId bazlı) ──────
    const sorted = [...examData].sort((a, b) => {
        if (a.date && b.date) return new Date(a.date) - new Date(b.date);
        return (a.trialId || 0) - (b.trialId || 0);
    });

    // ── TYT ve AYT denemelerini ayır ──────────────────────────────
    const tytExams = sorted.filter(e => (e.examType || 'TYT') === 'TYT');
    const aytExams = sorted.filter(e => e.examType === 'AYT');
    const hasTYT = tytExams.length > 0;
    const hasAYT = aytExams.length > 0;

    // ── TYT İlerleme verisi (deneme bazlı) ──────────────────────────
    const tytProgressData = tytExams.map((exam, i) => {
        const turkce = getSubjNet(exam.subjects?.turkce ?? exam.turkce);
        const mat = getSubjNet(exam.subjects?.mat ?? exam.mat);
        const fen = getSubjNet(exam.subjects?.fen ?? exam.fen);
        const sosyal = getSubjNet(exam.subjects?.sosyal ?? exam.sosyal);
        const totalNet = parseFloat(exam.totalNet || exam.tyt || (turkce + mat + fen + sosyal) || 0);
        const label = exam.name
            ? exam.name.replace(/\.(xlsx?|pdf)$/i, '').substring(0, 18)
            : `${i + 1}. Deneme`;
        return {
            name: label,
            'Toplam Net': parseFloat(totalNet.toFixed(1)),
            'Türkçe': parseFloat(turkce.toFixed(1)),
            'Matematik': parseFloat(mat.toFixed(1)),
            'Fen': parseFloat(fen.toFixed(1)),
            'Sosyal': parseFloat(sosyal.toFixed(1)),
        };
    });

    // ── AYT İlerleme verisi ──────────────────────────────────────────
    const aytProgressData = aytExams.map((exam, i) => {
        const say = parseFloat(exam.sayNet || 0);
        const ea = parseFloat(exam.eaNet || 0);
        const soz = parseFloat(exam.sozNet || 0);
        const total = parseFloat(exam.totalNet || Math.max(say, ea, soz) || 0);
        const label = exam.name
            ? exam.name.replace(/\.(xlsx?|pdf)$/i, '').substring(0, 18)
            : `${i + 1}. AYT`;
        return {
            name: label,
            'Toplam Net': parseFloat(total.toFixed(1)),
            'SAY': parseFloat(say.toFixed(1)),
            'EA': parseFloat(ea.toFixed(1)),
            'SÖZ': parseFloat(soz.toFixed(1)),
        };
    });

    // ── Deneme bazlı değişim (Δ) hesapla ──────────────────────────
    const calcDelta = (data) =>
        data.map((d, i) => {
            if (i === 0) return { ...d, delta: 0 };
            const prev = data[i - 1]['Toplam Net'] || 0;
            const curr = d['Toplam Net'] || 0;
            return { ...d, delta: parseFloat((curr - prev).toFixed(1)) };
        });

    const tytWithDelta = calcDelta(tytProgressData);
    const aytWithDelta = calcDelta(aytProgressData);

    // ── Son deneme radar (TYT ders dağılımı) ─────────────────────
    const lastTYT = tytExams[tytExams.length - 1];
    const radarData = lastTYT ? [
        { subject: 'Türkçe', A: getSubjNet(lastTYT.subjects?.turkce ?? lastTYT.turkce), fullMark: 40 },
        { subject: 'Matematik', A: getSubjNet(lastTYT.subjects?.mat ?? lastTYT.mat), fullMark: 40 },
        { subject: 'Fen', A: getSubjNet(lastTYT.subjects?.fen ?? lastTYT.fen), fullMark: 20 },
        { subject: 'Sosyal', A: getSubjNet(lastTYT.subjects?.sosyal ?? lastTYT.sosyal), fullMark: 20 },
    ].filter(d => d.A > 0) : [];

    // ── Özet istatistikler ────────────────────────────────────────
    const totalChange = tytWithDelta.length > 1
        ? (tytWithDelta[tytWithDelta.length - 1]['Toplam Net'] - tytWithDelta[0]['Toplam Net']).toFixed(1)
        : null;
    const trend = totalChange > 0 ? 'up' : totalChange < 0 ? 'down' : 'flat';

    const LINE_COLORS = {
        'Toplam Net': 'var(--c1)',
        'Türkçe': 'var(--ok)',
        'Matematik': 'var(--info)',
        'Fen': 'var(--warn)',
        'Sosyal': 'var(--c5)',
        'SAY': 'var(--c4)',
        'EA': 'var(--info)',
        'SÖZ': 'var(--warn)',
    };

    return (
        <div className="space-y-6">
            {/* ── Özet Kartlar ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-brand-soft rounded-2xl p-3 text-center">
                    <div className="text-xs text-brand font-bold uppercase mb-1">TYT Deneme</div>
                    <div className="text-2xl font-black text-brand">{tytExams.length}</div>
                </div>
                {hasAYT && (
                    <div className="bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] rounded-2xl p-3 text-center">
                        <div className="text-xs text-c4 font-bold uppercase mb-1">AYT Deneme</div>
                        <div className="text-2xl font-black text-c4">{aytExams.length}</div>
                    </div>
                )}
                {tytExams.length > 0 && (
                    <div className="bg-ok-soft rounded-2xl p-3 text-center">
                        <div className="text-xs text-ok font-bold uppercase mb-1">En Yüksek</div>
                        <div className="text-2xl font-black text-ok">
                            {Math.max(...tytExams.map(e => parseFloat(e.totalNet || e.tyt || 0))).toFixed(1)}
                        </div>
                    </div>
                )}
                {totalChange !== null && (
                    <div className={`rounded-2xl p-3 text-center ${trend === 'up' ? 'bg-ok-soft' : trend === 'down' ? 'bg-danger-soft' : 'bg-surface-2'}`}>
                        <div className={`text-xs font-bold uppercase mb-1 ${trend === 'up' ? 'text-ok' : trend === 'down' ? 'text-danger' : 'text-ink-2'}`}>
                            Toplam Gelişim
                        </div>
                        <div className={`text-2xl font-black flex items-center justify-center gap-1 ${trend === 'up' ? 'text-ok' : trend === 'down' ? 'text-danger' : 'text-ink-2'}`}>
                            {trend === 'up' ? <TrendingUp size={18} /> : trend === 'down' ? <TrendingDown size={18} /> : <Minus size={18} />}
                            {totalChange > 0 ? '+' : ''}{totalChange}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Sekme Seçici ── */}
            <div className="flex gap-2 flex-wrap">
                {[
                    { key: 'progress', label: '📈 Gelişim Çizgisi' },
                    { key: 'delta', label: '📊 Deneme Arası Fark' },
                    ...(radarData.length > 2 ? [{ key: 'subject', label: '🎯 Ders Dağılımı' }] : []),
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setView(tab.key)}
                        className={`px-3 py-1.5 rounded-xl text-sm font-bold transition ${view === tab.key
                            ? 'bg-brand text-white shadow-sm'
                            : 'bg-surface-3 text-ink-2 hover:bg-surface-3'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── GELİŞİM ÇİZGİSİ ── */}
            {view === 'progress' && (
                <div className="space-y-5">
                    {hasTYT && tytProgressData.length > 0 && (
                        <div className="bg-surface rounded-2xl p-5 border border-line shadow-sm">
                            <h3 className="font-bold text-ink mb-4 text-sm flex items-center gap-2">
                                <span className="w-2 h-5 bg-brand rounded-full" />
                                TYT — Deneme Bazlı Net Gelişimi
                            </h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={tytProgressData} margin={{ left: -10, right: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)"  vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                                        {['Toplam Net', 'Türkçe', 'Matematik', 'Fen', 'Sosyal'].map(key => (
                                            <Line
                                                key={key}
                                                type="monotone"
                                                dataKey={key}
                                                stroke={LINE_COLORS[key]}
                                                strokeWidth={key === 'Toplam Net' ? 3 : 1.5}
                                                dot={{ r: key === 'Toplam Net' ? 5 : 3, fill: LINE_COLORS[key] }}
                                                activeDot={{ r: 7 }}
                                                strokeDasharray={key === 'Toplam Net' ? undefined : '4 3'}
                                             animationDuration={300} />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {hasAYT && aytProgressData.length > 0 && (
                        <div className="bg-surface rounded-2xl p-5 border border-line shadow-sm">
                            <h3 className="font-bold text-ink mb-4 text-sm flex items-center gap-2">
                                <span className="w-2 h-5 bg-c4 rounded-full" />
                                AYT — Deneme Bazlı Net Gelişimi
                            </h3>
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={aytProgressData} margin={{ left: -10, right: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)"  vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                                        {['Toplam Net', 'SAY', 'EA', 'SÖZ'].map(key => (
                                            <Line
                                                key={key}
                                                type="monotone"
                                                dataKey={key}
                                                stroke={LINE_COLORS[key]}
                                                strokeWidth={key === 'Toplam Net' ? 3 : 1.5}
                                                dot={{ r: 4, fill: LINE_COLORS[key] }}
                                                activeDot={{ r: 7 }}
                                                strokeDasharray={key === 'Toplam Net' ? undefined : '4 3'}
                                             animationDuration={300} />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── DENEME ARASI FARK ── */}
            {view === 'delta' && (
                <div className="space-y-5">
                    {hasTYT && tytWithDelta.length > 1 && (
                        <div className="bg-surface rounded-2xl p-5 border border-line shadow-sm">
                            <h3 className="font-bold text-ink mb-4 text-sm flex items-center gap-2">
                                <span className="w-2 h-5 bg-brand rounded-full" />
                                TYT — Denemeler Arası Net Değişimi (Δ)
                            </h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={tytWithDelta.slice(1)} margin={{ left: -10, right: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            content={({ active, payload, label }) => {
                                                if (!active || !payload?.length) return null;
                                                const d = payload[0]?.value;
                                                return (
                                                    <div className="bg-surface border border-line rounded-xl p-3 shadow-lg text-sm">
                                                        <p className="font-bold text-ink-2 mb-1">{label}</p>
                                                        <p className={`font-black text-lg ${d > 0 ? 'text-ok' : d < 0 ? 'text-danger' : 'text-ink-2'}`}>
                                                            {d > 0 ? '+' : ''}{d} net
                                                        </p>
                                                    </div>
                                                );
                                            }}
                                        />
                                        <ReferenceLine y={0} stroke="var(--line)" strokeWidth={2} />
                                        <Bar
                                            dataKey="delta"
                                            name="Değişim (Δ Net)"
                                            radius={[6, 6, 0, 0]}
                                            fill="var(--c1)"
                                            label={{ position: 'top', fontSize: 11, fontWeight: 'bold' }}
                                        >
                                            {tytWithDelta.slice(1).map((entry, idx) => (
                                                <rect
                                                    key={idx}
                                                    fill={entry.delta >= 0 ? 'var(--ok)' : 'var(--danger)'}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Tablo görünümü */}
                            <div className="mt-4 overflow-x-auto">
                                <table className="min-w-full text-xs">
                                    <thead>
                                        <tr className="bg-surface-2">
                                            <th className="px-3 py-2 text-left font-bold text-ink-2">Deneme</th>
                                            <th className="px-3 py-2 text-center font-bold text-brand">Toplam Net</th>
                                            <th className="px-3 py-2 text-center font-bold text-ink-2">Türkçe</th>
                                            <th className="px-3 py-2 text-center font-bold text-ink-2">Mat</th>
                                            <th className="px-3 py-2 text-center font-bold text-ink-2">Fen</th>
                                            <th className="px-3 py-2 text-center font-bold text-ink-2">Sosyal</th>
                                            <th className="px-3 py-2 text-center font-bold text-ink-2">Δ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {tytWithDelta.map((row, i) => (
                                            <tr key={i} className="hover:bg-surface-2">
                                                <td className="px-3 py-2 font-medium text-ink-2 max-w-[120px] truncate">{row.name}</td>
                                                <td className="px-3 py-2 text-center font-black text-brand">{row['Toplam Net']}</td>
                                                <td className="px-3 py-2 text-center text-ok">{row['Türkçe']}</td>
                                                <td className="px-3 py-2 text-center text-info">{row['Matematik']}</td>
                                                <td className="px-3 py-2 text-center text-warn">{row['Fen']}</td>
                                                <td className="px-3 py-2 text-center text-c5">{row['Sosyal']}</td>
                                                <td className={`px-3 py-2 text-center font-black ${row.delta > 0 ? 'text-ok' : row.delta < 0 ? 'text-danger' : 'text-ink-3'}`}>
                                                    {i === 0 ? '—' : (row.delta > 0 ? '+' : '') + row.delta}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {tytWithDelta.length <= 1 && (
                        <div className="bg-surface-2 rounded-2xl p-8 text-center text-ink-3 text-sm">
                            Değişim grafiği için en az 2 TYT denemesi gerekiyor.
                        </div>
                    )}
                </div>
            )}

            {/* ── DERS DAĞILIMI (RADAR) ── */}
            {view === 'subject' && radarData.length > 2 && (
                <div className="bg-surface rounded-2xl p-5 border border-line shadow-sm">
                    <h3 className="font-bold text-ink mb-4 text-sm flex items-center gap-2">
                        <BookOpen size={16} className="text-c4" />
                        Son TYT Denemesi — Ders Dağılımı
                    </h3>
                    <div className="h-64 w-full relative" style={{ minHeight: '256px' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="var(--line)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#374151', fontSize: 12, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                                <Radar name="Son Deneme" dataKey="A" stroke="var(--c4)" fill="var(--c4)" fillOpacity={0.4} strokeWidth={2}  animationDuration={300} />
                                <Tooltip content={<CustomTooltip />} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsCharts;
