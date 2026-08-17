import React, { useState } from 'react';
import { X, Plus, Target, CheckSquare, Users, BookOpen, FileText, ClipboardList, HelpCircle, ChevronDown } from 'lucide-react';
import { bildir } from '../services/uiGeriBildirim';

const CATEGORY_OPTIONS = [
    {
        value: 'homework',
        label: '📚 Genel Ödev',
        desc: 'Herhangi bir konu veya ders için ödev',
        color: 'bg-info-soft border-info text-info'
    },
    {
        value: 'topic_homework',
        label: '📖 Konu Ödevi',
        desc: 'Belirli bir konu çalışması ödevi',
        color: 'bg-brand-soft border-brand-line text-brand'
    },
    {
        value: 'question_homework',
        label: '🧮 Soru Çözme Ödevi',
        desc: 'Soru çözme / test ödevi ver',
        color: 'bg-ok-soft border-ok text-ok'
    },
    {
        value: 'test',
        label: '📝 Test / Sınav',
        desc: 'Online veya kâğıt test atama',
        color: 'bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] border-[color-mix(in_srgb,var(--c4)_35%,transparent)] text-c4'
    },
    {
        value: 'inventory',
        label: '🧠 Envanter / Anket',
        desc: 'Holland, kaygı, ilgi envanteri',
        color: 'bg-warn-soft border-warn text-warn'
    },
    {
        value: 'study',
        label: '✏️ Genel Çalışma',
        desc: 'Serbest çalışma görevi',
        color: 'bg-surface-2 border-line-2 text-ink-2'
    },
    {
        value: 'reading',
        label: '📖 Okuma',
        desc: 'Kitap / makale okuma görevi',
        color: 'bg-warn-soft border-warn text-warn'
    },
    {
        value: 'revision',
        label: '🔄 Tekrar',
        desc: 'Konu tekrarlama görevi',
        color: 'bg-danger-soft border-danger text-danger'
    },
];

const PRIORITY_OPTIONS = [
    { value: 'urgent', label: '🔴 Acil', cls: 'bg-danger-soft text-danger border-danger' },
    { value: 'high', label: '🟠 Yüksek', cls: 'bg-warn-soft text-warn border-warn' },
    { value: 'normal', label: '🔵 Normal', cls: 'bg-info-soft text-info border-info' },
    { value: 'low', label: '⚪ Düşük', cls: 'bg-surface-3 text-ink-2 border-line-2' },
];

const SUBJECT_LIST = [
    'Türkçe', 'Matematik', 'Fizik', 'Kimya', 'Biyoloji',
    'Tarih', 'Coğrafya', 'Felsefe', 'Din Kültürü',
    'İngilizce', 'Edebiyat', 'Geometri', 'Mantık', 'Diğer'
];

const INVENTORY_LIST = [
    'Holland Mesleki İlgi Envanteri',
    'Sınav Kaygısı Ölçeği',
    'Öğrenme Stilleri Envanteri',
    'Öz Yeterlilik Ölçeği',
    'Akademik Motivasyon Ölçeği',
    'Kariyer Keşif Envanteri',
    'Dikkat ve Konsantrasyon Testi',
    'Duygusal Zeka Ölçeği',
];

