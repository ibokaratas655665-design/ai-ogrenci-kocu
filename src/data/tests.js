import { MEB_FORMS } from './mebGuidanceForms';


const BASE_TESTS = {
    // 1. Holland Mesleki İlgi Envanteri (90 Soru - Tam Ölçek)
    holland: {
        id: 'holland',
        title: 'Holland Mesleki İlgi Envanteri',
        desc: '90 maddelik kapsamlı kişilik ve meslek analizi.\nUYGULAMA YÖNERGESİ: Lütfen aşağıdaki her bir aktiviteyi okuyun. O işi yapmaktan hoşlanıyorsanız "Hoşlanırım", sevmiyorsanız "Hoşlanmam", karar veremiyorsanız "Fark Etmez" seçeneğini işaretleyin. Yeteneğinizi değil, sadece ilginizi düşünün.',
        questions: [
            // Gerçekçi (R) - 15 Soru
            { id: 1, text: 'Kuşların özelliklerini incelemek.', type: 'R' },
            { id: 2, text: 'Bir marangozla çalışmak.', type: 'R' },
            { id: 3, text: 'Dikiş dikmeyi, örgü örmeyi öğrenmek.', type: 'R' },
            { id: 4, text: 'Radyoyu tamir etmek.', type: 'R' },
            { id: 5, text: 'Bir arabanın yağını değiştirmek.', type: 'R' },
            { id: 6, text: 'Bahçeyle uğraşmak, bitki yetiştirmek.', type: 'R' },
            { id: 7, text: 'Ahşap eşyalar yapmak.', type: 'R' },
            { id: 8, text: 'Bir makinenin nasıl çalıştığını incelemek.', type: 'R' },
            { id: 9, text: 'Doğa yürüyüşlerine çıkmak.', type: 'R' },
            { id: 10, text: 'Elektronik aletlerin montajını yapmak.', type: 'R' },
            { id: 11, text: 'Beton karıştırmak veya duvar örmek.', type: 'R' },
            { id: 12, text: 'Bisiklet veya araba yarışlarını izlemek.', type: 'R' },
            { id: 13, text: 'Kendi başına tamirat yapmak.', type: 'R' },
            { id: 14, text: 'Hayvanların bakımıyla ilgilenmek.', type: 'R' },
            { id: 15, text: 'Metal veya ağaç işçiliği dersi almak.', type: 'R' },

            // Araştırmacı (A) - 15 Soru
            { id: 16, text: 'Bilimsel dergi ve makaleleri okumak.', type: 'A' },
            { id: 17, text: 'Laboratuvar ortamında çalışmak.', type: 'A' },
            { id: 18, text: 'Bir hastalığın nedenlerini araştırmak.', type: 'A' },
            { id: 19, text: 'Kimyasal deneyler yapmak.', type: 'A' },
            { id: 20, text: 'Fizik kuralları üzerine düşünmek.', type: 'A' },
            { id: 21, text: 'Teleskopla yıldızları incelemek.', type: 'A' },
            { id: 22, text: 'Matematiksel problemleri çözmek.', type: 'A' },
            { id: 23, text: 'İnsan davranışlarının nedenlerini incelemek.', type: 'A' },
            { id: 24, text: 'Bilim insanlarının hayatlarını okumak.', type: 'A' },
            { id: 25, text: 'Hava durumu olaylarını incelemek.', type: 'A' },
            { id: 26, text: 'Teknolojik gelişmeleri takip etmek.', type: 'A' },
            { id: 27, text: 'Satranç veya strateji oyunları oynamak.', type: 'A' },
            { id: 28, text: 'Belgesel izlemek.', type: 'A' },
            { id: 29, text: 'Bir konuyu derinlemesine araştırmak.', type: 'A' },
            { id: 30, text: 'Müzeleri veya bilim merkezlerini gezmek.', type: 'A' },

            // Sanatçı (S) - 15 Soru
            { id: 31, text: 'Şiir veya hikaye yazmak.', type: 'S' },
            { id: 32, text: 'Resim yapmak veya skeç çizmek.', type: 'S' },
            { id: 33, text: 'Bir müzik aleti çalmak.', type: 'S' },
            { id: 34, text: 'Tiyatro oyununda rol almak.', type: 'S' },
            { id: 35, text: 'Dekorasyon ve tasarımla ilgilenmek.', type: 'S' },
            { id: 36, text: 'Sanat galerilerini gezmek.', type: 'S' },
            { id: 37, text: 'Moda ve giyim üzerine kafa yormak.', type: 'S' },
            { id: 38, text: 'Fotoğraf çekmek.', type: 'S' },
            { id: 39, text: 'Dans etmek.', type: 'S' },
            { id: 40, text: 'Şarkı söylemek veya koro çalışmalarına katılmak.', type: 'S' },
            { id: 41, text: 'Yabancı diller öğrenmek.', type: 'S' },
            { id: 42, text: 'Heykel veya seramik yapmak.', type: 'S' },
            { id: 43, text: 'Farklı kültürleri tanımak.', type: 'S' },
            { id: 44, text: 'Filmleri sanatsal açıdan eleştirmek.', type: 'S' },
            { id: 45, text: 'Özgün ve yaratıcı fikirler üretmek.', type: 'S' },

            // Sosyal (E) - 15 Soru
            { id: 46, text: 'İnsanlara sorunlarını çözmede yardım etmek.', type: 'E' },
            { id: 47, text: 'Çocuklara bakmak veya onlarla oynamak.', type: 'E' },
            { id: 48, text: 'Bir konuda başkalarına ders vermek.', type: 'E' },
            { id: 49, text: 'Sosyal yardım kuruluşlarında gönüllü olmak.', type: 'E' },
            { id: 50, text: 'Parti veya etkinlik organize etmek.', type: 'E' },
            { id: 51, text: 'Yeni insanlarla tanışmak.', type: 'E' },
            { id: 52, text: 'Grup tartışmalarına katılmak.', type: 'E' },
            { id: 53, text: 'İnsanları dinlemek ve anlamaya çalışmak.', type: 'E' },
            { id: 54, text: 'Hasta veya yaşlılara bakım vermek.', type: 'E' },
            { id: 55, text: 'Toplum önünde konuşma yapmak.', type: 'E' },
            { id: 56, text: 'Arkadaşlarının dert ortağı olmak.', type: 'E' },
            { id: 57, text: 'Takım sporları yapmak.', type: 'E' },
            { id: 58, text: 'Eğitici oyunlar oynamak.', type: 'E' },
            { id: 59, text: 'İnsan hakları konularıyla ilgilenmek.', type: 'E' },
            { id: 60, text: 'Okul kulüplerinde aktif görev almak.', type: 'E' },

            // Girişimci (G) - 15 Soru
            { id: 61, text: 'Bir malı veya fikri başkalarına satmak.', type: 'G' },
            { id: 62, text: 'Tartışmalarda karşı tarafı ikna etmek.', type: 'G' },
            { id: 63, text: 'Para kazanmak için projeler üretmek.', type: 'G' },
            { id: 64, text: 'Bir grubun lideri olmak.', type: 'G' },
            { id: 65, text: 'Politika ve siyasetle ilgilenmek.', type: 'G' },
            { id: 66, text: 'Kendi işini kurmayı hayal etmek.', type: 'G' },
            { id: 67, text: 'Borsa veya ekonomi haberlerini takip etmek.', type: 'G' },
            { id: 68, text: 'Yarışmalara katılmaktan hoşlanmak.', type: 'G' },
            { id: 69, text: 'Risk almak.', type: 'G' },
            { id: 70, text: 'Bir toplantıyı yönetmek.', type: 'G' },
            { id: 71, text: 'Pazarlık yapmak.', type: 'G' },
            { id: 72, text: 'İnsanları organize etmek.', type: 'G' },
            { id: 73, text: 'Ünlü ve başarılı insanların hayatlarını okumak.', type: 'G' },
            { id: 74, text: 'Reklamcılık ve pazarlama ile ilgilenmek.', type: 'G' },
            { id: 75, text: 'Hedefler koyup onlara ulaşmaya çalışmak.', type: 'G' },

            // Düzenli (D) - 15 Soru
            { id: 76, text: 'Belgeleri dosyalamak ve düzenlemek.', type: 'D' },
            { id: 77, text: 'Hesap işleriyle uğraşmak.', type: 'D' },
            { id: 78, text: 'Bir ofiste çalışmak.', type: 'D' },
            { id: 79, text: 'Detaylı bir işi hatasız yapmak.', type: 'D' },
            { id: 80, text: 'Kuralları ve prosedürleri takip etmek.', type: 'D' },
            { id: 81, text: 'Envanter sayımı yapmak.', type: 'D' },
            { id: 82, text: 'Bilgisayarda veri girişi yapmak.', type: 'D' },
            { id: 83, text: 'Bütçe planlaması yapmak.', type: 'D' },
            { id: 84, text: 'Belirli çalışma saatlerine uymak.', type: 'D' },
            { id: 85, text: 'Yazım kurallarına dikkat etmek.', type: 'D' },
            { id: 86, text: 'Koleksiyon yapmak (pul, para vb.).', type: 'D' },
            { id: 87, text: 'Listeler hazırlamak.', type: 'D' },
            { id: 88, text: 'İşleri sıraya koymak.', type: 'D' },
            { id: 89, text: 'Güvenli ve garantili işleri tercih etmek.', type: 'D' },
            { id: 90, text: 'Matematiksel işlemleri hesap makinesiyle yapmak.', type: 'D' }
        ],
        options: [
            { label: 'Hoşlanmam', value: 0 },
            { label: 'Fark Etmez', value: 1 },
            { label: 'Hoşlanırım', value: 2 },
        ]
    },

    // 2. Çoklu Zeka Envanteri (80 Soru - Tam Ölçek)
    multiple_intelligence: {
        id: 'multiple_intelligence',
        title: 'Çoklu Zeka Envanteri',
        desc: '8 Farklı zeka alanınızı analiz eden detaylı envanter.\nUYGULAMA YÖNERGESİ: Aşağıdaki ifadelerin sizi ne kadar yansıttığını düşünün. Sadece şu anki durumunuzu baz alarak "Bana Hiç Uymaz", "Kısmen Uyar" veya "Bana Çok Uyar" şeklinde değerlendirin.',
        questions: [
            // Sözel-Dilsel - 10 Soru
            { type: 'Linguistic', text: 'Kitap okumayı her zaman çok sevmişimdir.' },
            { type: 'Linguistic', text: 'Kelimelerin anlamlarını ve kökenlerini araştırmayı severim.' },
            { type: 'Linguistic', text: 'Yazı yazarak kendimi daha iyi ifade ederim.' },
            { type: 'Linguistic', text: 'Tekerlemeleri ve kelime oyunlarını severim.' },
            { type: 'Linguistic', text: 'Dinlediğim bir konuşmayı veya hikayeyi kolayca hatırlarım.' },
            { type: 'Linguistic', text: 'İsimler, yerler ve tarihler hafızamda kolayca kalır.' },
            { type: 'Linguistic', text: 'Bulmaca çözmekten hoşlanırım.' },
            { type: 'Linguistic', text: 'İyi bir fıkra veya hikaye anlatıcısıyımdır.' },
            { type: 'Linguistic', text: 'Tartışmalarda sözlü olarak etkili olabilirim.' },
            { type: 'Linguistic', text: 'Yabancı dil öğrenmeye yeteneğim vardır.' },

            // Mantıksal-Matematiksel - 10 Soru
            { type: 'Logical', text: 'Matematik dersi benim için genellikle kolaydır.' },
            { type: 'Logical', text: 'Zihinden hesaplamalar yapabilirim.' },
            { type: 'Logical', text: 'Olaylar arasında neden-sonuç ilişkisi kurmayı severim.' },
            { type: 'Logical', text: 'Bilimsel deneyler yapmaktan hoşlanırım.' },
            { type: 'Logical', text: 'Satranç, dama gibi strateji oyunlarını severim.' },
            { type: 'Logical', text: 'Mantıksal bilmeceleri çözmekten zevk alırım.' },
            { type: 'Logical', text: 'Her şeyin rasyonel bir açıklaması olduğunu düşünürüm.' },
            { type: 'Logical', text: 'Kategorize etme ve sınıflandırma yapmayı severim.' },
            { type: 'Logical', text: 'Soyut kavramlarla düşünmekte zorlanmam.' },
            { type: 'Logical', text: 'Bilgisayar programlama mantığı ilgimi çeker.' },

            // Görsel-Uzamsal - 10 Soru
            { type: 'Visual', text: 'Gözümü kapattığımda nesneleri net bir şekilde hayal edebilirim.' },
            { type: 'Visual', text: 'Harita, grafik ve şemaları kolayca okuyabilirim.' },
            { type: 'Visual', text: 'Yönümü bulmakta iyiyimdir.' },
            { type: 'Visual', text: 'Resim yapmayı ve çizimle uğraşmayı severim.' },
            { type: 'Visual', text: 'Yapboz (puzzle) yapmaktan hoşlanırım.' },
            { type: 'Visual', text: 'Eşyaların yerini değiştirmeyi ve dekorasyonu severim.' },
            { type: 'Visual', text: 'Film ve fotoğraflar, yazılardan daha çok ilgimi çeker.' },
            { type: 'Visual', text: 'Üç boyutlu nesneleri zihnimde döndürebilirim.' },
            { type: 'Visual', text: 'Renk uyumlarına dikkat ederim.' },
            { type: 'Visual', text: 'Hayal kurarken canlı görüntüler görürüm.' },

            // Bedensel-Kinestetik - 10 Soru
            { type: 'Kinesthetic', text: 'Spor yapmak hayatımın önemli bir parçasıdır.' },
            { type: 'Kinesthetic', text: 'Uzun süre hareketsiz oturmakta zorlanırım.' },
            { type: 'Kinesthetic', text: 'El becerisi gerektiren işlerde (tamir, dikiş vb.) iyiyimdir.' },
            { type: 'Kinesthetic', text: 'Bir şeyi öğrenirken dokunarak veya yaparak daha iyi anlarım.' },
            { type: 'Kinesthetic', text: 'Dans etmeyi severim.' },
            { type: 'Kinesthetic', text: 'Konuşurken ellerimi ve kollarımı çok kullanırım.' },
            { type: 'Kinesthetic', text: 'Denge gerektiren hareketleri kolayca yaparım.' },
            { type: 'Kinesthetic', text: 'Rol yapma ve taklit yeteneğim vardır.' },
            { type: 'Kinesthetic', text: 'Fiziksel aktivitelerden sonra kendimi daha iyi hissederim.' },
            { type: 'Kinesthetic', text: 'Yeni bir beceriyi (bisiklet, yüzme) kolayca öğrenirim.' },

            // Müziksel-Ritmik - 10 Soru
            { type: 'Musical', text: 'Şarkıların melodilerini kolayca hatırlarım.' },
            { type: 'Musical', text: 'Müzik dinlemeden ders çalışamam veya iş yapamam.' },
            { type: 'Musical', text: 'Bir enstrüman çalıyorum veya çalmak isterdim.' },
            { type: 'Musical', text: 'Çevremdeki ritmik seslere (saat tiktakları, yağmur) dikkat ederim.' },
            { type: 'Musical', text: 'Kendi kendime şarkı veya mırıldanırım.' },
            { type: 'Musical', text: 'Ses tonlarındaki değişimleri kolayca fark ederim.' },
            { type: 'Musical', text: 'Müzik derslerini severim.' },
            { type: 'Musical', text: 'Şarkı sözlerini kolayca ezberlerim.' },
            { type: 'Musical', text: 'Ritim tutmak hoşuma gider.' },
            { type: 'Musical', text: 'Farklı müzik türlerini dinlemekten zevk alırım.' },

            // Kişilerarası (Sosyal) - 10 Soru
            { type: 'Interpersonal', text: 'Arkadaşlarımla vakit geçirmeyi yalnız kalmaya tercih ederim.' },
            { type: 'Interpersonal', text: 'Başkalarının duygularını ve ruh hallerini kolayca anlarım.' },
            { type: 'Interpersonal', text: 'İnsanlar bana sorunlarını anlatmayı severler.' },
            { type: 'Interpersonal', text: 'Grup çalışmalarında liderlik yapabilirim.' },
            { type: 'Interpersonal', text: 'Yeni insanlarla tanışmaktan çekinmem.' },
            { type: 'Interpersonal', text: 'Çatışma durumlarında arabuluculuk yapabilirim.' },
            { type: 'Interpersonal', text: 'Takım oyunlarını severim.' },
            { type: 'Interpersonal', text: 'Başkalarına bir şeyler öğretmek hoşuma gider.' },
            { type: 'Interpersonal', text: 'Sosyal etkinliklere katılmaktan zevk alırım.' },
            { type: 'Interpersonal', text: 'İnsanların yüz ifadelerinden ne düşündüklerini tahmin ederim.' },

            // İçsel (Öze Dönük) - 10 Soru
            { type: 'Intrapersonal', text: 'Yalnız kalıp düşünmek için zamana ihtiyaç duyarım.' },
            { type: 'Intrapersonal', text: 'Kendi güçlü ve zayıf yönlerimi iyi bilirim.' },
            { type: 'Intrapersonal', text: 'Bağımsız çalışmayı grup çalışmasına tercih ederim.' },
            { type: 'Intrapersonal', text: 'Kişisel hedeflerim belirgindir.' },
            { type: 'Intrapersonal', text: 'Günlük tutmayı veya duygularımı yazmayı severim.' },
            { type: 'Intrapersonal', text: 'Kendi kendimi motive edebilirim.' },
            { type: 'Intrapersonal', text: 'Olaylar üzerine derinlemesine düşünürüm.' },
            { type: 'Intrapersonal', text: 'Hayatın anlamı ve felsefi konular ilgimi çeker.' },
            { type: 'Intrapersonal', text: 'Başkalarının benim hakkımdaki düşüncelerinden çok kendi düşüncelerime önem veririm.' },
            { type: 'Intrapersonal', text: 'Hatalarımdan ders çıkarırım.' },

            // Doğacı - 10 Soru
            { type: 'Naturalist', text: 'Doğada vakit geçirmeyi çok severim.' },
            { type: 'Naturalist', text: 'Farklı bitki ve hayvan türlerini tanırım.' },
            { type: 'Naturalist', text: 'Bahçe işleri, çiçek yetiştirmek ilgimi çeker.' },
            { type: 'Naturalist', text: 'Çevre kirliliği ve ekolojik sorunlar beni endişelendirir.' },
            { type: 'Naturalist', text: 'Belgesel izlemeyi severim (özellikle doğa ile ilgili).' },
            { type: 'Naturalist', text: 'Hava durumundaki değişiklikleri fark ederim.' },
            { type: 'Naturalist', text: 'Kamp yapmaktan veya doğa yürüyüşlerinden hoşlanırım.' },
            { type: 'Naturalist', text: 'Evcil hayvan beslerim veya severim.' },
            { type: 'Naturalist', text: 'Taş, yaprak veya deniz kabuğu koleksiyonu yapabilirim.' },
            { type: 'Naturalist', text: 'Astronomi ve gökyüzü olayları ilgimi çeker.' }
        ],
        options: [
            { label: 'Bana Hiç Uymaz', value: 0 },
            { label: 'Kısmen Uyar', value: 1 },
            { label: 'Bana Çok Uyar', value: 2 }
        ]
    },

    // 3. Sınav Kaygısı Ölçeği (Sınav Kaygısı Envanteri - Resmi Form)
    exam_anxiety: {
        id: 'exam_anxiety',
        title: 'Sınav Kaygısı Ölçeği (TAI)',
        desc: 'Sınavlara yönelik duygu ve düşüncelerinizi bilimsel olarak analiz eder. (Spielberger TAI 20 Madde)',
        questions: [
            { text: 'Sınavlarda kendime güvenirim ve rahatım.', isReverse: true },
            { text: 'Sınavlar sürerken soğuk terler dökerim.', isReverse: false },
            { text: 'Önemli sınavların sonuçlarının geleceğimi veya kariyerimi ne kadar etkileyeceğini düşünüp kaygılanırım.', isReverse: false },
            { text: 'Sınavlarda aklımı başka şeylere takmaktan okuduğumu anlayamam.', isReverse: false },
            { text: 'Sınav kağıdını verirken kendimi rahatlamış ve gevşemiş hissederim.', isReverse: true },
            { text: 'Önemli bir sınava girmeden önce karnıma ağrılar girer.', isReverse: false },
            { text: 'Sınavı düşünüyor veya sınava giriyorken başarılı olamayacağım endişesine kapılırım.', isReverse: false },
            { text: 'Bir sınavda elime kağıt-kalem aldığım zaman adeta donup kalırım.', isReverse: false },
            { text: 'Sınav sırasında paniğe kapılırım.', isReverse: false },
            { text: 'Sınav sırasında sinirli olurum ve içim içime sığmaz.', isReverse: false },
            { text: 'Sınav sırasında rahatımdır.', isReverse: true },
            { text: 'Önemli bir çalışma yaparken kafamın darmadağın olduğunu hissederim.', isReverse: false },
            { text: 'Sınavlar sürerken o dersten ne kadar geçer not alacağımı düşünmek beni kaygılandırır.', isReverse: false },
            { text: 'Sınav sırasında aklıma gelen düşünceler işime engel olur.', isReverse: false },
            { text: 'Bir önemli sınav sırasında heyecandan ne yapacağımı şaşırırım.', isReverse: false },
            { text: 'Sınav sorularının kolay olacağını ümit ederim veya düşünürüm.', isReverse: true },
            { text: 'Bir sınav öncesinde ya da sınav esnasında zihnimin duruşunu hissederim.', isReverse: false },
            { text: 'Sınıftaki diğer arkadaşlarımla notumu kıyaslamaktan dolayı endişelenirim.', isReverse: false },
            { text: 'Sınavlarda başarısız olmaktan çok korkarım.', isReverse: false },
            { text: 'Ne kadar çalışırsam çalışayım, sınav yaklaştıkça kendimi yetersiz hissederim.', isReverse: false }
        ],
        options: [
            { label: 'Hemen Hiçbir Zaman', value: 1 },
            { label: 'Bazen', value: 2 },
            { label: 'Sık Sık', value: 3 },
            { label: 'Hemen Her Zaman', value: 4 }
        ]
    },

    // 4. Verimli Ders Çalışma Anketi (Tam Sürüm - 40 Soru)
    study_habits: {
        id: 'study_habits',
        title: 'Verimli Ders Çalışma Anketi',
        desc: 'Çalışma yöntemlerinizi ve ortamınızı detaylı analiz edin.\nUYGULAMA YÖNERGESİ: Cümlelerde geçen çalışma davranışlarını kendinizde ne sıklıkla gözlemlediğinizi dürüstçe işaretleyin. Bu test, doğruları değil, mevcut alışkanlıklarınızı tespit etmek içindir.',
        questions: [
            // Planlama
            { text: 'Ders çalışmak için belirli bir zaman ayırmam, canım isteyince çalışırım.', category: 'planning' },
            { text: 'Çalışma programı hazırlasam da buna uyamam.', category: 'planning' },
            { text: 'Günlük, haftalık ve aylık tekrar planlarım yoktur.', category: 'planning' },
            { text: 'Sınav tarihlerini ve ödev teslim günlerini sık sık unuturum.', category: 'planning' },
            { text: 'Ders çalışmaya başlamadan önce ne yapacağımı planlamam.', category: 'planning' },
            { text: 'Zamanımı boşa harcadığımı düşünürüm ama engel olamam.', category: 'planning' },

            // Ortam
            { text: 'Çalışma masamda dikkat dağıtıcı eşyalar (telefon, tablet) bulunur.', category: 'environment' },
            { text: 'Ders çalışırken müzik dinlerim.', category: 'environment' },
            { text: 'Ders çalışırken yatarak veya uzanarak çalışırım.', category: 'environment' },
            { text: 'Çalışma odam çok sıcak veya çok soğuktur.', category: 'environment' },
            { text: 'Çalışma masam dağınıktır, aradığımı bulamam.', category: 'environment' },
            { text: 'Televizyon açıkken ders çalışmaya çalışırım.', category: 'environment' },

            // Yöntem
            { text: 'Konuyu anlamadan ezberlemeye çalışırım.', category: 'method' },
            { text: 'Derste not tutma alışkanlığım yoktur.', category: 'method' },
            { text: 'Anlamadığım konuları öğretmenime sormaktan çekinirim.', category: 'participation' },
            { text: 'Tekrar yapma alışkanlığım yoktur.', category: 'repetition' },
            { text: 'Hangi derse nasıl çalışacağımı bilmiyorum.', category: 'method' },
            { text: 'Ders kitaplarından başka kaynak kullanmam.', category: 'resource' },
            { text: 'Önemli yerlerin altını çizerek çalışmam.', category: 'method' },
            { text: 'Kendi kendime soru sorarak çalışmam.', category: 'method' },

            // Odaklanma
            { text: 'Ders çalışırken sık sık ara verir ve geri dönmekte zorlanırım.', category: 'focus' },
            { text: 'Çalışırken hayallere dalarım.', category: 'focus' },
            { text: 'Ders çalışırken aklım başka şeylere kayar.', category: 'focus' },
            { text: 'Uzun süre bir konuya odaklanamam.', category: 'focus' },
            { text: 'Ders çalışırken telefonumla çok oynarım.', category: 'focus' },

            // Motivasyon ve Zaman Yönetimi
            { text: 'Ödevlerimi son güne bırakırım.', category: 'time_mgmt' },
            { text: 'Sınavlardan önceki gece sabaha kadar çalışırım.', category: 'time_mgmt' },
            { text: 'Ders çalışmak bana çok sıkıcı gelir.', category: 'motivation' },
            { text: 'Çalışmaya başlamakta güçlük çekerim.', category: 'motivation' },
            { text: 'Başarısız olduğumda çalışmayı bırakırım.', category: 'motivation' },
            { text: 'Kendime çalışma hedefleri koymam.', category: 'motivation' }
        ],
        options: [
            { label: 'Her Zaman (Olumsuz)', value: 1 },
            { label: 'Genellikle', value: 2 },
            { label: 'Bazen', value: 3 },
            { label: 'Hiçbir Zaman (Olumlu)', value: 4 }
        ]
    },

    // 5. Akademik Benlik Saygısı (Tam Sürüm - 20 Soru)
    academic_self: {
        id: 'academic_self',
        title: 'Akademik Benlik Saygısı Ölçeği',
        desc: 'Okul başarınıza ve yeteneklerinize olan inancınızı değerlendirin.\nUYGULAMA YÖNERGESİ: Aşağıdaki ifadelerin sizi ne kadar yansıttığını düşünerek en uygun seçeneği işaretleyin. Bu test, kendinize olan güveninizi ölçer.',
        questions: [
            { text: 'Derslerde başarılı olabileceğime inanıyorum.', category: 'confidence' },
            { text: 'Öğretmenlerimin beklentilerini karşılayabilirim.', category: 'confidence' },
            { text: 'Zor konuları öğrenmekte güçlük çekerim.', category: 'difficulty' },
            { text: 'Okulda kendimi yetersiz hissederim.', category: 'inadequacy' },
            { text: 'Arkadaşlarıma göre derslerde daha yavaş ilerliyorum.', category: 'comparison' },
            { text: 'Çaba gösterirsem her dersi başarabilirim.', category: 'effort' },
            { text: 'Sınavlarda genellikle bildiğim soruları yaparım.', category: 'competition' },
            { text: 'Sınıf içinde söz alıp konuşmaktan çekinmem.', category: 'participation' },
            { text: 'Ödevlerimi tek başıma yapabilirim.', category: 'independence' },
            { text: 'Okulla ilgili konularda kendime güvenirim.', category: 'confidence' },
            { text: 'Yeni bir konuyu öğrenirken çok zorlanırım.', category: 'difficulty' },
            { text: 'Sınav sonuçlarım gerçek yeteneğimi yansıtmaz.', category: 'inadequacy' },
            { text: 'Başarılı öğrencilerin yanında kendimi kötü hissederim.', category: 'comparison' },
            { text: 'Derslerde parmak kaldırmaktan korkarım.', category: 'participation' },
            { text: 'Matematik ve Fen derslerinde iyiyimdir.', category: 'confidence' },
            { text: 'Sözel derslerde kendime güvenirim.', category: 'confidence' },
            { text: 'Okul başarısı benim için önemlidir.', category: 'effort' },
            { text: 'Başarısız olduğumda hemen pes ederim.', category: 'effort' },
            { text: 'Öğretmenlerim beni zeki bulur.', category: 'confidence' },
            { text: 'Ailem okul başarım konusunda bana güvenir.', category: 'confidence' }
        ],
        options: [
            { label: 'Kesinlikle Katılmıyorum', value: 1 },
            { label: 'Katılmıyorum', value: 2 },
            { label: 'Katılıyorum', value: 3 },
            { label: 'Kesinlikle Katılıyorum', value: 4 }
        ]
    },

    // 6. Başarısızlık Nedenleri Anketi (Tam Sürüm - 25 Soru)
    failure_reasons: {
        id: 'failure_reasons',
        title: 'Başarısızlık Nedenleri Anketi',
        desc: 'Ders başarınızı olumsuz etkileyen faktörleri belirleyin.\nUYGULAMA YÖNERGESİ: Derslerinizde beklediğiniz başarıya ulaşmanızı engelleyen durumları "Evet", engel olmayanları "Hayır" şeklinde dürüstçe işaretleyin.',
        questions: [
            { text: 'Ailemle yaşadığım sorunlar derslerimi etkiliyor.', category: 'family' },
            { text: 'Ailem bana çok baskı yapıyor.', category: 'family' },
            { text: 'Ailem ders çalışmam için uygun ortamı sağlamıyor.', category: 'family' },

            { text: 'Temel bilgilerimin eksik olduğunu düşünüyorum.', category: 'knowledge' },
            { text: 'Önceki yıllardan gelen konu eksiklerim var.', category: 'knowledge' },

            { text: 'Ders çalışma yöntemini bilmiyorum.', category: 'method' },
            { text: 'Planlı ve programlı çalışamıyorum.', category: 'method' },

            { text: 'Öğretmenlerimle iletişim kurmakta zorlanıyorum.', category: 'teacher' },
            { text: 'Öğretmenlerimin ders anlatışını anlamıyorum.', category: 'teacher' },

            { text: 'Sağlık sorunlarım derslerimi engelliyor.', category: 'health' },
            { text: 'Sık sık hastalanırım.', category: 'health' },

            { text: 'Arkadaş çevrem ders çalışmamı engelliyor.', category: 'social' },
            { text: 'Arkadaşlarımla gezmekten ders çalışmaya vakit kalmıyor.', category: 'social' },

            { text: 'Motivasyonum çok düşük, ders çalışmak istemiyorum.', category: 'motivation' },
            { text: 'Başarılı olacağıma inanmıyorum.', category: 'motivation' },

            { text: 'Evde ders çalışacak uygun ortamım yok.', category: 'environment' },
            { text: 'Evimiz çok gürültülü.', category: 'environment' },

            { text: 'Okula isteksiz gidiyorum.', category: 'motivation' },
            { text: 'Dersler bana çok zor ve karmaşık geliyor.', category: 'curriculum' },

            { text: 'Gelecekle ilgili bir hedefim yok.', category: 'goal' },
            { text: 'Okumanın bana bir şey kazandıracağına inanmıyorum.', category: 'goal' },

            { text: 'Telefon ve bilgisayar çok vaktimi alıyor.', category: 'technology' },
            { text: 'Oyun oynamaktan ders çalışamıyorum.', category: 'technology' },
            { text: 'Sosyal medyada çok vakit geçiriyorum.', category: 'technology' }
        ],
        options: [
            { label: 'Hayır', value: 0 },
            { label: 'Evet', value: 1 }
        ]
    },

    // 7. Problem Tarama Envanteri (PTE - Tam Sürüm 50 Madde Örneği)
    problem_scan: {
        id: 'problem_scan',
        title: 'Problem Tarama Envanteri',
        desc: 'Hayatınızda sizi en çok zorlayan alanları belirleyin.\nUYGULAMA YÖNERGESİ: Lütfen aşağıdaki madderleri hızlıca okuyun. Sizi son zamanlarda rahatsız eden, hayatınızda bir sorun teşkil ettiğini düşündüğünüz maddelere "Evet", sorun olmayanlara "Hayır" deyin.',
        questions: [
            // Sağlık
            { text: 'Sık sık baş ağrısı çekerim.', category: 'health' },
            { text: 'Gözlerimden rahatsızım.', category: 'health' },
            { text: 'Çabuk yorulurum.', category: 'health' },
            { text: 'Uykusuzluk çekerim.', category: 'health' },
            { text: 'İştahsızım veya çok yemek yerim.', category: 'health' },
            { text: 'Sık sık midem ağrır.', category: 'health' },

            // Okul
            { text: 'Ders çalışırken dikkatimi toplayamam.', category: 'school' },
            { text: 'Okuduğumu anlamakta güçlük çekerim.', category: 'school' },
            { text: 'Sınavlarda heyecanlanırım.', category: 'school' },
            { text: 'Derste söz almaktan korkarım.', category: 'school' },
            { text: 'Ödevlerimi yapmakta zorlanırım.', category: 'school' },
            { text: 'Okula gitmek istemiyorum.', category: 'school' },
            { text: 'Bazı öğretmenlerden korkarım.', category: 'school' },
            { text: 'Ders yükü bana ağır geliyor.', category: 'school' },

            // Aile
            { text: 'Ailem beni anlamıyor.', category: 'family' },
            { text: 'Evde huzursuzluk var.', category: 'family' },
            { text: 'Kardeşlerimle geçinemiyorum.', category: 'family' },
            { text: 'Babam veya annem çok otoriter.', category: 'family' },
            { text: 'Ailem benden çok şey bekliyor.', category: 'family' },
            { text: 'Evde bana ait bir oda yok.', category: 'family' },

            // Sosyal
            { text: 'Arkadaş edinmekte zorlanıyorum.', category: 'social' },
            { text: 'Kendimi yalnız hissediyorum.', category: 'social' },
            { text: 'Arkadaş grubuna girmekte zorlanırım.', category: 'social' },
            { text: 'Karşı cinsle iletişim kurmakta zorlanırım.', category: 'social' },
            { text: 'İnsanların beni sevmediğini düşünürüm.', category: 'social' },

            // Kişisel
            { text: 'Çabuk sinirlenirim.', category: 'personal' },
            { text: 'Karar vermekte güçlük çekerim.', category: 'personal' },
            { text: 'Gelecekten umutsuzum.', category: 'personal' },
            { text: 'Kendime güvenim azdır.', category: 'personal' },
            { text: 'Hata yapmaktan çok korkarım.', category: 'personal' },
            { text: 'Sık sık hayallere dalarım.', category: 'personal' },
            { text: 'Çoğu zaman mutsuzum.', category: 'personal' },

            // Ekonomik
            { text: 'Maddi durumumuz beni endişelendiriyor.', category: 'economic' },
            { text: 'Harçlığım yetmiyor.', category: 'economic' },
            { text: 'İstediğim kıyafetleri alamıyorum.', category: 'economic' },
            { text: 'Okul masraflarımı karşılamakta zorlanıyoruz.', category: 'economic' }
        ],
        options: [
            { label: 'Hayır', value: 0 },
            { label: 'Evet', value: 1 }
        ]
    },

    // 8. Beier Cümle Tamamlama Testi (Genişletilmiş - 30 Cümle)
    beier: {
        id: 'beier',
        title: 'Beier Cümle Tamamlama Testi',
        desc: 'Bilinçaltı süreçlerinizi ve duygu dünyanızı yansıtan projektif bir testtir.\nUYGULAMA YÖNERGESİ: Aşağıdaki eksik cümleleri okuduğunuzda *aklınıza gelen ilk düşünceyle*, fazla üzerinde düşünmeden olabildiğince hızlı ve dürüstçe tamamlayınız.',
        inputType: 'text', // TestRunner bunu algılayıp textfield açacak
        questions: [
            { text: '1. Gelecek bana...', category: 'future' },
            { text: '2. Şayet idare elimde olsaydı...', category: 'leadership' },
            { text: '3. Okul arkadaşlarımla beraber olmak...', category: 'social' },
            { text: '4. Hiç kimse hayatının...', category: 'philosophy' },
            { text: '5. Benim en büyük korkum...', category: 'fear' },
            { text: '6. Erkekler genellikle...', category: 'social_gender' },
            { text: '7. Geceleri...', category: 'time' },
            { text: '8. Şuna inanıyorum ki, ekseriyetle insanlar...', category: 'social' },
            { text: '9. Annem ve ben...', category: 'family' },
            { text: '10. İnsanın kendi kendine kızması...', category: 'emotion' },
            { text: '11. Okulda benim en çok bulunduğum hal...', category: 'school' },
            { text: '12. En çok seveceğim meslek...', category: 'future' },
            { text: '13. Kendimi en mesut hissettiğim zaman...', category: 'positive' },
            { text: '14. Sinirlendiğim zaman...', category: 'emotion' },
            { text: '15. Keşke ben...', category: 'wish' },
            { text: '16. Daima yorulurum...', category: 'physical' },
            { text: '17. Yalnız kaldığım zaman...', category: 'inner' },
            { text: '18. Kadınlar genellikle...', category: 'social_gender' },
            { text: '19. Okul arkadaşlarım...', category: 'school' },
            { text: '20. Hayat bence...', category: 'philosophy' },
            { text: '21. Babam...', category: 'family' },
            { text: '22. Zannederim ki başkaları...', category: 'social_perception' },
            { text: '23. İnsanların benden kaçınmasının sebebi...', category: 'social_anxiety' },
            { text: '24. Başkaları hakkında düşündüğüm şey...', category: 'social_perception' },
            { text: '25. Bence en mükemmel insan...', category: 'ideal' },
            { text: '26. Yaptığım en büyük yalnışlık...', category: 'regret' },
            { text: '27. Para söz konusu olduğu zaman...', category: 'desire' },
            { text: '28. Arkadaşlarıma nazaran ben...', category: 'comparison' },
            { text: '29. Öğretmenlerim...', category: 'school' },
            { text: '30. Beni en çok endişelendiren şey...', category: 'anxiety' }
        ],
        options: [] // Text input olduğu için option yok
    },

    // 9. Kime Göre Ben Neyim? (Genişletilmiş - 30 Madde)
    kgbn: {
        id: 'kgbn',
        title: 'Kime Göre Ben Neyim?',
        desc: 'Kendinizi başkalarının gözünden değerlendirin.\nUYGULAMA YÖNERGESİ: Size yönelik ifadelerin "Aileniz", "Öğretmenleriniz" ve "Arkadaşlarınız" tarafından nasıl görüldüğünü düşünerek cevaplayınız.',
        questions: [
            // Aile Algısı
            { text: 'Aileme göre ben sorumluluk sahibiyim.', category: 'family' },
            { text: 'Aileme göre ben dağınığım.', category: 'family' },
            { text: 'Aileme göre ben çalışkanım.', category: 'family' },
            { text: 'Aileme göre ben sinirliyim.', category: 'family' },
            { text: 'Aileme göre ben yardımseverim.', category: 'family' },
            { text: 'Aileme göre ben inatçıyım.', category: 'family' },
            { text: 'Aileme göre ben dürüstüm.', category: 'family' },
            { text: 'Aileme göre ben savurganım.', category: 'family' },
            { text: 'Aileme göre ben içine kapanığım.', category: 'family' },
            { text: 'Aileme göre ben yetenekliyim.', category: 'family' },

            // Öğretmen Algısı
            { text: 'Öğretmenlerime göre ben çalışkanım.', category: 'school' },
            { text: 'Öğretmenlerime göre ben derse katılmam.', category: 'school' },
            { text: 'Öğretmenlerime göre ben saygılıyım.', category: 'school' },
            { text: 'Öğretmenlerime göre ben zekiyim.', category: 'school' },
            { text: 'Öğretmenlerime göre ben dikkatsizim.', category: 'school' },
            { text: 'Öğretmenlerime göre ben lider özellikliyim.', category: 'school' },
            { text: 'Öğretmenlerime göre ben sessizim.', category: 'school' },
            { text: 'Öğretmenlerime göre ben arkadaşlarıyla iyi geçinirim.', category: 'school' },
            { text: 'Öğretmenlerime göre ben ödevlerimi yapmam.', category: 'school' },
            { text: 'Öğretmenlerime göre ben derste konuşurum.', category: 'school' },

            // Arkadaş Algısı
            { text: 'Arkadaşlarıma göre ben eğlenceliyim.', category: 'social' },
            { text: 'Arkadaşlarıma göre ben güvenilirim.', category: 'social' },
            { text: 'Arkadaşlarıma göre ben sır tutarım.', category: 'social' },
            { text: 'Arkadaşlarıma göre ben kavgacıyım.', category: 'social' },
            { text: 'Arkadaşlarıma göre ben popülerim.', category: 'social' },
            { text: 'Arkadaşlarıma göre ben yardımseverim.', category: 'social' },
            { text: 'Arkadaşlarıma göre ben şakacıyım.', category: 'social' },
            { text: 'Arkadaşlarıma göre ben alınganım.', category: 'social' },

            // Kendi Algısı
            { text: 'Kendime göre ben yetenekliyim.', category: 'self' },
            { text: 'Kendime göre ben yalnızım.', category: 'self' },
            { text: 'Kendime göre ben başarılıyım.', category: 'self' },
            { text: 'Kendime göre ben mutluyum.', category: 'self' },
            { text: 'Kendime göre ben çirkinim.', category: 'self' },
            { text: 'Kendime göre ben güçlüyüm.', category: 'self' }
        ],
        options: [
            { label: 'Katılmıyorum', value: 1 },
            { label: 'Kısmen Katılıyorum', value: 2 },
            { label: 'Tamamen Katılıyorum', value: 3 }
        ]
    },

    // 10. Dikkat ve Odaklanma Ölçeği
    attention_focus: {
        id: 'attention_focus',
        title: 'Dikkat ve Odaklanma Ölçeği',
        desc: 'Dikkat dağınıklığı ve odaklanma sorunlarınızı analiz edin.\nUYGULAMA YÖNERGESİ: Günlük hayatınızda ve ders çalışırken yaşadığınız dikkat durumlarını en doğru yansıtan sıklık derecesini işaretleyiniz.',
        questions: [
            { text: 'Ders çalışırken en ufak seste dikkatim dağılır.', category: 'distraction' },
            { text: 'Bir işi bitirmeden diğerine geçerim.', category: 'impulsivity' },
            { text: 'Karşımda konuşan kişiyi dinlemekte zorlanırım.', category: 'focus' },
            { text: 'Detay gerektiren işlerde çok hata yaparım.', category: 'attention' },
            { text: 'Eşyalarımı (kalem, kitap vb.) sık sık kaybederim.', category: 'organization' },
            { text: 'Uzun süre sabit oturamam, kıpırdanırım.', category: 'hyperactivity' },
            { text: 'Başladığım ödevleri bitirmekte zorlanırım.', category: 'persistence' },
            { text: 'Planlı hareket etmekte güçlük çekerim.', category: 'planning' },
            { text: 'Unutkanlık günlük hayatımı etkiler.', category: 'memory' },
            { text: 'Sıramı beklemekte sabırsızlanırım.', category: 'impulsivity' },
            { text: 'Zihinsel çaba gerektiren işlerden kaçınırım.', category: 'avoidance' },
            { text: 'Okurken satır atlarım veya okuduğumu anlamam.', category: 'reading' },
            { text: 'Düşünmeden ani kararlar veririm.', category: 'impulsivity' },
            { text: 'Ders sırasında hayallere dalarım.', category: 'inattention' },
            { text: 'Bana verilen talimatları takip etmekte zorlanırım.', category: 'compliance' }
        ],
        options: [
            { label: 'Hiçbir Zaman', value: 0 },
            { label: 'Bazen', value: 1 },
            { label: 'Sık Sık', value: 2 },
            { label: 'Her Zaman', value: 3 }
        ]
    },

    // 11. VARK Öğrenme Stilleri Testi
    vark: {
        id: 'vark',
        title: 'VARK Öğrenme Stilleri Testi',
        desc: 'En iyi nasıl öğrendiğinizi keşfedin (Görsel, İşitsel, Okuma/Yazma, Kinestetik).\nUYGULAMA YÖNERGESİ: Her durumu hayal edin ve normalde ne yapacağınızı veya ne hissedeceğinizi düşünerek o duruma en uygun olan 1 (bir) şıkkı seçin.',
        questions: [
            {
                text: 'Yeni bir elektronik alet aldığınızda ne yaparsınız?',
                options: [
                    { text: 'Kullanma kılavuzunu okurum.', type: 'R' },
                    { text: 'Resimlere ve şemalara bakarım.', type: 'V' },
                    { text: 'Doğrudan kurcalamaya başlarım.', type: 'K' },
                    { text: 'Bilen birine sorarım.', type: 'A' }
                ]
            },
            {
                text: 'Yol tarifi alırken hangisini tercih edersiniz?',
                options: [
                    { text: 'Harita veya kroki çizilmesini.', type: 'V' },
                    { text: 'Yazılı talimatları.', type: 'R' },
                    { text: 'Sözlü olarak anlatılmasını.', type: 'A' },
                    { text: 'Beni oraya götürmelerini veya tarif edileni zihnimde canlandırmayı (gitmiş kadar olmayı).', type: 'K' }
                ]
            },
            {
                text: 'Boş zamanınızda hangisini yapmayı tercih edersiniz?',
                options: [
                    { text: 'Kitap okumak.', type: 'R' },
                    { text: 'Müzik dinlemek veya sohbet etmek.', type: 'A' },
                    { text: 'Spor yapmak veya el işleriyle uğraşmak.', type: 'K' },
                    { text: 'Film izlemek veya sergi gezmek.', type: 'V' }
                ]
            },
            {
                text: 'Bir sınavda en çok hangisinde zorlanırsınız?',
                options: [
                    { text: 'Şekil ve grafik yorumlama.', type: 'V' },
                    { text: 'Uzun paragrafları okuma.', type: 'R' },
                    { text: 'Dinleme (Listenning) bölümleri.', type: 'A' },
                    { text: 'Sadece kağıt üzerinde işlem yapma (uygulama yoksa).', type: 'K' }
                ]
            },
            {
                text: 'Ders çalışırken en çok neyi kullanırsınız?',
                options: [
                    { text: 'Renkli kalemler ve fosforlu işaretleyiciler.', type: 'V' },
                    { text: 'Ses kayıtları veya çalışma arkadaşı.', type: 'A' },
                    { text: 'Ders notları ve özet kağıtları.', type: 'R' },
                    { text: 'Deney setleri veya modellemeler.', type: 'K' }
                ]
            },
            {
                text: 'Bir şeyi öğrenirken en çok hangisi aklınızda kalır?',
                options: [
                    { text: 'Gördüklerim.', type: 'V' },
                    { text: 'Duyduklarım.', type: 'A' },
                    { text: 'Okuduklarım.', type: 'R' },
                    { text: 'Yaptıklarım.', type: 'K' }
                ]
            },
            {
                text: 'Birine bir işi öğretirken ne yaparsınız?',
                options: [
                    { text: 'Nasıl yapıldığını gösteririm.', type: 'V' },
                    { text: 'Yazılı talimat veririm.', type: 'R' },
                    { text: 'Sözlü olarak anlatırım.', type: 'A' },
                    { text: 'Yapmasına yardım ederim / uygulatırım.', type: 'K' }
                ]
            },
            {
                text: 'Karar verirken neye dikkat edersiniz?',
                options: [
                    { text: 'Görüntüsüne ve estetiğine.', type: 'V' },
                    { text: 'Hakkında yazılan yorumlara ve özelliklere.', type: 'R' },
                    { text: 'Başkalarının fikirlerine ve tavsiyelerine.', type: 'A' },
                    { text: 'Nasıl hissettirdiğine ve kullanışlılığına.', type: 'K' }
                ]
            }
        ]
        // Note: No standard 'options' array because each question has specific option objects with types
    },

    // 12. KARAR VERME STİLLERİ ÖLÇEĞİ (20 Madde)
    decision_making: {
        id: 'decision_making',
        title: 'Karar Verme Stilleri Ölçeği',
        desc: 'Karar verirken hangi yaklaşımı benimsediğinizi analiz edin.\nUYGULAMA YÖNERGESİ: Önemli bir karar almanız gerektiğinde genellikle nasıl davrandığınızı düşünerek maddeleri cevaplayınız.',
        questions: [
            { text: 'Önemli kararları verirken uzun süre düşünürüm.', type: 'rational' },
            { text: 'Kararlarımı içgüdülerime göre veririm.', type: 'intuitive' },
            { text: 'Karar vermeden önce başkalarına danışırım.', type: 'dependent' },
            { text: 'Kararlarımı aceleyle, düşünmeden veririm.', type: 'spontaneous' },
            { text: 'Karar vermekten kaçınır, erteleme yaparım.', type: 'avoidant' },
            { text: 'Artı ve eksileri listeleyerek karar veririm.', type: 'rational' },
            { text: 'İçimden gelen sese kulak veririm.', type: 'intuitive' },
            { text: 'Ailem veya arkadaşlarımın fikrini alırım.', type: 'dependent' },
            { text: 'Anında karar vermekten hoşlanırım.', type: 'spontaneous' },
            { text: 'Karar anında tereddüt eder, geri adım atarım.', type: 'avoidant' },
            { text: 'Mantıklı ve rasyonel düşünmeye önem veririm.', type: 'rational' },
            { text: 'Duygularıma güvenirim.', type: 'intuitive' },
            { text: 'Kararlarımda başkalarının onayını isterim.', type: 'dependent' },
            { text: 'Çabuk ve hızlı hareket ederim.', type: 'spontaneous' },
            { text: 'Karar vermekte zorlanıyorum.', type: 'avoidant' },
            { text: 'Verilerle, bilgilerle karar veririm.', type: 'rational' },
            { text: '"Bana göre bu" diye hissederim.', type: 'intuitive' },
            { text: 'Başkalarının ne yapacağını merak eder, ona göre hareket ederim.', type: 'dependent' },
            { text: 'İlk aklıma geleni seçerim.', type: 'spontaneous' },
            { text: 'Kararsızlık beni çok yorar.', type: 'avoidant' }
        ],
        options: ['Hiçbir Zaman', 'Nadiren', 'Bazen', 'Sık Sık', 'Her Zaman']
    },

    // 13. AKADEMİK GÜDÜLENME ÖLÇEĞİ (25 Madde)
    academic_motivation: {
        id: 'academic_motivation',
        title: 'Akademik Güdülenme Ölçeği',
        desc: 'Okula ve derslere yönelik motivasyonunuzu değerlendirin.\nUYGULAMA YÖNERGESİ: Okumaya ve öğrenmeye dair hislerinizi en iyi ifade eden seçeneği işaretleyiniz.',
        questions: [
            { text: 'Okulda başarılı olmak benim için önemlidir.', type: 'intrinsic' },
            { text: 'İyi notlar almak için ders çalışırım.', type: 'extrinsic' },
            { text: 'Öğrenmeyi sevdiğim için okula giderim.', type: 'intrinsic' },
            { text: 'Ailem başarılı olmamı beklediği için çalışırım.', type: 'extrinsic' },
            { text: 'Yeni şeyler öğrenmek beni heyecanlandırır.', type: 'intrinsic' },
            { text: 'Ödül veya takdir almak için derse katılırım.', type: 'extrinsic' },
            { text: 'Merakımı gidermek için araştırma yaparım.', type: 'intrinsic' },
            { text: 'Ceza almamak için ödevlerimi yaparım.', type: 'extrinsic' },
            { text: 'Bir konuyu anlamak bana zevk verir.', type: 'intrinsic' },
            { text: 'Sınavlarda yüksek not almak için çalışırım.', type: 'extrinsic' },
            { text: 'Zorunlu olduğu için okula gidiyorum.', type: 'amotivation' },
            { text: 'Ders çalışmanın bana ne kazandıracağını bilmiyorum.', type: 'amotivation' },
            { text: 'Okul bana anlamsız geliyor.', type: 'amotivation' },
            { text: 'Çalışmak istediğim için değil, mecbur olduğum için çalışırım.', type: 'amotivation' },
            { text: 'Kitap okumak ve araştırma yapmak hoşuma gider.', type: 'intrinsic' },
            { text: 'Başarılı olursam hediye alacağım için ders çalışırım.', type: 'extrinsic' },
            { text: 'Kendimi geliştirmek için çaba gösteririm.', type: 'intrinsic' },
            { text: 'Arkadaşlarımdan geri kalmamak için çalışırım.', type: 'extrinsic' },
            { text: 'Zor bir problemi çözünce mutlu olurum.', type: 'intrinsic' },
            { text: 'Diploma almak için okula gidiyorum.', type: 'extrinsic' },
            { text: 'Ders çalışmayı zaman kaybı olarak görüyorum.', type: 'amotivation' },
            { text: 'Neden okula gittiğimi bilmiyorum.', type: 'amotivation' },
            { text: 'Öğrendiklerimi hayatımda kullanabileceğimi düşünürüm.', type: 'intrinsic' },
            { text: 'Sadece geçer not almak için çalışırım.', type: 'extrinsic' },
            { text: 'Okul beni sıkıyor, başka çarem yok.', type: 'amotivation' }
        ],
        options: ['Kesinlikle Katılmıyorum', 'Katılmıyorum', 'Kararsızım', 'Katılıyorum', 'Kesinlikle Katılıyorum']
    },

    // 14. STRESLE BAŞA ÇIKMA ENVANTERİ (28 Madde)
    stress_coping: {
        id: 'stress_coping',
        title: 'Stresle Başa Çıkma Envanteri',
        desc: 'Stresli durumlarla nasıl başa çıktığınızı öğrenin.\nUYGULAMA YÖNERGESİ: Zor bir durumla karşılaştığınızda (sınav stresi, ailevi sorunlar vb.) genellikle hangi yöntemi kullandığınızı işaretleyin.',
        questions: [
            { text: 'Sorunu çözmek için plan yaparım.', type: 'problem_focused' },
            { text: 'Sorunu farklı açılardan değerlendiririm.', type: 'problem_focused' },
            { text: 'Sorunla doğrudan yüzleşirim.', type: 'problem_focused' },
            { text: 'Çözüm yolları ararım.', type: 'problem_focused' },
            { text: 'Adım adım ne yapacağımı planlarım.', type: 'problem_focused' },
            { text: 'Duygularımı başkalarıyla paylaşırım.', type: 'emotion_focused' },
            { text: 'Kendimi daha iyi hissetmek için hobilerle uğraşırım.', type: 'emotion_focused' },
            { text: 'Dua ederim veya meditasyon yaparım.', type: 'emotion_focused' },
            { text: 'Arkadaşlarımla vakit geçiririm.', type: 'emotion_focused' },
            { text: 'Müzik dinler veya film izlerim.', type: 'emotion_focused' },
            { text: 'Sorunu yok sayarım.', type: 'avoidance' },
            { text: 'Olmamış gibi davranırım.', type: 'avoidance' },
            { text: 'Konuyu düşünmemeye çalışırım.', type: 'avoidance' },
            { text: 'Oyun oynar, internette vakit geçiririm.', type: 'avoidance' },
            { text: 'Sorunu ertelemeye çalışırım.', type: 'avoidance' },
            { text: 'Yardım isterim.', type: 'social_support' },
            { text: 'Ailemle konuşurum.', type: 'social_support' },
            { text: 'Bir uzmana danışırım.', type: 'social_support' },
            { text: 'Arkadaşlarımdan destek alırım.', type: 'social_support' },
            { text: 'Öğretmenime veya rehber öğretmenime giderim.', type: 'social_support' },
            { text: 'Kendimi suçlarım.', type: 'negative' },
            { text: 'Öfkelenir, bağırırım.', type: 'negative' },
            { text: 'Ağlarım.', type: 'negative' },
            { text: 'Kendime zarar verici düşüncelere kapılırım.', type: 'negative' },
            { text: 'Umutsuzluğa kapılırım.', type: 'negative' },
            { text: 'Pozitif düşünmeye çalışırım.', type: 'positive_reframing' },
            { text: '"Her şey daha iyi olacak" derim.', type: 'positive_reframing' },
            { text: 'Sorundan ders çıkarmaya çalışırım.', type: 'positive_reframing' }
        ],
        options: ['Hiçbir Zaman', 'Nadiren', 'Bazen', 'Genellikle', 'Her Zaman']
    },

    // 15. SOSYAL BECERİ ENVANTERİ (30 Madde)
    social_skills: {
        id: 'social_skills',
        title: 'Sosyal Beceri Envanteri',
        desc: 'Sosyal ilişkilerinizde ne kadar yetkin olduğunuzu değerlendirin.\nUYGULAMA YÖNERGESİ: Diğer insanlarla iletişim kurarken kendinizde gözlemlediğiniz özellikleri dürüstçe puanlayınız.',
        questions: [
            { text: 'Yeni insanlarla tanışmaktan hoşlanırım.', type: 'initiating' },
            { text: 'İlk adımı ben atarım.', type: 'initiating' },
            { text: 'Grup içinde kendimi rahatça ifade ederim.', type: 'initiating' },
            { text: 'İnsanların gözlerinin içine bakarak konuşurum.', type: 'communication' },
            { text: 'Beden dilimi etkili kullanırım.', type: 'communication' },
            { text: 'Net ve anlaşılır konuşurum.', type: 'communication' },
            { text: 'Başkalarını dikkatle dinlerim.', type: 'empathy' },
            { text: 'İnsanların duygularını anlayabilirim.', type: 'empathy' },
            { text: 'Başkalarının yerinde kendimi hayal edebilirim.', type: 'empathy' },
            { text: 'İnsanların sorunlarına duyarlıyım.', type: 'empathy' },
            { text: 'Çatışma anında sakin kalabilirim.', type: 'conflict_resolution' },
            { text: 'Tartışmaları yapıcı şekilde çözebilirim.', type: 'conflict_resolution' },
            { text: 'Anlaşmazlıklarda orta yol bulurum.', type: 'conflict_resolution' },
            { text: '"Hayır" demeyi bilirim.', type: 'assertiveness' },
            { text: 'Haklarımı savunabilirim.', type: 'assertiveness' },
            { text: 'Fikirlerimi açıkça söylerim.', type: 'assertiveness' },
            { text: 'İnsanların ihtiyaçlarına duyarlıyım.', type: 'helping' },
            { text: 'Yardım etmekten mutluluk duyarım.', type: 'helping' },
            { text: 'Arkadaşlarıma destek olurum.', type: 'helping' },
            { text: 'Grup çalışmalarında uyumlu davranırım.', type: 'cooperation' },
            { text: 'İşbirliği yapmayı severim.', type: 'cooperation' },
            { text: 'Takım oyunlarında başarılıyım.', type: 'cooperation' },
            { text: 'Sosyal kuralları bilirim.', type: 'social_norms' },
            { text: 'Ortama uygun davranırım.', type: 'social_norms' },
            { text: 'Görgü kurallarına uyarım.', type: 'social_norms' },
            { text: 'İnsanları ikna edebilirim.', type: 'persuasion' },
            { text: 'Görüşlerimi etkili sunarım.', type: 'persuasion' },
            { text: 'Mizah anlayışım iyidir.', type: 'humor' },
            { text: 'İnsanları güldürebilirim.', type: 'humor' },
            { text: 'Samimi ve içten davranırım.', type: 'genuineness' }
        ],
        options: ['Bana Hiç Uymuyor', 'Az Uyuyor', 'Orta Uyuyor', 'Çok Uyuyor', 'Tamamen Uyuyor']
    },

    // 16. AKADEMİK ERTELEME DAVRANIŞI ÖLÇEĞİ (18 Madde)
    procrastination: {
        id: 'procrastination',
        title: 'Akademik Erteleme Davranışı Ölçeği',
        desc: 'Ödevleri ve görevleri ne kadar ertelediğinizi ölçün.\nUYGULAMA YÖNERGESİ: Okul/Sınav görevlerinizi yaparken aşağıdaki erteleme davranışlarını ne sıklıkla sergilediğinizi işaretleyin.',
        questions: [
            { text: 'Ödevlerimi son güne bırakırım.', score: 'negative' },
            { text: 'Sınavlardan bir gün önce çalışmaya başlarım.', score: 'negative' },
            { text: 'Projeleri teslim tarihine çok yakın bitiririm.', score: 'negative' },
            { text: 'Zamanında başlasam daha rahat olacağımı bilsem de ertelemeyi sürdürürüm.', score: 'negative' },
            { text: 'Ders çalışmayı sürekli "yarına" bırakırım.', score: 'negative' },
            { text: 'Önemli işleri bile son ana kadar bırakırım.', score: 'negative' },
            { text: 'Başlamam gereken işi televizyon izleyerek veya oyun oynayarak geciktiririm.', score: 'negative' },
            { text: 'Teslim tarihi yaklaşınca panik yaparım.', score: 'negative' },
            { text: 'Hep "daha sonra yaparım" derim.', score: 'negative' },
            { text: 'Zamanım bol gibi davranır, sonra stres yaşarım.', score: 'negative' },
            { text: 'Gereksiz işlerle vakit harcayıp, asıl işi ertelerim.', score: 'negative' },
            { text: 'Ders çalışmak yerine sosyal medya kullanırım.', score: 'negative' },
            { text: 'İşe başlamak bana çok zor gelir.', score: 'negative' },
            { text: 'Motivasyonumu kaybederim ve işi bırakırım.', score: 'negative' },
            { text: 'Planladığım şeyleri zamanında yapmam.', score: 'negative' },
            { text: 'Erteleme sonucunda kalitesiz iş çıkarırım.', score: 'negative' },
            { text: 'Son dakikada aceleyle yapıyorum.', score: 'negative' },
            { text: 'Erteleme alışkanlığım akademik başarımı olumsuz etkiliyor.', score: 'negative' }
        ],
        options: ['Hiçbir Zaman', 'Nadiren', 'Bazen', 'Sıklıkla', 'Her Zaman']
    },

    // 17. PROBLEM ÇÖZME ENVANTERİ (24 Madde)
    problem_solving: {
        id: 'problem_solving',
        title: 'Problem Çözme Envanteri',
        desc: 'Sorunlarla başa çıkma becerinizi değerlendirin.\nUYGULAMA YÖNERGESİ: Bir sorunla karşılaştığınızda çözüm üretme sürecinizi en iyi anlatan ifadeyi seçiniz.',
        questions: [
            { text: 'Problemleri çözmede kendime güvenirim.', type: 'confidence' },
            { text: 'Genellikle doğru kararlar veririm.', type: 'confidence' },
            { text: 'Sorunları çözmem zaman alır ama başarırım.', type: 'confidence' },
            { text: 'Problemle karşılaştığımda paniklerim.', type: 'approach_avoidance' },
            { text: 'Sorunlardan kaçmaya çalışırım.', type: 'approach_avoidance' },
            { text: 'Problemlerle yüzleşmekten korkarım.', type: 'approach_avoidance' },
            { text: 'Sorunu farklı açılardan incelerim.', type: 'thinking_style' },
            { text: 'Alternatif çözümler üretirim.', type: 'thinking_style' },
            { text: 'Yaratıcı fikirler bulabilirim.', type: 'thinking_style' },
            { text: 'Mantıklı ve akılcı düşünürüm.', type: 'thinking_style' },
            { text: 'Sorunu tanımlayıp analiz ederim.', type: 'systematic' },
            { text: 'Adım adım ilerlerim.', type: 'systematic' },
            { text: 'Çözümü planlarım.', type: 'systematic' },
            { text: 'Sonuçları değerlendiririm.', type: 'systematic' },
            { text: 'Yardım almaktan çekinmem.', type: 'help_seeking' },
            { text: 'Başkalarının fikirlerini dinlerim.', type: 'help_seeking' },
            { text: 'İşbirliği yaparak çözüm ararım.', type: 'help_seeking' },
            { text: 'Karşılaştığım sorunlar beni yıpratır.', type: 'emotional_control' },
            { text: 'Sorun karşısında umutsuzluğa kapılırım.', type: 'emotional_control' },
            { text: 'Sakin kalarak düşünürüm.', type: 'emotional_control' },
            { text: 'Deneme-yanılma yöntemiyle ilerlerim.', type: 'trial_error' },
            { text: 'Her şeyi denemeye açığım.', type: 'trial_error' },
            { text: 'Hatalarımdan ders çıkarırım.', type: 'learning' },
            { text: 'Geçmiş deneyimlerimi kullanırım.', type: 'learning' }
        ],
        options: ['Hiçbir Zaman', 'Nadiren', 'Bazen', 'Sıklıkla', 'Her Zaman']
    },

    // 18. İLETİŞİM BECERİLERİ ENVANTERİ (25 Madde)
    communication_skills: {
        id: 'communication_skills',
        title: 'İletişim Becerileri Envanteri',
        desc: 'Sözel ve sözel olmayan iletişim becerilerinizi ölçün.\nUYGULAMA YÖNERGESİ: Konuşma, dinleme ve beden dili kullanımınızı düşünerek aşağıdaki maddeleri değerlendirin.',
        questions: [
            { text: 'Fikirlerimi açık ve anlaşılır ifade ederim.', type: 'verbal' },
            { text: 'Doğru kelimeleri seçerim.', type: 'verbal' },
            { text: 'Akıcı konuşurum.', type: 'verbal' },
            { text: 'Ses tonumu duruma göre ayarlarım.', type: 'verbal' },
            { text: 'Karşımdakini dikkatlice dinlerim.', type: 'listening' },
            { text: 'Dinlerken göz teması kurarım.', type: 'listening' },
            { text: 'Konuşmacıyı yarıda kesmem.', type: 'listening' },
            { text: 'Anlamadığımda soru sorarım.', type: 'listening' },
            { text: 'Empatik dinleme yaparım.', type: 'listening' },
            { text: 'Beden dilime dikkat ederim.', type: 'nonverbal' },
            { text: 'Yüz ifadelerim tutarlıdır.', type: 'nonverbal' },
            { text: 'Jest ve mimiklerimi etkili kullanırım.', type: 'nonverbal' },
            { text: 'Geri bildirim veririm.', type: 'feedback' },
            { text: 'Yapıcı eleştiri yaparım.', type: 'feedback' },
            { text: 'Eleştirileri olgun bir şekilde karşılarım.', type: 'feedback' },
            { text: 'Saygılı iletişim kurarım.', type: 'respect' },
            { text: 'Kibar ve nazik davranırım.', type: 'respect' },
            { text: 'Başkalarının fikirlerine değer veririm.', type: 'respect' },
            { text: 'Tartışmalarda fikir alışverişi yaparım.', type: 'discussion' },
            { text: 'Argümanlarımı kanıtlarla desteklerim.', type: 'discussion' },
            { text: 'Duygularımı uygun şekilde ifade ederim.', type: 'emotional_expression' },
            { text: '"Ben dili" kullanırım.', type: 'assertive' },
            { text: 'Suçlayıcı olmadan iletişim kurarım.', type: 'assertive' },
            { text: 'Yazılı iletişimde de başarılıyım.', type: 'written' },
            { text: 'Mesajlarımı net yazarım.', type: 'written' }
        ],
        options: ['Hiçbir Zaman', 'Nadiren', 'Bazen', 'Genellikle', 'Her Zaman']
    },

    // 19. MESLEKİ DEĞERLER ENVANTERİ (30 Madde)
    career_values: {
        id: 'career_values',
        title: 'Mesleki Değerler Envanteri',
        desc: 'Kariyer seçiminde sizin için neyin önemli olduğunu keşfedin.\nUYGULAMA YÖNERGESİ: Bir meslek sahibi olduğunuzda o mesleğin size neler sağlamasını istersiniz? Önem derecesine göre işaretleyin.',
        questions: [
            { text: 'Yüksek maaş almak benim için önemlidir.', type: 'economic' },
            { text: 'Ekonomik güvence istiyorum.', type: 'economic' },
            { text: 'Maddi rahatlık önemlidir.', type: 'economic' },
            { text: 'İnsanlara yardım etmek isterim.', type: 'altruistic' },
            { text: 'Topluma faydalı olmak önemlidir.', type: 'altruistic' },
            { text: 'Sosyal sorumluluk taşımak isterim.', type: 'altruistic' },
            { text: 'Yaratıcılığımı kullanmak isterim.', type: 'creativity' },
            { text: 'Özgün fikirler üretmek önemlidir.', type: 'creativity' },
            { text: 'Sanatsal çalışmalar yapmak hoşuma gider.', type: 'creativity' },
            { text: 'Lider olmak isterim.', type: 'prestige' },
            { text: 'Saygın bir pozisyonda çalışmak önemlidir.', type: 'prestige' },
            { text: 'Ünlü olmak isterim.', type: 'prestige' },
            { text: 'Bağımsız çalışmak isterim.', type: 'autonomy' },
            { text: 'Kendi kararlarımı vermek önemlidir.', type: 'autonomy' },
            { text: 'Özgürce hareket etmek önemlidir.', type: 'autonomy' },
            { text: 'Güvenli bir iş istiyorum.', type: 'security' },
            { text: 'İş garantisi önemlidir.', type: 'security' },
            { text: 'Sigorta ve emeklilik önemlidir.', type: 'security' },
            { text: 'Kariyer basamaklarını tırmanmak isterim.', type: 'advancement' },
            { text: 'Terfi etmek önemlidir.', type: 'advancement' },
            { text: 'Yeni şeyler öğrenmek isterim.', type: 'learning' },
            { text: 'Kendimi geliştirmek önemlidir.', type: 'learning' },
            { text: 'Heyecan verici işler yapmak isterim.', type: 'variety' },
            { text: 'Değişiklik ve yenilik önemlidir.', type: 'variety' },
            { text: 'İş-özel yaşam dengesi önemlidir.', type: 'lifestyle' },
            { text: 'Esnek çalışma saatleri isterim.', type: 'lifestyle' },
            { text: 'Takım çalışması yapmak isterim.', type: 'affiliation' },
            { text: 'İyi arkadaşlıklar kurmak önemlidir.', type: 'affiliation' },
            { text: 'Başarı hissi yaşamak isterim.', type: 'achievement' },
            { text: 'Hedeflere ulaşmak önemlidir.', type: 'achievement' }
        ],
        options: ['Hiç Önemli Değil', 'Az Önemli', 'Orta Önemli', 'Çok Önemli', 'Son Derece Önemli']
    },

    // 20. OKUL TÜKENMİŞLİĞİ ÖLÇEĞİ (16 Madde)
    school_burnout: {
        id: 'school_burnout',
        title: 'Okul Tükenmişliği Ölçeği',
        desc: 'Okula yönelik tükenmişlik düzeyinizi değerlendirin.\nUYGULAMA YÖNERGESİ: Okul hayatınızın sizi duygusal ve fiziksel olarak nasıl etkilediğini en iyi yansıtan seçeneği işaretleyin.',
        questions: [
            { text: 'Okulda kendimi yorgun ve bitkin hissediyorum.', type: 'exhaustion' },
            { text: 'Okul işleri beni çok yıpratıyor.', type: 'exhaustion' },
            { text: 'Okula gitmek için sabah kalkmak çok zor.', type: 'exhaustion' },
            { text: 'Ders çalışmaya enerjim yok.', type: 'exhaustion' },
            { text: 'Okula ilgim kalmadı.', type: 'cynicism' },
            { text: 'Okul işleri anlamsız geliyor.', type: 'cynicism' },
            { text: 'Neden okula gittiğimi sorguluyorum.', type: 'cynicism' },
            { text: 'Okul bana hiçbir şey kazandırmıyor.', type: 'cynicism' },
            { text: 'Yeterince iyi yapamadığımı düşünüyorum.', type: 'inadequacy' },
            { text: 'Başarısızım gibi hissediyorum.', type: 'inadequacy' },
            { text: 'Derslerde yeterli değilim.', type: 'inadequacy' },
            { text: 'Kendimi yetersiz hissediyorum.', type: 'inadequacy' },
            { text: 'Ders çalışmaktan hoşlanmıyorum.', type: 'cynicism' },
            { text: 'Okul beni mutsuz ediyor.', type: 'exhaustion' },
            { text: 'Okuldan soğudum.', type: 'cynicism' },
            { text: 'Okul benim için bir yük.', type: 'exhaustion' }
        ],
        options: ['Hiçbir Zaman', 'Nadiren', 'Bazen', 'Sık Sık', 'Her Zaman']
    },

    // 21. ZAMAN YÖNETİMİ ENVANTERİ (27 Madde)
    time_management: {
        id: 'time_management',
        title: 'Zaman Yönetimi Envanteri',
        desc: 'Zamanı ne kadar verimli kullandığınızı ölçün.\nUYGULAMA YÖNERGESİ: Gününüzü planlarken ve işlerinizi yaparken zamanı nasıl yönettiğinizi değerlendirin.',
        questions: [
            { text: 'Günlük to-do listem var.', type: 'planning' },
            { text: 'Haftalık planlarımı yapıyorum.', type: 'planning' },
            { text: 'Hedeflerimi yazıyorum.', type: 'planning' },
            { text: 'Uzun vadeli planlarım var.', type: 'planning' },
            { text: 'Öncelikleri belirlerim.', type: 'prioritization' },
            { text: 'Önemli işleri ilk sıraya koyarım.', type: 'prioritization' },
            { text: 'Acil-önemli matrisini kullanırım.', type: 'prioritization' },
            { text: 'İşleri önem sırasına göre yaparım.', type: 'prioritization' },
            { text: 'Zamanımı verimli kullanırım.', type: 'efficiency' },
            { text: 'Gereksiz işlerle vakit harcamam.', type: 'efficiency' },
            { text: 'Odaklanarak çalışırım.', type: 'efficiency' },
            { text: 'Dikkat dağıtıcılardan kaçınırım.', type: 'efficiency' },
            { text: 'Hedtime ulaşırım.', type: 'achievement' },
            { text: 'Planladığım şeyleri tamamlarım.', type: 'achievement' },
            { text: 'Verimli bir çalışma sistemim var.', type: 'achievement' },
            { text: 'Zamanı kontrol ediyorum.', type: 'control' },
            { text: 'İşlere zaman ayırırım.', type: 'control' },
            { text: 'Programıma sadık kalıyorum.', type: 'control' },
            { text: 'Hayır demeyi bilirim.', type: 'assertiveness' },
            { text: 'Gereksiz toplantılara girmem.', type: 'assertiveness' },
            { text: 'Sınırlarımı koruyorum.', type: 'assertiveness' },
            { text: 'Mola vermeyi bilirim.', type: 'self_care' },
            { text: 'Dinlenme zamanı ayırırım.', type: 'self_care' },
            { text: 'İş-yaşam dengesi kurarım.', type: 'self_care' },
            { text: 'Takvim kullanırım.', type: 'tools' },
            { text: 'Hatırlatıcılar ayarlarım.', type: 'tools' },
            { text: 'Zaman yönetimi araçları kullanırım.', type: 'tools' }
        ],
        options: ['Hiçbir Zaman', 'Nadiren', 'Bazen', 'Genellikle', 'Her Zaman']
    },

    // 19. Sosyometri (Okul İçi İlişkiler)
    sociometry: {
        id: 'sociometry',
        title: 'Sosyometri (Sınıf İçi İlişkiler)',
        desc: 'Sınıfınızdaki arkadaşlık bağlantılarını ve gruplaşmaları bilimsel olarak ölçmeyi amaçlar.\nUYGULAMA YÖNERGESİ: Sınıfınızda bulunan arkadaşlarınız arasından, sorulan duruma en uygun olanları sırasıyla 1., 2. ve 3. tercih olarak seçiniz. Cevaplarınız sadece rehberlik servisi tarafından görülecek ve gizli tutulacaktır.',
        inputType: 'class_list',
        questions: [
            { id: 1, text: 'Sınıfta en çok yan yana oturmak veya birlikte ders çalışmak istediğiniz 3 arkadaşınızı öncelik sırasına göre (1., 2., 3.) seçiniz. (En fazla 3 isim)', category: 'academic' },
            { id: 2, text: 'Okul dışında veya tenefüslerde en çok vakit geçirmek/oyun oynamak istediğiniz 3 arkadaşınızı öncelik sırasına göre seçiniz. (En fazla 3 isim)', category: 'social' },
            { id: 3, text: 'Çok önemli bir sırrınızı veya derdinizi paylaşmak isteyeceğiniz, en çok güvendiğiniz 3 arkadaşınızı öncelik sırasına göre seçiniz. (En fazla 3 isim)', category: 'trust' },
            { id: 4, text: 'Eğer bir grup lideri veya sınıf başkanı seçilecek olsaydı, kimi seçerdiniz? Lütfen öncelik sırasına göre seçiniz. (En fazla 3 isim)', category: 'leadership' }
        ]
    },

    // 20. Risk Haritası (Öğrenci)
    risk_map: {
        id: 'risk_map',
        title: 'Öğrenci Risk Haritası',
        desc: 'Öğrencinin akademik ve sosyal risk faktörlerini belirler.',
        questions: [
            { text: 'Parçalanmış aile (anne-baba ayrı) çocuğuyum.', category: 'family' },
            { text: 'Ailemde süreğen bir hastalık veya engellilik var.', category: 'health' },
            { text: 'Ekonomik durumumuz temel ihtiyaçlarımızı karşılamakta yetersiz.', category: 'economic' },
            { text: 'Okula ulaşım konusunda ciddi sıkıntılar yaşıyorum.', category: 'safety' },
            { text: 'Daha önce hiç disiplin cezası aldım mı?', category: 'behavior' },
            { text: 'Sınıf tekrarı yaptım mı?', category: 'academic' },
            { text: 'Ailemde alkol veya madde bağımlılığı olan biri var mı?', category: 'environment' },
            { text: 'Kendimi okulda güvende hissetmiyorum.', category: 'safety' }
        ],
        options: ['Hayır', 'Evet']
    },

    // 21. RİBA (Rehberlik İhtiyaçları Belirleme Anketi) - Lise
    riba_high: {
        id: 'riba_high',
        title: 'RİBA (Lise Öğrenci Formu)',
        desc: 'Rehberlik ve psikolojik danışma ihtiyaçlarınızı belirlemek için kullanılır.\nUYGULAMA YÖNERGESİ: Aşağıdaki maddeleri okuyun ve o konudaki rehberlik ihtiyacınızın derecesini işaretleyin.',
        questions: [
            // Eğitsel (Academic)
            { text: 'Verimli ders çalışma tekniklerini öğrenme.', category: 'academic' },
            { text: 'Zamanı etkili yönetme ve plan yapma.', category: 'academic' },
            { text: 'Sınav kaygısı ile baş etme yollarını öğrenme.', category: 'academic' },
            { text: 'Ders başarısını artırma yollarını öğrenme.', category: 'academic' },
            { text: 'Motivasyonu artırma ve hedef belirleme.', category: 'academic' },
            { text: 'Öğrenme stillerimi (nasıl daha iyi öğrendiğimi) keşfetme.', category: 'academic' },
            { text: 'Üst öğrenim kurumları (Üniversiteler) hakkında bilgi edinme.', category: 'academic' },
            { text: 'YKS (TYT-AYT) sınav sistemi hakkında bilgi alma.', category: 'academic' },

            // Mesleki (Career)
            { text: 'Yetenek, ilgi ve değerlerimi tanıma.', category: 'career' },
            { text: 'Meslekleri ve çalışma alanlarını tanıma.', category: 'career' },
            { text: 'Kariyer planı yapma ve ilerleme yollarını öğrenme.', category: 'career' },
            { text: 'Staj ve iş imkanları hakkında bilgi edinme.', category: 'career' },

            // Kişisel-Sosyal (Personal-Social)
            { text: 'Özgüven geliştirme yollarını öğrenme.', category: 'personal' },
            { text: 'İletişim becerilerimi (kendini ifade etme, dinleme) geliştirme.', category: 'social' },
            { text: 'Öfke ve stresle baş etme yöntemlerini öğrenme.', category: 'personal' },
            { text: 'Problem çözme becerilerimi geliştirme.', category: 'personal' },
            { text: 'Arkadaşlık ilişkilerini yönetme ve geliştirme.', category: 'social' },
            { text: 'Aile içi iletişim sorunlarını çözme.', category: 'social' },
            { text: 'Hayır diyebilme ve sınır koyma (Atılganlık).', category: 'social' },
            { text: 'Teknoloji (İnternet, Oyun, Sosyal Medya) bağımlılığından korunma.', category: 'personal' },
            { text: 'Tütün, alkol ve madde bağımlılığından korunma.', category: 'personal' },
            { text: 'Zorbalık ve şiddetten korunma yollarını öğrenme.', category: 'social' },
            { text: 'Kaygı, üzüntü veya mutsuzlukla baş etme.', category: 'personal' }
        ],
        options: [
            { label: 'İhtiyacım Yok', value: 1 },
            { label: 'Kısmen İhtiyacım Var', value: 2 },
            { label: 'Çok İhtiyacım Var', value: 3 }
        ]
    },

    // 22. Burdon Dikkat Testi (Simülasyon)
    burdon: {
        id: 'burdon',
        title: 'Burdon Dikkat Testi',
        desc: 'Dikkat gücünü ve sürekliliğini ölçen profesyonel bir testtir.',
        questions: [
            { id: 1, text: 'Sayfa üzerindeki tüm [a] harflerini bulun.', category: 'attention' },
            { id: 2, text: 'Sayfa üzerindeki tüm [b] harflerini bulun.', category: 'attention' },
            { id: 3, text: 'Sayfa üzerindeki tüm [g] harflerini bulun.', category: 'attention' }
        ],
        type: 'performance'
    },

    // 23. Otobiyografi (Güdümlü)
    autobiography: {
        id: 'autobiography',
        title: 'Otobiyografi (Güdümlü)',
        desc: 'Öğrencinin kendisini kendi ağzından anlatmasını sağlar.',
        inputType: 'text',
        questions: [
            { text: 'Doğduğum günden bugüne ailemle olan ilişkilerim...', category: 'family' },
            { text: 'Okul hayatım boyunca beni en çok etkileyen olaylar...', category: 'school' },
            { text: 'Gelecekte kendimi görmek istediğim yer ve hayallerim...', category: 'future' }
        ]
    },

    // 24. RİBA (Ortaokul Öğrenci Formu)
    riba_middle: {
        id: 'riba_middle',
        title: 'RİBA (Ortaokul Öğrenci Formu)',
        desc: 'Ortaokul kademesindeki rehberlik ihtiyaçlarını belirler.',
        questions: [
            // Eğitsel
            { text: 'Ders çalışma alışkanlıklarımı geliştirme.', category: 'academic' },
            { text: 'Lise geçiş sınavları (LGS) hakkında bilgi edinme.', category: 'academic' },
            { text: 'Sınav heyecanını kontrol etme.', category: 'academic' },
            { text: 'Dersi derste anlama ve not tutma teknikleri.', category: 'academic' },

            // Mesleki
            { text: 'Liseleri tanıma (Fen, Anadolu, Meslek vb.).', category: 'career' },
            { text: 'İlgi duyduğum meslekleri araştırma.', category: 'career' },
            { text: 'Yeteneklerimi hangi alanda kullanabileceğimi keşfetme.', category: 'career' },

            // Kişisel-Sosyal
            { text: 'Ergenlik dönemi değişimlerini anlama.', category: 'personal' },
            { text: 'Özgüvenimi artırma.', category: 'personal' },
            { text: 'Sosyal medya ve interneti güvenli kullanma.', category: 'social' },
            { text: 'Zorbalık yapanlarla nasıl baş edeceğimi öğrenme.', category: 'social' },
            { text: 'Yeni arkadaşlar edinme ve sürdürme.', category: 'social' },
            { text: 'Öfke kontrolünü sağlama.', category: 'personal' },
            { text: 'Sigara ve kötü alışkanlıklardan uzak durma.', category: 'personal' }
        ],
        options: [
            { label: 'İhtiyacım Yok', value: 1 },
            { label: 'Kısmen İhtiyacım Var', value: 2 },
            { label: 'Çok İhtiyacım Var', value: 3 }
        ]
    },

    // 25. RİBA (İlkokul Öğrenci Formu)
    riba_primary: {
        id: 'riba_primary',
        title: 'RİBA (İlkokul Öğrenci Formu)',
        desc: 'İlkokul kademesindeki rehberlik ihtiyaçlarını belirler.',
        questions: [
            { text: 'Okula severek gelme ve okulu sevme.', category: 'social' },
            { text: 'Arkadaşlarımla kavga etmeden oynama.', category: 'social' },
            { text: 'Derslerimde nasıl başarılı olacağımı öğrenme.', category: 'academic' },
            { text: 'Öfkelendiğimde kendimi nasıl sakinleştireceğimi öğrenme.', category: 'personal' },
            { text: 'Korku ve kaygılarımla baş etme.', category: 'personal' },
            { text: 'Verimli ders çalışma yollarını öğrenme.', category: 'academic' },
            { text: 'Okul kurallarına uyma.', category: 'social' },
            { text: 'Tanımadığım kişilere karşı kendimi koruma.', category: 'personal' }
        ],
        options: [
            { label: 'İhtiyacım Yok', value: 1 },
            { label: 'Kısmen İhtiyacım Var', value: 2 },
            { label: 'Çok İhtiyacım Var', value: 3 }
        ]
    },

    // 26. Snellen Göz Tarama Formu
    snellen: {
        id: 'snellen',
        title: 'Snellen Göz Tarama Formu',
        desc: 'Öğrencilerin görme keskinliğini basit düzeyde taramak için kullanılır.',
        questions: [
            { text: 'Sağ göz görme seviyesi (Metre/Sıra)', category: 'right_eye' },
            { text: 'Sol göz görme seviyesi (Metre/Sıra)', category: 'left_eye' },
            { text: 'Gözlük veya lens kullanımı var mı?', category: 'correction' }
        ],
        type: 'physical_scan'
    },

    // 27. Öğrenci Tanıma Fişi
    student_info_form: {
        id: 'student_info_form',
        title: 'Öğrenci Tanıma Fişi',
        desc: 'Öğrencinin ailevi, sosyal ve akademik geçmişini özetleyen temel formdur.',
        inputType: 'text',
        questions: [
            { text: 'Anne-Baba hayatta mı? Birlikte mi yaşıyorlar?', category: 'family' },
            { text: 'Kardeş sayısı ve eğitim durumları...', category: 'family' },
            { text: 'Kronik bir sağlık sorunu veya engel durumu var mı?', category: 'health' },
            { text: 'Geçmişte yaşanan önemli okul değişiklikleri veya travmatik olaylar...', category: 'history' }
        ]
    },

    // 28. RİBA (Öğretmen Formu)
    riba_teacher: {
        id: 'riba_teacher',
        title: 'RİBA (Öğretmen Formu)',
        desc: 'Öğretmenlerin rehberlik ihtiyaçları konusundaki görüşlerini belirler.',
        questions: [
            { text: 'Öğrencilerin sınıf içi uyum ve davranış sorunları.', category: 'student' },
            { text: 'Akademik başarıyı artırma yöntemleri.', category: 'academic' },
            { text: 'Sınav sistemleri ve tercih danışmanlığı.', category: 'career' },
            { text: 'Özel eğitim gereksinimi (BEP) olan öğrenciler.', category: 'special' },
            { text: 'İhmal, istismar ve zorbalık durumları.', category: 'safety' },
            { text: 'Öğretmenlere yönelik stres ve tükenmişlik yönetimi.', category: 'professional' },
            { text: 'Ailelerle etkili iletişim ve veli toplantıları.', category: 'professional' },
            { text: 'Sınıf yönetimi ve motivasyon stratejileri.', category: 'professional' }
        ],
        options: [
            { label: 'Gerek Yok', value: 1 },
            { label: 'Kısmen Gerekli', value: 2 },
            { label: 'Çok Gerekli', value: 3 }
        ]
    }
};

