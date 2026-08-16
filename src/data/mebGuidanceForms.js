/**
 * 📋 MEB REHBERLİK FORMLARI (kamuya açık / okul rehberlik servisinde kullanılan)
 *
 * Buradaki formlar MEB'in yayımladığı ya da okul rehberlik servislerinde
 * serbestçe kullanılan, telife tabi olmayan bireyi tanıma teknikleridir:
 *   - Problem Tarama Envanteri (alan bazlı tarama)
 *   - RİBA — Rehberlik İhtiyacı Belirleme Anketi (ilkokul / ortaokul / lise / öğretmen)
 *   - Öğrenci Tanıma Formu
 *   - Otobiyografi (güdümlü)
 *   - Kimdir Bu? (Kime Göre Ben Neyim)
 *   - Sosyometri
 *   - Çalışma Alışkanlıkları
 *
 * Telifli standart ölçekler (Beck, MMPI, SCL-90, Holland orijinal formu vb.)
 * BİLEREK buraya konmamıştır. Kurumunuz lisanslı bir araç kullanıyorsa
 * maddelerini "Özel Envanter" olarak sisteme kendiniz girebilirsiniz;
 * puanlama, raporlama ve PDF katmanı o araç için de çalışır.
 */

// ── Ortak cevap ölçekleri ─────────────────────────────────────
export const SCALES = {
    /** Problem tarama: madde bir sorun mu? */
    problem: [
        { value: 0, label: 'Sorun değil' },
        { value: 1, label: 'Biraz sorun' },
        { value: 2, label: 'Ciddi sorun' },
    ],
    /** RİBA: bu konuda rehberliğe ihtiyacım var mı? */
    need: [
        { value: 1, label: 'İhtiyacım yok' },
        { value: 2, label: 'Biraz ihtiyacım var' },
        { value: 3, label: 'Çok ihtiyacım var' },
    ],
    /** Beşli katılım */
    likert5: [
        { value: 1, label: 'Hiç uygun değil' },
        { value: 2, label: 'Uygun değil' },
        { value: 3, label: 'Kararsızım' },
        { value: 4, label: 'Uygun' },
        { value: 5, label: 'Tamamen uygun' },
    ],
    /** Sıklık */
    frequency: [
        { value: 1, label: 'Hiçbir zaman' },
        { value: 2, label: 'Nadiren' },
        { value: 3, label: 'Bazen' },
        { value: 4, label: 'Sık sık' },
        { value: 5, label: 'Her zaman' },
    ],
};

