import React, { useState, useRef } from 'react';
import { Calendar, Check, ChevronRight, BrainCircuit, RefreshCw, Save, Info, X, Map as ImageIcon, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { EXAM_TOPICS, EXAM_INFO, generateStudyPlan } from '../data/curriculum';

const StudyPlanner = () => {
    const printRef = useRef();
    const [step, setStep] = useState(1);
    const [examType, setExamType] = useState(null);
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState(null);
    const [showInfoModal, setShowInfoModal] = useState(false);

    // Verileri LocalStorage'dan yükle
    React.useEffect(() => {
        const savedPlan = localStorage.getItem('student_study_plan');
        const savedExam = localStorage.getItem('student_exam_type');

        if (savedExam) setExamType(savedExam);
        if (savedPlan) {
            setGeneratedPlan(JSON.parse(savedPlan));
            setStep(3); // Direkt plana git
        }
    }, []);

    const handleTopicToggle = (lesson, topic) => {
        const exists = selectedTopics.find(t => t.lesson === lesson && t.topic === topic);
        if (exists) {
            setSelectedTopics(selectedTopics.filter(t => t !== exists));
        } else {
            setSelectedTopics([...selectedTopics, { lesson, topic }]);
        }
    };

    const handleGenerate = () => {
        setIsGenerating(true);
        // Simüle edilmiş gecikme
        setTimeout(() => {
            const plan = generateStudyPlan(examType, selectedTopics);
            setGeneratedPlan(plan);

            // Kaydet
            localStorage.setItem('student_study_plan', JSON.stringify(plan));
            localStorage.setItem('student_exam_type', examType);

            setIsGenerating(false);
            setStep(3);
        }, 2500);
    };

    const handleDownloadImage = async () => {
        if (!printRef.current) return;

        // Yükleniyor durumu eklenebilir
        const canvas = await html2canvas(printRef.current, {
            scale: 2,
            useCORS: true,
            onclone: (clonedDoc) => {
                // Klonlanan elementte kısıtlayıcı sınıfları kaldır ki yazılar tam çıksın
                const elements = clonedDoc.getElementsByClassName('truncate');
                Array.from(elements).forEach(el => el.classList.remove('truncate'));

                const clamped = clonedDoc.getElementsByClassName('line-clamp-2');
                Array.from(clamped).forEach(el => el.classList.remove('line-clamp-2'));

                // Kartların boyunu içeriğe göre uzat
                const cards = clonedDoc.getElementsByClassName('min-h-[110px]');
                Array.from(cards).forEach(el => {
                    el.classList.remove('min-h-[110px]');
                    el.style.height = 'auto';
                });
            }
        });

        canvas.toBlob((blob) => {
            saveAs(blob, `AI-Ders-Programi-${examType}.png`);
        });
    };

    const handleDownloadWord = () => {
        if (!generatedPlan) return;

        const days = Object.keys(generatedPlan);

        // 1. Satır: Gün Başlıkları (Renkli Header)
        const headerCells = days.map(day =>
            new TableCell({
                children: [
                    new Paragraph({
                        text: day,
                        bold: true,
                        alignment: AlignmentType.CENTER,
                        color: "FFFFFF"
                    })
                ],
                shading: { fill: "374151" }, // Gray-700
                width: { size: 100 / 7, type: WidthType.PERCENTAGE },
                verticalAlign: "center",
                margins: { top: 100, bottom: 100 }
            })
        );

        // 2. Satır: Ders Programı İçeriği (Her gün bir sütun)
        const contentCells = days.map(day => {
            const slots = generatedPlan[day];

            // O günün derslerini oluştur
            const slotParagraphs = slots.map(slot => {
                let color = "000000";
                let shading = "FFFFFF";
                let prefix = "";

                // Renk tanımları (Web sitesiyle uyumlu)
                if (slot.type === 'Soru Çözümü') {
                    color = "065F46"; // Green-800
                    shading = "D1FAE5"; // Green-50
                    prefix = "SORU";
                } else if (slot.type === 'Konu Çalışması') {
                    color = "3730A3"; // Indigo-800
                    shading = "E0E7FF"; // Indigo-50
                    prefix = "KONU";
                } else if (slot.type === 'Tekrar') {
                    color = "9A3412"; // Orange-800
                    shading = "FFEDD5"; // Orange-50
                    prefix = "TEKRAR";
                }

                return [
                    new Paragraph({
                        children: [
                            new TextRun({ text: slot.time, size: 14, color: "6B7280" }), // Saat
                            new TextRun({ text: "\t" }),
                            new TextRun({ text: prefix, size: 12, bold: true, color: color }),
                        ],
                        tabStops: [{ type: "right", position: 1400 }],
                        spacing: { before: 120, after: 0 },
                        shading: { fill: shading },
                        border: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" }
                        }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: slot.lesson, bold: true, color: "111827", size: 18 }),
                        ],
                        spacing: { after: 0 },
                        shading: { fill: shading },
                        border: {
                            left: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" }
                        }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: slot.topic, size: 14, color: "4B5563" })
                        ],
                        spacing: { after: 120 },
                        shading: { fill: shading },
                        border: {
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" }
                        }
                    }),
                    new Paragraph({ text: "", spacing: { after: 60 } }) // Kartlar arası boşluk
                ];
            }).flat();

            return new TableCell({
                children: slotParagraphs,
                width: { size: 100 / 7, type: WidthType.PERCENTAGE },
                margins: { top: 50, bottom: 50, left: 50, right: 50 },
                verticalAlign: "top"
            });
        });

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        size: { orientation: "landscape" }, // YATAY SAYFA
                        margin: { top: 500, right: 500, bottom: 500, left: 500 }
                    },
                },
                children: [
                    new Paragraph({
                        text: `${EXAM_INFO[examType].title} Haftalık Çalışma Programı`,
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 },
                        color: "4F46E5"
                    }),
                    new Table({
                        rows: [
                            new TableRow({ children: headerCells, tableHeader: true }),
                            new TableRow({ children: contentCells })
                        ],
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
                            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
                        }
                    }),
                ],
            }],
        });

        Packer.toBlob(doc).then((blob) => {
            saveAs(blob, `AI-Ders-Programi-${examType}.docx`);
        });
    };

    return (
        <div className="p-8 pb-20 max-w-6xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <BrainCircuit className="mr-3 text-indigo-600" size={32} />
                    AI Çalışma Programı Oluşturucu
                </h1>
                <p className="text-gray-500 mt-2">
                    Yapay zeka, hedeflerinize ve eksiklerinize göre size en uygun haftalık programı hazırlar.
                </p>
            </header>

            {/* Steps Indicator */}
            <div className="flex items-center mb-10">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
                <div className={`h-1 w-20 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                <div className={`h-1 w-20 ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>3</div>
            </div>

            {step === 1 && (
                <div className="animate-fade-in">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Hangi sınava hazırlanıyorsun?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <button
                            onClick={() => { setExamType('LGS'); setStep(2); }}
                            className="p-6 border-2 border-gray-100 rounded-3xl hover:border-indigo-500 hover:bg-indigo-50 transition text-left group"
                        >
                            <span className="text-3xl mb-4 block">🎒</span>
                            <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-700">LGS</h3>
                            <p className="text-gray-500 mt-2 text-sm">Liselere geçiş sınavı.</p>
                        </button>

                        <button
                            onClick={() => { setExamType('TYT'); setStep(2); }}
                            className="p-6 border-2 border-gray-100 rounded-3xl hover:border-indigo-500 hover:bg-indigo-50 transition text-left group"
                        >
                            <span className="text-3xl mb-4 block">📚</span>
                            <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-700">TYT</h3>
                            <p className="text-gray-500 mt-2 text-sm">Temel Yeterlilik Testi.</p>
                        </button>

                        <button
                            onClick={() => { setExamType('AYT'); setStep(2); }}
                            className="p-6 border-2 border-gray-100 rounded-3xl hover:border-indigo-500 hover:bg-indigo-50 transition text-left group"
                        >
                            <span className="text-3xl mb-4 block">🧠</span>
                            <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-700">AYT</h3>
                            <p className="text-gray-500 mt-2 text-sm">Alan Yeterlilik Testi.</p>
                        </button>

                        <button
                            onClick={() => { setExamType('YDT'); setStep(2); }}
                            className="p-6 border-2 border-gray-100 rounded-3xl hover:border-indigo-500 hover:bg-indigo-50 transition text-left group"
                        >
                            <span className="text-3xl mb-4 block">🌍</span>
                            <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-700">YDT</h3>
                            <p className="text-gray-500 mt-2 text-sm">Yabancı Dil Testi.</p>
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && !isGenerating && (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-3">
                            <h2 className="text-xl font-bold text-gray-800">Eksik Olduğun Konuları İşaretle</h2>
                            <button
                                onClick={() => setShowInfoModal(true)}
                                className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full transition"
                                title="Sınav Rehberi ve Güncellemeler"
                            >
                                <Info size={20} />
                            </button>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={selectedTopics.length === 0}
                            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
                        >
                            <BrainCircuit className="mr-2" size={20} />
                            AI Programı Oluştur
                        </button>
                    </div>

                    <div className="space-y-8">
                        {Object.entries(EXAM_TOPICS[examType]).map(([lesson, topics]) => (
                            <div key={lesson} className="glass-card p-6">
                                <h3 className="text-lg font-bold text-indigo-700 mb-4 border-b border-indigo-100 pb-2">{lesson}</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {topics.map(topic => {
                                        const isSelected = selectedTopics.find(t => t.lesson === lesson && t.topic === topic);
                                        return (
                                            <button
                                                key={topic}
                                                onClick={() => handleTopicToggle(lesson, topic)}
                                                className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${isSelected
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md transform scale-[1.02]'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                                                    }`}
                                            >
                                                {isSelected && <Check size={14} className="inline mr-1" />}
                                                {topic}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isGenerating && (
                <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                    <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-8"></div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Yapay Zeka Programını Hazırlıyor...</h2>
                    <p className="text-gray-500">Geçmiş verilerin, eksik konuların ve sınav hedefin analiz ediliyor.</p>
                </div>
            )}

            {step === 3 && generatedPlan && (
                <div className="animate-fade-in space-y-8">
                    <div className="glass-card p-8 bg-gradient-to-r from-indigo-600 to-purple-700 text-white flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-bold mb-2">Programın Hazır! 🚀</h2>
                            <p className="opacity-90">Senin için en verimli çalışma saatlerini ve eksik konularını dengeledik.</p>
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={() => {
                                setStep(1);
                                setGeneratedPlan(null);
                                localStorage.removeItem('student_study_plan');
                            }} className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium backdrop-blur-sm transition flex items-center">
                                <RefreshCw size={14} className="mr-1" /> Yenile / Yeni Plan
                            </button>
                            <button onClick={handleDownloadImage} className="px-3 py-2 bg-white text-indigo-600 rounded-lg text-xs font-bold shadow-lg hover:bg-gray-100 transition flex items-center">
                                <ImageIcon size={14} className="mr-1" /> Resim (PNG)
                            </button>
                            <button onClick={handleDownloadWord} className="px-3 py-2 bg-blue-600 text-white border border-blue-400 rounded-lg text-xs font-bold shadow-lg hover:bg-blue-700 transition flex items-center">
                                <FileText size={14} className="mr-1" /> Word (DOCX)
                            </button>
                        </div>
                    </div>

                    <div ref={printRef} className="grid grid-cols-1 md:grid-cols-7 gap-4 bg-white p-4 rounded-xl">
                        {Object.entries(generatedPlan).map(([day, slots]) => (
                            <div key={day} className="flex flex-col space-y-3">
                                <div className="bg-gray-800 text-white text-center py-2 rounded-lg font-bold text-sm">
                                    {day}
                                </div>
                                {slots.map((slot, idx) => (
                                    <div key={idx} className={`p-3 rounded-xl border text-xs min-h-[110px] flex flex-col justify-between transition hover:shadow-md ${slot.type === 'Tekrar' ? 'bg-orange-50 border-orange-100 text-orange-800' :
                                        slot.type === 'Soru Çözümü' ? 'bg-green-50 border-green-100 text-green-800' :
                                            slot.type === 'Konu Çalışması' ? 'bg-indigo-50 border-indigo-100 text-indigo-800' :
                                                'bg-white border-gray-100 text-gray-600'
                                        }`}>
                                        <div className="flex justify-between items-start">
                                            <span className="font-mono opacity-60 text-[10px]">{slot.time}</span>
                                            {slot.type === 'Soru Çözümü' && <span className="bg-green-200 text-green-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold">SORU</span>}
                                            {slot.type === 'Konu Çalışması' && <span className="bg-indigo-200 text-indigo-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold">KONU</span>}
                                        </div>

                                        <div className="mt-2">
                                            <strong className="block text-sm font-bold truncate" title={slot.lesson}>{slot.lesson}</strong>
                                            <p className="text-[10px] leading-tight mt-1 opacity-90 line-clamp-2" title={slot.topic}>{slot.topic}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Sınav Bilgi Modalı */}
            {showInfoModal && examType && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-fade-in">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="text-xl font-bold text-indigo-800 flex items-center">
                                <Info className="mr-2" />
                                {EXAM_INFO[examType].title}
                            </h3>
                            <button onClick={() => setShowInfoModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                                <X size={24} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                <p className="text-indigo-800 font-medium">{EXAM_INFO[examType].desc}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sınav Süresi</span>
                                    <p className="text-2xl font-bold text-gray-800 mt-1">{EXAM_INFO[examType].duration}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Soru Sayısı</span>
                                    <p className="text-2xl font-bold text-gray-800 mt-1">{EXAM_INFO[examType].questionCount} Soru</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-gray-800 mb-2">Soru Dağılımı</h4>
                                <p className="text-gray-600 bg-white border border-gray-200 p-3 rounded-lg text-sm">
                                    {EXAM_INFO[examType].distribution}
                                </p>
                            </div>

                            <div>
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                    Son Değişiklikler ve Güncellemeler
                                </h4>
                                <ul className="space-y-3">
                                    {EXAM_INFO[examType].updates.map((update, idx) => (
                                        <li key={idx} className="flex items-start text-sm text-gray-600 bg-red-50 p-3 rounded-lg border border-red-50">
                                            <span className="font-bold text-red-600 mr-2 min-w-[40px]">{update.year}:</span>
                                            {update.text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
                            <button onClick={() => setShowInfoModal(false)} className="text-indigo-600 font-bold hover:underline">
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default StudyPlanner;
