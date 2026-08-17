import React, { useState, useEffect, useMemo } from 'react';
import {
    Calendar, CheckCircle, ChevronDown, ChevronUp,
    Sparkles, BrainCircuit, RefreshCw, BookOpen, LayoutGrid,
    Info, Target, Zap, Check, Save, AlignLeft, Star,
    ChevronsRight, BarChart3, Download, XCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CURRICULUM, SUBJECT_COLORS, getTopicName, getTopicWeight } from '../data/curriculum';
import ProgramCell from './program/ProgramCell';
import { getCellColor, getSubjectLabel, ACTIVITY_TYPES } from '../data/programColors';
import programProgress from '../services/programProgressService';
import { bildir } from '../services/uiGeriBildirim';

// ─── Sabitler ──────────────────────────────────────────────────
const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const DAY_SHORT = { Pazartesi: 'Pzt', Salı: 'Sal', Çarşamba: 'Çar', Perşembe: 'Per', Cuma: 'Cum', Cumartesi: 'Cmt', Pazar: 'Paz' };
const EXAM_LIST = ['TYT', 'AYT', 'LGS', 'YDT'];
const NUMERIC_SUBJECTS = new Set([
    'Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Geometri',
    'Trigonometri', 'Analitik Geometri', 'Logaritma', 'Sayılar', 'Olasılık', 'İstatistik', 'Fen'
]);

// ─── Yardımcılar ───────────────────────────────────────────────
const toStr = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && val.name) return val.name;
    return String(val);
};

const subjColor = (subj) => SUBJECT_COLORS?.[subj] || 'bg-surface-3 border-line text-ink';

// ─── Curriculum'dan ders haritası al (güvenli) ──────────────────
const getSubjectMapSafe = (examType, grade = 'grade11') => {
    try {
        const curr = CURRICULUM?.[examType];
        if (!curr) return {};
        const result = {};
        const proc = (subjects) => {
            if (!subjects || typeof subjects !== 'object') return;
            Object.entries(subjects).forEach(([sub, topics]) => {
                if (Array.isArray(topics)) {
                    result[sub] = topics;
                } else if (topics && typeof topics === 'object') {
                    proc(topics); // nested AYT/YDT
                }
            });
        };
        if (examType === 'AYT' || examType === 'YDT') {
            proc(curr[grade] || {});
        } else {
            proc(curr);
        }
        return result;
    } catch (e) {
        console.error('getSubjectMapSafe error:', e);
        return {};
    }
};

// ─── Verimli proportional round-robin dağıtım ──────────────────
// topicPool: [{lesson, topicName, weight, color}]  
// months × 4 hafta × 7 gün × slotsPerDay = toplam slotları doldurur
const buildDistributedSchedule = (topicPool, months, slotsPerDay) => {
    if (!topicPool || topicPool.length === 0) return {};

    // Tüm slotları sıraya diz
    const allSlots = [];
    for (let m = 1; m <= months; m++) {
        for (let w = 1; w <= 4; w++) {
            for (let d = 0; d < DAYS.length; d++) {
                for (let s = 0; s < slotsPerDay; s++) {
                    allSlots.push({ key: `m${m}-w${w}-${DAYS[d]}-${s}`, slotIdx: s });
                }
            }
        }
    }

    const totalSlots = allSlots.length;
    const totalWeight = topicPool.reduce((sum, t) => sum + (t.weight || 1), 0);

    // Her konuya orantılı slot tahsis et
    let pool = topicPool.map(t => ({
        ...t,
        quota: Math.round(((t.weight || 1) / totalWeight) * totalSlots),
        remaining: 0,
        kind: NUMERIC_SUBJECTS.has(t.lesson) ? 'num' : 'vrb',
    }));
    // Yuvarlama farkını en ağırlıklı konuya ekle
    const quotaSum = pool.reduce((s, p) => s + p.quota, 0);
    const diff = totalSlots - quotaSum;
    if (diff !== 0 && pool.length > 0) {
        const heaviest = pool.reduce((a, b) => b.weight > a.weight ? b : a, pool[0]);
        heaviest.quota = Math.max(0, heaviest.quota + diff);
    }
    pool = pool.map(p => ({ ...p, remaining: p.quota }));

    // Round-robin + numerik-sözel alternasyon
    let lastKind = 'vrb';
    let ptr = 0;
    const schedule = {};

    for (const { key, slotIdx } of allSlots) {
        // Kalan var mı?
        const hasLeft = pool.some(p => p.remaining > 0);
        if (!hasLeft) break;

        const wantKind = lastKind === 'num' ? 'vrb' : 'num';
        let found = -1;

        // İstenen türde ara
        for (let i = 0; i < pool.length; i++) {
            const idx = (ptr + i) % pool.length;
            if (pool[idx].remaining > 0 && pool[idx].kind === wantKind) { found = idx; break; }
        }
        // Bulamadıysa herhangi birini al
        if (found === -1) {
            for (let i = 0; i < pool.length; i++) {
                const idx = (ptr + i) % pool.length;
                if (pool[idx].remaining > 0) { found = idx; break; }
            }
        }
        if (found === -1) break;

        const item = pool[found];
        const slotType = slotIdx === 0 ? 'Tekrar'
            : slotIdx === slotsPerDay - 1 ? 'Soru Çözümü'
                : 'Konu Çalışması';

        schedule[key] = {
            subject: item.lesson,
            topic: item.topicName,
            color: item.color,
            slotType,
        };
        item.remaining--;
        lastKind = item.kind;
        ptr = (found + 1) % pool.length;
    }
    return schedule;
};

