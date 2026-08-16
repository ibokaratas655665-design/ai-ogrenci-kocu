import React, { useState, useMemo } from 'react';
import {
    TrendingDown, TrendingUp, AlertTriangle, Target,
    ChevronDown, ChevronUp, Star, Lightbulb, BarChart2,
    BookOpen, Award
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

// ─── Ders Tanımları ───────────────────────────────────────────
const SUBJECT_META = {
    // TYT
    turkce: { label: 'Türkçe', max: 40, exam: 'TYT', color: 'var(--c1)', emoji: '📖' },
    mat: { label: 'Matematik', max: 40, exam: 'TYT', color: 'var(--ok)', emoji: '🔢' },
    fen: { label: 'Fen Bilimleri', max: 20, exam: 'TYT', color: 'var(--warn)', emoji: '🧪' },
    sosyal: { label: 'Sosyal', max: 20, exam: 'TYT', color: 'var(--c5)', emoji: '🌍' },
    // AYT
    edebiyat: { label: 'Edebiyat', max: 24, exam: 'AYT', color: 'var(--c4)', emoji: '✍️' },
    tarih: { label: 'Tarih', max: 10, exam: 'AYT', color: 'var(--danger)', emoji: '🏛️' },
    cografya: { label: 'Coğrafya', max: 6, exam: 'AYT', color: 'var(--c2)', emoji: '🗺️' },
    felsefe: { label: 'Felsefe', max: 12, exam: 'AYT', color: 'var(--c4)', emoji: '💭' },
    ayt_mat: { label: 'AYT Mat', max: 30, exam: 'AYT', color: 'var(--info)', emoji: '📐' },
    fizik: { label: 'Fizik', max: 14, exam: 'AYT', color: 'var(--warn)', emoji: '⚡' },
    kimya: { label: 'Kimya', max: 13, exam: 'AYT', color: 'var(--c2)', emoji: '🧬' },
    biyoloji: { label: 'Biyoloji', max: 13, exam: 'AYT', color: 'var(--ok)', emoji: '🌿' },
};

// Kural tabanlı öneriler - tüm dersler
const SUBJECT_TIPS = {
    // TYT
    turkce: ['Günlük 2 paragraf sorusu + 1 dil bilgisi konusu çalış', 'Hatalı soruları soru tipi bazlı kategorize et', 'Hız-doğruluk dengesine dikkat et, dikkat dağıtıcıları kapat'],
    mat: ['Günlük 20 soru: 10 temel + 10 zorlu tamamla', 'Hatalı soruları tekrar çöz ve mantığını yaz', 'Test süresini kıs: her soruya max 1.5 dk harca'],
    fen: ['Fizik, Kimya, Biyoloji\'yi dengeli dağıt (2+2+2 soru/gün)', 'Formül ezber değil, türetme pratiği yap', 'TYT Fen konularına odaklan: enerji, asit-baz, hücre'],
    sosyal: ['Günlük tarih zaman çizelgesi + coğrafya haritası çalış', 'Türkiye\ coğrafyasını harita üzerinde tekrar et', 'Güncel ve Türkiye ile ilgili sorulara ağırlık ver'],
    // AYT
    edebiyat: ['Günlük 1 şiir analizi + 2 düz yazı türü sorusu çöz', 'Dönem akımlarını (Tanzimat, Meşrutiyet, Cumhuriyet) karşılaştır', 'Anlatı türleri ve özellikleri flash-card yöntemiyle ezberle'],
    tarih: ['Her gün 1 dönemi (Osmanlı/Cumhuriyet) özetle', 'Kronolojik tablolar yap: tarih-olay-sonuç', 'AYT Tarih-1 sorularını çıkmış sorularla çalış'],
    cografya: ['Türkiye\'nin bölgelerini harita üzerinde çiz ve öğren', 'İklim-bitki örtüsü-nüfus ilişkilerini kavra', 'Beşeri coğrafya (nüfus, tarım, sanayi) ağırlıklı çalış'],
    felsefe: ['Felsefe akımlarını (Sokrates→Kant→Marx) çizelgele', 'AYT Felsefe: günlük 5 çıkmış soru çöz', 'Mantık soruları için sembolik mantık özetle'],
    ayt_mat: ['Analitik geometri + türev-integral: haftalık 60 soru', 'Çözüm yolu ezberleme değil, kavramsal anlama', 'Sınav süresine göre: 80 soruyu 80 dakikada çöz'],
    fizik: ['Temel formülleri çalışma kağıdına yaz, her gün gör', 'Problem çözerken birim analizi mutlaka yap', 'Deneme çözümlerini yeniden çözerek pekiştir'],
    kimya: ['Her gün 1 konu: asit-baz, karbon kimyası, elektrokimya', 'Mol hesapları için standart problem seti oluştur', 'Denklem denkleştirme pratikleri yap'],
    biyoloji: ['Hücre→sistem→organizma sırasıyla tekrar et', 'Şema ve diyagramları kendisi çizerek öğren', 'Kalıtım soruları için punnet kareleri pratik yap'],
};

// ─── Net hesaplayıcı (flexible key mapping) ──────────────────
const extractNets = (result) => {
    const nets = {};
    const s = result.subjects || {};

    // TYT alanları
    nets.turkce = typeof result.turkce === 'number' ? result.turkce : parseFloat(s.turkce?.net ?? s.turkce ?? 0);
    nets.mat = typeof result.mat === 'number' ? result.mat : parseFloat(s.mat_toplam?.net ?? s.mat_toplam ?? s.mat?.net ?? s.mat ?? 0);
    nets.fen = typeof result.fen === 'number' ? result.fen : parseFloat(s.fen_toplam?.net ?? s.fen_toplam ?? s.fen?.net ?? s.fen ?? 0);
    nets.sosyal = typeof result.sosyal === 'number' ? result.sosyal : parseFloat(s.sosyal_toplam?.net ?? s.sosyal_toplam ?? s.sosyal?.net ?? s.sosyal ?? 0);

    // AYT alanları
    nets.edebiyat = parseFloat(result.edebiyat ?? s.edebiyat?.net ?? 0);
    nets.ayt_mat = parseFloat(result.aytMat ?? s.ayt_mat?.net ?? 0);
    nets.fizik = parseFloat(result.fizik ?? s.fizik?.net ?? 0);
    nets.kimya = parseFloat(result.kimya ?? s.kimya?.net ?? 0);
    nets.biyoloji = parseFloat(result.biyoloji ?? s.biyoloji?.net ?? 0);

    return nets;
};

// ─── Zayıf Nokta Hesaplama ────────────────────────────────────
const calcWeaknesses = (examData) => {
    if (!examData || examData.length === 0) return [];

    // Son denemeler (max 5)
    const recent = examData.slice(-5);
    const subjStats = {};

    recent.forEach(exam => {
        const nets = extractNets(exam);
        Object.entries(nets).forEach(([key, net]) => {
            const meta = SUBJECT_META[key];
            if (!meta || net === 0) return; // sıfır net → veri yok

            if (!subjStats[key]) subjStats[key] = { nets: [], key, ...meta };
            subjStats[key].nets.push(net);
        });
    });

    return Object.values(subjStats).map(s => {
        const avg = s.nets.reduce((a, b) => a + b, 0) / s.nets.length;
        const maxPossible = s.nets.length > 0 ? Math.max(...s.nets) : 0;
        const pct = avg / s.max; // 0-1
        const trend = s.nets.length >= 2 ? s.nets[s.nets.length - 1] - s.nets[0] : 0;

        // weakness score: düşük pct = yüksek zayıflık
        const weakScore = 1 - pct;

        return {
            ...s,
            avg: parseFloat(avg.toFixed(1)),
            maxPossible: parseFloat(maxPossible.toFixed(1)),
            pct: parseFloat((pct * 100).toFixed(0)),
            trend: parseFloat(trend.toFixed(1)),
            weakScore,
        };
    }).filter(s => s.nets.length > 0)
        .sort((a, b) => b.weakScore - a.weakScore);
};

// ─── Radar Chart Data ─────────────────────────────────────────
const buildRadarData = (subjects) => {
    return subjects.slice(0, 6).map(s => ({
        subject: s.label,
        fill: s.color,
        Mevcut: s.pct,
        Hedeflenen: Math.min(100, s.pct + 20),
    }));
};

// ─── Ders Kartı ───────────────────────────────────────────────
const SubjectCard = ({ subject, rank }) => {
    const [expanded, setExpanded] = useState(false);
    const tips = SUBJECT_TIPS[subject.key] || ['Bu derse daha fazla zaman ayır', 'Konu tekrarı yap', 'Örnek soru çöz'];

    const level = subject.pct >= 75 ? 'good'
        : subject.pct >= 50 ? 'medium'
            : 'weak';

    const cfg = {
        good: { bg: 'bg-ok-soft border-ok', badge: 'bg-ok-soft text-ok', label: 'Güçlü', icon: TrendingUp },
        medium: { bg: 'bg-warn-soft border-warn', badge: 'bg-warn-soft text-warn', label: 'Geliştirilmeli', icon: Target },
        weak: { bg: 'bg-danger-soft border-danger', badge: 'bg-danger-soft text-danger', label: 'Kritik Zayıf', icon: TrendingDown },
    }[level];

    const Icon = cfg.icon;

    return (
        <div className={`rounded-2xl border-2 p-4 transition-all ${cfg.bg}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="text-2xl">{subject.emoji}</div>
                    <div>
                        <div className="flex items-center gap-2">
                            {rank <= 3 && (
                                <span className="text-xs font-black px-1.5 py-0.5 bg-danger text-white rounded-full">
                                    #{rank}
                                </span>
                            )}
                            <span className="font-black text-ink text-sm">{subject.label}</span>
                        </div>
                        <div className="text-xs text-ink-2 mt-0.5">
                            Ort: <span className="font-bold">{subject.avg}</span> / {subject.max} net
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${cfg.badge}`}>
                        {cfg.label}
                    </span>
                    <button
                        onClick={() => setExpanded(e => !e)}
                        className="text-ink-3 hover:text-ink-2 transition"
                    >
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3">
                <div className="flex justify-between text-xs text-ink-2 mb-1">
                    <span>{subject.pct}% potansiyel</span>
                    <span className={subject.trend >= 0 ? 'text-ok font-bold' : 'text-danger font-bold'}>
                        {subject.trend >= 0 ? '+' : ''}{subject.trend} trend
                    </span>
                </div>
                <div className="h-2 bg-surface/60 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${subject.pct}%`, background: subject.color }}
                    />
                </div>
            </div>

            {/* AI Önerileri */}
            {expanded && (
                <div className="mt-3 space-y-1.5 animate-fade-in">
                    <p className="text-xs font-black text-ink-2 flex items-center gap-1">
                        <Lightbulb size={12} className="text-warn" /> Öneriler
                    </p>
                    {tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs bg-surface/70 rounded-lg px-2.5 py-1.5 text-ink-2">
                            <span className="mt-0.5 text-brand font-bold">{i + 1}.</span>
                            {tip}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Ana Bileşen ──────────────────────────────────────────────
const SubjectWeaknessAnalyzer = ({ examData = [], studentName = '' }) => {
    const [view, setView] = useState('list'); // list | radar
    const weaknesses = useMemo(() => calcWeaknesses(examData), [examData]);
    const radarData = buildRadarData(weaknesses);

    if (examData.length === 0) {
        return (
            <div className="bg-surface rounded-2xl border border-line shadow-sm p-10 text-center">
                <BarChart2 size={40} className="mx-auto mb-3 text-ink-3" />
                <h3 className="text-base font-bold text-ink-2 mb-1">Henüz Analiz Yok</h3>
                <p className="text-sm text-ink-3">Deneme sonuçların yüklendikçe zayıf noktalar otomatik hesaplanır.</p>
            </div>
        );
    }

    const top3weak = weaknesses.slice(0, 3);
    const hasGood = weaknesses.filter(s => s.pct >= 75);
    const hasCrit = weaknesses.filter(s => s.pct < 50);

    return (
        <div className="space-y-5">
            {/* Özet Satırı */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-danger-soft border border-danger rounded-2xl p-4 text-center">
                    <div className="text-2xl font-black text-danger">{hasCrit.length}</div>
                    <div className="text-xs text-danger font-bold mt-0.5">Kritik Zayıf</div>
                </div>
                <div className="bg-warn-soft border border-warn rounded-2xl p-4 text-center">
                    <div className="text-2xl font-black text-warn">
                        {weaknesses.filter(s => s.pct >= 50 && s.pct < 75).length}
                    </div>
                    <div className="text-xs text-warn font-bold mt-0.5">Geliştirilmeli</div>
                </div>
                <div className="bg-ok-soft border border-ok rounded-2xl p-4 text-center">
                    <div className="text-2xl font-black text-ok">{hasGood.length}</div>
                    <div className="text-xs text-ok font-bold mt-0.5">Güçlü Alan</div>
                </div>
            </div>

            {/* Toggle */}
            <div className="flex items-center justify-between">
                <h3 className="font-black text-ink text-sm flex items-center gap-2">
                    <BookOpen size={16} className="text-brand" />
                    Ders Bazlı Analiz
                    <span className="text-xs text-ink-3 font-normal">(son {Math.min(5, examData.length)} deneme)</span>
                </h3>
                <div className="flex rounded-xl border border-line overflow-hidden">
                    <button onClick={() => setView('list')} className={`px-3 py-1.5 text-xs font-bold transition ${view === 'list' ? 'bg-brand text-ink' : 'text-ink-2 hover:bg-surface-2'}`}>
                        Liste
                    </button>
                    <button onClick={() => setView('radar')} className={`px-3 py-1.5 text-xs font-bold transition ${view === 'radar' ? 'bg-brand text-ink' : 'text-ink-2 hover:bg-surface-2'}`}>
                        Radar
                    </button>
                </div>
            </div>

            {view === 'list' && (
                <div className="space-y-3">
                    {weaknesses.map((s, idx) => (
                        <SubjectCard key={s.key} subject={s} rank={idx + 1} />
                    ))}
                </div>
            )}

            {view === 'radar' && (
                <div className="bg-surface rounded-2xl border border-line shadow-sm p-5">
                    <h4 className="text-sm font-black text-ink-2 mb-4 text-center">Performans Radar Grafiği</h4>
                    <ResponsiveContainer width="100%" height={280}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fontWeight: 700, fill: '#6b7280' }} />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                            <Radar dataKey="Mevcut" stroke="var(--c1)" fill="var(--c1)" fillOpacity={0.3} strokeWidth={2} />
                            <Radar dataKey="Hedeflenen" stroke="var(--ok)" fill="var(--ok)" fillOpacity={0.1} strokeWidth={1} strokeDasharray="4 4" />
                            <Tooltip formatter={(v) => `${v}%`} contentStyle={{ fontSize: 11, borderRadius: 10 }} />
                        </RadarChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 text-xs mt-2">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm bg-indigo-400 opacity-80" />
                            <span className="text-ink-2 font-medium">Mevcut Durum</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm bg-green-400 opacity-50" />
                            <span className="text-ink-2 font-medium">Hedeflenen (+20%)</span>
                        </div>
                    </div>
                </div>
            )}

            {/* En Kritik Öneriler */}
            {top3weak.length > 0 && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-brand-line p-4">
                    <h4 className="text-xs font-black text-brand mb-3 flex items-center gap-1.5">
                        <Star size={13} className="text-warn" />
                        Öncelikli Çalışma Konuları
                    </h4>
                    <div className="space-y-2">
                        {top3weak.map((s, i) => (
                            <div key={s.key} className="flex items-center gap-2.5 bg-surface rounded-xl px-3 py-2">
                                <span className="text-sm font-black text-brand">#{i + 1}</span>
                                <span className="text-lg">{s.emoji}</span>
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-bold text-ink">{s.label}</span>
                                    <span className="text-xs text-ink-3 ml-1.5">%{s.pct} potansiyel</span>
                                </div>
                                <span className="text-xs text-brand font-bold bg-brand-soft px-2 py-1 rounded-lg whitespace-nowrap">
                                    +{(s.max - s.avg).toFixed(1)} net olası
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubjectWeaknessAnalyzer;
