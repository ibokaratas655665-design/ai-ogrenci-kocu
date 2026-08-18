import { nesneOku } from '../services/veriDeposu';
// HELPER: Topic normalization - string veya object destekler
export const getTopicName = (topic) => {
    return typeof topic === 'object' && topic.name ? topic.name : topic;
};

export const getTopicWeight = (topic) => {
    return typeof topic === 'object' && topic.weight ? topic.weight : 2;
};


/**
 * 📚 MÜFREDAT VERİSİ
 *
 * Kaynak ve geçerlilik notu (Ağustos 2026 itibarıyla):
 *  - YKS: MEB TTKB "2026 YKS'ye Esas Kazanım ve Açıklamalar" belgesi esas alındı.
 *    ÖSYM/MEB açıklamalarına göre 2027 YKS'de sınav yapısı ve konu kapsamı
 *    değişmiyor; Türkiye Yüzyılı Maarif Modeli'ne göre hazırlanan ilk YKS 2028'dir.
 *  - LGS: 8. sınıf öğretim programı. Maarif Modeli 2026-2027'de 7. sınıfa
 *    ulaştığı için 8. sınıf hâlâ mevcut programdan sorumludur.
 *  - AGS: ÖSYM'nin 2026 Akademi Giriş Sınavı konu dağılımı
 *    (Eğitim Bilimleri 30, Türkçe 15, Matematik 15, Tarih 6, Coğrafya 6, Mevzuat 8).
 *
 * weight = konuya ayrılacak yaklaşık etüt sayısı (dağıtım motoru bunu kullanır).
 * Ağırlıklar sınavdaki soru sayısı ve konunun hacmine göre verilmiştir.
 */

