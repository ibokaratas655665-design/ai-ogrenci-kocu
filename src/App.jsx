import React, { Suspense, lazy, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { GamificationProvider } from './context/GamificationContext';
import { UIGeriBildirimProvider } from './context/UIGeriBildirimContext';
import { api } from './services/api';
import DashboardLayout from './layouts/DashboardLayout';
import NotificationPanel from './components/NotificationPanel';
import { ShieldCheck, Clock, AlertTriangle } from 'lucide-react';
import useGlobalModalDismiss from './hooks/useGlobalModalDismiss';
import Modal from './components/ui/Modal';
import { profilOku } from './services/kimlikKopru';
import { auth } from './firebaseConfig';

// 🛡️ Oturum Zaman Aşımı Uyarı Banner'ı
const SessionTimeoutBanner = () => {
  const [show, setShow] = useState(null); // null | 'warning' | 'timeout'
  const { logout } = useAuth();

  useEffect(() => {
    const onWarning = () => setShow('warning');
    const onTimeout = () => setShow('timeout');

    window.addEventListener('session-warning', onWarning);
    window.addEventListener('session-timeout', onTimeout);
    return () => {
      window.removeEventListener('session-warning', onWarning);
      window.removeEventListener('session-timeout', onTimeout);
    };
  }, []);

  if (!show) return null;

  if (show === 'timeout') return (
    // Oturum kapandı uyarısı bilinçli olarak kapatılamaz — kullanıcı
    // tekrar giriş yapmalı. ESC/perde kapatma bunu atlamamalı.
    <Modal
        acik
        onClose={() => setShow(null)}
        baslikGizle
        genislik="sm"
        govdeClassName="p-8 text-center"
    >
    <div className="w-14 h-14 bg-danger-soft rounded-full flex items-center justify-center mx-auto mb-4">
      <AlertTriangle size={28} className="text-danger" />
    </div>
    <h3 className="text-lg font-black text-ink mb-2">Oturum Sona Erdi</h3>
    <p className="text-sm text-ink-2 mb-5">Uzun süre işlem yapılmadığı için güvenliğiniz için oturumunuz kapatıldı.</p>
    <a href="#/login" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm" onClick={() => setShow(null)}>
      <ShieldCheck size={16} /> Tekrar Giriş Yap
    </a>
    </Modal>
  );

  return (
    <div className="fixed top-4 right-4 z-notify animate-fade-in">
      <div className="bg-warn text-white rounded-xl px-4 py-3 shadow-lg flex items-center gap-3 max-w-xs">
        <Clock size={18} className="shrink-0" />
        <div>
          <p className="font-bold text-sm">Oturum 5 dakika sonra kapanıyor</p>
          <p className="text-xs opacity-90">Devam etmek için ekrana dokunun.</p>
        </div>
        <button onClick={() => setShow(null)} className="ml-auto text-ink-2 hover:text-ink text-lg font-bold">×</button>
      </div>
    </div>
  );
};

// Global Error Boundary - Beyaz ekranı önler
class GlobalErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('Global Crash:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-2 flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-danger">
            <div className="w-16 h-16 bg-danger-soft rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-danger" />
            </div>
            <h2 className="text-xl font-black text-ink mb-2">Beklenmedik Bir Hata Oluştu</h2>
            <p className="text-sm text-ink-2 mb-6 font-medium">Uygulama yüklenirken bir sorunla karşılaşıldı. Lütfen sayfayı yenilemeyi deneyin.</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-brand text-white py-3 rounded-2xl font-bold hover:bg-brand-hover transition shadow-lg shadow-indigo-200"
            >
              Uygulamayı Yeniden Başlat
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Sayfa yükleme iskeleti.
 *
 * Eskiden dönen bir çember + "Yükleniyor…" yazısıydı: bekleme süresi
 * boyunca ekran boş görünüyor, kullanıcı ne geleceğini bilmiyordu.
 * İskelet gelecek düzenin şeklini gösterir — üst şerit, başlık ve
 * kart ızgarası — böylece bekleme kısa hissettirir ve içerik yerine
 * oturduğunda sayfa zıplamaz.
 */
const PageLoader = () => (
  <div className="min-h-screen bg-page" role="status" aria-label="Sayfa yükleniyor">
    {/* Üst şerit */}
    <div className="h-16 lg:h-[88px] border-b border-line flex items-center px-4 sm:px-6 lg:px-8 gap-3">
      <div className="iskelet-parilti w-9 h-9 rounded-dmd bg-surface-3" />
      <div className="iskelet-parilti h-4 w-32 rounded-dsm bg-surface-3" />
      <div className="ml-auto flex gap-2">
        <div className="iskelet-parilti w-11 h-11 rounded-pill bg-surface-3" />
        <div className="iskelet-parilti w-11 h-11 rounded-pill bg-surface-3" />
      </div>
    </div>

    {/* Gövde */}
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      <div className="iskelet-parilti h-7 w-56 rounded-dsm bg-surface-3" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-dlg border border-line bg-surface p-kart space-y-3">
            <div className="iskelet-parilti h-4 w-2/3 rounded-dsm bg-surface-3" />
            <div className="iskelet-parilti h-3 w-full rounded-dsm bg-surface-3" />
            <div className="iskelet-parilti h-3 w-4/5 rounded-dsm bg-surface-3" />
          </div>
        ))}
      </div>
    </div>

    <span className="sr-only">Başarı Kampı yükleniyor</span>
  </div>
);

