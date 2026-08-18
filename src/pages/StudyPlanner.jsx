import React, { useState, useRef } from 'react';
import { Calendar, Check, ChevronRight, BrainCircuit, RefreshCw, Save, Info, X, Map as ImageIcon, FileText, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { EXAM_TOPICS, EXAM_INFO, SUBJECT_COLORS, EXAM_COLORS, generateStudyPlan, getTopicName } from '../data/curriculum';
import { checkPermission } from '../utils/permissions';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/ui/Modal';
import { yaz } from '../services/veriDeposu';

const StudyPlanner = () => {
    const navigate = useNavigate();

    const printRef = useRef();
    const [step, setStep] = useState(1);
    const [examType, setExamType] = useState(null);
    const [gradeLevel, setGradeLevel] = useState('grade11'); // Simplified key
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState(null);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [customRules, setCustomRules] = useState({ // Yeni state
        firstSlotRule: null,
        lastSlotRule: null,
        generalPattern: null
    });
    const [closedSlots, setClosedSlots] = useState({}); // Kapalı etütler: { 'Pazartesi': [0, 2], 'Salı': [1] }

    // Verileri LocalStorage'dan yükle
    React.useEffect(() => {
        const savedPlan = localStorage.getItem('student_study_plan');
        const savedExam = localStorage.getItem('student_exam_type');
        const savedClosedSlots = localStorage.getItem('student_closed_slots');

        if (savedExam) setExamType(savedExam);
        if (savedClosedSlots) setClosedSlots(JSON.parse(savedClosedSlots));
        if (savedPlan) {
            setGeneratedPlan(JSON.parse(savedPlan));
            setStep(3); // Direkt plana git
        }
    }, []);

    /**
     * Yetki kontrolü TÜM hook çağrılarından sonra yapılır.
     * Daha önce bileşenin en başındaydı ve erken `return` ediyordu;
     * koç bu özelliği açıp kapattığında render arasında hook sayısı
     * değişiyor, React "Rendered fewer hooks than expected" hatasıyla
     * sayfayı çökertiyordu.
     */
    if (!checkPermission('canUseStudyPlanner')) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
                <div className="bg-surface rounded-2xl shadow-2xl p-12 max-w-md text-center">
                    <div className="w-20 h-20 bg-danger-soft rounded-full flex items-center justify-center mx-auto mb-6">
                        <X size={40} className="text-danger" />
                    </div>
                    <h1 className="text-2xl font-bold text-ink mb-4">Erişim Engellendi</h1>
                    <p className="text-ink-2 mb-6">
                        Koçunuz bu özelliği şu an için kapatmış. Daha fazla bilgi için koçunuzla iletişime geçin.
                    </p>
                    <button
                        onClick={() => navigate('/student/dashboard')}
                        className="px-6 py-3 bg-brand text-white rounded-lg font-bold hover:bg-brand-hover transition"
                    >
                        Ana Sayfaya Dön
                    </button>
                </div>
            </div>
        );
    }


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
            const plan = generateStudyPlan(examType, selectedTopics, customRules, closedSlots); // closedSlots eklendi
            setGeneratedPlan(plan);

            // Kaydet
            // Öğrencinin çalışma planı: veriDeposu yerel + bulut yazıyor.
            // Anahtarlar SYNC_KEYS'e alındı ama yazma noktası tetikleyicisizdi;
            // plan ancak 2 dakikalık toplu turda gidiyordu.
            yaz('student_study_plan', plan);
            yaz('student_exam_type', examType);
            yaz('student_closed_slots', closedSlots);

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

    const handleDownloadPDF = () => {
        if (!printRef.current) return;

        const element = printRef.current;
        const opt = {
            margin: [5, 5],
            filename: `AI-Akilli-Ders-Plani-${examType}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 3, 
                useCORS: true,
                width: 1120,
                windowWidth: 1120
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        html2pdf().from(element).set(opt).save();
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
                <h1 className="text-3xl font-bold text-ink flex items-center">
                    <BrainCircuit className="mr-3 text-brand" size={32} />
                    AI Çalışma Programı Oluşturucu
                </h1>
                <p className="text-ink-2 mt-2">
                    Yapay zeka, hedeflerinize ve eksiklerinize göre size en uygun haftalık programı hazırlar.
                </p>
            </header>

            {/* Steps Indicator */}
            <div className="flex items-center mb-10">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 1 ? 'bg-brand text-ink' : 'bg-surface-3 text-ink-2'}`}>1</div>
                <div className={`h-1 w-20 ${step >= 2 ? 'bg-brand' : 'bg-surface-3'}`}></div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 2 ? 'bg-brand text-ink' : 'bg-surface-3 text-ink-2'}`}>2</div>
                <div className={`h-1 w-20 ${step >= 3 ? 'bg-brand' : 'bg-surface-3'}`}></div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 3 ? 'bg-brand text-ink' : 'bg-surface-3 text-ink-2'}`}>3</div>
            </div>

            {step === 1 && (
                <div className="animate-fade-in">
                    <h2 className="text-xl font-bold text-ink mb-6">Hangi sınava hazırlanıyorsun?</h2>

                    {/* Özel İstek Bölümü - En Üstte */}
                    <div className="glass-card p-6 mb-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-[color-mix(in_srgb,var(--c4)_35%,transparent)]">
                        <h3 className="font-bold text-c4 mb-4 flex items-center text-lg">
                            <Sparkles className="mr-2" size={22} /> Özel İstek Bölümü (Programın Tamamı İçin)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-ink-2 mb-2">
                                    📚 İlk Etüt Ne Olsun?
                                </label>
                                <select
                                    value={customRules.firstSlotRule || ''}
                                    onChange={(e) => setCustomRules({ ...customRules, firstSlotRule: e.target.value || null })}
                                    className="w-full px-4 py-2 rounded-xl border border-[color-mix(in_srgb,var(--c4)_35%,transparent)] focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-surface text-sm"
                                >
                                    <option value="">Otomatik Belirlensin</option>
                                    <option value="Tekrar">Ders Tekrarı</option>
                                    <option value="Konu Çalışması">Konu Anlatımı</option>
                                    <option value="Soru Çözümü">Soru Çözümü</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-ink-2 mb-2">
                                    🎯 Son Etüt Ne Olsun?
                                </label>
                                <select
                                    value={customRules.lastSlotRule || ''}
                                    onChange={(e) => setCustomRules({ ...customRules, lastSlotRule: e.target.value || null })}
                                    className="w-full px-4 py-2 rounded-xl border border-[color-mix(in_srgb,var(--c4)_35%,transparent)] focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-surface text-sm"
                                >
                                    <option value="">Otomatik Belirlensin</option>
                                    <option value="Soru Çözümü">Soru Çözümü</option>
                                    <option value="Konu Çalışması">Konu Pekiştirme</option>
                                    <option value="Tekrar">Tekrar</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-ink-2 mb-2">
                                    🔄 Genel Etüt Düzeni
                                </label>
                                <select
                                    value={customRules.generalPattern || ''}
                                    onChange={(e) => setCustomRules({ ...customRules, generalPattern: e.target.value || null })}
                                    className="w-full px-4 py-2 rounded-xl border border-[color-mix(in_srgb,var(--c4)_35%,transparent)] focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-surface text-sm"
                                >
                                    <option value="">Otomatik Belirlensin</option>
                                    <option value="first-review-last-questions">İlk etüt tekrar, son etüt soru</option>
                                    <option value="alternate">Sırayla değişken (konu-soru-konu-soru)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ETÜT KAPAMA/AÇMA BÖLÜMÜ */}
                    <div className="glass-card p-6 mb-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-info">
                        <h3 className="font-bold text-info mb-4 flex items-center text-lg">
                            <Calendar className="mr-2" size={22} /> Etüt Saatlerini Seç (İstediğin Etütleri Kapat)
                        </h3>
                        <p className="text-sm text-ink-2 mb-4">
                            Kapalı etütlere ders <strong>atanmaz</strong>. Açık etütlere program otomatik dağıtılır.
                        </p>
                        {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map(day => {
                            const daySlots = closedSlots[day] || [];
                            return (
                                <div key={day} className="mb-3 bg-surface p-3 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-ink-2 text-sm">{day}</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    // Tüm etütleri aç
                                                    const newSlots = { ...closedSlots };
                                                    newSlots[day] = [];
                                                    setClosedSlots(newSlots);
                                                }}
                                                className="text-xs px-2 py-1 bg-ok-soft text-ok rounded-lg hover:bg-green-200"
                                            >
                                                Tümünü Aç
                                            </button>
                                            <button
                                                onClick={() => {
                                                    // Tüm etütleri kapat
                                                    const newSlots = { ...closedSlots };
                                                    newSlots[day] = [0, 1, 2, 3, 4, 5];
                                                    setClosedSlots(newSlots);
                                                }}
                                                className="text-xs px-2 py-1 bg-danger-soft text-danger rounded-lg hover:bg-red-200"
                                            >
                                                Tümünü Kapat
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-6 gap-2">
                                        {['08:00', '10:00', '13:00', '15:00', '17:00', '19:00'].map((time, idx) => {
                                            const isClosed = daySlots.includes(idx);
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        const newSlots = { ...closedSlots };
                                                        if (!newSlots[day]) newSlots[day] = [];

                                                        if (isClosed) {
                                                            // Aç
                                                            newSlots[day] = newSlots[day].filter(i => i !== idx);
                                                        } else {
                                                            // Kapat
                                                            newSlots[day].push(idx);
                                                        }
                                                        setClosedSlots(newSlots);
                                                    }}
                                                    className={`text-xs px-2 py-2 rounded-lg font-medium transition ${isClosed
                                                        ? 'bg-danger-soft text-danger border-2 border-danger'
                                                        : 'bg-ok-soft text-ok border-2 border-ok'
                                                        }`}
                                                >
                                                    {time}
                                                    <div className="text-[10px] mt-1">
                                                        {isClosed ? '🔒 Kapalı' : '✅ Açık'}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <button
                            onClick={() => { setExamType('LGS'); setStep(2); }}
                            className="p-6 border-2 border-line rounded-3xl hover:border-brand hover:bg-brand-soft transition text-left group"
                        >
                            <span className="text-3xl mb-4 block">🎒</span>
                            <h3 className="text-xl font-bold text-ink group-hover:text-brand">LGS</h3>
                            <p className="text-ink-2 mt-2 text-sm">Liselere geçiş sınavı.</p>
                        </button>

                        <button
                            onClick={() => { setExamType('TYT'); setStep(2); }}
                            className="p-6 border-2 border-line rounded-3xl hover:border-brand hover:bg-brand-soft transition text-left group"
                        >
                            <span className="text-3xl mb-4 block">📚</span>
                            <h3 className="text-xl font-bold text-ink group-hover:text-brand">TYT</h3>
                            <p className="text-ink-2 mt-2 text-sm">Temel Yeterlilik Testi.</p>
                        </button>

                        <button
                            onClick={() => { setExamType('AYT'); setStep(2); }}
                            className="p-6 border-2 border-line rounded-3xl hover:border-brand hover:bg-brand-soft transition text-left group"
                        >
                            <span className="text-3xl mb-4 block">🧠</span>
                            <h3 className="text-xl font-bold text-ink group-hover:text-brand">AYT</h3>
                            <p className="text-ink-2 mt-2 text-sm">Alan Yeterlilik Testi.</p>
                        </button>

                        <button
                            onClick={() => { setExamType('YDT'); setStep(2); }}
                            className="p-6 border-2 border-line rounded-3xl hover:border-brand hover:bg-brand-soft transition text-left group"
                        >
                            <span className="text-3xl mb-4 block">🌍</span>
                            <h3 className="text-xl font-bold text-ink group-hover:text-brand">YDT</h3>
                            <p className="text-ink-2 mt-2 text-sm">Yabancı Dil Testi.</p>
                        </button>

                        <button
                            onClick={() => { setExamType('KPSS'); setStep(2); }}
                            className="p-6 border-2 border-line rounded-3xl hover:border-brand hover:bg-brand-soft transition text-left group"
                        >
                            <span className="text-3xl mb-4 block">🏛️</span>
                            <h3 className="text-xl font-bold text-ink group-hover:text-brand">KPSS</h3>
                            <p className="text-ink-2 mt-2 text-sm">Kamu Personeli Seçme Sınavı.</p>
                        </button>

                        <button
                            onClick={() => { setExamType('AGS'); setStep(2); }}
                            className="p-6 border-2 border-brand-line bg-brand-soft/30 rounded-3xl hover:border-brand hover:bg-brand-soft transition text-left group ring-offset-2 hover:ring-2 hover:ring-indigo-200"
                        >
                            <span className="text-3xl mb-4 block">🎓</span>
                            <h3 className="text-xl font-bold text-ink group-hover:text-brand">AGS</h3>
                            <p className="text-ink-2 mt-2 text-sm">Akademi Giriş Sınavı (Güncel).</p>
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && !isGenerating && (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-3">
                            <h2 className="text-xl font-bold text-ink">Eksik Olduğun Konuları İşaretle</h2>
                            <button
                                onClick={() => setShowInfoModal(true)}
                                className="text-brand hover:bg-brand-soft p-2 rounded-full transition"
                                title="Sınav Rehberi ve Güncellemeler"
                            >
                                <Info size={20} />
                            </button>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={selectedTopics.length === 0}
                            className="on-color px-6 py-3 bg-gradient-to-r from-brand to-purple-600 text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
                        >
                            <BrainCircuit className="mr-2" size={20} />
                            AI Programı Oluştur
                        </button>
                    </div>

                    {/* Sınıf Seçimi Tabları (Sadece AYT ve YDT için) */}
                    {(examType === 'AYT' || examType === 'YDT') && (
                        <div className="mb-6">
                            <div className="flex space-x-2 border-b-2 border-line">
                                <button
                                    onClick={() => { setGradeLevel('grade11'); setSelectedTopics([]); }}
                                    className={`px-6 py-3 font-bold text-sm rounded-t-xl transition-all ${gradeLevel === 'grade11'
                                        ? 'bg-brand text-white shadow-md'
                                        : 'bg-surface-3 text-ink-2 hover:bg-surface-3'
                                        }`}
                                >
                                    📘 11. Sınıf Konuları
                                </button>
                                <button
                                    onClick={() => { setGradeLevel('grade12'); setSelectedTopics([]); }}
                                    className={`px-6 py-3 font-bold text-sm rounded-t-xl transition-all ${gradeLevel === 'grade12'
                                        ? 'bg-brand text-white shadow-md'
                                        : 'bg-surface-3 text-ink-2 hover:bg-surface-3'
                                        }`}
                                >
                                    📗 12. Sınıf Konuları
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-8">
                        {(() => {
                            // AYT ve YDT için grade bazlı erişim, diğerleri doğrudan
                            const topicsSource = (examType === 'AYT' || examType === 'YDT')
                                ? EXAM_TOPICS[examType]?.[gradeLevel]
                                : EXAM_TOPICS[examType];

                            if (!topicsSource) {
                                return <div className="text-center text-ink-2 py-8">Konular yükleniyor...</div>;
                            }

                            return Object.entries(topicsSource).map(([lesson, topics]) => (
                                <div key={lesson} className="glass-card p-6">
                                    <h3 className="text-lg font-bold text-brand mb-4 border-b border-brand-line pb-2">{lesson}</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {Array.isArray(topics) && topics.map(topic => {
                                            const isSelected = selectedTopics.find(t => t.lesson === lesson && t.topic === topic);
                                            return (
                                                <button
                                                    key={getTopicName(topic)}
                                                    onClick={() => handleTopicToggle(lesson, getTopicName(topic))}
                                                    className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${isSelected
                                                        ? 'bg-brand border-indigo-600 text-white shadow-md transform scale-[1.02]'
                                                        : 'bg-surface border-line text-ink-2 hover:border-brand-line hover:bg-brand-soft'
                                                        }`}
                                                >
                                                    {isSelected && <Check size={14} className="inline mr-1" />}
                                                    {getTopicName(topic)}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            )}

            {isGenerating && (
                <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                    <div className="w-24 h-24 border-4 border-brand-line border-t-indigo-600 rounded-full animate-spin mb-8"></div>
                    <h2 className="text-2xl font-bold text-ink mb-2">Yapay Zeka Programını Hazırlıyor...</h2>
                    <p className="text-ink-2">Geçmiş verilerin, eksik konuların ve sınav hedefin analiz ediliyor.</p>
                </div>
            )}

            {step === 3 && generatedPlan && (
                <div className="animate-fade-in space-y-8">
                    <div className="on-color glass-card p-8 bg-gradient-to-r from-brand to-purple-700 text-white flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-bold mb-2">Programın Hazır! 🚀</h2>
                            <p className="opacity-90">Senin için en verimli çalışma saatlerini ve eksik konularını dengeledik.</p>
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={() => {
                                setStep(1);
                                setGeneratedPlan(null);
                                localStorage.removeItem('student_study_plan');
                            }} className="px-3 py-2 bg-surface/20 hover:bg-surface/30 rounded-lg text-xs font-medium backdrop-blur-sm transition flex items-center">
                                <RefreshCw size={14} className="mr-1" /> Yenile / Yeni Plan
                            </button>
                            <button onClick={handleDownloadImage} className="px-3 py-2 bg-surface text-brand rounded-lg text-xs font-bold shadow-lg hover:bg-surface-3 transition flex items-center">
                                <ImageIcon size={14} className="mr-1" /> Resim (PNG)
                            </button>
                            <button onClick={handleDownloadPDF} className="px-3 py-2 bg-danger text-white rounded-lg text-xs font-bold shadow-lg hover:bg-danger transition flex items-center">
                                <FileText size={14} className="mr-1" /> PDF (İndir)
                            </button>
                            <button onClick={handleDownloadWord} className="px-3 py-2 bg-info text-white border border-blue-400 rounded-lg text-xs font-bold shadow-lg hover:bg-info transition flex items-center">
                                <FileText size={14} className="mr-1" /> Word (DOCX)
                            </button>
                        </div>
                    </div>

                    <div ref={printRef} className="grid grid-cols-1 md:grid-cols-7 gap-4 bg-surface p-4 rounded-xl">
                        {Object.entries(generatedPlan).map(([day, slots]) => (
                            <div key={day} className="flex flex-col space-y-3">
                                <div className="bg-surface-inv text-white text-center py-2 rounded-lg font-bold text-sm">
                                    {day}
                                </div>
                                {slots.map((slot, idx) => {
                                    const subjectColorBase = SUBJECT_COLORS[slot.lesson] || 
                                                           (slot.type === 'Tekrar' ? 'bg-warn-soft border-warn text-warn' :
                                                            slot.type === 'Soru Çözümü' ? 'bg-ok-soft border-ok text-ok' :
                                                            slot.type === 'Konu Çalışması' ? 'bg-brand-soft border-brand-line text-brand' :
                                                            'bg-surface border-line text-ink-2');
                                    
                                    return (
                                        <div key={idx} className={`p-4 rounded-2xl border-2 shadow-sm min-h-[90px] flex flex-col transition-all hover:shadow-xl hover:scale-[1.02] ${subjectColorBase}`}>
                                            <div className="flex justify-between items-start">
                                                <span className="font-mono opacity-60 text-[10px]">{slot.time}</span>
                                                <div className="flex flex-col items-end gap-1">
                                                    {slot.exam && (
                                                        <span className="bg-brand text-white text-[8px] px-1.5 py-0.5 rounded font-black tracking-tighter">
                                                            {slot.exam}
                                                        </span>
                                                    )}
                                                    {slot.type === 'Soru Çözümü' && <span className="bg-green-200 text-ok text-[9px] px-1.5 py-0.5 rounded-full font-bold">SORU</span>}
                                                    {slot.type === 'Konu Çalışması' && <span className="bg-indigo-200 text-brand text-[9px] px-1.5 py-0.5 rounded-full font-bold">KONU</span>}
                                                </div>
                                            </div>

                                            <div className="mt-2 flex-grow">
                                                <strong className="block text-sm font-bold whitespace-normal leading-tight break-words" title={slot.lesson || ''}>{slot.lesson || ''}</strong>
                                                <p className="text-[10px] leading-tight mt-1 opacity-90 break-words" title={slot.topic || ''}>{slot.topic || ''}</p>
                                            </div>

                                            <div className="mt-auto pt-2 border-t border-black/5 flex justify-between items-center opacity-40">
                                                 <span className="text-[8px] font-bold uppercase tracking-widest">{slot.type}</span>
                                                 {slot.duration && <span className="text-[8px] font-bold">{slot.duration} dk</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Sınav Bilgi Modalı */}
            {showInfoModal && examType && (
                <Modal
                    acik
                    onClose={() => setShowInfoModal(false)}
                    baslikGizle
                    genislik="lg"
                    govdeClassName="p-0 flex flex-col overflow-hidden"
                >
                    <div className="shrink-0 p-6 border-b border-line flex justify-between items-center">
                        <h3 className="text-xl font-bold text-brand flex items-center">
                            <Info className="mr-2" />
                            {EXAM_INFO[examType].title}
                        </h3>
                        <button onClick={() => setShowInfoModal(false)} className="p-2 hover:bg-surface-3 rounded-full transition">
                            <X size={24} className="text-ink-2" />
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
                        <div className="bg-brand-soft p-4 rounded-xl border border-brand-line">
                            <p className="text-brand font-medium">{EXAM_INFO[examType].desc}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-surface-2 p-4 rounded-xl">
                                <span className="text-xs font-bold text-ink-2 uppercase tracking-wider">Sınav Süresi</span>
                                <p className="text-2xl font-bold text-ink mt-1">{EXAM_INFO[examType].duration}</p>
                            </div>
                            <div className="bg-surface-2 p-4 rounded-xl">
                                <span className="text-xs font-bold text-ink-2 uppercase tracking-wider">Soru Sayısı</span>
                                <p className="text-2xl font-bold text-ink mt-1">{EXAM_INFO[examType].questionCount} Soru</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-ink mb-2">Soru Dağılımı</h4>
                            <p className="text-ink-2 bg-surface border border-line p-3 rounded-lg text-sm">
                                {EXAM_INFO[examType].distribution}
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold text-ink mb-3 flex items-center">
                                <span className="w-2 h-2 bg-danger rounded-full mr-2"></span>
                                Son Değişiklikler ve Güncellemeler
                            </h4>
                            <ul className="space-y-3">
                                {EXAM_INFO[examType].updates.map((update, idx) => (
                                    <li key={idx} className="flex items-start text-sm text-ink-2 bg-danger-soft p-3 rounded-lg border border-red-50">
                                        <span className="font-bold text-danger mr-2 min-w-[40px]">{update.year}:</span>
                                        {update.text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="p-6 bg-surface-2 border-t border-line text-center">
                        <button onClick={() => setShowInfoModal(false)} className="text-brand font-bold hover:underline">
                            Kapat
                        </button>
                    </div>
                </Modal>
            )
            }
        </div >
    );
};

export default StudyPlanner;
