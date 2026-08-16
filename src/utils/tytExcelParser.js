import * as XLSX from 'xlsx';

/**
 * 🎯 TYT DENEME EXCEL PARSER - ÖZEL FORMAT
 *
 * BEKLENEN EXCEL YAPISI (3 Satır Başlık):
 * ─────────────────────────────────────────────────────────────────────────────
 * Satır 1: Okul Adı  | | | TYT Türkçe | | | TYT Sosyal | ... | TYT Matematik | ... | TYT Fen | ... | Toplam | TYT
 * Satır 2: Sınav Adı | | | Türkçe | | | Tarih-1 | | | Coğrafya-1 | | | Felsefe | | | Din Kül | | | Felsefe(Seç) | | | Toplam | Matematik-1 | ... | Geometri | ... | Toplam | Fizik | ... | Kimya | ... | Biyoloji | ... | Toplam | | | | Puan | Dereceler
 * Satır 3: Öğr.No | Ad, Soyad | Sınıf | D | Y | N | D | Y | N | ... (15 grup) | | Sınıf | Kurum | İlçe | İl | Genel
 * Satır 4: Genel Ortalama (ATLANIR)
 * Satır 5: Kurum Ortalaması (ATLANIR)
 * Satır 6+: Öğrenci verileri
 * ─────────────────────────────────────────────────────────────────────────────
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

// Ders adından normalize anahtar üret
const toSubjectKey = (name, category = '') => {
    const n = normalizeTR(name);
    const c = normalizeTR(category);

    if (n.includes('turkce') || n.includes('turkçe')) return 'tyt_turkce';
    if (n.includes('tarih-1') || n.includes('tarih 1')) return 'tyt_tarih';
    if (n.includes('tarih')) return 'tyt_tarih';
    if (n.includes('cografya-1') || n.includes('cografya 1') || n.includes('coğrafya 1')) return 'tyt_cografya';
    if (n.includes('cografya') || n.includes('coğrafya')) return 'tyt_cografya';
    if ((n.includes('felsefe') && (n.includes('sec') || n.includes('seç')))) return 'tyt_felsefe_secmeli';
    if (n.includes('felsefe')) return 'tyt_felsefe';
    if (n.includes('din')) return 'tyt_din';
    if (n.includes('matematik') || n === 'mat-1' || n === 'mat 1' || n === 'matematik-1') return 'tyt_matematik';
    if (n.includes('geometri')) return 'tyt_geometri';
    if (n.includes('fizik')) return 'tyt_fizik';
    if (n.includes('kimya')) return 'tyt_kimya';
    if (n.includes('biyoloji')) return 'tyt_biyoloji';

    // "Toplam" birden fazla yerde geçiyor - kategori ile ayırt et
    if (n === 'toplam' || n.includes('toplam')) {
        if (c.includes('sosyal') || c.includes('tyt sosyal')) return 'tyt_sosyal_toplam';
        if (c.includes('matematik') || c.includes('tyt mat')) return 'tyt_mat_toplam';
        if (c.includes('fen') || c.includes('tyt fen')) return 'tyt_fen_toplam';
        return 'tyt_toplam_genel';
    }

    // Bilinmeyen: adı temizleyerek döndür
    return n.replace(/[^a-z0-9_]/g, '_') || 'bilinmeyen';
};

/**
 * Ana parse fonksiyonu
 */
