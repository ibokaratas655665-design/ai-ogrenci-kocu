import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Merhaba! Ben İbrahim Hoca. Sana nasıl yardımcı olabilirim?", sender: 'bot' }
    ]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // ── Draggable state ──────────────────────────────────────────
    const [pos, setPos] = useState({ x: null, y: null }); // null = default bottom-right
    const dragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const btnRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => { scrollToBottom(); }, [messages, isOpen]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;
        const userMsg = { id: Date.now(), text: inputText, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInputText("");
        setIsTyping(true);
        setTimeout(() => {
            setMessages(prev => [...prev, { id: Date.now() + 1, text: getMockResponse(userMsg.text), sender: 'bot' }]);
            setIsTyping(false);
        }, 1000);
    };

    const getMockResponse = (text) => {
        const t = text.toLowerCase();
        if (t.includes('program') || t.includes('ders')) return "Ders çalışma programına 'Programım' sekmesinden ulaşabilirsin!";
        if (t.includes('net') || t.includes('deneme')) return "Deneme sonuçlarını analiz ettiğimde TYT Matematik'te biraz eksik görüyorum. Fonksiyonlara odaklanılım mı?";
        if (t.includes('motivasyon') || t.includes('sıkıldım') || t.includes('yoruldum')) return "Yorulmak başarının bir parçası! 'Emek olmadan yemek olmaz.' Kısa bir mola ver, sonra bomba gibi döneriz! 🚀";
        if (t.includes('merhaba') || t.includes('selam')) return "Selam! Bugün nasılsın? Çalışmalar nasıl gidiyor?";
        if (t.includes('kaygı') || t.includes('korkuyorum')) return "Sınav kaygısı çok normal. Rehberlik bölümündeki testleri denemen iyi gelebilir. Birlikte başaracağız! 💪";
        return "Bunu tam anlayamadım ama her zaman yanındayım. Ders programın, deneme analizlerin veya sohbet için buradayım!";
    };

    // ── Drag handlers ─────────────────────────────────────────────
    const onMouseDown = useCallback((e) => {
        if (isOpen) return; // chat açıkken sürükleme yok
        dragging.current = true;
        const rect = btnRef.current?.getBoundingClientRect();
        dragOffset.current = {
            x: e.clientX - (rect?.left ?? 0),
            y: e.clientY - (rect?.top ?? 0),
        };
        e.preventDefault();
    }, [isOpen]);

    useEffect(() => {
        const onMouseMove = (e) => {
            if (!dragging.current) return;
            setPos({
                x: e.clientX - dragOffset.current.x,
                y: e.clientY - dragOffset.current.y,
            });
        };
        const onMouseUp = () => { dragging.current = false; };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, []);

    // Konumu hesapla
    const btnStyle = pos.x !== null
        ? { position: 'fixed', left: pos.x, top: pos.y, bottom: 'auto', right: 'auto' }
        : { position: 'fixed', bottom: '1.5rem', right: '5rem' }; // yanında FocusTimer var

    return (
        <>
            {/* Chat Penceresi */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-80 sm:w-96 h-[480px] bg-surface rounded-2xl shadow-2xl border border-line flex flex-col overflow-hidden z-50 animate-fade-in-up">
                    {/* Header */}
                    <div className="bg-brand p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <div className="bg-surface/20 p-1.5 rounded-lg"><Bot size={18} /></div>
                            <div>
                                <h3 className="font-bold text-sm">İbrahim Hoca Asistan</h3>
                                <p className="text-xs text-brand">Çevrimiçi</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-surface/20 p-1.5 rounded-full transition">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto bg-surface-2 space-y-3">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'user'
                                    ? 'bg-brand text-white rounded-br-none'
                                    : 'bg-surface text-ink shadow-sm border border-line rounded-bl-none'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-surface p-3 rounded-2xl rounded-bl-none shadow-sm border border-line flex gap-1">
                                    {[0, 75, 150].map(d => (
                                        <div key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSendMessage} className="p-3 bg-surface border-t border-line flex gap-2">
                        <input
                            type="text" value={inputText} onChange={e => setInputText(e.target.value)}
                            placeholder="Bir şeyler yaz..."
                            className="flex-1 bg-surface-3 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-brand focus:bg-surface transition outline-none"
                        />
                        <button type="submit" disabled={!inputText.trim()}
                            className="bg-brand text-white p-2 rounded-xl hover:bg-brand-hover disabled:opacity-40 transition">
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}

            {/* Floating Draggable Button */}
            {!isOpen && (
                <button
                    ref={btnRef}
                    style={btnStyle}
                    onMouseDown={onMouseDown}
                    onClick={() => setIsOpen(true)}
                    className="on-color z-50 bg-gradient-to-r from-brand to-violet-600 text-white px-5 py-3 rounded-full shadow-2xl hover:shadow-indigo-400/50 transition-all hover:scale-105 flex items-center gap-2 border-2 border-line-2 select-none cursor-grab active:cursor-grabbing"
                    title="Sürükleyerek taşıyabilirsin"
                >
                    <MessageSquare size={20} className="animate-pulse" />
                    <span className="font-bold text-sm tracking-wide">İbrahim'e Sor</span>
                    {/* Notification Dot */}
                    <span className="absolute -right-1 -top-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-danger border-2 border-white" />
                    </span>
                </button>
            )}
        </>
    );
};

export default Chatbot;