export let CURRICULUM = {
    // ══════════════════════════════════════════════════════════
    //  TYT — 120 soru / 165 dk
    //  Türkçe 40 · Temel Matematik 40 (Geometri dâhil) · Sosyal 20 · Fen 20
    // ══════════════════════════════════════════════════════════
    TYT: {
        Matematik: [
            { name: "Temel Kavramlar", weight: 2 },
            { name: "Sayı Basamakları", weight: 1 },
            { name: "Bölme ve Bölünebilme", weight: 2 },
            { name: "EBOB - EKOK", weight: 2 },
            { name: "Rasyonel Sayılar", weight: 1 },
            { name: "Basit Eşitsizlikler", weight: 2 },
            { name: "Mutlak Değer", weight: 2 },
            { name: "Üslü Sayılar", weight: 2 },
            { name: "Köklü Sayılar", weight: 2 },
            { name: "Çarpanlara Ayırma", weight: 2 },
            { name: "Oran - Orantı", weight: 2 },
            { name: "Denklem Çözme", weight: 1 },
            { name: "Sayı Problemleri", weight: 3 },
            { name: "Kesir Problemleri", weight: 3 },
            { name: "Yaş Problemleri", weight: 2 },
            { name: "İşçi - Havuz Problemleri", weight: 2 },
            { name: "Hız - Hareket Problemleri", weight: 3 },
            { name: "Yüzde Problemleri", weight: 2 },
            { name: "Kar - Zarar Problemleri", weight: 2 },
            { name: "Karışım Problemleri", weight: 2 },
            { name: "Grafik Problemleri", weight: 2 },
            { name: "Rutin Olmayan Problemler", weight: 3 },
            { name: "Kümeler", weight: 2 },
            { name: "Kartezyen Çarpım", weight: 1 },
            { name: "Mantık", weight: 2 },
            { name: "Fonksiyonlar", weight: 3 },
            { name: "Polinomlar", weight: 2 },
            { name: "2. Dereceden Denklemler", weight: 3 },
            { name: "Permütasyon", weight: 2 },
            { name: "Kombinasyon", weight: 2 },
            { name: "Binom Açılımı", weight: 1 },
            { name: "Olasılık", weight: 2 },
            { name: "Veri - İstatistik", weight: 2 },
            { name: "Sayı Dizileri ve Örüntüler", weight: 2 },
            { name: "Modüler Aritmetik", weight: 1 },
            { name: "Faktöriyel", weight: 1 },
            { name: "Çarpanlara Ayırma Uygulamaları", weight: 2 },
            { name: "Karma Problemler", weight: 3 }
        ],
        Geometri: [
            { name: "Doğruda Açılar", weight: 2 },
            { name: "Üçgende Açılar", weight: 2 },
            { name: "Özel Üçgenler (Dik, İkizkenar, Eşkenar)", weight: 3 },
            { name: "Üçgende Açı - Kenar Bağıntıları", weight: 2 },
            { name: "Üçgende Açıortay", weight: 2 },
            { name: "Üçgende Kenarortay", weight: 2 },
            { name: "Üçgende Yükseklik ve Eşlik", weight: 2 },
            { name: "Üçgende Benzerlik", weight: 3 },
            { name: "Üçgende Alan", weight: 2 },
            { name: "Çokgenler", weight: 2 },
            { name: "Dörtgenler ve Genel Özellikleri", weight: 2 },
            { name: "Paralelkenar", weight: 2 },
            { name: "Eşkenar Dörtgen ve Deltoid", weight: 2 },
            { name: "Dikdörtgen ve Kare", weight: 2 },
            { name: "Yamuk", weight: 2 },
            { name: "Çember ve Daire", weight: 3 },
            { name: "Çemberde Açı", weight: 2 },
            { name: "Çemberde Uzunluk ve Alan", weight: 2 },
            { name: "Analitik Geometri - Noktanın Analitiği", weight: 2 },
            { name: "Analitik Geometri - Doğrunun Analitiği", weight: 3 },
            { name: "Katı Cisimler (Prizma, Piramit, Küre, Koni, Silindir)", weight: 3 }
        ],
        Turkce: [
            { name: "Sözcükte Anlam", weight: 3 },
            { name: "Söz Yorumu ve Deyim - Atasözü", weight: 2 },
            { name: "Cümlede Anlam", weight: 3 },
            { name: "Cümle Yorumu", weight: 2 },
            { name: "Paragrafta Anlatım Teknikleri", weight: 2 },
            { name: "Paragrafta Düşünceyi Geliştirme Yolları", weight: 2 },
            { name: "Paragrafta Yapı", weight: 3 },
            { name: "Paragrafta Konu - Ana Düşünce", weight: 3 },
            { name: "Paragrafta Yardımcı Düşünce", weight: 3 },
            { name: "Ses Bilgisi", weight: 2 },
            { name: "Yazım Kuralları", weight: 3 },
            { name: "Noktalama İşaretleri", weight: 3 },
            { name: "Sözcükte Yapı ve Ekler", weight: 2 },
            { name: "Sözcük Türleri (İsim, Sıfat, Zamir, Zarf)", weight: 3 },
            { name: "Edat - Bağlaç - Ünlem", weight: 2 },
            { name: "Fiiller ve Fiilimsiler", weight: 3 },
            { name: "Fiilde Çatı", weight: 2 },
            { name: "Cümlenin Ögeleri", weight: 3 },
            { name: "Cümle Türleri", weight: 2 },
            { name: "Anlatım Bozuklukları", weight: 3 },
            { name: "Sözel Mantık ve Akıl Yürütme", weight: 3 }
        ],
        Fizik: [
            { name: "Fizik Bilimine Giriş", weight: 1 },
            { name: "Madde ve Özellikleri", weight: 2 },
            { name: "Sıvıların Kaldırma Kuvveti", weight: 2 },
            { name: "Basınç", weight: 2 },
            { name: "Isı, Sıcaklık ve Genleşme", weight: 2 },
            { name: "Hareket ve Kuvvet", weight: 3 },
            { name: "Dinamik", weight: 2 },
            { name: "İş, Güç ve Enerji", weight: 2 },
            { name: "Elektrostatik", weight: 2 },
            { name: "Elektrik Akımı ve Devreler", weight: 2 },
            { name: "Manyetizma", weight: 2 },
            { name: "Dalgalar", weight: 2 },
            { name: "Optik", weight: 2 }
        ],
        Kimya: [
            { name: "Kimya Bilimi", weight: 1 },
            { name: "Atom ve Yapısı", weight: 2 },
            { name: "Periyodik Sistem", weight: 2 },
            { name: "Kimyasal Türler Arası Etkileşimler", weight: 2 },
            { name: "Maddenin Hâlleri", weight: 2 },
            { name: "Karışımlar", weight: 2 },
            { name: "Doğa ve Kimya", weight: 1 },
            { name: "Kimyanın Temel Kanunları", weight: 2 },
            { name: "Mol Kavramı ve Kimyasal Hesaplamalar", weight: 3 },
            { name: "Asitler, Bazlar ve Tuzlar", weight: 2 },
            { name: "Kimyasal Tepkimeler ve Denklemler", weight: 2 },
            { name: "Endüstride ve Canlılarda Enerji", weight: 1 },
            { name: "Kimya Her Yerde", weight: 1 }
        ],
        Biyoloji: [
            { name: "Canlıların Ortak Özellikleri", weight: 2 },
            { name: "Canlıların Yapısındaki Temel Bileşikler", weight: 2 },
            { name: "Hücre ve Organelleri", weight: 3 },
            { name: "Hücre Zarından Madde Geçişi", weight: 2 },
            { name: "Canlıların Sınıflandırılması", weight: 2 },
            { name: "Hücre Bölünmeleri (Mitoz - Mayoz)", weight: 3 },
            { name: "Üreme ve Gelişme", weight: 2 },
            { name: "Kalıtım ve Genetik", weight: 3 },
            { name: "Ekosistem Ekolojisi", weight: 2 },
            { name: "Güncel Çevre Sorunları", weight: 1 },
            { name: "Sinir Sistemi", weight: 2 },
            { name: "Endokrin Sistem", weight: 2 },
            { name: "Duyu Organları", weight: 2 },
            { name: "Destek ve Hareket Sistemi", weight: 2 },
            { name: "Sindirim Sistemi", weight: 2 },
            { name: "Dolaşım ve Bağışıklık Sistemi", weight: 2 },
            { name: "Solunum Sistemi", weight: 2 },
            { name: "Boşaltım Sistemi", weight: 2 },
            { name: "Homeostazi", weight: 1 }
        ],
        Tarih: [
            { name: "Tarih ve Zaman", weight: 1 },
            { name: "İnsanlığın İlk Dönemleri", weight: 2 },
            { name: "İlk ve Orta Çağ Uygarlıkları", weight: 2 },
            { name: "Orta Çağ'da Dünya", weight: 2 },
            { name: "İlk Türk Devletleri", weight: 2 },
            { name: "İslam Medeniyetinin Doğuşu", weight: 2 },
            { name: "Türklerin İslamiyet'i Kabulü", weight: 2 },
            { name: "İlk Türk - İslam Devletleri", weight: 2 },
            { name: "Selçuklu Türkiyesi", weight: 2 },
            { name: "Beylikten Devlete Osmanlı (Kuruluş)", weight: 2 },
            { name: "Dünya Gücü Osmanlı (Yükselme)", weight: 3 },
            { name: "Osmanlı Kültür ve Medeniyeti", weight: 2 },
            { name: "Değişen Dünya Dengeleri Karşısında Osmanlı", weight: 2 },
            { name: "XVIII. ve XIX. Yüzyılda Osmanlı", weight: 2 },
            { name: "Osmanlı'da Modernleşme ve Islahatlar", weight: 2 },
            { name: "XX. Yüzyıl Başlarında Osmanlı ve Dağılma Süreci", weight: 2 },
            { name: "I. Dünya Savaşı", weight: 2 },
            { name: "Millî Mücadele Hazırlık Dönemi", weight: 3 },
            { name: "Kurtuluş Savaşı Muharebeleri", weight: 3 },
            { name: "Atatürk İlkeleri ve İnkılapları", weight: 3 },
            { name: "Atatürk Dönemi Türk Dış Politikası", weight: 2 },
            { name: "II. Dünya Savaşı ve Sonrası Türkiye", weight: 2 },
            { name: "Çağdaş Türkiye ve Dünya", weight: 2 }
        ],
        Coğrafya: [
            { name: "Coğrafyanın Konusu, Bölümleri ve İlkeleri", weight: 1 },
            { name: "Dünyanın Şekli ve Hareketleri", weight: 2 },
            { name: "Harita Bilgisi", weight: 3 },
            { name: "Koordinat Sistemi ve Zaman", weight: 2 },
            { name: "İklim Bilgisi", weight: 3 },
            { name: "Türkiye'nin İklimi", weight: 2 },
            { name: "İç Kuvvetler ve Yer Şekilleri", weight: 2 },
            { name: "Dış Kuvvetler ve Yer Şekilleri", weight: 2 },
            { name: "Türkiye'nin Yer Şekilleri", weight: 3 },
            { name: "Toprak, Bitki Örtüsü ve Su Kaynakları", weight: 2 },
            { name: "Nüfus ve Yerleşme", weight: 3 },
            { name: "Türkiye'de Nüfus ve Yerleşme", weight: 2 },
            { name: "Ekonomik Faaliyetler", weight: 2 },
            { name: "Türkiye'de Tarım ve Hayvancılık", weight: 2 },
            { name: "Türkiye'de Sanayi, Ulaşım ve Ticaret", weight: 2 },
            { name: "Türkiye'de Turizm", weight: 2 },
            { name: "Doğal Afetler", weight: 2 },
            { name: "Çevre ve Toplum", weight: 2 },
            { name: "Bölgesel Coğrafya ve Ülkeler", weight: 2 },
            { name: "Coğrafi Bilgi Sistemleri (CBS)", weight: 1 }
        ],
        Felsefe: [
            { name: "Felsefenin Tanımı ve Alanı", weight: 2 },
            { name: "Felsefenin Konusu ve Soruları", weight: 2 },
            { name: "Felsefe ile Bilim ve Din İlişkisi", weight: 2 },
            { name: "Felsefi Düşüncenin Nitelikleri", weight: 1 },
            { name: "Bilgi Felsefesi (Epistemoloji)", weight: 3 },
            { name: "Varlık Felsefesi (Ontoloji)", weight: 2 },
            { name: "Ahlak Felsefesi (Etik)", weight: 2 },
            { name: "Sanat Felsefesi (Estetik)", weight: 2 },
            { name: "Din Felsefesi", weight: 2 },
            { name: "Siyaset Felsefesi", weight: 2 },
            { name: "Bilim Felsefesi", weight: 2 },
            { name: "İlk Çağ Felsefesi", weight: 3 },
            { name: "Orta Çağ Felsefesi", weight: 2 },
            { name: "Yeni Çağ ve Aydınlanma Felsefesi", weight: 2 },
            { name: "19. ve 20. Yüzyıl Felsefesi", weight: 2 }
        ],
        Din: [
            { name: "Bilgi ve İnanç", weight: 2 },
            { name: "Din ve İslam", weight: 2 },
            { name: "İslam ve İbadet", weight: 2 },
            { name: "Gençlik ve Değerler", weight: 2 },
            { name: "Allah - İnsan İlişkisi", weight: 2 },
            { name: "Hz. Muhammed'in Hayatı ve Örnekliği", weight: 2 },
            { name: "Kur'an-ı Kerim'in Ana Konuları", weight: 2 },
            { name: "Vahiy ve Akıl", weight: 2 },
            { name: "İslam Düşüncesinde Yorumlar ve Mezhepler", weight: 2 },
            { name: "İslam ve Bilim", weight: 1 },
            { name: "Ahlaki Tutum ve Davranışlar", weight: 2 },
            { name: "Din, Kültür ve Medeniyet", weight: 2 },
            { name: "Yaşayan Dinler (Dinler Tarihi)", weight: 2 },
            { name: "Güncel Dini Meseleler", weight: 2 }
        ]
    },

    // ══════════════════════════════════════════════════════════
    //  AYT — 160 soru / 180 dk
    //  grade11: 9-11. sınıf içerikleri · grade12: 12. sınıf içerikleri
    // ══════════════════════════════════════════════════════════
    AYT: {
        grade11: {
            Matematik: [
                { name: "Kümeler ve Kartezyen Çarpım", weight: 2 },
                { name: "Denklem ve Eşitsizlik Sistemleri", weight: 3 },
                { name: "Üçgenlerde Trigonometri", weight: 3 },
                { name: "Yönlü Açılar ve Trigonometrik Fonksiyonlar", weight: 3 },
                { name: "Trigonometrik Denklemler", weight: 3 },
                { name: "Fonksiyonlar ve Grafikleri", weight: 3 },
                { name: "Fonksiyonlarda Uygulamalar", weight: 3 },
                { name: "İkinci Dereceden Fonksiyonlar ve Parabol", weight: 3 },
                { name: "Polinomlar", weight: 3 },
                { name: "Karmaşık Sayılar", weight: 3 },
                { name: "Logaritma", weight: 3 },
                { name: "Diziler", weight: 2 },
                { name: "Permütasyon, Kombinasyon ve Binom", weight: 3 },
                { name: "Olasılık", weight: 3 },
                { name: "İstatistik ve Veri Analizi", weight: 2 }
            ],
            Geometri: [
                { name: "Üçgenlerde Benzerlik ve Eşlik", weight: 3 },
                { name: "Üçgende Alan ve Trigonometrik Bağıntılar", weight: 3 },
                { name: "Dörtgenler ve Özellikleri", weight: 3 },
                { name: "Özel Dörtgenler", weight: 3 },
                { name: "Çember ve Daire", weight: 3 },
                { name: "Çemberde Açı, Uzunluk ve Alan", weight: 3 },
                { name: "Analitik Geometri - Doğru", weight: 3 },
                { name: "Analitik Geometri - Çember", weight: 3 },
                { name: "Dönüşüm Geometrisi", weight: 2 },
                { name: "Vektörler", weight: 2 },
                { name: "Katı Cisimler - Prizmalar", weight: 2 },
                { name: "Katı Cisimler - Piramit, Koni, Küre", weight: 3 }
            ],
            Edebiyat: [
                { name: "Edebiyata Giriş ve Metin Türleri", weight: 2 },
                { name: "Şiir Bilgisi ve Ölçü", weight: 3 },
                { name: "Söz Sanatları (Edebi Sanatlar)", weight: 3 },
                { name: "İslamiyet Öncesi Türk Edebiyatı", weight: 3 },
                { name: "Geçiş Dönemi Eserleri", weight: 2 },
                { name: "Halk Edebiyatı - Anonim", weight: 2 },
                { name: "Halk Edebiyatı - Âşık Tarzı", weight: 3 },
                { name: "Halk Edebiyatı - Tekke / Tasavvuf", weight: 2 },
                { name: "Divan Edebiyatı - Nazım Biçimleri", weight: 3 },
                { name: "Divan Edebiyatı - Şair ve Eserler", weight: 3 },
                { name: "Divan Edebiyatı - Nesir", weight: 2 },
                { name: "Tanzimat Edebiyatı I. Dönem", weight: 3 },
                { name: "Tanzimat Edebiyatı II. Dönem", weight: 3 },
                { name: "Servet-i Fünûn Edebiyatı", weight: 3 },
                { name: "Fecr-i Âti Edebiyatı", weight: 2 },
                { name: "Millî Edebiyat Dönemi", weight: 3 },
                { name: "Edebi Akımlar", weight: 2 }
            ],
            Fizik: [
                { name: "Fizik Bilimine Giriş", weight: 1 },
                { name: "Madde ve Özellikleri", weight: 2 },
                { name: "Kuvvet ve Hareket", weight: 3 },
                { name: "Newton'un Hareket Yasaları", weight: 3 },
                { name: "Bir Boyutta Sabit İvmeli Hareket", weight: 3 },
                { name: "İki Boyutta Hareket ve Atışlar", weight: 3 },
                { name: "Enerji ve Momentum", weight: 3 },
                { name: "İtme ve Çizgisel Momentum", weight: 2 },
                { name: "Tork ve Denge", weight: 3 },
                { name: "Kütle Merkezi", weight: 2 },
                { name: "Basit Makineler", weight: 2 },
                { name: "Isı ve Sıcaklık", weight: 2 },
                { name: "Basınç ve Kaldırma Kuvveti", weight: 2 },
                { name: "Elektrik Alan ve Potansiyel", weight: 3 },
                { name: "Paralel Levhalar ve Sığa", weight: 3 },
                { name: "Manyetizma ve Manyetik Kuvvet", weight: 3 },
                { name: "İndüksiyon ve Alternatif Akım", weight: 3 },
                { name: "Transformatörler", weight: 2 },
                { name: "Dalgalar ve Dalga Mekaniği", weight: 3 },
                { name: "Optik ve Aydınlanma", weight: 3 }
            ],
            Kimya: [
                { name: "Modern Atom Teorisi", weight: 3 },
                { name: "Periyodik Sistem ve Özellikler", weight: 3 },
                { name: "Kimyasal Türler Arası Etkileşimler", weight: 3 },
                { name: "Gazlar", weight: 3 },
                { name: "Sıvı Çözeltiler ve Çözünürlük", weight: 3 },
                { name: "Kimyasal Hesaplamalar (Mol)", weight: 3 },
                { name: "Asitler, Bazlar ve Tuzlar", weight: 3 },
                { name: "Kimyasal Tepkimelerde Enerji", weight: 3 },
                { name: "Kimyasal Tepkimelerde Hız", weight: 3 },
                { name: "Kimyasal Denge", weight: 3 },
                { name: "Sulu Çözelti Dengeleri", weight: 3 }
            ],
            Biyoloji: [
                { name: "Sinir Sistemi", weight: 3 },
                { name: "Endokrin Sistem ve Hormonlar", weight: 3 },
                { name: "Duyu Organları", weight: 2 },
                { name: "Destek ve Hareket Sistemi", weight: 2 },
                { name: "Sindirim Sistemi", weight: 2 },
                { name: "Dolaşım ve Bağışıklık Sistemi", weight: 3 },
                { name: "Solunum Sistemi", weight: 2 },
                { name: "Boşaltım Sistemi", weight: 2 },
                { name: "Üreme Sistemi ve Embriyonik Gelişim", weight: 3 },
                { name: "Komünite Ekolojisi", weight: 2 },
                { name: "Popülasyon Ekolojisi", weight: 2 },
                { name: "Hücre Bölünmeleri", weight: 3 },
                { name: "Kalıtımın Genel İlkeleri", weight: 3 }
            ],
            Tarih: [
                { name: "Tarih Bilimi ve Zaman", weight: 1 },
                { name: "İnsanlığın İlk Dönemleri", weight: 2 },
                { name: "Orta Çağ'da Dünya", weight: 2 },
                { name: "İlk ve Orta Çağlarda Türk Dünyası", weight: 3 },
                { name: "İslam Medeniyetinin Doğuşu", weight: 2 },
                { name: "Türklerin İslamiyet'i Kabulü ve İlk Türk-İslam Devletleri", weight: 3 },
                { name: "Yerleşme ve Devletleşme Sürecinde Selçuklu Türkiyesi", weight: 3 },
                { name: "Beylikten Devlete Osmanlı Siyaseti", weight: 3 },
                { name: "Devletleşme Sürecinde Savaşçılar ve Askerler", weight: 2 },
                { name: "Beylikten Devlete Osmanlı Medeniyeti", weight: 2 },
                { name: "Dünya Gücü Osmanlı Devleti", weight: 3 },
                { name: "Sultan ve Osmanlı Merkez Teşkilatı", weight: 2 },
                { name: "Klasik Çağda Osmanlı Toplum Düzeni", weight: 2 },
                { name: "Değişen Dünya Dengeleri Karşısında Osmanlı", weight: 3 },
                { name: "Değişim Çağında Avrupa ve Osmanlı", weight: 3 },
                { name: "Uluslararası İlişkilerde Denge Stratejisi", weight: 2 },
                { name: "Devrimler Çağında Değişen Devlet-Toplum İlişkileri", weight: 3 },
                { name: "Sermaye ve Emek", weight: 2 },
                { name: "XIX. ve XX. Yüzyılda Değişen Gündelik Hayat", weight: 2 }
            ],
            Coğrafya: [
                { name: "Ekosistem ve Madde Döngüleri", weight: 3 },
                { name: "Biyoçeşitlilik", weight: 2 },
                { name: "Nüfus Politikaları", weight: 2 },
                { name: "Göç ve Şehirleşme", weight: 3 },
                { name: "Türkiye'de Nüfus ve Yerleşme", weight: 3 },
                { name: "Ekonomik Faaliyetlerin Sınıflandırılması", weight: 2 },
                { name: "Türkiye Ekonomisi ve Sektörler", weight: 3 },
                { name: "Doğal Kaynaklar ve Enerji", weight: 2 },
                { name: "İlk Medeniyetler ve Şehirler", weight: 2 },
                { name: "Kültür Bölgeleri ve Türk Kültürü", weight: 2 },
                { name: "Doğal Afetler ve Risk Yönetimi", weight: 2 },
                { name: "Türkiye'nin Jeopolitik Konumu", weight: 3 },
                { name: "Bölgesel Kalkınma Projeleri", weight: 2 },
                { name: "Çevre Sorunları ve Yönetimi", weight: 2 }
            ],
            Felsefe: [
                { name: "Felsefeyi Tanıma", weight: 2 },
                { name: "Bilgi Felsefesi", weight: 3 },
                { name: "Varlık Felsefesi", weight: 2 },
                { name: "Ahlak Felsefesi", weight: 2 },
                { name: "Sanat Felsefesi", weight: 2 },
                { name: "Din Felsefesi", weight: 2 },
                { name: "Siyaset Felsefesi", weight: 2 },
                { name: "Bilim Felsefesi", weight: 2 },
                { name: "MÖ 6. - MS 2. Yüzyıl Felsefesi", weight: 3 },
                { name: "MS 2. - 15. Yüzyıl Felsefesi", weight: 3 },
                { name: "15. - 17. Yüzyıl Felsefesi", weight: 3 }
            ],
            Mantık: [
                { name: "Mantığa Giriş", weight: 2 },
                { name: "Klasik Mantık - Kavram ve Terim", weight: 3 },
                { name: "Klasik Mantık - Önermeler", weight: 3 },
                { name: "Klasik Mantık - Kıyas", weight: 3 },
                { name: "Mantık ve Dil", weight: 2 },
                { name: "Sembolik Mantık - Önermeler Mantığı", weight: 3 },
                { name: "Sembolik Mantık - Çıkarım Kuralları", weight: 3 }
            ],
            Psikoloji: [
                { name: "Psikoloji Bilimini Tanıyalım", weight: 2 },
                { name: "Psikolojinin Alt Dalları ve Yaklaşımları", weight: 2 },
                { name: "Psikolojinin Temel Süreçleri - Duyum ve Algı", weight: 3 },
                { name: "Dikkat ve Bilinç", weight: 2 },
                { name: "Öğrenme", weight: 3 },
                { name: "Bellek ve Unutma", weight: 3 },
                { name: "Düşünme ve Problem Çözme", weight: 2 },
                { name: "Güdü ve Duygular", weight: 2 },
                { name: "Kişilik ve Ölçülmesi", weight: 2 },
                { name: "Ruh Sağlığının Temelleri", weight: 2 }
            ],
            Sosyoloji: [
                { name: "Sosyolojiye Giriş", weight: 2 },
                { name: "Birey ve Toplum", weight: 2 },
                { name: "Toplumsal Yapı ve Tabakalaşma", weight: 3 },
                { name: "Toplumsal Değişme ve Gelişme", weight: 3 },
                { name: "Toplum ve Kültür", weight: 3 },
                { name: "Toplumsal Kurumlar - Aile", weight: 2 },
                { name: "Toplumsal Kurumlar - Eğitim ve Din", weight: 2 },
                { name: "Toplumsal Kurumlar - Ekonomi ve Siyaset", weight: 2 }
            ],
            Din: [
                { name: "Dünya ve Ahiret", weight: 2 },
                { name: "Kur'an'a Göre Hz. Muhammed", weight: 2 },
                { name: "Kur'an'da Bazı Kavramlar", weight: 2 },
                { name: "İnançla İlgili Meseleler", weight: 2 },
                { name: "Yahudilik ve Hristiyanlık", weight: 2 },
                { name: "İslam ve Bilim", weight: 2 },
                { name: "Anadolu'da İslam", weight: 2 }
            ]
        },
        grade12: {
            Matematik: [
                { name: "Üstel ve Logaritmik Fonksiyonlar", weight: 3 },
                { name: "Diziler ve Seriler", weight: 3 },
                { name: "Limit ve Süreklilik", weight: 3 },
                { name: "Türev - Tanım ve Kurallar", weight: 3 },
                { name: "Türev Uygulamaları (Grafik, Maks-Min)", weight: 4 },
                { name: "İntegral - Belirsiz İntegral", weight: 3 },
                { name: "İntegral - Belirli İntegral", weight: 3 },
                { name: "İntegral Uygulamaları (Alan, Hacim)", weight: 4 },
                { name: "Trigonometrik Denklem ve Uygulamalar", weight: 3 },
                { name: "Analitik Geometri Uygulamaları", weight: 3 }
            ],
            Geometri: [
                { name: "Uzay Geometri - Katı Cisimler", weight: 3 },
                { name: "Küre ve Uygulamaları", weight: 3 },
                { name: "Çemberin Analitik İncelenmesi", weight: 3 },
                { name: "Konikler - Elips", weight: 3 },
                { name: "Konikler - Hiperbol ve Parabol", weight: 3 },
                { name: "Uzayda Vektörler", weight: 2 },
                { name: "Dönüşümler ve Simetri", weight: 2 }
            ],
            Edebiyat: [
                { name: "Cumhuriyet Dönemi - Beş Hececiler", weight: 2 },
                { name: "Cumhuriyet Dönemi - Yedi Meşaleciler", weight: 2 },
                { name: "Garip (I. Yeni) Akımı", weight: 3 },
                { name: "İkinci Yeni Şiiri", weight: 3 },
                { name: "Cumhuriyet Dönemi Bağımsız Şairler", weight: 3 },
                { name: "Cumhuriyet Dönemi Roman ve Hikâye", weight: 3 },
                { name: "Toplumcu Gerçekçi Edebiyat", weight: 3 },
                { name: "Millî Edebiyat Zevk ve Anlayışını Sürdürenler", weight: 2 },
                { name: "Modernizmi Esas Alan Eserler", weight: 3 },
                { name: "Cumhuriyet Dönemi Tiyatrosu", weight: 2 },
                { name: "Öğretici Metinler (Deneme, Makale, Fıkra, Sohbet)", weight: 3 },
                { name: "Anı, Biyografi, Gezi Yazısı, Günlük", weight: 2 },
                { name: "Eleştiri, Röportaj ve Haber Metinleri", weight: 2 },
                { name: "Türk Dünyası Edebiyatı", weight: 2 },
                { name: "Dünya Edebiyatı ve Akımlar", weight: 2 }
            ],
            Fizik: [
                { name: "Çembersel Hareket", weight: 3 },
                { name: "Dönerek Öteleme Hareketi", weight: 3 },
                { name: "Açısal Momentum", weight: 3 },
                { name: "Kütle Çekim ve Kepler Yasaları", weight: 3 },
                { name: "Basit Harmonik Hareket", weight: 3 },
                { name: "Dalga Mekaniği ve Girişim", weight: 3 },
                { name: "Atom Fiziğine Giriş", weight: 3 },
                { name: "Büyük Patlama ve Radyoaktivite", weight: 3 },
                { name: "Özel Görelilik", weight: 2 },
                { name: "Kuantum Fiziğine Giriş", weight: 3 },
                { name: "Fotoelektrik Olay ve Compton", weight: 3 },
                { name: "Modern Fiziğin Teknolojideki Uygulamaları", weight: 2 }
            ],
            Kimya: [
                { name: "Kimya ve Elektrik (Elektrokimya)", weight: 3 },
                { name: "Redoks Tepkimeleri ve Piller", weight: 3 },
                { name: "Elektroliz ve Korozyon", weight: 2 },
                { name: "Karbon Kimyasına Giriş", weight: 3 },
                { name: "Organik Bileşikler - Hidrokarbonlar", weight: 3 },
                { name: "Organik Bileşikler - Alkoller ve Eterler", weight: 3 },
                { name: "Organik Bileşikler - Aldehit, Keton, Asit, Ester", weight: 3 },
                { name: "Organik Tepkimeler", weight: 3 },
                { name: "Enerji Kaynakları ve Bilimsel Gelişmeler", weight: 2 },
                { name: "Kimya Her Yerde (Polimer, İlaç, Gübre)", weight: 2 }
            ],
            Biyoloji: [
                { name: "Genden Proteine (Nükleik Asitler)", weight: 3 },
                { name: "Genetik Şifre ve Protein Sentezi", weight: 3 },
                { name: "Modern Genetik Uygulamaları", weight: 3 },
                { name: "Biyoteknoloji ve Gen Mühendisliği", weight: 3 },
                { name: "Canlılarda Enerji Dönüşümleri - Fotosentez", weight: 3 },
                { name: "Kemosentez", weight: 2 },
                { name: "Hücresel Solunum", weight: 3 },
                { name: "Bitki Biyolojisi - Yapı ve Dokular", weight: 3 },
                { name: "Bitkilerde Taşıma ve Beslenme", weight: 3 },
                { name: "Bitkilerde Eşeyli Üreme", weight: 2 },
                { name: "Canlılar ve Çevre", weight: 2 },
                { name: "Evrenin Oluşumu ve Canlıların Kökeni", weight: 2 }
            ],
            Tarih: [
                { name: "XX. Yüzyıl Başlarında Osmanlı Devleti ve Dünya", weight: 3 },
                { name: "I. Dünya Savaşı ve Osmanlı Cepheleri", weight: 3 },
                { name: "Millî Mücadele Hazırlık Dönemi", weight: 3 },
                { name: "Kurtuluş Savaşı ve Antlaşmalar", weight: 3 },
                { name: "Atatürkçülük ve Türk İnkılabı", weight: 3 },
                { name: "Atatürk İlkeleri", weight: 3 },
                { name: "Atatürk Dönemi Türk Dış Politikası", weight: 3 },
                { name: "İki Savaş Arasındaki Dönemde Türkiye ve Dünya", weight: 2 },
                { name: "II. Dünya Savaşı Sürecinde Türkiye ve Dünya", weight: 3 },
                { name: "II. Dünya Savaşı Sonrasında Türkiye ve Dünya", weight: 3 },
                { name: "Soğuk Savaş Dönemi", weight: 3 },
                { name: "Yumuşama Dönemi ve Sonrası", weight: 2 },
                { name: "Küreselleşen Dünya", weight: 2 },
                { name: "Toplumsal Devrim Çağında Dünya ve Türkiye", weight: 2 }
            ],
            Coğrafya: [
                { name: "Doğal Sistemlerdeki Değişim", weight: 2 },
                { name: "Ekstrem Doğa Olayları", weight: 2 },
                { name: "Şehirlerin Fonksiyonları ve Etki Alanları", weight: 3 },
                { name: "Üretim, Dağıtım ve Tüketim İlişkisi", weight: 3 },
                { name: "Doğal Kaynaklar ve Enerji Güvenliği", weight: 3 },
                { name: "Ulaşım Ağları ve Ticaret Yolları", weight: 3 },
                { name: "Küresel ve Bölgesel Örgütler", weight: 3 },
                { name: "Ülkeler Arası Etkileşim", weight: 2 },
                { name: "Bölgeler ve Ülkeler - Gelişmiş Ülkeler", weight: 2 },
                { name: "Bölgeler ve Ülkeler - Gelişmekte Olan Ülkeler", weight: 2 },
                { name: "Çevre Sorunlarının Sınıflandırılması", weight: 2 },
                { name: "Doğal Kaynakların Sürdürülebilir Kullanımı", weight: 2 }
            ],
            Felsefe: [
                { name: "18. - 19. Yüzyıl Felsefesi", weight: 3 },
                { name: "20. Yüzyıl Felsefesi", weight: 3 },
                { name: "Çağdaş Felsefe Akımları", weight: 2 },
                { name: "Felsefi Problemlerin Güncel Yansımaları", weight: 2 }
            ],
            Din: [
                { name: "İslam'da İbadetlerin Amacı ve Hikmeti", weight: 2 },
                { name: "Kur'an'dan Mesajlar", weight: 2 },
                { name: "İslam Düşüncesinde Tasavvufi Yorumlar", weight: 2 },
                { name: "İslam Düşüncesinde İtikadi ve Fıkhi Yorumlar", weight: 2 },
                { name: "Hint ve Çin Dinleri", weight: 2 },
                { name: "Güncel Dini Meseleler", weight: 2 }
            ]
        }
    },

    // ══════════════════════════════════════════════════════════
    //  YDT — İngilizce, 80 soru / 120 dk
    // ══════════════════════════════════════════════════════════
    YDT: {
        grade11: {
            Ingilizce: [
                { name: "Tenses (Zamanlar)", weight: 4 },
                { name: "Modals", weight: 3 },
                { name: "Passive Voice", weight: 3 },
                { name: "Causatives", weight: 2 },
                { name: "Adjectives & Adverbs", weight: 2 },
                { name: "Comparison (Karşılaştırma)", weight: 2 },
                { name: "Conditionals (If Clauses)", weight: 3 },
                { name: "Wish Clauses", weight: 2 },
                { name: "Relative Clauses", weight: 3 },
                { name: "Noun Clauses", weight: 3 },
                { name: "Reported Speech", weight: 3 },
                { name: "Gerunds & Infinitives", weight: 3 },
                { name: "Conjunctions & Transitions", weight: 3 },
                { name: "Determiners & Quantifiers", weight: 2 },
                { name: "Pronouns", weight: 2 },
                { name: "Prepositions", weight: 3 },
                { name: "Phrasal Verbs", weight: 3 },
                { name: "Collocations", weight: 3 },
                { name: "Word Formation (Kelime Türetme)", weight: 3 },
                { name: "Vocabulary Building", weight: 4 }
            ]
        },
        grade12: {
            Ingilizce: [
                { name: "Cloze Test", weight: 4 },
                { name: "Sentence Completion", weight: 4 },
                { name: "Reading Comprehension (Paragraf)", weight: 4 },
                { name: "Restatement (Yeniden İfade)", weight: 3 },
                { name: "Paragraph Completion", weight: 3 },
                { name: "Irrelevant Sentence (Anlam Bütünlüğü)", weight: 3 },
                { name: "Dialogue Completion", weight: 3 },
                { name: "Situational Questions", weight: 2 },
                { name: "Translation English - Turkish", weight: 3 },
                { name: "Translation Turkish - English", weight: 3 },
                { name: "Guessing Meaning from Context", weight: 2 },
                { name: "Advanced Vocabulary", weight: 4 },
                { name: "Advanced Grammar Review", weight: 3 },
                { name: "Deneme ve Zaman Yönetimi", weight: 3 }
            ]
        }
    },

    // ══════════════════════════════════════════════════════════
    //  LGS — 90 soru / 155 dk (Sayısal 50 · Sözel 40)
    // ══════════════════════════════════════════════════════════
    LGS: {
        Turkce: [
            { name: "Sözcükte Anlam", weight: 3 },
            { name: "Deyim ve Atasözleri", weight: 2 },
            { name: "Cümlede Anlam", weight: 3 },
            { name: "Paragrafta Anlam ve Yapı", weight: 4 },
            { name: "Paragrafta Konu, Ana Fikir, Yardımcı Fikir", weight: 3 },
            { name: "Metin Türleri", weight: 2 },
            { name: "Söz Sanatları", weight: 2 },
            { name: "Fiilimsiler", weight: 3 },
            { name: "Cümlenin Ögeleri", weight: 3 },
            { name: "Cümle Türleri", weight: 2 },
            { name: "Fiilde Çatı", weight: 2 },
            { name: "Anlatım Bozuklukları", weight: 3 },
            { name: "Yazım Kuralları", weight: 3 },
            { name: "Noktalama İşaretleri", weight: 3 },
            { name: "Tablo, Grafik ve Görsel Yorumlama", weight: 2 },
            { name: "Sözel Mantık ve Akıl Yürütme", weight: 3 }
        ],
        Matematik: [
            { name: "Çarpanlar ve Katlar", weight: 2 },
            { name: "Üslü İfadeler", weight: 3 },
            { name: "Kareköklü İfadeler", weight: 3 },
            { name: "Veri Analizi", weight: 2 },
            { name: "Basit Olayların Olma Olasılığı", weight: 2 },
            { name: "Cebirsel İfadeler ve Özdeşlikler", weight: 3 },
            { name: "Doğrusal Denklemler", weight: 3 },
            { name: "Eşitsizlikler", weight: 3 },
            { name: "Üçgenler", weight: 3 },
            { name: "Eşlik ve Benzerlik", weight: 2 },
            { name: "Dönüşüm Geometrisi", weight: 2 },
            { name: "Geometrik Cisimler", weight: 2 },
            { name: "Yeni Nesil Problemler", weight: 4 }
        ],
        Fen: [
            { name: "Mevsimler ve İklim", weight: 2 },
            { name: "DNA ve Genetik Kod", weight: 3 },
            { name: "Kalıtım", weight: 3 },
            { name: "Mutasyon, Modifikasyon ve Adaptasyon", weight: 2 },
            { name: "Basınç", weight: 3 },
            { name: "Madde ve Endüstri - Periyodik Sistem", weight: 3 },
            { name: "Fiziksel ve Kimyasal Değişimler", weight: 2 },
            { name: "Kimyasal Tepkimeler", weight: 2 },
            { name: "Asitler ve Bazlar", weight: 3 },
            { name: "Basit Makineler", weight: 3 },
            { name: "Enerji Dönüşümleri ve Çevre Bilimi", weight: 3 },
            { name: "Madde Döngüleri ve Sürdürülebilirlik", weight: 2 },
            { name: "Elektrik Yükleri ve Elektriklenme", weight: 3 },
            { name: "Elektrik Enerjisinin Dönüşümü", weight: 2 }
        ],
        Inkilap: [
            { name: "Bir Kahraman Doğuyor", weight: 2 },
            { name: "Millî Uyanış: Bağımsızlık Yolunda Atılan Adımlar", weight: 3 },
            { name: "Millî Bir Destan: Ya İstiklal Ya Ölüm", weight: 3 },
            { name: "Atatürkçülük ve Çağdaşlaşan Türkiye", weight: 3 },
            { name: "Demokratikleşme Çabaları", weight: 2 },
            { name: "Atatürk Dönemi Türk Dış Politikası", weight: 2 },
            { name: "Atatürk'ün Ölümü ve Sonrası", weight: 1 }
        ],
        Din: [
            { name: "Kader İnancı", weight: 3 },
            { name: "Zekât ve Sadaka", weight: 2 },
            { name: "Din ve Hayat", weight: 2 },
            { name: "Hz. Muhammed'in Örnekliği", weight: 2 },
            { name: "Kur'an-ı Kerim ve Özellikleri", weight: 2 },
            { name: "Sureler ve Ayetler (Ayet el-Kürsi, Maûn, Asr)", weight: 2 },
            { name: "Peygamber Kıssaları (Musa, Şuayb, Yusuf, Nuh)", weight: 2 }
        ],
        Ingilizce: [
            { name: "Friendship", weight: 2 },
            { name: "Teen Life", weight: 2 },
            { name: "In The Kitchen", weight: 2 },
            { name: "On The Phone", weight: 2 },
            { name: "The Internet", weight: 2 },
            { name: "Adventures", weight: 2 },
            { name: "Tourism", weight: 2 },
            { name: "Chores", weight: 2 },
            { name: "Science", weight: 2 },
            { name: "Natural Forces", weight: 2 }
        ]
    },

    // ══════════════════════════════════════════════════════════
    //  KPSS — Lisans (Genel Yetenek 60 · Genel Kültür 60 · Eğitim Bilimleri 80)
    // ══════════════════════════════════════════════════════════
    KPSS: {
        "Türkçe (GY)": [
            { name: "Sözcükte Anlam", weight: 3 },
            { name: "Cümlede Anlam", weight: 3 },
            { name: "Paragrafta Anlam ve Yapı", weight: 4 },
            { name: "Ses Bilgisi", weight: 2 },
            { name: "Yazım Kuralları", weight: 3 },
            { name: "Noktalama İşaretleri", weight: 3 },
            { name: "Sözcük Türleri", weight: 3 },
            { name: "Sözcükte Yapı ve Ekler", weight: 2 },
            { name: "Fiiller ve Fiilimsiler", weight: 3 },
            { name: "Cümlenin Ögeleri", weight: 3 },
            { name: "Cümle Türleri", weight: 2 },
            { name: "Anlatım Bozuklukları", weight: 3 },
            { name: "Sözel Mantık", weight: 3 }
        ],
        "Matematik (GY)": [
            { name: "Temel Kavramlar", weight: 2 },
            { name: "Sayı Basamakları", weight: 2 },
            { name: "Bölme ve Bölünebilme", weight: 2 },
            { name: "EBOB - EKOK", weight: 2 },
            { name: "Rasyonel Sayılar", weight: 2 },
            { name: "Basit Eşitsizlikler ve Mutlak Değer", weight: 2 },
            { name: "Üslü ve Köklü Sayılar", weight: 3 },
            { name: "Çarpanlara Ayırma", weight: 2 },
            { name: "Oran - Orantı", weight: 3 },
            { name: "Problemler (Sayı, Kesir, Yaş)", weight: 4 },
            { name: "Problemler (İşçi, Havuz, Hareket)", weight: 4 },
            { name: "Problemler (Yüzde, Kar-Zarar, Faiz)", weight: 4 },
            { name: "Karışım ve Grafik Problemleri", weight: 3 },
            { name: "Kümeler ve İşlem", weight: 2 },
            { name: "Permütasyon, Kombinasyon, Olasılık", weight: 3 },
            { name: "Sayısal Mantık ve Tablo Yorumlama", weight: 3 },
            { name: "Geometri - Açılar ve Üçgenler", weight: 3 },
            { name: "Geometri - Dörtgenler ve Çember", weight: 3 },
            { name: "Geometri - Analitik ve Katı Cisimler", weight: 3 }
        ],
        "Tarih (GK)": [
            { name: "İslamiyet Öncesi Türk Tarihi", weight: 3 },
            { name: "İlk Türk - İslam Devletleri", weight: 3 },
            { name: "Osmanlı Kuruluş Dönemi", weight: 3 },
            { name: "Osmanlı Yükselme Dönemi", weight: 3 },
            { name: "Osmanlı Duraklama ve Gerileme Dönemi", weight: 3 },
            { name: "Osmanlı Kültür ve Medeniyeti", weight: 3 },
            { name: "Osmanlı'da Islahat Hareketleri", weight: 3 },
            { name: "XX. Yüzyıl Başlarında Osmanlı", weight: 2 },
            { name: "I. Dünya Savaşı ve Cepheler", weight: 3 },
            { name: "Kurtuluş Savaşı Hazırlık Dönemi", weight: 3 },
            { name: "Kurtuluş Savaşı Cepheleri", weight: 3 },
            { name: "Atatürk İlke ve İnkılapları", weight: 4 },
            { name: "Atatürk Dönemi Dış Politika", weight: 3 },
            { name: "Çağdaş Türk ve Dünya Tarihi", weight: 2 }
        ],
        "Coğrafya (GK)": [
            { name: "Türkiye'nin Coğrafi Konumu", weight: 3 },
            { name: "Türkiye'nin Yer Şekilleri", weight: 3 },
            { name: "Türkiye'nin İklimi ve Bitki Örtüsü", weight: 3 },
            { name: "Türkiye'de Toprak ve Su Kaynakları", weight: 2 },
            { name: "Türkiye'de Nüfus ve Yerleşme", weight: 3 },
            { name: "Türkiye'de Tarım ve Hayvancılık", weight: 3 },
            { name: "Türkiye'de Madenler ve Enerji Kaynakları", weight: 3 },
            { name: "Türkiye'de Sanayi", weight: 3 },
            { name: "Türkiye'de Ulaşım, Ticaret ve Turizm", weight: 3 },
            { name: "Türkiye'nin Coğrafi Bölgeleri", weight: 3 }
        ],
        "Vatandaşlık (GK)": [
            { name: "Hukukun Temel Kavramları", weight: 3 },
            { name: "Devlet Biçimleri ve Hükümet Sistemleri", weight: 3 },
            { name: "Anayasa Hukuku ve Anayasal Gelişmeler", weight: 3 },
            { name: "1982 Anayasası - Temel İlkeler", weight: 3 },
            { name: "Temel Hak ve Ödevler", weight: 3 },
            { name: "Yasama - TBMM", weight: 3 },
            { name: "Yürütme - Cumhurbaşkanlığı Hükümet Sistemi", weight: 3 },
            { name: "Yargı ve Yüksek Mahkemeler", weight: 3 },
            { name: "İdare Hukuku ve İdari Teşkilat", weight: 3 },
            { name: "Uluslararası Kuruluşlar", weight: 2 },
            { name: "Güncel Bilgiler", weight: 2 }
        ],
        "Eğitim Bilimleri": [
            { name: "Gelişim Psikolojisi - Temel Kavramlar", weight: 3 },
            { name: "Bilişsel Gelişim (Piaget, Vygotsky)", weight: 4 },
            { name: "Psikososyal Gelişim (Erikson)", weight: 3 },
            { name: "Ahlak Gelişimi (Kohlberg, Piaget)", weight: 3 },
            { name: "Dil ve Fiziksel Gelişim", weight: 2 },
            { name: "Öğrenme Psikolojisi - Temel Kavramlar", weight: 3 },
            { name: "Davranışçı Öğrenme Kuramları", weight: 4 },
            { name: "Bilişsel Öğrenme Kuramları", weight: 4 },
            { name: "Yapılandırmacı ve Sosyal Öğrenme", weight: 3 },
            { name: "Güdülenme ve Transfer", weight: 2 },
            { name: "Öğretim İlke ve Yöntemleri - Temel İlkeler", weight: 3 },
            { name: "Öğretim Stratejileri ve Yöntemleri", weight: 4 },
            { name: "Öğretim Teknikleri", weight: 3 },
            { name: "Program Geliştirme", weight: 3 },
            { name: "Ölçme ve Değerlendirme - Temel Kavramlar", weight: 3 },
            { name: "Ölçme Araçlarında Bulunması Gereken Nitelikler", weight: 3 },
            { name: "Test ve Madde Analizi", weight: 3 },
            { name: "İstatistiksel İşlemler", weight: 3 },
            { name: "Rehberlik - Temel Kavram ve İlkeler", weight: 3 },
            { name: "Rehberlik Hizmet Alanları ve Türleri", weight: 3 },
            { name: "Rehberlikte Teknikler ve Test Dışı Teknikler", weight: 3 },
            { name: "Sınıf Yönetimi", weight: 3 },
            { name: "Özel Eğitim ve Kaynaştırma", weight: 3 }
        ],
        "ÖABT - Rehberlik Öğretmenliği (PDR)": [
            { name: "Psikolojik Danışma İlke ve Teknikleri", weight: 4 },
            { name: "Psikolojik Danışma Kuramları", weight: 4 },
            { name: "Grupla Psikolojik Danışma", weight: 3 },
            { name: "Mesleki Rehberlik ve Kariyer Kuramları", weight: 4 },
            { name: "Ölçme ve Değerlendirme (PDR)", weight: 3 },
            { name: "Test ve Test Dışı Teknikler", weight: 3 },
            { name: "Gelişim Psikolojisi", weight: 3 },
            { name: "Kişilik Kuramları", weight: 3 },
            { name: "Psikopatoloji ve Ruh Sağlığı", weight: 3 },
            { name: "Öğrenme Psikolojisi", weight: 3 },
            { name: "Sosyal Psikoloji", weight: 2 },
            { name: "Araştırma Yöntemleri ve İstatistik", weight: 3 },
            { name: "Özel Eğitim", weight: 3 },
            { name: "Etik ve Yasal Konular", weight: 2 }
        ],
        "ÖABT - Sınıf Öğretmenliği": [
            { name: "Türkçe Öğretimi", weight: 4 },
            { name: "İlk Okuma Yazma Öğretimi", weight: 4 },
            { name: "Matematik Öğretimi", weight: 4 },
            { name: "Hayat Bilgisi Öğretimi", weight: 3 },
            { name: "Fen Bilimleri Öğretimi", weight: 3 },
            { name: "Sosyal Bilgiler Öğretimi", weight: 3 },
            { name: "Görsel Sanatlar ve Müzik Öğretimi", weight: 2 },
            { name: "Beden Eğitimi ve Oyun Öğretimi", weight: 2 },
            { name: "Değerler Eğitimi", weight: 2 },
            { name: "Sınıf Yönetimi ve Özel Eğitim", weight: 3 }
        ],
        "ÖABT - Türkçe Öğretmenliği": [
            { name: "Ses Bilgisi ve Şekil Bilgisi", weight: 3 },
            { name: "Sözcük Bilgisi ve Anlam Bilimi", weight: 3 },
            { name: "Cümle Bilgisi (Söz Dizimi)", weight: 3 },
            { name: "Metin Bilgisi ve Türleri", weight: 3 },
            { name: "Eski Türk Dili ve Tarihî Metinler", weight: 3 },
            { name: "Türk Halk Edebiyatı", weight: 3 },
            { name: "Divan Edebiyatı", weight: 3 },
            { name: "Yeni Türk Edebiyatı", weight: 4 },
            { name: "Çocuk Edebiyatı", weight: 2 },
            { name: "Türkçe Öğretim Yöntemleri", weight: 4 },
            { name: "Dinleme, Konuşma, Okuma, Yazma Eğitimi", weight: 4 }
        ],
        "ÖABT - Matematik Öğretmenliği (Lise)": [
            { name: "Analiz ve Diferansiyel Denklemler", weight: 4 },
            { name: "Cebir ve Soyut Matematik", weight: 4 },
            { name: "Lineer Cebir", weight: 3 },
            { name: "Geometri ve Analitik Geometri", weight: 3 },
            { name: "Olasılık ve İstatistik", weight: 3 },
            { name: "Matematik Tarihi ve Felsefesi", weight: 2 },
            { name: "Matematik Öğretim Yöntemleri", weight: 4 },
            { name: "Matematikte Ölçme ve Değerlendirme", weight: 3 }
        ],
        "ÖABT - Fen Bilimleri Öğretmenliği": [
            { name: "Fizik Alan Bilgisi", weight: 4 },
            { name: "Kimya Alan Bilgisi", weight: 4 },
            { name: "Biyoloji Alan Bilgisi", weight: 4 },
            { name: "Yer Bilimi ve Astronomi", weight: 2 },
            { name: "Çevre Bilimi", weight: 2 },
            { name: "Fen Öğretimi Yöntem ve Teknikleri", weight: 4 },
            { name: "Laboratuvar Uygulamaları ve Güvenlik", weight: 3 },
            { name: "Fende Ölçme ve Değerlendirme", weight: 3 }
        ],
        "ÖABT - Sosyal Bilgiler Öğretmenliği": [
            { name: "Tarih Alan Bilgisi", weight: 4 },
            { name: "Coğrafya Alan Bilgisi", weight: 4 },
            { name: "Vatandaşlık ve Demokrasi Eğitimi", weight: 3 },
            { name: "Sosyoloji ve Antropoloji", weight: 2 },
            { name: "Ekonomi ve Girişimcilik", weight: 2 },
            { name: "Arkeoloji ve Sanat Tarihi", weight: 2 },
            { name: "Sosyal Bilgiler Öğretim Yöntemleri", weight: 4 },
            { name: "Sosyal Bilgilerde Ölçme ve Değerlendirme", weight: 3 }
        ],
        "ÖABT - Okul Öncesi Öğretmenliği": [
            { name: "Erken Çocukluk Gelişimi", weight: 4 },
            { name: "Okul Öncesi Eğitim Programı", weight: 4 },
            { name: "Oyun ve Drama", weight: 3 },
            { name: "Erken Okuryazarlık ve Dil Etkinlikleri", weight: 3 },
            { name: "Matematik ve Fen Etkinlikleri", weight: 3 },
            { name: "Sanat ve Müzik Etkinlikleri", weight: 2 },
            { name: "Aile Katılımı ve Eğitimi", weight: 2 },
            { name: "Okul Öncesinde Ölçme ve Değerlendirme", weight: 3 },
            { name: "Özel Eğitim ve Kaynaştırma", weight: 3 }
        ],
        "ÖABT - İngilizce Öğretmenliği": [
            { name: "Language Competency (Dil Yeterliği)", weight: 4 },
            { name: "Linguistics (Dil Bilim)", weight: 3 },
            { name: "Language Acquisition Theories", weight: 3 },
            { name: "ELT Methods and Approaches", weight: 4 },
            { name: "Teaching Language Skills", weight: 4 },
            { name: "Teaching Grammar and Vocabulary", weight: 3 },
            { name: "Materials Development and Adaptation", weight: 3 },
            { name: "Testing and Evaluation in ELT", weight: 3 }
        ],
        "ÖABT - Din Kültürü ve Ahlak Bilgisi": [
            { name: "Kur'an-ı Kerim ve Tefsir", weight: 3 },
            { name: "Hadis ve Sünnet", weight: 3 },
            { name: "Fıkıh (İslam Hukuku)", weight: 3 },
            { name: "Kelam ve İtikat", weight: 3 },
            { name: "İslam Tarihi", weight: 3 },
            { name: "Tasavvuf ve İslam Ahlakı", weight: 3 },
            { name: "Dinler Tarihi", weight: 3 },
            { name: "Din Felsefesi ve Din Sosyolojisi", weight: 3 },
            { name: "Din Eğitimi ve Öğretim Yöntemleri", weight: 4 },
            { name: "Arapça", weight: 2 }
        ]
    },

    // ══════════════════════════════════════════════════════════
    //  AGS — MEB Akademi Giriş Sınavı, 80 soru / 110 dk
    //  ÖSYM 2026 dağılımı: Eğitim Bilimleri 30 · Türkçe 15 · Matematik 15
    //                      Tarih 6 · Coğrafya 6 · Mevzuat 8
    // ══════════════════════════════════════════════════════════
    AGS: {
        "Eğitim Bilimleri": [
            { name: "Gelişim Psikolojisi - Temel Kavramlar", weight: 3 },
            { name: "Bilişsel Gelişim (Piaget, Vygotsky, Bruner)", weight: 4 },
            { name: "Psikososyal ve Kişilik Gelişimi (Erikson, Freud)", weight: 4 },
            { name: "Ahlak Gelişimi (Piaget, Kohlberg)", weight: 3 },
            { name: "Dil, Fiziksel ve Motor Gelişim", weight: 2 },
            { name: "Öğrenme Psikolojisi - Temel Kavramlar", weight: 3 },
            { name: "Klasik ve Edimsel Koşullanma", weight: 4 },
            { name: "Bilişsel Öğrenme Kuramları", weight: 4 },
            { name: "Sosyal Öğrenme ve Yapılandırmacılık", weight: 3 },
            { name: "Güdülenme, Dikkat ve Transfer", weight: 3 },
            { name: "Öğretim İlke ve Yöntemleri", weight: 4 },
            { name: "Öğretim Strateji, Yöntem ve Teknikleri", weight: 4 },
            { name: "Program Geliştirme ve Öğretim Tasarımı", weight: 3 },
            { name: "Öğretim Teknolojileri ve Materyal Tasarımı", weight: 3 },
            { name: "Ölçme ve Değerlendirme - Temel Kavramlar", weight: 3 },
            { name: "Ölçme Araçlarının Nitelikleri", weight: 3 },
            { name: "Test ve Madde Analizi", weight: 3 },
            { name: "İstatistiksel İşlemler ve Puan Türleri", weight: 3 },
            { name: "Alternatif Ölçme ve Değerlendirme", weight: 2 },
            { name: "Rehberlik - Temel Kavram ve İlkeler", weight: 3 },
            { name: "Rehberlik Hizmet Alanları", weight: 3 },
            { name: "Sınıf Yönetimi ve İstenmeyen Davranışlar", weight: 4 },
            { name: "Özel Eğitim ve Kaynaştırma", weight: 3 },
            { name: "Türk Millî Eğitim Sistemi ve Yapısı", weight: 3 },
            { name: "Öğretmenlik Meslek Etiği", weight: 2 }
        ],
        "Türkçe": [
            { name: "Sözcükte Anlam", weight: 3 },
            { name: "Cümlede Anlam", weight: 3 },
            { name: "Paragrafta Anlam ve Yapı", weight: 4 },
            { name: "Anlatım Biçimleri ve Düşünceyi Geliştirme", weight: 3 },
            { name: "Ses Bilgisi ve Yazım Kuralları", weight: 3 },
            { name: "Noktalama İşaretleri", weight: 3 },
            { name: "Sözcük Türleri ve Yapısı", weight: 3 },
            { name: "Cümlenin Ögeleri ve Cümle Türleri", weight: 3 },
            { name: "Anlatım Bozuklukları", weight: 3 },
            { name: "Sözel Mantık ve Muhakeme", weight: 3 }
        ],
        "Matematik": [
            { name: "Temel Kavramlar ve Sayılar", weight: 3 },
            { name: "Bölme, Bölünebilme, EBOB-EKOK", weight: 3 },
            { name: "Rasyonel Sayılar, Üslü ve Köklü İfadeler", weight: 3 },
            { name: "Denklem ve Eşitsizlikler", weight: 3 },
            { name: "Oran - Orantı ve Problemler", weight: 4 },
            { name: "Yüzde, Kar-Zarar, Faiz Problemleri", weight: 4 },
            { name: "Hareket, İşçi ve Havuz Problemleri", weight: 4 },
            { name: "Kümeler ve İşlem", weight: 2 },
            { name: "Permütasyon, Kombinasyon, Olasılık", weight: 3 },
            { name: "Veri, Tablo ve Grafik Yorumlama", weight: 3 },
            { name: "Sayısal Mantık ve Muhakeme", weight: 3 },
            { name: "Geometri - Üçgen, Dörtgen, Çember", weight: 3 },
            { name: "Geometri - Analitik ve Katı Cisimler", weight: 3 }
        ],
        "Tarih": [
            { name: "İslamiyet Öncesi Türk Tarihi", weight: 2 },
            { name: "Türk - İslam Devletleri", weight: 2 },
            { name: "Osmanlı Devleti Siyasi Tarihi", weight: 3 },
            { name: "Osmanlı Kültür ve Medeniyeti", weight: 2 },
            { name: "Millî Mücadele Dönemi", weight: 3 },
            { name: "Atatürk İlke ve İnkılapları", weight: 3 },
            { name: "Atatürk Dönemi Dış Politika", weight: 2 },
            { name: "Çağdaş Türk ve Dünya Tarihi", weight: 2 }
        ],
        "Coğrafya": [
            { name: "Türkiye'nin Coğrafi Konumu ve Yer Şekilleri", weight: 3 },
            { name: "Türkiye'nin İklimi ve Bitki Örtüsü", weight: 3 },
            { name: "Türkiye'de Nüfus ve Yerleşme", weight: 3 },
            { name: "Türkiye'de Tarım, Hayvancılık ve Ormancılık", weight: 3 },
            { name: "Türkiye'de Madenler, Enerji ve Sanayi", weight: 3 },
            { name: "Türkiye'de Ulaşım, Ticaret ve Turizm", weight: 3 },
            { name: "Türkiye'nin Coğrafi Bölgeleri", weight: 3 }
        ],
        "Mevzuat": [
            { name: "1982 Anayasası - Temel İlkeler ve Haklar", weight: 3 },
            { name: "657 Sayılı Devlet Memurları Kanunu", weight: 4 },
            { name: "1739 Sayılı Millî Eğitim Temel Kanunu", weight: 4 },
            { name: "222 Sayılı İlköğretim ve Eğitim Kanunu", weight: 3 },
            { name: "MEB Teşkilat ve Görevleri Hakkında Mevzuat", weight: 3 },
            { name: "MEB Okul Öncesi ve İlköğretim Kurumları Yönetmeliği", weight: 3 },
            { name: "MEB Ortaöğretim Kurumları Yönetmeliği", weight: 3 },
            { name: "Öğretmen Atama ve Yer Değiştirme Yönetmeliği", weight: 3 },
            { name: "Millî Eğitim Bakanlığı Rehberlik Hizmetleri Yönetmeliği", weight: 3 },
            { name: "Özel Eğitim Hizmetleri Yönetmeliği", weight: 3 },
            { name: "Devlet Memurları Disiplin Hükümleri", weight: 3 },
            { name: "5442 Sayılı İl İdaresi Kanunu", weight: 2 },
            { name: "4483 Sayılı Memurların Yargılanması Hakkında Kanun", weight: 2 },
            { name: "KVKK ve Bilgi Edinme Hakkı", weight: 2 }
        ]
    }
};

