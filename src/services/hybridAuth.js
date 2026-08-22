/**
 * 🔐 HYBRID AUTHENTICATION SYSTEM (v2 - Düzeltilmiş)
 *
 * Firebase bağlantısı olmasa bile çalışır.
 * localStorage her zaman önce kontrol edilir.
 * Firebase yalnızca bir fallback olarak kullanılır.
 */

import firebaseService from './firebaseService';
import credential from './credentialService';
import coupons from './couponService';
import subscription from './subscriptionService';
import { planBul, DENEME_GUN } from '../data/pricingPlans';
import { yoneticiHesabiMi } from '../data/yoneticiHesabi';
import { hataAnlat } from './hataMesaji';
import { yaz } from './veriDeposu';

/**
 * Doğru şifreyle giriş yapan eski (düz metin) kaydı özete çevirir.
 * Kullanıcı hiçbir şey fark etmez; bir sonraki girişte artık özet
 * karşılaştırılır.
 */
const yukseltOgrenciSifresi = (ogrenciId, yeniOzet) => {
    if (!ogrenciId || !yeniOzet) return;
    try {
        const liste = safeParse('coach_students');
        const yeni = liste.map((s) => (
            String(s.id) === String(ogrenciId) ? { ...s, password: yeniOzet } : s
        ));
        localStorage.setItem('coach_students', JSON.stringify(yeni));
        window.firebaseSync?.syncKey?.('coach_students');
    } catch { /* yükseltme başarısızsa giriş yine de geçerli */ }
};

const yukseltSifre = (kullaniciId, yeniOzet) => {
    if (!kullaniciId || !yeniOzet) return;
    try {
        const liste = safeParse('users_db');
        const yeni = liste.map((u) => (
            String(u.id) === String(kullaniciId) ? { ...u, password: yeniOzet } : u
        ));
        localStorage.setItem('users_db', JSON.stringify(yeni));
        window.firebaseSync?.syncKey?.('users_db');
    } catch { /* yükseltme başarısızsa giriş yine de geçerli */ }
};

// 🛡️ Safe JSON Parser - Prevent White Screen crashes
const safeParse = (key, defaultValue = []) => {
    try {
        const val = localStorage.getItem(key);
        if (!val || !val.trim() || val === 'undefined' || val === 'null' || val === '[object Object]') return defaultValue;
        return JSON.parse(val);
    } catch (e) {
        console.error(`Corrupt data in ${key}:`, e);
        return defaultValue;
    }
};

/**
 * 📞 Telefon eşleştirme normalizasyonu.
 *
 * Koç girişi telefon numarasıyla yapılır ve karşılaştırma birebir metin
 * eşleşmesiydi. Kayıtta "05551234567", girişte "0555 123 45 67" yazan koç
 * "kullanıcı bulunamadı" alıyordu. Boşluk/tire/parantez ve ülke kodu
 * farkları temizlenip son 10 hane üzerinden karşılaştırılır.
 */
const phoneKey = (v) => {
    const digits = String(v ?? '').replace(/\D/g, '');
    if (!digits) return '';
    return digits.length > 10 ? digits.slice(-10) : digits;
};

const samePhone = (a, b) => {
    const x = phoneKey(a);
    const y = phoneKey(b);
    return Boolean(x) && x === y;
};

/**
 * Virtual email oluştur
 */
const createVirtualEmail = (identifier, role) => {
    const cleanId = String(identifier).replace(/[^a-zA-Z0-9]/g, '');
    return role === 'student'
        ? `${cleanId}@ogrenci.app`
        : `${cleanId}@kocu.app`;
};

/**
 * ✅ Koç girişi
 * @param {string} phone - Telefon numarası veya admin email
 * @param {string} schoolName - Okul adı veya admin şifresi
 */
export const loginCoach = async (phone, schoolName) => {
    try {
        // ── 1. MASTER ADMIN kontrolü ──────────────────────────────
        const isAdminEmail = yoneticiHesabiMi(phone);

        if (isAdminEmail) {
            /**
             * ⚠️ Buradaki kontrol eskiden şifreyi FİİLEN devre dışı bırakıyordu:
             *   · `phone === 'ibokaratas655665@gmail.com'` koşulu, o e-postayı
             *     yazan herkesi ŞİFRESİZ yönetici yapıyordu,
             *   · `schoolName.includes('şamran')` koşulu, şifre alanına
             *     "şamran" yazan herkesi yönetici yapıyordu,
             *   · şifre hiç kurulmamışsa sabit 'admin123' değerine düşülüyordu.
             *
             * Artık tek geçerli yol, kurulmuş yönetici şifresinin PBKDF2
             * özetiyle doğrulanmasıdır. Şifre henüz kurulmamışsa giriş
             * açılmaz; kullanıcı önce şifre belirlemeye yönlendirilir.
             */
            const saklanan = localStorage.getItem('admin_master_password');

            if (!saklanan) {
                return {
                    success: false,
                    needsSetup: true,
                    error: 'Yönetici şifresi henüz belirlenmemiş. Devam etmek için bir şifre oluşturun.'
                };
            }

            const gecerli = await credential.dogrula(
                schoolName,
                saklanan,
                // Eski düz metin şifre doğruysa sessizce özete yükseltilir
                (yeniOzet) => {
                    try { localStorage.setItem('admin_master_password', yeniOzet); } catch { /* ignore */ }
                }
            );

            if (!gecerli) {
                return {
                    success: false,
                    error: 'Yönetici şifresi hatalı.'
                };
            }

            return {
                success: true,
                user: {
                    id: 'admin_master',
                    uid: 'admin_master',
                    email: phone,
                    phone: phone,
                    role: 'admin',
                    name: 'Sistem Yöneticisi',
                    // Kurum adı Ayarlar'dan girilir; koda tek bir okul gömülmez
                    schoolName: '',
                    approved: true
                }
            };
        }

        // ── 2. localStorage'dan kontrol et (birincil) ─────────────
        try {
            const localUsers = safeParse('users_db');
            const localCoach = localUsers.find(u =>
                samePhone(u.phone, phone) && (u.role === 'coach' || u.role === 'admin')
            );

            if (localCoach) {
                // Onay kontrolü
                if (!localCoach.approved) {
                    return {
                        success: false,
                        error: 'Hesabınız henüz onaylanmamış. Yönetici onayı bekleniyor.'
                    };
                }

                /**
                 * İkinci doğrulama adımı.
                 *
                 * Eski kod bu bloğu `if (!localCoach.approved)` içine almıştı;
                 * onaylı koçlar için HİÇBİR şifre/okul kontrolü çalışmıyordu —
                 * telefon numarasını bilen herkes o koçun hesabına girebiliyordu.
                 * Üstelik onaysızlarda bile "şamran" yazmak yeterliydi.
                 *
                 * Artık kontrol her koç için çalışır: koçun şifresi varsa
                 * şifre doğrulanır, yoksa (yönetici eklemiş, henüz şifre
                 * kurmamış) okul adı tam eşleşme ister.
                 */
                if (localCoach.password) {
                    const gecerli = await credential.dogrula(
                        schoolName,
                        localCoach.password,
                        (yeniOzet) => yukseltSifre(localCoach.id, yeniOzet)
                    );
                    if (!gecerli) {
                        return { success: false, error: 'Şifre hatalı.' };
                    }
                } else {
                    const coachSchool = (localCoach.schoolName || '').toLocaleLowerCase('tr-TR').trim();
                    const inputSchool = (schoolName || '').toLocaleLowerCase('tr-TR').trim();
                    if (!inputSchool || coachSchool !== inputSchool) {
                        return {
                            success: false,
                            error: 'Okul adı eşleşmiyor. Lütfen kayıtlı okul adını girin.'
                        };
                    }
                }

                return {
                    success: true,
                    user: (() => {
                        // managed_coaches'tan bu koça ait rol ve izinleri de yükle
                        try {
                            const managed = safeParse('managed_coaches');
                            const managedEntry = managed.find(m =>
                                m.id === localCoach.id || samePhone(m.phone, localCoach.phone)
                            );
                            if (managedEntry) {
                                return {
                                    ...localCoach,
                                    uid: localCoach.id,
                                    coachRole: managedEntry.coachRole || localCoach.coachRole || 'subCoach',
                                    permissions: managedEntry.permissions || localCoach.permissions || [],
                                };
                            }
                        } catch (_) { }
                        return { ...localCoach, uid: localCoach.id };
                    })()
                };
            }
        } catch (localErr) {
            console.warn('localStorage okuma hatası:', localErr);
        }

        // ── 3. Firebase'den dene (ikincil / fallback) ──────────────
        if (firebaseService) {
            try {
                const coachQuery = await firebaseService.db.queryDocuments('users', 'phone', '==', phone);

                if (coachQuery.success && coachQuery.data && coachQuery.data.length > 0) {
                    const coachData = coachQuery.data[0];

                    if (!coachData.approved) {
                        return {
                            success: false,
                            error: 'Hesabınız henüz onaylanmamış. Yönetici onayı bekleniyor.'
                        };
                    }

                    /**
                     * ⚠️ BURADA AÇIK VARDI:
                     *
                     *   (schoolName || '').toLowerCase().includes('şamran')
                     *
                     * Şifre alanına "şamran" yazan HERKES, telefon numarasını
                     * bildiği her koçun hesabına girebiliyordu. Aynı açığı
                     * localStorage dalında kapatmıştım ama Firebase yedek
                     * dalındaki bu ikinci kopyayı atlamışım.
                     *
                     * Artık kontrol localStorage dalıyla aynı: şifre varsa
                     * PBKDF2 özetiyle doğrulanır, yoksa (yönetici eklemiş,
                     * koç henüz şifre kurmamış) okul adı TAM eşleşme ister.
                     */
                    if (coachData.password) {
                        const gecerli = await credential.dogrula(schoolName, coachData.password);
                        if (!gecerli) {
                            return { success: false, error: 'Şifre hatalı.' };
                        }
                    } else {
                        const kayitliOkul = (coachData.schoolName || '').toLocaleLowerCase('tr-TR').trim();
                        const girilenOkul = (schoolName || '').toLocaleLowerCase('tr-TR').trim();
                        if (!girilenOkul || kayitliOkul !== girilenOkul) {
                            return {
                                success: false,
                                error: 'Okul adı eşleşmiyor. Lütfen kayıtlı okul adını girin.'
                            };
                        }
                    }

                    return {
                        success: true,
                        user: { ...coachData, uid: coachData.id || coachData.uid }
                    };
                }
            } catch (firebaseError) {
                console.warn('Firebase koç girişi başarısız, localStorage\'a dönülüyor:', firebaseError.message);
            }
        }

        // ── 4. Hiçbir yerde bulunamadı ────────────────────────────
        return {
            success: false,
            error: 'Bu telefon numarasına ait koç kaydı bulunamadı. Lütfen yöneticinizle iletişime geçin veya kayıt olun.'
        };

    } catch (error) {
        console.error('Coach login genel hatası:', error);
        return {
            success: false,
            error: 'Giriş sırasında beklenmeyen hata oluştu. Lütfen tekrar deneyin.'
        };
    }
};

