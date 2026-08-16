/**
 * 🎟️ KOÇ İNDİRİM KUPONLARI
 *
 * Koç, kendi öğrenci/veli çevresine ya da tanıdığı diğer koçlara özel
 * indirim kuponu üretir. Kupon kayıt sırasında girilir; paket ücreti
 * kupon oranında düşer.
 *
 * Tasarım kararları
 * ─────────────────
 * · Kupon KODU insanların telefonda okuyabileceği kadar kısa ve
 *   karışmayan harflerden üretilir (O/0, I/1 dışarıda).
 * · Kullanım sayısı ve son kullanma tarihi kuponun kendisinde tutulur;
 *   doğrulama tek yerden yapılır ki arayüzler farklı kural uygulamasın.
 * · Kullanımlar `kullanimlar[]` içinde kim/ne zaman/hangi paket olarak
 *   saklanır — koç kuponunun nasıl çalıştığını görebilsin.
 * · Bir kupon aynı kişiye ikinci kez uygulanmaz.
 *
 * ⚠️ Bu katman ücret HESABINI yapar; tahsilat yapmaz. Ödeme sağlayıcı
 * eklendiğinde `indirimUygula` çıktısı sağlayıcıya verilecek tutardır.
 */

const KEY = 'coach_coupons';

/** Karıştırılması kolay harf/rakamlar dışarıda: O,0,I,1,L */
const ALFABE = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const oku = () => {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw || !raw.trim()) return [];
        const v = JSON.parse(raw);
        return Array.isArray(v) ? v : [];
    } catch {
        return [];
    }
};

const yaz = (liste) => {
    localStorage.setItem(KEY, JSON.stringify(liste));
    try { window.dispatchEvent(new StorageEvent('storage', { key: KEY })); } catch { /* ignore */ }
    try { window.dispatchEvent(new Event('coupons-updated')); } catch { /* ignore */ }
    try { window.firebaseSync?.syncKey?.(KEY); } catch { /* senkron yoksa sorun değil */ }
};

/** Kod normalleştirme — kullanıcı küçük harf ya da boşlukla girebilir. */
export const normalize = (kod) =>
    String(kod || '').toLocaleUpperCase('tr-TR').replace(/[^A-Z0-9]/g, '');

const kodUret = (uzunluk = 8) => {
    let s = '';
    for (let i = 0; i < uzunluk; i += 1) {
        s += ALFABE[Math.floor(Math.random() * ALFABE.length)];
    }
    return s;
};

/** Depoda olmayan bir kod üretir. */
const benzersizKod = (onEk = '') => {
    const mevcut = new Set(oku().map((k) => k.kod));
    for (let i = 0; i < 50; i += 1) {
        const aday = `${normalize(onEk)}${kodUret(onEk ? 5 : 8)}`;
        if (!mevcut.has(aday)) return aday;
    }
    // 50 denemede çakışma pratikte imkânsız; yine de sonsuz döngü olmasın
    return `${normalize(onEk)}${Date.now().toString(36).toUpperCase().slice(-6)}`;
};

// ══════════════════════════════════════════════════════════════
//  ÜRETME VE YÖNETİM
// ══════════════════════════════════════════════════════════════

/**
 * Kupon üretir.
 * @param {object} p
 * @param {number} p.oran            İndirim yüzdesi (1–100)
 * @param {number} [p.tutar]         Yüzde yerine sabit TL indirimi
 * @param {number} [p.kullanimHakki] Kaç kez kullanılabilir (varsayılan 1)
 * @param {string} [p.sonTarih]      YYYY-AA-GG; yoksa süresiz
 * @param {string} [p.aciklama]
 * @param {string[]} [p.planlar]     Yalnız bu paketlerde geçerli
 * @param {object} p.uretenKoc       { id, name }
 */
export const uret = (p = {}) => {
    const oran = Number(p.oran);
    const tutar = Number(p.tutar);

    // Ya yüzde ya sabit tutar — ikisi birden anlamsız olur
    if (!Number.isFinite(oran) && !Number.isFinite(tutar)) return null;
    if (Number.isFinite(oran) && (oran <= 0 || oran > 100)) return null;
    if (Number.isFinite(tutar) && tutar <= 0) return null;

    const kupon = {
        kod: p.kod ? normalize(p.kod) : benzersizKod(p.onEk),
        oran: Number.isFinite(oran) ? oran : null,
        tutar: Number.isFinite(tutar) ? tutar : null,
        kullanimHakki: Math.max(1, parseInt(p.kullanimHakki, 10) || 1),
        sonTarih: p.sonTarih || null,
        aciklama: p.aciklama || '',
        planlar: Array.isArray(p.planlar) && p.planlar.length ? p.planlar : null,
        uretenKocId: p.uretenKoc?.id ?? null,
        uretenKocAd: p.uretenKoc?.name || '',
        aktif: true,
        kullanimlar: [],
        olusturma: new Date().toISOString(),
    };

    // Aynı kod elle iki kez girilirse üzerine yazmayalım
    if (oku().some((k) => k.kod === kupon.kod)) return null;

    yaz([kupon, ...oku()]);
    return kupon;
};

