/**
 * StudentTestsTab — Routing-free, embed-safe test bileşeni
 * GuidancePage'in router bağımlılığı olmadan tüm özelliklerini sağlar.
 * Tüm test veri yapılarını destekler:
 *   - options: [{ label, value }]    (holland, exam_anxiety, vb.)
 *   - options: ['text', 'text']      (decision_making, stress_coping, vb.)
 *   - soru başına options            (vark)
 *   - inputType: 'text'              (beier)
 *   - options: []                    (düz true/false)
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
    Brain, BookOpen, BarChart2, Download, X, Play,
    Clock, FileText, Calendar, ChevronRight, CheckCircle
} from 'lucide-react';
import guidanceService from '../services/guidanceService';
import { jsPDF } from 'jspdf';
import { savePDF, sanitizeForPDF as s } from '../utils/pdfSave';
import { bildir } from '../services/uiGeriBildirim';
import { hataAnlat } from '../services/hataMesaji';
import Modal from './ui/Modal';

/* ── Yardımcı: options'u normalize et ────────────────────────── */
function normalizeOptions(test, question) {
    // 0) Eğer bir class_list veya text input ise seçenek döndürme
    if (test?.inputType === 'class_list' || test?.inputType === 'text') return [];

    // 1) Soruya özgü options varsa (VARK gibi)
    if (Array.isArray(question?.options) && question.options.length > 0) {
        return question.options.map((o, i) =>
            typeof o === 'string' ? { label: o, value: i } :
                typeof o === 'object' && o.text ? { label: o.text, value: i, meta: o } :
                    { label: JSON.stringify(o), value: i }
        );
    }
    // 2) Test genelinde options varsa
    if (Array.isArray(test?.options) && test.options.length > 0) {
        return test.options.map((o, i) =>
            typeof o === 'string' ? { label: o, value: i } :
                typeof o === 'object' && (o.label || o.text) ? { label: o.label || o.text, value: i, meta: o } :
                    { label: JSON.stringify(o), value: i }
        );
    }
    // 3) Varsayılan Evet/Hayır (Sadece normal testler için)
    return [
        { label: 'Evet', value: 1 },
        { label: 'Hayır', value: 0 }
    ];
}

/* ── Yardımcı: soru id'si (bazı testlerde yok) ────────────────── */
function questionKey(q, index) {
    return q.id !== undefined ? String(q.id) : String(index);
}

