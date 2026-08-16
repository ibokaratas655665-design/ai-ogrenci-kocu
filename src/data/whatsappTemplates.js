/**
 * 💬 WHATSAPP MESAJ ŞABLONLARI
 *
 * Değişkenler {süslü parantez} içinde yazılır ve whatsappService tarafından
 * rapor verisiyle doldurulur. Kullanılabilir değişkenlerin tam listesi için
 * whatsappService.js → TEMPLATE_VARIABLES.
 *
 * audience: 'parent' → veli numarasına, 'student' → öğrenci numarasına gider.
 */

export const TEMPLATE_CATEGORIES = [
    { id: 'parent', label: 'Veli İletişimi', icon: '👨‍👩‍👧', color: 'var(--c4)' },
    { id: 'performance', label: 'Performans', icon: '📊', color: 'var(--accent)' },
    { id: 'task', label: 'Görev & Program', icon: '📋', color: 'var(--info)' },
    { id: 'motivation', label: 'Motivasyon', icon: '🔥', color: 'var(--danger)' },
    { id: 'meeting', label: 'Görüşme & Randevu', icon: '📅', color: 'var(--highlight)' },
];

export const DEFAULT_TEMPLATES = [
    // ─── VELİ İLETİŞİMİ ──────────────────────────────────────
    {
        id: 'parent_weekly',
        category: 'parent',
        audience: 'parent',
        icon: '📩',
        label: 'Haftalık Veli Raporu',
        description: 'Haftanın çalışma, görev ve deneme özetini veliye gönderir.',
        body:
            `Merhaba {veliAdi},

{ogrenciAdi} için *haftalık gelişim raporu*:

📚 Çalışma süresi: *{calismaSaati} saat*
✅ Görevler: *{gorevTamam}/{gorevToplam}* tamamlandı (%{gorevYuzde})
📊 Son deneme: *{sonNet} net* ({netDegisimMetin})
🔥 Çalışma serisi: *{seri} gün*

💪 Güçlü ders: {gucluDers}
🎯 Odaklanılacak ders: {zayifDers}

Detaylı raporu görüntülemek için:
{veliLinki}

İyi günler dilerim.
{kocAdi}`,
    },
    {
        id: 'parent_monthly',
        category: 'parent',
        audience: 'parent',
        icon: '🗓️',
        label: 'Aylık Veli Raporu',
        description: 'Aylık dönem özeti — daha geniş bakış, hedef karşılaştırması.',
        body:
            `Merhaba {veliAdi},

{ogrenciAdi} için *aylık değerlendirme*:

📊 Ortalama net: *{ortalamaNet}*
🏆 En yüksek net: *{enIyiNet}*
📈 Girilen deneme sayısı: *{denemeSayisi}*
📚 Toplam çalışma: *{calismaSaati} saat*
✅ Görev tamamlama: *%{gorevYuzde}*

🎯 Hedef: {hedef}
📍 Genel durum: *{riskDurumu}*

Detaylı rapor:
{veliLinki}

Görüşmek üzere,
{kocAdi}`,
    },
    {
        id: 'parent_exam_result',
        category: 'parent',
        audience: 'parent',
        icon: '📝',
        label: 'Deneme Sonucu Bildirimi',
        description: 'Yeni deneme sonucu çıktığında veliye anında bilgi verir.',
        body:
            `Merhaba {veliAdi},

{ogrenciAdi}'ın *{denemeAdi}* sonucu açıklandı:

📊 Toplam net: *{sonNet}*
📈 Önceki denemeye göre: *{netDegisimMetin}*
🏫 Sınıf sıralaması: {sinifSira}

💪 En iyi ders: {gucluDers}
🎯 Geliştirilecek: {zayifDers}

Ayrıntılı analiz:
{veliLinki}

{kocAdi}`,
    },
    {
        id: 'parent_concern',
        category: 'parent',
        audience: 'parent',
        icon: '⚠️',
        label: 'Veli Bilgilendirme (Dikkat)',
        description: 'Performans düşüşü veya devamsızlık durumunda veliye bilgi.',
        body:
            `Merhaba {veliAdi},

{ogrenciAdi} ile ilgili sizinle paylaşmak istediğim bir konu var.

Son dönemde:
{riskNedenleri}

Bu durumu birlikte değerlendirmek isterim. Uygun olduğunuz bir zamanda görüşebilir miyiz?

Endişelenecek bir durum değil — erken fark edip birlikte çözmek her zaman daha kolay oluyor.

Saygılarımla,
{kocAdi}`,
    },
    {
        id: 'parent_congrats',
        category: 'parent',
        audience: 'parent',
        icon: '🎉',
        label: 'Veli Tebrik Mesajı',
        description: 'Belirgin gelişme gösteren öğrencinin velisine tebrik.',
        body:
            `Merhaba {veliAdi},

{ogrenciAdi} bu dönem gerçekten güzel bir iş çıkardı 👏

📈 Netlerinde *{netDegisimMetin}*
📚 *{calismaSaati} saat* çalışma
✅ Görevlerinin *%{gorevYuzde}*'ini tamamladı

Özellikle *{gelisenDers}* dersindeki ilerlemesi dikkat çekici.

Evde de bu emeği fark ettiğinizi hissettirmeniz motivasyonu için çok değerli olacaktır.

Tebrikler!
{kocAdi}`,
    },

    // ─── PERFORMANS ──────────────────────────────────────────
    {
        id: 'student_exam_result',
        category: 'performance',
        audience: 'student',
        icon: '📊',
        label: 'Öğrenciye Deneme Analizi',
        description: 'Deneme sonrası öğrenciye kişisel analiz ve yönlendirme.',
        body:
            `Merhaba {ad} 👋

*{denemeAdi}* analizin hazır:

📊 Toplam net: *{sonNet}* ({netDegisimMetin})
💪 En iyi dersin: *{gucluDers}*
🎯 Bu hafta odaklanman gereken: *{zayifDers}*

{zayifDers} için bu hafta hedefin: yanlışlarını hata defterine geçir ve aynı konudan 20 soru daha çöz.

Sorun olursa yaz, birlikte bakarız.
{kocAdi}`,
    },
    {
        id: 'student_weekly',
        category: 'performance',
        audience: 'student',
        icon: '📈',
        label: 'Öğrenciye Haftalık Özet',
        description: 'Haftanın performans özeti ve gelecek hafta hedefi.',
        body:
            `Selam {ad}! Haftalık özetin 👇

📚 Çalışma: *{calismaSaati} saat*
✅ Görevler: *{gorevTamam}/{gorevToplam}*
🔥 Seri: *{seri} gün*
📊 Son net: *{sonNet}*

{motivasyonCumlesi}

Haftaya görüşürüz 💪
{kocAdi}`,
    },

    // ─── GÖREV & PROGRAM ─────────────────────────────────────
    {
        id: 'task_reminder',
        category: 'task',
        audience: 'student',
        icon: '⏰',
        label: 'Görev Hatırlatma',
        description: 'Tamamlanmamış görevleri hatırlatır.',
        body:
            `Merhaba {ad},

Tamamlanmayı bekleyen *{gecikenGorev}* görevin var:

{gecikenGorevListesi}

Bugün bunlardan birini bitirsen seriyi bozmamış olursun 🔥

{kocAdi}`,
    },
    {
        id: 'program_shared',
        category: 'task',
        audience: 'student',
        icon: '🗓️',
        label: 'Yeni Program Paylaşımı',
        description: 'Yeni haftalık çalışma programı hazır olduğunda gönderilir.',
        body:
            `Merhaba {ad},

Bu haftaki çalışma programın hazır 📋

Programı uygulamadan görebilirsin. Önceki haftaya göre *{zayifDers}* için biraz daha fazla süre ayırdım — orada hızlanmamız gerekiyor.

Takıldığın yer olursa yaz.
{kocAdi}`,
    },
    {
        id: 'inactive_nudge',
        category: 'task',
        audience: 'student',
        icon: '👋',
        label: 'Uzun Süredir Yok',
        description: 'Bir süredir aktivite kaydı olmayan öğrenciye hatırlatma.',
        body:
            `Merhaba {ad},

*{aktifsizGun} gündür* uygulamada bir hareket göremedim. Her şey yolunda mı?

Ara vermek bazen gerekli — ama uzun sürerse geri dönmek zorlaşıyor. Bugün 25 dakikalık tek bir pomodoro bile seni tekrar rayına oturtur.

Bir sorun varsa yazmaktan çekinme.
{kocAdi}`,
    },

    // ─── MOTİVASYON ──────────────────────────────────────────
    {
        id: 'motivation_streak',
        category: 'motivation',
        audience: 'student',
        icon: '🔥',
        label: 'Seri Tebriği',
        description: 'Çalışma serisini sürdüren öğrenciyi tebrik eder.',
        body:
            `{ad}, *{seri} gündür* aralıksız çalışıyorsun 🔥

Bu iş zaten tam olarak bu: yetenek değil, süreklilik. Şu an sınıfın çoğundan bir adım öndesin.

Bugünü de doldur, seriyi bozma 💪
{kocAdi}`,
    },
    {
        id: 'motivation_general',
        category: 'motivation',
        audience: 'student',
        icon: '💪',
        label: 'Genel Motivasyon',
        description: 'Serbest motivasyon mesajı.',
        body:
            `Merhaba {ad},

{motivasyonCumlesi}

Hedefin: *{hedef}*
Şu anki netin: *{sonNet}*

Aradaki mesafe kapanabilir bir mesafe. Plan zaten hazır, tek yapman gereken uygulamak.

{kocAdi}`,
    },

    // ─── GÖRÜŞME & RANDEVU ───────────────────────────────────
    {
        id: 'meeting_parent',
        category: 'meeting',
        audience: 'parent',
        icon: '📅',
        label: 'Veli Görüşme Daveti',
        description: 'Veliyi rehberlik görüşmesine davet eder.',
        body:
            `Merhaba {veliAdi},

{ogrenciAdi}'ın gelişim sürecini değerlendirmek üzere sizinle bir görüşme yapmak isterim.

📅 Önerilen tarih: {gorusmeTarihi}
📍 Yer: {gorusmeYeri}

Bu tarih uygun değilse birlikte başka bir zaman belirleyebiliriz.

Saygılarımla,
{kocAdi}`,
    },
    {
        id: 'meeting_student',
        category: 'meeting',
        audience: 'student',
        icon: '🤝',
        label: 'Öğrenci Görüşme Daveti',
        description: 'Öğrenciyi birebir koçluk görüşmesine çağırır.',
        body:
            `Merhaba {ad},

Bu haftaki birebir görüşmemizi *{gorusmeTarihi}* için planladım.

Konuşacaklarımız:
• Son deneme analizin ({sonNet} net)
• {zayifDers} için yeni strateji
• Haftalık programın

Uygun değilsen haber ver, kaydırırız.
{kocAdi}`,
    },
    {
        id: 'custom',
        category: 'meeting',
        audience: 'student',
        icon: '✏️',
        label: 'Boş Şablon',
        description: 'Sıfırdan mesaj yazmak için.',
        body: `Merhaba {ad},

`,
    },
];

export default DEFAULT_TEMPLATES;
