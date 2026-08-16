# AI Öğrenci Koçu — Teknik İnceleme ve Rekabet Analizi Raporu

**Tarih:** 16 Ağustos 2026
**İncelenen sürüm:** `main` @ `819afd3`
**Kapsam:** Kaynak kod incelemesi (55.151 satır, 169 dosya) + Türkiye pazarındaki 5 rakip platform karşılaştırması

---

## 1. Yönetici Özeti

Uygulama **özellik genişliği bakımından Türkiye'deki ticari rakiplerin çoğunu geçiyor.** PDR/rehberlik modülleri (BEP üreteci, sosyometri, rehberlik envanterleri, PDR vaka takibi) hiçbir rakipte bu derinlikte yok — bu, ürünün gerçek ve savunulabilir farkı.

Ancak ürün şu anda **gerçek bir kimlik doğrulaması ve veri güvenliği katmanına sahip değil.** Üç bulgu tek başına canlı kullanımı riskli hale getiriyor:

| # | Bulgu | Sonuç |
|---|-------|-------|
| 1 | Firestore kuralları tamamen açık (`allow read, write: if true`) | Proje kimliğini bilen herkes tüm öğrenci verisini okuyabilir/silebilir |
| 2 | Giriş doğrulaması tarayıcı tarafında, `"123"` evrensel bypass'ı var | Okul numarasını bilen herkes o öğrenci olarak girebilir |
| 3 | Rol bilgisi `localStorage`'da tutuluyor | Kullanıcı DevTools'tan kendini `admin` yapabilir |

Bunlar KVKK açısından da ciddi: sistemde **reşit olmayan öğrencilerin PDR/rehberlik kayıtları** var; bu veri kategorisi "özel nitelikli kişisel veri" sayılır.

**Kısa yorum:** Ürün fikri ve kapsamı güçlü, altyapısı prototip seviyesinde. Öncelik yeni özellik değil, mevcut özelliklerin altına sağlam bir zemin koymak.

---

## 2. Uygulamanın Mevcut Durumu

### 2.1 Teknoloji

| Katman | Kullanılan |
|--------|-----------|
| Frontend | React 19, Vite 7, Tailwind 3, React Router 7 (HashRouter) |
| Veri | localStorage (birincil) + Firestore (yedek/senkron) |
| Dağıtım | Netlify + Firebase Hosting, Electron (Windows), Capacitor (Android) |
| Dışa aktarma | PDF (jsPDF, html2pdf), PPTX, DOCX, XLSX |
| Grafik | Recharts |
| AI | Gemini API (tarayıcıdan doğrudan) + şablon tabanlı sahte servis |

### 2.2 Güçlü yönler

- **PDR/rehberlik derinliği** — `BEPGenerator`, `SociometryNetworkMap`, `GuidanceTests`, `GuidanceForms`, `PDRWorkflowModule`. Rakiplerin hiçbirinde BEP veya sosyometri yok.
- **Çok geniş modül seti** — deneme analizi, program üretici, oyunlaştırma (rozet/seviye/streak/liderlik), veli portalı + QR, pomodoro, grup/proje yönetimi, sunum üretici, uzaktan koçluk.
- **Offline-first** — internet olmadan çalışıyor, IndexedDB kalıcı önbellek açık.
- **Çok platform** — Web + PWA + Windows (Electron) + Android (Capacitor). Rakiplerin çoğu sadece web.
- **Zengin veri dosyaları** — müfredat, konu ağırlıkları, üniversite taban puanları, OBP, BEP verileri hazır.
- **Sağlam hata yakalama** — `GlobalErrorBoundary`, `safeParse` ile beyaz ekran koruması.
- **Maliyet sıfır** — öğrenci başına lisans ücreti yok (rakipler 2.500–7.500 ₺/ay).

---

## 3. Tespit Edilen Eksikler

### 🔴 Kritik (canlı kullanımdan önce mutlaka çözülmeli)

**K1. Firestore veritabanı herkese açık**
`firestore.rules:6-8`
```
match /{document=**} { allow read, write: if true; }
```
Firebase proje ID'si (`ai-ogrenci-kocu-b037b`) zaten JS paketinin içinde açıkta. Bu kural setiyle **herhangi biri tüm öğrenci verisini indirebilir, değiştirebilir veya silebilir.** Yorum satırı "TEST AŞAMASI" diyor ama uygulama canlıda.

**K2. Gerçek kimlik doğrulama yok**
`src/services/hybridAuth.js`, `src/services/api.js`
- `hybridAuth.js:203` → `if (inp === '123') return true; // evrensel bypass`
- `api.js:62` ve `api.js:91` → `password === '123'` her öğrenci için geçerli
- `hybridAuth.js:210-212` → isim eşleşmesi parça/ön-ek bazlı; "ah" yazmak "Ahmet Yılmaz"ı açar
- Firebase Auth kurulu ama **giriş akışında kullanılmıyor**; doğrulama tamamen tarayıcıdaki listeyle yapılıyor

Pratik sonuç: bir okul numarası + herhangi bir isim parçası = o öğrencinin hesabı.

**K3. Yönetici girişi zayıf**
`hybridAuth.js:46-51`
- Varsayılan şifre `admin123`, `localStorage`'da düz metin
- `phone === 'ibokaratas655665@gmail.com'` **şifre kontrolünü tamamen atlıyor**
- Okul adı ("şamran" içeren herhangi bir metin) da admin şifresi yerine geçiyor

**K4. Rol yükseltme (privilege escalation)**
`AuthContext.jsx:17-20` oturumu `localStorage.user_session`'dan okuyor, `App.jsx:247` bu roldeki değere göre yetki veriyor. Kullanıcı konsolda tek satırla `role: "admin"` yazıp yönetici paneline girebilir. Sunucu tarafında hiçbir kontrol yok.

**K5. Öğrenci şifreleri düz metin**
`hybridAuth.js:437-442` — `password` alanı hash'lenmeden Firestore'a yazılıyor. K1 ile birleşince tüm şifreler açıkta.

**K6. Tek global veri havuzu — kullanıcı izolasyonu yok**
`firebaseSync.js:21-25`
```js
const getBucketId = (userId) => { return 'global'; }
```
Kim giriş yaparsa yapsın **okulun tüm verisi** (tüm öğrenciler, PDR vakaları, deneme sonuçları, mesajlar) o cihazın localStorage'ına iniyor. Bir öğrencinin telefonunda diğer tüm öğrencilerin rehberlik kayıtları bulunuyor.

**K7. KVKK uyumu yok**
- Aydınlatma metni, açık rıza akışı, veli onayı (18 yaş altı) yok
- Veri saklama/silme politikası yok, "verilerimi sil" akışı yok
- Denetim kaydı (audit log) yok — kimin hangi PDR kaydını görüntülediği izlenmiyor
- Üretimde 142 adet `console.log` var; öğrenci verisi tarayıcı konsoluna dökülüyor

**K8. Gemini API anahtarı tarayıcıda**
`geminiAI.js:6`, `geminiService.js`, `AICoachChat.jsx:244` — anahtar `localStorage`'dan okunup URL'de gönderiliyor. Anahtar herkese görünür; kota/fatura suistimali mümkün.

---

### 🟠 Yüksek öncelikli

**Y1. Senkronizasyon mimarisi veri kaybına açık**
`firebaseSync.js` her localStorage anahtarını **tek bir Firestore dokümanına dev JSON blob** olarak yazıyor. Sonuçları:
- İki koç aynı anda öğrenci eklerse **son yazan diğerini eziyor** (alan bazlı birleştirme yok)
- Firestore 1 MiB doküman limiti → LZ sıkıştırma geçici çare, veri büyüdükçe duvara toslar
- `PROTECTED_KEYS` içindeki "daha uzun dizi kazanır" mantığı (`firebaseSync.js:162-169`) silme işlemlerini de engelliyor — silinen öğrenci geri gelebilir
- 2 dakikada bir ~30 doküman yazımı → gereksiz Firestore maliyeti

