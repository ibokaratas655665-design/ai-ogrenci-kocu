import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { savePDF } from './pdfSave';

// Türkçe karakter desteği
const turkishToEnglish = (text) => {
    if (!text) return '';
    const charMap = {
        'Ç': 'C', 'ç': 'c', 'Ğ': 'G', 'ğ': 'g',
        'İ': 'I', 'ı': 'i', 'Ö': 'O', 'ö': 'o',
        'Ş': 'S', 'ş': 's', 'Ü': 'U', 'ü': 'u'
    };
    return String(text).split('').map(char => charMap[char] || char).join('');
};

// Helper: Draw line chart
const drawLineChart = (doc, data, x, y, width, height, title, yAxisLabel = '') => {
    if (!data || data.length === 0) return;

    // Title
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(title, x + width / 2, y - 5, { align: 'center' });

    // Border and axes
    doc.setDrawColor(200);
    doc.rect(x, y, width, height);
    doc.line(x, y + height, x + width, y + height); // x-axis
    doc.line(x, y, x, y + height); // y-axis

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;
    const padding = height * 0.1;

    // Plot points and lines
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(1.5);

    const points = data.map((item, index) => {
        const relativeValue = (item.value - minValue) / range;
        const plotX = x + (index / (data.length - 1 || 1)) * width;
        const plotY = y + height - padding - (relativeValue * (height - 2 * padding));
        return { x: plotX, y: plotY, value: item.value };
    });

    // Draw lines
    for (let i = 0; i < points.length - 1; i++) {
        doc.line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
    }

    // Draw points
    doc.setFillColor(79, 70, 229);
    points.forEach(point => {
        doc.circle(point.x, point.y, 1, 'F');
    });

    // Labels
    doc.setFontSize(7);
    doc.setTextColor(100);
    data.forEach((item, index) => {
        const labelText = turkishToEnglish(item.label || '');
        doc.text(labelText, points[index].x, y + height + 5, { align: 'center', maxWidth: width / data.length });
    });

    // Values on points
    doc.setFontSize(8);
    doc.setTextColor(79, 70, 229);
    points.forEach(point => {
        doc.text(point.value.toString(), point.x, point.y - 3, { align: 'center' });
    });

    doc.setLineWidth(0.1);
};

// Helper: Draw multi-line chart
const drawMultiLineChart = (doc, datasets, x, y, width, height, title, labels) => {
    if (!datasets || datasets.length === 0) return;

    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(title, x + width / 2, y - 5, { align: 'center' });

    doc.setDrawColor(200);
    doc.rect(x, y, width, height);

    // Find global max/min
    const allValues = datasets.flatMap(ds => ds.data.map(d => d.value));
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    const range = maxValue - minValue || 1;
    const padding = height * 0.1;

    const colors = [
        [79, 70, 229],   // Indigo
        [16, 185, 129],  // Green
        [239, 68, 68],   // Red
        [245, 158, 11]   // Orange
    ];

    // Draw each dataset
    datasets.forEach((dataset, dsIndex) => {
        const color = colors[dsIndex % colors.length];
        doc.setDrawColor(...color);
        doc.setLineWidth(1.5);

        const points = dataset.data.map((item, index) => {
            const relativeValue = (item.value - minValue) / range;
            const plotX = x + (index / (dataset.data.length - 1 || 1)) * width;
            const plotY = y + height - padding - (relativeValue * (height - 2 * padding));
            return { x: plotX, y: plotY };
        });

        for (let i = 0; i < points.length - 1; i++) {
            doc.line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
        }

        doc.setFillColor(...color);
        points.forEach(point => {
            doc.circle(point.x, point.y, 0.8, 'F');
        });
    });

    // Labels
    if (labels && labels.length > 0) {
        doc.setFontSize(7);
        doc.setTextColor(100);
        const labelX = x;
        labels.forEach((item, index) => {
            const labelText = turkishToEnglish(item || '');
            const plotX = x + (index / (labels.length - 1 || 1)) * width;
            doc.text(labelText, plotX, y + height + 5, { align: 'center', maxWidth: width / labels.length });
        });
    }

    // Legend
    doc.setFontSize(8);
    const legendX = x + width + 5;
    datasets.forEach((dataset, index) => {
        const color = colors[index % colors.length];
        const legendY = y + 10 + (index * 8);

        doc.setFillColor(...color);
        doc.rect(legendX, legendY - 2, 4, 4, 'F');

        doc.setTextColor(0);
        doc.text(turkishToEnglish(dataset.name || `Seri ${index + 1}`), legendX + 6, legendY + 2);
    });

    doc.setLineWidth(0.1);
};