// Lazy Loaded Pages
const Login = lazy(() => import('./pages/LoginPage'));
const Register = lazy(() => import('./pages/RegisterPage'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const CoachDashboard = lazy(() => import('./pages/CoachDashboard'));
const StudentDetailPage = lazy(() => import('./pages/StudentDetailPage'));
const StudyPlanner = lazy(() => import('./pages/StudyPlanner'));
const GuidancePage = lazy(() => import('./pages/GuidancePage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const JoinPage = lazy(() => import('./pages/JoinPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ResearchPage = lazy(() => import('./pages/ResearchPage'));
const FocusTimer = lazy(() => import('./pages/FocusTimer'));
const AICoachWidget = lazy(() => import('./pages/AICoachWidget'));
const RemoteSession = lazy(() => import('./pages/RemoteSession'));
const TrialsPage = lazy(() => import('./pages/TrialsPage'));
const DownloadPage = lazy(() => import('./pages/DownloadPage'));
const PublicTestEntry = lazy(() => import('./pages/PublicTestEntry'));
const PublicResultView = lazy(() => import('./pages/PublicResultView'));
const PublicOBPEntry = lazy(() => import('./pages/PublicOBPEntry'));
const ParentPortal = lazy(() => import('./pages/ParentPortal'));

/**
 * Oturum gerektiren global widget'ları sarar.
 * Veli portalı, envanter girişi gibi halka açık sayfalarda
 * odak sayacı ve bildirim paneli görünmemeli.
 */
function AuthenticatedOnly({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : null;
}

function App() {
  // ESC veya perdeye tıklama ile en üstteki modalı kapatır
  useGlobalModalDismiss();

  return (
    <ThemeProvider>
      <NotificationProvider>
        <GamificationProvider>
          <AuthProvider>
            {/* Toast ve onay penceresi tek yerden; tarayıcının
                alert/confirm diyaloglarının yerini alır */}
            <UIGeriBildirimProvider>
            <GlobalErrorBoundary>
              <HashRouter>
                <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/download" element={<DownloadPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  {/* Koçun davet linki/QR kodu bu sayfayı açar */}
                  <Route path="/katil" element={<JoinPage />} />
                  <Route path="/obp-girisi" element={<PublicOBPEntry />} />
                  <Route path="/envanter/:testId" element={<PublicTestEntry />} />
                  <Route path="/share/result/:shareData" element={<PublicResultView />} />

                  {/* 👨‍👩‍👧 Veli Portalı - QR/link ile açılır, oturum gerektirmez */}
                  <Route path="/veli/:studentId" element={<ParentPortal />} />
                  {/* Eski QR kodlarında kullanılan adres - aynı sayfaya düşsün */}
                  <Route path="/parent-report/:studentId" element={<ParentPortal />} />

                  <Route path="/admin" element={
                    <RouteGuard allowedRoles={['admin']}>
                      <YoneticiKapisi>
                        <AdminDashboard />
                      </YoneticiKapisi>
                    </RouteGuard>
                  } />

                  {/* Öğrenci Routes - StudentDashboard kendi layout'una sahip */}
                  <Route path="/student/dashboard" element={
                    <RouteGuard allowedRoles={['student']}>
                      <StudentDashboard />
                    </RouteGuard>
                  } />
                  <Route element={<DashboardLayout />}>
                    <Route path="/student/planner" element={
                      <RouteGuard allowedRoles={['student']}>
                        <StudyPlanner />
                      </RouteGuard>
                    } />
                    <Route path="/student/analytics" element={
                      <RouteGuard allowedRoles={['student']}>
                        <Navigate to="/student/trials" replace />
                      </RouteGuard>
                    } />
                    <Route path="/student/trials" element={
                      <RouteGuard allowedRoles={['student']}>
                        <TrialsPage />
                      </RouteGuard>
                    } />
                    <Route path="/student/guidance" element={
                      <RouteGuard allowedRoles={['student']}>
                        <GuidancePage />
                      </RouteGuard>
                    } />
                    <Route path="/student/remote-session" element={
                      <RouteGuard allowedRoles={['student']}>
                        <RemoteSession />
                      </RouteGuard>
                    } />
                  </Route>

                  {/* Coach Routes - CoachDashboard kendi layout'una sahip */}
                  <Route path="/coach/dashboard" element={
                    <RouteGuard allowedRoles={['coach', 'admin']}>
                      <CoachDashboard />
                    </RouteGuard>
                  } />
                  <Route element={<DashboardLayout />}>
                    <Route path="/coach/planner" element={
                      <RouteGuard allowedRoles={['coach', 'admin']}>
                        <StudyPlanner />
                      </RouteGuard>
                    } />

                    <Route path="/coach/student/:id" element={
                      <RouteGuard allowedRoles={['coach', 'admin']}>
                        <StudentDetailPage />
                      </RouteGuard>
                    } />
                    <Route path="/coach/research" element={
                      <RouteGuard allowedRoles={['coach', 'admin']}>
                        <ResearchPage />
                      </RouteGuard>
                    } />
                    <Route path="/coach/remote-session" element={
                      <RouteGuard allowedRoles={['coach', 'admin']}>
                        <RemoteSession />
                      </RouteGuard>
                    } />
                  </Route>

                  {/* Catch all */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>

                {/* Global Floating Widgets - yalnızca oturum açıkken */}
                <AuthenticatedOnly>
                  {/* Yüzen widget'lar modal DEĞİL — modalların altında kalmalı */}
                  {/* FocusTimer kendi `fixed` konumunu yönetiyor. Eskiden
                      tam ekran bir sarmalayıcının içindeydi; o sarmalayıcının
                      `pointer-events-auto` katmanı ÜST ŞERİDİN ÜZERİNİ kaplayıp
                      yenile/bildirim/ayarlar/çıkış/tema butonlarına yapılan
                      tıklamaları yutuyordu. Sarmalayıcı kaldırıldı. */}
                  <FocusTimer />

                  {/* 🔔 Bildirim Paneli */}
                  <NotificationPanel />
                </AuthenticatedOnly>

                {/* 🛡️ Oturum Uyarı Banner'ı */}
                <SessionTimeoutBanner />
              </Suspense>
            </HashRouter>
          </GlobalErrorBoundary>
            </UIGeriBildirimProvider>
        </AuthProvider>
        </GamificationProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

// Güvenlik Duvarı Bileşeni
/**
 * Yönetici rotası için SUNUCU doğrulaması.
 *
 * `RouteGuard` rolü `user_session` üzerinden okuyor; o da localStorage.
 * Ölçüldü: konsoldan `user_session.role = 'admin'` yazan biri yönetici
 * ekranını AÇABİLİYOR. Veri sızmıyor — `users`, `abonelikler` ve
 * `kullaniciProfil` yazımı kuralla engellendi (3/3 reddedildi) — ama
 * ekranın hiç açılmaması doğrusu.
 *
 * `kullaniciProfil/{uid}.rol == 'admin'` güvenilir bir sinyal: kural
 * `rol: 'admin'` yazımını yalnızca gerçek yönetici uid'ine izin veriyor
 * (`request.resource.data.rol != 'admin' || yoneticiMi()`).
 */
function YoneticiKapisi({ children }) {
  const { user } = useAuth();
  const [durum, setDurum] = React.useState('kontrol');

  React.useEffect(() => {
    let iptal = false;
    (async () => {
      try {
        const profil = await profilOku(auth?.currentUser?.uid);
        if (!iptal) setDurum(profil?.rol === 'admin' ? 'izin' : 'red');
      } catch {
        // Sunucuya ulaşılamıyorsa yönetici ekranı AÇILMAZ — güvenli taraf.
        if (!iptal) setDurum('red');
      }
    })();
    return () => { iptal = true; };
  }, [user?.id]);

  if (durum === 'kontrol') return <PageLoader />;
  if (durum === 'red') return <Navigate to="/login" replace />;
  return children;
}
function RouteGuard({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Sistem kilidi ve bakım modu (Ayarlar → Sistem Kontrol)
  try {
    const isSystemLocked = api.admin.getSystemLockStatus();
    if (isSystemLocked && user.role !== 'admin') {
      return <Navigate to="/login" state={{ error: 'Sistem bakım nedeniyle kapalıdır.' }} replace />;
    }

    // Bakım modu kaydediliyor ama hiçbir yerde kontrol edilmiyordu.
    // Sistem kilidinden farkı: koçlar çalışmaya devam eder, yalnızca
    // öğrenci ve veli erişimi durur.
    const settings = JSON.parse(localStorage.getItem('app_settings') || '{}');
    if (settings.maintenanceMode === true && user.role === 'student') {
      return <Navigate to="/login" state={{ error: 'Sistem geçici olarak bakımdadır. Lütfen daha sonra tekrar deneyin.' }} replace />;
    }
  } catch (e) { /* ayar servisi yoksa devam et */ }

  // Rol kontrolü
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Doğru sayfaya yönlendir
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'coach') return <Navigate to="/coach/dashboard" replace />;
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}

export default App;
