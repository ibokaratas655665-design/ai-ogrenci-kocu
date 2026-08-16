import React from 'react';
import { calculateLevel, getLevelProgress, getXPForNextLevel } from '../../services/gamificationService';

const LevelSystem = ({ totalXP = 0, showDetails = true }) => {
    const currentLevel = calculateLevel(totalXP);
    const progress = getLevelProgress(totalXP);
    const nextLevelXP = getXPForNextLevel(totalXP);
    const currentLevelXP = totalXP;

    return (
        <div className="level-system">
            <div className="level-header">
                <div className="level-badge">
                    <div className="level-number">{currentLevel}</div>
                    <span className="level-label">Seviye</span>
                </div>

                {showDetails && (
                    <div className="xp-info">
                        <span className="xp-value">{totalXP.toLocaleString('tr-TR')} XP</span>
                    </div>
                )}
            </div>

            <div className="level-progress-container">
                <div className="progress-bar-wrapper">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="progress-shine"></div>
                    </div>
                </div>

                <div className="progress-labels">
                    <span className="progress-percent">{progress}%</span>
                    <span className="next-level-info">
                        Seviye {currentLevel + 1} için {(nextLevelXP - currentLevelXP).toLocaleString('tr-TR')} XP kaldı
                    </span>
                </div>
            </div>

            {currentLevel > 1 && (
                <div className="level-perks">
                    <h4>🎉 Seviye {currentLevel} Avantajları</h4>
                    <ul>
                        {getLevelPerks(currentLevel).map((perk, index) => (
                            <li key={index}>{perk}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

// Seviye başına açılan avantajlar
const getLevelPerks = (level) => {
    const perks = {
        2: ['Rozet koleksiyonuna erişim'],
        3: ['Haftalık liderlik tablosunda görünürlük'],
        5: ['Özel rozet: Azimli Öğrenci'],
        7: ['Gelişmiş istatistik grafikleri'],
        10: ['Premium profil çerçevesi'],
        15: ['Özel başarı rozeti: Eğitim Ustası'],
        20: ['VIP öğrenci statüsü'],
    };

    return perks[level] || ['Tebrikler! Yeni seviyeye ulaştın! 🎊'];
};

export default LevelSystem;
