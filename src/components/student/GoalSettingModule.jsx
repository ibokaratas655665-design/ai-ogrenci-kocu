/**
 * 🎯 HEDEF BELİRLEME MODÜLÜ
 * Öğrenci YKS/LGS hedef netlerini belirler, koç takip eder
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
    Target, Save, TrendingUp, ChevronDown, ChevronUp,
    BookOpen, Star, Info, Flame, Edit3, CheckCircle,
    Award, AlertTriangle, Zap, BarChart2
} from 'lucide-react';
import { oku } from '../../services/veriDeposu';

// ─── TYT Ders Hedefleri ───────────────────────────────────────────────
const TYT_SUBJECTS = [
    { key: 'turkce', label: 'Türkçe', max: 40, icon: '📖', color: 'var(--c1)' },
    { key: 'matematik', label: 'Matematik', max: 40, icon: '🔢', color: 'var(--c4)' },
    { key: 'fizik', label: 'Fizik', max: 7, icon: '⚡', color: 'var(--info)' },
    { key: 'kimya', label: 'Kimya', max: 7, icon: '🧪', color: 'var(--ok)' },
    { key: 'biyoloji', label: 'Biyoloji', max: 6, icon: '🧬', color: 'var(--c2)' },
    { key: 'tarih', label: 'Tarih', max: 5, icon: '🏛️', color: 'var(--warn)' },
    { key: 'cografya', label: 'Coğrafya', max: 5, icon: '🌍', color: 'var(--c2)' },
    { key: 'felsefe', label: 'Felsefe', max: 5, icon: '💭', color: 'var(--c4)' },
    { key: 'din', label: 'Din Kül.', max: 5, icon: '🕌', color: 'var(--warn)' },
];

const AYT_SUBJECTS = {
    SAY: [
        { key: 'ayt_matematik', label: 'Mat (AYT)', max: 30, icon: '🔢', color: 'var(--c1)' },
        { key: 'fizik', label: 'Fizik', max: 14, icon: '⚡', color: 'var(--info)' },
        { key: 'kimya', label: 'Kimya', max: 13, icon: '🧪', color: 'var(--ok)' },
        { key: 'biyoloji', label: 'Biyoloji', max: 13, icon: '🧬', color: 'var(--c2)' },
    ],
    EA: [
        { key: 'ayt_matematik', label: 'Mat (AYT)', max: 30, icon: '🔢', color: 'var(--c1)' },
        { key: 'edebiyat', label: 'Edebiyat', max: 24, icon: '📝', color: 'var(--c4)' },
        { key: 'tarih1', label: 'Tarih-1', max: 10, icon: '🏛️', color: 'var(--warn)' },
        { key: 'cografya1', label: 'Coğrafya-1', max: 6, icon: '🌍', color: 'var(--c2)' },
    ],
    SÖZ: [
        { key: 'edebiyat', label: 'Edebiyat', max: 24, icon: '📝', color: 'var(--c4)' },
        { key: 'tarih1', label: 'Tarih-1', max: 10, icon: '🏛️', color: 'var(--warn)' },
        { key: 'cografya1', label: 'Coğrafya-1', max: 6, icon: '🌍', color: 'var(--c2)' },
        { key: 'tarih2', label: 'Tarih-2', max: 11, icon: '🏺', color: 'var(--warn)' },
        { key: 'cografya2', label: 'Coğrafya-2', max: 11, icon: '🌐', color: 'var(--ok)' },
        { key: 'felsefe', label: 'Felsefe G.', max: 12, icon: '💭', color: 'var(--c4)' },
        { key: 'din', label: 'Din Kül.', max: 6, icon: '🕌', color: 'var(--warn)' },
    ],
};

// ÖSYM gerçek YKS puan formülü (2024 katsayıları)
// TYT: SAY=0.3, EA=0.4, SÖZ=0.4 | AYT: SAY=1.06, EA=1.1, SÖZ=1.08
const calcYKSScore = (tytNets, aytNets, type = 'SAY') => {
    const TYT_COEFF = { SAY: 0.3, EA: 0.4, SÖZ: 0.4, DİL: 0.5 };
    const AYT_COEFF = { SAY: 1.06, EA: 1.1, SÖZ: 1.08, DİL: 0.85 };
    const tytTotal = Object.values(tytNets).reduce((a, b) => a + (parseFloat(b) || 0), 0);
    const aytTotal = Object.values(aytNets).reduce((a, b) => a + (parseFloat(b) || 0), 0);
    // TYT net katsayısı: Her 1 TYT neti ≈ puana katkı
    // Taban puan: ~300 (ÖSYM başlangıç puanı)
    const tytContrib = tytTotal * (TYT_COEFF[type] || 0.3) * 1.4;
    const aytContrib = aytTotal * (AYT_COEFF[type] || 1.06);
    return Math.round(300 + tytContrib + aytContrib);
};

// ─── Slider Bileşeni ──────────────────────────────────────────────────
const SubjectSlider = ({ subject, value, onChange, currentNet }) => {
    const pct = (value / subject.max) * 100;
    const currentPct = currentNet ? (currentNet / subject.max) * 100 : 0;
    const gap = value - (currentNet || 0);

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-base">{subject.icon}</span>
                    <span className="text-sm font-bold text-ink-2">{subject.label}</span>
                    {currentNet != null && (
                        <span className="text-xs text-ink-3">
                            (Şu an: <span className="font-bold text-ink-2">{currentNet.toFixed(1)}</span>)
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {gap !== 0 && currentNet != null && (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-lg ${gap > 0 ? 'bg-ok-soft text-ok' : 'bg-danger-soft text-danger'}`}>
                            {gap > 0 ? '+' : ''}{gap.toFixed(1)}
                        </span>
                    )}
                    <span className="font-black text-brand text-sm w-12 text-right">
                        {value} <span className="text-xs text-ink-3 font-normal">/ {subject.max}</span>
                    </span>
                </div>
            </div>

            <div className="relative h-5">
                {/* Mevcut net göstergesi */}
                {currentNet != null && currentNet > 0 && (
                    <div
                        className="absolute top-0 bottom-0 w-0.5 bg-gray-400 rounded-full z-10"
                        style={{ left: `${currentPct}%` }}
                        title={`Mevcut: ${currentNet.toFixed(1)}`}
                    />
                )}
                <input
                    type="range"
                    min={0}
                    max={subject.max}
                    step={0.5}
                    value={value}
                    onChange={e => onChange(parseFloat(e.target.value))}
                    style={{ '--color': subject.color }}
                    className="w-full h-5 appearance-none rounded-full cursor-pointer subject-slider"
                />
            </div>
        </div>
    );
};

