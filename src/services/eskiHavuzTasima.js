/**
 * 📦 ESKİ HAVUZ TAŞIMA (tek seferlik, geriye uyumlu)
 *
 * ═════════════════════════════════════════════════════════════════
 * NEDEN VAR
 * ═════════════════════════════════════════════════════════════════
 *
 * 17.08.2026'ya kadar bütün veri TEK ORTAK HAVUZDA tutuluyordu:
 * `firebaseSync.getBucketId()` herkes için sabit `'global'` döndürüyordu.
 * O gün havuz koç bazlı hâle getirildi (`koc_<kocId>`), ama eski
 * belgeler taşınmadı — oldukları yerde kaldılar.
 *
 * Kullanıcının verisi kaybolmadı çünkü localStorage'daki kopya yeni
 * havuza yazıldı. Ancak yalnızca O CİHAZDAKİ kopya taşındı. Başka bir
 * cihazdan yazılmış ya da o sırada yerelde bulunmayan anahtarlar eski
 * havuzda mahsur kaldı.
 *
 * Sahiplik kuralları devreye girdikten sonra bu belgeler artık hiçbir
 * kullanıcı tarafından okunamıyor — yani sessizce erişilemez oldular.
 * Tarama 11 belge buldu; en büyüğü 96 öğrencinin OBP kaydı.
 *
 * ═════════════════════════════════════════════════════════════════
 * TAŞIMA KURALI: ASLA ÜZERİNE YAZMA
 * ═════════════════════════════════════════════════════════════════
 *
 * Bir anahtar YALNIZCA mevcut veride boşsa (yok, `[]`, `{}`, `""`)
 * eski havuzdan alınır. Dolu bir anahtara dokunulmaz; bunun yerine
 * "çakışma" olarak raporlanır ve kullanıcı karar verir.
 *
 * Böylece taşıma her koşulda güvenlidir: en kötü ihtimalle hiçbir şey
 * yapmaz, veri kaybettirmez.
 */

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import LZString from 'lz-string';

const BAYRAK = 'eski_havuz_tasindi';
const ESKI_HAVUZ = 'global';

/** Boş sayılan değerler — bunların üzerine yazmak veri kaybı değildir. */
const bos = (deger) => {
    if (deger == null) return true;
    const s = String(deger).trim();
    return s === '' || s === '[]' || s === '{}' || s === '""' || s === 'null' || s === 'undefined';
};

/** `firebaseSync` 50 KB üstünü LZ ile sıkıştırıyor; okurken açılmalı. */
const cozumle = (deger) => {
    if (typeof deger === 'string' && deger.startsWith('LZ64:')) {
        try { return LZString.decompressFromBase64(deger.substring(5)) || deger; }
        catch { return deger; }
    }
    return deger;
};

/** Kayıt sayısını insan tarafından okunur biçimde verir. */
const olcu = (metin) => {
    try {
        const v = JSON.parse(metin);
        if (Array.isArray(v)) return `${v.length} kayıt`;
        if (v && typeof v === 'object') return `${Object.keys(v).length} alan`;
        return '1 değer';
    } catch { return `${(metin || '').length} bayt`; }
};

/**
 * Eski havuzu tarar ve boşta kalan anahtarları geri getirir.
 *
 * @param {object} kullanici Oturum nesnesi
 * @returns {Promise<{calisti:boolean, tasinan:Array, cakisan:Array, hata?:string}>}
 */
export const eskiHavuzuTasi = async (kullanici) => {
    // Öğrenci taşıma yapmaz — havuzun sahibi değil.
    if (!kullanici || kullanici.role === 'student') {
        return { calisti: false, tasinan: [], cakisan: [] };
    }
    try {
        if (localStorage.getItem(BAYRAK)) {
            return { calisti: false, tasinan: [], cakisan: [] };
        }
    } catch { /* localStorage yoksa devam etme */ }

    let belgeler;
    try {
        const s = await getDocs(query(collection(db, 'syncData'), where('bucketId', '==', ESKI_HAVUZ)));
        belgeler = s.docs;
    } catch (e) {
        /**
         * Okuma reddedilirse taşıma YAPILMADI olarak işaretlenmez —
         * bayrak konmaz ki bir sonraki girişte tekrar denensin.
         */
        return { calisti: false, tasinan: [], cakisan: [], hata: e?.code || e?.message };
    }

    const tasinan = [];
    const cakisan = [];

    for (const belge of belgeler) {
        const veri = belge.data();
        const anahtar = veri?.key;
        if (!anahtar) continue;

        const eskiDeger = cozumle(veri.value);
        if (bos(eskiDeger)) continue;

        const mevcut = localStorage.getItem(anahtar);
        if (!bos(mevcut)) {
            // Dolu anahtara DOKUNULMAZ; kullanıcı karar versin.
            cakisan.push({ anahtar, eski: olcu(eskiDeger), mevcut: olcu(mevcut) });
            continue;
        }

        try {
            localStorage.setItem(anahtar, eskiDeger);
            window.dispatchEvent(new StorageEvent('storage', { key: anahtar, newValue: eskiDeger }));
            // Yeni havuza sahiplik damgasıyla yazılır
            await window.firebaseSync?.syncKey?.(anahtar);
            tasinan.push({ anahtar, olcu: olcu(eskiDeger) });
        } catch (e) {
            console.warn(`Eski havuzdan taşınamadı (${anahtar}):`, e?.message);
        }
    }

    try { localStorage.setItem(BAYRAK, new Date().toISOString()); } catch { /* ignore */ }

    if (tasinan.length || cakisan.length) {
        console.log(
            `📦 Eski havuz taşıma — geri getirilen: ${tasinan.length}, çakışan: ${cakisan.length}`,
            { tasinan, cakisan }
        );
    }
    return { calisti: true, tasinan, cakisan };
};

export default { eskiHavuzuTasi };
