import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Brain, Monitor, Smartphone, Apple, Download, CheckCircle, ArrowRight,
    Shield, Zap, Star, ChevronDown, ChevronUp, Globe, Share2, Plus,
    AlertCircle, Wifi, ExternalLink, RefreshCw
} from 'lucide-react';

// ──────────────────────────────────────────
// 🔗 KURULUM DOSYALARI
//
// APK ve Windows ZIP derleme çıktısıdır; depoya konmaz (GitHub'ın dosya
// başına sınırı 100 MB, bu dosyalar 250 MB civarı). Yeni bir derleme
// yayımlandığında buraya doğrudan indirme adresi yazılır:
//
//   android: 'https://.../ai-ogrenci-kocu.apk'
//   windows: 'https://.../ai-ogrenci-kocu-windows.zip'
//
// Adres girilmediği sürece kartlar PWA kurulumunu gösterir. Uygulama
// manifest'i bağlı olduğu için Android Chrome ve Windows Edge/Chrome
// üzerinde "uygulama olarak yükle" gerçekten çalışır — kullanıcıya
// çalışmayan bir indirme düğmesi göstermeyiz.
// ──────────────────────────────────────────
const DOWNLOAD_LINKS = {
    android: null,
    windows: null,
};

/**
 * Tarayıcının kendi kurulum teklifini yakalar.
 * Android Chrome ve masaüstü Edge/Chrome `beforeinstallprompt` yayar;
 * yakalamazsak tarayıcı teklifi kendi menüsüne gömer ve kullanıcı bulamaz.
 */
function usePwaInstall() {
    const [olay, setOlay] = useState(null);
    const [kuruldu, setKuruldu] = useState(false);

    useEffect(() => {
        const yakala = (e) => { e.preventDefault(); setOlay(e); };
        const kurulunca = () => { setKuruldu(true); setOlay(null); };
        window.addEventListener('beforeinstallprompt', yakala);
        window.addEventListener('appinstalled', kurulunca);
        return () => {
            window.removeEventListener('beforeinstallprompt', yakala);
            window.removeEventListener('appinstalled', kurulunca);
        };
    }, []);

    const kur = async () => {
        if (!olay) return false;
        olay.prompt();
        const { outcome } = await olay.userChoice;
        setOlay(null);
        return outcome === 'accepted';
    };

    return { kurulabilir: !!olay, kuruldu, kur };
}

/**
 * Kurulum dosyası yoksa gösterilen elle kurulum adımları.
 * Tarayıcı `beforeinstallprompt` yaymadığında (Firefox, kurulum zaten
 * yapılmışsa) kullanıcının tıkanmaması için tek yol budur.
 */
const PwaAdimlari = ({ adimlar, renk }) => (
    <ul className="space-y-2 w-full text-left mt-3">
        {adimlar.map((a, i) => (
            <li key={a} className="flex items-start gap-3 text-ink/65 text-sm">
                <span
                    className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-ink"
                    style={{ background: renk }}
                >
                    {i + 1}
                </span>
                {a}
            </li>
        ))}
    </ul>
);

// ──────────────────────────────────────────
// Platform Detection
// ──────────────────────────────────────────
function detectPlatform() {
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isAndroid = /Android/.test(ua);
    const isMac = /Macintosh|MacIntel|MacPPC|Mac68K/.test(ua) && !isIOS;
    const isWindows = /Win/.test(navigator.platform || ua);
    const isMobile = isIOS || isAndroid;
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);

    // PWA: already installed?
    const isStandalone =
        window.navigator.standalone === true ||
        window.matchMedia('(display-mode: standalone)').matches;

    return { isIOS, isAndroid, isMac, isWindows, isMobile, isSafari, isStandalone };
}

