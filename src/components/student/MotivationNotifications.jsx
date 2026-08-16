import React, { useState, useEffect } from 'react';
import { Bell, X, TrendingUp, AlertCircle, CheckCircle, Flame, Trophy } from 'lucide-react';

/**
 * Madde 11: Akıllı Motivasyon Bildirimleri
 * Öğrenci durumuna göre bağlamsal mesajlar:
 * - "Bu hafta hiç görev tamamlamadın!" (uyarı)
 * - "Harika! Son 3 haftada netini artırdın 🚀" (kutlama)
 * - "Bugün hedefine ulaştın 🎯" (günlük teşvik)
 */
const MotivationNotifications = ({ user, examData = [], tasks = [] }) => {
    const [notifications, setNotifications] = useState([]);
    const [dismissed, setDismissed] = useState(() => {
        try { return JSON.parse(localStorage.getItem('mot_dismissed') || '[]'); } catch { return []; }
    });

    useEffect(() => {
        const generated = [];

        // — 1. Bu hafta hiç görev tamamlamadı mı? —
        const now = Date.now();
        const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
        const thisWeekCompleted = tasks.filter(t =>
            t.completed && new Date(t.completedAt || t.updatedAt || 0) > weekAgo
        );
        if (thisWeekCompleted.length === 0 && tasks.length > 0) {
            generated.push({
                id: 'no-task-this-week',
                type: 'warning',
                icon: AlertCircle,
                title: 'Bu hafta hiç görev tamamlamadın!',
                body: 'Küçük adımlar büyük fark yaratır. Bugün bir görev tamamla ⚡',
                color: 'amber',
            });
        }

        // — 2. Son 3 denemede net artışı —
        if (examData.length >= 3) {
            const sorted = [...examData].sort((a, b) => new Date(b.date) - new Date(a.date));
            const last3 = sorted.slice(0, 3).map(e => parseFloat(e.totalNet) || 0);
            if (last3[0] > last3[1] && last3[1] > last3[2]) {
                generated.push({
                    id: 'net-rising-3weeks',
                    type: 'success',
                    icon: TrendingUp,
                    title: 'Sürekli yükseliyorsun! 🚀',
                    body: `Son 3 denemende net skorun ${last3[2].toFixed(1)} → ${last3[1].toFixed(1)} → ${last3[0].toFixed(1)} oldu. Harika gidiyorsun!`,
                    color: 'green',
                });
            }
        }

        // — 3. Günlük seri teşviki —
        try {
            const gamStats = JSON.parse(localStorage.getItem(`gamification_${user?.id}`) || '{}');
            const streak = gamStats.currentStreak || 0;
            if (streak >= 3 && streak < 7) {
                generated.push({
                    id: `streak-${streak}`,
                    type: 'motivate',
                    icon: Flame,
                    title: `${streak} Günlük Seri! 🔥`,
                    body: '7 günlük seri rozetine çok yakınsın. Devam et!',
                    color: 'orange',
                });
            } else if (streak >= 7) {
                generated.push({
                    id: `streak-week-${streak}`,
                    type: 'success',
                    icon: Trophy,
                    title: `${streak} Günlük Seri! Muhteşem! 🏆`,
                    body: 'Haftayı doldurdun. Bu istikrah pek çok öğrenciyi geçiriyor!',
                    color: 'yellow',
                });
            }
        } catch { /* ignore */ }

        // — 4. İlk deneme henüz yok —
        if (examData.length === 0) {
            generated.push({
                id: 'no-exams-yet',
                type: 'info',
                icon: CheckCircle,
                title: 'İlk deneme sonucunu gir!',
                body: 'Deneme sonuçlarını girerek ilerlemenizi takip edebilirsiniz.',
                color: 'indigo',
            });
        }

        // Daha önce kapananları filtrele
        setNotifications(generated.filter(n => !dismissed.includes(n.id)));
    }, [examData, tasks, user]);

    const dismiss = (id) => {
        const updated = [...dismissed, id];
        setDismissed(updated);
        localStorage.setItem('mot_dismissed', JSON.stringify(updated));
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    if (notifications.length === 0) return null;

    const colorMap = {
        amber: 'bg-warn-soft border-warn text-warn',
        green: 'bg-ok-soft border-ok text-ok',
        orange: 'bg-warn-soft border-warn text-warn',
        yellow: 'bg-warn-soft border-warn text-warn',
        indigo: 'bg-brand-soft border-brand-line text-brand',
        red: 'bg-danger-soft border-danger text-danger',
    };
    const iconColorMap = {
        amber: 'text-warn',
        green: 'text-ok',
        orange: 'text-warn',
        yellow: 'text-warn',
        indigo: 'text-brand',
        red: 'text-danger',
    };

    return (
        <div className="space-y-2 mb-4">
            {notifications.map(n => {
                const Icon = n.icon;
                return (
                    <div key={n.id} className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${colorMap[n.color] || colorMap.indigo} relative animate-fade-in`}>
                        <Icon size={18} className={`flex-shrink-0 mt-0.5 ${iconColorMap[n.color] || 'text-brand'}`} />
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm">{n.title}</p>
                            <p className="text-xs opacity-80 mt-0.5">{n.body}</p>
                        </div>
                        <button
                            onClick={() => dismiss(n.id)}
                            className="flex-shrink-0 opacity-60 hover:opacity-100 transition p-0.5 rounded"
                        >
                            <X size={14} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default MotivationNotifications;
