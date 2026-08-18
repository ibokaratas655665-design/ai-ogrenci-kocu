import React, { useState, useRef, useEffect } from 'react';
import {
    Bot, Send, X, Sparkles, Key, Loader2,
    User, ChevronDown, Lightbulb, BookOpen,
    Target, BarChart2, ClipboardList, Zap,
    AlertCircle, ExternalLink
} from 'lucide-react';
import { pendingFor } from '../services/taskStore';
import { hataAnlat } from '../services/hataMesaji';
import Modal from './ui/Modal';

// ─── Gemini API şablonu (öğrenci odaklı koç) ─────────────────
const COACH_SYSTEM_PROMPT = `Sen "AI Koç" adında bir YKS (Türkiye Yükseköğretim Kurumları Sınavı) uzmanı ve kişisel eğitim koçusun. 
Öğrencilere Türkçe olarak yardım edeceksin.
Görevlerin:
- TYT ve AYT konularını açıklamak
- Çalışma programı önerileri vermek  
- Motivasyon desteği sağlamak
- Net hesaplama ve sınav stratejileri anlatmak
- Zor konularda adım adım çözüm göstermek
- Öğrencinin verilerini analiz ederek kişisel öneriler sunmak

Kısa, sıcak ve teşvik edici cevaplar ver. Emoji kullanabilirsin. Emoji ve satır başı ile okunabilirlik sağla.
Cevapların Türkçe olsun. Uzun cevaplarda başlıklar kullan.`;

// ─── Hızlı Soru Önerileri ────────────────────────────────────
const QUICK_PROMPTS = [
    { icon: Target, label: 'Çalışma planı yap', text: 'Günlük 8 saatlik TYT çalışma planı hazırlar mısın?' },
    { icon: BarChart2, label: 'Net analizi', text: 'TYT\'de 75-80 net için hangi konulara odaklanmalıyım?' },
    { icon: BookOpen, label: 'Konu anlat', text: 'Türkçe Paragraf sorularını nasıl daha hızlı çözebilirim?' },
    { icon: Zap, label: 'Motivasyon', text: 'Sınav stresi yaşıyorum ve odaklanamıyorum, ne yapmalıyım?' },
    { icon: ClipboardList, label: 'Program oluştur', text: 'Matematik için haftalık tekrar programı oluştur' },
    { icon: Lightbulb, label: 'Strateji', text: 'YKS\'de puan optimizasyonu için en iyi sınav stratejisi nedir?' },
];

