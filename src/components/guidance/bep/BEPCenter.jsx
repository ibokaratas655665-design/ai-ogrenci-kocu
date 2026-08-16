/**
 * 🎓 BEP MERKEZİ
 *
 * BEP'i tek bir belge sihirbazı olmaktan çıkarıp sürecin tamamını
 * yöneten bir modüle dönüştürür:
 *
 *   Öğrenciler → BEP Birimi → Performans → Plan → Toplantılar → Gelişim Raporu
 *
 * Her aşamanın kendi PDF çıktısı vardır.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
    Users, UserCog, Gauge, FileText, CalendarCheck, TrendingUp,
    Plus, Trash2, Download, X, ChevronRight, CheckCircle2, AlertCircle,
} from 'lucide-react';
import bep from '../../../services/bepService';
import bepPdf from '../../../utils/bepPdf';
import { SCHOOL_TYPES, coursesForSchoolType, BEP_TEAM_ROLES, roleTeaches, DEVELOPMENT_AREAS, suggestedAreas, PERFORMANCE_LEVELS, TEACHING_METHODS, TEACHING_MATERIALS, EVALUATION_METHODS, SUPPORT_PROGRAMS } from '../../../data/bepCurriculum';
import BEPGenerator from '../../BEPGenerator';

const STAGES = [
    { id: 'students', icon: Users, label: 'Öğrenciler' },
    { id: 'team', icon: UserCog, label: 'BEP Birimi' },
    { id: 'performance', icon: Gauge, label: 'Performans' },
    { id: 'plan', icon: FileText, label: 'BEP Planı' },
    { id: 'meetings', icon: CalendarCheck, label: 'Toplantılar' },
    { id: 'progress', icon: TrendingUp, label: 'Gelişim Raporu' },
];

/**
 * Ders listesi öğrencinin EĞİTİM ORTAMINA göre gelir.
 * (Eskiden TYT/AYT/LGS sınav müfredatından türetiliyordu — BEP'te
 *  öğrenci sınava değil, özel eğitim ders çizelgesine tabidir.)
 */
const coursesFor = (student) => coursesForSchoolType(student?.schoolType);

