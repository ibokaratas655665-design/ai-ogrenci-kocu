import React, { useState } from 'react';
import { Users, TrendingUp, AlertCircle, BookOpen, ChevronRight, ChevronDown, Search, FileText, ClipboardList, BarChart2, Upload, Settings, Plus, CheckCircle, X, Shield, Mail, Phone, Calendar, Trash2, Activity, Edit2, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GuidanceServiceTab from './GuidanceServiceTab';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line } from 'recharts';
import { parseExcelExamData } from '../utils/excelParser';
import { parsePdfExamData } from '../utils/pdfParser';
import ProgramBuilderModal from '../components/ProgramBuilderModal';
import { useAuth } from '../context/AuthContext';

// Toast Component
const Toast = ({ message, onClose, type = 'success' }) => (
    <div className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-xl flex items-center animate-fade-in ${type === 'success' ? 'bg-gray-800 text-white' : 'bg-red-600 text-white'}`}>
        {type === 'success' ? <CheckCircle size={18} className="mr-2 text-green-400" /> : <AlertCircle size={18} className="mr-2 text-white" />}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-4 text-white/50 hover:text-white"><X size={14} /></button>
    </div>
);

const OverviewTab = ({ students, navigate, setToast, onEdit }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.schoolNumber && s.schoolNumber.toString().includes(searchQuery))
    );

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-card p-6 flex justify-between items-center border-l-4 border-indigo-500">
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Toplam Öğrenci</p>
                        <h3 className="text-3xl font-bold text-gray-800 mt-1">{students.length}</h3>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                        <Users size={28} />
                    </div>
                </div>
                <div className="glass-card p-6 flex justify-between items-center border-l-4 border-green-500">
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Haftalık Başarı</p>
                        <h3 className="text-3xl font-bold text-gray-800 mt-1">%84</h3>
                    </div>
                    <div className="p-3 bg-green-50 rounded-xl text-green-600">
                        <TrendingUp size={28} />
                    </div>
                </div>
                <div className="glass-card p-6 flex justify-between items-center border-l-4 border-red-500">
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Riskli Öğrenciler</p>
                        <h3 className="text-3xl font-bold text-gray-800 mt-1">0</h3>
                    </div>
                    <div className="p-3 bg-red-50 rounded-xl text-red-600">
                        <AlertCircle size={28} />
                    </div>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center">
                        <BookOpen size={20} className="mr-2 text-indigo-500" />
                        Öğrenci Takibi
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Öğrenci veya numara ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm w-64 transition-all"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider w-12">S.No</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">Öğrenci No</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Adı</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Soyadı</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">Sınıf</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">Cinsiyeti</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">Pansiyon</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-900 uppercase tracking-wider">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 text-sm">
                            {filteredStudents.map((s, index) => (
                                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-gray-500 font-medium">{index + 1}</td>
                                    <td className="px-4 py-3 text-center text-gray-900 font-bold">{s.schoolNumber || '-'}</td>
                                    <td
                                        className="px-4 py-3 text-indigo-700 font-bold hover:underline cursor-pointer"
                                        onClick={() => { setToast(`${s.name} profili açılıyor...`); navigate(`/coach/student/${s.id}`); }}
                                    >
                                        {s.firstName || s.name.split(' ')[0]}
                                    </td>
                                    <td className="px-4 py-3 text-gray-900 uppercase font-semibold">{s.lastName || s.name.split(' ').slice(1).join(' ')}</td>
                                    <td className="px-4 py-3 text-center text-gray-900 font-medium bg-gray-50/50">{s.grade || '-'}</td>
                                    <td className="px-4 py-3 text-center text-gray-500">{s.gender || '-'}</td>
                                    <td className="px-4 py-3 text-center text-gray-500">{s.boarding || '-'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={(e) => onEdit(e, s)}
                                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                            title="Düzenle"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredStudents.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                                        Aradığınız kriterlere uygun öğrenci bulunamadı.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

const TestsTab = ({ students, setToast }) => {
    // Mock Test Data
    const [tests, setTests] = useState(students.map(s => ({
        id: s.id,
        name: s.name,
        grade: s.grade,
        testsCompleted: 3,
        holland: 'Girişimci (G)',
        anxiety: 'Düşük'
    })));

    const handleDelete = (id) => {
        if (window.confirm('Bu öğrencinin test verilerini silmek istediğinize emin misiniz?')) {
            setTests(tests.filter(t => t.id !== id));
            setToast('Test verileri temizlendi.');
        }
    };

    return (
        <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <ClipboardList className="mr-2 text-indigo-500" size={20} />
                Öğrenci Test ve Envanter Durumları
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tests.map(s => (
                    <div key={s.id} className="border border-gray-200 p-4 rounded-xl hover:border-indigo-300 transition bg-white relative group">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                            className="absolute top-4 right-4 text-red-200 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition"
                            title="Test Kaydını Sil"
                        >
                            <Trash2 size={16} />
                        </button>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-gray-800">{s.name}</h3>
                                <p className="text-xs text-gray-500">{s.grade}</p>
                            </div>
                            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded">{s.testsCompleted} Test Tamamlandı</span>
                        </div>
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Holland Tipi:</span>
                                <span className="font-medium text-gray-800">{s.holland}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Sınav Kaygısı:</span>
                                <span className="font-medium text-green-600">{s.anxiety}</span>
                            </div>
                        </div>
                        <button onClick={() => setToast('Detaylı test raporu PDF formatında açılıyor...')} className="w-full mt-4 text-xs bg-gray-50 text-gray-600 py-2 rounded hover:bg-gray-100 transition flex items-center justify-center">
                            <FileText size={14} className="mr-2" /> Detaylı Raporu Gör
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ProgramsTab = ({ students, setToast, onOpenProgramBuilder }) => {
    // Mock Programs Data
    const [programs, setPrograms] = useState(
        students.map(s => ({
            id: s.id,
            studentName: s.name,
            programName: 'MF İleri Seviye (Hafta 3)',
            isEditing: false
        }))
    );

    const handleDownload = (name) => {
        setToast(`Program indiriliyor: ${name}_ders_programi.pdf`);
        // Mock download delay
        setTimeout(() => {
            setToast('İndirme tamamlandı ✔️');
        }, 1500);
    };

    const handleDelete = (id) => {
        if (window.confirm('Bu öğrencinin ders programını silmek istediğinize emin misiniz?')) {
            setPrograms(programs.filter(p => p.id !== id));
            setToast('Ders programı silindi.');
        }
    };

    const toggleEdit = (id) => {
        setPrograms(programs.map(p => p.id === id ? { ...p, isEditing: !p.isEditing } : p));
    };

    const handleNameChange = (id, newName) => {
        setPrograms(programs.map(p => p.id === id ? { ...p, programName: newName } : p));
    };

    return (
        <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
                <div className="flex items-center">
                    <FileText className="mr-2 text-green-500" size={20} />
                    Ders Çalışma Programları
                </div>
                <button
                    onClick={() => {
                        setToast("Program sihirbazı açılıyor...");
                        onOpenProgramBuilder();
                    }}
                    className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-100 transition"
                >
                    + Yeni Program Oluştur
                </button>
            </h2>
            <div className="space-y-4">
                {programs.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-green-300 transition group">
                        <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">
                                {p.studentName.charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-800">{p.studentName}</h4>
                                {p.isEditing ? (
                                    <input
                                        type="text"
                                        value={p.programName}
                                        onChange={(e) => handleNameChange(p.id, e.target.value)}
                                        className="text-xs border border-green-300 rounded px-2 py-1 w-48 mt-1 focus:outline-none focus:ring-1 focus:ring-green-500"
                                    />
                                ) : (
                                    <p className="text-xs text-gray-500">{p.programName}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex space-x-2 items-center">
                            <button onClick={() => handleDownload(p.studentName)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 flex items-center">
                                {/* Download Icon could be added here if imported */}
                                İndir
                            </button>
                            <button
                                onClick={() => {
                                    if (p.isEditing) setToast('Program ismi güncellendi.');
                                    toggleEdit(p.id);
                                }}
                                className={`px-3 py-1.5 text-xs rounded-lg transition text-white ${p.isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            >
                                {p.isEditing ? 'Kaydet' : 'Düzenle'}
                            </button>
                            <button
                                onClick={() => handleDelete(p.id)}
                                className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                title="Programı Sil"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                {programs.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">Hiçbir program bulunamadı.</div>
                )}
            </div>
        </div>
    );
};