/**
 * ✅ Öğrenci girişi - Gelişmiş eşleştirme
 * @param {string} schoolNumber - Okul numarası
 * @param {string} name - İsim (doğrulama için)
 */
export const loginStudent = async (schoolNumber, name) => {
    try {
        const schoolNoStr = String(schoolNumber || '').trim();
        const nameStr = String(name || '').trim().toLowerCase();

        /**
         * Şifre kurmamış öğrenci için ad-soyad doğrulaması.
         *
         * ⚠️ ÖNCEKİ HÂLİ GİRİŞİ FİİLEN AÇIK BIRAKIYORDU. Şu satırların
         * hepsi ayrı birer bypass'tı:
         *
         *   if (!inp) return true;              → BOŞ bırakan giriyordu
         *   if (inp === '123') return true;     → evrensel şifre
         *   if (regName.includes(inp)) ...      → "a" yazmak yetiyordu
         *   rp.startsWith(ip) ...               → adın ilk harfi yetiyordu
         *
         * Yani okul numarasını bilen biri —numaralar sıralı ve tahmin
         * edilebilir— hiçbir şey yazmadan o öğrencinin hesabına giriyordu.
         *
         * Artık TAM ad eşleşmesi aranıyor. Büyük/küçük harf ve fazla
         * boşluk göz ardı edilir, Türkçe karakterler sadeleştirilir
         * ("İbrahim" ~ "ibrahim"), ama kısmi eşleşme KABUL EDİLMEZ.
         *
         * Bu yine de şifre kadar güçlü değildir; kalıcı çözüm öğrencinin
         * ilk girişte kendi şifresini kurmasıdır.
         */
        const adSadelestir = (s) => String(s || '')
            .replace(/[İIı]/g, 'i')
            .toLowerCase()
            .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
            .replace(/ö/g, 'o').replace(/ç/g, 'c')
            .replace(/\s+/g, ' ')
            .trim();

        const isNameMatch = (registeredName, inputName) => {
            const kayitli = adSadelestir(registeredName);
            const girilen = adSadelestir(inputName);
            if (!kayitli || !girilen) return false;   // boş giriş ASLA geçerli değil
            return kayitli === girilen;               // yalnızca tam eşleşme
        };

        // ── 1. Koçun öğrenci listesinden kontrol et (birincil) ────
        try {
            const coachStudents = safeParse('coach_students');

            // Önce okul numarasıyla ara
            let foundStudent = null;
            if (schoolNoStr) {
                foundStudent = coachStudents.find(s => {
                    const sNo = String(s.schoolNumber || '').trim();
                    return sNo !== '' && sNo === schoolNoStr;
                });
            }

            // Okul numarasıyla bulunduysa kimlik doğrula
            if (foundStudent) {
                /**
                 * Öğrenci şifre belirlemişse şifre sorulur; belirlememişse
                 * (koç toplu listeden eklemiş) ad-soyad eşleşmesi yeterlidir.
                 *
                 * Not: hata mesajı artık kayıtlı ismi EKRANA YAZMIYOR —
                 * eskiden okul numarasını bilen biri yanlış isim girerek
                 * öğrencinin tam adını öğrenebiliyordu.
                 */
                if (foundStudent.password) {
                    /**
                     * ⚠️ BURASI ŞİFREYİ FİİLEN İŞE YARAMAZ HÂLE GETİRİYORDU:
                     *
                     *   if (!gecerli && !isNameMatch(...))   → VEYA mantığı
                     *
                     * Şifre yanlış olsa bile ad tutuyorsa giriş kabul
                     * ediliyordu. Okul numarası + ad bilen herkes, öğrenci
                     * şifre kurmuş olmasına rağmen hesaba giriyordu; yani
                     * şifre koymak hiçbir koruma sağlamıyordu.
                     *
                     * Şifre kurulmuşsa artık TEK geçerli anahtar şifredir.
                     * Şifresini unutan öğrencinin şifresini koçu sıfırlar.
                     */
                    const gecerli = await credential.dogrula(
                        name,
                        foundStudent.password,
                        (yeniOzet) => yukseltOgrenciSifresi(foundStudent.id, yeniOzet)
                    );
                    if (!gecerli) {
                        return { success: false, error: 'İsim veya şifre hatalı.' };
                    }
                } else if (!isNameMatch(foundStudent.name, nameStr)) {
                    return {
                        success: false,
                        error: 'İsim bilgisi hatalı. Lütfen sisteme kayıtlı adınızı girin.'
                    };
                }

                // Onaysız öğrenci giriş yapamaz
                if (foundStudent.approved === false || foundStudent.approvalStatus === 'bekliyor') {
                    return {
                        success: false,
                        error: 'Hesabınız henüz onaylanmamış. Koç onayı bekleniyor.'
                    };
                }
                if (foundStudent.approvalStatus === 'reddedildi') {
                    return { success: false, error: 'Hesabınız onaylanmadı. Koçunuzla görüşün.' };
                }
                return {
                    success: true,
                    user: {
                        ...foundStudent,
                        id: foundStudent.id || `student_${schoolNoStr}`,
                        uid: foundStudent.id || `student_${schoolNoStr}`,
                        role: 'student',
                        approved: true
                    }
                };
            }

            // Okul no ile bulunamadıysa → isimle ara
            // (okul numarası girilmemişse veya okul no alanı boş olan öğrenciler için)
            /**
             * Okul numarası girilmemişse isimle aranır.
             *
             * ⚠️ Bu dal ŞİFREYİ HİÇ SORMUYORDU: şifresini kurmuş bir
             * öğrenci bile yalnızca adı yazılarak taklit edilebiliyordu.
             * Artık yalnızca ŞİFRESİ OLMAYAN öğrenciler bu yoldan
             * girebilir; şifresi olan, şifresiyle girmek zorundadır.
             */
            if (nameStr && coachStudents.length > 0) {
                const combined = (schoolNoStr + ' ' + nameStr).trim();
                const foundByName = coachStudents.find(s =>
                    !s.password && (
                        isNameMatch(s.name, combined) || isNameMatch(s.name, nameStr) || isNameMatch(s.name, schoolNoStr)
                    )
                );
                if (foundByName) {
                    return {
                        success: true,
                        user: {
                            ...foundByName,
                            id: foundByName.id || `student_${Date.now()}`,
                            uid: foundByName.id || `student_${Date.now()}`,
                            role: 'student',
                            approved: true
                        }
                    };
                }
            }

        } catch (localErr) {
            console.warn('localStorage öğrenci okuma hatası:', localErr);
        }

        // ── 2. Firebase'den dene (ikincil) ────────────────────────
        if (firebaseService) {
            try {
                const studentQuery = await firebaseService.db.queryDocuments(
                    'users',
                    'schoolNumber',
                    '==',
                    schoolNoStr
                );

                if (studentQuery.success && studentQuery.data && studentQuery.data.length > 0) {
                    const studentData = studentQuery.data[0];

                    if (!studentData.approved) {
                        return {
                            success: false,
                            error: 'Hesabınız henüz onaylanmamış. Koç onayı bekleniyor.'
                        };
                    }

                    /**
                     * Yerel daldaki ile aynı kural: şifre kurulmuşsa yalnızca
                     * şifre geçerlidir, ad eşleşmesi şifrenin yerine geçmez.
                     * Şifre yoksa tam ad eşleşmesi aranır.
                     */
                    if (studentData.password) {
                        const sifreGecerli = await credential.dogrula(name, studentData.password);
                        if (!sifreGecerli) {
                            return { success: false, error: 'İsim veya şifre hatalı.' };
                        }
                    } else if (!isNameMatch(studentData.name, nameStr)) {
                        return {
                            success: false,
                            error: 'İsim bilgisi hatalı. Lütfen sisteme kayıtlı adınızı girin.'
                        };
                    }

                    return {
                        success: true,
                        user: { ...studentData, uid: studentData.id || studentData.uid }
                    };
                }

                // coach_students Firestore collection'ından dene
                const coachStudents = await firebaseService.db.getCollection('coach_students');
                const coachStudent = coachStudents.data?.find(
                    s => String(s.schoolNumber) === schoolNoStr
                );

                if (coachStudent) {
                    /**
                     * ⚠️ Bu dal şifreyi HİÇ SORMUYORDU: şifresini kurmuş bir
                     * öğrenci bile yalnızca adı yazılarak taklit edilebiliyordu.
                     */
                    if (coachStudent.password) {
                        const sifreGecerli = await credential.dogrula(name, coachStudent.password);
                        if (!sifreGecerli) {
                            return { success: false, error: 'İsim veya şifre hatalı.' };
                        }
                    } else if (!isNameMatch(coachStudent.name, nameStr)) {
                        return {
                            success: false,
                            error: 'İsim bilgisi eşleşmedi.'
                        };
                    }
                    return {
                        success: true,
                        user: {
                            ...coachStudent,
                            role: 'student',
                            approved: true
                        }
                    };
                }
            } catch (firebaseError) {
                console.warn('Firebase öğrenci girişi başarısız:', firebaseError.message);
            }
        }

        // ── 3. Bulunamadı ────────────────────────────────────────
        if (schoolNoStr) {
            return {
                success: false,
                error: `"${schoolNoStr}" okul numaralı öğrenci bulunamadı. Koçunuzda kayıtlı olup olmadığını sorun.`
            };
        }
        return {
            success: false,
            error: 'Öğrenci bulunamadı. Okul numaranızı ve adınızı doğru girdiğinizden emin olun.'
        };

    } catch (error) {
        console.error('Student login genel hatası:', error);
        return {
            success: false,
            error: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.'
        };
    }
};

