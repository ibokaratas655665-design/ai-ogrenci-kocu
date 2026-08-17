/**
 * 👨‍👩‍👧 VELİ PORTALI (Madde 6)
 * QR + 7 günlük özet portal — öğrenci son aktivitelerini, deneme sonuçlarını ve görevlerini gösterir
 */
import React, { useEffect, useRef, useState } from 'react';
import { QrCode, Download, X, Share2, BarChart2, ClipboardList, Brain, TrendingUp, Trophy, Calendar, ExternalLink } from 'lucide-react';
import { tasksFor } from '../../services/taskStore';
import wa from '../../services/whatsappService';

// ─── Veli Portal İçerik Sayfası (QR ile açılan) ────────────────
export const ParentPortalPage = ({ studentId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            try {
                const results = JSON.parse(localStorage.getItem('v2_results_data') || '[]')
                    .filter(r => r.studentId === studentId || String(r.studentId) === String(studentId));
                // student_tasks NESNE biçiminde tutulur — dizi sanıp filter
                // çağırmak veli portalinde gorevleri hep bos gosteriyordu.
                const tasks = tasksFor(studentId);
                const gamStats = JSON.parse(localStorage.getItem(`gamification_stats_${studentId}`) || '{}');
                const pomLogs = JSON.parse(localStorage.getItem(`pomodoro_log_${studentId}`) || '[]');

                const last7 = (arr) => arr.filter(i => {
                    const d = i.date || i.createdAt || i.startedAt || i.completedAt;
                    return d && (Date.now() - new Date(d).getTime()) < 7 * 24 * 3600 * 1000;
                });

                const recentResults = last7(results).slice(-3);
                const recentTasks = last7(tasks);
                const recentPomodoro = last7(pomLogs);

                const studyMinutes = recentPomodoro.reduce((s, l) => s + (l.minutes || 25), 0);
                const completedTasks = recentTasks.filter(t => t.completed || t.status === 'Tamamlandı').length;

                setData({
                    results: recentResults,
                    tasks: recentTasks,
                    gamStats,
                    studyMinutes,
                    completedTasks,
                    totalTasks: recentTasks.length,
                });
            } catch { }
            setLoading(false);
        }, 500);
    }, [studentId]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <span className="w-8 h-8 border-3 border-brand-line border-t-indigo-600 rounded-full animate-spin" />
        </div>
    );

    const lastResult = data?.results?.[data.results.length - 1];
    const prevResult = data?.results?.[data.results.length - 2];
    const netChange = lastResult && prevResult ? (lastResult.totalNet - prevResult.totalNet).toFixed(1) : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-violet-50 p-4 font-sans">
            <div className="max-w-sm mx-auto space-y-4">
                {/* Header */}
                <div className="on-color bg-gradient-to-r from-brand to-violet-600 rounded-3xl p-5 text-white text-center shadow-lg">
                    <div className="w-14 h-14 bg-surface/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Brain size={28} className="text-ink" />
                    </div>
                    <h1 className="text-xl font-black">Veli Portalı</h1>
                    <p className="text-ink-2 text-sm mt-1">Son 7 Günlük Özet</p>
                </div>

                {/* KPI Kartları */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface rounded-2xl p-4 shadow-sm border border-brand-line">
                        <div className="flex items-center gap-2 mb-2">
                            <Brain size={16} className="text-brand" />
                            <span className="text-xs font-bold text-brand">Çalışma Süresi</span>
                        </div>
                        <p className="text-3xl font-black text-ink">{data?.studyMinutes || 0}</p>
                        <p className="text-xs text-ink-3">dakika</p>
                    </div>
                    <div className="bg-surface rounded-2xl p-4 shadow-sm border border-ok">
                        <div className="flex items-center gap-2 mb-2">
                            <ClipboardList size={16} className="text-ok" />
                            <span className="text-xs font-bold text-ok">Görevler</span>
                        </div>
                        <p className="text-3xl font-black text-ink">{data?.completedTasks || 0}/{data?.totalTasks || 0}</p>
                        <p className="text-xs text-ink-3">tamamlandı</p>
                    </div>
                    <div className="bg-surface rounded-2xl p-4 shadow-sm border border-warn">
                        <div className="flex items-center gap-2 mb-2">
                            <Trophy size={16} className="text-warn" />
                            <span className="text-xs font-bold text-warn">XP Puanı</span>
                        </div>
                        <p className="text-3xl font-black text-ink">{data?.gamStats?.totalXP || 0}</p>
                        <p className="text-xs text-ink-3">toplam XP</p>
                    </div>
                    <div className={`bg-surface rounded-2xl p-4 shadow-sm border ${netChange >= 0 ? 'border-ok' : 'border-danger'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp size={16} className={netChange >= 0 ? 'text-ok' : 'text-danger'} />
                            <span className="text-xs font-bold text-ink-2">Son Deneme</span>
                        </div>
                        <p className={`text-3xl font-black ${netChange >= 0 ? 'text-ok' : 'text-danger'}`}>
                            {lastResult ? `${lastResult.totalNet?.toFixed(1)}` : '-'}
                        </p>
                        <p className="text-xs text-ink-3">{netChange ? `${netChange > 0 ? '+' : ''}${netChange} net` : 'net'}</p>
                    </div>
                </div>

                {/* Son Denemeler */}
                {data?.results?.length > 0 && (
                    <div className="bg-surface rounded-2xl p-4 shadow-sm border border-line">
                        <h3 className="font-bold text-ink text-sm flex items-center gap-2 mb-3">
                            <BarChart2 size={16} className="text-brand" /> Son Denemeler
                        </h3>
                        <div className="space-y-2">
                            {data.results.map((r, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <span className="text-ink-2 truncate max-w-[160px]">{r.name || r.examName || `Deneme ${i + 1}`}</span>
                                    <span className="font-black text-brand">{parseFloat(r.totalNet || 0).toFixed(1)} net</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Çalışma Serisi */}
                {(data?.gamStats?.currentStreak > 0) && (
                    <div className="on-color bg-gradient-to-r from-orange-400 to-red-400 rounded-2xl p-4 text-ink text-center">
                        <p className="text-5xl font-black">🔥 {data.gamStats.currentStreak}</p>
                        <p className="font-bold mt-1">Günlük Seri</p>
                        <p className="text-ink-2 text-xs">{data.gamStats.currentStreak} gün üst üste çalışma</p>
                    </div>
                )}

                <div className="text-center text-xs text-ink-3 pb-6">
                    Bu sayfa AI Öğrenci Koçu tarafından oluşturulmuştur.<br />
                    Veriler yalnızca öğrencinin cihazından okunmaktadır.
                </div>
            </div>
        </div>
    );
};

// ─── Gelişmiş QR Modal ───────────────────────────────────────────
const EnhancedParentQRModal = ({ student, onClose }) => {
    const canvasRef = useRef(null);
    const [qrReady, setQrReady] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState('qr'); // 'qr' | 'summary'

    /**
     * Bağlantı eskiden `#/parent-report/{öğrenci-no}?token=…` idi ve
     * `token` değeri `btoa("student:5:zaman")` — yani öğrenci numarasının
     * base64'ü. Ne tahmin edilemezdi ne de rota onu okuyordu; adresteki
     * numarayı değiştiren başka öğrencinin raporunu açabiliyordu.
     * Artık gerçek rastgele belirteç kullanılıyor.
     */
    const shareUrl = React.useMemo(
        () => wa.buildParentPortalLink(student?.id),
        [student?.id]
    );

    // 7 günlük özet verileri
    const results = (() => {
        try { return JSON.parse(localStorage.getItem('v2_results_data') || '[]').filter(r => r.studentId === student?.id); } catch { return []; }
    })();
    const tasks = (() => {
        try { return tasksFor(student?.id); } catch { return []; }
    })();
    const gamStats = (() => {
        try { return JSON.parse(localStorage.getItem(`gamification_stats_${student?.id}`) || '{}'); } catch { return {}; }
    })();
    const pomLogs = (() => {
        try { return JSON.parse(localStorage.getItem(`pomodoro_log_${student?.id}`) || '[]'); } catch { return []; }
    })();

    const last7 = (arr, dateKey = 'date') => arr.filter(i => {
        const d = i[dateKey] || i.createdAt || i.startedAt;
        return d && (Date.now() - new Date(d).getTime()) < 7 * 24 * 3600 * 1000;
    });

    const weekStudy = last7(pomLogs, 'startedAt').reduce((s, l) => s + (l.minutes || 25), 0);
    const weekTasks = last7(tasks, 'createdAt');
    const doneWeekTasks = weekTasks.filter(t => t.completed || t.status === 'Tamamlandı').length;
    const lastResult = results[results.length - 1];

    useEffect(() => {
        if (!student || activeTab !== 'qr') return;
        (async () => {
            try {
                const QRCode = (await import('qrcode')).default;
                if (canvasRef.current) {
                    await QRCode.toCanvas(canvasRef.current, shareUrl, {
                        width: 220, margin: 2,
                        color: { dark: '#312e81', light: '#ffffff' },
                    });
                    setQrReady(true);
                }
            } catch { setQrReady(false); }
        })();
    }, [student, activeTab, shareUrl]);

    const downloadQR = () => {
        if (!canvasRef.current) return;
        const a = document.createElement('a');
        a.download = `${student?.name || 'ogrenci'}-veli-qr.png`;
        a.href = canvasRef.current.toDataURL('image/png');
        a.click();
    };

    const copyLink = () => {
        navigator.clipboard?.writeText(shareUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="fixed inset-0 z-modal-base bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface rounded-3xl shadow-2xl max-w-sm w-full relative animate-scale-in overflow-hidden">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl text-ink-3 hover:text-ink-2 hover:bg-surface-3 transition z-10">
                    <X size={18} />
                </button>

                {/* Header */}
                <div className="on-color bg-gradient-to-r from-brand to-violet-600 p-5 text-center text-white">
                    <div className="w-12 h-12 bg-surface/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
                        <QrCode size={24} className="text-ink" />
                    </div>
                    <h2 className="text-lg font-black">Veli Portalı</h2>
                    <p className="text-ink-2 text-xs mt-1">📋 {student?.name}</p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-line">
                    {[['qr', '📲 QR Kod'], ['summary', '📊 7 Günlük Özet']].map(([tab, label]) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 text-sm font-bold transition ${activeTab === tab ? 'border-b-2 border-indigo-600 text-brand' : 'text-ink-2 hover:text-ink-2'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* QR Tab */}
                {activeTab === 'qr' && (
                    <div className="p-5 text-center space-y-4">
                        <p className="text-xs text-ink-2">Bu QR kodu veli ile paylaşın. Telefonuyla tarayarak öğrenci karnesini görüntüleyebilir.</p>
                        <div className="flex justify-center">
                            {qrReady ? (
                                <canvas ref={canvasRef} className="rounded-2xl shadow-sm border border-brand-line" />
                            ) : (
                                <div className="w-56 h-56 bg-brand-soft rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-brand-line">
                                    <QrCode size={48} className="text-brand mb-2" />
                                    <p className="text-xs text-ink-2 text-center px-4">QR yükleniyor...<br />
                                        <code className="font-mono text-brand text-[10px]">npm install qrcode</code><br />
                                        gerekebilir.
                                    </p>
                                    <canvas ref={canvasRef} className="hidden" />
                                </div>
                            )}
                        </div>
                        <div className="bg-surface-2 rounded-xl p-3">
                            <p className="text-[10px] text-ink-2 font-bold uppercase mb-1">Paylaşım Linki</p>
                            <p className="text-xs text-brand font-mono break-all">{shareUrl.substring(0, 55)}...</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={copyLink} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-brand-line rounded-xl text-brand font-bold text-sm hover:bg-brand-soft transition">
                                <Share2 size={14} /> {copied ? '✓ Kopyalandı!' : 'Linki Kopyala'}
                            </button>
                            {qrReady && (
                                <button onClick={downloadQR} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand text-white rounded-xl font-bold text-sm hover:bg-brand-hover transition">
                                    <Download size={14} /> QR İndir
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Summary Tab */}
                {activeTab === 'summary' && (
                    <div className="p-5 space-y-3">
                        <p className="text-xs text-ink-2 text-center">Son 7 günlük performans özeti</p>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-brand-soft rounded-2xl p-3 text-center">
                                <p className="text-2xl font-black text-brand">{weekStudy}</p>
                                <p className="text-xs text-brand font-bold">dk çalışma</p>
                            </div>
                            <div className="bg-ok-soft rounded-2xl p-3 text-center">
                                <p className="text-2xl font-black text-ok">{doneWeekTasks}/{weekTasks.length}</p>
                                <p className="text-xs text-ok font-bold">görev tamam</p>
                            </div>
                            <div className="bg-warn-soft rounded-2xl p-3 text-center">
                                <p className="text-2xl font-black text-warn">{gamStats.totalXP || 0}</p>
                                <p className="text-xs text-warn font-bold">toplam XP</p>
                            </div>
                            <div className="bg-warn-soft rounded-2xl p-3 text-center">
                                <p className="text-2xl font-black text-warn">🔥{gamStats.currentStreak || 0}</p>
                                <p className="text-xs text-warn font-bold">gün serisi</p>
                            </div>
                        </div>
                        {lastResult && (
                            <div className="bg-surface-2 rounded-2xl p-3 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-ink-2">Son Deneme</p>
                                    <p className="text-sm text-ink-2">{lastResult.name || 'Deneme'}</p>
                                </div>
                                <p className="text-2xl font-black text-brand">{parseFloat(lastResult.totalNet || 0).toFixed(1)}<span className="text-sm text-ink-3"> net</span></p>
                            </div>
                        )}
                        <a
                            href={shareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-brand text-white rounded-xl font-bold text-sm hover:bg-brand-hover transition"
                        >
                            <ExternalLink size={14} /> Tam Veli Portalını Aç
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EnhancedParentQRModal;
