/**
 * 🔔 KULLANICI GERİ BİLDİRİMİ — tek kapı
 *
 * Denetimde kullanıcıya bir şey söylemenin BEŞ ayrı yolu bulundu:
 * 120 adet `window.alert/confirm/prompt`, 240 `setToast` çağrısı ve
 * birbirinden bağımsız üç bildirim bileşeni.
 *
 * Tarayıcının kendi diyalogları özellikle sorunlu: sayfayı kilitler,
 * biçimlendirilemez, telefonda uygulamanın değil tarayıcının penceresi
 * gibi görünür ve ücretli bir üründe amatör durur.
 *
 * Burası React'e bağlı OLMAYAN küçük bir yayıncı. Böylece bileşenler de,
 * servis dosyaları da (hook kullanamayan yerler) aynı işlevi çağırabilir:
 *
 *   import { bildir, onayla } from '../services/uiGeriBildirim';
 *
 *   bildir('Program kaydedildi', 'basari');
 *   if (await onayla('Tüm program silinecek. Emin misiniz?')) { ... }
 *
 * Sağlayıcı (UIGeriBildirimProvider) bu yayıncıyı dinler ve ekrana çizer.
 * Sağlayıcı henüz bağlanmadıysa `onayla` tarayıcının confirm'üne düşer,
 * böylece geçiş sırasında hiçbir çağrı sessizce kaybolmaz.
 */

let sonrakiId = 1;
const bildirimDinleyiciler = new Set();
const onayDinleyiciler = new Set();

/** Sağlayıcı bağlandı mı? */
export const saglayiciHazir = () => onayDinleyiciler.size > 0;

// ── Toast ────────────────────────────────────────────────────────────

export function bildirimleriDinle(fn) {
    bildirimDinleyiciler.add(fn);
    return () => bildirimDinleyiciler.delete(fn);
}

/**
 * Kısa bilgi mesajı gösterir.
 * @param {string} mesaj
 * @param {'bilgi'|'basari'|'uyari'|'hata'} tur
 * @param {number} sure  milisaniye; 0 = elle kapatılana kadar
 */
export function bildir(mesaj, tur = 'bilgi', sure = 4000) {
    const metin = String(mesaj ?? '').trim();
    if (!metin) return null;

    const kayit = { id: sonrakiId++, mesaj: metin, tur, sure };

    if (!bildirimDinleyiciler.size) {
        // Sağlayıcı yoksa hiç değilse konsola düşsün — sessizce yutma
        console.info('[bildirim]', tur, metin);
        return kayit.id;
    }
    bildirimDinleyiciler.forEach((fn) => fn(kayit));
    return kayit.id;
}

export const basarili = (m, s) => bildir(m, 'basari', s);
export const uyar = (m, s) => bildir(m, 'uyari', s);
export const hataVer = (m, s) => bildir(m, 'hata', s ?? 6000);

// ── Onay diyaloğu ────────────────────────────────────────────────────

export function onaylariDinle(fn) {
    onayDinleyiciler.add(fn);
    return () => onayDinleyiciler.delete(fn);
}

/**
 * Onay sorar. `window.confirm` yerine kullanılır — ama söz (Promise)
 * döndürdüğü için çağıran yer `await` etmelidir.
 *
 * @param {string|object} secenek  metin ya da { baslik, mesaj, onayMetni, iptalMetni, tehlikeli }
 * @returns {Promise<boolean>}
 */
export function onayla(secenek) {
    const ayar = typeof secenek === 'string' ? { mesaj: secenek } : (secenek || {});
    const metin = String(ayar.mesaj || '').trim();

    /**
     * Çağrıların çoğu tek cümlelik ("Bu ödevi silmek istediğinize emin
     * misiniz?") — bunu hem başlığa hem gövdeye koymak aynı cümleyi iki
     * kez gösteriyordu. Başlık verilmediyse kısa mesaj başlık olur,
     * gövde boş kalır; uzun mesajda genel bir başlık kullanılır.
     */
    const baslikVerilmedi = !ayar.baslik;
    const kisaMesaj = metin.length > 0 && metin.length <= 90 && !metin.includes('\n');

    const kayit = {
        baslik: ayar.baslik || (kisaMesaj ? metin : 'Emin misiniz?'),
        mesaj: baslikVerilmedi && kisaMesaj ? '' : metin,
        onayMetni: ayar.onayMetni || 'Evet, devam et',
        iptalMetni: ayar.iptalMetni || 'Vazgeç',
        tehlikeli: ayar.tehlikeli ?? false,
    };

    // Sağlayıcı bağlanmadıysa eski davranışa düş — çağrı kaybolmasın
    if (!onayDinleyiciler.size) {
        return Promise.resolve(window.confirm(`${kayit.baslik}\n\n${kayit.mesaj}`));
    }

    return new Promise((cozumle) => {
        onayDinleyiciler.forEach((fn) => fn({ ...kayit, cozumle }));
    });
}

export default { bildir, basarili, uyar, hataVer, onayla };
