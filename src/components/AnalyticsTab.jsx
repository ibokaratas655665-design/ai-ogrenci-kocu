import React, { useMemo } from 'react';
import { Activity, TrendingUp, Users, BookOpen, Target, Award, BrainCircuit, Zap, Shield, Radar as RadarIcon } from 'lucide-react';
import { 
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, Legend, Radar, RadarChart, PolarGrid, 
    PolarAngleAxis, PolarRadiusAxis, AreaChart, Area 
} from 'recharts';
import { listeOku, nesneOku } from '../services/veriDeposu';

const AnalyticsTab = ({ students = [] }) => {
    const analytics = useMemo(() => {
        const v2Results = listeOku('v2_results_data');
        const tasks = nesneOku('student_tasks');

        const totalStudents = students.length;
        const activeStudents = students.filter(s => {
            const studentTasks = tasks[s.id] || [];
            return studentTasks.length > 0;
        }).length;

        const allNets = v2Results.map(r => parseFloat(r.totalNet) || 0);
        const avgNet = allNets.length > 0 ? (allNets.reduce((a, b) => a + b, 0) / allNets.length).toFixed(1) : 0;
        const maxNet = allNets.length > 0 ? Math.max(...allNets).toFixed(1) : 0;

        const subjects = ['tyt_turkce', 'tyt_matematik', 'tyt_fen', 'tyt_sosyal'];
        const subjectLabels = { tyt_turkce: 'Türkçe', tyt_matematik: 'Matematik', tyt_fen: 'Fen Bil.', tyt_sosyal: 'Sosyal Bil.' };

        /* Veri olmayan ders radar'a girmez — eski sürüm Math.random ile
           uyduruyordu, koç sahte ortalama görüyordu. */
        const radarData = subjects.map(s => {
            const vals = v2Results.map(r => parseFloat(r.subjects?.[s] || r[s.replace('tyt_', '')]) || 0).filter(v => v > 0);
            if (!vals.length) return null;
            const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
            return { subject: subjectLabels[s], A: parseFloat(avg.toFixed(1)), fullMark: 40 };
        }).filter(Boolean);

        const trendData = v2Results.slice(-8).map((r, i) => ({
            name: r.trialName?.substring(0, 10) || `Deneme ${i+1}`,
            net: parseFloat(r.totalNet) || 0,
            avg: parseFloat(avgNet)
        }));

        /* Kazanım / risk sinyalleri — sabit metin değil, veriden. */
        const sinyaller = { kazanimlar: [], riskler: [] };
        if (trendData.length >= 2) {
            const fark = Math.round((trendData[trendData.length - 1].net - trendData[0].net) * 10) / 10;
            if (fark > 0) sinyaller.kazanimlar.push(`Net ortalaması son ${trendData.length} denemede ${fark} net yükseldi.`);
            else if (fark < 0) sinyaller.riskler.push(`Net ortalaması son ${trendData.length} denemede ${Math.abs(fark)} net geriledi.`);
        }
        if (radarData.length >= 2) {
            const sirali = [...radarData].sort((a, b) => a.A - b.A);
            sinyaller.riskler.push(`En düşük ders ortalaması: ${sirali[0].subject} (${sirali[0].A} net).`);
            sinyaller.kazanimlar.push(`En güçlü ders: ${sirali[sirali.length - 1].subject} (${sirali[sirali.length - 1].A} net).`);
        }
        if (totalStudents > 0 && activeStudents < totalStudents) {
            sinyaller.riskler.push(`${totalStudents - activeStudents} öğrencinin hiç görev kaydı yok.`);
        }

        return { totalStudents, activeStudents, avgNet, maxNet, examCount: v2Results.length, radarData, trendData, sinyaller };
    }, [students]);

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-ink dark:text-ink tracking-tight flex items-center gap-3">
                        <div className="p-2 sm:p-3 bg-brand rounded-2xl text-white shadow-lg shadow-indigo-200">
                            <BrainCircuit size={28} />
                        </div>
                        STRATEJİK ANALİZ
                    </h2>
                    <p className="text-ink-2 font-bold uppercase text-[9px] tracking-widest mt-2 ml-1">
                        Sistem Performans Raporu
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                    { label: 'Genel Ortalaması', value: `${analytics.avgNet} Net`, icon: TrendingUp, color: 'from-blue-600 to-brand', sub: 'Sınıf geneli' },
                    { label: 'Zirve Skoru', value: `${analytics.maxNet} Net`, icon: Award, color: 'from-amber-400 to-orange-600', sub: 'En yüksek net' },
                    { label: 'Bağlılık Oranı', value: `%${Math.round((analytics.activeStudents/analytics.totalStudents)*100) || 0}`, icon: Users, color: 'from-emerald-500 to-teal-600', sub: 'Aktif katılım' },
                    { label: 'Deneme Sayısı', value: analytics.examCount, icon: Zap, color: 'from-purple-600 to-pink-600', sub: 'Yüklenen sonuç' }
                ].map((kpi, i) => (
                    <div key={i} className="group relative bg-surface dark:bg-surface-inv rounded-[2rem] p-4 sm:p-6 shadow-xl border border-slate-50 dark:border-line-2 overflow-hidden hover:-translate-y-1 transition-all">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center text-ink shadow-lg mb-4`}>
                            <kpi.icon size={20} />
                        </div>
                        <h4 className="text-[9px] font-bold text-ink-3 uppercase tracking-widest mb-1">{kpi.label}</h4>
                        <p className="text-xl sm:text-2xl font-black text-ink dark:text-ink tracking-tighter">{kpi.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-surface dark:bg-surface-inv rounded-[2.5rem] p-6 shadow-xl border border-line dark:border-line-2 h-[450px]">
                    <h3 className="text-xs font-black text-ink dark:text-ink mb-6 uppercase tracking-widest flex items-center gap-2">
                        <RadarIcon className="text-brand" size={16}  animationDuration={300} /> Bilişsel Dağılım
                    </h3>
                    <div className="h-full w-full pb-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analytics.radarData}>
                                <PolarGrid stroke="#f1f5f9" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--ink-3)', fontSize: 10, fontWeight: 700 }} />
                                <Radar
                                    name="Sınıf Ortalaması"
                                    dataKey="A"
                                    stroke="var(--c1)"
                                    fill="var(--c1)"
                                    fillOpacity={0.5}
                                 animationDuration={300} />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-surface dark:bg-surface-inv rounded-[2.5rem] p-6 shadow-xl border border-line dark:border-line-2 h-[450px]">
                    <h3 className="text-xs font-black text-ink dark:text-ink mb-6 uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp className="text-ok" size={16} /> Gelişim İvmelenmesi
                    </h3>
                    <div className="h-full w-full pb-10">
                        {analytics.trendData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-sm text-ink-3">
                                Henüz deneme sonucu yüklenmedi — grafik veri geldikçe oluşur.
                            </div>
                        ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics.trendData}>
                                <defs>
                                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--c1)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--c1)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="net" stroke="var(--c1)" strokeWidth={3} fillOpacity={1} fill="url(#colorNet)"  animationDuration={300} />
                            </AreaChart>
                        </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* Sinyaller veriden türetilir; veri yoksa blok görünmez.
                (Eski sürümde burada sabit, uydurma cümleler vardı.) */}
            {(analytics.sinyaller.kazanimlar.length > 0 || analytics.sinyaller.riskler.length > 0) && (
                <div className="relative bg-surface-inv rounded-[2.5rem] p-8 overflow-hidden shadow-2xl">
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-2 h-2 rounded-full bg-ok animate-pulse" />
                                <span className="text-[10px] font-black text-ok uppercase tracking-widest">Kazanımlar</span>
                            </div>
                            <ul className="space-y-3">
                                {analytics.sinyaller.kazanimlar.map((m) => (
                                    <li key={m} className="text-xs text-ink-3 font-medium bg-surface/5 p-3 rounded-xl border border-line">{m}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                                <span className="text-[10px] font-black text-danger uppercase tracking-widest">Risk Sinyalleri</span>
                            </div>
                            <ul className="space-y-3">
                                {analytics.sinyaller.riskler.map((m) => (
                                    <li key={m} className="text-xs text-ink-3 font-medium bg-surface/5 p-3 rounded-xl border border-line">{m}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsTab;
