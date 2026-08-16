import { ACHIEVEMENTS, ACHIEVEMENT_TYPES, LEVEL_THRESHOLDS } from '../data/achievements';

/**
 * Gamification Service
 * Rozet, seviye, streak ve XP hesaplamalarını yönetir
 */

// XP hesaplama fonksiyonları
export const calculateXP = {
    // Çalışma saati başına XP
    studyHour: (hours) => Math.floor(hours * 10),

    // Görev tamamlama XP
    taskComplete: () => 15,

    // Deneme sınavı tamamlama XP (puana göre)
    examComplete: (score) => Math.floor(score / 2),

    // Pomodoro tamamlama XP
    pomodoroComplete: () => 5,

    // Streak bonus XP (günlere göre artan)
    streakBonus: (days) => {
        if (days >= 100) return 20;
        if (days >= 30) return 15;
        if (days >= 7) return 10;
        return 5;
    },
};

// Seviye hesaplama
export const calculateLevel = (totalXP) => {
    let currentLevel = 1;

    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (totalXP >= LEVEL_THRESHOLDS[i].xpRequired) {
            currentLevel = LEVEL_THRESHOLDS[i].level;
            break;
        }
    }

    return currentLevel;
};

// Bir sonraki seviye için gereken XP
export const getXPForNextLevel = (currentXP) => {
    const currentLevel = calculateLevel(currentXP);
    const nextLevelIndex = LEVEL_THRESHOLDS.findIndex(l => l.level === currentLevel + 1);

    if (nextLevelIndex === -1) {
        return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].xpRequired;
    }

    return LEVEL_THRESHOLDS[nextLevelIndex].xpRequired;
};

// Mevcut seviye için ilerleme yüzdesi
export const getLevelProgress = (currentXP) => {
    const currentLevel = calculateLevel(currentXP);
    const currentLevelXP = LEVEL_THRESHOLDS.find(l => l.level === currentLevel)?.xpRequired || 0;
    const nextLevelXP = getXPForNextLevel(currentXP);

    const progressXP = currentXP - currentLevelXP;
    const requiredXP = nextLevelXP - currentLevelXP;

    return Math.min(100, Math.floor((progressXP / requiredXP) * 100));
};

// Rozet kontrolü - kullanıcının bir rozeti kazanıp kazanmadığını kontrol et
export const checkAchievement = (achievementId, userStats) => {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return false;

    switch (achievement.type) {
        case ACHIEVEMENT_TYPES.STUDY_HOURS:
            return (userStats.totalStudyHours || 0) >= achievement.requirement;

        case ACHIEVEMENT_TYPES.STREAK:
            return (userStats.currentStreak || 0) >= achievement.requirement;

        case ACHIEVEMENT_TYPES.EXAM_SCORE:
            if (achievement.id === 'exam_first') {
                return (userStats.examsCompleted || 0) >= 1;
            }
            return (userStats.bestExamScore || 0) >= achievement.requirement;

        case ACHIEVEMENT_TYPES.TASKS_COMPLETED:
            return (userStats.tasksCompleted || 0) >= achievement.requirement;

        case ACHIEVEMENT_TYPES.POMODORO:
            return (userStats.pomodorosCompleted || 0) >= achievement.requirement;

        case ACHIEVEMENT_TYPES.CONSISTENCY:
            return (userStats.consistentWeeks || 0) >= achievement.requirement;

        case ACHIEVEMENT_TYPES.IMPROVEMENT:
            return (userStats.scoreImprovement || 0) >= achievement.requirement;

        case ACHIEVEMENT_TYPES.SOCIAL:
            return (userStats.messagesExchanged || 0) >= achievement.requirement;

        default:
            return false;
    }
};

// Tüm kazanılmış rozetleri kontrol et
export const checkAllAchievements = (userStats, earnedAchievements = []) => {
    const newlyEarned = [];

    ACHIEVEMENTS.forEach(achievement => {
        // Daha önce kazanılmamış ve şartları sağlayan rozetler
        if (!earnedAchievements.includes(achievement.id) &&
            checkAchievement(achievement.id, userStats)) {
            newlyEarned.push(achievement);
        }
    });

    return newlyEarned;
};

