import React from 'react';
import { Flame, Shield } from 'lucide-react';

const StreakTracker = ({ currentStreak = 0, maxStreak = 0, hasFreeze = false }) => {
    return (
        <div className="streak-tracker">
            <div className="streak-header">
                <Flame className="streak-icon" />
                <h3>Çalışma Serisı</h3>
            </div>

            <div className="streak-content">
                <div className="streak-number">
                    <span className="current-streak">{currentStreak}</span>
                    <span className="streak-label">Gün</span>
                </div>

                <div className="streak-fire-animation">
                    {currentStreak > 0 && (
                        <div className={`fire-effect ${currentStreak >= 7 ? 'fire-intense' : ''}`}>
                            🔥
                        </div>
                    )}
                </div>
            </div>

            <div className="streak-info">
                <div className="max-streak">
                    <span className="label">En Uzun Seri:</span>
                    <span className="value">{maxStreak} gün</span>
                </div>

                {hasFreeze && (
                    <div className="freeze-available">
                        <Shield size={16} />
                        <span>Dondurma Hakkın Var</span>
                    </div>
                )}
            </div>

            <div className="streak-progress">
                <div className="milestone-container">
                    {[7, 30, 100].map((milestone) => (
                        <div
                            key={milestone}
                            className={`milestone ${currentStreak >= milestone ? 'achieved' : ''}`}
                        >
                            <div className="milestone-icon">
                                {currentStreak >= milestone ? '✅' : '⭕'}
                            </div>
                            <span className="milestone-label">{milestone} gün</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="streak-motivation">
                {currentStreak === 0 && (
                    <p>Bugün çalışarak serine başla! 💪</p>
                )}
                {currentStreak > 0 && currentStreak < 7 && (
                    <p>Harika gidiyorsun! {7 - currentStreak} gün daha! 🔥</p>
                )}
                {currentStreak >= 7 && currentStreak < 30 && (
                    <p>Muhteşem! {30 - currentStreak} gün daha 30 güne! ⚡</p>
                )}
                {currentStreak >= 30 && (
                    <p>Efsanesin! Böyle devam! 🌟</p>
                )}
            </div>
        </div>
    );
};

export default StreakTracker;
