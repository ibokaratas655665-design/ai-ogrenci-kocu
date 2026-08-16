/**
 * 💬 WHATSAPP MESAJ OLUŞTURUCU
 *
 * Tek öğrenciye veya toplu gönderim. Şablon seçimi → kişiye özel
 * değişken doldurma → önizleme → sıralı gönderim.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
    X, Send, Users, Search, MessageCircle, AlertTriangle, CheckCircle2,
    Phone, PhoneOff, Copy, ExternalLink, Loader2, ChevronRight, ChevronLeft,
    UserCheck, Eye, RotateCcw,
} from 'lucide-react';
import { buildStudentReport } from '../../services/reportService';
import wa from '../../services/whatsappService';
import { TEMPLATE_CATEGORIES } from '../../data/whatsappTemplates';

const STEPS = [
    { id: 'recipients', label: 'Alıcılar', icon: Users },
    { id: 'template', label: 'Şablon', icon: MessageCircle },
    { id: 'review', label: 'Önizleme & Gönder', icon: Send },
];

const FILTERS = [
    { id: 'all', label: 'Tümü' },
    { id: 'risk', label: 'Riskli' },
    { id: 'inactive', label: 'İnaktif' },
    { id: 'declining', label: 'Net Düşen' },
    { id: 'improving', label: 'Gelişen' },
];

const WhatsAppComposer = ({
    students = [],
    preselectedIds = [],
    presetTemplateId = null,
    coachName = '',
    onClose,
}) => {
    const templates = useMemo(() => wa.getTemplates(), []);
    const presetTemplate = useMemo(
        () => templates.find((t) => t.id === presetTemplateId) || null,
        [templates, presetTemplateId]
    );

    const [step, setStep] = useState(preselectedIds.length ? (presetTemplate ? 2 : 1) : 0);
    const [selectedIds, setSelectedIds] = useState(new Set(preselectedIds.map(String)));
    const [audience, setAudience] = useState(presetTemplate?.audience || 'student'); // 'student' | 'parent'
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [templateId, setTemplateId] = useState(presetTemplateId);
    const [customBody, setCustomBody] = useState(presetTemplate?.body || '');
    const [bodyTouched, setBodyTouched] = useState(false);
    const [extras, setExtras] = useState({ gorusmeTarihi: '', gorusmeYeri: '' });
    const [previewIndex, setPreviewIndex] = useState(0);
    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState(null); // { current, total }
    const [result, setResult] = useState(null);
    const [copied, setCopied] = useState(false);

    const template = useMemo(
        () => templates.find((t) => t.id === templateId) || null,
        [templates, templateId]
    );

    /** Şablon seçimi: metni ve hedef kitleyi birlikte günceller. */
    const pickTemplate = useCallback((t) => {
        setTemplateId(t.id);
        setCustomBody(t.body);
        setBodyTouched(false);
        if (t.audience) setAudience(t.audience);
    }, []);

    // ── Öğrenci raporları (ağır hesap — bir kez) ─────────────
    const reports = useMemo(() => {
        const map = new Map();
        for (const s of students) {
            try {
                map.set(String(s.id), buildStudentReport(s, { periodDays: 7 }));
            } catch {
                map.set(String(s.id), null);
            }
        }
        return map;
    }, [students]);

    const phoneFor = useCallback(
        (student) => (audience === 'parent' ? student.parentPhone : student.phone || student.parentPhone),
        [audience]
    );

    // ── Filtrelenmiş liste ───────────────────────────────────
    const visibleStudents = useMemo(() => {
        const q = search.trim().toLocaleLowerCase('tr-TR');
        return students.filter((s) => {
            if (q) {
                const hay = `${s.name || ''} ${s.schoolNumber || ''} ${s.grade || ''}`.toLocaleLowerCase('tr-TR');
                if (!hay.includes(q)) return false;
            }
            if (filter === 'all') return true;

            const r = reports.get(String(s.id));
            if (!r) return false;
            if (filter === 'risk') return r.risk.level === 'high';
            if (filter === 'inactive') return r.activity.daysSinceActivity == null || r.activity.daysSinceActivity > 5;
            if (filter === 'declining') return r.exams.netTrend != null && r.exams.netTrend < 0;
            if (filter === 'improving') return r.exams.netTrend != null && r.exams.netTrend > 0;
            return true;
        });
    }, [students, search, filter, reports]);

    const selectedStudents = useMemo(
        () => students.filter((s) => selectedIds.has(String(s.id))),
        [students, selectedIds]
    );

    // ── Numarası olan / olmayan ayrımı ───────────────────────
    const { reachable, unreachable } = useMemo(() => {
        const ok = [];
        const no = [];
        for (const s of selectedStudents) {
            (wa.isValidPhone(phoneFor(s)) ? ok : no).push(s);
        }
        return { reachable: ok, unreachable: no };
    }, [selectedStudents, phoneFor]);

    // ── Önizleme ─────────────────────────────────────────────
    const previewStudent = reachable[previewIndex] || reachable[0] || selectedStudents[0] || null;

    const buildMessageFor = useCallback(
        (student) => {
            const report = reports.get(String(student.id));
            const vars = wa.buildVariables(report, {
                kocAdi: coachName || wa.getSettings().coachName || 'Koçunuz',
                gorusmeTarihi: extras.gorusmeTarihi || undefined,
                gorusmeYeri: extras.gorusmeYeri || undefined,
            });
            return wa.renderTemplate(customBody, vars);
        },
        [reports, coachName, extras, customBody]
    );

    const previewMessage = previewStudent ? buildMessageFor(previewStudent) : '';

    const missingVars = useMemo(() => {
        if (!previewStudent) return [];
        const report = reports.get(String(previewStudent.id));
        const vars = wa.buildVariables(report, { kocAdi: coachName });
        return wa.findMissingVariables(customBody, vars);
    }, [previewStudent, reports, customBody, coachName]);

    // ── Gönderim ─────────────────────────────────────────────
    const handleSend = async () => {
        if (reachable.length === 0) return;
        setSending(true);
        setResult(null);

        const items = reachable.map((s) => ({
            phone: phoneFor(s),
            message: buildMessageFor(s),
            studentId: s.id,
            studentName: s.name,
            templateId: template?.id || 'custom',
            audience,
        }));

        const res = await wa.sendBulk(items, {
            onProgress: (current, total) => setProgress({ current, total }),
        });

        setProgress(null);
        setSending(false);
        setResult(res);
    };

    const copyMessage = () => {
        navigator.clipboard?.writeText(previewMessage).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        });
    };

    const toggleStudent = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            const key = String(id);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const selectAllVisible = () => {
        setSelectedIds(new Set(visibleStudents.map((s) => String(s.id))));
    };

    const canProceed = step === 0 ? selectedIds.size > 0 : step === 1 ? Boolean(template) : true;

    // ════════════════════════════════════════════════════════
    return (
        <div className="fixed inset-0 z-modal-base bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div className="bg-surface border border-line rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">

                {/* ── Başlık ─────────────────────────────── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-gradient-to-r from-accent/20 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-ok/15 border border-ok/30 flex items-center justify-center">
                            <MessageCircle size={20} className="text-ok" />
                        </div>
                        <div>
                            <h2 className="text-ink font-black text-lg syne">WhatsApp Gönderimi</h2>
                            <p className="text-ink-3 text-xs">
                                {selectedIds.size > 0 ? `${selectedIds.size} kişi seçili` : 'Alıcı seçin'}
                                {template ? ` · ${template.label}` : ''}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-ink-3 hover:text-ink hover:bg-surface/10 transition">
                        <X size={20} />
                    </button>
                </div>

                {/* ── Adım göstergesi ────────────────────── */}
                <div className="flex items-center gap-1 px-5 py-3 border-b border-line">
                    {STEPS.map((s, i) => (
                        <React.Fragment key={s.id}>
                            <button
                                onClick={() => i < step && setStep(i)}
                                disabled={i > step}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                    i === step
                                        ? 'bg-brand/15 text-brand border border-brand/30'
                                        : i < step
                                            ? 'text-ink-2 hover:text-ink hover:bg-surface/5'
                                            : 'text-ink-3'
                                }`}
                            >
                                <s.icon size={14} />
                                {s.label}
                            </button>
                            {i < STEPS.length - 1 && <ChevronRight size={14} className="text-ink-3" />}
                        </React.Fragment>
                    ))}
                </div>

                {/* ── İçerik ─────────────────────────────── */}
                <div className="flex-1 overflow-y-auto p-5">

                    {/* ADIM 1: ALICILAR */}
                    {step === 0 && (
                        <div className="space-y-4">
                            {/* Hedef kitle */}
                            <div className="flex gap-2">
                                {[
                                    { id: 'student', label: 'Öğrenciye', icon: UserCheck },
                                    { id: 'parent', label: 'Veliye', icon: Users },
                                ].map((a) => (
                                    <button
                                        key={a.id}
                                        onClick={() => setAudience(a.id)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm border transition ${
                                            audience === a.id
                                                ? 'bg-accent/20 border-accent/50 text-accent'
                                                : 'bg-surface/[0.03] border-line text-ink-3 hover:text-ink-2'
                                        }`}
                                    >
                                        <a.icon size={16} /> {a.label}
                                    </button>
                                ))}
                            </div>

                            {/* Arama + filtre */}
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="relative flex-1">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Öğrenci ara..."
                                        className="w-full bg-surface/[0.04] border border-line rounded-xl pl-9 pr-3 py-2.5 text-sm text-ink placeholder-white/30 focus:outline-none focus:border-brand/40"
                                    />
                                </div>
                                <div className="flex gap-1 overflow-x-auto no-scrollbar">
                                    {FILTERS.map((f) => (
                                        <button
                                            key={f.id}
                                            onClick={() => setFilter(f.id)}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                                                filter === f.id
                                                    ? 'bg-brand/15 text-brand border border-brand/30'
                                                    : 'bg-surface/[0.03] text-ink-3 border border-line hover:text-ink-2'
                                            }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-ink-3">
                                    {visibleStudents.length} öğrenci listeleniyor
                                </span>
                                <div className="flex gap-3">
                                    <button onClick={selectAllVisible} className="text-brand font-bold hover:underline">
                                        Görünenleri seç
                                    </button>
                                    <button onClick={() => setSelectedIds(new Set())} className="text-ink-3 font-bold hover:text-ink-2">
                                        Temizle
                                    </button>
                                </div>
                            </div>

                            {/* Liste */}
                            <div className="grid sm:grid-cols-2 gap-2">
                                {visibleStudents.map((s) => {
                                    const isSel = selectedIds.has(String(s.id));
                                    const phone = phoneFor(s);
                                    const hasPhone = wa.isValidPhone(phone);
                                    const r = reports.get(String(s.id));
                                    return (
                                        <button
                                            key={s.id}
                                            onClick={() => toggleStudent(s.id)}
                                            className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                                                isSel
                                                    ? 'bg-accent/15 border-accent/40'
                                                    : 'bg-surface/[0.03] border-line hover:border-white/15'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded-lg border-2 shrink-0 flex items-center justify-center ${
                                                isSel ? 'bg-accent border-accent' : 'border-line-2'
                                            }`}>
                                                {isSel && <CheckCircle2 size={12} className="text-ink" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-ink text-sm font-bold truncate">{s.name}</p>
                                                <div className="flex items-center gap-2 text-[11px]">
                                                    <span className="text-ink-3">
                                                        {[s.grade, s.section].filter(Boolean).join('-') || 'Sınıf yok'}
                                                    </span>
                                                    {hasPhone ? (
                                                        <span className="text-ok/70 flex items-center gap-1">
                                                            <Phone size={10} /> {wa.formatPhoneDisplay(phone)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-danger/80 flex items-center gap-1">
                                                            <PhoneOff size={10} /> numara yok
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {r?.risk?.level === 'high' && (
                                                <span className="text-[10px] font-black text-danger bg-danger/10 px-2 py-0.5 rounded-lg shrink-0">
                                                    RİSK
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                                {visibleStudents.length === 0 && (
                                    <p className="col-span-full text-center text-ink-3 text-sm py-8">
                                        Bu filtreye uyan öğrenci yok.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ADIM 2: ŞABLON */}
                    {step === 1 && (
                        <div className="space-y-5">
                            {TEMPLATE_CATEGORIES.map((cat) => {
                                const catTemplates = templates.filter((t) => t.category === cat.id);
                                if (catTemplates.length === 0) return null;
                                return (
                                    <div key={cat.id}>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-ink-3 mb-2 flex items-center gap-2">
                                            <span>{cat.icon}</span> {cat.label}
                                        </h3>
                                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {catTemplates.map((t) => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => pickTemplate(t)}
                                                    className={`p-3 rounded-2xl border text-left transition ${
                                                        templateId === t.id
                                                            ? 'bg-brand/12 border-brand/40'
                                                            : 'bg-surface/[0.03] border-line hover:border-white/15'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-base">{t.icon}</span>
                                                        <span className="text-ink text-sm font-bold truncate">{t.label}</span>
                                                    </div>
                                                    <p className="text-ink-3 text-[11px] leading-snug line-clamp-2">
                                                        {t.description || '—'}
                                                    </p>
                                                    <span className={`inline-block mt-2 text-[10px] font-black px-2 py-0.5 rounded-lg ${
                                                        t.audience === 'parent'
                                                            ? 'bg-c4/15 text-c4'
                                                            : 'bg-info/15 text-info'
                                                    }`}>
                                                        {t.audience === 'parent' ? 'VELİYE' : 'ÖĞRENCİYE'}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ADIM 3: ÖNİZLEME */}
                    {step === 2 && (
                        <div className="grid lg:grid-cols-2 gap-5">
                            {/* Sol: düzenleme */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black uppercase tracking-widest text-ink-3">
                                        Mesaj Metni
                                    </label>
                                    {bodyTouched && template && (
                                        <button
                                            onClick={() => { setCustomBody(template.body); setBodyTouched(false); }}
                                            className="text-[11px] text-ink-3 hover:text-ink flex items-center gap-1"
                                        >
                                            <RotateCcw size={11} /> Şablona dön
                                        </button>
                                    )}
                                </div>
                                <textarea
                                    value={customBody}
                                    onChange={(e) => { setCustomBody(e.target.value); setBodyTouched(true); }}
                                    rows={14}
                                    className="w-full bg-surface/[0.04] border border-line rounded-2xl p-3 text-sm text-ink-2 font-mono leading-relaxed focus:outline-none focus:border-brand/40 resize-none"
                                />

                                {/* Randevu şablonları için ek alanlar */}
                                {customBody.includes('{gorusmeTarihi}') && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            value={extras.gorusmeTarihi}
                                            onChange={(e) => setExtras((p) => ({ ...p, gorusmeTarihi: e.target.value }))}
                                            placeholder="Görüşme tarihi (Çarşamba 15:00)"
                                            className="bg-surface/[0.04] border border-line rounded-xl px-3 py-2 text-xs text-ink placeholder-white/30 focus:outline-none focus:border-brand/40"
                                        />
                                        <input
                                            value={extras.gorusmeYeri}
                                            onChange={(e) => setExtras((p) => ({ ...p, gorusmeYeri: e.target.value }))}
                                            placeholder="Yer (Rehberlik Servisi)"
                                            className="bg-surface/[0.04] border border-line rounded-xl px-3 py-2 text-xs text-ink placeholder-white/30 focus:outline-none focus:border-brand/40"
                                        />
                                    </div>
                                )}

                                {/* Değişken listesi */}
                                <details className="bg-surface/[0.03] border border-line rounded-2xl">
                                    <summary className="px-3 py-2 text-xs font-bold text-ink-3 cursor-pointer select-none">
                                        Kullanılabilir değişkenler
                                    </summary>
                                    <div className="px-3 pb-3 flex flex-wrap gap-1">
                                        {wa.TEMPLATE_VARIABLES.map((v) => (
                                            <button
                                                key={v.key}
                                                onClick={() => { setCustomBody((b) => `${b}{${v.key}}`); setBodyTouched(true); }}
                                                title={v.label}
                                                className="text-[10px] font-mono px-2 py-1 rounded-lg bg-surface/5 text-brand hover:bg-brand/15 transition"
                                            >
                                                {`{${v.key}}`}
                                            </button>
                                        ))}
                                    </div>
                                </details>

                                {missingVars.length > 0 && (
                                    <div className="flex items-start gap-2 p-3 rounded-2xl bg-brand/10 border border-brand/25">
                                        <AlertTriangle size={14} className="text-brand shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-brand/90 leading-snug">
                                            Bu öğrenci için veri yok: {missingVars.map((v) => `{${v}}`).join(', ')}.
                                            Mesajda "—" olarak görünecek.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Sağ: önizleme */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black uppercase tracking-widest text-ink-3 flex items-center gap-1.5">
                                        <Eye size={12} /> Önizleme
                                    </label>
                                    {reachable.length > 1 && (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                                                disabled={previewIndex === 0}
                                                className="p-1 rounded-lg text-ink-3 hover:text-ink disabled:opacity-20"
                                            >
                                                <ChevronLeft size={14} />
                                            </button>
                                            <span className="text-[11px] text-ink-3 tabular-nums">
                                                {previewIndex + 1}/{reachable.length}
                                            </span>
                                            <button
                                                onClick={() => setPreviewIndex((i) => Math.min(reachable.length - 1, i + 1))}
                                                disabled={previewIndex >= reachable.length - 1}
                                                className="p-1 rounded-lg text-ink-3 hover:text-ink disabled:opacity-20"
                                            >
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* WhatsApp baloncuğu */}
                                <div className="rounded-2xl p-4 bg-[#0b141a] border border-line">
                                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-line">
                                        <div className="w-8 h-8 rounded-full bg-ok/20 flex items-center justify-center text-xs font-black text-ok">
                                            {(previewStudent?.name || '?').charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-ink text-xs font-bold truncate">
                                                {audience === 'parent'
                                                    ? `${previewStudent?.parentName || 'Veli'} (${previewStudent?.name || ''})`
                                                    : previewStudent?.name || '—'}
                                            </p>
                                            <p className="text-ink-3 text-[10px]">
                                                {wa.formatPhoneDisplay(previewStudent ? phoneFor(previewStudent) : '')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-[#005c4b] rounded-2xl rounded-tr-md p-3 ml-6">
                                        <pre className="text-[13px] text-ink/95 whitespace-pre-wrap font-sans leading-relaxed">
                                            {previewMessage || 'Mesaj boş'}
                                        </pre>
                                    </div>
                                    <p className="text-right text-[10px] text-ink-3 mt-1.5">
                                        {previewMessage.length} karakter
                                    </p>
                                </div>

                                <button
                                    onClick={copyMessage}
                                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-line text-ink-2 text-xs font-bold hover:bg-surface/5 transition"
                                >
                                    <Copy size={12} /> {copied ? 'Kopyalandı' : 'Mesajı kopyala'}
                                </button>

                                {/* Özet */}
                                <div className="rounded-2xl bg-surface/[0.03] border border-line p-3 space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-ink-3">Gönderilecek</span>
                                        <span className="text-ok font-black">{reachable.length} kişi</span>
                                    </div>
                                    {unreachable.length > 0 && (
                                        <>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-ink-3">Numarası olmayan</span>
                                                <span className="text-danger font-black">{unreachable.length} kişi</span>
                                            </div>
                                            <p className="text-[10px] text-ink-3 leading-snug">
                                                {unreachable.slice(0, 6).map((s) => s.name).join(', ')}
                                                {unreachable.length > 6 ? ` +${unreachable.length - 6} kişi` : ''}
                                                {' '}— öğrenci kartından {audience === 'parent' ? 'veli telefonu' : 'telefon'} ekleyin.
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Gönderim sonucu */}
                    {result && (
                        <div className="mt-5 p-4 rounded-2xl bg-accent/10 border border-accent/30">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 size={16} className="text-accent" />
                                <p className="text-accent font-bold text-sm">
                                    {result.sent} sekme açıldı{result.failed > 0 ? `, ${result.failed} başarısız` : ''}
                                </p>
                            </div>
                            <p className="text-ink-3 text-[11px] leading-snug">
                                Her sekmede WhatsApp mesajı hazır olarak açıldı. Göndermek için her birinde
                                gönder tuşuna basmanız gerekiyor — bu, yanlışlıkla mesaj gitmesini önler.
                            </p>
                            {result.results.filter((r) => !r.success && r.link).map((r, i) => (
                                <a
                                    key={i}
                                    href={r.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 mt-2 text-xs text-brand hover:underline"
                                >
                                    <ExternalLink size={12} /> {r.item.studentName} — elle aç
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Alt bar ────────────────────────────── */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-line bg-black/20">
                    <button
                        onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
                        className="px-4 py-2.5 rounded-xl text-ink-3 font-bold text-sm hover:text-ink hover:bg-surface/5 transition"
                    >
                        {step === 0 ? 'Vazgeç' : 'Geri'}
                    </button>

                    {step < 2 ? (
                        <button
                            onClick={() => setStep((s) => s + 1)}
                            disabled={!canProceed}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand text-ink-on font-black text-sm disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95"
                        >
                            Devam <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSend}
                            disabled={sending || reachable.length === 0}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-ok text-ink-on font-black text-sm disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95"
                        >
                            {sending ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    {progress ? `${progress.current}/${progress.total}` : 'Gönderiliyor'}
                                </>
                            ) : (
                                <>
                                    <Send size={16} /> {reachable.length} kişiye gönder
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WhatsAppComposer;
