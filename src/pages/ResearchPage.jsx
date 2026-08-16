
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
                <h1 className="text-3xl font-bold text-ink flex items-center gap-3">
                    <div className="p-2 bg-brand-soft rounded-xl text-brand">
                        <Sparkles size={28} />
                    </div>
                    AI Materyal Üretici
                </h1>
                <p className="mt-2 text-ink-2 max-w-2xl">
                    Yapay zeka desteğiyle dersleriniz için saniyeler içinde sunumlar, broşürler ve pano içerikleri hazırlayın.
                </p>
            </div>

            {/* Main Input Area */}
            <div className="bg-surface rounded-2xl shadow-sm border border-line p-8">
                <form onSubmit={handleGenerate} className="space-y-8">

                    {/* Topic Input */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-ink-2 uppercase tracking-wide">
                            Hangi Konuda İçerik Üretmek İstersiniz?
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="Örn: Verimli Ders Çalışma Teknikleri, Sınav Kaygısı, Küresel Isınma..."
                                className="w-full pl-12 pr-4 py-4 rounded-xl border border-line focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all text-lg font-medium shadow-sm"
                                disabled={isGenerating}
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3">
                                <Search size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Type Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-ink-2 uppercase tracking-wide">
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
                                        ? 'border-indigo-600 bg-brand-soft/50 shadow-md transform scale-[1.02]'
                                        : 'border-line hover:border-brand-line hover:bg-surface-2'
                                        }`}
                                >
                                    <div className={`mb-4 w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${selectedType === type.id ? 'bg-brand text-ink' : 'bg-surface-3 text-ink-2 group-hover:bg-brand-soft group-hover:text-brand'
                                        }`}>
                                        {type.icon}
                                    </div>
                                    <h3 className={`font-bold text-lg mb-1 ${selectedType === type.id ? 'text-brand' : 'text-ink'}`}>
                                        {type.label}
                                    </h3>
                                    <p className="text-sm text-ink-2 font-medium">
                                        {type.description}
                                    </p>

                                    {selectedType === type.id && (
                                        <div className="absolute top-4 right-4 text-brand">
                                            <div className="w-3 h-3 bg-brand rounded-full shadow-lg shadow-indigo-300"></div>
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
                            className={`flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-bold text-ink transition-all shadow-xl shadow-indigo-200 ${!topic || isGenerating
                                ? 'bg-gray-300 cursor-not-allowed shadow-none'
                                : 'bg-brand hover:bg-brand-hover hover:scale-[1.02] active:scale-[0.98]'
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
                <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
                    <FolderOpen size={20} className="text-ink-3" />
                    Son Üretilenler
                </h2>
                <div className="bg-surface-2 rounded-xl border border-line border-dashed p-12 text-center text-ink-3 font-medium">
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
