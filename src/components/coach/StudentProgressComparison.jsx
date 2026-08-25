/**
 * 📊 ÖĞRENCİ GELİŞİM KARŞILAŞTIRMA PANELİ
 * Koç için birden fazla öğrencinin gelişimini yan yana görme
 */
import React, { useState, useMemo } from 'react';
import {
    TrendingUp, TrendingDown, Users, BarChart2, Trophy,
    AlertTriangle, Star, Filter, ChevronDown, Target,
    Minus, ArrowUp, ArrowDown, Activity
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    CartesianGrid, BarChart, Bar, Cell, Legend
} from 'recharts';

// ─── Renk Paleti ──────────────────────────────────────────────────────
const STUDENT_COLORS = [
    'var(--c1)', 'var(--c4)', 'var(--info)', 'var(--ok)',
    'var(--warn)', 'var(--danger)', 'var(--c5)', 'var(--c2)'
];

const getTotalNet = (result) => {
    if (!result) return 0;
    if (result.examType === 'AYT') {
        return Math.max(
            parseFloat(result.sayNet) || 0,
            parseFloat(result.eaNet) || 0,
            parseFloat(result.sozNet) || 0,
            parseFloat(result.dilNet) || 0,
        ) || parseFloat(result.totalNet) || 0;
    }
    if (result.totalNet != null && !isNaN(parseFloat(result.totalNet))) return parseFloat(result.totalNet);
    if (result.subjects) return Object.values(result.subjects).reduce((s, v) => s + (parseFloat(v?.net) || 0), 0);
    return 0;
};

// ─── Trend ikonu ──────────────────────────────────────────────────────
const TrendIcon = ({ value }) => {
    if (value > 2) return <ArrowUp size={14} className="text-ok" />;
    if (value < -2) return <ArrowDown size={14} className="text-danger" />;
    return <Minus size={14} className="text-ink-3" />;
};

// ─── Mini Spark Bar ───────────────────────────────────────────────────
const SparkLine = ({ data, color }) => {
    if (!data?.length) return <span className="text-ink-3 text-xs">—</span>;
    const max = Math.max(...data, 1);
    return (
        <div className="flex items-end gap-px h-6">
            {data.slice(-6).map((val, i) => (
                <div
                    key={i}
                    style={{ height: `${Math.max((val / max) * 100, 4)}%`, backgroundColor: color, opacity: 0.6 + i * 0.07 }}
                    className="w-2 rounded-sm transition-all"
                />
            ))}
        </div>
    );
};

