import React from 'react';
import { FileText, Download, UserCheck, Users, ClipboardList, Briefcase, ChevronRight } from 'lucide-react';

const formsData = [
    {
        category: "Öğrenci Tanıma & Bilgi Formları",
        icon: UserCheck,
        color: "text-blue-600",
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
        color: "text-green-600",
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
        color: "text-purple-600",
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
        color: "text-orange-600",
        items: [
            { id: 401, title: "Mesleki Yönelim Envanteri", code: "MSL-01", type: "PDF" },
            { id: 402, title: "Kime Göre Ben Neyim?", code: "MSL-02", type: "PDF" },
            { id: 403, title: "Gelecek Zaman Formu", code: "MSL-03", type: "PDF" },
        ]
    }
];

const GuidanceForms = () => {
    return (
        <div className="animate-fade-in space-y-6">
            <div className="bg-indigo-900 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10">
                    <FileText size={200} />
                </div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2">Rehberlik Formları ve Ölçekler</h2>
                    <p className="text-indigo-200 max-w-xl text-lg">
                        Bakanlık standartlarına (ORGM) uygun, güncel rehberlik formlarına, ölçeklere ve envanterlere buradan ulaşabilirsiniz.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {formsData.map((section) => (
                    <div key={section.category} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition">
                        <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg bg-white shadow-sm ${section.color}`}>
                                    <section.icon size={24} />
                                </div>
                                <h3 className="font-bold text-gray-800 text-lg">{section.category}</h3>
                            </div>
                            <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full font-bold">{section.items.length} Form</span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {section.items.map((item) => (
                                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-indigo-50/30 transition group cursor-pointer">
                                    <div className="flex items-center">
                                        <div className="mr-4 text-gray-400 group-hover:text-indigo-500 font-mono text-xs font-bold bg-gray-100 px-2 py-1 rounded">
                                            {item.code}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-700 group-hover:text-indigo-700">{item.title}</h4>
                                            <p className="text-xs text-gray-400 mt-0.5">{item.type} Dosyası • Güncel Sürüm</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => alert(`Dosya indiriliyor: ${item.title}.${item.type.toLowerCase()}`)}
                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition border border-transparent hover:border-gray-100 shadow-sm opacity-0 group-hover:opacity-100"
                                        title="İndir"
                                    >
                                        <Download size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 bg-gray-50 text-center">
                            <button className="text-xs font-bold text-indigo-600 flex items-center justify-center hover:underline w-full">
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
