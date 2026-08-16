import React, { useState } from 'react';
import { X, Download, Edit3, FileText } from 'lucide-react';

/**
 * Rapor Önizleme ve Düzenleme Modalı
 * Kullanıcı raporu indirmeden önce önizleyebilir ve düzenleyebilir
 */
const ReportPreviewModal = ({
    reportType,     // 'class_progress' | 'school' | 'student_progress'
    reportData,     // Rapor için gerekli data (trials, exams, students, etc.)
    onClose,
    onDownload
}) => {
    const [editableContent, setEditableContent] = useState({
        title: getDefaultTitle(reportType),
        notes: '',
        customInfo: ''
    });

    const [isEditing, setIsEditing] = useState(false);

    function getDefaultTitle(type) {
        switch (type) {
            case 'class_progress':
                return 'Sınıf Gelişim Raporu';
            case 'school':
                return 'Okul Geneli Analiz Raporu';
            case 'student_progress':
                return 'Öğrenci Gelişim Raporu';
            default:
                return 'Analiz Raporu';
        }
    }

    const handleDownload = () => {
        // Pass edited content to download function
        onDownload(editableContent);
    };

    // Preview content summary
    const getPreviewSummary = () => {
        const { trials, exams } = reportData;

        switch (reportType) {
            case 'class_progress':
                return `${trials?.length || 0} deneme, ${new Set(exams?.map(e => e.student)).size || 0} öğrenci`;
            case 'school':
                return `Sınıf bazlı analiz (9-12), ${trials?.length || 0} deneme`;
            case 'student_progress':
                return `${reportData.studentName || 'Öğrenci'} - ${trials?.length || 0} deneme`;
            default:
                return '';
        }
    };

    return (
        <div className="fixed inset-0 z-modal-high bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-surface rounded-3xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col my-4">
                {/* Header */}
                <div className="on-color bg-gradient-to-r from-brand to-purple-600 p-6 text-white">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                                <FileText size={28} />
                                <h2 className="text-2xl font-bold">Rapor Önizleme</h2>
                            </div>
                            <p className="text-brand text-sm">{getPreviewSummary()}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-ink hover:bg-surface/20 rounded-full p-2 transition"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {/* Editable Title */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-ink-2 mb-2">
                            Rapor Başlığı
                        </label>
                        <input
                            type="text"
                            value={editableContent.title}
                            onChange={(e) => setEditableContent({ ...editableContent, title: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-line rounded-xl focus:border-brand focus:outline-none text-xl font-bold"
                            placeholder="Rapor başlığı..."
                        />
                    </div>

                    {/* Preview Box */}
                    <div className="bg-surface-2 rounded-2xl p-6 mb-6 border-2 border-line">
                        <h3 className="text-lg font-bold text-ink mb-4 flex items-center">
                            <FileText className="mr-2 text-brand" size={20} />
                            Rapor İçeriği Özeti
                        </h3>
                        <div className="space-y-3 text-ink-2">
                            <InfoRow label="Rapor Tipi" value={getDefaultTitle(reportType)} />
                            <InfoRow label="Kapsam" value={getPreviewSummary()} />
                            <InfoRow label="Oluşturulma" value={new Date().toLocaleDateString('tr-TR')} />

                            {reportType === 'school' && (
                                <div className="mt-4 pt-4 border-t border-line-2">
                                    <p className="text-sm font-semibold text-brand mb-2">📊 İçerik</p>
                                    <ul className="text-sm space-y-1 ml-4">
                                        <li>• Genel özet ve başarı grafiği</li>
                                        <li>• Her sınıf için ayrı analiz (9-12)</li>
                                        <li>• Sınıf bazlı istatistikler ve grafikler</li>
                                        <li>• En başarılı öğrenciler (sınıf bazlı)</li>
                                    </ul>
                                </div>
                            )}

                            {reportType === 'class_progress' && (
                                <div className="mt-4 pt-4 border-t border-line-2">
                                    <p className="text-sm font-semibold text-ok mb-2">📈 İçerik</p>
                                    <ul className="text-sm space-y-1 ml-4">
                                        <li>• Genel başarı trendi grafiği</li>
                                        <li>• Ders bazında gelişim analizi</li>
                                        <li>• Deneme karşılaştırma tablosu</li>
                                        <li>• En çok gelişen öğrenciler listesi</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Custom Notes */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-ink-2 mb-2 flex items-center">
                            <Edit3 size={16} className="mr-2" />
                            Özel Notlar (Opsiyonel)
                        </label>
                        <textarea
                            value={editableContent.notes}
                            onChange={(e) => setEditableContent({ ...editableContent, notes: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-line rounded-xl focus:border-brand focus:outline-none resize-none"
                            rows="4"
                            placeholder="Rapora eklemek istediğiniz özel notlar, açıklamalar veya ek bilgiler..."
                        />
                        <p className="text-xs text-ink-2 mt-2">
                            Bu notlar PDF'in son sayfasına eklenecektir
                        </p>
                    </div>

                    {/* Info Box */}
                    <div className="bg-info-soft border-2 border-info rounded-xl p-4">
                        <p className="text-sm text-info">
                            <span className="font-semibold">💡 İpucu:</span> Raporu indirdiğinizde tüm grafikler,
                            tablolar ve analizler otomatik olarak oluşturulacaktır. Düzenlemeleriniz rapora
                            yansıtılacaktır.
                        </p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-line p-6 bg-surface-2">
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-surface-3 text-ink-2 rounded-xl hover:bg-gray-300 transition font-semibold"
                        >
                            İptal
                        </button>
                        <button
                            onClick={handleDownload}
                            className="on-color px-6 py-3 bg-gradient-to-r from-brand to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition font-semibold flex items-center space-x-2 shadow-lg shadow-indigo-200"
                        >
                            <Download size={20} />
                            <span>PDF İndir</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper component
const InfoRow = ({ label, value }) => (
    <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-ink-2">{label}:</span>
        <span className="text-sm text-ink font-semibold">{value}</span>
    </div>
);

export default ReportPreviewModal;
