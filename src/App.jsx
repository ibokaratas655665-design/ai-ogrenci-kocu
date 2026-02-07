import React from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/LoginPage';
import Register from './pages/RegisterPage'; // Yeni
import StudentDashboard from './pages/StudentDashboard';
import CoachDashboard from './pages/CoachDashboard';

import StudentDetailPage from './pages/StudentDetailPage';
import StudyPlanner from './pages/StudyPlanner';
import GuidancePage from './pages/GuidancePage';
import DashboardLayout from './layouts/DashboardLayout';

import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard'; // Yeni
import ResearchPage from './pages/ResearchPage'; // Yeni - Araştırma Modülü
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';
import FocusTimer from './pages/FocusTimer';
import AICoachWidget from './pages/AICoachWidget';



function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/admin" element={
            <RouteGuard allowedRoles={['admin']}>
              <AdminDashboard />
            </RouteGuard>
          } />

          {/* Öğrenci Routes */}
          <Route path="/student/dashboard" element={
            <RouteGuard allowedRoles={['student']}>
              <StudentDashboard />
            </RouteGuard>
          } />
          <Route path="/student/planner" element={
            <RouteGuard allowedRoles={['student']}>
              <StudyPlanner />
            </RouteGuard>
          } />
          <Route path="/student/analytics" element={
            <RouteGuard allowedRoles={['student']}>
              <div className="p-10">Analiz Sayfası (Yapım Aşamasında)</div>
            </RouteGuard>
          } />
          <Route path="/student/guidance" element={
            <RouteGuard allowedRoles={['student']}>
              <GuidancePage />
            </RouteGuard>
          } />

          {/* Coach Routes */}
          <Route path="/coach/dashboard" element={
            <RouteGuard allowedRoles={['coach']}>
              <CoachDashboard />
            </RouteGuard>
          } />
          <Route path="/coach/student/:id" element={
            <RouteGuard allowedRoles={['coach']}>
              <StudentDetailPage />
            </RouteGuard>
          } />
          <Route path="/coach/research" element={
            <RouteGuard allowedRoles={['coach']}>
              <ResearchPage />
            </RouteGuard>
          } />

          {/* Catch all - 404 sayfasına veya ana sayfaya */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global Floating Widgets */}
        <div className="pointer-events-none fixed inset-0 z-50">
          <div className="pointer-events-auto">
            <FocusTimer />
            <AICoachWidget />
          </div>
        </div>

      </HashRouter>
    </AuthProvider >
  );
}

// Güvenlik Duvarı Bileşeni


function RouteGuard({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Sistem kilitli mi kontrolü
  const isSystemLocked = api.admin.getSystemLockStatus();
  if (isSystemLocked && user.role !== 'admin') {
    // Eğer sistem kilitliyse ve admin değilse çıkış yaptırıp login'e at (veya özel bir sayfaya)
    // Burada basitlik adına Logout yapıp Login'e gönderiyoruz, Login zaten hatayı gösterecek
    // Ancak AuthContext üzerinden logout çağırmak daha doğru olurdu, burada direkt login'e atıyoruz
    // Login sayfası api.auth.login çağırırken 'Sistem kilitli' hatasını alacak zaten.
    return <Navigate to="/login" state={{ error: 'Sistem bakım nedeniyle kapalıdır.' }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Admin ise her yere girebilir (Süper Kullanıcı)
    if (user.role === 'admin') {
      return children;
    }

    // Yetkisiz erişim - Kendi paneline yönlendir
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'coach') return <Navigate to="/coach/dashboard" replace />;
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}

export default App;
