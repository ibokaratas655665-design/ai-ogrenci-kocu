import React, { useState, useEffect } from 'react';
import { ACHIEVEMENTS, TIER_COLORS } from '../../data/achievements';
import { checkAllAchievements } from '../../services/gamificationService';
import ConfettiEffect from '../ui/ConfettiEffect';

const AchievementSystem = ({ userStats, earnedAchievements = [], onNewAchievement }) => {
    const [showPopup, setShowPopup] = useState(false);
    const [newAchievement, setNewAchievement] = useState(null);
    const [selectedTab, setSelectedTab] = useState('all');

    useEffect(() => {
        // Yeni rozetleri kontrol et
        const newlyEarned = checkAllAchievements(userStats, earnedAchievements);

        if (newlyEarned.length > 0) {
            // İlk yeni rozeti göster
            setNewAchievement(newlyEarned[0]);
            setShowPopup(true);

            // Parent'a bildir
            if (onNewAchievement) {
                onNewAchievement(newlyEarned[0]);
            }
        }
    }, [userStats]);

    const handleClosePopup = () => {
        setShowPopup(false);
        setTimeout(() => setNewAchievement(null), 300);
    };

    // Rozetleri kategoriye göre filtrele
    const getFilteredAchievements = () => {
        if (selectedTab === 'all') return ACHIEVEMENTS;
        if (selectedTab === 'earned') return ACHIEVEMENTS.filter(a => earnedAchievements.includes(a.id));
        return ACHIEVEMENTS.filter(a => a.type === selectedTab);
    };

    const filteredAchievements = getFilteredAchievements();
    const earnedCount = earnedAchievements.length;
    const totalCount = ACHIEVEMENTS.length;
    const completionPercent = Math.floor((earnedCount / totalCount) * 100);

    return (
        <div className="achievement-system">
            {/* Başarı Popup */}
            {showPopup && newAchievement && (
                <>
                    <ConfettiEffect />
                    <div className="achievement-popup-overlay" onClick={handleClosePopup}>
                        <div className="achievement-popup" onClick={(e) => e.stopPropagation()}>
                            <div className="popup-header">
                                <h2>🎉 Yeni Başarı!</h2>
                            </div>

                            <div className="popup-content">
                                <div className="achievement-icon-large">
                                    {newAchievement.icon}
                                </div>

                                <h3>{newAchievement.name}</h3>
                                <p>{newAchievement.description}</p>

                                <div className="xp-reward">
                                    <span className="xp-badge">+{newAchievement.xpReward} XP</span>
                                </div>
                            </div>

                            <button className="popup-close-btn" onClick={handleClosePopup}>
                                Harika!
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Rozet Koleksiyonu */}
            <div className="achievement-header">
                <h2>🏆 Rozetlerim</h2>
                <div className="achievement-progress">
                    <span className="progress-text">
                        {earnedCount} / {totalCount} Rozet
                    </span>
                    <div className="progress-bar-small">
                        <div
                            className="progress-fill"
                            style={{ width: `${completionPercent}%` }}
                        ></div>
                    </div>
                    <span className="progress-percent">{completionPercent}%</span>
                </div>
            </div>

            {/* Filtre Tabları */}
            <div className="achievement-tabs">
                <button
                    className={`tab ${selectedTab === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedTab('all')}
                >
                    Tümü
                </button>
                <button
                    className={`tab ${selectedTab === 'earned' ? 'active' : ''}`}
                    onClick={() => setSelectedTab('earned')}
                >
                    Kazanılanlar
                </button>
                <button
                    className={`tab ${selectedTab === 'study_hours' ? 'active' : ''}`}
                    onClick={() => setSelectedTab('study_hours')}
                >
                    Çalışma
                </button>
                <button
                    className={`tab ${selectedTab === 'streak' ? 'active' : ''}`}
                    onClick={() => setSelectedTab('streak')}
                >
                    Seri
                </button>
                <button
                    className={`tab ${selectedTab === 'exam_score' ? 'active' : ''}`}
                    onClick={() => setSelectedTab('exam_score')}
                >
                    Sınav
                </button>
            </div>

            {/* Rozet Listesi */}
            <div className="achievement-grid">
                {filteredAchievements.map((achievement) => {
                    const isEarned = earnedAchievements.includes(achievement.id);

                    return (
                        <div
                            key={achievement.id}
                            className={`achievement-card ${isEarned ? 'earned' : 'locked'}`}
                            style={{
                                borderColor: isEarned ? TIER_COLORS[achievement.tier] : '#333'
                            }}
                        >
                            <div className="achievement-icon">
                                <span className={isEarned ? 'icon-earned' : 'icon-locked'}>
                                    {achievement.icon}
                                </span>
                            </div>

                            <div className="achievement-info">
                                <h4>{achievement.name}</h4>
                                <p>{achievement.description}</p>

                                <div className="achievement-footer">
                                    <span className="tier-badge" style={{
                                        backgroundColor: TIER_COLORS[achievement.tier],
                                        color: achievement.tier === 'gold' || achievement.tier === 'platinum' ? '#000' : '#fff'
                                    }}>
                                        {achievement.tier.toUpperCase()}
                                    </span>

                                    <span className="xp-value">
                                        {achievement.xpReward} XP
                                    </span>
                                </div>
                            </div>

                            {isEarned && (
                                <div className="earned-badge">✓</div>
                            )}
                        </div>
                    );
                })}
            </div>

            {filteredAchievements.length === 0 && (
                <div className="no-achievements">
                    <p>Bu kategoride henüz rozet yok.</p>
                </div>
            )}
        </div>
    );
};

export default AchievementSystem;
