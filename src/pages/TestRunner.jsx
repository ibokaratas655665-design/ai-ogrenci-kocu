import React, { useState } from 'react';
import { X, ChevronRight, CheckCircle } from 'lucide-react';
import { calculateResult } from '../data/tests';
import Modal from '../components/ui/Modal';
import { yaz } from '../services/veriDeposu';

const TestRunner = ({ test, onClose }) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [isFinished, setIsFinished] = useState(false);
    const [result, setResult] = useState(null);

    const handleAnswer = (value) => {
        const newAnswers = { ...answers, [currentQuestion]: value };
        setAnswers(newAnswers);

        if (currentQuestion < test.questions.length - 1) {
            setTimeout(() => setCurrentQuestion(currentQuestion + 1), 200);
        } else {
            finishTest(newAnswers);
        }
    };

    const finishTest = (finalAnswers) => {
        const res = calculateResult(test.id, finalAnswers);
        setResult(res);
        setIsFinished(true);

        // Sonuçları LocalStorage'a kaydet
        try {
            const existingData = localStorage.getItem('student_guidance_results');
            const results = existingData ? JSON.parse(existingData) : {};

            // Save result to localStorage
            // If we have a studentId via props in future, we should use it. 
            // For now, we save by testId, effectively overwriting for 'current user'.
            // In a real app, this should be keyed by [studentId][testId]

            // Note: Currently TestRunner is generic. If used by Coach, it saves locally to Coach's browser.
            // If used by Student, saves to Student's browser.
            // pdrService.assignInventory synchronization would be needed for Coach to see Student results.
            // For now, let's keep it local but ensure structure is extendable.

            results[test.id] = {
                ...res,
                date: new Date().toISOString(),
                testName: test.title,
                testId: test.id // Ensure ID is saved
            };

            yaz('student_guidance_results', results);

            // Also try to save to api.tests if available (for sync)
            // if (window.api && window.api.tests && window.api.tests.saveResult) {
            //    window.api.tests.saveResult(test.id, res);
            // }

        } catch (error) {
            console.error("Sonuç kaydedilirken hata oluştu:", error);
        }
    };

    const progress = ((currentQuestion + 1) / test.questions.length) * 100;

    if (isFinished) {
        return (
            <Modal
                acik
                onClose={onClose}
                baslikGizle
                genislik="lg"
                katmanClassName="z-modal-top"
                govdeClassName="p-0"
            >
                <div className="p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-ok-soft text-ok rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-ink">Test Tamamlandı!</h2>

                    <div className="bg-brand-soft p-6 rounded-2xl text-left border border-brand-line">
                        <h3 className="text-xl font-bold text-brand mb-2">{result?.summary}</h3>
                        <p className="text-ink-2 leading-relaxed">{result?.detail}</p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-surface-inv text-white rounded-xl font-bold hover:bg-surface-inv transition transform hover:scale-[1.02]"
                    >
                        Sonuçları Kaydet ve Çık
                    </button>
                </div>
            </Modal>
        );
    }

    const question = test.questions[currentQuestion];

    return (
        <Modal
            acik
            onClose={onClose}
            baslikGizle
            genislik="lg"
            katmanClassName="z-modal-top"
            govdeClassName="p-0 flex flex-col overflow-hidden"
        >

            {/* Header */}
            <div className="shrink-0 p-6 border-b border-line flex justify-between items-center bg-surface-2">
                <div>
                    <h2 className="text-xl font-bold text-ink">{test.title}</h2>
                    <p className="text-sm text-ink-2">Soru {currentQuestion + 1} / {test.questions.length}</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-surface-3 rounded-full transition">
                    <X size={24} className="text-ink-2" />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="shrink-0 h-2 bg-surface-3 w-full">
                <div
                    className="on-color h-full bg-gradient-to-r from-blue-500 to-brand transition-all duration-yavas ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Question Area */}
            <div className="flex-1 min-h-0 flex flex-col justify-center items-center p-8 md:p-12 overflow-y-auto">
                <h3 className="text-2xl md:text-3xl font-medium text-center text-ink mb-8 leading-relaxed">
                    {question.text}
                </h3>

                {test.inputType === 'text' ? (
                    <div className="w-full max-w-2xl space-y-4">
                        <textarea
                            className="w-full p-4 border-2 border-line rounded-xl focus:border-brand focus:ring-4 focus:ring-indigo-50 transition-all text-lg resize-none min-h-[150px]"
                            placeholder="Cümlenin devamını buraya yazınız..."
                            value={answers[currentQuestion] || ''}
                            onChange={(e) => setAnswers({ ...answers, [currentQuestion]: e.target.value })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (answers[currentQuestion]?.trim()) handleAnswer(answers[currentQuestion]);
                                }
                            }}
                            autoFocus
                        />
                        <button
                            onClick={() => handleAnswer(answers[currentQuestion])}
                            disabled={!answers[currentQuestion]?.trim()}
                            className="w-full py-4 bg-brand text-white rounded-xl font-bold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95"
                        >
                            Devam Et
                        </button>
                        <p className="text-sm text-ink-3 text-center">Enter tuşuna basarak ilerleyebilirsiniz</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                        {test.options.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(opt.value)}
                                className="group relative flex items-center justify-center p-6 border-2 border-line rounded-2xl hover:border-brand hover:bg-brand-soft transition-all duration-normal"
                            >
                                <span className="font-semibold text-ink-2 group-hover:text-brand text-lg">
                                    {opt.label}
                                </span>
                                <ChevronRight className="absolute right-4 text-transparent group-hover:text-brand transition-all" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

        </Modal>
    );
};

export default TestRunner;
