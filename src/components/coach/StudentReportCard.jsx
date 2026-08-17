/**
 * 🎓 ÖĞRENCİ KARNESİ (canlı)
 *
 * Koçun tek ekranda öğrencinin anlık durumunu gördüğü yer.
 * Üç kaynağı birleştirir:
 *   1. Program uyumu   — öğrencinin etütlerde "yaptım/yapamadım" işaretlemesi
 *   2. Deneme sonuçları — Excel'den yüklenen netler
 *   3. Görev + çalışma  — atanan görevler, pomodoro, seri
 *
 * Hepsi reportService üzerinden gelir; veli portalı ve WhatsApp
 * şablonları da aynı hesaplamayı kullanır, sayılar tutarlı kalır.
 */
import React, { useMemo, useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
    TrendingUp, TrendingDown, Minus, CalendarCheck, ClipboardList, Clock,
    Flame, Target, AlertTriangle, BookOpen, CheckCircle2, XCircle,
    Activity, ChevronDown, ListChecks, RotateCcw,
} from 'lucide-react';
import { buildStudentReport } from '../../services/reportService';
import { getSubjectColor, getSubjectLabel, ACTIVITY_TYPES } from '../../data/programColors';
import { lightAxis, lightGrid, lightTooltip } from '../charts/chartTheme';
import topics from '../../services/topicProgressService';
import { sinavBul, ogrencininSinavi, ogrencininBolumleri } from '../../data/examTopics';
import TopicTracker from '../student/TopicTracker';

const RISK_STYLE = {
    low: { bg: 'rgba(22,163,74,0.10)', border: 'var(--ok)', text: '#14532D', label: 'İyi Durumda' },
    medium: { bg: 'rgba(245,158,11,0.12)', border: 'var(--warn)', text: '#78350F', label: 'İzlenmeli' },
    high: { bg: 'rgba(220,38,38,0.12)', border: 'var(--danger)', text: '#7F1D1D', label: 'Yüksek Risk' },
};