// ─── Ana Bileşen ─────────────────────────────────────────────────────
const GoalSettingModule = ({ user, examData = [] }) => {
    const LS_KEY = `goals_${user?.id || 'student'}`;

    const defaultTYT = Object.fromEntries(TYT_SUBJECTS.map(s => [s.key, Math.round(s.max * 0.6)]));
    const defaultAYT = { SAY: {}, EA: {}, SÖZ: {} };

    const [tytGoals, setTytGoals] = useState(() => {
        return oku(LS_KEY + '_tyt', null) || defaultTYT;
    });
    const [aytType, setAytType] = useState(() => localStorage.getItem(LS_KEY + '_ayttype') || 'SAY');
    const [aytGoals, setAytGoals] = useState(() => {
        return oku(LS_KEY + '_ayt', null) || {};
    });
    const [showAYT, setShowAYT] = useState(false);
    const [targetUniv, setTargetUniv] = useState(() => localStorage.getItem(LS_KEY + '_univ') || '');
    const [saved, setSaved] = useState(false);

    // ── Mevcut netleri hesapla (hem flat fields hem subjects objesinden) ──
    const getSubjNet = (exam, key) => {
        // Doğrudan alan
        if (exam[key] != null && !isNaN(parseFloat(exam[key]))) return parseFloat(exam[key]);
        if (exam.subjects?.[key] != null) {
            const v = exam.subjects[key];
            if (typeof v === 'object') return parseFloat(v.net ?? 0);
            return parseFloat(v) || 0;
        }
        return 0;
    };

    // Son 3 TYT denemesinin ortalamasından mevcut net
    const tytExams = [...(examData || [])]
        .filter(e => (e.examType || 'TYT') === 'TYT')
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);

    const latestExam = tytExams[0] || null;

    // GoalSettingModule'deki key map + flatten
    const KEY_MAP = {
        turkce: ['turkce'],
        matematik: ['mat', 'matematik'],
        fizik: ['fizik'],
        kimya: ['kimya'],
        biyoloji: ['biyoloji'],
        tarih: ['tarih', 'sosyal'],
        cografya: ['cografya'],
        felsefe: ['felsefe'],
        din: ['din'],
    };

    const currentNets = {};
    if (tytExams.length > 0) {
        TYT_SUBJECTS.forEach(s => {
            const aliases = KEY_MAP[s.key] || [s.key];
            let sum = 0; let cnt = 0;
            tytExams.forEach(exam => {
                aliases.forEach(alias => {
                    const n = getSubjNet(exam, alias);
                    if (n > 0) { sum += n; cnt++; }
                });
            });
            currentNets[s.key] = cnt > 0 ? sum / cnt : 0;
        });
    }

    const currentTotal = Object.values(currentNets).reduce((a, b) => a + (b || 0), 0);

    // Hedef TYT net toplamı (tytGoals slider değerlerinin toplamı)
    const tytTargetTotal = Object.values(tytGoals).reduce((a, b) => a + (parseFloat(b) || 0), 0);

    const estScore = calcYKSScore(tytGoals, aytGoals, aytType);

    const handleSave = () => {
        localStorage.setItem(LS_KEY + '_tyt', JSON.stringify(tytGoals));
        localStorage.setItem(LS_KEY + '_ayt', JSON.stringify(aytGoals));
        localStorage.setItem(LS_KEY + '_ayttype', aytType);
        localStorage.setItem(LS_KEY + '_univ', targetUniv);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const setTytGoal = (key, val) => setTytGoals(prev => ({ ...prev, [key]: val }));
    const setAytGoal = (key, val) => setAytGoals(prev => ({ ...prev, [key]: val }));

    const aytSubjects = AYT_SUBJECTS[aytType] || AYT_SUBJECTS.SAY;

    return (
        <div className="space-y-5 animate-fade-in">
            {/* ── HEADER ────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-2xl font-black text-ink flex items-center gap-2">
                        <Target className="text-brand" size={26} />
                        Hedeflerim
                    </h1>
                    <p className="text-sm text-ink-2 mt-0.5">Her ders için hedef net belirle — sistemin seni izlesin</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition shadow-md
                            ${saved ? 'bg-ok text-white' : 'bg-brand text-white hover:bg-brand-hover'}`}
                    >
                        {saved ? <><CheckCircle size={16} /> Kaydedildi!</> : <><Save size={16} /> Kaydet</>}
                    </button>
                </div>
            </div>

            {/* ── ÖZET KARTLARI ──────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Hedef TYT Net', value: tytTargetTotal.toFixed(1), icon: Target, color: 'indigo', sub: `/ ${TYT_SUBJECTS.reduce((a, s) => a + s.max, 0)}` },
                    { label: 'Mevcut Net', value: currentTotal.toFixed(1), icon: BarChart2, color: 'violet', sub: 'son deneme' },
                    { label: 'Geliştirilecek', value: Math.max(tytTargetTotal - currentTotal, 0).toFixed(1), icon: TrendingUp, color: 'emerald', sub: 'net artışı' },
                    { label: 'Tahmini Puan', value: estScore, icon: Star, color: 'amber', sub: aytType + ' puanı' },
                ].map(item => (
                    <div key={item.label} className={`bg-gradient-to-br from-${item.color}-50 to-${item.color}-100/50 rounded-2xl p-4 border border-${item.color}-100`}>
                        <div className={`w-8 h-8 bg-${item.color}-100 rounded-xl flex items-center justify-center mb-2`}>
                            <item.icon size={16} className={`text-${item.color}-600`} />
                        </div>
                        <p className="text-xs text-ink-2 font-medium">{item.label}</p>
                        <p className={`text-2xl font-black text-${item.color}-700`}>{item.value}</p>
                        <p className="text-xs text-ink-3">{item.sub}</p>
                    </div>
                ))}
            </div>

            {/* ── HEDEF ÜNİVERSİTE ──────────────────────────────── */}
            <div className="bg-surface rounded-2xl border border-line shadow-sm p-4">
                <label className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Award size={14} className="text-warn" /> Hedef Üniversite / Bölüm
                </label>
                <input
                    value={targetUniv}
                    onChange={e => setTargetUniv(e.target.value)}
                    placeholder="Örn: Boğaziçi Üniversitesi — Bilgisayar Mühendisliği..."
                    className="w-full border border-line rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-400 outline-none text-ink"
                />
            </div>

            {/* ── TYT HEDEFLERİ ─────────────────────────────────── */}
            <div className="bg-surface rounded-2xl border border-line shadow-sm p-5">
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 bg-brand-soft rounded-xl flex items-center justify-center">
                        <BookOpen size={16} className="text-brand" />
                    </div>
                    <div>
                        <h2 className="font-black text-ink">TYT Hedef Netler</h2>
                        <p className="text-xs text-ink-3">Gri çizgi = mevcut durumun</p>
                    </div>
                    <span className="ml-auto bg-brand text-white text-xs font-black px-3 py-1 rounded-full">
                        Hedef: {tytTargetTotal.toFixed(0)} net
                    </span>
                </div>

                <div className="space-y-5">
                    {TYT_SUBJECTS.map(s => (
                        <SubjectSlider
                            key={s.key}
                            subject={s}
                            value={tytGoals[s.key] || 0}
                            onChange={val => setTytGoal(s.key, val)}
                            currentNet={tytExams.length > 0 ? (currentNets[s.key] ?? null) : null}
                        />
                    ))}
                </div>
            </div>

            {/* ── AYT HEDEFLERİ ─────────────────────────────────── */}
            <div className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden">
                <button
                    onClick={() => setShowAYT(!showAYT)}
                    className="w-full flex items-center justify-between p-5 hover:bg-surface-2 transition"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] rounded-xl flex items-center justify-center">
                            <Zap size={16} className="text-c4" />
                        </div>
                        <div className="text-left">
                            <h2 className="font-black text-ink">AYT Hedef Netler</h2>
                            <p className="text-xs text-ink-3">Sayısal / Eşit Ağırlık / Sözel</p>
                        </div>
                    </div>
                    {showAYT ? <ChevronUp size={20} className="text-ink-3" /> : <ChevronDown size={20} className="text-ink-3" />}
                </button>

                {showAYT && (
                    <div className="px-5 pb-5 space-y-5">
                        {/* AYT Türü */}
                        <div className="flex gap-2">
                            {Object.keys(AYT_SUBJECTS).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setAytType(t)}
                                    className={`flex-1 py-2 rounded-xl text-xs font-black transition border
                                        ${aytType === t ? 'bg-c4 text-ink border-purple-600 shadow-md' : 'bg-surface text-ink-2 border-line hover:bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))]'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        {aytSubjects.map(s => (
                            <SubjectSlider
                                key={s.key}
                                subject={s}
                                value={aytGoals[s.key] || 0}
                                onChange={val => setAytGoal(s.key, val)}
                                currentNet={null}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Tahmini Başarı İpuçları ────────────────────────── */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-warn rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Flame size={18} className="text-warn" />
                    <h3 className="font-black text-ink">Akıllı Analiz</h3>
                </div>
                {(() => {
                    const weakSubjects = TYT_SUBJECTS
                        .map(s => ({
                            ...s,
                            gap: (tytGoals[s.key] || 0) - (parseFloat(currentNets[s.key]?.net) || 0)
                        }))
                        .filter(s => s.gap > 2)
                        .sort((a, b) => b.gap - a.gap)
                        .slice(0, 3);

                    return (
                        <div className="space-y-2">
                            {weakSubjects.length > 0 ? (
                                weakSubjects.map(s => (
                                    <div key={s.key} className="flex items-center gap-3 bg-surface/70 rounded-xl p-3">
                                        <span className="text-xl">{s.icon}</span>
                                        <div className="flex-1">
                                            <p className="font-bold text-ink text-sm">{s.label}</p>
                                            <p className="text-xs text-ink-2">
                                                Hedefe ulaşmak için <span className="font-bold text-warn">+{s.gap.toFixed(1)} net</span> artışı gerekiyor
                                            </p>
                                        </div>
                                        <AlertTriangle size={14} className="text-warn flex-shrink-0" />
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center gap-3 bg-surface/70 rounded-xl p-3">
                                    <CheckCircle size={20} className="text-ok" />
                                    <p className="text-sm font-bold text-ink-2">
                                        Hedeflerini belirledin! Koçun bunu takip edecek. 🚀
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>

            {/* CSS for custom slider */}
            <style>{`
                .subject-slider {
                    background: linear-gradient(to right, var(--color) 0%, var(--color) var(--pct, 60%), #e2e8f0 var(--pct, 60%), #e2e8f0 100%);
                }
                .subject-slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: var(--color);
                    border: 2px solid white;
                    box-shadow: 0 1px 6px rgba(0,0,0,0.2);
                    cursor: pointer;
                    transition: transform 0.1s;
                }
                .subject-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
                .subject-slider::-webkit-slider-runnable-track {
                    height: 8px;
                    border-radius: 4px;
                    background: inherit;
                }
            `}</style>
        </div>
    );
};

export default GoalSettingModule;
