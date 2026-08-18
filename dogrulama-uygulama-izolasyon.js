/**
 * KOÇ İZOLASYONU — UYGULAMA KATMANI doğrulaması.
 *
 * `dogrulama-izolasyon.mjs` Firestore KURALLARINI kanıtlar (arayüzü hiç
 * kullanmaz). Bu betik onun eksik bıraktığı yeri kapatır: uygulamanın
 * KENDİ kodu — havuz seçimi (`firebaseSync.havuzKimligi`), sahiplik
 * filtresi (`accessControl`) ve oturum değişiminde senkron davranışı —
 * gerçekten izole mi?
 *
 * ⚠️ Node'da ÇALIŞMAZ: `firebaseSync` localStorage'a ve tarayıcı
 * ortamına bağlı. Çalıştırma yolu:
 *
 *   1. `npm run dev`
 *   2. Uygulamayı tarayıcıda aç (giriş yapmana gerek yok)
 *   3. Konsolu aç, bu dosyanın içeriğini yapıştır
 *
 * İki gerçek Firebase hesabı açar, veri yazar, karşı koçla okumayı dener
 * ve sonunda hesapları + belgeleri siler. Test verisi bırakmaz.
 *
 * Vite'ın `?v=` sürüm damgası önemli: damgasız import AYRI bir modül
 * örneği yaratıyor ve `doc(db, …)` "Expected first argument…" hatası
 * veriyor. Damgayı ağ sekmesindeki `firebase_firestore.js?v=…` adresinden
 * al ve aşağıdaki VITE_DAMGA değerini güncelle.
 */
const VITE_DAMGA = '0c7cc874';

