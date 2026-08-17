import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BrainCircuit, LogOut, Moon, Sun } from 'lucide-react';
import Chatbot from '../components/Chatbot';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { NotificationBell } from '../components/NotificationPanel';

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div className="min-h-screen transition-colors duration-300"
            style={{ backgroundColor: 'var(--bg-primary)' }}>

            {/* ── Modern Topbar ─────────────────────────────────────── */}
            <header
                className={`sticky top-0 z-30 transition-all duration-300 ${scrolled
                    ? 'shadow-md border-b'
                    : 'border-b border-transparent'
                    }`}
                style={{
                    backgroundColor: 'var(--header-bg)',
                    backdropFilter: 'blur(12px)',
                    borderColor: scrolled ? 'var(--border-color)' : 'transparent',
                }}
            >
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

                    {/* Logo */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="on-color w-9 h-9 bg-gradient-to-br from-brand to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <BrainCircuit className="text-ink" size={20} />
                        </div>
                        <div className="hidden sm:block">
                            <span className="text-sm font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-brand to-violet-600 block leading-tight">
                                Başarı Kampı
                            </span>
                            <span className="text-[10px] leading-tight block" style={{ color: 'var(--text-muted)' }}>
                                {user?.name || 'Misafir'}
                            </span>
                        </div>
                    </div>

                    {/* Sağ: User info + araçlar */}
                    <div className="flex items-center gap-2">
                        {user?.name && (
                            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border"
                                style={{ backgroundColor: 'var(--hover-bg)', borderColor: 'var(--border-color)' }}>
                                <div className="on-color w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-ink text-[10px] font-bold flex-shrink-0">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-semibold max-w-[140px] truncate" style={{ color: 'var(--text-secondary)' }}>
                                    {user.name}
                                </span>
                                {user?.role === 'coach' && (
                                    <span className="text-[10px] font-bold text-brand bg-brand-soft px-1.5 py-0.5 rounded-md">
                                        KOÇ
                                    </span>
                                )}
                            </div>
                        )}

                        {/* 🔔 Bildirim Zili */}
                        <NotificationBell />

                        {/* 🌙 Dark Mode Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-xl transition-all duration-300 hover:scale-110"
                            style={{ color: 'var(--text-muted)' }}
                            title={isDark ? 'Aydınlık Moda Geç' : 'Karanlık Moda Geç'}
                        >
                            {isDark
                                ? <Sun size={20} className="text-warn" />
                                : <Moon size={20} />
                            }
                        </button>

                        {/* Çıkış */}
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 border border-transparent hover:border-danger hover:text-danger hover:bg-danger-soft"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <LogOut size={16} />
                            <span className="hidden sm:inline">Çıkış</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Ana İçerik ──────────────────────────────────────────── */}
            <main className="flex-1 relative page-enter">
                <div className="fixed top-0 left-0 right-0 h-80 bg-gradient-to-b from-indigo-50/20 to-transparent -z-10 pointer-events-none dark:from-indigo-900/10" />
                <Outlet />
            </main>

            {/* AI Chatbot */}
            <Chatbot />
        </div>
    );
};

export default DashboardLayout;
