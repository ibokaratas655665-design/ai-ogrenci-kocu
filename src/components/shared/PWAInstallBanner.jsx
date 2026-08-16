/**
 * 📲 PWA INSTALL BANNER + SERVICE WORKER KAYDEDICI
 * Mobil/desktop'ta "Ana Ekrana Ekle" önerisi
 */
import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Share2 } from 'lucide-react';

const PWAInstallBanner = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showBanner, setShowBanner] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [installed, setInstalled] = useState(false);

    // iOS kontrolü
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;

    useEffect(() => {
        // Zaten yüklüyse veya reddedildiyse gösterme
        if (isInStandaloneMode) { setInstalled(true); return; }
        if (localStorage.getItem('pwa_install_dismissed')) return;

        // Android/Chrome: beforeinstallprompt
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setTimeout(() => setShowBanner(true), 3000); // 3s sonra göster
        };
        window.addEventListener('beforeinstallprompt', handler);

        // iOS Safari: manuel rehber
        if (isIOS && isSafari && !isInStandaloneMode) {
            setTimeout(() => setShowIOSGuide(true), 5000);
        }

        // Yükleme tamamlandı
        window.addEventListener('appinstalled', () => {
            setShowBanner(false);
            setInstalled(true);
        });

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowBanner(false);
            setInstalled(true);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        setShowIOSGuide(false);
        setDismissed(true);
        localStorage.setItem('pwa_install_dismissed', '1');
    };

    if (installed || dismissed || (!showBanner && !showIOSGuide)) return null;

    // ─── Android/Chrome Banner ─────────────────────────────
    if (showBanner && !isIOS) {
        return (
            <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-in">
                <div className="on-color bg-gradient-to-r from-brand to-purple-700 rounded-2xl shadow-2xl p-4 text-white flex items-center gap-4">
                    {/* Logo */}
                    <div className="w-12 h-12 bg-surface/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Smartphone size={22} />
                    </div>

                    {/* Metin */}
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-sm">Uygulamayı Kur!</p>
                        <p className="text-xs text-ink-2 mt-0.5 leading-snug">
                            Ana ekrana ekle — internet olmadan da çalışır, bildirim alırsın
                        </p>
                    </div>

                    {/* Butonlar */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={handleDismiss}
                            className="p-1.5 text-ink-2 hover:text-ink hover:bg-surface/10 rounded-lg transition"
                        >
                            <X size={16} />
                        </button>
                        <button
                            onClick={handleInstall}
                            className="flex items-center gap-1.5 bg-surface text-brand text-xs font-black px-3.5 py-2 rounded-xl hover:bg-brand-soft transition shadow-sm"
                        >
                            <Download size={14} /> Kur
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── iOS Safari Rehberi ────────────────────────────────
    if (showIOSGuide && isIOS) {
        return (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-end animate-fade-in" onClick={handleDismiss}>
                <div
                    className="w-full bg-surface rounded-t-3xl p-6 animate-slide-up"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="w-10 h-1 bg-surface-3 rounded-full mx-auto mb-5" />
                    <h3 className="text-lg font-black text-ink mb-1">Ana Ekrana Ekle 📲</h3>
                    <p className="text-sm text-ink-2 mb-6">
                        Bu uygulamayı iOS'ta bir uygulama gibi kullanabilirsin:
                    </p>

                    <div className="space-y-4 mb-6">
                        {[
                            { step: '1', icon: <Share2 size={18} />, text: 'Alttaki paylaş butonuna dokun', sub: '(📤 Paylaş simgesi)' },
                            { step: '2', icon: <Monitor size={18} />, text: '"Ana Ekrana Ekle"yi seç', sub: 'Listede aşağı kaydır ve bul' },
                            { step: '3', icon: <Download size={18} />, text: '"Ekle"ye dokun', sub: 'Uygulama ana ekranında belirir' },
                        ].map(item => (
                            <div key={item.step} className="flex items-center gap-4">
                                <div className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center font-black text-sm flex-shrink-0">
                                    {item.step}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-brand">{item.icon}</div>
                                    <div>
                                        <p className="text-sm font-bold text-ink">{item.text}</p>
                                        <p className="text-xs text-ink-3">{item.sub}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleDismiss}
                        className="w-full py-3 bg-surface-3 text-ink-2 font-bold rounded-xl text-sm hover:bg-surface-3 transition"
                    >
                        Tamam, Anladım
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

// ─── Service Worker Kayıt Hook ────────────────────────────────
export const useServiceWorker = () => {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then(reg => console.log('✅ SW kayıtlı:', reg.scope))
                .catch(err => console.warn('⚠️ SW kayıt hatası:', err));
        }
    }, []);
};

export default PWAInstallBanner;
