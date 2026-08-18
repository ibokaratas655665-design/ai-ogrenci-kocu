import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Brain, CheckCircle, ChevronRight, Play } from 'lucide-react';
import guidanceService from '../services/guidanceService';
import { bildir } from '../services/uiGeriBildirim';
import { hataAnlat } from '../services/hataMesaji';
import halkaAcik from '../services/halkaAcikGonderim';

const PublicTestEntry = () => {
    const { testId } = useParams();
    const navigate = useNavigate();

    const [test, setTest] = useState(null);
    const [step, setStep] = useState('login'); // login | intro | test | result
    const [schoolNumber, setSchoolNumber] = useState('');
    const [studentName, setStudentName] = useState('');

    // Test states
    const [answers, setAnswers] = useState({});
    const [textAnswers, setTextAnswers] = useState({});
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [showSociometryList, setShowSociometryList] = useState(false); // Hook violation fix: moved out of map

    useEffect(() => {
        const found = guidanceService.getTestById(testId);
        if (found) {
            setTest(found);
        } else {
            bildir('Geçersiz Test Bağlantısı!', 'hata');
            navigate('/');
        }
    }, [testId, navigate]);

    // O helper for options (from StudentTestsTab)
    const normalizeOptions = (ts, q) => {
        // Eğer bir class_list veya text input ise seçenek döndürme
        if (ts?.inputType === 'class_list' || ts?.inputType === 'text') return [];

        if (Array.isArray(q?.options) && q.options.length > 0) {
            return q.options.map((o, i) =>
                typeof o === 'string' ? { label: o, value: i } :
                    typeof o === 'object' && o.text ? { label: o.text, value: i, meta: o } :
                        { label: JSON.stringify(o), value: i }
            );
        }
        if (Array.isArray(ts?.options) && ts.options.length > 0) {
            return ts.options.map((o, i) =>
                typeof o === 'string' ? { label: o, value: i } :
                    typeof o === 'object' && (o.label || o.text) ? { label: o.label || o.text, value: i, meta: o } :
                        { label: JSON.stringify(o), value: i }
            );
        }
        return [
            { label: 'Evet', value: 1 },
            { label: 'Hayır', value: 0 }
        ];
    };

    const questionKey = (q, index) => q.id !== undefined ? String(q.id) : String(index);

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        if (!schoolNumber.trim()) {
            bildir('Lütfen Okul Numaranızı giriniz.', 'uyari');
            return;
        }
        setStep('intro');
    };

    const handleAnswer = (key, value) => {
        setAnswers(prev => ({ ...prev, [key]: value }));
        if (currentQuestion < test.questions.length - 1) {
            setTimeout(() => setCurrentQuestion(q => q + 1), 350);
        }
    };

    const handleTextAnswer = (key, value) => {
        setTextAnswers(prev => ({ ...prev, [key]: value }));
    };

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

    const submitTest = async () => {
        if (!test || submitting) return;
        const isText = test.inputType === 'text';
        const isClassList = test.inputType === 'class_list';
        if (!isText && !isClassList && Object.keys(answers).length < test.questions.length) {
            bildir(`Lütfen tüm soruları cevaplayın. (${Object.keys(answers).length}/${test.questions.length})`, 'uyari');
            return;
        }
        setSubmitting(true);
        try {
            const finalAnswers = (isText || isClassList) ? textAnswers : answers;

            // Bizim sistemde user yok, bu yüzden testleri global_public_results gibi bir yere kaydedelim veya
            // Koç dashboard, tüm testleri listelerken bu public array'e de bakar.
            // Fakat guidanceService'in submit işlemi id istiyor. Biz "public_${schoolNumber}" gibi bir ID kullanalım.

            // Sonucu hesapla (manuel, çünkü submitTest local storage'da user id altına yazıyor)
            const resultCalc = await guidanceService.submitTest(`public_${schoolNumber}`, test.id, finalAnswers);

            const entry = {
                ...resultCalc,
                testTitle: test.title,
                testId: test.id,
                date: new Date().toISOString(),
                totalQuestions: test.questions.length,
                studentInfo: { schoolNumber, name: studentName }
            };

            // Yerel kopya (aynı cihazdaki koç için)
            const publicResults = JSON.parse(localStorage.getItem('public_test_submissions') || '[]');
            publicResults.push(entry);
            localStorage.setItem('public_test_submissions', JSON.stringify(publicResults));

            /**
             * ⚠️ Bu sayfa KORUMASIZ: öğrenci giriş yapmadan çözüyor.
             * O cihazda Firebase oturumu olmadığı için `firebaseSync`
             * init edilmiyor ve yazım sessizce düşüyordu — gönderim koça
             * HİÇ ulaşmıyordu. Ölçüldü: oturumsuz syncData yazımı
             * permission-denied. Gönderim artık ayrı kutuya bırakılıyor.
             */
            const kocId = new URLSearchParams(window.location.hash.split('?')[1] || '').get('c');
            if (kocId) await halkaAcik.gonder(kocId, 'envanter', entry);

            setTestResult(entry);
            setStep('result');
        } catch (err) {
            bildir(hataAnlat(err, 'sonuc'), 'hata');
        }
        setSubmitting(false);
    };

    const classmates = React.useMemo(() => {
        const isClassList = test?.inputType === 'class_list';
        if (!isClassList) return [];
        try {
            const list = JSON.parse(localStorage.getItem('coach_students') || '[]');
            // Daha esnek eşleşme: hem okul numarası hem de isim kontrolü (küçük/büyük harf duyarsız)
            const studentEntry = list.find(s =>
                String(s.schoolNumber).trim().toLowerCase() === String(schoolNumber).trim().toLowerCase() ||
                (studentName && s.name.toLowerCase().trim() === studentName.toLowerCase().trim())
            );

            if (studentEntry) {
                // Aynı sınıf ve şubedeki diğerlerini getir
                return list.filter(s =>
                    s.grade === studentEntry.grade &&
                    s.section === studentEntry.section &&
                    String(s.schoolNumber) !== String(studentEntry.schoolNumber)
                ).sort((a, b) => a.name.localeCompare(b.name));
            }
            return [];
        } catch { return []; }
    }, [test, schoolNumber, studentName]);

    if (!test) return null;

    const isText = test.inputType === 'text';
    const isClassList = test.inputType === 'class_list';
    const totalQ = test.questions?.length || 0;
    const answeredCount = (isText || isClassList) ? Object.keys(textAnswers).length : Object.keys(answers).length;
    const progress = totalQ > 0 ? (answeredCount / totalQ) * 100 : 0;
    const currentQ = test.questions?.[currentQuestion];
    const currentKey = currentQ ? questionKey(currentQ, currentQuestion) : null;
    const currentOptions = currentQ ? normalizeOptions(test, currentQ) : [];


    return (
        <div className="min-h-screen bg-brand-soft flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-xl bg-surface rounded-3xl shadow-xl overflow-hidden border border-brand-line">
                {/* Header */}
                <div className="on-color bg-gradient-to-r from-brand to-purple-600 p-6 text-white text-center relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none"><Brain size={120} /></div>
                    <Brain size={48} className="mx-auto mb-3" />
                    <h1 className="text-2xl font-black relative z-10">{test.title}</h1>
                    <p className="text-brand mt-1 relative z-10">{test.desc}</p>
                </div>

                {step === 'login' && (
                    <div className="p-8 text-center animate-fade-in">
                        <h2 className="text-xl font-bold text-ink mb-2">Hoş Geldin!</h2>
                        <p className="text-ink-2 mb-6 text-sm">Teste başlamak için bilgilerini girmen gerekiyor.</p>

                        <form onSubmit={handleLoginSubmit} className="space-y-4 max-w-sm mx-auto">
                            <div>
                                <label className="block text-left text-sm font-bold text-ink-2 mb-1">Okul Numarası <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    value={schoolNumber}
                                    onChange={e => setSchoolNumber(e.target.value)}
                                    placeholder="Örn: 1453"
                                    className="w-full border-2 border-line rounded-xl px-4 py-3 focus:outline-none focus:border-brand font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-left text-sm font-bold text-ink-2 mb-1">Ad Soyad (Opsiyonel)</label>
                                <input
                                    type="text"
                                    value={studentName}
                                    onChange={e => setStudentName(e.target.value)}
                                    placeholder="Örn: Ali Yılmaz"
                                    className="w-full border-2 border-line rounded-xl px-4 py-3 focus:outline-none focus:border-brand font-bold"
                                />
                            </div>
                            <button type="submit" className="w-full bg-brand text-white font-bold rounded-xl py-3 mt-4 hover:bg-brand-hover transition flex justify-center items-center gap-2 shadow-lg">
                                Devam Et <ChevronRight size={18} />
                            </button>
                        </form>
                    </div>
                )}

                {step === 'intro' && (
                    <div className="p-8 text-center animate-fade-in">
                        <div className="w-20 h-20 bg-brand-soft rounded-full flex items-center justify-center mx-auto mb-4">
                            <Play size={32} className="text-brand ml-1" />
                        </div>
                        <h2 className="text-xl font-bold text-ink mb-4">Hazır mısın?</h2>
                        <div className="text-sm text-ink-2 space-y-2 mb-8 bg-surface-2 p-4 rounded-xl border border-line text-left">
                            <p>• Bu testte <strong>{totalQ} soru</strong> bulunmaktadır.</p>
                            <p>• Testin doğru veya yanlış cevabı yoktur, içinden gelen ilk cevabı işaretle.</p>
                            <p>• Sonuçlar koçun tarafından incelenecektir.</p>
                        </div>
                        <button onClick={() => setStep('test')} className="w-full bg-brand text-white font-bold rounded-xl py-4 hover:bg-brand-hover transition shadow-lg text-lg">
                            Teste Başla
                        </button>
                    </div>
                )}

                {step === 'test' && (
                    <div className="flex flex-col h-[60vh] animate-fade-in">
                        <div className="p-4 border-b border-line shrink-0">
                            <div className="flex justify-between items-end mb-2">
                                <span className="font-bold text-ink-2">Soru {currentQuestion + 1} <span className="text-ink-3 font-normal">/ {totalQ}</span></span>
                                <span className="text-xs font-bold text-brand">% {Math.round(progress)}</span>
                            </div>
                            <div className="w-full bg-surface-3 rounded-full h-2">
                                <div className="bg-brand h-2 rounded-full transition-all duration-yavas" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-surface-2">
                            {isText ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-ink-2 bg-surface rounded-xl p-3 border border-line mb-4">
                                        Aşağıdaki cümleleri içinizden geçen ilk düşünceyle tamamlayın.
                                    </p>
                                    {test.questions.map((q, i) => {
                                        const k = questionKey(q, i);
                                        return (
                                            <div key={k} className="bg-surface rounded-xl p-4 border border-line shadow-sm mb-3">
                                                <p className="font-bold text-ink mb-2 text-sm">{i + 1}. {q.text}</p>
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
                                <div className="space-y-4">
                                    {/* Sadece aktif soruyu göster */}
                                    {test.questions.map((q, i) => {
                                        if (i !== currentQuestion) return null;
                                        const k = questionKey(q, i);
                                        const getMaxSelect = (text) => {
                                            const match = text.match(/en fazla (\d+)/i);
                                            return match ? parseInt(match[1]) : 3;
                                        };
                                        const maxSelect = getMaxSelect(q.text);
                                        const selectedArr = textAnswers[k] || [];

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
                                                        onClick={() => setShowSociometryList(!showSociometryList)}
                                                        className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all font-bold ${showSociometryList ? 'bg-brand text-white border-indigo-600' : 'bg-brand-soft text-brand border-brand-line hover:bg-brand-soft'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <CheckCircle size={20} />
                                                            <span>{showSociometryList ? 'Listeyi Kapat' : 'Sınıf Listesini Görüntüle ve Seç'}</span>
                                                        </div>
                                                        <ChevronRight size={18} className={`transition-transform ${showSociometryList ? 'rotate-90' : ''}`} />
                                                    </button>
                                                </div>

                                                {/* Açılan Sınıf Listesi */}
                                                {showSociometryList && (
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
                                    })}</div>
                            ) : (
                                <div>
                                    {test.questions.map((q, i) => {
                                        const k = questionKey(q, i);
                                        const opts = normalizeOptions(test, q);
                                        return (
                                            <div key={k} className={i === currentQuestion ? 'block animate-fade-in' : 'hidden'}>
                                                <h3 className="text-xl font-bold text-ink mb-6 leading-relaxed">
                                                    {q.text}
                                                </h3>
                                                <div className="space-y-3">
                                                    {opts.map((opt, oi) => {
                                                        const selected = answers[k] === opt.value;
                                                        return (
                                                            <button key={oi} onClick={() => handleAnswer(k, opt.value)}
                                                                className={`w-full text-left p-4 rounded-2xl text-[15px] font-bold transition-all border-2 flex items-center gap-3 ${selected
                                                                    ? 'bg-brand-soft text-brand border-brand shadow-sm'
                                                                    : 'bg-surface text-ink-2 border-line hover:border-brand-line hover:bg-surface-2'}`}
                                                            >
                                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? 'border-indigo-600' : 'border-line-2'}`}>
                                                                    {selected && <div className="w-2.5 h-2.5 bg-brand rounded-full" />}
                                                                </div>
                                                                <span className="flex-1">{opt.label}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-line bg-surface flex justify-between shrink-0">
                            {(!isText && !isClassList && currentQuestion > 0) ? (
                                <button onClick={() => setCurrentQuestion(q => q - 1)} className="px-5 py-2.5 bg-surface-3 text-ink-2 font-bold rounded-xl hover:bg-surface-3">
                                    ← Önceki
                                </button>
                            ) : <div />}

                            {(!isText && !isClassList && currentQuestion < totalQ - 1) && (
                                <button
                                    onClick={() => setCurrentQuestion(q => q + 1)}
                                    disabled={answers[currentKey] === undefined}
                                    className="px-5 py-2.5 bg-brand text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-brand-hover"
                                >
                                    Sonraki <ChevronRight size={16} />
                                </button>
                            )}

                            {(isClassList && currentQuestion < totalQ - 1) && (
                                <button
                                    onClick={() => {
                                        // `setShowClassList` diye bir state hiç tanımlanmamıştı;
                                        // "Sonraki" düğmesine basıldığında sayfa çöküyordu.
                                        setCurrentQuestion(q => q + 1);
                                    }}
                                    className="px-5 py-2.5 bg-brand text-white font-bold rounded-xl flex items-center gap-2 hover:bg-brand-hover"
                                >
                                    Sonraki <ChevronRight size={16} />
                                </button>
                            )}

                            {(isText || isClassList || currentQuestion === totalQ - 1) && (
                                <button
                                    onClick={submitTest}
                                    disabled={submitting || (!isText && !isClassList && answeredCount < totalQ)}
                                    className="px-6 py-2.5 bg-ok text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:bg-ok"
                                >
                                    {submitting ? 'Gönderiliyor...' : 'Testi Bitir'}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {step === 'result' && (
                    <div className="p-10 text-center animate-fade-in">
                        <div className="w-24 h-24 bg-ok-soft rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-100">
                            <CheckCircle size={56} className="text-ok" />
                        </div>
                        <h2 className="text-2xl font-black text-ink mb-2">Test Tamamlandı!</h2>
                        <p className="text-ink-2 mb-6">Sonuçların başarıyla kaydedildi. Koçun sonuçlarını inceleyerek seninle iletişime geçecek.</p>

                        <div className="bg-brand-soft rounded-xl p-4 border border-brand-line mb-6 text-left">
                            <p className="text-xs text-brand font-bold uppercase tracking-wider mb-1">Özet Sonuç (Önizleme)</p>
                            <p className="font-bold text-brand text-lg">{testResult?.level}</p>
                        </div>

                        <button onClick={() => window.close()} className="w-full border-2 border-line text-ink-2 font-bold rounded-xl py-3 hover:bg-surface-2 transition">
                            Sayfayı Kapat
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicTestEntry;
