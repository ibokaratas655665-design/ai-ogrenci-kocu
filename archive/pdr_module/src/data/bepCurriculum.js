/**
 * 🎓 ÖZEL EĞİTİM / BEP MÜFREDATI
 *
 * ⚠️ Bu veri sınav müfredatından (TYT/AYT/LGS) TÜRETİLMEZ.
 * BEP, sınava hazırlık değil; özel eğitim ders çizelgeleri ve
 * gelişim alanları üzerinden yürür.
 *
 * Kaynak: MEB Özel Eğitim ve Rehberlik Hizmetleri Genel Müdürlüğü (ÖRGM)
 * haftalık ders çizelgeleri ve destek eğitim programları.
 *
 * NOT: Ders adları ÖRGM çizelgelerine göre yazılmıştır; haftalık ders
 * SAATLERİ okul türüne ve güncel çizelgeye göre değiştiği için buraya
 * konmamıştır — kurumunuzun yürürlükteki çizelgesinden teyit ediniz.
 */

// ══════════════════════════════════════════════════════════════
//  1. OKUL / EĞİTİM ORTAMI TÜRLERİ VE DERSLERİ
// ══════════════════════════════════════════════════════════════

export const SCHOOL_TYPES = {
    uygulama1: {
        id: 'uygulama1',
        label: 'Özel Eğitim Uygulama Okulu — I. Kademe',
        note: 'Orta/ağır düzeyde zihinsel yetersizliği veya otizmi olan bireyler (ilkokul düzeyi)',
        courses: [
            'Türkçe',
            'Matematik',
            'Hayat Bilgisi',
            'Özbakım Becerileri',
            'Bilişsel Becerileri Destekleme',
            'Toplumsal Uyum Becerileri',
            'İletişim ve Sosyal Beceriler',
            'Oyun ve Fiziki Etkinlikler',
            'Görsel Sanatlar',
            'Müzik',
            'Din Kültürü ve Ahlak Bilgisi',
            'Serbest Etkinlikler',
        ],
    },
    uygulama2: {
        id: 'uygulama2',
        label: 'Özel Eğitim Uygulama Okulu — II. Kademe',
        note: 'Ortaokul düzeyi',
        courses: [
            'Türkçe',
            'Matematik',
            'Fen Bilimleri',
            'Sosyal Bilgiler',
            'Özbakım Becerileri',
            'Bilişsel Becerileri Destekleme',
            'Toplumsal Uyum Becerileri',
            'İletişim ve Sosyal Beceriler',
            'Beden Eğitimi ve Spor',
            'Görsel Sanatlar',
            'Müzik',
            'Teknoloji ve Tasarım',
            'Din Kültürü ve Ahlak Bilgisi',
            'Serbest Etkinlikler',
        ],
    },
    uygulama3: {
        id: 'uygulama3',
        label: 'Özel Eğitim Uygulama Okulu — III. Kademe',
        note: 'Lise düzeyi; iş ve bağımsız yaşam ağırlıklı',
        courses: [
            'Türkçe',
            'Matematik',
            'Sosyal Hayat',
            'Özbakım Becerileri',
            'Bağımsız Yaşam Becerileri',
            'Toplumsal Uyum Becerileri',
            'İş Eğitimi ve Meslek Becerileri',
            'Bilişsel Becerileri Destekleme',
            'Beden Eğitimi ve Spor',
            'Görsel Sanatlar',
            'Müzik',
            'Din Kültürü ve Ahlak Bilgisi',
            'Serbest Etkinlikler',
        ],
    },
    ozelIlkokul: {
        id: 'ozelIlkokul',
        label: 'Özel Eğitim İlkokulu',
        note: 'Hafif düzeyde yetersizliği olan bireyler',
        courses: [
            'Türkçe', 'Matematik', 'Hayat Bilgisi', 'Fen Bilimleri',
            'Sosyal Bilgiler', 'İngilizce', 'Din Kültürü ve Ahlak Bilgisi',
            'Görsel Sanatlar', 'Müzik', 'Oyun ve Fiziki Etkinlikler',
            'Özbakım Becerileri', 'Serbest Etkinlikler',
        ],
    },
    ozelOrtaokul: {
        id: 'ozelOrtaokul',
        label: 'Özel Eğitim Ortaokulu',
        courses: [
            'Türkçe', 'Matematik', 'Fen Bilimleri', 'Sosyal Bilgiler',
            'T.C. İnkılap Tarihi ve Atatürkçülük', 'İngilizce',
            'Din Kültürü ve Ahlak Bilgisi', 'Görsel Sanatlar', 'Müzik',
            'Beden Eğitimi ve Spor', 'Teknoloji ve Tasarım',
            'Bilişim Teknolojileri', 'Serbest Etkinlikler',
        ],
    },
    kaynastirma: {
        id: 'kaynastirma',
        label: 'Kaynaştırma / Bütünleştirme (genel eğitim sınıfı)',
        note: 'Öğrenci akranlarıyla aynı dersleri alır; BEP yalnızca güçlük yaşanan derslere yazılır',
        courses: [
            'Türkçe', 'Matematik', 'Fen Bilimleri', 'Sosyal Bilgiler',
            'Hayat Bilgisi', 'T.C. İnkılap Tarihi ve Atatürkçülük',
            'İngilizce', 'Din Kültürü ve Ahlak Bilgisi',
            'Görsel Sanatlar', 'Müzik', 'Beden Eğitimi ve Spor',
            'Teknoloji ve Tasarım', 'Bilişim Teknolojileri',
            'Türk Dili ve Edebiyatı', 'Fizik', 'Kimya', 'Biyoloji',
            'Tarih', 'Coğrafya', 'Felsefe', 'Rehberlik ve Yönlendirme',
        ],
    },
    destekOdasi: {
        id: 'destekOdasi',
        label: 'Destek Eğitim Odası',
        note: 'Öğrencinin güçlük yaşadığı derslerde birebir destek',
        courses: [
            'Türkçe', 'Matematik', 'Fen Bilimleri', 'Sosyal Bilgiler',
            'İngilizce', 'Okuma-Yazma Desteği', 'Temel Matematik Desteği',
        ],
    },
    evdeEgitim: {
        id: 'evdeEgitim',
        label: 'Evde Eğitim',
        courses: ['Türkçe', 'Matematik', 'Fen Bilimleri', 'Sosyal Bilgiler', 'Din Kültürü ve Ahlak Bilgisi'],
    },
};

