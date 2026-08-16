import * as XLSX from 'xlsx';

/**
 * Parses an Excel file for Exam Results.
 * Supports multiple sheets for combined exams (TYT+AYT, TYT+YDT).
 * 
 * @param {File} file - The uploaded Excel file.
 * @param {string} examType - The type of exam (TYT, AYT, TYT+AYT, LGS, etc.)
 * @returns {Promise<Object>} - Standardized student results and metadata.
 */

import { normalizeTRName, normalizeSchoolNumber, normalizeNameForKeys, getOBPScore } from './scoreCalculator';

const parseNum = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const float = parseFloat(String(val).replace(',', '.'));
    return isNaN(float) ? 0 : float;
};

const processSubjects = (row, colMap) => {
    const subjects = {};
    const calcNet = (d, y) => parseFloat((parseNum(d) - (parseNum(y) * 0.25)).toFixed(2));

    Object.keys(colMap.subjects || {}).forEach(key => {
        const cols = colMap.subjects[key];
        const d = cols && cols.d !== -1 ? parseNum(row[cols.d]) : 0;
        const y = cols && cols.y !== -1 ? parseNum(row[cols.y]) : 0;
        const n = cols && cols.n !== -1 ? parseNum(row[cols.n]) : calcNet(d, y);
        if (d !== 0 || y !== 0 || n !== 0) {
            subjects[key] = { d, y, net: n };
        }
    });
    return subjects;
};

