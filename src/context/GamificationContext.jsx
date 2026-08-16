import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BADGES, BadgePopup } from '../components/gamification/BadgeSystem';
import NotificationContext from './NotificationContext';

const GamificationContext = createContext(null);

// XP Olayları — hangi eylem ne kadar XP getiriyor
export const XP_EVENTS = {
    TASK_COMPLETE: { xp: 50, label: 'Görev Tamamlandı' },
    POMODORO_DONE: { xp: 30, label: 'Pomodoro Seansi' },
    EXAM_VIEWED: { xp: 20, label: 'Deneme İncelendi' },
    STREAK_BONUS: { xp: 100, label: 'Günlük Seri Bonusu' },
    LOGIN_DAILY: { xp: 10, label: 'Günlük Giriş' },
    MESSAGE_SENT: { xp: 15, label: 'Mesaj Gönderildi' },
    PROFILE_COMPLETE: { xp: 200, label: 'Profil Tamamlandı' },
};

export const GamificationProvider = ({ children, userId }) => {
    // NotificationContext opsiyonel - olmasa da çalışır
    const notifCtx = useContext(NotificationContext);
    const addNotification = notifCtx?.addNotification || (() => { });

    // ── State ────────────────────────────────────────────────────
    const key = userId ? `gamification_${userId}` : 'gamification_guest';

    const [stats, setStats] = useState(() => {
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : {
                totalXP: 0, totalLogins: 0, examsCompleted: 0,
                tasksCompleted: 0, pomodorosCompleted: 0, totalStudyHours: 0,
                currentStreak: 0, maxStreak: 0, lastStudyDate: null, earnedBadgeIds: [],
            };
        } catch {
            return {
                totalXP: 0, totalLogins: 0, examsCompleted: 0, tasksCompleted: 0,
                pomodorosCompleted: 0, totalStudyHours: 0, currentStreak: 0, maxStreak: 0,
                lastStudyDate: null, earnedBadgeIds: []
            };
        }
    });

    const [pendingBadge, setPendingBadge] = useState(null);

    // ── Persist ───────────────────────────────────────────────────
    useEffect(() => {
        try { localStorage.setItem(key, JSON.stringify(stats)); } catch { /* ignore */ }
    }, [stats, key]);

    // ── Rozet Kontrolü ────────────────────────────────────────────
    const checkBadges = useCallback((newStats) => {
        try {
            const newlyEarned = BADGES.filter(b =>
                !newStats.earnedBadgeIds.includes(b.id) && b.req(newStats)
            );

            if (newlyEarned.length > 0) {
                const badge = newlyEarned[0];
                const xpBonus = badge.xp || 0;

                setStats(prev => {
                    const updated = {
                        ...prev,
                        earnedBadgeIds: [...prev.earnedBadgeIds, ...newlyEarned.map(b => b.id)],
                        totalXP: prev.totalXP + xpBonus,
                    };
                    try { localStorage.setItem(key, JSON.stringify(updated)); } catch { }
                    return updated;
                });

                setPendingBadge(badge);

                addNotification({
                    type: 'achievement',
                    title: `🏅 Yeni Rozet: ${badge.name}`,
                    message: badge.desc + (xpBonus > 0 ? ` (+${xpBonus} XP)` : ''),
                });
            }
        } catch (e) {
            console.warn('Badge check error:', e);
        }
    }, [key, addNotification]);

    // ── XP Ekle ──────────────────────────────────────────────────
    const addXP = useCallback((event) => {
        const ev = XP_EVENTS[event];
        if (!ev) return;
        setStats(prev => {
            const ns = { ...prev, totalXP: prev.totalXP + ev.xp };
            setTimeout(() => checkBadges(ns), 100);
            return ns;
        });
    }, [checkBadges]);

    // ── Görev Tamamla ─────────────────────────────────────────────
    const completeTask = useCallback(() => {
        setStats(prev => {
            const ns = {
                ...prev,
                totalXP: prev.totalXP + XP_EVENTS.TASK_COMPLETE.xp,
                tasksCompleted: prev.tasksCompleted + 1
            };
            checkBadges(ns);
            return ns;
        });
    }, [checkBadges]);

    // ── Pomodoro Tamamla ──────────────────────────────────────────
    const completePomodoro = useCallback((durationMin = 25) => {
        setStats(prev => {
            const ns = {
                ...prev,
                totalXP: prev.totalXP + XP_EVENTS.POMODORO_DONE.xp,
                pomodorosCompleted: prev.pomodorosCompleted + 1,
                totalStudyHours: prev.totalStudyHours + durationMin / 60,
            };
            checkBadges(ns);
            return ns;
        });
    }, [checkBadges]);

    // ── Günlük Giriş ──────────────────────────────────────────────
    const recordDailyLogin = useCallback(() => {
        setStats(prev => {
            const today = new Date().toDateString();
            if (prev.lastStudyDate === today) return prev;

            const yesterday = new Date(Date.now() - 86400000).toDateString();
            const streakContinues = prev.lastStudyDate === yesterday;
            const newStreak = streakContinues ? prev.currentStreak + 1 : 1;
            const maxStreak = Math.max(prev.maxStreak, newStreak);
            const bonusXP = newStreak > 1 ? XP_EVENTS.STREAK_BONUS.xp : 0;

            const ns = {
                ...prev,
                totalXP: prev.totalXP + XP_EVENTS.LOGIN_DAILY.xp + bonusXP,
                totalLogins: prev.totalLogins + 1,
                currentStreak: newStreak,
                maxStreak,
                lastStudyDate: today,
            };
            checkBadges(ns);
            return ns;
        });
    }, [checkBadges]);

    // ── Deneme İzle ───────────────────────────────────────────────
    const recordExamView = useCallback(() => {
        setStats(prev => {
            const ns = {
                ...prev,
                totalXP: prev.totalXP + XP_EVENTS.EXAM_VIEWED.xp,
                examsCompleted: prev.examsCompleted + 1,
            };
            checkBadges(ns);
            return ns;
        });
    }, [checkBadges]);

    return (
        <GamificationContext.Provider value={{ stats, addXP, completeTask, completePomodoro, recordDailyLogin, recordExamView }}>
            {children}
            {pendingBadge && (
                <BadgePopup badge={pendingBadge} onClose={() => setPendingBadge(null)} />
            )}
        </GamificationContext.Provider>
    );
};

export const useGamification = () => {
    const ctx = useContext(GamificationContext);
    if (!ctx) throw new Error('useGamification must be used within GamificationProvider');
    return ctx;
};