// ─── Mesaj Balonu ─────────────────────────────────────────────
const MessageBubble = ({ msg }) => {
    const isUser = msg.role === 'user';
    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm ${isUser ? 'bg-brand' : 'bg-gradient-to-br from-violet-500 to-purple-600'}`}>
                {isUser ? <User size={16} className="text-ink" /> : <Bot size={16} className="text-ink" />}
            </div>
            <div className={`max-w-[80%] group`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${isUser
                    ? 'bg-brand text-white rounded-tr-none'
                    : 'bg-surface border border-line shadow-sm text-ink rounded-tl-none'
                    }`}>
                    {msg.content}
                </div>
                <div className={`text-xs text-ink-3 mt-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>
    );
};

// ─── Typing İndikatörü ────────────────────────────────────────
const TypingIndicator = () => (
    <div className="flex gap-3 items-center">
        <div className="on-color w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
            <Bot size={16} className="text-ink" />
        </div>
        <div className="bg-surface border border-line shadow-sm rounded-2xl rounded-tl-none px-4 py-3">
            <div className="flex gap-1.5 items-center">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
        </div>
    </div>
);

// ─── API Key Kurulum Ekranı ───────────────────────────────────
const APIKeySetup = ({ onSave }) => {
    const [key, setKey] = useState('');
    const [error, setError] = useState('');

    const handleSave = () => {
        if (!key.startsWith('AIzaSy') || key.length < 35) {
            setError('Geçersiz API anahtarı. AIzaSy... ile başlamalıdır.');
            return;
        }
        localStorage.setItem('gemini_api_key', key);
        onSave(key);
    };

    return (
        <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-sm w-full text-center">
                <div className="on-color w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Key size={28} className="text-ink" />
                </div>
                <h3 className="font-black text-ink text-lg mb-2">Gemini AI Anahtarı Gerekli</h3>
                <p className="text-sm text-ink-2 mb-6">
                    AI Koç özelliğini kullanmak için ücretsiz Google Gemini API anahtarı gereklidir.
                </p>

                <div className="bg-brand-soft rounded-xl p-4 mb-5 text-left space-y-2">
                    {['Google AI Studio\'ya git →', 'Create API Key tıkla', 'Anahtarı kopyala yapıştır'].map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-brand">
                            <div className="w-5 h-5 rounded-full bg-indigo-200 flex items-center justify-center text-xs font-black text-brand">{i + 1}</div>
                            {s}
                        </div>
                    ))}
                </div>

                <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-sm text-brand hover:underline font-bold mb-4"
                >
                    <ExternalLink size={14} />
                    Google AI Studio'ya Git (Ücretsiz)
                </a>

                <input
                    type="text"
                    value={key}
                    onChange={e => { setKey(e.target.value); setError(''); }}
                    placeholder="AIzaSy... anahtarınızı yapıştırın"
                    className="w-full p-3 border border-line rounded-xl text-sm focus:ring-2 focus:ring-brand outline-none font-mono mb-2"
                />
                {error && <p className="text-xs text-danger mb-2">{error}</p>}
                <button
                    onClick={handleSave}
                    disabled={!key}
                    className="on-color w-full py-3 bg-gradient-to-r from-violet-600 to-brand text-white font-black rounded-xl hover:opacity-90 disabled:opacity-50 transition shadow-md"
                >
                    AI Koç'u Aktifleştir ✨
                </button>
            </div>
        </div>
    );
};

// ─── Ana AI Koç Bileşeni ─────────────────────────────────────
const AICoachChat = ({ studentData = null, isOpen, onClose }) => {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: `Merhaba! 👋 Ben senin AI Koçun.\n\nSana şu konularda yardımcı olabilirim:\n✅ TYT/AYT konu anlatımı\n📊 Net analizi ve strateji\n📅 Çalışma programı\n💪 Motivasyon ve stres yönetimi\n\nNe öğrenmek veya sormak istiyorsun?`,
            timestamp: Date.now(),
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
    const [hasKey, setHasKey] = useState(() => {
        const k = localStorage.getItem('gemini_api_key');
        return !!(k && k.startsWith('AIzaSy') && k.length > 35);
    });

    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        if (isOpen && hasKey) inputRef.current?.focus();
    }, [isOpen, hasKey]);

    const buildContext = () => {
        const base = studentData
            ? `\n\n[Öğrenci: ${studentData.name || 'İsimsiz'}, Sınıf: ${studentData.grade || '?'}, Hedef Üniversite: ${studentData.targetUniversity || 'belirtilmemiş'}]`
            : '';

        // Son 3 deneme sonucu
        let examCtx = '';
        try {
            const results = JSON.parse(localStorage.getItem('v2_results_data') || '[]');
            const my = results.filter(r =>
                studentData?.name && String(r.student || r.studentName || '').toLowerCase().includes(studentData.name.split(' ')[0].toLowerCase())
            ).slice(-3);
            if (my.length > 0) {
                examCtx = `\n[Son ${my.length} Deneme Neti: ${my.map(r => `${r.name || 'Deneme'}: ${parseFloat(r.totalNet || 0).toFixed(1)}`).join(', ')}]`;
                const last = my[my.length - 1];
                const subjects = ['mat', 'fen', 'tur', 'sos', 'fiz', 'kim', 'bio'];
                const weak = subjects.filter(s => last[s + '_net'] !== undefined && parseFloat(last[s + '_net'] || 0) < 5);
                if (weak.length > 0) examCtx += `\n[Zayıf Dersler (son deneme): ${weak.join(', ')}]`;
            }
        } catch { }

        // Tamamlanmamış görevler
        let taskCtx = '';
        try {
            // student_tasks bir NESNE (öğrenciye göre gruplu) — doğrudan
            // .filter çağırmak sessizce boş sonuç veriyordu.
            const pending = pendingFor(studentData?.id, 3);
            if (pending.length > 0) {
                taskCtx = `\n[Bekleyen Görevler (${pending.length}): ${pending.map(t => t.title || t.text || 'Görev').join(', ')}]`;
            }
        } catch { }

        // Pomodoro çalışma istatistiği
        let pomCtx = '';
        try {
            if (studentData?.id) {
                const logs = JSON.parse(localStorage.getItem(`pomodoro_log_${studentData.id}`) || '[]');
                const week = logs.filter(l => (Date.now() - new Date(l.startedAt || 0).getTime()) < 7 * 24 * 3600 * 1000);
                const totalMin = week.reduce((s, l) => s + (l.minutes || 25), 0);
                const uniqueSubjs = [...new Set(week.map(l => l.subject).filter(Boolean))];
                if (totalMin > 0) pomCtx = `\n[Son 7 Gün Çalışma: ${totalMin} dakika, Dersler: ${uniqueSubjs.join(', ') || 'belirtilmemiş'}]`;
            }
        } catch { }

        // Öz-değerlendirme
        let selfCtx = '';
        try {
            if (studentData?.id) {
                const d = new Date();
                const week = Math.ceil(d.getDate() / 7);
                const weekKey = `self_assessment_${d.getFullYear()}_${d.getMonth()}_w${week}_${studentData.id}`;
                const sa = JSON.parse(localStorage.getItem(weekKey) || 'null');
                if (sa?.scores) {
                    const avg = (Object.values(sa.scores).reduce((a, b) => a + b, 0) / 5).toFixed(1);
                    selfCtx = `\n[Bu Haftaki Öz-Değerlendirme Ortalaması: ${avg}/5 — Motivasyon: ${sa.scores.motivation}, Stres: ${sa.scores.stress}]`;
                }
            }
        } catch { }

        return base + examCtx + taskCtx + pomCtx + selfCtx;
    };

    const sendMessage = async (text) => {
        const msg = (text || input).trim();
        if (!msg || loading) return;
        setInput('');

        const newMsg = { role: 'user', content: msg, timestamp: Date.now() };
        setMessages(prev => [...prev, newMsg]);
        setLoading(true);

        // Sohbet geçmişini hazırla (son 6 mesaj)
        const history = [...messages.slice(-5), newMsg];
        const userMessages = history.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
        }));

        try {
            const key = localStorage.getItem('gemini_api_key') || apiKey;
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        system_instruction: { parts: [{ text: COACH_SYSTEM_PROMPT + buildContext() }] },
                        contents: userMessages,
                        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
                    }),
                }
            );

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error?.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!reply) throw new Error('Boş yanıt geldi');

            setMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: Date.now() }]);
        } catch (err) {
            const errMsg = err.message?.includes('API_KEY_INVALID')
                ? '❌ API anahtarı geçersiz. Ayarlardan yenileyin.'
                : err.message?.includes('RESOURCE_EXHAUSTED')
                    ? '⚠️ Günlük istek limiti doldu. Yarın tekrar deneyin.'
                    : hataAnlat(err);
            setMessages(prev => [...prev, { role: 'assistant', content: errMsg, timestamp: Date.now() }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    if (!isOpen) return null;

    return (
        <Modal
            acik
            onClose={onClose}
            baslikGizle
            genislik="lg"
            govdeClassName="p-0 flex flex-col overflow-hidden"
        >

            {/* Header */}
            <div className="on-color bg-gradient-to-r from-violet-600 to-brand px-5 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-surface/20 flex items-center justify-center">
                        <Bot size={20} className="text-ink" />
                    </div>
                    <div>
                        <p className="font-black text-ink text-sm">AI Koç</p>
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-xs text-ink-2">{hasKey ? 'Çevrimiçi · Gemini 2.0 Flash' : 'API key gerekli'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {hasKey && (
                        <button onClick={() => { setHasKey(false); localStorage.removeItem('gemini_api_key'); }}
                            className="text-ink-2 hover:text-ink text-xs font-bold px-2 py-1 rounded-lg hover:bg-surface/10 transition">
                            <Key size={12} />
                        </button>
                    )}
                    <button onClick={onClose} className="text-ink-2 hover:text-ink p-1.5 rounded-xl hover:bg-surface/10 transition">
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* İçerik */}
            {!hasKey ? (
                <APIKeySetup onSave={(k) => { setApiKey(k); setHasKey(true); }} />
            ) : (
                <>
                    {/* Mesajlar */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, i) => (
                            <MessageBubble key={i} msg={msg} />
                        ))}
                        {loading && <TypingIndicator />}
                        <div ref={bottomRef} />
                    </div>

                    {/* Hızlı sorular (ilk mesajdan sonraki boş durumda göster) */}
                    {messages.length <= 1 && !loading && (
                        <div className="px-4 pb-2">
                            <p className="text-xs text-ink-3 font-bold mb-2 flex items-center gap-1">
                                <Sparkles size={11} /> Hızlı Başla
                            </p>
                            <div className="grid grid-cols-2 gap-1.5">
                                {QUICK_PROMPTS.map((qp, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(qp.text)}
                                        className="flex items-center gap-2 text-left text-xs p-2.5 bg-surface border border-line rounded-xl hover:bg-brand-soft hover:border-brand-line hover:text-brand transition group"
                                    >
                                        <qp.icon size={14} className="text-brand group-hover:text-brand flex-shrink-0" />
                                        <span className="font-medium text-ink-2 group-hover:text-brand">{qp.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <div className="border-t border-line bg-surface px-4 py-3 flex-shrink-0">
                        <div className="flex gap-2 items-end">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Sorunuzu yazın... (Enter ile gönder)"
                                rows={1}
                                disabled={loading}
                                className="flex-1 resize-none bg-surface-2 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand outline-none border border-line disabled:opacity-50 max-h-28"
                                style={{ overflowY: 'auto' }}
                            />
                            <button
                                onClick={() => sendMessage()}
                                disabled={!input.trim() || loading}
                                className="p-2.5 bg-brand text-white rounded-xl hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm flex-shrink-0"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            </button>
                        </div>
                        <p className="text-xs text-ink-3 mt-1.5 text-center">Gemini 2.0 Flash · Yanıtlar hatalı olabilir, doğrulayın</p>
                    </div>
                </>
            )}
        </Modal>
    );
};

// ─── Floating Trigger Button ──────────────────────────────────
export const AICoachButton = ({ studentData = null, className = '' }) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className={`on-color flex items-center gap-2 bg-gradient-to-r from-violet-600 to-brand text-white font-bold px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-normal ${className}`}
            >
                <Bot size={16} />
                AI Koç
                <Sparkles size={12} className="opacity-80" />
            </button>
            <AICoachChat studentData={studentData} isOpen={open} onClose={() => setOpen(false)} />
        </>
    );
};

export default AICoachChat;
