import React, { useState, useMemo } from 'react';
import { Trophy, Star, Flame, Zap, TrendingUp, Crown, Medal, Users } from 'lucide-react';
import { nesneOku } from '../../services/veriDeposu';

// ─── Liderlik Puanı Hesapla ──────────────────────────────────
const calcLeaderScore = (student) => {
    try {
        const gamKey = `gamification_stats_${student.id || student.schoolNumber}`;
        const gamData = nesneOku(gamKey);

        const xp = Number(gamData.totalXP || 0);
        const streak = Number(gamData.currentStreak || 0);
        const tasks = Number(gamData.tasksCompleted || 0);
        const pomodoros = Number(gamData.pomodorosCompleted || 0);
        const exams = Number(gamData.examsCompleted || 0);

        const score = xp + (streak * 10) + (tasks * 5) + (pomodoros * 3) + (exams * 15);

        return { xp, streak, tasks, pomodoros, exams, score };
    } catch {
        return { xp: 0, streak: 0, tasks: 0, pomodoros: 0, exams: 0, score: 0 };
    }
};

// ─── Rozet Sistemi ────────────────────────────────────────────
const getBadge = (score) => {
    if (score >= 5000) return { label: 'Efsane 🏅', color: 'from-yellow-400 to-amber-500', textColor: 'text-warn' };
    if (score >= 2000) return { label: 'Elmas 💎', color: 'from-cyan-400 to-blue-500', textColor: 'text-info' };
    if (score >= 1000) return { label: 'Altın ⭐', color: 'from-yellow-300 to-yellow-500', textColor: 'text-warn' };
    if (score >= 500) return { label: 'Gümüş 🌟', color: 'from-gray-300 to-gray-400', textColor: 'text-ink' };
    if (score >= 100) return { label: 'Bronz 🔥', color: 'from-orange-300 to-orange-400', textColor: 'text-warn' };
    return { label: 'Acemi 🌱', color: 'from-green-200 to-green-300', textColor: 'text-ok' };
};

