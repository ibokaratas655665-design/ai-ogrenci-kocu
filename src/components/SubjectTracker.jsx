import React, { useState, useEffect } from 'react';
import { CURRICULUM, SUBJECT_COLORS, EXAM_TYPES } from '../data/curriculum';
import { CheckCircle, Circle, AlertCircle, ChevronRight, BookOpen, PieChart } from 'lucide-react';
import { yaz } from '../services/veriDeposu';

const SubjectTracker = ({ user }) => {
    const [activeExam, setActiveExam] = useState('TYT');
    const [activeSubject, setActiveSubject] = useState(Object.keys(CURRICULUM['TYT'])[0]);
    const [progressData, setProgressData] = useState({});

    useEffect(() => {
        if (user?.id) {
            const savedProgress = localStorage.getItem(`tracker_${user.id}_progress`);
            if (savedProgress) {
                try {
                    setProgressData(JSON.parse(savedProgress));
                } catch (e) {
                    console.warn('Progress verisi okunamadı:', e);
                }
            }
        }
    }, [user]);

    // ── Yardımcı: topic nesne veya string olabilir ──────────────
    const getTopicName = (topic) => {
        if (!topic) return '';
        if (typeof topic === 'string') return topic;
        if (typeof topic === 'object' && topic.name) return topic.name;
        return String(topic);
    };

    // ── Yardımcı: AYT/YDT nested yapısına güvenli erişim ───────
    const getExamData = (exam) => {
        const data = CURRICULUM[exam];
        if (!data) return null;
        // AYT ve YDT grade11/grade12 altında — 11. sınıfı varsayılan al
        if (data.grade11) return data.grade11;
        return data;
    };

    const getSubjectTopics = (exam, subject) => {
        const examData = getExamData(exam);
        return examData?.[subject] || [];
    };

    const getSubjectList = (exam) => {
        const examData = getExamData(exam);
        return examData ? Object.keys(examData) : [];
    };

    const handleToggleTopic = (exam, subject, topicName) => {
        const key = `${exam}|${subject}|${topicName}`;
        const currentStatus = progressData[key] || 'pending';

        let newStatus = 'completed';
        if (currentStatus === 'completed') newStatus = 'review';
        if (currentStatus === 'review') newStatus = 'pending';

        const newProgress = { ...progressData, [key]: newStatus };
        setProgressData(newProgress);

        if (user?.id) {
            yaz(`tracker_${user.id}_progress`, newProgress);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle className="text-ok" size={20} />;
            case 'review': return <AlertCircle className="text-warn" size={20} />;
            default: return <Circle className="text-ink-3" size={20} />;
        }
    };

    const calculateSubjectProgress = (exam, subject) => {
        const topics = getSubjectTopics(exam, subject);
        if (!topics || topics.length === 0) return 0;

        const completed = topics.filter(t => {
            const name = getTopicName(t);
            return progressData[`${exam}|${subject}|${name}`] === 'completed';
        }).length;
        return Math.round((completed / topics.length) * 100);
    };

    const subjectList = getSubjectList(activeExam);

    return (
        <div className="space-y-6">
            {/* Exam Selector */}
            <div className="flex space-x-2 overflow-x-auto pb-2">
                {EXAM_TYPES.map(exam => (
                    CURRICULUM[exam] && (
                        <button
                            key={exam}
                            onClick={() => {
                                setActiveExam(exam);
                                const subjects = getSubjectList(exam);
                                if (subjects.length > 0) setActiveSubject(subjects[0]);
                            }}
                            className={`px-6 py-2 rounded-xl font-bold transition whitespace-nowrap ${activeExam === exam
                                    ? 'bg-brand text-white shadow-md'
                                    : 'bg-surface text-ink-2 border border-line hover:bg-surface-2'
                                }`}
                        >
                            {exam} Müfredatı
                        </button>
                    )
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Subjects List (Left Sidebar) */}
                <div className="lg:col-span-1 space-y-3">
                    {subjectList.map(subject => {
                        const progress = calculateSubjectProgress(activeExam, subject);
                        const colorClass = SUBJECT_COLORS[subject] || 'bg-surface-3 text-ink';

                        return (
                            <button
                                key={subject}
                                onClick={() => setActiveSubject(subject)}
                                className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center group relative overflow-hidden ${activeSubject === subject
                                        ? 'border-brand shadow-md ring-1 ring-brand bg-surface'
                                        : 'border-line bg-surface hover:bg-surface-2'
                                    }`}
                            >
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorClass.split(' ')[0].replace('100', '500')}`}></div>
                                <div>
                                    <div className="font-bold text-ink">{subject}</div>
                                    <div className="text-xs text-ink-2 mt-1">{getSubjectTopics(activeExam, subject).length} Konu</div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="text-right">
                                        <div className="text-lg font-black text-brand">%{progress}</div>
                                    </div>
                                    {activeSubject === subject && <ChevronRight className="text-brand" size={20} />}
                                </div>

                                {/* Progress Bar */}
                                <div
                                    className="absolute bottom-0 left-0 h-1 bg-ok transition-all duration-yavas"
                                    style={{ width: `${progress}%`, opacity: 0.3 }}
                                ></div>
                            </button>
                        );
                    })}
                </div>

                {/* Topics List (Right Content) */}
                <div className="lg:col-span-2">
                    <div className="bg-surface rounded-2xl shadow-sm border border-line overflow-hidden">
                        <div className={`p-6 border-b border-line flex justify-between items-center ${SUBJECT_COLORS[activeSubject] || 'bg-surface-2'}`}>
                            <h3 className="text-xl font-black flex items-center">
                                <BookOpen className="mr-3 opacity-70" size={24} />
                                {activeSubject} Konuları
                            </h3>
                            <div className="text-sm font-bold opacity-70">
                                {calculateSubjectProgress(activeExam, activeSubject)}% Tamamlandı
                            </div>
                        </div>

                        <div className="p-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                            {getSubjectTopics(activeExam, activeSubject).map((topic, idx) => {
                                const topicName = getTopicName(topic);
                                const status = progressData[`${activeExam}|${activeSubject}|${topicName}`] || 'pending';

                                return (
                                    <div
                                        key={topicName || idx}
                                        onClick={() => handleToggleTopic(activeExam, activeSubject, topicName)}
                                        className={`p-4 m-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${status === 'completed'
                                                ? 'bg-ok-soft border-ok'
                                                : status === 'review'
                                                    ? 'bg-warn-soft border-warn'
                                                    : 'bg-surface border-line hover:border-brand-line hover:shadow-sm'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className="transition-transform transform group-hover:scale-110">
                                                {getStatusIcon(status)}
                                            </div>
                                            <span className={`font-medium ${status === 'completed' ? 'text-ok line-through opacity-70' : 'text-ink-2'}`}>
                                                {topicName}
                                            </span>
                                        </div>

                                        <div className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-surface/50">
                                            {status === 'completed' ? 'Bitti' : status === 'review' ? 'Tekrar' : 'Başlanmadı'}
                                        </div>
                                    </div>
                                );
                            })}

                            {getSubjectTopics(activeExam, activeSubject).length === 0 && (
                                <div className="p-8 text-center text-ink-2">
                                    Bu ders için konu listesi bulunamadı.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 bg-info-soft p-4 rounded-xl border border-info text-info text-sm flex items-start">
                        <PieChart className="mr-3 mt-1 flex-shrink-0" size={18} />
                        <div>
                            <strong>İpucu:</strong> Konulara tıklayarak durumlarını değiştirebilirsin.
                            <br />
                            <span className="flex items-center mt-1 space-x-4">
                                <span className="flex items-center"><Circle size={12} className="mr-1 text-ink-3" /> Başlanmadı</span>
                                <span className="flex items-center"><CheckCircle size={12} className="mr-1 text-ok" /> Tamamlandı</span>
                                <span className="flex items-center"><AlertCircle size={12} className="mr-1 text-warn" /> Tekrar Et</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubjectTracker;
