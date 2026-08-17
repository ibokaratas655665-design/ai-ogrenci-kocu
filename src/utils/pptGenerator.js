import pptxgen from 'pptxgenjs';

// GERÇEK PDR Sunum İçerikleri
export const PRESENTATION_CONTENT = {
    1: {
        title: 'YKS Sınav Sistemi 2024',
        slides: [
            {
                title: 'YKS Nedir?',
                bullets: [
                    'Yükseköğretim Kurumları Sınavı',
                    'TYT + AYT + YDT\'den oluşur',
                    'ÖSYM tarafından düzenlenir',
                    'Yılda 1 kez yapılır',
                    'Türkiye\'deki tüm üniversitelere giriş için gereklidir'
                ]
            },
            {
                title: 'TYT - Temel Yeterlilik Testi',
                bullets: [
                    '120 soru - 135 dakika',
                    'Türkçe: 40 soru',
                    'Matematik: 40 soru',
                    'Fen Bilimleri: 20 soru',
                    'Sosyal Bilimler: 20 soru',
                    'TYT baraj puanı: 150'
                ]
            },
            {
                title: 'AYT - Alan Yeterlilik Testi',
                bullets: [
                    'Sayısal, Sözel, Eşit Ağırlık, Dil alanları',
                    'Sayısal: Matematik-Fen-Biyoloji',
                    'Sözel: Edebiyat-Tarih-Coğrafya',
                    'Eşit Ağırlık: Hem sayısal hem sözel',
                    'Toplam 180 dakika süre'
                ]
            },
            {
                title: 'Puan Türleri ve Tercih',
                bullets: [
                    'TM (Türkçe-Matematik) Puanı',
                    'MF (Matematik-Fen) Puanı',
                    'TM-DİL (Dil) Puanı',
                    'Her bölüm belirli puan türlerini kabul eder',
                    'Tercih yaparken puan türüne dikkat!'
                ]
            }
        ]
    },
    24: {
        title: 'Etkili Ders Çalışma Teknikleri',
        slides: [
            {
                title: 'Etkili Çalışmanın Temelleri',
                bullets: [
                    'Düzenli çalışma alışkanlığı oluşturun',
                    'Sessiz ve aydınlık ortam seçin',
                    'Molalar verin (Pomodoro: 25dk çalış, 5dk mola)',
                    'Aktif öğrenme yöntemleri kullanın',
                    'Düzenli tekrar yapın'
                ]
            },
            {
                title: 'Pomodoro Tekniği',
                bullets: [
                    '25 dakika kesintisiz çalışma',
                    '5 dakika kısa mola',
                    '4 pomodoro sonrası 15-30 dakika uzun mola',
                    'Konsantrasyonu maksimize eder',
                    'Zihin yorgunluğunu azaltır'
                ]
            },
            {
                title: 'Aktif Not Alma',
                bullets: [
                    'Cornell not sistemi kullanın',
                    'Zihin haritaları oluşturun',
                    'Kendi cümlelerinizle özetleyin',
                    'Anahtar kelimeleri vurgulayın',
                    'Görsel destekler ekleyin (şema, grafik)'
                ]
            },
            {
                title: 'Tekrar Stratejileri',
                bullets: [
                    'Aralıklı tekrar: 1. gün → 3. gün → 7. gün → 15. gün',
                    'Flashcard kullanın',
                    'Kendinizi test edin',
                    'Öğrendiklerini başkasına anlatın',
                    'Zayıf konulara daha fazla zaman ayırın'
                ]
            }
        ]
    },
    13: {
        title: 'Öz Güven ve Benlik Saygısı',
        slides: [
            {
                title: 'Öz Güven Nedir?',
                bullets: [
                    'Kendi yeteneklerinize olan inancınız',
                    'Başarıyla ilişkili olumlu duygular',
                    'Zorluklarla başa çıkabilme hissi',
                    'Geliştirilebilir bir özelliktir',
                    'Başarının temel taşıdır'
                ]
            },
            {
                title: 'Özgüven Artırma Yolları',
                bullets: [
                    'Küçük başarılarınızı kutlayın',
                    'Kendinizi başkalarıyla karşılaştırmayın',
                    'Güçlü yönlerinizi keşfedin',
                    'Gerçekçi hedefler belirleyin',
                    'Olumlu düşünce alışkanlığı edinin',
                    'Yeni şeyler öğrenmeye açık olun'
                ]
            },
            {
                title: 'Olumsuz Düşüncelerle Başa Çıkma',
                bullets: [
                    'Düşüncelerinizi fark edin',
                    'Gerçekçi olup olmadığını sorgulayın',
                    'Alternatif bakış açıları geliştirin',
                    'Başarısızlıkları öğrenme fırsatı görün',
                    'Kendinize karşı nazik olun'
                ]
            },
            {
                title: 'Benlik Saygısını Koruma',
                bullets: [
                    'Kendinizi olduğunuz gibi kabul edin',
                    'Sınırlarınızı koruyun',
                    '"Hayır" demeyi öğrenin',
                    'Destekleyici ilişkiler kurun',
                    'Öz-bakıma zaman ayırın'
                ]
            }
        ]
    }
};

