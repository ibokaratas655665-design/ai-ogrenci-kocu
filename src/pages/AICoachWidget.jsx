import React, { useState, useEffect } from 'react';
import { Bot, X, MessageSquare, ChevronDown } from 'lucide-react';

const AICoachWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: 'Merhaba! Ben senin yapay zeka eğitim koçunum. Bugün nasıl hissediyorsun?', sender: 'bot', time: '10:00' }
    ]);
    const [isTyping, setIsTyping] = useState(false);



    const addBotMessage = (text) => {
        setIsTyping(true);
        setTimeout(() => {
            setMessages(prev => [...prev, { id: Date.now(), text, sender: 'bot', time: new Date().toLocaleTimeString().slice(0, 5) }]);
            setIsTyping(false);
        }, 1500);
    };

    const handleUserResponse = (text) => {
        setMessages(prev => [...prev, { id: Date.now(), text, sender: 'user', time: new Date().toLocaleTimeString().slice(0, 5) }]);

        // Basit cevap mantığı
        if (text.includes('Evet')) addBotMessage("Harika! Senin için 'Elektrik Akımı' konulu 5 test sorusu hazırladım. Çözmeye başlamak için 'Testi Başlat' diyebilirsin.");
        else if (text.includes('Hayır')) addBotMessage("Tamam, o zaman 'Matematik' çalışmaya ne dersin? Türev konusunda iyisin ama hızlanman lazım.");
        else addBotMessage("Anladım. Çalışma programını güncelleyelim mi?");
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-24 bg-surface hover:bg-surface-2 text-brand p-4 rounded-full shadow-xl transition transform hover:scale-110 z-50 flex items-center justify-center border border-brand-line group"
                title="AI Koç ile Konuş"
            >
                <div className="relative">
                    <Bot size={24} />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-danger"></span>
                    </span>
                </div>
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-yavas ease-in-out whitespace-nowrap group-hover:ml-2 font-bold">
                    AI Koç
                </span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-24 right-6 w-80 bg-surface rounded-2xl shadow-2xl border border-line z-50 flex flex-col overflow-hidden animate-fade-in-up h-96">
            {/* Header */}
            <div className="on-color bg-gradient-to-r from-brand to-purple-600 p-4 flex justify-between items-center text-white shadow-md">
                <div className="flex items-center space-x-2">
                    <div className="p-1 bg-surface/20 rounded-lg">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">AI Koç Asistanı</h3>
                        <div className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            <span className="text-xs text-brand">Çevrimiçi</span>
                        </div>
                    </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-ink-2 hover:text-ink transition"><ChevronDown size={20} /></button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-2">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${msg.sender === 'user'
                            ? 'bg-brand text-white rounded-br-none'
                            : 'bg-surface text-ink-2 border border-line rounded-bl-none'
                            }`}>
                            {msg.text}
                            <div className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-brand' : 'text-ink-3'}`}>{msg.time}</div>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-surface p-3 rounded-2xl border border-line rounded-bl-none flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Actions - yatay kaydırılabilir */}
            <div className="p-3 bg-surface border-t border-line">
                <p className="text-[10px] text-ink-3 font-bold uppercase mb-2 tracking-wide">Hızlı Sorular</p>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {[
                        { label: '📅 Programı Göster', msg: 'Programımı göster.' },
                        { label: '✅ Evet, inceleyelim', msg: 'Evet, inceleyelim.' },
                        { label: '❌ Başka zaman', msg: 'Hayır, şu an değil.' },
                        { label: '📊 Deneme analizi', msg: 'Son deneme analizimi yap.' },
                        { label: '💡 Motivasyon ver', msg: 'Motivasyon Ver' },
                        { label: '📝 Görevlerimi say', msg: 'Bekleyen görevlerim neler?' },
                    ].map((q, i) => (
                        <button
                            key={i}
                            onClick={() => handleUserResponse(q.msg)}
                            className="flex-none text-xs bg-brand-soft text-brand py-1.5 px-3 rounded-full font-semibold hover:bg-brand-soft transition whitespace-nowrap border border-brand-line"
                        >
                            {q.label}
                        </button>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default AICoachWidget;
