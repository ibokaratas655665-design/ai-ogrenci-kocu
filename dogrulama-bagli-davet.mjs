/** Bağlı davet (elle eklenen öğrenciye giriş açma) güvenlik testi. */
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, deleteUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
const cfg = { apiKey:'AIzaSyA5aBsSGcf5_kZn-yAxC0ba---zcNMuWss', authDomain:'ai-ogrenci-kocu-b037b.firebaseapp.com', projectId:'ai-ogrenci-kocu-b037b', storageBucket:'ai-ogrenci-kocu-b037b.firebasestorage.app', messagingSenderId:'678490791897', appId:'1:678490791897:web:6534fd16ddf04f8b1e83c8' };
const app = initializeApp(cfg); const auth = getAuth(app); const db = getFirestore(app);
const d = Date.now().toString(36);
const K = { e:`bdK${d}@kocu.app`, s:'BagliK123!', kocId:`coach_bd_${d}` };
const O = { e:`bdO${d}@ogrenci.app`, s:'BagliO123!' };
let g=0,k=0; const ok=m=>{g++;console.log(`  ✅ ${m}`)}; const no=(m,x)=>{k++;console.log(`  ❌ ${m}${x?` — ${x}`:''}`)};
const yasak = async (m,f)=>{ try{ await f(); no(`${m} — ENGELLENMEDİ`);}catch(e){ e?.code==='permission-denied'?ok(`${m} — engellendi`):no(m,e?.code)} };
const izinli = async (m,f)=>{ try{ await f(); ok(`${m} — izin verildi`);}catch(e){ no(`${m} — ENGELLENDİ`, e?.code)} };
const gir = async(e,s)=>{ await signOut(auth); const u=(await signInWithEmailAndPassword(auth,e,s)).user; await u.getIdToken(true); return u; };
const sil=[];
try{
  const koc = (await createUserWithEmailAndPassword(auth,K.e,K.s)).user;
  await setDoc(doc(db,'kullaniciProfil',koc.uid),{rol:'coach',kocUid:koc.uid,kocId:K.kocId,ad:'BD'});
  await setDoc(doc(db,'kocDizin',K.kocId),{kocUid:koc.uid});
  sil.push(['koc',()=>deleteDoc(doc(db,'kullaniciProfil',koc.uid))]);
  sil.push(['koc',()=>deleteDoc(doc(db,'kocDizin',K.kocId))]);
  const son=new Date(); son.setDate(son.getDate()+14);

  console.log('\n1) Koç, mevcut öğrenciye BAĞLI davet üretiyor');
  const KOD=`B${d.slice(-5).toUpperCase()}`.slice(0,6);
  await setDoc(doc(db,'davetler',KOD),{ kocUid:koc.uid, kocId:K.kocId, kocAd:'BD', sinif:'11', not:'', kullanimHakki:1, kullanilan:0, aktif:true, sonZaman:Timestamp.fromDate(son), olusturma:serverTimestamp(), ogrenciId:'mevcut_ogrenci_777', ogrenciAd:'Mevcut Öğrenci' });
  sil.push(['koc',()=>deleteDoc(doc(db,'davetler',KOD))]);
  ok(`bağlı davet üretildi (${KOD} → mevcut_ogrenci_777)`);

  const SERBEST=`S${d.slice(-5).toUpperCase()}`.slice(0,6);
  await setDoc(doc(db,'davetler',SERBEST),{ kocUid:koc.uid, kocId:K.kocId, kocAd:'BD', sinif:'', not:'', kullanimHakki:1, kullanilan:0, aktif:true, sonZaman:Timestamp.fromDate(son), olusturma:serverTimestamp() });
  sil.push(['koc',()=>deleteDoc(doc(db,'davetler',SERBEST))]);
  ok(`serbest davet üretildi (${SERBEST})`);

  console.log('\n2) Öğrenci saldırıları');
  const ogr = (await createUserWithEmailAndPassword(auth,O.e,O.s)).user;
  await yasak('SERBEST davetle katılırken kendini mevcut bir kayda bağlama', ()=>
    setDoc(doc(db,'katilimTalepleri',ogr.uid),{ kod:SERBEST, kocUid:koc.uid, kocId:K.kocId, kocAd:'BD', ad:'Saldırgan', okulNo:'x1', durum:'bekliyor', olusturma:serverTimestamp(), ogrenciId:'mevcut_ogrenci_777' }));
  await yasak('BAĞLI davetle katılırken BAŞKA bir kayda bağlanma', ()=>
    setDoc(doc(db,'katilimTalepleri',ogr.uid),{ kod:KOD, kocUid:koc.uid, kocId:K.kocId, kocAd:'BD', ad:'Saldırgan', okulNo:'x2', durum:'bekliyor', olusturma:serverTimestamp(), ogrenciId:'baska_ogrenci_999' }));
  await yasak('BAĞLI davetle katılırken bağlantıyı hiç bildirmeme', ()=>
    setDoc(doc(db,'katilimTalepleri',ogr.uid),{ kod:KOD, kocUid:koc.uid, kocId:K.kocId, kocAd:'BD', ad:'Saldırgan', okulNo:'x3', durum:'bekliyor', olusturma:serverTimestamp() }));

  console.log('\n3) Doğru kullanım');
  await izinli('BAĞLI davetle doğru kayda katılım', ()=>
    setDoc(doc(db,'katilimTalepleri',ogr.uid),{ kod:KOD, kocUid:koc.uid, kocId:K.kocId, kocAd:'BD', ad:'Mevcut Öğrenci', okulNo:'bd77', durum:'bekliyor', olusturma:serverTimestamp(), ogrenciId:'mevcut_ogrenci_777' }));
  sil.push(['ogr',()=>deleteDoc(doc(db,'katilimTalepleri',ogr.uid))]);

  console.log('\n4) Koç onayı mevcut kayda bağlanıyor');
  await gir(K.e,K.s);
  await izinli('Koç, kimliği MEVCUT öğrenci kaydına bağlıyor', ()=>
    setDoc(doc(db,'ogrenciKimlik',ogr.uid),{ kocUid:koc.uid, kocId:K.kocId, ogrenciId:'mevcut_ogrenci_777', ad:'Mevcut Öğrenci', okulNo:'bd77', durum:'onaylandi', guncelleme:serverTimestamp() }));
  sil.push(['koc',()=>deleteDoc(doc(db,'ogrenciKimlik',ogr.uid))]);
}catch(e){ no('AKIŞ KIRILDI', `${e?.code||''} ${e?.message||e}`); }
finally{
  try{ await gir(K.e,K.s); for(const [w,f] of sil){ if(w==='koc'){ try{await f()}catch{} } } await deleteUser(auth.currentUser);}catch{}
  try{ await gir(O.e,O.s); for(const [w,f] of sil){ if(w==='ogr'){ try{await f()}catch{} } } await deleteUser(auth.currentUser);}catch{}
  console.log(`\n═══ ${g} geçti · ${k} kaldı ═══`); process.exit(k?1:0);
}