/* ═══════════════════════════════════════════════════════════════ */
const StudentTestsTab = ({ user }) => {
    const [view, setView] = useState('tests'); // 'tests' | 'results' | 'articles'
    const [tests, setTests] = useState([]);
    const [articles, setArticles] = useState([]);
    const [testResults, setTestResults] = useState([]);

    /* Test çözme */
    const [activeTest, setActiveTest] = useState(null);
    const [answers, setAnswers] = useState({});       // { key: value }
    const [textAnswers, setTextAnswers] = useState({}); // beier gibi açık uçlu
    // Sınıf listesi açık/kapalı durumu soru bazında tutulur. Eskiden
    // her soru için .map() içinde useState çağrılıyordu; bu React'in
    // hook kuralını ihlal eder ve soru sayısı değişince sayfayı çökertir.
    const [acikListeler, setAcikListeler] = useState({});
    const [testResult, setTestResult] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    /* ── Yükleme ─────────────────────────────────────────────── */
    const loadContent = useCallback(() => {
        if (!user) return;
        const allTests = guidanceService.getTests();

        // Koçun atadığı testleri ara — önce user.id ile
        let raw = localStorage.getItem(`assigned_tests_${user.id}`);
        // Yoksa okul numarasıyla dene
        if (!raw && user.schoolNumber) {
            raw = localStorage.getItem(`assigned_tests_${user.schoolNumber}`);
        }

        if (raw) {
            try {
                const assigned = JSON.parse(raw);
                const assignedIds = assigned.map(t => t.testId);
                const completedIds = assigned.filter(t => t.status === 'completed').map(t => t.testId);

                const filtered = allTests
                    .filter(t => assignedIds.includes(t.id))
                    .map(t => ({ ...t, isCompleted: completedIds.includes(t.id) }));
                setTests(filtered);
            } catch {
                setTests([]);
            }
        } else {
            setTests([]);
        }

        setArticles(guidanceService.getArticles());

        // Test sonuçlarını yükle
        try {
            const saved = JSON.parse(localStorage.getItem(`test_results_${user.id}`) || '[]');
            setTestResults(saved);
        } catch {
            setTestResults([]);
        }
    }, [user]);

    useEffect(() => { loadContent(); }, [loadContent]);

    /* ── Test Başlat ─────────────────────────────────────────── */
    const startTest = (test) => {
        setActiveTest(test);
        setAnswers({});
        setTextAnswers({});
        setTestResult(null);
        setCurrentQuestion(0);
        setSubmitting(false);
    };

    /* ── Cevap Kaydet ────────────────────────────────────────── */
    const handleAnswer = (key, value) => {
        setAnswers(prev => ({ ...prev, [key]: value }));
        // Otomatik sonraki soru
        if (currentQuestion < activeTest.questions.length - 1) {
            setTimeout(() => setCurrentQuestion(q => q + 1), 350);
        }
    };

    const handleTextAnswer = (key, value) => {
        setTextAnswers(prev => ({ ...prev, [key]: value }));
    };

    /* ── Testi Gönder ────────────────────────────────────────── */
    const submitTest = async () => {
        if (!activeTest || submitting) return;
        const isText = activeTest.inputType === 'text';
        const isClassList = activeTest.inputType === 'class_list';
        if (!isText && !isClassList && Object.keys(answers).length < activeTest.questions.length) {
            bildir(`Lütfen tüm ${activeTest.questions.length} soruyu cevaplayın. (${Object.keys(answers).length}/${activeTest.questions.length})`, 'uyari');
            return;
        }
        setSubmitting(true);
        try {
            const finalAnswers = (isText || isClassList) ? textAnswers : answers;
            const result = await guidanceService.submitTest(user.id, activeTest.id, finalAnswers);

            const entry = {
                ...result,
                testTitle: activeTest.title,
                testId: activeTest.id,
                date: new Date().toISOString(),
                totalQuestions: activeTest.questions.length,
            };

            // test_results_${userId} anahtarına ekle
            const key = `test_results_${user.id}`;
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            existing.unshift(entry);
            localStorage.setItem(key, JSON.stringify(existing));

            // assigned_tests'te 'completed' yap
            const assignedKey = `assigned_tests_${user.id}`;
            const assignedData = JSON.parse(localStorage.getItem(assignedKey) || '[]');
            const updated = assignedData.map(t =>
                t.testId === activeTest.id
                    ? { ...t, status: 'completed', completedDate: new Date().toISOString() }
                    : t
            );
            localStorage.setItem(assignedKey, JSON.stringify(updated));

            setTestResult(entry);
            loadContent(); // listede 'tamamlandı' badge'ini güncelle
        } catch (err) {
            bildir(hataAnlat(err, 'sonuc'), 'hata');
        }
        setSubmitting(false);
    };

    /* ── Kapat ───────────────────────────────────────────────── */
    const closeTest = () => {
        setActiveTest(null);
        setAnswers({});
        setTextAnswers({});
        setTestResult(null);
        setCurrentQuestion(0);
    };

    /* ── PDF (Premium) ─────────────────────────────────────────── */
    const downloadPDF = (result) => {
        try {
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const W = 210; const H = 297;
            const today = s(new Date(result.date || Date.now()).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }));
            const testName = s(result.testTitle || 'Psikolojik Test');
            const studentName = s(user?.name || 'Ogrenci');

            // Arka plan (Professional Light Blue Tint)
            pdf.setFillColor(248, 250, 255);
            pdf.rect(0, 0, W, H, 'F');

            // Header (Deep Indigo Gradient Simulation)
            pdf.setFillColor(30, 58, 138);
            pdf.rect(0, 0, W, 55, 'F');

            // Decorative shapes
            pdf.setFillColor(59, 130, 246, 0.2);
            pdf.circle(W, 0, 80, 'F');

            // Baslik
            pdf.setFontSize(26); pdf.setTextColor(255, 255, 255); pdf.setFont('helvetica', 'bold');
            pdf.text('PSIKOLOJIK ANALIZ RAPORU', 15, 25);
            pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(191, 219, 254);
            pdf.text('BASARI KAMPI | KOCLUK PLATFORMU', 15, 34);

            pdf.setFontSize(9); pdf.setTextColor(255, 255, 255);
            pdf.text(`Rapor No: #REF-${Math.floor(Math.random() * 90000 + 10000)}`, W - 15, 20, { align: 'right' });
            pdf.text(`Tarih: ${today}`, W - 15, 26, { align: 'right' });

            // Ana Sonuç Paneli (Geniş ve Büyük Puntolu)
            pdf.setFillColor(255, 255, 255); pdf.setDrawColor(226, 232, 240);
            pdf.roundedRect(10, 65, W - 20, 60, 5, 5, 'FD');

            pdf.setTextColor(30, 58, 138); pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
            pdf.text(s(`TEST: ${testName.toUpperCase()}`), 20, 78);

            pdf.setDrawColor(226, 232, 240); pdf.line(20, 83, W - 20, 83);

            pdf.setTextColor(100, 116, 139); pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
            pdf.text('GENEL DEGERLENDIRME SEVIYESI', 20, 93);

            pdf.setTextColor(37, 99, 235); pdf.setFontSize(28); pdf.setFont('helvetica', 'bold');
            pdf.text(s(result.level || 'Tamamlandi'), 20, 110);

            // Bilgi Bölümü
            const infoY = 135;
            pdf.setTextColor(30, 58, 138); pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
            pdf.text('OGRENCI VE UYGULAMA BILGILERI', 15, infoY);
            pdf.setDrawColor(30, 58, 138); pdf.line(15, infoY + 2, 50, infoY + 2);

            const gridY = infoY + 12;
            const labels = [['Ogrenci Adi:', s(studentName)], ['Okul No:', s(user?.schoolNumber || '-')], ['Sinif/Sube:', s(`${user?.grade || '-'}/${user?.section || '-'}`)], ['Uygulama Modu:', 'Bireysel Dijital']];

            pdf.setFontSize(11);
            labels.forEach((item, i) => {
                const y = gridY + (i * 9);
                pdf.setTextColor(100, 116, 139); pdf.setFont('helvetica', 'bold');
                pdf.text(item[0], 15, y);
                pdf.setTextColor(30, 41, 59); pdf.setFont('helvetica', 'normal');
                pdf.text(String(item[1]), 55, y);
            });

            // Derin Analiz ve Yorum
            const analysisY = gridY + 45;
            pdf.setFillColor(255, 255, 255); pdf.setDrawColor(226, 232, 240);
            pdf.roundedRect(10, analysisY, W - 20, 80, 4, 4, 'FD');

            pdf.setTextColor(30, 58, 138); pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
            pdf.text('BILIMSEL ANALIZ VE KOC YORUMU', 18, analysisY + 10);

            pdf.setTextColor(51, 65, 85); pdf.setFontSize(12); pdf.setFont('helvetica', 'normal');
            const comment = s(result.comment || result.detail || 'Test verileri basariyla islenmis ve analiz edilmistir.');
            const scientificText = "\n\nBu rapor, ogrencinin test sirasindaki bilissel yanitlari ve davranissal paternleri uzerine insa edilmistir. Elde edilen bulgular, akademik basariyi etkileyen psikososyal faktorleri optimize etmek amaciyla modern rehberlik yaklasimlariyla degerlendirilmistir.";

            const splitText = pdf.splitTextToSize(comment + scientificText, W - 35);
            pdf.text(splitText, 18, analysisY + 20);

            // Paylasilabilir Link (Mock)
            pdf.setTextColor(37, 99, 235); pdf.setFontSize(9);
            pdf.text('Rapor Dogrulama Linki: app.koc.ai/verify/' + (result.id || 'internal'), 15, H - 25);

            // Footer
            pdf.setFillColor(30, 58, 138); pdf.rect(0, H - 15, W, 15, 'F');
            pdf.setFontSize(8); pdf.setTextColor(255, 255, 255); pdf.setFont('helvetica', 'normal');
            pdf.text('BU RAPOR BASARI KAMPI TARAFINDAN URETILMISTIR. RESMI EVRAK NITELIGI TASIMAZ.', W / 2, H - 6, { align: 'center' });

            savePDF(pdf, `${studentName.replace(/\s+/g, '_')}_${testName}_Analiz`);
        } catch (e) {
            console.error('PDF hatasi:', e);
            bildir('PDF oluşturulurken bir hata oluştu.', 'hata');
        }
    };


    /* ── Hesaplamalar ────────────────────────────────────────── */
    const isText = activeTest?.inputType === 'text';
    const isClassList = activeTest?.inputType === 'class_list';
    const totalQ = activeTest?.questions?.length || 0;

    // Açık uçlu veya sosyometri (isClassList) ise farklı say
    let answeredCount = 0;
    if (isText || isClassList) {
        answeredCount = Object.keys(textAnswers).filter(k => textAnswers[k] && textAnswers[k].length > 0).length;
    } else {
        answeredCount = Object.keys(answers).length;
    }

    const progress = totalQ > 0 ? (answeredCount / totalQ) * 100 : 0;
    const currentQ = activeTest?.questions?.[currentQuestion];
    const currentKey = currentQ ? questionKey(currentQ, currentQuestion) : null;
    const currentOptions = currentQ ? normalizeOptions(activeTest, currentQ) : [];

    /* ── Classmates Logic ── */
    const classmates = React.useMemo(() => {
        if (!isClassList) return [];
        try {
            const list = JSON.parse(localStorage.getItem('coach_students') || '[]');
            return list.filter(s => s.grade === user?.grade && s.section === user?.section && s.id !== user?.id)
                .sort((a, b) => a.name.localeCompare(b.name));
        } catch { return []; }
    }, [isClassList, user]);

    const handleClassmateSelect = (key, studentName, maxSelect = 3) => {
        setTextAnswers(prev => {
            const current = Array.isArray(prev[key]) ? prev[key] : [];
            if (current.includes(studentName)) {
                return { ...prev, [key]: current.filter(n => n !== studentName) };
            }
            if (current.length >= maxSelect) {
                bildir(`En fazla ${maxSelect} kişi seçebilirsiniz.`);
                return prev;
            }
            return { ...prev, [key]: [...current, studentName] };
        });
    };

    /* ═══════════════════════════ UI ════════════════════════════ */
    return (
        <div className="bg-surface-2 min-h-screen p-4 sm:p-8">
            <div className="max-w-5xl mx-auto">

                {/* Hero */}
                <div className="on-color bg-gradient-to-r from-brand via-c4 to-c5 rounded-3xl p-7 text-white shadow-xl mb-7 relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 opacity-10 pointer-events-none"><Brain size={180} /></div>
                    <div className="relative flex items-center gap-4">
                        <Brain size={38} />
                        <div>
                            <h1 className="text-2xl font-black">Rehberlik & Testler</h1>
                            <p className="text-sm mt-0.5 opacity-80">Kendini keşfet, potansiyelini ortaya çıkar</p>
                        </div>
                    </div>
                </div>

                {/* Tab Bar */}
                <div className="flex gap-2 bg-surface p-2 rounded-2xl shadow-sm border border-line mb-7">
                    {[
                        { id: 'tests', icon: Brain, label: 'Testler ve Envanterler' },
                        { id: 'results', icon: BarChart2, label: 'Sonuçlarım' },
                        { id: 'articles', icon: BookOpen, label: 'Rehberlik Yazıları' },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setView(tab.id)}
                            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${view === tab.id
                                ? 'bg-gradient-to-r from-brand to-purple-600 text-white shadow'
                                : 'text-ink-2 hover:bg-surface-2'}`}
                        >
                            <tab.icon size={15} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* ── TESTLER ── */}
                {view === 'tests' && (
                    tests.length === 0 ? (
                        <div className="bg-surface rounded-3xl border-2 border-dashed border-line p-16 text-center">
                            <div className="w-20 h-20 bg-brand-soft rounded-full flex items-center justify-center mx-auto mb-4">
                                <Brain size={38} className="text-brand" />
                            </div>
                            <h3 className="text-xl font-bold text-ink-2 mb-2">Henüz Test Atanmadı</h3>
                            <p className="text-ink-2 text-sm">Koçunuz sana test atadığında burada görünür.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {tests.map(test => (
                                <div key={test.id}
                                    className={`bg-surface rounded-2xl shadow-sm border overflow-hidden hover:shadow-lg transition-all ${test.isCompleted ? 'border-ok' : 'border-line hover:border-brand-line'}`}
                                >
                                    <div className="on-color bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-ink relative overflow-hidden">
                                        <div className="absolute -top-6 -right-6 opacity-15 pointer-events-none"><Brain size={90} /></div>
                                        <div className="relative">
                                            <div className="w-11 h-11 bg-surface/20 rounded-xl flex items-center justify-center mb-3">
                                                <FileText size={22} />
                                            </div>
                                            <h3 className="font-bold text-lg leading-tight">{test.title}</h3>
                                            <div className="flex gap-3 mt-2 text-xs text-brand">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={11} />{Math.max(5, Math.ceil((test.questions?.length || 0) * 0.4))} dk
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <FileText size={11} />{test.questions?.length || 0} soru
                                                </span>
                                                {test.isCompleted && (
                                                    <span className="flex items-center gap-1 bg-green-400/30 px-2 py-0.5 rounded-full font-bold">
                                                        <CheckCircle size={10} /> Tamamlandı
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <p className="text-ink-2 text-sm leading-relaxed mb-4 min-h-[40px]">
                                            {test.desc || test.description || ''}
                                        </p>
                                        {test.isCompleted ? (
                                            <div className="w-full py-2 bg-ok-soft text-ok rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                                                <CheckCircle size={15} /> Tamamlandı
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => startTest(test)}
                                                className="on-color w-full bg-gradient-to-r from-brand to-purple-600 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                            >
                                                <Play size={15} fill="currentColor" /> Teste Başla
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* ── SONUÇLAR ── */}
                {view === 'results' && (
                    testResults.length === 0 ? (
                        <div className="bg-surface rounded-3xl border-2 border-dashed border-line p-14 text-center">
                            <BarChart2 size={44} className="text-c4 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-ink-2 mb-2">Henüz Sonuç Yok</h3>
                            <p className="text-ink-2 text-sm">Test tamamladıktan sonra sonuçların burada görünür.</p>
                            <button onClick={() => setView('tests')}
                                className="mt-4 bg-brand text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-brand-hover transition">
                                Testlere Git
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {testResults.map((r, i) => (
                                <div key={i} className="bg-surface rounded-2xl p-5 shadow-sm border border-line flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition">
                                    <div className="on-color w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center text-ink flex-shrink-0">
                                        <CheckCircle size={22} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-ink truncate">{r.testTitle || 'Test'}</p>
                                        <p className="text-xs text-ink-2 flex items-center gap-1 mt-0.5">
                                            <Calendar size={11} />
                                            {r.date ? new Date(r.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                                        </p>
                                        {r.comment && <p className="text-sm text-ink-2 mt-1 italic">"{r.comment}"</p>}
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className="bg-brand-soft text-brand px-3 py-1 rounded-lg text-sm font-bold">{r.level || 'Tamamlandı'}</span>
                                        <button onClick={() => downloadPDF(r)}
                                            className="flex items-center gap-1.5 bg-brand text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-hover transition">
                                            <Download size={14} /> PDF
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* ── MAKALELER ── */}
                {view === 'articles' && (
                    <div className="space-y-5">
                        {articles.map(a => (
                            <div key={a.id} className="bg-surface rounded-2xl shadow-sm border border-line p-7 hover:shadow-md transition">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="px-3 py-1 bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] text-c4 rounded-full text-xs font-bold uppercase">{a.category}</span>
                                    <span className="text-xs text-ink-3 flex items-center gap-1"><Clock size={11} /> 5 dk okuma</span>
                                </div>
                                <h3 className="text-xl font-black text-ink mb-3">{a.title}</h3>
                                <div className="text-ink-2 text-sm leading-relaxed whitespace-pre-line">{a.content}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ══════════ TEST MODAL ══════════ */}
            {activeTest && (
                <Modal
                    acik
                    onClose={closeTest}
                    baslikGizle
                    genislik="lg"
                    katmanClassName="z-modal-top"
                    govdeClassName="p-0 flex flex-col overflow-hidden"
                >

                    {/* Modal Header */}
                    <div className="on-color bg-gradient-to-r from-brand to-purple-600 p-5 text-white flex-shrink-0">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 pr-3">
                                <h2 className="text-lg font-bold leading-tight">{activeTest.title}</h2>
                                {!testResult && (
                                    <p className="text-brand text-xs mt-1">
                                        Soru {currentQuestion + 1} / {totalQ}
                                        {(!isText && !isClassList) && ` • ${answeredCount} cevaplandı`}
                                    </p>
                                )}
                            </div>
                            <button onClick={closeTest} className="bg-surface/10 hover:bg-surface/25 p-2 rounded-full transition flex-shrink-0">
                                <X size={18} />
                            </button>
                        </div>
                        {!testResult && !isText && !isClassList && (
                            <div className="w-full bg-surface/20 rounded-full h-1.5 mt-2">
                                <div className="h-full bg-surface rounded-full transition-all duration-yavas" style={{ width: `${progress}%` }} />
                            </div>
                        )}
                    </div>

                    {/* Modal Body */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-5 bg-surface-2">
                        {testResult ? (
                            /* ── SONUÇ EKRANI ── */
                            <div className="text-center py-8">
                                <div className="on-color w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-200">
                                    <CheckCircle size={42} className="text-ink" />
                                </div>
                                <h3 className="text-2xl font-black text-ink mb-1">Test Tamamlandı!</h3>
                                <p className="text-ink-2 mb-5 text-sm">Harika iş çıkardın! İşte sonuçların:</p>
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-2xl border border-brand-line max-w-sm mx-auto text-left">
                                    <div className="flex justify-between items-center pb-3 border-b border-brand-line mb-3">
                                        <span className="font-bold text-ink-2 text-xs uppercase tracking-wide">Değerlendirme</span>
                                        <span className="font-black text-brand text-xl">{testResult.level}</span>
                                    </div>
                                    {testResult.comment && (
                                        <p className="text-ink-2 text-sm italic">"{testResult.comment}"</p>
                                    )}
                                    <button onClick={() => downloadPDF(testResult)}
                                        className="on-color w-full mt-4 bg-gradient-to-r from-brand to-purple-600 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition text-sm">
                                        <Download size={16} /> Raporu PDF İndir
                                    </button>
                                </div>
                            </div>
                        ) : isText ? (
                            /* ── AÇIK UÇLU (Beier tarzı) ── */
                            <div className="space-y-4">
                                <p className="text-sm text-ink-2 bg-surface rounded-xl p-3 border border-line">
                                    Aşağıdaki cümleleri içinizden geçen ilk düşünceyle tamamlayın. Yanlış cevap yoktur.
                                </p>
                                {activeTest.questions.map((q, i) => {
                                    const k = questionKey(q, i);
                                    return (
                                        <div key={k} className="bg-surface rounded-xl p-4 border border-line shadow-sm">
                                            <p className="font-semibold text-ink mb-2 text-sm">
                                                <span className="text-brand font-bold mr-2">{i + 1}.</span>{q.text}
                                            </p>
                                            <input
                                                type="text"
                                                value={textAnswers[k] || ''}
                                                onChange={e => handleTextAnswer(k, e.target.value)}
                                                placeholder="Cevabınızı yazın..."
                                                className="w-full border-2 border-line rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none transition"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : isClassList ? (
                            /* ── SOSYOMETRİ (Sınıf Listesi - Tek Soru Görünümü) ── */
                            <div className="space-y-4">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-info flex items-center justify-between mb-2">
                                    <div>
                                        <p className="text-sm font-bold text-ink">Sınıf Listesi Seçimi</p>
                                        <p className="text-xs text-ink-2 mt-0.5">Mevcut sınıfınızdaki öğrencileri görebilirsiniz.</p>
                                    </div>
                                    <div className="px-3 py-1 bg-surface rounded-lg text-brand font-bold text-xs border border-brand-line shadow-sm">{user?.grade}/{user?.section}</div>
                                </div>

                                {/* Sadece aktif soruyu göster */}
                                {activeTest.questions.map((q, i) => {
                                    if (i !== currentQuestion) return null;
                                    const k = questionKey(q, i);
                                    const getMaxSelect = (text) => {
                                        const match = text.match(/en fazla (\d+)/i);
                                        return match ? parseInt(match[1]) : 3;
                                    };
                                    const maxSelect = getMaxSelect(q.text);
                                    const selectedArr = textAnswers[k] || [];
                                    // Açık/kapalı durumu bileşen seviyesindeki haritadan okunur
                                    const showList = Boolean(acikListeler[k]);
                                    const setShowList = (v) => setAcikListeler(
                                        (p) => ({ ...p, [k]: typeof v === 'boolean' ? v : !p[k] })
                                    );

                                    return (
                                        <div key={k} className="bg-surface rounded-2xl border-2 border-brand-line shadow-lg overflow-hidden transition-all">
                                            <div className="p-6 bg-surface border-b border-line">
                                                <div className="flex items-start gap-4 mb-4">
                                                    <span className="bg-brand text-white font-bold w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0">
                                                        {i + 1}
                                                    </span>
                                                    <div>
                                                        <p className="font-bold text-ink text-lg leading-snug">
                                                            {q.text}
                                                        </p>
                                                        <p className="text-xs text-brand mt-2 font-black uppercase tracking-wider">
                                                            Şu an {selectedArr.length} / {maxSelect} kişi seçildi
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Tek Şık Olarak Buton (User istediği için) */}
                                                <button
                                                    onClick={() => setShowList(!showList)}
                                                    className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all font-bold ${showList ? 'bg-brand text-white border-indigo-600' : 'bg-brand-soft text-brand border-brand-line hover:bg-brand-soft'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <CheckCircle size={20} />
                                                        <span>{showList ? 'Listeyi Kapat' : 'Sınıf Listesini Görüntüle ve Seç'}</span>
                                                    </div>
                                                    <ChevronRight size={18} className={`transition-transform ${showList ? 'rotate-90' : ''}`} />
                                                </button>
                                            </div>

                                            {/* Açılan Sınıf Listesi */}
                                            {showList && (
                                                <div className="p-6 bg-surface-2 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-yavas">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {classmates.length === 0 ? (
                                                            <div className="col-span-1 sm:col-span-2 text-center text-ink-2 text-sm py-8 bg-surface rounded-2xl border-2 border-dashed border-line">
                                                                Sınıf arkadaşınız bulunamadı veya sistemde kayıtlı değil.
                                                            </div>
                                                        ) : classmates.map(c => {
                                                            const isSelected = selectedArr.includes(c.name);
                                                            const selectedIndex = selectedArr.indexOf(c.name);
                                                            return (
                                                                <button
                                                                    key={c.id}
                                                                    onClick={() => handleClassmateSelect(k, c.name, maxSelect)}
                                                                    className={`p-3 rounded-xl border-2 flex items-center justify-between transition-all text-sm font-bold ${isSelected ? 'bg-brand-soft border-indigo-400 text-brand shadow-md ring-2 ring-indigo-200 ring-opacity-50' : 'bg-surface border-line text-ink-2 hover:border-brand-line'}`}
                                                                >
                                                                    <span className="truncate">{c.name}</span>
                                                                    {isSelected && (
                                                                        <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center font-black text-sm flex-shrink-0 animate-in zoom-in-50 duration-normal">
                                                                            {selectedIndex + 1}
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* ── ÇOKTAN SEÇMELİ ── */
                            <div>
                                {activeTest.questions.map((q, i) => {
                                    const k = questionKey(q, i);
                                    const opts = normalizeOptions(activeTest, q);
                                    return (
                                        <div key={k} className={i === currentQuestion ? 'block' : 'hidden'}>
                                            <div className="bg-surface p-5 rounded-2xl shadow-sm border border-line">
                                                <div className="flex items-start gap-3 mb-4">
                                                    <span className="on-color bg-gradient-to-br from-indigo-500 to-purple-600 text-ink font-bold w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm">
                                                        {i + 1}
                                                    </span>
                                                    <p className="font-bold text-ink leading-relaxed">{q.text}</p>
                                                </div>
                                                <div className="space-y-2.5">
                                                    {opts.map((opt, oi) => {
                                                        const selected = answers[k] === opt.value;
                                                        return (
                                                            <button key={oi} onClick={() => handleAnswer(k, opt.value)}
                                                                className={`w-full text-left p-3.5 rounded-xl text-sm font-medium transition-all border-2 flex items-center gap-3 ${selected
                                                                    ? 'bg-gradient-to-r from-brand to-purple-600 text-white border-indigo-600 shadow scale-[1.01]'
                                                                    : 'bg-surface text-ink-2 border-line hover:border-brand-line hover:bg-brand-soft'}`}
                                                            >
                                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'border-white' : 'border-line-2'}`}>
                                                                    {selected && <div className="w-2.5 h-2.5 bg-surface rounded-full" />}
                                                                </div>
                                                                <span className="flex-1">{opt.label}</span>
                                                                {selected && <CheckCircle size={16} className="flex-shrink-0" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Modal Footer */}
                    {!testResult && (
                        <div className="p-4 border-t border-line bg-surface flex justify-between items-center flex-shrink-0">
                            {/* Geri butonu */}
                            <div>
                                {(!isText && !isClassList) && currentQuestion > 0 && (
                                    <button onClick={() => setCurrentQuestion(q => q - 1)}
                                        className="px-4 py-2 bg-surface-3 text-ink-2 rounded-xl font-bold hover:bg-surface-3 transition text-sm">
                                        ← Önceki
                                    </button>
                                )}
                            </div>
                            {/* İleri / Bitir */}
                            <div className="flex items-center gap-3">
                                {(!isText && !isClassList) && currentQuestion < totalQ - 1 && (
                                    <button
                                        onClick={() => setCurrentQuestion(q => q + 1)}
                                        disabled={answers[currentKey] === undefined}
                                        className="on-color px-5 py-2 bg-gradient-to-r from-brand to-purple-600 text-white rounded-xl font-bold hover:shadow text-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Sonraki <ChevronRight size={15} />
                                    </button>
                                )}
                                {(isText || isClassList || currentQuestion === totalQ - 1) && (
                                    <button
                                        onClick={submitTest}
                                        disabled={submitting || (!isText && !isClassList && answeredCount < totalQ)}
                                        className="on-color px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-ink rounded-xl font-bold hover:shadow text-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? '⏳ İşleniyor...' : <><CheckCircle size={15} /> Testi Tamamla</>}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    {testResult && (
                        <div className="p-4 border-t border-line bg-surface flex justify-end flex-shrink-0">
                            <button onClick={closeTest}
                                className="px-5 py-2 bg-surface-inv text-white rounded-xl font-bold hover:bg-surface-inv transition text-sm">
                                Kapat
                            </button>
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
};

export default StudentTestsTab;
