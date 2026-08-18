/**
 * 🗄️ VERİ DEPOSU — tek veri erişim katmanı
 *
 * ═════════════════════════════════════════════════════════════════
 * NEDEN VAR
 * ═════════════════════════════════════════════════════════════════
 *
 * Uygulamada 505 doğrudan `localStorage` çağrısı, 107 dosyaya dağılmış
 * durumda. Her bileşen anahtarı kendi biliyor, kendi ayrıştırıyor, kendi
 * senkron ediyor. Sonuçları bu oturumda tek tek yaşadık:
 *
 *   · Aynı veri İKİ AYRI ANAHTARDA tutuluyordu (`messages` ve
 *     `student_messages`) — koçun gönderdiği toplu mesaj öğrenciye hiç
 *     ulaşmadı çünkü biri senkronlanıyor, diğeri senkronlanmıyordu.
 *   · Yeni bir anahtar açan özellik `SYNC_KEYS` listesine eklenmeyi
 *     unutunca veri sessizce cihazda kaldı (`parent_links`,
 *     `appointments`, `coach_subscriptions`).
 *   · Bozuk JSON her çağrı yerinde ayrı ayrı ele alınıyor, bazı yerlerde
 *     hiç ele alınmıyordu.
 *
 * Bu katman tek doğru giriş noktasıdır. Yeni kod doğrudan `localStorage`
 * çağırmaz; buradan geçer.
 *
 * ═════════════════════════════════════════════════════════════════
 * KADEMELİ GEÇİŞ — MEVCUT KOD BOZULMAZ
 * ═════════════════════════════════════════════════════════════════
 *
 * 107 dosya tek seferde değiştirilmez. Bu katman mevcut anahtarların
 * ÜZERİNE oturur: aynı anahtarları, aynı biçimde okur ve yazar. Yani
 * eski kod ile yeni kod aynı veriyi görür. Dosyalar zamanla, teker teker
 * buraya taşınır; taşınmayanlar çalışmaya devam eder.
 *
 * ═════════════════════════════════════════════════════════════════
 * ÇAKIŞMA STRATEJİSİ
 * ═════════════════════════════════════════════════════════════════
 *
 * Uygulamanın veri modeli anahtar başına TEK BELGE (tüm dizi bir arada).
 * Bu modelde alan düzeyinde birleştirme mümkün değil; gerçekçi strateji
 * "son yazan kazanır" + kayıt düzeyinde birleştirmedir:
 *
 *   · Liste yazımlarında `kayitGuncelle` kullanılır — tüm listeyi değil,
 *     YALNIZCA hedef kaydı değiştirir. İki cihaz farklı öğrencileri
 *     değiştirdiğinde ikisi de korunur.
 *   · Aynı kaydı aynı anda değiştiren iki cihazda son yazan kazanır.
 *     CRDT gibi bir çözüm bu ürün için aşırıdır.
 */

const NORMAL = { dizi: [], nesne: {} };

/** Depo olayları — bileşenler bunu dinleyerek tazelenir. */
const olayYay = (anahtar, deger) => {
    try {
        window.dispatchEvent(new StorageEvent('storage', { key: anahtar, newValue: deger }));
    } catch { /* eski tarayıcı */ }
};

/** Buluta yaz. Senkron kapalıysa sessizce geçilir — çevrimdışı çalışır. */
const buluta = (anahtar) => {
    try { window.firebaseSync?.syncKey?.(anahtar); } catch { /* senkron yoksa sorun değil */ }
};

// ══════════════════════════════════════════════════════════════
//  TEMEL OKUMA / YAZMA
// ══════════════════════════════════════════════════════════════

/**
 * Anahtarı okur. Bozuk JSON uygulamayı ASLA çökertmez.
 *
 * Eski kodda bazı yerlerde `JSON.parse` korumasızdı; tek bozuk kayıt
 * beyaz ekrana yol açıyordu.
 */
export const oku = (anahtar, varsayilan = null) => {
    try {
        const ham = localStorage.getItem(anahtar);
        if (ham == null || ham === '' || ham === 'undefined' || ham === 'null') return varsayilan;
        const v = JSON.parse(ham);
        return v ?? varsayilan;
    } catch {
        console.warn(`veriDeposu: ${anahtar} bozuk, varsayılana dönüldü.`);
        return varsayilan;
    }
};

