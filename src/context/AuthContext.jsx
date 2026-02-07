import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Uygulama açıldığında servisten kullanıcıyı çek
        const currentUser = api.auth.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
        }
        setLoading(false);
    }, []);

    const login = async (email, password, role) => {
        try {
            const response = await api.auth.login(email, password, role);
            if (response.success) {
                setUser(response.user);
                return { success: true };
            }
            return { success: false, error: response.error };
        } catch (error) {
            console.error("Login hatası:", error);
            return { success: false, error: 'Sunucu hatası oluştu.' };
        }
    };

    const register = async (name, email, password, role) => {
        try {
            const response = await api.auth.register(name, email, password, role);

            // Eğer başarıyla kayıt ve giriş yapıldıysa
            if (response.success && response.user) {
                setUser(response.user);
                return { success: true, message: response.message };
            }

            // Kayıt başarılı ama onay bekleniyor durumu
            if (response.success && response.requireApproval) {
                return { success: true, requireApproval: true, message: response.message };
            }

            return { success: false, error: response.error };
        } catch (error) {
            console.error("Kayıt hatası:", error);
            return { success: false, error: 'Kayıt sırasında hata oluştu.' };
        }
    };

    const logout = () => {
        api.auth.logout();
        setUser(null);
    };

    const value = {
        user,
        login,
        logout,
        register,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
