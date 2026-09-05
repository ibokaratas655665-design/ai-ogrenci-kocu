import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Target, CheckCircle, BarChart2, Download, X, Calendar } from 'lucide-react';
import guidanceService from '../services/guidanceService';
import ComparativeAnalysis, { KonuBazindaAnaliz } from '../components/charts/ComparativeAnalysis';
import ReportCard from '../components/reports/ReportCard';
import html2pdf from 'html2pdf.js';
import { bildir } from '../services/uiGeriBildirim';
import { hataAnlat } from '../services/hataMesaji';
import Modal from '../components/ui/Modal';
import { listeOku } from '../services/veriDeposu';

/* Seçenek normalizasyonu (StudentTestsTab ile aynı sözleşme):
   MEB envanterlerinde soru bazlı options olmayabilir ya da nesne
   biçiminde gelebilir — `q.options.map(opt => {opt})` bu testlerde
   çöküyordu. Sıra: soruya özgü → test geneli → Evet/Hayır. */
function normalizeOptions(test, question) {
    if (test?.inputType === 'class_list' || test?.inputType === 'text') return [];
    if (Array.isArray(question?.options) && question.options.length > 0) {
        return question.options.map((o, i) =>
            typeof o === 'string' ? { label: o, value: i } :
                typeof o === 'object' && o !== null && (o.label || o.text) ? { label: o.label || o.text, value: i } :
                    { label: String(o), value: i }
        );
    }
    if (Array.isArray(test?.options) && test.options.length > 0) {
        return test.options.map((o, i) =>
            typeof o === 'string' ? { label: o, value: i } :
                typeof o === 'object' && o !== null && (o.label || o.text) ? { label: o.label || o.text, value: i } :
                    { label: String(o), value: i }
        );
    }
    return [
        { label: 'Evet', value: 1 },
        { label: 'Hayır', value: 0 },
    ];
}

const TrialsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('tests'); // 'tests', 'results', 'analysis'
    const [tests, setTests] = useState([]);
    const [results, setResults] = useState([]);
    const reportCardRef = useRef(null);

    // Test Taking State
    const [activeTest, setActiveTest] = useState(null);
    const [answers, setAnswers] = useState({});
    const [testResult, setTestResult] = useState(null);

    const location = useLocation();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Handle query params for tab selection
        const searchParams = new URLSearchParams(location.search);
        const tabParam = searchParams.get('tab');
        if (tabParam && ['analysis', 'results', 'tests'].includes(tabParam)) {
            setActiveTab(tabParam);
        }

        loadContent();
    }, [user, location.search]);

    const loadContent = () => {
        setTests(guidanceService.getTests());
        
        // Fetch all results: Guidance + YKS Exams
        const guidanceRes = guidanceService.getStudentResults(user.id);
        
        const v2Results = listeOku('v2_results_data');
        const legacyResults = listeOku('exams_data');
        
        const sName = user.name.toLowerCase().trim();
        const sNum = (user.schoolNumber || user.number || '').toString().trim();
        
        const filteredV2 = v2Results.filter(r => 
            (r.number && r.number.toString().trim() === sNum) ||
            (r.student && r.student.toLowerCase().trim().includes(sName))
        ).map(r => ({
            ...r,
            testTitle: r.examName || r.title || `${r.examType} Denemesi`,
            score: r.totalNet,
            level: 'Deneme Sınavı'
        }));
        
        const filteredLegacy = legacyResults.filter(r => 
            (r.studentId && r.studentId.toString() === user.id.toString()) ||
            (sNum && r.number && r.number.toString().trim() === sNum) ||
            (r.student && r.student.toLowerCase().trim().includes(sName))
        ).map(r => ({
            ...r,
            testTitle: r.title || r.examName || 'Eski Deneme',
            score: r.score || r.totalNet,
            level: 'Sınav Kaydı'
        }));

        const combined = [...guidanceRes, ...filteredV2, ...filteredLegacy].sort((a,b) => new Date(b.date) - new Date(a.date));
        setResults(combined);
    };

    const startTest = (test) => {
        setActiveTest(test);
        setAnswers({});
        setTestResult(null);
    };

    const handleAnswer = (questionId, optionIndex) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    };

    const submitTest = async () => {
        if (!activeTest) return;
        if (Object.keys(answers).length < activeTest.questions.length) {
            bildir("Lütfen tüm soruları cevaplayın.", 'uyari');
            return;
        }

        const result = await guidanceService.submitTest(user.id, activeTest.id, answers);
        setTestResult(result);
        loadContent();
    };

    const closeTest = () => {
        setActiveTest(null);
        setAnswers({});
        setTestResult(null);
    };

    const handleDownloadReport = () => {
        const element = reportCardRef.current;
        if (!element) return;
        const opt = {
            margin: 0,
            filename: `Ogrenci_Karnesi_${user.name}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // Import dynamically to avoid top-level issues if any
            const { parseExcelExamData } = await import('../utils/excelParser');
            const data = await parseExcelExamData(file, 'TYT'); // Defaulting to TYT for now, could be selectable

            if (data && data.results) {
                // Filter results for current student if name matches, or just take all if it's their private upload
                // For this scenario, we assume the student is uploading their own single result or a list where they exist.
                // Or simplified: We just take the first result that looks like them, or all if it's a bulk history upload.
                // Let's assume it's a history file or a class list where we find the student.

                // For simplicity in this "Student Coach" app, we admit all results as "My History" if user confirms.
                // Or try to match name.

                const myResults = data.results.filter(r =>
                    r.student.toLowerCase().includes(user.name.toLowerCase()) ||
                    user.name.toLowerCase().includes(r.student.toLowerCase())
                );

                const resultsToSave = myResults.length > 0 ? myResults : data.results; // Fallback to all if no name match (demo mode)

                if (resultsToSave.length === 0) {
                    bildir("Dosyada isminizle eşleşen sonuç bulunamadı.", 'hata');
                    return;
                }

                guidanceService.addBulkResults(user.id, resultsToSave);
                loadContent();
                bildir(`${resultsToSave.length} adet sınav sonucu başarıyla yüklendi.`, 'basari');
                setActiveTab('results');
            }
        } catch (error) {
            console.error("Upload error:", error);
            bildir(hataAnlat(error, 'excel'), 'hata');
        }
    };

    return (
        <div className="min-h-screen bg-surface-2 p-4 sm:p-8">
            <header className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-ink flex items-center">
                        <Target className="mr-3 text-brand" size={32} />
                        Deneme Sınavları & Analiz
                    </h1>
                    <p className="text-ink-2 mt-2">Deneme sınavlarını çöz, sonuçlarını gör ve gelişimini takip et.</p>
                </div>
                <div className="flex gap-3">
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="excel-upload"
                    />
                    <label
                        htmlFor="excel-upload"
                        className="flex items-center space-x-2 bg-ok text-white px-4 py-2 rounded-xl font-bold hover:bg-ok transition shadow-lg shadow-green-200 cursor-pointer"
                    >
                        <BarChart2 size={18} />
                        <span>Excel Yükle</span>
                    </label>
                    <button
                        onClick={handleDownloadReport}
                        className="flex items-center space-x-2 bg-brand text-white px-4 py-2 rounded-xl font-bold hover:bg-brand-hover transition shadow-lg shadow-indigo-200"
                    >
                        <Download size={18} />
                        <span>Karne İndir</span>
                    </button>
                    <button
                        onClick={() => navigate('/student/dashboard')}
                        className="bg-surface border border-line text-ink-2 px-4 py-2 rounded-xl font-bold hover:bg-surface-2 transition"
                    >
                        Panele Dön
                    </button>
                </div>
            </header>

            <div className="max-w-6xl mx-auto">
                {/* Tabs */}
                <div className="flex mb-6 border-b border-line overflow-x-auto">
                    {[
                        { id: 'tests', label: 'Deneme Sınavları', icon: Target },
                        { id: 'results', label: 'Sonuçlarım', icon: CheckCircle },
                        { id: 'analysis', label: 'Analiz & Raporlar', icon: BarChart2 },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`-mb-px pb-3 px-0.5 mr-5 border-b-2 transition flex items-center whitespace-nowrap ${activeTab === tab.id
                                ? 'text-brand border-brand font-semibold'
                                : 'text-ink-3 border-transparent hover:text-ink-2 font-medium'}`}
                        >
                            <tab.icon size={16} className="mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="space-y-6 animate-fade-in min-h-[500px]">

                    {/* Hidden Report Card Container for PDF Generation */}
                    <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                        <ReportCard ref={reportCardRef} studentResults={results} userName={user.name} />
                    </div>

                    {activeTab === 'analysis' && (
                        <div className="space-y-8">
                            <ComparativeAnalysis studentResults={results} />
                            {/* 04.09: SubjectAnalysis (sahte konu başarısı) yerine dürüst kart */}
                            <KonuBazindaAnaliz />
                        </div>
                    )}

                    {activeTab === 'tests' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tests.map(test => (
                                <div key={test.id} className="bg-surface p-6 rounded-2xl shadow-sm border border-line hover:shadow-md transition group flex flex-col justify-between h-full">
                                    <div>
                                        <div className="w-12 h-12 bg-brand-soft rounded-xl flex items-center justify-center text-brand mb-4 group-hover:scale-110 transition">
                                            <Target size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-ink group-hover:text-brand transition mb-2">{test.title}</h3>
                                        {/* Alan adı `desc` (tests.js) — `description` yoktu, açıklamalar hep boş kalıyordu.
    Yönerge kısmı test ekranında gösterilir; kartta yalnız ilk satır yeter. */}
<p className="text-ink-2 text-sm leading-relaxed">{(test.desc || test.description || '').split('\n')[0]}</p>
                                    </div>
                                    <button
                                        onClick={() => startTest(test)}
                                        className="mt-6 w-full bg-brand-soft text-brand px-4 py-3 rounded-xl font-bold hover:bg-brand hover:text-ink transition"
                                    >
                                        Teste Başla
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'results' && (
                        <div className="space-y-4">
                            {results.length > 0 ? (
                                results.map(result => (
                                    <div key={result.id} className="bg-surface p-6 rounded-2xl shadow-sm border border-line flex items-center justify-between hover:border-brand-line transition">
                                        <div className="flex items-center">
                                            <div className="w-12 h-12 bg-ok-soft rounded-full flex items-center justify-center text-ok mr-4 font-bold text-lg">
                                                {result.score ? result.score.toString().substring(0, 1) : 'A'}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-ink text-lg">{result.testTitle || 'Deneme Sınavı'}</h4>
                                                <p className="text-sm text-ink-3 mt-1 flex items-center">
                                                    <Calendar size={14} className="mr-1" />
                                                    {new Date(result.date).toLocaleDateString('tr-TR')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-brand">{result.level || result.score}</div>
                                            <div className="text-xs text-ink-2 font-medium bg-surface-3 px-2 py-1 rounded mt-1">Sonuç/Puan</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 bg-surface rounded-3xl border border-dashed border-line-2">
                                    <div className="w-20 h-20 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4 text-ink-3">
                                        <Target size={40} />
                                    </div>
                                    <h3 className="text-lg font-bold text-ink">Henüz Sonuç Yok</h3>
                                    <p className="text-ink-2 max-w-sm mx-auto mt-2">Test çözdükçe veya deneme sınavı girdikçe sonuçların burada listelenecek.</p>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* Test Modal */}
            {activeTest && (
                <Modal
                    acik
                    onClose={closeTest}
                    baslikGizle
                    genislik="lg"
                    govdeClassName="p-0 flex flex-col overflow-hidden"
                >
                    <div className="shrink-0 bg-brand p-6 text-white flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold">{activeTest.title}</h2>
                            <p className="text-brand text-sm mt-1">{activeTest.questions.length} Soru</p>
                        </div>
                        <button onClick={closeTest} className="bg-surface/10 hover:bg-surface/20 p-2 rounded-full transition"><X size={20} /></button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-8 bg-surface-2">
                        {!testResult ? (
                            activeTest.questions.map((q, idx) => (
                                <div key={q.id} className="bg-surface p-6 rounded-2xl shadow-sm border border-line">
                                    <div className="flex items-start mb-4">
                                        <span className="bg-brand-soft text-brand font-bold w-8 h-8 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">{idx + 1}</span>
                                        <p className="font-bold text-ink text-lg leading-relaxed">{q.text}</p>
                                    </div>
                                    <div className="space-y-3 pl-11">
                                        {normalizeOptions(activeTest, q).map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => handleAnswer(q.id, opt.value)}
                                                className={`w-full text-left p-4 rounded-xl text-base font-medium transition flex items-center border ${answers[q.id] === opt.value
                                                    ? 'bg-brand text-white border-indigo-600 shadow-md shadow-indigo-200'
                                                    : 'bg-surface-2 hover:bg-surface text-ink-2 border-transparent hover:border-line hover:shadow-sm'}`}
                                            >
                                                <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${answers[q.id] === opt.value ? 'border-white' : 'border-line-2'}`}>
                                                    {answers[q.id] === opt.value && <div className="w-2.5 h-2.5 bg-surface rounded-full" />}
                                                </div>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-24 h-24 bg-ok-soft rounded-full flex items-center justify-center mx-auto mb-6 text-ok shadow-xl shadow-green-100 animate-bounce-short">
                                    <CheckCircle size={48} />
                                </div>
                                <h3 className="text-3xl font-black text-ink mb-2">Test Tamamlandı!</h3>
                                <p className="text-ink-2 mb-8 text-lg">Harika iş çıkardın, işte sonuçların:</p>

                                <div className="bg-brand-soft p-8 rounded-3xl border border-brand-line inline-block text-left w-full max-w-md mx-auto shadow-inner">
                                    <div className="flex justify-between items-center mb-6 pb-6 border-b border-brand-line">
                                        <span className="font-bold text-ink-2 uppercase tracking-wider text-sm">Seviye</span>
                                        <span className="font-black text-brand text-2xl">{testResult.level}</span>
                                    </div>
                                    <div className="bg-surface p-6 rounded-2xl text-ink-2 leading-relaxed shadow-sm text-center italic">
                                        "{testResult.comment}"
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-line bg-surface flex justify-end">
                        {!testResult ? (
                            <button
                                onClick={submitTest}
                                className="bg-brand text-white px-10 py-4 rounded-xl font-bold shadow-xl shadow-indigo-200 hover:shadow-indigo-300 hover:scale-105 transition active:scale-95"
                            >
                                Testi Tamamla
                            </button>
                        ) : (
                            <button
                                onClick={closeTest}
                                className="bg-surface-inv text-white px-10 py-4 rounded-xl font-bold shadow-lg hover:bg-surface-inv transition hover:scale-105"
                            >
                                Kapat ve Sonuçlara Dön
                            </button>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default TrialsPage;
