/**
 * 🧠 SÜ PER AKILLI AI PARSER
 * 
 * Kullanıcının yazdığı HER ŞEYİ anlar!
 * 1. Önce Gemini AI dener (varsa)
 * 2. Offline fallback parser kullanır
 */

import { parseWithGeminiAI, checkGeminiAPIKey } from './geminiAI.js';

/**
 * ANA FONKSİYON - Akıllı parser
 */
export const parseCustomRequest = async (text) => {
    if (!text || text.trim().length === 0) return {};

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧠 AI PARSER BAŞLADI');
    console.log('📝 İstek:', text);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
        // 1. Önce Gemini AI dene (varsa)
        const apiStatus = checkGeminiAPIKey();

        console.log('🔍 API Key Kontrolü:');
        console.log('  exists:', apiStatus.exists);
        console.log('  isValid:', apiStatus.isValid);
        console.log('  key preview:', apiStatus.key ? apiStatus.key.substring(0, 20) + '...' : 'YOK');

        if (apiStatus.exists && apiStatus.isValid) {
            console.log('🤖 Gemini AI çağrılıyor...');
            const aiResult = await parseWithGeminiAI(text);

            console.log('📥 AI Sonucu:', aiResult);

            if (!aiResult.error && !aiResult.fallbackNeeded) {
                console.log('✅ ✅ ✅ GEMİNİ AI BAŞARILI!');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                return aiResult;
            }
            console.warn('⚠️ Gemini AI yanıt vermedi, offline parser kullanılacak');
            console.warn('   Hata detayı:', aiResult.error || 'Bilinmeyen');
        } else {
            console.log('ℹ️ ℹ️ ℹ️ GEMİNİ API KEY YOK - OFFLİNE PARSER KULLANILIYOR');
            console.log('💡 API Key eklemek için:');
            console.log('   1. CoachDashboard → 🤖 AI Kurulum');
            console.log('   2. https://aistudio.google.com/app/apikey');
        }
    } catch (error) {
        console.error('❌ ❌ ❌ AI HATASI:', error);
        console.error('   Stack:', error.stack);
    }

    // 2. Fallback: Offline intelligent parser
    console.log('🔄 Offline Parser devreye giriyor...');
    const result = offlineParser(text);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return result;
};

/**
 * OFFLINE PARSER - Pattern matching ile akıllı anlama
 */
const offlineParser = (text) => {
    console.log('📝 Offline Parser:', text);

    const rules = {};

    // Slot Rules
    rules.slotRules = [];
    const slotRegex = /(\d+)\.?\s*(?:etüt|slot).*?(tyt|ydt)|(?:tyt|ydt).*?(\d+)\.?\s*(?:etüt|slot)/gi;
    let match;
    while ((match = slotRegex.exec(text)) !== null) {
        const num = parseInt(match[1] || match[3]);
        const type = (match[2] || '').toUpperCase();
        if (type) {
            rules.slotRules.push({ slot: num - 1, examType: type });
            console.log(`  ✅ ${num}. slot → ${type}`);
        }
    }

    // Day Rules
    rules.dayRules = [];
    const days = ['pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi', 'pazar'];
    days.forEach(day => {
        const dayRegex = new RegExp(`${day}.*?(tyt|ydt)|(tyt|ydt).*?${day}`, 'i');
        const m = text.match(dayRegex);
        if (m) {
            const type = (m[1] || m[2] || '').toUpperCase();
            if (type) {
                const dayName = day.charAt(0).toUpperCase() + day.slice(1);
                rules.dayRules.push({ day: dayName, examType: type });
                console.log(`  ✅ ${dayName} → ${type}`);
            }
        }
    });

    // Weekend
    if (/hafta.*?sonu.*?(tyt|ydt)|(tyt|ydt).*?hafta.*?sonu/i.test(text)) {
        const m = text.match(/hafta.*?sonu.*?(tyt|ydt)|(tyt|ydt).*?hafta.*?sonu/i);
        rules.weekendType = (m[1] || m[2] || '').toUpperCase();
        if (rules.weekendType) {
            console.log(`  ✅ Haftasonu → ${rules.weekendType}`);
        }
    }

    // Subject Preferences
    rules.subjectPreferences = [];
    const subjects = ['matematik', 'fizik', 'kimya', 'biyoloji', 'türkçe'];
    subjects.forEach(subj => {
        if (new RegExp(`(?:çok|fazla|ağırlıklı).*?${subj}|${subj}.*?(?:çok|fazla|ağırlıklı)`, 'i').test(text)) {
            rules.subjectPreferences.push({ subject: subj, weight: 'high' });
            console.log(`  ✅ ${subj} → Ağırlıklı`);
        }
        if (new RegExp(`(?:az|minimum).*?${subj}|${subj}.*?(?:az|minimum)`, 'i').test(text)) {
            rules.subjectPreferences.push({ subject: subj, weight: 'low' });
            console.log(`  ✅ ${subj} → Az`);
        }
    });

    // Special Rules
    if (/sadece.*?tyt|yalnızca.*?tyt/i.test(text)) {
        rules.onlyTYT = true;
        console.log('  ✅ Sadece TYT');
    }
    if (/hiç.*?ydt|ydt.*?(?:istemiyorum|olmasın)/i.test(text)) {
        rules.noYDT = true;
        console.log('  ✅ YDT yok');
    }

    console.log('📝 Parse Sonucu:', rules);
    return rules;
};

export default parseCustomRequest;
