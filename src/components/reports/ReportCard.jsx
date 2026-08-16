import React, { forwardRef } from 'react';
import { Award, BookOpen, Calendar, CheckCircle, TrendingUp, AlertTriangle, Hash } from 'lucide-react';
import { getAYTAreaNets, calculateEstimatedScore, getOBPScore } from '../../utils/scoreCalculator';

// ─── Yardımcılar ────────────────────────────────────────────────────────────
const fmt = (val, dec = 2) => {
    const n = parseFloat(val);
    return isNaN(n) ? '-' : n.toFixed(dec);
};

// Konu adlarını Türkçe ve okunabilir hale getir
const SUBJECT_LABELS = {
    // ─── TYT ────────────────────────────────────────────────────────────────
    tyt_turkce: 'Türkçe (TYT)',
    tyt_tarih: 'Tarih-1 (TYT)',
    tyt_cografya: 'Coğrafya-1 (TYT)',
    tyt_felsefe: 'Felsefe (TYT)',
    tyt_felsefe_secmeli: 'Felsefe (Seçmeli)',
    tyt_din: 'Din Kültürü (TYT)',
    tyt_matematik: 'Matematik (TYT)',
    tyt_geometri: 'Geometri (TYT)',
    tyt_fizik: 'Fizik (TYT)',
    tyt_kimya: 'Kimya (TYT)',
    tyt_biyoloji: 'Biyoloji (TYT)',
    tyt_fen_toplam: 'Fen Bilimleri Toplam',
    tyt_sosyal_toplam: 'Sosyal Bilimler Toplam',
    tyt_mat_toplam: 'Matematik Toplam',

    // Legacy Fallbacks (TYT)
    turkce: 'Türkçe',
    matematik: 'Matematik (TYT)',
    mat: 'Matematik (TYT)',
    geometri: 'Geometri',
    fizik: 'Fizik (TYT)',
    kimya: 'Kimya (TYT)',
    biyoloji: 'Biyoloji (TYT)',
    tarih: 'Tarih (TYT)',
    cografya: 'Coğrafya (TYT)',
    felsefe: 'Felsefe (TYT)',

    // ─── AYT ────────────────────────────────────────────────────────────────
    ayt_turkce: 'Türkçe (AYT)',
    ayt_edebiyat: 'Edebiyat (AYT)',
    ayt_tarih1: 'Tarih-1 (AYT)',
    ayt_cografya1: 'Coğrafya-1 (AYT)',
    ayt_tarih2: 'Tarih-2 (AYT)',
    ayt_cografya2: 'Coğrafya-2 (AYT)',
    ayt_felsefe: 'Felsefe (AYT)',
    ayt_felsefe_secmeli: 'Felsefe Grubu (AYT)',
    ayt_din: 'Din Kültürü (AYT)',
    ayt_matematik: 'Matematik-2 (AYT)',
    ayt_geometri: 'Geometri (AYT)',
    ayt_fizik: 'Fizik (AYT)',
    ayt_kimya: 'Kimya (AYT)',
    ayt_biyoloji: 'Biyoloji (AYT)',
    yabanci_dil: 'Yabancı Dil (YDT)',

    // Legacy Fallbacks (AYT)
    edebiyat: 'Türk Dili ve Edebiyatı',
    tarih1: 'Tarih-1',
    tarih2: 'Tarih-2',
    cografya1: 'Coğrafya-1',
    cografya2: 'Coğrafya-2',
    ayt_mat: 'Matematik (AYT)',

    // ─── LGS ────────────────────────────────────────────────────────────────
    lgs_turkce: 'Türkçe (LGS)',
    lgs_mat: 'Matematik (LGS)',
    lgs_fen: 'Fen Bilimleri (LGS)',
    inkilap: 'İnkılap Tarihi (LGS)',
    ingilizce: 'İngilizce (LGS)',
    lgs_din: 'Din Kültürü (LGS)',
};

const getSubjectLabel = (key) =>
    SUBJECT_LABELS[key] ||
    key.replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