**Y2. `gemini-pro` modeli artık çalışmıyor**
`geminiAI.js:55` — `v1beta/models/gemini-pro` emekliye ayrıldı. Bu kod yolu bugün hata veriyor. `AICoachChat.jsx` `gemini-2.0-flash` kullanıyor, yani kod tabanında **üç farklı Gemini entegrasyonu** var ve biri ölü.

**Y3. "Yapay zeka" iddiası ile gerçek arasında fark var**
`aiService.js:1-3` → *"Mock AI Service - Simülasyon. Gerçek bir API olmadığı için şablon veriler ve basit algoritmalarla içerik üretir."*
Buna karşın `index.html` ve `manifest.json`: *"Türkiye'nin ilk ve tek yapay zeka destekli öğrenci koçluğu sistemi."* Kopilot zaten "ilk AI destekli platform" iddiasında ve gerçek LLM kullanıyor. Bu iddia hem savunulamaz hem de tüketici mevzuatı açısından riskli.

**Y4. PWA offline çalışmıyor**
`PWAInstallBanner.jsx:160` `/sw.js` kaydetmeye çalışıyor ama **`public/sw.js` dosyası yok** ve `dist/` içinde de üretilmiyor. Kayıt 404 alıyor; "offline çalışır" vaadi web tarafında geçersiz.

**Y5. İndirme bağlantıları kırık**
`LandingPage.jsx:151,162` → `/downloads/ai-ogrenci-kocu.apk` ve `.../windows.zip`. `public/downloads/` klasöründe sadece bir `.docx` var. Depodan yapılan her dağıtımda bu linkler 404 verecek.

**Y6. Tek okula gömülü (single-tenant)**
"Şamran Anadolu Lisesi" 7 dosyada sabit kodlanmış; kayıt akışı başka okulu reddediyor (`hybridAuth.js:364-371`). Ürünü ikinci bir okula satmak için kod değişikliği gerekiyor.

---

### 🟡 Orta öncelikli

| Konu | Detay |
|------|-------|
| **Test yok** | 0 test dosyası, CI yok, lint dışında otomatik kontrol yok. 55k satırda regresyon riski çok yüksek. |
| **Paket boyutu** | `dist` 9,4 MB. `CoachDashboard` tek başına 878 KB, `pdf.worker` 1,9 MB. Mobil bağlantıda ilk açılış yavaş. |
| **Dev dosyalar** | `CoachDashboard.jsx` 3.043 satır, `AdvancedExamsTab.jsx` 2.833 satır. Bakım ve hata ayıklama zor. |
| **Veri katmanı yok** | 74 dosyada 462 doğrudan `localStorage` çağrısı. Sunucuya geçmek istendiğinde her dosyaya dokunmak gerekir. |
| **Ortam değişkeni yok** | `.env` yok; Firebase config ve anahtarlar kodun içinde. Test/canlı ayrımı yapılamıyor. |
| **Manifest kısayolları kırık** | `manifest.json` `/student` ve `/coach` gösteriyor, uygulama HashRouter kullanıyor (`#/student/dashboard`). |
| **Hata izleme yok** | Sentry benzeri bir servis yok; kullanıcıdaki çökmeler görünmüyor. |
| **`dataProtection.js`** | Kullanıcıdan "İbrahim Karataş" yazmasını isteyen onay kutusu — kullanıcı hatasına karşı iyi, güvenlik değil. |
| **Oturum süresi** | 8 saat hareketsizlik. Ortak kullanılan okul bilgisayarları için uzun. |

---

### 🔵 Ürün/özellik boşlukları (rakiplere göre)

