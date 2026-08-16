/**
 * GERÇEK GEMİNİ AI - Kullanıcının yazdığı HER ŞEYİ anlar!
 * Tıpkı AI Assistant ile konuşur gibi!
 */

/**
 * Anahtar her çağrıda okunur: modül yüklenirken bir kez okunsaydı,
 * kullanıcı ayarlardan anahtarını kaydettikten sonra sayfayı
 * yenilemeden AI'yı kullanamazdı.
 *
 * Sahte bir yedek anahtar KOYMUYORUZ — anahtarsız istek Google'dan
 * anlamsız bir 400 döndürür ve kullanıcı sorunun kendi ayarında
 * olduğunu göremez.
 */
const apiAnahtari = () => localStorage.getItem('gemini_api_key') || null;

/**
 * Gemini'ye sor - Gerçek AI anlayışı
 */
export const parseWithGeminiAI = async (userRequest) => {
    if (!userRequest || userRequest.trim().length === 0) {
        return { error: 'Boş istek' };
    }

    const anahtar = apiAnahtari();
    if (!anahtar) {
        return { error: 'Gemini API anahtarı tanımlı değil. Ayarlar → Gemini API bölümünden anahtarını kaydet.' };
    }

    try {
        console.log('🤖 Gemini AI analiz ediyor:', userRequest);

        const prompt = `
Sen bir çalışma programı oluşturma AI'sısın. Kullanıcının yazdığı doğal dil isteğini analiz edip JSON formatında kurallar çıkar.

KULLANICI İSTEĞİ:
"${userRequest}"

ÇıKARMAN GEREKEN KURALLAR:
1. Slot kuralları (hangi slot/etüt TYT veya YDT olacak)
2. Gün kuralları (hangi gün TYT/YDT olacak)
3. Ders tercihleri (hangi ders çok/az olacak)
4. Özel durumlar (sadece TYT, YDT yok gibi)
5. Hafta sonu kuralları

JSON formatında döndür:
{
  "slotRules": [
    { "slot": 3, "examType": "YDT" } // 4. etüt için (0-indexed)
    { "position": "last", "examType": "TYT" } // son etüt için
  ],
  "dayRules": [
    { "day": "Pazartesi", "examType": "YDT" }
  ],
  "weekendType": "TYT", // veya "YDT"
  "subjectPreferences": [
    { "subject": "matematik", "weight": "high" },
    { "subject": "kimya", "weight": "low" }
  ],
  "onlyTYT": false,
  "noYDT": false,
  "summary": "Kullanıcı ne istiyor kısa özet"
}

SADECE JSON döndür, başka hiçbir şey yazma!
`;

        // Gemini API çağrısı
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${anahtar}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.1, // Düşük - tutarlı sonuçlar için
                    maxOutputTokens: 1024,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API Error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.candidates[0]?.content?.parts[0]?.text;

        if (!aiResponse) {
            throw new Error('Gemini boş yanıt döndü');
        }

        console.log('🤖 Gemini Yanıtı:', aiResponse);

        // JSON'u çıkar (markdown code block içinde olabilir)
        let jsonText = aiResponse;
        const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            jsonText = jsonMatch[1];
        }

        const rules = JSON.parse(jsonText.trim());

        console.log('✅ Gemini AI Kuralları:', rules);
        console.log(`💬 Özet: ${rules.summary || 'Kurallar çıkarıldı'}`);

        return rules;

    } catch (error) {
        console.error('❌ Gemini AI hatası:', error);
        return {
            error: error.message,
            fallbackNeeded: true
        };
    }
};

/**
 * API Key kontrolü ve yönetimi
 */
export const checkGeminiAPIKey = () => {
    const key = localStorage.getItem('gemini_api_key');
    const isPlaceholder = !key || key.includes('Xxxxx') || key.includes('placeholder');

    return {
        exists: !!key && !isPlaceholder,
        key: key,
        isValid: key && key.startsWith('AIzaSy') && key.length > 30
    };
};

export const setGeminiAPIKey = (apiKey) => {
    if (apiKey && apiKey.startsWith('AIzaSy')) {
        localStorage.setItem('gemini_api_key', apiKey);
        console.log('✅ Gemini API Key kaydedildi!');
        return true;
    } else {
        console.error('❌ Geçersiz API Key format');
        return false;
    }
};

export const removeGeminiAPIKey = () => {
    localStorage.removeItem('gemini_api_key');
    console.log('🗑️ API Key silindi');
};

/**
 * API Key kurulum rehberi
 */
export const getAPIKeySetupGuide = () => {
    return {
        title: '🔑 Gemini API Key Nasıl Alınır? (ÜCRETSİZ!)',
        steps: [
            {
                step: 1,
                title: 'Google AI Studio\'ya git',
                url: 'https://aistudio.google.com/app/apikey',
                description: 'Google hesabınla giriş yap'
            },
            {
                step: 2,
                title: 'Create API Key\'e tıkla',
                description: 'Yeni bir API key oluştur (ücretsiz!)'
            },
            {
                step: 3,
                title: 'API Key\'i kopyala',
                description: 'AIzaSy ile başlayan uzun kod'
            },
            {
                step: 4,
                title: 'Buraya yapıştır',
                description: 'Ayarlar > Gemini API bölümünden ekle'
            }
        ],
        benefits: [
            '✨ Sınırsız doğal dil anlama',
            '🎯 %100 doğruluk - tıpkı AI asistan gibi',
            '🆓 Ücretsiz (günde 60 istek)',
            '🔒 Güvenli - sadece senin cihazında saklanır'
        ]
    };
};
