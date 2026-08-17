import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { startSessionWatch, stopSessionWatch, isSessionValid } from '../services/securityService';
import { demoyuTemizle } from '../services/demoService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                // localStorage'dan oturumu geri yükle
                const saved = localStorage.getItem('user_session');
                if (saved) {
                    const savedUser = JSON.parse(saved);
                    setUser(savedUser);

                    // Firebase sync'i BEKLE - Arka planda değil, bloke edici şekilde yükle
                    // Böylece component'ler boş state ile render olup verileri ezmez!
                    try {
                        const { default: firebaseSync } = await import('../services/firebaseSync');
                        await firebaseSync.init(savedUser);
                    } catch (syncErr) {
                        console.warn('Firebase sync başlatılamadı, offline mod aktif:', syncErr);
                    }
                }
            } catch (err) {
                console.error('Auth init hatası:', err);
                localStorage.removeItem('user_session');
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (identifier, password, role) => {
        try {
            let response;

            // Hybrid auth kullan
            const { loginCoach, loginStudent } = await import('../services/hybridAuth');

            if (role === 'student') {
                response = await loginStudent(identifier, password);
            } else if (role === 'coach') {
                response = await loginCoach(identifier, password);
            } else {
                // Fallback to old API
                response = await api.auth.login(identifier, password, role);
            }

            if (response.success) {
                setUser(response.user);
                localStorage.setItem('user_session', JSON.stringify(response.user));

                /**
                 * Firebase oturumu BURADA açılır.
                 *
                 * Uygulama girişi doğrulandı ama Firebase'in bundan haberi
                 * yok; haberi olmadan Firestore kuralları kapatılamıyordu.
                 * Düz metin şifre yalnızca bu anda elimizde, o yüzden
                 * Firebase oturumu da burada açılıyor. Şifre saklanmıyor.
                 *
                 * Başarısız olursa uygulama çalışmaya devam eder, yalnızca
                 * bulut senkronu devre dışı kalır — kullanıcı verisini
                 * kaybetmez, cihazda çalışır.
                 */
                try {
                    const { oturumAc } = await import('../services/firebaseOturum');
                    const fb = await oturumAc(identifier, password, role);
                    if (!fb.basarili) {
                        console.warn('Firebase oturumu açılamadı, çevrimdışı mod:', fb.hata);
                    }
                } catch (e) {
                    console.warn('Firebase oturum modülü yüklenemedi:', e);
                }

                // Await Firebase sync during login too to ensure safety
                try {
                    const { default: firebaseSync } = await import('../services/firebaseSync');
                    await firebaseSync.init(response.user);
                } catch (e) {
                    console.warn('Login during offline sync:', e);
                }

                return { success: true };
            }

            return { success: false, error: response.error };

        } catch (error) {
            console.error('Login hatası:', error);
            return { success: false, error: 'Giriş sırasında hata oluştu. Lütfen tekrar deneyin.' };
        }
    };

    const register = async (data) => {
        try {
            let response;
            const { registerCoach, registerStudent } = await import('../services/hybridAuth');

            if (data.role === 'student' && data.schoolNumber) {
                response = await registerStudent(data);
            } else if (data.role === 'coach' && data.phone) {
                response = await registerCoach(data);
            } else {
                response = await api.auth.register(data);
            }

            if (response.success && response.user) {
                setUser(response.user);
                return { success: true, message: response.message };
            }

            if (response.success && response.requireApproval) {
                return { success: true, requireApproval: true, message: response.message };
            }

            return { success: false, error: response.error };

        } catch (error) {
            console.error('Kayıt hatası:', error);
            return { success: false, error: 'Kayıt sırasında hata oluştu.' };
        }
    };

    const logout = useCallback((reason) => {
        /**
         * Demodan çıkılıyorsa gerçek veri geri yüklenir.
         *
         * Bu SENKRON olmak zorunda: demo yedeği `user_session` anahtarını
         * da kapsıyor. Dinamik import ile geciktirilirse geri yükleme,
         * aşağıdaki `removeItem('user_session')` çağrısından SONRA
         * çalışır ve kullanıcıyı çıkardığımız oturumu geri getirirdi.
         */
        try { demoyuTemizle(); } catch { /* demo yoksa yapacak bir şey yok */ }

        // Oturumu temizle
        stopSessionWatch();
        localStorage.removeItem('user_session');
        api.auth.logout();
        setUser(null);

        /* Firebase oturumu da kapatılmalı; yoksa çıkış yapan kullanıcının
           kimliğiyle Firestore erişimi açık kalır. */
        try {
            import('../services/firebaseOturum').then(({ oturumKapat }) => oturumKapat());
        } catch { /* modül yoksa yapacak bir şey yok */ }

        // Firebase sync'i güvenli şekilde durdur (asenkron - React render'ı etkilemesin)
        setTimeout(() => {
            try {
                import('../services/firebaseSync').then(({ default: firebaseSync }) => {
                    firebaseSync.destroy();
                }).catch(() => { });
            } catch (e) { /* ignore */ }
        }, 100);

        // Otomatik çıkış ise URL'e bilgi ver
        if (reason === 'timeout') {
            window.location.hash = '/login';
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('session-timeout'));
            }, 200);
        }
    }, []);

    // ── Oturum zaman aşımı izleme ────────────────────────────
    useEffect(() => {
        if (!user) return;

        const handleTimeout = () => logout('timeout');
        const handleWarning = () => {
            window.dispatchEvent(new CustomEvent('session-warning'));
        };

        startSessionWatch(handleTimeout, handleWarning);

        return () => stopSessionWatch();
    }, [user, logout]);

    const value = {
        user,
        login,
        logout,
        register,
        isAuthenticated: !!user,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
