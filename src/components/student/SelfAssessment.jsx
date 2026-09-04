/**
 * 📝 ÖĞRENCİ ÖZ-DEĞERLENDİRME ARACI (Madde 2)
 * Haftalık öz-değerlendirme formu — koç görüntüleyebilir
 */
import React, { useState, useEffect } from 'react';
import { Star, Send, CheckCircle, TrendingUp, Brain, Heart, Zap, BarChart2, ChevronDown, ChevronUp } from 'lucide-react';
import { bildir } from '../../services/uiGeriBildirim';
import { listeOku, yaz } from '../../services/veriDeposu';

const QUESTIONS = [
    { id: 'motivation',  short: 'Motivasyon',     label: 'Bu hafta motivasyonumu nasıl değerlendiriyorum?', icon: Zap,       color: 'amber' },
    { id: 'study',       short: 'Planlı Çalışma', label: 'Planlı çalışmaya ne kadar bağlı kaldım?',         icon: Brain,     color: 'indigo' },
    { id: 'understand',  short: 'Kavrama',        label: 'Öğrendiklerimi ne kadar iyi kavradım?',            icon: TrendingUp,color: 'emerald' },
    { id: 'stress',      short: 'Stres',          label: 'Bu hafta stres seviyem (1=düşük, 5=yüksek)',       icon: Heart,     color: 'rose' },
    { id: 'confidence',  short: 'Özgüven',        label: 'Sınava olan özgüvenim nasıl?',                     icon: Star,      color: 'purple' },
];

const COLOR = {
    amber:   { bg: 'bg-warn-soft',   border: 'border-warn',  text: 'text-warn',   fill: 'bg-warn' },
    indigo:  { bg: 'bg-brand-soft',  border: 'border-brand-line', text: 'text-brand',  fill: 'bg-brand' },
    emerald: { bg: 'bg-ok-soft', border: 'border-ok',text: 'text-ok', fill: 'bg-ok' },
    rose:    { bg: 'bg-danger-soft',    border: 'border-danger',   text: 'text-danger',    fill: 'bg-danger' },
    purple:  { bg: 'bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))]',  border: 'border-[color-mix(in_srgb,var(--c4)_35%,transparent)]', text: 'text-c4',  fill: 'bg-c4' },
};

const WEEK_KEY = () => {
    const d = new Date();
    const week = Math.ceil(d.getDate() / 7);
    return `self_assessment_${d.getFullYear()}_${d.getMonth()}_w${week}`;
};

