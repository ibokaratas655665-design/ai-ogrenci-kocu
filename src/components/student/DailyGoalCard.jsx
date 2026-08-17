/**
 * 🎯 GÜNLÜK HEDEF KARTI
 * Her gün öğrencinin kendi hedefini belirleyip takip ettiği dinamik kart
 */
import React, { useState, useEffect } from 'react';
import { Target, Check, Flame, Zap, Plus, X, RefreshCw, Trophy } from 'lucide-react';

// ─── Hazır Şablonlar ─────────────────────────────────────────
const TEMPLATES = [
    { emoji: '📚', text: '25 TYT sorusu çöz' },
    { emoji: '⏱️', text: '4 Pomodoro tamamla' },
    { emoji: '📝', text: 'Matematik konusunu tekrar et' },
    { emoji: '✅', text: 'Koçun görevini tamamla' },
    { emoji: '🔥', text: '50 dakika kesintisiz çalış' },
    { emoji: '🎯', text: 'Zayıf konuya 1 saat ayır' },
    { emoji: '📖', text: 'Türkçe paragraf çalış' },
    { emoji: '💪', text: 'Bugün en az 3 konu tekrarla' },
];

// ─── Motivasyon Mesajları ─────────────────────────────────────
const MOTIVATION = [
    'Bugün küçük bir adım, yarın büyük bir zafer! 🚀',
    'Disiplin, başarının sırrıdır. Sen yapabilirsin! 💪',
    'Her gün biraz daha iyi olmak yeterli. 📈',
    'Yorgunluk hissi büyümenin işaretidir! 🔥',
    'Bugünkü çabası yarının liderini yaratır! 🏆',
    'Başlamak işin en zor kısmıdır. Başladın mı? ✅',
];

// Günlük storage key
const todayKey = () => `daily_goals_${new Date().toDateString()}`;
const statsKey = (userId) => `daily_goals_stats_${userId || 'guest'}`;

// ─── Konfeti Animasyonu ──────────────────────────────────────
const MiniConfetti = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        {[...Array(12)].map((_, i) => (
            <div
                key={i}
                className="absolute w-2 h-2 rounded-sm animate-bounce"
                style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    background: ['var(--c1)', 'var(--ok)', 'var(--warn)', 'var(--c5)', 'var(--info)'][i % 5],
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationDuration: `${0.5 + Math.random() * 0.5}s`,
                    opacity: Math.random() > 0.3 ? 1 : 0,
                }}
            />
        ))}
    </div>
);

