import React from 'react';
import { Inbox, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/cn';
import Button from './Button';

/**
 * Boş, yükleniyor ve hata durumları.
 *
 * Denetimde "henüz" kelimesi 94 yerde geçiyordu — yani boş durumlar
 * VAR ama her biri farklı biçimde ve çoğu yalnızca düz metin, kullanıcıyı
 * bir sonraki adıma yönlendiren eylem yok. İskelet ise yalnızca 2 dosyada
 * bulundu; çoğu ekran veri gelene kadar bomboş duruyordu.
 */

/** Boş liste — her zaman bir sonraki adımı önerir. */
export function BosDurum({
    simge: Simge = Inbox,
    baslik,
    aciklama,
    eylem,
    className,
}) {
    return (
        <div className={cn('flex flex-col items-center justify-center text-center py-12 px-6', className)}>
            <span className="mb-4 w-14 h-14 rounded-pill bg-surface-3 inline-flex items-center justify-center">
                <Simge size={24} className="text-ink-3" strokeWidth={1.75} aria-hidden="true" />
            </span>
            {baslik && <h3 className="tip-h4 mb-1.5">{baslik}</h3>}
            {aciklama && <p className="tip-small max-w-[42ch] mb-5">{aciklama}</p>}
            {eylem}
        </div>
    );
}

/** İskelet — yüklenirken sayfanın şeklini korur, boş ekran göstermez. */
export function Iskelet({ className, yuvarlak = false }) {
    return (
        <div
            aria-hidden="true"
            className={cn(
                'animate-pulse bg-surface-3 motion-reduce:animate-none',
                yuvarlak ? 'rounded-pill' : 'rounded-dsm',
                className
            )}
        />
    );
}

/** Kart iskeleti — liste ve panel yüklenirken. */
export function IskeletKart({ satir = 3, className }) {
    return (
        <div className={cn('rounded-dlg border border-line bg-surface p-kart', className)} role="status" aria-label="Yükleniyor">
            <div className="flex items-center gap-3 mb-4">
                <Iskelet className="w-10 h-10" yuvarlak />
                <div className="flex-1 space-y-2">
                    <Iskelet className="h-3.5 w-1/3" />
                    <Iskelet className="h-3 w-1/4" />
                </div>
            </div>
            <div className="space-y-2.5">
                {Array.from({ length: satir }).map((_, i) => (
                    <Iskelet key={i} className={cn('h-3', i === satir - 1 ? 'w-2/3' : 'w-full')} />
                ))}
            </div>
        </div>
    );
}

/**
 * Bölüm hata sınırı.
 *
 * Uygulamada yalnızca 4 dosyada ErrorBoundary vardı; bir bileşen
 * çökünce tüm uygulama beyaz ekrana düşüyordu (accessControl hatasında
 * bunu birebir yaşadık). Bu sınır sekme/panel başına konur: o bölüm
 * çöker, uygulamanın kalanı ayakta kalır.
 */
export class BolumHataSiniri extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hata: null };
    }

    static getDerivedStateFromError(hata) {
        return { hata };
    }

    componentDidCatch(hata, bilgi) {
        console.error(`[${this.props.bolumAdi || 'bölüm'}] çöktü:`, hata, bilgi);
    }

    render() {
        if (!this.state.hata) return this.props.children;

        return (
            <div className="rounded-dlg border border-danger/30 bg-danger-soft p-6 text-center" role="alert">
                <AlertTriangle size={24} className="text-danger mx-auto mb-3" strokeWidth={1.75} aria-hidden="true" />
                <h3 className="tip-h4 mb-1.5">
                    {this.props.bolumAdi ? `${this.props.bolumAdi} yüklenemedi` : 'Bu bölüm yüklenemedi'}
                </h3>
                <p className="tip-small mb-4 max-w-[46ch] mx-auto">
                    Uygulamanın geri kalanı çalışmaya devam ediyor. Yeniden denemek sorunu çözmezse
                    bu bölümü koçunuza bildirin.
                </p>
                <Button
                    varyant="outline"
                    boyut="sm"
                    simge={RefreshCw}
                    aria-label="Bu bölümü yeniden yüklemeyi dene"
                    onClick={() => this.setState({ hata: null })}
                >
                    Yeniden dene
                </Button>
            </div>
        );
    }
}

export default BosDurum;