const parseSingleWorksheet = (worksheet, examType, detectedInfo = {}) => {
    let jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (!jsonData || jsonData.length === 0) return { results: [] };

    // 1. Find Metric Row (The one with D, Y, N or Correct, Wrong, Net)
    let metricsRowIndex = -1;
    let maxDynCount = 0;

    for (let i = 0; i < Math.min(jsonData.length, 30); i++) {
        const row = jsonData[i];
        if (!row || row.length < 5) continue;

        const dynCount = row.filter(c => {
            const s = String(c || '').trim().toUpperCase();
            return s === 'D' || s === 'Y' || s === 'N' || s === 'DOĞRU' || s === 'YANLIŞ' || s === 'NET';
        }).length;

        if (dynCount > maxDynCount) {
            maxDynCount = dynCount;
            metricsRowIndex = i;
        }
    }

    if (metricsRowIndex === -1) metricsRowIndex = 0;

    // Header rows (the row itself and potential row above for subjects names)
    const metricsRow = jsonData[metricsRowIndex] || [];
    const subjectRow = metricsRowIndex > 0 ? jsonData[metricsRowIndex - 1] : [];

    const subjectsConfig = {
        TYT: {
            turkce: ["temsil", "türkçe", "turkce", "tr", "türk", "t.d.ed", "tded"],
            mat: ["temel matematik", "temel mat", "matematik", "mat", "mat1", "t.mat", "matematik-1"],
            fen: ["fen bilimleri", "fen", "fkb", "fen1"],
            sosyal: ["sosyal bilimler", "sosyal", "sos", "sos1", "tarih-1", "coğrafya-1", "felsefe", "din", "ahlak"]
        },
        AYT: {
            aytMat: ["ayt mat", "ayt matematik", "alan matematik", "matematik", "mat2", "mat-2", "a.mat", "matematik-2"],
            edebiyat: ["edebiyat", "tde", "türk dili", "t.d.ed", "tded"],
            tarih1: ["tarih-1", "tar1", "tarih1"],
            cografya1: ["coğrafya-1", "cog1", "coğ1"],
            tarih2: ["tarih-2", "tar2", "tarih2"],
            cografya2: ["coğrafya-2", "cog2", "coğ2"],
            felsefe: ["felsefe", "grubu", "fel", "felsefe grubu"],
            din: ["din", "kültürü", "dkab", "ahlak", "ahl. bil."],
            fizik: ["fizik", "fiz"],
            kimya: ["kimya", "kim"],
            biyoloji: ["biyoloji", "biy"],
            geometri: ["geometri", "geo"],
            sayNet: ["say net", "sayısal net", "sayisan net", "saypuan"],
            eaNet: ["ea net", "eşit ağırlık net", "esit agirlik net", "eapuan"],
            sozNet: ["söz net", "sözel net", "sozel net", "sozpuan"],
            dilNet: ["dil net", "yabancı dil net", "dilpuan"]
        },
        YDT: {
            dil: ["yabancı dil", "ingilizce", "ydt", "dil", "ing", "alm", "fra"]
        },
        LGS: {
            turkce: ["türkçe", "tr"],
            mat: ["matematik", "mat"],
            fen: ["fen"],
            inkilap: ["inkılap", "tarih"],
            din: ["din"],
            ingilizce: ["ingilizce", "dil"]
        },
        'TYT+AYT': {
            turkce: ["tyt türkçe", "temel türkçe", "türkçe", "tr", "türk"],
            mat: ["tyt matematik", "temel matematik", "matematik", "mat1", "matematik-1"],
            fen: ["tyt fen", "fen bilimleri", "fen"],
            sosyal: ["tyt sosyal", "temel sosyal", "sosyal bilimler", "sosyal"],
            aytMat: ["alan matematik", "ayt matematik", "ayt mat", "mat2", "matematik-2"],
            edebiyat: ["edebiyat", "tde", "türk dili", "tded"],
            tarih1: ["tarih-1", "tar1", "tarih1"],
            cografya1: ["coğrafya-1", "cog1", "coğ1"],
            tarih2: ["tarih-2", "tar2", "tarih2"],
            cografya2: ["coğrafya-2", "cog2", "coğ2"],
            felsefe: ["ayt felsefe", "felsefe", "felsefe grubu"],
            din: ["ayt din", "din kült", "din", "ahlak", "dkab"],
            fizik: ["ayt fizik", "fizik", "fiz"],
            kimya: ["ayt kimya", "kimya", "kim"],
            biyoloji: ["ayt biyoloji", "biyoloji", "biy"],
            sayNet: ["say net", "sayısal net", "sayisan net", "saypuan"],
            eaNet: ["ea net", "eşit ağırlık net", "esit agirlik net", "eapuan"],
            sozNet: ["söz net", "sözel net", "sozel net", "sozpuan"],
            dilNet: ["dil net", "yabancı dil net", "dilpuan"]
        },
        'TYT+YDT': {
            turkce: ["tyt türkçe", "türkçe"],
            mat: ["tyt matematik", "matematik"],
            fen: ["tyt fen", "fen"],
            sosyal: ["tyt sosyal", "sosyal"],
            dil: ["yabancı dil", "ingilizce", "ydt", "dil"]
        }
    };

    const currentConfig = subjectsConfig[examType] || subjectsConfig['TYT'];

    // Map columns
    const colMap = {
        name: -1, firstName: -1, lastName: -1, number: -1, score: -1, totalNet: -1, subjects: {}
    };

    // Try to find student info in multiple potential header rows
    const rowsToSearch = [metricsRow];
    if (metricsRowIndex > 0) rowsToSearch.push(jsonData[metricsRowIndex - 1]);
    if (metricsRowIndex > 1) rowsToSearch.push(jsonData[metricsRowIndex - 2]);

    rowsToSearch.forEach(row => {
        if (!row) return;
        row.forEach((cell, idx) => {
            const s = normalizeName(cell);
            if (s.includes("adsoyad") || s.includes("adisoyadi") || s.includes("ogrenci") || (s.includes("ad") && s.includes("soy"))) {
                if (colMap.name === -1) colMap.name = idx;
            } else if (s === "ad" || s === "adi" || s === "isim" || s === "ogrenciadi") {
                if (colMap.firstName === -1) colMap.firstName = idx;
            } else if (s === "soyad" || s === "soyadi" || s === "soyisim") {
                if (colMap.lastName === -1) colMap.lastName = idx;
            } else if (s.includes("no") || s.includes("numara") || s === "sn" || s === "ogrno") {
                if (colMap.number === -1) colMap.number = idx;
            } else if (s.includes("puan") || s.includes("yerlesme") || s.includes("yks")) {
                if (colMap.score === -1) colMap.score = idx;
            } else if (s.includes("toplamnet") || s === "genelnet" || (s === "net" && idx > 15)) {
                if (colMap.totalNet === -1) colMap.totalNet = idx;
            }
        });
    });

    // Smart Fallback for colMap.name if not detected
    if (colMap.name === -1 && colMap.firstName === -1) {
        const firstDataRow = jsonData[metricsRowIndex + 1] || [];
        if (firstDataRow[1] && String(firstDataRow[1]).length > 5) colMap.name = 1;
        else if (firstDataRow[0] && String(firstDataRow[0]).length > 5) colMap.name = 0;
        else colMap.name = 1;
    }

    // Detect Subject Columns (D-Y-N groups or just N)
    let lastSubject = "";
    metricsRow.forEach((cell, idx) => {
        const s = String(cell || "").trim().toUpperCase();
        const isNet = s === 'N' || s === 'NET' || s === 'TOPLAM NET';
        const isCorrect = s === 'D' || s === 'DOĞRU' || s === 'DOGRU';

        if (isCorrect || isNet) {
            // Found a potential subject column. Let's find out which subject it belongs to.
            // Look up to 3 rows above for names (for nested headers)
            let foundName = "";
            for (let rOffset = 1; rOffset <= 3; rOffset++) {
                if (metricsRowIndex - rOffset >= 0) {
                    const rowAbove = jsonData[metricsRowIndex - rOffset];
                    if (rowAbove && String(rowAbove[idx] || "").trim()) {
                        foundName = String(rowAbove[idx]).trim();
                        break;
                    }
                }
            }

            if (!foundName) {
                // Look backwards in the row directly above
                const directAbove = jsonData[metricsRowIndex - 1] || [];
                for (let k = idx; k >= 0; k--) {
                    if (String(directAbove[k] || "").trim()) {
                        foundName = String(directAbove[k]).trim();
                        break;
                    }
                }
            }
            if (!foundName) foundName = lastSubject;
            lastSubject = foundName;

            const lowerName = foundName.toLowerCase();

            // Find best matching key for this specific column
            let bestKey = null;
            let longestMatchLen = 0;

            Object.keys(currentConfig).forEach(key => {
                const keywords = currentConfig[key];
                keywords.forEach(kw => {
                    const normKw = normalizeName(kw);
                    const normFound = normalizeName(foundName);
                    if (normFound.includes(normKw) && normKw.length > longestMatchLen) {
                        longestMatchLen = normKw.length;
                        bestKey = key;
                    }
                });
            });

            if (bestKey) {
                // If it was a 'D' (Correct), we expect Y and N to follow
                if (isCorrect) {
                    colMap.subjects[bestKey] = { d: idx, y: idx + 1, n: idx + 2 };
                } else if (isNet && !colMap.subjects[bestKey]) {
                    // Only Net column found for this subject
                    colMap.subjects[bestKey] = { d: -1, y: -1, n: idx };
                }
            }
        }
    });

    const results = [];
    for (let i = metricsRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length < 2) continue;

        let studentName = "";
        if (colMap.name !== -1 && row[colMap.name]) studentName = String(row[colMap.name]).trim();
        else if (colMap.firstName !== -1) {
            const f = String(row[colMap.firstName] || "").trim();
            const l = colMap.lastName !== -1 ? String(row[colMap.lastName] || "").trim() : "";
            studentName = `${f} ${l}`.trim();
        }

        // Filter out summary rows (average, total, headers etc.)
        const lowerName = studentName.toLowerCase();
        const skipKeywords = ["ortalama", "toplam", "genel", "kurum", "sube", "puan", "derece", "ogrenci", "adsoyad"];
        if (!studentName || studentName.length < 3 || skipKeywords.some(k => lowerName.includes(k))) continue;

        const subjects = processSubjects(row, colMap);
        const totalNetVal = colMap.totalNet !== -1 ? parseNum(row[colMap.totalNet]) : Object.values(subjects).reduce((a, b) => a + (b.net || 0), 0);
        
        const schoolNumber = colMap.number !== -1 ? normalizeSchoolNumber(row[colMap.number]) : '';
        const obpScore = getOBPScore(studentName, schoolNumber);

        results.push({
            student: studentName,
            number: schoolNumber,
            subjects,
            totalNet: parseFloat(totalNetVal.toFixed(2)),
            score: colMap.score !== -1 ? parseNum(row[colMap.score]) : 0,
            obpScore: obpScore,
            examType
        });
    }

    return { results, detectedInfo };
};

