/**
 * 📈 SINAV KARŞILAŞTIRMA MATRİSİ (Madde 11)
 * Öğrencinin TYT/AYT denemelerini ders bazında çok çizgili trend grafik
 */
import React, { useState, useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart2, Activity, Layers, Filter } from 'lucide-react';

const SUBJECTS = {
    tur:  { label: 'Türkçe',     color: 'var(--info)', type: 'tyt' },
    mat:  { label: 'Matematik',  color: 'var(--c4)', type: 'both' },
    fen:  { label: 'Fen Bil.',   color: 'var(--ok)', type: 'tyt' },
    sos:  { label: 'Sosyal',     color: 'var(--warn)', type: 'tyt' },
    fiz:  { label: 'Fizik',      color: 'var(--c1)', type: 'ayt' },
    kim:  { label: 'Kimya',      color: 'var(--c5)', type: 'ayt' },
    bio:  { label: 'Biyoloji',   color: 'var(--c2)', type: 'ayt' },
    tar:  { label: 'Tarih',      color: 'var(--warn)', type: 'ayt' },
    cog:  { label: 'Coğrafya',   color: 'var(--c2)', type: 'ayt' },
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-surface border border-line rounded-2xl shadow-xl p-3 max-w-xs">
            <p className="font-black text-ink text-sm mb-2 border-b pb-1">{label}</p>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                    <span className="text-ink-2 flex-1">{p.name}</span>
                    <span className="font-black" style={{ color: p.color }}>{p.value?.toFixed(1)}</span>
                </div>
            ))}
        </div>
    );
};

