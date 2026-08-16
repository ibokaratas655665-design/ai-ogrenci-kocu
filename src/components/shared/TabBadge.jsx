import React from 'react';

/**
 * 🔴 SEKME BİLDİRİM SAYACI
 *
 * Sekmenin üstünde duran yuvarlak sayaç. Üç panelde de aynı görünsün
 * diye tek bileşen; renk ve konum sekme çubuğundan bağımsızdır.
 *
 * `mutlak` seçeneği sayacı sekmenin sağ üst köşesine oturtur (kare
 * simge butonlarında kullanılır); varsayılan akış içinde durur.
 */
const TabBadge = ({ sayi = 0, mutlak = false, renk = 'var(--danger)' }) => {
    if (!sayi) return null;
    const metin = sayi > 99 ? '99+' : String(sayi);

    return (
        <span
            aria-label={`${sayi} yeni`}
            title={`${sayi} yeni`}
            className={
                mutlak
                    ? 'absolute -top-1.5 -right-1.5 z-10 flex items-center justify-center rounded-full px-1.5 pointer-events-none'
                    : 'ml-1 inline-flex items-center justify-center rounded-full px-1.5 shrink-0'
            }
            style={{
                background: renk,
                color: '#FFFFFF',
                minWidth: 18,
                height: 18,
                fontSize: 10,
                fontWeight: 900,
                lineHeight: 1,
                // Koyu zeminde de ayrışsın diye ince bir yüzey halkası
                boxShadow: '0 0 0 2px var(--surface)',
            }}
        >
            {metin}
        </span>
    );
};

export default TabBadge;
