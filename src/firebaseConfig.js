// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// Firebase config - ai-ogrenci-kocu project
const firebaseConfig = {
    apiKey: "AIzaSyA5aBsSGcf5_kZn-yAxC0ba---zcNMuWss",
    authDomain: "ai-ogrenci-kocu-b037b.firebaseapp.com",
    projectId: "ai-ogrenci-kocu-b037b",
    storageBucket: "ai-ogrenci-kocu-b037b.firebasestorage.app",
    messagingSenderId: "678490791897",
    appId: "1:678490791897:web:6534fd16ddf04f8b1e83c8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);

// 📱 Offline persistence (yeni API - Firebase v9+)
// persistentLocalCache: Veriler IndexedDB'de saklanır
// persistentMultipleTabManager: Birden fazla sekme açık olabilir
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
});

export default app;


