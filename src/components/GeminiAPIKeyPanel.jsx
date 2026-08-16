import React, { useState, useEffect } from 'react';
import { Key, Check, X, ExternalLink, AlertCircle } from 'lucide-react';
import { checkGeminiAPIKey, setGeminiAPIKey, removeGeminiAPIKey, getAPIKeySetupGuide } from '../services/geminiAI';

/**
 * Gemini API Key Kurulum Paneli
 */
const GeminiAPIKeyPanel = ({ onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [status, setStatus] = useState(null);
    const [showGuide, setShowGuide] = useState(false);

    useEffect(() => {
        const currentStatus = checkGeminiAPIKey();
        setStatus(currentStatus);
    }, []);

    const handleSave = () => {
        if (setGeminiAPIKey(apiKey)) {
            alert('✅ API Key kaydedildi! Artık sınırsız doğal dil anlama aktif!');
            if (onClose) onClose();
        } else {
            alert('❌ Geçersiz API Key! "AIzaSy" ile başlamalı.');
        }
    };

    const handleRemove = () => {
        if (confirm('API Key\'i silmek istediğinize emin misiniz?')) {
            removeGeminiAPIKey();
            setStatus({ exists: false });
            alert('🗑️ API Key silindi. Offline parser kullanılacak.');
        }
    };

    const guide = getAPIKeySetupGuide();

    return (
        <div className="fixed inset-0 z-modal-high bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="on-color bg-gradient-to-r from-purple-600 to-brand text-white p-6 rounded-t-2xl">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <Key size={32} />
                            <div>
                                <h2 className="text-2xl font-bold">{guide.title}</h2>
                                <p className="text-c4 text-sm mt-1">
                                    Sınırsız Doğal Dil Anlama - TAMAmatically ilen ÜCRETSIZ!
                                </p>
                            </div>
                        </div>
                        <button onClick onClose className="p-2 hover:bg-surface/20 rounded-full transition">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Mevcut Durum */}
                {status?.exists && (
                    <div className="p-4 bg-ok-soft border-b border-ok">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-ok">
                                <Check size={20} />
                                <span className="font-medium">API Key aktif! Gemini AI çalışıyor 🚀</span>
                            </div>
                            <button
                                onClick={handleRemove}
                                className="text-danger hover:text-danger text-sm font-medium"
                            >
                                Sil
                            </button>
                        </div>
                    </div>
                )}

                <div className="p-6 space-y-6">
                    {/* Benefits */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-[color-mix(in_srgb,var(--c4)_35%,transparent)]">
                        <h3 className="font-bold text-c4 mb-3">✨ Neler Kazanacaksınız:</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {guide.benefits.map((benefit, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-sm text-c4">
                                    <span>{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Steps */}
                    <div>
                        <button
                            onClick={() => setShowGuide(!showGuide)}
                            className="flex items-center gap-2 text-brand hover:text-brand font-medium mb-3"
                        >
                            <AlertCircle size={18} />
                            {showGuide ? 'Rehberi Gizle' : 'Nasıl Alınır? (Adım adım)'}
                        </button>

                        {showGuide && (
                            <div className="space-y-3">
                                {guide.steps.map((step) => (
                                    <div key={step.step} className="flex gap-3 p-3 bg-surface-2 rounded-lg border border-line">
                                        <div className="flex-shrink-0 w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center font-bold">
                                            {step.step}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-ink">{step.title}</h4>
                                            <p className="text-sm text-ink-2 mt-1">{step.description}</p>
                                            {step.url && (
                                                <a
                                                    href={step.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-brand hover:text-brand text-sm font-medium mt-2"
                                                >
                                                    Siteye Git <ExternalLink size={14} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div>
                        <label className="block text-sm font-bold text-ink-2 mb-2">
                            API Key'inizi Yapıştırın:
                        </label>
                        <input
                            type="text"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full p-3 border-2 border-line-2 rounded-lg focus:border-brand focus:ring-2 focus:ring-indigo-200 outline-none font-mono text-sm"
                        />
                        <p className="text-xs text-ink-2 mt-2">
                            🔒 API Key'iniz sadece sizin cihazınızda saklanır, hiçbir sunucuya gönderilmez.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            disabled={!apiKey || !apiKey.startsWith('AIzaSy')}
                            className="on-color flex-1 bg-gradient-to-r from-brand to-purple-600 text-white py-3 rounded-lg font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            💾 Kaydet ve Aktif Et
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-3 border-2 border-line-2 rounded-lg font-bold hover:bg-surface-2 transition"
                        >
                            İptal
                        </button>
                    </div>

                    {/* Info */}
                    <div className="bg-info-soft border border-info rounded-lg p-4">
                        <p className="text-sm text-info">
                            <strong>💡 İpucu:</strong> API Key olmadan da çalışır! Ama Gemini AI ile %100 doğruluk garantisi olur.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeminiAPIKeyPanel;
