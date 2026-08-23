import React, { useState } from 'react';
import {
    Calendar, CheckCircle, ChevronDown, ChevronUp,
    RefreshCw, LayoutGrid, Info, Target, Zap,
    BarChart3, Download, XCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import MARKA from '../data/marka';
import html2canvas from 'html2canvas';
import ProgramCell from './program/ProgramCell';
import { ACTIVITY_TYPES } from '../data/programColors';
import programProgress from '../services/programProgressService';
import { bildir } from '../services/uiGeriBildirim';

// ─── Sabitler ──────────────────────────────────────────────────
const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const DAY_SHORT = { Pazartesi: 'Pzt', Salı: 'Sal', Çarşamba: 'Çar', Perşembe: 'Per', Cuma: 'Cum', Cumartesi: 'Cmt', Pazar: 'Paz' };

// (Eski round-robin dağıtım motoru ve AI Planlayıcı 23.08.2026'da
//  kaldırıldı — program üretimi tek yerde: utils/programMotoru.js,
//  yalnız koç panelinde.)
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

    /**
     * Etüt tamamlama — TEK dokunuş, iki durum (23.08.2026 talimatı):
     *   boş → "Etüt tamamlandı ✓"  →  boş ("tamamlama geri alındı")
     * Kayıt `program_progress`'e tarih/saat damgasıyla yazılır ve
     * senkronla koç paneline gider (program uyumu bundan hesaplanır).
     */
    const toggleCell = (cellKey) => {
        const suanki = progress?.[cellKey]?.status;
        const yeni = suanki === 'done' ? null : 'done';
        // Gelecek tarihli etüt tamamlanamaz (§3) — servis de reddeder
        if (yeni === 'done') {
            const k = programProgress.isaretlenebilirMi(userId, cellKey);
            if (!k.izin) { bildir(k.sebep, 'uyari', 2600); return; }
        }
        programProgress.setCellStatus(userId, cellKey, yeni);
        setProgress(programProgress.getProgress(userId));
        bildir(yeni === 'done' ? 'Etüt tamamlandı ✓' : 'Etüt tamamlama geri alındı', yeni === 'done' ? 'basari' : 'bilgi', 1800);
    };

    /** Bu hafta gösterilen etütlerin takvim tarihleri (kilit için). */
    const baslangic = React.useMemo(() => programProgress.programBaslangici(userId), [userId]);
    const gelecekMi = (cellKey) => {
        const t = programProgress.hucreTarihi(cellKey, baslangic);
        if (!t) return false;
        const bugun = new Date(); bugun.setHours(23, 59, 59, 999);
        return t.getTime() > bugun.getTime();
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
                    {/* Tek dokunuş: tamamlandı ↔ geri al */}
                    <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-brand-soft/60 border-b border-brand-line">
                        <span className="text-[11px] font-black uppercase tracking-wide text-brand">
                            Etüde dokun:
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-ink-2">
                            <CheckCircle size={13} className="text-ok" /> tamamlandı
                        </span>
                        <span className="text-[11px] font-bold text-ink-3">tekrar dokun — geri al</span>
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
                                        // Gelecek tarihli etüt: yalnızca görüntülenir (§3)
                                        const kilitli = cell && !status && gelecekMi(cellKey);
                                        return (
                                            <div key={day} className="p-1 relative">
                                                <ProgramCell
                                                    cell={cell}
                                                    size="md"
                                                    onClick={cell && !kilitli ? () => toggleCell(cellKey) : undefined}
                                                    className={`${status ? 'opacity-70' : ''} ${kilitli ? 'opacity-60 cursor-default' : ''}`}
                                                />
                                                {kilitli && (
                                                    <span
                                                        className="absolute top-1.5 right-1.5 text-[9px] font-black px-1 py-0.5 rounded bg-surface-3 text-ink-3 pointer-events-none"
                                                        title="Gelecek tarihli etüt — günü gelince işaretleyebilirsin"
                                                    >
                                                        🔒
                                                    </span>
                                                )}
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
                                    <span>{MARKA.tamAd.toLocaleUpperCase('tr-TR')}</span>
                                    <span className="text-ink-3 font-bold italic">HER HAFTA YENİ BİR BAŞLANGIÇTIR!</span>
                                </div>
                            </div>
                        );
                    })
                ))}
            </div>
        </div>
    );
};

// (AI Planlayıcı görünümü kaldırıldı — öğrenci program oluşturmaz.)

/**
 * ─── Ana Bileşen ────────────────────────────────────────────────
 * 23.08.2026: "AI Planlayıcı" görünümü KALDIRILDI. Gerekçe: öğrenci
 * program oluşturmayacak (yetki yalnız koçta) ve o görünüm ikinci bir
 * dağıtım motoru çalıştırıyordu — ürettiği hücreler `type` yerine
 * `slotType` yazdığı için hiçbir görüntüleyici doğru çizemiyor, yazdığı
 * `ai_plan_*` anahtarlarını da hiçbir ekran okumuyordu.
 * Öğrencinin tek etkileşimi: etüt tamamlama işareti.
 */
const StudentProgramTab = ({ schedule, programConfig, user }) => {
    const hasCoachProgram = schedule && Object.keys(schedule).length > 0;

    return (
        <div className="space-y-5 animate-fade-in">
            <div>
                <h1 className="text-2xl font-black text-ink">
                    {programConfig?.title || 'Çalışma Programım'}
                </h1>
                <p className="text-sm text-ink-2 mt-0.5">
                    {hasCoachProgram
                        ? 'Koçun tarafından hazırlandı — etütleri işaretleyerek takip et'
                        : 'Koçun program hazırladığında burada görünecek'}
                </p>
            </div>

            <CoachProgramView schedule={schedule} programConfig={programConfig} userId={user?.id} />
        </div>
    );
};

export default StudentProgramTab;
