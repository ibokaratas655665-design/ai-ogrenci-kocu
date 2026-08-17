import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, X, Minimize2, Maximize2 } from 'lucide-react';

const MODES = [
    { label: '25 dk', minutes: 25, color: 'bg-brand', hex: 'var(--brand)' },
    { label: '50 dk', minutes: 50, color: 'bg-c4', hex: 'var(--c4)' },
];

const FocusTimer = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedMode, setSelectedMode] = useState(0);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [sessions, setSessions] = useState(0);

    // StudentDashboard'dan 25/50 dk seçimi gelirse otomatik aç
    useEffect(() => {
        const handleOpen = (e) => {
            const idx = e.detail?.mode ?? 0;
            setSelectedMode(idx);
            setTimeLeft(MODES[idx].minutes * 60);
            setIsActive(false);
            setIsMinimized(false);
            setIsOpen(true);
        };
        window.addEventListener('openFocusTimer', handleOpen);
        return () => window.removeEventListener('openFocusTimer', handleOpen);
    }, []);



    const totalSeconds = MODES[selectedMode].minutes * 60;
    const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            setSessions(s => s + 1);
            // Bildirim
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('⏰ Süre doldu!', { body: `${MODES[selectedMode].label} tamamlandı!` });
            }
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const handleSelectMode = (idx) => {
        setSelectedMode(idx);
        setTimeLeft(MODES[idx].minutes * 60);
        setIsActive(false);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(MODES[selectedMode].minutes * 60);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const circumference = 2 * Math.PI * 52;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }} className="fixed bottom-[84px] lg:bottom-6 right-4 lg:right-6 bg-brand hover:bg-brand-hover text-white p-4 rounded-full shadow-xl transition transform hover:scale-110 z-50 flex items-center justify-center group"
                title="Odaklanma Modunu Aç"
            >
                <Clock size={24} />
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-yavas ease-in-out whitespace-nowrap group-hover:ml-2 font-bold text-sm">
                    Odaklan
                </span>
            </button>
        );
    }

    if (isMinimized) {
        return (
            <div style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }} className="fixed bottom-[84px] lg:bottom-6 right-4 lg:right-6 bg-surface border border-line p-2 px-4 rounded-2xl shadow-xl z-50 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-ok animate-pulse' : 'bg-gray-400'}`} />
                <span className="font-mono font-bold text-ink">{formatTime(timeLeft)}</span>
                <span className="text-xs text-ink-3">{MODES[selectedMode].label}</span>
                <button onClick={() => setIsMinimized(false)} className="text-ink-3 hover:text-brand ml-1">
                    <Maximize2 size={15} />
                </button>
            </div>
        );
    }

    return (
        <div style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }} className="fixed bottom-[84px] lg:bottom-6 right-4 lg:right-6 w-72 bg-surface rounded-3xl shadow-2xl border border-line z-50 overflow-hidden">
            {/* Header */}
            <div className={`on-color p-4 flex justify-between items-center ${MODES[selectedMode].color}`}>
                <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span className="font-bold text-sm">Odaklanma Modu</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-surface/20 rounded-lg transition">
                        <Minimize2 size={15} />
                    </button>
                    <button onClick={() => { setIsOpen(false); setIsActive(false); }} className="p-1 hover:bg-surface/20 rounded-lg transition">
                        <X size={15} />
                    </button>
                </div>
            </div>

            {/* Mode Selector */}
            <div className="p-4 pb-0">
                <div className="flex gap-2">
                    {MODES.map((m, i) => (
                        <button
                            key={i}
                            onClick={() => handleSelectMode(i)}
                            className={`flex-1 py-2 rounded-xl text-sm font-bold transition border-2 ${selectedMode === i
                                ? `border-transparent text-ink ${m.color}`
                                : 'border-line text-ink-2 hover:border-brand-line'}`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Timer Circle */}
            <div className="flex flex-col items-center py-5">
                <div className="relative">
                    <svg width="120" height="120" className="-rotate-90">
                        <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                        <circle
                            cx="60" cy="60" r="52" fill="none"
                            stroke={MODES[selectedMode].hex}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`font-mono font-black text-2xl ${isActive ? 'text-ink' : 'text-ink-3'}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                </div>

                {/* Session counter */}
                <p className="text-xs text-ink-3 mt-1">Tamamlanan: {sessions} oturum</p>

                {/* Controls */}
                <div className="flex items-center gap-4 mt-4">
                    <button
                        onClick={resetTimer}
                        className="p-3 rounded-full bg-surface-3 text-ink-2 hover:bg-surface-3 transition"
                    >
                        <RotateCcw size={18} />
                    </button>
                    <button
                        onClick={() => setIsActive(!isActive)}
                        className={`p-4 rounded-full text-ink shadow-lg transition transform active:scale-95 ${MODES[selectedMode].color}`}
                    >
                        {isActive ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" className="ml-0.5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FocusTimer;
