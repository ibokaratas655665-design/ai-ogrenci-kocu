import React, { useState } from 'react';
import { Target, Trophy, TrendingUp, AlertCircle, ChevronRight, Calculator } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const GoalTracking = () => {
    const [targetUniversity, setTargetUniversity] = useState('Boğaziçi Üniversitesi');
    const [targetDepartment, setTargetDepartment] = useState('Bilgisayar Mühendisliği');

    // Mock Data: Hedef Netler vs Mevcut Netler
    const data = [
        { name: 'TYT Türkçe', hedef: 35, mevcut: 28 },
        { name: 'TYT Mat', hedef: 35, mevcut: 22 },
        { name: 'AYT Mat', hedef: 38, mevcut: 25 },
        { name: 'AYT Fen', hedef: 35, mevcut: 18 },
    ];

    const currentScore = 415;
    const targetScore = 520;
    const progress = (currentScore / targetScore) * 100;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Üst Bilgi Kartı */}
            <div className="glass-card p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold flex items-center mb-2">
                            <Target className="mr-3" size={32} />
                            Hedefmatik Simülatörü
                        </h2>
                        <p className="text-indigo-100 text-lg">
                            <span className="font-bold text-white">{targetUniversity}</span> - {targetDepartment}
                        </p>
                    </div>
                    <div className="mt-6 md:mt-0 text-center bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                        <div className="text-sm text-indigo-100 uppercase tracking-wider font-bold">Kalan Puan İhtiyacı</div>
                        <div className="text-4xl font-bold mt-1">+{targetScore - currentScore}</div>
                    </div>
                </div>
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sol Taraf: İlerleme Durumu */}
                <div className="glass-card p-6 lg:col-span-1">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center">
                        <Trophy className="mr-2 text-yellow-500" size={20} />
                        Hedefe Uzaklık
                    </h3>

                    <div className="flex flex-col items-center justify-center p-4">
                        <div className="relative w-48 h-48">
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-4xl font-bold text-indigo-600">%{progress.toFixed(0)}</span>
                                <span className="text-xs text-gray-500 font-bold uppercase mt-1">Tamamlandı</span>
                            </div>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[{ value: progress }, { value: 100 - progress }]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        startAngle={180}
                                        endAngle={0}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        <Cell fill="#4F46E5" />
                                        <Cell fill="#E5E7EB" />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="w-full space-y-4 mt-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">Mevcut Puan</span>
                                <span className="font-bold text-gray-900">{currentScore}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${(currentScore / 560) * 100}%` }}></div>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">Hedef Puan</span>
                                <span className="font-bold text-indigo-600">{targetScore}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-indigo-200 h-2 rounded-full" style={{ width: `${(targetScore / 560) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sağ Taraf: Net Analizi ve Tavsiyeler */}
                <div className="glass-card p-6 lg:col-span-2">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center">
                        <TrendingUp className="mr-2 text-green-500" size={20} />
                        Net Karşılaştırması (Mevcut vs Hedef)
                    </h3>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                                <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend />
                                <Bar dataKey="mevcut" name="Mevcut Net" fill="#9333EA" radius={[0, 4, 4, 0]} barSize={20} />
                                <Bar dataKey="hedef" name="Gereken Net" fill="#E5E7EB" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-6 flex items-start p-4 bg-orange-50 rounded-xl border border-orange-100">
                        <AlertCircle className="text-orange-600 shrink-0 mt-0.5 mr-3" size={20} />
                        <div>
                            <h4 className="font-bold text-orange-800 text-sm">Yapay Zeka Koç Tavsiyesi</h4>
                            <p className="text-sm text-orange-700 mt-1">
                                Boğaziçi Bilgisayar hedefi için <strong>AYT Fen</strong> netlerini artırmalısın. Mevcut <strong>18 net</strong>, hedefin olan <strong>35 netin</strong> %50'si kadar. Fizik ve Kimya konularına ağırlık vermeni öneririm.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Simülasyon Araçları */}
            <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 flex items-center">
                        <Calculator className="mr-2 text-blue-500" size={20} />
                        Senaryo Hesaplayıcı
                    </h3>
                    <button className="text-sm text-indigo-600 font-bold hover:underline">Kaydet ve Hedefi Güncelle</button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {data.map((item, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-200 transition">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{item.name}</label>
                            <div className="flex items-center space-x-2">
                                <input type="number" defaultValue={item.hedef} className="w-full text-lg font-bold text-gray-800 bg-white border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                <span className="text-sm text-gray-400 font-medium">Net</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GoalTracking;
