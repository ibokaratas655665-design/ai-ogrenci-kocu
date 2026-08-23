/**
 * 📗 GÜNLÜK ÇALIŞMA GİRİŞİ (öğrenci ekranı)
 *
 * Öğrenci her gün, konu konu:
 *   - kaç soru çözdüğünü (doğru / yanlış / boş)
 *   - kaç sayfa kitap okuduğunu
 * girer. Kayıt anında koçun karnesine düşer.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
    Plus, X, BookOpen, PencilLine, Trash2, Check, TrendingUp,
    CalendarDays, Target, ChevronDown,
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import studyLog from '../../services/studyLogService';
import { izgaraOzellikleri, eksenOzellikleri, ANIMASYON } from '../charts/grafikTemasi';
import { getSubjectColor, getSubjectLabel } from '../../data/programColors';
import Modal from '../ui/Modal';
import { ogrencininDersleri, dersinKonulari } from '../../utils/dersKonu';

/**
 * V1.1: Ders listesi artık öğrencinin ALANINDAN türetilir
 * (utils/dersKonu). Bu sabit liste yalnızca alan/sınav bilgisi hiç
 * çözülemezse devreye giren yedektir.
 */
const YEDEK_DERSLER = [
    'Matematik', 'Geometri', 'Türkçe', 'Edebiyat', 'Fizik', 'Kimya', 'Biyoloji',
    'Tarih', 'Coğrafya', 'Felsefe', 'Din Kültürü', 'İngilizce', 'Fen Bilimleri',
];

