import { nesneOku, oku, listeOku } from './veriDeposu';
/**
 * 🛡️ GENEL GÜVENLİK SERVİSİ
 *
 * - Giriş denemesi sınırlama (Rate Limiting)
 * - Oturum zaman aşımı (Session Timeout)
 * - Girdi temizleme (Input Sanitization)
 * - Şüpheli aktivite tespiti
 */

// ════════════════════════════════════════════════════════════
//  AYARLAR
// ════════════════════════════════════════════════════════════
const CONFIG = {
    MAX_LOGIN_ATTEMPTS: 5,           // Maksimum hatalı giriş denemesi
    LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 dakika kilitlenme
    SESSION_TIMEOUT_MS: 8 * 60 * 60 * 1000,  // Varsayılan: 8 saat hareketsizlik
    SESSION_WARNING_MS: 7.5 * 60 * 60 * 1000,  // Zaman aşımından 30 dk önce uyarı
    STORAGE_KEY_ATTEMPTS: 'sec_login_attempts',
    STORAGE_KEY_ACTIVITY: 'sec_last_activity',
};

/**
 * Oturum süresi Ayarlar penceresinden yönetilir (Genel → Oturum Zaman
 * Aşımı, dakika). Eskiden bu değer yalnızca kaydediliyor ama hiçbir yerde
 * okunmuyordu; süre her zaman sabit 8 saatti.
 *
 * Uyarı, zaman aşımından 5 dakika önce (kısa sürelerde sürenin %10'u
 * kadar önce) verilir.
 */
const sureleriAyarlardanYukle = () => {
    try {
        const s = nesneOku('app_settings');
        const dk = parseInt(s?.general?.sessionTimeout, 10);
        if (!Number.isFinite(dk) || dk < 5) return;          // 5 dk altı kabul edilmez
        CONFIG.SESSION_TIMEOUT_MS = dk * 60 * 1000;
        const uyariOnce = Math.min(5 * 60 * 1000, CONFIG.SESSION_TIMEOUT_MS * 0.1);
        CONFIG.SESSION_WARNING_MS = Math.max(0, CONFIG.SESSION_TIMEOUT_MS - uyariOnce);
    } catch {
        /* bozuk ayar kaydı varsa varsayılan süre kalsın */
    }
};

sureleriAyarlardanYukle();


// ════════════════════════════════════════════════════════════
//  GİRİŞ DENEMESI SINIRLANDIRMA (Rate Limiting)
// ════════════════════════════════════════════════════════════

/**
 * Giriş denemesini kaydet
 * @param {string} identifier - Telefon/okul numarası
 */
export const recordFailedAttempt = (identifier) => {
    try {
        const key = `${CONFIG.STORAGE_KEY_ATTEMPTS}_${btoa(identifier)}`;
        const stored = oku(key, null) || { count: 0, firstAt: 0, lockedUntil: 0 };

        const now = Date.now();

        // Kilitleme süresi dolmuşsa sıfırla
        if (stored.lockedUntil && now > stored.lockedUntil) {
            localStorage.removeItem(key);
            return { locked: false, attemptsLeft: CONFIG.MAX_LOGIN_ATTEMPTS };
        }

        stored.count += 1;
        if (!stored.firstAt) stored.firstAt = now;

        // Maksimum deneme aşıldıysa kilitle
        if (stored.count >= CONFIG.MAX_LOGIN_ATTEMPTS) {
            stored.lockedUntil = now + CONFIG.LOCKOUT_DURATION_MS;
            localStorage.setItem(key, JSON.stringify(stored));
            return {
                locked: true,
                lockedUntil: stored.lockedUntil,
                minutesLeft: Math.ceil(CONFIG.LOCKOUT_DURATION_MS / 60000),
            };
        }

        localStorage.setItem(key, JSON.stringify(stored));
        return {
            locked: false,
            attemptsLeft: CONFIG.MAX_LOGIN_ATTEMPTS - stored.count,
        };
    } catch (e) {
        return { locked: false, attemptsLeft: CONFIG.MAX_LOGIN_ATTEMPTS };
    }
};

/**
 * Hesap kilitli mi kontrol et
 * @param {string} identifier
 */
export const checkLoginLock = (identifier) => {
    try {
        const key = `${CONFIG.STORAGE_KEY_ATTEMPTS}_${btoa(identifier)}`;
        const stored = oku(key, null);

        if (!stored) return { locked: false };

        const now = Date.now();

        if (stored.lockedUntil && now < stored.lockedUntil) {
            const msLeft = stored.lockedUntil - now;
            const minutesLeft = Math.ceil(msLeft / 60000);
            const secondsLeft = Math.ceil(msLeft / 1000);
            return {
                locked: true,
                minutesLeft,
                secondsLeft,
                lockedUntil: stored.lockedUntil,
            };
        }

        // Kilit süresi dolmuş
        if (stored.lockedUntil && now >= stored.lockedUntil) {
            localStorage.removeItem(key);
        }

        return { locked: false, attempts: stored.count || 0 };
    } catch (e) {
        return { locked: false };
    }
};

/**
 * Başarılı girişten sonra deneme sayacını sıfırla
 * @param {string} identifier
 */
export const resetLoginAttempts = (identifier) => {
    try {
        const key = `${CONFIG.STORAGE_KEY_ATTEMPTS}_${btoa(identifier)}`;
        localStorage.removeItem(key);
    } catch (e) { /* sessizce devam et */ }
};


