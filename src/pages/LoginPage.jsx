import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Brain, User, Users, ArrowRight, School, Phone, Hash,
    UserPlus, Smartphone, Monitor, Apple, Mail, ShieldCheck,
    Laptop, CheckCircle, RefreshCw, Lock, AlertTriangle, Timer,
    ChevronLeft, ChevronRight, Star, Zap, BookOpen, BarChart2,
    ClipboardList, MessageSquare, Trophy, Target, Calendar,
    FileText, TrendingUp, Activity, Shield, Package, Check, X, PlayCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StudentRegisterModal from '../components/StudentRegisterModal';
import {
    sendMagicLinkToCoach,
    completeMagicLinkSignIn,
    isDeviceTrusted,
    trustThisDevice,
    saveCoachEmail,
    getCoachEmail,
} from '../services/twoFactorAuth';
import {
    checkLoginLock,
    recordFailedAttempt,
    resetLoginAttempts,
    sanitizePhone,
    sanitizeName,
    isValidEmail,
    logSuspiciousActivity,
    isUnusualLoginTime,
} from '../services/securityService';
import { PLANLAR, ogrenciBasiAylik, sezonBilgisi, DENEME_GUN, tl } from '../data/pricingPlans';
import MARKA from '../data/marka';
import coupons from '../services/couponService';
import { girisDemo, demoyuTemizle, DEMO_KULLANICI } from '../services/demoService';
import credential from '../services/credentialService';

const SEZON = sezonBilgisi();

// ─── Uygulama ekranları / showcase verileri ────────────────────────────
const APP_SCREENS = [
    {
        id: 'coach-overview',
        role: 'coach',
        label: 'Koç Paneli',
        title: 'Öğrenci Takip & Analitik',
        desc: 'Tüm öğrencilerinizi tek ekrandan takip edin. Net trendleri, görev tamamlama oranları ve riskli öğrenci uyarıları anında görüntüleyin.',
        color: 'from-brand to-violet-700',
        icon: Users,
        features: ['Sınıf bazlı filtreleme', 'Sparkline net trendleri', 'Riskli öğrenci alarmları', '7 KPI kartı'],
        emoji: '📊',
    },
    {
        id: 'coach-exams',
        role: 'coach',
        label: 'Deneme Yönetimi',
        title: 'Sınav & Deneme Analizi',
        desc: 'Excel/PDF ile toplu deneme yükleyin, öğrenci bazlı detaylı raporlar alın. TYT/AYT karşılaştırmalı grafikler ve ders bazında zayıflık analizleri.',
        color: 'from-blue-600 to-cyan-600',
        icon: BarChart2,
        features: ['Excel/PDF yükleme', 'RadarChart analizi', 'OBP puan tahmini', 'PDF karne'],
        emoji: '📈',
    },
    {
        id: 'coach-guidance',
        role: 'coach',
        label: 'PDR Hizmetleri',
        title: 'Rehberlik & Psikolojik Testler',
        desc: 'Rehberlik servisinin 10 resmî dosyasını ekranda tutun. MEB formatında belge üretin, envanter ve sosyometri uygulayın, BEP planı hazırlayın.',
        color: 'from-purple-600 to-pink-600',
        icon: Shield,
        features: ['10 resmî desimal dosya', 'Sosyometri haritası', 'BEP plan motoru', 'MEB formatlı PDF'],
        emoji: '🧠',
    },
    {
        id: 'coach-tasks',
        role: 'coach',
        label: 'Görev & Program',
        title: 'Görev Atama & Ders Programı',
        desc: 'Öğrencilere bireysel görev atayın, haftalık ders programı oluşturun. Toplu mesaj gönderin ve grup çalışmaları düzenleyin.',
        color: 'from-emerald-600 to-teal-600',
        icon: ClipboardList,
        features: ['Bireysel görev atama', 'Haftalık program', 'Toplu mesajlaşma', 'Grup yönetimi'],
        emoji: '✅',
    },
    {
        id: 'student-home',
        role: 'student',
        label: 'Öğrenci Paneli',
        title: 'Kişisel Öğrenci Dashboardı',
        desc: 'Günlük hedeflerinizi takip edin, XP kazanın, rozet koleksiyonu oluşturun. Pomodoro zamanlayıcı ile verimli çalışın.',
        color: 'from-orange-500 to-rose-600',
        icon: Star,
        features: ['XP & rozet sistemi', 'Pomodoro zamanlayıcı', 'Günlük hedef', 'Seri takibi'],
        emoji: '🎯',
    },
    {
        id: 'student-exams',
        role: 'student',
        label: 'Deneme Sonuçlarım',
        title: 'Sınav Sonuçları & Gelişim',
        desc: 'Deneme sonuçlarınızı inceleyin, ders bazında güçlü/zayıf yönlerinizi görün. AI destekli konu önerileri alın.',
        color: 'from-violet-600 to-purple-700',
        icon: TrendingUp,
        features: ['Net gelişim grafiği', 'Ders analizi', 'AI konu önerileri', 'PDF karne'],
        emoji: '📉',
    },
    {
        id: 'student-program',
        role: 'student',
        label: 'Ders Programım',
        title: 'Kişisel Çalışma Programı',
        desc: 'Koçunuzun oluşturduğu haftalık ders programınızı görüntüleyin. Sınav takviminizi, hedef & not defterinizi kullanın.',
        color: 'from-teal-500 to-emerald-600',
        icon: Calendar,
        features: ['Haftalık program', 'Sınav takvimi', 'Not defteri', 'Hedef takibi'],
        emoji: '📅',
    },
];