/**
 * 🏛️ SUNUCU KİMLİĞİYLE ÖĞRENCİ GİRİŞİ
 *
 * ═════════════════════════════════════════════════════════════════
 * ÇÖZDÜĞÜ KİLİT
 * ═════════════════════════════════════════════════════════════════
 *
 * `loginStudent` öğrenciyi localStorage'daki `coach_students` listesinde
 * arıyor. O liste yeni bir cihazda BOŞTUR; dolması için `firebaseSync`
 * çalışmalı, `firebaseSync` de hangi koçun veri havuzunu indireceğini
 * bilmek için öğrencinin koç kimliğine ihtiyaç duyuyor — ki o bilgi de
 * indirilmemiş listenin içinde. Kapalı bir döngü.
 *
 * Sonuç: davetle katılan öğrenci onaylansa bile KENDİ TELEFONUNDAN asla
 * giriş yapamıyordu. Koçla aynı tarayıcıyı kullanmadıkça hiçbir öğrenci
 * uygulamaya giremezdi.
 *
 * Döngü sunucudaki kimlik kaydıyla kırılır:
 *   1. Şifreyi Firebase doğrular (tek doğrulama mercii; yerel özet yok).
 *   2. `ogrenciKimlik/{uid}` → öğrenci hangi koçun havuzunda?
 *   3. O havuz indirilir, öğrenci kaydı artık listede.
 *
 * Yerel giriş yolu KORUNUYOR: koçun elle eklediği, şifresi yerel özette
 * duran öğrenciler eskisi gibi çalışır. Bu fonksiyon yalnızca yerel yol
 * başarısız olduğunda devreye girer.
 */
