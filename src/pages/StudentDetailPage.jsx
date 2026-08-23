import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, TrendingUp, Brain, Target, MessageSquare, User,
    Calendar, Plus, BookOpen, CheckCircle, Clock, Edit2, Trash2, KeyRound, Users,
    FileText, Activity, X, Send, ClipboardList, Layers, BarChart2, Award
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    BarChart, Bar
} from 'recharts';
import { api } from '../services/api';
import GoalTracking from './GoalTracking';
import ProgramBuilderModal from '../components/ProgramBuilderModal';
import SubjectAnalysis from '../components/charts/SubjectAnalysis';
import StudentReportCard from '../components/coach/StudentReportCard';
import OgrenciAnalizPanosu from '../components/coach/OgrenciAnalizPanosu';
import ComparativeAnalysis from '../components/charts/ComparativeAnalysis';
import { onayla, bildir } from '../services/uiGeriBildirim';
import { hataAnlat } from '../services/hataMesaji';
import { useAuth } from '../context/AuthContext';
import { gorebilir } from '../services/accessControl';
import OgrenciGirisiAc from '../components/coach/OgrenciGirisiAc';
import ParentQRModal from '../components/student/ParentQRModal';
import Modal from '../components/ui/Modal';
import { yaz, listeOku, nesneOku } from '../services/veriDeposu';
import DenemeAnalizi from '../components/student/DenemeAnalizi';
import OgrenciVeriYonetimi from '../components/coach/OgrenciVeriYonetimi';

const StudentDetailPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    // State
    const [student, setStudent] = useState(null);
    const [activeTab, setActiveTab] = useState('karne');

    /**
     * Koç notu. Öğrenci başına ayrı anahtarda saklanır; sayfa açılınca
     * geri yüklenir. `notKaydedildi` düğmeyi geçici olarak kilitler —
     * koç arka arkaya basıp aynı notu iki kez yazamaz.
     */
    const [kocNotu, setKocNotu] = useState('');
    const [notKaydedildi, setNotKaydedildi] = useState(false);
    const [girisAcModal, setGirisAcModal] = useState(false);
    const [veliBaglantiModal, setVeliBaglantiModal] = useState(false);

    useEffect(() => {
        if (!id) return;
        try { setKocNotu(localStorage.getItem(`koc_notu_${id}`) || ''); }
        catch { setKocNotu(''); }
    }, [id]);

    /**
     * Öğrenciyi listeden siler.
     *
     * Sahiplik kontrolü zaten `loadAllData`'da yapıldı — bu sayfa
     * açılabiliyorsa koç bu öğrenciye yetkili demektir. Yine de silme
     * yıkıcı bir işlem olduğu için onay isteniyor ve öğrencinin adı
     * onay metninde yazıyor: yanlış kaydı silmek kolay olmasın.
     */
    const ogrenciyiSil = async () => {
        if (!student) return;
        const onaylandi = await onayla({
            baslik: `${student.name} silinecek`,
            mesaj: 'Öğrencinin kaydı listenizden kaldırılacak. Bu işlem geri alınamaz.',
            onayMetni: 'Evet, sil',
            tehlikeli: true,
        });
        if (!onaylandi) return;

        try {
            const hepsi = listeOku('coach_students');
            const kalan = hepsi.filter((s) => String(s?.id) !== String(id));
            localStorage.setItem('coach_students', JSON.stringify(kalan));
            // Panelin listesi anında tazelensin
            window.dispatchEvent(new StorageEvent('storage', { key: 'coach_students' }));
            window.firebaseSync?.syncKey?.('coach_students');
            bildir(`${student.name} silindi.`, 'basari');
            navigate('/coach/dashboard');
        } catch (e) {
            bildir(hataAnlat(e, 'kaydet'), 'hata');
        }
    };

    const notuKaydet = () => {
        const metin = kocNotu.trim();
        // Hızlı arka arkaya tıklamada React henüz yeniden çizmeden üç
        // çağrı birden geliyor ve aynı bildirim üst üste görünüyordu.
        // Kayıt zaten aynı sonucu veriyor; tekrar eden çağrı susturulur.
        if (!metin || notKaydedildi) return;
        try {
            localStorage.setItem(`koc_notu_${id}`, metin);
            window.firebaseSync?.syncKey?.(`koc_notu_${id}`);
            setNotKaydedildi(true);
            bildir('Not kaydedildi.', 'basari');
        } catch (e) {
            bildir(hataAnlat(e, 'kaydet'), 'hata');
        }
    };
    const [guidanceResults, setGuidanceResults] = useState(null);
    const [homeworks, setHomeworks] = useState([]);
    const [showHomeworkModal, setShowHomeworkModal] = useState(false);
    const [showProgramBuilder, setShowProgramBuilder] = useState(false);

    // Messaging State
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    const [target, setTarget] = useState('Tıp Fakültesi');
    const [isEditingTarget, setIsEditingTarget] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [programData, setProgramData] = useState({ schedule: {}, config: {} });
    const [prgWeek, setPrgWeek] = useState(1);
    const [prgMonth, setPrgMonth] = useState(1);
    const chatEndRef = useRef(null);
    // Öğrenci istatistikleri
    const [studentStats, setStudentStats] = useState({});
    const [studentTestResults, setStudentTestResults] = useState([]);
    const [examResults, setExamResults] = useState([]);

    // CRITICAL: Bu dizinin isimleri ProgramBuilderModal.jsx'teki DAYS ile birebir aynı olmalı!
    const DAYS_TR = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    const DAYS_LABEL = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

    /**
     * Net gelişim grafiği — GERÇEK deneme kayıtlarından.
     * Eski sürümde burada sabit (Ocak-Mayıs) örnek veri çiziliyordu;
     * koç, öğrencinin karnesinde uydurma bir grafik görüyordu.
     */
    const netGelisimi = React.useMemo(() => {
        const zaman = (r) => new Date(r.date || r.uploadedAt || 0).getTime();
        return [...examResults]
            .filter((r) => Number.isFinite(parseFloat(r.totalNet)))
            .sort((a, b) => zaman(a) - zaman(b))
            .slice(-10)
            .map((r) => ({
                name: r.name || r.trialName || new Date(zaman(r)).toLocaleDateString('tr-TR'),
                net: Math.round(parseFloat(r.totalNet) * 100) / 100,
            }));
    }, [examResults]);

    // Tüm verileri yükleyen merkezi fonksiyon
    const loadAllData = useCallback(() => {
        try {
            /**
             * 🔒 SAHİPLİK KONTROLÜ
             *
             * ⚠️ BURADA YETKİ KONTROLÜ YOKTU. Sayfa `coach_students`
             * listesinin TAMAMINI okuyup kimliğe göre eşleştiriyordu;
             * yani bir koç adres çubuğuna başka bir koçun öğrencisinin
             * kimliğini yazarak (`#/coach/student/<id>`) o öğrencinin
             * adına, denemelerine, programına, görevlerine ve koç
             * notlarına erişebiliyordu.
             *
             * Artık kayıt önce `gorebilir` süzgecinden geçer. Yetkisiz
             * erişimde "bulunamadı" denir — "yetkin yok" demek, o kimlikte
             * bir öğrencinin VAR olduğunu doğrulamak olurdu.
             */
            const allStudents = listeOku('coach_students');
            const aday = allStudents.find(s => s && s.id != null && String(s.id) === String(id));
            const found = aday && gorebilir(user, aday) ? aday : null;

            if (found) {
                setStudent(found);
                setTarget(found.target || 'Hedef Belirlenmedi');
            } else if (aday) {
                // Kayıt var ama bu koça ait değil — varlığını ele verme
                console.warn('Yetkisiz öğrenci erişimi engellendi.');
                setNotFound(true);
            } else {
                console.warn(`Student with id ${id} not found in coach_students.`);
                setNotFound(true);
            }

            // Rehberlik sonuçları
            const savedGuidance = localStorage.getItem('student_guidance_results');
            if (savedGuidance) {
                try { setGuidanceResults(JSON.parse(savedGuidance)); } catch { }
            }

            // Görevleri yükle
            const allTasks = nesneOku('student_tasks');
            setHomeworks(allTasks[id] || allTasks[String(id)] || []);

            // Programı yükle
            const scheduleKey = `program_schedule_${id}`;
            const configKey = `program_${id}_config`;
            const monthlyKey = `program_${id}_monthly_grid`;
            const schedData = localStorage.getItem(scheduleKey) || localStorage.getItem(monthlyKey);
            const configData = localStorage.getItem(configKey);
            if (schedData) {
                try {
                    setProgramData({
                        schedule: JSON.parse(schedData),
                        config: configData ? JSON.parse(configData) : { title: 'Çalışma Programı', dailySlotCount: 6 }
                    });
                } catch { }
            }

            // Öğrenci istatistikleri
            try {
                const stats = nesneOku(`user_stats_${id}`);
                const totalTime = parseInt(localStorage.getItem(`pomodoro_${id}_total`) || '0');
                const dailyKey2 = `pomodoro_${id}_daily_${new Date().toDateString()}`;
                const dailyPom = parseInt(localStorage.getItem(dailyKey2) || '0');
                setStudentStats({ ...stats, totalStudyTime: totalTime, dailyPomodoros: dailyPom });
            } catch { }

            // Test sonuçları
            try {
                const testRes = listeOku(`test_results_${id}`);
                setStudentTestResults(testRes);
            } catch { }

            // 📊 Deneme sonuçlarını yükle (YKS) - Gelişmiş eşleşme mantığı
            try {
                const v2Results = listeOku('v2_results_data');
                const v2Trials = listeOku('v2_trials_data');
                const legacyResults = listeOku('exams_data');

                const coachStudents2 = listeOku('coach_students');
                const curr = coachStudents2.find(s => s && s.id != null && String(s.id) === String(id));

                if (curr) {
                    const sName = (curr.name || '').toLowerCase().replace(/[İIıi]/g,'i').trim();
                    const sNum = String(curr.schoolNumber || curr.number || '').trim();

                    const filteredV2 = v2Results.filter(r => {
                        if (sNum && r.number && String(r.number).trim() === sNum) return true;
                        if (r.student) {
                            const rName = r.student.toLowerCase().replace(/[İIıi]/g,'i').trim();
                            if (rName === sName) return true;
                            if (sName && rName.includes(sName)) return true;
                        }
                        return false;
                    }).map(r => {
                        const trial = v2Trials.find(t => String(t.id) === String(r.trialId)) || {};
                        return {
                            ...r,
                            name: trial.name || r.name || 'Deneme',
                            date: r.uploadedAt || trial.date || r.date,
                            examType: r.examType || trial.examType || 'TYT',
                            totalNet: parseFloat(r.totalNet || r.tyt || 0)
                        };
                    });

                    const filteredLegacy = legacyResults.filter(r =>
                        (r.studentId && String(r.studentId) === String(id)) ||
                        (sNum && r.number && String(r.number).trim() === sNum) ||
                        (r.student && r.student.toLowerCase().replace(/[İIıi]/g,'i').trim() === sName)
                    );

                    const combined = [...filteredV2, ...filteredLegacy].sort((a, b) => new Date(a.date) - new Date(b.date));
                    setExamResults(combined);
                }
            } catch (e) { console.error('Exam load error:', e); }

        } catch (error) {
            console.error("Error loading student details:", error);
            setNotFound(true);
        }
    }, [id, user]);   // user: sahiplik kontrolü buna bağlı

    useEffect(() => {
        if (!id) return;
        loadAllData();
        loadMessages();

        // 📡 Cross-tab / Firebase real-time senkronizasyon
        const handleStorageUpdate = (e) => {
            if (!e.key || e.key.startsWith('_fbtime_')) return;
            if (e.key === 'coach_students' || e.key === 'student_tasks' ||
                e.key === 'v2_results_data' || e.key === 'v2_trials_data' ||
                e.key === 'exams_data' || e.key === 'student_messages' ||
                e.key?.startsWith(`program_schedule_${id}`) ||
                e.key?.startsWith(`program_${id}`)) {
                loadAllData();
                loadMessages();
            }
        };
        window.addEventListener('storage', handleStorageUpdate);
        return () => window.removeEventListener('storage', handleStorageUpdate);
    }, [id, loadAllData]);


    const loadMessages = async () => {
        try {
            const msgs = await api.messages.getMessages(id) || [];
            setMessages(msgs);
        } catch (error) {
            console.error("Error loading messages:", error);
        }
    };

    // Mesajları periyodik olarak yenile
    useEffect(() => {
        if (!id) return;
        const interval = setInterval(loadMessages, 5000);
        return () => clearInterval(interval);
    }, [id]);

    // Chat scroll
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const msg = {
                text: newMessage,
                sender: 'coach',
                senderName: 'Koç',
                timestamp: new Date().toISOString()
            };

            // API çağrısı - öğrenciye mesaj gönder
            await api.messages.sendMessage(id, msg);

            // Local state güncelle
            setMessages([...messages, msg]);
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleAddHomework = (e) => {
        e.preventDefault();
        const form = e.target;
        const newHomework = {
            id: Date.now(),
            title: form.title.value,
            subject: form.subject.value,
            dueDate: form.dueDate.value,
            status: 'Beklemede',
            isEditing: false,
            createdAt: new Date().toISOString(),
            studentId: id,
            studentName: student.name
        };

        const updatedHomeworks = [...homeworks, newHomework];
        setHomeworks(updatedHomeworks);

        // LocalStorage'a kaydet - öğrenciye ulaşsın (key her zaman string)
        const allTasks = nesneOku('student_tasks');
        const keyStr = String(id);
        if (!allTasks[keyStr]) allTasks[keyStr] = [];
        allTasks[keyStr].push(newHomework);
        // veriDeposu: yerel + arayüz olayı + BULUT. Eskiden yalnızca
        // localStorage'a yazıyordu; yorumdaki "öğrenciye ulaşsın" ancak
        // 2 dakikalık toplu turda gerçekleşiyor, koç sekmeyi kapatırsa
        // görev öğrenciye HİÇ ulaşmıyordu.
        yaz('student_tasks', allTasks);

        setShowHomeworkModal(false);
    };

    // Calculate Days Left
    const examDate = new Date('2025-06-20');
    const today = new Date();
    const daysLeft = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));

    if (notFound) {
        return (
            <div className="p-8 text-center text-ink-2 h-screen flex flex-col items-center justify-center">
                <p className="text-xl font-bold mb-4">Öğrenci Bulunamadı</p>
                <p className="mb-6">Aradığınız öğrenci sistemde kayıtlı değil veya silinmiş.</p>
                <button onClick={() => navigate('/coach/dashboard')} className="px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand-hover transition shadow-lg font-bold">
                    Koç Paneline Dön
                </button>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="p-8 text-center text-ink-2 h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 pb-20 max-w-7xl mx-auto animate-fade-in">

            {/* Back & Header */}
            <div className="flex items-center space-x-4 mb-4">
                <button onClick={() => navigate(-1)} className="p-2 bg-surface border border-line rounded-lg hover:bg-surface-2 transition shadow-sm">
                    <ChevronLeft size={20} className="text-ink-2" />
                </button>
                <div className="flex-1 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-ink">{student.name} {student.surname}</h1>
                        <p className="text-ink-2 text-sm">
                            {student.schoolNumber && <span>{student.schoolNumber}</span>}
                            {student.schoolNumber && (student.grade || student.section) && <span> • </span>}
                            {(student.grade || student.section) && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-brand-soft text-brand mr-1">
                                    {student.grade}{student.section ? `/${student.section}` : ''}
                                </span>
                            )}
                            {(student.grade || student.section) && <span>Şubesi</span>}
                        </p>
                    </div>

                    {/* ⚠️ ÖĞRENCİ SİLME BURADA YOKTU. Silme yalnızca koç
                        panelindeki tablo satırının en sağındaki simgedeydi;
                        koç bir öğrenciyi yönetmek için detay sayfasına
                        geliyor ve silecek bir şey bulamıyordu. */}
                    <div className="flex flex-wrap items-center gap-2 self-start">
                        {/* Elle eklenen öğrencinin sunucu kimliği yoktur ve
                            kendi cihazından giriş yapamaz. Bu düğme, mevcut
                            kaydını koruyarak ona giriş kimliği açar. */}
                        <button
                            type="button"
                            onClick={() => setGirisAcModal(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-dmd border border-brand/30 text-brand text-sm font-bold hover:bg-brand-soft transition-colors duration-hizli focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        >
                            <KeyRound size={15} /> Öğrenci Girişi Aç
                        </button>

                        {/* ⚠️ KOÇ PANELİNDE VELİ BAĞLANTISI ÜRETECEK EKRAN YOKTU.
                            Veli QR/paylaşım ekranı yalnızca ÖĞRENCİ panelinde
                            duruyordu; oysa bağlantıyı veliye gönderen taraf koç.
                            Koç veliye rapor göndermek istediğinde yapabileceği
                            hiçbir şey yoktu. */}
                        <button
                            type="button"
                            onClick={() => setVeliBaglantiModal(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-dmd border border-accent/30 text-accent text-sm font-bold hover:bg-accent-soft transition-colors duration-hizli focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                            <Users size={15} /> Veli Bağlantısı
                        </button>

                        <button
                            type="button"
                            onClick={ogrenciyiSil}
                            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-dmd border border-danger/30 text-danger text-sm font-bold hover:bg-danger-soft transition-colors duration-hizli focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                        >
                            <Trash2 size={15} /> Öğrenciyi Sil
                        </button>
                    </div>

                    {veliBaglantiModal && (
                        <ParentQRModal
                            student={student}
                            onClose={() => setVeliBaglantiModal(false)}
                        />
                    )}

                    {girisAcModal && (
                        <OgrenciGirisiAc
                            ogrenci={student}
                            onKapat={() => setGirisAcModal(false)}
                            setToast={(m) => bildir(m)}
                        />
                    )}

                    {/* Tab Switcher */}
                    <div className="bg-surface p-1 rounded-xl flex space-x-1 shadow-sm border border-line overflow-x-auto">
                        {[
                            { id: 'analiz', icon: Activity, label: 'Gelişim Analizi' },
                            { id: 'karne', icon: Award, label: 'Karne' },
                            { id: 'academic', icon: TrendingUp, label: 'Akademik' },
                            { id: 'program', icon: Calendar, label: 'Program' },
                            { id: 'guidance', icon: Brain, label: 'Envanterler' },
                            { id: 'messages', icon: MessageSquare, label: 'Mesajlar', badge: messages.filter(m => m.sender === 'student').length },
                            { id: 'goals', icon: Target, label: 'Hedefler' },
                            { id: 'stats', icon: Activity, label: 'İstatistikler' },
                            { id: 'tests', icon: ClipboardList, label: 'Test Sonuçları', badge: studentTestResults.length },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-1 ${activeTab === tab.id ? 'bg-brand-soft text-brand' : 'text-ink-2 hover:text-ink-2'
                                    }`}
                            >
                                <tab.icon size={14} /> {tab.label}
                                {tab.badge > 0 && (
                                    <span className="bg-danger text-white text-[9px] font-black rounded-full px-1 min-w-[14px] text-center">{tab.badge}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Sol Kolon: Profil Kartı (Sabit) */}
                <div className="space-y-6">
                    <div className="glass-card p-6 text-center relative overflow-hidden group">
                        <div className="on-color bg-gradient-to-r from-brand to-purple-600 h-28 absolute top-0 left-0 w-full"></div>
                        <div className="relative mt-12">
                            <div className="w-28 h-28 mx-auto bg-surface rounded-full p-1.5 shadow-xl">
                                <div className="w-full h-full bg-brand-soft rounded-full flex items-center justify-center text-4xl font-bold text-brand uppercase">
                                    {student.name.charAt(0)}
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-ink mt-4">{student.name}</h2>
                            {(student.grade || student.section) ? (
                                <p className="text-ink-2 font-medium text-sm">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-brand-soft text-brand">
                                        {student.grade}{student.section ? `/${student.section}` : ''}
                                    </span>
                                    {' '}Öğrencisi
                                </p>
                            ) : (
                                <p className="text-ink-2 font-medium text-sm">Öğrenci</p>
                            )}

                            <div className="mt-6 flex justify-center space-x-2">
                                <button
                                    onClick={() => { setActiveTab('messages'); loadMessages(); }}
                                    className="flex-1 flex items-center justify-center px-4 py-2 bg-brand-soft text-brand rounded-xl text-sm font-bold hover:bg-brand-soft transition"
                                >
                                    <MessageSquare size={18} className="mr-2" />
                                    Mesaj
                                </button>
                                <button className="flex-1 flex items-center justify-center px-4 py-2 bg-surface-2 text-ink-2 rounded-xl text-sm font-bold hover:bg-surface-3 transition">
                                    <User size={18} className="mr-2" />
                                    Profil
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 border-t border-line pt-6 text-left space-y-4">
                            {(student.grade || student.section) && (
                                <div className="flex justify-between items-center">
                                    <span className="text-ink-3 text-xs uppercase font-bold tracking-wider">Sınıf / Şube</span>
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-brand-soft text-brand">
                                        {student.grade}{student.section ? `/${student.section}` : ''}
                                    </span>
                                </div>
                            )}
                            {student.schoolNumber && (
                                <div className="flex justify-between items-center">
                                    <span className="text-ink-3 text-xs uppercase font-bold tracking-wider">Okul No</span>
                                    <span className="font-bold text-ink-2 text-sm">{student.schoolNumber}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center group">
                                <span className="text-ink-3 text-xs uppercase font-bold tracking-wider">Hedef</span>
                                {isEditingTarget ? (
                                    <input
                                        type="text"
                                        value={target}
                                        onChange={(e) => setTarget(e.target.value)}
                                        onBlur={() => setIsEditingTarget(false)}
                                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingTarget(false)}
                                        autoFocus
                                        className="font-bold text-ink text-sm border-b border-brand outline-none bg-transparent w-32"
                                    />
                                ) : (
                                    <span
                                        onClick={() => setIsEditingTarget(true)}
                                        className="font-bold text-ink text-sm cursor-pointer hover:text-brand hover:bg-surface-2 px-2 py-0.5 rounded transition"
                                        title="Düzenlemek için tıklayın"
                                    >
                                        {target}
                                    </span>
                                )}
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-ink-3 text-xs uppercase font-bold tracking-wider">Sınava Kalan</span>
                                <span className="font-bold text-brand bg-brand-soft px-2 py-0.5 rounded text-sm">{daysLeft} Gün</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-ink-3 text-xs uppercase font-bold tracking-wider">Durum</span>
                                <span className="font-bold text-ok bg-ok-soft px-2 py-0.5 rounded text-sm">Aktif Takipte</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        {/* ⚠️ BU ALAN TAMAMEN ÖLÜYDÜ: textarea'da `value`/`onChange`,
                            düğmede `onClick` YOKTU. Koç not yazıp "Kaydet"e
                            basıyor, hiçbir şey olmuyordu — ne kayıt, ne hata,
                            ne geri bildirim; yazılan not sayfadan çıkınca
                            kayboluyordu. */}
                        <h3 className="font-bold text-ink mb-4">Koç Notları</h3>
                        <label htmlFor="koc-notu" className="sr-only">Öğrenci hakkında koç notu</label>
                        <textarea
                            id="koc-notu"
                            value={kocNotu}
                            onChange={(e) => { setKocNotu(e.target.value); setNotKaydedildi(false); }}
                            className="w-full h-32 p-3 bg-surface-2 border border-line rounded-xl focus:ring-2 focus:ring-brand focus:outline-none text-sm resize-none"
                            placeholder="Öğrenci ile ilgili özel notlarınızı buraya alın..."
                        ></textarea>
                        <button
                            type="button"
                            onClick={notuKaydet}
                            disabled={!kocNotu.trim() || notKaydedildi}
                            className="mt-2 w-full py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-hover transition disabled:bg-disabled disabled:text-disabled-ink disabled:cursor-not-allowed"
                        >
                            {notKaydedildi ? '✓ Kaydedildi' : 'Notu Kaydet'}
                        </button>
                    </div>

                    {/* Program Oluşturma Araçları */}
                    <div className="glass-card p-6 border-l-4 border-l-green-500">
                        <h3 className="font-bold text-ink mb-4 flex items-center">
                            <Calendar className="mr-2 text-ok" size={20} />
                            Program Oluştur
                        </h3>
                        {/* Only one big button now to open the Advanced Builder */}
                        <div className="space-y-3">
                            <button
                                onClick={() => setShowProgramBuilder(true)}
                                className="w-full flex items-center justify-between px-4 py-4 bg-gradient-to-r from-green-50 to-green-100 border border-ok rounded-xl hover:shadow-lg transition group"
                            >
                                <div>
                                    <span className="block text-lg font-bold text-ok mb-1">Verimli Planlayıcı</span>
                                    <span className="text-xs text-ok block">Sayısal/Sözel dengeli, akıllı dağıtım</span>
                                </div>
                                <div className="bg-surface p-2 rounded-full shadow-sm">
                                    <Plus size={24} className="text-ok group-hover:scale-110 transition" />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sağ kolon: sekme içerikleri.
                    Eskiden bu blok ızgaranın doğrudan çocuğuydu ve col-span
                    almadığı için 3 kolonun YALNIZCA BİRİNİ kaplıyordu; karne
                    dar bir şeride sıkışıp sağda geniş boşluk kalıyordu. */}
                <div className="lg:col-span-2 space-y-6">

                {/* --- PROGRAM SEKMESİ --- */}
                {activeTab === 'program' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden">
                            <div className="on-color bg-gradient-to-r from-green-500 to-emerald-600 p-5 text-ink">
                                <h3 className="font-black text-xl flex items-center gap-2">
                                    <Calendar size={22} />
                                    {programData.config?.title || 'Çalışma Programı'}
                                </h3>
                                <p className="text-ok text-sm mt-1">Koçun tarafından oluşturulan haftalık program</p>
                            </div>
                            {Object.keys(programData.schedule).length === 0 ? (
                                <div className="p-16 text-center">
                                    <Calendar size={48} className="mx-auto text-ink-3 mb-4" />
                                    <p className="text-ink-2 font-semibold">Henüz program oluşturulmadı.</p>
                                    <p className="text-ink-3 text-sm mt-1">Sol paneldeki "Verimli Planlayıcı" ile bir program oluşturun.</p>
                                    <button
                                        onClick={() => setShowProgramBuilder(true)}
                                        className="mt-4 px-6 py-3 bg-ok text-white rounded-xl font-bold hover:bg-ok transition"
                                    >Yeni Program Oluştur</button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto p-4">
                                    <div className="min-w-[500px]">
                                        {/* Ay + Hafta seçici */}
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {Array.from({ length: Number(programData.config?.programDurationMonths) || 1 }, (_, i) => i + 1).map(m => (
                                                <button
                                                    key={m}
                                                    onClick={() => { setPrgMonth(m); setPrgWeek(1); }}
                                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${prgMonth === m ? 'bg-ok text-ink' : 'bg-surface-3 text-ink-2 hover:bg-ok-soft'}`}
                                                >{m}. Ay</button>
                                            ))}
                                        </div>
                                        <div className="flex gap-2 mb-4">
                                            {[1, 2, 3, 4].map(w => (
                                                <button
                                                    key={w}
                                                    onClick={() => setPrgWeek(w)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${prgWeek === w ? 'bg-ok text-ink' : 'bg-surface-3 text-ink-2 hover:bg-ok-soft'}`}
                                                >{w}. Hafta</button>
                                            ))}
                                        </div>
                                        <div
                                            className="grid border-2 border-line rounded-xl overflow-hidden"
                                            style={{ gridTemplateColumns: `50px repeat(7, 1fr)` }}
                                        >
                                            <div className="bg-surface-inv text-white text-[10px] font-bold p-1.5 text-center">Etüt</div>
                                            {DAYS_LABEL.map(d => (
                                                <div key={d} className="bg-surface-3 text-ink-2 text-[10px] font-bold p-1.5 text-center border-l border-line">{d}</div>
                                            ))}
                                            {Array.from({ length: Number(programData.config?.dailySlotCount) || 6 }).map((_, slotIdx) => (
                                                <React.Fragment key={slotIdx}>
                                                    <div className="bg-surface-2 text-ink-2 text-[10px] font-semibold p-1 text-center border-b border-r border-line">{slotIdx + 1}.</div>
                                                    {DAYS_TR.map(day => {
                                                        // ProgramBuilderModal aynı key formatını kullanıyor: m{ay}-w{hafta}-{gün}-{slot}
                                                        const cellKey = `m${prgMonth}-w${prgWeek}-${day}-${slotIdx}`;
                                                        const cell = programData.schedule[cellKey];
                                                        return (
                                                            <div key={day} className={`border-b border-r border-line min-h-[44px] p-0.5 ${cell ? cell.color || 'bg-ok-soft' : ''}`}>
                                                                {cell && (
                                                                    <div className="text-center h-full flex flex-col justify-center">
                                                                        <span className="text-[8px] font-bold opacity-60 uppercase leading-tight">{String(cell.subject || '')}</span>
                                                                        <span className="text-[9px] font-black leading-tight">{String(cell.topic || '')}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- MESAJLAR SEKMESİ --- */}
                {activeTab === 'messages' && (
                    <div className="animate-fade-in">
                        <div className="bg-surface rounded-2xl border border-line shadow-sm flex flex-col" style={{ height: '520px' }}>
                            <div className="bg-brand p-4 text-white rounded-t-2xl flex items-center gap-3">
                                <div className="w-9 h-9 bg-surface/20 rounded-full flex items-center justify-center">
                                    <User size={18} />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{student.name}</p>
                                    <p className="text-brand text-xs">Öğrenci Mesajlaşma Kanalı</p>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-2">
                                {messages.length === 0 ? (
                                    <div className="text-center mt-16">
                                        <MessageSquare size={40} className="text-ink-3 mx-auto mb-3" />
                                        <p className="text-ink-3 text-sm">Henüz mesaj yok.</p>
                                    </div>
                                ) : messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.sender === 'coach' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[78%] p-3 rounded-2xl text-sm ${msg.sender === 'coach'
                                            ? 'bg-brand text-white rounded-br-none'
                                            : 'bg-surface border border-line text-ink rounded-bl-none shadow-sm'
                                            }`}>
                                            {msg.sender !== 'coach' && (
                                                <p className="text-xs font-bold text-brand mb-0.5">{msg.senderName || student.name}</p>
                                            )}
                                            <p>{msg.text}</p>
                                            <span className="text-[10px] opacity-60 block mt-1">
                                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                            <form onSubmit={handleSendMessage} className="p-3 bg-surface border-t border-line flex gap-2 rounded-b-2xl">
                                <input
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder="Öğrenciye mesaj gönder..."
                                    className="flex-1 bg-surface-3 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                                <button type="submit" disabled={!newMessage.trim()} className="p-2.5 bg-brand text-white rounded-full hover:bg-brand-hover disabled:opacity-40 transition">
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* --- GELİŞİM ANALİZİ — mevcut verilerden anlık türetilir --- */}
                {activeTab === 'analiz' && student && (
                    <div className="animate-fade-in">
                        <OgrenciAnalizPanosu ogrenci={student} />
                    </div>
                )}

                {/* --- AKADEMİK SEKME --- */}
                {activeTab === 'karne' && student && (
                    <div className="animate-fade-in">
                        <StudentReportCard student={student} />
                    </div>
                )}

                {activeTab === 'academic' && (
                    <div className="space-y-8 animate-fade-in">
                        {/* Net gelişimi — öğrencinin gerçek deneme kayıtları */}
                        {netGelisimi.length >= 2 && (
                            <div className="glass-card p-6">
                                <h3 className="text-lg font-bold text-ink mb-6 flex items-center">
                                    <TrendingUp className="mr-2 text-brand" size={20} />
                                    Net Gelişimi (Son {netGelisimi.length} Deneme)
                                </h3>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={netGelisimi}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                                            <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--line)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Line type="monotone" dataKey="net" stroke="var(--brand)" strokeWidth={3} dot={{ r: 4, fill: 'var(--brand)' }} activeDot={{ r: 6 }} name="Toplam Net" animationDuration={300} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Gelişmiş Deneme Analizleri */}
                        <div className="space-y-8">
                            <h3 className="text-xl font-black text-ink flex items-center gap-2 border-b border-line pb-4">
                                <BarChart2 size={24} className="text-brand" />
                                Detaylı Deneme Analizi
                            </h3>
                            
                            {examResults.length > 0 ? (
                                <>
                                    <ComparativeAnalysis studentResults={examResults} />
                                    <SubjectAnalysis results={examResults} />
                                </>
                            ) : (
                                <div className="bg-surface-2 border-2 border-dashed border-line rounded-3xl p-12 text-center">
                                    <p className="text-ink-3 font-medium">Bu öğrenciye ait henüz deneme sınavı kaydı bulunamadı.</p>
                                    <p className="text-xs text-ink-3 mt-2">Denemeler tabından veri ekleyebilirsiniz.</p>
                                </div>
                            )}
                        </div>

                        {/* Öğrencinin kendi girdiği deneme analizleri —
                            koç bu analize eskiden karneden ulaşamıyordu.
                            (Sabit verili PerformanceHeatmap kaldırıldı.) */}
                        <div className="glass-card p-6">
                            <DenemeAnalizi ogrenci={student} studentId={student?.id} bakis="koc" />
                        </div>

                        {/* Kayıt yönetimi — günlük/hata/deneme kayıtlarını
                            onaylı ve senkronlu silme (ölü import'tu, bağlandı). */}
                        <OgrenciVeriYonetimi student={student} />

                        {/* Ödevler Listesi */}
                        <div className="glass-card p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-ink flex items-center">
                                    <BookOpen className="mr-2 text-c4" size={20} />
                                    Atanan Görevler & Ödevler
                                </h3>
                                <button
                                    onClick={() => setShowHomeworkModal(true)}
                                    className="flex items-center px-3 py-1.5 bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] text-c4 rounded-lg text-sm font-medium hover:bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] transition"
                                >
                                    <Plus size={16} className="mr-1" />
                                    Yeni Görev
                                </button>
                            </div>

                            <div className="space-y-4">
                                {homeworks.map((hw) => (
                                    <div key={hw.id} className="flex items-center p-4 border border-line rounded-xl hover:border-[color-mix(in_srgb,var(--c4)_35%,transparent)] transition bg-surface group">
                                        <div className={`p-2 rounded-lg mr-4 ${hw.status === 'Tamamlandı' ? 'bg-ok-soft text-ok' : 'bg-surface-3 text-ink-2'}`}>
                                            {hw.status === 'Tamamlandı' ? <CheckCircle size={20} /> : <Clock size={20} />}
                                        </div>
                                        <div className="flex-1">
                                            {hw.isEditing ? (
                                                <div className="flex flex-col space-y-2">
                                                    <input
                                                        type="text"
                                                        defaultValue={hw.title}
                                                        onChange={(e) => {
                                                            const newHomeworks = homeworks.map(h => h.id === hw.id ? { ...h, title: e.target.value } : h);
                                                            setHomeworks(newHomeworks);
                                                        }}
                                                        className="text-sm font-semibold border border-[color-mix(in_srgb,var(--c4)_35%,transparent)] rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                    />
                                                    <div className="flex space-x-2">
                                                        <input
                                                            type="text"
                                                            defaultValue={hw.subject}
                                                            onChange={(e) => {
                                                                const newHomeworks = homeworks.map(h => h.id === hw.id ? { ...h, subject: e.target.value } : h);
                                                                setHomeworks(newHomeworks);
                                                            }}
                                                            className="text-xs border border-line-2 rounded px-2 py-1 w-24"
                                                        />
                                                        <input
                                                            type="date"
                                                            defaultValue={hw.dueDate}
                                                            onChange={(e) => {
                                                                const newHomeworks = homeworks.map(h => h.id === hw.id ? { ...h, dueDate: e.target.value } : h);
                                                                setHomeworks(newHomeworks);
                                                            }}
                                                            className="text-xs border border-line-2 rounded px-2 py-1"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <h4 className="font-semibold text-ink">{hw.title}</h4>
                                                    <p className="text-xs text-ink-2">{hw.subject} • Son Tarih: {hw.dueDate}</p>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {!hw.isEditing && (
                                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${hw.status === 'Tamamlandı' ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn'}`}>
                                                    {hw.status}
                                                </span>
                                            )}

                                            <button
                                                onClick={() => {
                                                    const newHomeworks = homeworks.map(h => h.id === hw.id ? { ...h, isEditing: !h.isEditing } : h);
                                                    setHomeworks(newHomeworks);
                                                }}
                                                className={`p-1.5 rounded-lg transition ${hw.isEditing ? 'bg-ok-soft text-ok hover:bg-green-200' : 'text-brand hover:text-brand hover:bg-brand-soft'} opacity-0 group-hover:opacity-100 focus:opacity-100`}
                                                title={hw.isEditing ? "Kaydet" : "Düzenle"}
                                            >
                                                {hw.isEditing ? <CheckCircle size={16} /> : <Edit2 size={16} />}
                                            </button>

                                            <button
                                                onClick={ async () => {
                                                    if (await onayla({ mesaj: 'Bu ödevi silmek istediğinize emin misiniz?', tehlikeli: true })) {
                                                        setHomeworks(homeworks.filter(h => h.id !== hw.id));
                                                    }
                                                }}
                                                className="text-danger hover:text-danger p-1 opacity-0 group-hover:opacity-100 transition hover:bg-danger-soft rounded-lg"
                                                title="Ödevi Sil"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}


                {/* --- REHBERLİK RAPORLARI SEKMESİ --- */}
                {activeTab === 'guidance' && (
                    <div className="space-y-8 animate-fade-in">
                        {!guidanceResults ? (
                            <div className="glass-card p-12 text-center text-ink-2">
                                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                <p>Henüz çözülmüş bir rehberlik testi bulunmuyor.</p>
                                <p className="text-sm">Öğrenci "Rehberlik" sayfasından test çözdükçe sonuçlar buraya düşecektir.</p>
                            </div>
                        ) : (
                            <>
                                {/* 1. Holland ve Çoklu Zeka Grafikleri */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    {/* Holland Radar Chart */}
                                    {guidanceResults.holland && (
                                        <div className="glass-card p-6">
                                            <h3 className="font-bold text-ink mb-4 flex items-center">
                                                <Brain className="mr-2 text-brand" size={20} /> Mesleki İlgi Alanları
                                            </h3>
                                            <div className="h-[250px] w-full relative" style={{ minHeight: '250px' }}>
                                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                                    <RadarChart outerRadius="80%" data={guidanceResults.holland.chartData}>
                                                        <PolarGrid />
                                                        <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
                                                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} />
                                                        <Radar name="Skor" dataKey="score" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.4}  animationDuration={300} />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <p className="text-sm text-ink-2 mt-2 text-center font-medium bg-brand-soft p-2 rounded-lg">
                                                {guidanceResults.holland.summary}
                                            </p>
                                        </div>
                                    )}

                                    {/* Çoklu Zeka Bar Chart */}
                                    {guidanceResults.multiple_intelligence && (
                                        <div className="glass-card p-6">
                                            <h3 className="font-bold text-ink mb-4 flex items-center">
                                                <Activity className="mr-2 text-danger" size={20} /> Zeka Türleri
                                            </h3>
                                            <div className="h-[250px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={guidanceResults.multiple_intelligence.chartData} layout="vertical" margin={{ left: 40 }}>
                                                        <CartesianGrid strokeDasharray="3 3" horizontal={false}  vertical={false} />
                                                        <XAxis type="number" hide />
                                                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                                                        <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '8px' }} />
                                                        <Bar dataKey="score" fill="var(--c5)" radius={[0, 4, 4, 0]} barSize={20}  animationDuration={300} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <p className="text-sm text-ink-2 mt-2 text-center font-medium bg-danger-soft p-2 rounded-lg">
                                                {guidanceResults.multiple_intelligence.summary}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* 2. Diğer Testlerin Sonuç Kartları */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {Object.entries(guidanceResults).map(([key, res]) => {
                                        if (key === 'holland' || key === 'multiple_intelligence') return null;
                                        return (
                                            <div key={key} className="glass-card p-6 border-l-4 border-l-indigo-500 relative group">
                                                <button
                                                    onClick={ async () => {
                                                        if (await onayla({ mesaj: 'Bu raporu silmek istediğinize emin misiniz?', tehlikeli: true })) {
                                                            const newResults = { ...guidanceResults };
                                                            delete newResults[key];
                                                            setGuidanceResults(newResults);
                                                        }
                                                    }}
                                                    className="absolute top-4 right-4 text-danger hover:text-danger opacity-0 group-hover:opacity-100 transition p-1"
                                                    title="Raporu Sil"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-ink">{res.testName}</h4>
                                                    <span className="text-xs text-ink-3">{new Date(res.date).toLocaleDateString()}</span>
                                                </div>
                                                <div className="text-2xl font-bold text-brand mb-2">{res.summary}</div>
                                                <p className="text-sm text-ink-2">{res.detail}</p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* --- HEDEFLER SEKMESİ --- */}
                {activeTab === 'goals' && (
                    <GoalTracking />
                )}

                {/* --- İSTATİSTİKLER SEKMESİ (Koç görünümü) --- */}
                {activeTab === 'stats' && (
                    <div className="animate-fade-in space-y-6">
                        <h2 className="text-xl font-black text-ink flex items-center gap-2">
                            <Activity size={20} className="text-brand" />
                            {student.name} — Öğrenci İstatistikleri
                        </h2>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {[
                                { icon: '🔥', label: 'Günlük Seri', value: `${studentStats.currentStreak || 0} Gün`, bg: 'bg-warn-soft', text: 'text-warn' },
                                { icon: '⭐', label: 'Toplam XP', value: studentStats.totalXP || 0, bg: 'bg-warn-soft', text: 'text-warn' },
                                { icon: '🏆', label: 'En Uzun Seri', value: `${studentStats.maxStreak || 0} Gün`, bg: 'bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))]', text: 'text-c4' },
                                { icon: '⏱️', label: 'Toplam Çalışma', value: `${Math.floor((studentStats.totalStudyTime || 0) / 60)}s ${(studentStats.totalStudyTime || 0) % 60}dk`, bg: 'bg-info-soft', text: 'text-info' },
                                { icon: '🎯', label: 'Günlük Pomodoro', value: studentStats.dailyPomodoros || 0, bg: 'bg-ok-soft', text: 'text-ok' },
                                { icon: '📊', label: 'Seviye', value: `Sv.${studentStats.totalXP ? Math.floor(studentStats.totalXP / 100) + 1 : 1}`, bg: 'bg-brand-soft', text: 'text-brand' },
                            ].map((card, i) => (
                                <div key={i} className={`${card.bg} rounded-2xl p-4 shadow-sm border border-white flex items-center gap-3`}>
                                    <span className="text-2xl">{card.icon}</span>
                                    <div>
                                        <p className="text-xs text-ink-2 font-medium">{card.label}</p>
                                        <p className={`text-lg font-black ${card.text}`}>{card.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {(studentStats.totalStudyTime || 0) === 0 && (studentStats.totalXP || 0) === 0 && (
                            <div className="bg-surface rounded-2xl p-8 text-center border border-dashed border-line">
                                <p className="text-3xl mb-2">📊</p>
                                <p className="text-ink-2 font-medium">Öğrenci henüz uygulama içinde aktif değil.</p>
                                <p className="text-xs text-ink-3 mt-1">Veri oluştuğunda burada görünecek.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* --- TEST SONUÇLARI SEKMESİ (Koç görünümü) --- */}
                {activeTab === 'tests' && (
                    <div className="animate-fade-in space-y-4">
                        <h2 className="text-xl font-black text-ink flex items-center gap-2">
                            <ClipboardList size={20} className="text-brand" />
                            {student.name} — Test Sonuçları
                        </h2>

                        {studentTestResults.length === 0 ? (
                            <div className="bg-surface rounded-2xl p-12 text-center border border-dashed border-line">
                                <p className="text-3xl mb-2">🧠</p>
                                <p className="text-ink-2 font-medium">Henüz tamamlanmış test yok</p>
                                <p className="text-xs text-ink-3 mt-1">Öğrenci test tamamladığında sonuçlar burada görünür.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {studentTestResults.map((r, idx) => (
                                    <div key={idx} className="bg-surface rounded-xl p-4 shadow-sm border border-line flex items-center gap-4">
                                        <div className="on-color w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center text-ink text-lg font-bold flex-shrink-0">
                                            ✓
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-ink truncate">{r.testTitle || 'Test'}</p>
                                            <p className="text-xs text-ink-2">{r.date ? new Date(r.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <span className="inline-block bg-brand-soft text-brand px-3 py-1 rounded-lg text-sm font-bold">
                                                {r.level || 'Tamamlandı'}
                                            </span>
                                            {r.comment && (
                                                <p className="text-xs text-ink-3 mt-1 max-w-[160px] truncate" title={r.comment}>{r.comment}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                </div>

                {/* Ödev Atama Modalı */}
                {
                    showHomeworkModal && (
                        <Modal
                            acik
                            onClose={() => setShowHomeworkModal(false)}
                            baslikGizle
                            genislik="md"
                            govdeClassName="p-6"
                        >
                            <h3 className="text-xl font-bold text-ink mb-4">Yeni Görev Ata</h3>
                            <form onSubmit={handleAddHomework} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-ink-2 mb-1">Ders / Konu</label>
                                    <select name="subject" className="w-full p-2 border border-line-2 rounded-lg focus:ring-2 focus:ring-brand outline-none">
                                        <option>Matematik</option>
                                        <option>Fizik</option>
                                        <option>Kimya</option>
                                        <option>Türkçe</option>
                                        <option>Geometri</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-ink-2 mb-1">Görev Başlığı</label>
                                    <input required name="title" type="text" placeholder="Örn: 50 Soru Çözümü" className="w-full p-2 border border-line-2 rounded-lg focus:ring-2 focus:ring-brand outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-ink-2 mb-1">Son Tarih</label>
                                    <input required name="dueDate" type="date" className="w-full p-2 border border-line-2 rounded-lg focus:ring-2 focus:ring-brand outline-none" />
                                </div>
                                <div className="pencere-alt-cubuk bg-surface flex space-x-3 pt-4">
                                    <button type="button" onClick={() => setShowHomeworkModal(false)} className="flex-1 py-2 bg-surface-3 text-ink-2 rounded-xl font-medium hover:bg-surface-3 transition">
                                        İptal
                                    </button>
                                    <button type="submit" className="flex-1 py-2 bg-brand text-white rounded-xl font-medium hover:bg-brand-hover transition">
                                        Görevi Ata
                                    </button>
                                </div>
                            </form>
                        </Modal>
                    )
                }

                {/* Program Builder Modal */}
                {
                    showProgramBuilder && (
                        <ProgramBuilderModal
                            studentId={id}
                            studentName={student.name}
                            onClose={() => {
                                setShowProgramBuilder(false);
                                const s = localStorage.getItem(`program_schedule_${id}`) || localStorage.getItem(`program_${id}_monthly_grid`);
                                const c = localStorage.getItem(`program_${id}_config`);
                                if (s) setProgramData({ schedule: JSON.parse(s), config: c ? JSON.parse(c) : { title: 'Çalışma Programı', dailySlotCount: 6 } });
                            }}
                        />
                    )
                }

            </div>
        </div >
    );
};

export default StudentDetailPage;