const TaskAssignModal = ({ isOpen, onClose, students = [], onAssign, preSelectedStudentId = null }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('normal');
    const [category, setCategory] = useState('homework');
    const [selectedStudents, setSelectedStudents] = useState(
        preSelectedStudentId ? [String(preSelectedStudentId)] : []
    );

    // Category-specific fields
    const [subject, setSubject] = useState('');
    const [questionCount, setQuestionCount] = useState('');
    const [selectedInventory, setSelectedInventory] = useState('');
    const [testLink, setTestLink] = useState('');
    const [topicDetail, setTopicDetail] = useState('');

    if (!isOpen) return null;

    const toggleStudent = (id) => {
        const idStr = String(id);
        setSelectedStudents(prev =>
            prev.includes(idStr) ? prev.filter(s => s !== idStr) : [...prev, idStr]
        );
    };

    const selectAll = () => setSelectedStudents(students.map(s => String(s.id)));
    const deselectAll = () => setSelectedStudents([]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) { bildir('Görev başlığı gereklidir.'); return; }
        if (selectedStudents.length === 0) { bildir('En az bir öğrenci seçin.'); return; }

        // Build enriched description
        let fullDesc = description;
        if (subject) fullDesc = `[Ders: ${subject}] ${fullDesc}`.trim();
        if (topicDetail) fullDesc += `\nKonu: ${topicDetail}`;
        if (questionCount) fullDesc += `\nSoru Sayısı: ${questionCount}`;
        if (selectedInventory) fullDesc += `\nEnvanter: ${selectedInventory}`;
        if (testLink) fullDesc += `\nLink: ${testLink}`;

        onAssign({
            title: title.trim(),
            description: fullDesc.trim(),
            dueDate,
            priority,
            category,
            selectedStudents,
            // Extra metadata
            meta: { subject, questionCount, inventory: selectedInventory, testLink, topicDetail }
        });
        onClose();
    };

    const selectedCat = CATEGORY_OPTIONS.find(c => c.value === category);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-modal-base p-4">
            <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">

                {/* Header */}
                <div className="on-color sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 p-5 text-ink rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-surface/20 rounded-xl flex items-center justify-center">
                                <Target className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Görev & Aktivite Ata</h2>
                                <p className="text-info text-xs mt-0.5">Test, ödev, konu veya envanter atayın</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="hover:bg-surface/20 p-2 rounded-xl transition">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-5">

                    {/* Category Selector */}
                    <div>
                        <label className="block text-sm font-bold text-ink-2 mb-2">
                            Görev Türü <span className="text-danger">*</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {CATEGORY_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => { setCategory(opt.value); setSubject(''); setQuestionCount(''); setSelectedInventory(''); setTestLink(''); setTopicDetail(''); }}
                                    className={`p-2.5 rounded-xl border-2 text-left transition text-xs font-semibold ${category === opt.value ? opt.color + ' border-2 shadow-sm' : 'bg-surface-2 border-line text-ink-2 hover:bg-surface-3'}`}
                                >
                                    <span className="block text-base mb-0.5">{opt.label.split(' ')[0]}</span>
                                    <span className="block leading-tight">{opt.label.split(' ').slice(1).join(' ')}</span>
                                </button>
                            ))}
                        </div>
                        {selectedCat && (
                            <p className="text-xs text-ink-2 mt-1.5 flex items-center gap-1">
                                <HelpCircle size={11} /> {selectedCat.desc}
                            </p>
                        )}
                    </div>

                    {/* Category-specific sub-fields */}
                    {(category === 'topic_homework' || category === 'question_homework' || category === 'test') && (
                        <div className="p-3 bg-brand-soft rounded-xl border border-brand-line space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-brand mb-1">Ders / Alan</label>
                                <select
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    className="w-full p-2 border border-brand-line rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none bg-surface"
                                >
                                    <option value="">Ders seçin (isteğe bağlı)</option>
                                    {SUBJECT_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            {(category === 'topic_homework') && (
                                <div>
                                    <label className="block text-xs font-bold text-brand mb-1">Konu Detayı</label>
                                    <input
                                        type="text"
                                        value={topicDetail}
                                        onChange={e => setTopicDetail(e.target.value)}
                                        placeholder="Örn: Türev uygulamaları, 2. bölüm"
                                        className="w-full p-2 border border-brand-line rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                                    />
                                </div>
                            )}
                            {(category === 'question_homework') && (
                                <div>
                                    <label className="block text-xs font-bold text-brand mb-1">Soru Sayısı</label>
                                    <input
                                        type="number"
                                        value={questionCount}
                                        onChange={e => setQuestionCount(e.target.value)}
                                        placeholder="Örn: 20"
                                        min="1"
                                        className="w-full p-2 border border-brand-line rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                                    />
                                </div>
                            )}
                            {category === 'test' && (
                                <div>
                                    <label className="block text-xs font-bold text-brand mb-1">Test Bağlantısı (isteğe bağlı)</label>
                                    <input
                                        type="url"
                                        value={testLink}
                                        onChange={e => setTestLink(e.target.value)}
                                        placeholder="https://..."
                                        className="w-full p-2 border border-brand-line rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {category === 'inventory' && (
                        <div className="p-3 bg-warn-soft rounded-xl border border-warn">
                            <label className="block text-xs font-bold text-warn mb-1">Envanter / Ölçek Seçin</label>
                            <select
                                value={selectedInventory}
                                onChange={e => setSelectedInventory(e.target.value)}
                                className="w-full p-2 border border-warn rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none bg-surface"
                            >
                                <option value="">Envanter seçin...</option>
                                {INVENTORY_LIST.map(inv => <option key={inv} value={inv}>{inv}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-bold text-ink-2 mb-1">
                            Görev Başlığı <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder={
                                category === 'test' ? 'Örn: Matematik TYT Denemesi - Tür 5' :
                                    category === 'inventory' ? 'Örn: Holland Mesleki İlgi Testi' :
                                        category === 'topic_homework' ? 'Örn: Türev Konusu Çalışma Ödevi' :
                                            category === 'question_homework' ? 'Örn: Geometri - 20 Soru Çöz' :
                                                'Görev başlığı yazın...'
                            }
                            required
                            className="w-full p-3 border border-line-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold text-ink-2 mb-1">Açıklama / Talimat</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Öğrenciye iletilecek ek bilgiler..."
                            rows={3}
                            className="w-full p-3 border border-line-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                        />
                    </div>

                    {/* Due Date + Priority */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-bold text-ink-2 mb-1">Son Teslim Tarihi</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                className="w-full p-3 border border-line-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-ink-2 mb-1">Öncelik</label>
                            <div className="grid grid-cols-2 gap-1">
                                {PRIORITY_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setPriority(opt.value)}
                                        className={`py-2 px-2 rounded-lg border text-xs font-bold transition ${priority === opt.value ? opt.cls : 'bg-surface-2 border-line text-ink-2'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Student Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-bold text-ink-2 flex items-center gap-2">
                                <Users size={16} className="text-info" />
                                Öğrenci Seç ({selectedStudents.length} seçili)
                            </label>
                            <div className="flex gap-2">
                                <button type="button" onClick={selectAll} className="text-xs text-info hover:underline font-semibold">Tümünü Seç</button>
                                <span className="text-ink-3">|</span>
                                <button type="button" onClick={deselectAll} className="text-xs text-ink-2 hover:underline">Temizle</button>
                            </div>
                        </div>
                        <div className="border border-line rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                            {students.length === 0 ? (
                                <p className="text-sm text-ink-3 text-center py-8">Öğrenci listesi boş.</p>
                            ) : (
                                students.map(student => {
                                    const idStr = String(student.id);
                                    const isSelected = selectedStudents.includes(idStr);
                                    return (
                                        <button
                                            key={student.id}
                                            type="button"
                                            onClick={() => toggleStudent(student.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 transition border-b border-gray-50 last:border-0 text-left ${isSelected ? 'bg-info-soft' : 'hover:bg-surface-2'}`}
                                        >
                                            <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition ${isSelected ? 'bg-info border-blue-600' : 'border-line-2'}`}>
                                                {isSelected && <svg viewBox="0 0 12 10" fill="none" className="w-3 h-3"><path d="M1 5l3 3 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>}
                                            </div>
                                            <div className="on-color w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-ink font-bold text-xs flex-shrink-0">
                                                {student.name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-ink text-sm truncate">{student.name}</p>
                                                <p className="text-xs text-ink-3 truncate">
                                                    {student.grade ? `${student.grade}${student.section ? `/${student.section}` : ''}` : 'Sınıf belirtilmedi'}
                                                    {student.schoolNumber ? ` • No: ${student.schoolNumber}` : ''}
                                                </p>
                                            </div>
                                            {isSelected && (
                                                <span className="text-xs text-info font-bold flex-shrink-0">✓</span>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="pencere-alt-cubuk bg-surface flex gap-3 pt-2 border-t border-line">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-5 py-3 border border-line-2 rounded-xl hover:bg-surface-2 font-semibold text-ink-2 transition text-sm"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={selectedStudents.length === 0 || !title.trim()}
                            className="on-color flex-1 px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-ink rounded-xl hover:from-blue-700 hover:to-purple-700 font-bold transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
                        >
                            <Plus className="w-4 h-4" />
                            {selectedStudents.length > 0 ? `${selectedStudents.length} Öğrenciye Ata` : 'Görevi Ata'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskAssignModal;
