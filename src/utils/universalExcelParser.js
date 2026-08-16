import * as XLSX from 'xlsx';

/**
 * 🌟 UNIVERSAL EXCEL PARSER — v12.0 (DYNAMİC CONTENT ANALYZER)
 * Bu sürüm artık sadece başlıklara (header) güvenmez.
 * Satırların içeriğini analiz ederek Sütunları (No, Ad, Soyad) bizzat bulur.
 */

const cleanStr = (val) => String(val === null || val === undefined ? '' : val).trim();
const normTR = (s) => String(s || '').toLowerCase()
    .replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i')
    .replace(/Ğ/g, 'g').replace(/ğ/g, 'g')
    .replace(/Ü/g, 'u').replace(/ü/g, 'u')
    .replace(/Ş/g, 's').replace(/ş/g, 's')
    .replace(/Ö/g, 'o').replace(/ö/g, 'o')
    .replace(/Ç/g, 'c').replace(/ç/g, 'c');

export const parseUniversalExcel = async (file, expectedType = 'auto') => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const workbook = XLSX.read(e.target.result, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
                
                if (!jsonData || jsonData.length < 2) throw new Error('Excel dosyası boş veya okunamadı.');

                resolve({ success: true, type: 'student_list', ...parseDynamicStudentList(jsonData) });
            } catch (error) { reject(error.message); }
        };
        reader.readAsArrayBuffer(file);
    });
};

/**
 * "12-A", "12/A", "12 A", "11B", "9. Sınıf A" gibi yazımları
 * sınıf ve şube olarak ayırır.
 */
const splitGradeSection = (raw) => {
    const s = cleanStr(raw).toLocaleUpperCase('tr-TR').replace(/SINIF|ŞUBE/g, '').trim();
    if (!s) return { grade: '', section: '' };

    // Sayı + harf: 12A, 12-A, 12/A, 12 A
    const m = /^(\d{1,2})\s*[-/.\s]?\s*([A-ZÇĞİÖŞÜ])?$/.exec(s);
    if (m) return { grade: m[1], section: m[2] || '' };

    // "MEZUN", "HAZIRLIK" gibi metinsel seviyeler
    if (/^[A-ZÇĞİÖŞÜ\s]+$/.test(s) && s.length <= 12) return { grade: s.trim(), section: '' };

    return { grade: s, section: '' };
};

