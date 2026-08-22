import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { savePDF } from './pdfSave';
import { AMBLEM_BASE64 } from '../data/amblemBase64';
import { MARKA } from '../data/marka';
import { calculateEstimatedScore, getAYTAreaNets, getOBPScore, getAYTMaxScoreArea } from './scoreCalculator';
import { bildir } from '../services/uiGeriBildirim';

// ─── Uygulama Renk Paleti ─────────────────────────────────────────
const COLORS = {
    indigo: [79, 70, 229],  // #4F46E5  – Primary
    indigoDark: [55, 48, 163],  // #3730A3
    indigoLight: [165, 180, 252],  // #A5B4FC
    violet: [139, 92, 246],  // #8B5CF6
    emerald: [16, 185, 129],  // #10B981
    emeraldDark: [5, 150, 105],  // #059669
    rose: [244, 63, 94],   // #F43F5E
    amber: [245, 158, 11],   // #F59E0B
    sky: [14, 165, 233],  // #0EA5E9
    slate50: [248, 250, 252],  // #F8FAFC
    slate100: [241, 245, 249],  // #F1F5F9
    slate200: [226, 232, 240],  // #E2E8F0
    slate400: [148, 163, 184],  // #94A3B8
    slate600: [71, 85, 105],  // #475569
    slate800: [30, 41, 59],   // #1E293B
    white: [255, 255, 255],
    black: [0, 0, 0],
};

// ─── Türkçe → ASCII dönüşümü ──────────────────────────────────────
const t = (text) => {
    if (!text) return '';
    const map = {
        'Ç': 'C', 'ç': 'c', 'Ğ': 'G', 'ğ': 'g', 'İ': 'I', 'ı': 'i',
        'Ö': 'O', 'ö': 'o', 'Ş': 'S', 'ş': 's', 'Ü': 'U', 'ü': 'u',
        'â': 'a', 'î': 'i', 'û': 'u',
    };
    return String(text).split('').map(c => map[c] || c).join('');
};

// ─── Ders Etiketleri ──────────────────────────────────────────────
const LABELS = {
    turkce: 'Turkce', matematik: 'Matematik', mat: 'Matematik',
    geometri: 'Geometri', fizik: 'Fizik', kimya: 'Kimya',
    biyoloji: 'Biyoloji', tarih: 'Tarih', cografya: 'Cografya',
    felsefe: 'Felsefe', din: 'Din Kulturu', edebiyat: 'Edebiyat',
    tarih1: 'Tarih-1', tarih2: 'Tarih-2',
    cografya1: 'Cografya-1', cografya2: 'Cografya-2',
    ayt_matematik: 'Mat (AYT)', ayt_fizik: 'Fizik (AYT)',
    ayt_kimya: 'Kimya (AYT)', ayt_biyoloji: 'Biyoloji (AYT)',
    inkilap: 'Inkilap', ingilizce: 'Ingilizce', fen: 'Fen',
    sosyal: 'Sosyal', fen_toplam: 'Fen Toplam',
    sosyal_toplam: 'Sosyal Toplam', mat_toplam: 'Mat Toplam',
};
const SKIP = ['toplam_genel', 'bilinmeyen', 'fen_mat_toplam', 'edebiyat_toplam',
    'sosyal_ayt_toplam', 'dil_toplam', 'fen_net', 'sosyal_net'];

const label = (key) =>
    LABELS[key] || t(key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));

// ─── Subjects filtrele ────────────────────────────────────────────
const filterSubjects = (subjects = {}) => {
    const keys = Object.keys(subjects);
    const hasFizik = keys.includes('fizik'), hasKimya = keys.includes('kimya'),
        hasBio = keys.includes('biyoloji'), hasTarih = keys.includes('tarih'),
        hasCog = keys.includes('cografya'), hasFels = keys.includes('felsefe'),
        hasDin = keys.includes('din'), hasMat = keys.includes('matematik'),
        hasGeo = keys.includes('geometri');
    const fenSub = hasFizik || hasKimya || hasBio, sosyalSub = hasTarih || hasCog || hasFels || hasDin;
    const matSub = hasMat && hasGeo;
    return Object.entries(subjects).filter(([k, v]) => {
        if (SKIP.includes(k) || k === 'bilinmeyen') return false;
        if (fenSub && (k === 'fen' || k === 'fen_toplam')) return false;
        if (sosyalSub && (k === 'sosyal' || k === 'sosyal_toplam')) return false;
        if (matSub && k === 'mat_toplam') return false;
        if (k === 'mat' && keys.includes('matematik')) return false;
        const d = parseFloat(v?.d) || 0, y = parseFloat(v?.y) || 0, n = parseFloat(v?.net) || 0;
        return (d + y + Math.abs(n)) > 0;
    });
};

