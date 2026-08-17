import React, { useState } from 'react';
import { Rocket, Plus, X, Edit2, Trash2, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { onayla } from '../services/uiGeriBildirim';

const ProjectsTab = ({ students, setToast }) => {
    const [projects, setProjects] = useState(() => {
        const saved = localStorage.getItem('student_projects');
        return saved ? JSON.parse(saved) : [];
    });

    const [showModal, setShowModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        studentId: '',
        deadline: '',
        status: 'planning'
    });

    React.useEffect(() => {
        localStorage.setItem('student_projects', JSON.stringify(projects));
    }, [projects]);

    const handleSubmit = () => {
        if (!formData.title || !formData.studentId) {
            setToast('Proje adı ve öğrenci seçimi gereklidir!');
            return;
        }

        const newProject = {
            id: editingProject?.id || `project_${Date.now()}`,
            ...formData,
            createdAt: editingProject?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (editingProject) {
            setProjects(projects.map(p => p.id === editingProject.id ? newProject : p));
            setToast('Proje güncellendi!');
        } else {
            setProjects([...projects, newProject]);
            setToast('Proje oluşturuldu!');
        }

        resetForm();
    };

    const resetForm = () => {
        setShowModal(false);
        setEditingProject(null);
        setFormData({ title: '', description: '', studentId: '', deadline: '', status: 'planning' });
    };

    const handleEdit = (project) => {
        setEditingProject(project);
        setFormData(project);
        setShowModal(true);
    };

    const handleDelete = async (projectId) => {
        if (await onayla({ mesaj: 'Bu projeyi silmek istediğinize emin misiniz?', tehlikeli: true })) {
            setProjects(projects.filter(p => p.id !== projectId));
            setToast('Proje silindi!');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'planning': return 'bg-info-soft text-info';
            case 'in-progress': return 'bg-warn-soft text-warn';
            case 'completed': return 'bg-ok-soft text-ok';
            case 'cancelled': return 'bg-danger-soft text-danger';
            default: return 'bg-surface-3 text-ink-2';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'planning': return <Clock size={16} />;
            case 'in-progress': return <AlertCircle size={16} />;
            case 'completed': return <CheckCircle size={16} />;
            default: return null;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'planning': return 'Planlanıyor';
            case 'in-progress': return 'Devam Ediyor';
            case 'completed': return 'Tamamlandı';
            case 'cancelled': return 'İptal Edildi';
            default: return status;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-ink">Öğrenci Projeleri</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="b b-fill b-brand"
                >
                    <Plus size={20} />
                    Yeni Proje
                </button>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map(project => {
                    const student = students.find(s => s.id === project.studentId);
                    return (
                        <div key={project.id} className="glass-card p-6 hover:shadow-xl transition">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="p-3 bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] rounded-lg">
                                        <Rocket className="text-c4" size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-ink">{project.title}</h3>
                                        <p className="text-sm text-ink-2">{student?.name || 'Bilinmeyen Öğrenci'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(project)}
                                        className="p-2 hover:bg-info-soft rounded-lg transition"
                                    >
                                        <Edit2 size={16} className="text-info" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(project.id)}
                                        className="p-2 hover:bg-danger-soft rounded-lg transition"
                                    >
                                        <Trash2 size={16} className="text-danger" />
                                    </button>
                                </div>
                            </div>

                            {project.description && (
                                <p className="text-sm text-ink-2 mb-4 line-clamp-2">{project.description}</p>
                            )}

                            <div className="flex items-center justify-between">
                                <span className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 ${getStatusColor(project.status)}`}>
                                    {getStatusIcon(project.status)}
                                    {getStatusText(project.status)}
                                </span>
                                {project.deadline && (
                                    <span className="text-xs text-ink-2">
                                        Son: {new Date(project.deadline).toLocaleDateString('tr-TR')}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {projects.length === 0 && (
                <div className="glass-card p-12 text-center">
                    <Rocket size={64} className="mx-auto text-ink-3 mb-4" />
                    <p className="text-ink-2">Henüz proje oluşturulmamış</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="mt-4 px-6 py-2 bg-c4 text-white rounded-lg hover:bg-c4 transition"
                    >
                        İlk Projeyi Oluştur
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-modal-base p-4">
                    <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-2xl">
                        <div className="on-color bg-gradient-to-r from-c4 to-c5 p-6 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold">
                                    {editingProject ? 'Projeyi Düzenle' : 'Yeni Proje'}
                                </h2>
                                <button onClick={resetForm} className="hover:bg-surface/20 p-2 rounded-lg transition">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-ink-2 mb-2">Proje Başlığı</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-violet-500"
                                    placeholder="Örn: Bilim Fuarı Projesi"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-ink-2 mb-2">Açıklama</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-violet-500"
                                    rows="3"
                                    placeholder="Proje detayları..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-ink-2 mb-2">Öğrenci</label>
                                    <select
                                        value={formData.studentId}
                                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                        className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-violet-500"
                                    >
                                        <option value="">Seçiniz...</option>
                                        {students.map(student => (
                                            <option key={student.id} value={student.id}>{student.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-ink-2 mb-2">Son Tarih</label>
                                    <input
                                        type="date"
                                        value={formData.deadline}
                                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                        className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-violet-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-ink-2 mb-2">Durum</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-violet-500"
                                >
                                    <option value="planning">Planlanıyor</option>
                                    <option value="in-progress">Devam Ediyor</option>
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
                                    className="on-color flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-ink rounded-lg hover:shadow-lg font-medium transition"
                                >
                                    {editingProject ? 'Güncelle' : 'Oluştur'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectsTab;