// ══════════════════════════════════════════════════════════════
//  PROBLEM TARAMA ENVANTERİ
//  Öğrencinin hangi yaşam alanında zorlandığını tarar.
//  Alanlar: sağlık, okul-ders, aile, kendini tanıma, arkadaşlık,
//           duygusal, gelecek-meslek, ekonomik, boş zaman
// ══════════════════════════════════════════════════════════════
const PROBLEM_SCAN_ITEMS = [
    // ── Sağlık ve Beden (1-10)
    ['Sık sık baş ağrım oluyor', 'saglik'],
    ['Gözlerimde görme sorunu yaşıyorum', 'saglik'],
    ['Yeterince uyuyamıyorum', 'saglik'],
    ['Düzenli ve dengeli beslenemiyorum', 'saglik'],
    ['Sürekli yorgun hissediyorum', 'saglik'],
    ['Boyum veya kilomdan rahatsızım', 'saglik'],
    ['Sık sık hastalanıyorum', 'saglik'],
    ['Sürekli bir ilaç kullanıyorum', 'saglik'],
    ['Spor yapacak zamanım/imkânım yok', 'saglik'],
    ['Bedensel gelişimimle ilgili endişelerim var', 'saglik'],

    // ── Okul ve Ders (11-24)
    ['Derslerde başarısız oluyorum', 'okul'],
    ['Ders çalışmaya bir türlü başlayamıyorum', 'okul'],
    ['Çalıştığım halde öğrenemiyorum', 'okul'],
    ['Öğrendiklerimi çabuk unutuyorum', 'okul'],
    ['Derste dikkatimi toplayamıyorum', 'okul'],
    ['Verimli ders çalışma yöntemini bilmiyorum', 'okul'],
    ['Sınavlarda çok heyecanlanıyorum', 'okul'],
    ['Bazı derslerden korkuyorum', 'okul'],
    ['Öğretmenlerimle iletişim kuramıyorum', 'okul'],
    ['Okula gitmek istemiyorum', 'okul'],
    ['Devamsızlık yapıyorum', 'okul'],
    ['Ödevlerimi zamanında yapamıyorum', 'okul'],
    ['Kitap okuma alışkanlığım yok', 'okul'],
    ['Okulun fiziki koşulları beni rahatsız ediyor', 'okul'],

    // ── Aile (25-36)
    ['Ailemle sık sık tartışıyorum', 'aile'],
    ['Ailem beni anlamıyor', 'aile'],
    ['Anne-babam birbiriyle geçinemiyor', 'aile'],
    ['Ailemin benden beklentisi çok yüksek', 'aile'],
    ['Evde ders çalışacak uygun bir ortam yok', 'aile'],
    ['Kardeşimle sorunlar yaşıyorum', 'aile'],
    ['Ailem arkadaşlarımı onaylamıyor', 'aile'],
    ['Ailemden ayrı yaşıyorum', 'aile'],
    ['Evde bana çok fazla iş düşüyor', 'aile'],
    ['Ailem kararlarıma karışıyor', 'aile'],
    ['Ailemle yeterince vakit geçiremiyorum', 'aile'],
    ['Ailemde hasta/bakıma muhtaç biri var', 'aile'],

    // ── Kendini Tanıma ve Kişilik (37-48)
    ['Kendime güvenim yok', 'kendini_tanima'],
    ['Kararsız bir insanım', 'kendini_tanima'],
    ['Kolay sinirleniyorum', 'kendini_tanima'],
    ['Çok çabuk üzülüyorum', 'kendini_tanima'],
    ['Hayır demekte zorlanıyorum', 'kendini_tanima'],
    ['Kendimi başkalarıyla sürekli kıyaslıyorum', 'kendini_tanima'],
    ['Eleştirilmeye tahammülüm yok', 'kendini_tanima'],
    ['Dış görünüşümden memnun değilim', 'kendini_tanima'],
    ['Ne istediğimi bilmiyorum', 'kendini_tanima'],
    ['İnatçı olduğumu düşünüyorum', 'kendini_tanima'],
    ['Sorumluluk almaktan kaçınıyorum', 'kendini_tanima'],
    ['Kendimi ifade etmekte zorlanıyorum', 'kendini_tanima'],

    // ── Arkadaşlık ve Sosyal (49-60)
    ['Arkadaş edinmekte zorlanıyorum', 'sosyal'],
    ['Arkadaşlarım tarafından dışlanıyorum', 'sosyal'],
    ['Grup içinde konuşmaktan çekiniyorum', 'sosyal'],
    ['Yakın bir arkadaşım yok', 'sosyal'],
    ['Arkadaşlarımla sık sık kavga ediyorum', 'sosyal'],
    ['Akran baskısı hissediyorum', 'sosyal'],
    ['Sosyal ortamlarda kendimi rahat hissetmiyorum', 'sosyal'],
    ['Karşı cinsle iletişimde zorlanıyorum', 'sosyal'],
    ['Sanal ortamda çok fazla vakit geçiriyorum', 'sosyal'],
    ['İnternette rahatsız edici davranışlarla karşılaştım', 'sosyal'],
    ['Okulda kendimi güvende hissetmiyorum', 'sosyal'],
    ['Zorbalığa maruz kaldım', 'sosyal'],

    // ── Duygusal (61-70)
    ['Sürekli mutsuz hissediyorum', 'duygusal'],
    ['Geleceğe umutla bakamıyorum', 'duygusal'],
    ['Kaygılarım günlük hayatımı etkiliyor', 'duygusal'],
    ['Yalnız hissediyorum', 'duygusal'],
    ['Hiçbir şeyden zevk almıyorum', 'duygusal'],
    ['Öfkemi kontrol edemiyorum', 'duygusal'],
    ['Ağlama isteği duyuyorum', 'duygusal'],
    ['Kendimi değersiz hissediyorum', 'duygusal'],
    ['Yaşadığım bir kayıp beni etkiliyor', 'duygusal'],
    ['Konuşacak kimsem yok', 'duygusal'],

    // ── Gelecek ve Meslek (71-82)
    ['Hangi mesleği seçeceğimi bilmiyorum', 'meslek'],
    ['İlgi ve yeteneklerimi tanımıyorum', 'meslek'],
    ['Meslekler hakkında yeterli bilgim yok', 'meslek'],
    ['Ailem istediğim mesleği onaylamıyor', 'meslek'],
    ['Sınavı kazanamayacağımdan korkuyorum', 'meslek'],
    ['Hedefim var ama nasıl ulaşacağımı bilmiyorum', 'meslek'],
    ['Alan/bölüm seçiminde zorlanıyorum', 'meslek'],
    ['Üniversite tercihleri konusunda bilgim yok', 'meslek'],
    ['Okuduğum alandan memnun değilim', 'meslek'],
    ['Çalışma hayatı hakkında bilgim yok', 'meslek'],
    ['Yurt dışı eğitim imkânlarını bilmiyorum', 'meslek'],
    ['Burs ve destek imkânlarını bilmiyorum', 'meslek'],

    // ── Ekonomik ve Boş Zaman (83-90)
    ['Ekonomik sıkıntılarım var', 'ekonomik'],
    ['Kaynak/kitap alamıyorum', 'ekonomik'],
    ['Okul masraflarını karşılamakta zorlanıyorum', 'ekonomik'],
    ['Çalışmak zorunda olduğum için derslere vakit ayıramıyorum', 'ekonomik'],
    ['Boş zamanlarımı verimli değerlendiremiyorum', 'bos_zaman'],
    ['Hiçbir hobim yok', 'bos_zaman'],
    ['Sosyal/kültürel etkinliklere katılamıyorum', 'bos_zaman'],
    ['Ekran başında çok fazla zaman geçiriyorum', 'bos_zaman'],
];