/** Tüm ders adlarının birleşik ve tekilleştirilmiş listesi. */
export const ALL_BEP_COURSES = [
    ...new Set(Object.values(SCHOOL_TYPES).flatMap((t) => t.courses)),
].sort((a, b) => a.localeCompare(b, 'tr'));

export const coursesForSchoolType = (typeId) =>
    SCHOOL_TYPES[typeId]?.courses || ALL_BEP_COURSES;

// ══════════════════════════════════════════════════════════════
//  2. GELİŞİM ALANLARI VE KAZANIM BAŞLIKLARI
//     BEP amaçları ders kazanımından değil, gelişim alanından çıkar.
// ══════════════════════════════════════════════════════════════

export const DEVELOPMENT_AREAS = {
    bilissel: {
        label: 'Bilişsel Gelişim',
        icon: '🧠',
        topics: [
            'Dikkat ve odaklanma', 'Eşleştirme', 'Sınıflandırma', 'Sıralama',
            'Renk-şekil-boyut kavramları', 'Sayı kavramı ve sayma',
            'Bellek ve hatırlama', 'Neden-sonuç ilişkisi kurma',
            'Problem çözme', 'Yönerge takibi',
        ],
    },
    dilIletisim: {
        label: 'Dil ve İletişim Gelişimi',
        icon: '💬',
        topics: [
            'Göz kontağı kurma', 'Sesli uyarana tepki verme',
            'Alıcı dil (söyleneni anlama)', 'İfade edici dil (kendini anlatma)',
            'Sözcük dağarcığını genişletme', 'Cümle kurma',
            'Soru sorma ve cevaplama', 'Sıra alarak konuşma',
            'Alternatif iletişim (PECS, işaret, tablet)', 'Artikülasyon',
        ],
    },
    motor: {
        label: 'Motor Gelişim',
        icon: '🤸',
        topics: [
            'Kaba motor — yürüme, koşma, denge', 'Kaba motor — atma, tutma, zıplama',
            'İnce motor — kalem tutma', 'İnce motor — makas kullanma',
            'İnce motor — düğme, fermuar, bağcık', 'El-göz koordinasyonu',
            'Çizgi çalışmaları', 'Duyusal bütünleme',
        ],
    },
    sosyalDuygusal: {
        label: 'Sosyal-Duygusal Gelişim',
        icon: '🤝',
        topics: [
            'Selamlaşma ve nezaket ifadeleri', 'Sıra bekleme',
            'Paylaşma ve iş birliği', 'Duygularını tanıma ve ifade etme',
            'Öfke kontrolü', 'Grup etkinliğine katılma',
            'Akranla oyun kurma', 'Kurallara uyma', 'Yardım isteme',
            'Uygun olmayan davranışı azaltma',
        ],
    },
    ozbakim: {
        label: 'Özbakım ve Günlük Yaşam',
        icon: '🧼',
        topics: [
            'El yıkama ve kişisel temizlik', 'Tuvalet becerisi',
            'Giyinme-soyunma', 'Beslenme becerileri (kaşık, çatal, bardak)',
            'Diş fırçalama', 'Kıyafet seçimi ve bakımı',
            'Eşyalarını toplama', 'Güvenlik kuralları',
        ],
    },
    akademik: {
        label: 'Akademik Beceriler',
        icon: '📚',
        topics: [
            'Okuma — harf tanıma', 'Okuma — hece ve kelime okuma',
            'Okuma — akıcı okuma ve anlama', 'Yazma — çizgi ve harf yazma',
            'Yazma — kelime ve cümle yazma', 'Matematik — sayı tanıma ve yazma',
            'Matematik — toplama işlemi', 'Matematik — çıkarma işlemi',
            'Matematik — çarpma ve bölme', 'Matematik — problem çözme',
            'Matematik — para ve zaman', 'Matematik — ölçme',
        ],
    },
    toplumsalUyum: {
        label: 'Toplumsal Uyum',
        icon: '🏙️',
        topics: [
            'Toplu taşıma kullanma', 'Alışveriş yapma', 'Para kullanma',
            'Kamu kurumlarında işlem yapma', 'Trafik kuralları',
            'Telefon kullanma', 'Acil durumda yardım isteme',
            'Sosyal ortamlarda uygun davranış',
        ],
    },
    isMeslek: {
        label: 'İş ve Meslek Becerileri',
        icon: '🛠️',
        topics: [
            'İş güvenliği kuralları', 'Araç-gereç tanıma ve kullanma',
            'Basit montaj ve paketleme', 'Sıralı iş basamaklarını izleme',
            'İş yerinde iletişim', 'Zamanında iş bitirme',
            'Ürün kalite kontrolü', 'Meslek seçimi ve yönlendirme',
        ],
    },
    bagimsizHareket: {
        label: 'Bağımsız Hareket ve Yönelim',
        icon: '🦯',
        note: 'Görme yetersizliği olan bireyler için',
        topics: [
            'Baston kullanma', 'İç mekânda yönelim', 'Dış mekânda yönelim',
            'Braille okuma-yazma', 'Kabartma materyal kullanma',
            'İşitsel ipuçlarını kullanma',
        ],
    },
    isitselAlgi: {
        label: 'İşitsel Algı ve Konuşma',
        icon: '👂',
        note: 'İşitme yetersizliği olan bireyler için',
        topics: [
            'Cihaz kullanımı ve bakımı', 'Ses farkındalığı',
            'Sesleri ayırt etme', 'Dudak okuma',
            'Türk İşaret Dili', 'Konuşma sesi üretimi',
        ],
    },
};

