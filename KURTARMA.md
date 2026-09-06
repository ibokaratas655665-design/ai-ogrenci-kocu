# 🛟 Başarı Kampı Koçluk Platformu — Kurtarma Rehberi

Bu belge tek bir soruyu cevaplar: **bilgisayar çökerse, disk formatlanırsa
ya da telefon/ tarayıcı değişirse ne yapacağım?**

---

## 1. Neyin nerede olduğu (kayıp riski sırasıyla)

| Varlık | Nerede duruyor | Bilgisayar giderse ne olur |
|---|---|---|
| **Uygulama kodu** | GitHub: `ibokaratas655665-design/ai-ogrenci-kocu` | ✅ Kaybolmaz |
| **Canlı site** | Firebase Hosting: https://ai-ogrenci-kocu-b037b.web.app | ✅ Kaybolmaz |
| **Öğrenci/deneme/program verisi** | Önce tarayıcıda (localStorage), oturum açıkken buluta (Firestore) kopyalanır | ⚠️ Bulut kopyası yoksa **kaybolur** |
| **Yedek dosyası (.json)** | Koçun kendi bilgisayarı / bulut diski | ⚠️ Nereye kaydettiyseniz |
| **Firebase hesabı** | Google hesabı (ibokaratas655665@gmail.com) | ✅ Kaybolmaz |

> **En kritik nokta:** Veri öncelikle *tarayıcıda* yaşıyor. Bulut senkronu
> ancak internet **ve** açık oturum varken çalışır. Bu yüzden düzenli
> **yedek dosyası** almak tek gerçek güvencedir.

---

## 2. Rutin: haftada bir yedek al (30 saniye)

1. Koç panelinde sağ üstteki **hesap menüsünü** aç.
2. **"Yedek dosyası indir"**e tıkla.
3. İnen `basari-kampi-yedek-YYYY-AA-GG.json` dosyasını
   **bilgisayarın dışında** bir yere koy: Google Drive, OneDrive,
   e-posta ya da USB. (Aynı diskte durursa disk gidince o da gider.)

Uygulama 14 günden uzun süredir yedek alınmadıysa panelde hatırlatır.

---

## 3. Felaket sonrası: sıfır bilgisayarda kurulum

### 3a. Sadece veriyi geri almak istiyorsan (en sık durum)
Kod ve site zaten ayakta; yeni bilgisayarda tarayıcıdan siteye gir:

1. https://ai-ogrenci-kocu-b037b.web.app adresine gir, hesabınla giriş yap.
2. Hesap menüsü → **"Buluttan geri yükle"** (oturumun daha önce
   senkronlandıysa veriler iner).
3. Eksik varsa: Hesap menüsü → **"Yedek dosyasından geri yükle"** →
   sakladığın `.json` dosyasını seç. Dosyanın tarihi ve içeriği
   (kaç öğrenci, kaç deneme) onay ekranında gösterilir.

### 3b. Geliştirme ortamını yeniden kurmak istiyorsan

```bash
git clone https://github.com/ibokaratas655665-design/ai-ogrenci-kocu.git
cd ai-ogrenci-kocu
npm install
npm run dev
```

Yayına almak için (Google hesabıyla bir kez giriş ister):

```bash
npm run build
npx -y firebase-tools login
npx -y firebase-tools deploy --only hosting
```

> Firebase yapılandırması (`src/firebaseConfig.js`) depoda olduğu için
> ayrıca bir anahtar dosyası taşımaya gerek yok. Gemini API anahtarı
> kullanıcıya özeldir ve uygulama içinden yeniden girilir
> (https://aistudio.google.com/apikey).

---

## 4. Kontrol listesi — şimdi yapılacaklar

- [ ] Bir kez **yedek dosyası indir** ve buluta yükle
- [ ] Yedeği **geri yükleyerek dene** (başka tarayıcıda/gizli pencerede)
- [ ] GitHub deposunun güncel olduğunu doğrula: `git status` temiz olmalı
- [ ] Firebase hesabının kurtarma e-postası/telefonu güncel olsun

---

## 5. Sık karşılaşılan durumlar

**"Veriler kayboldu, panel boş geldi."**
Önce çıkış yapıp yeniden gir (senkron yeniden kurulur). Düzelmezse
hesap menüsü → "Buluttan geri yükle". O da boşsa yedek dosyasından yükle.

**"Yedeği yükledim ama eski veriler geri geldi."**
Geri yükleme her kayda taze zaman damgası basar; bulut artık yerel
kopyayı daha yeni sayar. Yine de sorun sürerse önce çıkış yap, geri
yüklemeyi tekrarla, sonra giriş yap.

**"Tarayıcı verisini temizledim."**
localStorage silinir. Bulut kopyası ya da yedek dosyası tek çıkış yolu.

**"Telefon ve bilgisayarda farklı veri görünüyor."**
İki cihaz da aynı hesapla giriş yapmalı; senkron 2 dakikada bir çalışır.
Hangisi güncelse orada yedek al, diğerine o dosyayı yükle.