export const PROBLEM_AREAS = {
    saglik: 'Sağlık ve Beden',
    okul: 'Okul ve Ders',
    aile: 'Aile',
    kendini_tanima: 'Kendini Tanıma',
    sosyal: 'Arkadaşlık ve Sosyal İlişkiler',
    duygusal: 'Duygusal Durum',
    meslek: 'Gelecek ve Meslek',
    ekonomik: 'Ekonomik Durum',
    bos_zaman: 'Boş Zaman',
};

// ══════════════════════════════════════════════════════════════
//  RİBA — Rehberlik İhtiyacı Belirleme Anketi
// ══════════════════════════════════════════════════════════════
const RIBA_HIGH_ITEMS = [
    ['Verimli ders çalışma yöntemlerini öğrenmek', 'academic'],
    ['Zamanı iyi kullanmayı öğrenmek', 'academic'],
    ['Sınav kaygısıyla baş etmek', 'academic'],
    ['Dikkatimi toplamayı öğrenmek', 'academic'],
    ['Okuduğunu anlama becerimi geliştirmek', 'academic'],
    ['Not tutma tekniklerini öğrenmek', 'academic'],
    ['Motivasyonumu artırmak', 'academic'],
    ['Hedef belirlemeyi öğrenmek', 'academic'],
    ['Devamsızlık sorunumu çözmek', 'academic'],
    ['Alan/ders seçiminde karar vermek', 'career'],
    ['İlgi ve yeteneklerimi tanımak', 'career'],
    ['Meslekleri ve çalışma koşullarını öğrenmek', 'career'],
    ['Üniversite ve bölümler hakkında bilgi almak', 'career'],
    ['Tercih dönemi hakkında bilgi almak', 'career'],
    ['Meslek seçiminde ailemle anlaşmak', 'career'],
    ['İş hayatı ve staj hakkında bilgi almak', 'career'],
    ['Kendimi tanımak ve kabul etmek', 'personal'],
    ['Özgüvenimi geliştirmek', 'personal'],
    ['Öfkemi kontrol etmeyi öğrenmek', 'personal'],
    ['Kaygı ve stresle baş etmek', 'personal'],
    ['Karar verme becerimi geliştirmek', 'personal'],
    ['Problem çözme becerimi geliştirmek', 'personal'],
    ['Duygularımı ifade etmeyi öğrenmek', 'personal'],
    ['Olumsuz düşüncelerle baş etmek', 'personal'],
    ['Arkadaş ilişkilerimi geliştirmek', 'social'],
    ['İletişim becerilerimi geliştirmek', 'social'],
    ['Hayır demeyi öğrenmek', 'social'],
    ['Akran baskısıyla baş etmek', 'social'],
    ['Zorbalıkla baş etme yollarını öğrenmek', 'social'],
    ['Aile içi iletişimimi geliştirmek', 'social'],
    ['Karşı cinsle sağlıklı ilişki kurmak', 'social'],
    ['Grup içinde kendimi ifade etmek', 'social'],
    ['Bağımlılıklardan korunmak', 'safety'],
    ['Teknoloji ve sosyal medyayı doğru kullanmak', 'safety'],
    ['Sağlıklı beslenme ve uyku düzeni kurmak', 'safety'],
    ['İhmal/istismardan korunma konusunda bilgi almak', 'safety'],
    ['Güvenli internet kullanımı hakkında bilgi almak', 'safety'],
    ['Kriz durumlarında nereye başvuracağımı bilmek', 'safety'],
];