const BEPCenter = ({ students = [], setToast }) => {
    const [stage, setStage] = useState('students');
    const [selectedId, setSelectedId] = useState(null);
    const [version, setVersion] = useState(0);

    const refresh = useCallback(() => setVersion((v) => v + 1), []);
    const notify = useCallback((m) => setToast?.(m), [setToast]);

    const overview = useMemo(() => bep.getOverview(), [version]);
    const selected = useMemo(
        () => overview.rows.find((r) => r.id === selectedId) || null,
        [overview, selectedId]
    );

    return (
        <div className="space-y-5">

            {/* ── Süreç şeridi ─────────────────────────── */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {STAGES.map((s, i) => {
                    const active = stage === s.id;
                    const locked = s.id !== 'students' && !selectedId;
                    return (
                        <button
                            key={s.id}
                            onClick={() => !locked && setStage(s.id)}
                            disabled={locked}
                            title={locked ? 'Önce bir öğrenci seçin' : undefined}
                            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition ${
                                active
                                    ? 'bg-accent text-white shadow-lg shadow-e2'
                                    : locked
                                        ? 'bg-surface/[0.03] text-ink-3 cursor-not-allowed'
                                        : 'bg-surface/[0.04] text-ink-3 hover:text-ink-2'
                            }`}
                        >
                            <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center ${
                                active ? 'bg-surface/25' : 'bg-surface/10'
                            }`}>{i + 1}</span>
                            <s.icon size={13} /> {s.label}
                        </button>
                    );
                })}
            </div>

            {/* ── Seçili öğrenci başlığı ───────────────── */}
            {selected && (
                <div className="premium-card p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent font-black text-sm">
                        {(selected.name || '?').charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-ink font-black text-sm truncate">{selected.name}</p>
                        <p className="text-ink-3 text-[11px] truncate">
                            {selected.class} · {selected.disabilityType}
                        </p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-ink-3">Süreç</p>
                        <p className={`text-lg font-black leading-none ${
                            selected.status.completion === 100 ? 'text-ok' : 'text-brand'
                        }`}>
                            %{selected.status.completion}
                        </p>
                    </div>
                    <button
                        onClick={() => { setSelectedId(null); setStage('students'); }}
                        className="p-2 rounded-xl text-ink-3 hover:text-ink hover:bg-surface/10 transition shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* ── Aşamalar ─────────────────────────────── */}
            {stage === 'students' && (
                <StudentsStage
                    overview={overview}
                    schoolStudents={students}
                    onSelect={(id) => { setSelectedId(id); setStage('team'); }}
                    onChange={refresh}
                    notify={notify}
                />
            )}
            {stage === 'team' && selected && <TeamStage student={selected} onChange={refresh} notify={notify} />}
            {stage === 'performance' && selected && <PerformanceStage student={selected} onChange={refresh} notify={notify} />}
            {stage === 'plan' && selected && <PlanStage student={selected} onChange={refresh} notify={notify} students={students} />}
            {stage === 'meetings' && selected && <MeetingsStage student={selected} onChange={refresh} notify={notify} />}
            {stage === 'progress' && selected && <ProgressStage student={selected} onChange={refresh} notify={notify} />}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════
//  1. ÖĞRENCİLER
// ══════════════════════════════════════════════════════════════
const StudentsStage = ({ overview, schoolStudents, onSelect, onChange, notify }) => {
    const [showForm, setShowForm] = useState(false);
    const [showBulk, setShowBulk] = useState(false);

    const del = (id, name) => {
        if (!window.confirm(`${name} ve tüm BEP kayıtları silinecek. Emin misiniz?`)) return;
        bep.remove('students', id);
        onChange();
        notify?.('BEP kaydı silindi');
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <Stat label="BEP Öğrencisi" value={overview.total} color="var(--accent)" />
                <Stat label="Tamamlanan" value={overview.complete} color="var(--ok)" />
                <Stat label="Eksik Süreç" value={overview.incomplete} color="var(--highlight)" />
                <Stat label="Ortalama" value={`%${overview.avgCompletion}`} color="var(--info)" />
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-accent text-white font-black text-xs active:scale-95 transition"
                >
                    <Plus size={14} /> BEP Öğrencisi Ekle
                </button>
                {schoolStudents.length > 0 && (
                    <button
                        onClick={() => setShowBulk(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-accent/40 text-accent font-black text-xs hover:bg-accent/10 transition"
                    >
                        <Users size={14} /> Toplu Ekle
                    </button>
                )}
                {overview.rows.length > 0 && (
                    <button
                        onClick={() => bepPdf.exportStudentList({ rows: overview.rows })}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-line text-ink-2 font-black text-xs hover:bg-surface/5 transition"
                    >
                        <Download size={14} /> Listeyi PDF İndir
                    </button>
                )}
            </div>

            {overview.rows.length === 0 ? (
                <div className="premium-card p-12 text-center">
                    <Users size={34} className="text-ink-3 mx-auto mb-3" />
                    <p className="text-ink-3 text-sm font-bold">Henüz BEP öğrencisi kaydı yok</p>
                    <p className="text-ink-3 text-xs mt-1.5 max-w-md mx-auto leading-relaxed">
                        RAM raporu bulunan, kaynaştırma/bütünleştirme yoluyla eğitim gören öğrencileri
                        buraya ekleyin. Her öğrenci için BEP süreci ayrı yürütülür.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {overview.rows.map((r) => (
                        <div key={r.id} className="premium-card p-3.5 flex items-center gap-3">
                            <button onClick={() => onSelect(r.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                                <div className="w-9 h-9 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent font-black text-xs shrink-0">
                                    {(r.name || '?').charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-ink font-bold text-sm truncate">{r.name}</p>
                                    <p className="text-ink-3 text-[11px] truncate">
                                        {r.class} · {r.disabilityType}
                                    </p>
                                </div>
                                <div className="w-28 shrink-0">
                                    <div className="h-1.5 rounded-full bg-surface/8 overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${r.status.completion}%`,
                                                backgroundColor: r.status.completion === 100 ? 'var(--ok)' : 'var(--highlight)',
                                            }}
                                        />
                                    </div>
                                    <p className="text-[9px] text-ink-3 mt-1 truncate">
                                        {r.status.completion === 100
                                            ? 'Süreç tamam'
                                            : `Eksik: ${r.status.missing[0]}`}
                                    </p>
                                </div>
                                <ChevronRight size={16} className="text-ink-3 shrink-0" />
                            </button>
                            <button
                                onClick={() => del(r.id, r.name)}
                                className="p-2 rounded-xl text-ink-3 hover:text-danger hover:bg-danger/10 transition shrink-0"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <StudentForm
                    schoolStudents={schoolStudents}
                    onClose={() => setShowForm(false)}
                    onSave={(data) => {
                        bep.add('students', data);
                        setShowForm(false);
                        onChange();
                        notify?.('BEP öğrencisi eklendi');
                    }}
                />
            )}

            {showBulk && (
                <BulkStudentForm
                    schoolStudents={schoolStudents}
                    existing={overview.rows}
                    onClose={() => setShowBulk(false)}
                    onSave={(list) => {
                        list.forEach((d) => bep.add('students', d));
                        setShowBulk(false);
                        onChange();
                        notify?.(`${list.length} BEP öğrencisi eklendi`);
                    }}
                />
            )}
        </div>
    );
};

/**
 * Toplu BEP öğrencisi ekleme — okul listesinden çoklu seçim.
 * Yetersizlik türü / okul türü tüm seçime ortak uygulanır, sonradan
 * öğrenci bazında düzenlenebilir.
 */
const BulkStudentForm = ({ schoolStudents, existing = [], onClose, onSave }) => {
    const [query, setQuery] = useState('');
    const [picked, setPicked] = useState([]);
    const [common, setCommon] = useState({
        disabilityType: bep.DISABILITY_TYPES[0],
        schoolType: 'kaynastirma',
        inclusionType: bep.INCLUSION_TYPES[0],
        supportProgram: '',
        iepStartDate: new Date().toISOString().slice(0, 10),
    });
    const set = (k) => (e) => setCommon((p) => ({ ...p, [k]: e.target.value }));

    const alreadyIn = new Set(existing.map((r) => String(r.studentId)));
    const norm = (s) => String(s || '').toLocaleLowerCase('tr-TR');
    const list = schoolStudents
        .filter((s) => !alreadyIn.has(String(s.id)))
        .filter((s) => !query.trim() || norm(s.name).includes(norm(query)));

    const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

    const submit = () => {
        const rows = picked.map((id) => {
            const s = schoolStudents.find((x) => String(x.id) === String(id));
            return {
                ...common,
                studentId: String(id),
                name: s?.name || '',
                class: [s?.grade, s?.section].filter(Boolean).join('-'),
                ramReport: '', ramDate: '', notes: '',
            };
        }).filter((r) => r.name);
        if (rows.length) onSave(rows);
    };

    return (
        <Modal
            title={`Toplu BEP Öğrencisi Ekle${picked.length ? ` (${picked.length})` : ''}`}
            onClose={onClose}
            onSave={submit}
            canSave={picked.length > 0}
        >
            <div className="grid grid-cols-2 gap-3">
                <Field label="Yetersizlik Türü (ortak)">
                    <select value={common.disabilityType} onChange={set('disabilityType')} className={inputCls}>
                        {bep.DISABILITY_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                </Field>
                <Field label="Eğitim Ortamı (ortak)">
                    <select value={common.inclusionType} onChange={set('inclusionType')} className={inputCls}>
                        {bep.INCLUSION_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                </Field>
            </div>
            <Field label="Okul Türü / Ders Çizelgesi (ortak)">
                <select value={common.schoolType} onChange={set('schoolType')} className={inputCls}>
                    {Object.values(SCHOOL_TYPES).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
            </Field>

            <Field label="Öğrenci ara">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="İsim yazın…"
                    className={inputCls}
                />
            </Field>

            <div className="flex items-center justify-between px-1">
                <p className="text-[11px] text-ink-3">{list.length} öğrenci listeleniyor</p>
                <button
                    onClick={() => setPicked(picked.length === list.length ? [] : list.map((s) => s.id))}
                    className="text-[11px] font-black text-accent hover:underline"
                >
                    {picked.length === list.length && list.length > 0 ? 'Seçimi kaldır' : 'Tümünü seç'}
                </button>
            </div>

            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {list.length === 0 && (
                    <p className="text-ink-3 text-xs text-center py-6">
                        Eklenebilecek öğrenci bulunamadı.
                    </p>
                )}
                {list.map((s) => {
                    const on = picked.includes(s.id);
                    return (
                        <button
                            key={s.id}
                            onClick={() => toggle(s.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition ${
                                on
                                    ? 'bg-accent/15 border-accent/40'
                                    : 'bg-surface/[0.02] border-line hover:border-white/15'
                            }`}
                        >
                            <span className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                on ? 'bg-accent border-accent' : 'border-line-2'
                            }`}>
                                {on && <CheckCircle2 size={11} className="text-ink" />}
                            </span>
                            <span className="text-ink-2 text-xs font-bold flex-1 min-w-0 truncate">{s.name}</span>
                            <span className="text-ink-3 text-[11px] shrink-0">{s.grade}{s.section}</span>
                        </button>
                    );
                })}
            </div>
        </Modal>
    );
};

const StudentForm = ({ schoolStudents, onClose, onSave }) => {
    const [f, setF] = useState({
        studentId: '', name: '', class: '', disabilityType: bep.DISABILITY_TYPES[0],
        schoolType: 'kaynastirma', supportProgram: '',
        inclusionType: bep.INCLUSION_TYPES[0], ramReport: '', ramDate: '', iepStartDate: '', notes: '',
    });
    const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

    const pickStudent = (e) => {
        const s = schoolStudents.find((x) => String(x.id) === e.target.value);
        setF((p) => ({
            ...p,
            studentId: e.target.value,
            name: s?.name || p.name,
            class: [s?.grade, s?.section].filter(Boolean).join('-') || p.class,
        }));
    };

    return (
        <Modal title="BEP Öğrencisi Ekle" onClose={onClose} onSave={() => f.name && onSave(f)} canSave={!!f.name}>
            <Field label="Okul listesinden seç">
                <select value={f.studentId} onChange={pickStudent} className={inputCls}>
                    <option value="">— Elle gireceğim —</option>
                    {schoolStudents.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.grade}{s.section})</option>
                    ))}
                </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Adı Soyadı *"><input value={f.name} onChange={set('name')} className={inputCls} /></Field>
                <Field label="Sınıf / Şube"><input value={f.class} onChange={set('class')} className={inputCls} placeholder="7-B" /></Field>
            </div>
            <Field label="Yetersizlik Türü">
                <select value={f.disabilityType} onChange={set('disabilityType')} className={inputCls}>
                    {bep.DISABILITY_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
            </Field>
            <Field label="Eğitim Ortamı">
                <select value={f.inclusionType} onChange={set('inclusionType')} className={inputCls}>
                    {bep.INCLUSION_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
            </Field>

            {/* Ders listesi buradan belirlenir — sınav müfredatından değil */}
            <Field label="Okul Türü / Ders Çizelgesi">
                <select value={f.schoolType} onChange={set('schoolType')} className={inputCls}>
                    {Object.values(SCHOOL_TYPES).map((t) => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                </select>
                <p className="text-[10px] text-ink-3 mt-1 leading-snug">
                    {SCHOOL_TYPES[f.schoolType]?.note || 'Performans ve plan aşamalarındaki ders listesi bu seçime göre gelir.'}
                </p>
            </Field>

            <Field label="Destek Eğitim Programı (varsa)">
                <select value={f.supportProgram} onChange={set('supportProgram')} className={inputCls}>
                    <option value="">— Yok —</option>
                    {SUPPORT_PROGRAMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
            </Field>

            {/* Yetersizlik türüne göre öncelikli gelişim alanları */}
            {suggestedAreas(f.disabilityType).length > 0 && (
                <div className="rounded-xl bg-accent/8 border border-accent/20 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1.5">
                        Öncelikli Gelişim Alanları
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {suggestedAreas(f.disabilityType).map((a) => (
                            <span key={a.key} className="text-[11px] font-bold px-2 py-1 rounded-lg bg-surface/5 text-ink-2">
                                {a.icon} {a.label}
                            </span>
                        ))}
                    </div>
                    <p className="text-[10px] text-ink-3 mt-1.5 leading-snug">
                        BEP amaçları bu alanlardan yazılır; performans aşamasında listelenir.
                    </p>
                </div>
            )}
            <div className="grid grid-cols-2 gap-3">
                <Field label="RAM Rapor No"><input value={f.ramReport} onChange={set('ramReport')} className={inputCls} /></Field>
                <Field label="RAM Rapor Tarihi"><input type="date" value={f.ramDate} onChange={set('ramDate')} className={inputCls} /></Field>
            </div>
            <Field label="BEP Başlangıç Tarihi"><input type="date" value={f.iepStartDate} onChange={set('iepStartDate')} className={inputCls} /></Field>
            <Field label="Notlar"><textarea value={f.notes} onChange={set('notes')} rows={2} className={inputCls} /></Field>
        </Modal>
    );
};

// ══════════════════════════════════════════════════════════════
//  2. BEP BİRİMİ (derse giren öğretmenler)
// ══════════════════════════════════════════════════════════════
const TeamStage = ({ student, onChange, notify }) => {
    const [showForm, setShowForm] = useState(false);
    const rows = bep.list('teachers', { bepStudentId: student.id });

    return (
        <div className="space-y-4">
            <Intro
                title="BEP Geliştirme Birimi"
                text="Yönetmelik gereği birim; okul müdürü başkanlığında rehber öğretmen, sınıf/ders öğretmenleri, veli ve gerektiğinde öğrenciden oluşur. Buraya eklediğiniz kişiler tutanak ve plan PDF'lerinde otomatik yer alır."
            />

            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-accent text-white font-black text-xs active:scale-95 transition"
                >
                    <Plus size={14} /> Birim Üyesi Ekle
                </button>
                {rows.length > 0 && (
                    <button
                        onClick={() => bepPdf.exportTeamList({ student, teachers: rows })}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-line text-ink-2 font-black text-xs hover:bg-surface/5 transition"
                    >
                        <Download size={14} /> Birim Listesini PDF İndir
                    </button>
                )}
            </div>

            {rows.length === 0 ? (
                <Empty icon={UserCog} text="Henüz birim üyesi eklenmemiş" />
            ) : (
                <div className="space-y-2">
                    {rows.map((t) => (
                        <Row
                            key={t.id}
                            title={t.name}
                            subtitle={[t.role, t.branch].filter(Boolean).join(' · ')}
                            extra={t.phone}
                            onDelete={() => { bep.remove('teachers', t.id); onChange(); }}
                        />
                    ))}
                </div>
            )}

            {showForm && (
                <TeacherForm
                    student={student}
                    onClose={() => setShowForm(false)}
                    onSave={(rows) => {
                        rows.forEach((d) => bep.add('teachers', { ...d, bepStudentId: student.id }));
                        setShowForm(false); onChange();
                        notify?.(`${rows.length} birim üyesi eklendi`);
                    }}
                />
            )}
        </div>
    );
};

/**
 * Birim üyesi ekleme — toplu.
 *
 * Rol-ders mantığı: PDR/rehber öğretmen, birim başkanı (müdür yrd.),
 * veli, öğrenci ve RAM temsilcisi DERSE GİRMEZ; onlara ders sormak
 * formu yanlış dolduruyordu. Sınıf öğretmeninde ders seçimi isteğe bağlı.
 */
const TeacherForm = ({ student, onClose, onSave }) => {
    const courses = coursesFor(student);
    const blank = () => ({ name: '', roleId: 'dersOgretmeni', branch: '', phone: '', email: '' });
    const [rows, setRows] = useState([blank()]);

    const setRow = (i, k, v) => setRows((p) => p.map((r, idx) => {
        if (idx !== i) return r;
        const next = { ...r, [k]: v };
        // Derse girmeyen role geçilince ders alanı temizlenir
        if (k === 'roleId' && !roleTeaches(v)) next.branch = '';
        return next;
    }));

    const valid = rows.filter((r) => r.name.trim());

    const submit = () => {
        if (!valid.length) return;
        onSave(valid.map((r) => {
            const role = BEP_TEAM_ROLES.find((x) => x.id === r.roleId);
            return {
                name: r.name.trim(),
                role: role?.label || r.roleId,
                roleId: r.roleId,
                branch: roleTeaches(r.roleId) ? r.branch : '',
                phone: r.phone.trim(),
                email: r.email.trim(),
            };
        }));
    };

    return (
        <Modal
            title={`Birim Üyesi Ekle${valid.length > 1 ? ` (${valid.length})` : ''}`}
            onClose={onClose}
            onSave={submit}
            canSave={valid.length > 0}
        >
            <p className="text-[11px] text-ink-3 leading-relaxed">
                Birden fazla satır ekleyerek tüm birimi tek seferde kaydedebilirsiniz.
                Ders alanı yalnızca derse giren roller için açılır.
            </p>

            <div className="space-y-3 max-h-[46vh] overflow-y-auto pr-1">
                {rows.map((r, i) => {
                    const teaches = roleTeaches(r.roleId);
                    const role = BEP_TEAM_ROLES.find((x) => x.id === r.roleId);
                    return (
                        <div key={i} className="rounded-2xl border border-line bg-surface/[0.02] p-3 space-y-2.5">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-ink-3 w-5">{i + 1}.</span>
                                <input
                                    value={r.name}
                                    onChange={(e) => setRow(i, 'name', e.target.value)}
                                    placeholder="Adı Soyadı"
                                    className={inputCls}
                                />
                                {rows.length > 1 && (
                                    <button
                                        onClick={() => setRows((p) => p.filter((_, x) => x !== i))}
                                        className="p-2 rounded-xl text-ink-3 hover:text-danger shrink-0"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>

                            <div className={`grid gap-2 ${teaches ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                <select
                                    value={r.roleId}
                                    onChange={(e) => setRow(i, 'roleId', e.target.value)}
                                    className={inputCls}
                                >
                                    {BEP_TEAM_ROLES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                                </select>

                                {teaches && (
                                    <select
                                        value={r.branch}
                                        onChange={(e) => setRow(i, 'branch', e.target.value)}
                                        className={inputCls}
                                    >
                                        <option value="">
                                            {role?.optionalCourse ? '— Ders (isteğe bağlı) —' : '— Girdiği ders —'}
                                        </option>
                                        {courses.map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                )}
                            </div>

                            {!teaches && (
                                <p className="text-[10px] text-ink-3 pl-7">
                                    Bu rol derse girmez — ders seçimi istenmez.
                                </p>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <input value={r.phone} onChange={(e) => setRow(i, 'phone', e.target.value)} placeholder="Telefon" className={inputCls} />
                                <input value={r.email} onChange={(e) => setRow(i, 'email', e.target.value)} placeholder="E-posta" className={inputCls} />
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={() => setRows((p) => [...p, blank()])}
                className="w-full py-2.5 rounded-xl border border-dashed border-white/15 text-ink-3 text-xs font-black hover:border-accent/50 hover:text-accent transition flex items-center justify-center gap-1.5"
            >
                <Plus size={14} /> Satır Ekle
            </button>
        </Modal>
    );
};

// ══════════════════════════════════════════════════════════════
//  3. PERFORMANS
// ══════════════════════════════════════════════════════════════
const PerformanceStage = ({ student, onChange, notify }) => {
    const [showForm, setShowForm] = useState(false);
    const rows = bep.list('performances', { bepStudentId: student.id });

    return (
        <div className="space-y-4">
            <Intro
                title="Eğitsel Performans Düzeyi"
                text="BEP hazırlamanın ilk adımı: öğrencinin her derste ŞU AN yapabildiklerini belirlemek. Amaçlar bu düzeyin bir üstünden başlar."
            />

            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-accent text-white font-black text-xs active:scale-95 transition"
                >
                    <Plus size={14} /> Performans Kaydı Ekle
                </button>
                {rows.length > 0 && (
                    <button
                        onClick={() => bepPdf.exportPerformance({ student, performances: rows })}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-line text-ink-2 font-black text-xs hover:bg-surface/5 transition"
                    >
                        <Download size={14} /> Formu PDF İndir
                    </button>
                )}
            </div>

            {rows.length === 0 ? (
                <Empty icon={Gauge} text="Henüz performans kaydı yok" />
            ) : (
                <div className="space-y-2">
                    {rows.map((p) => (
                        <div key={p.id} className="premium-card p-3.5">
                            <div className="flex items-start gap-3">
                                <div className="min-w-0 flex-1">
                                    <p className="text-ink font-bold text-sm">{p.course}
                                        <span className="ml-2 text-[10px] font-black px-2 py-0.5 rounded bg-surface/8 text-ink-3">
                                            {p.term}
                                        </span>
                                    </p>
                                    <p className="text-ink-3 text-xs mt-1 leading-relaxed">{p.level}</p>
                                    {(p.skills || []).length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {p.skills.map((s) => (
                                                <span
                                                    key={s.topic}
                                                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg border"
                                                    style={{
                                                        color: s.color,
                                                        borderColor: `${s.color}55`,
                                                        backgroundColor: `${s.color}18`,
                                                    }}
                                                    title={s.levelLabel}
                                                >
                                                    {s.topic} · {s.level}/5
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {p.strengths && <p className="text-[11px] text-ok/80 mt-1.5">💪 {p.strengths}</p>}
                                    {p.needs && <p className="text-[11px] text-brand/80 mt-0.5">🎯 {p.needs}</p>}
                                </div>
                                <button
                                    onClick={() => { bep.remove('performances', p.id); onChange(); }}
                                    className="p-2 rounded-xl text-ink-3 hover:text-danger hover:bg-danger/10 transition shrink-0"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <PerformanceForm
                    student={student}
                    onClose={() => setShowForm(false)}
                    onSave={(d) => {
                        bep.add('performances', { ...d, bepStudentId: student.id });
                        setShowForm(false); onChange(); notify?.('Performans kaydedildi');
                    }}
                />
            )}
        </div>
    );
};

/**
 * Performans kaydı — beceri bazlı ve toplu.
 *
 * Ders listesi öğrencinin okul türünden, beceri/kazanım listesi ise
 * yetersizlik türüne göre önerilen gelişim alanlarından gelir.
 * Her beceri 5'li ipucu silikleştirme ölçeğiyle işaretlenir.
 */
const PerformanceForm = ({ student, onClose, onSave }) => {
    const courses = coursesFor(student);
    const areas = suggestedAreas(student?.disabilityType);
    const allAreas = Object.entries(DEVELOPMENT_AREAS).map(([key, v]) => ({ key, ...v }));

    const [f, setF] = useState({
        course: '', areaKey: areas[0]?.key || 'akademik', term: '1. Dönem', level: '',
        strengths: '', needs: '', assessedBy: '', date: new Date().toISOString().slice(0, 10),
    });
    const [skills, setSkills] = useState([]);
    const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

    const area = DEVELOPMENT_AREAS[f.areaKey];
    const chosen = new Set(skills.map((s) => s.topic));

    const toggleTopic = (topic) => setSkills((p) => (
        p.some((s) => s.topic === topic)
            ? p.filter((s) => s.topic !== topic)
            : [...p, { topic, areaKey: f.areaKey, areaLabel: area?.label || '', level: 1, note: '' }]
    ));
    const setSkill = (topic, patch) =>
        setSkills((p) => p.map((s) => (s.topic === topic ? { ...s, ...patch } : s)));

    const submit = () => {
        if (!f.level.trim() && skills.length === 0) return;
        const lvl = (v) => PERFORMANCE_LEVELS.find((x) => x.value === v) || PERFORMANCE_LEVELS[0];
        onSave({
            ...f,
            areaLabel: area?.label || '',
            // Serbest metin boşsa becerilerden özet üretilir — PDF'te boş satır kalmasın
            level: f.level.trim() || skills.map((s) => `${s.topic}: ${lvl(s.level).label}`).join('; '),
            skills: skills.map((s) => ({
                ...s,
                levelLabel: lvl(s.level).label,
                color: lvl(s.level).color,
            })),
        });
    };

    return (
        <Modal
            title={`Performans Kaydı${skills.length ? ` · ${skills.length} beceri` : ''}`}
            onClose={onClose}
            onSave={submit}
            canSave={!!f.level.trim() || skills.length > 0}
        >
            <div className="grid grid-cols-2 gap-3">
                <Field label="Ders">
                    <select value={f.course} onChange={set('course')} className={inputCls}>
                        <option value="">— Ders seçiniz —</option>
                        {courses.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </Field>
                <Field label="Dönem">
                    <select value={f.term} onChange={set('term')} className={inputCls}>
                        <option>1. Dönem</option><option>2. Dönem</option><option>Yaz Dönemi</option>
                    </select>
                </Field>
            </div>

            <Field label="Gelişim Alanı">
                <select value={f.areaKey} onChange={set('areaKey')} className={inputCls}>
                    <optgroup label="Yetersizlik türüne göre öncelikli">
                        {areas.map((a) => <option key={a.key} value={a.key}>{a.icon} {a.label}</option>)}
                    </optgroup>
                    <optgroup label="Tüm alanlar">
                        {allAreas.filter((a) => !areas.some((x) => x.key === a.key))
                            .map((a) => <option key={a.key} value={a.key}>{a.icon} {a.label}</option>)}
                    </optgroup>
                </select>
            </Field>

            {/* Toplu beceri seçimi */}
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-ink-3 mb-1.5">
                    Beceri / Kazanım seçin (toplu)
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {(area?.topics || []).map((t) => (
                        <button
                            key={t}
                            onClick={() => toggleTopic(t)}
                            className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border transition ${
                                chosen.has(t)
                                    ? 'bg-accent/20 border-accent/50 text-accent'
                                    : 'bg-surface/[0.03] border-line text-ink-3 hover:text-ink-2'
                            }`}
                        >
                            {chosen.has(t) ? '✓ ' : '+ '}{t}
                        </button>
                    ))}
                </div>
            </div>

            {skills.length > 0 && (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {skills.map((s) => (
                        <div key={s.topic} className="rounded-2xl border border-line bg-surface/[0.02] p-2.5">
                            <div className="flex items-center gap-2 mb-2">
                                <p className="text-ink-2 text-[12px] font-bold flex-1 min-w-0 truncate">{s.topic}</p>
                                <button
                                    onClick={() => toggleTopic(s.topic)}
                                    className="p-1.5 rounded-lg text-ink-3 hover:text-danger shrink-0"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                            <div className="flex gap-1">
                                {PERFORMANCE_LEVELS.map((L) => (
                                    <button
                                        key={L.value}
                                        onClick={() => setSkill(s.topic, { level: L.value })}
                                        title={L.hint}
                                        className="flex-1 py-1.5 rounded-lg text-[10px] font-black border transition"
                                        style={
                                            s.level === L.value
                                                ? { backgroundColor: `${L.color}25`, borderColor: L.color, color: L.color }
                                                : { backgroundColor: 'rgba(255,255,255,.03)', borderColor: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.35)' }
                                        }
                                    >
                                        {L.value}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[9px] text-ink-3 mt-1">
                                {PERFORMANCE_LEVELS.find((L) => L.value === s.level)?.label}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            <Field label="Mevcut Performans Düzeyi (serbest açıklama)">
                <textarea
                    value={f.level} onChange={set('level')} rows={3} className={inputCls}
                    placeholder="Örn: 100'e kadar olan sayıları okur ve yazar, iki basamaklı toplama işlemini eldesiz yapar, eldeli toplamada sözel ipucuna ihtiyaç duyar."
                />
                <p className="text-[10px] text-ink-3 mt-1">
                    Boş bırakırsanız seçtiğiniz becerilerden otomatik özet yazılır.
                </p>
            </Field>
            <Field label="Güçlü Yönleri"><textarea value={f.strengths} onChange={set('strengths')} rows={2} className={inputCls} /></Field>
            <Field label="İhtiyaç Duyduğu Alanlar"><textarea value={f.needs} onChange={set('needs')} rows={2} className={inputCls} /></Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Değerlendiren"><input value={f.assessedBy} onChange={set('assessedBy')} className={inputCls} /></Field>
                <Field label="Tarih"><input type="date" value={f.date} onChange={set('date')} className={inputCls} /></Field>
            </div>
        </Modal>
    );
};

// ══════════════════════════════════════════════════════════════
//  4. BEP PLANI
// ══════════════════════════════════════════════════════════════
const PlanStage = ({ student, onChange, notify, students }) => {
    const [showGenerator, setShowGenerator] = useState(false);
    const rows = bep.list('plans', { bepStudentId: student.id });
    const teachers = bep.list('teachers', { bepStudentId: student.id });

    return (
        <div className="space-y-4">
            <Intro
                title="BEP Planı"
                text="Performans düzeyinden yola çıkarak uzun ve kısa dönemli amaçları belirleyin. Her ders için ayrı plan hazırlanır."
            />

            <button
                onClick={() => setShowGenerator(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-accent text-white font-black text-xs active:scale-95 transition"
            >
                <Plus size={14} /> Plan Hazırlama Motorunu Aç
            </button>

            {rows.length === 0 ? (
                <Empty icon={FileText} text="Henüz BEP planı hazırlanmamış" />
            ) : (
                <div className="space-y-2">
                    {rows.map((p) => (
                        <div key={p.id} className="premium-card p-3.5">
                            <div className="flex items-start gap-3">
                                <div className="min-w-0 flex-1">
                                    <p className="text-ink font-bold text-sm">{p.course}</p>
                                    <p className="text-ink-3 text-[11px]">
                                        {(p.longTermGoals || []).length} uzun dönemli · {(p.shortTermGoals || []).length} kısa dönemli amaç
                                    </p>
                                    <p className="text-ink-3 text-[10px] mt-0.5">
                                        {p.startDate} – {p.endDate}
                                    </p>
                                </div>
                                <button
                                    onClick={() => bepPdf.exportBepPlan({ student, plan: p, teachers })}
                                    className="p-2 rounded-xl text-ink-3 hover:text-brand hover:bg-brand/10 transition shrink-0"
                                    title="Planı PDF indir"
                                >
                                    <Download size={15} />
                                </button>
                                <button
                                    onClick={() => { bep.remove('plans', p.id); onChange(); }}
                                    className="p-2 rounded-xl text-ink-3 hover:text-danger hover:bg-danger/10 transition shrink-0"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* BEPGenerator kendi tam ekran perdesini ve kapatma butonunu
                oluşturuyor. Buraya ikinci bir perde + kutu sarmak iki pencereyi
                üst üste bindiriyor ve dıştaki kutunun kapatma butonu içteki
                başlığın altında kalıyordu. Doğrudan render ediliyor. */}
            {showGenerator && (
                <BEPGenerator
                    students={students}
                    closeModal={() => setShowGenerator(false)}
                    onSavePlan={(plan) => {
                        bep.add('plans', { ...plan, bepStudentId: student.id });
                        setShowGenerator(false); onChange(); notify?.('BEP planı kaydedildi');
                    }}
                />
            )}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════
//  5. TOPLANTILAR
// ══════════════════════════════════════════════════════════════
const MeetingsStage = ({ student, onChange, notify }) => {
    const [showForm, setShowForm] = useState(false);
    const rows = bep.list('meetings', { bepStudentId: student.id });
    const teachers = bep.list('teachers', { bepStudentId: student.id });

    return (
        <div className="space-y-4">
            <Intro
                title="BEP Geliştirme Birimi Toplantıları"
                text="Her toplantı için tutanak tutulması zorunludur. Katılımcılar birim listesinden otomatik gelir; tutanağı PDF olarak indirip imzaya açabilirsiniz."
            />

            <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-accent text-white font-black text-xs active:scale-95 transition"
            >
                <Plus size={14} /> Toplantı Kaydet
            </button>

            {rows.length === 0 ? (
                <Empty icon={CalendarCheck} text="Henüz toplantı kaydı yok" />
            ) : (
                <div className="space-y-2">
                    {rows.map((m) => (
                        <div key={m.id} className="premium-card p-3.5">
                            <div className="flex items-start gap-3">
                                <div className="min-w-0 flex-1">
                                    <p className="text-ink font-bold text-sm">{m.type}</p>
                                    <p className="text-ink-3 text-[11px]">
                                        {m.date} · {(m.attendees || []).length} katılımcı
                                        {m.nextDate ? ` · sonraki: ${m.nextDate}` : ''}
                                    </p>
                                    {m.decisions && (
                                        <p className="text-ink-3 text-[11px] mt-1 line-clamp-2">{m.decisions}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => bepPdf.exportMeetingMinutes({ student, meeting: m })}
                                    className="p-2 rounded-xl text-ink-3 hover:text-brand hover:bg-brand/10 transition shrink-0"
                                    title="Tutanağı PDF indir"
                                >
                                    <Download size={15} />
                                </button>
                                <button
                                    onClick={() => { bep.remove('meetings', m.id); onChange(); }}
                                    className="p-2 rounded-xl text-ink-3 hover:text-danger hover:bg-danger/10 transition shrink-0"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <MeetingForm
                    teachers={teachers}
                    onClose={() => setShowForm(false)}
                    onSave={(d) => {
                        bep.add('meetings', { ...d, bepStudentId: student.id });
                        setShowForm(false); onChange(); notify?.('Toplantı kaydedildi');
                    }}
                />
            )}
        </div>
    );
};

const MeetingForm = ({ teachers, onClose, onSave }) => {
    const [f, setF] = useState({
        type: bep.MEETING_TYPES[0],
        date: new Date().toISOString().slice(0, 10),
        nextDate: '', agenda: '', decisions: '',
        attendees: teachers.map((t) => ({ name: t.name, role: t.role })),
    });
    const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

    const toggle = (t) => setF((p) => ({
        ...p,
        attendees: p.attendees.some((a) => a.name === t.name)
            ? p.attendees.filter((a) => a.name !== t.name)
            : [...p.attendees, { name: t.name, role: t.role }],
    }));

    return (
        <Modal title="Toplantı Kaydı" onClose={onClose} onSave={() => onSave(f)} canSave>
            <Field label="Toplantı Türü">
                <select value={f.type} onChange={set('type')} className={inputCls}>
                    {bep.MEETING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Tarih"><input type="date" value={f.date} onChange={set('date')} className={inputCls} /></Field>
                <Field label="Sonraki Toplantı"><input type="date" value={f.nextDate} onChange={set('nextDate')} className={inputCls} /></Field>
            </div>
            <Field label="Katılımcılar">
                {teachers.length === 0 ? (
                    <p className="text-[11px] text-ink-3">Önce BEP Birimi bölümünden üye ekleyin.</p>
                ) : (
                    <div className="flex flex-wrap gap-1.5">
                        {teachers.map((t) => {
                            const on = f.attendees.some((a) => a.name === t.name);
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => toggle(t)}
                                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                                        on ? 'bg-accent text-ink' : 'bg-surface/5 text-ink-3'
                                    }`}
                                >
                                    {t.name}
                                </button>
                            );
                        })}
                    </div>
                )}
            </Field>
            <Field label="Gündem"><textarea value={f.agenda} onChange={set('agenda')} rows={3} className={inputCls} /></Field>
            <Field label="Alınan Kararlar"><textarea value={f.decisions} onChange={set('decisions')} rows={4} className={inputCls} /></Field>
        </Modal>
    );
};

// ══════════════════════════════════════════════════════════════
//  6. GELİŞİM RAPORU
// ══════════════════════════════════════════════════════════════
const ProgressStage = ({ student, onChange, notify }) => {
    const [showForm, setShowForm] = useState(false);
    const rows = bep.list('reports', { bepStudentId: student.id });
    const progress = bep.getGoalProgress(student.id);

    return (
        <div className="space-y-4">
            <Intro
                title="Bireysel Gelişim Raporu"
                text="Dönem sonunda amaçların ne kadarının kazanıldığını değerlendirin. Rapor veliyle paylaşılır ve bir sonraki dönemin planına temel oluşturur."
            />

            {progress.total > 0 && (
                <div className="premium-card p-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-ink-3">Amaç Gerçekleşme</p>
                        <p className="text-lg font-black text-ok">%{progress.percent}</p>
                    </div>
                    <div className="h-2 rounded-full bg-surface/8 overflow-hidden">
                        <div className="h-full rounded-full bg-ok" style={{ width: `${progress.percent}%` }} />
                    </div>
                    <p className="text-ink-3 text-[11px] mt-1.5">
                        {progress.achieved} / {progress.total} kısa dönemli amaç kazanıldı
                    </p>
                </div>
            )}

            <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-accent text-white font-black text-xs active:scale-95 transition"
            >
                <Plus size={14} /> Gelişim Raporu Yaz
            </button>

            {rows.length === 0 ? (
                <Empty icon={TrendingUp} text="Henüz gelişim raporu yok" />
            ) : (
                <div className="space-y-2">
                    {rows.map((r) => (
                        <div key={r.id} className="premium-card p-3.5 flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                                <p className="text-ink font-bold text-sm">{r.term} — {r.period}</p>
                                <p className="text-ink-3 text-[11px] mt-1 line-clamp-2">{r.summary}</p>
                            </div>
                            <button
                                onClick={() => bepPdf.exportProgressReport({ student, report: r, progress })}
                                className="p-2 rounded-xl text-ink-3 hover:text-brand hover:bg-brand/10 transition shrink-0"
                                title="Raporu PDF indir"
                            >
                                <Download size={15} />
                            </button>
                            <button
                                onClick={() => { bep.remove('reports', r.id); onChange(); }}
                                className="p-2 rounded-xl text-ink-3 hover:text-danger hover:bg-danger/10 transition shrink-0"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <ProgressForm
                    goals={progress.goals}
                    onClose={() => setShowForm(false)}
                    onSave={(d) => {
                        bep.add('reports', { ...d, bepStudentId: student.id });
                        setShowForm(false); onChange(); notify?.('Gelişim raporu kaydedildi');
                    }}
                />
            )}
        </div>
    );
};

const ProgressForm = ({ goals, onClose, onSave }) => {
    const [f, setF] = useState({
        term: '1. Dönem', period: 'Dönem Sonu', summary: '', recommendation: '',
        date: new Date().toISOString().slice(0, 10),
        goalProgress: goals.map((g) => ({ goal: g.goal, status: g.status })),
    });
    const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

    const cycle = (goal) => setF((p) => ({
        ...p,
        goalProgress: p.goalProgress.map((g) =>
            g.goal === goal
                ? { ...g, status: g.status === 'pending' ? 'partial' : g.status === 'partial' ? 'achieved' : 'pending' }
                : g
        ),
    }));

    const label = { pending: 'Devam ediyor', partial: 'Kısmen', achieved: 'Kazanıldı' };
    const color = { pending: 'var(--ink-3)', partial: 'var(--warn)', achieved: 'var(--ok)' };

    return (
        <Modal title="Gelişim Raporu" onClose={onClose} onSave={() => onSave(f)} canSave>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Dönem">
                    <select value={f.term} onChange={set('term')} className={inputCls}>
                        <option>1. Dönem</option><option>2. Dönem</option><option>Yıl Sonu</option>
                    </select>
                </Field>
                <Field label="Değerlendirme Zamanı">
                    <select value={f.period} onChange={set('period')} className={inputCls}>
                        <option>Ara Değerlendirme</option><option>Dönem Sonu</option><option>Yıl Sonu</option>
                    </select>
                </Field>
            </div>

            {f.goalProgress.length > 0 && (
                <Field label="Amaç Gerçekleşme (tıklayarak değiştirin)">
                    <div className="space-y-1.5 max-h-52 overflow-y-auto">
                        {f.goalProgress.map((g) => (
                            <button
                                key={g.goal}
                                onClick={() => cycle(g.goal)}
                                className="w-full flex items-center gap-2 p-2 rounded-lg bg-surface/[0.04] text-left hover:bg-surface/[0.07] transition"
                            >
                                <span className="flex-1 text-[11px] text-ink-2 truncate">{g.goal}</span>
                                <span
                                    className="text-[10px] font-black px-2 py-0.5 rounded shrink-0"
                                    style={{ backgroundColor: `${color[g.status]}22`, color: color[g.status] }}
                                >
                                    {label[g.status]}
                                </span>
                            </button>
                        ))}
                    </div>
                </Field>
            )}

            <Field label="Dönem Değerlendirmesi">
                <textarea value={f.summary} onChange={set('summary')} rows={4} className={inputCls}
                    placeholder="Öğrencinin dönem boyunca gösterdiği gelişim, karşılaşılan güçlükler..." />
            </Field>
            <Field label="Öneriler ve Sonraki Dönem Planı">
                <textarea value={f.recommendation} onChange={set('recommendation')} rows={3} className={inputCls} />
            </Field>
        </Modal>
    );
};

// ══════════════════════════════════════════════════════════════
//  Ortak parçalar
// ══════════════════════════════════════════════════════════════
const inputCls = 'w-full bg-surface/[0.04] border border-line rounded-xl px-3 py-2.5 text-sm text-ink placeholder-white/25 focus:outline-none focus:border-accent/50';

const Field = ({ label, children }) => (
    <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-ink-3 mb-1.5">{label}</label>
        {children}
    </div>
);

const Stat = ({ label, value, color }) => (
    <div className="premium-card p-3.5">
        <p className="text-[10px] font-black uppercase tracking-widest text-ink-3 mb-1">{label}</p>
        <p className="text-xl font-black leading-none" style={{ color }}>{value}</p>
    </div>
);

const Intro = ({ title, text }) => (
    <div className="premium-card p-4 border-l-2 border-l-[#1f8a7a]">
        <p className="text-ink font-black text-sm mb-1">{title}</p>
        <p className="text-ink-3 text-[11px] leading-relaxed">{text}</p>
    </div>
);

const Empty = ({ icon, text }) => {
    const Icon = icon;
    return (
    <div className="premium-card p-10 text-center">
        <Icon size={30} className="text-ink-3 mx-auto mb-2.5" />
        <p className="text-ink-3 text-sm font-bold">{text}</p>
    </div>
    );
};

const Row = ({ title, subtitle, extra, onDelete }) => (
    <div className="premium-card p-3.5 flex items-center gap-3">
        <div className="min-w-0 flex-1">
            <p className="text-ink font-bold text-sm truncate">{title}</p>
            <p className="text-ink-3 text-[11px] truncate">{subtitle}</p>
        </div>
        {extra && <span className="text-[11px] text-ink-3 shrink-0">{extra}</span>}
        <button
            onClick={onDelete}
            className="p-2 rounded-xl text-ink-3 hover:text-danger hover:bg-danger/10 transition shrink-0"
        >
            <Trash2 size={14} />
        </button>
    </div>
);

const Modal = ({ title, children, onClose, onSave, canSave }) => (
    <div className="fixed inset-0 z-modal-base bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-surface border border-line rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface flex items-center justify-between px-5 py-4 border-b border-line">
                <h3 className="text-ink font-black text-base syne">{title}</h3>
                <button onClick={onClose} className="p-2 rounded-xl text-ink-3 hover:text-ink hover:bg-surface/10 transition">
                    <X size={18} />
                </button>
            </div>
            <div className="p-5 space-y-4">{children}</div>
            <div className="sticky bottom-0 bg-surface flex gap-2 px-5 py-4 border-t border-line">
                <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-ink-3 font-bold text-sm hover:bg-surface/5 transition">
                    Vazgeç
                </button>
                <button
                    onClick={onSave}
                    disabled={!canSave}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-white font-black text-sm disabled:opacity-30 active:scale-95 transition"
                >
                    <CheckCircle2 size={16} /> Kaydet
                </button>
            </div>
        </div>
    </div>
);

export default BEPCenter;
