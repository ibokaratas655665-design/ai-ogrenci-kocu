import React, { useState, useEffect, useMemo } from 'react';
import OverviewTab from '../components/dashboard/OverviewTab.jsx';
import { requireOwnerConfirmation } from '../utils/dataProtection';
import { Users, TrendingUp, AlertCircle, BookOpen, ChevronRight, ChevronDown, Search, FileText, ClipboardList, BarChart2, Upload, Settings, Plus, CheckCircle, X, Shield, Mail, Phone, Calendar, Trash2, Activity, Edit2, Share2, Trophy, Target, Briefcase, Rocket, Presentation, Video, BrainCircuit, LogOut, Moon, Sun, Bell, Bot, ArrowUpDown, MessageSquare, Megaphone, Download, ArrowRight, Zap, RefreshCw, Sparkles, Award, Brain } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';
import { useTheme } from '../context/ThemeContext';
import SmartNotificationBell from '../components/shared/SmartNotifications';
import { useNavigate } from 'react-router-dom';
import GuidanceServiceTab from './GuidanceServiceTab';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line } from 'recharts';
import { parseExcelExamData } from '../utils/excelParser';
import { parsePdfExamData } from '../utils/pdfParser';
import ProgramBuilderModal from '../components/ProgramBuilderModal';
import SettingsModal from '../components/SettingsModal';
import TaskAssignModal from '../components/TaskAssignModal';
import GroupsTab from '../components/GroupsTab';
import ProjectsTab from '../components/ProjectsTab';
import LeaderboardTab from '../components/LeaderboardTab';
import WorkflowTab from '../components/WorkflowTab';
import PresentationsTab from '../components/PresentationsTab';
import AnalyticsTab from '../components/AnalyticsTab';
import RemoteCoachingTab from '../components/RemoteCoachingTab';
import AnalysisCenter from '../components/coach/AnalysisCenter';
import GuidanceCenter from '../components/coach/GuidanceCenter';
import BEPGenerator from '../components/BEPGenerator';
import WhatsAppTab from '../components/whatsapp/WhatsAppTab';
import WhatsAppComposer from '../components/whatsapp/WhatsAppComposer';
import MaterialTab from '../components/dashboard/MaterialTab';
import AdvancedExamsTab from '../components/dashboard/AdvancedExamsTab';
import TeacherSchedulerTab from '../components/dashboard/TeacherSchedulerTab';
import UniversityScoresTab from '../components/dashboard/UniversityScoresTab';
import { useAuth } from '../context/AuthContext';
import firebaseSync from '../services/firebaseSync';
// 🌟 Yeni Bileşenler
import RiskAlarmPanel from '../components/coach/RiskAlarmPanel';
import StudentComparisonTable from '../components/coach/StudentComparisonTable';
import StudentProgressComparison from '../components/coach/StudentProgressComparison';
import { AICoachButton } from '../components/AICoachChat';
import BulkMessageModal from '../components/coach/BulkMessageModal';
import { CoachBottomNav } from '../components/shared/MobileBottomNav';
import KullaniciMenusu from '../components/shared/KullaniciMenusu';
import KocBugun from '../components/coach/KocBugun';
import { BolumHataSiniri } from '../components/ui';
import ClassInstantAnalysis from '../components/coach/ClassInstantAnalysis';
// 🆕 Yeni Koç Özellikleri
import GoalComparisonPanel from '../components/coach/GoalComparisonPanel';
import TaskTemplates from '../components/coach/TaskTemplates';
import ClassRanking from '../components/coach/ClassRanking';
import SparklineChart from '../components/student/SparklineChart';
// 🚀 12 Madde Geliştirme
import RealtimeNotificationBell from '../components/shared/RealtimeNotifications';
import ThemeToggle from '../components/shared/ThemeToggle';
import { MODULE_ICONS } from '../components/icons/ModuleIcons';
import { notifyMany } from '../services/notificationService';
import { BOLUMLER, BOLUM_LISTESI, erisilenBolumler, isAnaKoc, gorunurOgrenciler, gorebilir, sahiplikEkle, onayDurumu } from '../services/accessControl';
import DecimalFolderTab from '../components/guidance/DecimalFolderTab';
import SosyometriPaneli from '../components/guidance/SosyometriPaneli';
import BEPCenter from '../components/guidance/bep/BEPCenter';
import ApprovalCenter from '../components/coach/ApprovalCenter';
import CoachTaskCenter from '../components/coach/CoachTaskCenter';
import CouponManager from '../components/coach/CouponManager';
import InviteManager from '../components/coach/InviteManager';
import KatilimTalepleri from '../components/coach/KatilimTalepleri';
import subscription from '../services/subscriptionService';
import { SINAV_LISTESI, alanListesi, ogrencininSinavi } from '../data/examTopics';
import coachTasks from '../services/coachTaskService';
import TabBadge from '../components/shared/TabBadge';
import useTabBadges from '../hooks/useTabBadges';
import { CoachSelfAssessmentView } from '../components/student/SelfAssessment';
import { CoachAppointmentManager } from '../components/coach/AppointmentSystem';
import StudentGoalsPanel from '../components/coach/StudentGoalsPanel';
import { CoachPomodoroView } from '../components/student/SubjectPomodoro';
import SociometryNetworkMap from '../components/coach/SociometryNetworkMap';
import { OfflineBanner } from '../services/offlineSync';
import { getOBPScore, clearScoreCache } from '../utils/scoreCalculator';
import { AMBLEM_BASE64 } from '../data/amblemBase64';
import MARKA from '../data/marka';
import { bildir, onayla } from '../services/uiGeriBildirim';
import { hataAnlat } from '../services/hataMesaji';
import MarkaGorsel from '../components/ui/MarkaGorsel';
import Modal from '../components/ui/Modal';
import { oku, yaz } from '../services/veriDeposu';

// 🛡️ Safe JSON Parser
/**
 * Okuma tek kapıdan: `veriDeposu.oku` bozuk JSON'da varsayılana düşer,
 * '[object Object]' gibi bozuk yazımları da eler.
 */
const safeParse = (key, defaultValue = []) => oku(key, defaultValue);

const normalizeName = (name) => {
    if (!name) return '';
    return name.trim().toLowerCase().replace(/[İI]/g, 'i').replace(/[ıI]/g, 'i').replace(/\s+/g, ' ');
};

// Dark Mode Toggle
// Tema düğmesi ortak bileşene taşındı — bkz. components/shared/ThemeToggle.jsx
const DarkModeToggle = ThemeToggle;

/**
 * Sekme tanımları tek yerde.
 * Eskiden üç ayrı JSX bloğuna gömülüydü; bir sekme eklemek üç yeri
 * düzenlemeyi gerektiriyor, izin (perm) alanı da unutulabiliyordu.
 * Her grubun kendi vurgu rengi var — koç hangi bölümde olduğunu
 * renkten de anlıyor.
 */
/**
 * ══════════════════════════════════════════════════════════════
 *  BÖLÜM BAZLI SEKME DÜZENİ
 *
 *  Uygulama iki ayrı işi yürütüyor ve bunlar aynı ekranda karışmamalı:
 *
 *    KOÇLUK — özel öğrenci koçluğu: program, deneme analizi, hedef,
 *             materyal, projeler, taban puan
 *    PDR    — okul rehberlik servisi: desimal dosya, görüşme, envanter,
 *             BEP, risk haritası, öğretmen programı
 *
 *  Randevular, WhatsApp, Gruplar gibi sekmeler HER İKİ bölümde de
 *  gerekiyor — ama farklı bağlamda (koçluk randevusu ≠ rehberlik
 *  görüşme randevusu). Bu yüzden `ortak: true` ile işaretlenip iki
 *  tarafta da gösteriliyor; sekme kimliği bölüm ön ekiyle ayrılıyor
 *  ki kayıtlar birbirine karışmasın.
 * ══════════════════════════════════════════════════════════════
 */
/**
 * Görev atarken seçilebilecek sekmeler.
 * NAV_BY_SECTION'dan türetilir — sekme eklendiğinde bu liste elle
 * güncellenmek zorunda kalmasın diye. `bolumler` alanı sekmenin hangi
 * bölümlerde bulunduğunu söyler; görev formu buna göre süzer.
 */
const gorevSekmeleriniTuret = (agac) => {
    const harita = new Map();
    Object.entries(agac).forEach(([bolumId, gruplar]) => {
        gruplar.forEach((g) => g.items.forEach((t) => {
            const mevcut = harita.get(t.id);
            if (mevcut) {
                if (!mevcut.bolumler.includes(bolumId)) mevcut.bolumler.push(bolumId);
            } else {
                harita.set(t.id, { id: t.id, label: t.label, bolumler: [bolumId] });
            }
        }));
    });
    return [...harita.values()];
};

const NAV_BY_SECTION = {
    kocluk: [
        {
            label: 'Analiz Merkezi',
            accent: 'var(--brand)',
            items: [
                /* Açılış ekranı. Eskiden koç panele girdiğinde "Analiz"
                   açılıyordu: grafikler ve ortalamalar. Bunlar ay sonunda
                   anlamlı ama koçun sabah sorduğu soru "kim beni bekliyor";
                   o soruyu bu sekme cevaplıyor. Yetki koşulu YOK — her koçun
                   kendi iş listesi olmalı. */
                { id: 'bugun', icon: MODULE_ICONS.analysis, label: 'Bugün' },
                { id: 'analysis', icon: MODULE_ICONS.analysis, label: 'Analiz', perm: 'analysis' },
                { id: 'exams', icon: MODULE_ICONS.exams, label: 'Denemeler', perm: 'exams' },
            ],
        },
        {
            label: 'Koçluk Araçları',
            accent: 'var(--accent)',
            items: [
                { id: 'programs', icon: MODULE_ICONS.programs, label: 'Programlar', perm: 'programs' },
                { id: 'projects', icon: MODULE_ICONS.projects, label: 'Projeler', perm: 'projects' },
                { id: 'university-scores', icon: MODULE_ICONS['university-scores'], label: 'Taban Puan', perm: 'university-scores' },
            ],
        },
        {
            label: 'İletişim ve Takip',
            accent: 'var(--c4)',
            items: [
                { id: 'groups', icon: MODULE_ICONS.groups, label: 'Gruplar', perm: 'groups', ortak: true },
                { id: 'whatsapp', icon: MODULE_ICONS.whatsapp, label: 'WhatsApp', perm: 'whatsapp', ortak: true },
                { id: 'appointments', icon: MODULE_ICONS.appointments, label: 'Randevular', perm: 'appointments', ortak: true },
                { id: 'coaches', icon: MODULE_ICONS.coaches, label: 'Koç Yön.', boss: true },
                { id: 'approvals', icon: MODULE_ICONS.coaches, label: 'Onaylar', boss: true, ortak: true },
                { id: 'coach-tasks', icon: MODULE_ICONS.projects, label: 'Görevler', ortak: true },
                { id: 'coupons', icon: MODULE_ICONS.material, label: 'Kuponlar', ortak: true },
                { id: 'invites', icon: MODULE_ICONS.groups, label: 'Davetler', ortak: true },
            ],
        },
    ],

    /**
     * PDR bölümü doğrudan resmî DOSYA DÜZENİNE göre kurulur: rehberlik
     * servisinin tuttuğu 10 dosyanın her biri kendi sekmesidir. Uygulamanın
     * çalışma araçları (BEP, envanter, görüşme, randevu, risk haritası)
     * ayrı sekmelerde durmaz — ait oldukları dosyanın İÇİNDE, alt sekme
     * olarak açılır. Böylece "çalışmayı yap, sonra ayrıca dosyala"
     * ikiliği ortadan kalkar.
     */
    pdr: [
        {
            label: 'Planlama ve Raporlama',
            accent: 'var(--c1)',
            items: [
                { id: 'pdr-1', icon: MODULE_ICONS.programs, label: '1 · Plan-Program', perm: 'guidance' },
                { id: 'pdr-2', icon: MODULE_ICONS.analysis, label: '2 · Yıl Sonu Rapor', perm: 'guidance' },
                { id: 'pdr-3', icon: MODULE_ICONS.projects, label: '3 · Eylem Planları', perm: 'guidance' },
            ],
        },
        {
            label: 'Evrak ve Kurul',
            accent: 'var(--c3)',
            items: [
                { id: 'pdr-4', icon: MODULE_ICONS.material, label: '4 · Gelen-Giden Evrak', perm: 'guidance' },
                { id: 'pdr-5', icon: MODULE_ICONS.coaches, label: '5 · Komisyon Tutanak', perm: 'guidance' },
                { id: 'pdr-10', icon: MODULE_ICONS.guidance, label: '10 · Mevzuat', perm: 'guidance' },
            ],
        },
        {
            label: 'Öğrenci Çalışmaları',
            accent: 'var(--accent)',
            items: [
                { id: 'pdr-6', icon: MODULE_ICONS.appointments, label: '6 · Görüşme', perm: 'guidance' },
                { id: 'pdr-7', icon: MODULE_ICONS.groups, label: '7 · Sınıf Dosyası', perm: 'guidance' },
                { id: 'pdr-8', icon: MODULE_ICONS.analysis, label: '8 · Risk Haritaları', perm: 'guidance' },
                { id: 'pdr-9', icon: MODULE_ICONS.guidance, label: '9 · Özel Eğitim / BEP', perm: 'guidance' },
            ],
        },
        {
            label: 'Rehberlik Araçları',
            accent: 'var(--c4)',
            items: [
                { id: 'material', icon: MODULE_ICONS.material, label: 'Materyal Üretimi', perm: 'material' },
                { id: 'analysis', icon: MODULE_ICONS.analysis, label: 'Öğrenci İzleme', perm: 'analysis', ortak: true },
                { id: 'teacher-scheduler', icon: MODULE_ICONS['teacher-scheduler'], label: 'Öğretmen Programı', perm: 'teacher-scheduler' },
            ],
        },
        {
            label: 'İletişim ve Takip',
            accent: 'var(--brand)',
            items: [
                { id: 'groups', icon: MODULE_ICONS.groups, label: 'Gruplar', perm: 'groups', ortak: true },
                { id: 'whatsapp', icon: MODULE_ICONS.whatsapp, label: 'WhatsApp', perm: 'whatsapp', ortak: true },
                // Randevu, PDR tarafında ayrı sekme değil — 6. Görüşme
                // Dosyası'nın içinde, ait olduğu çalışmanın yanında durur.
                { id: 'coaches', icon: MODULE_ICONS.coaches, label: 'Koç Yön.', boss: true },
                { id: 'approvals', icon: MODULE_ICONS.coaches, label: 'Onaylar', boss: true, ortak: true },
                { id: 'coach-tasks', icon: MODULE_ICONS.projects, label: 'Görevler', ortak: true },
                { id: 'coupons', icon: MODULE_ICONS.material, label: 'Kuponlar', ortak: true },
                { id: 'invites', icon: MODULE_ICONS.groups, label: 'Davetler', ortak: true },
            ],
        },
    ],
};

const GOREV_SEKMELERI = gorevSekmeleriniTuret(NAV_BY_SECTION);

// Toast Component
const Toast = ({ message, onClose, type = 'success' }) => (
    <div className={`on-color fixed top-8 left-1/2 transform -translate-x-1/2 z-notify px-6 py-3 rounded-full shadow-e3 flex items-center icerik-gecis ${type === 'success' ? 'bg-surface-inv' : 'bg-danger'}`}>
        {type === 'success'
            ? <CheckCircle size={18} className="mr-2" style={{ color: 'var(--ok)' }} />
            : <AlertCircle size={18} className="mr-2" />}
        <span className="text-sm font-medium" style={{ color: type === 'success' ? 'var(--bg)' : '#fff' }}>{message}</span>
        <button onClick={onClose} className="ml-4 opacity-60 hover:opacity-100" style={{ color: type === 'success' ? 'var(--bg)' : '#fff' }}><X size={14} /></button>
    </div>
);


