/**
 * 🍩 DAĞILIM GÖRSELLERİ — referansların ortak yapı taşları
 *
 * Gönderilen on iki referans ekranı birbirinden çok farklı görünüyor
 * ama aynı beş kalıbı tekrar ediyor. Her ekranda yeniden yazmak yerine
 * kalıplar burada bir kez tanımlandı:
 *
 *   1. SegmentliDonut    — bir bütünün parçaları (doğru/yanlış/boş)
 *   2. CokSegmentliCubuk — aynı şey yatayda, satır satır karşılaştırma
 *   3. CokluHalka        — birbirinden BAĞIMSIZ üç oran, eşmerkezli
 *   4. DegisimListesi    — "önce → sonra" ve farkın yönü
 *   5. VeriTablosu       — satır başına kimlik + ilerleme + durum + eylem
 *
 * ── RENK KURALI ───────────────────────────────────────────────
 * Hiçbiri kendi palet üretmez. Çağıran taraf rengi verir:
 * ders kırılımında `dersRengi`, durum kırılımında anlam renkleri.
 * Böylece aynı ders uygulamanın her yerinde aynı renkte kalır.
 *
 * ── BOŞ VERİ ──────────────────────────────────────────────────
 * Hepsi veri yokken null döner. Sıfırdan bir daire ya da boş bir
 * tablo çizmek "veri var ama hepsi sıfır" izlenimi verir; oysa
 * çoğu zaman kayıt hiç girilmemiştir. İkisi aynı şey değildir.
 */
import React from 'react';
import { cn } from '../../lib/cn';

const sayi = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/* ══════════════════════════════════════════════════════════════
   1. SEGMENTLİ DONUT
   ══════════════════════════════════════════════════════════════ */

/**
 * Bir bütünün parçaları. Ortada toplam, çevresinde paylar.
 *
 * Pasta yerine donut: ortadaki boşluk toplamı yazacak yer verir ve
 * dilim açılarını karşılaştırmak dolu pastadan kolaydır.
 *
 * @param {{ad:string, deger:number, renk:string}[]} parcalar
 */
