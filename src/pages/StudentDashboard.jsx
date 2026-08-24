import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
// 📱 Mobil Navigasyon
import { StudentBottomNav } from '../components/shared/MobileBottomNav';
import KullaniciMenusu from '../components/shared/KullaniciMenusu';
import BugunEkrani from '../components/student/BugunEkrani';
import GelisimPanosu from '../components/student/GelisimPanosu';
import { cn } from '../lib/cn';
import { Sayac } from '../components/ui/Badge';
import { BolumHataSiniri } from '../components/ui';
import { bildir } from '../services/uiGeriBildirim';
import SmartNotificationBell from '../components/shared/SmartNotifications';
import PWAInstallBanner from '../components/shared/PWAInstallBanner';
import { StudentDashboardSkeleton } from '../components/shared/SkeletonLoaders';
import MarkaFiligran from '../components/ui/MarkaFiligran';
import DenemeAnalizi from '../components/student/DenemeAnalizi';
import DailyGoalCard from '../components/student/DailyGoalCard';
import {
    MessageSquare, LogOut, Settings, Key, Video,
    Home, ClipboardList, BarChart2, BookOpen, Calendar,
    CheckCircle, Clock, AlertCircle, Star, Target,
    TrendingUp, Award, Zap, Send, X, ChevronRight,
    PlayCircle, Flame, Trophy, Plus, Check, XCircle,
    Download, FileText, Eye, Moon, Sun, BookX, PencilLine, User,
    MoreHorizontal, Timer, NotebookPen, Medal
} from 'lucide-react';
import { generateStudentReport } from '../utils/pdfGenerator';
// 23.08 tasarım: merkez (hub) ekranlarının yapı taşları ve verisi
import { GelisimKarti, IstatistikCipi, SegmentliSecim } from '../components/ui/Gelisim';
import { getSummary } from '../services/studyLogService';
import { istikrar } from '../services/gelisimAnalitik';
import denemeKayitlari from '../services/denemeKayitlari';
import programProgress from '../services/programProgressService';
import {
    ResponsiveContainer, LineChart, Line, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip as GrafikTooltip,
} from 'recharts';
import { calculateEstimatedScore, normalizeTRName, normalizeSchoolNumber } from '../utils/scoreCalculator';
import { api } from '../services/api';
import MARKA from '../data/marka';
import guidanceService from '../services/guidanceService';
import AnalyticsCharts from '../components/AnalyticsCharts';
import PomodoroTimer from '../components/PomodoroTimer';
import SubjectTracker from '../components/SubjectTracker';
import DailyOverview from '../components/dashboard/DailyOverview';
import ActivityFeed from '../components/social/ActivityFeed';
import { getStudentPermissions } from '../utils/permissions';
import firebaseSync from '../services/firebaseSync';
import StudentProgramTab from '../components/StudentProgramTab';
import ProgramKarnem from '../components/student/ProgramKarnem';
import StudentTestsTab from '../components/StudentTestsTab';
// 🌟 Yeni Gamification & Analytics
import BadgeCollection, { XPBar, StreakCard } from '../components/gamification/BadgeSystem';
import AdvancedAnalytics from '../components/charts/AdvancedAnalytics';
import { useGamification } from '../context/GamificationContext';
import { AICoachButton } from '../components/AICoachChat';
// 🎯 Yeni 3 Özellik
import PerformanceRadar from '../components/charts/PerformanceRadar';
import PredictiveAnalytics from '../components/charts/PredictiveAnalytics';
import YKSCountdownWidget from '../components/student/YKSCountdownWidget';
import SubjectWeaknessAnalyzer from '../components/student/SubjectWeaknessAnalyzer';
import XPLeaderboard from '../components/student/XPLeaderboard';
import GoalSettingModule from '../components/student/GoalSettingModule';
// 🆕 Yeni Özellikler
import ExamCalendar from '../components/student/ExamCalendar';
import AITopicSuggestions from '../components/student/AITopicSuggestions';
import NetProgressChart from '../components/student/NetProgressChart';
import NoteBook from '../components/student/NoteBook';
import ErrorNotebook from '../components/student/ErrorNotebook';
import DailyStudyLog from '../components/student/DailyStudyLog';
// 🆕 13 Madde İmplementasyonu
import MotivationNotifications from '../components/student/MotivationNotifications';
import ClassComparisonWidget from '../components/student/ClassComparisonWidget';
import ParentQRModal from '../components/student/ParentQRModal';
// 🚀 12 Madde Geliştirme
import SelfAssessmentForm from '../components/student/SelfAssessment';
import { StudentAppointmentBooker } from '../components/coach/AppointmentSystem';
import TabBadge from '../components/shared/TabBadge';
import TopicTracker from '../components/student/TopicTracker';
import useTabBadges from '../hooks/useTabBadges';
import SubjectPomodoro from '../components/student/SubjectPomodoro';
import StudentPortfolio from '../components/student/StudentPortfolio';
import ExamComparisonMatrix from '../components/student/ExamComparisonMatrix';
import { OfflineBanner, useOfflineStatus } from '../services/offlineSync';
import RealtimeNotificationBell from '../components/shared/RealtimeNotifications';
import VividKpi from '../components/shared/VividKpi';
import ThemeToggle from '../components/shared/ThemeToggle';
import { MODULE_ICONS } from '../components/icons/ModuleIcons';
import MarkaGorsel from '../components/ui/MarkaGorsel';
import Modal from '../components/ui/Modal';
import { yaz, listeOku, nesneOku, oku } from '../services/veriDeposu';


// ⚠️ Error Boundary - Firebase/network hataı olduğunda beyaz ekran önler
class ErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, info) { console.warn('StudentDashboard ErrorBoundary:', error.message); }
    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-surface-2 flex items-center justify-center p-4">
                    <div className="bg-surface rounded-2xl p-8 max-w-md w-full text-center shadow-xl border border-warn">
                        <div className="w-14 h-14 bg-warn-soft rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={28} className="text-warn" />
                        </div>
                        <h2 className="text-lg font-black text-ink mb-2">Bağlantı Sorunu</h2>
                        <p className="text-sm text-ink-2 mb-2 font-medium">Veriler önbellekten yükleniyor.</p>
                        <p className="text-xs text-ink-3 mb-5">Sunucuya bağlantı geçici olarak sağlanamadı. Tüm verileriniz güvende — çevrimdışı modda çalışmaya devam edebilirsiniz.</p>
                        <button
                            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
                            className="bg-brand text-white px-6 py-2.5 rounded-xl font-bold hover:bg-brand-hover transition text-sm"
                        >
                            Yeniden Dene
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// ─── Güvenli string yardımcısı ─────────────────────────────────
const toStr = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && val.name) return val.name;
    return String(val);
};