/** Yetersizlik türüne göre öncelikli gelişim alanları. */
export const AREAS_FOR_DISABILITY = {
    'Özel Öğrenme Güçlüğü': ['akademik', 'bilissel', 'dilIletisim'],
    'Hafif Düzeyde Zihinsel Yetersizlik': ['akademik', 'bilissel', 'ozbakim', 'sosyalDuygusal'],
    'Orta Düzeyde Zihinsel Yetersizlik': ['ozbakim', 'bilissel', 'dilIletisim', 'toplumsalUyum'],
    'Ağır Düzeyde Zihinsel Yetersizlik': ['ozbakim', 'motor', 'dilIletisim'],
    'Dil ve Konuşma Güçlüğü': ['dilIletisim', 'sosyalDuygusal', 'akademik'],
    'Görme Yetersizliği': ['bagimsizHareket', 'akademik', 'ozbakim'],
    'İşitme Yetersizliği': ['isitselAlgi', 'dilIletisim', 'akademik'],
    'Bedensel Yetersizlik (Ortopedik)': ['motor', 'ozbakim', 'akademik'],
    'Otizm Spektrum Bozukluğu': ['dilIletisim', 'sosyalDuygusal', 'ozbakim', 'bilissel'],
    'Dikkat Eksikliği ve Hiperaktivite Bozukluğu': ['bilissel', 'sosyalDuygusal', 'akademik'],
    'Duygusal ve Davranış Bozukluğu': ['sosyalDuygusal', 'bilissel'],
    'Süreğen Hastalık': ['akademik', 'sosyalDuygusal'],
    'Üstün Yetenekli / Özel Yetenekli': ['akademik', 'bilissel', 'sosyalDuygusal'],
    'Birden Fazla Yetersizlik': ['ozbakim', 'motor', 'dilIletisim', 'bilissel'],
};

