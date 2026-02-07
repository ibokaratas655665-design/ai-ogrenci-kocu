import React, { useState } from 'react';
import { FileText, ChevronDown, CheckCircle, Upload, Printer, Download, BookOpen, Folder, ClipboardList, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';
import { bepData } from '../data/bepData';

const BEPGenerator = ({ students, closeModal }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        schoolName: '',
        academicYear: '2024-2025',
        districtName: '',
        studentName: '',
        studentNumber: '',
        studentClass: '',
        disabilityType: '',
        course: '',
        bepStartDate: '',
        bepEndDate: '',
        performanceLevel: '',
        selectedLongTermGoals: [], // UDA Listesi
        selectedShortTermGoals: {}, // { UDA_Metni: [KDA1, KDA2] }
        goalDates: {}, // { UDA_Metni: { start: '', end: '' }, KDA_Metni: { start: '', end: '' } }
        methods: [],
        materials: [],
        evaluation: []
    });

    const [customGoal, setCustomGoal] = useState('');

    const generatePerformanceLevel = () => {
        const template = bepData.performanceTemplates;
        const strength = template.strengths[Math.floor(Math.random() * template.strengths.length)];
        const weakness = template.weaknesses[Math.floor(Math.random() * template.weaknesses.length)];
        const text = `Öğrenci ${strength} Ancak ${weakness} Bu nedenle ${bepData.courses.find(c => c.id === formData.course)?.label} dersinde bireyselleştirilmiş eğitime ihtiyaç duymaktadır.`;
        setFormData(prev => ({ ...prev, performanceLevel: text }));
    };

    const handleToggleUDA = (uda) => {
        setFormData(prev => {
            const isSelected = prev.selectedLongTermGoals.includes(uda);
            if (isSelected) {
                const { [uda]: removed, ...restKDA } = prev.selectedShortTermGoals;
                return {
                    ...prev,
                    selectedLongTermGoals: prev.selectedLongTermGoals.filter(g => g !== uda),
                    selectedShortTermGoals: restKDA
                };
            } else {
                return {
                    ...prev,
                    selectedLongTermGoals: [...prev.selectedLongTermGoals, uda],
                    goalDates: {
                        ...prev.goalDates,
                        [uda]: { start: formData.bepStartDate, end: formData.bepEndDate }
                    }
                };
            }
        });
    };

    const handleDateChange = (key, type, value) => {
        setFormData(prev => ({
            ...prev,
            goalDates: {
                ...prev.goalDates,
                [key]: { ...prev.goalDates[key], [type]: value }
            }
        }));
    };

    const handleToggleKDA = (uda, kda) => {
        setFormData(prev => {
            const currentKDA = prev.selectedShortTermGoals[uda] || [];
            const isSelected = currentKDA.includes(kda);

            // Eğer yeni seçiliyorsa varsayılan tarihleri ata
            let newGoalDates = { ...prev.goalDates };
            if (!isSelected) {
                newGoalDates[kda] = { start: formData.bepStartDate, end: formData.bepEndDate };
            }

            return {
                ...prev,
                selectedShortTermGoals: {
                    ...prev.selectedShortTermGoals,
                    [uda]: isSelected ? currentKDA.filter(k => k !== kda) : [...currentKDA, kda]
                },
                goalDates: newGoalDates
            };
        });
    };

    const handleMultiSelect = (field, value) => {
        setFormData(prev => {
            const list = prev[field];
            return {
                ...prev,
                [field]: list.includes(value) ? list.filter(i => i !== value) : [...list, value]
            };
        });
    };

    const currentGoals = (formData.disabilityType && formData.course && bepData.goals[formData.disabilityType]?.[formData.course])
        ? bepData.goals[formData.disabilityType][formData.course]
        : (formData.disabilityType && bepData.goals['ozgul_ogrenme']?.[formData.course]) // Fallback
            ? bepData.goals['ozgul_ogrenme'][formData.course]
            : [];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto w-full h-full">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden my-8">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-700 to-indigo-600 px-8 py-5 flex justify-between items-center text-white shrink-0">
                    <div>
                        <h3 className="font-bold text-2xl flex items-center">
                            <FileText className="mr-2" /> MEB Standartlarında BEP Hazırlama
                        </h3>
                        <p className="text-indigo-100 text-sm opacity-90 mt-1">
                            {step === 1 && 'Adım 1: Okul ve Öğrenci Bilgileri'}
                            {step === 2 && 'Adım 2: Eğitsel Performans Düzeyi'}
                            {step === 3 && 'Adım 3: Amaçlar ve Tarihler'}
                            {step === 4 && 'Adım 4: Yöntem, Materyal ve Değerlendirme'}
                            {step === 5 && 'Adım 5: Görüntüleme ve Çıktı'}
                        </p>
                    </div>
                    <button onClick={closeModal} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition">
                        <ChevronDown size={24} className="transform rotate-180" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-8 overflow-y-auto flex-1 bg-gray-50">
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-8">
                        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(step / 5) * 100}%` }}></div>
                    </div>

                    {step === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Okul ve Öğrenci Bilgileri</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">İlçe Adı</label>
                                        <input
                                            type="text"
                                            className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Örn: Kadıköy"
                                            value={formData.districtName}
                                            onChange={(e) => setFormData({ ...formData, districtName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Okul Adı</label>
                                        <input
                                            type="text"
                                            className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Örn: Cumhuriyet Anadolu Lisesi"
                                            value={formData.schoolName}
                                            onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Eğitim Öğretim Yılı</label>
                                        <input
                                            type="text"
                                            className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Örn: 2024-2025"
                                            value={formData.academicYear}
                                            onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Öğrenci Adı Soyadı</label>
                                        <select
                                            className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                                            value={formData.studentName}
                                        >
                                            <option value="">Seçiniz...</option>
                                            {students.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                            <option value="Manuel">Diğer (Manuel Giriş)</option>
                                        </select>
                                    </div>
                                    {formData.studentName === 'Manuel' && (
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Ad Soyad Giriniz</label>
                                            <input
                                                type="text"
                                                className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Öğrenci Numarası</label>
                                        <input
                                            type="text"
                                            className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Örn: 1245"
                                            value={formData.studentNumber}
                                            onChange={(e) => setFormData({ ...formData, studentNumber: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Sınıfı / Şubesi</label>
                                        <input
                                            type="text"
                                            className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Örn: 9/A"
                                            value={formData.studentClass}
                                            onChange={(e) => setFormData({ ...formData, studentClass: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Eğitsel Tanı / Yetersizlik</label>
                                        <select
                                            className="w-full border-gray-300 rounded-lg"
                                            onChange={(e) => setFormData({ ...formData, disabilityType: e.target.value })}
                                            value={formData.disabilityType}
                                        >
                                            <option value="">Seçiniz...</option>
                                            {bepData.disabilityTypes.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">BEP Hazırlanacak Ders</label>
                                        <select
                                            className="w-full border-gray-300 rounded-lg"
                                            onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                                            value={formData.course}
                                        >
                                            <option value="">Seçiniz...</option>
                                            {bepData.courses.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">BEP Başlangıç Tarihi</label>
                                        <input
                                            type="date"
                                            className="w-full border-gray-300 rounded-lg"
                                            value={formData.bepStartDate}
                                            onChange={(e) => setFormData({ ...formData, bepStartDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">BEP Bitiş Tarihi</label>
                                        <input
                                            type="date"
                                            className="w-full border-gray-300 rounded-lg"
                                            value={formData.bepEndDate}
                                            onChange={(e) => setFormData({ ...formData, bepEndDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-gray-800">Eğitsel Performans Düzeyi</h4>
                                    <button
                                        onClick={generatePerformanceLevel}
                                        className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-200 transition flex items-center"
                                        disabled={!formData.disabilityType}
                                    >
                                        <RefreshCw size={14} className="mr-1" /> Otomatik Oluştur
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 mb-3">
                                    Öğrencinin bu ders özelinde yapabildiklerini ve yapamadıklarını detaylıca açıklayan bir metin giriniz.
                                </p>
                                <textarea
                                    className="w-full h-40 border-gray-300 rounded-lg p-4 text-sm focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Öğrenci; okuma yazma becerilerine sahiptir ancak okuduğunu anlamada yaşıtlarından geridedir..."
                                    value={formData.performanceLevel}
                                    onChange={(e) => setFormData({ ...formData, performanceLevel: e.target.value })}
                                ></textarea>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-fade-in">
                            {currentGoals.length > 0 ? (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm text-blue-800 mb-4">
                                        <AlertCircle size={16} className="inline mr-2" />
                                        Önce <strong>Uzun Dönemli Amaç (UDA)</strong> seçin, ardından açılan listeden <strong>Kısa Dönemli Amaçları (KDA)</strong> belirleyin ve her biri için tarih aralığı girin.
                                    </div>
                                    {currentGoals.map((goalGroup, idx) => (
                                        <div key={idx} className={`bg-white p-6 rounded-xl border transition ${formData.selectedLongTermGoals.includes(goalGroup.uda) ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'}`}>
                                            <div className="flex flex-col md:flex-row md:items-start justify-between space-y-4 md:space-y-0">
                                                <div className="flex items-start space-x-3 flex-1">
                                                    <input
                                                        type="checkbox"
                                                        className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                        checked={formData.selectedLongTermGoals.includes(goalGroup.uda)}
                                                        onChange={() => handleToggleUDA(goalGroup.uda)}
                                                    />
                                                    <div>
                                                        <span className="font-bold text-gray-800 block text-lg">{goalGroup.uda}</span>
                                                        <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">Uzun Dönemli Amaç (UDA)</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {formData.selectedLongTermGoals.includes(goalGroup.uda) && (
                                                <div className="ml-8 mt-4 pl-4 border-l-2 border-gray-100 space-y-3">
                                                    <p className="text-sm font-semibold text-gray-500 mb-2">Kısa Dönemli Amaçlar (KDA) ve Tarihleri:</p>
                                                    {goalGroup.kda.map((kda, kIdx) => {
                                                        const isKdaSelected = formData.selectedShortTermGoals[goalGroup.uda]?.includes(kda) || false;
                                                        return (
                                                            <div key={kIdx} className="flex flex-col md:flex-row md:items-center justify-between p-2 rounded-lg transition hover:bg-gray-50 border border-transparent hover:border-gray-200">
                                                                <label className="flex items-center space-x-3 cursor-pointer flex-1 mr-4">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                                                        checked={isKdaSelected}
                                                                        onChange={() => handleToggleKDA(goalGroup.uda, kda)}
                                                                    />
                                                                    <span className="text-gray-700 text-sm">{kda}</span>
                                                                </label>

                                                                {isKdaSelected && (
                                                                    <div className="flex space-x-2 mt-2 md:mt-0 animate-fade-in">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[9px] text-gray-400">Başlangıç</span>
                                                                            <input
                                                                                type="date"
                                                                                className="text-xs border-gray-200 rounded py-1 px-2 w-24"
                                                                                value={formData.goalDates[kda]?.start || formData.bepStartDate}
                                                                                onChange={(e) => handleDateChange(kda, 'start', e.target.value)}
                                                                            />
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[9px] text-gray-400">Bitiş</span>
                                                                            <input
                                                                                type="date"
                                                                                className="text-xs border-gray-200 rounded py-1 px-2 w-24"
                                                                                value={formData.goalDates[kda]?.end || formData.bepEndDate}
                                                                                onChange={(e) => handleDateChange(kda, 'end', e.target.value)}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-300 rounded-xl">
                                    <AlertCircle className="text-yellow-500 mb-4" size={48} />
                                    <h4 className="text-xl font-bold text-gray-700">Bu ders için hazır hedef bulunamadı.</h4>
                                    <p className="text-gray-500 mt-2">Lütfen veritabanının güncellenmesini bekleyin veya manuel olarak devam edin.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-5 rounded-xl border border-gray-200">
                                    <h4 className="font-bold text-gray-800 mb-3 flex items-center"><BookOpen size={18} className="mr-2 text-indigo-500" /> Öğretim Yöntemleri</h4>
                                    <div className="space-y-2 h-64 overflow-y-auto pr-2 custom-scrollbar">
                                        {bepData.teachingMethods.map((m, i) => (
                                            <label key={i} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                                                <input type="checkbox" checked={formData.methods.includes(m)} onChange={() => handleMultiSelect('methods', m)} className="rounded text-indigo-600" />
                                                <span>{m}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white p-5 rounded-xl border border-gray-200">
                                    <h4 className="font-bold text-gray-800 mb-3 flex items-center"><Folder size={18} className="mr-2 text-orange-500" /> Materyaller</h4>
                                    <div className="space-y-2 h-64 overflow-y-auto pr-2 custom-scrollbar">
                                        {bepData.teachingMaterials.map((m, i) => (
                                            <label key={i} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                                                <input type="checkbox" checked={formData.materials.includes(m)} onChange={() => handleMultiSelect('materials', m)} className="rounded text-orange-600" />
                                                <span>{m}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white p-5 rounded-xl border border-gray-200">
                                    <h4 className="font-bold text-gray-800 mb-3 flex items-center"><ClipboardList size={18} className="mr-2 text-green-500" /> Değerlendirme</h4>
                                    <div className="space-y-2 h-64 overflow-y-auto pr-2 custom-scrollbar">
                                        {bepData.evaluationMethods.map((m, i) => (
                                            <label key={i} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                                                <input type="checkbox" checked={formData.evaluation.includes(m)} onChange={() => handleMultiSelect('evaluation', m)} className="rounded text-green-600" />
                                                <span>{m}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="animate-fade-in bg-white shadow-xl p-8 rounded-none border border-gray-200 max-w-[21cm] mx-auto min-h-[29.7cm] text-black">
                            {/* Resmi BEP Form Tasarımı (Print Preview) */}
                            <div className="text-center border-b-2 border-black pb-4 mb-6">
                                <h2 className="text-xl font-bold uppercase">Bireyselleştirilmiş Eğitim Programı (BEP)</h2>
                                <p className="text-sm mt-1">{formData.academicYear} Eğitim Öğretim Yılı</p>
                            </div>

                            <div className="text-center mb-6 font-bold uppercase text-sm">
                                {formData.schoolName && <p>{formData.schoolName} MÜDÜRLÜĞÜ</p>}
                                {formData.districtName && <p>{formData.districtName}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                                <div className="border border-black p-2">
                                    <span className="font-bold block">Öğrenci Adı Soyadı:</span>
                                    {formData.studentName}
                                </div>
                                <div className="border border-black p-2">
                                    <span className="font-bold block">Okul No:</span>
                                    {formData.studentNumber}
                                </div>
                                <div className="border border-black p-2">
                                    <span className="font-bold block">Sınıf / Şube:</span>
                                    {formData.studentClass}
                                </div>
                                <div className="border border-black p-2">
                                    <span className="font-bold block">Eğitsel Tanı:</span>
                                    {bepData.disabilityTypes.find(d => d.id === formData.disabilityType)?.label}
                                </div>
                                <div className="border border-black p-2">
                                    <span className="font-bold block">Ders:</span>
                                    {bepData.courses.find(c => c.id === formData.course)?.label}
                                </div>
                                <div className="border border-black p-2">
                                    <span className="font-bold block">BEP Tarih Aralığı:</span>
                                    {formData.bepStartDate} / {formData.bepEndDate}
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-bold border-b border-black mb-2 uppercase text-sm">Eğitsel Performans Düzeyi</h3>
                                <p className="text-sm p-2 border border-black min-h-[80px] bg-gray-50">{formData.performanceLevel}</p>
                            </div>

                            <div className="mb-6">
                                <table className="w-full border-collapse border border-black text-xs">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border border-black p-2 w-[30%] text-left">Uzun Dönemli Amaçlar</th>
                                            <th className="border border-black p-2 w-[30%] text-left">Kısa Dönemli Amaçlar</th>
                                            <th className="border border-black p-2 w-[15%] text-center">Başlama / Bitiş Tarihi</th>
                                            <th className="border border-black p-2 w-[25%] text-left">Yöntem / Teknik / Materyal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.selectedLongTermGoals.map((uda, idx) => (
                                            <tr key={idx}>
                                                <td className="border border-black p-2 align-top font-semibold">{uda}</td>
                                                <td className="border border-black p-2 align-top p-0">
                                                    <table className="w-full border-collapse">
                                                        <tbody>
                                                            {formData.selectedShortTermGoals[uda]?.map((kda, kIdx) => (
                                                                <tr key={kIdx} className="border-b border-gray-200 last:border-0">
                                                                    <td className="p-2 border-r border-gray-300">{kda}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </td>
                                                <td className="border border-black p-2 align-top p-0 text-center">
                                                    <table className="w-full border-collapse">
                                                        <tbody>
                                                            {formData.selectedShortTermGoals[uda]?.map((kda, kIdx) => (
                                                                <tr key={kIdx} className="border-b border-gray-200 last:border-0">
                                                                    <td className="p-2 whitespace-nowrap">
                                                                        <div className="flex flex-col text-[10px]">
                                                                            <span>{formData.goalDates[kda]?.start || '-'}</span>
                                                                            <span className="font-bold text-gray-400">/</span>
                                                                            <span>{formData.goalDates[kda]?.end || '-'}</span>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </td>
                                                {/* İlk satırda ortak yöntemleri göster, diğerlerinde boş bırak */}
                                                {idx === 0 && (
                                                    <td className="border border-black p-2 align-top" rowSpan={formData.selectedLongTermGoals.length}>
                                                        <p className="font-bold text-xs underline mb-1">Yöntemler:</p>
                                                        <p className="mb-2">{formData.methods.join(', ')}</p>
                                                        <p className="font-bold text-xs underline mb-1">Materyaller:</p>
                                                        <p className="mb-2">{formData.materials.join(', ')}</p>
                                                        <p className="font-bold text-xs underline mb-1">Değerlendirme:</p>
                                                        <p>{formData.evaluation.join(', ')}</p>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-12 break-inside-avoid">
                                <h3 className="font-bold text-center mb-6 uppercase text-sm">BEP Geliştirme Birimi İmzaları</h3>
                                <div className="grid grid-cols-4 gap-4 text-center text-xs">
                                    <div className="mb-8">
                                        <p className="font-bold">Müdür Yrd.</p>
                                        <div className="mt-4 border-b border-black w-24 mx-auto"></div>
                                    </div>
                                    <div className="mb-8">
                                        <p className="font-bold">Rehber Öğretmen</p>
                                        <div className="mt-4 border-b border-black w-24 mx-auto"></div>
                                    </div>
                                    <div className="mb-8">
                                        <p className="font-bold">Sınıf Öğretmeni</p>
                                        <div className="mt-4 border-b border-black w-24 mx-auto"></div>
                                    </div>
                                    <div className="mb-8">
                                        <p className="font-bold">Veli (Anne/Baba)</p>
                                        <div className="mt-4 border-b border-black w-24 mx-auto"></div>
                                    </div>
                                </div>
                                <div className="text-center mt-4">
                                    <p className="font-bold">.... / .... / 2024</p>
                                    <p className="font-bold mt-2">Okul Müdürü</p>
                                    <div className="mt-8 border-b border-black w-32 mx-auto"></div>
                                    <p className="text-[10px] mt-1">Uygundur</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-white border-t border-gray-200 flex justify-between items-center shrink-0">
                    <button
                        onClick={() => setStep(prev => Math.max(1, prev - 1))}
                        disabled={step === 1}
                        className="px-6 py-3 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition disabled:opacity-50"
                    >
                        Geri
                    </button>

                    {step < 5 ? (
                        <button
                            onClick={() => setStep(prev => Math.min(5, prev + 1))}
                            disabled={
                                (step === 1 && (!formData.schoolName || !formData.studentName || !formData.course || !formData.disabilityType)) ||
                                (step === 2 && !formData.performanceLevel) ||
                                (step === 3 && formData.selectedLongTermGoals.length === 0)
                            }
                            className="btn-primary px-8 py-3 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Devam Et <ChevronRight className="ml-2 inline" size={18} />
                        </button>
                    ) : (
                        <div className="flex space-x-3">
                            <button onClick={() => window.print()} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center shadow-lg shadow-blue-200">
                                <Printer size={20} className="mr-2" />
                                Yazdır
                            </button>
                            <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center shadow-lg shadow-indigo-200">
                                <Download size={20} className="mr-2" />
                                PDF İndir
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BEPGenerator;
