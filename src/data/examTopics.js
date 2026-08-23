/**
 * 📚 SINAV KONU KATALOĞU
 *
 * Dört sınavın güncel müfredatı; her konu için sınavdaki AĞIRLIĞI ve
 * ZORLUK derecesi ile birlikte. Bu iki değerden konu başına gerçekçi
 * bir alt sınır soru hedefi hesaplanır.
 *
 * Konu kaydı:  k('Türev', 4, 3)
 *                ad      a  z
 *   a = ağırlık  → sınavda bu konudan tipik olarak kaç soru gelir
 *                  (ondalıklı olabilir: 0.5 = iki yılda bir soru)
 *   z = zorluk   → 1 kolay · 2 orta · 3 zor
 *
 * HEDEF SORU: bkz. `hedefSoruHesapla` — ağırlık ve zorluktan, bir
 * öğretim yılı boyunca konu başına çözülmesi beklenen gerçek sayı.
 *
 * ⚠️ DOĞRULAMA NOTU
 * Ağırlıklar ÖSYM/MEB'in yayımladığı test dağılımları ve son yılların
 * çıkmış soru analizlerine göre konmuştur; ÖSYM alt konu bazında resmî
 * sayı yayımlamaz, bu yüzden değerler TAHMİNDİR ve yıldan yıla ±1 soru
 * oynayabilir. Sınav öncesi güncel kılavuzla karşılaştırın.
 *
 * Test toplamları (2026):
 *   TYT 120 soru — Türkçe 40 · Matematik 40 · Sosyal 20 · Fen 20
 *   AYT — öğrenci ALANINA göre 80 soru çözer:
 *     Sayısal      → Matematik 40 + Fen 40
 *     Eşit Ağırlık → Matematik 40 + Edebiyat-Sosyal-1 40
 *     Sözel        → Edebiyat-Sosyal-1 40 + Sosyal-2 40
 *     Dil          → YDT 80 (İngilizce)
 *   LGS  90 soru — Sözel 50 (Türkçe 20 · İnkılap 10 · Din 10 · İngilizce 10)
 *                  Sayısal 40 (Matematik 20 · Fen 20)
 *   KPSS         — Genel Yetenek 60 · Genel Kültür 60 · Eğitim Bilimleri 80
 *   AGS  80 soru — Eğitim Bilimleri 30 · Türkçe 15 · Matematik 15 ·
 *                  Tarih 6 · Coğrafya 6 · Mevzuat 8
 */

import { sinifBolumu, MUFREDAT_SINIFLARI } from './ortaokulMufredat';

/** Konu kaydı kısaltması. */
const k = (ad, a = 1, z = 2) => ({ ad, a, z });

/**
 * İki ders havuzunu birleştirir.
 *
 * Nesne yayma (`{...a, ...b}`) KULLANILAMAZ: AYT Sözel'de hem Tarih-1
 * hem Tarih-2 var ve ikisi de `tarih` anahtarını taşıyor; yayma ikincisini
 * birincinin ÜZERİNE yazar, öğrenci 9-10. sınıf tarih konularını hiç
 * göremezdi. Burada aynı derse düşen konular birleştirilir, aynı adlı
 * konu iki kez listelenmez.
 */
const birlestir = (...havuzlar) => {
    const cikti = {};
    havuzlar.forEach((h) => {
        Object.entries(h || {}).forEach(([ders, konular]) => {
            if (!cikti[ders]) { cikti[ders] = [...konular]; return; }
            const varOlan = new Set(cikti[ders].map((t) => t.ad));
            konular.forEach((t) => { if (!varOlan.has(t.ad)) cikti[ders].push(t); });
        });
    });
    return cikti;
};

/**
 * Bir ders havuzunu KOPYALAYIP ağırlıklarını verilen soru sayısına ölçekler.
 *
 * NEDEN GEREKLİ
 * `a` alanı "bu konudan sınavda tipik olarak kaç soru gelir" demek.
 * Aynı ders havuzu iki farklı sınavda kullanılabiliyor: Eğitim Bilimleri
 * hem KPSS'de (80 soru) hem AGS'de (30 soru) var. Tek havuz iki sınava
 * birden bağlanınca ağırlıklar yalnızca birinde doğru oluyordu — AGS
 * öğrencisi 30 soruluk bir bölüm için 80 soruluk ağırlıklarla hedef
 * alıyordu (ölçülen sapma: 1,53 kat fazla).
 *
 * Burada UYDURMA yapılmaz: konular arasındaki ORAN havuzun kendi
 * kaynağından gelir, MUTLAK ölçek ise sınavın resmî soru sayısından.
 * İkisi de dışarıdan gelir, ara değer türetilir.
 *
 * Havuz derin kopyalanır; iki sınav aynı konu nesnesini paylaşmaz.
 *
 * @param {object} havuz        {ders: [{ad,a,z}]}
 * @param {number} hedefToplam  bölümün resmî soru sayısı
 */
const olcekle = (havuz, hedefToplam) => {
    const mevcut = Object.values(havuz)
        .reduce((t, konular) => t + konular.reduce((s, x) => s + x.a, 0), 0);
    if (!mevcut || !hedefToplam) return havuz;

    const kat = hedefToplam / mevcut;
    const cikti = {};
    Object.entries(havuz).forEach(([ders, konular]) => {
        cikti[ders] = konular.map((t) => ({
            ...t,
            // Çeyrek soru hassasiyeti yeter; daha incesi sahte kesinlik olur
            a: Math.round(t.a * kat * 4) / 4,
        }));
    });
    return cikti;
};

/**
 * Ağırlık ve zorluktan alt sınır soru hedefi.
 *
 * İlk sürümde formül (10 + a×6) × (0,8 + z×0,25) idi; TYT Paragraf için
 * 100, kolay bir konu için 15 soru veriyordu. Bir sınav öğrencisi için
 * bu sayılar gerçekçi değil — ciddi bir aday yıl boyunca yalnızca
 * paragraftan 800–1500 soru çözer. Ölçek, bir öğretim yılı boyunca
 * konu başına çözülmesi BEKLENEN gerçek sayıya çekildi:
 *
 *   a=12 (TYT Paragraf), z=2 → 445
 *   a=5  (AYT Türev),    z=3 → 240
 *   a=2  (orta konu),    z=2 → 100
 *   a=1  (kolay konu),   z=1 → 50
 *
 * Bu bir ÜST sınır değil, "bu kadarını çözmeden konuyu bitmiş sayma"
 * alt eşiğidir. Ayarlar'daki çarpan ile toptan ölçeklenebilir.
 */
export const hedefSoruHesapla = (agirlik = 1, zorluk = 2) => {
    const ham = (25 + agirlik * 32) * (0.65 + zorluk * 0.22);
    const besinKati = Math.round(ham / 5) * 5;
    return Math.min(500, Math.max(30, besinKati));
};

export const ZORLUK_ADI = { 1: 'Kolay', 2: 'Orta', 3: 'Zor' };

// ══════════════════════════════════════════════════════════════
//  TYT — 120 soru
// ══════════════════════════════════════════════════════════════