const DailyStudyLog = ({ studentId, ogrenci = null }) => {
    const [version, setVersion] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [formKind, setFormKind] = useState('soru');
    const [range, setRange] = useState(7);

    const refresh = useCallback(() => setVersion((v) => v + 1), []);

    const today = useMemo(() => studyLog.getToday(studentId), [studentId, version]);
    const summary = useMemo(() => studyLog.getSummary(studentId, range), [studentId, range, version]);
    const todayEntries = useMemo(
        () => studyLog.getEntries(studentId, { date: studyLog.todayKey() }),
        [studentId, version]
    );

    const save = (entry) => {
        studyLog.addEntry(studentId, entry);
        setShowForm(false);
        refresh();
    };

    const remove = (id) => {
        studyLog.removeEntry(id);
        refresh();
    };

    return (
        <div className="space-y-5">

            {/* ── Bugün ───────────────────────────────────── */}
            <div className="premium-card p-4">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-ink-3">Bugün</p>
                        <p className="text-ink-3 text-xs mt-0.5">
                            {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}
                        </p>
                    </div>
                    <div className="flex gap-1.5">
                        <button
                            onClick={() => { setFormKind('soru'); setShowForm(true); }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand text-ink-on font-black text-xs active:scale-95 transition"
                        >
                            <PencilLine size={14} /> Soru Ekle
                        </button>
                        <button
                            onClick={() => { setFormKind('kitap'); setShowForm(true); }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent text-white font-black text-xs active:scale-95 transition"
                        >
                            <BookOpen size={14} /> Sayfa Ekle
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Stat label="Çözülen Soru" value={today.questions} color="var(--highlight)" />
                    <Stat label="Net" value={today.net} color="var(--accent)" />
                    <Stat
                        label="İsabet"
                        value={today.accuracy != null ? `%${today.accuracy}` : '—'}
                        color={today.accuracy == null ? '#64748B' : today.accuracy >= 70 ? 'var(--ok)' : today.accuracy >= 50 ? '#F5A524' : 'var(--danger)'}
                    />
                    <Stat label="Kitap Sayfası" value={today.pages} color="var(--info)" />
                </div>

                {/* Bugünün kayıtları */}
                {todayEntries.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                        {todayEntries.map((e) => {
                            const c = getSubjectColor(e.subject);
                            return (
                                <div
                                    key={e.id}
                                    className="flex items-center gap-2.5 rounded-xl px-3 py-2"
                                    style={{ backgroundColor: `${c.border}12`, border: `1px solid ${c.border}30` }}
                                >
                                    <span className="text-sm">{e.kind === 'kitap' ? '📚' : '✏️'}</span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-ink text-xs font-bold truncate">
                                            {e.kind === 'kitap' ? e.subject : getSubjectLabel(e.subject)}
                                            {e.topic && <span className="text-ink-3 font-normal"> · {e.topic}</span>}
                                        </p>
                                        <p className="text-[10px] text-ink-3">
                                            {e.kind === 'kitap'
                                                ? `${e.pages} sayfa`
                                                : `${e.correct}D ${e.wrong}Y ${e.blank}B · net ${(Number(e.correct) - Number(e.wrong) / 4).toFixed(2)}`}
                                            {e.minutes ? ` · ${e.minutes} dk` : ''}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => remove(e.id)}
                                        className="p-1.5 rounded-lg text-ink-3 hover:text-danger hover:bg-danger/10 transition shrink-0"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Dönem özeti ─────────────────────────────── */}
            <div className="premium-card p-4">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-ink-3 flex items-center gap-1.5">
                        <CalendarDays size={12} /> Son {range} Gün
                    </p>
                    <div className="flex gap-1">
                        {[7, 30].map((r) => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                    range === r ? 'bg-brand text-ink-on' : 'text-ink-3 hover:text-ink-2'
                                }`}
                            >
                                {r} gün
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    <Stat label="Toplam Soru" value={summary.questions} color="var(--highlight)" />
                    <Stat label="Günlük Ort." value={summary.avgQuestionsPerDay} color="var(--accent)" />
                    <Stat label="Kitap Sayfası" value={summary.pages} color="var(--info)" />
                    <Stat label="Aktif Gün" value={`${summary.activeDays}/${range}`} color="var(--c4)" />
                </div>

                {/* GÜNLÜK TREND.
                    Eskiden burada eksensiz bir mini çubuk şeridi vardı: yalnızca
                    iki uç tarih yazıyordu, y ekseni yoktu ve bir çubuğun kaç
                    soruya karşılık geldiği okunamıyordu — biçim vardı, ölçü
                    yoktu. Ayrıca boş günün rengi sabit beyaz-alfa idi ve açık
                    temada zeminden ayırt edilemiyordu.

                    Alan grafiği aynı veriyi ölçülebilir kılar: ölçekli y ekseni,
                    tarihli ipucu, sürekli bir eğri. Trend soru sayısıyladır;
                    kitap sayfası ipucunda ayrıca yazar. */}
                {summary.questions > 0 && (
                    <div className="h-40 mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={summary.byDay} margin={{ top: 6, right: 8, bottom: 0, left: -22 }}>
                                <defs>
                                    <linearGradient id="gunlukTrend" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.28} />
                                        <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid {...izgaraOzellikleri()} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(d) => String(d).slice(5).replace('-', '.')}
                                    minTickGap={18}
                                    {...eksenOzellikleri()}
                                />
                                <YAxis allowDecimals={false} {...eksenOzellikleri()} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, fontSize: 12 }}
                                    labelFormatter={(d) => d}
                                    formatter={(v, ad, o) => [
                                        o?.payload?.pages ? `${v} soru · ${o.payload.pages} sayfa` : `${v} soru`,
                                        'Çalışma',
                                    ]}
                                />
                                <Area
                                    type="monotone" dataKey="questions" name="Soru"
                                    stroke="var(--brand)" strokeWidth={2.5}
                                    fill="url(#gunlukTrend)" dot={{ r: 2.5 }}
                                    animationDuration={ANIMASYON}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Ders bazlı */}
                {summary.bySubject.length > 0 ? (
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-ink-3 mb-1">
                            Ders bazlı
                        </p>
                        {summary.bySubject.map((s) => {
                            const c = getSubjectColor(s.subject);
                            return (
                                <div key={s.subject} className="flex items-center gap-2">
                                    <span className="w-20 shrink-0 text-[11px] font-black truncate" style={{ color: c.border }}>
                                        {getSubjectLabel(s.subject)}
                                    </span>
                                    {/* Zemin ve "boş" dilimi tema belirtecinden gelir.
                                        Sabit beyaz-alfa değerler açık temada beyaz
                                        üstünde beyaz kalıyordu: boş sorular
                                        görünmüyor, çubuk kısa görünüyordu. */}
                                    <div className="flex-1 h-2 rounded-full bg-surface-3 overflow-hidden flex">
                                        <div style={{ width: `${(s.correct / Math.max(1, s.questions)) * 100}%`, backgroundColor: 'var(--ok)' }} />
                                        <div style={{ width: `${(s.wrong / Math.max(1, s.questions)) * 100}%`, backgroundColor: 'var(--danger)' }} />
                                        <div style={{ width: `${(s.blank / Math.max(1, s.questions)) * 100}%`, backgroundColor: 'var(--ink-3)' }} />
                                    </div>
                                    <span className="w-24 text-right text-[10px] font-bold text-ink-3 tabular-nums shrink-0">
                                        {s.questions} soru{s.accuracy != null ? ` · %${s.accuracy}` : ''}
                                    </span>
                                </div>
                            );
                        })}
                        <div className="flex gap-3 pt-1.5">
                            <Legend color="var(--ok)" label="Doğru" />
                            <Legend color="var(--danger)" label="Yanlış" />
                            <Legend color="var(--ink-3)" label="Boş" />
                        </div>
                    </div>
                ) : (
                    <p className="text-ink-3 text-xs text-center py-4">
                        Henüz kayıt yok. Yukarıdan bugünkü çalışmanı ekle.
                    </p>
                )}

                {summary.weakestSubject && (
                    <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-danger/10 border border-danger/25">
                        <Target size={14} className="text-danger shrink-0 mt-0.5" />
                        <p className="text-[11px] text-danger/90 leading-snug">
                            <strong>{getSubjectLabel(summary.weakestSubject.subject)}</strong> dersinde isabet oranın
                            %{summary.weakestSubject.accuracy}. Yanlışlarını hata defterine geçirmen bu oranı en hızlı
                            yükselten şey olur.
                        </p>
                    </div>
                )}
            </div>

            {showForm && (
                <EntryForm
                    ogrenci={ogrenci}
                    kind={formKind}
                    onSave={save}
                    onClose={() => setShowForm(false)}
                />
            )}
        </div>
    );
};

// ════════════════════════════════════════════════════════════
const Stat = ({ label, value, color }) => (
    <div className="rounded-xl bg-surface/[0.04] border border-line p-2.5">
        <p className="text-[9px] font-black uppercase tracking-widest text-ink-3 mb-1">{label}</p>
        <p className="text-lg font-black leading-none" style={{ color }}>{value}</p>
    </div>
);

const Legend = ({ color, label }) => (
    <span className="flex items-center gap-1 text-[9px] text-ink-3">
        <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} /> {label}
    </span>
);

// ════════════════════════════════════════════════════════════
const EntryForm = ({ kind, onSave, onClose, ogrenci = null }) => {
    /* Alan bazlı dersler — katalog çözülemezse yedek düz liste */
    const dersler = useMemo(() => ogrencininDersleri(ogrenci), [ogrenci]);
    const dersAdlari = dersler.length ? dersler.map((d) => d.ad) : YEDEK_DERSLER;
    const [konuSerbest, setKonuSerbest] = useState(false);
    const [form, setForm] = useState({
        subject: kind === 'kitap' ? '' : undefined,
        topic: '',
        correct: '',
        wrong: '',
        blank: '',
        pages: '',
        minutes: '',
        date: studyLog.todayKey(),
    });

    const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
    const seciliDers = form.subject ?? dersAdlari[0] ?? '';
    const konular = dersinKonulari(dersler, seciliDers);

    const valid = kind === 'kitap'
        ? form.subject.trim() && Number(form.pages) > 0
        : seciliDers && (Number(form.correct) || Number(form.wrong) || Number(form.blank));

    const submit = () => {
        if (!valid) return;
        onSave({
            kind,
            date: form.date,
            subject: (kind === 'kitap' ? form.subject : seciliDers).trim(),
            topic: form.topic.trim(),
            minutes: Number(form.minutes) || 0,
            ...(kind === 'kitap'
                ? { pages: Number(form.pages) || 0 }
                : {
                    correct: Number(form.correct) || 0,
                    wrong: Number(form.wrong) || 0,
                    blank: Number(form.blank) || 0,
                }),
        });
    };

    const net = kind === 'soru'
        ? ((Number(form.correct) || 0) - (Number(form.wrong) || 0) / 4).toFixed(2)
        : null;

    return (
        <Modal
            acik
            onClose={onClose}
            baslikGizle
            genislik="md"
            govdeClassName="p-0"
        >
            <div className="sticky top-0 bg-surface flex items-center justify-between px-5 py-4 border-b border-line">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-brand/15 border border-brand/30 flex items-center justify-center">
                        {kind === 'kitap' ? <BookOpen size={16} className="text-brand" /> : <PencilLine size={16} className="text-brand" />}
                    </div>
                    <h3 className="text-ink font-black text-base syne">
                        {kind === 'kitap' ? 'Kitap Okuma Ekle' : 'Soru Çözümü Ekle'}
                    </h3>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl text-ink-3 hover:text-ink hover:bg-surface/10 transition">
                    <X size={18} />
                </button>
            </div>

            <div className="p-5 space-y-4">
                <div>
                    <Label>Tarih</Label>
                    <input
                        type="date"
                        value={form.date}
                        max={studyLog.todayKey()}
                        onChange={set('date')}
                        className="w-full bg-surface/[0.04] border border-line rounded-xl px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand/40"
                    />
                </div>

                {kind === 'kitap' ? (
                    <>
                        <div>
                            <Label>Kitap adı *</Label>
                            <input
                                value={form.subject}
                                onChange={set('subject')}
                                placeholder="Suç ve Ceza"
                                className="w-full bg-surface/[0.04] border border-line rounded-xl px-3 py-2.5 text-sm text-ink placeholder-white/25 focus:outline-none focus:border-brand/40"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Okunan sayfa *</Label>
                                <input
                                    type="number" min="0" inputMode="numeric"
                                    value={form.pages}
                                    onChange={set('pages')}
                                    placeholder="25"
                                    className="w-full bg-surface/[0.04] border border-line rounded-xl px-3 py-2.5 text-sm text-ink placeholder-white/25 focus:outline-none focus:border-brand/40"
                                />
                            </div>
                            <div>
                                <Label>Süre (dk)</Label>
                                <input
                                    type="number" min="0" inputMode="numeric"
                                    value={form.minutes}
                                    onChange={set('minutes')}
                                    placeholder="30"
                                    className="w-full bg-surface/[0.04] border border-line rounded-xl px-3 py-2.5 text-sm text-ink placeholder-white/25 focus:outline-none focus:border-brand/40"
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Ders *</Label>
                                <select
                                    value={seciliDers}
                                    onChange={(e) => { setForm((p) => ({ ...p, subject: e.target.value, topic: '' })); setKonuSerbest(false); }}
                                    className="w-full bg-surface/[0.04] border border-line rounded-xl px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand/40"
                                >
                                    {dersAdlari.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label>Konu</Label>
                                {konular.length > 0 && !konuSerbest ? (
                                    <select
                                        value={form.topic}
                                        onChange={(e) => {
                                            if (e.target.value === '__diger__') { setKonuSerbest(true); setForm((p) => ({ ...p, topic: '' })); return; }
                                            setForm((p) => ({ ...p, topic: e.target.value }));
                                        }}
                                        className="w-full bg-surface/[0.04] border border-line rounded-xl px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand/40"
                                    >
                                        <option value="">— Konu seç —</option>
                                        {konular.map((kAd) => <option key={kAd} value={kAd}>{kAd}</option>)}
                                        <option value="__diger__">Diğer…</option>
                                    </select>
                                ) : (
                                    <input
                                        value={form.topic}
                                        onChange={set('topic')}
                                        placeholder="Türev"
                                        className="w-full bg-surface/[0.04] border border-line rounded-xl px-3 py-2.5 text-sm text-ink placeholder-white/25 focus:outline-none focus:border-brand/40"
                                    />
                                )}
                            </div>
                        </div>

                        <div>
                            <Label>Soru sayıları *</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { k: 'correct', label: 'Doğru', color: 'var(--ok)' },
                                    { k: 'wrong', label: 'Yanlış', color: 'var(--danger)' },
                                    { k: 'blank', label: 'Boş', color: 'var(--ink-3)' },
                                ].map((f) => (
                                    <div key={f.k}>
                                        <input
                                            type="number" min="0" inputMode="numeric"
                                            value={form[f.k]}
                                            onChange={set(f.k)}
                                            placeholder="0"
                                            className="w-full bg-surface/[0.04] border rounded-xl px-3 py-2.5 text-sm text-ink text-center font-black focus:outline-none"
                                            style={{ borderColor: `${f.color}44` }}
                                        />
                                        <p className="text-[10px] font-bold text-center mt-1" style={{ color: f.color }}>
                                            {f.label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-between mt-2 px-1">
                                <span className="text-[11px] text-ink-3">Net</span>
                                <span className="text-sm font-black text-brand">{net}</span>
                            </div>
                        </div>

                        <div>
                            <Label>Süre (dk)</Label>
                            <input
                                type="number" min="0" inputMode="numeric"
                                value={form.minutes}
                                onChange={set('minutes')}
                                placeholder="45"
                                className="w-full bg-surface/[0.04] border border-line rounded-xl px-3 py-2.5 text-sm text-ink placeholder-white/25 focus:outline-none focus:border-brand/40"
                            />
                        </div>
                    </>
                )}
            </div>

            <div className="sticky bottom-0 bg-surface flex gap-2 px-5 py-4 border-t border-line">
                <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-ink-3 font-bold text-sm hover:bg-surface/5 transition">
                    Vazgeç
                </button>
                <button
                    onClick={submit}
                    disabled={!valid}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand text-ink-on font-black text-sm disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition"
                >
                    <Check size={16} /> Kaydet
                </button>
            </div>
        </Modal>
    );
};

const Label = ({ children }) => (
    <label className="block text-[10px] font-black uppercase tracking-widest text-ink-3 mb-1.5">
        {children}
    </label>
);

export default DailyStudyLog;