- Soru bankası / soru çözüm desteği yok
- Konu anlatım videosu yok
- Gerçek zamanlı mesajlaşma ve görüntülü görüşme yok (modül var, altyapı yok)
- WhatsApp entegrasyonu yok — Atlas Rehberlik'in ana silahı
- Mobil push bildirim yok (Capacitor var ama FCM kurulu değil)
- Muhasebe/tahsilat modülü yok — DB Takip'te var, kurumsal satışta belirleyici
- Türkiye geneli ortak deneme havuzu yok
- Google Play / App Store'da yok — sadece APK yandan yükleme

---

## 4. Türkiye'deki 5 Öne Çıkan Platform

> Not: Pazarda iki farklı iş modeli var — **hizmet şirketleri** (koç istihdam edip aylık abonelikle öğrenciye satar) ve **yazılım sağlayıcıları** (paneli koça/kuruma satar). Sizin ürününüz ikinci gruba giriyor, o yüzden her ikisinden de örnek aldım.

### 1. Kopilot Rehberlik — pazar lideri (hizmet + AI)
- **Model:** Aylık abonelik, PDR mezunu koçlar + AI danışman
- **Öne çıkan:** 1 milyondan fazla öğrenci görüşmesi; haftada 2 birebir görüşme, sınırsız soru çözüm, binlerce video, Türkiye geneli denemeler, forum, ödül sistemi, kurumsal panel
- **Fiyat:** ~3.299 ₺/ay (paketlere göre 2.500–2.800 ₺ aralığı da var), 14 gün koşulsuz iade
- **Zayıf yönü:** Okul rehberlik servisi iş akışlarına (BEP, sosyometri, MEB envanterleri) hitap etmiyor

### 2. Atlas Rehberlik — en geniş sınav kapsamı
- **Model:** Online koçluk + "UniKoç Paneli"
- **Öne çıkan:** 7/24 WhatsApp takibi (öğrencinin gönderdiği ekran görüntüsü panele günlük takip olarak işleniyor), haftalık birebir görüşme, veli paneli ve aylık raporlama
- **Kapsam:** YKS, LGS, ara sınıflar, KPSS, AGS, DGS, YDS, YÖKDİL, MSÜ
- **Fiyat:** Aylık paketler, 12 taksit imkânı
- **Öğrenilecek ders:** WhatsApp'ı iş akışının merkezine koymuş — Türkiye'de en yüksek katılım oranını bu sağlıyor

### 3. DB Takip — en yakın doğrudan rakip (yazılım)
- **Model:** Kurumlara ve bağımsız koçlara satılan SaaS
- **Öne çıkan:** Merkezi yönetim, detaylı sınav analizi, **e-Hata Defteri**, yapay zeka destekli program üretimi, sistem içi mesajlaşma + sesli/görüntülü görüşme, otomatik yoklama, **muhasebe ve gelir-gider modülü**
- **Paketler:** Kurumsal / Koçlar / Deneme Kulübü
- **Fiyat:** Açık değil, demo üzerinden
- **Not:** Sizin ürününüzle en çok örtüşen platform. İki farkı: muhasebe modülü ve dahili görüntülü görüşme.

### 4. CanlıKoç — mobil-öncelikli, ücretsiz giriş
- **Model:** Öğrenci + öğretmen uygulaması (iOS & Android)
- **Öne çıkan:** Günlük çalışma/soru takibi, streak ve puan sistemi, arkadaşlarla challenge, tek tıkla ödev atama, haftalık rapor; LGS/YKS puan hesaplama, **tercih robotu**, taban puanlar, geri sayaç
- **Ölçek:** 1.000+ öğrenci, 300+ öğretmen
- **Fiyat:** Lansmana özel ücretsiz
- **Öğrenilecek ders:** App Store/Play Store'da yayında olmak ve ücretsiz giriş katmanı — sizin en büyük dağıtım eksiğiniz burada

