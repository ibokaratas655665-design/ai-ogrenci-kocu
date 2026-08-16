// 🛡️ Safe JSON Parser - Prevent White Screen crashes
const safeParse = (key, defaultValue = []) => {
    try {
        const val = localStorage.getItem(key);
        if (!val || !val.trim() || val === 'undefined' || val === 'null' || val === '[object Object]') return defaultValue;
        return JSON.parse(val);
    } catch (e) {
        console.error(`Corrupt data in ${key}:`, e);
        return defaultValue;
    }
};

// 🔧 Robust normalization (converts "105.0" to "105", strips non-digits)
export const normalizeSchoolNumber = (val) => {
    if (val === null || val === undefined) return '';
    let s = String(val).trim();
    if (s.endsWith('.0')) s = s.substring(0, s.length - 2);
    // Strip non-digits and leading zeros
    const cleaned = s.replace(/\D/g, '');
    return cleaned ? String(parseInt(cleaned, 10)) : '';
};

// 🔧 Robust String Normalization for Turkish Names (Standard for display/lookup)
export const normalizeTRName = (str) => {
    if (!str) return '';
    return String(str)
        .trim()
        .toLowerCase()
        // Turkish characters mapping
        .replace(/ı/g, 'i').replace(/i̇/g, 'i') 
        .replace(/ö/g, 'o')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/ç/g, 'c')
        .replace(/â/g, 'a')
        .replace(/\s+/g, ' '); // Compress multiple spaces to single
};

// 🔧 Strict Normalization for keys (No spaces, no non-alphanumeric)
export const normalizeNameForKeys = (str) => {
    return normalizeTRName(str).replace(/[^a-z0-9]/g, '').trim();
};

export const getNetScore = (val) => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'object' && val !== null) return parseFloat(val.net) || 0;
    return parseFloat(val) || 0;
};

export const getAYTAreaNets = (result) => {
    if (!result) return { sayNet: 0, eaNet: 0, sozNet: 0, dilNet: 0 };
    const subjects = result.subjects || {};

    const getNetScore = (val) => {
        if (typeof val === 'number') return val;
        if (typeof val?.net === 'number') return val.net;
        return 0;
    };

    // Use specific AYT keys to avoid picking up TYT subjects with generic names
    // 🎯 Robustness: Check both subjects object AND flat fields on the result
    const edb = getNetScore(subjects.ayt_edebiyat || result.edebiyat);
    const tar1 = getNetScore(subjects.ayt_tarih1 || result.tarih1);
    const cog1 = getNetScore(subjects.ayt_cografya1 || result.cografya1);
    const matAyt = getNetScore(subjects.ayt_matematik || subjects.ayt_mat || result.aytMat);
    const geoAyt = getNetScore(subjects.ayt_geometri || result.geometri);
    const fizAyt = getNetScore(subjects.ayt_fizik || result.fizik);
    const kimAyt = getNetScore(subjects.ayt_kimya || result.kimya);
    const biyAyt = getNetScore(subjects.ayt_biyoloji || result.biyoloji);
    const tar2 = getNetScore(subjects.ayt_tarih2 || result.tarih2);
    const cog2 = getNetScore(subjects.ayt_cografya2 || result.cografya2);
    const felAyt = getNetScore(subjects.ayt_felsefe || subjects.ayt_felsefe_secmeli || result.felsefe);
    const dinAyt = getNetScore(subjects.ayt_din || result.din);
    const dil = getNetScore(subjects.yabanci_dil || subjects.dil_toplam || subjects.ayt_dil_toplam || subjects.ydt || subjects.yds || subjects.dil || result.dil);

    const sayNet = parseFloat((matAyt + geoAyt + fizAyt + kimAyt + biyAyt).toFixed(2));
    const eaNet = parseFloat((edb + tar1 + cog1 + matAyt + geoAyt).toFixed(2));
    const sozNet = parseFloat((edb + tar1 + cog1 + tar2 + cog2 + felAyt + dinAyt).toFixed(2));
    const dilNet = parseFloat(dil.toFixed(2));

    return { sayNet, eaNet, sozNet, dilNet };
};