const TYT = {
    turkce: [
        k('Sözcükte Anlam', 3, 1), k('Cümlede Anlam', 3, 2), k('Paragrafta Anlam', 12, 2),
        k('Paragrafta Anlatım Teknikleri', 3, 2), k('Paragrafta Yapı ve Akış', 3, 2),
        k('Söz Sanatları', 1, 2), k('Ses Bilgisi', 1, 1), k('Yazım Kuralları', 2, 1),
        k('Noktalama İşaretleri', 2, 1), k('Sözcükte Yapı', 1.5, 2),
        k('İsimler ve Sıfatlar', 1, 2), k('Zamirler ve Zarflar', 1, 2),
        k('Edat, Bağlaç, Ünlem', 1, 1), k('Fiiller ve Fiilde Çatı', 1.5, 3),
        k('Fiilimsiler', 1.5, 3), k('Cümlenin Ögeleri', 2, 2),
        k('Cümle Türleri', 1, 2), k('Anlatım Bozuklukları', 2, 2),
    ],
    matematik: [
        k('Temel Kavramlar', 2, 1), k('Sayı Basamakları', 1.5, 2),
        k('Bölme ve Bölünebilme', 2, 2), k('EBOB-EKOK', 1.5, 2),
        k('Rasyonel Sayılar', 1.5, 1), k('Basit Eşitsizlikler', 2, 2),
        k('Mutlak Değer', 1.5, 2), k('Üslü Sayılar', 2, 2), k('Köklü Sayılar', 2, 2),
        k('Çarpanlara Ayırma', 2, 2), k('Oran-Orantı', 2, 1),
        k('Denklem Çözme', 2, 2), k('Problemler: Sayı-Kesir', 3, 2),
        k('Problemler: Yaş', 1, 1), k('Problemler: İşçi-Havuz', 1.5, 2),
        k('Problemler: Hareket-Hız', 2, 3), k('Problemler: Yüzde-Kâr-Faiz', 2.5, 2),
        k('Problemler: Karışım', 1.5, 3), k('Problemler: Grafik ve Rutin Olmayan', 3, 3),
        k('Kümeler', 1.5, 2), k('Mantık', 1.5, 2), k('Fonksiyonlar', 1, 3),
        k('Polinomlar', 1, 3), k('Permütasyon-Kombinasyon', 1.5, 3),
        k('Olasılık', 1.5, 3), k('Veri ve İstatistik', 1.5, 1),
    ],
    geometri: [
        k('Açılar', 1.5, 1), k('Üçgende Açı ve Kenar', 2, 2),
        k('Üçgende Alan ve Benzerlik', 2, 3), k('Özel Üçgenler', 1.5, 2),
        k('Dörtgenler ve Çokgenler', 2, 2), k('Çember ve Daire', 1.5, 3),
        k('Analitik Geometri', 1, 3), k('Katı Cisimler', 2, 2),
    ],
    fizik: [
        k('Fizik Bilimine Giriş', 0.5, 1), k('Madde ve Özellikleri', 1, 1),
        k('Hareket ve Kuvvet', 1.5, 2), k('İş, Güç ve Enerji', 1, 2),
        k('Isı ve Sıcaklık', 1, 2), k('Basınç ve Kaldırma Kuvveti', 1, 2),
        k('Elektrostatik', 0.5, 2), k('Elektrik Akımı ve Devreler', 1, 2),
        k('Mıknatıs ve Manyetik Alan', 0.5, 1), k('Dalgalar', 1, 2), k('Optik', 1, 2),
    ],
    kimya: [
        k('Kimya Bilimi', 0.5, 1), k('Atom ve Periyodik Sistem', 1, 2),
        k('Kimyasal Türler Arası Etkileşimler', 1, 2), k('Maddenin Hâlleri', 0.5, 1),
        k('Kimyanın Temel Kanunları', 1, 2), k('Mol ve Kimyasal Hesaplamalar', 1.5, 3),
        k('Karışımlar', 1, 2), k('Asitler, Bazlar ve Tuzlar', 1, 2),
        k('Kimya Her Yerde', 0.5, 1),
    ],
    biyoloji: [
        k('Canlıların Ortak Özellikleri', 0.5, 1), k('Canlıların Temel Bileşenleri', 1, 2),
        k('Hücre ve Organeller', 1, 2), k('Madde Geçişleri', 0.5, 2),
        k('Canlıların Sınıflandırılması', 0.5, 1), k('Mitoz ve Eşeysiz Üreme', 1, 2),
        k('Mayoz ve Eşeyli Üreme', 1, 2), k('Kalıtım', 1.5, 3),
        k('Ekosistem Ekolojisi', 0.5, 1),
    ],
    tarih: [
        k('Tarih ve Zaman', 0.5, 1), k('İnsanlığın İlk Dönemleri', 0.5, 1),
        k('İlk ve Orta Çağlarda Türk Dünyası', 0.5, 2),
        k('İslam Medeniyetinin Doğuşu', 0.5, 2), k('Türklerin İslamiyet’i Kabulü', 0.5, 2),
        k('Beylikten Devlete Osmanlı', 0.5, 2), k('Dünya Gücü Osmanlı', 0.5, 2),
        k('Değişim Çağında Avrupa ve Osmanlı', 0.5, 2),
        k('XX. Yüzyıl Başlarında Osmanlı', 0.5, 2),
        k('Millî Mücadele', 1, 2), k('Atatürkçülük ve Türk İnkılabı', 1, 2),
    ],
    cografya: [
        k('Doğa ve İnsan', 0.5, 1), k('Dünya’nın Şekli ve Hareketleri', 0.5, 2),
        k('Coğrafi Konum', 0.5, 2), k('Harita Bilgisi', 0.5, 2),
        k('İklim Bilgisi', 1, 2), k('İç ve Dış Kuvvetler', 1, 2),
        k('Su, Toprak ve Bitkiler', 0.5, 1), k('Nüfus ve Göç', 0.5, 1),
        k('Yerleşme', 0.5, 1), k('Ekonomik Faaliyetler', 0.5, 2),
        k('Bölgeler ve Ülkeler', 0.5, 2), k('Doğal Afetler', 0.5, 1),
    ],
    felsefe: [
        k('Felsefeyi Tanıma', 1, 1), k('Bilgi Felsefesi', 1, 2),
        k('Varlık Felsefesi', 0.5, 2), k('Ahlak Felsefesi', 0.5, 2),
        k('Sanat Felsefesi', 0.5, 1), k('Din Felsefesi', 0.5, 2),
        k('Siyaset Felsefesi', 0.5, 2), k('Bilim Felsefesi', 0.5, 2),
        k('Felsefe Tarihi', 1, 3),
    ],
    din: [
        k('Bilgi ve İnanç', 1, 1), k('İslam ve İbadet', 1, 1),
        k('Ahlak ve Değerler', 1, 1), k('Din, Kültür ve Medeniyet', 1, 2),
        k('Hz. Muhammed’in Hayatı', 1, 1),
    ],
};

// ══════════════════════════════════════════════════════════════
//  AYT — ORTAK DERS HAVUZLARI
//
//  AYT tek bir test değil, dört ALANIN farklı testleri seçmesidir:
//    Sayısal        → Matematik 40 + Fen 40
//    Eşit Ağırlık   → Matematik 40 + Edebiyat-Sosyal-1 40
//    Sözel          → Edebiyat-Sosyal-1 40 + Sosyal-2 40
//    Dil            → YDT 80
//  Aşağıdaki havuzlar alanlara göre birleştirilir; aynı ders iki
//  alanda da geçtiğinde konu listesi TEK yerden gelir, kopyalanmaz.
// ══════════════════════════════════════════════════════════════

const AYT_MAT = {
    matematik: [
        k('Fonksiyonlar', 2, 3), k('Polinomlar', 2, 3),
        k('2. Dereceden Denklemler', 2, 3), k('Eşitsizlikler', 2, 3),
        k('Parabol', 2, 3), k('Trigonometri', 4, 3), k('Logaritma', 3, 3),
        k('Diziler', 2, 3), k('Limit ve Süreklilik', 3, 3),
        k('Türev', 5, 3), k('İntegral', 4, 3),
        k('Permütasyon-Kombinasyon-Olasılık', 2, 3), k('Karmaşık Sayılar', 1.5, 3),
    ],
    geometri: [
        k('Üçgende Alan ve Benzerlik', 1.5, 3), k('Dörtgenler ve Çokgenler', 1.5, 3),
        k('Çember ve Daire', 2, 3), k('Analitik Geometri: Doğru', 2, 3),
        k('Analitik Geometri: Çember', 1.5, 3), k('Katı Cisimler', 1.5, 2),
        k('Uzay Geometri', 1, 3),
    ],
};

