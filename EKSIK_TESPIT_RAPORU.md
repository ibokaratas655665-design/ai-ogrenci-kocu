# İçerik Eksik Tespit Raporu

**Tarih:** 16 Ağustos 2026
**Kapsam:** 2–5. maddeler tamamlandıktan sonra uygulamanın tamamının içerik taraması

---

## Bölüm 1 — Bu turda tamamlananlar

| Madde | Durum | Sonuç |
|---|---|---|
| 2. Müfredat güncelleme | ✅ | 449 → **817 konu** |
| 3. Rehberlik testleri | ✅ | MEB formları tam maddeye çıkarıldı + rapor/PDF altyapısı |
| 4. BEP süreç modülü | ✅ | 6 aşamalı süreç + 5 resmî PDF belgesi |
| 5. Görsel dil | ✅ | Ortak derinlik katmanı, grafik teması, 3 yüzeye uygulandı |

### 2. Müfredat

Kaynak: MEB TTKB "2026 YKS Kazanım ve Açıklamalar", ÖSYM 2026 AGS konu dağılımı, MEB 8. sınıf öğretim programı.

**En kritik bulgu:** TYT ve AYT **Geometri dersi tamamen eksikti** — TYT'de 10, AYT'de ~10 soru gelen bir alan hiç yoktu. AYT'de **Mantık, Psikoloji ve Sosyoloji** de yoktu (Felsefe Grubu 12 sorunun yarısı).

| Sınav | Önce | Sonra | Eklenen |
|---|---|---|---|
| TYT | 131 | **197** | Geometri (21), Biyoloji sistemleri, Tarih/Coğrafya/Felsefe/Din derinleştirme |
| AYT | 132 | **266** | Geometri (19), Mantık (7), Psikoloji (10), Sosyoloji (8), Fizik/Tarih genişletme |
| YDT | 14 | **34** | Dilbilgisi + soru tipleri ayrıştırıldı |
| LGS | 53 | **67** | Türkçe/Fen derinleştirme, yeni nesil problemler |
| KPSS | 93 | **176** | ÖABT 7 → 15 branş |
| AGS | 26 | **77** | ÖSYM resmî 6 alt testine göre yeniden kuruldu |

**Geçerlilik notu:** ÖSYM/MEB açıklamalarına göre 2027 YKS'de yapı ve kapsam değişmiyor. Türkiye Yüzyılı Maarif Modeli'ne göre hazırlanan ilk YKS **2028**. 2026-2027'de model 7. sınıfa ulaştığı için LGS hâlâ mevcut programdan. Yani bu müfredat 2027 sınavları için geçerli; **2028 için yeniden yazılması gerekecek.**

### 3. Rehberlik testleri

MEB'in kamuya açık formları gerçek madde sayılarına çıkarıldı:

| Form | Önce | Sonra |
|---|---|---|
| Problem Tarama Envanteri | 36 | **90** (9 yaşam alanı) |
| RİBA Lise | 23 | **38** |
| RİBA Ortaokul | 14 | **28** |
| RİBA İlkokul | 8 | **20** |
| RİBA Öğretmen | 8 | **25** |
| Öğrenci Tanıma Formu | 4 | **29** |
| Otobiyografi | 3 | **16** |
| Sosyometri | 4 | **6** |

Ayrıca kurulanlar:
- **Ortak rapor motoru** — her envanterin sonucu tek şemaya çevriliyor: alt boyut puanları, yorum bantları, dikkat çeken maddeler, öneri havuzu
- **Sonuç raporu ekranı + PDF** — renkli gradyan başlık, alt boyut çubukları, müdahale önerileri
- **Sınıf geneli özet** — "bu sınıfta en çok hangi alanda ihtiyaç var" (yıllık plan için)
- **Sosyometri artık ayrı sekme değil**, Test & Envanter içinde sonuç görünümü

**Telif kısıtı devam ediyor:** Beck, MMPI, SCL-90 ve Holland'ın orijinal formu gibi lisanslı ölçeklerin maddeleri eklenmedi. Bu araçları kullanıyorsanız madde metinlerini "özel envanter" olarak girin; puanlama, rapor ve PDF katmanı onlar için de çalışır.

### 4. BEP modülü

Tek belge sihirbazından 6 aşamalı sürece dönüştü:

