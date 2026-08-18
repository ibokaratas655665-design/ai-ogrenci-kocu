import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { api } from '../services/api';
import Modal from './ui/Modal';

export default function StudentRegisterModal({ isOpen, onClose }) {
    const [formData, setFormData] = useState({
        name: '',
        schoolNumber: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name || !formData.schoolNumber || !formData.password) {
            setError('Tüm alanları doldurunuz.');
            return;
        }

        // API expects: register(name, email, password, role)
        // For students, we use schoolNumber as email
        const result = await api.auth.register(
            formData.name,
            formData.schoolNumber, // schoolNumber as identifier
            formData.password,
            'student'
        );

        if (result.success) {
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setFormData({ name: '', schoolNumber: '', password: '' });
            }, 2000);
        } else {
            setError(result.error || 'Kayıt başarısız oldu.');
        }
    };

    if (!isOpen) return null;

    return (
        <Modal
            acik
            onClose={onClose}
            baslikGizle
            genislik="md"
            govdeClassName="p-6"
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-ink-3 hover:text-ink-2"
            >
                <X size={24} />
            </button>

            <div className="flex items-center gap-3 mb-6">
                <UserPlus size={28} className="text-brand" />
                <h2 className="text-2xl font-bold text-ink">Öğrenci Kaydı</h2>
            </div>

            {success ? (
                <div className="bg-ok-soft text-ok p-4 rounded-lg border border-ok text-center">
                    <p className="font-semibold">✅ Kayıt Başarılı!</p>
                    <p className="text-sm mt-1">Koç onayı bekleniyor...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-danger-soft text-danger p-3 rounded-lg text-sm border border-danger">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-ink-2 mb-2">
                            Ad Soyad
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                            placeholder="Örn: Ahmet Yılmaz"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-ink-2 mb-2">
                            Okul Numarası
                        </label>
                        <input
                            type="text"
                            value={formData.schoolNumber}
                            onChange={(e) => setFormData({ ...formData, schoolNumber: e.target.value })}
                            className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                            placeholder="Örn: 12345"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-ink-2 mb-2">
                            Şifre
                        </label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-4 py-3 border border-line-2 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                            placeholder="Şifrenizi belirleyin"
                        />
                    </div>

                    <div className="bg-info-soft border border-info rounded-lg p-3 text-sm text-info">
                        <p className="font-semibold mb-1">ℹ️ Bilgi:</p>
                        <p>Kaydınız koç tarafından onaylandıktan sonra giriş yapabileceksiniz.</p>
                    </div>

                    <div className="pencere-alt-cubuk bg-surface flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-line-2 rounded-lg hover:bg-surface-2 transition-colors font-medium text-ink-2"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors shadow-sm font-medium"
                        >
                            Kayıt Ol
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