export const getOBPScore = (studentName, schoolNumber = null, context = null) => {
    try {
        const sNum = normalizeSchoolNumber(schoolNumber);
        
        // 1. Match against Main Student List (Ana Liste)
        let students = context?.students;
        if (!students) {
            students = safeParse('coach_students');
        }

        if (Array.isArray(students)) {
            // Priority 1: Match by School Number
            if (sNum) {
                const numMatch = students.find(s => normalizeSchoolNumber(s.schoolNumber || s.number || s.studentNo) === sNum);
                if (numMatch && (numMatch.obp > 0 || numMatch.diploma > 0)) {
                    const obp = parseFloat(numMatch.obp || 0);
                    if (obp > 0) return obp;
                    const diploma = parseFloat(numMatch.diploma || 0);
                    if (diploma > 0) return parseFloat((diploma * 0.6).toFixed(2));
                }
            }

            // Priority 2: Match by Name (Fallback)
            const tn = normalizeTRName(studentName);
            const studentRecord = students.find(s => {
                const sn = normalizeTRName(s.name);
                if (sn !== '' && sn === tn) return true;
                // Squash fallback
                const snSquash = sn.replace(/[^a-z0-9]/g, '');
                const tnSquash = tn.replace(/[^a-z0-9]/g, '');
                return snSquash !== '' && snSquash === tnSquash;
            });
            if (studentRecord && (studentRecord.obp > 0 || studentRecord.diploma > 0)) {
                const obp = parseFloat(studentRecord.obp || 0);
                if (obp > 0) return obp;
                const diploma = parseFloat(studentRecord.diploma || 0);
                if (diploma > 0) return parseFloat((diploma * 0.6).toFixed(2));
            }
        }

        // 2. Match against v2_obp_data (Universal Fallback - Manuel/Excel Entries)
        let obpData = context?.obpData;
        if (!obpData) {
            obpData = safeParse('v2_obp_data', {});
        }
        
        // Priority 1: Exact Number Match in OBP store
        if (sNum) {
            const numMatch = Object.values(obpData).find(d => normalizeSchoolNumber(d.number || d.schoolNumber) === sNum);
            if (numMatch && (parseFloat(numMatch.obp) > 0 || parseFloat(numMatch.diploma) > 0)) {
                return parseFloat(numMatch.obp) || parseFloat((numMatch.diploma * 0.6).toFixed(2));
            }
        }

        // Priority 2: Fuzzy Name Match in OBP store
        const tn = normalizeTRName(studentName);
        const tnClean = tn.replace(/[^a-z0-9]/g, '');
        
        if (tnClean) {
            const match = Object.entries(obpData).find(([key, val]) => {
                const k1 = normalizeTRName(key);
                const k1Clean = k1.replace(/[^a-z0-9]/g, '');
                
                // 1. Exact cleaned match
                if (k1Clean === tnClean) return true;
                
                // 2. Partial match (Ahmet Yilmaz matches Ahmet Can Yilmaz)
                const parts1 = k1.split(/\s+/).filter(p => p.length > 2);
                const parts2 = tn.split(/\s+/).filter(p => p.length > 2);
                const common = parts1.filter(p => parts2.includes(p));
                
                return common.length >= 2;
            });
            
            if (match && (parseFloat(match[1].obp) > 0 || parseFloat(match[1].diploma) > 0)) {
                return parseFloat(match[1].obp) || parseFloat((match[1].diploma * 0.6).toFixed(2));
            }
        }
    } catch (e) {
        console.error("getOBPScore error:", e);
    }
    return 0;
};

// 💎 Simple Internal Cache for Performance
const scoreCache = new Map();

export const clearScoreCache = () => {
    scoreCache.clear();
};

// Expose functions to window object for global access
if (typeof window !== 'undefined') {
    window.getOBPScore = getOBPScore;
}