### 5. 360 Koçluk — metodoloji + yazılım paketi
- **Model:** Yazılım + koç eğitimi bir arada satılıyor
- **Öne çıkan:** Ders/konu/süre/soru bazlı analiz, kısa-orta-uzun vadeli planlama, **22 saatlik eğitmen eğitimi videosu**, koçluk planlama defteri, 360 Tanıma Envanteri
- **Hedef:** Kurum yöneticileri, rehber öğretmenler, psikolojik danışmanlar
- **Fiyat:** Açık değil, iletişim üzerinden
- **Öğrenilecek ders:** Yazılımı tek başına değil, "yöntem + eğitim + yazılım" paketi olarak satıyor — okullara satışta çok daha güçlü bir teklif

> **Onur listesi:** Rehber Panda (30 sınav kapsamı, 4.000–7.500 ₺/ay paketler), Ünikazan, Milet Akademi, koclukprogrami.com (LGS masaüstü yazılımı).

---

## 5. Karşılaştırma Tablosu

| Kriter | **Sizin Uygulama** | Kopilot | Atlas | DB Takip | CanlıKoç | 360 Koçluk |
|---|---|---|---|---|---|---|
| Deneme analizi | ✅ Çok detaylı | ✅ | ✅ | ✅ | ✅ | ✅ |
| Program üretici | ✅ (AI iddialı) | ✅ AI | ✅ | ✅ AI | ✅ | ✅ |
| Ödev/görev takibi | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Veli portalı | ✅ (+QR) | ✅ | ✅ | ✅ | ➖ | ✅ |
| Oyunlaştırma | ✅ Güçlü | ✅ | ➖ | ➖ | ✅ Güçlü | ➖ |
| **PDR / BEP / sosyometri** | ✅ **Benzersiz** | ❌ | ❌ | ❌ | ❌ | ⚠️ Envanter var |
| Rehberlik envanterleri | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ Kısmi |
| Soru bankası | ❌ | ✅ | ✅ | ✅ | ➖ | ❌ |
| Video ders | ❌ | ✅ 400+ saat | ➖ | ➖ | ❌ | ✅ Koç eğitimi |
| Görüntülü görüşme | ❌ | ✅ | ✅ | ✅ | ➖ | ➖ |
| WhatsApp entegrasyonu | ❌ | ➖ | ✅ **Ana özellik** | ➖ | ➖ | ➖ |
| Mobil uygulama | ⚠️ APK (mağaza yok) | ✅ | ✅ | ✅ | ✅ **iOS+Android** | ➖ |
| Masaüstü uygulama | ✅ Windows | ❌ | ❌ | ❌ | ❌ | ✅ |
| Offline çalışma | ✅ | ❌ | ❌ | ❌ | ❌ | ➖ |
| Muhasebe/tahsilat | ❌ | ➖ | ➖ | ✅ | ❌ | ➖ |
| Türkiye geneli deneme | ❌ | ✅ | ✅ | ✅ | ➖ | ➖ |
| **Sunucu tarafı güvenlik** | ❌ **Yok** | ✅ | ✅ | ✅ | ✅ | ✅ |
| Çok kurumlu (multi-tenant) | ❌ Tek okul | ✅ | ✅ | ✅ | ✅ | ✅ |
| Fiyat | Ücretsiz/kendi | ~3.299 ₺/ay | Aylık+taksit | Demo | Ücretsiz | Teklif |

**Okuma:** Özellik sayısında zaten yarışıyorsunuz, hatta rehberlik tarafında öndesiniz. Kaybettiğiniz üç kalem: **güvenli altyapı, mağaza dağıtımı ve içerik (soru/video).** İlki zorunlu, ikincisi kolay, üçüncüsü pahalı — ve aslında sizin konumlanmanız için gerekli değil.

---

## 6. Öneriler

### Konumlandırma önerisi

Kopilot ve Atlas'la "koçluk hizmeti" olarak yarışmayın — onlar koç istihdam eden servis şirketleri, siz yazılımsınız. Doğru konum:

