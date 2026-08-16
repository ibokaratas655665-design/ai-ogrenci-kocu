import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, ChevronLeft, ChevronRight, Download, ArrowLeft } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { savePDF } from '../utils/pdfSave';
import ProgramCell from '../components/program/ProgramCell';

const StudentProgramViewer = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [schedule, setSchedule] = useState({});
    const [config, setConfig] = useState({});
    const [activeMonth, setActiveMonth] = useState(1);
    const [activeWeek, setActiveWeek] = useState(1);
    const [dailySlotCount, setDailySlotCount] = useState(6);
    const [programDurationMonths, setProgramDurationMonths] = useState(1);

    const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

    useEffect(() => {
        if (!user || !user.id) {
            navigate('/student/dashboard');
            return;
        }

        // Programı yükle
        const gridKey = `program_${user.id}_monthly_grid`;
        const configKey = `program_${user.id}_config`;

        const grid = JSON.parse(localStorage.getItem(gridKey) || '{}');
        const cfg = JSON.parse(localStorage.getItem(configKey) || '{}');

        if (Object.keys(grid).length === 0) {
            alert('Henüz atanmış bir programınız yok!');
            navigate('/student/dashboard');
            return;
        }

        setSchedule(grid);
        setConfig(cfg);

        // Config'den ayarları çek
        const scheduleData = JSON.parse(localStorage.getItem(`program_schedule_${user.id}`) || '{}');

        // Maksimum ay ve slot sayısını hesapla
        let maxMonth = 1;
        let maxSlot = 6;
        Object.keys(grid).forEach(key => {
            const match = key.match(/m(\d+)-w\d+-\w+-(\d+)/);
            if (match) {
                maxMonth = Math.max(maxMonth, parseInt(match[1]));
                maxSlot = Math.max(maxSlot, parseInt(match[2]) + 1);
            }
        });

        setProgramDurationMonths(maxMonth);
        setDailySlotCount(maxSlot);
    }, [user, navigate]);

    const handleDownloadPDF = async () => {
        const doc = new jsPDF('l', 'mm', 'a4');
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = doc.internal.pageSize.getHeight();

        const captureGrid = async (element) => {
            return await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
        };

        let pageCount = 0;
        const originalMonth = activeMonth;
        const originalWeek = activeWeek;

        for (let m = 1; m <= programDurationMonths; m++) {
            for (let w = 1; w <= 4; w++) {
                const hasData = DAYS.some(d => Array.from({ length: dailySlotCount }).some((_, i) => schedule[`m${m}-w${w}-${d}-${i}`]));

                if (hasData) {
                    setActiveMonth(m);
                    setActiveWeek(w);
                    await new Promise(r => setTimeout(r, 100));

                    const input = document.getElementById('printable-schedule');
                    if (input) {
                        const canvas = await captureGrid(input);
                        const imgData = canvas.toDataURL('image/png');
                        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
                        let finalHeight = imgHeight;
                        let finalWidth = pdfWidth;

                        if (finalHeight > pdfHeight) {
                            finalHeight = pdfHeight;
                            finalWidth = (canvas.width * pdfHeight) / canvas.height;
                        }
                        const xPos = (pdfWidth - finalWidth) / 2;

                        if (pageCount > 0) doc.addPage();
                        doc.addImage(imgData, 'PNG', xPos, 0, finalWidth, finalHeight);
                        doc.text(`${config.title || 'Çalışma Programı'} - ${m}. Ay ${w}. Hafta`, 10, 10);
                        pageCount++;
                    }
                }
            }
        }

        setActiveMonth(originalMonth);
        setActiveWeek(originalWeek);

        if (pageCount === 0) {
            alert("İndirilecek program verisi bulunamadı.");
            return;
        }

        savePDF(doc, `${user.name}_Calisma_Programi`);
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-surface rounded-2xl shadow-xl p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/student/dashboard')}
                                className="p-2 hover:bg-surface-3 rounded-full transition"
                            >
                                <ArrowLeft size={24} className="text-ink-2" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-ink flex items-center">
                                    <Calendar className="mr-3 text-brand" size={32} />
                                    {config.title || 'Çalışma Programım'}
                                </h1>
                                <p className="text-sm text-ink-2 mt-1">
                                    Koçun tarafından hazırlanan kişisel çalışma programın
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleDownloadPDF}
                            className="px-6 py-3 bg-brand text-white rounded-xl font-bold hover:bg-brand-hover transition shadow-lg flex items-center"
                        >
                            <Download size={20} className="mr-2" />
                            PDF İndir
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <div className="bg-surface rounded-2xl shadow-xl p-4 mb-6">
                    <div className="flex items-center justify-center space-x-6">
                        <button
                            onClick={() => {
                                if (activeWeek > 1) setActiveWeek(activeWeek - 1);
                                else if (activeMonth > 1) {
                                    setActiveMonth(activeMonth - 1);
                                    setActiveWeek(4);
                                }
                            }}
                            disabled={activeMonth === 1 && activeWeek === 1}
                            className="p-3 bg-brand-soft rounded-full hover:bg-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                            <ChevronLeft size={24} className="text-brand" />
                        </button>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-ink">
                                {activeMonth}. Ay - {activeWeek}. Hafta
                            </div>
                            <div className="text-sm text-ink-2">
                                Toplam: {programDurationMonths} ay
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                if (activeWeek < 4) setActiveWeek(activeWeek + 1);
                                else if (activeMonth < programDurationMonths) {
                                    setActiveMonth(activeMonth + 1);
                                    setActiveWeek(1);
                                }
                            }}
                            disabled={activeMonth === programDurationMonths && activeWeek === 4}
                            className="p-3 bg-brand-soft rounded-full hover:bg-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                            <ChevronRight size={24} className="text-brand" />
                        </button>
                    </div>
                </div>

                {/* Program Grid */}
                <div id="printable-schedule" className="bg-surface rounded-2xl shadow-xl p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="border-2 border-line-2 bg-brand text-white p-3 font-bold">Gün</th>
                                    {Array.from({ length: dailySlotCount }).map((_, i) => (
                                        <th key={i} className="border-2 border-line-2 bg-brand text-white p-3 font-bold">
                                            Etüt {i + 1}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {DAYS.map(day => (
                                    <tr key={day}>
                                        <td className="border-2 border-line-2 bg-brand-soft font-bold text-brand p-3 text-center">
                                            {day}
                                        </td>
                                        {Array.from({ length: dailySlotCount }).map((_, slotIndex) => {
                                            const cellKey = `m${activeMonth}-w${activeWeek}-${day}-${slotIndex}`;
                                            const cellData = schedule[cellKey];

                                            return (
                                                <td key={slotIndex} className="p-1 align-top">
                                                    <ProgramCell cell={cellData} size="md" />
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentProgramViewer;
