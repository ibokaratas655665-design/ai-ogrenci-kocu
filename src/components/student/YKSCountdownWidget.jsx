import React, { useState, useEffect } from 'react';
import { Target, Calendar, Edit2, Check, X } from 'lucide-react';
import Modal from '../ui/Modal';
import { nesneOku } from '../../services/veriDeposu';

// ─── YKS Tarih ──────────────────────────────────────────────
const getNextYKS = () => {
    const now = new Date();
    const year = now.getFullYear();
    const candidates = [
        new Date(`${year}-06-14`),
        new Date(`${year + 1}-06-13`),
    ];
    const future = candidates.filter(d => d > now);
    return future.length > 0 ? future[0] : candidates[candidates.length - 1];
};

const getDaysLeft = (target) => {
    const diff = target - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// ─── Ders Tanımları ──────────────────────────────────────────
const TYT_SUBJECTS = [
    { key: 'tyt_turkce', label: 'TYT Türkçe', maxNet: 40, color: 'var(--c1)', group: 'TYT' },
    { key: 'tyt_mat', label: 'TYT Matematik', maxNet: 40, color: 'var(--ok)', group: 'TYT' },
    { key: 'tyt_fen', label: 'TYT Fen', maxNet: 20, color: 'var(--warn)', group: 'TYT' },
    { key: 'tyt_sosyal', label: 'TYT Sosyal', maxNet: 20, color: 'var(--c5)', group: 'TYT' },
];

const AYT_SUBJECTS = [
    { key: 'ayt_edebiyat', label: 'Edebiyat', maxNet: 24, color: 'var(--c4)', group: 'AYT' },
    { key: 'ayt_tarih1', label: 'Tarih-1', maxNet: 10, color: 'var(--danger)', group: 'AYT' },
    { key: 'ayt_cografya1', label: 'Coğrafya-1', maxNet: 6, color: 'var(--c2)', group: 'AYT' },
    { key: 'ayt_felsefe', label: 'Felsefe', maxNet: 12, color: 'var(--c4)', group: 'AYT' },
    { key: 'ayt_mat', label: 'AYT Mat', maxNet: 30, color: 'var(--info)', group: 'AYT' },
    { key: 'ayt_geometri', label: 'Geometri', maxNet: 10, color: 'var(--info)', group: 'AYT' },
    { key: 'ayt_fizik', label: 'Fizik', maxNet: 14, color: 'var(--warn)', group: 'AYT' },
    { key: 'ayt_kimya', label: 'Kimya', maxNet: 13, color: 'var(--c2)', group: 'AYT' },
    { key: 'ayt_biyoloji', label: 'Biyoloji', maxNet: 13, color: 'var(--ok)', group: 'AYT' },
    { key: 'ayt_dil', label: 'Yabancı Dil', maxNet: 80, color: '#fb923c', group: 'AYT' },
];

// Branş seçenekleri
const BRANCHES = [
    { id: 'SAY', label: '📐 Sayısal', subjects: ['ayt_mat', 'ayt_geometri', 'ayt_fizik', 'ayt_kimya', 'ayt_biyoloji'] },
    { id: 'EA', label: '📚 Eşit Ağırlık', subjects: ['ayt_edebiyat', 'ayt_tarih1', 'ayt_cografya1', 'ayt_mat', 'ayt_geometri'] },
    { id: 'SOZ', label: '🌍 Sözel', subjects: ['ayt_edebiyat', 'ayt_tarih1', 'ayt_cografya1', 'ayt_felsefe'] },
    { id: 'DIL', label: '🗣️ Dil', subjects: ['ayt_dil'] },
];

// ─── Hedef Net Düzenleyici ────────────────────────────────────
const GoalEditor = ({ userId, goals, onSave, onClose }) => {
    const [local, setLocal] = useState(goals);
    const [activeBranch, setActiveBranch] = useState(local._branch || 'SAY');
    const [activeGroup, setActiveGroup] = useState('TYT');

    const selectedBranch = BRANCHES.find(b => b.id === activeBranch);
    const aytSubjectsForBranch = AYT_SUBJECTS.filter(s => selectedBranch?.subjects.includes(s.key));

    const allSubjects = activeGroup === 'TYT' ? TYT_SUBJECTS : aytSubjectsForBranch;

    return (
        <Modal
            acik
            onClose={onClose}
            baslikGizle
            genislik="md"
            govdeClassName="p-6"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-ink flex items-center gap-2">
                    <Target size={18} className="text-brand" />
                    Hedef Net Belirle
                </h3>
                <button onClick={onClose} className="text-ink-3 hover:text-ink-2"><X size={18} /></button>
            </div>

            {/* Branş seç (AYT için) */}
            <div className="mb-4">
                <p className="text-xs font-black text-ink-2 uppercase tracking-wide mb-2">Branşın</p>
                <div className="grid grid-cols-2 gap-2">
                    {BRANCHES.map(b => (
                        <button
                            key={b.id}
                            onClick={() => { setActiveBranch(b.id); setLocal(prev => ({ ...prev, _branch: b.id })); }}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border-2 transition ${activeBranch === b.id ? 'border-brand bg-brand-soft text-brand' : 'border-line text-ink-2 hover:border-line'}`}
                        >
                            {b.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* TYT / AYT toggle */}
            <div className="flex rounded-xl border border-line overflow-hidden mb-4">
                {['TYT', 'AYT'].map(g => (
                    <button
                        key={g}
                        onClick={() => setActiveGroup(g)}
                        className={`flex-1 py-2 text-xs font-black transition ${activeGroup === g ? 'bg-brand text-ink' : 'text-ink-2 hover:bg-surface-2'}`}
                    >
                        {g} Hedefleri
                    </button>
                ))}
            </div>

            {/* Slider'lar */}
            <div className="space-y-4">
                {allSubjects.map(s => (
                    <div key={s.key}>
                        <div className="flex justify-between text-xs font-bold text-ink-2 mb-1">
                            <span>{s.label}</span>
                            <span className="text-ink-3">Maks: {s.maxNet} net</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min={0}
                                max={s.maxNet}
                                step={0.5}
                                value={local[s.key] || 0}
                                onChange={e => setLocal(prev => ({ ...prev, [s.key]: parseFloat(e.target.value) }))}
                                className="flex-1"
                                style={{ accentColor: s.color }}
                            />
                            <span className="text-sm font-black w-8 text-right" style={{ color: s.color }}>
                                {local[s.key] || 0}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Toplam TYT */}
            <div className="border-t border-line pt-3 mt-4 grid grid-cols-2 gap-2">
                <div>
                    <p className="text-xs text-ink-3 mb-0.5">TYT Hedef Toplam</p>
                    <p className="text-xl font-black text-brand">
                        {TYT_SUBJECTS.reduce((a, s) => a + (local[s.key] || 0), 0).toFixed(0)} / 120
                    </p>
                </div>
                <div>
                    <p className="text-xs text-ink-3 mb-0.5">AYT Hedef Toplam</p>
                    <p className="text-xl font-black text-c4">
                        {AYT_SUBJECTS.reduce((a, s) => a + (local[s.key] || 0), 0).toFixed(0)}
                    </p>
                </div>
            </div>

            <div className="pencere-alt-cubuk bg-surface flex gap-2 mt-5">
                <button onClick={onClose} className="flex-1 py-2.5 border border-line rounded-xl text-sm font-bold text-ink-2 hover:bg-surface-2">İptal</button>
                <button
                    onClick={() => { onSave(local); onClose(); }}
                    className="flex-1 py-2.5 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand-hover flex items-center justify-center gap-1.5 transition"
                >
                    <Check size={14} /> Kaydet
                </button>
            </div>
        </Modal>
    );
};

// ─── Progress Bar Satırı ─────────────────────────────────────
const SubjectBar = ({ subject, current, goal }) => {
    const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
    const diff = (goal - current).toFixed(1);
    const achieved = current >= goal && goal > 0;

    return (
        <div>
            <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-ink-2">{subject.label}</span>
                <span className="font-black" style={{ color: achieved ? 'var(--ok)' : subject.color }}>
                    {current.toFixed(1)} / {goal > 0 ? goal : '—'}
                    {diff > 0 && goal > 0 && !achieved && (
                        <span className="text-ink-3 font-normal ml-1">({diff} eksik)</span>
                    )}
                    {achieved && <span className="ml-1">✅</span>}
                </span>
            </div>
            <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-yavas"
                    style={{ width: `${Math.max(goal > 0 ? 2 : 0, pct)}%`, background: subject.color }}
                />
            </div>
        </div>
    );
};

// ─── Ana Widget ───────────────────────────────────────────────
const YKSCountdownWidget = ({ userId, examData = [], userGrade }) => {
    const [daysLeft, setDaysLeft] = useState(0);
    const [yksDate, setYksDate] = useState(null);
    const [editGoal, setEditGoal] = useState(false);
    const [activeTab, setActiveTab] = useState('TYT');

    const storageKey = `yks_goals_${userId || 'guest'}`;
    const [goals, setGoals] = useState(() => {
        try { return nesneOku(storageKey); }
        catch { return {}; }
    });

    // ── 12. sınıf kontrolü ──────────────────────────────────
    const grade = String(userGrade || '').replace(/[^0-9]/g, '');
    const is12 = grade === '12';

    useEffect(() => {
        const d = getNextYKS();
        setYksDate(d);
        setDaysLeft(getDaysLeft(d));
        const t = setInterval(() => setDaysLeft(getDaysLeft(d)), 60000);
        return () => clearInterval(t);
    }, []);

    /**
     * Sınıf kontrolü TÜM hook çağrılarından SONRA yapılır.
     *
     * Daha önce bu blok `useEffect`in üstündeydi ve erken `return`
     * ediyordu. Öğrencinin sınıf bilgisi sonradan yüklendiğinde
     * (koç kaydı senkronla gelince) `is12` false'tan true'ya dönüyor,
     * o render'da bir hook fazladan çağrılıyor ve React
     * "Rendered more hooks than during the previous render" hatasıyla
     * öğrenci panelini çökertiyordu.
     */
    if (!is12) {
        return (
            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-brand-line rounded-2xl p-5 flex items-center gap-4">
                <div className="text-4xl">🎓</div>
                <div>
                    <h3 className="font-black text-ink">YKS Geri Sayımı</h3>
                    <p className="text-sm text-ink-2 mt-0.5">
                        Bu özellik yalnızca <strong>12. sınıf</strong> öğrencileri içindir.
                        {grade && <span className="ml-1">(Senin sınıfın: {grade}. Sınıf)</span>}
                    </p>
                </div>
            </div>
        );
    }

    // Son deneme netleri (TYT ders bazlı)
    const lastExam = examData.length > 0 ? examData[examData.length - 1] : null;
    const getNet = (exam, key) => {
        if (!exam) return 0;
        if (typeof exam[key] === 'number') return exam[key];
        const s = exam.subjects;
        if (!s) return 0;
        const m = {
            tyt_turkce: s.turkce?.net ?? s.turkce ?? 0,
            tyt_mat: s.mat_toplam?.net ?? s.mat_toplam ?? s.mat?.net ?? s.mat ?? 0,
            tyt_fen: s.fen_toplam?.net ?? s.fen_toplam ?? s.fen?.net ?? s.fen ?? 0,
            tyt_sosyal: s.sosyal_toplam?.net ?? s.sosyal_toplam ?? s.sosyal?.net ?? s.sosyal ?? 0,
            ayt_mat: s.ayt_mat?.net ?? s.ayt_mat ?? 0,
            ayt_edebiyat: s.edebiyat?.net ?? s.edebiyat ?? (exam.edebiyat || 0),
            ayt_fizik: s.fizik?.net ?? s.fizik ?? (exam.fizik || 0),
            ayt_kimya: s.kimya?.net ?? s.kimya ?? (exam.kimya || 0),
            ayt_biyoloji: s.biyoloji?.net ?? s.biyoloji ?? (exam.biyoloji || 0),
        };
        return parseFloat(m[key] || 0);
    };

    const currentNets = {};
    [...TYT_SUBJECTS, ...AYT_SUBJECTS].forEach(s => {
        currentNets[s.key] = getNet(lastExam, s.key);
    });

    const branch = goals._branch || 'SAY';
    const selectedBranch = BRANCHES.find(b => b.id === branch);
    const aytSubjectsForBranch = AYT_SUBJECTS.filter(s => selectedBranch?.subjects.includes(s.key));

    const tytGoalTotal = TYT_SUBJECTS.reduce((a, s) => a + (goals[s.key] || 0), 0);
    const tytCurrentTotal = TYT_SUBJECTS.reduce((a, s) => a + currentNets[s.key], 0);
    const tytPct = tytGoalTotal > 0 ? Math.min(100, (tytCurrentTotal / tytGoalTotal) * 100) : 0;

    const aytGoalTotal = aytSubjectsForBranch.reduce((a, s) => a + (goals[s.key] || 0), 0);
    const aytCurrentTotal = aytSubjectsForBranch.reduce((a, s) => a + currentNets[s.key], 0);

    const urgencyBg = daysLeft <= 30
        ? 'from-red-600 to-rose-700'
        : daysLeft <= 90
            ? 'from-amber-500 to-orange-600'
            : 'from-brand to-violet-700';

    const saveGoals = (newGoals) => {
        localStorage.setItem(storageKey, JSON.stringify(newGoals));
        setGoals(newGoals);
    };

    return (
        <>
            <div className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden">
                {/* Header */}
                <div className={`bg-gradient-to-r ${urgencyBg} p-5 text-ink`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Calendar size={15} className="opacity-80" />
                            <span className="text-sm font-bold opacity-80">YKS Geri Sayım (12. Sınıf)</span>
                        </div>
                        <button
                            onClick={() => setEditGoal(true)}
                            className="text-ink-2 hover:text-ink p-1.5 hover:bg-surface/10 rounded-lg transition"
                            title="Hedefleri düzenle"
                        >
                            <Edit2 size={14} />
                        </button>
                    </div>
                    <div className="flex items-end gap-4">
                        <div>
                            <div className="text-5xl font-black leading-none">{daysLeft}</div>
                            <div className="text-sm font-bold opacity-80 mt-1">gün kaldı</div>
                        </div>
                        <div className="flex-1 pb-1">
                            {yksDate && (
                                <p className="text-xs opacity-70 mb-1">
                                    {yksDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            )}
                            <div className="bg-surface/20 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full bg-surface rounded-full transition-all duration-yavas"
                                    style={{ width: `${Math.max(2, tytPct)}%` }}
                                />
                            </div>
                            <p className="text-xs opacity-70 mt-1">TYT hedefine %{tytPct.toFixed(0)} ulaşıldı</p>
                        </div>
                    </div>
                    {/* Branş etiketi */}
                    <div className="mt-3">
                        <span className="text-xs bg-surface/20 px-3 py-1 rounded-full font-bold">
                            {selectedBranch?.label} Branşı
                        </span>
                    </div>
                </div>

                {/* TYT / AYT Toggle */}
                <div className="flex border-b border-line">
                    {['TYT', 'AYT'].map(g => (
                        <button
                            key={g}
                            onClick={() => setActiveTab(g)}
                            className={`flex-1 py-3 text-xs font-black transition ${activeTab === g ? 'border-b-2 border-indigo-600 text-brand' : 'text-ink-3 hover:text-ink-2'}`}
                        >
                            {g} Hedefleri
                        </button>
                    ))}
                </div>

                {/* İçerik */}
                <div className="p-5 space-y-3">
                    {activeTab === 'TYT' && (
                        <>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-black text-ink-2 uppercase tracking-wide">TYT Ders Hedefleri</span>
                                {lastExam && <span className="text-xs text-ink-3">Son deneme baz alındı</span>}
                            </div>
                            {TYT_SUBJECTS.map(s => (
                                <SubjectBar key={s.key} subject={s} current={currentNets[s.key]} goal={goals[s.key] || 0} />
                            ))}
                            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-50">
                                <div className="text-center bg-brand-soft rounded-xl p-2.5">
                                    <div className="text-lg font-black text-brand">{tytCurrentTotal.toFixed(1)}</div>
                                    <div className="text-xs text-brand font-medium">Mevcut</div>
                                </div>
                                <div className="text-center bg-ok-soft rounded-xl p-2.5">
                                    <div className="text-lg font-black text-ok">{tytGoalTotal.toFixed(0)}</div>
                                    <div className="text-xs text-ok font-medium">Hedef</div>
                                </div>
                                <div className="text-center bg-warn-soft rounded-xl p-2.5">
                                    <div className="text-lg font-black text-warn">
                                        {tytGoalTotal > 0 ? Math.max(0, tytGoalTotal - tytCurrentTotal).toFixed(1) : '—'}
                                    </div>
                                    <div className="text-xs text-warn font-medium">Eksik</div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'AYT' && (
                        <>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-black text-ink-2 uppercase tracking-wide">
                                    AYT — {selectedBranch?.label}
                                </span>
                                <button
                                    onClick={() => setEditGoal(true)}
                                    className="text-xs text-brand hover:underline"
                                >Branş değiştir</button>
                            </div>
                            {aytSubjectsForBranch.length === 0 ? (
                                <p className="text-sm text-ink-3 text-center py-4">
                                    Branş seçip hedef belirlemek için ✏️ simgesine tıkla
                                </p>
                            ) : (
                                aytSubjectsForBranch.map(s => (
                                    <SubjectBar key={s.key} subject={s} current={currentNets[s.key]} goal={goals[s.key] || 0} />
                                ))
                            )}
                            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-50">
                                <div className="text-center bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] rounded-xl p-2.5">
                                    <div className="text-lg font-black text-c4">{aytCurrentTotal.toFixed(1)}</div>
                                    <div className="text-xs text-c4 font-medium">AYT Mevcut</div>
                                </div>
                                <div className="text-center bg-ok-soft rounded-xl p-2.5">
                                    <div className="text-lg font-black text-ok">{aytGoalTotal.toFixed(0)}</div>
                                    <div className="text-xs text-ok font-medium">AYT Hedef</div>
                                </div>
                            </div>
                        </>
                    )}

                    {tytGoalTotal === 0 && aytGoalTotal === 0 && (
                        <button
                            onClick={() => setEditGoal(true)}
                            className="w-full mt-2 py-2 border-2 border-dashed border-brand-line text-brand text-xs font-bold rounded-xl hover:bg-brand-soft hover:border-brand-line transition"
                        >
                            + TYT / AYT Hedef Net Belirle
                        </button>
                    )}
                </div>
            </div>

            {editGoal && (
                <GoalEditor
                    userId={userId}
                    goals={goals}
                    onSave={saveGoals}
                    onClose={() => setEditGoal(false)}
                />
            )}
        </>
    );
};

export default YKSCountdownWidget;
