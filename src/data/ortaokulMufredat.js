/**
 * 📗 ORTAOKUL MÜFREDATI — 5, 6 ve 7. SINIF
 *
 * NEDEN AYRI BİR DOSYA
 * LGS sınavı YALNIZCA 8. sınıf konularından sorulur. Katalogdaki LGS
 * bölümleri (Sözel/Sayısal) bu yüzden 8. sınıf içeriğidir ve öyle
 * kalmalıdır — sınav gerçeği budur.
 *
 * Ama uygulama 5, 6 ve 7. sınıf öğrencisini de LGS'ye yönlendiriyor.
 * Ölçüldü: 5. sınıf öğrencisi kendi müfredatı yerine 8. sınıf konu
 * listesini görüyordu. Bu dosya o boşluğu kapatır: her sınıf KENDİ
 * müfredatını çalışır, 8. sınıfta LGS içeriğine geçer.
 *
 * KAYNAK — hepsi MEB Türkiye Yüzyılı Maarif Modeli resmî öğretim
 * programı PDF'lerinin "İÇERİK ÇERÇEVESİ" bölümlerinden birebir:
 *   Türkçe    tymm.meb.gov.tr/assets/pdf/2024programtur5678Onayli.pdf
 *   Matematik tymm.meb.gov.tr/assets/pdf/2024programmat5678Onayli.pdf
 *   Fen       tymm.meb.gov.tr/assets/pdf/2024programfen345678Onayli.pdf
 *   Sosyal    tymm.meb.gov.tr/assets/pdf/2024programsos4567Onayli.pdf
 *   İngilizce tymm.meb.gov.tr/assets/pdf/ingilizce-dersi-2-8.pdf
 *   Din       tymm.meb.gov.tr/assets/pdf/2024programdin45678Onayli.pdf
 *
 * ⚠️ AĞIRLIK (`a`) SINAV AĞIRLIĞI DEĞİL, MÜFREDAT AĞIRLIĞIDIR.
 * Bu sınıflarda sınav yok; `a`, MEB'in kendi "Öğrenme Çıktıları Sayısı
 * ve Süre" tablolarından türetildi:
 *     a = sınırla( yuvarla( ünite ders saati / ünitedeki konu sayısı ), 1, 12 )
 * Yani `a` ≈ "bu konuya düşen ders saati". MEB konu bazında saat
 * yayımlamadığı için ünite saati konu sayısına bölündü.
 *
 * ⚠️ ZORLUK (`z`) RESMÎ VERİ DEĞİLDİR. MEB hiçbir derste zorluk
 * derecesi yayımlamaz. Buradaki değerler kavramın soyutluk düzeyi ve
 * MEB öğrenme çıktısındaki bilişsel fiile ("belirler" → 1,
 * "çözer/yorumlar" → 2, "genelleme/ispat/muhakeme" → 3) göre
 * konulmuş pedagojik değerlendirmedir.
 *
 * ⚠️ TÜRKÇE'DE KLASİK DİL BİLGİSİ KONULARI YOKTUR. 2024 programı
 * açıkça "dil yapıları ölçme ve değerlendirme süreçlerine dâhil
 * edilmeyecektir" der. İsim/fiil/sıfat gibi başlıklar ayrı öğrenme
 * çıktısı değildir; listeye uydurma konu eklenmemiştir.
 */

const k = (ad, a = 1, z = 2) => ({ ad, a, z });

// ══════════════════════════════════════════════════════════════
//  5. SINIF
// ══════════════════════════════════════════════════════════════

const SINIF_5 = {
    turkce: [
        // 1. TEMA: OYUN DÜNYASI (32 ders saati)
        k('Materyal Seçmek', 6, 1), k('Yüzey Anlam', 6, 1),
        k('Kendini Uyarlama (Öz Yansıtma)', 6, 2),
        k('Sesin Uygun Şekilde Kullanımı', 6, 1), k('Yazım ve Noktalama', 6, 2),
        // 2. TEMA: ATATÜRK'Ü TANIMAK (32)
        k('Strateji', 5, 2), k('Yöntem ve Teknik', 5, 2), k('Hikâye Unsurları', 5, 1),
        k('Geçiş ve Bağlantı İfadeleri', 5, 2), k('Tahmin', 5, 1),
        k('Akıcı Okuma', 5, 1), k('Metin Yapısı', 5, 2),
        // 3. TEMA: DUYGULARIMI TANIYORUM (31)
        k('Çözümleme', 3, 2), k('Düşünceyi Geliştirme Yolları', 3, 2),
        k('Söz Sanatları', 3, 3), k('Açık ve Örtük İfade', 3, 3), k('Derin Anlam', 3, 3),
        k('Hazırlıksız Konuşma', 3, 2), k('Yaratıcı Konuşma', 3, 2),
        k('İçerik Oluşturmak', 3, 2), k('Duygu Yönetimi', 3, 1),
        // 4. TEMA: GELENEKLERİMİZ (31)
        k('Sınıflandırma', 4, 1), k('Özetleme', 4, 2), k('Karşılaştırma', 4, 2),
        k('Anahtar Kelimeler', 4, 1), k('Görsel Okuma', 4, 2),
        k('Hazırlıklı Konuşma', 4, 2), k('Tartışma', 4, 2),
        // 5. TEMA: İLETİŞİM VE SOSYAL İLİŞKİLER (31)
        k('İletişim', 6, 1), k('İletişim Unsurları', 6, 1),
        // 6. TEMA: SAĞLIKLI YAŞIYORUM (31)
        k('Bilgilendirici Metin', 4, 2), k('Değerlendirme', 4, 2), k('Eleştirme', 4, 3),
        k('Metin Yapıları', 4, 2), k('Çoklu Ortam Ögeleri', 4, 1),
        k('Sözlü Sunum', 4, 2), k('Yorumlama', 4, 2),
    ],
    matematik: [
        // MAT.5.3 GEOMETRİK ŞEKİLLER (38 saat)
        k('Temel Geometrik Çizimler ve İnşalar', 10, 2), k('Açı Ölçme', 10, 1),
        k('Çokgenler', 10, 2), k('Çember', 10, 2),
        // MAT.5.1 SAYILAR VE NİCELİKLER — 1 (28)
        k('Çok Basamaklı Sayıları Okuma ve Yazma', 9, 1), k('Çözümleme', 9, 1),
        k('Doğal Sayılarla Dört İşlem İçeren Problem Çözme', 9, 2),
        // MAT.5.4 GEOMETRİK NİCELİKLER (20)
        k('Dikdörtgenin Çevre Uzunluğu ve Alanı', 12, 2),
        // MAT.5.1 SAYILAR VE NİCELİKLER — 2 (33)
        k('Kesirlerin Farklı Gösterimleri', 12, 2), k('Kesirlerin Karşılaştırılması', 12, 2),
        // MAT.5.5 İSTATİSTİKSEL ARAŞTIRMA SÜRECİ (24)
        k('Kategorik Veri Dağılımları', 12, 2),
        // MAT.5.2 İŞLEMLERLE CEBİRSEL DÜŞÜNME (20)
        k('Eşitliğin Korunumu', 4, 2), k('Değişme-Birleşme ve Dağılma Özellikleri', 4, 2),
        k('İşlem Önceliği', 4, 2), k('Örüntüler', 4, 2),
        k('Temel Aritmetik İşlemler ve Algoritma', 4, 2),
        // MAT.5.6 VERİDEN OLASILIĞA (9)
        k('Öznel Olasılık', 9, 1),
    ],
    fen: [
        // 1. ÜNİTE: GÖKYÜZÜNDEKİ KOMŞULARIMIZ VE BİZ (22)
        k('Gökyüzündeki Komşumuz: Güneş', 7, 1), k('Gökyüzündeki Komşumuz: Ay', 7, 2),
        k('Dünya’mız ve Gökyüzündeki Komşularımız', 7, 2),
        // 2. ÜNİTE: KUVVETİ TANIYALIM (24)
        k('Kuvvet ve Kuvvetin Ölçülmesi', 8, 2), k('Kütle ve Ağırlık İlişkisi', 8, 2),
        k('Sürtünme Kuvveti', 8, 2),
        // 3. ÜNİTE: CANLILARIN YAPISINA YOLCULUK (22)
        k('Hücre ve Organelleri', 6, 2),
        k('Bitki ve Hayvan Hücresi Arasındaki Benzerlik ve Farklılıklar', 6, 2),
        k('Hücre-Doku-Organ-Sistem-Organizma İlişkisi', 6, 2),
        k('Destek ve Hareket Sistemi', 6, 2),
        // 4. ÜNİTE: IŞIĞIN DÜNYASI (14)
        k('Işığın Yayılması', 5, 1), k('Işığın Maddeyle Etkileşimi', 5, 2),
        k('Tam Gölgenin Oluşumu', 5, 2),
        // 5. ÜNİTE: MADDENİN DOĞASI (26)
        k('Taneciklerin Konumu', 4, 2), k('Taneciklerin Boşluklu Yapısı', 4, 2),
        k('Taneciklerin Hareketi', 4, 2), k('Isı ve Sıcaklık', 4, 2),
        k('Isı ve Sıcaklık Arasındaki Farklar', 4, 2), k('Maddenin Hâl Değişimi', 4, 2),
        k('Isı Akışı ile İlgili Temel Kavramlar', 4, 3),
        // 6. ÜNİTE: YAŞAMIMIZDAKİ ELEKTRİK (16)
        k('Devre Elemanlarının Sembolleri ve Devre Şeması', 5, 1),
        k('Basit Elektrik Devresi', 5, 2),
        k('Ampul Parlaklığını Etkileyen Değişkenler', 5, 2),
        // 7. ÜNİTE: SÜRDÜRÜLEBİLİR YAŞAM VE GERİ DÖNÜŞÜM (10)
        k('Evsel Atıklar', 3, 1), k('Geri Dönüşüm', 3, 1), k('Atık Yönetimi', 3, 2),
    ],
    sosyal: [
        // 1. BİRLİKTE YAŞAMAK (16)
        k('Gruplar ve Roller', 5, 1),
        k('Kültürel Özelliklere Saygı ve Birlikte Yaşama Kültürü', 5, 1),
        k('Yardımlaşma ve Dayanışma Faaliyetlerinin Toplumsal Birliğe Etkisi', 5, 2),
        // 2. EVİMİZ DÜNYA (22)
        k('Yaşadığı İlin Göreceli Konumu', 6, 2),
        k('Yaşadığı İlde Doğal ve Beşerî Çevredeki Değişim', 6, 2),
        k('Yaşadığı İlde Meydana Gelebilecek Afetlerin Etkileri', 6, 1),
        k('Ülkemize Komşu Devletler', 6, 1),
        // 3. ORTAK MİRASIMIZ (18)
        k('Ortak Miras Ögeleri', 5, 1),
        k('Somut ve Somut Olmayan Kültürel Miras Ögeleri', 5, 2),
        k('Anadolu’nun İlk Yerleşim Yerlerinde Sosyal Hayat', 5, 2),
        k('Mezopotamya ve Anadolu Medeniyetlerinin Ortak Mirasa Katkıları', 5, 2),
        // 4. YAŞAYAN DEMOKRASİMİZ (23)
        k('Demokrasi ve Cumhuriyet Kavramının Temel Nitelikleri', 6, 2),
        k('Etkin Vatandaşın Özellikleri ve Önemi', 6, 1),
        k('Temel Haklar, Sorumluluklar ve Önemi', 6, 2),
        k('İhtiyaç Durumunda veya Sorunların Çözümünde Başvurulabilecek Kurumlar', 6, 1),
        // 5. HAYATIMIZDAKİ EKONOMİ (18)
        k('Kaynakların Verimli Kullanımı', 6, 1), k('Bütçe Oluşturma', 6, 2),
        k('Yaşadığım İldeki Ekonomik Faaliyetler', 6, 1),
        // 6. TEKNOLOJİ VE SOSYAL BİLİMLER (6)
        k('Teknolojik Gelişmelerin Toplum Hayatına Etkileri', 3, 1),
        k('Teknolojik Ürünlerin Bilinçli Kullanımı', 3, 1),
    ],
    ingilizce: [
        // THEME 1: SCHOOL LIFE (10)
        k('People, places, and rules at school', 3, 1), k('School clubs', 3, 1),
        k('Countries', 3, 1), k('National days and celebrations', 3, 1),
        // THEME 2: CLASSROOM LIFE (10)
        k('Classroom rules and language', 2, 1), k('School subjects', 2, 1),
        k('Timetables', 2, 2), k('Classroom objects', 2, 1),
        k('Days of the week', 2, 1), k('Time', 2, 2),
        // THEME 3: PERSONAL LIFE (10)
        k('Basic body parts and physical features', 3, 1), k('Clothes', 3, 1),
        k('Daily routines and activities', 3, 2),
        // THEME 4: FAMILY LIFE (10)
        k('Family members’ routines', 5, 2),
        k('Family members’ hobbies and activities', 5, 2),
        // THEME 5: LIFE IN THE NEIGHBOURHOOD & CITY (10)
        k('Places for recreation and attractions in the neighbourhood and city', 5, 2),
        k('Different types of houses', 5, 1),
        // THEME 6: LIFE IN THE WORLD (10)
        k('Basic food types', 3, 1), k('Ordering in a restaurant', 3, 2),
        k('Food events in the city', 3, 2),
        // THEME 7: LIFE IN NATURE (10)
        k('Types of animals in nature', 3, 1), k('Wild animals in nature', 3, 1),
        k('Their habitats', 3, 2),
        // THEME 8: LIFE IN THE UNIVERSE & FUTURE (10)
        k('Planet Earth', 3, 1), k('Holidays', 3, 1),
        k('School holidays, places, activities, and plans for holidays', 3, 2),
    ],
    din: [
        // 1. ÜNİTE: ALLAH İNANCI (14)
        k('Evrendeki Mükemmel Düzen', 4, 1), k('Allah’ın Varlığı ve Birliği', 4, 2),
        k('Allah’ın Güzel İsimleri', 4, 1), k('Bir Sure Öğreniyorum: İhlas Suresi', 4, 1),
        // 2. ÜNİTE: NAMAZ (18)
        k('Allah’ın Huzurunda Olmak: Namaz', 5, 1), k('Namazın Kılınışı', 5, 2),
        k('Namazın İnsana Kazandırdıkları', 5, 1),
        k('Bir Dua Öğreniyorum: Tahiyyat Duası', 5, 2),
        // 3. ÜNİTE: KUR'AN-I KERİM (14)
        k('Kur’an-ı Kerim’in İç Düzeni', 4, 2),
        k('Kur’an-ı Kerim’in Temel Özellikleri', 4, 1),
        k('Kur’an-ı Kerim’in Ana Konuları', 4, 2),
        k('Bir Sure Öğreniyorum: Kevser Suresi', 4, 1),
        // 4. ÜNİTE: PEYGAMBER KISSALARI (12)
        k('Allah’ın Elçileri: Peygamberler', 4, 1),
        k('Kur’an-ı Kerim’den Öğütler: Peygamber Kıssaları', 4, 1),
        k('Bir Sure Öğreniyorum: Kureyş Suresi', 4, 1),
        // 5. ÜNİTE: MİMARİMİZDE DİNÎ MOTİFLER (10)
        k('Dinin Mimarimize Etkisi', 3, 1), k('Camileri Tanıyalım', 3, 1),
        k('Kültürümüzden Cami Örnekleri', 3, 1),
    ],
};