const AYT_FEN = {
    fizik: [
        k('Vektörler', 0.5, 2), k('Bağıl Hareket', 0.5, 3),
        k('Newton’un Hareket Yasaları', 1, 3), k('Bir Boyutta Sabit İvmeli Hareket', 1, 3),
        k('İki Boyutta Hareket', 1, 3), k('Enerji ve Hareket', 1, 2),
        k('İtme ve Momentum', 1, 3), k('Tork ve Denge', 1, 2),
        k('Kütle Merkezi ve Basit Makineler', 0.5, 2),
        k('Elektriksel Kuvvet ve Alan', 1, 3), k('Elektriksel Potansiyel ve Sığa', 1, 3),
        k('Manyetizma ve İndüklenme', 1, 3), k('Alternatif Akım ve Transformatörler', 0.5, 3),
        k('Çembersel Hareket', 1, 3), k('Dönerek Öteleme ve Açısal Momentum', 0.5, 3),
        k('Kütle Çekim ve Kepler Kanunları', 0.5, 2), k('Basit Harmonik Hareket', 0.5, 3),
        k('Dalga Mekaniği', 1, 3), k('Atom Fiziği ve Radyoaktivite', 1, 2),
        k('Modern Fizik', 1, 3),
    ],
    kimya: [
        k('Modern Atom Teorisi', 1.5, 3), k('Gazlar', 1.5, 3),
        k('Sıvı Çözeltiler ve Çözünürlük', 1.5, 3),
        k('Kimyasal Tepkimelerde Enerji', 1, 3), k('Kimyasal Tepkimelerde Hız', 1, 3),
        k('Kimyasal Tepkimelerde Denge', 1.5, 3), k('Asit-Baz Dengesi', 1.5, 3),
        k('Çözünürlük Dengesi', 1, 3), k('Kimya ve Elektrik', 1.5, 3),
        k('Karbon Kimyasına Giriş', 1, 2), k('Organik Bileşikler', 2, 3),
        k('Enerji Kaynakları ve Bilimsel Gelişmeler', 0.5, 1),
    ],
    biyoloji: [
        k('Sinir Sistemi', 1, 2), k('Endokrin Sistem', 1, 2),
        k('Duyu Organları', 0.5, 1), k('Destek ve Hareket Sistemi', 1, 2),
        k('Sindirim Sistemi', 1, 2), k('Dolaşım ve Bağışıklık Sistemi', 1, 2),
        k('Solunum Sistemi', 1, 2), k('Üriner Sistem', 1, 2),
        k('Üreme Sistemi ve Embriyonik Gelişim', 1, 2),
        k('Komünite ve Popülasyon Ekolojisi', 1, 2),
        k('Genden Proteine', 1.5, 3), k('Canlılarda Enerji Dönüşümleri', 1.5, 3),
        k('Bitki Biyolojisi', 1.5, 3), k('Canlılar ve Çevre', 0.5, 1),
    ],
};

const AYT_ES1 = {
    edebiyat: [
        k('Güzel Sanatlar ve Edebiyat', 1, 1), k('Şiir Bilgisi ve Ölçü', 2, 2),
        k('Söz Sanatları', 2, 2), k('Edebî Akımlar', 1.5, 2),
        k('İslamiyet Öncesi Türk Edebiyatı', 1.5, 2),
        k('Geçiş Dönemi ve Halk Edebiyatı', 2, 2), k('Divan Edebiyatı', 3, 3),
        k('Tanzimat Edebiyatı', 2, 2), k('Servet-i Fünûn ve Fecr-i Âti', 2, 2),
        k('Millî Edebiyat', 2, 2), k('Cumhuriyet Dönemi Şiiri', 2.5, 3),
        k('Cumhuriyet Dönemi Roman ve Hikâye', 2.5, 3),
        k('Dünya Edebiyatı', 1, 2),
    ],
    // Tarih-1 (10 soru) — 9-10. sınıf müfredatı
    tarih: [
        k('Tarih ve Zaman', 0.5, 1), k('İnsanlığın İlk Dönemleri', 0.5, 1),
        k('Orta Çağ’da Dünya', 0.5, 2), k('İlk Türk Devletleri', 1.5, 2),
        k('İslam Medeniyetinin Doğuşu', 1, 2), k('İlk Türk-İslam Devletleri', 1.5, 2),
        k('Türkiye Selçuklu Devleti', 1.5, 2),
        k('Beylikten Devlete Osmanlı', 1.5, 2), k('Dünya Gücü Osmanlı', 1.5, 2),
        k('Osmanlı Kültür ve Medeniyeti', 1, 2),
    ],
    // Coğrafya-1 (6 soru) — doğal ve beşerî sistemler
    cografya: [
        k('Doğa ve İnsan', 0.5, 1), k('Dünya’nın Şekli ve Hareketleri', 0.5, 2),
        k('Harita Bilgisi ve Coğrafi Konum', 0.5, 2), k('İklim Bilgisi', 1, 2),
        k('İç ve Dış Kuvvetler', 1, 2), k('Su, Toprak ve Bitkiler', 0.5, 2),
        k('Ekosistem ve Biyoçeşitlilik', 0.5, 2), k('Nüfus ve Yerleşme', 0.5, 1),
        k('Ekonomik Faaliyetler', 1, 2),
    ],
};

/** AYT Sosyal-2 (40 soru) — Tarih-2 11 · Coğrafya-2 11 · Felsefe 12 · Din 6 */
const AYT_S2 = {
    tarih: [
        k('XX. Yüzyıl Başlarında Osmanlı', 1.5, 2),
        k('I. Dünya Savaşı ve Millî Mücadele', 2.5, 2),
        k('Atatürk İlke ve İnkılapları', 2.5, 2),
        k('Atatürk Dönemi Dış Politika', 1.5, 2),
        k('II. Dünya Savaşı ve Soğuk Savaş', 1.5, 2),
        k('Küreselleşen Dünya', 1, 2),
        k('Çağdaş Türkiye Yolunda Adımlar', 0.5, 2),
    ],
    cografya: [
        k('Türkiye’nin Yer Şekilleri', 1.5, 2),
        k('Türkiye’nin İklimi ve Su Varlığı', 1.5, 2),
        k('Türkiye’de Nüfus ve Yerleşme', 1, 1),
        k('Türkiye’de Tarım ve Hayvancılık', 1.5, 2),
        k('Türkiye’de Madenler, Enerji ve Sanayi', 1.5, 2),
        k('Türkiye’de Ulaşım, Ticaret ve Turizm', 1.5, 2),
        k('Şehirleşme ve Fonksiyonları', 1, 2),
        k('Küresel Ortam: Bölgeler ve Ülkeler', 1.5, 2),
        k('Çevre ve Toplum', 1, 2),
        k('Doğal Afetler ve Risk Yönetimi', 1, 2),
    ],
    felsefe: [
        k('Felsefenin Konusu ve Alanları', 1, 2), k('Bilgi Felsefesi', 1, 2),
        k('Varlık Felsefesi', 1, 2), k('Ahlak Felsefesi', 1, 2),
        k('Siyaset Felsefesi', 1, 2), k('Sanat ve Din Felsefesi', 1, 2),
        k('Bilim Felsefesi', 1, 2), k('MÖ 6 – MS 2. Yüzyıl Felsefesi', 1, 3),
        k('MS 2 – 15. Yüzyıl Felsefesi', 1, 3),
        k('15 – 17. Yüzyıl Felsefesi', 1, 3), k('18 – 19. Yüzyıl Felsefesi', 1, 3),
        k('20. Yüzyıl Felsefesi', 1, 3),
        k('Psikoloji', 2.5, 2), k('Sosyoloji', 2.5, 2), k('Mantık', 2.5, 3),
    ],
    din: [
        k('İnanç', 1, 2), k('İbadet', 1, 1), k('Ahlak ve Değerler', 1, 1),
        k('Din, Kültür ve Medeniyet', 1.5, 2), k('Hz. Muhammed ve Sünnet', 1, 1),
        k('Vahiy ve Akıl', 0.5, 2),
    ],
};

// ══════════════════════════════════════════════════════════════
//  YDT — İngilizce, 80 soru
// ══════════════════════════════════════════════════════════════

