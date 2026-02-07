import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, TrendingUp, Brain, Target, MessageSquare, User,
    Calendar, Plus, BookOpen, CheckCircle, Clock, Edit2, Trash2,
    FileText, Activity, X, Send
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    BarChart, Bar
} from 'recharts';
import { api } from '../services/api';
import PerformanceHeatmap from './PerformanceHeatmap';
import GoalTracking from './GoalTracking';
import ProgramBuilderModal from '../components/ProgramBuilderModal';

const StudentDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // State
    const [student, setStudent] = useState(null);
    const [activeTab, setActiveTab] = useState('academic');
    const [guidanceResults, setGuidanceResults] = useState(null);
    const [homeworks, setHomeworks] = useState([]);
    const [showHomeworkModal, setShowHomeworkModal] = useState(false);
    const [showProgramBuilder, setShowProgramBuilder] = useState(false);

    // Messaging State
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    const [target, setTarget] = useState('Tıp Fakültesi');
    const [isEditingTarget, setIsEditingTarget] = useState(false);
    const [notFound, setNotFound] = useState(false);

    // Mock Graph Data
    const GRAPH_DATA = [
        { name: 'Ocak', tyt: 45, ayt: 20 },
        { name: 'Şubat', tyt: 52, ayt: 25 },
        { name: 'Mart', tyt: 58, ayt: 32 },
        { name: 'Nisan', tyt: 65, ayt: 40 },
        { name: 'Mayıs', tyt: 72, ayt: 48 },
    ];

    useEffect(() => {
        const loadData = () => {
            try {
                // Load student data safely
                const allStudents = JSON.parse(localStorage.getItem('coach_students') || '[]');
                const found = allStudents.find(s => s.id.toString() === id);

                if (found) {
                    setStudent(found);
                    setTarget(found.target || 'Hedef Belirlenmedi');
                } else {
                    console.warn(`Student with id ${id} not found.`);
                    setNotFound(true);
                }

                // Load guidance results safely
                const savedGuidance = localStorage.getItem('student_guidance_results');
                if (savedGuidance) {
                    setGuidanceResults(JSON.parse(savedGuidance));
                }
            } catch (error) {
                console.error("Error loading student details:", error);
                setNotFound(true);
            }
        };

        loadData();
    }, [id]);

    const loadMessages = async () => {
        try {
            // Mock API or LocalStorage for messages
            const msgs = await api.messages.getMessages(id) || [];
            setMessages(msgs);
        } catch (error) {
            console.error("Error loading messages:", error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            // Mock send
            const msg = { text: newMessage, sender: 'coach', timestamp: new Date() };
            setMessages([...messages, msg]);
            setNewMessage('');
            // api.messages.sendMessage(id, msg);
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleAddHomework = (e) => {
        e.preventDefault();
        const form = e.target;
        const newHomework = {
            id: Date.now(),
            title: form.title.value,
            subject: form.subject.value,
            dueDate: form.dueDate.value,
            status: 'Beklemede',
            isEditing: false,
        };
        setHomeworks([...homeworks, newHomework]);
        setShowHomeworkModal(false);
    };

    // Calculate Days Left
    const examDate = new Date('2025-06-20');
    const today = new Date();
    const daysLeft = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));

    if (notFound) {
        return (
            <div className="p-8 text-center text-gray-500 h-screen flex flex-col items-center justify-center">
                <p className="text-xl font-bold mb-4">Öğrenci Bulunamadı</p>
                <p className="mb-6">Aradığınız öğrenci sistemde kayıtlı değil veya silinmiş.</p>
                <button onClick={() => navigate('/coach/dashboard')} className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-lg font-bold">
                    Koç Paneline Dön
                </button>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="p-8 text-center text-gray-500 h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 pb-20 max-w-7xl mx-auto animate-fade-in">

            {/* Back & Header */}
            <div className="flex items-center space-x-4 mb-4">
                <button onClick={() => navigate(-1)} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm">
                    <ChevronLeft size={20} className="text-gray-600" />
                </button>
                <div className="flex-1 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{student.name} {student.surname}</h1>
                        <p className="text-gray-500 text-sm">{student.schoolNumber} • {student.grade || '12. Sınıf'} • {student.section || 'A'} Şubesi</p>
                    </div>

                    {/* Tab Switcher */}
                    <div className="bg-white p-1 rounded-xl flex space-x-1 shadow-sm border border-gray-100">
                        <button
                            onClick={() => setActiveTab('academic')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center ${activeTab === 'academic' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <TrendingUp size={16} className="mr-2" /> Akademik
                        </button>
                        <button
                            onClick={() => setActiveTab('guidance')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center ${activeTab === 'guidance' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Brain size={16} className="mr-2" /> Rehberlik
                        </button>
                        <button
                            onClick={() => setActiveTab('goals')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center ${activeTab === 'goals' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Target size={16} className="mr-2" /> Hedefler
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Sol Kolon: Profil Kartı (Sabit) */}
                <div className="space-y-6">
                    <div className="glass-card p-6 text-center relative overflow-hidden group">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-28 absolute top-0 left-0 w-full"></div>
                        <div className="relative mt-12">
                            <div className="w-28 h-28 mx-auto bg-white rounded-full p-1.5 shadow-xl">
                                <div className="w-full h-full bg-indigo-50 rounded-full flex items-center justify-center text-4xl font-bold text-indigo-600 uppercase">
                                    {student.name.charAt(0)}
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-gray-800 mt-4">{student.name}</h2>
                            <p className="text-gray-500 font-medium text-sm">{student.grade || '12. Sınıf'} Öğrencisi</p>

                            <div className="mt-6 flex justify-center space-x-2">
                                <button
                                    onClick={() => { setIsMessageModalOpen(true); loadMessages(); }}
                                    className="flex-1 flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition"
                                >
                                    <MessageSquare size={18} className="mr-2" />
                                    Mesaj
                                </button>
                                <button className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-100 transition">
                                    <User size={18} className="mr-2" />
                                    Profil
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 border-t border-gray-100 pt-6 text-left space-y-4">
                            <div className="flex justify-between items-center group">
                                <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Hedef</span>
                                {isEditingTarget ? (
                                    <input
                                        type="text"
                                        value={target}
                                        onChange={(e) => setTarget(e.target.value)}
                                        onBlur={() => setIsEditingTarget(false)}
                                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingTarget(false)}
                                        autoFocus
                                        className="font-bold text-gray-800 text-sm border-b border-indigo-500 outline-none bg-transparent w-32"
                                    />
                                ) : (
                                    <span
                                        onClick={() => setIsEditingTarget(true)}
                                        className="font-bold text-gray-800 text-sm cursor-pointer hover:text-indigo-600 hover:bg-gray-50 px-2 py-0.5 rounded transition"
                                        title="Düzenlemek için tıklayın"
                                    >
                                        {target}
                                    </span>
                                )}
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Sınava Kalan</span>
                                <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-sm">{daysLeft} Gün</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Durum</span>
                                <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded text-sm">Aktif Takipte</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="font-bold text-gray-800 mb-4">Koç Notları</h3>
                        <textarea
                            className="w-full h-32 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm resize-none"
                            placeholder="Öğrenci ile ilgili özel notlarınızı buraya alın..."
                        ></textarea>
                        <button className="mt-2 w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">Notu Kaydet</button>
                    </div>

                    {/* Program Oluşturma Araçları */}
                    <div className="glass-card p-6 border-l-4 border-l-green-500">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                            <Calendar className="mr-2 text-green-500" size={20} />
                            Program Oluştur
                        </h3>
                        {/* Only one big button now to open the Advanced Builder */}
                        <div className="space-y-3">
                            <button
                                onClick={() => setShowProgramBuilder(true)}
                                className="w-full flex items-center justify-between px-4 py-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl hover:shadow-lg transition group"
                            >
                                <div>
                                    <span className="block text-lg font-bold text-green-800 mb-1">Verimli Planlayıcı</span>
                                    <span className="text-xs text-green-600 block">Sayısal/Sözel dengeli, akıllı dağıtım</span>
                                </div>
                                <div className="bg-white p-2 rounded-full shadow-sm">
                                    <Plus size={24} className="text-green-600 group-hover:scale-110 transition" />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Orta ve Sağ Kolon İçeriği */}
                <div className="lg:col-span-2 space-y-8">

                    {/* --- AKADEMİK SEKME --- */}
                    {activeTab === 'academic' && (
                        <div className="space-y-8 animate-fade-in">
                            {/* Grafik Alanı */}
                            <div className="glass-card p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                                    <TrendingUp className="mr-2 text-indigo-500" size={20} />
                                    Net Gelişimi (TYT & AYT)
                                </h3>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={GRAPH_DATA}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Line type="monotone" dataKey="tyt" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: '#4F46E5' }} activeDot={{ r: 6 }} name="TYT Net" />
                                            <Line type="monotone" dataKey="ayt" stroke="#EC4899" strokeWidth={3} dot={{ r: 4, fill: '#EC4899' }} activeDot={{ r: 6 }} name="AYT Net" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Akıllı Konu Analizi Heatmap */}
                            <PerformanceHeatmap />

                            {/* Ödevler Listesi */}
                            <div className="glass-card p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                        <BookOpen className="mr-2 text-purple-500" size={20} />
                                        Atanan Görevler & Ödevler
                                    </h3>
                                    <button
                                        onClick={() => setShowHomeworkModal(true)}
                                        className="flex items-center px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-100 transition"
                                    >
                                        <Plus size={16} className="mr-1" />
                                        Yeni Görev
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {homeworks.map((hw) => (
                                        <div key={hw.id} className="flex items-center p-4 border border-gray-100 rounded-xl hover:border-purple-200 transition bg-white group">
                                            <div className={`p-2 rounded-lg mr-4 ${hw.status === 'Tamamlandı' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {hw.status === 'Tamamlandı' ? <CheckCircle size={20} /> : <Clock size={20} />}
                                            </div>
                                            <div className="flex-1">
                                                {hw.isEditing ? (
                                                    <div className="flex flex-col space-y-2">
                                                        <input
                                                            type="text"
                                                            defaultValue={hw.title}
                                                            onChange={(e) => {
                                                                const newHomeworks = homeworks.map(h => h.id === hw.id ? { ...h, title: e.target.value } : h);
                                                                setHomeworks(newHomeworks);
                                                            }}
                                                            className="text-sm font-semibold border border-purple-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                        />
                                                        <div className="flex space-x-2">
                                                            <input
                                                                type="text"
                                                                defaultValue={hw.subject}
                                                                onChange={(e) => {
                                                                    const newHomeworks = homeworks.map(h => h.id === hw.id ? { ...h, subject: e.target.value } : h);
                                                                    setHomeworks(newHomeworks);
                                                                }}
                                                                className="text-xs border border-gray-300 rounded px-2 py-1 w-24"
                                                            />
                                                            <input
                                                                type="date"
                                                                defaultValue={hw.dueDate}
                                                                onChange={(e) => {
                                                                    const newHomeworks = homeworks.map(h => h.id === hw.id ? { ...h, dueDate: e.target.value } : h);
                                                                    setHomeworks(newHomeworks);
                                                                }}
                                                                className="text-xs border border-gray-300 rounded px-2 py-1"
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <h4 className="font-semibold text-gray-800">{hw.title}</h4>
                                                        <p className="text-xs text-gray-500">{hw.subject} • Son Tarih: {hw.dueDate}</p>
                                                    </>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {!hw.isEditing && (
                                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${hw.status === 'Tamamlandı' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                                                        {hw.status}
                                                    </span>
                                                )}

                                                <button
                                                    onClick={() => {
                                                        const newHomeworks = homeworks.map(h => h.id === hw.id ? { ...h, isEditing: !h.isEditing } : h);
                                                        setHomeworks(newHomeworks);
                                                    }}
                                                    className={`p-1.5 rounded-lg transition ${hw.isEditing ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'text-indigo-300 hover:text-indigo-500 hover:bg-indigo-50'} opacity-0 group-hover:opacity-100 focus:opacity-100`}
                                                    title={hw.isEditing ? "Kaydet" : "Düzenle"}
                                                >
                                                    {hw.isEditing ? <CheckCircle size={16} /> : <Edit2 size={16} />}
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Bu ödevi silmek istediğinize emin misiniz?')) {
                                                            setHomeworks(homeworks.filter(h => h.id !== hw.id));
                                                        }
                                                    }}
                                                    className="text-red-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition hover:bg-red-50 rounded-lg"
                                                    title="Ödevi Sil"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}


                    {/* --- REHBERLİK RAPORLARI SEKMESİ --- */}
                    {activeTab === 'guidance' && (
                        <div className="space-y-8 animate-fade-in">
                            {!guidanceResults ? (
                                <div className="glass-card p-12 text-center text-gray-500">
                                    <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>Henüz çözülmüş bir rehberlik testi bulunmuyor.</p>
                                    <p className="text-sm">Öğrenci "Rehberlik" sayfasından test çözdükçe sonuçlar buraya düşecektir.</p>
                                </div>
                            ) : (
                                <>
                                    {/* 1. Holland ve Çoklu Zeka Grafikleri */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        {/* Holland Radar Chart */}
                                        {guidanceResults.holland && (
                                            <div className="glass-card p-6">
                                                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                                                    <Brain className="mr-2 text-indigo-500" size={20} /> Mesleki İlgi Alanları
                                                </h3>
                                                <div className="h-[250px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <RadarChart outerRadius="80%" data={guidanceResults.holland.chartData}>
                                                            <PolarGrid />
                                                            <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
                                                            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} />
                                                            <Radar name="Skor" dataKey="score" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.4} />
                                                        </RadarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-2 text-center font-medium bg-indigo-50 p-2 rounded-lg">
                                                    {guidanceResults.holland.summary}
                                                </p>
                                            </div>
                                        )}

                                        {/* Çoklu Zeka Bar Chart */}
                                        {guidanceResults.multiple_intelligence && (
                                            <div className="glass-card p-6">
                                                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                                                    <Activity className="mr-2 text-rose-500" size={20} /> Zeka Türleri
                                                </h3>
                                                <div className="h-[250px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={guidanceResults.multiple_intelligence.chartData} layout="vertical" margin={{ left: 40 }}>
                                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                            <XAxis type="number" hide />
                                                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                                                            <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '8px' }} />
                                                            <Bar dataKey="score" fill="#F43F5E" radius={[0, 4, 4, 0]} barSize={20} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-2 text-center font-medium bg-rose-50 p-2 rounded-lg">
                                                    {guidanceResults.multiple_intelligence.summary}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* 2. Diğer Testlerin Sonuç Kartları */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {Object.entries(guidanceResults).map(([key, res]) => {
                                            if (key === 'holland' || key === 'multiple_intelligence') return null;
                                            return (
                                                <div key={key} className="glass-card p-6 border-l-4 border-l-indigo-500 relative group">
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Bu raporu silmek istediğinize emin misiniz?')) {
                                                                const newResults = { ...guidanceResults };
                                                                delete newResults[key];
                                                                setGuidanceResults(newResults);
                                                            }
                                                        }}
                                                        className="absolute top-4 right-4 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1"
                                                        title="Raporu Sil"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-bold text-gray-800">{res.testName}</h4>
                                                        <span className="text-xs text-gray-400">{new Date(res.date).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="text-2xl font-bold text-indigo-600 mb-2">{res.summary}</div>
                                                    <p className="text-sm text-gray-600">{res.detail}</p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* --- HEDEFLER SEKMESİ --- */}
                    {activeTab === 'goals' && (
                        <GoalTracking />
                    )}

                </div>
            </div>

            {/* Ödev Atama Modalı */}
            {showHomeworkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-fade-in shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Yeni Görev Ata</h3>
                        <form onSubmit={handleAddHomework} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ders / Konu</label>
                                <select name="subject" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                                    <option>Matematik</option>
                                    <option>Fizik</option>
                                    <option>Kimya</option>
                                    <option>Türkçe</option>
                                    <option>Geometri</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Görev Başlığı</label>
                                <input required name="title" type="text" placeholder="Örn: 50 Soru Çözümü" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Son Tarih</label>
                                <input required name="dueDate" type="date" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowHomeworkModal(false)}
                                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition"
                                >
                                    Görevi Ata
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Program Builder Modal */}
            {showProgramBuilder && (
                <ProgramBuilderModal
                    studentId={id}
                    studentName={student.name}
                    onClose={() => setShowProgramBuilder(false)}
                />
            )}

            {/* Message Modal */}
            {isMessageModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
                        <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
                            <h3 className="font-bold flex items-center"><MessageSquare size={18} className="mr-2" /> Öğrenciyle Mesajlaş</h3>
                            <button onClick={() => setIsMessageModalOpen(false)}><X size={24} className="hover:text-indigo-200 transition" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                            {messages.length === 0 ? (
                                <p className="text-center text-gray-400 text-sm mt-10">Henüz mesaj yok. Bir şeyler yazın...</p>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.sender === 'coach' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.sender === 'coach' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>
                                            <p>{msg.text}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex gap-2">
                            <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Mesajınızı yazın..." className="flex-1 bg-gray-100 border-none rounded-full px-4 text-sm focus:outline-none" />
                            <button type="submit" className="p-2 bg-indigo-600 text-white rounded-full hover:scale-105 transition"><Send size={20} /></button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default StudentDetailPage;
