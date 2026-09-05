/**
 * 🎯 KOÇ: ÖĞRENCİ HEDEF TAKİBİ (StudentDetailPage → Hedefler sekmesi)
 *
 * Bu bileşen eskiden %100 sahte veriydi: "Boğaziçi Üniversitesi",
 * 415/520 puan, uydurma "Yapay Zeka Koç Tavsiyesi" ve onClick'i
 * olmayan bir "Kaydet" butonu — koç hangi öğrenciye bakarsa baksın
 * aynı hayali tabloyu görüyordu.
 *
 * Artık öğrencinin GoalSettingModule'de kaydettiği GERÇEK hedefleri
 * okur (`goals_<id>_tyt`, `goals_<id>_ayt`, `goals_<id>_ayttype`,
 * `goals_<id>_univ`) ve mevcut durumu sayfanın zaten yüklediği deneme
 * sonuçlarından hesaplar. Öğrenci hedef belirlememişse bunu açıkça
 * söyler — sahte rakam üretmez.
 */
import React from 'react';
import { Target, Trophy, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { nesneOku } from '../services/veriDeposu';

/* GoalSettingModule ile aynı puan yaklaşımı (2024 katsayıları) */
const calcYKSScore = (tytNets, aytNets, type = 'SAY') => {
    const TYT_COEFF = { SAY: 0.3, EA: 0.4, 'SÖZ': 0.4, 'DİL': 0.5 };
    const AYT_COEFF = { SAY: 1.06, EA: 1.1, 'SÖZ': 1.08, 'DİL': 0.85 };
    const tytTotal = Object.values(tytNets || {}).reduce((a, b) => a + (parseFloat(b) || 0), 0);
    const aytTotal = Object.values(aytNets || {}).reduce((a, b) => a + (parseFloat(b) || 0), 0);
    const tytContrib = tytTotal * (TYT_COEFF[type] || 0.3) * 1.4;
    const aytContrib = aytTotal * (AYT_COEFF[type] || 1.06);
    return Math.round(300 + tytContrib + aytContrib);
};

/* Deneme kaydından ders neti çek — düz alan ya da subjects nesnesi */
const subjNet = (exam, aliases) => {
    for (const k of aliases) {
        const dogrudan = exam?.[k];
        if (dogrudan != null && !isNaN(parseFloat(dogrudan))) return parseFloat(dogrudan);
        const s = exam?.subjects?.[k] ?? exam?.subjects?.[`tyt_${k}`] ?? exam?.subjects?.[`tyt_${k}_toplam`];
        if (s != null) {
            if (typeof s === 'object') { const n = parseFloat(s.net ?? NaN); if (!isNaN(n)) return n; }
            else { const n = parseFloat(s); if (!isNaN(n)) return n; }
        }
    }
    return null;
};

const GoalTracking = ({ studentId, examResults = [] }) => {
    const lsKey = `goals_${studentId}`;
    const tytGoals = nesneOku(`${lsKey}_tyt`);
    const aytGoals = nesneOku(`${lsKey}_ayt`);
    const aytType = localStorage.getItem(`${lsKey}_ayttype`) || 'SAY';
    const targetUniv = localStorage.getItem(`${lsKey}_univ`) || '';
    const hedefVar = Object.keys(tytGoals).length > 0;

    if (!hedefVar) {
        return (
            <div className="glass-card p-12 text-center text-ink-2 animate-fade-in">
                <Target size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-bold text-ink">Öğrenci henüz hedef belirlememiş.</p>
                <p className="text-sm mt-2">
                    Öğrenci, kendi panelinde <strong>Gelişimim → Hedeflerim</strong> bölümünden
                    hedef üniversitesini ve ders bazında hedef netlerini kaydettiğinde
                    burada hedef-gerçekleşme karşılaştırması görünecek.
                </p>
            </div>
        );
    }

    /* Mevcut: son 3 TYT denemesinin ortalaması */
    const num = (v) => parseFloat(v) || 0;
    const tytExams = [...examResults]
        .filter(e => (e.examType || 'TYT').startsWith('TYT'))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);
    const ort = (aliases) => {
        const degerler = tytExams.map(e => subjNet(e, aliases)).filter(v => v != null);
        if (degerler.length === 0) return null;
        return degerler.reduce((a, b) => a + b, 0) / degerler.length;
    };

    /* Deneme verisinde fen/sosyal çoğunlukla TOPLAM olarak durur —
       hedefler de aynı düzeye toplanarak elmayla elma kıyaslanır. */
    const gruplar = [
        { name: 'Türkçe', hedef: num(tytGoals.turkce), mevcut: ort(['turkce']) },
        { name: 'Matematik', hedef: num(tytGoals.matematik), mevcut: ort(['mat', 'matematik', 'mat_toplam']) },
        {
            name: 'Fen',
            hedef: num(tytGoals.fizik) + num(tytGoals.kimya) + num(tytGoals.biyoloji),
            mevcut: ort(['fen', 'fen_toplam']),
        },
        {
            name: 'Sosyal',
            hedef: num(tytGoals.tarih) + num(tytGoals.cografya) + num(tytGoals.felsefe) + num(tytGoals.din),
            mevcut: ort(['sosyal', 'sosyal_toplam']),
        },
    ];
    const chartData = gruplar.map(g => ({ ...g, mevcut: g.mevcut == null ? 0 : parseFloat(g.mevcut.toFixed(1)) }));

    const hedefToplam = gruplar.reduce((a, g) => a + g.hedef, 0);
    const mevcutToplam = gruplar.reduce((a, g) => a + (g.mevcut || 0), 0);
    const hedefPuan = calcYKSScore(tytGoals, aytGoals, aytType);
    const oran = hedefToplam > 0 ? Math.min(100, Math.round((mevcutToplam / hedefToplam) * 100)) : 0;
    const denemeYok = tytExams.length === 0;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="on-color glass-card p-6 bg-gradient-to-r from-brand to-purple-600 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center mb-1">
                            <Target className="mr-3" size={28} /> Öğrencinin Hedefi
                        </h2>
                        <p className="text-white/90 text-lg font-bold">
                            {targetUniv || 'Hedef üniversite belirtilmemiş'}
                        </p>
                        <p className="text-white/70 text-sm mt-1">Alan: {aytType} • Tahmini hedef puan: ~{hedefPuan}</p>
                    </div>
                    <div className="text-center bg-surface/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                        <div className="text-xs uppercase tracking-wider font-bold text-white/80">TYT Hedefe Ulaşma</div>
                        <div className="text-4xl font-bold mt-1">%{oran}</div>
                        <div className="text-xs text-white/70 mt-1">{mevcutToplam.toFixed(1)} / {hedefToplam.toFixed(0)} net</div>
                    </div>
                </div>
            </div>

            <div className="glass-card p-6">
                <h3 className="font-bold text-ink mb-6 flex items-center">
                    <TrendingUp className="mr-2 text-ok" size={20} />
                    Net Karşılaştırması (Son 3 TYT ortalaması vs Hedef)
                </h3>
                {denemeYok ? (
                    <p className="text-sm text-ink-2 bg-warn-soft border border-warn rounded-xl p-4">
                        Henüz eşleşen TYT deneme sonucu yok — hedefler kayıtlı ama karşılaştırılacak
                        gerçekleşme verisi bulunmuyor. Deneme sonucu girildikçe bu grafik dolacak.
                    </p>
                ) : (
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                                <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend />
                                <Bar dataKey="mevcut" name="Mevcut Net" fill="#9333EA" radius={[0, 4, 4, 0]} barSize={20} animationDuration={300} />
                                <Bar dataKey="hedef" name="Hedef Net" fill="#E5E7EB" radius={[0, 4, 4, 0]} barSize={20} animationDuration={300} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            <div className="glass-card p-6">
                <h3 className="font-bold text-ink mb-4 flex items-center">
                    <Trophy className="mr-2 text-warn" size={20} /> Ders Bazında Hedefler
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {gruplar.map((g) => (
                        <div key={g.name} className="p-4 bg-surface-2 rounded-xl border border-line">
                            <p className="text-xs font-bold text-ink-2 uppercase mb-1">{g.name}</p>
                            <p className="text-lg font-black text-brand">{g.hedef.toFixed(0)} net</p>
                            <p className="text-xs text-ink-3 mt-1">
                                {g.mevcut == null ? 'Mevcut veri yok' : `Mevcut: ${g.mevcut.toFixed(1)}`}
                            </p>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-ink-3 mt-4">
                    Hedefler öğrencinin kendi panelinden (Gelişimim → Hedeflerim) güncellenir.
                </p>
            </div>
        </div>
    );
};

export default GoalTracking;