// Görüntülenmeyecek key'ler: aggregate/toplam/bilinmeyen
const SKIP_KEYS = [
    'fen_net', 'sosyal_net', 'toplam_genel', 'bilinmeyen',
    'fen_mat_toplam', 'edebiyat_toplam', 'sosyal_ayt_toplam', 'dil_toplam',
    'ayt_toplam', 'tyt_toplam',
];

// TYT'de çift sayım önleme:
// mat_toplam = matematik+geometrinin toplamı → matematik varsa gizle
const filterDuplicateSubjects = (entries) => {
    const keys = entries.map(([k]) => k);
    const hasFizik = keys.some(k => k === 'fizik');
    const hasKimya = keys.some(k => k === 'kimya');
    const hasBiyoloji = keys.some(k => k === 'biyoloji');
    const hasTarih = keys.some(k => k === 'tarih');
    const hasCografya = keys.some(k => k === 'cografya');
    const hasFelsefe = keys.some(k => k === 'felsefe');
    const hasDin = keys.some(k => k === 'din');
    const hasMatematik = keys.some(k => k === 'matematik');
    const hasMat = keys.some(k => k === 'mat');

    const fenSubsExist = hasFizik || hasKimya || hasBiyoloji;
    const sosyalSubsExist = hasTarih || hasCografya || hasFelsefe || hasDin;

    return entries.filter(([key]) => {
        if (fenSubsExist && (key === 'fen' || key === 'fen_toplam')) return false;
        if (sosyalSubsExist && (key === 'sosyal' || key === 'sosyal_toplam')) return false;
        // mat_toplam = aggregate → hide whenever matematik or mat exists
        if (key === 'mat_toplam' && (hasMatematik || hasMat)) return false;
        // "mat" alias → hide if matematik shown
        if (key === 'mat' && hasMatematik) return false;
        return true;
    });
};

// ─── Dinamik AI Tavsiye ──────────────────────────────────────────────────────

const generateDynamicTip = (studentName, examType, strongSubjects, weakSubjects, totalNet) => {

    const name = studentName || 'Öğrenci';
    const strong = strongSubjects[0] ? getSubjectLabel(strongSubjects[0][0]) : null;
    const weak1 = weakSubjects[0] ? getSubjectLabel(weakSubjects[0][0]) : null;
    const weak2 = weakSubjects[1] ? getSubjectLabel(weakSubjects[1][0]) : null;
    const net = parseFloat(totalNet) || 0;

    let tip = `Sayın ${name}, `;

    if (net > 80) {
        tip += `${examType} denemesinde harika bir performans sergiliyorsun! `;
        if (strong) tip += `${strong} dersi senin en güçlü alanın. `;
        if (weak1) tip += `${weak1} dersine biraz daha zaman ayırarak bu performansı daha da zirveye taşıyabilirsin.`;
    } else if (net > 50) {
        tip += `${examType} deneme sonucun iyi bir seviyede. `;
        if (strong) tip += `${strong} dersindeki başarın devam ediyor. `;
        if (weak1 && weak2) tip += `${weak1} ve ${weak2} derslerine özel çalışma yaparak toplam netini artırabilirsin.`;
        else if (weak1) tip += `${weak1} dersine odaklanarak büyük sıçrama yapabilirsin.`;
    } else {
        tip += `${examType} denemesinde gelişim alanların var. `;
        if (weak1) tip += `Özellikle ${weak1} dersi için haftada en az 3 saat ek çalışma yapmanı öneririm. `;
        if (strong) tip += `${strong} dersindeki motivasyonunu diğer derslere de taşı.`;
        tip += ` Düzenli tekrar ve soru çözümüyle hızlı ilerleme kaydedebilirsin.`;
    }

    return tip;
};

