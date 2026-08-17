import React, { useState } from 'react';
import { 
    Users, TrendingUp, AlertCircle, BarChart2, CheckCircle, 
    MessageSquare, Activity, Zap, BrainCircuit, Sparkles, 
    ArrowRight, ChevronRight, Edit2, Trash2, Upload, Search,
    Plus, Megaphone, Bot, ArrowUpDown, Target, Trophy, ClipboardList,
    FileText, Briefcase, Share2, Shield, Calendar, Settings, LogOut, RefreshCw, Rocket,
    MessageCircle
} from 'lucide-react';
import { isValidPhone } from '../../services/whatsappService';
import { buildRosterStatus } from '../../services/reportService';
import topics from '../../services/topicProgressService';
import StudentMetricModal from '../coach/StudentMetricModal';
import VividKpi from '../shared/VividKpi';
import OverviewCharts from './OverviewCharts';

const safeParse = (key, defaultValue = []) => {
    try {
        const val = localStorage.getItem(key);
        if (!val || !val.trim() || val === 'undefined' || val === 'null' || val === '[object Object]') return defaultValue;
        return JSON.parse(val);
    } catch (e) {
        console.error(`Corrupt data in ${key}:`, e);
        return defaultValue;
    }
};

/** Öğrencinin ya kendi ya velisinin numarası kayıtlı mı? */
const hasAnyPhone = (s) => isValidPhone(s?.phone) || isValidPhone(s?.parentPhone);

// ─── Liste göstergeleri ────────────────────────────────────────
const rateColor = (rate) =>
    rate == null ? 'var(--ink-3)' : rate >= 70 ? 'var(--ok)' : rate >= 40 ? 'var(--highlight)' : 'var(--danger)';

/**
 * Program uyumu çubuğu.
 * Program yoksa / hiç işaretlenmemişse yüzde göstermez — "yapılmadı"
 * ile "henüz başlanmadı" farklı şeyler.
 */
/**
 * 🏷️ ÖĞRENCİ NOTLARI
 *
 * Liste satırında öğrencinin adının altında duran küçük etiketler.
 * Hepsi GERÇEK çalışmadan hesaplanır, elle girilen hiçbir şey yok:
 *
 *   ✏️ bugün / hafta   → öğrencinin günlük kayda girdiği soru sayısı
 *   🎯 isabet          → aynı kayıttan doğru / (doğru+yanlış)
 *   ✅ konu            → konu takibi motorundan tamamlanan konu sayısı
 *   📚 sayfa           → günlük kayda girilen kitap sayfası
 *   📊 net             → koçun yüklediği deneme sonuçlarından son net
 *
 * Veri yoksa etiket hiç basılmaz; boş "0" etiketleri satırı gürültüye
 * boğuyordu. Hiçbiri yoksa tek bir "kayıt yok" notu kalır.
 */
const StudentNotes = ({ st, konu }) => {
    if (!st) return null;

    const notlar = [];

    // Bugünkü çalışma — koçun ilk merak ettiği şey
    if (st.todayQuestions > 0) {
        notlar.push({
            k: 'bugun', metin: `✏️ bugün ${st.todayQuestions}`,
            renk: 'var(--ok)', baslik: 'Bugün çözdüğü soru',
        });
    }
    if (st.questions > 0) {
        notlar.push({
            k: 'hafta', metin: `✏️ hafta ${st.questions}`,
            renk: 'var(--ink-2)', baslik: 'Son 7 günde çözdüğü soru',
        });
    }
    if (st.accuracy != null) {
        notlar.push({
            k: 'isabet', metin: `🎯 %${st.accuracy}`,
            renk: st.accuracy >= 70 ? 'var(--ok)' : st.accuracy >= 50 ? 'var(--warn)' : 'var(--danger)',
            baslik: 'Haftalık isabet oranı (doğru / cevaplanan)',
        });
    }
    if (konu?.toplamKonu > 0 && (konu.tamam > 0 || konu.calisilan > 0)) {
        notlar.push({
            k: 'konu', metin: `✅ ${konu.tamam}/${konu.toplamKonu} konu`,
            renk: 'var(--brand)',
            baslik: `${konu.sinav} konu takibi — tamamlanan konu sayısı`,
        });
    }
    if (konu?.tekrar > 0) {
        notlar.push({
            k: 'tekrar', metin: `🔁 ${konu.tekrar} tekrar`,
            renk: 'var(--danger)', baslik: 'Hedefi dolduran ama isabeti düşük konular',
        });
    }
    if (st.pages > 0) {
        notlar.push({
            k: 'sayfa', metin: `📚 ${st.pages} sayfa`,
            renk: 'var(--info)', baslik: 'Son 7 günde okunan kitap sayfası',
        });
    }
    if (st.lastNet != null) {
        const yon = st.netTrend == null || st.netTrend === 0 ? ''
            : st.netTrend > 0 ? ` ▲${Math.abs(st.netTrend)}` : ` ▼${Math.abs(st.netTrend)}`;
        notlar.push({
            k: 'net', metin: `📊 ${st.lastNet} net${yon}`,
            renk: st.netTrend == null || st.netTrend === 0 ? 'var(--c4)'
                : st.netTrend > 0 ? 'var(--ok)' : 'var(--danger)',
            baslik: `${st.examCount} deneme · son sonuç${st.examLastDate ? ` ${st.examLastDate.split('-').reverse().join('.')}` : ''}`,
        });
    }

    if (notlar.length === 0) {
        return (
            <span className="text-[9px] text-ink-3 font-bold mt-1.5">
                Henüz çalışma kaydı yok
            </span>
        );
    }

    return (
        <div className="flex flex-wrap items-center gap-1 mt-1.5">
            {notlar.map((n) => (
                <span
                    key={n.k}
                    title={n.baslik}
                    className="text-[9px] font-black px-1.5 py-0.5 rounded-md border whitespace-nowrap"
                    style={{
                        color: n.renk,
                        borderColor: `color-mix(in srgb, ${n.renk} 35%, transparent)`,
                        background: `color-mix(in srgb, ${n.renk} 8%, transparent)`,
                    }}
                >
                    {n.metin}
                </span>
            ))}
        </div>
    );
};

