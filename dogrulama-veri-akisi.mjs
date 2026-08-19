/**
 * ÖĞRENCİ → FIRESTORE → KOÇ veri akışının UÇTAN UCA doğrulaması.
 *
 * Kanıtlanan zincir (üç anahtar için ayrı ayrı):
 *   öğrenci oturumu → koçun havuzuna study_log / error_notebook /
 *   deneme_analizleri yazar → KOÇ oturumu (temiz cihaz: yerel veri yok,
 *   doğrudan Firestore) okur → silme boş liste olarak yazılır → koç
 *   tarafında geri gelmez → yabancı koç hiçbirini OKUYAMAZ.
 *
 * Gerçek Firebase projesine karşı çalışır; kendi test kayıtlarını siler.
 *   node dogrulama-veri-akisi.mjs
 */
import { initializeApp } from 'firebase/app';
import {
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signOut, deleteUser,
} from 'firebase/auth';
import {
    getFirestore, doc, setDoc, getDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';

const app = initializeApp({
    apiKey: 'AIzaSyA5aBsSGcf5_kZn-yAxC0ba---zcNMuWss',
    authDomain: 'ai-ogrenci-kocu-b037b.firebaseapp.com',
    projectId: 'ai-ogrenci-kocu-b037b',
    storageBucket: 'ai-ogrenci-kocu-b037b.firebasestorage.app',
    messagingSenderId: '678490791897',
    appId: '1:678490791897:web:6534fd16ddf04f8b1e83c8',
});
const auth = getAuth(app);
const db = getFirestore(app);

const damga = Date.now().toString(36);
const KOC = { eposta: `vak${damga}koc@kocu.app`, sifre: 'TestKoc123!', id: `coach_vak_${damga}` };
const OGR = { eposta: `vak${damga}ogr@ogrenci.app`, sifre: 'TestOgr123!', appId: `ogr_vak_${damga}` };
const YABANCI = { eposta: `vak${damga}yab@kocu.app`, sifre: 'TestYab123!' };

const HAVUZ = `koc_${KOC.id}`;
const temiz = (s) => String(s).replace(/[^a-zA-Z0-9_]/g, '_');
const belgeId = (key) => `${temiz(HAVUZ)}__${temiz(key)}`;
const ANAHTARLAR = ['study_log', 'error_notebook', 'deneme_analizleri'];

let gecti = 0, kaldi = 0;
const ok = (m) => { gecti++; console.log(`  ✅ ${m}`); };
const no = (m, d) => { kaldi++; console.log(`  ❌ ${m}${d ? ` — ${d}` : ''}`); };
const reddedilmeli = async (etiket, islem) => {
    try { await islem(); no(`${etiket} — ENGELLENMEDİ (güvenlik açığı)`); }
    catch (e) {
        if (e?.code === 'permission-denied') ok(`${etiket} — engellendi`);
        else no(`${etiket} — beklenmedik hata`, e?.code || e?.message);
    }
};
const hesapAc = async (e, s) => {
    try { return (await createUserWithEmailAndPassword(auth, e, s)).user; }
    catch (x) {
        if (x.code === 'auth/email-already-in-use') return (await signInWithEmailAndPassword(auth, e, s)).user;
        throw x;
    }
};

const temizlik = [];

try {
    // ══ 1. Koç kurulumu ═══════════════════════════════════════
    console.log('\n1) Koç hesabı ve profili');
    const koc = await hesapAc(KOC.eposta, KOC.sifre);
    await setDoc(doc(db, 'kullaniciProfil', koc.uid), {
        rol: 'coach', kocUid: koc.uid, kocId: KOC.id, guncelleme: serverTimestamp(),
    });
    temizlik.push(() => deleteDoc(doc(db, 'kullaniciProfil', koc.uid)));
    ok('koç profili yazıldı');

    // ══ 2. Öğrenci bağlama (kimlik köprüsü) ═══════════════════
    console.log('\n2) Öğrenci hesabı koça bağlanıyor');
    await signOut(auth);
    const ogr = await hesapAc(OGR.eposta, OGR.sifre);

    await signOut(auth);
    await signInWithEmailAndPassword(auth, KOC.eposta, KOC.sifre);
    await setDoc(doc(db, 'ogrenciKimlik', ogr.uid), {
        kocUid: koc.uid, kocId: KOC.id, ogrenciId: OGR.appId,
        ad: 'Akış Test Öğrenci', okulNo: `v${damga}`, durum: 'onaylandi',
        guncelleme: serverTimestamp(),
    });
    temizlik.push(async () => {
        await signOut(auth).catch(() => {});
        await signInWithEmailAndPassword(auth, KOC.eposta, KOC.sifre);
        await deleteDoc(doc(db, 'ogrenciKimlik', ogr.uid)).catch(() => {});
    });
    ok('koç kimlik kaydını yazdı');

    await signOut(auth);
    await signInWithEmailAndPassword(auth, OGR.eposta, OGR.sifre);
    await setDoc(doc(db, 'kullaniciProfil', ogr.uid), {
        rol: 'student', kocUid: koc.uid, kocId: KOC.id, ogrenciId: OGR.appId,
        guncelleme: serverTimestamp(),
    });
    temizlik.push(async () => {
        await signOut(auth).catch(() => {});
        await signInWithEmailAndPassword(auth, OGR.eposta, OGR.sifre);
        await deleteDoc(doc(db, 'kullaniciProfil', ogr.uid)).catch(() => {});
    });
    ok('öğrenci profili kimlik köprüsünden doğrulanarak yazıldı');

    // ══ 3. ÖĞRENCİ üç anahtarı koçun havuzuna yazıyor ═════════
    console.log('\n3) Öğrenci telefonu üç kaydı buluta yazıyor');
    const ORNEK = {
        study_log: [{ id: 'g1', studentId: OGR.appId, kind: 'soru', subject: 'Matematik', date: '2026-08-19', correct: 20, wrong: 5, blank: 2 }],
        error_notebook: [{ id: 'e1', studentId: OGR.appId, subject: 'Matematik', topic: 'Problemler', errorType: 'time', createdAt: '2026-08-19T10:00:00Z' }],
        deneme_analizleri: [{ id: 'da1', studentId: OGR.appId, ad: 'Akış Testi TYT', tur: 'TYT', tarih: '2026-08-19', dersler: { Matematik: { dogru: 20, yanlis: 5, bos: 15, net: 18.75 } }, konuHatalari: [{ ders: 'Matematik', konu: 'Problemler', adet: 2, nedenler: ['sure'] }] }],
    };
    for (const key of ANAHTARLAR) {
        await setDoc(doc(db, 'syncData', belgeId(key)), {
            key, value: JSON.stringify(ORNEK[key]), updatedAt: serverTimestamp(),
            updatedBy: OGR.appId, bucketId: HAVUZ, sahipUid: koc.uid,
        });
        temizlik.push(() => deleteDoc(doc(db, 'syncData', belgeId(key))).catch(() => {}));
        ok(`öğrenci ${key} anahtarını koçun havuzuna yazdı`);
    }

    // Sahtecilik: öğrenci başka sahiplik damgasıyla yazamamalı
    await reddedilmeli('öğrencinin başka koçun damgasıyla havuz belgesi yazması', () =>
        setDoc(doc(db, 'syncData', `koc_baska__x_${damga}`), {
            key: 'x', value: '[]', updatedAt: serverTimestamp(),
            updatedBy: OGR.appId, bucketId: 'koc_baska', sahipUid: 'baska_uid',
        }));

    // ══ 4. TEMİZ KOÇ CİHAZI okuyor ════════════════════════════
    console.log('\n4) Temiz koç cihazı (yerel veri yok) Firestore\'dan okuyor');
    await signOut(auth);
    await signInWithEmailAndPassword(auth, KOC.eposta, KOC.sifre);
    for (const key of ANAHTARLAR) {
        const belge = await getDoc(doc(db, 'syncData', belgeId(key)));
        const deger = belge.exists() ? JSON.parse(belge.data().value) : null;
        if (deger && deger.length === 1 && String(deger[0].studentId) === OGR.appId) {
            ok(`koç ${key} verisini okudu (öğrenci kimliğiyle eşleşiyor)`);
        } else no(`koç ${key} verisini okuyamadı`);
    }
    // Deneme analizi içerik derinliği: neden alanı taşınmış mı
    const da = await getDoc(doc(db, 'syncData', belgeId('deneme_analizleri')));
    const daV = JSON.parse(da.data().value);
    if (daV[0].konuHatalari?.[0]?.nedenler?.includes('sure')) {
        ok('hata NEDENİ (öğrencinin manuel seçimi) koça eksiksiz ulaştı');
    } else no('hata nedeni alanı kayboldu');

    // ══ 5. Silme yayılımı ═════════════════════════════════════
    console.log('\n5) Silme: öğrenci son kaydı siliyor (boş liste zorla yazılır)');
    await signOut(auth);
    await signInWithEmailAndPassword(auth, OGR.eposta, OGR.sifre);
    await setDoc(doc(db, 'syncData', belgeId('deneme_analizleri')), {
        key: 'deneme_analizleri', value: '[]', updatedAt: serverTimestamp(),
        updatedBy: OGR.appId, bucketId: HAVUZ, sahipUid: koc.uid,
    });
    await signOut(auth);
    await signInWithEmailAndPassword(auth, KOC.eposta, KOC.sifre);
    const silinmis = await getDoc(doc(db, 'syncData', belgeId('deneme_analizleri')));
    if (silinmis.data().value === '[]') ok('silme koça yayıldı — kayıt geri gelmiyor');
    else no('silme yayılmadı, kayıt geri gelir');

    // ══ 6. Yabancı koç izolasyonu ═════════════════════════════
    console.log('\n6) Yabancı koç bu verileri okuyabiliyor mu');
    await signOut(auth);
    const yab = await hesapAc(YABANCI.eposta, YABANCI.sifre);
    await setDoc(doc(db, 'kullaniciProfil', yab.uid), {
        rol: 'coach', kocUid: yab.uid, kocId: `coach_yab_${damga}`, guncelleme: serverTimestamp(),
    });
    for (const key of ANAHTARLAR) {
        await reddedilmeli(`yabancı koçun ${key} okuma denemesi`, () =>
            getDoc(doc(db, 'syncData', belgeId(key))));
    }
    await reddedilmeli('yabancı koçun havuz belgesini EZME denemesi', () =>
        setDoc(doc(db, 'syncData', belgeId('study_log')), {
            key: 'study_log', value: '[]', updatedAt: serverTimestamp(),
            updatedBy: 'yab', bucketId: HAVUZ, sahipUid: yab.uid,
        }));
    await deleteDoc(doc(db, 'kullaniciProfil', yab.uid)).catch(() => {});
} catch (e) {
    no('beklenmedik hata', e?.code || e?.message);
} finally {
    console.log('\n7) Temizlik');
    for (const t of temizlik.reverse()) { try { await t(); } catch { /* ignore */ } }
    try {
        await signOut(auth).catch(() => {});
        const y = await signInWithEmailAndPassword(auth, YABANCI.eposta, YABANCI.sifre);
        await deleteUser(y.user);
    } catch { /* ignore */ }
    try {
        await signOut(auth).catch(() => {});
        const o = await signInWithEmailAndPassword(auth, OGR.eposta, OGR.sifre);
        await deleteUser(o.user);
    } catch { /* ignore */ }
    try {
        await signOut(auth).catch(() => {});
        const k = await signInWithEmailAndPassword(auth, KOC.eposta, KOC.sifre);
        await deleteUser(k.user);
    } catch { /* ignore */ }
    console.log('  🧹 test kayıtları ve hesapları silindi');
    console.log(`\n═══ ${gecti} geçti · ${kaldi} kaldı ═══`);
    process.exit(kaldi ? 1 : 0);
}
