import React, { useState } from 'react';
import { Book, TrendingDown, TrendingUp, Filter } from 'lucide-react';

const PerformanceHeatmap = () => {
    const [selectedSubject, setSelectedSubject] = useState('Matematik');

    const subjects = ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe'];

    // Mock Data: Konu Bazlı Başarı Oranları
    const topicsData = {
        'Matematik': [
            { name: 'Temel Kavramlar', score: 95, status: 'high' },
            { name: 'Sayı Basamakları', score: 88, status: 'high' },
            { name: 'Bölme Bölünebilme', score: 92, status: 'high' },
            { name: 'EBOB-EKOK', score: 75, status: 'medium' },
            { name: 'Rasyonel Sayılar', score: 85, status: 'high' },
            { name: 'Basit Eşitsizlikler', score: 65, status: 'medium' },
            { name: 'Mutlak Değer', score: 70, status: 'medium' },
            { name: 'Üslü Sayılar', score: 82, status: 'high' },
            { name: 'Köklü Sayılar', score: 60, status: 'medium' },
            { name: 'Çarpanlara Ayırma', score: 45, status: 'low' },
            { name: 'Polinomlar', score: 50, status: 'low' },
            { name: 'İkinci Dereceden Denklemler', score: 55, status: 'low' },
            { name: 'Parabol', score: 40, status: 'low' },
            { name: 'Trigonometri', score: 30, status: 'critical' },
            { name: 'Logaritma', score: 85, status: 'high' },
            { name: 'Türev', score: 25, status: 'critical' },
            { name: 'İntegral', score: 20, status: 'critical' },
        ],
        'Fizik': [
            { name: 'Vektörler', score: 90, status: 'high' },
            { name: 'Kuvvet ve Hareket', score: 70, status: 'medium' },
            { name: 'İş Güç Enerji', score: 65, status: 'medium' },
            { name: 'Elektrik', score: 40, status: 'low' },
            { name: 'Optik', score: 35, status: 'critical' },
        ]
    };

    const getColor = (score) => {
        if (score >= 80) return 'bg-ok';
        if (score >= 60) return 'bg-yellow-400';
        if (score >= 40) return 'bg-warn';
        return 'bg-danger';
    };

    const getTextColor = (score) => {
        if (score >= 80) return 'text-ok bg-ok-soft';
        if (score >= 60) return 'text-warn bg-warn-soft';
        if (score >= 40) return 'text-warn bg-warn-soft';
        return 'text-danger bg-danger-soft';
    };

    const currentTopics = topicsData[selectedSubject] || topicsData['Matematik'];

    return (
        <div className="glass-card p-6 animate-fade-in mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-ink flex items-center">
                        <Book className="mr-2 text-brand" size={20} />
                        Akıllı Konu Analizi (Isı Haritası)
                    </h3>
                    <p className="text-sm text-ink-2">Konu bazlı başarı durumunu görselleştirir.</p>
                </div>

                <div className="flex items-center space-x-2 mt-4 md:mt-0 bg-surface-3 p-1 rounded-lg">
                    {subjects.map(sub => (
                        <button
                            key={sub}
                            onClick={() => setSelectedSubject(sub)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${selectedSubject === sub ? 'bg-surface shadow text-brand' : 'text-ink-2 hover:text-ink-2'}`}
                        >
                            {sub}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {currentTopics.map((topic, idx) => (
                    <div key={idx} className="relative group">
                        <div className={`aspect-square rounded-xl p-3 flex flex-col justify-between transition transform hover:scale-105 cursor-pointer shadow-sm ${getTextColor(topic.score)} border border-transparent hover:border-line`}>
                            <span className="text-xs font-bold leading-tight line-clamp-2">{topic.name}</span>
                            <div className="flex justify-between items-end">
                                <span className="text-2xl font-bold">%{topic.score}</span>
                                {topic.score < 50 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                            </div>
                        </div>

                        {/* Tooltip benzeri detay (Hover) */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-surface-inv text-white text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 text-center">
                            {topic.score < 50 ? 'Bu konuda eksikleriniz var, tekrar yapmalısınız.' : 'Bu konuda gayet iyisiniz, soru çözmeye devam.'}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex items-center justify-center space-x-6 text-xs text-ink-2">
                <div className="flex items-center"><div className="w-3 h-3 bg-danger rounded mr-2"></div> Kritik (%0-39)</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-warn rounded mr-2"></div> Zayıf (%40-59)</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-yellow-400 rounded mr-2"></div> Orta (%60-79)</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-ok rounded mr-2"></div> İyi (%80-100)</div>
            </div>
        </div>
    );
};

export default PerformanceHeatmap;
