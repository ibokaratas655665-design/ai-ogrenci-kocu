/**
 * 📁 ÖĞRENCİ PORTFÖLYİ (Madde 9)
 * Rozetler + deneme gelişimi + tamamlanan görevler → paylaşılabilir PDF & görünüm
 */
import React, { useState } from 'react';
import { BADGES } from '../gamification/BadgeSystem';
import { Star, TrendingUp, ClipboardList, Award, Download, Share2, Brain, Target, Zap, BookOpen, Medal } from 'lucide-react';
import { AMBLEM_BASE64 } from '../../data/amblemBase64';
import { bildir } from '../../services/uiGeriBildirim';

const BADGE_EMOJI_MAP = {
    'fire': '🔥', 'star': '⭐', 'brain': '🧠', 'trophy': '🏆', 'rocket': '🚀',
    'diamond': '💎', 'crown': '👑', 'lightning': '⚡', 'book': '📚', 'target': '🎯'
};

const StudentPortfolio = ({ student, examResults = [], tasks = [], gamStats = {} }) => {
    const [activeSection, setActiveSection] = useState('overview');
    const [sharing, setSharing] = useState(false);

    const completedTasks = tasks.filter(t => t.completed || t.status === 'Tamamlandı');
    /**
     * ROZETLER — ALAN ADI KÖPRÜSÜ.
     *
     * Ölçüldü: oyunlaştırma bağlamı kazanılan rozetleri
     * earnedBadgeIds (kimlik listesi) olarak tutuyor; burası ise
     * hiç var olmamış bir "badges" alanını okuyordu. Sonuç: 12 rozet
     * kazanılmışken portfolyo ve PDF hep "0 Rozet" gösteriyordu.
     * Kimlikler BadgeSystem kataloğundan ada/ikona çözülür.
     */
    const badges = (gamStats?.earnedBadgeIds || [])
        .map((id) => BADGES.find((x) => x.id === id))
        .filter(Boolean);
    const xp = gamStats?.totalXP || 0;
    const streak = gamStats?.currentStreak || 0;

    const level = xp < 100 ? 'Başlangıç' : xp < 500 ? 'Gelişen' : xp < 1000 ? 'İleri' : xp < 2000 ? 'Uzman' : 'Efsane';
    // Seviye degradeleri paletten gelir; sabit -400 tonlari uzerlerindeki
    // yaziyi 1.6:1'e dusuruyordu.
    const levelColor = xp < 100 ? 'from-ink-3 to-ink-2' : xp < 500 ? 'from-ok to-accent' :
        xp < 1000 ? 'from-info to-brand' : xp < 2000 ? 'from-c4 to-c5' : 'from-warn to-c3';

    const sortedExams = [...examResults].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
    const firstNet = sortedExams[0]?.totalNet;
    const lastNet = sortedExams[sortedExams.length - 1]?.totalNet;
    const netGrowth = firstNet && lastNet ? (lastNet - firstNet).toFixed(1) : null;

    const handleExportPDF = async () => {
        setSharing(true);
        try {
            const { default: jsPDF } = await import('jspdf');
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            // Başlık
            doc.setFillColor(79, 70, 229);
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('Öğrenci Portfolyosu', 15, 22);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(student?.name || 'Öğrenci', 15, 32);

            // Sağ üstte marka amblemi — koçluk çıktısı, resmî evrak değil
            doc.setFillColor(255, 255, 255);
            doc.circle(188, 16, 8, 'F');
            try { doc.addImage(AMBLEM_BASE64, 'PNG', 182, 10, 12, 12); } catch { /* amblemsiz de basılır */ }
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text('Basari Kampi Kocluk Platformu', 188, 30, { align: 'center' });
            doc.setFont('helvetica', 'normal');

            // Temel Bilgiler
            doc.setTextColor(30, 30, 30);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Genel Bakış', 15, 55);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.text(`XP Puanı: ${xp}  |  Seviye: ${level}  |  Seri: ${streak} gün`, 15, 65);
            doc.text(`Tamamlanan Görevler: ${completedTasks.length}  |  Kazanılan Rozet: ${badges.length}`, 15, 73);

            // Deneme Sonuçları
            if (sortedExams.length > 0) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text('Deneme Sonuçları', 15, 90);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                sortedExams.slice(-5).forEach((r, i) => {
                    doc.text(`${r.name || `Deneme ${i + 1}`}: ${parseFloat(r.totalNet || 0).toFixed(1)} net`, 15, 100 + i * 8);
                });
                if (netGrowth) {
                    doc.setTextColor(netGrowth > 0 ? 5 : 200, netGrowth > 0 ? 150 : 50, netGrowth > 0 ? 80 : 50);
                    doc.text(`Net Gelişim: ${netGrowth > 0 ? '+' : ''}${netGrowth}`, 15, 145);
                    doc.setTextColor(30, 30, 30);
                }
            }

            // Rozetler
            if (badges.length > 0) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text('Kazanılan Rozetler', 15, 160);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                badges.slice(0, 8).forEach((b, i) => {
                    const col = i % 2, row = Math.floor(i / 2);
                    doc.text(`• ${b.name || b.title || 'Rozet'}`, 15 + col * 90, 170 + row * 8);
                });
            }

            // Footer
            doc.setFillColor(245, 245, 255);
            doc.rect(0, 270, 210, 27, 'F');
            doc.setFontSize(9);
            doc.setTextColor(120, 120, 140);
            doc.text('Bu portfolyo Başarı Kampı tarafından oluşturulmuştur.', 15, 281);
            doc.text(new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }), 15, 289);

            doc.save(`${student?.name || 'portfolyo'}-portfolyo.pdf`);
        } catch (e) {
            console.error('PDF hatası:', e);
            bildir('PDF oluşturulamadı. jsPDF yüklü olduğundan emin olun.');
        }
        setSharing(false);
    };

    const sections = [
        { id: 'overview', label: '🏠 Genel', icon: Star },
        { id: 'exams', label: '📊 Denemeler', icon: TrendingUp },
        { id: 'badges', label: '🏅 Rozetler', icon: Award },
        { id: 'tasks', label: '✅ Görevler', icon: ClipboardList },
    ];

    return (
        <div className="space-y-5">
            {/* Header Kart */}
            <div className={`on-color bg-gradient-to-br ${levelColor} rounded-3xl p-6 shadow-e3`}>
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-ink-2 text-sm font-bold uppercase tracking-widest mb-1">Öğrenci Portfolyosu</p>
                        <h2 className="text-2xl font-black">{student?.name || 'Öğrenci'}</h2>
                        <p className="text-ink-2 text-sm">{student?.grade}{student?.section ? `/${student.section}` : ''}</p>
                    </div>
                    <div className="text-right">
                        <div className="bg-surface/20 rounded-2xl px-4 py-2">
                            <p className="text-3xl font-black">{level}</p>
                            <p className="text-xs text-ink-2">{xp} XP</p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="bg-surface/15 rounded-2xl p-3 text-center">
                        <p className="text-2xl font-black">🔥{streak}</p>
                        <p className="text-xs text-ink-2">Gün Serisi</p>
                    </div>
                    <div className="bg-surface/15 rounded-2xl p-3 text-center">
                        <p className="text-2xl font-black">{badges.length}</p>
                        <p className="text-xs text-ink-2">Rozet</p>
                    </div>
                    <div className="bg-surface/15 rounded-2xl p-3 text-center">
                        <p className="text-2xl font-black">{completedTasks.length}</p>
                        <p className="text-xs text-ink-2">Görev Bitti</p>
                    </div>
                </div>
            </div>

            {/* Eylem Butonları */}
            <div className="flex gap-2">
                <button
                    onClick={handleExportPDF}
                    disabled={sharing}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand text-white rounded-2xl font-bold text-sm hover:bg-brand-hover transition shadow-md shadow-indigo-200 disabled:opacity-70"
                >
                    {sharing ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={16} />}
                    PDF Portfolyo
                </button>
                <button
                    onClick={() => {
                        const url = window.location.href;
                        navigator.clipboard?.writeText(url);
                        bildir('Portfolyo linki kopyalandı!');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-surface border-2 border-brand-line text-brand rounded-2xl font-bold text-sm hover:bg-brand-soft transition"
                >
                    <Share2 size={16} /> Paylaş
                </button>
            </div>

            {/* Sekmeler */}
            <div className="flex gap-1 bg-surface-3 p-1 rounded-2xl overflow-x-auto">
                {sections.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setActiveSection(s.id)}
                        className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition ${activeSection === s.id ? 'bg-surface text-brand shadow' : 'text-ink-2 hover:text-ink-2'}`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Genel Bakış */}
            {activeSection === 'overview' && (
                <div className="space-y-3">
                    {netGrowth && (
                        <div className={`rounded-2xl p-4 flex items-center gap-4 ${parseFloat(netGrowth) > 0 ? 'bg-ok-soft border border-ok' : 'bg-danger-soft border border-danger'}`}>
                            <TrendingUp size={24} className={parseFloat(netGrowth) > 0 ? 'text-ok' : 'text-danger'} />
                            <div>
                                <p className="font-black text-ink">Net Gelişim</p>
                                <p className={`text-2xl font-black ${parseFloat(netGrowth) > 0 ? 'text-ok' : 'text-danger'}`}>
                                    {parseFloat(netGrowth) > 0 ? '+' : ''}{netGrowth}
                                </p>
                                <p className="text-xs text-ink-2">{firstNet?.toFixed(1)} → {lastNet?.toFixed(1)} net</p>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-surface border border-line rounded-2xl p-4 shadow-sm">
                            <BookOpen size={18} className="text-brand mb-2" />
                            <p className="text-2xl font-black text-ink">{sortedExams.length}</p>
                            <p className="text-xs text-ink-2">Deneme Yapıldı</p>
                        </div>
                        <div className="bg-surface border border-line rounded-2xl p-4 shadow-sm">
                            <Target size={18} className="text-ok mb-2" />
                            <p className="text-2xl font-black text-ink">{tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%</p>
                            <p className="text-xs text-ink-2">Görev Başarısı</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Denemeler */}
            {activeSection === 'exams' && (
                <div className="space-y-2">
                    {sortedExams.length === 0 ? (
                        <div className="text-center py-10 text-ink-3">
                            <TrendingUp size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Henüz deneme kaydı yok</p>
                        </div>
                    ) : (
                        sortedExams.map((r, i) => {
                            const prev = sortedExams[i - 1];
                            const delta = prev ? (r.totalNet - prev.totalNet).toFixed(1) : null;
                            return (
                                <div key={i} className="bg-surface border border-line rounded-2xl p-4 flex items-center justify-between shadow-sm">
                                    <div>
                                        <p className="font-bold text-ink text-sm">{r.name || `Deneme ${i + 1}`}</p>
                                        {r.date && <p className="text-xs text-ink-3">{new Date(r.date).toLocaleDateString('tr-TR')}</p>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {delta && (
                                            <span className={`text-xs font-bold ${parseFloat(delta) > 0 ? 'text-ok' : 'text-danger'}`}>
                                                {parseFloat(delta) > 0 ? '+' : ''}{delta}
                                            </span>
                                        )}
                                        <span className="font-black text-brand text-xl">{parseFloat(r.totalNet || 0).toFixed(1)}</span>
                                        <span className="text-xs text-ink-3">net</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Rozetler */}
            {activeSection === 'badges' && (
                <div className="grid grid-cols-3 gap-3">
                    {badges.length === 0 ? (
                        <div className="col-span-3 text-center py-10 text-ink-3">
                            <Medal size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Henüz rozet kazanılmadı</p>
                        </div>
                    ) : (
                        badges.map((b, i) => (
                            <div key={i} className="bg-surface border border-warn rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition">
                                <div className="text-3xl mb-2">{BADGE_EMOJI_MAP[b.icon] || '🏅'}</div>
                                <p className="text-xs font-black text-ink leading-tight">{b.name || b.title || 'Rozet'}</p>
                                {b.earnedAt && <p className="text-[10px] text-ink-3 mt-1">{new Date(b.earnedAt).toLocaleDateString('tr-TR')}</p>}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Tamamlanan Görevler */}
            {activeSection === 'tasks' && (
                <div className="space-y-2">
                    {completedTasks.length === 0 ? (
                        <div className="text-center py-10 text-ink-3">
                            <ClipboardList size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Tamamlanan görev yok</p>
                        </div>
                    ) : (
                        completedTasks.slice(-10).reverse().map((t, i) => (
                            <div key={i} className="flex items-center gap-3 bg-surface border border-ok rounded-2xl px-4 py-3 shadow-sm">
                                <div className="w-8 h-8 rounded-xl bg-ok-soft flex items-center justify-center flex-shrink-0">
                                    <span className="text-ok">✓</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-ink text-sm truncate">{t.title || t.text || 'Görev'}</p>
                                    {t.completedAt && <p className="text-xs text-ink-3">{new Date(t.completedAt).toLocaleDateString('tr-TR')}</p>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentPortfolio;
