import { FileText, Download, UserCheck, Users, ClipboardList, Briefcase, ChevronRight, PenTool, Save, X } from 'lucide-react';
import { pdrService } from '../services/pdrService';
import { useState } from 'react';

const formsData = [
    {
        category: "Öğrenci Tanıma & Bilgi Formları",
        icon: UserCheck,
        color: "text-info",
        items: [
            { id: 101, title: "Öğrenci Tanıma Fişi (Lise)", code: "FRM-01", type: "PDF" },
            { id: 102, title: "Yaşam Pencerem Formu", code: "FRM-02", type: "PDF" },
            { id: 103, title: "Bana Kendini Anlat", code: "FRM-03", type: "PDF" },
            { id: 104, title: "Otobiyografi Yazım Kılavuzu", code: "KLV-01", type: "PDF" },
        ]
    },
    {
        category: "Görüşme & Yönlendirme Formları",
        icon: Users,
        color: "text-ok",
        items: [
            { id: 201, title: "Öğrenci Görüşme Kayıt Formu", code: "FRM-10", type: "DOCX" },
            { id: 202, title: "Veli Görüşme Kayıt Formu", code: "FRM-11", type: "DOCX" },
            { id: 203, title: "Eğitsel Değerlendirme İsteği Formu (RAM)", code: "FRM-12", type: "DOCX" },
            { id: 204, title: "Ev Ziyareti Formu", code: "FRM-13", type: "PDF" },
        ]
    },
    {
        category: "Ölçekler ve Envanterler",
        icon: ClipboardList,
        color: "text-c4",
        items: [
            { id: 301, title: "Sınav Kaygısı Ölçeği", code: "ENV-01", type: "PDF" },
            { id: 302, title: "Akademik Benlik Saygısı Ölçeği", code: "ENV-02", type: "PDF" },
            { id: 303, title: "Çalışma Davranışlarını Değerlendirme Ölçeği", code: "ENV-03", type: "PDF" },
            { id: 304, title: "Başarısızlık Nedenleri Anketi", code: "ENV-04", type: "PDF" },
            { id: 305, title: "Problem Tarama Listesi (Lise)", code: "ENV-05", type: "PDF" },
        ]
    },
    {
        category: "Mesleki Rehberlik",
        icon: Briefcase,
        color: "text-warn",
        items: [
            { id: 401, title: "Mesleki Yönelim Envanteri", code: "MSL-01", type: "PDF" },
            { id: 402, title: "Kime Göre Ben Neyim?", code: "MSL-02", type: "PDF" },
            { id: 403, title: "Gelecek Zaman Formu", code: "MSL-03", type: "PDF" },
        ]
    }
];

