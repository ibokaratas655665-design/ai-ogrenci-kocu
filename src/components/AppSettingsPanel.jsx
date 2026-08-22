import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Settings, Save, Users, CheckSquare, BookOpen, Calendar, FileText, Brain, ClipboardList } from 'lucide-react';
import { bildir } from '../services/uiGeriBildirim';

export default function AppSettingsPanel() {
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState(null);
    const [coaches, setCoaches] = useState([]);
    const [modulePermissions, setModulePermissions] = useState({});
    const [students, setStudents] = useState([]);
    const [studentApprovals, setStudentApprovals] = useState({});

    // 'bep' ve 'guidance' modülleri PDR ile birlikte arşivlendi.
    const modules = [
        { id: 'tests', name: 'Testler & Envanterler', icon: ClipboardList },
        { id: 'planner', name: 'Çalışma Planlayıcı', icon: Calendar },
        { id: 'exams', name: 'Deneme Sınavları', icon: Brain }
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const appSettings = await api.admin.getAppSettings();
        const activeCoaches = await api.admin.getActiveCoaches();
        const permissions = await api.admin.getModulePermissions();
        const allStudents = await api.admin.getAllStudents();
        const approvals = await api.admin.getAllStudentApprovals();

        setSettings(appSettings);
        setCoaches(activeCoaches);
        setModulePermissions(permissions);
        setStudents(allStudents);
        setStudentApprovals(approvals);
        setLoading(false);
    };

    const toggleModulePermission = async (moduleId, coachId) => {
        const currentPermissions = modulePermissions[moduleId]?.coaches || [];
        const enabled = !currentPermissions.includes(coachId);

        await api.admin.setModulePermission(moduleId, coachId, enabled);
        await loadData();
    };

    const toggleStudentFeature = async (studentId, feature) => {
        const currentApproval = studentApprovals[studentId]?.[feature] || false;
        await api.admin.setStudentFeatureApproval(studentId, feature, !currentApproval);
        await loadData();
    };

    const saveSettings = async () => {
        await api.admin.saveAppSettings(settings);
        bildir('Ayarlar kaydedildi!', 'basari');
    };

    if (loading) {
        return <div className="p-8 text-center">Yükleniyor...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-ink flex items-center gap-3">
                    <Settings size={32} className="text-brand" />
                    Uygulama Ayarları
                </h1>
                <button
                    onClick={saveSettings}
                    className="flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors shadow-sm font-medium"
                >
                    <Save size={20} />
                    Kaydet
                </button>
            </div>

            {/* Modül Bazlı Koç Atamaları */}
            <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
                <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
                    <Users size={24} />
                    Modül Bazlı Koç Yetkilendirme
                </h2>
                <p className="text-ink-2 mb-6">
                    Her özellik için hangi koçların erişim yetkisi olacağını belirleyin.
                </p>

                <div className="space-y-6">
                    {modules.map(module => {
                        const Icon = module.icon;
                        const assignedCoaches = modulePermissions[module.id]?.coaches || [];

                        return (
                            <div key={module.id} className="border border-line rounded-lg p-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <Icon size={20} className="text-brand" />
                                    <h3 className="font-semibold text-ink">{module.name}</h3>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {coaches.map(coach => {
                                        const isAssigned = assignedCoaches.includes(coach.id);
                                        return (
                                            <button
                                                key={coach.id}
                                                onClick={() => toggleModulePermission(module.id, coach.id)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${isAssigned
                                                        ? 'bg-brand-soft border-brand-line text-brand'
                                                        : 'bg-surface-2 border-line-2 text-ink-2 hover:bg-surface-3'
                                                    }`}
                                            >
                                                <CheckSquare size={16} className={isAssigned ? 'fill-current' : ''} />
                                                {coach.name}
                                            </button>
                                        );
                                    })}
                                    {coaches.length === 0 && (
                                        <p className="text-ink-2 text-sm col-span-full">
                                            Henüz onaylı koç yok.
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Öğrenci Özellik Onayları */}
            <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
                <h2 className="text-xl font-bold text-ink mb-4">
                    Öğrenci Özellik Onayları
                </h2>
                <p className="text-ink-2 mb-6">
                    Her öğrenci için hangi özelliklere erişim izni vereceğinizi belirleyin.
                </p>

                <div className="space-y-4">
                    {students.map(student => (
                        <div key={student.id} className="border border-line rounded-lg p-4">
                            <h3 className="font-semibold text-ink mb-3">
                                {student.name} - {student.schoolNumber || student.email}
                            </h3>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                                {modules.map(module => {
                                    const isApproved = studentApprovals[student.id]?.[module.id] || false;
                                    const Icon = module.icon;

                                    return (
                                        <button
                                            key={module.id}
                                            onClick={() => toggleStudentFeature(student.id, module.id)}
                                            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border text-xs transition-all ${isApproved
                                                    ? 'bg-ok-soft border-ok text-ok'
                                                    : 'bg-surface-2 border-line-2 text-ink-2 hover:bg-surface-3'
                                                }`}
                                        >
                                            <Icon size={16} />
                                            <span className="text-center leading-tight">
                                                {module.name.split(' ')[0]}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    {students.length === 0 && (
                        <p className="text-ink-2 text-center py-4">
                            Henüz kayıtlı öğrenci yok.
                        </p>
                    )}
                </div>
            </div>

            {/* Genel Ayarlar */}
            <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
                <h2 className="text-xl font-bold text-ink mb-4">
                    Genel Ayarlar
                </h2>

                <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-surface-2 rounded-lg cursor-pointer">
                        <div>
                            <p className="font-semibold text-ink">Öğrenci Özellik Onayı Zorunlu</p>
                            <p className="text-sm text-ink-2">
                                Öğrencilerin özelliklere erişimi için onay gereksin
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings?.requireStudentApproval || false}
                            onChange={(e) => setSettings({ ...settings, requireStudentApproval: e.target.checked })}
                            className="w-5 h-5 text-brand rounded"
                        />
                    </label>
                </div>
            </div>
        </div>
    );
}