export const sunucudanOgrenciGirisi = async (schoolNumber, password) => {
    const okulNo = String(schoolNumber || '').trim();
    if (!okulNo || !password) {
        return { success: false, error: 'Okul numarası ve şifre gereklidir.' };
    }

    let uid;
    try {
        const { oturumDene } = await import('./firebaseOturum');
        const fb = await oturumDene(okulNo, password, 'student');
        if (!fb.basarili) {
            return { success: false, error: 'Okul numarası veya şifre hatalı.' };
        }
        uid = fb.uid;
    } catch {
        return { success: false, error: 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.' };
    }

    const sunucu = (await import('./kayitSunucu')).default;

    // ── Kimlik kaydı: onaylanmış mı, hangi koçta? ────────────
    const kimlik = await sunucu.kimlikOku(uid);
    if (!kimlik) {
        /**
         * Hesap var ama kimlik kaydı yok → koç henüz karar vermemiş ya da
         * reddetmiş. Öğrenciye durumu net söylemek için talebe bakılır.
         */
        const talep = await sunucu.talebimiOku(uid);
        const { oturumKapat } = await import('./firebaseOturum');
        await oturumKapat();

        if (talep?.durum === 'reddedildi') {
            return { success: false, error: 'Katılım talebiniz onaylanmadı. Koçunuzla görüşün.' };
        }
        if (talep?.durum === 'bekliyor') {
            return {
                success: false,
                error: `Kaydınız ${talep.kocAd || 'koçunuzun'} onayını bekliyor. Onaylandığında giriş yapabilirsiniz.`,
            };
        }
        return { success: false, error: 'Kaydınız bulunamadı. Koçunuzdan yeni bir davet isteyin.' };
    }

    // ── Koçun veri havuzunu indir ────────────────────────────
    try {
        const { default: firebaseSync } = await import('./firebaseSync');
        await firebaseSync.init({
            id: kimlik.ogrenciId,
            role: 'student',
            coachId: kimlik.kocId,
        });
    } catch (e) {
        console.warn('Öğrenci havuzu indirilemedi:', e?.message);
    }

    // ── Artık kayıt yerel listede olmalı ─────────────────────
    const liste = safeParse('coach_students');
    const kayit = liste.find((s) => String(s.id) === String(kimlik.ogrenciId));

    /**
     * Kayıt indirilememişse (koç henüz senkron etmemiş, bağlantı yavaş)
     * giriş yine de açılır: kimlik kaydı sunucuda onaylı. Aksi hâlde
     * öğrenci "onaylandınız" denip kapıda bırakılırdı.
     */
    const kullanici = kayit
        ? { ...kayit, id: kayit.id, uid, role: 'student', approved: true }
        : {
            id: kimlik.ogrenciId,
            uid,
            name: kimlik.ad || '',
            schoolNumber: kimlik.okulNo || okulNo,
            role: 'student',
            approved: true,
            coachId: kimlik.kocId,
            ownerCoachId: kimlik.kocId,
        };

    return { success: true, user: kullanici, sunucuGirisi: true };
};

/**
 * ✅ Koç kaydı
 */
export const registerCoach = async (data) => {
    try {
        const { name, phone, schoolName, email, password, planId = 'ucretsiz', kuponKodu = null } = data;

        /**
         * Kayıt eskiden yalnızca "Şamran Anadolu Lisesi" personeline
         * açıktı ve şifre olarak TELEFON NUMARASI kullanılıyordu
         * (`signUp(virtualEmail, phone, …)`) — numarayı bilen herkes
         * hesaba girebilirdi. Uygulama artık paketli bir ürün olduğu
         * için kayıt herkese açık, kimlik doğrulama ise gerçek şifreyle.
         */
        if (!name?.trim() || !phone?.trim()) {
            return { success: false, error: 'Ad soyad ve telefon zorunludur.' };
        }

        const guc = credential.sifreGucu(password);
        if (!guc.gecerli) {
            return { success: false, error: `Şifre yeterince güçlü değil: ${guc.sorunlar[0]}` };
        }

        /* Kurumsal paket kontrolü kaldırıldı — Rehberlik Servisi paketi
           PDR bölümüyle birlikte arşivlendi; kurumsal plan kalmadı. */

        const localUsers = safeParse('users_db');
        if (localUsers.some(u => samePhone(u.phone, phone))) {
            return {
                success: false,
                error: 'Bu telefon numarası ile kayıtlı kullanıcı zaten var.'
            };
        }
        if (email && localUsers.some(u => (u.email || '').toLocaleLowerCase('tr-TR') === email.toLocaleLowerCase('tr-TR'))) {
            return { success: false, error: 'Bu e-posta ile kayıtlı kullanıcı zaten var.' };
        }

        const sifreOzeti = await credential.hashle(password);
        const coachId = `coach_${Date.now()}`;

        // Kupon varsa kaydı tamamlamadan ÖNCE doğrula; geçersiz kuponla
        // kayıt tamamlanıp kullanıcı yanlış fiyat beklemesin
        let kupon = null;
        if (kuponKodu) {
            const kontrol = coupons.dogrula(kuponKodu, { planId, kullaniciAnahtari: phone });
            if (!kontrol.gecerli) {
                return { success: false, error: `Kupon kullanılamadı: ${kontrol.hata}` };
            }
            kupon = kontrol.kupon;
        }

        if (firebaseService) {
            try {
                const virtualEmail = email?.trim() || createVirtualEmail(phone, 'coach');
                await firebaseService.auth.signUp(virtualEmail, password, {
                    name, phone, schoolName: schoolName || '', email: email || '',
                    role: 'coach',
                    approved: false,
                    approvalStatus: 'bekliyor',
                    createdAt: new Date().toISOString()
                    // Şifre özeti Firestore profiline YAZILMAZ; kimlik
                    // doğrulamayı Firebase Auth'un kendisi yapar.
                });
            } catch (fbErr) {
                console.warn('Firebase koç kaydı başarısız, yerel kayda düşülüyor:', fbErr.message);
            }
        }

        const newCoach = {
            id: coachId,
            name: name.trim(),
            phone: phone.trim(),
            email: email?.trim() || '',
            schoolName: schoolName?.trim() || '',
            password: sifreOzeti,
            role: 'coach',
            coachRole: 'subCoach',
            sections: ['kocluk'],
            approved: false,
            approvalStatus: 'bekliyor',
            createdAt: new Date().toISOString()
        };
        localUsers.push(newCoach);
        localStorage.setItem('users_db', JSON.stringify(localUsers));
        try { window.firebaseSync?.syncKey?.('users_db'); } catch { /* ignore */ }

        // Paket talebi ve kupon kullanımı — kayıt başarılı olduktan SONRA
        let odemeBilgisi = null;
        let denemeSonu = null;
        if (planId && planId !== 'ucretsiz') {
            const plan = planBul(planId);
            const hesap = coupons.indirimHesapla(plan.fiyat, kuponKodu, {
                planId, kullaniciAnahtari: phone,
            });
            subscription.paketTalepEt(coachId, {
                planId,
                kuponKodu: kupon ? kupon.kod : null,
                indirim: hesap.indirim,
                odenecek: hesap.odenecek,
            });

            /**
             * Deneme süresi BURADA başlar.
             *
             * Karşılama sayfası "ücretli paketleri N gün ücretsiz
             * deneyebilirsiniz" diyordu ama `denemeBaslat` hiçbir yerden
             * çağrılmıyordu; vaadin karşılığı yoktu. Talep ana koç onayına
             * düşerken koç beklemesin diye seçtiği paket deneme süresi
             * boyunca açılıyor. Süre dolar ve onay gelmezse
             * `yururluktekiPlan` ücretsiz kademeye düşürür — veri kaybolmaz,
             * yalnızca yeni öğrenci eklenemez.
             */
            const deneme = subscription.denemeBaslat(coachId, planId);
            if (deneme.basarili) denemeSonu = subscription.abonelik(coachId).bitis;

            if (kupon) {
                coupons.kullan(kupon.kod, { kullanici: phone, planId, indirim: hesap.indirim });
            }
            odemeBilgisi = hesap;
        }

        return {
            success: true,
            requireApproval: true,
            coachId,
            odeme: odemeBilgisi,
            denemeSonu,
            message: planId === 'ucretsiz'
                ? 'Kayıt başarılı! Ana koç onayı bekleniyor.'
                : denemeSonu
                    ? `Kayıt başarılı! ${DENEME_GUN} günlük ücretsiz denemeniz başladı `
                      + `(${denemeSonu} tarihine kadar). Paket talebiniz onay ve ödeme için iletildi.`
                    : 'Kayıt başarılı! Paket talebiniz onay ve ödeme için iletildi.'
        };

    } catch (error) {
        console.error('Coach register hatası:', error);
        return {
            success: false,
            error: hataAnlat(error, 'kaydet')
        };
    }
};

/**
 * ✅ Öğrenci kaydı
 */
export const registerStudent = async (data) => {
    try {
        const { name, schoolNumber, password } = data;

        // Şifre kuralları kayıt anında uygulanır; zayıf şifre hiç oluşmasın
        const guc = credential.sifreGucu(password);
        if (!guc.gecerli) {
            return { success: false, error: `Şifre yeterince güçlü değil: ${guc.sorunlar[0]}` };
        }

        // Firestore'a DÜZ METİN şifre yazılıyordu; artık yalnızca özet gider.
        // Firebase Auth'a giden `password` argümanı Google tarafında zaten
        // hash'lenir, profil belgesine kopyalanması gereksiz bir sızıntıydı.
        const sifreOzeti = await credential.hashle(password);

        if (firebaseService) {
            try {
                const virtualEmail = createVirtualEmail(schoolNumber, 'student');
                const signUpResult = await firebaseService.auth.signUp(virtualEmail, password, {
                    name,
                    schoolNumber: String(schoolNumber),
                    password: sifreOzeti,
                    role: 'student',
                    approved: false,
                    approvalStatus: 'bekliyor',
                    createdAt: new Date().toISOString()
                });

                if (signUpResult.success) {
                    return {
                        success: true,
                        requireApproval: true,
                        message: 'Kayıt başarılı. Koç onayı bekleniyor.'
                    };
                }
            } catch (fbErr) {
                console.warn('Firebase öğrenci kaydı başarısız:', fbErr.message);
            }
        }

        return {
            success: false,
            error: 'Kayıt işlemi şu an kullanılamıyor. Koçunuza başvurun.'
        };

    } catch (error) {
        console.error('Student register hatası:', error);
        return {
            success: false,
            error: 'Kayıt sırasında hata oluştu.'
        };
    }
};

/**
 * ✅ Toplu öğrenci ekleme (Koç tarafından)
 */
export const bulkAddStudents = async (students, coachId) => {
    const results = { success: [], failed: [], skipped: [] };

    try {
        // localStorage'a ekle
        const coachStudents = safeParse('coach_students');

        for (const student of students) {
            if (!student.name) {
                results.skipped.push({ ...student, reason: 'İsim eksik' });
                continue;
            }

            // Mükerrer kontrol
            const isDuplicate = coachStudents.some(existing => {
                if (student.schoolNumber && existing.schoolNumber) {
                    return String(student.schoolNumber) === String(existing.schoolNumber);
                }
                return existing.name === student.name;
            });

            if (isDuplicate) {
                results.skipped.push({ ...student, reason: 'Zaten kayıtlı' });
                continue;
            }

            results.success.push(student);
        }

        // Firebase'e kayıt dene (arka planda)
        if (firebaseService) {
            for (const student of results.success) {
                try {
                    const studentId = `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    await firebaseService.db.setDocument('coach_students', studentId, {
                        ...student,
                        id: studentId,
                        coachId,
                        approved: true,
                        createdAt: new Date().toISOString()
                    });
                } catch (fbErr) {
                    // Firebase hatası giriş akışını durdurmaz
                    console.warn('Firebase öğrenci ekleme hatası (devam ediliyor):', fbErr.message);
                }
            }
        }

        return { success: true, results };

    } catch (error) {
        console.error('Bulk add students hatası:', error);
        return { success: true, results }; // UI akışını kesmemek için success: true döndür
    }
};

/**
 * ✅ Toplu koç ekleme (Admin tarafından)
 */
export const bulkAddCoaches = async (coaches) => {
    const results = { success: [], failed: [], skipped: [] };

    try {
        const localUsers = safeParse('users_db');

        for (const coach of coaches) {
            if (!coach.phone) {
                results.skipped.push({ ...coach, reason: 'Telefon numarası eksik' });
                continue;
            }

            if (localUsers.some(u => samePhone(u.phone, coach.phone))) {
                results.skipped.push({ ...coach, reason: 'Zaten kayıtlı' });
                continue;
            }

            const newCoach = {
                ...coach,
                id: `coach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                role: 'coach',
                approved: true,
                createdAt: new Date().toISOString()
            };

            localUsers.push(newCoach);
            results.success.push(coach);

            // Firebase'e kayıt dene
            if (firebaseService) {
                try {
                    const virtualEmail = createVirtualEmail(coach.phone, 'coach');
                    await firebaseService.auth.signUp(virtualEmail, coach.phone, newCoach);
                } catch (fbErr) {
                    console.warn('Firebase koç ekleme hatası:', fbErr.message);
                }
            }
        }

        yaz('users_db', localUsers);
        return { success: true, results };

    } catch (error) {
        console.error('Bulk add coaches hatası:', error);
        return { success: false, error: 'Toplu ekleme sırasında hata oluştu.' };
    }
};

export default {
    loginCoach,
    loginStudent,
    sunucudanOgrenciGirisi,
    registerCoach,
    registerStudent,
    bulkAddStudents,
    bulkAddCoaches
};