const YDT = {
    kelime: [
        k('Temel Kelime Bilgisi (1000 sık sözcük)', 2, 2),
        k('Akademik Kelime Listesi', 2, 3),
        k('Phrasal Verbs', 1.5, 3),
        k('Collocations ve Eş Anlamlılar', 1.5, 3),
        k('Bağlaçlar ve Geçiş İfadeleri', 2, 2),
        k('Edatlar (Prepositions)', 2, 2),
    ],
    dilbilgisi: [
        k('Tenses (Zamanlar)', 2, 2), k('Modals', 1.5, 2),
        k('Passive Voice', 1, 2), k('Conditionals (If Clauses)', 1.5, 3),
        k('Noun Clauses', 1, 3), k('Adjective (Relative) Clauses', 1.5, 3),
        k('Adverbial Clauses', 1.5, 3), k('Gerunds ve Infinitives', 1, 3),
        k('Causatives', 0.5, 2), k('Inversion ve Vurgu Yapıları', 0.5, 3),
    ],
    okuma: [
        k('Paragraf: Ana Fikir ve Detay', 6, 2),
        k('Paragraf: Çıkarım ve Yorum', 5, 3),
        k('Paragraf: Kelime Tahmini', 2, 2),
        k('Paragraf: Yazarın Tutumu ve Amacı', 2, 3),
        k('Cloze Test', 5, 3),
        k('Paragraf Tamamlama', 5, 3),
        k('Anlam Bütünlüğünü Bozan Cümle', 5, 3),
    ],
    ceviri: [
        k('İngilizce → Türkçe Çeviri', 6, 2),
        k('Türkçe → İngilizce Çeviri', 6, 3),
        k('Anlamca En Yakın Cümle (Restatement)', 5, 3),
    ],
    iletisim: [
        k('Cümle Tamamlama', 8, 3),
        k('Diyalog Tamamlama', 5, 2),
        k('Duruma Uygun İfade', 5, 2),
    ],
};

// ══════════════════════════════════════════════════════════════
//  LGS — 90 soru
// ══════════════════════════════════════════════════════════════

const LGS_SOZEL = {
    turkce: [
        k('Sözcükte Anlam', 2, 1), k('Cümlede Anlam', 2, 2),
        k('Paragrafta Anlam', 5, 2), k('Söz Sanatları', 1, 2),
        k('Deyim ve Atasözleri', 1, 1), k('Cümlenin Ögeleri', 2, 2),
        k('Fiilimsiler', 2, 3), k('Cümle Türleri', 1.5, 2),
        k('Anlatım Bozuklukları', 1.5, 2), k('Yazım Kuralları', 1, 1),
        k('Noktalama İşaretleri', 1, 1), k('Metin Türleri', 1, 1),
        k('Görsel ve Grafik Yorumlama', 1, 2),
    ],
    inkilap: [
        k('Bir Kahraman Doğuyor', 1.5, 1),
        k('Millî Uyanış: Bağımsızlık Yolunda Atılan Adımlar', 2, 2),
        k('Millî Bir Destan: Ya İstiklal Ya Ölüm', 2, 2),
        k('Atatürkçülük ve Çağdaşlaşan Türkiye', 2, 2),
        k('Demokratikleşme Çabaları', 1, 2),
        k('Atatürk Dönemi Türk Dış Politikası', 1, 2),
        k('Atatürk’ün Ölümü ve Sonrası', 0.5, 1),
    ],
    din: [
        k('Kader ve Kaza İnancı', 2.5, 2), k('Zekât ve Sadaka', 2, 1),
        k('Din ve Hayat', 2, 1), k('Hz. Muhammed’in Örnekliği', 2, 1),
        k('Kur’an-ı Kerim ve Özellikleri', 1.5, 2),
    ],
    ingilizce: [
        k('Friendship', 1, 1), k('Teen Life', 1, 1), k('In the Kitchen', 1, 1),
        k('On the Phone', 1, 1), k('The Internet', 1, 1), k('Adventures', 1, 2),
        k('Tourism', 1, 2), k('Chores', 1, 1), k('Science', 1, 2),
        k('Natural Forces', 1, 2),
    ],
};

const LGS_SAYISAL = {
    matematik: [
        k('Çarpanlar ve Katlar', 2, 2), k('Üslü İfadeler', 2, 2),
        k('Kareköklü İfadeler', 2, 2), k('Veri Analizi', 1.5, 1),
        k('Basit Olayların Olma Olasılığı', 1.5, 2),
        k('Cebirsel İfadeler ve Özdeşlikler', 2, 3),
        k('Doğrusal Denklemler', 2.5, 3), k('Eşitsizlikler', 1.5, 2),
        k('Üçgenler', 2, 3), k('Eşlik ve Benzerlik', 1.5, 2),
        k('Dönüşüm Geometrisi', 1, 2), k('Geometrik Cisimler', 1.5, 2),
    ],
    fen: [
        k('Mevsimler ve İklim', 2.5, 2), k('DNA ve Genetik Kod', 3, 3),
        k('Basınç', 3, 2), k('Madde ve Endüstri', 3.5, 2),
        k('Basit Makineler', 2.5, 2),
        k('Enerji Dönüşümleri ve Çevre Bilimi', 2.5, 2),
        k('Elektrik Yükleri ve Elektrik Enerjisi', 3, 2),
    ],
};

// ══════════════════════════════════════════════════════════════
//  KPSS ALAN BİLGİSİ — A Grubu, 9 test × 40 soru
//
//  KAYNAK: 2026 KPSS Lisans Kılavuzu, TABLO-1 "KPSS'DE UYGULANACAK
//  TESTLERİN KAPSAMLARI" (s. 34-35).
//  dokuman.osym.gov.tr/pdfdokuman/2026/KPSS/LISANS/kilavuz_Ld01072026.pdf
//
//  Ağırlıklar ÖSYM'nin yayımladığı YÜZDELERDEN türetildi:
//      a = yüzde × 40 / 100
//  Her testin ağırlık toplamı tam 40'a oturur. Ara değer uydurulmadı.
//
//  ⚠️ ZORLUK (`z`) RESMÎ DEĞİLDİR — ÖSYM hiçbir testte zorluk
//  derecesi yayımlamaz. Buradaki değerler pedagojik değerlendirmedir.
//
//  ⚠️ ÖSYM yalnızca 1. seviye başlıkları verir. Alt kırılım isteyen
//  yerlerde (özellikle Muhasebe → Genel Muhasebe, tek başına 28 soru)
//  daha ince bölme ÖSYM dayanaklı OLMAZ; bu yüzden yapılmadı.
// ══════════════════════════════════════════════════════════════

const ALAN_BILGISI = {
    HUKUK: {
        hukuk: [
            k('Anayasa Hukuku', 4, 2),
            k('İdare Hukuku ve İdari Yargı', 6, 3),
            k('Ceza Hukuku (Genel Hükümler ve Ceza Muhakemesi Hukuku)', 6, 3),
            k('Medeni Hukuk', 6, 3),
            k('Borçlar Hukuku (Genel Hükümler)', 6, 3),
            k('Ticaret Hukuku', 6, 3),
            k('İcra ve İflas Hukuku', 6, 2),
        ],
    },
    IKTISAT: {
        iktisat: [
            k('İktisadi Doktrinler Tarihi', 2, 1),
            k('Mikro İktisat', 12, 3), k('Makro İktisat', 10, 3),
            k('Para-Banka-Kredi', 4, 2), k('Uluslararası İktisat', 4, 2),
            k('Kalkınma-Büyüme', 4, 2), k('Türkiye Ekonomisi', 4, 1),
        ],
    },
    ISLETME: {
        isletme: [
            k('Temel Kavramlar', 4, 1), k('İşletme Yönetimi', 10, 2),
            k('Üretim Yönetimi', 10, 3), k('Pazarlama Yönetimi', 8, 2),
            k('Finansal Yönetim', 8, 3),
        ],
    },
    MALIYE: {
        maliye: [
            k('Maliye Teorisi', 4, 2), k('Kamu Gelirleri', 6, 2),
            k('Kamu Giderleri', 6, 2), k('Kamu Borçları', 6, 2),
            k('Bütçe', 6, 2), k('Vergi Hukuku', 6, 3), k('Maliye Politikası', 6, 3),
        ],
    },
    MUHASEBE: {
        muhasebe: [
            // ÖSYM: Genel Muhasebe %70 → 28 soru. Alt başlık yayımlanmıyor.
            k('Genel Muhasebe', 28, 2),
            k('Mali Tablolar Analizi', 8, 2),
            k('İhtisas Muhasebesi (Maliyet, Yönetim, Denetim, TFRS/TMS)', 4, 3),
        ],
    },
    CEKO: {
        ceko: [
            // İş ve Sosyal Güvenlik Hukuku %55 → 22 soru (ÖSYM alt kırılımı verir)
            k('İş Hukuku ve Teorisi', 8, 3),
            k('Sosyal Güvenlik Hukuku ve Teorisi', 10, 3),
            k('Sosyal Politika', 4, 2),
            k('Çalışma Ekonomisi', 12, 3),
            k('Çalışma Psikolojisi ve Çalışma Sosyolojisi', 6, 1),
        ],
    },
    ISTATISTIK: {
        istatistik: [
            k('Olasılık ve Stokastik Süreçler', 6, 3), k('Matematiksel İstatistik', 6, 3),
            k('Yöneylem Araştırması', 2, 3), k('Çok Değişkenli Analizler', 4, 3),
            k('Parametrik Olmayan Testler', 2, 2), k('Uygulamalı İstatistik', 6, 2),
            k('Zaman Serileri', 2, 2), k('Deney Tasarımı ve Varyans Analizi', 4, 3),
            k('Örnekleme', 4, 2), k('Regresyon Analizi', 4, 2),
        ],
    },
    KAMU_YONETIMI: {
        kamuYonetimi: [
            k('Siyaset Bilimi', 8, 2), k('Anayasa', 6, 2), k('Yönetim Bilimleri', 8, 2),
            k('Yönetim Hukuku', 8, 3), k('Kentleşme ve Çevre Sorunları', 6, 1),
            k('Türk Siyasi Hayatı (Osmanlıdan Günümüze Siyasi Olaylar)', 4, 2),
        ],
    },
    ULUSLARARASI: {
        uluslararasiIliskiler: [
            k('Uluslararası İlişkiler Teorisi', 8, 3), k('Uluslararası Hukuk', 10, 3),
            k('Siyasi Tarih', 8, 2), k('Uluslararası Güncel Sorunlar', 4, 1),
            k('Uluslararası Örgütler', 4, 1), k('Türk Dış Politikası', 6, 2),
        ],
    },
};