// ─── İstatistik ───────────────────────────────────────────────────
const calcStats = (vals) => {
    if (!vals?.length) return { avg: 0, max: 0, min: 0, std: 0 };
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return {
        avg: +avg.toFixed(2),
        max: +Math.max(...vals).toFixed(2),
        min: +Math.min(...vals).toFixed(2),
        std: +(Math.sqrt(vals.reduce((s, v) => s + (v - avg) ** 2, 0) / vals.length)).toFixed(2),
    };
};

// ─── Yardımcı: köşeli rect (rounded simulation) ───────────────────
const roundedRect = (doc, x, y, w, h, fill, stroke = false) => {
    const r = 3;
    doc.setFillColor(...fill);
    if (stroke) doc.setDrawColor(...COLORS.slate200);
    doc.roundedRect(x, y, w, h, r, r, stroke ? 'FD' : 'F');
};

// ─── Yardımcı: section başlık çizgisi ────────────────────────────
const sectionTitle = (doc, text, y) => {
    doc.setFillColor(...COLORS.indigo);
    doc.rect(14, y, 4, 6, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.slate800);
    doc.text(text, 21, y + 5);
    doc.setFont('helvetica', 'normal');
    return y + 11;
};

// ─── Yardımcı: horizontal bar (mini) ─────────────────────────────
const miniBar = (doc, x, y, w, h, value, maxValue, color) => {
    doc.setFillColor(...COLORS.slate100);
    doc.roundedRect(x, y, w, h, 1, 1, 'F');
    const fillW = Math.max((value / Math.max(maxValue, 1)) * w, value > 0 ? 3 : 0);
    doc.setFillColor(...color);
    doc.roundedRect(x, y, fillW, h, 1, 1, 'F');
};

// ─── Yardımcı: page footer ────────────────────────────────────────
const addFooters = (doc, leftText) => {
    const count = doc.internal.getNumberOfPages();
    for (let i = 1; i <= count; i++) {
        doc.setPage(i);
        doc.setFillColor(...COLORS.slate100);
        doc.rect(0, 285, 210, 12, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.slate400);
        doc.text(t(leftText), 14, 291);
        doc.text(`Sayfa ${i} / ${count}`, 196, 291, { align: 'right' });
        /* Alt bilgide amblem + ad — resmî evrak değil, koçluk çıktısı
           olduğu belli olsun. */
        try {
            doc.addImage(AMBLEM_BASE64, 'PNG', 97, 287, 6, 6);
        } catch { /* amblemsiz de basılabilir */ }
        doc.setFont('helvetica', 'bold');
        doc.text(t(MARKA.tamAd), 105, 291.5, { align: 'left' });
        doc.setFont('helvetica', 'normal');
    }
};

// ─── Yardımcı: stat kutu (karne üstü) ────────────────────────────
const statBox = (doc, x, y, w, h, topLabel, mainValue, subLabel, bgColor) => {
    roundedRect(doc, x, y, w, h, bgColor);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text(topLabel, x + w / 2, y + 6, { align: 'center' });
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text(String(mainValue), x + w / 2, y + h - 6, { align: 'center' });
    if (subLabel) {
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.text(subLabel, x + w / 2, y + h - 1, { align: 'center' });
    }
    doc.setFont('helvetica', 'normal');
};

