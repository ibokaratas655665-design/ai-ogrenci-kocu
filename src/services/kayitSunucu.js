/**
 * 🏛️ KAYIT SUNUCUSU — davet, katılım ve öğrenci kimliği
 *
 * ═════════════════════════════════════════════════════════════════
 * NEDEN BU DOSYA VAR
 * ═════════════════════════════════════════════════════════════════
 *
 * Uygulamanın veri katmanı localStorage'dı: her şey tarayıcıya yazılıyor,
 * `firebaseSync` de bu anahtarları arka planda buluta KOPYALIYORDU.
 * Bu model onboarding'i yapısal olarak imkânsız kılıyordu:
 *
 *   · `firebaseSync` yalnızca GİRİŞ YAPMIŞ kullanıcı için çalışır.
 *     Katılım sayfasında giriş yapmış kullanıcı yoktur → senkron ölüdür
 *     → `katil()` öğrencinin KENDİ tarayıcısına yazıp orada kalır.
 *     Koça hiçbir zaman ulaşmaz. (Kullanıcının yaşadığı sorun buydu.)
 *
 *   · Davet kaydı da koçun tarayıcısındaydı. Öğrenci linki kendi
 *     telefonunda açtığında o cihazda kayıt yok → "Böyle bir davet
 *     bulunamadı".
 *
 * Bunlar tek tek düzeltilebilecek hatalar değil; veri modelinin
 * sonucudur. Gerçek uygulamalarda davet ve katılım talebi SUNUCU
 * KAYDIDIR: işlemi yapan taraf doğrudan veritabanına yazar, kimin neyi
 * okuyup yazabileceğine veritabanı kuralları karar verir. Aynası,
 * kopyası, senkronu yoktur.
 *
 * Bu dosya o modeli kurar. localStorage'a HİÇ dokunmaz.
 *
 * ═════════════════════════════════════════════════════════════════
 * VERİ MODELİ
 * ═════════════════════════════════════════════════════════════════
 *
 *   davetler/{KOD}
 *     kocUid  Firebase kimliği — YETKİYİ BU BELİRLER
 *     kocId   uygulama içi koç kimliği (veri havuzu yönlendirmesi için)
 *     kocAd, sinif, not, kullanimHakki, kullanilan, sonZaman, aktif
 *     → okuma herkese açık: KODUN KENDİSİ sırdır (davet linki mantığı).
 *     → yazma yalnızca sahibi koça.
 *
 *   katilimTalepleri/{ogrenciUid}
 *     kod, kocUid, kocId, kocAd, ad, okulNo, sinif, sube, veliAd, veliTel,
 *     durum: bekliyor | onaylandi | reddedildi
 *     → oluşturmayı öğrenci yapar ama KURAL DAVETİ SUNUCUDA DOĞRULAR:
 *       davet var mı, açık mı, süresi geçmiş mi, hakkı dolmuş mu, kocUid
 *       daveti ile aynı mı. Yani öğrenci kendini istediği koçun listesine
 *       yazamaz.
 *     → okuma/güncelleme yalnızca ilgili koça.
 *
 *   ogrenciKimlik/{ogrenciUid}
 *     kocId, kocUid, ogrenciId, ad, okulNo, durum
 *     → öğrenci giriş yaptığında HANGİ KOÇUN VERİ HAVUZUNA ait olduğunu
 *       buradan öğrenir. Bu kayıt olmadan yeni bir cihazda giriş yapan
 *       öğrenci hiçbir veri göremezdi (yumurta-tavuk kilidi).
 *     → yalnızca kendi kaydını okur; yazmayı koç yapar.
 *
 * ⚠️ ÖĞRENCİ OKUL NUMARASI PLATFORM GENELİNDE TEKİLDİR.
 * Giriş kimliği okul numarasından türetiliyor ve Firebase Auth e-posta
 * tekilliğini sunucuda zorunlu kılıyor. Aynı numara ikinci kez
 * kullanılamaz; katılım sırasında açık bir hata mesajıyla bildirilir.
 */

import {
    doc, getDoc, setDoc, updateDoc, deleteDoc, collection,
    query, where, getDocs, onSnapshot, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebaseConfig';
import { sanalEposta } from './firebaseOturum';

const DAVETLER = 'davetler';
const TALEPLER = 'katilimTalepleri';
const KIMLIKLER = 'ogrenciKimlik';

/** Karışması kolay karakterler dışarıda (O/0, I/1, L). */
const ALFABE = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const normalize = (kod) =>
    String(kod || '').toLocaleUpperCase('tr-TR').replace(/[^A-Z0-9]/g, '');

const kodUret = () => {
    let s = '';
    for (let i = 0; i < 6; i += 1) s += ALFABE[Math.floor(Math.random() * ALFABE.length)];
    return s;
};

/** Firebase oturumundaki kimlik. Yoksa hiçbir yazma işlemi yapılamaz. */
const uid = () => auth?.currentUser?.uid || null;

export const benimUid = uid;

/**
 * Firebase kimliğini bildirir ve DEĞİŞTİKÇE tekrar bildirir.
 *
 * `auth.currentUser` sayfa açılışında henüz dolmamış olabilir (oturum
 * IndexedDB'den geri yükleniyor). Doğrudan okunursa koç paneli davet
 * listesini boş kimlikle sorgular ve hep boş görünür.
 *
 * @returns {function} aboneliği bitirir
 */
export const uidIzle = (geriCagir) => onAuthStateChanged(auth, (k) => geriCagir(k?.uid || null));

/**
 * Teknik Firestore hatalarını kullanıcıya gösterilebilir hâle getirir.
 * `permission-denied` burada bir yetki ihlalidir; kullanıcıya "bağlantı
 * hatası" demek yanıltıcı olur.
 */
const hataMetni = (e, varsayilan) => {
    const kod = e?.code || '';
    if (kod === 'permission-denied') return 'Bu işlem için yetkiniz yok.';
    if (kod === 'unavailable') return 'İnternet bağlantısı kurulamadı. Tekrar deneyin.';
    return varsayilan;
};

// ══════════════════════════════════════════════════════════════
//  DAVETLER
// ══════════════════════════════════════════════════════════════

const davetBicimle = (kod, d) => {
    if (!d) return null;
    const sonZaman = d.sonZaman?.toDate?.() || null;
    return {
        kod,
        kocUid: d.kocUid || '',
        kocId: String(d.kocId ?? ''),
        kocAd: d.kocAd || '',
        sinif: d.sinif || '',
        not: d.not || '',
        /**
         * Davet MEVCUT bir öğrenci kaydına bağlıysa o kaydın kimliği.
         *
         * Koçun elle eklediği öğrencilerin sunucu kimliği yoktu; kendi
         * cihazlarından giriş yapamıyorlardı. Yeni bir öğrenci sistemi
         * kurmak yerine davet makinesi genişletildi: bağlı davetle katılan
         * öğrenci YENİ kayıt açmaz, var olan kaydına kimlik bağlar.
         * Böylece elle eklenen ve davetle gelen öğrenci aynı modele oturur.
         */
        ogrenciId: d.ogrenciId ? String(d.ogrenciId) : null,
        ogrenciAd: d.ogrenciAd || '',
        kullanimHakki: Number(d.kullanimHakki) || 1,
        kullanilan: Number(d.kullanilan) || 0,
        aktif: d.aktif !== false,
        sonZaman,
        sonTarih: sonZaman ? sonZaman.toISOString().slice(0, 10) : '',
        olusturma: d.olusturma?.toDate?.()?.toISOString() || null,
    };
};

/**
 * Davet üretir ve SUNUCUYA yazar.
 *
 * @param {object} p
 * @param {object} p.koc            { id, name } — uygulama içi koç kaydı
 * @param {number} [p.kullanimHakki]
 * @param {number} [p.gecerlilikGun]
 * @param {string} [p.sinif]
 * @param {string} [p.not]
 * @returns {Promise<{basarili:boolean, davet?:object, hata?:string}>}
 */
export const davetOlustur = async (p = {}) => {
    const kocUid = uid();
    if (!kocUid) {
        return {
            basarili: false,
            hata: 'Bulut oturumu açık değil. Davet oluşturmak için çıkıp tekrar giriş yapın.',
        };
    }
    if (!p?.koc?.id) return { basarili: false, hata: 'Koç bilgisi eksik.' };

    const gun = Math.max(1, parseInt(p.gecerlilikGun, 10) || 14);
    const son = new Date();
    son.setDate(son.getDate() + gun);
    son.setHours(23, 59, 59, 999);

    /**
     * Mevcut bir öğrenciye bağlı davet her zaman TEK kullanımlıktır:
     * o kayda yalnızca bir kişi bağlanabilir.
     */
    const bagliOgrenci = p.ogrenciId ? String(p.ogrenciId) : null;

    const govde = {
        kocUid,
        kocId: String(p.koc.id),
        kocAd: p.koc.name || '',
        sinif: p.sinif || '',
        not: p.not || '',
        kullanimHakki: bagliOgrenci ? 1 : Math.max(1, parseInt(p.kullanimHakki, 10) || 1),
        kullanilan: 0,
        aktif: true,
        sonZaman: Timestamp.fromDate(son),
        olusturma: serverTimestamp(),
        ...(bagliOgrenci ? { ogrenciId: bagliOgrenci, ogrenciAd: p.ogrenciAd || '' } : {}),
    };

    // Kod çakışması pratikte yok denecek kadar az (31^6); yine de
    // sunucuda var olan bir kodun üzerine yazmamak için kontrol edilir.
    for (let deneme = 0; deneme < 5; deneme += 1) {
        const kod = kodUret();
        try {
            const ref = doc(db, DAVETLER, kod);
            const mevcut = await getDoc(ref);
            if (mevcut.exists()) continue;
            await setDoc(ref, govde);
            return { basarili: true, davet: davetBicimle(kod, { ...govde, sonZaman: Timestamp.fromDate(son) }) };
        } catch (e) {
            return { basarili: false, hata: hataMetni(e, 'Davet oluşturulamadı.') };
        }
    }
    return { basarili: false, hata: 'Davet kodu üretilemedi, tekrar deneyin.' };
};

/**
 * Daveti koddan okur. KİMLİK DOĞRULAMASI GEREKTİRMEZ — katılım sayfası
 * henüz hesabı olmayan öğrenci tarafından açılır.
 */
export const davetOku = async (kod) => {
    const temiz = normalize(kod);
    if (!temiz) return null;
    try {
        const snap = await getDoc(doc(db, DAVETLER, temiz));
        return snap.exists() ? davetBicimle(temiz, snap.data()) : null;
    } catch {
        return null;
    }
};

/** Koçun kendi davetleri — canlı dinleme. @returns {function} aboneliği bitirir */
export const davetleriIzle = (kocUid, geriCagir) => {
    if (!kocUid) { geriCagir([]); return () => {}; }
    const s = query(collection(db, DAVETLER), where('kocUid', '==', kocUid));
    return onSnapshot(
        s,
        (anlik) => {
            const liste = anlik.docs
                .map((d) => davetBicimle(d.id, d.data()))
                .sort((a, b) => String(b.olusturma || '').localeCompare(String(a.olusturma || '')));
            geriCagir(liste);
        },
        (e) => { console.warn('Davetler dinlenemedi:', e?.code || e?.message); geriCagir([]); }
    );
};

export const davetDurumDegistir = async (kod, aktif) => {
    try {
        await updateDoc(doc(db, DAVETLER, normalize(kod)), { aktif: Boolean(aktif) });
        return { basarili: true };
    } catch (e) {
        return { basarili: false, hata: hataMetni(e, 'Davet güncellenemedi.') };
    }
};

export const davetSil = async (kod) => {
    try {
        await deleteDoc(doc(db, DAVETLER, normalize(kod)));
        return { basarili: true };
    } catch (e) {
        return { basarili: false, hata: hataMetni(e, 'Davet silinemedi.') };
    }
};

/**
 * Öğrencinin açacağı bağlantı.
 *
 * Artık yalnızca kodu taşır — davet sunucuda durduğu için bağlantının
 * içinde veri taşımaya gerek yok. (Bir ara davet verisini base64 ile
 * linke gömmüştüm; o, sunucu olmadığı için yapılmış bir kaçamaktı ve
 * davetin kapatılması/hakkının dolması gibi durumları öğrencinin
 * cihazına yansıtamıyordu.)
 */
export const davetLinki = (kod) =>
    `${window.location.origin}${window.location.pathname}#/katil?kod=${normalize(kod)}`;

// ══════════════════════════════════════════════════════════════
//  KATILIM TALEBİ
// ══════════════════════════════════════════════════════════════

/** Daveti istemci tarafında da kontrol eder — kullanıcıya anlamlı mesaj vermek için. */
export const davetDogrula = (davet) => {
    if (!davet) return { gecerli: false, hata: 'Böyle bir davet bulunamadı.' };
    if (!davet.aktif) return { gecerli: false, hata: 'Bu davet koçunuz tarafından kapatılmış.' };
    if (davet.sonZaman && davet.sonZaman.getTime() < Date.now()) {
        return {
            gecerli: false,
            hata: `Davetin süresi ${davet.sonTarih.split('-').reverse().join('.')} tarihinde doldu.`,
        };
    }
    if (davet.kullanilan >= davet.kullanimHakki) {
        return { gecerli: false, hata: 'Davetin kullanım hakkı dolmuş. Koçunuzdan yeni davet isteyin.' };
    }
    return { gecerli: true, davet };
};

/**
 * Öğrenci katılım talebi gönderir.
 *
 * Üç adım, hepsi sunucuda:
 *   1. Öğrenciye GERÇEK bir Firebase hesabı açılır. (Eskiden hesap hiç
 *      açılmıyordu; öğrenci onaylandıktan sonra bile kimliği yoktu.)
 *   2. `katilimTalepleri/{uid}` yazılır — kural daveti sunucuda doğrular.
 *   3. Davetin kullanım sayacı artırılır.
 *
 * Ardından oturum kapatılır: katılım onay bekler, öğrenci henüz giriş
 * yapmış sayılmaz.
 */
export const katilimGonder = async ({ davet, ogrenci, sifre }) => {
    const kontrol = davetDogrula(davet);
    if (!kontrol.gecerli) return { basarili: false, hata: kontrol.hata };

    const okulNo = String(ogrenci?.okulNo ?? '').trim();
    if (!ogrenci?.ad?.trim()) return { basarili: false, hata: 'Ad soyad zorunludur.' };
    if (!okulNo) return { basarili: false, hata: 'Okul numarası zorunludur.' };

    const eposta = sanalEposta(okulNo, 'student');
    if (!eposta) return { basarili: false, hata: 'Okul numarası geçersiz.' };

    // ── 1. Gerçek hesap ──────────────────────────────────────
    let ogrenciUid;
    try {
        const hesap = await createUserWithEmailAndPassword(auth, eposta, sifre);
        ogrenciUid = hesap.user.uid;
    } catch (e) {
        if (e?.code === 'auth/email-already-in-use') {
            return {
                basarili: false,
                hata: `"${okulNo}" numarası zaten kullanımda. Koçunuzdan kendi okul numaranızı doğrulamasını isteyin.`,
            };
        }
        if (e?.code === 'auth/weak-password') {
            return { basarili: false, hata: 'Şifre çok zayıf, en az 6 karakter olmalı.' };
        }
        return { basarili: false, hata: hataMetni(e, 'Hesap oluşturulamadı. İnternet bağlantınızı kontrol edin.') };
    }

    // ── 2. Talep kaydı ───────────────────────────────────────
    try {
        await setDoc(doc(db, TALEPLER, ogrenciUid), {
            kod: davet.kod,
            kocUid: davet.kocUid,
            kocId: davet.kocId,
            kocAd: davet.kocAd,
            ad: ogrenci.ad.trim(),
            okulNo,
            sinif: ogrenci.sinif || davet.sinif || '',
            sube: ogrenci.sube || '',
            veliAd: ogrenci.veliAd || '',
            veliTel: ogrenci.veliTel || '',
            durum: 'bekliyor',
            olusturma: serverTimestamp(),
            // Bağlı davetse hangi mevcut kayda bağlanacağı taşınır.
            // Kural bu alanın davetteki değerle aynı olmasını şart koşar.
            ...(davet.ogrenciId ? { ogrenciId: davet.ogrenciId } : {}),
        });
    } catch (e) {
        /**
         * Talep yazılamadıysa açılan hesap ORTADA KALMAMALI: öğrenci
         * tekrar denediğinde "numara kullanımda" hatası alırdı.
         */
        try { await auth.currentUser?.delete(); } catch { /* silinemezse elle temizlenir */ }
        return { basarili: false, hata: hataMetni(e, 'Katılım talebi gönderilemedi.') };
    }

    // ── 3. Kullanım sayacı ───────────────────────────────────
    // Başarısız olursa katılım yine geçerlidir; sayaç koç onayında düzelir.
    try {
        await updateDoc(doc(db, DAVETLER, davet.kod), { kullanilan: davet.kullanilan + 1 });
    } catch { /* sayaç kritik değil */ }

    try { await signOut(auth); } catch { /* ignore */ }

    return { basarili: true, ogrenciUid };
};

/**
 * Koça gelen katılım talepleri — canlı dinleme.
 *
 * @param {function} geriCagir (talepler, hata) — hata varsa İKİNCİ argüman dolar.
 *
 * ⚠️ ÖNCEDEN HATA SESSİZCE YUTULUYORDU: dinleyici `permission-denied`
 * alsa bile boş liste dönüyordu, arayüz de "Bekleyen katılım talebi yok"
 * yazıyordu. Yani "talep yok" ile "talepleri okuyamadım" ekranda aynı
 * görünüyordu; koç, öğrenci katıldığı hâlde hiçbir şey olmadığını sanıyordu.
 */
export const talepleriIzle = (kocUid, geriCagir) => {
    if (!kocUid) { geriCagir([], null); return () => {}; }
    const s = query(collection(db, TALEPLER), where('kocUid', '==', kocUid));
    return onSnapshot(
        s,
        (anlik) => geriCagir(anlik.docs.map((d) => ({
            uid: d.id,
            ...d.data(),
            olusturma: d.data().olusturma?.toDate?.()?.toISOString() || null,
        })), null),
        (e) => {
            const kod = e?.code || e?.message || 'bilinmeyen hata';
            console.error('Katılım talepleri dinlenemedi:', kod);
            geriCagir([], kod);
        }
    );
};

export const talepleriOku = async (kocUid) => {
    if (!kocUid) return [];
    try {
        const anlik = await getDocs(query(collection(db, TALEPLER), where('kocUid', '==', kocUid)));
        return anlik.docs.map((d) => ({
            uid: d.id,
            ...d.data(),
            olusturma: d.data().olusturma?.toDate?.()?.toISOString() || null,
        }));
    } catch {
        return [];
    }
};

/**
 * Koç talebi onaylar.
 *
 * İki yazma birden: talebin durumu ve öğrencinin KİMLİK KAYDI. Kimlik
 * kaydı olmadan öğrenci giriş yapsa bile hangi koçun veri havuzuna ait
 * olduğunu bilemez ve boş bir uygulama görürdü.
 *
 * @param {object} talep    talepleriIzle'den gelen kayıt
 * @param {string} ogrenciId Koçun listesine eklenen kaydın kimliği
 */
export const talepOnayla = async (talep, ogrenciId) => {
    if (!talep?.uid) return { basarili: false, hata: 'Talep kaydı geçersiz.' };
    try {
        await setDoc(doc(db, KIMLIKLER, talep.uid), {
            kocUid: talep.kocUid,
            kocId: String(talep.kocId ?? ''),
            ogrenciId: String(ogrenciId),
            ad: talep.ad || '',
            okulNo: String(talep.okulNo ?? ''),
            durum: 'onaylandi',
            guncelleme: serverTimestamp(),
        });
        await updateDoc(doc(db, TALEPLER, talep.uid), {
            durum: 'onaylandi',
            ogrenciId: String(ogrenciId),
        });
        return { basarili: true };
    } catch (e) {
        return { basarili: false, hata: hataMetni(e, 'Onay kaydedilemedi.') };
    }
};

export const talepReddet = async (talep) => {
    if (!talep?.uid) return { basarili: false, hata: 'Talep kaydı geçersiz.' };
    try {
        await updateDoc(doc(db, TALEPLER, talep.uid), { durum: 'reddedildi' });
        // Reddedilen öğrencinin kimlik kaydı varsa kaldırılır; giriş yapamasın.
        try { await deleteDoc(doc(db, KIMLIKLER, talep.uid)); } catch { /* yoksa sorun değil */ }
        return { basarili: true };
    } catch (e) {
        return { basarili: false, hata: hataMetni(e, 'Ret kaydedilemedi.') };
    }
};

export const talepSil = async (talepUid) => {
    try {
        await deleteDoc(doc(db, TALEPLER, talepUid));
        try { await deleteDoc(doc(db, KIMLIKLER, talepUid)); } catch { /* ignore */ }
        return { basarili: true };
    } catch (e) {
        return { basarili: false, hata: hataMetni(e, 'Kayıt silinemedi.') };
    }
};

// ══════════════════════════════════════════════════════════════
//  ÖĞRENCİ KİMLİĞİ
// ══════════════════════════════════════════════════════════════

/**
 * Giriş yapan öğrencinin hangi koça ait olduğunu sunucudan okur.
 *
 * ⚠️ BU FONKSİYON OLMADAN YENİ CİHAZDA GİRİŞ ÇALIŞMIYORDU: giriş akışı
 * öğrenciyi localStorage'daki `coach_students` listesinde arıyordu; o
 * liste ise ancak senkron çalıştıktan sonra doluyor, senkron da hangi
 * havuza bakacağını bilmek için koç kimliğine ihtiyaç duyuyordu. Kimlik
 * kaydı bu kilidi açar.
 */
export const kimlikOku = async (ogrenciUid) => {
    if (!ogrenciUid) return null;
    try {
        const snap = await getDoc(doc(db, KIMLIKLER, ogrenciUid));
        return snap.exists() ? { uid: ogrenciUid, ...snap.data() } : null;
    } catch {
        return null;
    }
};

/** Kendi talebinin durumu — öğrenci "onaylandım mı" diye bakabilsin. */
export const talebimiOku = async (ogrenciUid) => {
    if (!ogrenciUid) return null;
    try {
        const snap = await getDoc(doc(db, TALEPLER, ogrenciUid));
        return snap.exists() ? { uid: ogrenciUid, ...snap.data() } : null;
    } catch {
        return null;
    }
};

export default {
    normalize, benimUid, uidIzle,
    davetOlustur, davetOku, davetleriIzle, davetDurumDegistir, davetSil, davetLinki,
    davetDogrula, katilimGonder,
    talepleriIzle, talepleriOku, talepOnayla, talepReddet, talepSil,
    kimlikOku, talebimiOku,
};
