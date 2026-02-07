
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, Download, Share2, AlertCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Copy-paste constants to avoid import issues if file structure changes,
// but ideally we should import. Given the constraints, importing is better.
// import { SUBJECT_COLORS } from '../data/curriculum';

const SharedProgramViewer = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [schedule, setSchedule] = useState({});
    const [meta, setMeta] = useState({ title: 'Paylaşılan Program', student: 'Öğrenci', dailySlots: 6 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Decoding Logic
    useEffect(() => {
        const data = searchParams.get('d');
        if (!data) {
            setError("Program verisi bulunamadı.");
            setLoading(false);
            return;
        }

        try {
            // Base64 Decode -> JSON Parse
            const decoded = atob(data);
            const parsed = JSON.parse(decoded);

            if (parsed.schedule) {
                setSchedule(parsed.schedule);
                setMeta({
                    title: parsed.title || 'Çalışma Programı',
                    student: parsed.studentName || 'Öğrenci',
                    duration: parsed.duration || 1,
                    dailySlots: parsed.dailySlots || 6
                });
            } else {
                throw new Error("Geçersiz veri formatı");
            }
        } catch (err) {
            console.error(err);
            setError("Program yüklenirken bir hata oluştu. Link bozuk veya eksik olabilir.");
        } finally {
            setLoading(false);
        }
    }, [searchParams]);

    // PDF Download - Reused Logic
    const handleDownloadPDF = async () => {
        const doc = new jsPDF('l', 'mm', 'a4');
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = doc.internal.pageSize.getHeight();

        const input = document.getElementById('printable-area');
        if (input) {
            const canvas = await html2canvas(input, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/png');
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;
            let finalHeight = imgHeight;
            let finalWidth = pdfWidth;

            if (finalHeight > pdfHeight) {
                finalHeight = pdfHeight;
                finalWidth = (canvas.width * pdfHeight) / canvas.height;
            }
            const xPos = (pdfWidth - finalWidth) / 2;

            doc.addImage(imgData, 'PNG', xPos, 0, finalWidth, finalHeight);
            doc.save(`${meta.student}_Program.pdf`);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-screen bg-gray-50">Yükleniyor...</div>;

    if (error) return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4 text-center">
            <AlertCircle size={48} className="text-red-500 mb-4" />
            <h1 className="text-xl font-bold text-gray-800">Hata</h1>
            <p className="text-gray-600 mt-2">{error}</p>
            <button onClick={() => navigate('/')} className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg">Ana Sayfaya Dön</button>
        </div>
    );

    const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

    // Simplification for Viewer: Just show the first populated week or all weeks stacked
    // For MVP efficiency, let's show Month 1, Week 1 (Active View)
    // To support multi-week, we would need a tab switcher similar to the builder
    // We'll reimplement simple tabs locally

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-indigo-900 text-white p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center">
                            <Calendar className="mr-3" />
                            {meta.title}
                        </h1>
                        <p className="text-indigo-200 mt-1">{meta.student} için hazırlanan çalışma planı</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleDownloadPDF}
                            className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold transition shadow-lg"
                        >
                            <Download size={18} className="mr-2" />
                            PDF İndir
                        </button>
                    </div>
                </div>

                {/* Viewer Content */}
                <div className="p-6 overflow-x-auto">
                    <div id="printable-area" className="min-w-[800px] p-4 bg-white">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-widest">{meta.title}</h2>
                        </div>

                        <div className="grid grid-cols-8 gap-0 border-2 border-gray-800">
                            {/* Header Row */}
                            <div className="bg-gray-800 text-white font-bold p-3 text-center flex items-center justify-center text-sm tracking-wider">ETÜT</div>
                            {DAYS.map(day => (
                                <div key={day} className="bg-gray-100 text-gray-800 font-black p-3 text-center border-l border-b border-gray-300 uppercase text-xs tracking-wide">
                                    {day}
                                </div>
                            ))}

                            {/* Slot Rows */}
                            {Array.from({ length: meta.dailySlots }).map((_, slotIndex) => (
                                <React.Fragment key={slotIndex}>
                                    <div className="bg-gray-50 font-bold text-gray-500 text-xs p-2 text-center border-b border-r border-gray-200 flex items-center justify-center">
                                        {slotIndex + 1}. Etüt
                                    </div>
                                    {DAYS.map(day => {
                                        // View Logic: Default to Month 1, Week 1 for the static view or we can add tabs if needed
                                        // For now, hardcoded m1-w1 to ensure render
                                        const cellData = schedule[`m1-w1-${day}-${slotIndex}`];
                                        return (
                                            <div key={`${day}-${slotIndex}`} className={`min-h-[60px] border-b border-r border-gray-200 p-1 relative ${cellData ? cellData.color : ''}`}>
                                                {cellData && (
                                                    <div className="h-full w-full rounded p-1 flex flex-col justify-center items-center text-center leading-tight">
                                                        <span className="text-[10px] font-bold opacity-70 uppercase tracking-tighter mb-1">{cellData.subject}</span>
                                                        <span className="text-xs font-black">{cellData.topic}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-between text-xs text-gray-400 font-mono uppercase">
                            <span>AI ÖĞRENCİ KOÇU SİSTEMİ</span>
                            <span>İBRAHİM KARATAŞ EĞİTİM DANIŞMANLIĞI</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SharedProgramViewer;
