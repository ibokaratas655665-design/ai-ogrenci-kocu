import React, { useState, useEffect } from 'react';
import {
    Brain, Users, BarChart2, Calendar, Target, Award,
    TrendingUp, FileText, Download, Send, CheckCircle,
    AlertCircle, Clock, Eye, Share2, PlusCircle, Search,
    Filter, ChevronDown, ChevronRight, Star, Activity, Trash2, BookOpen
} from 'lucide-react';
import guidanceService from '../services/guidanceService';
import { jsPDF } from 'jspdf';
import { savePDF, sanitizeForPDF as s } from '../utils/pdfSave';
import { analyzeSociometry } from '../utils/sociometryAnalysis';
import { bildir, onayla } from '../services/uiGeriBildirim';
import Modal from '../components/ui/Modal';
import { yaz, listeOku, oku, nesneOku } from '../services/veriDeposu';
import halkaAcik from '../services/halkaAcikGonderim';

const GuidanceServiceTab = ({ students = [] }) => {
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'tests', 'students', 'analytics'
    const [tests, setTests] = useState([]);
    const [selectedTests, setSelectedTests] = useState([]); // Çoklu seçim için
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [studentResults, setStudentResults] = useState([]);
    const [toast, setToast] = useState(null);
    const [assigningStudent, setAssigningStudent] = useState(null); // Tekil atama için
    const [selectedStatsClass, setSelectedStatsClass] = useState('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        // Halka açık gönderimleri önce içeri al, sonra listeyi kur
        halkaAcikKutuyuAktar().then(() => loadAllStudentResults()).catch(() => {});
        const allTests = guidanceService.getTests();
        // Alfabetik sıralama
        const sortedTests = allTests.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
        setTests(sortedTests);
        loadAllStudentResults();
    };


    /**
     * Halka açık kutudaki gönderimleri koçun yerel listesine aktarır.
     *
     * `/envanter/:testId` ve `/obp-girisi` korumasız rotalar; o cihazda
     * oturum olmadığı için gönderim `syncData`'ya yazılamıyor. Gönderim
     * ayrı bir kutuya bırakılıyor (bkz. services/halkaAcikGonderim.js),
     * koç burada okuyup kendi verisine alıyor ve kutudan siliyor.
     */
    const halkaAcikKutuyuAktar = async () => {
        const kocId = oku('user_session', null)?.id;
        if (!kocId) return;

        const gonderimler = await halkaAcik.kutuyuOku(kocId);
        if (!gonderimler.length) return;

        const envanterler = gonderimler.filter((g) => g.tur === 'envanter');
        if (envanterler.length) {
            const mevcut = listeOku('public_test_submissions');
            // Aynı gönderim iki kez düşmesin: test + tarih + okul numarası
            const anahtar = (r) => `${r.testId}|${r.date}|${r.studentInfo?.schoolNumber || ''}`;
            const varOlan = new Set(mevcut.map(anahtar));
            const yeniler = envanterler.map((g) => g.veri).filter((v) => v && !varOlan.has(anahtar(v)));
            if (yeniler.length) yaz('public_test_submissions', [...mevcut, ...yeniler]);
        }

        // İşlenen gönderimler kutudan kaldırılır
        for (const g of gonderimler) {
            if (g.tur === 'envanter') await halkaAcik.kutudanSil(g.id);
        }
    };
    const loadAllStudentResults = () => {
        const results = [];

        // 1. Logged-in students results (Unified source)
        students.forEach(student => {
            // Check legacy path
            const legacyKey = `test_results_${student.id}`;
            const legacyResults = listeOku(legacyKey);

            // Check guidanceService unified path
            const unifiedResults = nesneOku('student_guidance_results')[student.id] || [];

            // Merge unique results (based on date/id)
            const merged = [...legacyResults];
            unifiedResults.forEach(ur => {
                if (!merged.find(mr => mr.date === ur.date && mr.testId === ur.testId)) {
                    merged.push(ur);
                }
            });

            merged.forEach(result => {
                results.push({
                    ...result,
                    studentId: student.id,
                    studentName: student.name,
                    grade: student.grade,
                    section: student.section
                });
            });
        });

        // 2. Public submissions
        const publicResults = listeOku('public_test_submissions');
        publicResults.forEach((publicRes, idx) => {
            results.push({
                ...publicRes,
                studentId: 'public',
                publicIndex: idx,
                grade: publicRes.studentInfo?.grade,
                section: publicRes.studentInfo?.section,
                studentName: (publicRes.studentInfo?.name || 'İsimsiz') + ' (' + (publicRes.studentInfo?.schoolNumber || 'No Yok') + ') - Açık Link',
            });
        });

        // Sort by date (newest first)
        results.sort((a, b) => new Date(b.date) - new Date(a.date));
        setStudentResults(results);
    };

    const deleteStudentResult = async (result) => {
        if (!(await onayla({ mesaj: 'Bu test sonucunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.', tehlikeli: true }))) return;

        if (result.studentId === 'public') {
            const publicResults = listeOku('public_test_submissions');
            const filtered = publicResults.filter(r =>
                !(r.testId === result.testId && r.date === result.date && r.studentInfo?.schoolNumber === result.studentInfo?.schoolNumber)
            );
            /* Silme buluta da gitmeli, yoksa kayıt bir sonraki senkron
               turunda geri gelir. `zorla`: son kayıt silinince liste boş
               kalsa da gönderilsin (yaz'ın boş-değer koruması bilinçli
               silmede devre dışı). */
            yaz('public_test_submissions', filtered, { zorla: true });
        } else {
            // Delete from all potential paths
            const legacyKey = `test_results_${result.studentId}`;
            const legacyResults = listeOku(legacyKey);
            const filteredLegacy = legacyResults.filter(r => !(r.testId === result.testId && r.date === result.date));
            yaz(legacyKey, filteredLegacy, { zorla: true });

            const unifiedData = nesneOku('student_guidance_results');
            if (unifiedData[result.studentId]) {
                unifiedData[result.studentId] = unifiedData[result.studentId].filter(r => !(r.testId === result.testId && r.date === result.date));
                yaz('student_guidance_results', unifiedData, { zorla: true });
            }
        }

        loadAllStudentResults();
        setToast('Test sonucu başarıyla silindi.');
        setTimeout(() => setToast(null), 3000);
    };

    const assignTestToStudents = () => {
        if (selectedTests.length === 0 || selectedStudents.length === 0) {
            bildir('Lütfen en az bir test ve bir öğrenci seçin.', 'uyari');
            return;
        }

        selectedStudents.forEach(studentId => {
            const assignedTestsKey = `assigned_tests_${studentId}`;
            const currentTests = listeOku(assignedTestsKey);

            // Seçilen her testi ekle
            selectedTests.forEach(testId => {
                if (!currentTests.find(t => t.testId === testId)) {
                    currentTests.push({
                        testId: testId,
                        assignedDate: new Date().toISOString(),
                        status: 'pending'
                    });
                }
            });

            yaz(assignedTestsKey, currentTests);
        });

        bildir(`${selectedTests.length} test, ${selectedStudents.length} öğrenciye başarıyla atandı!`, 'basari');
        setSelectedTests([]);
        setSelectedStudents([]);
    };

    const assignSingleTestToStudent = (studentId, testId) => {
        const assignedTestsKey = `assigned_tests_${studentId}`;
        const currentTests = listeOku(assignedTestsKey);

        if (!currentTests.find(t => t.testId === testId)) {
            currentTests.push({
                testId: testId,
                assignedDate: new Date().toISOString(),
                status: 'pending'
            });
            localStorage.setItem(assignedTestsKey, JSON.stringify(currentTests));
            setToast('Test başarıyla atandı.');
        } else {
            setToast('Bu test zaten atanmış.');
        }

        setAssigningStudent(null);
        setTimeout(() => setToast(null), 3000);
    };

    const handleCopyPublicLink = (testId, title) => {
        const baseUrl = window.location.href.split('#')[0];
        // Koç kimliği linke eklenmezse gönderim hangi koça ait olduğunu
        // bilemez ve kutuya düşemez (bkz. services/halkaAcikGonderim.js).
        const kocId = oku('user_session', null)?.id ?? '';
        const shareUrl = `${baseUrl}#/envanter/${testId}${kocId ? `?c=${encodeURIComponent(kocId)}` : ''}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            setToast(`"${title}" bağlantısı kopyalandı!`);
            setTimeout(() => setToast(null), 3000);
        });
    };

    const handleShareResult = (result) => {
        try {
            // Paylaşılacak veriyi sadeleştir ve encode et
            const sharedObj = {
                studentName: result.studentName,
                testTitle: result.testTitle,
                level: result.level,
                comment: result.comment || result.detail,
                date: result.date,
                studentInfo: result.studentInfo || {}
            };
            const encoded = btoa(JSON.stringify(sharedObj));
            const shareUrl = `${window.location.origin}${window.location.pathname}#/share/result/${encoded}`;

            navigator.clipboard.writeText(shareUrl).then(() => {
                setToast('Paylaşım linki kopyalandı!');
                setTimeout(() => setToast(null), 3000);
            });
        } catch (e) {
            console.error('Paylaşım hatası:', e);
            bildir('Paylaşım linki oluşturulurken bir hata oluştu.', 'hata');
        }
    };

    const toggleTestSelection = (testId) => {
        setSelectedTests(prev =>
            prev.includes(testId)
                ? prev.filter(id => id !== testId)
                : [...prev, testId]
        );
    };

    const toggleStudentSelection = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const downloadDetailedResultPDF = (result) => {
        try {
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const W = 210; const H = 297;
            const today = s(new Date(result.date || Date.now()).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }));
            const testName = s((result.testTitle || 'Rehberlik Envanteri').toUpperCase());
            const studentName = s(result.studentName || 'Ogrenci');

            // Arka plan (Clean White)
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, W, H, 'F');

            // Lateral accent bar
            pdf.setFillColor(15, 23, 42); // Navy/Slate
            pdf.rect(0, 0, 10, H, 'F');

            // Header - Professional/Corporate Look
            pdf.setFillColor(248, 250, 252);
            pdf.rect(10, 0, W - 10, 45, 'F');

            pdf.setFontSize(10); pdf.setTextColor(100, 116, 139); pdf.setFont('helvetica', 'bold');
            pdf.text('BASARI KAMPI - KOCLUK VE REHBERLIK PLATFORMU', 25, 12);

            pdf.setDrawColor(203, 213, 225); pdf.line(25, 15, W - 15, 15);

            pdf.setFontSize(26); pdf.setTextColor(15, 23, 42); pdf.setFont('helvetica', 'bold');
            pdf.text('BIREYSEL ANALIZ RAPORU', 25, 28);

            pdf.setFontSize(9); pdf.setTextColor(100, 116, 139); pdf.setFont('helvetica', 'normal');
            pdf.text(`Rapor Kodu: RHB-${result.id || Math.floor(Math.random() * 100000)} | Seri No: G-${today.replace(/\s+/g, '')}`, 25, 36);

            // Information Box
            pdf.setDrawColor(226, 232, 240); pdf.setFillColor(255, 255, 255);
            pdf.roundedRect(25, 55, W - 50, 30, 2, 2, 'FD');

            pdf.setFontSize(9); pdf.setTextColor(100, 116, 139);
            pdf.text('DANISAN BILGILERI', 30, 62);

            pdf.setFontSize(12); pdf.setTextColor(30, 41, 59); pdf.setFont('helvetica', 'bold');
            pdf.text(studentName, 30, 70);
            pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
            pdf.text(s(`${result.studentInfo?.schoolNumber || 'No Belirtilmedi'} | Uygulama Tarihi: ${today}`), 30, 76);

            // Main result highlight
            pdf.setFillColor(241, 245, 249);
            pdf.roundedRect(25, 95, W - 50, 45, 3, 3, 'F');

            pdf.setFontSize(9); pdf.setTextColor(15, 23, 42); pdf.setFont('helvetica', 'bold');
            pdf.text(`ENVANTER: ${testName}`, 35, 105);

            pdf.setFontSize(36); pdf.setTextColor(30, 58, 138); // Strong Navy Blue
            pdf.text(s(result.level || 'Analiz Tamamlandi'), 35, 125);

            // Deep Scientific Analysis Section
            const textY = 155;
            pdf.setFontSize(13); pdf.setTextColor(15, 23, 42); pdf.setFont('helvetica', 'bold');
            pdf.text('AYRINTILI CIKTILAR VE BILIMSEL DEGERLENDIRME', 25, textY);
            pdf.setDrawColor(30, 58, 138); pdf.line(25, textY + 2, 60, textY + 2);

            pdf.setFontSize(11); pdf.setTextColor(51, 65, 85); pdf.setFont('helvetica', 'normal');
            const scientificIntro = "Bu rapor, ogrencinin test sirasindaki bilissel yanitlari ve davranissal paternleri uzerine insa edilmistir. Analiz, danısanın bilissel ve psikososyal sureclerine dair kritik gostergeler barındırmaktadır.";
            const mainComment = s(result.comment || result.detail || 'Test sonucları basarıyla analiz edilmistir.');
            const deepComment = "\n\nBilimsel Analiz: Veriler, ogrencinin test maddelerine verdigi yanıtların ic tutarlılığını gostermektedir. Bu sonucun, ogrencinin akademik motivasyonu, oz-yeterlilik algısı ve sosyal uyum mekanizmaları uzerinde doğrudan belirleyici bir etkisi oldugu ongorulmektedir. Gerekli durumlarda rehberlik servisi tarafından bireysel gorusme gerceklestirilmesi tavsiye edilir.";

            const finalFullText = scientificIntro + "\n\n" + mainComment + deepComment;
            const splitText = pdf.splitTextToSize(finalFullText, W - 60);
            pdf.text(splitText, 25, textY + 12);

            // Stamp Area
            const stampY = 240;
            pdf.setDrawColor(226, 232, 240); pdf.rect(W - 75, stampY, 50, 30);
            pdf.setFontSize(7); pdf.setTextColor(148, 163, 184);
            pdf.text('MUHUR VE IMZA ALANI', W - 73, stampY + 5);
            pdf.text('Dijital Onayli Belgedir', W - 73, stampY + 25);

            // Footer
            pdf.setFontSize(8); pdf.setTextColor(100, 116, 139);
            pdf.text('© Bu rapor Basari Kampi Gelismis Rehberlik Servisi tarafindan olusturulmustur. Tum haklari saklidir.', W / 2 + 5, H - 10, { align: 'center' });

            savePDF(pdf, `${studentName.replace(/\s+/g, '_')}_Resmi_Rehberlik_Analizi`);
        } catch (e) {
            console.error('PDF Hatası:', e);
            bildir('PDF oluşturulurken bir hata oluştu: ' + e.message, 'hata');
        }
    };

    const downloadSociogramPDF = () => {
        let sociometryResults = studentResults.filter(r => r.testId === 'sociometry');
        let targetedStudents = students;

        if (selectedStatsClass !== 'all') {
            const [g, s] = selectedStatsClass.split('/');
            sociometryResults = sociometryResults.filter(r =>
                String(r.grade) === String(g) && String(r.section) === String(s)
            );
            targetedStudents = students.filter(student =>
                String(student.grade) === String(g) && String(student.section) === String(s)
            );
        }

        if (sociometryResults.length === 0) {
            bildir(selectedStatsClass === 'all'
                ? 'Henüz hiç sosyometri sonucu bulunamadı.'
                : `${selectedStatsClass} sınıfı için henüz sosyometri sonucu bulunamadı.`);
            return;
        }

        const analysis = analyzeSociometry(sociometryResults, targetedStudents);
        if (!analysis) return;

        try {
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const W = 210; const H = 297;
            const today = new Date().toLocaleDateString('tr-TR');

            // Header
            pdf.setFillColor(30, 58, 138); pdf.rect(0, 0, W, 40, 'F');
            pdf.setFontSize(22); pdf.setTextColor(255, 255, 255); pdf.setFont('helvetica', 'bold');
            pdf.text('SINIF SOSYOGRAM VE ETKI ANALIZI', 15, 20);
            pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
            pdf.text(`BASARI KAMPI | REHBERLIK SERVISI | TARIH: ${today}`, 15, 30);

            // 1. Özet İstatistikler
            pdf.setTextColor(30, 58, 138); pdf.setFontSize(14); pdf.setFont('helvetica', 'bold');
            pdf.text('1. GENEL SINIF PROFILI', 15, 55);
            pdf.setDrawColor(30, 58, 138); pdf.line(15, 57, 60, 57);

            const stats = [
                ['Toplam Ogrenci (Sistem):', analysis.stats.totalStudents],
                ['Testi Tamamlayan:', analysis.stats.submittedCount],
                ['Grup Bagliligi (Cohesion):', analysis.stats.cohesionIndex],
                ['Lider/Yildiz Sayisi:', analysis.stats.stars.length],
                ['Yalniz/Izole Sayisi:', analysis.stats.isolates.length]
            ];

            pdf.setFontSize(11); pdf.setTextColor(51, 65, 85);
            stats.forEach((item, i) => {
                pdf.text(s(String(item[0])), 20, 70 + (i * 8));
                pdf.setFont('helvetica', 'bold');
                pdf.text(s(String(item[1])), 80, 70 + (i * 8));
                pdf.setFont('helvetica', 'normal');
            });

            // 2. Sosyometrik Roller
            let currentY = 120;
            pdf.setTextColor(30, 58, 138); pdf.setFontSize(14); pdf.setFont('helvetica', 'bold');
            pdf.text('2. SOSYOMETRIK ROLLER VE ANALIZ', 15, currentY);
            pdf.line(15, currentY + 2, 80, currentY + 2);

            currentY += 15;
            // Yıldızlar
            pdf.setTextColor(15, 23, 42); pdf.setFontSize(12);
            pdf.text('YILDIZLAR (LIDERLER):', 15, currentY);
            pdf.setFontSize(10); pdf.setTextColor(71, 85, 105);
            const starsText = analysis.stats.stars.length > 0 ? analysis.stats.stars.join(', ') : 'Tespit edilemedi.';
            pdf.text(pdf.splitTextToSize(s(starsText), W - 40), 15, currentY + 7);

            currentY += 25;
            // Yalnızlar
            pdf.setTextColor(15, 23, 42); pdf.setFontSize(12);
            pdf.text('IZOLE OGRENCILER (YALNIZLAR):', 15, currentY);
            pdf.setFontSize(10); pdf.setTextColor(71, 85, 105);
            const isolatesText = analysis.stats.isolates.length > 0 ? analysis.stats.isolates.join(', ') : 'Tespit edilemedi.';
            pdf.text(pdf.splitTextToSize(s(isolatesText), W - 40), 15, currentY + 7);

            currentY += 25;
            // Gruplaşmalar
            pdf.setTextColor(15, 23, 42); pdf.setFontSize(12);
            pdf.text('KAPALI GRUPLASMALAR:', 15, currentY);
            pdf.setFontSize(10); pdf.setTextColor(71, 85, 105);
            const cliqueStr = analysis.stats.cliques.length > 0
                ? analysis.stats.cliques.map(c => '[' + c.join('-') + ']').join(', ')
                : 'Belirgin bir klik yapisi bulunamadi.';
            pdf.text(pdf.splitTextToSize(s(cliqueStr), W - 40), 15, currentY + 7);

            // 3. Sosyometrik Matris (Tablo) - Yeni Sayfa
            pdf.addPage();
            pdf.setFillColor(30, 58, 138); pdf.rect(0, 0, W, 20, 'F');
            pdf.setFontSize(14); pdf.setTextColor(255, 255, 255);
            pdf.text('SOSYOMETRIK PUAN TABLOSU VE TERCIH ANALIZI', 15, 13);

            const tableHeaders = ['Ogrenci Adi', 'Secilme Sayisi', 'Agirlikli Puan', 'Karsilikli Secim'];
            pdf.setFillColor(241, 245, 249); pdf.rect(10, 30, W - 20, 10, 'F');
            pdf.setFontSize(9); pdf.setTextColor(15, 23, 42); pdf.setFont('helvetica', 'bold');

            tableHeaders.forEach((h, i) => pdf.text(h, 15 + (i * 45), 36));

            pdf.setFont('helvetica', 'normal');
            analysis.names.forEach((name, i) => {
                const y = 48 + (i * 8);
                const data = analysis.matrix[name];
                pdf.text(s(name), 15, y);
                pdf.text(String(data.totalChoices), 60, y);
                pdf.text(String(data.score), 105, y);
                pdf.text(String(data.mutuals.length), 150, y);

                pdf.setDrawColor(241, 245, 249); pdf.line(10, y + 2, W - 10, y + 2);
            });

            pdf.addPage();
            pdf.setFillColor(30, 58, 138); pdf.rect(0, 0, W, 20, 'F');
            pdf.setFontSize(14); pdf.setTextColor(255, 255, 255);
            pdf.text('REHBERLIK SERVISI NOTLARI VE ONERILER', 15, 13);

            pdf.setTextColor(51, 65, 85); pdf.setFontSize(11);
            const recommendations = `
* YILDIZLAR: Bu ogrenciler sinif genelinde yuksek prestije sahiptir. Sosyal etkinliklerde lider olarak gorevlendirilebilirler.
* IZOLE OGRENCILER: Bu ogrenciler gruplasma disinda kalmis olabilir. Sinif ici is birligini artiracak kucuk gruplu calismalarda yildiz ogrencilerle bir araya getirilmelidir.
* KLIKLER: Sinif icinde kapali gruplar olusmus olabilir. Bu gruplarin sinif genelinden kopmamasi icin proje bazli karma gruplar olusturulabilir.
* COHESION (BAGLILIK): Sinifin genel baglilik indeksi ${analysis.stats.cohesionIndex}'dir. Bu deger yukseldikce sinif ici huzur ve yardimlasma artar.
            `;
            pdf.text(pdf.splitTextToSize(s(recommendations), W - 40), 15, 40);

            savePDF(pdf, `Sinif_Sosyogram_AnalizRaporu_${today.replace(/\./g, '_')}`);
        } catch (e) {
            console.error('Sosyogram PDF Hatasi:', e);
            bildir('Sosyogram oluşturulurken bir hata oluştu.', 'hata');
        }
    };

    const downloadClassReport = () => {
        const pdf = new jsPDF();

        // Header
        pdf.setFillColor(79, 70, 229);
        pdf.rect(0, 0, 210, 50, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(28);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Toplu Envanter Raporu', 20, 30);

        // Date
        pdf.setFontSize(12);
        pdf.text(s(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`), 20, 42);

        // Stats
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Ozet Istatistikler', 20, 65);

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.text(s(`Sistemdeki Ogrenci: ${students.length}`), 20, 75);
        pdf.text(s(`Toplam Tamamlanan Test: ${studentResults.length}`), 20, 82);

        // Student Results
        let yPos = 100;
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Test Sonuclari Listesi', 20, yPos);
        yPos += 10;

        studentResults.forEach((result, idx) => {
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(40, 40, 40);
            const titleText = s(`${idx + 1}. ${result.studentName} - ${result.testTitle}`);
            pdf.text(titleText, 20, yPos);
            yPos += 6;

            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(80, 80, 80);
            const levelText = s(`Sonuc Ozeti: ${result.level || 'Tamamlandi'}`);
            const splitLevel = pdf.splitTextToSize(levelText, 170);
            pdf.text(splitLevel, 25, yPos);
            yPos += (splitLevel.length * 5) + 4; // Add spacing

            if (yPos > 270) {
                pdf.addPage();
                yPos = 20;
            }
        });

        // Footer
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text('Basari Kampi - Rehberlik Hizmetleri', 20, 285);

        savePDF(pdf, `Toplu_Envanter_Raporu_${new Date().toLocaleDateString('tr-TR')}`);
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        totalStudents: students.length,
        completedTests: studentResults.length,
        activeTests: tests.length,
        avgCompletion: studentResults.length > 0
            ? Math.round((studentResults.length / students.length) * 100)
            : 0
    };

    return (
        <div className="space-y-8 animate-fade-in relative">
            {toast && (
                <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[60] bg-surface-inv text-white px-6 py-3 rounded-full shadow-xl flex items-center animate-fade-in">
                    <CheckCircle size={18} className="mr-2 text-ok" />
                    <span className="text-sm font-medium">{toast}</span>
                </div>
            )}
            {/* Premium Header */}
            <div className="on-color bg-gradient-to-r from-brand via-purple-600 to-pink-600 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
                    <Brain size={350} className="absolute -top-20 -right-20" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center mb-6">
                        <Brain size={56} className="mr-4" />
                        <div>
                            <h1 className="text-4xl sm:text-5xl font-black mb-2">Rehberlik Hizmetleri</h1>
                            <p className="text-brand text-lg">Öğrencilerinizin gelişimini profesyonelce yönetin</p>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                        {[
                            { label: 'Toplam Öğrenci', value: stats.totalStudents, icon: Users, color: 'bg-surface/10' },
                            { label: 'Tamamlanan Test', value: stats.completedTests, icon: CheckCircle, color: 'bg-ok/20' },
                            { label: 'Aktif Test', value: stats.activeTests, icon: FileText, color: 'bg-info/20' },
                            { label: 'Tamamlanma Oranı', value: `${stats.avgCompletion}%`, icon: TrendingUp, color: 'bg-warn/20' }
                        ].map((stat, idx) => (
                            <div key={idx} className={`${stat.color} backdrop-blur rounded-2xl p-4`}>
                                <stat.icon size={24} className="mb-2 opacity-90" />
                                <div className="text-2xl font-black mb-1">{stat.value}</div>
                                <div className="text-sm text-brand">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-2 bg-surface p-2 rounded-2xl shadow-sm border border-line">
                {[
                    { id: 'overview', label: 'Genel Bakış', icon: BarChart2 },
                    { id: 'students_mgmt', label: 'Öğrenci Yönetimi', icon: Users },
                    { id: 'tests', label: 'Toplu Atama', icon: Send },
                    { id: 'students', label: 'Envanter Sonuçları', icon: BookOpen },
                    { id: 'analytics', label: 'Analitik', icon: Activity }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 ${activeTab === tab.id
                            ? 'bg-gradient-to-r from-brand to-purple-600 text-white shadow-lg'
                            : 'text-ink-2 hover:bg-surface-2'
                            }`}
                    >
                        <tab.icon size={18} />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div>
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Recent Activity */}
                        <div className="glass-card p-6 border-l-4 border-brand">
                            <h2 className="text-2xl font-bold text-ink mb-4 flex items-center">
                                <Clock className="mr-2 text-brand" size={28} />
                                Son Aktiviteler
                            </h2>
                            <div className="space-y-3">
                                {studentResults.slice(0, 5).map((result, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-surface rounded-xl border border-line hover:shadow-md transition">
                                        <div className="flex items-center space-x-4">
                                            <div className="on-color w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-ink">
                                                <CheckCircle size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-ink">{result.studentName}</p>
                                                <p className="text-sm text-ink-2">{result.testTitle} tamamladı</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-ink-3">
                                            {new Date(result.date).toLocaleDateString('tr-TR')}
                                        </span>
                                    </div>
                                ))}
                                {studentResults.length === 0 && (
                                    <div className="text-center py-8 text-ink-3">
                                        <Activity size={48} className="mx-auto mb-2 opacity-50" />
                                        <p>Henüz aktivite yok</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <button
                                onClick={() => setActiveTab('students_mgmt')}
                                className="on-color p-6 bg-gradient-to-br from-indigo-500 to-brand text-white rounded-2xl hover:shadow-2xl transition-all group"
                            >
                                <Users size={32} className="mb-3 group-hover:scale-110 transition" />
                                <h3 className="text-lg font-bold mb-1">Öğrenci Yönetimi</h3>
                                <p className="text-sm text-brand">Öğrencilere bireysel test atayın</p>
                            </button>
                            <button
                                onClick={() => setActiveTab('tests')}
                                className="on-color p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-ink rounded-2xl hover:shadow-2xl transition-all group"
                            >
                                <Send size={32} className="mb-3 group-hover:scale-110 transition" />
                                <h3 className="text-lg font-bold mb-1">Toplu Atama</h3>
                                <p className="text-sm text-c4">Bir testi tüm sınıfa atayın</p>
                            </button>
                            <button
                                onClick={() => setActiveTab('students')}
                                className="on-color p-6 bg-gradient-to-br from-pink-500 to-pink-600 text-ink rounded-2xl hover:shadow-2xl transition-all group"
                            >
                                <BookOpen size={32} className="mb-3 group-hover:scale-110 transition" />
                                <h3 className="text-lg font-bold mb-1">Sonuç Arşivi</h3>
                                <p className="text-sm text-c5">Tamamlanan tüm raporlar</p>
                            </button>
                            <button
                                onClick={downloadClassReport}
                                className="on-color p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-ink rounded-2xl hover:shadow-2xl transition-all group"
                            >
                                <Download size={32} className="mb-3 group-hover:scale-110 transition" />
                                <h3 className="text-lg font-bold mb-1">Toplu Rapor</h3>
                                <p className="text-sm text-ok">Sınıf genel analizini indirin</p>
                            </button>
                        </div>
                    </div>
                )}

                {/* STUDENT MANAGEMENT TAB (Bireysel Atama) */}
                {activeTab === 'students_mgmt' && (
                    <div className="glass-card p-6 animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-ink">Bireysel Rehberlik Ataması</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-3" size={18} />
                                <input
                                    type="text"
                                    placeholder="Öğrenci ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredStudents.map(student => (
                                <div key={student.id} className="bg-surface p-5 rounded-2xl border border-line shadow-sm hover:shadow-md transition group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-brand-soft rounded-xl flex items-center justify-center text-brand group-hover:bg-brand group-hover:text-ink transition-colors duration-yavas">
                                            <Users size={24} />
                                        </div>
                                        <button
                                            onClick={() => setAssigningStudent(student)}
                                            className="px-4 py-2 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand-hover transition"
                                        >
                                            Test Ata
                                        </button>
                                    </div>
                                    <h3 className="font-bold text-ink text-lg">{student.name}</h3>
                                    <div className="flex items-center text-xs text-ink-2 space-x-2 mt-1">
                                        <span className="bg-surface-3 px-2 py-0.5 rounded-md font-medium text-ink-2">{student.grade || '9/A'}</span>
                                        <span className="bg-surface-3 px-2 py-0.5 rounded-md font-medium text-ink-2">No: {student.schoolNumber || '-'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TEST ASSIGNMENT TAB */}
                {activeTab === 'tests' && (
                    <div className="space-y-6">
                        {/* Test Selection */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-ink">1️⃣ Test Seçin (Çoklu)</h2>
                                <button
                                    onClick={() => {
                                        if (selectedTests.length === tests.length) {
                                            setSelectedTests([]);
                                        } else {
                                            setSelectedTests(tests.map(t => t.id));
                                        }
                                    }}
                                    className="text-brand font-bold hover:text-brand transition"
                                >
                                    {selectedTests.length === tests.length ? 'Hiçbirini Seçme' : 'Tümünü Seç'} ({selectedTests.length}/{tests.length})
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {tests.map(test => (
                                    <div
                                        key={test.id}
                                        onClick={() => toggleTestSelection(test.id)}
                                        className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${selectedTests.includes(test.id)
                                            ? 'border-indigo-600 bg-brand-soft shadow-lg'
                                            : 'border-line hover:border-brand-line hover:shadow-md'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <FileText size={24} className={selectedTests.includes(test.id) ? 'text-brand' : 'text-ink-3'} />
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCopyPublicLink(test.id, test.title);
                                                    }}
                                                    className="p-1.5 bg-brand-soft hover:bg-brand-soft text-brand rounded-lg transition"
                                                    title="Öğrenci Linkini Kopyala (Giriş gerektirmez)"
                                                >
                                                    <Share2 size={16} />
                                                </button>
                                            </div>
                                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${selectedTests.includes(test.id)
                                                ? 'border-indigo-600 bg-brand'
                                                : 'border-line-2'
                                                }`}>
                                                {selectedTests.includes(test.id) && (
                                                    <CheckCircle size={16} className="text-ink" />
                                                )}
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-ink mb-2">{test.title}</h3>
                                        <p className="text-sm text-ink-2">{test.questions?.length} Soru</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Student Selection */}
                        <div className="glass-card p-6">
                            <h2 className="text-2xl font-bold text-ink mb-4">2️⃣ Öğrenci Seçin</h2>

                            {/* Search */}
                            <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-3" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Öğrenci ara..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border-2 border-line rounded-xl focus:border-brand outline-none"
                                    />
                                </div>
                            </div>

                            {/* Select All */}
                            <div className="mb-4">
                                <button
                                    onClick={() => {
                                        if (selectedStudents.length === filteredStudents.length) {
                                            setSelectedStudents([]);
                                        } else {
                                            setSelectedStudents(filteredStudents.map(s => s.id));
                                        }
                                    }}
                                    className="text-brand font-bold hover:text-brand transition"
                                >
                                    {selectedStudents.length === filteredStudents.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
                                </button>
                                <span className="ml-3 text-ink-2">({selectedStudents.length} seçili)</span>
                            </div>

                            {/* Student List */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                                {filteredStudents.map(student => (
                                    <div
                                        key={student.id}
                                        onClick={() => toggleStudentSelection(student.id)}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center space-x-3 ${selectedStudents.includes(student.id)
                                            ? 'border-indigo-600 bg-brand-soft'
                                            : 'border-line hover:border-brand-line'
                                            }`}
                                    >
                                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${selectedStudents.includes(student.id)
                                            ? 'border-indigo-600 bg-brand'
                                            : 'border-line-2'
                                            }`}>
                                            {selectedStudents.includes(student.id) && (
                                                <CheckCircle size={16} className="text-ink" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-ink">{student.name}</p>
                                            <p className="text-xs text-ink-2">{student.grade || 'Sınıf bilgisi yok'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Assign Button */}
                        <button
                            onClick={assignTestToStudents}
                            disabled={selectedTests.length === 0 || selectedStudents.length === 0}
                            className="on-color w-full py-4 bg-gradient-to-r from-brand to-purple-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            <Send size={24} />
                            <span>{selectedTests.length} Testi {selectedStudents.length} Öğrenciye Ata</span>
                        </button>
                    </div>
                )}

                {/* STUDENT RESULTS TAB */}
                {activeTab === 'students' && (
                    <div className="space-y-4">
                        {studentResults.length > 0 ? (
                            studentResults.map((result, idx) => (
                                <div key={idx} className="glass-card p-6 hover:shadow-lg transition">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex items-start space-x-4">
                                            <div className="on-color w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center text-ink flex-shrink-0">
                                                <Star size={28} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-ink">{result.studentName}</h3>
                                                <p className="text-ink-2 font-medium">{result.testTitle}</p>
                                                <div className="flex items-center space-x-4 mt-2 text-sm text-ink-2">
                                                    <span className="flex items-center">
                                                        <Calendar size={14} className="mr-1" />
                                                        {new Date(result.date).toLocaleDateString('tr-TR')}
                                                    </span>
                                                    <span className="px-3 py-1 bg-brand-soft text-brand rounded-full font-bold">
                                                        {result.level || 'Tamamlandı'}
                                                    </span>
                                                </div>
                                                {result.comment && (
                                                    <p className="text-ink-2 mt-2 italic text-sm">"{result.comment}"</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <button
                                                onClick={() => downloadDetailedResultPDF(result)}
                                                className="flex items-center space-x-2 bg-brand text-white px-5 py-2.5 rounded-2xl font-bold hover:shadow-xl hover:scale-105 active:scale-95 transition-all whitespace-nowrap shadow-indigo-100"
                                            >
                                                <Download size={18} />
                                                <span>Detaylı Analiz PDF</span>
                                            </button>
                                            <button
                                                onClick={() => handleShareResult(result)}
                                                className="flex items-center space-x-2 bg-info-soft text-info px-5 py-2.5 rounded-2xl font-bold hover:bg-info-soft active:scale-95 transition-all whitespace-nowrap"
                                                title="Sonucu Paylaşılabilir Link Olarak Kopyala"
                                            >
                                                <Share2 size={18} />
                                                <span>Paylaş</span>
                                            </button>
                                            <button
                                                onClick={() => deleteStudentResult(result)}
                                                className="p-3 bg-danger-soft text-danger hover:bg-danger hover:text-ink rounded-2xl transition-all shadow-sm active:scale-95 flex items-center justify-center group"
                                                title="Sonucu Sil"
                                            >
                                                <Trash2 size={20} className="group-hover:scale-110 transition" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-surface rounded-3xl border-2 border-dashed border-line">
                                <Users size={64} className="mx-auto mb-4 text-ink-3" />
                                <h3 className="text-2xl font-bold text-ink mb-2">Henüz Test Sonucu Yok</h3>
                                <p className="text-ink-2 max-w-md mx-auto">
                                    Öğrenciler test tamamladıkça sonuçlar burada görünecek.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ANALYTICS TAB */}
                {activeTab === 'analytics' && (() => {
                    // Sınıf seçeneklerini belirle
                    const availableClasses = Array.from(new Set(students.map(s => `${s.grade}/${s.section}`)))
                        .filter(c => c && c !== 'undefined/undefined')
                        .sort();

                    // İstatistikleri seçilen sınıfa göre filtrele
                    let filteredResults = studentResults;
                    let filteredStudentsList = students;

                    if (selectedStatsClass !== 'all') {
                        const [g, s] = selectedStatsClass.split('/');
                        filteredResults = studentResults.filter(r => String(r.grade) === String(g) && String(r.section) === String(s));
                        filteredStudentsList = students.filter(st => String(st.grade) === String(g) && String(st.section) === String(s));
                    }

                    const stats = {
                        avgCompletion: filteredStudentsList.length > 0 ? Math.round((filteredResults.length / filteredStudentsList.length) * 100) : 0,
                        activeTests: tests.length,
                        totalSubmissions: filteredResults.length
                    };

                    return (
                        <div className="glass-card p-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                                <h2 className="text-3xl font-bold text-ink flex items-center">
                                    <Activity className="mr-3 text-brand" size={36} />
                                    İstatistiksel Analiz
                                </h2>

                                <div className="flex items-center gap-2 bg-brand-soft p-2 rounded-2xl border border-brand-line">
                                    <span className="text-sm font-bold text-brand ml-2">Sınıf Seçin:</span>
                                    <select
                                        value={selectedStatsClass}
                                        onChange={(e) => setSelectedStatsClass(e.target.value)}
                                        className="bg-surface border-none rounded-xl px-4 py-2 text-sm font-bold text-ink-2 outline-none shadow-sm cursor-pointer"
                                    >
                                        <option value="all">Tüm Okul</option>
                                        {availableClasses.map(c => (
                                            <option key={c} value={c}>{c} Sınıfı</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Test Completion Rate */}
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-brand-line">
                                    <h3 className="font-bold text-ink mb-4 flex items-center">
                                        <TrendingUp className="mr-2 text-brand" size={20} />
                                        Test Tamamlanma Oranı
                                    </h3>
                                    <div className="text-5xl font-black text-brand mb-2">{stats.avgCompletion}%</div>
                                    <p className="text-ink-2">
                                        {filteredResults.length} / {filteredStudentsList.length} öğrenci test tamamladı
                                    </p>
                                </div>

                                {/* Total Submissions */}
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-[color-mix(in_srgb,var(--c4)_35%,transparent)]">
                                    <h3 className="font-bold text-ink mb-4 flex items-center">
                                        <FileText className="mr-2 text-c4" size={20} />
                                        Toplam Yanıt Sayısı
                                    </h3>
                                    <div className="text-5xl font-black text-c4 mb-2">{stats.totalSubmissions}</div>
                                    <p className="text-ink-2">
                                        Seçilen gruptaki toplam kayıtlı yanıt
                                    </p>
                                </div>
                            </div>

                            {/* Sosyometri Özel Bölümü */}
                            <div className="mt-8 bg-surface p-6 rounded-2xl border-2 border-dashed border-brand-line">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-ink flex items-center">
                                            <Star className="mr-2 text-warn" size={24} />
                                            Gelişmiş Sosyometri Analizi ({selectedStatsClass === 'all' ? 'Tüm Okul' : selectedStatsClass})
                                        </h3>
                                        <p className="text-sm text-ink-2 mt-1">Sınıf içi liderleri ve sosyal dinamikleri analiz edin.</p>
                                    </div>
                                    <div className="bg-brand-soft text-brand px-4 py-1.5 rounded-full font-bold text-sm">
                                        {filteredResults.filter(r => r.testId === 'sociometry').length} Yanıt Mevcut
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="bg-surface-2 p-4 rounded-xl border border-line">
                                        <p className="text-xs text-ink-3 font-bold uppercase mb-2">Sosyogram Nedir?</p>
                                        <p className="text-xs text-ink-2 leading-relaxed">Seçilen sınıftaki sosyal haritayı çıkarır. Liderleri ve klikleri belirler.</p>
                                    </div>
                                    <div className="bg-surface-2 p-4 rounded-xl border border-line">
                                        <p className="text-xs text-ink-3 font-bold uppercase mb-2">Sınıf Bazlı Analiz</p>
                                        <p className="text-xs text-ink-2 leading-relaxed">Sosyometri doğası gereği sınıf bazında değerlendirilmelidir. Lütfen yukarıdan ilgili sınıfı seçin.</p>
                                    </div>
                                </div>

                                <button
                                    onClick={downloadSociogramPDF}
                                    className={`w-full py-4 rounded-2xl font-bold transition shadow-lg flex items-center justify-center space-x-2 ${selectedStatsClass === 'all'
                                            ? 'bg-surface-3 text-ink-2 cursor-not-allowed'
                                            : 'bg-brand text-white hover:bg-brand-hover'
                                        }`}
                                    disabled={selectedStatsClass === 'all'}
                                >
                                    <Star size={20} fill="currentColor" />
                                    <span>{selectedStatsClass === 'all' ? 'Lütfen Önce Sınıf Seçin' : `${selectedStatsClass} Sosyogram Raporunu İndir`}</span>
                                </button>
                                {selectedStatsClass === 'all' && (
                                    <p className="text-center text-xs text-warn mt-3 font-medium">⚠️ Sosyometri raporu oluşturmak için yukarıdan bir sınıf seçmelisiniz.</p>
                                )}
                            </div>

                            <div className="mt-8 border-t border-line pt-8">
                                <button
                                    onClick={downloadClassReport}
                                    className="w-full py-4 bg-surface-inv text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center space-x-2"
                                >
                                    <Download size={24} />
                                    <span>{selectedStatsClass === 'all' ? 'Tüm Okul' : selectedStatsClass} Rapor Kartlarını İndir (PDF)</span>
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Bireysel Atama Modalı */}
            {assigningStudent && (
                <Modal
                    acik
                    onClose={() => setAssigningStudent(null)}
                    baslikGizle
                    genislik="lg"
                    katmanClassName="z-modal-top"
                    govdeClassName="p-0 flex flex-col overflow-hidden"
                >
                    <div className="shrink-0 p-6 bg-brand text-white border-b border-indigo-700">
                        <h3 className="text-xl font-bold">{assigningStudent.name} İÇİN ENVANTER ATA</h3>
                        <p className="text-brand text-sm mt-1">Rehberlik servisi tarafından uygulanacak testi seçin</p>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-3">
                        {tests.map(test => (
                            <button
                                key={test.id}
                                onClick={() => assignSingleTestToStudent(assigningStudent.id, test.id)}
                                className="w-full p-4 border border-line rounded-2xl text-left bg-surface-2 hover:bg-brand-soft hover:border-brand-line transition group flex items-center justify-between"
                            >
                                <div>
                                    <p className="font-bold text-ink group-hover:text-brand transition-colors uppercase tracking-tight">{test.title}</p>
                                    <p className="text-xs text-ink-3 mt-0.5">{test.questions?.length} Soru • {test.desc}</p>
                                </div>
                                <PlusCircle size={24} className="text-brand group-hover:text-brand transition" />
                            </button>
                        ))}
                    </div>
                    <div className="p-4 bg-surface-2 border-t border-line flex justify-end">
                        <button onClick={() => setAssigningStudent(null)} className="px-6 py-2 text-ink-2 font-bold hover:bg-surface-3 rounded-xl transition">Kapat</button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default GuidanceServiceTab;