export const suggestedAreas = (disabilityType) =>
    (AREAS_FOR_DISABILITY[disabilityType] || ['akademik', 'bilissel'])
        .map((k) => ({ key: k, ...DEVELOPMENT_AREAS[k] }))
        .filter((a) => a.label);

// ══════════════════════════════════════════════════════════════
//  3. DESTEK EĞİTİM PROGRAMLARI (RAM / rehabilitasyon modülleri)
// ══════════════════════════════════════════════════════════════

export const SUPPORT_PROGRAMS = [
    'Zihinsel Engelli Bireyler Destek Eğitim Programı',
    'Otistik Bireyler Destek Eğitim Programı',
    'Özel Öğrenme Güçlüğü Destek Eğitim Programı',
    'Dil ve Konuşma Güçlüğü Destek Eğitim Programı',
    'Görme Engelli Bireyler Destek Eğitim Programı',
    'İşitme Engelli Bireyler Destek Eğitim Programı',
    'Bedensel Engelli Bireyler Destek Eğitim Programı',
    'Üstün Yetenekli Bireyler Destek Eğitim Programı',
];

// ══════════════════════════════════════════════════════════════
//  4. BEP BİRİMİ ROLLERİ — kim derse girer, kim girmez
// ══════════════════════════════════════════════════════════════

/**
 * `teaches: true` olan roller için ders/branş alanı istenir.
 * Diğerleri birimde görev alır ama derse girmez; onlara ders
 * sormak formu yanlış dolduruyordu.
 */
