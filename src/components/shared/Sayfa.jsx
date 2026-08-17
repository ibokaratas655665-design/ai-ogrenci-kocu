import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * 📄 SAYFA İSKELETİ — kap, başlık, kırıntı
 *
 * Denetimde her ekran kendi genişliğini ve iç boşluğunu uyduruyordu:
 * öğrenci paneli `max-w-7xl px-4`, koç paneli `max-w-[1920px] px-6`,
 * kimi sekme hiç sınır koymuyordu. Aynı ürünün iki ekranı farklı
 * genişlikte açılınca tek uygulama hissi kayboluyor.
 *
 * Genişlikler burada tek yerden verilir ve her kırılma noktasında
 * boşluk birlikte büyür: 16px (telefon) → 24px (tablet) → 32px (masaüstü).
 */

const GENISLIKLER = {
    /** Okunacak içerik — form, ayar, metin. Satır 75 karakteri geçmesin. */
    dar: 'max-w-3xl',
    /** Varsayılan pano genişliği. 1920px'lik ekranda içerik ortada kalır. */
    normal: 'max-w-[1400px]',
    /** Tablo ve geniş ızgaralar için. */
    genis: 'max-w-[1700px]',
    /** Sınır yok — tam ekran araçlar (ders programı gibi). */
    tam: 'max-w-none',
};

/** Sayfa içeriğini saran kap. */
export function Icerik({ genislik = 'normal', className, children }) {
    return (
        <div
            className={cn(
                'w-full mx-auto',
                'px-4 sm:px-6 lg:px-8',
                GENISLIKLER[genislik] || GENISLIKLER.normal,
                className
            )}
        >
            {children}
        </div>
    );
}

/**
 * Kırıntı — kullanıcı nerede olduğunu ve nasıl geri döneceğini görür.
 * Öğrenci detay sayfasından geri dönüş yolu belirsizdi.
 */
export function Kirinti({ ogeler = [], className }) {
    if (!ogeler.length) return null;
    return (
        <nav aria-label="Konum" className={cn('flex items-center gap-1 flex-wrap', className)}>
            {ogeler.map((o, i) => {
                const son = i === ogeler.length - 1;
                return (
                    <React.Fragment key={o.etiket}>
                        {i > 0 && <ChevronRight size={13} className="text-ink-3 shrink-0" aria-hidden="true" />}
                        {son || !o.onSec ? (
                            <span className="tip-caption text-ink-3" aria-current={son ? 'page' : undefined}>
                                {o.etiket}
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={o.onSec}
                                className="tip-caption text-brand hover:underline rounded-dsm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                            >
                                {o.etiket}
                            </button>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
}

/**
 * Sayfa başlığı — her ekranda AYNI hiyerarşi:
 *   kırıntı → başlık → açıklama → eylemler
 *
 * Eylemler telefonda başlığın altına iner; başlığın yanına sıkışıp
 * ekran dışına taşmaz (ders programında birebir bu olmuştu).
 */
export function SayfaBasligi({
    kirinti = [],
    baslik,
    aciklama,
    eylem,
    rozet,
    className,
}) {
    return (
        <header className={cn('mb-6', className)}>
            {kirinti.length > 0 && <Kirinti ogeler={kirinti} className="mb-2" />}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="tip-h2">{baslik}</h1>
                        {rozet}
                    </div>
                    {aciklama && (
                        <p className="tip-small mt-1.5 max-w-[70ch]">{aciklama}</p>
                    )}
                </div>

                {eylem && (
                    <div className="flex items-center gap-2 flex-wrap shrink-0">{eylem}</div>
                )}
            </div>
        </header>
    );
}

/**
 * Sayfa gövdesi — bölümler arası dikey ritim tek yerden.
 * Ekranlar `space-y-6`, `space-y-8`, `space-y-10` arasında gidip
 * geliyordu; aynı üründe farklı nefes alan sayfalar oluyordu.
 */
export function SayfaGovdesi({ className, children }) {
    return <div className={cn('space-y-6 lg:space-y-8', className)}>{children}</div>;
}

export default Icerik;
