import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceLine, LabelList } from 'recharts';
import { Target, TrendingUp, Award } from 'lucide-react';

const TargetProgressChart = ({ currentNet, targetNet, departmentName }) => {
    // Data Preparation
    const data = useMemo(() => {
        return [
            {
                name: 'TYT',
                current: currentNet.tyt,
                target: targetNet.totalTyt,
                gap: Math.max(0, targetNet.totalTyt - currentNet.tyt)
            },
            {
                name: 'AYT',
                current: currentNet.ayt,
                target: targetNet.totalAyt,
                gap: Math.max(0, targetNet.totalAyt - currentNet.ayt)
            }
        ];
    }, [currentNet, targetNet]);

    const progressPercentage = Math.min(100, Math.round(((currentNet.tyt + currentNet.ayt) / (targetNet.totalTyt + targetNet.totalAyt)) * 100));

    return (
        <div className="bg-surface p-6 rounded-2xl border border-line shadow-sm">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-bold text-ink text-lg flex items-center">
                        <Target className="mr-2 text-danger" size={24} />
                        Hedef Takibi: {departmentName}
                    </h3>
                    <p className="text-sm text-ink-2 mt-1">Mevcut netleriniz ile hedef arasındaki fark.</p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-black text-brand">%{progressPercentage}</div>
                    <div className="text-xs font-bold text-ink-3 uppercase tracking-wide">Tamamlandı</div>
                </div>
            </div>

            {/* Progress Bar Visual */}
            <div className="w-full bg-surface-3 rounded-full h-3 mb-8 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ${progressPercentage > 80 ? 'bg-ok' : progressPercentage > 50 ? 'bg-brand' : 'bg-warn'}`}
                    style={{ width: `${progressPercentage}%` }}
                ></div>
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        barSize={40}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontWeight: 'bold' }} />
                        <YAxis axisLine={false} tickLine={false} domain={[0, 120]} />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Legend />
                        <Bar dataKey="current" name="Mevcut Net" stackId="a" fill="var(--brand)" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="gap" name="Kalan Hedef" stackId="a" fill="#e5e7eb" radius={[4, 4, 0, 0]}>
                            <LabelList dataKey="target" position="top" style={{ fill: '#6b7280', fontSize: '12px', fontWeight: 'bold' }} formatter={(val) => `Hedef: ${val}`} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 bg-brand-soft p-4 rounded-xl text-sm text-brand border border-brand-line flex items-start">
                <Award className="mr-3 flex-shrink-0 mt-0.5 text-brand" size={18} />
                <div>
                    <strong>Koç Yorumu:</strong>
                    <p className="mt-1">
                        {progressPercentage < 50
                            ? "Henüz yolun başındayız. Temel konuları sağlamlaştırarak net artışını hızlandırabiliriz."
                            : progressPercentage < 80
                                ? "İyi gidiyoruz! Eksik kalan konulara odaklanarak hedefe ulaşabiliriz."
                                : "Harika! Hedefe çok yaklaştık. Deneme çözerek hız kazanmaya devam edelim."}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TargetProgressChart;
