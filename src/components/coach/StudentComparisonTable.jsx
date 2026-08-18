import React, { useState, useMemo } from 'react';
import {
    BarChart2, TrendingUp, TrendingDown, ArrowUpDown,
    Trophy, Target, Star, Flame, CheckCircle, AlertCircle,
    ChevronUp, ChevronDown, Minus, Search, Filter
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { listeOku, nesneOku } from '../../services/veriDeposu';

// ─── Yardımcı: v2 sonuçlarından öğrenci statsları hesapla ────
const buildStudentStats = (students) => {
    const results = listeOku('v2_results_data');
    const tasks = nesneOku('student_tasks');

    const normTR = (s) => String(s || '').toLowerCase()
        .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ş/g, 's').replace(/Ş/g, 's')
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'g').replace(/ü/g, 'u').replace(/ç/g, 'c').trim();

    return students.map(s => {
        const sName = normTR(s.name);
        const myExams = results.filter(r => {
            const rn = normTR(r.student);
            return rn === sName || rn.includes(sName) || sName.includes(rn);
        }).sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));

        const nets = myExams.map(e => parseFloat(e.totalNet) || 0);
        const avgNet = nets.length ? nets.reduce((a, b) => a + b, 0) / nets.length : 0;
        const maxNet = nets.length ? Math.max(...nets) : 0;
        const lastNet = nets.length ? nets[nets.length - 1] : 0;
        const prevNet = nets.length >= 2 ? nets[nets.length - 2] : lastNet;
        const trend = lastNet - prevNet;

        // Görev
        const myTasks = tasks[String(s.id)] || [];
        const done = myTasks.filter(t => t.completed || t.status === 'Tamamlandı').length;
        const taskRate = myTasks.length > 0 ? Math.round((done / myTasks.length) * 100) : 0;

        return {
            ...s,
            avgNet: parseFloat(avgNet.toFixed(1)),
            maxNet: parseFloat(maxNet.toFixed(1)),
            lastNet: parseFloat(lastNet.toFixed(1)),
            trend: parseFloat(trend.toFixed(1)),
            examCount: myExams.length,
            taskRate,
            taskCount: myTasks.length,
        };
    });
};

// ─── Sıralama başlığı ────────────────────────────────────────
const SortHeader = ({ label, field, sortBy, sortDir, onSort }) => (
    <button
        onClick={() => onSort(field)}
        className={`flex items-center gap-1 font-bold text-xs uppercase tracking-wide transition whitespace-nowrap ${sortBy === field ? 'text-brand' : 'text-ink-2 hover:text-ink-2'}`}
    >
        {label}
        {sortBy === field
            ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
            : <ArrowUpDown size={10} className="opacity-40" />}
    </button>
);

// ─── Trend Badge ─────────────────────────────────────────────
const TrendBadge = ({ value }) => {
    if (Math.abs(value) < 0.5) return <span className="text-xs text-ink-3 font-bold flex items-center gap-0.5"><Minus size={10} />—</span>;
    if (value > 0) return <span className="text-xs text-ok font-black flex items-center gap-0.5"><TrendingUp size={10} />+{value}</span>;
    return <span className="text-xs text-danger font-black flex items-center gap-0.5"><TrendingDown size={10} />{value}</span>;
};

// ─── Bar Chart özel Tooltip ──────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-surface rounded-xl shadow-xl border border-line px-4 py-3 text-xs">
            <p className="font-black text-ink mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.fill }} className="font-bold">{p.name}: {p.value.toFixed(1)}</p>
            ))}
        </div>
    );
};

// ─── Renkler ─────────────────────────────────────────────────
const RANK_COLORS = ['var(--warn)', 'var(--ink-3)', '#b87333'];
const getBarColor = (val, max) => {
    const pct = max > 0 ? val / max : 0;
    if (pct >= 0.8) return 'var(--ok)';
    if (pct >= 0.5) return 'var(--c1)';
    if (pct >= 0.3) return 'var(--warn)';
    return 'var(--danger)';
};

