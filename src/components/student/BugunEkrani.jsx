import React, { useMemo, useState, useEffect } from 'react';
import {
    Play, ArrowRight, MessageSquare, Flame,
    CalendarCheck, Sparkles, Target, ChevronRight,
    PencilLine, BookX, BarChart3,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Progress from '../ui/Progress';
import OnayKutusu from '../ui/OnayKutusu';
import { getProgress, setCellStatus } from '../../services/programProgressService';
import { getSummary, getToday } from '../../services/studyLogService';
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

/**
 * Günlük motivasyon — tarihe bağlı döner; aynı gün hep aynı cümle,
 * ertesi gün yenisi. Suçlayıcı değil, ileri bakan bir dil.
 */
const MOTIVASYONLAR = [
    'Bugün harika bir gün olacak!',
    'Küçük adımlar, büyük başarıların anahtarıdır.',
    'Dün yaptığından bir soru fazlası bile ilerlemektir.',
    'Zor soru, güçlenen zihin demektir.',
    'Bugün yaptığın çalışma, yarınki netindir.',
    'Düzenli çalışan, sınav günü rahat olur.',
    'Hata, öğrenmenin ham maddesidir — kaydet, çöz, geç.',
    'Hedefine bir gün daha yaklaşıyorsun.',
    'Odaklandığın 25 dakika, dağınık 2 saatten değerlidir.',
    'Seri bozulmaz, sen bozdurmazsan.',
    'En iyi zaman şimdi; ikinci en iyi zaman yine şimdi.',
    'Netler tesadüf değil, alışkanlık işidir.',
    'Bir konu daha, bir adım daha.',
    'Bugünü kazan; hafta kendiliğinden gelir.',
];
const gunlukMotivasyonSec = () => {
    const simdi = new Date();
    const yilinGunu = Math.floor((simdi - new Date(simdi.getFullYear(), 0, 0)) / 86400000);
    return MOTIVASYONLAR[yilinGunu % MOTIVASYONLAR.length];
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

    /**
     * Koçtan gelen son mesaj — yalnızca öğrenci HENÜZ AÇMADIYSA.
     *
     * "Bugün" günlük iş listesidir: öğrenci Mesajlar sekmesini açınca
     * StudentDashboard cihaza bir görülme damgası yazar ve damgadan
     * eski mesajlar bu karttan düşer. Damga yalnızca GÖRÜNÜMÜ etkiler —
     * mesajın kendisi, geçmişi ve koç tarafındaki kayıt silinmez
     * (okundu işareti gibi cihaz-yereldir, bilerek senkronlanmaz).
     */
    const koctanSon = useMemo(() => {
        const son = [...messages].reverse().find((m) => m.sender === 'coach');
        if (!son) return null;
        try {
            const goruldu = localStorage.getItem(`bugun_mesaj_goruldu_${kullanici?.id}`);
            if (goruldu && son.timestamp && new Date(son.timestamp) <= new Date(goruldu)) return null;
        } catch { /* damga okunamazsa kart görünür kalır — güvenli taraf */ }
        return son;
    }, [messages, kullanici?.id]);

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

    /**
     * BU HAFTA şeridi — günlük kayıtlardan (study_log) gerçek toplamlar.
     * "Bu sistem benim gelişimimi takip ediyor" hissinin veri ayağı:
     * öğrenci kayıt girdikçe burası aynı gün değişir.
     */
    /* Kayıt girildiği anda kartlar tazelensin (studyLogService her
       yazımda 'storage' olayı yayar). */
    const [kayitSurumu, setKayitSurumu] = useState(0);
    useEffect(() => {
        const tetik = (e) => { if (!e?.key || e.key === 'study_log') setKayitSurumu((v) => v + 1); };
        window.addEventListener('storage', tetik);
        return () => window.removeEventListener('storage', tetik);
    }, []);

    const hafta = useMemo(() => {
        try { return getSummary(kullanici?.id, 7); } catch { return null; }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- kayitSurumu bilinçli tetikleyici
    }, [kullanici?.id, kayitSurumu]);

    /** Bugünün toplamları (soru/dakika) — "Bugünkü Hedefin" kartı. */
    const bugunToplam = useMemo(() => {
        try { return getToday(kullanici?.id); } catch { return { questions: 0, minutes: 0 }; }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- kayitSurumu bilinçli tetikleyici
    }, [kullanici?.id, ilerleme, kayitSurumu]);

    const gunlukMotivasyon = useMemo(() => gunlukMotivasyonSec(), []);

    /** Gelişim mesajı — son iki denemenin net farkından, yapıcı dille. */
    const gelisim = useMemo(() => {
        const sirali = [...examData]
            .filter((e) => Number.isFinite(parseFloat(e.totalNet)))
            .sort((a, b) => new Date(a.date || a.uploadedAt) - new Date(b.date || b.uploadedAt));
        if (sirali.length < 2) return null;
        const son = parseFloat(sirali[sirali.length - 1].totalNet);
        const onceki = parseFloat(sirali[sirali.length - 2].totalNet);
        const fark = Math.round((son - onceki) * 100) / 100;
        if (fark > 0) return { fark, mesaj: `Son denemende ${fark} net artış var — bu tempo seni taşır! 🚀` };
        if (fark === 0) return { fark, mesaj: 'Son iki denemen başa baş — küçük bir hamle seni öne geçirir.' };
        return { fark, mesaj: `Son denemende ${Math.abs(fark)} net düşüş var — birlikte toparlanacak yeriniz belli.` };
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
        <div className="space-y-4 lg:space-y-5">

            {/* ══ 1. SELAMLAMA + GÜNLÜK MOTİVASYON ════════════════════ */}
            <div className="px-1">
                <p className="tip-label text-ink-3">Merhaba 👋</p>
                <h2 className="text-2xl sm:text-3xl font-black text-ink syne tracking-tight mt-0.5">
                    {kullanici?.name?.split(' ')[0] || 'Öğrenci'}!
                </h2>
                <p className="tip-small text-ink-2 mt-1">{gunlukMotivasyon}</p>
            </div>

            {/* ══ 2. ÇALIŞMA SERİSİ ═══════════════════════════════════ */}
            {seri > 0 && (
                <Card dolgu="md" className="flex items-center gap-4">
                    <span className="shrink-0 w-11 h-11 rounded-2xl bg-warn-soft text-warn flex items-center justify-center">
                        <Flame size={22} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="tip-small font-black text-ink">Çalışma Serin · {seri} gün</p>
                        <p className="tip-caption mt-0.5">Devam et, hedefine ulaş!</p>
                    </div>
                </Card>
            )}

            {/* ══ 3. BUGÜNKÜ HEDEFİN — sayılar ve ilerleme ═══════════ */}
            <Card dolgu="yok">
                <div className="px-5 pt-4 pb-3 sm:px-6 flex items-center justify-between">
                    <h3 className="tip-h4">Bugünkü Hedefin</h3>
                    {seri > 0 && <Badge ton="uyari" hap simge={Flame}>{seri} gün</Badge>}
                </div>
                <div className="px-5 sm:px-6 pb-3 grid grid-cols-4 gap-2">
                    {[
                        { deger: bugunToplam.questions, etiket: 'Soru' },
                        { deger: hedefBiten, etiket: 'Tamamlanan' },
                        { deger: bugunToplam.minutes ? `${bugunToplam.minutes}dk` : '0dk', etiket: 'Dakika' },
                        { deger: `%${gunYuzde}`, etiket: 'İlerleme' },
                    ].map((s) => (
                        <div key={s.etiket} className="text-center">
                            <p className="text-lg sm:text-xl font-black text-ink syne rakam">{s.deger}</p>
                            <p className="tip-mini text-ink-3 uppercase tracking-wider mt-0.5">{s.etiket}</p>
                        </div>
                    ))}
                </div>
                {hedefToplam > 0 && (
                    <Progress deger={hedefBiten} enFazla={hedefToplam}
                        ton={gunYuzde >= 100 ? 'basari' : 'marka'} kalinlik="sm"
                        className="px-5 sm:px-6 pb-4" />
                )}
            </Card>

            {/* ══ 4. BUGÜNÜ BAŞLAT — tek büyük eylem ═════════════════ */}
            {sonraki ? (
                <button
                    type="button"
                    onClick={() => onGit?.('pomodoro')}
                    className="on-color w-full rounded-2xl px-5 py-4 flex items-center justify-between gap-3 text-left shadow-yuzen transition-transform duration-hizli active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                    style={{ background: 'var(--grad-mor)' }}
                >
                    <span className="min-w-0">
                        <span className="block text-[15px] font-black">Bugünü Başlat</span>
                        <span className="block text-xs font-semibold opacity-85 truncate mt-0.5">
                            Sıradaki: {sonraki.konu}{sonraki.ders && sonraki.ders !== sonraki.konu ? ` · ${sonraki.ders}` : ''}
                        </span>
                    </span>
                    <span className="shrink-0 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Play size={18} />
                    </span>
                </button>
            ) : toplam > 0 ? (
                <Card dolgu="md" className="flex items-center gap-3">
                    <span className="shrink-0 w-9 h-9 rounded-dmd bg-ok-soft text-ok inline-flex items-center justify-center">
                        <Sparkles size={18} />
                    </span>
                    <div>
                        <p className="tip-small font-black text-ink">Bugünün programı tamam 🎉</p>
                        <p className="tip-caption mt-0.5">{toplam} etüdün hepsini bitirdin.</p>
                    </div>
                </Card>
            ) : (
                <Card dolgu="md" className="flex items-start gap-3">
                    <span className="shrink-0 w-9 h-9 rounded-dmd bg-surface-3 text-ink-3 inline-flex items-center justify-center">
                        <CalendarCheck size={18} />
                    </span>
                    <div className="min-w-0">
                        <p className="tip-small font-black text-ink">Bugün için planlı etüt yok</p>
                        <p className="tip-caption mt-1">
                            {hicVeriYok
                                ? 'Koçun program atadığında günün burada görünecek. O zamana kadar kendi çalışmanı kaydedebilirsin.'
                                : 'Koçun program yüklediğinde günün burada görünür. Açık görevlerinle ilerleyebilirsin.'}
                        </p>
                        {hicVeriYok && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Button varyant="outline" onClick={() => onGit?.('daily-log')}>Çalışmamı kaydet</Button>
                                <Button varyant="ghost" onClick={() => onGit?.('exams')}>Denemelerime bak</Button>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* ══ 5. KISAYOLLAR — dört renkli hedef ══════════════════ */}
            <div>
                <p className="tip-label text-ink-3 mb-2 px-1">Kısayollar</p>
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                    {[
                        { id: 'daily-log', etiket: 'Günlük Kayıt', simge: PencilLine, ton: 'cip-yesil' },
                        { id: 'error-notebook', etiket: 'Hata Defteri', simge: BookX, ton: 'cip-turuncu' },
                        { id: 'deneme-analizi', etiket: 'Deneme Analizi', simge: BarChart3, ton: 'cip-mor' },
                        { id: 'program', etiket: 'Programım', simge: CalendarCheck, ton: 'cip-mavi' },
                    ].map((k) => (
                        <button
                            key={k.id}
                            type="button"
                            onClick={() => onGit?.(k.id)}
                            className="cipp min-h-[86px] transition-transform duration-hizli active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        >
                            <span className={cn('cip-ikon', k.ton)}><k.simge size={16} /></span>
                            <span className="cip-etiket normal-case tracking-normal text-[10px]">{k.etiket}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ══ 1c. BU HAFTA — günlük kayıtlardan gerçek gelişim ════
                Referans tasarımdaki "Bu Hafta" şeridi: soru, süre,
                isabet ve gün gün mini çubuklar. Kayıt yoksa kart
                görünmez — sahte sayı basılmaz. */}
            {hafta && hafta.entries > 0 && (
                <Card dolgu="yok">
                    <div className="px-5 pt-5 pb-3 sm:px-6 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="tip-h4">Bu Hafta</h3>
                            <p className="tip-caption mt-0.5">Son 7 günün çalışma özeti</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => onGit?.('daily-log')}
                            className="tip-caption text-brand hover:underline shrink-0 min-h-[44px] px-2 -mr-2 rounded-dsm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        >
                            Günlük Kayıt
                        </button>
                    </div>
                    <div className="px-5 sm:px-6 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { etiket: 'Soru', deger: hafta.questions },
                            { etiket: 'Süre', deger: hafta.minutes >= 60 ? `${Math.floor(hafta.minutes / 60)}s ${hafta.minutes % 60}d` : `${hafta.minutes}d` },
                            { etiket: 'İsabet', deger: hafta.accuracy != null ? `%${hafta.accuracy}` : '—' },
                            { etiket: 'Aktif Gün', deger: `${hafta.activeDays}/7` },
                        ].map((s) => (
                            <div key={s.etiket} className="rounded-dmd bg-surface-2 border border-line px-3 py-2.5">
                                <p className="tip-mini text-ink-3 uppercase tracking-wider">{s.etiket}</p>
                                <p className="tip-h4 text-ink rakam mt-0.5">{s.deger}</p>
                            </div>
                        ))}
                    </div>
                    <div className="px-5 sm:px-6 pb-4 flex items-end gap-1.5 h-14" aria-hidden="true">
                        {hafta.byDay.map((g) => {
                            const tavan = Math.max(...hafta.byDay.map((x) => x.questions), 1);
                            return (
                                <div key={g.date} className="flex-1 flex flex-col justify-end">
                                    <div
                                        className="rounded-t-sm bg-brand/70 min-h-[3px] transition-all"
                                        style={{ height: `${Math.round((g.questions / tavan) * 100)}%` }}
                                        title={`${g.date}: ${g.questions} soru`}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    {gelisim && (
                        <div className={cn(
                            'px-5 sm:px-6 py-3 border-t border-line tip-small font-semibold',
                            gelisim.fark > 0 ? 'text-ok bg-ok-soft/40' : gelisim.fark < 0 ? 'text-warn bg-warn-soft/30' : 'text-ink-2 bg-surface-2'
                        )}>
                            {gelisim.mesaj}
                        </div>
                    )}
                </Card>
            )}

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
