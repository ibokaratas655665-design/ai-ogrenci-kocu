import React, { useState } from 'react';
import { X, Users, Mail, Phone, Building2, Upload } from 'lucide-react';
import hybridAuth from '../services/hybridAuth';

const AddCoachModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        schoolName: 'Şamran Anadolu Lisesi',
        role: 'coach'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [bulkMode, setBulkMode] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Validate
            if (!formData.name || !formData.phone || !formData.schoolName) {
                setError('Lütfen tüm zorunlu alanları doldurun!');
                setLoading(false);
                return;
            }

            // Use hybrid auth for better credential management
            const result = await hybridAuth.registerCoach(formData);

            if (result.success) {
                onSuccess?.(`✅ Koç başarıyla eklendi!${result.requireApproval ? ' (Onay gerekli)' : ''}`);
                onClose();
            } else {
                setError(result.error || 'Koç eklenirken bir hata oluştu');
            }
        } catch (err) {
            console.error('Add coach error:', err);
            setError('Beklenmeyen bir hata oluştu!');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError('');
        setLoading(true);

        try {
            // Import universal parser
            const { parseUniversalExcel } = await import('../utils/universalExcelParser');

            // Parse file
            const parsed = await parseUniversalExcel(file, 'coach_list');

            if (!parsed.success || !parsed.data || parsed.data.length === 0) {
                throw new Error("Excel dosyasında koç bulunamadı.");
            }

            // Bulk add coaches
            const bulkResult = await hybridAuth.bulkAddCoaches(parsed.data);

            if (bulkResult.success) {
                const { success, failed, skipped } = bulkResult.results;
                let message = `✅ ${success.length} koç eklendi`;
                if (skipped.length > 0) message += `, ${skipped.length} atlandı`;
                if (failed.length > 0) message += `, ${failed.length} hata`;

                onSuccess?.(message);
                onClose();
            } else {
                setError(bulkResult.error || 'Toplu ekleme başarısız');
            }

        } catch (err) {
            console.error('Bulk upload error:', err);
            setError(err.message || 'Dosya işlenirken hata oluştu');
        } finally {
            setLoading(false);
            e.target.value = ''; // Reset input
        }
    };

    return (
        <div className="fixed inset-0 z-modal-high bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
                <div className="bg-indigo-900 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-ink font-bold text-lg">Yeni Koç Ekle</h3>
                    <button onClick={onClose} className="text-brand hover:text-ink">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-danger-soft border border-danger text-danger px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Mode Toggle */}
                    <div className="flex gap-2 p-1 bg-surface-3 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setBulkMode(false)}
                            className={`flex-1 py-2 px-4 rounded-md font-bold text-sm transition ${!bulkMode ? 'bg-surface text-brand shadow' : 'text-ink-2'}`}
                        >
                            Tekli Ekle
                        </button>
                        <button
                            type="button"
                            onClick={() => setBulkMode(true)}
                            className={`flex-1 py-2 px-4 rounded-md font-bold text-sm transition ${bulkMode ? 'bg-surface text-brand shadow' : 'text-ink-2'}`}
                        >
                            <Upload className="inline mr-1" size={16} />
                            Toplu Ekle (Excel)
                        </button>
                    </div>

                    {bulkMode ? (
                        // BULK UPLOAD MODE
                        <div className="space-y-4">
                            <div className="bg-info-soft border border-info text-info px-4 py-3 rounded-lg text-sm">
                                <p className="font-bold mb-1">📊 Excel Formatı:</p>
                                <ul className="list-disc list-inside space-y-1 text-xs">
                                    <li><strong>Ad Soyad</strong> - Koçun tam adı</li>
                                    <li><strong>Telefon</strong> - Cep telefonu (giriş için kullanılacak)</li>
                                    <li><strong>E-posta</strong> (Opsiyonel)</li>
                                    <li><strong>Okul</strong> (Opsiyonel, varsayılan: Şamran AL)</li>
                                </ul>
                            </div>

                            <div className="border-2 border-dashed border-line-2 rounded-lg p-6 text-center hover:border-indigo-400 transition">
                                <input
                                    type="file"
                                    id="bulkCoachUpload"
                                    accept=".xlsx,.xls"
                                    onChange={handleBulkUpload}
                                    className="hidden"
                                    disabled={loading}
                                />
                                <label
                                    htmlFor="bulkCoachUpload"
                                    className="cursor-pointer flex flex-col items-center space-y-2"
                                >
                                    <Upload size={32} className="text-brand" />
                                    <span className="font-bold text-ink-2">Excel Dosyası Seç</span>
                                    <span className="text-xs text-ink-2">.xlsx veya .xls</span>
                                </label>
                            </div>
                        </div>
                    ) : (
                        // SINGLE ADD MODE
                        <>
                            <div>
                                <label className="block text-sm font-bold text-ink-2 mb-1">Ad Soyad *</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-2.5 text-ink-3" size={18} />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="pl-10 w-full border border-line-2 rounded-lg p-2 focus:ring-2 focus:ring-brand focus:border-brand"
                                        placeholder="Örn: Ayşe Yılmaz"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-ink-2 mb-1">E-posta (Opsiyonel)</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 text-ink-3" size={18} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="pl-10 w-full border border-line-2 rounded-lg p-2 focus:ring-2 focus:ring-brand focus:border-brand"
                                        placeholder="ornek@eposta.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-ink-2 mb-1">Telefon *</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 text-ink-3" size={18} />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="pl-10 w-full border border-line-2 rounded-lg p-2 focus:ring-2 focus:ring-brand focus:border-brand"
                                        placeholder="05432650660"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-ink-2 mb-1">Okul Adı *</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-2.5 text-ink-3" size={18} />
                                    <input
                                        type="text"
                                        name="schoolName"
                                        value={formData.schoolName}
                                        onChange={handleChange}
                                        className="pl-10 w-full border border-line-2 rounded-lg p-2 focus:ring-2 focus:ring-brand focus:border-brand"
                                        placeholder="Şamran Anadolu Lisesi"
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {!bulkMode && (
                        <div className="pt-4 flex space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2 bg-surface-3 text-ink-2 rounded-lg font-bold hover:bg-surface-3 transition"
                                disabled={loading}
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-2 bg-brand text-white rounded-lg font-bold hover:bg-brand-hover transition disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default AddCoachModal;