```
Öğrenciler → BEP Birimi → Performans → BEP Planı → Toplantılar → Gelişim Raporu
```

- **Öğrenciler:** RAM rapor no/tarihi, 14 yetersizlik türü, 6 eğitim ortamı, süreç tamamlanma yüzdesi
- **BEP Birimi:** 8 resmî görev tanımı, derse giren öğretmen listesi
- **Performans:** ders bazlı mevcut performans, güçlü yönler, ihtiyaçlar
- **Plan:** mevcut motor korundu, artık öğrenciye bağlı kaydediliyor
- **Toplantılar:** 6 toplantı türü, katılımcı seçimi, gündem, kararlar
- **Gelişim Raporu:** amaç gerçekleşme takibi (kazanıldı/kısmen/devam ediyor)

**5 resmî PDF belgesi:** BEP Planı, Toplantı Tutanağı, Performans Değerlendirme Formu, Bireysel Gelişim Raporu, BEP Öğrenci Listesi — hepsinde imza blokları var.

Ders listesi müfredattan türetiliyor, yani müfredat güncellendikçe BEP de güncel kalıyor.

### 5. Görsel dil

- `styles/depth.css` — ortak derinlik katmanı: katmanlı ışık (üstten highlight + alttan gölge), 220 ms geçişler, `prefers-reduced-motion` desteği
- `premium-card` yeniden tanımlandı → koç ve öğrenci panelinin **tamamı** tek değişiklikle kabartmalı yüzeye geçti
- Veli portalı ve giriş sayfası açık tema versiyonuna (`surface-3d-light`) geçti
- Atmosfer katmanı (`atmos`) — arka planda yumuşak renk halkaları
- `chartTheme.js` — grafikler her dosyada ayrı renk/eksen kullanıyordu, tek kaynağa bağlandı

---

## Bölüm 2 — Tespit edilen eksikler

### 🔴 Kritik

**E1. Öğrenci verilerinin çoğu koça hiç ulaşmıyordu**
Senkronizasyon yalnızca `program_schedule_*` ve `program_closed_slots_*` desenlerini taşıyordu. Şunlar cihazda kalıyordu:

`test_results_*` · `test_result_sociometry_*` · `assigned_tests_*` · `gamification_stats_*` · `user_stats_*` · `pomodoro_log_*` · `completed_topics_*` · `student_goals_*` · `coach_notes_*` · `program_meta_*` · `calendar_events_*` · `ai_plan_*` · `appt_slots_*`

Pratik sonucu: **öğrenci telefonunda envanter çözüyor, koç panelinde hiçbir şey görünmüyordu.** Karne ve veli portalı XP/pomodoro okuduğu için sıfır gösteriyorlardı.

→ **Bu turda düzelttim** (desen listesi genişletildi). Ama kök neden duruyor: blob tabanlı senkron, iki cihaz aynı anda yazarsa hâlâ veri kaybettirir.

**E2. Grafiklerde sahte veri**
Üç bileşen gerçek veri yoksa `Math.random()` ile veri uyduruyor:
- `charts/SubjectAnalysis.jsx` — konu bazlı doğru/yanlış sayıları uyduruluyor
- `charts/ComparativeAnalysis.jsx` — sınıf ortalaması `320 ± 20` olarak simüle ediliyor
- `AnalyticsTab.jsx` — ders ortalaması yoksa `Math.random() * 10 + 20`

Koç bu grafiklere bakıp karar verirse yanlış karar verir. **Veri yoksa "veri yok" denmeli.**

**E3. Veli girişi yok**
Veli portalına yalnızca linkle erişiliyor; link paylaşan herkes o öğrencinin PDR verilerine dâhil her şeyini görebiliyor. Veli hesabı, doğrulama veya en azından süreli token yok.

### 🟠 Yüksek

**E4. Deneme sonucu elle girilemiyor**
Sonuçlar yalnızca Excel yüklemeyle giriyor. Tek bir öğrencinin tek denemesini eklemek için Excel hazırlamak gerekiyor. Hızlı elle giriş formu yok.

**E5. Öğrenci-veli mesajlaşması yok**
`student_messages` / `coach_messages` var ama veli tarafı yok. Veli portalında yalnızca "Koça WhatsApp'tan yaz" düğmesi var.

