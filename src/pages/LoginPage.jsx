import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Brain, User, Users, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Location hook'u ekle
    const { login } = useAuth();

    const [role, setRole] = useState('student'); // 'student' or 'coach'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    // Redirect'ten gelen hataları göster
    React.useEffect(() => {
        if (location.state?.error) {
            setError(location.state.error);
            // Hata mesajını temizle ki sayfa yenilenince kalmasın
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    // SAFE DEBUG DATA LOADING
    const [debugInfo, setDebugInfo] = useState({ studentCount: 0, userCount: 0, sampleStudents: [] });
    React.useEffect(() => {
        try {
            const s = JSON.parse(localStorage.getItem('coach_students') || '[]');
            const u = JSON.parse(localStorage.getItem('users_db') || '[]');
            setDebugInfo({
                studentCount: s.length,
                userCount: u.length,
                sampleStudents: s.slice(0, 3)
            });
        } catch (e) {
            console.error("Storage Error:", e);
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Lütfen tüm alanları doldurun.');
            return;
        }

        const result = await login(email, password, role);
        if (result.success) {
            // Role göre yönlendirme
            if (result.user?.role === 'admin') navigate('/admin');
            else if (role === 'student') navigate('/student/dashboard');
            else navigate('/coach/dashboard');
        } else {
            setError(result.error || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 glass-card p-10 animate-fade-in">
                {/* Logo & Header */}
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white mb-4">
                        <Brain size={28} />
                    </div>
                    <h2 className="mt-2 text-2xl font-extrabold text-gray-900">İbrahim Karataş Eğitim Koçluğu</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Hesabına giriş yap ve kaldığın yerden devam et.
                    </p>
                </div>

                {/* Role Switcher */}
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setRole('student')}
                        className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-medium transition duration-200 ${role === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <User size={18} />
                        <span>Öğrenci</span>
                    </button>
                    <button
                        onClick={() => setRole('coach')}
                        className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-medium transition duration-200 ${role === 'coach' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Users size={18} />
                        <span>Eğitim Koçu</span>
                    </button>
                </div>

                {/* Form */}
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div className="relative">
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                                {role === 'student' ? 'Okul Numarası' : 'E-posta Adresi'}
                            </label>
                            <input
                                type={role === 'student' ? "text" : "email"}
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder={role === 'student' ? "Örn: 1234" : "ornek@email.com"}
                            />
                        </div>
                        <div className="relative">
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Şifre {role === 'student' && <span className='text-xs text-gray-500 font-normal'>(Okul Numaranız)</span>}</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="text-center text-sm text-red-600 font-medium bg-red-50 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                Beni Hatırla
                            </label>
                        </div>
                        <div className="text-sm">
                            <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                                Şifremi Unuttum?
                            </a>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary w-full flex justify-center items-center shadow-lg shadow-indigo-200"
                    >
                        Giriş Yap
                        <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition" />
                    </button>

                    {/* Demo Login Hint */}
                    <div className="text-center bg-indigo-50 p-2 rounded-lg border border-indigo-100 mb-4">
                        <p className="text-xs text-indigo-700 font-semibold">
                            Site yeni mi? Giriş yapamıyor musunuz?
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setEmail('admin@admin.com');
                                setPassword('admin123');
                                setRole('coach');
                            }}
                            className="text-xs text-indigo-600 underline hover:text-indigo-800 mt-1"
                        >
                            Demo Yönetici Girişi İçin Tıkla
                        </button>
                    </div>

                    <div className="text-center text-sm text-gray-500">
                        Hesabın yok mu?{' '}
                        <button type="button" onClick={() => navigate('/register')} className="font-medium text-indigo-600 hover:text-indigo-500">
                            Hemen Kayıt Ol
                        </button>
                    </div>
                </form>

                {/* Uygulama İndirme Bölümü */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                    <p className="text-center text-xs text-gray-400 mb-4 font-medium uppercase tracking-wider">
                        Uygulamayı Cihazına İndir
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <a
                            href="/downloads/ai-ogrenci-kocu.apk"
                            download
                            className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition duration-200 group"
                        >
                            <div className="bg-green-100 text-green-600 p-2 rounded-full mb-2 group-hover:bg-green-200 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.82 2.766a.75.75 0 0 1 .554 1.34A12.012 12.012 0 0 1 12 21 12.012 12.012 0 0 1 .626 5.106a.75.75 0 0 1 1-1" /><rect x="6" y="8" width="12" height="10" rx="2" /><path d="M9 13v2" /><path d="M15 13v2" /></svg>
                            </div>
                            <span className="text-xs font-semibold text-gray-700">Android APK</span>
                            <span className="text-[10px] text-gray-400">Direkt İndir</span>
                        </a>

                        <a
                            href="/downloads/ai-ogrenci-kocu-windows.zip"
                            download
                            className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition duration-200 group text-left w-full"
                        >
                            <div className="bg-blue-100 text-blue-600 p-2 rounded-full mb-2 group-hover:bg-blue-200 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                            </div>
                            <span className="text-xs font-semibold text-gray-700">Windows PC</span>
                            <span className="text-[10px] text-gray-400">İndir & Kur (ZIP)</span>
                        </a>
                    </div>
                </div>

                {/* Debug / System Info */}
                <div className="mt-8 text-center text-xs text-gray-400 bg-gray-100 p-4 rounded-lg">
                    <p className="font-bold mb-2">SİSTEM DURUMU (DEBUG)</p>
                    <p>Kayıtlı Öğrenci Sayısı: {debugInfo.studentCount}</p>
                    <p>Kayıtlı Kullanıcı Sayısı: {debugInfo.userCount}</p>
                    <div className="mt-2 text-[10px] text-gray-500">
                        <p>Örnek Öğrenci Noları:</p>
                        {debugInfo.sampleStudents.map(s => (
                            <span key={s.id} className="inline-block bg-gray-200 px-1 rounded mr-1">{s.schoolNumber}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
