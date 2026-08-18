/**
 * 📝 NOT DEFTERİ
 * Renkli, etiketli not ekleme ve filtreleme modülü
 */
import React, { useState, useEffect } from 'react';
import { Plus, X, Search, Tag, StickyNote, Pin, Trash2, Edit3, Check, BookOpen } from 'lucide-react';
import { listeOku } from '../../services/veriDeposu';

const NOTE_COLORS = [
    { bg: 'bg-warn-soft', border: 'border-warn', dot: 'bg-yellow-400', label: 'Sarı' },
    { bg: 'bg-info-soft', border: 'border-info', dot: 'bg-blue-400', label: 'Mavi' },
    { bg: 'bg-ok-soft', border: 'border-ok', dot: 'bg-green-400', label: 'Yeşil' },
    { bg: 'bg-[color-mix(in_srgb,var(--c5)_14%,var(--surface))]', border: 'border-[color-mix(in_srgb,var(--c5)_35%,transparent)]', dot: 'bg-pink-400', label: 'Pembe' },
    { bg: 'bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))]', border: 'border-[color-mix(in_srgb,var(--c4)_35%,transparent)]', dot: 'bg-purple-400', label: 'Mor' },
    { bg: 'bg-warn-soft', border: 'border-warn', dot: 'bg-orange-400', label: 'Turuncu' },
];

const TAGS = ['Matematik', 'Türkçe', 'Fen', 'Sosyal', 'Fizik', 'Kimya', 'Biyoloji', 'Genel', 'Önemli'];