/**
 * MEB formlarıyla mevcut testleri birleştirir.
 *
 * Kural: aynı id iki yerde de varsa MADDE SAYISI FAZLA olan kazanır.
 * (Düz üzerine yazma, mevcut daha zengin bir formu — ör. 34 maddelik
 *  "Kimdir Bu?" — daha kısa bir sürümle değiştirip veri kaybettiriyordu.)
 * Meta alanları (açıklama, kaynak, ölçek) her hâlükârda MEB sürümünden alınır.
 */
const mergeTests = (base, meb) => {
    const out = { ...base };
    for (const [id, form] of Object.entries(meb)) {
        const existing = out[id];
        const mebCount = (form.questions || []).length;
        const oldCount = (existing?.questions || []).length;

        if (!existing) { out[id] = form; continue; }

        out[id] = {
            ...existing,
            ...form,
            // Daha kapsamlı madde listesini koru
            questions: mebCount >= oldCount ? form.questions : existing.questions,
            // Eski formda tanımlı seçenekler varsa ve MEB sürümünde ölçek yoksa koru
            options: form.scale ? undefined : existing.options,
        };
    }
    return out;
};

export const TEST_DATA = mergeTests(BASE_TESTS, MEB_FORMS);

export const calculateResult = (testId, answers) => {
    // 19. Sosyometri
    if (testId === 'sociometry') {
        return {
            summary: "Sosyal Tercihler Kaydedildi",
            detail: "Sosyometri analizi grup bütünlüğü içinde anlam kazanır. Bu veriler koçunuz tarafından 'Sosyogram' oluşturmak için kullanılacaktır.",
            rawData: answers // Form verilerini (arkadaş seçimlerini) ham olarak saklayalım
        };
    }

    // 20. Risk Haritası
    if (testId === 'risk_map') {
        let riskScore = 0;
        Object.values(answers).forEach(val => { if (val === 1) riskScore++; });
        let level = "Düşük Risk";
        if (riskScore > 3) level = "Yüksek Risk ⚠️";
        else if (riskScore > 1) level = "Orta Risk";

        return {
            summary: level,
            detail: riskScore > 0 ? `${riskScore} adet risk faktörü tespit edildi. Rehberlik servisiyle görüşülmesi önerilir.` : "Herhangi bir risk faktörü beyan edilmedi.",
            score: riskScore
        };
    }

    // 21. RIBA
    if (testId.includes('riba')) {
        let catScores = { academic: 0, career: 0, personal: 0, social: 0, professional: 0, student: 0, special: 0, safety: 0 };
        let catCounts = { academic: 0, career: 0, personal: 0, social: 0, professional: 0, student: 0, special: 0, safety: 0 };

        Object.keys(answers).forEach(qIndex => {
            const val = answers[qIndex];
            const cat = TEST_DATA[testId].questions[qIndex]?.category;
            if (cat) {
                catScores[cat] += val;
                catCounts[cat]++;
            }
        });

        // Hangi kategoride en çok "Çok İhtiyacım Var" (3) denmiş?
        let needs = [];
        Object.keys(catScores).forEach(cat => {
            if (catCounts[cat] > 0) {
                const avg = catScores[cat] / catCounts[cat];
                if (avg > 2.2) needs.push(cat);
            }
        });

        const catNames = {
            academic: 'Eğitsel Rehberlik',
            career: 'Mesleki Rehberlik',
            personal: 'Kişisel Rehberlik',
            social: 'Sosyal Rehberlik',
            professional: 'Mesleki Gelişim',
            student: 'Öğrenci Davranışları',
            special: 'Özel Eğitim',
            safety: 'Güvenlik ve Koruma'
        };

        let summary = needs.length > 0 ? "Belirgin Rehberlik İhtiyaçları Mevcut" : "Standart Rehberlik İhtiyacı";
        let detail = needs.length > 0
            ? `Özellikle şu alanlarda yüksek rehberlik ihtiyacı tespit edilmiştir: ${needs.map(n => catNames[n]).join(', ')}.`
            : "Genel olarak yüksek düzeyde bir rehberlik ihtiyacı beyan edilmemiştir.";

        return {
            summary,
            detail,
            chartData: Object.keys(catScores).filter(c => catCounts[c] > 0).map(c => ({
                name: catNames[c],
                score: Math.round((catScores[c] / (catCounts[c] * 3)) * 100)
            }))
        };
    }

    // 22. Burdon
    if (testId === 'burdon') {
        return {
            summary: "Dikkat Testi Tamamlandı",
            detail: "Test verileri süre ve doğruluk analizi için rehberlik uzmanına iletilmiştir."
        };
    }

    // 23. Otobiyografi
    if (testId === 'autobiography') {
        return {
            summary: "Yaşam Öyküsü Kaydedildi",
            detail: "Öğrencinin kendi anlatımıyla yaşam öyküsü bütüncül değerlendirme için sisteme işlenmiştir."
        };
    }

    // 25. Snellen
    if (testId === 'snellen') {
        return {
            summary: "Göz Tarama Kaydedildi",
            detail: "Görme tarama sonuçları kaydedilmiştir. Gerektiğinde bir uzmana yönlendirme yapılabilir."
        };
    }

    // 26. Tanıma Fişi
    if (testId === 'student_info_form') {
        return {
            summary: "Tanıma Fişi Güncellendi",
            detail: "Öğrenciye ait temel bilgiler başarıyla sistem arşivine eklenmiştir."
        };
    }

    // ... Eski hesaplamalar korunacak ...

    // 7. Problem Tarama
    if (testId === 'problem_scan') {
        let counts = { health: 0, school: 0, family: 0, social: 0, personal: 0, economic: 0 };
        let total = 0;
        Object.keys(answers).forEach(qIndex => {
            if (answers[qIndex] === 1) {
                const cat = TEST_DATA.problem_scan.questions[qIndex]?.category;
                if (cat) counts[cat]++;
                total++;
            }
        });

        let maxProblem = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        const labels = {
            health: "Sağlık Sorunları", school: "Okul ve Ders Başarısı", family: "Aile İçi İlişkiler",
            social: "Sosyal İlişkiler", personal: "Kişisel/Psikolojik", economic: "Maddi Kaygılar"
        };

        return {
            summary: total === 0 ? "Sorun Kaydı Yok" : `En Çok Sorun Yaşanan Alan: ${labels[maxProblem]}`,
            detail: total === 0 ? "Harika! Belirgin bir problem alanı işaretlemediniz." : `Toplam ${total} sorun maddesi işaretlediniz. Özellikle ${labels[maxProblem]} alanında destek almanız faydalı olabilir.`
        };
    }

    // 8. Beier (Yorumlama AI ile yapılmalı ama şimdilik statik mesaj)
    if (testId === 'beier') {
        return {
            summary: "Cümleler Kaydedildi",
            detail: "Bu test projektif bir testtir. Verdiğiniz cevaplar rehber öğretmen veya psikolojik danışman tarafından incelenerek bütüncül bir yorum yapılır. Yapay zeka modülü şu an sadece kayıt almaktadır."
        };
    }

    // 9. KGBN
    if (testId === 'kgbn') {
        return {
            summary: "Benlik Algısı Analizi Tamamlandı",
            detail: "Kendinizi ve çevrenizin sizi nasıl gördüğünü değerlendirdiniz. Aile ve okul algısı arasındaki farklar üzerinde düşünebilirsiniz."
        };
    }

    // 10. Dikkat ve Odaklanma
    if (testId === 'attention_focus') {
        let score = 0;
        Object.values(answers).forEach(val => score += val);
        // Max 20 soru * 4 = 80
        // Düşük puan iyidir (0 = Hiçbir zaman)
        let summary, detail;
        if (score < 20) {
            summary = "Yüksek Odaklanma Becerisi";
            detail = "Dikkat süreniz ve odaklanma beceriniz gayet iyi durumda. Çalışmalarınızda bunu avantaj olarak kullanıyorsunuz.";
        } else if (score < 40) {
            summary = "Orta Düzey Dikkat";
            detail = "Zaman zaman dikkat dağınıklığı yaşıyorsunuz. Çalışma ortamınızı sadeleştirerek ve Pomodoro tekniği uygulayarak odaklanmanızı artırabilirsiniz.";
        } else {
            summary = "Dikkat Dağınıklığı Riski";
            detail = "Dikkat ve odaklanma konusunda belirgin zorluklar yaşıyor olabilirsiniz. Bir uzman desteği almanız veya dikkat geliştirici egzersizler yapmanız faydalı olabilir.";
        }
        return { summary, detail, score };
    }

    // 11. VARK Öğrenme Stilleri
    if (testId === 'vark') {
        const scores = { V: 0, A: 0, R: 0, K: 0 };
        Object.keys(answers).forEach(qIndex => {
            const answerValue = answers[qIndex]; // 0, 1, 2, 3 (Index of selected option)
            // VARKoptions struct: [ {text:..., type:'V'}, ... ]
            // We need to map the selected index to the type.
            // However, typical test structure here stores 'value' as the selection.
            // Wait, previous tests used 'type' in question or options. 
            // Let's assume standard multiple choice where each option points to a type.
            // For this specific test, I will structure questions such that options have types.
            const question = TEST_DATA.vark.questions[qIndex];
            if (question && question.options[answerValue]) {
                scores[question.options[answerValue].type]++;
            }
        });

        const maxType = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
        const labels = {
            V: 'Görsel (Visual)',
            A: 'İşitsel (Aural)',
            R: 'Okuma/Yazma (Read/Write)',
            K: 'Kinestetik (Kinesthetic)'
        };
        const details = {
            V: 'Görerek öğreniyorsunuz. Grafik, şema, harita ve resimler sizin için önemli. Renkli kalemler kullanmak ve notlarınızı şekillendirmek başarınızı artırır.',
            A: 'İşiterek öğreniyorsunuz. Dersi dinlemek, tartışmak ve sesli tekrar yapmak size göre. Çalışırken konuyu birine anlatır gibi sesli konuşun.',
            R: 'Okuyarak ve yazarak öğreniyorsunuz. Kitaplar, listeler ve not tutmak vazgeçilmeziniz. Ders kitabını okuyup özet çıkarmak en iyi yönteminiz.',
            K: 'Yaparak ve yaşayarak öğreniyorsunuz. Deney yapmak, maket hazırlamak veya hareket halindeyken çalışmak size daha uygun. Teorik bilgileri pratiğe dökün.'
        };

        return {
            summary: `Baskın Öğrenme Stili: ${labels[maxType]}`,
            detail: details[maxType],
            chartData: Object.keys(scores).map(k => ({ name: labels[k], score: scores[k] }))
        };
    }

    // Eski Logic Devam Ediyor
    // 1. Holland Sonuç Hesaplama
    if (testId === 'holland') {
        const types = { R: 0, A: 0, S: 0, E: 0, G: 0, D: 0 };
        Object.keys(answers).forEach((qIndex) => {
            const question = TEST_DATA.holland.questions[qIndex];
            if (question) {
                types[question.type] += answers[qIndex];
            }
        });
        const maxType = Object.keys(types).reduce((a, b) => types[a] > types[b] ? a : b);
        const descriptions = {
            R: 'Gerçekçi (Realistic): Pratik ve mekanik işlere yatkınsınız. Nesnelerle, aletlerle, makinelerle, bitkilerle veya hayvanlarla uğraşmaktan hoşlanırsınız.\nÖnerilen Meslekler: Mühendislik (Makine, İnşaat, Ziraat), Pilotluk, Teknisyenlik, Veterinerlik, Mimarlık, Aşçılık.',
            A: 'Araştırmacı (Investigative): Analitik ve bilimsel düşünce yapınız güçlü. Gözlem yapmayı, araştırmayı, analiz etmeyi ve karmaşık problemleri çözmeyi seversiniz.\nÖnerilen Meslekler: Doktorluk, Eczacılık, Genetik Mühendisliği, Yazılım Mühendisliği, Matematikçi, Biyolog, Kimyager.',
            S: 'Sanatçı (Artistic): Yaratıcı, hayal gücü geniş ve özgün bir yapınız var. Kendinizi sanatla ifade etmeyi, tasarlamayı ve yenilikçi olmayı seversiniz.\nÖnerilen Meslekler: Mimarlık, Yazarlık, Grafik Tasarım, Müzisyenlik, Oyunculuk, Moda Tasarımı, Reklamcılık.',
            E: 'Sosyal (Social): İnsan ilişkileriniz kuvvetli. Başkalarına yardım etmeyi, öğretmeyi, onları geliştirmeyi ve iletişim kurmayı seversiniz.\nÖnerilen Meslekler: Öğretmenlik, Psikologluk, Rehberlik, Halkla İlişkiler, Hemşirelik, Sosyal Hizmet Uzmanlığı.',
            G: 'Girişimci (Enterprising): Liderlik ve ikna yeteneğiniz yüksek. Bir grubu yönetmeyi, organize etmeyi, risk almayı ve hedeflere ulaşmayı seversiniz.\nÖnerilen Meslekler: Avukatlık, Yöneticilik, Pazarlama, İşletmecilik, Siyaset, Satış Temsilciliği, Girişimcilik.',
            D: 'Düzenli (Conventional): Planlı, sistemli ve kurallara bağlı çalışmayı seviyorsunuz. Verilerle uğraşmayı, kayıt tutmayı ve düzeni sağlamayı tercih edersiniz.\nÖnerilen Meslekler: Bankacılık, Memurluk, Muhasebe, Finans Uzmanlığı, İstatistikçi, Arşivcilik.'
        };
        const shortLabels = { R: 'Gerçekçi', A: 'Araştırmacı', S: 'Sanatçı', E: 'Sosyal', G: 'Girişimci', D: 'Düzenli' };

        return {
            summary: `Baskın Tip: ${shortLabels[maxType]}`,
            detail: descriptions[maxType],
            chartData: Object.keys(types).map(k => ({ name: shortLabels[k], score: types[k] }))
        };
    }

    // 2. Çoklu Zeka Hesaplama
    if (testId === 'multiple_intelligence') {
        const types = { Linguistic: 0, Logical: 0, Visual: 0, Kinesthetic: 0, Musical: 0, Interpersonal: 0, Intrapersonal: 0, Naturalist: 0 };
        Object.keys(answers).forEach((qIndex) => {
            const question = TEST_DATA.multiple_intelligence.questions[qIndex];
            if (question) {
                types[question.type] += answers[qIndex];
            }
        });

        // En yüksek 3 zeka tipini bul
        const sortedTypes = Object.entries(types).sort((a, b) => b[1] - a[1]);
        const top3 = sortedTypes.slice(0, 3).map(t => t[0]);

        const typeNames = {
            Linguistic: "Sözel-Dilsel Zeka",
            Logical: "Mantıksal-Matematiksel Zeka",
            Visual: "Görsel-Uzamsal Zeka",
            Kinesthetic: "Bedensel-Kinestetik Zeka",
            Musical: "Müziksel-Ritmik Zeka",
            Interpersonal: "Kişilerarası (Sosyal) Zeka",
            Intrapersonal: "İçsel (Öze Dönük) Zeka",
            Naturalist: "Doğacı Zeka"
        };

        const detailText = `Sizin en baskın zeka alanlarınız: ${typeNames[top3[0]]} ve ${typeNames[top3[1]]}. `;

        return {
            summary: `Baskın Zeka: ${typeNames[top3[0]]}`,
            detail: detailText + "Bu alanlara uygun öğrenme yöntemlerini (örneğin görsellerle çalışma veya grup çalışması) kullanarak başarınızı artırabilirsiniz.",
            chartData: Object.keys(types).map(k => ({ name: typeNames[k], score: types[k] }))
        };
    }

    // 3. Sınav Kaygısı Hesaplama (Spielberger TAI - Tersine çevrilmiş puanlarla)
    if (testId === 'exam_anxiety') {
        let totalScore = 0;
        Object.keys(answers).forEach(qIndex => {
            const val = answers[qIndex];
            const isReverse = TEST_DATA.exam_anxiety.questions[qIndex]?.isReverse;
            totalScore += isReverse ? (5 - val) : val;
        });

        const maxScore = TEST_DATA.exam_anxiety.questions.length * 4;
        const ratio = totalScore / maxScore; // 0 ile 1 arası

        let summary, detail;
        if (ratio < 0.40) {
            summary = "Düşük Düzey Kaygı";
            detail = "Sınav kaygınız oldukça düşük veya kontrol edilebilir seviyede. Kendinize güveniyorsunuz ve sınav esnasında rahatsınız.";
        } else if (ratio < 0.65) {
            summary = "Orta Düzey Kaygı";
            detail = "Belirli bir seviyede kaygınız var. Bu seviye genellikle 'yapıcı kaygı' olarak kabul edilir ve motivasyonu artırır. Eğer sınav anında unkanlık yaşıyorsanız nefes egzersizleri yapabilirsiniz.";
        } else {
            summary = "Yüksek Düzey Kaygı ⚠️";
            detail = "Sınav kaygınız performansınızı ciddi anlamda olumsuz etkileyecek seviyede görünüyor. Fiziksel ve zihinsel belirtiler (kalp çarpıntısı, tamamen unutma) yoğun olabilir. Bir psikolojik danışmandan destek almanız önerilir.";
        }
        return { summary, detail, score: totalScore };
    }

    // 4. Verimli Çalışma Hesaplama
    if (testId === 'study_habits') {
        let totalScore = 0;
        // Soruların puanlaması: Seçenekler 1-4 arası. Ters maddeler olabilir ama şimdilik düz mantık (4=İyi çalışıyor) varsayalım
        // Ancak ankette "hayallere dalarım" gibi olumsuz maddeler var. Bu örnekte basitlik için olumlu maddeler yüksek puan, olumsuzlar düşük puan mantığı kuralım.
        // Şimdilik düz toplama yapıp genel yorum verelim.
        Object.values(answers).forEach(val => totalScore += val);

        // Basit yorum
        const maxPossible = TEST_DATA.study_habits.questions.length * 4;
        // Ankette olumsuz sorular var (örn: müzik dinlerim, hayal dalarım). Kullanıcı 4 (Her zaman) derse kötü puan almalı. 
        // Bu detaylı logic burada çok karmaşıklaşacağı için basit bir feedback veriyoruz.

        let summary = "Analiz Tamamlandı";
        let detail = "Verimli ders çalışma teknikleri üzerine eğilmelisiniz. Planlı çalışma ve ortam düzenlemesi başarınızı artıracaktır.";
        if (totalScore > maxPossible * 0.75) {
            summary = "İyi Alışkanlıklar";
            detail = "Çalışma alışkanlıklarınız gayet iyi. Bu disiplini korumaya devam edin.";
        } else if (totalScore < maxPossible * 0.45) {
            summary = "Geliştirilmeli";
            detail = "Çalışma ortamınızda ve yöntemlerinizde ciddi değişiklikler yapmanız gerekiyor. Pomodoro tekniğini denemenizi öneririm.";
        }

        return { summary, detail, score: totalScore };
    }

    // 5. Akademik Benlik
    if (testId === 'academic_self') {
        let score = 0;
        Object.values(answers).forEach(val => score += val);
        let summary, detail;
        if (score > 30) {
            summary = "Yüksek Akademik Özgüven";
            detail = "Okul ve dersler konusunda kendinize güveniyorsunuz. Bu inanç, zorluklarla başa çıkmanızı kolaylaştırır.";
        } else {
            summary = "Düşük/Orta Özgüven";
            detail = "Akademik konularda kendinize güveniniz biraz düşük olabilir. Küçük hedefler koyarak ve başarı hissini tadarak bu güveni artırabilirsiniz.";
        }
        return { summary, detail };
    }

    // 6. Başarısızlık Nedenleri
    if (testId === 'failure_reasons') {
        let reasons = [];
        Object.keys(answers).forEach(qIndex => {
            if (answers[qIndex] === 1) { // Evet dediyse
                const q = TEST_DATA.failure_reasons.questions[qIndex];
                if (q) reasons.push(q.category);
            }
        });

        // En çok tekrar eden kategori
        if (reasons.length === 0) return { summary: "Sorun Tespit Edilemedi", detail: "Derslerinizde sizi engelleyen belirgin bir dış faktör yok gibi görünüyor." };

        const counts = {};
        reasons.forEach(x => { counts[x] = (counts[x] || 0) + 1; });
        const maxReason = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

        const reasonMap = {
            family: "Ailevi Sorunlar",
            knowledge: "Temel Bilgi Eksikliği",
            method: "Yanlış Çalışma Yöntemi",
            teacher: "Öğretmen/Okul İletişimi",
            health: "Sağlık Sorunları",
            social: "Sosyal Çevre/Arkadaşlar",
            motivation: "Motivasyon Eksikliği",
            environment: "Çalışma Ortamı",
            curriculum: "Ders Zorluğu",
            goal: "Hedefsizlik",
            technology: "Teknoloji Bağımlılığı"
        };

        return {
            summary: `Temel Engel: ${reasonMap[maxReason]}`,
            detail: `Başarınızı en çok etkileyen faktör "${reasonMap[maxReason]}" olarak görünüyor. Bu alandaki sorunları çözmeye odaklanmalısınız.`
        }
    }

    return { summary: 'Test Tamamlandı', detail: 'Sonuçlarınız başarıyla kaydedilmiştir.' };
};
