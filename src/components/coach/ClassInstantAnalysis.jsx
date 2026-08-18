/**
 * 📊 ANLIK SINIF ANALİZİ PANELİ
 * Yeni sonuçlar eklendikten sonra tek tık sınıf raporu
 */
import React, { useState, useMemo } from 'react';
import {
    BarChart2, TrendingUp, TrendingDown, Minus, Users,
    Trophy, AlertTriangle, RefreshCw, Download, Star,
    CheckCircle, Zap, Target, ChevronDown
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, Cell, LineChart, Line, Legend
} from 'recharts';
import { generateBulkExamReport } from '../../utils/pdfGenerator';
import { listeOku } from '../../services/veriDeposu';

const SUBJECT_LABELS = {
    turkce: 'Türkçe', matematik: 'Matematik', fizik: 'Fizik',
    kimya: 'Kimya', biyoloji: 'Biyoloji', tarih: 'Tarih',
    cografya: 'Coğrafya', felsefe: 'Felsefe', din: 'Din',
    edebiyat: 'Edebiyat', ingilizce: 'İngilizce',
};

const getTotalNet = (r) => {
    if (!r) return 0;
    if (parseFloat(r.totalNet) > 0) return parseFloat(r.totalNet);
    if (r.subjects) return Object.values(r.subjects).reduce((s, v) => s + (parseFloat(v?.net) || 0), 0);
    return 0;
};