// ─── Ana Bileşen ─────────────────────────────────────────────────────────────
const ReportCard = forwardRef(({ studentResults, userName }, ref) => {

    const latestResult = studentResults && studentResults.length > 0
        ? studentResults[studentResults.length - 1]
        : null;

    if (!latestResult) return null;

    const examType = latestResult.examType || 'TYT';
    const isAYT = examType === 'AYT';
    const isTYT = examType === 'TYT';
    const isLGS = examType === 'LGS';
    const isTYT_AYT = examType === 'TYT+AYT';
    const isTYT_YDT = examType === 'TYT+YDT';

    // ── Toplam Net ──────────────────────────────────────────────────────────
    let displayNet = 0;
    let displayNetLabel = 'Toplam Net';

    if (isTYT) {
        displayNet = parseFloat(latestResult.totalNet) || parseFloat(latestResult.tyt) || 0;
        if (displayNet === 0 && latestResult.subjects) {
            displayNet = Object.values(latestResult.subjects)
                .reduce((s, v) => s + (parseFloat(v?.net) || 0), 0);
        }
        displayNetLabel = 'TYT Toplam Net';
    } else if (isAYT) {
        const sayNet = parseFloat(latestResult.sayNet) || 0;
        const eaNet = parseFloat(latestResult.eaNet) || 0;
        const sozNet = parseFloat(latestResult.sozNet) || 0;
        const dilNet = parseFloat(latestResult.dilNet) || 0;
        displayNet = Math.max(sayNet, eaNet, sozNet, dilNet);
        if (displayNet === 0) displayNet = parseFloat(latestResult.totalNet) || 0;

        // puan türü etiketi
        if (displayNet === sayNet && sayNet > 0) displayNetLabel = 'SAY Net (En Yüksek)';
        else if (displayNet === eaNet && eaNet > 0) displayNetLabel = 'EA Net (En Yüksek)';
        else if (displayNet === sozNet && sozNet > 0) displayNetLabel = 'SÖZ Net (En Yüksek)';
        else if (displayNet === dilNet && dilNet > 0) displayNetLabel = 'DİL Net (En Yüksek)';
        else displayNetLabel = 'AYT Net';
    } else if (isLGS) {
        displayNet = parseFloat(latestResult.totalNet) ||
            Object.values(latestResult.subjects || {}).reduce((s, v) => s + (parseFloat(v?.net) || 0), 0);
        displayNetLabel = 'LGS Net';
    } else if (isTYT_AYT) {
        const tytNet = parseFloat(latestResult.tyt || 0);
        const { sayNet, eaNet, sozNet, dilNet } = getAYTAreaNets(latestResult);
        const aytMax = Math.max(sayNet, eaNet, sozNet, dilNet);
        displayNet = tytNet + aytMax;
        displayNetLabel = 'YKS Toplam Net (TYT+AYT)';
    } else if (isTYT_YDT) {
        const tytNet = parseFloat(latestResult.tyt || 0);
        const { dilNet } = getAYTAreaNets(latestResult);
        displayNet = tytNet + dilNet;
        displayNetLabel = 'YKS Toplam Net (TYT+YDT)';
    } else {
        // Fallback for any other type
        displayNet = parseFloat(latestResult.totalNet || latestResult.net || 0);
        displayNetLabel = 'Toplam Net';
    }

    // ─── Puan Tahmin Paneli (Area Specific) ──────────────────────────────
    const areaScores = [];
    let aytData = { sayNet: 0, eaNet: 0, sozNet: 0, dilNet: 0 };

    // Safety functions to prevent ReferenceErrors
    const safeGetOBP = (name) => {
        try {
            if (typeof getOBPScore === 'function') return getOBPScore(name);
            if (typeof window !== 'undefined' && typeof window.getOBPScore === 'function') {
                return window.getOBPScore(name);
            }
        } catch (e) { console.error("ReportCard safeGetOBP error:", e); }
        return 0;
    };

    const safeCalculateScore = (res) => {
        try {
            if (typeof calculateEstimatedScore === 'function') return calculateEstimatedScore(res);
            if (typeof window !== 'undefined' && typeof window.calculateEstimatedScore === 'function') {
                return window.calculateEstimatedScore(res);
            }
        } catch (e) { console.error("ReportCard safeCalculateScore error:", e); }
        return 0;
    };

    try {
        const studentName = latestResult.student || latestResult.studentName || latestResult.name || '';
        const obpScore = parseFloat(safeGetOBP(studentName)) || 0;
        const diplomaGrade = parseFloat((obpScore / 0.6).toFixed(2)) || 0;

        latestResult.obpFound = obpScore;
        latestResult.diplomaGrade = diplomaGrade;

        if (isTYT_AYT || isAYT) {
            const resultsForTyt = { ...latestResult, examType: 'TYT', skipOBP: true };
            const tytBase = isAYT ? 100 : (safeCalculateScore(resultsForTyt) || 100);
            aytData = getAYTAreaNets(latestResult) || aytData;
            const { sayNet, eaNet, sozNet, dilNet } = aytData;

            // Katsayılar: Base 100 + (Net * ~4.3) + OBP
            // AYT Max net = 80. (500-190)/80 = 5.0 katsayı (YKS standardına yakın)
            const aytSayBase = 100 + (parseFloat(sayNet || 0) * 5.0);
            const aytEaBase = 100 + (parseFloat(eaNet || 0) * 5.0);
            const aytSozBase = 100 + (parseFloat(sozNet || 0) * 5.0);
            const aytDilBase = 100 + (parseFloat(dilNet || 0) * 5.0);

            if (sayNet > 0) areaScores.push({
                label: 'Sayısal (SAY)',
                score: isTYT_AYT ? (tytBase * 0.4 + aytSayBase * 0.6 + obpScore) : (aytSayBase + obpScore),
                color: 'indigo'
            });
            if (eaNet > 0) areaScores.push({
                label: 'Eşit Ağırlık (EA)',
                score: isTYT_AYT ? (tytBase * 0.4 + aytEaBase * 0.6 + obpScore) : (aytEaBase + obpScore),
                color: 'purple'
            });
            if (sozNet > 0) areaScores.push({
                label: 'Sözel (SÖZ)',
                score: isTYT_AYT ? (tytBase * 0.4 + aytSozBase * 0.6 + obpScore) : (aytSozBase + obpScore),
                color: 'pink'
            });
            if (dilNet > 0) areaScores.push({
                label: 'Dil (DIL)',
                score: isTYT_AYT ? (tytBase * 0.4 + aytDilBase * 0.6 + obpScore) : (aytDilBase + obpScore),
                color: 'blue'
            });
        } else {
            const score = safeCalculateScore(latestResult) || 0;
            if (score > 100) areaScores.push({ label: isTYT ? 'TYT Puan Tahmini' : 'LGS Puan Tahmini', score, color: 'indigo' });
        }
    } catch (err) {
        console.warn('Puan hesaplama hatası:', err);
    }

    // ── Sıralama ─────────────────────────────────────────────────────────
    const rankValue = latestResult.ranks?.kurum || latestResult.ranks?.sinif ||
        latestResult.rank || null;
    const scoreVal = parseFloat(latestResult.score) || parseFloat(latestResult.scores?.say) ||
        parseFloat(latestResult.scores?.ea) || parseFloat(latestResult.scores?.genel) || 0;

    // ── Öğrenci No ───────────────────────────────────────────────────────
    const studentNo = latestResult.number || latestResult.studentNo || null;
    const studentGrade = latestResult.grade || latestResult.gradeLevel || null;

    // ── Subjects: temizle, filtrele ──────────────────────────────────────
    const allSubjectEntries = Object.entries(latestResult.subjects || {}).filter(([key, stats]) => {
        if (SKIP_KEYS.includes(key)) return false;
        if (key === 'bilinmeyen') return false;
        const d = parseFloat(stats?.d) || 0;
        const y = parseFloat(stats?.y) || 0;
        const net = parseFloat(stats?.net) || 0;
        return (d + y + Math.abs(net)) > 0;
    });

    const subjectEntries = filterDuplicateSubjects(allSubjectEntries);

    // ── Güçlü / Zayıf dersler ───────────────────────────────────────────
    const sortedByNet = [...subjectEntries].sort((a, b) =>
        (parseFloat(b[1]?.net) || 0) - (parseFloat(a[1]?.net) || 0)
    );
    const strongSubjects = sortedByNet.slice(0, 3);
    const weakSubjects = [...sortedByNet].reverse().slice(0, 3);

    const aiTip = generateDynamicTip(
        userName || latestResult.student,
        examType,
        strongSubjects,
        weakSubjects,
        displayNet
    );

    return (
        <div ref={ref} className="bg-surface p-8 w-full max-w-3xl mx-auto" id="report-card-content">

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="flex justify-between items-start border-b-4 border-indigo-600 pb-6 mb-8">
                <div>
                    <h1 className="text-4xl font-black text-ink tracking-tight">ÖĞRENCİ KARNESİ</h1>
                    <p className="text-ink-2 mt-2 font-medium">Yapay Zeka Destekli Performans Analizi</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-brand">{userName || latestResult.student || 'Öğrenci'}</div>
                    {studentNo && (
                        <div className="text-sm text-ink-2 mt-1 flex items-center justify-end">
                            <Hash size={12} className="mr-1" />
                            Okul No: {studentNo}
                        </div>
                    )}
                    {studentGrade && (
                        <div className="text-sm text-ink-3 mt-0.5">{studentGrade}. Sınıf</div>
                    )}
                    <div className="text-sm text-ink-2 mt-1 flex items-center justify-end">
                        <Calendar size={14} className="mr-1" />
                        {new Date().toLocaleDateString('tr-TR')}
                    </div>
                    <div className="mt-1">
                        <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${isAYT || isTYT_AYT ? 'bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] text-c4' :
                            isLGS ? 'bg-warn-soft text-warn' :
                                isTYT_YDT ? 'bg-info-soft text-info' :
                                    'bg-brand-soft text-brand'
                            }`}>{examType} Denemesi</span>
                    </div>
                </div>
            </div>

            {/* ── Özet Kutular ─────────────────────────────────────────── */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-ink mb-4 flex items-center">
                    <Award className="mr-2 text-brand" />
                    Son Deneme Sonuç Özeti
                </h2>

                {isAYT || isTYT_AYT ? (
                    /* AYT veya TYT+AYT için 4 puan türü göster */
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
                        <div className="bg-warn-soft p-4 rounded-xl border border-warn text-center">
                            <div className="text-xs text-warn font-bold mb-1">TYT Net</div>
                            <div className="text-2xl font-black text-warn">
                                {fmt(latestResult.tyt || 0)}
                            </div>
                        </div>
                        {[
                            { label: 'SAY Net', value: aytData.sayNet, color: 'purple' },
                            { label: 'EA Net', value: aytData.eaNet, color: 'blue' },
                            { label: 'SÖZ Net', value: aytData.sozNet, color: 'green' },
                        ].map(({ label, value, color }) => (
                            <div key={label} className={`bg-${color}-50 p-4 rounded-xl border border-${color}-100 text-center`}>
                                <div className={`text-xs text-${color}-600 font-bold mb-1`}>{label}</div>
                                <div className={`text-2xl font-black text-${color}-800`}>
                                    {parseFloat(value) > 0 ? fmt(value) : '-'}
                                </div>
                            </div>
                        ))}
                        <div className="bg-ok-soft p-4 rounded-xl border border-ok text-center">
                            <div className="text-xs text-ok font-bold mb-1">OBP (Tahmini)</div>
                            <div className="text-2xl font-black text-ok">
                                {latestResult.obpFound > 0 ? fmt(latestResult.obpFound) : <span className="text-ink-3">0</span>}
                            </div>
                        </div>
                        <div className="col-span-2 sm:col-span-1 bg-brand-soft border border-brand-line rounded-xl p-3 text-center flex flex-col justify-center">
                            <span className="text-[10px] text-brand font-bold uppercase">Toplam Net</span>
                            <span className="text-lg font-black text-brand">{fmt(displayNet)}</span>
                        </div>
                    </div>
                ) : isTYT_YDT ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-3">
                        <div className="bg-warn-soft p-4 rounded-xl border border-warn text-center">
                            <div className="text-xs text-warn font-bold mb-1">TYT Net</div>
                            <div className="text-2xl font-black text-warn">
                                {fmt(latestResult.tyt || 0)}
                            </div>
                        </div>
                        <div className="bg-info-soft p-4 rounded-xl border border-info text-center">
                            <div className="text-xs text-info font-bold mb-1">YDT Net</div>
                            <div className="text-2xl font-black text-info">
                                {fmt(getAYTAreaNets(latestResult).dilNet)}
                            </div>
                        </div>
                        <div className="bg-brand-soft border border-brand-line rounded-xl p-4 text-center">
                            <div className="text-xs text-brand font-bold mb-1">Toplam Net</div>
                            <div className="text-2xl font-black text-brand">
                                {fmt(displayNet)}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-brand-soft p-4 rounded-xl border border-brand-line text-center">
                            <div className="text-xs text-brand font-bold mb-1">Toplam Puan</div>
                            <div className="text-2xl font-black text-brand">
                                {scoreVal > 0 ? scoreVal.toFixed(3) : '-'}
                            </div>
                        </div>
                        <div className="bg-ok-soft p-4 rounded-xl border border-ok text-center">
                            <div className="text-xs text-ok font-bold mb-1">{displayNetLabel}</div>
                            <div className="text-2xl font-black text-ok">
                                {displayNet > 0 ? fmt(displayNet) : '-'}
                            </div>
                        </div>
                        <div className="bg-ok-soft p-4 rounded-xl border border-ok text-center">
                            <div className="text-xs text-ok font-bold mb-1">OBP Puanı</div>
                            <div className="text-2xl font-black text-ok">
                                {latestResult.obpFound > 0 ? fmt(latestResult.obpFound) : <span className="text-ink-3">-</span>}
                            </div>
                        </div>
                        <div className="bg-warn-soft p-4 rounded-xl border border-warn text-center">
                            <div className="text-xs text-warn font-bold mb-1">Kurum Sırası</div>
                            <div className="text-2xl font-black text-warn">
                                {rankValue ? `#${rankValue}` : '-'}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Puan Tahminleri (YKS/Area) ────────────────────────────── */}
            {areaScores.length > 0 && (
                <div className="on-color mb-8 bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-3xl p-6 text-ink shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Award size={120} />
                    </div>
                    <div className="flex items-center mb-4 relative z-10">
                        <Award className="mr-2" size={24} />
                        <h2 className="text-xl font-bold">Yapay Zeka Puan Tahmini (OBP DAHİL)</h2>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                        {areaScores.map((item, idx) => (
                            <div key={idx} className="bg-surface/10 backdrop-blur-md rounded-2xl p-4 border border-line-2">
                                <div className="text-[10px] font-bold opacity-80 uppercase tracking-wider mb-1">{item.label}</div>
                                <div className="text-2xl font-black">{fmt(item.score, 3)}</div>
                                <div className="text-[10px] opacity-70 mt-1 flex justify-between">
                                    <span>OBP: {fmt(latestResult.obpFound)}</span>
                                    <span>YKS: {fmt(item.score - latestResult.obpFound)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="mt-4 text-[10px] text-brand opacity-80 italic">
                        * Puanlar, OBP ({fmt(latestResult.obpFound)}) eklenmiş olarak hesaplanmıştır. Net katsayıları ÖSYM standartlarına göre tahminidir.
                    </p>
                </div>
            )}

            {/* ── Ders Bazlı Tablo ─────────────────────────────────────── */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-ink mb-4 flex items-center">
                    <BookOpen className="mr-2 text-brand" />
                    Ders Bazlı Detaylı Analiz
                </h2>
                {subjectEntries.length > 0 ? (
                    <table className="w-full text-sm text-left text-ink-2 border border-line rounded-xl overflow-hidden">
                        <thead className="text-xs text-ink-2 uppercase bg-surface-2 border-b">
                            <tr>
                                <th className="px-4 py-3 border-r">Ders</th>
                                <th className="px-4 py-3 border-r text-center text-ok">Doğru</th>
                                <th className="px-4 py-3 border-r text-center text-danger">Yanlış</th>
                                <th className="px-4 py-3 text-center font-bold text-brand">Net</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {subjectEntries.map(([key, stats]) => {
                                const d = parseFloat(stats?.d) || 0;
                                const y = parseFloat(stats?.y) || 0;
                                const net = parseFloat(stats?.net) || 0;
                                const netColor = net > 0 ? 'text-ok' : net < 0 ? 'text-danger' : 'text-ink-3';
                                return (
                                    <tr key={key} className="bg-surface hover:bg-surface-2">
                                        <td className="px-4 py-3 font-medium border-r">{getSubjectLabel(key)}</td>
                                        <td className="px-4 py-3 border-r text-center text-ok font-bold">
                                            {d > 0 ? d : <span className="text-ink-3">-</span>}
                                        </td>
                                        <td className="px-4 py-3 border-r text-center text-danger font-bold">
                                            {y > 0 ? y : <span className="text-ink-3">-</span>}
                                        </td>
                                        <td className={`px-4 py-3 text-center font-black text-lg ${netColor}`}>
                                            {net !== 0 ? fmt(net) : <span className="text-ink-3 text-sm">-</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        {/* Toplam satırı */}
                        <tfoot className="bg-brand-soft border-t-2 border-brand-line">
                            <tr>
                                <td className="px-4 py-3 font-black text-brand border-r" colSpan={3}>
                                    {displayNetLabel}
                                </td>
                                <td className="px-4 py-3 text-center font-black text-xl text-brand">
                                    {displayNet > 0 ? fmt(displayNet) : '-'}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                ) : (
                    <div className="bg-surface-2 rounded-xl p-8 text-center text-ink-3">
                        <p className="font-medium">Ders detayı bulunamadı.</p>
                        <p className="text-xs mt-1">Excel'den yüklenen sonuçlarda ders verileri görünür.</p>
                    </div>
                )}
            </div>

            {/* ── Güçlü / Gelişim Alanları ─────────────────────────────── */}
            <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-ok-soft p-5 rounded-2xl border border-ok">
                    <h3 className="font-bold text-ok mb-3 flex items-center">
                        <CheckCircle size={16} className="mr-2" />
                        Güçlü Dersler
                    </h3>
                    <ul className="text-sm space-y-2 text-ok">
                        {strongSubjects.length > 0 ? strongSubjects.map(([key, stats]) => (
                            <li key={key} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-1.5 h-1.5 bg-ok rounded-full mr-2 flex-shrink-0"></div>
                                    {getSubjectLabel(key)}
                                </div>
                                <span className="font-black text-ok">{fmt(stats?.net)}</span>
                            </li>
                        )) : (
                            <li className="text-ink-3 text-xs">Veri yok</li>
                        )}
                    </ul>
                </div>

                <div className="bg-danger-soft p-5 rounded-2xl border border-danger">
                    <h3 className="font-bold text-danger mb-3 flex items-center">
                        <AlertTriangle size={16} className="mr-2" />
                        Gelişim Alanları
                    </h3>
                    <ul className="text-sm space-y-2 text-danger">
                        {weakSubjects.length > 0 ? weakSubjects.map(([key, stats]) => (
                            <li key={key} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-1.5 h-1.5 bg-danger rounded-full mr-2 flex-shrink-0"></div>
                                    {getSubjectLabel(key)}
                                </div>
                                <span className="font-black text-danger">{fmt(stats?.net)}</span>
                            </li>
                        )) : (
                            <li className="text-ink-3 text-xs">Veri yok</li>
                        )}
                    </ul>
                </div>
            </div>

            {/* ── Dinamik AI Tavsiye ───────────────────────────────────── */}
            <div className="bg-surface-inv text-white p-6 rounded-2xl">
                <h3 className="font-bold text-brand mb-2 flex items-center">
                    <TrendingUp className="mr-2" />
                    Yapay Zeka Koç Tavsiyesi
                </h3>
                <p className="text-sm opacity-90 leading-relaxed">{aiTip}</p>
                <div className="mt-4 pt-4 border-t border-line-2 flex justify-between items-center text-xs text-ink-3">
                    <span>AI Öğrenci Koçu · {examType} Analizi</span>
                    <span>{new Date().toLocaleDateString('tr-TR')}</span>
                </div>
            </div>
        </div>
    );
});

ReportCard.displayName = 'ReportCard';
export default ReportCard;
