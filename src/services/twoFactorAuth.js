/**
 * 🔐 İKİ AŞAMALI GÜVENLİK SERVİSİ
 *
 * Koç: E-posta Magic Link (Firebase Auth)
 * Öğrenci: Cihaz Hatırlama (30 gün geçerli token)
 */

import { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import app from '../firebaseConfig';
import { yaz } from './veriDeposu';

const auth = getAuth(app);

// ── Magic Link Ayarları ──────────────────────────────────────
// Localhost'tayken Firebase Hosting URL'ini kullan (e-posta linki localhost'ta çalışmaz)
const PRODUCTION_URL = 'https://ai-ogrenci-kocu-b037b.web.app';
const BASE_URL = window.location.hostname === 'localhost'
    ? PRODUCTION_URL
    : window.location.origin;

const ACTION_CODE_SETTINGS = {
    url: BASE_URL + '/#/login?magic=true',
    handleCodeInApp: true,
};

// ── Cihaz Token Süresi (30 gün) ─────────────────────────────
const DEVICE_TOKEN_EXPIRY_DAYS = 30;


// ════════════════════════════════════════════════════════════
//  KOÇ: MAGIC LINK
// ════════════════════════════════════════════════════════════

/**
 * Koç e-postasına Magic Link gönder
 * @param {string} email - Koç e-posta adresi
 * @param {string} coachPhone - Koçun telefon numarası (doğrulama için saklanır)
 */
export const sendMagicLinkToCoach = async (email, coachPhone) => {
    try {
        await sendSignInLinkToEmail(auth, email, ACTION_CODE_SETTINGS);

        // E-posta ve telefonu localStorage'da sakla (link dönüşünde kullanmak için)
        localStorage.setItem('magic_link_email', email);
        localStorage.setItem('magic_link_phone', coachPhone || '');

        return { success: true, message: `Magic link ${email} adresine gönderildi! E-postanızı kontrol edin. 📧` };
    } catch (error) {
        console.error('Magic link gönderme hatası:', error);

        // Firebase hata mesajlarını Türkçeleştir
        if (error.code === 'auth/invalid-email') {
            return { success: false, error: 'Geçersiz e-posta adresi.' };
        }
        if (error.code === 'auth/too-many-requests') {
            return { success: false, error: 'Çok fazla istek gönderildi. Lütfen birkaç dakika bekleyin.' };
        }
        return { success: false, error: 'Magic link gönderilemedi. İnternet bağlantınızı kontrol edin.' };
    }
};

/**
 * Magic Link ile giriş tamamla (link'e tıklayınca çağrılır)
 * @param {string} url - Mevcut sayfa URL'si
 */
export const completeMagicLinkSignIn = async (url) => {
    try {
        if (!isSignInWithEmailLink(auth, url)) {
            return { success: false, error: 'Geçersiz magic link.' };
        }

        let email = localStorage.getItem('magic_link_email');
        const savedPhone = localStorage.getItem('magic_link_phone');

        if (!email) {
            // Aynı cihazda değilse e-posta sor
            return { success: false, requireEmail: true, error: 'Lütfen e-posta adresinizi girin.' };
        }

        await signInWithEmailLink(auth, email, url);

        // Temizle
        localStorage.removeItem('magic_link_email');
        localStorage.removeItem('magic_link_phone');

        return { success: true, email, phone: savedPhone };
    } catch (error) {
        console.error('Magic link doğrulama hatası:', error);
        if (error.code === 'auth/invalid-action-code') {
            return { success: false, error: 'Bu link kullanılmış veya süresi dolmuş. Yeni bir link isteyin.' };
        }
        return { success: false, error: 'Link doğrulanamadı. Lütfen tekrar deneyin.' };
    }
};


// ════════════════════════════════════════════════════════════
//  ÖĞRENCİ: CİHAZ HATIRLA
// ════════════════════════════════════════════════════════════

/**
 * Benzersiz cihaz kimliği oluştur veya mevcut olanı al
 */
const getOrCreateDeviceId = () => {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 12);
        localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
};

/**
 * Cihaz güveni denetimi — sebebiyle birlikte.
 *
 * ⚠️ ESKİ HÂLİ FIRESTORE HATASINDA `return true` DİYORDU:
 *
 *     } catch (fbErr) {
 *         // Firebase ulaşılamazsa localStorage'a güven
 *         return true;
 *     }
 *
 * Yani "doğrulanamadı = güvenilir". Ölçülerek kanıtlandı: saldırgan
 * kurbanın `studentId`'sini (okul numarasından türüyor) bilip kendi
 * cihazına SAHTE bir token yazdığında, belge kurbana ait olduğu için
 * kural `permission-denied` veriyor, catch çalışıyor ve fonksiyon
 * "güvenilir" diyordu. Sunucu doğrulaması yapılamayan durum, güvenlik
 * kararında ASLA olumlu sayılmamalı.
 *
 * Yeni davranış:
 *   · yetki reddi / token uyuşmazlığı / kayıt yok → güvenilmez
 *   · ağ gerçekten yoksa            → güvenilmez, ama sebep ayrı
 *     (`dogrulanamadi-cevrimdisi`) — çağıran taraf kullanıcıyı
 *     suçlamak yerine "bağlantı kurulamadı" diyebilsin.
 *
 * @returns {Promise<{guvenilir: boolean, sebep: string}>}
 */
