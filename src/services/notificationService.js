import { listeOku } from './veriDeposu';
/**
 * 🔔 BİLDİRİM SERVİSİ
 *
 * Bildirim paneli yalnızca Firestore'u dinliyordu ve uygulamada bildirim
 * ÜRETEN tek yer randevu sistemiydi. Görev atama, program gönderme, mesaj
 * ve deneme yükleme gibi asıl olaylar hiç bildirim doğurmuyordu; panel
 * pratikte hep boş kalıyordu. Firebase bağlantısı yoksa hiç çalışmıyordu.
 *
 * Bu servis iki kanalı birleştirir:
 *   · YEREL  — localStorage (her koşulda çalışır, aynı cihazda anında)
 *   · BULUT  — Firestore (varsa; cihazlar arası)
 *
 * Panel ikisini birleştirip tarihe göre sıralar.
 */

// NOT: 'app_notifications' anahtarı NotificationContext tarafından
// kullanılıyor (rozet/başarım bildirimleri, farklı şema). Aynı anahtarı
// paylaşmak iki sistemin kayıtlarını birbirine karıştırıyordu.
const KEY = 'user_notifications';
const MAX = 200;                 // kayıt şişmesin
const OLAY = 'notifications-updated';

const oku = () => {
    try {
        const raw = listeOku(KEY);
        return Array.isArray(raw) ? raw : [];
    } catch {
        return [];
    }
};

const yaz = (liste) => {
    try {
        localStorage.setItem(KEY, JSON.stringify(liste.slice(0, MAX)));
        window.dispatchEvent(new Event(OLAY));
        // Aynı sekmede StorageEvent tetiklenmez; diğer bileşenler için yayınla
        window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
    } catch { /* kota dolduysa sessiz geç */ }
};

const uid = () => `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * Bildirim oluşturur.
 * @param {object} p
 * @param {string} p.toUserId  Alıcı kullanıcı kimliği
 * @param {string} [p.type]    task | message | exam | alert | badge | appt | info
 * @param {string} p.title     Kısa başlık
 * @param {string} [p.body]    Açıklama
 * @param {object} [p.action]  { tab: 'tasks' } gibi yönlendirme bilgisi
 */
export const notify = ({ toUserId, type = 'info', title, body = '', action = null }) => {
    if (!toUserId || !title) return null;

    const kayit = {
        id: uid(),
        toUserId: String(toUserId),
        type,
        title,
        body,
        action,
        read: false,
        createdAt: new Date().toISOString(),
        kaynak: 'yerel',
    };

    yaz([kayit, ...oku()]);

    // Bulut kanalı varsa oraya da yaz — başarısız olursa yerel kayıt yeterli
    import('../components/shared/RealtimeNotifications')
        .then((m) => m.sendRealtimeNotification?.({ toUserId, type, title, body, action }))
        .catch(() => { /* Firebase yoksa yerel kayıt yeterli */ });

    return kayit;
};

/** Birden çok alıcıya aynı bildirim. */
export const notifyMany = (kullanicilar = [], icerik = {}) => {
    const list = kullanicilar.filter(Boolean).map((id) => notify({ ...icerik, toUserId: id }));
    return list.filter(Boolean).length;
};

/** Bir kullanıcının yerel bildirimleri (yeniden eskiye). */
export const listFor = (userId) => {
    if (!userId) return [];
    const id = String(userId);
    return oku()
        .filter((n) => String(n.toUserId) === id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const unreadCount = (userId) => listFor(userId).filter((n) => !n.read).length;

export const markRead = (id) => {
    yaz(oku().map((n) => (n.id === id ? { ...n, read: true } : n)));
};

export const markAllRead = (userId) => {
    const uid2 = String(userId);
    yaz(oku().map((n) => (String(n.toUserId) === uid2 ? { ...n, read: true } : n)));
};

export const remove = (id) => {
    yaz(oku().filter((n) => n.id !== id));
};

export const clearFor = (userId) => {
    const uid2 = String(userId);
    yaz(oku().filter((n) => String(n.toUserId) !== uid2));
};

/** Panelin canlı güncellenmesi için abonelik. */
export const subscribe = (fn) => {
    const h = () => fn();
    window.addEventListener(OLAY, h);
    window.addEventListener('storage', h);
    return () => {
        window.removeEventListener(OLAY, h);
        window.removeEventListener('storage', h);
    };
};

export default { notify, notifyMany, listFor, unreadCount, markRead, markAllRead, remove, clearFor, subscribe };
