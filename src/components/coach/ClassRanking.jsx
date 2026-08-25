/**
 * 📈 SINIF RANKLAMASI
 * Öğrencileri deneme netlerine göre otomatik sıralar
 */
import React, { useState, useMemo } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Medal, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { listeOku } from '../../services/veriDeposu';

const normTR = (str) => String(str || '').toLowerCase()
    .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ö/g, 'o').replace(/Ö/g, 'o')
    .replace(/ü/g, 'u').replace(/Ü/g, 'u').replace(/ş/g, 's').replace(/Ş/g, 's')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'g').replace(/ç/g, 'c').replace(/Ç/g, 'c').trim();

const MEDAL_COLORS = {
    1: { bg: 'bg-warn-soft', text: 'text-warn', border: 'border-warn', icon: '🥇' },
    2: { bg: 'bg-surface-3', text: 'text-ink-2', border: 'border-line-2', icon: '🥈' },
    3: { bg: 'bg-warn-soft', text: 'text-warn', border: 'border-warn', icon: '🥉' },
};

const ClassRanking = ({ students = [] }) => {
    const [search, setSearch] = useState('');
    const [sortField, setSortField] = useState('lastNet');
    const [sortDir, setSortDir] = useState('desc');
    const [examType, setExamType] = useState('all');

    const v2Results = useMemo(() => {
        try { return listeOku('v2_results_data'); } catch { return []; }
    }, []);

    const rankData = useMemo(() => {
        return students.map(student => {
            const sName = normTR(student.name);
            const matched = v2Results.filter(r => {
                const rName = normTR(r.student || '');
                return rName.includes(sName.split(' ')[0]) || sName.includes(rName.split(' ')[0]);
            }).filter(r => examType === 'all' || (r.examType || 'TYT') === examType);

            if (matched.length === 0) return { student, lastNet: null, avgNet: null, bestNet: null, trend: 'stable', examCount: 0 };

            const sorted = [...matched].sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0));
            const nets = sorted.map(r => parseFloat(r.totalNet || 0));
            const lastNet = nets[0];
            const avgNet = parseFloat((nets.reduce((a, b) => a + b, 0) / nets.length).toFixed(1));
            const bestNet = Math.max(...nets);
            let trend = 'stable';
            if (nets.length >= 2) {
                const diff = nets[0] - nets[1];
                if (diff > 1) trend = 'up';
                else if (diff < -1) trend = 'down';
            }
            return { student, lastNet, avgNet, bestNet, trend, examCount: matched.length };
        }).filter(d => d.lastNet !== null || d.examCount === 0);
    }, [students, v2Results, examType]);

    const sortedData = useMemo(() => {
        return [...rankData].sort((a, b) => {
            const aVal = a[sortField] ?? -1;
            const bVal = b[sortField] ?? -1;
            return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
        });
    }, [rankData, sortField, sortDir]);

    const filtered = sortedData.filter(d => !search || d.student.name.toLowerCase().includes(search.toLowerCase()));

    const toggleSort = (field) => {
        if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
        else { setSortField(field); setSortDir('desc'); }
    };

    const SortIcon = ({ field }) => {
        if (sortField !== field) return <ChevronUp size={12} className="text-ink-3" />;
        return sortDir === 'desc' ? <ChevronDown size={12} className="text-brand" /> : <ChevronUp size={12} className="text-brand" />;
    };

    const withData = filtered.filter(d => d.lastNet !== null);
    const noData = filtered.filter(d => d.lastNet === null);

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-xl font-black text-ink flex items-center gap-2">
                        <Trophy size={22} className="text-warn" /> Sınıf Sıralaması
                    </h2>
                    <p className="text-sm text-ink-3 mt-0.5">Deneme netleri bazında otomatik güncellenen sıralama</p>
                </div>
                <div className="flex items-center gap-2">
                    <select value={examType} onChange={e => setExamType(e.target.value)} className="text-sm border border-line rounded-xl px-3 py-2 bg-surface outline-none">
                        <option value="all">Tüm Denemeler</option>
                        <option value="TYT">Sadece TYT</option>
                        <option value="AYT">Sadece AYT</option>
                    </select>
                </div>
            </div>

            {/* Podyum - Top 3 */}
            {withData.length >= 3 && (
                <div className="grid grid-cols-3 gap-3">
                    {[1, 0, 2].map((rank, pos) => {
                        const d = withData[rank];
                        if (!d) return null;
                        const medal = MEDAL_COLORS[rank + 1];
                        const heights = ['h-24', 'h-32', 'h-20'];
                        return (
                            <div key={d.student.id} className={`${medal.bg} border-2 ${medal.border} rounded-2xl p-4 text-center flex flex-col items-center justify-end ${heights[pos]} relative transition-all hover:shadow-md`}>
                                <span className="text-2xl mb-1">{medal.icon}</span>
                                <p className={`font-black text-sm ${medal.text} truncate max-w-full px-2`}>{d.student.name.split(' ')[0]}</p>
                                <p className={`text-lg font-black ${medal.text}`}>{d.lastNet?.toFixed(1)}</p>
                                <p className="text-xs opacity-60">net</p>
                                {pos === 1 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-ink text-xs font-black px-2.5 py-1 rounded-full shadow">🏆 1.</div>}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Arama */}
            <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-ink-3" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Öğrenci ara..."
                    className="pl-9 pr-3 py-2 w-full text-sm border border-line rounded-xl outline-none focus:ring-2 focus:ring-brand" />
            </div>

            {/* Tablo */}
            <div className="bg-surface rounded-2xl shadow-sm border border-line overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-surface-2 border-b border-line">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-3 uppercase tracking-wider w-12">Sıra</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-3 uppercase tracking-wider">Öğrenci</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-ink-3 uppercase tracking-wider cursor-pointer hover:text-brand" onClick={() => toggleSort('lastNet')}>
                                    <span className="flex items-center justify-center gap-1">Son Net <SortIcon field="lastNet" /></span>
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-ink-3 uppercase tracking-wider cursor-pointer hover:text-brand hidden sm:table-cell" onClick={() => toggleSort('avgNet')}>
                                    <span className="flex items-center justify-center gap-1">Ort. Net <SortIcon field="avgNet" /></span>
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-ink-3 uppercase tracking-wider hidden md:table-cell cursor-pointer hover:text-brand" onClick={() => toggleSort('bestNet')}>
                                    <span className="flex items-center justify-center gap-1">En Yüksek <SortIcon field="bestNet" /></span>
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-ink-3 uppercase tracking-wider">Trend</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {withData.map((d, idx) => {
                                const rank = idx + 1;
                                const medal = MEDAL_COLORS[rank];
                                return (
                                    <tr key={d.student.id} className="hover:bg-brand-soft/20 transition-colors group">
                                        <td className="px-4 py-3">
                                            {medal ? (
                                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-lg ${medal.bg} font-black`}>{medal.icon}</span>
                                            ) : (
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-surface-3 text-sm font-black text-ink-2">{rank}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="on-color w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-ink flex items-center justify-center font-black text-sm flex-shrink-0">
                                                    {d.student.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-ink text-sm">{d.student.name}</p>
                                                    <p className="text-xs text-ink-3">{d.examCount} deneme</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-block font-black text-base ${rank <= 3 ? 'text-brand' : 'text-ink'}`}>
                                                {d.lastNet?.toFixed(1)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                                            <span className="text-sm font-bold text-ink-2">{d.avgNet?.toFixed(1) ?? '-'}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center hidden md:table-cell">
                                            <span className="text-sm font-bold text-ink-2">{d.bestNet?.toFixed(1) ?? '-'}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {d.trend === 'up' && <TrendingUp size={18} className="text-ok mx-auto" />}
                                            {d.trend === 'down' && <TrendingDown size={18} className="text-danger mx-auto" />}
                                            {d.trend === 'stable' && <Minus size={18} className="text-ink-3 mx-auto" />}
                                        </td>
                                    </tr>
                                );
                            })}
                            {noData.map(d => (
                                <tr key={d.student.id} className="opacity-40">
                                    <td className="px-4 py-3"><span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-surface-3 text-xs font-black text-ink-3">-</span></td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-surface-3 text-ink-3 flex items-center justify-center font-black text-sm flex-shrink-0">{d.student.name?.charAt(0)?.toUpperCase()}</div>
                                            <p className="font-bold text-ink-2 text-sm">{d.student.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center text-ink-3 text-sm">-</td>
                                    <td className="px-4 py-3 text-center text-ink-3 text-sm hidden sm:table-cell">-</td>
                                    <td className="px-4 py-3 text-center text-ink-3 text-sm hidden md:table-cell">-</td>
                                    <td className="px-4 py-3 text-center"><Minus size={16} className="text-ink-3 mx-auto" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && (
                    <div className="py-16 text-center">
                        <Trophy size={48} className="text-ink-3 mx-auto mb-3" />
                        <p className="font-bold text-ink-3">Sıralama verisi bulunamadı</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClassRanking;
