/**
 * 🤖 AI KONU ÖNERİLERİ
 * Zayıf konulara göre günlük çalışma önerisi üretir
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Zap, RefreshCw, ChevronRight, Target, Brain, Star, CheckCircle, BookOpen, Clock } from 'lucide-react';
import { yaz } from '../../services/veriDeposu';

const SUBJECT_TOPICS = {
    turkce: ['Paragraf Anlama', 'Sözcük Anlamı', 'Dil Bilgisi', 'Ses Bilgisi', 'Yazım Kuralları', 'Noktalama', 'Anlam İlişkileri', 'Sözcük Türleri', 'Cümle Bilgisi', 'Metin Türleri'],
    mat: ['Sayılar ve İşlemler', 'Kümeler', 'Mantık', 'Oran-Orantı', 'Yüzde Problemleri', 'Faiz', 'Olasılık', 'İstatistik', 'Fonksiyonlar', 'Polinomlar', 'Denklemler', 'Eşitsizlikler', 'Koordinat Geometri', 'Trigonometri', 'Logaritma'],
    fen: ['Kuvvet ve Hareket', 'Enerji', 'Dalgalar', 'Optik', 'Elektrik', 'Manyetizma', 'Newton Yasaları', 'Basit Makineler'],
    sosyal: ['Tarih Kronolojisi', 'Coğrafya Temelleri', 'Vatandaşlık', 'Felsefe Temelleri', 'Din Kültürü'],
    fizik: ['Kinematik', 'Dinamik', 'İş-Güç-Enerji', 'Momentum', 'Dalgalar', 'Optik Geometrisi', 'Elektrostatik', 'Elektrik Devreleri'],
    kimya: ['Atom Teorisi', 'Bağlar', 'Mol Kavramı', 'Denge', 'Asit-Baz', 'Elektrokimya', 'Organik Kimya'],
    biyoloji: ['Hücre', 'DNA ve Genetik', 'Sistemler', 'Ekoloji', 'Evrim', 'Biyoteknoloji'],
    edebiyat: ['Şiir Türleri', 'Roman Analizi', 'Hikaye', 'Divan Edebiyatı', 'Halk Edebiyatı', 'Cumhuriyet Edebiyatı'],
};

const STUDY_DURATIONS = ['25 dk', '45 dk', '60 dk', '90 dk'];
const PRIORITY_LABELS = { high: { label: 'Kritik', cls: 'bg-danger-soft text-danger' }, medium: { label: 'Önemli', cls: 'bg-warn-soft text-warn' }, low: { label: 'İyi', cls: 'bg-ok-soft text-ok' } };

const AITopicSuggestions = ({ examData = [], userId }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [completedIds, setCompletedIds] = useState(() => {
        try { return JSON.parse(localStorage.getItem(`completed_topics_${userId || 'student'}_${new Date().toDateString()}`) || '[]'); }
        catch { return []; }
    });
    const [lastGenerated, setLastGenerated] = useState(null);

    // Zayıf konuları bul
    const weakSubjects = useMemo(() => {
        if (!examData || examData.length === 0) return null;
        const recentExams = [...examData].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        const totals = {};
        const counts = {};

        recentExams.forEach(exam => {
            const fields = ['turkce', 'mat', 'fen', 'sosyal', 'fizik', 'kimya', 'biyoloji', 'edebiyat'];
            fields.forEach(f => {
                let val = 0;
                if (exam[f] != null && !isNaN(parseFloat(exam[f]))) val = parseFloat(exam[f]);
                else if (exam.subjects?.[f]) {
                    const sv = exam.subjects[f];
                    val = typeof sv === 'object' ? (parseFloat(sv.net) || 0) : (parseFloat(sv) || 0);
                }
                if (val > 0) { totals[f] = (totals[f] || 0) + val; counts[f] = (counts[f] || 0) + 1; }
            });
        });

        const maxNets = { turkce: 40, mat: 40, fen: 20, sosyal: 20, fizik: 14, kimya: 13, biyoloji: 13, edebiyat: 24 };
        return Object.keys(totals).map(key => ({
            key, avg: totals[key] / counts[key], max: maxNets[key] || 40,
            pct: ((totals[key] / counts[key]) / (maxNets[key] || 40)) * 100
        })).sort((a, b) => a.pct - b.pct);
    }, [examData]);

    const generateSuggestions = () => {
        setLoading(true);
        setTimeout(() => {
            const today = new Date();
            const seed = today.getDate() + today.getMonth() * 31;

            let generated = [];
            if (weakSubjects && weakSubjects.length > 0) {
                // Zayıf derslere göre öneri
                weakSubjects.slice(0, 4).forEach((subj, idx) => {
                    const topics = SUBJECT_TOPICS[subj.key] || SUBJECT_TOPICS.mat;
                    const topicIdx = (seed + idx * 3) % topics.length;
                    const priority = subj.pct < 40 ? 'high' : subj.pct < 65 ? 'medium' : 'low';
                    const SUBJ_LABELS = { turkce: 'Türkçe', mat: 'Matematik', fen: 'Fen', sosyal: 'Sosyal', fizik: 'Fizik', kimya: 'Kimya', biyoloji: 'Biyoloji', edebiyat: 'Edebiyat' };
                    generated.push({
                        id: `sug_${subj.key}_${idx}`,
                        subject: SUBJ_LABELS[subj.key] || subj.key,
                        topic: topics[topicIdx],
                        duration: STUDY_DURATIONS[(seed + idx) % STUDY_DURATIONS.length],
                        priority,
                        tip: subj.pct < 40
                            ? `Ortalama netiniz ${subj.avg.toFixed(1)} — acil takviye gerekiyor`
                            : `Ortalama netiniz ${subj.avg.toFixed(1)} — biraz daha çalışarak hedefine ulaşırsın`,
                        emoji: { turkce: '📖', mat: '🔢', fen: '🔬', sosyal: '🌍', fizik: '⚡', kimya: '🧪', biyoloji: '🧬', edebiyat: '📝' }[subj.key] || '📚',
                    });
                });
            } else {
                // Deneme verisi yoksa genel öneriler
                const defaults = ['Türkçe', 'Matematik', 'Fen', 'Sosyal'];
                defaults.forEach((subj, idx) => {
                    const key = ['turkce', 'mat', 'fen', 'sosyal'][idx];
                    const topics = SUBJECT_TOPICS[key] || [];
                    generated.push({
                        id: `default_${idx}`,
                        subject: subj, topic: topics[(seed + idx * 2) % topics.length] || 'Genel Tekrar',
                        duration: STUDY_DURATIONS[idx % 4], priority: 'medium',
                        tip: 'Düzenli çalışman seni hedefe taşır!',
                        emoji: ['📖', '🔢', '🔬', '🌍'][idx],
                    });
                });
            }

            setSuggestions(generated);
            setLastGenerated(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
            setLoading(false);
        }, 800);
    };

    useEffect(() => { generateSuggestions(); }, [weakSubjects]);

    const toggleComplete = (id) => {
        const updated = completedIds.includes(id) ? completedIds.filter(c => c !== id) : [...completedIds, id];
        setCompletedIds(updated);
        yaz(`completed_topics_${userId || 'student'}_${new Date().toDateString()}`, updated);
    };

    const completedCount = suggestions.filter(s => completedIds.includes(s.id)).length;
    const progressPct = suggestions.length > 0 ? Math.round((completedCount / suggestions.length) * 100) : 0;

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-xl font-black text-ink flex items-center gap-2">
                        <Brain size={22} className="text-c4" /> Günlük AI Konu Önerileri
                    </h2>
                    {lastGenerated && <p className="text-xs text-ink-3 mt-0.5">Son güncelleme: {lastGenerated}</p>}
                </div>
                <button
                    onClick={generateSuggestions}
                    disabled={loading}
                    className="on-color flex items-center gap-2 text-sm bg-gradient-to-r from-purple-600 to-brand text-white px-4 py-2 rounded-xl font-bold hover:opacity-90 transition shadow-sm disabled:opacity-60"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Üretiliyor...' : 'Yenile'}
                </button>
            </div>

            {/* Günlük İlerleme */}
            {suggestions.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border border-brand-line">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-brand">Günlük İlerleme</p>
                        <p className="text-sm font-black text-brand">{completedCount}/{suggestions.length} tamamlandı</p>
                    </div>
                    <div className="w-full bg-brand-soft rounded-full h-2.5 overflow-hidden">
                        <div className="on-color h-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-yavas" style={{ width: `${progressPct}%` }} />
                    </div>
                    {progressPct === 100 && (
                        <p className="text-xs text-brand font-bold mt-2 flex items-center gap-1">
                            <Star size={12} className="text-warn" /> Harika! Bugünkü tüm konuları tamamladın! 🎉
                        </p>
                    )}
                </div>
            )}

            {/* Öneriler */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-surface rounded-2xl p-5 shadow-sm border border-line animate-pulse">
                            <div className="h-4 bg-surface-3 rounded w-3/4 mb-3" />
                            <div className="h-3 bg-surface-3 rounded w-1/2 mb-2" />
                            <div className="h-3 bg-surface-3 rounded w-2/3" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {suggestions.map(sug => {
                        const isDone = completedIds.includes(sug.id);
                        const pLabel = PRIORITY_LABELS[sug.priority];
                        return (
                            <div key={sug.id} className={`bg-surface rounded-2xl p-5 shadow-sm border transition-all duration-yavas ${isDone ? 'border-ok bg-ok-soft/30 opacity-70' : 'border-line hover:shadow-md hover:-translate-y-0.5'}`}>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${isDone ? 'bg-ok-soft' : 'bg-surface-2'}`}>
                                            {isDone ? '✅' : sug.emoji}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-ink-2 uppercase">{sug.subject}</p>
                                            <p className={`font-black text-ink text-sm leading-tight ${isDone ? 'line-through text-ink-3' : ''}`}>{sug.topic}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleComplete(sug.id)}
                                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition ${isDone ? 'bg-ok text-ink' : 'bg-surface-3 text-ink-3 hover:bg-brand-soft hover:text-brand'}`}
                                    >
                                        <CheckCircle size={16} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${pLabel.cls}`}>{pLabel.label}</span>
                                    <span className="text-xs text-ink-2 flex items-center gap-1 bg-surface-3 px-2.5 py-1 rounded-full">
                                        <Clock size={10} /> {sug.duration}
                                    </span>
                                </div>
                                <p className="text-xs text-ink-2 mt-2 italic">{sug.tip}</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AITopicSuggestions;
