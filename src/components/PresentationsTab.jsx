import React, { useState } from 'react';
import { Presentation, Plus, X, Eye, Share2, Download, Play } from 'lucide-react';
import Modal from './ui/Modal';

const PresentationsTab = ({ students, setToast }) => {
    const [presentations, setPresentations] = useState(() => {
        const saved = localStorage.getItem('presentations');
        return saved ? JSON.parse(saved) : [];
    });

    const [showModal, setShowModal] = useState(false);
    const [editingPresentation, setEditingPresentation] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        content: '',
        targetAudience: 'all',
        tags: '',
        url: ''
    });

    React.useEffect(() => {
        localStorage.setItem('presentations', JSON.stringify(presentations));
    }, [presentations]);

    const handleSubmit = () => {
        if (!formData.title) {
            setToast('Sunum başlığı gereklidir!');
            return;
        }

        const newPresentation = {
            id: editingPresentation?.id || `pres_${Date.now()}`,
            ...formData,
            views: editingPresentation?.views || 0,
            createdAt: editingPresentation?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (editingPresentation) {
            setPresentations(presentations.map(p => p.id === editingPresentation.id ? newPresentation : p));
            setToast('Sunum güncellendi!');
        } else {
            setPresentations([...presentations, newPresentation]);
            setToast('Sunum oluşturuldu!');
        }

        resetForm();
    };

    const resetForm = () => {
        setShowModal(false);
        setEditingPresentation(null);
        setFormData({ title: '', description: '', content: '', targetAudience: 'all', tags: '', url: '' });
    };

    const handleView = (presentation) => {
        setPresentations(presentations.map(p =>
            p.id === presentation.id ? { ...p, views: (p.views || 0) + 1 } : p
        ));
        if (presentation.url) {
            window.open(presentation.url, '_blank');
        } else {
            setToast('Sunum URL\'si tanımlı değil!');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-ink">Eğitim Sunumları</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="on-color px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-ink rounded-lg hover:shadow-lg transition flex items-center gap-2"
                >
                    <Plus size={20} />
                    Yeni Sunum
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {presentations.map(presentation => (
                    <div key={presentation.id} className="glass-card overflow-hidden hover:shadow-xl transition group">
                        <div className="on-color bg-gradient-to-br from-fuchsia-500 to-pink-500 p-6 text-ink">
                            <div className="flex items-start justify-between mb-4">
                                <Presentation size={32} className="opacity-80" />
                                <span className="text-xs bg-surface/20 px-2 py-1 rounded-full">
                                    {presentation.views || 0} görüntülenme
                                </span>
                            </div>
                            <h3 className="font-bold text-lg line-clamp-2">{presentation.title}</h3>
                        </div>

                        <div className="p-6">
                            {presentation.description && (
                                <p className="text-sm text-ink-2 mb-4 line-clamp-3">{presentation.description}</p>
                            )}

                            <div className="flex gap-2 mb-4">
                                {presentation.tags && presentation.tags.split(',').slice(0, 3).map((tag, i) => (
                                    <span key={i} className="text-xs bg-[color-mix(in_srgb,var(--c5)_14%,var(--surface))] text-c5 px-2 py-1 rounded-full">
                                        {tag.trim()}
                                    </span>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleView(presentation)}
                                    className="on-color flex-1 px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-ink rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2"
                                >
                                    <Play size={16} />
                                    Görüntüle
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingPresentation(presentation);
                                        setFormData(presentation);
                                        setShowModal(true);
                                    }}
                                    className="px-4 py-2 border border-line-2 rounded-lg hover:bg-surface-2 transition"
                                >
                                    <Eye size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {presentations.length === 0 && (
                <div className="glass-card p-12 text-center">
                    <Presentation size={64} className="mx-auto text-ink-3 mb-4" />
                    <p className="text-ink-2">Henüz sunum yok</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="mt-4 px-6 py-2 bg-c5 text-white rounded-lg hover:bg-c5 transition"
                    >
                        İlk Sunumu Oluştur
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
                    <div className="on-color bg-gradient-to-r from-fuchsia-600 to-pink-600 p-6 text-ink rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold">
                                {editingPresentation ? 'Sunumu Düzenle' : 'Yeni Sunum'}
                            </h2>
                            <button onClick={resetForm} className="hover:bg-surface/20 p-2 rounded-lg transition">
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-ink-2 mb-2">Başlık</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                                placeholder="Örn: YKS Motivasyon Sunumu"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-ink-2 mb-2">Açıklama</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                                rows="3"
                                placeholder="Sunum hakkında..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-ink-2 mb-2">Sunum URL (Canva, Google Slides, vb.)</label>
                            <input
                                type="url"
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                                placeholder="https://..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-ink-2 mb-2">Hedef Kitle</label>
                                <select
                                    value={formData.targetAudience}
                                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                                    className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                                >
                                    <option value="all">Tüm Öğrenciler</option>
                                    <option value="9">9. Sınıf</option>
                                    <option value="10">10. Sınıf</option>
                                    <option value="11">11. Sınıf</option>
                                    <option value="12">12. Sınıf</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-ink-2 mb-2">Etiketler (virgülle ayrılmış)</label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                                    placeholder="motivasyon, yks, kariyer"
                                />
                            </div>
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
                                className="on-color flex-1 px-6 py-3 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-ink rounded-lg hover:shadow-lg font-medium transition"
                            >
                                {editingPresentation ? 'Güncelle' : 'Oluştur'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default PresentationsTab;
