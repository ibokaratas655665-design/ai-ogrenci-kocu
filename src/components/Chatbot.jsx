import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Merhaba! Ben İbrahim Hoca. Sana nasıl yardımcı olabilirim?", sender: 'bot' }
    ]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        // Kullanıcı mesajını ekle
        const userMsg = { id: Date.now(), text: inputText, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInputText("");
        setIsTyping(true);

        // Mock AI Cevabı
        setTimeout(() => {
            const botResponse = getMockResponse(userMsg.text);
            setMessages(prev => [...prev, { id: Date.now() + 1, text: botResponse, sender: 'bot' }]);
            setIsTyping(false);
        }, 1000); // 1 saniye düşünme efekti
    };

    const getMockResponse = (text) => {
        const lowerText = text.toLowerCase();

        if (lowerText.includes('program') || lowerText.includes('ders'))
            return "Ders çalışma programına sol menüdeki 'Programım' sekmesinden ulaşabilirsin. Senin için haftalık hedefler belirledim!";

        if (lowerText.includes('net') || lowerText.includes('deneme'))
            return "Deneme sonuçlarını analiz ettiğimde TYT Matematik konularında biraz eksiğimiz olduğunu görüyorum. Fonksiyonlar konusuna ağırlık verelim mi?";

        if (lowerText.includes('motivasyon') || lowerText.includes('sıkıldım') || lowerText.includes('yoruldum'))
            return "Yorulmak başarının bir parçası! Unutma 'Emek olmadan yemek olmaz'. Biraz mola verip sevdiğin bir müziği dinlemeye ne dersin? Sonra bomba gibi döneriz! 🚀";

        if (lowerText.includes('merhaba') || lowerText.includes('selam'))
            return "Selam! Bugün nasılsın? Çalışmalar nasıl gidiyor?";

        if (lowerText.includes('kaygı') || lowerText.includes('korkuyorum'))
            return "Sınav kaygısı hissetmen çok normal. Rehberlik bölümündeki 'Nefes Egzersizleri'ni denemeni öneririm. Birlikte başaracağız, kendine güven! 💪";

        return "Bunu tam anlayamadım ama her zaman yanındayım. Ders programın, deneme analizlerin veya sadece sohbet etmek için buradayım!";
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Penceresi */}
            {isOpen && (
                <div className="bg-white w-80 sm:w-96 h-[500px] rounded-2xl shadow-2xl border border-gray-100 flex flex-col mb-4 animate-fade-in-up overflow-hidden">
                    {/* Header */}
                    <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center space-x-2">
                            <div className="bg-white/20 p-1.5 rounded-lg">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">İbrahim Hoca Asistan</h3>
                                <p className="text-xs text-indigo-200">Çevrimiçi</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'user'
                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-none'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex items-center space-x-2">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Bir şeyler yaz..."
                            className="flex-1 bg-gray-100 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition outline-none"
                        />
                        <button
                            type="submit"
                            disabled={!inputText.trim()}
                            className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}

            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-4 rounded-full shadow-2xl hover:shadow-indigo-400/50 transition-all transform hover:scale-105 group relative flex items-center space-x-3 border-2 border-white/20 backdrop-blur-sm"
                >
                    <MessageSquare size={24} className="animate-pulse" />
                    <span className="font-bold text-lg tracking-wide">İbrahim'e Sor</span>

                    {/* Notification Dot */}
                    <span className="absolute right-0 top-0 -mt-1 -mr-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                    </span>
                </button>
            )}
        </div>
    );
};

export default Chatbot;
