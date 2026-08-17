/**
 * 📨 TOPLU MESAJ SİSTEMİ
 * Koç → Tüm öğrenciler veya filtreli grup mesaj gönderimi
 */
import React, { useState, useMemo } from 'react';
import {
    Send, X, Users, Filter, CheckCircle, Megaphone,
    AlertTriangle, Star, Clock, ChevronDown, Search,
    MessageSquare, Zap, BookOpen, Trophy, Target
} from 'lucide-react';
import { bildir } from '../../services/uiGeriBildirim';
import { hataAnlat } from '../../services/hataMesaji';

// ─── Mesaj Şablonları ─────────────────────────────────────────────────
const TEMPLATES = [
    {
        id: 'motivation', icon: '🔥', label: 'Motivasyon',
        title: 'Harika Gidiyorsunuz!',
        body: 'Sınıfımız bu hafta gerçekten harika bir performans sergiledi! Düzenli çalışmanın meyvelerini toplamaya devam edin. Hedeflerinize adım adım yaklaşıyorsunuz. 💪'
    },
    {
        id: 'exam_reminder', icon: '📅', label: 'Deneme Hatırlatma',
        title: 'Yaklaşan Deneme Sınavı',
        body: 'Hafta sonu deneme sınavımız var. Hazırlıklarınızı tamamlayın. Sınavda başarılar! Form konusunda soru varsa mesaj atabilirsiniz.'
    },
    {
        id: 'study_tip', icon: '💡', label: 'Çalışma İpucu',
        title: 'Haftalık Çalışma Önerisi',
        body: 'Bu hafta odak noktanız: Yanlış yaptığınız soruları tekrar çözün. Her sorunun neden yanlış olduğunu anlayın. Tekrar hataları yapmanın önüne geçin.'
    },
    {
        id: 'congrats', icon: '🏆', label: 'Tebrik',
        title: 'Tebrikler!',
        body: 'Son denemede gösterdiğiniz gelişme çok kıymetli! Durmayın, bu tempoyu koruyun. Sınıf olarak gerçek bir takım enerjisi hissediyorum.'
    },
    {
        id: 'warning', icon: '⚠️', label: 'Uyarı',
        title: 'Önemli Hatırlatma',
        body: 'Bazı görevlerin hala tamamlanmadığını görüyorum. Lütfen bu haftaki görevleri en kısa sürede tamamlayın. Birlikte hedeflerimize ulaşacağız.'
    },
    {
        id: 'custom', icon: '✏️', label: 'Özel Mesaj', title: '', body: ''
    },
];

// ─── Öncelik Seçenekleri ──────────────────────────────────────────────
const PRIORITIES = [
    { id: 'normal', label: 'Normal', color: 'gray', icon: MessageSquare },
    { id: 'important', label: 'Önemli', color: 'amber', icon: AlertTriangle },
    { id: 'urgent', label: 'Acil', color: 'red', icon: Zap },
];

// ─── Filtre Seçenekleri ───────────────────────────────────────────────
const FILTER_OPTIONS = [
    { id: 'all', label: 'Tüm Öğrenciler', icon: Users },
    { id: 'grade_9', label: '9. Sınıflar', icon: BookOpen },
    { id: 'grade_10', label: '10. Sınıflar', icon: BookOpen },
    { id: 'grade_11', label: '11. Sınıflar', icon: BookOpen },
    { id: 'grade_12', label: '12. Sınıflar', icon: BookOpen },
    { id: 'risky', label: 'Risk Altındakiler', icon: AlertTriangle },
    { id: 'top', label: 'En İyi Performans', icon: Trophy },
    { id: 'inactive', label: 'İnaktif Öğrenciler', icon: Clock },
];

