import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Brain, BookOpen, CheckCircle, Award, BarChart2, Download,
    X, Play, Clock, FileText, TrendingUp, Calendar, Target,
    PieChart, Activity, Star, ChevronRight, Share2
} from 'lucide-react';

import guidanceService from '../services/guidanceService';
import { jsPDF } from 'jspdf';
import { savePDF } from '../utils/pdfSave';

const GuidancePage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('tests'); // 'tests', 'results', 'articles'
    const [tests, setTests] = useState([]);
    const [articles, setArticles] = useState([]);
    const [testResults, setTestResults] = useState([]);

    // Test Taking State
    const [activeTest, setActiveTest] = useState(null);
    const [answers, setAnswers] = useState({});
    const [testResult, setTestResult] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);

    const location = useLocation();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        loadContent();
    }, [user]);

    const loadContent = () => {
        // TÜM testleri al
        const allTests = guidanceService.getTests();

        // ÖĞRENCİ İÇİN: Sadece atanan testleri göster
        const assignedTestsKey = `assigned_tests_${user.id}`;
        const assignedTestsData = localStorage.getItem(assignedTestsKey);

        if (assignedTestsData) {
            try {
                const assignedTests = JSON.parse(assignedTestsData);
                const assignedTestIds = assignedTests.map(t => t.testId);

                // Sadece atananları filtrele
                const filteredTests = allTests.filter(test => assignedTestIds.includes(test.id));

                // "Atandı" flag'i ile işaretle
                const testsWithFlag = filteredTests.map(test => ({
                    ...test,
                    isAssigned: true
                }));

                setTests(testsWithFlag);
            } catch (err) {
                console.error('Atanmış testler yüklenemedi:', err);
                setTests([]);
            }
        } else {
            setTests([]);
        }

        setArticles(guidanceService.getArticles());
        loadTestResults();
    };

    const loadTestResults = () => {
        const resultsKey = `test_results_${user.id}`;
        const savedResults = localStorage.getItem(resultsKey);
        if (savedResults) {
            try {
                setTestResults(JSON.parse(savedResults));
            } catch (err) {
                setTestResults([]);
            }
        }
    };

    const startTest = (test) => {
        setActiveTest(test);
        setAnswers({});
        setTestResult(null);
        setCurrentQuestion(0);
    };

    const handleAnswer = (questionId, optionIndex) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));

        // Auto-advance to next question
        if (currentQuestion < activeTest.questions.length - 1) {
            setTimeout(() => setCurrentQuestion(currentQuestion + 1), 500);
        }
    };

    const submitTest = async () => {
        if (!activeTest) return;

        if (Object.keys(answers).length < activeTest.questions.length) {
            alert("Lütfen tüm soruları cevaplayın.");
            return;
        }

        const result = await guidanceService.submitTest(user.id, activeTest.id, answers);

        // Save result to localStorage
        const resultsKey = `test_results_${user.id}`;
        const currentResults = JSON.parse(localStorage.getItem(resultsKey) || '[]');
        const newResult = {
            ...result,
            testTitle: activeTest.title,
            testId: activeTest.id,
            date: new Date().toISOString(),
            totalQuestions: activeTest.questions.length
        };
        currentResults.unshift(newResult);
        localStorage.setItem(resultsKey, JSON.stringify(currentResults));

        setTestResult(newResult);
        loadTestResults();
    };

    const closeTest = () => {
        setActiveTest(null);
        setAnswers({});
        setTestResult(null);
        setCurrentQuestion(0);
    };

    const handleShareResult = (result) => {
        try {
            const sharedObj = {
                studentName: user.name,
                testTitle: result.testTitle,
                level: result.level,
                comment: result.comment || result.detail,
                date: result.date,
                studentInfo: { schoolNumber: user.schoolNumber || '-' }
            };
            const encoded = btoa(JSON.stringify(sharedObj));
            const shareUrl = `${window.location.origin}${window.location.pathname}#/share/result/${encoded}`;
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Paylaşım linki kopyalandı!');
            });
        } catch (e) {
            console.error('Paylaşım hatası:', e);
        }
    };

    const downloadTestReport = (result) => {
        try {
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const W = 210; const H = 297;
            const today = new Date(result.date || Date.now()).toLocaleDateString('tr-TR');
            const testName = result.testTitle || 'Rehberlik Envanteri';

            // Background
            pdf.setFillColor(248, 250, 255); pdf.rect(0, 0, W, H, 'F');

            // Header
            pdf.setFillColor(30, 58, 138); pdf.rect(0, 0, W, 58, 'F');
            pdf.setFontSize(28); pdf.setTextColor(255, 255, 255); pdf.setFont('helvetica', 'bold');
            pdf.text('REHBERLIK ANALIZ RAPORU', 15, 28);

            pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(191, 219, 254);
            pdf.text('BASARI KAMPI | BIREYSEL GELISIM BELGESI', 15, 38);

            // Score Panel
            pdf.setFillColor(255, 255, 255); pdf.setDrawColor(226, 232, 240);
            pdf.roundedRect(12, 68, W - 24, 62, 4, 4, 'FD');

            pdf.setTextColor(30, 58, 138); pdf.setFontSize(13); pdf.setFont('helvetica', 'bold');
            pdf.text(`ENVANTER: ${testName.toUpperCase()}`, 22, 82);

            pdf.setTextColor(37, 99, 235); pdf.setFontSize(30); pdf.setFont('helvetica', 'bold');
            pdf.text(result.level || 'Tamamlandi', 22, 115);

            // Commentary
            pdf.setTextColor(51, 65, 85); pdf.setFontSize(12); pdf.setFont('helvetica', 'normal');
            const mainComment = result.comment || 'Test sonuclari basariyla analiz edilmistir.';
            const splitText = pdf.splitTextToSize(mainComment, W - 35);
            pdf.text(splitText, 18, 145);

            // Footer
            pdf.setFillColor(30, 58, 138); pdf.rect(0, H - 15, W, 15, 'F');
            pdf.setFontSize(8); pdf.setTextColor(255, 255, 255);
            pdf.text('BU BELGE BASARI KAMPI TARAFINDAN URETILMISTIR.', W / 2, H - 6, { align: 'center' });

            savePDF(pdf, `${user.name.replace(/\s+/g, '_')}_Analiz_Raporu`);
        } catch (e) {
            console.error('PDF Hatasi:', e);
        }
    };

    // Progress calculation
    const progress = activeTest ? (Object.keys(answers).length / activeTest.questions.length) * 100 : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 p-4 sm:p-8">
            {/* Hero Header */}
            <header className="max-w-7xl mx-auto mb-12">
                <div className="on-color bg-gradient-to-r from-brand via-purple-600 to-pink-600 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
                        <Brain size={300} className="absolute -top-20 -right-20" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center mb-4">
                            <Brain size={48} className="mr-4" />
                            <div>
                                <h1 className="text-4xl sm:text-5xl font-black">Rehberlik Merkezi</h1>
                                <p className="text-brand mt-2 text-lg">Kendini keşfet, potansiyelini ortaya çıkar</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto">
                {/* Modern Tabs */}
                <div className="flex space-x-2 mb-8 bg-surface p-2 rounded-2xl shadow-sm border border-line">
                    {[
                        { id: 'tests', label: 'Testler ve Envanterler', icon: Brain, color: 'indigo' },
                        { id: 'results', label: 'Sonuçlarım', icon: BarChart2, color: 'purple' },
                        { id: 'articles', label: 'Rehberlik Yazıları', icon: BookOpen, color: 'pink' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 ${activeTab === tab.id
                                ? `bg-gradient-to-r from-${tab.color}-600 to-${tab.color}-700 text-ink shadow-lg shadow-${tab.color}-200`
                                : 'text-ink-2 hover:bg-surface-2'
                                }`}
                        >
                            <tab.icon size={20} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="animate-fade-in">
                    {/* TESTS TAB */}
                    {activeTab === 'tests' && (
                        <div>
                            {tests.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {tests.map(test => (
                                        <div key={test.id} className="group bg-surface rounded-2xl shadow-sm border border-line hover:shadow-2xl transition-all duration-300 overflow-hidden">
                                            {/* Card Header */}
                                            <div className="on-color bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-ink relative overflow-hidden">
                                                <div className="absolute -top-10 -right-10 opacity-20 pointer-events-none">
                                                    <Brain size={120} />
                                                </div>
                                                <div className="relative z-10">
                                                    <div className="w-14 h-14 bg-surface/20 backdrop-blur rounded-xl flex items-center justify-center mb-4">
                                                        <FileText size={28} />
                                                    </div>
                                                    <h3 className="text-xl font-bold mb-2">{test.title}</h3>
                                                    <div className="flex items-center space-x-4 text-sm text-brand">
                                                        <span className="flex items-center">
                                                            <Clock size={14} className="mr-1" />
                                                            {test.questions?.length * 0.5} dk
                                                        </span>
                                                        <span className="flex items-center">
                                                            <FileText size={14} className="mr-1" />
                                                            {test.questions?.length} soru
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card Body */}
                                            <div className="p-6">
                                                <p className="text-ink-2 leading-relaxed mb-6 min-h-[60px]">
                                                    {test.desc || test.description}
                                                </p>
                                                <button
                                                    onClick={() => startTest(test)}
                                                    className="on-color w-full bg-gradient-to-r from-brand to-purple-600 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
                                                >
                                                    <Play size={18} className="fill-current" />
                                                    <span>Teste Başla</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-surface rounded-3xl border-2 border-dashed border-line">
                                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Brain size={48} className="text-brand" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-ink mb-3">Henüz Test Atanmamış</h3>
                                    <p className="text-ink-2 max-w-md mx-auto mb-6">
                                        Koçun sana test atadığında burada görünecek. Şimdilik rehberlik yazılarını okuyabilirsin.
                                    </p>
                                    <button
                                        onClick={() => setActiveTab('articles')}
                                        className="on-color bg-gradient-to-r from-brand to-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition"
                                    >
                                        Rehberlik Yazılarına Git
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* RESULTS TAB */}
                    {activeTab === 'results' && (
                        <div>
                            {testResults.length > 0 ? (
                                <div className="space-y-4">
                                    {testResults.map((result, idx) => (
                                        <div key={idx} className="bg-surface rounded-2xl shadow-sm border border-line p-6 hover:shadow-lg transition">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <div className="on-color w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center text-ink">
                                                            <CheckCircle size={24} />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold text-ink">{result.testTitle}</h3>
                                                            <p className="text-sm text-ink-2 flex items-center">
                                                                <Calendar size={14} className="mr-1" />
                                                                {new Date(result.date).toLocaleDateString('tr-TR', {
                                                                    year: 'numeric', month: 'long', day: 'numeric'
                                                                })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="ml-15 mt-3">
                                                        <div className="inline-block bg-brand-soft text-brand px-4 py-2 rounded-lg font-bold text-sm">
                                                            Sonuç: {result.level || 'Tamamlandı'}
                                                        </div>
                                                        {result.comment && (
                                                            <p className="text-ink-2 mt-3 italic">"{result.comment}"</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => downloadTestReport(result)}
                                                        className="on-color flex items-center space-x-2 bg-gradient-to-r from-brand to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition flex-1 sm:flex-none"
                                                    >
                                                        <Download size={18} />
                                                        <span>PDF İndir</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleShareResult(result)}
                                                        className="flex items-center justify-center p-3 bg-info-soft text-info rounded-xl hover:bg-info-soft transition shadow-sm"
                                                        title="Sonucu Paylaş"
                                                    >
                                                        <Share2 size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-surface rounded-3xl border-2 border-dashed border-line">
                                    <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <BarChart2 size={48} className="text-c4" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-ink mb-3">Henüz Test Sonucu Yok</h3>
                                    <p className="text-ink-2 max-w-md mx-auto mb-6">
                                        Bir test tamamladığında, sonuçların burada görünecek.
                                    </p>
                                    <button
                                        onClick={() => setActiveTab('tests')}
                                        className="on-color bg-gradient-to-r from-purple-600 to-pink-600 text-ink px-8 py-3 rounded-xl font-bold hover:shadow-lg transition"
                                    >
                                        Testlere Git
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ARTICLES TAB */}
                    {activeTab === 'articles' && (
                        <div className="space-y-6">
                            {articles.map(article => (
                                <div key={article.id} className="bg-surface rounded-2xl shadow-sm border border-line p-8 hover:shadow-lg transition">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <span className="px-4 py-1.5 bg-gradient-to-r from-pink-100 to-purple-100 text-c5 rounded-full text-xs font-bold uppercase tracking-wider">
                                            {article.category}
                                        </span>
                                        <span className="text-ink-3">•</span>
                                        <span className="text-sm text-ink-3 flex items-center">
                                            <Clock size={14} className="mr-1" />
                                            5 dk okuma
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-black text-ink mb-4">{article.title}</h3>
                                    <div className="prose prose-lg text-ink-2 leading-relaxed whitespace-pre-line">
                                        {article.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* TEST MODAL */}
            {activeTest && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-modal-base flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-surface w-full max-w-3xl max-h-[95vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
                        {/* Modal Header */}
                        <div className="on-color bg-gradient-to-r from-brand to-purple-600 p-6 text-white">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold mb-2">{activeTest.title}</h2>
                                    <p className="text-brand">
                                        Soru {currentQuestion + 1} / {activeTest.questions.length}
                                    </p>
                                </div>
                                <button
                                    onClick={closeTest}
                                    className="bg-surface/10 hover:bg-surface/20 p-2 rounded-full transition"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            {/* Progress Bar */}
                            <div className="w-full bg-surface/20 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full bg-surface rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-8 bg-surface-2">
                            {!testResult ? (
                                <div className="space-y-6">
                                    {activeTest.questions.map((q, idx) => (
                                        <div
                                            key={q.id}
                                            className={`transition-all duration-500 ${idx === currentQuestion ? 'opacity-100' : 'hidden'}`}
                                        >
                                            <div className="bg-surface p-8 rounded-2xl shadow-lg border border-line">
                                                <div className="flex items-start mb-6">
                                                    <span className="on-color bg-gradient-to-br from-indigo-500 to-purple-600 text-ink font-bold w-12 h-12 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 text-lg">
                                                        {idx + 1}
                                                    </span>
                                                    <p className="font-bold text-ink text-xl leading-relaxed">
                                                        {q.text}
                                                    </p>
                                                </div>
                                                <div className="space-y-3">
                                                    {activeTest.options && activeTest.options.map((opt, optIdx) => (
                                                        <button
                                                            key={optIdx}
                                                            onClick={() => handleAnswer(q.id, optIdx)}
                                                            className={`w-full text-left p-5 rounded-xl text-base font-medium transition-all duration-300 flex items-center border-2 ${answers[q.id] === optIdx
                                                                ? 'bg-gradient-to-r from-brand to-purple-600 text-white border-indigo-600 shadow-lg scale-105'
                                                                : 'bg-surface hover:bg-surface-2 text-ink-2 border-line hover:border-brand-line hover:shadow-md'
                                                                }`}
                                                        >
                                                            <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center flex-shrink-0 ${answers[q.id] === optIdx ? 'border-white bg-surface/20' : 'border-line-2'
                                                                }`}>
                                                                {answers[q.id] === optIdx && (
                                                                    <div className="w-3 h-3 bg-surface rounded-full" />
                                                                )}
                                                            </div>
                                                            <span className="flex-1">{opt}</span>
                                                            {answers[q.id] === optIdx && (
                                                                <CheckCircle size={20} className="ml-2" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="on-color w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-200 animate-bounce-short">
                                        <CheckCircle size={64} className="text-ink" />
                                    </div>
                                    <h3 className="text-4xl font-black text-ink mb-3">Test Tamamlandı!</h3>
                                    <p className="text-ink-2 mb-8 text-lg">Harika performans, işte sonuçların:</p>

                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-10 rounded-3xl border-2 border-brand-line inline-block text-left max-w-lg mx-auto shadow-xl">
                                        <div className="flex justify-between items-center mb-6 pb-6 border-b-2 border-brand-line">
                                            <span className="font-bold text-ink-2 uppercase tracking-wider">Sonuç</span>
                                            <span className="font-black text-brand text-3xl">{testResult.level}</span>
                                        </div>
                                        <div className="bg-surface p-6 rounded-2xl text-ink-2 leading-relaxed shadow-md text-center">
                                            <p className="italic text-lg">"{testResult.comment}"</p>
                                        </div>
                                        <button
                                            onClick={() => downloadTestReport(testResult)}
                                            className="on-color w-full mt-6 bg-gradient-to-r from-brand to-purple-600 text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:shadow-lg transition"
                                        >
                                            <Download size={20} />
                                            <span>Raporu İndir (PDF)</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-line bg-surface flex justify-between items-center">
                            <div className="flex space-x-2">
                                {currentQuestion > 0 && !testResult && (
                                    <button
                                        onClick={() => setCurrentQuestion(currentQuestion - 1)}
                                        className="px-6 py-3 bg-surface-3 text-ink-2 rounded-xl font-bold hover:bg-surface-3 transition"
                                    >
                                        Önceki
                                    </button>
                                )}
                            </div>
                            <div>
                                {!testResult ? (
                                    <>
                                        {currentQuestion < activeTest.questions.length - 1 ? (
                                            <button
                                                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                                                disabled={!answers[activeTest.questions[currentQuestion].id]}
                                                className="on-color px-8 py-3 bg-gradient-to-r from-brand to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                            >
                                                <span>Sonraki</span>
                                                <ChevronRight size={20} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={submitTest}
                                                disabled={Object.keys(answers).length < activeTest.questions.length}
                                                className="on-color px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-ink rounded-xl font-bold shadow-xl hover:shadow-2xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                            >
                                                <CheckCircle size={20} />
                                                <span>Testi Tamamla</span>
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <button
                                        onClick={closeTest}
                                        className="px-10 py-4 bg-surface-inv text-white rounded-xl font-bold shadow-lg hover:bg-surface-inv transition"
                                    >
                                        Kapat
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GuidancePage;
