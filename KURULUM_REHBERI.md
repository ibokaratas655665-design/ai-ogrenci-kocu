# AI Öğrenci Koçu - Kurulum ve Dağıtım Rehberi

Bu rehber, AI Öğrenci Koçu uygulamasının hem bilgisayar (Windows) hem de telefon (Android) için kurulum dosyalarının nasıl oluşturulacağını anlatır.

## 1. Masaüstü (Windows .exe) Kurulumu

Uygulamanın Windows kurulum dosyasını oluşturmak için:

1.  Terminali açın (VS Code içinde Ctrl+` veya Terminal > New Terminal).
2.  Aşağıdaki komutu çalıştırın:
    ```bash
    npm run electron:build
    ```
3.  İşlem tamamlandığında, `dist-electron` klasörü içinde kurulum dosyasını bulabilirsiniz:
    - **Dosya Yolu:** `dist-electron/Ibrahim Karatas Egitim Kocu Setup 0.0.0.exe`
    - Bu dosyayı çift tıklayarak bilgisayarınıza kurabilirsiniz.

## 2. Mobil (Android .apk) Kurulumu

Android uygulaması oluşturmak için `Android Studio` gereklidir.

1.  **Senkronizasyon (Kodları Güncelleme):**
    Her kod değişikliğinden sonra terminalde şu komutu çalıştırın:
    ```bash
    npx cap sync
    ```
    *(Bu komut, web kodlarınızı Android projesine kopyalar)*

2.  **Android Projesini Açma:**
    Aşağıdaki komutla Android Studio projesini açın:
    ```bash
    npx cap open android
    ```

3.  **APK Oluşturma (Android Studio İçinde):**
    - Android Studio açıldığında, üst menüden **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)** seçeneğine tıklayın.
    - İşlem bittiğinde sağ altta çıkan bildirimde "locate" linkine tıklayarak `.apk` dosyasını bulabilirsiniz.
    - Bu dosyayı telefonunuza gönderip kurabilirsiniz.

## Sorun Giderme

- **"npm çalışmıyor" Hatası:** Eğer hata alırsanız komutun başına `.cmd` ekleyin (örn: `npm.cmd` veya `npx.cmd`).
- **Build Başarısız Olursa:** Terminaldeki hata mesajını kontrol edin. Genellikle açık kalan dosyalar veya antivirüs programları build işlemini engelleyebilir.
