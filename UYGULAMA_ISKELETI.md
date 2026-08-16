# Uygulama İskeleti (Skeleton)

Bu belge, uygulamanın temel yapısını (konfigürasyon, giriş noktaları, yönlendirme ve stil ayarları) oluşturan kilit dosyaların bir kopyasını içermektedir.

---

## 1. package.json
Projenin bağımlılıklarını (dependencies) ve çalıştırılabilir komutlarını (scripts) barındırır.
```json
{
  "name": "ai-ogrenci-kocu",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "main": "electron/main.cjs",
  "scripts": {
    "dev": "vite --host",
    "build": "vite build",
    "build:web": "vite build --mode web",
    "build:electron": "vite build --mode electron",
    "lint": "eslint .",
    "preview": "vite preview",
    "preview:dist": "npx serve dist --single",
    "electron:dev": "npm run build:electron && electron .",
    "electron:build": "npm run build:electron && electron-builder"
  },
  "build": {
    "appId": "com.ogrencikocu.app",
    "productName": "Ibrahim Karatas Egitim Kocu",
    "directories": {
      "output": "dist-electron"
    },
    "files": [
      "dist/**/*",
      "electron/**/*",
      "package.json"
    ],
    "win": {
      "target": [
        "nsis",
        "dir"
      ],
      "verifyUpdateCodeSignature": false,
      "forceCodeSigning": false
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    }
  },
  "dependencies": {
    "@capacitor/android": "^8.0.2",
    "@capacitor/cli": "^8.0.2",
    "@capacitor/core": "^8.0.2",
    "clsx": "^2.1.1",
    "docx": "^9.5.1",
    "electron-serve": "^3.0.1",
    "file-saver": "^2.0.5",
    "firebase": "^12.9.0",
    "html2canvas": "^1.4.1",
    "html2pdf.js": "^0.14.0",
    "jspdf": "^2.5.2",
    "jspdf-autotable": "^3.8.4",
    "lucide-react": "^0.563.0",
    "lz-string": "^1.5.0",
    "pdfjs-dist": "^5.4.624",
    "pptxgenjs": "^4.0.1",
    "qrcode": "^1.5.4",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.13.0",
    "recharts": "^3.7.0",
    "tailwind-merge": "^3.4.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "autoprefixer": "^10.4.24",
    "electron": "^40.1.0",
    "electron-builder": "^26.7.0",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24",
    "globals": "^16.5.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.17",
    "vite": "^7.2.4"
  }
}
```

---

