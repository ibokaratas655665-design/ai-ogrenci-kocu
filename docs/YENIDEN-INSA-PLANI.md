# Yeniden İnşa Planı — 25 Ağustos → 4 Eylül Kayıp Penceresi

**Bağlam:** 04.09.2026'da bilgisayar formatlandı; 25.08 sonrası kaynak kod kaybedildi.
Canlıdaki derlenmiş sürüm yedeklendi (`D:\yedekler\AL KOÇ\alkoc-canli-yedek-2026-09-04`)
ve iki derleme karşılaştırılarak kayıp özellikler tespit edildi. Bu plan, o özellikleri
fazlar hâlinde yeniden inşa eder. Her faz kendi commit'iyle kapanır ve push edilir.

**Kalıcı karar:** PDR/rehberlik modülü AL KOÇ'a geri BİRLEŞTİRİLMEYECEK (`archive/`
klasöründe kalır); rehberlik ayrı bir uygulama olarak geliştirilmektedir.

## Faz 1 — Küçük net işler (ısınma)
- [ ] StudentDashboard: Hata Defteri'nde "Bu hatanın tekrar zamanı geldi." uyarısı
- [ ] StudentDashboard: "Tam ekran" düğmesi (maximize-2 ikonu)
- [ ] ModuleIcons/bölüm gezinmesi: "Önceki bölüm / Sonraki bölüm" okları (chevron-up dahil)
- [ ] reportService: üç yeni risk gerekçesi metni — "Netlerde hafif gerileme",
      "Haftalık çalışma süresi 2 saatin altında", "Hiç aktivite kaydı yok"
- [ ] accessControl: "Henüz konu eklenmedi." boş durumu

## Faz 2 — Öğrenci Detay Sayfası yenilemesi (en büyük parça)
- [ ] İstatistik kartları: Verimli Planlayıcı · Günlük Seri · Toplam Çalışma · Günlük Pomodoro
- [ ] Boş durumlar: "Öğrenci henüz uygulama içinde aktif değil / Veri oluştuğunda burada görünecek",
      "Henüz tamamlanmış test yok"
- [ ] Görev atama akışı: Yeni Görev Ata → Görev Başlığı ("Örn: 50 Soru Çözümü") → Görevi Ata
- [ ] "Çalışma Programı" görünümü
- [ ] Öğrenci bilgisi düzenleme (güncellendi / kaydedilemedi geri bildirimleri, kayıt bulunamadı)

## Faz 3 — Konu bazlı analiz (ComparativeAnalysis)
- [ ] Sekmeler: "Gelişim / Genel Bakış" · "Konularım / Konu Takibi" · "Konu Bazında Analiz"
- [ ] "Konu bazında gerçek takip" + "Ders bazında analiz" + "Hata analizi" bölümleri
- [ ] Konu listelerinin bileşen içinden merkezi veri dosyasına (curriculum) taşınması (refactor)
- [ ] Net seyri grafiğinin BarChart → LineChart dönüşümü

## Faz 4 — Cevap anahtarı PDF akışı (CoachDashboard / denemeler)
- [ ] "Cevap Anahtarı PDF Yükle" adımı (boyut göstergesi: "… KB · cevap anahtarı PDF")
- [ ] "Anahtarı Ayrıştır" — anahtar biçim kuralı: şıkların BİTİŞİK dizisi, A–E doğrulaması
- [ ] Deneme tablosuna "Öğrenci No" ve "Ders Gelişimi" sütun/görünümleri

## Faz 5 — İçerik ve altyapı
- [ ] AGS ve KPSS sınav türleri + içerik setleri (Eğitim Bilimleri konuları, mevzuat başlıkları)
- [ ] programHafizasi içerik eklemeleri (ör. "Grafik ve Rutin Olmayan", Doğru/Çember ayrımı)
- [ ] RealtimeNotifications modülü (gerçek zamanlı bildirim altyapısı)
- [ ] subscriptionService sağlamlaştırma: "Paket talebi bulunamadı", koç Firebase kimlik çözümü,
      sunucu abonelik yazımı hata yolları

## Çalışma yöntemi
- Referans: canlı yedekteki minified paketler (davranış/metin birebir oradan doğrulanır).
- Her maddede: uygula → `npm run build` → commit; faz sonunda push.
- Deploy, tüm fazlar bitip canlıyla eşitlik sağlanmadan YAPILMAZ (canlıdaki sürüm daha
  yeni olduğu için erken deploy bugünkü canlıyı geriletir).