// ==============================================
// 1. ÖĞRENCİ GELİŞİM RAPORU (Tüm Denemeler)
// ==============================================
export const generateStudentProgressReport = (studentId, trials, allExams, studentName = 'Ogrenci') => {
    try {
        console.log('Öğrenci gelişim raporu oluşturuluyor...', { studentId, trialsCount: trials?.length });

        if (!trials || trials.length < 2) {
            alert('Gelişim raporu için en az 2 deneme gereklidir.');
            return;
        }

        // Filter student's exams
        const studentExams = allExams.filter(e =>
            e.studentId === studentId || e.student === studentName
        );

        if (studentExams.length < 2) {
            alert('Bu öğrenci için yeterli deneme verisi bulunamadı.');
            return;
        }

        const doc = new jsPDF();
        let yPos = 20;

        // ============ KAPAK ============
        doc.setFillColor(79, 70, 229);
        doc.rect(0, 0, 210, 60, 'F');

        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.text('OGRENCI GELISIM RAPORU', 105, 28, { align: 'center' });

        doc.setFontSize(14);
        doc.text(turkishToEnglish(studentName), 105, 42, { align: 'center' });

        doc.setFontSize(11);
        doc.text(`${studentExams.length} Deneme | ${trials[0]?.date || ''} - ${trials[trials.length - 1]?.date || ''}`, 105, 52, { align: 'center' });

        yPos = 75;

        // ============ GENEL ÖZET ============
        doc.setFontSize(14);
        doc.setTextColor(79, 70, 229);
        doc.text('GENEL OZET', 14, yPos);
        yPos += 8;

        const scores = studentExams.map(e => parseFloat(e.total) || parseFloat(e.tyt) || 0);
        const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
        const maxScore = Math.max(...scores).toFixed(2);
        const minScore = Math.min(...scores).toFixed(2);
        const improvement = ((scores[scores.length - 1] - scores[0]) / scores[0] * 100).toFixed(1);

        const boxes = [
            { label: 'Deneme Sayisi', value: studentExams.length },
            { label: 'Ortalama Net', value: avgScore },
            { label: 'En İyi', value: maxScore },
            { label: 'Gelisim', value: `%${improvement}` }
        ];

        const boxWidth = 45;
        const boxHeight = 20;
        boxes.forEach((box, i) => {
            const x = 14 + (i * (boxWidth + 2));
            doc.setFillColor(249, 250, 251);
            doc.setDrawColor(200);
            doc.rect(x, yPos, boxWidth, boxHeight, 'FD');

            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text(box.label, x + boxWidth / 2, yPos + 8, { align: 'center' });

            doc.setFontSize(13);
            doc.setTextColor(0);
            doc.text(box.value.toString(), x + boxWidth / 2, yPos + 16, { align: 'center' });
        });

        yPos += 30;

        // ============ DENEME BAZINDA GELİŞİM GRAFİĞİ ============
        doc.setFontSize(12);
        doc.setTextColor(79, 70, 229);
        doc.text('DENEME BAZINDA NET GELISIMI', 14, yPos);
        yPos += 5;

        const progressData = studentExams.map((exam, index) => {
            const trial = trials.find(t => t.id === exam.trialId);
            return {
                label: `D${index + 1}`,
                value: parseFloat(exam.total) || parseFloat(exam.tyt) || 0
            };
        });

        drawLineChart(doc, progressData, 14, yPos, 180, 45, '', 'Net');
        yPos += 60;

        // ============ DERS BAZINDA GELİŞİM ============
        doc.setFontSize(12);
        doc.setTextColor(79, 70, 229);
        doc.text('DERS BAZINDA PERFORMANS TRENDI', 14, yPos);
        yPos += 5;

        const subjects = ['turkce', 'mat', 'fen', 'sosyal'];
        const subjectLabels = ['Turkce', 'Matematik', 'Fen', 'Sosyal'];
        const trialLabels = studentExams.map((_, i) => `D${i + 1}`);

        const subjectDatasets = subjects.map((key, index) => ({
            name: subjectLabels[index],
            data: studentExams.map((exam, i) => ({
                label: `D${i + 1}`,
                value: exam.subjects?.[key]?.net || 0
            }))
        }));

        drawMultiLineChart(doc, subjectDatasets, 14, yPos, 150, 50, '', trialLabels);
        yPos += 65;

        // New page if needed
        if (yPos > 240) {
            doc.addPage();
            yPos = 20;
        }

        // ============ PERFORMANS TABLOSU ============
        doc.setFontSize(12);
        doc.setTextColor(79, 70, 229);
        doc.text('DETAYLI PERFORMANS TABLOSU', 14, yPos);
        yPos += 5;

        const tableRows = studentExams.map((exam, index) => {
            const trial = trials.find(t => t.id === exam.trialId);
            return [
                index + 1,
                turkishToEnglish(trial?.name || `Deneme ${index + 1}`),
                trial?.date || '-',
                exam.subjects?.turkce?.net || '-',
                exam.subjects?.mat?.net || '-',
                exam.subjects?.fen?.net || '-',
                exam.subjects?.sosyal?.net || '-',
                exam.total || exam.tyt || '-'
            ];
        });

        doc.autoTable({
            head: [['#', 'Deneme', 'Tarih', 'Turkce', 'Mat', 'Fen', 'Sosyal', 'Toplam']],
            body: tableRows,
            startY: yPos,
            theme: 'striped',
            headStyles: { fillColor: [79, 70, 229], fontSize: 9 },
            styles: { fontSize: 8 }
        });

        yPos = doc.lastAutoTable.finalY + 15;

        // ============ KUVVETLI/ZAYIF YÖNLER ============
        doc.setFontSize(12);
        doc.setTextColor(79, 70, 229);
        doc.text('KUVVETLI VE ZAYIF YONLER', 14, yPos);
        yPos += 8;

        const subjectAvgs = subjects.map((key, index) => {
            const nets = studentExams.map(e => e.subjects?.[key]?.net || 0);
            const avg = nets.reduce((a, b) => a + b, 0) / nets.length;
            return { subject: subjectLabels[index], avg: avg.toFixed(1) };
        }).sort((a, b) => b.avg - a.avg);

        doc.setFontSize(10);
        doc.setTextColor(16, 185, 129);
        doc.text(`Kuvvetli Ders: ${subjectAvgs[0].subject} (Ort: ${subjectAvgs[0].avg})`, 14, yPos);

        doc.setTextColor(239, 68, 68);
        doc.text(`Gelismesi Gereken: ${subjectAvgs[subjectAvgs.length - 1].subject} (Ort: ${subjectAvgs[subjectAvgs.length - 1].avg})`, 14, yPos + 8);

        // ============ FOOTER ============
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Sayfa ${i} / ${pageCount}`, 105, 285, { align: 'center' });
            doc.text('AI Ogrenci Kocu - Gelisim Takip Sistemi', 105, 290, { align: 'center' });
        }

        const fileName = `${turkishToEnglish(studentName)}_Gelisim_Raporu`;
        savePDF(doc, fileName);
        console.log('Öğrenci gelişim raporu oluşturuldu:', fileName);
    } catch (error) {
        console.error('PDF oluşturma hatası:', error);
        alert(`PDF oluşturulurken hata: ${error.message}`);
    }
};

// ==============================================
// 2. SINIF GELİŞİM RAPORU (Tüm Denemeler)
// ==============================================
export const generateClassProgressReport = (trials, allExams) => {
    try {
        console.log('Sınıf gelişim raporu oluşturuluyor...', { trialsCount: trials?.length });

        if (!trials || trials.length < 2) {
            alert('Sınıf gelişim raporu için en az 2 deneme gereklidir.');
            return;
        }

        const doc = new jsPDF();
        let yPos = 20;

        // ============ KAPAK ============
        doc.setFillColor(16, 185, 129);
        doc.rect(0, 0, 210, 60, 'F');

        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.text('SINIF GELISIM RAPORU', 105, 28, { align: 'center' });

        doc.setFontSize(14);
        doc.text('TUM DENEMELER KAPSAMLI ANALIZ', 105, 42, { align: 'center' });

        doc.setFontSize(11);
        doc.text(`${trials.length} Deneme | ${trials[0]?.date || ''} - ${trials[trials.length - 1]?.date || ''}`, 105, 52, { align: 'center' });

        yPos = 75;

        // ============ GENEL BAŞARI TRENDİ ============
        doc.setFontSize(14);
        doc.setTextColor(16, 185, 129);
        doc.text('GENEL BASARI TRENDI', 14, yPos);
        yPos += 5;

        const trendData = trials.map((trial, index) => {
            const trialExams = allExams.filter(e => e.trialId === trial.id);
            const avg = trialExams.reduce((acc, e) => acc + (parseFloat(e.total) || parseFloat(e.tyt) || 0), 0) / (trialExams.length || 1);
            return {
                label: `D${index + 1}`,
                value: parseFloat(avg.toFixed(2))
            };
        });

        drawLineChart(doc, trendData, 14, yPos, 180, 45, 'Sinif Ortalamasi (Net)', '');
        yPos += 60;

        // ============ DERS BAZINDA GELİŞİM ============
        doc.setFontSize(14);
        doc.setTextColor(16, 185, 129);
        doc.text('DERS BAZINDA SINIF GELISIMI', 14, yPos);
        yPos += 5;

        const subjects = ['turkce', 'mat', 'fen', 'sosyal'];
        const subjectLabels = ['Turkce', 'Matematik', 'Fen', 'Sosyal'];
        const trialLabels = trials.map((_, i) => `D${i + 1}`);

        const classSubjectDatasets = subjects.map((key, index) => ({
            name: subjectLabels[index],
            data: trials.map((trial, i) => {
                const trialExams = allExams.filter(e => e.trialId === trial.id);
                const avg = trialExams.reduce((acc, e) => acc + (e.subjects?.[key]?.net || 0), 0) / (trialExams.length || 1);
                return {
                    label: `D${i + 1}`,
                    value: parseFloat(avg.toFixed(1))
                };
            })
        }));

        drawMultiLineChart(doc, classSubjectDatasets, 14, yPos, 150, 50, '', trialLabels);
        yPos += 65;

        // ============ DENEME KARŞILAŞTIRMA TABLOSU ============
        doc.addPage();
        yPos = 20;

        doc.setFontSize(14);
        doc.setTextColor(16, 185, 129);
        doc.text('DENEME KARSILASTIRMA TABLOSU', 14, yPos);
        yPos += 5;

        const comparisonRows = trials.map((trial, index) => {
            const trialExams = allExams.filter(e => e.trialId === trial.id);
            const scores = trialExams.map(e => parseFloat(e.total) || parseFloat(e.tyt) || 0);
            const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
            const max = Math.max(...scores).toFixed(2);
            const min = Math.min(...scores).toFixed(2);

            return [
                turkishToEnglish(trial.name || `Deneme ${index + 1}`),
                trial.date || '-',
                trialExams.length,
                avg,
                max,
                min
            ];
        });

        doc.autoTable({
            head: [['Deneme', 'Tarih', 'Katilimci', 'Ortalama', 'En Yuksek', 'En Dusuk']],
            body: comparisonRows,
            startY: yPos,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] },
            styles: { fontSize: 10 }
        });

        yPos = doc.lastAutoTable.finalY + 15;

        // ============ EN ÇOK GELİŞEN ÖĞRENCİLER ============
        doc.setFontSize(14);
        doc.setTextColor(16, 185, 129);
        doc.text('EN COK GELISEN OGRENCILER', 14, yPos);
        yPos += 5;

        // Calculate improvement for each student (FIXED: chronological order)
        const studentProgressByTrial = {};
        allExams.forEach(exam => {
            const key = exam.student || exam.studentId;
            if (!studentProgressByTrial[key]) {
                studentProgressByTrial[key] = [];
            }
            studentProgressByTrial[key].push({
                trialId: exam.trialId,
                score: parseFloat(exam.total) || parseFloat(exam.tyt) || 0
            });
        });

        // Sort each student's exams by trial chronologically
        Object.keys(studentProgressByTrial).forEach(student => {
            studentProgressByTrial[student].sort((a, b) => {
                const trialIndexA = trials.findIndex(t => t.id === a.trialId);
                const trialIndexB = trials.findIndex(t => t.id === b.trialId);
                return trialIndexA - trialIndexB;
            });
        });

        // Calculate improvement: last trial - first trial
        const improvements = Object.entries(studentProgressByTrial)
            .filter(([_, exams]) => exams.length >= 2)
            .map(([name, exams]) => ({
                name: turkishToEnglish(name),
                firstScore: exams[0].score,
                lastScore: exams[exams.length - 1].score,
                improvement: exams[exams.length - 1].score - exams[0].score,
                count: exams.length
            }))
            .sort((a, b) => b.improvement - a.improvement)
            .slice(0, 10);

        const improvementRows = improvements.map((item, i) => [
            i + 1,
            item.name,
            item.firstScore.toFixed(1),
            item.lastScore.toFixed(1),
            item.improvement > 0 ? `+${item.improvement.toFixed(1)}` : item.improvement.toFixed(1),
            item.count
        ]);

        if (improvementRows.length > 0) {
            doc.autoTable({
                head: [['Sira', 'Ogrenci', 'Ilk', 'Son', 'Gelisim', 'Deneme']],
                body: improvementRows,
                startY: yPos,
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129] },
                styles: { fontSize: 10 },
                columnStyles: {
                    4: { fontStyle: 'bold', textColor: [16, 185, 129] }
                }
            });
        } else {
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text('Gelisim verisi icin yeterli deneme bulunamadi.', 14, yPos);
        }

        // ============ FOOTER ============
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Sayfa ${i} / ${pageCount}`, 105, 285, { align: 'center' });
            doc.text('AI Ogrenci Kocu - Sinif Analiz Sistemi', 105, 290, { align: 'center' });
        }

        const fileName = 'Sinif_Gelisim_Raporu';
        savePDF(doc, fileName);
        console.log('Sınıf gelişim raporu oluşturuldu:', fileName);
    } catch (error) {
        console.error('PDF oluşturma hatası:', error);
        alert(`PDF oluşturulurken hata: ${error.message}`);
    }
};

