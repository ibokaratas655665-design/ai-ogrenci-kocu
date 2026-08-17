import { bildir } from '../services/uiGeriBildirim';
/**
 * pdfSave.js — Garantili PDF İndirme
 *
 * jsPDF'in output('blob') metodu kullanılır.
 * Blob tipi 'application/pdf' olarak açıkça set edilir.
 * Sonra bir gizli <a> elemanı ile tetiklenir.
 *
 * Bu yöntem Chrome, Edge, Firefox, Safari desktop'ta güvenilirdir.
 */

/**
 * @param {import('jspdf').jsPDF} pdfDoc - Dolu jsPDF instance
 * @param {string} filename - Dosya adı (.pdf dahil veya hariç)
 */

export const sanitizeForPDF = (text) => {
    if (!text) return '';
    return text.toString()
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
        .replace(/ü/g, 'u').replace(/Ü/g, 'U')
        .replace(/ş/g, 's').replace(/Ş/g, 'S')
        .replace(/ı/g, 'i').replace(/İ/g, 'I')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O')
        .replace(/ç/g, 'c').replace(/Ç/g, 'C');
};
export function savePDF(pdfDoc, filename) {
    const fname = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

    // ── Yöntem 1: Blob + objectURL (Chrome/Edge/Firefox uyumlu) ────────
    try {
        // output('blob') jsPDF içinden doğru MIME ile gelir: 'application/pdf'
        const blob = pdfDoc.output('blob');

        // Guaranteed: Blob'un type'ını açıkça set et
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });

        const url = URL.createObjectURL(pdfBlob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fname;          // ← Dosya adı burada belirleniyor
        a.rel = 'noopener';
        a.style.display = 'none';

        document.body.appendChild(a);
        a.click();

        // Bellek temizle
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 3000);

        return; // Başarılı
    } catch (e1) {
        console.warn('savePDF Blob yöntemi başarısız:', e1);
    }

    // ── Yöntem 2: window.open ile yeni sekmede aç (iOS/Safari fallback) ─
    try {
        const dataUri = pdfDoc.output('datauristring');
        const newWin = window.open();
        if (newWin) {
            newWin.document.write(`
                <html><head><title>${fname}</title></head>
                <body style="margin:0">
                    <embed src="${dataUri}" type="application/pdf" width="100%" height="100%" />
                </body></html>`);
        } else {
            // Popup engellendi - direkt href
            window.location.href = dataUri;
        }
        return;
    } catch (e2) {
        console.warn('savePDF window.open yöntemi başarısız:', e2);
    }

    // ── Yöntem 3: Son çare ───────────────────────────────────────────────
    try {
        pdfDoc.save(fname);
    } catch (e3) {
        bildir('PDF kaydedilemedi. Tarayıcınızı güncelleyin ve tekrar deneyin.');
    }
}
