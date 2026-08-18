import React, { useState } from 'react';
import { Video, Plus, X, Calendar, Clock, User, Link as LinkIcon, CheckCircle } from 'lucide-react';
import { onayla } from '../services/uiGeriBildirim';
import Modal from './ui/Modal';

const RemoteCoachingTab = ({ students, setToast }) => {
    const [sessions, setSessions] = useState(() => {
        const saved = localStorage.getItem('remote_sessions');
        return saved ? JSON.parse(saved) : [];
    });

    const [showModal, setShowModal] = useState(false);
    const [editingSession, setEditingSession] = useState(null);
    const [formData, setFormData] = useState({
        studentId: '',
        title: '',
        date: '',
        time: '',
        duration: '30',
        meetingLink: '',
        notes: '',
        status: 'scheduled'
    });

    React.useEffect(() => {
        localStorage.setItem('remote_sessions', JSON.stringify(sessions));
    }, [sessions]);

    const handleSubmit = () => {
        if (!formData.studentId || !formData.title || !formData.date) {
            setToast('Öğrenci, başlık ve tarih gereklidir!');
            return;
        }

        const newSession = {
            id: editingSession?.id || `session_${Date.now()}`,
            ...formData,
            createdAt: editingSession?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (editingSession) {
            setSessions(sessions.map(s => s.id === editingSession.id ? newSession : s));
            setToast('Oturum güncellendi!');
        } else {
            setSessions([...sessions, newSession]);
            setToast('Oturum planlandı!');
        }

        resetForm();
    };

    const resetForm = () => {
        setShowModal(false);
        setEditingSession(null);
        setFormData({
            studentId: '',
            title: '',
            date: '',
            time: '',
            duration: '30',
            meetingLink: '',
            notes: '',
            status: 'scheduled'
        });
    };

    const handleEdit = (session) => {
        setEditingSession(session);
        setFormData(session);
        setShowModal(true);
    };

    const handleDelete = async (sessionId) => {
        if (await onayla({ mesaj: 'Bu oturumu silmek istediğinize emin misiniz?', tehlikeli: true })) {
            setSessions(sessions.filter(s => s.id !== sessionId));
            setToast('Oturum silindi!');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return 'bg-info-soft text-info';
            case 'completed': return 'bg-ok-soft text-ok';
            case 'cancelled': return 'bg-danger-soft text-danger';
            default: return 'bg-surface-3 text-ink-2';
        }
    };

    const upcomingSessions = sessions.filter(s => s.status === 'scheduled').sort((a, b) =>
        new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time)
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-ink">Uzaktan Koçluk Oturumları</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="on-color px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-ink rounded-lg hover:shadow-lg transition flex items-center gap-2"
                >
                    <Plus size={20} />
                    Oturum Planla
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-4">
                    <div className="text-sm text-ink-2">Planlanan</div>
                    <div className="text-2xl font-bold text-info">{sessions.filter(s => s.status === 'scheduled').length}</div>
                </div>
                <div className="glass-card p-4">
                    <div className="text-sm text-ink-2">Tamamlanan</div>
                    <div className="text-2xl font-bold text-ok">{sessions.filter(s => s.status === 'completed').length}</div>
                </div>
                <div className="glass-card p-4">
                    <div className="text-sm text-ink-2">Bu Hafta</div>
                    <div className="text-2xl font-bold text-c4">{upcomingSessions.slice(0, 7).length}</div>
                </div>
            </div>

            {/* Upcoming Sessions */}
            {upcomingSessions.length > 0 && (
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
                        <Calendar className="text-danger" size={20} />
                        Yaklaşan Oturumlar
                    </h3>
                    <div className="space-y-3">
                        {upcomingSessions.slice(0, 5).map(session => {
                            const student = students.find(s => s.id === session.studentId);
                            return (
                                <div key={session.id} className="flex items-center justify-between p-4 bg-surface-2 rounded-lg hover:bg-surface-3 transition">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="p-3 bg-danger-soft rounded-lg">
                                            <Video className="text-danger" size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-ink">{session.title}</h4>
                                            <div className="flex items-center gap-4 text-sm text-ink-2 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <User size={14} />
                                                    {student?.name}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {new Date(session.date).toLocaleDateString('tr-TR')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={14} />
                                                    {session.time} ({session.duration}dk)
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {session.meetingLink && (
                                            <a
                                                href={session.meetingLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-2 bg-ok text-white rounded-lg hover:bg-ok transition flex items-center gap-2"
                                            >
                                                <Video size={16} />
                                                Katıl
                                            </a>
                                        )}
                                        <button
                                            onClick={() => handleEdit(session)}
                                            className="px-4 py-2 border border-line-2 rounded-lg hover:bg-surface-2 transition"
                                        >
                                            Düzenle
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* All Sessions */}
            <div className="glass-card overflow-hidden">
                <div className="on-color bg-gradient-to-r from-red-500 to-red-600 p-4">
                    <h3 className="text-ink font-bold">Tüm Oturumlar</h3>
                </div>
                <div className="divide-y divide-line">
                    {sessions.map(session => {
                        const student = students.find(s => s.id === session.studentId);
                        return (
                            <div key={session.id} className="p-4 hover:bg-surface-2 transition">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-bold text-ink">{session.title}</h4>
                                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(session.status)}`}>
                                                {session.status === 'scheduled' ? 'Planlandı' :
                                                    session.status === 'completed' ? 'Tamamlandı' : 'İptal'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-ink-2">
                                            <span>{student?.name}</span>
                                            <span>{new Date(session.date).toLocaleDateString('tr-TR')}</span>
                                            <span>{session.time}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(session)}
                                            className="p-2 hover:bg-info-soft rounded-lg transition"
                                        >
                                            <Calendar size={16} className="text-info" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(session.id)}
                                            className="p-2 hover:bg-danger-soft rounded-lg transition"
                                        >
                                            <X size={16} className="text-danger" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {sessions.length === 0 && (
                <div className="glass-card p-12 text-center">
                    <Video size={64} className="mx-auto text-ink-3 mb-4" />
                    <p className="text-ink-2">Henüz oturum planlanmamış</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="mt-4 px-6 py-2 bg-danger text-white rounded-lg hover:bg-danger transition"
                    >
                        İlk Oturumu Planla
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <Modal
                    acik
                    onClose={resetForm}
                    baslikGizle
                    genislik="lg"
                    govdeClassName="p-0"
                >
                    <div className="on-color bg-gradient-to-r from-red-600 to-red-700 p-6 text-ink rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold">
                                {editingSession ? 'Oturumu Düzenle' : 'Yeni Oturum'}
                            </h2>
                            <button onClick={resetForm} className="hover:bg-surface/20 p-2 rounded-lg transition">
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-ink-2 mb-2">Öğrenci</label>
                                <select
                                    value={formData.studentId}
                                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                    className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-red-500"
                                >
                                    <option value="">Seçiniz...</option>
                                    {students.map(student => (
                                        <option key={student.id} value={student.id}>{student.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-ink-2 mb-2">Başlık</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-red-500"
                                    placeholder="Örn: Bire Bir Koçluk"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-ink-2 mb-2">Tarih</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-red-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-ink-2 mb-2">Saat</label>
                                <input
                                    type="time"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-red-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-ink-2 mb-2">Süre (dk)</label>
                                <select
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-red-500"
                                >
                                    <option value="15">15 dk</option>
                                    <option value="30">30 dk</option>
                                    <option value="45">45 dk</option>
                                    <option value="60">60 dk</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-ink-2 mb-2">Toplantı Linki (Zoom, Google Meet, vb.)</label>
                            <input
                                type="url"
                                value={formData.meetingLink}
                                onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                                className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-red-500"
                                placeholder="https://..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-ink-2 mb-2">Notlar</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-red-500"
                                rows="3"
                                placeholder="Ön hazırlık, gündem..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-ink-2 mb-2">Durum</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-red-500"
                            >
                                <option value="scheduled">Planlandı</option>
                                <option value="completed">Tamamlandı</option>
                                <option value="cancelled">İptal Edildi</option>
                            </select>
                        </div>

                        <div className="pencere-alt-cubuk bg-surface flex gap-3 pt-6 border-t">
                            <button
                                onClick={resetForm}
                                className="flex-1 px-6 py-3 border border-line-2 rounded-lg hover:bg-surface-2 font-medium transition"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="on-color flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-ink rounded-lg hover:shadow-lg font-medium transition"
                            >
                                {editingSession ? 'Güncelle' : 'Planla'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default RemoteCoachingTab;