export const cihazGuveniniDenetle = async (studentId) => {
    try {
        const deviceId = getOrCreateDeviceId();
        const tokenKey = `trusted_device_${studentId}`;
        const stored = localStorage.getItem(tokenKey);

        if (!stored) return { guvenilir: false, sebep: 'kayit-yok' };

        const { token, expiresAt } = JSON.parse(stored);

        if (Date.now() > expiresAt) {
            localStorage.removeItem(tokenKey);
            return { guvenilir: false, sebep: 'suresi-doldu' };
        }

        // Sunucu doğrulaması — yerel token tek başına yeterli değil
        try {
            const docSnap = await getDoc(doc(db, 'trusted_devices', `${studentId}_${deviceId}`));

            if (!docSnap.exists()) {
                localStorage.removeItem(tokenKey);
                return { guvenilir: false, sebep: 'belge-yok' };
            }

            const data = docSnap.data();
            const gecerli = data.token === token && Date.now() < data.expiresAt;
            return gecerli
                ? { guvenilir: true, sebep: 'gecerli' }
                : { guvenilir: false, sebep: 'token-uyusmuyor' };
        } catch (fbErr) {
            const kod = fbErr?.code || '';
            // Yetki reddi: belge başkasına ait ya da damgasız — kesinlikle güvenilmez
            if (kod === 'permission-denied') {
                console.warn('Cihaz güveni: sunucu yetki vermedi, güvenilmez sayıldı.');
                return { guvenilir: false, sebep: 'yetkisiz' };
            }
            // Ağ yok: yine güvenilmez, ama kullanıcıya farklı anlatılabilsin
            console.warn('Cihaz güveni doğrulanamadı (bağlantı yok), güvenilmez sayıldı.');
            return { guvenilir: false, sebep: 'dogrulanamadi-cevrimdisi' };
        }
    } catch (err) {
        console.warn('Cihaz güven kontrolü hatası:', err);
        return { guvenilir: false, sebep: 'hata' };
    }
};

/**
 * Bu cihazın öğrenci için hatırlanıp hatırlanmadığını kontrol et.
 * Geriye dönük uyumluluk için boolean döner; sebebe ihtiyaç duyan
 * çağıran `cihazGuveniniDenetle` kullanır.
 * @param {string} studentId - Öğrenci ID'si
 */
export const isDeviceTrusted = async (studentId) =>
    (await cihazGuveniniDenetle(studentId)).guvenilir;

/**
 * Bu cihazı öğrenci için güvenilir olarak kaydet (30 gün)
 * @param {string} studentId - Öğrenci ID'si
 * @param {string} studentName - Öğrenci adı (kayıt için)
 */
export const trustThisDevice = async (studentId, studentName) => {
    try {
        const deviceId = getOrCreateDeviceId();
        const token = 'tok_' + Math.random().toString(36).substr(2, 24);
        const expiresAt = Date.now() + DEVICE_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

        // localStorage'a kaydet
        const tokenKey = `trusted_device_${studentId}`;
        localStorage.setItem(tokenKey, JSON.stringify({ token, expiresAt }));

        // Firestore'a kaydet (arka planda)
        try {
            const docId = `${studentId}_${deviceId}`;
            /**
             * ⚠️ `sahipUid` ZORUNLU: belge kimliği `<studentId>_<deviceId>`
             * ve `studentId` uygulama kimliği — Firestore kuralı bundan
             * sahiplik çıkaramıyordu, bu yüzden koleksiyon giriş yapan
             * herkese açıktı ve `token` alanı okunabildiği için 2FA
             * atlatılabiliyordu. Damga kuralın sahibi tanımasını sağlar.
             */
            await setDoc(doc(db, 'trusted_devices', docId), {
                sahipUid: auth?.currentUser?.uid || null,
                studentId,
                studentName: studentName || '',
                deviceId,
                token,
                expiresAt,
                createdAt: new Date().toISOString(),
                userAgent: navigator.userAgent,
            });
        } catch (fbErr) {
            console.warn('Firestore cihaz kaydı başarısız (devam ediliyor):', fbErr.message);
        }

        return { success: true };
    } catch (err) {
        console.error('Cihaz hatırlama hatası:', err);
        return { success: false };
    }
};

/**
 * Bu cihazın güvenini iptal et (çıkış yaparken çağrılır)
 * @param {string} studentId - Öğrenci ID'si
 */
export const revokeTrustedDevice = async (studentId) => {
    try {
        const deviceId = getOrCreateDeviceId();
        const tokenKey = `trusted_device_${studentId}`;
        localStorage.removeItem(tokenKey);

        try {
            const docId = `${studentId}_${deviceId}`;
            await deleteDoc(doc(db, 'trusted_devices', docId));
        } catch (fbErr) {
            // Sessizce devam et
        }
    } catch (err) {
        console.warn('Cihaz iptal hatası:', err);
    }
};

/**
 * Koç e-postasını koç kaydına kaydet
 * @param {string} phone - Koç telefonu
 * @param {string} email - E-posta adresi
 */
export const saveCoachEmail = (phone, email) => {
    try {
        const users = JSON.parse(localStorage.getItem('users_db') || '[]');
        const idx = users.findIndex(u => u.phone === phone);
        if (idx !== -1) {
            users[idx].email = email;
            yaz('users_db', users);
        }
    } catch (e) {
        console.warn('Koç e-posta kaydetme hatası:', e);
    }
};

/**
 * Koça ait kayıtlı e-postayı getir
 * @param {string} phone - Koç telefonu
 */
export const getCoachEmail = (phone) => {
    try {
        const users = JSON.parse(localStorage.getItem('users_db') || '[]');
        const coach = users.find(u => u.phone === phone);
        return coach?.email || null;
    } catch (e) {
        return null;
    }
};

export default {
    sendMagicLinkToCoach,
    completeMagicLinkSignIn,
    isDeviceTrusted,
    trustThisDevice,
    revokeTrustedDevice,
    saveCoachEmail,
    getCoachEmail,
};
