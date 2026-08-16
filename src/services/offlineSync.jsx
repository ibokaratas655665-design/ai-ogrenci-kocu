/**
 * 📡 OFFLINE MOD SERVİSİ (Madde 12)
 * IndexedDB tabanlı offline-first veri katmanı + Service Worker yönetimi
 */

const DB_NAME = 'ai_coach_offline';
const DB_VERSION = 2;
const STORES = ['syncQueue', 'offlineCache', 'pendingActions'];

// ─── IndexedDB Yöneticisi ────────────────────────────────────────
class IndexedDBManager {
    constructor() {
        this.db = null;
        this.ready = false;
        this._initPromise = this._init();
    }

    async _init() {
        return new Promise((resolve, reject) => {
            if (typeof indexedDB === 'undefined') { resolve(null); return; }
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                STORES.forEach(store => {
                    if (!db.objectStoreNames.contains(store)) {
                        const s = db.createObjectStore(store, { keyPath: 'key' });
                        s.createIndex('timestamp', 'timestamp');
                    }
                });
            };
            req.onsuccess = (e) => { this.db = e.target.result; this.ready = true; resolve(this.db); };
            req.onerror = () => resolve(null);
        });
    }

    async waitReady() {
        await this._initPromise;
        return this.ready;
    }

    async get(store, key) {
        if (!await this.waitReady() || !this.db) return null;
        return new Promise((resolve) => {
            const tx = this.db.transaction([store], 'readonly');
            const req = tx.objectStore(store).get(key);
            req.onsuccess = () => resolve(req.result?.value ?? null);
            req.onerror = () => resolve(null);
        });
    }

    async set(store, key, value) {
        if (!await this.waitReady() || !this.db) return;
        return new Promise((resolve) => {
            const tx = this.db.transaction([store], 'readwrite');
            tx.objectStore(store).put({ key, value, timestamp: Date.now() });
            tx.oncomplete = resolve;
            tx.onerror = resolve;
        });
    }

    async delete(store, key) {
        if (!await this.waitReady() || !this.db) return;
        return new Promise((resolve) => {
            const tx = this.db.transaction([store], 'readwrite');
            tx.objectStore(store).delete(key);
            tx.oncomplete = resolve;
            tx.onerror = resolve;
        });
    }

    async getAll(store) {
        if (!await this.waitReady() || !this.db) return [];
        return new Promise((resolve) => {
            const tx = this.db.transaction([store], 'readonly');
            const req = tx.objectStore(store).getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => resolve([]);
        });
    }

    async clear(store) {
        if (!await this.waitReady() || !this.db) return;
        return new Promise((resolve) => {
            const tx = this.db.transaction([store], 'readwrite');
            tx.objectStore(store).clear();
            tx.oncomplete = resolve;
            tx.onerror = resolve;
        });
    }
}

// ─── Offline Sync Yöneticisi ─────────────────────────────────────
class OfflineSyncManager {
    constructor() {
        this.idb = new IndexedDBManager();
        this.isOnline = navigator.onLine;
        this.listeners = new Set();
        this._setupNetworkListeners();
        this._setupBeforeUnload();
    }

    _setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🌐 Çevrimiçi — bekleyen değişiklikler senkronize ediliyor...');
            this._notifyListeners('online');
            this._processPendingQueue();
        });
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('📴 Çevrimdışı — offline mod aktif');
            this._notifyListeners('offline');
        });
    }

    _setupBeforeUnload() {
        window.addEventListener('beforeunload', () => {
            if (this.isOnline) this._processPendingQueue();
        });
    }

    _notifyListeners(event) {
        this.listeners.forEach(cb => { try { cb(event); } catch { } });
    }

    onNetworkChange(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    // ─── Veri Okuma (Offline-First) ─────────────────────
    async getItem(key) {
        // 1. Önce IndexedDB'yi dene (offline cache)
        const cached = await this.idb.get('offlineCache', key);
        if (cached !== null) return cached;
        // 2. localStorage fallback
        try { return localStorage.getItem(key); } catch { return null; }
    }

    // ─── Veri Yazma (Offline kuyrukla) ──────────────────
    async setItem(key, value) {
        // localStorage'a yaz (hız için)
        try { localStorage.setItem(key, value); } catch { }
        // IndexedDB'ye de yaz
        await this.idb.set('offlineCache', key, value);

        if (this.isOnline) {
            // Çevrimiçiyse Firebase'e de yaz
            try {
                const firebaseSync = window.firebaseSync;
                if (firebaseSync?.syncKey) await firebaseSync.syncKey(key);
            } catch { }
        } else {
            // Çevrimdışıysa kuyruğa ekle
            await this._addToQueue(key, value);
        }
    }

    async _addToQueue(key, value) {
        const queue = await this.idb.getAll('syncQueue');
        const existing = queue.find(q => q.key === key);
        if (existing) {
            existing.value = value;
            existing.timestamp = Date.now();
            await this.idb.set('syncQueue', key, value);
        } else {
            await this.idb.set('syncQueue', key, value);
        }
    }

    async _processPendingQueue() {
        const queue = await this.idb.getAll('syncQueue');
        if (queue.length === 0) return;
        console.log(`📤 ${queue.length} değişiklik senkronize ediliyor...`);

        for (const item of queue) {
            try {
                const firebaseSync = window.firebaseSync;
                if (firebaseSync?.syncKey) {
                    // localStorage'da güncel mi kontrol et
                    const localVal = localStorage.getItem(item.key);
                    if (localVal !== null) await firebaseSync.syncKey(item.key);
                }
                await this.idb.delete('syncQueue', item.key);
            } catch (e) {
                console.warn(`Sync hatası (${item.key}):`, e.message);
            }
        }
        console.log('✅ Bekleyen değişiklikler senkronize edildi!');
    }

    // ─── Önbellekleme ────────────────────────────────────
    async cacheForOffline(keys = []) {
        const critical = keys.length > 0 ? keys : [
            'coach_students', 'student_tasks', 'v2_results_data', 'v2_trials_data',
            'student_messages', 'student_programs', 'app_settings'
        ];
        for (const key of critical) {
            const val = localStorage.getItem(key);
            if (val) await this.idb.set('offlineCache', key, val);
        }
    }

    // ─── Durum Sorgulama ─────────────────────────────────
    async getPendingCount() {
        const queue = await this.idb.getAll('syncQueue');
        return queue.length;
    }

    async getCacheSize() {
        const cache = await this.idb.getAll('offlineCache');
        const totalChars = cache.reduce((s, i) => s + (typeof i.value === 'string' ? i.value.length : 0), 0);
        return (totalChars / 1024).toFixed(1); // KB
    }

    async clearOfflineCache() {
        await this.idb.clear('offlineCache');
        await this.idb.clear('syncQueue');
    }
}

