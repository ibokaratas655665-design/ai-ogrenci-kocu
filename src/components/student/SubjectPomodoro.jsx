/**
 * ⏱️ DERS BAZLI POMODORO (Madde 5)
 * Hangi dersi çalıştığını kaydederek seansları loglar — koç ders bazında çalışma saatlerini görebilir
 */
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, Volume2, VolumeX, BookOpen, BarChart2, ChevronDown, X } from 'lucide-react';
import { bildir } from '../../services/uiGeriBildirim';

const SUBJECTS = [
    'Türkçe', 'Matematik', 'Fen Bilimleri', 'Tarih', 'Coğrafya', 'Felsefe', 'Din Kültürü',
    'Fizik', 'Kimya', 'Biyoloji', 'Dil ve Anlatım', 'Edebiyat', 'İngilizce', 'Matematik (AYT)', 'Diğer'
];

const MODES = {
    focus:      { time: 25 * 60, label: 'Odaklanma',   color: 'indigo', bgClass: 'from-brand to-brand-hover' },
    shortBreak: { time: 5 * 60,  label: 'Kısa Mola',   color: 'emerald', bgClass: 'from-ok to-accent' },
    longBreak:  { time: 15 * 60, label: 'Uzun Mola',   color: 'blue', bgClass: 'from-info to-brand' },
};

const LOG_KEY = (userId) => `pomodoro_log_${userId}`;

const savePomodoroLog = (userId, session) => {
    try {
        const logs = JSON.parse(localStorage.getItem(LOG_KEY(userId)) || '[]');
        logs.push(session);
        localStorage.setItem(LOG_KEY(userId), JSON.stringify(logs));
    } catch { }
};

