/**
 * 🔔 GERÇEK ZAMANLI BİLDİRİM SİSTEMİ (Madde 1)
 * Firebase onSnapshot ile koç→öğrenci push bildirimleri
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, CheckCheck, Zap, MessageSquare, ClipboardList, BarChart2, AlertTriangle, Trophy, Calendar } from 'lucide-react';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import yerelBildirim from '../../services/notificationService';

const TYPE_CONFIG = {
    task:     { icon: ClipboardList, bg: 'bg-brand-soft',  border: 'border-brand-line', color: 'text-brand',  dot: 'bg-brand' },
    message:  { icon: MessageSquare, bg: 'bg-info-soft',    border: 'border-info',   color: 'text-info',    dot: 'bg-info' },
    exam:     { icon: BarChart2,     bg: 'bg-ok-soft', border: 'border-ok',color: 'text-ok', dot: 'bg-ok' },
    alert:    { icon: AlertTriangle, bg: 'bg-danger-soft',     border: 'border-danger',    color: 'text-danger',     dot: 'bg-danger' },
    badge:    { icon: Trophy,        bg: 'bg-warn-soft',   border: 'border-warn',  color: 'text-warn',   dot: 'bg-warn' },
    appt:     { icon: Calendar,      bg: 'bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))]',  border: 'border-[color-mix(in_srgb,var(--c4)_35%,transparent)]', color: 'text-c4',  dot: 'bg-c4' },
    info:     { icon: Zap,           bg: 'bg-surface-2',    border: 'border-line',   color: 'text-ink-2',    dot: 'bg-gray-400' },
};

const timeAgo = (ts) => {
    if (!ts) return '';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Az önce';
    if (m < 60) return `${m} dk önce`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} saat önce`;
    return `${Math.floor(h / 24)} gün önce`;
};

// ─── Bildirim Gönder (koç tarafından kullanılır) ──────────────────
export const sendRealtimeNotification = async ({ toUserId, type = 'info', title, body, action = null }) => {
    try {
        await addDoc(collection(db, 'notifications'), {
            toUserId,
            type,
            title,
            body: body || '',
            action,
            read: false,
            createdAt: serverTimestamp(),
        });
    } catch (e) {
        console.warn('Bildirim gönderilemedi:', e.message);
    }
};

// ─── Bildirim Kartı ──────────────────────────────────────────────
const NotifItem = ({ notif, onRead, onAction }) => {
    const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
    const Icon = cfg.icon;
    return (
        <div
            className={`${cfg.bg} border ${cfg.border} rounded-xl p-3 flex gap-3 group cursor-pointer transition hover:shadow-sm ${!notif.read ? 'ring-2 ring-inset ring-white shadow-sm' : 'opacity-80'}`}
            onClick={() => { onRead(notif.id); onAction?.(notif.action); }}
        >
            <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center bg-surface/60 relative`}>
                <Icon size={15} className={cfg.color} />
                {!notif.read && <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${cfg.dot} ring-2 ring-white`} />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-ink leading-snug">{notif.title}</p>
                {notif.body && <p className="text-xs text-ink-2 mt-0.5 line-clamp-2">{notif.body}</p>}
                <p className="text-[10px] text-ink-3 mt-1">{timeAgo(notif.createdAt)}</p>
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); onRead(notif.id); }}
                className="opacity-0 group-hover:opacity-100 transition text-ink-3 hover:text-ink-2 self-start flex-shrink-0"
            >
                <X size={12} />
            </button>
        </div>
    );
};

// ─── Ana Bileşen ─────────────────────────────────────────────────
const RealtimeNotificationBell = ({ userId, onAction }) => {
    const [notifs, setNotifs] = useState([]);
    const [open, setOpen] = useState(false);
    const [toast, setToast] = useState(null);
    const prevCountRef = useRef(0);
    const panelRef = useRef(null);

    /**
     * Bildirimler iki kanaldan gelir:
     *   · yerel  (services/notificationService — her koşulda çalışır)
     *   · bulut  (Firestore — bağlantı varsa, cihazlar arası)
     * Eskiden yalnızca bulut dinleniyordu; Firebase yoksa panel hep boştu.
     */
    useEffect(() => {
        if (!userId) return;

        let bulut = [];
        let unsub;

        const birlestirVeYaz = () => {
            const yerel = yerelBildirim.listFor(userId);
            const hepsi = [...yerel, ...bulut]
                .map((n) => ({
                    ...n,
                    _ts: n.createdAt?.toMillis?.() ?? new Date(n.createdAt || 0).getTime(),
                }))
                .sort((a, b) => b._ts - a._ts);

            setNotifs(hepsi);

            const okunmamis = hepsi.filter((n) => !n.read);
            if (okunmamis.length > prevCountRef.current) {
                setToast(okunmamis[0]);
                setTimeout(() => setToast(null), 5000);
            }
            prevCountRef.current = okunmamis.length;
        };

        birlestirVeYaz();
        const yerelAbone = yerelBildirim.subscribe(birlestirVeYaz);

        try {
            const q = query(collection(db, 'notifications'), where('toUserId', '==', String(userId)));
            unsub = onSnapshot(
                q,
                (snap) => { bulut = snap.docs.map((d) => ({ id: d.id, ...d.data() })); birlestirVeYaz(); },
                () => { /* bulut erişilemezse yerel kanal yeterli */ }
            );
        } catch {
            /* Firebase yapılandırılmamışsa yalnızca yerel kanal çalışır */
        }

        return () => { unsub?.(); yerelAbone(); };
    }, [userId]);

    // Dışarı tıklayınca kapat
    useEffect(() => {
        if (!open) return;
        const h = (e) => { if (!panelRef.current?.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [open]);

    const markRead = useCallback(async (id) => {
        setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        yerelBildirim.markRead(id);   // yerel kayit
        try { await updateDoc(doc(db, 'notifications', id), { read: true }); } catch { /* bulut yoksa yerel yeterli */ }
    }, []);

    const markAllRead = useCallback(async () => {
        const unread = notifs.filter(n => !n.read);
        setNotifs(prev => prev.map(n => ({ ...n, read: true })));
        yerelBildirim.markAllRead(userId);
        for (const n of unread) {
            try { await updateDoc(doc(db, 'notifications', n.id), { read: true }); } catch { /* bulut yoksa */ }
        }
    }, [notifs, userId]);

    const unreadCount = notifs.filter(n => !n.read).length;

    return (
        <>
            {/* Toast Popup */}
            {toast && (
                <div
                    className="fixed top-4 right-4 z-notify bg-surface border border-brand-line rounded-2xl shadow-2xl p-4 max-w-xs animate-slide-in-right cursor-pointer flex gap-3 items-start"
                    onClick={() => { setOpen(true); setToast(null); }}
                >
                    <div className="w-9 h-9 bg-brand-soft rounded-xl flex items-center justify-center flex-shrink-0">
                        <Bell size={18} className="text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-ink text-xs">{toast.title}</p>
                        {toast.body && <p className="text-xs text-ink-2 mt-0.5 line-clamp-2">{toast.body}</p>}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setToast(null); }} className="text-ink-3 hover:text-ink-2">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Zil */}
            <div className="relative" ref={panelRef}>
                <button
                    onClick={() => setOpen(o => !o)}
                    className={`relative p-2 rounded-xl transition ${open ? 'bg-brand-soft text-brand' : 'hover:bg-surface-3 text-ink-2'}`}
                    title="Gerçek Zamanlı Bildirimler"
                >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse leading-none">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                {open && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-surface rounded-2xl shadow-2xl border border-line z-notify overflow-hidden animate-scale-in">
                        <div className="on-color bg-gradient-to-r from-brand to-violet-600 px-4 py-3 flex items-center justify-between">
                            <div>
                                <h3 className="font-black text-ink text-sm">🔔 Anlık Bildirimler</h3>
                                <p className="text-xs text-ink-2">{unreadCount > 0 ? `${unreadCount} okunmamış` : 'Tümü okundu'}</p>
                            </div>
                            {unreadCount > 0 && (
                                <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-ink-2 hover:text-ink bg-surface/10 hover:bg-surface/20 px-2 py-1 rounded-lg transition font-bold">
                                    <CheckCheck size={12} /> Tümünü Oku
                                </button>
                            )}
                        </div>
                        <div className="max-h-80 overflow-y-auto p-2 space-y-1.5">
                            {notifs.length === 0 ? (
                                <div className="py-10 text-center">
                                    <Bell size={28} className="mx-auto text-ink-3 mb-2" />
                                    <p className="text-sm text-ink-3 font-medium">Yeni bildirim yok</p>
                                </div>
                            ) : (
                                notifs.slice(0, 20).map(n => (
                                    <NotifItem
                                        key={n.id}
                                        notif={n}
                                        onRead={markRead}
                                        onAction={(action) => { setOpen(false); onAction?.(action); }}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default RealtimeNotificationBell;
