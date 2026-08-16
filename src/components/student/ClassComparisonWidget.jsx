import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Users } from 'lucide-react';

/**
 * Madde 13: Öğrenci Sınıf Ortalaması Karşılaştırma Widget'ı
 * Öğrencinin son deneme sonucunu sınıf ortalamasıyla karşılaştırır
 */
const ClassComparisonWidget = ({ userId, currentStudent }) => {
    const { studentNet, classAvg, diff, classSize, studentName } = useMemo(() => {
        try {
            // Tüm öğrenciler ve sonuçlar
            const allStudents = JSON.parse(localStorage.getItem('coach_students') || '[]');
            const v2Results = JSON.parse(localStorage.getItem('examResults_v2') || '[]');

            // Normalizer
            const normTR = (str) => String(str || '').toLowerCase()
                .replace(/ı/g, 'i').replace(/İ/g, 'i')
                .replace(/ö/g, 'o').replace(/Ö/g, 'o')
                .replace(/ü/g, 'u').replace(/Ü/g, 'u')
                .replace(/ş/g, 's').replace(/Ş/g, 's')
                .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
                .replace(/ç/g, 'c').replace(/Ç/g, 'c').trim();

            // Bu öğrencinin son neti
            const me = currentStudent || allStudents.find(s => String(s.id) === String(userId));
            if (!me) return {};

            const myNorm = normTR(me.name);
            const myResults = v2Results.filter(r => normTR(r.student).includes(myNorm.split(' ')[0]));
            if (myResults.length === 0) return {};

            const myLast = [...myResults].sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0))[0];
            const myNet = parseFloat(myLast.totalNet || 0);

            // Sınıf ortalaması: aynı sınıftaki tüm öğrencilerin son deneme neti
            const sameClass = allStudents.filter(s =>
                s.grade === me.grade && String(s.id) !== String(me.id)
            );

            const classNets = sameClass.map(s => {
                const sNorm = normTR(s.name);
                const sResults = v2Results.filter(r => normTR(r.student).includes(sNorm.split(' ')[0]));
                if (sResults.length === 0) return s.lastNet ? parseFloat(s.lastNet) : null;
                const sLast = [...sResults].sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0))[0];
                return parseFloat(sLast.totalNet || 0);
            }).filter(n => n !== null);

            if (classNets.length === 0) return {};

            const avg = classNets.reduce((s, n) => s + n, 0) / classNets.length;

            return {
                studentNet: myNet,
                classAvg: avg,
                diff: myNet - avg,
                classSize: sameClass.length + 1,
                studentName: me.name,
            };
        } catch { return {}; }
    }, [userId, currentStudent]);

    if (studentNet == null) return null;

    const isAbove = diff > 0.5;
    const isBelow = diff < -0.5;

    return (
        <div className="bg-surface rounded-2xl border border-line shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
                <Users size={18} className="text-brand" />
                <h3 className="font-black text-ink text-sm">Sınıf Ortalamasıyla Karşılaştırma</h3>
            </div>

            {/* Karşılaştırma çubuğu */}
            <div className="space-y-3">
                {/* Benim netim */}
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold text-ink-2">Senin Netin</span>
                        <span className="font-black text-brand">{studentNet.toFixed(1)}</span>
                    </div>
                    <div className="h-3 bg-surface-3 rounded-full overflow-hidden">
                        <div
                            className="on-color h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                            style={{ width: `${Math.min((studentNet / 120) * 100, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Sınıf ortalaması */}
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold text-ink-2">Sınıf Ort. ({classSize} öğrenci)</span>
                        <span className="font-black text-ink-2">{classAvg.toFixed(1)}</span>
                    </div>
                    <div className="h-3 bg-surface-3 rounded-full overflow-hidden">
                        <div
                            className="on-color h-full bg-gradient-to-r from-gray-300 to-gray-400 rounded-full transition-all duration-700"
                            style={{ width: `${Math.min((classAvg / 120) * 100, 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Fark etiketi */}
            <div className={`mt-4 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold ${isAbove ? 'bg-ok-soft text-ok' :
                    isBelow ? 'bg-danger-soft text-danger' :
                        'bg-surface-2 text-ink-2'
                }`}>
                {isAbove ? <TrendingUp size={16} /> : isBelow ? <TrendingDown size={16} /> : <Minus size={16} />}
                {isAbove
                    ? `Sınıf ortalamasının ${Math.abs(diff).toFixed(1)} puan üzerindesin! 🎉`
                    : isBelow
                        ? `Sınıf ortalamasının ${Math.abs(diff).toFixed(1)} puan altındasın. Devam et! 💪`
                        : 'Sınıf ortalamasındasın.'
                }
            </div>
        </div>
    );
};

export default ClassComparisonWidget;
