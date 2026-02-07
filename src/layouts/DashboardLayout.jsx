import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    BarChart2,
    BrainCircuit,
    LogOut,
    Users
} from 'lucide-react';
import Chatbot from '../components/Chatbot';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const isStudent = user?.role === 'student' || !user; // Fallback to student layout if no user (for demo)

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col z-10 shadow-sm">
                <div className="p-6 flex items-center space-x-2 border-b border-gray-100">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <BrainCircuit className="text-white" size={20} />
                    </div>
                    <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        İBRAHİM KARATAŞ
                    </span>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4 mt-4">Menü</div>

                    {isStudent ? (
                        <>
                            <NavLink to="/student/dashboard" className={({ isActive }) => `flex items-center p-3 rounded-xl transition-all ${isActive ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <LayoutDashboard size={20} className="mr-3" />
                                Ana Sayfa
                            </NavLink>

                            <NavLink to="/student/planner" className={({ isActive }) => `flex items-center p-3 rounded-xl transition-all ${isActive ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <BookOpen size={20} className="mr-3" />
                                Çalışma Planı
                            </NavLink>

                            <NavLink to="/student/analytics" className={({ isActive }) => `flex items-center p-3 rounded-xl transition-all ${isActive ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <BarChart2 size={20} className="mr-3" />
                                Analiz & Deneme
                            </NavLink>

                            <NavLink to="/student/guidance" className={({ isActive }) => `flex items-center p-3 rounded-xl transition-all ${isActive ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <BrainCircuit size={20} className="mr-3" />
                                Rehberlik & Testler
                            </NavLink>
                        </>
                    ) : (
                        <>
                            <NavLink to="/coach/dashboard" className={({ isActive }) => `flex items-center p-3 rounded-xl transition-all ${isActive ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <LayoutDashboard size={20} className="mr-3" />
                                Koç Paneli
                            </NavLink>
                            <NavLink to="/coach/research" className={({ isActive }) => `flex items-center p-3 rounded-xl transition-all ${isActive ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <BrainCircuit size={20} className="mr-3" />
                                Materyal Üretici
                            </NavLink>
                            {/* Koç için öğrenci listesi vb. eklenebilir. Şimdilik dashboard ana merkez. */}
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="px-4 py-2 mb-2">
                        <p className="text-xs text-gray-500">Giriş yapan:</p>
                        <p className="text-sm font-bold text-gray-800">{user?.name || 'Misafir'}</p>
                    </div>
                    <button onClick={logout} className="flex items-center w-full p-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors">
                        <LogOut size={20} className="mr-3" />
                        Çıkış Yap
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative">
                {/* Background decorative elements */}
                <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50/50 to-transparent -z-10 pointer-events-none" />

                <Outlet />
            </main>

            {/* AI Assistant Chatbot */}
            <Chatbot />
        </div>
    );
};

export default DashboardLayout;