// ──────────────────────────────────────────
// iOS PWA Install Guide Component
// ──────────────────────────────────────────
const IOSInstallGuide = () => {
    const steps = [
        { icon: '🌐', text: 'Bu sayfayı Safari\'de aç (Chrome değil!)' },
        { icon: '📤', text: 'Alttaki paylaş butonuna (⬆️) dokun' },
        { icon: '➕', text: '"Ana Ekrana Ekle" seçeneğine bas' },
        { icon: '✅', text: '"Ekle" ye basarak uygulamayı yükle' },
    ];
    return (
        <div className="mt-6 bg-surface/5 border border-line rounded-2xl p-5">
            <p className="text-ink-2 text-xs font-bold uppercase tracking-widest mb-4">📱 iPhone Kurulum Adımları (PWA)</p>
            <ol className="space-y-3">
                {steps.map((s, i) => (
                    <li key={i} className="flex items-center gap-3">
                        <span className="text-xl w-8 flex-shrink-0 text-center">{s.icon}</span>
                        <span className="text-ink-2 text-sm">{s.text}</span>
                    </li>
                ))}
            </ol>
            <div className="mt-4 p-3 bg-warn/10 border border-orange-400/20 rounded-xl">
                <p className="text-warn text-xs flex items-start gap-2">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    Safari dışında bir tarayıcı kullanıyorsan, sayfayı Safari ile açman gerekiyor. Chrome ile Ana Ekrana Ekle çalışmaz.
                </p>
            </div>
        </div>
    );
};

// ──────────────────────────────────────────
// Android Download Card
// ──────────────────────────────────────────
const AndroidCard = ({ isDetected }) => {
    const [status, setStatus] = useState('idle'); // idle | downloading | done | error
    const apk = DOWNLOAD_LINKS.android;
    const pwa = usePwaInstall();

    const handleDownload = () => {
        setStatus('downloading');
        // Open Google Drive direct download in same tab — triggers download dialog on mobile
        window.open(apk, '_blank');
        setStatus('done');
        setTimeout(() => setStatus('idle'), 4000);
    };

    const kurulumTikla = async () => {
        const oldu = await pwa.kur();
        if (oldu) { setStatus('done'); setTimeout(() => setStatus('idle'), 4000); }
    };

    return (
        <div className={`relative rounded-3xl p-7 border transition-all duration-yavas ${isDetected
            ? 'bg-gradient-to-b from-green-500/15 to-green-500/5 border-green-400/40 ring-2 ring-green-400/20'
            : 'bg-surface/5 border-line'
            }`}>
            {isDetected && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-ok text-white text-xs font-bold px-4 py-1 rounded-full shadow animate-pulse">
                        📱 Senin Cihazın
                    </span>
                </div>
            )}

            <div className="flex flex-col items-center text-center">
                <div className="on-color w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-green-500/30">
                    <Smartphone size={40} className="text-ink" />
                </div>
                <h2 className="text-2xl font-bold text-ink mb-1">Android</h2>
                <p className="text-ink-3 text-sm mb-6">
                    {apk ? 'APK · Android 7.0+' : 'Chrome ile ana ekrana kurulum'}
                </p>

                <ul className="space-y-2 mb-7 w-full text-left">
                    {(apk
                        ? ['Google Play gerektirmez', 'Direkt APK kurulumu', 'Tüm özellikler dahil']
                        : ['Google Play gerektirmez', 'Ana ekrana uygulama gibi eklenir', 'Her zaman güncel sürüm']
                    ).map(f => (
                        <li key={f} className="flex items-center gap-3 text-ink/65 text-sm">
                            <CheckCircle size={15} className="text-ok flex-shrink-0" />
                            {f}
                        </li>
                    ))}
                </ul>

                {/* Kurulum dosyası yayımlanmadıysa çalışmayan bir indirme
                    düğmesi göstermek yerine tarayıcının kendi kurulumunu
                    sunuyoruz. */}
                {!apk ? (
                    pwa.kuruldu ? (
                        <div className="w-full p-3 bg-ok/15 border border-green-400/30 rounded-xl text-center">
                            <p className="text-ok text-sm font-bold">✅ Uygulama yüklendi</p>
                            <p className="text-ok/60 text-xs mt-1">Ana ekranından açabilirsin</p>
                        </div>
                    ) : pwa.kurulabilir ? (
                        <button
                            onClick={kurulumTikla}
                            className="w-full flex items-center justify-center gap-3 font-bold py-4 px-6 rounded-2xl transition-all duration-normal shadow-lg text-ink bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 shadow-green-500/30 hover:shadow-green-500/50 hover:scale-[1.02]"
                        >
                            <Plus size={20} />
                            <span>Uygulama Olarak Yükle</span>
                        </button>
                    ) : (
                        <PwaAdimlari
                            renk="var(--ok)"
                            adimlar={[
                                'Bu sayfayı Chrome ile aç',
                                'Sağ üstteki ⋮ menüsüne bas',
                                '"Uygulamayı yükle" ya da "Ana ekrana ekle" seç',
                            ]}
                        />
                    )
                ) : (
                <button
                    onClick={handleDownload}
                    disabled={status === 'downloading'}
                    className={`w-full flex items-center justify-center gap-3 font-bold py-4 px-6 rounded-2xl transition-all duration-normal shadow-lg text-ink ${status === 'done'
                        ? 'bg-ok shadow-green-500/30'
                        : status === 'error'
                            ? 'bg-danger shadow-red-500/30'
                            : status === 'downloading'
                                ? 'bg-ok opacity-70 cursor-wait'
                                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 shadow-green-500/30 hover:shadow-green-500/50 hover:scale-[1.02]'
                        }`}
                >
                    {status === 'downloading' && <RefreshCw size={20} className="animate-spin" />}
                    {status === 'done' && <CheckCircle size={20} />}
                    {status === 'error' && <AlertCircle size={20} />}
                    {status === 'idle' && <Download size={20} />}
                    <span>
                        {status === 'downloading' ? 'İndiriliyor...'
                            : status === 'done' ? 'İndirme Başladı!'
                                : status === 'error' ? 'Tekrar Dene'
                                    : 'APK İndir'}
                    </span>
                </button>
                )}

                <p className="text-ink-3 text-xs mt-3">
                    {apk
                        ? "Ayarlar → Güvenlik → Bilinmeyen Kaynaklar'a izin ver"
                        : 'Kurulum sonrası internet olmadan da açılır.'}
                </p>
            </div>
        </div>
    );
};

