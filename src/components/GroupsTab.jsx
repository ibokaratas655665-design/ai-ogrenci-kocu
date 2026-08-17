import React, { useState } from 'react';
import { Users, Plus, X, Edit2, Trash2, UserPlus } from 'lucide-react';
import { onayla } from '../services/uiGeriBildirim';

const GroupsTab = ({ students, setToast, bolum = 'kocluk' }) => {
    const [groups, setGroups] = useState(() => {
        const saved = localStorage.getItem('student_groups');
        return saved ? JSON.parse(saved) : [];
    });

    const [showModal, setShowModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);

    React.useEffect(() => {
        localStorage.setItem('student_groups', JSON.stringify(groups));
    }, [groups]);

    const handleCreateGroup = () => {
        if (!groupName.trim()) {
            setToast('Grup adı gereklidir!');
            return;
        }

        const newGroup = {
            id: editingGroup?.id || `group_${Date.now()}`,
            name: groupName,
            description: groupDescription,
            studentIds: selectedStudents,
            createdAt: editingGroup?.createdAt || new Date().toISOString(),
            // Koçluk grubu ile rehberlik grup çalışması ayrı listelerdir
            bolum: editingGroup?.bolum || bolum,
            updatedAt: new Date().toISOString()
        };

        if (editingGroup) {
            setGroups(groups.map(g => g.id === editingGroup.id ? newGroup : g));
            setToast('Grup güncellendi!');
        } else {
            setGroups([...groups, newGroup]);
            setToast('Grup oluşturuldu!');
        }

        resetForm();
    };

    // Etiketsiz eski gruplar koçluk sayılır
    const gorunenGruplar = groups.filter((g) => (g.bolum || 'kocluk') === bolum);

    const resetForm = () => {
        setShowModal(false);
        setEditingGroup(null);
        setGroupName('');
        setGroupDescription('');
        setSelectedStudents([]);
    };

    const handleEdit = (group) => {
        setEditingGroup(group);
        setGroupName(group.name);
        setGroupDescription(group.description || '');
        setSelectedStudents(group.studentIds || []);
        setShowModal(true);
    };

    const handleDelete = async (groupId) => {
        if (await onayla({ mesaj: 'Bu grubu silmek istediğinize emin misiniz?', tehlikeli: true })) {
            setGroups(groups.filter(g => g.id !== groupId));
            setToast('Grup silindi!');
        }
    };

    const toggleStudent = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-ink">Öğrenci Grupları</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="b b-fill b-accent"
                >
                    <Plus size={16} />
                    Yeni Grup
                </button>
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gorunenGruplar.map(group => {
                    const groupStudents = students.filter(s => group.studentIds?.includes(s.id));
                    return (
                        <div key={group.id} className="glass-card p-6 hover:shadow-xl transition">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-accent-soft rounded-lg">
                                        <Users className="text-accent" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-ink">{group.name}</h3>
                                        <p className="text-sm text-ink-2">{groupStudents.length} öğrenci</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(group)}
                                        className="p-2 hover:bg-info-soft rounded-lg transition"
                                    >
                                        <Edit2 size={16} className="text-info" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(group.id)}
                                        className="p-2 hover:bg-danger-soft rounded-lg transition"
                                    >
                                        <Trash2 size={16} className="text-danger" />
                                    </button>
                                </div>
                            </div>

                            {group.description && (
                                <p className="text-sm text-ink-2 mb-4">{group.description}</p>
                            )}

                            <div className="space-y-2">
                                {groupStudents.slice(0, 3).map(student => (
                                    <div key={student.id} className="flex items-center gap-2 text-sm bg-surface-2 p-2 rounded-lg">
                                        <UserPlus size={14} className="text-ink-3" />
                                        <span className="text-ink-2">{student.name}</span>
                                    </div>
                                ))}
                                {groupStudents.length > 3 && (
                                    <p className="text-xs text-ink-2 text-center">
                                        +{groupStudents.length - 3} öğrenci daha
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {gorunenGruplar.length === 0 && (
                <div className="glass-card p-12 text-center">
                    <Users size={64} className="mx-auto text-ink-3 mb-4" />
                    <p className="text-ink-2">Henüz grup oluşturulmamış</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="mt-4 px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent transition"
                    >
                        İlk Grubu Oluştur
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-modal-base p-4">
                    <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="on-color sticky top-0 bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-ink">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold">
                                    {editingGroup ? 'Grubu Düzenle' : 'Yeni Grup Oluştur'}
                                </h2>
                                <button onClick={resetForm} className="hover:bg-surface/20 p-2 rounded-lg transition">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-ink-2 mb-2">Grup Adı</label>
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-teal-500"
                                    placeholder="Örn: 12. Sınıf MF"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-ink-2 mb-2">Açıklama (Opsiyonel)</label>
                                <textarea
                                    value={groupDescription}
                                    onChange={(e) => setGroupDescription(e.target.value)}
                                    className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-teal-500"
                                    rows="3"
                                    placeholder="Grup hakkında kısa açıklama..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-ink-2 mb-2">
                                    Öğrenciler ({selectedStudents.length} seçildi)
                                </label>
                                <div className="max-h-64 overflow-y-auto border rounded-lg p-4 space-y-2">
                                    {students.map(student => (
                                        <label
                                            key={student.id}
                                            className="flex items-center gap-3 p-3 hover:bg-surface-2 rounded-lg cursor-pointer transition"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedStudents.includes(student.id)}
                                                onChange={() => toggleStudent(student.id)}
                                                className="w-4 h-4 text-accent rounded focus:ring-2 focus:ring-teal-500"
                                            />
                                            <span className="font-medium text-ink">{student.name}</span>
                                            <span className="text-sm text-ink-2">{student.schoolNumber}</span>
                                        </label>
                                    ))}
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
                                    onClick={handleCreateGroup}
                                    className="on-color flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-ink rounded-lg hover:shadow-lg font-medium transition"
                                >
                                    {editingGroup ? 'Güncelle' : 'Oluştur'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupsTab;