const NoteBook = ({ userId }) => {
    const LS_KEY = `notebook_${userId || 'student'}`;
    const [notes, setNotes] = useState(() => {
        try { return listeOku(LS_KEY); }
        catch { return []; }
    });
    const [search, setSearch] = useState('');
    const [selectedTag, setSelectedTag] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ title: '', content: '', tag: 'Genel', colorIdx: 0, pinned: false });

    const saveNotes = (updated) => {
        setNotes(updated);
        localStorage.setItem(LS_KEY, JSON.stringify(updated));
    };

    const handleSave = () => {
        if (!form.content.trim()) return;
        if (editingId) {
            saveNotes(notes.map(n => n.id === editingId ? { ...n, ...form, updatedAt: new Date().toISOString() } : n));
            setEditingId(null);
        } else {
            const newNote = { id: Date.now(), ...form, createdAt: new Date().toISOString() };
            saveNotes([newNote, ...notes]);
        }
        setForm({ title: '', content: '', tag: 'Genel', colorIdx: 0, pinned: false });
        setShowForm(false);
    };

    const handleEdit = (note) => {
        setForm({ title: note.title, content: note.content, tag: note.tag, colorIdx: note.colorIdx || 0, pinned: note.pinned || false });
        setEditingId(note.id);
        setShowForm(true);
    };

    const handleDelete = (id) => {
        saveNotes(notes.filter(n => n.id !== id));
    };

    const handleTogglePin = (id) => {
        saveNotes(notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
    };

    const filtered = notes
        .filter(n => selectedTag === 'all' || n.tag === selectedTag)
        .filter(n => !search || n.title?.toLowerCase().includes(search.toLowerCase()) || n.content?.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

    const allTags = ['all', ...TAGS.filter(t => notes.some(n => n.tag === t))];

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-xl font-black text-ink flex items-center gap-2">
                    <StickyNote size={22} className="text-warn" /> Not Defterim
                </h2>
                <button
                    onClick={() => { setShowForm(true); setEditingId(null); setForm({ title: '', content: '', tag: 'Genel', colorIdx: 0, pinned: false }); }}
                    className="on-color flex items-center gap-2 text-sm bg-gradient-to-r from-yellow-500 to-orange-500 text-ink px-4 py-2 rounded-xl font-bold hover:opacity-90 transition shadow-sm"
                >
                    <Plus size={16} /> Yeni Not
                </button>
            </div>

            {/* Arama + Etiket Filtresi */}
            <div className="flex flex-wrap gap-2 items-center">
                <div className="relative flex-1 min-w-48">
                    <Search size={14} className="absolute left-3 top-2.5 text-ink-3" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Not ara..."
                        className="pl-9 pr-3 py-2 w-full text-sm border border-line rounded-xl outline-none focus:ring-2 focus:ring-yellow-400 bg-surface" />
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 flex-wrap">
                    {allTags.map(tag => (
                        <button key={tag} onClick={() => setSelectedTag(tag)}
                            className={`text-xs px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition ${selectedTag === tag ? 'bg-surface-inv text-ink' : 'bg-surface border border-line text-ink-2 hover:border-line-2'}`}
                        >
                            {tag === 'all' ? 'Tümü' : tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Not Ekleme / Düzenleme Formu */}
            {showForm && (
                <div className="bg-surface rounded-2xl shadow-lg border-2 border-warn p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-black text-ink">{editingId ? 'Notu Düzenle' : 'Yeni Not'}</h3>
                        <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1.5 hover:bg-surface-3 rounded-xl text-ink-3">
                            <X size={16} />
                        </button>
                    </div>
                    <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                        placeholder="Başlık (isteğe bağlı)" className="w-full text-sm border border-line rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-yellow-400" />
                    <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                        placeholder="Notunuzu buraya yazın..." rows={4}
                        className="w-full text-sm border border-line rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-yellow-400 resize-none" />
                    <div className="flex flex-wrap gap-3 items-center">
                        {/* Renk seçici */}
                        <div className="flex gap-1.5">
                            {NOTE_COLORS.map((c, idx) => (
                                <button key={idx} onClick={() => setForm(p => ({ ...p, colorIdx: idx }))}
                                    className={`w-6 h-6 rounded-full ${c.dot} transition-all ${form.colorIdx === idx ? 'ring-2 ring-offset-1 ring-gray-600 scale-125' : 'hover:scale-110'}`} />
                            ))}
                        </div>
                        <select value={form.tag} onChange={e => setForm(p => ({ ...p, tag: e.target.value }))}
                            className="text-xs border border-line rounded-xl px-3 py-2 bg-surface outline-none flex-1">
                            {TAGS.map(t => <option key={t}>{t}</option>)}
                        </select>
                        <button onClick={() => setForm(p => ({ ...p, pinned: !p.pinned }))}
                            className={`flex items-center gap-1 text-xs px-3 py-2 rounded-xl border font-bold transition ${form.pinned ? 'bg-brand text-ink border-indigo-600' : 'bg-surface text-ink-2 border-line hover:bg-surface-2'}`}>
                            <Pin size={12} /> Sabitle
                        </button>
                    </div>
                    <div className="pencere-alt-cubuk bg-surface flex gap-2 pt-1">
                        <button onClick={() => { setShowForm(false); setEditingId(null); }} className="flex-1 py-2 border border-line rounded-xl text-sm text-ink-2 hover:bg-surface-2">İptal</button>
                        <button onClick={handleSave} className="flex-1 py-2 bg-warn text-ink rounded-xl text-sm font-black hover:bg-warn transition flex items-center justify-center gap-2">
                            <Check size={14} /> Kaydet
                        </button>
                    </div>
                </div>
            )}

            {/* Notlar Grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 bg-surface rounded-2xl border border-dashed border-line">
                    <BookOpen size={48} className="text-ink-3 mx-auto mb-3" />
                    <p className="font-bold text-ink-3">{search || selectedTag !== 'all' ? 'Eşleşen not bulunamadı' : 'Henüz not eklenmemiş'}</p>
                    <p className="text-sm text-ink-3 mt-1">Yukarıdaki "Yeni Not" butonuyla başla!</p>
                </div>
            ) : (
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                    {filtered.map(note => {
                        const clr = NOTE_COLORS[note.colorIdx || 0];
                        return (
                            <div key={note.id} className={`break-inside-avoid rounded-2xl border-2 p-4 ${clr.bg} ${clr.border} group relative transition-all hover:shadow-md`}>
                                {note.pinned && <Pin size={12} className="absolute top-3 right-3 text-ink-3 rotate-45" />}
                                {note.title && <p className="font-black text-ink text-sm mb-2 pr-5">{note.title}</p>}
                                <p className="text-sm text-ink-2 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/5">
                                    <span className="text-[10px] text-ink-3 font-medium flex items-center gap-1">
                                        <Tag size={9} /> {note.tag}
                                    </span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                        <button onClick={() => handleTogglePin(note.id)} className="p-1.5 hover:bg-black/5 rounded-lg text-ink-2 transition">
                                            <Pin size={12} />
                                        </button>
                                        <button onClick={() => handleEdit(note)} className="p-1.5 hover:bg-black/5 rounded-lg text-ink-2 transition">
                                            <Edit3 size={12} />
                                        </button>
                                        <button onClick={() => handleDelete(note.id)} className="p-1.5 hover:bg-danger-soft rounded-lg text-danger transition">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[9px] text-ink-3 mt-1">{new Date(note.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default NoteBook;
