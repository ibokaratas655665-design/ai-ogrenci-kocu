import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MessageSquare, Send, User, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';

/**
 * Koç için tek ekrandan tüm öğrenci mesajlaşmaları — önceden her
 * öğrenciye tek tek StudentDetailPage'den girmek gerekiyordu.
 * Sohbet gövdesi ve gönderme mantığı StudentDetailPage'in "Mesajlar"
 * sekmesiyle birebir aynı (api.messages.getMessages/sendMessage).
 */
export default function CoachInbox({ students = [], onOgrenciAc }) {
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const chatEndRef = React.useRef(null);

    const load = useCallback(async () => {
        const sonuc = await Promise.all(students.map(async (s) => {
            try {
                const msgs = await api.messages.getMessages(s.id, s);
                const last = msgs.length ? msgs[msgs.length - 1] : null;
                const unread = msgs.filter((m) => m.sender === 'student' && !m.read).length;
                return { student: s, messages: msgs, last, unread };
            } catch {
                return { student: s, messages: [], last: null, unread: 0 };
            }
        }));
        sonuc.sort((a, b) => {
            const ta = a.last ? new Date(a.last.timestamp).getTime() : 0;
            const tb = b.last ? new Date(b.last.timestamp).getTime() : 0;
            return tb - ta;
        });
        setThreads(sonuc);
        setLoading(false);
    }, [students]);

    useEffect(() => {
        load();
        const iv = setInterval(load, 8000);
        return () => clearInterval(iv);
    }, [load]);

    const selected = useMemo(
        () => threads.find((t) => String(t.student.id) === String(selectedId)) || null,
        [threads, selectedId]
    );

    // Sohbet açılınca öğrenciden gelenleri okundu işaretle
    useEffect(() => {
        if (!selected || selected.unread === 0) return;
        api.messages.markAsReadByCoach(selected.student.id, selected.student).then((changed) => {
            if (changed) {
                setThreads((prev) => prev.map((t) =>
                    t.student.id === selected.student.id
                        ? { ...t, unread: 0, messages: t.messages.map((m) => (m.sender === 'student' ? { ...m, read: true } : m)) }
                        : t
                ));
            }
        });
        /* selected.unread'i de izler: sohbet açıkken (selectedId sabit
           kalırken) yoklama ile yeni okunmamış mesaj gelirse de
           işaretlensin — yalnızca selectedId'ye bağlı kalsaydı ilk
           açılıştan sonra gelen mesajlar okunmamış kalırdı. changed
           sonrası unread 0'a düştüğü için sonsuz döngü olmaz. */
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId, selected?.unread]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selected?.messages?.length]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selected || sending) return;
        setSending(true);
        try {
            await api.messages.sendMessage(selected.student.id, {
                text: newMessage, sender: 'coach', senderName: 'Koç',
            }, selected.student.schoolNumber);
            setNewMessage('');
            await load();
        } finally {
            setSending(false);
        }
    };

    const totalUnread = threads.reduce((t, th) => t + th.unread, 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-ink-3 text-sm">
                Mesajlar yükleniyor…
            </div>
        );
    }

    return (
        <div className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden" style={{ height: '620px' }}>
            <div className="flex h-full">
                {/* ── SOL: ÖĞRENCİ LİSTESİ ───────────────────────── */}
                <div className="w-full sm:w-72 shrink-0 border-r border-line flex flex-col bg-surface-2">
                    <div className="p-3 border-b border-line bg-surface">
                        <p className="font-black text-sm text-ink flex items-center gap-1.5">
                            <MessageSquare size={15} className="text-brand" /> Mesajlar
                            {totalUnread > 0 && (
                                <span className="ml-auto text-[10px] font-bold bg-brand text-white rounded-full px-2 py-0.5">{totalUnread}</span>
                            )}
                        </p>
                    </div>
                    <div className={`flex-1 overflow-y-auto ${selectedId ? 'hidden sm:block' : ''}`}>
                        {threads.length === 0 ? (
                            <p className="text-xs text-ink-3 text-center mt-8 px-3">Henüz öğrenciniz yok.</p>
                        ) : threads.map((t) => (
                            <button
                                key={t.student.id}
                                onClick={() => setSelectedId(t.student.id)}
                                className={`w-full text-left p-3 border-b border-line flex items-start gap-2.5 transition ${String(selectedId) === String(t.student.id) ? 'bg-brand-soft' : 'hover:bg-surface'}`}
                            >
                                <div className="w-9 h-9 rounded-full bg-brand-soft text-brand font-bold flex items-center justify-center text-xs shrink-0">
                                    {(t.student.name || '?').slice(0, 1).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-ink truncate flex items-center gap-1.5">
                                        {t.student.name || 'İsimsiz Öğrenci'}
                                        {t.unread > 0 && <span className="w-2 h-2 rounded-full bg-brand shrink-0" />}
                                    </p>
                                    <p className="text-[11px] text-ink-3 truncate mt-0.5">
                                        {t.last ? `${t.last.sender === 'coach' ? 'Siz: ' : ''}${t.last.text}` : 'Henüz mesaj yok'}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── SAĞ: SOHBET ───────────────────────────────── */}
                <div className={`flex-1 flex-col ${selectedId ? 'flex' : 'hidden sm:flex'}`}>
                    {!selected ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-ink-3">
                            <MessageSquare size={40} className="mb-3 text-ink-3" />
                            <p className="text-sm">Sohbet açmak için soldan bir öğrenci seçin.</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-brand p-3 text-white flex items-center gap-3">
                                <button onClick={() => setSelectedId(null)} className="sm:hidden text-white/80 text-xs">← Geri</button>
                                <div className="w-9 h-9 bg-surface/20 rounded-full flex items-center justify-center">
                                    <User size={18} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-sm truncate">{selected.student.name}</p>
                                    <p className="text-brand text-xs">Öğrenci Mesajlaşma Kanalı</p>
                                </div>
                                {onOgrenciAc && (
                                    <button
                                        onClick={() => onOgrenciAc(selected.student.id)}
                                        title="Öğrenci profilini aç"
                                        className="p-1.5 hover:bg-white/10 rounded-lg"
                                    >
                                        <ExternalLink size={16} />
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-2">
                                {selected.messages.length === 0 ? (
                                    <div className="text-center mt-16">
                                        <MessageSquare size={40} className="text-ink-3 mx-auto mb-3" />
                                        <p className="text-ink-3 text-sm">Henüz mesaj yok.</p>
                                    </div>
                                ) : selected.messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.sender === 'coach' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[78%] p-3 rounded-2xl text-sm ${msg.sender === 'coach'
                                            ? 'bg-brand text-white rounded-br-none'
                                            : 'bg-surface border border-line text-ink rounded-bl-none shadow-sm'
                                            }`}>
                                            {msg.sender !== 'coach' && (
                                                <p className="text-xs font-bold text-brand mb-0.5">{msg.senderName || selected.student.name}</p>
                                            )}
                                            <p>{msg.text}</p>
                                            <span className="text-[10px] opacity-60 block mt-1">
                                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                            <form onSubmit={handleSend} className="p-3 bg-surface border-t border-line flex gap-2">
                                <input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Mesaj yaz..."
                                    className="flex-1 bg-surface-3 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                                <button type="submit" disabled={!newMessage.trim() || sending} className="p-2.5 bg-brand text-white rounded-full hover:bg-brand-hover disabled:opacity-40 transition">
                                    <Send size={18} />
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
