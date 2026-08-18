import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { writeFileSync } from 'fs';
const app = initializeApp({ apiKey:'AIzaSyA5aBsSGcf5_kZn-yAxC0ba---zcNMuWss', authDomain:'ai-ogrenci-kocu-b037b.firebaseapp.com', projectId:'ai-ogrenci-kocu-b037b', storageBucket:'ai-ogrenci-kocu-b037b.firebasestorage.app', messagingSenderId:'678490791897', appId:'1:678490791897:web:6534fd16ddf04f8b1e83c8' });
const auth=getAuth(app); const db=getFirestore(app);
const e=`yedek${Date.now().toString(36)}@kocu.app`, s='Yedek123!';
let u; try{ u=(await createUserWithEmailAndPassword(auth,e,s)).user; }catch{ u=(await signInWithEmailAndPassword(auth,e,s)).user; }
const snap=await getDocs(query(collection(db,'syncData'),where('bucketId','==','global')));
const veri=snap.docs.map(d=>({ belgeId:d.id, ...d.data(), updatedAt: d.data().updatedAt?.toDate?.()?.toISOString()||null }));
writeFileSync('yedek/global-belgeler.json', JSON.stringify(veri,null,2));
console.log(`${veri.length} belge yedeklendi -> yedek/global-belgeler.json`);
console.log('toplam bayt:', JSON.stringify(veri).length);
try{ await deleteUser(u); }catch{}
process.exit(0);