// ─── Ana Bileşen ─────────────────────────────────────────────────────
const BulkMessageModal = ({ onClose, students = [], coachName = 'Koçunuz' }) => {
    const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
    const [title, setTitle] = useState(TEMPLATES[0].title);
    const [body, setBody] = useState(TEMPLATES[0].body);
    const [priority, setPriority] = useState('normal');
    const [filterMode, setFilterMode] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [step, setStep] = useState(1); // 1: compose, 2: select, 3: confirm, 4: done
    const [sending, setSending] = useState(false);
    const [useManualSelect, setUseManualSelect] = useState(false);

    // ── Filtrelenmiş öğrenci listesi ──────────────────────────────────
    const filteredStudents = useMemo(() => {
        let list = [...students];

        // Filtre modu
        if (filterMode === 'grade_9') list = list.filter(s => s.grade === '9' || s.grade === 9);
        else if (filterMode === 'grade_10') list = list.filter(s => s.grade === '10' || s.grade === 10);
        else if (filterMode === 'grade_11') list = list.filter(s => s.grade === '11' || s.grade === 11);
        else if (filterMode === 'grade_12') list = list.filter(s => s.grade === '12' || s.grade === 12);
        else if (filterMode === 'risky') {
            // Son 2 denemede düşüş var mı? (Basit kural)
            list = list.filter(s => {
                const exams = JSON.parse(localStorage.getItem('v2_results_data') || '[]')
                    .filter(r => r.studentId === s.id || r.studentName === s.name)
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 2);
                if (exams.length < 2) return false;
                return (parseFloat(exams[0].totalNet) || 0) < (parseFloat(exams[1].totalNet) || 0) - 5;
            });
        }
        else if (filterMode === 'top') {
            list = list.sort((a, b) => {
                const aExams = JSON.parse(localStorage.getItem('v2_results_data') || '[]').filter(r => r.studentId === a.id);
                const bExams = JSON.parse(localStorage.getItem('v2_results_data') || '[]').filter(r => r.studentId === b.id);
                const aNet = aExams.length ? parseFloat(aExams[aExams.length - 1].totalNet) || 0 : 0;
                const bNet = bExams.length ? parseFloat(bExams[bExams.length - 1].totalNet) || 0 : 0;
                return bNet - aNet;
            }).slice(0, Math.ceil(list.length / 3));
        }
        else if (filterMode === 'inactive') {
            // Son 3 günde hiç aktivite yok → mesaj yok
            const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
            list = list.filter(s => {
                const msgs = JSON.parse(localStorage.getItem('messages') || '[]');
                const hasRecent = msgs.some(m => m.senderId === s.id && new Date(m.timestamp) > threeDaysAgo);
                return !hasRecent;
            });
        }

        // Arama
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(s => s.name?.toLowerCase().includes(q) || s.grade?.toString().includes(q));
        }

        return list;
    }, [students, filterMode, searchQuery]);

    // Manuel seçim yoksa → filtreden gelen tüm öğrenciler hedef
    const targetStudents = useManualSelect
        ? filteredStudents.filter(s => selectedStudents.has(s.id))
        : filteredStudents;

    // ── Şablon seç ────────────────────────────────────────────────────
    const applyTemplate = (tpl) => {
        setSelectedTemplate(tpl);
        if (tpl.id !== 'custom') {
            setTitle(tpl.title);
            setBody(tpl.body);
        } else {
            setTitle('');
            setBody('');
        }
    };

    // ── Toplu mesaj gönder ────────────────────────────────────────────
    const handleSend = async () => {
        if (!title.trim() || !body.trim() || targetStudents.length === 0) return;
        setSending(true);

        try {
            // localStorage'daki mesaj sistemine ekle
            const existingMessages = JSON.parse(localStorage.getItem('messages') || '[]');
            const now = new Date().toISOString();

            const newMessages = targetStudents.map(student => ({
                id: `bulk_${Date.now()}_${student.id}`,
                senderId: 'coach',
                senderName: coachName,
                receiverId: student.id,
                receiverName: student.name,
                title: title.trim(),
                content: body.trim(),
                priority,
                timestamp: now,
                read: false,
                isBulk: true,
                type: selectedTemplate.id,
            }));

            localStorage.setItem('messages', JSON.stringify([...existingMessages, ...newMessages]));

            // Custom event ile bildirim sistemini tetikle
            window.dispatchEvent(new CustomEvent('new_bulk_message', {
                detail: { count: newMessages.length, priority }
            }));

            await new Promise(r => setTimeout(r, 1000)); // Loading göster
            setSending(false);
            setStep(4); // done
        } catch (err) {
            console.error('Mesaj gönderme hatası:', err);
            setSending(false);
            bildir(hataAnlat(err, 'mesaj'), 'hata');
        }
    };

    const priorityConfig = PRIORITIES.find(p => p.id === priority);
    const priorityColors = {
        normal: { bg: 'bg-surface-3', text: 'text-ink-2', border: 'border-line' },
        important: { bg: 'bg-warn-soft', text: 'text-warn', border: 'border-warn' },
        urgent: { bg: 'bg-danger-soft', text: 'text-danger', border: 'border-danger' },
    };
    const pc = priorityColors[priority];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-modal-base flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-surface rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* ── HEADER ────────────────────────────────────────── */}
                <div className="on-color bg-gradient-to-r from-brand to-purple-700 p-5 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-surface/20 rounded-xl flex items-center justify-center">
                                <Megaphone size={20} className="text-ink" />
                            </div>
                            <div>
                                <h2 className="font-black text-ink text-lg">Toplu Mesaj Gönder</h2>
                                <p className="text-brand text-xs">
                                    {step === 1 && 'Mesaj içeriğini hazırla'}
                                    {step === 2 && `Alıcıları seç — ${students.length} öğrenci`}
                                    {step === 3 && `${targetStudents.length} öğrenciye gönderilecek`}
                                    {step === 4 && 'Mesajlar iletildi!'}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-surface/20 rounded-xl transition text-ink">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Step bar */}
                    <div className="flex gap-2 mt-4">
                        {['İçerik', 'Alıcılar', 'Onay'].map((s, i) => (
                            <div key={i} className="flex-1 flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition
                                    ${step > i + 1 ? 'bg-emerald-400 text-ink' :
                                        step === i + 1 ? 'bg-surface text-brand' :
                                            'bg-surface/20 text-ink-3'}`}>
                                    {step > i + 1 ? <CheckCircle size={14} /> : i + 1}
                                </div>
                                <span className={`text-xs font-semibold ${step >= i + 1 ? 'text-ink' : 'text-ink-3'}`}>{s}</span>
                                {i < 2 && <div className={`flex-1 h-0.5 rounded-full ${step > i + 1 ? 'bg-emerald-400' : 'bg-surface/20'}`} />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── CONTENT ───────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">

                    {/* ADIM 1: MESAJ COMPOSE */}
                    {step === 1 && (
                        <>
                            {/* Şablonlar */}
                            <div>
                                <p className="text-xs font-bold text-ink-2 uppercase tracking-wide mb-2">Şablon Seç</p>
                                <div className="flex flex-wrap gap-2">
                                    {TEMPLATES.map(tpl => (
                                        <button
                                            key={tpl.id}
                                            onClick={() => applyTemplate(tpl)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition
                                                ${selectedTemplate.id === tpl.id
                                                    ? 'bg-brand text-white shadow-md'
                                                    : 'bg-surface-3 text-ink-2 hover:bg-brand-soft hover:text-brand'}`}
                                        >
                                            {tpl.icon} {tpl.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Öncelik */}
                            <div>
                                <p className="text-xs font-bold text-ink-2 uppercase tracking-wide mb-2">Öncelik</p>
                                <div className="flex gap-2">
                                    {PRIORITIES.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setPriority(p.id)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition
                                                ${priority === p.id ? priorityColors[p.id].bg + ' ' + priorityColors[p.id].text + ' ' + priorityColors[p.id].border + ' border' : 'bg-surface text-ink-2 border-line hover:bg-surface-2'}`}
                                        >
                                            <p.icon size={12} /> {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Başlık */}
                            <div>
                                <label className="text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5 block">Başlık</label>
                                <input
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Mesaj başlığı..."
                                    className="w-full border border-line rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 text-ink"
                                />
                            </div>

                            {/* Mesaj */}
                            <div>
                                <label className="text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5 block">Mesaj İçeriği</label>
                                <textarea
                                    value={body}
                                    onChange={e => setBody(e.target.value)}
                                    placeholder="Mesajınızı yazın..."
                                    rows={5}
                                    className="w-full border border-line rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-ink-2 resize-none"
                                />
                                <div className="text-right text-xs text-ink-3 mt-1">{body.length} / 500</div>
                            </div>

                            {/* Önizleme */}
                            {(title || body) && (
                                <div className={`rounded-2xl p-4 border ${pc.border} ${pc.bg}`}>
                                    <p className="text-xs text-ink-3 mb-2 font-bold uppercase">Önizleme</p>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-ink text-xs font-black">{coachName.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <p className={`font-bold text-sm ${pc.text}`}>{title || '(Başlık yok)'}</p>
                                            <p className="text-ink-2 text-xs mt-1 leading-relaxed">{body || '(İçerik yok)'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* ADIM 2: ALICI SEÇİMİ */}
                    {step === 2 && (
                        <>
                            {/* Filtre Modu */}
                            <div>
                                <p className="text-xs font-bold text-ink-2 uppercase tracking-wide mb-2">Grup Filtresi</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {FILTER_OPTIONS.map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => { setFilterMode(f.id); setUseManualSelect(false); }}
                                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition
                                                ${filterMode === f.id && !useManualSelect
                                                    ? 'bg-brand text-white border-indigo-600'
                                                    : 'bg-surface text-ink-2 border-line hover:bg-brand-soft'}`}
                                        >
                                            <f.icon size={14} /> {f.label}
                                            <span className="ml-auto text-[10px] opacity-70">
                                                {f.id === 'all' ? students.length :
                                                    students.filter(s =>
                                                        f.id === 'grade_9' ? (s.grade === '9' || s.grade === 9) :
                                                            f.id === 'grade_10' ? (s.grade === '10' || s.grade === 10) :
                                                                f.id === 'grade_11' ? (s.grade === '11' || s.grade === 11) :
                                                                    f.id === 'grade_12' ? (s.grade === '12' || s.grade === 12) :
                                                                        true
                                                    ).length}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Manuel seçim */}
                            <div className="border-t border-line pt-3">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-bold text-ink-2 uppercase tracking-wide">
                                        {useManualSelect ? 'Manuel Seçim' : `Sonuç: ${filteredStudents.length} öğrenci`}
                                    </p>
                                    <button
                                        onClick={() => { setUseManualSelect(!useManualSelect); setSelectedStudents(new Set()); }}
                                        className={`text-xs font-bold px-3 py-1 rounded-lg transition ${useManualSelect ? 'bg-brand-soft text-brand' : 'bg-surface-3 text-ink-2 hover:bg-brand-soft'}`}
                                    >
                                        {useManualSelect ? 'Filtre Moduna Dön' : 'Manuel Seç'}
                                    </button>
                                </div>

                                {/* Arama */}
                                <div className="relative mb-3">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
                                    <input
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Öğrenci ara..."
                                        className="w-full pl-9 pr-4 py-2 border border-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    />
                                </div>

                                {/* Liste */}
                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                    {filteredStudents.map(student => (
                                        <div
                                            key={student.id}
                                            onClick={() => {
                                                if (!useManualSelect) return;
                                                const newSet = new Set(selectedStudents);
                                                newSet.has(student.id) ? newSet.delete(student.id) : newSet.add(student.id);
                                                setSelectedStudents(newSet);
                                            }}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${useManualSelect ? 'cursor-pointer' : ''}
                                                ${useManualSelect && selectedStudents.has(student.id) ? 'bg-brand-soft border border-brand-line' : 'bg-surface-2 hover:bg-surface-3'}`}
                                        >
                                            <div className="w-7 h-7 bg-brand rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-ink text-[10px] font-black">{student.name?.charAt(0)}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-ink truncate">{student.name}</p>
                                                <p className="text-[10px] text-ink-2">{student.grade ? `${student.grade}. Sınıf` : ''}</p>
                                            </div>
                                            {useManualSelect && selectedStudents.has(student.id) && (
                                                <CheckCircle size={16} className="text-brand flex-shrink-0" />
                                            )}
                                        </div>
                                    ))}
                                    {filteredStudents.length === 0 && (
                                        <p className="text-center text-ink-3 text-sm py-4">Öğrenci bulunamadı</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ADIM 3: ONAY */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="bg-brand-soft border border-brand-line rounded-2xl p-5 text-center">
                                <div className="text-5xl mb-3">📨</div>
                                <h3 className="font-black text-xl text-brand mb-1">{targetStudents.length} Öğrenciye</h3>
                                <p className="text-brand text-sm font-medium">mesaj gönderilecek</p>
                            </div>

                            {/* Özet */}
                            <div className="bg-surface-2 rounded-2xl p-4 space-y-2">
                                {[
                                    { label: 'Başlık', value: title },
                                    { label: 'Öncelik', value: PRIORITIES.find(p => p.id === priority)?.label },
                                    { label: 'Filtre', value: FILTER_OPTIONS.find(f => f.id === filterMode)?.label },
                                    { label: 'Alıcı Sayısı', value: `${targetStudents.length} öğrenci` },
                                ].map(item => (
                                    <div key={item.label} className="flex justify-between text-sm">
                                        <span className="text-ink-2 font-medium">{item.label}</span>
                                        <span className="font-bold text-ink">{item.value}</span>
                                    </div>
                                ))}
                            </div>

                            <div className={`rounded-xl p-4 border ${pc.border} ${pc.bg}`}>
                                <p className={`font-bold text-sm ${pc.text} mb-1`}>{title}</p>
                                <p className="text-ink-2 text-xs leading-relaxed">{body}</p>
                            </div>
                        </div>
                    )}

                    {/* ADIM 4: BAŞARILI */}
                    {step === 4 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-20 h-20 bg-ok-soft rounded-full flex items-center justify-center mb-5 animate-bounce-once">
                                <CheckCircle size={40} className="text-ok" />
                            </div>
                            <h3 className="text-2xl font-black text-ink mb-2">Mesajlar Gönderildi! 🎉</h3>
                            <p className="text-ink-2 text-sm mb-2">
                                <span className="font-bold text-brand">{targetStudents.length} öğrenciye</span> mesajınız iletildi.
                            </p>
                            <p className="text-ink-3 text-xs">Öğrenciler bir sonraki girişlerinde mesajlarını görecek.</p>
                        </div>
                    )}
                </div>

                {/* ── FOOTER ────────────────────────────────────────── */}
                {step < 4 && (
                    <div className="pencere-alt-cubuk bg-surface p-4 border-t border-line flex gap-3 flex-shrink-0">
                        <button
                            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                            className="flex-1 border border-line text-ink-2 py-3 rounded-xl font-bold text-sm hover:bg-surface-2 transition"
                        >
                            {step === 1 ? 'İptal' : 'Geri'}
                        </button>

                        {step < 3 && (
                            <button
                                onClick={() => setStep(step + 1)}
                                disabled={step === 1 && (!title.trim() || !body.trim())}
                                className="flex-1 bg-brand text-white py-3 rounded-xl font-bold text-sm hover:bg-brand-hover transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {step === 1 ? 'Alıcıları Seç' : 'Önizle & Onayla'}
                                <ChevronDown size={16} className="-rotate-90" />
                            </button>
                        )}

                        {step === 3 && (
                            <button
                                onClick={handleSend}
                                disabled={sending || targetStudents.length === 0}
                                className="on-color flex-1 bg-gradient-to-r from-brand to-purple-700 text-white py-3 rounded-xl font-black text-sm hover:opacity-90 transition shadow-lg disabled:opacity-40 flex items-center justify-center gap-2"
                            >
                                {sending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Gönderiliyor...
                                    </>
                                ) : (
                                    <><Send size={16} /> {targetStudents.length} Kişiye Gönder</>
                                )}
                            </button>
                        )}
                    </div>
                )}
                {step === 4 && (
                    <div className="p-4 border-t border-line flex-shrink-0">
                        <button onClick={onClose} className="w-full bg-brand text-white py-3 rounded-xl font-black text-sm hover:bg-brand-hover transition">
                            Kapat
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BulkMessageModal;
