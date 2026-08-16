/**
 * 🔔 AKILLI BİLDİRİM SİSTEMİ
 * Öğrenci ve koç için kural tabanlı in-app bildirimler
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, Check, AlertTriangle, Trophy, BookOpen, Flame, Zap, MessageSquare, Target, CheckCircle } from 'lucide-react';

// ─── Bildirim Tipleri & Stiller ───────────────────────────────
const NOTIF_CONFIG = {
    warning: { bg: 'bg-warn-soft', border: 'border-warn', icon: AlertTriangle, iconColor: 'text-warn', dot: 'bg-warn' },
    success: { bg: 'bg-ok-soft', border: 'border-ok', icon: CheckCircle, iconColor: 'text-ok', dot: 'bg-ok' },
    info: { bg: 'bg-info-soft', border: 'border-info', icon: Zap, iconColor: 'text-info', dot: 'bg-info' },
    danger: { bg: 'bg-danger-soft', border: 'border-danger', icon: AlertTriangle, iconColor: 'text-danger', dot: 'bg-danger' },
    trophy: { bg: 'bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))]', border: 'border-[color-mix(in_srgb,var(--c4)_35%,transparent)]', icon: Trophy, iconColor: 'text-c4', dot: 'bg-c4' },
    message: { bg: 'bg-brand-soft', border: 'border-brand-line', icon: MessageSquare, iconColor: 'text-brand', dot: 'bg-brand' },
    streak: { bg: 'bg-warn-soft', border: 'border-warn', icon: Flame, iconColor: 'text-warn', dot: 'bg-warn' },
    target: { bg: 'bg-accent-soft', border: 'border-accent', icon: Target, iconColor: 'text-accent', dot: 'bg-accent' },
};

// ─── Bildirim Kuralları (Öğrenci) ─────────────────────────────
const generateStudentNotifications = (user, tasks, messages, examData, gamStats) => {
    const notifications = [];
    const now = Date.now();

    // 1. Tasklar
    const pendingTasks = tasks.filter(t => !t.completed && t.status !== 'Tamamlandı');
    if (pendingTasks.length >= 3) {
        notifications.push({
            id: 'tasks_pending',
            type: 'warning',
            title: `${pendingTasks.length} bekleyen görevin var`,
            body: `"${pendingTasks[0]?.title}" dahil ${pendingTasks.length} görev tamamlanmayı bekliyor.`,
            time: now,
            action: 'tasks',
            actionLabel: 'Görevlere Git',
        });
    }

    // 2. Okunmamış Mesaj
    const unreadMsgs = messages.filter(m => m.sender === 'coach' && !m.read);
    if (unreadMsgs.length > 0) {
        notifications.push({
            id: 'unread_messages',
            type: 'message',
            title: `Koçundan ${unreadMsgs.length} yeni mesaj`,
            body: unreadMsgs[0]?.text?.substring(0, 60) + '...',
            time: now - 300000,
            action: 'messages',
            actionLabel: 'Mesajlara Git',
        });
    }

    // 3. Streak uyarısı
    const streak = gamStats?.currentStreak || 0;
    const today = new Date().toDateString();
    const lastActivity = gamStats?.lastActivityDate;
    const studiedToday = lastActivity && new Date(lastActivity).toDateString() === today;

    if (streak > 0 && !studiedToday) {
        notifications.push({
            id: 'streak_danger',
            type: 'danger',
            title: `⚡ ${streak} günlük serinig tehlikede!`,
            body: 'Bugün hiç aktivite yapmadın. Seriyi kırmamak için Pomodoro başlat!',
            time: now - 600000,
            action: 'home',
            actionLabel: 'Pomodoro Başlat',
        });
    }

    // 4. Deneme sonucu
    if (examData.length > 0) {
        const last = examData[examData.length - 1];
        const prev = examData[examData.length - 2];
        if (prev && last.totalNet < prev.totalNet) {
            const drop = (prev.totalNet - last.totalNet).toFixed(1);
            notifications.push({
                id: 'exam_drop',
                type: 'warning',
                title: `Son denemende ${drop} net düşüş`,
                body: `${last.name || 'Son deneme'}: ${last.totalNet?.toFixed(1)} net. Bir önceki: ${prev.totalNet?.toFixed(1)} net.`,
                time: now - 1200000,
                action: 'exams',
                actionLabel: 'Deneme Analiz',
            });
        } else if (prev && last.totalNet > prev.totalNet) {
            const rise = (last.totalNet - prev.totalNet).toFixed(1);
            notifications.push({
                id: 'exam_rise',
                type: 'success',
                title: `🎉 Son denemende ${rise} net artış!`,
                body: `${last.name || 'Son deneme'}: ${last.totalNet?.toFixed(1)} net. Harika gidiyorsun!`,
                time: now - 1200000,
                action: 'exams',
                actionLabel: 'Detayları Gör',
            });
        }
    }

    // 5. XP milestone
    const xp = gamStats?.totalXP || 0;
    const milestones = [100, 500, 1000, 2000, 5000];
    const nextMilestone = milestones.find(m => m > xp);
    if (nextMilestone && nextMilestone - xp <= 50) {
        notifications.push({
            id: 'xp_milestone',
            type: 'trophy',
            title: `${nextMilestone - xp} XP sonra yeni seviye!`,
            body: `${nextMilestone} XP milestone'una çok yakınsın. Bugün bir görev daha tamamla!`,
            time: now - 900000,
            action: 'badges',
            actionLabel: 'Rozetlerimi Gör',
        });
    }

    // 6. Çalışma önerisi (boş günler)
    if (!studiedToday && pendingTasks.length > 0) {
        notifications.push({
            id: 'study_reminder',
            type: 'target',
            title: 'Bugün henüz çalışmadın',
            body: `${pendingTasks.length} görev seni bekliyor. 25 dakikalık bir Pomodoro ile başla.`,
            time: now - 1800000,
            action: 'home',
            actionLabel: 'Şimdi Başla',
        });
    }

    return notifications.sort((a, b) => b.time - a.time).slice(0, 8);
};

// ─── Bildirim Kuralları (Koç) ─────────────────────────────────
const generateCoachNotifications = (students, tasks, messages) => {
    const notifications = [];
    const now = Date.now();

    // Risk alarm
    try {
        const results = JSON.parse(localStorage.getItem('v2_results_data') || '[]');
        const riskStudents = students.filter(s => {
            const sResults = results.filter(r => String(r.student || '').toLowerCase().includes(String(s.name || '').toLowerCase().split(' ')[0].toLowerCase()));
            if (sResults.length < 2) return false;
            const lastNet = parseFloat(sResults[sResults.length - 1]?.totalNet || 0);
            const prevNet = parseFloat(sResults[sResults.length - 2]?.totalNet || 1);
            return lastNet < prevNet * 0.8; // %20+ düşüş
        });
        if (riskStudents.length > 0) {
            notifications.push({
                id: 'coach_risk',
                type: 'danger',
                title: `🚨 ${riskStudents.length} öğrenci risk altında`,
                body: `${riskStudents.slice(0, 2).map(s => s.name?.split(' ')[0]).join(', ')} ve diğerleri büyük net düşüşü yaşadı.`,
                time: now,
                action: 'risk',
                actionLabel: 'Risk Panelini Aç',
            });
        }
    } catch { }

    // Okunmamış mesaj
    const coachUnread = messages?.filter(m => m.sender === 'student' && !m.coachRead);
    if (coachUnread?.length > 0) {
        notifications.push({
            id: 'coach_messages',
            type: 'message',
            title: `${coachUnread.length} öğrenciden mesaj`,
            body: coachUnread[0]?.text?.substring(0, 60) + '...',
            time: now - 300000,
            action: 'messages',
            actionLabel: 'Mesajları Gör',
        });
    }

    // Aktif olmayan öğrenciler (3+ gün giriş yapmamış)
    const inactiveStudents = students.filter(s => {
        try {
            const gamKey = `gamification_stats_${s.id || s.schoolNumber}`;
            const gam = JSON.parse(localStorage.getItem(gamKey) || '{}');
            if (!gam.lastActivityDate) return false;
            const daysSince = (now - new Date(gam.lastActivityDate)) / (1000 * 60 * 60 * 24);
            return daysSince >= 3;
        } catch { return false; }
    });

    if (inactiveStudents.length > 0) {
        notifications.push({
            id: 'coach_inactive',
            type: 'warning',
            title: `${inactiveStudents.length} öğrenci 3+ gündür çalışmadı`,
            body: `${inactiveStudents.slice(0, 3).map(s => s.name?.split(' ')[0]).join(', ')} son 3 günde giriş yapmadı.`,
            time: now - 600000,
            action: 'overview',
            actionLabel: 'Öğrenci Listesi',
        });
    }

    // Tamamlanmayan görevler
    const pendingTaskCount = tasks?.filter(t => !t.completed && t.status !== 'Tamamlandı').length || 0;
    if (pendingTaskCount > 10) {
        notifications.push({
            id: 'coach_tasks',
            type: 'info',
            title: `${pendingTaskCount} görev tamamlanmayı bekliyor`,
            body: 'Öğrencilere atanan görevlerin büyük çoğunluğu henüz tamamlanmadı.',
            time: now - 900000,
            action: 'overview',
            actionLabel: 'Genel Bakış',
        });
    }

    // Yeni başarı
    if (students.length > 0) {
        notifications.push({
            id: 'coach_team',
            type: 'trophy',
            title: `Ekibinde ${students.length} aktif öğrenci`,
            body: 'Tüm öğrencilerin performansını Risk Alarm Paneli ile takip et.',
            time: now - 3600000,
            action: 'risk',
            actionLabel: 'Risk Panelini Aç',
        });
    }

    return notifications.sort((a, b) => b.time - a.time).slice(0, 8);
};

// ─── Zaman Formatlama ─────────────────────────────────────────
const timeAgo = (timestamp) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Az önce';
    if (mins < 60) return `${mins} dk önce`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} saat önce`;
    return `${Math.floor(hrs / 24)} gün önce`;
};

// ─── Bildirim Kartı ───────────────────────────────────────────
const NotifCard = ({ notif, onDismiss, onAction }) => {
    const cfg = NOTIF_CONFIG[notif.type] || NOTIF_CONFIG.info;
    const IconComp = cfg.icon;

    return (
        <div className={`${cfg.bg} border ${cfg.border} rounded-xl p-3.5 flex gap-3 group animate-fade-in`}>
            <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center bg-surface/60`}>
                <IconComp size={15} className={cfg.iconColor} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-ink leading-snug">{notif.title}</p>
                {notif.body && <p className="text-xs text-ink-2 mt-0.5 leading-relaxed line-clamp-2">{notif.body}</p>}
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-ink-3">{timeAgo(notif.time)}</span>
                    {notif.actionLabel && (
                        <button
                            onClick={() => onAction?.(notif.action)}
                            className={`text-xs font-bold px-2 py-0.5 rounded-lg bg-surface/70 hover:bg-surface transition ${cfg.iconColor}`}
                        >
                            {notif.actionLabel} →
                        </button>
                    )}
                </div>
            </div>
            <button
                onClick={() => onDismiss(notif.id)}
                className="opacity-0 group-hover:opacity-100 transition text-ink-3 hover:text-ink-2 flex-shrink-0 self-start"
            >
                <X size={13} />
            </button>
        </div>
    );
};

// ─── Ana Bildirim Zili ────────────────────────────────────────
const SmartNotificationBell = ({
    role = 'student',        // 'student' | 'coach'
    user = null,
    tasks = [],
    messages = [],
    examData = [],
    gamStats = {},
    students = [],           // koç için
    onAction = null,         // sekme geçişi callback'i
}) => {
    const [open, setOpen] = useState(false);
    const [dismissed, setDismissed] = useState(() => {
        try { return JSON.parse(localStorage.getItem('dismissed_notifs') || '[]'); } catch { return []; }
    });

    // Bildirimleri hesapla
    const rawNotifs = role === 'coach'
        ? generateCoachNotifications(students, tasks, messages)
        : generateStudentNotifications(user, tasks, messages, examData, gamStats);

    const notifications = rawNotifs.filter(n => !dismissed.includes(n.id));
    const unreadCount = notifications.length;

    const handleDismiss = useCallback((id) => {
        setDismissed(prev => {
            const next = [...prev, id];
            localStorage.setItem('dismissed_notifs', JSON.stringify(next));
            return next;
        });
    }, []);

    const handleDismissAll = () => {
        const ids = notifications.map(n => n.id);
        setDismissed(prev => {
            const next = [...prev, ...ids];
            localStorage.setItem('dismissed_notifs', JSON.stringify(next));
            return next;
        });
    };

    const handleAction = (action) => {
        setOpen(false);
        onAction?.(action);
    };

    // Outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (!e.target.closest('[data-notif-panel]')) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div className="relative" data-notif-panel style={{ isolation: 'isolate' }}>
            {/* Zil Butonu */}
            <button
                onClick={() => setOpen(o => !o)}
                className={`relative p-2 rounded-xl transition ${open ? 'bg-surface-3' : 'hover:bg-surface-3'} text-ink-2 hover:text-ink-2`}
                title="Bildirimler"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Panel - Fixed overlay, mobilde ekranın ortasında, masaüstünde sağda */}
            {open && (
                <>
                    {/* Backdrop - sadece mobil */}
                    <div
                        className="fixed inset-0 z-toast bg-black/20 md:hidden"
                        onClick={() => setOpen(false)}
                    />
                    <div
                        className="
                            fixed z-notify bg-surface rounded-2xl shadow-2xl border border-line overflow-hidden animate-scale-in
                            top-[4.5rem] right-2 left-2
                            md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:w-96
                        "
                        style={{ maxHeight: 'calc(100vh - 6rem)' }}
                    >
                        {/* Header */}
                        <div className="on-color px-4 py-3 border-b border-line flex items-center justify-between bg-gradient-to-r from-brand to-violet-600">
                            <div>
                                <h3 className="font-black text-ink text-sm">Bildirimler</h3>
                                <p className="text-xs text-ink-2">{unreadCount} yeni bildirim</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleDismissAll}
                                        className="text-xs text-ink-2 hover:text-ink font-bold flex items-center gap-1 bg-surface/10 hover:bg-surface/20 px-2 py-1 rounded-lg transition"
                                    >
                                        <Check size={12} /> Tümünü Oku
                                    </button>
                                )}
                                <button onClick={() => setOpen(false)} className="text-ink-2 hover:text-ink p-1 hover:bg-surface/10 rounded-lg transition">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Bildirim Listesi */}
                        <div className="overflow-y-auto p-3 space-y-2" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
                            {notifications.length === 0 ? (
                                <div className="text-center py-10">
                                    <Bell size={32} className="mx-auto mb-2 text-ink-3" />
                                    <p className="text-sm text-ink-3 font-medium">Yeni bildirim yok</p>
                                    <p className="text-xs text-ink-3 mt-0.5">İyi çalışmalar! 🎯</p>
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <NotifCard
                                        key={n.id}
                                        notif={n}
                                        onDismiss={handleDismiss}
                                        onAction={handleAction}
                                    />
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="border-t border-line px-4 py-2.5 bg-surface-2 text-center">
                                <button
                                    onClick={handleDismissAll}
                                    className="text-xs text-ink-3 hover:text-ink-2 transition"
                                >
                                    Tümünü okundu işaretle
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default SmartNotificationBell;
