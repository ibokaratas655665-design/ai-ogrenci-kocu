import * as XLSX from 'xlsx';

/**
 * 🎯 AYT DENEME EXCEL PARSER - ÖZEL FORMAT
 *
 * BEKLENEN EXCEL YAPISI (3 Satır Başlık):
 * ─────────────────────────────────────────────────────────────────────────────
 * Satır 1: Okul Adı  | AYT Edebiyat | AYT Sosyal | AYT Matematik | AYT Fen | AYT Dil | ...
 * Satır 2: Sınav Adı | Türk Dili ve Edeb. | Tarih-1 | Coğ-1 | Tarih-2 | Coğ-2 | Felsefe | Din | Toplam | Matematik | Fizik | Kimya | Biyoloji | Toplam | Dil | Toplam | ...
 * Satır 3: Öğr.No | Ad, Soyad | Sınıf | D | Y | N | D | Y | N | ... | SAY | EA | SÖZ | DİL | Dereceler
 * Satır 4: Genel Ortalama (ATLANIR)
 * Satır 5: Kurum Ortalaması (ATLANIR)
 * Satır 6+: Öğrenci verileri
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * AYT DERS GRUPLARI:
 * ┌─ Edebiyat Grubu ──────────────────────────────────────────────────────────
 * │  Türk Dili ve Edebiyatı (40 soru)
 * ├─ Sosyal Grubu (SAY/EA/SÖZ için ortak) ─────────────────────────────────
 * │  Tarih-1 (10), Coğrafya-1 (5), Tarih-2 (5), Coğrafya-2 (5), Felsefe (5), Din (5)
 * ├─ Matematik/Fen Grubu (SAY için) ────────────────────────────────────────
 * │  Matematik (30), Fizik (14), Kimya (13), Biyoloji (13)
 * └─ Dil Grubu (DİL için) ──────────────────────────────────────────────────
 *    Yabancı Dil (80)
 *
 * PUAN TÜRLERİ:
 * - SAY (Sayısal): Edebiyat + Tarih-1 + Coğ-1 + Mat + Fen
 * - EA  (Eşit Ağırlık): Edebiyat + Tarih-1 + Coğ-1 + Tarih-2 + Coğ-2 + Felsefe + Din + Mat
 * - SÖZ (Sözel): Edebiyat + Tarih-1 + Coğ-1 + Tarih-2 + Coğ-2 + Felsefe + Din
 * - DİL (Yabancı Dil): Dil
 *
 * @param {File} file - Yüklenen .xlsx/.xls dosyası
 * @returns {Promise<Object>} - { results: [...], metadata: {...} }
 */

const parseNum = (val) => {
    if (typeof val === 'number') return parseFloat(val.toFixed(3));
    if (!val && val !== 0) return 0;
    const str = String(val).replace(',', '.').trim();
    const float = parseFloat(str);
    return isNaN(float) ? 0 : float;
};

// Türkçe karakterleri ASCII'ye çevir (anahtar üretimi için)
const normalizeTR = (str) => {
    if (!str) return '';
    return String(str)
        .toLowerCase()
        .replace(/ı/g, 'i').replace(/İ/g, 'i')
        .replace(/ö/g, 'o').replace(/Ö/g, 'o')
        .replace(/ü/g, 'u').replace(/Ü/g, 'u')
        .replace(/ş/g, 's').replace(/Ş/g, 's')
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
        .replace(/ç/g, 'c').replace(/Ç/g, 'c')
        .trim();
};

/**
 * Ders adından normalize anahtar üret (AYT spesifik)
 */
