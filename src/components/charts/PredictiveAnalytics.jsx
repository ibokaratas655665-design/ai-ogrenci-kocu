import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

const PredictiveAnalytics = ({ historicalData, targetScore = 450, examDate }) => {
    // Generate predictive data based on historical performance
    const generatePrediction = () => {
        if (!historicalData || historicalData.length === 0) {
            // Default prediction data
            return [
                { week: 'Hafta 1', actual: 320, predicted: 320, target: 400 },
                { week: 'Hafta 2', actual: 340, predicted: 340, target: 410 },
                { week: 'Hafta 3', actual: 355, predicted: 355, target: 420 },
                { week: 'Hafta 4', actual: null, predicted: 370, target: 430 },
                { week: 'Hafta 5', actual: null, predicted: 390, target: 440 },
                { week: 'Hafta 6', actual: null, predicted: 410, target: 450 },
                { week: 'Hafta 7', actual: null, predicted: 430, target: 460 },
                { week: 'Hafta 8', actual: null, predicted: 450, target: 470 },
            ];
        }
        return historicalData;
    };

    const data = generatePrediction();

    // Calculate trend
    const actualData = data.filter(d => d.actual !== null);
    const lastActual = actualData[actualData.length - 1]?.actual || 0;
    const firstActual = actualData[0]?.actual || 0;
    const trend = lastActual - firstActual;
    const trendPercentage = firstActual > 0 ? ((trend / firstActual) * 100).toFixed(1) : 0;

    // Prediction analysis
    const lastPredicted = data[data.length - 1]?.predicted || 0;
    const willReachTarget = lastPredicted >= targetScore;
    const gap = targetScore - lastPredicted;

    // Risk assessment
    const riskLevel = willReachTarget ? 'low' : (gap > 50 ? 'high' : 'medium');
    const riskConfig = {
        low: { color: 'green', icon: CheckCircle, text: 'Hedefe Ulaşabilirsin!', bg: 'bg-ok-soft', border: 'border-ok' },
        medium: { color: 'orange', icon: AlertTriangle, text: 'Dikkat! Daha Fazla Çalış', bg: 'bg-warn-soft', border: 'border-warn' },
        high: { color: 'red', icon: AlertTriangle, text: 'Ciddi Risk! Acil Eylem Gerekli', bg: 'bg-danger-soft', border: 'border-danger' }
    };
    const risk = riskConfig[riskLevel];
    const RiskIcon = risk.icon;

    return (
        <div className="predictive-analytics-container">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-ink">Başarı Tahmini & Trend Analizi</h3>
                    <p className="text-sm text-ink-2 mt-1">Mevcut performansına göre gelecek tahmini</p>
                </div>
                {examDate && (
                    <div className="text-right">
                        <div className="text-xs text-ink-2 font-semibold">Sınav Tarihi</div>
                        <div className="text-sm font-bold text-brand">{examDate}</div>
                    </div>
                )}
            </div>

            {/* Trend Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-surface rounded-xl p-4 border-2 border-brand-line shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs text-ink-2 font-semibold mb-1">Mevcut Puan</div>
                            <div className="text-3xl font-black text-ink">{lastActual}</div>
                        </div>
                        <div className={`p-3 rounded-full ${trend >= 0 ? 'bg-ok-soft' : 'bg-danger-soft'}`}>
                            {trend >= 0 ? <TrendingUp className="text-ok" size={24} /> : <TrendingDown className="text-danger" size={24} />}
                        </div>
                    </div>
                    <div className={`text-xs font-bold mt-2 ${trend >= 0 ? 'text-ok' : 'text-danger'}`}>
                        {trend >= 0 ? '+' : ''}{trend} puan ({trend >= 0 ? '+' : ''}{trendPercentage}%)
                    </div>
                </div>

                <div className="bg-surface rounded-xl p-4 border-2 border-[color-mix(in_srgb,var(--c4)_35%,transparent)] shadow-sm">
                    <div className="text-xs text-ink-2 font-semibold mb-1">Tahmin Edilen Skor</div>
                    <div className="text-3xl font-black text-c4">{lastPredicted}</div>
                    <div className="text-xs text-ink-2 mt-2">8 hafta sonra</div>
                </div>

                <div className={`rounded-xl p-4 border-2 ${risk.bg} ${risk.border} shadow-sm`}>
                    <div className="flex items-center mb-2">
                        <RiskIcon className={`text-${risk.color}-600 mr-2`} size={20} />
                        <div className="text-xs text-ink-2 font-semibold">Risk Seviyesi</div>
                    </div>
                    <div className={`text-lg font-black text-${risk.color}-700`}>{risk.text}</div>
                    {!willReachTarget && (
                        <div className="text-xs text-ink-2 mt-2">
                            Hedefe {gap} puan eksik
                        </div>
                    )}
                </div>
            </div>

            {/* Prediction Chart */}
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-line">
                <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--c1)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--c1)" stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--c4)" stopOpacity={0.6} />
                                <stop offset="95%" stopColor="var(--c4)" stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)"  vertical={false} />
                        <XAxis
                            dataKey="week"
                            tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
                        />
                        <YAxis
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            domain={[250, 500]}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '12px',
                                padding: '8px 12px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                        />
                        <Legend
                            wrapperStyle={{ paddingTop: '15px' }}
                            iconType="circle"
                        />

                        {/* Actual Performance */}
                        <Area
                            type="monotone"
                            dataKey="actual"
                            stroke="var(--c1)"
                            strokeWidth={3}
                            fill="url(#colorActual)"
                            name="Gerçek Performans"
                            connectNulls={false}
                         animationDuration={300} />

                        {/* Predicted Performance */}
                        <Line
                            type="monotone"
                            dataKey="predicted"
                            stroke="var(--c4)"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: 'var(--c4)', r: 4 }}
                            name="Tahmin"
                         animationDuration={300} />

                        {/* Target Line */}
                        <Line
                            type="monotone"
                            dataKey="target"
                            stroke="var(--ok)"
                            strokeWidth={2}
                            strokeDasharray="3 3"
                            dot={false}
                            name="Hedef"
                         animationDuration={300} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Recommendations */}
            <div className="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-brand-line">
                <h4 className="text-lg font-bold text-brand mb-3">💡 Önerilerimiz</h4>
                <ul className="space-y-2">
                    {!willReachTarget && (
                        <li className="flex items-start bg-surface/60 backdrop-blur-sm rounded-lg p-3 border border-brand-line">
                            <span className="text-brand mr-2">•</span>
                            <span className="text-sm text-ink-2">
                                Hedefe ulaşmak için <strong>günlük çalışma sürenizi %30 artırın</strong>
                            </span>
                        </li>
                    )}
                    <li className="flex items-start bg-surface/60 backdrop-blur-sm rounded-lg p-3 border border-brand-line">
                        <span className="text-brand mr-2">•</span>
                        <span className="text-sm text-ink-2">
                            Zayıf konularınıza odaklanarak <strong>net artışı hızlandırabilirsiniz</strong>
                        </span>
                    </li>
                    <li className="flex items-start bg-surface/60 backdrop-blur-sm rounded-lg p-3 border border-brand-line">
                        <span className="text-brand mr-2">•</span>
                        <span className="text-sm text-ink-2">
                            Düzenli deneme çözümü ile <strong>trend kararlılığınızı koruyun</strong>
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default PredictiveAnalytics;
