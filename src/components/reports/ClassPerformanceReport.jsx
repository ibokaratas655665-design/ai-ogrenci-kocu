import React from 'react';
import { Award, Users, AlertCircle, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const ClassPerformanceReport = () => {

    // Mock Class Data for Top Students
    const topStudents = [
        { id: 1, name: 'Ayşe Yılmaz', score: 485, net: 102.5 },
        { id: 2, name: 'Mehmet Demir', score: 472, net: 98.0 },
        { id: 3, name: 'Zeynep Kaya', score: 468, net: 96.5 },
    ];

    // Mock Data for Difficult Topics (Topic with lowest success rate across class)
    const difficultTopics = [
        { topic: 'Türev (Mat)', successRate: 12 },
        { topic: 'İntegral (Mat)', successRate: 15 },
        { topic: 'Organik Kimya', successRate: 18 },
        { topic: 'Elektrik ve Manyetizma', successRate: 22 },
        { topic: 'Bitki Biyolojisi', successRate: 25 },
    ];

    // Mock Class Score Distribution
    const distributionData = [
        { range: '0-200', count: 2 },
        { range: '200-300', count: 8 },
        { range: '300-400', count: 15 },
        { range: '400-450', count: 12 },
        { range: '450+', count: 5 },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-brand text-white p-6 rounded-2xl shadow-lg mb-6">
                <h2 className="text-2xl font-bold flex items-center">
                    <Users className="mr-3" />
                    Sınıf Genel Performans Raporu
                </h2>
                <p className="opacity-80 mt-1">Son Deneme (TYT-4) Genel Değerlendirmesi</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Top Performers */}
                <div className="bg-surface p-6 rounded-2xl border border-line shadow-sm">
                    <h3 className="font-bold text-ink mb-4 flex items-center">
                        <Award className="mr-2 text-warn" />
                        Zirvedekiler (İlk 3)
                    </h3>
                    <div className="space-y-4">
                        {topStudents.map((student, index) => (
                            <div key={student.id} className="flex items-center justify-between p-3 bg-warn-soft rounded-xl border border-warn">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-yellow-400 text-ink font-bold flex items-center justify-center mr-3">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <div className="font-bold text-ink">{student.name}</div>
                                        <div className="text-xs text-ink-2">Net: {student.net}</div>
                                    </div>
                                </div>
                                <div className="text-xl font-black text-warn">{student.score}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Difficult Topics */}
                <div className="bg-surface p-6 rounded-2xl border border-line shadow-sm">
                    <h3 className="font-bold text-ink mb-4 flex items-center">
                        <AlertCircle className="mr-2 text-danger" />
                        Sınıfın En Çok Zorlandığı Konular
                    </h3>
                    <div className="space-y-3">
                        {difficultTopics.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <span className="text-sm font-medium text-ink-2">{item.topic}</span>
                                <div className="flex items-center w-1/2">
                                    <div className="w-full bg-surface-3 rounded-full h-2 mr-2">
                                        <div
                                            className="bg-danger h-2 rounded-full"
                                            style={{ width: `${item.successRate}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs font-bold text-danger w-8 text-right">% {item.successRate}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Score Distribution Chart */}
            <div className="bg-surface p-6 rounded-2xl border border-line shadow-sm">
                <h3 className="font-bold text-ink mb-6 flex items-center">
                    <BarChart2 className="mr-2 text-brand" />
                    Sınıf Puan Dağılımı
                </h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={distributionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip cursor={{ fill: '#f3f4f6' }} />
                            <Bar dataKey="count" name="Öğrenci Sayısı" fill="var(--brand)" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default ClassPerformanceReport;
