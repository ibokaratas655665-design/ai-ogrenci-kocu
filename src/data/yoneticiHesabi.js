/**
 * 👤 SİSTEM YÖNETİCİSİ HESABI
 *
 * Yönetici (ana koç) girişinin hangi e-posta ile yapılacağı burada
 * tanımlıdır. Önceden kurucunun kişisel e-postası dört ayrı dosyaya
 * elle yazılmıştı; hem kişisel veri koda gömülüydü hem de değiştirmek
 * için dört dosyayı bulmak gerekiyordu.
 *
 * Derleme sırasında `.env` dosyasından okunur:
 *
 *     VITE_YONETICI_EPOSTA=yonetici@kurumunuz.com
 *
 * Tanımlı değilse `admin@admin.com` kullanılır.
 *
 * ⚠️ Bu bir SIR DEĞİLDİR — istemci tarafında görünür. Güvenliği sağlayan
 * şey e-postanın gizliliği değil, PBKDF2 ile saklanan yönetici şifresi.
 * Şifre kurulmadan giriş açılmaz (bkz. hybridAuth.loginCoach).
 */

const VARSAYILAN = 'admin@admin.com';

/** Yönetici girişinde kabul edilen e-posta adresleri. */
export const YONETICI_EPOSTALARI = [
    VARSAYILAN,
    import.meta.env?.VITE_YONETICI_EPOSTA,
]
    .filter(Boolean)
    .map((e) => String(e).toLocaleLowerCase('tr-TR').trim());

/** Girilen değer yönetici hesabına mı ait? */
export const yoneticiHesabiMi = (deger) => {
    if (!deger) return false;
    return YONETICI_EPOSTALARI.includes(String(deger).toLocaleLowerCase('tr-TR').trim());
};

export default { YONETICI_EPOSTALARI, yoneticiHesabiMi };
