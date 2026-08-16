/**
 * 🤖 AKILLI DERS PROGRAMI ÖNERİSİ (Madde 10)
 * SubjectWeaknessAnalyzer + YKSCountdownWidget verilerini birleştirerek AI destekli haftalık program önerir
 */
import React, { useState, useEffect } from 'react';
import { Zap, Calendar, BookOpen, TrendingUp, CheckCircle, RefreshCw, Save, AlertTriangle, Brain } from 'lucide-react';

const SUBJECT_MAP = {
    tur: { label: 'Türkçe', color: 'from-blue-400 to-blue-500', emoji: '📖', type: 'tyt' },
    mat: { label: 'Matematik', color: 'from-purple-400 to-purple-500', emoji: '📐', type: 'both' },
    fen: { label: 'Fen Bil.', color: 'from-green-400 to-green-500', emoji: '🔬', type: 'tyt' },
    sos: { label: 'Sosyal Bil.', color: 'from-yellow-400 to-yellow-500', emoji: '🌍', type: 'tyt' },
    fiz: { label: 'Fizik', color: 'from-indigo-400 to-indigo-500', emoji: '⚛️', type: 'ayt' },
    kim: { label: 'Kimya', color: 'from-emerald-400 to-emerald-500', emoji: '🧪', type: 'ayt' },
    bio: { label: 'Biyoloji', color: 'from-teal-400 to-teal-500', emoji: '🧬', type: 'ayt' },
    tar: { label: 'Tarih', color: 'from-orange-400 to-orange-500', emoji: '📜', type: 'ayt' },
    cog: { label: 'Coğrafya', color: 'from-cyan-400 to-cyan-500', emoji: '🗺️', type: 'ayt' },
    ing: { label: 'İngilizce', color: 'from-sky-400 to-sky-500', emoji: '🌐', type: 'ayt' },
};

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const SLOTS = ['08:00-10:00', '10:00-12:00', '13:00-15:00', '15:00-17:00', '18:00-20:00', '20:00-22:00'];

const generateSmartSchedule = ({ weakSubjects, daysToExam, focusType }) => {
    const schedule = {};
    DAYS.forEach(d => { schedule[d] = []; });

    // Zayıf dersler daha fazla yer alsın
    const prioritized = [...weakSubjects].sort((a, b) => a.net - b.net);
    const topWeak = prioritized.slice(0, 3).map(s => s.key);
    const midWeak = prioritized.slice(3, 6).map(s => s.key);

    // YKS'ye yakınsa yoğunlaştır
    const weeklyHours = daysToExam < 30 ? 6 : daysToExam < 60 ? 5 : 4;
    const slotsPerDay = Math.min(weeklyHours, SLOTS.length);

    DAYS.forEach((day, dayIdx) => {
        const isWeekend = dayIdx >= 5;
        const daySlots = isWeekend ? Math.min(slotsPerDay + 1, SLOTS.length) : slotsPerDay;

        for (let i = 0; i < daySlots; i++) {
            let subjectKey;

            // İlk 2 slot: zayıf ders
            if (i < 2 && topWeak.length > 0) {
                subjectKey = topWeak[i % topWeak.length];
            }
            // 3. slot: ikinci öncelikli
            else if (i === 2 && midWeak.length > 0) {
                subjectKey = midWeak[0];
            }
            // Diğerleri: döngüsel
            else {
                const allKeys = Object.keys(SUBJECT_MAP).filter(k =>
                    focusType === 'tyt' ? SUBJECT_MAP[k].type !== 'ayt' :
                    focusType === 'ayt' ? SUBJECT_MAP[k].type !== 'tyt' : true
                );
                subjectKey = allKeys[(dayIdx * 2 + i) % allKeys.length];
            }

            if (subjectKey && SUBJECT_MAP[subjectKey]) {
                schedule[day].push({
                    slot: SLOTS[i],
                    subject: subjectKey,
                    label: SUBJECT_MAP[subjectKey].label,
                    emoji: SUBJECT_MAP[subjectKey].emoji,
                    priority: i < 2 ? 'high' : 'normal',
                    reason: topWeak.includes(subjectKey) ? '⚠️ Zayıf ders' : topWeak.includes(subjectKey) ? '' : '',
                });
            }
        }
    });

    return schedule;
};

