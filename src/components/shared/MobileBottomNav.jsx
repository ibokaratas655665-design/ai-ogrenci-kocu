/**
 * 📱 MOBİL BOTTOM NAVİGASYON
 * Küçük ekranlarda tab bar yerine alt navigasyon çubuğu gösterir
 */
import React, { useState, useEffect } from 'react';
import {
    Home, ClipboardList, BarChart2, BookOpen, MessageSquare,
    Award, Calendar, TrendingUp, Star, MoreHorizontal, X
} from 'lucide-react';

// Öğrenci Tabları
const STUDENT_TABS = [
    { id: 'home', icon: Home, label: 'Ana Sayfa' },
    { id: 'tasks', icon: ClipboardList, label: 'Görevler' },
    { id: 'exams', icon: BarChart2, label: 'Denemeler' },
    { id: 'messages', icon: MessageSquare, label: 'Mesajlar' },
    { id: 'more', icon: MoreHorizontal, label: 'Daha Fazla' },
];

// "Daha Fazla" menüsündeki extra tablar
const STUDENT_MORE = [
    { id: 'program', icon: Calendar, label: 'Programım' },
    { id: 'tests', icon: BookOpen, label: 'Testlerim' },
    { id: 'badges', icon: Award, label: 'Rozetlerim' },
    { id: 'analytics', icon: TrendingUp, label: 'Analitik' },
    { id: 'stats', icon: Star, label: 'İstatistikler' },
];

// Koç tabları
const COACH_TABS = [
    { id: 'overview', icon: Home, label: 'Genel' },
    { id: 'students', icon: ClipboardList, label: 'Öğrenciler' },
    { id: 'exams', icon: BarChart2, label: 'Sınavlar' },
    { id: 'messages', icon: MessageSquare, label: 'Mesajlar' },
    { id: 'more', icon: MoreHorizontal, label: 'Daha Fazla' },
];

// ─── Öğrenci Bottom Nav ───────────────────────────────────────────────
export const StudentBottomNav = ({ activeTab, onTabChange, messageBadge = 0 }) => {
    const [showMore, setShowMore] = useState(false);

    const handleTab = (tabId) => {
        if (tabId === 'more') {
            setShowMore(!showMore);
            return;
        }
        setShowMore(false);
        onTabChange(tabId);
    };

    return (
        <>
            {/* More Sheet */}
            {showMore && (
                <>
                    <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setShowMore(false)} />
                    <div className="fixed bottom-20 left-4 right-4 bg-surface rounded-2xl shadow-2xl z-50 p-4 md:hidden">
                        <div className="grid grid-cols-3 gap-3">
                            {STUDENT_MORE.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => { onTabChange(tab.id); setShowMore(false); }}
                                    className={`flex flex-col items-center p-3 rounded-xl transition
                                        ${activeTab === tab.id ? 'bg-brand text-ink' : 'bg-surface-2 text-ink-2 hover:bg-brand-soft hover:text-brand'}`}
                                >
                                    <tab.icon size={22} />
                                    <span className="text-[10px] font-bold mt-1.5 leading-tight text-center">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowMore(false)}
                            className="mt-3 w-full flex items-center justify-center gap-1.5 text-ink-3 text-xs font-semibold py-2 hover:text-ink-2 transition"
                        >
                            <X size={14} /> Kapat
                        </button>
                    </div>
                </>
            )}

            {/* Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-line z-40 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                {/* Safe area for iOS */}
                <div className="flex items-center justify-around px-2 pt-2 pb-safe">
                    {STUDENT_TABS.map(tab => {
                        const isActive = tab.id === 'more' ? showMore : activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTab(tab.id)}
                                className="flex flex-col items-center gap-0.5 flex-1 py-1.5 relative group"
                            >
                                {/* Badge */}
                                {tab.id === 'messages' && messageBadge > 0 && (
                                    <span className="absolute top-1 right-3 min-w-[16px] h-4 bg-danger text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none">
                                        {messageBadge > 9 ? '9+' : messageBadge}
                                    </span>
                                )}

                                {/* Icon container */}
                                <div className={`relative w-10 h-7 flex items-center justify-center rounded-xl transition-all duration-200
                                    ${isActive ? 'bg-brand scale-110 shadow-md shadow-indigo-200' : 'group-hover:bg-surface-3'}`}>
                                    <tab.icon
                                        size={isActive ? 18 : 20}
                                        className={`transition-all duration-200 ${isActive ? 'text-ink' : 'text-ink-2'}`}
                                    />
                                </div>

                                <span className={`text-[10px] font-bold transition-colors duration-200
                                    ${isActive ? 'text-brand' : 'text-ink-3 group-hover:text-ink-2'}`}>
                                    {tab.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
                {/* iOS safe area padding */}
                <div className="pb-safe-offset" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
            </div>

            {/* Bottom padding for content above nav */}
            <div className="h-20 md:hidden" />
        </>
    );
};

// ─── Koç Bottom Nav ───────────────────────────────────────────────────
export const CoachBottomNav = ({ activeTab, onTabChange }) => {
    const [showMore, setShowMore] = useState(false);

    const handleTab = (tabId) => {
        if (tabId === 'more') { setShowMore(!showMore); return; }
        setShowMore(false);
        onTabChange(tabId);
    };

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-line z-40 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                <div className="flex items-center justify-around px-2 pt-2 pb-2">
                    {COACH_TABS.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTab(tab.id)}
                                className="flex flex-col items-center gap-0.5 flex-1 py-1.5"
                            >
                                <div className={`w-10 h-7 flex items-center justify-center rounded-xl transition-all
                                    ${isActive ? 'bg-c4 scale-110 shadow-md shadow-purple-200' : ''}`}>
                                    <tab.icon size={isActive ? 18 : 20} className={isActive ? 'text-ink' : 'text-ink-2'} />
                                </div>
                                <span className={`text-[10px] font-bold ${isActive ? 'text-c4' : 'text-ink-3'}`}>
                                    {tab.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
                <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
            </div>
            <div className="h-20 md:hidden" />
        </>
    );
};

// ─── Hook: ekran boyutuna göre mobile tespiti ─────────────────────────
export const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return isMobile;
};

export default StudentBottomNav;