export const calculateEstimatedScore = (result, context = null) => {
    try {
        if (!result) return 0;
        
        const cacheKey = `${result.id}_${result.totalNet}_${result.obpScore || 0}_${result.examType}_${result._v || 0}`;
        if (scoreCache.has(cacheKey)) return scoreCache.get(cacheKey);

        const sNumRaw = result.schoolNumber || result.number || result.studentNo || result.no || '';
        const sNumClean = normalizeSchoolNumber(sNumRaw);
        
        let obpScore = 0;
        if (!result.skipOBP) {
            if (result.obpScore !== undefined && result.obpScore !== null && parseFloat(result.obpScore) > 0) {
                obpScore = parseFloat(result.obpScore);
            } else {
                const studentName = result.student || result.studentName || result.name || '';
                obpScore = parseFloat(getOBPScore(studentName, sNumClean, context)) || 0;
            }
        }

        const type = result.examType || result.type || 'TYT';

        // ── TYT Net Puanı (Max 400 - ham puan) ─────────────────────────
        const getTytNetPoints = (res) => {
            const turkce = getNetScore(res.subjects?.tyt_turkce || res.subjects?.turkce || res.turkce || 0);
            const mat = getNetScore(res.subjects?.tyt_matematik || res.subjects?.tyt_mat || res.subjects?.mat || res.mat || 0);
            const geo = getNetScore(res.subjects?.tyt_geometri || res.geometri || 0);
            const matTotal = mat + geo;
            const fen = getNetScore(res.subjects?.tyt_fen_toplam || res.subjects?.fen_toplam || res.subjects?.tyt_fen || res.subjects?.fen || res.fen || 0);
            const sos = getNetScore(res.subjects?.tyt_sosyal_toplam || res.subjects?.sosyal_toplam || res.subjects?.tyt_sosyal || res.subjects?.sosyal || res.sosyal || 0);
            
            const totalNet = turkce + matTotal + fen + sos;
            if (totalNet <= 0) {
                const tytFlat = parseFloat(res.tyt || 0);
                return tytFlat > 0 ? (tytFlat * 3.33) : 0;
            }
            // Katsayılar: Turkce 3.3, Mat 3.3, Fen 3.4, Sos 3.4 (Yaklaşık)
            return (turkce * 3.3) + (matTotal * 3.3) + (fen * 3.4) + (sos * 3.4);
        };

        // ── AYT Net Puanı (Ham Puan) ──────────────────────────────────
        const getAytNetPoints = (res) => {
            const { sayNet, eaNet, sozNet, dilNet } = getAYTAreaNets(res);
            const aytCats = 5.0; // 80 soru * 5 = 400 puan
            return Math.max(sayNet, eaNet, sozNet, dilNet) * aytCats;
        };

        let finalScore = 0;
        if (type === 'TYT') {
            const netPoints = getTytNetPoints(result);
            finalScore = netPoints > 0 ? (100 + netPoints + obpScore) : 0;
        } else if (type === 'AYT' || type === 'YDT') {
            const netPoints = getAytNetPoints(result);
            finalScore = netPoints > 0 ? (100 + netPoints + obpScore) : 0;
        } else if (type === 'TYT+AYT' || type === 'TYT+YDT' || type === 'TYT+YDS') {
            const tytNetPoints = getTytNetPoints(result);
            const aytNetPoints = getAytNetPoints(result);

            if (tytNetPoints === 0 && aytNetPoints === 0) {
                finalScore = 0;
            } else {
                // 🎯 Resmi YKS Formülü: (TYT Net Puanı * 0.4) + (AYT Net Puanı * 0.6) + 100 + OBP
                finalScore = (tytNetPoints * 0.4) + (aytNetPoints * 0.6) + 100 + obpScore;
            }
        }

        const rounded = parseFloat(finalScore.toFixed(2));
        scoreCache.set(cacheKey, rounded);
        return rounded;

    } catch (e) {
        console.error("calculateEstimatedScore error:", e);
        return 0;
    }
};

export const getAYTMaxScoreArea = (result) => {
    if (!result) return '';
    const { sayNet, eaNet, sozNet, dilNet } = getAYTAreaNets(result);
    const max = Math.max(sayNet, eaNet, sozNet, dilNet);
    if (max <= 0) return '';
    if (max === sayNet) return 'SAY';
    if (max === eaNet) return 'EA';
    if (max === sozNet) return 'SÖZ';
    if (max === dilNet) return 'DİL';
    return '';
};