// ──────────────────────────────────────────
// iOS Card
// ──────────────────────────────────────────
const IOSCard = ({ isDetected, isSafari, isStandalone }) => {
    return (
        <div className={`relative rounded-3xl p-7 border transition-all duration-yavas ${isDetected
            ? 'bg-gradient-to-b from-slate-400/15 to-slate-400/5 border-line-2/40 ring-2 ring-gray-400/20'
            : 'bg-surface/5 border-line'
            }`}>
            {isDetected && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gray-400 text-ink text-xs font-bold px-4 py-1 rounded-full shadow animate-pulse">
                        📱 Senin Cihazın
                    </span>
                </div>
            )}

            {isStandalone && (
                <div className="mb-4 p-3 bg-ok/15 border border-green-400/30 rounded-xl text-center">
                    <p className="text-ok text-sm font-bold">✅ Uygulama zaten yüklü!</p>
                    <p className="text-ok/60 text-xs mt-1">Ana ekranından açabilirsin</p>
                </div>
            )}

            <div className="flex flex-col items-center text-center">
                <div className="on-color w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-gray-500/30">
                    <Apple size={40} className="text-ink" />
                </div>
                <h2 className="text-2xl font-bold text-ink mb-1">iPhone / iPad</h2>
                <p className="text-ink-3 text-sm mb-6">PWA · iOS 14+</p>

                <ul className="space-y-2 mb-6 w-full text-left">
                    {['Ana ekrana uygulama gibi eklenir', 'App Store gerektirmez', 'Tam ekran deneyim'].map(f => (
                        <li key={f} className="flex items-center gap-3 text-ink/65 text-sm">
                            <CheckCircle size={15} className="text-ink-3 flex-shrink-0" />
                            {f}
                        </li>
                    ))}
                </ul>

                {!isStandalone && (
                    <>
                        {isDetected && !isSafari && (
                            <a
                                href={window.location.href}
                                className="w-full flex items-center justify-center gap-2 bg-warn/20 border border-orange-400/30 text-warn font-bold py-3 px-5 rounded-xl mb-3 text-sm"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink size={16} />
                                Safari'de Aç (Gerekli!)
                            </a>
                        )}
                        <button
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: 'Başarı Kampı',
                                        url: window.location.origin
                                    });
                                }
                            }}
                            className="on-color w-full flex items-center justify-center gap-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-400 hover:to-gray-500 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-normal shadow-lg hover:scale-[1.02]"
                        >
                            <Share2 size={20} />
                            Paylaş & Ana Ekrana Ekle
                        </button>
                    </>
                )}

                {isDetected && <IOSInstallGuide />}
            </div>
        </div>
    );
};