// ──────────────────────────────────────────────────────────────────────
const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, register, user } = useAuth();

    useEffect(() => {
        if (!user) return;
        if (user.role === 'admin') navigate('/admin', { replace: true });
        else if (user.role === 'coach') navigate('/coach/dashboard', { replace: true });
        else if (user.role === 'student') navigate('/student/dashboard', { replace: true });
    }, [user]);

    const [role, setRole] = useState('student');
    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState('');
    const [schoolNumber, setSchoolNumber] = useState('');
    const [phone, setPhone] = useState('');
    const [schoolName, setSchoolName] = useState('Şamran Anadolu Lisesi');
    const [email, setEmail] = useState('');
    const [rememberDevice, setRememberDevice] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showStudentRegister, setShowStudentRegister] = useState(false);
    const [lockInfo, setLockInfo] = useState(null);
    const [lockCountdown, setLockCountdown] = useState(0);
    const [attemptsLeft, setAttemptsLeft] = useState(null);
    const [securityStep, setSecurityStep] = useState('form');
    const [coachStep, setCoachStep] = useState('login_form');

    // Showcase
    const [activeScreen, setActiveScreen] = useState(0);
    // Seçilen paket, kupon ve kupon doğrulama sonucu
    const [planId, setPlanId] = useState('ucretsiz');
    const [kupon, setKupon] = useState('');
    const [kuponSonuc, setKuponSonuc] = useState(null);
    const [sifre, setSifre] = useState('');
    // Şifre kurulum ekranındaki tekrar alanı
    const [schoolName2, setSchoolName2] = useState('');
    const sifreDurumu = credential.sifreGucu(sifre);
    const [showShowcase, setShowShowcase] = useState(true);
    const [autoSlide, setAutoSlide] = useState(true);

    // Auto-slide
    useEffect(() => {
        if (!autoSlide || !showShowcase) return;
        const t = setInterval(() => {
            setActiveScreen(prev => (prev + 1) % APP_SCREENS.length);
        }, 4000);
        return () => clearInterval(t);
    }, [autoSlide, showShowcase]);

    useEffect(() => {
        if (!lockCountdown) return;
        if (lockCountdown <= 0) { setLockInfo(null); setLockCountdown(0); return; }
        const timer = setTimeout(() => setLockCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [lockCountdown]);

    /**
     * Giriş sayfasına gelmek demodan çıkmak demektir: kullanıcı demo
     * içindeyken çıkış yapmış ya da sekmeyi yenilemiş olabilir. Gerçek
     * veri burada geri yüklenir, yoksa demo verisi kalıcı sanılır.
     */
    useEffect(() => {
        try { demoyuTemizle(); } catch { /* yedek yoksa yapacak bir şey yok */ }
    }, []);

    /**
     * Karşılama sayfasından gelen yönlendirmeler:
     *   ?rol=coach|student  → ilgili sekme açılır
     *   ?kayit=1            → kayıt formu açılır
     *   ?plan=koc10         → o paket seçili gelir
     *   ?demo=1             → demo bölümüne odaklanılır
     *
     * `?rol=parent` KASITLI OLARAK DESTEKLENMİYOR: velinin girişi yoktur,
     * koçun WhatsApp'tan gönderdiği bağlantıyla portalı açar. Eskiden bu
     * parametre veliyi öğrenci giriş sekmesine düşürüyordu; veli orada
     * kendisinde olmayan bir okul numarası ve şifre aramak zorunda
     * kalıyordu.
     */
    useEffect(() => {
        const q = new URLSearchParams(window.location.hash.split('?')[1] || location.search || '');
        const rol = q.get('rol');
        if (rol === 'coach' || rol === 'student') setRole(rol);
        if (q.get('kayit') === '1') { setRole('coach'); setIsRegistering(true); }
        const plan = q.get('plan');
        if (plan && PLANLAR.some((p) => p.id === plan)) {
            setPlanId(plan);
            if (plan !== 'ucretsiz') { setRole('coach'); setIsRegistering(true); }
        }
        if (q.get('demo') === '1') setShowShowcase(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (location.state?.error) { setError(location.state.error); window.history.replaceState({}, document.title); }
        const currentUrl = window.location.href;
        if (currentUrl.includes('magic=true') || currentUrl.includes('oobCode')) handleMagicLinkReturn(currentUrl);
    }, []);

    useEffect(() => {
        setError(''); setSuccessMsg(''); setIsRegistering(false);
        setCoachStep('login_form'); setSecurityStep('form');
    }, [role]);

    const handleMagicLinkReturn = async (url) => {
        setSecurityStep('magic_verify'); setIsLoading(true); setRole('coach');
        const result = await completeMagicLinkSignIn(url);
        if (result.success) {
            const savedPhone = result.phone || localStorage.getItem('magic_link_phone') || '';
            if (savedPhone) {
                const loginRes = await login(savedPhone, 'Şamran Anadolu Lisesi', 'coach');
                if (loginRes.success) { navigate('/coach/dashboard'); return; }
            }
            setError('Magic link doğrulandı fakat hesap bulunamadı.');
        } else { setError(result.error); }
        setIsLoading(false); setSecurityStep('form');
    };

    const handleStudentLogin = async () => {
        const cleanName = sanitizeName(name);
        const cleanSchoolNo = schoolNumber.trim();
        if (!cleanSchoolNo || !cleanName) { setError('Lütfen tüm alanları doldurun.'); return false; }
        const lock = checkLoginLock(cleanSchoolNo);
        if (lock.locked) {
            setLockInfo(lock); setLockCountdown(lock.secondsLeft);
            setError(`Hesap geçici olarak kilitlendi. ${lock.minutesLeft} dakika sonra tekrar deneyin.`); return false;
        }
        if (isUnusualLoginTime()) logSuspiciousActivity('unusual_time', `Öğrenci: ${cleanSchoolNo}`);
        const res = await login(cleanSchoolNo, cleanName, 'student');
        if (!res.success) {
            const attemptResult = recordFailedAttempt(cleanSchoolNo);
            if (attemptResult.locked) {
                logSuspiciousActivity('multiple_failures', `Öğrenci: ${cleanSchoolNo}`);
                setLockInfo(attemptResult); setLockCountdown(attemptResult.minutesLeft * 60);
                setError(`Çok fazla hatalı giriş! Hesap ${attemptResult.minutesLeft} dakika kilitlendi.`);
            } else { setAttemptsLeft(attemptResult.attemptsLeft); setError(res.error); }
            return false;
        }
        resetLoginAttempts(cleanSchoolNo); setAttemptsLeft(null);
        const studentId = `student_${schoolNumber}`;
        const trusted = await isDeviceTrusted(studentId);
        if (trusted) { if (rememberDevice) await trustThisDevice(studentId, name); }
        else if (rememberDevice) { await trustThisDevice(studentId, name); }
        return true;
    };

    const handleCoachLoginStep1 = async () => {
        const rawPhone = phone.trim();
        const isAdminLogin = rawPhone === 'admin@admin.com' || rawPhone === 'ibokaratas655665@gmail.com';
        const cleanPhone = isAdminLogin ? rawPhone : sanitizePhone(rawPhone);
        if (!cleanPhone || !schoolName) { setError('Lütfen tüm alanları doldurun.'); return; }

        /**
         * Yönetici şifresi eskiden 'admin123' varsayılanına düşüyordu.
         * O varsayılan kaldırıldığı için şifre kurulmamışsa giriş
         * denenmez; sahip önce şifresini belirler. Aksi hâlde sistemin
         * sahibi kendi uygulamasından kilitlenirdi.
         */
        if (isAdminLogin && !localStorage.getItem('admin_master_password')) {
            setCoachStep('admin_setup');
            setError('');
            return;
        }

        if (!isAdminLogin) {
            const lock = checkLoginLock(cleanPhone);
            if (lock.locked) {
                setLockInfo(lock); setLockCountdown(lock.secondsLeft);
                setError(`Hesap geçici olarak kilitlendi. ${lock.minutesLeft} dakika sonra tekrar deneyin.`); return;
            }
        }
        setIsLoading(true);
        const res = await login(cleanPhone, schoolName, 'coach');
        if (!res.success) {
            if (!isAdminLogin) {
                const attemptResult = recordFailedAttempt(cleanPhone);
                if (attemptResult.locked) {
                    logSuspiciousActivity('multiple_failures', `Koç: ${cleanPhone}`);
                    setLockInfo(attemptResult); setLockCountdown(attemptResult.minutesLeft * 60);
                    setError(`Çok fazla hatalı giriş! Hesap ${attemptResult.minutesLeft} dakika kilitlendi.`);
                } else { setAttemptsLeft(attemptResult.attemptsLeft); setError(res.error); }
            } else { setError(res.error); }
            setIsLoading(false); return;
        }
        resetLoginAttempts(cleanPhone); setAttemptsLeft(null); setIsLoading(false);
    };

    /** Yönetici şifresini kurar ve doğrudan girişe geçer. */
    const adminSifreKur = async () => {
        setError('');
        if (!sifreDurumu.gecerli) {
            setError(`Şifre yeterince güçlü değil: ${sifreDurumu.sorunlar[0]}`);
            return;
        }
        if (sifre !== schoolName2) {
            setError('Şifreler eşleşmiyor.');
            return;
        }
        try {
            const ozet = await credential.hashle(sifre);
            localStorage.setItem('admin_master_password', ozet);
            // Kurulum sonrası doğrudan giriş: kullanıcı aynı şifreyi
            // ikinci kez yazmak zorunda kalmasın
            const res = await login(phone.trim(), sifre, 'coach');
            if (!res.success) {
                setError(res.error || 'Şifre kaydedildi ama giriş yapılamadı.');
                setCoachStep('login_form');
                return;
            }
            setSifre(''); setSchoolName2('');
        } catch (e) {
            setError(e?.message || 'Şifre kaydedilemedi.');
        }
    };

    /** Kupon doğrulama — kayıt tamamlanmadan indirimi göster. */
    const kuponUygula = () => {
        const plan = PLANLAR.find((p) => p.id === planId);
        if (!plan) return;
        const hesap = coupons.indirimHesapla(plan.fiyat, kupon, {
            planId,
            kullaniciAnahtari: phone || null,
        });
        setKuponSonuc(hesap);
    };

    const handleCoachRegister = async () => {
        if (!name || !phone || !schoolName || !sifre) {
            setError('Ad soyad, telefon, okul adı ve şifre zorunludur.');
            return;
        }
        if (!sifreDurumu.gecerli) {
            setError(`Şifre yeterince güçlü değil: ${sifreDurumu.sorunlar[0]}`);
            return;
        }

        const res = await register({
            role: 'coach', name, phone, schoolName, email,
            password: sifre,
            planId,
            kuponKodu: kupon || null,
        });

        if (res.success) {
            setSuccessMsg(res.message || 'Kayıt başarılı! Yönetici onayı bekleniyor.');
            setIsRegistering(false);
            setCoachStep('login_form');
            setSifre('');
            setKupon('');
            setKuponSonuc(null);
        } else { setError(res.error); }
    };

    /** Demo sürümü — gerçek ekranlar, örnek veri, buluta yazma yok. */
    const demoBaslat = (demoRol = 'coach') => {
        const sonuc = girisDemo(demoRol);
        if (!sonuc.basarili) { setError(sonuc.hata || 'Demo başlatılamadı.'); return; }
        const hedef = demoRol === 'coach' ? '/coach/dashboard'
            : demoRol === 'student' ? '/student/dashboard'
                : `/parent/${DEMO_KULLANICI.student.id}`;
        window.location.hash = hedef;
        window.location.reload();
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setSuccessMsg(''); setIsLoading(true);
        try {
            if (role === 'student') { await handleStudentLogin(); }
            else {
                if (isRegistering) await handleCoachRegister();
                else if (coachStep === 'login_form') await handleCoachLoginStep1();
            }
        } catch (err) { setError('Bir hata oluştu. Lütfen tekrar deneyin.'); console.error(err); }
        finally { setIsLoading(false); }
    };

    /**
     * ── YÖNETİCİ ŞİFRE KURULUMU ────────────────────────────────
     * İlk kurulumda ya da şifre hiç belirlenmemişse gösterilir.
     * Şifre PBKDF2 ile özetlenip saklanır; düz metin hiçbir yere yazılmaz.
     */
    if (coachStep === 'admin_setup') {
        const kurulumGecerli = sifreDurumu.gecerli && sifre === schoolName2;
        return (
            <div className="min-h-screen flex items-center justify-center bg-page py-12 px-4">
                <div className="srf srf-3 max-w-md w-full p-7 space-y-4">
                    <div className="flex items-start gap-3">
                        <span className="sec-icon" style={{ '--acc': 'var(--danger)' }}>
                            <Lock size={16} />
                        </span>
                        <div className="min-w-0">
                            <h2 className="h2">Yönetici Şifresi Belirleyin</h2>
                            <p className="text-[11px] text-ink-3 mt-1 leading-snug">
                                Bu hesap için henüz şifre kurulmamış. Sabit varsayılan şifre
                                güvenlik gereği kaldırıldı; devam etmek için kendi şifrenizi
                                oluşturun.
                            </p>
                        </div>
                    </div>

                    <label className="block">
                        <span className="eyebrow block mb-1">Yeni Şifre</span>
                        <input
                            type="password"
                            className="fld w-full"
                            value={sifre}
                            onChange={(e) => setSifre(e.target.value)}
                            autoComplete="new-password"
                            placeholder="En az 8 karakter, büyük/küçük harf ve rakam"
                        />
                    </label>
                    {sifre && (
                        <p className={`text-[11px] font-bold ${
                            sifreDurumu.seviye === 'güçlü' ? 'text-ok'
                                : sifreDurumu.seviye === 'orta' ? 'text-warn' : 'text-danger'
                        }`}>
                            Şifre gücü: {sifreDurumu.seviye}
                            {sifreDurumu.sorunlar[0] && ` — ${sifreDurumu.sorunlar[0]}`}
                        </p>
                    )}

                    <label className="block">
                        <span className="eyebrow block mb-1">Şifreyi Tekrar Girin</span>
                        <input
                            type="password"
                            className="fld w-full"
                            value={schoolName2}
                            onChange={(e) => setSchoolName2(e.target.value)}
                            autoComplete="new-password"
                        />
                    </label>
                    {schoolName2 && sifre !== schoolName2 && (
                        <p className="text-[11px] font-bold text-danger">Şifreler eşleşmiyor.</p>
                    )}

                    {error && (
                        <div className="rounded-xl border border-danger bg-danger-soft p-3">
                            <p className="text-[11px] font-bold text-danger">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={() => { setCoachStep('login_form'); setSifre(''); setSchoolName2(''); }}
                            className="b b-line flex-1"
                        >
                            Vazgeç
                        </button>
                        <button
                            onClick={adminSifreKur}
                            disabled={!kurulumGecerli}
                            className="b b-fill b-brand flex-1 disabled:opacity-50"
                        >
                            Şifreyi Kaydet
                        </button>
                    </div>

                    <p className="text-[11px] text-ink-3 leading-snug">
                        Şifreniz cihazda yalnızca PBKDF2 özeti olarak saklanır; düz metin
                        hiçbir yere yazılmaz. Unutursanız kurtarma yolu yoktur.
                    </p>
                </div>
            </div>
        );
    }

    if (securityStep === 'magic_verify') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-2 py-12 px-4">
                <div className="max-w-md w-full space-y-6 glass-card p-8 animate-scale-in text-center">
                    <div className="on-color mx-auto h-16 w-16 bg-gradient-to-br from-brand to-violet-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-200 animate-pulse">
                        <ShieldCheck size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-ink">Magic Link Doğrulanıyor</h2>
                    <p className="text-ink-2 text-sm">E-postanızdaki link doğrulanıyor, lütfen bekleyin...</p>
                    <div className="flex justify-center mt-4">
                        <span className="w-8 h-8 border-4 border-brand-line border-t-indigo-600 rounded-full animate-spin"></span>
                    </div>
                    {error && <div className="bg-danger-soft text-danger text-sm p-3 rounded-lg font-medium">{error}</div>}
                </div>
            </div>
        );
    }

    const currentScreen = APP_SCREENS[activeScreen];
    const ScreenIcon = currentScreen.icon;

    return (
        <div className="min-h-screen bg-page text-ink font-sans selection:bg-brand selection:text-ink-on relative overflow-x-hidden">
            
            {/* ── PORTAL GLOWS ── */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-80px] right-[-80px] w-[350px] h-[350px] bg-accent rounded-full blur-[100px] opacity-10 pointer-events-none" />
                <div className="absolute bottom-[-80px] left-[-80px] w-[320px] h-[320px] bg-c4 rounded-full blur-[100px] opacity-15 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] w-[250px] h-[250px] bg-brand rounded-full blur-[120px] opacity-[0.08]" />
            </div>

            <div className="relative z-10">
                {/* ── HERO & SHOWCASE SECTION ── */}
                <div className="max-w-6xl mx-auto px-6 pt-16 pb-12">
                    {/* Marka görseli: amblem ve ad, logodaki hâliyle.
                        Ada dair başlık ayrıca YAZILMIYOR — logonun içinde
                        zaten yazılı; iki kez yazmak görsel kirlilik olur.
                        Ekran okuyucular için `alt` metni adı taşıyor. */}
                    <div className="text-center mb-12 animate-fade-in">
                        <img
                            src={MARKA.logo}
                            alt={MARKA.ad}
                            width="1254"
                            height="1254"
                            className="w-56 md:w-72 h-auto mx-auto mb-5 mix-blend-multiply dark:mix-blend-normal dark:bg-white dark:rounded-3xl dark:p-3"
                        />
                        <p className="text-lg text-ink-2 max-w-2xl mx-auto font-medium leading-relaxed">
                            Özel öğrenci koçluğu ve okul rehberlik servisi tek uygulamada.
                            Program, deneme analizi, görev takibi ve MEB düzenine uygun dosya yönetimi.
                        </p>
                    </div>

                    {/* App Showcase Slider */}
                    <div className="premium-glass rounded-[40px] border-[#ffffff12] overflow-hidden mb-16 shadow-2xl">
                        <div className="flex bg-[#0d0e1a]/80 border-b border-line p-2 overflow-x-auto no-scrollbar gap-1">
                            {APP_SCREENS.map((s, i) => (
                                <button
                                    key={s.id}
                                    onClick={() => { setActiveScreen(i); setAutoSlide(false); }}
                                    className={`flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition-all duration-300 syne uppercase tracking-wider ${
                                        activeScreen === i
                                            ? `bg-brand text-ink-on shadow-[0_4px_16px_rgba(201,168,76,0.3)]`
                                            : 'text-ink-3 hover:text-ink hover:bg-surface-2'
                                    }`}
                                >
                                    <span>{s.emoji}</span>
                                    <span>{s.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="relative p-8 md:p-14 overflow-hidden">
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                                <div className="flex-1 animate-fade-in">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#c9a84c1a] border border-[#c9a84c33] text-brand text-[10px] font-black uppercase tracking-widest mb-4">
                                        <Zap size={12} /> {currentScreen.role === 'coach' ? 'Koç Paneli' : 'Öğrenci Paneli'}
                                    </div>
                                    <h3 className="text-3xl font-black syne mb-4 leading-tight">{currentScreen.title}</h3>
                                    <p className="text-ink-2 text-base leading-relaxed mb-8">
                                        {currentScreen.desc}
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {currentScreen.features.map(f => (
                                            <div key={f} className="flex items-center gap-3 bg-surface-2 border border-line rounded-2xl px-4 py-3">
                                                <div className="w-5 h-5 rounded-full bg-[#1f8a7a22] flex items-center justify-center">
                                                    <Check size={12} className="text-ok" />
                                                </div>
                                                <span className="text-sm font-bold text-ink-2">{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="w-full md:w-[320px] aspect-square premium-card flex items-center justify-center p-12 bg-gradient-to-br from-surface to-page border-line shadow-inner relative group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#c9a84c11] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="text-[120px] filter drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">{currentScreen.emoji}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── PAKETLER ────────────────────────────────────────
                        Eski bölüm yalnızca bir özellik listesiydi: fiyat yoktu,
                        seçilen paket hiçbir yere yazılmıyordu ve hiçbir sınır
                        uygulanmıyordu. Artık gerçek fiyatlar gösteriliyor,
                        seçim kayıt formuna taşınıyor ve öğrenci limiti
                        abonelik katmanında fiilen uygulanıyor. */}
                    <div className="mb-16">
                        <div className="text-center mb-2">
                            <h2 className="text-3xl font-black syne mb-2">Paketler</h2>
                            <p className="text-ink-2 text-sm max-w-xl mx-auto leading-relaxed">
                                Ücreti yalnızca koç öder; öğrenci ve veli hesapları her pakette
                                ücretsizdir. Fiyat öğrenci sayısına göre değişir, özellikler aynıdır.
                            </p>
                        </div>
                        {/* Deneme süresi burada da yazılı olmalı: karşılama
                            sayfasında vaat edilip giriş sayfasında hiç
                            geçmiyordu. İkisi tek kaynaktan (DENEME_GUN) okur. */}
                        <p className="text-center text-[11px] text-ink-3 mb-6">
                            Sezon {SEZON.etiket} · Otomatik yenileme yok ·
                            Ücretli paketler {DENEME_GUN} gün ücretsiz denenebilir
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 max-w-6xl mx-auto">
                            {PLANLAR.map((p) => {
                                const secili = planId === p.id;
                                const aylik = ogrenciBasiAylik(p);
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => { setPlanId(p.id); setRole('coach'); setIsRegistering(true); }}
                                        aria-pressed={secili}
                                        className={`srf p-4 text-left transition ${secili ? 'srf-3' : 'srf-hover'}`}
                                        style={secili ? { borderColor: 'var(--brand)' } : undefined}
                                    >
                                        {p.rozet && (
                                            <span className={`badge mb-1.5 ${p.vurgu ? 'badge-ok' : ''}`}>{p.rozet}</span>
                                        )}
                                        <p className="t-title text-[13px]">{p.ad}</p>
                                        <p className="num text-xl mt-1">
                                            {p.fiyat === 0 ? 'Ücretsiz' : tl(p.fiyat)}
                                        </p>
                                        <p className="text-[10px] text-ink-3">
                                            {p.ogrenciLimiti ? `${p.ogrenciLimiti} öğrenciye kadar` : 'Öğrenci sınırsız'}
                                            {aylik ? ` · ~${tl(aylik)}/ay` : ''}
                                        </p>
                                        <ul className="space-y-1 mt-2.5">
                                            {p.ozellikler.slice(0, 4).map((o) => (
                                                <li key={o} className="flex items-start gap-1.5 text-[11px] text-ink-2 leading-snug">
                                                    <Check size={11} className="text-ok shrink-0 mt-0.5" /> {o}
                                                </li>
                                            ))}
                                        </ul>
                                        <span className={`b b-sm w-full mt-3 ${secili ? 'b-fill b-brand' : 'b-line'}`}>
                                            {secili ? 'Seçildi' : 'Bu paketi seç'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── AUTH FORM SECTION ── */}
                <div id="auth-section" className="max-w-md mx-auto px-6 pb-24 animate-fade-in-up">
                    <div className="premium-glass p-8 rounded-[40px] border-[#ffffff15] shadow-2xl relative overflow-hidden">
                        
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <Shield size={60} className="text-brand" />
                        </div>

                        <div className="text-center mb-8 relative z-10">
                            <h2 className="text-3xl font-black syne tracking-tight">
                                {role === 'student' ? 'Giriş Portalı' : isRegistering ? 'Kaydol' : 'Koç Girişi'}
                            </h2>
                            <p className="text-ink-3 text-sm mt-2 font-medium">
                                Devam etmek için bilgilerinizi girin
                            </p>
                        </div>

                        {/* Tabs */}
                        {!isRegistering && coachStep === 'login_form' && (
                            <div className="bg-surface p-1.5 rounded-[20px] flex gap-1.5 mb-8 border border-line">
                                <button
                                    onClick={() => setRole('student')}
                                    className={`flex-1 py-3.5 rounded-[14px] text-xs font-black transition-all duration-300 syne uppercase tracking-wider ${role === 'student' ? 'bg-surface-2 text-ink shadow-lg' : 'text-ink-3 hover:text-ink-3'}`}
                                >
                                    Öğrenci
                                </button>
                                <button
                                    onClick={() => setRole('coach')}
                                    className={`flex-1 py-3.5 rounded-[14px] text-xs font-black transition-all duration-300 syne uppercase tracking-wider ${role === 'coach' ? 'bg-surface-2 text-ink shadow-lg' : 'text-ink-3 hover:text-ink-3'}`}
                                >
                                    Eğitim Koçu
                                </button>
                            </div>
                        )}

                        {/* ── DEMO SÜRÜM ────────────────────────────────
                            Kayıt olmadan gerçek ekranları örnek veriyle gezdirir.
                            Demo verisi gerçek kayıtların üzerine YAZMAZ: mevcut
                            veri yedeklenir, demodan çıkışta aynen geri yüklenir
                            ve demo boyunca buluta yazma durdurulur. */}
                        {!isRegistering && coachStep === 'login_form' && (
                            <div className="srf srf-accent p-4 mb-6 relative z-10" style={{ '--acc': 'var(--accent)' }}>
                                <div className="flex items-center gap-2 mb-1">
                                    <PlayCircle size={15} className="text-accent" />
                                    <span className="text-[12px] font-black text-ink">Demo Sürümü</span>
                                </div>
                                <p className="text-[11px] text-ink-3 leading-snug mb-3">
                                    Kayıt olmadan, örnek öğrenci ve rehberlik verisiyle
                                    gerçek panelleri gezin. Verileriniz etkilenmez.
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    <button type="button" onClick={() => demoBaslat('coach')} className="b b-line b-sm">
                                        Koç
                                    </button>
                                    <button type="button" onClick={() => demoBaslat('student')} className="b b-line b-sm">
                                        Öğrenci
                                    </button>
                                    <button type="button" onClick={() => demoBaslat('parent')} className="b b-line b-sm">
                                        Veli
                                    </button>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                            {role === 'student' && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-ink-3 uppercase tracking-widest ml-1">Ad Soyad</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-4 text-ink-3 group-focus-within:text-brand transition-colors" size={18} />
                                            <input
                                                type="text" required value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-surface border border-line rounded-[18px] text-ink placeholder-[#4e4c48] focus:border-brand/40 focus:ring-4 focus:ring-[#c9a84c]/5 focus:outline-none transition-all"
                                                placeholder="Örn: Ahmet Yılmaz"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-ink-3 uppercase tracking-widest ml-1">Okul Numarası</label>
                                        <div className="relative group">
                                            <Hash className="absolute left-4 top-4 text-ink-3 group-focus-within:text-brand transition-colors" size={18} />
                                            <input
                                                type="text" required value={schoolNumber}
                                                onChange={(e) => setSchoolNumber(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-surface border border-line rounded-[18px] text-ink placeholder-[#4e4c48] focus:border-brand/40 focus:ring-4 focus:ring-[#c9a84c]/5 focus:outline-none transition-all"
                                                placeholder="Örn: 105"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-surface-2 p-4 rounded-2xl border border-[#ffffff05]">
                                        <div 
                                            onClick={() => setRememberDevice(!rememberDevice)}
                                            className={`w-12 h-6 px-1 rounded-full transition-all flex items-center cursor-pointer ${rememberDevice ? 'bg-accent' : 'bg-surface-2'}`}
                                        >
                                            <div className={`w-4 h-4 bg-surface rounded-full shadow-lg transition-transform duration-300 ${rememberDevice ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-ink-2">Cihazı Hatırla</p>
                                            <p className="text-[10px] text-ink-3">Güvenliğiniz için önerilir</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {role === 'coach' && coachStep === 'login_form' && (
                                <div className="space-y-4">
                                    {isRegistering && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-ink-3 uppercase tracking-widest ml-1">Ad Soyad</label>
                                            <div className="relative group">
                                                <User className="absolute left-4 top-4 text-ink-3 group-focus-within:text-brand transition-colors" size={18} />
                                                <input
                                                    type="text" required={isRegistering} value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-4 bg-surface border border-line rounded-[18px] text-ink placeholder-[#4e4c48] focus:border-brand/40 focus:ring-4 focus:ring-[#c9a84c]/5 focus:outline-none transition-all"
                                                    placeholder="Örn: Mehmet Öz"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-ink-3 uppercase tracking-widest ml-1">Telefon Numarası</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-4 text-ink-3 group-focus-within:text-brand transition-colors" size={18} />
                                            <input
                                                type="tel" required value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-surface border border-line rounded-[18px] text-ink placeholder-[#4e4c48] focus:border-brand/40 focus:ring-4 focus:ring-[#c9a84c]/5 focus:outline-none transition-all"
                                                placeholder="0555 555 55 55"
                                            />
                                        </div>
                                    </div>
                                    {/* Girişte bu alan ŞİFRE, kayıtta okul adıdır.
                                        Eskiden girişte de "okul adı" isteniyordu ve
                                        doğrulama fiilen çalışmıyordu. */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-ink-3 uppercase tracking-widest ml-1">
                                            {isRegistering ? 'Okul / Kurum Adı' : 'Şifre'}
                                        </label>
                                        <div className="relative group">
                                            {isRegistering
                                                ? <School className="absolute left-4 top-4 text-ink-3 group-focus-within:text-brand transition-colors" size={18} />
                                                : <Lock className="absolute left-4 top-4 text-ink-3 group-focus-within:text-brand transition-colors" size={18} />}
                                            <input
                                                type={isRegistering ? 'text' : 'password'}
                                                required
                                                value={schoolName}
                                                onChange={(e) => setSchoolName(e.target.value)}
                                                autoComplete={isRegistering ? 'organization' : 'current-password'}
                                                className="w-full pl-12 pr-4 py-4 bg-surface border border-line rounded-[18px] text-ink placeholder-[#4e4c48] focus:border-brand/40 focus:ring-4 focus:ring-[#c9a84c]/5 focus:outline-none transition-all"
                                                placeholder={isRegistering ? 'Örn: Şamran Anadolu Lisesi' : '••••••••'}
                                            />
                                        </div>
                                    </div>

                                    {/* ── Kayıt: şifre, paket ve kupon ─────────── */}
                                    {isRegistering && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-ink-3 uppercase tracking-widest ml-1">
                                                    Şifre
                                                </label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-4 top-4 text-ink-3 group-focus-within:text-brand transition-colors" size={18} />
                                                    <input
                                                        type="password"
                                                        required
                                                        value={sifre}
                                                        onChange={(e) => setSifre(e.target.value)}
                                                        autoComplete="new-password"
                                                        className="w-full pl-12 pr-4 py-4 bg-surface border border-line rounded-[18px] text-ink placeholder-[#4e4c48] focus:border-brand/40 focus:outline-none transition-all"
                                                        placeholder="En az 8 karakter, büyük/küçük harf ve rakam"
                                                    />
                                                </div>
                                                {sifre && (
                                                    <p className={`text-[11px] font-bold ${
                                                        sifreDurumu.seviye === 'güçlü' ? 'text-ok'
                                                            : sifreDurumu.seviye === 'orta' ? 'text-warn' : 'text-danger'
                                                    }`}>
                                                        Şifre gücü: {sifreDurumu.seviye}
                                                        {sifreDurumu.sorunlar[0] && ` — ${sifreDurumu.sorunlar[0]}`}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-ink-3 uppercase tracking-widest ml-1">
                                                    Paket
                                                </label>
                                                <select
                                                    value={planId}
                                                    onChange={(e) => { setPlanId(e.target.value); setKuponSonuc(null); }}
                                                    className="w-full px-4 py-4 bg-surface border border-line rounded-[18px] text-ink focus:border-brand/40 focus:outline-none transition-all"
                                                >
                                                    {PLANLAR.map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.ad} — {p.fiyat === 0 ? 'Ücretsiz' : tl(p.fiyat)}
                                                            {p.ogrenciLimiti ? ` (${p.ogrenciLimiti} öğrenci)` : ' (sınırsız)'}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Kupon yalnızca ücretli pakette anlamlı */}
                                            {planId !== 'ucretsiz' && (
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-ink-3 uppercase tracking-widest ml-1">
                                                        İndirim Kuponu (isteğe bağlı)
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={kupon}
                                                            onChange={(e) => { setKupon(e.target.value.toUpperCase()); setKuponSonuc(null); }}
                                                            className="flex-1 px-4 py-4 bg-surface border border-line rounded-[18px] text-ink placeholder-[#4e4c48] focus:border-brand/40 focus:outline-none transition-all tracking-widest font-bold"
                                                            placeholder="KUPON KODU"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={kuponUygula}
                                                            className="b b-line px-5"
                                                        >
                                                            Uygula
                                                        </button>
                                                    </div>

                                                    {kuponSonuc?.hata && (
                                                        <p className="text-[11px] font-bold text-danger">{kuponSonuc.hata}</p>
                                                    )}
                                                    {kuponSonuc && !kuponSonuc.hata && (
                                                        <div className="rounded-2xl border border-ok bg-ok-soft p-3 space-y-1">
                                                            <p className="text-[11px] text-ink-2 flex justify-between">
                                                                <span>Paket ücreti</span>
                                                                <span className="font-bold">{tl(kuponSonuc.tutar)}</span>
                                                            </p>
                                                            <p className="text-[11px] text-ok flex justify-between">
                                                                <span>Kupon indirimi</span>
                                                                <span className="font-bold">−{tl(kuponSonuc.indirim)}</span>
                                                            </p>
                                                            <p className="text-sm text-ink flex justify-between pt-1 border-t border-ok">
                                                                <span className="font-bold">Ödenecek</span>
                                                                <span className="font-black">{tl(kuponSonuc.odenecek)}</span>
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {error && (
                                <div className="bg-[#e05c3a1a] text-danger text-xs p-4 rounded-2xl border border-[#e05c3a33] animate-shake">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle size={16} />
                                        <span className="font-bold">{error}</span>
                                    </div>
                                    {lockCountdown > 0 && (
                                        <div className="mt-3 py-2 bg-[#e05c3a22] rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-wider">
                                            <Timer size={14} /> Kilit: {Math.floor(lockCountdown / 60)}:{String(lockCountdown % 60).padStart(2, '0')}
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {successMsg && (
                                <div className="bg-[#2ecc711a] text-ok text-xs p-4 rounded-2xl border border-[#2ecc7133] animate-fade-in font-bold flex items-center gap-3">
                                    <CheckCircle size={16} /> {successMsg}
                                </div>
                            )}

                            <button
                                type="submit" disabled={isLoading}
                                className="w-full py-4.5 rounded-[22px] bg-accent text-white font-black syne text-lg shadow-[0_12px_24px_rgba(31,138,122,0.3)] hover:shadow-[0_12px_32px_rgba(31,138,122,0.45)] hover:bg-accent active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-surface/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center justify-center gap-3 relative z-10 py-1">
                                    {isLoading ? (
                                        <RefreshCw className="animate-spin" size={20} />
                                    ) : (
                                        <>
                                            {/* Ücretli paket seçiliyken "Ücretsiz Başla" yazmak
                                                yanıltıcıydı: 5.900 TL'lik paketi seçen koç da aynı
                                                düğmeyi görüyordu. Metin seçilen pakete göre değişir. */}
                                            <span>
                                                {!isRegistering
                                                    ? 'Devam Et'
                                                    : planId === 'ucretsiz'
                                                        ? 'Ücretsiz Başla'
                                                        : `${DENEME_GUN} Gün Ücretsiz Dene`}
                                            </span>
                                            <ArrowRight size={20} />
                                        </>
                                    )}
                                </div>
                            </button>

                            {role === 'coach' && (
                                <div className="text-center pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsRegistering(!isRegistering)}
                                        className="text-xs font-black uppercase tracking-widest text-ink-3 hover:text-brand transition-colors"
                                    >
                                        {isRegistering ? 'Giriş Yap' : 'Yeni Kayıt Oluştur'}
                                    </button>
                                </div>
                            )}

                            {role === 'student' && (
                                <div className="text-center pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowStudentRegister(true)}
                                        className="text-xs font-black uppercase tracking-widest text-ink-3 hover:text-brand transition-colors flex items-center justify-center gap-2 mx-auto"
                                    >
                                        <UserPlus size={14} /> Listede değil misin? Kayıt ol
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* App Distribution */}
                    <div className="mt-12 text-center">
                        <p className="text-[10px] font-black text-ink-3 uppercase tracking-[0.3em] mb-6">Uygulamayı İndir</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            {/* Üç düğme de indirme sayfasına gider; kurulum
                                yolu (dosya ya da PWA) orada cihaza göre
                                belirleniyor. Doğrudan dosya bağlantısı
                                vermiyoruz — dosya yayımlanmamışsa 404 olur. */}
                            <a href="#/download" className="flex items-center gap-3 px-5 py-3 bg-surface border border-line rounded-2xl hover:border-line-2 transition-all group">
                                <Smartphone size={20} className="text-ok group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-black syne">Android</span>
                            </a>
                            <a href="#/download" className="flex items-center gap-3 px-5 py-3 bg-surface border border-line rounded-2xl hover:border-line-2 transition-all group">
                                <Monitor size={20} className="text-info group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-black syne">Windows</span>
                            </a>
                            <a href="#/download" className="flex items-center gap-3 px-5 py-3 bg-surface border border-line rounded-2xl hover:border-line-2 transition-all group">
                                <Apple size={20} className="text-ink-3 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-black syne">iPhone</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <StudentRegisterModal
                isOpen={showStudentRegister}
                onClose={() => setShowStudentRegister(false)}
            />
        </div>

    );
};

export default LoginPage;