// ══════════════════════════════════════════════════════════════
//  6. SINIF
// ══════════════════════════════════════════════════════════════

const SINIF_6 = {
    turkce: [
        // 1. TEMA: DİLİMİZİN ZENGİNLİĞİ (32)
        k('Türkçenin Anlam Zenginliği', 3, 2), k('Türkçenin Anlatım Gücü', 3, 2),
        k('Bilim ve Kültür Dili Olarak Türkçe', 3, 1), k('Türkçenin Söz Varlığı', 3, 2),
        k('Materyal Seçimlerini Yönetebilme', 3, 1),
        k('Strateji, Yöntem ve Teknik Seçimlerini Yönetebilme', 3, 2),
        k('Anahtar Kelime', 3, 1), k('Yüzey Anlam', 3, 1),
        k('Sesin Uygun Şekilde Kullanımı', 3, 1), k('Kendini Uyarlama (Öz Yansıtma)', 3, 2),
        // 2. TEMA: BAĞIMSIZLIK YOLU (32)
        k('Çözümleme', 4, 2), k('Metin İçi Karşılaştırma', 4, 2),
        k('Metinler Arası Karşılaştırma', 4, 3), k('Dili Yaratıcı Biçimde Kullanma', 4, 2),
        k('İçerik Oluşturma', 4, 2), k('Özetleme', 4, 2), k('Sınıflandırma', 4, 1),
        k('Duygu Yönetimi', 4, 1), k('Empati', 4, 1),
        // 3. TEMA: FARKLI DÜNYALAR (31)
        k('Farklı Ülkelerin Kültürleri', 2, 1), k('Beden Dili', 2, 1), k('Merak', 2, 1),
        k('Açık Fikirlilik', 2, 1), k('Çıkarım', 2, 3), k('Karşılaştırma', 2, 2),
        k('Düşünceyi Geliştirme Yolları', 2, 2), k('Tartışma', 2, 2),
        k('Dili Yaratıcı Kullanma', 2, 2),
        // 4. TEMA: İLETİŞİM VE SOSYAL İLİŞKİLER (31)
        k('Metin Yapıları', 4, 2), k('Yorumlama', 4, 2), k('Hazırlıklı Konuşma', 4, 2),
        k('Yazım Kurallarını Uygulama', 4, 2), k('Noktalama İşaretlerini Uygulama', 4, 2),
        // 5. TEMA: BİLİM VE TEKNOLOJİ (31)
        k('Bilim', 4, 1), k('Teknoloji', 4, 1), k('Yapay Zekâ', 4, 1),
        k('Söz Sanatları', 4, 3), k('Açık ve Örtük İfade', 4, 3),
        // 6. TEMA: LİDER RUHLAR (31)
        k('Ünlü Türk Bilim İnsanları', 3, 1), k('Devlet Sanatçısı', 3, 1),
        k('Ünlü Türk Sporcular', 3, 1), k('Başarılı Türk Girişimciler', 3, 1),
        k('Finansal Okuryazarlık', 3, 2), k('Değerlendirme', 3, 2), k('Eleştirme', 3, 3),
        k('Probleme Çözüm Üretebilme', 3, 3), k('Azim ve Kararlılık', 3, 1),
        k('Girişkenlik', 3, 1), k('Yaratıcılık', 3, 2),
    ],
    matematik: [
        // MAT.6.1 SAYILAR VE NİCELİKLER — 1 (15)
        k('Bir Doğal Sayının Çarpanları ve Katları', 5, 2), k('Bölünebilme Kriterleri', 5, 2),
        k('Asal Sayılar ve Asal Çarpanlar', 5, 2),
        // MAT.6.5 İSTATİSTİKSEL ARAŞTIRMA SÜRECİ (24)
        k('Kategorik ve Nicel (Kesikli) Veri Dağılımları', 12, 2),
        // MAT.6.1 SAYILAR VE NİCELİKLER — 2 (38)
        k('Ondalık Gösterimleri Çözümleme', 10, 2), k('Kesir-Bölme İlişkisi', 10, 3),
        k('Uzunluk Ölçme', 10, 1), k('Kesirlerle Dört İşlem İçeren Problem Çözme', 10, 3),
        // MAT.6.6 VERİDEN OLASILIĞA (9)
        k('Deneysel Olasılık', 9, 2),
        // MAT.6.3 GEOMETRİK ŞEKİLLER (20)
        k('İki Paralel Doğrunun Bir Kesen ile Oluşturduğu Açılar', 7, 3),
        k('Üçgenin Açıları', 7, 2),
        k('Yamuk, Paralelkenar, Eşkenar Dörtgen, Dikdörtgen ve Karenin Kenar, Açı ve Köşegen Özellikleri', 7, 2),
        // MAT.6.2 İŞLEMLERLE CEBİRSEL DÜŞÜNME VE DEĞİŞİMLER (33)
        k('Bilinmeyen Nicelikler', 11, 3), k('Örüntü', 11, 2),
        k('Cebirsel İfadeler ve Algoritma', 11, 3),
        // MAT.6.4 GEOMETRİK NİCELİKLER (33)
        k('Uzunluk ve Alan Ölçme Birimleri Arasındaki İlişki', 8, 2),
        k('Paralelkenar ve Üçgenin Alanı', 8, 2),
        k('Çemberin ve Çapın Uzunlukları Arasındaki İlişki', 8, 2),
        k('Çemberde Merkez Açı ve Gördüğü Yay Uzunluğu', 8, 3),
    ],
    fen: [
        // 1. ÜNİTE: GÜNEŞ SİSTEMİ VE TUTULMALAR (12)
        k('Güneş Sistemi ve Gezegenler', 6, 1), k('Güneş ve Ay Tutulmaları', 6, 2),
        // 2. ÜNİTE: KUVVETİN ETKİSİNDE HAREKET (14)
        k('Bileşke Kuvvet', 5, 2), k('Dengelenmiş ve Dengelenmemiş Kuvvetler', 5, 2),
        k('Sürat ve Hız İlişkisi', 5, 3),
        // 3. ÜNİTE: CANLILARDA SİSTEMLER (22)
        k('Bitki ve Hayvanlarda Üreme, Büyüme ve Gelişme', 11, 2),
        k('Denetleyici ve Düzenleyici Sistemler', 11, 2),
        // 4. ÜNİTE: IŞIĞIN YANSIMASI VE RENKLER (22)
        k('Işığın Yansıması', 2, 1), k('Düzgün ve Dağınık Yansıma', 2, 2),
        k('Yansıma Kanunları', 2, 2), k('Ayna Çeşitlerinde Görüntü Özellikleri', 2, 3),
        k('Aynaların Kullanım Alanları', 2, 1), k('Işığın Soğurulması', 2, 2),
        k('Beyaz Işığı Oluşturan Renkler', 2, 1), k('Cisimlerin Renkli Görülmesi', 2, 2),
        k('Güneş Işığının Günlük Yaşamda Kullanım Alanları', 2, 1),
        // 5. ÜNİTE: MADDENİN AYIRT EDİCİ ÖZELLİKLERİ (32)
        k('Isı ve Madde Etkileşimi', 11, 2), k('Maddenin Hâl Değişim Noktaları', 11, 2),
        k('Yoğunluk', 11, 3),
        // 6. ÜNİTE: ELEKTRİĞİN İLETİMİ VE DİRENÇ (18)
        k('Elektriğin İletimi', 9, 2),
        k('Elektriksel Direnç ve Bağlı Olduğu Faktörler', 9, 3),
        // 7. ÜNİTE: SÜRDÜRÜLEBİLİR YAŞAM VE ETKİLEŞİM (18)
        k('Biyoçeşitlilik', 4, 1), k('Biyoçeşitliliği Tehdit Eden Faktörler', 4, 1),
        k('İnsan ve Çevre Etkileşimi', 4, 1), k('Isı Amaçlı Yakıt Kullanımı', 4, 1),
        k('Çevre Sorunları', 4, 1),
    ],
    sosyal: [
        // 1. BİRLİKTE YAŞAMAK (16)
        k('Zaman İçinde Değişen Gruplar ve Roller', 5, 2),
        k('Kültürel Bağlarımızın ve Millî Değerlerimizin Toplumsal Birlikteliğe Etkisi', 5, 2),
        k('Toplumsal Sorunlar ve Çözümler Önerileri', 5, 2),
        // 2. EVİMİZ DÜNYA (18)
        k('Ülkemizin, Kıtaların ve Okyanusların Konum Özellikleri', 6, 2),
        k('Doğal ve Beşerî Çevre Özellikleri Arasındaki İlişki', 6, 2),
        k('Ülkemizin Türk Dünyasıyla Kültürel İş birlikleri', 6, 1),
        // 3. ORTAK MİRASIMIZ (22)
        k('Türkistan’da Kurulan İlk Türk Devletlerinin Medeniyetimize Katkıları', 6, 2),
        k('VII-XIII. Yüzyıllar Arasında İslam Medeniyetinin İnsanlığın Ortak Mirasına Katkıları', 6, 2),
        k('İslamiyet’in Kabulüyle Türklerin Sosyal ve Kültürel Hayatlarında Meydana Gelen Değişimler', 6, 2),
        k('XI-XIII. Yüzyıllar Arasında Meydana Gelen Askerî Mücadelelerin Anadolu’nun Türkleşmesi ve İslamlaşmasına Katkıları', 6, 3),
        // 4. YAŞAYAN DEMOKRASİMİZ (18)
        k('Yönetimin Karar Alma Sürecini Etkileyen Unsurlar', 6, 2),
        k('Temel Hak ve Sorumlulukların Toplumsal Düzenin Sürdürülmesindeki Önemi', 6, 2),
        k('Dijitalleşme ve Teknolojik Gelişmelerin Vatandaşlık Hak ve Sorumluluklarına Etkileri', 6, 2),
        // 5. HAYATIMIZDAKİ EKONOMİ (18)
        k('Ülkemizin Kaynakları ve Ekonomik Faaliyetler', 6, 2),
        k('Ekonomik Faaliyetler ve Meslekler', 6, 1),
        k('Tasarlanan Bir Ürünün Yatırım ve Pazarlama Süreci', 6, 2),
        // 6. TEKNOLOJİ VE SOSYAL BİLİMLER (11)
        k('Ulaşım ve İletişim Teknolojilerinin Kültürel Etkileşimdeki Rolü', 6, 2),
        k('Telif ve Patent Süreci', 6, 2),
    ],
    ingilizce: [
        // THEME 1: SCHOOL LIFE (10)
        k('Roles and responsibilities at school', 3, 1), k('School routines', 3, 1),
        k('National days and celebrations', 3, 1), k('Daily and study routines', 3, 2),
        // THEME 2: CLASSROOM LIFE (10)
        k('Learning activities in the classroom', 3, 2), k('Cardinal numbers 100-500', 3, 1),
        k('Ordinal numbers 1-50', 3, 2),
        // THEME 3: PERSONAL LIFE (10)
        k('Body parts, physical appearance and clothes', 5, 1),
        k('Personality and character', 5, 2),
        // THEME 4: FAMILY LIFE (10)
        k('Family members’ jobs, working places, and job routines', 5, 2),
        k('Different types of family homes and houses', 5, 1),
        // THEME 5: LIFE IN THE NEIGHBOURHOOD & CITY (10)
        k('Festivals and events in the neighbourhood and city', 5, 2),
        k('Transportation in the neighbourhood and the city', 5, 1),
        // THEME 6: LIFE IN THE WORLD & CULTURE (10)
        k('Countries, nationalities, and languages in the world', 5, 2),
        k('Food types and events from different parts of the world', 5, 2),
        // THEME 7: LIFE IN NATURE & GLOBAL PROBLEMS (10)
        k('Activities in nature', 5, 1),
        k('Environmental problems in the world and solutions', 5, 2),
        // THEME 8: LIFE IN THE UNIVERSE & FUTURE (10)
        k('Planets and the Earth as a planet', 5, 1), k('Life on Earth in the future', 5, 2),
    ],
    din: [
        // 1. ÜNİTE: PEYGAMBER VE İLAHİ KİTAP İNANCI (16)
        k('İnsanlara Rehber: Peygamber', 4, 1),
        k('Peygamberlerin İlettiği Mesaj: Vahiy', 4, 2), k('İlahi Kitaplar', 4, 1),
        k('Bir Sure Öğreniyorum: Felak Suresi', 4, 1),
        // 2. ÜNİTE: RAMAZAN VE ORUÇ (14)
        k('Oruç ve Kur’an Ayı Ramazan', 4, 1), k('Oruç İbadeti', 4, 2),
        k('Oruç İbadetinin İnsana Kazandırdıkları', 4, 1),
        k('Bir Dua Öğreniyorum: İftar Duası', 4, 1),
        // 3. ÜNİTE: AHLAKİ DAVRANIŞLAR (12)
        k('Doğru Sözlü Olmak', 2, 1), k('Merhametli Olmak', 2, 1),
        k('Adap ve Nezaket Kurallarına Uymak', 2, 1), k('Vatanımızı Sevmek', 2, 1),
        k('Bir Dua Öğreniyorum: Kunut Duaları', 2, 2),
        // 4. ÜNİTE: PEYGAMBERLİĞİNDEN ÖNCE HZ. MUHAMMED (14)
        k('Hz. Muhammed’in (sav) Doğduğu Çevre', 4, 1),
        k('Hz. Muhammed’in (sav) Ailesi ve Çocukluğu', 4, 1),
        k('Hz. Muhammed’in (sav) Gençlik Yılları', 4, 1),
        k('Bir Sure Öğreniyorum: Fil Suresi', 4, 1),
        // 5. ÜNİTE: KÜLTÜRÜMÜZDEKİ DİNÎ MOTİFLER (12)
        k('Geleneğimizde Dinin İzleri', 4, 1), k('Edebiyatımızda Dinin İzleri', 4, 2),
        k('Musikimizde Dinin İzleri', 4, 2),
    ],
};

