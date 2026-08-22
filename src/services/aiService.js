
// Mock AI Service - Simülasyon
// Gerçek bir API olmadığı için şablon veriler ve basit algoritmalarla içerik üretir.

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Konuya göre içerik zenginleştirici yardımcılar
const getKeywords = (topic) => {
    const t = topic.toLowerCase();
    if (t.includes('sınav') || t.includes('yks') || t.includes('lgs')) return { type: 'exam', icon: 'Target', color: 'red' };
    if (t.includes('verimli') || t.includes('plan') || t.includes('teknik')) return { type: 'method', icon: 'Clock', color: 'blue' };
    if (t.includes('stres') || t.includes('kaygı') || t.includes('psikoloji')) return { type: 'health', icon: 'Heart', color: 'green' };
    return { type: 'general', icon: 'BookOpen', color: 'indigo' };
};

// Rastgele "Görsel" oluşturucu (Pollinations.ai ile Gerçek AI Görselleri)
const generateVisualPrompt = (topic, context) => {
    // Türkçe karakterleri "prompt" için İngilizceye/basite çevirelim veya doğrudan gönderelim (Pollinations genelde anlar ama garanti olsun)
    const prompt = `educational illustration about ${topic}, ${context}, modern style, vector art, colorful, highly detailed`;
    const encodedPrompt = encodeURIComponent(prompt);

    // Rastgele seed ekleyerek her defasında farklı görsel gelmesini sağla
    const seed = Math.floor(Math.random() * 1000);

    return {
        type: 'image_url',
        url: `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&seed=${seed}&nologo=true`,
        alt: `${topic}: ${context}`,
        style: 'real_ai_generated'
    };
};