// ═══════════════════════════════════════════════════════════════════
//  1. TOPLU SINIF RAPORU  (generateBulkExamReport)
// ═══════════════════════════════════════════════════════════════════
export const generateBulkExamReport = (trial, exams, students) => {
    try {
        if (!trial || !exams || exams.length === 0) {
            bildir('Rapor olusturmak icin veri bulunamadi.'); return;
        }
        const doc = new jsPDF({ compress: true });
        const examType = trial.examType || 'TYT';
        const trialName = t(trial.name || 'Deneme Sinavi');
        const dateStr = trial.date || new Date().toLocaleDateString('tr-TR');

        doc.setFillColor(...COLORS.indigoDark);
        doc.rect(0, 0, 210, 42, 'F');
        doc.setFillColor(...COLORS.indigo);
        doc.rect(0, 18, 210, 30, 'F');
        doc.setFillColor(...COLORS.violet);
        doc.rect(0, 0, 6, 48, 'F');
        /* Amblem, başlık şeridinin soluna. Beyaz zeminli olduğu için
           koyu şeritte kaybolmasın diye altına beyaz daire konuyor. */
        doc.setFillColor(...COLORS.white);
        doc.circle(20, 14, 8.5, 'F');
        try {
            doc.addImage(AMBLEM_BASE64, 'PNG', 13, 7, 14, 14);
        } catch { /* amblem basılamazsa rapor yine üretilsin */ }
        doc.setFontSize(18);
        doc.setTextColor(...COLORS.white);
        doc.setFont('helvetica', 'bold');
        doc.text(trialName, 32, 16);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.indigoLight);
        doc.text(`TOPLU SINIF ANALIZ RAPORU  •  ${examType}  •  ${exams.length} Ogrenci`, 32, 24);
        roundedRect(doc, 150, 6, 50, 12, COLORS.indigoDark);
        doc.setFontSize(7.5);
        doc.text('TARIH', 175, 11, { align: 'center' });
        doc.setFontSize(8.5);
        doc.setTextColor(...COLORS.white);
        doc.setFont('helvetica', 'bold');
        doc.text(t(dateStr), 175, 16, { align: 'center' });

        let yPos = 52;
        const getTotalNetLocalCount = (e) => {
            const n = parseFloat(e.totalNet) || parseFloat(e.tyt) || 0;
            if (n > 0) return n;
            if (e.subjects) return Object.values(e.subjects).reduce((s, v) => s + (parseFloat(v?.net) || 0), 0);
            return 0;
        };
        const scores = exams.map(e => getTotalNetLocalCount(e));
        const st = calcStats(scores);
        const summaries = [
            { label: 'KATILIMCI', value: exams.length, sub: 'ogrenci', color: COLORS.indigo },
            { label: 'SINIF ORT.', value: st.avg, sub: 'toplam net', color: COLORS.violet },
            { label: 'EN YUKSEK', value: st.max, sub: 'net', color: COLORS.emerald },
            { label: 'EN DUSUK', value: st.min, sub: 'net', color: COLORS.amber },
        ];
        summaries.forEach((s, i) => statBox(doc, 14 + i * 46.5, yPos, 44, 24, s.label, s.value, s.sub, s.color));
        yPos += 32;

        yPos = sectionTitle(doc, 'NET DAGILIMI', yPos);
        const ranges = [
            { min: 0, max: 20, label: '0 - 20', color: COLORS.rose },
            { min: 20, max: 40, label: '20 - 40', color: COLORS.amber },
            { min: 40, max: 60, label: '40 - 60', color: COLORS.sky },
            { min: 60, max: 80, label: '60 - 80', color: COLORS.emerald },
            { min: 80, max: 999, label: '80+', color: COLORS.indigo },
        ];
        const distData = ranges.map(r => ({ label: r.label, value: scores.filter(s => s >= r.min && s < r.max).length, color: r.color }));
        const maxDist = Math.max(...distData.map(d => d.value), 1);
        distData.forEach((d, i) => {
            const rowY = yPos + i * 9;
            doc.setFontSize(8); doc.setTextColor(...COLORS.slate600); doc.text(d.label, 14, rowY + 5.5);
            miniBar(doc, 42, rowY + 1, 120, 6, d.value, maxDist, d.color);
            doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.slate800); doc.text(`${d.value} ogrenci`, 166, rowY + 5.5);
        });
        yPos += 55;

        yPos = sectionTitle(doc, 'SINAV SONUC LISTESI', yPos);
        const sorted = [...exams].sort((a, b) => {
            const pa = typeof calculateEstimatedScore === 'function' ? calculateEstimatedScore(a) : 0;
            const pb = typeof calculateEstimatedScore === 'function' ? calculateEstimatedScore(b) : 0;
            return pb - pa || getTotalNetLocalCount(b) - getTotalNetLocalCount(a);
        });

        const headerRow = ['#', 'Ogrenci', 'Sinif', 'Top.Net', 'OBP', 'Puan'];
        const tableRows = sorted.map((res, i) => {
            const obpRaw = localStorage.getItem('v2_obp_data');
            const obpData = (obpRaw && obpRaw !== 'undefined') ? JSON.parse(obpRaw) : {};
            const context = { students, obpData };
            let obp = parseFloat(res.obpScore) || 0;
            if (obp === 0) obp = getOBPScore(res.student || res.name || '', res.number || res.schoolNumber, context);
            const puan = typeof calculateEstimatedScore === 'function' ? calculateEstimatedScore(res, context) : 0;
            return [i + 1, t(res.student || '-').substring(0, 20), res.grade || '-', getTotalNetLocalCount(res).toFixed(1), obp.toFixed(2), puan.toFixed(2)];
        });

        doc.autoTable({
            head: [headerRow], body: tableRows, startY: yPos, theme: 'grid',
            headStyles: { fillColor: COLORS.indigoDark, fontSize: 7 },
            styles: { fontSize: 7, halign: 'center' },
            columnStyles: { 1: { halign: 'left' } }
        });

        addFooters(doc, `${trialName} Sonuclari`);
        savePDF(doc, `${t(trialName)}_Toplu_Rapor`);
    } catch (e) { console.error(e); }
};