// ══════════════════════════════════════════════════════════════
//  7. SINIF
// ══════════════════════════════════════════════════════════════

const SINIF_7 = {
    turkce: [
        // 1. TEMA: HAYAT BOYU GELİŞİM (26)
        k('Motivasyon', 3, 1), k('Çalışkanlık', 3, 1), k('Başarı', 3, 1),
        k('Zaman Yönetimi', 3, 1), k('Karar Verme', 3, 2), k('Çözümleme', 3, 2),
        k('Tahmin Etme', 3, 2), k('Söz Varlığı', 3, 2), k('Yansıtma', 3, 2),
        // 2. TEMA: BİR HİLAL UĞRUNA (25)
        k('Millî Mücadele', 2, 1), k('Millî Egemenlik', 2, 1), k('Atatürk', 2, 1),
        k('Kahramanlık', 2, 1), k('Sınıflandırma', 2, 1), k('Metin Yapıları', 2, 2),
        k('Düşünceyi Geliştirme Yolları', 2, 2), k('Söz Sanatları', 2, 3),
        k('Medya İçerikleri', 2, 2), k('Derin Anlam', 2, 3), k('İkna Etme Teknikleri', 2, 3),
        // 3. TEMA: İLETİŞİM VE SOSYAL İLİŞKİLER (25)
        k('İletişim', 2, 1), k('İletişim Ortamları', 2, 1),
        k('Nezaket ve Görgü Kuralları', 2, 1), k('Çıkarım', 2, 3), k('Eleştirme', 2, 3),
        k('Değerlendirme', 2, 2), k('Özetleme', 2, 2), k('Tartışma', 2, 2),
        // 4. TEMA: TÜRK SANATI (26)
        k('Klasik Türk Sanatları', 2, 1), k('Geleneksel El Sanatları', 2, 1),
        k('Mimari', 2, 1), k('Resim', 2, 1), k('Müzik', 2, 1), k('Karşılaştırma', 2, 2),
        k('Görselle İletilen Anlam', 2, 2), k('Açık ve Örtük İfade', 2, 3),
        k('Hazırlıklı Konuşma', 2, 2), k('Yazım ve Noktalama', 2, 2),
        k('Çoklu Ortam Ögeleri', 2, 1),
        // 5. TEMA: OKUMA KÜLTÜRÜ (25)
        k('Okuma', 3, 1), k('Okuma Alışkanlığı', 3, 1), k('Dijital Okuma', 3, 2),
        k('Anahtar Kelime', 3, 1), k('Yorumlama', 3, 2), k('Problem Çözme', 3, 3),
        // 6. TEMA: HAK VE SORUMLULUKLAR (25)
        k('Hak', 2, 1), k('Sorumluluk', 2, 1), k('Adalet', 2, 2), k('Özgürlük', 2, 2),
        k('Eşitlik', 2, 2), k('Barış', 2, 1), k('Sözlü Sunum', 2, 2),
        k('Geçiş ve Bağlantı İfadeleri', 2, 2),
    ],
    matematik: [
        // MAT.7.1 SAYILAR VE NİCELİKLER — 1 (35)
        k('Tam Sayılar', 9, 2), k('Rasyonel Sayılar ve Farklı Temsilleri', 9, 3),
        k('Rasyonel Sayıların Karşılaştırılması', 9, 3),
        k('Rasyonel Sayılarla İşlemler ve Problem Çözme', 9, 3),
        // MAT.7.4 GEOMETRİK NİCELİKLER — 1 (19)
        k('Cisimlerin Farklı Yönlerden Görünümleri', 6, 2),
        k('Dikdörtgenler Prizmasının Hacmi ve Yüzey Alanı', 6, 2),
        k('Hacim Ölçme Birimleri', 6, 2),
        // MAT.7.6 İSTATİSTİKSEL ARAŞTIRMA SÜRECİ (24)
        k('Kategorik ve Nicel (Sürekli) Veri Dağılımları', 12, 3),
        // MAT.7.3 DÖNÜŞÜM (8)
        k('Yansıma Dönüşümü', 4, 2), k('Orta Dikme ve Açıortay İnşası', 4, 2),
        // MAT.7.5 GEOMETRİK ŞEKİLLER (6)
        k('Üçgenlerde Kenarortay ve İnşası', 2, 2), k('Açıortay', 2, 2), k('Yükseklik', 2, 2),
        // MAT.7.1 SAYILAR VE NİCELİKLER — 2 (15)
        k('Oran', 5, 2), k('Orantılı Durumlar', 5, 3),
        k('Doğru Orantılı Durumlara İlişkin Problem Çözme', 5, 3),
        // MAT.7.7 VERİDEN OLASILIĞA (9)
        k('Teorik Olasılık', 9, 3),
        // MAT.7.2 İŞLEMLERLE CEBİRSEL DÜŞÜNME VE DEĞİŞİMLER (38)
        k('Cebirsel İfadelerle İşlemler', 10, 3), k('Denklem ve Eşitsizlikler', 10, 3),
        k('İspat', 10, 3), k('Cebirsel İfadelerle İşlemler ve Algoritma', 10, 3),
        // MAT.7.4 GEOMETRİK NİCELİKLER — 2 (18)
        k('Eşkenar Dörtgen ve Yamuk', 9, 2), k('Daire ve Daire Diliminin Alanı', 9, 2),
    ],
    fen: [
        // 1. ÜNİTE: UZAY ÇAĞI (14)
        k('Türkiye ve Uzay Araştırmaları', 7, 1), k('Uzayda Neler Var?', 7, 1),
        // 2. ÜNİTE: KUVVET VE ENERJİYİ KEŞFEDELİM (20)
        k('Fiziksel Anlamda Yapılan İş', 5, 3), k('Enerji Çeşitleri', 5, 2),
        k('Enerji Dönüşümleri', 5, 2), k('Enerjinin Korunumu Yasası', 5, 2),
        // 3. ÜNİTE: VÜCUDUMUZDAKİ SİSTEMLER (32)
        k('Sindirim Sistemi', 6, 2), k('Dolaşım Sistemi', 6, 2), k('Kan Bağışı', 6, 1),
        k('Solunum Sistemi', 6, 2), k('Boşaltım Sistemi', 6, 2),
        // 4. ÜNİTE: IŞIĞIN KIRILMASI VE MERCEKLER (14)
        k('Işığın Kırılması', 7, 3), k('Mercekler', 7, 3),
        // 5. ÜNİTE: MADDENİN DOĞASINA YOLCULUK (34)
        k('Maddenin Tanecikli Yapısı', 9, 3), k('Saf Maddeler', 9, 2),
        k('Karışımlar', 9, 2), k('Karışımların Ayrılması', 9, 2),
        // 6. ÜNİTE: ELEKTRİKLENME (12)
        k('Elektriklenme', 4, 2), k('Elektriklenme Çeşitleri', 4, 2),
        k('Elektrik Yükleri', 4, 2),
        // 7. ÜNİTE: SÜRDÜRÜLEBİLİR YAŞAM VE ENERJİ (12)
        k('Besin Zinciri ve Enerji Akışı', 4, 2), k('Sürdürülebilir Yaşam', 4, 1),
        k('Kaynakların Tasarruflu Kullanımı', 4, 1),
    ],
    sosyal: [
        // 1. BİRLİKTE YAŞAMAK (16)
        k('Gruplarda ve Sosyal Hayatta İletişimin Önemi', 5, 1),
        k('Özel Gereksinimli Bireyler İçin Fırsat Eşitliği', 5, 2),
        k('Millî Meseleler Karşısında Türk Toplumunun Tutum ve Davranışları', 5, 2),
        // 2. EVİMİZ DÜNYA (10)
        k('Küreselleşmenin İnsan ve Toplum Hayatına Etkisi', 5, 2),
        k('Bölgesel ve Küresel Sorunların Çözümünde Ülkemizin Rolü', 5, 2),
        // 3. ORTAK MİRASIMIZ (25)
        k('Osmanlı Devleti’nin Cihan Devleti Hâline Gelmesini Sağlayan Politikalar', 8, 3),
        k('Osmanlı Devleti’nin Uygulamaya Koyduğu Yenilikler', 8, 2),
        k('Osmanlı Kültür ve Medeniyeti', 8, 2),
        // 4. YAŞAYAN DEMOKRASİMİZ (22)
        k('Türkiye Cumhuriyeti’nin Nitelikleri', 6, 2),
        k('Türkiye Cumhuriyeti’nin Yönetim Yapısı', 6, 3),
        k('Ülkemizde Demokrasinin Gelişimi', 6, 2),
        k('Demokrasinin Uygulanma Sürecinde Karşılaşılan Sorunlar', 6, 2),
        // 5. HAYATIMIZDAKİ EKONOMİ (12)
        k('Millî Kalkınma Hamleleri', 6, 2),
        k('Ekonomik Gelişmişlik ile Üretim, Dağıtım ve Tüketim Arasındaki Döngü', 6, 3),
        // 6. TEKNOLOJİ VE SOSYAL BİLİMLER (18)
        k('Bilimsel ve Teknolojik Gelişmelerin Gelecekteki Hayata Etkisi', 6, 2),
        k('Sosyal Bilimlerin Çalışma Alanları', 6, 1),
        k('Toplumsal Hayatta Karşılaşılabilecek Problemlere Çözüm Üretme', 6, 2),
    ],
    ingilizce: [
        // THEME 1: SCHOOL LIFE & EDUCATION (14)
        k('Extra-curricular activities at school', 5, 1),
        k('Competitions and celebrations at school', 5, 1),
        k('National days and celebrations', 5, 1),
        // THEME 2: CLASSROOM LIFE & LEARNING (14)
        k('Technological tools for learning', 4, 2),
        k('Learning activities in the classroom', 4, 2),
        k('Cardinal numbers (500-1000)', 4, 1), k('Ordinal numbers (50-100)', 4, 2),
        // THEME 3: PERSONAL LIFE & WELL-BEING (14)
        k('Body parts, illnesses, and keeping good health', 7, 2),
        k('The place of technology in people’s lives', 7, 2),
        // THEME 4: FAMILY LIFE & HOME (14)
        k('Family members’ hobbies (sports, books, films, music, cooking)', 7, 2),
        k('Generation gap in the family: problems and solutions', 7, 3),
        // THEME 5: LIFE IN THE NEIGHBOURHOOD & CITY AND SOCIAL LIFE (14)
        k('Public services in the neighbourhood and city', 7, 2),
        k('Life in different kinds of cities', 7, 2),
        // THEME 6: LIFE IN THE WORLD & CULTURE (14)
        k('Capitals, landmarks, famous places, and activities in capitals', 7, 2),
        k('Sports events in different parts of the world', 7, 2),
        // THEME 7: LIFE IN NATURE (14)
        k('Animals and natural resources in nature', 7, 2),
        k('Protecting animals and nature', 7, 2),
        // THEME 8: LIFE IN THE UNIVERSE & FUTURE (14)
        k('Space technology', 7, 2), k('Life in the future with robots', 7, 2),
    ],
    din: [
        // 1. ÜNİTE: MELEK VE AHİRET İNANCI (14)
        k('Varlıklar Âlemi', 4, 2), k('Dünya ve Ahiret Hayatı', 4, 2),
        k('Melek ve Ahiret İnancının İnsan Davranışına Etkileri', 4, 2),
        k('Bir Sure Öğreniyorum: Nâs Suresi', 4, 1),
        // 2. ÜNİTE: HAC, UMRE VE KURBAN (14)
        k('Hac ve Umre İbadeti', 4, 2), k('Kurban İbadeti', 4, 1),
        k('Hac ve Kurban İbadetinin Kültürümüze Yansımaları', 4, 2),
        k('Bir Sure Öğreniyorum: Kâfirun Suresi', 4, 1),
        // 3. ÜNİTE: İSLAM DÜŞÜNCESİNDE YORUMLAR (14)
        k('Din Anlayışındaki Yorum Farklılıkları', 4, 3),
        k('İslam Düşüncesinde Yorum Biçimleri', 4, 3),
        k('Kültürümüzdeki Tasavvufi Yorumlar', 4, 3),
        k('Alevilik Bektaşilik ile İlgili Temel Kavramlar ve Cem Erkânları', 4, 2),
        // 4. ÜNİTE: PEYGAMBER OLARAK HZ. MUHAMMED (16)
        k('Hz. Muhammed’in Daveti: Mekke Dönemi', 4, 2), k('Hicret', 4, 1),
        k('Hz. Muhammed’in Daveti: Medine Dönemi', 4, 2),
        k('Bir Sure Öğreniyorum: Nasr Suresi', 4, 1),
        // 5. ÜNİTE: YAŞAYAN DÜNYA DİNLERİ (10)
        k('Yahudilik', 3, 2), k('Hristiyanlık', 3, 2), k('Hinduizm', 3, 2), k('Budizm', 3, 2),
    ],
};

