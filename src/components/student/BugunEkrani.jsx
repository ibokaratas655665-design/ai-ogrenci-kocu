import React, { useMemo, useState, useEffect } from 'react';
import {
    Play, Check, ArrowRight, MessageSquare, Flame,
    CalendarCheck, Sparkles, Target, ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Progress, { HalkaProgress } from '../ui/Progress';
import { BosDurum } from '../ui/Durumlar';
import OnayKutusu from '../ui/OnayKutusu';
import { getProgress, setCellStatus } from '../../services/programProgressService';
import { bildir } from '../../services/uiGeriBildirim';

/**
 * 🌅 BUGÜN EKRANI
 *
 * Öğrenci paneline girildiğinde ilk görülen ekran buydu:
 * dört sayaç kartı, ardından ekranın en büyük öğesi olarak bir Pomodoro
 * sayacı. Yani uygulama "ne kadar çalıştın" diyordu ama
 * "şimdi ne yapmalısın" demiyordu. Program ayrı sekmede, görevler ayrı
 * sekmedeydi; öğrenci günü kendisi birleştirmek zorundaydı.
 *
 * Bu ekran altı soruyu sırayla, tek akışta cevaplar:
 *   1. Bugün ne yapmalıyım?  → günün etüt listesi
 *   2. Bugünkü hedefim ne?   → tamamlanacak etüt + görev sayısı
 *   3. Ne kadar ilerledim?   → günün halkası ve çubuğu
 *   4. Neleri tamamladım?    → işaretlenen etütler, biten görevler
 *   5. Nerede zorlanıyorum?  → son denemelerin en zayıf dersi
 *   6. Sıradaki adımım ne?   → en üstteki tek birincil eylem
 *
 * TON: başarısızlık kırmızıyla dövülmez. Yapılmamış etüt "kaçırdın"
 * değil "hâlâ yetişebilirsin"dir; renk kırmızı değil amberdir. Kırmızı
 * yalnızca gerçekten geciken göreve ayrılır ve orada da yumuşak tonda.
 */

const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

/** Saate göre selam — sabah 6'da "iyi akşamlar" demesin. */
const selamla = (ad) => {
    const s = new Date().getHours();
    const bas = s < 6 ? 'İyi geceler' : s < 12 ? 'Günaydın' : s < 18 ? 'İyi çalışmalar' : 'İyi akşamlar';
    return ad ? `${bas}, ${ad}` : bas;
};

export default function BugunEkrani({
    kullanici,
    schedule = {},
    activeMonth = 1,
    activeWeek = 1,
    tasks = [],
    onGorevTamamla,
    messages = [],
    examData = [],
    dailyPomodoros = 0,
    seri = 0,
    onGit,
}) {
    const bugunAdi = GUNLER[new Date().getDay()];
    const [ilerleme, setIlerleme] = useState(() => getProgress(kullanici?.id));
    const [sonIsaretlenen, setSonIsaretlenen] = useState(null);

    useEffect(() => { setIlerleme(getProgress(kullanici?.id)); }, [kullanici?.id]);

    /** Bugünün etütleri — programdaki bu güne ait hücreler, sırasıyla. */
    const bugunEtutleri = useMemo(() => {
        const onek = `m${activeMonth}-w${activeWeek}-${bugunAdi}-`;
        return Object.entries(schedule)
            .filter(([k, v]) => k.startsWith(onek) && v && (v.topic || v.subject))
            .map(([k, v]) => ({
                key: k,
                sira: Number(k.split('-').pop()) || 0,
                ders: v.subject || '',
                konu: v.topic || v.subject || '',
                tur: v.type || 'konu',
                durum: ilerleme[k]?.status || null,
            }))
            .sort((a, b) => a.sira - b.sira);
    }, [schedule, activeMonth, activeWeek, bugunAdi, ilerleme]);

    const biten = bugunEtutleri.filter((e) => e.durum === 'done').length;
    const toplam = bugunEtutleri.length;

    /** Sıradaki adım: işaretlenmemiş ilk etüt. */
    const sonraki = bugunEtutleri.find((e) => e.durum !== 'done');

    /** Bugün ve geçmiş vadeli açık görevler. */
    const bugunSonu = useMemo(() => { const d = new Date(); d.setHours(23, 59, 59, 999); return d; }, []);
    const acikGorevler = useMemo(() => (
        tasks
            .filter((t) => !t.completed && t.status !== 'Tamamlandı')
            .map((t) => {
                const tarih = t.dueDate ? new Date(t.dueDate) : null;
                return { ...t, tarih, geciken: tarih ? tarih < new Date(new Date().toDateString()) : false };
            })
            .filter((t) => !t.tarih || t.tarih <= bugunSonu)
            .sort((a, b) => (b.geciken ? 1 : 0) - (a.geciken ? 1 : 0))
            .slice(0, 4)
    ), [tasks, bugunSonu]);

    /** Koçtan gelen son mesaj. */
    const koctanSon = useMemo(() => (
        [...messages].reverse().find((m) => m.sender === 'coach')
    ), [messages]);

    /** En zayıf ders — "zorlandığın yer", suçlayıcı olmayan bir dille. */
    const zayifDers = useMemo(() => {
        const son = examData.slice(-3);
        if (!son.length) return null;
        const alanlar = [
            { ad: 'Türkçe', anahtar: 'turkce' },
            { ad: 'Matematik', anahtar: 'mat' },
            { ad: 'Fen', anahtar: 'fen' },
            { ad: 'Sosyal', anahtar: 'sosyal' },
        ];
        const ortalamalar = alanlar
            .map((a) => {
                const degerler = son.map((e) => e[a.anahtar]).filter((v) => typeof v === 'number');
                if (!degerler.length) return null;
                return { ...a, ort: degerler.reduce((x, y) => x + y, 0) / degerler.length };
            })
            .filter(Boolean);
        if (ortalamalar.length < 2) return null;
        return ortalamalar.sort((a, b) => a.ort - b.ort)[0];
    }, [examData]);

    /** Günün hedefi: etüt + görev. Tek sayı, tek cümle. */
    const hedefToplam = toplam + acikGorevler.length;
    const hedefBiten = biten + tasks.filter((t) => {
        if (!t.completed && t.status !== 'Tamamlandı') return false;
        const g = t.completedAt ? new Date(t.completedAt) : null;
        return g ? g.toDateString() === new Date().toDateString() : false;
    }).length;
    const gunYuzde = hedefToplam ? Math.round((hedefBiten / hedefToplam) * 100) : 0;

    /** Hiç program, görev ve mesaj yok — öğrenci sisteme yeni bağlanmış. */
    const hicVeriYok = toplam === 0 && acikGorevler.length === 0 && !koctanSon;

    const etutIsaretle = (etut) => {
        const yeniDurum = etut.durum === 'done' ? null : 'done';
        setIlerleme(setCellStatus(kullanici?.id, etut.key, yeniDurum));
        if (yeniDurum === 'done') {
            setSonIsaretlenen(etut.key);
            setTimeout(() => setSonIsaretlenen(null), 900);
            const kalan = toplam - biten - 1;
            bildir(
                kalan > 0 ? `${etut.konu} tamam. ${kalan} etüt kaldı.` : `Günün programını bitirdin 🎉`,
                'basari',
                2600
            );
        }
    };

    return (
        <div className="space-y-5 lg:space-y-6">

            {/* ══ 1. SIRADAKİ ADIM — ekranın en görünür yeri ══════════
                Öğrencinin "şimdi ne yapmalıyım?" sorusu burada, tek
                cümleyle ve tek düğmeyle cevaplanır. */}
            <Card ton="duz" dolgu="yok" className="overflow-hidden">
                <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
                    <p className="tip-label text-ink-3">{selamla(kullanici?.name?.split(' ')[0])}</p>

                    {sonraki ? (
                        <>
                            <div className="mt-2 flex items-start gap-3">
                                <span className="mt-0.5 shrink-0 w-9 h-9 rounded-dmd bg-brand-soft text-brand inline-flex items-center justify-center tip-h4">
                                    {sonraki.sira + 1}
                                </span>
                                <div className="min-w-0">
                                    <p className="tip-label text-brand">SIRADAKİ ETÜT</p>
                                    <h2 className="tip-h3 mt-0.5 break-words">{sonraki.konu}</h2>
                                    {sonraki.ders && sonraki.ders !== sonraki.konu && (
                                        <p className="tip-caption mt-0.5">{sonraki.ders}</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 flex flex-col sm:flex-row gap-2">
                                <Button
                                    simge={Play}
                                    onClick={() => onGit?.('pomodoro')}
                                    className="sm:w-auto"
                                    tamGenislik
                                >
                                    Bu etüde başla
                                </Button>
                                <Button
                                    varyant="ghost"
                                    simge={Check}
                                    onClick={() => etutIsaretle(sonraki)}
                                    className="sm:w-auto"
                                    tamGenislik
                                >
                                    Tamamladım
                                </Button>
                            </div>
                        </>
                    ) : toplam > 0 ? (
                        <div className="mt-2 flex items-start gap-3">
                            <span className="shrink-0 w-9 h-9 rounded-dmd bg-ok-soft text-ok inline-flex items-center justify-center">
                                <Sparkles size={18} />
                            </span>
                            <div>
                                <h2 className="tip-h3">Bugünün programı tamam</h2>
                                <p className="tip-small mt-1">
                                    {toplam} etüdün hepsini bitirdin. İstersen yarının konularına göz atabilirsin.
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* Tek boş durum: neden boş + ne yapabilirsin + eylem.
                           Önce burada ve sayfanın altında İKİ ayrı boş mesaj
                           birden çıkıyordu; aynı şeyi iki kez söylüyorlardı. */
                        <div className="mt-2 flex items-start gap-3">
                            <span className="shrink-0 w-9 h-9 rounded-dmd bg-surface-3 text-ink-3 inline-flex items-center justify-center">
                                <CalendarCheck size={18} />
                            </span>
                            <div className="min-w-0">
                                <h2 className="tip-h3">Bugün için planlı etüt yok</h2>
                                <p className="tip-small mt-1">
                                    {hicVeriYok
                                        ? 'Koçun sana program ve görev atadığında günün burada görünecek. O zamana kadar deneme sonuçlarını inceleyebilir, kendi çalışmanı kaydedebilirsin.'
                                        : 'Koçun program yüklediğinde günün burada görünür. O zamana kadar açık görevlerinle ilerleyebilirsin.'}
                                </p>
                                {hicVeriYok && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <Button varyant="outline" onClick={() => onGit?.('exams')}>
                                            Denemelerime bak
                                        </Button>
                                        <Button varyant="ghost" onClick={() => onGit?.('daily-log')}>
                                            Çalışmamı kaydet
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Günün ilerlemesi — hedefin ne kadarı bitti */}
                {hedefToplam > 0 && (
                    <div className="px-5 py-4 sm:px-6 border-t border-line bg-surface-2 flex items-center gap-4">
                        <HalkaProgress
                            deger={hedefBiten}
                            enFazla={hedefToplam}
                            boyut={54}
                            kalinlik={5}
                            ton={gunYuzde >= 100 ? 'basari' : 'marka'}
                        />
                        <div className="min-w-0 flex-1">
                            <p className="tip-small font-bold text-ink">
                                Bugünün hedefi: {hedefBiten}/{hedefToplam} tamam
                            </p>
                            <p className="tip-caption mt-0.5">
                                {toplam > 0 && `${toplam} etüt`}
                                {toplam > 0 && acikGorevler.length > 0 && ' · '}
                                {acikGorevler.length > 0 && `${acikGorevler.length} görev`}
                            </p>
                        </div>
                        {seri > 0 && (
                            <Badge ton="uyari" hap simge={Flame}>{seri} gün</Badge>
                        )}
                    </div>
                )}
            </Card>

            {/* ══ 2. BUGÜNÜN ETÜTLERİ — tek dokunuşla işaretlenir ═════ */}
            {toplam > 0 && (
                <Card dolgu="yok">
                    <div className="px-5 pt-5 pb-3 sm:px-6 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="tip-h4">Bugünün Programı</h3>
                            <p className="tip-caption mt-0.5">{bugunAdi} · {biten}/{toplam} tamamlandı</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => onGit?.('program')}
                            className="tip-caption text-brand hover:underline shrink-0 min-h-[44px] px-2 -mr-2 rounded-dsm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        >
                            Tümü
                        </button>
                    </div>

                    <Progress deger={biten} enFazla={toplam} ton={biten === toplam ? 'basari' : 'marka'}
                        kalinlik="sm" className="px-5 sm:px-6 pb-3" />

                    <ul className="giris-sirali divide-y divide-line border-t border-line">
                        {bugunEtutleri.map((e) => {
                            const bitti = e.durum === 'done';
                            const yeniIsaret = sonIsaretlenen === e.key;
                            return (
                                <li key={e.key}>
                                    <button
                                        type="button"
                                        onClick={() => etutIsaretle(e)}
                                        aria-pressed={bitti}
                                        className={cn(
                                            'w-full text-left px-5 sm:px-6 py-3 min-h-[56px] flex items-center gap-3',
                                            'transition-colors duration-hizli active:bg-surface-3',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset',
                                            bitti && 'bg-ok-soft/40'
                                        )}
                                    >
                                        {/* Onay işareti çizilir + kutu bir kez nefes alır +
                                            halka söner. Yalnızca YENİ işaretlemede oynar;
                                            sayfa her açıldığında tekrarlamaz. */}
                                        <OnayKutusu isaretli={bitti} yeni={yeniIsaret} boyut={24} />

                                        <span className="min-w-0 flex-1">
                                            <span className={cn(
                                                'tip-small block truncate',
                                                bitti ? 'text-ink-3 line-through' : 'text-ink font-semibold'
                                            )}>
                                                {e.konu}
                                            </span>
                                            {e.ders && e.ders !== e.konu && (
                                                <span className="tip-caption block truncate">{e.ders}</span>
                                            )}
                                        </span>

                                        <span className="tip-mini text-ink-3 shrink-0">{e.sira + 1}. etüt</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </Card>
            )}

            {/* ══ 3. BUGÜNÜN GÖREVLERİ ═══════════════════════════════ */}
            {acikGorevler.length > 0 && (
                <Card dolgu="yok">
                    <div className="px-5 pt-5 pb-3 sm:px-6 flex items-center justify-between gap-3">
                        <h3 className="tip-h4">Görevlerin</h3>
                        <button
                            type="button"
                            onClick={() => onGit?.('tasks')}
                            className="tip-caption text-brand hover:underline shrink-0 min-h-[44px] px-2 -mr-2 rounded-dsm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        >
                            Tümü
                        </button>
                    </div>
                    <ul className="divide-y divide-line border-t border-line">
                        {acikGorevler.map((g) => (
                            <li key={g.id}>
                                <button
                                    type="button"
                                    onClick={() => onGorevTamamla?.(g.id)}
                                    className={cn(
                                        'w-full text-left px-5 sm:px-6 py-3 min-h-[56px] flex items-center gap-3',
                                        'transition-colors duration-hizli active:bg-surface-3',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset'
                                    )}
                                >
                                    <OnayKutusu isaretli={false} boyut={24} />
                                    <span className="min-w-0 flex-1">
                                        <span className="tip-small block truncate text-ink font-semibold">
                                            {g.title || g.baslik || 'Görev'}
                                        </span>
                                        {g.description && (
                                            <span className="tip-caption block truncate">{g.description}</span>
                                        )}
                                    </span>
                                    {/* Geciken görevde bile ton yumuşak: suçlama değil hatırlatma */}
                                    {g.geciken && <Badge ton="uyari" boyut="sm">gecikmiş</Badge>}
                                </button>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}

            {/* ══ 4. KOÇUNDAN + ZORLANDIĞIN YER ══════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
                {koctanSon && (
                    <Card tiklanabilir onClick={() => onGit?.('messages')} role="button" tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onGit?.('messages'); } }}>
                        <div className="flex items-start gap-3">
                            <span className="shrink-0 w-9 h-9 rounded-dmd bg-info-soft text-info inline-flex items-center justify-center">
                                <MessageSquare size={17} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="tip-label text-ink-3">KOÇUNDAN</p>
                                <p className="tip-small mt-1 line-clamp-2 text-ink">{koctanSon.text || koctanSon.content}</p>
                            </div>
                            <ChevronRight size={16} className="text-ink-3 shrink-0 mt-1" aria-hidden="true" />
                        </div>
                    </Card>
                )}

                {zayifDers && (
                    <Card tiklanabilir onClick={() => onGit?.('topics')} role="button" tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onGit?.('topics'); } }}>
                        <div className="flex items-start gap-3">
                            <span className="shrink-0 w-9 h-9 rounded-dmd bg-highlight-soft text-highlight inline-flex items-center justify-center">
                                <Target size={17} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="tip-label text-ink-3">ÜZERİNE GİDİLECEK</p>
                                {/* "En kötü dersin" değil "en çok kazanç burada" çerçevesi */}
                                <p className="tip-small mt-1 text-ink">
                                    <span className="font-bold">{zayifDers.ad}</span> son üç denemede ortalama{' '}
                                    <span className="rakam">{zayifDers.ort.toFixed(1)}</span> net.
                                    Buradaki her doğru toplam puanını en hızlı yükselten yer.
                                </p>
                            </div>
                            <ChevronRight size={16} className="text-ink-3 shrink-0 mt-1" aria-hidden="true" />
                        </div>
                    </Card>
                )}
            </div>

            {/* ══ 5. GÜNÜN ÖZETİ — küçük, tek satır ══════════════════ */}
            <Card ton="sade" className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <Flame size={16} className="text-warn" aria-hidden="true" />
                    <span className="tip-small">
                        Bugün <span className="rakam font-bold text-ink">{dailyPomodoros}</span> odak seansı
                    </span>
                </div>
                <Button varyant="ghost" simge={ArrowRight} simgeSagda onClick={() => onGit?.('pomodoro')}>
                    Odaklan
                </Button>
            </Card>
        </div>
    );
}