// ─── Podyum (İlk 3) ──────────────────────────────────────────
const Podium = ({ top3 }) => {
    const positions = [
        { index: 1, height: 'h-20', crown: '🥈', bg: 'from-gray-300 to-gray-400', delay: '0.1s', student: top3[1] },
        { index: 0, height: 'h-28', crown: '🥇', bg: 'from-yellow-400 to-amber-500', delay: '0s', student: top3[0] },
        { index: 2, height: 'h-14', crown: '🥉', bg: 'from-orange-300 to-orange-400', delay: '0.2s', student: top3[2] },
    ];

    return (
        <div className="flex items-end justify-center gap-3 mb-6">
            {positions.map(pos => {
                if (!pos.student) return null;
                const badge = getBadge(pos.student.score);
                return (
                    <div key={pos.index} className="flex flex-col items-center gap-2" style={{ animationDelay: pos.delay }}>
                        {/* Avatar */}
                        <div className="relative">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pos.bg} flex items-center justify-center text-ink font-black text-lg shadow-lg border-2 border-white`}>
                                {pos.student.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl">{pos.crown}</div>
                        </div>
                        {/* İsim */}
                        <div className="text-center">
                            <p className="text-xs font-black text-ink max-w-[70px] truncate">{pos.student.name?.split(' ')[0]}</p>
                            <p className="text-xs text-brand font-black">{pos.student.xp.toLocaleString()} XP</p>
                        </div>
                        {/* Kaide */}
                        <div className={`${pos.height} w-20 bg-gradient-to-b ${pos.bg} rounded-t-xl flex items-center justify-center shadow-inner`}>
                            <span className="text-ink font-black text-xl">{pos.index + 1}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// ─── Sıralama Satırı ─────────────────────────────────────────
const RankRow = ({ student, rank, isCurrentUser }) => {
    const badge = getBadge(student.score);

    return (
        <div className={`flex items-center gap-3 p-3 rounded-xl transition ${isCurrentUser ? 'bg-brand-soft border-2 border-brand-line' : 'hover:bg-surface-2 border border-transparent'}`}>
            {/* Sıra */}
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 ${rank <= 3 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-ink shadow-sm' : 'bg-surface-3 text-ink-2'}`}>
                {rank}
            </div>

            {/* Avatar */}
            <div className={`on-color w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-ink font-black text-sm shadow-sm flex-shrink-0`}>
                {student.name?.charAt(0)?.toUpperCase() || '?'}
            </div>

            {/* İsim + Rozet */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className={`text-sm font-black truncate ${isCurrentUser ? 'text-brand' : 'text-ink'}`}>
                        {student.name}
                        {isCurrentUser && <span className="text-xs text-brand font-normal ml-1">(Sen)</span>}
                    </p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full bg-gradient-to-r ${badge.color} ${badge.textColor} font-bold whitespace-nowrap flex-shrink-0`}>
                        {badge.label}
                    </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-ink-3 flex items-center gap-0.5"><Flame size={9} />{student.streak}g</span>
                    <span className="text-xs text-ink-3 flex items-center gap-0.5"><Zap size={9} />{student.tasks} görev</span>
                    <span className="text-xs text-ink-3 flex items-center gap-0.5"><Star size={9} />{student.exams} deneme</span>
                </div>
            </div>

            {/* XP */}
            <div className="text-right flex-shrink-0">
                <p className="text-sm font-black text-brand">{student.score.toLocaleString()}</p>
                <p className="text-xs text-ink-3">{student.xp.toLocaleString()} XP</p>
            </div>
        </div>
    );
};

// ─── Ana Bileşen ─────────────────────────────────────────────
const XPLeaderboard = ({ students = [], currentUserId = null }) => {
    const [filter, setFilter] = useState('all'); // all | week
    const [showAll, setShowAll] = useState(false);

    const ranked = useMemo(() => {
        return students
            .map(s => ({
                id: s.id,
                name: s.name,
                grade: s.grade,
                ...calcLeaderScore(s),
            }))
            .sort((a, b) => b.score - a.score);
    }, [students]);

    const top3 = ranked.slice(0, 3);
    const displayList = showAll ? ranked.slice(3) : ranked.slice(3, 10);

    // Mevcut kullanıcının sırası
    const currentUserRank = currentUserId
        ? ranked.findIndex(s => String(s.id) === String(currentUserId)) + 1
        : -1;
    const currentUser = currentUserId ? ranked.find(s => String(s.id) === String(currentUserId)) : null;

    return (
        <div className="space-y-4">
            {/* Başlık */}
            <div className="flex items-center justify-between">
                <h3 className="font-black text-ink flex items-center gap-2">
                    <Trophy size={18} className="text-warn" />
                    XP Liderlik Tablosu
                </h3>
                <div className="flex items-center gap-2">
                    <Users size={13} className="text-ink-3" />
                    <span className="text-xs text-ink-2 font-medium">{ranked.length} öğrenci</span>
                </div>
            </div>

            {ranked.length === 0 ? (
                <div className="bg-surface rounded-2xl border border-line p-10 text-center">
                    <Trophy size={34} className="mx-auto mb-3 text-ink-3" />
                    <p className="text-sm text-ink-3">Henüz veri yok</p>
                </div>
            ) : (
                <div className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden">
                    {/* Gradient arka plan */}
                    <div className="on-color bg-gradient-to-br from-brand to-purple-700 p-5">
                        <p className="text-center text-ink-2 text-xs font-bold mb-4 uppercase tracking-widest">🏆 En İyi 3</p>
                        <Podium top3={top3} />
                    </div>

                    {/* Mevcut kullanıcı pinned */}
                    {currentUser && currentUserRank > 3 && (
                        <div className="border-b border-brand-line bg-brand-soft/60 px-3 py-2">
                            <p className="text-xs text-brand font-bold mb-1">📍 Senin Sıran</p>
                            <RankRow
                                student={currentUser}
                                rank={currentUserRank}
                                isCurrentUser={true}
                            />
                        </div>
                    )}

                    {/* Tam Liste */}
                    <div className="p-3 space-y-1">
                        {ranked.slice(0, showAll ? undefined : 10).map((s, idx) => (
                            idx >= 3 && (
                                <RankRow
                                    key={s.id}
                                    student={s}
                                    rank={idx + 1}
                                    isCurrentUser={String(s.id) === String(currentUserId)}
                                />
                            )
                        ))}
                    </div>

                    {ranked.length > 10 && (
                        <div className="px-4 pb-4">
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className="w-full py-2 text-xs font-bold text-brand hover:text-brand border border-brand-line rounded-xl hover:bg-brand-soft transition"
                            >
                                {showAll ? 'Daha Az Göster ▲' : `Tümünü Gör (${ranked.length}) ▼`}
                            </button>
                        </div>
                    )}

                    {/* Nasıl XP Kazanırsın? */}
                    <div className="border-t border-line px-4 py-3 bg-surface-2">
                        <p className="text-xs font-black text-ink-2 mb-2 uppercase tracking-wide">XP Nasıl Kazanılır?</p>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { icon: '✅', label: 'Görev', val: '5 XP' },
                                { icon: '⏱️', label: 'Pomodoro', val: '3 XP' },
                                { icon: '📊', label: 'Deneme', val: '15 XP' },
                                { icon: '🔥', label: 'Seri günü', val: '10 XP' },
                                { icon: '📅', label: 'Günlük giriş', val: '2 XP' },
                                { icon: '🏅', label: 'Rozet', val: '+Bonus' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-1.5 bg-surface rounded-lg px-2 py-1.5 border border-line">
                                    <span className="text-sm">{item.icon}</span>
                                    <div>
                                        <p className="text-xs font-bold text-ink-2 leading-none">{item.label}</p>
                                        <p className="text-xs text-brand font-black leading-none mt-0.5">{item.val}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default XPLeaderboard;
