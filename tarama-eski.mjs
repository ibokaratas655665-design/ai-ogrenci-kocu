import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
const app = initializeApp({ apiKey:'AIzaSyA5aBsSGcf5_kZn-yAxC0ba---zcNMuWss', authDomain:'ai-ogrenci-kocu-b037b.firebaseapp.com', projectId:'ai-ogrenci-kocu-b037b', storageBucket:'ai-ogrenci-kocu-b037b.firebasestorage.app', messagingSenderId:'678490791897', appId:'1:678490791897:web:6534fd16ddf04f8b1e83c8' });
const auth = getAuth(app); const db = getFirestore(app);
const e = `tarama${Date.now().toString(36)}@kocu.app`, s = 'Tarama123!';
let u; try { u = (await createUserWithEmailAndPassword(auth, e, s)).user; }
catch { u = (await signInWithEmailAndPassword(auth, e, s)).user; }

const snap = await getDocs(query(collection(db,'syncData'), where('bucketId','==','global')));
console.log(`\nESKİ 'global' HAVUZUNDA ${snap.size} BELGE\n`);
let toplam = 0;
const satirlar = [];
snap.forEach(d => {
  const v = d.data();
  const boy = (v.value || '').length;
  toplam += boy;
  let adet = '?';
  try { const p = JSON.parse(v.value); adet = Array.isArray(p) ? `${p.length} kayıt` : (p && typeof p === 'object' ? `${Object.keys(p).length} alan` : '—'); } catch { adet = 'sıkıştırılmış'; }
  satirlar.push({ anahtar: v.key || d.id, boyut: boy, icerik: adet, tarih: v.updatedAt?.toDate?.()?.toISOString?.()?.slice(0,10) || '—' });
});
satirlar.sort((a,b)=>b.boyut-a.boyut).forEach(r =>
  console.log(`  ${String(r.anahtar).padEnd(28)} ${String(r.boyut).padStart(8)} bayt  ${String(r.icerik).padEnd(14)} ${r.tarih}`));
console.log(`\n  TOPLAM: ${(toplam/1024).toFixed(1)} KB`);
try { await deleteUser(u); } catch {}
process.exit(0);
