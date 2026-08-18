/**
 * 🧹 VERİ DÖNEMİ (data epoch)
 *
 * ⚠️ NEDEN VAR:
 *
 * Bu uygulama verisini localStorage'da tutar ve oradan Firestore'a
 * yükler. Yani Firestore'u temizlemek TEK BAŞINA yetmez: test verisi
 * duran bir tarayıcı uygulamayı açtığı anda senkronizasyon o veriyi
 * sunucuya geri yükler ve silinenler geri gelir.
 *
 * 17.08.2026'da sistem yayına hazırlanırken test döneminde birikmiş
 * bütün veri silindi (1.795 Firestore belgesi, 8 mükerrer koç hesabı).
 * Bu modül aynı temizliğin HER TARAYICIDA bir kez uygulanmasını sağlar:
 * damga tutmayan tarayıcı, uygulamanın kendi anahtarlarını siler ve
 * damgayı yazar. Sonraki açılışlarda hiçbir şey yapmaz.
 *
 * Damgayı yalnızca kasıtlı bir sıfırlama gerektiğinde artırın —
 * artırmak, uygulamayı açan HERKESİN yerel verisini siler.
 */

/** Artırılırsa tüm tarayıcılarda bir kez temizlik yapılır. */
export const VERI_DONEMI = '2026-08-17-yayin-oncesi-sifirlama-2';

const DAMGA_ANAHTARI = 'veri_donemi';

/**
 * Uygulamanın kendi anahtarları. Tarayıcının tamamını silmiyoruz —
 * başka bir sitenin verisine dokunmak doğru olmaz ve kullanıcının
 * tema tercihi gibi zararsız ayarları da gereksiz yere gider.
 *
 * Ön ek eşleşmesi kullanılıyor çünkü öğrenci başına dinamik anahtar
 * açılıyor (`coach_notes_12`, `program_1770475690159_config` gibi).
 */
const SILINECEK_ONEKLER = [
    'coach_', 'student_', 'users_db', 'exams_data', 'trials_data',
    'v2_results_data', 'program_', 'parent_links', 'study_log',
    'guidance_', 'pdr_', 'bep_', 'test_', 'envanter_', 'sosyometri_',
    'material_', 'group_', 'project_', 'presentation_', 'remote_',
    'approval_', 'invite_', 'coupon_', 'notification_', 'whatsapp_',
    'tab_seen_', 'topic_', 'xp_', 'badge_', 'pomodoro_', 'leaderboard_',
    'admin_master_password', 'currentUser', 'coach_subscriptions',

    // Oturum ve bildirim artıkları. İlk temizlikte atlanmışlardı; gerçek
    // tarayıcıda `user_session` hâlâ duruyordu, yani sıfırlanan sistemde
    // eski oturum açık kalıyordu.
    'user_session', 'sec_last_activity', 'session_',
    'app_notifications', 'user_notifications',
    'gamification_', 'section_tab_',
];

/**
 * Silinmeyecek anahtarlar. Ön ek listesine takılsalar bile korunurlar.
 *
 * `university_scores_*` üniversite taban puanları — kullanıcı verisi değil,
 * uygulamanın referans verisi. Silmek gereksiz yere yeniden indirtir.
 */
const KORUNACAK = ['theme_mode', 'app_settings', 'gemini_api_key'];

const silinmeli = (anahtar) =>
    !KORUNACAK.includes(anahtar)
    && SILINECEK_ONEKLER.some((o) => anahtar === o || anahtar.startsWith(o));

/**
 * Gerekiyorsa yerel veriyi temizler.
 *
 * Uygulama açılışında, senkronizasyon başlamadan ÖNCE çağrılmalıdır;
 * sonra çağrılırsa eski veri sunucuya çoktan gitmiş olur.
 *
 * @returns {{yapildi:boolean, silinen:number}}
 */
export const donemKontrol = () => {
    try {
        if (localStorage.getItem(DAMGA_ANAHTARI) === VERI_DONEMI) {
            return { yapildi: false, silinen: 0 };
        }

        const silinecek = Object.keys(localStorage).filter(silinmeli);
        silinecek.forEach((k) => {
            try { localStorage.removeItem(k); } catch { /* tek anahtar geçilebilir */ }
        });

        localStorage.setItem(DAMGA_ANAHTARI, VERI_DONEMI);
        return { yapildi: true, silinen: silinecek.length };
    } catch {
        // localStorage kapalıysa (gizli sekme kısıtı) uygulama yine açılmalı
        return { yapildi: false, silinen: 0 };
    }
};

// ══════════════════════════════════════════════════════════════
//  MARKA GÖÇÜ
// ══════════════════════════════════════════════════════════════

/**
 * Uygulama adı, kurumların kendi adlarını yazabilmesi için
 * `app_settings.general.appName` altında saklanır ve arayüzde bunun
 * değeri gösterilir.
 *
 * Sorun: veri temizliğinde `app_settings` KORUNUYOR (kullanıcının tema
 * tercihi orada). Dolayısıyla marka "Başarı Kampı" olarak değiştikten
 * sonra bile panel başlığında eski ad görünmeye devam ediyordu.
 *
 * Bu göç yalnızca BİLİNEN ESKİ ADLARI düzeltir. Kurum kendi adını
 * yazdıysa ona dokunmaz — kimsenin kendi markasını ezmek istemiyoruz.
 */
const ESKI_ADLAR = [
    'ai ogrenci kocu',
    'yz ogrenci kocu',
    'ai koc',
    'ai kocu',
    'kocluk sistemi',
];

/**
 * Karşılaştırma için Türkçe karakterleri sadeleştirir.
 *
 * ⚠️ `toLocaleLowerCase('tr-TR')` KULLANILAMAZ: Türkçe yerelde 'I' harfi
 * NOKTASIZ 'ı'ya dönüşür, yani "AI Öğrenci Koçu" → "aı öğrenci koçu".
 * Listede noktalı 'i' aradığımız için eşleşme tutmuyordu ve eski ad
 * ekranda kalmaya devam ediyordu.
 */
const sadelestir = (s) => String(s)
    .replace(/[İIı]/g, 'i')
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/\s+/g, ' ')
    .trim();

export const markaGocu = (yeniAd) => {
    try {
        const ham = localStorage.getItem('app_settings');
        if (!ham) return false;
        const ayar = JSON.parse(ham);
        const mevcut = ayar?.general?.appName;
        if (!mevcut) return false;

        if (!ESKI_ADLAR.includes(sadelestir(mevcut))) {
            return false;   // kurumun kendi adı — dokunma
        }

        ayar.general.appName = yeniAd;
        localStorage.setItem('app_settings', JSON.stringify(ayar));
        try { window.dispatchEvent(new Event('settings-updated')); } catch { /* ignore */ }
        /* Buluta da gitsin — gitmezse bir sonraki senkron turu eski adı
           geri indirir ve göç her açılışta tekrarlanır. Bu dosya alt
           katman olduğu için veriDeposu'na bağlanmıyor (döngü riski);
           veriDeposu.buluta ile aynı korumalı desen. */
        try { window.firebaseSync?.syncKey?.('app_settings'); } catch { /* senkron yoksa sorun değil */ }
        return true;
    } catch {
        return false;
    }
};

export default { donemKontrol, markaGocu, VERI_DONEMI };
