import React, { useState } from 'react';
import { X, ChevronRight, CheckCircle } from 'lucide-react';
import { calculateResult } from '../data/tests';

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

            results[test.id] = {
                ...res,
                date: new Date().toISOString(),
                testName: test.title
            };

            localStorage.setItem('student_guidance_results', JSON.stringify(results));
        } catch (error) {
            console.error("Sonuç kaydedilirken hata oluştu:", error);
        }
    };

    const progress = ((currentQuestion + 1) / test.questions.length) * 100;

    if (isFinished) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in">
                    <div className="p-8 text-center space-y-6">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle size={40} />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800">Test Tamamlandı!</h2>

                        <div className="bg-indigo-50 p-6 rounded-2xl text-left border border-indigo-100">
                            <h3 className="text-xl font-bold text-indigo-900 mb-2">{result?.summary}</h3>
                            <p className="text-gray-700 leading-relaxed">{result?.detail}</p>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition transform hover:scale-[1.02]"
                        >
                            Sonuçları Kaydet ve Çık
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const question = test.questions[currentQuestion];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col h-[600px] animate-fade-in relative">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{test.title}</h2>
                        <p className="text-sm text-gray-500">Soru {currentQuestion + 1} / {test.questions.length}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-gray-100 w-full">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Question Area */}
                <div className="flex-1 flex flex-col justify-center items-center p-8 md:p-12 overflow-y-auto">
                    <h3 className="text-2xl md:text-3xl font-medium text-center text-gray-800 mb-8 leading-relaxed">
                        {question.text}
                    </h3>

                    {test.inputType === 'text' ? (
                        <div className="w-full max-w-2xl space-y-4">
                            <textarea
                                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-lg resize-none min-h-[150px]"
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
                                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95"
                            >
                                Devam Et
                            </button>
                            <p className="text-sm text-gray-400 text-center">Enter tuşuna basarak ilerleyebilirsiniz</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                            {test.options.map((opt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(opt.value)}
                                    className="group relative flex items-center justify-center p-6 border-2 border-gray-100 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200"
                                >
                                    <span className="font-semibold text-gray-600 group-hover:text-indigo-700 text-lg">
                                        {opt.label}
                                    </span>
                                    <ChevronRight className="absolute right-4 text-transparent group-hover:text-indigo-500 transition-all" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default TestRunner;
