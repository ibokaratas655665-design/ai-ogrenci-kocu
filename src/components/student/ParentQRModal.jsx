import React, { useEffect, useRef, useState } from 'react';
import { QrCode, Download, X, Share2, MessageCircle, Check, AlertCircle } from 'lucide-react';
import wa from '../../services/whatsappService';

/**
 * 👨‍👩‍👧 Veli QR Kodu
 *
 * Veli portalına (#/veli/:studentId) götüren QR kodu ve paylaşım
 * bağlantısını üretir. Veli telefonu kayıtlıysa doğrudan WhatsApp'tan
 * gönderilebilir.
 */
const ParentQRModal = ({ student, onClose }) => {
    const canvasRef = useRef(null);
    const [qrReady, setQrReady] = useState(false);
    const [qrError, setQrError] = useState(null);
    const [copied, setCopied] = useState(false);

    const shareUrl = wa.buildParentPortalLink(student?.id);
    const parentPhone = student?.parentPhone;
    const canWhatsApp = wa.isValidPhone(parentPhone);

    useEffect(() => {
        if (!student) return;
        let cancelled = false;

        (async () => {
            try {
                const QRCode = (await import('qrcode')).default;
                if (cancelled || !canvasRef.current) return;
                await QRCode.toCanvas(canvasRef.current, shareUrl, {
                    width: 220,
                    margin: 2,
                    color: { dark: '#312e81', light: '#ffffff' },
                });
                if (!cancelled) setQrReady(true);
            } catch (err) {
                if (!cancelled) setQrError(err?.message || 'QR kod üretilemedi');
            }
        })();

        return () => { cancelled = true; };
    }, [student, shareUrl]);

    const downloadQR = () => {
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        link.download = `${student?.name || 'ogrenci'}-veli-qr.png`;
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
    };

    const copyLink = () => {
        navigator.clipboard?.writeText(shareUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const sendViaWhatsApp = () => {
        wa.sendMessage({
            phone: parentPhone,
            message:
                `Merhaba${student?.parentName ? ` ${student.parentName}` : ''},\n\n` +
                `${student?.name} için hazırladığım gelişim raporunu aşağıdaki bağlantıdan takip edebilirsiniz. ` +
                `Rapor sürekli güncellenir — istediğiniz zaman açabilirsiniz.\n\n${shareUrl}`,
            studentId: student?.id,
            studentName: student?.name,
            templateId: 'parent_portal_link',
            audience: 'parent',
        });
    };

    return (
        <div className="fixed inset-0 z-modal-base bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface rounded-3xl shadow-2xl max-w-sm w-full p-6 relative animate-scale-in">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-xl text-ink-3 hover:text-ink-2 hover:bg-surface-3 transition"
                >
                    <X size={18} />
                </button>

                <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-brand-soft rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <QrCode size={24} className="text-brand" />
                    </div>
                    <h2 className="text-lg font-black text-ink">Veli Portalı</h2>
                    <p className="text-xs text-ink-2 mt-1">
                        QR kodu veliyle paylaşın. Telefonuyla tarayarak gelişim raporunu görüntüleyebilir.
                    </p>
                </div>

                {/* QR */}
                <div className="flex justify-center mb-4">
                    {qrError ? (
                        <div className="w-56 h-56 bg-warn-soft rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-warn px-4">
                            <AlertCircle size={40} className="text-warn mb-2" />
                            <p className="text-xs text-warn text-center">
                                QR kod oluşturulamadı.<br />Aşağıdaki bağlantıyı elle paylaşabilirsiniz.
                            </p>
                        </div>
                    ) : (
                        <canvas
                            ref={canvasRef}
                            className={`rounded-2xl border border-brand-line ${qrReady ? 'shadow-sm' : 'opacity-0 h-0'}`}
                        />
                    )}
                    {!qrReady && !qrError && (
                        <div className="w-56 h-56 bg-brand-soft rounded-2xl flex items-center justify-center border-2 border-dashed border-brand-line">
                            <span className="w-7 h-7 border-2 border-brand-line border-t-indigo-600 rounded-full animate-spin" />
                        </div>
                    )}
                </div>

                <p className="text-center text-sm font-bold text-ink-2 mb-4">
                    📋 {student?.name}
                    {student?.parentName && (
                        <span className="block text-xs font-normal text-ink-3 mt-0.5">
                            Veli: {student.parentName}
                        </span>
                    )}
                </p>

                {/* Link */}
                <div className="bg-surface-2 rounded-xl p-3 mb-4">
                    <p className="text-[10px] text-ink-2 font-bold uppercase mb-1">Paylaşım Bağlantısı</p>
                    <p className="text-xs text-brand font-mono break-all">{shareUrl}</p>
                </div>

                {/* WhatsApp */}
                {canWhatsApp ? (
                    <button
                        onClick={sendViaWhatsApp}
                        className="w-full flex items-center justify-center gap-2 py-3 mb-2 bg-ok text-white rounded-xl font-bold text-sm hover:brightness-105 active:scale-[0.98] transition"
                    >
                        <MessageCircle size={16} /> Veliye WhatsApp'tan Gönder
                    </button>
                ) : (
                    <p className="text-[11px] text-warn bg-warn-soft rounded-xl px-3 py-2 mb-2 leading-snug">
                        WhatsApp'tan göndermek için öğrenci kartına veli telefonu ekleyin.
                    </p>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={copyLink}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-brand-line rounded-xl text-brand font-bold text-sm hover:bg-brand-soft transition"
                    >
                        {copied ? <Check size={15} /> : <Share2 size={15} />}
                        {copied ? 'Kopyalandı' : 'Link Kopyala'}
                    </button>
                    {qrReady && (
                        <button
                            onClick={downloadQR}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand text-white rounded-xl font-bold text-sm hover:bg-brand-hover transition"
                        >
                            <Download size={15} /> QR İndir
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ParentQRModal;
