import React, { useMemo, useState } from 'react';
import {
    ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { TrendingUp, Users, Target, Activity, ChartNoAxesColumn, Info } from 'lucide-react';

/**
 * 📊 DENEME ANALİZİ GRAFİKLERİ
 *
 * 04.09 yeniden inşa: eski sürüm iki yerde UYDURMA veri gösteriyordu —
 * sabit "sınıf ortalaması" radar katmanı ve rastgele üretilen sınıf
 * ortalaması çizgisi. Koçun ekranında gerçek sanılan sahte sayı, yanlış
 * karara davetiyedir. İkisi de kaldırıldı; yalnız öğrencinin gerçek
 * verisi çizilir.
 */

/** TYT/AYT için ders anahtarları — deneme kaydındaki subjects alanıyla eşleşir. */
const DERSLER = {
    TYT: [
        ['Türkçe', 'turkce'], ['Matematik', 'mat'], ['Fizik', 'fizik'],
        ['Kimya', 'kimya'], ['Biyoloji', 'biyoloji'], ['Tarih', 'tarih'],
        ['Coğrafya', 'cografya'], ['Felsefe', 'felsefe'], ['Din K.', 'din'],
    ],
    AYT: [
        ['Matematik', 'mat'], ['Fizik', 'fizik'], ['Kimya', 'kimya'],
        ['Biyoloji', 'biyoloji'], ['Edebiyat', 'edebiyat'], ['Tarih', 'tarih'],
        ['Coğrafya', 'cografya'], ['Felsefe', 'felsefe'],
    ],
};

/**
 * "Konu bazında başarı" KARTI — bilinçli olarak grafik değil.
 *
 * Deneme kayıtları ders bazında net içerir; konu bazında doğru/yanlış
 * kırılımı taşımaz. Konu başarısı yüzdesi bu veriden HESAPLANAMAZ.
 * Uydurma yüzde göstermek yerine, konuyu gerçekten izleyen ekranlara
 * yönlendiren dürüst bir kart gösterilir.
 */
export const KonuBazindaAnaliz = () => (
    <div className="bg-surface p-6 rounded-2xl border border-line shadow-sm">
        <h3 className="font-bold text-ink mb-3 flex items-center">
            <ChartNoAxesColumn className="mr-2 text-brand" size={20} />
            Konu Bazında Analiz
        </h3>
        <div className="flex items-start gap-3 bg-info-soft border border-info rounded-xl p-4">
            <Info className="text-info mt-0.5 flex-shrink-0" size={20} />
            <div className="text-sm text-ink-2 leading-relaxed min-w-0">
                <p className="font-bold text-info mb-1">Konu bazında başarı verisi henüz yok</p>
                <p>
                    Deneme kayıtları ders bazında net içerir; konu bazında doğru/yanlış kırılımı
                    taşımaz. Bu yüzden konu bazında başarı yüzdesi gerçek veriden hesaplanamıyor —
                    uydurma değer göstermek yerine gerçek kaynaklara yönlendiriyoruz:
                </p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li><span className="font-semibold text-ink">Konu bazında gerçek takip:</span> Konularım / Konu Takibi</li>
                    <li><span className="font-semibold text-ink">Ders bazında analiz:</span> Gelişim / Genel Bakış</li>
                    <li><span className="font-semibold text-ink">Hata analizi:</span> Hata Defteri</li>
                </ul>
            </div>
        </div>
    </div>
);

const ComparativeAnalysis = ({ studentResults }) => {
    const [viewType, setViewType] = useState('TYT'); // 'TYT' | 'AYT'

    /** Son denemenin ders bazlı netleri — yalnız gerçek (sıfır üstü) değerler. */
    const chartData = useMemo(() => {
        if (!studentResults || studentResults.length === 0) return null;
        const typeResults = studentResults.filter((r) => (r.examType || r.type || 'TYT') === viewType);
        if (typeResults.length === 0) return null;

        const latest = typeResults[typeResults.length - 1];
        const subs = latest.subjects || latest[viewType.toLowerCase()] || {};
        const net = (k) => Number(subs[k]?.net ?? subs[k] ?? 0);

        const data = DERSLER[viewType]
            .map(([ad, anahtar]) => ({ subject: ad, A: +net(anahtar).toFixed(1) }))
            .filter((d) => d.A > 0);

        return data.length ? data : null;
    }, [studentResults, viewType]);

    /** Deneme puanlarının gerçek seyri — sahte sınıf ortalaması YOK. */
    const progressData = useMemo(() => {
        if (!studentResults || studentResults.length === 0) return [];
        return studentResults.map((res, index) => ({
            name: `Deneme ${index + 1}`,
            studentScore: res.score || 0,
        }));
    }, [studentResults]);

    if (!studentResults || studentResults.length === 0) {
        return <div className="p-4 text-center text-ink-2">Henüz analiz edilecek deneme verisi yok.</div>;
    }

    return (
        <div className="space-y-8 animate-fade-in">

            {/* Ders net profili — radar */}
            <div className="bg-surface p-6 rounded-2xl border border-line shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Target size={120} className="text-brand" />
                </div>
                <div className="flex justify-between items-center mb-6 z-10 relative">
                    <h3 className="font-bold text-ink flex items-center">
                        <Users className="mr-2 text-brand" />
                        Ders Net Profili ({viewType})
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
                {chartData ? (
                    <div className="h-80 w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fontWeight: 600 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                                <Radar
                                    name="Netleriniz"
                                    dataKey="A"
                                    stroke="var(--brand)"
                                    fill="var(--brand)"
                                    fillOpacity={0.45}
                                    animationDuration={300}
                                />
                                <Legend />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-ink-3 border-2 border-dashed border-line rounded-3xl">
                        <Activity size={32} className="mb-2 opacity-20" />
                        <p className="text-sm font-medium">Bu sınav türü için veri bulunamadı.</p>
                    </div>
                )}
            </div>

            {/* Puan seyri — çizgi */}
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
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
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
                                animationDuration={300}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default ComparativeAnalysis;
