import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, X, Minimize2, Maximize2 } from 'lucide-react';

const FocusTimer = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('work'); // work | break
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            // Ses çalma eklenebilir
            alert(mode === 'work' ? 'Çalışma süresi bitti! Mola vakti.' : 'Mola bitti! Haydi derse.');
            toggleMode();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
    };

    const toggleMode = () => {
        const newMode = mode === 'work' ? 'break' : 'work';
        setMode(newMode);
        setTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60);
        setIsActive(false);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-xl transition transform hover:scale-110 z-50 flex items-center justify-center group"
                title="Odaklanma Modunu Aç"
            >
                <Clock size={24} />
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap group-hover:ml-2">
                    Odaklan
                </span>
            </button>
        );
    }

    if (isMinimized) {
        return (
            <div className="fixed bottom-6 right-6 bg-white border border-gray-200 p-2 rounded-xl shadow-xl z-50 flex items-center space-x-3 w-48">
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="font-mono font-bold text-gray-800 text-lg">{formatTime(timeLeft)}</span>
                <div className="flex-1"></div>
                <button onClick={() => setIsMinimized(false)} className="text-gray-400 hover:text-gray-600"><Maximize2 size={16} /></button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-fade-in-up overflow-hidden">
            {/* Header */}
            <div className={`p-4 flex justify-between items-center ${mode === 'work' ? 'bg-indigo-600' : 'bg-green-500'} text-white transition-colors duration-500`}>
                <div className="flex items-center space-x-2">
                    <Clock size={18} />
                    <span className="font-bold">{mode === 'work' ? 'Odaklanma Modu' : 'Mola Zamanı'}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-white/20 rounded-lg transition"><Minimize2 size={16} /></button>
                    <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition"><X size={16} /></button>
                </div>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col items-center">
                <div className="relative mb-6">
                    <div className={`text-5xl font-mono font-bold tracking-wider ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                        {formatTime(timeLeft)}
                    </div>
                </div>

                <div className="flex items-center space-x-4 w-full justify-center">
                    <button
                        onClick={toggleTimer}
                        className={`p-4 rounded-full text-white shadow-lg transition transform active:scale-95 ${isActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                    </button>
                    <button
                        onClick={resetTimer}
                        className="p-4 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
                    >
                        <RotateCcw size={20} />
                    </button>
                </div>

                <div className="mt-6 w-full pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                    <span>Günlük Hedef: 4/8</span>
                    <span className="font-bold text-gray-600">Toplam: 100dk</span>
                </div>
            </div>
        </div>
    );
};

export default FocusTimer;
