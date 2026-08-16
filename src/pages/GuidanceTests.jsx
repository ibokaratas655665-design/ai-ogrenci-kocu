import React, { useState } from 'react';
import { Play, FileText, CheckCircle, Clock, Share2, Copy } from 'lucide-react';
import { TEST_DATA } from '../data/tests';
import TestRunner from './TestRunner';

const GuidanceTests = () => {
    const [activeTest, setActiveTest] = useState(null);
    const [toast, setToast] = useState(null);

    // Test listesini array formatına çevir
    const tests = Object.values(TEST_DATA);

    const handleShare = (testId, testTitle) => {
        const shareUrl = `${window.location.origin}${window.location.pathname}#/envanter/${testId}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            setToast(`"${testTitle}" bağlantısı kopyalandı!`);
            setTimeout(() => setToast(null), 3000);
        });
    };

    return (
        <div className="animate-fade-in space-y-6 relative">
            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[60] bg-surface-inv text-white px-6 py-3 rounded-full shadow-xl flex items-center animate-fade-in">
                    <CheckCircle size={18} className="mr-2 text-ok" />
                    <span className="text-sm font-medium">{toast}</span>
                </div>
            )}

            <div className="on-color bg-gradient-to-r from-indigo-700 to-purple-800 rounded-2xl p-8 text-ink shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2">Psikolojik Testler ve Envanterler</h2>
                    <p className="text-brand max-w-2xl">
                        Öğrencilerin akademik, sosyal ve duygusal gelişimlerini takip etmek için bilimsel ölçekleri kullanın.
                        Sonuçlar otomatik olarak analiz edilir ve öğrenci profiline işlenir.
                    </p>
                </div>
                {/* Decorative Pattern */}
                <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 pointer-events-none">
                    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#FFFFFF" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.2,-19.2,95.8,-4.9C93.4,9.4,81.8,23.1,70.8,35.4C59.8,47.7,49.3,58.6,37.2,65.8C25.1,73,11.4,76.5,-1.7,79.4C-14.8,82.3,-28.4,84.7,-40.5,79.4C-52.6,74.1,-63.2,61.1,-71.4,47.3C-79.6,33.5,-85.4,18.9,-84.9,4.6C-84.4,-9.7,-77.6,-23.7,-68.3,-35.8C-59,-47.9,-47.2,-58.1,-34.5,-66.2C-21.8,-74.3,-8.2,-80.3,3.8,-86.9L15.8,-93.5Z" transform="translate(100 100)" />
                    </svg>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tests.map((test) => (
                    <div key={test.id} className="bg-surface rounded-2xl border border-line p-6 hover:shadow-xl transition duration-300 group flex flex-col h-full relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition pointer-events-none">
                            <FileText size={120} />
                        </div>

                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-ink mb-2 group-hover:text-brand transition">{test.title}</h3>
                            <p className="text-ink-2 text-sm leading-relaxed mb-4">{test.desc}</p>

                            <div className="flex items-center space-x-4 text-xs font-semibold text-ink-3 mb-6">
                                <div className="flex items-center">
                                    <Clock size={14} className="mr-1" />
                                    <span>~{test.questions.length * 0.5} Dakika</span>
                                </div>
                                <div className="flex items-center">
                                    <FileText size={14} className="mr-1" />
                                    <span>{test.questions.length} Soru</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-2">
                            <button
                                onClick={() => setActiveTest(test)}
                                className="flex-1 py-3 bg-surface-2 hover:bg-brand text-ink-2 hover:text-ink rounded-xl font-bold transition flex items-center justify-center group-hover:shadow-lg"
                            >
                                <Play size={18} className="mr-2 fill-current" />
                                Testi Başlat
                            </button>
                            <button
                                onClick={() => handleShare(test.id, test.title)}
                                className="w-12 bg-surface-2 hover:bg-info-soft text-ink-3 hover:text-info rounded-xl transition flex items-center justify-center border border-transparent hover:border-info"
                                title="Paylaşım Linkini Kopyala"
                            >
                                <Share2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Test Runner Modal */}
            {activeTest && (
                <TestRunner
                    test={activeTest}
                    onClose={() => setActiveTest(null)}
                />
            )}
        </div>
    );
};

export default GuidanceTests;
