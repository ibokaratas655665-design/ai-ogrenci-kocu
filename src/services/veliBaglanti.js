/**
 * 👨‍👩‍👧 VELİ BAĞLANTISI — SUNUCU KATMANI
 *
 * ═════════════════════════════════════════════════════════════════
 * ÇÖZDÜĞÜ PROBLEM
 * ═════════════════════════════════════════════════════════════════
 *
 * Veli portalı VELİNİN CİHAZINDA HİÇ AÇILMIYORDU. İki veriye ihtiyaç
 * duyuyordu ve ikisi de yalnızca koçun tarayıcısındaydı:
 *
 *   · `parent_links`   → belirteç→öğrenci eşlemesi (senkron listesinde
 *                        bile yoktu, koçun cihazından hiç çıkmıyordu)
 *   · `coach_students` → öğrenci kaydı
 *
 * Portal oturum istemediği için `firebaseSync` orada hiç başlamıyor,
 * dolayısıyla bu anahtarlar velinin cihazına inmiyordu. Veli bağlantıya
 * tıkladığında her koşulda "Öğrenci Bulunamadı" görüyordu. Yani ürünün
 * vaat ettiği özellik hiçbir zaman teslim edilmedi.
 *
 * ═════════════════════════════════════════════════════════════════
 * ÇÖZÜM: ÖZET YAYINLAMA
 * ═════════════════════════════════════════════════════════════════
 *
 * Veliye koçun veri havuzu AÇILMAZ. Bunun yerine koçun cihazı, velinin
 * görmesi gereken raporu hesaplayıp bağlantı belgesine yazar. Veli
 * yalnızca o tek belgeyi okur.
 *
 * Böylece:
 *   · velinin gördüğü alanları tam olarak biz belirleriz
 *   · koçun öğrenci listesi, PDR dosyaları, diğer öğrenciler asla açılmaz
 *   · veliye şifre/hesap eklemeye gerek kalmaz (ürün kararı korunur)
 *
 * Güvenlik "yetki taşıyan adres" (capability URL) modelidir: bağlantıyı
 * bilen görür. Bu yüzden belirteç 128 bit rastgeledir, SON KULLANMA
 * TARİHİ vardır ve koç tarafından iptal edilebilir — üçü de artık
 * Firestore kuralında zorlanır.
 *
 *   veliBaglantilari/{belirtec}
 *     kocUid, kocId, ogrenciId, ogrenciAd
 *     sonKullanma  Timestamp — kural bunu kontrol eder
 *     iptal        bool      — kural bunu kontrol eder
 *     ozet         { "7": rapor, "30": rapor, "90": rapor }
 *     kocNotu      yalnızca veliye açık işaretli son not
 */

