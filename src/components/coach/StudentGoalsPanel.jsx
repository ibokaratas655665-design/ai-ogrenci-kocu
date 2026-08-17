/**
 * 🎯 KOÇ: ÖĞRENCİ HEDEFLERİ PANELİ (Madde 4)
 * GoalSettingModule'deki öğrenci hedeflerini koç panelinde gösterir
 */
import React, { useState, useEffect } from 'react';
import { Target, CheckCircle, Clock, TrendingUp, AlertCircle, ChevronDown, ChevronUp, Star, Search } from 'lucide-react';

const STATUS_CONFIG = {
    completed: { label: 'Tamamlandı', color: 'text-ok', bg: 'bg-ok-soft', border: 'border-ok', icon: CheckCircle },
    active:    { label: 'Devam Ediyor', color: 'text-brand', bg: 'bg-brand-soft', border: 'border-brand-line', icon: Clock },
    overdue:   { label: 'Gecikmiş', color: 'text-danger', bg: 'bg-danger-soft', border: 'border-danger', icon: AlertCircle },
    pending:   { label: 'Beklemede', color: 'text-ink-2', bg: 'bg-surface-2', border: 'border-line', icon: Clock },
};

const getGoalStatus = (goal) => {
    if (goal.completed) return 'completed';
    if (goal.deadline && new Date(goal.deadline) < new Date()) return 'overdue';
    if (goal.progress > 0) return 'active';
    return 'pending';
};