export const SUBJECT_COLORS = {
    Matematik: "bg-blue-100 border-blue-200 text-blue-800",
    Fizik: "bg-purple-100 border-purple-200 text-purple-800",
    Kimya: "bg-green-100 border-green-200 text-green-800",
    Biyoloji: "bg-emerald-100 border-emerald-200 text-emerald-800",
    Turkce: "bg-red-100 border-red-200 text-red-800",
    Türkçe: "bg-red-100 border-red-200 text-red-800",
    Edebiyat: "bg-rose-100 border-rose-200 text-rose-800",
    Tarih: "bg-yellow-100 border-yellow-200 text-yellow-800",
    Coğrafya: "bg-amber-100 border-amber-200 text-amber-800",
    Cografya: "bg-amber-100 border-amber-200 text-amber-800",
    Felsefe: "bg-teal-100 border-teal-200 text-teal-800",
    Geometri: "bg-blue-100 border-blue-200 text-blue-800",
    Mantık: "bg-brand-soft border-brand-line text-brand",
    Psikoloji: "bg-pink-100 border-pink-200 text-pink-800",
    Sosyoloji: "bg-rose-100 border-rose-200 text-rose-800",
    Din: "bg-lime-100 border-lime-200 text-lime-800",
    Ingilizce: "bg-brand-soft border-brand-line text-brand",
    İngilizce: "bg-brand-soft border-brand-line text-brand",
    Fen: "bg-violet-100 border-violet-200 text-violet-800",
    Inkilap: "bg-orange-100 border-orange-200 text-orange-800",
    Vatandaşlık: "bg-cyan-100 border-cyan-200 text-cyan-800",
    Eğitim: "bg-sky-100 border-sky-200 text-sky-800",
    Mevzuat: "bg-surface-3 border-line text-ink",
    Alan: "bg-fuchsia-100 border-fuchsia-200 text-fuchsia-800",
    Genel: "bg-surface-3 border-line text-ink"
};

