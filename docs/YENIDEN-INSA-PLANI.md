# Yeniden İnşa Planı — 25 Ağustos → 4 Eylül Kayıp Penceresi

**Bağlam:** 04.09.2026'da bilgisayar formatlandı; 25.08 sonrası kaynak kod kaybedildi.
Canlıdaki derlenmiş sürüm yedeklendi (`D:\yedekler\AL KOÇ\alkoc-canli-yedek-2026-09-04`)
ve iki derleme metin-bazlı karşılaştırılarak kayıp özellikler **doğrulandı** (her madde
eski derlemede YOK + canlıda VAR testinden geçti). Bu plan, o özellikleri fazlar hâlinde
yeniden inşa eder. Her faz kendi commit'iyle kapanır ve push edilir.

**Kalıcı karar:** PDR/rehberlik modülü AL KOÇ'a geri BİRLEŞTİRİLMEYECEK (`archive/`
klasöründe kalır); rehberlik ayrı bir uygulama olarak geliştirilmektedir.

**Not:** İlk şüphe listesindeki birçok özellik (risk motoru, Hata Defteri aralıklı tekrar,
öğrenci detay istatistik kartları, görev atama) 25.08 kaynağında ZATEN VAR çıktı — kayıp
sanılmasının sebebi ayrıştırıcı yanılgısıydı. Aşağıdaki liste doğrulanmış gerçek kayıptır.

## Faz 1 — Küçük net işler (ısınma) ✅ (04.09.2026)
- [x] Konu motoru v2 (topicProgressService): `konuRisk` + `konuOncelik` skorlayıcıları,
      `deneme_analizleri` deposu entegrasyonu, topluOzet'e `topOncelik` + `tamamHatali`
- [x] Öğrenci Bugün ekranı öneri hattı (services/bugunOnerileri + "Önerilen Odaklar" kartı):
      "hata-analizi" dikkat kartı, "review-due" tekrar kartı, "oncelik-onerisi" kartı
- [x] Mobil bölüm gezinme şeridi (`BolumSeridi`, ui/Gelisim): ok düğmeleri ("Önceki bölüm" /
      "Sonraki bölüm"), aktif bölüme kayan hap listesi, nokta göstergesi; iki merkezde aktif
- [x] StudentDetailPage: hedef artık kalıcı kaydediliyor + "Öğrenci kaydı bulunamadı" hata yolu

## Faz 2 — Kompakt Program Kurucu paneli
- [ ] Ders seçici (— Ders — açılır listesi) + "Dersin Tümünü Ekle (N)" düğmesi
- [ ] Program Listesi paneli: toplam etüt rozeti, konu kartları,
      boş durum: 'Henüz konu eklenmedi. "Konular" veya "Dersin Tümü" ile ekleyin.'
- [ ] Kompakt "Geçen dönemin N eksik konusunu ekle" düğmesi (carryOver)

## Faz 3 — Konu bazlı analiz sekmeleri (ComparativeAnalysis)
- [ ] Sekmeler: "Gelişim / Genel Bakış" · "Konularım / Konu Takibi" · "Konu Bazında Analiz"
- [ ] "Konu bazında gerçek takip" + "Ders bazında analiz" bölümleri
- [ ] "Konu bazında başarı verisi henüz yok" boş durumu

## Faz 4 — AI deneme okuma akışı (en büyük parça)
- [ ] Koç tarafı: "Soru Kitapçığı (PDF)" + "Cevap Anahtarı PDF Yükle" (boyut göstergesi)
- [ ] "AI ile Oku" + "Anahtarı Ayrıştır" (Gemini; anahtar biçimi: şıkların BİTİŞİK dizisi,
      A–E doğrulama) + "Sorulardan Konuları AI ile Çıkar"
- [ ] Ayarlarda Gemini API anahtarı alanı ("✅ Gemini anahtarı kaydedildi")
- [ ] Öğrenci tarafı: kitapçık görüntüleyici ("Kitapçık yükleniyor…", hata durumunda
      '"Tam ekran" ile açmayı deneyin'), "etüt · dokun & başla", "Denemeyi Kaydet",
      Hata Defteri'nde "Tekrar Çöz"

## Faz 5 — İçerik ve altyapı
- [ ] AGS ve KPSS sınav türleri + içerik setleri (`AGS|EB|rehberlik|…`, `KPSS|EB|…`
      biçiminde konu verileri; mevzuat başlıkları dahil)
- [ ] RealtimeNotifications modülü (yeni lazy chunk)
- [ ] subscriptionService hata yolları: "Paket talebi bulunamadı", "Koç Firebase kimliği
      çözülemedi (kocDizin kaydı yok)", "Sunucu abonelik yazımı başarısız"

## Çalışma yöntemi
- Referans: canlı yedekteki minified paketler — davranış ve metinler birebir oradan alınır.
- Her maddede: uygula → `npm run build` → commit; faz sonunda push.
- Deploy, tüm fazlar bitip canlıyla eşitlik sağlanmadan YAPILMAZ (canlıdaki sürüm daha
  yeni olduğu için erken deploy bugünkü canlıyı geriletir).
