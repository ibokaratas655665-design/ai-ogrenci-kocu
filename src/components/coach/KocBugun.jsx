import React, { useMemo, useState } from 'react';
import {
    AlertTriangle, Clock, UserCheck, MessageSquare, CalendarDays,
    TrendingUp, TrendingDown, ChevronRight, CheckCircle2, Users,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge, { Sayac } from '../ui/Badge';
import Avatar from '../ui/Avatar';
import { BosDurum } from '../ui/Durumlar';
import { buildRosterStatus } from '../../services/reportService';
import { kocGorevleri, gecikenler } from '../../services/coachTaskService';

/**
 * 📋 KOÇUN BUGÜNÜ
 *
 * Koç panelinin açılış ekranı "Analiz Merkezi"ydi: grafikler ve
 * ortalamalar. Bunlar ayın sonunda anlamlı; ama koç sabah uygulamayı
 * açtığında sorduğu soru bu değil — sorduğu soru "kim beni bekliyor".
 *
 * Eski ekran bunu sayaçla cevaplıyordu ("Riskli 0", "Hareketsiz 1"):
 * bir sayı, tıklanacak bir iş değil. Koç sayıyı görüp sonra hangi
 * öğrenci olduğunu bulmak için ayrıca gezinmek zorundaydı.
 *
 * Burada her satır BİR İŞ ve tek tıkla o işin yapılacağı yere gider.
 * Sıralama koçun günlük önceliğine göre:
 *   1. Acil öğrenciler   → risk, uzun sessizlik, düşen net
 *   2. Bekleyen işlemler → onay bekleyen kayıtlar
 *   3. Bugünkü görevler  → koçun kendi görev listesi (gecikenler önce)
 *   4. Yaklaşan görüşme  → bugünün randevuları
 *   5. Son mesajlar      → cevap bekleyenler
 *
 * Veri yoğunluğu öğrenci panelinden fazla ama karmaşık değil: her
 * bölüm en çok 4 satır gösterir, gerisi "tümü"nün arkasındadır.
 */

const gunFarki = (tarih) => {
    if (!tarih) return null;
    const d = new Date(tarih);
    if (Number.isNaN(d.getTime())) return null;
    return Math.floor((Date.now() - d.getTime()) / 86400000);
};

/** Tek tıkla eyleme giden satır. */
function IsSatiri({ onTikla, sol, baslik, altBaslik, sag, vurgu }) {
    return (
        <li>
            <button
                type="button"
                onClick={onTikla}
                className={cn(
                    'w-full text-left px-4 sm:px-5 py-3 min-h-[60px] flex items-center gap-3',
                    'transition-colors duration-hizli hover:bg-surface-3 active:bg-surface-3',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset',
                    vurgu && 'bg-warn-soft/40'
                )}
            >
                {sol}
                <span className="min-w-0 flex-1">
                    <span className="tip-small font-semibold text-ink block truncate">{baslik}</span>
                    {altBaslik && <span className="tip-caption block truncate">{altBaslik}</span>}
                </span>
                {sag}
                <ChevronRight size={16} className="text-ink-3 shrink-0" aria-hidden="true" />
            </button>
        </li>
    );
}

/** Başlık + "tümü" bağlantısı olan bölüm kabuğu. */
function Bolum({ baslik, sayi, tumuEtiketi = 'Tümü', onTumu, children, bos }) {
    return (
        <Card dolgu="yok">
            <div className="px-4 sm:px-5 pt-4 pb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <h3 className="tip-h4 truncate">{baslik}</h3>
                    {sayi > 0 && <Sayac deger={sayi} ton="notr" enFazla={99} />}
                </div>
                {onTumu && (
                    <button
                        type="button"
                        onClick={onTumu}
                        className="tip-caption text-brand hover:underline shrink-0 min-h-[44px] px-2 -mr-2 rounded-dsm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                        {tumuEtiketi}
                    </button>
                )}
            </div>
            {bos ? (
                <p className="px-4 sm:px-5 pb-4 tip-caption">{bos}</p>
            ) : (
                <ul className="divide-y divide-line border-t border-line">{children}</ul>
            )}
        </Card>
    );
}

export default function KocBugun({
    kullanici,
    ogrenciler = [],
    mesajlar = [],
    randevular = [],
    onaylar = [],
    onOgrenciAc,
    onGit,
}) {
    const [tumunuGoster, setTumunuGoster] = useState(false);

    /**
     * Öğrenci durumları — risk, program uyumu, sessizlik, net eğilimi.
     *
     * `buildRosterStatus` yalnızca göstergeleri döner ve içinde `name`
     * YOKTUR (bkz. reportService: return { id, programRate, netTrend… }).
     * Kaynak öğrenciyle birleştirilmezse listede ad yerine boşluk,
     * avatarda "?" çıkar — testte birebir bu görüldü.
     */
    const durumlar = useMemo(() => {
        try {
            const olcumler = buildRosterStatus(ogrenciler) || [];
            const harita = new Map(ogrenciler.map((o) => [String(o.id), o]));
            return olcumler.map((d) => ({ ...(harita.get(String(d.id)) || {}), ...d }));
        } catch { return []; }
    }, [ogrenciler]);

    /**
     * Acil öğrenciler. Üç ayrı sinyal tek listede toplanır ve sebebi
     * satırda YAZAR — koç neden bu öğrencinin listeye girdiğini
     * tahmin etmek zorunda kalmasın.
     */
    const acilOgrenciler = useMemo(() => {
        const kayitlar = durumlar.map((st) => {
            const sebepler = [];
            let agirlik = 0;

            if (st.risk?.level === 'high') { sebepler.push('yüksek risk'); agirlik += 100; }
            const sessiz = st.daysSinceActivity;
            if (sessiz == null || sessiz > 7) { sebepler.push(sessiz == null ? 'hiç giriş yok' : `${sessiz} gündür sessiz`); agirlik += 60; }
            else if (sessiz > 3) { sebepler.push(`${sessiz} gündür sessiz`); agirlik += 25; }
            if (st.netTrend != null && st.netTrend < 0) { sebepler.push(`net ${Math.abs(st.netTrend).toFixed(1)} düştü`); agirlik += 40; }
            if (st.programRate != null && st.programRate < 50) { sebepler.push(`program %${st.programRate}`); agirlik += 30; }

            return { ...st, sebepler, agirlik };
        });
        return kayitlar
            .filter((k) => k.agirlik >= 60)
            .sort((a, b) => b.agirlik - a.agirlik);
    }, [durumlar]);

    /** Koçun kendi görevleri — gecikenler en üstte. */
    const gorevler = useMemo(() => {
        try {
            const hepsi = kocGorevleri(kullanici?.id) || [];
            const gecikmis = new Set((gecikenler(kullanici?.id) || []).map((g) => g.id));
            return hepsi
                .filter((g) => g.durum !== 'tamamlandi')
                .map((g) => ({ ...g, geciken: gecikmis.has(g.id) }))
                .sort((a, b) => (b.geciken ? 1 : 0) - (a.geciken ? 1 : 0))
                .slice(0, 4);
        } catch { return []; }
    }, [kullanici?.id]);

    /** Bugünün randevuları. */
    const bugunRandevular = useMemo(() => {
        const bugun = new Date().toDateString();
        return (randevular || [])
            .filter((r) => r?.date && new Date(r.date).toDateString() === bugun)
            .slice(0, 4);
    }, [randevular]);

    /** Öğrenciden gelen, koçun cevaplamadığı son mesajlar. */
    const cevapBekleyen = useMemo(() => (
        (mesajlar || [])
            .filter((m) => m.sender === 'student' && !m.read)
            .slice(-4)
            .reverse()
    ), [mesajlar]);

    const bekleyenOnay = (onaylar || []).length;

    /** Yükselen öğrenciler — koç iyi gidenleri de görsün, sadece sorunları değil. */
    const yukselenler = useMemo(() => (
        durumlar
            .filter((st) => st.netTrend != null && st.netTrend > 0)
            .sort((a, b) => b.netTrend - a.netTrend)
            .slice(0, 3)
    ), [durumlar]);

    const gosterilenAcil = tumunuGoster ? acilOgrenciler : acilOgrenciler.slice(0, 4);
    const toplamIs = acilOgrenciler.length + gorevler.length + bekleyenOnay + cevapBekleyen.length;

    return (
        <div className="space-y-5 lg:space-y-6">

            {/* ══ Günün özeti — tek satır, sayıdan çok cümle ══════════ */}
            <Card ton="duz" className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <div className="min-w-0 flex-1">
                    <p className="tip-label text-ink-3">BUGÜN</p>
                    {/* Öğrenci yokken "liste temiz" demek yanıltıcıydı: iş
                        bitmiş gibi okunuyor, oysa henüz hiç başlanmamış. */}
                    <p className="tip-h4 mt-1">
                        {!ogrenciler.length
                            ? 'Başlamak için öğrenci ekle'
                            : toplamIs > 0
                                ? `${toplamIs} iş seni bekliyor`
                                : 'Bekleyen iş yok — liste temiz'}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-center">
                        <span className="rakam tip-h3 block text-ink">{ogrenciler.length}</span>
                        <span className="tip-mini text-ink-3">öğrenci</span>
                    </span>
                    <span className="text-center">
                        <span className={cn('rakam tip-h3 block', acilOgrenciler.length ? 'text-warn' : 'text-ok')}>
                            {acilOgrenciler.length}
                        </span>
                        <span className="tip-mini text-ink-3">ilgi bekliyor</span>
                    </span>
                </div>
            </Card>

            {/* Öğrenci yokken ara bölümler gizlenir; alttaki tek boş
                durum yeterli. Üç ayrı "yok" mesajı üst üste geliyordu. */}
            {ogrenciler.length > 0 && (
            <Bolum
                baslik="İlgi bekleyen öğrenciler"
                sayi={acilOgrenciler.length}
                onTumu={acilOgrenciler.length > 4 ? () => setTumunuGoster((v) => !v) : undefined}
                tumuEtiketi={tumunuGoster ? 'Daha az' : `Tümü (${acilOgrenciler.length})`}
                bos={!acilOgrenciler.length
                    ? 'Şu an kimse risk eşiğinde değil. Öğrenci listesinden herkesi görebilirsin.'
                    : null}
            >
                {gosterilenAcil.map((st) => (
                    <IsSatiri
                        key={st.id}
                        onTikla={() => onOgrenciAc?.(st)}
                        sol={<Avatar ad={st.name} boyut="sm" />}
                        baslik={st.name}
                        altBaslik={st.sebepler.join(' · ')}
                        vurgu={st.risk?.level === 'high'}
                        sag={
                            st.netTrend != null && st.netTrend !== 0 ? (
                                <span className={cn(
                                    'shrink-0 inline-flex items-center gap-1 tip-caption font-bold rakam',
                                    st.netTrend > 0 ? 'text-ok' : 'text-warn'
                                )}>
                                    {st.netTrend > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                                    {Math.abs(st.netTrend).toFixed(1)}
                                </span>
                            ) : null
                        }
                    />
                ))}
            </Bolum>
            )}

            {/* ══ 2. BEKLEYEN İŞLEMLER ═══════════════════════════════ */}
            {bekleyenOnay > 0 && (
                <Card tiklanabilir onClick={() => onGit?.('approvals')} role="button" tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onGit?.('approvals'); } }}
                    className="flex items-center gap-3">
                    <span className="shrink-0 w-10 h-10 rounded-dmd bg-info-soft text-info inline-flex items-center justify-center">
                        <UserCheck size={19} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="tip-small font-semibold text-ink">
                            {bekleyenOnay} kayıt onayını bekliyor
                        </p>
                        <p className="tip-caption mt-0.5">Onaylanana kadar öğrenci giriş yapamaz</p>
                    </div>
                    <ChevronRight size={16} className="text-ink-3 shrink-0" aria-hidden="true" />
                </Card>
            )}

            {/* ══ 3. BUGÜNKÜ KOÇLUK GÖREVLERİ ═══════════════════════ */}
            {ogrenciler.length > 0 && (
            <Bolum
                baslik="Görevlerin"
                sayi={gorevler.length}
                onTumu={() => onGit?.('coach-tasks')}
                bos={!gorevler.length ? 'Açık görevin yok.' : null}
            >
                {gorevler.map((g) => (
                    <IsSatiri
                        key={g.id}
                        onTikla={() => onGit?.(g.sekme || 'coach-tasks')}
                        sol={
                            <span className={cn(
                                'shrink-0 w-9 h-9 rounded-dmd inline-flex items-center justify-center',
                                g.geciken ? 'bg-warn-soft text-warn' : 'bg-surface-3 text-ink-3'
                            )}>
                                <Clock size={17} />
                            </span>
                        }
                        baslik={g.baslik || g.title || 'Görev'}
                        altBaslik={g.ogrenciAdi || g.aciklama}
                        vurgu={g.geciken}
                        sag={g.geciken ? <Badge ton="uyari" boyut="sm">gecikmiş</Badge> : null}
                    />
                ))}
            </Bolum>
            )}

            {/* ══ 4. YAKLAŞAN GÖRÜŞMELER ════════════════════════════ */}
            {bugunRandevular.length > 0 && (
                <Bolum baslik="Bugünkü görüşmeler" sayi={bugunRandevular.length} onTumu={() => onGit?.('appointments')}>
                    {bugunRandevular.map((r) => (
                        <IsSatiri
                            key={r.id}
                            onTikla={() => onGit?.('appointments')}
                            sol={
                                <span className="shrink-0 w-9 h-9 rounded-dmd bg-brand-soft text-brand inline-flex items-center justify-center">
                                    <CalendarDays size={17} />
                                </span>
                            }
                            baslik={r.studentName || r.title || 'Görüşme'}
                            altBaslik={r.time || r.note}
                        />
                    ))}
                </Bolum>
            )}

            {/* ══ 5. CEVAP BEKLEYEN MESAJLAR ════════════════════════ */}
            {cevapBekleyen.length > 0 && (
                <Bolum baslik="Cevap bekleyen mesajlar" sayi={cevapBekleyen.length} onTumu={() => onGit?.('whatsapp')}>
                    {cevapBekleyen.map((m, i) => (
                        <IsSatiri
                            key={m.id || i}
                            onTikla={() => onGit?.('whatsapp')}
                            sol={<Avatar ad={m.studentName || m.senderName || ''} boyut="sm" />}
                            baslik={m.studentName || m.senderName || 'Öğrenci'}
                            altBaslik={m.text || m.content}
                        />
                    ))}
                </Bolum>
            )}

            {/* ══ ÖĞRENCİLERİM — tam liste, tıklayınca karneye gider ═══
                Talimat: Bugün tabında öğrenci listesi bulunmalı ve her
                satır öğrenci detayına (karne) götürmeli. Kaynak, panelin
                MEVCUT students listesi — ikinci veri kaynağı yok. */}
            <Bolum baslik="Öğrencilerim" sayi={ogrenciler.length} tumuEtiketi="Analiz" onTumu={() => onGit?.('analysis')}>
                {ogrenciler.length === 0 ? null : ogrenciler.map((s) => (
                    <IsSatiri
                        key={s.id}
                        onTikla={() => onOgrenciAc?.(s)}
                        sol={<span className="w-8 h-8 rounded-lg bg-brand-soft text-brand inline-flex items-center justify-center font-black text-xs">{(s.name || '?').charAt(0).toLocaleUpperCase('tr-TR')}</span>}
                        baslik={s.name}
                        altBaslik={[s.grade && `${s.grade}. sınıf`, s.alan || s.field].filter(Boolean).join(' · ') || 'Karneyi aç'}
                        sag={<span className="tip-caption text-ink-3">Karne →</span>}
                    />
                ))}
            </Bolum>

            {/* ══ 6. YÜKSELENLER — koç yalnızca sorunları görmesin ═══ */}
            {yukselenler.length > 0 && (
                <Card>
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={16} className="text-ok" aria-hidden="true" />
                        <h3 className="tip-h4">Yükselenler</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {yukselenler.map((st) => (
                            <button
                                key={st.id}
                                type="button"
                                onClick={() => onOgrenciAc?.(st)}
                                className="inline-flex items-center gap-2 pl-1 pr-3 py-1 min-h-[44px] rounded-pill border border-line hover:bg-surface-3 transition-colors duration-hizli focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                            >
                                <Avatar ad={st.name} boyut="xs" />
                                <span className="tip-caption font-semibold text-ink">{st.name}</span>
                                <span className="rakam tip-caption text-ok font-bold">+{st.netTrend.toFixed(1)}</span>
                            </button>
                        ))}
                    </div>
                </Card>
            )}

            {/* Hiç öğrenci yoksa koçu boş ekranla bırakma */}
            {!ogrenciler.length && (
                <BosDurum
                    simge={Users}
                    baslik="Henüz öğrencin yok"
                    aciklama="Öğrenci ekleyerek ya da davet bağlantısı paylaşarak başlayabilirsin. Öğrenciler eklendiğinde bu ekran günlük iş listene dönüşür."
                    eylem={<Button onClick={() => onGit?.('invites')}>Davet bağlantısı oluştur</Button>}
                />
            )}

            {/* Her şey temizse olumlu kapanış */}
            {ogrenciler.length > 0 && toplamIs === 0 && (
                <Card ton="sade" className="flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-ok shrink-0" aria-hidden="true" />
                    <p className="tip-small">
                        Bekleyen iş yok. İstersen analiz merkezinden haftalık gidişata bakabilirsin.
                    </p>
                </Card>
            )}
        </div>
    );
}