/** Alan Bilgisi testlerinin görünen adları — bölüm kimliğine göre. */
const ALAN_BILGISI_ADLARI = {
    HUKUK: 'Hukuk', IKTISAT: 'İktisat', ISLETME: 'İşletme', MALIYE: 'Maliye',
    MUHASEBE: 'Muhasebe', CEKO: 'Çalışma Ekonomisi ve Endüstri İlişkileri',
    ISTATISTIK: 'İstatistik', KAMU_YONETIMI: 'Kamu Yönetimi',
    ULUSLARARASI: 'Uluslararası İlişkiler',
};

/** Her Alan Bilgisi testi 40 sorudur (2026 KPSS Lisans Kılavuzu s. 16). */
const ALAN_BILGISI_BOLUMLERI = Object.entries(ALAN_BILGISI).map(([id, dersler]) => ({
    id, ad: ALAN_BILGISI_ADLARI[id], soru: 40, alanBilgisi: true, dersler,
}));

// ══════════════════════════════════════════════════════════════
//  EĞİTİM BİLİMLERİ — KPSS ve AGS ortak
// ══════════════════════════════════════════════════════════════

const EGITIM_BILIMLERI = {
    gelisim: [
        k('Gelişimin Temel Kavramları ve İlkeleri', 1, 1),
        k('Bilişsel Gelişim (Piaget)', 2, 3),
        k('Bilişsel Gelişim (Vygotsky, Bruner)', 1, 2),
        k('Psikososyal Gelişim (Erikson)', 1.5, 2),
        k('Psikoseksüel Gelişim (Freud)', 1, 2),
        k('Ahlak Gelişimi (Piaget, Kohlberg)', 1.5, 3),
        k('Dil Gelişimi', 1, 2), k('Fiziksel ve Motor Gelişim', 0.5, 1),
        k('Benlik ve Kişilik Gelişimi', 0.5, 2),
    ],
    ogrenme: [
        k('Öğrenmenin Temel Kavramları', 0.5, 1),
        k('Klasik Koşullanma', 1.5, 3), k('Edimsel Koşullanma', 2, 3),
        k('Bitişiklik Kuramları', 1, 2), k('Sosyal Öğrenme Kuramı', 1, 2),
        k('Bilgi İşleme Kuramı', 1.5, 3), k('Gestalt ve Bilişsel Yaklaşım', 1, 2),
        k('Yapılandırmacı Öğrenme', 1, 2), k('Transfer ve Güdülenme', 1, 2),
    ],
    ogretim: [
        k('Program Geliştirmenin Temelleri', 1, 2),
        k('Hedef ve Davranış Yazma', 1.5, 3),
        k('İçerik Düzenleme Yaklaşımları', 1, 2),
        k('Öğretim Stratejileri', 1.5, 2), k('Öğretim Yöntem ve Teknikleri', 2, 2),
        k('Öğretim Modelleri', 1, 3),
        k('Materyal Tasarımı ve Öğretim Teknolojileri', 1, 1),
        k('Sınıf Yönetimi', 1.5, 2),
    ],
    olcme: [
        k('Ölçme ve Değerlendirmenin Temel Kavramları', 1, 2),
        k('Geçerlik', 1, 3), k('Güvenirlik', 1, 3), k('Kullanışlılık', 0.5, 1),
        k('Test Türleri ve Madde Yazma', 1, 2),
        k('Madde Analizi', 1, 3), k('Test İstatistikleri', 1.5, 3),
        k('Not Verme ve Alternatif Değerlendirme', 1, 2),
    ],
    rehberlik: [
        k('Rehberliğin Temel Kavram ve İlkeleri', 1, 1),
        k('Rehberlik Türleri ve Hizmet Alanları', 1, 2),
        k('Bireyi Tanıma Teknikleri', 1.5, 2),
        k('Psikolojik Danışma Kuramları', 1, 3),
        k('Mesleki Rehberlik ve Kariyer Kuramları', 1, 3),
        k('Özel Eğitim ve Kaynaştırma', 1, 2),
        k('Okul Rehberlik Programı ve Mevzuat', 0.5, 2),
    ],
};

// ══════════════════════════════════════════════════════════════
//  KPSS — Lisans
// ══════════════════════════════════════════════════════════════

const KPSS_GY = {
    turkce: [
        k('Sözcükte Anlam', 3, 1), k('Cümlede Anlam', 3, 2),
        k('Paragraf', 10, 2), k('Ses Bilgisi', 1, 1),
        k('Yazım Kuralları', 2, 1), k('Noktalama İşaretleri', 2, 1),
        k('Sözcükte Yapı', 1.5, 2), k('Sözcük Türleri', 2, 2),
        k('Cümlenin Ögeleri', 2, 2), k('Fiilimsiler', 1.5, 3),
        k('Fiilde Çatı', 1.5, 3), k('Cümle Türleri', 1.5, 2),
        k('Anlatım Bozuklukları', 3, 2), k('Sözel Mantık', 3, 3),
    ],
    matematik: [
        k('Temel Kavramlar', 2, 1), k('Sayı Basamakları', 1.5, 2),
        k('Bölme ve Bölünebilme', 2, 2), k('EBOB-EKOK', 1.5, 2),
        k('Rasyonel Sayılar', 1.5, 1), k('Basit Eşitsizlikler', 1.5, 2),
        k('Mutlak Değer', 1, 2), k('Üslü ve Köklü Sayılar', 2, 2),
        k('Çarpanlara Ayırma', 1.5, 2), k('Oran-Orantı', 2, 1),
        k('Denklem Çözme', 2, 2), k('Problemler: Sayı-Kesir', 2.5, 2),
        k('Problemler: Yaş', 1, 1), k('Problemler: İşçi-Havuz', 1.5, 2),
        k('Problemler: Hareket-Hız', 2, 3),
        k('Problemler: Yüzde-Kâr-Faiz', 2.5, 2),
        k('Problemler: Karışım', 1.5, 3), k('Problemler: Grafik', 2, 2),
        k('Kümeler', 1.5, 2), k('Fonksiyonlar', 1, 3),
        k('Permütasyon-Kombinasyon', 1.5, 3), k('Olasılık', 1.5, 3),
        k('İstatistik', 1.5, 1), k('Sayısal Mantık', 3, 3),
    ],
    geometri: [
        k('Açılar', 1, 1), k('Üçgenler', 2, 3), k('Dörtgenler', 1.5, 3),
        k('Çember ve Daire', 1, 3), k('Katı Cisimler', 1, 2),
        k('Analitik Geometri', 1.5, 3),
    ],
};