const StudentGoalCard = ({ student, goals }) => {
    const [expanded, setExpanded] = useState(false);
    const completed = goals.filter(g => g.completed).length;
    const overdue = goals.filter(g => !g.completed && g.deadline && new Date(g.deadline) < new Date()).length;
    const completion = goals.length > 0 ? Math.round((completed / goals.length) * 100) : 0;

    return (
        <div className="bg-surface border border-line rounded-2xl shadow-sm overflow-hidden">
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-2 transition"
                onClick={() => setExpanded(e => !e)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center font-black text-brand text-sm">
                        {student?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                        <p className="font-bold text-ink text-sm">{student?.name || 'Öğrenci'}</p>
                        <p className="text-xs text-ink-3">{student?.grade}{student?.section ? `/${student.section}` : ''} • {goals.length} hedef</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {overdue > 0 && (
                        <span className="bg-danger-soft text-danger text-xs font-bold px-2 py-0.5 rounded-full">{overdue} gecikmiş</span>
                    )}
                    <div className="text-right">
                        <p className="text-sm font-black text-brand">{completion}%</p>
                        <p className="text-[10px] text-ink-3">tamamlandı</p>
                    </div>
                    {expanded ? <ChevronUp size={16} className="text-ink-3" /> : <ChevronDown size={16} className="text-ink-3" />}
                </div>
            </div>

            {/* İlerleme çubuğu */}
            <div className="px-4 pb-3">
                <div className="w-full bg-surface-3 rounded-full h-1.5 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-yavas ${overdue > 0 ? 'bg-red-400' : 'bg-brand'}`}
                        style={{ width: `${completion}%` }}
                    />
                </div>
            </div>

            {expanded && goals.length > 0 && (
                <div className="border-t border-line p-4 bg-surface-2/50 space-y-2">
                    {goals.map((goal, i) => {
                        const status = getGoalStatus(goal);
                        const cfg = STATUS_CONFIG[status];
                        const Icon = cfg.icon;
                        const prog = typeof goal.progress === 'number' ? goal.progress : 0;
                        return (
                            <div key={i} className={`${cfg.bg} border ${cfg.border} rounded-xl p-3`}>
                                <div className="flex items-start gap-2">
                                    <Icon size={14} className={`${cfg.color} mt-0.5 flex-shrink-0`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-ink text-xs leading-snug">{goal.title || goal.text || 'Hedef'}</p>
                                        {goal.deadline && (
                                            <p className="text-[10px] text-ink-3 mt-0.5">
                                                Son: {new Date(goal.deadline).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                                            </p>
                                        )}
                                        {prog > 0 && (
                                            <div className="mt-1.5">
                                                <div className="w-full bg-surface/70 rounded-full h-1 overflow-hidden">
                                                    <div className={`h-full rounded-full bg-current ${cfg.color}`} style={{ width: `${prog}%` }} />
                                                </div>
                                                <p className="text-[10px] mt-0.5 font-bold" style={{ color: 'currentColor' }}>{prog}%</p>
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color} flex-shrink-0`}>
                                        {cfg.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const StudentGoalsPanel = ({ students = [] }) => {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // 'all' | 'hasGoals' | 'overdue'
    const [allGoals, setAllGoals] = useState({});

    useEffect(() => {
        // Tüm öğrencilerin hedeflerini oku
        const goals = {};
        students.forEach(s => {
            try {
                const key = `goals_${s.id}`;
                const raw = localStorage.getItem(key);
                if (raw) goals[s.id] = JSON.parse(raw);
                else goals[s.id] = [];
            } catch { goals[s.id] = []; }
        });
        setAllGoals(goals);
    }, [students]);

    const totalGoals = Object.values(allGoals).flat().length;
    const totalCompleted = Object.values(allGoals).flat().filter(g => g.completed).length;
    const totalOverdue = Object.values(allGoals).flat().filter(g => !g.completed && g.deadline && new Date(g.deadline) < new Date()).length;
    const completionRate = totalGoals > 0 ? Math.round((totalCompleted / totalGoals) * 100) : 0;

    const filtered = students.filter(s => {
        const matchName = !search || s.name?.toLowerCase().includes(search.toLowerCase());
        const goals = allGoals[s.id] || [];
        const matchFilter = filter === 'all' || (filter === 'hasGoals' && goals.length > 0) ||
            (filter === 'overdue' && goals.some(g => !g.completed && g.deadline && new Date(g.deadline) < new Date()));
        return matchName && matchFilter;
    });

    return (
        <div className="space-y-5">
            {/* KPI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Toplam Hedef', value: totalGoals, color: 'from-indigo-500 to-brand' },
                    { label: 'Tamamlanan', value: totalCompleted, color: 'from-emerald-500 to-emerald-600' },
                    { label: 'Gecikmiş', value: totalOverdue, color: 'from-red-400 to-red-500' },
                    { label: 'Başarı Oranı', value: `%${completionRate}`, color: 'from-purple-500 to-purple-600' },
                ].map(({ label, value, color }) => (
                    <div key={label} className={`bg-gradient-to-br ${color} text-ink rounded-2xl p-4 shadow`}>
                        <p className="text-2xl font-black">{value}</p>
                        <p className="text-xs font-bold opacity-80 mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* Filtreler */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-2.5 text-ink-3" />
                    <input
                        type="text"
                        placeholder="Öğrenci ara..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-3 py-2 border border-line rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-indigo-400 bg-surface"
                    />
                </div>
                <div className="flex gap-1.5">
                    {[['all', 'Tümü'], ['hasGoals', 'Hedefi Olan'], ['overdue', 'Gecikmiş']].map(([val, lbl]) => (
                        <button
                            key={val}
                            onClick={() => setFilter(val)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition ${filter === val ? 'bg-brand text-ink' : 'bg-surface border border-line text-ink-2 hover:bg-brand-soft'}`}
                        >
                            {lbl}
                        </button>
                    ))}
                </div>
            </div>

            {/* Öğrenci Kartları */}
            <div className="space-y-2">
                {filtered.map(s => (
                    <StudentGoalCard key={s.id} student={s} goals={allGoals[s.id] || []} />
                ))}
                {filtered.length === 0 && (
                    <div className="text-center py-12 text-ink-3">
                        <Target size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Hedef bulunamadı</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentGoalsPanel;