const parseDynamicStudentList = (jsonData) => {
    const students = [];
    let colMap = { okulNo: -1, adSoyad: -1, ad: -1, soyad: -1, sinif: -1, sube: -1 };

    // 1. ADIM: İÇERİK ANALİZİ İLE SÜTUNLARI BUL
    // İlk 30 satırı tara, içinde 2-5 basamaklı sayı ve isim olan satırı bul
    for (let i = 0; i < Math.min(jsonData.length, 30); i++) {
        const row = jsonData[i];
        const rowText = row.map(c => normTR(cleanStr(c)));

        // Manuel Başlık Kontrolü
        // ⚠️ rowText normTR'den geçtiği için TÜM arama terimleri de sadeleştirilmiş
        // olmalı ('adı soyadı' → 'adi soyadi'). Aksi halde başlık satırı bulunamıyor
        // ve parser tahmin moduna düşüp sınıf/şube bilgisini kaybediyordu.
        const hNo = rowText.findIndex(c => /(^|\s)(no|numara|ogrenci no|okul no)(\s|$)/.test(c) || c.includes('numara'));
        const hAdSoyad = rowText.findIndex(c => c.includes('adi soyadi') || c.includes('ad soyad') || c.includes('isim'));
        const hAd = rowText.findIndex(c => c === 'adi' || c === 'ad');
        const hSoyad = rowText.findIndex(c => c === 'soyadi' || c === 'soyad');

        // ⚠️ normTR Türkçe karakterleri sadeleştiriyor ('ı'→'i', 'ş'→'s', 'ü'→'u').
        // Bu yüzden 'sınıf' / 'şube' aramaları HİÇBİR ZAMAN eşleşmiyordu ve
        // sınıf sütunu bulunamadığı için tüm öğrenciler sınıfsız kaydediliyordu.
        const hSinif = rowText.findIndex(c => c.includes('sinif') || c.includes('duzey'));
        const hSube = rowText.findIndex(c => c.includes('sube'));

        if ((hNo !== -1 && (hAdSoyad !== -1 || hAd !== -1))) {
            colMap = { okulNo: hNo, adSoyad: hAdSoyad, ad: hAd, soyad: hSoyad, sinif: hSinif, sube: hSube };
            jsonData = jsonData.slice(i + 1);
            break;
        }

        // Akıllı İçerik Tahmini (Eğer başlık yoksa veri satırından tahmin et)
        const possibleNoCol = row.findIndex(c => /^\d{1,5}$/.test(cleanStr(c).replace(/\.0$/, '')));
        const possibleNameCol = row.findIndex(c => cleanStr(c).split(' ').length >= 2 && /[a-zA-Z]/.test(cleanStr(c)));

        if (possibleNoCol !== -1 && possibleNameCol !== -1 && possibleNoCol !== possibleNameCol) {
            // Başlık yoksa sınıfı da içerikten tahmin et: "12-A", "11B", "9" gibi hücre
            const possibleClassCol = row.findIndex((c, idx) => {
                if (idx === possibleNoCol || idx === possibleNameCol) return false;
                return /^\s*\d{1,2}\s*[-/.\s]?\s*[A-ZÇĞİÖŞÜa-zçğıöşü]?\s*$/.test(cleanStr(c)) && cleanStr(c) !== '';
            });
            colMap = {
                okulNo: possibleNoCol, adSoyad: possibleNameCol,
                ad: -1, soyad: -1, sinif: possibleClassCol, sube: -1,
            };
            jsonData = jsonData.slice(i); // Verinin başladığı yerden itibaren al
            break;
        }
    }

    // 2. ADIM: TABLOYU TITIZCE OKU
    jsonData.forEach(row => {
        if (!row || row.length < 2) return;
        
        let scNo = colMap.okulNo !== -1 ? cleanStr(row[colMap.okulNo]).replace(/\.0$/, '') : '';
        let fullName = '';

        if (colMap.adSoyad !== -1 && row[colMap.adSoyad]) {
            fullName = cleanStr(row[colMap.adSoyad]);
        } else if (colMap.ad !== -1) {
            fullName = (cleanStr(row[colMap.ad]) + ' ' + (colMap.soyad !== -1 ? cleanStr(row[colMap.soyad]) : '')).trim();
        }

        // 🛡️ ÇÖP AYIKLAMA (v12.0)
        const rowLower = normTR(row.join(' '));
        if (rowLower.includes('#') || rowLower.includes('sayısı') || rowLower.includes('toplam') || 
            rowLower.includes('müdür') || rowLower.includes('öğretmen') || rowLower.includes('bakanlık')) return;

        // İsim kontrolü: İçinde sayı olan veya çok kısa olan isimleri atla
        if (fullName.length < 4 || /\d/.test(fullName) || fullName.includes(':')) return;

        // Numara kontrolü: Çok uzun (Örn 11 haneli TC No öğrenci no değildir) veya boş numara
        if (!scNo || scNo.length > 5 || isNaN(scNo)) {
            // Eğer numara yoksa ama isim varsa (Bazı listelerde no yazmaz), geçici ID ver
            if (!fullName) return;
        }

        // Sınıf ve şube: ayrı sütunlar varsa ikisini de al, tek sütunda
        // birleşikse ("12-A") ayır.
        const rawClass = colMap.sinif !== -1 ? row[colMap.sinif] : '';
        const rawSection = colMap.sube !== -1 ? row[colMap.sube] : '';
        const parsed = splitGradeSection(rawClass);
        const section = cleanStr(rawSection).toLocaleUpperCase('tr-TR') || parsed.section;

        students.push({
            id: scNo ? `e_${scNo}` : `idx_${Math.random()}`,
            name: fullName.toLocaleUpperCase('tr-TR'),
            schoolNumber: scNo,
            grade: parsed.grade,
            section,
        });
    });

    if (students.length === 0) throw new Error('Geçerli öğrenci verisi bulunamadı. Lütfen e-Okul listesini kontrol edin.');
    return { data: students };
};
export default parseUniversalExcel;
