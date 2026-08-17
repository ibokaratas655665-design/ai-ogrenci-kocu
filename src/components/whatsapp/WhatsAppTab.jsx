/**
 * 💬 WHATSAPP MERKEZİ (Koç Paneli Sekmesi)
 *
 * Üç bölüm:
 *  - Hızlı Aksiyonlar: sistemin tespit ettiği duruma göre önerilen gönderimler
 *  - Şablonlar: yerleşik şablonları düzenleme / yeni şablon
 *  - Geçmiş: kime ne zaman ne gönderildi
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
    MessageCircle, Zap, FileText, History, Send, Users, AlertTriangle,
    TrendingDown, TrendingUp, Clock, Trophy, Save, Trash2, RotateCcw,
    Plus, Search, Phone, Settings2, ChevronRight,
} from 'lucide-react';
import { buildClassReport } from '../../services/reportService';
import wa from '../../services/whatsappService';
import { TEMPLATE_CATEGORIES } from '../../data/whatsappTemplates';
import WhatsAppComposer from './WhatsAppComposer';

const SECTIONS = [
    { id: 'quick', label: 'Hızlı Aksiyon', icon: Zap },
    { id: 'templates', label: 'Şablonlar', icon: FileText },
    { id: 'history', label: 'Geçmiş', icon: History },
    { id: 'settings', label: 'Ayarlar', icon: Settings2 },
];

const WhatsAppTab = ({ students = [], coachName = '' }) => {
    const [section, setSection] = useState('quick');
    const [composer, setComposer] = useState(null); // { ids, templateId }
    const [logVersion, setLogVersion] = useState(0);

    const classReport = useMemo(() => buildClassReport(students, { periodDays: 7 }), [students]);

    const openComposer = useCallback((ids, templateId) => {
        setComposer({ ids: ids.map(String), templateId });
    }, []);

    const closeComposer = useCallback(() => {
        setComposer(null);
        setLogVersion((v) => v + 1);
    }, []);

    // ── Telefon kapsamı ──────────────────────────────────────
    const coverage = useMemo(() => {
        const withStudent = students.filter((s) => wa.isValidPhone(s.phone)).length;
        const withParent = students.filter((s) => wa.isValidPhone(s.parentPhone)).length;
        return { withStudent, withParent, total: students.length };
    }, [students]);

    // ── Hızlı aksiyon önerileri ──────────────────────────────
    const quickActions = useMemo(() => {
        const inactive = classReport.reports.filter(
            (r) => r.activity.daysSinceActivity == null || r.activity.daysSinceActivity > 5
        );
        const declining = classReport.reports.filter(
            (r) => r.exams.netTrend != null && r.exams.netTrend < -2
        );
        const overdue = classReport.reports.filter((r) => r.tasks.overdue > 0);
        const streakers = classReport.reports.filter((r) => r.gamification.streak >= 7);

        return [
            {
                id: 'weekly_parents',
                icon: Users,
                color: 'var(--c4)',
                title: 'Haftalık Veli Raporu',
                desc: 'Tüm velilere haftanın gelişim özetini gönder',
                count: students.length,
                ids: students.map((s) => s.id),
                templateId: 'parent_weekly',
            },
            {
                id: 'risk',
                icon: AlertTriangle,
                color: 'var(--danger)',
                title: 'Riskli Öğrenci Velileri',
                desc: 'Yüksek riskli öğrencilerin velilerini bilgilendir',
                count: classReport.atRisk.length,
                ids: classReport.atRisk.map((r) => r.student.id),
                templateId: 'parent_concern',
            },
            {
                id: 'declining',
                icon: TrendingDown,
                color: 'var(--danger)',
                title: 'Net Düşüşü Olanlar',
                desc: 'Son denemede 2+ net kaybedenlere analiz gönder',
                count: declining.length,
                ids: declining.map((r) => r.student.id),
                templateId: 'student_exam_result',
            },
            {
                id: 'inactive',
                icon: Clock,
                color: 'var(--highlight)',
                title: 'Uzun Süredir Yoklar',
                desc: '5+ gündür aktivite kaydı olmayanlara hatırlatma',
                count: inactive.length,
                ids: inactive.map((r) => r.student.id),
                templateId: 'inactive_nudge',
            },
            {
                id: 'overdue',
                icon: Clock,
                color: 'var(--info)',
                title: 'Geciken Görevler',
                desc: 'Süresi geçmiş görevi olan öğrencilere hatırlatma',
                count: overdue.length,
                ids: overdue.map((r) => r.student.id),
                templateId: 'task_reminder',
            },
            {
                id: 'improved',
                icon: TrendingUp,
                color: 'var(--accent)',
                title: 'Gelişenlerin Velileri',
                desc: 'Netleri artan öğrencilerin velilerine tebrik',
                count: classReport.mostImproved.length,
                ids: classReport.mostImproved.map((r) => r.student.id),
                templateId: 'parent_congrats',
            },
            {
                id: 'streak',
                icon: Trophy,
                color: 'var(--highlight)',
                title: 'Seri Yapanlar',
                desc: '7+ gün aralıksız çalışanları tebrik et',
                count: streakers.length,
                ids: streakers.map((r) => r.student.id),
                templateId: 'motivation_streak',
            },
        ].filter((a) => a.count > 0);
    }, [classReport, students]);

    return (
        <div className="space-y-5 animate-fade-in pb-24">

            {/* ── Başlık ─────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-ink syne flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-ok/15 border border-ok/30 flex items-center justify-center">
                            <MessageCircle size={22} className="text-ok" />
                        </div>
                        WhatsApp Merkezi
                    </h2>
                    <p className="text-ink-3 text-xs mt-1.5 ml-1">
                        Öğrenci ve velilerle tek ekrandan iletişim
                    </p>
                </div>
                <button
                    onClick={() => openComposer([], null)}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-ok text-ink-on font-black text-sm active:scale-95 transition"
                >
                    <Send size={16} /> Yeni Mesaj
                </button>
            </div>

            {/* ── Numara kapsamı ─────────────────────────── */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Toplam Öğrenci', value: coverage.total, color: 'var(--highlight)' },
                    { label: 'Öğrenci Numarası', value: `${coverage.withStudent}/${coverage.total}`, color: 'var(--info)' },
                    { label: 'Veli Numarası', value: `${coverage.withParent}/${coverage.total}`, color: 'var(--c4)' },
                ].map((k) => (
                    <div key={k.label} className="premium-card p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-ink-3 mb-1">{k.label}</p>
                        <p className="text-2xl font-black syne" style={{ color: k.color }}>{k.value}</p>
                    </div>
                ))}
            </div>

            {coverage.withParent < coverage.total && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-brand/8 border border-brand/20">
                    <Phone size={16} className="text-brand shrink-0 mt-0.5" />
                    <p className="text-xs text-brand/90 leading-relaxed">
                        <strong>{coverage.total - coverage.withParent} öğrencinin</strong> veli telefonu eksik.
                        Öğrenci kartını düzenleyerek "Veli Telefonu" alanını doldurun — veli raporları
                        yalnızca numarası olanlara gidebiliyor.
                    </p>
                </div>
            )}

            {/* ── Sekmeler ───────────────────────────────── */}
            <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-line pb-px">
                {SECTIONS.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => setSection(s.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-bold whitespace-nowrap transition border-b-2 ${
                            section === s.id
                                ? 'text-brand border-brand'
                                : 'text-ink-3 border-transparent hover:text-ink-2'
                        }`}
                    >
                        <s.icon size={15} /> {s.label}
                    </button>
                ))}
            </div>

            {section === 'quick' && (
                <QuickActions actions={quickActions} onRun={openComposer} />
            )}
            {section === 'templates' && <TemplateManager />}
            {section === 'history' && <MessageHistory key={logVersion} students={students} />}
            {section === 'settings' && <WhatsAppSettings />}

            {composer && (
                <WhatsAppComposer
                    students={students}
                    preselectedIds={composer.ids}
                    presetTemplateId={composer.templateId}
                    coachName={coachName}
                    onClose={closeComposer}
                />
            )}
        </div>
    );
};

// ════════════════════════════════════════════════════════════
//  Hızlı Aksiyonlar
// ════════════════════════════════════════════════════════════
const QuickActions = ({ actions, onRun }) => {
    if (actions.length === 0) {
        return (
            <div className="premium-card p-10 text-center">
                <Zap size={32} className="text-ink-3 mx-auto mb-3" />
                <p className="text-ink-3 text-sm font-bold">Şu an önerilen bir aksiyon yok</p>
                <p className="text-ink-3 text-xs mt-1">
                    Öğrenci verisi biriktikçe burada otomatik öneriler görünecek.
                </p>
            </div>
        );
    }

    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {actions.map((a) => (
                <button
                    key={a.id}
                    onClick={() => onRun(a.ids, a.templateId)}
                    className="premium-card p-4 text-left hover:border-line-2 transition group"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center border"
                            style={{
                                backgroundColor: `${a.color}18`,
                                borderColor: `${a.color}40`,
                            }}
                        >
                            <a.icon size={18} style={{ color: a.color }} />
                        </div>
                        <span
                            className="text-xs font-black px-2.5 py-1 rounded-lg"
                            style={{ backgroundColor: `${a.color}15`, color: a.color }}
                        >
                            {a.count}
                        </span>
                    </div>
                    <h4 className="text-ink font-bold text-sm mb-1">{a.title}</h4>
                    <p className="text-ink-3 text-[11px] leading-snug mb-3">{a.desc}</p>
                    <span className="flex items-center gap-1 text-[11px] font-black text-ok opacity-0 group-hover:opacity-100 transition">
                        Mesajı hazırla <ChevronRight size={12} />
                    </span>
                </button>
            ))}
        </div>
    );
};

// ════════════════════════════════════════════════════════════
//  Şablon Yöneticisi
// ════════════════════════════════════════════════════════════
const TemplateManager = () => {
    const [templates, setTemplates] = useState(() => wa.getTemplates());
    const [editing, setEditing] = useState(null);
    const [draft, setDraft] = useState('');
    const [saved, setSaved] = useState(false);

    const refresh = () => setTemplates(wa.getTemplates());

    const startEdit = (t) => {
        setEditing(t);
        setDraft(t.body);
        setSaved(false);
    };

    const save = () => {
        wa.saveTemplate({ ...editing, body: draft });
        refresh();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const reset = () => {
        wa.resetTemplate(editing.id);
        const fresh = wa.getTemplates().find((t) => t.id === editing.id);
        setDraft(fresh?.body || '');
        refresh();
    };

    const addNew = () => {
        const t = {
            id: `tpl_${Date.now()}`,
            category: 'motivation',
            audience: 'student',
            icon: '✏️',
            label: 'Yeni Şablon',
            description: 'Özel şablon',
            body: 'Merhaba {ad},\n\n',
        };
        wa.saveTemplate(t);
        refresh();
        startEdit(t);
    };

    return (
        <div className="grid lg:grid-cols-[320px_1fr] gap-4">
            {/* Liste */}
            <div className="space-y-3">
                <button
                    onClick={addNew}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-dashed border-white/15 text-ink-3 text-sm font-bold hover:border-brand/40 hover:text-brand transition"
                >
                    <Plus size={15} /> Yeni Şablon
                </button>

                <div className="space-y-3 max-h-[520px] overflow-y-auto no-scrollbar">
                    {TEMPLATE_CATEGORIES.map((cat) => {
                        const list = templates.filter((t) => t.category === cat.id);
                        if (list.length === 0) return null;
                        return (
                            <div key={cat.id}>
                                <p className="text-[10px] font-black uppercase tracking-widest text-ink-3 mb-1.5 px-1">
                                    {cat.icon} {cat.label}
                                </p>
                                <div className="space-y-1">
                                    {list.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => startEdit(t)}
                                            className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-left transition ${
                                                editing?.id === t.id
                                                    ? 'bg-brand/12 border border-brand/30'
                                                    : 'bg-surface/[0.03] border border-transparent hover:border-line'
                                            }`}
                                        >
                                            <span className="text-sm">{t.icon}</span>
                                            <span className="flex-1 min-w-0 text-ink-2 text-xs font-bold truncate">
                                                {t.label}
                                            </span>
                                            {t.edited && (
                                                <span className="text-[9px] font-black text-brand bg-brand/10 px-1.5 py-0.5 rounded">
                                                    DÜZENLİ
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Editör */}
            <div className="premium-card p-4">
                {!editing ? (
                    <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center">
                        <FileText size={32} className="text-ink-3 mb-3" />
                        <p className="text-ink-3 text-sm font-bold">Düzenlemek için bir şablon seçin</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-lg">{editing.icon}</span>
                                <div className="min-w-0">
                                    <p className="text-ink font-bold text-sm truncate">{editing.label}</p>
                                    <p className="text-ink-3 text-[11px]">
                                        {editing.audience === 'parent' ? 'Veliye gider' : 'Öğrenciye gider'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                {editing.edited && (
                                    <button
                                        onClick={reset}
                                        title="Fabrika ayarına dön"
                                        className="p-2 rounded-xl text-ink-3 hover:text-ink hover:bg-surface/5 transition"
                                    >
                                        <RotateCcw size={15} />
                                    </button>
                                )}
                                {editing.custom && (
                                    <button
                                        onClick={() => {
                                            wa.deleteTemplate(editing.id);
                                            setEditing(null);
                                            refresh();
                                        }}
                                        title="Sil"
                                        className="p-2 rounded-xl text-danger/70 hover:text-danger hover:bg-danger/10 transition"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                )}
                                <button
                                    onClick={save}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-ink-on font-black text-xs active:scale-95 transition"
                                >
                                    <Save size={13} /> {saved ? 'Kaydedildi' : 'Kaydet'}
                                </button>
                            </div>
                        </div>

                        <textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            rows={16}
                            className="w-full bg-surface/[0.04] border border-line rounded-2xl p-3 text-sm text-ink-2 font-mono leading-relaxed focus:outline-none focus:border-brand/40 resize-none"
                        />

                        <details className="mt-3 bg-surface/[0.03] border border-line rounded-2xl">
                            <summary className="px-3 py-2 text-xs font-bold text-ink-3 cursor-pointer select-none">
                                Değişkenler — tıklayarak ekle
                            </summary>
                            <div className="px-3 pb-3 flex flex-wrap gap-1">
                                {wa.TEMPLATE_VARIABLES.map((v) => (
                                    <button
                                        key={v.key}
                                        onClick={() => setDraft((d) => `${d}{${v.key}}`)}
                                        title={`${v.label} — örn: ${v.example}`}
                                        className="text-[10px] font-mono px-2 py-1 rounded-lg bg-surface/5 text-brand hover:bg-brand/15 transition"
                                    >
                                        {`{${v.key}}`}
                                    </button>
                                ))}
                            </div>
                        </details>
                    </>
                )}
            </div>
        </div>
    );
};

// ════════════════════════════════════════════════════════════
//  Gönderim Geçmişi
// ════════════════════════════════════════════════════════════
const MessageHistory = ({ students }) => {
    const [search, setSearch] = useState('');
    const [log, setLog] = useState(() => wa.getMessageLog());

    const studentNames = useMemo(
        () => new Map(students.map((s) => [String(s.id), s.name])),
        [students]
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLocaleLowerCase('tr-TR');
        if (!q) return log;
        return log.filter((l) =>
            `${l.studentName || studentNames.get(String(l.studentId)) || ''} ${l.message || ''}`
                .toLocaleLowerCase('tr-TR')
                .includes(q)
        );
    }, [log, search, studentNames]);

    const clear = () => {
        if (!window.confirm('Tüm gönderim geçmişi silinecek. Emin misiniz?')) return;
        wa.clearMessageLog();
        setLog([]);
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Öğrenci veya mesaj içinde ara..."
                        className="w-full bg-surface/[0.04] border border-line rounded-xl pl-9 pr-3 py-2.5 text-sm text-ink placeholder-white/30 focus:outline-none focus:border-brand/40"
                    />
                </div>
                {log.length > 0 && (
                    <button
                        onClick={clear}
                        className="px-4 py-2.5 rounded-xl border border-danger/25 text-danger/80 text-xs font-bold hover:bg-danger/10 transition"
                    >
                        Geçmişi Temizle
                    </button>
                )}
            </div>

            {filtered.length === 0 ? (
                <div className="premium-card p-10 text-center">
                    <History size={32} className="text-ink-3 mx-auto mb-3" />
                    <p className="text-ink-3 text-sm font-bold">
                        {log.length === 0 ? 'Henüz mesaj gönderilmedi' : 'Aramaya uyan kayıt yok'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.slice(0, 100).map((l) => (
                        <div key={l.id} className="premium-card p-3.5">
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="min-w-0">
                                    <p className="text-ink text-sm font-bold truncate">
                                        {l.studentName || studentNames.get(String(l.studentId)) || 'Bilinmeyen'}
                                        <span className={`ml-2 text-[10px] font-black px-1.5 py-0.5 rounded ${
                                            l.audience === 'parent'
                                                ? 'bg-c4/15 text-c4'
                                                : 'bg-info/15 text-info'
                                        }`}>
                                            {l.audience === 'parent' ? 'VELİ' : 'ÖĞRENCİ'}
                                        </span>
                                    </p>
                                    <p className="text-ink-3 text-[11px]">
                                        {wa.formatPhoneDisplay(l.phone)} ·{' '}
                                        {new Date(l.sentAt).toLocaleString('tr-TR', {
                                            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg shrink-0 ${
                                    l.status === 'opened'
                                        ? 'bg-ok/12 text-ok'
                                        : 'bg-danger/12 text-danger'
                                }`}>
                                    {l.status === 'opened' ? 'AÇILDI' : 'HATA'}
                                </span>
                            </div>
                            <p className="text-ink-3 text-[11px] leading-snug line-clamp-2 whitespace-pre-wrap">
                                {l.message}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ════════════════════════════════════════════════════════════
//  Ayarlar
// ════════════════════════════════════════════════════════════
const WhatsAppSettings = () => {
    const [settings, setSettings] = useState(() => wa.getSettings());
    const [saved, setSaved] = useState(false);

    const save = () => {
        wa.saveSettings(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="premium-card p-5 max-w-xl space-y-4">
            <div>
                <label className="block text-xs font-black uppercase tracking-widest text-ink-3 mb-2">
                    Koç Adı (mesaj imzası)
                </label>
                <input
                    value={settings.coachName}
                    onChange={(e) => setSettings((p) => ({ ...p, coachName: e.target.value }))}
                    placeholder="Örn: Ayşe Yılmaz"
                    className="w-full bg-surface/[0.04] border border-line rounded-xl px-3 py-2.5 text-sm text-ink placeholder-white/25 focus:outline-none focus:border-brand/40"
                />
                <p className="text-ink-3 text-[11px] mt-1.5">
                    Şablonlardaki <code className="text-brand">{'{kocAdi}'}</code> değişkeni bu değerle doldurulur.
                </p>
            </div>

            <div>
                <label className="block text-xs font-black uppercase tracking-widest text-ink-3 mb-2">
                    Toplu Gönderim Aralığı
                </label>
                <div className="flex items-center gap-3">
                    <input
                        type="range"
                        min={500}
                        max={5000}
                        step={100}
                        value={settings.sendDelayMs}
                        onChange={(e) => setSettings((p) => ({ ...p, sendDelayMs: Number(e.target.value) }))}
                        className="flex-1 accent-[#c9a84c]"
                    />
                    <span className="text-brand font-black text-sm tabular-nums w-16 text-right">
                        {(settings.sendDelayMs / 1000).toFixed(1)} sn
                    </span>
                </div>
                <p className="text-ink-3 text-[11px] mt-1.5">
                    Sekmeler bu aralıkla açılır. Çok kısa tutarsanız tarayıcı açılır pencere engeline takılabilir.
                </p>
            </div>

            <div className="p-3 rounded-2xl bg-info/8 border border-info/20">
                <p className="text-[11px] text-info/90 leading-relaxed">
                    <strong>Nasıl çalışıyor?</strong> Mesajlar WhatsApp Web/uygulama üzerinden, sizin kendi
                    numaranızdan gider. Sistem mesajı hazırlayıp sekmeyi açar — gönder tuşuna siz basarsınız.
                    Bu yüzden ek ücret yoktur ve yanlışlıkla mesaj gitmez.
                </p>
            </div>

            <button
                onClick={save}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-ink-on font-black text-sm active:scale-95 transition"
            >
                <Save size={15} /> {saved ? 'Kaydedildi' : 'Ayarları Kaydet'}
            </button>
        </div>
    );
};

export default WhatsAppTab;