// ─── Ana Bileşen ─────────────────────────────────────────────
const DailyGoalCard = ({ userId, onAction }) => {
    const [goals, setGoals] = useState(() => {
        try { return JSON.parse(localStorage.getItem(todayKey()) || '[]'); } catch { return []; }
    });
    const [newGoalText, setNewGoalText] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [celebration, setCelebration] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);

    const motivation = MOTIVATION[new Date().getDay() % MOTIVATION.length];
    const completed = goals.filter(g => g.done).length;
    const total = goals.length;
    const allDone = total > 0 && completed === total;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    // İstatistik - tamamlanan gün sayısı
    const [streak, setStreak] = useState(() => {
        try {
            const s = JSON.parse(localStorage.getItem(statsKey(userId)) || '{}');
            return s.streak || 0;
        } catch { return 0; }
    });

    // Her gün yeni başlangıç için temizle (ama istatistik tut)
    useEffect(() => {
        const saved = localStorage.getItem(todayKey());
        if (!saved) {
            setGoals([]);
        }
    }, []);

    const save = (updated) => {
        setGoals(updated);
        localStorage.setItem(todayKey(), JSON.stringify(updated));
    };

    const addGoal = (text) => {
        if (!text.trim()) return;
        const newGoal = {
            id: Date.now(),
            text: text.trim(),
            done: false,
            createdAt: Date.now(),
        };
        save([...goals, newGoal]);
        setNewGoalText('');
        setShowAdd(false);
        setShowTemplates(false);
    };

    const toggleGoal = (id) => {
        const updated = goals.map(g => g.id === id ? { ...g, done: !g.done } : g);
        save(updated);

        // Hepsi tamamlandıysa kutlama
        const newCompleted = updated.filter(g => g.done).length;
        if (newCompleted === updated.length && updated.length > 0) {
            setCelebration(true);
            setTimeout(() => setCelebration(false), 3000);
            // Streak güncelle
            try {
                const s = JSON.parse(localStorage.getItem(statsKey(userId)) || '{}');
                const today = new Date().toDateString();
                if (s.lastCompleted !== today) {
                    const newStreak = (s.streak || 0) + 1;
                    localStorage.setItem(statsKey(userId), JSON.stringify({ ...s, streak: newStreak, lastCompleted: today }));
                    setStreak(newStreak);
                }
            } catch { }
        }
    };

    const removeGoal = (id) => {
        save(goals.filter(g => g.id !== id));
    };

    const resetDay = () => {
        save([]);
        setCelebration(false);
    };

    return (
        <div className={`relative bg-surface rounded-2xl border overflow-hidden shadow-sm transition-all ${allDone ? 'border-ok shadow-green-100' : 'border-line'}`}>
            {celebration && <MiniConfetti />}

            {/* Header */}
            <div className={`px-5 py-4 ${allDone ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-brand to-violet-700'} text-white`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Target size={16} className="opacity-80" />
                        <span className="text-sm font-bold opacity-90">Bugünün Hedefler</span>
                        {streak > 0 && (
                            <span className="flex items-center gap-0.5 bg-surface/20 px-2 py-0.5 rounded-full text-xs font-bold">
                                <Flame size={11} /> {streak} gün
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={resetDay}
                            className="text-ink-2 hover:text-ink p-1 hover:bg-surface/10 rounded-lg transition"
                            title="Günü sıfırla"
                        >
                            <RefreshCw size={13} />
                        </button>
                    </div>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-3">
                    <div className="flex-1">
                        <div className="bg-surface/20 rounded-full h-2.5 overflow-hidden">
                            <div
                                className="h-full bg-surface rounded-full transition-all duration-yavas"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                    <span className="text-sm font-black whitespace-nowrap">
                        {completed}/{total}
                        {allDone && <span className="ml-1">🎉</span>}
                    </span>
                </div>

                {allDone ? (
                    <p className="text-xs text-ink-2 mt-2 font-bold">🏆 Tüm hedefleri tamamladın! Harika iş!</p>
                ) : (
                    <p className="text-xs text-ink-2 mt-1 italic">{motivation}</p>
                )}
            </div>

            {/* Hedefler Listesi */}
            <div className="p-4 space-y-2">
                {goals.length === 0 && (
                    <div className="text-center py-4">
                        <p className="text-sm text-ink-3">Henüz hedef eklenmedi.</p>
                        <p className="text-xs text-ink-3 mt-0.5">Bugün ne yapmak istiyorsun?</p>
                    </div>
                )}
                {goals.map(goal => (
                    <div
                        key={goal.id}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer group transition ${goal.done ? 'bg-ok-soft border border-ok' : 'bg-surface-2 hover:bg-brand-soft/50 border border-transparent hover:border-brand-line'}`}
                        onClick={() => toggleGoal(goal.id)}
                    >
                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition ${goal.done ? 'bg-ok border-ok' : 'border-line-2 group-hover:border-indigo-400'}`}>
                            {goal.done && <Check size={11} className="text-ink" strokeWidth={3} />}
                        </div>
                        <span className={`text-sm flex-1 leading-snug transition ${goal.done ? 'line-through text-ink-3' : 'text-ink font-medium'}`}>
                            {goal.text}
                        </span>
                        <button
                            onClick={e => { e.stopPropagation(); removeGoal(goal.id); }}
                            className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-danger transition"
                        >
                            <X size={13} />
                        </button>
                    </div>
                ))}

                {/* Şablonlar */}
                {showTemplates && (
                    <div className="grid grid-cols-2 gap-1.5 p-2 bg-surface-2 rounded-xl animate-fade-in">
                        {TEMPLATES.map((t, i) => (
                            <button
                                key={i}
                                onClick={() => addGoal(`${t.emoji} ${t.text}`)}
                                className="text-left text-xs bg-surface border border-line rounded-lg px-2.5 py-2 hover:border-brand-line hover:bg-brand-soft transition font-medium text-ink-2"
                            >
                                {t.emoji} {t.text}
                            </button>
                        ))}
                    </div>
                )}

                {/* Yeni Hedef Ekleme */}
                {showAdd ? (
                    <div className="flex gap-2 animate-fade-in">
                        <input
                            autoFocus
                            value={newGoalText}
                            onChange={e => setNewGoalText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') addGoal(newGoalText); if (e.key === 'Escape') setShowAdd(false); }}
                            placeholder="Hedefini yaz... (Enter ile ekle)"
                            className="flex-1 text-sm bg-surface-2 border border-brand-line rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-300 outline-none"
                        />
                        <button onClick={() => addGoal(newGoalText)} className="px-3 py-2 bg-brand text-white rounded-xl hover:bg-brand-hover transition text-sm font-bold">Ekle</button>
                        <button onClick={() => setShowAdd(false)} className="px-2 py-2 text-ink-3 hover:text-ink-2 transition"><X size={14} /></button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setShowAdd(true); setShowTemplates(false); }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 border-2 border-dashed border-line rounded-xl text-xs font-bold text-ink-3 hover:border-brand-line hover:text-brand hover:bg-brand-soft transition"
                        >
                            <Plus size={13} /> Hedef Ekle
                        </button>
                        <button
                            onClick={() => { setShowTemplates(s => !s); setShowAdd(false); }}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border-2 border-dashed transition ${showTemplates ? 'border-indigo-400 text-brand bg-brand-soft' : 'border-line text-ink-3 hover:border-line-2'}`}
                            title="Şablonlardan seç"
                        >
                            <Zap size={13} />
                        </button>
                    </div>
                )}
            </div>

            {/* Tamamlama Özeti */}
            {completed > 0 && !allDone && (
                <div className="border-t border-gray-50 px-5 py-2.5 bg-surface-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-2">Bugün: <strong className="text-brand">{completed} tamamlandı</strong></span>
                        <span className="text-ink-3">%{pct} tamamlandı</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyGoalCard;