// ═══════════════════════════════════════════════════════════════════
//  2. BİREYSEL ÖĞRENCİ KARNESİ  (generateStudentReport)
// ═══════════════════════════════════════════════════════════════════
export const generateStudentReport = (student, trial, allExams = []) => {
    try {
        if (!student) return;
        const doc = new jsPDF({ compress: true });
        const examType = trial?.examType || student.examType || 'TYT';
        const studentName = t(student.student || 'Bilinmeyen');
        const trialName = t(trial?.name || 'Deneme Sinavi');
        const dateStr = trial?.date || new Date().toLocaleDateString('tr-TR');

        doc.setFillColor(...COLORS.slate800); doc.rect(0, 0, 210, 50, 'F');
        doc.setFillColor(...COLORS.indigo); doc.rect(0, 28, 210, 22, 'F');
        doc.setFillColor(...COLORS.violet); doc.rect(0, 0, 6, 50, 'F');
        /* Baş harf dairesi öğrenciyi işaret ettiği için korunuyor;
           marka ambleme sağ üst köşeye, adı da yanına konuyor. */
        doc.setFillColor(...COLORS.violet); doc.circle(22, 18, 10, 'F');
        doc.setFontSize(9); doc.setTextColor(...COLORS.white); doc.setFont('helvetica', 'bold');
        doc.text(studentName.substring(0, 2).toUpperCase(), 22, 21, { align: 'center' });
        doc.setFontSize(15); doc.text(studentName, 36, 16);
        doc.setFontSize(10); doc.text(trialName, 36, 36);
        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.indigoLight);
        doc.text(`${t(examType)} SINAVI  •  ${t(dateStr)}`, 36, 42);

        doc.setFillColor(...COLORS.white); doc.circle(191, 14, 7.5, 'F');
        try {
            doc.addImage(AMBLEM_BASE64, 'PNG', 185, 8, 12, 12);
        } catch { /* amblem basılamazsa rapor yine üretilsin */ }
        doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.white);
        doc.text(t(MARKA.tamAd), 191, 25, { align: 'center' });

        let yPos = 58;
        const getTotalNetLocal = (s) => (parseFloat(s.totalNet) || parseFloat(s.tyt) || Object.values(s.subjects || {}).reduce((a, b) => a + (parseFloat(b?.net) || 0), 0));
        const totalNet = getTotalNetLocal(student);
        
        const obpRaw = localStorage.getItem('v2_obp_data');
        const obpData = (obpRaw && obpRaw !== 'undefined') ? JSON.parse(obpRaw) : {};
        const context = { students: allExams, obpData };
        let obpVal = parseFloat(student.obpScore) || 0;
        if (obpVal === 0) obpVal = getOBPScore(student.student || student.name || '', student.number || student.schoolNumber, context);
        const estScore = typeof calculateEstimatedScore === 'function' ? calculateEstimatedScore(student, context) : 0;

        statBox(doc, 14, yPos, 45, 26, 'TOPLAM NET', totalNet.toFixed(2), '', COLORS.indigo);
        statBox(doc, 61, yPos, 45, 26, 'YKS PUAN', estScore.toFixed(3), 'OBP DAHIL', COLORS.violet);
        statBox(doc, 108, yPos, 45, 26, 'OBP PUANI', obpVal.toFixed(2), '', COLORS.emerald);

        yPos += 35;
        yPos = sectionTitle(doc, 'DERS BAZINDA DETAYLI SONUCLAR', yPos);
        const subjectEntries = filterSubjects(student.subjects || {});
        
        if (subjectEntries.length > 0) {
            const tableRows = subjectEntries.map(([k, v]) => [
                label(k), parseFloat(v?.d || 0), parseFloat(v?.y || 0), parseFloat(v?.net || 0).toFixed(2)
            ]);
            doc.autoTable({
                head: [['Ders', 'D', 'Y', 'Net']], body: tableRows, startY: yPos, theme: 'grid',
                headStyles: { fillColor: COLORS.slate800 }, styles: { fontSize: 8.5 }
            });
            yPos = doc.lastAutoTable.finalY + 10;
        }

        // ── GELİŞİM ÖNERİLERİ ─────────────────────────────────────
        if (yPos > 210) { doc.addPage(); yPos = 18; }
        const strategyTitle = (examType === 'LGS' ? 'LGS' : 'YKS') + ' SINAV STRATEJISI VE GELISIM ONERILERI';
        yPos = sectionTitle(doc, t(strategyTitle), yPos);

        const weights = {
            turkce: 40, tyt_turkce: 40, matematik: 40, mat: 40, ayt_matematik: 40, ayt_mat: 40,
            edebiyat: 24, tarih1: 10, cografya1: 6, fizik: 14, kimya: 13, biyoloji: 13,
            ayt_fizik: 14, ayt_kimya: 13, ayt_biyoloji: 13, yabanci_dil: 80, dil: 80, ydt: 80
        };

        const prioritizedSubs = [...subjectEntries].map(([k, v]) => {
            const net = parseFloat(v?.net) || 0;
            const maxQ = weights[k] || 10;
            const priorityScore = (maxQ - net) * (maxQ / 40);
            return { label: label(k), net, maxQ, priorityScore, successRate: maxQ > 0 ? (net/maxQ)*100 : 0 };
        }).sort((a, b) => b.priorityScore - a.priorityScore);

        const strong = [...subjectEntries].sort((a,b) => (parseFloat(b[1]?.net)||0)-(parseFloat(a[1]?.net)||0))[0];
        const strongLabel = strong ? label(strong[0]) : null;
        const focus1 = prioritizedSubs[0];
        const tips = [];
        
        if (focus1) {
            if (focus1.maxQ >= 30 && focus1.successRate < 25) {
                tips.push({ icon: '★', text: `${focus1.label} dersinde yuksek bir potansiyeliniz var. Buradaki gelisim, toplam puaninizi cok hizli yukseltecektir.` });
            } else {
                tips.push({ icon: '★', text: `${focus1.label} dersindeki eksiklerini gidererek sinavda daha avantajli bir konuma gelebilirsin.` });
            }
        }
        if (examType.includes('TYT')) {
            tips.push({ icon: '✓', text: 'TYT stratejisinde Turkce ve Matematik amiral gemisidir. Bu iki blogu yuksek tutmak buyuk avantaj saglar.' });
        }
        tips.push({ icon: '✓', text: 'Soru sayisi nispeten az olan branslardaki her net, ozellikle siralama yarisinda sizi rakiplerinizden ayiracak degerli bir farktir.' });

        roundedRect(doc, 14, yPos, 182, tips.length * 11 + 6, COLORS.slate50);
        tips.forEach((tip, i) => {
            const iy = yPos + 8 + i * 11;
            doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...COLORS.amber);
            doc.text(tip.icon, 20, iy);
            doc.setFont('helvetica', 'normal'); doc.setTextColor(...COLORS.slate800);
            doc.text(t(tip.text), 26, iy, { maxWidth: 166 });
        });
        yPos += tips.length * 11 + 14;

        if (subjectEntries.length >= 2 && yPos < 252) {
            roundedRect(doc, 14, yPos, 88, 12, COLORS.emerald);
            doc.setFontSize(8); doc.setTextColor(...COLORS.white); doc.text(t(`Guclu: ${strongLabel || '-'}`), 58, yPos + 8, { align: 'center' });
            roundedRect(doc, 108, yPos, 88, 12, COLORS.rose);
            doc.text(t(`Gelisim: ${focus1?.label || '-'}`), 152, yPos + 8, { align: 'center' });
        }

        addFooters(doc, `${studentName} Raporu`);
        savePDF(doc, `${studentName}_Karnesi`);
    } catch (e) { console.error(e); }
};
