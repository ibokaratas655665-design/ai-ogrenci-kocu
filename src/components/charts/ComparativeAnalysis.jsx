import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, Users, Target, Activity } from 'lucide-react';

const ComparativeAnalysis = ({ studentResults }) => {
    const [viewType, setViewType] = useState('TYT'); // 'TYT' or 'AYT'

    // Mock Class Averages Data
    // In a real app, this would come from the backend based on the specific exam ID.
    // For TYT
    const classAverages = {
        tyt: {
            turkce: 28.5,
            sosyal: 12.4,
            matematik: 18.2,
            fen: 9.8
        },
        ayt: {
            matematik: 22.1,
            fizik: 6.5,
            kimya: 8.2,
            biyoloji: 7.9,
            edebiyat: 16.5,
            tarih1: 4.8,
            cografya1: 3.2
        }
    };

    // Calculate Student Averages (Last Exam or Average of All)
    const chartData = useMemo(() => {
        if (!studentResults || studentResults.length === 0) return null;

        // Use the latest result of selected type
        const typeResults = studentResults.filter(r => (r.examType || r.type || 'TYT') === viewType);
        if (typeResults.length === 0) return null;
        
        const latestResult = typeResults[typeResults.length - 1];

        const data = [];
        if (viewType === 'TYT') {
            const subs = latestResult.subjects || latestResult.tyt || {};
            data.push({ subject: 'Türkçe', A: subs.turkce?.net ?? subs.turkce ?? 0, B: classAverages.tyt.turkce, fullMark: 40 });
            data.push({ subject: 'Sosyal', A: subs.sosyal?.net ?? subs.sosyal ?? 0, B: classAverages.tyt.sosyal, fullMark: 20 });
            data.push({ subject: 'Matematik', A: subs.mat?.net ?? subs.mat ?? 0, B: classAverages.tyt.matematik, fullMark: 40 });
            data.push({ subject: 'Fen', A: subs.fen?.net ?? subs.fen ?? 0, B: classAverages.tyt.fen, fullMark: 20 });
        } else {
            const subs = latestResult.subjects || latestResult.ayt || {};
            data.push({ subject: 'Matematik', A: subs.mat?.net ?? subs.mat ?? 0, B: classAverages.ayt.matematik, fullMark: 40 });
            data.push({ subject: 'Edebiyat', A: subs.edebiyat?.net ?? subs.edebiyat ?? 0, B: classAverages.ayt.edebiyat, fullMark: 24 });
            data.push({ subject: 'Tarih-1', A: subs.tarih1?.net ?? subs.tarih1 ?? 0, B: classAverages.ayt.tarih1, fullMark: 10 });
            data.push({ subject: 'Coğrafya-1', A: subs.cografya1?.net ?? subs.cografya1 ?? 0, B: classAverages.ayt.cografya1, fullMark: 6 });
        }

        return data;
    }, [studentResults, viewType]);

    // Mock Progress History Data for Line Chart
    const progressData = useMemo(() => {
        if (!studentResults || studentResults.length === 0) return [];

        // Map real results to chart format
        return studentResults.map((res, index) => ({
            name: `Deneme ${index + 1}`,
            studentScore: res.score || 0,
            classAverage: 320 + (Math.random() * 40 - 20) // Simulated fluctuating class average around 320
        }));
    }, [studentResults]);


    if (!chartData) return <div className="p-4 text-center text-ink-2">Henüz analiz edilecek deneme verisi yok.</div>;

    return (
        <div className="space-y-8 animate-fade-in">

            {/* Radar Chart Section */}
            <div className="bg-surface p-6 rounded-2xl border border-line shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Target size={120} className="text-brand" />
                </div>
                <div className="flex justify-between items-center mb-6 z-10 relative">
                    <h3 className="font-bold text-ink flex items-center">
                        <Users className="mr-2 text-brand" />
                        Sınıf Ortalaması Karşılaştırması ({viewType})
                    </h3>
                    <div className="flex bg-surface-3 p-1 rounded-xl">
                        <button 
                            onClick={() => setViewType('TYT')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${viewType === 'TYT' ? 'bg-brand text-white shadow-md' : 'text-ink-2 hover:text-ink-2'}`}
                        >TYT</button>
                        <button 
                            onClick={() => setViewType('AYT')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${viewType === 'AYT' ? 'bg-brand text-white shadow-md' : 'text-ink-2 hover:text-ink-2'}`}
                        >AYT</button>
                    </div>
                </div>
                {!chartData ? (
                    <div className="h-64 flex flex-col items-center justify-center text-ink-3 border-2 border-dashed border-line rounded-3xl">
                        <Activity size={32} className="mb-2 opacity-20" />
                        <p className="text-sm font-medium">Bu sınav türü için veri bulunamadı.</p>
                    </div>
                ) : (
                    <div className="h-80 w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" tick={{fontSize: 12, fontWeight: 600}} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                                <Radar
                                    name="Öğrenci"
                                    dataKey="A"
                                    stroke="#4F46E5"
                                    fill="#4F46E5"
                                    fillOpacity={0.5}
                                />
                                <Radar
                                    name="Sınıf Ort."
                                    dataKey="B"
                                    stroke="var(--ok)"
                                    fill="var(--ok)"
                                    fillOpacity={0.3}
                                />
                                <Legend />
                                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Line Chart Section */}
            <div className="bg-surface p-6 rounded-2xl border border-line shadow-sm">
                <h3 className="font-bold text-ink mb-2 flex items-center">
                    <TrendingUp className="mr-2 text-ok" />
                    Gelişim Grafiği (Puan)
                </h3>
                <p className="text-sm text-ink-2 mb-6">
                    Deneme puanlarınızın zaman içindeki değişim grafiği.
                </p>

                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={progressData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Legend verticalAlign="top" height={36} />
                            <Line
                                type="monotone"
                                dataKey="studentScore"
                                name="Puanınız"
                                stroke="var(--brand)"
                                strokeWidth={3}
                                activeDot={{ r: 8 }}
                                dot={{ r: 4, strokeWidth: 2 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="classAverage"
                                name="Sınıf Ort."
                                stroke="#d1d5db"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default ComparativeAnalysis;
