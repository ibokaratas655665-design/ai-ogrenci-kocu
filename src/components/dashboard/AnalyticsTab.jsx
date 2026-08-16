import React from 'react';
import PerformanceRadar from '../charts/PerformanceRadar';
import PredictiveAnalytics from '../charts/PredictiveAnalytics';
import { TrendingUp, Users, Award, Target } from 'lucide-react';

const AnalyticsTab = ({ students }) => {
    // Calculate class-wide statistics
    const classStats = {
        totalStudents: students.length,
        avgPerformance: students.length > 0
            ? (students.reduce((sum, s) => sum + (s.progress || 0), 0) / students.length).toFixed(1)
            : 0,
        topPerformers: students.filter(s => (s.progress || 0) >= 80).length,
        needsAttention: students.filter(s => (s.progress || 0) < 50).length
    };

    // Sample performance data for class average
    const classPerformanceData = [
        { subject: 'Matematik', current: 72, target: 85 },
        { subject: 'Fizik', current: 68, target: 80 },
        { subject: 'Kimya', current: 75, target: 82 },
        { subject: 'Biyoloji', current: 78, target: 85 },
        { subject: 'Türkçe', current: 82, target: 88 },
        { subject: 'Tarih', current: 65, target: 75 },
    ];

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-5 border-2 border-brand-line">
                    <div className="flex items-center justify-between mb-2">
                        <Users className="text-brand" size={24} />
                        <span className="text-3xl font-black text-brand">{classStats.totalStudents}</span>
                    </div>
                    <div className="text-sm font-bold text-brand">Toplam Öğrenci</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-5 border-2 border-ok">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="text-ok" size={24} />
                        <span className="text-3xl font-black text-ok">{classStats.avgPerformance}%</span>
                    </div>
                    <div className="text-sm font-bold text-ok">Ortalama Başarı</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-5 border-2 border-[color-mix(in_srgb,var(--c4)_35%,transparent)]">
                    <div className="flex items-center justify-between mb-2">
                        <Award className="text-c4" size={24} />
                        <span className="text-3xl font-black text-c4">{classStats.topPerformers}</span>
                    </div>
                    <div className="text-sm font-bold text-c4">Başarılı Öğrenci</div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-5 border-2 border-warn">
                    <div className="flex items-center justify-between mb-2">
                        <Target className="text-warn" size={24} />
                        <span className="text-3xl font-black text-warn">{classStats.needsAttention}</span>
                    </div>
                    <div className="text-sm font-bold text-warn">Dikkat Gereken</div>
                </div>
            </div>

            {/* Performance Radar for Class */}
            <div className="analytics-fade-in">
                <PerformanceRadar
                    performanceData={classPerformanceData}
                    showLegend={true}
                />
            </div>

            {/* Predictive Analytics for Class */}
            <div className="analytics-fade-in">
                <PredictiveAnalytics
                    targetScore={420}
                    examDate="YKS 2026"
                />
            </div>

            {/* Student Performance List */}
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-line">
                <h3 className="text-xl font-bold text-ink mb-4">Öğrenci Performans Detayları</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-line">
                        <thead className="bg-surface-2">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-black text-ink-2 uppercase tracking-wider">Öğrenci</th>
                                <th className="px-6 py-3 text-left text-xs font-black text-ink-2 uppercase tracking-wider">Sınıf</th>
                                <th className="px-6 py-3 text-left text-xs font-black text-ink-2 uppercase tracking-wider">İlerleme</th>
                                <th className="px-6 py-3 text-left text-xs font-black text-ink-2 uppercase tracking-wider">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-line">
                            {students.length > 0 ? students.map((student, idx) => {
                                const progress = student.progress || 0;
                                const statusConfig = progress >= 80
                                    ? { bg: 'bg-ok-soft', text: 'text-ok', label: 'Mükemmel' }
                                    : progress >= 50
                                        ? { bg: 'bg-warn-soft', text: 'text-warn', label: 'Orta' }
                                        : { bg: 'bg-danger-soft', text: 'text-danger', label: 'Dikkat' };

                                return (
                                    <tr key={idx} className="hover:bg-surface-2 transition">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-ink">{student.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-2">
                                            {student.grade || 'Belirtilmemiş'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-32 bg-surface-3 rounded-full h-2 mr-3">
                                                    <div
                                                        className={`h-2 rounded-full ${progress >= 80 ? 'bg-ok' : progress >= 50 ? 'bg-warn' : 'bg-danger'}`}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-bold text-ink-2">{progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig.bg} ${statusConfig.text}`}>
                                                {statusConfig.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-ink-3">
                                        Henüz öğrenci bulunmamaktadır
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsTab;