export function SegmentliDonut({
    parcalar = [], baslik, ortaEtiket = 'Toplam',
    boyut = 132, kalinlik = 18, efsane = true, className,
}) {
    const dolu = parcalar.filter((p) => sayi(p?.deger) > 0);
    const toplam = dolu.reduce((t, p) => t + sayi(p.deger), 0);
    if (!toplam) return null;

    const r = (boyut - kalinlik) / 2;
    const cevre = 2 * Math.PI * r;

    /* Dilimler tek bir çember üstünde, strokeDasharray ile dizilir;
       her dilim kendinden öncekilerin toplamı kadar döndürülür. */
    let birikim = 0;
    const dilimler = dolu.map((p) => {
        const oran = sayi(p.deger) / toplam;
        const uzunluk = cevre * oran;
        const kaydir = cevre * birikim;
        birikim += oran;
        return { ...p, uzunluk, kaydir, yuzde: Math.round(oran * 100) };
    });

    return (
        <div className={cn('flex flex-col items-center gap-3', className)}>
            {baslik && <p className="tip-label text-ink-3 m-0">{baslik}</p>}

            <div className="relative shrink-0" style={{ width: boyut, height: boyut }}>
                <svg width={boyut} height={boyut} className="-rotate-90" aria-hidden="true">
                    <circle cx={boyut / 2} cy={boyut / 2} r={r} fill="none"
                        stroke="var(--surface-3)" strokeWidth={kalinlik} />
                    {dilimler.map((d) => (
                        <circle
                            key={d.ad}
                            cx={boyut / 2} cy={boyut / 2} r={r} fill="none"
                            stroke={d.renk} strokeWidth={kalinlik}
                            strokeDasharray={`${d.uzunluk} ${cevre - d.uzunluk}`}
                            strokeDashoffset={-d.kaydir}
                        />
                    ))}
                </svg>
                <div className="absolute inset-0 grid place-items-center text-center">
                    <div>
                        <p className="tip-mini text-ink-3 m-0 uppercase tracking-wider">{ortaEtiket}</p>
                        <p className="text-2xl font-black text-ink tabular-nums leading-none mt-0.5 m-0">{toplam}</p>
                    </div>
                </div>
            </div>

            {efsane && (
                <div className="flex flex-col gap-1.5 w-full">
                    {dilimler.map((d) => (
                        <div key={d.ad} className="flex items-center gap-2">
                            <span
                                className="w-5 h-5 rounded-full grid place-items-center text-[10px] font-black shrink-0"
                                style={{ background: `color-mix(in srgb, ${d.renk} 18%, transparent)`, color: d.renk }}
                            >
                                {d.deger}
                            </span>
                            <span className="tip-small text-ink-2 flex-1 min-w-0 truncate">{d.ad}</span>
                            <span className="tip-mini text-ink-3 tabular-nums shrink-0">%{d.yuzde}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   2. ÇOK SEGMENTLİ YATAY ÇUBUK
   ══════════════════════════════════════════════════════════════ */

/**
 * Satır satır bütün-parça karşılaştırması.
 *
 * Donut tek bir bütünü gösterir; bu bileşen çok sayıda bütünü alt
 * alta dizip aralarında karşılaştırmayı sağlar ("hangi derste yanlış
 * oranı yüksek?"). Aynı veriyi beş donutla göstermek beş ayrı açı
 * tahmini demektir; yatay çubukta gözün tek bir hizada kayması yeter.
 *
 * @param {{ad:string, segmentler:{ad:string,deger:number,renk:string}[]}[]} satirlar
 */
export function CokSegmentliCubuk({ satirlar = [], adGenislik = 96, yukseklik = 12, efsane, className }) {
    const dolu = satirlar.filter((s) => (s?.segmentler || []).some((x) => sayi(x.deger) > 0));
    if (!dolu.length) return null;

    /* Bütün satırlar AYNI ölçekte: en büyük satır %100'ü doldurur.
       Her satırı kendi içinde %100'e normalleştirmek oranları
       gösterirdi ama miktar farkını gizlerdi — 4 soruluk bir ders
       40 soruluk dersle aynı uzunlukta görünürdü. */
    const tavan = Math.max(...dolu.map((s) => s.segmentler.reduce((t, x) => t + sayi(x.deger), 0)), 1);

    return (
        <div className={cn('flex flex-col gap-2.5', className)}>
            {dolu.map((s) => {
                const toplam = s.segmentler.reduce((t, x) => t + sayi(x.deger), 0);
                return (
                    <div key={s.ad} className="flex items-center gap-3">
                        <span className="tip-small text-ink-2 shrink-0 truncate" style={{ width: adGenislik }} title={s.ad}>
                            {s.ad}
                        </span>
                        <div className="flex-1 min-w-[60px] flex rounded-full overflow-hidden bg-surface-3"
                            style={{ height: yukseklik }}>
                            {s.segmentler.filter((x) => sayi(x.deger) > 0).map((x) => (
                                <div
                                    key={x.ad}
                                    style={{ width: `${(sayi(x.deger) / tavan) * 100}%`, background: x.renk }}
                                    title={`${x.ad}: ${x.deger}`}
                                />
                            ))}
                        </div>
                        <span className="tip-mini font-bold text-ink tabular-nums shrink-0 w-[38px] text-right">
                            {toplam}
                        </span>
                    </div>
                );
            })}

            {efsane?.length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
                    {efsane.map((e) => (
                        <span key={e.ad} className="inline-flex items-center gap-1.5 text-[10px] font-bold text-ink-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: e.renk }} />
                            {e.ad}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   3. ÇOKLU HALKA
   ══════════════════════════════════════════════════════════════ */

/**
 * Eşmerkezli halkalar — üç BAĞIMSIZ oran tek görselde.
 *
 * Donut'tan farkı önemli: donut bir bütünün parçalarıdır ve dilimler
 * toplamda %100 eder. Burada her halka kendi paydasına göre dolar;
 * üçü toplanmaz. "Program uyumu %70, konu tamamlama %40, istikrar %85"
 * gibi ayrı ölçüler yan yana değil iç içe gösterilir çünkü hepsi aynı
 * öğrencinin aynı dönemine aittir.
 *
 * @param {{ad:string, oran:number, renk:string, alt?:string}[]} halkalar
 */
export function CokluHalka({ halkalar = [], boyut = 168, kalinlik = 13, bosluk = 6, className }) {
    const dolu = halkalar.filter((h) => h && Number.isFinite(Number(h.oran)));
    if (!dolu.length) return null;

    return (
        <div className={cn('flex flex-col sm:flex-row sm:items-center gap-5', className)}>
            <div className="relative shrink-0 self-center" style={{ width: boyut, height: boyut }}>
                <svg width={boyut} height={boyut} className="-rotate-90" aria-hidden="true">
                    {dolu.map((h, i) => {
                        const r = (boyut - kalinlik) / 2 - i * (kalinlik + bosluk);
                        if (r <= 0) return null;
                        const cevre = 2 * Math.PI * r;
                        const dolgu = Math.max(0, Math.min(100, sayi(h.oran)));
                        return (
                            <g key={h.ad}>
                                <circle cx={boyut / 2} cy={boyut / 2} r={r} fill="none"
                                    stroke="var(--surface-3)" strokeWidth={kalinlik} />
                                <circle cx={boyut / 2} cy={boyut / 2} r={r} fill="none"
                                    stroke={h.renk} strokeWidth={kalinlik} strokeLinecap="round"
                                    strokeDasharray={cevre}
                                    strokeDashoffset={cevre - (cevre * dolgu) / 100}
                                    style={{ transition: 'stroke-dashoffset .6s ease' }} />
                            </g>
                        );
                    })}
                </svg>
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-3">
                {dolu.map((h) => (
                    <div key={h.ad} className="min-w-0">
                        <p className="tip-mini text-ink-3 uppercase tracking-wider m-0">{h.ad}</p>
                        <p className="text-lg font-black tabular-nums leading-none mt-0.5 m-0" style={{ color: h.renk }}>
                            {h.metin ?? `%${Math.round(sayi(h.oran))}`}
                        </p>
                        {h.alt && <p className="tip-mini text-ink-3 m-0 mt-0.5">{h.alt}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   4. DEĞİŞİM LİSTESİ
   ══════════════════════════════════════════════════════════════ */

/**
 * "Önce → sonra" ve farkın yönü.
 *
 * Tek bir güncel değer "iyi mi kötü mü" sorusunu yanıtlamaz; iki
 * dönemi yan yana koymak yanıtlar. Yön rengi ARTIŞIN İYİ OLUP
 * OLMADIĞINA bağlıdır: net artışı yeşil, hata artışı kırmızıdır.
 * Bu yüzden `artisIyi` satır başına verilebilir.
 *
 * @param {{ad:string, once:number, sonra:number, birim?:string, artisIyi?:boolean}[]} satirlar
 */
export function DegisimListesi({ satirlar = [], birim = '%', enFazla = 8, className }) {
    const dolu = satirlar.filter((s) => s && Number.isFinite(Number(s.once)) && Number.isFinite(Number(s.sonra)));
    if (!dolu.length) return null;

    /* En çok DEĞİŞEN başa: liste "neye bakmalıyım" sorusunu
       yanıtlamalı, alfabetik sıra o soruyu görünmez kılar. */
    const sirali = [...dolu]
        .map((s) => ({ ...s, fark: sayi(s.sonra) - sayi(s.once) }))
        .sort((a, b) => Math.abs(b.fark) - Math.abs(a.fark))
        .slice(0, enFazla);

    return (
        <div className={cn('flex flex-col', className)}>
            {sirali.map((s) => {
                const artisIyi = s.artisIyi !== false;
                const iyi = s.fark === 0 ? null : (s.fark > 0) === artisIyi;
                const renk = iyi === null ? 'var(--ink-3)' : iyi ? 'var(--ok)' : 'var(--danger)';
                return (
                    <div key={s.ad} className="flex items-center gap-2 py-2 border-b border-line last:border-0">
                        <span className="tip-small text-ink-2 flex-1 min-w-0 truncate">{s.ad}</span>
                        <span className="tip-small text-ink-3 tabular-nums shrink-0">{s.once}{s.birim ?? birim}</span>
                        <span className="text-ink-3 shrink-0" aria-hidden="true">→</span>
                        <span className="tip-small font-bold text-ink tabular-nums shrink-0 w-[46px] text-right">
                            {s.sonra}{s.birim ?? birim}
                        </span>
                        <span
                            className="tip-mini font-black tabular-nums shrink-0 rounded-full px-2 py-0.5 inline-flex items-center gap-1"
                            style={{ background: `color-mix(in srgb, ${renk} 14%, transparent)`, color: renk }}
                        >
                            {s.fark > 0 ? '↑' : s.fark < 0 ? '↓' : '–'}
                            {Math.abs(Math.round(s.fark * 10) / 10)}{s.birim ?? birim}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

export default { SegmentliDonut, CokSegmentliCubuk, CokluHalka, DegisimListesi };
