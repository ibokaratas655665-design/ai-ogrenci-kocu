/**
 * 📊 NET GELİŞİM GRAFİĞİ
 * Haftalık ve deneme bazında net değişimini gösterir
 */
import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, ReferenceLine, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus, BarChart2, ArrowUp, ArrowDown } from 'lucide-react';
import { calculateEstimatedScore } from '../../utils/scoreCalculator';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-surface border border-line rounded-xl shadow-lg p-3 text-sm">
            <p className="font-bold text-ink-2 mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: <span className="font-black">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span></p>
            ))}
        </div>
    );
};

const NetProgressChart = ({ examData = [], userId }) => {
    const [view, setView] = useState('trend'); // trend | score | delta | subject

    const sortedExams = useMemo(() => {
        return [...examData].sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [examData]);

    // Trend verisi
    const trendData = useMemo(() => {
        return sortedExams.map((e, idx) => ({
            name: e.name ? e.name.substring(0, 12) : `D${idx + 1}`,
            net: parseFloat((e.totalNet || 0).toFixed(1)),
            score: parseFloat((typeof calculateEstimatedScore === 'function' ? calculateEstimatedScore(e) : 0).toFixed(2)),
            type: e.examType || 'TYT',
        }));
    }, [sortedExams]);

    // Delta (değişim) verisi
    const deltaData = useMemo(() => {
        return sortedExams.slice(1).map((e, idx) => {
            const prev = sortedExams[idx];
            const delta = parseFloat(((e.totalNet || 0) - (prev.totalNet || 0)).toFixed(1));
            return {
                name: e.name ? e.name.substring(0, 12) : `D${idx + 2}`,
                değişim: delta,
                fill: delta >= 0 ? 'var(--ok)' : 'var(--c5)',
            };
        });
    }, [sortedExams]);

    // Ders bazlı ortalama
    const subjectData = useMemo(() => {
        if (sortedExams.length === 0) return [];
        const tyt = sortedExams.filter(e => (e.examType || 'TYT') === 'TYT');
        if (tyt.length === 0) return [];
        const avg = (key) => {
            const vals = tyt.map(e => {
                if (e[key] != null && !isNaN(parseFloat(e[key]))) return parseFloat(e[key]);
                if (e.subjects?.[key]) { const v = e.subjects[key]; return typeof v === 'object' ? (parseFloat(v.net) || 0) : (parseFloat(v) || 0); }
                return 0;
            }).filter(v => v > 0);
            return vals.length > 0 ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)) : 0;
        };
        return [
            { subject: 'Türkçe', ort: avg('turkce'), max: 40, color: 'var(--c1)' },
            { subject: 'Matematik', ort: avg('mat'), max: 40, color: 'var(--c4)' },
            { subject: 'Fen', ort: avg('fen'), max: 20, color: 'var(--info)' },
            { subject: 'Sosyal', ort: avg('sosyal'), max: 20, color: 'var(--ok)' },
        ].filter(s => s.ort > 0);
    }, [sortedExams]);

    // Genel trend hesapla
    const trend = useMemo(() => {
        if (trendData.length < 2) return { dir: 'stable', val: 0 };
        const first = trendData[0]?.net || 0;
        const last = trendData[trendData.length - 1]?.net || 0;
        const val = parseFloat((last - first).toFixed(1));
        return { dir: val > 0.5 ? 'up' : val < -0.5 ? 'down' : 'stable', val };
    }, [trendData]);

    const VIEWS = [
        { id: 'trend', label: 'Net Trendi' },
        { id: 'score', label: 'Puan Trendi' },
        { id: 'delta', label: 'Değişim' },
        { id: 'subject', label: 'Ders Bazlı' },
    ];

    if (examData.length === 0) {
        return (
            <div className="bg-surface rounded-2xl p-8 shadow-sm border border-line text-center">
                <BarChart2 size={48} className="text-ink-3 mx-auto mb-3"  animationDuration={300} />
                <p className="font-bold text-ink-3">Henüz deneme sonucu yok</p>
                <p className="text-sm text-ink-3 mt-1">Koçun deneme yüklediğinde grafikler burada görünecek</p>
            </div>
        );
    }

    return (
        <div className="bg-surface rounded-2xl shadow-sm border border-line overflow-hidden">
            <div className="p-5 border-b border-line">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h3 className="font-black text-ink flex items-center gap-2">
                            <TrendingUp size={18} className="text-brand" /> Net Gelişim Grafiği
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-ink-3">{examData.length} deneme analiz edildi</span>
                            <span className={`text-xs font-bold flex items-center gap-1 px-2 py-0.5 rounded-full ${trend.dir === 'up' ? 'bg-ok-soft text-ok' : trend.dir === 'down' ? 'bg-danger-soft text-danger' : 'bg-surface-3 text-ink-2'}`}>
                                {trend.dir === 'up' ? <ArrowUp size={10} /> : trend.dir === 'down' ? <ArrowDown size={10} /> : <Minus size={10} />}
                                {trend.val > 0 ? '+' : ''}{trend.val} net
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        {VIEWS.map(v => (
                            <button key={v.id} onClick={() => setView(v.id)}
                                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition ${view === v.id ? 'bg-brand text-ink' : 'bg-surface-3 text-ink-2 hover:bg-surface-3'}`}>
                                {v.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-5">
                {view === 'trend' && (
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--c1)" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="var(--c1)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)"  vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="net" stroke="var(--c1)" strokeWidth={3} fill="url(#netGrad)" name="Toplam Net" dot={{ fill: 'var(--c1)', r: 5 }} activeDot={{ r: 7 }}  animationDuration={300} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
                {view === 'score' && (
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--c4)" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="var(--c4)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)"  vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="score" stroke="var(--c4)" strokeWidth={3} fill="url(#scoreGrad)" name="Sınav Puanı" dot={{ fill: 'var(--c4)', r: 5 }} activeDot={{ r: 7 }}  animationDuration={300} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
                {view === 'delta' && (
                    deltaData.length < 2 ? (
                        <p className="text-center text-ink-3 py-16 text-sm">Değişim grafiği için en az 2 deneme gerekli</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={deltaData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)"  vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <ReferenceLine y={0} stroke="var(--line)" strokeWidth={2} />
                                <Bar dataKey="değişim" name="Net Değişimi" fill="var(--c1)" label={false}>
                                    {deltaData.map((d, i) => <Cell key={i} fill={d.değişim >= 0 ? 'var(--ok)' : 'var(--c5)'} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )
                )}
                {view === 'subject' && (
                    subjectData.length === 0 ? (
                        <p className="text-center text-ink-3 py-16 text-sm">TYT deneme verisi yok</p>
                    ) : (
                        <div className="space-y-4 py-2">
                            {subjectData.map(s => (
                                <div key={s.subject}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="font-bold text-ink-2">{s.subject}</span>
                                        <span className="font-black text-ink">{s.ort} <span className="text-ink-3 font-normal text-xs">/ {s.max}</span></span>
                                    </div>
                                    <div className="w-full bg-surface-3 rounded-full h-3 overflow-hidden">
                                        <div className="h-3 rounded-full transition-all duration-yavas" style={{ width: `${Math.min((s.ort / s.max) * 100, 100)}%`, backgroundColor: s.color }} />
                                    </div>
                                    <div className="text-right text-xs text-ink-3 mt-0.5">%{Math.round((s.ort / s.max) * 100)} doluluk</div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default NetProgressChart;
