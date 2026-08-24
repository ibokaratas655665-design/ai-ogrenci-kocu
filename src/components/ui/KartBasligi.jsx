/**
 * 🏷️ KART BAŞLIĞI — referans tasarımın imzası
 *
 * Referans görseldeki her kart aynı başlık kalıbıyla açılıyor:
 *
 *   ( ◎ )  BÜYÜK HARF BAŞLIK              eylem →
 *
 * Yani: turuncu ince halkalı beyaz daire içinde ikon, yanında harf
 * aralığı açılmış büyük harf başlık, en sağda isteğe bağlı bir eylem.
 * Bu kalıp uygulamada her kartta elle, birbirinden farklı biçimlerde
 * yazılıyordu; kimi kartta ikon vardı kimi kartta yoktu, punto ve
 * harf aralığı her yerde başkaydı. Tek bileşene alındı.
 *
 * `alt` başlığın altına küçük gri bir satır koyar — referanstaki
 * "Monday 12 Sep, 08:00 AM" satırının karşılığı.
 */
import React from 'react';
import { cn } from '../../lib/cn';

export default function KartBasligi({
    simge: Simge,
    baslik,
    alt,
    eylem,
    ton = 'marka',
    className,
}) {
    const renk = ton === 'lacivert' ? 'var(--lacivert)' : 'var(--brand)';

    return (
        <div className={cn('flex items-center gap-3', className)}>
            {Simge && (
                <span
                    aria-hidden="true"
                    className="shrink-0 w-9 h-9 rounded-dmd inline-flex items-center justify-center bg-surface"
                    style={{ border: `1.5px solid ${renk}`, color: renk }}
                >
                    <Simge size={16} />
                </span>
            )}
            <div className="min-w-0 flex-1">
                <h3 className="text-[13px] sm:text-sm font-black text-ink uppercase tracking-[0.06em] leading-tight m-0">
                    {baslik}
                </h3>
                {alt && <p className="tip-caption mt-0.5 m-0">{alt}</p>}
            </div>
            {eylem && <div className="shrink-0">{eylem}</div>}
        </div>
    );
}