// ──────────────────────────────────────────
// Windows Card
// ──────────────────────────────────────────
const WindowsCard = ({ isDetected }) => {
    const [status, setStatus] = useState('idle');
    const zip = DOWNLOAD_LINKS.windows;
    const pwa = usePwaInstall();

    const handleDownload = () => {
        // Open Google Drive direct download
        window.open(zip, '_blank');
        setStatus('done');
        setTimeout(() => setStatus('idle'), 4000);
    };

    const kurulumTikla = async () => {
        const oldu = await pwa.kur();
        if (oldu) { setStatus('done'); setTimeout(() => setStatus('idle'), 4000); }
    };

    return (
        <div className={`relative rounded-3xl p-7 border transition-all duration-yavas ${isDetected
            ? 'bg-gradient-to-b from-blue-500/15 to-blue-500/5 border-blue-400/40 ring-2 ring-blue-400/20'
            : 'bg-surface/5 border-line'
            }`}>
            {isDetected && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-info text-white text-xs font-bold px-4 py-1 rounded-full shadow animate-pulse">
                        💻 Senin Cihazın
                    </span>
                </div>
            )}

            <div className="flex flex-col items-center text-center">
                <div className="on-color w-20 h-20 bg-gradient-to-br from-blue-400 to-brand rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-blue-500/30">
                    <Monitor size={40} className="text-ink" />
                </div>
                <h2 className="text-2xl font-bold text-ink mb-1">Windows PC</h2>
                <p className="text-ink-3 text-sm mb-6">
                    {zip ? 'ZIP · Windows 10/11' : 'Edge veya Chrome ile masaüstü kurulumu'}
                </p>

                <ul className="space-y-2 mb-7 w-full text-left">
                    {(zip
                        ? ['ZIP aç → .exe çalıştır', 'Kurulum gerektirmez', 'Offline çalışma']
                        : ['Ayrı pencerede açılır', 'Başlat menüsüne eklenir', 'Her zaman güncel sürüm']
                    ).map(f => (
                        <li key={f} className="flex items-center gap-3 text-ink/65 text-sm">
                            <CheckCircle size={15} className="text-info flex-shrink-0" />
                            {f}
                        </li>
                    ))}
                </ul>

                {/* Bkz. AndroidCard: dosya yayımlanmadığında tarayıcı kurulumu */}
                {!zip ? (
                    pwa.kuruldu ? (
                        <div className="w-full p-3 bg-ok/15 border border-green-400/30 rounded-xl text-center">
                            <p className="text-ok text-sm font-bold">✅ Uygulama yüklendi</p>
                            <p className="text-ok/60 text-xs mt-1">Başlat menüsünden açabilirsin</p>
                        </div>
                    ) : pwa.kurulabilir ? (
                        <button
                            onClick={kurulumTikla}
                            className="w-full flex items-center justify-center gap-3 font-bold py-4 px-6 rounded-2xl transition-all duration-normal shadow-lg text-ink bg-gradient-to-r from-blue-500 to-brand hover:from-blue-400 hover:to-indigo-500 shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02]"
                        >
                            <Plus size={20} />
                            <span>Uygulama Olarak Yükle</span>
                        </button>
                    ) : (
                        <PwaAdimlari
                            renk="var(--info)"
                            adimlar={[
                                'Bu sayfayı Edge ya da Chrome ile aç',
                                'Adres çubuğunun sağındaki kurulum simgesine bas',
                                'Açılan pencerede "Yükle" seç',
                            ]}
                        />
                    )
                ) : (
                <button
                    onClick={handleDownload}
                    className={`w-full flex items-center justify-center gap-3 font-bold py-4 px-6 rounded-2xl transition-all duration-normal shadow-lg text-ink ${status === 'done'
                        ? 'bg-ok shadow-green-500/30'
                        : 'bg-gradient-to-r from-blue-500 to-brand hover:from-blue-400 hover:to-indigo-500 shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02]'
                        }`}
                >
                    {status === 'done' ? <CheckCircle size={20} /> : <Download size={20} />}
                    <span>{status === 'done' ? 'İndirme Başladı!' : 'PC İndir (ZIP)'}</span>
                </button>
                )}

                <p className="text-ink-3 text-xs mt-3">
                    {zip
                        ? 'Güvenlik uyarısıyla "Yine de çalıştır" seçin'
                        : 'Kurulum sonrası internet olmadan da açılır.'}
                </p>
            </div>
        </div>
    );
};

