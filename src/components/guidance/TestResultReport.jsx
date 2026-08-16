/**
 * 🧾 ENVANTER SONUÇ RAPORU
 *
 * Tüm envanterler için ortak rapor ekranı: genel düzey, alt boyutlar,
 * dikkat çeken maddeler, yorum, öneriler ve PDF çıktısı.
 */
import React, { useMemo, useRef, useState } from 'react';
import {
    FileText, Download, AlertTriangle, CheckCircle2, Lightbulb,
    ClipboardList, X, Printer,
} from 'lucide-react';
import { buildTestReport } from '../../services/guidanceReportService';

const TestResultReport = ({ testId, answers, studentName, className, completedAt, onClose }) => {
    const printRef = useRef(null);
    const [busy, setBusy] = useState(false);

    const report = useMemo(
        () => buildTestReport(testId, answers, { studentName, className, completedAt }),
        [testId, answers, studentName, className, completedAt]
    );

    if (!report) {
        return (
            <div className="p-8 text-center text-ink-3 text-sm">
                Bu envanter için sonuç üretilemedi.
            </div>
        );
    }

    const downloadPDF = async () => {
        if (!printRef.current) return;
        setBusy(true);
        try {
            const [{ jsPDF }, html2canvas] = await Promise.all([
                import('jspdf'),
                import('html2canvas').then((m) => m.default),
            ]);
            const canvas = await html2canvas(printRef.current, {
                scale: 2, backgroundColor: '#ffffff', useCORS: true,
                width: 900, windowWidth: 900,
            });
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pw = doc.internal.pageSize.getWidth();
            const ph = doc.internal.pageSize.getHeight();
            const margin = 8;
            const imgW = pw - margin * 2;
            const imgH = (canvas.height * imgW) / canvas.width;

            let remaining = imgH;
            let position = 0;
            const img = canvas.toDataURL('image/jpeg', 0.94);

            // Uzun raporu sayfalara böl
            while (remaining > 0) {
                doc.addImage(img, 'JPEG', margin, margin - position, imgW, imgH);
                remaining -= (ph - margin * 2);
                if (remaining > 0) {
                    position += (ph - margin * 2);
                    doc.addPage();
                }
            }

            const safe = (studentName || 'Ogrenci').replace(/[^\wçğıöşüÇĞİÖŞÜ ]/g, '').trim().replace(/\s+/g, '_');
            doc.save(`${safe}_${report.title.replace(/[^\wçğıöşüÇĞİÖŞÜ]/g, '_')}.pdf`);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Aksiyon çubuğu */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-ink-2 text-xs font-bold">
                    <ClipboardList size={14} /> Envanter Raporu
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={downloadPDF}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white text-xs font-black hover:bg-brand-hover disabled:opacity-50 transition"
                    >
                        {busy ? <Printer size={13} className="animate-pulse" /> : <Download size={13} />}
                        {busy ? 'Hazırlanıyor...' : 'PDF İndir'}
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="p-2 rounded-xl text-ink-3 hover:bg-surface-3 transition">
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Yazdırılabilir rapor gövdesi */}
            <div ref={printRef} className="bg-surface rounded-2xl border border-line overflow-hidden" style={{ width: '100%' }}>

                {/* Başlık bandı */}
                <div
                    className="px-6 py-5 text-ink"
                    style={{ background: 'linear-gradient(115deg, #4338CA 0%, #6D28D9 50%, #A21CAF 100%)' }}
                >
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] opacity-70">
                        Rehberlik Servisi · Envanter Sonuç Raporu
                    </p>
                    <h1 className="text-xl font-black mt-1">{report.title}</h1>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-[11px] opacity-85">
                        {report.student && <span><strong>Öğrenci:</strong> {report.student}</span>}
                        {report.className && <span><strong>Sınıf:</strong> {report.className}</span>}
                        <span><strong>Tarih:</strong> {new Date(report.completedAt).toLocaleDateString('tr-TR')}</span>
                        <span><strong>Yanıtlanan:</strong> {report.answeredCount}/{report.questionCount}</span>
                    </div>
                    {report.source && (
                        <p className="text-[10px] opacity-60 mt-1.5">Kaynak: {report.source}</p>
                    )}
                </div>

                <div className="p-6 space-y-5">

                    {/* Genel düzey */}
                    {report.total && (
                        <div
                            className="rounded-2xl p-4 flex items-center gap-4"
                            style={{ backgroundColor: `${report.total.color}12`, border: `1.5px solid ${report.total.color}40` }}
                        >
                            <div
                                className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0"
                                style={{ backgroundColor: `${report.total.color}20` }}
                            >
                                <span className="text-xl font-black leading-none" style={{ color: report.total.color }}>
                                    %{report.total.percent}
                                </span>
                            </div>
                            <div>
                                <p className="font-black text-sm" style={{ color: report.total.color }}>
                                    {report.total.bandLabel}
                                </p>
                                <p className="text-xs text-ink-2 leading-relaxed mt-0.5">
                                    Ham puan {report.total.raw} / {report.total.max}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Alt boyutlar */}
                    {report.subscales.length > 0 && (
                        <div>
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-ink-3 mb-2.5">
                                Alt Boyutlar
                            </h3>
                            <div className="space-y-2">
                                {report.subscales.map((s) => (
                                    <div key={s.key} className="flex items-center gap-3">
                                        <span className="w-40 shrink-0 text-[11px] font-bold text-ink-2 truncate">
                                            {s.label}
                                        </span>
                                        <div className="flex-1 h-2.5 rounded-full bg-surface-3 overflow-hidden">
                                            <div
                                                className="h-full rounded-full"
                                                style={{ width: `${s.percent}%`, backgroundColor: s.color }}
                                            />
                                        </div>
                                        <span className="w-10 text-right text-[11px] font-black tabular-nums" style={{ color: s.color }}>
                                            %{s.percent}
                                        </span>
                                        <span
                                            className="w-32 text-[10px] font-bold truncate"
                                            style={{ color: s.color }}
                                        >
                                            {s.bandLabel}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Yorum */}
                    <div className="rounded-2xl bg-surface-2 border border-line p-4">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-ink-3 mb-1.5 flex items-center gap-1.5">
                            <FileText size={12} /> Değerlendirme
                        </h3>
                        <p className="text-xs text-ink-2 leading-relaxed">{report.interpretation}</p>
                    </div>

                    {/* Dikkat çeken maddeler */}
                    {report.highlights.length > 0 && (
                        <div>
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-ink-3 mb-2 flex items-center gap-1.5">
                                <AlertTriangle size={12} /> Dikkat Çeken Maddeler
                            </h3>
                            <div className="space-y-1">
                                {report.highlights.map((h, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs">
                                        <span className="text-warn shrink-0">▸</span>
                                        <span className="text-ink-2">{h.text}</span>
                                        <span className="ml-auto text-[10px] text-ink-3 shrink-0">{h.category}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Açık uçlu yanıtlar */}
                    {report.openAnswers.length > 0 && (
                        <div>
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-ink-3 mb-2">
                                Yanıtlar
                            </h3>
                            <div className="space-y-2.5">
                                {report.openAnswers.map((a, i) => (
                                    <div key={i} className="rounded-xl bg-surface-2 border border-line p-3">
                                        <p className="text-[11px] font-bold text-ink-2 mb-1">{a.question}</p>
                                        <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap">{a.answer}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Öneriler */}
                    <div className="rounded-2xl bg-ok-soft border border-ok p-4">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-ok mb-2 flex items-center gap-1.5">
                            <Lightbulb size={12} /> Önerilen Müdahaleler
                        </h3>
                        <ul className="space-y-1.5">
                            {report.recommendations.map((r, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-ok">
                                    <CheckCircle2 size={13} className="text-ok shrink-0 mt-0.5" />
                                    {r}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Alt bilgi */}
                    <div className="pt-3 border-t border-line flex justify-between text-[9px] text-ink-3 font-bold uppercase tracking-widest">
                        <span>Rehberlik Servisi</span>
                        <span>{new Date(report.completedAt).toLocaleString('tr-TR')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestResultReport;