export const tumu = () => oku();

/** Bir koçun ürettiği kuponlar. */
export const kocKuponlari = (kocId) =>
    oku().filter((k) => String(k.uretenKocId) === String(kocId));

export const bul = (kod) => oku().find((k) => k.kod === normalize(kod)) || null;

export const durumDegistir = (kod, aktif) => {
    yaz(oku().map((k) => (k.kod === normalize(kod) ? { ...k, aktif: Boolean(aktif) } : k)));
};

export const sil = (kod) => {
    yaz(oku().filter((k) => k.kod !== normalize(kod)));
};

// ══════════════════════════════════════════════════════════════
//  DOĞRULAMA VE UYGULAMA
// ══════════════════════════════════════════════════════════════

/**
 * Kuponu doğrular.
 * @returns {{gecerli:boolean, kupon?:object, hata?:string}}
 */
export const dogrula = (kod, { planId = null, kullaniciAnahtari = null } = {}) => {
    const temiz = normalize(kod);
    if (!temiz) return { gecerli: false, hata: 'Kupon kodu boş' };

    const kupon = bul(temiz);
    if (!kupon) return { gecerli: false, hata: 'Böyle bir kupon bulunamadı' };
    if (!kupon.aktif) return { gecerli: false, hata: 'Bu kupon kapatılmış' };

    if (kupon.sonTarih) {
        const bugun = new Date().toISOString().slice(0, 10);
        if (kupon.sonTarih < bugun) {
            return { gecerli: false, hata: `Kuponun süresi ${kupon.sonTarih} tarihinde doldu` };
        }
    }

    if (kupon.kullanimlar.length >= kupon.kullanimHakki) {
        return { gecerli: false, hata: 'Kuponun kullanım hakkı dolmuş' };
    }

    if (kupon.planlar && planId && !kupon.planlar.includes(planId)) {
        return { gecerli: false, hata: 'Bu kupon seçtiğiniz pakette geçerli değil' };
    }

    // Aynı kişi aynı kuponu ikinci kez kullanamaz
    if (kullaniciAnahtari
        && kupon.kullanimlar.some((u) => u.kullanici === String(kullaniciAnahtari))) {
        return { gecerli: false, hata: 'Bu kuponu daha önce kullandınız' };
    }

    return { gecerli: true, kupon };
};

/**
 * İndirimi hesaplar. Kupon geçersizse ödenecek tutar değişmez.
 * @returns {{tutar:number, indirim:number, odenecek:number, kupon:object|null, hata:string|null}}
 */
export const indirimHesapla = (tutar, kod, secenekler = {}) => {
    const temel = Math.max(0, Number(tutar) || 0);
    if (!kod) return { tutar: temel, indirim: 0, odenecek: temel, kupon: null, hata: null };

    const sonuc = dogrula(kod, secenekler);
    if (!sonuc.gecerli) {
        return { tutar: temel, indirim: 0, odenecek: temel, kupon: null, hata: sonuc.hata };
    }

    const k = sonuc.kupon;
    // Yüzde indirimi kuruş artığı bırakmasın diye yuvarlanır
    const ham = k.oran ? Math.round((temel * k.oran) / 100) : (k.tutar || 0);
    const indirim = Math.min(temel, ham);          // ücret eksiye düşmez

    return { tutar: temel, indirim, odenecek: temel - indirim, kupon: k, hata: null };
};

/**
 * Kuponu kullanılmış olarak işaretler. Ödeme/kayıt BAŞARILI olduktan
 * sonra çağrılmalı — aksi hâlde yarım kalan kayıt hakkı yakar.
 */
export const kullan = (kod, { kullanici, planId = null, indirim = 0 } = {}) => {
    const temiz = normalize(kod);
    const sonuc = dogrula(temiz, { planId, kullaniciAnahtari: kullanici });
    if (!sonuc.gecerli) return false;

    yaz(oku().map((k) => (k.kod === temiz
        ? {
            ...k,
            kullanimlar: [...k.kullanimlar, {
                kullanici: String(kullanici || 'bilinmiyor'),
                planId,
                indirim,
                tarih: new Date().toISOString(),
            }],
        }
        : k)));
    return true;
};

/** Koçun kupon performansı — kaç kullanım, ne kadar indirim verildi. */
export const kocOzeti = (kocId) => {
    const liste = kocKuponlari(kocId);
    const kullanim = liste.reduce((t, k) => t + k.kullanimlar.length, 0);
    const indirim = liste.reduce(
        (t, k) => t + k.kullanimlar.reduce((s, u) => s + (u.indirim || 0), 0), 0
    );
    return {
        toplam: liste.length,
        aktif: liste.filter((k) => k.aktif).length,
        kullanim,
        indirim,
    };
};

export default {
    uret, tumu, kocKuponlari, bul, durumDegistir, sil,
    dogrula, indirimHesapla, kullan, kocOzeti, normalize,
};