/**
 * 🔘 ÖLÇÜT BUTONU
 *
 * Öğrenci satırındaki her ölçüt (soru, kitap, konu, net, grafik) bir
 * butondur; tıklanınca o ölçütün ayrıntı penceresi açılır. Eskiden
 * bunlar küçük etiketlerdi — okunuyordu ama tıklanamıyordu, koç
 * ayrıntı için öğrenci detay sayfasına gitmek zorundaydı.
 *
 * Veri yoksa buton soluk gösterilir ama YİNE DE tıklanabilir: koç
 * "neden boş?" diye bakabilmeli, pencere ne yapması gerektiğini anlatır.
 */
const MetricButton = ({ deger, alt, ikinci, ikinciRenk, renk, simge: Simge, bos, baslik, onClick }) => (
    <button
        onClick={onClick}
        title={baslik}
        className="w-full min-w-[92px] px-2.5 py-2 rounded-xl border transition-all hover:-translate-y-px active:translate-y-0"
        style={{
            borderColor: bos ? 'var(--line)' : `color-mix(in srgb, ${renk} 32%, transparent)`,
            background: bos ? 'transparent' : `color-mix(in srgb, ${renk} 8%, transparent)`,
            opacity: bos ? 0.55 : 1,
        }}
    >
        {Simge ? (
            <Simge size={20} className="mx-auto" style={{ color: bos ? 'var(--ink-3)' : renk }} />
        ) : (
            <span
                className="block text-base font-black tabular-nums leading-none"
                style={{ color: bos ? 'var(--ink-3)' : renk }}
            >
                {deger}
            </span>
        )}
        {alt && (
            <span className="block text-[9px] font-bold text-ink-3 mt-1 leading-none">{alt}</span>
        )}
        {ikinci && (
            <span
                className="block text-[9px] font-black mt-0.5 leading-none"
                style={{ color: ikinciRenk || 'var(--ink-3)' }}
            >
                {ikinci}
            </span>
        )}
    </button>
);

const ComplianceBar = ({ status }) => {
    if (!status?.hasProgram) {
        return <span className="text-[10px] font-bold text-ink-3 uppercase tracking-wider">program yok</span>;
    }
    if (!status.programStarted) {
        return (
            <span className="text-[10px] font-bold text-info bg-info/10 px-2 py-1 rounded-lg whitespace-nowrap">
                yeni atandı
            </span>
        );
    }

    const rate = status.programRate ?? 0;
    const color = rateColor(rate);

    return (
        <div className="flex items-center gap-2" title="Öğrencinin işaretlediği son haftanın uyum oranı">
            <div className="w-16 h-1.5 rounded-full bg-surface/8 overflow-hidden shrink-0">
                <div className="h-full rounded-full transition-all" style={{ width: `${rate}%`, backgroundColor: color }} />
            </div>
            <span className="text-[11px] font-black tabular-nums" style={{ color }}>%{rate}</span>
        </div>
    );
};