// ─── Çevrimdışı Durum Banner Bileşeni (React) ────────────────────
import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, CloudOff, Upload, CheckCircle } from 'lucide-react';

export const OfflineBanner = ({ offlineManager }) => {
    const [online, setOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(0);
    const [syncing, setSyncing] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        if (!offlineManager) return;
        const unsub = offlineManager.onNetworkChange(async (status) => {
            setOnline(status === 'online');
            const count = await offlineManager.getPendingCount();
            setPendingCount(count);
        });
        // İlk yükleme
        offlineManager.getPendingCount().then(setPendingCount);
        return unsub;
    }, [offlineManager]);

    const manualSync = async () => {
        if (!offlineManager || !online) return;
        setSyncing(true);
        await offlineManager._processPendingQueue();
        const count = await offlineManager.getPendingCount();
        setPendingCount(count);
        setSyncing(false);
    };

    if (online && pendingCount === 0) return null; // Sorun yok, banner gösterme

    return (
        <div className={`fixed bottom-4 left-4 right-4 z-toast max-w-md mx-auto rounded-2xl shadow-2xl border overflow-hidden animate-slide-in-up ${
            !online ? 'bg-danger-soft border-danger' : 'bg-warn-soft border-warn'
        }`}>
            <div className="flex items-center gap-3 p-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${!online ? 'bg-danger-soft' : 'bg-warn-soft'}`}>
                    {!online ? <WifiOff size={18} className="text-danger" /> : <Upload size={18} className="text-warn" />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`font-black text-sm ${!online ? 'text-danger' : 'text-warn'}`}>
                        {!online ? '📴 Çevrimdışı Mod' : `⏳ ${pendingCount} değişiklik bekliyor`}
                    </p>
                    <p className={`text-xs mt-0.5 ${!online ? 'text-danger' : 'text-warn'}`}>
                        {!online
                            ? 'Değişiklikleriniz kaydedildi. Bağlantı gelince senkronize edilecek.'
                            : 'İnternet bağlantısı var. Bekleyen değişiklikler senkronize ediliyor...'}
                    </p>
                </div>
                {online && pendingCount > 0 && (
                    <button
                        onClick={manualSync}
                        disabled={syncing}
                        className="flex items-center gap-1.5 px-3 py-2 bg-amber-200 hover:bg-amber-300 text-warn rounded-xl text-xs font-bold transition flex-shrink-0"
                    >
                        {syncing ? <RefreshCw size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                        Senkronize Et
                    </button>
                )}
            </div>
        </div>
    );
};

// ─── Offline Hook ─────────────────────────────────────────────────
export const useOfflineStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingChanges, setPendingChanges] = useState(0);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Sync queue kontrolü
        const checkQueue = async () => {
            if (window.offlineManager) {
                const count = await window.offlineManager.getPendingCount();
                setPendingChanges(count);
            }
        };
        checkQueue();
        const interval = setInterval(checkQueue, 10000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    return { isOnline, pendingChanges };
};

// ─── Singleton Oluştur & Export ───────────────────────────────────
const offlineManager = new OfflineSyncManager();
if (typeof window !== 'undefined') {
    window.offlineManager = offlineManager;
    // Uygulama başladığında kritik verileri önbellekle
    offlineManager.cacheForOffline();
}

export { offlineManager };
export default offlineManager;
