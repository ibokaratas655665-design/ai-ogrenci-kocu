/**
 * 👆 DOKUNMATİK BÖLÜM GEÇİŞİ (canlı 04.09 eşlemesi)
 *
 * Telefonda içerik gövdesi üzerinde sola/sağa kaydırınca komşu bölüme
 * geçilir — alt sekme şeridindeki oklara uzanmak gerekmez.
 *
 * Eşikler: yatay yer değiştirme en az 60px olmalı ve dikey hareketin
 * 1.7 katını aşmalı; yoksa normal sayfa kaydırması yanlışlıkla bölüm
 * değiştirirdi.
 *
 * `el` bir ref değil ELEMANIN KENDİSİ (useState ile tutulan düğüm):
 * koşullu render'da ref.current değişimi effect'i tetiklemez, state
 * değişimi tetikler.
 */
import { useEffect, useRef } from 'react';

export function useDokunmaGecisi(el, bolumler, aktif, onDegis, etkin = true) {
    const guncel = useRef({ bolumler, aktif, onDegis });
    guncel.current = { bolumler, aktif, onDegis };

    useEffect(() => {
        if (!el || !etkin) return undefined;
        let basX = 0, basY = 0, izleniyor = false;

        const dokunmaBasladi = (e) => {
            if (e.touches.length === 1) {
                basX = e.touches[0].clientX;
                basY = e.touches[0].clientY;
                izleniyor = true;
            } else {
                izleniyor = false;
            }
        };

        const dokunmaBitti = (e) => {
            if (!izleniyor) return;
            izleniyor = false;
            const son = e.changedTouches[0];
            const dx = son.clientX - basX;
            const dy = son.clientY - basY;
            if (Math.abs(dx) < 60 || Math.abs(dx) < 1.7 * Math.abs(dy)) return;
            const { bolumler: b, aktif: a, onDegis: f } = guncel.current;
            if (!b?.length) return;
            const sira = b.findIndex((x) => x.id === a);
            const yeni = (sira < 0 ? 0 : sira) + (dx < 0 ? 1 : -1);
            if (yeni >= 0 && yeni < b.length) f?.(b[yeni].id);
        };

        el.addEventListener('touchstart', dokunmaBasladi, { passive: true });
        el.addEventListener('touchend', dokunmaBitti, { passive: true });
        return () => {
            el.removeEventListener('touchstart', dokunmaBasladi);
            el.removeEventListener('touchend', dokunmaBitti);
        };
    }, [el, etkin]);
}

export default useDokunmaGecisi;
