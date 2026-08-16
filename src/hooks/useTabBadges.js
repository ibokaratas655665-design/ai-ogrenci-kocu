import { useState, useEffect, useCallback, useMemo } from 'react';
import rozet from '../services/tabBadgeService';

/**
 * 🔔 SEKME ROZETİ HOOK'U
 *
 * Üç panelde de aynı davranış: sekmede bekleyen iş varsa yuvarlak sayaç
 * görünür, sekmeye girilince kaybolur.
 *
 * Sayaçlar veriden hesaplandığı için tazelenmesi gerekir. Üç tetik var:
 *   · başka sekme/cihaz yazdığında  → `storage` olayı
 *   · uygulama içi yazımlar         → ilgili özel olaylar
 *   · sekme yeniden odaklandığında  → `focus`
 *
 * @param {'coach'|'student'|'parent'} rol
 * @param {object} user
 * @param {string} [bolum] koç panelinde aktif bölüm
 * @returns {{ rozetler: object, okundu: (tabId:string)=>void }}
 */
export const useTabBadges = (rol, user, bolum = 'kocluk') => {
    const [surum, setSurum] = useState(0);
    const tazele = useCallback(() => setSurum((v) => v + 1), []);

    useEffect(() => {
        const olaylar = [
            'storage', 'focus',
            'coach-tasks-updated', 'pdr-archive-updated',
            'notifications-updated', 'tab-badges-updated',
        ];
        olaylar.forEach((o) => window.addEventListener(o, tazele));

        // Bazı yazımlar olay yaymıyor; 45 sn'lik yedek tarama yeter,
        // daha sık olması gereksiz iş yaratır.
        const zaman = setInterval(tazele, 45000);

        return () => {
            olaylar.forEach((o) => window.removeEventListener(o, tazele));
            clearInterval(zaman);
        };
    }, [tazele]);

    const rozetler = useMemo(() => {
        try {
            return rozet.rozetler(rol, user, bolum);
        } catch {
            // Rozet hesabı çökerse panel çalışmaya devam etmeli
            return {};
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rol, user?.id, bolum, surum]);

    /**
     * Sekmeye girildi. Kullanıcı nesnesi ve bölüm de gönderilir:
     * servis o an bekleyen kayıtların KİMLİKLERİNİ hesaplayıp
     * "görüldü" olarak işaretler. Yalnızca zaman damgası saklansaydı,
     * tarihi olmayan kayıtlar rozeti hiç düşürmezdi.
     */
    const okundu = useCallback((tabId) => {
        if (!tabId) return;
        try { rozet.ziyaretIsaretle(rol, user?.id, tabId, user, bolum); } catch { /* ignore */ }
        tazele();
    }, [rol, user, bolum, tazele]);

    return { rozetler, okundu };
};

export default useTabBadges;
