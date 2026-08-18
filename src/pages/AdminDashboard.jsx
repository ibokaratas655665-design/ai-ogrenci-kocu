import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AppSettingsPanel from '../components/AppSettingsPanel';
import {
    Users, CheckCircle, Lock, Unlock, LogOut,
    ShieldAlert, Settings, UserPlus, Phone, School,
    Trash2, RefreshCw, AlertCircle, X, AlertTriangle, Mail,
    Edit2, Shield, Save
} from 'lucide-react';
import firebaseSync from '../services/firebaseSync';
import { bildir } from '../services/uiGeriBildirim';
import { DataTable, Badge, Button, Avatar } from '../components/ui';
import Modal from '../components/ui/Modal';

// ── Onay Dialogu ─────────────────────────────────────────────
const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
    <Modal
        acik
        onClose={onCancel}
        baslikGizle
        genislik="sm"
        govdeClassName="p-6"
    >
        <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-danger-soft rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-danger" />
            </div>
            <p className="text-ink font-medium">{message}</p>
        </div>
        <div className="pencere-alt-cubuk bg-surface flex gap-3 mt-5">
            <button onClick={onCancel} className="flex-1 py-2.5 border border-line rounded-xl text-ink-2 font-semibold hover:bg-surface-2 transition text-sm">İptal</button>
            <button onClick={onConfirm} className="flex-1 py-2.5 bg-danger text-white rounded-xl font-semibold hover:bg-danger transition text-sm flex items-center justify-center gap-2">
                <Trash2 size={14} /> Evet, Sil
            </button>
        </div>
    </Modal>
);

// ── Kullanıcı Düzenleme Modalı ────────────────────────────────
const EditUserModal = ({ user, onClose, onSave }) => {
    const [form, setForm] = useState({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        schoolName: user.schoolName || '',
        coachRole: user.coachRole || 'subCoach',
    });
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);

    const isCoach = user.role === 'coach' || user.role === 'admin';

    const set = (field, val) => {
        setForm(p => ({ ...p, [field]: val }));
        setDirty(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { bildir('Ad Soyad zorunludur.'); return; }
        setSaving(true);
        await onSave(user, form);
        setSaving(false);
    };

    return (
        <Modal
            acik
            onClose={onClose}
            baslikGizle
            genislik="md"
            govdeClassName="p-0 flex flex-col overflow-hidden"
        >

            {/* Header */}
            <div className={`shrink-0 px-6 py-5 flex items-center justify-between ${isCoach ? 'bg-gradient-to-r from-brand to-violet-600' : 'bg-gradient-to-r from-blue-500 to-cyan-600'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-surface/20 flex items-center justify-center text-ink font-bold text-lg">
                        {(form.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="text-ink font-bold text-base leading-tight">{user.name || 'Kullanıcı'}</h3>
                        <span className="text-ink-2 text-xs">{isCoach ? 'Koç hesabı' : 'Öğrenci hesabı'}</span>
                    </div>
                </div>
                <button onClick={onClose} className="text-ink-2 hover:text-ink transition"><X size={20} /></button>
            </div>

            {/* Form */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
                {/* Ad Soyad */}
                <div>
                    <label className="block text-xs font-bold text-ink-2 uppercase tracking-wider mb-1.5">Ad Soyad *</label>
                    <input
                        type="text" value={form.name}
                        onChange={e => set('name', e.target.value)}
                        className="w-full px-4 py-2.5 border border-line rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
                        placeholder="Ad Soyad"
                    />
                </div>

                {/* Telefon */}
                <div>
                    <label className="block text-xs font-bold text-ink-2 uppercase tracking-wider mb-1.5">
                        <Phone size={11} className="inline mr-1" /> Telefon
                    </label>
                    <input
                        type="tel" value={form.phone}
                        onChange={e => set('phone', e.target.value)}
                        className="w-full px-4 py-2.5 border border-line rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
                        placeholder="05XX XXX XX XX"
                    />
                </div>

                {/* E-posta */}
                <div>
                    <label className="block text-xs font-bold text-ink-2 uppercase tracking-wider mb-1.5">
                        <Mail size={11} className="inline mr-1" /> E-posta
                    </label>
                    <input
                        type="email" value={form.email}
                        onChange={e => set('email', e.target.value)}
                        className="w-full px-4 py-2.5 border border-line rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
                        placeholder="ornek@mail.com"
                    />
                </div>

                {/* Okul */}
                <div>
                    <label className="block text-xs font-bold text-ink-2 uppercase tracking-wider mb-1.5">
                        <School size={11} className="inline mr-1" /> Okul
                    </label>
                    <input
                        type="text" value={form.schoolName}
                        onChange={e => set('schoolName', e.target.value)}
                        className="w-full px-4 py-2.5 border border-line rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
                        placeholder="Okul adı"
                    />
                </div>

                {/* Koç ise: Rol seçimi */}
                {isCoach && (
                    <div className="bg-brand-soft border border-brand-line rounded-xl p-4">
                        <label className="block text-xs font-bold text-brand uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Shield size={12} /> Koç Yetki Rolü
                        </label>
                        <div className="flex gap-2">
                            <label className={`flex-1 flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition text-sm font-medium ${form.coachRole !== 'masterCoach' ? 'bg-info-soft border-blue-400 text-info' : 'bg-surface border-line text-ink-2 hover:bg-surface-2'}`}>
                                <input
                                    type="radio" name="coachRole" value="subCoach"
                                    checked={form.coachRole !== 'masterCoach'}
                                    onChange={() => set('coachRole', 'subCoach')}
                                    className="accent-blue-600"
                                />
                                Standart Koç
                            </label>
                            <label className={`flex-1 flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition text-sm font-medium ${form.coachRole === 'masterCoach' ? 'bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] border-purple-400 text-c4' : 'bg-surface border-line text-ink-2 hover:bg-surface-2'}`}>
                                <input
                                    type="radio" name="coachRole" value="masterCoach"
                                    checked={form.coachRole === 'masterCoach'}
                                    onChange={() => set('coachRole', 'masterCoach')}
                                    className="accent-purple-600"
                                />
                                Yönetici Koç
                            </label>
                        </div>
                        <p className="text-xs text-brand mt-2">
                            {form.coachRole === 'masterCoach'
                                ? '★ Yönetici koç tüm sekmelere ve özelliklere tam erişim sağlar.'
                                : 'Standart koç sadece atanan sekmelere erişebilir.'}
                        </p>
                    </div>
                )}

                {/* Kayıt tarihi */}
                {user.createdAt && (
                    <p className="text-xs text-ink-3">
                        Kayıt: {new Date(user.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                )}

                {/* Butonlar */}
                <div className="pencere-alt-cubuk bg-surface flex gap-3 pt-1">
                    <button onClick={onClose} className="flex-1 border border-line text-ink-2 py-2.5 rounded-xl font-semibold hover:bg-surface-2 transition text-sm">
                        İptal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!dirty || saving}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition text-sm ${dirty && !saving ? 'bg-gradient-to-r from-brand to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-lg' : 'bg-surface-3 text-ink-3 cursor-not-allowed'}`}
                    >
                        {saving
                            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <><Save size={14} /> Kaydet</>
                        }
                    </button>
                </div>
            </div>
        </Modal>
    );
};