export const listeOku = (anahtar) => {
    const v = oku(anahtar, NORMAL.dizi);
    return Array.isArray(v) ? v : NORMAL.dizi;
};

export const nesneOku = (anahtar) => {
    const v = oku(anahtar, NORMAL.nesne);
    return v && typeof v === 'object' && !Array.isArray(v) ? v : NORMAL.nesne;
};

/**
 * Anahtarı yazar, arayüzü haberdar eder ve buluta gönderir.
 *
 * Üç adımın birlikte yapılması şart: yalnızca localStorage'a yazan eski
 * kod, ekranı tazelemiyor ya da veriyi buluta göndermiyordu.
 */
export const yaz = (anahtar, deger) => {
    try {
        const metin = JSON.stringify(deger);
        localStorage.setItem(anahtar, metin);
        olayYay(anahtar, metin);
        buluta(anahtar);
        return true;
    } catch (e) {
        console.error(`veriDeposu: ${anahtar} yazılamadı`, e?.message);
        return false;
    }
};

export const sil = (anahtar) => {
    try {
        localStorage.removeItem(anahtar);
        olayYay(anahtar, null);
        return true;
    } catch { return false; }
};

/**
 * Listedeki TEK kaydı günceller (yoksa ekler).
 *
 * Tüm listeyi baştan yazmak yerine hedef kaydı değiştirmek, iki cihazın
 * farklı kayıtlar üzerinde çalıştığı durumda veri kaybını azaltır.
 */
export const kayitGuncelle = (anahtar, kimlik, degisiklik, kimlikAlani = 'id') => {
    const liste = listeOku(anahtar);
    let bulundu = false;
    const yeni = liste.map((k) => {
        if (String(k?.[kimlikAlani]) !== String(kimlik)) return k;
        bulundu = true;
        return typeof degisiklik === 'function' ? degisiklik(k) : { ...k, ...degisiklik };
    });
    if (!bulundu) return { basarili: false, hata: 'Kayıt bulunamadı.' };
    yaz(anahtar, yeni);
    return { basarili: true };
};

export const kayitEkle = (anahtar, kayit) => {
    const liste = listeOku(anahtar);
    yaz(anahtar, [...liste, kayit]);
    return { basarili: true, kayit };
};

export const kayitSil = (anahtar, kimlik, kimlikAlani = 'id') => {
    const liste = listeOku(anahtar);
    const kalan = liste.filter((k) => String(k?.[kimlikAlani]) !== String(kimlik));
    if (kalan.length === liste.length) return { basarili: false, hata: 'Kayıt bulunamadı.' };
    yaz(anahtar, kalan);
    return { basarili: true };
};

/** Anahtar değiştiğinde haber verir. @returns {function} aboneliği bitirir */
export const izle = (anahtar, geriCagir) => {
    const dinleyici = (e) => {
        if (e?.key && e.key !== anahtar) return;
        geriCagir(oku(anahtar));
    };
    window.addEventListener('storage', dinleyici);
    return () => window.removeEventListener('storage', dinleyici);
};

// ══════════════════════════════════════════════════════════════
//  ALAN API'LERİ
//
//  Bileşenler anahtar adı bilmez; anlamlı isimlerle çağırır. Anahtar
//  değişirse tek yer değişir.
// ══════════════════════════════════════════════════════════════

const A = {
    ogrenciler: 'coach_students',
    kullanicilar: 'users_db',
    gorevler: 'student_tasks',
    mesajlar: 'student_messages',
    topluMesajlar: 'messages',
    randevular: 'appointments',
    abonelikler: 'coach_subscriptions',
    veliBaglantilari: 'parent_links',
    ayarlar: 'app_settings',
};

export const ANAHTARLAR = A;

// ── Öğrenciler ────────────────────────────────────────────────
export const ogrencileriGetir = () => listeOku(A.ogrenciler);
export const ogrenciGetir = (id) =>
    ogrencileriGetir().find((o) => String(o?.id) === String(id)) || null;
