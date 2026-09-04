/**
 * ☁️ SENKRON DURUMU ROZETİ — "kaydettim mi?" sorusunun görünür cevabı
 *
 * firebaseSync 'senkron-durum' olayı yayar ({durum, bekleyen}); bu rozet
 * onu dinler. Kaydediliyor → dönen ok; kaydedildi → 2,5 sn ✓ görünüp
 * kaybolur; bekliyor → kuyruk sayısıyla dönen ok; hata → "Bağlantı
 * sorunu". Boşta hiçbir şey çizilmez — rozet yalnız söyleyecek bir şey
 * varken görünür.
 */
import React, { useEffect, useState } from 'react';
import { RefreshCw, Check, CloudOff } from 'lucide-react';

const durumOku = () => {
    try {
        return window.firebaseSync?.senkronDurumu?.() || { durum: 'bosta', bekleyen: 0 };
    } catch {
        return { durum: 'bosta', bekleyen: 0 };
    }
};

export default function SenkronDurumu({ className = '' }) {
    const [{ durum, bekleyen }, setDurum] = useState(durumOku);
    const [gorunur, setGorunur] = useState(false);

    useEffect(() => {
        const dinle = (e) => setDurum(e?.detail || durumOku());
        window.addEventListener('senkron-durum', dinle);
        return () => window.removeEventListener('senkron-durum', dinle);
    }, []);

    useEffect(() => {
        if (durum && durum !== 'bosta') {
            setGorunur(true);
            if (durum === 'kaydedildi') {
                const zaman = setTimeout(() => setGorunur(false), 2500);
                return () => clearTimeout(zaman);
            }
        } else {
            setGorunur(false);
        }
        return undefined;
    }, [durum, bekleyen]);

    if (!gorunur) return null;

    const gorunum = {
        kaydediliyor: { ikon: <RefreshCw size={13} className="animate-spin" />, metin: 'Kaydediliyor…', renk: 'text-ink-3' },
        kaydedildi: { ikon: <Check size={13} />, metin: 'Kaydedildi', renk: 'text-ok' },
        bekliyor: { ikon: <RefreshCw size={13} className="animate-spin" />, metin: bekleyen > 1 ? `Bekliyor (${bekleyen})` : 'Bekliyor', renk: 'text-ink-2' },
        hata: { ikon: <CloudOff size={13} />, metin: 'Bağlantı sorunu', renk: 'text-danger' },
    }[durum];
    if (!gorunum) return null;

    return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${gorunum.renk} ${className}`}
            title="Bulut senkron durumu" aria-live="polite">
            {gorunum.ikon}
            <span className="hidden sm:inline">{gorunum.metin}</span>
        </span>
    );
}
