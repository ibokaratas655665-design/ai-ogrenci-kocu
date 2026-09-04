import React, { useState, useEffect } from 'react';
import { X, Save, Settings, Shield, Users, Lock, Unlock, BookOpen, FileText, Calendar, Target, MessageSquare, BarChart2, Brain, Palette } from 'lucide-react';
import AppearancePanel from './settings/AppearancePanel';
import Modal from './ui/Modal';
import { oku } from '../services/veriDeposu';
import { OBPManager, CurriculumManager } from './dashboard/AdvancedExamsTab';
import {
    DINI_VARSAYILAN, OGRETIM_VARSAYILAN, YENI_YIL_SABLONU, YENI_DONEM_SABLONU,
} from '../services/akademikTakvim';

/** Varsayılanlar — styles/theme.css ile aynı değerler. */
const DEFAULT_BRAND = '#1E3A8A';
const DEFAULT_ACCENT = '#0F766E';
const DEFAULT_BG = '#F7F9FC';

const gecerliHex = (v) => (typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(v).trim()));

/** Kaydedilmiş bozuk değerleri temizleyip geçerli hex'e düşürür. */
const hexVeya = (v, yedek) => (gecerliHex(v) ? String(v).trim() : yedek);

const SettingsModal = ({ onClose }) => {
    const [settings, setSettings] = useState({
        // Sistem Ayarları
        systemLocked: false,
        maintenanceMode: false,

        // Öğrenci Yetkileri
        studentPermissions: {
            canUseStudyPlanner: true,
            canUseAIChat: true,
            canViewAnalytics: true,
            canUploadTrials: true,
            canViewGuidance: true,
            canAccessInventories: true,
            canDownloadReports: true,
            canEditProfile: true,
            canViewMessages: true,
            canViewTasks: true
        },

        // Koç Yetkileri
        coachPermissions: {
            canCreatePrograms: true,
            canEditStudents: true,
            canAccessAllStudents: true,
            canManageGroups: true,
            canViewReports: true
        },

        // Genel Ayarlar
        general: {
            appName: 'Başarı Kampı',
            defaultLanguage: 'tr',
            // Renk girdileri HEX olmak zorunda; CSS değişken adı yazılırsa
            // <input type="color"> değeri okuyamaz ve siyaha düşer.
            themeColor: DEFAULT_BRAND,
            themeAccentColor: DEFAULT_ACCENT,
            maxStudentsPerCoach: 50,
            sessionTimeout: 60 // dakika
        },

        /* 04.09: merkezî sınav tarihleri + akademik takvim düzenlemesi
           (countdown / Öğrenci 360 / Genel Bakış takvimi buradan okur). */
        sinav: {},
        takvim: {}
    });

    /**
     * Kayıtlı ayarları yükler.
     * Kayıt doğrudan setState'e verilmez — eski kayıtlarda yeni görünüm
     * alanları (zemin, yazı tipi, punto) bulunmuyor; varsayılanlarla
     * birleştirilmezse o alanlar undefined kalıp paneli bozardı.
     */
    useEffect(() => {
        let kayit = null;
        try {
            kayit = oku('app_settings', null);
        } catch {
            kayit = null;
        }
        if (!kayit) return;

        setSettings((varsayilan) => ({
            ...varsayilan,
            ...kayit,
            general: { ...varsayilan.general, ...(kayit.general || {}) },
            studentPermissions: { ...varsayilan.studentPermissions, ...(kayit.studentPermissions || {}) },
            coachPermissions: { ...varsayilan.coachPermissions, ...(kayit.coachPermissions || {}) },
            sinav: kayit.sinav && typeof kayit.sinav === 'object' ? kayit.sinav : {},
            takvim: kayit.takvim && typeof kayit.takvim === 'object' ? kayit.takvim : {},
        }));
    }, []);

    /**
     * Görünüm alanları (renk, zemin, yazı tipi, punto) değiştiğinde
     * yalnızca yerel duruma yazılır. Sağdaki önizleme bu durumdan
     * beslendiği için sonuç anında görülür; GERÇEK arayüz Kaydet'e
     * basılana kadar değişmez — yanlış bir seçimle uygulama okunmaz
     * hâle gelmesin diye.
     */
    const gorunumDegistir = (yama) => {
        setSettings((o) => ({ ...o, general: { ...o.general, ...yama } }));
    };

    const gorunumuSifirla = () => {
        setSettings((o) => ({
            ...o,
            general: {
                ...o.general,
                themeColor: DEFAULT_BRAND,
                themeAccentColor: DEFAULT_ACCENT,
                screenBg: DEFAULT_BG,
                fontBody: 'jakarta',
                fontDisplay: 'syne',
                fontScale: 'normal',
            },
        }));
    };

    const iptalEt = () => onClose();

    const handleSave = () => {
        // Renk alanları her zaman geçerli hex olarak yazılır
        const temiz = {
            ...settings,
            general: {
                ...settings.general,
                themeColor: hexVeya(settings.general.themeColor, DEFAULT_BRAND),
                themeAccentColor: hexVeya(settings.general.themeAccentColor, DEFAULT_ACCENT),
                screenBg: hexVeya(settings.general.screenBg, DEFAULT_BG),
                maxStudentsPerCoach: Math.max(1, parseInt(settings.general.maxStudentsPerCoach, 10) || 50),
                sessionTimeout: Math.max(5, parseInt(settings.general.sessionTimeout, 10) || 60),
            },
        };
        localStorage.setItem('app_settings', JSON.stringify(temiz));
        setSettings(temiz);
        // Tema, oturum yöneticisi ve başlık bu olayı dinliyor
        window.dispatchEvent(new Event('settings-updated'));
        try { window.firebaseSync?.syncKey?.('app_settings'); } catch { /* senkron yoksa sorun değil */ }
        onClose();
    };

    const toggleStudentPermission = (key) => {
        setSettings({
            ...settings,
            studentPermissions: {
                ...settings.studentPermissions,
                [key]: !settings.studentPermissions[key]
            }
        });
    };

    const toggleCoachPermission = (key) => {
        setSettings({
            ...settings,
            coachPermissions: {
                ...settings.coachPermissions,
                [key]: !settings.coachPermissions[key]
            }
        });
    };

    return (
        <Modal
            acik
            onClose={onClose}
            baslikGizle
            genislik="xl"
            katmanClassName="z-settings"
            govdeClassName="p-0 flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className="on-color bg-gradient-to-r from-purple-900 to-indigo-900 text-ink p-6 shrink-0">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Settings size={32} className="text-c4" />
                        <div>
                            <h2 className="text-2xl font-bold">Sistem Ayarları</h2>
                            <p className="text-c4 text-sm mt-1">⚠️ Sadece Ana Koç Erişimi</p>
                        </div>
                    </div>
                    <button
                        onClick={iptalEt}
                        aria-label="Kapat"
                        className="p-2 hover:bg-surface/20 rounded-full transition"
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-6">
                {/* SİSTEM KONTROL */}
                <div className="glass-card p-6 border-l-4 border-danger">
                    <h3 className="text-lg font-bold text-ink mb-4 flex items-center">
                        <Shield className="mr-2 text-danger" size={22} />
                        Sistem Kilidi
                    </h3>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-danger-soft rounded-lg">
                            <div>
                                <p className="font-bold text-ink">Sistem Kilidi</p>
                                <p className="text-xs text-ink-2">Tüm kullanıcı girişlerini engelle</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, systemLocked: !settings.systemLocked })}
                                className={`px-4 py-2 rounded-lg font-bold transition ${settings.systemLocked
                                        ? 'bg-danger text-white'
                                        : 'bg-ok text-white'
                                    }`}
                            >
                                {settings.systemLocked ? <><Lock size={16} className="inline mr-1" /> KİLİTLİ</> : <><Unlock size={16} className="inline mr-1" /> AÇIK</>}
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-warn-soft rounded-lg">
                            <div>
                                <p className="font-bold text-ink">Bakım Modu</p>
                                <p className="text-xs text-ink-2">Sistem yükseltmeleri için</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                                className={`px-4 py-2 rounded-lg font-bold transition ${settings.maintenanceMode
                                        ? 'bg-warn text-ink'
                                        : 'bg-surface-3 text-ink-2'
                                    }`}
                            >
                                {settings.maintenanceMode ? 'AKTİF' : 'KAPALI'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ÖĞRENCİ YETKİLERİ */}
                <div className="glass-card p-6 border-l-4 border-brand">
                    <h3 className="text-lg font-bold text-ink mb-4 flex items-center">
                        <Users className="mr-2 text-brand" size={22} />
                        Öğrenci Yetkileri
                    </h3>
                    <p className="text-sm text-ink-2 mb-4">Öğrencilerin hangi özellikleri kullanabileceğini belirleyin</p>

                    <div className="grid grid-cols-2 gap-3">
                        <PermissionItem
                            icon={<Brain size={16} />}
                            label="Akıllı Planlayıcı"
                            enabled={settings.studentPermissions.canUseStudyPlanner}
                            onToggle={() => toggleStudentPermission('canUseStudyPlanner')}
                        />
                        <PermissionItem
                            icon={<MessageSquare size={16} />}
                            label="AI Sohbet"
                            enabled={settings.studentPermissions.canUseAIChat}
                            onToggle={() => toggleStudentPermission('canUseAIChat')}
                        />
                        <PermissionItem
                            icon={<BarChart2 size={16} />}
                            label="Analiz Görüntüleme"
                            enabled={settings.studentPermissions.canViewAnalytics}
                            onToggle={() => toggleStudentPermission('canViewAnalytics')}
                        />
                        <PermissionItem
                            icon={<FileText size={16} />}
                            label="Deneme Yükleme"
                            enabled={settings.studentPermissions.canUploadTrials}
                            onToggle={() => toggleStudentPermission('canUploadTrials')}
                        />
                        <PermissionItem
                            icon={<BookOpen size={16} />}
                            label="Envanterler"
                            enabled={settings.studentPermissions.canAccessInventories}
                            onToggle={() => toggleStudentPermission('canAccessInventories')}
                        />
                        <PermissionItem
                            icon={<FileText size={16} />}
                            label="Rapor İndirme"
                            enabled={settings.studentPermissions.canDownloadReports}
                            onToggle={() => toggleStudentPermission('canDownloadReports')}
                        />
                        <PermissionItem
                            icon={<Users size={16} />}
                            label="Profil Düzenleme"
                            enabled={settings.studentPermissions.canEditProfile}
                            onToggle={() => toggleStudentPermission('canEditProfile')}
                        />
                        <PermissionItem
                            icon={<MessageSquare size={16} />}
                            label="Mesajlar"
                            enabled={settings.studentPermissions.canViewMessages}
                            onToggle={() => toggleStudentPermission('canViewMessages')}
                        />
                        <PermissionItem
                            icon={<Calendar size={16} />}
                            label="Görevler"
                            enabled={settings.studentPermissions.canViewTasks}
                            onToggle={() => toggleStudentPermission('canViewTasks')}
                        />
                    </div>
                </div>

                {/* GENEL AYARLAR */}
                <div className="glass-card p-6 border-l-4 border-gray-500">
                    <h3 className="text-lg font-bold text-ink mb-4 flex items-center">
                        <Settings className="mr-2 text-ink-2" size={22} />
                        Genel Ayarlar
                    </h3>

                    <div className="space-y-4">
                        {/* Görünüm: kurumsal renk, ekran zemini, yazı tipi,
                            punto ve canlı önizleme tek panelde. */}
                        <AppearancePanel
                            general={settings.general}
                            degistir={gorunumDegistir}
                            sifirla={gorunumuSifirla}
                        />


                        <div>
                            <label className="block text-sm font-bold text-ink-2 mb-2">Uygulama Adı</label>
                            <input
                                type="text"
                                value={settings.general.appName}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    general: { ...settings.general, appName: e.target.value }
                                })}
                                className="w-full px-4 py-2 border-2 border-line rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-ink-2 mb-2">Koç Başına Max Öğrenci</label>
                            <input
                                type="number"
                                value={settings.general.maxStudentsPerCoach}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    general: { ...settings.general, maxStudentsPerCoach: parseInt(e.target.value) }
                                })}
                                className="w-full px-4 py-2 border-2 border-line rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-ink-2 mb-2">Oturum Zaman Aşımı (Dakika)</label>
                            <input
                                type="number"
                                value={settings.general.sessionTimeout}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    general: { ...settings.general, sessionTimeout: parseInt(e.target.value) }
                                })}
                                className="w-full px-4 py-2 border-2 border-line rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* SINAV TAKVİMİ */}
                <div className="glass-card p-6 border-l-4 border-brand">
                    <h3 className="text-lg font-bold text-ink mb-2 flex items-center">
                        <Calendar className="mr-2 text-brand" size={22} />
                        Sınav Takvimi
                    </h3>
                    <p className="text-sm text-ink-2 mb-4">
                        Her sınav ve yıl için gerçek sınav tarihini girin. Countdown, Öğrenci 360 ve
                        kalan-süre hesapları bu merkezi tarihten okur. Tarih girilmeyen yıl için sistem
                        <strong> yanlış tarih üretmez</strong>, "tanımlanmadı" gösterir.
                    </p>
                    <SinavTakvimiPaneli
                        sinav={settings.sinav || {}}
                        degistir={(s) => setSettings((o) => ({ ...o, sinav: s }))}
                    />
                </div>

                {/* AKADEMİK TAKVİM */}
                <div className="glass-card p-6 border-l-4 border-brand">
                    <h3 className="text-lg font-bold text-ink mb-2 flex items-center">
                        <Calendar className="mr-2 text-brand" size={22} />
                        Takvim (Tatiller &amp; Eğitim-Öğretim)
                    </h3>
                    <p className="text-sm text-ink-2 mb-4">
                        Genel Bakış takviminde görünen dinî bayram ve eğitim-öğretim tarihleri her yıl
                        değişir; resmî tarihler açıklandığında <strong>buradan güncelleyin</strong>.
                        Ulusal bayramlar (23 Nisan, 30 Ağustos, 29 Ekim…) sabittir, düzenlenmez.
                    </p>
                    <TakvimPaneli
                        takvim={settings.takvim || {}}
                        degistir={(t) => setSettings((o) => ({ ...o, takvim: t }))}
                    />
                </div>

                {/* DENEME KAYNAKLARI (OBP & MÜFREDAT) */}
                <div className="glass-card p-6 border-l-4 border-brand">
                    <h3 className="text-lg font-bold text-ink mb-2 flex items-center">
                        <BookOpen className="mr-2 text-brand" size={22} />
                        Deneme Kaynakları (OBP &amp; Müfredat)
                    </h3>
                    <p className="text-sm text-ink-2 mb-4">
                        Diploma notu → OBP dönüşümleri ve müfredat/kaynak (PDF) merkezi. Bunlar her yıl
                        ana koç tarafından güncellenir; artık Denemeler sekmesinde değil <strong>burada</strong> yönetilir.
                    </p>
                    <div className="space-y-6">
                        <OBPManager />
                        <CurriculumManager />
                    </div>
                </div>

                {/* Kurum bilgileri paneli PDR belgeleriyle birlikte arşivlendi. */}
            </div>

            {/* Footer */}
            <div className="bg-surface-2 border-t border-line p-4 shrink-0 flex justify-between items-center">
                <p className="text-xs text-ink-2">
                    💡 Ayarlar tüm kullanıcılar için geçerlidir
                </p>
                <div className="pencere-alt-cubuk bg-surface flex space-x-3">
                    <button onClick={iptalEt} className="b b-line">İptal</button>
                    <button
                        onClick={handleSave}
                        className="b b-fill b-brand"
                    >
                        <Save size={18} className="mr-2" />
                        Kaydet
                    </button>
                </div>
            </div>
        </Modal>
    );
};