// ──────────────────────────────────────────
// Web / Web App Card (fallback)
// ──────────────────────────────────────────
const WebCard = ({ navigate }) => (
    <div className="bg-surface/5 border border-line rounded-3xl p-7 flex flex-col items-center text-center">
        <div className="on-color w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/30">
            <Globe size={40} className="text-ink" />
        </div>
        <h2 className="text-2xl font-bold text-ink mb-1">Web Uygulaması</h2>
        <p className="text-ink-3 text-sm mb-6">Tüm tarayıcılar · İndirme yok</p>
        <ul className="space-y-2 mb-7 w-full text-left">
            {['Anında kullan', 'Güncelleme gerekmez', 'Her cihazda çalışır'].map(f => (
                <li key={f} className="flex items-center gap-3 text-ink/65 text-sm">
                    <CheckCircle size={15} className="text-brand flex-shrink-0" />
                    {f}
                </li>
            ))}
        </ul>
        <button
            onClick={() => navigate('/login')}
            className="on-color w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-ink font-bold py-4 px-6 rounded-2xl transition-all hover:scale-[1.02] shadow-lg shadow-indigo-500/30"
        >
            <Globe size={20} />
            Hemen Kullan
        </button>
    </div>
);

// ──────────────────────────────────────────
// MAIN PAGE
// ──────────────────────────────────────────
const DownloadPage = () => {
    const navigate = useNavigate();
    const [platform, setPlatform] = useState(null);
    const [openFaq, setOpenFaq] = useState(null);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        setPlatform(detectPlatform());
    }, []);

    // SSS, kurulum dosyası yayımlanmış olup olmamasına göre değişir —
    // yoksa "Bilinmeyen kaynak" gibi hiç karşılaşılmayacak sorunları
    // anlatmak kullanıcıyı yanıltır.
    const dosyaVar = !!(DOWNLOAD_LINKS.android || DOWNLOAD_LINKS.windows);

    const ortakSorular = [
        {
            q: 'iPhone\'da neden APK yok?',
            a: 'Apple, APK dosyalarının yüklenmesine izin vermez. iPhone\'da en iyi deneyim için PWA (Ana Ekrana Ekle) yöntemini kullan — uygulama gibi çalışır.'
        },
        {
            q: 'Verilerim cihazlar arasında aktarılıyor mu?',
            a: 'Evet. Nasıl kurduğun fark etmez; aynı hesapla girdiğinde çalışmaların, programın ve deneme sonuçların her cihazda aynı görünür.'
        },
    ];

    const faqs = dosyaVar ? [
        {
            q: 'APK yüklerken "Bilinmeyen kaynak" uyarısı alıyorum',
            a: 'Android Ayarlar → Uygulamalar → Özel Uygulama Erişimi → Bilinmeyen Uygulamaları Yükle bölümünden tarayıcınıza izin verin. Bu tek seferlik bir izindir.'
        },
        ...ortakSorular,
        {
            q: 'Windows\'ta "Bu uygulama hasarlı" diyor',
            a: 'Uygulama Microsoft tarafından imzalanmamış. "Yine de çalıştır" veya antivirüsünüzden istisnaya ekleyin. Tamamen güvenlidir.'
        },
        {
            q: 'İndirme başlamıyor, ne yapmalıyım?',
            a: 'Tarayıcının indirmelere izin vermediğinden emin ol. Chrome\'da adres çubuğunun yanındaki indirme ikonuna bak. Safari\'de "İzin Ver" seçeneğine bas.'
        },
    ] : [
        {
            q: 'Kurulum dosyası (APK / EXE) indirmem gerekmiyor mu?',
            a: 'Hayır. Uygulama tarayıcıdan kuruluyor: ana ekranına ya da Başlat menüne eklendikten sonra tam ekran, kendi penceresinde açılır. Ayrıca güncellemeyi elle indirmen gerekmez, her açılışta son sürümü kullanırsın.'
        },
        ...ortakSorular,
        {
            q: 'Kurulum seçeneğini göremiyorum',
            a: 'Chrome, Edge veya Samsung Internet kullandığından emin ol — Firefox\'ta menü farklıdır, iPhone\'da ise yalnızca Safari destekler. Uygulamayı daha önce kurduysan seçenek tekrar görünmez.'
        },
        {
            q: 'İnternet olmadan çalışır mı?',
            a: 'Kurduktan sonra uygulama açılır ve kayıtlı çalışmaların görünür. Yeni kayıtların internet geldiğinde koçuna iletilir.'
        },
    ];

    // Order cards based on detected platform
    const getCardOrder = () => {
        if (!platform) return ['android', 'windows', 'ios', 'web'];
        if (platform.isAndroid) return ['android', 'ios', 'windows', 'web'];
        if (platform.isIOS) return ['ios', 'android', 'windows', 'web'];
        if (platform.isWindows) return ['windows', 'android', 'ios', 'web'];
        return ['android', 'ios', 'windows', 'web'];
    };

    const cardOrder = getCardOrder();
    // On mobile, show only top 2 cards first (+ "Diğerleri" toggle)
    const isMobile = platform?.isMobile;
    const visibleCards = isMobile && !showAll ? cardOrder.slice(0, 1) : cardOrder;

    const renderCard = (type) => {
        switch (type) {
            case 'android':
                return <AndroidCard key="android" isDetected={platform?.isAndroid} />;
            case 'ios':
                return <IOSCard key="ios" isDetected={platform?.isIOS} isSafari={platform?.isSafari} isStandalone={platform?.isStandalone} />;
            case 'windows':
                return <WindowsCard key="windows" isDetected={platform?.isWindows} />;
            case 'web':
                return <WebCard key="web" navigate={navigate} />;
            default:
                return null;
        }
    };

    return (
        <div className="on-color min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 font-sans">

            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-surface/5 backdrop-blur-xl border-b border-line">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <button onClick={() => navigate('/')} className="flex items-center space-x-3 group">
                            <div className="on-color w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-ink shadow-lg group-hover:scale-110 transition">
                                <Brain size={22} />
                            </div>
                            <span className="text-ink font-bold hidden sm:block">Başarı Kampı</span>
                        </button>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="text-ink-2 hover:text-ink font-medium transition text-sm flex items-center gap-1.5"
                            >
                                <Globe size={15} />
                                <span className="hidden sm:inline">Web</span>
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="bg-brand hover:bg-brand text-white font-semibold px-4 py-2 rounded-xl transition text-sm"
                            >
                                Giriş Yap
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="pt-28 pb-10 px-4 text-center">
                <div className="max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-2 bg-brand/20 border border-indigo-400/30 rounded-full px-4 py-2 mb-6">
                        <Download size={15} className="text-brand" />
                        <span className="text-brand font-semibold text-sm">Tüm Platformlarda Ücretsiz</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-ink mb-4 leading-tight">
                        Her Cihazda{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                            Yanında
                        </span>
                    </h1>
                    {platform?.isAndroid && (
                        <div className="inline-flex items-center gap-2 bg-ok/15 border border-green-400/30 rounded-xl px-4 py-2 mb-4">
                            <Smartphone size={16} className="text-ok" />
                            <span className="text-ok font-semibold text-sm">
                                {DOWNLOAD_LINKS.android
                                    ? 'Android cihazın algılandı — APK hazır!'
                                    : 'Android cihazın algılandı — kurulum adımları aşağıda'}
                            </span>
                        </div>
                    )}
                    {platform?.isIOS && (
                        <div className="inline-flex items-center gap-2 bg-gray-400/15 border border-line-2/30 rounded-xl px-4 py-2 mb-4">
                            <Apple size={16} className="text-ink-3" />
                            <span className="text-ink-3 font-semibold text-sm">iPhone/iPad algılandı — PWA kurulumu gösteriliyor</span>
                        </div>
                    )}
                    {platform?.isWindows && !platform?.isMobile && (
                        <div className="inline-flex items-center gap-2 bg-info/15 border border-blue-400/30 rounded-xl px-4 py-2 mb-4">
                            <Monitor size={16} className="text-info" />
                            <span className="text-info font-semibold text-sm">
                                {DOWNLOAD_LINKS.windows
                                    ? 'Windows PC algılandı — ZIP hazır!'
                                    : 'Windows PC algılandı — kurulum adımları aşağıda'}
                            </span>
                        </div>
                    )}
                    <p className="text-ink-3 text-base mt-3">
                        Cihazına uygun indirme seçeneği aşağıda gösteriliyor.
                    </p>
                </div>
            </section>

            {/* Cards */}
            <section className="pb-16 px-4">
                <div className={`max-w-5xl mx-auto ${isMobile ? 'max-w-sm' : 'grid grid-cols-2 lg:grid-cols-4 gap-5'}`}>
                    {/* Mobile: show detected platform card first, big */}
                    {isMobile ? (
                        <div className="space-y-4">
                            {visibleCards.map(type => renderCard(type))}
                            {!showAll && (
                                <button
                                    onClick={() => setShowAll(true)}
                                    className="w-full py-3 text-ink-3 hover:text-ink-2 text-sm font-medium border border-line rounded-2xl transition flex items-center justify-center gap-2"
                                >
                                    <ChevronDown size={16} />
                                    Diğer platformları göster
                                </button>
                            )}
                            {showAll && cardOrder.slice(1).map(type => renderCard(type))}
                        </div>
                    ) : (
                        cardOrder.map(type => renderCard(type))
                    )}
                </div>

                {/* Web App Banner */}
                {!isMobile && (
                    <div className="max-w-5xl mx-auto mt-6 bg-surface/5 border border-line rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 bg-brand/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Wifi size={22} className="text-brand" />
                            </div>
                            <div>
                                <h3 className="text-ink font-bold text-sm">İndirmek istemiyorum</h3>
                                <p className="text-ink-3 text-xs">Web versiyonunu tarayıcıdan kullan, ücretsiz.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="flex-shrink-0 bg-brand hover:bg-brand text-white font-semibold px-5 py-2.5 rounded-xl transition flex items-center gap-2 text-sm"
                        >
                            Web'de Aç <ArrowRight size={15} />
                        </button>
                    </div>
                )}
            </section>

            {/* FAQ */}
            <section className="pb-20 px-4">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold text-ink text-center mb-8">Sık Sorulan Sorular</h2>
                    <div className="space-y-3">
                        {faqs.map((faq, i) => (
                            <div key={i} className="bg-surface/5 border border-line rounded-2xl overflow-hidden">
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full flex items-start justify-between p-4 text-left hover:bg-surface/5 transition gap-3"
                                >
                                    <span className="text-ink font-semibold text-sm">{faq.q}</span>
                                    {openFaq === i
                                        ? <ChevronUp size={18} className="text-brand flex-shrink-0 mt-0.5" />
                                        : <ChevronDown size={18} className="text-ink-3 flex-shrink-0 mt-0.5" />
                                    }
                                </button>
                                {openFaq === i && (
                                    <div className="px-4 pb-4 text-ink/55 text-sm leading-relaxed border-t border-line pt-3">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-line py-8 px-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Brain size={18} className="text-brand" />
                    <span className="text-ink-2 font-semibold text-sm">EĞİTİM KOÇU İBRAHİM KARATAŞ</span>
                </div>
                <p className="text-ink-3 text-xs">© {new Date().getFullYear()} Başarı Kampı. Tüm hakları saklıdır.</p>
            </footer>
        </div>
    );
};

export default DownloadPage;