export const EXAM_COLORS = {
    TYT: "bg-blue-50 border-blue-400",
    AYT: "bg-purple-50 border-purple-400",
    LGS: "bg-green-50 border-green-400",
    KPSS: "bg-orange-50 border-orange-400",
    AGS: "bg-brand-soft border-indigo-400",
    YDT: "bg-red-50 border-red-400"
};

export const EXAM_TYPES = ["TYT", "AYT", "LGS", "YDT", "KPSS", "AGS"];

// Compatibility exports for StudyPlanner.jsx
export const EXAM_TOPICS = CURRICULUM;

// Dynamic Curriculum Manager
export const getCustomCurriculum = () => {
    try {
        const saved = localStorage.getItem('custom_curriculum');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Merge custom into original
            Object.keys(parsed).forEach(exam => {
                if (!CURRICULUM[exam]) CURRICULUM[exam] = {};
                Object.keys(parsed[exam]).forEach(categoryOrGrade => {
                    CURRICULUM[exam][categoryOrGrade] = parsed[exam][categoryOrGrade];
                });
            });
        }
    } catch (e) {
        console.error("Failed to load custom curriculum:", e);
    }
    return CURRICULUM;
};

// Custom PDFs per Exam Type (Books, Exams, etc.)
export const getExamResources = () => {
    try {
        return nesneOku('exam_resources');
    } catch (e) {
        return {};
    }
};

