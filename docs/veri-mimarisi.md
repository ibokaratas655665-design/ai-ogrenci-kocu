# Veri Mimarisi

Bu belge uygulamanın verisinin **nerede oluştuğunu, nerede saklandığını,
kimin okuyabildiğini** ve cihazlar arasında nasıl ulaştığını anlatır.

Son güncelleme: 18.08.2026 (Faz 2)

---

## 1. İki katman

Uygulamada iki farklı veri katmanı var. Bu ayrımı bilmeden hiçbir hata
doğru teşhis edilemez.

### A. Sunucu katmanı — doğruluk kaynağı Firestore

Gerçek koleksiyonlar. Yetki **Firestore kurallarıyla** zorlanır.
localStorage aynası **değildir**.

| Koleksiyon | Belge kimliği | Sahibi | Kim okur |
|---|---|---|---|
| `kullaniciProfil` | Firebase uid | Kullanıcının kendisi | Yalnızca kendisi (+ kurallar) |
| `kocDizin` | Uygulama koç kimliği | Koç | Kimliği doğrulanmış herkes (yalnızca uid çevirisi) |
| `davetler` | 6 haneli kod | Koç | **Herkes** — kodun kendisi sırdır |
| `katilimTalepleri` | Öğrenci uid | Öğrenci oluşturur | Öğrencinin kendisi + ilgili koç |
| `ogrenciKimlik` | Öğrenci uid | Koç yazar | Öğrencinin kendisi + koçu |
| `veliBaglantilari` | 128 bit belirteç | Koç | **Oturumsuz** — belirteç sırdır, süre + iptal kuralda |
| `syncData` | `koc_<kocId>__<anahtar>` | Koç (`sahipUid`) | Sahibi koç + o koçun öğrencileri |

### B. Uygulama katmanı — doğruluk kaynağı localStorage

Uygulamanın çalışan verisi (öğrenci listesi, görevler, programlar,
denemeler…) tarayıcıda tutulur ve `firebaseSync` tarafından
`syncData` altına kopyalanır.

**Bu bir tercih değil, tarihsel bir durumdur.** Uygulama localStorage
üzerine kuruldu; Firestore sonradan yedekleme olarak eklendi. Faz 2'de
merkezi erişim katmanı (`services/veriDeposu.js`) kuruldu ve dosyalar
kademeli olarak oraya taşınıyor.

---

## 2. "Bu verinin sahibi kim?"

| Veri | Sahibi | Nerede | Kim değiştirebilir |
|---|---|---|---|
| Kullanıcı profili | Kullanıcının kendisi | `kullaniciProfil/{uid}` | Kendisi (rol öğrenciyse sunucuda doğrulanır) |
| Koç kaydı | Koç | `users_db` (havuzda) | Koç, ana koç |
| Öğrenci kaydı | **Koç** | `coach_students` (havuzda) | Sahibi koç, ana koç |
| Öğrenci giriş kimliği | Koç yazar, öğrenci kullanır | `ogrenciKimlik/{uid}` | Yalnızca koç |
| Görev | Koç oluşturur, öğrenci tamamlar | `student_tasks` | İkisi de |
| Program | Koç | `program_schedule_<id>` | Koç |
| Deneme sonucu | Öğrenci veya koç girer | `v2_trials_data`, `exams_data` | İkisi de |
| Çalışma kaydı | Öğrenci | `study_log`, `pomodoro_log_*` | Öğrenci |
| Koç notu | Koç | `coach_notes_<id>`, `koc_notu_<id>` | Koç |
| Mesaj | Gönderen | `student_messages` | Taraflar |
| Randevu | Koç | `appointments` | Koç |
| Veli bağlantısı | Koç | `veliBaglantilari/{belirtec}` | Yalnızca koç |
| Veli raporu özeti | Koç üretir | `veliBaglantilari.ozet` | Yalnızca koç |
| Abonelik | Koç | `coach_subscriptions` | Koç (⚠️ sunucuda zorlanmıyor) |
| PDR görüşme dosyası | Rehber öğretmen | `pdr_cases` | Koç |

---

## 3. Veri bir cihazdan diğerine nasıl ulaşır?

### Koç → Öğrenci

```
Koç bir görev atar
  └─ veriDeposu.yaz / localStorage.setItem
       ├─ storage olayı  → koçun kendi ekranı tazelenir
       └─ firebaseSync.syncKey(anahtar)
            └─ syncData/koc_<kocId>__student_tasks   { sahipUid }
                 └─ öğrencinin onSnapshot dinleyicisi
                      └─ öğrencinin localStorage'ına yazılır
                           └─ storage olayı → öğrencinin ekranı tazelenir
```

Öğrenci **koçuyla aynı havuzu** kullanır (`havuzKimligi`), bu yüzden
koçun yazdığını okuyabilir.

### Öğrenci → Koç

Aynı yol ters yönde. Öğrenci de aynı havuza yazar; kural buna izin verir
(`request.resource.data.sahipUid == profil().kocUid`).

