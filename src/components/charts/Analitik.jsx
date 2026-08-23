/**
 * 📊 ANALİTİK BİLEŞENLERİ
 *
 * Mevcut `Grafik` kabuğunun ve `grafikTemasi`nın ÜSTÜNE eklenen katman.
 * Çalışan grafik altyapısı yeniden yazılmadı; eksik olan üç şey eklendi:
 *
 *   1. YORUM  — sayının düz Türkçe okunuşu.
 *   2. ÖLÇÜM  — değer + kendi geçmişine göre değişim + yorum.
 *   3. DÜRÜST BOŞLUK — veri yetersizken sayı değil, sebep.
 *
 * ── NEDEN YORUM ZORUNLU ────────────────────────────────────────
 * Yorum desteği olmayan gösterge tabloları öğrenciye fayda sağlamadan
 * bilişsel yük bindiriyor; grafiği okumak ayrı bir iş hâline geliyor.
 * Bu yüzden buradaki her ölçüm bir cümleyle birlikte gelir.
 * (Design Principles and Impact of a Learning Analytics Dashboard,
 *  randomize MOOC deneyi, 2025)
 *
 * ── NEDEN KENDİ GEÇMİŞİYLE KARŞILAŞTIRMA ───────────────────────
 * Akran kıyası öğrencide rekabet ve kaygı üretebiliyor. Öğrenci
 * tarafındaki bütün karşılaştırmalar KENDİ önceki dönemiyledir.
 * Akran/sınıf kıyası yalnızca koç panelinde, karar desteği olarak.
 * (Social Comparison in LAD, 2023)
 */

import React from 'react';
import {
    TrendingUp, TrendingDown, Minus, Info, Sparkles, UserRound, AlertTriangle,
} from 'lucide-react';
import { cn } from '../../lib/cn';

/* ══════════════════════════════════════════════════════════════
   1. YORUM ŞERİDİ
   ══════════════════════════════════════════════════════════════ */

const TON_STILI = {
    iyi: { kutu: 'bg-ok-soft border-ok/25', yazi: 'text-ok', Simge: TrendingUp },
    notr: { kutu: 'bg-surface-2 border-line', yazi: 'text-ink-2', Simge: Info },
    dikkat: { kutu: 'bg-warn-soft border-warn/25', yazi: 'text-warn', Simge: AlertTriangle },
};

/**
 * Bir ölçümün düz Türkçe okunuşu.
 *
 * ⚠️ KAYNAK AYRIMI ZORUNLU (talimat §19):
 * `kaynak="sistem"` → veriden üretilmiş cümle, "SİSTEM ANALİZİ" etiketli.
 * `kaynak="koc"`    → koçun GERÇEKTEN yazdığı cümle, koç adıyla.
 * Sistemin ürettiği yorum asla koç söylemiş gibi gösterilmez.
 */