const RIBA_MIDDLE_ITEMS = [
    ['Ders çalışma yöntemlerini öğrenmek', 'academic'],
    ['Zamanımı planlamayı öğrenmek', 'academic'],
    ['Sınav kaygımla baş etmek', 'academic'],
    ['Derste dikkatimi toplamak', 'academic'],
    ['Ödevlerimi düzenli yapmak', 'academic'],
    ['Okuma alışkanlığı kazanmak', 'academic'],
    ['LGS hakkında bilgi almak', 'academic'],
    ['Hedef belirlemeyi öğrenmek', 'academic'],
    ['Lise türlerini tanımak', 'career'],
    ['İlgi ve yeteneklerimi keşfetmek', 'career'],
    ['Meslekleri tanımak', 'career'],
    ['Kendimi tanımak', 'personal'],
    ['Özgüvenimi artırmak', 'personal'],
    ['Öfkemi kontrol etmek', 'personal'],
    ['Kaygımla baş etmek', 'personal'],
    ['Duygularımı ifade etmek', 'personal'],
    ['Sorumluluk almayı öğrenmek', 'personal'],
    ['Arkadaş edinmeyi öğrenmek', 'social'],
    ['Arkadaşlarımla anlaşmazlıkları çözmek', 'social'],
    ['Ailemle iletişimimi geliştirmek', 'social'],
    ['Grup içinde konuşabilmek', 'social'],
    ['Akran zorbalığıyla baş etmek', 'social'],
    ['Ergenlik dönemi değişimlerini anlamak', 'personal'],
    ['Teknolojiyi doğru kullanmak', 'safety'],
    ['Bağımlılıklardan korunmak', 'safety'],
    ['Güvenli internet kullanımı', 'safety'],
    ['Sağlıklı beslenme ve uyku', 'safety'],
    ['Kendimi korumayı öğrenmek', 'safety'],
];

const RIBA_PRIMARY_ITEMS = [
    ['Ders çalışmayı sevmek', 'academic'],
    ['Okuma yazmada zorlanmamak', 'academic'],
    ['Derste parmak kaldırıp konuşabilmek', 'academic'],
    ['Ödevlerimi kendim yapabilmek', 'academic'],
    ['Okula severek gelmek', 'academic'],
    ['Kendimi tanımak', 'personal'],
    ['Korkularımla baş etmek', 'personal'],
    ['Üzüldüğümde ne yapacağımı bilmek', 'personal'],
    ['Kızgınlığımı kontrol etmek', 'personal'],
    ['Kendi işimi kendim yapmak', 'personal'],
    ['Arkadaş edinmek', 'social'],
    ['Arkadaşlarımla paylaşmayı öğrenmek', 'social'],
    ['Kavga etmeden anlaşmak', 'social'],
    ['Ailemle güzel vakit geçirmek', 'social'],
    ['Sıra beklemeyi öğrenmek', 'social'],
    ['Temizlik kurallarını öğrenmek', 'safety'],
    ['Trafikte güvenli olmak', 'safety'],
    ['Yabancılara karşı dikkatli olmak', 'safety'],
    ['Sağlıklı beslenmek', 'safety'],
    ['Ekran süremi ayarlamak', 'safety'],
];

