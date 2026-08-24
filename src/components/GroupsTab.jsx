/**
 * 👥 GRUPLAR — SINIF ANALİZİ (Tasarım 2.0, 24.08.2026)
 *
 * Eski ekran yalnızca grup KURMA aracıydı: kart üzerinde üye adlarından
 * başka hiçbir bilgi yoktu. Koçun asıl sorusu "hangi grup nasıl gidiyor?"
 * cevapsızdı. Artık her grup kartı mevcut roster motorundan
 * (buildRosterStatus) beslenen bir mini karnedir ve ≥2 grup varsa
 * gruplar tek panoda karşılaştırılır. Yeni veri üretilmez — yalnızca
 * mevcut kayıtlar okunur.
 */
import React, { useState, useMemo } from 'react';
import { Users, Plus, X, Edit2, Trash2, TrendingUp, ClipboardList, AlertCircle } from 'lucide-react';
import { onayla } from '../services/uiGeriBildirim';
import Modal from './ui/Modal';
import { yaz } from '../services/veriDeposu';
import { buildRosterStatus } from '../services/reportService';
import { SayiCubuklari } from './charts/Analitik';

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
        yaz('student_groups', groups);
    }, [groups]);

    /* Üye durumları tek geçişte: roster motoru zaten öğrenci başına
       son net, haftalık soru, görev oranı ve risk hesaplıyor. */
    const rosterById = useMemo(() => {
        try {
            const map = new Map();
            buildRosterStatus(students || []).forEach((r) => map.set(String(r.id), r));
            return map;
        } catch { return new Map(); }
    }, [students]);

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

    /** Grup başına özet: yalnızca GERÇEKTEN hesaplanabilen değerler.
        Hiç deneme yoksa ortalama net '—' kalır, 0 uydurulmaz. */
    const grupOzetleri = useMemo(() => {
        return gorunenGruplar.map((group) => {
            const uyeler = (group.studentIds || [])
                .map((id) => rosterById.get(String(id)))
                .filter(Boolean);
            const netler = uyeler.map((u) => u.lastNet).filter((n) => n != null);
            const gorevli = uyeler.filter((u) => u.taskCompletion != null);
            return {
                id: group.id,
                uyeSayisi: (group.studentIds || []).length,
                ortNet: netler.length
                    ? Math.round((netler.reduce((a, b) => a + b, 0) / netler.length) * 10) / 10
                    : null,
                haftalikSoru: uyeler.reduce((a, u) => a + (u.questions || 0), 0),
                gorevOrani: gorevli.length
                    ? Math.round((gorevli.reduce((a, u) => a + u.taskCompletion, 0) / gorevli.length) * 100)
                    : null,
                aktif: uyeler.filter((u) => (u.questions || 0) > 0 || (u.pages || 0) > 0).length,
                riskli: uyeler.filter((u) => u.risk?.level === 'high').length,
            };
        });
    }, [gorunenGruplar, rosterById]);
    const ozetById = useMemo(() => new Map(grupOzetleri.map((o) => [o.id, o])), [grupOzetleri]);

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
                <div>
                    <h2 className="text-2xl font-black text-ink syne tracking-tight uppercase">Öğrenci Grupları</h2>
                    <p className="text-brand text-[10px] font-black tracking-[0.2em] mt-1 uppercase">GRUP BAZLI SINIF ANALİZİ</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="b b-fill b-accent"
                >
                    <Plus size={16} />
                    Yeni Grup
                </button>
            </div>

            {/* Groups Grid — her kart bir mini grup karnesi */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gorunenGruplar.map(group => {
                    const groupStudents = students.filter(s => group.studentIds?.includes(s.id));
                    const ozet = ozetById.get(group.id);
                    return (
                        <div key={group.id} className="bg-surface border border-line rounded-2xl p-5 hover:shadow-xl transition">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-3 bg-brand-soft rounded-xl shrink-0">
                                        <Users className="text-brand" size={22} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-ink truncate">{group.name}</h3>
                                        <p className="text-sm text-ink-2">{groupStudents.length} öğrenci{ozet?.riskli ? ` · ${ozet.riskli} riskli` : ''}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <button
                                        onClick={() => handleEdit(group)}
                                        aria-label={`${group.name} grubunu düzenle`}
                                        className="p-2 hover:bg-info-soft rounded-lg transition"
                                    >
                                        <Edit2 size={16} className="text-info" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(group.id)}
                                        aria-label={`${group.name} grubunu sil`}
                                        className="p-2 hover:bg-danger-soft rounded-lg transition"
                                    >
                                        <Trash2 size={16} className="text-danger" />
                                    </button>
                                </div>
                            </div>

                            {group.description && (
                                <p className="text-sm text-ink-2 mb-3">{group.description}</p>
                            )}

                            {/* Grup karnesi — roster motorundan */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="rounded-xl bg-surface-2 px-3 py-2">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-ink-3 flex items-center gap-1"><TrendingUp size={11} /> Ort. Son Net</p>
                                    <p className="text-lg font-black tabular-nums text-ink">{ozet?.ortNet ?? '—'}</p>
                                </div>
                                <div className="rounded-xl bg-surface-2 px-3 py-2">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-ink-3 flex items-center gap-1"><ClipboardList size={11} /> Haftalık Soru</p>
                                    <p className="text-lg font-black tabular-nums text-ink">{ozet?.haftalikSoru ?? 0}</p>
                                </div>
                                <div className="rounded-xl bg-surface-2 px-3 py-2">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-ink-3">Görev Tamamlama</p>
                                    <p className="text-lg font-black tabular-nums" style={{ color: ozet?.gorevOrani == null ? 'var(--ink)' : ozet.gorevOrani >= 70 ? 'var(--ok)' : ozet.gorevOrani >= 40 ? 'var(--warn)' : 'var(--danger)' }}>
                                        {ozet?.gorevOrani != null ? `%${ozet.gorevOrani}` : '—'}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-surface-2 px-3 py-2">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-ink-3">Bu Hafta Aktif</p>
                                    <p className="text-lg font-black tabular-nums text-ink">{ozet?.aktif ?? 0}<span className="text-xs text-ink-3 font-bold"> / {groupStudents.length}</span></p>
                                </div>
                            </div>

                            {/* Üyeler — riskli üye işaretli */}
                            <div className="space-y-1.5">
                                {groupStudents.slice(0, 4).map(student => {
                                    const r = rosterById.get(String(student.id));
                                    return (
                                        <div key={student.id} className="flex items-center justify-between gap-2 text-sm bg-surface-2 px-2.5 py-1.5 rounded-lg">
                                            <span className="text-ink-2 truncate">{student.name}</span>
                                            <span className="shrink-0 flex items-center gap-2 text-[11px] font-bold tabular-nums">
                                                {r?.lastNet != null && <span className="text-ink-3">{r.lastNet} net</span>}
                                                {r?.risk?.level === 'high' && <AlertCircle size={13} className="text-danger" aria-label="riskli" />}
                                            </span>
                                        </div>
                                    );
                                })}
                                {groupStudents.length > 4 && (
                                    <p className="text-xs text-ink-2 text-center">
                                        +{groupStudents.length - 4} öğrenci daha
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* GRUP KARŞILAŞTIRMASI — ≥2 grup varsa tek panoda.
                Çubuklar mutlak sayıları en büyüğe göre ölçekler;
                hangi grubun önde olduğu tek bakışta okunur. */}
            {gorunenGruplar.length >= 2 && (
                <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div>
                        <h4 className="tip-h4 mb-3 flex items-center gap-2"><TrendingUp size={16} className="text-brand" /> Ortalama Son Net</h4>
                        <SayiCubuklari
                            satirlar={gorunenGruplar.map((g) => ({
                                ad: g.name,
                                deger: ozetById.get(g.id)?.ortNet ?? 0,
                            }))}
                        />
                    </div>
                    <div>
                        <h4 className="tip-h4 mb-3 flex items-center gap-2"><ClipboardList size={16} className="text-brand" /> Haftalık Soru Çözümü</h4>
                        <SayiCubuklari
                            satirlar={gorunenGruplar.map((g) => ({
                                ad: g.name,
                                deger: ozetById.get(g.id)?.haftalikSoru ?? 0,
                            }))}
                        />
                    </div>
                </div>
            )}

            {gorunenGruplar.length === 0 && (
                <div className="bg-surface border border-dashed border-line rounded-2xl p-12 text-center">
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
                <Modal
                    acik
                    onClose={resetForm}
                    baslikGizle
                    genislik="lg"
                    govdeClassName="p-0"
                >
                    <div className="sticky top-0 bg-surface border-b border-line p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-ink">
                                {editingGroup ? 'Grubu Düzenle' : 'Yeni Grup Oluştur'}
                            </h2>
                            <button onClick={resetForm} aria-label="Kapat" className="hover:bg-surface-2 p-2 rounded-lg transition text-ink-2">
                                <X size={22} />
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
                                className="w-full px-4 py-3 bg-surface border border-line-2 rounded-lg text-ink focus:ring-2 focus:ring-brand outline-none"
                                placeholder="Örn: 12. Sınıf MF"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-ink-2 mb-2">Açıklama (Opsiyonel)</label>
                            <textarea
                                value={groupDescription}
                                onChange={(e) => setGroupDescription(e.target.value)}
                                className="w-full px-4 py-3 bg-surface border border-line-2 rounded-lg text-ink focus:ring-2 focus:ring-brand outline-none"
                                rows="3"
                                placeholder="Grup hakkında kısa açıklama..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-ink-2 mb-2">
                                Öğrenciler ({selectedStudents.length} seçildi)
                            </label>
                            <div className="max-h-64 overflow-y-auto border border-line rounded-lg p-4 space-y-2">
                                {students.map(student => (
                                    <label
                                        key={student.id}
                                        className="flex items-center gap-3 p-3 hover:bg-surface-2 rounded-lg cursor-pointer transition"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedStudents.includes(student.id)}
                                            onChange={() => toggleStudent(student.id)}
                                            className="w-4 h-4 text-accent rounded focus:ring-2 focus:ring-brand"
                                        />
                                        <span className="font-medium text-ink">{student.name}</span>
                                        <span className="text-sm text-ink-2">{student.schoolNumber}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="pencere-alt-cubuk bg-surface flex gap-3 pt-6 border-t border-line">
                            <button
                                onClick={resetForm}
                                className="flex-1 px-6 py-3 border border-line-2 rounded-lg hover:bg-surface-2 font-medium transition text-ink"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleCreateGroup}
                                className="flex-1 px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand-hover hover:shadow-lg font-bold transition"
                            >
                                {editingGroup ? 'Güncelle' : 'Oluştur'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default GroupsTab;
