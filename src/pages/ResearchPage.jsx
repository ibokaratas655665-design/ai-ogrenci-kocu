
import React, { useState } from 'react';
import { Search, PenTool, Layout, FileText, Sparkles, FolderOpen, ArrowRight, Loader2 } from 'lucide-react';
import { aiService } from '../services/aiService';
import ContentPreview from '../components/research/ContentPreview';
import SearchProgress from '../components/research/SearchProgress';

const ResearchPage = () => {
    const [topic, setTopic] = useState('');
    const [selectedType, setSelectedType] = useState('SLIDE'); // SLIDE, BROCHURE, BOARD
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    const [isSearching, setIsSearching] = useState(false); // UI Simülasyonu için

    // SearchProgress onComplete tetikleyince çalışacak
    const handleSearchComplete = async () => {
        setIsSearching(false);
        setIsGenerating(true); // Kısa bir işlem durumu
        try {
            const result = await aiService.generateResearch(topic, selectedType);
            if (result.success) {
                setGeneratedContent(result.data);
                setShowPreview(true);
            }
        } catch (error) {
            console.error("Üretim hatası:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerate = (e) => {
        e.preventDefault();
        if (!topic.trim()) return;
        setIsSearching(true); // Deep Research UI Başlat
    };

    const types = [
        { id: 'SLIDE', label: 'Ders Sunumu', icon: <PenTool size={20} />, description: 'PowerPoint formatında slaytlar' },
        { id: 'BROCHURE', label: 'Bilgilendirme Broşürü', icon: <Layout size={20} />, description: 'Veli veya öğrenci için katlamalı broşür' },
        { id: 'BOARD', label: 'Sınıf Panosu', icon: <FileText size={20} />, description: 'Sınıf duvarları için görsel zenginlik' }
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in-up">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                        <Sparkles size={28} />
                    </div>
                    AI Materyal Üretici
                </h1>
                <p className="mt-2 text-gray-600 max-w-2xl">
                    Yapay zeka desteğiyle dersleriniz için saniyeler içinde sunumlar, broşürler ve pano içerikleri hazırlayın.
                </p>
            </div>

            {/* Main Input Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <form onSubmit={handleGenerate} className="space-y-8">

                    {/* Topic Input */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Hangi Konuda İçerik Üretmek İstersiniz?
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="Örn: Verimli Ders Çalışma Teknikleri, Sınav Kaygısı, Küresel Isınma..."
                                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-lg font-medium shadow-sm"
                                disabled={isGenerating}
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <Search size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Type Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Materyal Türü Seçin
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {types.map((type) => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setSelectedType(type.id)}
                                    disabled={isGenerating}
                                    className={`relative p-6 rounded-xl border-2 text-left transition-all duration-200 group ${selectedType === type.id
                                        ? 'border-indigo-600 bg-indigo-50/50 shadow-md transform scale-[1.02]'
                                        : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className={`mb-4 w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${selectedType === type.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                                        }`}>
                                        {type.icon}
                                    </div>
                                    <h3 className={`font-bold text-lg mb-1 ${selectedType === type.id ? 'text-indigo-900' : 'text-gray-900'}`}>
                                        {type.label}
                                    </h3>
                                    <p className="text-sm text-gray-500 font-medium">
                                        {type.description}
                                    </p>

                                    {selectedType === type.id && (
                                        <div className="absolute top-4 right-4 text-indigo-600">
                                            <div className="w-3 h-3 bg-indigo-600 rounded-full shadow-lg shadow-indigo-300"></div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={!topic || isGenerating}
                            className={`flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-bold text-white transition-all shadow-xl shadow-indigo-200 ${!topic || isGenerating
                                ? 'bg-gray-300 cursor-not-allowed shadow-none'
                                : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98]'
                                }`}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={24} className="animate-spin" />
                                    İçerik Hazırlanıyor...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={24} />
                                    Araştır ve Üret
                                    <ArrowRight size={20} className="ml-1" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Recent History (Placeholder) */}
            <div className="mt-12">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FolderOpen size={20} className="text-gray-400" />
                    Son Üretilenler
                </h2>
                <div className="bg-gray-50 rounded-xl border border-gray-200 border-dashed p-12 text-center text-gray-400 font-medium">
                    Henüz kayıtlı bir materyaliniz yok.
                </div>
            </div>

            {/* Deep Research Visualizer */}
            {isSearching && (
                <SearchProgress
                    topic={topic}
                    onComplete={handleSearchComplete}
                />
            )}

            {/* Preview Modal */}
            {showPreview && generatedContent && (
                <ContentPreview
                    content={generatedContent}
                    onClose={() => setShowPreview(false)}
                />
            )}
        </div>
    );
};

export default ResearchPage;
