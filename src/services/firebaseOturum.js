/**
 * 🔑 FIREBASE OTURUMU
 *
 * ⚠️ NEDEN VAR:
 *
 * Uygulamanın girişi `hybridAuth` içinde, localStorage üzerinde yapılıyor.
 * Firebase'in bundan haberi yoktu: veriye yazan istemci Firebase'e
 * "ben kimim" demiyordu. Bu yüzden Firestore kuralları `allow read, write:
 * if true` bırakılmıştı — yani proje kimliğini bilen HERKES bütün öğrenci
 * verisini okuyup silebilirdi.
 *
 * Kuralları kapatmak için istemcinin Firebase'e karşı kimlik kanıtlaması
 * gerekiyor. Kayıt sırasında zaten Firebase Auth hesabı açılıyordu
 * (`firebaseService.auth.signUp`), yalnızca girişte kullanılmıyordu.
 * Bu modül o eksik halkayı tamamlar.
 *
 * ⚠️ ANONİM GİRİŞ KULLANILMIYOR. Anonim oturum `request.auth != null`
 * koşulunu sağlar ama internetteki herkes anonim oturum açabilir; kuralı
 * sağlamış olmak korumak anlamına gelmez.
 */

import { auth } from '../firebaseConfig';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as fbSignOut,
} from 'firebase/auth';

/**
 * Uygulama kimliğinden Firebase'in kabul edeceği e-posta üretir.
 *
 * Koç telefonla, öğrenci okul numarasıyla giriyor; Firebase e-posta
 * istiyor. Kayıt tarafında da aynı biçim kullanılıyor, ikisi tutmalı.
 */
export const sanalEposta = (kimlik, rol) => {
    const temiz = String(kimlik ?? '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (!temiz) return null;
    return rol === 'student' ? `${temiz}@ogrenci.app` : `${temiz}@kocu.app`;
};

/** Şu an Firebase'de açık oturum var mı? */
export const oturumVar = () => Boolean(auth?.currentUser);

/**
 * Firebase oturumu açar. Hesap yoksa oluşturur.
 *
 * Giriş anında düz metin şifre elimizde olduğu için burada kullanılabiliyor;
 * şifre hiçbir yere KAYDEDİLMEZ, yalnızca Firebase'e iletilir. Firebase
 * kendi tarafında scrypt ile saklar.
 *
 * @param {string} kimlik  Telefon (koç) veya okul numarası (öğrenci)
 * @param {string} sifre   Kullanıcının girdiği şifre
 * @param {string} rol     'coach' | 'student' | 'admin'
 * @returns {Promise<{basarili:boolean, uid?:string, hata?:string}>}
 */
export const oturumAc = async (kimlik, sifre, rol) => {
    const eposta = sanalEposta(kimlik, rol);
    if (!eposta || !sifre) {
        return { basarili: false, hata: 'Kimlik veya şifre eksik.' };
    }

    /**
     * Firebase en az 6 karakter ister. Uygulamanın kendi şifre kuralları
     * daha katı ama eski kayıtlarda kısa şifre olabilir; böyle bir durumda
     * Firebase oturumu açılamaz. Uygulama girişi yine de çalışır (yerel
     * doğrulama geçerlidir), sadece bulut senkronu devre dışı kalır.
     */
    if (String(sifre).length < 6) {
        return { basarili: false, hata: 'Şifre Firebase için çok kısa (en az 6 karakter).' };
    }

    try {
        const sonuc = await signInWithEmailAndPassword(auth, eposta, sifre);
        return { basarili: true, uid: sonuc.user.uid };
    } catch (e) {
        // Hesap yoksa oluştur — uygulama girişi zaten doğrulanmış durumda
        if (e?.code === 'auth/user-not-found' || e?.code === 'auth/invalid-credential') {
            try {
                const yeni = await createUserWithEmailAndPassword(auth, eposta, sifre);
                return { basarili: true, uid: yeni.user.uid, olusturuldu: true };
            } catch (e2) {
                /**
                 * `invalid-credential` hem "hesap yok" hem "şifre yanlış"
                 * için dönebiliyor. Oluşturma da başarısızsa e-posta
                 * kullanımdadır, yani şifre yanlıştır.
                 */
                return { basarili: false, hata: e2?.code || e2?.message || 'Firebase oturumu açılamadı.' };
            }
        }
        return { basarili: false, hata: e?.code || e?.message || 'Firebase oturumu açılamadı.' };
    }
};

/**
 * Yalnızca DENER — hesap yoksa OLUŞTURMAZ.
 *
 * `oturumAc` hesabı yoksa açıyor; bu, "uygulama girişi zaten doğrulandı"
 * varsayımına dayanır. Sunucu tarafından kimlik doğrulayan akışlarda
 * (davetle katılmış öğrencinin girişi) bu varsayım geçersizdir: orada
 * şifreyi doğrulayan tek merci Firebase'dir, hesap otomatik açılırsa
 * yanlış şifreyle yeni bir hesap yaratılmış olurdu.
 */
export const oturumDene = async (kimlik, sifre, rol) => {
    const eposta = sanalEposta(kimlik, rol);
    if (!eposta || !sifre) return { basarili: false, hata: 'Kimlik veya şifre eksik.' };
    try {
        const sonuc = await signInWithEmailAndPassword(auth, eposta, sifre);
        return { basarili: true, uid: sonuc.user.uid };
    } catch (e) {
        return { basarili: false, hata: e?.code || 'Giriş doğrulanamadı.' };
    }
};

/** Çıkışta Firebase oturumunu da kapatır. */
export const oturumKapat = async () => {
    try { await fbSignOut(auth); } catch { /* zaten kapalıysa sorun değil */ }
};

export default { oturumAc, oturumDene, oturumKapat, oturumVar, sanalEposta };
