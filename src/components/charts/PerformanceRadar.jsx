import React from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import OrtakTooltip from './OrtakTooltip';
import { izgaraOzellikleri, eksenOzellikleri } from './grafikTemasi';

const PerformanceRadar = ({ performanceData, showLegend = true }) => {
    // Example performanceData structure:
    // [
    //   { subject: 'Matematik', current: 85, target: 90 },
    //   { subject: 'Türkçe', current: 70, target: 80 },
    //   ...
    // ]

    // Default data if none provided
    const defaultData = [
        { subject: 'Matematik', current: 75, target: 90 },
        { subject: 'Fizik', current: 65, target: 85 },
        { subject: 'Kimya', current: 70, target: 80 },
        { subject: 'Biyoloji', current: 80, target: 85 },
        { subject: 'Türkçe', current: 85, target: 90 },
        { subject: 'Tarih', current: 60, target: 75 },
    ];

    const data = performanceData && performanceData.length > 0 ? performanceData : defaultData;

    // Calculate average performance
    const avgCurrent = data.reduce((sum, item) => sum + item.current, 0) / data.length;
    const avgTarget = data.reduce((sum, item) => sum + item.target, 0) / data.length;
    const performanceRate = ((avgCurrent / avgTarget) * 100).toFixed(1);

    // Identify strengths and weaknesses
    const strengths = data.filter(item => item.current >= item.target).slice(0, 3);
    const weaknesses = data.filter(item => item.current < item.target).slice(0, 3);

    return (
        <div className="performance-radar-container">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold text-ink">Konu Performans Analizi</h3>
                    <p className="text-sm text-ink-2 mt-1">Mevcut başarınız ve hedefleriniz</p>
                </div>
                <div className="text-right">
                    <div className="text-xs text-ink-2 font-semibold">Genel Başarı Oranı</div>
                    <div className={`text-3xl font-black ${performanceRate >= 85 ? 'text-ok' : performanceRate >= 70 ? 'text-warn' : 'text-danger'}`}>
                        {performanceRate}%
                    </div>
                </div>
            </div>

            {/**
              * TELEFONDA RADAR DEĞİL YATAY ÇUBUK.
              *
              * Radar, ders profilini bir bakışta göstermek için iyidir ama
              * 375 piksellik ekranda köşe etiketleri ("Matematik", "Sosyal
              * Bilimler") üst üste biniyor ve iki değeri karşılaştırmak
              * imkânsız hâle geliyor. Aynı veri, aynı renklerle yatay
              * çubuğa çevrildiğinde hem etiketler okunuyor hem de
              * mevcut/hedef farkı doğrudan görülüyor.
              */}
            <div className="bg-surface rounded-dlg p-4 sm:p-6 shadow-kart border border-line">
                {/* Telefon: yatay çubuk */}
                <div className="sm:hidden">
                    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 44)}>
                        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                            <CartesianGrid {...izgaraOzellikleri()} horizontal={false} />
                            <XAxis type="number" domain={[0, 100]} {...eksenOzellikleri()} />
                            <YAxis type="category" dataKey="subject" width={88} {...eksenOzellikleri()} />
                            <Tooltip content={<OrtakTooltip birim="%" basamak={0} />} cursor={{ fill: 'var(--surface-3)' }} />
                            <Bar dataKey="current" name="Mevcut" fill="var(--c1)" radius={[0, 4, 4, 0]} barSize={10} animationDuration={300} />
                            <Bar dataKey="target" name="Hedef" fill="var(--ok)" fillOpacity={0.35} radius={[0, 4, 4, 0]} barSize={10} animationDuration={300} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Tablet ve masaüstü: radar */}
                <div className="hidden sm:block">
                    <ResponsiveContainer width="100%" height={360} minWidth={0} minHeight={0}>
                        <RadarChart data={data}>
                            <PolarGrid stroke="var(--line)" />
                            <PolarAngleAxis
                                dataKey="subject"
                                tick={{ fill: 'var(--ink-3)', fontSize: 12, fontWeight: 600 }}
                            />
                            <PolarRadiusAxis
                                angle={90}
                                domain={[0, 100]}
                                tick={{ fill: 'var(--ink-3)', fontSize: 10 }}
                            />
                            <Radar
                                name="Mevcut Performans"
                                dataKey="current"
                                stroke="var(--c1)"
                                fill="var(--c1)"
                                fillOpacity={0.5}
                                strokeWidth={2}
                                animationDuration={300} />
                            <Radar
                                name="Hedef"
                                dataKey="target"
                                stroke="var(--ok)"
                                fill="var(--ok)"
                                fillOpacity={0.2}
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                animationDuration={300} />
                            {/* İki seri var — efsane burada gerçekten gerekli */}
                            {showLegend && <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />}
                            <Tooltip content={<OrtakTooltip birim="%" basamak={0} />} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Strengths and Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {/* Strengths */}
                {strengths.length > 0 && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-ok">
                        <div className="flex items-center mb-3">
                            <div className="w-3 h-3 bg-ok rounded-full mr-2" />
                            <h4 className="text-lg font-bold text-ok">💪 Güçlü Yönleriniz</h4>
                        </div>
                        <div className="space-y-2">
                            {strengths.map((item, index) => (
                                <div key={index} className="flex items-center justify-between bg-surface/60 backdrop-blur-sm rounded-lg p-2 border border-ok">
                                    <span className="text-sm font-bold text-ink-2">{item.subject}</span>
                                    <span className="text-xs font-black text-ok">{item.current}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Weaknesses */}
                {weaknesses.length > 0 && (
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-5 border border-warn">
                        <div className="flex items-center mb-3">
                            <div className="w-3 h-3 bg-warn rounded-full mr-2" />
                            <h4 className="text-lg font-bold text-warn">🎯 Gelişim Alanlarınız</h4>
                        </div>
                        <div className="space-y-2">
                            {weaknesses.map((item, index) => (
                                <div key={index} className="flex items-center justify-between bg-surface/60 backdrop-blur-sm rounded-lg p-2 border border-warn">
                                    <span className="text-sm font-bold text-ink-2">{item.subject}</span>
                                    <span className="text-xs font-black text-warn">
                                        {item.current}% / {item.target}%
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 text-xs text-warn font-medium bg-surface/40 p-2 rounded-lg">
                            💡 Bu konulara odaklan! Hedefine ulaşman için ortalama <strong>{(avgTarget - avgCurrent).toFixed(0)} puan</strong> yükselmeli sin.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PerformanceRadar;
