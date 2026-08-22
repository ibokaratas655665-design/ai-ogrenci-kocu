# PDR / Rehberlik Modülü Arşivi

**Tarih:** 22.08.2026
**Neden:** Ürün "Başarı Kampı Koçluk Platformu" olarak yalnızca koçluk
işine odaklandı; PDR (okul rehberlik servisi) bölümü aktif uygulamadan
çıkarıldı. Talimat gereği HİÇBİR VERİ SİLİNMEDİ — yalnızca kod arşive
taşındı.

## Bu klasörde ne var?

`src/` altındaki yapı, dosyaların orijinal konumlarını birebir korur.
Örn. `archive/pdr_module/src/pages/GuidancePage.jsx` eskiden
`src/pages/GuidancePage.jsx` idi.

- **Sayfalar:** GuidancePage, GuidanceServiceTab, ResearchPage,
  PublicTestEntry (halka açık envanter), PublicResultView (paylaşım linki)
- **Bileşenler:** DecimalFolderTab (10 resmî dosya), PdrOgrenciHavuzu,
  SosyometriPaneli, BEPCenter, BEPGenerator, GuidanceCenter,
  SociometryNetworkMap, WorkflowTab, MaterialTab, TeacherSchedulerTab,
  InstitutionPanel, research/ (sunum-broşür üretici)
- **Servisler:** pdrArchiveService, pdrOgrencileri (+testi), bepService
- **Veri:** pdrDecimalPlan, bepCurriculum, bepData, mebStandards
- **Yardımcılar:** bepPdf, sociometryAnalysis, mebDocument

## Arşivlenmeyen (aktif üründe kalan) komşular

- `src/services/guidanceService.js`, `src/data/tests.js`,
  `src/data/mebGuidanceForms.js` — Envanter özelliği koçluk tarafında
  kullanılmaya devam ediyor (öğrenci Envanter sekmesi, görev atama).
- `src/services/halkaAcikGonderim.js` — OBP girişi (koçluk) de kullanıyor.
- `RiskAlarmPanel`, `AppointmentSystem`, `GroupsTab` — koçluk ekranlarında da
  çalışan ortak bileşenler.

## Veri anahtarları (Firestore/localStorage) — SİLİNMEDİ

`pdr_archive`, `pdr_students`, `pdr_cases`, `pdr_materials`, `pdr_events`,
`bep_data`, `guidance_sessions`, `public_test_submissions`,
`test_result_sociometry_*`, `coach_active_section`.
`firebaseSync.js` SYNC_KEYS listesinde de bilinçli olarak bırakıldılar:
mevcut bulut verisi yerinde durur ve modül geri getirilirse kaldığı
yerden senkron olur.

## Geri getirme (özet)

1. Bu klasördeki `src/` içeriğini aynı yollara geri taşı (`git mv`).
2. `App.jsx` rotalarını ve `CoachDashboard.jsx` içindeki
   `NAV_BY_SECTION.pdr`, `pdrModulleri`, render bloklarını git
   geçmişinden geri al (arşivleme commit'inin tersini uygula).
3. `accessControl.js` içindeki `BOLUMLER.pdr` tanımını ve
   `erisilenBolumler` bölüm mantığını geri al.
4. Referans commit: "PDR modülü arşive taşındı" (22.08.2026).