const toAYTSubjectKey = (name, category = '') => {
    const n = normalizeTR(name);
    const c = normalizeTR(category);

    // ─── Edebiyat / Türkçe (AYT) ────────────────────────────────────────────
    if (n.includes('edebiyat') || n.includes('turk dili')) return 'ayt_edebiyat';
    if (n.includes('turkce') || n.includes('turkçe')) return 'ayt_turkce';

    // ─── Tarih ──────────────────────────────────────────────────────────────
    if (n.includes('tarih-2') || n.includes('tarih 2') || n === 'tarih2') return 'ayt_tarih2';
    if (n.includes('tarih-1') || n.includes('tarih 1') || n === 'tarih1') return 'ayt_tarih1';
    if (n.includes('tarih')) {
        // Kategori veya isim 2. tarih mi?
        if (c.includes('tarih-2') || c.includes('tarih2')) return 'ayt_tarih2';
        return 'ayt_tarih1';
    }

    // ─── Coğrafya ───────────────────────────────────────────────────────────
    if (n.includes('cografya-2') || n.includes('cografya 2') || n === 'cografya2' || n.includes('cog-2') || n.includes('cog2')) return 'ayt_cografya2';
    if (n.includes('cografya-1') || n.includes('cografya 1') || n === 'cografya1' || n.includes('cog-1') || n.includes('cog1')) return 'ayt_cografya1';
    if (n.includes('coğrafya') || n.includes('cografya')) {
        if (c.includes('cografya-2') || c.includes('cog-2')) return 'ayt_cografya2';
        return 'ayt_cografya1';
    }

    // ─── Felsefe / Felsefe Grubu ─────────────────────────────────────────────
    if ((n.includes('felsefe') && (n.includes('sec') || n.includes('seç'))) || n.includes('felsefe grubu')) return 'ayt_felsefe_secmeli';
    if (n.includes('felsefe')) return 'ayt_felsefe';

    // ─── Din ────────────────────────────────────────────────────────────────
    if (n.includes('din')) return 'ayt_din';

    // ─── Matematik (AYT) ────────────────────────────────────────────────────
    if (n.includes('mat-2') || n.includes('mat 2') || n.includes('matematik 2') || n.includes('mat-ii') || n === 'mat2' || n === 'mat ii') return 'ayt_matematik';
    if (n.includes('matematik') || n === 'mat-1' || n === 'mat 1' || n === 'matematk' || n.includes('mat')) {
        // AYT mat tespiti - kategori TYT değilse veya isim AYT ima ediyorsa
        if (!c.includes('tyt') || n.includes('ayt')) return 'ayt_matematik';
    }
    if (n.includes('geometri')) return 'ayt_geometri';

    // ─── Fen Bilimleri ──────────────────────────────────────────────────────
    if (n.includes('fizik')) return 'ayt_fizik';
    if (n.includes('kimya')) return 'ayt_kimya';
    if (n.includes('biyoloji')) return 'ayt_biyoloji';

    // ─── Yabancı Dil ────────────────────────────────────────────────────────
    if (n.includes('yabanci dil') || n.includes('ingilizce') || n.includes('almanca') ||
        n.includes('fransizca') || n.includes('arapca') || n.includes('rusca') ||
        (n.includes('dil') && !n.includes('turk dili'))) return 'yabanci_dil';

    // ─── Toplam sütunları ───────────────────────────────────────────────────
    if (n === 'toplam' || n.includes('toplam')) {
        if (c.includes('edebiyat') || c.includes('ayt edeb')) return 'ayt_edebiyat_toplam';
        if (c.includes('sosyal') || c.includes('ayt sosyal')) return 'ayt_sosyal_toplam';
        if (c.includes('matematik') || c.includes('ayt mat') || c.includes('fen') || c.includes('ayt fen')) return 'ayt_fen_mat_toplam';
        if (c.includes('dil') || c.includes('ayt dil')) return 'ayt_dil_toplam';
        return 'ayt_toplam_genel';
    }

    // Bilinmeyen
    return n.replace(/[^a-z0-9_]/g, '_') || 'bilinmeyen';
};

/**
 * Ana parse fonksiyonu
 */
