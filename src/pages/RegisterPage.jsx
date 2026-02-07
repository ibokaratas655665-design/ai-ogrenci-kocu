import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, User, Users, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [role, setRole] = useState('student');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (!name || !email || !password) {
            setError('Lütfen tüm alanları doldurun.');
            return;
        }

        const result = await register(name, email, password, role);

        if (result.success) {
            if (result.requireApproval) {
                // Onay gerekiyorsa Login sayfasına yönlendir ve mesaj göster
                navigate('/login', {
                    state: {
                        error: 'Kayıt başarılı! Hesabınız yönetici onayından sonra aktif olacaktır.'
                    }
                });
            } else {
                // Direkt giriş yapıldıysa (Admin)
                if (role === 'student') navigate('/student/dashboard');
                else if (result.user?.role === 'admin') navigate('/admin');
                else navigate('/coach/dashboard');
            }
        } else {
            setError(result.error || 'Kayıt başarısız.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 glass-card p-10 animate-fade-in">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white mb-4">
                        <Brain size={28} />
                    </div>
                    <h2 className="mt-2 text-2xl font-extrabold text-gray-900">İbrahim Karataş ile Başarıya Başla</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Yapay zeka destekli eğitim dünyasına katıl.
                    </p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setRole('student')}
                        className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-medium transition duration-200 ${role === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <User size={18} />
                        <span>Öğrenciyim</span>
                    </button>
                    <button
                        onClick={() => setRole('coach')}
                        className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-medium transition duration-200 ${role === 'coach' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Users size={18} />
                        <span>Koçum</span>
                    </button>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleRegister}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div className="relative">
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Ad Soyad</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Adınız Soyadınız"
                            />
                        </div>
                        <div className="relative">
                            <label className="text-sm font-medium text-gray-700 mb-1 block">E-posta Adresi</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="ornek@email.com"
                            />
                        </div>
                        <div className="relative">
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Şifre</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-center text-sm text-red-600 font-medium bg-red-50 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center">
                        <input
                            required
                            id="terms"
                            name="terms"
                            type="checkbox"
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                            <a href="#" className="text-indigo-600 hover:text-indigo-500">Kullanım Koşulları</a>'nı kabul ediyorum.
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary w-full flex justify-center items-center shadow-lg shadow-indigo-200"
                    >
                        Hesap Oluştur
                        <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition" />
                    </button>

                    <div className="text-center text-sm text-gray-500">
                        Zaten hesabın var mı?{' '}
                        <button type="button" onClick={() => navigate('/login')} className="font-medium text-indigo-600 hover:text-indigo-500">
                            Giriş Yap
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;