/** Risk rozeti + son hareket bilgisi. */
const RiskBadge = ({ status }) => {
    if (!status) return null;
    const { level, score } = status.risk;
    const style = {
        low: { bg: 'rgba(37,211,102,0.12)', color: 'var(--ok)', label: 'İYİ' },
        medium: { bg: 'rgba(201,168,76,0.14)', color: 'var(--highlight)', label: 'İZLE' },
        high: { bg: 'rgba(224,92,58,0.15)', color: 'var(--danger)', label: 'RİSK' },
    }[level];

    const idle = status.daysSinceActivity;

    return (
        <div className="flex flex-col items-center gap-1">
            <span
                className="text-[10px] font-black px-2 py-1 rounded-lg tracking-wider whitespace-nowrap"
                style={{ backgroundColor: style.bg, color: style.color }}
                title={`Risk skoru ${score}/100`}
            >
                {style.label}
            </span>
            <span className="text-[9px] text-ink-3 whitespace-nowrap">
                {idle == null ? 'hareket yok' : idle === 0 ? 'bugün' : `${idle} gün önce`}
            </span>
        </div>
    );
};

export default function OverviewTab({ students, navigate, setToast, onEdit, onDelete, onAssignTask, onSendMessage, onGoToRiskTab, onClearAll, onUploadExcel, onWhatsApp }) {

    const [searchQuery, setSearchQuery] = useState('');
    // Açık ölçüt penceresi: { student, olcut }
    const [detay, setDetay] = useState(null);
    const [gradeFilter, setGradeFilter] = useState('');
    const [sortField, setSortField] = useState('name');
    const [sortDir, setSortDir] = useState('asc');
    const [storageVersion, setStorageVersion] = useState(0);
    const [statusFilter, setStatusFilter] = useState('all');

    React.useEffect(() => {
        const handleStorage = () => setStorageVersion(v => v + 1);
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const toggleSort = (field) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    };

    const { allTasks, allTasksFlat, completedCount, pendingCount, taskRate } = React.useMemo(() => {
        const tasks = safeParse('student_tasks', {});
        const flat = Object.values(tasks).flat();
        const comp = flat.filter(t => t.completed || t.status === 'Tamamlandı').length;
        const pend = flat.filter(t => !t.completed && t.status !== 'Tamamlandı').length;
        const rate = flat.length > 0 ? Math.round((comp / flat.length) * 100) : 0;
        return { allTasks: tasks, allTasksFlat: flat, completedCount: comp, pendingCount: pend, taskRate: rate };
    }, [storageVersion]);

    const v2Results = React.useMemo(() => safeParse('v2_results_data', []), [storageVersion]);
    const avgNet = React.useMemo(() => {
       if (v2Results.length === 0) return 0;
       const total = v2Results.reduce((acc, curr) => acc + (parseFloat(curr.totalNet) || 0), 0);
       return (total / v2Results.length).toFixed(1);
    }, [v2Results]);

    const thisWeekTrials = React.useMemo(() => {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return v2Results.filter(r => new Date(r.uploadedAt || 0) > weekAgo);
    }, [v2Results]);

    const unreadMessages = React.useMemo(() => {
        const chats = safeParse('student_chats', {});
        return Object.values(chats).flat().filter(m => m.sender === 'student' && !m.read).length;
    }, [storageVersion]);

    const getStudentLastNet = (student) => {
        const sNum = student.schoolNumber ? String(student.schoolNumber).trim() : null;
        if (!sNum) return student.lastNet || 0;
        const matched = v2Results.filter(r => r.number && String(r.number).trim() === sNum);
        if (matched.length === 0) return student.lastNet || 0;
        const sorted = matched.sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0));
        return parseFloat(sorted[0].totalNet) || 0;
    };

    const getStudentNets = (student) => {
        const sNum = student.schoolNumber ? String(student.schoolNumber).trim() : null;
        if (!sNum) return [];
        return v2Results.filter(r => r.number && String(r.number).trim() === sNum)
            .sort((a, b) => new Date(a.uploadedAt || 0) - new Date(b.uploadedAt || 0))
            .map(r => parseFloat(r.totalNet) || 0);
    };

    // 🧾 Her öğrencinin canlı durumu — program uyumu, netler, risk
    const statusById = React.useMemo(() => {
        const list = buildRosterStatus(students);
        return new Map(list.map(s => [String(s.id), s]));
    }, [students, storageVersion]);

    const statusFor = React.useCallback(
        (s) => statusById.get(String(s.id)),
        [statusById]
    );

    /**
     * Konu takibi özeti — liste satırındaki "çözdüğü konu" notu için.
     * `topluOzet` depoları bir kez okur; öğrenci başına ayrı çağrı
     * yapılsaydı 50 öğrenci × 5 bölüm = 250 kez study_log ayrıştırılır
     * ve liste gözle görülür şekilde takılırdı.
     */
    const konuOzetById = React.useMemo(
        () => topics.topluOzet(students, topics.olcutOku()),
        [students, storageVersion]
    );

    const statusCounts = React.useMemo(() => {
        const all = [...statusById.values()];
        return {
            all: students.length,
            risk: all.filter(s => s.risk.level === 'high').length,
            lagging: all.filter(s => s.programRate != null && s.programRate < 60).length,
            idle: all.filter(s => s.daysSinceActivity == null || s.daysSinceActivity > 5).length,
        };
    }, [statusById, students.length]);

    const filteredStudents = React.useMemo(() => {
        return students.filter(s => {
            const nameStr = String(s.name || '').toLowerCase();
            const searchStr = String(searchQuery || '').toLowerCase();
            const matchQuery = nameStr.includes(searchStr) || String(s.schoolNumber).includes(searchStr);
            const matchGrade = !gradeFilter || String(s.grade) === String(gradeFilter);
            if (!matchQuery || !matchGrade) return false;

            if (statusFilter === 'all') return true;
            const st = statusFor(s);
            if (!st) return false;
            if (statusFilter === 'risk') return st.risk.level === 'high';
            if (statusFilter === 'lagging') return st.programRate != null && st.programRate < 60;
            if (statusFilter === 'idle') return st.daysSinceActivity == null || st.daysSinceActivity > 5;
            return true;
        }).sort((a, b) => {
            if (sortField === 'risk') {
                const va = statusFor(a)?.risk.score ?? -1;
                const vb = statusFor(b)?.risk.score ?? -1;
                return sortDir === 'asc' ? va - vb : vb - va;
            }
            if (sortField === 'program') {
                const va = statusFor(a)?.programRate ?? -1;
                const vb = statusFor(b)?.programRate ?? -1;
                return sortDir === 'asc' ? va - vb : vb - va;
            }
            let va = a[sortField] || '';
            let vb = b[sortField] || '';
            if (sortField === 'net') { va = getStudentLastNet(a); vb = getStudentLastNet(b); }
            if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
            return sortDir === 'asc' ? String(va).localeCompare(String(vb), 'tr') : String(vb).localeCompare(String(va), 'tr');
        });
    }, [students, searchQuery, gradeFilter, statusFilter, sortField, sortDir, v2Results, statusFor]);

    const availableGrades = [...new Set(students.map(s => s.grade).filter(Boolean))].sort();
    
    // Riskli öğrenci sayısı — tablodaki "RİSK" rozetiyle AYNI tanım.
    // (Eskiden burada ayrı bir hesap vardı: "14 gündür deneme yok". Aynı
    //  ekranda iki farklı riskli sayısı görünüyordu.)
    const riskCount = statusCounts.risk;

    // Son 8 denemenin sınıf ortalaması — KPI kartındaki mini trend çizgisi
    const netSparkline = React.useMemo(() => {
        const byDate = new Map();
        v2Results.forEach(r => {
            const net = parseFloat(r.totalNet);
            const raw = r.examDate || r.uploadedAt || r.date;
            if (!Number.isFinite(net) || !raw) return;
            const d = new Date(raw);
            if (Number.isNaN(d.getTime())) return;
            const k = d.toISOString().slice(0, 10);
            const a = byDate.get(k) || { sum: 0, n: 0 };
            a.sum += net; a.n += 1;
            byDate.set(k, a);
        });
        return [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-8).map(([, v]) => Math.round((v.sum / v.n) * 10) / 10);
    }, [v2Results]);

    const KPI_CARDS = [
        {
            label: 'Öğrenci Sayısı', value: students.length, icon: Users,
            color: 'var(--c1)', sub: 'Kayıtlı öğrenci', onClick: null,
        },
        {
            label: 'Riskli Öğrenci', value: riskCount, icon: AlertCircle,
            color: 'var(--danger)', sub: riskCount ? 'Acil ilgi bekliyor' : 'Risk yok', onClick: onGoToRiskTab,
        },
        {
            label: 'Sınıf Net Ortalaması', value: avgNet, icon: Activity,
            color: 'var(--highlight)', sub: `${v2Results.length} deneme sonucu`, trend: netSparkline, onClick: null,
        },
        {
            label: 'Görev Tamamlama', value: taskRate, icon: CheckCircle,
            color: 'var(--accent)', sub: `${completedCount}/${allTasksFlat.length} görev`, onClick: null,
        },
        {
            label: 'Okunmamış Mesaj', value: unreadMessages, icon: MessageSquare,
            color: 'var(--warn)', sub: 'Öğrenci mesajları', onClick: null,
        },
        {
            label: 'Hareketsiz Öğrenci', value: statusCounts.idle, icon: Zap,
            color: 'var(--c5)', sub: '5+ gündür kayıt yok',
            onClick: () => setStatusFilter('idle'),
        },
    ];

    const aiInsights = [
        riskCount > 0
            ? `${riskCount} öğrenci yüksek riskte. Listeyi "Riskli" filtresiyle daraltıp önce onlara bakın.`
            : statusCounts.idle > 0
                ? `${statusCounts.idle} öğrenciden 5 gündür hareket yok. "Hareketsiz" filtresiyle görebilirsiniz.`
                : "Sınıfınızın durumu gayet iyi görünüyor.",
        "Öğrenci lojistiği ile toplu veri yüklemeyi denediniz mi?"
    ];

    return (
        <div className="space-y-6 pb-32">
            {/* Canlı arka planlı başlık şeridi */}
            <div className="aurora rounded-[26px] border border-line px-6 py-6 md:px-8 md:py-7">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="animate-fade-in-up">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="live-dot" />
                            <span className="text-[10px] font-black tracking-[.22em] text-ink-3 uppercase">
                                Canlı veri
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-ink syne tracking-tight uppercase">
                            KONTROL <em className="not-italic text-brand">PANELİ</em>
                        </h2>
                        <p className="text-[11px] text-ink-3 font-black tracking-widest mt-2 uppercase">
                            {students.length} öğrenci · {v2Results.length} deneme sonucu · {allTasksFlat.length} görev
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="ring" style={{ '--p': taskRate, '--ring-c': 'var(--accent)' }}>
                            <span className="text-[13px] font-black text-ink leading-none">%{taskRate}</span>
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-ink-3">Görev</p>
                            <p className="text-[11px] font-bold text-ink-2">tamamlanma</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 stagger">
                {KPI_CARDS.map((card) => (
                    <VividKpi
                        key={card.label}
                        label={card.label}
                        value={card.value}
                        sub={card.sub}
                        icon={card.icon}
                        color={card.color}
                        trend={card.trend}
                        onClick={card.onClick}
                    />
                ))}
            </div>

            {/* İşlevsel grafikler — sınıfın gidişatı tek bakışta */}
            <OverviewCharts students={students} results={v2Results} statusById={statusById} />

            <div className="premium-card p-6 bg-surface border-line">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center border border-brand/20"><Users className="text-brand" size={20} /></div>
                        <h3 className="text-xl font-black text-ink syne uppercase">Öğrenci <em className="not-italic text-brand">Portfolyo</em> Yönetimi</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Görev atama ve toplu mesaj daha önce hiçbir butona
                            bağlı değildi; panele bu ekrandan erişilemiyordu. */}
                        <button onClick={onAssignTask} className="b b-fill b-accent">
                            <ClipboardList size={15} /> GÖREV ATA
                        </button>
                        <button onClick={onSendMessage} className="b b-fill b-info">
                            <Megaphone size={15} /> TOPLU MESAJ
                        </button>
                        <button onClick={onUploadExcel} className="b b-fill b-ok">
                            <Upload size={15} /> EXCEL YÜKLE
                        </button>
                        <button onClick={onClearAll} className="b b-line" style={{ '--btn': 'var(--danger)' }}>
                            <Trash2 size={15} /> LİSTEYİ SİL
                        </button>
                        <div className="h-8 w-px bg-surface/8 mx-1" />
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3 group-focus-within:text-brand" size={16} />
                            <input
                                type="text"
                                placeholder="İsim veya numara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 pr-6 py-4 bg-page border border-line rounded-2xl focus:outline-none focus:border-brand/50 text-xs text-ink w-full sm:w-64 font-bold"
                            />
                        </div>
                    </div>
                </div>

                {/* 🔎 Hızlı durum filtreleri — 50 öğrenciyi tek bakışta elemek için */}
                <div className="flex flex-wrap gap-2 px-6 pb-4">
                    {[
                        // Seçili çipin zemini marka rengi; yazı rengi (--ink-on)
                        // marka rengine göre hesaplandığı için her palette okunur
                        // kalır. Eskiden zemin durum rengiydi ve koyu zemin
                        // seçildiğinde beyaz yazı okunmuyordu.
                        { id: 'all', label: 'Tümü', count: statusCounts.all, color: 'var(--ink-3)' },
                        { id: 'risk', label: 'Riskli', count: statusCounts.risk, color: 'var(--danger)' },
                        { id: 'lagging', label: 'Program Aksayan', count: statusCounts.lagging, color: 'var(--warn)' },
                        { id: 'idle', label: 'Hareketsiz', count: statusCounts.idle, color: 'var(--info)' },
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setStatusFilter(f.id)}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11px] font-black transition ${
                                statusFilter === f.id ? 'bg-brand text-ink-on' : 'bg-surface-2 text-ink-3 hover:text-ink-2 border border-line'
                            }`}
                        >
                            {f.label}
                            <span
                                className="px-1.5 py-0.5 rounded-md text-[10px]"
                                style={{
                                    backgroundColor: statusFilter === f.id ? 'rgba(0,0,0,0.18)' : `color-mix(in srgb, ${f.color} 16%, transparent)`,
                                    color: statusFilter === f.id ? 'var(--ink-on)' : f.color,
                                }}
                            >
                                {f.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* ══ MOBİL: kart listesi ═══════════════════════════════
                    Telefonda bu tablo 8 sütunla yatay kaydırılıyordu ve
                    kaydırınca BAŞLIK SATIRI kayboluyordu — koç hangi sayıya
                    baktığını bilemiyordu. Aynı veri, aynı sırayla, kart
                    olarak sunuluyor; tüm kart tek dokunuşla öğrenciye gider. */}
                <ul className="lg:hidden divide-y divide-line border-t border-line">
                    {filteredStudents.map((s) => {
                        const st = statusFor(s);
                        const konu = konuOzetById.get(String(s.id));
                        return (
                            <li key={s.id}>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/coach/student/${s.id}`)}
                                    className="w-full text-left px-4 py-4 min-h-[64px] transition-colors hover:bg-surface-3 active:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="tip-small font-bold text-ink truncate">{s.name}</p>
                                            <p className="tip-caption truncate">
                                                #{s.schoolNumber || '---'}
                                                {[s.grade, s.section].filter(Boolean).length
                                                    ? ` · ${[s.grade, s.section].filter(Boolean).join('-')}`
                                                    : ''}
                                            </p>
                                        </div>
                                        <div className="shrink-0"><RiskBadge status={st} /></div>
                                    </div>

                                    {/* Program uyumu — koçun ilk baktığı gösterge */}
                                    <div className="mt-2.5"><ComplianceBar status={st} /></div>

                                    {/* Sayılar tek satırda; tabloda ayrı sütun olanlar */}
                                    <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
                                        <span className="tip-caption">
                                            <span className="rakam font-bold text-ink">{st?.questions || 0}</span> soru
                                        </span>
                                        <span className="tip-caption">
                                            <span className="rakam font-bold text-ink">{st?.pages || 0}</span> sayfa
                                        </span>
                                        {konu?.tamamlanan != null && (
                                            <span className="tip-caption">
                                                <span className="rakam font-bold text-ink">{konu.tamamlanan}</span> konu
                                            </span>
                                        )}
                                        {st?.lastNet != null && (
                                            <span className="tip-caption">
                                                son net <span className="rakam font-bold text-ink">{st.lastNet}</span>
                                            </span>
                                        )}
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                    {filteredStudents.length === 0 && (
                        <li className="py-12 text-center tip-caption">Bu süzgeçle eşleşen öğrenci yok.</li>
                    )}
                </ul>

                {/* ══ MASAÜSTÜ: tam tablo ══════════════════════════════ */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-surface-2 border-b border-line">
                                <th className="px-6 py-5 text-left text-[10px] font-black text-ink-3 uppercase tracking-widest">OKUL NO</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-ink-3 uppercase tracking-widest">ÖĞRENCİ</th>
                                <th className="px-6 py-5 text-center text-[10px] font-black text-ink-3 uppercase tracking-widest">
                                    <button
                                        onClick={() => toggleSort('program')}
                                        className="inline-flex items-center justify-center gap-1 hover:text-ink-2 transition min-h-[44px] min-w-[44px] -my-3 px-1"
                                        title="Program uyumuna göre sırala"
                                    >
                                        PROGRAM <ArrowUpDown size={11} />
                                    </button>
                                </th>
                                <th className="px-4 py-5 text-center text-[10px] font-black text-ink-3 uppercase tracking-widest">SORU</th>
                                <th className="px-4 py-5 text-center text-[10px] font-black text-ink-3 uppercase tracking-widest">KİTAP</th>
                                <th className="px-4 py-5 text-center text-[10px] font-black text-ink-3 uppercase tracking-widest">ÇÖZÜLEN KONU</th>
                                <th className="px-4 py-5 text-center text-[10px] font-black text-ink-3 uppercase tracking-widest">KALAN KONU</th>
                                <th className="px-4 py-5 text-center text-[10px] font-black text-ink-3 uppercase tracking-widest">
                                    <button
                                        onClick={() => toggleSort('net')}
                                        className="inline-flex items-center justify-center gap-1 hover:text-ink-2 transition min-h-[44px] min-w-[44px] -my-3 px-1"
                                        title="Nete göre sırala"
                                    >
                                        SON DENEME NETİ <ArrowUpDown size={11} />
                                    </button>
                                </th>
                                <th className="px-4 py-5 text-center text-[10px] font-black text-ink-3 uppercase tracking-widest">DENEME GRAFİĞİ</th>
                                <th className="px-6 py-5 text-center text-[10px] font-black text-ink-3 uppercase tracking-widest">
                                    <button
                                        onClick={() => toggleSort('risk')}
                                        className="inline-flex items-center justify-center gap-1 hover:text-ink-2 transition min-h-[44px] min-w-[44px] -my-3 px-1"
                                        title="Riske göre sırala"
                                    >
                                        DURUM <ArrowUpDown size={11} />
                                    </button>
                                </th>
                                <th className="px-6 py-5 text-right text-[10px] font-black text-ink-3 uppercase tracking-widest">İŞLEM</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredStudents.map((s) => {
                                const st = statusFor(s);
                                return (
                                <tr key={s.id} className="hover:bg-surface/[0.02] transition-colors group">
                                    <td className="px-6 py-5">
                                        <span className="text-[10px] font-black text-ink-3 bg-surface/5 border border-line px-3 py-1.5 rounded-xl">#{s.schoolNumber || '---'}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-ink group-hover:text-brand transition-colors uppercase syne">{s.name}</span>
                                            {/* Sınıf/şube yoksa "/ LİSESİ" gibi anlamsız metin çıkmasın */}
                                            <span className="text-[9px] text-ink-3 font-bold uppercase tracking-wider">
                                                {[s.grade, s.section].filter(Boolean).join('-') || 'Sınıf bilgisi yok'}
                                                {s.target ? ` · ${s.target}` : ''}
                                            </span>

                                            {/* Öğrencinin kendi çalışmasından gelen küçük notlar.
                                                Hepsi gerçek kayıttan hesaplanır: günlük soru/sayfa
                                                kaydı, konu takibi ve yüklenen deneme sonuçları. */}
                                            <StudentNotes
                                                st={st}
                                                konu={konuOzetById.get(String(s.id))}
                                            />
                                        </div>
                                    </td>

                                    {/* Program uyumu */}
                                    <td className="px-6 py-5">
                                        <ComplianceBar status={st} />
                                    </td>

                                    {/* ── Ölçüt butonları ────────────────────
                                        Her biri kendi sütununda; tıklanınca o
                                        ölçütün ayrıntı penceresi açılır. Sayılar
                                        öğrencinin günlük kaydı, konu takibi ve
                                        yüklenen deneme sonuçlarından gelir. */}
                                    <td className="px-4 py-4 text-center">
                                        <MetricButton
                                            deger={st?.questions || 0}
                                            alt={st?.todayQuestions > 0 ? `bugün ${st.todayQuestions}` : 'bu hafta'}
                                            ikinci={st?.accuracy != null ? `%${st.accuracy} isabet` : null}
                                            renk="var(--brand)"
                                            bos={!st?.questions}
                                            baslik="Soru çalışması ayrıntısı"
                                            onClick={() => setDetay({ student: s, olcut: 'soru' })}
                                        />
                                    </td>

                                    <td className="px-4 py-4 text-center">
                                        <MetricButton
                                            deger={st?.pages || 0}
                                            alt="sayfa"
                                            renk="var(--info)"
                                            bos={!st?.pages}
                                            baslik="Kitap okuma ayrıntısı"
                                            onClick={() => setDetay({ student: s, olcut: 'kitap' })}
                                        />
                                    </td>

                                    <td className="px-4 py-4 text-center">
                                        <MetricButton
                                            deger={konuOzetById.get(String(s.id))?.tamam ?? 0}
                                            alt={`/ ${konuOzetById.get(String(s.id))?.toplamKonu ?? 0} konu`}
                                            renk="var(--ok)"
                                            bos={!konuOzetById.get(String(s.id))?.tamam}
                                            baslik="Tamamlanan konuların listesi"
                                            onClick={() => setDetay({ student: s, olcut: 'cozulen' })}
                                        />
                                    </td>

                                    <td className="px-4 py-4 text-center">
                                        <MetricButton
                                            deger={(() => {
                                                const k = konuOzetById.get(String(s.id));
                                                return k ? k.toplamKonu - k.tamam : 0;
                                            })()}
                                            alt="konu kaldı"
                                            ikinci={(() => {
                                                const k = konuOzetById.get(String(s.id));
                                                if (!k) return null;
                                                const p = [];
                                                if (k.calisilan) p.push(`${k.calisilan} devam`);
                                                if (k.tekrar) p.push(`${k.tekrar} tekrar`);
                                                return p.length ? p.join(' · ') : null;
                                            })()}
                                            renk="var(--warn)"
                                            baslik="Kalan ve devam eden konular"
                                            onClick={() => setDetay({ student: s, olcut: 'kalan' })}
                                        />
                                    </td>

                                    <td className="px-4 py-4 text-center">
                                        <MetricButton
                                            deger={st?.lastNet ?? '—'}
                                            alt={st?.examCount ? `${st.examCount} deneme` : 'sonuç yok'}
                                            ikinci={st?.netTrend != null && st.netTrend !== 0
                                                ? `${st.netTrend > 0 ? '▲' : '▼'}${Math.abs(st.netTrend)} net`
                                                : null}
                                            ikinciRenk={st?.netTrend > 0 ? 'var(--ok)' : 'var(--danger)'}
                                            renk="var(--c4)"
                                            bos={st?.lastNet == null}
                                            baslik="Deneme sonuçlarının dökümü"
                                            onClick={() => setDetay({ student: s, olcut: 'net' })}
                                        />
                                    </td>

                                    <td className="px-4 py-4 text-center">
                                        <MetricButton
                                            simge={BarChart2}
                                            alt={st?.examCount > 1 ? `${st.examCount} sonuç` : 'yetersiz'}
                                            renk="var(--c5)"
                                            bos={!st?.examCount || st.examCount < 2}
                                            baslik="Net gelişim grafiği"
                                            onClick={() => setDetay({ student: s, olcut: 'grafik' })}
                                        />
                                    </td>

                                    {/* Risk rozeti */}
                                    <td className="px-6 py-5 text-center">
                                        <RiskBadge status={st} />
                                    </td>

                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                                            {onWhatsApp && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onWhatsApp(s); }}
                                                    title={hasAnyPhone(s) ? 'WhatsApp mesajı gönder' : 'Telefon numarası kayıtlı değil'}
                                                    disabled={!hasAnyPhone(s)}
                                                    className="p-3 bg-ok/10 text-ok rounded-xl hover:bg-ok hover:text-ink-on transition-all disabled:opacity-25 disabled:hover:bg-ok/10 disabled:hover:text-ok disabled:cursor-not-allowed"
                                                >
                                                    <MessageCircle size={18} />
                                                </button>
                                            )}
                                            <button onClick={() => navigate(`/coach/student/${s.id}`)} title="Detay" className="p-3 bg-surface/5 text-ink-2 rounded-xl hover:bg-brand hover:text-ink-on transition-all"><ChevronRight size={18} /></button>
                                            <button onClick={(e) => onEdit(e, s)} title="Duzenle" className="p-3 bg-surface/5 text-ink-2 rounded-xl hover:bg-surface/20 hover:text-ink transition-all"><Edit2 size={18} /></button>
                                            <button onClick={(e) => onDelete(e, s)} title="SİL" className="p-3 bg-danger/10 text-danger rounded-xl hover:bg-danger hover:text-white transition-all"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredStudents.length === 0 && (
                        <div className="py-24 text-center">
                             <h3 className="text-xs font-black text-ink-3 uppercase tracking-[0.5em]">LİSTE ŞU AN TEMİZ VE BOŞ</h3>
                        </div>
                    )}
                </div>
            </div>

            {/* Ölçüt ayrıntı penceresi — listedeki butonlardan açılır */}
            {detay && (
                <StudentMetricModal
                    student={detay.student}
                    olcut={detay.olcut}
                    onKapat={() => setDetay(null)}
                />
            )}
        </div>
    );
}
