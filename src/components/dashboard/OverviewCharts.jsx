import React, { useMemo } from 'react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
    PieChart, Pie, Cell, BarChart, Bar, LabelList,
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, BarChart3, Info } from 'lucide-react';
import Grafik from '../charts/Grafik';
import OrtakTooltip from '../charts/OrtakTooltip';
import { izgaraOzellikleri, eksenOzellikleri } from '../charts/grafikTemasi';

/**
 * 📈 KOÇ ÖZET GRAFİKLERİ
 *
 * Özet ekranında yalnızca 4 sayı ve bir tablo vardı; koç "sınıf nereye
 * gidiyor?" sorusunu tablodan okumak zorundaydı. Bu üç grafik o soruyu
 * doğrudan yanıtlar ve hepsi ekrandaki gerçek veriden beslenir:
 *
 *   1. Sınıf net trendi        → denemeler zaman içinde yükseliyor mu?
 *   2. Program uyum dağılımı   → kaç öğrenci programına uyuyor?
 *   3. Sınıf bazlı ortalama    → hangi sınıf geride?
 *
 * Her grafiğin altında ne anlama geldiğini anlatan bir cümle vardır —
 * grafik "şık" değil, okunabilir olmalı.
 */

const AXIS = { fontSize: 10, fontWeight: 800 };

const Panel = ({ icon, title, hint, children, accent = 'var(--c1)' }) => {
    const Icon = icon;
    return (
        <div className="chart-card">
            <div className="flex items-center gap-2.5 mb-3">
                <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                        color: accent,
                        background: `${accent}1f`,
                        border: `1px solid ${accent}44`,
                    }}
                >
                    <Icon size={15} />
                </div>
                <h4 className="text-ink font-black text-[13px] tracking-tight flex-1 min-w-0 truncate">
                    {title}
                </h4>
            </div>
            {children}
            {hint && (
                <p className="text-[10px] text-ink-3 font-bold leading-snug flex items-start gap-1.5 pt-2 pb-2">
                    <Info size={11} className="shrink-0 mt-px" /> {hint}
                </p>
            )}
        </div>
    );
};

const Empty = ({ text }) => (
    <div className="h-[150px] flex items-center justify-center">
        <p className="text-ink-3 text-[11px] font-bold text-center px-4">{text}</p>
    </div>
);