const KPSS_GK = {
    tarih: [
        k('İslamiyet Öncesi Türk Tarihi', 2, 2), k('İlk Türk-İslam Devletleri', 2, 2),
        k('Türkiye Selçuklu Devleti', 1.5, 2), k('Osmanlı Kuruluş ve Yükselme', 2, 2),
        k('Osmanlı Duraklama ve Gerileme', 2, 2),
        k('Osmanlı Kültür ve Medeniyeti', 1.5, 2),
        k('XX. Yüzyıl Başlarında Osmanlı', 1.5, 2),
        k('Kurtuluş Savaşı Hazırlık Dönemi', 2, 2),
        k('I. TBMM ve Cepheler', 2, 2), k('Lozan ve Sonrası', 1.5, 2),
        k('Atatürk İlke ve İnkılapları', 3, 2),
        k('Atatürk Dönemi Dış Politika', 1.5, 2),
        k('Çağdaş Türk ve Dünya Tarihi', 1.5, 2),
    ],
    cografya: [
        k('Türkiye’nin Coğrafi Konumu', 1.5, 1), k('Türkiye’nin Yer Şekilleri', 2.5, 2),
        k('Türkiye’nin İklimi', 2, 2), k('Toprak ve Bitki Örtüsü', 1.5, 2),
        k('Nüfus ve Yerleşme', 2, 1), k('Tarım ve Hayvancılık', 2, 2),
        k('Madenler ve Enerji', 2, 2), k('Sanayi', 1.5, 2),
        k('Ulaşım ve Ticaret', 1.5, 2), k('Turizm', 1.5, 1),
        k('Coğrafi Bölgeler', 2.5, 2),
    ],
    vatandaslik: [
        k('Hukukun Temel Kavramları', 1.5, 2),
        k('Devlet Biçimleri ve Hükümet Sistemleri', 1, 2),
        k('Anayasa Hukukuna Giriş', 1, 2), k('Türk Anayasa Tarihi', 1, 2),
        k('1982 Anayasası: Temel İlkeler', 1.5, 2),
        k('Temel Hak ve Hürriyetler', 1.5, 2),
        k('Yasama', 1.5, 3), k('Yürütme', 1.5, 3), k('Yargı', 1.5, 3),
        k('İdare Hukuku', 1, 3), k('Uluslararası Kuruluşlar', 1, 1),
    ],
    guncel: [
        k('Türkiye ve Dünyada Güncel Olaylar', 2, 1),
        k('Uluslararası Kuruluşlar ve Anlaşmalar', 1, 1),
        k('Bilim, Teknoloji ve Çevre Gündemi', 1, 1),
    ],
};

// ══════════════════════════════════════════════════════════════
//  AGS — 80 soru
// ══════════════════════════════════════════════════════════════

const AGS_MEVZUAT = {
    mevzuat: [
        k('1739 Sayılı Millî Eğitim Temel Kanunu', 1.5, 2),
        k('MEB Teşkilat ve Görevleri', 0.5, 2),
        k('657 Sayılı DMK: Genel Hükümler', 1, 2),
        k('657: Ödev, Sorumluluk ve Yasaklar', 1, 2),
        k('657: Disiplin Hükümleri', 1, 3),
        k('657: Atama, Yer Değiştirme, İzinler', 1, 3),
        k('Okul Öncesi ve İlköğretim Kurumları Yönetmeliği', 0.5, 2),
        k('Ortaöğretim Kurumları Yönetmeliği', 0.5, 2),
        k('Öğretmenlik Meslek Kanunu', 1, 2),
        k('Rehberlik ve Psikolojik Danışma Hizmetleri Yönetmeliği', 0.5, 2),
        k('Özel Eğitim Hizmetleri Yönetmeliği', 0.5, 2),
        k('Sosyal Etkinlikler Yönetmeliği', 0.5, 1),
        k('Etik Davranış İlkeleri', 0.5, 1),
    ],
};

const AGS_GENEL = {
    turkce: [
        k('Sözcükte ve Cümlede Anlam', 2, 2), k('Paragraf', 6, 2),
        k('Yazım Kuralları', 1, 1), k('Noktalama İşaretleri', 1, 1),
        k('Sözcük Türleri ve Yapısı', 1.5, 2), k('Cümlenin Ögeleri', 1, 2),
        k('Fiilimsiler ve Fiilde Çatı', 1, 3), k('Anlatım Bozuklukları', 1.5, 2),
    ],
    matematik: [
        k('Temel Kavramlar ve Sayılar', 2, 1), k('Bölme-Bölünebilme, EBOB-EKOK', 1.5, 2),
        k('Rasyonel, Üslü ve Köklü Sayılar', 2, 2), k('Oran-Orantı', 1.5, 1),
        k('Denklem ve Eşitsizlik', 1.5, 2), k('Problemler', 3, 2),
        k('Kümeler ve Fonksiyonlar', 1, 2),
        k('Permütasyon-Kombinasyon-Olasılık', 1, 3),
        k('Sayısal Mantık', 1.5, 3), k('Tablo-Grafik Yorumlama', 1.5, 2),
        k('Temel Geometri', 2, 2),
    ],
    tarih: [
        k('İslamiyet Öncesi Türk Tarihi', 1, 2), k('Türk-İslam Devletleri', 1, 2),
        k('Osmanlı Devleti', 1.5, 2),
        k('XX. Yüzyıl Başlarında Osmanlı ve Millî Mücadele', 1, 2),
        k('Atatürk İlke ve İnkılapları', 1.5, 2),
        k('Çağdaş Türk ve Dünya Tarihi', 0.5, 2),
    ],
    cografya: [
        k('Türkiye’nin Coğrafi Konumu', 1, 1), k('Yer Şekilleri ve İklim', 1.5, 2),
        k('Nüfus ve Yerleşme', 1, 1), k('Ekonomik Faaliyetler', 1, 2),
        k('Coğrafi Bölgeler', 1, 2), k('Çevre ve Doğal Afetler', 0.5, 1),
    ],
};

// ══════════════════════════════════════════════════════════════
//  SINAV TANIMLARI
// ══════════════════════════════════════════════════════════════

export const SINAVLAR = {
    YKS: {
        id: 'YKS',
        ad: 'YKS — Yükseköğretim Kurumları Sınavı',
        kisa: 'YKS',
        icon: '🎓',
        aciklama: 'TYT 120 soru + alanına göre AYT 80 soru (Sayısal / Eşit Ağırlık / Sözel / Dil)',
        kademe: 'lise',
        bolumler: [
            { id: 'TYT', ad: 'TYT', soru: 120, dersler: TYT },
            // AYT dört alan: her alan farklı test bileşimi çözer
            { id: 'AYT_SAY', ad: 'AYT Sayısal', soru: 80, dersler: birlestir(AYT_MAT, AYT_FEN) },
            { id: 'AYT_EA', ad: 'AYT Eşit Ağırlık', soru: 80, dersler: birlestir(AYT_MAT, AYT_ES1) },
            { id: 'AYT_SOZ', ad: 'AYT Sözel', soru: 80, dersler: birlestir(AYT_ES1, AYT_S2) },
            { id: 'YDT', ad: 'AYT Dil (YDT)', soru: 80, dersler: YDT },
        ],
    },

    LGS: {
        id: 'LGS',
        ad: 'LGS — Liselere Geçiş Sınavı',
        kisa: 'LGS',
        icon: '📗',
        aciklama: 'Sözel 50 · Sayısal 40 soru',
        kademe: 'ortaokul',
        bolumler: [
            { id: 'SOZEL', ad: 'Sözel Bölüm', soru: 50, dersler: LGS_SOZEL },
            { id: 'SAYISAL', ad: 'Sayısal Bölüm', soru: 40, dersler: LGS_SAYISAL },
        ],
    },

    KPSS: {
        id: 'KPSS',
        ad: 'KPSS — Kamu Personel Seçme Sınavı',
        kisa: 'KPSS',
        icon: '🏛️',
        aciklama: 'Genel Yetenek 60 · Genel Kültür 60 · Alan Bilgisi 9 test × 40 soru',
        kademe: 'lisans',
        bolumler: [
            { id: 'GY', ad: 'Genel Yetenek', soru: 60, dersler: KPSS_GY },
            { id: 'GK', ad: 'Genel Kültür', soru: 60, dersler: KPSS_GK },
            /**
             * ⚠️ 2026'da KPSS'te EĞİTİM BİLİMLERİ OTURUMU KALDIRILDI.
             * 2026 KPSS Lisans Kılavuzu'nun tam metninde "Eğitim Bilimleri"
             * hiç geçmiyor; sınav takvimi tablosunda böyle bir oturum yok.
             * İçerik, 7528 sayılı Öğretmenlik Mesleği Kanunu uyarınca
             * MEB Akademi Giriş Sınavı'na (AGS) taşındı — AGS'nin 80
             * sorusunun %37,5'i (30 soru) eğitim bilimleridir.
             *
             * Bölüm SİLİNMEDİ: eski kayıtlarda bu bölüme ait ilerleme
             * verisi var ve veri kaybı olmayacak. Öğretmen adayları
             * artık AGS bölümlerini çalışmalıdır.
             */
            {
                id: 'EB',
                ad: 'Eğitim Bilimleri (2026’da AGS’ye taşındı)',
                soru: 80,
                devreDisi: true,
                dersler: olcekle(EGITIM_BILIMLERI, 80),
            },
            ...ALAN_BILGISI_BOLUMLERI,
        ],
    },

    AGS: {
        id: 'AGS',
        ad: 'AGS — MEB Akademi Giriş Sınavı',
        kisa: 'AGS',
        icon: '🧑‍🏫',
        aciklama: 'Eğitim Bilimleri 30 · Genel Yetenek-Kültür 42 · Mevzuat 8',
        kademe: 'lisans',
        bolumler: [
            // AGS EB 30 soru; KPSS'nin 80 soruluk ağırlıkları burada geçmez
            { id: 'EB', ad: 'Eğitim Bilimleri', soru: 30, dersler: olcekle(EGITIM_BILIMLERI, 30) },
            { id: 'GENEL', ad: 'Genel Yetenek-Kültür', soru: 42, dersler: AGS_GENEL },
            { id: 'MEVZUAT', ad: 'Mevzuat', soru: 8, dersler: AGS_MEVZUAT },
        ],
    },
};