// ==============================================
// 3. OKUL GENELİ RAPOR (Executive Summary + Sınıf Bazlı)
// ==============================================
export const generateSchoolReport = (trials, allExams, students) => {
    try {
        console.log('Okul geneli rapor oluşturuluyor...', { trialsCount: trials?.length });

        if (!trials || trials.length === 0) {
            alert('Okul raporu için deneme verisi bulunamadı.');
            return;
        }

        const doc = new jsPDF();
        let yPos = 20;

        // ============ KAPAK (Executive) ============
        doc.setFillColor(139, 92, 246);
        doc.rect(0, 0, 210, 80, 'F');

        doc.setFontSize(26);
        doc.setTextColor(255, 255, 255);
        doc.text('OKUL GENELI', 105, 32, { align: 'center' });
        doc.text('ANALIZ RAPORU', 105, 45, { align: 'center' });

        doc.setFontSize(12);
        doc.text('Executive Summary & Comprehensive Analysis', 105, 60, { align: 'center' });

        doc.setFontSize(10);
        doc.text(`Raporlama Donemi: ${trials[0]?.date || ''} - ${trials[trials.length - 1]?.date || ''}`, 105, 70, { align: 'center' });

        yPos = 95;

        // ============ EXECUTIVE SUMMARY ============
        doc.setFontSize(16);
        doc.setTextColor(139, 92, 246);
        doc.text('EXECUTIVE SUMMARY', 14, yPos);
        yPos += 10;

        const totalStudents = students?.length || new Set(allExams.map(e => e.student)).size;
        const totalExams = trials.length;
        const totalParticipations = allExams.length;
        const allScores = allExams.map(e => parseFloat(e.total) || parseFloat(e.tyt) || 0);
        const overallAvg = (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2);

        const summaryBoxes = [
            { label: 'Toplam Ogrenci', value: totalStudents },
            { label: 'Deneme Sayisi', value: totalExams },
            { label: 'Toplam Katilim', value: totalParticipations },
            { label: 'Genel Ortalama', value: overallAvg }
        ];

        const boxW = 45;
        const boxH = 25;
        summaryBoxes.forEach((box, i) => {
            const row = Math.floor(i / 2);
            const col = i % 2;
            const x = 14 + (col * (boxW + 50));
            const y = yPos + (row * (boxH + 5));

            doc.setFillColor(249, 250, 251);
            doc.setDrawColor(200);
            doc.rect(x, y, boxW + 40, boxH, 'FD');

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(box.label, x + 5, y + 10);

            doc.setFontSize(16);
            doc.setTextColor(0);
            doc.text(box.value.toString(), x + 5, y + 20);
        });

        yPos += 70;

        // ============ GENEL BAŞARI TRENDİ ============
        doc.setFontSize(14);
        doc.setTextColor(139, 92, 246);
        doc.text('GENEL BASARI GRAFIGI', 14, yPos);
        yPos += 5;

        const schoolTrend = trials.map((trial, i) => {
            const trialExams = allExams.filter(e => e.trialId === trial.id);
            const avg = trialExams.reduce((acc, e) => acc + (parseFloat(e.total) || parseFloat(e.tyt) || 0), 0) / (trialExams.length || 1);
            return { label: `D${i + 1}`, value: parseFloat(avg.toFixed(2)) };
        });

        drawLineChart(doc, schoolTrend, 14, yPos, 180, 45, '', '');
        yPos += 60;

        // ============ KATILIM ORANLARI ============
        doc.setFontSize(14);
        doc.setTextColor(139, 92, 246);
        doc.text('KATILIM ORANLARI', 14, yPos);
        yPos += 5;

        const participationData = trials.map((trial, i) => {
            const trialExams = allExams.filter(e => e.trialId === trial.id);
            return {
                label: `D${i + 1}`,
                value: trialExams.length
            };
        });

        // Draw simple bar chart for participation
        const barData = participationData.map(d => ({ label: d.label, value: d.value }));
        const barWidth = 180 / barData.length;
        const maxPart = Math.max(...barData.map(d => d.value));
        barData.forEach((item, i) => {
            const x = 14 + (i * barWidth);
            const barH = (item.value / maxPart) * 30;
            doc.setFillColor(139, 92, 246);
            doc.rect(x + 2, yPos + 30 - barH, barWidth - 4, barH, 'F');
            doc.setFontSize(8);
            doc.setTextColor(0);
            doc.text(item.value.toString(), x + barWidth / 2, yPos + 28 - barH, { align: 'center' });
            doc.setTextColor(100);
            doc.text(item.label, x + barWidth / 2, yPos + 38, { align: 'center' });
        });

        // ============ SINIF BAZLI ANALİZ ============
        // Extract grade from student or exam data
        const extractGrade = (exam) => {
            // Try to find student data
            const student = students?.find(s => s.name === exam.student || s.id === exam.studentId);
            const gradeStr = student?.grade || exam.grade || '12';

            // Extract number (9, 10, 11, 12)
            const match = gradeStr.toString().match(/(\d+)/);
            return match ? match[1] : '12';
        };

        // Group exams by grade
        const examsByGrade = { '9': [], '10': [], '11': [], '12': [] };
        allExams.forEach(exam => {
            const grade = extractGrade(exam);
            if (examsByGrade[grade]) {
                examsByGrade[grade].push(exam);
            } else {
                // Default to 12 if unknown grade
                examsByGrade['12'].push(exam);
            }
        });

        // Generate report for each grade
        const gradeColors = {
            '9': [59, 130, 246],   // Blue
            '10': [16, 185, 129],  // Green
            '11': [245, 158, 11],  // Orange
            '12': [139, 92, 246]   // Purple
        };

        Object.entries(examsByGrade).forEach(([grade, gradeExams]) => {
            if (gradeExams.length === 0) return;

            doc.addPage();
            yPos = 20;

            const color = gradeColors[grade] || [139, 92, 246];

            // Grade Header
            doc.setFillColor(...color);
            doc.rect(0, 0, 210, 40, 'F');

            doc.setFontSize(24);
            doc.setTextColor(255, 255, 255);
            doc.text(`${grade}. SINIF ANALIZI`, 105, 25, { align: 'center' });

            yPos = 55;

            // Grade Summary Stats
            doc.setFontSize(14);
            doc.setTextColor(...color);
            doc.text('OZET ISTATISTIKLER', 14, yPos);
            yPos += 8;

            const gradeScores = gradeExams.map(e => parseFloat(e.total) || parseFloat(e.tyt) || 0);
            const gradeAvg = (gradeScores.reduce((a, b) => a + b, 0) / gradeScores.length).toFixed(2);
            const gradeMax = Math.max(...gradeScores).toFixed(2);
            const gradeMin = Math.min(...gradeScores).toFixed(2);
            const gradeStudentCount = new Set(gradeExams.map(e => e.student || e.studentId)).size;

            const gradeBoxes = [
                { label: 'Ogrenci Sayisi', value: gradeStudentCount },
                { label: 'Ortalama Net', value: gradeAvg },
                { label: 'En Yuksek', value: gradeMax },
                { label: 'En Dusuk', value: gradeMin }
            ];

            gradeBoxes.forEach((box, i) => {
                const x = 14 + (i * 47);
                doc.setFillColor(249, 250, 251);
                doc.setDrawColor(200);
                doc.rect(x, yPos, 45, 20, 'FD');

                doc.setFontSize(9);
                doc.setTextColor(100);
                doc.text(box.label, x + 22.5, yPos + 8, { align: 'center' });

                doc.setFontSize(13);
                doc.setTextColor(0);
                doc.text(box.value.toString(), x + 22.5, yPos + 16, { align: 'center' });
            });

            yPos += 30;

            // Grade-specific trend (if multiple trials)
            if (trials.length >= 2) {
                doc.setFontSize(12);
                doc.setTextColor(...color);
                doc.text(`${grade}. SINIF GELISIM TRENDI`, 14, yPos);
                yPos += 5;

                const gradeTrend = trials.map((trial, i) => {
                    const trialGradeExams = gradeExams.filter(e => e.trialId === trial.id);
                    if (trialGradeExams.length === 0) return { label: `D${i + 1}`, value: 0 };
                    const avg = trialGradeExams.reduce((acc, e) => acc + (parseFloat(e.total) || parseFloat(e.tyt) || 0), 0) / trialGradeExams.length;
                    return { label: `D${i + 1}`, value: parseFloat(avg.toFixed(2)) };
                });

                drawLineChart(doc, gradeTrend, 14, yPos, 180, 40, '', '');
                yPos += 50;
            }

            // Top 5 students in this grade
            if (yPos < 230) {
                doc.setFontSize(12);
                doc.setTextColor(...color);
                doc.text(`EN BASARILI ${grade}. SINIF OGRENCILERI`, 14, yPos);
                yPos += 5;

                const gradeStudentAvgs = {};
                gradeExams.forEach(exam => {
                    const key = exam.student || exam.studentId;
                    if (!gradeStudentAvgs[key]) gradeStudentAvgs[key] = [];
                    gradeStudentAvgs[key].push(parseFloat(exam.total) || parseFloat(exam.tyt) || 0);
                });

                const topStudents = Object.entries(gradeStudentAvgs)
                    .map(([name, scores]) => ({
                        name: turkishToEnglish(name),
                        avg: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
                    }))
                    .sort((a, b) => b.avg - a.avg)
                    .slice(0, 5);

                const topRows = topStudents.map((s, i) => [i + 1, s.name, s.avg]);

                doc.autoTable({
                    head: [['Sira', 'Ogrenci', 'Ortalama']],
                    body: topRows,
                    startY: yPos,
                    theme: 'striped',
                    headStyles: { fillColor: color },
                    styles: { fontSize: 10 }
                });
            }
        });

        // ============ FOOTER ============
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Sayfa ${i} / ${pageCount}`, 105, 285, { align: 'center' });
            doc.text('AI Ogrenci Kocu - Kurum Analiz ve Raporlama Sistemi', 105, 290, { align: 'center' });
        }

        const fileName = 'Okul_Geneli_Raporu_Sinif_Bazli';
        savePDF(doc, fileName);
        console.log('Okul geneli rapor oluşturuldu:', fileName);
    } catch (error) {
        console.error('PDF oluşturma hatası:', error);
        alert(`PDF oluşturulurken hata: ${error.message}`);
    }
};
