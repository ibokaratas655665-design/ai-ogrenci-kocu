import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart2 } from 'lucide-react';
import { ResponsiveContainer } from 'recharts';
import { cn } from '../../lib/cn';
import { BosDurum } from '../ui/Durumlar';
import { degisimOzeti, sayiBicim, ANLAM_RENKLERI } from './grafikTemasi';

/**
 * Grafik kabuğu — başlık, otomatik özet, boş durum ve duyarlı yükseklik.
 *
 * Kod tabanındaki grafikler sabit yükseklikliydi (280/300/350/400) ve
 * telefonda eziliyordu. Burada yükseklik ekrana göre seçilir; grafiğin
 * kendisi `ResponsiveContainer` içinde kalır.
 *
 * VERİ YOKSA GRAFİK ÇİZİLMEZ. Boş bir eksen takımı göstermek kullanıcıya
 * "veri var ama sıfır" izlenimi veriyordu; artık ne olduğu yazıyor.
 *
 * Özet satırı isteğe bağlıdır ve YALNIZCA ölçülen değişimi söyler
 * ("son 5 denemede +6,4 net"). Motivasyon cümlesi ya da tahmin üretmez —
 * veriye dayanmayan yorum kullanıcıyı yanlış yönlendirir.
 */

const YUKSEKLIKLER = {
    kisa: { mobil: 160, masaustu: 200 },
    normal: { mobil: 200, masaustu: 280 },
    uzun: { mobil: 240, masaustu: 340 },
};

export default function Grafik({
    baslik,
    aciklama,
    /** Özet için ham sayı dizisi — verilirse başlığın altında değişim yazar */
    ozetVerisi,
    ozetBirimi = '',
    /** Yüksek değer iyi mi? Net artışı iyi, hata sayısı artışı kötüdür. */
    artisIyi = true,
    boy = 'normal',
    veriVar = true,
    bosBaslik = 'Henüz veri yok',
    bosAciklama,
    bosEylem,
    sagUst,
    className,
    children,
}) {
    const [mobil, setMobil] = useState(
        typeof window !== 'undefined' ? window.innerWidth < 640 : false
    );
    useEffect(() => {
        const olc = () => setMobil(window.innerWidth < 640);
        window.addEventListener('resize', olc);
        return () => window.removeEventListener('resize', olc);
    }, []);

    const olcu = YUKSEKLIKLER[boy] || YUKSEKLIKLER.normal;
    const yukseklik = mobil ? olcu.mobil : olcu.masaustu;

    const ozet = ozetVerisi ? degisimOzeti(ozetVerisi) : null;
    const renkler = ANLAM_RENKLERI();

    /* Yön "iyi mi kötü mü" değil, ARTTI mı AZALDI mı der. İyi/kötü
       yorumunu `artisIyi` belirler — hata defterinde artış iyi değildir. */
    const olumlu = ozet && (ozet.yon === 'artis' ? artisIyi : ozet.yon === 'azalis' ? !artisIyi : null);
    const OzetSimge = ozet?.yon === 'artis' ? TrendingUp : ozet?.yon === 'azalis' ? TrendingDown : Minus;

    return (
        <section className={cn('w-full', className)}>
            {/* Başlık verilmese bile özet çizilir: grafiğin başlığını dıştaki
                panel taşıyor olabilir, ama değişim bilgisi grafiğe aittir.
                (Önce tüm blok `baslik` koşuluna bağlıydı ve özet kayboluyordu.) */}
            {(baslik || sagUst || (ozet && veriVar)) && (
                <header className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                        {baslik && <h3 className="tip-h4">{baslik}</h3>}
                        {aciklama && <p className="tip-caption mt-0.5">{aciklama}</p>}

                        {ozet && veriVar && (
                            <p className="flex items-center gap-1.5 mt-1.5">
                                <OzetSimge
                                    size={14}
                                    aria-hidden="true"
                                    style={{
                                        color: olumlu === null ? renkler.notr
                                            : olumlu ? renkler.iyi : renkler.uyari,
                                    }}
                                />
                                <span
                                    className="rakam tip-caption font-bold"
                                    style={{
                                        color: olumlu === null ? renkler.notr
                                            : olumlu ? renkler.iyi : renkler.uyari,
                                    }}
                                >
                                    {ozet.fark > 0 ? '+' : ''}{sayiBicim(ozet.fark)}{ozetBirimi}
                                </span>
                                <span className="tip-caption">
                                    ilk ölçüme göre ({sayiBicim(ozet.ilk)}{ozetBirimi} → {sayiBicim(ozet.son)}{ozetBirimi})
                                </span>
                            </p>
                        )}
                    </div>
                    {sagUst && <div className="shrink-0">{sagUst}</div>}
                </header>
            )}

            {veriVar ? (
                <div style={{ width: '100%', height: yukseklik }}>
                    <ResponsiveContainer width="100%" height="100%">
                        {children}
                    </ResponsiveContainer>
                </div>
            ) : (
                <BosDurum
                    simge={BarChart2}
                    baslik={bosBaslik}
                    aciklama={bosAciklama}
                    eylem={bosEylem}
                    className="py-8"
                />
            )}
        </section>
    );
}
