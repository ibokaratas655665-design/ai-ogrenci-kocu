import React, { useState } from 'react';
import { Trophy, Medal, Award, TrendingUp, Star } from 'lucide-react';

const LeaderboardTab = ({ students }) => {
    // Calculate scores from exam data
    const [scoreType, setScoreType] = useState('overall'); // overall, weekly, monthly

    const calculateScores = () => {
        return students.map(student => {
            // Get student exam data from localStorage
            const examsData = JSON.parse(localStorage.getItem('exams_data') || '[]');
            const studentExams = examsData.filter(exam => exam.student === student.name);

            const avgScore = studentExams.length > 0
                ? studentExams.reduce((sum, exam) => sum + (exam.total || 0), 0) / studentExams.length
                : 0;

            // Get completed tasks
            const tasks = JSON.parse(localStorage.getItem('student_tasks') || '{}');
            const studentTasks = tasks[student.id] || [];
            const completedTasks = studentTasks.filter(t => t.completed).length;

            // Get pomodoro sessions
            const pomodoroKey = `pomodoro_${student.id}`;
            const pomodoros = parseInt(localStorage.getItem(pomodoroKey) || '0');

            // Calculate overall score
            const score = Math.round(
                (avgScore * 0.6) + // 60% exam performance
                (completedTasks * 10 * 0.3) + // 30% task completion
                (pomodoros * 2 * 0.1) // 10% study time
            );

            return {
                ...student,
                score,
                avgScore: Math.round(avgScore),
                completedTasks,
                pomodoros,
                examsCount: studentExams.length
            };
        }).sort((a, b) => b.score - a.score);
    };

    const rankedStudents = calculateScores();

    const getMedalIcon = (rank) => {
        switch (rank) {
            case 1: return <Trophy className="text-warn" size={32} />;
            case 2: return <Medal className="text-ink-3" size={28} />;
            case 3: return <Medal className="text-warn" size={24} />;
            default: return <Award className="text-ink-3" size={20} />;
        }
    };

    const getRankColor = (rank) => {
        switch (rank) {
            case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-ink';
            case 2: return 'bg-gradient-to-r from-gray-300 to-gray-500 text-ink';
            case 3: return 'bg-gradient-to-r from-orange-400 to-orange-600 text-ink';
            default: return 'bg-surface text-ink';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-ink flex items-center gap-3">
                    <Trophy className="text-warn" size={32} />
                    Liderlik Tablosu
                </h2>
                <select
                    value={scoreType}
                    onChange={(e) => setScoreType(e.target.value)}
                    className="px-4 py-2 border border-line-2 rounded-lg focus:ring-2 focus:ring-yellow-500"
                >
                    <option value="overall">Genel Sıralama</option>
                    <option value="weekly">Haftalık</option>
                    <option value="monthly">Aylık</option>
                </select>
            </div>

            {/* Top 3 Podium */}
            {rankedStudents.length >= 3 && (
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {/* 2nd Place */}
                    <div className="flex flex-col items-center justify-end pt-8">
                        <div className="glass-card p-6 text-center w-full">
                            <Medal className="text-ink-3 mx-auto mb-2" size={40} />
                            <h3 className="font-bold text-ink mb-1">{rankedStudents[1].name}</h3>
                            <p className="text-2xl font-black text-ink-2">{rankedStudents[1].score}</p>
                            <p className="text-xs text-ink-2 mt-2">2. Sıra</p>
                        </div>
                        <div className="on-color w-full bg-gradient-to-t from-gray-300 to-gray-500 h-24 rounded-t-lg mt-2"></div>
                    </div>

                    {/* 1st Place */}
                    <div className="flex flex-col items-center justify-end">
                        <div className="glass-card p-6 text-center w-full border-4 border-yellow-400 relative">
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                                <div className="bg-yellow-400 rounded-full p-3">
                                    <Trophy className="text-ink" size={32} />
                                </div>
                            </div>
                            <div className="mt-4">
                                <h3 className="font-bold text-ink mb-1 text-lg">{rankedStudents[0].name}</h3>
                                <p className="text-3xl font-black text-warn">{rankedStudents[0].score}</p>
                                <p className="text-xs text-warn mt-2 font-bold">🏆 1. SIRA</p>
                            </div>
                        </div>
                        <div className="w-full bg-gradient-to-t from-yellow-400 to-yellow-600 h-32 rounded-t-lg mt-2"></div>
                    </div>

                    {/* 3rd Place */}
                    <div className="flex flex-col items-center justify-end pt-16">
                        <div className="glass-card p-6 text-center w-full">
                            <Medal className="text-warn mx-auto mb-2" size={36} />
                            <h3 className="font-bold text-ink mb-1">{rankedStudents[2].name}</h3>
                            <p className="text-2xl font-black text-warn">{rankedStudents[2].score}</p>
                            <p className="text-xs text-ink-2 mt-2">3. Sıra</p>
                        </div>
                        <div className="on-color w-full bg-gradient-to-t from-orange-400 to-orange-600 h-16 rounded-t-lg mt-2"></div>
                    </div>
                </div>
            )}

            {/* Full Leaderboard */}
            <div className="glass-card overflow-hidden">
                <div className="on-color bg-gradient-to-r from-yellow-500 to-orange-500 p-4">
                    <h3 className="text-ink font-bold">Tüm Öğrenciler</h3>
                </div>
                <div className="divide-y divide-line">
                    {rankedStudents.map((student, index) => (
                        <div key={student.id} className={`p-4 flex items-center gap-4 hover:bg-surface-2 transition ${index < 3 ? 'bg-warn-soft/50' : ''}`}>
                            <div className="w-12 h-12 flex items-center justify-center font-black text-xl">
                                {index < 3 ? getMedalIcon(index + 1) : <span className="text-ink-3">#{index + 1}</span>}
                            </div>

                            <div className="flex-1">
                                <h4 className="font-bold text-ink">{student.name}</h4>
                                <div className="flex gap-4 text-xs text-ink-2 mt-1">
                                    <span>📊 Ortalama: {student.avgScore}</span>
                                    <span>✅ Görevler: {student.completedTasks}</span>
                                    <span>🍅 Pomodoro: {student.pomodoros}</span>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-2xl font-black text-ink">{student.score}</div>
                                <div className="text-xs text-ink-2">puan</div>
                            </div>

                            {index === 0 && <Star className="text-warn animate-pulse" size={24} />}
                        </div>
                    ))}
                </div>
            </div>

            {rankedStudents.length === 0 && (
                <div className="glass-card p-12 text-center">
                    <Trophy size={64} className="mx-auto text-ink-3 mb-4" />
                    <p className="text-ink-2">Henüz sıralama verisi yok</p>
                    <p className="text-sm text-ink-3 mt-2">Öğrenciler sınav girip görev tamamladıkça sıralama oluşacak</p>
                </div>
            )}
        </div>
    );
};

export default LeaderboardTab;