// ─── Öncelik rozeti ─────────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
    const map = {
        urgent: { label: 'ACİL', cls: 'bg-danger/10 text-danger border-danger/20' },
        high: { label: 'YÜKSEK', cls: 'bg-warn/10 text-warn border-warn/20' },
        normal: { label: 'NORMAL', cls: 'bg-accent/10 text-accent border-accent/20' },
        low: { label: 'DÜŞÜK', cls: 'bg-surface/5 text-ink-3 border-line' },
    };
    const cfg = map[priority] || map.normal;
    return <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border tracking-widest ${cfg.cls}`}>{cfg.label}</span>;
};

// ─── Kategori ikonu ─────────────────────────────────────────────
const CategoryIcon = ({ category }) => {
    const map = {
        homework: <BookOpen size={16} className="text-brand" />,
        study: <Target size={16} className="text-accent" />,
        practice: <ClipboardList size={16} className="text-c4" />,
        reading: <BookOpen size={16} className="text-info" />,
        revision: <Zap size={16} className="text-warn" />,
    };
    return <span>{map[category] || <ClipboardList size={16} className="text-ink-3" />}</span>;
};

// ─── Deneme Detay Bileşeni ─────────────────────────────────────────
const ExamDetailSection = ({ examData, permissions, user }) => {
    const [selectedExam, setSelectedExam] = useState(null);
    const [toastMsg, setToastMsg] = useState('');

    /**
     * ⚠️ BURAYA GÖVDE KİLİDİ EKLEME. Detay penceresi ortak `ui/Modal`
     * ile açılıyor; kilidi Modal sayaçla yönetiyor. Eskiden burada duran
     * ikinci kilit hem gereksizdi hem tehlikeliydi: temizliği `body`yi
     * koşulsuz '' yapıyordu — başka bir pencere açıkken bile kilidi
     * kaldırıyordu. MobileBottomNav'daki eşi telefonda tüm sekmelerin
     * kaydırmasını kalıcı kilitlemişti (ayrıntı orada).
     */

    const showToast = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(''), 3000);
    };

    const getSubjectNet = (exam, key) => {
        if (exam[key] != null && !isNaN(parseFloat(exam[key]))) return parseFloat(exam[key]);
        if (exam.subjects?.[key] != null) {
            const v = exam.subjects[key];
            if (typeof v === 'object') return parseFloat(v.net) || 0;
            return parseFloat(v) || 0;
        }
        return null;
    };

    const handlePDF = (exam) => {
        try {
            // v2_results_data'dan tam veriyi bul
            const v2Results = listeOku('v2_results_data');
            const v2Trials = listeOku('v2_trials_data');
            // Öğrenciye ait sonucu bul
            const fullResult = v2Results.find(r => r.id === exam.id) || exam;
            const trial = v2Trials.find(t => t.id === fullResult.trialId) || { name: exam.name, examType: exam.examType, date: exam.date };
            const allStudentResults = v2Results.filter(r => r.trialId === fullResult.trialId);
            generateStudentReport(fullResult, trial, allStudentResults);
        } catch (e) {
            showToast('PDF oluşturulurken hata: ' + e.message);
        }
    };

    if (examData.length === 0) {
        return (
            <div className="icerik-gecis space-y-8">
                <h1 className="text-3xl font-black text-ink syne tracking-tight">DENEME SONUÇLARIM</h1>
                <div className="premium-card p-20 text-center border-dashed border-line">
                    <div className="w-20 h-20 bg-surface/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-line">
                        <BarChart2 size={40} className="text-ink-2" />
                    </div>
                    <h3 className="text-xl font-bold text-ink mb-3 syne">HENÜZ DENEME SONUCU YOK</h3>
                    <p className="text-ink-3 text-sm max-w-sm mx-auto leading-relaxed">
                        Koçun deneme sonuçlarını sisteme yüklediğinde performans analizlerini burada detaylı olarak görebileceksin.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="icerik-gecis space-y-8">
            {toastMsg && (
                <div className="fixed bottom-24 right-8 z-[100] premium-glass border-brand/30 text-ink px-6 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 icerik-gecis-up">
                    <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                    {toastMsg}
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-ink syne tracking-tight">DENEME SONUÇLARIM</h1>
                    <p className="text-brand text-[10px] font-black tracking-[0.2em] mt-1 uppercase">PERFORMANS ANALİZİ VE GELİŞİM TAKİBİ</p>
                </div>
            </div>

            {/* Özet istatistikler */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {[
                    { label: 'TOPLAM DENEME', value: examData.length, color: 'var(--highlight)', icon: ClipboardList },
                    { label: 'EN YÜKSEK NET', value: Math.max(...examData.map(e => e.totalNet || 0)).toFixed(1), color: 'var(--accent)', icon: Award },
                    { label: 'ORTALAMA NET', value: (examData.reduce((s, e) => s + (e.totalNet || 0), 0) / examData.length).toFixed(1), color: 'var(--c4)', icon: TrendingUp },
                    { label: 'SON DURUM', value: examData[examData.length - 1]?.totalNet?.toFixed(1) || '-', color: 'var(--highlight)', icon: Zap },
                ].map((s, i) => (
                    <div key={i} className="premium-card p-6 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-surface/5 rounded-lg border border-line">
                                    <s.icon size={18} style={{ color: s.color }} />
                                </div>
                            </div>
                            <div className="text-3xl font-black text-ink syne mb-1">{s.value}</div>
                            <div className="text-[10px] font-black text-ink-3 uppercase tracking-widest">{s.label}</div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-20 h-20 blur-3xl opacity-10 pointer-events-none" style={{ backgroundColor: s.color }} />
                    </div>
                ))}
            </div>

            {/* Performans Grafikleri */}
            {permissions.canViewAnalytics && (
                <div className="premium-card p-8 border-accent/20">
                    <h2 className="text-xl font-black text-ink syne mb-8 flex items-center gap-3">
                        <div className="p-2 bg-accent/10 rounded-lg">
                            <TrendingUp size={20} className="text-accent" />
                        </div>
                        GELİŞİM GRAFİKLERİ
                    </h2>
                    <AnalyticsCharts examData={examData} />
                </div>
            )}

            {/* Deneme Listesi */}
            <div className="premium-card overflow-hidden border-line">
                <div className="p-6 border-b border-line bg-surface/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-black text-ink syne leading-tight">TÜM DENEMELER</h2>
                        <p className="text-[10px] text-ink-2 font-bold uppercase tracking-wider mt-0.5">DETAYLI ANALİZ İÇİN TIKLAYINIZ</p>
                    </div>
                </div>
                <div className="divide-y divide-white/5">
                    {[...examData].reverse().map((exam, i) => {
                        const tytSubs = [
                            ['Türkçe', getSubjectNet(exam, 'turkce')],
                            ['Matematik', getSubjectNet(exam, 'mat')],
                            ['Fen', getSubjectNet(exam, 'fen')],
                            ['Sosyal', getSubjectNet(exam, 'sosyal')],
                        ].filter(([, v]) => v != null && v > 0);
                        const aytSubs = [
                            ['SAY', exam.sayNet, 'var(--highlight)'],
                            ['EA', exam.eaNet, 'var(--accent)'],
                            ['SÖZ', exam.sozNet, 'var(--c4)'],
                            ['DİL', exam.dilNet, 'var(--warn)'],
                        ].filter(([, v]) => v > 0);

                        return (
                            <div
                                key={exam.id || i}
                                className="p-6 hover:bg-surface/5 transition-all duration-yavas cursor-pointer group"
                                onClick={() => setSelectedExam(exam)}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-5">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xs font-black border transition-all duration-yavas group-hover:scale-110 ${
                                            exam.examType === 'AYT' 
                                            ? 'bg-c4/10 text-c4 border-c4/20' 
                                            : 'bg-accent/10 text-accent border-accent/20'
                                        }`}>
                                            {exam.examType || 'TYT'}
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-ink group-hover:text-brand transition-colors syne">{exam.name || 'Deneme'}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] font-black text-ink-2 uppercase tracking-widest flex items-center gap-1.5">
                                                    <Calendar size={12} /> {exam.date ? new Date(exam.date).toLocaleDateString('tr-TR') : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-ink syne leading-none">{(exam.totalNet || 0).toFixed(1)}</p>
                                            <p className="text-[10px] font-black text-accent tracking-[0.2em] mt-1.5 uppercase">TOPLAM NET</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handlePDF(exam); }}
                                                className="w-10 h-10 bg-surface/5 hover:bg-brand/20 text-ink-3 hover:text-brand border border-line rounded-xl transition-all duration-yavas flex items-center justify-center"
                                                title="PDF Karne İndir"
                                            >
                                                <Download size={18} />
                                            </button>
                                            <div className="w-10 h-10 bg-surface/5 text-ink-2 rounded-xl flex items-center justify-center border border-line group-hover:border-brand/30 group-hover:text-brand transition-all">
                                                <ChevronRight size={18} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Net Detayları */}
                                <div className="mt-4 flex flex-wrap gap-2 md:pl-20">
                                    {(exam.examType !== 'AYT' ? tytSubs : aytSubs).map(([lbl, net]) => (
                                        <span key={lbl} className="bg-surface/5 border border-line px-3 py-1 rounded-lg text-[10px] font-black text-ink-3 group-hover:border-brand/20 transition-all">
                                            {lbl}: <span className="text-ink ml-1">{Number(net).toFixed(1)}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Detay Modal - Premium Glass */}
            {selectedExam && (
                <Modal
                    acik
                    onClose={() => setSelectedExam(null)}
                    baslikGizle
                    genislik="xl"
                    govdeClassName="p-0 flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-line flex items-center justify-between shrink-0 bg-surface/80 backdrop-blur-xl">
                        <div className="flex items-center gap-5">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-sm font-black border ${
                                selectedExam.examType === 'AYT' 
                                ? 'bg-c4/20 text-c4 border-c4/30' 
                                : 'bg-accent/20 text-accent border-accent/30'
                            }`}>
                                {selectedExam.examType || 'TYT'}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-ink syne leading-tight">{selectedExam.name || 'Deneme'}</h3>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-xs font-bold text-ink-3 uppercase tracking-widest flex items-center gap-2">
                                        <Calendar size={14} className="text-brand" />
                                        {selectedExam.date ? new Date(selectedExam.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handlePDF(selectedExam)}
                                className="premium-button px-5 h-12 text-xs flex items-center gap-2"
                            >
                                <Download size={16} /> PDF KARNE
                            </button>
                            <button 
                                onClick={() => setSelectedExam(null)} 
                                className="w-12 h-12 bg-surface/5 hover:bg-danger/10 text-ink-3 hover:text-danger rounded-xl border border-line transition-all flex items-center justify-center"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-8 text-ink">
                        {/* Özet Kartları */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-surface/5 border border-line rounded-3xl p-6 text-center group hover:bg-brand/5 transition-all">
                                <div className="text-[10px] font-black text-ink-2 uppercase tracking-widest mb-2 group-hover:text-brand">TOPLAM NET</div>
                                <div className="text-3xl font-black text-ink syne">{(selectedExam.totalNet || 0).toFixed(2)}</div>
                            </div>
                            {selectedExam.examType === 'AYT' ? (
                                <>
                                    {selectedExam.sayNet > 0 && <div className="bg-surface/5 border border-line rounded-3xl p-6 text-center hover:bg-[#a78bfa]/5 transition-all"><div className="text-[10px] font-black text-ink-2 uppercase tracking-widest mb-2">SAY NET</div><div className="text-3xl font-black text-ink syne">{Number(selectedExam.sayNet).toFixed(1)}</div></div>}
                                    {selectedExam.eaNet > 0 && <div className="bg-surface/5 border border-line rounded-3xl p-6 text-center hover:bg-accent/5 transition-all"><div className="text-[10px] font-black text-ink-2 uppercase tracking-widest mb-2">EA NET</div><div className="text-3xl font-black text-ink syne">{Number(selectedExam.eaNet).toFixed(1)}</div></div>}
                                    {selectedExam.sozNet > 0 && <div className="bg-surface/5 border border-line rounded-3xl p-6 text-center hover:bg-[#32a852]/5 transition-all"><div className="text-[10px] font-black text-ink-2 uppercase tracking-widest mb-2">SÖZ NET</div><div className="text-3xl font-black text-ink syne">{Number(selectedExam.sozNet).toFixed(1)}</div></div>}
                                </>
                            ) : (
                                <>
                                    {[['Türkçe', getSubjectNet(selectedExam, 'turkce'), 'var(--highlight)'], ['Matematik', getSubjectNet(selectedExam, 'mat'), 'var(--accent)'], ['Fen', getSubjectNet(selectedExam, 'fen'), 'var(--warn)'], ['Sosyal', getSubjectNet(selectedExam, 'sosyal'), 'var(--danger)']].filter(([, v]) => v != null).map(([lbl, net, color]) => (
                                        <div key={lbl} className="bg-surface/5 border border-line rounded-3xl p-6 text-center hover:bg-surface/10 transition-all">
                                            <div className="text-[10px] font-black text-ink-2 uppercase tracking-widest mb-2" style={{ color }}>{lbl.toUpperCase()}</div>
                                            <div className="text-3xl font-black text-ink syne">{Number(net).toFixed(1)}</div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>

                        {/* Detaylı Liste */}
                        <div className="bg-surface/5 border border-line rounded-3xl overflow-hidden p-6">
                            <h4 className="text-sm font-black text-ink syne tracking-widest uppercase mb-6 flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                                DERS BAZLI AYRINTILI ANALİZ
                            </h4>
                        
                            <div className="space-y-3">
                                {selectedExam.examType === 'AYT' ? (
                                    [
                                        ['EDEBIYAT', selectedExam.edebiyat],
                                        ['AYT MATEMATIK', selectedExam.aytMat],
                                        ['FIZIK', selectedExam.fizik],
                                        ['KIMYA', selectedExam.kimya],
                                        ['BIYOLOJI', selectedExam.biyoloji],
                                        ['SOSYAL AYT', selectedExam.sosyalAYT],
                                        ['DIL', selectedExam.dilNet],
                                    ].filter(([, v]) => v != null && v > 0).map(([lbl, net]) => (
                                        <div key={lbl} className="flex justify-between items-center bg-surface/5 px-6 py-4 rounded-2xl border border-line group hover:border-line transition-all">
                                            <span className="text-xs font-bold text-ink-3 tracking-wider group-hover:text-ink transition-colors">{lbl}</span>
                                            <span className="text-lg font-black text-accent syne">{Number(net).toFixed(2)}</span>
                                        </div>
                                    ))
                                ) : selectedExam.subjects && Object.keys(selectedExam.subjects).length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-line">
                                                    <th className="px-4 py-3 text-left text-[10px] font-black text-ink-2 uppercase tracking-widest">Ders</th>
                                                    <th className="px-4 py-3 text-center text-[10px] font-black text-accent uppercase tracking-widest">Doğru</th>
                                                    <th className="px-4 py-3 text-center text-[10px] font-black text-danger uppercase tracking-widest">Yanlış</th>
                                                    <th className="px-4 py-3 text-center text-[10px] font-black text-brand uppercase tracking-widest">Net</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {Object.entries(selectedExam.subjects).map(([key, subj]) => {
                                                    if (!subj) return null;
                                                    const d = typeof subj === 'object' ? (subj.d ?? subj.dogru ?? '-') : '-';
                                                    const y = typeof subj === 'object' ? (subj.y ?? subj.yanlis ?? '-') : '-';
                                                    const net = typeof subj === 'object' ? (parseFloat(subj.net) || 0) : (parseFloat(subj) || 0);
                                                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                                    return (
                                                        <tr key={key} className="hover:bg-surface/5 transition-all">
                                                            <td className="px-4 py-4 text-xs font-bold text-ink-3">{label}</td>
                                                            <td className="px-4 py-4 text-center text-sm font-black text-ink">{d}</td>
                                                            <td className="px-4 py-4 text-center text-sm font-black text-ink">{y}</td>
                                                            <td className="px-4 py-4 text-center text-sm font-black text-brand syne">{net.toFixed(2)}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-10">
                                        <p className="text-ink-2 text-xs font-bold tracking-widest uppercase">DETAYLI DERS VERİSİ BULUNAMADI</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// ─── Ana Bileşen ─────────────────────────────────────────────────
const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const { stats: gamStats, completeTask: gamCompleteTask, completePomodoro: gamCompletePomodoro, recordDailyLogin, recordExamView } = useGamification();

    // ── State
    /**
     * Sekme URL'de taşınır: yenileme ve paylaşılan bağlantı aynı sekmeye
     * döner (eskiden her yenileme "Bugün"e savuruyordu).
     *
     * ⚠️ Uygulama HashRouter kullanıyor — hash ROTANIN KENDİSİ
     * (#/student). Sekme bu yüzden hash İÇİNDEKİ sorguya yazılır:
     * `#/student?sekme=messages`. Hash'i düz `#sekme=x` yapmak rotayı
     * ezer ve yönlendirmeyi kırar (denendi, kırdı). Aynı kalıbı
     * LoginPage/JoinPage de kullanıyor (`hash.split('?')[1]`).
     *
     * ⚠️ Liste SEKME_GRUPLARI'ndaki kimliklerle aynı olmalı — yeni sekme
     * oraya eklenip buraya eklenmezse çökme olmaz, yalnızca o sekmenin
     * derin bağlantısı ana sekmeye düşer.
     */
    /**
     * 23.08.2026 yeniden tasarım — navigasyon 5 alana indi:
     * BUGÜN · PROGRAM · ÇALIŞMALARIM · GELİŞİMİM · DAHA FAZLA.
     * Eski 15 sekmenin bir kısmı iki merkezin (hub) İÇİNDE segment
     * oldu; eski derin bağlantılar kırılmasın diye burada eşlenir.
     */
    const HUB_ESLEME = {
        // Kaldırılan ekranların eski bağlantıları güvenli hedefe düşer
        'smart-plan': ['program', null],
        'daily-log': ['calismalarim', 'gunluk'],
        'error-notebook': ['calismalarim', 'hata'],
        'deneme-analizi': ['calismalarim', 'deneme'],
        'exams': ['gelisimim', 'netlerim'],
        'matrix': ['gelisimim', 'netlerim'],
        'topics': ['gelisimim', 'konularim'],
        'badges': ['gelisimim', 'rozetlerim'],
        'stats': ['gelisimim', 'genel'],
    };
    const GECERLI_SEKMELER = [
        'home', 'program', 'calismalarim', 'gelisimim', 'daha-fazla',
        'tasks', 'pomodoro', 'assessment',
        'messages', 'appointments', 'tests', 'portfolio',
    ];
    const urlSekme = (() => {
        try {
            return new URLSearchParams(window.location.hash.split('?')[1] || '').get('sekme');
        } catch { return null; }
    })();
    const [activeTab, setActiveTab] = useState(() => {
        if (urlSekme && HUB_ESLEME[urlSekme]) return HUB_ESLEME[urlSekme][0];
        if (urlSekme && GECERLI_SEKMELER.includes(urlSekme)) return urlSekme;
        return 'home';
    });
    /* Merkezlerin içindeki aktif segment; eski sekme adresi geldiyse
       oradaki karşılığıyla açılır. */
    const [calisSegment, setCalisSegment] = useState(() =>
        (HUB_ESLEME[urlSekme]?.[0] === 'calismalarim' ? HUB_ESLEME[urlSekme][1] : 'gunluk'));
    const [gelisimSegment, setGelisimSegment] = useState(() =>
        (HUB_ESLEME[urlSekme]?.[0] === 'gelisimim' ? HUB_ESLEME[urlSekme][1] : 'genel'));

    /** Tek geçiş noktası: eski kimlikler merkez+segmente çevrilir. */
    const sekmeyeGit = (id) => {
        const hedef = HUB_ESLEME[id];
        if (hedef) {
            setActiveTab(hedef[0]);
            if (hedef[1] === null) return;                 // segmenti olmayan hedef
            if (hedef[0] === 'calismalarim') setCalisSegment(hedef[1]);
            else if (hedef[0] === 'gelisimim') setGelisimSegment(hedef[1]);
        } else {
            setActiveTab(id);
        }
    };
    useEffect(() => {
        try {
            const [yol] = window.location.hash.split('?');
            window.history.replaceState(null, '', `${yol || '#/'}?sekme=${activeTab}`);
        } catch { /* ignore */ }
    }, [activeTab]);

    /**
     * V1.1 — Bugün kartındaki koç mesajı, mesaj AÇILINCA düşsün.
     * Mesajlar sekmesi açıldığında cihaza görülme damgası yazılır;
     * BugunEkrani damgadan eski mesajı göstermez. Damga yalnızca
     * görünümü etkiler — mesajın kendisi ve geçmiş silinmez (okundu
     * işareti gibi cihaz-yereldir, bilerek senkronlanmaz).
     */
    useEffect(() => {
        if (activeTab !== 'messages' || !user?.id) return;
        try { localStorage.setItem(`bugun_mesaj_goruldu_${user.id}`, new Date().toISOString()); } catch { /* ignore */ }
    }, [activeTab, user?.id]);
    const [schedule, setSchedule] = useState({});
    const [programConfig, setProgramConfig] = useState({ programDurationMonths: 1, dailySlotCount: 6, title: 'Çalışma Programı' });
    /**
     * ⚠️ BUGÜN EKRANI 1. AY 1. HAFTAYA ÇAKILIYDI (§37).
     * Bu ikisi sabit 1/1 kalıyordu; program 2. haftaya geçince
     * "Bugün" ekranı boş görünüyordu çünkü `m1-w1-{bugün}-` önekiyle
     * arıyordu. Artık programın başlangıç haftasından bugüne kaç
     * hafta geçtiği hesaplanıyor — Bugün ile Program aynı hücreyi
     * gösteriyor.
     */
    const [activeMonth, setActiveMonth] = useState(1);
    const [activeWeek, setActiveWeek] = useState(1);
    useEffect(() => {
        if (!user?.id) return;
        const hesapla = () => {
            try {
                const baslangic = programProgress.programBaslangici(user.id);
                const buHafta = programProgress.haftaBasi();
                const gecen = Math.max(0, Math.round((buHafta - baslangic) / (7 * 86400000)));
                const sure = Number(programConfig?.programDurationMonths) || 1;
                const enFazlaHafta = sure * 4;
                const index = Math.min(gecen, enFazlaHafta - 1);
                setActiveMonth(Math.floor(index / 4) + 1);
                setActiveWeek((index % 4) + 1);
            } catch { /* hesaplanamazsa 1/1 kalır */ }
        };
        hesapla();
    }, [user?.id, programConfig?.programDurationMonths, schedule]);
    const [loading, setLoading] = useState(true);

    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [apiKey, setApiKey] = useState('');

    const [examData, setExamData] = useState([]);
    const [testResults, setTestResults] = useState([]);
    const [assignedTests, setAssignedTests] = useState([]);
    const [tasks, setTasks] = useState([]);

    const [dailyPomodoros, setDailyPomodoros] = useState(0);
    const [totalStudyTime, setTotalStudyTime] = useState(0);

    const [userStats, setUserStats] = useState({
        totalXP: 0, currentStreak: 0, maxStreak: 0,
        totalStudyHours: 0, tasksCompleted: 0, examsCompleted: 0,
        bestExamScore: 0, pomodorosCompleted: 0, messagesExchanged: 0,
        lastActivityDate: null, dailyPomodoros: 0, dailyStudyMinutes: 0, dailyXP: 0,
    });
    const [earnedAchievements, setEarnedAchievements] = useState([]);

    const [todayTasks, setTodayTasks] = useState([]);
    const [todayGoals, setTodayGoals] = useState([]);


    const [permissions, setPermissions] = useState(getStudentPermissions());
    const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    const [showProgramBuilder, setShowProgramBuilder] = useState(false);
    const [isParentQROpen, setIsParentQROpen] = useState(false); // Madde 12

    // ── Mount
    useEffect(() => {
        if (!user) { navigate('/login'); return; }

        const initAndLoad = async () => {
            // Firebase bağlat (hata olursa offline modda devam et)
            // 12 saniyelik zaman aşımı - Firebase'in tam yülenmesini bekle
            try {
                await Promise.race([
                    firebaseSync.init(user),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase timeout')), 12000))
                ]);
                console.log('✅ Firebase sync tamamlandı, veriler yükleniyor...');
            } catch (e) {
                console.warn('⚠️ Firebase başlatılamadı (offline mod):', e.message);
            }
            // Firebase yüklemesi tamamlandıktan SONRA veriyi oku
            await loadData();
        };

        initAndLoad();
        setApiKey(localStorage.getItem('gemini_api_key') || '');
        const interval = setInterval(loadMessages, 10000);

        // 📡 Firebase real-time güncellemeleri dinle
        const handleStorageUpdate = (e) => {
            if (!e.key || e.key.startsWith('_fbtime_')) return;
            if (e.key === 'student_tasks') {
                loadTasks();
            } else if (e.key === 'v2_results_data' || e.key === 'v2_trials_data' || e.key === 'exams_data' || e.key === 'v2_obp_data') {
                loadExams();
            } else if (e.key?.startsWith('program_schedule_')
                || e.key?.startsWith('student_programs_')
                || e.key?.startsWith('program_meta_')
                || e.key?.includes('_monthly_grid') || e.key?.includes('_config')
                || e.key === 'student_programs') {
                /* Koç programı değiştirdiğinde/temizlediğinde öğrenci ekranı
                   anında tazelenir. `student_programs_` ve `program_meta_`
                   eskiden dinlenmiyordu: koç programı kaydediyor, öğrencinin
                   açık ekranı eski hâlde kalıyordu. */
                loadProgram();
            } else if (e.key === 'student_messages') {
                loadMessages();
            } else if (e.key === 'coach_students' || e.key === 'users_db') {
                loadData();
            }
        };

        window.addEventListener('storage', handleStorageUpdate);

        // 🔄 Hızlı polling: Coach'tan gelen veriler için 15 saniyede bir yenile
        const pollInterval = setInterval(() => { loadTasks(); loadExams(); loadMessages(); }, 15000);

        return () => {
            clearInterval(interval);
            clearInterval(pollInterval);
            window.removeEventListener('storage', handleStorageUpdate);
            firebaseSync.destroy();
        };
    }, [user]);

    // ── Veri Yükleme
    const loadData = async () => {
        setLoading(true);
        try {
            // Firebase quota aşıldığında bile çalışmaya devam et
            await Promise.allSettled([
                loadProgram(), loadMessages(), loadExams(),
                loadTests(), loadTasks(), loadAssignedTests()
            ]);
            // 🌟 FAZE 3: Günlük login XP
            recordDailyLogin();
        } catch (error) {
            console.warn('Kısmi veri yükleme hatası (offline mod aktif):', error);
        } finally {
            setLoading(false); // Her zaman loading'i kapat
        }
    };

    const loadAssignedTests = async () => {
        if (!user?.id) return;
        try {
            const key = `assigned_tests_${user.id}`;
            const raw = listeOku(key);
            const allTests = guidanceService.getTests();
            const enriched = raw.map(a => {
                const testDef = allTests.find(t => t.id === a.testId);
                return { ...a, ...(testDef || {}), testId: a.testId };
            }).filter(t => t.title); // Sadece var olan testleri göster
            setAssignedTests(enriched);
        } catch (e) { console.error('Atanan testler yüklenemedi:', e); }
    };

    const loadTests = async () => {
        if (!user?.id) return;
        try { setTestResults(await api.tests.getResults(user.id) || []); }
        catch (e) { console.error('Test sonuçları yüklenemedi:', e); }
    };

    const loadTasks = async () => {
        if (!user?.id) return;
        try {
            const allTasks = nesneOku('student_tasks');
            const userIdStr = String(user.id);
            let myTasks = allTasks[userIdStr] || allTasks[user.id] || [];
            if (myTasks.length === 0 && user.schoolNumber) {
                const bySchoolNo = Object.values(allTasks).flat().filter(t =>
                    String(t.studentId) === String(user.schoolNumber) ||
                    String(t.studentId) === String(user.id)
                );
                if (bySchoolNo.length > 0) myTasks = bySchoolNo;
            }
            if (myTasks.length === 0) {
                Object.keys(allTasks).forEach(key => {
                    const matched = (allTasks[key] || []).filter(t =>
                        String(t.studentId) === String(user.id) ||
                        String(t.studentId) === String(user.schoolNumber)
                    );
                    myTasks = [...myTasks, ...matched];
                });
            }
            setTasks(myTasks);
        } catch (e) { console.error('Görevler yüklenemedi:', e); }
    };

    const loadProgram = async () => {
        if (!user?.id) return;
        try {
            // ✅ 1. Önce koçun oluşturduğu programı dene (ProgramBuilderModal tarafından kaydedilen)
            // Koç, program_schedule_{userId} anahtarına kaydeder, biz aynı key'den okuyoruz
            const coachScheduleKey = `program_schedule_${user.id}`;
            const coachSchedule = localStorage.getItem(coachScheduleKey);
            if (coachSchedule) {
                const parsed = JSON.parse(coachSchedule);
                if (parsed && Object.keys(parsed).length > 0) {
                    setSchedule(parsed);
                    /**
                     * ⚠️ 23.08.2026 — ÖĞRENCİ PROGRAMIN TAMAMINI GÖREMİYORDU.
                     * Burada `program_{id}_config` okunuyordu; o anahtar
                     * HİÇBİR YERDE YAZILMIYOR. Sonuç: programDurationMonths
                     * hep varsayılan 1 kalıyor, ay seçici gizleniyor ve koç
                     * 10 aylık program gönderse bile öğrenci yalnızca
                     * 1. ayı görüyordu. Koçun gerçekten yazdığı anahtar
                     * `program_meta_{id}`.
                     */
                    const meta = localStorage.getItem(`program_meta_${user.id}`)
                        || localStorage.getItem(`program_${user.id}_config`);
                    if (meta) {
                        try { setProgramConfig(prev => ({ ...prev, ...JSON.parse(meta) })); } catch { /* bozuksa varsayılan */ }
                    }
                    return;
                }
            }

            // 2. Öğrencinin kendi kaydettiği programları dene (monthly_grid formatı)
            const scheduleKey = `program_${user.id}_monthly_grid`;
            const configKey = `program_${user.id}_config`;
            const savedSchedule = localStorage.getItem(scheduleKey);
            const savedConfig = localStorage.getItem(configKey);
            if (savedSchedule) {
                const parsed = JSON.parse(savedSchedule);
                if (parsed && Object.keys(parsed).length > 0) {
                    setSchedule(parsed);
                    if (savedConfig) setProgramConfig(prev => ({ ...prev, ...JSON.parse(savedConfig) }));
                    return;
                }
            }

            // 3. Legacy format (eski kayıtlar için geriye dönük uyumluluk)
            const savedLocal = oku(`program_${user.id}`, null);
            if (savedLocal?.schedule && Object.keys(savedLocal.schedule).length > 0) {
                setSchedule(savedLocal.schedule);
                if (savedLocal?.config) setProgramConfig(prev => ({ ...prev, ...savedLocal.config }));
            }
        } catch (e) {
            console.warn('Program yüklenemedi:', e);
        }
    };


    const loadExams = async () => {
        if (!user?.id) return;
        try {
            const oldExams = await api.exams.getStudentExams(user.id);
            const v2Results = listeOku('v2_results_data');
            const v2Trials = listeOku('v2_trials_data');

            // Türkçe karakterleri normalize et (İ→i, Ş→s vb.)
            const normTR = normalizeTRName;

            const userName = normTR(user.name);
            const userParts = userName.split(/\s+/).filter(p => p.length > 1);

            const matchedV2 = v2Results.filter(r => {
                // 1. ÖNCELİK: Okul Numarası Eşleşmesi
                const userSchoolNo = normalizeSchoolNumber(user.schoolNumber || '');
                const rSchoolNo = normalizeSchoolNumber(r.number || r.schoolNumber || '');
                if (userSchoolNo && rSchoolNo && userSchoolNo === rSchoolNo) return true;

                // 2. İKİNCİ ÖNCELİK: İsim Eşleşmesi
                const uName = normalizeTRName(user.name);
                const rName = normalizeTRName(r.student || r.name);
                const rNameSquash = rName.replace(/\s+/g, '');
                const uNameSquash = uName.replace(/\s+/g, '');
                
                if (!rName || !uName) return false;

                // Harfiyen (boşluksuz) tam eşleşme
                if (rNameSquash === uNameSquash) return true;
                
                // Parçalı eşleşme: 3+ harfli kelimeleri karşılaştır (Fuzzy)
                const rParts = rName.split(' ').filter(p => p.length >= 3);
                const uParts = uName.split(' ').filter(p => p.length >= 3);
                const commonParts = uParts.filter(up => rParts.some(rp =>
                    rp === up || rp.startsWith(up) || up.startsWith(rp)
                ));
                
                if (commonParts.length >= 2) return true;
                if (commonParts.length === 1 && (rParts.length === 1 || uParts.length === 1)) return true;
                
                return false;
            }).map(r => {
                const trial = v2Trials.find(t => String(t.id) === String(r.trialId)) || {};
                let examType = r.examType || trial.examType || 'TYT';
                if (examType === 'YDS') examType = 'YDT';

                let totalNet = parseFloat(r.totalNet) || (parseFloat(r.tyt) || 0);
                if (examType === 'AYT' || examType === 'TYT+AYT') {
                    const sayNet = parseFloat(r.sayNet) || 0;
                    const eaNet = parseFloat(r.eaNet) || 0;
                    const sozNet = parseFloat(r.sozNet) || 0;
                    const aytMax = Math.max(sayNet, eaNet, sozNet);
                    totalNet = (parseFloat(r.tyt) || 0) + aytMax;
                } else if (examType === 'YDT' || examType === 'TYT+YDT') {
                    const dilNet = parseFloat(r.dilNet || r.dil || 0);
                    totalNet = (parseFloat(r.tyt) || 0) + dilNet;
                }

                return {
                    ...r,
                    id: r.id, studentId: user.id,
                    examType,
                    name: trial.name || r.fileName || 'Deneme',
                    date: r.uploadedAt || trial.date,
                    totalNet: parseFloat(totalNet.toFixed(2)),
                    subjects: r.subjects || {},
                    turkce: typeof r.turkce === 'number' ? r.turkce : (r.subjects?.tyt_turkce?.net ?? r.subjects?.turkce?.net), 
                    mat: typeof r.mat === 'number' ? r.mat : (r.subjects?.tyt_mat_toplam?.net ?? r.subjects?.tyt_matematik?.net ?? r.subjects?.mat?.net), 
                    fen: typeof r.fen === 'number' ? r.fen : (r.subjects?.tyt_fen_toplam?.net ?? r.subjects?.fen?.net), 
                    sosyal: typeof r.sosyal === 'number' ? r.sosyal : (r.subjects?.tyt_sosyal_toplam?.net ?? r.subjects?.sosyal?.net),
                    sayNet: r.sayNet, eaNet: r.eaNet, sozNet: r.sozNet, dilNet: r.dilNet || r.dil,
                    edebiyat: r.edebiyat, aytMat: r.aytMat, fizik: r.fizik,
                    kimya: r.kimya, biyoloji: r.biyoloji, sosyalAYT: r.sosyalAYT,
                    gradeLevel: r.gradeLevel, source: 'v2'
                };
            });

            console.log(`📊 loadExams: ${matchedV2.length} v2 sonuç eşleşti (toplam: ${v2Results.length})`);
            setExamData([...(oldExams || []), ...matchedV2].sort((a,b) => new Date(b.date || b.uploadedAt) - new Date(a.date || a.uploadedAt)));
        } catch (e) { console.error('Sınav verisi yüklenemedi:', e); }
    };

    const loadMessages = async () => {
        if (!user?.id) return;
        try {
            // Hem user.id hem de schoolNumber ile dene (koçun hangi key ile gönderdiğine göre)
            let msgs = await api.messages.getMessages(user.id);
            // Eğer schoolNumber ile kaydedildiyse de kontrol et
            if ((!msgs || msgs.length === 0) && user.schoolNumber) {
                const msgsAlt = await api.messages.getMessages(user.schoolNumber);
                if (msgsAlt && msgsAlt.length > 0) msgs = msgsAlt;
            }
            if (Array.isArray(msgs)) setMessages(msgs);
        } catch { /* ignore */ }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        try {
            // Koçun hangi key ile mesajları sakladığını bul
            const allMessages = nesneOku('student_messages');
            // Koçun key'ini bul: user.id veya schoolNumber
            const useKey = allMessages[user.id] ? user.id :
                (allMessages[user.schoolNumber] ? user.schoolNumber : user.id);
            await api.messages.sendMessage(useKey, { sender: 'student', text: newMessage, senderName: user.name });
            setNewMessage('');
            loadMessages();
        } catch { /* ignore */ }
    };

    const handlePomodoroComplete = (minutes) => {
        const newTotal = totalStudyTime + minutes;
        const newCount = dailyPomodoros + 1;
        setTotalStudyTime(newTotal);
        setDailyPomodoros(newCount);
        localStorage.setItem(`pomodoro_${user.id}_total`, newTotal.toString());
        localStorage.setItem(`pomodoro_${user.id}_daily_${new Date().toDateString()}`, newCount.toString());
        // 🌟 FAZE 5: Gamification entegrasyonu
        gamCompletePomodoro(minutes);
        // Eski istatistik sistemiyle uyumluluk
        const updatedStats = { ...userStats, pomodorosCompleted: (userStats.pomodorosCompleted || 0) + 1, totalStudyHours: (userStats.totalStudyHours || 0) + minutes / 60 };
        setUserStats(updatedStats);
        localStorage.setItem(`user_stats_${user.id}`, JSON.stringify(updatedStats));
        // Firebase sync
        firebaseSync.debouncedSync();
    };

    /**
     * Görevi tamamlandı işaretler.
     *
     * ⚠️ ÖNCEKİ HÂLİ SESSİZCE VERİ KAYBETTİRİYORDU.
     *
     * Yalnızca `allTasks[user.id]` durumunu ele alıyordu. Oysa `loadTasks`
     * görevi ÜÇ ayrı yoldan bulabiliyor: kendi kimliğiyle, okul numarası
     * anahtarıyla ve tüm anahtarları tarayıp `studentId` eşleştirerek.
     * Görev bu yollardan biriyle ekrana gelmişse `allTasks[user.id]`
     * tanımsız kalıyor, koşul hiç çalışmıyor ve YALNIZCA React durumu
     * güncelleniyordu: öğrenci görevi tamamlıyor, sayfayı yeniliyor ve
     * görev geri geliyordu. Testte birebir bu görüldü.
     *
     * Artık görev NEREDE duruyorsa orada güncellenir; kayıt biçimi
     * (nesne ya da düz dizi) korunur.
     */
    const handleCompleteTask = (taskId) => {
        let ham;
        try { ham = nesneOku('student_tasks'); }
        catch { ham = {}; }

        const isaretle = (t) => (
            String(t?.id) === String(taskId)
                ? { ...t, status: 'Tamamlandı', completed: true, completedAt: new Date().toISOString() }
                : t
        );

        let bulundu = false;
        let yeni;

        if (Array.isArray(ham)) {
            // Düz dizi biçimi
            yeni = ham.map((t) => {
                if (String(t?.id) === String(taskId)) bulundu = true;
                return isaretle(t);
            });
        } else {
            // Öğrenci kimliğine göre gruplanmış biçim — hangi anahtarda
            // olursa olsun bulunur
            yeni = { ...ham };
            Object.keys(yeni).forEach((anahtar) => {
                const liste = yeni[anahtar];
                if (!Array.isArray(liste)) return;
                if (liste.some((t) => String(t?.id) === String(taskId))) bulundu = true;
                yeni[anahtar] = liste.map(isaretle);
            });
        }

        if (bulundu) {
            localStorage.setItem('student_tasks', JSON.stringify(yeni));
            // 🌟 FAZE 5: Gamification + Firebase sync
            gamCompleteTask();
            firebaseSync.syncKey('student_tasks');
            loadTasks();
        } else {
            // Kayıtta bulunamadıysa sessiz kalma — kullanıcı ne olduğunu bilsin
            bildir('Görev kaydedilemedi. Sayfayı yenileyip tekrar dene.', 'hata');
        }

        // Ekran her hâlükârda güncellenir (bulunduysa kalıcı da olur)
        setTasks(prev => prev.map(isaretle));
    };

    /**
     * Sekme bildirim rozetleri: koçun yaptığı çalışma öğrencinin ilgili
     * sekmesinde sayaç olarak belirir, sekmeye girilince kaybolur.
     *
     * Hook erken `return`DEN ÖNCE çağrılmak zorunda. Aşağıdaki
     * `if (loading) return` satırından sonra dursaydı, yükleme bittiği
     * render'da hook sayısı artar ve React "önceki render'dan fazla
     * hook çağrıldı" hatasıyla paneli çökertirdi.
     */
    const { rozetler, okundu } = useTabBadges('student', user);


    /**
     * ÇALIŞMALARIM ve GELİŞİMİM merkezlerinin özet verisi — tamamı
     * gerçek kayıtlardan (study_log, error_notebook, denemeler).
     * Hook olduğu için aşağıdaki erken return'den ÖNCE durur.
     */
    /* Kayıt girildiği anda merkez özetleri tazelensin — studyLogService
       ve hata defteri her yazımda 'storage' olayı yayar. */
    const [kayitSurumu, setKayitSurumu] = useState(0);
    useEffect(() => {
        const tetik = (e) => {
            if (!e?.key || ['study_log', 'error_notebook', 'deneme_analizleri'].includes(e.key)) {
                setKayitSurumu((v) => v + 1);
            }
        };
        window.addEventListener('storage', tetik);
        return () => window.removeEventListener('storage', tetik);
    }, []);

    /**
     * BİRLEŞİK deneme listesi: koç yüklemesi (examData) + öğrencinin
     * kendi girdiği deneme analizleri. Netim kartı, net grafiği ve
     * radar hepsi bunu okur — öğrencinin girdiği deneme "kaybolmaz".
     */
    const denemelerSirali = useMemo(() => {
        const manuel = (() => {
            try {
                return denemeKayitlari.ogrencininKayitlari(user?.id).map((k) => ({
                    name: k.ad,
                    date: k.tarih || k.olusturma,
                    totalNet: +Object.values(k.dersler || {})
                        .reduce((a, d) => a + (parseFloat(d?.net) || 0), 0).toFixed(2),
                    turkce: parseFloat(k.dersler?.['Türkçe']?.net),
                    mat: parseFloat(k.dersler?.['Matematik']?.net),
                    fen: parseFloat(k.dersler?.['Fen']?.net),
                    sosyal: parseFloat(k.dersler?.['Sosyal']?.net),
                }));
            } catch { return []; }
        })();
        return [...examData, ...manuel]
            .filter((e) => Number.isFinite(parseFloat(e.totalNet)))
            .sort((a, b) => new Date(a.date || a.uploadedAt) - new Date(b.date || b.uploadedAt));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- kayitSurumu bilinçli tetikleyici
    }, [examData, user?.id, kayitSurumu]);

    /**
     * Performans radarı GERÇEK veriden beslenir: mevcut = son 3
     * denemenin ders ortalaması, hedef = öğrencinin kendi en iyi
     * denemesi. Deneme yoksa radar hiç çizilmez — örnek veri yok.
     */
    const radarVerisi = useMemo(() => {
        if (!denemelerSirali.length) return [];
        const DERSLER = [
            { anahtar: 'turkce', ad: 'Türkçe', tavan: 40 },
            { anahtar: 'mat', ad: 'Matematik', tavan: 40 },
            { anahtar: 'fen', ad: 'Fen', tavan: 20 },
            { anahtar: 'sosyal', ad: 'Sosyal', tavan: 20 },
        ];
        const son3 = denemelerSirali.slice(-3);
        return DERSLER.map(({ anahtar, ad, tavan }) => {
            const degerler = son3.map((e) => parseFloat(e[anahtar])).filter((v) => !Number.isNaN(v));
            if (!degerler.length) return null;
            const ort = degerler.reduce((s, v) => s + v, 0) / degerler.length;
            const enIyi = Math.max(...denemelerSirali.map((e) => parseFloat(e[anahtar]) || 0));
            return {
                subject: ad,
                current: Math.round(Math.max(0, (ort / tavan) * 100)),
                target: Math.round(Math.max(0, (enIyi / tavan) * 100)),
            };
        }).filter(Boolean);
    }, [denemelerSirali]);

    const merkezOzet = useMemo(() => {
        let o14 = null, o30 = null;
        try { o14 = getSummary(user?.id, 14); o30 = getSummary(user?.id, 30); } catch { /* kayıt yoksa boş */ }
        const gunler = o14?.byDay || [];
        const son7 = gunler.slice(-7);
        const onceki7 = gunler.slice(0, Math.max(0, gunler.length - 7));
        const topla = (dizi) => dizi.reduce((a, g) => a + g.questions, 0);
        const soru7 = topla(son7);
        const soruOnceki = topla(onceki7);

        // Hata defteri — bu haftaki yeni kayıtlar
        let hatalar7 = 0;
        try {
            const esik = Date.now() - 7 * 86400000;
            hatalar7 = listeOku('error_notebook').filter((h) =>
                String(h.studentId) === String(user?.id) &&
                new Date(h.date || h.createdAt || 0).getTime() >= esik
            ).length;
        } catch { /* yok say */ }

        // Net değişimi — son iki deneme
        const sonNet = denemelerSirali.length ? parseFloat(denemelerSirali[denemelerSirali.length - 1].totalNet) : null;
        const oncekiNet = denemelerSirali.length > 1 ? parseFloat(denemelerSirali[denemelerSirali.length - 2].totalNet) : null;
        const netFark = sonNet != null && oncekiNet != null ? Math.round((sonNet - oncekiNet) * 100) / 100 : null;

        // Son 5 deneme — net değişim grafiği
        const netSerisi = denemelerSirali.slice(-5).map((e, i) => ({
            ad: e.name || e.trialName || `Deneme ${i + 1}`,
            net: Math.round(parseFloat(e.totalNet) * 100) / 100,
        }));

        // Ders bazlı güçlü / gelişecek alan (14 günlük isabetten)
        const dersler = (o14?.bySubject || []).filter((s) => s.correct + s.wrong >= 10);
        const guclu = dersler.length ? [...dersler].sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0))[0] : null;
        const gelisecek = dersler.length > 1 ? [...dersler].sort((a, b) => (a.accuracy ?? 101) - (b.accuracy ?? 101))[0] : null;

        let o7 = null;
        try { o7 = getSummary(user?.id, 7); } catch { /* kayıt yoksa boş */ }

        return {
            soru7, soruFark: soruOnceki > 0 ? soru7 - soruOnceki : null,
            dakika7: o7?.minutes ?? 0,
            isabet7: o7?.accuracy ?? null,
            hatalar7,
            deneme7: denemelerSirali.filter((e) => new Date(e.date || e.uploadedAt || 0).getTime() >= Date.now() - 7 * 86400000).length,
            sonNet, netFark, netSerisi,
            gunSerisi: son7.map((g) => ({ gun: g.date.slice(5), soru: g.questions })),
            soru30: o30?.questions ?? 0,
            guclu, gelisecek,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- kayitSurumu bilinçli: storage olayı yerel kayıtları tazeler
    }, [user?.id, examData, denemelerSirali, kayitSurumu]);

    /**
     * ÇALIŞMA SERİSİ — TEK KAYNAK.
     *
     * Ekranda iki ayrı seri sayısı vardı ve birbirini tutmuyordu:
     * başlıktaki rozet `gamification_stats.currentStreak` okuyor,
     * Bugün ekranındaki kart ise günlük kayıtlardan türetiyordu.
     * Ölçüldü: 28 günün 18'inde kayıt bulunan bir öğrencide başlık
     * "0 GÜN SERİ", kart "3 gün" gösteriyordu — çünkü oyunlaştırma
     * sayacı yalnızca uygulama içi eylemlerle (pomodoro, görev) artıyor,
     * öğrenci çalışmasını kaydettiğinde artmıyor.
     *
     * Artık GÖSTERİLEN seri tek yerden, gerçek kayıtlardan gelir.
     * Oyunlaştırma verisi DEĞİŞTİRİLMEDİ; XP, rozet ve liderlik tablosu
     * kendi sayacıyla çalışmayı sürdürür — burada yalnızca ekranda
     * hangi sayının yazacağı belirlenir.
     */
    const calismaSerisi = useMemo(() => {
        try { return istikrar(user?.id, 28).guncelZincir || 0; } catch { return 0; }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- kayitSurumu bilinçli tetikleyici
    }, [user?.id, kayitSurumu]);

    if (loading) return <StudentDashboardSkeleton />;

    const safeSlotCount = Number(programConfig?.dailySlotCount) || 6;
    const pendingTasks = tasks.filter(t => !t.completed && t.status !== 'Tamamlandı');
    const completedTasks = tasks.filter(t => t.completed || t.status === 'Tamamlandı');

    // ── SEKMELER
    // Simgeler konuya özgü, çok renkli illüstrasyonlar (components/icons/ModuleIcons)
    /**
     * 🧭 ÖĞRENCİ GEZİNMESİ
     *
     * Eskiden 15 sekme tek sırada, hepsi eşit ağırlıkta duruyordu.
     * Telefonda şerit ölçüldüğünde 375 piksellik ekranda 2107 piksel
     * genişliğe ulaşıyordu: öğrenci 14 sekmeyi hiç görmüyordu.
     *
     * Artık dört grup var ve sıralama öğrencinin sorusuna göre:
     *   Bugün ne yapmalıyım? → Bugün, Görevler, Program
     *   Nasıl gidiyorum?     → Denemeler, Konu Takibi, Trend
     *   Çalışma araçlarım    → Odaklan, Günlük Kayıt, Hata Defteri…
     *
     * Sekme listeleri TEK yerde; mobil alt çubuk da bunu okur, böylece
     * eskisi gibi uyuşmayan kimlikler oluşamaz.
     */
    /* 23.08.2026 yeniden tasarım: 5 ana alan. Kalan araçlar "Daha
       Fazla" sayfasında; 15 sekme artık doğrudan gösterilmiyor. */
    const SEKME_GRUPLARI = [
        {
            label: 'Ana',
            items: [
                { id: 'home', icon: MODULE_ICONS.home, label: 'Bugün' },
                { id: 'program', icon: MODULE_ICONS.program, label: 'Program' },
                { id: 'calismalarim', icon: MODULE_ICONS['daily-log'], label: 'Çalışmalarım' },
                { id: 'gelisimim', icon: MODULE_ICONS.analysis, label: 'Gelişimim' },
            ],
        },
        {
            label: 'Daha Fazla',
            items: [
                { id: 'tasks', icon: MODULE_ICONS.tasks, label: 'Görevler', badge: pendingTasks.length },
                { id: 'messages', icon: MODULE_ICONS.messages, label: 'Mesajlar', badge: messages.filter(m => m.sender === 'coach').length },
                { id: 'pomodoro', icon: MODULE_ICONS.pomodoro, label: 'Odaklan' },
                { id: 'assessment', icon: MODULE_ICONS.assessment, label: 'Öz Değerlendirme' },
                { id: 'appointments', icon: MODULE_ICONS.appointments, label: 'Randevu' },
                { id: 'tests', icon: MODULE_ICONS.tests, label: 'Envanter', badge: assignedTests.filter(t => t.status === 'pending').length },
                { id: 'portfolio', icon: MODULE_ICONS.portfolio, label: 'Portfolyo' },
            ],
        },
    ];

    const TABS = SEKME_GRUPLARI.flatMap((g) => g.items);
    const ARAC_GRUBU = SEKME_GRUPLARI[1];
    const aracRozetToplami = ARAC_GRUBU.items.reduce((s, t) => s + (t.badge || 0), 0);

    /** Telefonda alt çubuk: 4 ana alan + "Menü" (= Daha Fazla). */
    const MOBIL_BIRINCIL = ['home', 'program', 'calismalarim', 'gelisimim']
        .map((id) => TABS.find((t) => t.id === id))
        .filter(Boolean);

    return (
        <div className="min-h-screen bg-page text-ink font-['Plus_Jakarta_Sans'] selection:bg-brand/30 selection:text-brand overflow-x-hidden flex flex-col">
            {/* Zemin filigranı: içerik kartları üstünü örter, boş zeminde
                marka görünür — her tabda (bkz. ui/MarkaFiligran) */}
            <MarkaFiligran />

            {/* ── HEADER ───────────────────────────────────────────── */}
            <header className="sticky top-0 z-40 bg-page/80 backdrop-blur-xl border-b border-line transition-all duration-yavas">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    {/* Sol: Marka + Avatar
                        Öğrenci panelinde marka hiç görünmüyordu; uygulamanın
                        hangi sistem olduğu öğrencide de belli olmalı. Amblem
                        ve ad, öğrencinin baş harf rozetinden önce geliyor. */}
                    <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                        {/* ⚠️ MOBİLDE GİZLİ.
                            Görünür bırakıldığında (amblem + ayraç + boşluk)
                            sağdaki bildirim, tema ve ÇIKIŞ düğmelerini 375
                            piksellik ekranda dışarı itiyordu; öğrenci
                            telefondan çıkış yapamıyordu. Uygulama adı zaten
                            sekme başlığında ve ana ekran kısayolunda yazılı. */}
                        {/* Mobil: YALNIZ amblem (yazısız, ayraçsız) —
                            eski taşma ayraç+yazıdan geliyordu; tek 28px
                            amblem çıkış düğmesini itmiyor (375px'te ölçüldü). */}
                        <MarkaGorsel
                            src={MARKA.amblem}
                            alt=""
                            width="28"
                            height="28"
                            className="w-7 h-7 object-contain flex-none sm:hidden"
                        />
                        <div className="hidden sm:flex items-center gap-2 pr-3 md:pr-4 border-r border-line">
                            <MarkaGorsel
                                src={MARKA.amblem}
                                alt=""
                                width="36"
                                height="36"
                                className="w-9 h-9 object-contain flex-none"
                            />
                            <div className="hidden md:block leading-tight">
                                {/* Ad, logodaki el yazısı stiliyle — düz metin değil.
                                    Genişlik alt başlıkla eşit. */}
                                <MarkaGorsel src={MARKA.adYazisi} alt={MARKA.ad} width="605" height="256"
                                    className="w-[124px] h-auto object-contain" />
                                <p className="text-[9px] font-bold text-ink-3 tracking-[0.083em] uppercase mt-0.5">
                                    {MARKA.altBaslik}
                                </p>
                            </div>
                        </div>
                        <div className="relative group">
                            <div className="on-color absolute -inset-1 bg-gradient-to-tr from-brand to-accent rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-yavas" />
                            <div className="relative w-12 h-12 bg-surface border border-line rounded-2xl flex items-center justify-center text-brand font-bold shadow-xl overflow-hidden">
                                <span className="text-lg syne">{user?.name?.charAt(0) || 'Ö'}</span>
                                <div className="on-color absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-brand to-accent" />
                            </div>
                        </div>
                        {/* min-w-0 + truncate: dar ekranda selamlama sıkışsın,
                            sağdaki çıkış ve bildirim düğmelerini dışarı
                            itmesin. Seri/seviye rozetleri mobilde gizli —
                            aynı bilgiler panelin gövdesinde zaten var. */}
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-base sm:text-lg font-bold text-ink leading-tight syne truncate">
                                Selam, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-[#f1d279]">{user?.name?.split(' ')[0] || 'Öğrenci'}</span> 👋
                            </h1>
                            <div className="hidden sm:flex items-center gap-2 mt-0.5">
                                <div className="flex items-center gap-1 bg-surface border border-line px-2 py-0.5 rounded-full">
                                    <Flame size={12} className="text-brand" />
                                    <span className="text-[10px] font-bold text-brand tracking-wider uppercase">{calismaSerisi} GÜN SERİ</span>
                                </div>
                                <div className="flex items-center gap-1 bg-surface border border-line px-2 py-0.5 rounded-full">
                                    <Star size={12} className="text-accent" />
                                    <span className="text-[10px] font-bold text-accent tracking-wider uppercase">SEVİYE {userStats.totalXP ? Math.floor(userStats.totalXP / 100) + 1 : 1}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sağ: Aksiyonlar */}
                    <div className="flex items-center gap-2 md:gap-4">
                         {/* 🤖 AI Koç Butonu - Masaüstü */}
                         <div className="hidden md:block">
                            <AICoachButton
                                studentData={{ 
                                    name: user?.name, 
                                    grade: user?.grade, 
                                    lastNet: userStats?.lastNet, 
                                    targetUniversity: user?.targetUniversity, 
                                    id: user?.id 
                                }}
                                className="premium-button text-sm flex items-center gap-2"
                            />
                        </div>

                        {/* Üst şeritte yalnızca SIK kullanılan iş kalır: bildirim.
                            Tema, ayarlar ve çıkış kullanıcı menüsüne indi —
                            dördü yan yana dururken dar ekranda çıkış düğmesi
                            dışarı taşıyordu. */}
                        {/* Canlı Firestore dinleyicisi: hata verirse yalnızca zil
                            düşsün, panel ayakta kalsın */}
                        <BolumHataSiniri bolumAdi="Bildirimler">
                            <RealtimeNotificationBell role="student" userId={user?.id} />
                        </BolumHataSiniri>

                        <KullaniciMenusu
                            kullanici={user}
                            rolEtiketi="Öğrenci"
                            onAyarlar={() => setIsSettingsOpen(true)}
                            onCikis={() => { logout(); navigate('/login'); }}
                        />
                    </div>
                </div>

                {/* ── Sekme şeridi ────────────────────────────────────
                    TELEFONDA GİZLİ: orada alt çubuk var, iki gezinme birden
                    göstermek hem 56 piksel yer yiyor hem de kafa karıştırıyor.
                    Masaüstünde gruplar ince ayraçla ayrılır; 15 sekme düz bir
                    sıra yerine anlamlı öbekler hâlinde okunur. */}
                {/* 23.08 tasarım: masaüstünde de yalnızca 5 ana hedef —
                    BUGÜN · PROGRAM · ÇALIŞMALARIM · GELİŞİMİM · DAHA FAZLA.
                    Araçlar "Daha Fazla" sayfasında gruplanır. */}
                <div className="hidden lg:block border-t border-line bg-page/50 backdrop-blur-md">
                    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center overflow-x-auto no-scrollbar gap-1 py-1.5 h-14">
                        {SEKME_GRUPLARI[0].items.map(tab => {
                            const secili = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => { sekmeyeGit(tab.id); okundu(tab.id); }}
                                    aria-current={secili ? 'page' : undefined}
                                    className={cn(
                                        'relative shrink-0 flex items-center gap-2 px-4 min-h-[44px] rounded-pill tip-tab whitespace-nowrap',
                                        'transition-colors duration-hizli',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                                        secili
                                            ? 'bg-brand text-white font-bold shadow-kart'
                                            : 'text-ink-3 hover:text-ink hover:bg-surface-3'
                                    )}
                                >
                                    <tab.icon size={16} strokeWidth={secili ? 2.2 : 1.75} />
                                    <span>{tab.label}</span>
                                    <TabBadge sayi={rozetler[tab.id] || 0} />
                                </button>
                            );
                        })}
                        <span className="shrink-0 w-px h-6 bg-line mx-2" aria-hidden="true" />
                        <button
                            onClick={() => sekmeyeGit('daha-fazla')}
                            aria-current={activeTab === 'daha-fazla' ? 'page' : undefined}
                            className={cn(
                                'relative shrink-0 flex items-center gap-2 px-4 min-h-[44px] rounded-pill tip-tab whitespace-nowrap',
                                'transition-colors duration-hizli',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                                activeTab === 'daha-fazla' || ARAC_GRUBU.items.some((t) => t.id === activeTab)
                                    ? 'bg-brand text-white font-bold shadow-kart'
                                    : 'text-ink-3 hover:text-ink hover:bg-surface-3'
                            )}
                        >
                            <MoreHorizontal size={16} />
                            <span>Daha Fazla</span>
                            {aracRozetToplami > 0 && <Sayac deger={aracRozetToplami} ton="hata" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* 📡 Çevrimdışı Mod Banner */}
            {/* Sabit değer (134px) sekme şeridi mobilde gizlenince yanlış
                kalıyordu; şerit yalnızca lg'de var, banner de ona göre iner */}
            <div className="sticky top-[76px] lg:top-[134px] z-20">
                <OfflineBanner offlineManager={window.offlineManager} />
            </div>

            {/* ── İÇERİK ─────────────────────────────────────────────
                Genişlik ve iç boşluk koç paneliyle AYNI ölçüde: iki panel
                aynı ürünün parçası gibi dursun. Boşluk kırılma noktasıyla
                birlikte büyür (16 → 24 → 32 piksel). */}
            <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6 lg:space-y-8 icerik-gecis pb-24">
                {/* Sekme çökerse yalnızca içerik alanı düşer; başlık ve
                    alt gezinme çalışmaya devam eder. key={activeTab}: sekme
                    değişince sınır sıfırlanır, hatalı sekmede takılı kalmaz. */}
                <BolumHataSiniri bolumAdi="Bu bölüm" key={activeTab}>

                {/* ═══════════════ ANA SAYFA ═══════════════ */}
                {/* ═══════════════ BUGÜN ═══════════════
                    Eski ana sayfa: dört sayaç kartı + ekranın en büyük
                    öğesi olarak Pomodoro sayacı, ardından oyunlaştırma,
                    günlük hedef ve bekleyen görev özeti. Yani öğrenciye
                    "ne kadar çalıştın" gösteriliyor ama "şimdi ne
                    yapmalısın" söylenmiyordu; program ve görevler ayrı
                    sekmelerdeydi. BugunEkrani ikisini tek akışta birleştirir. */}
                {activeTab === 'home' && (
                    <BugunEkrani
                        kullanici={user}
                        schedule={schedule}
                        activeMonth={activeMonth}
                        activeWeek={activeWeek}
                        tasks={tasks}
                        onGorevTamamla={handleCompleteTask}
                        messages={messages}
                        examData={examData}
                        dailyPomodoros={dailyPomodoros}
                        seri={calismaSerisi}
                        onGit={(id) => { sekmeyeGit(id); okundu(id); }}
                    />
                )}

                {/* ═══════════════ GÖREVLERİM ═══════════════ */}
                {activeTab === 'tasks' && (
                    <div className="space-y-8 icerik-gecis">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-3xl font-black text-ink syne tracking-tight">GÖREVLERİM</h1>
                                <p className="text-brand text-[10px] font-black tracking-[0.2em] mt-1 uppercase">GÜNLÜK VE HAFTALIK ÇALIŞMA PLANI</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-surface border border-line px-4 py-2 rounded-xl flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                                    <span className="text-xs font-bold text-ink uppercase tracking-wider">{pendingTasks.length} BEKLİYOR</span>
                                </div>
                                <div className="bg-accent/10 border border-accent/20 px-4 py-2 rounded-xl flex items-center gap-3">
                                    <CheckCircle size={14} className="text-accent" />
                                    <span className="text-xs font-bold text-accent uppercase tracking-wider">{completedTasks.length} TAMAMLANDI</span>
                                </div>
                            </div>
                        </div>

                        {tasks.length === 0 ? (
                            <div className="premium-card p-20 text-center border-dashed border-line">
                                <div className="w-20 h-20 bg-surface/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-line">
                                    <ClipboardList size={40} className="text-ink-2" />
                                </div>
                                <h3 className="text-xl font-bold text-ink mb-3 syne uppercase">HENÜZ GÖREV ATANMADI</h3>
                                <p className="text-ink-3 text-sm max-w-sm mx-auto leading-relaxed">
                                    Koçun sana özel görevler atadığında, çalışma temponu burada düzenli olarak takip edebileceksin.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {/* Bekleyenler */}
                                {pendingTasks.length > 0 && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                                            <h2 className="text-xs font-black text-ink-2 uppercase tracking-[0.3em]">BEKLEYEN GÖREVLER</h2>
                                            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {pendingTasks.map(task => (
                                                <div key={task.id} className="premium-card p-6 flex flex-col justify-between group hover:border-brand/30 transition-all duration-yavas">
                                                    <div>
                                                        <div className="flex items-start justify-between gap-4 mb-4">
                                                            <div className="p-3 bg-surface/5 rounded-2xl group-hover:bg-brand/10 transition-colors">
                                                                <CategoryIcon category={task.category} />
                                                            </div>
                                                            <PriorityBadge priority={task.priority} />
                                                        </div>
                                                        <h3 className="text-lg font-bold text-ink leading-snug syne group-hover:text-brand transition-colors">{task.title}</h3>
                                                        {task.assignedByName && (
                                                            <p className="text-[10px] font-black text-brand/60 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                                                <User size={12} /> KOÇ: {task.assignedByName}
                                                            </p>
                                                        )}
                                                        {task.description && (
                                                            <p className="text-sm text-ink-3 mt-4 leading-relaxed line-clamp-2">{task.description}</p>
                                                        )}
                                                    </div>

                                                    <div className="mt-8 pt-6 border-t border-line flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-[11px] font-bold text-ink-2 uppercase tracking-wider">
                                                            <Calendar size={14} className="text-brand" />
                                                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString('tr-TR') : 'SÜRESİZ'}
                                                        </div>
                                                        <button
                                                            onClick={() => handleCompleteTask(task.id)}
                                                            className="h-10 px-5 bg-surface/5 hover:bg-accent/20 text-ink-3 hover:text-accent border border-line hover:border-accent/30 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all duration-yavas flex items-center gap-2"
                                                        >
                                                            TAMAMLA
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Tamamlananlar */}
                                {completedTasks.length > 0 && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                                            <h2 className="text-xs font-black text-ink-2 uppercase tracking-[0.3em]">TAMAMLANANLAR</h2>
                                            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {completedTasks.map(task => (
                                                <div key={task.id} className="premium-card p-5 opacity-40 hover:opacity-100 transition-all duration-yavas border-line bg-surface/5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                                                            <Check size={20} className="text-accent" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="text-sm font-bold text-ink line-through truncate">{task.title}</h3>
                                                            <p className="text-[10px] text-ink-2 font-bold uppercase tracking-widest mt-0.5">
                                                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString('tr-TR') : 'GÖREV'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════════════ DENEMELERİM ═══════════════ */}
                {/* ═══════════ ÇALIŞMALARIM MERKEZİ — başlık + özet ═══════════
                    Segment içerikleri (Günlük Kayıt / Hata Defteri / Deneme
                    Analizi) dosyanın ilerisindeki bloklarda; aralarındaki her
                    şey gizli olduğu için ekranda peş peşe görünürler. */}
                {activeTab === 'calismalarim' && (
                    <div className="icerik-gecis space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-ink syne tracking-tight uppercase">Çalışmalarım</h1>
                                <p className="text-brand text-[10px] font-black tracking-[0.2em] mt-1 uppercase">GÜNLÜK KAYIT · HATA DEFTERİ · DENEME ANALİZİ</p>
                            </div>
                            <SegmentliSecim
                                etiket="Çalışma aracı seç"
                                deger={calisSegment}
                                onSec={setCalisSegment}
                                ogeler={[
                                    { id: 'gunluk', etiket: 'Günlük Kayıt' },
                                    { id: 'hata', etiket: 'Hata Defteri' },
                                    { id: 'deneme', etiket: 'Deneme Analizi' },
                                ]}
                            />
                        </div>

                        {/* Bu Hafta — dört mini istatistik (gerçek kayıtlardan) */}
                        <div>
                            <p className="tip-label text-ink-3 mb-2">Bu Hafta</p>
                            <div className="grid grid-cols-4 gap-2 sm:gap-3">
                                <IstatistikCipi simge={ClipboardList} deger={merkezOzet.soru7} etiket="Soru Çözüldü" ton="mor" />
                                <IstatistikCipi simge={Timer} deger={merkezOzet.dakika7 >= 60 ? `${Math.floor(merkezOzet.dakika7 / 60)}s ${merkezOzet.dakika7 % 60}d` : `${merkezOzet.dakika7}d`} etiket="Çalışma Süresi" ton="turuncu" />
                                <IstatistikCipi simge={BookX} deger={merkezOzet.hatalar7} etiket="Hata Kaydı" ton="kirmizi" />
                                <IstatistikCipi simge={BarChart2} deger={merkezOzet.deneme7} etiket="Deneme" ton="yesil" />
                            </div>
                        </div>

                        {/* Gelişimim (Son 7 Gün) — delta + çizgi */}
                        {(merkezOzet.gunSerisi.some((g) => g.soru > 0) || merkezOzet.netFark != null) && (
                            <div className="card p-4 sm:p-5">
                                <p className="tip-label text-ink-3">Gelişimim (Son 7 Gün)</p>
                                <div className="flex items-end gap-6 mt-2">
                                    {merkezOzet.netFark != null && (
                                        <div>
                                            <p className={cn('text-xl font-black syne', merkezOzet.netFark >= 0 ? 'text-ok' : 'text-danger')}>
                                                {merkezOzet.netFark >= 0 ? '+' : ''}{merkezOzet.netFark}
                                            </p>
                                            <p className="tip-mini text-ink-3 uppercase tracking-wider">Net Değişimi</p>
                                        </div>
                                    )}
                                    {merkezOzet.soruFark != null && (
                                        <div>
                                            <p className={cn('text-xl font-black syne', merkezOzet.soruFark >= 0 ? 'text-brand' : 'text-warn')}>
                                                {merkezOzet.soruFark >= 0 ? '+' : ''}{merkezOzet.soruFark}
                                            </p>
                                            <p className="tip-mini text-ink-3 uppercase tracking-wider">Soru Artışı</p>
                                        </div>
                                    )}
                                </div>
                                {/* Buradaki 7 günlük soru alanı kaldırıldı: hemen
                                    altındaki Günlük Kayıt bölümü AYNI seriyi zaten
                                    çiziyor ve daha fazlasını veriyor (7/30 gün
                                    seçici, tarihli ipucu, kitap sayfası). İki
                                    özdeş eğri aynı ekranda iki ayrı ölçüm gibi
                                    okunuyordu. Geriye eğrinin söylemediği iki
                                    sayı kaldı: net değişimi ve soru artışı. */}
                            </div>
                        )}

                        {/* Güçlü alan / çalışılacak alan */}
                        {(merkezOzet.guclu || merkezOzet.gelisecek) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {merkezOzet.guclu && (
                                    <div className="card p-4 flex items-center justify-between gap-3">
                                        <div>
                                            <p className="tip-label text-ink-3">En Çok Geliştiğim Alan</p>
                                            <p className="text-base font-black text-ink mt-0.5">{merkezOzet.guclu.subject}</p>
                                        </div>
                                        <span className="badge badge-ok">%{merkezOzet.guclu.accuracy} isabet</span>
                                    </div>
                                )}
                                {merkezOzet.gelisecek && merkezOzet.gelisecek !== merkezOzet.guclu && (
                                    <div className="card p-4 flex items-center justify-between gap-3">
                                        <div>
                                            <p className="tip-label text-ink-3">Üzerine Çalışmam Gereken</p>
                                            <p className="text-base font-black text-ink mt-0.5">{merkezOzet.gelisecek.subject}</p>
                                        </div>
                                        <span className="badge badge-warn">%{merkezOzet.gelisecek.accuracy} isabet</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════════ GELİŞİMİM MERKEZİ — başlık + segmentler ═══════ */}
                {activeTab === 'gelisimim' && (
                    <div className="icerik-gecis space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-ink syne tracking-tight uppercase">Gelişimim</h1>
                                <p className="text-brand text-[10px] font-black tracking-[0.2em] mt-1 uppercase">GELİŞİMİN GERÇEK VERİLERLE TAKİPTE</p>
                            </div>
                            <SegmentliSecim
                                etiket="Gelişim görünümü seç"
                                deger={gelisimSegment}
                                onSec={setGelisimSegment}
                                ogeler={[
                                    { id: 'genel', etiket: 'Genel' },
                                    { id: 'netlerim', etiket: 'Netlerim' },
                                    { id: 'konularim', etiket: 'Konularım' },
                                    { id: 'rozetlerim', etiket: 'Rozetlerim' },
                                ]}
                            />
                        </div>

                        {gelisimSegment === 'genel' && (
                            <>
                                {/* Gelişim kartları — referans tasarımın 2x2 degrade dörtlüsü */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                    <GelisimKarti
                                        ton="mor" etiket="Netim" simge={TrendingUp}
                                        deger={merkezOzet.sonNet != null ? merkezOzet.sonNet : '—'}
                                        alt={merkezOzet.netFark != null
                                            ? `${merkezOzet.netFark >= 0 ? '+' : ''}${merkezOzet.netFark} net · son deneme`
                                            : 'Deneme girildikçe dolar'}
                                    />
                                    <GelisimKarti
                                        ton="turuncu" etiket="Soru Çözümüm" simge={ClipboardList}
                                        deger={merkezOzet.soru30}
                                        alt="Son 30 gün"
                                    />
                                    <GelisimKarti
                                        ton="yesil" etiket="İsabetim" simge={Target}
                                        deger={merkezOzet.isabet7 != null ? `%${merkezOzet.isabet7}` : '—'}
                                        alt="Son 7 gün doğruluk"
                                    />
                                    <GelisimKarti
                                        ton="mavi" etiket="Çalışma Sürem" simge={Clock}
                                        deger={merkezOzet.dakika7 >= 60 ? `${Math.floor(merkezOzet.dakika7 / 60)}s ${merkezOzet.dakika7 % 60}d` : `${merkezOzet.dakika7}d`}
                                        alt="Son 7 gün"
                                    />
                                </div>

                                {/* Net Değişim Grafiği (Son 5 Deneme) */}
                                {merkezOzet.netSerisi.length >= 2 && (
                                    <div className="card p-4 sm:p-5">
                                        <p className="tip-label text-ink-3 mb-3">Net Değişim Grafiği (Son {merkezOzet.netSerisi.length} Deneme)</p>
                                        <div className="h-52">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={merkezOzet.netSerisi} margin={{ top: 6, right: 12, bottom: 0, left: -18 }}>
                                                    <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="ad" tick={{ fill: 'var(--ink-3)', fontSize: 10 }} tickLine={false} axisLine={false} />
                                                    <YAxis tick={{ fill: 'var(--ink-3)', fontSize: 10 }} tickLine={false} axisLine={false} />
                                                    <GrafikTooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12 }} />
                                                    <Line type="monotone" dataKey="net" name="Net" stroke="var(--brand)" strokeWidth={3} dot={{ r: 4, fill: 'var(--brand)' }} activeDot={{ r: 6 }} animationDuration={300} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {gelisimSegment === 'netlerim' && (
                            <div className="space-y-8">
                                <ExamDetailSection examData={examData} permissions={permissions} user={user} />
                                {examData.length >= 2 && (
                                    <div className="card p-4 sm:p-6">
                                        <ExamComparisonMatrix examResults={examData} studentName={user?.name} />
                                    </div>
                                )}
                            </div>
                        )}

                        {gelisimSegment === 'konularim' && <TopicTracker user={user} />}
                    </div>
                )}

                {/* ═══════════ DAHA FAZLA — araç sayfası ═══════════ */}
                {activeTab === 'daha-fazla' && (
                    <div className="icerik-gecis space-y-5">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-ink syne tracking-tight uppercase">Daha Fazla</h1>
                            <p className="text-brand text-[10px] font-black tracking-[0.2em] mt-1 uppercase">TÜM ARAÇLARIN</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {ARAC_GRUBU.items.map((arac) => (
                                <button
                                    key={arac.id}
                                    type="button"
                                    onClick={() => { sekmeyeGit(arac.id); okundu(arac.id); }}
                                    className="card card-hover p-4 flex flex-col items-center gap-3 text-center min-h-[104px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                                >
                                    <span className="relative w-11 h-11 rounded-2xl bg-brand-soft text-brand flex items-center justify-center">
                                        <arac.icon size={20} />
                                        {arac.badge > 0 && (
                                            <span className="absolute -top-1.5 -right-1.5"><Sayac deger={arac.badge} ton="hata" /></span>
                                        )}
                                    </span>
                                    <span className="tip-small font-bold text-ink">{arac.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══════════════ TESTLERİM + REHBERLİK ═══════════════ */}
                {activeTab === 'tests' && (
                    <div className="icerik-gecis space-y-8">
                        <div>
                            <h1 className="text-3xl font-black text-ink syne tracking-tight uppercase">TESTLER & REHBERLİK</h1>
                            <p className="text-brand text-[10px] font-black tracking-[0.2em] mt-1 uppercase">GELİŞİM ANALİZİ VE ENVANTERLER</p>
                        </div>
                        <div className="premium-card p-1 sm:p-2 border-line">
                            <StudentTestsTab user={user} />
                        </div>
                    </div>
                )}

                {/* ÇALIŞMALARIM → Deneme Analizi segmenti */}
                {activeTab === 'calismalarim' && calisSegment === 'deneme' && (
                    <div className="icerik-gecis pb-10">
                        <DenemeAnalizi ogrenci={user} studentId={user?.id} bakis="ogrenci" />
                    </div>
                )}

                {activeTab === 'messages' && (() => {
                    // Tab açıldığında okunmamış mesajları okundu yap
                    const markAllRead = () => {
                        try {
                            const allMsgs = listeOku('messages');
                            const updated = allMsgs.map(m =>
                                (m.receiverId === user?.id || m.receiverName === user?.name) && !m.read
                                    ? { ...m, read: true }
                                    : m
                            );
                            /**
                             * ⚠️ BURADA BİLEREK `veriDeposu.yaz` KULLANILMIYOR.
                             *
                             * `yaz` storage olayı yayar ve bulut senkronunu
                             * tetikler. Bu bileşen (satır ~564) storage olayını
                             * dinleyip state güncelliyor; ayrıca aşağıda
                             * `unreadCount > 0` iken RENDER SIRASINDA
                             * `setTimeout(markAllRead, 2000)` kuruluyor.
                             * Üçü birleşince geri besleme döngüsü oluşuyor:
                             * yaz → olay → yeniden render → yeni zamanlayıcı →
                             * yaz… Öğrenci mesaj sekmesini açtığında uygulama
                             * kilitleniyordu (canlıda görüldü).
                             *
                             * "Okundu" işareti cihaz-yereldir; 2 dakikalık
                             * toplu senkron turunda zaten buluta gider.
                             */
                            localStorage.setItem('messages', JSON.stringify(updated));
                        } catch { /* ignore */ }
                    };

                    const bulkMessages = (() => {
                        try {
                            const all = listeOku('messages');
                            return all.filter(m =>
                                m.receiverId === user?.id ||
                                m.receiverName === user?.name ||
                                m.isBulk
                            ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                        } catch { return []; }
                    })();

                    const unreadCount = bulkMessages.filter(m => !m.read).length;

                    return (
                        <div className="icerik-gecis space-y-10 pb-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h1 className="text-3xl font-black text-ink syne tracking-tight uppercase">MESAJLARIM</h1>
                                    <p className="text-brand text-[10px] font-black tracking-[0.2em] mt-1 uppercase">BİLDİRİMLER VE KOÇ İLETİŞİMİ</p>
                                </div>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        className="h-12 px-6 bg-gradient-to-r from-brand/20 to-brand/10 hover:from-brand/30 hover:to-brand/20 border border-brand/30 text-brand rounded-xl text-[10px] font-black tracking-widest uppercase transition-all duration-yavas flex items-center gap-3"
                                    >
                                        <CheckCircle size={16} /> TÜMÜNÜ OKUNDU İŞARETLE ({unreadCount})
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                                {/* Duyurular & Bildirimler */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-xs font-black text-ink-3 uppercase tracking-[0.3em]">DUYURULAR ({bulkMessages.length})</h2>
                                        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                                    </div>
                                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                        {bulkMessages.length === 0 ? (
                                            <div className="premium-card p-10 text-center opacity-50 border-dashed border-line">
                                                <p className="text-xs font-bold text-ink-2 uppercase tracking-widest leading-relaxed">HENÜZ BİR DUYURU<br/>BULUNMUYOR</p>
                                            </div>
                                        ) : bulkMessages.map((msg, i) => {
                                            /**
                                             * ⚠️ SON `|| NORMAL_STIL` ŞART.
                                             *
                                             * Eskiden yalnızca `[msg.priority || 'normal']` vardı. Üç
                                             * bilinen değerin (normal/important/urgent) dışında bir
                                             * öncelikle kaydedilmiş TEK bir mesaj — eski sürümden,
                                             * demo verisinden ya da `priority: 'high'` yazan bir
                                             * yerden — `cfg`'yi `undefined` yapıyor ve hemen altındaki
                                             * `cfg.border` okuması bütün sekmeyi çökertiyordu.
                                             * Öğrenci "Mesajlar"a girince uygulamadan atılıyordu.
                                             *
                                             * Hemen aşağıdaki `typeEmoji` bu yedeği zaten taşıyordu
                                             * (`|| '📨'`); burada unutulmuş.
                                             */
                                            const NORMAL_STIL = { border: 'border-line', bg: 'bg-surface', color: 'text-brand', icon: MessageSquare };
                                            const cfg = {
                                                urgent: { border: 'border-danger/30', bg: 'bg-danger/5', color: 'text-danger', icon: AlertCircle },
                                                important: { border: 'border-warn/30', bg: 'bg-warn/5', color: 'text-warn', icon: Zap },
                                                normal: NORMAL_STIL,
                                            }[msg.priority || 'normal'] || NORMAL_STIL;
                                            
                                            const typeEmoji = {
                                                motivation: '🔥', exam_reminder: '📅', study_tip: '💡',
                                                congrats: '🏆', warning: '⚠️', custom: '✉️'
                                            }[msg.type] || '📨';

                                            return (
                                                <div key={msg.id || i} className={`premium-card p-5 border-l-4 transition-all duration-yavas group ${cfg.border} ${cfg.bg} ${!msg.read ? 'ring-2 ring-white/5' : ''}`}>
                                                    <div className="flex items-start gap-4">
                                                        <div className="text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">{typeEmoji}</div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h4 className="font-bold text-ink text-sm syne uppercase truncate">{msg.title || 'KOÇTAN MESAJ'}</h4>
                                                                {!msg.read && (
                                                                    <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-ink-3 leading-relaxed font-medium mb-4">{msg.content || msg.text}</p>
                                                            <div className="flex items-center justify-between border-t border-line pt-3">
                                                                <span className="text-[9px] font-black text-ink-3 uppercase tracking-widest flex items-center gap-1.5">
                                                                    <User size={10} className={cfg.color} /> {msg.senderName || 'MERKEZ'}
                                                                </span>
                                                                <span className="text-[9px] font-black text-ink-3 uppercase tracking-widest">
                                                                    {msg.timestamp ? new Date(msg.timestamp).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {unreadCount > 0 && (() => { setTimeout(markAllRead, 2000); return null; })()}
                                    </div>
                                </div>

                                {/* Sohbet Arayüzü */}
                                <div className="lg:col-span-3 space-y-6">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-xs font-black text-ink-3 uppercase tracking-[0.3em]">KOÇUNLA SOHBET</h2>
                                        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                                    </div>
                                    <div className="premium-card overflow-hidden flex flex-col border-brand/10 bg-transparent backdrop-blur-md" style={{ height: '600px' }}>
                                        {/* Sohbet Header */}
                                        <div className="p-5 border-b border-line bg-surface/5 flex items-center gap-4">
                                            <div className="on-color w-12 h-12 rounded-full bg-gradient-to-br from-brand to-accent flex items-center justify-center p-[2px]">
                                                <div className="w-full h-full rounded-full bg-surface flex items-center justify-center">
                                                    <User size={20} className="text-brand" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-ink text-sm syne uppercase tracking-wider">KOÇUMDAN</h3>
                                                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                                                </div>
                                                <p className="text-[10px] font-bold text-brand/60 uppercase tracking-widest mt-0.5">KOÇUN CANLI / AKTİF</p>
                                            </div>
                                        </div>

                                        {/* Sohbet Body */}
                                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-black/20 custom-scrollbar">
                                            {messages.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                                                    <div className="w-20 h-20 bg-surface/5 rounded-full flex items-center justify-center mb-6">
                                                        <MessageSquare size={40} className="text-ink-3" />
                                                    </div>
                                                    <p className="text-xs font-black text-ink-3 uppercase tracking-widest leading-loose">
                                                        HENÜZ MESAJLAŞMA<br/>BULUNMUYOR
                                                    </p>
                                                </div>
                                            ) : messages.map((msg, idx) => (
                                                <div key={idx} className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'} icerik-gecis`}>
                                                    <div className={`max-w-[80%] space-y-1 ${msg.sender === 'student' ? 'text-right' : 'text-left'}`}>
                                                        {msg.sender !== 'student' && (
                                                            <p className="text-[9px] font-black text-brand uppercase tracking-widest ml-1 mb-1">{msg.senderName || 'KOÇ'}</p>
                                                        )}
                                                        <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed ${msg.sender === 'student'
                                                            ? 'bg-gradient-to-br from-brand to-brand-hover text-white rounded-br-none shadow-xl'
                                                            : 'bg-surface/5 border border-line text-ink rounded-bl-none'
                                                            }`}>
                                                            {msg.text}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1 justify-end opacity-40">
                                                            <span className="text-[9px] font-black text-ink uppercase tracking-tighter">
                                                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                            </span>
                                                            {msg.sender === 'student' && <Check size={10} className="text-brand" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Sohbet Input */}
                                        <form onSubmit={handleSendMessage} className="p-4 bg-surface/5 border-t border-line flex gap-3">
                                            <div className="flex-1 relative group">
                                                <input
                                                    value={newMessage}
                                                    onChange={e => setNewMessage(e.target.value)}
                                                    placeholder="KOÇUNA MESAJ GÖNDER..."
                                                    className="w-full bg-page border border-line rounded-2xl px-6 py-4 text-xs font-bold text-ink outline-none focus:border-brand/50 transition-all placeholder:text-ink-2 tracking-wider"
                                                />
                                            </div>
                                            <button 
                                                type="submit" 
                                                disabled={!newMessage.trim()} 
                                                className="on-color w-14 h-14 bg-gradient-to-br from-brand to-accent text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 transition-all shadow-xl"
                                            >
                                                <Send size={20} />
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}


                {/* ═══════════════ KONU TAKİBİ ═══════════════
                    Sınav konu listesi; durumlar ders programı ve günlük
                    soru kaydından otomatik hesaplanır. */}
                {/* Konu Takibi ve Trend Matrix, GELİŞİMİM merkezinin
                    Konularım / Netlerim segmentlerine taşındı (23.08). */}

                {/* Akıllı Plan kaldırıldı (23.08.2026): öğrenci program
                    oluşturmaz; program yalnız koç tarafından hazırlanır.
                    Eski `?sekme=smart-plan` bağlantısı Program'a düşer. */}

                {/* ═══════════════ POMODORO (Ders Bazlı) ═══════════════ */}
                {activeTab === 'pomodoro' && (
                    <div className="icerik-gecis space-y-8">
                        <div>
                            <h1 className="text-3xl font-black text-ink syne tracking-tight uppercase">ODAKLANMA MERKEZİ</h1>
                            <p className="text-brand text-[10px] font-black tracking-[0.2em] mt-1 uppercase">DERS BAZLI POMODORO VE ZAMAN YÖNETİMİ</p>
                        </div>
                        <div className="premium-card p-1 sm:p-2 border-line">
                            <SubjectPomodoro studentId={user?.id} onComplete={handlePomodoroComplete} />
                        </div>
                    </div>
                )}

                {/* ═══════════════ DEĞERLENDİRME (Öz-değerlendirme) ═══════════════ */}
                {activeTab === 'assessment' && (
                    <div className="icerik-gecis space-y-8">
                        <div>
                            <h1 className="text-3xl font-black text-ink syne tracking-tight uppercase">ÖZ-DEĞERLENDİRME</h1>
                            <p className="text-brand text-[10px] font-black tracking-[0.2em] mt-1 uppercase">HAFTALIK GELİŞİM VE DURUM ANALİZİ</p>
                        </div>
                        <div className="premium-card p-4 sm:p-8 border-line">
                            <SelfAssessmentForm studentId={user?.id} studentName={user?.name} />
                        </div>
                    </div>
                )}

                {/* ═══════════════ RANDEVU (Randevu Sistemi) ═══════════════ */}
                {activeTab === 'appointments' && (
                    <div className="icerik-gecis space-y-8">
                        <div>
                            <h1 className="text-3xl font-black text-ink syne tracking-tight uppercase">KOÇ RANDEVUSU</h1>
                            <p className="text-brand text-[10px] font-black tracking-[0.2em] mt-1 uppercase">BİREBİR REHBERLİK VE PLANLAMA SEANSI</p>
                        </div>
                        <div className="premium-card p-1 sm:p-2 border-line">
                            {/* Öğrenci kendi koçunun saatlerini görür; koç kimliği
                                yollanmazsa slot deposu bulunamıyordu. */}
                            <StudentAppointmentBooker
                                studentId={user?.id}
                                studentName={user?.name}
                                coachId={user?.coachId || user?.ownerCoachId}
                                coachName={user?.coachName || ''}
                            />
                        </div>
                    </div>
                )}

                {/* ═══════════════ PORTFOLYO ═══════════════ */}
                {activeTab === 'portfolio' && (
                    <div className="icerik-gecis space-y-8">
                        <div>
                            <h1 className="text-3xl font-black text-ink syne tracking-tight uppercase">BAŞARI PORTFOLYOSU</h1>
                            <p className="text-brand text-[10px] font-black tracking-[0.2em] mt-1 uppercase">GELECEĞİN İÇİN BİRİKTİRDİĞİİ TÜM BAŞARILAR</p>
                        </div>
                        <div className="premium-card p-1 sm:p-2 border-line">
                            <StudentPortfolio 
                                student={user} 
                                examResults={examData} 
                                tasks={tasks} 
                                gamStats={gamStats} 
                            />
                        </div>
                    </div>
                )}

                {/* ═══════════════ PROGRAM ═══════════════
                    23.08.2026: Öğrenci artık program HAZIRLAMAZ.
                    Kaldırılanlar: kendi haftalık program oluşturucusu
                    (WeeklyScheduleBuilder), "Akıllı Planlayıcıyı Aç"
                    düğmesi ve ProgramBuilderModal erişimi (öğrenci
                    yetki kontrolsüz koçun programının üzerine
                    yazabiliyordu). Tek etkileşim: etüt tamamlama. */}
                {activeTab === 'program' && (
                    <div className="icerik-gecis space-y-5 pb-10">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-ink syne tracking-tight uppercase">Programım</h1>
                            <p className="text-brand text-[10px] font-black tracking-[0.2em] mt-1 uppercase">
                                KOÇUNUN HAZIRLADIĞI ÇALIŞMA PROGRAMI
                            </p>
                        </div>
                        {/* MASAÜSTÜNDE ÇİZELGE VE KARNE YAN YANA.
                            Karne tam genişlikte, çizelgenin ÜSTÜNDE duruyordu:
                            öğrenci uyum yüzdesine bakıp programı görmek için
                            aşağı kaydırıyor, ikisini karşılaştırmak için geri
                            çıkıyordu. Referanstaki düzen gibi ana içerik solda,
                            özet sağda dar sütunda. Telefonda alt alta iner ve
                            çizelge önce gelir — küçük ekranda "bugün ne var"
                            sorusu önceliklidir. */}
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 xl:gap-5 items-start">
                            <div className="xl:col-span-8 min-w-0 order-1">
                                <div className="card p-1 sm:p-2">
                                    <StudentProgramTab
                                        schedule={schedule}
                                        programConfig={programConfig}
                                        user={user}
                                    />
                                </div>
                            </div>
                            <div className="xl:col-span-4 min-w-0 order-2">
                                <ProgramKarnem studentId={user?.id} />
                            </div>
                        </div>
                    </div>
                )}






            {/* ── Pomodoro Dialog (Premium) ── */}
            <dialog id="pomodoro-modal" className="modal bg-transparent p-0 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] open:animate-scale-in">
                <div className="premium-card border-brand/20 bg-surface p-1 relative overflow-hidden">
                    <button
                        onClick={() => document.getElementById('pomodoro-modal').close()}
                        className="absolute top-4 right-4 text-ink-3 hover:text-brand z-50 transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <div className="p-4 sm:p-8">
                        <PomodoroTimer onSessionComplete={handlePomodoroComplete} />
                    </div>
                </div>
            </dialog>
            {/* ── Mesaj Modalı (Premium) ── */}
            {isMessageModalOpen && (
                <Modal
                    acik
                    onClose={() => setIsMessageModalOpen(false)}
                    baslikGizle
                    genislik="md"
                    govdeClassName="p-0 flex flex-col overflow-hidden"
                >
                    <div className="shrink-0 p-6 bg-surface border-b border-line flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                                <MessageSquare size={20} className="text-brand" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-ink syne uppercase">KOÇUNLA KONUŞ</h3>
                                <p className="text-[10px] text-accent font-bold tracking-widest uppercase">ÇEVRİMİÇİ</p>
                            </div>
                        </div>
                        <button onClick={() => setIsMessageModalOpen(false)} className="text-ink-3 hover:text-ink transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/20">
                        {messages.length === 0 ? (
                            <div className="text-center mt-20 opacity-20">
                                <MessageSquare size={60} className="mx-auto mb-4" />
                                <p className="text-ink text-xs font-bold uppercase tracking-widest">HENÜZ MESAJ YOK</p>
                            </div>
                        ) : messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] group`}>
                                    <div className={`p-4 rounded-2xl text-[13px] leading-relaxed shadow-lg ${
                                        msg.sender === 'student' 
                                        ? 'bg-gradient-to-br from-accent to-[#145d52] text-white rounded-tr-none' 
                                        : 'bg-surface/5 border border-line text-ink-2 rounded-tl-none'
                                    }`}>
                                        <p>{msg.text}</p>
                                    </div>
                                    <span className={`text-[9px] font-black text-ink-3 uppercase mt-2 block ${msg.sender === 'student' ? 'text-right' : 'text-left'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleSendMessage} className="p-6 bg-surface/5 border-t border-line flex gap-4">
                        <input 
                            value={newMessage} 
                            onChange={e => setNewMessage(e.target.value)} 
                            placeholder="Mesajınızı buraya yazın..." 
                            className="flex-1 bg-surface/5 border border-line rounded-xl px-6 py-4 text-sm text-ink outline-none focus:border-brand/50 transition-all" 
                        />
                        <button 
                            type="submit" 
                            className="on-color w-14 h-14 bg-gradient-to-br from-brand to-brand-hover text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50"
                            disabled={!newMessage.trim()}
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </Modal>
            )}

            {/* ═══════════ GELİŞİMİM → Rozetlerim segmenti ═══════════ */}
            {activeTab === 'gelisimim' && gelisimSegment === 'rozetlerim' && (
                <div className="icerik-gecis space-y-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-black text-ink syne tracking-tight uppercase">ROZETLER VE BAŞARILAR</h1>
                            <p className="text-brand text-[10px] font-black tracking-[0.2em] mt-1 uppercase">GELİŞİM YOLCULUĞUNDAKİ TÜM KAZANIMLARIN</p>
                        </div>
                        <div className="flex items-center gap-4 bg-surface border border-line px-6 py-3 rounded-2xl">
                             <TrendingUp size={20} className="text-brand" />
                             <div>
                                 <p className="text-[10px] font-black text-ink-3 uppercase">TOPLAM XP</p>
                                 <p className="text-lg font-black text-ink syne line-height-none">{gamStats.totalXP || 0}</p>
                             </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Sol: XP + Seri */}
                        <div className="space-y-6">
                            <XPBar totalXP={gamStats.totalXP} />
                            <StreakCard currentStreak={gamStats.currentStreak} maxStreak={gamStats.maxStreak} />

                            {/* Hızlı İstatistikler */}
                            <div className="premium-card p-8 border-line">
                                <h3 className="text-xs font-black text-brand uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                    <Star size={16} /> BAŞARI ÖZETİ
                                </h3>
                                <div className="space-y-6">
                                    {[
                                        { label: 'Tamamlanan Görevler', v: gamStats.tasksCompleted, max: 50, color: 'var(--c1)' },
                                        { label: 'Pomodoro Seansı', v: gamStats.pomodorosCompleted, max: 50, color: 'var(--c4)' },
                                        { label: 'İncelenen Denemeler', v: gamStats.examsCompleted, max: 10, color: 'var(--accent)' },
                                    ].map(s => (
                                        <div key={s.label}>
                                            <div className="flex justify-between text-xs mb-2">
                                                <span className="text-ink-2 font-bold uppercase tracking-wider">{s.label}</span>
                                                <span className="text-ink font-black syne">{s.v} / {s.max}</span>
                                            </div>
                                            <div className="bg-surface/5 rounded-full h-2 overflow-hidden border border-line p-[1px]">
                                                <div
                                                    className="h-full rounded-full transition-all duration-yavas shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                                                    style={{ 
                                                        width: `${Math.min((s.v / s.max) * 100, 100)}%`,
                                                        backgroundColor: s.color 
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sağ: Rozet Koleksiyonu */}
                        <div className="lg:col-span-2 premium-card p-1 sm:p-2 border-line">
                            <BadgeCollection
                                userStats={gamStats}
                                earnedBadgeIds={gamStats.earnedBadgeIds || []}
                            />
                        </div>
                    </div>

                    {/* 🏆 XP Liderlik Tablosu */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xs font-black text-ink-2 uppercase tracking-[0.3em]">🏆 LİDERLİK TABLOSU</h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                        </div>
                        <div className="premium-card p-1 sm:p-2 border-line">
                            <XPLeaderboard
                                students={(() => {
                                    try { return listeOku('coach_students'); } catch { return []; }
                                })()}
                                currentUserId={user?.id}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════ ANALİTİK ═══════════════ */}
            {activeTab === 'analytics' && (
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 icerik-gecis space-y-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-black text-ink syne tracking-tight uppercase">ANALİTİK MERKEZİ</h1>
                            <p className="text-brand text-[10px] font-black tracking-[0.2em] mt-1 uppercase">ZAYIF NOKTA VE PERFORMANS ÖNGÖRÜLERİ</p>
                        </div>
                        <AICoachButton
                            studentData={{ name: user?.name, grade: user?.grade }}
                            className="premium-button shadow-2xl h-12 px-6 text-[10px] font-black"
                        />
                    </div>

                    {/* YKS Geri Sayım */}
                    <div className="premium-card p-1 sm:p-2 border-line">
                        <YKSCountdownWidget
                            userId={user?.id}
                            examData={examData}
                            userGrade={user?.gradeLevel || user?.grade}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-10">
                        {/* Zayıf Nokta Analizi */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xs font-black text-ink-2 uppercase tracking-[0.3em]">📊 DERS BAZINDA ANALİZ</h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                            </div>
                            <div className="premium-card p-6 border-line">
                                <SubjectWeaknessAnalyzer examData={examData} studentName={user?.name} />
                            </div>
                        </div>

                        {/* Mevcut Gelişmiş Analitik */}
                        {examData.length > 0 && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-xs font-black text-ink-2 uppercase tracking-[0.3em]">📈 GELİŞMİŞ ANALİTİK</h2>
                                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                                </div>
                                <div className="premium-card p-6 border-line">
                                    <AdvancedAnalytics examData={examData} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════ GELİŞİMİM → Genel segmentinin devamı ═══════════
                Degrade kartlar ve net grafiği merkez başlığının altında;
                radar ve hedef yönetimi burada devam eder. */}
            {activeTab === 'gelisimim' && gelisimSegment === 'genel' && (
                <div className="icerik-gecis space-y-8">
                    {/* Analitik pano — mevcut verilerden anlık türetilir, veri yazmaz */}
                    <GelisimPanosu user={user} />
                    {radarVerisi.length > 0 && (
                        <div className="card p-4 sm:p-6">
                            <PerformanceRadar performanceData={radarVerisi} />
                        </div>
                    )}
                    <div className="card p-4 sm:p-6">
                        <GoalSettingModule user={user} examData={examData} />
                    </div>
                </div>
            )}

            {/* ═══════════════ TAKVİM ═══════════════ */}
            {activeTab === 'calendar' && (
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 icerik-gecis space-y-8">
                    <div>
                        <h1 className="text-3xl font-black text-ink syne tracking-tight uppercase">ETKİNLİK TAKVİMİ</h1>
                        <p className="text-brand text-[10px] font-black tracking-[0.2em] mt-1 uppercase">SINAVLAR VE ÖNEMLİ TARİHLER</p>
                    </div>
                    <div className="premium-card p-1 sm:p-2 border-line">
                        <ExamCalendar userId={user?.id} />
                    </div>
                </div>
            )}

            {/* ═══════════════ AI KONU ÖNERİLERİ ═══════════════ */}
            {activeTab === 'suggestions' && (
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 icerik-gecis space-y-10">
                    <div>
                        <h1 className="text-3xl font-black text-ink syne tracking-tight uppercase">AKILLI ÖNERİLER</h1>
                        <p className="text-brand text-[10px] font-black tracking-[0.2em] mt-1 uppercase">YAPAY ZEKA DESTEKLİ ÇALIŞMA RASYONELİ</p>
                    </div>
                    <div className="space-y-10">
                        <div className="premium-card p-1 sm:p-2 border-line">
                            <AITopicSuggestions examData={examData} userId={user?.id} />
                        </div>
                        {examData.length > 0 && (
                            <div className="premium-card p-8 border-line">
                                <h3 className="text-sm font-black text-brand uppercase tracking-[0.2em] mb-6">NET GELİŞİM GRAFİĞİ</h3>
                                <NetProgressChart examData={examData} userId={user?.id} />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ÇALIŞMALARIM → Günlük Kayıt segmenti */}
            {activeTab === 'calismalarim' && calisSegment === 'gunluk' && (
                <div className="icerik-gecis">
                    <DailyStudyLog studentId={user?.id} ogrenci={user} />
                </div>
            )}

            {/* ÇALIŞMALARIM → Hata Defteri segmenti */}
            {activeTab === 'calismalarim' && calisSegment === 'hata' && (
                <div className="icerik-gecis">
                    <ErrorNotebook studentId={user?.id} ogrenci={user} />
                </div>
            )}

            {/* ═══════════════ NOT DEFTERİ ═══════════════ */}
            {activeTab === 'notebook' && (
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 icerik-gecis space-y-8">
                    <div>
                        <h1 className="text-3xl font-black text-ink syne tracking-tight uppercase">KİŞİSEL NOTLAR</h1>
                        <p className="text-brand text-[10px] font-black tracking-[0.2em] mt-1 uppercase">ÇALIŞMA NOTLARI VE HATIRLATICILAR</p>
                    </div>
                    <div className="premium-card p-1 sm:p-2 border-line min-h-[600px]">
                        <NoteBook userId={user?.id} />
                    </div>
                </div>
            )}


            {/* ── Ayarlar Modalı (Premium) ── */}
            {isSettingsOpen && (
                <Modal
                    acik
                    onClose={() => setIsSettingsOpen(false)}
                    baslikGizle
                    genislik="md"
                >
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                                <Key size={20} className="text-brand" />
                            </div>
                            <h2 className="text-xl font-bold text-ink syne uppercase">AI AYARLARI</h2>
                        </div>
                        <button onClick={() => setIsSettingsOpen(false)} className="text-ink-3 hover:text-ink transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-brand uppercase tracking-[0.2em] mb-3">GOOGLE GEMINI API ANAHTARI</label>
                            <div className="relative">
                                <input 
                                    type="password" 
                                    value={apiKey} 
                                    onChange={e => setApiKey(e.target.value)} 
                                    placeholder="AIzSy..." 
                                    className="w-full bg-surface/5 border border-line rounded-xl px-4 py-4 text-ink outline-none focus:border-brand/50 transition-all font-mono text-xs" 
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand opacity-50 shadow-[0_0_10px_#c9a84c]" />
                            </div>
                            <p className="text-[10px] text-ink-2 mt-3 leading-relaxed">
                                Anahtarınız sadece bu cihazda saklanır. <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline font-bold">API KEY ALMAK İÇİN TIKLAYIN</a>
                            </p>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button 
                                onClick={() => setIsSettingsOpen(false)} 
                                className="flex-1 h-12 border border-line rounded-xl text-[10px] font-black text-ink-2 hover:bg-surface/5 transition-all uppercase tracking-widest"
                            >
                                İPTAL
                            </button>
                            <button 
                                onClick={() => { localStorage.setItem('gemini_api_key', apiKey); setIsSettingsOpen(false); }} 
                                className="on-color flex-1 h-12 bg-gradient-to-br from-brand to-brand-hover text-white rounded-xl text-[10px] font-black transition-all hover:scale-105 active:scale-95 uppercase tracking-widest shadow-xl"
                            >
                                KAYDET
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
                </BolumHataSiniri>
            </main>

            {/* 📱 Madde 12: Veli QR Modal */}
            {isParentQROpen && (
                <ParentQRModal
                    student={user}
                    onClose={() => setIsParentQROpen(false)}
                />
            )}

            {/* 📱 Mobil Alt Navigasyon */}
            {/* Alt çubuk ve "Daha Fazla" sayfası, yukarıdaki SEKME_GRUPLARI'nı
                okur — liste ikinci kez yazılmadığı için uyuşmazlık olamaz */}
            <StudentBottomNav
                ogeler={MOBIL_BIRINCIL}
                gruplar={SEKME_GRUPLARI}
                aktif={activeTab}
                onDegis={(id) => { sekmeyeGit(id); okundu(id); }}
            />

            {/* 📲 PWA Yükleme Önerisi */}
            <PWAInstallBanner />
        </div>
    );
};

// ErrorBoundary ile sarmak - Firebase/quota hatalarında beyaz ekran önlenir
const SafeStudentDashboard = () => (
    <ErrorBoundary>
        <StudentDashboard />
    </ErrorBoundary>
);

export default SafeStudentDashboard;
