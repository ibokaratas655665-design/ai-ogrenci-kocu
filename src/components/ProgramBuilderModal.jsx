import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
    Calendar, Clock, Settings, Download, Save, CheckCircle, X,
    Layers, Minus, Plus, Shuffle, Book, Trash2, Share2,
    CheckSquare, Square, PlusCircle, Globe
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { CURRICULUM, SUBJECT_COLORS, EXAM_TYPES } from '../data/curriculum';

// Helper to estimate duration per topic (Mock Logic)
const getEstimatedDuration = (topic) => {
    if (topic.includes('Türev') || topic.includes('İntegral') || topic.includes('Limit')) return 4;
    if (topic.includes('Optik') || topic.includes('Elektrik')) return 3;
    if (topic.includes('Problem')) return 3;
    return 2;
};

const ProgramBuilderModal = ({ studentId, studentName, onClose }) => {
    // --- State Management ---
    const [title, setTitle] = useState(`${studentName || 'Öğrenci'} - YKS Çalışma Programı`);
    const [programDurationMonths, setProgramDurationMonths] = useState(1); // 1-12 Months
    const [dailySlotCount, setDailySlotCount] = useState(6); // 1-10 Slots/Day

    const [activeMonth, setActiveMonth] = useState(1);
    const [activeWeek, setActiveWeek] = useState(1);

    // Selection State
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [availableTopics, setAvailableTopics] = useState([]);
    const [selectedTopics, setSelectedTopics] = useState([]);

    // Tools
    const [activeTool, setActiveTool] = useState(null); // { subject, topic, color } OR 'eraser'

    // Data Stores
    const [distributionQueue, setDistributionQueue] = useState([]); // Array of topics waiting to be placed
    const [schedule, setSchedule] = useState({}); // Key: "mX-wY-Day-Slot", Value: { subject, topic, color }

    // Constants
    const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

    // Load Initial Data (if any saved)
    useEffect(() => {
        const savedSchedule = localStorage.getItem(`program_schedule_${studentId}`);
        if (savedSchedule) {
            try {
                setSchedule(JSON.parse(savedSchedule));
            } catch (error) {
                console.error("Error loading schedule:", error);
            }
        }
    }, [studentId]);

    // Curriculum Logic
    useEffect(() => {
        // Defensive check: Ensure CURRICULUM exists
        if (!CURRICULUM) {
            console.error("CURRICULUM data is missing!");
            setAvailableTopics([]);
            return;
        }

        if (selectedExam && selectedSubject && CURRICULUM[selectedExam] && CURRICULUM[selectedExam][selectedSubject]) {
            setAvailableTopics(CURRICULUM[selectedExam][selectedSubject]);
            setSelectedTopics([]); // Clear selection on subject change
        } else {
            setAvailableTopics([]);
            setSelectedTopics([]);
        }
    }, [selectedExam, selectedSubject]);

    // --- Action Handlers ---

    const handleSave = () => {
        localStorage.setItem(`program_schedule_${studentId}`, JSON.stringify(schedule));
        alert('Program başarıyla kaydedildi!');
        // Optional: Call specific API or Update Parent
    };

    const handleCellClick = (day, slotIndex) => {
        const cellKey = `m${activeMonth}-w${activeWeek}-${day}-${slotIndex}`;

        if (activeTool === 'eraser') {
            const newSchedule = { ...schedule };
            delete newSchedule[cellKey];
            setSchedule(newSchedule);
            return;
        }

        if (activeTool && activeTool.topic) {
            setSchedule({
                ...schedule,
                [cellKey]: {
                    subject: activeTool.subject,
                    topic: activeTool.topic,
                    color: activeTool.color
                }
            });
        }
    };

    const toggleTopicSelection = (topic) => {
        if (selectedTopics.includes(topic)) {
            setSelectedTopics(selectedTopics.filter(t => t !== topic));
        } else {
            setSelectedTopics([...selectedTopics, topic]);
        }
    };

    const handleSelectAll = () => {
        if (selectedTopics.length === availableTopics.length) {
            setSelectedTopics([]);
        } else {
            setSelectedTopics([...availableTopics]);
        }
    };

    const addSelectedToQueue = () => {
        const newItems = selectedTopics.map(topic => {
            const est = getEstimatedDuration(topic);
            return {
                subject: selectedSubject,
                topic: topic,
                color: SUBJECT_COLORS[selectedSubject],
                weight: est,
                duration: est
            };
        });
        setDistributionQueue([...distributionQueue, ...newItems]);
        setSelectedTopics([]);
    };

    const removeFromQueue = (index) => {
        const newQueue = [...distributionQueue];
        newQueue.splice(index, 1);
        setDistributionQueue(newQueue);
    };

    const updateQueueItemWeight = (index, delta) => {
        const newQueue = [...distributionQueue];
        newQueue[index].weight = Math.max(1, newQueue[index].weight + delta);
        setDistributionQueue(newQueue);
    };

    const handleAutoDistribute = () => {
        if (Object.keys(schedule).length > 0) {
            if (!window.confirm('Mevcut programın üzerine yazılacak. Devam edilsin mi?')) return;
        }

        const newSchedule = {};
        let queueWithAllocation = distributionQueue.map(item => ({ ...item, remainingAlloc: item.weight, type: item.subject === 'Matematik' || item.subject === 'Fizik' || item.subject === 'Kimya' ? 'numeric' : 'verbal' }));

        const totalDurationWeeks = programDurationMonths * 4;
        let totalAvailableSlots = totalDurationWeeks * 7 * dailySlotCount; // Simplified

        // Smart Distribution Logic (Simplified Round Robin with Subject Balancing)
        // Iterate through ALL slots in sequential order
        let lastSubjectType = 'verbal'; // Start opposite to force numeric first if desired

        // Simplified Loop: Iterate Months -> Weeks -> Days -> Slots
        const allSlots = [];
        for (let m = 1; m <= programDurationMonths; m++) {
            for (let w = 1; w <= 4; w++) {
                for (let d = 0; d < 7; d++) {
                    for (let s = 0; s < dailySlotCount; s++) {
                        allSlots.push({ key: `m${m}-w${w}-${DAYS[d]}-${s}` });
                    }
                }
            }
        }

        allSlots.forEach(slot => {
            // Find best candidate
            // Try to pick a subject type diverse from the last one (Numeric <-> Verbal/Other)
            const idealType = lastSubjectType === 'numeric' ? 'verbal' : 'numeric';

            // Filter candidates
            let candidateIndex = queueWithAllocation.findIndex(item => item.remainingAlloc > 0 && item.type === idealType);

            // If no ideal candidate, try ANY candidate
            if (candidateIndex === -1) {
                candidateIndex = queueWithAllocation.findIndex(item => item.remainingAlloc > 0);
            }

            if (candidateIndex !== -1) {
                const item = queueWithAllocation[candidateIndex];

                // Construct Label
                const totalForItem = item.allocated || item.weight; // Using weight as allocated duration
                // Fix: track original weight separate? 

                newSchedule[slot.key] = {
                    subject: item.subject,
                    topic: item.topic,
                    color: item.color
                };

                // Decrement
                item.remainingAlloc--;

                // Update tracking
                lastSubjectType = item.type;
            }
        });

        setSchedule(newSchedule);
        // setDistributionQueue([]); // Keep queue or clear? clearing for now
        alert(`Verimli Çalışma Planı Hazır! ${totalAvailableSlots} slot üzerinden dağıtım yapıldı.`);
    };



    const handleDownloadPDF = async () => {
        const doc = new jsPDF('l', 'mm', 'a4');
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = doc.internal.pageSize.getHeight();

        // Helper to capture a specific grid visual
        const captureGrid = async (element) => {
            return await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
        };

        // We need to capture ALL weeks. 
        // 1. We'll show a loading indicator
        // alert("Program indiriliyor, lütfen bekleyiniz..."); // Non-blocking alert preferred

        // 2. We'll iterate through all MONTHS and WEEKS where there is data
        let pageCount = 0;

        // Save current view
        const originalMonth = activeMonth;
        const originalWeek = activeWeek;

        for (let m = 1; m <= programDurationMonths; m++) {
            for (let w = 1; w <= 4; w++) {
                // Determine if this week has any data
                const hasData = DAYS.some(d => Array.from({ length: dailySlotCount }).some((_, i) => schedule[`m${m}-w${w}-${d}-${i}`]));

                if (hasData) {
                    // Temporarily switch view to this week to capture it
                    // Note: This causes a quick flash, but is the most reliable way without a separate "Print" component tree
                    setActiveMonth(m);
                    setActiveWeek(w);

                    // Allow React to render (tiny delay)
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
                        doc.text(`${studentName || 'Ogrenci'} - ${m}. Ay ${w}. Hafta`, 10, 10);
                        pageCount++;
                    }
                }
            }
        }

        // Restore view
        setActiveMonth(originalMonth);
        setActiveWeek(originalWeek);

        if (pageCount === 0) {
            alert("İndirilecek program verisi bulunamadı.");
            return;
        }

        doc.save(`${studentName || 'Ogrenci'}_Tum_Program.pdf`);
    };

    const handleToolSelect = (topic) => {
        setActiveTool({
            subject: selectedSubject,
            topic: topic,
            color: SUBJECT_COLORS[selectedSubject] || 'bg-gray-100 border-gray-300 text-gray-800'
        });
    };

    const handleAddEntireCurriculum = () => {
        if (!selectedExam || !CURRICULUM[selectedExam]) return;

        const allTopics = [];
        Object.keys(CURRICULUM[selectedExam]).forEach(subj => {
            const topics = CURRICULUM[selectedExam][subj];
            topics.forEach(t => {
                allTopics.push({
                    subject: subj,
                    topic: t,
                    color: SUBJECT_COLORS[subj],
                    weight: getEstimatedDuration(t),
                    duration: getEstimatedDuration(t)
                })
            })
        });

        if (window.confirm(`${allTopics.length} adet konu listeye eklenecek. Onaylıyor musunuz?`)) {
            setDistributionQueue([...distributionQueue, ...allTopics]);
        }
    };

    // Quick Add Subject Helper
    const handleAddSubjectTopics = () => {
        if (selectedSubject && availableTopics.length > 0) {
            const newItems = availableTopics.map(topic => ({
                subject: selectedSubject,
                topic: topic,
                color: SUBJECT_COLORS[selectedSubject],
                weight: getEstimatedDuration(topic),
                duration: getEstimatedDuration(topic)
            }));
            setDistributionQueue([...distributionQueue, ...newItems]);
        }
    };

    // Metrics for Queue
    const totalWeights = distributionQueue.reduce((acc, i) => acc + i.weight, 0);

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden">
            <div className="bg-white w-full h-full max-w-[95vw] max-h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* 1. Header & Toolbar */}
                <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white p-4 shrink-0 shadow-md">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-4">
                            <Calendar size={28} className="text-indigo-300" />
                            <div>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="bg-transparent text-xl font-bold focus:outline-none focus:border-b border-indigo-400 placeholder-indigo-300 w-96"
                                />
                                <div className="flex items-center mt-1 space-x-4 text-xs text-indigo-200">
                                    <span className="flex items-center bg-indigo-700/50 px-2 py-1 rounded border border-indigo-600">
                                        <Clock size={12} className="mr-1" />
                                        Süre (AY):
                                        <select
                                            value={programDurationMonths}
                                            onChange={(e) => setProgramDurationMonths(Number(e.target.value))}
                                            className="ml-2 bg-indigo-900 border border-indigo-500 rounded px-1 outline-none text-white font-bold"
                                        >
                                            {[...Array(12).keys()].map(i => <option key={i + 1} value={i + 1}>{i + 1} Ay</option>)}
                                        </select>
                                    </span>
                                    <span className="flex items-center bg-indigo-700/50 px-2 py-1 rounded border border-indigo-600">
                                        <Settings size={12} className="mr-1" />
                                        Günlük Etüt:
                                        <select
                                            value={dailySlotCount}
                                            onChange={(e) => setDailySlotCount(Number(e.target.value))}
                                            className="ml-2 bg-indigo-900 border border-indigo-500 rounded px-1 outline-none text-white font-bold"
                                        >
                                            {[...Array(11).keys()].slice(1).map(n => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button onClick={() => {
                                let url = window.location.href;
                                if (url.includes('localhost') || url.includes('127.0.0.1') || url.startsWith('file://')) {
                                    const newUrl = prompt(
                                        "Yerel moddasınız. Paylaşılacak Web Linkini giriniz (Örn: https://google.com):",
                                        "https://"
                                    );
                                    if (newUrl && newUrl !== "https://") url = newUrl;
                                    else { alert("Link girilmedi."); return; }
                                }
                                navigator.clipboard.writeText(url).then(() => {
                                    alert("Link kopyalandı! \n\n" + url);
                                });
                            }} className="px-3 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg text-sm font-bold transition flex items-center shadow-lg hover:shadow-blue-500/30">
                                <Share2 size={16} className="mr-2" /> Sistemi Paylaş
                            </button>
                            <button onClick={() => {
                                if (window.confirm('Tüm program silinecek. Emin misiniz?')) {
                                    setSchedule({});
                                    setDistributionQueue([]);
                                }
                            }} className="px-3 py-2 bg-red-500/20 hover:bg-red-500 text-white rounded-lg text-sm font-bold transition">
                                Temizle
                            </button>
                            <button onClick={handleDownloadPDF} className="px-3 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-sm font-bold transition flex items-center shadow-lg hover:shadow-indigo-500/30">
                                <Download size={16} className="mr-2" /> PDF İndir
                            </button>
                            <button onClick={handleSave} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold transition flex items-center shadow-lg hover:shadow-green-500/30">
                                <CheckCircle size={16} className="mr-2" /> Kaydet
                            </button>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* 2. Sidebar (Subject/Topic Selector) */}
                    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col shrink-0">
                        {/* Queue Section */}
                        <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex-1 overflow-hidden flex flex-col max-h-[40%]">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-indigo-800 text-sm flex items-center">
                                    <Layers size={16} className="mr-2" /> Dağıtım Listesi
                                </h3>
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                                    Ağırlık Puanı: {totalWeights}
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 mb-2">
                                {distributionQueue.length === 0 && <p className="text-xs text-indigo-400 italic text-center mt-4">Henüz ders eklenmedi.</p>}

                                {distributionQueue.map((item, idx) => (
                                    <div key={idx} className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm flex flex-col relative group">
                                        <button onClick={() => removeFromQueue(idx)} className="absolute top-1 right-1 text-gray-300 hover:text-red-500"><X size={12} /></button>
                                        <div className="flex items-center mb-1">
                                            <div className={`w-2 h-2 rounded-full mr-2 ${item.color?.split(' ')[0] || 'bg-gray-400'}`}></div>
                                            <span className="text-[10px] font-bold text-gray-700 truncate w-full pr-4">{item.topic}</span>
                                        </div>
                                        <div className="flex items-center justify-between bg-gray-50 rounded px-1">
                                            <span className="text-[9px] text-gray-500 font-medium z-10">Ağırlık:</span>
                                            <div className="flex items-center space-x-1 z-10">
                                                <button onClick={() => updateQueueItemWeight(idx, -1)} className="p-0.5 hover:bg-gray-200 rounded"><Minus size={10} /></button>
                                                <span className="text-[10px] font-bold text-indigo-600 w-4 text-center">{item.weight}</span>
                                                <button onClick={() => updateQueueItemWeight(idx, 1)} className="p-0.5 hover:bg-gray-200 rounded"><Plus size={10} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button onClick={handleAutoDistribute} disabled={distributionQueue.length === 0} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                                <Shuffle size={14} className="mr-1" /> {programDurationMonths * 4} Haftaya Verimli Dağıt
                            </button>
                        </div>

                        <div className="p-3 border-b border-gray-200 bg-white">
                            <div className="space-y-2">
                                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                                    {EXAM_TYPES.map(exam => (
                                        <button
                                            key={exam}
                                            onClick={() => { setSelectedExam(exam); setSelectedSubject(''); }}
                                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition ${selectedExam === exam ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            {exam}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-1">
                                    <select
                                        value={selectedSubject}
                                        onChange={(e) => setSelectedSubject(e.target.value)}
                                        className="flex-1 p-2 border border-gray-300 rounded-lg text-xs font-medium outline-none focus:border-indigo-500"
                                    >
                                        <option value="">Ders Seçiniz...</option>
                                        {selectedExam && CURRICULUM && CURRICULUM[selectedExam] && Object.keys(CURRICULUM[selectedExam]).map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                    {selectedSubject && (
                                        <button
                                            onClick={handleAddSubjectTopics}
                                            className="px-2 bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 hover:bg-indigo-200 transition"
                                            title={`Tüm ${selectedSubject} Konularını Ekle`}
                                        >
                                            <Book size={16} />
                                        </button>
                                    )}
                                </div>

                                {/* Global Add Button */}
                                <button onClick={handleAddEntireCurriculum} className="w-full py-2 border-2 border-indigo-100 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-50 transition flex items-center justify-center">
                                    <Globe size={14} className="mr-1" /> Tüm {selectedExam} Müfredatını Ekle
                                </button>
                            </div>
                        </div>

                        {/* Bulk Selection Actions */}
                        <div className="px-3 pt-2 pb-1 flex justify-between items-center bg-gray-50">
                            <div className="flex space-x-2">
                                <button onClick={handleSelectAll} className="text-[10px] text-indigo-600 font-bold hover:underline">
                                    {selectedTopics.length === availableTopics.length ? 'Seçimi Kaldır' : 'Dersi Seç'}
                                </button>
                            </div>
                            {selectedTopics.length > 0 && (
                                <button onClick={addSelectedToQueue} className="px-2 py-1 bg-green-600 text-white rounded text-[10px] font-bold hover:bg-green-700 transition shadow-sm">
                                    {selectedTopics.length} Ekle
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            <button
                                onClick={() => setActiveTool('eraser')}
                                className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition flex items-center font-bold mb-4 ${activeTool === 'eraser' ? 'border-red-500 bg-red-50 text-red-700' : 'border-dashed border-gray-300 text-gray-500 hover:bg-gray-100'}`}
                            >
                                <Trash2 size={16} className="mr-3" /> Silgi
                            </button>

                            {availableTopics.map((topic, idx) => {
                                const isActive = activeTool?.topic === topic;
                                const isSelected = selectedTopics.includes(topic);

                                return (
                                    <div key={idx} className="flex gap-1 group">
                                        <div className="flex items-center justify-center pl-1">
                                            <button
                                                onClick={() => toggleTopicSelection(topic)}
                                                className={`p-1 rounded hover:bg-gray-200 transition ${isSelected ? 'text-indigo-600' : 'text-gray-300'}`}
                                            >
                                                {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => handleToolSelect(topic)}
                                            className={`flex-1 text-left px-3 py-2 rounded-lg text-[11px] font-semibold transition flex items-center border ${isActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' : 'bg-white text-gray-600 border-gray-200 hover:bg-indigo-50 hover:border-indigo-200'}`}
                                        >
                                            <div className={`w-2 h-2 rounded-full mr-2 shrink-0 ${SUBJECT_COLORS[selectedSubject]?.split(' ')[0] || 'bg-gray-400'}`}></div>
                                            <span className="truncate">{topic}</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                const est = getEstimatedDuration(topic);
                                                setDistributionQueue([...distributionQueue, {
                                                    subject: selectedSubject,
                                                    topic: topic,
                                                    color: SUBJECT_COLORS[selectedSubject],
                                                    weight: est,
                                                    duration: est
                                                }]);
                                            }}
                                            className="px-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 hover:bg-indigo-100 flex items-center justify-center font-bold"
                                            title="Listeye Ekle"
                                        >
                                            +
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* 3. Main Schedule Grid */}
                    <div className="flex-1 flex flex-col bg-gray-50">
                        {/* Month Tabs */}
                        <div className="flex border-b border-gray-200 bg-white px-2 pt-2 gap-1 overflow-x-auto">
                            {[...Array(12).keys()].filter(m => m < programDurationMonths).map(m => (
                                <button
                                    key={m + 1}
                                    onClick={() => { setActiveMonth(m + 1); setActiveWeek(1); }}
                                    className={`px-4 py-2 font-bold text-xs rounded-t-lg transition ${activeMonth === m + 1 ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {m + 1}. Ay
                                </button>
                            ))}
                        </div>
                        {/* Week Tabs */}
                        <div className="flex border-b border-gray-200 bg-gray-50 px-8 pt-2">
                            {[1, 2, 3, 4].map(week => (
                                <button
                                    key={week}
                                    onClick={() => setActiveWeek(week)}
                                    className={`px-8 py-2 font-bold text-sm border-b-2 transition -mb-[2px] ${activeWeek === week ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                >
                                    {week}. Hafta
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-auto p-8 flex justify-center items-start">
                            <div id="printable-schedule" className="bg-white shadow-xl border border-gray-200 p-8 min-w-[1000px] w-full max-w-[1400px]">
                                {/* Schedule Header */}
                                <div className="text-center mb-8 pb-4">
                                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-widest">{title}</h2>
                                    <p className="text-gray-400 font-bold text-sm mt-1 uppercase tracking-wide">{activeMonth}. AY / {activeWeek}. HAFTA PLANI</p>
                                </div>

                                {/* The Grid */}
                                <div className="grid grid-cols-8 gap-0 border-2 border-gray-800">
                                    {/* Header Row */}
                                    <div className="bg-gray-800 text-white font-bold p-3 text-center flex items-center justify-center text-sm tracking-wider">ETÜT</div>
                                    {DAYS.map(day => (
                                        <div key={day} className="bg-gray-100 text-gray-800 font-black p-3 text-center border-l border-b border-gray-300 uppercase text-xs tracking-wide">
                                            {day}
                                        </div>
                                    ))}

                                    {/* Slot Rows (Dynamic) */}
                                    {Array.from({ length: dailySlotCount }).map((_, slotIndex) => (
                                        <React.Fragment key={slotIndex}>
                                            {/* Slot Number Column */}
                                            <div className="bg-gray-50 font-bold text-gray-500 text-xs p-2 text-center border-b border-r border-gray-200 flex items-center justify-center">
                                                {slotIndex + 1}. Etüt
                                            </div>

                                            {/* Day Columns */}
                                            {DAYS.map(day => {
                                                const cellData = schedule[`m${activeMonth}-w${activeWeek}-${day}-${slotIndex}`];
                                                return (
                                                    <div
                                                        key={`${day}-${slotIndex}`}
                                                        onClick={() => handleCellClick(day, slotIndex)}
                                                        className={`
                                                            min-h-[50px] cursor-pointer border-b border-r border-gray-200 p-1 transition-all hover:bg-gray-50 relative group
                                                            ${cellData ? cellData.color : ''}
                                                        `}
                                                    >
                                                        {cellData ? (
                                                            <div className="h-full w-full rounded p-1 flex flex-col justify-center items-center text-center leading-tight">
                                                                <span className="text-[9px] font-bold opacity-70 uppercase tracking-tighter mb-0.5">{cellData.subject}</span>
                                                                <span className="text-[10px] font-black">{cellData.topic}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-20">
                                                                <PlusCircle size={14} className="text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </div>

                                <div className="mt-8 flex justify-between text-[10px] text-gray-300 font-mono uppercase">
                                    <span>AI ÖĞRENCİ KOÇU SİSTEMİ</span>
                                    <span>İBRAHİM KARATAŞ EĞİTİM DANIŞMANLIĞI</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ProgramBuilderModal;
