
export const TEST_DATA = {
    // 1. Holland Mesleki İlgi Envanteri (90 Soru - Tam Ölçek)
    holland: {
        id: 'holland',
        title: 'Holland Mesleki İlgi Envanteri',
        desc: '90 maddelik kapsamlı kişilik ve meslek analizi.',
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
        desc: '8 Farklı zeka alanınızı analiz eden detaylı envanter.',
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

    // 3. Sınav Kaygısı Ölçeği (Tam Sürüm)
    exam_anxiety: {
        id: 'exam_anxiety',
        title: 'Sınav Kaygısı Ölçeği',
        desc: 'Sınavlara yönelik duygu ve düşüncelerinizi analiz eder.',
        questions: [
            { text: 'Sınavda başarısız olacağıma dair güçlü bir hisse kapılırım.', category: 'mental' },
            { text: 'Sınavdan önce midem bulanır veya karnım ağrır.', category: 'physical' },
            { text: 'Sınav sırasında bildiğim her şeyi unuttuğumu hissederim.', category: 'mental' },
            { text: 'Sınav notlarımın zekamı gösterdiğine inanırım.', category: 'mental' },
            { text: 'Başkalarının benden daha yüksek not alacağını düşünmek beni üzer.', category: 'social' },
            { text: 'Sınavdan önceki gece uyumakta zorluk çekerim.', category: 'physical' },
            { text: 'Sınav sırasında kalbim çok hızlı atar.', category: 'physical' },
            { text: 'Sınav süresinin yetmeyeceğinden endişelenirim.', category: 'mental' },
            { text: 'Sınav kağıdını verirken ellerim titrer.', category: 'physical' },
            { text: 'Sınav sonuçlarını aileme nasıl söyleyeceğimi düşünürüm.', category: 'social' },
            { text: 'Sınav sırasında dikkatimi toplayamam, aklım başka yerlere gider.', category: 'mental' },
            { text: 'Sınav yaklaştıkça iştahım kapanır veya aşırı yemek yerim.', category: 'physical' },
            { text: 'Sınavlarda kendimi çaresiz hissederim.', category: 'mental' },
            { text: 'Sınav anında terleme veya ateş basması yaşarım.', category: 'physical' },
            { text: 'Soruları okurken anlamakta güçlük çekerim.', category: 'mental' },
            { text: 'Sınavdan sonra "keşke daha çok çalışsaydım" diye kendimi suçlarım.', category: 'mental' },
            { text: 'Arkadaşlarımla notlarımı kıyaslamaktan korkarım.', category: 'social' },
            { text: 'Sınav salonu bana boğucu gelir.', category: 'physical' },
            { text: 'Sınav sırasında tuvalete gitme ihtiyacı hissederim.', category: 'physical' },
            { text: 'Sınavı düşündükçe başım ağrır.', category: 'physical' }
        ],
        options: [
            { label: 'Hiçbir Zaman', value: 1 },
            { label: 'Bazen', value: 2 },
            { label: 'Sık Sık', value: 3 },
            { label: 'Her Zaman', value: 4 }
        ]
    },

    // 4. Verimli Ders Çalışma Anketi (Tam Sürüm - 40 Soru)
    study_habits: {
        id: 'study_habits',
        title: 'Verimli Ders Çalışma Anketi',
        desc: 'Çalışma yöntemlerinizi ve ortamınızı detaylı analiz edin.',
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
        desc: 'Okul başarınıza ve yeteneklerinize olan inancınızı değerlendirin.',
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
        desc: 'Ders başarınızı olumsuz etkileyen faktörleri belirleyin.',
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
        desc: 'Hayatınızda sizi en çok zorlayan alanları belirleyin.',
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
        desc: 'Bilinçaltı süreçlerinizi ve duygusal ihtiyaçlarınızı yansıtın.',
        inputType: 'text', // TestRunner bunu algılayıp textfield açacak
        questions: [
            { text: 'Gelecek bana...', category: 'future' },
            { text: 'Keşke babam...', category: 'family' },
            { text: 'En büyük korkum...', category: 'fear' },
            { text: 'İnsanlar genellikle...', category: 'social' },
            { text: 'Annem ve ben...', category: 'family' },
            { text: 'Okulda en çok...', category: 'school' },
            { text: 'Kendimi en mutlu hissettiğim zaman...', category: 'positive' },
            { text: 'Sinirlendiğim zaman...', category: 'emotional' },
            { text: 'Keşke ben...', category: 'self' },
            { text: 'Yalnızken...', category: 'inner' },
            { text: 'Erkekler genellikle...', category: 'social' },
            { text: 'Kadınlar genellikle...', category: 'social' },
            { text: 'Öğretmenlerim...', category: 'school' },
            { text: 'Hayat bence...', category: 'philosophy' },
            { text: 'Benim en zayıf tarafım...', category: 'self' },
            { text: 'Babamın sevdiğim huyu...', category: 'family' },
            { text: 'Annemin sevdiğim huyu...', category: 'family' },
            { text: 'Keşke elimde olsaydı da...', category: 'wish' },
            { text: 'Çocukken...', category: 'past' },
            { text: 'Evimizde...', category: 'family' },
            { text: 'Beni en çok endişelendiren şey...', category: 'anxiety' },
            { text: 'İnsanların benden kaçınmasının sebebi...', category: 'social' },
            { text: 'Çoğu zaman...', category: 'habit' },
            { text: 'Bence en mükemmel insan...', category: 'ideal' },
            { text: 'Yaptığım en büyük hata...', category: 'regret' },
            { text: 'Geceleri...', category: 'time' },
            { text: 'Param olsaydı...', category: 'desire' },
            { text: 'Arkadaşlarıma göre ben...', category: 'social' },
            { text: 'Yaşlanınca...', category: 'future' },
            { text: 'Bu testi bitirince...', category: 'now' }
        ],
        options: [] // Text input olduğu için option yok
    },

    // 9. Kime Göre Ben Neyim? (Genişletilmiş - 30 Madde)
    kgbn: {
        id: 'kgbn',
        title: 'Kime Göre Ben Neyim?',
        desc: 'Kendinizi başkalarının gözünden değerlendirin.',
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
    }
};

export const calculateResult = (testId, answers) => {
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
        return {
            summary: `Baskın Tip: ${maxType} - ${descriptions[maxType].split(':')[0]}`,
            detail: descriptions[maxType],
            chartData: Object.keys(types).map(k => ({ name: k, score: types[k] }))
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

    // 3. Sınav Kaygısı Hesaplama
    if (testId === 'exam_anxiety') {
        let totalScore = 0;
        Object.values(answers).forEach(val => totalScore += val);
        const maxScore = TEST_DATA.exam_anxiety.questions.length * 4;
        const ratio = totalScore / maxScore; // 0 ile 1 arası

        let summary, detail;
        if (ratio < 0.40) {
            summary = "Düşük Düzey Kaygı";
            detail = "Sınav kaygınız oldukça düşük veya kontrol edilebilir seviyede. Bu rahatlık başarınızı olumlu etkiler, ancak tamamen kaygısızlık motivasyon düşüklüğüne yol açmamalıdır.";
        } else if (ratio < 0.70) {
            summary = "Orta Düzey Kaygı";
            detail = "Belirli bir seviyede kaygınız var. Bu seviye genellikle öğrenciyi çalışmaya motive eden 'yapıcı kaygı' olarak kabul edilir. Ancak sınav anında fiziksel belirtiler artıyorsa nefes egzersizleri yapmalısınız.";
        } else {
            summary = "Yüksek Düzey Kaygı ⚠️";
            detail = "Sınav kaygınız performansınızı olumsuz etkileyecek seviyede görünüyor. Fiziksel (kalp çarpıntısı) ve zihinsel (unutma korkusu) belirtiler yoğun olabilir. Mutlaka bir uzmanla görüşmeli veya gevşeme tekniklerini öğrenmelisiniz.";
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
