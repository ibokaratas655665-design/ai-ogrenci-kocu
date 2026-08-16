import { useEffect } from 'react';

/**
 * 🪟 GLOBAL PENCERE KAPATMA
 *
 * Uygulamadaki modalların büyük kısmı yalnızca kendi "X" butonuyla
 * kapanıyordu: ESC çalışmıyor, perdeye tıklamak bir şey yapmıyordu.
 * Bir modal içinde ikinci bir modal açıldığında ya da kapatma butonu
 * ekran dışında kaldığında pencere kilitleniyordu ("kapatılamayan sekmeler").
 *
 * Bu hook tek bir yerden çözer: ESC'ye basıldığında veya perdenin
 * boşluğuna tıklandığında EN ÜSTTEKİ açık modalı bulur ve o modalın
 * kendi kapatma butonunu tetikler. Böylece her modalin kendi kapanma
 * mantığı (state temizliği, kaydetme uyarısı vb.) korunur.
 *
 * Kapanmaması gereken perdeler `data-no-dismiss` ile işaretlenir.
 */

const LAYER_MIN = 900; // katman merdiveninde modal seviyesi (tailwind.config.js)

/** Ekrandaki görünür modal perdelerini z-index'e göre sıralı döndürür. */
const openOverlays = () => {
    const all = Array.from(document.querySelectorAll('.fixed.inset-0'));
    return all
        .filter((el) => {
            if (el.hasAttribute('data-no-dismiss')) return false;
            const cs = getComputedStyle(el);
            // Sadece dekoratif/geçirgen katmanlar modal değildir
            if (cs.pointerEvents === 'none' || cs.display === 'none' || cs.visibility === 'hidden') return false;
            const z = parseInt(cs.zIndex, 10);
            return Number.isFinite(z) && z >= LAYER_MIN;
        })
        .sort((a, b) => parseInt(getComputedStyle(b).zIndex, 10) - parseInt(getComputedStyle(a).zIndex, 10));
};

/**
 * Modalin kendi kapatma butonunu bulur.
 *
 * Uygulamada kapatma butonu tek biçimde değil: kimi yerde lucide <X>,
 * kimi yerde düz "X" harfi, kimi yerde ters çevrilmiş bir ok, kimi yerde
 * yalnızca "İptal"/"Vazgeç" yazan bir buton var. Bu yüzden sırayla
 * birkaç strateji denenir; hiçbiri tutmazsa modal kapatılmaz (yanlış
 * butona basmaktansa hiç basmamak doğrudur).
 */
/**
 * Türkçe büyük "İ" küçültüldüğünde i + birleşen nokta (U+0307) üretir;
 * bu yüzden /iptal/i kalıbı "İptal" ile EŞLEŞMEZ. Metin karşılaştırmadan
 * önce birleşen işaretlerden arındırılır.
 */
const sadeMetin = (s) => String(s || '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const CLOSE_TEXT = /^(kapat|iptal|vazgec|geri|×|✕|x)$/;

const findCloseButton = (overlay) => {
    // 1) Açıkça etiketlenmiş
    const labelled = overlay.querySelector(
        'button[aria-label*="apat" i], button[aria-label*="close" i], button[data-modal-close]'
    );
    if (labelled && !labelled.disabled) return labelled;

    // 2) lucide <X /> ikonu taşıyan buton
    const icons = overlay.querySelectorAll('svg.lucide-x, svg.lucide-circle-x, svg.lucide-x-circle');
    for (const icon of icons) {
        const btn = icon.closest('button');
        if (btn && !btn.disabled) return btn;
    }

    // 3) Metni "Kapat / İptal / Vazgeç / ×" olan buton
    for (const btn of overlay.querySelectorAll('button')) {
        if (btn.disabled) continue;
        if (CLOSE_TEXT.test(sadeMetin(btn.textContent))) return btn;
    }

    // 4) Sağ üst köşedeki tek ikonlu buton (yaygın kapatma yerleşimi)
    const box = overlay.getBoundingClientRect();
    for (const btn of overlay.querySelectorAll('button')) {
        if (btn.disabled) continue;
        if ((btn.textContent || '').trim()) continue;      // yazısı varsa kapatma değil
        if (btn.querySelectorAll('svg').length !== 1) continue;
        const r = btn.getBoundingClientRect();
        const sagUstte = r.top - box.top < 80 && box.right - r.right < 80;
        if (sagUstte) return btn;
    }

    return null;
};

export const useGlobalModalDismiss = () => {
    useEffect(() => {
        const dismissTop = () => {
            const [top] = openOverlays();
            if (!top) return false;
            const btn = findCloseButton(top);
            if (!btn) return false;
            btn.click();
            return true;
        };

        const onKeyDown = (e) => {
            if (e.key !== 'Escape' || e.defaultPrevented) return;
            // Açık bir <select> ya da yazım sırasındaki IME'yi bozmayalım
            if (e.isComposing) return;
            if (dismissTop()) e.preventDefault();
        };

        // Perdeye tıklama: yalnızca perdenin boşluğuna basıldıysa kapat.
        // mousedown+mouseup aynı elemanda olmalı ki metin seçerken kapanmasın.
        let pressed = null;
        const onDown = (e) => { pressed = e.target; };
        const onUp = (e) => {
            const target = pressed;
            pressed = null;
            if (!target || target !== e.target) return;
            if (!(target instanceof Element)) return;
            const [top] = openOverlays();
            if (!top || target !== top) return;
            const btn = findCloseButton(top);
            if (btn) btn.click();
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('mousedown', onDown, true);
        document.addEventListener('mouseup', onUp, true);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('mousedown', onDown, true);
            document.removeEventListener('mouseup', onUp, true);
        };
    }, []);
};

export default useGlobalModalDismiss;