// Başlığa göre otomatik içerik oluştur (placeholder yerine)
const generateDefaultContent = (title, totalSlides) => {
    const topics = [
        { title: `${title} - Giriş`, bullets: ['Konuya genel bakış', 'Amaç ve hedefler', 'İçerik özeti', 'Beklenen kazanımlar'] },
        { title: 'Temel Kavramlar', bullets: ['Önemli tanımlar', 'Temel prensipler', 'Tarihçe ve gelişim', 'Güncel yaklaşımlar'] },
        { title: 'Önem ve Faydalar', bullets: ['Neden önemli?', 'Kişisel gelişime katkısı', 'Akademik başarıya etkisi', 'Sosyal yaşama yansımaları'] },
        { title: 'Pratik Uygulamalar', bullets: ['Günlük hayatta kullanım', 'Öğrenci örnekleri', 'Başarı hikayeleri', 'Uygulamalı aktiviteler'] },
        { title: 'Karşılaşılan Zorluklar', bullets: ['Yaygın hatalar', 'Dikkat edilmesi gerekenler', 'Engeller ve çözümleri', 'Sık yapılan yanlışlar'] },
        { title: 'Stratejiler ve Teknikler', bullets: ['Etkili yöntemler', 'Adım adım uygulama', 'İpuçları ve öneriler', 'Uzman tavsiyeleri'] },
        { title: 'Değerlendirme ve Ölçme', bullets: ['İlerleme takibi', 'Kendi kendini değerlendirme', 'Sonuçların analizi', 'Gelişim göstergeleri'] },
        { title: 'Sonuç ve Öneriler', bullets: ['Ana çıkarımlar', 'Hatırlatmalar', 'Uygulama planı', 'Ek kaynaklar'] }
    ];

    // Slayt sayısına göre içerik dağıt
    const slidesPerTopic = Math.floor(totalSlides / topics.length);
    const generatedSlides = [];

    for (let i = 0; i < topics.length && generatedSlides.length < totalSlides; i++) {
        const topic = topics[i];
        generatedSlides.push({
            title: topic.title,
            bullets: [
                ...topic.bullets,
                `${title} bağlamında özel örnekler`,
                'Grup tartışması ve aktiviteler'
            ]
        });
    }

    // Kalan slaytları doldur
    while (generatedSlides.length < totalSlides) {
        generatedSlides.push({
            title: `${title} - Bölüm ${generatedSlides.length + 1}`,
            bullets: [
                'Detaylı konu anlatımı',
                'Örnekler ve uygulamalar',
                'Tartışma konuları',
                'Aktivite önerileri',
                'Öğrenci katılımı'
            ]
        });
    }

    return generatedSlides.slice(0, totalSlides);
};

