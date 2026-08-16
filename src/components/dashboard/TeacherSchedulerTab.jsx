import React, { useState, useEffect, useRef } from 'react';
import { 
    Users, Plus, Trash2, Calendar, Clock, MapPin, 
    ArrowRightLeft, Printer, Check, X, Settings, 
    Search, Download, Save, RefreshCw, Layers
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';

// Utility for Tailwind classes
const cn = (...inputs) => twMerge(clsx(inputs));

const TeacherSchedulerTab = () => {
    // --- State & Constants ---
    const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    const HOURS = [
        '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
        '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00'
    ];
    const ROOMS = ['A-101', 'B-202', 'C-303', 'D-404'];

    const [teachers, setTeachers] = useState(() => JSON.parse(localStorage.getItem('tp_teachers') || '[]'));
    const [students, setStudents] = useState(() => JSON.parse(localStorage.getItem('tp_students') || '[]'));
    const [pairings, setPairings] = useState(() => JSON.parse(localStorage.getItem('tp_pairings') || '[]'));
    const [schedule, setSchedule] = useState(() => JSON.parse(localStorage.getItem('tp_schedule') || '{}'));
    const [teacherAvailability, setTeacherAvailability] = useState(() => JSON.parse(localStorage.getItem('tp_avail') || '{}'));
    
    const [activeTab, setActiveTab] = useState('program'); // 'program' | 'definitions'
    const [activeTeacherId, setActiveTeacherId] = useState(null);
    const [isAddingTeacher, setIsAddingTeacher] = useState(false);
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [isAddingPair, setIsAddingPair] = useState(false);
    const [editingAvail, setEditingAvail] = useState(null);
    const [distributingPair, setDistributingPair] = useState(null);
    const [activeRoom, setActiveRoom] = useState(0);

    const [newTeacher, setNewTeacher] = useState({ name: '', surname: '', branch: '' });
    const [newStudent, setNewStudent] = useState({ name: '', surname: '', grade: '', number: '' });
    const [newPair, setNewPair] = useState({ teacherId: '', studentId: '', totalHours: 1 });

    const teacherScheduleRef = useRef(null);

    // --- Persistence ---
    useEffect(() => {
        localStorage.setItem('tp_teachers', JSON.stringify(teachers));
        localStorage.setItem('tp_students', JSON.stringify(students));
        localStorage.setItem('tp_pairings', JSON.stringify(pairings));
        localStorage.setItem('tp_schedule', JSON.stringify(schedule));
        localStorage.setItem('tp_avail', JSON.stringify(teacherAvailability));
    }, [teachers, students, pairings, schedule, teacherAvailability]);

    // --- Helpers ---
    const addTeacher = () => {
        if (!newTeacher.name || !newTeacher.surname) return;
        setTeachers([...teachers, { ...newTeacher, id: Date.now().toString() }]);
        setNewTeacher({ name: '', surname: '', branch: '' });
        setIsAddingTeacher(false);
    };

    const addStudent = () => {
        if (!newStudent.name || !newStudent.surname) return;
        setStudents([...students, { ...newStudent, id: Date.now().toString() }]);
        setNewStudent({ name: '', surname: '', grade: '', number: '' });
        setIsAddingStudent(false);
    };

    const addPairing = () => {
        if (!newPair.teacherId || !newPair.studentId) return;
        setPairings([...pairings, { ...newPair, id: Date.now().toString() }]);
        setNewPair({ teacherId: '', studentId: '', totalHours: 1 });
        setIsAddingPair(false);
    };

    const deleteTeacher = (id) => {
        if (window.confirm('Öğretmeni ve programını silmek istediğinize emin misiniz?')) {
            setTeachers(teachers.filter(t => t.id !== id));
            setPairings(pairings.filter(p => p.teacherId !== id));
            const newSched = { ...schedule };
            Object.keys(newSched).forEach(k => { if (newSched[k].teacherId === id) delete newSched[k]; });
            setSchedule(newSched);
        }
    };

    const deletePairing = (id) => {
        if (window.confirm('Bu ders eşleştirmesini silmek istediğinize emin misiniz?')) {
            const pair = pairings.find(p => p.id === id);
            setPairings(pairings.filter(p => p.id !== id));
            const newSched = { ...schedule };
            Object.keys(newSched).forEach(k => {
                if (newSched[k].teacherId === pair.teacherId && newSched[k].studentId === pair.studentId) delete newSched[k];
            });
            setSchedule(newSched);
        }
    };

    const toggleTeacherAvail = (tId, dIdx, hIdx) => {
        const key = `${dIdx}-${hIdx}`;
        const current = teacherAvailability[tId] || [];
        if (current.includes(key)) {
            setTeacherAvailability({ ...teacherAvailability, [tId]: current.filter(k => k !== key) });
        } else {
            setTeacherAvailability({ ...teacherAvailability, [tId]: [...current, key] });
        }
    };

    // --- Distribution Engine ---
    const togglePairDistributionAt = (pair, dIdx, hIdx, roomIdx) => {
        const cellId = `${dIdx}-${hIdx}-${roomIdx}`;
        const existing = schedule[cellId];

        if (existing && existing.teacherId === pair.teacherId && existing.studentId === pair.studentId) {
            const newSched = { ...schedule };
            delete newSched[cellId];
            setSchedule(newSched);
            return;
        }

        // Conflict check
        const isTcBusy = Object.keys(schedule).some(k => k.startsWith(`${dIdx}-${hIdx}`) && schedule[k].teacherId === pair.teacherId);
        const isStBusy = Object.keys(schedule).some(k => k.startsWith(`${dIdx}-${hIdx}`) && schedule[k].studentId === pair.studentId);
        
        if (isTcBusy) return alert('Öğretmen bu saatte başka bir odada derste!');
        if (isStBusy) return alert('Öğrenci bu saatte başka bir odada derste!');
        if (existing) return alert('Bu derslik bu saatte dolu!');

        const assignedCount = Object.values(schedule).filter(s => s.teacherId === pair.teacherId && s.studentId === pair.studentId).length;
        if (assignedCount >= pair.totalHours) return alert('Bu eşleştirme için planlanan tüm saatler doldu!');

        setSchedule({ ...schedule, [cellId]: { teacherId: pair.teacherId, studentId: pair.studentId, studentName: `${students.find(s=>s.id===pair.studentId)?.name}` } });
    };

    const autoDistribute = () => {
        if (!window.confirm('Tüm dersler müsaitlik durumuna göre otomatik dağıtılacak. Mevcut program sıfırlanabilir. Devam?')) return;
        
        let newSchedule = {};
        const sortedPairings = [...pairings].sort((a, b) => b.totalHours - a.totalHours);

        for (const pair of sortedPairings) {
            let placed = 0;
            const tAvail = teacherAvailability[pair.teacherId] || [];
            
            for (let d = 0; d < DAYS.length && placed < pair.totalHours; d++) {
                for (let h = 0; h < HOURS.length && placed < pair.totalHours; h++) {
                    const dhKey = `${d}-${h}`;
                    if (tAvail.length > 0 && !tAvail.includes(dhKey)) continue;

                    for (let r = 0; r < ROOMS.length; r++) {
                        const cellId = `${d}-${h}-${r}`;
                        const isRoomOcc = newSchedule[cellId];
                        const isTcBusy = Object.keys(newSchedule).some(k => k.startsWith(`${d}-${h}`) && newSchedule[k].teacherId === pair.teacherId);
                        const isStBusy = Object.keys(newSchedule).some(k => k.startsWith(`${d}-${h}`) && newSchedule[k].studentId === pair.studentId);

                        if (!isRoomOcc && !isTcBusy && !isStBusy) {
                            newSchedule[cellId] = { teacherId: pair.teacherId, studentId: pair.studentId, studentName: students.find(s=>s.id===pair.studentId)?.name };
                            placed++;
                            break;
                        }
                    }
                }
            }
        }
        setSchedule(newSchedule);
        alert('Otomatik dağıtım tamamlandı!');
    };

    const exportPDF = () => {
        const element = teacherScheduleRef.current;
        if (!element) return;
        const opt = {
            margin: 10,
            filename: 'Ogretmen_Programi.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };
        html2pdf().from(element).set(opt).save();
    };

    // --- Render ---
    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-8 bg-surface-2 min-h-screen rounded-3xl">
            {/* Header */}
            <div className="flex justify-between items-center bg-surface p-8 rounded-[40px] shadow-sm border border-line">
                <div>
                    <h1 className="text-3xl font-black text-ink tracking-tighter uppercase">Öğretmen & Ders Dağıtım Sistemi</h1>
                    <p className="text-ink-3 font-bold text-sm uppercase tracking-widest mt-1">İbrahim Karataş Eğitim Koçluğu</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setActiveTab('definitions')} className={cn("px-6 py-3 rounded-2xl text-sm font-black transition-all", activeTab === 'definitions' ? "bg-surface-inv text-ink shadow-xl" : "bg-surface-2 text-ink-3 hover:bg-surface-3")}>TANIMLAMALAR</button>
                    <button onClick={() => setActiveTab('program')} className={cn("px-6 py-3 rounded-2xl text-sm font-black transition-all", activeTab === 'program' ? "bg-surface-inv text-ink shadow-xl" : "bg-surface-2 text-ink-3 hover:bg-surface-3")}>DERS PROGRAMI</button>
                    <button onClick={autoDistribute} className="bg-brand text-white px-6 py-3 rounded-2xl text-sm font-black flex items-center gap-2 hover:bg-brand-hover shadow-lg"><RefreshCw size={18}/> OTOMATIK DAGIT</button>
                </div>
            </div>

            {activeTab === 'definitions' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Teachers */}
                    <div className="bg-surface p-8 rounded-[40px] border border-line shadow-sm space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black text-ink uppercase tracking-widest">Öğretmenler</h3>
                            <button onClick={() => setIsAddingTeacher(true)} className="p-3 bg-ok-soft text-ok rounded-2xl hover:bg-ok hover:text-ink transition-all shadow-sm border border-ok"><Plus size={20}/></button>
                        </div>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scroll-thin">
                            {teachers.map(t => (
                                <div key={t.id} className="group p-5 bg-surface-2 rounded-3xl border border-transparent hover:border-line hover:bg-surface transition-all flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-brand text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-100">{t.name[0]}</div>
                                        <div>
                                            <p className="font-black text-ink leading-none mb-1 uppercase text-sm">{t.name} {t.surname}</p>
                                            <p className="text-[10px] font-bold text-ink-3 uppercase tracking-widest">{t.branch}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingAvail(t.id)} className="p-2.5 text-ink-3 hover:text-brand transition-colors"><Settings size={18}/></button>
                                        <button onClick={() => deleteTeacher(t.id)} className="p-2.5 text-ink-3 hover:text-danger transition-colors"><Trash2 size={18}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Students */}
                    <div className="bg-surface p-8 rounded-[40px] border border-line shadow-sm space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black text-ink uppercase tracking-widest">Öğrenciler</h3>
                            <button onClick={() => setIsAddingStudent(true)} className="p-3 bg-info-soft text-info rounded-2xl hover:bg-info hover:text-ink transition-all shadow-sm border border-info"><Plus size={20}/></button>
                        </div>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scroll-thin">
                            {students.map(s => (
                                <div key={s.id} className="p-5 bg-surface-2 rounded-3xl border border-transparent hover:border-line hover:bg-surface transition-all flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-ok text-white rounded-2xl flex items-center justify-center font-black rounded-full border-4 border-white shadow-lg">{s.name[0]}</div>
                                        <div>
                                            <p className="font-black text-ink leading-none mb-1 uppercase text-sm">{s.name} {s.surname}</p>
                                            <p className="text-[10px] font-bold text-ink-3 uppercase tracking-widest">{s.grade}. Sınıf • No: {s.number}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setStudents(students.filter(x => x.id !== s.id))} className="p-2.5 text-ink-3 hover:text-danger transition-colors"><Trash2 size={18}/></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pairings */}
                    <div className="bg-surface p-8 rounded-[40px] border border-line shadow-sm space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black text-ink uppercase tracking-widest">Ders Eşleşmeleri</h3>
                            <button onClick={() => setIsAddingPair(true)} className="p-3 bg-warn-soft text-warn rounded-2xl hover:bg-warn hover:text-ink transition-all shadow-sm border border-warn"><ArrowRightLeft size={20}/></button>
                        </div>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scroll-thin">
                            {pairings.map(p => {
                                const t = teachers.find(x => x.id === p.teacherId);
                                const s = students.find(x => x.id === p.studentId);
                                const assigned = Object.values(schedule).filter(v => v.teacherId === p.teacherId && v.studentId === p.studentId).length;
                                return (
                                    <div key={p.id} className="p-5 bg-warn-soft/30 rounded-3xl border-2 border-amber-50 flex justify-between items-center">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-black text-ink text-xs uppercase">{t?.name} {t?.surname}</p>
                                                <ArrowRightLeft size={10} className="text-warn"/>
                                                <p className="font-black text-ink text-xs uppercase">{s?.name}</p>
                                            </div>
                                            <p className="text-[10px] font-bold text-warn uppercase tracking-widest">Toplam: {p.totalHours} Saat / Atanan: {assigned} Saat</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setDistributingPair(p.id)} className="p-2.5 text-warn hover:text-warn transition-colors"><Layers size={18}/></button>
                                            <button onClick={() => deletePairing(p.id)} className="p-2.5 text-ink-3 hover:text-danger transition-colors"><Trash2 size={18}/></button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-fade-in">
                    <div className="flex gap-4 scroll-x overflow-x-auto pb-4 scroll-thin">
                        {teachers.map(t => (
                            <button key={t.id} onClick={() => setActiveTeacherId(t.id)} className={cn("px-6 py-4 rounded-3xl text-sm font-black whitespace-nowrap transition-all border-b-4", activeTeacherId === t.id ? "bg-surface-inv text-ink border-slate-950 shadow-xl" : "bg-surface text-ink-3 border-line hover:border-line shadow-sm")}>
                                {t.name} {t.surname}
                            </button>
                        ))}
                    </div>

                    <div ref={teacherScheduleRef} className="bg-surface rounded-[40px] shadow-sm border border-line p-8 min-h-[600px]">
                        {activeTeacherId ? (
                             <table className="w-full border-separate border-spacing-2">
                                 <thead>
                                     <tr>
                                         <th className="w-32 bg-surface-2 p-4 rounded-2xl"></th>
                                         {DAYS.map(d => <th key={d} className="p-4 bg-surface-2 rounded-2xl text-[11px] font-black uppercase text-ink-3 border border-line">{d}</th>)}
                                     </tr>
                                 </thead>
                                 <tbody>
                                     {HOURS.map((h, hIdx) => (
                                         <tr key={h}>
                                             <td className="p-4 bg-surface-2 text-center rounded-2xl text-[10px] font-black text-ink">{h}</td>
                                             {DAYS.map((_, dIdx) => {
                                                 let lesson = null;
                                                 let roomName = '';
                                                 ROOMS.forEach((r, rIdx) => {
                                                     const l = schedule[`${dIdx}-${hIdx}-${rIdx}`];
                                                     if (l && l.teacherId === activeTeacherId) { lesson = l; roomName = r; }
                                                 });
                                                 return (
                                                     <td key={`${dIdx}-${hIdx}`} className="p-2 min-w-[200px]">
                                                         {lesson ? (
                                                             <div className="p-4 bg-brand-soft border-2 border-brand-line rounded-3xl text-center space-y-1 shadow-sm">
                                                                 <p className="text-[10px] font-black text-brand uppercase">{roomName}</p>
                                                                 <p className="text-xs font-black text-ink uppercase leading-tight">{lesson.studentName}</p>
                                                             </div>
                                                         ) : <div className="h-20 bg-surface-2/50 rounded-3xl border border-dashed border-line"></div>}
                                                     </td>
                                                 );
                                             })}
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                        ) : <div className="py-20 text-center"><p className="text-ink-3 font-black uppercase text-xl">Lütfen yukarıdan bir öğretmen seçin</p></div>}
                    </div>
                </div>
            )}

            {/* Modals simplified */}
            {isAddingTeacher && (
                <div className="fixed inset-0 z-modal-base bg-surface-inv/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-surface p-10 rounded-[40px] shadow-2xl w-full max-w-sm space-y-6">
                        <h3 className="text-xl font-black text-ink uppercase">Yeni Öğretmen</h3>
                        <input value={newTeacher.name} onChange={e=>setNewTeacher({...newTeacher, name:e.target.value})} className="w-full p-4 bg-surface-2 rounded-2xl border-none outline-none font-bold text-sm" placeholder="Ad" />
                        <input value={newTeacher.surname} onChange={e=>setNewTeacher({...newTeacher, surname:e.target.value})} className="w-full p-4 bg-surface-2 rounded-2xl border-none outline-none font-bold text-sm" placeholder="Soyad" />
                        <input value={newTeacher.branch} onChange={e=>setNewTeacher({...newTeacher, branch:e.target.value})} className="w-full p-4 bg-surface-2 rounded-2xl border-none outline-none font-bold text-sm" placeholder="Branş" />
                        <button onClick={addTeacher} className="w-full bg-surface-inv text-white py-4 rounded-2xl font-black">EKLE</button>
                        <button onClick={()=>setIsAddingTeacher(false)} className="w-full text-ink-3 font-bold">Vazgeç</button>
                    </div>
                </div>
            )}

            {isAddingStudent && (
                 <div className="fixed inset-0 z-modal-base bg-surface-inv/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-surface p-10 rounded-[40px] shadow-2xl w-full max-w-sm space-y-6">
                        <h3 className="text-xl font-black text-ink uppercase">Yeni Öğrenci</h3>
                        <input value={newStudent.name} onChange={e=>setNewStudent({...newStudent, name:e.target.value})} className="w-full p-4 bg-surface-2 rounded-2xl border-none outline-none font-bold text-sm" placeholder="Ad" />
                        <input value={newStudent.surname} onChange={e=>setNewStudent({...newStudent, surname:e.target.value})} className="w-full p-4 bg-surface-2 rounded-2xl border-none outline-none font-bold text-sm" placeholder="Soyad" />
                        <input value={newStudent.grade} onChange={e=>setNewStudent({...newStudent, grade:e.target.value})} className="w-full p-4 bg-surface-2 rounded-2xl border-none outline-none font-bold text-sm" placeholder="Sınıf" />
                        <button onClick={addStudent} className="w-full bg-surface-inv text-white py-4 rounded-2xl font-black">KAYDET</button>
                        <button onClick={()=>setIsAddingStudent(false)} className="w-full text-ink-3 font-bold">Vazgeç</button>
                    </div>
                </div>
            )}

            {isAddingPair && (
                 <div className="fixed inset-0 z-modal-base bg-surface-inv/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-surface p-10 rounded-[40px] shadow-2xl w-full max-w-sm space-y-6">
                        <h3 className="text-xl font-black text-ink uppercase tracking-widest">Ders Eşleştir</h3>
                        <select value={newPair.teacherId} onChange={e=>setNewPair({...newPair, teacherId:e.target.value})} className="w-full p-4 bg-surface-2 rounded-2xl border-none font-bold outline-none">
                            <option value="">Öğretmen Seç...</option>
                            {teachers.map(t=><option key={t.id} value={t.id}>{t.name} {t.surname}</option>)}
                        </select>
                        <select value={newPair.studentId} onChange={e=>setNewPair({...newPair, studentId:e.target.value})} className="w-full p-4 bg-surface-2 rounded-2xl border-none font-bold outline-none">
                            <option value="">Öğrenci Seç...</option>
                            {students.map(s=><option key={s.id} value={s.id}>{s.name} {s.surname}</option>)}
                        </select>
                        <input type="number" min="1" value={newPair.totalHours} onChange={e=>setNewPair({...newPair, totalHours:parseInt(e.target.value)})} className="w-full p-4 bg-surface-2 rounded-2xl border-none outline-none font-bold" placeholder="Saat" />
                        <button onClick={addPairing} className="w-full bg-surface-inv text-white py-4 rounded-2xl font-black shadow-lg">EŞLEŞTİR</button>
                        <button onClick={()=>setIsAddingPair(false)} className="w-full text-ink-3 font-bold">Vazgeç</button>
                    </div>
                </div>
            )}

            {editingAvail && (
                 <div className="fixed inset-0 z-modal-base bg-surface-inv/60 backdrop-blur-xl flex items-center justify-center p-4">
                    <div className="bg-surface p-12 rounded-[50px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto space-y-8 scroll-thin">
                        <div className="flex justify-between items-center border-b pb-6">
                            <h3 className="text-2xl font-black text-ink uppercase tracking-tighter">Müsaitlik Ayarları</h3>
                            <button onClick={()=>setEditingAvail(null)} className="p-4 bg-surface-2 rounded-3xl text-ink-3 hover:text-ink"><X size={24}/></button>
                        </div>
                        <div className="grid grid-cols-8 gap-4">
                            <div className="h-12 flex items-center justify-center"></div>
                            {DAYS.map(d=><div key={d} className="text-center text-[10px] font-black text-ink-3 uppercase">{d}</div>)}
                            {HOURS.map((h, hIdx) => (
                                <React.Fragment key={h}>
                                    <div className="text-[10px] font-bold text-ink-3 flex items-center justify-center">{h.split(' - ')[0]}</div>
                                    {DAYS.map((_, dIdx) => {
                                        const key = `${dIdx}-${hIdx}`;
                                        const isAvail = (teacherAvailability[editingAvail] || []).includes(key);
                                        return (
                                            <div key={key} onClick={()=>toggleTeacherAvail(editingAvail, dIdx, hIdx)} className={cn("h-12 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-center", isAvail ? "bg-brand border-indigo-600 text-ink shadow-md shadow-indigo-100" : "bg-surface-2 border-line text-transparent opacity-50")}>
                                                <Check size={20}/>
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                        <button onClick={()=>setEditingAvail(null)} className="w-full bg-surface-inv text-white py-5 rounded-3xl font-black shadow-xl">KAYDET VE KAPAT</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherSchedulerTab;
