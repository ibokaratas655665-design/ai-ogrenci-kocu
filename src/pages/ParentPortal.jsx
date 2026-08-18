/**
 * 👨‍👩‍👧 VELİ PORTALI
 *
 * QR kod veya paylaşılan bağlantı ile açılan, oturum gerektirmeyen veli sayfası.
 * Mobil öncelikli — veliler bunu telefondan açıyor.
 *
 * Rota: #/veli/:studentId  (eski #/parent-report/:studentId de buraya düşer)
 */
import React, { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell,
} from 'recharts';
import {
    ClipboardList, Trophy, TrendingUp, TrendingDown, Minus,
    BookOpen, Target, Clock, Flame, AlertCircle, MessageCircle,
    ChevronDown, Award, Activity, CalendarCheck, PencilLine,
} from 'lucide-react';
import { buildStudentReport } from '../services/reportService';
import { lightAxis, lightGrid, lightTooltip } from '../components/charts/chartTheme';
import wa from '../services/whatsappService';
import ParentBadgeStrip from '../components/parent/ParentBadgeStrip';
import parentLinks from '../services/parentLinkService';
import veliBaglanti from '../services/veliBaglanti';
import { nesneOku } from '../services/veriDeposu';

const safeParse = (key, fallback = []) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw || !raw.trim()) return fallback;
        return JSON.parse(raw) ?? fallback;
    } catch {
        return fallback;
    }
};

const PERIODS = [
    { days: 7, label: 'Son 7 Gün' },
    { days: 30, label: 'Son 30 Gün' },
    { days: 90, label: 'Son 3 Ay' },
];

