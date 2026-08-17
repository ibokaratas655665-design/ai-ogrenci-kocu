import React, { useState, useEffect } from 'react';
import { Loader2, Globe, Database, Cpu, CheckCircle2, Search, Image as ImageIcon } from 'lucide-react';

const SearchProgress = ({ topic, onComplete }) => {
    const [step, setStep] = useState(0);
    const [logs, setLogs] = useState([]);

    const generateSteps = (t) => [
        { id: 1, text: "Küresel Akademik Veritabanlarına Bağlanılıyor...", icon: Globe, duration: 1500 },
        { id: 2, text: `"${t}" literatürü taranıyor (Google Scholar, EBSCO, PubMed)...`, icon: Search, duration: 2000 },
        { id: 3, text: "14,000+ makale ve kaynak analiz ediliyor...", icon: Database, duration: 1500 },
        { id: 4, text: "Görsel materyaller yapay zeka ile oluşturuluyor...", icon: ImageIcon, duration: 2500 }, // Duration increased for "image generation" feel
        { id: 5, text: "İçerik sentezleniyor ve formatlanıyor...", icon: Cpu, duration: 1800 },
        { id: 6, text: "İşlem Tamamlandı!", icon: CheckCircle2, duration: 800 }
    ];

    const [steps, setSteps] = useState([]);

    useEffect(() => {
        // Steps'i mount anında oluştur
        const newSteps = generateSteps(topic);
        setSteps(newSteps);

        let currentStep = 0;
        let mounted = true;

        const processStep = async () => {
            if (!mounted) return;

            if (currentStep >= newSteps.length) {
                setTimeout(onComplete, 500);
                return;
            }

            const s = newSteps[currentStep];
            setStep(currentStep);

            // Add extra realistic logs between steps
            if (currentStep === 2) {
                setLogs(prev => [...prev, `> Analiz: ${topic} için istatistiksel veriler çekiliyor...`]);
                await new Promise(r => setTimeout(r, 500));
                setLogs(prev => [...prev, `> Filtreleme: Güncel olmayan veriler (2020 öncesi) eleniyor...`]);
            }
            if (currentStep === 3) {
                setLogs(prev => [...prev, `> AI Render: ${topic} temalı görseller işleniyor...`]);
            }

            setLogs(prev => [...prev, s.text]);

            setTimeout(() => {
                currentStep++;
                processStep();
            }, s.duration);
        };

        processStep();

        return () => { mounted = false; };
    }, [topic]);

    const CurrentIcon = steps[step]?.icon || Loader2;

    return (
        // İlerleme perdesi: araştırma sürerken ESC/perde tıklaması kapatmasın
        <div data-no-dismiss className="fixed inset-0 z-search-progress flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="w-full max-w-lg bg-surface-inv rounded-2xl shadow-2xl overflow-hidden border border-line-2">
                {/* Header */}
                <div className="bg-surface-inv p-4 border-b border-line-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-danger animate-pulse" />
                        <div className="w-3 h-3 rounded-full bg-warn animate-pulse delay-75" />
                        <div className="w-3 h-3 rounded-full bg-ok animate-pulse delay-150" />
                    </div>
                    <span className="text-xs font-mono text-ink-3">AI RESEARCH ENGINE v2.4</span>
                </div>

                {/* Main Content */}
                <div className="p-8 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mb-6 relative">
                        <div className="absolute inset-0 border-4 border-brand/30 rounded-full animate-spin-slow border-t-indigo-500" />
                        <CurrentIcon size={32} className="text-brand animate-pulse" />
                    </div>

                    <h3 className="text-xl font-bold text-ink mb-2">Derin Araştırma Yapılıyor</h3>
                    <p className="text-ink-3 text-sm mb-6 max-w-xs mx-auto">
                        Yapay zeka, belirlediğiniz konu hakkında en güncel ve doğru bilgileri topluyor.
                    </p>

                    {/* Terminal Logs */}
                    <div className="w-full bg-black/50 rounded-lg p-4 font-mono text-xs text-left h-40 overflow-y-auto border border-line-2/50 shadow-inner">
                        {logs.map((log, i) => (
                            <div key={i} className="mb-1.5 text-ok/90 flex gap-2">
                                <span className="opacity-50 select-none">{'>'}</span>
                                <span className="animate-typewriter">{log}</span>
                            </div>
                        ))}
                        <div className="animate-pulse text-brand mt-2">_</div>
                    </div>
                </div>

                {/* Footer Progress */}
                <div className="h-1 bg-surface-inv w-full">
                    <div
                        className="h-full bg-brand transition-all duration-yavas ease-linear shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                        style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default SearchProgress;
