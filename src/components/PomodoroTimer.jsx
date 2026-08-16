import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, CheckCircle, Volume2, VolumeX } from 'lucide-react';

const PomodoroTimer = ({ onSessionComplete }) => {
    const [mode, setMode] = useState('focus'); // 'focus', 'shortBreak', 'longBreak'
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const timerRef = useRef(null);

    const MODES = {
        focus: { time: 25 * 60, label: 'Odaklanma', color: 'text-brand', bg: 'bg-brand-soft', border: 'border-brand-line' },
        shortBreak: { time: 5 * 60, label: 'Kısa Mola', color: 'text-ok', bg: 'bg-ok-soft', border: 'border-ok' },
        longBreak: { time: 15 * 60, label: 'Uzun Mola', color: 'text-info', bg: 'bg-info-soft', border: 'border-info' }
    };

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            handleTimerComplete();
        }

        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft]);

    const handleTimerComplete = () => {
        clearInterval(timerRef.current);
        setIsActive(false);

        if (soundEnabled) {
            // Simple beep or notification could go here
            playNotificationSound();
        }

        if (mode === 'focus') {
            if (onSessionComplete) {
                onSessionComplete(25); // Log 25 minutes
            }
            alert("Harika! Bir odaklanma periyodunu tamamladın. Şimdi mola zamanı!");
            setMode('shortBreak');
            setTimeLeft(MODES.shortBreak.time);
        } else {
            alert("Mola bitti! Hadi tekrar odaklanalım.");
            setMode('focus');
            setTimeLeft(MODES.focus.time);
        }
    };

    const playNotificationSound = () => {
        // Basic Audio Context beep or use an HTML5 Audio element if asset available
        // For now, simple visual alert suffices, but let's try a browser beep
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            osc.connect(ctx.destination);
            osc.frequency.value = 800;
            osc.start();
            setTimeout(() => osc.stop(), 500);
        } catch (e) {
            console.error("Audio play failed", e);
        }
    };

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(MODES[mode].time);
    };

    const changeMode = (newMode) => {
        setMode(newMode);
        setIsActive(false);
        setTimeLeft(MODES[newMode].time);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const progress = 100 - (timeLeft / MODES[mode].time) * 100;

    return (
        <div className={`p-8 rounded-3xl border-2 ${MODES[mode].border} ${MODES[mode].bg} shadow-lg transition-all duration-500`}>
            {/* Mode Switcher */}
            <div className="flex justify-center space-x-2 mb-8 bg-surface p-1 rounded-xl shadow-sm inline-block mx-auto w-max">
                <button
                    onClick={() => changeMode('focus')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition ${mode === 'focus' ? 'bg-brand text-ink shadow-md' : 'text-ink-2 hover:bg-surface-3'}`}
                >
                    Odaklan
                </button>
                <button
                    onClick={() => changeMode('shortBreak')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition ${mode === 'shortBreak' ? 'bg-ok text-ink shadow-md' : 'text-ink-2 hover:bg-surface-3'}`}
                >
                    Kısa Mola
                </button>
                <button
                    onClick={() => changeMode('longBreak')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition ${mode === 'longBreak' ? 'bg-info text-ink shadow-md' : 'text-ink-2 hover:bg-surface-3'}`}
                >
                    Uzun Mola
                </button>
            </div>

            {/* Timer Display */}
            <div className="relative w-64 h-64 mx-auto flex items-center justify-center mb-8">
                {/* Circular Progress SVG */}
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="4"
                    />
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeDasharray="283"
                        strokeDashoffset={283 - (283 * progress) / 100}
                        strokeLinecap="round"
                        className={`${MODES[mode].color} transition-all duration-1000`}
                    />
                </svg>

                <div className="text-center z-10">
                    <div className={`text-6xl font-black ${MODES[mode].color} tracking-tighter mb-2 font-mono`}>
                        {formatTime(timeLeft)}
                    </div>
                    <div className="text-ink-2 font-medium uppercase tracking-widest text-xs">
                        {isActive ? 'Süre İşliyor' : 'Duraklatıldı'}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center items-center space-x-6">
                <button
                    onClick={toggleTimer}
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl transition transform hover:scale-105 active:scale-95 ${isActive ? 'bg-warn hover:bg-warn' : 'bg-brand hover:bg-brand-hover'}`}
                >
                    {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                </button>

                <button
                    onClick={resetTimer}
                    className="w-12 h-12 rounded-xl bg-surface border border-line text-ink-2 hover:bg-surface-2 flex items-center justify-center transition hover:rotate-180"
                    title="Sıfırla"
                >
                    <RotateCcw size={20} />
                </button>

                <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`w-12 h-12 rounded-xl border flex items-center justify-center transition ${soundEnabled ? 'bg-surface border-line text-ink-2' : 'bg-surface-3 border-line-2 text-ink-3'}`}
                    title={soundEnabled ? "Sesi Kapat" : "Sesi Aç"}
                >
                    {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
            </div>

            {/* Session Info */}
            <div className="mt-8 text-center">
                <p className="text-sm text-ink-2">
                    <Brain className="inline mr-1 -mt-1" size={14} />
                    Odaklanma modu: <strong>25 dk</strong> çalışma + <strong>5 dk</strong> mola
                </p>
            </div>
        </div>
    );
};

export default PomodoroTimer;
