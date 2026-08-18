/**
 * 📋 GÖREV PLANI ŞABLONLARİ
 */
import React, { useState } from 'react';
import { Plus, Save, Trash2, Send, ClipboardList, X, Check, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { yaz, listeOku, nesneOku } from '../../services/veriDeposu';

const LS_KEY = 'task_templates';
const DEFAULT_TEMPLATES = [
    {
        id: 'tpl_1', name: 'Haftalık Temel Paket', emoji: '📚', color: 'from-indigo-500 to-purple-600',
        tasks: [{ title: 'TYT Türkçe - 50 soru', priority: 'high', dueDate: 7 }, { title: 'TYT Matematik - 40 soru', priority: 'high', dueDate: 7 }, { title: 'Fen Bilimleri Tekrar', priority: 'normal', dueDate: 7 }]
    },
    {
        id: 'tpl_2', name: 'Deneme Hazırlık', emoji: '🎯', color: 'from-orange-500 to-red-500',
        tasks: [{ title: 'Zayıf konuları çalış', priority: 'urgent', dueDate: 3 }, { title: 'Soru çözme hızı', priority: 'high', dueDate: 2 }, { title: 'Strateji planlaması', priority: 'normal', dueDate: 1 }]
    },
    {
        id: 'tpl_3', name: 'Yoğun Çalışma', emoji: '🚀', color: 'from-emerald-500 to-teal-600',
        tasks: [{ title: 'Günlük 3 Pomodoro', priority: 'high', dueDate: 7 }, { title: 'Her gün 30 soru', priority: 'high', dueDate: 7 }, { title: 'Hata analizi defteri', priority: 'normal', dueDate: 7 }]
    },
];
const COLORS = ['from-indigo-500 to-purple-600', 'from-orange-500 to-red-500', 'from-emerald-500 to-teal-600', 'from-blue-500 to-cyan-600', 'from-pink-500 to-rose-600'];
const EMOJIS = ['📚', '🎯', '🚀', '⚡', '🔥', '💪', '📝', '🧠'];
const PRIORITY_MAP = { urgent: 'Acil', high: 'Yüksek', normal: 'Normal', low: 'Düşük' };

const TaskTemplates = ({ students = [], setToast }) => {
    const [templates, setTemplates] = useState(() => {
        try {
            const saved = listeOku(LS_KEY);
            return [...DEFAULT_TEMPLATES, ...saved.filter(t => !DEFAULT_TEMPLATES.find(d => d.id === t.id))];
        } catch { return DEFAULT_TEMPLATES; }
    });
    const [showCreate, setShowCreate] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [assigningId, setAssigningId] = useState(null);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [form, setForm] = useState({ name: '', emoji: '📚', colorIdx: 0, tasks: [{ title: '', priority: 'normal', dueDate: 7 }] });

    const saveTemplates = (updated) => {
        setTemplates(updated);
        const custom = updated.filter(t => !DEFAULT_TEMPLATES.find(d => d.id === t.id));
        yaz(LS_KEY, custom);
    };

    const handleSaveTemplate = () => {
        if (!form.name.trim()) return;
        const validTasks = form.tasks.filter(t => t.title.trim());
        if (validTasks.length === 0) return;
        const tpl = { id: `custom_${Date.now()}`, name: form.name, emoji: form.emoji, color: COLORS[form.colorIdx], tasks: validTasks };
        saveTemplates([...templates, tpl]);
        setForm({ name: '', emoji: '📚', colorIdx: 0, tasks: [{ title: '', priority: 'normal', dueDate: 7 }] });
        setShowCreate(false);
        setToast?.('✅ Şablon kaydedildi!');
    };

    const handleDeleteTemplate = (id) => {
        if (DEFAULT_TEMPLATES.find(d => d.id === id)) { setToast?.('❌ Varsayılan şablonlar silinemez'); return; }
        saveTemplates(templates.filter(t => t.id !== id));
        setToast?.('Şablon silindi');
    };

    const handleAssign = (templateId) => {
        if (selectedStudents.length === 0) { setToast?.('❌ En az bir öğrenci seçin'); return; }
        const tpl = templates.find(t => t.id === templateId);
        if (!tpl) return;
        const existing = nesneOku('student_tasks');
        const now = new Date();
        selectedStudents.forEach(sid => {
            const key = String(sid);
            if (!existing[key]) existing[key] = [];
            tpl.tasks.forEach(task => {
                const due = new Date(now);
                due.setDate(due.getDate() + (task.dueDate || 7));
                existing[key].push({ id: `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, studentId: key, title: task.title, priority: task.priority, dueDate: due.toISOString().split('T')[0], status: 'pending', completed: false, assignedAt: now.toISOString(), templateName: tpl.name });
            });
        });
        yaz('student_tasks', existing);
        window.dispatchEvent(new StorageEvent('storage', { key: 'student_tasks' }));
        setToast?.(`✅ "${tpl.name}" ${selectedStudents.length} öğrenciye atandı!`);
        setAssigningId(null); setSelectedStudents([]);
    };

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-xl font-black text-ink flex items-center gap-2">
                        <ClipboardList size={22} className="text-info" /> Görev Şablonları
                    </h2>
                    <p className="text-sm text-ink-3 mt-0.5">Hazır şablonları tek tıkla öğrencilere ata</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="on-color flex items-center gap-2 text-sm bg-gradient-to-r from-blue-600 to-brand text-white px-4 py-2 rounded-xl font-bold hover:opacity-90 transition shadow-sm">
                    <Plus size={16} /> Şablon Oluştur
                </button>
            </div>

            {showCreate && (
                <div className="bg-surface rounded-2xl shadow-lg border-2 border-info p-5 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-black text-ink">Yeni Şablon</h3>
                        <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-surface-3 rounded-xl text-ink-3"><X size={16} /></button>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <div className="flex gap-1.5 flex-wrap">
                            {EMOJIS.map(e => (
                                <button key={e} onClick={() => setForm(p => ({ ...p, emoji: e }))} className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition ${form.emoji === e ? 'bg-brand-soft ring-2 ring-brand' : 'bg-surface-2 hover:bg-surface-3'}`}>{e}</button>
                            ))}
                        </div>
                        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Şablon adı..."
                            className="flex-1 min-w-40 border border-line rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div className="flex gap-2">
                        {COLORS.map((c, idx) => (
                            <button key={idx} onClick={() => setForm(p => ({ ...p, colorIdx: idx }))} className={`w-7 h-7 rounded-full bg-gradient-to-r ${c} transition-all ${form.colorIdx === idx ? 'ring-2 ring-offset-2 ring-gray-600 scale-125' : 'hover:scale-110'}`} />
                        ))}
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs font-bold text-ink-2 uppercase">Görevler</p>
                        {form.tasks.map((task, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <input value={task.title} onChange={e => setForm(p => ({ ...p, tasks: p.tasks.map((t, i) => i === idx ? { ...t, title: e.target.value } : t) }))}
                                    placeholder={`${idx + 1}. görev...`} className="flex-1 border border-line rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
                                <select value={task.dueDate} onChange={e => setForm(p => ({ ...p, tasks: p.tasks.map((t, i) => i === idx ? { ...t, dueDate: parseInt(e.target.value) } : t) }))}
                                    className="text-xs border border-line rounded-xl px-2 py-2 bg-surface outline-none">
                                    {[1, 2, 3, 5, 7, 14].map(d => <option key={d} value={d}>{d}g</option>)}
                                </select>
                                {form.tasks.length > 1 && <button onClick={() => setForm(p => ({ ...p, tasks: p.tasks.filter((_, i) => i !== idx) }))} className="p-2 text-danger hover:bg-danger-soft rounded-xl"><X size={14} /></button>}
                            </div>
                        ))}
                        <button onClick={() => setForm(p => ({ ...p, tasks: [...p.tasks, { title: '', priority: 'normal', dueDate: 7 }] }))} className="flex items-center gap-1.5 text-xs text-info font-bold mt-1">
                            <Plus size={14} /> Görev Ekle
                        </button>
                    </div>
                    <div className="pencere-alt-cubuk bg-surface flex gap-2">
                        <button onClick={() => setShowCreate(false)} className="flex-1 py-2 border border-line rounded-xl text-sm text-ink-2">İptal</button>
                        <button onClick={handleSaveTemplate} className="flex-1 py-2 bg-info text-white rounded-xl text-sm font-black hover:bg-info flex items-center justify-center gap-2"><Save size={14} /> Kaydet</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(tpl => {
                    const isExpanded = expandedId === tpl.id;
                    const isAssigning = assigningId === tpl.id;
                    return (
                        <div key={tpl.id} className="bg-surface rounded-2xl shadow-sm border border-line overflow-hidden hover:shadow-md transition-all">
                            <div className={`bg-gradient-to-r ${tpl.color} p-4 text-ink`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{tpl.emoji}</span>
                                        <div>
                                            <p className="font-black text-sm">{tpl.name}</p>
                                            <p className="text-xs opacity-75">{tpl.tasks.length} görev</p>
                                        </div>
                                    </div>
                                    {!DEFAULT_TEMPLATES.find(d => d.id === tpl.id) && (
                                        <button onClick={() => handleDeleteTemplate(tpl.id)} className="p-1.5 hover:bg-surface/20 rounded-xl transition opacity-70"><Trash2 size={14} /></button>
                                    )}
                                </div>
                            </div>
                            <div className="p-4 space-y-2">
                                {tpl.tasks.slice(0, isExpanded ? undefined : 2).map((task, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                                        <span className="text-ink-2 truncate flex-1">{task.title}</span>
                                        <span className="text-ink-3 flex-shrink-0">{task.dueDate}g</span>
                                    </div>
                                ))}
                                {tpl.tasks.length > 2 && (
                                    <button onClick={() => setExpandedId(isExpanded ? null : tpl.id)} className="text-xs text-brand hover:text-brand font-bold flex items-center gap-1 mt-1">
                                        {isExpanded ? <><ChevronUp size={12} /> Gizle</> : <><ChevronDown size={12} /> +{tpl.tasks.length - 2} görev</>}
                                    </button>
                                )}
                            </div>
                            {isAssigning ? (
                                <div className="px-4 pb-4 border-t border-line pt-3 space-y-2">
                                    <p className="text-xs font-bold text-ink-2">Öğrenci Seç:</p>
                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                        {students.map(s => (
                                            <label key={s.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-surface-2 p-1.5 rounded-lg">
                                                <input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={() => setSelectedStudents(prev => prev.includes(s.id) ? prev.filter(sid => sid !== s.id) : [...prev, s.id])} className="rounded" />
                                                <span className="font-medium text-ink-2">{s.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="pencere-alt-cubuk bg-surface flex gap-2">
                                        <button onClick={() => { setAssigningId(null); setSelectedStudents([]); }} className="flex-1 text-xs py-2 border border-line rounded-xl text-ink-2">İptal</button>
                                        <button onClick={() => handleAssign(tpl.id)} className="flex-1 text-xs py-2 bg-ok text-white rounded-xl font-bold flex items-center justify-center gap-1">
                                            <Send size={12} /> {selectedStudents.length > 0 ? `${selectedStudents.length} Öğrenciye At` : 'Ata'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="px-4 pb-4">
                                    <button onClick={() => { setAssigningId(tpl.id); setSelectedStudents([]); }}
                                        className="on-color w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-brand to-purple-600 text-white rounded-xl text-sm font-black hover:opacity-90 transition">
                                        <Users size={14} /> Öğrencilere Ata
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TaskTemplates;
