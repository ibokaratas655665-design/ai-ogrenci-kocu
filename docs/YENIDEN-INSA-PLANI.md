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

## Faz 4 — Uygulama içi deneme motoru ✅ (04.09.2026)
- [x] services/denemeMotoru: kaynak/atama/oturum yaşam döngüsü, otomatik puanlama
      (ders + konu kırılımı), çözüm davranışı istatistiği (soru başına süre, en uzun
      soru, cevap değişimi, ilk ders), sonuçların deneme_analizleri merkezine yazımı,
      PDF saklama (data-URI ↔ Firebase Storage) + bağlantı çözücü, koç dönütü deposu
- [x] services/geminiOkuma: cevap anahtarı okuma (JSON şemalı), kitapçıktan konu
      çıkarma, kitapçık+anahtar eşleştirme; anahtar `gemini_api_key` (Koçluk
      Asistanı'yla ortak), model gemini-3.6-flash
- [x] Koç: "Sınav Oluştur" ekranı (nav: sinav-olustur) — form + AI okuma kutusu
      (inline Gemini anahtar kurulumu, Dosya Seç / Fotoğraf Çek) + "Anahtarı Ayrıştır"
      (Ders: ABCDE / Ders | Konu: ABCDE) + düzenlenebilir önizleme + kaynak listesi +
      atama modalı (kontrollü açılış tarihi) + geri alma
- [x] Öğrenci: "Deneme Çöz" sekmesi (rozet: çözülmemiş atama sayısı) — atanan
      denemeler + koç dönütü kartı; çözüm ekranı (pdfjs kitapçık görüntüleyici /
      iframe, optik form, karalama tuvali, Önceki/Sonraki/Bitir & Gönder);
      sonuç ekranı (net, ders kırılımı, çözüm istatistiği, "Cevap Anahtarını Gör",
      "Tekrar Çöz")

## Faz 5 — Altyapı ✅ (04.09.2026)
- [x] subscriptionService.paketOnayla SUNUCU-ÖNCE yapıldı: koç uid'i kocDizin'den
      çözülür, `abonelikler/{uid}` belgesi yazılır, sunucu yazımı başarısızsa yerel
      kayıt da aktifleşmez. Hata yolları: "Paket talebi bulunamadı" / "Koç Firebase
      kimliği çözülemedi (kocDizin kaydı yok)" / "Sunucu abonelik yazımı başarısız"
- [x] ~~AGS/KPSS içerik setleri~~ — YANLIŞ ALARM: examTopics.js'te zaten tam
      (2026 kılavuz kaynaklı; canlıdaki `AGS|EB|…` dizgileri çalışma anında üretilen
      konu kimlikleridir)
- [x] ~~RealtimeNotifications~~ — YANLIŞ ALARM: kaynakta mevcut
      (canlıdaki yeni chunk yalnız kod bölme farkı)

## Kalan küçük işler (düşük öncelik)
- [ ] Telefon mini-paneli kozmetiği ("bugünün programı · N etüt · dokun & başla"
      şeridi — hangi görünüme ait olduğu belirsiz, davranış kaybı yok)
- [ ] demoService'e deneme motoru örnek verisi (demo okulda hazır çözülmüş
      uygulama içi deneme + atama görünsün)
- [ ] RealtimeNotificationBell: Firestore SDK iç hatası (b815/ca9, multi-tab
      persistence) ara sıra hata ekranına düşürüyor — SDK sorunu, hata sınırı
      bileşene özel yapılabilir ya da watch akışı yeniden bağlanabilir

## Kayıp sohbetlerden çıkan bekleyen fikirler (04.09 öncesi konuşulmuş, yapılmamış)
- [ ] KAYITLI denemenin cevap anahtarını sonradan düzenleme (şu an düzeltme yalnız
      oluşturma sırasında; kayıtlıyı düzeltmek için sil-yeniden oluştur gerekiyor)
- [ ] "Her sorunun görselini optik formun yanında göster" modu (PDF'i soru soru
      kesme gerektirir — büyük iş, bilinçli ertelendi)

## ⚠️ ALTIN KURAL (kullanıcı talimatı, 04.09)
Eski güncellemelerde BİLEREK silinen/değiştirilen şeyler geri getirilmez.
Tek doğruluk kaynağı: bugünkü CANLI sürümün derlenmiş paketleri
(`D:\yedekler\AL KOÇ\alkoc-canli-yedek-2026-09-04`). Kurtarılan sohbet
(`sohbetler\master-denetim.txt`) yalnız bağlam/niyet içindir — bir özellik
ancak canlı pakette VARSA inşa edilir; sohbette geçip canlıda olmayan her
şey (ara tasarımlar, sonradan sökülenler: "Sistemi Paylaş", üst kart grid,
"Yaklaşan Randevular", header düğmeleri vb.) BİLİNÇLİ ÇÖP sayılır.

## Kurtarılan sohbetten çıkan büyük resim (04.09 son oturum)
Kayıp pencere sanılandan büyük: oturum başında bile 45 dosyalık commit'siz
delta vardı; oturum içinde bf47c87 (137 dosya, +14228/−1808) ve 1fea634
dahil birden çok YEREL commit yapıldı, hiçbiri push edilmedi. Kapsam:
master denetim (8 ajanlı audit), kokpit/tek-ekran dönüşümü, 3B tasarım dili
(kutu-3b/liste-3b/topbar), akademik takvim (tatil verisi + ayarlardan
düzenleme), birleşik veri hattı (birlesikTrials/birlesikResults,
matchResultsForStudent), granular ders analitiği, çözüm davranışı analitiği,
demo zenginleştirme, Günlük Takip Merkezi, Denemeler tabı yeniden düzeni
(sol liste + sağ grafikler + TrialCard), Program Kurucu son tasarımı,
giriş inputları temizliği, ve final 5'li paket. Hepsi canlı pakette mevcut;
fazlar hâlinde canlıdan geri taşınacak.

## Çalışma yöntemi
- Referans: canlı yedekteki minified paketler — davranış ve metinler birebir oradan alınır.
- Her maddede: uygula → `npm run build` → commit; faz sonunda push.
- Deploy, tüm fazlar bitip canlıyla eşitlik sağlanmadan YAPILMAZ (canlıdaki sürüm daha
  yeni olduğu için erken deploy bugünkü canlıyı geriletir).