export function Yorum({ ton = 'notr', kaynak = 'sistem', kocAdi, children, className }) {
    if (!children) return null;
    const s = TON_STILI[ton] || TON_STILI.notr;
    const kocMu = kaynak === 'koc';
    const Simge = kocMu ? UserRound : s.Simge;

    return (
        <div className={cn('flex items-start gap-2.5 rounded-dsm border px-3 py-2.5',
            kocMu ? 'bg-brand-soft border-brand-line' : s.kutu, className)}>
            <Simge size={15} className={cn('shrink-0 mt-0.5', kocMu ? 'text-brand' : s.yazi)} />
            <div className="min-w-0">
                <span className={cn(
                    'block tip-mini font-black uppercase tracking-wider mb-0.5',
                    kocMu ? 'text-brand' : 'text-ink-3'
                )}>
                    {kocMu ? (kocAdi ? `Koçun · ${kocAdi}` : 'Koçun') : 'Sistem Analizi'}
                </span>
                <p className="tip-small text-ink-2 m-0">{children}</p>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   2. DÜRÜST BOŞ DURUM
   ══════════════════════════════════════════════════════════════ */

/** Veri yetersizken gösterilecek sebep — 0 ya da uydurma sayı DEĞİL. */
const SEBEP_METNI = {
    'program-yok': 'Koçun henüz program oluşturmamış.',
    'vadesi-gelmis-etut-yok': 'Programın başladı ama vadesi gelen etüt yok.',
    'deneme-yok': 'Henüz deneme kaydın yok.',
    'trend-icin-az-deneme': 'Eğilim çıkarmak için en az 3 deneme gerekiyor.',
    'hata-kaydi-yok': 'Henüz hata defterine kayıt girmemişsin.',
    'calisma-yok': 'Bu dönemde çalışma kaydın yok.',
};

export function VeriYok({ sebep, metin, ipucu, className, boyut = 'normal' }) {
    const yazi = metin || SEBEP_METNI[sebep] || 'Bu bölüm için henüz yeterli veri yok.';
    return (
        <div className={cn(
            'flex flex-col items-center justify-center text-center rounded-dsm',
            'border border-dashed border-line bg-surface-2/50',
            boyut === 'kucuk' ? 'px-3 py-4 gap-1' : 'px-4 py-7 gap-1.5',
            className
        )}>
            <Info size={boyut === 'kucuk' ? 15 : 19} className="text-ink-3" />
            <p className="tip-small text-ink-2 m-0 max-w-[34ch]">{yazi}</p>
            {ipucu && <p className="tip-mini text-ink-3 m-0 max-w-[34ch]">{ipucu}</p>}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   3. DEĞİŞİM ROZETİ
   ══════════════════════════════════════════════════════════════ */

/**
 * Kendi geçmişine göre değişim.
 * `deger === null` ise "karşılaştırılamıyor" der — %0 DEMEZ.
 * Sıfır payda ile üretilmiş sahte bir yüzde en sinsi hatadır.
 */
export function Degisim({ deger, birim = '%', artisIyi = true, aciklama, className }) {
    if (deger === null || deger === undefined) {
        return (
            <span className={cn('tip-mini text-ink-3 inline-flex items-center gap-1', className)}>
                <Minus size={11} /> karşılaştırma yok
            </span>
        );
    }
    const n = Number(deger);
    const yatay = n === 0;
    const iyi = artisIyi ? n > 0 : n < 0;
    const Simge = yatay ? Minus : n > 0 ? TrendingUp : TrendingDown;
    const renk = yatay ? 'text-ink-3' : iyi ? 'text-ok' : 'text-danger';

    return (
        <span className={cn('tip-mini font-bold inline-flex items-center gap-1', renk, className)}>
            <Simge size={12} />
            {n > 0 ? '+' : ''}{n}{birim}
            {aciklama && <span className="text-ink-3 font-medium">{aciklama}</span>}
        </span>
    );
}

/* ══════════════════════════════════════════════════════════════
   4. ÖLÇÜM KARTI
   ══════════════════════════════════════════════════════════════ */

const TON_VURGU = {
    marka: 'var(--brand)',
    iyi: 'var(--ok)',
    uyari: 'var(--warn)',
    kotu: 'var(--danger)',
    bilgi: 'var(--info)',
    mor: 'var(--c4)',
};

/**
 * Tek bir ölçüm: büyük değer + kendi geçmişine göre değişim + yorum.
 *
 * `veri={false}` geçilirse sayı hiç gösterilmez; yerine sebep yazar.
 * Bu, "0 soru çözdün" ile "kayıt girmedin" arasındaki farkı korur.
 */
export function OlcumKarti({
    etiket, deger, birim = '', alt,
    degisim, degisimBirimi = '%', artisIyi = true,
    ton = 'marka', simge: Simge,
    veri = true, sebep, bosMetin,
    yorum, yorumTonu = 'notr',
    className, children,
}) {
    const vurgu = TON_VURGU[ton] || TON_VURGU.marka;

    return (
        <div className={cn('srf p-4 flex flex-col gap-2.5', className)}>
            <div className="flex items-center gap-2">
                {Simge && (
                    <span className="grid place-items-center w-7 h-7 rounded-lg shrink-0"
                        style={{ background: `color-mix(in srgb, ${vurgu} 14%, transparent)`, color: vurgu }}>
                        <Simge size={15} />
                    </span>
                )}
                <span className="tip-mini font-black uppercase tracking-wider text-ink-3">{etiket}</span>
            </div>

            {veri ? (
                <>
                    <div className="flex items-end gap-2 flex-wrap">
                        <span className="text-[1.75rem] leading-none font-black tabular-nums" style={{ color: vurgu }}>
                            {deger}<span className="text-[0.95rem] font-bold ml-0.5">{birim}</span>
                        </span>
                        {/* Değişim YALNIZCA karşılaştırması olan ölçümlerde çizilir.
                            Program uyumu gibi anlık oranlarda "karşılaştırma yok"
                            yazmak bilgi değil gürültüdür. */}
                        {degisim !== undefined && (
                            <Degisim deger={degisim} birim={degisimBirimi} artisIyi={artisIyi} className="mb-1" />
                        )}
                    </div>
                    {alt && <p className="tip-mini text-ink-3 m-0">{alt}</p>}
                    {children}
                    {yorum && <Yorum ton={yorumTonu}>{yorum}</Yorum>}
                </>
            ) : (
                <VeriYok sebep={sebep} metin={bosMetin} boyut="kucuk" />
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   5. UYUM HALKASI
   ══════════════════════════════════════════════════════════════ */

/**
 * Program uyumu halkası — "planladığımın ne kadarını yaptım?"
 *
 * Payda YALNIZCA vadesi gelmiş etütlerdir; gelecek etüt oranı
 * düşürmez (bkz. gelisimAnalitik.programUyumu).
 */
export function UyumHalkasi({ oran, planlanan, tamamlanan, boyut = 118, className }) {
    if (oran === null || oran === undefined) {
        return <VeriYok sebep="vadesi-gelmis-etut-yok" boyut="kucuk" className={className} />;
    }
    const r = (boyut - 14) / 2;
    const cevre = 2 * Math.PI * r;
    const dolu = Math.max(0, Math.min(100, oran));
    const renk = dolu >= 80 ? 'var(--ok)' : dolu >= 60 ? 'var(--warn)' : 'var(--danger)';

    return (
        <div className={cn('flex flex-col items-center gap-1.5', className)}>
            <div className="relative shrink-0" style={{ width: boyut, height: boyut }}>
                <svg width={boyut} height={boyut} className="-rotate-90" aria-hidden="true">
                    <circle cx={boyut / 2} cy={boyut / 2} r={r} fill="none"
                        stroke="var(--surface-3)" strokeWidth="9" />
                    <circle cx={boyut / 2} cy={boyut / 2} r={r} fill="none"
                        stroke={renk} strokeWidth="9" strokeLinecap="round"
                        strokeDasharray={cevre}
                        strokeDashoffset={cevre - (cevre * dolu) / 100}
                        style={{ transition: 'stroke-dashoffset .6s ease' }} />
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                    <span className="text-[1.5rem] font-black tabular-nums leading-none" style={{ color: renk }}>
                        %{dolu}
                    </span>
                </div>
            </div>
            <span className="tip-mini text-ink-3" role="status">
                {tamamlanan} / {planlanan} etüt
            </span>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   6. ÇALIŞMA ISI HARİTASI
   ══════════════════════════════════════════════════════════════ */

/**
 * Günlük çalışma yoğunluğu.
 *
 * Kayıt OLMAYAN gün ile SIFIR çözülen gün farklı gösterilir: biri boş
 * çerçeve, diğeri en açık dolu ton. "Çalışmadım" ile "girmedim" aynı
 * şey değildir ve karıştırılırsa öğrenci haksız yere kötü görünür.
 */
export function IsiHaritasi({ seri = [], alan = 'soru', className }) {
    if (!seri.length) return <VeriYok sebep="calisma-yok" boyut="kucuk" className={className} />;

    const degerler = seri.filter((g) => g.kayit).map((g) => g[alan]);
    const enBuyuk = degerler.length ? Math.max(...degerler) : 0;

    const tonu = (g) => {
        if (!g.kayit) return null;
        if (enBuyuk <= 0) return 0.16;
        return 0.16 + (g[alan] / enBuyuk) * 0.84;
    };

    return (
        <div className={cn('flex flex-col gap-2', className)}>
            <div className="flex flex-wrap gap-1">
                {seri.map((g) => {
                    const t = tonu(g);
                    return (
                        <div
                            key={g.tarih}
                            title={g.kayit
                                ? `${g.tarih} · ${g[alan]}${alan === 'soru' ? ' soru' : ' dk'}`
                                : `${g.tarih} · kayıt yok`}
                            className="w-[13px] h-[13px] rounded-[3px] shrink-0"
                            style={t === null
                                ? { border: '1px dashed var(--line-2)' }
                                : { background: `color-mix(in srgb, var(--brand) ${Math.round(t * 100)}%, var(--surface-2))` }}
                        />
                    );
                })}
            </div>
            <div className="flex items-center gap-3 tip-mini text-ink-3">
                <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-[3px]" style={{ border: '1px dashed var(--line-2)' }} />
                    kayıt yok
                </span>
                <span className="inline-flex items-center gap-1">
                    az
                    <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: 'color-mix(in srgb, var(--brand) 20%, var(--surface-2))' }} />
                    <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: 'color-mix(in srgb, var(--brand) 60%, var(--surface-2))' }} />
                    <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: 'var(--brand)' }} />
                    çok
                </span>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   7. DERS UYUM ÇUBUKLARI
   ══════════════════════════════════════════════════════════════ */

/** Ders bazlı uyum — hangi derste plana uyuluyor, hangisinde kalınıyor. */
export function DersCubuklari({ dersler = [], enFazla = 6, className }) {
    if (!dersler.length) return <VeriYok sebep="vadesi-gelmis-etut-yok" boyut="kucuk" className={className} />;

    return (
        <div className={cn('flex flex-col gap-2.5', className)}>
            {dersler.slice(0, enFazla).map((d) => {
                const o = d.oran ?? 0;
                const renk = o >= 80 ? 'var(--ok)' : o >= 60 ? 'var(--warn)' : 'var(--danger)';
                return (
                    <div key={d.ders} className="flex items-center gap-3">
                        <span className="tip-small text-ink-2 w-[92px] shrink-0 truncate" title={d.ders}>
                            {d.ders}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-surface-3 overflow-hidden min-w-[60px]">
                            <div className="h-full rounded-full transition-all duration-yavas"
                                style={{ width: `${o}%`, background: renk }} />
                        </div>
                        <span className="tip-mini font-bold tabular-nums w-[52px] text-right shrink-0"
                            style={{ color: renk }}>
                            %{o}
                        </span>
                        <span className="tip-mini text-ink-3 tabular-nums w-[42px] text-right shrink-0 hidden sm:inline">
                            {d.tamamlanan}/{d.planlanan}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   8. GELİŞİM ZİNCİRİ
   ══════════════════════════════════════════════════════════════ */

/**
 * PROGRAM → ÇALIŞMA → DENEME → NET zinciri.
 *
 * Halkalardan biri eksikse zincir "kurulmuş" gösterilmez; eksik halka
 * soluk çizilir ve neyin eksik olduğu yazılır. Olmayan bir nedensellik
 * varmış gibi sunulmaz.
 */
export function GelisimZinciri({ zincir, className }) {
    if (!zincir?.halkalar?.length) return null;

    return (
        <div className={cn('flex flex-col gap-3', className)}>
            {/*
                Telefonda dört halka yan yana sığmıyor ve kabı yatay kaydırmak
                zincirin bütününü tek bakışta görmeyi engelliyordu. Dar ekranda
                2×2 ızgaraya geçilir (okuma sırası yine soldan sağa, üstten
                alta); oklar yalnızca tek sıra hâlinde anlamlı olduğu için
                geniş ekranda çıkar.
            */}
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-stretch sm:gap-1.5">
                {zincir.halkalar.map((h, i) => (
                    <React.Fragment key={h.id}>
                        {i > 0 && (
                            <div className="hidden sm:grid place-items-center shrink-0 px-0.5" aria-hidden="true">
                                <span className="text-ink-3 text-sm">→</span>
                            </div>
                        )}
                        <div className={cn(
                            'sm:flex-1 sm:min-w-[86px] rounded-dsm border px-3 py-2.5 text-center',
                            h.veri ? 'bg-surface border-line' : 'bg-surface-2/50 border-dashed border-line opacity-70'
                        )}>
                            <span className="block tip-mini text-ink-3 truncate">{h.ad}</span>
                            {h.veri ? (
                                <>
                                    <span className="block text-lg font-black tabular-nums text-ink leading-tight">
                                        {h.deger}{h.birim}
                                    </span>
                                    {h.degisim !== null && h.degisim !== undefined && (
                                        <Degisim deger={h.degisim} birim={h.id === 'net' ? '' : '%'} />
                                    )}
                                </>
                            ) : (
                                <span className="block text-ink-3 tip-small py-1">—</span>
                            )}
                        </div>
                    </React.Fragment>
                ))}
            </div>

            {zincir.eksik.length > 0 && (
                <Yorum ton="notr">
                    Zincirin tamamlanması için eksik halka: {zincir.eksik.join(', ')}.
                    Bu veriler girildiğinde çalışmanın sonuca etkisi tek bakışta görünecek.
                </Yorum>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   9. RİSK LİSTESİ — koç karar desteği
   ══════════════════════════════════════════════════════════════ */

const RISK_STILI = {
    yuksek: { etiket: 'Yüksek', kutu: 'bg-danger-soft text-danger border-danger/30' },
    orta: { etiket: 'Orta', kutu: 'bg-warn-soft text-warn border-warn/30' },
    dusuk: { etiket: 'Düşük', kutu: 'bg-ok-soft text-ok border-ok/30' },
};

/**
 * Riskli alanlar. Bir KESTİRİM değil, mevcut sinyallerin özetidir —
 * her satırda hangi sinyalin yandığı açıkça yazar; koç sayıya değil
 * gerekçeye bakarak karar verir.
 */
export function RiskListesi({ riskler, enFazla = 6, className }) {
    if (!riskler?.veri) {
        return <VeriYok metin="Risk değerlendirmesi için yeterli sinyal yok." boyut="kucuk" className={className} />;
    }
    const liste = riskler.dersler.filter((r) => r.sinyal > 0).slice(0, enFazla);
    if (!liste.length) {
        return (
            <Yorum ton="iyi">
                Son {riskler.gun} günde risk sinyali veren ders yok.
            </Yorum>
        );
    }

    return (
        <div className={cn('flex flex-col gap-2', className)}>
            {liste.map((r) => {
                const s = RISK_STILI[r.seviye] || RISK_STILI.dusuk;
                return (
                    <div key={r.ders} className="flex items-start gap-3 rounded-dsm border border-line bg-surface px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                            <span className="block tip-small font-bold text-ink truncate">{r.ders}</span>
                            <span className="block tip-mini text-ink-3">{r.dayanak.join(' · ')}</span>
                        </div>
                        <span className={cn('shrink-0 border rounded-full px-2 py-0.5 tip-mini font-black', s.kutu)}>
                            {s.etiket}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   10. MOTİVASYON ŞERİDİ
   ══════════════════════════════════════════════════════════════ */

/**
 * Yalnızca GERÇEKTEN olmuş bir başarıyı anlatır.
 * `metin` boşsa (gelisimAnalitik.motivasyon null döndüyse) hiç çizilmez —
 * sahte övgü üretmemenin en basit yolu, üretmemektir.
 */
export function MotivasyonSeridi({ metin, className }) {
    if (!metin) return null;
    return (
        <div className={cn(
            'flex items-center gap-3 rounded-dmd px-4 py-3 on-color',
            'bg-gradient-to-r from-indigo-500 to-purple-500',
            className
        )}>
            <Sparkles size={18} className="shrink-0 text-white/90" />
            <p className="tip-small font-semibold text-white m-0">{metin}</p>
        </div>
    );
}

export default {
    Yorum, VeriYok, Degisim, OlcumKarti, UyumHalkasi,
    IsiHaritasi, DersCubuklari, GelisimZinciri, RiskListesi, MotivasyonSeridi,
};