const RIBA_TEACHER_ITEMS = [
    ['Sınıf yönetimi konusunda destek', 'professional'],
    ['İstenmeyen öğrenci davranışlarıyla baş etme', 'professional'],
    ['Öğrenci motivasyonunu artırma teknikleri', 'professional'],
    ['Ölçme ve değerlendirme uygulamaları', 'professional'],
    ['Veli görüşmelerini yürütme', 'professional'],
    ['Öğretim yöntem ve teknikleri', 'professional'],
    ['Öğrencilerin akademik başarısını izleme', 'student'],
    ['Devamsızlık sorunu olan öğrenciler', 'student'],
    ['Sınav kaygısı yaşayan öğrenciler', 'student'],
    ['Akademik olarak geride kalan öğrenciler', 'student'],
    ['Üstün yetenekli öğrencilere yaklaşım', 'special'],
    ['Kaynaştırma öğrencilerine yaklaşım', 'special'],
    ['BEP hazırlama ve uygulama', 'special'],
    ['Öğrenme güçlüğü olan öğrenciler', 'special'],
    ['Dikkat eksikliği olan öğrenciler', 'special'],
    ['Akran zorbalığı vakalarına müdahale', 'safety'],
    ['İhmal ve istismar şüphesinde izlenecek yol', 'safety'],
    ['Bağımlılık riski taşıyan öğrenciler', 'safety'],
    ['Kriz durumlarında müdahale', 'safety'],
    ['Sosyal medya kaynaklı sorunlar', 'safety'],
    ['Öğrenciler arası çatışma çözümü', 'social'],
    ['Sınıf içi grup dinamiğini yönetme', 'social'],
    ['Uyum sorunu yaşayan öğrenciler', 'social'],
    ['Göçmen/farklı kültürden öğrencilere yaklaşım', 'social'],
    ['Mesleki yönlendirme yapabilme', 'career'],
];

// ══════════════════════════════════════════════════════════════
//  Metin/form tabanlı teknikler
// ══════════════════════════════════════════════════════════════
const AUTOBIOGRAPHY_PROMPTS = [
    'Kendini tanıt: adın, yaşın, ailen, yaşadığın yer.',
    'Ailenle ilişkini anlat. Kimlerle yaşıyorsun, evde nasıl bir ortam var?',
    'Okul hayatın nasıl başladı? İlk yıllarını hatırlıyor musun?',
    'En sevdiğin ve en zorlandığın dersler hangileri? Neden?',
    'Arkadaş ilişkilerini nasıl tanımlarsın?',
    'Hayatında seni en çok etkileyen olay neydi?',
    'En mutlu olduğun anı anlat.',
    'En üzüldüğün anı anlat.',
    'Kendinde beğendiğin özellikler neler?',
    'Kendinde değiştirmek istediğin özellikler neler?',
    'Boş zamanlarında ne yapmaktan hoşlanırsın?',
    'Gelecekte kendini nerede görüyorsun?',
    'Hangi mesleği yapmak istiyorsun? Neden?',
    'Hedefine ulaşmanı zorlaştıran şeyler neler?',
    'Sana destek olan kişiler kimler?',
    'Rehberlik servisinden ne bekliyorsun?',
];

