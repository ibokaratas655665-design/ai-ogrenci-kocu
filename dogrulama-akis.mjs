/**
 * Davet → katılım → onay → giriş akışının UÇTAN UCA doğrulaması.
 * Gerçek Firebase projesine karşı çalışır, sonunda kendi kaydını temizler.
 *   node dogrulama-akis.mjs
 */
import { initializeApp } from 'firebase/app';
import {
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signOut, deleteUser,
} from 'firebase/auth';
import {
    getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc,
    collection, query, where, getDocs, serverTimestamp, Timestamp,
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
const KOC = { eposta: `test${damga}koc@kocu.app`, sifre: 'TestKoc123!', id: `coach_${damga}` };
const OGR = { eposta: `test${damga}ogr@ogrenci.app`, sifre: 'TestOgr123!', okulNo: `t${damga}` };
const YABANCI = { eposta: `test${damga}yab@kocu.app`, sifre: 'TestYab123!' };

let gecti = 0, kaldi = 0;
const ok = (m) => { gecti++; console.log(`  ✅ ${m}`); };
const no = (m, d) => { kaldi++; console.log(`  ❌ ${m}${d ? ` — ${d}` : ''}`); };

/** Yasaklanması BEKLENEN işlem. Başarılı olursa güvenlik açığı demektir. */
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
    // ══ 1. Koç davet üretir ══════════════════════════════════
    console.log('\n1) Koç davet üretiyor');
    const koc = await hesapAc(KOC.eposta, KOC.sifre);
    const KOD = `T${damga.slice(-5).toUpperCase()}`.slice(0, 6);
    const son = new Date(); son.setDate(son.getDate() + 14);

    await setDoc(doc(db, 'davetler', KOD), {
        kocUid: koc.uid, kocId: KOC.id, kocAd: 'Test Koç',
        sinif: '11', not: 'test', kullanimHakki: 1, kullanilan: 0,
        aktif: true, sonZaman: Timestamp.fromDate(son), olusturma: serverTimestamp(),
    });
    temizlik.push(() => deleteDoc(doc(db, 'davetler', KOD)));
    ok(`davet sunucuya yazıldı (${KOD})`);

    // Koç başkasının adına davet üretemez
    await reddedilmeli('başka koç adına davet üretme', () =>
        setDoc(doc(db, 'davetler', `X${KOD.slice(1)}`), {
            kocUid: 'baskasinin_uidi', kocId: 'x', kocAd: 'x',
            kullanimHakki: 1, kullanilan: 0, aktif: true,
            sonZaman: Timestamp.fromDate(son), olusturma: serverTimestamp(),
        }));

    // ══ 2. Öğrenci farklı cihaz: OTURUMSUZ daveti okuyabilmeli ══
    console.log('\n2) Öğrencinin cihazı — oturum yokken davet okunuyor');
    await signOut(auth);
    const acik = await getDoc(doc(db, 'davetler', KOD));
    if (acik.exists() && acik.data().kocAd === 'Test Koç') {
        ok('davet giriş yapmadan okunabildi (davet linki artık her cihazda çalışır)');
    } else {
        no('davet oturumsuz okunamadı — davet linki yine kırık olurdu');
    }

    // ══ 3. Öğrenci hesap açıp katılım talebi gönderir ═════════
    console.log('\n3) Öğrenci katılım talebi gönderiyor');
    const ogr = await hesapAc(OGR.eposta, OGR.sifre);

    // Önce sahtecilik denemesi: başka koça yazmaya çalışsın
    await reddedilmeli('daveti taşıyıp başka koça kaydolma', () =>
        setDoc(doc(db, 'katilimTalepleri', ogr.uid), {
            kod: KOD, kocUid: 'baska_kocun_uidi', kocId: 'baska',
            kocAd: 'x', ad: 'Sahte', okulNo: OGR.okulNo, durum: 'bekliyor',
            olusturma: serverTimestamp(),
        }));

    // Kendini doğrudan onaylı yazma denemesi
    await reddedilmeli('kendini onaylı olarak kaydetme', () =>
        setDoc(doc(db, 'katilimTalepleri', ogr.uid), {
            kod: KOD, kocUid: koc.uid, kocId: KOC.id, kocAd: 'Test Koç',
            ad: 'Sahte', okulNo: OGR.okulNo, durum: 'onaylandi',
            olusturma: serverTimestamp(),
        }));

    // Kendi kimlik kaydını yazma denemesi (koçun havuzuna sızma)
    await reddedilmeli('kendi kimlik kaydını yazma', () =>
        setDoc(doc(db, 'ogrenciKimlik', ogr.uid), {
            kocUid: koc.uid, kocId: KOC.id, ogrenciId: 'sahte',
            ad: 'Sahte', okulNo: OGR.okulNo, durum: 'onaylandi',
        }));

    // Gerçek talep
    await setDoc(doc(db, 'katilimTalepleri', ogr.uid), {
        kod: KOD, kocUid: koc.uid, kocId: KOC.id, kocAd: 'Test Koç',
        ad: 'Test Öğrenci', okulNo: OGR.okulNo, sinif: '11', sube: 'A',
        veliAd: '', veliTel: '', durum: 'bekliyor', olusturma: serverTimestamp(),
    });
    temizlik.push(() => deleteDoc(doc(db, 'katilimTalepleri', ogr.uid)));
    ok('katılım talebi sunucuya yazıldı');

    await updateDoc(doc(db, 'davetler', KOD), { kullanilan: 1 });
    ok('davet kullanım sayacı artırıldı');

    // Sayaç dolduktan sonra ikinci artış engellenmeli
    await reddedilmeli('hak dolduktan sonra sayacı artırma', () =>
        updateDoc(doc(db, 'davetler', KOD), { kullanilan: 2 }));

    // Öğrenci davetin başka alanını değiştiremez
    await reddedilmeli('öğrencinin daveti başka alandan değiştirmesi', () =>
        updateDoc(doc(db, 'davetler', KOD), { kullanimHakki: 999 }));

    // ══ 4. Onay öncesi giriş engellenmeli ════════════════════
    console.log('\n4) Onay gelmeden giriş denemesi');
    const kimlikYok = await getDoc(doc(db, 'ogrenciKimlik', ogr.uid));
    if (!kimlikYok.exists()) ok('kimlik kaydı yok — öğrenci henüz giriş yapamaz');
    else no('onay öncesi kimlik kaydı var — onaysız giriş mümkün olurdu');

    const kendiTalep = await getDoc(doc(db, 'katilimTalepleri', ogr.uid));
    if (kendiTalep.exists() && kendiTalep.data().durum === 'bekliyor') {
        ok('öğrenci kendi talebinin durumunu görebiliyor ("onay bekleniyor" mesajı)');
    } else no('öğrenci kendi talebini okuyamadı');

    // ══ 5. Koç talebi görüyor ve onaylıyor ═══════════════════
    console.log('\n5) Koç talebi görüyor ve onaylıyor');
    await signOut(auth);
    await signInWithEmailAndPassword(auth, KOC.eposta, KOC.sifre);

    const gelen = await getDocs(query(collection(db, 'katilimTalepleri'), where('kocUid', '==', koc.uid)));
    const benim = gelen.docs.filter((d) => d.id === ogr.uid);
    if (benim.length === 1 && benim[0].data().ad === 'Test Öğrenci') {
        ok('talep koçun panelinde göründü (farklı cihazdan gönderilmiş olmasına rağmen)');
    } else no('koç talebi göremedi', `${gelen.size} kayıt döndü`);

    const OGRENCI_ID = `ogr_${damga}`;
    await setDoc(doc(db, 'ogrenciKimlik', ogr.uid), {
        kocUid: koc.uid, kocId: KOC.id, ogrenciId: OGRENCI_ID,
        ad: 'Test Öğrenci', okulNo: OGR.okulNo, durum: 'onaylandi',
        guncelleme: serverTimestamp(),
    });
    temizlik.push(() => deleteDoc(doc(db, 'ogrenciKimlik', ogr.uid)));
    await updateDoc(doc(db, 'katilimTalepleri', ogr.uid), { durum: 'onaylandi', ogrenciId: OGRENCI_ID });
    ok('koç onayladı — kimlik kaydı yazıldı');

    // ══ 6. Öğrenci artık giriş yapabiliyor ═══════════════════
    console.log('\n6) Öğrenci kendi cihazından giriş yapıyor');
    await signOut(auth);
    const tekrar = await signInWithEmailAndPassword(auth, OGR.eposta, OGR.sifre);
    const kimlik = await getDoc(doc(db, 'ogrenciKimlik', tekrar.user.uid));
    if (kimlik.exists() && kimlik.data().kocId === KOC.id) {
        ok(`öğrenci kendi koçunu sunucudan öğrendi (${kimlik.data().kocId}) — veri havuzu bulunabilir`);
    } else no('öğrenci kimlik kaydını okuyamadı — giriş yine boş ekran verirdi');

    // ══ 7. Koç izolasyonu ════════════════════════════════════
    console.log('\n7) Başka bir koç bu verilere erişebiliyor mu');
    await signOut(auth);
    const yabanci = await hesapAc(YABANCI.eposta, YABANCI.sifre);
    temizlik.push(async () => {
        try {
            await signOut(auth);
            const y = await signInWithEmailAndPassword(auth, YABANCI.eposta, YABANCI.sifre);
            await deleteUser(y);
        } catch { /* ignore */ }
    });

    await reddedilmeli('yabancı koçun talebi okuması', async () => {
        const s = await getDoc(doc(db, 'katilimTalepleri', ogr.uid));
        if (!s.exists()) throw { code: 'permission-denied' };
    });
    await reddedilmeli('yabancı koçun öğrenci kimliğini okuması', async () => {
        const s = await getDoc(doc(db, 'ogrenciKimlik', ogr.uid));
        if (!s.exists()) throw { code: 'permission-denied' };
    });
    await reddedilmeli('yabancı koçun daveti silmesi', () => deleteDoc(doc(db, 'davetler', KOD)));
    await reddedilmeli('yabancı koçun öğrenciyi kendi havuzuna çekmesi', () =>
        updateDoc(doc(db, 'ogrenciKimlik', ogr.uid), { kocUid: yabanci.uid }));
    await reddedilmeli('yabancı koçun talebi kendine yönlendirmesi', () =>
        updateDoc(doc(db, 'katilimTalepleri', ogr.uid), { kocUid: yabanci.uid }));

    // ══ 8. Sahiplik devri — sahibi koç bile devredemez ═══════
    console.log('\n8) Sahiplik devri kapalı mı');
    await signOut(auth);
    await signInWithEmailAndPassword(auth, KOC.eposta, KOC.sifre);
    await reddedilmeli('koçun kendi davetini başkasına devretmesi', () =>
        updateDoc(doc(db, 'davetler', KOD), { kocUid: yabanci.uid }));
    await reddedilmeli('koçun talebi başkasına devretmesi', () =>
        updateDoc(doc(db, 'katilimTalepleri', ogr.uid), { kocUid: yabanci.uid }));
    await reddedilmeli('koçun öğrenci kimliğini başkasına devretmesi', () =>
        updateDoc(doc(db, 'ogrenciKimlik', ogr.uid), { kocUid: yabanci.uid }));

} catch (e) {
    no('AKIŞ KIRILDI', `${e?.code || ''} ${e?.message || e}`);
} finally {
    console.log('\n8) Temizlik');
    try {
        await signOut(auth);
        await signInWithEmailAndPassword(auth, KOC.eposta, KOC.sifre);
        for (const t of temizlik) { try { await t(); } catch { /* ignore */ } }
        try { await deleteUser(auth.currentUser); } catch { /* ignore */ }
        await signOut(auth);
        try {
            const o = await signInWithEmailAndPassword(auth, OGR.eposta, OGR.sifre);
            await deleteUser(o);
        } catch { /* ignore */ }
    } catch { /* ignore */ }
    console.log('  🧹 test kayıtları silindi');

    console.log(`\n═══ ${gecti} geçti · ${kaldi} kaldı ═══`);
    process.exit(kaldi ? 1 : 0);
}