const OverviewCharts = ({ students = [], results = [], statusById = new Map() }) => {

    /* 1 ── Sınıf net trendi: denemeleri tarihe göre grupla, ortalamasını al */
    const netTrend = useMemo(() => {
        const byDate = new Map();
        results.forEach((r) => {
            const net = parseFloat(r.totalNet);
            if (!Number.isFinite(net)) return;
            const raw = r.examDate || r.uploadedAt || r.date;
            const d = raw ? new Date(raw) : null;
            if (!d || Number.isNaN(d.getTime())) return;
            const key = d.toISOString().slice(0, 10);
            const acc = byDate.get(key) || { sum: 0, n: 0 };
            acc.sum += net; acc.n += 1;
            byDate.set(key, acc);
        });
        return [...byDate.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-12)
            .map(([key, v]) => ({
                label: new Date(key).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
                net: Math.round((v.sum / v.n) * 10) / 10,
                adet: v.n,
            }));
    }, [results]);

    /* 2 ── Program uyum dağılımı */
    const compliance = useMemo(() => {
        const buckets = [
            { name: 'İyi (%75+)', value: 0, color: 'var(--ok)' },
            { name: 'Orta (%50-74)', value: 0, color: 'var(--warn)' },
            { name: 'Düşük (<%50)', value: 0, color: 'var(--danger)' },
            { name: 'Program yok', value: 0, color: 'var(--ink-3)' },
        ];
        students.forEach((s) => {
            const st = statusById.get(String(s.id)) || statusById.get(s.id);
            const rate = st?.programRate;
            if (rate == null) buckets[3].value += 1;
            else if (rate >= 75) buckets[0].value += 1;
            else if (rate >= 50) buckets[1].value += 1;
            else buckets[2].value += 1;
        });
        return buckets.filter((b) => b.value > 0);
    }, [students, statusById]);

    /* 3 ── Sınıf bazlı ortalama net */
    const byGrade = useMemo(() => {
        const map = new Map();
        students.forEach((s) => {
            const sNum = s.schoolNumber ? String(s.schoolNumber).trim() : null;
            if (!sNum) return;
            const mine = results.filter((r) => r.number && String(r.number).trim() === sNum);
            if (!mine.length) return;
            const nets = mine.map((r) => parseFloat(r.totalNet)).filter(Number.isFinite);
            if (!nets.length) return;
            const avg = nets.reduce((a, b) => a + b, 0) / nets.length;
            const g = String(s.grade || '—');
            const acc = map.get(g) || { sum: 0, n: 0 };
            acc.sum += avg; acc.n += 1;
            map.set(g, acc);
        });
        return [...map.entries()]
            .map(([grade, v]) => ({ grade: `${grade}. Sınıf`, net: Math.round((v.sum / v.n) * 10) / 10, kisi: v.n }))
            .sort((a, b) => a.grade.localeCompare(b.grade, 'tr'));
    }, [students, results]);

    const totalCompliance = compliance.reduce((a, b) => a + b.value, 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* 1. Net trendi */}
            <div className="lg:col-span-2">
                <Panel
                    icon={TrendingUp}
                    accent="var(--highlight)"
                    title="Sınıf Net Ortalaması — Deneme Trendi"
                    hint={netTrend.length > 1
                        ? `Son ${netTrend.length} deneme tarihinin sınıf ortalaması. Çizgi yükseliyorsa sınıf genel olarak ilerliyor demektir.`
                        : 'Trend çizgisi için en az iki farklı tarihte deneme sonucu gerekir.'}
                >
                    {/* Ortak kabuk: yükseklik ekrana göre, özet satırı ölçümden
                        gelir, veri yoksa eksen takımı yerine boş durum çizilir. */}
                    <Grafik
                        veriVar={netTrend.length > 1}
                        ozetVerisi={netTrend.map((d) => d.net)}
                        ozetBirimi=" net"
                        artisIyi
                        boy="kisa"
                        bosBaslik="Henüz yeterli deneme yok"
                        bosAciklama="En az iki deneme sonucu yüklendiğinde eğilim burada görünür."
                    >
                        <AreaChart data={netTrend} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--highlight)" stopOpacity={0.55} />
                                    <stop offset="100%" stopColor="var(--highlight)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid {...izgaraOzellikleri()} />
                            <XAxis dataKey="label" {...eksenOzellikleri()} />
                            <YAxis {...eksenOzellikleri()} width={44} />
                            <Tooltip content={<OrtakTooltip birim=" net" />} cursor={{ stroke: 'var(--line-2)' }} />
                            <Area
                                type="monotone" dataKey="net" name="Ortalama" stroke="var(--highlight)" strokeWidth={2.5}
                                fill="url(#netFill)" dot={{ r: 3, fill: 'var(--highlight)', strokeWidth: 0 }}
                                activeDot={{ r: 5 }}
                                animationDuration={300} />
                        </AreaChart>
                    </Grafik>
                </Panel>
            </div>

            {/* 2. Program uyumu */}
            <Panel
                icon={PieIcon}
                accent="var(--accent)"
                title="Program Uyum Dağılımı"
                hint={totalCompliance
                    ? `${totalCompliance} öğrencinin haftalık programını ne kadar tamamladığı. Kırmızı dilim büyükse program yükü fazla olabilir.`
                    : 'Öğrencilere program atandıkça bu dağılım dolar.'}
            >
                {totalCompliance ? (
                    <>
                        <ResponsiveContainer width="100%" height={158}>
                            <PieChart>
                                <Pie
                                    data={compliance} dataKey="value" nameKey="name"
                                    innerRadius={42} outerRadius={66} paddingAngle={3} stroke="none"
                                >
                                    {compliance.map((c) => <Cell key={c.name} fill={c.color} />)}
                                </Pie>
                                <Tooltip formatter={(v, n) => [`${v} öğrenci`, n]} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
                            {compliance.map((c) => (
                                <span key={c.name} className="flex items-center gap-1.5 text-[10px] font-bold text-ink-3">
                                    <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                                    {c.name} · {c.value}
                                </span>
                            ))}
                        </div>
                    </>
                ) : (
                    <Empty text="Henüz program uyum verisi yok." />
                )}
            </Panel>

            {/* 3. Sınıf bazlı ortalama */}
            <div className="lg:col-span-3">
                <Panel
                    icon={BarChart3}
                    accent="var(--c1)"
                    title="Sınıf Düzeyine Göre Ortalama Net"
                    hint={byGrade.length
                        ? 'Her çubuk o sınıf düzeyindeki öğrencilerin deneme ortalamasıdır. Belirgin şekilde geride kalan düzey varsa müdahale önceliği odur.'
                        : 'Öğrencilerin okul numarası deneme sonuçlarıyla eşleştiğinde bu grafik dolar.'}
                >
                    {byGrade.length ? (
                        <ResponsiveContainer width="100%" height={190}>
                            <BarChart data={byGrade} margin={{ top: 18, right: 8, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="grade" tick={AXIS} tickLine={false} axisLine={false} />
                                <YAxis tick={AXIS} tickLine={false} axisLine={false} width={44} />
                                <Tooltip
                                    formatter={(v, n) => (n === 'net' ? [`${v} net`, 'Ortalama'] : [v, n])}
                                    labelFormatter={(l) => l}
                                />
                                <Bar dataKey="net" radius={[8, 8, 0, 0]} maxBarSize={54}>
                                    {byGrade.map((g, i) => (
                                        <Cell key={g.grade} fill={['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)'][i % 5]} />
                                    ))}
                                    <LabelList
                                        dataKey="net" position="top"
                                        style={{ fill: 'var(--ink-2)', fontSize: 10, fontWeight: 800 }}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <Empty text="Sınıf bazlı karşılaştırma için deneme sonucu gerekiyor." />
                    )}
                </Panel>
            </div>
        </div>
    );
};

export default OverviewCharts;