export const BEP_TEAM_ROLES = [
    { id: 'birimBaskani', label: 'Okul Müdürü / Müdür Yardımcısı (Birim Başkanı)', teaches: false },
    { id: 'rehber', label: 'Rehber Öğretmen / Psikolojik Danışman', teaches: false },
    { id: 'ozelEgitim', label: 'Özel Eğitim Öğretmeni', teaches: true },
    { id: 'sinifOgretmeni', label: 'Sınıf Öğretmeni', teaches: true, optionalCourse: true },
    { id: 'dersOgretmeni', label: 'Ders Öğretmeni', teaches: true },
    { id: 'destekOdasiOgretmeni', label: 'Destek Eğitim Odası Öğretmeni', teaches: true },
    { id: 'veli', label: 'Veli', teaches: false },
    { id: 'ogrenci', label: 'Öğrenci', teaches: false },
    { id: 'ramTemsilcisi', label: 'RAM Temsilcisi', teaches: false },
    { id: 'digerUzman', label: 'Diğer Uzman (Fizyoterapist, Dil-Konuşma Terapisti vb.)', teaches: false },
];

export const roleById = (id) => BEP_TEAM_ROLES.find((r) => r.id === id || r.label === id);
export const roleTeaches = (id) => Boolean(roleById(id)?.teaches);

// ══════════════════════════════════════════════════════════════
//  5. PERFORMANS DÜZEYİ ÖLÇEĞİ (ipucu silikleştirme sırası)
// ══════════════════════════════════════════════════════════════

export const PERFORMANCE_LEVELS = [
    { value: 1, label: 'Yapamıyor', hint: 'Beceriyi hiç gerçekleştiremiyor', color: 'var(--danger)' },
    { value: 2, label: 'Fiziksel yardımla yapıyor', hint: 'Elden tutularak', color: '#EA580C' },
    { value: 3, label: 'Model olunduğunda yapıyor', hint: 'Gösterilince taklit ediyor', color: 'var(--warn)' },
    { value: 4, label: 'Sözel ipucuyla yapıyor', hint: 'Hatırlatma yeterli', color: 'var(--c2)' },
    { value: 5, label: 'Bağımsız yapıyor', hint: 'Yardımsız gerçekleştiriyor', color: 'var(--ok)' },
];

// ══════════════════════════════════════════════════════════════
//  6. ÖĞRETİM YÖNTEM VE MATERYAL ÖNERİLERİ
// ══════════════════════════════════════════════════════════════

export const TEACHING_METHODS = [
    'Doğrudan öğretim', 'Basamaklandırılmış öğretim', 'Etkinlik temelli öğretim',
    'Eş zamanlı ipucuyla öğretim', 'Sabit bekleme süreli öğretim',
    'Artan/azalan ipucuyla öğretim', 'Video model ile öğretim',
    'Akran destekli öğretim', 'Somuttan soyuta ilerleme',
    'Olumlu pekiştirme', 'Görsel destekli öğretim (PECS, etkinlik çizelgesi)',
    'Doğal ortamda öğretim', 'Beceri analizi ile öğretim',
];

export const TEACHING_MATERIALS = [
    'Görsel kartlar / resimli materyaller', 'Somut nesneler ve manipülatifler',
    'Sayma pulları / onluk taban blokları', 'Etkinlik çizelgesi',
    'Kabartma materyal / Braille kaynak', 'Tablet ve eğitim uygulamaları',
    'Video model kayıtları', 'İş ve beceri setleri',
    'Büyük puntolu / sadeleştirilmiş metinler', 'Pekiştireç kutusu',
];

export const EVALUATION_METHODS = [
    'Ölçüt bağımlı ölçü aracı', 'Beceri analizi kayıt formu',
    'Doğrudan gözlem ve kayıt', 'Portfolyo değerlendirme',
    'Performans kaydı (yüzde/sıklık)', 'Kontrol listesi',
    'Aile görüşmesi ve bilgilendirme',
];

export default {
    SCHOOL_TYPES, ALL_BEP_COURSES, coursesForSchoolType,
    DEVELOPMENT_AREAS, AREAS_FOR_DISABILITY, suggestedAreas,
    SUPPORT_PROGRAMS, BEP_TEAM_ROLES, roleById, roleTeaches,
    PERFORMANCE_LEVELS, TEACHING_METHODS, TEACHING_MATERIALS, EVALUATION_METHODS,
};