export const parseAYTExcel = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target.result;
                let workbook;
                try {
                    workbook = XLSX.read(data, { type: 'array', cellDates: false });
                } catch (readErr) {
                    throw new Error(`Excel dosyası okunamadı. Dosya bozuk veya şifreli olabilir. (${readErr.message})`);
                }

                const firstSheetName = workbook.SheetNames[0];
                if (!firstSheetName) throw new Error('Excel dosyasında çalışma sayfası bulunamadı.');

                const worksheet = workbook.Sheets[firstSheetName];

                // Ham veriyi 2D array olarak al
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                    defval: '',
                    raw: false,
                    blankrows: true
                });

                if (!jsonData || jsonData.length < 4) {
                    throw new Error('Excel dosyası çok az veri içeriyor (en az 4 satır gerekli).');
                }

                console.log('📊 AYT Parser başladı. Toplam satır:', jsonData.length);
                console.log('📋 İlk 6 satır özeti:');
                jsonData.slice(0, 6).forEach((row, i) => {
                    console.log(`  Satır ${i}:`, row.slice(0, 10).map(c => `"${c}"`).join(' | '), '...');
                });

                // ══════════════════════════════════════════════════════════════
                // ADIM 1: METRİK SATIRINI BUL (D, Y, N içeren satır)
                // ══════════════════════════════════════════════════════════════
                let metricsRowIndex = -1;

                for (let i = 0; i < Math.min(jsonData.length, 15); i++) {
                    const row = jsonData[i];
                    if (!row || row.length < 5) continue;

                    const dynCount = row.filter(c => {
                        const s = String(c || '').trim().toUpperCase();
                        return s === 'D' || s === 'Y' || s === 'N';
                    }).length;

                    const firstCells = row.slice(0, 5).map(c => normalizeTR(String(c || '')));
                    const hasStudentInfo = firstCells.some(c =>
                        c.includes('ogr') || c.includes('no') || c.includes('ad') || c.includes('sinif')
                    );

                    if (dynCount >= 6 && hasStudentInfo) {
                        metricsRowIndex = i;
                        console.log(`✅ Metrik satırı bulundu: Satır ${i} (${dynCount} adet D/Y/N)`);
                        break;
                    }

                    if (dynCount >= 12) {
                        metricsRowIndex = i;
                        console.log(`✅ Metrik satırı (fallback) bulundu: Satır ${i} (${dynCount} adet D/Y/N)`);
                        break;
                    }
                }

                // Fallback: Doğru/Yanlış/Net içeren satır
                if (metricsRowIndex === -1) {
                    for (let i = 0; i < Math.min(jsonData.length, 15); i++) {
                        const row = jsonData[i];
                        if (!row) continue;
                        const rowStr = row.map(c => normalizeTR(String(c))).join(' ');
                        if ((rowStr.includes('dogru') || rowStr.includes('yanlis')) && rowStr.includes('net')) {
                            metricsRowIndex = i;
                            console.log(`✅ Metrik satırı (Doğru/Yanlış/Net) bulundu: Satır ${i}`);
                            break;
                        }
                    }
                }

                if (metricsRowIndex === -1) {
                    throw new Error(
                        'Başlık satırı bulunamadı!\n\n' +
                        'Beklenen format: İlk 3 satır başlık (Okul Adı / Ders Adları / D-Y-N), ' +
                        'ardından öğrenci verileri.\n\n' +
                        'Lütfen AYT deneme Excel dosyasının doğru formatta olduğundan emin olun.'
                    );
                }

                // ══════════════════════════════════════════════════════════════
                // ADIM 2: 3 KATMANLI BAŞLIK SATIRLARINI OKU
                // ══════════════════════════════════════════════════════════════
                const metricsRow = jsonData[metricsRowIndex] || [];
                const subjectRow = metricsRowIndex >= 1 ? (jsonData[metricsRowIndex - 1] || []) : [];
                const categoryRow = metricsRowIndex >= 2 ? (jsonData[metricsRowIndex - 2] || []) : [];

                const schoolName = String(categoryRow[0] || '').trim() ||
                    String((jsonData[0] || [])[0] || '').trim();
                const examName = String(subjectRow[0] || '').trim() ||
                    String((jsonData[1] || [])[0] || '').trim();

                console.log('🏫 Okul:', schoolName);
                console.log('📝 Sınav:', examName);

                // ══════════════════════════════════════════════════════════════
                // ADIM 3: SÜTUN HARİTASINI OLUŞTUR
                // ══════════════════════════════════════════════════════════════
                const maxCols = Math.max(metricsRow.length, subjectRow.length, categoryRow.length);

                const expandRow = (row) => {
                    const expanded = [];
                    let lastVal = '';
                    for (let i = 0; i < maxCols; i++) {
                        const val = String(row[i] || '').trim();
                        if (val) lastVal = val;
                        expanded.push(val || lastVal);
                    }
                    return expanded;
                };

                const catExpanded = expandRow(categoryRow);
                const subExpanded = expandRow(subjectRow);

                // Öğrenci bilgi sütunları (dinamik tespit)
                const STUDENT_COLS = { no: 0, name: 1, grade: 2 };
                
                // Başlık satırında (metricsRow) isim ve no ara
                metricsRow.forEach((cell, idx) => {
                    const c = normalizeTR(String(cell || ''));
                    if ((c.includes('ad') && (c.includes('soyad') || c.includes('isim'))) || c === 'ogrenci' || c === 'ad soyad') {
                        STUDENT_COLS.name = idx;
                    } else if (c.includes('no') || c.includes('numara') || c.includes('ogr_no') || c === 'sn' || c === 'okul no') {
                        STUDENT_COLS.no = idx;
                    } else if (c.includes('sinif') || c.includes('sube') || c === 'snf' || c === 'derece') {
                        if (!c.includes('genel')) STUDENT_COLS.grade = idx;
                    }
                });

                // Ders gruplarını bul
                const subjectGroups = []; // { key, name, category, dCol, yCol, nCol }
                let currentSubject = '';
                let currentCategory = '';

                for (let col = 3; col < maxCols; col++) {
                    const rawMetric = String(metricsRow[col] || '').trim().toUpperCase();
                    const rawSubject = String(subjectRow[col] || '').trim();
                    const rawCategory = String(categoryRow[col] || '').trim();

                    if (rawSubject) currentSubject = rawSubject;
                    if (rawCategory) currentCategory = rawCategory;

                    if (rawMetric === 'D' || rawMetric === 'DOĞRU' || rawMetric === 'DOGRU') {
                        const yCol = col + 1;
                        const nCol = col + 2;
                        const subjectKey = toAYTSubjectKey(currentSubject, currentCategory);

                        subjectGroups.push({
                            key: subjectKey,
                            name: (currentSubject || currentCategory) + ' (AYT)',
                            category: currentCategory,
                            dCol: col,
                            yCol: yCol,
                            nCol: nCol,
                        });

                        console.log(`📚 Ders: "${currentSubject}" (${currentCategory}) → key:"${subjectKey}" D:${col} Y:${yCol} N:${nCol}`);
                    }
                }

                if (subjectGroups.length === 0) {
                    throw new Error(
                        'Ders sütunları bulunamadı! Excel dosyasında "D", "Y", "N" başlıklı sütunlar bulunması gerekiyor.'
                    );
                }

                // ══════════════════════════════════════════════════════════════
                // ADIM 4: PUAN SÜTUNLARINI BUL
                // AYT'de 4 farklı puan olabilir: SAY, EA, SÖZ, DİL
                // Ayrıca tek bir "Puan" sütunu da olabilir
                // ══════════════════════════════════════════════════════════════
                const lastSubjectEndCol = subjectGroups.length > 0
                    ? subjectGroups[subjectGroups.length - 1].nCol
                    : 3;

                // Puan sütunları
                const puanCols = {
                    say: -1,
                    ea: -1,
                    soz: -1,
                    dil: -1,
                    genel: -1,  // Tek puan sütunu varsa
                };

                // Sıralama sütunları
                const rankCols = { sinif: -1, kurum: -1, ilce: -1, il: -1, genel: -1 };

                for (let col = 3; col < maxCols; col++) {
                    const metric = normalizeTR(String(metricsRow[col] || ''));
                    const subjectCell = normalizeTR(String(subjectRow[col] || ''));
                    const rawSubjectCell = normalizeTR(String(subjectRow[col] || ''));
                    const rawMetricCell = normalizeTR(String(metricsRow[col] || ''));

                    if (col <= lastSubjectEndCol) continue; // Ders bölgesini atla

                    // SAY puanı
                    if (metric.includes('say') || rawSubjectCell.includes('say') || metric === 'sayisal') {
                        if (puanCols.say === -1) { puanCols.say = col; console.log(`💰 SAY puanı: col ${col}`); }
                    }
                    // EA puanı
                    else if (metric.includes('esit a') || metric === 'ea' || rawSubjectCell.includes('ea') || rawSubjectCell.includes('esit')) {
                        if (puanCols.ea === -1) { puanCols.ea = col; console.log(`💰 EA puanı: col ${col}`); }
                    }
                    // SÖZ puanı
                    else if (metric.includes('soz') || metric === 'sozel' || rawSubjectCell.includes('soz') || rawSubjectCell.includes('sozel')) {
                        if (puanCols.soz === -1) { puanCols.soz = col; console.log(`💰 SÖZ puanı: col ${col}`); }
                    }
                    // DİL puanı
                    else if (metric.includes('dil') || rawSubjectCell.includes('dil')) {
                        if (puanCols.dil === -1) { puanCols.dil = col; console.log(`💰 DİL puanı: col ${col}`); }
                    }
                    // Genel/tek puan
                    else if (metric.includes('puan') || rawSubjectCell.includes('puan')) {
                        if (puanCols.genel === -1) { puanCols.genel = col; console.log(`💰 Genel puan: col ${col}`); }
                    }

                    // Sıralamalar
                    if (metric === 'sinif' || metric.includes('sinif')) {
                        if (rankCols.sinif === -1) { rankCols.sinif = col; console.log(`📊 Sınıf rank: col ${col}`); }
                    }
                    if (metric === 'kurum' || metric.includes('kurum')) {
                        if (rankCols.kurum === -1) { rankCols.kurum = col; console.log(`📊 Kurum rank: col ${col}`); }
                    }
                    if (metric.includes('ilce') || metric.includes('ilçe')) {
                        if (rankCols.ilce === -1) { rankCols.ilce = col; console.log(`📊 İlçe rank: col ${col}`); }
                    }
                    if (metric === 'il') {
                        if (rankCols.il === -1) { rankCols.il = col; console.log(`📊 İl rank: col ${col}`); }
                    }
                    if (metric === 'genel') {
                        if (rankCols.genel === -1) { rankCols.genel = col; console.log(`📊 Genel rank: col ${col}`); }
                    }
                }

                // Fallback: Hiçbir puan sütunu bulunamadıysa — ders bölgesinden sonraki sütunu dene
                const anyPuanFound = Object.values(puanCols).some(v => v !== -1);
                if (!anyPuanFound && lastSubjectEndCol > 3) {
                    const candidateCol = lastSubjectEndCol + 1;
                    const firstDataRow = jsonData[metricsRowIndex + 3];
                    if (firstDataRow && firstDataRow[candidateCol]) {
                        const val = parseNum(firstDataRow[candidateCol]);
                        if (val > 100) {
                            puanCols.genel = candidateCol;
                            console.log(`💰 Puan sütunu (fallback): col ${candidateCol}, örnek değer: ${val}`);
                        }
                    }
                }

                console.log(`📊 Bulunan dersler (${subjectGroups.length}):`, subjectGroups.map(s => s.key).join(', '));
                console.log(`📊 Puan sütunları:`, puanCols);
                console.log(`📊 Sıralamalar:`, rankCols);

                // ══════════════════════════════════════════════════════════════
                // ADIM 5: ÖĞRENCİ VERİLERİNİ OKU
                // ══════════════════════════════════════════════════════════════
                const SKIP_KEYWORDS = [
                    'ortalama:',
                    'genel ortalama',
                    'kurum ortalamasi',
                    'il ortalamasi',
                    'ilce ortalamasi',
                ];

                const students = [];

                for (let rowIdx = metricsRowIndex + 1; rowIdx < jsonData.length; rowIdx++) {
                    const row = jsonData[rowIdx];
                    if (!row || row.length === 0) continue;

                    const rawName = String(row[STUDENT_COLS.name] || '').trim();
                    const rawNo = String(row[STUDENT_COLS.no] || '').trim();

                    if (!rawName && !rawNo) continue;

                    const nameNorm = normalizeTR(rawName);
                    const noNorm = normalizeTR(rawNo);
                    const isSkipRow = SKIP_KEYWORDS.some(kw => {
                        const kwNorm = normalizeTR(kw);
                        return nameNorm.includes(kwNorm) || noNorm.includes(kwNorm);
                    });
                    const looksLikeSummary = /ortalama|ortalamasi/i.test(rawName) || /ortalama/i.test(rawNo);

                    if (isSkipRow || looksLikeSummary) {
                        console.log(`⏭️ Satır ${rowIdx} atlandı (özet satırı): "${rawName}"`);
                        continue;
                    }

                    if (!rawName) continue;

                    // ─── Sınıf Bilgisi ───────────────────────────────────────
                    const rawGrade = String(row[STUDENT_COLS.grade] || '').trim();
                    let grade = '';
                    let section = '';

                    const gradeMatch = rawGrade.match(/(8|9|10|11|12)\s*[-\/\.]?\s*([A-Za-z])/);
                    if (gradeMatch) {
                        grade = gradeMatch[1];
                        section = gradeMatch[2] ? gradeMatch[2].toUpperCase() : '';
                    } else {
                        const numMatch = rawGrade.match(/(8|9|10|11|12)/);
                        grade = numMatch ? numMatch[1] : rawGrade;
                        section = '';
                    }

                    // ─── Ders Netleri ─────────────────────────────────────────
                    const subjects = {};

                    subjectGroups.forEach(subj => {
                        const d = parseNum(row[subj.dCol]);
                        const y = parseNum(row[subj.yCol]);
                        let net = parseNum(row[subj.nCol]);

                        if ((net === 0 || row[subj.nCol] === '' || row[subj.nCol] === undefined) && d > 0) {
                            net = parseFloat((d - (y * 0.25)).toFixed(2));
                        }

                        subjects[subj.key] = { d, y, net, name: subj.name };
                    });

                    // ─── AYT Puan Grubu Netleri ───────────────────────────────
                    // Edebiyat net
                    const edebiyatNet = subjects['ayt_edebiyat']?.net || 0;

                    // Sosyal netleri (tüm gruplara dahil olan ortak dersler)
                    const tarih1Net = subjects['ayt_tarih1']?.net || 0;
                    const cografya1Net = subjects['ayt_cografya1']?.net || 0;
                    const tarih2Net = subjects['ayt_tarih2']?.net || 0;
                    const cografya2Net = subjects['ayt_cografya2']?.net || 0;
                    const felsefeNet = subjects['ayt_felsefe']?.net || subjects['ayt_felsefe_secmeli']?.net || 0;
                    const dinNet = subjects['ayt_din']?.net || 0;

                    // Sosyal toplam (AYT)
                    const sosyalAYTNet = subjects['ayt_sosyal_toplam']?.net ||
                        (tarih1Net + cografya1Net + tarih2Net + cografya2Net + felsefeNet + dinNet);

                    // AYT Matematik
                    const aytMatNet = subjects['ayt_matematik']?.net || 0;
                    const geometriNet = subjects['ayt_geometri']?.net || 0;
                    const matToplamNet = subjects['ayt_fen_mat_toplam']?.net ||
                        (aytMatNet + geometriNet);

                    // Fen netleri
                    const fizikNet = subjects['ayt_fizik']?.net || 0;
                    const kimyaNet = subjects['ayt_kimya']?.net || 0;
                    const biyolojiNet = subjects['ayt_biyoloji']?.net || 0;
                    const fenNet = fizikNet + kimyaNet + biyolojiNet;

                    // Yabancı dil
                    const dilNet = subjects['yabanci_dil']?.net || subjects['ayt_dil_toplam']?.net || 0;

                    // ─── 4 Puan Türü ──────────────────────────────────────────
                    // Sayısal: AYT Mat + Fen
                    const sayToplamNet = parseFloat((aytMatNet + geometriNet + fenNet).toFixed(2));

                    // EA: Edebiyat + Tarih1 + Coğ1 + AYT Mat
                    const eaToplamNet = parseFloat((edebiyatNet + tarih1Net + cografya1Net + aytMatNet + geometriNet).toFixed(2));

                    // Sözel: Edebiyat + Tarih1 + Coğ1 + Tarih2 + Coğ2 + Felsefe + Din
                    const sozToplamNet = parseFloat((edebiyatNet + tarih1Net + cografya1Net + tarih2Net + cografya2Net + felsefeNet + dinNet).toFixed(2));

                    // Dil: Yabancı Dil
                    const dilToplamNet = dilNet;

                    // ─── Puan değerleri ───────────────────────────────────────
                    const scores = {
                        say: puanCols.say !== -1 ? parseNum(row[puanCols.say]) : 0,
                        ea: puanCols.ea !== -1 ? parseNum(row[puanCols.ea]) : 0,
                        soz: puanCols.soz !== -1 ? parseNum(row[puanCols.soz]) : 0,
                        dil: puanCols.dil !== -1 ? parseNum(row[puanCols.dil]) : 0,
                        genel: puanCols.genel !== -1 ? parseNum(row[puanCols.genel]) : 0,
                    };

                    // Genel skor: SAY > EA > SÖZ > DİL > Genel sırasıyla ilk bulunanı al
                    const score = scores.say || scores.ea || scores.soz || scores.dil || scores.genel;

                    // Sıralamalar
                    const ranks = {
                        sinif: rankCols.sinif !== -1 ? parseNum(row[rankCols.sinif]) : 0,
                        kurum: rankCols.kurum !== -1 ? parseNum(row[rankCols.kurum]) : 0,
                        ilce: rankCols.ilce !== -1 ? parseNum(row[rankCols.ilce]) : 0,
                        il: rankCols.il !== -1 ? parseNum(row[rankCols.il]) : 0,
                        genel: rankCols.genel !== -1 ? parseNum(row[rankCols.genel]) : 0,
                    };

                    students.push({
                        // ─── Temel öğrenci bilgisi ────────────────────────────
                        student: rawName,
                        number: rawNo,
                        grade: grade,
                        section: section,

                        // ─── Puan & sıralama ──────────────────────────────────
                        score: score,
                        scores: scores,   // { say, ea, soz, dil, genel }
                        ranks: ranks,

                        // ─── Detaylı ders verileri ────────────────────────────
                        subjects: subjects,

                        // ─── AYT puan grubu netleri (flat format) ────────────
                        edebiyat: edebiyatNet,
                        tarih1: tarih1Net,
                        cografya1: cografya1Net,
                        tarih2: tarih2Net,
                        cografya2: cografya2Net,
                        felsefe: felsefeNet,
                        din: dinNet,
                        sosyalAYT: sosyalAYTNet,
                        aytMat: aytMatNet,
                        geometri: geometriNet,
                        matToplam: matToplamNet,
                        fizik: fizikNet,
                        kimya: kimyaNet,
                        biyoloji: biyolojiNet,
                        fen: fenNet,
                        dil: dilToplamNet,

                        // ─── 4 puan grubu toplam netleri ─────────────────────
                        sayNet: sayToplamNet,
                        eaNet: eaToplamNet,
                        sozNet: sozToplamNet,
                        dilNet: dilToplamNet,

                        // ─── Geriye dönük uyumluluk ───────────────────────────
                        totalNet: sayToplamNet, // ana net olarak SAY seçildi (değiştirilebilir)
                        ayt: sayToplamNet,

                        examType: 'AYT',
                    });

                    // İlk 3 öğrenciyi debug amaçlı logla
                    if (students.length <= 3) {
                        console.log(`👤 Öğrenci #${students.length} (AYT):`, {
                            name: rawName,
                            grade: `${grade}/${section}`,
                            edebiyat: edebiyatNet.toFixed(2),
                            sosyalAYT: sosyalAYTNet.toFixed(2),
                            aytMat: aytMatNet.toFixed(2),
                            fen: fenNet.toFixed(2),
                            dil: dilToplamNet.toFixed(2),
                            sayNet: sayToplamNet.toFixed(2),
                            eaNet: eaToplamNet.toFixed(2),
                            sozNet: sozToplamNet.toFixed(2),
                            score: score,
                        });
                    }
                }

                if (students.length === 0) {
                    throw new Error(
                        'Hiç öğrenci verisi bulunamadı!\n\n' +
                        'Olası nedenler:\n' +
                        '• Excel dosyasında veri satırı yok\n' +
                        '• Tüm satırlar "Genel Ortalama" veya "Kurum Ortalaması" olarak tanımlandı\n' +
                        '• Ad/Soyad sütunu boş\n\n' +
                        `Tespit edilen başlık satırı: ${metricsRowIndex}. satır`
                    );
                }

                console.log(`✅ AYT Parser: ${students.length} öğrenci başarıyla okundu.`);

                resolve({
                    success: true,
                    results: students,
                    metadata: {
                        school: schoolName,
                        examName: examName,
                        totalStudents: students.length,
                        subjects: subjectGroups.map(s => ({ key: s.key, name: s.name, category: s.category })),
                        examType: 'AYT',
                        metricsRowIndex,
                        puanCols,
                    },
                    debugInfo: {
                        subjectGroups,
                        puanCols,
                        rankCols,
                        metricsRowIndex,
                    },
                });

            } catch (error) {
                console.error('❌ AYT Parser Hatası:', error);
                reject(error.message || 'Dosya işlenirken bilinmeyen bir hata oluştu.');
            }
        };

        reader.onerror = () => reject('Dosya okuma hatası: Dosya açılamadı.');
        reader.readAsArrayBuffer(file);
    });
};

export default parseAYTExcel;
