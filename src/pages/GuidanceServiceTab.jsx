import React, { useState } from 'react';
import { LayoutDashboard, Users, AlertCircle, Folder, Monitor, FileText, ClipboardList, ChevronDown, Upload, Download, CheckCircle, BarChart2, Bell, Search, ChevronRight, Share2, Printer, Trash2 } from 'lucide-react';
import BEPGenerator from '../components/BEPGenerator';
import { guidanceDecimalSystem } from '../data/guidanceDecimal';
import GuidanceTests from './GuidanceTests';
import GuidanceForms from './GuidanceForms';

const GuidanceOverview = () => (
    <div className="space-y-6 animate-fade-in">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Aktif Görüşme</p>
                    <h3 className="text-2xl font-bold text-gray-800">0</h3>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <Users size={24} />
                </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Riskli Öğrenci</p>
                    <h3 className="text-2xl font-bold text-gray-800">0</h3>
                </div>
                <div className="bg-red-50 p-2 rounded-lg text-red-600">
                    <AlertCircle size={24} />
                </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Yıllık Plan</p>
                    <h3 className="text-2xl font-bold text-gray-800">%0</h3>
                </div>
                <div className="bg-green-50 p-2 rounded-lg text-green-600">
                    <CheckCircle size={24} />
                </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Bekleyen BEP</p>
                    <h3 className="text-2xl font-bold text-gray-800">0</h3>
                </div>
                <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                    <FileText size={24} />
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                        <Bell className="mr-2 text-indigo-500" size={20} />
                        Güncel Bildirimler & Hatırlatmalar
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-start p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                            <AlertCircle size={18} className="text-yellow-600 mt-0.5 mr-3 shrink-0" />
                            <div>
                                <h4 className="font-bold text-yellow-800 text-sm">Okul Risk Haritası Veri Girişi</h4>
                                <p className="text-yellow-700 text-xs mt-1">Sınıf rehber öğretmenlerinden gelen verilerin 15 Şubat'a kadar sisteme işlenmesi gerekmektedir.</p>
                            </div>
                        </div>
                        <div className="flex items-start p-3 bg-blue-50 rounded-xl border border-blue-100">
                            <Users size={18} className="text-blue-600 mt-0.5 mr-3 shrink-0" />
                            <div>
                                <h4 className="font-bold text-blue-800 text-sm">BEP Toplantısı (9/A Sınıfı)</h4>
                                <p className="text-blue-700 text-xs mt-1">Yarın saat 14:30'da öğretmenler odasında yapılacaktır.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800">Son Görüşmeler</h3>
                        <button className="text-sm text-indigo-600 font-medium hover:underline">Tümünü Gör</button>
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                            <tr>
                                <th className="py-3 px-4 rounded-tl-lg">Öğrenci</th>
                                <th className="py-3 px-4">Konu</th>
                                <th className="py-3 px-4">Tarih</th>
                                <th className="py-3 px-4 rounded-tr-lg">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {/* Empty state or loaded data */}
                            <tr className="bg-gray-50">
                                <td colSpan="4" className="py-8 text-center text-gray-500">
                                    Henüz kayıtlı görüşme bulunmamaktadır.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white text-center shadow-lg">
                    <h3 className="font-bold text-lg mb-2">Hızlı İşlemler</h3>
                    <p className="text-white/80 text-sm mb-6">Sık kullanılan rehberlik araçlarına buradan ulaşabilirsiniz.</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-xl transition flex flex-col items-center justify-center">
                            <FileText size={20} className="mb-2" />
                            <span className="text-xs font-bold">BEP Hazırla</span>
                        </button>
                        <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-xl transition flex flex-col items-center justify-center">
                            <Users size={20} className="mb-2" />
                            <span className="text-xs font-bold">Görüşme Ekle</span>
                        </button>
                        <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-xl transition flex flex-col items-center justify-center">
                            <BarChart2 size={20} className="mb-2" />
                            <span className="text-xs font-bold">Test Ata</span>
                        </button>
                        <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-xl transition flex flex-col items-center justify-center">
                            <ClipboardList size={20} className="mb-2" />
                            <span className="text-xs font-bold">Raporlar</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4">Online Anket Linkleri</h3>
                    <div className="space-y-4">
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-gray-500 uppercase">Sınıf Risk Haritası</span>
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            </div>
                            <div className="flex space-x-2">
                                <input readOnly value="rehberlik.app/risk/8372" className="flex-1 text-xs bg-white border border-gray-200 rounded px-2 py-1.5 text-gray-600" />
                                <button className="bg-gray-200 hover:bg-gray-300 p-1.5 rounded transition text-gray-600"><ClipboardList size={14} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const GuidanceCounseling = () => (
    <div className="animate-fade-in flex flex-col items-center justify-center h-[400px] bg-white rounded-2xl border border-gray-200 border-dashed">
        <div className="bg-indigo-50 p-6 rounded-full mb-4">
            <Users size={48} className="text-indigo-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">Bireysel Görüşme Modülü</h3>
        <p className="text-gray-500 mt-2 max-w-md text-center">
            Öğrenci ve veli görüşmeleri için detaylı form yapısı ve geçmiş kayıtlar burada listelenecek.
        </p>
        <button className="mt-6 btn-primary">
            + Yeni Görüşme Formu Aç (Demo)
        </button>
    </div>
);

const GuidanceRiskMaps = () => {
    const [viewMode, setViewMode] = useState('summary'); // summary | input | school
    const [riskType, setRiskType] = useState('student'); // student | teacher
    const [toast, setToast] = useState(null);

    // Dinamik Risk Maddeleri
    const [studentRisks, setStudentRisks] = useState([
        'Anne-Baba Ayrı', 'Maddi Yetersizlik', 'Sürekli Devamsızlık', 'Özel Eğitim İhtiyacı', 'Şiddet Eğilimi'
    ]);
    const [teacherRisks, setTeacherRisks] = useState([
        'Mobbing Algısı', 'Tükenmişlik', 'İletişim Sorunu', 'Sınıf Yönetimi Zorluğu'
    ]);
    const [newItem, setNewItem] = useState('');

    const handleAddItem = () => {
        if (!newItem) return;
        if (riskType === 'student') setStudentRisks([...studentRisks, newItem]);
        else setTeacherRisks([...teacherRisks, newItem]);
        setNewItem('');
        // Basit toast simülasyonu
        alert('Yeni risk maddesi eklendi: ' + newItem);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-red-50 to-white">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                        <AlertCircle className="text-red-600 mr-2" />
                        Risk Haritaları Yönetimi
                    </h2>
                    <p className="text-gray-500 mt-1">Sınıf ve Okul risk haritalarını tek merkezden yönetin.</p>
                </div>
                <div className="flex space-x-2 mt-4 md:mt-0">
                    <button onClick={() => setViewMode('input')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${viewMode === 'input' ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Veri Girişi</button>
                    <button onClick={() => setViewMode('school')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${viewMode === 'school' ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Okul Risk Haritası</button>
                </div>
            </div>

            {viewMode === 'summary' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4">Sınıf Bazlı Durum (Veri Tamamlanma)</h3>
                        <div className="space-y-3">
                            {['9-A', '9-B', '10-A', '10-B', '11-A', '12-A'].map(cls => (
                                <div key={cls} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="font-bold text-gray-700">{cls}</span>
                                    <span className={`text-xs px-2 py-1 rounded font-bold ${Math.random() > 0.5 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {Math.random() > 0.5 ? 'Tamamlandı' : 'Bekleniyor'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4">Öğretmen Veri Girişi Durumu</h3>
                        <div className="flex items-center justify-center h-40">
                            <div className="text-center">
                                <div className="text-4xl font-bold text-indigo-600">%75</div>
                                <div className="text-sm text-gray-500">Tamamlanma Oranı</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'school' && (
                <div className="bg-white border border-gray-200 rounded-2xl p-8 min-h-[400px]">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Birleştirilmiş Okul Risk Raporu</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-bold text-red-600 mb-4 border-b pb-2">Öğrenci Risk Dağılımı (En Yüksek)</h4>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1 font-medium"><span>Parçalanmış Aile</span><span>%24</span></div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5"><div className="bg-red-500 h-2.5 rounded-full" style={{ width: '24%' }}></div></div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1 font-medium"><span>Maddi Yetersizlik</span><span>%18</span></div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5"><div className="bg-orange-500 h-2.5 rounded-full" style={{ width: '18%' }}></div></div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1 font-medium"><span>Akademik Başarısızlık</span><span>%32</span></div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5"><div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: '32%' }}></div></div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-blue-600 mb-4 border-b pb-2">Öğretmen Risk Algısı</h4>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1 font-medium"><span>Tükenmişlik Hissi</span><span>%12</span></div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5"><div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '12%' }}></div></div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1 font-medium"><span>Veli İletişim Sorunları</span><span>%45</span></div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5"><div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: '45%' }}></div></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-gray-50 rounded-xl text-center text-sm text-gray-500">
                        * Bu rapor tüm sınıf ve öğretmen verilerinin birleştirilmesiyle otomatik oluşturulmuştur.
                    </div>
                </div>
            )}

            {viewMode === 'input' && (
                <div className="bg-white border border-gray-200 rounded-2xl p-8 animate-fade-in">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800">Risk Haritası Veri Girişi</h3>
                        <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-bold">
                            <button onClick={() => setRiskType('student')} className={`px-4 py-2 rounded-md transition ${riskType === 'student' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>Öğrenci</button>
                            <button onClick={() => setRiskType('teacher')} className={`px-4 py-2 rounded-md transition ${riskType === 'teacher' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>Öğretmen</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                {riskType === 'student' ? 'Sınıf Seçiniz' : 'Branş Seçiniz'}
                            </label>
                            <select className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg">
                                {riskType === 'student' ? <><option>9-A</option><option>10-A</option></> : <><option>Matematik</option><option>Fizik</option></>}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                {riskType === 'student' ? 'Öğrenci Seçiniz' : 'Öğretmen Adı'}
                            </label>
                            <select className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg">
                                {riskType === 'student' ? <><option>Ahmet Yılmaz</option><option>Ayşe Demir</option></> : <><option>Mehmet Hoca</option><option>Zeynep Hoca</option></>}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-semibold text-gray-700">Değerlendirme Maddeleri</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(riskType === 'student' ? studentRisks : teacherRisks).map((item, idx) => (
                                <label key={idx} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                                    <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                                    <span className="text-gray-700 font-medium">{item}</span>
                                </label>
                            ))}
                        </div>

                        {/* Yeni Madde Ekleme */}
                        <div className="mt-4 flex items-center space-x-2 pt-4 border-t border-gray-100">
                            <input
                                type="text"
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                placeholder="Listede olmayan bir risk maddesi ekle..."
                                className="flex-1 p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                            />
                            <button onClick={handleAddItem} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-200 transition">
                                + Ekle
                            </button>
                        </div>
                    </div>

                    <button className="mt-8 w-full md:w-auto px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition">
                        Kaydet ve Tamamla
                    </button>
                </div>
            )}
        </div>
    );
};

const GuidanceArchives = ({ openFolders, toggleFolder }) => {
    // Helper to render specific action buttons based on code
    const renderActionButtons = (folderCode, fileCode) => {
        // Özel Kodlar (BEP, Görüşme Formları vb.)
        if (fileCode === '140.03') { // BEP
            return <button className="mt-2 text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 font-bold">BEP Oluştur / Düzenle</button>;
        }
        if (folderCode === '250') { // Bireysel Çalışmalar - Görüşme Formları
            return <button className="mt-2 text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 font-bold">Görüşme Formu Görüntüle</button>;
        }
        return null;
    };

    return (
        <div className="animate-fade-in space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm sticky top-0 z-10">
                <h3 className="font-bold text-lg text-gray-700 flex items-center">
                    <Folder className="mr-2 text-yellow-500" size={24} />
                    Desimal Dosya Sistemi (Standart)
                </h3>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input type="text" placeholder="Dosya veya kod ara..." className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64" />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {guidanceDecimalSystem.map((folder) => (
                    <div key={folder.code} className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md">
                        <div
                            onClick={() => toggleFolder(folder.code)}
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
                        >
                            <div className="flex items-center space-x-4">
                                <span className="font-mono text-sm font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">{folder.code}</span>
                                <h3 className="font-semibold text-gray-800">{folder.title}</h3>
                            </div>
                            <div className="text-gray-400">
                                {openFolders[folder.code] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                            </div>
                        </div>

                        {/* Sub Items Accordion */}
                        {openFolders[folder.code] && (
                            <div className="bg-gray-50 border-t border-gray-100 p-4 space-y-3 animate-fade-in">
                                {folder.subItems.map((item) => (
                                    <div key={item.code} className="flex flex-col items-start p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition group">
                                        <div className="flex w-full cursor-pointer">
                                            <div className="mt-1 min-w-[40px]">
                                                <FileText size={20} className="text-blue-400 group-hover:text-blue-600" />
                                            </div>
                                            <div className="flex-1 ml-2">
                                                <div className="flex items-center">
                                                    <span className="font-mono text-xs font-bold text-gray-500 mr-2">{item.code}</span>
                                                    <h4 className="font-medium text-gray-800 group-hover:text-blue-700 transition">{item.title}</h4>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">{item.content}</p>
                                            </div>
                                            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition self-start" title="İndir / Görüntüle">
                                                <Download size={18} />
                                            </button>
                                        </div>
                                        {/* Action Buttons */}
                                        <div className="ml-12">
                                            {renderActionButtons(folder.code, item.code)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};


const GuidanceServiceTab = ({ students }) => {
    const [activeSection, setActiveSection] = useState('overview'); // overview | counseling | risk | archive
    const [activeModal, setActiveModal] = useState(null);
    const [openFolders, setOpenFolders] = useState({});
    const [toast, setToast] = useState(null);
    const [plans, setPlans] = useState([]);

    const toggleFolder = (code) => {
        setOpenFolders(prev => ({
            ...prev,
            [code]: !prev[code]
        }));
    };

    const handleShareBEP = () => {
        const shareUrl = `${window.location.origin}/bep/generator`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            setToast('BEP Hazırlama Modülü linki kopyalandı!');
            setTimeout(() => setToast(null), 3000);
        });
    };

    const menuItems = [
        { id: 'overview', label: 'Genel Bakış', icon: LayoutDashboard },
        { id: 'counseling', label: 'Bireysel Görüşmeler', icon: Users },
        { id: 'tests', label: 'Testler & Envanterler', icon: ClipboardList },
        { id: 'forms', label: 'Formlar & Ölçekler', icon: FileText },
        { id: 'risk', label: 'Risk Haritaları', icon: AlertCircle },
        { id: 'plans', label: 'Yıllık Plan', icon: BarChart2 }, // New Menu Item
        { id: 'archive', label: 'Dosya Arşivi (DDS)', icon: Folder },
    ];

    return (
        <div className="bg-gray-50/50 rounded-2xl border border-gray-200 min-h-[600px] flex overflow-hidden relative">
            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[80] bg-gray-800 text-white px-6 py-3 rounded-full shadow-xl flex items-center animate-fade-in">
                    <CheckCircle size={18} className="mr-2 text-green-400" />
                    <span className="text-sm font-medium">{toast}</span>
                </div>
            )}

            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="font-bold text-gray-800 text-lg flex items-center">
                        <Monitor className="mr-2 text-indigo-600" size={24} />
                        Rehberlik<br />Servisi
                    </h2>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition text-sm font-medium ${activeSection === item.id
                                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <item.icon size={20} strokeWidth={2} />
                            <span>{item.label}</span>
                        </button>
                    ))}

                    <div className="pt-4 mt-4 border-t border-gray-100">
                        <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hızlı İşlemler</p>
                        <div className="flex space-x-2 px-4 mb-2">
                            <button onClick={() => setActiveModal('bep')} className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 transition border border-blue-100 font-bold">
                                <FileText size={16} />
                                <span>BEP</span>
                            </button>
                            <button onClick={handleShareBEP} className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition border border-gray-200" title="BEP Aracını Paylaş">
                                <Share2 size={16} />
                            </button>
                        </div>
                        <button onClick={() => setActiveSection('tests')} className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-green-50 hover:text-green-600 transition">
                            <ClipboardList size={18} />
                            <span>Anket Oluştur</span>
                        </button>

                        <button onClick={() => setActiveModal('plan')} className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition mt-1">
                            <Upload size={18} />
                            <span>Yıllık Plan Yükle</span>
                        </button>
                    </div>
                </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-gray-50/30 p-8 overflow-y-auto max-h-[800px]">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-800">
                            {menuItems.find(m => m.id === activeSection)?.label}
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                            {activeSection === 'overview' && 'Rehberlik servisi genel durum özeti ve anlık bildirimler.'}
                            {activeSection === 'counseling' && 'Öğrenci ve veli görüşme kayıtlarını buradan yönetebilirsiniz.'}
                            {activeSection === 'tests' && 'Öğrencilere yönelik psikolojik test ve envanterleri buradan uygulayabilirsiniz.'}
                            {activeSection === 'forms' && 'Bakanlık standartlarına uygun form ve ölçeklere buradan ulaşabilirsiniz.'}
                            {activeSection === 'risk' && 'Sınıf ve okul risk haritası verilerini girin ve analiz edin.'}
                            {activeSection === 'plans' && 'Okul Yıllık Rehberlik Planlarını buradan yönetin.'}
                            {activeSection === 'archive' && 'Bakanlık standartlarına uygun Desimal Dosya Sistemi.'}
                        </p>
                    </div>

                    {/* Dynamic Content */}
                    {activeSection === 'overview' && <GuidanceOverview />}
                    {activeSection === 'counseling' && <GuidanceCounseling />}
                    {activeSection === 'tests' && <GuidanceTests />}
                    {activeSection === 'forms' && <GuidanceForms />}
                    {activeSection === 'risk' && <GuidanceRiskMaps />}
                    {activeSection === 'archive' && <GuidanceArchives openFolders={openFolders} toggleFolder={toggleFolder} />}

                    {activeSection === 'plans' && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <div className="flex justify-between mb-6">
                                <h3 className="font-bold text-gray-800">Yüklü Planlar</h3>
                                <button onClick={() => setActiveModal('plan')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition flex items-center">
                                    <Upload size={16} className="mr-2" /> Yeni Plan Yükle
                                </button>
                            </div>
                            <div className="space-y-3">
                                {plans.map(p => (
                                    <div key={p.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-sm transition">
                                        <div className="flex items-center space-x-3">
                                            <div className={`${p.type === 'pdf' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} p-2 rounded-lg`}>
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800">{p.name}</h4>
                                                <p className="text-xs text-gray-500">Yüklenme Tarihi: {p.date}</p>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-lg transition"><Download size={18} /></button>
                                            <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-white rounded-lg transition"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {activeModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in z-[60]">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 text-lg">
                                {activeModal === 'bep' && 'Öğrenci BEP Hazırlama'}
                                {activeModal === 'plan' && 'Yıllık Rehberlik Planı Yükle'}
                            </h3>
                            <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                                <ChevronDown size={24} className="transform rotate-180" />
                            </button>
                        </div>
                        <div className="p-0">
                            {activeModal === 'bep' && <BEPGenerator students={students} closeModal={() => setActiveModal(null)} />}
                            {activeModal === 'plan' && (
                                <div className="text-center py-8 p-6">
                                    <input
                                        type="file"
                                        id="planUpload"
                                        className="hidden"
                                        accept=".xlsx, .xls, .pdf"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setPlans(prev => [...prev, {
                                                    id: Date.now(),
                                                    name: file.name,
                                                    date: new Date().toLocaleDateString('tr-TR'),
                                                    type: file.name.endsWith('.pdf') ? 'pdf' : 'excel'
                                                }]);
                                                setToast(`${file.name} başarıyla yüklendi!`);
                                                setTimeout(() => setActiveModal(null), 1000);
                                                setTimeout(() => setToast(null), 3000);
                                            }
                                        }}
                                    />
                                    <label
                                        htmlFor="planUpload"
                                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition bg-gray-50/50"
                                    >
                                        <Upload size={48} className="text-indigo-500 mb-4" />
                                        <p className="font-bold text-gray-800 text-lg">Excel veya PDF Dosyası Seçin</p>
                                        <p className="text-sm text-gray-500 mt-2 max-w-xs">
                                            MEB formatındaki yıllık planlarınızı (.xlsx, .pdf) buraya yükleyerek sisteme entegre edebilirsiniz.
                                        </p>
                                        <span className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition inline-block">
                                            Dosya Seç
                                        </span>
                                    </label>
                                    <div className="mt-4 text-left bg-blue-50 p-4 rounded-lg flex items-start">
                                        <AlertCircle size={16} className="text-blue-600 mt-0.5 mr-2 shrink-0" />
                                        <p className="text-xs text-blue-800">
                                            PDF dosyaları görüntüleme amaçlı, Excel dosyaları ise takvim entegrasyonu için kullanılır.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GuidanceServiceTab;
