/**
 * 🧠 GUIDANCE SERVICE - YENİ 21 TEST SİSTEMİ
 * Tüm Türkiye PDR testlerini import eder ve yönetir
 */

import { TEST_DATA, calculateResult } from '../data/tests.js';

// Rehberlik Yazıları
const GUIDANCE_ARTICLES = [
    {
        id: 'pomodoro',
        title: 'Pomodoro Tekniği Nedir?',
        content: `Pomodoro Tekniği, 25 dakika çalışma ve 5 dakika mola prensibine dayanan bir zaman yönetimi metodudur. Bu teknik, beynin odaklanma süresini maksimumda tutmayı amaçlar.

**Nasıl Uygulanır?**
1. Yapılacak işi seç.
2. Zamanlayıcıyı 25 dakikaya kur.
3. Zaman dolana kadar çalış.
4. 5 dakika mola ver.
5. Her 4 Pomodoro'dan sonra 15-30 dakika uzun mola ver.

**Faydaları:**
- Odaklanmayı artırır
- Dikkat dağınıklığını azaltır
- Zamanı verimli kullanır
- Motivasyonu yükseltir`,
        category: 'Verimli Çalışma'
    },
    {
        id: 'test-cozme',
        title: 'Turlama Tekniği ile Hız Kazan',
        content: `Sınavlarda zamanı yetiştiremiyor musun? Turlama tekniğini dene!

**Nedir?**
Testi çözerken yapamadığın veya çok zaman alacak sorularla inatlaşma. Onları işaretleyip geç. Test bittiğinde kalan vaktinde bu sorulara dön. Böylece bildiğin kolay soruları kaçırma riskin olmaz.

**Adımlar:**
1. İ lk turda bildiğin ve kolay soruları çöz
2. Zor soruları işaretle ve geç
3. 2. turda orta zorlukta soruları çöz
4. 3. turda zor sorulara dön
5. Son 5 dakikayı optik kontrolüne ayır`,
        category: 'Sınav Stratejileri'
    },
    {
        id: 'motivasyon',
        title: 'Neden Çalışmalısın?',
        content: `Başarı bir varış noktası değil, bir yolculuktur. Bugün çözdüğün her soru, seni hayallerine bir adım daha yaklaştırır.

**Unutma:**
- Yorulduğunda dinlenmeyi öğren, bırakmayı değil
- Küçük hedefler koy ve kutla
- Kendini başkalarıyla değil, dünkü halinle kıyasla
- Her gün %1 ilerleme bile büyük değişim yaratır

**Hedef Belirleme:**
1. SMART hedefler koy (Spesifik, Ölçülebilir, Ulaşılabilir, Gerçekçi, Zamanlı)
2. Büyük hedefi küçük adımlara böl
3. İlerlemeyi takip et
4. Başarıları kutla`,
        category: 'Motivasyon'
    },
    {
        id: 'stres-yonetimi',
        title: 'Sınav Stresi ile Başa Çıkma',
        content: `Sınav kaygısı normaldir ama kontrolden çıkmamalı!

**Fiziksel Teknikler:**
- 4-7-8 nefes tekniği (4 san içe çek, 7 san tut, 8 san ver)
- Kas gevşetme egzersizleri
- Düzenli uyku (7-8 saat)
- Sağlıklı beslenme

**Zihinsel Teknikler:**
- Pozitif öz-konuşma
- Görselleştirme (başarılı olduğunu hayal et)
- Gerçekçi hedefler
- "Ya olmazsa" yerine "Elimden geleni yapacağım" de

**Sınav Günü:**
- Erkenden kalk, acele etme
- Hafif kahvaltı yap
- Sınava 15 dakika erken git
- Derin nefes al ve kendine güven`,
        category: 'Stres Yönetimi'
    },
    {
        id: 'ders-calisma',
        title: 'Aktif Öğrenme Teknikleri',
        content: `Sadece okumak yetmez, aktif öğren!

**Feynman Tekniği:**
1. Konuyu başkasına anlatır gibi yaz
2. Anlatamadığın yerleri tespit et
3. O kısımlara geri dön
4. Basitleştir ve tekrar anla t

**Cornell Not Alma:**
- Sol: Anahtar kelimeler
- Sağ: Detaylı notlar
- Alt: Özet

**SQ3R Okuma Tekniği:**
1. Survey (Gözden geçir)
2. Question (Soru sor)
3. Read (Oku)
4. Recite (Tekrar et)
5. Review (Gözden geçir)

**Zihin Haritası:**
Konuyu merkeze yaz, dallandır, renklendir, görselleştir!`,
        category: 'Verimli Çalışma'
    }
];

const guidanceService = {
    /**
     * Tüm testleri getir (21 adet profesyonel test)
     */
    getTests: () => {
        // TEST_DATA objesini array'e çevir
        return Object.values(TEST_DATA);
    },

    /**
     * ID'ye göre test getir
     */
    getTestById: (id) => {
        return TEST_DATA[id] || null;
    },

    /**
     * Tüm rehberlik yazılarını getir
     */
    getArticles: () => {
        return GUIDANCE_ARTICLES;
    },

    /**
     * Test sonucunu değerlendir ve kaydet
     */
    submitTest: async (studentId, testId, answers) => {
        try {
            // Testi bul
            const test = TEST_DATA[testId];
            if (!test) {
                console.error('Test bulunamadı:', testId);
                return {
                    error: true,
                    message: 'Test bulunamadı'
                };
            }

            // Sonucu hesapla
            const result = calculateResult(testId, answers);

            // Kayıt için formatla
            const savedResult = {
                id: Date.now(),
                testId,
                testTitle: test.title,
                date: new Date().toISOString(),
                level: result.summary || result.level || 'Değerlendirme Tamamlandı',
                comment: result.detail || result.comment || 'Test başarıyla tamamlandı.',
                score: result.score || null,
                chartData: result.chartData || null
            };

            // LocalStorage'a kaydet
            const allResults = JSON.parse(localStorage.getItem('student_guidance_results') || '{}');
            if (!allResults[studentId]) allResults[studentId] = [];
            allResults[studentId].push(savedResult);
            localStorage.setItem('student_guidance_results', JSON.stringify(allResults));

            return savedResult;
        } catch (error) {
            console.error('Test kaydetme hatası:', error);
            return {
                error: true,
                message: error.message
            };
        }
    },

    /**
     * Toplu sonuç ekleme (bulk upload için)
     */
    addBulkResults: (studentId, results) => {
        const allResults = JSON.parse(localStorage.getItem('student_guidance_results') || '{}');
        if (!allResults[studentId]) allResults[studentId] = [];

        const newResults = results.map(r => ({
            ...r,
            id: r.id || Date.now() + Math.random(),
            date: r.date || new Date().toISOString(),
            testTitle: r.testTitle || r.examType + ' Deneme Sınavı'
        }));

        allResults[studentId] = [...allResults[studentId], ...newResults];
        localStorage.setItem('student_guidance_results', JSON.stringify(allResults));
        return newResults;
    },

    /**
     * Öğrencinin tüm test sonuçlarını getir
     */
    getStudentResults: (studentId) => {
        const allResults = JSON.parse(localStorage.getItem('student_guidance_results') || '{}');
        return allResults[studentId] || [];
    },

    /**
     * Test istatistiklerini getir
     */
    getTestStats: () => {
        const tests = Object.values(TEST_DATA);
        return {
            totalTests: tests.length,
            categories: {
                vocational: 2,
                intelligence: 3,
                academic: 7,
                psychological: 4,
                social: 3,
                projective: 2
            }
        };
    }
};

export default guidanceService;
