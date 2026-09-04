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

## Faz 2 — Program Kurucu masaüstü araç çubuğu ✅ (04.09.2026)
- [x] İki sekmeli araç çubuğu: "Kur" ve "Ölçü & Kriter" (eski üst filtre çubuğu +
      384px kalıcı kenar sütunu yerine; ızgara masaüstünde tam genişlik)
- [x] "Konu Seç" popover: sınav+ders seçici, "Dersin Tümünü Ekle (N)", Önerilen
      Konular çipleri, konu arama, çoklu seçim + tek konu "+" ekleme
- [x] "Bloklar" popover: seçim modu, hazır bloklar, silgi, özel ders/konu
- [x] "Liste" popover: Dağıtım Listesi + etüt rozeti + kompakt "Geçen dönemin N eksik
      konusunu ekle" + boş durum ('Henüz konu eklenmedi. "Konular" veya "Dersin Tümü"
      ile ekleyin.') + konu kartları + Program Hafızası paneli + AKILLI DAĞIT
- [x] "Ölçü" popover (mod / süre / günlük etüt) + "Kriterler & Etüt Saatleri" kısayolu
- [x] Aktif araç çipi ("Aracı bırak" ile) araç çubuğunda
- [x] Kenar sütunu telefonda aynen; masaüstünde sıfır genişlik (AYARLAR kayan paneli
      çalışmaya devam eder)

## Faz 3 — Deneme analizinde dürüst veri ✅ (04.09.2026)
- [x] SubjectAnalysis (rastgele üretilmiş SAHTE konu başarısı ekranı) ve topicLists
      verisi kaldırıldı; her kullanım yerinde (StudentDetailPage, TrialsPage) yerine
      dürüst "Konu Bazında Analiz" bilgi kartı: "Konu bazında başarı verisi henüz yok"
      + gerçek kaynaklara yönlendirme (Konularım / Konu Takibi · Gelişim / Genel Bakış ·
      Hata Defteri)
- [x] ComparativeAnalysis: sahte "sınıf ortalaması" radar katmanı ve rastgele sınıf
      ortalaması çizgisi kaldırıldı; radar "Ders Net Profili" oldu (ders bazlı gerçek
      netler, sıfırlar süzülür), puan grafiği yalnız gerçek seriyi çizer

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
