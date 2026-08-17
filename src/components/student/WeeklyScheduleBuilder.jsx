/**
 * 📅 GELİŞMİŞ HAFTALIK DERS PROGRAMI OLUŞTURUCU
 * 
 * Özellikler:
 * • Tek veya toplu etüt seçimi
 * • Sınav türü seçimi (TYT / AYT / YDT / LGS)
 * • Manuel ders/konu/özel istek yazma
 * • Seçilen tüm hafta ve aylara otomatik dağıtım
 * • Haftalık görünüm & istatistikler
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
    Calendar, Save, CheckCircle, Zap, Clock, Trash2,
    ChevronLeft, ChevronRight, Sun, Moon, BookOpen,
    Layers, Plus, RefreshCw, Target, Shuffle, X, Check,
    ChevronDown, ChevronUp, Download
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { bildir, onayla } from '../../services/uiGeriBildirim';

const SUBJECTS = [
    { id: 'turkce', label: 'Türkçe', color: 'var(--c1)', bg: 'color-mix(in srgb, #eef2ff 55%, var(--surface))', emoji: '📖', exam: ['TYT', 'LGS'] },
    { id: 'matematik', label: 'Matematik', color: 'var(--c4)', bg: 'color-mix(in srgb, #f5f3ff 55%, var(--surface))', emoji: '🔢', exam: ['TYT', 'AYT', 'LGS'] },
    { id: 'fizik', label: 'Fizik', color: 'var(--info)', bg: 'color-mix(in srgb, #ecfeff 55%, var(--surface))', emoji: '⚡', exam: ['TYT', 'AYT'] },
    { id: 'kimya', label: 'Kimya', color: 'var(--ok)', bg: 'color-mix(in srgb, #ecfdf5 55%, var(--surface))', emoji: '🧪', exam: ['TYT', 'AYT'] },
    { id: 'biyoloji', label: 'Biyoloji', color: 'var(--c2)', bg: 'color-mix(in srgb, #f0fdfa 55%, var(--surface))', emoji: '🧬', exam: ['TYT', 'AYT'] },
    { id: 'tarih', label: 'Tarih', color: 'var(--warn)', bg: 'color-mix(in srgb, #fffbeb 55%, var(--surface))', emoji: '🏛️', exam: ['TYT', 'AYT', 'LGS'] },
    { id: 'cografya', label: 'Coğrafya', color: 'var(--c2)', bg: 'color-mix(in srgb, #f7fee7 55%, var(--surface))', emoji: '🌍', exam: ['TYT', 'AYT', 'LGS'] },
    { id: 'edebiyat', label: 'Edebiyat', color: 'var(--c5)', bg: 'color-mix(in srgb, #fdf2f8 55%, var(--surface))', emoji: '📝', exam: ['TYT', 'AYT'] },
    { id: 'ingilizce', label: 'İngilizce', color: 'var(--info)', bg: 'color-mix(in srgb, #eff6ff 55%, var(--surface))', emoji: '🇬🇧', exam: ['TYT', 'YDT'] },
    { id: 'matematik_ayt', label: 'Matematik (AYT)', color: 'var(--c4)', bg: 'color-mix(in srgb, #f5f3ff 55%, var(--surface))', emoji: '📐', exam: ['AYT'] },
    { id: 'fen', label: 'Fen Bilimleri', color: 'var(--info)', bg: 'color-mix(in srgb, #ecfeff 55%, var(--surface))', emoji: '🔬', exam: ['LGS'] },
    { id: 'inkilap', label: 'İnkılap Tarihi', color: 'var(--warn)', bg: 'color-mix(in srgb, #fffbeb 55%, var(--surface))', emoji: '🏅', exam: ['LGS'] },
    { id: 'din', label: 'Din Kültürü', color: 'var(--ok)', bg: 'color-mix(in srgb, #ecfdf5 55%, var(--surface))', emoji: '🕌', exam: ['LGS', 'TYT'] },
    { id: 'deneme', label: 'Deneme', color: 'var(--danger)', bg: 'color-mix(in srgb, #fef2f2 55%, var(--surface))', emoji: '📋', exam: ['TYT', 'AYT', 'YDT', 'LGS'] },
    { id: 'tekrar', label: 'Tekrar', color: 'var(--warn)', bg: 'color-mix(in srgb, #fff7ed 55%, var(--surface))', emoji: '🔁', exam: ['TYT', 'AYT', 'YDT', 'LGS'] },
    { id: 'ozel', label: 'Özel İstek', color: 'var(--c4)', bg: 'color-mix(in srgb, #faf5ff 55%, var(--surface))', emoji: '✨', exam: ['TYT', 'AYT', 'YDT', 'LGS'] },
    { id: 'dinlenme', label: 'Mola', color: 'var(--ink-3)', bg: 'color-mix(in srgb, #f8fafc 55%, var(--surface))', emoji: '☕', exam: ['TYT', 'AYT', 'YDT', 'LGS'] },
];

const EXAM_TYPES = ['TYT', 'AYT', 'YDT', 'LGS', 'Hepsi'];
// SLOTS will be generated dynamically based on etutCount
const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

// ── Hücre Bileşeni ─────────────────────────────────────────────────────────────
const ScheduleCell = ({ dayIdx, slotId, assignment, onAssign, onClear, selectedSubject, selectionMode, selectedCells, onToggleCell }) => {
    const subject = assignment ? SUBJECTS.find(s => s.id === assignment.subjectId) : null;
    const cellKey = `${dayIdx}_${slotId}`;
    const isSelected = selectedCells?.has(cellKey);

    const handleClick = () => {
        if (selectionMode) {
            onToggleCell(cellKey);
            return;
        }
        if (assignment) onClear(dayIdx, slotId);
        else if (selectedSubject) onAssign(dayIdx, slotId, selectedSubject);
    };

    return (
        <div
            onClick={handleClick}
            className={`min-h-[56px] py-1 rounded-xl flex flex-col items-center justify-center text-xs font-bold cursor-pointer transition-all border select-none relative
                ${isSelected ? 'ring-2 ring-brand ring-offset-1' : ''}
                ${subject
                    ? 'shadow-sm hover:opacity-80 active:scale-95'
                    : selectedSubject || selectionMode
                        ? 'border-dashed border-line-2 hover:border-indigo-400 hover:bg-brand-soft'
                        : 'border-line bg-surface-2/50 cursor-default'}`}
            style={subject ? { backgroundColor: subject.bg, borderColor: subject.color + '40' } : {}}
        >
            {isSelected && (
                <div className="absolute inset-0 bg-brand/10 rounded-xl flex items-center justify-center">
                    <Check size={14} className="text-brand" />
                </div>
            )}
            {subject ? (
                <>
                    {assignment.exam && (
                        <span className="absolute -top-1 -right-1 bg-surface/95 text-brand text-[8px] font-black px-1.5 py-0.5 rounded-bl-lg shadow-sm border border-brand-line z-10">
                            {assignment.exam}
                        </span>
                    )}
                    <div className="flex flex-col items-center gap-0.5 mt-1">
                        <span className="text-base leading-none">{subject.emoji}</span>
                        <span style={{ color: subject.color }} className="text-[9px] font-black leading-tight text-center px-1 break-words w-full">
                            {assignment.note || subject.label}
                        </span>
                    </div>
                </>
            ) : (selectionMode && !assignment)
                ? <div className="w-4 h-4 border-2 border-dashed border-line-2 rounded" />
                : selectedSubject
                    ? <span className="text-ink-3 text-lg">+</span>
                    : null}
        </div>
    );
};

// ── Ana Bileşen ────────────────────────────────────────────────────────────────
const WeeklyScheduleBuilder = ({ user }) => {
    const LS_KEY = `weekly_schedule_${user?.id || 'student'}`;
    const [schedule, setSchedule] = useState(() => {
        try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
    });

    // Seçili ders
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedExamType, setSelectedExamType] = useState('TYT');
    const [customNote, setCustomNote] = useState(''); // Özel istek notu
    const [saved, setSaved] = useState(false);
    const [weekOffset, setWeekOffset] = useState(0);
    const [activeMonth, setActiveMonth] = useState(1);
    const [totalMonths, setTotalMonths] = useState(1);
    const [etutCount, setEtutCount] = useState(7); // Default 7 etüts

    const scheduleRef = React.useRef(null);

    const dynamicSlots = useMemo(() => {
        return Array.from({ length: etutCount }, (_, i) => ({
            id: `etut_${i + 1}`,
            label: `${i + 1}. Etüt`,
            icon: i < Math.ceil(etutCount / 2) ? Sun : Moon
        }));
    }, [etutCount]);

    // Toplu seçim modu
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedCells, setSelectedCells] = useState(new Set());
    const [showDistributePanel, setShowDistributePanel] = useState(false);

    // Dağıtım kuyruğu
    const [distQueue, setDistQueue] = useState([]);

    // Filtrelenmiş dersler
    const filteredSubjects = useMemo(() => {
        if (selectedExamType === 'Hepsi') return SUBJECTS;
        return SUBJECTS.filter(s => s.exam.includes(selectedExamType));
    }, [selectedExamType]);

    const getKey = (d, s) => `${d}_${s}`;
    const getAssignment = (d, s) => schedule[getKey(d, s)] || null;

    const assign = useCallback((d, s, subjectId) => {
        const examLabel = selectedExamType === 'Hepsi' || !selectedExamType ? '' : selectedExamType;
        setSchedule(prev => ({
            ...prev,
            [getKey(d, s)]: { subjectId, exam: examLabel, note: customNote || '' }
        }));
    }, [selectedExamType, customNote]);

    const clear = useCallback((d, s) => {
        setSchedule(prev => { const n = { ...prev }; delete n[getKey(d, s)]; return n; });
    }, []);

    const handleSave = () => {
        localStorage.setItem(LS_KEY, JSON.stringify(schedule));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const clearAll = async () => {
        if (await onayla({ mesaj: 'Tüm programı silmek istediğinden emin misin?', tehlikeli: true })) {
            setSchedule({});
            setSelectedCells(new Set());
        }
    };

    // Toplu seçim: hücre toggle
    const toggleCell = (cellKey) => {
        setSelectedCells(prev => {
            const next = new Set(prev);
            if (next.has(cellKey)) next.delete(cellKey);
            else next.add(cellKey);
            return next;
        });
    };

    // Seçili hücrelere ders ata
    const assignToSelected = (subjectId) => {
        if (selectedCells.size === 0) return;
        const updates = {};
        selectedCells.forEach(cellKey => {
            const [dStr, slotId] = cellKey.split('_');
            updates[cellKey] = { subjectId, exam: selectedExamType === 'Hepsi' || !selectedExamType ? '' : selectedExamType, note: customNote || '' };
        });
        setSchedule(prev => ({ ...prev, ...updates }));
        setSelectedCells(new Set());
        setSelectionMode(false);
    };

    // Dağıtım kuyruğuna ekle
    const addToQueue = () => {
        if (!selectedSubject) return;
        const subject = SUBJECTS.find(s => s.id === selectedSubject);
        setDistQueue(prev => [...prev, {
            subjectId: selectedSubject,
            label: subject?.label,
            emoji: subject?.emoji,
            exam: selectedExamType === 'Hepsi' ? '' : selectedExamType,
            note: customNote || '',
            weight: 1,
        }]);
        setCustomNote('');
    };

    // Dağıtım kuyruğundan kaldır
    const removeFromQueue = (idx) => {
        setDistQueue(prev => prev.filter((_, i) => i !== idx));
    };

    // Seçili hafta/ay aralığına otomatik dağıt
    const handleAutoDistribute = () => {
        if (distQueue.length === 0) {
            bildir('Önce dağıtım listesine ders ekleyin!');
            return;
        }

        // Hedef aylar: 1..totalMonths, her ay 4 hafta
        const allSlots = [];
        for (let m = 1; m <= totalMonths; m++) {
            for (let w = 1; w <= 4; w++) {
                for (let d = 0; d < DAYS.length; d++) {
                    for (let s = 0; s < dynamicSlots.length; s++) {
                        const key = `${d}_${dynamicSlots[s].id}`;
                        if (!schedule[key]) {
                            allSlots.push({ key, m, w, d, s });
                        }
                    }
                }
            }
        }

        if (allSlots.length === 0) {
            bildir('Tüm etütler dolu! Önce programı temizleyin.');
            return;
        }

        const totalWeight = distQueue.reduce((sum, item) => sum + (item.weight || 1), 0);
        let ptr = 0;
        const updates = {};
        const weightedQueue = distQueue.flatMap(item =>
            Array(Math.max(1, item.weight || 1)).fill(item)
        );

        allSlots.forEach((slot, idx) => {
            const item = weightedQueue[idx % weightedQueue.length];
            // 🆕 OTOMATİK DAĞITIM DÜZELTME: Sınav türü yoksa seçili olanı kullan
            const finalExam = item.exam || (selectedExamType === 'Hepsi' ? '' : selectedExamType);
            updates[slot.key] = { subjectId: item.subjectId, exam: finalExam, note: item.note };
        });

        setSchedule(prev => ({ ...prev, ...updates }));
        setDistQueue([]);
        setShowDistributePanel(false);
        bildir(`✅ ${Object.keys(updates).length} etüt dolduruldu! Kaydetmeyi unutmayın.`, 'basari');
    };

    // İstatistikler
    const stats = useMemo(() => {
        return SUBJECTS.map(s => ({
            ...s,
            count: Object.values(schedule).filter(v => v?.subjectId === s.id).length
        })).filter(s => s.count > 0).sort((a, b) => b.count - a.count);
    }, [schedule]);

    const totalSlots = Object.keys(schedule).length;

    // Hafta tarihleri
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (now.getDay() || 7) + 1 + weekOffset * 7);
    const weekDates = DAYS.map((_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    });

    const handleDownloadPDF = () => {
        const element = scheduleRef.current;
        if (!element) return;

        const originalStyle = element.style.cssText;
        const scrollContainer = element.querySelector('.overflow-x-auto');
        const originalScrollStyle = scrollContainer ? scrollContainer.style.cssText : '';

        // PDF Hazırlığı: Taşmaları engelle ve genişliği sabitle
        element.style.width = '1200px';
        element.style.maxWidth = 'none';
        if (scrollContainer) {
            scrollContainer.style.overflow = 'visible';
            scrollContainer.style.width = '100%';
        }

        // PDF'de görünmesini istemediklerimizi gizle (Tarih bilgisi vb.)
        const hideElements = element.querySelectorAll('.pdf-hide');
        hideElements.forEach(el => el.style.display = 'none');

        const onlyElements = element.querySelectorAll('.pdf-only\\:block');
        onlyElements.forEach(el => el.style.display = 'block');

        const opt = {
            margin: [2, 2, 2, 2],
            filename: `Haftalik_Program_${user?.name || 'Ogrenci'}.pdf`,
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: 1200,
                windowWidth: 1250,
                logging: false
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape', compress: true }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            // Eski haline geri dön
            element.style.cssText = originalStyle;
            if (scrollContainer) scrollContainer.style.cssText = originalScrollStyle;
            hideElements.forEach(el => el.style.display = '');
            onlyElements.forEach(el => el.style.display = '');
        });
    };

    return (
        <div className="space-y-5 animate-fade-in">
            {/* ── Başlık & Eylemler ───────────────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-black text-ink flex items-center gap-2">
                        <Calendar className="text-brand" size={26} />Haftalık Programım
                    </h1>
                    <p className="text-sm text-ink-2 mt-0.5">
                        Ders seç → hücreye tıkla. Toplu seçim için "Seçim Modu" kullan.
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => { setSelectionMode(!selectionMode); setSelectedCells(new Set()); }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border ${selectionMode ? 'bg-brand text-white border-indigo-600' : 'border-line text-ink-2 hover:bg-brand-soft'}`}
                    >
                        {selectionMode ? <><X size={13} />Seçim İptal</> : <><Layers size={13} />Toplu Seçim</>}
                    </button>
                    <button
                        onClick={() => setShowDistributePanel(!showDistributePanel)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border ${showDistributePanel ? 'bg-c4 text-white border-purple-600' : 'border-line text-ink-2 hover:bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))]'}`}
                    >
                        <Shuffle size={13} />Otomatik Dağıt
                    </button>
                    <button onClick={clearAll} className="flex items-center gap-1.5 px-3 py-2 border border-line text-ink-2 rounded-xl text-xs font-bold hover:bg-danger-soft hover:text-danger transition">
                        <Trash2 size={13} />Temizle
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border border-line text-ink-2 hover:bg-surface-3 hover:text-ink`}
                    >
                        <Download size={13} />PDF İndir
                    </button>
                    <button onClick={handleSave} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition shadow-md ${saved ? 'bg-ok text-white' : 'bg-brand text-white hover:bg-brand-hover'}`}>
                        {saved ? <><CheckCircle size={13} />Kaydedildi!</> : <><Save size={13} />Kaydet</>}
                    </button>
                </div>
            </div>

            {/* ── Ayarlar Bölümü ────────────────────────────────────── */}
            <div className="bg-surface rounded-2xl border border-line shadow-sm p-4 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <Target size={16} className="text-brand" />
                    <span className="text-sm font-bold text-ink-2">Sınav Türü</span>
                </div>
                <div className="flex gap-2 flex-wrap flex-1">
                    {EXAM_TYPES.map(et => (
                        <button
                            key={et}
                            onClick={() => setSelectedExamType(et)}
                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${selectedExamType === et
                                ? 'bg-gradient-to-r from-brand to-purple-600 text-white shadow-md scale-105'
                                : 'bg-surface-3 text-ink-2 hover:bg-brand-soft hover:text-brand border border-line'}`}
                        >
                            {et}
                        </button>
                    ))}
                    <div className="flex items-center gap-4 ml-auto flex-wrap">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-ink-3 font-bold uppercase tracking-wider">Etüt Sayısı:</span>
                            <select
                                value={etutCount}
                                onChange={e => setEtutCount(Number(e.target.value))}
                                className="border border-line rounded-xl px-3 py-1.5 text-xs font-bold text-brand bg-brand-soft outline-none focus:ring-2 focus:ring-indigo-300 transition"
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                                    <option key={num} value={num}>{num} Etüt</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-ink-3 font-bold uppercase tracking-wider">Süre:</span>
                            <select
                                value={totalMonths}
                                onChange={e => setTotalMonths(Number(e.target.value))}
                                className="border border-line rounded-xl px-3 py-1.5 text-xs font-bold text-ink-2 outline-none focus:ring-2 focus:ring-indigo-300"
                            >
                                {[1, 2, 3, 4, 6, 9, 12].map(m => (
                                    <option key={m} value={m}>{m} Ay</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Ders Seçici ─────────────────────────────────────────── */}
            <div className="bg-surface rounded-2xl border border-line shadow-sm p-4">
                <p className="text-xs font-bold text-ink-3 uppercase tracking-wide mb-3">Ders Seç</p>
                <div className="flex flex-wrap gap-2">
                    {filteredSubjects.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setSelectedSubject(selectedSubject === s.id ? null : s.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition border hover:scale-105"
                            style={selectedSubject === s.id
                                ? { backgroundColor: s.color, color: 'white', borderColor: s.color }
                                : { backgroundColor: s.bg, color: s.color, borderColor: s.color + '30' }}
                        >
                            {s.emoji} {s.label}
                        </button>
                    ))}
                </div>

                {/* Özel İstek / Not */}
                <div className="mt-3 flex gap-2 items-center">
                    <input
                        type="text"
                        value={customNote}
                        onChange={e => setCustomNote(e.target.value)}
                        placeholder="Konu / Özel istek yaz (opsiyonel)… Örn: Türev, Paragraf, Gramer"
                        className="flex-1 border border-line rounded-xl px-3 py-2 text-xs text-ink-2 outline-none focus:ring-2 focus:ring-indigo-300 bg-surface-2"
                    />
                    {distQueue.length > 0 || selectedSubject ? (
                        <button
                            onClick={addToQueue}
                            disabled={!selectedSubject}
                            className="flex items-center gap-1 px-3 py-2 bg-c4 text-white rounded-xl text-xs font-bold hover:bg-c4 transition disabled:opacity-40"
                        >
                            <Plus size={12} />Listeye Ekle
                        </button>
                    ) : null}
                </div>

                {selectedSubject && (
                    <p className="mt-2 text-xs text-brand font-bold flex items-center gap-1 animate-pulse">
                        <Zap size={12} />
                        {SUBJECTS.find(s => s.id === selectedSubject)?.emoji}{' '}
                        {SUBJECTS.find(s => s.id === selectedSubject)?.label} seçildi
                        {' '}— {selectionMode ? 'hücreleri seç sonra "Seçilenlere Ata"ya bas' : 'hücrelere tıkla'}
                    </p>
                )}
            </div>

            {/* ── Toplu Seçim Bilgisi ─────────────────────────────────── */}
            {selectionMode && (
                <div className="bg-brand-soft border border-brand-line rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-brand text-sm font-bold">
                        <Layers size={16} />
                        {selectedCells.size} hücre seçildi
                    </div>
                    <div className="pencere-alt-cubuk bg-surface flex gap-2">
                        {filteredSubjects.slice(0, 6).map(s => (
                            <button
                                key={s.id}
                                onClick={() => assignToSelected(s.id)}
                                disabled={selectedCells.size === 0}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black border hover:scale-105 transition disabled:opacity-40"
                                style={{ backgroundColor: s.bg, color: s.color, borderColor: s.color + '40' }}
                            >
                                {s.emoji} {s.label.substring(0, 4)}
                            </button>
                        ))}
                        <button
                            onClick={() => { setSelectedCells(new Set()); setSelectionMode(false); }}
                            className="px-2.5 py-1.5 bg-surface border border-line text-ink-2 text-xs font-bold rounded-xl hover:bg-danger-soft hover:text-danger transition"
                        >
                            İptal
                        </button>
                    </div>
                </div>
            )}

            {/* ── Otomatik Dağıtım Paneli ─────────────────────────────── */}
            {showDistributePanel && (
                <div className="bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] border border-[color-mix(in_srgb,var(--c4)_35%,transparent)] rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Shuffle size={18} className="text-c4" />
                            <h3 className="font-black text-c4">Otomatik Dağıtım</h3>
                            <span className="text-xs text-c4">Seçilen {totalMonths} ay × 4 hafta'ya dağıt</span>
                        </div>
                        <button onClick={() => setShowDistributePanel(false)}>
                            <X size={16} className="text-c4 hover:text-c4" />
                        </button>
                    </div>

                    {/* Kuyruk */}
                    <div className="space-y-2 max-h-52 overflow-y-auto">
                        {distQueue.length === 0 ? (
                            <p className="text-sm text-c4 italic text-center py-4">
                                Yukarıdan ders seçip "Listeye Ekle"ye tıkla
                            </p>
                        ) : distQueue.map((item, idx) => {
                            const subj = SUBJECTS.find(s => s.id === item.subjectId);
                            return (
                                <div key={idx} className="bg-surface border border-[color-mix(in_srgb,var(--c4)_35%,transparent)] rounded-xl p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span>{subj?.emoji}</span>
                                        <div>
                                            <p className="text-xs font-bold text-ink-2">{subj?.label}</p>
                                            {item.note && <p className="text-[10px] text-ink-3">{item.note}</p>}
                                            {item.exam && <span className="text-[9px] text-c4 font-bold">{item.exam}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => setDistQueue(prev => prev.map((it, i) => i === idx ? { ...it, weight: Math.max(1, it.weight - 1) } : it))} className="w-5 h-5 flex items-center justify-center bg-surface-3 rounded text-xs hover:bg-surface-3">−</button>
                                            <span className="text-xs font-bold text-c4 w-4 text-center">{item.weight}</span>
                                            <button onClick={() => setDistQueue(prev => prev.map((it, i) => i === idx ? { ...it, weight: Math.min(10, it.weight + 1) } : it))} className="w-5 h-5 flex items-center justify-center bg-surface-3 rounded text-xs hover:bg-surface-3">+</button>
                                        </div>
                                        <button onClick={() => removeFromQueue(idx)} className="text-ink-3 hover:text-danger"><X size={12} /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {distQueue.length > 0 && (
                        <button
                            onClick={handleAutoDistribute}
                            className="on-color w-full py-3 bg-gradient-to-r from-purple-600 to-brand text-white font-black rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition"
                        >
                            <RefreshCw size={16} />
                            {totalMonths} Aya Otomatik Dağıt ({distQueue.length} ders)
                        </button>
                    )}
                </div>
            )}

            {/* ── İstatistikler ───────────────────────────────────────── */}
            {totalSlots > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 bg-brand-soft border border-brand-line rounded-xl px-4 py-2">
                        <Clock size={13} className="text-brand" />
                        <span className="text-sm font-black text-brand">~{totalSlots * 2} saat/hafta</span>
                    </div>
                    {stats.slice(0, 4).map(s => (
                        <div key={s.id} className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold border"
                            style={{ backgroundColor: s.bg, borderColor: s.color + '30', color: s.color }}>
                            {s.emoji} {s.label}: {s.count * 2}s
                        </div>
                    ))}
                </div>
            )}

            {/* ── Haftalık Tablo ──────────────────────────────────────── */}
            <div ref={scheduleRef} className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden pdf-container pb-4">
                {/* PDF'de görünecek başlık */}
                <div className="hidden pdf-only:block p-6 text-center border-b border-line text-2xl font-black text-brand mb-4 bg-surface-2 uppercase tracking-widest">
                    {user?.name || 'Öğrenci'} - Haftalık Çalışma Programı
                </div>
                <div className="flex items-center justify-between p-4 border-b border-line pdf-hide">
                    <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 hover:bg-surface-3 rounded-xl transition">
                        <ChevronLeft size={18} className="text-ink-2" />
                    </button>
                    <span className="font-bold text-ink-2 text-sm text-center">
                        {weekOffset === 0 ? 'Bu Hafta' : weekOffset > 0 ? `${weekOffset} Hafta Sonra` : `${-weekOffset} Hafta Önce`}
                        <span className="text-ink-3 text-xs ml-2 pdf-hide">({weekDates[0]} – {weekDates[6]})</span>
                    </span>
                    <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 hover:bg-surface-3 rounded-xl transition">
                        <ChevronRight size={18} className="text-ink-2" />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full" style={{ minWidth: 600 }}>
                        <thead>
                            <tr className="bg-surface-2">
                                <th className="text-left p-3 text-xs font-bold text-ink-3 w-20 sticky left-0 bg-surface-2">Etüt</th>
                                {DAYS.map((day, i) => (
                                    <th key={i} className="p-2 text-center notranslate" translate="no">
                                        <p className="text-xs font-black text-ink-2 uppercase tracking-tighter">{day}</p>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {dynamicSlots.map(slot => (
                                <tr key={slot.id} className="border-t border-gray-50">
                                    <td className="p-2 sticky left-0 bg-surface">
                                        <div className="flex items-center gap-1">
                                            <slot.icon size={10} className="text-ink-3" />
                                            <span className="text-[10px] font-bold text-ink-3">{slot.label}</span>
                                        </div>
                                    </td>
                                    {DAYS.map((_, dayIdx) => (
                                        <td key={dayIdx} className="p-1">
                                            <ScheduleCell
                                                dayIdx={dayIdx}
                                                slotId={slot.id}
                                                assignment={getAssignment(dayIdx, slot.id)}
                                                onAssign={assign}
                                                onClear={clear}
                                                selectedSubject={selectedSubject}
                                                selectionMode={selectionMode}
                                                selectedCells={selectedCells}
                                                onToggleCell={toggleCell}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Ders Dağılımı ───────────────────────────────────────── */}
            {stats.length > 0 && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-brand-line p-5">
                    <h3 className="font-black text-ink mb-3 flex items-center gap-2">
                        <BookOpen size={16} className="text-brand" />Haftalık Ders Dağılımı
                    </h3>
                    <div className="space-y-2">
                        {stats.map(s => (
                            <div key={s.id} className="flex items-center gap-3">
                                <span className="text-base w-6">{s.emoji}</span>
                                <span className="text-xs font-bold text-ink-2 w-24 truncate">{s.label}</span>
                                <div className="flex-1 h-3 bg-surface-3 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-yavas"
                                        style={{ width: `${(s.count / Math.max(...stats.map(x => x.count), 1)) * 100}%`, backgroundColor: s.color }} />
                                </div>
                                <span className="text-xs font-black w-12 text-right" style={{ color: s.color }}>~{s.count * 2}s</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeeklyScheduleBuilder;