export const saveExamResources = (examType, newResource) => {
    try {
        const current = getExamResources();
        if (!current[examType]) current[examType] = [];
        current[examType].push(newResource);
        localStorage.setItem('exam_resources', JSON.stringify(current));
        // Force Firebase Sync if ready
        if (window.firebaseSync && window.firebaseSync.sync) window.firebaseSync.sync();
        return current;
    } catch (e) { return {}; }
};

export const removeExamResource = (examType, id) => {
    try {
        const current = getExamResources();
        if (current[examType]) {
            current[examType] = current[examType].filter(r => r.id !== id);
            localStorage.setItem('exam_resources', JSON.stringify(current));
            if (window.firebaseSync && window.firebaseSync.sync) window.firebaseSync.sync();
        }
        return current;
    } catch (e) { return {}; }
};

export const saveCustomTopics = (exam, section, updatedTopics) => {
    try {
        const current = nesneOku('custom_curriculum');
        if (!current[exam]) current[exam] = {};

        // Handling nested grades for AYT, YDT vs flat for TYT, LGS
        if (['grade11', 'grade12'].includes(section) || exam === 'AYT' || exam === 'YDT') {
            // For simplicity, let's just make the section the exact key we override
            current[exam][section] = updatedTopics;
        } else {
            current[exam][section] = updatedTopics;
        }

        localStorage.setItem('custom_curriculum', JSON.stringify(current));

        // Update in-memory
        if (!CURRICULUM[exam]) CURRICULUM[exam] = {};
        CURRICULUM[exam][section] = updatedTopics;

        if (window.firebaseSync && window.firebaseSync.sync) {
            window.firebaseSync.sync();
        }
    } catch (e) { console.error("Error saving topics:", e); }
};