export const aiService = {
    /**
     * Araştırma içeriği üretir.
     * @param {string} topic - Araştırma konusu
     * @param {string} type - 'SLIDE', 'BROCHURE', 'BOARD'
     * @param {string} tone - 'academic', 'casual', 'motivational'
     */
    async generateResearch(topic, type, tone = 'academic') {
        const waitTime = Math.floor(Math.random() * 1500) + 2000;
        await delay(waitTime);

        console.log(`Generating ${type} content for topic: ${topic} with tone: ${tone}`);

        const baseTitle = topic.charAt(0).toUpperCase() + topic.slice(1);
        const context = getKeywords(topic);

        // Ortak meta veriler
        let content = {
            id: Date.now(),
            topic: baseTitle,
            type: type,
            date: new Date().toISOString(),
            title: baseTitle, // Ana başlık
            theme: context.color,
            sections: []
        };

        if (type === 'SLIDE') {
            content.title = `${baseTitle} Sunumu`;
            content.sections = [
                {
                    title: "Giriş",
                    content: `${baseTitle}, günümüz eğitim ve gelişim süreçlerinde kritik bir öneme sahiptir. Bu sunumda, konunun temellerini, uygulama yöntemlerini ve beklenen sonuçlarını detaylıca ele alacağız.`,
                    imagePlaceholder: generateVisualPrompt(baseTitle, "Kapak Görseli - Giriş")
                },
                {
                    title: "Tanım ve Kapsam",
                    content: `Bu kavram, öğrencilerin akademik başarılarını artırmak ve kişisel gelişimlerini desteklemek amacıyla kullanılan stratejik bir yaklaşımı ifade eder. ${baseTitle} sadece bir teknik değil, aynı zamanda bir disiplindir.`,
                    bullets: [
                        { text: "Temel prensipler ve yaklaşımlar" },
                        { text: "Tarihsel gelişim ve modern uygulamalar" },
                        { text: "Hedef kitle ve etki alanı" }
                    ]
                },
                {
                    title: "İstatistiksel Veriler",
                    content: "Son yapılan araştırmalar, bu yöntemi düzenli uygulayan bireylerde belirgin bir performans artışı olduğunu göstermektedir.",
                    chartData: {
                        labels: ['Uygulayanlar', 'Uygulamayanlar', 'Kısmi Uygulama'],
                        values: [85, 45, 60],
                        type: 'bar',
                        title: 'Başarı Oranları Karşılaştırması'
                    }
                },
                {
                    title: "Uygulama Adımları",
                    content: "Başarılı bir sonuç elde etmek için izlenmesi gereken temel adımlar şunlardır:",
                    bullets: [
                        { text: "Mevcut durum analizi yapın" },
                        { text: "Gerçekçi ve ölçülebilir hedefler belirleyin" },
                        { text: "Düzenli takip ve geri bildirim mekanizması kurun" }
                    ]
                },
                {
                    title: "Sonuç ve Öneriler",
                    content: `${baseTitle} konusunu özetlemek gerekirse; disiplinli çalışma ve doğru yöntemlerle başarı kaçınılmazdır.`,
                    imagePlaceholder: generateVisualPrompt(baseTitle, "Başarı ve Sonuç Görseli")
                }
            ];
        }
        else if (type === 'BROCHURE') {
            content.title = `${baseTitle} Rehberi`;
            // Broşür Yapısı: 2 Yüz x 3 Panel = 6 Bölüm
            // sides objesi içinde tutarak UI tarafında kolay işleyeceğiz
            content.sides = {
                // DIŞ YÜZ (Yazıcıdan çıkınca kağıdın bir yüzü): [İç Kanat (Katlanan), Arka Kapak, Ön Kapak]
                outside: [
                    {
                        id: 'flap',
                        title: "Biliyor muydunuz?",
                        subtitle: "İlginç Bir Bilgi",
                        content: `${baseTitle} yöntemlerini kullanan öğrencilerin odaklanma sürelerinin %40 daha yüksek olduğunu biliyor muydunuz? Küçük değişimler büyük farklar yaratır.`,
                        color: "bg-brand-soft",
                        icon: "Lightbulb"
                    },
                    {
                        id: 'back',
                        title: "İletişim & Kaynaklar",
                        subtitle: "Bize Ulaşın",
                        content: "Daha fazla bilgi ve kaynak için koçuna danışabilirsin.",
                        color: "bg-surface-2",
                        isContact: true
                    },
                    {
                        id: 'front',
                        title: baseTitle.toUpperCase(),
                        subtitle: "Ayrıntılı Başarı Rehberi",
                        content: "\"Geleceğinizi şansa bırakmayın, planlayın.\"",
                        isCover: true,
                        image: generateVisualPrompt(baseTitle, "Broşür Kapağı - Minimalist ve Etkileyici")
                    }
                ],
                // İÇ YÜZ (Kağıdın diğer yüzü): [Sol Panel, Orta Panel, Sağ Panel]
                inside: [
                    {
                        id: 'inside-left',
                        title: "Nedir & Neden Önemli?",
                        content: `${baseTitle}, öğrencinin potansiyelini en üst düzeye çıkarması için kritik bir araçtır. Çoğu zaman eksikliği, bilgi eksikliğinden değil, strateji eksikliğinden kaynaklanır.`,
                        icon: "Info"
                    },
                    {
                        id: 'inside-center',
                        title: "Nasıl Uygulanır?",
                        content: "Adım adım yol haritası:",
                        list: [
                            "Hedefinizi netleştirin.",
                            "Zamanı bloklara ayırın (Pomodoro vb).",
                            "Dikkatinizi dağıtan unsurları masanızdan kaldırın.",
                            "Kendinizi ödüllendirmeyi unutmayın."
                        ],
                        image: generateVisualPrompt(baseTitle, "Süreci anlatan infografik")
                    },
                    {
                        id: 'inside-right',
                        title: "Sonuç ve Kazanımlar",
                        content: "Bu yöntemleri hayatınıza entegre ettiğinizde:",
                        list: [
                            "Daha az stres yaşarsınız.",
                            "Kendinize daha fazla vakit ayırırsınız.",
                            "Başarı hissi motivasyonunuzu artırır."
                        ],
                        highlight: "Unutmayın: Başarı bir varış noktası değil, bir yolculuktur."
                    }
                ]
            };
        }
        else if (type === 'BOARD') {
            content.title = `${baseTitle} Sınıf Panosu`;
            content.layout = "grid-dashboard"; // Pano düzeni
            content.items = [
                {
                    size: "large", // Merkez parça
                    title: baseTitle,
                    subtitle: "Haftanın Konusu",
                    content: "Başarıya giden yolda en önemli adım, ilk adımı atmaktır.",
                    image: generateVisualPrompt(baseTitle, "Pano için büyük, dikkat çekici görselposter")
                },
                {
                    size: "medium", // Yan parça
                    title: "Kavramlar",
                    list: ["Disiplin", "Planlama", "Analiz", "Tekrar"]
                },
                {
                    size: "medium",
                    title: "İpucu Köşesi",
                    content: "Günde sadece 20 dakika tekrar yapmak, öğrenilen bilginin kalıcılığını %60 artırır."
                },
                {
                    size: "small", // Alt notlar
                    title: "Hatırlatma",
                    content: "Sınav tarihleri yaklaşıyor!"
                },
                {
                    size: "small",
                    title: "Motivasyon",
                    content: "\"Yapabileceğine inanmak, başarmanın yarısıdır.\""
                }
            ];
        }

        return {
            success: true,
            data: content
        };
    }
};
