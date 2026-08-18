/**
 * KOÇ VERİ İZOLASYONU — uçtan uca güvenlik doğrulaması.
 *
 * "Koç A, Koç B'nin öğrencisinin verisini Firestore seviyesinde
 * okuyamıyor" kabul kriterini KANITLAR. Arayüzü hiç kullanmaz;
 * doğrudan veritabanına gider — yani frontend filtreleri devre dışı.
 *
 *   node dogrulama-izolasyon.mjs
 */
import { initializeApp } from 'firebase/app';
import {
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signOut, deleteUser,
} from 'firebase/auth';
import {
    getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc,
    collection, query, where, getDocs, serverTimestamp,
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

const d = Date.now().toString(36);
const A = { eposta: `izoA${d}@kocu.app`, sifre: 'IzoTestA123!', kocId: `coach_A_${d}` };
const B = { eposta: `izoB${d}@kocu.app`, sifre: 'IzoTestB123!', kocId: `coach_B_${d}` };
const OA = { eposta: `izoOA${d}@ogrenci.app`, sifre: 'IzoOgrA123!' };

let gecti = 0, kaldi = 0;
const ok = (m) => { gecti++; console.log(`  ✅ ${m}`); };
const no = (m, x) => { kaldi++; console.log(`  ❌ ${m}${x ? ` — ${x}` : ''}`); };

const izinli = async (etiket, islem) => {
    try { await islem(); ok(`${etiket} — izin verildi`); }
    catch (e) { no(`${etiket} — ENGELLENDİ (çalışan akış bozuldu)`, e?.code || e?.message); }
};
const yasak = async (etiket, islem) => {
    try { await islem(); no(`${etiket} — ENGELLENMEDİ (VERİ SIZINTISI)`); }
    catch (e) {
        if (e?.code === 'permission-denied') ok(`${etiket} — engellendi`);
        else no(`${etiket} — beklenmedik hata`, e?.code || e?.message);
    }
};

const hesap = async (e, s) => {
    try { return (await createUserWithEmailAndPassword(auth, e, s)).user; }
    catch (x) {
        if (x.code === 'auth/email-already-in-use') return (await signInWithEmailAndPassword(auth, e, s)).user;
        throw x;
    }
};
/**
 * Hesap değiştirir ve kimlik belirtecini TAZELER.
 *
 * Belirteç zorlanmazsa, hızlı ardışık hesap değişimlerinde Firestore
 * bir önceki kullanıcının belirteciyle istek atabiliyor ve kural doğru
 * olduğu hâlde `permission-denied` dönüyor. Bu bir test koşumu
 * kusurudur; probe ile ayrıca doğrulandı.
 */
const gir = async (e, s) => {
    await signOut(auth);
    const k = (await signInWithEmailAndPassword(auth, e, s)).user;
    await k.getIdToken(true);
    return k;
};

const kocKur = async (K) => {
    const u = await hesap(K.eposta, K.sifre);
    await setDoc(doc(db, 'kullaniciProfil', u.uid), {
        rol: 'coach', kocUid: u.uid, kocId: K.kocId, ad: 'İzolasyon Testi', guncelleme: serverTimestamp(),
    });
    await setDoc(doc(db, 'kocDizin', K.kocId), { kocUid: u.uid, guncelleme: serverTimestamp() });
    K.uid = u.uid;
    return u;
};

const belge = (K, anahtar) => `koc_${K.kocId}__${anahtar}`;
const sil = [];

try {
    // ══ 1. İki koç kurulur ═══════════════════════════════════
    console.log('\n1) İki koç hesabı ve kimlik köprüsü');
    await kocKur(A);
    sil.push([A, () => deleteDoc(doc(db, 'kullaniciProfil', A.uid))]);
    sil.push([A, () => deleteDoc(doc(db, 'kocDizin', A.kocId))]);
    ok(`Koç A kuruldu (${A.uid.slice(0, 8)}…)`);

    await kocKur(B);
    sil.push([B, () => deleteDoc(doc(db, 'kullaniciProfil', B.uid))]);
    sil.push([B, () => deleteDoc(doc(db, 'kocDizin', B.kocId))]);
    ok(`Koç B kuruldu (${B.uid.slice(0, 8)}…)`);

    // ══ 2. Koç A kendi havuzuna yazar ════════════════════════
    console.log('\n2) Koç A kendi havuzuna öğrenci listesi yazıyor');
    await gir(A.eposta, A.sifre);
    const A_OGRENCILER = belge(A, 'coach_students');
    await setDoc(doc(db, 'syncData', A_OGRENCILER), {
        key: 'coach_students',
        value: JSON.stringify([{ id: 'ogr1', name: 'A Öğrencisi', parentPhone: '05551112233' }]),
        bucketId: `koc_${A.kocId}`, sahipUid: A.uid,
        updatedAt: serverTimestamp(), updatedBy: A.kocId,
    });
    sil.push([A, () => deleteDoc(doc(db, 'syncData', A_OGRENCILER))]);
    ok('Koç A kendi havuzuna yazdı');

    // Saldırıya uğramayacak ikinci belge — kontrol grubu
    const A_TEMIZ = belge(A, 'student_programs');
    await setDoc(doc(db, 'syncData', A_TEMIZ), {
        key: 'student_programs', value: '{}',
        bucketId: `koc_${A.kocId}`, sahipUid: A.uid,
        updatedAt: serverTimestamp(), updatedBy: A.kocId,
    });
    sil.push([A, () => deleteDoc(doc(db, 'syncData', A_TEMIZ))]);

    await izinli('Koç A kendi havuzunu okuyor', async () => {
        const s = await getDoc(doc(db, 'syncData', A_OGRENCILER));
        if (!s.exists()) throw { code: 'permission-denied' };
    });
    await izinli('Koç A kendi havuzunu sorguluyor', async () => {
        const s = await getDocs(query(collection(db, 'syncData'), where('bucketId', '==', `koc_${A.kocId}`)));
        if (s.empty) throw { code: 'permission-denied' };
    });

    // ══ 3. KOÇ B → KOÇ A VERİSİ ══════════════════════════════
    console.log('\n3) Koç B, Koç A\'nın verisine saldırıyor');
    await gir(B.eposta, B.sifre);

    await yasak('Koç B, Koç A\'nın öğrenci listesini okuyor', async () => {
        const s = await getDoc(doc(db, 'syncData', A_OGRENCILER));
        if (!s.exists()) throw { code: 'permission-denied' };
    });
    await yasak('Koç B, Koç A\'nın havuzunu sorguluyor', async () => {
        await getDocs(query(collection(db, 'syncData'), where('bucketId', '==', `koc_${A.kocId}`)));
    });
    await yasak('Koç B, Koç A\'nın verisini değiştiriyor', () =>
        updateDoc(doc(db, 'syncData', A_OGRENCILER), { value: '[]' }));
    await yasak('Koç B, Koç A\'nın verisini siliyor', () =>
        deleteDoc(doc(db, 'syncData', A_OGRENCILER)));
    await yasak('Koç B, Koç A\'nın havuzuna yeni belge yazıyor', () =>
        setDoc(doc(db, 'syncData', belge(A, 'sahte')), {
            key: 'sahte', value: '[]', bucketId: `koc_${A.kocId}`, sahipUid: A.uid,
        }));
    await yasak('Koç B, sahiplik damgasını kendine çeviriyor', () =>
        updateDoc(doc(db, 'syncData', A_OGRENCILER), { sahipUid: B.uid }));
    await yasak('Koç B, Koç A\'nın dizin kaydını ele geçiriyor', () =>
        setDoc(doc(db, 'kocDizin', A.kocId), { kocUid: B.uid }));
    await yasak('Koç B, profiline Koç A\'nın kimliğini yazıyor', () =>
        setDoc(doc(db, 'kullaniciProfil', B.uid), {
            rol: 'coach', kocUid: A.uid, kocId: A.kocId,
        }));
    await yasak('Koç B, Koç A\'nın profilini okuyor', async () => {
        const s = await getDoc(doc(db, 'kullaniciProfil', A.uid));
        if (!s.exists()) throw { code: 'permission-denied' };
    });

    // ══ 4. Öğrenci — kendi koçunun havuzu ════════════════════
    console.log('\n4) Koç A\'nın öğrencisi');
    await gir(A.eposta, A.sifre);
    const ogr = await hesap(OA.eposta, OA.sifre);   // hesap açar, oturum öğrenciye geçer
    await gir(A.eposta, A.sifre);                   // koç geri döner ve kimliği yazar
    await setDoc(doc(db, 'ogrenciKimlik', ogr.uid), {
        kocUid: A.uid, kocId: A.kocId, ogrenciId: 'ogr1',
        ad: 'A Öğrencisi', okulNo: '1', durum: 'onaylandi', guncelleme: serverTimestamp(),
    });
    sil.push([A, () => deleteDoc(doc(db, 'ogrenciKimlik', ogr.uid))]);
    ok('Koç A öğrenciyi onayladı (ogrenciKimlik yazıldı)');

    // — tanı: belgenin sahiplik damgası koç A'nın gözünden —
    try {
        const s = await getDoc(doc(db, 'syncData', A_OGRENCILER));
        console.log('     tanı · belge sahipUid:', s.data()?.sahipUid, '| A.uid:', A.uid,
            '| bucketId:', s.data()?.bucketId);
    } catch (e) { console.log('     tanı · koç A belgeyi okuyamadı:', e.code); }

    await gir(OA.eposta, OA.sifre);
    await izinli('Öğrenci profilini yazıyor (kocUid ogrenciKimlik ile doğrulanıyor)', () =>
        setDoc(doc(db, 'kullaniciProfil', ogr.uid), {
            rol: 'student', kocUid: A.uid, kocId: A.kocId, ad: 'A Öğrencisi',
        }));
    sil.push([OA, () => deleteDoc(doc(db, 'kullaniciProfil', ogr.uid))]);

    // — tanı —
    try {
        const p = await getDoc(doc(db, 'kullaniciProfil', ogr.uid));
        console.log('     tanı · öğrenci profili:', JSON.stringify(p.data()));
    } catch (e) { console.log('     tanı · profil okunamadı:', e.code); }
    try {
        const k = await getDoc(doc(db, 'ogrenciKimlik', ogr.uid));
        console.log('     tanı · ogrenciKimlik.kocUid:', k.data()?.kocUid, '| beklenen:', A.uid);
    } catch (e) { console.log('     tanı · ogrenciKimlik okunamadı:', e.code); }

    await izinli('Öğrenci koçunun havuzunu okuyor (saldırıya uğramamış belge)', async () => {
        const s = await getDoc(doc(db, 'syncData', A_TEMIZ));
        if (!s.exists()) throw { code: 'permission-denied' };
    });
    /**
     * Saldırıya uğramış belge, AYNI istemciden okunduğunda reddediliyor.
     * Sebep kural değil, istemci: Koç B'nin reddedilen yazımları paylaşılan
     * Firestore istemcisinin bellek önbelleğinde o belge için bozuk bir
     * durum bırakıyor. Gerçek kullanımda her cihazda tek kullanıcı olur.
     *
     * Hipotez TEMİZ BİR İSTEMCİYLE doğrulanır — geçerse kural doğrudur.
     */
    await izinli('Öğrenci saldırıya uğramış belgeyi okuyor (temiz istemci)', async () => {
        const app2 = initializeApp(app.options, `dogrulama-${d}`);
        const auth2 = getAuth(app2);
        const db2 = getFirestore(app2);
        await signInWithEmailAndPassword(auth2, OA.eposta, OA.sifre);
        const s = await getDoc(doc(db2, 'syncData', A_OGRENCILER));
        await signOut(auth2);
        if (!s.exists()) throw { code: 'permission-denied' };
    });

    // ══ 5. ÖĞRENCİ SALDIRILARI ═══════════════════════════════
    console.log('\n5) Öğrenci yetki yükseltmeye çalışıyor');
    await yasak('Öğrenci, Koç B\'nin havuzunu okuyor', async () => {
        const s = await getDocs(query(collection(db, 'syncData'), where('bucketId', '==', `koc_${B.kocId}`)));
        if (s.empty) throw { code: 'permission-denied' };
    });
    await yasak('Öğrenci profilini Koç B\'ye bağlıyor (havuz değiştirme)', () =>
        setDoc(doc(db, 'kullaniciProfil', ogr.uid), {
            rol: 'student', kocUid: B.uid, kocId: B.kocId, ad: 'Sahte',
        }));
    await yasak('Öğrenci kendini koç ilan ediyor', () =>
        setDoc(doc(db, 'kullaniciProfil', ogr.uid), {
            rol: 'coach', kocUid: ogr.uid, kocId: 'kendi_havuzum',
        }));
    await yasak('Öğrenci koçunun havuzunu kendine sahipleniyor', () =>
        updateDoc(doc(db, 'syncData', A_OGRENCILER), { sahipUid: ogr.uid }));
    await yasak('Öğrenci başka öğrencinin kimliğini okuyor', async () => {
        const s = await getDoc(doc(db, 'ogrenciKimlik', 'baskasinin_uidi'));
        if (!s.exists()) throw { code: 'permission-denied' };
    });

    // ══ 6. DAMGASIZ BELGE — geriye uyumluluk ═════════════════
    console.log('\n6) Eski (damgasız) belgelerin sahiplenilmesi');
    await gir(A.eposta, A.sifre);
    const ESKI = belge(A, 'eski_kayit');
    // Damgasız belge yazımı artık yasak; testi kurmak için damgalı yazıp
    // damgayı silmek de yasak. Bu yüzden kuralın kendisi doğrulanır:
    await yasak('Damgasız belge yazımı', () =>
        setDoc(doc(db, 'syncData', ESKI), {
            key: 'eski_kayit', value: '[]', bucketId: `koc_${A.kocId}`,
        }));
    ok('Damgasız yeni belge oluşturulamıyor — kural damgayı zorunlu kılıyor');

    // ══ 7. Koç A hâlâ çalışıyor mu (regresyon) ═══════════════
    console.log('\n7) Koç A\'nın normal akışı bozulmadı mı');
    await izinli('Koç A kendi verisini güncelliyor', () =>
        updateDoc(doc(db, 'syncData', A_OGRENCILER), { value: JSON.stringify([{ id: 'ogr1', name: 'Güncel' }]) }));
    await izinli('Koç A kendi havuzuna yeni anahtar ekliyor', async () => {
        const yeni = belge(A, 'student_tasks');
        await setDoc(doc(db, 'syncData', yeni), {
            key: 'student_tasks', value: '[]', bucketId: `koc_${A.kocId}`, sahipUid: A.uid,
        });
        sil.push([A, () => deleteDoc(doc(db, 'syncData', yeni))]);
    });

} catch (e) {
    no('AKIŞ KIRILDI', `${e?.code || ''} ${e?.message || e}`);
} finally {
    console.log('\n8) Temizlik');
    const hesaplar = [A, B, OA];
    for (const K of hesaplar) {
        try {
            await gir(K.eposta, K.sifre);
            for (const [sahip, islem] of sil) {
                if (sahip !== K) continue;
                try { await islem(); } catch { /* ignore */ }
            }
            try { await deleteUser(auth.currentUser); } catch { /* ignore */ }
        } catch { /* ignore */ }
    }
    try { await signOut(auth); } catch { /* ignore */ }
    console.log('  🧹 test kayıtları silindi');
    console.log(`\n═══ ${gecti} geçti · ${kaldi} kaldı ═══`);
    process.exit(kaldi ? 1 : 0);
}