const ExamComparisonMatrix = ({ examResults = [], studentName = '' }) => {
    const [chartType, setChartType] = useState('line');
    const [selectedSubjects, setSelectedSubjects] = useState(['tur', 'mat', 'fen', 'sos']);
    const [examTypeFilter, setExamTypeFilter] = useState('all');

    const sortedExams = useMemo(() =>
        [...examResults]
            .filter(r => examTypeFilter === 'all' || r.type === examTypeFilter || !r.type)
            .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
    , [examResults, examTypeFilter]);

    const chartData = useMemo(() =>
        sortedExams.map((r, i) => {
            const point = { name: r.name || `D${i + 1}`, date: r.date };
            Object.keys(SUBJECTS).forEach(key => {
                const val = parseFloat(r[key + '_net'] || r[key] || 0);
                if (!isNaN(val)) point[key] = val;
            });
            point.total = parseFloat(r.totalNet || 0);
            return point;
        })
    , [sortedExams]);

    const radarData = useMemo(() => {
        if (sortedExams.length === 0) return [];
        const last = sortedExams[sortedExams.length - 1];
        const first = sortedExams[0];
        return Object.entries(SUBJECTS).map(([key, { label }]) => ({
            subject: label,
            last: parseFloat(last[key + '_net'] || last[key] || 0),
            first: sortedExams.length > 1 ? parseFloat(first[key + '_net'] || first[key] || 0) : null,
            fullMark: 20,
        }));
    }, [sortedExams]);

    // İstatistikler
    const stats = useMemo(() => {
        if (sortedExams.length < 2) return null;
        const first = sortedExams[0], last = sortedExams[sortedExams.length - 1];
        const bestSubjects = Object.entries(SUBJECTS).map(([key, { label, color }]) => ({
            key, label, color,
            change: (parseFloat(last[key + '_net'] || 0) - parseFloat(first[key + '_net'] || 0)).toFixed(1),
        })).sort((a, b) => b.change - a.change);
        return {
            totalChange: (parseFloat(last.totalNet || 0) - parseFloat(first.totalNet || 0)).toFixed(1),
            bestImprovement: bestSubjects[0],
            worstChange: bestSubjects[bestSubjects.length - 1],
            avgNet: (sortedExams.reduce((s, r) => s + parseFloat(r.totalNet || 0), 0) / sortedExams.length).toFixed(1),
        };
    }, [sortedExams]);

    const toggleSubject = (key) => {
        setSelectedSubjects(prev =>
            prev.includes(key) ? prev.length > 1 ? prev.filter(s => s !== key) : prev : [...prev, key]
        );
    };

    if (examResults.length === 0) {
        return (
            <div className="text-center py-14 text-ink-3">
                <BarChart2 size={40} className="mx-auto mb-3 opacity-30"  animationDuration={300} />
                <p className="font-bold text-ink-2">Deneme Sonucu Yok</p>
                <p className="text-sm mt-1">Deneme sonuçları yüklendiğinde karşılaştırma burada görünür.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* İstatistik Kartları */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-surface border border-line rounded-2xl p-4 shadow-sm text-center">
                        <p className={`text-3xl font-black ${parseFloat(stats.totalChange) > 0 ? 'text-ok' : parseFloat(stats.totalChange) < 0 ? 'text-danger' : 'text-ink-2'}`}>
                            {parseFloat(stats.totalChange) > 0 ? '+' : ''}{stats.totalChange}
                        </p>
                        <p className="text-xs text-ink-2 font-medium mt-1">Net Gelişim</p>
                    </div>
                    <div className="bg-surface border border-line rounded-2xl p-4 shadow-sm text-center">
                        <p className="text-3xl font-black text-brand">{stats.avgNet}</p>
                        <p className="text-xs text-ink-2 font-medium mt-1">Ortalama Net</p>
                    </div>
                    {stats.bestImprovement && (
                        <div className="bg-ok-soft border border-ok rounded-2xl p-4 shadow-sm text-center">
                            <p className="text-lg font-black text-ok">+{Math.max(0, parseFloat(stats.bestImprovement.change)).toFixed(1)}</p>
                            <p className="text-xs text-ok font-bold mt-1">📈 {stats.bestImprovement.label}</p>
                        </div>
                    )}
                    {stats.worstChange && (
                        <div className="bg-danger-soft border border-danger rounded-2xl p-4 shadow-sm text-center">
                            <p className="text-lg font-black text-danger">{stats.worstChange.change}</p>
                            <p className="text-xs text-danger font-bold mt-1">📉 {stats.worstChange.label}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Grafik Tipi & Filtreler */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex gap-1 bg-surface-3 p-1 rounded-xl">
                    {[['line', <Activity size={14} />, 'Trend'], ['bar', <BarChart2 size={14}  animationDuration={300} />, 'Sütun'], ['radar', <Layers size={14} />, 'Radar']].map(([type, icon, label]) => (
                        <button
                            key={type}
                            onClick={() => setChartType(type)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${chartType === type ? 'bg-surface text-brand shadow' : 'text-ink-2 hover:text-ink-2'}`}
                        >
                            {icon} {label}
                        </button>
                    ))}
                </div>
                <div className="flex gap-1 bg-surface-3 p-1 rounded-xl">
                    {[['all', 'Tümü'], ['tyt', 'TYT'], ['ayt', 'AYT']].map(([val, lbl]) => (
                        <button
                            key={val}
                            onClick={() => setExamTypeFilter(val)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${examTypeFilter === val ? 'bg-surface text-brand shadow' : 'text-ink-2 hover:text-ink-2'}`}
                        >
                            {lbl}
                        </button>
                    ))}
                </div>
            </div>

            {/* Ders Seçici */}
            {chartType !== 'radar' && (
                <div className="flex flex-wrap gap-1.5">
                    {Object.entries(SUBJECTS).map(([key, { label, color }]) => (
                        <button
                            key={key}
                            onClick={() => toggleSubject(key)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border-2 transition ${selectedSubjects.includes(key)
                                ? 'shadow'
                                : 'bg-surface text-ink-2 border-line hover:border-line-2'
                            }`}
                            /* Seçili çip dolu renk yerine yumuşak zemin + renkli
                               yazı kullanır; dolu zeminde koyu yazı okunmuyordu
                               ve renk her iki temada aynı kalmıyordu. */
                            style={selectedSubjects.includes(key)
                                ? {
                                    background: `color-mix(in srgb, ${color} 16%, var(--surface))`,
                                    borderColor: color,
                                    color,
                                }
                                : {}}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}

            {/* Grafik */}
            <div className="bg-surface border border-line rounded-2xl p-4 shadow-sm">
                {chartData.length < 2 ? (
                    <div className="text-center py-10 text-ink-3">
                        <p className="text-sm">En az 2 deneme sonucu gereklidir</p>
                    </div>
                ) : chartType === 'line' ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)"  vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            {selectedSubjects.map(key => (
                                <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    name={SUBJECTS[key]?.label}
                                    stroke={SUBJECTS[key]?.color}
                                    strokeWidth={2.5}
                                    dot={{ fill: SUBJECTS[key]?.color, strokeWidth: 0, r: 4 }}
                                    activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                                 animationDuration={300} />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                ) : chartType === 'bar' ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)"  vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            {selectedSubjects.map(key => (
                                <Bar key={key} dataKey={key} name={SUBJECTS[key]?.label} fill={SUBJECTS[key]?.color} radius={[3, 3, 0, 0]}  animationDuration={300} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="var(--line)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6b7280' }} />
                            <Radar name="Son Deneme" dataKey="last" stroke="var(--c1)" fill="var(--c1)" fillOpacity={0.3} strokeWidth={2}  animationDuration={300} />
                            {radarData[0]?.first !== null && (
                                <Radar name="İlk Deneme" dataKey="first" stroke="var(--ink-3)" fill="var(--ink-3)" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 4"  animationDuration={300} />
                            )}
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                        </RadarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Ders Bazlı Değişim Tablosu */}
            {sortedExams.length >= 2 && (
                <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 bg-surface-2 border-b border-line">
                        <p className="font-bold text-ink-2 text-sm">Ders Bazlı İlerleme (İlk → Son)</p>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {Object.entries(SUBJECTS).map(([key, { label, color }]) => {
                            const first = parseFloat(sortedExams[0][key + '_net'] || sortedExams[0][key] || 0);
                            const last = parseFloat(sortedExams[sortedExams.length - 1][key + '_net'] || sortedExams[sortedExams.length - 1][key] || 0);
                            const change = (last - first).toFixed(1);
                            const changeNum = parseFloat(change);
                            if (first === 0 && last === 0) return null;
                            return (
                                <div key={key} className="flex items-center justify-between px-4 py-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                                        <span className="text-sm font-medium text-ink-2">{label}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-ink-3">{first.toFixed(1)} → {last.toFixed(1)}</span>
                                        <span className={`text-sm font-black w-12 text-right ${changeNum > 0 ? 'text-ok' : changeNum < 0 ? 'text-danger' : 'text-ink-3'}`}>
                                            {changeNum > 0 ? '+' : ''}{change}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExamComparisonMatrix;