// ════════════════════════════════════════════════════════════
const ParentPortal = () => {
    /**
     * Adresteki değer artık ÖĞRENCİ NUMARASI DEĞİL, rastgele belirteç.
     * Eski biçim (`#/veli/5`) sırayla sayı deneyerek bütün öğrencilerin
     * raporuna ulaşmayı mümkün kılıyordu; o yüzden sayısal parametre
     * bilerek reddediliyor.
     */
    const { studentId: adresParametresi } = useParams();
    const [periodDays, setPeriodDays] = useState(7);

    /**
     * PORTAL VELİNİN CİHAZINDA HİÇ AÇILMIYORDU.
     *
     * Öğrenciyi coach_students içinde, belirteci de parent_links
     * anahtarında arıyordu. İkisi de yalnızca KOÇUN tarayıcısındaydı;
     * portal oturum istemediği için senkron burada hiç başlamıyor ve bu
     * anahtarlar velinin cihazına hiç inmiyordu. Veli her koşulda
     * "Öğrenci Bulunamadı" görüyordu — ürünün vaat ettiği özellik
     * hiçbir zaman teslim edilmedi.
     *
     * Artık rapor SUNUCUDAN okunuyor: koçun cihazı velinin göreceği
     * özeti hesaplayıp bağlantı belgesine yazıyor, veli yalnızca o
     * belgeyi okuyor. Koçun veri havuzu veliye asla açılmıyor.
     *
     * Yerel yol yedek olarak duruyor: koç kendi cihazında önizleme
     * yaptığında (özet henüz yayınlanmamışsa) çalışsın diye.
     */
    const [durum, setDurum] = useState('yukleniyor');
    const [sunucuVeri, setSunucuVeri] = useState(null);
    const [yerelId, setYerelId] = useState(null);

    useEffect(() => {
        let iptal = false;
        (async () => {
            if (!adresParametresi) { setDurum('gecersiz'); return; }
            // Yalnızca rakamdan oluşan adres ESKİ ve güvensiz biçimdir
            if (/^\d+$/.test(adresParametresi)) { setDurum('eski'); return; }

            const r = await veliBaglanti.portalOku(adresParametresi);
            if (iptal) return;

            if (r.durum === 'gecerli' && r.ozet) { setSunucuVeri(r); setDurum('gecerli'); return; }
            if (r.durum === 'iptal' || r.durum === 'suresi_doldu') { setDurum(r.durum); return; }

            // Sunucuda yoksa eski yerel kayda düş (koçun kendi cihazı)
            const c = parentLinks.cozumle(adresParametresi);
            if (c && c.ogrenciId) { setYerelId(c.ogrenciId); setDurum('yerel'); return; }
            setDurum('gecersiz');
        })();
        return () => { iptal = true; };
    }, [adresParametresi]);

    const yerelOgrenci = useMemo(() => {
        if (durum !== 'yerel' || !yerelId) return null;
        const list = safeParse('coach_students');
        return list.find((s) => String(s.id) === String(yerelId)) || null;
    }, [durum, yerelId]);

    const yerelRapor = useMemo(
        () => (yerelOgrenci ? buildStudentReport(yerelOgrenci, { periodDays }) : null),
        [yerelOgrenci, periodDays]
    );

    const student = durum === 'gecerli' ? (sunucuVeri && sunucuVeri.ogrenci) : yerelOgrenci;
    const report = durum === 'gecerli'
        ? ((sunucuVeri && sunucuVeri.ozet && sunucuVeri.ozet[String(periodDays)]) || null)
        : yerelRapor;

    const coachNote = useMemo(() => {
        if (durum === 'gecerli') return (sunucuVeri && sunucuVeri.kocNotu) || null;
        const notes = safeParse(`coach_notes_${yerelId}`);
        const visible = notes.filter((n) => n.visibleToParent);
        return visible.length ? visible[visible.length - 1] : null;
    }, [durum, sunucuVeri, yerelId]);

    if (durum === 'yukleniyor') return <Yukleniyor />;
    if (durum === 'eski') return <EskiBaglanti />;
    if (durum === 'iptal') return <BaglantiKapali />;
    if (durum === 'suresi_doldu') return <SuresiDoldu />;
    if (!student || !report) return <NotFound />;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50/40 atmos atmos-light">
            <div className="max-w-lg mx-auto px-4 pb-12">

                <Header student={student} report={report} />

                {/* Koçun/rehberliğin yaptığı yeni çalışmalar — tıklanınca
                    ilgili bölüme gider ve sayaç sıfırlanır */}
                <ParentBadgeStrip user={{ id: `parent_${student.id}`, studentId: student.id }} />

                {/* Dönem seçici */}
                <div className="flex gap-1.5 mt-4 mb-4">
                    {PERIODS.map((p) => (
                        <button
                            key={p.days}
                            onClick={() => setPeriodDays(p.days)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                                periodDays === p.days
                                    ? 'bg-brand text-white shadow-md shadow-indigo-200'
                                    : 'bg-surface text-ink-2 border border-line hover:border-brand-line'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                <div className="space-y-4 stagger">
                    <StatusBanner report={report} />
                    <KpiGrid report={report} />
                    <ProgramCard report={report} />
                    <DailyLogCard report={report} />
                    <div id="bolum-deneme"><NetTrendCard report={report} /></div>
                    <SubjectCard report={report} />
                    <div id="bolum-gorev"><TaskCard report={report} /></div>
                    <GoalCard report={report} />
                    {coachNote && <CoachNoteCard note={coachNote} />}
                    <div id="bolum-iletisim"><ContactCard student={student} /></div>
                </div>

                <p className="text-center text-[11px] text-ink-3 mt-8 leading-relaxed">
                    Bu rapor {new Date(report.generatedAt).toLocaleString('tr-TR')} tarihinde oluşturuldu.<br />
                    Veriler öğrencinin koçluk sistemindeki kayıtlarından derlenmiştir.
                </p>
            </div>
        </div>
    );
};

// ════════════════════════════════════════════════════════════
const Header = ({ student, report }) => {
    const initials = (student.name || '?')
        .split(' ')
        .slice(0, 2)
        .map((p) => p.charAt(0))
        .join('')
        .toLocaleUpperCase('tr-TR');

    return (
        <div className="on-color bg-gradient-to-br from-brand via-indigo-600 to-violet-600 rounded-b-[32px] -mx-4 px-6 pt-8 pb-6 text-white shadow-xl shadow-indigo-200/50">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-surface/20 backdrop-blur flex items-center justify-center text-xl font-black shrink-0">
                    {initials}
                </div>
                <div className="min-w-0">
                    <p className="text-ink-2 text-xs font-bold uppercase tracking-widest">Veli Portalı</p>
                    <h1 className="text-2xl font-black truncate">{student.name}</h1>
                    <p className="text-ink-2 text-sm">
                        {[student.grade, student.section].filter(Boolean).join('-') || 'Sınıf bilgisi yok'}
                        {student.schoolNumber ? ` · No: ${student.schoolNumber}` : ''}
                    </p>
                </div>
            </div>

            {report.exams.lastNet != null && (
                <div className="mt-5 flex items-end justify-between">
                    <div>
                        <p className="text-ink-2 text-xs font-bold">SON DENEME NETİ</p>
                        <p className="text-4xl font-black leading-none mt-1">{report.exams.lastNet}</p>
                    </div>
                    <TrendPill delta={report.exams.netTrend} />
                </div>
            )}
        </div>
    );
};

const TrendPill = ({ delta }) => {
    if (delta == null) {
        return (
            <span className="flex items-center gap-1.5 bg-surface/15 px-3 py-1.5 rounded-full text-xs font-bold">
                <Minus size={13} /> İlk deneme
            </span>
        );
    }
    const up = delta > 0;
    const flat = Math.abs(delta) < 0.5;
    const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
    return (
        <span
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black ${
                flat ? 'bg-surface/15' : up ? 'bg-emerald-400/25 text-ok' : 'bg-red-400/25 text-danger'
            }`}
        >
            <Icon size={13} />
            {up ? '+' : ''}{delta} net
        </span>
    );
};

// ════════════════════════════════════════════════════════════
const StatusBanner = ({ report }) => {
    const { level, levelLabel, reasons } = report.risk;
    const [open, setOpen] = useState(false);

    const styles = {
        low: { bg: 'bg-ok-soft', border: 'border-ok', text: 'text-ok', icon: Award },
        medium: { bg: 'bg-warn-soft', border: 'border-warn', text: 'text-warn', icon: AlertCircle },
        high: { bg: 'bg-danger-soft', border: 'border-danger', text: 'text-danger', icon: AlertCircle },
    }[level];

    const messages = {
        low: 'Öğrenciniz süreci iyi yönetiyor. Düzenli çalışma alışkanlığı yerleşmiş durumda.',
        medium: 'Bazı noktalar takip edilmeli. Aşağıdaki başlıklarda küçük bir destek işe yarayabilir.',
        high: 'Bu dönem desteğe ihtiyaç var. Koçla iletişime geçmenizi öneririz.',
    };

    const Icon = styles.icon;

    return (
        <div className={`${styles.bg} ${styles.border} border rounded-2xl overflow-hidden`}>
            <button
                onClick={() => reasons.length > 0 && setOpen((o) => !o)}
                className="w-full p-4 flex items-start gap-3 text-left"
            >
                <Icon size={20} className={`${styles.text} shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                    <p className={`font-black text-sm ${styles.text}`}>{levelLabel}</p>
                    <p className="text-ink-2 text-xs mt-0.5 leading-relaxed">{messages[level]}</p>
                </div>
                {reasons.length > 0 && (
                    <ChevronDown
                        size={16}
                        className={`${styles.text} shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                )}
            </button>
            {open && reasons.length > 0 && (
                <div className="px-4 pb-4 pt-0">
                    <ul className="space-y-1.5 border-t border-black/5 pt-3">
                        {reasons.map((r, i) => (
                            <li key={i} className="text-xs text-ink-2 flex items-start gap-2">
                                <span className={styles.text}>•</span> {r}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

// ════════════════════════════════════════════════════════════
const KpiGrid = ({ report }) => {
    const items = [
        {
            icon: Clock,
            label: 'Çalışma',
            value: report.study.hours,
            unit: 'saat',
            color: 'indigo',
            delta: report.study.delta,
            deltaUnit: 'dk',
        },
        {
            icon: ClipboardList,
            label: 'Görevler',
            value: `${report.tasks.done}/${report.tasks.total}`,
            unit: report.tasks.completionPct != null ? `%${report.tasks.completionPct}` : 'görev yok',
            color: 'emerald',
        },
        {
            icon: Flame,
            label: 'Çalışma Serisi',
            value: report.gamification.streak,
            unit: 'gün',
            color: 'orange',
        },
        {
            icon: Trophy,
            label: 'Puan',
            value: report.gamification.xp,
            unit: `Seviye ${report.gamification.level}`,
            color: 'amber',
        },
    ];

    // Her kartın kendi rengi olsun — veli hangi göstergeye baktığını
    // renkten de ayırt edebilsin (üst şerit + ikon halesi aynı tonda).
    const palette = {
        indigo: 'var(--brand)',
        emerald: '#059669',
        orange: '#ea580c',
        amber: 'var(--warn)',
    };

    return (
        <div className="grid grid-cols-2 gap-3">
            {items.map((it) => {
                const Icon = it.icon;
                return (
                <div key={it.label} className="vivid-kpi-light" style={{ '--kpi': palette[it.color] }}>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="kpi-icon">
                            <Icon size={14} />
                        </div>
                        <span className="text-[11px] font-bold text-ink-2">{it.label}</span>
                    </div>
                    <p className="text-2xl font-black text-ink leading-none">{it.value}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                        <p className="text-[11px] text-ink-3">{it.unit}</p>
                        {it.delta != null && it.delta !== 0 && (
                            <span className={`text-[10px] font-black ${it.delta > 0 ? 'text-ok' : 'text-danger'}`}>
                                {it.delta > 0 ? '+' : ''}{it.delta} {it.deltaUnit}
                            </span>
                        )}
                    </div>
                </div>
                );
            })}
        </div>
    );
};

// ════════════════════════════════════════════════════════════
const ProgramCard = ({ report }) => {
    const p = report.program;
    if (!p?.hasProgram) return null;

    const rate = p.lastWeek?.rate ?? p.rate ?? 0;
    const tone = rate >= 70 ? 'emerald' : rate >= 40 ? 'amber' : 'red';
    const bar = { emerald: 'bg-ok', amber: 'bg-warn', red: 'bg-red-400' }[tone];

    return (
        <Card
            icon={CalendarCheck}
            title="Haftalık Program"
            subtitle="Koçun hazırladığı programın ne kadarı yapıldı"
        >
            <div className="flex items-end justify-between mb-2">
                <p className="text-3xl font-black text-ink">
                    {p.done}<span className="text-lg text-ink-3">/{p.planned}</span>
                </p>
                <p className="text-sm font-black text-brand">%{p.rate ?? 0}</p>
            </div>
            <div className="h-2.5 bg-surface-3 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${bar}`} style={{ width: `${p.rate ?? 0}%` }} />
            </div>

            {/* Hafta hafta */}
            {p.weeks.length > 1 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                    {p.weeks.slice(-6).map((w) => (
                        <div
                            key={`${w.month}-${w.week}`}
                            className="flex-1 min-w-[46px] rounded-lg py-1.5 text-center bg-surface-2"
                        >
                            <p className="text-[9px] text-ink-3 font-bold leading-none">{w.week}.H</p>
                            <p className={`text-xs font-black mt-0.5 ${
                                (w.rate ?? 0) >= 70 ? 'text-ok' : (w.rate ?? 0) >= 40 ? 'text-warn' : 'text-danger'
                            }`}>
                                %{w.rate ?? 0}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {p.weakSubjects?.length > 0 && (
                <div className="mt-3 bg-warn-soft rounded-xl p-3">
                    <p className="text-xs font-black text-warn mb-1">Aksayan dersler</p>
                    <p className="text-[11px] text-warn leading-snug">
                        {p.weakSubjects.slice(0, 3).map((s) => `${s.subject} (%${s.rate})`).join(', ')}
                    </p>
                </div>
            )}
        </Card>
    );
};

// ════════════════════════════════════════════════════════════
const DailyLogCard = ({ report }) => {
    const d = report.dailyLog;
    if (!d?.hasData) return null;

    return (
        <Card
            icon={PencilLine}
            title="Günlük Çalışma"
            subtitle={`${report.period.label.toLowerCase()} dönem · ${d.activeDays} gün aktif`}
        >
            <div className="grid grid-cols-3 gap-2 mb-3">
                <MiniBox label="Çözülen soru" value={d.questions} sub={`günde ~${d.avgQuestionsPerDay}`} tone="indigo" />
                <MiniBox
                    label="İsabet"
                    value={d.accuracy != null ? `%${d.accuracy}` : '—'}
                    sub={`${d.correct}D / ${d.wrong}Y`}
                    tone={d.accuracy == null ? 'slate' : d.accuracy >= 70 ? 'emerald' : d.accuracy >= 50 ? 'amber' : 'red'}
                />
                <MiniBox label="Kitap" value={d.pages} sub="sayfa" tone="sky" />
            </div>

            {d.bySubject.length > 0 && (
                <div className="space-y-1.5">
                    {d.bySubject.slice(0, 5).map((s) => (
                        <div key={s.subject} className="flex items-center gap-2">
                            <span className="w-20 shrink-0 text-[11px] font-bold text-ink-2 truncate">{s.subject}</span>
                            <div className="flex-1 h-2 rounded-full bg-surface-3 overflow-hidden flex">
                                <div style={{ width: `${(s.correct / Math.max(1, s.questions)) * 100}%`, backgroundColor: 'var(--ok)' }} />
                                <div style={{ width: `${(s.wrong / Math.max(1, s.questions)) * 100}%`, backgroundColor: 'var(--danger)' }} />
                                <div style={{ width: `${(s.blank / Math.max(1, s.questions)) * 100}%`, backgroundColor: '#CBD5E1' }} />
                            </div>
                            <span className="w-16 text-right text-[10px] font-bold text-ink-3 tabular-nums">
                                {s.questions} soru
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};

const MiniBox = ({ label, value, sub, tone }) => {
    const tones = {
        indigo: 'bg-brand-soft text-brand',
        emerald: 'bg-ok-soft text-ok',
        amber: 'bg-warn-soft text-warn',
        red: 'bg-danger-soft text-danger',
        sky: 'bg-info-soft text-info',
        slate: 'bg-surface-2 text-ink-2',
    };
    return (
        <div className={`${tones[tone]} rounded-xl p-2.5 text-center`}>
            <p className="text-lg font-black leading-none">{value}</p>
            <p className="text-[10px] font-bold opacity-70 mt-1">{label}</p>
            <p className="text-[9px] opacity-50">{sub}</p>
        </div>
    );
};

// ════════════════════════════════════════════════════════════
const NetTrendCard = ({ report }) => {
    const data = report.exams.history;

    if (data.length === 0) {
        return (
            <Card icon={Activity} title="Deneme Gelişimi">
                <EmptyState text="Henüz deneme sonucu girilmemiş." />
            </Card>
        );
    }

    const chartData = data.map((d, i) => ({
        name: d.name.length > 12 ? `${d.name.slice(0, 12)}…` : d.name,
        short: `D${i + 1}`,
        net: d.net,
    }));

    return (
        <Card
            icon={Activity}
            title="Deneme Gelişimi"
            subtitle={`${report.exams.count} deneme · ortalama ${report.exams.avgNet} net`}
        >
            <div className="h-44 -ml-4 chart-soft">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 4 }}>
                        <CartesianGrid {...lightGrid}  vertical={false} />
                        <XAxis dataKey="short" {...lightAxis} />
                        <YAxis {...lightAxis} width={34} />
                        <Tooltip
                            contentStyle={lightTooltip.contentStyle}
                            formatter={(v) => [`${v} net`, 'Toplam']}
                            labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ''}
                        />
                        <Line
                            type="monotone"
                            dataKey="net"
                            stroke="var(--brand)"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: 'var(--brand)' }}
                            activeDot={{ r: 6 }}
                         animationDuration={300} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-line">
                {[
                    ['En İyi', report.exams.bestNet],
                    ['Ortalama', report.exams.avgNet],
                    ['Son', report.exams.lastNet],
                ].map(([label, value]) => (
                    <div key={label} className="text-center">
                        <p className="text-[10px] font-bold text-ink-3 uppercase tracking-wide">{label}</p>
                        <p className="text-lg font-black text-ink">{value ?? '—'}</p>
                    </div>
                ))}
            </div>
        </Card>
    );
};

// ════════════════════════════════════════════════════════════
const SubjectCard = ({ report }) => {
    const subjects = report.subjects;

    if (subjects.length === 0) {
        return (
            <Card icon={BookOpen} title="Ders Bazlı Durum">
                <EmptyState text="Ders bazlı veri için en az bir deneme sonucu gerekiyor." />
            </Card>
        );
    }

    const max = Math.max(...subjects.map((s) => s.net), 1);
    const chartData = subjects.map((s) => ({ ...s, fill: s.net >= max * 0.66 ? 'var(--ok)' : s.net >= max * 0.33 ? 'var(--c1)' : 'var(--warn)' }));

    return (
        <Card
            icon={BookOpen}
            title="Ders Bazlı Durum"
            subtitle="Son denemedeki net dağılımı"
        >
            <div style={{ height: Math.max(140, subjects.length * 30) }} className="-ml-2 chart-soft chart-3d">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="label"
                            tick={{ fontSize: 11, fill: 'var(--ink-3)' }}
                            axisLine={false}
                            tickLine={false}
                            width={80}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                            formatter={(v) => [`${v} net`, 'Net']}
                            cursor={{ fill: '#f1f5f9' }}
                        />
                        <Bar dataKey="net" radius={[0, 8, 8, 0]} barSize={16}>
                            {chartData.map((entry, i) => (
                                <Cell key={i} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-line">
                <Highlight
                    label="Güçlü olduğu ders"
                    value={report.highlights.strongest?.label}
                    detail={report.highlights.strongest ? `${report.highlights.strongest.net} net` : null}
                    tone="emerald"
                />
                <Highlight
                    label="Desteklenecek ders"
                    value={report.highlights.weakest?.label}
                    detail={report.highlights.weakest ? `${report.highlights.weakest.net} net` : null}
                    tone="amber"
                />
            </div>

            {report.highlights.mostImproved?.delta > 0 && (
                <div className="mt-2 flex items-center gap-2 bg-ok-soft rounded-xl px-3 py-2">
                    <TrendingUp size={14} className="text-ok shrink-0" />
                    <p className="text-xs text-ok">
                        <strong>{report.highlights.mostImproved.label}</strong> dersinde{' '}
                        {report.highlights.mostImproved.delta} net ilerleme var.
                    </p>
                </div>
            )}
        </Card>
    );
};

const Highlight = ({ label, value, detail, tone }) => {
    const tones = {
        emerald: 'bg-ok-soft text-ok',
        amber: 'bg-warn-soft text-warn',
    };
    return (
        <div className={`${tones[tone]} rounded-xl p-3`}>
            <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">{label}</p>
            <p className="text-sm font-black mt-0.5">{value || '—'}</p>
            {detail && <p className="text-[11px] opacity-60">{detail}</p>}
        </div>
    );
};

// ════════════════════════════════════════════════════════════
const TaskCard = ({ report }) => {
    const { done, total, completionPct, overdue, overdueTitles } = report.tasks;

    return (
        <Card
            icon={ClipboardList}
            title="Görev Takibi"
            subtitle={`${report.period.label.toLowerCase()} dönem`}
        >
            {total === 0 ? (
                <EmptyState text="Bu dönemde atanmış görev yok." />
            ) : (
                <>
                    <div className="flex items-end justify-between mb-2">
                        <p className="text-3xl font-black text-ink">
                            {done}<span className="text-lg text-ink-3">/{total}</span>
                        </p>
                        <p className="text-sm font-black text-brand">%{completionPct}</p>
                    </div>
                    <div className="h-2.5 bg-surface-3 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${
                                completionPct >= 70 ? 'bg-ok' : completionPct >= 40 ? 'bg-warn' : 'bg-red-400'
                            }`}
                            style={{ width: `${completionPct}%` }}
                        />
                    </div>
                </>
            )}

            {overdue > 0 && (
                <div className="mt-3 bg-warn-soft rounded-xl p-3">
                    <p className="text-xs font-black text-warn mb-1.5">
                        {overdue} görevin süresi geçmiş
                    </p>
                    <ul className="space-y-1">
                        {overdueTitles.map((t, i) => (
                            <li key={i} className="text-[11px] text-warn flex items-start gap-1.5">
                                <span>•</span> {t}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </Card>
    );
};

// ════════════════════════════════════════════════════════════
const GoalCard = ({ report }) => {
    const { targetNet, progress } = report.goal;
    const target = report.student.target;

    if (!target && !targetNet) return null;

    return (
        <Card icon={Target} title="Hedef">
            {target && (
                <p className="text-lg font-black text-ink mb-2">{target}</p>
            )}
            {targetNet && progress != null && (
                <>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-ink-2">
                            {report.exams.lastNet} / {targetNet} net
                        </span>
                        <span className="font-black text-brand">%{progress}</span>
                    </div>
                    <div className="h-2.5 bg-surface-3 rounded-full overflow-hidden">
                        <div
                            className="on-color h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                            style={{ width: `${Math.min(100, progress)}%` }}
                        />
                    </div>
                </>
            )}
        </Card>
    );
};

// ════════════════════════════════════════════════════════════
const CoachNoteCard = ({ note }) => (
    <Card icon={MessageCircle} title="Koç Notu">
        <p className="text-sm text-ink-2 leading-relaxed whitespace-pre-wrap">{note.text || note.content}</p>
        {note.createdAt && (
            <p className="text-[11px] text-ink-3 mt-2">
                {new Date(note.createdAt).toLocaleDateString('tr-TR')}
            </p>
        )}
    </Card>
);

// ════════════════════════════════════════════════════════════
const ContactCard = ({ student }) => {
    const coachPhone = (() => {
        try {
            const settings = nesneOku('app_settings');
            return settings.coachPhone || '';
        } catch {
            return '';
        }
    })();

    if (!wa.isValidPhone(coachPhone)) return null;

    const link = wa.buildWhatsAppLink(
        coachPhone,
        `Merhaba, ${student.name} isimli öğrencinin velisiyim. Görüşmek istiyorum.`
    );

    return (
        <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-ok text-white font-black text-sm shadow-lg shadow-green-200 active:scale-[0.98] transition"
        >
            <MessageCircle size={17} /> Koça WhatsApp'tan Yaz
        </a>
    );
};

// ════════════════════════════════════════════════════════════
//  Ortak parçalar
// ════════════════════════════════════════════════════════════
const Card = ({ icon, title, subtitle, children }) => {
    const Icon = icon;
    return (
        <div className="surface-3d-light p-4">
            <div className="flex items-center gap-2 mb-3">
                <Icon size={16} className="text-brand" />
                <div>
                    <h3 className="font-black text-ink text-sm">{title}</h3>
                    {subtitle && <p className="text-[11px] text-ink-3">{subtitle}</p>}
                </div>
            </div>
            {children}
        </div>
    );
};

const EmptyState = ({ text }) => (
    <p className="text-xs text-ink-3 text-center py-6">{text}</p>
);

/**
 * Eski `#/veli/5` biçimindeki bağlantılar artık çalışmıyor. Veli boş
 * ekranla karşılaşmasın diye ne olduğu ve ne yapması gerektiği yazılı.
 */
const EskiBaglanti = () => (
    <div className="min-h-screen flex items-center justify-center bg-surface-2 p-6">
        <div className="bg-surface rounded-3xl p-8 max-w-sm w-full text-center shadow-lg border border-line">
            <div className="w-14 h-14 bg-warn-soft rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={26} className="text-warn" />
            </div>
            <h2 className="text-lg font-black text-ink mb-2">Bu Bağlantı Yenilendi</h2>
            <p className="text-sm text-ink-2 leading-relaxed">
                Güvenlik nedeniyle veli bağlantıları yenilendi; elinizdeki eski
                bağlantı artık çalışmıyor.
            </p>
            <p className="text-sm text-ink-2 leading-relaxed mt-3">
                Koçunuzdan yeni bağlantıyı istemeniz yeterli — WhatsApp'tan
                gönderebilir.
            </p>
        </div>
    </div>
);

/** Sunucudan özet okunurken. Veli boş ekran görmemeli. */
const Yukleniyor = () => (
    <div className="min-h-screen flex items-center justify-center bg-surface-2 p-6">
        <div className="text-center">
            <div className="w-10 h-10 rounded-full border-2 border-line border-t-brand animate-spin mx-auto mb-3" />
            <p className="text-sm text-ink-3">Rapor hazırlanıyor…</p>
        </div>
    </div>
);

/** Koç bağlantıyı iptal etmiş. */
const BaglantiKapali = () => (
    <div className="min-h-screen flex items-center justify-center bg-surface-2 p-6">
        <div className="bg-surface rounded-3xl p-8 max-w-sm w-full text-center shadow-lg border border-line">
            <div className="w-14 h-14 bg-warn-soft rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={26} className="text-warn" />
            </div>
            <h2 className="text-lg font-black text-ink mb-2">Bağlantı Kapatıldı</h2>
            <p className="text-sm text-ink-2 leading-relaxed">
                Koç bu bağlantıyı kapatmış. Güncel bağlantı için koçunuzla iletişime geçin.
            </p>
        </div>
    </div>
);

/** Belirtecin süresi dolmuş — kural sunucuda da reddediyor. */
const SuresiDoldu = () => (
    <div className="min-h-screen flex items-center justify-center bg-surface-2 p-6">
        <div className="bg-surface rounded-3xl p-8 max-w-sm w-full text-center shadow-lg border border-line">
            <div className="w-14 h-14 bg-warn-soft rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={26} className="text-warn" />
            </div>
            <h2 className="text-lg font-black text-ink mb-2">Bağlantının Süresi Doldu</h2>
            <p className="text-sm text-ink-2 leading-relaxed">
                Güvenlik nedeniyle veli bağlantıları belirli bir süre sonra geçersiz olur.
                Koçunuzdan yeni bağlantı isteyin.
            </p>
        </div>
    </div>
);

const NotFound = () => (
    <div className="min-h-screen flex items-center justify-center bg-surface-2 p-6">
        <div className="bg-surface rounded-3xl p-8 max-w-sm w-full text-center shadow-lg border border-line">
            <div className="w-14 h-14 bg-warn-soft rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={26} className="text-warn" />
            </div>
            <h2 className="text-lg font-black text-ink mb-2">Öğrenci Bulunamadı</h2>
            <p className="text-sm text-ink-2 leading-relaxed">
                Bu bağlantı geçersiz olabilir veya öğrenci kaydı bu cihazda bulunmuyor.
                Lütfen koçunuzdan güncel bağlantıyı isteyin.
            </p>
        </div>
    </div>
);

export default ParentPortal;