/* Küçük tarih/metin girdisi — takvim panelleri ortak stili. */
const girdiSinifi = 'px-2.5 py-1.5 border-2 border-line rounded-lg bg-surface text-sm focus:ring-2 focus:ring-brand focus:border-transparent';

/* ── Sınav Takvimi paneli: sınav + yıl → gerçek tarih ─────────────── */
const SINAVLAR = ['YKS', 'LGS', 'KPSS', 'AGS'];

const SinavTakvimiPaneli = ({ sinav, degistir }) => {
    const buYil = new Date().getFullYear();
    const [seciliSinav, setSeciliSinav] = useState('YKS');
    const [yil, setYil] = useState(String(buYil + 1));
    const [tarih, setTarih] = useState('');

    const kayitlar = SINAVLAR.flatMap(s =>
        Object.keys(sinav[s] || {})
            .sort((a, b) => Number(a) - Number(b))
            .map(y => ({ sinavAdi: s, yil: y, tarih: sinav[s][y] }))
    );

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                <div>
                    <label className="block text-xs font-bold text-ink-2 mb-1">Sınav</label>
                    <select value={seciliSinav} onChange={(e) => setSeciliSinav(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-line rounded-lg bg-surface focus:ring-2 focus:ring-brand">
                        {SINAVLAR.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-ink-2 mb-1">Yıl</label>
                    <input type="number" value={yil} onChange={(e) => setYil(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-line rounded-lg focus:ring-2 focus:ring-brand" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-ink-2 mb-1">Sınav Tarihi</label>
                    <input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-line rounded-lg focus:ring-2 focus:ring-brand" />
                </div>
                <button
                    onClick={() => {
                        const y = parseInt(yil, 10);
                        if (!Number.isFinite(y) || !tarih) return;
                        degistir({ ...sinav, [seciliSinav]: { ...(sinav[seciliSinav] || {}), [y]: tarih } });
                        setTarih('');
                    }}
                    className="b b-fill b-brand h-[42px]"
                >
                    Ekle / Güncelle
                </button>
            </div>
            {kayitlar.length === 0 ? (
                <p className="text-xs text-ink-3">Henüz sınav tarihi tanımlanmadı.</p>
            ) : (
                <div className="divide-y divide-line-subtle border border-line rounded-lg">
                    {kayitlar.map(({ sinavAdi, yil: y, tarih: t }) => (
                        <div key={`${sinavAdi}-${y}`} className="flex items-center justify-between px-3 py-2">
                            <span className="text-sm text-ink">
                                <span className="badge badge-info mr-2">{sinavAdi}</span>
                                <span className="font-bold">{y}</span>
                                <span className="text-ink-2 ml-2">
                                    {new Date(t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            </span>
                            <button
                                onClick={() => {
                                    const kalan = { ...(sinav[sinavAdi] || {}) };
                                    delete kalan[y];
                                    degistir({ ...sinav, [sinavAdi]: kalan });
                                }}
                                className="text-danger text-xs font-bold hover:underline"
                            >
                                Sil
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/* ── Takvim paneli: dinî bayramlar + eğitim-öğretim tarihleri ─────── */
const TakvimPaneli = ({ takvim, degistir }) => {
    const yillar = [...new Set([...Object.keys(DINI_VARSAYILAN), ...Object.keys(takvim?.dini || {})])].sort();
    const donemler = [...new Set([...Object.keys(OGRETIM_VARSAYILAN), ...Object.keys(takvim?.ogretim || {})])].sort();
    const [yil, setYil] = useState(yillar[yillar.length - 1] || '2027');
    const [donem, setDonem] = useState(donemler[donemler.length - 1] || '2026-2027');
    const [yeniYil, setYeniYil] = useState('');
    const [yeniDonem, setYeniDonem] = useState('');

    const diniListe = takvim?.dini?.[yil] ?? DINI_VARSAYILAN[yil] ?? YENI_YIL_SABLONU;
    const ogretimListe = takvim?.ogretim?.[donem] ?? OGRETIM_VARSAYILAN[donem] ?? YENI_DONEM_SABLONU;

    const diniGuncelle = (idx, alan, deger) => {
        const yeni = diniListe.map((k, i) => (i === idx ? { ...k, [alan]: deger, tahmini: false } : k));
        degistir({ ...takvim, dini: { ...(takvim?.dini || {}), [yil]: yeni } });
    };
    const ogretimGuncelle = (idx, alan, deger) => {
        const yeni = ogretimListe.map((k, i) => (i === idx ? { ...k, [alan]: deger, tahmini: false } : k));
        degistir({ ...takvim, ogretim: { ...(takvim?.ogretim || {}), [donem]: yeni } });
    };

    const Satir = ({ kayit, idx, guncelle }) => (
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-center">
            <span className="text-sm text-ink-2 truncate">{kayit.ad}{kayit.tahmini ? ' · tahmini' : ''}</span>
            <input type="date" value={kayit.bas || ''} onChange={(e) => guncelle(idx, 'bas', e.target.value)}
                className={girdiSinifi} aria-label={`${kayit.ad} başlangıç`} />
            <input type="date" value={kayit.son || ''} onChange={(e) => guncelle(idx, 'son', e.target.value)}
                className={girdiSinifi} aria-label={`${kayit.ad} bitiş`} />
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-ink">Dinî Bayramlar</h4>
                        <select value={yil} onChange={(e) => setYil(e.target.value)} className={girdiSinifi} aria-label="Yıl seç">
                            {yillar.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <button type="button"
                        onClick={() => {
                            const dini = { ...(takvim?.dini || {}) };
                            delete dini[yil];
                            degistir({ ...takvim, dini });
                        }}
                        className="text-xs text-ink-2 hover:text-ink hover:underline">
                        Varsayılana dön
                    </button>
                </div>
                <div className="space-y-2">
                    {diniListe.map((k, i) => <Satir key={k.ad} kayit={k} idx={i} guncelle={diniGuncelle} />)}
                </div>
                <div className="flex items-center gap-2 mt-3">
                    <input type="number" placeholder="Yeni yıl (örn. 2028)" value={yeniYil}
                        onChange={(e) => setYeniYil(e.target.value)} className={`${girdiSinifi} w-44`} />
                    <button type="button"
                        onClick={() => {
                            const y = String(yeniYil).trim();
                            if (!/^\d{4}$/.test(y)) return;
                            degistir({ ...takvim, dini: { ...(takvim?.dini || {}), [y]: YENI_YIL_SABLONU.map(k => ({ ...k })) } });
                            setYil(y);
                            setYeniYil('');
                        }}
                        className="b b-line text-xs px-3 py-1.5">
                        + Yıl ekle
                    </button>
                </div>
            </div>

            <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-ink">Eğitim-Öğretim Takvimi</h4>
                        <select value={donem} onChange={(e) => setDonem(e.target.value)} className={girdiSinifi} aria-label="Dönem seç">
                            {donemler.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <button type="button"
                        onClick={() => {
                            const ogretim = { ...(takvim?.ogretim || {}) };
                            delete ogretim[donem];
                            degistir({ ...takvim, ogretim });
                        }}
                        className="text-xs text-ink-2 hover:text-ink hover:underline">
                        Varsayılana dön
                    </button>
                </div>
                <div className="space-y-2">
                    {ogretimListe.map((k, i) => <Satir key={k.ad} kayit={k} idx={i} guncelle={ogretimGuncelle} />)}
                </div>
                <div className="flex items-center gap-2 mt-3">
                    <input type="text" placeholder="Yeni dönem (örn. 2027-2028)" value={yeniDonem}
                        onChange={(e) => setYeniDonem(e.target.value)} className={`${girdiSinifi} w-52`} />
                    <button type="button"
                        onClick={() => {
                            const d = String(yeniDonem).trim();
                            if (!/^\d{4}-\d{4}$/.test(d)) return;
                            degistir({ ...takvim, ogretim: { ...(takvim?.ogretim || {}), [d]: YENI_DONEM_SABLONU.map(k => ({ ...k })) } });
                            setDonem(d);
                            setYeniDonem('');
                        }}
                        className="b b-line text-xs px-3 py-1.5">
                        + Dönem ekle
                    </button>
                </div>
            </div>
        </div>
    );
};

// Permission Item Component
const PermissionItem = ({ icon, label, enabled, onToggle }) => (
    <div
        onClick={onToggle}
        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${enabled
                ? 'bg-ok-soft border-2 border-ok'
                : 'bg-danger-soft border-2 border-danger'
            }`}
    >
        <div className="flex items-center space-x-2">
            <div className={enabled ? 'text-ok' : 'text-danger'}>
                {icon}
            </div>
            <span className={`text-sm font-bold ${enabled ? 'text-ok' : 'text-danger'}`}>
                {label}
            </span>
        </div>
        <div className={`text-xs font-bold px-2 py-1 rounded ${enabled
                ? 'bg-green-200 text-ok'
                : 'bg-red-200 text-danger'
            }`}>
            {enabled ? '✓ AKTİF' : '✗ KAPALI'}
        </div>
    </div>
);

export default SettingsModal;