// ─── Ana Bileşen ─────────────────────────────────────────────────────
const StudentProgressComparison = ({ students = [], trials = [], results = [] }) => {
    const [selectedStudents, setSelectedStudents] = useState(
        students.slice(0, 5).map(s => s.id)
    );
    const [viewMode, setViewMode] = useState('trend'); // trend | radar | ranking | table
    const [examTypeFilter, setExamTypeFilter] = useState('TYT');
    const [showStudentPicker, setShowStudentPicker] = useState(false);

    // Seçili öğrencilerin verilerini hesapla
    const studentData = useMemo(() => {
        return students
            .filter(s => selectedStudents.includes(s.id))
            .map((student, idx) => {
                const studentResults = results
                    .filter(r => (r.studentId === student.id || r.studentName === student.name)
                        && r.examType === examTypeFilter)
                    .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

                const nets = studentResults.map(r => getTotalNet(r));
                const latestNet = nets[nets.length - 1] || 0;
                const prevNet = nets[nets.length - 2] || 0;
                const trend = latestNet - prevNet;
                const avgNet = nets.length ? nets.reduce((a, b) => a + b, 0) / nets.length : 0;
                const maxNet = nets.length ? Math.max(...nets) : 0;

                // Trend serisi (deneme adı + net)
                const trendSeries = studentResults.map((r, i) => {
                    const trial = trials.find(t => t.id === r.trialId);
                    return {
                        exam: trial?.name?.substring(0, 8) || `D${i + 1}`,
                        [student.name]: parseFloat(getTotalNet(r).toFixed(1)),
                    };
                });

                // Ders bazlı radar (son deneme)
                const lastResult = studentResults[studentResults.length - 1];
                const radarData = lastResult?.subjects ? Object.entries(lastResult.subjects)
                    .filter(([k, v]) => parseFloat(v?.net) > 0)
                    .slice(0, 6)
                    .map(([k, v]) => ({
                        subject: k.charAt(0).toUpperCase() + k.slice(1, 5),
                        [student.name]: Math.round(((parseFloat(v?.net) || 0) / 40) * 100),
                    })) : [];

                return {
                    student,
                    color: STUDENT_COLORS[idx % STUDENT_COLORS.length],
                    nets,
                    latestNet,
                    prevNet,
                    trend,
                    avgNet: parseFloat(avgNet.toFixed(1)),
                    maxNet: parseFloat(maxNet.toFixed(1)),
                    examCount: studentResults.length,
                    trendSeries,
                    radarData,
                    grade: student.grade || '?',
                };
            });
    }, [students, selectedStudents, results, trials, examTypeFilter]);

    // Trend grafiği için merge edilmiş veri
    const mergedTrendData = useMemo(() => {
        const trialMap = new Map();
        studentData.forEach(sd => {
            sd.trendSeries.forEach(point => {
                if (!trialMap.has(point.exam)) trialMap.set(point.exam, { exam: point.exam });
                trialMap.set(point.exam, { ...trialMap.get(point.exam), ...point });
            });
        });
        return Array.from(trialMap.values());
    }, [studentData]);

    // Radar için merge
    const mergedRadarData = useMemo(() => {
        const subjectMap = new Map();
        studentData.forEach(sd => {
            sd.radarData.forEach(point => {
                if (!subjectMap.has(point.subject)) subjectMap.set(point.subject, { subject: point.subject });
                subjectMap.set(point.subject, { ...subjectMap.get(point.subject), ...point });
            });
        });
        return Array.from(subjectMap.values()).slice(0, 7);
    }, [studentData]);

    // Sıralama
    const rankingData = [...studentData].sort((a, b) => b.latestNet - a.latestNet);

    const toggleStudent = (id) => {
        setSelectedStudents(prev =>
            prev.includes(id)
                ? prev.length > 1 ? prev.filter(s => s !== id) : prev
                : prev.length < 8 ? [...prev, id] : prev
        );
    };

    if (students.length === 0) return (
        <div className="bg-surface rounded-2xl p-8 text-center border border-line">
            <Users size={32} className="text-ink-3 mx-auto mb-3" />
            <p className="text-ink-3 text-sm">Öğrenci verisi yok</p>
        </div>
    );

    return (
        <div className="space-y-4">
            {/* ── HEADER ───────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand-soft rounded-xl flex items-center justify-center">
                        <TrendingUp size={16} className="text-brand" />
                    </div>
                    <h2 className="font-black text-ink text-lg">Öğrenci Gelişim Karşılaştırması</h2>
                </div>

                {/* View Mode Toggles */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Sınav Tipi */}
                    <div className="flex gap-1 bg-surface-3 rounded-xl p-1">
                        {['TYT', 'AYT', 'LGS'].map(et => (
                            <button
                                key={et}
                                onClick={() => setExamTypeFilter(et)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition
                                    ${examTypeFilter === et ? 'bg-surface text-brand shadow-sm' : 'text-ink-2 hover:text-ink-2'}`}
                            >
                                {et}
                            </button>
                        ))}
                    </div>

                    {/* Görünüm */}
                    <div className="flex gap-1 bg-surface-3 rounded-xl p-1">
                        {[
                            { id: 'trend', icon: TrendingUp, label: 'Trend' },
                            { id: 'radar', icon: Activity, label: 'Radar' },
                            { id: 'ranking', icon: Trophy, label: 'Sıralama' },
                            { id: 'table', icon: BarChart2, label: 'Tablo' },
                        ].map(v => (
                            <button
                                key={v.id}
                                onClick={() => setViewMode(v.id)}
                                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition
                                    ${viewMode === v.id ? 'bg-surface text-brand shadow-sm' : 'text-ink-2 hover:text-ink-2'}`}
                            >
                                <v.icon size={12} />
                                <span className="hidden sm:inline">{v.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Öğrenci Seç */}
                    <div className="relative">
                        <button
                            onClick={() => setShowStudentPicker(!showStudentPicker)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-hover transition"
                        >
                            <Users size={12} />
                            {selectedStudents.length}/{students.length}
                            <ChevronDown size={12} className={`transition-transform ${showStudentPicker ? 'rotate-180' : ''}`} />
                        </button>

                        {showStudentPicker && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setShowStudentPicker(false)} />
                                <div className="absolute right-0 top-8 bg-surface rounded-2xl shadow-xl border border-line p-3 z-40 min-w-[220px] max-h-60 overflow-y-auto">
                                    <p className="text-xs font-bold text-ink-3 uppercase mb-2">Öğrenci Seç (maks. 8)</p>
                                    {students.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => toggleStudent(s.id)}
                                            className={`w-full flex items-center gap-3 p-2 rounded-xl text-sm font-semibold transition mb-1
                                                ${selectedStudents.includes(s.id) ? 'bg-brand-soft text-brand' : 'hover:bg-surface-2 text-ink-2'}`}
                                        >
                                            <div
                                                className="w-6 h-6 rounded-full flex items-center justify-center text-ink text-xs font-black"
                                                style={{ backgroundColor: STUDENT_COLORS[students.indexOf(s) % STUDENT_COLORS.length] }}
                                            >
                                                {s.name?.charAt(0)}
                                            </div>
                                            <span className="flex-1 text-left truncate">{s.name}</span>
                                            {selectedStudents.includes(s.id) && (
                                                <div className="w-4 h-4 bg-brand rounded-full flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-surface rounded-full" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── ÖĞRENCİ ÖZET KARTLARI ───────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {studentData.map(sd => (
                    <div
                        key={sd.student.id}
                        className="bg-surface rounded-2xl p-4 border border-line shadow-sm hover:shadow-md transition cursor-pointer"
                        style={{ borderLeftColor: sd.color, borderLeftWidth: 3 }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-ink text-xs font-black"
                                style={{ backgroundColor: sd.color }}
                            >
                                {sd.student.name?.charAt(0)}
                            </div>
                            <div className="flex items-center gap-1">
                                <TrendIcon value={sd.trend} />
                                <span className={`text-xs font-bold ${sd.trend > 0 ? 'text-ok' : sd.trend < 0 ? 'text-danger' : 'text-ink-3'}`}>
                                    {sd.trend > 0 ? '+' : ''}{sd.trend.toFixed(1)}
                                </span>
                            </div>
                        </div>
                        <p className="font-black text-ink text-sm truncate">{sd.student.name}</p>
                        <p className="text-xs text-ink-3 mb-2">{sd.grade}. Sınıf • {sd.examCount} deneme</p>
                        <div className="flex items-end justify-between">
                            <div>
                                <span className="text-2xl font-black" style={{ color: sd.color }}>
                                    {sd.latestNet.toFixed(1)}
                                </span>
                                <span className="text-xs text-ink-3 ml-1">net</span>
                            </div>
                            <SparkLine data={sd.nets} color={sd.color} />
                        </div>
                    </div>
                ))}
            </div>

            {/* ── GRAFİK ALANI ────────────────────────────────────── */}
            <div className="bg-surface rounded-2xl border border-line shadow-sm p-5">

                {/* TREND GRAFİĞİ */}
                {viewMode === 'trend' && (
                    <>
                        <h3 className="font-bold text-ink-2 text-sm mb-4 flex items-center gap-2">
                            <TrendingUp size={16} className="text-brand" />
                            Net Gelişim Trendi
                        </h3>
                        {mergedTrendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={mergedTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"  vertical={false} />
                                    <XAxis dataKey="exam" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                                    />
                                    {studentData.map(sd => (
                                        <Line
                                            key={sd.student.id}
                                            type="monotone"
                                            dataKey={sd.student.name}
                                            stroke={sd.color}
                                            strokeWidth={2.5}
                                            dot={{ r: 4, strokeWidth: 2, fill: 'white', stroke: sd.color }}
                                            activeDot={{ r: 6 }}
                                         animationDuration={300} />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-40 text-ink-3 text-sm">
                                Yeterli deneme verisi yok ({examTypeFilter} sınavı)
                            </div>
                        )}
                    </>
                )}

                {/* RADAR GRAFİĞİ */}
                {viewMode === 'radar' && (
                    <>
                        <h3 className="font-bold text-ink-2 text-sm mb-4 flex items-center gap-2">
                            <Activity size={16} className="text-c4" />
                            Ders Performans Karşılaştırması (Son Deneme)
                        </h3>
                        {mergedRadarData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <RadarChart data={mergedRadarData}>
                                    <PolarGrid stroke="var(--line)" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                                    {studentData.map(sd => (
                                        <Radar
                                            key={sd.student.id}
                                            name={sd.student.name}
                                            dataKey={sd.student.name}
                                            stroke={sd.color}
                                            fill={sd.color}
                                            fillOpacity={0.1}
                                            strokeWidth={2}
                                         animationDuration={300} />
                                    ))}
                                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-40 text-ink-3 text-sm">
                                Ders detaylı veri yok
                            </div>
                        )}
                    </>
                )}

                {/* SIRALAMA */}
                {viewMode === 'ranking' && (
                    <>
                        <h3 className="font-bold text-ink-2 text-sm mb-4 flex items-center gap-2">
                            <Trophy size={16} className="text-warn" />
                            Güncel Net Sıralaması
                        </h3>
                        <div className="space-y-2">
                            {rankingData.map((sd, i) => {
                                const maxNet = Math.max(...rankingData.map(d => d.latestNet), 1);
                                const pct = (sd.latestNet / maxNet) * 100;
                                const medals = ['🥇', '🥈', '🥉'];
                                return (
                                    <div key={sd.student.id} className="flex items-center gap-3 p-3 bg-surface-2 rounded-xl">
                                        <span className="text-xl w-7 text-center">{medals[i] || `${i + 1}.`}</span>
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-ink text-xs font-black flex-shrink-0"
                                            style={{ backgroundColor: sd.color }}
                                        >
                                            {sd.student.name?.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-bold text-ink text-sm truncate">{sd.student.name}</p>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    <TrendIcon value={sd.trend} />
                                                    <span className="font-black text-sm" style={{ color: sd.color }}>
                                                        {sd.latestNet.toFixed(1)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-yavas"
                                                    style={{ width: `${pct}%`, backgroundColor: sd.color }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* TABLO */}
                {viewMode === 'table' && (
                    <>
                        <h3 className="font-bold text-ink-2 text-sm mb-4 flex items-center gap-2">
                            <BarChart2 size={16} className="text-info" />
                            Detay Karşılaştırma Tablosu
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-surface-2 border-b border-line">
                                        {['Öğrenci', 'Sınıf', 'Deneme', 'Son Net', 'Ort.', 'Maks.', 'Değişim', 'Trend'].map(h => (
                                            <th key={h} className="text-left py-2 px-2 text-xs font-semibold text-ink-3 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rankingData.map((sd, i) => (
                                        <tr key={sd.student.id} className="border-b border-line hover:bg-surface-2 transition">
                                            <td className="py-2.5 px-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-ink text-[10px] font-black"
                                                        style={{ backgroundColor: sd.color }}>
                                                        {sd.student.name?.charAt(0)}
                                                    </div>
                                                    <span className="font-semibold text-ink truncate max-w-[100px]">{sd.student.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-2 text-ink-2 text-xs">{sd.grade}. Sınıf</td>
                                            <td className="py-2.5 px-2 text-ink-2 font-medium">{sd.examCount}</td>
                                            <td className="py-2.5 px-2">
                                                <span className="font-black" style={{ color: sd.color }}>{sd.latestNet.toFixed(1)}</span>
                                            </td>
                                            <td className="py-2.5 px-2 text-ink-2">{sd.avgNet}</td>
                                            <td className="py-2.5 px-2 text-ink-2">{sd.maxNet}</td>
                                            <td className="py-2.5 px-2">
                                                <span className={`font-bold text-xs ${sd.trend > 0 ? 'text-ok' : sd.trend < -0.5 ? 'text-danger' : 'text-ink-3'}`}>
                                                    {sd.trend > 0 ? '+' : ''}{sd.trend.toFixed(1)}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-2">
                                                <SparkLine data={sd.nets} color={sd.color} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default StudentProgressComparison;