const GuidanceForms = ({ students }) => {
    const [activeForm, setActiveForm] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [formData, setFormData] = useState({
        studentName: '',
        class: '',
        parentsStatus: 'Birlikte', // Birlikte, Ayri, Vefat
        economicStatus: 'Orta',
        healthIssues: '',
        hobbies: '',
        futureGoals: ''
    });

    const handleSaveForm = async (e) => {
        e.preventDefault();
        if (!selectedStudent && !formData.studentName) return alert('Lütfen öğrenci seçiniz veya ad giriniz.');

        const saveId = selectedStudent || Date.now().toString();
        // If selectedStudent is used, use that ID. If manual (e.g. demo mode), use timestamp.

        await pdrService.saveStudentForm(saveId, {
            ...formData,
            type: activeForm,
            date: new Date().toISOString()
        });

        alert('Form başarıyla kaydedildi!');
        setActiveForm(null);
        setFormData({ studentName: '', class: '', parentsStatus: 'Birlikte', economicStatus: 'Orta', healthIssues: '', hobbies: '', futureGoals: '' });
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="bg-indigo-900 text-ink p-8 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
                    <FileText size={200} />
                </div>
                <div className="relative z-10 flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Rehberlik Formları ve Ölçekler</h2>
                        <p className="text-brand max-w-xl text-lg">
                            Bakanlık standartlarına (ORGM) uygun, güncel rehberlik formlarına, ölçeklere ve envanterlere buradan ulaşabilirsiniz.
                        </p>
                    </div>
                    <div>
                        <button
                            onClick={() => setActiveForm('student_recognition')}
                            className="bg-surface text-brand px-6 py-3 rounded-xl font-bold hover:bg-brand-soft transition shadow-lg flex items-center"
                        >
                            <PenTool className="mr-2" size={20} />
                            Dijital Form Doldur
                        </button>
                    </div>
                </div>
            </div>

            {/* Form Modal */}
            {activeForm === 'student_recognition' && (
                <div className="fixed inset-0 z-modal-top bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-line flex justify-between items-center bg-surface-2">
                            <h3 className="font-bold text-lg text-ink flex items-center">
                                <UserCheck className="mr-2 text-info" />
                                Öğrenci Tanıma Fişi (Dijital)
                            </h3>
                            <button onClick={() => setActiveForm(null)} className="p-2 hover:bg-surface-3 rounded-full transition"><X size={20} className="text-ink-2" /></button>
                        </div>

                        <div className="p-8 overflow-y-auto">
                            <form id="student-form" onSubmit={handleSaveForm} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-ink-2 mb-1">Öğrenci Seçimi</label>
                                        <select
                                            value={selectedStudent}
                                            onChange={(e) => {
                                                setSelectedStudent(e.target.value);
                                                const s = students?.find(st => st.id.toString() === e.target.value);
                                                if (s) setFormData(prev => ({ ...prev, studentName: s.name, class: s.grade }));
                                            }}
                                            className="w-full p-3 border border-line rounded-xl focus:ring-2 focus:ring-brand outline-none bg-surface-2"
                                        >
                                            <option value="">Listeden Seçiniz...</option>
                                            {students?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-ink-2 mb-1">Manuel Giriş (İsim)</label>
                                        <input
                                            type="text"
                                            value={formData.studentName}
                                            onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                                            disabled={!!selectedStudent}
                                            className="w-full p-3 border border-line rounded-xl outline-none focus:ring-2 focus:ring-brand disabled:opacity-50 disabled:bg-surface-3"
                                            placeholder="Öğrenci Adı Soyadı"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-ink-2 mb-1">Sınıf</label>
                                        <input
                                            type="text"
                                            value={formData.class}
                                            onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                                            className="w-full p-3 border border-line rounded-xl outline-none"
                                            placeholder="9/A"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-ink-2 mb-1">Aile Durumu</label>
                                        <select
                                            value={formData.parentsStatus}
                                            onChange={(e) => setFormData({ ...formData, parentsStatus: e.target.value })}
                                            className="w-full p-3 border border-line rounded-xl outline-none bg-surface"
                                        >
                                            <option value="Birlikte">Anne-Baba Birlikte</option>
                                            <option value="Ayri">Anne-Baba Ayrı</option>
                                            <option value="Vefat">Anne/Baba Vefat</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-ink-2 mb-1">Ekonomik Durum</label>
                                        <select
                                            value={formData.economicStatus}
                                            onChange={(e) => setFormData({ ...formData, economicStatus: e.target.value })}
                                            className="w-full p-3 border border-line rounded-xl outline-none bg-surface"
                                        >
                                            <option value="Iyi">İyi</option>
                                            <option value="Orta">Orta</option>
                                            <option value="Dusuk">Düşük</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-ink-2 mb-1">Sağlık Sorunu / Sürekli Hastalık</label>
                                    <textarea
                                        value={formData.healthIssues}
                                        onChange={(e) => setFormData({ ...formData, healthIssues: e.target.value })}
                                        className="w-full p-3 border border-line rounded-xl outline-none h-20 resize-none"
                                        placeholder="Varsa belirtiniz..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-ink-2 mb-1">İlgi Alanları ve Hobiler</label>
                                    <textarea
                                        value={formData.hobbies}
                                        onChange={(e) => setFormData({ ...formData, hobbies: e.target.value })}
                                        className="w-full p-3 border border-line rounded-xl outline-none h-20 resize-none"
                                        placeholder="Spor, sanat, müzik vb."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-ink-2 mb-1">Gelecek Hedefleri</label>
                                    <textarea
                                        value={formData.futureGoals}
                                        onChange={(e) => setFormData({ ...formData, futureGoals: e.target.value })}
                                        className="w-full p-3 border border-line rounded-xl outline-none h-20 resize-none"
                                        placeholder="Üniversite, meslek hayali..."
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-line bg-surface-2 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setActiveForm(null)}
                                className="mr-4 px-6 py-3 rounded-xl font-bold text-ink-2 hover:bg-surface-3 transition"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                form="student-form"
                                className="px-8 py-3 bg-brand text-white rounded-xl font-bold hover:bg-brand-hover transition shadow-lg flex items-center"
                            >
                                <Save className="mr-2" size={20} />
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {formsData.map((section) => (
                    <div key={section.category} className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden hover:shadow-md transition">
                        <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-surface-2/50">
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg bg-surface shadow-sm ${section.color}`}>
                                    <section.icon size={24} />
                                </div>
                                <h3 className="font-bold text-ink text-lg">{section.category}</h3>
                            </div>
                            <span className="bg-surface-3 text-ink-2 text-xs px-2 py-1 rounded-full font-bold">{section.items.length} Form</span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {section.items.map((item) => (
                                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-brand-soft/30 transition group cursor-pointer">
                                    <div className="flex items-center">
                                        <div className="mr-4 text-ink-3 group-hover:text-brand font-mono text-xs font-bold bg-surface-3 px-2 py-1 rounded">
                                            {item.code}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-ink-2 group-hover:text-brand">{item.title}</h4>
                                            <p className="text-xs text-ink-3 mt-0.5">{item.type} Dosyası • Güncel Sürüm</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => alert(`Dosya indiriliyor: ${item.title}.${item.type.toLowerCase()}`)}
                                        className="p-2 text-ink-3 hover:text-brand hover:bg-surface rounded-lg transition border border-transparent hover:border-line shadow-sm opacity-0 group-hover:opacity-100"
                                        title="İndir"
                                    >
                                        <Download size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 bg-surface-2 text-center">
                            <button className="text-xs font-bold text-brand flex items-center justify-center hover:underline w-full">
                                Tümünü İndir (.zip) <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GuidanceForms;
