/**
 * 🏷️ PDF ÇIKTILARINDA MARKA
 *
 * Koçluk tarafındaki bütün PDF çıktılarına uygulamanın amblemi ve adı
 * basılır: karne, program, deneme analizi, portfolyo, üniversite listesi…
 *
 * ⚠️ RESMÎ BELGELERE UYGULANMAZ.
 *
 * `mebDocument.js` ile üretilen evrak MEB Standart Dosya Planı'na göre
 * "T.C. → Valilik → İlçe MEM → Okul" başlığı taşır ve evrak sayısı, imza
 * bloğu içerir. Bunlar okulun resmî evrakıdır; üzerine bir yazılım markası
 * basmak belgenin resmî görünümünü bozar ve okul dışı bir kurumun evrakı
 * gibi durur. O yüzden resmî üretici bu modülü ÇAĞIRMAZ.
 *
 * Kullanım:
 *   import { markaBasligi, markaAltBilgisi } from '../utils/pdfMarka';
 *   const y = markaBasligi(doc, { baslik: 'Öğrenci Karnesi' });
 *   … içerik y'den itibaren …
 *   markaAltBilgisi(doc);
 */

import { AMBLEM_BASE64 } from '../data/amblemBase64';
import { MARKA } from '../data/marka';

/** jsPDF metin çıktısı Türkçe karakterlerde bozulabiliyor; sadeleştir. */
const trSade = (s = '') => String(s)
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C');

const LACIVERT = [22, 41, 74];    // #16294A
const TURUNCU = [244, 123, 32];   // #F47B20
const GRI = [130, 138, 150];

/**
 * Sayfanın üstüne amblem + ad + (varsa) belge başlığı basar.
 *
 * @param {object} doc jsPDF örneği
 * @param {object} [se]
 * @param {string} [se.baslik]    Belge adı — "Öğrenci Karnesi" gibi
 * @param {string} [se.altBaslik] İkinci satır — öğrenci adı, tarih vb.
 * @param {number} [se.y]         Başlangıç yüksekliği (mm), varsayılan 12
 * @returns {number} İçeriğin başlayabileceği y değeri (mm)
 */
export const markaBasligi = (doc, { baslik = '', altBaslik = '', y = 12 } = {}) => {
    const genislik = doc.internal.pageSize.getWidth();
    const amblemBoyu = 13;

    try {
        doc.addImage(AMBLEM_BASE64, 'PNG', 14, y, amblemBoyu, amblemBoyu);
    } catch {
        // Amblem basılamazsa PDF üretimi durmasın; yalnızca ad yazılır.
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...LACIVERT);
    doc.text(trSade(MARKA.ad), 14 + amblemBoyu + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRI);
    doc.text('Kocluk ve Rehberlik Sistemi', 14 + amblemBoyu + 4, y + 10.5);

    // Belge adı sağa yaslı — marka ile çakışmasın
    if (baslik) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...LACIVERT);
        doc.text(trSade(baslik), genislik - 14, y + 6, { align: 'right' });
    }
    if (altBaslik) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...GRI);
        doc.text(trSade(altBaslik), genislik - 14, y + 11, { align: 'right' });
    }

    // Marka renklerinde ayraç
    const cizgiY = y + amblemBoyu + 2;
    doc.setDrawColor(...TURUNCU);
    doc.setLineWidth(0.8);
    doc.line(14, cizgiY, 14 + 28, cizgiY);
    doc.setDrawColor(...LACIVERT);
    doc.setLineWidth(0.4);
    doc.line(14 + 28, cizgiY, genislik - 14, cizgiY);

    doc.setTextColor(0, 0, 0);
    return cizgiY + 8;
};

/**
 * Sayfanın altına marka ve tarih basar. Çok sayfalı belgelerde
 * her sayfa için ayrı çağrılmalıdır.
 *
 * @param {object} doc jsPDF örneği
 * @param {object} [se]
 * @param {string} [se.not] Ek açıklama — "Resmi evrak niteligi tasimaz" gibi
 */
export const markaAltBilgisi = (doc, { not = '' } = {}) => {
    const g = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    const tarih = new Date().toLocaleDateString('tr-TR');

    doc.setDrawColor(225, 228, 232);
    doc.setLineWidth(0.3);
    doc.line(14, h - 12, g - 14, h - 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...LACIVERT);
    doc.text(trSade(MARKA.ad), 14, h - 7.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRI);
    if (not) {
        doc.text(trSade(not), g / 2, h - 7.5, { align: 'center' });
    }
    doc.text(tarih, g - 14, h - 7.5, { align: 'right' });

    doc.setTextColor(0, 0, 0);
};

/** Belgedeki TÜM sayfalara alt bilgi basar. */
export const markaAltBilgisiTumSayfalar = (doc, se = {}) => {
    const sayfa = doc.internal.getNumberOfPages();
    for (let i = 1; i <= sayfa; i += 1) {
        doc.setPage(i);
        markaAltBilgisi(doc, se);
    }
};

export default { markaBasligi, markaAltBilgisi, markaAltBilgisiTumSayfalar };