(async () => {
    const gecti = [], kaldi = [];
    const ok = (m) => { gecti.push(m); console.log(`  ✅ ${m}`); };
    const no = (m, x) => { kaldi.push(m); console.log(`  ❌ ${m}${x ? ` — ${x}` : ''}`); };
    const esit = (ad, bulunan, beklenen) =>
        (JSON.stringify(bulunan) === JSON.stringify(beklenen))
            ? ok(`${ad} → ${JSON.stringify(bulunan)}`)
            : no(ad, `bulunan ${JSON.stringify(bulunan)}, beklenen ${JSON.stringify(beklenen)}`);

    const F = await import(`/node_modules/.vite/deps/firebase_firestore.js?v=${VITE_DAMGA}`);
    const A_ = await import(`/node_modules/.vite/deps/firebase_auth.js?v=${VITE_DAMGA}`);
    const { db, auth } = await import('/src/firebaseConfig.js');
    const { havuzKimligi } = await import('/src/services/firebaseSync.js');
    const fs = (await import('/src/services/firebaseSync.js')).default;
    const AC = await import('/src/services/accessControl.js');
    const kk = await import('/src/services/kimlikKopru.js');

    const d = Date.now().toString(36);
    const A = { eposta: `uygA${d}@kocu.app`, sifre: 'UygTestA123!', id: `coach_A_${d}`, role: 'coach', name: 'Koç A' };
    const B = { eposta: `uygB${d}@kocu.app`, sifre: 'UygTestB123!', id: `coach_B_${d}`, role: 'coach', name: 'Koç B' };

    const hesap = async (e, s) => {
        try { return (await A_.createUserWithEmailAndPassword(auth, e, s)).user; }
        catch (x) {
            if (x.code === 'auth/email-already-in-use') return (await A_.signInWithEmailAndPassword(auth, e, s)).user;
            throw x;
        }
    };
    const yasak = async (ad, islem) => {
        try { await islem(); no(`${ad} — ENGELLENMEDİ (VERİ SIZINTISI)`); }
        catch (e) {
            if (e?.code === 'permission-denied') ok(`${ad} — engellendi`);
            else no(`${ad} — beklenmedik hata`, e?.code || e?.message);
        }
    };
    const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
    /** Oturumu uygulamanın kurduğu gibi kurar ve senkronu yeniden başlatır. */
    const oturumAc = async (K) => {
        localStorage.setItem('user_session', JSON.stringify(K));
        fs.isInitialized = false;
        await fs.init(K);
        await bekle(3000);
    };
    const oturumKapat = async () => {
        try { await fs.clearLocalData?.(); } catch { /* yoksa sorun değil */ }
        try { await A_.signOut(auth); } catch { /* zaten kapalı */ }
        ['user_session', 'coach_students'].forEach((k) => localStorage.removeItem(k));
        await bekle(800);
    };

    try {
        // ══ 1. HAVUZ SEÇİMİ — saf mantık ═══════════════════════════
        console.log('\n1) Havuz seçimi (firebaseSync.havuzKimligi)');
        esit('Koç A havuzu', havuzKimligi(A), `koc_${A.id}`);
        esit('Koç B havuzu', havuzKimligi(B), `koc_${B.id}`);
        esit('Öğrenci koçunun havuzunda',
            havuzKimligi({ id: 's1', role: 'student', coachId: A.id }), `koc_${A.id}`);
        esit('Koçu olmayan öğrenci havuzsuz (senkron kapalı)',
            havuzKimligi({ id: 's9', role: 'student' }), null);
        esit('Kimliksiz çağrı havuzsuz', havuzKimligi(null), null);

        // ══ 2. ARAYÜZ FİLTRESİ — accessControl ═════════════════════
        console.log('\n2) Sahiplik filtresi (accessControl)');
        const liste = [
            { id: 'ogrA1', name: 'A-1', ownerCoachId: A.id },
            { id: 'ogrB1', name: 'B-1', ownerCoachId: B.id },
            { id: 'ogrX', name: 'sahipsiz' },
        ];
        esit('Koç A listesi', AC.filtrele(A, liste).map((x) => x.name), ['A-1']);
        esit('Koç B listesi', AC.filtrele(B, liste).map((x) => x.name), ['B-1']);
        esit('Koç A, B\'nin kaydını göremez', AC.gorebilir(A, liste[1]), false);
        esit('Koç A, B\'nin kaydını düzenleyemez', AC.duzenleyebilir(A, liste[1]), false);
        esit('Sahipsiz kayıt normal koça kapalı', AC.gorebilir(A, liste[2]), false);

        // ══ 3. GERÇEK OTURUM — koç A veri yazıyor ══════════════════
        console.log('\n3) Koç A gerçek oturumda veri yazıyor');
        const uA = await hesap(A.eposta, A.sifre); A.uid = uA.uid;
        await kk.kocKimligiYaz(A, uA.uid);
        localStorage.setItem('coach_students', JSON.stringify([liste[0]]));
        await oturumAc(A);
        esit('Oturum havuzu', fs.havuz, `koc_${A.id}`);
        esit('Sahiplik damgası Firebase kimliğine bağlandı', fs.sahipUid, uA.uid);
        await fs.syncKey?.('coach_students');
        await bekle(2500);
        const AbelgeId = `koc_${A.id}__coach_students`;
        const snapA = await F.getDoc(F.doc(db, 'syncData', AbelgeId));
        snapA.exists() && snapA.data().sahipUid === uA.uid
            ? ok('Veri buluta doğru havuz + damga ile yazıldı')
            : no('Veri buluta yazılmadı ya da damgasız');

        // ══ 4. KOÇ B — sızıntı var mı ══════════════════════════════
        console.log('\n4) Koç B oturumu — A\'nın verisi sızıyor mu');
        await oturumKapat();
        const uB = await hesap(B.eposta, B.sifre); B.uid = uB.uid;
        await kk.kocKimligiYaz(B, uB.uid);
        await oturumAc(B);
        esit('Koç B ayrı havuzda', fs.havuz, `koc_${B.id}`);
        localStorage.getItem('coach_students') === null
            ? ok('Koç B\'nin cihazına A\'nın öğrencisi İNMEDİ')
            : no('Koç B\'nin cihazında veri var', localStorage.getItem('coach_students'));

        await yasak('Koç B, A\'nın belgesini okuyor', async () => {
            const s = await F.getDoc(F.doc(db, 'syncData', AbelgeId));
            if (!s.exists()) throw { code: 'permission-denied' };
        });
        await yasak('Koç B, A\'nın havuzunu sorguluyor', async () => {
            const q = await F.getDocs(F.query(F.collection(db, 'syncData'),
                F.where('bucketId', '==', `koc_${A.id}`)));
            if (q.empty) throw { code: 'permission-denied' };
        });
        await yasak('Koç B, A\'nın belgesini siliyor',
            () => F.deleteDoc(F.doc(db, 'syncData', AbelgeId)));
        await yasak('Koç B, A\'nın belgesini kendine sahipleniyor',
            () => F.updateDoc(F.doc(db, 'syncData', AbelgeId), { sahipUid: B.uid }));

        // ══ 5. REGRESYON — normal akış bozulmadı mı ════════════════
        console.log('\n5) Regresyon');
        localStorage.setItem('coach_students', JSON.stringify([liste[1]]));
        await fs.syncKey?.('coach_students');
        await bekle(2000);
        (await F.getDoc(F.doc(db, 'syncData', `koc_${B.id}__coach_students`))).exists()
            ? ok('Koç B kendi verisini yazabiliyor')
            : no('Koç B kendi verisini yazamadı');

        await oturumKapat();
        await A_.signInWithEmailAndPassword(auth, A.eposta, A.sifre);
        await oturumAc(A);
        const geri = JSON.parse(localStorage.getItem('coach_students') || 'null');
        esit('Koç A kendi verisini geri alıyor', geri?.map((x) => x.name), ['A-1']);
        geri?.some((x) => x.ownerCoachId === B.id)
            ? no('Koç A\'ya B\'nin öğrencisi sızdı')
            : ok('Koç A\'ya B\'nin öğrencisi sızmadı');

    } catch (e) {
        no('AKIŞ KIRILDI', `${e?.code || ''} ${e?.message || e}`);
    } finally {
        console.log('\n6) Temizlik');
        for (const K of [A, B]) {
            try {
                await A_.signInWithEmailAndPassword(auth, K.eposta, K.sifre);
                for (const yol of [['syncData', `koc_${K.id}__coach_students`],
                    ['kocDizin', K.id], ['kullaniciProfil', K.uid]]) {
                    try { await F.deleteDoc(F.doc(db, ...yol)); } catch { /* yoksa geç */ }
                }
                await A_.deleteUser(auth.currentUser);
            } catch { /* hesap zaten yoksa geç */ }
        }
        await oturumKapat();
        console.log('  🧹 test hesapları ve belgeleri silindi');
        console.log(`\n═══ ${gecti.length} geçti · ${kaldi.length} kaldı ═══`);
        if (kaldi.length) console.log('Kalanlar:\n  - ' + kaldi.join('\n  - '));
    }
})();