export const SINAV_LISTESI = Object.values(SINAVLAR);

/** Ders anahtarlarının okunur adı. */
export const DERS_ADLARI = {
    turkce: 'Türkçe',
    matematik: 'Matematik',
    geometri: 'Geometri',
    fizik: 'Fizik',
    kimya: 'Kimya',
    biyoloji: 'Biyoloji',
    tarih: 'Tarih',
    cografya: 'Coğrafya',
    felsefe: 'Felsefe Grubu',
    din: 'Din Kültürü ve Ahlak Bilgisi',
    ingilizce: 'İngilizce',
    edebiyat: 'Türk Dili ve Edebiyatı',
    fen: 'Fen Bilimleri',
    sosyal: 'Sosyal Bilgiler',
    inkilap: 'T.C. İnkılap Tarihi ve Atatürkçülük',
    vatandaslik: 'Vatandaşlık',
    guncel: 'Güncel Bilgiler',
    mevzuat: 'Mevzuat',
    // KPSS A Grubu Alan Bilgisi testleri
    hukuk: 'Hukuk',
    iktisat: 'İktisat',
    isletme: 'İşletme',
    maliye: 'Maliye',
    muhasebe: 'Muhasebe',
    ceko: 'Çalışma Ekonomisi ve Endüstri İlişkileri',
    istatistik: 'İstatistik',
    kamuYonetimi: 'Kamu Yönetimi',
    uluslararasiIliskiler: 'Uluslararası İlişkiler',
    gelisim: 'Gelişim Psikolojisi',
    ogrenme: 'Öğrenme Psikolojisi',
    ogretim: 'Öğretim İlke ve Yöntemleri',
    olcme: 'Ölçme ve Değerlendirme',
    rehberlik: 'Rehberlik ve Özel Eğitim',
    kelime: 'Kelime Bilgisi',
    dilbilgisi: 'Dil Bilgisi (Grammar)',
    okuma: 'Okuma ve Paragraf',
    ceviri: 'Çeviri ve Restatement',
    iletisim: 'İletişim ve Cümle Tamamlama',
};

export const dersAdi = (anahtar) =>
    DERS_ADLARI[anahtar]
    || (String(anahtar || '').charAt(0).toLocaleUpperCase('tr-TR') + String(anahtar || '').slice(1));

export const sinavBul = (id) => SINAVLAR[String(id || '').toLocaleUpperCase('tr-TR')] || null;

/** Öğrencinin sınıf düzeyi — kayıtta yoksa null. */
export const ogrencininSinifi = (ogrenci) => {
    const s = parseInt(String(ogrenci?.grade ?? ogrenci?.class ?? '').replace(/\D/g, ''), 10);
    return Number.isFinite(s) ? s : null;
};

/**
 * Bir bölümü kimliğinden bulur.
 *
 * Sınavın kendi bölümlerine ek olarak ortaokul SINIF bölümlerine de
 * bakar (`SINIF_5`…): 5, 6 ve 7. sınıf öğrencisi LGS'nin 8. sınıf
 * içeriğini değil kendi müfredatını çalışır ve bu bölümler sınavın
 * `bolumler` listesinde yer almaz (LGS'de o içerikten soru sorulmaz).
 */
export const bolumBul = (sinavId, bolumId) => {
    const s = sinavBul(sinavId);
    const dogrudan = s?.bolumler.find((b) => b.id === bolumId);
    if (dogrudan) return dogrudan;

    const eslesme = /^SINIF_(\d+)$/.exec(String(bolumId || ''));
    return eslesme ? sinifBolumu(Number(eslesme[1])) : null;
};

/**
 * Öğrenci kaydından sınav türünü çıkarır.
 *
 * `examType` yazılmışsa o kullanılır. Yazılmamış eski kayıtlar için
 * sınıf düzeyinden makul bir tahmin yapılır: 5–8 → LGS, 9–12 → YKS.
 */
export const ogrencininSinavi = (ogrenci) => {
    const acik = String(ogrenci?.examType || ogrenci?.sinavTuru || '').toLocaleUpperCase('tr-TR');
    if (SINAVLAR[acik]) return acik;
    if (acik === 'TYT' || acik === 'AYT' || acik === 'YDT') return 'YKS';

    const sinif = parseInt(String(ogrenci?.grade ?? ogrenci?.class ?? '').replace(/\D/g, ''), 10);
    if (Number.isFinite(sinif)) {
        if (sinif >= 5 && sinif <= 8) return 'LGS';
        if (sinif >= 9 && sinif <= 12) return 'YKS';
    }
    return 'YKS';
};

/**
 * ══════════════════════════════════════════════════════════════
 *  ALANLAR
 *
 *  Bir öğrenci sınavın TÜM bölümlerini çözmez. Sözel öğrencisi
 *  AYT Sayısal ve YDT konularını görmemeli: YKS'nin 335 konuluk
 *  listesi içinde kendi 188 konusunu araması, listeyi kullanılmaz
 *  kılar. (En küçük alan DİL: 147 konu.)
 *
 *  `bolumler` alanı o alanın çözdüğü bölümleri sıralar.
 * ══════════════════════════════════════════════════════════════
 */
export const ALANLAR = {
    YKS: [
        { id: 'SAY', ad: 'Sayısal', kisa: 'SAY', bolumler: ['TYT', 'AYT_SAY'] },
        { id: 'EA', ad: 'Eşit Ağırlık', kisa: 'EA', bolumler: ['TYT', 'AYT_EA'] },
        { id: 'SOZ', ad: 'Sözel', kisa: 'SÖZ', bolumler: ['TYT', 'AYT_SOZ'] },
        { id: 'DIL', ad: 'Dil', kisa: 'DİL', bolumler: ['TYT', 'YDT'] },
        { id: 'TYT', ad: 'Yalnızca TYT', kisa: 'TYT', bolumler: ['TYT'] },
    ],
    // Diğer sınavlarda alan ayrımı yok; tüm bölümler herkese açık
    LGS: [],
    /**
     * KPSS'te aday GY-GK oturumuna (zorunlu) girer; Alan Bilgisi
     * oturumları isteğe bağlıdır ve aday kendi mezuniyet alanının
     * testini seçer. Her alan bu yüzden GY + GK + kendi testi olarak
     * tanımlıdır (2026 KPSS Lisans Kılavuzu md. 22, 24).
     */
    KPSS: [
        { id: 'GENEL', ad: 'Genel (GY + GK)', kisa: 'GENEL', bolumler: ['GY', 'GK'] },
        // 2026'da kaldırıldı; eski kayıtlar erişimini kaybetmesin diye duruyor
        { id: 'OGRETMEN', ad: 'Öğretmenlik — 2026’da AGS’ye taşındı', kisa: 'ÖĞRT', bolumler: ['GY', 'GK', 'EB'] },
        ...Object.keys(ALAN_BILGISI).map((id) => ({
            id: `A_${id}`,
            ad: `A Grubu — ${ALAN_BILGISI_ADLARI[id]}`,
            kisa: ALAN_BILGISI_ADLARI[id],
            bolumler: ['GY', 'GK', id],
        })),
    ],
    AGS: [],
};

