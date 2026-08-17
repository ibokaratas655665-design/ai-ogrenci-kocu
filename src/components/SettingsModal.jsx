import React, { useState, useEffect } from 'react';
import { X, Save, Settings, Shield, Users, Lock, Unlock, BookOpen, FileText, Calendar, Target, MessageSquare, BarChart2, Brain, Palette } from 'lucide-react';
import AppearancePanel from './settings/AppearancePanel';
import InstitutionPanel from './settings/InstitutionPanel';

/** Varsayılanlar — styles/theme.css ile aynı değerler. */
const DEFAULT_BRAND = '#1E3A8A';
const DEFAULT_ACCENT = '#0F766E';
const DEFAULT_BG = '#F7F9FC';

const gecerliHex = (v) => (typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(v).trim()));

/** Kaydedilmiş bozuk değerleri temizleyip geçerli hex'e düşürür. */
const hexVeya = (v, yedek) => (gecerliHex(v) ? String(v).trim() : yedek);

const SettingsModal = ({ onClose }) => {
    // Kurum paneli kendi kaydını yapar; buradaki mesaj sadece geri bildirim
    const [kurumMesaji, setKurumMesaji] = useState(null);
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
        }
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
            kayit = JSON.parse(localStorage.getItem('app_settings') || 'null');
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
        <div className="fixed inset-0 z-settings bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
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
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                                icon={<Target size={16} />}
                                label="Rehberlik Servisi"
                                enabled={settings.studentPermissions.canViewGuidance}
                                onToggle={() => toggleStudentPermission('canViewGuidance')}
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

                    {/* KURUM BİLGİLERİ — PDR belgelerinin resmî başlığı */}
                    <div className="glass-card p-6 border-l-4 border-brand">
                        <InstitutionPanel setToast={(m) => setKurumMesaji(m)} />
                        {kurumMesaji && (
                            <p className="mt-3 text-xs font-bold text-ok">{kurumMesaji}</p>
                        )}
                    </div>
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