const KGBN_ITEMS = [
    'Sınıfın en çalışkan öğrencisi kimdir?',
    'Sınıfta en çok kimle vakit geçirmek istersin?',
    'Bir sorunun olsa kime anlatırsın?',
    'Sınıfın en neşeli öğrencisi kimdir?',
    'Grup çalışmasında kimle çalışmak istersin?',
    'Sınıfın en yardımsever öğrencisi kimdir?',
    'En çok kime güvenirsin?',
    'Sınıf başkanı olsa kim olsun isterdin?',
    'Sınıfın en sessiz öğrencisi kimdir?',
    'Sınıfta en çok kim liderlik yapar?',
    'Bir yarışmada sınıfı kim temsil etmeli?',
    'Sınıfın en yaratıcı öğrencisi kimdir?',
    'Kimin daha çok arkadaşa ihtiyacı var?',
    'Sınıfta en çok kim şaka yapar?',
    'Bir gezide kiminle aynı grupta olmak istersin?',
];

const SOCIOMETRY_ITEMS = [
    'Sınıfta en çok kiminle arkadaşlık etmek istersin? (3 kişi yazabilirsin)',
    'Bir grup çalışmasında kimlerle aynı grupta olmak istersin? (3 kişi)',
    'Bir sorunun olsa kime danışırsın? (2 kişi)',
    'Okul dışında kimlerle vakit geçirirsin? (3 kişi)',
    'Sınıf gezisinde kimin yanında oturmak istersin? (2 kişi)',
    'Kiminle çalışmak istemezsin? (isteğe bağlı)',
];

const STUDENT_INFO_FIELDS = [
    ['Adı Soyadı', 'text'],
    ['Doğum Tarihi ve Yeri', 'text'],
    ['T.C. Kimlik No', 'text'],
    ['Sınıf / Şube / Okul No', 'text'],
    ['Ev Adresi', 'textarea'],
    ['Öğrenci Telefonu', 'text'],
    ['Anne Adı - Mesleği - Öğrenim Durumu', 'text'],
    ['Baba Adı - Mesleği - Öğrenim Durumu', 'text'],
    ['Veli Telefonu', 'text'],
    ['Anne-baba birlikte mi? (Birlikte / Ayrı / Vefat)', 'text'],
    ['Kardeş Sayısı ve Kaçıncı Çocuk', 'text'],
    ['Ailenin Aylık Geliri (aralık)', 'text'],
    ['Evde kendine ait çalışma odası var mı?', 'text'],
    ['Kimlerle birlikte yaşıyor?', 'text'],
    ['Sürekli bir hastalığı / kullandığı ilaç', 'textarea'],
    ['Geçirdiği önemli hastalık / ameliyat / kaza', 'textarea'],
    ['Görme - işitme - konuşma durumu', 'text'],
    ['Özel eğitim / RAM raporu var mı?', 'text'],
    ['Sevdiği dersler', 'text'],
    ['Zorlandığı dersler', 'text'],
    ['Başarı durumu (önceki yıl ortalaması)', 'text'],
    ['Devamsızlık durumu', 'text'],
    ['İlgi alanları ve hobileri', 'textarea'],
    ['Katıldığı sosyal / sportif etkinlikler', 'textarea'],
    ['Hedeflediği meslek', 'text'],
    ['Hedeflediği lise / üniversite - bölüm', 'text'],
    ['Okul dışında çalışıyor mu?', 'text'],
    ['Rehberlik servisinden beklentisi', 'textarea'],
    ['Öğretmen gözlemleri / notlar', 'textarea'],
];

// ══════════════════════════════════════════════════════════════
//  Test tanımlarına dönüştürme
// ══════════════════════════════════════════════════════════════
const toItems = (rows, startId = 1) =>
    rows.map(([text, category], i) => ({ id: startId + i, text, category }));

const toPrompts = (rows, startId = 1) =>
    rows.map((text, i) => ({ id: startId + i, text, type: 'open' }));