const StarRating = ({ value, onChange, color }) => {
    const [hover, setHover] = useState(0);
    const c = COLOR[color];
    return (
        <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map(n => (
                <button
                    key={n}
                    type="button"
                    onClick={() => onChange(n)}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all duration-hizli ${(hover || value) >= n
                        ? `${c.fill} text-ink border-transparent scale-110 shadow-sm`
                        : 'bg-surface border-line text-ink-3 hover:border-line-2'
                    }`}
                >
                    <span className="text-sm font-black">{n}</span>
                </button>
            ))}
        </div>
    );
};

// ─── Öğrenci: Form Görünümü ──────────────────────────────────────
export const SelfAssessmentForm = ({ userId, userName, onClose }) => {
    const [scores, setScores] = useState({ motivation: 0, study: 0, understand: 0, stress: 0, confidence: 0 });
    const [note, setNote] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [existing, setExisting] = useState(null);
    const [loading, setLoading] = useState(false);

    const key = WEEK_KEY();

    useEffect(() => {
        const saved = localStorage.getItem(`${key}_${userId}`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setExisting(parsed);
                setScores(parsed.scores || {});
                setNote(parsed.note || '');
                setSubmitted(true);
            } catch { }
        }
    }, [userId]);

    const handleSubmit = () => {
        if (Object.values(scores).some(v => v === 0)) {
            bildir('Lütfen tüm soruları puanlayın.', 'uyari');
            return;
        }
        setLoading(true);
        const data = { userId, userName, scores, note, submittedAt: new Date().toISOString(), week: key };
        yaz(`${key}_${userId}`, data);

        // Tüm öz-değerlendirmeler için koç indeksi
        const allKey = 'all_self_assessments';
        try {
            const all = listeOku(allKey);
            const filtered = all.filter(a => !(a.userId === userId && a.week === key));
            yaz(allKey, [...filtered, data]);
        } catch { }

        setTimeout(() => { setLoading(false); setSubmitted(true); setExisting(data); }, 500);
    };

    if (submitted && existing) {
        const avg = (Object.values(existing.scores).reduce((a, b) => a + b, 0) / 5).toFixed(1);
        return (
            <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-ok-soft rounded-2xl flex items-center justify-center mx-auto">
                    <CheckCircle size={32} className="text-ok" />
                </div>
                <h3 className="text-xl font-black text-ink">Bu Haftaki Değerlendirme</h3>
                <p className="text-sm text-ink-2">{new Date(existing.submittedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}</p>
                <div className="grid grid-cols-5 gap-2">
                    {QUESTIONS.map(q => {
                        const c = COLOR[q.color];
                        const v = existing.scores[q.id] || 0;
                        return (
                            <div key={q.id} className={`${c.bg} rounded-2xl p-3 text-center`}>
                                <p className={`text-2xl font-black ${c.text}`}>{v}</p>
                                <p className="text-[10px] text-ink-2 mt-0.5 leading-tight">{q.label.split(' ').slice(-2).join(' ')}</p>
                            </div>
                        );
                    })}
                </div>
                <div className="bg-brand-soft rounded-2xl p-4">
                    <p className="text-xs text-brand font-bold">Ortalama Puan</p>
                    <p className="text-4xl font-black text-brand">{avg}<span className="text-base text-brand">/5</span></p>
                </div>
                {existing.note && (
                    <div className="bg-surface-2 rounded-xl p-3 text-left">
                        <p className="text-xs font-bold text-ink-2 mb-1">Notunuz:</p>
                        <p className="text-sm text-ink-2">{existing.note}</p>
                    </div>
                )}
                <button
                    onClick={() => setSubmitted(false)}
                    className="text-xs text-brand hover:underline font-bold"
                >
                    Güncelle
                </button>
                {onClose && <button onClick={onClose} className="block w-full mt-2 py-3 bg-surface-3 text-ink-2 rounded-xl font-bold text-sm hover:bg-surface-3 transition">Kapat</button>}
            </div>
        );
    }

    return (
        <div className="p-6 space-y-5">
            <div className="text-center">
                <div className="w-14 h-14 bg-brand-soft rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <BarChart2 size={28} className="text-brand" />
                </div>
                <h3 className="text-xl font-black text-ink">Haftalık Öz-Değerlendirme</h3>
                <p className="text-xs text-ink-2 mt-1">Her soruyu 1-5 arasında puanlayın. Koçun bu sonuçları görebilir.</p>
            </div>

            {QUESTIONS.map(q => {
                const c = COLOR[q.color];
                const Icon = q.icon;
                return (
                    <div key={q.id} className={`${c.bg} border ${c.border} rounded-2xl p-4`}>
                        <div className="flex items-start gap-3 mb-3">
                            <div className={`w-8 h-8 rounded-xl bg-surface/60 flex items-center justify-center flex-shrink-0`}>
                                <Icon size={15} className={c.text} />
                            </div>
                            <p className="text-sm font-semibold text-ink leading-snug">{q.label}</p>
                        </div>
                        <StarRating
                            value={scores[q.id]}
                            onChange={(v) => setScores(prev => ({ ...prev, [q.id]: v }))}
                            color={q.color}
                        />
                    </div>
                );
            })}

            <div>
                <label className="text-xs font-bold text-ink-2 uppercase tracking-wider block mb-2">Bu Haftaki Notunuz (İsteğe Bağlı)</label>
                <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Bu hafta öğrendiğiniz, zorlandığınız veya başardığınız bir şeyi yazın..."
                    className="w-full p-3 bg-surface-2 border border-line rounded-xl text-sm resize-none focus:ring-2 focus:ring-indigo-400 outline-none"
                    rows={3}
                />
            </div>

            <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-60"
            >
                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={16} /> Değerlendirmeyi Gönder</>}
            </button>
        </div>
    );
};

// ─── Koç: Öz-Değerlendirme Sonuçları Görünümü ───────────────────
export const CoachSelfAssessmentView = ({ students }) => {
    const [expanded, setExpanded] = useState(null);
    const assessments = (() => {
        try { return listeOku('all_self_assessments'); } catch { return []; }
    })();

    const weekKey = WEEK_KEY();
    /* Kimliksiz kayıtlar (prop hatası döneminden kalan `undefined`
       kayıtları) sayaca ve listeye girmez — hangi öğrenciye ait olduğu
       bilinemeyen kayıt "tamamladı" sayılamaz. */
    const thisWeek = assessments.filter(a => a.week === weekKey && a.userId && a.userId !== 'undefined');

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-ink flex items-center gap-2">
                    <BarChart2 size={18} className="text-brand" />
                    Bu Haftaki Öz-Değerlendirmeler
                </h3>
                <span className="bg-brand-soft text-brand text-xs font-bold px-2.5 py-1 rounded-full">
                    {thisWeek.length}/{students.length} tamamladı
                </span>
            </div>

            {thisWeek.length === 0 ? (
                <div className="text-center py-10 text-ink-3">
                    <BarChart2 size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Bu hafta henüz değerlendirme yok</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {thisWeek.map((a, i) => {
                        const avg = (Object.values(a.scores).reduce((s, v) => s + v, 0) / 5).toFixed(1);
                        const isExp = expanded === i;
                        const avgNum = parseFloat(avg);
                        const avtColor = avgNum >= 4 ? 'text-ok' : avgNum >= 3 ? 'text-warn' : 'text-danger';
                        return (
                            <div key={i} className="bg-surface border border-line rounded-2xl overflow-hidden shadow-sm">
                                <div
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-2 transition"
                                    onClick={() => setExpanded(isExp ? null : i)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-brand-soft flex items-center justify-center font-black text-brand">
                                            {a.userName?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-ink text-sm">{a.userName || 'Öğrenci'}</p>
                                            <p className="text-xs text-ink-3">{new Date(a.submittedAt).toLocaleDateString('tr-TR')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-2xl font-black ${avtColor}`}>{avg}<span className="text-xs text-ink-3">/5</span></span>
                                        {isExp ? <ChevronUp size={16} className="text-ink-3" /> : <ChevronDown size={16} className="text-ink-3" />}
                                    </div>
                                </div>
                                {isExp && (
                                    <div className="border-t border-line p-4 bg-surface-2 space-y-3">
                                        <div className="grid grid-cols-5 gap-2">
                                            {QUESTIONS.map(q => {
                                                const c = COLOR[q.color];
                                                const v = a.scores[q.id] || 0;
                                                return (
                                                    <div key={q.id} className={`${c.bg} rounded-xl p-2 text-center`}>
                                                        <p className={`text-xl font-black ${c.text}`}>{v}</p>
                                                        <p className="text-[9px] text-ink-2 mt-0.5 leading-tight">{q.label.split(' ').slice(0, 3).join(' ')}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {a.note && (
                                            <div className="bg-surface rounded-xl p-3">
                                                <p className="text-xs font-bold text-ink-2 mb-1">Öğrenci Notu:</p>
                                                <p className="text-sm text-ink-2 italic">"{a.note}"</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SelfAssessmentForm;