export const alanListesi = (sinavId) => ALANLAR[String(sinavId || '').toLocaleUpperCase('tr-TR')] || [];

/**
 * Öğrencinin alanı. Kayıtta yoksa null döner ve tüm bölümler gösterilir —
 * eski kayıtlar boş liste görmesin.
 */
export const ogrencininAlani = (ogrenci, sinavId = null) => {
    const sinav = sinavId || ogrencininSinavi(ogrenci);
    const liste = alanListesi(sinav);
    if (!liste.length) return null;

    const ham = String(ogrenci?.alan ?? ogrenci?.field ?? ogrenci?.track ?? '').trim();
    if (!ham) return null;

    /**
     * Alan adı elle ya da Excel'den gelebiliyor; "Sözel", "SÖZ",
     * "sozel", "esit agirlik" hepsi aynı alanı gösterir. Türkçe harfler
     * ASCII karşılığına katlanır, harf dışı her şey atılır — aksi hâlde
     * Excel'den gelen "esit agirlik" hiçbir alana eşleşmiyordu.
     */
    const katla = (m) => String(m || '')
        .toLocaleLowerCase('tr-TR')
        .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
        .replace(/i̇/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
        .replace(/[^a-z]/g, '');

    const sade = katla(ham);
    const eslesme = liste.find((a) =>
        katla(a.id) === sade
        || katla(a.kisa) === sade
        || katla(a.ad) === sade
        || sade.startsWith(katla(a.id))
        || katla(a.ad).startsWith(sade));
    return eslesme?.id || null;
};

/**
 * Öğrencinin göreceği bölümler. Alan seçilmemişse sınavın tamamı.
 * @returns {Array} bölüm nesneleri
 */
export const ogrencininBolumleri = (ogrenci, sinavId = null) => {
    const sinav = sinavId || ogrencininSinavi(ogrenci);
    const s = sinavBul(sinav);
    if (!s) return [];

    /**
     * 5, 6 ve 7. sınıf: LGS'nin 8. sınıf içeriği değil, KENDİ müfredatı.
     * LGS yalnızca 8. sınıf konularından sorulur; bu sınıflar hazırlık
     * aşamasındadır ve MEB'in kendi sınıf programını çalışır. Öncesinde
     * 5. sınıf öğrencisi doğrudan 8. sınıf konu listesini görüyordu.
     */
    if (sinav === 'LGS') {
        const sinif = ogrencininSinifi(ogrenci);
        if (MUFREDAT_SINIFLARI.includes(sinif)) {
            const bolum = sinifBolumu(sinif);
            if (bolum) return [bolum];
        }
    }

    const alanId = ogrencininAlani(ogrenci, sinav);
    if (!alanId) {
        /**
         * Alan seçilmemişse sınavın tamamı gösterilir — eski kayıtlar
         * boş liste görmesin. TEK İSTİSNA: KPSS Alan Bilgisi testleri.
         * Bunlar isteğe bağlıdır ve aday yalnızca KENDİ mezuniyet
         * alanının testine girer; dokuzunu birden listelemek alanı
         * seçilmemiş her KPSS öğrencisine 400+ alakasız konu açardı.
         * Alan seçilince ilgili test zaten gelir.
         *
         * Devre dışı EB bölümü BURADA ELENMEZ: eski öğrencilerin
         * oradaki ilerlemesi görünür kalmalı.
         */
        return s.bolumler.filter((b) => !b.alanBilgisi);
    }

    const alan = alanListesi(sinav).find((a) => a.id === alanId);
    if (!alan) return s.bolumler;

    // Sıra alanın tanımındaki sıradır (önce TYT, sonra AYT)
    return alan.bolumler
        .map((bid) => s.bolumler.find((b) => b.id === bid))
        .filter(Boolean);
};

/**
 * ══════════════════════════════════════════════════════════════
 *  KONU KİMLİĞİ
 *
 *  Konular yıllarca yalnızca ADIYLA saklandı. Bu, aynı adı taşıyan
 *  farklı sınav konularını tek kayda düşürüyordu: LGS'nin "Üslü
 *  İfadeler"i ile TYT'nin "Üslü Sayılar"ı ayrı konulardır, kapsamları
 *  ve hedef soru sayıları farklıdır — ama ikisi de aynı ilerleme
 *  satırını paylaşıyordu. Aynı şekilde TYT Matematik "Fonksiyonlar"
 *  ile AYT "Fonksiyonlar" tek kayda biniyordu.
 *
 *  Kimlik dört parçadan kurulur ve sınav bağlamını taşır:
 *      yks:tyt:matematik:uslu-sayilar
 *      lgs:sayisal:matematik:uslu-ifadeler
 *
 *  ⚠️ Eski kayıtlar SİLİNMEZ. Kimlik yeni yazımlarda birincil anahtar
 *  olur; okuma yaparken kimlik bulunamazsa isim anahtarına düşülür
 *  (bkz. topicProgressService). Böylece geçmiş ilerleme kaybolmaz.
 * ══════════════════════════════════════════════════════════════
 */

/** Türkçe metni URL-güvenli, kararlı bir parçaya indirger. */
export const kimlikParcasi = (metin) => String(metin || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
    .replace(/i̇/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Bir konunun sınav bağlamlı benzersiz kimliği.
 * @param {string} sinavId  'YKS' | 'LGS' | 'KPSS' | 'AGS'
 * @param {string} bolumId  'TYT' | 'AYT_SAY' | 'SOZEL' | 'GY' …
 * @param {string} ders     ders kimliği ('matematik')
 * @param {string} konuAd   konunun adı
 * @returns {string|null} 'yks:tyt:matematik:uslu-sayilar'
 */
export const konuKimligi = (sinavId, bolumId, ders, konuAd) => {
    const konu = kimlikParcasi(konuAd);
    if (!konu) return null;
    return [
        kimlikParcasi(sinavId) || 'genel',
        kimlikParcasi(bolumId) || 'genel',
        kimlikParcasi(ders) || 'genel',
        konu,
    ].join(':');
};

/** Kimliği parçalarına ayırır; kimlik değilse null. */
export const kimlikCoz = (kimlik) => {
    const p = String(kimlik || '').split(':');
    if (p.length !== 4) return null;
    return { sinav: p[0], bolum: p[1], ders: p[2], konu: p[3] };
};

/** Bir sınavın tüm konuları düz listede — sayım ve arama için. */
export const tumKonular = (sinavId) => {
    const s = sinavBul(sinavId);
    if (!s) return [];
    return s.bolumler.flatMap((b) =>
        Object.entries(b.dersler).flatMap(([ders, konular]) =>
            konular.map((t) => ({
                bolum: b.id, bolumAd: b.ad, ders,
                konu: t.ad, agirlik: t.a, zorluk: t.z,
                topicId: konuKimligi(s.id, b.id, ders, t.ad),
                hedef: hedefSoruHesapla(t.a, t.z),
            }))));
};

export default {
    SINAVLAR, SINAV_LISTESI, sinavBul, ogrencininSinavi,
    ALANLAR, alanListesi, ogrencininAlani, ogrencininBolumleri,
    dersAdi, tumKonular, DERS_ADLARI, hedefSoruHesapla, ZORLUK_ADI,
    konuKimligi, kimlikCoz, kimlikParcasi,
};