## 2. vite.config.js
Uygulamanın derleme aracı olan Vite'ın temel konfigürasyonu. React eklentisi ve build dizini ayarlarını içerir.
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base: '/'   → Netlify / web sunucusu için (npm run build:web)
// base: './'  → Electron / yerel dosya açma için (npm run build:electron)
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'electron' ? './' : '/',
  server: {
    host: true
  }
}))
```

---

## 3. tailwind.config.js
Uygulamanın stil ve tasarım sistemini oluşturan (renkler, fontlar, animasyonlar, z-index vb.) TailwindCSS konfigürasyonu.
```javascript
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    50: 'var(--color-primary-50, #f0f9ff)',
                    100: 'var(--color-primary-100, #e0f2fe)',
                    500: 'var(--color-primary-500, #6366f1)', // Indigo-500 fallback
                    600: 'var(--color-primary-600, #4f46e5)', // Indigo-600 fallback
                    700: 'var(--color-primary-700, #4338ca)', // Indigo-700 fallback
                },
                secondary: {
                    500: '#8b5cf6', // Violet-500
                    600: '#7c3aed', // Violet-600
                },
                accent: {
                    500: '#f43f5e', // Rose-500
                    600: '#e11d48', // Rose-600
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'blob': 'blob 7s infinite',
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
                'scale-in': 'scaleIn 0.3s ease-out forwards',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                },
                fadeIn: {
                    'from': { opacity: '0' },
                    'to': { opacity: '1' },
                },
                fadeInUp: {
                    'from': { opacity: '0', transform: 'translateY(20px)' },
                    'to': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    'from': { opacity: '0', transform: 'scale(0.95)' },
                    'to': { opacity: '1', transform: 'scale(1)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            }
        },
        zIndex: {
            'overlay': '40',       // Mobil sidebar backdrop
            'modal-base': '50',    // Temel modallar
            'modal-high': '60',    // Üst katman modallar (Add Coach, etc.)
            'modal-top': '70',     // Rehberlik formları
            'program-builder': '80', // Büyük program oluşturucu
            'search-progress': '90', // Araştırma yükleme
            'toast': '100',        // Toast bildirimleri  
            'test-modal': '9999',  // Test modal (öğrenci)
            'settings': '10000',   // Ayarlar (en üst)
        }
    },
    plugins: [],
}
```

---

## 4. index.html
Web/Tarayıcı giriş noktası. Meta etiketleri, PWA özellikleri ve uygulamanın enjekte edildiği `#root` elementini içerir.
```html
<!doctype html>
<html lang="tr" translate="no" class="notranslate">

<head>
  <meta charset="UTF-8" />
  <!-- Google Translate'i devre dışı bırak - React DOM'u bozuyor -->
  <meta name="google" content="notranslate" />
  <meta name="googlebot" content="notranslate" />
  <link rel="icon" type="image/svg+xml" href="/logo512.svg" />
  <link rel="manifest" href="/manifest.json" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Expires" content="0" />

  <!-- iOS PWA (Apple) -->
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="AI Koç" />
  <!-- iOS requires PNG icons, not SVG -->
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152.png" />
  <link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120.png" />
  <!-- iOS Splash Screens -->
  <meta name="theme-color" content="#4f46e5" media="(prefers-color-scheme: light)" />
  <meta name="theme-color" content="#312e81" media="(prefers-color-scheme: dark)" />
  <title>İbrahim Karataş - Yapay Zeka Destekli Eğitim Koçu</title>
  <meta name="description"
    content="Türkiye'nin ilk ve tek yapay zeka destekli öğrenci koçluğu sistemi. YKS, LGS ve Ara Sınıflar için kişiselleştirilmiş programlar, deneme analizleri ve rehberlik." />

  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://ibrahimkaratas-koc.netlify.app/" />
  <meta property="og:title" content="İbrahim Karataş - Yapay Zeka Koçluk Sistemi" />
  <meta property="og:description"
    content="Öğrencinizin başarısını şansa bırakmayın. Yapay zeka ile kişiye özel çalışma programı ve detaylı analizler." />
  <meta property="og:image" content="/logo512.svg" />

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content="https://ibrahimkaratas-koc.netlify.app/" />
  <meta property="twitter:title" content="İbrahim Karataş - Yapay Zeka Koçluk Sistemi" />
  <meta property="twitter:description" content="YKS ve LGS sürecinde profesyonel yol arkadaşınız." />
  <meta property="twitter:image" content="/logo512.svg" />
</head>

<body>
  <div id="root" translate="no"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>

</html>
```

---

## 5. src/main.jsx
React'in DOM'a render edildiği temel JS/JSX giriş dosyası.
```javascript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

---

## 6. src/App.jsx
Uygulamanın ana router, state ve context yöneticisi. Sayfaların yüklendiği ve rota (Route) yapısının belirlendiği çekirdek dosyadır.
*(Not: Uzunluk sebebiyle App.jsx'in çekirdek/router kısmı buradadır.)*
```javascript
import React, { Suspense, lazy, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { GamificationProvider } from './context/GamificationContext';
import { api } from './services/api';
import DashboardLayout from './layouts/DashboardLayout';
import NotificationPanel from './components/NotificationPanel';
import { ShieldCheck, Clock, AlertTriangle } from 'lucide-react';

// ... (TimeoutBanner ve ErrorBoundary Bileşenleri) ...

// Lazy Loaded Pages
const Login = lazy(() => import('./pages/LoginPage'));
const Register = lazy(() => import('./pages/RegisterPage'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const CoachDashboard = lazy(() => import('./pages/CoachDashboard'));
const StudentDetailPage = lazy(() => import('./pages/StudentDetailPage'));
const StudyPlanner = lazy(() => import('./pages/StudyPlanner'));
const GuidancePage = lazy(() => import('./pages/GuidancePage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
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

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <GamificationProvider>
          <AuthProvider>
            <GlobalErrorBoundary>
              <HashRouter>
                <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/download" element={<DownloadPage />} />
                  <Route path="/login" element={<Login />} />
                  
                  {/* ... (Tüm Route / Sayfa Tanımlamaları) ... */}
                  
                  {/* Catch all */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                {/* Global Floating Widgets & Panels */}
                <NotificationPanel />
                <SessionTimeoutBanner />
              </Suspense>
            </HashRouter>
          </GlobalErrorBoundary>
        </AuthProvider>
        </GamificationProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

// Güvenlik Duvarı Bileşeni
function RouteGuard({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'coach') return <Navigate to="/coach/dashboard" replace />;
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}

export default App;
```
