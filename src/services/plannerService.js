
const SUBJECTS = [
    'Matematik', 'Geometri', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Tarih', 'Coğrafya', 'Felsefe'
];

const plannerService = {
    // Ağırlıklandırma katsayıları
    WEIGHTS: {
        weak: 3,   // Zayıf dersler 3 kat daha fazla yer alır
        normal: 1
    },

    /**
     * Otomatik ders programı oluşturur
     * @param {Object} preferences - Kullanıcı tercihleri
     * @param {Array} preferences.weakSubjects - Zayıf olduğu dersler listesi
     * @param {number} preferences.dailySlots - Günlük etüt sayısı (varsayılan 6)
     * @returns {Object} - Haftalık program gridi
     */
    createSchedule: (preferences) => {
        const { weakSubjects = [], dailySlots = 6 } = preferences;
        const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
        const schedule = {};

        // 1. Havuz Oluştur: Hangi dersten kaç tane lazım?
        // Haftalık toplam slot sayısı = gün sayısı * günlük slot
        const totalSlots = days.length * dailySlots;

        // Ağırlıklı puan hesabı
        let totalWeight = 0;
        const subjectWeights = {};

        SUBJECTS.forEach(sub => {
            const weight = weakSubjects.includes(sub) ? 3 : 1;
            subjectWeights[sub] = weight;
            totalWeight += weight;
        });

        // Her dersin slot sayısını hesapla
        const pool = [];
        SUBJECTS.forEach(sub => {
            const count = Math.round((subjectWeights[sub] / totalWeight) * totalSlots);
            for (let i = 0; i < count; i++) {
                pool.push(sub);
            }
        });

        // Havuzu karıştır (Fisher-Yates Shuffle)
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        // 2. Günlere Dağıt
        let poolIndex = 0;

        days.forEach(day => {
            schedule[day] = [];
            for (let slot = 0; slot < dailySlots; slot++) {
                // Havuzdan ders al, yetmezse 'Serbest Çalışma' ata
                const subject = pool[poolIndex] || 'Serbest Çalışma';

                // Konu mockla (Gerçekte konu ağacından çekilir)
                const topics = getMockTopics(subject);
                const randomTopic = topics[Math.floor(Math.random() * topics.length)];

                schedule[day].push({
                    id: Date.now() + Math.random(),
                    subject: subject,
                    topic: randomTopic,
                    isCompleted: false
                });
                poolIndex++;
            }
        });

        return schedule;
    },

    // Form için ders listesini döner
    getSubjects: () => SUBJECTS
};

// Yardımcı: Mock Konu Listesi
function getMockTopics(subject) {
    const topics = {
        'Matematik': ['Türev', 'İntegral', 'Fonksiyonlar', 'Trigonometri', 'Logaritma'],
        'Geometri': ['Üçgenler', 'Çember', 'Analitik Geometri', 'Katı Cisimler'],
        'Fizik': ['Kuvvet ve Hareket', 'Elektrik', 'Optik', 'Dalgalar'],
        'Kimya': ['Atom Modelleri', 'Organik Kimya', 'Gazlar', 'Çözeltiler'],
        'Biyoloji': ['Hücre', 'Sistemler', 'Kalıtım', 'Ekoloji'],
        'Türkçe': ['Paragraf', 'Dil Bilgisi', 'Yazım Kuralları', 'Noktalama'],
        'Tarih': ['İlkçağ', 'Osmanlı', 'İnkılap Tarihi', 'Çağdaş Türk Tarihi'],
        'Coğrafya': ['Harita Bilgisi', 'İklim', 'Nüfus', 'Ekonomik Faaliyetler'],
        'Felsefe': ['Bilgi Felsefesi', 'Ahlak Felsefesi', 'Siyaset Felsefesi']
    };
    return topics[subject] || ['Genel Tekrar', 'Soru Çözümü'];
}

export default plannerService;
