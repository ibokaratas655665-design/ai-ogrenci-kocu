import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, TrendingUp } from 'lucide-react';
import { calculateLeaderboardScore } from '../../services/gamificationService';

const Leaderboard = ({ students = [], currentUserId, timeframe = 'weekly' }) => {
    const [selectedCategory, setSelectedCategory] = useState('overall');
    const [sortedStudents, setSortedStudents] = useState([]);

    useEffect(() => {
        // Öğrencileri sırala
        const sorted = [...students].sort((a, b) => {
            if (selectedCategory === 'overall') {
                return calculateLeaderboardScore(b.stats || {}) - calculateLeaderboardScore(a.stats || {});
            } else if (selectedCategory === 'streak') {
                return (b.stats?.currentStreak || 0) - (a.stats?.currentStreak || 0);
            } else if (selectedCategory === 'xp') {
                return (b.stats?.totalXP || 0) - (a.stats?.totalXP || 0);
            } else if (selectedCategory === 'study_hours') {
                return (b.stats?.totalStudyHours || 0) - (a.stats?.totalStudyHours || 0);
            }
            return 0;
        });

        setSortedStudents(sorted);
    }, [students, selectedCategory]);

    const getRankIcon = (rank) => {
        if (rank === 1) return <Trophy className="rank-icon gold" />;
        if (rank === 2) return <Medal className="rank-icon silver" />;
        if (rank === 3) return <Medal className="rank-icon bronze" />;
        return <span className="rank-number">{rank}</span>;
    };

    const getCategoryValue = (student) => {
        const stats = student.stats || {};

        switch (selectedCategory) {
            case 'overall':
                return calculateLeaderboardScore(stats);
            case 'streak':
                return `${stats.currentStreak || 0} gün`;
            case 'xp':
                return `${(stats.totalXP || 0).toLocaleString('tr-TR')} XP`;
            case 'study_hours':
                return `${stats.totalStudyHours || 0} saat`;
            default:
                return '';
        }
    };

    return (
        <div className="leaderboard">
            <div className="leaderboard-header">
                <h2>🏆 Liderlik Tablosu</h2>

                <div className="timeframe-selector">
                    <button
                        className={timeframe === 'weekly' ? 'active' : ''}
                        disabled={timeframe === 'weekly'}
                    >
                        Haftalık
                    </button>
                    <button
                        className={timeframe === 'monthly' ? 'active' : ''}
                        disabled={timeframe === 'monthly'}
                    >
                        Aylık
                    </button>
                    <button
                        className={timeframe === 'all_time' ? 'active' : ''}
                        disabled={timeframe === 'all_time'}
                    >
                        Tüm Zamanlar
                    </button>
                </div>
            </div>

            <div className="category-selector">
                <button
                    className={selectedCategory === 'overall' ? 'active' : ''}
                    onClick={() => setSelectedCategory('overall')}
                >
                    <Star size={16} />
                    Genel
                </button>
                <button
                    className={selectedCategory === 'xp' ? 'active' : ''}
                    onClick={() => setSelectedCategory('xp')}
                >
                    <TrendingUp size={16} />
                    XP
                </button>
                <button
                    className={selectedCategory === 'streak' ? 'active' : ''}
                    onClick={() => setSelectedCategory('streak')}
                >
                    🔥 Seri
                </button>
                <button
                    className={selectedCategory === 'study_hours' ? 'active' : ''}
                    onClick={() => setSelectedCategory('study_hours')}
                >
                    📚 Çalışma
                </button>
            </div>

            <div className="leaderboard-list">
                {/* Top 3 Özel Gösterim */}
                <div className="top-three">
                    {sortedStudents.slice(0, 3).map((student, index) => (
                        <div
                            key={student.id}
                            className={`podium-item rank-${index + 1} ${student.id === currentUserId ? 'current-user' : ''
                                }`}
                        >
                            <div className="podium-icon">
                                {getRankIcon(index + 1)}
                            </div>

                            <div className="student-avatar">
                                {student.name?.charAt(0) || '?'}
                            </div>

                            <div className="student-info">
                                <h4>{student.name || 'Öğrenci'}</h4>
                                <p className="score">{getCategoryValue(student)}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Diğer Sıralamalar */}
                <div className="other-ranks">
                    {sortedStudents.slice(3).map((student, index) => (
                        <div
                            key={student.id}
                            className={`leaderboard-row ${student.id === currentUserId ? 'current-user' : ''
                                }`}
                        >
                            <div className="rank">
                                {getRankIcon(index + 4)}
                            </div>

                            <div className="student-avatar-small">
                                {student.name?.charAt(0) || '?'}
                            </div>

                            <div className="student-name">
                                {student.name || 'Öğrenci'}
                            </div>

                            <div className="score">
                                {getCategoryValue(student)}
                            </div>
                        </div>
                    ))}
                </div>

                {sortedStudents.length === 0 && (
                    <div className="no-data">
                        <p>Henüz veri yok. İlk sen ol! 💪</p>
                    </div>
                )}
            </div>

            {currentUserId && sortedStudents.length > 0 && (
                <div className="user-position">
                    {(() => {
                        const userIndex = sortedStudents.findIndex(s => s.id === currentUserId);
                        if (userIndex !== -1) {
                            return (
                                <div className="position-info">
                                    <span>Senin Sıralaman: </span>
                                    <strong>{userIndex + 1}. sıra</strong>
                                    <span> / {sortedStudents.length} öğrenci</span>
                                </div>
                            );
                        }
                        return null;
                    })()}
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