// ════════════════════════════════════════════════════════════
//  OTURUM ZAMAN AŞIMI (Session Timeout)
// ════════════════════════════════════════════════════════════

let _sessionTimer = null;
let _warningTimer = null;
let _onTimeoutCallback = null;
let _onWarningCallback = null;

/**
 * Aktiviteyi güncelle (her kullanıcı etkileşiminde çağrılır)
 */
export const updateActivity = () => {
    localStorage.setItem(CONFIG.STORAGE_KEY_ACTIVITY, Date.now().toString());
    _resetTimers();
};

/**
 * Oturum zaman aşımı izlemeyi başlat
 * @param {Function} onTimeout - Oturum sona erince çağrılır
 * @param {Function} onWarning - Uyarı zamanı gelince çağrılır (5 dk kala)
 */
export const startSessionWatch = (onTimeout, onWarning) => {
    _onTimeoutCallback = onTimeout;
    _onWarningCallback = onWarning;

    // Kullanıcı etkileşimlerini dinle
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(event => {
        document.addEventListener(event, updateActivity, { passive: true });
    });

    updateActivity(); // Başlangıç aktivitesini kaydet
};

/**
 * Oturum izlemeyi durdur (çıkış yaparken)
 */
export const stopSessionWatch = () => {
    _clearTimers();
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(event => {
        document.removeEventListener(event, updateActivity);
    });
};

const _resetTimers = () => {
    _clearTimers();

    _warningTimer = setTimeout(() => {
        if (_onWarningCallback) _onWarningCallback();
    }, CONFIG.SESSION_WARNING_MS);

    _sessionTimer = setTimeout(() => {
        if (_onTimeoutCallback) _onTimeoutCallback();
    }, CONFIG.SESSION_TIMEOUT_MS);
};

const _clearTimers = () => {
    if (_sessionTimer) clearTimeout(_sessionTimer);
    if (_warningTimer) clearTimeout(_warningTimer);
    _sessionTimer = null;
    _warningTimer = null;
};

/**
 * Mevcut oturumun hala geçerli olup olmadığını kontrol et
 */
export const isSessionValid = () => {
    try {
        const lastActivity = parseInt(localStorage.getItem(CONFIG.STORAGE_KEY_ACTIVITY) || '0');
        if (!lastActivity) return false;
        return (Date.now() - lastActivity) < CONFIG.SESSION_TIMEOUT_MS;
    } catch (e) {
        return false;
    }
};


// Ayarlar penceresinden süre değiştirilirse çalışan sayaçlar yenilenir.
// (Tanım sırası nedeniyle burada — _resetTimers yukarıda tanımlanıyor.)
if (typeof window !== 'undefined') {
    window.addEventListener('settings-updated', () => {
        sureleriAyarlardanYukle();
        if (_sessionTimer || _warningTimer) _resetTimers();
    });
}

// ════════════════════════════════════════════════════════════
//  GİRDİ TEMİZLEME (Input Sanitization)
// ════════════════════════════════════════════════════════════

/**
 * HTML özel karakterleri temizle (XSS önleme)
 * @param {string} input
 */
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return String(input || '');
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
};

/**
 * Telefon numarasını doğrula ve temizle
 * @param {string} phone
 */
export const sanitizePhone = (phone) => {
    if (!phone) return '';
    // Sadece rakam, +, -, boşluk karakterlerine izin ver
    return phone.replace(/[^0-9+\-\s]/g, '').trim();
};

/**
 * İsim girişini doğrula
 * @param {string} name
 */
export const sanitizeName = (name) => {
    if (!name) return '';
    // Script tagları vb. kaldır, maks 100 karakter
    return name.replace(/<[^>]*>/g, '').trim().slice(0, 100);
};

/**
 * E-posta formatını doğrula
 * @param {string} email
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};


// ════════════════════════════════════════════════════════════
//  ŞÜPHELİ AKTİVİTE TESPİTİ
// ════════════════════════════════════════════════════════════

const SUSPICIOUS_LOG_KEY = 'sec_suspicious_log';

/**
 * Şüpheli aktiviteyi kaydet
 * @param {string} type - 'multiple_failures' | 'unusual_time' | 'rapid_requests'
 * @param {string} detail - Detay
 */
export const logSuspiciousActivity = (type, detail) => {
    try {
        const log = listeOku(SUSPICIOUS_LOG_KEY);
        log.push({
            type,
            detail,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent.slice(0, 100),
        });
        // Maks 50 kayıt tut
        if (log.length > 50) log.shift();
        localStorage.setItem(SUSPICIOUS_LOG_KEY, JSON.stringify(log));
    } catch (e) { /* sessizce devam et */ }
};

/**
 * Güvenlik loglarını getir (admin için)
 */
export const getSecurityLogs = () => {
    try {
        return listeOku(SUSPICIOUS_LOG_KEY);
    } catch (e) {
        return [];
    }
};

/**
 * Gecenin geç saatinde giriş tespit et (şüpheli)
 */
export const isUnusualLoginTime = () => {
    const hour = new Date().getHours();
    return hour >= 1 && hour <= 5; // 01:00 - 05:00 arası
};

export default {
    recordFailedAttempt,
    checkLoginLock,
    resetLoginAttempts,
    startSessionWatch,
    stopSessionWatch,
    updateActivity,
    isSessionValid,
    sanitizeInput,
    sanitizePhone,
    sanitizeName,
    isValidEmail,
    logSuspiciousActivity,
    getSecurityLogs,
    isUnusualLoginTime,
};