export const MEB_FORMS = {
    problem_scan: {
        id: 'problem_scan',
        title: 'Problem Tarama Envanteri',
        description: 'Öğrencinin hangi yaşam alanlarında zorlandığını belirleyen tarama envanteri.',
        category: 'Bireyi Tanıma',
        source: 'MEB rehberlik uygulamaları',
        duration: 20,
        scaleType: 'problem',
        scale: SCALES.problem,
        areas: PROBLEM_AREAS,
        questions: toItems(PROBLEM_SCAN_ITEMS),
    },
    riba_high: {
        id: 'riba_high',
        title: 'RİBA — Rehberlik İhtiyacı Belirleme Anketi (Lise)',
        description: 'Lise öğrencisinin hangi rehberlik alanlarında desteğe ihtiyaç duyduğunu belirler.',
        category: 'İhtiyaç Belirleme',
        source: 'MEB RİBA formu',
        duration: 15,
        scaleType: 'need',
        scale: SCALES.need,
        questions: toItems(RIBA_HIGH_ITEMS),
    },
    riba_middle: {
        id: 'riba_middle',
        title: 'RİBA — Rehberlik İhtiyacı Belirleme Anketi (Ortaokul)',
        description: 'Ortaokul öğrencisinin rehberlik ihtiyacını belirler.',
        category: 'İhtiyaç Belirleme',
        source: 'MEB RİBA formu',
        duration: 12,
        scaleType: 'need',
        scale: SCALES.need,
        questions: toItems(RIBA_MIDDLE_ITEMS),
    },
    riba_primary: {
        id: 'riba_primary',
        title: 'RİBA — Rehberlik İhtiyacı Belirleme Anketi (İlkokul)',
        description: 'İlkokul öğrencisinin rehberlik ihtiyacını belirler. Sade dil kullanılmıştır.',
        category: 'İhtiyaç Belirleme',
        source: 'MEB RİBA formu',
        duration: 10,
        scaleType: 'need',
        scale: SCALES.need,
        questions: toItems(RIBA_PRIMARY_ITEMS),
    },
    riba_teacher: {
        id: 'riba_teacher',
        title: 'RİBA — Öğretmen Formu',
        description: 'Öğretmenin sınıfı ve öğrencileri için hangi rehberlik desteğine ihtiyaç duyduğunu belirler.',
        category: 'İhtiyaç Belirleme',
        source: 'MEB RİBA formu',
        duration: 12,
        scaleType: 'need',
        scale: SCALES.need,
        audience: 'teacher',
        questions: toItems(RIBA_TEACHER_ITEMS),
    },
    autobiography: {
        id: 'autobiography',
        title: 'Otobiyografi (Güdümlü)',
        description: 'Öğrencinin kendi hayatını yönlendirilmiş sorularla anlattığı bireyi tanıma tekniği.',
        category: 'Bireyi Tanıma',
        source: 'MEB test dışı teknikler',
        duration: 30,
        scaleType: 'open',
        questions: toPrompts(AUTOBIOGRAPHY_PROMPTS),
    },
    kgbn: {
        id: 'kgbn',
        title: 'Kimdir Bu? (Kime Göre Ben Neyim)',
        description: 'Sınıf içinde akran değerlendirmesine dayalı bireyi tanıma tekniği.',
        category: 'Grup Teknikleri',
        source: 'MEB test dışı teknikler',
        duration: 15,
        scaleType: 'peer',
        questions: toPrompts(KGBN_ITEMS),
    },
    sociometry: {
        id: 'sociometry',
        title: 'Sosyometri (Sınıf İçi İlişkiler)',
        description: 'Sınıf içi ilişki ağını, gözde ve dışlanan öğrencileri belirleyen grup tekniği.',
        category: 'Grup Teknikleri',
        source: 'MEB test dışı teknikler',
        duration: 10,
        scaleType: 'peer',
        questions: toPrompts(SOCIOMETRY_ITEMS),
    },
    student_info_form: {
        id: 'student_info_form',
        title: 'Öğrenci Tanıma Formu',
        description: 'Öğrencinin kimlik, aile, sağlık, akademik ve mesleki bilgilerini toplayan kapsamlı form.',
        category: 'Bireyi Tanıma',
        source: 'MEB öğrenci tanıma formu',
        duration: 20,
        scaleType: 'form',
        fields: STUDENT_INFO_FIELDS.map(([label, type], i) => ({ id: i + 1, label, type })),
        questions: STUDENT_INFO_FIELDS.map(([label, type], i) => ({ id: i + 1, text: label, type })),
    },
};

export default MEB_FORMS;
