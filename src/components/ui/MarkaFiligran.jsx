/**
 * 🏷️ MARKA FİLİGRANI
 *
 * YENİ MEKANİZMA — NEDEN ZORUNLU?
 * Marka talimatı her tabın zemininde amblem + "Başarı Kampı Koçluk
 * Platformu"nun düşük opaklıkta bulunmasını istiyor. Bunu her panele
 * elle kopyalamak, opaklık/konum ayarlarının zamanla birbirinden
 * kopmasına yol açar — tek ortak bileşen tek doğru kaynaktır.
 *
 * Tasarım kuralları (talimatın 8. maddesi):
 *  · MARKA ALANI (header) belirgin; BU bileşen ise yalnızca zemin
 *    filigranı — ikisi karıştırılmaz.
 *  · `fixed` + `pointer-events-none` + `aria-hidden`: tıklamayı,
 *    kaydırmayı ve ekran okuyucuyu hiç etkilemez.
 *  · DOM'da içerikten ÖNCE durur ve z-index almaz: kartlar/paneller
 *    kendi arka planlarıyla üstünü örter, filigran yalnızca boş
 *    zeminlerde görünür — okunabilirlik bozulmaz.
 *  · Opaklık ~%5: açık ve koyu temada ölçülüp seçildi; `grayscale`
 *    renkli amblemin dikkat çekmesini engeller.
 */
import React from 'react';
import MARKA from '../../data/marka';

export default function MarkaFiligran() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none select-none fixed inset-0 flex flex-col items-center justify-center opacity-[0.05]"
        >
            <img
                src={MARKA.amblem}
                alt=""
                width="160"
                height="160"
                loading="lazy"
                decoding="async"
                className="w-28 h-28 sm:w-40 sm:h-40 object-contain grayscale"
            />
            <p className="mt-3 px-6 text-center text-base sm:text-2xl font-black uppercase tracking-[0.18em] text-ink">
                {MARKA.tamAd}
            </p>
        </div>
    );
}