// Streak hesaplama
export const calculateStreak = (lastActivityDate) => {
    if (!lastActivityDate) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastDate = new Date(lastActivityDate);
    lastDate.setHours(0, 0, 0, 0);

    const diffTime = today - lastDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Bugün veya dün aktivite varsa streak devam ediyor
    return diffDays <= 1;
};

// Streak güncelleme
export const updateStreak = (currentStreak, lastActivityDate, hasActivityToday) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!lastActivityDate) {
        // İlk aktivite
        return hasActivityToday ? 1 : 0;
    }

    const lastDate = new Date(lastActivityDate);
    lastDate.setHours(0, 0, 0, 0);

    const diffTime = today - lastDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        // Aynı gün
        return currentStreak;
    } else if (diffDays === 1 && hasActivityToday) {
        // Ardışık gün
        return currentStreak + 1;
    } else if (diffDays > 1) {
        // Streak kırıldı
        return hasActivityToday ? 1 : 0;
    }

    return currentStreak;
};

// Leaderboard sıralaması için puan hesaplama
export const calculateLeaderboardScore = (userStats) => {
    return (
        (userStats.totalXP || 0) +
        (userStats.currentStreak || 0) * 50 +
        (userStats.tasksCompleted || 0) * 10 +
        (userStats.examsCompleted || 0) * 100
    );
};

// Kullanıcı istatistiklerini güncelle
export const updateUserStats = (currentStats, activity) => {
    const updatedStats = { ...currentStats };

    switch (activity.type) {
        case 'study':
            updatedStats.totalStudyHours = (updatedStats.totalStudyHours || 0) + activity.hours;
            updatedStats.totalXP = (updatedStats.totalXP || 0) + calculateXP.studyHour(activity.hours);
            break;

        case 'task_complete':
            updatedStats.tasksCompleted = (updatedStats.tasksCompleted || 0) + 1;
            updatedStats.totalXP = (updatedStats.totalXP || 0) + calculateXP.taskComplete();
            break;

        case 'exam_complete':
            updatedStats.examsCompleted = (updatedStats.examsCompleted || 0) + 1;
            updatedStats.bestExamScore = Math.max(updatedStats.bestExamScore || 0, activity.score);
            updatedStats.totalXP = (updatedStats.totalXP || 0) + calculateXP.examComplete(activity.score);

            // Gelişim hesaplama
            if (updatedStats.firstExamScore) {
                updatedStats.scoreImprovement = activity.score - updatedStats.firstExamScore;
            } else {
                updatedStats.firstExamScore = activity.score;
            }
            break;

        case 'pomodoro_complete':
            updatedStats.pomodorosCompleted = (updatedStats.pomodorosCompleted || 0) + 1;
            updatedStats.totalXP = (updatedStats.totalXP || 0) + calculateXP.pomodoroComplete();
            break;

        case 'message_sent':
            updatedStats.messagesExchanged = (updatedStats.messagesExchanged || 0) + 1;
            break;
    }

    // Streak güncelleme
    const hasActivityToday = true; // Aktivite olduğu için
    updatedStats.currentStreak = updateStreak(
        updatedStats.currentStreak || 0,
        updatedStats.lastActivityDate,
        hasActivityToday
    );
    updatedStats.maxStreak = Math.max(updatedStats.maxStreak || 0, updatedStats.currentStreak);
    updatedStats.lastActivityDate = new Date().toISOString();

    // Streak bonus XP
    if (updatedStats.currentStreak > 0) {
        updatedStats.totalXP += calculateXP.streakBonus(updatedStats.currentStreak);
    }

    return updatedStats;
};

export default {
    calculateXP,
    calculateLevel,
    getXPForNextLevel,
    getLevelProgress,
    checkAchievement,
    checkAllAchievements,
    calculateStreak,
    updateStreak,
    calculateLeaderboardScore,
    updateUserStats,
};