> **"Okul rehberlik servisleri için koçluk + PDR yazılımı"**

Çünkü BEP üreteci, sosyometri, MEB rehberlik envanterleri ve PDR vaka takibini **hiçbir rakip sunmuyor**, ve bunlar rehber öğretmenin zaten yapmak zorunda olduğu işler. Rakiplerin hepsi "sınav koçluğu" yapıyor; siz "rehberlik servisinin tamamı"nı yapabilirsiniz. 360 Koçluk'un modelini örnek alın: yazılım + yöntem + eğitim paketi olarak okullara satın.

### Yol haritası

**Aşama 0 — Güvenlik (2–4 hafta, ertelenemez)**
1. Firestore kurallarını yaz: rol + kullanıcı bazlı okuma/yazma izni (`K1`)
2. Firebase Authentication'ı gerçekten devreye al; `"123"` bypass'larını ve sabit admin şifresini kaldır (`K2`, `K3`)
3. Rol bilgisini Firebase custom claims'e taşı, `localStorage`'dan okumayı bırak (`K4`)
4. Öğrenci şifrelerini düz metin saklamayı bırak (`K5`)
5. Gemini çağrılarını Cloud Function arkasına al, anahtarı tarayıcıdan çıkar (`K8`)
6. Üretim derlemesinde `console.log`'ları temizle
7. KVKK aydınlatma metni + veli açık rızası akışı ekle (`K7`)

**Aşama 1 — Sağlamlaştırma (1–2 ay)**
8. Veri modelini blob yerine gerçek Firestore koleksiyonlarına taşı (`Y1`) — en azından `coach_students`, `student_tasks`, `pdr_cases` için
9. Bucket'ı `global`'den kurum/koç bazlı ayır (`K6`, `Y6`)
10. Ölü `gemini-pro` yolunu sil, tek bir AI servisinde birleştir (`Y2`)
11. `sw.js` üret (`vite-plugin-pwa`) ve APK/ZIP dosyalarını yerine koy (`Y4`, `Y5`)
12. Pazarlama metinlerini gerçekle hizala — ya `aiService`'i gerçek LLM'e bağla ya iddiayı yumuşat (`Y3`)
13. Kritik akışlar için test yaz (giriş, öğrenci ekleme, senkron, puan hesaplama) + GitHub Actions

**Aşama 2 — Büyüme (3–6 ay)**
14. Çok kurumlu yapıya geç — okul kaydı, koç davet akışı
15. Google Play'e yayınla (CanlıKoç bunu yapıyor, en büyük dağıtım avantajı)
16. FCM push bildirim
17. WhatsApp Business API entegrasyonu (Atlas'ın en güçlü tarafı, Türkiye'de katılımı en çok artıran kanal)
18. Kurumsal satış için basit tahsilat/abonelik modülü (DB Takip'in farkı)
19. `CoachDashboard` gibi dev dosyaları böl, `dist` boyutunu düşür

---

## Kaynaklar

- [Kopilot Rehberlik](https://kopilotrehberlik.com/) · [Kurumsal](https://kopilotrehberlik.com/kurumsal)
- [Atlas Rehberlik](https://www.atlasrehberlik.com/) · [YKS Koçluk paketleri](https://www.atlasrehberlik.com/kocluk-paketleri/yks-kocluk/)
- [DB Takip](https://dbtakip.com/)
- [CanlıKoç](https://canlikoc.com/) · [Koçluk takip sistemi nedir](https://canlikoc.com/blog-kocluk-takip-sistemi-nedir.php)
- [360 Koçluk](https://www.360kocluk.com/)
- [Rehber Panda — Kopilot karşılaştırması](https://rehberpanda.com/blog/2026-kopilot-rehberlik-mi-rehber-panda-mi-kocluk-karsilastirma/)
- [koclukprogrami.com](https://koclukprogrami.com/)