### Koç → Veli

```
Koç "Veli Bağlantısı" açar
  └─ veliBaglanti.baglantiAl(ogrenci, buildStudentReport)
       ├─ veliBaglantilari/{belirtec}  oluşturulur
       └─ ozet = { "7": rapor, "30": rapor, "90": rapor }  YAYINLANIR
            └─ veli bağlantıyı açar (oturum yok)
                 └─ yalnızca O BELGEYİ okur
```

**Veliye koçun veri havuzu açılmaz.** Velinin gördüğü her alan bu özete
bilerek konulmuştur.

---

## 4. Onboarding — öğrenci nasıl giriş kazanır?

İki yol var, **ikisi de aynı modele oturur**:

```
YOL 1 — Davetle katılım (serbest davet)
  Koç davet üretir  →  davetler/{KOD}
  Öğrenci katılır   →  Firebase hesabı açılır + katilimTalepleri/{uid}
  Koç onaylar       →  YENİ öğrenci kaydı + ogrenciKimlik/{uid}

YOL 2 — Mevcut öğrenciye giriş açma (bağlı davet)
  Koç "Öğrenci Girişi Aç"  →  davetler/{KOD} + ogrenciId
  Öğrenci katılır          →  Firebase hesabı + katilimTalepleri (ogrenciId taşınır)
  Koç onaylar              →  MEVCUT kayıt güncellenir + ogrenciKimlik/{uid}
                              (yeni kayıt AÇILMAZ, geçmiş veri korunur)
```

**Yaşam döngüsü:** `oluşturuldu` → `davet gönderildi` → `talep bekliyor`
→ `onaylandı` → `aktif`. Öğrenci kaydında `onboardingDurumu` alanıyla
izlenir.

**Çoğalma koruması:** Bağlı davetteki `ogrenciId`, katılım talebindeki
değerle **kuralda** karşılaştırılır. Öğrenci başka bir kayda bağlanamaz.

---

## 5. Yetki modeli

Frontend'deki `accessControl.js` **güvenlik sınırı değildir** — yalnızca
arayüz görünürlüğüdür. Gerçek sınır Firestore kurallarıdır.

| Aktör | Hedef | Sonuç | Nerede zorlanır |
|---|---|---|---|
| Koç A | Kendi öğrencisi | ALLOW | Kural |
| Koç A | Koç B'nin verisi | **DENY** | Kural |
| Öğrenci | Kendi koçunun havuzu | ALLOW | Kural |
| Öğrenci | Başka koçun havuzu | **DENY** | Kural |
| Öğrenci | Kendini koç ilan etme | **DENY** | Kural |
| Öğrenci | Havuzu sahiplenme | **DENY** | Kural |
| Veli | Kendi öğrencisi | ALLOW | Kural (belirteç) |
| Veli | Süresi dolmuş bağlantı | **DENY** | Kural |

Doğrulama: `dogrulama-izolasyon.mjs` (27), `dogrulama-akis.mjs` (23),
`dogrulama-bagli-davet.mjs` (7).

---

## 6. Çakışma stratejisi

Veri modeli anahtar başına **tek belge** (tüm dizi bir arada). Alan
düzeyinde birleştirme mümkün değil.

**Uygulanan strateji:**
- Liste yazımlarında `veriDeposu.kayitGuncelle` kullanılır — tüm listeyi
  değil, yalnızca hedef kaydı değiştirir. İki cihaz farklı öğrencileri
  değiştirdiğinde ikisi de korunur.
- Aynı kaydı aynı anda değiştiren iki cihazda **son yazan kazanır**.
- CRDT gibi bir çözüm bu ürünün ölçeği için aşırıdır.

**Bilinen sınır:** Tüm diziyi yeniden yazan eski çağrı yerleri hâlâ var;
bunlar `veriDeposu`'na taşındıkça risk azalır.

---

## 7. Çıkışta ne olur?

Çıkışta bekleyen yazımlar buluta gönderilir, sonra **veri anahtarları
cihazdan silinir**. Ortak kullanılan bir bilgisayarda ardından giren
kullanıcı öncekinin verisini göremez.

**Korunanlar** (veri değil, cihaz tercihi): `theme_mode`, `veri_donemi`,
`device_id`, `pwa_install_dismissed`, `gemini_api_key`.

---

## 8. Bilinen açıklar

| Konu | Durum |
|---|---|
| Abonelik/kontenjan | İstemcide; sunucuda zorlanmıyor |
| Gemini API anahtarı | Tarayıcıda; Cloud Function'a taşınmalı |
| Kurum (multi-tenant) katmanı | Yok; koç bazlı izolasyon var |
| Ölçek | Koç başına ~20-30 öğrenci; belge boyutu tavanı |
| `koc_notu_<id>` | `DYNAMIC_KEY_PATTERNS`'te yok; toplu senkron atlıyor |
| Eski `global` belgeleri | 11 belge, mevcut havuzun kopyası; temizlenmeyi bekliyor |