export const normalizeName = (name) => {
    return normalizeNameForKeys(name);
};


export const parseExcelExamData = (file, examType = 'TYT') => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const safeExamType = String(examType || 'TYT');
                const isCombined = ['TYT+AYT', 'TYT+YDT', 'TYT+YDS'].includes(safeExamType);

                if (workbook.SheetNames.length === 0) throw new Error("Excel dosyası boş.");

                let tytSheet = null;
                let secondSheet = null;
                let secondType = safeExamType.includes('AYT') ? 'AYT' : (safeExamType.includes('YDT') ? 'YDT' : 'AYT');

                // Identify sheets
                workbook.SheetNames.forEach(name => {
                    const lowerName = name.toLowerCase();
                    if (lowerName.includes('tyt') || lowerName.includes('temel') || lowerName.includes('1.oturum')) {
                        tytSheet = workbook.Sheets[name];
                    } else if (lowerName.includes('ayt') || lowerName.includes('alan') || lowerName.includes('2.oturum') || lowerName.includes('ydt') || lowerName.includes('dil')) {
                        secondSheet = workbook.Sheets[name];
                    }
                });

                // Single sheet fallback: If no sheet matched by keyword, pick the first one(s)
                if (!tytSheet && workbook.SheetNames.length > 0) tytSheet = workbook.Sheets[workbook.SheetNames[0]];
                if (!secondSheet && workbook.SheetNames.length > 1) secondSheet = workbook.Sheets[workbook.SheetNames[1]];

                // Fixed: Pass correct examType based on combination logic
                let primaryExamType = safeExamType;
                if (isCombined && secondSheet) primaryExamType = 'TYT'; // If multi-sheet combo, first is TYT

                const tytOutput = parseSingleWorksheet(tytSheet, primaryExamType);
                let finalResults = tytOutput.results.map(r => ({ ...r, examType: safeExamType }));

                if (isCombined && secondSheet) {
                    const secondOutput = parseSingleWorksheet(secondSheet, secondType);
                    const secondMapByNumber = new Map();
                    const secondMapByName = new Map();

                    secondOutput.results.forEach(r => {
                        const num = String(r.number || '').trim();
                        if (num) {
                            secondMapByNumber.set(num, r);
                        } else {
                            secondMapByName.set(normalizeName(r.student), r);
                        }
                    });

                    finalResults.forEach(student => {
                        const sNum = String(student.number || '').trim();
                        const sNameKey = normalizeName(student.student);
                        
                        // Priority 1: Match by School Number
                        // Priority 2: Match by Name (Fallback if number is missing in either)
                        const match = (sNum && secondMapByNumber.get(sNum)) || secondMapByName.get(sNameKey);
                        
                        if (match) {
                            student.subjects = { ...student.subjects, ...match.subjects };
                            student.tyt = student.totalNet;
                            student.totalNet = parseFloat((student.totalNet + match.totalNet).toFixed(2));
                            if (match.score > 0) student.score = match.score;

                            // Explicitly copy area nets if present in AYT report
                            if (match.sayNet !== undefined) student.sayNet = match.sayNet;
                            if (match.eaNet !== undefined) student.eaNet = match.eaNet;
                            if (match.sozNet !== undefined) student.sozNet = match.sozNet;
                            if (match.dilNet !== undefined) student.dilNet = match.dilNet;
                            
                            // Cleanup used matches
                            if (sNum) secondMapByNumber.delete(sNum);
                            else secondMapByName.delete(sNameKey);
                        } else {
                            student.tyt = student.totalNet;
                        }
                    });

                    secondMapByNumber.forEach((match) => {
                        finalResults.push({ ...match, tyt: 0, examType: safeExamType });
                    });
                    secondMapByName.forEach((match) => {
                        finalResults.push({ ...match, tyt: 0, examType: safeExamType });
                    });
                } else if (isCombined && !secondSheet) {
                    // Single sheet combo: totalNet might already contain everything, or we split it
                    finalResults.forEach(r => {
                        // Calculate TYT portion specifically
                        const tytKeys = ["turkce", "mat", "fen", "sosyal"];
                        const tytNet = Object.keys(r.subjects)
                            .filter(k => tytKeys.includes(k))
                            .reduce((sum, k) => sum + (r.subjects[k].net || 0), 0);
                        r.tyt = parseFloat(tytNet.toFixed(2));
                    });
                }

                resolve({
                    results: finalResults,
                    metadata: { ...tytOutput.detectedInfo, examType: safeExamType }
                });
            } catch (error) {
                console.error("Excel Parser Error:", error);
                reject(error.message);
            }
        };
        reader.onerror = (err) => reject("Dosya okunurken hata oluştu.");
        reader.readAsArrayBuffer(file);
    });
};
