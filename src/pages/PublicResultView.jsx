import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Brain, Download, Share2, CheckCircle, ShieldCheck, Home } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { savePDF } from '../utils/pdfSave';

const PublicResultView = () => {
    const { shareData } = useParams();
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        try {
            // Veriyi çöz (Base64 + JSON)
            const decoded = JSON.parse(atob(shareData));
            setResult(decoded);
        } catch (err) {
            console.error('Veri çözme hatası:', err);
            setError('Geçersiz paylaşım bağlantısı veya veri bozulmuş.');
        } finally {
            setLoading(false);
        }
    }, [shareData]);

    const downloadPDF = () => {
        if (!result) return;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const W = 210; const H = 297;
        const today = new Date(result.date || Date.now()).toLocaleDateString('tr-TR');
        const testName = result.testTitle || 'Rehberlik Envanteri';
        const studentName = result.studentName || 'Öğrenci';

        // Arka plan
        pdf.setFillColor(248, 250, 255);
        pdf.rect(0, 0, W, H, 'F');

        // Header
        pdf.setFillColor(30, 58, 138);
        pdf.rect(0, 0, W, 58, 'F');

        pdf.setFontSize(24); pdf.setTextColor(255, 255, 255); pdf.setFont('helvetica', 'bold');
        pdf.text('REHBERLIK ANALIZ RAPORU', 15, 28);

        pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(191, 219, 254);
        pdf.text('AI OGRENCI KOCU | DOĞRULANMIŞ PAYLAŞIM LİNKİ', 15, 38);

        // Score Panel
        pdf.setFillColor(255, 255, 255); pdf.setDrawColor(226, 232, 240);
        pdf.roundedRect(12, 68, W - 24, 50, 4, 4, 'FD');

        pdf.setTextColor(30, 58, 138); pdf.setFontSize(14); pdf.setFont('helvetica', 'bold');
        pdf.text(`SONUC: ${result.level || 'Tamamlandı'}`, 22, 95);

        // Body
        pdf.setTextColor(51, 65, 85); pdf.setFontSize(11);
        const comment = result.comment || 'Test başarıyla tamamlanmıştır.';
        const splitText = pdf.splitTextToSize(comment, W - 40);
        pdf.text(splitText, 20, 130);

        // Footer
        pdf.setFillColor(30, 58, 138); pdf.rect(0, H - 15, W, 15, 'F');
        pdf.setFontSize(8); pdf.setTextColor(255, 255, 255);
        pdf.text('BU BELGE DOĞRULANMIŞ BİR ANALİZ RAPORUDUR.', W / 2, H - 7, { align: 'center' });

        savePDF(pdf, `${studentName}_Analiz_Raporu`);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-surface-2">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-surface-2 p-4 font-sans">
            <div className="max-w-md w-full bg-surface rounded-3xl shadow-2xl p-8 text-center">
                <div className="w-16 h-16 bg-danger-soft rounded-full flex items-center justify-center mx-auto mb-4">
                    <Share2 className="text-danger" size={32} />
                </div>
                <h1 className="text-2xl font-black text-ink mb-2">Hata!</h1>
                <p className="text-ink-2 mb-6">{error}</p>
                <button onClick={() => navigate('/')} className="w-full py-3 bg-surface-inv text-white rounded-xl font-bold flex items-center justify-center gap-2">
                    <Home size={18} /> Ana Sayfaya Dön
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-surface-2 py-10 px-4 font-sans">
            <div className="max-w-2xl mx-auto">
                <div className="bg-surface rounded-[2.5rem] shadow-2xl overflow-hidden border border-line">
                    {/* Header */}
                    <div className="bg-brand p-8 sm:p-12 text-white relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-surface/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                        <div className="flex items-center gap-4 mb-6 relative z-10">
                            <div className="p-3 bg-surface/20 rounded-2xl backdrop-blur-md">
                                <Brain size={32} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black leading-tight uppercase tracking-tight">ANALİZ SONUÇ RAPORU</h1>
                                <p className="text-brand text-sm opacity-90">Doğrulanmış Rehberlik Belgesi</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 relative z-10">
                            <span className="px-3 py-1 bg-surface/20 rounded-full text-xs font-bold flex items-center gap-1">
                                <ShieldCheck size={14} /> Doğrulanmış
                            </span>
                            <span className="px-3 py-1 bg-surface/20 rounded-full text-xs font-bold flex items-center gap-1">
                                <CheckCircle size={14} /> Resmi Analiz
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 sm:p-12">
                        <div className="mb-10">
                            <h2 className="text-ink-3 text-xs font-black uppercase tracking-widest mb-2">ÖĞRENCİ BİLGİSİ</h2>
                            <p className="text-2xl font-black text-ink">{result.studentName}</p>
                            <p className="text-brand font-bold mt-1 uppercase tracking-tight">{result.testTitle}</p>
                        </div>

                        <div className="p-8 bg-brand-soft/50 rounded-3xl border border-brand-line mb-10">
                            <h2 className="text-brand/50 text-xs font-black uppercase tracking-widest mb-3">TEMEL SONUÇ</h2>
                            <div className="text-4xl font-black text-brand mb-4">{result.level || 'Tamamlandı'}</div>
                            <div className="h-1.5 w-full bg-brand-soft rounded-full overflow-hidden">
                                <div className="h-full bg-brand w-full animate-pulse"></div>
                            </div>
                        </div>

                        <div className="mb-10">
                            <h2 className="text-ink-3 text-xs font-black uppercase tracking-widest mb-4">UZMAN ANALİZİ VE YORUM</h2>
                            <div className="text-ink-2 leading-relaxed text-lg bg-surface-2 p-6 rounded-2xl border border-line italic">
                                "{result.comment || 'Test verileri uzman sistem tarafından analiz edilmiş ve güvenilir bulunmuştur. Bu rapor rehberlik süreçlerinde destekleyici belge olarak kullanılabilir.'}"
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-line">
                            <button onClick={downloadPDF} className="flex items-center justify-center gap-3 py-4 bg-brand text-white rounded-2xl font-black shadow-lg shadow-indigo-200 hover:scale-[1.02] transition active:scale-95">
                                <Download size={20} /> PDF OLARAK İNDİR
                            </button>
                            <button onClick={() => window.print()} className="flex items-center justify-center gap-3 py-4 bg-surface text-ink border-2 border-gray-900 rounded-2xl font-black hover:bg-surface-2 transition active:scale-95">
                                <Share2 size={20} /> YAZDIR / PAYLAŞ
                            </button>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-8 text-ink-3 text-xs font-bold uppercase tracking-widest">
                    AI ÖĞRENCİ KOÇU & PDR BİLGİ SİSTEMLERİ © 2026
                </div>
            </div>
        </div>
    );
};

export default PublicResultView;