export const ogrenciKaydet = (ogrenci) => {
    if (!ogrenci?.id) return { basarili: false, hata: 'Öğrenci kimliği yok.' };
    const varMi = ogrencileriGetir().some((o) => String(o.id) === String(ogrenci.id));
    return varMi
        ? kayitGuncelle(A.ogrenciler, ogrenci.id, ogrenci)
        : kayitEkle(A.ogrenciler, ogrenci);
};
export const ogrenciSil = (id) => kayitSil(A.ogrenciler, id);
export const ogrenciAlanGuncelle = (id, alanlar) =>
    kayitGuncelle(A.ogrenciler, id, alanlar);

// ── Görevler ─────────────────────────────────────────────────
/**
 * Görev deposu iki farklı biçimde karşımıza çıkıyor: düz dizi ya da
 * öğrenci kimliğine göre anahtarlanmış nesne. İkisi de destekleniyor —
 * biçim varsayan eski kod, tamamlanan görevlerin kaybolmasına yol
 * açmıştı.
 */
export const gorevleriGetir = (ogrenciId = null) => {
    const ham = oku(A.gorevler, NORMAL.nesne);
    if (Array.isArray(ham)) {
        return ogrenciId == null
            ? ham
            : ham.filter((g) => String(g?.studentId ?? g?.ogrenciId) === String(ogrenciId));
    }
    if (ogrenciId != null) {
        const v = ham?.[String(ogrenciId)];
        return Array.isArray(v) ? v : [];
    }
    return Object.values(ham || {}).flat().filter(Boolean);
};

export const gorevleriKaydet = (ogrenciId, gorevler) => {
    const ham = oku(A.gorevler, NORMAL.nesne);
    if (Array.isArray(ham)) {
        const digerleri = ham.filter(
            (g) => String(g?.studentId ?? g?.ogrenciId) !== String(ogrenciId)
        );
        return yaz(A.gorevler, [...digerleri, ...gorevler]);
    }
    return yaz(A.gorevler, { ...(ham || {}), [String(ogrenciId)]: gorevler });
};

// ── Mesajlar ─────────────────────────────────────────────────
export const mesajlariGetir = (ogrenciId) => {
    const hepsi = nesneOku(A.mesajlar);
    const v = hepsi?.[String(ogrenciId)];
    return Array.isArray(v) ? v : [];
};

export const mesajEkle = (ogrenciId, mesaj) => {
    const hepsi = nesneOku(A.mesajlar);
    const mevcut = Array.isArray(hepsi[String(ogrenciId)]) ? hepsi[String(ogrenciId)] : [];
    yaz(A.mesajlar, { ...hepsi, [String(ogrenciId)]: [...mevcut, mesaj] });
    return { basarili: true };
};

// ── Randevular ───────────────────────────────────────────────
export const randevulariGetir = () => listeOku(A.randevular);
export const randevuKaydet = (randevu) => {
    if (!randevu?.id) return { basarili: false, hata: 'Randevu kimliği yok.' };
    const varMi = randevulariGetir().some((r) => String(r.id) === String(randevu.id));
    return varMi
        ? kayitGuncelle(A.randevular, randevu.id, randevu)
        : kayitEkle(A.randevular, randevu);
};
export const randevuSil = (id) => kayitSil(A.randevular, id);

// ── Ayarlar ──────────────────────────────────────────────────
export const ayarlariGetir = () => nesneOku(A.ayarlar);
export const ayarKaydet = (alanlar) => yaz(A.ayarlar, { ...ayarlariGetir(), ...alanlar });

export default {
    ANAHTARLAR,
    oku, listeOku, nesneOku, yaz, sil, izle,
    kayitGuncelle, kayitEkle, kayitSil,
    ogrencileriGetir, ogrenciGetir, ogrenciKaydet, ogrenciSil, ogrenciAlanGuncelle,
    gorevleriGetir, gorevleriKaydet,
    mesajlariGetir, mesajEkle,
    randevulariGetir, randevuKaydet, randevuSil,
    ayarlariGetir, ayarKaydet,
};