// Initialize once
getCustomCurriculum();

export const EXAM_INFO = {
    TYT: {
        title: "Temel Yeterlilik Testi",
        desc: "Üniversiteye girişin ilk basamağıdır. Mantıksal düşünme, akıl yürütme ve temel bilgileri kullanma becerilerini ölçer.",
        duration: "165 Dakika",
        questionCount: "120",
        distribution: "40 Türkçe, 40 Matematik, 20 Sosyal, 20 Fen",
        updates: [{ year: 2024, text: "Süre 165 dakikaya sabitlendi." }]
    },
    AYT: {
        title: "Alan Yeterlilik Testi",
        desc: "Lisans programlarına yerleşmek için gereken ikinci basamak sınavıdır. Bilgi ağırlıklıdır.",
        duration: "180 Dakika",
        questionCount: "160",
        distribution: "40 Mat, 40 Fen, 40 Ed-Sos1, 40 Sos2",
        updates: []
    },
    LGS: {
        title: "Liselere Geçiş Sistemi",
        desc: "8. sınıf sonunda nitelikli liselere yerleşmek için yapılır.",
        duration: "155 Dakika",
        questionCount: "90",
        distribution: "Sözel 50dk, Sayısal 80dk",
        updates: []
    },
    YDT: {
        title: "Yabancı Dil Testi",
        desc: "Dil puanı ile öğrenci alan bölümler için girilmesi gereken sınavdır.",
        duration: "120 Dakika",
        questionCount: "80",
        distribution: "80 Yabancı Dil Sorusu",
        updates: []
    },
    KPSS: {
        title: "Kamu Personeli Seçme Sınavı",
        desc: "Kamu kurumlarında görev almak isteyen adaylar için kapsamlı bir sınavdır. GY-GK, Eğitim Bilimleri ve branşa özel ÖABT oturumlarını kapsar.",
        duration: "130 Dakika (Genel), 100 Dakika (Eğitim), 75 Dakika (ÖABT)",
        questionCount: "120 (GY-GK), 80 (Eğitim), 75 (ÖABT)",
        distribution: "60 Genel Yetenek, 60 Genel Kültür, 80 Eğitim Bilimleri, 75 Alan Bilgisi",
        updates: [
            { year: 2025, text: "Güncel KPSS ve Eğitim Bilimleri müfredatı eklendi." },
            { year: 2025, text: "Branş bazlı ÖABT konuları (Türkçe, Sınıf, PDR, Fen, Mat vb.) sisteme entegre edildi." }
        ]
    },
    AGS: {
        title: "Akademi Giriş Sınavı",
        desc: "Milli Eğitim Akademisi hazırlık eğitimi için uygulanan sınavdır. Genel yetenek, genel kültür, eğitim bilimleri ve mevzuat bilgilerini ölçer.",
        duration: "100 Dakika",
        questionCount: "80",
        distribution: "15 Sözel, 15 Sayısal, 10 Tarih, 8 Coğrafya, 24 Eğitim, 8 Mevzuat",
        updates: [
            { year: 2025, text: "AGS (Akademi Giriş Sınavı) tüm detaylarıyla sisteme entegre edildi." },
            { year: 2025, text: "Mevzuat (7528 s.k, 1739 s.k vb.) ve Eğitimin Temelleri konuları güncellendi." }
        ]
    }
};

