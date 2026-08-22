
export const bepData = {
    // Yetersizlik Türleri
    disabilityTypes: [
        { id: 'ozgul_ogrenme', label: 'Özgül Öğrenme Güçlüğü (Disleksi/Disgrafi)' },
        { id: 'dehb', label: 'Dikkat Eksikliği ve Hiperaktivite Bozukluğu' },
        { id: 'hafif_zihinsel', label: 'Hafif Düzeyde Zihinsel Yetersizlik' },
        { id: 'orta_zihinsel', label: 'Orta Düzeyde Zihinsel Yetersizlik' },
        { id: 'otizm', label: 'Otizm Spektrum Bozukluğu' },
        { id: 'isitme', label: 'İşitme Yetersizliği' },
        { id: 'gorme', label: 'Görme Yetersizliği' },
        { id: 'bedensel', label: 'Bedensel Yetersizlik' },
        { id: 'dil_konusma', label: 'Dil ve Konuşma Güçlüğü' },
        { id: 'ustun_yetenek', label: 'Özel Yetenekli Birey' }
    ],

    // Dersler (Sistematik ve Kapsamlı)
    courses: [
        { id: 'turkce', label: 'Türkçe / Türk Dili ve Edebiyatı' },
        { id: 'matematik', label: 'Matematik' },
        { id: 'fizik', label: 'Fizik' },
        { id: 'kimya', label: 'Kimya' },
        { id: 'biyoloji', label: 'Biyoloji' },
        { id: 'tarih', label: 'Tarih' },
        { id: 'cografya', label: 'Coğrafya' },
        { id: 'felsefe', label: 'Felsefe / Psikoloji / Sosyoloji / Mantık' },
        { id: 'din_kulturu', label: 'Din Kültürü ve Ahlak Bilgisi' },
        { id: 'ingilizce', label: 'Yabancı Dil (İngilizce)' },
        { id: 'almanca', label: 'İkinci Yabancı Dil (Almanca/Fransızca)' },
        { id: 'fen_bilimleri', label: 'Fen Bilimleri (Ortaokul)' },
        { id: 'sosyal_bilgiler', label: 'Sosyal Bilgiler (Ortaokul)' },
        { id: 'inkilap', label: 'T.C. İnkılap Tarihi ve Atatürkçülük' },
        { id: 'hayat_bilgisi', label: 'Hayat Bilgisi (İlkokul)' },
        { id: 'gorsel_sanatlar', label: 'Görsel Sanatlar' },
        { id: 'muzik', label: 'Müzik' },
        { id: 'beden_egitimi', label: 'Beden Eğitimi ve Spor' },
        { id: 'bilisim', label: 'Bilişim Teknolojileri ve Yazılım' },
        { id: 'teknoloji_tasarim', label: 'Teknoloji ve Tasarım' },
        { id: 'insan_haklari', label: 'İnsan Hakları, Yurttaşlık ve Demokrasi' },
        { id: 'iletisim', label: 'İletişim ve Sosyal Beceriler (Özel Eğitim)' }
    ],

    // Öğretim Yöntem ve Teknikleri
    teachingMethods: [
        "Anlatım Yöntemi",
        "Soru-Cevap Tekniği",
        "Gösterip Yaptırma",
        "Model Olma",
        "Rol Oynama / Dramatizasyon",
        "İşbirliğine Dayalı Öğretim",
        "Bireyselleştirilmiş Öğretim",
        "Doğrudan Öğretim",
        "Basamaklandırılmış Öğretim",
        "Akran Öğretimi",
        "Gezi-Gözlem",
        "Beyin Fırtınası",
        "Problem Çözme",
        "Tartışma",
        "Örnek Olay İncelemesi"
    ],

    // Öğretim Materyalleri
    teachingMaterials: [
        "Ders Kitabı",
        "Çalışma Yaprakları",
        "Resimli Kartlar / Flash Kartlar",
        "Somut Nesneler (Boncuk, küp, terazi vb.)",
        "Akıllı Tahta / Dijital İçerik",
        "Video / Ses Kaydı",
        "Kavram Haritaları",
        "Model / Maket",
        "Bilgisayar / Tablet / Eğitim Yazılımları",
        "Deney Malzemeleri",
        "Haritalar / Küre",
        "Müzik Aletleri",
        "Spor Malzemeleri"
    ],

    // Değerlendirme Yöntemleri
    evaluationMethods: [
        "Gözlem Formu",
        "Kontrol Listesi",
        "Dereceli Puanlama Anahtarı (Rubrik)",
        "Yazılı Sınav (Çoktan Seçmeli)",
        "Yazılı Sınav (Boşluk Doldurma)",
        "Yazılı Sınav (Kısa Cevaplı)",
        "Sözlü Sınav",
        "Performans Görevi / Proje",
        "Öz Değerlendirme",
        "Ürün Dosyası (Portfolyo)"
    ],

    // Eğitsel Performans Düzeyi Şablonları (Otomatik Oluşturucu İçin)
    performanceTemplates: {
        strengths: [
            "Verilen basit yönergeleri anlar ve yerine getirir.",
            "Görsel destek sunulduğunda konuyu daha hızlı kavrar.",
            "İlgi duyduğu konularda dikkati ve motivasyonu yüksektir.",
            "Grup çalışmalarına istekli katılım gösterir.",
            "Temel öz bakım becerilerini bağımsız olarak yapar.",
            "Teknoloji kullanımına oldukça yatkındır.",
            "Resim, müzik ve sanatsal faaliyetlerde yeteneklidir.",
            "Sınıf içi kurallara uymaya özen gösterir.",
            "Arkadaşlık ilişkileri ve sosyal uyumu olumludur.",
            "Verilen görevleri tamamlama konusunda isteklidir."
        ],
        weaknesses: [
            "Uzun süreli dikkat gerektiren görevlerde zorlanır ve dikkati dağılır.",
            "Soyut kavramları anlamlandırmada güçlük yaşar, somutlaştırmaya ihtiyaç duyar.",
            "Okuduğunu anlamada ve yorumlamada yaşıtlarının gerisindedir.",
            "Matematiksel işlemlerde parmakla sayma veya somut nesne ihtiyacı duyar.",
            "İnce motor becerilerde (yazı yazma, kesme) destek gerektirir.",
            "Dürtüsel davranışlarını kontrol etmede bazen zorlanır.",
            "Sözel ifadede kelime dağarcığı sınırlıdır.",
            "Çok basamaklı ve karmaşık yönergeleri takip etmekte zorlanır.",
            "Zaman yönetimi konusunda desteğe ihtiyaç duyar.",
            "Özgüveni düşüktür, başarısızlık kaygısı yaşar."
        ]
    },

    // Amaçlar (Hiyerarşik Yapı: Yetersizlik -> Ders -> UDA -> KDA)
    goals: {
        // --- ÖZGÜL ÖĞRENME GÜÇLÜĞÜ (DİSLEKSİ,VB) ---
        ozgul_ogrenme: {
            turkce: [
                {
                    uda: "Okuduğu metni anlar ve yorumlar. (UDA)",
                    kda: [
                        "KDA-1: Metinle ilgili 5N1K sorularını (Ne, Nerede, Ne Zaman...) yanıtlar.",
                        "KDA-2: Metnin ana fikrini söyler/yazar.",
                        "KDA-3: Metindeki olayların oluş sırasını anlatır.",
                        "KDA-4: Metne uygun yeni bir başlık bulur.",
                        "KDA-5: Metindeki karakterlerin özelliklerini açıklar."
                    ]
                },
                {
                    uda: "Kurallara uygun akıcı okuma yapar. (UDA)",
                    kda: [
                        "KDA-1: Kelimeleri hecelemeden, bütün olarak okur.",
                        "KDA-2: Noktalama işaretlerine dikkat ederek sesli okur.",
                        "KDA-3: Okurken satır takibi yapar.",
                        "KDA-4: Vurgu ve tonlamaya dikkat eder."
                    ]
                },
                {
                    uda: "Yazılı anlatım becerilerini geliştirir. (UDA)",
                    kda: [
                        "KDA-1: Duygu ve düşüncelerini basit cümlelerle yazar.",
                        "KDA-2: Yazım kurallarına (büyük harf, nokta) dikkat eder.",
                        "KDA-3: Verilen bir konu hakkında kısa bir paragraf oluşturur.",
                        "KDA-4: Kelimeler arasında uygun boşluk bırakır."
                    ]
                }
            ],
            matematik: [
                {
                    uda: "Doğal sayılarla dört işlem yapar. (UDA)",
                    kda: [
                        "KDA-1: Eldeli toplama işlemini yapar.",
                        "KDA-2: Onluk bozarak çıkarma işlemi yapar.",
                        "KDA-3: Çarpım tablosunu ritmik sayma yoluyla kavrar.",
                        "KDA-4: Kalansız bölme işlemini yapar.",
                        "KDA-5: İşlem önceliği kuralını uygular."
                    ]
                },
                {
                    uda: "Problem çözme becerisi geliştirir. (UDA)",
                    kda: [
                        "KDA-1: Basit, tek işlemli problemleri çözer.",
                        "KDA-2: Problemi kendi cümleleriyle ifade eder.",
                        "KDA-3: Problemde verilenleri ve istenenleri ayırt eder.",
                        "KDA-4: Çok işlemli problemleri adım adım çözer."
                    ]
                }
            ],
            fizik: [
                {
                    uda: "Fiziğin temel kavramlarını tanır. (UDA)",
                    kda: [
                        "KDA-1: Madde ve özelliklerini (kütle, hacim, özkütle) söyler.",
                        "KDA-2: Katı, sıvı ve gaz maddeleri ayırt eder.",
                        "KDA-3: Kuvvetin cisimler üzerindeki etkilerini (hızlandırma, yavaşlatma, şekil değiştirme) örnekler.",
                        "KDA-4: Sürtünme kuvvetinin olumlu ve olumsuz etkilerini açıklar."
                    ]
                },
                {
                    uda: "Basit enerji türlerini kavrar. (UDA)",
                    kda: [
                        "KDA-1: Kinetik ve potansiyel enerjiyi ayırt eder.",
                        "KDA-2: Isı ve sıcaklık arasındaki farkı söyler.",
                        "KDA-3: Enerji tasarrufunun önemini açıklar.",
                        "KDA-4: Yenilenebilir enerji kaynaklarını (güneş, rüzgar) sayar."
                    ]
                }
            ],
            kimya: [
                {
                    uda: "Maddenin yapısını ve özelliklerini tanır. (UDA)",
                    kda: [
                        "KDA-1: Element, bileşik ve karışım kavramlarını ayırt eder.",
                        "KDA-2: Periyodik tablodaki ilk 20 elementi tanır.",
                        "KDA-3: Maddenin hallerindeki değişimleri (erime, donma, buharlaşma) açıklar.",
                        "KDA-4: Atomun yapısını model üzerinde gösterir."
                    ]
                },
                {
                    uda: "Günlük hayatta kimyayı fark eder. (UDA)",
                    kda: [
                        "KDA-1: Asit ve baz özelliklerini basit örneklerle açıklar (limon, sabun).",
                        "KDA-2: Kimyasal değişimlere örnek verir (paslanma, yanma, çürüme).",
                        "KDA-3: Laboratuvar güvenlik kurallarını söyler.",
                        "KDA-4: Geri dönüşümün önemini açıklar."
                    ]
                }
            ],
            biyoloji: [
                {
                    uda: "Canlıların temel özelliklerini kavrar. (UDA)",
                    kda: [
                        "KDA-1: Canlı ve cansız varlıkları ayırt eder.",
                        "KDA-2: Hücrenin canlının temel birimi olduğunu söyler.",
                        "KDA-3: Bitki ve hayvan hücresi arasındaki temel farkı (şekil vb.) gösterir.",
                        "KDA-4: Solunum, beslenme ve boşaltım olaylarını açıklar."
                    ]
                },
                {
                    uda: "Vücudumuzdaki sistemleri tanır. (UDA)",
                    kda: [
                        "KDA-1: Sindirim sistemi organlarını sıralar.",
                        "KDA-2: Dolaşim sisteminin görevini açıklar.",
                        "KDA-3: Beş duyu organını ve görevlerini söyler.",
                        "KDA-4: İskelet ve kas sağlığı için yapılması gerekenleri söyler."
                    ]
                }
            ],
            tarih: [
                {
                    uda: "Tarihsel zaman kavramını geliştirir. (UDA)",
                    kda: [
                        "KDA-1: Geçmiş, bugün ve gelecek kavramlarını ayırt eder.",
                        "KDA-2: Tarihi olayları kronolojik sıraya koyar.",
                        "KDA-3: Takvim kullanımını (Hicri, Miladi) kavrar.",
                        "KDA-4: Yüzyıl, çağ, dönem kavramlarını açıklar."
                    ]
                },
                {
                    uda: "Türk tarihinin önemli olaylarını bilir. (UDA)",
                    kda: [
                        "KDA-1: Orta Asya Türk devletlerini tanır.",
                        "KDA-2: Malazgirt Savaşı'nın Anadolu'nun Türkleşmesindeki yerini söyler.",
                        "KDA-3: Osmanlı Devleti'nin kuruluş dönemini ana hatlarıyla anlatır.",
                        "KDA-4: İstanbul'un Fethi'nin sonuçlarını açıklar.",
                        "KDA-5: Kurtuluş Savaşı'nın aşamalarını sıralar."
                    ]
                }
            ],
            cografya: [
                {
                    uda: "Harita ve yön bilgisini kullanır. (UDA)",
                    kda: [
                        "KDA-1: Ana ve ara yönleri gösterir.",
                        "KDA-2: Harita üzerindeki renklerin (yeşil-ova, kahverengi-dağ) anlamını söyler.",
                        "KDA-3: Türkiye'nin yerini dünya haritasında gösterir.",
                        "KDA-4: Ölçek kavramını basit düzeyde açıklar."
                    ]
                },
                {
                    uda: "Türkiye'nin coğrafi özelliklerini tanır. (UDA)",
                    kda: [
                        "KDA-1: Yedi coğrafi bölgeyi sayar.",
                        "KDA-2: İklim türlerini (Akdeniz, Karadeniz, Karasal) özellikleriyle eşleştirir.",
                        "KDA-3: Doğal afetlerin (deprem, sel, heyelan) nedenlerini ve korunma yollarını açıklar.",
                        "KDA-4: Nüfus dağılışını etkileyen faktörleri söyler."
                    ]
                }
            ],
            felsefe: [
                {
                    uda: "Düşünme becerilerini geliştirir. (UDA)",
                    kda: [
                        "KDA-1: Doğru ve yanlış bilgi arasındaki farkı söyler.",
                        "KDA-2: Kendi düşüncelerini nedenleriyle (gerekçelendirme) açıklar.",
                        "KDA-3: Başkalarının düşüncelerine saygı duyar.",
                        "KDA-4: Felsefi soruları (Nedir? Niçin?) günlük sorulardan ayırt eder."
                    ]
                },
                {
                    uda: "Bilgi ve varlık felsefesini tanır. (UDA)",
                    kda: [
                        "KDA-1: Bilginin kaynaklarını (akıl, deney) söyler.",
                        "KDA-2: Varlığın ana maddesi hakkındaki görüşleri ayırt eder.",
                        "KDA-3: Ahlaki eylemin amacını tartışır."
                    ]
                }
            ],
            ingilizce: [
                {
                    uda: "Basit İngilizce ifadeleri kullanır. (UDA)",
                    kda: [
                        "KDA-1: Kendini basit cümlelerle tanıtır (My name is, I am from...).",
                        "KDA-2: Renkleri, günleri ve sayıları (1-20) İngilizce söyler.",
                        "KDA-3: Basit selamlaşma kalıplarını kullanır (Hello, Good Morning).",
                        "KDA-4: Aile bireylerini İngilizce olarak tanıtır (This is my mother...)."
                    ]
                },
                {
                    uda: "Basit İngilizce metinleri anlar. (UDA)",
                    kda: [
                        "KDA-1: Okuduğu kısa metindeki ana fikri bulur.",
                        "KDA-2: Görsellerle desteklenmiş kelimeleri eşleştirir.",
                        "KDA-3: Basit sorulara (Yes/No) cevap verir."
                    ]
                }
            ],
            almanca: [
                {
                    uda: "Basit Almanca iletişim kurar. (UDA)",
                    kda: [
                        "KDA-1: Kendini basit cümlelerle tanıtır (Ich heisse...).",
                        "KDA-2: Sayıları (1-20) Almanca söyler.",
                        "KDA-3: Selamlaşma ve vedalaşma ifadelerini kullanır (Hallo, Tschüss)."
                    ]
                }
            ],
            din_kulturu: [
                {
                    uda: "Temel dini kavramları bilir. (UDA)",
                    kda: [
                        "KDA-1: Peygamberimizin hayatını ana hatlarıyla anlatır.",
                        "KDA-2: İslam'ın ve imanın şartlarını sayar.",
                        "KDA-3: İbadetlerin (namaz, oruç) bireysel ve toplumsal önemini söyler.",
                        "KDA-4: Ahlaki değerlere (doğruluk, yardımseverlik, saygı) örnek verir."
                    ]
                }
            ],
            gorsel_sanatlar: [
                {
                    uda: "Görsel sanat çalışmalarında teknikleri kullanır. (UDA)",
                    kda: [
                        "KDA-1: Ana ve ara renkleri tanır ve karıştırır.",
                        "KDA-2: Farklı boya malzemelerini (pastel, sulu boya) amacına uygun kullanır.",
                        "KDA-3: Duygu ve düşüncelerini resim yoluyla ifade eder."
                    ]
                }
            ],
            muzik: [
                {
                    uda: "Müziksel algı ve bilgilenme becerisi geliştirir. (UDA)",
                    kda: [
                        "KDA-1: İstiklal Marşı'nı doğru söyler.",
                        "KDA-2: Ritmlere eşlik eder.",
                        "KDA-3: Temel müzik aletlerini seslerinden tanır."
                    ]
                }
            ],
            beden_egitimi: [
                {
                    uda: "Hareket becerilerini geliştirir. (UDA)",
                    kda: [
                        "KDA-1: Komutlara uygun sıra olur.",
                        "KDA-2: Isınma ve soğuma hareketlerini yapar.",
                        "KDA-3: Basit spor kurallarına uyar.",
                        "KDA-4: El-göz koordinasyonu gerektiren hareketleri yapar (top atma-tutma)."
                    ]
                }
            ],
            fen_bilimleri: [
                {
                    uda: "Fen bilimleri temel kavramlarını anlar. (UDA)",
                    kda: [
                        "KDA-1: Canlı ve cansız varlıkları ayırt eder.",
                        "KDA-2: Maddenin hallerini (katı, sıvı, gaz) tanır.",
                        "KDA-3: Basit elektrik devresi elemanlarını tanır.",
                        "KDA-4: Kuvvetin cisimler üzerindeki etkilerini gözlemler."
                    ]
                }
            ],
            sosyal_bilgiler: [
                {
                    uda: "Toplumsal yaşam kurallarını kavrar. (UDA)",
                    kda: [
                        "KDA-1: Hak ve sorumluluklarını ayırt eder.",
                        "KDA-2: Yaşadığı çevrenin coğrafi özelliklerini tanır.",
                        "KDA-3: Tarihi ve doğal güzelliklerimizin önemini kavrar.",
                        "KDA-4: Üretim, dağıtım ve tüketim kavramlarını ilişkilendirir."
                    ]
                }
            ],
            inkilap: [
                {
                    uda: "Milli Mücadele sürecini kavrar. (UDA)",
                    kda: [
                        "KDA-1: Atatürk'ün hayatını kronolojik olarak anlatır.",
                        "KDA-2: Kurtuluş Savaşı cephelerini ve kahramanlarını tanır.",
                        "KDA-3: Cumhuriyetin ilanının önemini açıklar.",
                        "KDA-4: Atatürk ilke ve inkılaplarına örnekler verir."
                    ]
                }
            ],
            hayat_bilgisi: [
                {
                    uda: "Kendi ve çevresiyle ilgili farkındalık kazanır. (UDA)",
                    kda: [
                        "KDA-1: Kişisel bakım becerilerini uygular.",
                        "KDA-2: Okul ve sınıf kurallarına uyar.",
                        "KDA-3: Sağlıklı beslenme alışkanlığı kazanır.",
                        "KDA-4: Güvenlik kurallarını bilir ve uygular."
                    ]
                }
            ],
            bilisim: [
                {
                    uda: "Bilişim teknolojilerini temel düzeyde kullanır. (UDA)",
                    kda: [
                        "KDA-1: Bilgisayarın temel parçalarını (klavye, fare, ekran) tanır.",
                        "KDA-2: Fare ve klavyeyi işlevsel olarak kullanır.",
                        "KDA-3: Basit düzeyde kelime işlemci programında yazı yazar.",
                        "KDA-4: İnterneti güvenli kullanma kurallarını açıklar."
                    ]
                }
            ],
            teknoloji_tasarim: [
                {
                    uda: "Tasarım sürecini deneyimler. (UDA)",
                    kda: [
                        "KDA-1: Günlük hayattaki bir ihtiyaca yönelik basit bir ürün tasarlar.",
                        "KDA-2: Geri dönüşüm malzemelerini kullanarak ürün oluşturur.",
                        "KDA-3: Tasarımını arkadaşlarına sunar."
                    ]
                }
            ],
            insan_haklari: [
                {
                    uda: "Temel insan haklarını kavrar. (UDA)",
                    kda: [
                        "KDA-1: İnsan hakları kavramını tanımlar.",
                        "KDA-2: Çocuk haklarını sayar.",
                        "KDA-3: Farklılıklara saygı duymanın önemini açıklar.",
                        "KDA-4: Adalet ve eşitlik kavramlarını örneklerle açıklar."
                    ]
                }
            ],
            iletisim: [
                {
                    uda: "Sosyal iletişim becerilerini geliştirir. (UDA)",
                    kda: [
                        "KDA-1: Göz teması kurarak iletişim başlatır.",
                        "KDA-2: Karşısındakini dinlediğini jest ve mimiklerle belli eder.",
                        "KDA-3: Duygu ve düşüncelerini uygun bir dille ifade eder.",
                        "KDA-4: Grup çalışmalarında işbirliği yapar."
                    ]
                }
            ]
        },

        // --- HAFİF DÜZEY ZİHİNSEL YETERSİZLİK (Genişletilmiş) ---
        hafif_zihinsel: {
            turkce: [
                {
                    uda: "Temel okuma-yazma becerilerini kazanır. (UDA)",
                    kda: [
                        "KDA-1: Sesleri tanır ve ayırt eder.",
                        "KDA-2: Sesleri birleştirerek hece ve kelime oluşturur.",
                        "KDA-3: Basit cümleleri okur.",
                        "KDA-4: Adını ve soyadını bakarak/bakmadan yazar.",
                        "KDA-5: Bitişik eğik yazı veya dik temel harflerle yazar."
                    ]
                },
                {
                    uda: "Sözlü iletişim becerilerini geliştirir. (UDA)",
                    kda: [
                        "KDA-1: Kendini 3-4 kelimelik cümlelerle ifade eder.",
                        "KDA-2: İsteklerini ve ihtiyaçlarını uygun dille belirtir.",
                        "KDA-3: Sorulan sorulara mantıklı cevaplar verir.",
                        "KDA-4: Bir olayı oluş sırasına göre anlatır."
                    ]
                }
            ],
            matematik: [
                {
                    uda: "Sayı kavramını ve temel işlemleri kavrar. (UDA)",
                    kda: [
                        "KDA-1: 1'den 20'ye kadar olan nesneleri ritmik sayar.",
                        "KDA-2: Rakamları tanır ve yazar.",
                        "KDA-3: Tek basamaklı sayılarla toplama işlemi yapar.",
                        "KDA-4: Tek basamaklı sayılarla çıkarma işlemi yapar.",
                        "KDA-5: Az-çok, büyük-küçük, uzun-kısa kavramlarını gösterir."
                    ]
                },
                {
                    uda: "Parayı tanır ve kullanır. (UDA)",
                    kda: [
                        "KDA-1: Madeni paraları tanır.",
                        "KDA-2: Kağıt paraları tanır.",
                        "KDA-3: Basit alışveriş oyunlarında parayı kullanır ve para üstü alır."
                    ]
                },
                {
                    uda: "Zaman kavramını geliştirir. (UDA)",
                    kda: [
                        "KDA-1: Sabah, öğle, akşam kavramlarını bilir.",
                        "KDA-2: Haftanın günlerini sırasıyla söyler.",
                        "KDA-3: Tam saatleri okur."
                    ]
                }
            ],
            hayat_bilgisi: [
                {
                    uda: "Kişisel bakım becerilerini geliştirir. (UDA)",
                    kda: [
                        "KDA-1: Elini yüzünü yıkar.",
                        "KDA-2: Dişlerini fırçalar.",
                        "KDA-3: Kıyafetlerini temiz tutar.",
                        "KDA-4: Tuvalet temizliği kurallarına uyar.",
                        "KDA-5: Saçını tarar ve düzenler."
                    ]
                },
                {
                    uda: "Güvenli hayat kurallarını bilir. (UDA)",
                    kda: [
                        "KDA-1: Ev adresini ve telefon numarasını söyler.",
                        "KDA-2: Tanımadığı kişilere karşı dikkatli olur.",
                        "KDA-3: Acil durumlarda aranacak numaraları (112) bilir."
                    ]
                }
            ],
            fen_bilimleri: [
                {
                    uda: "Çevresindeki varlıkları tanır. (UDA)",
                    kda: [
                        "KDA-1: Canlı ve cansız varlıkları ayırt eder.",
                        "KDA-2: Mevsimlerin özelliklerini ve giyilecek kıyafetleri söyler.",
                        "KDA-3: Vücudunun bölümlerini gösterir.",
                        "KDA-4: Bitkilerin büyümesi için suya ihtiyaç duyduğunu bilir."
                    ]
                }
            ],
            sosyal_bilgiler: [
                {
                    uda: "Toplumsal kuralları bilir. (UDA)",
                    kda: [
                        "KDA-1: Okul kurallarına uyar.",
                        "KDA-2: Trafik ışıklarının anlamını söyler ve uygular.",
                        "KDA-3: Bayramlarımızı (Cumhuriyet, 23 Nisan) tanır.",
                        "KDA-4: Aile bireylerinin görevlerini söyler."
                    ]
                }
            ],
            // Hafif Zihinsel İçin Diğer Branş Dersleri (Tamamlama)
            fizik: [{ uda: "Maddeleri özelliklerine göre sınıflandırır. (UDA)", kda: ["KDA-1: Sıcak ve soğuk maddeleri ayırt eder.", "KDA-2: Sert ve yumuşak cisimleri gruplar.", "KDA-3: Suda batan ve yüzen cisimleri deneyerek bulur."] }],
            kimya: [{ uda: "Temel madde özelliklerini bilir. (UDA)", kda: ["KDA-1: Suyun hallerini (buz, su) bilir.", "KDA-2: Temizlik malzemelerini (sabun, deterjan) tanır.", "KDA-3: Tehlikeli maddelerden (çamaşır suyu vb.) uzak durur."] }],
            biyoloji: [{ uda: "Sağlıklı yaşam bilinci kazanır. (UDA)", kda: ["KDA-1: Duyu organlarını ve görevlerini eşleştirir.", "KDA-2: Sağlıklı ve zararlı yiyecekleri ayırt eder.", "KDA-3: Vücut temizliğinin önemini söyler."] }],
            tarih: [{ uda: "Milli değerleri tanır. (UDA)", kda: ["KDA-1: Atatürk'ün resmini tanır.", "KDA-2: Türk bayrağını tanır ve saygı gösterir.", "KDA-3: İstiklal Marşı törenlerinde uygun duruş sergiler."] }],
            cografya: [{ uda: "Yakın çevresini tanır. (UDA)", kda: ["KDA-1: Evini ve okulunu tarif eder.", "KDA-2: Havanın durumunu (güneşli, yağmurlu, karlı) gözlemleyip söyler.", "KDA-3: Gece ve gündüz kavramlarını ayırt eder."] }],
            ingilizce: [{ uda: "Basit İngilizce kelimeleri tanır. (UDA)", kda: ["KDA-1: İngilizce selamlaşır (Hello, Bye).", "KDA-2: 1-10 arası sayıları İngilizce sayar.", "KDA-3: Temel renklerin İngilizcesini söyler."] }],
            almanca: [{ uda: "Basit Almanca kelimeleri tanır. (UDA)", kda: ["KDA-1: Almanca selamlaşır (Hallo).", "KDA-2: 1-5 arası sayıları Almanca sayar."] }],
            din_kulturu: [{ uda: "Dini değerleri tanır. (UDA)", kda: ["KDA-1: Dua etmenin anlamını bilir.", "KDA-2: Dini bayramları (Ramazan, Kurban) ayırt eder."] }],
            gorsel_sanatlar: [{ uda: "El becerilerini geliştirir. (UDA)", kda: ["KDA-1: Sınırları taşırmadan boyama yapar.", "KDA-2: Kağıt kesme ve yapıştırma yapar.", "KDA-3: Oyun hamuru ile şekiller oluşturur."] }],
            muzik: [{ uda: "Müzik etkinliklerine katılır. (UDA)", kda: ["KDA-1: Şarkılara eşlik eder.", "KDA-2: Basit ritim tutar.", "KDA-3: Müziğin sesini açıp kapatabilir."] }],
            beden_egitimi: [{ uda: "Fiziksel aktiviteler yapar. (UDA)", kda: ["KDA-1: Sırada düzgün durur.", "KDA-2: Top atar ve tutar.", "KDA-3: Koşma ve yürüme komutlarına uyar."] }],
            bilisim: [{ uda: "Teknolojik araçları tanır. (UDA)", kda: ["KDA-1: Bilgisayarı, tableti, telefonu gösterir.", "KDA-2: Dokunmatik ekranı parmağıyla kullanır.", "KDA-3: Eğitim oyunlarını açıp oynar."] }],
            teknoloji_tasarim: [{ uda: "Basit tasarımlar yapar. (UDA)", kda: ["KDA-1: Legolarla şekiller oluşturur.", "KDA-2: Atık malzemelerden oyuncak yapar."] }],
            iletisim: [{ uda: "İletişim kurar. (UDA)", kda: ["KDA-1: İsmi söylendiğinde bakar.", "KDA-2: 'Ver', 'Al', 'Gel' gibi komutları anlar.", "KDA-3: Arkadaşlarıyla oyuncaklarını paylaşır."] }],
            insan_haklari: [{ uda: "Kurallara uyar. (UDA)", kda: ["KDA-1: Sırasını bekler.", "KDA-2: Arkadaşlarına zarar vermez.", "KDA-3: İzinsiz eşya almaz."] }],
            inkilap: [{ uda: "Atatürk'ü sever. (UDA)", kda: ["KDA-1: Atatürk köşesini gösterir.", "KDA-2: Milli bayramlarda sınıfı süsler."] }],
            felsefe: [{ uda: "Düşüncelerini ifade eder. (UDA)", kda: ["KDA-1: Neyi sevip sevmediğini söyler.", "KDA-2: 'Neden' sorusuna basit cevap verir."] }]
        },

        dehb: {
            turkce: [
                {
                    uda: "Dikkatini sürdürerek dinleme yapar. (UDA)",
                    kda: [
                        "KDA-1: Konuşan kişiyi sözünü kesmeden dinler.",
                        "KDA-2: Dinlediği metinle ilgili detayları hatırlar.",
                        "KDA-3: Yönergeleri sonuna kadar takip eder.",
                        "KDA-4: Dikkatini dağıtan unsurlara rağmen görevine odaklanır."
                    ]
                },
                {
                    uda: "Okuma becerilerini geliştirir. (UDA)",
                    kda: [
                        "KDA-1: Satır atlamadan okur.",
                        "KDA-2: Okuduğu metnin özetini çıkarır.",
                        "KDA-3: Sözcükleri doğru telaffuz eder."
                    ]
                }
                // Diğer dersler için Özgül Öğrenme'deki hedefler birebir kullanılabilir.
            ],
            matematik: [
                {
                    uda: "Dikkatini işlemlere odaklar. (UDA)",
                    kda: [
                        "KDA-1: İşlem hatası yapmadan toplama/çıkarma yapar.",
                        "KDA-2: Problemi okurken önemli yerlerin altını çizer.",
                        "KDA-3: Sonucu kontrol etme alışkanlığı kazanır.",
                        "KDA-4: İşlemleri düzenli ve okunaklı yazar."
                    ]
                }
            ]
        },

        otizm: {
            iletisim: [
                {
                    uda: "Sosyal iletişim becerilerini geliştirir. (UDA)",
                    kda: [
                        "KDA-1: İletişim kurarken göz teması kurar.",
                        "KDA-2: Sıra alma becerisine uygun davranır.",
                        "KDA-3: Basit selamlaşma kurallarını uygular.",
                        "KDA-4: Ortak ilgi alanlarında sohbete katılır."
                    ]
                },
                {
                    uda: "Duyguları tanır ve ifade eder. (UDA)",
                    kda: [
                        "KDA-1: Mutlu, üzgün, kızgın yüz ifadelerini tanır.",
                        "KDA-2: Kendi duygu durumunu ifade eder.",
                        "KDA-3: Başkalarının duygularını fark eder."
                    ]
                }
            ],
            turkce: [
                {
                    uda: "Görsel okuma ve eşleme yapar. (UDA)",
                    kda: [
                        "KDA-1: Resimdeki olayları anlatır.",
                        "KDA-2: 5N1K sorularına kısa cevaplar verir.",
                        "KDA-3: Kelime kartlarını uygun resimlerle eşleştirir."
                    ]
                }
            ],
            matematik: [
                {
                    uda: "Temel sayısal becerileri kazanır. (UDA)",
                    kda: [
                        "KDA-1: Rakamları tanır ve sıralar.",
                        "KDA-2: Basit toplama işlemleri yapar.",
                        "KDA-3: Geometrik şekilleri ayırt eder ve gruplar.",
                        "KDA-4: Örüntüleri devam ettirir."
                    ]
                }
            ]
        }
    },

    recommendations: {
        ozgul_ogrenme: "Sınavlarda ek süre verilmeli (%25-%50). Okuma hataları (hece yutma vb.) notlandırmada dikkate alınmamalı. Sorular öğrenciye sesli okunmalı veya büyük puntolu (14-16) yazılmalı. Hesap makinesi, çarpım tablosu gibi yardımcı araç kullanımına izin verilmeli. Yazılı anlatım yerine boşluk doldurma, eşleştirme veya çoktan seçmeli sorular tercih edilmeli.",
        dehb: "Öğrenci ön sıralara, öğretmene yakın, pencereden uzak oturtulmalı. Dikkati dağıtan uyaranlar azaltılmalı. Yönergeler kısa, net ve tek tek verilmeli. Uzun sınavlar veya ödevler parçalara bölünerek verilmeli. Sık sık olumlu geri bildirim ve küçük ödüller verilmeli. Hareket ihtiyacına (tahta silme, kağıt dağıtma) izin verilmeli.",
        hafif_zihinsel: "Somut materyaller ve görsellerle desteklenmiş öğretim yapılmalı. Konular basitleştirilmeli, parçalara bölünmeli ve günlük hayatla ilişkilendirilmeli. Tekrar yöntemine ağırlık verilmeli. Başarıları anında ödüllendirilmeli. Sınav soruları basitleştirilmeli ve görsel destekli olmalı.",
        orta_zihinsel: "Öz bakım ve günlük yaşam becerilerine (giyinme, yemek yeme) öncelik verilmeli. Çok basit, tek basamaklı yönergeler kullanılmalı. Taklit ve model olma yöntemleri sıkça kullanılmalı. Güvenlik becerileri öğretilmeli.",
        otizm: "Günlük rutinler oluşturulmalı ve değişiklikler önceden haber verilmeli. Görsel çizelgeler ve etkinlik takvimleri kullanılmalı. Göz teması konusunda zorlanmamalı. İlgi alanları (örn: trenler, sayılar) derse entegre edilerek motivasyon sağlanmalı. Mecazi ifadelerden kaçınılmalı, net dil kullanılmalı.",
        isitme: "Öğretmen konuşurken yüzü öğrenciye dönük olmalı, dudak okuma kolaylaştırılmalı. Görsel materyaller, videolar, altyazılar yoğun kullanılmalı. Sınıfın ön tarafında, öğretmeni en iyi göreceği yere oturtulmalı. Gürültülü ortamlardan kaçınılmalı.",
        gorme: "Materyaller büyük puntolu (18-24 punto) veya kabartmalı (Braille) hazırlanmalı. Sesli kitaplar ve betimleme yöntemleri kullanılmalı. Sınıf düzeni sabit tutulmalı, eşyaların yeri değiştirilmemeli. Sınavlarda okutman-yazman desteği sağlanmalı.",
        bedensel: "Sınıfın fiziksel erişilebilirliği (rampa, geniş kapı, uygun sıra) sağlanmalı. Yazma güçlüğü varsa tablet/bilgisayar kullanımına izin verilmeli veya sözlü not alma teşvik edilmeli. Ek sınav süresi ve mola hakkı tanınmalı.",
        dil_konusma: "Sözü kesilmeden, sabırla dinlenmeli. Konuşurken acele ettirilmemeli ve tamamlanmamalı. Alay edilmesine veya taklit edilmesine kesinlikle izin verilmemeli. Kendini rahat hissettiği ortamlarda konuşmaya cesaretlendirilmeli. Göz teması ile dinlendiği hissettirilmeli.",
        ustun_yetenek: "Standart müfredat zenginleştirilmeli ve derinleştirilmeli. Proje tabanlı öğrenme, problem çözme ve araştırma ödevleri verilmeli. Merak duygusunu tatmin edecek ek kaynaklar sunulmalı. Liderlik görevleri verilebilir. Tekrarlardan kaçınılmalı."
    }
};