// ─── Metrik Kartı ─────────────────────────────────────────────────────
const MetricCard = ({ icon: Icon, label, value, sub, color }) => (
    <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100/30 rounded-2xl p-4 border border-${color}-100`}>
        <div className={`w-9 h-9 bg-${color}-100 rounded-xl flex items-center justify-center mb-3`}>
            <Icon size={18} className={`text-${color}-600`} />
        </div>
        <p className={`text-2xl font-black text-${color}-800`}>{value}</p>
        <p className="text-xs font-bold text-ink-2 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-ink-3 mt-0.5">{sub}</p>}
    </div>
);

// ─── Ana Bileşen ─────────────────────────────────────────────────────
const ClassInstantAnalysis = ({ students = [], trials = [], results: propsResults }) => {
    const [selectedTrialId, setSelectedTrialId] = useState(null);
    const [sortBy, setSortBy] = useState('net');

    // localStorage'dan veya props'tan sonuçları al
    const allResults = useMemo(() => {
        if (propsResults) return propsResults;
        try { return listeOku('v2_results_data'); } catch { return []; }
    }, [propsResults]);

    // Mevcut deneme seçimi
    const selectedTrial = useMemo(() => {
        if (selectedTrialId) return trials.find(t => t.id === selectedTrialId);
        // Props ile gelen trials zaten filtrelenmiş olabilir, o zaman en sonuncuyu al
        return trials[trials.length - 1];
    }, [selectedTrialId, trials]);

    const trialResults = useMemo(() => {
        if (!selectedTrial) return [];
        // Eğer tüm sonuçlar zaten bu trial'e aitse (prop ile gelmişse) filtrelemeye gerek yok veya trialId ile eşleştir
        return allResults.filter(r => r.trialId === selectedTrial.id || r.trialName === selectedTrial.name);
    }, [allResults, selectedTrial]);

    // Sınıf istatistikleri
    const stats = useMemo(() => {
        if (!trialResults.length) return null;
        const nets = trialResults.map(r => getTotalNet(r));
        const avg = nets.reduce((a, b) => a + b, 0) / nets.length;
        const max = Math.max(...nets);
        const min = Math.min(...nets);
        const passing = nets.filter(n => n >= 60).length;

        // Ders ortalamaları
        const subjectAvgs = {};
        const subjectNames = {};
        trialResults.forEach(r => {
            if (!r.subjects) return;
            Object.entries(r.subjects).forEach(([k, v]) => {
                if (!subjectAvgs[k]) subjectAvgs[k] = [];
                const net = parseFloat(v?.net) || 0;
                if (net !== 0) {
                    subjectAvgs[k].push(net);
                    if (v?.name) subjectNames[k] = v.name;
                }
            });
        });
        const subjectStats = Object.entries(subjectAvgs)
            .map(([k, vals]) => ({
                key: k,
                label: subjectNames[k] || SUBJECT_LABELS[k] || k,
                avg: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)),
                count: vals.length,
            }))
            .filter(s => s.avg !== 0)
            .sort((a, b) => b.avg - a.avg);

        // Gelişim trendi (önceki denemeyle karşılaştır)
        const currentTrialIdx = trials.indexOf(selectedTrial);
        const prevTrial = currentTrialIdx > 0 ? trials[currentTrialIdx - 1] : null;
        let trend = null;
        if (prevTrial) {
            const prevResults = allResults.filter(r => r.trialId === prevTrial.id || r.trialName === prevTrial.name);
            if (prevResults.length > 0) {
                const prevNets = prevResults.map(r => getTotalNet(r));
                const prevAvg = prevNets.reduce((a, b) => a + b, 0) / prevNets.length;
                trend = parseFloat((avg - prevAvg).toFixed(2));
            }
        }

        // Sıralama
        const ranked = [...trialResults].sort((a, b) => getTotalNet(b) - getTotalNet(a));

        return { avg: parseFloat(avg.toFixed(2)), max, min, passing, subjectStats, trend, ranked, total: trialResults.length };
    }, [trialResults, trials, allResults, selectedTrial]);

    // Dağılım grafiği verisi
    const distributionData = useMemo(() => {
        if (!trialResults.length) return [];
        const ranges = [
            { label: '0-20', min: 0, max: 20, color: 'var(--danger)' },
            { label: '20-40', min: 20, max: 40, color: 'var(--warn)' },
            { label: '40-60', min: 40, max: 60, color: 'var(--warn)' },
            { label: '60-80', min: 60, max: 80, color: 'var(--ok)' },
            { label: '80+', min: 80, max: 999, color: 'var(--c1)' },
        ];
        return ranges.map(r => ({
            ...r,
            count: trialResults.filter(res => {
                const n = getTotalNet(res); return n >= r.min && n < r.max;
            }).length,
        }));
    }, [trialResults]);

    if (trials.length === 0) return (
        <div className="bg-surface rounded-2xl p-8 text-center border border-line">
            <BarChart2 size={32} className="text-ink-3 mx-auto mb-3"  animationDuration={300} />
            <p className="text-ink-3 text-sm">Henüz deneme eklenmemiş</p>
            <p className="text-ink-3 text-xs">Sınav sekmesinden deneme ekleyin</p>
        </div>
    );

    return (
        <div className="space-y-5">
            {/* ── HEADER + DENEME SEÇİMİ ──────────────────────────── */}
            <div className="flex items-center flex-wrap gap-3 justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-ok-soft rounded-xl flex items-center justify-center">
                        <Zap size={18} className="text-ok" />
                    </div>
                    <div>
                        <h2 className="font-black text-ink text-lg">Anlık Sınıf Analizi</h2>
                        <p className="text-xs text-ink-3">{trialResults.length} öğrenci sonucu — {selectedTrial?.examType || 'TYT'}</p>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {/* Deneme seçici */}
                    <select
                        value={selectedTrialId || selectedTrial?.id || ''}
                        onChange={e => setSelectedTrialId(e.target.value)}
                        className="text-xs font-bold border border-line rounded-xl px-3 py-2 bg-surface text-ink-2 focus:ring-2 focus:ring-emerald-400 outline-none"
                    >
                        {[...trials].reverse().map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.examType})</option>
                        ))}
                    </select>
                    {/* PDF */}
                    {stats && trialResults.length > 0 && (
                        <button
                            onClick={() => generateBulkExamReport(selectedTrial, trialResults, students)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-brand text-white rounded-xl text-xs font-black hover:bg-brand-hover transition shadow-md"
                        >
                            <Download size={14} /> PDF Raporu
                        </button>
                    )}
                </div>
            </div>

            {!stats ? (
                <div className="bg-surface rounded-2xl p-8 text-center border border-line">
                    <RefreshCw size={28} className="text-ink-3 mx-auto mb-3" />
                    <p className="text-ink-3 text-sm">Bu deneme için sonuç verilmemiş</p>
                </div>
            ) : (
                <>
                    {/* ── ÖZETİSTATİSTİK KARTLARI ──────────────────── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <MetricCard icon={Users} label="Katılımcı" value={stats.total} sub="öğrenci" color="indigo" />
                        <MetricCard icon={Target} label="Sınıf Ortalaması" value={stats.avg} sub="toplam net" color="violet" />
                        <MetricCard icon={Trophy} label="En Yüksek" value={stats.max.toFixed(1)} sub="net" color="emerald" />
                        <MetricCard
                            icon={stats.trend !== null && stats.trend > 0 ? TrendingUp : stats.trend !== null && stats.trend < 0 ? TrendingDown : Minus}
                            label="Önceki Fark"
                            value={stats.trend !== null ? (stats.trend > 0 ? '+' : '') + stats.trend : '—'}
                            sub="ortalama değişimi"
                            color={stats.trend === null ? 'gray' : stats.trend > 0 ? 'emerald' : stats.trend < 0 ? 'red' : 'gray'}
                        />
                    </div>

                    {/* ── DAĞILIM + DERS ORTALAMALARI ──────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Net Dağılım Grafiği */}
                        <div className="bg-surface rounded-2xl border border-line shadow-sm p-4">
                            <h3 className="font-bold text-ink-2 text-sm mb-3 flex items-center gap-2">
                                <BarChart2 size={15} className="text-brand"  animationDuration={300} /> Net Dağılımı
                            </h3>
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={distributionData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"  vertical={false} />
                                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} formatter={(v) => [`${v} öğrenci`, 'Adet']} />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                        {distributionData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Ders Ortalamaları */}
                        <div className="bg-surface rounded-2xl border border-line shadow-sm p-4">
                            <h3 className="font-bold text-ink-2 text-sm mb-3 flex items-center gap-2">
                                <Star size={15} className="text-warn" /> Ders Ortalamaları
                            </h3>
                            <div className="space-y-2 max-h-44 overflow-y-auto">
                                {stats.subjectStats.map((s, i) => {
                                    const maxAvg = stats.subjectStats[0]?.avg || 1;
                                    const pct = (s.avg / maxAvg) * 100;
                                    const colors = ['var(--c1)', 'var(--c4)', 'var(--info)', 'var(--ok)', 'var(--warn)', 'var(--danger)'];
                                    const col = colors[i % colors.length];
                                    return (
                                        <div key={s.key} className="flex items-center gap-3">
                                            <span className="text-xs text-ink-2 w-20 font-semibold truncate">{s.label}</span>
                                            <div className="flex-1 h-3 bg-surface-3 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: col }} />
                                            </div>
                                            <span className="text-xs font-black w-10 text-right" style={{ color: col }}>{s.avg}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ── TOP 10 / SON 5 SIRALI LİSTE ─────────────── */}
                    <div className="bg-surface rounded-2xl border border-line shadow-sm p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-ink-2 text-sm flex items-center gap-2">
                                <Trophy size={15} className="text-warn" /> Sıralama
                            </h3>
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="text-xs font-bold border border-line rounded-xl px-2 py-1 bg-surface text-ink-2 outline-none"
                            >
                                <option value="net">Net'e Göre</option>
                                <option value="name">İsme Göre</option>
                            </select>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-line text-xs text-ink-3 font-bold uppercase">
                                        <th className="text-left py-2 px-2">#</th>
                                        <th className="text-left py-2 px-2">Öğrenci</th>
                                        <th className="text-center py-2 px-2">Sınıf</th>
                                        <th className="text-right py-2 px-2">Net</th>
                                        <th className="text-center py-2 px-2 hidden sm:table-cell">Değ.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...stats.ranked]
                                        .sort((a, b) => sortBy === 'name'
                                            ? (a.student || '').localeCompare(b.student || '')
                                            : getTotalNet(b) - getTotalNet(a))
                                        .slice(0, 15)
                                        .map((r, i) => {
                                            const net = getTotalNet(r);
                                            const medals = ['🥇', '🥈', '🥉'];
                                            const isTop = i < 3 && sortBy === 'net';
                                            // Önceki deneme net'ini bul
                                            const prev = allResults.find(pr =>
                                                (pr.studentId === r.studentId || pr.studentName === r.studentName) &&
                                                pr.trialId !== r.trialId
                                            );
                                            const change = prev ? getTotalNet(r) - getTotalNet(prev) : null;
                                            return (
                                                <tr key={r.id || i} className={`border-b border-gray-50 hover:bg-surface-2 transition ${isTop ? 'font-semibold' : ''}`}>
                                                    <td className="py-2 px-2 text-xs">{isTop ? medals[i] : `${i + 1}.`}</td>
                                                    <td className="py-2 px-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 ${isTop ? 'bg-amber-400' : 'bg-brand'}`}>
                                                                {(r.student || '?').charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="font-semibold text-ink text-xs truncate max-w-[120px]">{r.student || r.studentName || '—'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-2 text-center text-xs text-ink-2">{r.grade || '—'}</td>
                                                    <td className="py-2 px-2 text-right">
                                                        <span className="font-black text-sm text-brand">{net.toFixed(1)}</span>
                                                    </td>
                                                    <td className="py-2 px-2 text-center hidden sm:table-cell">
                                                        {change !== null ? (
                                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-lg ${change > 0 ? 'bg-ok-soft text-ok' : change < 0 ? 'bg-danger-soft text-danger' : 'bg-surface-3 text-ink-2'}`}>
                                                                {change > 0 ? '+' : ''}{change.toFixed(1)}
                                                            </span>
                                                        ) : <span className="text-ink-3 text-xs">—</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ── DİKKAT EDİLECEK ÖĞRENCİLER ─────────────── */}
                    {(() => {
                        const low = stats.ranked.filter(r => getTotalNet(r) < stats.avg * 0.7).slice(0, 5);
                        if (!low.length) return null;
                        return (
                            <div className="bg-danger-soft border border-danger rounded-2xl p-4">
                                <h3 className="font-bold text-danger text-sm mb-3 flex items-center gap-2">
                                    <AlertTriangle size={15} /> Dikkat Edilmesi Gerekenler
                                    <span className="text-xs text-danger font-normal">(ortalama altında)</span>
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {low.map((r, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-surface rounded-xl px-3 py-2 shadow-sm border border-danger">
                                            <span className="text-xs font-bold text-ink">{r.student || r.studentName}</span>
                                            <span className="text-xs font-black text-danger">{getTotalNet(r).toFixed(1)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </>
            )}
        </div>
    );
};

export default ClassInstantAnalysis;
