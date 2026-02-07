import * as XLSX from 'xlsx';

/**
 * Parses an Excel file for Exam Results.
 * Auto-detects headers for: Student Name, TYT/AYT/YKS scores, and specific subjects (Turkce, Mat, Fen, Sosyal).
 * 
 * @param {File} file - The uploaded Excel file.
 * @returns {Promise<Array>} - Array of standardized student result objects.
 */
/**
 * Parses an Excel file for Exam Results.
 * Auto-detects headers for: Student Name, TYT/AYT/YKS scores, and specific subjects (Turkce, Mat, Fen, Sosyal).
 * Now supports Detailed Analysis: Detects "Doğru" (D), "Yanlış" (Y), and "Net" (N) columns for each subject.
 * 
 * @param {File} file - The uploaded Excel file.
 * @returns {Promise<Array>} - Array of standardized student result objects.
 */
export const parseExcelExamData = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                let workbook;
                try {
                    const data = e.target.result;
                    workbook = XLSX.read(data, { type: 'array' });
                } catch (readErr) {
                    throw new Error(`Excel dosyası okunamadı. Dosya bozuk veya şifreli olabilir. (${readErr.message})`);
                }

                const firstSheetName = workbook.SheetNames[0];
                if (!firstSheetName) {
                    throw new Error("Excel dosyasında çalışma sayfası bulunamadı.");
                }
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to array of arrays (loosest format to find headers)
                let jsonData;
                try {
                    jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                } catch (jsonErr) {
                    throw new Error(`Excel verisi tabloya dönüştürülemedi. (${jsonErr.message})`);
                }
                console.log("Step 1: JSON data extracted.");

                if (!jsonData || jsonData.length === 0) {
                    throw new Error("Dosya boş veya Excel formatında değil.");
                }

                // 1. Metadata Extraction (School, Year, Class, Section) - BEFORE finding headers
                let detectedClass = "";
                let detectedSection = "";
                let detectedSchool = "";

                // Scan first 10 rows for metadata
                for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
                    const rowStr = (jsonData[i] || []).map(cell => String(cell)).join(" ").toUpperCase();

                    // Pattern: Match 8, 10, 11, 12. Exclude 9 explicitly or implicitly.
                    const classMatch = rowStr.match(/(8|10|11|12)\.\s*SINIF/i) || rowStr.match(/(8|10|11|12)\s*\/\s*([A-Z])/i);
                    if (classMatch) {
                        detectedClass = classMatch[1];
                        if (classMatch[2]) detectedSection = classMatch[2];
                    }

                    // Pattern: "A Şubesi"
                    const sectionMatch = rowStr.match(/\/\s*([A-Z])\s*ŞUBESI/i) || rowStr.match(/\s+([A-Z])\s+ŞUBESI/i);
                    if (sectionMatch && !detectedSection) {
                        detectedSection = sectionMatch[1];
                    }

                    // School Name (Heuristic: usually contains "LİSESİ" or "OKULU")
                    if (rowStr.includes("LİSESİ") || rowStr.includes("OKULU") || rowStr.includes("KOLEJİ")) {
                        detectedSchool = rowStr;
                    }
                }

                // 2. Find the Header Row
                let headerRowIndex = -1;
                const nameKeywords = ["ad", "isim", "name", "öğrenci", "ogrenci", "ad soyad", "adı"];

                // 2. Find the Header Row - ROBUST LOGIC
                let bestRowIndex = 0;
                let maxScore = 0;

                for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
                    const row = jsonData[i];
                    if (!row || row.length < 1) continue;

                    const rowStr = row.map(cell => String(cell).toLowerCase().trim());
                    let score = 0;

                    // Keywords scoring - Safe Includes
                    if (rowStr.some(c => c && (c.includes("ad") || c.includes("isim") || c.includes("name") || c.includes("öğrenci")))) score += 2;
                    if (rowStr.some(c => c && c.includes("soyad"))) score += 2;
                    if (rowStr.some(c => c && (c.includes("no") || c.includes("numara")))) score += 1;
                    if (rowStr.some(c => c && (c.includes("sınıf") || c.includes("şube")))) score += 1;
                    if (rowStr.some(c => c && (c.includes("türkçe") || c.includes("matematik")))) score += 1;

                    if (score > maxScore) {
                        maxScore = score;
                        bestRowIndex = i;
                    }
                }

                headerRowIndex = bestRowIndex;
                console.log(`Header detection selected row ${headerRowIndex} with score ${maxScore}`);

                if (!jsonData[headerRowIndex]) {
                    throw new Error("Başlık satırı okunamadı (Satır " + headerRowIndex + ").");
                }

                const headers = jsonData[headerRowIndex].map(h => String(h || "").trim().toLowerCase());

                // 2. Helper to find columns for a specific subject (Net, Correct, Incorrect)
                /* 
                   Strategy:
                   1. Find all columns that match the subject keyword (e.g. "mat").
                   2. Check their neighbors or suffixes for "d", "y", "n".
                   3. Map them to { d: idx, y: idx, net: idx }.
                */
                // 2. Advanced Column Mapper
                const mapSubjectColumns = (subjectKeywords) => {
                    const mapping = { net: -1, d: -1, y: -1 };

                    try {
                        // Helper to find index by regex
                        const findIndex = (regex) => headers.findIndex(h => regex.test(h));

                        const kwPattern = subjectKeywords.join("|");

                        // 1. Explicit NET (e.g. "Mat Net", "Mat N", "Matematik Net")
                        // matches: (mat|...) followed by space/dot/nothing then (net|n) end-of-param or space
                        mapping.net = findIndex(new RegExp(`(${kwPattern}).*[\\s\\.\\-\\_]?(net|n)$`, 'i'));

                        // 2. Explicit D/Y (Correct/Incorrect)
                        mapping.d = findIndex(new RegExp(`(${kwPattern}).*[\\s\\.\\-\\_]?(doğru|dogru|d)$`, 'i'));
                        mapping.y = findIndex(new RegExp(`(${kwPattern}).*[\\s\\.\\-\\_]?(yanlış|yanlis|y)$`, 'i'));

                        // 3. Implicit NET (Just "Matematik" or "Türkçe")
                        // Only if we haven't found an explicit Net column, use the subject name itself
                        // But ensure it's NOT the D or Y column we just found
                        if (mapping.net === -1) {
                            const simpleMatch = findIndex(new RegExp(`^(${kwPattern})$`, 'i'));
                            if (simpleMatch !== -1 && simpleMatch !== mapping.d && simpleMatch !== mapping.y) {
                                mapping.net = simpleMatch;
                            }
                        }

                        // 4. Fallback: Contains subject name but doesn't contain D/Y (and is not Name)
                        if (mapping.net === -1) {
                            // Look for headers containing subject keyword but NOT d/y/correct/incorrect
                            mapping.net = headers.findIndex(h =>
                                h && subjectKeywords.some(kw => h.includes(kw)) &&
                                !/d|y|dogru|doğru|yanlış|yanlis/i.test(h)
                            );
                        }

                    } catch (err) {
                        console.error("Mapping error for keywords:", subjectKeywords, err);
                    }
                    return mapping;
                };

                // 3. Map Columns Defensively - IMPROVED FOR OFFICIAL LISTS
                const safeFind = (keywords) => {
                    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
                    // 1. Exact match first (Priority for "Adı", "Soyadı", "Öğrenci No")
                    let idx = normalizedHeaders.findIndex(h => keywords.some(kw => h === kw));
                    if (idx !== -1) return idx;

                    // 2. Contains match (Relaxed)
                    return normalizedHeaders.findIndex(h => h && keywords.some(kw => h.includes(kw)));
                };

                const colMap = {
                    // Specific columns matching the User's Image
                    firstName: safeFind(["adı", "adi", "ad"]),
                    lastName: safeFind(["soyadı", "soyadi", "soyad"]),
                    number: safeFind(["öğrenci no", "ogrenci no", "no", "numara"]),
                    gender: safeFind(["cinsiyeti", "cinsiyet"]),
                    boarding: safeFind(["pansiyon", "barınma"]),

                    // Fallback for full name if separate columns don't exist
                    name: safeFind(["ad soyad", "adı soyadı", "isim soyisim", "student"]),

                    // Other metadata
                    grade: safeFind(["sınıf", "sinif", "şube"]),
                    tyt: safeFind(["tyt puan", "tyt net", "tyt total", "tyt"]),
                    rank: safeFind(["sıra", "derece", "rank"]),

                    turkce: mapSubjectColumns(["türkçe", "turkce", "tr"]),
                    mat: mapSubjectColumns(["matematik", "mat"]),
                    fen: mapSubjectColumns(["fen", "fizik"]),
                    sosyal: mapSubjectColumns(["sosyal", "tarih"])
                };

                // Validate critical column
                // Logic: If we have separate First/Last Name columns, we can reconstruct Name.
                // If we only have Name column, we use that.
                if (colMap.name === -1 && (colMap.firstName === -1 || colMap.lastName === -1)) {
                    // Try column 0 as fallback only if absolutely nothing found
                    // But for official lists, let's be strict or smart.
                    if (colMap.firstName !== -1 && colMap.lastName === -1) {
                        // Found First Name but no Last Name? Treat as Full Name
                        colMap.name = colMap.firstName;
                    } else {
                        colMap.name = 0;
                        console.warn("Name column not identified, defaulting to column 0.");
                    }
                }

                console.log("Step 3: Column mapping completed.", colMap);

                // 3. Extract Data & Metadata
                let metadataColumns = [];
                try {
                    const usedIndices = new Set([
                        colMap.name, colMap.tyt, colMap.rank,
                        colMap.turkce.d, colMap.turkce.y, colMap.turkce.net,
                        colMap.mat.d, colMap.mat.y, colMap.mat.net,
                        colMap.fen.d, colMap.fen.y, colMap.fen.net,
                        colMap.sosyal.d, colMap.sosyal.y, colMap.sosyal.net
                    ]);

                    // Identify Metadata Columns (Any column NOT in usedIndices)
                    metadataColumns = headers.map((h, idx) => {
                        if (usedIndices.has(idx) || idx === -1 || !h) return null;
                        // Capitalize first letter for display
                        const label = h.charAt(0).toUpperCase() + h.slice(1);
                        return { index: idx, label };
                    }).filter(Boolean);
                    console.log("Step 4: Metadata columns identified.", metadataColumns);
                } catch (metaErr) {
                    console.warn("Metadata columns error, continuing without extra metadata:", metaErr);
                    // Continue without metadata if this fails
                }

                const results = [];
                console.log("Step 5: Starting data extraction loop.");
                for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || row.length === 0) continue;

                    // Name Logic: Combine First + Last if available, else use Full Name col
                    let rawName = "";
                    if (colMap.firstName !== -1 && colMap.lastName !== -1) {
                        const first = row[colMap.firstName] || "";
                        const last = row[colMap.lastName] || "";
                        rawName = `${first} ${last}`.trim();
                    } else {
                        rawName = colMap.name !== -1 ? row[colMap.name] : row[0];
                    }

                    if (!rawName) continue;

                    // SMART FILTERING: Exclude non-student rows
                    const nameStr = String(rawName).toLowerCase();
                    const invalidKeywords = ["ortalama", "toplam", "genel", "ders", "kurum", "okul", "ilçe", "il", "derece"];
                    if (invalidKeywords.some(kw => kw && nameStr.includes(kw))) {
                        continue;
                    }

                    try {
                        const parseNum = (val) => {
                            if (typeof val === 'number') return val;
                            if (!val) return 0;
                            const float = parseFloat(String(val).replace(',', '.'));
                            return isNaN(float) ? 0 : float;
                        };

                        const extractSubjectStats = (mapping) => {
                            const d = mapping.d !== -1 ? parseNum(row[mapping.d]) : 0;
                            const y = mapping.y !== -1 ? parseNum(row[mapping.y]) : 0;
                            let net = mapping.net !== -1 ? parseNum(row[mapping.net]) : 0;

                            // Auto-calculate Net if missing but D/Y exist (Standard: D - Y/4)
                            if (net === 0 && d > 0) {
                                net = d - (y / 4);
                            }
                            return { d, y, net };
                        };

                        // Capture Metadata
                        const metadata = {};
                        metadataColumns.forEach(col => {
                            const val = row[col.index];
                            if (val !== undefined && val !== null && val !== '') {
                                metadata[col.label] = val;
                            }
                        });

                        const result = {
                            student: String(rawName).trim(),
                            number: colMap.number !== -1 ? row[colMap.number] : null,
                            firstName: colMap.firstName !== -1 ? row[colMap.firstName] : null,
                            lastName: colMap.lastName !== -1 ? row[colMap.lastName] : null,
                            gender: colMap.gender !== -1 ? row[colMap.gender] : null,
                            boarding: colMap.boarding !== -1 ? row[colMap.boarding] : null,

                            tyt: colMap.tyt !== -1 ? parseNum(row[colMap.tyt]) : 0,
                            rank: colMap.rank !== -1 ? row[colMap.rank] : (i - headerRowIndex),
                            subjects: {
                                turkce: extractSubjectStats(colMap.turkce),
                                mat: extractSubjectStats(colMap.mat),
                                fen: extractSubjectStats(colMap.fen),
                                sosyal: extractSubjectStats(colMap.sosyal),
                            },
                            metadata: metadata // Store extra info here
                        };

                        // Auto-calculate Total TYT if missing
                        if (result.tyt === 0) {
                            result.tyt = result.subjects.turkce.net + result.subjects.mat.net + result.subjects.fen.net + result.subjects.sosyal.net;
                        }

                        results.push(result);
                    } catch (rowError) {
                        console.warn(`Row parsing skipped for index ${i}:`, rowError);
                        continue;
                    }
                }
                console.log("Step 6: Data extraction complete. Resolving results.");

                resolve({
                    results,
                    metadata: {
                        school: detectedSchool,
                        classLevel: detectedClass,
                        section: detectedSection,
                        title: `${detectedClass}. Sınıf / ${detectedSection} Şubesi`
                    },
                    debugInfo: {
                        headers,
                        colMap,
                        firstRow: jsonData[headerRowIndex + 1] // Return first data row for debugging
                    }
                });

            } catch (error) {
                console.error("Excel Parser Fatal Error:", error);
                reject(error.message || "Excel işlenirken bilinmeyen bir hata oluştu.");
            }
        };

        reader.onerror = (err) => reject("Dosya okuma hatası: " + err);
        reader.readAsArrayBuffer(file);
    });
};
