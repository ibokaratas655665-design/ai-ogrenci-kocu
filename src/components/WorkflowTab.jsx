import React, { useState } from 'react';
import { Briefcase, Plus, X, Calendar, Clock, User, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { onayla } from '../services/uiGeriBildirim';
import Modal from './ui/Modal';

const WorkflowTab = ({ students, setToast }) => {
    const [cases, setCases] = useState(() => {
        const saved = localStorage.getItem('pdr_cases');
        return saved ? JSON.parse(saved) : [];
    });

    const [showModal, setShowModal] = useState(false);
    const [editingCase, setEditingCase] = useState(null);
    const [formData, setFormData] = useState({
        studentId: '',
        type: 'counseling',
        priority: 'normal',
        title: '',
        description: '',
        appointmentDate: '',
        status: 'scheduled',
        notes: ''
    });

    React.useEffect(() => {
        localStorage.setItem('pdr_cases', JSON.stringify(cases));
    }, [cases]);

    const handleSubmit = () => {
        if (!formData.studentId || !formData.title) {
            setToast('Öğrenci ve başlık gereklidir!');
            return;
        }

        const newCase = {
            id: editingCase?.id || `case_${Date.now()}`,
            ...formData,
            createdAt: editingCase?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (editingCase) {
            setCases(cases.map(c => c.id === editingCase.id ? newCase : c));
            setToast('Vaka güncellendi!');
        } else {
            setCases([...cases, newCase]);
            setToast('Yeni vaka oluşturuldu!');
        }

        resetForm();
    };

    const resetForm = () => {
        setShowModal(false);
        setEditingCase(null);
        setFormData({
            studentId: '',
            type: 'counseling',
            priority: 'normal',
            title: '',
            description: '',
            appointmentDate: '',
            status: 'scheduled',
            notes: ''
        });
    };

    const handleEdit = (caseItem) => {
        setEditingCase(caseItem);
        setFormData(caseItem);
        setShowModal(true);
    };

    const handleDelete = async (caseId) => {
        if (await onayla({ mesaj: 'Bu vakayı silmek istediğinize emin misiniz?', tehlikeli: true })) {
            setCases(cases.filter(c => c.id !== caseId));
            setToast('Vaka silindi!');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return 'bg-info-soft text-info';
            case 'in-progress': return 'bg-warn-soft text-warn';
            case 'completed': return 'bg-ok-soft text-ok';
            case 'cancelled': return 'bg-danger-soft text-danger';
            default: return 'bg-surface-3 text-ink-2';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-danger-soft text-danger';
            case 'normal': return 'bg-info-soft text-info';
            case 'low': return 'bg-surface-3 text-ink-2';
            default: return 'bg-surface-3 text-ink-2';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-ink">PDR İş Akışı Yönetimi</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="on-color px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 text-ink rounded-lg hover:shadow-lg transition flex items-center gap-2"
                >
                    <Plus size={20} />
                    Yeni Vaka
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-card p-4">
                    <div className="text-sm text-ink-2">Toplam Vaka</div>
                    <div className="text-2xl font-bold text-info">{cases.length}</div>
                </div>
                <div className="glass-card p-4">
                    <div className="text-sm text-ink-2">Planlanmış</div>
                    <div className="text-2xl font-bold text-info">{cases.filter(c => c.status === 'scheduled').length}</div>
                </div>
                <div className="glass-card p-4">
                    <div className="text-sm text-ink-2">Devam Eden</div>
                    <div className="text-2xl font-bold text-warn">{cases.filter(c => c.status === 'in-progress').length}</div>
                </div>
                <div className="glass-card p-4">
                    <div className="text-sm text-ink-2">Tamamlanan</div>
                    <div className="text-2xl font-bold text-ok">{cases.filter(c => c.status === 'completed').length}</div>
                </div>
            </div>

            {/* Cases List */}
            <div className="space-y-4">
                {cases.map(caseItem => {
                    const student = students.find(s => s.id === caseItem.studentId);
                    return (
                        <div key={caseItem.id} className="glass-card p-6 hover:shadow-xl transition">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="p-3 bg-info-soft rounded-lg">
                                        <Briefcase className="text-info" size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-ink">{caseItem.title}</h3>
                                            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(caseItem.priority)}`}>
                                                {caseItem.priority === 'high' ? 'Yüksek' : caseItem.priority === 'normal' ? 'Normal' : 'Düşük'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-ink-2 mb-2">
                                            <span className="flex items-center gap-1">
                                                <User size={14} />
                                                {student?.name || 'Bilinmeyen'}
                                            </span>
                                            {caseItem.appointmentDate && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {new Date(caseItem.appointmentDate).toLocaleDateString('tr-TR')}
                                                </span>
                                            )}
                                        </div>
                                        {caseItem.description && (
                                            <p className="text-sm text-ink-2 line-clamp-2">{caseItem.description}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(caseItem.status)}`}>
                                        {caseItem.status === 'scheduled' ? 'Planlandı' :
                                            caseItem.status === 'in-progress' ? 'Devam Ediyor' :
                                                caseItem.status === 'completed' ? 'Tamamlandı' : 'İptal'}
                                    </span>
                                    <button
                                        onClick={() => handleEdit(caseItem)}
                                        className="p-2 hover:bg-info-soft rounded-lg transition"
                                    >
                                        <FileText size={16} className="text-info" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(caseItem.id)}
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

            {cases.length === 0 && (
                <div className="glass-card p-12 text-center">
                    <Briefcase size={64} className="mx-auto text-ink-3 mb-4" />
                    <p className="text-ink-2">Henüz vaka kaydı yok</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="mt-4 px-6 py-2 bg-info text-white rounded-lg hover:bg-info transition"
                    >
                        İlk Vakayı Oluştur
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
                    <div className="on-color sticky top-0 bg-gradient-to-r from-cyan-600 to-cyan-700 p-6 text-ink rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold">
                                {editingCase ? 'Vakayı Düzenle' : 'Yeni Vaka'}
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
                                    className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                >
                                    <option value="">Seçiniz...</option>
                                    {students.map(student => (
                                        <option key={student.id} value={student.id}>{student.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-ink-2 mb-2">Tür</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                >
                                    <option value="counseling">Psikolojik Danışma</option>
                                    <option value="career">Kariyer Rehberliği</option>
                                    <option value="academic">Akademik Destek</option>
                                    <option value="family">Aile Görüşmesi</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-ink-2 mb-2">Başlık</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                placeholder="Örn: Akademik Kaygı Görüşmesi"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-ink-2 mb-2">Açıklama</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                rows="3"
                                placeholder="Vaka detayları..."
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-ink-2 mb-2">Öncelik</label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                >
                                    <option value="low">Düşük</option>
                                    <option value="normal">Normal</option>
                                    <option value="high">Yüksek</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-ink-2 mb-2">Durum</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                >
                                    <option value="scheduled">Planlandı</option>
                                    <option value="in-progress">Devam Ediyor</option>
                                    <option value="completed">Tamamlandı</option>
                                    <option value="cancelled">İptal</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-ink-2 mb-2">Randevu</label>
                                <input
                                    type="datetime-local"
                                    value={formData.appointmentDate}
                                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                                    className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-ink-2 mb-2">Notlar</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                rows="4"
                                placeholder="Görüşme notları, gözlemler..."
                            />
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
                                className="on-color flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-700 text-ink rounded-lg hover:shadow-lg font-medium transition"
                            >
                                {editingCase ? 'Güncelle' : 'Oluştur'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default WorkflowTab;