export const generateStudyPlan = (examType, selectedTopics, customRules = {}, closedSlots = {}) => {
    const days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
    const plan = {};
    const timeSlots = ['08:00', '10:00', '13:00', '15:00', '17:00', '19:00']; // 6 etüt saati

    days.forEach(day => {
        plan[day] = [];
        const closedIndices = closedSlots[day] || []; // Kapalı etütlerin index'leri

        timeSlots.forEach((time, i) => {
            // Eğer bu etüt kapalıysa atla
            if (closedIndices.includes(i)) {
                return; // Bu slaytı atlıyoruz - kapalı
            }

            // Açık etüt - ders ata
            if (selectedTopics && selectedTopics.length > 0) {
                const randomTopic = selectedTopics[Math.floor(Math.random() * selectedTopics.length)];
                let slotType = 'Konu Çalışması';

                // İlk etüt kuralı (sadece açık etütler için)
                if (plan[day].length === 0 && customRules.firstSlotRule) {
                    slotType = customRules.firstSlotRule;
                }
                // Son etüt kuralı - açık etütlerin sonuncusu için
                else if (customRules.lastSlotRule) {
                    // Bu günün kalan açık etüt sayısını kontrol et
                    const remainingOpenSlots = timeSlots.length - i - 1 - closedIndices.filter(idx => idx > i).length;
                    if (remainingOpenSlots === 0) {
                        slotType = customRules.lastSlotRule;
                    }
                }
                else if (customRules.generalPattern === 'first-review-last-questions') {
                    if (plan[day].length === 0) slotType = 'Tekrar';
                    else slotType = 'Konu Çalışması';
                } else if (customRules.generalPattern === 'alternate') {
                    slotType = plan[day].length % 2 === 0 ? 'Konu Çalışması' : 'Soru Çözümü';
                } else {
                    slotType = Math.random() > 0.7 ? 'Soru Çözümü' : 'Konu Çalışması';
                }

                plan[day].push({
                    time,
                    lesson: randomTopic.lesson,
                    topic: randomTopic.topic,
                    type: slotType,
                    exam: examType
                });
            } else {
                plan[day].push({
                    time,
                    lesson: "Genel Tekrar",
                    topic: "Ders Çalışma Saati",
                    type: "Tekrar"
                });
            }
        });
    });
    return plan;
};