/** Sınıf düzeyine göre müfredat havuzu. */
export const ORTAOKUL_MUFREDAT = { 5: SINIF_5, 6: SINIF_6, 7: SINIF_7 };

/** Kendi müfredatı tanımlı sınıf düzeyleri. 8. sınıf LGS içeriğini çalışır. */
export const MUFREDAT_SINIFLARI = [5, 6, 7];

/**
 * Bir sınıf düzeyinin bölüm nesnesi — katalogdaki bölümlerle aynı biçimde.
 *
 * `soru` alanı 0'dır: bu sınıflarda bir sınav yoktur, ağırlıklar ders
 * saatinden gelir. Program motoru resmî soru sayısı bulamadığında dersin
 * payını katalog ağırlıklarından türetir (bkz. `dersPaylari`).
 */
export const sinifBolumu = (sinif) => {
    const dersler = ORTAOKUL_MUFREDAT[sinif];
    if (!dersler) return null;
    return {
        id: `SINIF_${sinif}`,
        ad: `${sinif}. Sınıf Müfredatı`,
        soru: 0,
        sinavsiz: true,        // deneme planlaması için: bu bölümün oturumu yok
        dersler,
    };
};

export default { ORTAOKUL_MUFREDAT, MUFREDAT_SINIFLARI, sinifBolumu };
