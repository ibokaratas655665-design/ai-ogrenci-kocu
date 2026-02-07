import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, CheckCircle, XCircle, Lock, Unlock, LogOut, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('pending');
    const [pendingUsers, setPendingUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [systemLocked, setSystemLocked] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        if (activeTab === 'pending') {
            const pending = await api.admin.getPendingUsers();
            setPendingUsers(pending);
        } else if (activeTab === 'users') {
            const users = await api.admin.getAllUsers();
            setAllUsers(users);
        }

        const lockStatus = api.admin.getSystemLockStatus();
        setSystemLocked(lockStatus);
        setLoading(false);
    };

    const handleApprove = async (userId) => {
        const success = await api.admin.approveUser(userId);
        if (success) {
            alert('Kullanıcı onaylandı!');
            loadData();
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
            const success = await api.admin.deleteUser(userId);
            if (success) {
                loadData();
            }
        }
    };

    const toggleSystemLock = async () => {
        if (systemLocked) {
            await api.admin.stopSystemLock();
            setSystemLocked(false);
        } else {
            if (window.confirm('Sistemi kilitlemek istediğinize emin misiniz? Siz hariç kimse giriş yapamayacak.')) {
                await api.admin.startSystemLock();
                setSystemLocked(true);
            }
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="w-64 bg-indigo-900 text-white p-6 flex flex-col">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                    <ShieldAlert size={28} />
                    Yönetici
                </h2>

                <nav className="flex-1 space-y-2">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'pending' ? 'bg-indigo-700' : 'hover:bg-indigo-800'
                            }`}
                    >
                        <CheckCircle size={20} />
                        Onay Bekleyenler
                        {pendingUsers.length > 0 && (
                            <span className="ml-auto bg-red-500 text-xs px-2 py-0.5 rounded-full">
                                {pendingUsers.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'users' ? 'bg-indigo-700' : 'hover:bg-indigo-800'
                            }`}
                    >
                        <Users size={20} />
                        Kullanıcılar
                    </button>

                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'settings' ? 'bg-indigo-700' : 'hover:bg-indigo-800'
                            }`}
                    >
                        {systemLocked ? <Lock size={20} /> : <Unlock size={20} />}
                        Sistem Kilidi
                    </button>
                </nav>

                <button
                    onClick={handleLogout}
                    className="mt-auto flex items-center gap-3 px-4 py-3 text-red-200 hover:text-white transition-colors"
                >
                    <LogOut size={20} />
                    Çıkış Yap
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                {activeTab === 'pending' && (
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-6">Onay Bekleyen Kayıtlar</h1>
                        {loading ? <p>Yükleniyor...</p> : pendingUsers.length === 0 ? (
                            <div className="bg-white p-8 rounded-xl shadow-sm text-center text-gray-500">
                                <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                                <p>Bekleyen onay isteği yok. Her şey yolunda!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingUsers.map(user => (
                                    <div key={user.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-lg">{user.name}</h3>
                                            <p className="text-gray-500">{user.email}</p>
                                            <span className={`inline-block mt-2 text-xs px-2 py-1 rounded bg-gray-100 text-gray-600`}>
                                                {user.role === 'student' ? 'Öğrenci' : 'Koç'}
                                            </span>
                                            <p className="text-xs text-gray-400 mt-1">Kayıt: {new Date(user.registeredAt).toLocaleString()}</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm"
                                            >
                                                Reddet
                                            </button>
                                            <button
                                                onClick={() => handleApprove(user.id)}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm"
                                            >
                                                Onayla
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'users' && (
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-6">Tüm Kullanıcılar</h1>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-gray-600">İsim</th>
                                        <th className="px-6 py-4 font-semibold text-gray-600">E-Posta</th>
                                        <th className="px-6 py-4 font-semibold text-gray-600">Rol</th>
                                        <th className="px-6 py-4 font-semibold text-gray-600 text-right">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {allUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-4 font-medium">{user.name}</td>
                                            <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs px-2 py-1 rounded ${user.role === 'student' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                    {user.role === 'student' ? 'Öğrenci' : 'Koç'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                                                >
                                                    Sil
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {allUsers.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                                Henüz başka kullanıcı yok.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-6">Sistem Ayarları</h1>

                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-2xl">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                                        {systemLocked ? <Lock className="text-red-500" /> : <Unlock className="text-green-500" />}
                                        Sistem Kilidi
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        Sistem kilidi açıldığında, <strong>Yönetici (Siz) hariç</strong> hiç kimse sisteme giriş yapamaz.
                                        Bu özelliği bakım yapmak istediğinizde veya sisteme erişimi tamamen kapatmak istediğinizde kullanın.
                                    </p>
                                </div>
                                <div className="ml-4">
                                    <button
                                        onClick={toggleSystemLock}
                                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${systemLocked ? 'bg-red-500' : 'bg-gray-200'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${systemLocked ? 'translate-x-7' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {systemLocked && (
                                <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                                    ⚠️ Sistem şu an kilitli. Öğrenciler ve Koçlar giriş yapamaz.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
