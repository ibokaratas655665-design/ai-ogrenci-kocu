import React, { useState, useRef, useEffect } from 'react';
import {
    Bell, X, Check, CheckCheck, Trash2,
    Info, Trophy, ClipboardList, AlertTriangle,
    Zap, Star, MessageSquare, Settings2
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const typeConfig = {
    info: { icon: Info, bg: 'bg-info', light: 'bg-info-soft', text: 'text-info', border: 'border-info' },
    success: { icon: Check, bg: 'bg-ok', light: 'bg-ok-soft', text: 'text-ok', border: 'border-ok' },
    warning: { icon: AlertTriangle, bg: 'bg-warn', light: 'bg-warn-soft', text: 'text-warn', border: 'border-warn' },
    achievement: { icon: Trophy, bg: 'bg-c4', light: 'bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))]', text: 'text-c4', border: 'border-[color-mix(in_srgb,var(--c4)_35%,transparent)]' },
    task: { icon: ClipboardList, bg: 'bg-brand', light: 'bg-brand-soft', text: 'text-brand', border: 'border-brand-line' },
    system: { icon: Settings2, bg: 'bg-gray-500', light: 'bg-surface-2', text: 'text-ink-2', border: 'border-line' },
    message: { icon: MessageSquare, bg: 'bg-info', light: 'bg-info-soft', text: 'text-info', border: 'border-info' },
    xp: { icon: Star, bg: 'bg-warn', light: 'bg-warn-soft', text: 'text-warn', border: 'border-warn' },
};

const timeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Az önce';
    if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
    return `${Math.floor(diff / 86400)} gün önce`;
};

// ── Bildirim Zili Butonu (Header'a eklenecek) ──────────────────────
export const NotificationBell = () => {
    const { unreadCount, isOpen, setIsOpen } = useNotifications();

    return (
        <button
            onClick={() => setIsOpen(prev => !prev)}
            className="relative p-2 rounded-xl text-ink-2 hover:text-brand hover:bg-brand-soft transition-all duration-200"
            title="Bildirimler"
        >
            <Bell size={20} className={isOpen ? 'text-brand' : ''} />
            {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </button>
    );
};

// ── Bildirim Paneli ────────────────────────────────────────────────
const NotificationPanel = () => {
    const {
        notifications, markAsRead, markAllAsRead,
        deleteNotification, clearAll, unreadCount, isOpen, setIsOpen
    } = useNotifications();
    const panelRef = useRef(null);

    // Dışarı tıklayınca kapat
    useEffect(() => {
        const handleClick = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen, setIsOpen]);

    if (!isOpen) return null;

    return (
        <>
            {/* Mobil backdrop */}
            <div className="fixed inset-0 z-toast bg-black/20 md:hidden" onClick={() => setIsOpen(false)} />
            <div
                ref={panelRef}
                className="fixed top-[4.5rem] right-2 left-2 z-notify md:fixed md:top-16 md:right-4 md:left-auto md:w-96 max-w-[calc(100vw-1rem)] bg-surface dark:bg-surface-inv rounded-2xl shadow-2xl border border-line dark:border-line-2 overflow-hidden animate-slide-down"
                style={{ maxHeight: 'calc(100vh - 6rem)' }}
            >
                {/* Header */}
                <div className="on-color px-4 py-3 border-b border-line dark:border-line-2 flex items-center justify-between bg-gradient-to-r from-brand to-violet-600">
                    <div className="flex items-center gap-2">
                        <Bell size={16} className="text-ink" />
                        <span className="font-bold text-ink text-sm">Bildirimler</span>
                        {unreadCount > 0 && (
                            <span className="bg-surface/20 text-ink text-xs font-bold px-2 py-0.5 rounded-full">
                                {unreadCount} yeni
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-1 text-ink-2 hover:text-ink text-xs px-2 py-1 rounded-lg hover:bg-surface/10 transition"
                                title="Tümünü okundu işaretle"
                            >
                                <CheckCheck size={13} />
                                <span className="hidden sm:inline">Tümünü oku</span>
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button
                                onClick={clearAll}
                                className="flex items-center gap-1 text-ink-2 hover:text-ink text-xs px-2 py-1 rounded-lg hover:bg-surface/10 transition"
                                title="Tümünü temizle"
                            >
                                <Trash2 size={13} />
                            </button>
                        )}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-ink-2 hover:text-ink p-1 rounded-lg hover:bg-surface/10 transition"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Liste */}
                <div className="max-h-[420px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="py-12 text-center">
                            <div className="w-14 h-14 bg-surface-3 dark:bg-surface-inv rounded-full flex items-center justify-center mx-auto mb-3">
                                <Bell size={24} className="text-ink-3" />
                            </div>
                            <p className="text-sm font-semibold text-ink-2 dark:text-ink-3">Bildirim yok</p>
                            <p className="text-xs text-ink-3 dark:text-ink-2 mt-1">Yeni bildirimler burada görünecek</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50 dark:divide-gray-800">
                            {notifications.map(notif => {
                                const cfg = typeConfig[notif.type] || typeConfig.info;
                                const Icon = cfg.icon;
                                return (
                                    <div
                                        key={notif.id}
                                        className={`flex gap-3 p-3 transition-all duration-200 hover:bg-surface-2 dark:hover:bg-surface-inv cursor-pointer group ${!notif.read ? 'bg-brand-soft/40 dark:bg-indigo-900/10' : ''}`}
                                        onClick={() => markAsRead(notif.id)}
                                    >
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.light} ${cfg.text}`}>
                                            <Icon size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-1">
                                                <p className={`text-sm font-semibold leading-tight ${!notif.read ? 'text-ink dark:text-ink' : 'text-ink-2 dark:text-ink-3'}`}>
                                                    {notif.title}
                                                </p>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                                                    className="opacity-0 group-hover:opacity-100 transition p-0.5 hover:bg-surface-3 dark:hover:bg-surface-inv rounded"
                                                >
                                                    <X size={12} className="text-ink-3" />
                                                </button>
                                            </div>
                                            {notif.message && (
                                                <p className="text-xs text-ink-2 dark:text-ink-2 mt-0.5 line-clamp-2">{notif.message}</p>
                                            )}
                                            <p className="text-[10px] text-ink-3 mt-1">{timeAgo(notif.createdAt)}</p>
                                        </div>
                                        {!notif.read && (
                                            <div className="w-2 h-2 bg-brand rounded-full mt-1 flex-shrink-0" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default NotificationPanel;