const SubjectSelector = ({ selected, onSelect }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-surface border-2 border-brand-line rounded-2xl text-sm font-bold text-brand hover:border-indigo-400 transition"
            >
                <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-brand" />
                    {selected || 'Ders Seç...'}
                </div>
                <ChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-line rounded-2xl shadow-xl z-20 max-h-48 overflow-y-auto">
                    {SUBJECTS.map(s => (
                        <button
                            key={s}
                            onClick={() => { onSelect(s); setOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-brand-soft hover:text-brand transition first:rounded-t-2xl last:rounded-b-2xl ${selected === s ? 'bg-brand-soft text-brand font-bold' : 'text-ink-2'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── İstatistik Mini Paneli ───────────────────────────────────────
const PomodoroStats = ({ userId, onClose }) => {
    const logs = (() => {
        try { return JSON.parse(localStorage.getItem(LOG_KEY(userId)) || '[]'); } catch { return []; }
    })();

    const today = new Date().toDateString();
    const todayLogs = logs.filter(l => new Date(l.startedAt).toDateString() === today && l.subject);
    const last7 = logs.filter(l => {
        const d = new Date(l.startedAt);
        return (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000 && l.subject;
    });

    const bySubject = {};
    last7.forEach(l => {
        bySubject[l.subject] = (bySubject[l.subject] || 0) + (l.minutes || 25);
    });
    const sorted = Object.entries(bySubject).sort((a, b) => b[1] - a[1]);
    const maxMin = sorted[0]?.[1] || 1;

    return (
        <div className="fixed inset-0 z-modal-base bg-black/40 flex items-center justify-center p-4">
            <div className="bg-surface rounded-3xl shadow-2xl max-w-sm w-full p-6">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-black text-ink text-lg flex items-center gap-2">
                        <BarChart2 size={20} className="text-brand" /> Çalışma Analizi
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-surface-3 rounded-xl transition"><X size={16} /></button>
                </div>

                {/* Bugün */}
                <div className="bg-brand-soft rounded-2xl p-4 mb-4">
                    <p className="text-xs font-bold text-brand uppercase tracking-wider mb-2">Bugün</p>
                    <p className="text-3xl font-black text-brand">{todayLogs.reduce((s, l) => s + (l.minutes || 25), 0)} dk</p>
                    <p className="text-xs text-brand">{todayLogs.length} pomodoro seansı</p>
                </div>

                {/* Ders bazlı (7 gün) */}
                <p className="text-xs font-bold text-ink-2 uppercase tracking-wider mb-3">Son 7 Gün — Ders Bazlı</p>
                {sorted.length === 0 ? (
                    <p className="text-sm text-ink-3 text-center py-4">Henüz kayıtlı seans yok</p>
                ) : (
                    <div className="space-y-2">
                        {sorted.map(([subject, minutes]) => (
                            <div key={subject}>
                                <div className="flex items-center justify-between text-xs mb-0.5">
                                    <span className="font-bold text-ink-2">{subject}</span>
                                    <span className="text-ink-2 font-mono">{minutes} dk</span>
                                </div>
                                <div className="w-full bg-surface-3 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="on-color h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                                        style={{ width: `${(minutes / maxMin) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <button onClick={onClose} className="mt-5 w-full py-3 bg-surface-3 text-ink-2 rounded-xl font-bold text-sm hover:bg-surface-3 transition">Kapat</button>
            </div>
        </div>
    );
};

// ─── Ana Bileşen ──────────────────────────────────────────────────
const SubjectPomodoro = ({ userId, onSessionComplete }) => {
    const [mode, setMode] = useState('focus');
    const [timeLeft, setTimeLeft] = useState(MODES.focus.time);
    const [isActive, setIsActive] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [sessionCount, setSessionCount] = useState(0);
    const [showStats, setShowStats] = useState(false);
    const [sessionStart, setSessionStart] = useState(null);
    const timerRef = useRef(null);

    const logs = (() => {
        try { return JSON.parse(localStorage.getItem(LOG_KEY(userId)) || '[]'); } catch { return []; }
    })();
    const todayCount = logs.filter(l => new Date(l.startedAt).toDateString() === new Date().toDateString()).length;

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(p => p - 1), 1000);
        } else if (timeLeft === 0) {
            handleComplete();
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft]);

    const playBeep = () => {
        if (!soundEnabled) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            [0, 0.3, 0.6].forEach(delay => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 880;
                gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
                osc.start(ctx.currentTime + delay);
                osc.stop(ctx.currentTime + delay + 0.3);
            });
        } catch { }
    };

    const handleComplete = () => {
        clearInterval(timerRef.current);
        setIsActive(false);
        playBeep();

        if (mode === 'focus') {
            const session = {
                subject: selectedSubject || 'Belirtilmemiş',
                minutes: 25,
                mode,
                startedAt: sessionStart || new Date().toISOString(),
                completedAt: new Date().toISOString(),
            };
            savePomodoroLog(userId, session);
            setSessionCount(c => c + 1);
            onSessionComplete?.(25, selectedSubject);

            const isLongBreakTime = (sessionCount + 1) % 4 === 0;
            setMode(isLongBreakTime ? 'longBreak' : 'shortBreak');
            setTimeLeft(MODES[isLongBreakTime ? 'longBreak' : 'shortBreak'].time);
        } else {
            setMode('focus');
            setTimeLeft(MODES.focus.time);
        }
    };

    const toggleTimer = () => {
        if (!isActive && mode === 'focus' && !selectedSubject) {
            bildir('Lütfen önce çalışacağınız dersi seçin!', 'uyari');
            return;
        }
        if (!isActive) setSessionStart(new Date().toISOString());
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(MODES[mode].time);
    };

    const changeMode = (m) => {
        setMode(m);
        setIsActive(false);
        setTimeLeft(MODES[m].time);
    };

    const progress = 100 - (timeLeft / MODES[mode].time) * 100;
    const m = MODES[mode];
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const COLOR_MAP = { indigo: 'var(--brand)', emerald: 'var(--ok)', blue: 'var(--info)' };
    const strokeColor = COLOR_MAP[m.color];

    return (
        <div className={`rounded-3xl border-2 ${isActive ? 'border-brand-line shadow-lg shadow-indigo-100' : 'border-line'} bg-surface overflow-hidden transition-all duration-yavas`}>
            {/* Header */}
            <div className={`on-color bg-gradient-to-r ${m.bgClass} p-4 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                    <Brain size={20} className="text-ink" />
                    <span className="font-black text-ink text-sm">{m.label} Modu</span>
                    {isActive && <span className="text-ink-2 text-xs animate-pulse">● Aktif</span>}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-ink-2 text-xs">Bugün: {todayCount} seans</span>
                    <button onClick={() => setShowStats(true)} className="text-ink-2 hover:text-ink p-1.5 rounded-lg hover:bg-surface/10 transition">
                        <BarChart2 size={16} />
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-5">
                {/* Mode Switcher */}
                <div className="flex gap-1 bg-surface-3 p-1 rounded-xl">
                    {Object.entries(MODES).map(([key, val]) => (
                        <button
                            key={key}
                            onClick={() => changeMode(key)}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${mode === key ? `bg-surface text-${val.color}-700 shadow` : 'text-ink-2 hover:text-ink-2'}`}
                        >
                            {val.label}
                        </button>
                    ))}
                </div>

                {/* Ders Seçici */}
                {mode === 'focus' && (
                    <SubjectSelector selected={selectedSubject} onSelect={setSelectedSubject} />
                )}

                {/* Dairesel Timer */}
                <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="44" fill="none" stroke="#f3f4f6" strokeWidth="5" />
                        <circle
                            cx="50" cy="50" r="44"
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="5"
                            strokeDasharray={`${2 * Math.PI * 44}`}
                            strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
                            strokeLinecap="round"
                            className="transition-all duration-yavas"
                        />
                    </svg>
                    <div className="text-center z-10">
                        <p className="text-5xl font-black tracking-tighter font-mono" style={{ color: strokeColor }}>
                            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                        </p>
                        <p className="text-ink-3 text-xs uppercase tracking-widest mt-1">
                            {isActive ? '⏳ Devam ediyor' : '⏸ Beklemede'}
                        </p>
                        {mode === 'focus' && selectedSubject && (
                            <p className="text-xs font-bold mt-1 truncate max-w-[120px] mx-auto" style={{ color: strokeColor }}>
                                📚 {selectedSubject}
                            </p>
                        )}
                    </div>
                </div>

                {/* Kontroller */}
                <div className="flex justify-center items-center gap-4">
                    <button
                        onClick={resetTimer}
                        className="w-12 h-12 rounded-xl bg-surface-3 text-ink-2 hover:bg-surface-3 flex items-center justify-center transition hover:rotate-180 duration-yavas"
                    >
                        <RotateCcw size={18} />
                    </button>
                    <button
                        onClick={toggleTimer}
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-ink shadow-xl transition transform hover:scale-105 active:scale-95"
                        style={{ background: `linear-gradient(135deg, ${strokeColor}dd, ${strokeColor})` }}
                    >
                        {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                    </button>
                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`w-12 h-12 rounded-xl border flex items-center justify-center transition ${soundEnabled ? 'bg-surface border-line text-ink-2' : 'bg-surface-3 border-line-2 text-ink-3'}`}
                    >
                        {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </button>
                </div>

                {/* Seans önerisi */}
                <p className="text-center text-xs text-ink-3">
                    🎯 <strong>25 dk</strong> odaklan → <strong>5 dk</strong> mola → Her 4 seansda <strong>15 dk</strong> uzun mola
                </p>
            </div>

            {showStats && <PomodoroStats userId={userId} onClose={() => setShowStats(false)} />}
        </div>
    );
};

// ─── Koç: Öğrencinin Pomodoro Loglarını Görüntüleme ──────────────
export const CoachPomodoroView = ({ students }) => {
    const [selected, setSelected] = useState(null);

    const getLogs = (s) => {
        try { return JSON.parse(localStorage.getItem(LOG_KEY(s.id)) || '[]'); } catch { return []; }
    };

    const studentStats = students.map(s => {
        const logs = getLogs(s);
        const last7 = logs.filter(l => (Date.now() - new Date(l.startedAt).getTime()) < 7 * 24 * 3600 * 1000);
        const bySubject = {};
        last7.forEach(l => { if (l.subject) bySubject[l.subject] = (bySubject[l.subject] || 0) + (l.minutes || 25); });
        return { student: s, totalMin: last7.reduce((a, l) => a + (l.minutes || 25), 0), sessions: last7.length, bySubject };
    }).sort((a, b) => b.totalMin - a.totalMin);

    return (
        <div className="space-y-3">
            <h4 className="font-bold text-ink flex items-center gap-2 text-sm">
                <Brain size={16} className="text-brand" /> Ders Bazlı Çalışma (Son 7 Gün)
            </h4>
            {studentStats.map(({ student, totalMin, sessions, bySubject }, i) => {
                const sorted = Object.entries(bySubject).sort((a, b) => b[1] - a[1]);
                const isOpen = selected === i;
                return (
                    <div key={i} className="bg-surface border border-line rounded-2xl shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-surface-2" onClick={() => setSelected(isOpen ? null : i)}>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-brand-soft flex items-center justify-center font-black text-brand text-xs">
                                    {student.name?.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-ink text-xs">{student.name}</p>
                                    <p className="text-[10px] text-ink-3">{sessions} seans</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`font-black text-sm ${totalMin > 120 ? 'text-ok' : totalMin > 60 ? 'text-warn' : 'text-danger'}`}>{totalMin} dk</span>
                                {isOpen ? <ChevronDown size={14} className="text-ink-3 rotate-180" /> : <ChevronDown size={14} className="text-ink-3" />}
                            </div>
                        </div>
                        {isOpen && sorted.length > 0 && (
                            <div className="border-t border-gray-50 px-3 pb-3 pt-2 space-y-1.5 bg-surface-2/50">
                                {sorted.map(([subj, mins]) => (
                                    <div key={subj} className="flex items-center gap-2 text-xs">
                                        <span className="text-ink-2 font-medium w-28 truncate">{subj}</span>
                                        <div className="flex-1 bg-surface-3 rounded-full h-1.5 overflow-hidden">
                                            <div className="h-full bg-brand rounded-full" style={{ width: `${(mins / totalMin) * 100}%` }} />
                                        </div>
                                        <span className="text-ink-2 font-mono w-10 text-right">{mins}dk</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default SubjectPomodoro;