// ─── Ana Bileşen ─────────────────────────────────────────────
const StudentComparisonTable = ({ students = [] }) => {
    const [sortBy, setSortBy] = useState('lastNet');
    const [sortDir, setSortDir] = useState('desc');
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('table'); // table | chart

    const data = useMemo(() => buildStudentStats(students), [students]);

    const handleSort = (field) => {
        if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(field); setSortDir('desc'); }
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return data
            .filter(s => !q || s.name?.toLowerCase().includes(q) || String(s.schoolNumber).includes(q))
            .sort((a, b) => {
                const av = a[sortBy] ?? 0, bv = b[sortBy] ?? 0;
                return sortDir === 'asc' ? av - bv : bv - av;
            });
    }, [data, sortBy, sortDir, search]);

    const maxNet = Math.max(...filtered.map(s => s.avgNet), 1);
    const chartData = filtered.slice(0, 15).map(s => ({
        name: s.name?.split(' ')[0] || '?',
        fullName: s.name,
        'Son Net': s.lastNet,
        'Ort. Net': s.avgNet,
        'Maks Net': s.maxNet,
    }));

    // Üst istatistikler
    const top = [...filtered].sort((a, b) => b.lastNet - a.lastNet)[0];
    const mostImproved = [...filtered].sort((a, b) => b.trend - a.trend)[0];
    const bestTask = [...filtered].sort((a, b) => b.taskRate - a.taskRate)[0];

    return (
        <div className="space-y-6">
            {/* Üst Şampiyonlar */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: '🥇 En Yüksek Net', student: top, value: top ? `${top.lastNet} net` : '-', sub: 'son denemede', color: 'from-yellow-400 to-amber-500' },
                    { label: '📈 En Çok Gelişen', student: mostImproved, value: mostImproved ? `+${mostImproved.trend} net` : '-', sub: 'son 2 deneme arası', color: 'from-green-400 to-emerald-500' },
                    { label: '✅ En Çalışkan', student: bestTask, value: bestTask ? `%${bestTask.taskRate}` : '-', sub: 'görev tamamlama', color: 'from-indigo-400 to-blue-500' },
                ].map((card) => (
                    <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-2xl p-4 text-ink shadow-lg`}>
                        <p className="text-xs font-bold opacity-80 mb-2">{card.label}</p>
                        <p className="font-black text-sm truncate">{card.student?.name || '—'}</p>
                        <p className="text-xl font-black mt-1">{card.value}</p>
                        <p className="text-xs opacity-70 mt-0.5">{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* Kontroller */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-40 relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Öğrenci ara..."
                        className="w-full pl-8 pr-3 py-2 text-sm border border-line rounded-xl focus:ring-2 focus:ring-brand outline-none"
                    />
                </div>
                <div className="flex rounded-xl border border-line overflow-hidden">
                    <button onClick={() => setViewMode('table')} className={`px-4 py-2 text-xs font-bold transition ${viewMode === 'table' ? 'bg-brand text-ink' : 'text-ink-2 hover:bg-surface-2'}`}>
                        Tablo
                    </button>
                    <button onClick={() => setViewMode('chart')} className={`px-4 py-2 text-xs font-bold transition ${viewMode === 'chart' ? 'bg-brand text-ink' : 'text-ink-2 hover:bg-surface-2'}`}>
                        Grafik
                    </button>
                </div>
                <span className="text-xs text-ink-3 font-medium">{filtered.length} öğrenci</span>
            </div>

            {/* TABLO görünümü */}
            {viewMode === 'table' && (
                <div className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-surface-2 border-b border-line">
                            <tr>
                                <th className="px-4 py-3 text-left">
                                    <span className="text-xs font-bold text-ink-3 uppercase">Sıra</span>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <span className="text-xs font-bold text-ink-3 uppercase">Öğrenci</span>
                                </th>
                                <th className="px-3 py-3 text-center">
                                    <SortHeader label="Son Net" field="lastNet" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                                </th>
                                <th className="px-3 py-3 text-center">
                                    <SortHeader label="Ort. Net" field="avgNet" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                                </th>
                                <th className="px-3 py-3 text-center hidden sm:table-cell">
                                    <SortHeader label="Maks Net" field="maxNet" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                                </th>
                                <th className="px-3 py-3 text-center hidden sm:table-cell">
                                    <SortHeader label="Trend" field="trend" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                                </th>
                                <th className="px-3 py-3 text-center hidden md:table-cell">
                                    <SortHeader label="Deneme" field="examCount" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                                </th>
                                <th className="px-3 py-3 text-center hidden md:table-cell">
                                    <SortHeader label="Görev %" field="taskRate" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((s, idx) => (
                                <tr key={s.id} className="hover:bg-brand-soft/50 transition group">
                                    <td className="px-4 py-3">
                                        {idx < 3 ? (
                                            <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-ink text-xs shadow"
                                                style={{ background: `linear-gradient(135deg, ${RANK_COLORS[idx]}, ${RANK_COLORS[idx]}99)` }}>
                                                {idx + 1}
                                            </div>
                                        ) : (
                                            <span className="text-sm font-bold text-ink-3 pl-1.5">{idx + 1}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="on-color w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-ink font-black text-xs shadow-sm">
                                                {s.name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-ink text-sm leading-tight">{s.name}</p>
                                                <p className="text-xs text-ink-3">{s.grade || ''} {s.section || ''}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        <span className="font-black text-ink text-sm">{s.lastNet || '—'}</span>
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        <div className="flex flex-col items-center gap-0.5">
                                            <span className="font-bold text-ink-2 text-sm">{s.avgNet || '—'}</span>
                                            <div className="w-16 bg-surface-3 rounded-full h-1 overflow-hidden">
                                                <div className="h-full rounded-full transition-all"
                                                    style={{ width: `${(s.avgNet / maxNet) * 100}%`, background: getBarColor(s.avgNet, maxNet) }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 text-center hidden sm:table-cell">
                                        <span className="font-bold text-brand text-sm">{s.maxNet || '—'}</span>
                                    </td>
                                    <td className="px-3 py-3 text-center hidden sm:table-cell">
                                        <TrendBadge value={s.trend} />
                                    </td>
                                    <td className="px-3 py-3 text-center hidden md:table-cell">
                                        <span className="text-sm font-bold text-ink-2">{s.examCount}</span>
                                    </td>
                                    <td className="px-3 py-3 text-center hidden md:table-cell">
                                        <div className="flex flex-col items-center gap-0.5">
                                            <span className={`text-sm font-black ${s.taskRate >= 70 ? 'text-ok' : s.taskRate >= 40 ? 'text-warn' : 'text-danger'}`}>
                                                %{s.taskRate}
                                            </span>
                                            <span className="text-xs text-ink-3">{s.taskCount} görev</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filtered.length === 0 && (
                        <div className="text-center py-12 text-ink-3">
                            <BarChart2 size={36} className="mx-auto mb-2 opacity-30"  animationDuration={300} />
                            <p className="text-sm">Eşleşen öğrenci bulunamadı</p>
                        </div>
                    )}
                </div>
            )}

            {/* GRAFİK görünümü */}
            {viewMode === 'chart' && (
                <div className="bg-surface rounded-2xl border border-line shadow-sm p-6">
                    <h3 className="font-black text-ink mb-4 text-sm flex items-center gap-2">
                        <BarChart2 size={16} className="text-brand"  animationDuration={300} />
                        Net Karşılaştırma (İlk 15)
                    </h3>
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"  vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} angle={-35} textAnchor="end" interval={0} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="Son Net" radius={[4, 4, 0, 0]} fill="var(--c1)">
                                {chartData.map((entry, i) => (
                                    <Cell key={i} fill={getBarColor(entry['Son Net'], Math.max(...chartData.map(d => d['Son Net']), 1))} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default StudentComparisonTable;