const TestsTab = ({ students, setToast, onAssignTask }) => {
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'assign'
    const [selectedForInternalView, setSelectedForInternalView] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const getCompletedTests = (studentId) => {
        try {
            return JSON.parse(localStorage.getItem(`test_results_${studentId}`) || '[]');
        } catch { return []; }
    };

    const getAssignedTests = (studentId) => {
        try {
            return JSON.parse(localStorage.getItem(`assigned_tests_${studentId}`) || '[]');
        } catch { return []; }
    };

    const handleDeleteResult = async (studentId, resultId) => {
        if (await onayla({ mesaj: 'Bu test sonucunu silmek istediğinize emin misiniz?', tehlikeli: true })) {
            const results = safeParse(`test_results_${studentId}`, []);
            const filtered = results.filter(r => r.id !== resultId);
            localStorage.setItem(`test_results_${studentId}`, JSON.stringify(filtered));
            setToast('Test sonucu silindi.');
        }
    };

    const handleUnassign = async (studentId, testId) => {
        if (await onayla({ mesaj: 'Bu test atamasını kaldırmak istediğinize emin misiniz?', tehlikeli: true })) {
            const assigned = JSON.parse(localStorage.getItem(`assigned_tests_${studentId}`) || '[]');
            const filtered = assigned.filter(a => a.testId !== testId);
            localStorage.setItem(`assigned_tests_${studentId}`, JSON.stringify(filtered));
            setToast('Atama kaldırıldı.');
        }
    };

    // PDF generation from coach side
    const downloadDetailedPDF = (student, result) => {
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const W = 210; const H = 297;
        const today = new Date().toLocaleDateString('tr-TR');

        // Professional Header
        pdf.setFillColor(30, 58, 138); // Dark Blue
        pdf.rect(0, 0, W, 45, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.text('PSIKOLOJIK ANALIZ VE REHBERLIK RAPORU', 15, 20);

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Kurumsal Rehberlik Modulu`, 15, 30);
        pdf.text(`Rapor Tarihi: ${today}`, 15, 38);

        /* Marka amblemi sağ üstte.
           Bu rapor MEB resmî evrakı DEĞİL — altında "resmi evrak niteligi
           tasimaz" ibaresi var — o yüzden uygulama markası basılabiliyor.
           mebDocument.js ile üretilen resmî belgelere amblem KONULMAZ. */
        pdf.setFillColor(255, 255, 255);
        pdf.circle(W - 25, 18, 9, 'F');
        try { pdf.addImage(AMBLEM_BASE64, 'PNG', W - 32, 11, 14, 14); } catch { /* amblemsiz de basılır */ }
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text('Basari Kampi', W - 25, 32, { align: 'center' });
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(255, 255, 255);

        // Student Info Box
        pdf.setFillColor(243, 244, 246);
        pdf.roundedRect(10, 50, W - 20, 25, 3, 3, 'F');

        pdf.setTextColor(31, 41, 55);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`OGRENCI BILGILERI`, 15, 58);

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Ad Soyad: ${student.name}`, 15, 65);
        pdf.text(`Sinif/Sube: ${student.grade}/${student.section || '-'}`, 80, 65);
        pdf.text(`No: ${student.schoolNumber || '-'}`, 140, 65);

        // Test Specific Header
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 58, 138);
        pdf.text(result.testTitle?.toUpperCase() || 'TEST SONUCU', 15, 88);
        pdf.setDrawColor(30, 58, 138);
        pdf.line(15, 90, 70, 90);

        // Analysis Result
        pdf.setFillColor(239, 246, 255);
        pdf.roundedRect(15, 95, W - 30, 35, 2, 2, 'F');

        pdf.setTextColor(37, 99, 235);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('TEMEL BULGU VE DEGERLENDIRME', 20, 103);

        pdf.setTextColor(17, 24, 39);
        pdf.setFontSize(18); // Higher font size as requested
        pdf.text(result.level || 'Analiz Tamamlandi', 20, 118);

        // In-depth Scientific Analysis
        const analysisY = 140;
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 58, 138);
        pdf.text('DETAYLI BILIMSEL ANALIZ VE KOC YORUMU', 15, analysisY);

        pdf.setFontSize(11); // Increased font size
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(55, 65, 81);

        const mainComment = result.comment || result.detail || 'Test verileri islenmistir.';
        const scientificAddon = "\n\nBu analiz, bilissel ve duygusal sureclerin mevcut akademik performans uzerindeki etkilerini optimize etmek amaciyla modern pedagojik yaklasimlara dayanarak hazirlanmistir. Ogrencinin oz-duzenleme becerileri ve motivasyonel faktorleri test sonuclariyla korele edilmektedir.";

        const fullComment = mainComment + scientificAddon;
        const splitText = pdf.splitTextToSize(fullComment, W - 30);
        pdf.text(splitText, 15, analysisY + 10);

        // Footer
        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175);
        pdf.text('Bu rapor Basari Kampi tarafindan otomatik olarak uretilmistir. Resmi evrak niteligi tasimaz.', W / 2, H - 10, { align: 'center' });

        pdf.save(`${student.name}_${result.testId}_Analiz.pdf`);
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(s.schoolNumber).includes(searchTerm)
    );

    return (
        <div className="glass-card p-6 min-h-[600px]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-ink flex items-center">
                        <ClipboardList className="mr-2 text-brand" size={24} />
                        Bireysel Test & Envanter Yönetimi
                    </h2>
                    <p className="text-sm text-ink-2 mt-1">Öğrencilere özel testler atayın ve detaylı raporları inceleyin.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 text-ink-3" size={16} />
                    <input
                        type="text"
                        placeholder="Öğrenci ara..."
                        className="pl-9 pr-4 py-2 border border-line rounded-xl w-full text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.map(s => {
                    const results = getCompletedTests(s.id);
                    const assigned = getAssignedTests(s.id);
                    const hasPending = assigned.some(a => a.status === 'pending');

                    return (
                        <div key={s.id} className="bg-surface border border-line rounded-2xl p-5 hover:border-indigo-400 transition-all shadow-sm flex flex-col group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center text-brand font-bold">
                                        {s.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-ink truncate max-w-[140px]">{s.name}</h3>
                                        <p className="text-xs text-ink-3">{s.grade}/{s.section} · No: {s.schoolNumber}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="bg-ok-soft text-ok text-[10px] px-2 py-0.5 rounded-full font-bold">
                                        {results.length} Biten
                                    </span>
                                    {hasPending && (
                                        <span className="bg-warn-soft text-warn text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                                            Bekleyen
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 space-y-3 mb-4">
                                {results.length > 0 ? (
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-ink-3 uppercase tracking-wider">Son Sonuçlar</p>
                                        {results.slice(0, 2).map(r => (
                                            <div key={r.id} className="flex items-center justify-between p-2 bg-surface-2 rounded-lg group/item">
                                                <div className="min-w-0 pr-2">
                                                    <p className="text-xs font-bold text-ink-2 truncate">{r.testTitle}</p>
                                                    <p className="text-[10px] text-brand font-medium">{r.level}</p>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                    <button onClick={() => downloadDetailedPDF(s, r)} className="p-1 hover:bg-surface rounded border border-line text-brand">
                                                        <FileText size={12} />
                                                    </button>
                                                    <button onClick={() => handleDeleteResult(s.id, r.id)} className="p-1 hover:bg-surface rounded border border-line text-danger">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-20 flex items-center justify-center border-2 border-dashed border-line rounded-xl">
                                        <p className="text-xs text-ink-3">Henüz sonuç yok</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {/* Bu buton eskiden boş bir handler'a bağlıydı: tıklanıyor
                                    ama hiçbir şey açmıyordu. Artık görev/test atama
                                    penceresini bu öğrenci seçili olarak açar. */}
                                <button
                                    onClick={() => onAssignTask?.(s)}
                                    className="flex-1 bg-brand text-white py-2 rounded-xl text-xs font-bold hover:bg-brand-hover transition shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5"
                                >
                                    <Plus size={14} /> Test Ata
                                </button>
                                <button
                                    onClick={() => setToast(`${s.name} profilinden tüm testlere erişebilirsiniz.`)}
                                    className="px-3 bg-surface-3 text-ink-2 py-2 rounded-xl hover:bg-surface-3 transition text-xs font-bold"
                                >
                                    Profil
                                </button>
                            </div>
                        </div>
                    );
                })}

                {filteredStudents.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                        <Search size={48} className="mx-auto text-ink-3 mb-4" />
                        <p className="text-ink-3 font-medium">Öğrenci bulunamadı.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const ProgramsTab = ({ students, setToast, onOpenProgramBuilder, onOpenProgramBuilderForStudent }) => {
    const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    const [activeMonth] = useState(1);
    const [activeWeek, setActiveWeek] = useState(1);
    const [previewStudentId, setPreviewStudentId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [previewMeta, setPreviewMeta] = useState({ duration: 1, slotCount: 6, title: '' });

    React.useEffect(() => {
        if (previewStudentId) {
            const savedMeta = localStorage.getItem(`program_meta_${previewStudentId}`);
            if (savedMeta) {
                try {
                    const meta = JSON.parse(savedMeta);
                    setPreviewMeta({
                        duration: meta.programDurationMonths || 1,
                        slotCount: meta.dailySlotCount || 6,
                        title: meta.title || ''
                    });
                } catch (e) {
                    setPreviewMeta({ duration: 1, slotCount: 6, title: '' });
                }
            } else {
                setPreviewMeta({ duration: 1, slotCount: 6, title: '' });
            }
        }
    }, [previewStudentId]);

    const getStudentSchedule = (studentId) => {
        try {
            const saved = localStorage.getItem(`program_schedule_${studentId}`);
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    };

    const studentsWithStatus = students.map(s => {
        const schedule = getStudentSchedule(s.id);
        const hasProgram = schedule && Object.keys(schedule).length > 0;
        let fillRate = 0;
        if (hasProgram) {
            const total = DAYS.length * 6;
            const filled = DAYS.reduce((acc, day) => {
                for (let i = 0; i < 6; i++) { if (schedule[`m1-w1-${day}-${i}`]) acc++; }
                return acc;
            }, 0);
            fillRate = Math.round((filled / total) * 100);
        }
        return { ...s, hasProgram, fillRate };
    });

    const filtered = studentsWithStatus.filter(s =>
        !searchQuery ||
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.schoolNumber && String(s.schoolNumber).includes(searchQuery)) ||
        (s.grade && s.grade.includes(searchQuery))
    );

    const withProgram = studentsWithStatus.filter(s => s.hasProgram);
    const withoutProgram = studentsWithStatus.filter(s => !s.hasProgram);
    const avgFill = withProgram.length ? Math.round(withProgram.reduce((a, s) => a + s.fillRate, 0) / withProgram.length) : 0;

    const previewSchedule = previewStudentId ? getStudentSchedule(previewStudentId) : null;
    const previewStudent = students.find(s => String(s.id) === String(previewStudentId));
    const safeSlotCount = 6;
    const previewScheduleRef = React.useRef(null);

    const handleDownloadPDF = async () => {
        const weekDivs = document.querySelectorAll('[data-pdf-week]');
        if (!weekDivs || weekDivs.length === 0 || !previewStudent) {
            bildir('Önce program oluşturun veya bir öğrenci seçin.');
            return;
        }

        setToast('Tüm program PDF olarak hazırlanıyor...');

        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pdfW = doc.internal.pageSize.getWidth();
        const pdfH = doc.internal.pageSize.getHeight();
        const margin = 5;
        const imgW = pdfW - margin * 2;
        const imgH = pdfH - margin * 2;
        let firstPage = true;

        try {
            for (const div of weekDivs) {
                div.style.display = 'block';
                const canvas = await html2canvas(div, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    width: 1120,
                    windowWidth: 1120
                });
                div.style.display = '';

                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const ratio = Math.min(imgW / canvas.width, imgH / canvas.height);
                const drawW = canvas.width * ratio;
                const drawH = canvas.height * ratio;
                const offsetX = margin + (imgW - drawW) / 2;
                const offsetY = margin + (imgH - drawH) / 2;

                if (!firstPage) doc.addPage();
                doc.addImage(imgData, 'JPEG', offsetX, offsetY, drawW, drawH);
                firstPage = false;
            }

            doc.save(`${previewStudent.name}_Tum_Program_Akilli_Plan.pdf`);
            setToast('PDF başarıyla indirildi.');
        } catch (error) {
            console.error('PDF Error:', error);
            bildir('PDF oluşturulurken bir hata oluştu.', 'hata');
        }
    };

    const handleDeleteProgram = async (studentId, studentName) => {
        if (await onayla({ mesaj: `${studentName} adlı öğrencinin ders programını silmek istediğinize emin misiniz?`, tehlikeli: true })) {
            localStorage.removeItem(`program_schedule_${studentId}`);
            localStorage.removeItem(`program_closed_slots_${studentId}`);
            localStorage.removeItem(`program_meta_${studentId}`);
            localStorage.removeItem(`program_${studentId}_monthly_grid`);
            localStorage.removeItem(`program_${studentId}`);
            setToast(`${studentName} adlı öğrencinin programı silindi.`);
            setPreviewStudentId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* İstatistik Özeti */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Toplam Öğrenci', value: students.length, icon: Users, acc: 'var(--brand)' },
                    { label: 'Program Var', value: withProgram.length, icon: CheckCircle, acc: 'var(--ok)' },
                    { label: 'Program Yok', value: withoutProgram.length, icon: AlertCircle, acc: 'var(--warn)' },
                    { label: 'Ort. Doluluk', value: `%${avgFill}`, icon: Activity, acc: 'var(--c4)' },
                ].map(({ label, value, icon: Icon, acc }) => (
                    <div key={label} className="srf srf-accent p-4" style={{ '--acc': acc }}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="sec-icon" style={{ '--acc': acc }}><Icon size={16} /></span>
                            <span className="num text-3xl">{value}</span>
                        </div>
                        <p className="eyebrow">{label}</p>
                    </div>
                ))}
            </div>

            {/* Öğrenci Listesi */}
            <div className="bg-surface rounded-2xl shadow-sm border border-line overflow-hidden">
                <div className="p-5 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-2/50">
                    <h2 className="text-base font-bold text-ink flex items-center gap-2">
                        <FileText size={18} className="text-info" />
                        Ders Programları
                    </h2>
                    <div className="flex gap-2 flex-wrap">
                        <div className="relative">
                            <Search size={15} className="absolute left-3 top-2.5 text-ink-3" />
                            <input
                                type="text"
                                placeholder="Öğrenci ara..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 pr-3 py-2 text-sm border border-line rounded-xl focus:ring-2 focus:ring-blue-400 outline-none w-44 bg-surface"
                            />
                        </div>
                        <button
                            onClick={onOpenProgramBuilder}
                            className="on-color flex items-center gap-2 text-sm bg-gradient-to-r from-blue-600 to-brand text-white px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition font-bold"
                        >
                            <Plus size={16} /> Yeni Program
                        </button>
                    </div>
                </div>

                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filtered.map(s => (
                        <div
                            key={s.id}
                            onClick={() => setPreviewStudentId(prev => String(prev) === String(s.id) ? null : String(s.id))}
                            className={`relative rounded-2xl border-2 p-4 cursor-pointer transition-all duration-normal hover:shadow-md hover:-translate-y-0.5
                                ${String(previewStudentId) === String(s.id)
                                    ? 'border-info bg-info-soft shadow-md'
                                    : 'border-line bg-surface hover:border-info'}`}
                        >
                            <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${s.hasProgram ? 'bg-ok' : 'bg-gray-300'}`} />
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`on-color w-11 h-11 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm flex-shrink-0 ${s.hasProgram ? 'bg-gradient-to-br from-blue-500 to-brand text-white' : 'bg-surface-3 text-ink-3'}`}>
                                    {s.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-ink text-sm truncate">{s.name}</p>
                                    <p className="text-xs text-ink-3">
                                        {s.grade}{s.section ? `/${s.section}` : ''}
                                        {s.schoolNumber ? ` · No: ${s.schoolNumber}` : ''}
                                    </p>
                                </div>
                            </div>
                            {s.hasProgram && (
                                <div className="mb-3">
                                    <div className="flex justify-between text-[11px] mb-1">
                                        <span className="text-ink-3 font-medium">Program doluluk</span>
                                        <span className="font-bold text-info">%{s.fillRate}</span>
                                    </div>
                                    <div className="w-full bg-surface-3 rounded-full h-1.5 overflow-hidden">
                                        <div className="on-color h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-yavas" style={{ width: `${s.fillRate}%` }} />
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={e => { e.stopPropagation(); onOpenProgramBuilderForStudent(s); }}
                                    className={`on-color flex-1 text-xs py-2 rounded-xl font-bold transition-all ${s.hasProgram ? 'bg-brand text-white hover:bg-brand-hover shadow-sm' : 'bg-gradient-to-r from-blue-600 to-brand text-white shadow-sm hover:shadow-md'}`}
                                >
                                    {s.hasProgram ? '✏️ Düzenle' : '+ Oluştur'}
                                </button>
                                {s.hasProgram && (
                                    <button
                                        onClick={e => { e.stopPropagation(); handleDeleteProgram(s.id, s.name); }}
                                        className="px-3 text-xs bg-danger-soft text-danger border border-danger py-2 rounded-xl hover:bg-danger-soft hover:text-danger transition"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="col-span-3 text-center py-12 text-ink-3">
                            <Users size={40} className="mx-auto mb-3 opacity-30" />
                            <p className="font-semibold">{searchQuery ? 'Aranan öğrenci bulunamadı.' : 'Henüz öğrenci eklenmedi.'}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Önizleme Paneli */}
            {previewStudentId && previewStudent && (
                <div ref={previewScheduleRef} className="bg-surface rounded-2xl shadow-sm border border-line overflow-hidden icerik-gecis mb-8">
                    <div className="p-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-info-soft/50">
                        <div className="flex items-center gap-3">
                            <div className="on-color w-10 h-10 bg-gradient-to-br from-blue-500 to-brand rounded-xl flex items-center justify-center text-white font-black">
                                {previewStudent.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-bold text-ink text-sm">{previewStudent.name}</h3>
                                <p className="text-xs text-ink-3">Haftalık Program Önizlemesi</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 pdf-hide">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4].map(w => (
                                    <button key={w} onClick={() => setActiveWeek(w)} className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${activeWeek === w ? 'bg-info text-ink' : 'bg-surface text-ink-2 border border-line hover:bg-info-soft'}`}>
                                        {w}. H
                                    </button>
                                ))}
                            </div>
                            <button onClick={handleDownloadPDF} className="text-xs bg-ok text-white px-3 py-1.5 rounded-xl hover:bg-ok transition font-bold shadow-sm flex items-center gap-1.5">
                                <Download size={14} /> PDF İndir
                            </button>
                            <button onClick={() => onOpenProgramBuilderForStudent(previewStudent)} className="text-xs bg-brand text-white px-3 py-1.5 rounded-xl hover:bg-brand-hover transition font-bold shadow-sm">
                                Düzenle
                            </button>
                            <button onClick={() => setPreviewStudentId(null)} className="p-1.5 text-ink-3 hover:text-ink-2 hover:bg-surface-3 rounded-xl transition">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {!previewSchedule || Object.keys(previewSchedule).length === 0 ? (
                        <div className="text-center py-14 px-4 bg-surface-2">
                            <Calendar size={44} className="text-info mx-auto mb-3" />
                            <p className="font-bold text-ink-2">Bu öğrenci için henüz program oluşturulmadı.</p>
                            <button onClick={() => onOpenProgramBuilderForStudent(previewStudent)} className="mt-4 text-sm bg-brand text-white px-6 py-2.5 rounded-xl hover:bg-brand-hover transition font-bold shadow-sm">
                                Program Oluştur
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <div className="min-w-[640px]">
                                <div className="grid border-b-2 border-line" style={{ gridTemplateColumns: `72px repeat(7, 1fr)` }}>
                                    <div className="bg-surface-inv text-white font-bold p-3 text-center text-xs">ETÜT</div>
                                    {DAYS.map(day => (
                                        <div key={day} className="bg-surface-2 font-black p-2 text-center border-l border-line text-[11px] text-ink-2 uppercase tracking-tighter notranslate" translate="no">
                                            {day}
                                        </div>
                                    ))}
                                </div>
                                {Array.from({ length: safeSlotCount }).map((_, slotIndex) => (
                                    <div key={slotIndex} className="grid border-b border-line last:border-0" style={{ gridTemplateColumns: `72px repeat(7, 1fr)` }}>
                                        <div className="bg-surface-2 font-semibold text-ink-3 text-xs p-2 text-center border-r border-line flex items-center justify-center">
                                            {slotIndex + 1}. Etüt
                                        </div>
                                        {DAYS.map(day => {
                                            const cellKey = `m${activeMonth}-w${activeWeek}-${day}-${slotIndex}`;
                                            const cellData = previewSchedule?.[cellKey] || null;
                                            const ts = (val) => { if (!val) return ''; if (typeof val === 'string') return val; if (typeof val === 'object' && val.name) return val.name; return String(val); };
                                            return (
                                                <div key={`${day}-${slotIndex}`} className={`border-l border-line p-1 min-h-[52px] flex flex-col items-center justify-center relative ${cellData ? (cellData.color || 'bg-brand-soft') : 'bg-surface'}`}>
                                                    {cellData && (
                                                        <div className="flex flex-col justify-center items-center text-center px-1 w-full relative">
                                                            {cellData.exam && (
                                                                <span className="absolute -top-1 right-0 bg-surface/90 text-brand text-[7px] font-black px-1 py-0 shadow-sm border rounded-bl-sm z-10">
                                                                    {cellData.exam}
                                                                </span>
                                                            )}
                                                            <span className="text-[9px] font-bold opacity-70 uppercase tracking-tighter mb-0.5 mt-1 block w-full truncate px-0.5">{ts(cellData.subject)}</span>
                                                            <span className="text-[10px] font-black leading-tight text-center break-words w-full h-full py-1 min-h-[24px] flex items-center justify-center">{ts(cellData.topic)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 📄 Gizli Yazdırma Alanı (Tüm Hafta ve Aylar) */}
            <div style={{ position: 'absolute', left: '-9999px', top: '0', pointerEvents: 'none' }}>
                {previewStudent && previewSchedule && Array.from({ length: previewMeta.duration }).map((_, mIdx) => (
                    Array.from({ length: 4 }).map((_, wIdx) => {
                        const m = mIdx + 1;
                        const w = wIdx + 1;
                        const hasDataInWeek = Object.keys(previewSchedule).some(k => k.startsWith(`m${m}-w${w}-`));
                        if (!hasDataInWeek && !(m === 1 && w === 1)) return null;

                        return (
                            <div 
                                key={`${m}-${w}`} 
                                data-pdf-week={`${m}-${w}`}
                                style={{ 
                                    width: '1120px', 
                                    backgroundColor: 'white',
                                    padding: '16px',
                                    boxSizing: 'border-box',
                                    display: 'block'
                                }}>
                                <div className="text-center mb-2 pb-1 border-b-2 border-line">
                                    <h1 className="text-2xl font-black text-ink uppercase tracking-widest">{previewMeta.title || `${previewStudent.name} - Calisma Programi`}</h1>
                                    <p className="text-brand font-black text-sm mt-0.5 uppercase tracking-widest">{m}. AY / {w}. HAFTA DERS PROGRAMI</p>
                                    <p className="text-ink-3 text-[10px] mt-0.5">{previewStudent.name} için AI Tahminli Özel Program</p>
                                </div>

                                <div className="grid grid-cols-8 gap-0 border-2 border-line-2">
                                    <div className="bg-surface-inv text-white font-bold p-1.5 text-center flex items-center justify-center text-xs uppercase">ETÜT</div>
                                    {DAYS.map(day => (
                                        <div key={day} className="bg-surface-3 text-ink font-bold p-1.5 text-center border-l border-b border-line-2 uppercase text-[10px]">{day}</div>
                                    ))}

                                    {[...Array(previewMeta.slotCount)].map((_, sIdx) => (
                                        <React.Fragment key={sIdx}>
                                            <div className="border-b border-line p-1 text-center bg-surface-2 flex flex-col items-center justify-center min-h-[48px]">
                                                <span className="text-[10px] font-black text-ink-2 uppercase">{sIdx + 1}. ETÜT</span>
                                            </div>
                                            {DAYS.map(day => {
                                                const key = `m${m}-w${w}-${day}-${sIdx}`;
                                                const data = previewSchedule[key];
                                                const cellColor = data ? (data.color || 'bg-brand-soft') : 'bg-surface';
                                                return (
                                                    <div key={day} className={`min-h-[48px] border-b border-r border-line p-1 flex flex-col justify-center items-center text-center ${cellColor}`}>
                                                        {data ? (
                                                            <div className="flex flex-col gap-0.5 w-full p-0.5">
                                                                <span className="text-[8px] font-black uppercase opacity-60 leading-none">{data.subject}</span>
                                                                <div className="text-[10px] font-black leading-tight break-words">{data.topic}</div>
                                                                {data.exam && <span className="text-[7px] font-bold text-brand">{data.exam}</span>}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </div>
                                <div className="mt-3 flex justify-between text-[9px] text-ink-3 font-mono uppercase tracking-widest">
                                    <span>AI ÖĞRENCİ KOÇU SİSTEMİ</span>
                                    <span className="text-ink-3 font-bold italic">HER HAFTA YENİ BİR BAŞLANGIÇTIR!</span>
                                    <span>İBRAHİM KARATAŞ EĞİTİM DANIŞMANLIĞI</span>
                                </div>
                            </div>
                        );
                    })
                ))}
            </div>
        </div>
    );
};

const ExamsTab = ({ students, setToast }) => {
    const [showUpload, setShowUpload] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [examTypeFilter, setExamTypeFilter] = useState('all'); // 'all' | 'TYT' | 'AYT' | 'KAZ'
    const [pendingUpload, setPendingUpload] = useState(null); // { file, detectedType, results, trialName }
    const [manualDate, setManualDate] = useState(''); // YYYY-MM-DD
    const [manualName, setManualName] = useState(''); // Kullanıcı deneme adı
    const [chartView, setChartView] = useState('progress'); // 'progress' | 'delta' | 'subject'
    const [studentSearchQuery, setStudentSearchQuery] = useState(''); // 🔍 Öğrenci arama

    // ─── Deneme tipi otomatik algılama ───────────────────────────────
    const detectExamType = (fileName, results) => {
        const nameLower = (fileName || '').toLowerCase();
        // Dosya adından algıla
        if (nameLower.includes('ayt')) return 'AYT';
        if (nameLower.includes('tyt')) return 'TYT';
        if (nameLower.includes('kaz') || nameLower.includes('kazanim') || nameLower.includes('kazanım')) return 'KAZ';
        // İçerik analizi: AYT'ye özgü alanlar var mı?
        if (results && results.length > 0) {
            const sample = results[0];
            const hasAYT = sample.edebiyat != null || sample.aytMat != null ||
                sample.fizik != null || sample.kimya != null ||
                sample.biyoloji != null || sample.sayNet != null ||
                sample.eaNet != null || sample.sozNet != null;
            if (hasAYT) return 'AYT';
        }
        return 'TYT'; // varsayılan
    };

    // ─── v2 storage ile senkronize state ─────────────────────────────
    const [exams, setExamsState] = useState(() => {
        try {
            // Önce v2, sonra legacy
            const v2 = JSON.parse(localStorage.getItem('v2_results_data') || '[]');
            if (v2.length > 0) return v2;
            const legacy = JSON.parse(localStorage.getItem('exams_data') || '[]');
            return legacy;
        } catch { return []; }
    });

    const [trials, setTrialsState] = useState(() => {
        try {
            const v2 = JSON.parse(localStorage.getItem('v2_trials_data') || '[]');
            if (v2.length > 0) return v2;
            const legacy = JSON.parse(localStorage.getItem('trials_data') || '[]');
            return legacy;
        } catch { return []; }
    });

    // Her güncelleme kalıcı olarak hem v2 hem legacy'ye yazılır
    const setExams = (updater) => {
        setExamsState(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            try {
                localStorage.setItem('v2_results_data', JSON.stringify(next));
                localStorage.setItem('exams_data', JSON.stringify(next));
                // Diğer sekmelere haber ver
                window.dispatchEvent(new StorageEvent('storage', { key: 'v2_results_data' }));
            } catch (e) { console.warn('Exam veri kaydı:', e); }
            return next;
        });
    };

    const setTrials = (updater) => {
        setTrialsState(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            try {
                localStorage.setItem('v2_trials_data', JSON.stringify(next));
                localStorage.setItem('trials_data', JSON.stringify(next));
                window.dispatchEvent(new StorageEvent('storage', { key: 'v2_trials_data' }));
            } catch (e) { console.warn('Trial veri kaydı:', e); }
            return next;
        });
    };

    // Filtrelenmiş denemeler
    const filteredExams = examTypeFilter === 'all'
        ? exams
        : exams.filter(e => (e.examType || 'TYT') === examTypeFilter);

    // İlk açılışta son denemeyi aç
    const [expandedTrialId, setExpandedTrialId] = useState(null);
    React.useEffect(() => {
        if (trials.length > 0 && expandedTrialId === null) {
            setExpandedTrialId(trials[trials.length - 1].id);
        }
    }, [trials]);

    // ─── Grafikler SADECE gerçek veriden ─────────────────────────────
    const progressChartData = React.useMemo(() => {
        if (trials.length === 0) return [];
        return trials.map(trial => {
            const trialResults = filteredExams.filter(e => e.trialId === trial.id);
            if (trialResults.length === 0) return null;
            const avgNet = trialResults.reduce((acc, r) => acc + (parseFloat(r.totalNet || r.tyt || 0)), 0) / trialResults.length;
            return { name: trial.name || `Deneme ${trial.id}`, ortalama: parseFloat(avgNet.toFixed(1)), adet: trialResults.length };
        }).filter(Boolean);
    }, [filteredExams, trials]);

    const subjectChartData = React.useMemo(() => {
        if (filteredExams.length === 0) return [];
        const tytExams = filteredExams.filter(e => (e.examType || 'TYT') === 'TYT');
        if (tytExams.length === 0) return [];

        const totals = { turkce: 0, mat: 0, fen: 0, sosyal: 0 };
        const counts = { turkce: 0, mat: 0, fen: 0, sosyal: 0 };

        const getNet = (val) => {
            if (val == null) return null;
            if (typeof val === 'object') return parseFloat(val.net ?? 0);
            return parseFloat(val) || 0;
        };

        tytExams.forEach(e => {
            // subjects objesi
            if (e.subjects) {
                ['turkce', 'mat', 'fen', 'sosyal'].forEach(k => {
                    const n = getNet(e.subjects[k]);
                    if (n != null && n > 0) { totals[k] += n; counts[k]++; }
                });
            }
            // Doğrudan alanlar (fallback)
            ['turkce', 'mat', 'fen', 'sosyal'].forEach(k => {
                if (e[k] != null && counts[k] === 0) {
                    const n = getNet(e[k]);
                    if (n != null && n > 0) { totals[k] += n; counts[k]++; }
                }
            });
        });

        return [
            { subject: 'Türkçe', A: counts.turkce > 0 ? parseFloat((totals.turkce / counts.turkce).toFixed(1)) : 0, fullMark: 40 },
            { subject: 'Matematik', A: counts.mat > 0 ? parseFloat((totals.mat / counts.mat).toFixed(1)) : 0, fullMark: 40 },
            { subject: 'Fen', A: counts.fen > 0 ? parseFloat((totals.fen / counts.fen).toFixed(1)) : 0, fullMark: 20 },
            { subject: 'Sosyal', A: counts.sosyal > 0 ? parseFloat((totals.sosyal / counts.sosyal).toFixed(1)) : 0, fullMark: 20 },
        ].filter(item => item.A > 0);
    }, [filteredExams]);

    const studentHistoryData = React.useMemo(() => {
        if (!selectedStudent || !exams) return [];
        return exams
            .filter(e => e.student === selectedStudent.student)
            .sort((a, b) => (a.trialId || 0) - (b.trialId || 0))
            .map(e => ({
                name: (trials.find(t => t.id === e.trialId)?.name) || e.name || 'Deneme',
                net: parseFloat(e.totalNet || e.tyt || 0)
            }));
    }, [selectedStudent, exams, trials]);

    const getNet = (val) => val?.net ?? (typeof val === 'number' ? val : 0);
    const getD = (val) => val?.d ?? 0;
    const getY = (val) => val?.y ?? 0;

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';

        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.pdf')) {
            bildir("Lütfen sadece Excel (.xlsx, .xls) veya PDF (.pdf) dosyası yükleyin.", 'uyari');
            return;
        }

        setToast('Dosya analiz ediliyor...');

        try {
            let parsedOutput;
            if (file.name.endsWith('.pdf')) {
                parsedOutput = await parsePdfExamData(file);
            } else {
                parsedOutput = await parseExcelExamData(file);
            }

            const results = Array.isArray(parsedOutput) ? parsedOutput : (parsedOutput.results || []);
            const debugInfo = parsedOutput.debugInfo;
            const detectedType = detectExamType(file.name, results);
            const cleanName = file.name.replace(/\.(xlsx?|pdf)$/i, '').trim();
            const autoName = cleanName.length > 3 && cleanName.length < 60
                ? cleanName
                : `${trials.length + 1}. ${detectedType} Denemesi`;

            // Tarih ve isim girisi için onay formu göster
            setPendingUpload({ file, detectedType, results, debugInfo });
            setManualName(autoName);
            setManualDate(new Date().toISOString().split('T')[0]); // Bugün
            setToast(`✅ ${results.length} öğrenci okundu — tarih ve ismi onaylayın`);
        } catch (error) {
            console.error("Upload Error:", error);
            setToast(hataAnlat(error, 'yukle'));
            bildir(hataAnlat(error, 'yukle'), 'hata');
        }
    };

    const handleConfirmUpload = () => {
        if (!pendingUpload) return;
        const { detectedType, results, debugInfo } = pendingUpload;
        const trialId = Date.now();
        const trialName = manualName.trim() || `${trials.length + 1}. ${detectedType} Denemesi`;
        // Kullanıcının girdiği tarihi kullan, yoksa bugün
        const examDate = manualDate
            ? new Date(manualDate).toISOString()
            : new Date().toISOString();

        const allZero = results.length > 0 && results.every(r => !r.tyt && !r.totalNet && !r.turkce && !r.mat);
        if (allZero && debugInfo) {
            const headerList = debugInfo.headers?.join(', ') || 'Okunamadı';
            bildir(`UYARI: Veriler 0 görünüyor.\nOkunan başlıklar:\n${headerList}`);
        }

        const newTrial = {
            id: trialId,
            name: trialName,
            examType: detectedType,
            date: examDate,
            uploadedAt: new Date().toISOString(),
        };

        const newResults = results.map((res, index) => ({
            ...res,
            id: trialId + index + 1,
            trialId,
            examType: res.examType || detectedType,
            name: trialName,
            date: examDate,
            uploadedAt: newTrial.uploadedAt,
            totalNet: res.totalNet != null ? parseFloat(res.totalNet) :
                (parseFloat(res.tyt || 0) + parseFloat(res.ayt || 0))
        }));

        setTrials(prev => [...prev, newTrial]);
        setExams(prev => [...prev, ...newResults]);
        setPendingUpload(null);
        setManualDate('');
        setManualName('');
        setShowUpload(false);
        setToast(`✅ ${trialName} kaydedildi (${detectedType}, ${newResults.length} öğrenci, ${new Date(examDate).toLocaleDateString('tr-TR')})`);
    };

    const handleDeleteTrial = (trialId) => {
        requireOwnerConfirmation('Denemeyi ve tüm sonuçlarını sil', () => {
            setTrials(prev => prev.filter(t => t.id !== trialId));
            setExams(prev => prev.filter(e => e.trialId !== trialId));
            setToast('Deneme silindi.');
        });
    };


    return (
        <div className="space-y-8 icerik-gecis pb-20">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-ink flex items-center">
                    <BarChart2 className="mr-2 text-c4" size={24}  animationDuration={300} />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-brand">
                        Gelişmiş Deneme Analiz Merkezi
                    </span>
                </h2>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setShowUpload(!showUpload)}
                        className="flex items-center space-x-2 bg-c4 text-white px-4 py-2 rounded-lg hover:bg-c4 transition shadow-lg shadow-purple-200"
                    >
                        <Plus size={18} />
                        <span>Yeni Deneme Yükle</span>
                    </button>
                </div>
            </div>

            {/* ─── GELİŞİM GRAFİKLERİ ─── */}
            {trials.length > 0 && (() => {
                // Denemeler tarihe göre sırala
                const sortedTrials = [...trials].sort((a, b) => new Date(a.date) - new Date(b.date));

                // TYT ve AYT için ayrı sütunlar
                const getNet = (val) => {
                    if (val == null) return 0;
                    if (typeof val === 'object') return parseFloat(val.net ?? 0);
                    return parseFloat(val) || 0;
                };

                const tytTrials = sortedTrials.filter(t => (t.examType || 'TYT') === 'TYT');
                const aytTrials = sortedTrials.filter(t => t.examType === 'AYT');

                const buildChartData = (trialList) => trialList.map(trial => {
                    const trialExams = filteredExams.filter(e => e.trialId === trial.id);
                    if (trialExams.length === 0) return null;
                    const avgTotal = trialExams.reduce((s, r) => s + parseFloat(r.totalNet || r.tyt || 0), 0) / trialExams.length;
                    const avgTurkce = trialExams.reduce((s, r) => s + getNet(r.subjects?.turkce ?? r.turkce), 0) / trialExams.length;
                    const avgMat = trialExams.reduce((s, r) => s + getNet(r.subjects?.mat ?? r.mat), 0) / trialExams.length;
                    const avgFen = trialExams.reduce((s, r) => s + getNet(r.subjects?.fen ?? r.fen), 0) / trialExams.length;
                    const avgSosyal = trialExams.reduce((s, r) => s + getNet(r.subjects?.sosyal ?? r.sosyal), 0) / trialExams.length;
                    return {
                        name: trial.name?.substring(0, 20) || `Deneme`,
                        tarih: trial.date ? new Date(trial.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '',
                        'Ortalama Net': parseFloat(avgTotal.toFixed(1)),
                        'Türkçe': parseFloat(avgTurkce.toFixed(1)),
                        'Matematik': parseFloat(avgMat.toFixed(1)),
                        'Fen': parseFloat(avgFen.toFixed(1)),
                        'Sosyal': parseFloat(avgSosyal.toFixed(1)),
                    };
                }).filter(Boolean);

                const tytData = buildChartData(tytTrials);
                const aytData = buildChartData(aytTrials);

                // Delta (fark) hesapla
                const withDelta = (data) => data.map((d, i) => ({
                    ...d,
                    delta: i === 0 ? 0 : parseFloat((d['Ortalama Net'] - data[i - 1]['Ortalama Net']).toFixed(1))
                }));

                const LINE_COLORS = { 'Ortalama Net': 'var(--c4)', 'Türkçe': 'var(--ok)', 'Matematik': 'var(--info)', 'Fen': 'var(--warn)', 'Sosyal': 'var(--c5)' };

                return (
                    <div className="bg-surface rounded-2xl border border-line shadow-sm p-5 space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <h3 className="font-bold text-ink flex items-center gap-2">
                                <TrendingUp size={18} className="text-c4" />
                                Sınıf Geneli Deneme Gelişim Analizi
                            </h3>
                            <div className="flex gap-2">
                                {[['progress', '📈 Gelişim'], ['delta', 'Δ Fark'], ...(subjectChartData.length > 0 ? [['subject', '🎯 Ders']] : [])].map(([k, lbl]) => (
                                    <button key={k} onClick={() => setChartView(k)}
                                        className={`text-xs px-3 py-1.5 rounded-xl font-bold transition ${chartView === k ? 'bg-c4 text-ink' : 'bg-surface-3 text-ink-2 hover:bg-surface-3'}`}>
                                        {lbl}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {chartView === 'progress' && tytData.length > 0 && (
                            <>
                                <p className="text-xs font-bold text-ink-2 uppercase tracking-wide">TYT — Deneme Bazlı Sınıf Ortalama Net</p>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={tytData} margin={{ left: -10, right: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                                            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                                            {['Ortalama Net', 'Türkçe', 'Matematik', 'Fen', 'Sosyal'].map(key => (
                                                <Line key={key} type="monotone" dataKey={key}
                                                    stroke={LINE_COLORS[key]} strokeWidth={key === 'Ortalama Net' ? 3 : 1.5}
                                                    dot={{ r: key === 'Ortalama Net' ? 5 : 3 }} activeDot={{ r: 7 }}
                                                    strokeDasharray={key === 'Ortalama Net' ? undefined : '4 3'}  animationDuration={300} />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                {aytData.length > 0 && (
                                    <>
                                        <p className="text-xs font-bold text-ink-2 uppercase tracking-wide mt-4">AYT — Deneme Bazlı Sınıf Ortalama Net</p>
                                        <div className="h-48">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={aytData} margin={{ left: -10, right: 10 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                                                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                                                    <Line type="monotone" dataKey="Ortalama Net" stroke="var(--c4)" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }}  animationDuration={300} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        {chartView === 'delta' && (
                            <>
                                {tytData.length > 1 ? (
                                    <>
                                        <p className="text-xs font-bold text-ink-2 uppercase tracking-wide">TYT — Denemeler Arası Ortalama Net Değişimi (Δ)</p>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={withDelta(tytData).slice(1)} margin={{ left: -10, right: 10 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                                                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                                    <RechartsTooltip
                                                        formatter={(val) => [val > 0 ? `+${val}` : val, 'Δ Net']}
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    />
                                                    <ReferenceLine y={0} stroke="var(--line)" strokeWidth={2} />
                                                    <Bar dataKey="delta" name="Değişim" radius={[6, 6, 0, 0]}
                                                        fill="var(--c4)"
                                                        label={{
                                                            position: 'top', fontSize: 11, fontWeight: 'bold',
                                                            formatter: (v) => v > 0 ? `+${v}` : v
                                                        }}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        {/* Tablo */}
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-xs">
                                                <thead><tr className="bg-surface-2">
                                                    <th className="px-3 py-2 text-left font-bold text-ink-2">Deneme</th>
                                                    <th className="px-3 py-2 text-center text-ink-2">Tarih</th>
                                                    <th className="px-3 py-2 text-center font-bold text-c4">Ort. Net</th>
                                                    <th className="px-3 py-2 text-center text-ok">Türkçe</th>
                                                    <th className="px-3 py-2 text-center text-info">Matematik</th>
                                                    <th className="px-3 py-2 text-center text-warn">Fen</th>
                                                    <th className="px-3 py-2 text-center text-c5">Sosyal</th>
                                                    <th className="px-3 py-2 text-center font-bold text-ink-2">Δ</th>
                                                </tr></thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {withDelta(tytData).map((row, i) => (
                                                        <tr key={i} className="hover:bg-surface-2">
                                                            <td className="px-3 py-2 font-medium text-ink-2 max-w-[130px] truncate">{row.name}</td>
                                                            <td className="px-3 py-2 text-center text-ink-3">{row.tarih}</td>
                                                            <td className="px-3 py-2 text-center font-black text-c4">{row['Ortalama Net']}</td>
                                                            <td className="px-3 py-2 text-center text-ok">{row['Türkçe']}</td>
                                                            <td className="px-3 py-2 text-center text-info">{row['Matematik']}</td>
                                                            <td className="px-3 py-2 text-center text-warn">{row['Fen']}</td>
                                                            <td className="px-3 py-2 text-center text-c5">{row['Sosyal']}</td>
                                                            <td className={`px-3 py-2 text-center font-black ${row.delta > 0 ? 'text-ok' : row.delta < 0 ? 'text-danger' : 'text-ink-3'}`}>
                                                                {i === 0 ? '—' : (row.delta > 0 ? '+' : '') + row.delta}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-center text-ink-3 text-sm py-6">Delta için en az 2 TYT denemesi gerekiyor.</p>
                                )}
                            </>
                        )}

                        {chartView === 'subject' && subjectChartData.length > 0 && (
                            <div className="h-64 md:h-80 w-full relative" style={{ minHeight: '256px' }}>
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={subjectChartData}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 40]} tick={false} axisLine={false} />
                                        <Radar name="Sınıf Ortalaması" dataKey="A" stroke="var(--c4)" fill="var(--c4)" fillOpacity={0.5}  animationDuration={300} />
                                        <RechartsTooltip />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                );
            })()}


            {/* AI Stratejik Gözlem Paneli (Görsel Şema) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="on-color lg:col-span-2 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-surface/10 rounded-2xl backdrop-blur-md">
                                <Activity className="text-brand" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight">AI STRATEJİK GÖZLEM</h3>
                                <p className="text-[10px] text-brand font-bold uppercase tracking-widest">Sınıf Bilişsel Haritası</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                        { subject: 'Türkçe', A: exams.reduce((s, r) => s + (parseFloat(r.subjects?.tyt_turkce?.net || r.turkce) || 0), 0) / (exams.length || 1), fullMark: 40 },
                                        { subject: 'Mat.', A: exams.reduce((s, r) => s + (parseFloat(r.subjects?.tyt_mat_toplam?.net || r.mat) || 0), 0) / (exams.length || 1), fullMark: 40 },
                                        { subject: 'Fen', A: exams.reduce((s, r) => s + (parseFloat(r.subjects?.tyt_fen_toplam?.net || r.fen) || 0), 0) / (exams.length || 1), fullMark: 20 },
                                        { subject: 'Sosyal', A: exams.reduce((s, r) => s + (parseFloat(r.subjects?.tyt_sosyal_toplam?.net || r.sosyal) || 0), 0) / (exams.length || 1), fullMark: 20 },
                                    ]}>
                                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#818cf8', fontSize: 10, fontWeight: 'bold' }} />
                                        <Radar name="Sınıf" dataKey="A" stroke="#818cf8" fill="#818cf8" fillOpacity={0.6}  animationDuration={300} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-surface/5 rounded-2xl border border-line backdrop-blur-sm">
                                    <div className="flex items-center gap-2 mb-2 text-ok text-[10px] font-black uppercase">
                                        <Target size={14} /> Güçlü Alan
                                    </div>
                                    <p className="text-xs text-ink-3">Sınıf genelinde Türkçe okuma anlama hızı beklentilerin %12 üzerinde.</p>
                                </div>
                                <div className="p-4 bg-surface/5 rounded-2xl border border-line backdrop-blur-sm">
                                    <div className="flex items-center gap-2 mb-2 text-warn text-[10px] font-black uppercase">
                                        <AlertCircle size={14} /> Gelişim Alanı
                                    </div>
                                    <p className="text-xs text-ink-3">Matematik temel işlem hataları son 2 denemede artış gösterdi.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-surface dark:bg-surface-inv rounded-[2.5rem] p-8 shadow-xl border border-line dark:border-line-2">
                    <h3 className="text-sm font-black text-ink dark:text-ink mb-6 uppercase tracking-widest flex items-center gap-2">
                        <Users className="text-brand" size={18} /> Veri Senkronizasyonu
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-surface-2 dark:bg-surface-inv rounded-xl">
                            <span className="text-xs font-bold text-ink-2">Kayıtlı Öğrenci</span>
                            <span className="text-sm font-black text-ink dark:text-ink">{students.length}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-surface-2 dark:bg-surface-inv rounded-xl">
                            <span className="text-xs font-bold text-ink-2">Deneme Verisi</span>
                            <span className="text-sm font-black text-ink dark:text-ink">{exams.length} Sonuç</span>
                        </div>
                        {/* Eksik öğrenci kontrolü */}
                        {(() => {
                            const resultNames = new Set(exams.map(r => normalizeName(r.student || r.name)));
                            const studentNames = new Set(students.map(s => normalizeName(s.name)));
                            const missing = [...resultNames].filter(n => !studentNames.has(n));
                            if (missing.length > 0) {
                                return (
                                    <div className="p-4 bg-warn-soft border border-warn rounded-2xl mt-4">
                                        <div className="flex items-center gap-2 text-warn text-[10px] font-black mb-1">
                                            <AlertCircle size={14} /> DİKKAT: EKSİK ÖĞRENCİ
                                        </div>
                                        <p className="text-[10px] text-warn font-medium">
                                            Denemelerde adı geçen ama listede olmayan {missing.length} öğrenci var. (Örn: {missing[0]})
                                        </p>
                                    </div>
                                );
                            }
                            return (
                                <div className="p-4 bg-ok-soft border border-ok rounded-2xl mt-4 flex items-center gap-3">
                                    <CheckCircle size={20} className="text-ok" />
                                    <span className="text-[10px] text-ok font-black uppercase">Tüm veriler eşleşti</span>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface p-4 rounded-xl border border-line shadow-sm text-center">
                    <div className="text-xs text-ink-2 font-bold uppercase mb-1">Toplam Deneme</div>
                    <div className="text-2xl font-bold text-ink">{trials.length}</div>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-line shadow-sm text-center">
                    <div className="text-xs text-ink-2 font-bold uppercase mb-1">İncelenen Öğrenci</div>
                    <div className="text-2xl font-bold text-brand">{exams.length}</div>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-line shadow-sm text-center">
                    <div className="text-xs text-ink-2 font-bold uppercase mb-1">En Yüksek (TYT)</div>
                    <div className="text-2xl font-bold text-ok">{Math.max(0, ...exams.map(e => e.tyt)).toFixed(1)}</div>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-line shadow-sm text-center">
                    <div className="text-xs text-ink-2 font-bold uppercase mb-1">Son Deneme Ort.</div>
                    <div className="text-2xl font-bold text-c4">
                        {progressChartData.length > 0 ? progressChartData[progressChartData.length - 1].ortalama : '-'}
                    </div>
                </div>
            </div>


            {/* ─── UPLOAD FORMU ─── */}
            {showUpload && (
                <div className="bg-surface rounded-2xl p-6 border-2 border-[color-mix(in_srgb,var(--c4)_35%,transparent)] shadow-sm icerik-gecis">
                    <h3 className="font-bold text-ink mb-4 flex items-center gap-2">
                        <Upload size={18} className="text-c4" /> Yeni Deneme Yüklendi
                    </h3>

                    {/* Adım 1: Dosya sec */}
                    {!pendingUpload && (
                        <>
                            <label className="border-2 border-dashed border-[color-mix(in_srgb,var(--c4)_35%,transparent)] rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] transition w-full block">
                                <Upload size={48} className="text-c4 mb-4" />
                                <p className="text-ink font-bold">Excel veya PDF Yükle</p>
                                <p className="text-xs text-ink-3 mt-1">Sistem Ad, Türkçe, Mat, Fen, Sosyal sütunlarını otomatik tanır. Tyt/Ayt otomatik algılanır.</p>
                                <input type="file" className="hidden" accept=".xlsx,.xls,.pdf" onChange={handleFileUpload} />
                            </label>
                            <button onClick={() => setShowUpload(false)} className="mt-3 text-sm text-ink-3 hover:text-ink-2 w-full text-center">Vazgeç</button>
                        </>
                    )}

                    {/* Adım 2: Tarih + İsim onay */}
                    {pendingUpload && (
                        <div className="space-y-4">
                            <div className="bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] rounded-xl p-3 text-sm text-c4 font-medium">
                                ✅ <strong>{pendingUpload.results.length}</strong> öğrenci okundu — tip: <strong>{pendingUpload.detectedType}</strong>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-ink-2 mb-1">Deneme Adı</label>
                                    <input
                                        type="text"
                                        value={manualName}
                                        onChange={e => setManualName(e.target.value)}
                                        placeholder="Örn: 1. TYT Denemesi"
                                        className="w-full border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-ink-2 mb-1">Deneme Tarihi</label>
                                    <input
                                        type="date"
                                        value={manualDate}
                                        onChange={e => setManualDate(e.target.value)}
                                        className="w-full border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                </div>
                            </div>
                            <div className="pencere-alt-cubuk bg-surface flex gap-3">
                                <button
                                    onClick={handleConfirmUpload}
                                    className="flex-1 bg-c4 text-white py-2.5 rounded-xl font-bold hover:bg-c4 transition"
                                >
                                    ✅ Kaydet
                                </button>
                                <button
                                    onClick={() => { setPendingUpload(null); setShowUpload(false); }}
                                    className="px-4 py-2.5 border border-line rounded-xl text-sm text-ink-2 hover:bg-surface-2 transition"
                                >
                                    İptal
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}


            {/* Trials List Accordion */}
            <div className="space-y-4">
                {/* 🔍 Öğrenci Arama Kutusu */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h3 className="font-bold text-ink ml-1">Deneme Arşivi</h3>
                    <div className="relative">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
                        <input
                            type="text"
                            placeholder="Öğrenci ismi ile ara..."
                            value={studentSearchQuery}
                            onChange={(e) => setStudentSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 text-sm border border-line rounded-xl focus:ring-2 focus:ring-purple-400 outline-none w-56 bg-surface shadow-sm"
                        />
                        {studentSearchQuery && (
                            <button
                                onClick={() => setStudentSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-2"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
                {trials.length === 0 && <p className="text-ink-3 text-center py-8">Henüz analiz edilmiş veri yok.</p>}

                {trials.slice().reverse().map((trial) => (
                    <div key={trial.id} className="bg-surface rounded-xl border border-line overflow-hidden shadow-sm transition hover:border-[color-mix(in_srgb,var(--c4)_35%,transparent)]">
                        <div
                            className="p-4 bg-surface-2 flex justify-between items-center cursor-pointer hover:bg-surface-3 transition"
                            onClick={() => setExpandedTrialId(expandedTrialId === trial.id ? null : trial.id)}
                        >
                            <div className="flex items-center">
                                <div className={`mr-3 transition-transform duration-yavas ${expandedTrialId === trial.id ? 'rotate-180' : ''}`}>
                                    <ChevronDown size={20} className="text-ink-3" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-ink flex items-center">
                                        {trial.name}
                                        {trial.examType && (
                                            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full font-bold ${trial.examType === 'AYT' ? 'bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] text-c4' :
                                                trial.examType === 'KAZ' ? 'bg-warn-soft text-warn' :
                                                    'bg-info-soft text-info'
                                                }`}>{trial.examType}</span>
                                        )}
                                        {expandedTrialId === trial.id && <span className="ml-2 px-2 py-0.5 text-xs bg-ok-soft text-ok rounded-full">Açık</span>}
                                    </h4>
                                    <p className="text-xs text-ink-2">
                                        {trial.date ? new Date(trial.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                                        {trial.fileName ? ` • ${trial.fileName}` : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className="bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] text-c4 text-xs font-bold px-3 py-1 rounded-full">
                                    {exams.filter(e => e.trialId === trial.id).length} Sonuç
                                </span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteTrial(trial.id); }}
                                    className="text-danger hover:text-danger p-2 hover:bg-danger-soft rounded-full transition"
                                    title="Denemeyi Sil"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Collapsible Content */}
                        {expandedTrialId === trial.id && (
                            <div className="overflow-x-auto border-t border-line icerik-gecis">
                                <table className="min-w-full divide-y divide-line">
                                    <thead className="bg-surface">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-ink-2">Öğrenci</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-ink-2">TYT Toplam</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-ink-2 hidden md:table-cell">Tr</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-ink-2 hidden md:table-cell">Mat</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-ink-2 hidden md:table-cell">Fen</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-ink-2 hidden md:table-cell">Sos</th>
                                            <th className="px-4 py-2 text-right text-xs font-semibold text-ink-2">Detay</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 text-sm">
                                        {exams.filter(e => {
                                            if (e.trialId !== trial.id) return false;
                                            if (!studentSearchQuery) return true;
                                            const q = studentSearchQuery.toLowerCase().replace(/[İI]/g,'i').replace(/[ıI]/g,'i');
                                            const name = (e.student || '').toLowerCase().replace(/[İI]/g,'i').replace(/[ıI]/g,'i');
                                            return name.includes(q);
                                        }).map((result) => (
                                            <tr key={result.id} className="hover:bg-surface-2 group cursor-pointer" onClick={() => setSelectedStudent(result)}>
                                                <td className="px-4 py-2 font-medium text-ink group-hover:text-brand">{result.student}</td>
                                                <td className="px-4 py-2 text-brand font-bold">{result.tyt}</td>
                                                {/* Optional safe access in case fields missing - Using Helper */}
                                                <td className="px-4 py-2 text-ink-2 hidden md:table-cell">{getNet(result.subjects?.turkce).toFixed(1)}</td>
                                                <td className="px-4 py-2 text-ink-2 hidden md:table-cell">{getNet(result.subjects?.mat).toFixed(1)}</td>
                                                <td className="px-4 py-2 text-ink-2 hidden md:table-cell">{getNet(result.subjects?.fen).toFixed(1)}</td>
                                                <td className="px-4 py-2 text-ink-2 hidden md:table-cell">{getNet(result.subjects?.sosyal).toFixed(1)}</td>
                                                <td className="px-4 py-2 text-right">
                                                    <button className="text-xs bg-brand-soft text-brand px-2 py-1 rounded hover:bg-brand-soft">
                                                        Karne
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {studentSearchQuery && (() => {
                                            const cnt = exams.filter(e => {
                                                if (e.trialId !== trial.id) return false;
                                                const q = studentSearchQuery.toLowerCase().replace(/[İI]/g,'i').replace(/[ıI]/g,'i');
                                                const nm = (e.student || '').toLowerCase().replace(/[İI]/g,'i').replace(/[ıI]/g,'i');
                                                return nm.includes(q);
                                            }).length;
                                            if (cnt > 0) return null;
                                            return <tr><td colSpan={7} className="px-4 py-6 text-center text-ink-3 text-sm">"{studentSearchQuery}" ile eşleşen öğrenci bulunamadı.</td></tr>;
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Student Detail Modal */}
            {selectedStudent && (
                <Modal
                    acik
                    onClose={() => setSelectedStudent(null)}
                    baslikGizle
                    genislik="xl"
                    govdeClassName="p-0 flex flex-col overflow-hidden"
                >
                    <div className="p-6 border-b border-line flex justify-between items-center shrink-0 bg-surface">
                        <div>
                            <h3 className="text-xl font-bold text-ink">{selectedStudent.student}</h3>
                            <p className="text-sm text-ink-2">{selectedStudent.name} Sonuç Karnesi</p>
                        </div>
                        <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-surface-3 rounded-full">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-8">
                        {/* Metadata Section (Personal Info) */}
                        {selectedStudent.metadata && Object.keys(selectedStudent.metadata).length > 0 && (
                            <div className="bg-surface-2 p-4 rounded-xl border border-line icerik-gecis">
                                <h4 className="font-bold text-ink-2 mb-3 flex items-center text-sm uppercase tracking-wide">
                                    <Users size={16} className="mr-2 text-brand" />
                                    Öğrenci Bilgileri
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-6 text-sm">
                                    {Object.entries(selectedStudent.metadata).map(([key, val]) => (
                                        <div key={key} className="border-l-2 border-brand-line pl-3">
                                            <span className="block text-ink-3 text-xs font-semibold uppercase mb-0.5">{key}</span>
                                            <span className="font-bold text-ink">{val}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Key Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-brand-soft p-4 rounded-xl text-center">
                                <div className="text-xs text-brand font-medium uppercase">TYT Toplam</div>
                                <div className="text-3xl font-bold text-brand">{selectedStudent.tyt}</div>
                            </div>
                            <div className="bg-ok-soft p-4 rounded-xl text-center">
                                <div className="text-xs text-ok font-medium uppercase">Genel Sıralama</div>
                                <div className="text-3xl font-bold text-ok">#{selectedStudent.rank}</div>
                            </div>
                            <div className="bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] p-4 rounded-xl text-center">
                                <div className="text-xs text-c4 font-medium uppercase">Katılım</div>
                                <div className="text-3xl font-bold text-c4">{studentHistoryData.length}</div>
                                <div className="text-xs text-c4">Deneme</div>
                            </div>
                            <div className="bg-warn-soft p-4 rounded-xl text-center">
                                <div className="text-xs text-warn font-medium uppercase">Net Ortalaması</div>
                                <div className="text-3xl font-bold text-warn">
                                    {(studentHistoryData.reduce((a, b) => a + b.tyt, 0) / (studentHistoryData.length || 1)).toFixed(1)}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* D/Y/N Table */}
                            <div>
                                <h4 className="font-bold text-ink-2 mb-4 flex items-center">
                                    <ClipboardList size={18} className="mr-2 text-brand" />
                                    Detaylı Net Analizi
                                </h4>
                                <div className="overflow-hidden rounded-xl border border-line">
                                    <table className="min-w-full divide-y divide-line">
                                        <thead className="bg-surface-2">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-ink-2">Ders</th>
                                                <th className="px-4 py-2 text-center text-xs font-semibold text-ok">Doğru</th>
                                                <th className="px-4 py-2 text-center text-xs font-semibold text-danger">Yanlış</th>
                                                <th className="px-4 py-2 text-center text-xs font-semibold text-brand">Net</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-line bg-surface text-sm">
                                            {[
                                                { name: 'Türkçe', key: 'turkce' },
                                                { name: 'Matematik', key: 'mat' },
                                                { name: 'Fen Bilimleri', key: 'fen' },
                                                { name: 'Sosyal Bil.', key: 'sosyal' }
                                            ].map((subject) => {
                                                const data = selectedStudent.subjects?.[subject.key];
                                                return (
                                                    <tr key={subject.key} className="hover:bg-surface-2">
                                                        <td className="px-4 py-3 font-medium text-ink">{subject.name}</td>
                                                        <td className="px-4 py-3 text-center text-ok font-bold">{getD(data)}</td>
                                                        <td className="px-4 py-3 text-center text-danger">{getY(data)}</td>
                                                        <td className="px-4 py-3 text-center font-bold text-brand">{getNet(data).toFixed(2)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Radar Chart */}
                            <div>
                                <h4 className="font-bold text-ink-2 mb-4 flex items-center">
                                    <Activity size={18} className="mr-2 text-c4" />
                                    Başarı Dağılımı
                                </h4>
                                <div className="h-64 w-full bg-surface-2 rounded-xl relative" style={{ minHeight: '256px' }}>
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                                            { subject: 'Türkçe', A: getNet(selectedStudent.subjects?.turkce), fullMark: 40 },
                                            { subject: 'Matematik', A: getNet(selectedStudent.subjects?.mat), fullMark: 40 },
                                            { subject: 'Fen', A: getNet(selectedStudent.subjects?.fen), fullMark: 20 },
                                            { subject: 'Sosyal', A: getNet(selectedStudent.subjects?.sosyal), fullMark: 20 },
                                        ]}>
                                            <PolarGrid />
                                            <PolarAngleAxis dataKey="subject" />
                                            <PolarRadiusAxis angle={30} domain={[0, 40]} />
                                            <Radar name={selectedStudent.student} dataKey="A" stroke="var(--brand)" fill="var(--brand)" fillOpacity={0.5}  animationDuration={300} />
                                            <RechartsTooltip />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* History Line Chart */}
                        <div>
                            <h4 className="font-bold text-ink-2 mb-4 flex items-center">
                                <TrendingUp size={18} className="mr-2 text-info" />
                                Gelişim Grafiği (Tüm Denemeler)
                            </h4>
                            <div className="h-64 w-full bg-surface border border-line rounded-xl p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={studentHistoryData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                        <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} />
                                        <RechartsTooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="tyt"
                                            stroke="var(--brand)"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: 'var(--brand)', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 6 }}
                                         animationDuration={300} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>
                </Modal>
            )}
        </div>
    );
};

// ── İzin Düzenleme Modalı ────────────────────────────────────────────────────
const PermissionEditModal = ({ coach, onClose, onSave }) => {
    const [role, setRole] = useState(coach.coachRole || 'subCoach');
    const [perms, setPerms] = useState(coach.permissions || []);

    const toggle = (tabId) => setPerms(p =>
        p.includes(tabId) ? p.filter(x => x !== tabId) : [...p, tabId]
    );

    return (
        <Modal
            acik
            onClose={onClose}
            baslikGizle
            genislik="md"
            govdeClassName="p-0 flex flex-col overflow-hidden"
        >
            <div className="on-color bg-gradient-to-r from-slate-700 to-indigo-700 px-6 py-4 shrink-0 flex justify-between items-center">
                <div>
                    <h3 className="text-ink font-bold text-base flex items-center gap-2">
                        <Settings size={16} /> {coach.name} — İzin Düzenle
                    </h3>
                    <p className="text-brand text-xs mt-0.5">Koçun erişebileceği sekmeleri belirleyin</p>
                </div>
                <button onClick={onClose} className="text-ink-2 hover:text-ink"><X size={20} /></button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
                <div>
                    <label className="block text-xs font-bold text-ink-2 mb-2">Rol</label>
                    <div className="flex gap-3">
                        <label className={`flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition text-sm font-medium ${role === 'subCoach' ? 'bg-info-soft border-blue-400 text-info' : 'bg-surface-2 border-line text-ink-2'}`}>
                            <input type="radio" name="role" value="subCoach" checked={role === 'subCoach'} onChange={() => setRole('subCoach')} className="accent-blue-600" />
                            Standart Koç
                        </label>
                        <label className={`flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition text-sm font-medium ${role === 'masterCoach' ? 'bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] border-purple-400 text-c4' : 'bg-surface-2 border-line text-ink-2'}`}>
                            <input type="radio" name="role" value="masterCoach" checked={role === 'masterCoach'} onChange={() => setRole('masterCoach')} className="accent-purple-600" />
                            Yönetici Koç
                        </label>
                    </div>
                </div>
                {role === 'subCoach' && (
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-ink-2">Sekme İzinleri</label>
                            <div className="flex gap-2">
                                <button onClick={() => setPerms(PERM_ALL_TABS.map(t => t.id))} className="text-xs text-brand hover:underline">Tümünü Seç</button>
                                <span className="text-ink-3">|</span>
                                <button onClick={() => setPerms([])} className="text-xs text-danger hover:underline">Temizle</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                            {PERM_ALL_TABS.map(tab => (
                                <label key={tab.id} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition text-xs font-medium ${perms.includes(tab.id) ? 'bg-brand-soft border-brand-line text-brand' : 'bg-surface-2 border-line text-ink-2 hover:bg-surface-3'}`}>
                                    <input type="checkbox" checked={perms.includes(tab.id)} onChange={() => toggle(tab.id)} className="accent-indigo-600" />
                                    {tab.label}
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-ink-3 mt-2">{perms.length} / {PERM_ALL_TABS.length} sekme seçili</p>
                    </div>
                )}
                {role === 'masterCoach' && (
                    <div className="bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] border border-[color-mix(in_srgb,var(--c4)_35%,transparent)] rounded-xl p-3 text-xs text-c4 flex items-start gap-2">
                        <Shield size={14} className="flex-shrink-0 mt-0.5" />
                        <span>Yönetici koç tüm sekmelere otomatik olarak erişebilir.</span>
                    </div>
                )}
                <div className="pencere-alt-cubuk bg-surface flex gap-3 pt-2">
                    <button onClick={onClose} className="flex-1 border border-line text-ink-2 py-2.5 rounded-xl font-semibold hover:bg-surface-2 transition text-sm">İptal</button>
                    <button
                        onClick={() => onSave(coach.id, role === 'masterCoach' ? PERM_ALL_TABS.map(t => t.id) : perms, role)}
                        className="on-color flex-1 bg-gradient-to-r from-brand to-violet-600 text-white py-2.5 rounded-xl font-bold hover:from-indigo-700 hover:to-violet-700 transition shadow-lg text-sm"
                    >
                        Kaydet
                    </button>
                </div>
            </div>
        </Modal>
    );
};

/**
 * Koça izin verilebilecek sekmeler.
 *
 * ⚠️ Bu liste üst navigasyondaki GERÇEK sekmelerle birebir aynı olmalı.
 * Sekmeler birleştirildikten sonra burası güncellenmemişti; koça
 * "Analytics" veya "PDR İş Akışı" izni veriliyor ama böyle bir üst sekme
 * artık yok, dolayısıyla izin hiçbir işe yaramıyordu.
 */
const PERM_ALL_TABS = [
    { id: 'analysis', label: 'Analiz Merkezi', hint: 'Özet, risk, sıralama, hedefler, grafikler' },
    { id: 'exams', label: 'Deneme Sonuçları', hint: 'Deneme yükleme ve analiz' },
    { id: 'programs', label: 'Ders Programları', hint: 'Program oluşturma ve takip' },
    { id: 'guidance', label: 'Rehberlik Merkezi', hint: 'Testler, sosyometri, PDR, BEP' },
    { id: 'groups', label: 'Öğrenci Grupları' },
    { id: 'whatsapp', label: 'WhatsApp Merkezi' },
    { id: 'material', label: 'Materyal Üretimi' },
    { id: 'projects', label: 'Projeler' },
    { id: 'teacher-scheduler', label: 'Öğretmen Programı' },
    { id: 'university-scores', label: 'Taban Puanlar' },
    { id: 'appointments', label: 'Randevular' },
];
const ALL_TABS = PERM_ALL_TABS;

const ManageCoachesTab = ({ setToast }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingCoach, setEditingCoach] = useState(null);    // izin modalı
    const [detailCoach, setDetailCoach] = useState(null);      // düzenleme modalı
    const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', coachRole: 'subCoach', permissions: ['analysis', 'exams'], sections: ['kocluk'] });

    const [coaches, setCoaches] = useState(() => {
        try { return JSON.parse(localStorage.getItem('managed_coaches') || '[]'); } catch { return []; }
    });

    const saveCoaches = (list) => {
        setCoaches(list);
        localStorage.setItem('managed_coaches', JSON.stringify(list));
        try {
            window.dispatchEvent(new StorageEvent('storage', { key: 'managed_coaches' }));
            window.firebaseSync?.syncKey?.('managed_coaches');
        } catch { /* senkron yoksa sorun değil */ }
    };

    /**
     * Koç kaydının giriş tarafındaki karşılığını (users_db) günceller.
     * Bu iki depo ayrı tutulduğu için: eklenen koç giriş yapamıyor,
     * silinen koç giriş yapmaya devam ediyor, yetki değişikliği
     * bir sonraki girişte uygulanmıyordu.
     */
    const syncCoachToUsers = (phone, patch) => {
        try {
            const users = safeParse('users_db', []);
            const next = patch === null
                ? users.filter(u => u.phone !== phone)
                : users.map(u => (u.phone === phone ? { ...u, ...patch } : u));
            localStorage.setItem('users_db', JSON.stringify(next));
            window.dispatchEvent(new StorageEvent('storage', { key: 'users_db' }));
            window.firebaseSync?.syncKey?.('users_db');
        } catch { /* ignore */ }
    };

    const handleDeleteCoach = async (id) => {
        const coach = coaches.find(c => c.id === id);
        if (await onayla({ mesaj: `${coach?.name || 'Bu koç'} silinecek ve sisteme girişi kapanacak. Emin misiniz?`, tehlikeli: true })) {
            saveCoaches(coaches.filter(c => c.id !== id));
            if (coach?.phone) syncCoachToUsers(coach.phone, null);
            setToast('Koç kaydı ve giriş yetkisi kaldırıldı.');
        }
    };

    const handleSavePermissions = (coachId, newPermissions, newRole) => {
        const coach = coaches.find(c => c.id === coachId);
        const updated = coaches.map(c =>
            c.id === coachId ? { ...c, permissions: newPermissions, coachRole: newRole } : c
        );
        saveCoaches(updated);
        if (coach?.phone) syncCoachToUsers(coach.phone, { permissions: newPermissions, coachRole: newRole });
        setEditingCoach(null);
        setToast('Koç yetkileri güncellendi.');
    };

    const handleSaveCoachDetail = (coachId, updatedFields) => {
        const coach = coaches.find(c => c.id === coachId);
        const updated = coaches.map(c =>
            c.id === coachId ? { ...c, ...updatedFields } : c
        );
        saveCoaches(updated);
        if (coach?.phone) {
            // Telefon değiştiyse eski kaydı güncelle
            syncCoachToUsers(coach.phone, {
                name: updatedFields.name ?? coach.name,
                email: updatedFields.email ?? coach.email,
                phone: updatedFields.phone ?? coach.phone,
            });
        }
        setDetailCoach(null);
        setToast('Koç bilgileri güncellendi.');
    };

    const handleAddCoach = () => {
        if (!addForm.name.trim() || !addForm.email.trim()) { bildir('Ad ve e-posta zorunludur.'); return; }
        if (!addForm.phone.trim()) { bildir('Telefon zorunludur — koç sisteme telefonuyla giriş yapar.'); return; }

        const phone = addForm.phone.trim();

        // Aynı telefonla ikinci kayıt olmasın
        const existingUsers = safeParse('users_db', []);
        if (existingUsers.some(u => u.phone === phone)) {
            bildir('Bu telefon numarası zaten kayıtlı.');
            return;
        }

        const id = Date.now();
        const permissions = addForm.coachRole === 'masterCoach'
            ? ALL_TABS.map(t => t.id)
            : addForm.permissions;

        const newCoach = {
            id,
            name: addForm.name.trim(),
            email: addForm.email.trim(),
            phone,
            coachRole: addForm.coachRole,
            permissions,
            // Ana koç her iki bölümde de çalışır; alt koç seçilen bölümlerde
            sections: addForm.coachRole === 'masterCoach' ? ['kocluk', 'pdr'] : (addForm.sections || ['kocluk']),
            status: 'Aktif',
            addedAt: new Date().toISOString(),
        };

        saveCoaches([...coaches, newCoach]);

        // ⚠️ Koç yalnızca managed_coaches'a yazılıyordu; giriş akışı users_db'yi
        // okuduğu için eklenen koç sisteme GİRİŞ YAPAMIYORDU
        // ("Bu telefon numarasına ait koç kaydı bulunamadı").
        const userRecord = {
            id: String(id),
            name: newCoach.name,
            email: newCoach.email,
            phone,
            role: 'coach',
            coachRole: newCoach.coachRole,
            permissions,
            sections: newCoach.sections,
            approved: true,
            schoolName: 'Şamran Anadolu Lisesi',
            createdAt: new Date().toISOString(),
        };
        localStorage.setItem('users_db', JSON.stringify([...existingUsers, userRecord]));
        try {
            window.dispatchEvent(new StorageEvent('storage', { key: 'users_db' }));
            window.firebaseSync?.syncKey?.('users_db');
        } catch { /* senkron yoksa sorun değil */ }

        setIsAddModalOpen(false);
        setAddForm({ name: '', email: '', phone: '', coachRole: 'subCoach', permissions: ['analysis', 'exams'], sections: ['kocluk'] });
        setToast(`${newCoach.name} eklendi. Giriş: ${phone} + okul adı`);
    };

    const toggleAddPermission = (tabId) => {
        setAddForm(prev => ({
            ...prev,
            permissions: prev.permissions.includes(tabId)
                ? prev.permissions.filter(p => p !== tabId)
                : [...prev.permissions, tabId]
        }));
    };

    return (
        <div className="space-y-6 icerik-gecis">
            {/* Header */}
            <div className="on-color bg-gradient-to-r from-slate-800 to-indigo-900 text-white p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center">
                        <Shield className="mr-3" size={24} />
                        Koç Yönetim Paneli
                    </h2>
                    <p className="mt-1 text-sm opacity-80">Koçlara sekme bazlı izin atayın. Her koç sadece yetkili olduğu sekmeleri görür.</p>
                </div>
                <button onClick={() => setIsAddModalOpen(true)} className="b b-line b-brand">
                    <Plus size={18} />
                    Yeni Koç Ekle
                </button>
            </div>

            {/* Coach List */}
            <div className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden">
                {coaches.length === 0 ? (
                    <div className="text-center py-16">
                        <Shield size={40} className="mx-auto text-ink-3 mb-3" />
                        <p className="text-ink-3 font-medium">Henüz koç eklenmedi</p>
                        <p className="text-ink-3 text-sm mt-1">Ana koç olarak tüm yetkilere sahipsiniz</p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-line">
                        <thead>
                            <tr className="bg-surface-2">
                                <th className="px-5 py-3 text-left text-xs font-bold text-ink-2 uppercase">Koç</th>
                                <th className="px-5 py-3 text-left text-xs font-bold text-ink-2 uppercase hidden md:table-cell">Telefon</th>
                                <th className="px-5 py-3 text-left text-xs font-bold text-ink-2 uppercase">Rol</th>
                                <th className="px-5 py-3 text-left text-xs font-bold text-ink-2 uppercase hidden lg:table-cell">İzinler</th>
                                <th className="px-5 py-3 text-right text-xs font-bold text-ink-2 uppercase">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {coaches.map(coach => (
                                <tr
                                    key={coach.id}
                                    className="hover:bg-brand-soft/40 transition cursor-pointer"
                                    onClick={() => setDetailCoach(coach)}
                                >
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="on-color w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-ink font-bold text-sm shadow-sm">
                                                {coach.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-ink text-sm">{coach.name}</p>
                                                <p className="text-xs text-ink-3">{coach.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 hidden md:table-cell">
                                        <span className="text-sm text-ink-2">{coach.phone || <span className="text-ink-3 italic text-xs">Girilmemiş</span>}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${coach.coachRole === 'masterCoach' ? 'bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] text-c4' : 'bg-info-soft text-info'}`}>
                                            {coach.coachRole === 'masterCoach' ? 'Yönetici Koç' : 'Standart Koç'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 hidden lg:table-cell">
                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                            {coach.coachRole === 'masterCoach' ? (
                                                <span className="text-xs bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] text-c4 px-2 py-0.5 rounded-full font-semibold">Tüm Yetkiler</span>
                                            ) : (
                                                (coach.permissions || []).slice(0, 3).map(p => {
                                                    const tab = ALL_TABS.find(t => t.id === p);
                                                    return tab ? <span key={p} className="text-xs bg-surface-3 text-ink-2 px-2 py-0.5 rounded-full">{tab.label}</span> : null;
                                                })
                                            )}
                                            {coach.coachRole !== 'masterCoach' && (coach.permissions || []).length > 3 && (
                                                <span className="text-xs bg-surface-3 text-ink-2 px-2 py-0.5 rounded-full">+{coach.permissions.length - 3}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setDetailCoach(coach); }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-brand-soft text-brand hover:bg-brand-soft rounded-lg font-semibold transition"
                                                title="Bilgileri Düzenle"
                                            >
                                                <Edit2 size={12} /> Düzenle
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEditingCoach(coach); }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-surface-2 text-ink-2 hover:bg-surface-3 rounded-lg font-semibold transition"
                                                title="İzinleri Düzenle"
                                            >
                                                <Shield size={12} /> Yetkiler
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteCoach(coach.id); }}
                                                className="p-1.5 text-danger hover:text-danger hover:bg-danger-soft rounded-lg transition"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Info card */}
            <div className="bg-warn-soft border border-warn rounded-xl p-4 flex gap-3">
                <AlertCircle size={18} className="text-warn flex-shrink-0 mt-0.5" />
                <div className="text-sm text-warn">
                    <p className="font-semibold mb-1">İzin Sistemi Hakkında</p>
                    <p className="text-warn">Koçlar sisteme giriş yaptığında yalnızca kendilerine atanmış sekmeleri görebilir. <strong>Yönetici Koç</strong> rolü tüm sekmelere tam erişim sağlar. Standart koçlara istediğiniz sekmeleri özelleştirerek atayabilirsiniz.</p>
                </div>
            </div>

            {/* Add Coach Modal */}
            {isAddModalOpen && (
                <Modal
                    acik
                    onClose={() => setIsAddModalOpen(false)}
                    baslikGizle
                    genislik="lg"
                    govdeClassName="p-0 flex flex-col overflow-hidden"
                >
                    <div className="shrink-0 on-color bg-gradient-to-r from-brand to-violet-600 px-6 py-4 flex justify-between items-center">
                        <h3 className="text-ink font-bold flex items-center gap-2"><Plus size={18} /> Yeni Koç Ekle</h3>
                        <button onClick={() => setIsAddModalOpen(false)} className="text-ink-2 hover:text-ink"><X size={20} /></button>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-ink-2 mb-1">Ad Soyad *</label>
                                <input type="text" value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} className="w-full border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" placeholder="Ahmet Yılmaz" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-ink-2 mb-1">E-posta *</label>
                                <input type="email" value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} className="w-full border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" placeholder="ahmet@ornek.com" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-ink-2 mb-1">Telefon</label>
                                <input type="tel" value={addForm.phone} onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))} className="w-full border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" placeholder="0555 123 45 67" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-ink-2 mb-1">Rol</label>
                                <select value={addForm.coachRole} onChange={e => setAddForm(p => ({ ...p, coachRole: e.target.value }))} className="w-full border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-surface">
                                    <option value="subCoach">Standart Koç (Özel İzinler)</option>
                                    <option value="masterCoach">Yönetici Koç (Tüm Yetkiler)</option>
                                </select>
                            </div>
                        </div>
                        {/* Bölüm erişimi: koç hangi mesaide çalışacak?
                            Yalnız koçluk yapan bir koça rehberlik dosyalarını,
                            yalnız rehberlik yapan birine koçluk programlarını
                            açmanın anlamı yok. */}
                        {addForm.coachRole === 'subCoach' && (
                            <div>
                                <label className="block text-xs font-bold text-ink-2 mb-2">Çalışma Bölümleri</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {BOLUM_LISTESI.map((b) => {
                                        const secili = (addForm.sections || ['kocluk']).includes(b.id);
                                        return (
                                            <label
                                                key={b.id}
                                                className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition text-xs ${secili ? 'bg-brand-soft border-brand-line text-brand' : 'bg-surface-2 border-line text-ink-2 hover:bg-surface-3'}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={secili}
                                                    onChange={() => setAddForm((p) => {
                                                        const mevcut = p.sections || ['kocluk'];
                                                        const yeni = mevcut.includes(b.id)
                                                            ? mevcut.filter((x) => x !== b.id)
                                                            : [...mevcut, b.id];
                                                        // En az bir bölüm kalmalı, yoksa koç hiçbir şey göremez
                                                        return { ...p, sections: yeni.length ? yeni : mevcut };
                                                    })}
                                                    className="accent-indigo-600 mt-0.5"
                                                />
                                                <span>
                                                    <span className="font-bold block">{b.ad}</span>
                                                    <span className="opacity-80">{b.aciklama}</span>
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {addForm.coachRole === 'subCoach' && (
                            <div>
                                <label className="block text-xs font-bold text-ink-2 mb-2">Erişim İzinleri (Sekme bazlı)</label>
                                <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                                    {ALL_TABS.map(tab => (
                                        <label key={tab.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition text-xs font-medium ${addForm.permissions.includes(tab.id) ? 'bg-brand-soft border-brand-line text-brand' : 'bg-surface-2 border-line text-ink-2 hover:bg-surface-3'}`}>
                                            <input type="checkbox" checked={addForm.permissions.includes(tab.id)} onChange={() => toggleAddPermission(tab.id)} className="accent-indigo-600" />
                                            {tab.label}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="pencere-alt-cubuk bg-surface flex gap-3 pt-2">
                            <button onClick={() => setIsAddModalOpen(false)} className="flex-1 border border-line text-ink-2 py-2.5 rounded-xl font-semibold hover:bg-surface-2 transition text-sm">İptal</button>
                            <button onClick={handleAddCoach} className="on-color flex-1 bg-gradient-to-r from-brand to-violet-600 text-white py-2.5 rounded-xl font-bold hover:from-indigo-700 hover:to-violet-700 transition shadow-lg text-sm">Koç Ekle</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Permission Edit Modal */}
            {editingCoach && (
                <PermissionEditModal
                    coach={editingCoach}
                    onClose={() => setEditingCoach(null)}
                    onSave={handleSavePermissions}
                />
            )}

            {/* Coach Detail/Edit Modal */}
            {detailCoach && (
                <CoachDetailModal
                    coach={detailCoach}
                    onClose={() => setDetailCoach(null)}
                    onSave={handleSaveCoachDetail}
                    onOpenPermissions={(c) => { setDetailCoach(null); setEditingCoach(c); }}
                />
            )}
        </div>
    );
};

// ── Koç Bilgi Düzenleme Modalı ───────────────────────────────────────────────
const CoachDetailModal = ({ coach, onClose, onSave, onOpenPermissions }) => {
    const [form, setForm] = useState({
        name: coach.name || '',
        email: coach.email || '',
        phone: coach.phone || '',
    });
    const [dirty, setDirty] = useState(false);

    const handleChange = (field, val) => {
        setForm(prev => ({ ...prev, [field]: val }));
        setDirty(true);
    };

    const handleSubmit = () => {
        if (!form.name.trim() || !form.email.trim()) {
            bildir('Ad ve e-posta zorunludur.', 'uyari');
            return;
        }
        onSave(coach.id, { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() });
    };

    return (
        <Modal
            acik
            onClose={onClose}
            baslikGizle
            genislik="md"
            govdeClassName="p-0 flex flex-col overflow-hidden"
        >
            {/* Modal header */}
            <div className="shrink-0 on-color bg-gradient-to-r from-brand to-violet-600 px-6 py-5 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-surface/20 flex items-center justify-center text-ink font-bold text-lg backdrop-blur-sm">
                        {form.name.charAt(0) || '?'}
                    </div>
                    <div>
                        <h3 className="text-ink font-bold text-base leading-tight">{coach.name}</h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 inline-block ${coach.coachRole === 'masterCoach' ? 'bg-purple-300/30 text-c4' : 'bg-blue-300/30 text-info'}`}>
                            {coach.coachRole === 'masterCoach' ? 'Yönetici Koç' : 'Standart Koç'}
                        </span>
                    </div>
                </div>
                <button onClick={onClose} className="text-ink-2 hover:text-ink mt-1 transition">
                    <X size={20} />
                </button>
            </div>

            {/* Form */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
                {/* Ad */}
                <div>
                    <label className="block text-xs font-bold text-ink-2 mb-1.5 flex items-center gap-1.5">
                        <Users size={12} className="text-brand" /> Ad Soyad
                    </label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={e => handleChange('name', e.target.value)}
                        className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                        placeholder="Koç Adı Soyadı"
                    />
                </div>

                {/* E-posta */}
                <div>
                    <label className="block text-xs font-bold text-ink-2 mb-1.5 flex items-center gap-1.5">
                        <Mail size={12} className="text-brand" /> E-posta Adresi
                    </label>
                    <input
                        type="email"
                        value={form.email}
                        onChange={e => handleChange('email', e.target.value)}
                        className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                        placeholder="ornek@mail.com"
                    />
                </div>

                {/* Telefon */}
                <div>
                    <label className="block text-xs font-bold text-ink-2 mb-1.5 flex items-center gap-1.5">
                        <Phone size={12} className="text-brand" /> Telefon
                    </label>
                    <input
                        type="tel"
                        value={form.phone}
                        onChange={e => handleChange('phone', e.target.value)}
                        className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                        placeholder="0555 123 45 67"
                    />
                </div>

                {/* Yetki bilgisi + hızlı erişim */}
                <div className="bg-surface-2 border border-line rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-ink-2 mb-0.5">Yetki & Sekmeler</p>
                        {coach.coachRole === 'masterCoach' ? (
                            <p className="text-xs text-c4 font-semibold">Tüm sekmelere tam erişim</p>
                        ) : (
                            <p className="text-xs text-ink-2">
                                {(coach.permissions || []).length} sekme atanmış
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => onOpenPermissions(coach)}
                        className="flex items-center gap-1.5 text-xs bg-brand text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-brand-hover transition shadow-sm"
                    >
                        <Shield size={12} /> Yetkileri Düzenle
                    </button>
                </div>

                {/* Koçun eklenme tarihi */}
                {coach.addedAt && (
                    <p className="text-xs text-ink-3 flex items-center gap-1">
                        <Calendar size={11} />
                        Eklenme: {new Date(coach.addedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                )}

                {/* Butonlar */}
                <div className="pencere-alt-cubuk bg-surface flex gap-3 pt-1">
                    <button
                        onClick={onClose}
                        className="flex-1 border border-line text-ink-2 py-2.5 rounded-xl font-semibold hover:bg-surface-2 transition text-sm"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!dirty}
                        className={`on-color flex-1 py-2.5 rounded-xl font-bold transition shadow-lg text-sm flex items-center justify-center gap-2 ${dirty ? 'bg-gradient-to-r from-brand to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700' : 'bg-surface-3 text-ink-3 cursor-not-allowed'}`}
                    >
                        <CheckCircle size={15} />
                        Değişiklikleri Kaydet
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const StudentModal = ({ student, onClose, onSave }) => {
    const INVENTORY_LIST = [
        'Holland Mesleki İlgi Envanteri',
        'Sınav Kaygısı Ölçeği',
        'Öğrenme Stilleri Envanteri',
        'Öz Yeterlilik Ölçeği',
        'Akademik Motivasyon Ölçeği',
        'Kariyer Keşif Envanteri',
        'Dikkat ve Konsantrasyon Testi',
        'Duygusal Zeka Ölçeği',
        'Sosyometri',
        'Risk Haritası',
        'İlkokul RİBA (Öğrenci)',
        'Ortaokul RİBA (Öğrenci)',
        'Lise RİBA (Öğrenci)',
    ];
    const [formData, setFormData] = useState(student || {
        name: '',
        schoolNumber: '',
        grade: '',
        target: '',
        parentEmail: '',
        section: '',
        obp: '',
        diploma: '',
        phone: '',
        parentName: '',
        parentPhone: '',
        examType: '',
        alan: ''
    });

    // Alan seçenekleri sınav türüne bağlı: LGS ve AGS'de alan ayrımı yok
    const alanSecenekleri = alanListesi(formData.examType || ogrencininSinavi(formData));

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <Modal
            acik
            onClose={onClose}
            baslikGizle
            genislik="md"
            govdeClassName="p-0 flex flex-col overflow-hidden"
        >
            <div className="shrink-0 bg-brand px-6 py-4 flex justify-between items-center">
                <h3 className="text-ink font-bold text-lg">{student ? 'Öğrenci Düzenle' : 'Yeni Öğrenci Ekle'}</h3>
                <button onClick={onClose} className="text-brand hover:text-ink"><X size={24} /></button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
                <div>
                    <label className="block text-sm font-bold text-ink-2 mb-1">Öğrenci Adı Soyadı</label>
                    <div className="relative">
                        <Users className="absolute left-3 top-2.5 text-ink-3" size={18} />
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            type="text"
                            className="pl-10 w-full border border-line-2 rounded-lg p-2 focus:ring-2 focus:ring-brand"
                            placeholder="Örn: Mehmet Öz"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-ink-2 mb-1">Okul No</label>
                        <input
                            name="schoolNumber"
                            value={formData.schoolNumber}
                            onChange={handleChange}
                            type="text"
                            className="w-full border border-line-2 rounded-lg p-2"
                            placeholder="123"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-ink-2 mb-1">Şube</label>
                        <input
                            name="section"
                            value={formData.section}
                            onChange={handleChange}
                            type="text"
                            className="w-full border border-line-2 rounded-lg p-2"
                            placeholder="A"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-ink-2 mb-1">Sınıf / Seviye</label>
                    <select
                        name="grade"
                        value={formData.grade}
                        onChange={handleChange}
                        className="w-full border border-line-2 rounded-lg p-2 bg-surface text-ink-2"
                    >
                        <option value="">Seçiniz...</option>
                        <option value="5">5. Sınıf</option>
                        <option value="6">6. Sınıf</option>
                        <option value="7">7. Sınıf</option>
                        <option value="8">8. Sınıf</option>
                        <option value="9">9. Sınıf</option>
                        <option value="10">10. Sınıf</option>
                        <option value="11">11. Sınıf</option>
                        <option value="12">12. Sınıf</option>
                        <option value="Mezun">Mezun</option>
                        <option value="Üniversite">Üniversite / Mezun (KPSS-AGS)</option>
                    </select>
                </div>

                {/* Sınav türü konu takibini belirler: öğrenci kendi
                    müfredatını görsün diye ayrı bir alan. Eskiden sınıf
                    seçeneğinin içine gömülüydü ve KPSS/AGS hiç yoktu. */}
                <div>
                    <label className="block text-sm font-bold text-ink-2 mb-1">Hazırlandığı Sınav</label>
                    <select
                        name="examType"
                        value={formData.examType || ''}
                        onChange={handleChange}
                        className="w-full border border-line-2 rounded-lg p-2 bg-surface text-ink-2"
                    >
                        <option value="">Sınıfa göre otomatik</option>
                        {SINAV_LISTESI.map((s) => (
                            <option key={s.id} value={s.id}>{s.icon} {s.ad}</option>
                        ))}
                    </select>
                    <p className="text-[11px] text-ink-3 mt-1 leading-snug">
                        Konu takibi listesi bu seçime göre gelir. Boş bırakılırsa
                        sınıf düzeyinden belirlenir (5–8 → LGS, 9–12 → YKS).
                    </p>
                </div>

                {/* Alan seçimi: öğrenci sınavın tamamını değil, alanına
                    düşen bölümleri çözer. Sözel öğrencisine sayısal
                    konularını göstermek listeyi kullanılmaz kılıyordu. */}
                {alanSecenekleri.length > 0 && (
                    <div>
                        <label className="block text-sm font-bold text-ink-2 mb-1">Alan</label>
                        <select
                            name="alan"
                            value={formData.alan || ''}
                            onChange={handleChange}
                            className="w-full border border-line-2 rounded-lg p-2 bg-surface text-ink-2"
                        >
                            <option value="">Tüm bölümler</option>
                            {alanSecenekleri.map((a) => (
                                <option key={a.id} value={a.id}>{a.ad}</option>
                            ))}
                        </select>
                        <p className="text-[11px] text-ink-3 mt-1 leading-snug">
                            Örn. Sözel seçilirse öğrenciye yalnızca TYT ve AYT Sözel
                            konuları listelenir.
                        </p>
                    </div>
                )}
                <div>
                    <label className="block text-sm font-bold text-ink-2 mb-1">Hedef Bölüm / Lise</label>
                    <input
                        name="target"
                        value={formData.target}
                        onChange={handleChange}
                        type="text"
                        className="w-full border border-line-2 rounded-lg p-2"
                        placeholder="Örn: Tıp Fakültesi"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-ink-2 mb-1">OBP (0-60)</label>
                        <input
                            name="obp"
                            value={formData.obp}
                            onChange={handleChange}
                            type="number"
                            step="0.01"
                            className="w-full border border-line-2 rounded-lg p-2"
                            placeholder="Örn: 54.2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-ink-2 mb-1">Diploma Notu</label>
                        <input
                            name="diploma"
                            value={formData.diploma}
                            onChange={handleChange}
                            type="number"
                            step="0.01"
                            className="w-full border border-line-2 rounded-lg p-2"
                            placeholder="Örn: 90.3"
                        />
                    </div>
                </div>
                {/* ── İletişim: WhatsApp gönderimleri bu alanları kullanır ── */}
                <div className="pt-2 border-t border-line">
                    <p className="text-xs font-black uppercase tracking-widest text-ink-3 mb-3">
                        İletişim Bilgileri
                    </p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-ink-2 mb-1">Öğrenci Telefonu</label>
                            <input
                                name="phone"
                                value={formData.phone || ''}
                                onChange={handleChange}
                                type="tel"
                                className="w-full border border-line-2 rounded-lg p-2"
                                placeholder="0555 123 45 67"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-ink-2 mb-1">Veli Adı</label>
                                <input
                                    name="parentName"
                                    value={formData.parentName || ''}
                                    onChange={handleChange}
                                    type="text"
                                    className="w-full border border-line-2 rounded-lg p-2"
                                    placeholder="Ayşe Hanım"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-ink-2 mb-1">Veli Telefonu</label>
                                <input
                                    name="parentPhone"
                                    value={formData.parentPhone || ''}
                                    onChange={handleChange}
                                    type="tel"
                                    className="w-full border border-line-2 rounded-lg p-2"
                                    placeholder="0555 123 45 67"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-ink-2 mb-1">Velisi E-posta</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 text-ink-3" size={18} />
                                <input
                                    name="parentEmail"
                                    value={formData.parentEmail}
                                    onChange={handleChange}
                                    type="email"
                                    className="pl-10 w-full border border-line-2 rounded-lg p-2"
                                    placeholder="veli@ornek.com"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                {/* Kaydet/İptal pencerenin altına yapışır; uzun formda
                    ekran dışında kalıp görünmez oluyordu (styles/mobil.css) */}
                <div className="pencere-alt-cubuk pt-4 flex space-x-3 bg-surface -mx-6 px-6 border-t border-line mt-2">
                    <button onClick={onClose} className="flex-1 py-2 bg-surface-3 text-ink-2 rounded-lg font-bold hover:bg-surface-3 transition">İptal</button>
                    <button onClick={() => onSave(formData)} className="flex-1 py-2 bg-brand text-white rounded-lg font-bold hover:bg-brand-hover transition">Kaydet</button>
                </div>
            </div>
        </Modal>
    );
};

const CoachDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        try { 
            console.log("Logging out...");
            if (logout) await logout(); 
            localStorage.removeItem('user_session'); // Standard session
            localStorage.removeItem('user_role'); // Extra role guard
            window.location.replace('/#/login'); // Hard redirect using window.location for max reliability
            setTimeout(() => window.location.reload(), 100); 
        } catch (e) { 
            console.warn('Logout error:', e); 
            window.location.href = '#/login';
        }
    };
    // ── Aktif bölüm: koçluk mesaisi mi, rehberlik (PDR) mesaisi mi ──
    // Ana koç ikisini de görür; eklenen koç sadece kendisine tanımlı
    // bölümleri görür. Seçim kalıcıdır — koç her açılışta kendi
    // mesaisine düşer.
    const bolumler = useMemo(() => erisilenBolumler(user), [user]);
    const [bolum, setBolum] = useState(() => {
        try {
            const kayitli = localStorage.getItem('coach_active_section');
            if (kayitli && erisilenBolumler(user).includes(kayitli)) return kayitli;
        } catch { /* ilk bölüme düş */ }
        return erisilenBolumler(user)[0] || 'kocluk';
    });
    useEffect(() => {
        try { localStorage.setItem('coach_active_section', bolum); } catch { /* ignore */ }
    }, [bolum]);

    // Koçluk bölümünde açılış artık "Bugün" — grafik değil iş listesi
    const [activeTab, setActiveTab] = useState(() => (
        (localStorage.getItem('coach_active_section') === 'pdr') ? 'pdr-archive' : 'bugun'
    ));

    // Bölüm değişince o bölümde olmayan sekmede kalınmaz
    const bolumGruplari = NAV_BY_SECTION[bolum] || NAV_BY_SECTION.kocluk;

    /**
     * Sekme başına açık görev sayısı. Görev listesi değiştiğinde
     * (atama, tamamlama) yeniden hesaplanır — `coach-tasks-updated`
     * olayı bunun için var.
     */
    const [gorevSurumu, setGorevSurumu] = useState(0);
    useEffect(() => {
        const tetik = () => setGorevSurumu((v) => v + 1);
        window.addEventListener('coach-tasks-updated', tetik);
        return () => window.removeEventListener('coach-tasks-updated', tetik);
    }, []);

    // Sekme bildirim rozetleri — bir tarafta yapılan çalışma
    // diğer tarafın sekmesinde sayaç olarak belirir
    const { rozetler, okundu } = useTabBadges('coach', user, bolum);

    const sekmeGorevSayilari = useMemo(() => {
        const say = {};
        try {
            coachTasks.kocGorevleri(user?.id).forEach((g) => {
                if (!g.sekme || g.bolum !== bolum) return;
                if (g.durum === 'tamam' || g.durum === 'iptal') return;
                say[g.sekme] = (say[g.sekme] || 0) + 1;
            });
        } catch { /* görev deposu yoksa rozet gösterilmez */ }
        return say;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, bolum, gorevSurumu]);
    useEffect(() => {
        const idler = bolumGruplari.flatMap((g) => g.items.map((t) => t.id));
        if (!idler.includes(activeTab)) setActiveTab(idler[0]);
        // activeTab bağımlılığa girerse kullanıcı sekme seçtiği anda geri sıçrar
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bolum]);

    const [toast, setToast] = useState(null);
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
    const [showBulkMessage, setShowBulkMessage] = useState(false);

    // Program Builder State
    const [isProgramBuilderOpen, setIsProgramBuilderOpen] = useState(false);
    const [selectedStudentForProgram, setSelectedStudentForProgram] = useState(null);

    // Edit Student State
    const [editingStudent, setEditingStudent] = useState(null);

    // Settings Modal State (Master Coach Only)
    const [showSettings, setShowSettings] = useState(false);

    // Task Assignment Modal State
    const [isTaskAssignModalOpen, setIsTaskAssignModalOpen] = useState(false);
    // Görev penceresi belirli bir öğrenci için açıldığında ön seçim
    const [taskPreselect, setTaskPreselect] = useState(null);

    // Ayarlar → Genel → Uygulama Adı. Kaydedilir ama hiçbir yerde
    // gösterilmiyordu; başlıkta ve sekme adında kullanılır.
    const [appName, setAppName] = useState(MARKA.ad.toLocaleUpperCase('tr-TR'));
    /* Kurum Ayarlar'dan kendi adını yazdı mı? Yazdıysa başlıkta marka
       görseli değil o metin gösterilir. */
    const [kurumAdiOzel, setKurumAdiOzel] = useState(false);
    useEffect(() => {
        const oku = () => {
            try {
                const s = JSON.parse(localStorage.getItem("app_settings") || "{}");
                const ad = s?.general?.appName;
                if (ad && String(ad).trim()) {
                    setAppName(String(ad).trim().toLocaleUpperCase("tr-TR"));
                    setKurumAdiOzel(
                        String(ad).trim().toLocaleLowerCase('tr-TR') !== MARKA.ad.toLocaleLowerCase('tr-TR')
                    );
                }
            } catch { /* varsayilan kalsin */ }
        };
        oku();
        window.addEventListener("settings-updated", oku);
        return () => window.removeEventListener("settings-updated", oku);
    }, []);

    // 💬 Öğrenci kartından hızlı WhatsApp gönderimi
    const [whatsAppTarget, setWhatsAppTarget] = useState(null);

    // Admin VEYA masterCoach rolü ise tam yetki
    const isMasterCoach = user?.role === 'admin' || user?.coachRole === 'masterCoach';
    // Bu koça atanmış izinler (masterCoach tüm sekmelere erişir)
    // Tek kaynak: izin listesi PERM_ALL_TABS'tan gelir, elle kopyalanmaz.
    // (Eskiden burada ayrı bir dizi vardı ve sekmeler değişince unutuluyordu.)
    const coachPermissions = isMasterCoach
        ? [...PERM_ALL_TABS.map(t => t.id), 'coaches']
        : (user?.permissions?.length ? user.permissions : ['analysis', 'exams']);
    const hasPermission = (tab) => coachPermissions.includes(tab);

    /**
     * 📱 Mobil gezinme listeleri — kenar çubuğuyla AYNI kaynaktan.
     *
     * Yetki süzgeci burada bir kez uygulanır; alt çubuk ve "Tüm Bölümler"
     * sayfası bunu kullanır. Böylece bir koçun göremediği sekme telefonda
     * da görünmez ve iki liste birbirinden ayrı düşemez.
     */
    const mobilSekmeGruplari = useMemo(() => (
        (NAV_BY_SECTION[bolum] || NAV_BY_SECTION.kocluk)
            .map((g) => ({
                label: g.label,
                items: g.items.filter(
                    (t) => (!t.perm || coachPermissions.includes(t.perm)) && (!t.boss || isMasterCoach)
                ),
            }))
            .filter((g) => g.items.length)
    ), [bolum, coachPermissions, isMasterCoach]);

    /**
     * Alt çubuğa çıkan dört hedef: koçun günlük işi.
     * Yetkisi yoksa listeden düşer, yerine sıradaki gelir.
     */
    const mobilBirincilSekmeler = useMemo(() => {
        const tumu = mobilSekmeGruplari.flatMap((g) => g.items);
        const tercih = ['bugun', 'analysis', 'exams', 'programs', 'coach-tasks', 'groups'];
        const secilen = tercih
            .map((id) => tumu.find((t) => t.id === id))
            .filter(Boolean)
            .slice(0, 4);
        // Tercih listesi yetkiler yüzünden dolmadıysa baştan tamamla
        return secilen.length === 4
            ? secilen
            : [...secilen, ...tumu.filter((t) => !secilen.includes(t))].slice(0, 4);
    }, [mobilSekmeGruplari]);

    // Students State
    // `tumOgrenciler` deponun tamamıdır — yazma işlemleri hep bunun
    // üzerinden gider ki bir koçun kaydettiği liste diğerininkini silmesin.
    const [tumOgrenciler, setStudents] = useState(() => {
        return safeParse('coach_students', []);
    });

    /**
     * Ekranda gösterilen liste. Ana koç hepsini görür; eklenen koç
     * yalnızca kendi kaydettiği öğrencileri görür ve onlar üzerinde
     * işlem yapar. Alt bileşenlere HEP bu liste geçilir — depo listesi
     * (`tumOgrenciler`) yalnızca kaydetme sırasında kullanılır.
     */
    const students = useMemo(
        () => gorunurOgrenciler(user, tumOgrenciler),
        [user, tumOgrenciler]
    );

    /**
     * Dosya sekmelerinin içine gömülen çalışma modülleri.
     *
     * Anahtar = dosya numarası. Her modül bir alt sekme olarak açılır ve
     * ürettiği kayıt "Modülleri Bağla" ile aynı dosyaya düşer. Eşleştirme
     * dosyanın resmî tanımına göre yapılmıştır:
     *
     *   1  Plan-Program        → PDR iş akışı / plan motoru
     *   6  Görüşme Dosyası     → görüşme kayıtları + randevu takvimi
     *   7  Sınıf Dosyası       → envanter uygulamaları + sosyometri
     *   8  Risk Haritaları     → risk alarm paneli
     *   9  Kaynaştırma / BEP   → BEP plan motoru
     */
    const pdrModulleri = useMemo(() => ({
        '1': [{
            id: 'akis', label: 'Plan ve İş Akışı', icon: ClipboardList,
            render: () => <WorkflowTab students={students} setToast={setToast} />,
        }],
        '6': [
            {
                id: 'gorusme', label: 'Görüşme Kayıtları', icon: MessageSquare,
                render: () => <GuidanceServiceTab students={students} setToast={setToast} />,
            },
            {
                id: 'randevu', label: 'Randevu Takvimi', icon: Calendar,
                render: () => (
                    <CoachAppointmentManager
                        students={students}
                        coachId={user?.id}
                        coachName={user?.name || ''}
                        bolum="pdr"
                    />
                ),
            },
        ],
        '7': [
            {
                id: 'envanter', label: 'Envanter Uygulama', icon: ClipboardList,
                render: () => (
                    <TestsTab
                        students={students}
                        setToast={setToast}
                        onAssignTask={(s) => { setTaskPreselect(s || null); setIsTaskAssignModalOpen(true); }}
                    />
                ),
            },
            {
                id: 'sosyometri', label: 'Sosyometri', icon: Share2,
                render: () => <SosyometriPaneli students={students} />,
            },
            {
                id: 'grup', label: 'Grup Rehberliği', icon: Users,
                render: () => <GroupsTab students={students} setToast={setToast} bolum="pdr" />,
            },
        ],
        '8': [{
            id: 'risk', label: 'Risk Alarm Paneli', icon: AlertCircle,
            render: () => <RiskAlarmPanel students={students} setToast={setToast} />,
        }],
        '9': [{
            id: 'bep', label: 'BEP Merkezi', icon: Brain,
            render: () => <BEPCenter students={students} setToast={setToast} />,
        }],
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [students, user?.id, user?.name]);

    // Firebase Sync - Coach için başlat + real-time dinle
    React.useEffect(() => {
        if (!user?.id) return;

        const initSync = async () => {
            try {
                await firebaseSync.init(user);
            } catch (e) {
                console.warn('Coach sync başlatılamadı:', e);
            }
        };
        initSync();

        // Öğrenci telefondan görev tamamlayınca veya başka sekmede silinince burada güncelle
        const handleStorageUpdate = (e) => {
            if (!e.key || e.key.startsWith('_fbtime_')) return; // FBtime güncellemeleri hariç dinle
            if (e.key === 'coach_students') {
                const saved = localStorage.getItem('coach_students');
                try {
                    const parsed = saved ? JSON.parse(saved) : [];
                    // Sadece gerçekten değişmişse state'i güncelle (Sonsuz döngü koruması)
                    setStudents(prev => {
                        if (JSON.stringify(prev) === JSON.stringify(parsed)) return prev;
                        return parsed;
                    });
                } catch (err) { console.error('Storage update sync error:', err); }
            }
        };
        window.addEventListener('storage', handleStorageUpdate);

        // Yedek: 30sn'de bir öğrenci listesini taze oku (Önemli: UI'ın güncel kalması için)
        const pollInterval = setInterval(() => {
            const saved = localStorage.getItem('coach_students');
            try {
                const parsed = saved ? JSON.parse(saved) : [];
                // Sadece gerçekten değişmişse state'i güncelle (performans için)
                setStudents(prev => {
                    if (JSON.stringify(prev) === JSON.stringify(parsed)) return prev;
                    return parsed;
                });
            } catch (err) { }
        }, 30000);

        return () => {
            window.removeEventListener('storage', handleStorageUpdate);
            clearInterval(pollInterval);
            firebaseSync.destroy();
        };
    }, [user?.id]);

    // Save to LocalStorage whenever tumOgrenciler change + sync
    React.useEffect(() => {
        const currentData = JSON.stringify(tumOgrenciler);
        if (localStorage.getItem('coach_students') !== currentData) {
            localStorage.setItem('coach_students', currentData);
        }
        
        // Use debouncedSync to prevent Firestore "Write stream exhausted" error
        if (firebaseSync && firebaseSync.debouncedSync) {
            firebaseSync.debouncedSync();
        }
    }, [tumOgrenciler]);



    const handleStudentListUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset input
        e.target.value = '';

        setToast('Liste işleniyor...');

        try {
            // Import universal parser
            const { parseUniversalExcel } = await import('../utils/universalExcelParser');

            // Parse file with smart detection
            const parsed = await parseUniversalExcel(file, 'student_list');

            if (!parsed.success || !parsed.data || parsed.data.length === 0) {
                throw new Error("Listede öğrenci bulunamadı.");
            }

            const newStudents = parsed.data.map((item, index) => {
                // Ad tam doluysa kullan, yoksa firstName + lastName birleştir
                const fullName = (item.name && item.name.trim())
                    ? item.name.trim()
                    : `${item.firstName || ''} ${item.lastName || ''}`.trim();
                return {
                    id: Date.now() + index,
                    name: fullName,
                    firstName: item.firstName || fullName.split(' ')[0] || '',
                    lastName: item.lastName || fullName.split(' ').slice(1).join(' ') || '',
                    schoolNumber: item.schoolNumber ? String(item.schoolNumber).trim() : '',
                    grade: item.grade || '',
                    section: item.section || '',
                    gender: item.gender || '',
                    phone: item.phone || '',
                    email: item.email || '',
                    obp: item.obp || null,
                    diploma: item.diploma || null,
                    lastNet: item.lastNet != null ? item.lastNet : 0,
                    status: 'Aktif',
                    progress: 0,
                    lastAction: 'Yeni Kayıt'
                };
            }).filter(s => s.name); // Boş isimli satırları filtrele


            // 🆕 CRITICAL: Use merging logic to update existing students or add new ones
            setStudents(prev => {
                const existingList = [...prev];
                let addedCount = 0;
                let updatedCount = 0;

                const updatedList = [...existingList];

                newStudents.forEach(ns => {
                    const existingIdx = updatedList.findIndex(ex => {
                        const nsNum = ns.schoolNumber ? String(ns.schoolNumber).trim() : null;
                        const exNum = ex.schoolNumber ? String(ex.schoolNumber).trim() : null;
                        
                        if (nsNum && exNum) {
                            return nsNum === exNum;
                        }
                        return String(ex.name).trim().toLowerCase() === String(ns.name).trim().toLowerCase();
                    });

                    if (existingIdx !== -1) {
                        // MERGE existing student data (Update nets, grades, etc.)
                        updatedList[existingIdx] = {
                            ...updatedList[existingIdx],
                            grade: ns.grade || updatedList[existingIdx].grade,
                            section: ns.section || updatedList[existingIdx].section,
                            lastNet: (ns.lastNet !== 0) ? ns.lastNet : updatedList[existingIdx].lastNet,
                            obp: ns.obp || updatedList[existingIdx].obp,
                            diploma: ns.diploma || updatedList[existingIdx].diploma,
                            lastAction: 'Liste Güncelleme'
                        };
                        updatedCount++;
                    } else {
                        // ADD new student
                        updatedList.push(ns);
                        addedCount++;
                    }
                });

                if (addedCount === 0 && updatedCount === 0) {
                    setToast("Tüm bilgiler zaten güncel.");
                    return prev;
                }

                // Persistence confirmation
                yaz('coach_students', updatedList);

                // Feedback
                const msg = [];
                if (addedCount > 0) msg.push(`${addedCount} yeni öğrenci eklendi`);
                if (updatedCount > 0) msg.push(`${updatedCount} öğrenci güncellendi`);
                setToast(`✅ ${msg.join(', ')}!`);

                return updatedList;
            });

        } catch (error) {
            console.error("List Upload Error:", error);

            let detailedMsg = "Dosya işlenemedi.";
            if (typeof error === 'string') {
                detailedMsg = error;
            } else if (error.message) {
                detailedMsg = error.message;
            }

            setToast(`❌ Hata: ${detailedMsg}`);
            bildir(`Liste Yükleme Hatası:\n\n${detailedMsg}\n\nDesteklenen formatlar:\n• MEB okul listesi ("Sınıf Listesi" başlıklı)\n• Mevcut Format: "Öğrenci No", "Adı", "Soyadı", "Sınıf/Şube" sütunları`, 'hata');
        }
    };

    const handleClearList = () => {
        if (students.length === 0) {
            setToast('Liste zaten boş.');
            return;
        }
        // Alt koç "listeyi temizle" derse yalnızca KENDİ eklediklerini siler;
        // eskiden bu düğme herkesin kaydını birden siliyordu.
        const hepsiMi = isAnaKoc(user);
        const etiket = hepsiMi
            ? 'Tüm öğrenci listesini kalıcı olarak sil'
            : `Eklediğiniz ${students.length} öğrenciyi kalıcı olarak sil`;

        requireOwnerConfirmation(etiket, async () => {
            if (!hepsiMi) {
                const kalan = tumOgrenciler.filter((s) => !gorebilir(user, s));
                setStudents(kalan);
                localStorage.setItem('coach_students', JSON.stringify(kalan));
                try { firebaseSync?.debouncedSync?.(); } catch { /* ignore */ }
                setToast('Eklediğiniz öğrenciler silindi.');
                return;
            }
            setStudents([]);
            localStorage.removeItem('coach_students');

            // 🆕 CRITICAL: Sync deletion to Firebase using the globally available firebaseSync
            if (window.firebaseSync) {
                window.firebaseSync.deleteKey('coach_students');
                // Zorunlu senkronizasyonu hemen tetikle
                try { await window.firebaseSync.sync(); } catch (e) { }
            } else if (firebaseSync) {
                firebaseSync.deleteKey('coach_students');
                try { await firebaseSync.sync(); } catch (e) { }
            }

            setToast('Liste temizlendi ve bulut verileri silindi.');
        });
    };

    const handleCloseToast = () => setToast(null);

    // Auto-dismiss toast
    React.useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Kontenjan kararı sunucudan okunduğu için async
    const handleSaveStudent = async (data) => {
        if (editingStudent) {
            // Update Existing
            setStudents(tumOgrenciler.map(s => s.id === editingStudent.id ? { ...s, ...data } : s));
            setToast('Öğrenci bilgileri güncellendi.');
        } else {
            // Ayarlar → Genel → "Koç Başına Max Öğrenci" sınırı.
            // Bu değer kaydediliyor ama hiçbir yerde kontrol edilmiyordu.
            const limit = (() => {
                try {
                    const s = JSON.parse(localStorage.getItem('app_settings') || '{}');
                    const n = parseInt(s?.general?.maxStudentsPerCoach, 10);
                    return Number.isFinite(n) && n > 0 ? n : null;
                } catch { return null; }
            })();

            // Sınır koçun KENDİ öğrencisi üzerinden işler; ana koçun
            // listesindeki 50 kayıt yüzünden yeni koç öğrenci ekleyemez olmasın.
            if (limit && students.length >= limit) {
                setToast(`Öğrenci sınırına ulaşıldı (${limit}). Ayarlar → Genel bölümünden artırabilirsiniz.`);
                return;
            }

            // Paket sınırı: satın alınan paketin öğrenci hakkı aşılamaz.
            // Bu kontrol eskiden yoktu; paketler yalnızca giriş ekranında
            // gösterilen bir listeydi, hiçbir yerde uygulanmıyordu.
            // Kontenjan kararı SUNUCUDAN: yerel `coach_subscriptions`
            // kurcalanarak limit aşılabiliyordu (ölçüldü). Sunucuda kayıt
            // yoksa ücretsiz kademe uygulanır.
            const paket = await subscription.ogrenciEklenebilirGuvenli(user?.id, students.length);
            if (!paket.izin) {
                setToast(paket.mesaj);
                return;
            }

            // Create New — sahiplik damgası ve onay durumu ile
            const newStudent = sahiplikEkle(user, {
                id: Date.now(),
                ...data,
                status: 'Aktif',
                progress: 0,
                lastAction: 'Yeni Kayıt',
                // Ana koçun eklediği kayıt doğrudan onaylı; alt koçun eklediği
                // kayıt ana koç onayına düşer.
                approvalStatus: isAnaKoc(user) ? 'onayli' : 'bekliyor',
            });
            setStudents([...tumOgrenciler, newStudent]);
            setToast(isAnaKoc(user)
                ? 'Yeni öğrenci eklendi.'
                : 'Öğrenci eklendi — ana koç onayı bekliyor.');
        }
        setIsStudentModalOpen(false);
        setEditingStudent(null);
    };

    const handleDeleteStudent = (e, student) => {
        e.stopPropagation();
        requireOwnerConfirmation(`${student.name} adlı öğrenciyi sil`, () => {
            setStudents(prev => prev.filter(s => s.id !== student.id));
            setToast(`${student.name} başarıyla silindi.`);
        });
    };

    const openEditStudent = (e, student) => {
        e.stopPropagation();
        setEditingStudent(student);
        setIsStudentModalOpen(true);
    };

    const handleAssignTask = (taskData) => {
        try {
            // Get existing tasks from localStorage
            const existingTasks = JSON.parse(localStorage.getItem('student_tasks') || '{}');
            const assignedTestsKey = (studentId) => `assigned_tests_${studentId}`;

            // Görev yükünü her öğrenci için kaydet
            taskData.selectedStudents.forEach(studentId => {
                const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const task = {
                    id: taskId,
                    studentId: String(studentId),
                    title: taskData.title,
                    description: taskData.description,
                    dueDate: taskData.dueDate,
                    priority: taskData.priority,
                    category: taskData.category,
                    status: 'pending',
                    assignedBy: user.id,
                    assignedByName: user.name,
                    assignedAt: new Date().toISOString(),
                    completed: false
                };

                // Öğrencinin görev listesine ekle
                const keyStr = String(studentId);
                if (!existingTasks[keyStr]) {
                    existingTasks[keyStr] = [];
                }
                existingTasks[keyStr].push(task);

                // 🆕 Inventory/Test ataması ise özel assigned_tests listesine de ekle
                if (taskData.category === 'inventory' || taskData.category === 'test') {
                    const studentAssignedTests = JSON.parse(localStorage.getItem(assignedTestsKey(studentId)) || '[]');

                    // Test ID'sini belirle (Inventory listesindeki isimden veya başlıktan)
                    let testId = 'general_test';
                    const invName = taskData.meta?.inventory || '';
                    if (invName.includes('Holland')) testId = 'holland';
                    else if (invName.includes('Kayg')) testId = 'exam_anxiety';
                    else if (invName.includes('Stilleri')) testId = 'vark';
                    else if (invName.includes('Sosyometri')) testId = 'sociometry';
                    else if (invName.includes('Risk')) testId = 'risk_map';
                    else if (invName.includes('RİBA') || invName.includes('RIBA')) {
                        if (invName.includes('İlkokul')) testId = 'riba_primary';
                        else if (invName.includes('Ortaokul')) testId = 'riba_middle';
                        else if (invName.includes('Lise')) testId = 'riba_high';
                    }

                    // Eğer zaten atanmışsa tekrar ekleme (isteğe bağlı)
                    if (!studentAssignedTests.some(t => t.testId === testId && t.status === 'pending')) {
                        studentAssignedTests.push({
                            testId,
                            title: invName || taskData.title,
                            assignedAt: new Date().toISOString(),
                            status: 'pending'
                        });
                        localStorage.setItem(assignedTestsKey(studentId), JSON.stringify(studentAssignedTests));
                    }
                }
            });

            // Save updated tasks
            localStorage.setItem('student_tasks', JSON.stringify(existingTasks));

            // Firebase'e hemen senkronize et
            firebaseSync.sync().catch(() => { });

            // Öğrencilere bildirim düşür — bildirim paneli eskiden yalnızca
            // randevu olaylarını görüyordu, görev atamaları hiç görünmüyordu.
            notifyMany(taskData.selectedStudents, {
                type: taskData.category === 'inventory' || taskData.category === 'test' ? 'exam' : 'task',
                title: `Yeni görev: ${taskData.title}`,
                body: taskData.dueDate ? `Son teslim: ${taskData.dueDate}` : 'Koçunuz size yeni bir görev atadı.',
                action: { tab: 'tasks' },
            });

            // Show success message
            const studentCount = taskData.selectedStudents.length;
            setToast(`Görev ${studentCount} öğrenciye başarıyla atandı!`);
        } catch (error) {
            console.error('Task assignment error:', error);
            setToast('Görev atanırken hata oluştu!');
        }
    };

    return (
        <div className="min-h-screen bg-page text-ink selection:bg-brand/30 selection:text-ink pb-24">
            {/* Global Toast */}
            {toast && <Toast message={toast} onClose={handleCloseToast} />}

            {/* ── PREMIUM HEADER ───────────────────────────────────────────── */}
            <header className="topbar fixed top-0 left-0 right-0 z-40">
                {/* Yükseklik 72 → 96: ad yazısı logodaki el yazısı stiliyle
                    ve alt başlıkla aynı genişlikte duruyor; bu logo "Kampı"yı
                    alt satıra aldığı için doğası gereği yüksek, eski çubuğa
                    sığmıyordu. */}
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 lg:h-[88px] flex items-center justify-between gap-3">
                    {/* Left: Branding & Status */}
                    <div className="flex items-center gap-4">
                        {/* Marka amblemi. Önceden jenerik bir roket ikonu ve
                            altında kurucunun kişi adı yazılıydı; uygulama
                            birçok koçun kullandığı bir ürün olduğu için ikisi
                            de kaldırıldı. */}
                        <MarkaGorsel
                            src={MARKA.amblem}
                            alt=""
                            width="44"
                            height="44"
                            className="w-11 h-11 rounded-[14px] flex-none object-contain bg-white"
                        />
                        <div className="hidden sm:block">
                            {/* Ad, logodaki el yazısı stiliyle görünsün diye
                                düz metin değil görsel. Kurum Ayarlar'dan kendi
                                adını yazdıysa o metin gösterilir — kimsenin
                                kendi markasını görselle ezmiyoruz. */}
                            {kurumAdiOzel ? (
                                <h1 className="text-sm font-black text-ink syne tracking-[0.2em] uppercase">{appName}</h1>
                            ) : (
                                /* Yükseklik değil GENİŞLİK veriliyor: ad yazısı
                                   altındaki "KOÇLUK PLATFORMU" satırıyla aynı
                                   genişlikte dursun diye. */
                                <MarkaGorsel src={MARKA.adYazisi} alt={MARKA.ad} width="605" height="256"
                                    className="w-[168px] h-auto object-contain" />
                            )}
                            <p className="text-[10px] font-black text-accent tracking-[0.075em] mt-0.5 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                                {MARKA.altBaslik.toLocaleUpperCase('tr-TR')}
                            </p>
                        </div>
                    </div>

                    {/* Sağ: yalnızca sık kullanılan iş şeritte kalır.
                        Eskiden beş simge yan yana duruyordu (bulut kurtarma,
                        bildirim, ayarlar, çıkış, tema) ve hepsi eşit ağırlıktaydı.
                        Oysa "bulut kurtarma" yerel değişiklikleri silen, yılda
                        birkaç kez kullanılan bir işlem — üst şeritte, çıkışın
                        yanında durmamalı. */}
                    <div className="flex items-center gap-2 relative z-10">
                        {/* Canlı Firestore dinleyicisi: hata verirse yalnızca zil
                            düşsün, panel ayakta kalsın */}
                        <BolumHataSiniri bolumAdi="Bildirimler">
                            <RealtimeNotificationBell role="coach" userId={user?.id} />
                        </BolumHataSiniri>

                        <KullaniciMenusu
                            kullanici={user}
                            rolEtiketi={isMasterCoach ? 'Ana Koç' : 'Koç'}
                            onAyarlar={() => setShowSettings(true)}
                            onCikis={handleLogout}
                            ekOgeler={[{
                                id: 'bulut',
                                etiket: 'Buluttan geri yükle',
                                simge: RefreshCw,
                                onSec: async () => {
                                    if (await onayla({
                                        baslik: 'Buluttan geri yükle',
                                        mesaj: 'Buluttaki verileriniz bu cihaza indirilecek. Bu cihazdaki kaydedilmemiş değişiklikler silinebilir.',
                                        onayMetni: 'Geri yükle',
                                        tehlikeli: true,
                                    })) {
                                        setToast('Senkronizasyon başlatıldı...');
                                        const res = await firebaseSync.forceCloudRecovery();
                                        if (res.success) {
                                            setToast('Veriler kurtarıldı! Yenileniyor...');
                                            setTimeout(() => window.location.reload(), 1000);
                                        } else {
                                            setToast('Hata: ' + res.error);
                                        }
                                    }
                                },
                            }]}
                        />
                    </div>
                </div>
                <OfflineBanner offlineManager={window.offlineManager} />
            </header>

            {/* ── ACTION BAR ───────────────────────────────────────────── */}
            <div className="pt-20 lg:pt-28 pb-6 lg:pb-8 relative overflow-hidden atmos">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-6 bg-surface/40 backdrop-blur-xl border border-line p-4 rounded-3xl">
                        <div className="flex flex-wrap gap-3">
                            <button 
                                onClick={() => { setEditingStudent(null); setIsStudentModalOpen(true); }} 
                                className="group relative px-6 py-3 bg-brand text-ink-on rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all hover:scale-105 active:scale-95 shadow-lg shadow-e2 flex items-center gap-3"
                            >
                                <div className="p-1.5 bg-surface/20 rounded-lg group-hover:rotate-90 transition-transform">
                                    <Plus size={14} />
                                </div>
                                ÖĞRENCİ EKLE
                            </button>
                            
                            <label htmlFor="studentListUpload" className="group px-6 py-3 bg-surface/5 border border-line hover:border-accent/40 text-ink rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all cursor-pointer flex items-center gap-3">
                                <div className="p-1.5 bg-accent/20 rounded-lg text-accent group-hover:-translate-y-1 transition-transform">
                                    <Upload size={14} />
                                </div>
                                LİSTE YÜKLE
                            </label>

                            <button 
                                onClick={() => setShowBulkMessage(true)} 
                                className="group px-6 py-3 bg-surface/5 border border-line hover:border-ok/40 text-ink rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all flex items-center gap-3"
                            >
                                <div className="p-1.5 bg-ok/20 rounded-lg text-ok group-hover:scale-110 transition-transform">
                                    <MessageSquare size={14} />
                                </div>
                                TOPLU MESAJ
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-ink-3 tracking-widest uppercase">Portal Status</span>
                                <span className="text-xs font-black text-ink syne flex items-center gap-2">
                                    V3.5.2 <span className="text-brand animate-pulse">PREMIUM</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ── SEKME ÇUBUĞU ───────────────────────────────────────────
                        Eski hâli 24×24 karo butonlardan oluşuyordu; pasif olanlar
                        opacity-40 ile okunmaz haldeydi ve aktif sekme zeminden
                        ayrışmıyordu. Artık gruplar tek bir çubukta, aktif sekme
                        yüzeyden yükselerek belli oluyor. */}
                    {/* ── BÖLÜM ANAHTARI ─────────────────────────────────────────
                        Koçluk mesaisi ile okul rehberlik mesaisi ayrı işler;
                        sekmeler tek çubukta toplandığında hangi işi yaptığınız
                        kayboluyordu. Ana koç iki bölüme de girer, eklenen koç
                        yalnızca kendisine tanımlı bölümü görür — tek bölümü
                        olan koça anahtar hiç gösterilmez. */}
                    {bolumler.length > 1 && (
                        <div className="mt-5 flex flex-wrap items-center gap-3">
                            <div className="tabbar" role="tablist" aria-label="Çalışma bölümü">
                                {bolumler.map((b) => {
                                    const tanim = BOLUMLER[b];
                                    const on = bolum === b;
                                    return (
                                        <button
                                            key={b}
                                            role="tab"
                                            aria-selected={on}
                                            onClick={() => setBolum(b)}
                                            className={`tb ${on ? 'is-on' : ''}`}
                                            style={on ? { '--brand': b === 'pdr' ? 'var(--accent)' : 'var(--brand)' } : undefined}
                                            title={tanim?.aciklama || ''}
                                        >
                                            {tanim?.ad || b}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-[11px] text-ink-3 leading-snug max-w-md">
                                {BOLUMLER[bolum]?.aciklama}
                                {isAnaKoc(user) && ' · Ana koç yetkisiyle tüm kayıtları görüyorsunuz.'}
                            </p>
                        </div>
                    )}

                    {/* TELEFONDA GİZLİ — orada alt çubuk ve "Tüm Bölümler"
                        sayfası var. Otuz sekmeyi yatay kaydırmalı bir şeritte
                        göstermek mobil için masaüstü düzenini küçültmekten
                        ibaretti; kullanıcı sekmelerin çoğunu hiç görmüyordu. */}
                    {/* ⚠️ SEKMELER GİZLİ KALIYORDU.
                        Şerit `overflow-x-auto` + `min-w-max` idi ve kaydırma
                        çubuğu da `no-scrollbar` ile gizlenmişti. İçerik
                        genişliği 1400 pikselle sınırlanınca 14 sekmenin son
                        üçü (Görevler, Kuponlar, Davetler) ekran dışında
                        kalıyor, YANLARINDA HİÇBİR İPUCU OLMUYORDU — koç
                        "Davetler nerede?" diye soruyordu; 310 piksel gizliydi.

                        Artık gruplar alt satıra SARILIYOR: yatay kaydırma
                        yok, her sekme görünür. */}
                    <nav className="hidden lg:block mt-5 -mb-px">
                        <div className="flex flex-wrap items-end gap-x-5 gap-y-3 pb-0.5">
                            {bolumGruplari.map((group) => {
                                const tabs = group.items.filter(
                                    (t) => (!t.perm || hasPermission(t.perm)) && (!t.boss || isMasterCoach)
                                );
                                if (!tabs.length) return null;
                                return (
                                    <div key={group.label} className="flex flex-col gap-1.5">
                                        <span className="eyebrow px-1">{group.label}</span>
                                        <div className="tabbar">
                                            {tabs.map((tab) => {
                                                const Icon = tab.icon;
                                                const on = activeTab === tab.id;
                                                // Bu sekmeye bağlı açık görev sayısı — koç işin
                                                // hangi ekranda beklediğini sekmeden görür
                                                const gorevSayisi = sekmeGorevSayilari[tab.id] || 0;
                                                // Sekmede bekleyen yeni çalışma sayısı; sekmeye
                                                // girilince sıfırlanır
                                                const yeniSayisi = rozetler[tab.id] || 0;
                                                return (
                                                    <button
                                                        key={tab.id}
                                                        onClick={() => { setActiveTab(tab.id); okundu(tab.id); }}
                                                        aria-selected={on}
                                                        className={`tb ${on ? 'is-on' : ''}`}
                                                        style={on ? { '--brand': group.accent } : undefined}
                                                    >
                                                        {/* Simgeler kendi renklerini taşır — tek renge zorlanmaz */}
                                                        <Icon size={18} />
                                                        {tab.label}
                                                        <TabBadge sayi={yeniSayisi} />
                                                        {gorevSayisi > 0 && (
                                                            <span
                                                                className="badge badge-warn ml-1"
                                                                title={`${gorevSayisi} açık görev`}
                                                            >
                                                                {gorevSayisi}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </nav>

                </div>
            </div>
            {/* ── Tab Content ────────────────────────────────────────────── */}
            {/* İçerik genişliği 1920 → 1400. Geniş monitörde satırlar ekranın
                iki ucuna yayılıp okunmaz hâle geliyordu; boşluk artık her
                kırılma noktasında birlikte büyüyor (16 → 24 → 32 piksel). */}
            {/* `<main>` ve `<h1>` YOKTU: ekran okuyucu kullanıcısı içeriğe
                atlayamıyor, sayfanın hangi bölüm olduğunu duyamıyordu.
                Başlık görsel olarak gizli — arayüzde marka görseli ve sekme
                adı zaten yazılı, ikinci kez yazmak görsel kirlilik olurdu. */}
            <main id="ana-icerik" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 transition-all duration-yavas">
                <h1 className="sr-only">
                    {(BOLUMLER[bolum]?.ad || 'Koçluk Paneli')}
                    {' — '}
                    {bolumGruplari.flatMap((g) => g.items).find((t) => t.id === activeTab)?.label || 'Genel'}
                </h1>
                {/* Not: bu sarmalayıcıda opacity animasyonu VARDI ve bir
                    "stacking context" yaratıyordu; sekme içinden açılan modaller
                    (BEP plan motoru gibi) o bağlama hapsolup arkadaki içeriğin
                    altında kalıyor, kapatma butonuna tıklanamıyordu. */}
                {!isProgramBuilderOpen && (
                    <div>
                        {/* Bir sekme çökerse yalnızca o bölüm düşer; üst şerit,
                            gezinme ve diğer sekmeler ayakta kalır. Eskiden tek
                            bileşen hatası tüm uygulamayı beyaz ekrana düşürüyordu. */}
                        <BolumHataSiniri bolumAdi="Bu bölüm" key={activeTab}>
                        {/* 📋 BUGÜN — koçun günlük iş listesi (açılış ekranı) */}
                        {activeTab === 'bugun' && (
                            <KocBugun
                                kullanici={user}
                                ogrenciler={students}
                                mesajlar={safeParse('messages', [])}
                                randevular={safeParse('appointments', [])}
                                /**
                                 * ⚠️ BURADA `|| s.approved === false` VARDI ve REDDEDİLEN
                                 * kaydı da "onay bekliyor" sayıyordu: reddedilen öğrencide
                                 * `approvalStatus='reddedildi'` ile birlikte `approved=false`
                                 * de duruyor. Sonuç: Onay Merkezi "Onay Bekliyor 0,
                                 * Reddedildi 1" derken bu kart "1 kayıt onayını bekliyor"
                                 * diyordu; koç karta tıklayıp boş liste görüyordu.
                                 *
                                 * Artık tek doğruluk kaynağı `onayDurumu` — Onay Merkezi de
                                 * aynı işlevi kullanıyor, iki ekran artık aynı sayıyı verir.
                                 */
                                onaylar={students.filter((s) => onayDurumu(s) === 'bekliyor')}
                                onOgrenciAc={(s) => navigate(`/coach/student/${s.id}`)}
                                onGit={(id) => { setActiveTab(id); okundu(id); }}
                            />
                        )}

                        {/* 📊 ANALİZ MERKEZİ — özet, risk, sıralama, hedefler, grafikler tek yerde */}
                        {activeTab === 'analysis' && (
                            <AnalysisCenter
                                students={students}
                                setToast={setToast}
                                renderOverview={() => (
                                    <OverviewTab
                                        students={students}
                                        navigate={navigate}
                                        setToast={setToast}
                                        onEdit={openEditStudent}
                                        onDelete={handleDeleteStudent}
                                        onAssignTask={() => setIsTaskAssignModalOpen(true)}
                                        onSendMessage={() => setShowBulkMessage(true)}
                                        onGoToRiskTab={() => { try { localStorage.setItem('section_tab_analysis', 'risk'); } catch { /* ignore */ } window.location.reload(); }}
                                        onClearAll={handleClearList}
                                        onUploadExcel={() => document.getElementById('studentListUpload')?.click()}
                                        onWhatsApp={(s) => setWhatsAppTarget(s)}
                                    />
                                )}
                                RiskAlarmPanel={RiskAlarmPanel}
                                StudentComparisonTable={StudentComparisonTable}
                                StudentProgressComparison={StudentProgressComparison}
                                ClassRanking={ClassRanking}
                                GoalComparisonPanel={GoalComparisonPanel}
                                StudentGoalsPanel={StudentGoalsPanel}
                                AnalyticsTab={AnalyticsTab}
                                AICoachButton={AICoachButton}
                            />
                        )}
                        {activeTab === 'programs' && <ProgramsTab students={students} setToast={setToast} onOpenProgramBuilder={() => { setSelectedStudentForProgram(null); setIsProgramBuilderOpen(true); }} onOpenProgramBuilderForStudent={(student) => { setSelectedStudentForProgram(student); setIsProgramBuilderOpen(true); }} />}
                        {activeTab === 'exams' && (
                            <div className="space-y-8">
                                <AdvancedExamsTab students={students} setToast={setToast} onOpenProgramBuilder={() => setIsProgramBuilderOpen(true)} />
                            </div>
                        )}
                        {/* 🧠 REHBERLİK MERKEZİ — servis, testler, sosyometri, PDR, BEP */}
                        {activeTab === 'guidance' && (
                            <GuidanceCenter
                                students={students}
                                setToast={setToast}
                                GuidanceServiceTab={GuidanceServiceTab}
                                TestsTab={TestsTab}
                                onAssignTask={(student) => { setTaskPreselect(student || null); setIsTaskAssignModalOpen(true); }}
                                SociometryNetworkMap={SociometryNetworkMap}
                                WorkflowTab={WorkflowTab}
                                BEPGenerator={BEPGenerator}
                                AICoachButton={AICoachButton}
                            />
                        )}
                        {/* ══════════════════════════════════════════════════
                            🗂️ REHBERLİK SERVİSİ — 10 RESMÎ DOSYA

                            Her dosya kendi sekmesinde açılır. Dosyayı besleyen
                            çalışma araçları o dosyanın İÇİNDE alt sekme olarak
                            durur; danışman çalışmayı yaptığı yerde dosyalar.
                           ══════════════════════════════════════════════════ */}
                        {activeTab?.startsWith('pdr-') && (
                            <DecimalFolderTab
                                key={activeTab}
                                klasorNo={activeTab.slice(4)}
                                setToast={setToast}
                                user={user}
                                moduller={pdrModulleri[activeTab.slice(4)] || []}
                            />
                        )}
                        {activeTab === 'coaches' && <ManageCoachesTab setToast={setToast} />}
                        {/* ✅ Onay merkezi — koç, öğrenci ve veli için bireysel + toplu onay */}
                        {activeTab === 'approvals' && <ApprovalCenter user={user} setToast={setToast} />}
                        {/* 🧑‍🏫 Koç görevleri — ana koç atar, koç kendine düşeni görür */}
                        {/* 🎟️ Kupon yönetimi — koçun özel indirim kodları */}
                        {activeTab === 'coupons' && <CouponManager user={user} setToast={setToast} />}
                        {/* 🔗 Öğrenci davetleri — link/QR ile katılım
                            Gelen talepler üstte: koçun ilk işi karar vermek,
                            yeni davet üretmek ikinci sırada. */}
                        {activeTab === 'invites' && (
                            <div className="space-y-6">
                                {/* Onaylanan öğrenci `coach_students`'a yazılıp storage
                                    olayı tetikliyor; liste kendiliğinden tazeleniyor. */}
                                <KatilimTalepleri user={user} setToast={setToast} />
                                <div className="border-t border-line pt-6">
                                    <InviteManager user={user} setToast={setToast} />
                                </div>
                            </div>
                        )}
                        {activeTab === 'coach-tasks' && (
                            <CoachTaskCenter
                                user={user}
                                setToast={setToast}
                                sekmeler={GOREV_SEKMELERI}
                                onSekmeyeGit={(hedefBolum, hedefSekme) => {
                                    setBolum(hedefBolum);
                                    setActiveTab(hedefSekme);
                                }}
                            />
                        )}

                        {/* NEW WORKING TABS */}
                        {activeTab === 'groups' && <GroupsTab students={students} setToast={setToast} bolum={bolum} />}
                        {activeTab === 'projects' && <ProjectsTab students={students} setToast={setToast} />}
                        {activeTab === 'leaderboard' && <LeaderboardTab students={students} />}
                        {activeTab === 'presentations' && <PresentationsTab students={students} setToast={setToast} />}
                        {activeTab === 'whatsapp' && <WhatsAppTab students={students} coachName={user?.name || ''} />}
                        {activeTab === 'remote' && <RemoteCoachingTab students={students} setToast={setToast} />}
                        { activeTab === 'material' && <MaterialTab setToast={setToast} /> }
                        { activeTab === 'teacher-scheduler' && <TeacherSchedulerTab /> }
                        { activeTab === 'university-scores' && <UniversityScoresTab /> }

                        {/* 🌟 PREMIUM MODÜLLER */}
                        {activeTab === 'self-assessment' && <CoachSelfAssessmentView students={students} />}
                        {activeTab === 'pomodoro-tracker' && <CoachPomodoroView students={students} />}
                        {/* Randevu ortak sekme: aynı bileşen iki bölümde de var,
                            ama saatler bölüme etiketlenip ayrı gösteriliyor. */}
                        {activeTab === 'appointments' && (
                            <CoachAppointmentManager
                                students={students}
                                coachId={user?.id}
                                coachName={user?.name || ''}
                                bolum={bolum}
                            />
                        )}
                        {activeTab === 'task-templates' && (
                            <TaskTemplates students={students} setToast={setToast} />
                        )}
                    </BolumHataSiniri>
                    </div>
                )}
            </main>

            {/* Modals */}
            {isStudentModalOpen && (
                <StudentModal
                    student={editingStudent}
                    onClose={() => { setIsStudentModalOpen(false); setEditingStudent(null); }}
                    onSave={handleSaveStudent}
                />
            )}
            {isProgramBuilderOpen && (
                <ProgramBuilderModal
                    studentId={selectedStudentForProgram?.id}
                    studentName={selectedStudentForProgram?.name}
                    onClose={() => { setIsProgramBuilderOpen(false); setSelectedStudentForProgram(null); }}
                />
            )}
            {showSettings && isMasterCoach && (
                <SettingsModal onClose={() => setShowSettings(false)} />
            )}
            {isTaskAssignModalOpen && (
                <TaskAssignModal
                    isOpen={isTaskAssignModalOpen}
                    onClose={() => { setIsTaskAssignModalOpen(false); setTaskPreselect(null); }}
                    students={students}
                    preSelectedStudentId={taskPreselect?.id ?? null}
                    onAssign={handleAssignTask}
                />
            )}
            {/* 📨 Toplu Mesaj Modalı */}
            {showBulkMessage && (
                <BulkMessageModal
                    onClose={() => setShowBulkMessage(false)}
                    students={students}
                    coachName={user?.name || 'Koçunuz'}
                />
            )}

            {/* 💬 Öğrenci kartından açılan hızlı WhatsApp gönderimi */}
            {whatsAppTarget && (
                <WhatsAppComposer
                    students={students}
                    preselectedIds={[whatsAppTarget.id]}
                    coachName={user?.name || ''}
                    onClose={() => setWhatsAppTarget(null)}
                />
            )}

            {/* 📱 Koç Mobil Alt Navigasyon */}
            {/* Alt çubuk, kenar çubuğuyla AYNI kaynaktan beslenir
                (`bolumGruplari` — yetkiye göre süzülmüş). Eskiden buraya
                elle yazılmış `overview`/`students` kimlikleri gönderiliyordu;
                koç panelinde böyle sekmeler olmadığı için dokunmak hiçbir
                şey yapmıyordu. */}
            <CoachBottomNav
                ogeler={mobilBirincilSekmeler}
                gruplar={mobilSekmeGruplari}
                aktif={activeTab}
                onDegis={(id) => { setActiveTab(id); okundu(id); }}
            />

            {/* 🆕 HIDDEN INPUTS FOR FUNCTIONALITY */}
            <input 
                id="studentListUpload" 
                type="file" 
                className="hidden" 
                accept=".xlsx,.xls" 
                onChange={handleStudentListUpload} 
            />
        </div>
    );
};

export default CoachDashboard;