const ExamsTab = ({ students, setToast }) => {
    const [showUpload, setShowUpload] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null); // For Detailed Modal

    // Data Structure:
    // exams: { id, trialId, student, tyt, ayt, total, subjects: { turkce, mat, fen, sosyal }, rank }
    // trials: { id, name, date, fileName }

    const [exams, setExams] = useState(() => {
        try {
            const saved = localStorage.getItem('exams_data');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to parse exams_data:", e);
            return [];
        }
    });

    const [trials, setTrials] = useState(() => {
        try {
            const saved = localStorage.getItem('trials_data');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to parse trials_data:", e);
            return [];
        }
    });

    // Default to opening the last trial (most recent)
    const [expandedTrialId, setExpandedTrialId] = useState(null);

    React.useEffect(() => {
        if (trials.length > 0 && expandedTrialId === null) {
            setExpandedTrialId(trials[trials.length - 1].id);
        }
    }, [trials]);

    React.useEffect(() => {
        localStorage.setItem('exams_data', JSON.stringify(exams));
        localStorage.setItem('trials_data', JSON.stringify(trials));
    }, [exams, trials]);

    // Chart 1: Progress (Average TYT over Trials)
    const progressChartData = React.useMemo(() => {
        if (trials.length === 0) return [];
        return trials.map(trial => {
            const trialResults = exams.filter(e => e.trialId === trial.id);
            const avgTyt = trialResults.reduce((acc, curr) => acc + (parseFloat(curr.tyt) || 0), 0) / (trialResults.length || 1);
            return { name: trial.name, ortalama: parseFloat(avgTyt.toFixed(2)) };
        });
    }, [exams, trials]);

    // Chart 2: Subject Analysis (Average Net per Subject across ALL exams)
    const subjectChartData = React.useMemo(() => {
        if (exams.length === 0) return [];

        const totals = { turkce: 0, mat: 0, fen: 0, sosyal: 0 };
        const counts = { turkce: 0, mat: 0, fen: 0, sosyal: 0 };

        const getNet = (val) => val?.net ?? (typeof val === 'number' ? val : 0);

        exams.forEach(e => {
            if (e.subjects) {
                if (e.subjects.turkce) { totals.turkce += getNet(e.subjects.turkce); counts.turkce++; }
                if (e.subjects.mat) { totals.mat += getNet(e.subjects.mat); counts.mat++; }
                if (e.subjects.fen) { totals.fen += getNet(e.subjects.fen); counts.fen++; }
                if (e.subjects.sosyal) { totals.sosyal += getNet(e.subjects.sosyal); counts.sosyal++; }
            }
        });

        return [
            { subject: 'Türkçe', A: counts.turkce > 0 ? (totals.turkce / counts.turkce).toFixed(1) : 0, fullMark: 40 },
            { subject: 'Matematik', A: counts.mat > 0 ? (totals.mat / counts.mat).toFixed(1) : 0, fullMark: 40 },
            { subject: 'Fen', A: counts.fen > 0 ? (totals.fen / counts.fen).toFixed(1) : 0, fullMark: 20 },
            { subject: 'Sosyal', A: counts.sosyal > 0 ? (totals.sosyal / counts.sosyal).toFixed(1) : 0, fullMark: 20 },
        ];
    }, [exams]);

    // Calculate History for Selected Student
    const studentHistoryData = React.useMemo(() => {
        if (!selectedStudent || !exams) return [];
        return exams
            .filter(e => e.student === selectedStudent.student)
            .sort((a, b) => a.trialId - b.trialId)
            .map(e => ({
                name: e.name || 'Deneme',
                tyt: e.tyt
            }));
    }, [selectedStudent, exams]);

    const getNet = (val) => val?.net ?? (typeof val === 'number' ? val : 0);
    const getD = (val) => val?.d ?? 0;
    const getY = (val) => val?.y ?? 0;

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset input so same file can be selected again if deleted
        e.target.value = '';

        // Determine Trial Name
        const nextTrialNumber = trials.length + 1;
        const trialName = `${nextTrialNumber}. Deneme`;
        const trialId = Date.now();

        // Register New Trial
        const newTrial = {
            id: trialId,
            name: trialName,
            date: new Date().toLocaleDateString('tr-TR'),
            fileName: file.name
        };

        if (file.name.endsWith('.pdf')) {
            setToast('PDF dosyası analiz ediliyor...');
            // PDF parsing logic
        } else if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            alert("Lütfen sadece Excel (.xlsx) veya PDF (.pdf) dosyası yükleyin.");
            return;
        }

        setToast('Dosya analiz ediliyor...');

        try {
            let parsedOutput;
            if (file.name.endsWith('.pdf')) {
                parsedOutput = await parsePdfExamData(file);
            } else {
                parsedOutput = await parseExcelExamData(file);
            }
            // Handle both legacy (array) and new (object) return formats
            const results = Array.isArray(parsedOutput) ? parsedOutput : parsedOutput.results;
            const debugInfo = parsedOutput.debugInfo;

            // Check for "All Zero" issue
            const allZero = results.length > 0 && results.every(r => r.tyt === 0);

            if (allZero) {
                console.warn("Detailed Debug Info:", debugInfo);
                const headerList = debugInfo?.headers ? debugInfo.headers.join(', ') : 'Okunamadı';
                alert(`UYARI: ${results.length} öğrenci bulundu ancak notlar 0 görünüyor.\n\nSistem şu başlıkları okudu:\n${headerList}\n\nLütfen Excel dosyanızdaki sütun isimlerini kontrol edin (Örn: "Türkçe", "Matematik" yazıyor mu?).`);
            }

            // Add metadata to results
            const newResults = results.map((res, index) => ({
                ...res,
                id: Date.now() + index,
                trialId: trialId,
                date: newTrial.date,
                name: trialName, // Keep name for legacy view support
                classLevel: '12', // Header parser could extract this too in future
                branch: 'A'
            }));

            setTrials(prev => [...prev, newTrial]);
            setExams(prev => [...prev, ...newResults]);

            if (allZero) {
                setToast(`${trialName} yüklendi ancak veriler 0 görünüyor. Lütfen sütunları kontrol edin.`);
            } else {
                setToast(`${trialName} başarıyla analiz edildi (${newResults.length} öğrenci).`);
            }
            setShowUpload(false);
        } catch (error) {
            console.error("Upload Error Details:", error);
            // Construct a detailed error message
            let detailedMsg = "Bilinmeyen bir hata oluştu.";

            if (typeof error === 'string') {
                detailedMsg = error;
            } else if (error.message) {
                detailedMsg = error.message;
                // Add stack trace or extra info if available and helpful
                if (error.stack) console.debug(error.stack);
            }

            setToast(`Hata: ${detailedMsg}`);
            alert(`Detaylı Hata Raporu:\n\n${detailedMsg}\n\nLütfen bu mesajı geliştirici ile paylaşın.`);
        }
    };

    const handleDeleteTrial = (trialId) => {
        if (window.confirm('Bu denemeyi ve tüm sonuçlarını silmek istediğinize emin misiniz?')) {
            setTrials(trials.filter(t => t.id !== trialId));
            setExams(exams.filter(e => e.trialId !== trialId));
            setToast('Deneme silindi.');
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <BarChart2 className="mr-2 text-purple-600" size={24} />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
                        Gelişmiş Deneme Analiz Merkezi
                    </span>
                </h2>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setShowUpload(!showUpload)}
                        className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition shadow-lg shadow-purple-200"
                    >
                        <Plus size={18} />
                        <span>Yeni Deneme Yükle</span>
                    </button>
                </div>
            </div>

            {/* Analysis Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Progress Chart */}
                <div className="glass-card p-6">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center">
                        <TrendingUp size={18} className="mr-2 text-green-500" />
                        Deneme Gelişim Grafiği (Ortalama TYT)
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={progressChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="ortalama" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Subject Radar (Snapshot of Latest Average) */}
                <div className="glass-card p-6">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center">
                        <Activity size={18} className="mr-2 text-blue-500" />
                        Genel Ders Başarısı (Ortalama)
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={subjectChartData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" />
                                <PolarRadiusAxis angle={30} domain={[0, 40]} />
                                <Radar name="Sınıf Ortalaması" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                <RechartsTooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                    <div className="text-xs text-gray-500 font-bold uppercase mb-1">Toplam Deneme</div>
                    <div className="text-2xl font-bold text-gray-800">{trials.length}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                    <div className="text-xs text-gray-500 font-bold uppercase mb-1">İncelenen Öğrenci</div>
                    <div className="text-2xl font-bold text-indigo-600">{exams.length}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                    <div className="text-xs text-gray-500 font-bold uppercase mb-1">En Yüksek (TYT)</div>
                    <div className="text-2xl font-bold text-green-600">{Math.max(0, ...exams.map(e => e.tyt)).toFixed(1)}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                    <div className="text-xs text-gray-500 font-bold uppercase mb-1">Son Deneme Ort.</div>
                    <div className="text-2xl font-bold text-purple-600">
                        {progressChartData.length > 0 ? progressChartData[progressChartData.length - 1].ortalama : '-'}
                    </div>
                </div>
            </div>

            {showUpload && (
                <div className="glass-card p-6 border-2 border-purple-100 animate-fade-in">
                    <h3 className="font-semibold text-gray-800 mb-4">Yeni Deneme Sınavı Yükle</h3>
                    <div className="grid grid-cols-1 gap-6">
                        <div className="relative">
                            <input
                                type="file"
                                id="examResultUpload"
                                className="hidden"
                                accept=".xlsx"
                                onChange={handleFileUpload}
                            />
                            <label
                                htmlFor="examResultUpload"
                                className="border-2 border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition w-full"
                            >
                                <Upload size={64} className="text-purple-500 mb-6" />
                                <p className="text-gray-800 font-bold text-lg">Excel Listesini Buraya Bırakın</p>
                                <p className="text-sm text-gray-500 mt-2">
                                    Sistem <strong>Ad, Türkçe, Mat, Fen, Sosyal</strong> sütunlarını otomatik tanır.
                                </p>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {/* Trials List Accordion */}
            <div className="space-y-4">
                <h3 className="font-bold text-gray-800 ml-1">Deneme Arşivi</h3>
                {trials.length === 0 && <p className="text-gray-400 text-center py-8">Henüz analiz edilmiş veri yok.</p>}

                {trials.slice().reverse().map((trial) => (
                    <div key={trial.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm transition hover:border-purple-200">
                        <div
                            className="p-4 bg-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition"
                            onClick={() => setExpandedTrialId(expandedTrialId === trial.id ? null : trial.id)}
                        >
                            <div className="flex items-center">
                                <div className={`mr-3 transition-transform duration-300 ${expandedTrialId === trial.id ? 'rotate-180' : ''}`}>
                                    <ChevronDown size={20} className="text-gray-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 flex items-center">
                                        {trial.name}
                                        {expandedTrialId === trial.id && <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Açık</span>}
                                    </h4>
                                    <p className="text-xs text-gray-500">{trial.fileName} • {trial.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">
                                    {exams.filter(e => e.trialId === trial.id).length} Sonuç
                                </span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteTrial(trial.id); }}
                                    className="text-red-300 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition"
                                    title="Denemeyi Sil"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Collapsible Content */}
                        {expandedTrialId === trial.id && (
                            <div className="overflow-x-auto border-t border-gray-100 animate-fade-in">
                                <table className="min-w-full divide-y divide-gray-100">
                                    <thead className="bg-white">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Öğrenci</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">TYT Toplam</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 hidden md:table-cell">Tr</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 hidden md:table-cell">Mat</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 hidden md:table-cell">Fen</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 hidden md:table-cell">Sos</th>
                                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Detay</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 text-sm">
                                        {exams.filter(e => e.trialId === trial.id).map((result) => (
                                            <tr key={result.id} className="hover:bg-gray-50 group cursor-pointer" onClick={() => setSelectedStudent(result)}>
                                                <td className="px-4 py-2 font-medium text-gray-900 group-hover:text-indigo-600">{result.student}</td>
                                                <td className="px-4 py-2 text-indigo-600 font-bold">{result.tyt}</td>
                                                {/* Optional safe access in case fields missing - Using Helper */}
                                                <td className="px-4 py-2 text-gray-500 hidden md:table-cell">{getNet(result.subjects?.turkce).toFixed(1)}</td>
                                                <td className="px-4 py-2 text-gray-500 hidden md:table-cell">{getNet(result.subjects?.mat).toFixed(1)}</td>
                                                <td className="px-4 py-2 text-gray-500 hidden md:table-cell">{getNet(result.subjects?.fen).toFixed(1)}</td>
                                                <td className="px-4 py-2 text-gray-500 hidden md:table-cell">{getNet(result.subjects?.sosyal).toFixed(1)}</td>
                                                <td className="px-4 py-2 text-right">
                                                    <button className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100">
                                                        Karne
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Student Detail Modal */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedStudent(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">{selectedStudent.student}</h3>
                                <p className="text-sm text-gray-500">{selectedStudent.name} Sonuç Karnesi</p>
                            </div>
                            <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-8">
                            {/* Metadata Section (Personal Info) */}
                            {selectedStudent.metadata && Object.keys(selectedStudent.metadata).length > 0 && (
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 animate-fade-in">
                                    <h4 className="font-bold text-gray-700 mb-3 flex items-center text-sm uppercase tracking-wide">
                                        <Users size={16} className="mr-2 text-indigo-500" />
                                        Öğrenci Bilgileri
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-6 text-sm">
                                        {Object.entries(selectedStudent.metadata).map(([key, val]) => (
                                            <div key={key} className="border-l-2 border-indigo-100 pl-3">
                                                <span className="block text-gray-400 text-xs font-semibold uppercase mb-0.5">{key}</span>
                                                <span className="font-bold text-gray-800">{val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Key Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-indigo-50 p-4 rounded-xl text-center">
                                    <div className="text-xs text-indigo-800 font-medium uppercase">TYT Toplam</div>
                                    <div className="text-3xl font-bold text-indigo-600">{selectedStudent.tyt}</div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-xl text-center">
                                    <div className="text-xs text-green-800 font-medium uppercase">Genel Sıralama</div>
                                    <div className="text-3xl font-bold text-green-600">#{selectedStudent.rank}</div>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-xl text-center">
                                    <div className="text-xs text-purple-800 font-medium uppercase">Katılım</div>
                                    <div className="text-3xl font-bold text-purple-600">{studentHistoryData.length}</div>
                                    <div className="text-xs text-purple-400">Deneme</div>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-xl text-center">
                                    <div className="text-xs text-orange-800 font-medium uppercase">Net Ortalaması</div>
                                    <div className="text-3xl font-bold text-orange-600">
                                        {(studentHistoryData.reduce((a, b) => a + b.tyt, 0) / (studentHistoryData.length || 1)).toFixed(1)}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* D/Y/N Table */}
                                <div>
                                    <h4 className="font-bold text-gray-700 mb-4 flex items-center">
                                        <ClipboardList size={18} className="mr-2 text-indigo-500" />
                                        Detaylı Net Analizi
                                    </h4>
                                    <div className="overflow-hidden rounded-xl border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Ders</th>
                                                    <th className="px-4 py-2 text-center text-xs font-semibold text-green-600">Doğru</th>
                                                    <th className="px-4 py-2 text-center text-xs font-semibold text-red-600">Yanlış</th>
                                                    <th className="px-4 py-2 text-center text-xs font-semibold text-indigo-600">Net</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white text-sm">
                                                {[
                                                    { name: 'Türkçe', key: 'turkce' },
                                                    { name: 'Matematik', key: 'mat' },
                                                    { name: 'Fen Bilimleri', key: 'fen' },
                                                    { name: 'Sosyal Bil.', key: 'sosyal' }
                                                ].map((subject) => {
                                                    const data = selectedStudent.subjects?.[subject.key];
                                                    return (
                                                        <tr key={subject.key} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 font-medium text-gray-800">{subject.name}</td>
                                                            <td className="px-4 py-3 text-center text-green-600 font-bold">{getD(data)}</td>
                                                            <td className="px-4 py-3 text-center text-red-500">{getY(data)}</td>
                                                            <td className="px-4 py-3 text-center font-bold text-indigo-600">{getNet(data).toFixed(2)}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Radar Chart */}
                                <div>
                                    <h4 className="font-bold text-gray-700 mb-4 flex items-center">
                                        <Activity size={18} className="mr-2 text-purple-500" />
                                        Başarı Dağılımı
                                    </h4>
                                    <div className="h-64 w-full bg-gray-50 rounded-xl relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                                                { subject: 'Türkçe', A: getNet(selectedStudent.subjects?.turkce), fullMark: 40 },
                                                { subject: 'Matematik', A: getNet(selectedStudent.subjects?.mat), fullMark: 40 },
                                                { subject: 'Fen', A: getNet(selectedStudent.subjects?.fen), fullMark: 20 },
                                                { subject: 'Sosyal', A: getNet(selectedStudent.subjects?.sosyal), fullMark: 20 },
                                            ]}>
                                                <PolarGrid />
                                                <PolarAngleAxis dataKey="subject" />
                                                <PolarRadiusAxis angle={30} domain={[0, 40]} />
                                                <Radar name={selectedStudent.student} dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.5} />
                                                <RechartsTooltip />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* History Line Chart */}
                            <div>
                                <h4 className="font-bold text-gray-700 mb-4 flex items-center">
                                    <TrendingUp size={18} className="mr-2 text-blue-500" />
                                    Gelişim Grafiği (Tüm Denemeler)
                                </h4>
                                <div className="h-64 w-full bg-white border border-gray-100 rounded-xl p-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={studentHistoryData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                            <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} />
                                            <RechartsTooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="tyt"
                                                stroke="#4f46e5"
                                                strokeWidth={3}
                                                dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                                                activeDot={{ r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ManageCoachesTab = ({ setToast }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [coaches, setCoaches] = useState([
        { id: 1, name: 'İbrahim Karataş', email: 'ibrahim@example.com', role: 'Yönetici Koç', status: 'Aktif', studentCount: 0 }
    ]);

    const handleDeleteCoach = (id) => {
        if (window.confirm('Bu koçu silmek istediğinize emin misiniz?')) {
            setCoaches(coaches.filter(c => c.id !== id));
            setToast('Koç kaydı silindi.');
        }
    };

    const handleToggleRole = (id) => {
        const updatedCoaches = coaches.map(c => {
            if (c.id === id) {
                const newRole = c.role === 'Koç' ? 'Yönetici Koç' : 'Koç';
                setToast(`${c.name} adlı kullanıcının yetkisi güncellendi: ${newRole}`);
                return { ...c, role: newRole };
            }
            return c;
        });
        setCoaches(updatedCoaches);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-lg flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold flex items-center">
                        <Shield className="mr-3" size={28} />
                        Koç Yönetim Paneli
                    </h2>
                    <p className="text-indigo-200 mt-1">Kurumunuzdaki diğer koçları buradan yönetebilir, yetki ve atamalarını yapabilirsiniz.</p>
                </div>
                <button onClick={() => setIsAddModalOpen(true)} className="bg-white text-indigo-900 px-6 py-3 rounded-xl font-bold flex items-center hover:bg-indigo-50 transition shadow-lg border border-transparent hover:border-indigo-200">
                    <Plus size={20} className="mr-2" />
                    Yeni Koç Ekle
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Koç Adı</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">E-posta</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Yetki</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Durum</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Öğrenci Sayısı</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {coaches.map((coach) => (
                            <tr key={coach.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                            {coach.name.charAt(0)}
                                        </div>
                                        <div className="ml-4 font-medium text-gray-900">{coach.name}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{coach.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        onClick={() => handleToggleRole(coach.id)}
                                        className={`px-2 py-1 rounded-md text-xs font-bold cursor-pointer select-none hover:opacity-80 ${coach.role === 'Yönetici Koç' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}
                                        title="Yetkiyi değiştirmek için tıklayın"
                                    >
                                        {coach.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${coach.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {coach.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-bold">{coach.studentCount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-2">
                                    <button className="text-gray-400 hover:text-indigo-600 transition p-1"><Settings size={18} /></button>
                                    <button
                                        onClick={() => handleDeleteCoach(coach.id)}
                                        className="text-red-300 hover:text-red-500 transition p-1"
                                        title="Koçu Sil"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Coach Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
                        <div className="bg-indigo-900 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-white font-bold text-lg">Yeni Koç Ekle</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-indigo-200 hover:text-white"><X size={24} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Ad Soyad</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                    <input type="text" className="pl-10 w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Örn: Ahmet Yılmaz" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">E-posta Adresi</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                    <input type="email" className="pl-10 w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="ahmet@ornek.com" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Telefon (Opsiyonel)</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                    <input type="tel" className="pl-10 w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="0555 123 45 67" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Yetki Seviyesi</label>
                                <select className="w-full border border-gray-300 rounded-lg p-2 bg-white">
                                    <option>Standart Koç (Sadece Kendi Öğrencileri)</option>
                                    <option>Yönetici Koç (Tüm Yetkiler)</option>
                                </select>
                            </div>
                            <div className="pt-4 flex space-x-3">
                                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition">İptal</button>
                                <button onClick={() => { setIsAddModalOpen(false); setToast('Davetiyesi gönderildi!'); }} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition">Davet Et</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StudentModal = ({ student, onClose, onSave }) => {
    const [formData, setFormData] = useState(student || {
        name: '',
        schoolNumber: '',
        grade: '',
        target: '',
        parentEmail: '',
        section: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
                <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-white font-bold text-lg">{student ? 'Öğrenci Düzenle' : 'Yeni Öğrenci Ekle'}</h3>
                    <button onClick={onClose} className="text-indigo-200 hover:text-white"><X size={24} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Öğrenci Adı Soyadı</label>
                        <div className="relative">
                            <Users className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                type="text"
                                className="pl-10 w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                                placeholder="Örn: Mehmet Öz"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Okul No</label>
                            <input
                                name="schoolNumber"
                                value={formData.schoolNumber}
                                onChange={handleChange}
                                type="text"
                                className="w-full border border-gray-300 rounded-lg p-2"
                                placeholder="123"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Şube</label>
                            <input
                                name="section"
                                value={formData.section}
                                onChange={handleChange}
                                type="text"
                                className="w-full border border-gray-300 rounded-lg p-2"
                                placeholder="A"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Sınıf / Seviye</label>
                        <select
                            name="grade"
                            value={formData.grade}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-700"
                        >
                            <option value="">Seçiniz...</option>
                            <option value="8. Sınıf (LGS)">8. Sınıf (LGS)</option>
                            <option value="10. Sınıf">10. Sınıf</option>
                            <option value="11. Sınıf">11. Sınıf</option>
                            <option value="12. Sınıf (YKS)">12. Sınıf (YKS)</option>
                            <option value="Mezun (YKS)">Mezun (YKS)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Hedef Bölüm / Lise</label>
                        <input
                            name="target"
                            value={formData.target}
                            onChange={handleChange}
                            type="text"
                            className="w-full border border-gray-300 rounded-lg p-2"
                            placeholder="Örn: Tıp Fakültesi"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Velisi E-posta</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                name="parentEmail"
                                value={formData.parentEmail}
                                onChange={handleChange}
                                type="email"
                                className="pl-10 w-full border border-gray-300 rounded-lg p-2"
                                placeholder="veli@ornek.com"
                            />
                        </div>
                    </div>
                    <div className="pt-4 flex space-x-3">
                        <button onClick={onClose} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition">İptal</button>
                        <button onClick={() => onSave(formData)} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition">Kaydet</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CoachDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [toast, setToast] = useState(null);
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

    // Program Builder State
    const [isProgramBuilderOpen, setIsProgramBuilderOpen] = useState(false);
    const [selectedStudentForProgram, setSelectedStudentForProgram] = useState(null);

    // Edit Student State
    const [editingStudent, setEditingStudent] = useState(null);

    // Admin ise 'Yönetici Koç' modunda çalışır
    const isMasterCoach = user?.role === 'admin';

    // Students State
    const [students, setStudents] = useState(() => {
        const saved = localStorage.getItem('coach_students');
        const parsed = saved ? JSON.parse(saved) : [];
        // Sanitize: Remove '9. Sınıf' from existing data immediately
        return parsed.map(s => s.grade === '9. Sınıf' ? { ...s, grade: '' } : s);
    });

    // Save to LocalStorage whenever students change
    React.useEffect(() => {
        localStorage.setItem('coach_students', JSON.stringify(students));
    }, [students]);

    const handleStudentListUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset input
        e.target.value = '';

        setToast('Liste işleniyor...');

        try {
            let parsedData;
            if (file.name.endsWith('.pdf')) {
                parsedData = await parsePdfExamData(file);
            } else {
                // Determine if it's a simple list or exam result
                // We'll use the same parser but extract just student info
                parsedData = await parseExcelExamData(file);
            }

            const rawResults = Array.isArray(parsedData) ? parsedData : parsedData.results;

            if (!rawResults || rawResults.length === 0) {
                throw new Error("Listede öğrenci bulunamadı.");
            }

            const newStudents = rawResults.map((item, index) => {
                // Determine Name Components
                let firstName = item.firstName;
                let lastName = item.lastName;

                // If detailed parser didn't find split names, try to split full name
                if (!firstName && item.student) {
                    const parts = item.student.trim().split(' ');
                    if (parts.length > 1) {
                        lastName = parts.pop();
                        firstName = parts.join(' ');
                    } else {
                        firstName = item.student;
                    }
                }

                const metadata = parsedData.metadata || {};
                // Determine Class Level
                // Priority: Per-Student Row > File Metadata > Fallback (Manual Entry Required)
                const grade = metadata.classLevel || item.grade || '';
                const section = metadata.section || item.section || '';

                return {
                    id: Date.now() + index,
                    name: item.student || `${firstName} ${lastName}`,
                    firstName: firstName,
                    lastName: lastName,
                    schoolNumber: item.number || '',
                    gender: item.gender || '',
                    boarding: item.boarding || '',
                    grade: grade,
                    section: section,
                    status: 'Aktif',
                    progress: 0,
                    lastAction: 'Yeni Kayıt'
                };
            });

            // Optional: Filter duplicates based on name
            const uniqueNewStudents = newStudents.filter(ns =>
                !students.some(existing => existing.name === ns.name)
            );

            if (uniqueNewStudents.length === 0) {
                setToast("Seçilen öğrenciler zaten sistemde kayıtlı.");
                return;
            }

            setStudents(prev => [...prev, ...uniqueNewStudents]);
            setToast(`${uniqueNewStudents.length} yeni öğrenci sisteme eklendi.`);

        } catch (error) {
            console.error("List Upload Error:", error);

            let detailedMsg = "Dosya işlenemedi.";
            if (typeof error === 'string') {
                detailedMsg = error;
            } else if (error.message) {
                detailedMsg = error.message;
            }

            setToast(`Hata: ${detailedMsg}`);
            alert(`Liste Yükleme Hatası:\n\n${detailedMsg}`);
        }
    };

    const handleClearList = () => {
        if (students.length === 0) return;
        if (window.confirm('Tüm öğrenci listesini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
            setStudents([]);
            localStorage.removeItem('coach_students');
            setToast('Liste başarıyla temizlendi.');
        }
    };

    const handleCloseToast = () => setToast(null);

    // Auto-dismiss toast
    React.useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleSaveStudent = (data) => {
        if (editingStudent) {
            // Update Existing
            setStudents(students.map(s => s.id === editingStudent.id ? { ...s, ...data } : s));
            setToast('Öğrenci bilgileri güncellendi.');
        } else {
            // Create New
            const newStudent = {
                id: Date.now(),
                ...data,
                status: 'Aktif',
                progress: 0,
                lastAction: 'Yeni Kayıt'
            };
            setStudents([...students, newStudent]);
            setToast('Yeni öğrenci eklendi.');
        }
        setIsStudentModalOpen(false);
        setEditingStudent(null);
    };

    const openEditStudent = (e, student) => {
        e.stopPropagation();
        setEditingStudent(student);
        setIsStudentModalOpen(true);
    };

    return (
        <div className="p-8 space-y-8 pb-20 max-w-7xl mx-auto relative">
            {/* Global Toast */}
            {toast && <Toast message={toast} onClose={handleCloseToast} />}

            {/* Header */}
            <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">İbrahim Karataş - Koç Paneli 🚀</h1>
                    <p className="text-gray-500">Öğrenci performanslarını ve gelişimlerini buradan yönetin.</p>
                </div>
                <div className="flex space-x-4 items-center">
                    {students.length > 0 && (
                        <button
                            onClick={handleClearList}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition flex items-center space-x-1"
                            title="Listeyi Temizle"
                        >
                            <Trash2 size={20} />
                            <span className="hidden md:inline font-medium">Listeyi Sil</span>
                        </button>
                    )}
                    <div className="relative">
                        <input
                            type="file"
                            id="studentListUpload"
                            className="hidden"
                            accept=".xlsx, .xls, .pdf"
                            onChange={handleStudentListUpload}
                        />
                        <label
                            htmlFor="studentListUpload"
                            className="btn-secondary flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition cursor-pointer shadow-lg"
                        >
                            <Upload size={20} />
                            <span>Liste Yükle</span>
                        </label>
                    </div>
                    <button onClick={() => { setEditingStudent(null); setIsStudentModalOpen(true); }} className="btn-primary flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-lg">
                        <Users size={20} />
                        <span>Öğrenci Ekle</span>
                    </button>
                    <button onClick={() => navigate('/')} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                        Çıkış Yap
                    </button>
                    <button
                        onClick={() => {
                            let url = window.location.href;
                            // Check if running locally or in Electron (file:// or localhost)
                            if (url.includes('localhost') || url.includes('127.0.0.1') || url.startsWith('file://')) {
                                const newUrl = prompt(
                                    "Şu an internetsiz/yerel moddasınız.\n\nBaşkalarının erişebilmesi için geçerli bir Web Sitesi adresi girmelisiniz.\n\nÖrnek: https://www.google.com veya kendi siteniz:",
                                    "https://"
                                );
                                if (newUrl && newUrl !== "https://") {
                                    url = newUrl;
                                } else {
                                    alert("Geçerli bir link girmediniz. Kopyalama iptal edildi.");
                                    return;
                                }
                            }

                            navigator.clipboard.writeText(url).then(() => {
                                alert("Link kopyalandı! \n\n" + url);
                            }, () => {
                                prompt("Link kopyalanamadı. Manuel kopyalayınız:", url);
                            });
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center shadow-lg"
                    >
                        <Share2 size={20} className="mr-2" />
                        <span>Sistemi Paylaş</span>
                    </button>
                </div>
            </header >

            {/* Tabs Navigation */}
            < div className="flex space-x-2 border-b border-gray-200 overflow-x-auto pb-1 no-scrollbar" >
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 font-medium text-sm rounded-t-lg transition whitespace-nowrap ${activeTab === 'overview' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Genel Bakış
                </button>
                <button
                    onClick={() => setActiveTab('tests')}
                    className={`px-4 py-2 font-medium text-sm rounded-t-lg transition whitespace-nowrap ${activeTab === 'tests' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Test ve Envanterler
                </button>
                <button
                    onClick={() => setActiveTab('programs')}
                    className={`px-4 py-2 font-medium text-sm rounded-t-lg transition whitespace-nowrap ${activeTab === 'programs' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Ders Programları
                </button>
                <button
                    onClick={() => setActiveTab('exams')}
                    className={`px-4 py-2 font-medium text-sm rounded-t-lg transition whitespace-nowrap ${activeTab === 'exams' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Deneme Sonuçları
                </button>
                <button
                    onClick={() => setActiveTab('guidance')}
                    className={`px-4 py-2 font-medium text-sm rounded-t-lg transition whitespace-nowrap ${activeTab === 'guidance' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Okul Rehberlik Servisi
                </button>
                {
                    isMasterCoach && (
                        <button
                            onClick={() => setActiveTab('coaches')}
                            className={`px-4 py-2 font-bold text-sm rounded-t-lg transition whitespace-nowrap flex items-center ${activeTab === 'coaches' ? 'bg-indigo-900 text-white border-b-2 border-indigo-900' : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100'}`}
                        >
                            <Shield size={16} className="mr-2" />
                            Koç Yönetimi
                        </button>
                    )
                }
            </div >

            {/* Tab Content */}
            < div className="animate-fade-in" >
                {activeTab === 'overview' && <OverviewTab students={students} navigate={navigate} setToast={setToast} onEdit={openEditStudent} />}
                {activeTab === 'tests' && <TestsTab students={students} setToast={setToast} />}
                {activeTab === 'programs' && <ProgramsTab students={students} setToast={setToast} onOpenProgramBuilder={() => setIsProgramBuilderOpen(true)} />}
                {activeTab === 'exams' && <ExamsTab students={students} setToast={setToast} />}
                {activeTab === 'guidance' && <GuidanceServiceTab students={students} />}
                {activeTab === 'coaches' && <ManageCoachesTab setToast={setToast} />}
            </div >

            {/* Student Modal (Add/Edit) */}
            {
                isStudentModalOpen && (
                    <StudentModal
                        student={editingStudent}
                        onClose={() => { setIsStudentModalOpen(false); setEditingStudent(null); }}
                        onSave={handleSaveStudent}
                    />
                )
            }

            {/* Program Builder Modal */}
            {
                isProgramBuilderOpen && (
                    <ProgramBuilderModal
                        studentId={selectedStudentForProgram?.id}
                        studentName={selectedStudentForProgram?.name}
                        onClose={() => { setIsProgramBuilderOpen(false); setSelectedStudentForProgram(null); }}
                    />
                )
            }
        </div >
    );
};

export default CoachDashboard;
