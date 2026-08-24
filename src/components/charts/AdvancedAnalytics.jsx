import React, { useState, useMemo } from 'react';
import {
    LineChart, Line, BarChart, Bar, RadarChart, Radar,
    PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, Area, AreaChart, ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, Target, BarChart2, Activity, Award, ChevronDown } from 'lucide-react';

// ── Özel Tooltip ──────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-surface rounded-xl shadow-xl border border-line px-4 py-3 text-sm">
            <p className="font-bold text-ink mb-2">{label}</p>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-ink-2">{p.name}:</span>
                    <span className="font-black text-ink">{Number(p.value).toFixed(1)}</span>
                </div>
            ))}
        </div>
    );
};

// ── Net Trend Grafiği ─────────────────────────────────────────────
const NetTrendChart = ({ examData }) => {
    const [period, setPeriod] = useState('all');

    const data = useMemo(() => {
        let filtered = [...examData].sort((a, b) => new Date(a.date) - new Date(b.date));
        if (period === 'last5') filtered = filtered.slice(-5);
        if (period === 'last10') filtered = filtered.slice(-10);
        return filtered.map((e, i) => ({
            name: e.name?.substring(0, 12) || `Deneme ${i + 1}`,
            net: Number(e.totalNet || 0).toFixed(1),
            type: e.examType || 'TYT',
        }));
    }, [examData, period]);

    if (!data.length) return (
        <div className="flex items-center justify-center h-48 text-ink-3">
            <div className="text-center"><BarChart2 size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Deneme verisi yok</p></div>
        </div>
    );

    const avg = data.reduce((s, d) => s + Number(d.net), 0) / data.length;
    const last = Number(data[data.length - 1]?.net || 0);
    const trend = last > avg;

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-bold text-ink flex items-center gap-2">
                        {trend
                            ? <TrendingUp size={16} className="text-ok" />
                            : <TrendingDown size={16} className="text-danger" />
                        }
                        Net Gelişim Trendi
                    </h3>
                    <p className="text-xs text-ink-2 mt-0.5">Ortalama: <strong>{avg.toFixed(1)}</strong> · Son: <strong className={trend ? 'text-ok' : 'text-danger'}>{last}</strong></p>
                </div>
                <div className="flex gap-1">
                    {[['all', 'Tümü'], ['last5', 'Son 5'], ['last10', 'Son 10']].map(([v, l]) => (
                        <button key={v} onClick={() => setPeriod(v)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${period === v ? 'bg-brand text-ink' : 'bg-surface-3 text-ink-2 hover:bg-surface-3'}`}
                        >{l}</button>
                    ))}
                </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--c1)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--c1)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)"  vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={avg} stroke="var(--warn)" strokeDasharray="4 4" label={{ value: 'Ort', fontSize: 10, fill: 'var(--warn)' }} />
                    <Area type="monotone" dataKey="net" name="Net" stroke="var(--c1)" strokeWidth={2.5} fill="url(#netGrad)" dot={{ fill: 'var(--c1)', r: 4 }} activeDot={{ r: 6 }}  animationDuration={300} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

// ── TYT Ders Karşılaştırması ──────────────────────────────────────
const SubjectBarChart = ({ examData }) => {
    const data = useMemo(() => {
        const latest = [...examData].filter(e => e.examType !== 'AYT').slice(-3);
        if (!latest.length) return [];
        const subjects = { 'Türkçe': 'turkce', 'Matematik': 'mat', 'Fen': 'fen', 'Sosyal': 'sosyal' };
        return Object.entries(subjects).map(([name, key]) => {
            const vals = latest.map(e => {
                if (e[key] != null) return Number(e[key]);
                if (e.subjects?.[key]) {
                    const v = e.subjects[key];
                    return typeof v === 'object' ? Number(v.net) || 0 : Number(v) || 0;
                }
                return 0;
            });
            const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
            return { name, ortalama: Number(avg.toFixed(1)) };
        });
    }, [examData]);

    const COLORS = ['var(--c1)', 'var(--c4)', 'var(--info)', 'var(--ok)'];

    return (
        <div>
            <h3 className="font-bold text-ink mb-4 flex items-center gap-2">
                <Activity size={16} className="text-brand" />
                Ders Bazlı Başarı (Son 3 TYT Ortalaması)
            </h3>
            {!data.length ? (
                <div className="flex items-center justify-center h-40 text-ink-3 text-sm">TYT verisi bulunamadı</div>
            ) : (
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={data} barSize={36}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        {data.map((d, i) => (
                            <Bar key={d.name} dataKey="ortalama" name="Ortalama Net" fill={COLORS[i % COLORS.length]} radius={[6, 6, 0, 0]}  animationDuration={300} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

// ── Radar Performans ─────────────────────────────────────────────
const SubjectRadar = ({ examData }) => {
    const data = useMemo(() => {
        const tyt = examData.filter(e => e.examType !== 'AYT');
        if (!tyt.length) return [];
        const maxes = { 'Türkçe': 40, 'Matematik': 40, 'Fen': 20, 'Sosyal': 20 };
        const keys = { 'Türkçe': 'turkce', 'Matematik': 'mat', 'Fen': 'fen', 'Sosyal': 'sosyal' };

        return Object.entries(keys).map(([name, key]) => {
            const nets = tyt.map(e => {
                if (e[key] != null) return Number(e[key]);
                const s = e.subjects?.[key];
                return s ? (typeof s === 'object' ? Number(s.net) || 0 : Number(s) || 0) : 0;
            });
            const avg = nets.filter(n => n > 0).reduce((s, n) => s + n, 0) / (nets.filter(n => n > 0).length || 1);
            const maxNet = maxes[name];
            return { subject: name, current: Math.round((avg / maxNet) * 100), fullMark: 100 };
        });
    }, [examData]);

    return (
        <div>
            <h3 className="font-bold text-ink mb-4 flex items-center gap-2">
                <Target size={16} className="text-c4" />
                Konu Başarı Haritası
            </h3>
            {!data.length ? (
                <div className="flex items-center justify-center h-40 text-ink-3 text-sm">Yeterli veri yok</div>
            ) : (
                <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={data}>
                        <PolarGrid stroke="var(--line)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#9ca3af' }} />
                        <Radar name="Başarı %" dataKey="current" stroke="var(--c4)" fill="var(--c4)" fillOpacity={0.4} strokeWidth={2}  animationDuration={300} />
                        <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

// ── İstatistik Kartları ────────────────────────────────────────────
const StatCards = ({ examData }) => {
    if (!examData.length) return null;
    const nets = examData.map(e => Number(e.totalNet || 0));
    const max = Math.max(...nets);
    const min = Math.min(...nets);
    const avg = nets.reduce((s, n) => s + n, 0) / nets.length;
    const last = nets[nets.length - 1];
    const trend = last > avg ? '+' : '';
    const trendPct = avg > 0 ? ((last - avg) / avg * 100).toFixed(0) : 0;

    const stats = [
        { label: 'En Yüksek Net', value: max.toFixed(1), color: 'emerald', icon: Award },
        { label: 'Son Deneme', value: last.toFixed(1), color: 'indigo', icon: Activity, sub: `${trend}${trendPct}% ort.` },
        { label: 'Ortalama Net', value: avg.toFixed(1), color: 'violet', icon: BarChart2 },
        { label: 'Toplam Deneme', value: examData.length, color: 'blue', icon: Target },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {stats.map((s, i) => (
                <div key={i} className={`bg-${s.color}-50 rounded-2xl p-4 border border-${s.color}-100`}>
                    <div className={`flex items-center gap-1.5 text-${s.color}-600 mb-2`}>
                        <s.icon size={14} />
                        <span className="text-xs font-bold uppercase opacity-70">{s.label}</span>
                    </div>
                    <div className={`text-2xl font-black text-${s.color}-700`}>{s.value}</div>
                    {s.sub && <div className={`text-xs text-${s.color}-500 mt-0.5`}>{s.sub}</div>}
                </div>
            ))}
        </div>
    );
};

// ── Ana Analitik Paneli ───────────────────────────────────────────
const AdvancedAnalytics = ({ examData = [] }) => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-ink flex items-center gap-2">
                    <TrendingUp size={24} className="text-brand" />
                    Gelişmiş Analitik
                </h1>
                <span className="text-xs text-ink-3 bg-surface-3 px-3 py-1 rounded-full">
                    {examData.length} deneme verisi
                </span>
            </div>

            {/* İstatistik kartları */}
            <StatCards examData={examData} />

            {/* Ana grafikler */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Net trend */}
                <div className="bg-surface rounded-2xl p-5 shadow-sm border border-line">
                    <NetTrendChart examData={examData} />
                </div>

                {/* Ders bar */}
                <div className="bg-surface rounded-2xl p-5 shadow-sm border border-line">
                    <SubjectBarChart examData={examData} />
                </div>
            </div>

            {/* Radar */}
            <div className="bg-surface rounded-2xl p-5 shadow-sm border border-line max-w-lg mx-auto">
                <SubjectRadar examData={examData} />
            </div>

            {examData.length === 0 && (
                <div className="bg-surface rounded-2xl p-16 text-center shadow-sm border border-line">
                    <BarChart2 size={48} className="mx-auto mb-4 text-ink-3" />
                    <h3 className="font-bold text-ink-2 text-lg mb-2">Henüz analiz verisi yok</h3>
                    <p className="text-ink-3 text-sm">Koçun deneme sonuçlarını yüklediğinde burada görünecek.</p>
                </div>
            )}
        </div>
    );
};

export default AdvancedAnalytics;