const StudentReportCard = ({ student, compact = false }) => {
    const [openSection, setOpenSection] = useState(compact ? null : 'program');

    /**
     * Konu listesi öğrencinin KENDİ sınav türü ve ALANINDAN gelir;
     * koç TYT-AYT seçmek zorunda kalmaz. Sözel öğrencisinin karnesinde
     * sayısal konuları hiç görünmez.
     */
    const ogrSinav = useMemo(() => ogrencininSinavi(student), [student]);
    const ogrBolumler = useMemo(() => ogrencininBolumleri(student, ogrSinav), [student, ogrSinav]);

    const report = useMemo(
        () => (student ? buildStudentReport(student, { periodDays: 7 }) : null),
        [student]
    );

    /**
     * Özet listeler öğrencinin TÜM bölümlerini tarar; tek bölüme
     * bakılsaydı koç AYT'de tekrar isteyen konuyu göremezdi.
     */
    const tumKonular = useMemo(() => {
        const olcut = topics.olcutOku();
        return ogrBolumler.flatMap((b) =>
            topics.konuHaritasi(student?.id, ogrSinav, olcut, b.id).dersler
                .flatMap((d) => d.konular.map((k) => ({ ...k, ders: d.ad, bolum: b.ad }))));
    }, [student?.id, ogrSinav, ogrBolumler]);

    /** Koçun ilk bakacağı iki liste: düşük başarılı ve yarım kalanlar. */
    const tekrarListesi = useMemo(
        () => tumKonular
            .filter((k) => k.durum === 'tekrar')
            .sort((a, b) => (a.basari ?? 0) - (b.basari ?? 0))
            .slice(0, 6),
        [tumKonular]
    );

    const devamListesi = useMemo(
        () => tumKonular
            .filter((k) => k.durum === 'calisiliyor')
            .sort((a, b) => b.oran - a.oran)
            .slice(0, 6),
        [tumKonular]
    );

    /** Başlıktaki özet — bütün bölümlerin toplamı. */
    const konuOzet = useMemo(() => {
        const tamam = tumKonular.filter((k) => k.tamam).length;
        return {
            toplamKonu: tumKonular.length,
            tamam,
            tekrar: tumKonular.filter((k) => k.durum === 'tekrar').length,
            oran: tumKonular.length ? Math.round((tamam / tumKonular.length) * 100) : 0,
        };
    }, [tumKonular]);

    if (!report) return null;

    const { exams, tasks, study, gamification, program, dailyLog, risk, highlights, activity } = report;
    const riskStyle = RISK_STYLE[risk.level];

    return (
        <div className="space-y-4">

            {/* ── Durum bandı ─────────────────────────────── */}
            <div
                className="rounded-2xl p-4 flex items-start gap-3"
                style={{ backgroundColor: riskStyle.bg, border: `1.5px solid ${riskStyle.border}44` }}
            >
                <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${riskStyle.border}22` }}
                >
                    {risk.level === 'low'
                        ? <CheckCircle2 size={20} style={{ color: riskStyle.border }} />
                        : <AlertTriangle size={20} style={{ color: riskStyle.border }} />}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-sm" style={{ color: riskStyle.text }}>
                            {riskStyle.label}
                        </p>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-surface/60" style={{ color: riskStyle.text }}>
                            risk {risk.score}/100
                        </span>
                        {activity.daysSinceActivity != null && (
                            <span className="text-[10px] font-bold text-ink-2">
                                son hareket {activity.daysSinceActivity === 0 ? 'bugün' : `${activity.daysSinceActivity} gün önce`}
                            </span>
                        )}
                    </div>
                    {risk.reasons.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5">
                            {risk.reasons.map((r, i) => (
                                <li key={i} className="text-[11px] leading-snug" style={{ color: riskStyle.text, opacity: 0.85 }}>
                                    • {r}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* ── KPI şeridi ──────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
                <Kpi
                    icon={CalendarCheck}
                    label="Program Uyumu"
                    value={program.hasProgram && program.rate != null ? `%${program.rate}` : '—'}
                    sub={program.hasProgram ? `${program.done}/${program.planned} etüt` : 'program yok'}
                    color="#4F46E5"
                    highlight
                />
                <Kpi
                    icon={TrendingUp}
                    label="Son Net"
                    value={exams.lastNet ?? '—'}
                    sub={exams.netTrend == null ? `${exams.count} deneme` : `${exams.netTrend > 0 ? '+' : ''}${exams.netTrend} net`}
                    color={exams.netTrend == null ? '#64748B' : exams.netTrend >= 0 ? 'var(--ok)' : 'var(--danger)'}
                />
                <Kpi
                    icon={ClipboardList}
                    label="Görevler"
                    value={tasks.total ? `${tasks.done}/${tasks.total}` : '—'}
                    sub={tasks.overdue ? `${tasks.overdue} gecikmiş` : 'bu hafta'}
                    color="var(--info)"
                />
                <Kpi
                    icon={Clock}
                    label="Çalışma"
                    value={`${study.hours} sa`}
                    sub={`${study.sessions} oturum`}
                    color="var(--c4)"
                />
                <Kpi
                    icon={Flame}
                    label="Seri"
                    value={gamification.streak}
                    sub={`${gamification.xp} XP`}
                    color="#EA580C"
                />
            </div>

            {/* ── Program uyumu ───────────────────────────── */}
            {/* ── Konu takibi ──────────────────────────────────
                Öğrencinin gördüğü konu listesinin AYNISI. Aynı motor
                hesapladığı için koç ile öğrenci farklı sayı görmez. */}
            <Section
                id="topics"
                icon={ListChecks}
                title="Konu Takibi"
                subtitle={
                    konuOzet.toplamKonu
                        ? `${sinavBul(ogrSinav)?.kisa || ogrSinav} · `
                        + `${konuOzet.tamam}/${konuOzet.toplamKonu} konu bitti (%${konuOzet.oran})`
                        + (konuOzet.tekrar ? ` · ${konuOzet.tekrar} konu tekrar istiyor` : '')
                        : 'Konu listesi hazır — öğrenci çalıştıkça dolar'
                }
                open={openSection}
                setOpen={setOpenSection}
            >
                <div className="space-y-4">

                    {/* Koça özel hızlı bakış: hangi konular tekrar istiyor,
                        hangileri yarım kaldı. Ayrıntı için altındaki tam
                        liste zaten açık duruyor. */}
                    {(tekrarListesi.length > 0 || devamListesi.length > 0) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {tekrarListesi.length > 0 && (
                                <div className="srf-in p-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-danger mb-2">
                                        Tekrar gereken konular
                                    </p>
                                    <div className="space-y-1">
                                        {tekrarListesi.map((k) => (
                                            <div key={`${k.bolum}-${k.ders}-${k.konu}`} className="flex items-center gap-2 text-[11px]">
                                                <RotateCcw size={11} className="text-danger shrink-0" />
                                                <span className="font-bold text-ink truncate">{k.konu}</span>
                                                <span className="text-ink-3 shrink-0">
                                                    {k.ders} · %{k.basari}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {devamListesi.length > 0 && (
                                <div className="srf-in p-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-ink-3 mb-2">
                                        Yarım kalan konular
                                    </p>
                                    <div className="space-y-1">
                                        {devamListesi.map((k) => (
                                            <div key={`${k.bolum}-${k.ders}-${k.konu}`} className="flex items-center gap-2 text-[11px]">
                                                <BookOpen size={11} className="text-warn shrink-0" />
                                                <span className="font-bold text-ink truncate">{k.konu}</span>
                                                <span className="text-ink-3 shrink-0">
                                                    {k.ders} · {k.kalan} kaldı
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Öğrencinin gördüğü konu listesinin AYNISI — ders ders,
                        konu konu, çözülen/hedef soru ve durum sütunlarıyla.
                        Salt görünüm: koç öğrenci adına işaret koyamaz, çünkü
                        o kayıt öğrencinin kendi beyanıdır. */}
                    <TopicTracker user={student} saltGorunum />
                </div>
            </Section>

            <Section
                id="program"
                icon={CalendarCheck}
                title="Program Uyumu"
                subtitle={
                    program.hasProgram
                        ? program.lastWeek
                            ? `Son hafta %${program.lastWeek.rate ?? 0} · genel %${program.rate ?? 0}`
                            : `Genel %${program.rate ?? 0}`
                        : 'Bu öğrenciye henüz program atanmamış'
                }
                open={openSection}
                setOpen={setOpenSection}
            >
                {!program.hasProgram ? (
                    <Empty text="Program oluşturulduğunda öğrencinin haftalık uyumu buraya işlenir." />
                ) : (
                    <div className="space-y-4">
                        {/* Hafta hafta uyum */}
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-ink-3 mb-2">
                                Haftalık uyum
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {program.weeks.map((w) => (
                                    <div
                                        key={`${w.month}-${w.week}`}
                                        className="rounded-xl px-2.5 py-1.5 text-center"
                                        style={{
                                            backgroundColor: rateBg(w.rate),
                                            border: `1.5px solid ${rateBorder(w.rate)}55`,
                                        }}
                                        title={`${w.done} yapıldı, ${w.missed} yapamadım, ${w.planned - w.done - w.missed} işaretlenmedi`}
                                    >
                                        <p className="text-[9px] font-bold text-ink-2 leading-none">
                                            {w.month}.Ay {w.week}.H
                                        </p>
                                        <p className="text-sm font-black leading-tight" style={{ color: rateBorder(w.rate) }}>
                                            %{w.rate ?? 0}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Ders bazlı uyum */}
                        {program.bySubject?.length > 0 && (
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-ink-3 mb-2">
                                    Ders bazlı uyum — en düşükten
                                </p>
                                <div className="space-y-1.5">
                                    {program.bySubject.slice(0, 8).map((s) => {
                                        const c = getSubjectColor(s.subject);
                                        return (
                                            <div key={s.subject} className="flex items-center gap-2">
                                                <span
                                                    className="w-20 shrink-0 text-[11px] font-black truncate"
                                                    style={{ color: c.border }}
                                                >
                                                    {getSubjectLabel(s.subject)}
                                                </span>
                                                <div className="flex-1 h-2 rounded-full bg-surface-3 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{ width: `${s.rate ?? 0}%`, backgroundColor: rateBorder(s.rate) }}
                                                    />
                                                </div>
                                                <span className="w-14 text-right text-[11px] font-bold text-ink-2 tabular-nums">
                                                    {s.done}/{s.planned}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Yapılmayanlar */}
                        {program.unfinished?.length > 0 && (
                            <div className="rounded-xl bg-warn-soft border border-warn p-3">
                                <p className="text-[11px] font-black text-warn mb-1.5">
                                    Tamamlanmayan {program.pending + program.missed} etüt
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {program.unfinished.slice(0, 10).map((u, i) => (
                                        <span
                                            key={i}
                                            className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface text-warn border border-warn"
                                            title={`${u.month}. ay ${u.week}. hafta`}
                                        >
                                            {u.status === 'missed' ? '✗' : '○'} {getSubjectLabel(u.subject)} · {u.topic}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-[10px] text-warn/80 mt-2 leading-snug">
                                    Program oluştururken <strong>"Eksikleri Ekle"</strong> ile bunlar yeni haftaya taşınır.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </Section>

            {/* ── Günlük çalışma kaydı ────────────────────── */}
            <Section
                id="log"
                icon={BookOpen}
                title="Günlük Çalışma Kaydı"
                subtitle={
                    dailyLog.hasData
                        ? `${dailyLog.questions} soru · ${dailyLog.pages} sayfa · ${dailyLog.activeDays}/7 aktif gün`
                        : 'Öğrenci henüz günlük kayıt girmemiş'
                }
                open={openSection}
                setOpen={setOpenSection}
            >
                {!dailyLog.hasData ? (
                    <Empty text="Öğrenci çözdüğü soruyu ve okuduğu sayfayı girdiğinde buraya anında düşer." />
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <MiniStat label="Soru" value={dailyLog.questions} sub={`günde ~${dailyLog.avgQuestionsPerDay}`} color="#4F46E5" />
                            <MiniStat label="Net" value={dailyLog.net} sub={`${dailyLog.correct}D / ${dailyLog.wrong}Y`} color="var(--ok)" />
                            <MiniStat
                                label="İsabet"
                                value={dailyLog.accuracy != null ? `%${dailyLog.accuracy}` : '—'}
                                sub="doğru oranı"
                                color={dailyLog.accuracy == null ? '#64748B' : dailyLog.accuracy >= 70 ? 'var(--ok)' : dailyLog.accuracy >= 50 ? 'var(--warn)' : 'var(--danger)'}
                            />
                            <MiniStat label="Kitap" value={dailyLog.pages} sub={`günde ~${dailyLog.avgPagesPerDay} sayfa`} color="var(--info)" />
                        </div>

                        {dailyLog.bySubject.length > 0 && (
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-ink-3 mb-2">
                                    Ders bazlı soru dağılımı
                                </p>
                                <div className="space-y-1.5">
                                    {dailyLog.bySubject.map((s) => {
                                        const c = getSubjectColor(s.subject);
                                        return (
                                            <div key={s.subject} className="flex items-center gap-2">
                                                <span className="w-20 shrink-0 text-[11px] font-black truncate" style={{ color: c.border }}>
                                                    {getSubjectLabel(s.subject)}
                                                </span>
                                                <div className="flex-1 h-2 rounded-full bg-surface-3 overflow-hidden flex">
                                                    <div style={{ width: `${(s.correct / Math.max(1, s.questions)) * 100}%`, backgroundColor: 'var(--ok)' }} />
                                                    <div style={{ width: `${(s.wrong / Math.max(1, s.questions)) * 100}%`, backgroundColor: 'var(--danger)' }} />
                                                    <div style={{ width: `${(s.blank / Math.max(1, s.questions)) * 100}%`, backgroundColor: '#CBD5E1' }} />
                                                </div>
                                                <span className="w-24 text-right text-[10px] font-bold text-ink-2 tabular-nums shrink-0">
                                                    {s.questions} soru{s.accuracy != null ? ` · %${s.accuracy}` : ''}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {dailyLog.weakestSubject && (
                            <div className="rounded-xl bg-danger-soft border border-danger p-3 flex items-start gap-2">
                                <XCircle size={14} className="text-danger shrink-0 mt-0.5" />
                                <p className="text-[11px] text-danger leading-snug">
                                    <strong>{getSubjectLabel(dailyLog.weakestSubject.subject)}</strong> dersinde isabet
                                    %{dailyLog.weakestSubject.accuracy} ({dailyLog.weakestSubject.wrong} yanlış).
                                    Bu ders için konu tekrarı mı yoksa soru kaynağı değişikliği mi gerektiğini konuşun.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </Section>

            {/* ── Deneme gelişimi ─────────────────────────── */}
            <Section
                id="exams"
                icon={Activity}
                title="Deneme Gelişimi"
                subtitle={exams.count ? `${exams.count} deneme · ortalama ${exams.avgNet} net` : 'Henüz deneme sonucu yok'}
                open={openSection}
                setOpen={setOpenSection}
            >
                {exams.count === 0 ? (
                    <Empty text="Deneme sonucu yüklendiğinde netler burada izlenir." />
                ) : (
                    <div className="space-y-3">
                        <div className="h-40 -ml-4 chart-soft">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={exams.history.map((h, i) => ({ ...h, short: `D${i + 1}` }))}
                                    margin={{ top: 8, right: 12, bottom: 4 }}
                                >
                                    <CartesianGrid {...lightGrid}  vertical={false} />
                                    <XAxis dataKey="short" {...lightAxis} />
                                    <YAxis {...lightAxis} width={34} />
                                    <Tooltip
                                        contentStyle={lightTooltip.contentStyle}
                                        formatter={(v) => [`${v} net`, 'Toplam']}
                                        labelFormatter={(_, p) => p?.[0]?.payload?.name || ''}
                                    />
                                    <Line type="monotone" dataKey="net" stroke="#4F46E5" strokeWidth={2.5} dot={{ r: 3.5, fill: '#4F46E5' }}  animationDuration={300} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <Highlight
                                label="Güçlü ders"
                                value={highlights.strongest ? getSubjectLabel(highlights.strongest.label) : '—'}
                                detail={highlights.strongest ? `${highlights.strongest.net} net` : null}
                                tone="ok"
                            />
                            <Highlight
                                label="Desteklenecek"
                                value={highlights.weakest ? getSubjectLabel(highlights.weakest.label) : '—'}
                                detail={highlights.weakest ? `${highlights.weakest.net} net` : null}
                                tone="warn"
                            />
                        </div>
                    </div>
                )}
            </Section>

            {/* ── Çapraz okuma ────────────────────────────── */}
            <CrossReadCard program={program} exams={exams} />
        </div>
    );
};

// ════════════════════════════════════════════════════════════
//  Program uyumu × net ilişkisi
// ════════════════════════════════════════════════════════════

/**
 * Koçun asıl merak ettiği soru: "Program yapılıyor mu, yapılınca
 * netler yükseliyor mu?" İki sinyali yan yana koyup yorumlar.
 */
const CrossReadCard = ({ program, exams }) => {
    if (!program.hasProgram || program.rate == null || exams.netTrend == null) return null;

    const highCompliance = program.rate >= 70;
    const netUp = exams.netTrend > 0.5;

    const verdict = highCompliance && netUp
        ? { icon: CheckCircle2, color: 'var(--ok)', title: 'Program çalışıyor',
            text: 'Uyum yüksek ve netler yükseliyor. Mevcut planı bozmadan devam edin.' }
        : highCompliance && !netUp
            ? { icon: AlertTriangle, color: 'var(--warn)', title: 'Uyum var, sonuç yok',
                text: 'Öğrenci programı uyguluyor ama netler artmıyor. Sorun çalışma miktarında değil, içeriğinde veya yönteminde olabilir — soru kaynağı ve konu seçimini gözden geçirin.' }
            : !highCompliance && netUp
                ? { icon: TrendingUp, color: 'var(--info)', title: 'Programsız ilerliyor',
                    text: 'Netler artıyor ama program uyumu düşük. Öğrenci kendi yöntemiyle çalışıyor olabilir; programı ona göre yeniden kurgulamak gerekebilir.' }
                : { icon: TrendingDown, color: 'var(--danger)', title: 'Müdahale gerekli',
                    text: 'Hem program uyumu düşük hem netler geriliyor. Önce uyumun neden düştüğünü konuşun — program ağır gelmiş olabilir.' };

    const Icon = verdict.icon;

    return (
        <div
            className="rounded-2xl p-4 flex items-start gap-3"
            style={{ backgroundColor: `${verdict.color}0F`, border: `1.5px solid ${verdict.color}33` }}
        >
            <Icon size={20} style={{ color: verdict.color }} className="shrink-0 mt-0.5" />
            <div>
                <p className="font-black text-sm" style={{ color: verdict.color }}>{verdict.title}</p>
                <p className="text-[11px] text-ink-2 leading-relaxed mt-1">{verdict.text}</p>
                <p className="text-[10px] text-ink-3 mt-1.5">
                    Program uyumu %{program.rate} · net değişimi {exams.netTrend > 0 ? '+' : ''}{exams.netTrend}
                </p>
            </div>
        </div>
    );
};

// ════════════════════════════════════════════════════════════
//  Ortak parçalar
// ════════════════════════════════════════════════════════════

const rateBorder = (rate) =>
    rate == null ? 'var(--ink-3)' : rate >= 70 ? 'var(--ok)' : rate >= 40 ? 'var(--warn)' : 'var(--danger)';

const rateBg = (rate) =>
    rate == null ? '#F1F5F9' : rate >= 70 ? '#DCFCE7' : rate >= 40 ? '#FEF3C7' : '#FEE2E2';

const Kpi = ({ icon, label, value, sub, color, highlight }) => {
    const Icon = icon;
    return (
    <div
        className="rounded-2xl p-3 bg-surface border"
        style={{ borderColor: highlight ? `${color}55` : '#E5E7EB', borderWidth: highlight ? 1.5 : 1 }}
    >
        <div className="flex items-center gap-1.5 mb-1.5">
            <Icon size={13} style={{ color }} />
            <span className="text-[10px] font-black uppercase tracking-wide text-ink-3">{label}</span>
        </div>
        <p className="text-xl font-black leading-none" style={{ color }}>{value}</p>
        <p className="text-[10px] text-ink-3 mt-1">{sub}</p>
    </div>
    );
};

const Section = ({ id, icon, title, subtitle, open, setOpen, children }) => {
    const Icon = icon;
    const isOpen = open === id;
    return (
        <div className="rounded-2xl bg-surface border border-line overflow-hidden">
            <button
                onClick={() => setOpen(isOpen ? null : id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-2 transition"
            >
                <Icon size={16} className="text-brand shrink-0" />
                <div className="min-w-0 flex-1">
                    <p className="font-black text-sm text-ink">{title}</p>
                    <p className="text-[11px] text-ink-3 truncate">{subtitle}</p>
                </div>
                <ChevronDown size={16} className={`text-ink-3 shrink-0 transition ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="px-4 pb-4 border-t border-line pt-3">{children}</div>}
        </div>
    );
};

const Highlight = ({ label, value, detail, tone }) => {
    const styles = tone === 'ok'
        ? { bg: '#DCFCE7', text: '#14532D' }
        : { bg: '#FEF3C7', text: '#78350F' };
    return (
        <div className="rounded-xl p-2.5" style={{ backgroundColor: styles.bg }}>
            <p className="text-[9px] font-black uppercase tracking-wide" style={{ color: styles.text, opacity: 0.65 }}>
                {label}
            </p>
            <p className="text-sm font-black mt-0.5" style={{ color: styles.text }}>{value}</p>
            {detail && <p className="text-[10px]" style={{ color: styles.text, opacity: 0.6 }}>{detail}</p>}
        </div>
    );
};

const MiniStat = ({ label, value, sub, color }) => (
    <div className="rounded-xl bg-surface-2 border border-line p-2.5">
        <p className="text-[9px] font-black uppercase tracking-widest text-ink-3 mb-1">{label}</p>
        <p className="text-lg font-black leading-none" style={{ color }}>{value}</p>
        <p className="text-[10px] text-ink-3 mt-0.5">{sub}</p>
    </div>
);

const Empty = ({ text }) => (
    <p className="text-xs text-ink-3 text-center py-6">{text}</p>
);

export default StudentReportCard;
