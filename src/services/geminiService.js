
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const geminiService = {
    /**
     * Checks if the API key is valid by making a dummy request.
     * @param {string} apiKey 
     * @returns {Promise<boolean>}
     */
    validateApiKey: async (apiKey) => {
        try {
            const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Hello" }] }]
                })
            });
            return response.ok;
        } catch (error) {
            console.error("API Key validation error:", error);
            return false;
        }
    },

    /**
     * Generates a response from Gemini AI.
     * @param {string} apiKey 
     * @param {string} userMessage 
     * @param {Object} context - Student context (name, weak subjects, etc.)
     * @returns {Promise<string>}
     */
    generateResponse: async (apiKey, userMessage, context) => {
        const systemPrompt = `
            Sen "Başarı Kampı" adlı bir yapay zeka asistanısın.
            Öğrencinin adı: ${context.name || 'Öğrenci'}.
            Rolün: Onu motive etmek, ders çalışma taktikleri vermek ve sınav stresini yönetmesine yardımcı olmak.
            ASLA matematik/fizik sorusu çözme. Sadece rehberlik yap.
            Cevapların kısa, samimi ve emojili olsun.
            
            Öğrenci Mesajı: "${userMessage}"
        `;

        try {
            const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemPrompt }] }]
                })
            });

            const data = await response.json();

            if (data.candidates && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error("Invalid response structure");
            }

        } catch (error) {
            console.error("Gemini AI Error:", error);
            return null; // Fallback triggers if null
        }
    }
};

export default geminiService;
