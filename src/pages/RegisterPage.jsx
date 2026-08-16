import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, User, Users, ArrowRight, Phone, Hash, School } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [role, setRole] = useState('student');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [schoolNumber, setSchoolNumber] = useState('');
    const [schoolName, setSchoolName] = useState('Şamran Anadolu Lisesi');

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const data = {
            role,
            name,
            email,
            password,
            phone: role === 'coach' ? phone : undefined,
            schoolNumber: role === 'student' ? schoolNumber : undefined,
            schoolName: role === 'coach' ? schoolName : undefined
        };

        if (!name || !email || (role === 'student' && !schoolNumber) || (role === 'coach' && !phone)) {
            setError('Lütfen gerekli tüm alanları doldurun.');
            setIsLoading(false);
            return;
        }

        const result = await register(data);

        if (result.success) {
            if (result.requireApproval) {
                navigate('/login', {
                    state: {
                        error: 'Kayıt başarılı! Hesabınız yönetici onayından sonra aktif olacaktır.'
                    }
                });
            } else {
                if (role === 'student') navigate('/student/dashboard');
                else if (result.user?.role === 'admin') navigate('/admin');
                else navigate('/coach/dashboard');
            }
        } else {
            setError(result.error || 'Kayıt başarısız.');
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-2 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 glass-card p-10 animate-fade-in">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-brand rounded-xl flex items-center justify-center text-white mb-4">
                        <Brain size={28} />
                    </div>
                    <h2 className="mt-2 text-2xl font-extrabold text-ink">İbrahim Karataş ile Başarıya Başla</h2>
                    <p className="mt-2 text-sm text-ink-2">
                        Yapay zeka destekli eğitim dünyasına katıl.
                    </p>
                </div>

                <div className="flex bg-surface-3 p-1 rounded-xl">
                    <button
                        onClick={() => setRole('student')}
                        className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-medium transition duration-200 ${role === 'student' ? 'bg-surface text-brand shadow-sm' : 'text-ink-2 hover:text-ink-2'
                            }`}
                    >
                        <User size={18} />
                        <span>Öğrenciyim</span>
                    </button>
                    <button
                        onClick={() => setRole('coach')}
                        className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-medium transition duration-200 ${role === 'coach' ? 'bg-surface text-brand shadow-sm' : 'text-ink-2 hover:text-ink-2'
                            }`}
                    >
                        <Users size={18} />
                        <span>Koçum</span>
                    </button>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleRegister}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div className="relative">
                            <label className="text-xs font-bold text-ink-2 uppercase tracking-wider mb-1 block">Ad Soyad</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-3 border border-line placeholder-gray-400 text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-brand transition"
                                placeholder="Adınız Soyadınız"
                            />
                        </div>

                        {role === 'coach' ? (
                            <>
                                <div className="relative">
                                    <label className="text-xs font-bold text-ink-2 uppercase tracking-wider mb-1 block">Telefon Numarası</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3.5 text-ink-3" size={18} />
                                        <input
                                            type="tel"
                                            required
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-line placeholder-gray-400 text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-brand transition"
                                            placeholder="05XX XXX XX XX"
                                        />
                                    </div>
                                </div>
                                <div className="relative">
                                    <label className="text-xs font-bold text-ink-2 uppercase tracking-wider mb-1 block">Okul Adı</label>
                                    <div className="relative">
                                        <School className="absolute left-3 top-3.5 text-ink-3" size={18} />
                                        <input
                                            type="text"
                                            required
                                            value={schoolName}
                                            onChange={(e) => setSchoolName(e.target.value)}
                                            className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-line placeholder-gray-400 text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-brand transition"
                                            placeholder="Şamran Anadolu Lisesi"
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="relative">
                                <label className="text-xs font-bold text-ink-2 uppercase tracking-wider mb-1 block">Okul Numarası</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-3.5 text-ink-3" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={schoolNumber}
                                        onChange={(e) => setSchoolNumber(e.target.value)}
                                        className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-line placeholder-gray-400 text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-brand transition"
                                        placeholder="Okul numaranız"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="relative">
                            <label className="text-xs font-bold text-ink-2 uppercase tracking-wider mb-1 block">E-posta Adresi</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-3 border border-line placeholder-gray-400 text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-brand transition"
                                placeholder="ornek@email.com"
                            />
                        </div>

                        <div className="relative">
                            <label className="text-xs font-bold text-ink-2 uppercase tracking-wider mb-1 block">Şifre</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-3 border border-line placeholder-gray-400 text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-brand transition"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-center text-sm text-danger font-medium bg-danger-soft p-2 rounded-lg animate-shake">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full flex justify-center items-center shadow-lg shadow-indigo-200 py-3.5 disabled:opacity-70"
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>
                                Hesap Oluştur
                                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition" />
                            </>
                        )}
                    </button>

                    <div className="text-center text-sm text-ink-2">
                        Zaten hesabın var mı?{' '}
                        <button type="button" onClick={() => navigate('/login')} className="font-bold text-brand hover:text-brand">
                            Giriş Yap
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;