export const parseTYTExcel = (file) => {
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

                // Ham veriyi 2D array olarak al - birleşik hücreler için raw okuma
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                    defval: '',
                    raw: false,
                    blankrows: true
                });

                if (!jsonData || jsonData.length < 4) {
                    throw new Error('Excel dosyası çok az veri içeriyor (en az 4 satır gerekli).');
                }

                console.log('📊 TYT Parser başladı. Toplam satır:', jsonData.length);
                console.log('📋 İlk 6 satır özeti:');
                jsonData.slice(0, 6).forEach((row, i) => {
                    console.log(`  Satır ${i}:`, row.slice(0, 8).map(c => `"${c}"`).join(' | '), '...');
                });

                // ══════════════════════════════════════════════════════════════
                // ADIM 1: METRİK SATIRINI BUL (D, Y, N içeren satır)
                // Bu satır aynı zamanda Öğr.No, Ad Soyad, Sınıf içerir.
                // ══════════════════════════════════════════════════════════════
                let metricsRowIndex = -1;

                for (let i = 0; i < Math.min(jsonData.length, 15); i++) {
                    const row = jsonData[i];
                    if (!row || row.length < 5) continue;

                    // D, Y, N sayısını say (tek harf olarak)
                    const dynCount = row.filter(c => {
                        const s = String(c || '').trim().toUpperCase();
                        return s === 'D' || s === 'Y' || s === 'N';
                    }).length;

                    // "Öğr" veya ilk sütunun öğrenci no gibi görünmesi
                    const firstCells = row.slice(0, 5).map(c => normalizeTR(String(c || '')));
                    const hasStudentInfo = firstCells.some(c =>
                        c.includes('ogr') || c.includes('no') || c.includes('ad') || c.includes('sinif')
                    );

                    // Yeterli D,Y,N varsa VE öğrenci bilgisi varsa bu satırdır
                    if (dynCount >= 6 && hasStudentInfo) {
                        metricsRowIndex = i;
                        console.log(`✅ Metrik satırı bulundu: Satır ${i} (${dynCount} adet D/Y/N)`);
                        break;
                    }

                    // Fallback: Çok fazla D,Y,N varsa (öğrenci bilgisi olmasa bile)
                    if (dynCount >= 12) {
                        metricsRowIndex = i;
                        console.log(`✅ Metrik satırı (fallback) bulundu: Satır ${i} (${dynCount} adet D/Y/N)`);
                        break;
                    }
                }

                // Eğer bulunamadıysa - Doğru/Yanlış/Net içeren satırı ara
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
                        'Lütfen TYT deneme Excel dosyasının doğru formatta olduğundan emin olun.'
                    );
                }

                // ══════════════════════════════════════════════════════════════
                // ADIM 2: 3 KATMANLI BAŞLIK SATIRLARINI OKU
                // Satır M-2: Ana kategori (TYT Türkçe, TYT Sosyal, ...)
                // Satır M-1: Alt ders adları (Türkçe, Tarih-1, Coğrafya-1, ...)
                // Satır M  : Metrikler (Öğr.No, Ad Soyad, Sınıf, D, Y, N, ...)
                // ══════════════════════════════════════════════════════════════
                const metricsRow = jsonData[metricsRowIndex] || [];
                const subjectRow = metricsRowIndex >= 1 ? (jsonData[metricsRowIndex - 1] || []) : [];
                const categoryRow = metricsRowIndex >= 2 ? (jsonData[metricsRowIndex - 2] || []) : [];

                // Okul adı ve sınav adı
                const schoolName = String(categoryRow[0] || '').trim() ||
                    String((jsonData[0] || [])[0] || '').trim();
                const examName = String(subjectRow[0] || '').trim() ||
                    String((jsonData[1] || [])[0] || '').trim();

                console.log('🏫 Okul:', schoolName);
                console.log('📝 Sınav:', examName);

                // ══════════════════════════════════════════════════════════════
                // ADIM 3: SÜTUN HARİTASINI OLUŞTUR
                // Birleştirilmiş hücre simülasyonu: boş hücre → önceki değeri kullan
                // ══════════════════════════════════════════════════════════════
                const maxCols = Math.max(metricsRow.length, subjectRow.length, categoryRow.length);

                // Yatay birleşik hücre simülasyonu
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

                // Öğrenci bilgi sütunlarını dinamik olarak tespit et
                const STUDENT_COLS = {
                    no: 0,
                    name: 1,
                    grade: 2,
                };

                // Başlık satırında (metricsRow) isim ve no ara
                metricsRow.forEach((cell, idx) => {
                    const c = normalizeTR(String(cell || ''));
                    if ((c.includes('ad') && (c.includes('soyad') || c.includes('isim'))) || c === 'ogrenci' || c === 'ad soyad') {
                        STUDENT_COLS.name = idx;
                    } else if (c.includes('no') || c.includes('numara') || c.includes('ogr_no') || c === 'sn' || c === 'okul no') {
                        STUDENT_COLS.no = idx;
                    } else if (c.includes('sinif') || c.includes('sube') || c === 'snf' || c === 'derece') {
                        // "derece" bazen sınıf bilgisi içeren sütun olabiliyor bazı formatlarda
                        if (!c.includes('genel')) STUDENT_COLS.grade = idx;
                    }
                });

                console.log('📍 Tespit edilen sütunlar:', STUDENT_COLS);

                // Ders gruplarını bul: Her "D" sütunu bir grubun başlangıcı
                const subjectGroups = []; // { key, name, category, dCol, yCol, nCol }

                let currentSubject = '';
                let currentCategory = '';

                for (let col = 3; col < maxCols; col++) {
                    const rawMetric = String(metricsRow[col] || '').trim().toUpperCase();
                    const rawSubject = String(subjectRow[col] || '').trim();
                    const rawCategory = String(categoryRow[col] || '').trim();

                    // Aktif ders/kategori ismini güncelle
                    if (rawSubject) currentSubject = rawSubject;
                    if (rawCategory) currentCategory = rawCategory;

                    // "D" sütunu → yeni ders grubu başlıyor
                    if (rawMetric === 'D' || rawMetric === 'DOĞRU' || rawMetric === 'DOGRU') {
                        // Y ve N sütunlarının bir sonraki iki sütunda olmasını bekle
                        const yCol = col + 1;
                        const nCol = col + 2;

                        const subjectKey = toSubjectKey(currentSubject, currentCategory);

                        subjectGroups.push({
                            key: subjectKey,
                            name: (currentSubject || currentCategory) + ' (TYT)',
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

                // Puan ve sıralama sütunlarını bul
                // - subjectRow (satır 2) ve metricsRow (satır 3) birlikte kontrol edilir
                // - Puan: subjectRow'da "Puan" kelimesi geçiyor (metricsRow'da boş)
                // - Sıralamalar: metricsRow'da "Sınıf", "Kurum", "İlçe", "İl", "Genel" geçiyor
                let puanCol = -1;
                const rankCols = { sinif: -1, kurum: -1, ilce: -1, il: -1, genel: -1 };

                // Son D/Y/N grubundan sonraki kolonu bul
                const lastSubjectEndCol = subjectGroups.length > 0
                    ? subjectGroups[subjectGroups.length - 1].nCol
                    : 3;

                for (let col = 3; col < maxCols; col++) {
                    const metric = normalizeTR(String(metricsRow[col] || ''));
                    // subExpanded: birleşik hücre simülasyonu yapılmış satır 2
                    const subjectExp = normalizeTR(String(subExpanded[col] || ''));
                    const rawSubjectCell = normalizeTR(String(subjectRow[col] || ''));

                    // Puan: satır 2'de "Puan" geçiyor, satır 3 boş
                    if ((rawSubjectCell.includes('puan') || subjectExp.includes('puan') || metric.includes('puan'))
                        && col > lastSubjectEndCol) {
                        puanCol = col;
                        console.log(`💰 Puan sütunu bulundu: col ${col}`);
                    }

                    // Sıralamalar: satır 3'te isimleri var, son D/Y/N grubundan sonra
                    if (col > lastSubjectEndCol) {
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
                }

                // Puan sütunu fallback: D/Y/N gruplarının bitiminden +1 sonraki sütun
                // (Başlık satırında "Puan" boş bırakılmış olabilir)
                if (puanCol === -1 && lastSubjectEndCol > 3) {
                    // 15 gruptan sonra boş sütun var, sonrası puan
                    const candidateCol = lastSubjectEndCol + 1;
                    // Bu sütunda gerçekten puan benzeri veri var mı? İlk öğrenci satırından kontrol
                    const firstDataRow = jsonData[metricsRowIndex + 3]; // Ortalama satırları atla
                    if (firstDataRow && firstDataRow[candidateCol]) {
                        const val = parseNum(firstDataRow[candidateCol]);
                        if (val > 100) { // TYT puanı 100'den büyük olur (100-500 arası)
                            puanCol = candidateCol;
                            console.log(`💰 Puan sütunu (fallback): col ${puanCol}, örnek değer: ${val}`);
                        }
                    }
                }

                console.log(`📊 Bulunan dersler (${subjectGroups.length}):`, subjectGroups.map(s => s.key).join(', '));
                console.log(`📊 Puan: ${puanCol}, Sıralamalar:`, rankCols);

                // ══════════════════════════════════════════════════════════════
                // ADIM 4: ÖĞRENCİ VERİLERİNİ OKU
                // Metrik satırından sonraki satırlardan başla.
                // "Genel Ortalama", "Kurum Ortalaması" gibi satırları atla.
                // ══════════════════════════════════════════════════════════════
                // Sadece özet/ortalama satırlarını atla
                // NOT: 'toplam' ve 'okul' öğrenci isimlerinde de geçebileceğinden kaldırıldı
                const SKIP_KEYWORDS = [
                    'ortalama:',          // "Genel Ortalama:", "Kurum Ortalaması:"
                    'genel ortalama',     // adın tamamı bu ise
                    'kurum ortalamasi',   // normalize edilmiş hali
                    'il ortalamasi',
                    'ilce ortalamasi',
                ];

                const students = [];

                for (let rowIdx = metricsRowIndex + 1; rowIdx < jsonData.length; rowIdx++) {
                    const row = jsonData[rowIdx];
                    if (!row || row.length === 0) continue;

                    // Öğrenci adı
                    const rawName = String(row[STUDENT_COLS.name] || '').trim();
                    const rawNo = String(row[STUDENT_COLS.no] || '').trim();

                    if (!rawName && !rawNo) continue;

                    // Geçersiz satırları atla (özet/ortalama satırları)
                    // Ad Soyad sütununu kontrol et
                    const nameNorm = normalizeTR(rawName);
                    const noNorm = normalizeTR(rawNo);
                    const isSkipRow = SKIP_KEYWORDS.some(kw => {
                        const kwNorm = normalizeTR(kw);
                        return nameNorm.includes(kwNorm) || noNorm.includes(kwNorm);
                    });
                    // Ayrıca "Genel Ortalama:" gibi satırları adın kendisiyle de yakala
                    const looksLikeSummary = /ortalama|ortalamasi/i.test(rawName) ||
                        (/ortalama/i.test(rawNo));
                    if (isSkipRow || looksLikeSummary) {
                        console.log(`⏭️ Satır ${rowIdx} atlandı (özet satırı): "${rawName}"`);
                        continue;
                    }

                    // Sadece öğrenci no varsa, isim yoksa atla
                    if (!rawName) continue;

                    // ─── Sınıf Bilgisi ───────────────────────────────────────
                    const rawGrade = String(row[STUDENT_COLS.grade] || '').trim();
                    let grade = '';
                    let section = '';

                    // "12-A", "12/A", "11 A", "9. Sınıf", "10B" gibi formatları ayır
                    // Excel'deki format: "12-A" (tire ile)
                    const gradeMatch = rawGrade.match(/(8|9|10|11|12)\s*[-\/\.]?\s*([A-Za-z])/);
                    if (gradeMatch) {
                        grade = gradeMatch[1];
                        section = gradeMatch[2] ? gradeMatch[2].toUpperCase() : '';
                    } else {
                        // Sadece sayı varsa
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

                        // Net sütunu boş veya 0 ise D ve Y'den hesapla
                        if ((net === 0 || row[subj.nCol] === '' || row[subj.nCol] === undefined) && d > 0) {
                            net = parseFloat((d - (y * 0.25)).toFixed(2));
                        }

                        subjects[subj.key] = {
                            d,
                            y,
                            net,
                            name: subj.name,
                        };
                    });

                    // ─── Ana Ders Netleri (Geriye Dönük Uyumluluk) ──────────
                    const turkceNet = subjects['tyt_turkce']?.net || 0;

                    // Sosyal: önce toplam sütunundan, yoksa alt derslerden topla
                    const sosyalNet = subjects['tyt_sosyal_toplam']?.net ||
                        (
                            (subjects['tyt_tarih']?.net || 0) +
                            (subjects['tyt_cografya']?.net || 0) +
                            (subjects['tyt_felsefe']?.net || 0) +
                            (subjects['tyt_din']?.net || 0) +
                            (subjects['tyt_felsefe_secmeli']?.net || 0)
                        );

                    // Matematik: önce toplam sütunundan, yoksa alt derslerden topla
                    const matNet = subjects['tyt_mat_toplam']?.net ||
                        (
                            (subjects['tyt_matematik']?.net || 0) +
                            (subjects['tyt_geometri']?.net || 0)
                        );

                    // Fen: önce toplam sütunundan, yoksa alt derslerden topla
                    const fenNet = subjects['tyt_fen_toplam']?.net ||
                        (
                            (subjects['tyt_fizik']?.net || 0) +
                            (subjects['tyt_kimya']?.net || 0) +
                            (subjects['tyt_biyoloji']?.net || 0)
                        );

                    // Genel toplam: toplam_genel sütunundan, yoksa 4 ana gruptan
                    const totalNet = subjects['tyt_toplam_genel']?.net ||
                        parseFloat((turkceNet + sosyalNet + matNet + fenNet).toFixed(2));

                    // TYT Puanı
                    const score = puanCol !== -1 ? parseNum(row[puanCol]) : 0;

                    // Sıralamalar
                    const ranks = {
                        sinif: rankCols.sinif !== -1 ? parseNum(row[rankCols.sinif]) : 0,
                        kurum: rankCols.kurum !== -1 ? parseNum(row[rankCols.kurum]) : 0,
                        ilce: rankCols.ilce !== -1 ? parseNum(row[rankCols.ilce]) : 0,
                        il: rankCols.il !== -1 ? parseNum(row[rankCols.il]) : 0,
                        genel: rankCols.genel !== -1 ? parseNum(row[rankCols.genel]) : 0,
                    };

                    students.push({
                        // Temel öğrenci bilgisi
                        student: rawName,
                        number: rawNo,
                        grade: grade,
                        section: section,

                        // Puan & sıralama
                        score: score,
                        ranks: ranks,

                        // Detaylı ders verileri (key → { d, y, net, name })
                        subjects: subjects,

                        // ─── Geriye dönük uyumluluk alanları ───────────────
                        // AdvancedExamsTab, ReportCard vb. bileşenler bunları kullanıyor

                        // subjects.turkce, subjects.mat, subjects.fen, subjects.sosyal
                        // zaten 'subjects' objesinde var.
                        // Ek olarak "flat" formatı da sağlayalım:
                        turkce: turkceNet,
                        sosyal: sosyalNet,
                        mat: matNet,
                        fen: fenNet,

                        totalNet: totalNet,
                        tyt: totalNet, // eski format uyumluluğu

                        examType: 'TYT',
                    });

                    // İlk 3 öğrenciyi debug amaçlı logla
                    if (students.length <= 3) {
                        console.log(`👤 Öğrenci #${students.length}:`, {
                            name: rawName,
                            grade: `${grade}/${section}`,
                            turkce: turkceNet.toFixed(2),
                            mat: matNet.toFixed(2),
                            fen: fenNet.toFixed(2),
                            sosyal: sosyalNet.toFixed(2),
                            totalNet: totalNet.toFixed(2),
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

                console.log(`✅ ${students.length} öğrenci başarıyla okundu.`);

                resolve({
                    success: true,
                    results: students,
                    metadata: {
                        school: schoolName,
                        examName: examName,
                        totalStudents: students.length,
                        subjects: subjectGroups.map(s => ({ key: s.key, name: s.name, category: s.category })),
                        examType: 'TYT',
                        metricsRowIndex,
                    },
                    debugInfo: {
                        subjectGroups,
                        puanCol,
                        rankCols,
                        metricsRowIndex,
                    },
                });

            } catch (error) {
                console.error('❌ TYT Parser Hatası:', error);
                reject(error.message || 'Dosya işlenirken bilinmeyen bir hata oluştu.');
            }
        };

        reader.onerror = () => reject('Dosya okuma hatası: Dosya açılamadı.');
        reader.readAsArrayBuffer(file);
    });
};

export default parseTYTExcel;