**E6. Envanterlerin 20'sinde puanlama ad-hoc**
`calculateResult` bir if-zinciri; her test için ayrı yazılmış. Yeni rapor motoru bunları standart şemaya çeviriyor ama eski fonksiyon hâlâ devrede. İkisi paralel çalışıyor — tek yola indirilmeli.

**E7. AI içeriği hâlâ şablon**
`aiService.js` başlığında "Mock AI Service - Simülasyon" yazıyor. Araştırma/materyal üretimi şablon tabanlı. Pazarlama metinleri "yapay zeka destekli" diyor.

**E8. Chatbot sahte cevap veriyor**
`Chatbot.jsx` → `getMockResponse()`. Öğrenci soru soruyor, şablon cevap alıyor.

### 🟡 Orta

**E9. Modül derinliği dengesiz**
Bazı üst seviye sekmeler içerik olarak zayıf:
- Liderlik Tablosu (170 satır) — sadece sıralama
- Projeler (274 satır) — proje takibi yüzeysel
- Sunumlar (243 satır) — şablon üretimi
- Uzaktan Koçluk (376 satır) — video altyapısı yok, sadece kayıt tutuyor
- Araştırma (180 satır) — mock AI'ye bağlı

**E10. Öğrenci panelinde karne yok**
Koç karneyi görüyor, veli görüyor — öğrenci kendi karnesini göremiyor. Program uyumu, günlük kayıt ve deneme trendini birleştiren görünüm öğrenci tarafında eksik.

**E11. Test sonuç raporu henüz test ekranına bağlı değil**
`TestResultReport` bileşeni ve PDF hazır ama `StudentTestsTab` içindeki sonuç görünümüne bağlanmadı. Şu an eski basit sonuç ekranı görünüyor.

**E12. BEP planı motoru ile yeni süreç arasında köprü yarım**
`BEPGenerator` `onSavePlan` prop'unu henüz çağırmıyor — plan üretiliyor ama BEP Merkezi'ne otomatik kaydolmuyor. Elle kaydetme adımı gerekiyor.

**E13. Öğretmen/veli için ayrı giriş rolü yok**
Sistem koç/öğrenci/admin biliyor. Derse giren öğretmen BEP birimine ekleniyor ama sisteme giremiyor.

**E14. Konu takibi (kazanım işaretleme) yok**
Müfredatta 817 konu var ama öğrencinin hangi konuyu bitirdiğini işaretlediği bir yer yok. `completed_topics_*` anahtarı var ama kullanılmıyor.

### 🔵 Düşük

- **E15.** Yazdırma (print) CSS'i yok; tarayıcıdan yazdırma bozuk çıkıyor
- **E16.** Boş durum ekranları bazı modüllerde yok (kullanıcı boş listeye bakıyor)
- **E17.** Arama/filtreleme yalnızca öğrenci listesinde var; testler, programlar, BEP'te yok
- **E18.** Klavye kısayolu yok
- **E19.** Uygulama tek dilde; i18n altyapısı yok
- **E20.** Test yok (0 test dosyası), CI yok

---

## Bölüm 3 — Önerilen sıra

**Önce (içeriğin doğruluğunu bozanlar):**
1. **E2** — sahte grafik verisini kaldır, "veri yok" durumu koy
2. **E11** — yeni test raporunu ekrana bağla (iş zaten yapıldı, 1 saatlik bağlama)
3. **E12** — BEP planı köprüsünü tamamla
4. **E6** — puanlamayı tek yola indir

**Sonra (eksik yetenekler):**
5. **E4** — elle deneme girişi
6. **E14** — konu/kazanım takibi (817 konu şu an kullanılmıyor)
7. **E10** — öğrenci karnesi
8. **E7/E8** — AI ya gerçek olsun ya iddia düzeltilsin

**En son (ertelediğimiz altyapı):**
9. **E1'in kök nedeni** — koleksiyon bazlı senkron
10. **E3** — veli girişi ve erişim güvenliği
11. Güvenlik fazının tamamı (ilk rapordaki K1-K8)

---

*Bu rapor 2–5. maddelerin tamamlanmasının ardından, uygulamanın tüm kaynak dosyaları taranarak hazırlanmıştır.*
