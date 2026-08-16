/**
 * 🔐 KİMLİK BİLGİSİ GÜVENLİĞİ
 *
 * Uygulamada şifreler DÜZ METİN olarak saklanıyordu:
 *   · `admin_master_password` anahtarı okunabilir hâlde duruyor,
 *     yoksa sabit 'admin123' değerine düşülüyordu,
 *   · öğrenci girişinde `studentData.password === name` gibi
 *     doğrudan karşılaştırmalar yapılıyordu.
 * Cihaza erişen ya da bulut yedeğini eline geçiren biri bütün
 * şifreleri okuyabilirdi.
 *
 * Bu katman şifreyi PBKDF2-SHA256 ile tuzlayıp özetler. Tarayıcının
 * yerleşik WebCrypto'su kullanılır — ek bağımlılık yoktur.
 *
 * Saklanan biçim:
 *   pbkdf2$<iterasyon>$<tuz-b64>$<özet-b64>
 *
 * Geçiş: eski düz metin kayıtlar silinmez; kullanıcı doğru şifreyle
 * ilk kez girdiğinde kaydı sessizce özete çevrilir (`dogrula` bunu
 * kendi yapar). Böylece kimse sistemden kilitlenmez.
 */

const ITERASYON = 150000;      // OWASP'ın PBKDF2-SHA256 için önerdiği alt sınırın üzerinde
const UZUNLUK = 32;            // 256 bit
const ONEK = 'pbkdf2';

const enc = new TextEncoder();

const b64 = (buf) => {
    const bytes = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i += 1) s += String.fromCharCode(bytes[i]);
    return btoa(s);
};

const b64Coz = (s) => {
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
    return out;
};

const kripto = () => (typeof window !== 'undefined' ? window.crypto : undefined);

/** Ortam WebCrypto destekliyor mu? (eski tarayıcı / güvensiz köken) */
export const destekliMi = () => Boolean(kripto()?.subtle);

const ozetle = async (sifre, tuz, iterasyon = ITERASYON) => {
    const anahtar = await kripto().subtle.importKey(
        'raw', enc.encode(sifre), 'PBKDF2', false, ['deriveBits']
    );
    const bit = await kripto().subtle.deriveBits(
        { name: 'PBKDF2', salt: tuz, iterations: iterasyon, hash: 'SHA-256' },
        anahtar, UZUNLUK * 8
    );
    return b64(bit);
};

/** Şifreyi saklanabilir özete çevirir. */
export const hashle = async (sifre) => {
    if (!sifre) return null;
    if (!destekliMi()) {
        // Özet üretilemiyorsa düz metin YAZMAK yerine hata veririz;
        // sessizce güvensiz kayda düşmek en kötü seçenektir.
        throw new Error('Bu tarayıcı güvenli şifre saklamayı desteklemiyor (HTTPS gerekir).');
    }
    const tuz = kripto().getRandomValues(new Uint8Array(16));
    const ozet = await ozetle(sifre, tuz);
    return `${ONEK}$${ITERASYON}$${b64(tuz)}$${ozet}`;
};

export const hashliMi = (deger) => typeof deger === 'string' && deger.startsWith(`${ONEK}$`);

/** Zamanlama sızıntısına kapalı karşılaştırma. */
const esitMi = (a, b) => {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    let fark = 0;
    for (let i = 0; i < a.length; i += 1) fark |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return fark === 0;
};

/**
 * Şifreyi saklanan değerle karşılaştırır.
 * Eski düz metin kayıtlar da kabul edilir; `yukselt` geri çağrısı
 * verilirse doğru şifreyle girişte kayıt özete çevrilir.
 *
 * @param {string} sifre         Kullanıcının girdiği şifre
 * @param {string} saklanan      Depodaki değer (özet veya düz metin)
 * @param {(yeniOzet:string)=>void} [yukselt]
 */
export const dogrula = async (sifre, saklanan, yukselt = null) => {
    if (!sifre || !saklanan) return false;

    if (!hashliMi(saklanan)) {
        // Eski düz metin kayıt
        const dogru = esitMi(String(sifre), String(saklanan));
        if (dogru && yukselt && destekliMi()) {
            try { yukselt(await hashle(sifre)); } catch { /* yükseltme başarısızsa giriş yine geçerli */ }
        }
        return dogru;
    }

    const parcalar = saklanan.split('$');
    if (parcalar.length !== 4) return false;
    const [, iter, tuzB64, ozet] = parcalar;

    try {
        const hesap = await ozetle(sifre, b64Coz(tuzB64), parseInt(iter, 10) || ITERASYON);
        return esitMi(hesap, ozet);
    } catch {
        return false;
    }
};

// ══════════════════════════════════════════════════════════════
//  ŞİFRE GÜCÜ
// ══════════════════════════════════════════════════════════════

/** Çok yaygın olduğu için ilk denenecek şifreler. */
const YASAKLI = new Set([
    '123456', '1234567', '12345678', '123456789', '1234567890',
    'password', 'sifre', 'şifre', 'admin', 'admin123', 'qwerty',
    'asdasd', '111111', '000000', 'abc123', 'koc123', 'ogrenci',
]);

/**
 * Şifre kuralları.
 * @returns {{gecerli:boolean, puan:number, seviye:string, sorunlar:string[]}}
 */
export const sifreGucu = (sifre = '') => {
    const s = String(sifre);
    const sorunlar = [];

    if (s.length < 8) sorunlar.push('En az 8 karakter olmalı');
    if (!/[a-zçğıöşü]/.test(s)) sorunlar.push('Küçük harf içermeli');
    if (!/[A-ZÇĞİÖŞÜ]/.test(s)) sorunlar.push('Büyük harf içermeli');
    if (!/\d/.test(s)) sorunlar.push('Rakam içermeli');
    if (YASAKLI.has(s.toLocaleLowerCase('tr-TR'))) sorunlar.push('Çok yaygın bir şifre, tahmin edilmesi kolay');
    if (/^(.)\1+$/.test(s)) sorunlar.push('Aynı karakterin tekrarı olamaz');

    // Puan: uzunluk + çeşitlilik
    let puan = 0;
    if (s.length >= 8) puan += 1;
    if (s.length >= 12) puan += 1;
    if (/[a-zçğıöşü]/.test(s) && /[A-ZÇĞİÖŞÜ]/.test(s)) puan += 1;
    if (/\d/.test(s)) puan += 1;
    if (/[^A-Za-zÇĞİÖŞÜçğıöşü0-9]/.test(s)) puan += 1;
    if (YASAKLI.has(s.toLocaleLowerCase('tr-TR'))) puan = 0;

    const seviye = puan <= 1 ? 'zayıf' : puan <= 3 ? 'orta' : 'güçlü';

    return {
        gecerli: sorunlar.length === 0,
        puan,
        seviye,
        sorunlar,
    };
};

export default { hashle, dogrula, hashliMi, sifreGucu, destekliMi };
