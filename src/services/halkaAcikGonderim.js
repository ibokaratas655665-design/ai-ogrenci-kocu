/**
 * 📮 HALKA AÇIK GÖNDERİM
 *
 * ═════════════════════════════════════════════════════════════════
 * NEDEN VAR
 * ═════════════════════════════════════════════════════════════════
 *
 * `/obp-girisi` ve `/envanter/:testId` rotaları korumasız: öğrenci
 * giriş yapmadan OBP/diploma notunu giriyor ya da envanteri çözüyor.
 * O cihazda Firebase oturumu yok, dolayısıyla:
 *
 *   · `firebaseSync` init edilmiyor — `sahipUid` olmadığı için
 *     `writeKeyToFirebase` daha ilk satırda geri dönüyor,
 *   · `PublicOBPEntry` doğrudan `syncData`'ya yazmayı deniyordu ve
 *     kural `girisYapmis()` istediği için REDDEDİLİYORDU.
 *
 * Ölçülerek doğrulandı: oturumsuz `setDoc(syncData/…)` →
 * `permission-denied`. Yani iki ürün özelliği de sessizce ölüydü:
 * öğrenci formu dolduruyor, koça hiçbir şey ulaşmıyordu.
 *
 * ═════════════════════════════════════════════════════════════════
 * TASARIM
 * ═════════════════════════════════════════════════════════════════
 *
 * Ayrı bir kutu: yazması herkese açık ama ŞEKLİ SIKI (kural yalnızca
 * dört alana, sabit türlere ve boyut sınırına izin veriyor), okuması
 * yalnızca gönderimin hedeflediği koça ait.
 *
 * `syncData` havuzuna dokunulmuyor. Koç gönderimi görür, kendi
 * havuzuna aktarır ve kutudan siler. Böylece korumasız yazım hiçbir
 * zaman koçun asıl verisine doğrudan karışmaz.
 */

import {
    collection, doc, setDoc, getDocs, deleteDoc, query, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

const KUTU = 'halkaAcikGonderim';

/** Kuralın kabul ettiği türler. */
export const TURLER = { obp: 'obp', envanter: 'envanter' };

/**
 * Gönderimi kutuya bırakır. Oturum GEREKMEZ.
 *
 * @param {string} kocId Hedef koçun uygulama kimliği
 * @param {'obp'|'envanter'} tur
 * @param {object} veri  Serileştirilebilir gönderim içeriği
 */
export const gonder = async (kocId, tur, veri) => {
    if (!kocId) return { basarili: false, hata: 'Koç kimliği yok.' };
    if (!TURLER[tur]) return { basarili: false, hata: 'Geçersiz gönderim türü.' };

    try {
        const metin = JSON.stringify(veri ?? null);
        // Kural 100 KB sınırı koyuyor; büyük gönderimi baştan reddet ki
        // kullanıcı "gönderildi" görüp veri kaybetmesin.
        if (metin.length >= 100000) {
            return { basarili: false, hata: 'Gönderim çok büyük.' };
        }

        await setDoc(doc(collection(db, KUTU)), {
            kocId: String(kocId),
            tur,
            veri: metin,
            olusturma: serverTimestamp(),
        });
        return { basarili: true };
    } catch (e) {
        return { basarili: false, hata: e?.code || e?.message };
    }
};

/**
 * Koçun kutusundaki gönderimler. Yalnızca hedef koç okuyabilir.
 * @returns {Promise<Array<{id:string, tur:string, veri:any}>>}
 */
export const kutuyuOku = async (kocId) => {
    if (!kocId) return [];
    try {
        const q = query(collection(db, KUTU), where('kocId', '==', String(kocId)));
        const snap = await getDocs(q);
        return snap.docs.map((d) => {
            const ham = d.data();
            let veri = null;
            try { veri = JSON.parse(ham.veri); } catch { /* bozuk gönderim atlanır */ }
            return { id: d.id, tur: ham.tur, veri };
        }).filter((g) => g.veri != null);
    } catch (e) {
        // Sessizce boş dönmek 'sessiz kayıp' desenini tekrar üretir:
        // koç gönderim geldiğini hiç öğrenemez. En azından iz bırak.
        console.warn('Halka açık kutu okunamadı:', e?.code || e?.message);
        return [];
    }
};

/** İşlenen gönderimi kutudan kaldırır. */
export const kutudanSil = async (belgeId) => {
    if (!belgeId) return false;
    try { await deleteDoc(doc(db, KUTU, belgeId)); return true; } catch { return false; }
};

export default { TURLER, gonder, kutuyuOku, kutudanSil };
