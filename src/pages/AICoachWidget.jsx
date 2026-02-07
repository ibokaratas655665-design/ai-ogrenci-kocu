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
                className="fixed bottom-6 right-24 bg-white hover:bg-gray-50 text-indigo-600 p-4 rounded-full shadow-xl transition transform hover:scale-110 z-50 flex items-center justify-center border border-indigo-100 group"
                title="AI Koç ile Konuş"
            >
                <div className="relative">
                    <Bot size={24} />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                </div>
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap group-hover:ml-2 font-bold">
                    AI Koç
                </span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-24 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden animate-fade-in-up h-96">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center text-white shadow-md">
                <div className="flex items-center space-x-2">
                    <div className="p-1 bg-white/20 rounded-lg">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">AI Koç Asistanı</h3>
                        <div className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            <span className="text-xs text-indigo-100">Çevrimiçi</span>
                        </div>
                    </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition"><ChevronDown size={20} /></button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${msg.sender === 'user'
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'
                            }`}>
                            {msg.text}
                            <div className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>{msg.time}</div>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-2xl border border-gray-100 rounded-bl-none flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="p-3 bg-white border-t border-gray-100 grid grid-cols-2 gap-2">
                <button onClick={() => handleUserResponse('Evet, inceleyelim.')} className="text-xs bg-indigo-50 text-indigo-700 py-2 rounded-lg font-bold hover:bg-indigo-100 transition">Evet, inceleyelim</button>
                <button onClick={() => handleUserResponse('Hayır, başka zaman.')} className="text-xs bg-gray-100 text-gray-600 py-2 rounded-lg font-bold hover:bg-gray-200 transition">Hayır, şu an değil</button>
                <button onClick={() => handleUserResponse('Programımı göster.')} className="col-span-2 text-xs border border-indigo-100 text-indigo-600 py-2 rounded-lg hover:bg-indigo-50 transition">Programımı Göster</button>
            </div>
        </div>
    );
};

export default AICoachWidget;