// ─── StatCard ───────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color }) => (
    <div className={`flex items-center gap-3 p-3 rounded-2xl border ${color} shadow-sm`}>
        <div className="p-2 rounded-xl bg-surface/60"><Icon size={18} /></div>
        <div>
            <div className="font-black text-lg leading-none">{value}</div>
            <div className="text-xs font-semibold opacity-70 mt-0.5">{label}</div>
            {sub && <div className="text-[10px] opacity-50">{sub}</div>}
        </div>
    </div>
);

// ─── Koç Programı Görünümü ──────────────────────────────────────
const CoachProgramView = ({ schedule, programConfig, userId }) => {
    const [activeWeek, setActiveWeek] = useState(1);
    const [activeMonth, setActiveMonth] = useState(1);
    // Gerçekleşme kaydı artık merkezi serviste — koç da aynı veriyi görüyor.
    const [progress, setProgress] = useState(() => {
        programProgress.migrateLegacy(userId);
        return programProgress.getProgress(userId);
    });

    const safeSlotCount = Number(programConfig?.dailySlotCount) || 6;
    const safeDurationMonths = Number(programConfig?.programDurationMonths) || 1;

    /** boş → yaptım → yapamadım → boş */
    const toggleCell = (cellKey) => {
        programProgress.cycleCellStatus(userId, cellKey);
        setProgress(programProgress.getProgress(userId));
    };

    const weekKeys = DAYS.flatMap(day =>
        Array.from({ length: safeSlotCount }, (_, s) => `m${activeMonth}-w${activeWeek}-${day}-${s}`)
    );
    const filledCells = weekKeys.filter(k => schedule?.[k]).length;
    const completedCount = weekKeys.filter(k => progress[k]?.status === 'done' && schedule?.[k]).length;
    const missedCount = weekKeys.filter(k => progress[k]?.status === 'missed' && schedule?.[k]).length;
    const fillRate = weekKeys.length ? Math.round((filledCells / weekKeys.length) * 100) : 0;
    const completionRate = filledCells ? Math.round((completedCount / filledCells) * 100) : 0;

    const handleDownloadPDF = async () => {
        const weekDivs = document.querySelectorAll('[data-pdf-week-student]');
        if (!weekDivs || weekDivs.length === 0) {
            bildir('Önce program oluşturulmalı.');
            return;
        }

        try {
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            const pdfW = doc.internal.pageSize.getWidth();
            const pdfH = doc.internal.pageSize.getHeight();
            const margin = 5;
            const imgW = pdfW - margin * 2;
            const imgH = pdfH - margin * 2;
            let firstPage = true;

            for (const div of weekDivs) {
                div.style.display = 'block';
                const canvas = await html2canvas(div, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    width: 1120,
                    windowWidth: 1120
                });
                div.style.display = '';

                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const ratio = Math.min(imgW / canvas.width, imgH / canvas.height);
                const drawW = canvas.width * ratio;
                const drawH = canvas.height * ratio;
                const offsetX = margin + (imgW - drawW) / 2;
                const offsetY = margin + (imgH - drawH) / 2;

                if (!firstPage) doc.addPage();
                doc.addImage(imgData, 'JPEG', offsetX, offsetY, drawW, drawH);
                firstPage = false;
            }

            doc.save(`Calisma_Programi_Tum_Haftalar.pdf`);
        } catch (error) {
            console.error('PDF Hatası:', error);
            bildir('PDF oluşturulurken bir hata oluştu.', 'hata');
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={LayoutGrid} label="Toplam Etüt" value={`${filledCells}/${weekKeys.length}`} sub="bu hafta" color="bg-brand-soft border-brand-line text-brand" />
                <StatCard icon={CheckCircle} label="Yaptım" value={completedCount} sub={missedCount ? `${missedCount} yapamadım` : 'etüt'} color="bg-ok-soft border-ok text-ok" />
                <StatCard icon={Target} label="Doluluk" value={`%${fillRate}`} sub="program doluluğu" color="bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] border-[color-mix(in_srgb,var(--c4)_35%,transparent)] text-c4" />
                <StatCard icon={Zap} label="Tamamlanma" value={`%${completionRate}`} sub="işaretlenen" color="bg-warn-soft border-warn text-warn" />
            </div>

            {filledCells > 0 && (
                <div className="bg-surface rounded-2xl p-4 border border-line shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-ink-2">Haftalık İlerleme</span>
                        <span className="text-sm font-black text-brand">{completedCount}/{filledCells} etüt</span>
                    </div>
                    <div className="w-full bg-surface-3 rounded-full h-3 overflow-hidden">
                        <div className="on-color h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-yavas" style={{ width: `${completionRate}%` }} />
                    </div>
                </div>
            )}

            {/* Ay + Hafta seçiciler */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
                <div className="flex items-center gap-3">
                    <h3 className="font-black text-ink text-base flex items-center gap-2">
                        <Calendar size={17} className="text-brand" />
                        {activeMonth}. Ay — {activeWeek}. Hafta
                    </h3>
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-1.5 px-3 py-1 bg-surface text-brand border border-brand-line hover:bg-brand-soft rounded-xl text-[10px] font-bold shadow-sm transition"
                    >
                        <Download size={12} /> PDF İndir
                    </button>
                </div>
                <div className="flex gap-3 flex-wrap">
                    {safeDurationMonths > 1 && (
                        <div className="flex gap-1 flex-wrap">
                            {Array.from({ length: safeDurationMonths }, (_, i) => i + 1).map(m => (
                                <button key={m} onClick={() => setActiveMonth(m)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${activeMonth === m ? 'bg-surface-inv text-ink' : 'bg-surface text-ink-2 border border-line hover:bg-surface-3'}`}>
                                    {m}.Ay
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-1">
                        {[1, 2, 3, 4].map(w => (
                            <button key={w} onClick={() => setActiveWeek(w)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeWeek === w ? 'bg-brand text-ink shadow-md scale-105' : 'bg-surface text-ink-2 border border-line hover:bg-brand-soft'}`}>
                                {w}. H
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {Object.keys(schedule || {}).length === 0 ? (
                <div className="bg-surface rounded-2xl p-12 text-center border border-dashed border-line">
                    <Calendar size={40} className="text-brand mx-auto mb-3" />
                    <p className="font-bold text-ink-2">Henüz program oluşturulmadı</p>
                    <p className="text-sm text-ink-3 mt-1">Koçun sana bir program oluşturduğunda burada görünecek.</p>
                </div>
            ) : (
                <div id="student-program-table" className="bg-surface rounded-2xl shadow-sm border border-line overflow-hidden">
                    {/* Üç durumlu işaretleme — koç bu işaretlemeleri anında görüyor */}
                    <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-brand-soft/60 border-b border-brand-line">
                        <span className="text-[11px] font-black uppercase tracking-wide text-brand">
                            Etüde tıkla:
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-ink-2">
                            <CheckCircle size={13} className="text-ok" /> 1. tık — yaptım
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-ink-2">
                            <XCircle size={13} className="text-danger" /> 2. tık — yapamadım
                        </span>
                        <span className="text-[11px] font-bold text-ink-3">3. tık — temizle</span>
                        <span className="ml-auto text-[10px] text-ink-3">
                            İşaretlemelerin koçuna anında yansır
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <div className="min-w-[680px]">
                            <div className="grid border-b-2 border-line" style={{ gridTemplateColumns: '80px repeat(7,1fr)' }}>
                                <div className="bg-surface-inv text-white font-bold p-3 text-center text-xs flex items-center justify-center uppercase tracking-widest">ETÜT</div>
                                {DAYS.map(day => (
                                    <div key={day} className="bg-surface-2 font-black p-2 text-center border-l border-line text-[11px] text-ink-2 uppercase tracking-wider notranslate" translate="no">
                                        {day}
                                    </div>
                                ))}
                            </div>
                            {Array.from({ length: safeSlotCount }, (_, si) => (
                                <div key={si} className="grid border-b border-line last:border-0" style={{ gridTemplateColumns: '80px repeat(7,1fr)' }}>
                                    <div className="bg-surface-2 text-ink-3 text-xs p-2 text-center border-r border-line flex items-center justify-center font-semibold">
                                        {si + 1}. Etüt
                                    </div>
                                    {DAYS.map(day => {
                                        const cellKey = `m${activeMonth}-w${activeWeek}-${day}-${si}`;
                                        const cell = schedule?.[cellKey];
                                        const status = progress[cellKey]?.status;
                                        return (
                                            <div key={day} className="p-1 relative">
                                                <ProgramCell
                                                    cell={cell}
                                                    size="md"
                                                    onClick={cell ? () => toggleCell(cellKey) : undefined}
                                                    className={status ? 'opacity-70' : ''}
                                                />
                                                {cell && status && (
                                                    <div
                                                        className="absolute inset-1 flex items-center justify-center rounded-xl pointer-events-none"
                                                        style={{
                                                            backgroundColor: status === 'done'
                                                                ? 'rgba(22,163,74,0.16)'
                                                                : 'rgba(220,38,38,0.16)',
                                                        }}
                                                    >
                                                        {status === 'done'
                                                            ? <CheckCircle size={22} className="text-ok" />
                                                            : <XCircle size={22} className="text-danger" />}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="px-4 py-2 bg-surface-2 border-t border-line flex items-center gap-2 text-xs text-ink-3">
                        <Info size={12} />
                        <span>Tamamladığın etüde tıklayarak işaretleyebilirsin.</span>
                    </div>
                </div>
            )}

            {/* 📄 Gizli Yazdırma Alanı — Her hafta ayrı div */}
            <div style={{ position: 'absolute', left: '-9999px', top: '0', pointerEvents: 'none' }}>
                {Array.from({ length: safeDurationMonths }).map((_, mIdx) => (
                    Array.from({ length: 4 }).map((_, wIdx) => {
                        const m = mIdx + 1;
                        const w = wIdx + 1;
                        const hasDataInWeek = Object.keys(schedule || {}).some(k => k.startsWith(`m${m}-w${w}-`));
                        if (!hasDataInWeek) return null;

                        return (
                            <div
                                key={`${m}-${w}`}
                                data-pdf-week-student={`${m}-${w}`}
                                style={{
                                    width: '1120px',
                                    backgroundColor: 'white',
                                    padding: '16px',
                                    boxSizing: 'border-box',
                                    display: 'block'
                                }}
                            >
                                <div className="text-center mb-2 pb-1 border-b-2 border-line">
                                    <h1 className="text-2xl font-black text-ink uppercase tracking-widest">{programConfig?.title || 'ÇALIŞMA PROGRAMI'}</h1>
                                    <p className="text-brand font-black text-sm mt-0.5 uppercase tracking-widest">{m}. AY / {w}. HAFTA DERS PROGRAMI</p>
                                    <p className="text-ink-3 text-[10px] mt-0.5">AI Tahminli Özel Program</p>
                                </div>

                                <div className="grid grid-cols-8 gap-0 border-2 border-line-2">
                                    <div className="bg-surface-inv text-white font-bold p-1.5 text-center flex items-center justify-center text-xs uppercase">ETÜT</div>
                                    {DAYS.map(day => (
                                        <div key={day} className="bg-surface-3 text-ink font-bold p-1.5 text-center border-l border-b border-line-2 uppercase text-[10px]">{day}</div>
                                    ))}

                                    {[...Array(safeSlotCount)].map((_, sIdx) => (
                                        <React.Fragment key={sIdx}>
                                            <div className="border-b border-line p-1 text-center bg-surface-2 flex flex-col items-center justify-center min-h-[48px]">
                                                <span className="text-[10px] font-black text-ink-2 uppercase">{sIdx + 1}. ETÜT</span>
                                            </div>
                                            {DAYS.map(day => {
                                                const key = `m${m}-w${w}-${day}-${sIdx}`;
                                                const data = schedule?.[key];
                                                return (
                                                    <div key={day} className="p-0.5">
                                                        <ProgramCell cell={data} size="sm" />
                                                    </div>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </div>
                                <div className="mt-3 flex justify-between text-[9px] text-ink-3 font-mono uppercase tracking-widest">
                                    <span>AI ÖĞRENCİ KOÇU SİSTEMİ</span>
                                    <span className="text-ink-3 font-bold italic">HER HAFTA YENİ BİR BAŞLANGIÇTIR!</span>
                                    <span>İBRAHİM KARATAŞ EĞİTİM DANIŞMANLIĞI</span>
                                </div>
                            </div>
                        );
                    })
                ))}
            </div>
        </div>
    );
};

// ─── AI Planlayıcı ─────────────────────────────────────────────
const AIPlannerView = ({ userId }) => {
    const [selectedExam, setSelectedExam] = useState('TYT');
    const [gradeLevel, setGradeLevel] = useState('grade11');
    const [selectedTopics, setSelectedTopics] = useState({}); // "lesson::topic" => bool
    const [openSubjects, setOpenSubjects] = useState({});
    const [months, setMonths] = useState(1);
    const [slotsPerDay, setSlotsPerDay] = useState(6);
    const [customNote, setCustomNote] = useState('');
    const [generating, setGenerating] = useState(false);
    const [generatedSchedule, setGeneratedSchedule] = useState(null);
    const [activeView, setActiveView] = useState({ month: 1, week: 1, day: 'Pazartesi' });
    const [savedOk, setSavedOk] = useState(false);

    // Ders haritası — useMemo ile güvenle hesapla
    const subjectMap = useMemo(() => {
        return getSubjectMapSafe(selectedExam, gradeLevel);
    }, [selectedExam, gradeLevel]);

    const subjectNames = useMemo(() => Object.keys(subjectMap), [subjectMap]);

    // Sınav veya sınıf değişince seçimleri sıfırla
    useEffect(() => {
        setSelectedTopics({});
        setOpenSubjects({});
        setGeneratedSchedule(null);
        setSavedOk(false);
    }, [selectedExam, gradeLevel]);

    const toggleTopic = (subject, topicName) => {
        const key = `${subject}::${topicName}`;
        setSelectedTopics(prev => ({ ...prev, [key]: !prev[key] }));
    };
    const selectAll = (subject) => {
        setSelectedTopics(prev => {
            const updated = { ...prev };
            (subjectMap[subject] || []).forEach(t => {
                updated[`${subject}::${getTopicName(t)}`] = true;
            });
            return updated;
        });
    };
    const deselectAll = (subject) => {
        setSelectedTopics(prev => {
            const updated = { ...prev };
            (subjectMap[subject] || []).forEach(t => {
                delete updated[`${subject}::${getTopicName(t)}`];
            });
            return updated;
        });
    };

    const selectedCount = useMemo(
        () => Object.values(selectedTopics).filter(Boolean).length,
        [selectedTopics]
    );

    const buildPool = () => {
        const pool = [];
        subjectNames.forEach(subject => {
            (subjectMap[subject] || []).forEach(t => {
                const topicName = getTopicName(t);
                if (selectedTopics[`${subject}::${topicName}`]) {
                    pool.push({ lesson: subject, topicName, weight: getTopicWeight(t), color: subjColor(subject) });
                }
            });
        });
        // Hiç seçilmemişse tüm konuları al
        if (pool.length === 0) {
            subjectNames.forEach(subject => {
                (subjectMap[subject] || []).forEach(t => {
                    pool.push({ lesson: subject, topicName: getTopicName(t), weight: getTopicWeight(t), color: subjColor(subject) });
                });
            });
        }
        return pool;
    };

    const handleGenerate = () => {
        const pool = buildPool();
        if (pool.length === 0) { bildir('Bu sınav türü için konu bulunamadı.'); return; }
        setGenerating(true);
        setSavedOk(false);
        setTimeout(() => {
            try {
                const sched = buildDistributedSchedule(pool, months, slotsPerDay);
                setGeneratedSchedule(sched);
                setActiveView({ month: 1, week: 1, day: 'Pazartesi' });
            } catch (e) {
                console.error('Plan oluşturma hatası:', e);
            }
            setGenerating(false);
        }, 600);
    };

    const handleSave = () => {
        if (!generatedSchedule || !userId) return;
        try {
            localStorage.setItem(`ai_plan_schedule_${userId}`, JSON.stringify(generatedSchedule));
            localStorage.setItem(`ai_plan_config_${userId}`, JSON.stringify({ months, slotsPerDay, exam: selectedExam, note: customNote }));
            setSavedOk(true);
            setTimeout(() => setSavedOk(false), 3000);
        } catch (e) { console.error(e); }
    };

    // Aktif haftanın görüntüsü
    const daySlots = useMemo(() => {
        if (!generatedSchedule) return [];
        return Array.from({ length: slotsPerDay }, (_, s) => {
            const k = `m${activeView.month}-w${activeView.week}-${activeView.day}-${s}`;
            return generatedSchedule[k] || null;
        });
    }, [generatedSchedule, activeView, slotsPerDay]);

    // Dağıtım özeti istatistiği
    const distStats = useMemo(() => {
        if (!generatedSchedule) return {};
        const counts = {};
        Object.values(generatedSchedule).forEach(cell => {
            if (!cell) return;
            counts[cell.subject] = (counts[cell.subject] || 0) + 1;
        });
        return counts;
    }, [generatedSchedule]);

    return (
        <div className="space-y-5">
            {/* ── Sınav Seçimi ── */}
            <div className="bg-surface rounded-2xl p-4 border border-line shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <BrainCircuit size={18} className="text-c4" />
                    <h3 className="font-bold text-ink">Sınav Türü</h3>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {EXAM_LIST.map(et => (
                        <button key={et} onClick={() => setSelectedExam(et)}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${selectedExam === et
                                ? 'bg-gradient-to-r from-purple-600 to-brand text-white shadow-lg scale-105'
                                : 'bg-surface-3 text-ink-2 hover:bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] hover:text-c4 border border-line'}`}>
                            {et}
                        </button>
                    ))}
                </div>
                {(selectedExam === 'AYT' || selectedExam === 'YDT') && (
                    <div className="flex gap-2 mt-3">
                        {['grade11', 'grade12'].map(g => (
                            <button key={g} onClick={() => setGradeLevel(g)}
                                className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${gradeLevel === g ? 'bg-brand text-ink' : 'bg-surface-3 text-ink-2 hover:bg-brand-soft'}`}>
                                {g === 'grade11' ? '11. Sınıf' : '12. Sınıf'}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Program Ayarları + Özel İstek ── */}
            <div className="bg-surface rounded-2xl p-4 border border-line shadow-sm space-y-3">
                <div className="flex items-center gap-2 mb-1">
                    <Target size={18} className="text-info" />
                    <h3 className="font-bold text-ink">Program Ayarları</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-semibold text-ink-2 block mb-1">Süre (Ay)</label>
                        <select value={months} onChange={e => setMonths(Number(e.target.value))}
                            className="w-full border border-line rounded-xl p-2 text-sm font-bold text-ink-2 outline-none focus:ring-2 focus:ring-purple-300">
                            {[1, 2, 3, 4, 5, 6, 9, 12].map(m => <option key={m} value={m}>{m} Ay</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-ink-2 block mb-1">Günlük Etüt</label>
                        <select value={slotsPerDay} onChange={e => setSlotsPerDay(Number(e.target.value))}
                            className="w-full border border-line rounded-xl p-2 text-sm font-bold text-ink-2 outline-none focus:ring-2 focus:ring-purple-300">
                            {[3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n} Etüt/Gün</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="text-xs font-semibold text-ink-2 block mb-1 flex items-center gap-1">
                        <AlignLeft size={12} /> Özel İstek / Not (opsiyonel)
                    </label>
                    <textarea value={customNote} onChange={e => setCustomNote(e.target.value)}
                        placeholder="Örn: Matematik ağırlıklı olsun, hafta sonları tekrar yapılsın..."
                        className="w-full border border-line rounded-xl p-3 text-sm text-ink-2 outline-none focus:ring-2 focus:ring-purple-300 resize-none bg-surface-2"
                        rows={2} />
                    <p className="text-[10px] text-ink-3 mt-0.5">Bu not programa eklenir ve kaydedilir.</p>
                </div>
            </div>

            {/* ── Konu Seçici ── */}
            <div className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden">
                <div className="p-4 border-b border-line flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BookOpen size={18} className="text-brand" />
                        <h3 className="font-bold text-ink">Eksik / Zayıf Konular</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedCount > 0 && (
                            <span className="bg-brand-soft text-brand text-xs font-bold px-2.5 py-1 rounded-full">
                                {selectedCount} konu seçili
                            </span>
                        )}
                        {selectedCount === 0 && (
                            <span className="text-xs text-ink-3 italic">Seçilmezse tüm müfredat kullanılır</span>
                        )}
                    </div>
                </div>

                {subjectNames.length === 0 ? (
                    <div className="p-8 text-center text-ink-3 text-sm">
                        Bu sınav için konu bulunamadı.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                        {subjectNames.map(subject => {
                            const topics = subjectMap[subject] || [];
                            const isOpen = !!openSubjects[subject];
                            const selCount = topics.filter(t => selectedTopics[`${subject}::${getTopicName(t)}`]).length;
                            const color = subjColor(subject);

                            return (
                                <div key={subject}>
                                    <button onClick={() => setOpenSubjects(prev => ({ ...prev, [subject]: !prev[subject] }))}
                                        className="w-full flex items-center justify-between p-3 hover:bg-surface-2 transition text-left">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${color}`}>{subject}</span>
                                            {selCount > 0 && <span className="text-xs text-brand font-semibold">{selCount} seçili</span>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-ink-3">{topics.length} konu</span>
                                            {isOpen ? <ChevronUp size={16} className="text-ink-3" /> : <ChevronDown size={16} className="text-ink-3" />}
                                        </div>
                                    </button>

                                    {isOpen && (
                                        <div className="pb-3 px-3 bg-surface-2/50">
                                            <div className="flex gap-2 mb-2 mt-1">
                                                <button onClick={() => selectAll(subject)} className="text-xs text-brand hover:underline font-semibold">Tümünü seç</button>
                                                <span className="text-ink-3">|</span>
                                                <button onClick={() => deselectAll(subject)} className="text-xs text-ink-2 hover:underline">Temizle</button>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {topics.map(topic => {
                                                    const tName = getTopicName(topic);
                                                    const tKey = `${subject}::${tName}`;
                                                    const isSel = !!selectedTopics[tKey];
                                                    const w = getTopicWeight(topic);
                                                    return (
                                                        <button key={tName} onClick={() => toggleTopic(subject, tName)}
                                                            className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${isSel
                                                                ? 'bg-brand text-white border-indigo-700 shadow-sm'
                                                                : 'bg-surface text-ink-2 border-line hover:border-brand-line hover:text-brand'}`}>
                                                            {isSel && <Check size={9} className="inline mr-0.5" />}
                                                            {tName}
                                                            {w >= 3 && <Star size={8} className="inline ml-0.5 opacity-60" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Oluştur Butonu ── */}
            <button onClick={handleGenerate} disabled={generating}
                className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-lg
                    ${generating ? 'bg-surface-3 text-ink-3 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-brand text-white hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]'}`}>
                {generating
                    ? <><RefreshCw size={20} className="animate-spin" />Dağıtılıyor...</>
                    : <><Sparkles size={20} />AI ile Program Oluştur • {months} ay • {slotsPerDay} etüt/gün</>}
            </button>

            {/* ── Oluşturulan Program ── */}
            {generatedSchedule && (
                <div className="bg-surface rounded-2xl shadow-sm border border-line overflow-hidden">
                    {/* Başlık */}
                    <div className="p-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-purple-50 to-indigo-50">
                        <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-c4" />
                            <h3 className="font-bold text-ink">Oluşturulan Program</h3>
                            <span className="text-xs text-ink-3 hidden sm:inline">{selectedExam} · {months} ay · {slotsPerDay} etüt/gün</span>
                        </div>
                        <button onClick={handleSave}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${savedOk ? 'bg-ok text-white' : 'bg-brand text-white hover:bg-brand-hover'}`}>
                            <Save size={13} />
                            {savedOk ? 'Kaydedildi ✓' : 'Kaydet'}
                        </button>
                    </div>

                    {/* Dağıtım özeti */}
                    {Object.keys(distStats).length > 0 && (
                        <div className="px-4 py-3 border-b border-line bg-surface-2/50">
                            <p className="text-xs font-bold text-ink-2 mb-2 flex items-center gap-1">
                                <BarChart3 size={12} /> Dağıtım Özeti (toplam {Object.values(distStats).reduce((a, b) => a + b, 0)} etüt)
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(distStats).map(([subj, cnt]) => (
                                    <span key={subj} className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${subjColor(subj)}`}>
                                        {subj}: {cnt}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Ay / Hafta / Gün navigasyon */}
                    <div className="p-3 border-b border-line flex flex-wrap gap-2 items-center">
                        {months > 1 && (
                            <div className="flex gap-1">
                                {Array.from({ length: months }, (_, i) => i + 1).map(m => (
                                    <button key={m} onClick={() => setActiveView(v => ({ ...v, month: m }))}
                                        className={`px-2 py-1 rounded-lg text-xs font-bold transition ${activeView.month === m ? 'bg-surface-inv text-ink' : 'bg-surface text-ink-2 border border-line hover:bg-surface-3'}`}>
                                        {m}.Ay
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="flex gap-1">
                            {[1, 2, 3, 4].map(w => (
                                <button key={w} onClick={() => setActiveView(v => ({ ...v, week: w }))}
                                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${activeView.week === w ? 'bg-brand text-ink' : 'bg-surface text-ink-2 border border-line hover:bg-brand-soft'}`}>
                                    {w}.H
                                </button>
                            ))}
                        </div>
                        <ChevronsRight size={14} className="text-ink-3" />
                        <div className="flex gap-1 flex-wrap">
                            {DAYS.map(day => (
                                <button key={day} onClick={() => setActiveView(v => ({ ...v, day }))}
                                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${activeView.day === day ? 'bg-brand text-ink shadow' : 'text-ink-2 hover:bg-surface-3'}`}>
                                    {DAY_SHORT[day]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Gün içeriği */}
                    <div className="p-4">
                        <h4 className="font-bold text-ink-2 mb-3 text-sm">
                            {activeView.day} — {activeView.month}. Ay {activeView.week}. Hafta
                        </h4>
                        {daySlots.every(s => !s) ? (
                            <p className="text-ink-3 text-sm text-center py-6">Bu gün için etüt atanmadı.</p>
                        ) : (
                            <div className="space-y-2">
                                {daySlots.map((slot, i) => slot ? (
                                    <div
                                        key={i}
                                        className="flex items-stretch gap-3 rounded-xl overflow-hidden"
                                        style={{
                                            backgroundColor: getCellColor(slot).bg,
                                            border: `1.5px solid ${getCellColor(slot).border}44`,
                                        }}
                                    >
                                        <div
                                            className="w-9 flex-shrink-0 flex items-center justify-center font-black text-sm text-ink"
                                            style={{ backgroundColor: getCellColor(slot).border }}
                                        >
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 py-2.5 pr-3">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <span className="text-[10px]">{ACTIVITY_TYPES[slot.type || 'konu'].icon}</span>
                                                <span
                                                    className="text-[10px] font-black uppercase tracking-wide"
                                                    style={{ color: getCellColor(slot).border }}
                                                >
                                                    {getSubjectLabel(toStr(slot.subject))}
                                                </span>
                                            </div>
                                            <div className="text-sm font-bold leading-tight" style={{ color: getCellColor(slot).text }}>
                                                {toStr(slot.topic)}
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 flex items-center pr-3">
                                            <span
                                                className="text-[10px] font-black px-2 py-0.5 rounded-full"
                                                style={{ backgroundColor: `${getCellColor(slot).border}22`, color: getCellColor(slot).text }}
                                            >
                                                {ACTIVITY_TYPES[slot.type || 'konu'].short}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div key={i} className="flex items-center gap-3 rounded-xl border border-dashed border-line py-2.5 px-3">
                                        <div className="w-8 text-center text-xs text-ink-3 font-bold">{i + 1}</div>
                                        <div className="text-xs text-ink-3">—</div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {customNote && (
                            <div className="mt-3 bg-warn-soft border border-warn rounded-xl p-3 text-xs text-warn flex items-start gap-2">
                                <AlignLeft size={12} className="mt-0.5 flex-shrink-0" />
                                <span><strong>Özel İstek:</strong> {customNote}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Ana Bileşen ────────────────────────────────────────────────
const StudentProgramTab = ({ schedule, programConfig, user }) => {
    const [mode, setMode] = useState('coach');
    const hasCoachProgram = schedule && Object.keys(schedule).length > 0;

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-black text-ink">
                        {mode === 'coach' ? (programConfig?.title || 'Çalışma Programım') : 'AI Planlayıcı'}
                    </h1>
                    <p className="text-sm text-ink-2 mt-0.5">
                        {mode === 'coach'
                            ? hasCoachProgram ? 'Koçun tarafından oluşturuldu' : 'Henüz program hazırlanmadı'
                            : 'Eksik konularını seçerek kişisel planını oluştur'}
                    </p>
                </div>
                <div className="flex gap-1 p-1 bg-surface-3 rounded-2xl">
                    <button onClick={() => setMode('coach')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all relative ${mode === 'coach' ? 'bg-surface text-brand shadow-sm' : 'text-ink-2 hover:text-ink-2'}`}>
                        <Calendar size={15} /> Koç Programı
                        {hasCoachProgram && mode !== 'coach' && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-ok rounded-full border-2 border-line" />
                        )}
                    </button>
                    <button onClick={() => setMode('ai')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'ai' ? 'bg-surface text-c4 shadow-sm' : 'text-ink-2 hover:text-ink-2'}`}>
                        <BrainCircuit size={15} /> AI Planlayıcı
                    </button>
                </div>
            </div>

            {mode === 'coach'
                ? <CoachProgramView schedule={schedule} programConfig={programConfig} userId={user?.id} />
                : <AIPlannerView userId={user?.id} />
            }
        </div>
    );
};

export default StudentProgramTab;