import {
    doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs,
    serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

const KOLEKSIYON = 'veliBaglantilari';

/** Bağlantı ömrü. Süresiz bağlantı, bir kez sızdığında sonsuza dek açık kalır. */
const GECERLILIK_GUN = 180;

/** Portalın sunduğu dönemler (ParentPortal içindeki PERIODS ile aynı olmalı). */
export const DONEMLER = [7, 30, 90];

/**
 * 16 bayt (128 bit) rastgelelik, base64url ile 22 karaktere iner.
 * Math.random KULLANILMAZ: tahmin edilebilir ve bu belirteç tek
 * güvenlik katmanımız.
 */
const belirtecUret = () => {
    const bayt = new Uint8Array(16);
    const kripto = globalThis.crypto || globalThis.msCrypto;
    if (!kripto?.getRandomValues) {
        throw new Error('Bu tarayıcı güvenli bağlantı üretemiyor (WebCrypto yok).');
    }
    kripto.getRandomValues(bayt);
    let ikili = '';
    bayt.forEach((b) => { ikili += String.fromCharCode(b); });
    return btoa(ikili).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

const uid = () => auth?.currentUser?.uid || null;

/** Firestore undefined kabul etmez; rapor ağacındaki boşluklar temizlenir. */
const temizle = (v) => {
    if (v === undefined) return null;
    if (Array.isArray(v)) return v.map(temizle);
    if (v && typeof v === 'object') {
        const c = {};
        Object.keys(v).forEach((k) => { c[k] = temizle(v[k]); });
        return c;
    }
    return v;
};

export const baglantiAdresi = (belirtec) => {
    if (!belirtec) return null;
    const taban = `${window.location.origin}${window.location.pathname}`;
    return `${taban}#/veli/${belirtec}`;
};

// ══════════════════════════════════════════════════════════════
//  KOÇ TARAFI
// ══════════════════════════════════════════════════════════════

/** Öğrencinin yürürlükteki (iptal edilmemiş) bağlantısı. */
export const mevcutBelirtec = async (ogrenciId) => {
    const kocUid = uid();
    if (!kocUid || ogrenciId == null) return null;
    try {
        const s = await getDocs(query(
            collection(db, KOLEKSIYON),
            where('kocUid', '==', kocUid),
            where('ogrenciId', '==', String(ogrenciId)),
        ));
        const canli = s.docs.find((d) => d.data()?.iptal !== true);
        return canli ? canli.id : null;
    } catch {
        return null;
    }
};

/**
 * Öğrencinin veli bağlantısını verir; yoksa üretir. Her çağrıda ÖZET
 * TAZELENİR — velinin eski veri görmemesi için.
 *
 * @param {object} ogrenci     coach_students kaydı
 * @param {function} raporUret (ogrenci, {periodDays}) => rapor
 */
export const baglantiAl = async (ogrenci, raporUret) => {
    const kocUid = uid();
    if (!kocUid) return { basarili: false, hata: 'Bulut oturumu açık değil.' };
    if (!ogrenci?.id) return { basarili: false, hata: 'Öğrenci kaydı geçersiz.' };

    const varolan = await mevcutBelirtec(ogrenci.id);
    const belirtec = varolan || belirtecUret();

    const son = new Date();
    son.setDate(son.getDate() + GECERLILIK_GUN);

    const govde = {
        kocUid,
        kocId: String(ogrenci.ownerCoachId ?? ogrenci.coachId ?? ''),
        ogrenciId: String(ogrenci.id),
        ogrenciAd: ogrenci.name || '',
        sinif: [ogrenci.grade, ogrenci.section].filter(Boolean).join('-'),
        okulNo: String(ogrenci.schoolNumber || ''),
        iptal: false,
        sonKullanma: Timestamp.fromDate(son),
        guncelleme: serverTimestamp(),
        ...(varolan ? {} : { olusturma: serverTimestamp() }),
    };

    try {
        await setDoc(doc(db, KOLEKSIYON, belirtec), govde, { merge: true });
        await ozetYayinla(belirtec, ogrenci, raporUret);
        return { basarili: true, belirtec, adres: baglantiAdresi(belirtec) };
    } catch (e) {
        return { basarili: false, hata: e?.code || e?.message || 'Bağlantı oluşturulamadı.' };
    }
};

/**
 * Velinin göreceği raporu hesaplayıp bağlantı belgesine yazar.
 *
 * ⚠️ VELİYE YALNIZCA BURAYA KOYULAN ALANLAR GÖRÜNÜR. Koçun gizli notları,
 * diğer öğrenciler ve PDR kayıtları buraya HİÇ girmez.
 */
export const ozetYayinla = async (belirtec, ogrenci, raporUret) => {
    if (!belirtec || !ogrenci || typeof raporUret !== 'function') return false;
    try {
        const ozet = {};
        DONEMLER.forEach((gun) => {
            try { ozet[String(gun)] = temizle(raporUret(ogrenci, { periodDays: gun })); }
            catch { ozet[String(gun)] = null; }
        });

        // Yalnızca veliye AÇIK işaretlenmiş son koç notu
        let kocNotu = null;
        try {
            const ham = localStorage.getItem(`coach_notes_${ogrenci.id}`);
            const notlar = ham ? JSON.parse(ham) : [];
            const acik = Array.isArray(notlar) ? notlar.filter((n) => n?.visibleToParent) : [];
            if (acik.length) {
                const n = acik[acik.length - 1];
                kocNotu = { text: n.text || n.content || '', createdAt: n.createdAt || null };
            }
        } catch { /* not yoksa sorun değil */ }

        await updateDoc(doc(db, KOLEKSIYON, belirtec), {
            ozet, kocNotu, ozetZamani: serverTimestamp(),
        });
        return true;
    } catch (e) {
        console.warn('Veli özeti yayınlanamadı:', e?.code || e?.message);
        return false;
    }
};

/** Bağlantıyı yeniler: eskisi iptal, yenisi üretilir. Sızıntıda tek çare. */
export const yenile = async (ogrenci, raporUret) => {
    const eski = await mevcutBelirtec(ogrenci?.id);
    if (eski) {
        try { await updateDoc(doc(db, KOLEKSIYON, eski), { iptal: true, iptalTarihi: serverTimestamp() }); }
        catch { /* iptal edilemezse yenisi yine de üretilir */ }
    }
    return baglantiAl(ogrenci, raporUret);
};

/** Veli erişimini tamamen kapatır. */
export const iptalEt = async (ogrenciId) => {
    const belirtec = await mevcutBelirtec(ogrenciId);
    if (!belirtec) return { basarili: true, sayi: 0 };
    try {
        await updateDoc(doc(db, KOLEKSIYON, belirtec), { iptal: true, iptalTarihi: serverTimestamp() });
        return { basarili: true, sayi: 1 };
    } catch (e) {
        return { basarili: false, hata: e?.code || e?.message };
    }
};

/** Koçun bütün bağlantılarının özetini tazeler (girişte çağrılır). */
export const tumOzetleriTazele = async (ogrenciler, raporUret) => {
    const kocUid = uid();
    if (!kocUid || !Array.isArray(ogrenciler) || !ogrenciler.length) return 0;
    let sayi = 0;
    try {
        const s = await getDocs(query(collection(db, KOLEKSIYON), where('kocUid', '==', kocUid)));
        for (const belge of s.docs) {
            const v = belge.data();
            if (v?.iptal === true) continue;
            const ogrenci = ogrenciler.find((o) => String(o.id) === String(v.ogrenciId));
            if (!ogrenci) continue;
            // eslint-disable-next-line no-await-in-loop
            if (await ozetYayinla(belge.id, ogrenci, raporUret)) sayi += 1;
        }
    } catch { /* tazeleme başarısızsa portal eski özeti gösterir */ }
    return sayi;
};

// ══════════════════════════════════════════════════════════════
//  VELİ TARAFI (oturumsuz)
// ══════════════════════════════════════════════════════════════

/**
 * Belirteci çözer. Kimlik doğrulaması GEREKTİRMEZ — veli portalı
 * oturumsuz açılır. Süresi dolmuş ya da iptal edilmiş belirteç kuralda
 * reddedilir; burada da ayrıca kontrol edilip anlamlı mesaj verilir.
 */
export const portalOku = async (belirtec) => {
    if (!belirtec) return { durum: 'gecersiz' };
    try {
        const snap = await getDoc(doc(db, KOLEKSIYON, belirtec));
        if (!snap.exists()) return { durum: 'gecersiz' };
        const v = snap.data();
        if (v.iptal === true) return { durum: 'iptal' };
        const son = v.sonKullanma?.toDate?.();
        if (son && son.getTime() < Date.now()) return { durum: 'suresi_doldu' };
        return {
            durum: 'gecerli',
            ogrenci: {
                id: v.ogrenciId,
                name: v.ogrenciAd,
                sinif: v.sinif || '',
                schoolNumber: v.okulNo || '',
            },
            ozet: v.ozet || null,
            kocNotu: v.kocNotu || null,
            ozetZamani: v.ozetZamani?.toDate?.()?.toISOString() || null,
        };
    } catch (e) {
        // Kural reddederse belirteç geçersiz ya da süresi dolmuş demektir
        if (e?.code === 'permission-denied') return { durum: 'gecersiz' };
        return { durum: 'hata', hata: e?.code || e?.message };
    }
};

export default {
    DONEMLER, baglantiAdresi, mevcutBelirtec, baglantiAl, ozetYayinla,
    yenile, iptalEt, tumOzetleriTazele, portalOku,
};
