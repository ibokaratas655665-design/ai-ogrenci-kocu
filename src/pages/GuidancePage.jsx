import React, { useState } from 'react';
import { BookOpen, Activity, UserCheck, Brain, AlertCircle } from 'lucide-react';
import { TEST_DATA } from '../data/tests';
import TestRunner from './TestRunner';

const TestCategory = ({ title, icon: Icon, tests, color, onStartTest }) => (
    <div className="space-y-4">
        <div className="flex items-center space-x-3 mb-2">
            <div className={`p-2 rounded-lg ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tests.map((test, idx) => (
                <div key={idx} className="group glass-card p-5 cursor-pointer hover:border-indigo-300 transition-all duration-300 hover:shadow-xl">
                    <div className="flex justify-between items-start mb-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded bg-gray-100 text-gray-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors`}>
                            {test.duration}
                        </span>
                    </div>
                    <h4 className="font-bold text-gray-800 mb-2 group-hover:text-indigo-700">{test.name}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2">{test.desc}</p>
                    <button
                        onClick={() => onStartTest(test.id)}
                        className="mt-4 w-full py-2 rounded-lg border border-indigo-100 text-indigo-600 font-medium hover:bg-indigo-600 hover:text-white transition-all text-sm"
                    >
                        Testi Başlat
                    </button>
                </div>
            ))}
        </div>
    </div>
);

const GuidancePage = () => {
    const [activeTest, setActiveTest] = useState(null);

    const handleStartTest = (testId) => {
        // Veritabanındaki test verisini bul (Şimdilik sadece Holland ve Study Habits tanımlı)
        const test = TEST_DATA[testId];
        if (test) {
            setActiveTest(test);
        } else {
            alert("Bu test henüz sisteme yüklenmedi.");
        }
    };

    const categories = [
        {
            title: 'Mesleki Yönelim',
            icon: UserCheck,
            color: 'bg-blue-500',
            tests: [
                { id: 'holland', name: 'Holland Mesleki İlgi Envanteri', duration: '20 dk', desc: 'Kişilik tipinize en uygun meslek gruplarını keşfedin.' },
            ]
        },
        {
            title: 'Akademik ve Eğitsel',
            icon: BookOpen,
            color: 'bg-purple-500',
            tests: [
                { id: 'study_habits', name: 'Verimli Ders Çalışma Anketi', duration: '10 dk', desc: 'Çalışma alışkanlıklarınızdaki eksikleri tespit edin.' },
                { id: 'exam_anxiety', name: 'Sınav Kaygısı Ölçeği', duration: '12 dk', desc: 'Sınav stres seviyenizi ve başa çıkma yöntemlerini öğrenin.' },
                { id: 'academic_self', name: 'Akademik Benlik Saygısı', duration: '15 dk', desc: 'Akademik potansiyelinize olan inancınızı ölçün.' },
                { id: 'failure_reasons', name: 'Başarısızlık Nedenleri Anketi', duration: '15 dk', desc: 'Başarmanızı engelleyen faktörleri keşfedin.' },
            ]
        },
        {
            title: 'Kişisel ve Psikolojik',
            icon: Brain,
            color: 'bg-rose-500',
            tests: [
                { id: 'multiple_intelligence', name: 'Çoklu Zeka Envanteri', duration: '20 dk', desc: 'Hangi zeka alanlarınızın daha baskın olduğunu keşfedin.' },
                { id: 'problem_scan', name: 'Problem Tarama Envanteri', duration: '25 dk', desc: 'Sağlık, okul, aile ve kişisel problemlerinizi analiz edin.' },
                { id: 'beier', name: 'Beier Cümle Tamamlama', duration: '30 dk', desc: 'Bilinçaltı süreçlerinizi yarım kalan cümlelerle ifade edin.' },
                { id: 'kgbn', name: 'Kime Göre Ben Neyim?', duration: '15 dk', desc: 'Kendinizi başkalarının (aile, öğretmen) gözünden değerlendirin.' },
            ]
        },
        {
            title: 'Dikkat ve Algı',
            icon: Activity,
            color: 'bg-orange-500',
            tests: [
                // Burdon gibi testler için özel arayüz gerekir, şimdilik placeholder
                { id: 'burdon', name: 'Burdon Dikkat Testi (Yakında)', duration: '10 dk', desc: 'Dikkat yoğunluğu ve odaklanma becerilerinizi ölçün.' },
            ]
        }
    ];

    return (
        <div className="p-8 space-y-10 pb-20 relative">
            {activeTest && (
                <TestRunner test={activeTest} onClose={() => setActiveTest(null)} />
            )}

            <header>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Rehberlik ve Psikolojik Danışmalık</h1>
                <p className="text-gray-500 text-lg">
                    Kendini tanıman ve potansiyelini keşfetmen için bilimsel testler ve envanterler.
                </p>
            </header>

            <div className="space-y-12">
                {categories.map((cat, idx) => (
                    <TestCategory key={idx} {...cat} onStartTest={handleStartTest} />
                ))}
            </div>
        </div>
    );
};

export default GuidancePage;
