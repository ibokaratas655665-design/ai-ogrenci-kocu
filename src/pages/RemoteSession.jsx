import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Link, User, CheckCircle, XCircle, Plus, Trash2, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { onayla } from '../services/uiGeriBildirim';
import Modal from '../components/ui/Modal';
import { yaz } from '../services/veriDeposu';

const RemoteSession = () => {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [sessions, setSessions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newSession, setNewSession] = useState({
        studentName: '',
        date: '',
        time: '',
        topic: '',
        link: ''
    });

    // Mock Data Loading
    useEffect(() => {
        // Load sessions from local storage or use mock data
        const savedSessions = localStorage.getItem('remote_sessions');
        if (savedSessions) {
            setSessions(JSON.parse(savedSessions));
        } else {
            // Initial Mock Data
            setSessions([
                { id: 1, studentName: 'Ahmet Yılmaz', date: new Date().toISOString().split('T')[0], time: '14:00', topic: 'Haftalık Değerlendirme', link: 'https://meet.google.com/abc-defg-hij', status: 'confirmed' },
                { id: 2, studentName: 'Ayşe Demir', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], time: '16:00', topic: 'Matematik Soru Çözümü', link: '', status: 'pending' }
            ]);
        }
    }, []);

    const handleCreateSession = (e) => {
        e.preventDefault();
        const session = {
            id: Date.now(),
            ...newSession,
            status: 'confirmed' // Auto confirm for now as coach creates it
        };
        const updatedSessions = [...sessions, session];
        setSessions(updatedSessions);
        yaz('remote_sessions', updatedSessions);
        setIsModalOpen(false);
        setNewSession({ studentName: '', date: '', time: '', topic: '', link: '' });
    };

    const handleDeleteSession = async (id) => {
        if (await onayla({ mesaj: 'Bu randevuyu silmek istediğinize emin misiniz?', tehlikeli: true })) {
            const updatedSessions = sessions.filter(s => s.id !== id);
            setSessions(updatedSessions);
            yaz('remote_sessions', updatedSessions);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'confirmed': return <span className="bg-ok-soft text-ok px-2 py-1 rounded-full text-xs font-bold flex items-center"><CheckCircle size={12} className="mr-1" /> Onaylandı</span>;
            case 'pending': return <span className="bg-warn-soft text-warn px-2 py-1 rounded-full text-xs font-bold flex items-center"><Clock size={12} className="mr-1" /> Bekliyor</span>;
            case 'cancelled': return <span className="bg-danger-soft text-danger px-2 py-1 rounded-full text-xs font-bold flex items-center"><XCircle size={12} className="mr-1" /> İptal</span>;
            default: return null;
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-ink tracking-tight font-display">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-brand">Uzaktan Koçluk</span> Merkezi
                    </h1>
                    <p className="text-ink-2 mt-1">Görüşmelerinizi planlayın ve yönetin.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus size={20} />
                    <span>Yeni Görüşme Planla</span>
                </button>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Upcoming Sessions List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-bold text-ink mb-4 flex items-center">
                            <Video className="mr-2 text-brand" />
                            Yaklaşan Görüşmeler
                        </h2>

                        <div className="space-y-4">
                            {sessions.length === 0 ? (
                                <p className="text-ink-2 text-center py-8">Henüz planlanmış bir görüşme yok.</p>
                            ) : (
                                sessions.map(session => (
                                    <div key={session.id} className="bg-surface border border-line rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
                                        <div className="flex items-start space-x-4">
                                            <div className="bg-brand-soft p-3 rounded-xl text-brand group-hover:bg-brand group-hover:text-ink transition-colors">
                                                <Calendar size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <h3 className="font-bold text-ink">{session.topic}</h3>
                                                    {getStatusBadge(session.status)}
                                                </div>
                                                <div className="text-sm text-ink-2 mt-1 flex items-center space-x-3">
                                                    <span className="flex items-center"><User size={14} className="mr-1" /> {session.studentName}</span>
                                                    <span className="flex items-center"><Clock size={14} className="mr-1" /> {session.date} - {session.time}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-3 w-full md:w-auto">
                                            {session.link ? (
                                                <a
                                                    href={session.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 md:flex-none px-4 py-2 bg-ok-soft text-ok rounded-lg hover:bg-ok-soft transition font-medium text-sm flex items-center justification-center border border-ok"
                                                >
                                                    <ExternalLink size={16} className="mr-2" />
                                                    Katıl
                                                </a>
                                            ) : (
                                                <span className="text-xs text-ink-3 italic">Link yok</span>
                                            )}
                                            <button
                                                onClick={() => handleDeleteSession(session.id)}
                                                className="p-2 text-ink-3 hover:text-danger hover:bg-danger-soft rounded-lg transition"
                                                title="İptal Et"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Calendar / Quick Actions (Placeholder for now) */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="on-color glass-card p-6 bg-gradient-to-br from-brand to-violet-700 text-white">
                        <h3 className="text-lg font-bold mb-4">Hızlı İpucu</h3>
                        <p className="text-ink-2 text-sm leading-relaxed mb-4">
                            Görüşme linklerini (Zoom/Meet) oluştururken şifre korumalı olduğundan emin olun. Öğrencilerinizle sadece görüşme saatinde link paylaşılır.
                        </p>
                        <div className="bg-surface/10 rounded-xl p-4 backdrop-blur-sm">
                            <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Bir Sonraki Boşluk</div>
                            <div className="text-2xl font-black">Yarın, 14:00</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <Modal
                    acik
                    onClose={() => setIsModalOpen(false)}
                    baslikGizle
                    genislik="md"
                    govdeClassName="p-0 flex flex-col overflow-hidden"
                >
                    <div className="shrink-0 p-6 border-b border-line flex justify-between items-center bg-surface-2">
                        <h3 className="text-lg font-bold text-ink">Yeni Görüşme Planla</h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-ink-3 hover:text-ink-2"><XCircle size={24} /></button>
                    </div>
                    <form onSubmit={handleCreateSession} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-ink-2 mb-1">Öğrenci Adı</label>
                            <input
                                type="text"
                                required
                                className="w-full border border-line-2 rounded-lg p-2 focus:ring-2 focus:ring-brand focus:border-transparent"
                                placeholder="Örn: Ahmet Yılmaz"
                                value={newSession.studentName}
                                onChange={e => setNewSession({ ...newSession, studentName: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-ink-2 mb-1">Tarih</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full border border-line-2 rounded-lg p-2 focus:ring-2 focus:ring-brand"
                                    value={newSession.date}
                                    onChange={e => setNewSession({ ...newSession, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-ink-2 mb-1">Saat</label>
                                <input
                                    type="time"
                                    required
                                    className="w-full border border-line-2 rounded-lg p-2 focus:ring-2 focus:ring-brand"
                                    value={newSession.time}
                                    onChange={e => setNewSession({ ...newSession, time: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-ink-2 mb-1">Konu</label>
                            <input
                                type="text"
                                required
                                className="w-full border border-line-2 rounded-lg p-2 focus:ring-2 focus:ring-brand"
                                placeholder="Örn: Deneme Analizi"
                                value={newSession.topic}
                                onChange={e => setNewSession({ ...newSession, topic: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-ink-2 mb-1">Görüşme Linki (Opsiyonel)</label>
                            <div className="relative">
                                <Link className="absolute left-3 top-2.5 text-ink-3" size={18} />
                                <input
                                    type="url"
                                    className="w-full border border-line-2 rounded-lg pl-10 pr-2 py-2 focus:ring-2 focus:ring-brand"
                                    placeholder="https://..."
                                    value={newSession.link}
                                    onChange={e => setNewSession({ ...newSession, link: e.target.value })}
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn-primary w-full mt-2">
                            Oluştur
                        </button>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default RemoteSession;
