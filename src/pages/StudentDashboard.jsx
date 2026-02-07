import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, MessageSquare, LogOut, CheckCircle, Clock } from 'lucide-react';
import { api } from '../services/api';

const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Program State (Read-only view of what Coach created)
    const [schedule, setSchedule] = useState({});
    const [programConfig, setProgramConfig] = useState({
        programDurationMonths: 1,
        dailySlotCount: 6,
        title: 'Çalışma Programı'
    });
    const [activeMonth, setActiveMonth] = useState(1);
    const [activeWeek, setActiveWeek] = useState(1);
    const [loading, setLoading] = useState(true);

    // Messaging State
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        loadProgram();
        loadMessages();

        // Poll for new messages every 10 seconds
        const interval = setInterval(loadMessages, 10000);
        return () => clearInterval(interval);
    }, [user]);

    const loadProgram = () => {
        try {
            // Coach saves to:
            // localStorage.setItem(`program_${studentId}_monthly_grid`, JSON.stringify(schedule));
            // localStorage.setItem(`program_${studentId}_config`, JSON.stringify({ dailySlotCount, programDurationMonths, title }));

            const scheduleKey = `program_${user.id}_monthly_grid`;
            const configKey = `program_${user.id}_config`;

            const savedSchedule = localStorage.getItem(scheduleKey);
            const savedConfig = localStorage.getItem(configKey);

            if (savedSchedule) {
                setSchedule(JSON.parse(savedSchedule));
            }

            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                setProgramConfig({
                    programDurationMonths: config.programDurationMonths || 1,
                    dailySlotCount: config.dailySlotCount || 6,
                    title: config.title || 'Çalışma Programı'
                });
            }
        } catch (error) {
            console.error("Program yüklenirken hata:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async () => {
        if (!user?.id) return;
        try {
            const msgs = await api.messages.getMessages(user.id);
            if (Array.isArray(msgs)) {
                setMessages(msgs);
            }
        } catch (error) {
            console.error("Mesajlar yüklenirken hata:", error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        try {
            if (!newMessage.trim()) return;

            await api.messages.sendMessage(user.id, {
                sender: 'student',
                text: newMessage,
                senderName: user.name
            });
            setNewMessage('');
            loadMessages();
        } catch (error) {
            console.error("Mesaj gönderim hatası:", error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;

    // Safety check for slot count
    const safeSlotCount = Number(programConfig?.dailySlotCount) || 6;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                            {user?.name?.charAt(0) || 'Ö'}
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">{user?.name || 'Öğrenci'}</h1>
                            <p className="text-xs text-gray-500">{user?.schoolNumber} • {user?.grade} • {user?.section}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setIsMessageModalOpen(true)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-indigo-200 hover:bg-indigo-700 transition flex items-center"
                        >
                            <MessageSquare size={18} className="mr-2" />
                            Koçumla Konuş
                        </button>
                        <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 transition">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 min-h-[600px] flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
                        <div>
                            <h2 className="text-2xl font-black text-gray-800">{programConfig?.title || 'Çalışma Programı'}</h2>
                            <p className="text-gray-500 text-sm mt-1">{activeMonth}. Ay / {activeWeek}. Hafta</p>
                        </div>

                        <div className="flex bg-white rounded-lg shadow-sm p-1">
                            {[1, 2, 3, 4].map(w => (
                                <button
                                    key={w}
                                    onClick={() => setActiveWeek(w)}
                                    className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeWeek === w ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {w}. Hafta
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-6">
                        {/* Reusing Grid Structure from DetailPage - Simplified */}
                        <div className="min-w-[800px]">
                            <div className="grid grid-cols-8 gap-0 border-2 border-gray-800">
                                {/* Header */}
                                <div className="bg-gray-800 text-white font-bold p-3 text-center text-sm">SAAT</div>
                                {DAYS.map(day => (
                                    <div key={day} className="bg-gray-100 text-gray-800 font-black p-3 text-center border-l border-b border-gray-300 uppercase text-xs">
                                        {day}
                                    </div>
                                ))}

                                {/* Slots */}
                                {Array.from({ length: safeSlotCount }).map((_, slotIndex) => (
                                    <React.Fragment key={slotIndex}>
                                        <div className="bg-gray-50 font-bold text-gray-500 text-xs p-2 text-center border-b border-r border-gray-200 flex items-center justify-center">
                                            {slotIndex + 1}. Etüt
                                        </div>
                                        {DAYS.map(day => {
                                            // Secure data access
                                            const cellKey = `m${activeMonth}-w${activeWeek}-${day}-${slotIndex}`;
                                            const cellData = schedule && schedule[cellKey] ? schedule[cellKey] : null;

                                            return (
                                                <div key={`${day}-${slotIndex}`} className={`border-b border-r border-gray-200 p-1 min-h-[60px] relative ${cellData ? cellData.color : ''}`}>
                                                    {cellData && (
                                                        <div className="h-full w-full flex flex-col justify-center items-center text-center p-1">
                                                            <span className="text-[10px] font-bold opacity-70 uppercase mb-1">{cellData.subject}</span>
                                                            <span className="text-xs font-black leading-tight">{cellData.topic}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Message Modal */}
            {isMessageModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
                        <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
                            <h3 className="font-bold flex items-center"><MessageSquare size={18} className="mr-2" /> Koçumla Konuş</h3>
                            <button onClick={() => setIsMessageModalOpen(false)}><LogOut size={18} className="rotate-180 hover:text-indigo-200 transition" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                            {messages.length === 0 ? (
                                <p className="text-center text-gray-400 text-sm mt-10">Henüz mesaj yok. Merhaba de! 👋</p>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.sender === 'student' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>
                                            <p>{msg.text}</p>
                                            <span className={`text-[10px] block mt-1 opacity-70 ${msg.sender === 'student' ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex gap-2">
                            <input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Mesajınızı yazın..."
                                className="flex-1 bg-gray-100 border-none rounded-full px-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <button type="submit" className="p-2 bg-indigo-600 text-white rounded-full hover:scale-105 transition shadow-lg disabled:opacity-50" disabled={!newMessage.trim()}>
                                <MessageSquare size={20} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