const SmartScheduleSuggestion = ({ studentId, studentName, examResults = [], yksDate = null }) => {
    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [focusType, setFocusType] = useState('both');
    const [weakSubjects, setWeakSubjects] = useState([]);
    const [showReason, setShowReason] = useState(false);

    const daysToExam = yksDate
        ? Math.max(0, Math.ceil((new Date(yksDate) - new Date()) / (24 * 3600 * 1000)))
        : 120;

    useEffect(() => {
        // Zayıf dersleri hesapla
        if (examResults.length === 0) return;
        const lastExam = examResults[examResults.length - 1];
        const weak = Object.entries(SUBJECT_MAP).map(([key]) => {
            const netKey = key + '_net';
            const net = parseFloat(lastExam[netKey] || lastExam[key] || 0);
            return { key, net, label: SUBJECT_MAP[key].label };
        }).filter(s => s.net < 8).sort((a, b) => a.net - b.net);
        setWeakSubjects(weak);
    }, [examResults]);

    const generate = () => {
        setLoading(true);
        setTimeout(() => {
            const s = generateSmartSchedule({ weakSubjects, daysToExam, focusType });
            setSchedule(s);
            setLoading(false);
            setSaved(false);
        }, 800);
    };

    const saveSchedule = () => {
        if (!schedule) return;
        try {
            const key = `smart_schedule_${studentId}`;
            localStorage.setItem(key, JSON.stringify({ schedule, generatedAt: new Date().toISOString(), focusType, weakSubjects }));
            setSaved(true);
        } catch { }
    };

    return (
        <div className="space-y-5">
            {/* Başlık */}
            <div className="on-color bg-gradient-to-r from-brand to-violet-600 rounded-3xl p-5 text-white">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-surface/20 rounded-2xl flex items-center justify-center">
                        <Brain size={22} className="text-ink" />
                    </div>
                    <div>
                        <h3 className="font-black text-lg">Akıllı Program Önerisi</h3>
                        <p className="text-ink-2 text-xs">Zayıf dersler + YKS geri sayımı bazlı</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface/15 rounded-2xl p-3">
                        <p className="text-ink-2 text-xs">YKS'ye Kalan</p>
                        <p className="text-2xl font-black">{daysToExam} gün</p>
                    </div>
                    <div className="bg-surface/15 rounded-2xl p-3">
                        <p className="text-ink-2 text-xs">Kritik Ders</p>
                        <p className="text-2xl font-black">{weakSubjects.length}</p>
                    </div>
                </div>
            </div>

            {/* Zayıf Dersler */}
            {weakSubjects.length > 0 && (
                <div className="bg-warn-soft border border-warn rounded-2xl p-4">
                    <p className="text-xs font-bold text-warn uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <AlertTriangle size={13} /> Öncelikli Dersler (Son Deneme)
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {weakSubjects.slice(0, 6).map(s => (
                            <span key={s.key} className="bg-surface border border-warn text-warn text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1">
                                {SUBJECT_MAP[s.key]?.emoji} {s.label} <span className="text-warn">({s.net.toFixed(1)})</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Odak Seçimi */}
            <div>
                <p className="text-xs font-bold text-ink-2 uppercase tracking-wider mb-2">Sınav Odağı</p>
                <div className="flex gap-2">
                    {[['both', '🎯 TYT + AYT'], ['tyt', '📗 Sadece TYT'], ['ayt', '📘 Sadece AYT']].map(([val, lbl]) => (
                        <button
                            key={val}
                            onClick={() => setFocusType(val)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${focusType === val ? 'bg-brand text-ink shadow-md' : 'bg-surface border border-line text-ink-2 hover:bg-brand-soft'}`}
                        >
                            {lbl}
                        </button>
                    ))}
                </div>
            </div>

            {/* Oluştur Butonu */}
            <button
                onClick={generate}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-70"
            >
                {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Oluşturuluyor...</>
                    : <><Zap size={18} /> AI Programı Oluştur</>
                }
            </button>

            {/* Program Önizleme */}
            {schedule && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-ink flex items-center gap-2">
                            <Calendar size={16} className="text-brand" /> Önerilen Haftalık Program
                        </h4>
                        <button
                            onClick={saveSchedule}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${saved ? 'bg-ok-soft text-ok' : 'bg-brand-soft text-brand hover:bg-indigo-200'}`}
                        >
                            {saved ? <><CheckCircle size={12} /> Kaydedildi</> : <><Save size={12} /> Kaydet</>}
                        </button>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {DAYS.map(day => {
                            const daySlots = schedule[day] || [];
                            if (daySlots.length === 0) return null;
                            const isWeekend = ['Cumartesi', 'Pazar'].includes(day);
                            return (
                                <div key={day} className={`rounded-2xl border overflow-hidden ${isWeekend ? 'border-[color-mix(in_srgb,var(--c4)_35%,transparent)]' : 'border-line'}`}>
                                    <div className={`px-4 py-2 ${isWeekend ? 'bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))]' : 'bg-surface-2'} flex items-center justify-between`}>
                                        <p className={`font-bold text-sm ${isWeekend ? 'text-c4' : 'text-ink-2'}`}>{day}</p>
                                        <span className="text-xs text-ink-3">{daySlots.length} slot • {daySlots.length * 2} saat</span>
                                    </div>
                                    <div className="divide-y divide-gray-50">
                                        {daySlots.map((slot, i) => {
                                            const subj = SUBJECT_MAP[slot.subject];
                                            return (
                                                <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${slot.priority === 'high' ? 'bg-warn-soft/50' : 'bg-surface'}`}>
                                                    <span className="text-base">{slot.emoji}</span>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-ink text-xs">{slot.label}</p>
                                                        <p className="text-[10px] text-ink-3">{slot.slot}</p>
                                                    </div>
                                                    {slot.priority === 'high' && (
                                                        <span className="text-[10px] bg-warn-soft text-warn font-bold px-1.5 py-0.5 rounded-full">Öncelikli</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={generate}
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-surface-3 text-ink-2 rounded-xl text-sm font-bold hover:bg-surface-3 transition"
                    >
                        <RefreshCw size={14} /> Yeni Öneri Oluştur
                    </button>
                </div>
            )}
        </div>
    );
};

export default SmartScheduleSuggestion;
