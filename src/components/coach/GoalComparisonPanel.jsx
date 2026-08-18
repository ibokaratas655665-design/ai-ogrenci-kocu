/**
 * 🎯 HEDEF KARŞILAŞTIRMA PANELİ - Koç için
 * Öğrencilerin hedef netleri ile gerçek performansını karşılaştırır
 */
import React, { useState, useMemo } from 'react';
import { Target, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Search, Trophy, AlertTriangle } from 'lucide-react';
import { listeOku, nesneOku } from '../../services/veriDeposu';

const normTR = (str) => String(str || '').toLowerCase()
    .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ö/g, 'o').replace(/Ö/g, 'o')
    .replace(/ü/g, 'u').replace(/Ü/g, 'u').replace(/ş/g, 's').replace(/Ş/g, 's')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'g').replace(/ç/g, 'c').replace(/Ç/g, 'c').trim();

const TYT_SUBJECTS = [
    { key: 'turkce', label: 'Türkçe', max: 40 },
    { key: 'matematik', label: 'Matematik', max: 40 },
    { key: 'fen', label: 'Fen', max: 20 },
    { key: 'sosyal', label: 'Sosyal', max: 20 },
];

const GoalComparisonPanel = ({ students = [] }) => {
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('gap'); // gap | name | actual
    const [expandedId, setExpandedId] = useState(null);

    const v2Results = useMemo(() => {
        try { return listeOku('v2_results_data'); } catch { return []; }
    }, []);

    // Her öğrenci için: hedef net, gerçek son net, fark
    const data = useMemo(() => {
        return students.map(student => {
            const LS_KEY = `goals_${student.id}`;
            let goalTYT = {};
            let targetUniv = '';
            try {
                goalTYT = nesneOku(LS_KEY + '_tyt');
                targetUniv = localStorage.getItem(LS_KEY + '_univ') || '';
            } catch { }

            const goalTotal = Object.values(goalTYT).reduce((a, b) => a + (parseFloat(b) || 0), 0);
            const hasGoal = goalTotal > 0;

            // Son gerçek TYT netini bul
            const sName = normTR(student.name);
            const studentResults = v2Results.filter(r => {
                const rName = normTR(r.student);
                return rName.includes(sName.split(' ')[0]) || sName.includes(rName.split(' ')[0]);
            }).sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0));

            const lastResult = studentResults[0] || null;
            const actualNet = lastResult ? parseFloat(lastResult.totalNet || 0) : null;

            const gap = (hasGoal && actualNet !== null) ? parseFloat((goalTotal - actualNet).toFixed(1)) : null;

            // Ders bazlı kıyaslama
            const subjectComparison = TYT_SUBJECTS.map(s => {
                const goalVal = parseFloat(goalTYT[s.key] || 0);
                let actualVal = 0;
                if (lastResult) {
                    if (lastResult[s.key] != null) actualVal = parseFloat(lastResult[s.key]) || 0;
                    else if (lastResult.subjects?.[s.key]) {
                        const v = lastResult.subjects[s.key];
                        actualVal = typeof v === 'object' ? (parseFloat(v.net) || 0) : (parseFloat(v) || 0);
                    }
                }
                return { ...s, goal: goalVal, actual: actualVal, diff: goalVal > 0 ? parseFloat((goalVal - actualVal).toFixed(1)) : null };
            });

            return { student, hasGoal, goalTotal, actualNet, gap, targetUniv, subjectComparison, lastResult };
        }).filter(d => d.hasGoal || d.actualNet !== null);
    }, [students, v2Results]);

    const filtered = data
        .filter(d => !search || d.student.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'gap') return (Math.abs(b.gap || 0)) - (Math.abs(a.gap || 0));
            if (sortBy === 'actual') return (b.actualNet || 0) - (a.actualNet || 0);
            return a.student.name.localeCompare(b.student.name, 'tr');
        });

    const atRisk = data.filter(d => d.gap !== null && d.gap > 20).length;
    const onTrack = data.filter(d => d.gap !== null && d.gap <= 5).length;

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-xl font-black text-ink flex items-center gap-2">
                        <Target size={22} className="text-ok" /> Hedef vs Gerçek Karşılaştırma
                    </h2>
                    <p className="text-sm text-ink-3 mt-0.5">Öğrencilerin hedef netleri ile son deneme performansı</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-ok-soft border border-ok rounded-xl px-4 py-2 text-center">
                        <p className="text-xl font-black text-ok">{onTrack}</p>
                        <p className="text-xs text-ok font-bold">Hedefte</p>
                    </div>
                    <div className="bg-danger-soft border border-danger rounded-xl px-4 py-2 text-center">
                        <p className="text-xl font-black text-danger">{atRisk}</p>
                        <p className="text-xs text-danger font-bold">Risk</p>
                    </div>
                </div>
            </div>

            {/* Filtreler */}
            <div className="flex flex-wrap gap-2 items-center">
                <div className="relative flex-1 min-w-48">
                    <Search size={14} className="absolute left-3 top-2.5 text-ink-3" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Öğrenci ara..."
                        className="pl-9 pr-3 py-2 w-full text-sm border border-line rounded-xl outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                    className="text-sm border border-line rounded-xl px-3 py-2 bg-surface outline-none">
                    <option value="gap">Farka Göre</option>
                    <option value="actual">Net'e Göre</option>
                    <option value="name">İsme Göre</option>
                </select>
            </div>

            {filtered.length === 0 ? (
                <div className="bg-surface rounded-2xl p-12 text-center border border-dashed border-line">
                    <Target size={48} className="text-ink-3 mx-auto mb-3" />
                    <p className="font-bold text-ink-3">Henüz hedef belirlemiş öğrenci yok</p>
                    <p className="text-sm text-ink-3 mt-1">Öğrenciler İstatistikler sekmesinden hedeflerini belirleyebilir</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(({ student, hasGoal, goalTotal, actualNet, gap, targetUniv, subjectComparison, lastResult }) => {
                        const isExpanded = expandedId === student.id;
                        const gapAbs = Math.abs(gap || 0);
                        const status = !hasGoal ? 'no-goal' : !actualNet ? 'no-data' : gap <= 5 ? 'good' : gap <= 20 ? 'medium' : 'bad';
                        const statusConfig = {
                            'good': { cls: 'bg-ok-soft border-ok', badge: 'bg-ok-soft text-ok', icon: <Trophy size={14} />, label: 'Hedefte' },
                            'medium': { cls: 'bg-warn-soft border-warn', badge: 'bg-warn-soft text-warn', icon: <TrendingUp size={14} />, label: 'Yakın' },
                            'bad': { cls: 'bg-danger-soft border-danger', badge: 'bg-danger-soft text-danger', icon: <AlertTriangle size={14} />, label: 'Açık Var' },
                            'no-goal': { cls: 'bg-surface-2 border-line', badge: 'bg-surface-3 text-ink-2', icon: <Minus size={14} />, label: 'Hedef Yok' },
                            'no-data': { cls: 'bg-info-soft border-info', badge: 'bg-info-soft text-info', icon: <Minus size={14} />, label: 'Veri Yok' },
                        };
                        const sc = statusConfig[status];

                        return (
                            <div key={student.id} className={`rounded-2xl border-2 overflow-hidden transition-all ${sc.cls}`}>
                                <div
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface/30 transition"
                                    onClick={() => setExpandedId(isExpanded ? null : student.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="on-color w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-ink flex items-center justify-center font-black text-sm flex-shrink-0">
                                            {student.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-black text-ink text-sm">{student.name}</p>
                                            {targetUniv && <p className="text-xs text-ink-2 truncate max-w-48">🎯 {targetUniv}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {actualNet !== null && (
                                            <div className="text-right hidden sm:block">
                                                <p className="text-xs text-ink-3">Son Net</p>
                                                <p className="font-black text-ink">{actualNet.toFixed(1)}</p>
                                            </div>
                                        )}
                                        {hasGoal && (
                                            <div className="text-right hidden sm:block">
                                                <p className="text-xs text-ink-3">Hedef</p>
                                                <p className="font-black text-brand">{goalTotal.toFixed(0)}</p>
                                            </div>
                                        )}
                                        {gap !== null && (
                                            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black ${sc.badge}`}>
                                                {sc.icon} {gap > 0 ? `−${gap.toFixed(1)}` : `+${Math.abs(gap).toFixed(1)}`}
                                            </div>
                                        )}
                                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${sc.badge}`}>{sc.label}</span>
                                        {isExpanded ? <ChevronUp size={16} className="text-ink-3" /> : <ChevronDown size={16} className="text-ink-3" />}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="px-4 pb-4 space-y-3 border-t border-white/50 pt-3">
                                        {hasGoal && actualNet !== null && (
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                {subjectComparison.map(s => (
                                                    <div key={s.key} className="bg-surface rounded-xl p-3">
                                                        <p className="text-xs font-bold text-ink-2 mb-1">{s.label}</p>
                                                        <div className="flex items-baseline gap-1.5">
                                                            <span className="text-lg font-black text-ink">{s.actual.toFixed(1)}</span>
                                                            {s.goal > 0 && <span className="text-xs text-ink-3">/ {s.goal}</span>}
                                                        </div>
                                                        {s.diff !== null && s.goal > 0 && (
                                                            <p className={`text-xs font-bold mt-1 ${s.diff > 0 ? 'text-danger' : 'text-ok'}`}>
                                                                {s.diff > 0 ? `−${s.diff.toFixed(1)} eksik` : `✓ Hedefte`}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {!hasGoal && <p className="text-sm text-ink-3 bg-surface/60 rounded-xl p-3">Bu öğrenci henüz hedef belirlememiş</p>}
                                        {hasGoal && actualNet === null && <p className="text-sm text-ink-3 bg-surface/60 rounded-xl p-3">Bu öğrenci için deneme verisi bulunamadı</p>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default GoalComparisonPanel;