// ── Koç Ekle Modal ───────────────────────────────────────────
const AddCoachModal = ({ onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [schoolName, setSchoolName] = useState('Şamran Anadolu Lisesi');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAdd = async () => {
        if (!name.trim() || !phone.trim()) {
            setError('Ad Soyad ve Telefon zorunludur.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const localUsers = JSON.parse(localStorage.getItem('users_db') || '[]');
            if (localUsers.some(u => u.phone === phone.trim())) {
                setError('Bu telefon numarası zaten kayıtlı.');
                setLoading(false);
                return;
            }

            const newCoach = {
                id: `coach_${Date.now()}`,
                name: name.trim(),
                phone: phone.trim(),
                email: email.trim() || '',
                schoolName: schoolName.trim(),
                role: 'coach',
                coachRole: 'subCoach',
                approved: true,
                createdAt: new Date().toISOString(),
            };

            localUsers.push(newCoach);
            localStorage.setItem('users_db', JSON.stringify(localUsers));

            if (email.trim()) {
                localStorage.setItem(`coach_email_${phone.trim()}`, email.trim());
            }

            onSuccess(`${name.trim()} basariyla eklendi!`);
            onClose();
        } catch (err) {
            console.error('Koç ekleme hatası:', err);
            setError('Koç eklenirken hata oluştu: ' + (err?.message || ''));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            acik
            onClose={onClose}
            baslikGizle
            genislik="md"
            govdeClassName="p-6"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-ink flex items-center gap-2">
                    <UserPlus size={20} className="text-brand" />
                    Yeni Koç Ekle
                </h3>
                <button onClick={onClose} className="text-ink-3 hover:text-ink-2 p-1">
                    <X size={20} />
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-ink-2 uppercase tracking-wider block mb-1">Ad Soyad *</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                        className="w-full px-4 py-3 border border-line rounded-xl focus:ring-2 focus:ring-brand focus:outline-none"
                        placeholder="Mehmet Öz" autoFocus />
                </div>

                <div>
                    <label className="text-xs font-bold text-ink-2 uppercase tracking-wider block mb-1">Telefon *</label>
                    <div className="relative">
                        <Phone size={16} className="absolute left-3 top-3.5 text-ink-3" />
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                            className="w-full pl-9 pr-4 py-3 border border-line rounded-xl focus:ring-2 focus:ring-brand focus:outline-none"
                            placeholder="05XX XXX XX XX" />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-ink-2 uppercase tracking-wider block mb-1">
                        E-posta <span className="text-brand font-normal normal-case">(Magic Link icin)</span>
                    </label>
                    <div className="relative">
                        <Mail size={16} className="absolute left-3 top-3.5 text-ink-3" />
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                            className="w-full pl-9 pr-4 py-3 border border-line rounded-xl focus:ring-2 focus:ring-brand focus:outline-none"
                            placeholder="ornek@gmail.com" />
                    </div>
                    <p className="text-xs text-ink-3 mt-1">Koc bu e-postaya guvenli giris linki alacak.</p>
                </div>

                <div>
                    <label className="text-xs font-bold text-ink-2 uppercase tracking-wider block mb-1">Okul Adi</label>
                    <div className="relative">
                        <School size={16} className="absolute left-3 top-3.5 text-ink-3" />
                        <input type="text" value={schoolName} onChange={e => setSchoolName(e.target.value)}
                            className="w-full pl-9 pr-4 py-3 border border-line rounded-xl focus:ring-2 focus:ring-brand focus:outline-none" />
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-danger text-sm bg-danger-soft p-3 rounded-lg">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            <div className="flex gap-3 mt-6">
                <button onClick={onClose}
                    className="flex-1 py-3 border border-line rounded-xl text-ink-2 font-semibold hover:bg-surface-2 transition">
                    Iptal
                </button>
                <button onClick={handleAdd} disabled={loading}
                    className="flex-1 py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-hover transition disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading
                        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <><UserPlus size={16} /> Koc Ekle</>
                    }
                </button>
            </div>
        </Modal>
    );
};

// ── Ana AdminDashboard ───────────────────────────────────────
export default function AdminDashboard() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('pending');
    const [pendingUsers, setPendingUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [systemLocked, setSystemLocked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showAddCoach, setShowAddCoach] = useState(false);
    const [toast, setToast] = useState('');
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => { loadData(); }, [activeTab]);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'pending') {
                const pending = await api.admin.getPendingUsers();
                const seen = new Set(pending.map(u => u.phone || u.id || u.uid));

                try {
                    // Firebase'den de beklemede olanları getir
                    const fbPending = await firebaseSync.db.queryDocuments('users', 'approved', '==', false);
                    if (fbPending.success && Array.isArray(fbPending.data)) {
                        fbPending.data.forEach(fu => {
                            const key = fu.phone || fu.id || fu.uid;
                            if (key && !seen.has(key)) {
                                pending.push(fu);
                                seen.add(key);
                            }
                        });
                    }
                } catch (e) { }

                setPendingUsers(pending || []);
            } else if (activeTab === 'users') {
                const localUsers = JSON.parse(localStorage.getItem('users_db') || '[]');
                const coachStudents = JSON.parse(localStorage.getItem('coach_students') || '[]');

                const coaches = localUsers.filter(u => u.role === 'coach' || u.role === 'admin');
                const students = coachStudents.map((s, i) => ({
                    ...s,
                    id: s.id || `student_idx_${i}`,
                    role: s.role || 'student',
                }));

                const seen = new Set();
                const merged = [...coaches, ...students].filter(u => {
                    const key = u.phone || u.id || u.name;
                    if (!key || seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });

                try {
                    const fbUsers = await api.admin.getAllUsers();
                    if (Array.isArray(fbUsers)) {
                        let newFromFb = false;
                        fbUsers.forEach(fu => {
                            const key = fu.phone || fu.id || fu.name;
                            if (key && !seen.has(key)) {
                                seen.add(key);
                                merged.push(fu);
                                // Firebase'den gelen yeni kullanıcıyı localStorage'a da ekle
                                localUsers.push(fu);
                                newFromFb = true;
                            }
                        });
                        // Eğer Firebase'den yeni kullanıcı eklendiyse localStorage'ı güncelle
                        if (newFromFb) {
                            localStorage.setItem('users_db', JSON.stringify(localUsers));
                        }
                    }
                } catch (e) { /* Firebase erişilemiyorsa localStorage yeterli */ }

                setAllUsers(merged);
            }
        } catch (err) {
            console.error('loadData hatası:', err);
        }

        const lockStatus = api.admin.getSystemLockStatus();
        setSystemLocked(lockStatus);
        setLoading(false);
    };

    const handleApprove = async (userId) => {
        const success = await api.admin.approveUser(userId);
        if (success) { showToast('Kullanici onaylandi!'); loadData(); }
    };

    const handleDelete = (user) => {
        setConfirmDialog({
            message: `"${user.name}" adli kullanicıyı silmek istediginize emin misiniz?`,
            user
        });
    };

    const confirmDelete = async () => {
        const user = confirmDialog?.user;
        if (!user) return;
        setConfirmDialog(null);

        const localUsers = JSON.parse(localStorage.getItem('users_db') || '[]');
        const filtered = localUsers.filter(u =>
            u.id !== user.id && u.phone !== user.phone
        );
        localStorage.setItem('users_db', JSON.stringify(filtered));

        const coachStudents = JSON.parse(localStorage.getItem('coach_students') || '[]');
        const filteredStudents = coachStudents.filter(s =>
            s.id !== user.id && s.name !== user.name
        );
        localStorage.setItem('coach_students', JSON.stringify(filteredStudents));

        try {
            if (user.id) await api.admin.deleteUser(user.id);
        } catch (e) { /* ignore */ }

        showToast('Kullanici silindi.');
        loadData();
    };

    const handleSaveUser = async (originalUser, updatedFields) => {
        try {
            // ── users_db güncelle ──
            const localUsers = JSON.parse(localStorage.getItem('users_db') || '[]');
            let foundInLocal = false;
            const updatedLocal = localUsers.map(u => {
                const match = u.id === originalUser.id || (u.phone && u.phone === originalUser.phone);
                if (!match) return u;
                foundInLocal = true;
                return { ...u, ...updatedFields };
            });
            if (!foundInLocal) {
                updatedLocal.push({ ...originalUser, ...updatedFields });
            }
            localStorage.setItem('users_db', JSON.stringify(updatedLocal));
            // → Firebase'e de yaz (sayfa yenilenmesi sorununun çözümü)
            try { await firebaseSync.writeKeyToFirebase('users_db'); } catch (_) { }

            // ── E-posta magic link kaydını güncelle ──
            const targetPhone = updatedFields.phone || originalUser.phone;
            if (updatedFields.email && targetPhone) {
                localStorage.setItem(`coach_email_${targetPhone}`, updatedFields.email);
            }

            // ── coach_students güncelle ──
            const coachStudents = JSON.parse(localStorage.getItem('coach_students') || '[]');
            let foundInStudents = false;
            const updatedStudents = coachStudents.map(s => {
                const match = s.id === originalUser.id || s.name === originalUser.name;
                if (!match) return s;
                foundInStudents = true;
                return { ...s, ...updatedFields };
            });
            if (!foundInStudents && (originalUser.role === 'student' || !originalUser.role)) {
                updatedStudents.push({ ...originalUser, ...updatedFields });
            }
            localStorage.setItem('coach_students', JSON.stringify(updatedStudents));
            // → Firebase'e de yaz
            try { await firebaseSync.writeKeyToFirebase('coach_students'); } catch (_) { }

            setEditingUser(null);
            showToast(`${updatedFields.name || originalUser.name} güncellendi!`);
            loadData();
        } catch (err) {
            console.error('Kullanıcı güncelleme hatası:', err);
            showToast('Güncelleme sırasında hata oluştu.');
        }
    };

    const toggleSystemLock = async () => {
        if (systemLocked) {
            await api.admin.stopSystemLock();
            setSystemLocked(false);
            showToast('Sistem kilidi kaldirildi.');
        } else {
            await api.admin.startSystemLock();
            setSystemLocked(true);
            showToast('Sistem kilitlendi.');
        }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <div className="min-h-screen bg-surface-2 flex">
            {/* ── Sidebar ── */}
            {/* Koyu zeminli kenar çubuğunda metin `text-ink` (koyu) idi ve
                okunmuyordu; `on-color` bu bağlamda açık metin verir. */}
            <div className="on-color w-64 bg-indigo-900 flex flex-col shrink-0 sticky top-0 h-screen">
                <div className="p-6 flex-1 overflow-y-auto">
                    <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                        <ShieldAlert size={28} />
                        Yönetici
                    </h2>
                    <div className="mb-6 px-4">
                        <button onClick={() => navigate('/coach/dashboard')}
                            className="w-full flex items-center gap-2 px-3 py-2 bg-brand/30 hover:bg-brand/50 rounded-lg text-xs font-bold transition">
                            <Users size={14} /> Koç Paneline Git
                        </button>
                    </div>
                    <nav className="space-y-2">
                        {[
                            { key: 'pending', icon: <CheckCircle size={20} />, label: 'Onay Bekleyenler', badge: pendingUsers.length },
                            { key: 'users', icon: <Users size={20} />, label: 'Kullanıcılar' },
                            { key: 'lock', icon: systemLocked ? <Lock size={20} /> : <Unlock size={20} />, label: 'Sistem Kilidi' },
                            { key: 'settings', icon: <Settings size={20} />, label: 'Uygulama Ayarları' },
                        ].map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === tab.key ? 'bg-brand-hover' : 'hover:bg-indigo-800'}`}>
                                {tab.icon}
                                {tab.label}
                                {tab.badge > 0 && (
                                    <span className="ml-auto bg-danger text-xs px-2 py-0.5 rounded-full">{tab.badge}</span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="p-4 border-t border-indigo-700">
                    <button onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-danger hover:bg-danger text-white rounded-xl transition font-bold">
                        <LogOut size={18} />
                        Çıkış Yap
                    </button>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="flex-1 p-8 overflow-y-auto">

                {/* Toast */}
                {toast && (
                    <div className="fixed top-5 right-5 bg-brand-hover text-white px-5 py-3 rounded-xl shadow-xl z-[100] font-medium animate-fade-in">
                        {toast}
                    </div>
                )}

                {/* Onay Bekleyenler */}
                {activeTab === 'pending' && (
                    <div>
                        <h1 className="text-2xl font-bold text-ink mb-6">Onay Bekleyen Kayıtlar</h1>
                        {loading ? <p className="text-ink-2">Yukleniyor...</p>
                            : pendingUsers.length === 0 ? (
                                <div className="bg-surface p-8 rounded-xl shadow-sm text-center text-ink-2">
                                    <CheckCircle size={48} className="mx-auto mb-4 text-ok" />
                                    <p>Bekleyen onay isteği yok. Her şey yolunda!</p>
                                </div>
                            ) : pendingUsers.map(user => (
                                <div key={user.id || user.phone} className="bg-surface p-6 rounded-xl shadow-sm border border-line flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-semibold text-lg">{user.name}</h3>
                                        <p className="text-ink-2">{user.phone || user.email}</p>
                                        <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-surface-3 text-ink-2">
                                            {user.role === 'student' ? 'Ogrenci' : 'Koc'}
                                        </span>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => handleDelete(user)} className="px-4 py-2 text-danger hover:bg-danger-soft rounded-lg transition font-medium text-sm">Reddet</button>
                                        <button onClick={() => handleApprove(user.id)} className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition font-medium text-sm">Onayla</button>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                )}

                {/* Kullanıcılar */}
                {activeTab === 'users' && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-ink">Kullanici Yonetimi</h1>
                                <p className="text-sm text-ink-3 mt-0.5">Satıra tıklayarak düzenleyebilirsiniz</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={loadData}
                                    className="flex items-center gap-2 px-4 py-2 border border-line rounded-xl text-ink-2 hover:bg-surface-2 transition text-sm font-medium">
                                    <RefreshCw size={15} /> Yenile
                                </button>
                                <button onClick={() => setShowAddCoach(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl hover:bg-brand-hover transition text-sm font-bold shadow-sm">
                                    <UserPlus size={15} /> Koc Ekle
                                </button>
                            </div>
                        </div>

                        {loading ? <p className="text-ink-2">Yukleniyor...</p> : (
                            <div className="bg-surface rounded-xl shadow-sm border border-line overflow-hidden">
                                {/* Ortak veri tablosu: arama, sıralama ve sayfalama hazır gelir.
                                    Bu tabloda hiç duyarlı davranış yoktu — beş sütun telefonda
                                    yatay kayıyor, kaydırınca başlık satırı kayboluyordu.
                                    DataTable dar ekranda kart listesine geçer. */}
                                <DataTable
                                    sutunlar={[
                                        {
                                            anahtar: 'name', baslik: 'İsim',
                                            bicim: (u) => (
                                                <span className="flex items-center gap-2.5">
                                                    <Avatar ad={u.name || '?'} boyut="sm" />
                                                    <span className="font-semibold text-ink truncate">{u.name || '—'}</span>
                                                </span>
                                            ),
                                        },
                                        { anahtar: 'phone', baslik: 'Telefon', bicim: (u) => u.phone || '—' },
                                        { anahtar: 'email', baslik: 'E-posta', bicim: (u) => u.email || '—' },
                                        {
                                            anahtar: 'role', baslik: 'Rol',
                                            bicim: (u) => (
                                                <span className="flex flex-wrap gap-1">
                                                    <Badge ton={u.role === 'student' ? 'bilgi' : 'marka'} boyut="sm">
                                                        {u.role === 'student' ? 'Öğrenci' : 'Koç'}
                                                    </Badge>
                                                    {(u.role === 'coach' || u.role === 'admin') && u.coachRole === 'masterCoach' && (
                                                        <Badge ton="uyari" boyut="sm">Yönetici</Badge>
                                                    )}
                                                </span>
                                            ),
                                        },
                                        {
                                            anahtar: 'islem', baslik: 'İşlem', hizala: 'sag', siralanabilir: false, mobilGizle: true,
                                            bicim: (u) => (
                                                <span className="inline-flex justify-end items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <Button varyant="outline" boyut="sm" simge={Edit2}
                                                        onClick={(e) => { e.stopPropagation(); setEditingUser(u); }}>Düzenle</Button>
                                                    <Button varyant="ghost" boyut="sm" simge={Trash2}
                                                        className="text-danger hover:bg-danger-soft"
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(u); }}>Sil</Button>
                                                </span>
                                            ),
                                        },
                                    ]}
                                    satirlar={allUsers}
                                    anahtarAlan="id"
                                    aramaAlanlari={['name', 'phone', 'email']}
                                    aramaIpucu="İsim, telefon veya e-posta ara…"
                                    sayfaBoyutu={20}
                                    onSatirTikla={(u) => setEditingUser(u)}
                                    bosBaslik="Kullanıcı yok"
                                    bosAciklama="Koç ekleyerek başlayabilirsiniz."
                                />
                                <div className="px-6 py-3 bg-surface-2 border-t border-line text-xs text-ink-3">
                                    Toplam {allUsers.length} kullanici • Düzenlemek için satıra tıklayın
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Sistem Kilidi */}
                {activeTab === 'lock' && (
                    <div>
                        <h1 className="text-2xl font-bold text-ink mb-6">Sistem Kilidi</h1>
                        <div className="bg-surface p-8 rounded-xl shadow-sm border border-line max-w-2xl">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-ink mb-2 flex items-center gap-2">
                                        {systemLocked ? <Lock className="text-danger" /> : <Unlock className="text-ok" />}
                                        Sistem Kilidi
                                    </h3>
                                    <p className="text-ink-2 leading-relaxed">
                                        Sistem kilitlendiğinde, <strong>Yönetici (Siz) hariç</strong> hiç kimse sisteme giriş yapamaz.
                                        Bakim yapmak istediginizde kullanin.
                                    </p>
                                </div>
                                <button onClick={toggleSystemLock}
                                    className={`ml-4 relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${systemLocked ? 'bg-danger' : 'bg-surface-3'}`}>
                                    <span className={`inline-block h-6 w-6 transform rounded-full bg-surface transition-transform ${systemLocked ? 'translate-x-7' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            {systemLocked && (
                                <div className="mt-6 p-4 bg-danger-soft text-danger rounded-lg text-sm border border-danger">
                                    Sistem su an kilitli. Ogrenciler ve Koclar giris yapamaz.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Uygulama Ayarları */}
                {activeTab === 'settings' && <AppSettingsPanel />}
            </div>

            {/* Onay Dialogu */}
            {confirmDialog && (
                <ConfirmDialog
                    message={confirmDialog.message}
                    onConfirm={confirmDelete}
                    onCancel={() => setConfirmDialog(null)}
                />
            )}

            {/* Koc Ekle Modal */}
            {showAddCoach && (
                <AddCoachModal
                    onClose={() => setShowAddCoach(false)}
                    onSuccess={(msg) => { showToast(msg); setActiveTab('users'); loadData(); }}
                />
            )}

            {/* Kullanıcı Düzenleme Modalı */}
            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSave={handleSaveUser}
                />
            )}
        </div>
    );
}
