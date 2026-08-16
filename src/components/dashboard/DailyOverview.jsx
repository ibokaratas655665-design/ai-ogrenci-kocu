import React from 'react';
import { Calendar, Target, TrendingUp, Award, CheckCircle, BookOpen } from 'lucide-react';

const DailyOverview = ({ userStats, todayTasks = [], todayGoals = [] }) => {
    const today = new Date().toLocaleDateString('tr-TR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Calculate today's progress
    const completedTasks = todayTasks.filter(t => t.completed).length;
    const totalTasks = todayTasks.length;
    const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const stats = [
        {
            label: 'Pomodoro Oturumu',
            value: userStats?.dailyPomodoros || 0,
            target: 8,
            icon: Calendar,
            color: 'indigo'
        },
        {
            label: 'Çalışma Saati',
            value: Math.floor((userStats?.dailyStudyMinutes || 0) / 60),
            target: 4,
            icon: BookOpen,
            color: 'green'
        },
        {
            label: 'Tamamlanan Görev',
            value: completedTasks,
            target: totalTasks,
            icon: CheckCircle,
            color: 'purple'
        },
        {
            label: 'Günlük XP',
            value: userStats?.dailyXP || 0,
            target: 100,
            icon: Award,
            color: 'orange'
        }
    ];

    return (
        <div className="daily-overview-container">
            {/* Header */}
            <div className="daily-overview-header">
                <div>
                    <h2 className="text-2xl font-black text-ink">Günlük Özet</h2>
                    <p className="text-sm text-ink-2 font-medium mt-1">{today}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="text-right">
                        <div className="text-xs text-ink-2 font-semibold">Bugünkü İlerleme</div>
                        <div className="text-2xl font-black text-brand">{taskProgress.toFixed(0)}%</div>
                    </div>
                    <TrendingUp className="text-brand" size={32} />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    const progress = stat.target > 0 ? (stat.value / stat.target) * 100 : 0;
                    const colorClasses = {
                        indigo: 'bg-brand-soft text-brand border-brand-line',
                        green: 'bg-ok-soft text-ok border-ok',
                        purple: 'bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] text-c4 border-[color-mix(in_srgb,var(--c4)_35%,transparent)]',
                        orange: 'bg-warn-soft text-warn border-warn'
                    };

                    return (
                        <div key={index} className={`daily-stat-card ${colorClasses[stat.color]}`}>
                            <div className="flex items-start justify-between mb-3">
                                <Icon size={20} />
                                <span className="text-xs font-bold opacity-70">{stat.value}/{stat.target}</span>
                            </div>
                            <div className="text-sm font-bold mb-2">{stat.label}</div>
                            <div className="w-full bg-surface/50 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full bg-current transition-all duration-500"
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Today's Goals */}
            {todayGoals && todayGoals.length > 0 && (
                <div className="mt-6 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-5 border border-[color-mix(in_srgb,var(--c4)_35%,transparent)]">
                    <div className="flex items-center mb-3">
                        <Target className="text-c4 mr-2" size={20} />
                        <h3 className="text-lg font-bold text-ink">Bugünün Hedefleri</h3>
                    </div>
                    <div className="space-y-2">
                        {todayGoals.slice(0, 3).map((goal, index) => (
                            <div
                                key={index}
                                className="flex items-center bg-surface/60 backdrop-blur-sm rounded-lg p-3 border border-[color-mix(in_srgb,var(--c4)_35%,transparent)]"
                            >
                                <div className={`w-2 h-2 rounded-full mr-3 ${goal.completed ? 'bg-ok' : 'bg-violet-400'}`} />
                                <span className={`text-sm font-medium ${goal.completed ? 'line-through text-ink-3' : 'text-ink-2'}`}>
                                    {goal.text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions (Optional) */}
            <div className="mt-4 flex flex-wrap gap-2">
                <button className="daily-action-btn">
                    <Calendar size={14} />
                    <span>Pomodoro Başlat</span>
                </button>
                <button className="daily-action-btn">
                    <BookOpen size={14} />
                    <span>Konu Çalış</span>
                </button>
                <button className="daily-action-btn">
                    <Award size={14} />
                    <span>Rozet Koleksiyonu</span>
                </button>
            </div>
        </div>
    );
};

export default DailyOverview;
