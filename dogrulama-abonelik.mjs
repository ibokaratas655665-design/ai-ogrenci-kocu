/** Abonelik/paket kurcalama testi. Koç kendi paketini değiştirebiliyor mu? */
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, deleteUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
const app=initializeApp({ apiKey:'AIzaSyA5aBsSGcf5_kZn-yAxC0ba---zcNMuWss', authDomain:'ai-ogrenci-kocu-b037b.firebaseapp.com', projectId:'ai-ogrenci-kocu-b037b', storageBucket:'ai-ogrenci-kocu-b037b.firebasestorage.app', messagingSenderId:'678490791897', appId:'1:678490791897:web:6534fd16ddf04f8b1e83c8' });
const auth=getAuth(app); const db=getFirestore(app);
const d=Date.now().toString(36);
const K={e:`abK${d}@kocu.app`,s:'AbonK123!',kocId:`coach_ab_${d}`};
let g=0,k=0; const ok=m=>{g++;console.log(`  ✅ ${m}`)}; const no=(m,x)=>{k++;console.log(`  ❌ ${m}${x?` — ${x}`:''}`)};
const yasak=async(m,f)=>{try{await f();no(`${m} — ENGELLENMEDİ`)}catch(e){e?.code==='permission-denied'?ok(`${m} — engellendi`):no(m,e?.code)}};
const izinli=async(m,f)=>{try{await f();ok(`${m} — izin verildi`)}catch(e){no(`${m} — ENGELLENDİ`,e?.code)}};
try{
  const koc=(await createUserWithEmailAndPassword(auth,K.e,K.s)).user;
  console.log('\n1) Koç profili');
  await izinli('koç profilini yazıyor', ()=>setDoc(doc(db,'kullaniciProfil',koc.uid),{rol:'coach',kocUid:koc.uid,kocId:K.kocId,ad:'Ab'}));
  await yasak('koç KENDİNİ YÖNETİCİ ilan ediyor', ()=>setDoc(doc(db,'kullaniciProfil',koc.uid),{rol:'admin',kocUid:koc.uid,kocId:K.kocId,ad:'Ab'}));

  console.log('\n2) Paket kurcalama');
  await yasak('koç kendine paket oluşturuyor', ()=>setDoc(doc(db,'abonelikler',koc.uid),{plan:'sinirsiz',ogrenciHakki:99999}));
  await yasak('koç başkasının paketini oluşturuyor', ()=>setDoc(doc(db,'abonelikler','baska_koc'),{plan:'sinirsiz'}));
  await yasak('koç paketini güncelliyor', ()=>updateDoc(doc(db,'abonelikler',koc.uid),{ogrenciHakki:99999}));
  await yasak('koç paketini siliyor', ()=>deleteDoc(doc(db,'abonelikler',koc.uid)));
  await izinli('koç kendi paketini OKUYABİLİYOR', async()=>{ await getDoc(doc(db,'abonelikler',koc.uid)); });
  await yasak('koç BAŞKASININ paketini okuyor', async()=>{ const s=await getDoc(doc(db,'abonelikler','baska_koc')); if(!s.exists()) throw {code:'permission-denied'}; });

  console.log('\n3) Temizlik');
  try{ await deleteDoc(doc(db,'kullaniciProfil',koc.uid)); }catch{}
  try{ await deleteUser(koc); ok('test hesabı silindi'); }catch(e){ no('hesap silinemedi',e.code); }
}catch(e){ no('AKIŞ KIRILDI',`${e?.code||''} ${e?.message||e}`); }
finally{ try{await signOut(auth)}catch{}; console.log(`\n═══ ${g} geçti · ${k} kaldı ═══`); process.exit(k?1:0); }