// PowerPoint oluştur ve indir
export const generateAndDownloadPPT = (presentationId, title, category, totalSlides = 45) => {
    const pptx = new pptxgen();
    const content = PRESENTATION_CONTENT[presentationId];

    // Kapak Slaytı
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: '4F46E5' };

    titleSlide.addText(content?.title || title, {
        x: 0.5,
        y: 2.0,
        w: 9.0,
        h: 1.5,
        fontSize: 44,
        bold: true,
        color: 'FFFFFF',
        align: 'center'
    });

    titleSlide.addText(category, {
        x: 0.5,
        y: 3.8,
        w: 9.0,
        h: 0.5,
        fontSize: 24,
        color: 'E0E7FF',
        align: 'center'
    });

    titleSlide.addText('PDR Sunumları - Başarı Kampı', {
        x: 0.5,
        y: 5.0,
        w: 9.0,
        h: 0.3,
        fontSize: 14,
        color: 'C7D2FE',
        align: 'center',
        italic: true
    });

    // İçerik Slaytları - TÜM slaytları oluştur
    const realSlides = content?.slides || generateDefaultContent(title, totalSlides);
    const totalSlidesNeeded = totalSlides; // Kullanılan slayt sayısı

    for (let i = 0; i < totalSlidesNeeded; i++) {
        const slide = pptx.addSlide();
        const slideData = realSlides[i];

        if (slideData) {
            // Gerçek içerik var
            slide.addText(slideData.title, {
                x: 0.5,
                y: 0.5,
                w: 9.0,
                h: 0.8,
                fontSize: 32,
                bold: true,
                color: '4F46E5'
            });

            slideData.bullets.forEach((bullet, idx) => {
                slide.addText(`• ${bullet}`, {
                    x: 1.0,
                    y: 1.5 + (idx * 0.6),
                    w: 8.0,
                    h: 0.5,
                    fontSize: 18,
                    color: '1F2937'
                });
            });
        } else {
            // Placeholder içerik
            slide.addText(`${title} - Bölüm ${i + 1}`, {
                x: 0.5,
                y: 0.5,
                w: 9.0,
                h: 0.8,
                fontSize: 32,
                bold: true,
                color: '4F46E5'
            });

            slide.addText('• Detaylı konu anlatımı', {
                x: 1.0,
                y: 1.8,
                w: 8.0,
                h: 0.5,
                fontSize: 18,
                color: '1F2937'
            });

            slide.addText('• Örnekler ve uygulamalar', {
                x: 1.0,
                y: 2.4,
                w: 8.0,
                h: 0.5,
                fontSize: 18,
                color: '1F2937'
            });

            slide.addText('• Tartışma konuları', {
                x: 1.0,
                y: 3.0,
                w: 8.0,
                h: 0.5,
                fontSize: 18,
                color: '1F2937'
            });
        }

        // Slayt numarası
        slide.addText(`${i + 2} / ${totalSlidesNeeded + 1}`, {
            x: 8.5,
            y: 5.2,
            w: 1.0,
            h: 0.3,
            fontSize: 12,
            color: '9CA3AF',
            align: 'right'
        });
    }

    // Son slayt - Teşekkür
    const endSlide = pptx.addSlide();
    endSlide.background = { color: 'F3F4F6' };

    endSlide.addText('Teşekkürler!', {
        x: 0.5,
        y: 2.0,
        w: 9.0,
        h: 1.0,
        fontSize: 40,
        bold: true,
        color: '4F46E5',
        align: 'center'
    });

    endSlide.addText('Sorularınız için rehberlik servisimize başvurabilirsiniz', {
        x: 0.5,
        y: 3.2,
        w: 9.0,
        h: 0.5,
        fontSize: 18,
        color: '6B7280',
        align: 'center',
        italic: true
    });

    // İndir
    const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pptx`;
    pptx.writeFile({ fileName });

    return true;
};

// PowerPoint'i yeni sekmede görüntüle (preview) - TÜM SLAYTLARI GÖSTERİR
export const previewPPT = (presentationId, title, totalSlides = 45) => {
    const content = PRESENTATION_CONTENT[presentationId];
    const realSlides = content?.slides || [];

    // Tüm slaytları oluştur (gerçek + placeholder)
    const allSlides = [];

    for (let i = 0; i < totalSlides; i++) {
        if (realSlides[i]) {
            // Gerçek içerik var
            allSlides.push(realSlides[i]);
        } else {
            // Placeholder slayt
            allSlides.push({
                title: `${title} - Bölüm ${i + 1}`,
                bullets: [
                    'Detaylı konu anlatımı',
                    'Örnekler ve uygulamalar',
                    'Tartışma konuları',
                    'Aktiviteler ve alıştırmalar'
                ]
            });
        }
    }

    return {
        title: content?.title || title,
        slides: allSlides
    };
};
