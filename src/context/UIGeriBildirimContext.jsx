import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { bildirimleriDinle, onaylariDinle } from '../services/uiGeriBildirim';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

/**
 * `services/uiGeriBildirim` yayıncısını dinleyip ekrana çizen katman.
 * Uygulamanın kökünde bir kez bağlanır; başka hiçbir yerde toast ya da
 * onay penceresi kurulması gerekmez.
 */

const TURLER = {
    basari: { simge: CheckCircle2, sinif: 'border-l-ok text-ok' },
    uyari: { simge: AlertTriangle, sinif: 'border-l-warn text-warn' },
    hata: { simge: XCircle, sinif: 'border-l-danger text-danger' },
    bilgi: { simge: Info, sinif: 'border-l-info text-info' },
};

function ToastYigini({ kayitlar, kapat }) {
    if (!kayitlar.length) return null;

    return (
        <div
            className="fixed z-notify inset-x-0 bottom-0 sm:inset-x-auto sm:right-4 sm:bottom-4 flex flex-col-reverse gap-2 p-3 sm:p-0 pointer-events-none"
            style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
            role="status"
            aria-live="polite"
        >
            {kayitlar.map((k) => {
                const tur = TURLER[k.tur] || TURLER.bilgi;
                const Simge = tur.simge;
                return (
                    <div
                        key={k.id}
                        className={`pointer-events-auto w-full sm:w-80 bg-surface border border-line border-l-4 ${tur.sinif} rounded-xl shadow-2xl px-4 py-3 flex items-start gap-3 animate-fade-in`}
                    >
                        <Simge size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
                        <p className="flex-1 text-sm text-ink leading-snug break-words">{k.mesaj}</p>
                        {k.sure === 0 && (
                            <span className="sr-only">Bu bildirim kapatılana kadar kalır.</span>
                        )}
                        <button
                            type="button"
                            onClick={() => kapat(k.id)}
                            aria-label="Bildirimi kapat"
                            className="shrink-0 -mr-1 p-1 rounded-md text-ink-3 hover:text-ink hover:bg-surface-3 transition"
                        >
                            <X size={15} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

export function UIGeriBildirimProvider({ children }) {
    const [toastlar, setToastlar] = useState([]);
    const [onay, setOnay] = useState(null);

    const kapat = useCallback((id) => {
        setToastlar((o) => o.filter((t) => t.id !== id));
    }, []);

    useEffect(() => bildirimleriDinle((kayit) => {
        setToastlar((o) => {
            /**
             * ⚠️ YİNELEME ENGELİ YOKTU.
             *
             * Aynı bildirim arka arkaya tetiklendiğinde (döngüde çalışan
             * kayıt, hızlı çift tıklama, birden çok bileşenin aynı olaya
             * tepki vermesi) ekran aynı metinden üst üste yığıyordu.
             * Kullanıcı için gürültü, ekranı kaplayan bir yığın demekti.
             *
             * Aynı metin ve tür zaten ekrandaysa yeni toast eklenmez;
             * mevcut olanın süresi baştan başlar.
             */
            const ayni = o.find((t) => t.mesaj === kayit.mesaj && t.tur === kayit.tur);
            if (ayni) return o;
            return [...o.slice(-3), kayit];             // en çok 4 tane üst üste
        });

        /**
         * `sure: 0` KALICI bildirim demektir — kullanıcı kapatana kadar
         * ekranda durur. Kritik hatalar (veri kaydedilemedi, yetki
         * reddedildi) otomatik kaybolmamalı; kullanıcı görmeden geçebilir.
         */
        if (kayit.sure > 0) {
            setTimeout(() => kapat(kayit.id), kayit.sure);
        }
    }), [kapat]);

    useEffect(() => onaylariDinle((kayit) => setOnay(kayit)), []);

    const cevapla = (sonuc) => {
        onay?.cozumle?.(sonuc);
        setOnay(null);
    };

    return (
        <>
            {children}
            <ToastYigini kayitlar={toastlar} kapat={kapat} />

            {onay && (
                <Modal
                    acik
                    baslik={onay.baslik}
                    genislik="sm"
                    onClose={() => cevapla(false)}
                    altCubuk={
                        <>
                            <Button varyant="ghost" onClick={() => cevapla(false)}>
                                {onay.iptalMetni}
                            </Button>
                            <Button
                                varyant={onay.tehlikeli ? 'danger' : 'primary'}
                                onClick={() => cevapla(true)}
                            >
                                {onay.onayMetni}
                            </Button>
                        </>
                    }
                >
                    {onay.mesaj && (
                        <p className="text-sm text-ink-2 leading-relaxed whitespace-pre-line">
                            {onay.mesaj}
                        </p>
                    )}
                </Modal>
            )}
        </>
    );
}

export default UIGeriBildirimProvider;
