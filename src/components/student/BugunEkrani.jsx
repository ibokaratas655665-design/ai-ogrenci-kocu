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
import KartBasligi from '../ui/KartBasligi';
import { getProgress, setCellStatus } from '../../services/programProgressService';
import { getCellColor } from '../../data/programColors';
import { hucreTarihi, programBaslangici } from '../../services/programProgressService';
import { programUyumu, calismaOzeti, istikrar, motivasyon, gunlukSeri } from '../../services/gelisimAnalitik';
import { MotivasyonSeridi, UyumHalkasi, IsiHaritasi } from '../charts/Analitik';
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

/** Isı haritası ve istikrar penceresi — TEK sayı, iki yerde kullanılır. */
const ISI_GUN = 28;

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
                // Program ızgarasıyla AYNI renk kaynağı (§11): Bugün'de
                // gördüğü mor "Matematik" şeridi programda da mordur.
                renk: getCellColor(v),
                durum: ilerleme[k]?.status || null,
            }))
            .sort((a, b) => a.sira - b.sira);
    }, [schedule, activeMonth, activeWeek, bugunAdi, ilerleme]);

    const biten = bugunEtutleri.filter((e) => e.durum === 'done').length;
    const toplam = bugunEtutleri.length;

    /**
     * HAFTALIK TEMPO — öz düzenlemenin hazırlık ayağı.
     *
     * "Bugün ne yapacağım?"ın yanına "şu ana kadar ne kadar ilerledim?"
     * eklenir. Görünür tempo göstergesi olmadan öğrenci yalnızca o günü
     * görür, gidişatı göremez.
     *
     * SALT OKUNUR: program çizelgesi ve tamamlama kayıtları yalnızca
     * okunur; etüt tamamlama mantığına dokunulmaz.
     */
    const tempo = useMemo(() => {
        const studentId = kullanici?.id;
        if (!studentId) return null;
        try {
            const baslangic = programBaslangici(studentId);
            const tarihCoz = baslangic ? (k) => hucreTarihi(k, baslangic) : null;
            const uyum = programUyumu(studentId, { tarihCoz, gun: 7 });
            const calisma = calismaOzeti(studentId, 7);
            /* 28 gün: ısı haritasıyla AYNI pencere. Ayrı pencereler
               "aktif gün" sayısını iki ekranda iki türlü gösteriyordu. */
            const ist = istikrar(studentId, ISI_GUN);
            return {
                uyum,
                istikrar: ist,
                mesaj: motivasyon({ uyum, calisma, net: { veri: false }, istikrar: ist }),
            };
        } catch {
            return null;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [kullanici?.id, ilerleme, schedule]);

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

    /**
     * 28 GÜNLÜK AKTİVİTE SERİSİ — ısı haritasının kaynağı.
     * study_log'dan türetilir; yeni depo açmaz, hiçbir şey yazmaz.
     */
    const aktivite = useMemo(() => {
        try { return gunlukSeri(kullanici?.id, ISI_GUN); } catch { return []; }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- kayitSurumu bilinçli tetikleyici
    }, [kullanici?.id, kayitSurumu]);

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
        /**
         * MASAÜSTÜ IZGARASI.
         *
         * Ölçüldü: 1440 px ekranda bu ekranın on kartının onu da 1336 px
         * genişliğinde alt alta diziliyordu. "3 gündür aralıksız
         * çalışıyorsun." tek cümlesi ekranın tüm genişliğini kaplıyor,
         * geri kalan her şey için 1.9 ekran kaydırmak gerekiyordu.
         * Mobil düzen 1440 px'e esnetilmişti; masaüstü düzeni yoktu.
         *
         * 12 sütunluk ızgara: solda günün İŞİ (hero, program, görevler),
         * sağda günün ÖLÇÜSÜ (tempo, süreklilik, kısayollar, koç).
         * Telefonda tek sütuna iner ve okuma sırası bozulmaz — sol
         * sütun önce gelir.
         */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start">

            {/* ═══════════════ SOL: GÜNÜN İŞİ ═══════════════ */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4 lg:space-y-5 min-w-0">

                {/* ── HERO — referanstaki krem "günlük hedef" bloğu ──
                    Selamlama, günün hedefi ve tek birincil eylem burada
                    birleşir. Önceden bunlar üç ayrı blok hâlinde alt
                    alta duruyordu ve hiçbiri diğerine bakmıyordu. */}
                <div
                    className="relative overflow-hidden rounded-dlg px-5 py-5 sm:px-7 sm:py-6"
                    style={{ background: 'var(--krem)', border: '1px solid var(--krem-line)' }}
                >
                    {/* Sağ üstte yumuşak turuncu leke — referanstaki
                        illüstrasyonun yerini tutan sessiz doku. */}
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full"
                        style={{ background: 'color-mix(in srgb, var(--brand) 12%, transparent)' }}
                    />

                    <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
                        <div className="min-w-0 flex-1">
                            <p className="tip-label" style={{ color: 'var(--brand-metin)' }}>
                                Merhaba 👋 {kullanici?.name?.split(' ')[0] || 'Öğrenci'}
                            </p>
                            <h2 className="text-2xl sm:text-[2rem] font-black text-ink syne tracking-tight leading-[1.1] mt-1">
                                {hedefToplam > 0 ? 'Günlük Hedefin' : 'Bugüne Hazırsın'}
                            </h2>
                            <p className="tip-small text-ink-2 mt-2 max-w-[46ch]">
                                {hedefToplam > 0
                                    ? <>Bugünün <strong className="text-ink">{hedefToplam}</strong> işinden <strong className="text-ink">{hedefBiten}</strong> tanesi tamam. {gunlukMotivasyon}</>
                                    : gunlukMotivasyon}
                            </p>

                            <div className="mt-4 flex flex-wrap items-center gap-2.5">
                                {sonraki ? (
                                    <button
                                        type="button"
                                        onClick={() => onGit?.('pomodoro')}
                                        className="on-color inline-flex items-center gap-2.5 rounded-full pl-5 pr-2 py-2 text-[15px] font-black shadow-yuzen transition-transform duration-hizli active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                                        style={{ background: 'var(--brand)' }}
                                    >
                                        Derse Devam Et
                                        <span className="w-8 h-8 rounded-full bg-white/25 inline-flex items-center justify-center">
                                            <Play size={15} />
                                        </span>
                                    </button>
                                ) : toplam > 0 ? (
                                    <span className="inline-flex items-center gap-2 rounded-full px-4 py-2 tip-small font-bold bg-ok-soft text-ok">
                                        <Sparkles size={15} /> Bugünün programı tamam 🎉
                                    </span>
                                ) : (
                                    <Button varyant="outline" onClick={() => onGit?.('daily-log')}>
                                        Çalışmamı kaydet
                                    </Button>
                                )}
                                {sonraki && (
                                    <span className="tip-caption truncate max-w-[24ch]">
                                        Sıradaki: {sonraki.konu}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Halka hero'nun içinde: hedef ve ilerleme aynı
                            bakışta. Ayrı kartta olduğunda ikisi arasında
                            göz gezdirmek gerekiyordu. */}
                        {hedefToplam > 0 && (
                            <UyumHalkasi
                                oran={gunYuzde}
                                tamamlanan={hedefBiten}
                                planlanan={hedefToplam}
                                altMetin={`${hedefBiten} / ${hedefToplam} iş`}
                                ton="marka"
                                boyut={112}
                                className="shrink-0 self-center"
                            />
                        )}
                    </div>
                </div>

                {/* ── KISAYOLLAR — hero'nun altında yatay şerit ─────
                    Sağ sütunda dikey 2x2 iken o sütunu sol sütundan
                    456 px uzatıyordu: sayfanın sağ yarısı tek başına
                    aşağı uzuyor, sol yarısı erken bitiyordu. Dört hedef
                    yatayda yan yana hem iki sütunu dengeliyor hem de
                    referanstaki dörtlü kısayol şeridine karşılık geliyor. */}
                <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
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
                            className="cipp min-h-[84px] transition-transform duration-hizli active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        >
                            <span className={cn('cip-ikon', k.ton)}><k.simge size={16} /></span>
                            <span className="cip-etiket normal-case tracking-normal text-[10px]">{k.etiket}</span>
                        </button>
                    ))}
                </div>

                {/* ── BUGÜNÜN PROGRAMI ────────────────────────────── */}
                {toplam > 0 ? (
                    <Card dolgu="yok">
                        <div className="px-5 pt-5 pb-3 sm:px-6">
                            <KartBasligi
                                simge={CalendarCheck}
                                baslik="Bugünün Programı"
                                alt={`${bugunAdi} · ${biten}/${toplam} etüt tamamlandı`}
                                eylem={
                                    <button
                                        type="button"
                                        onClick={() => onGit?.('program')}
                                        className="tip-caption font-bold hover:underline min-h-[44px] px-2 -mr-2 rounded-dsm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                                        style={{ color: 'var(--brand-metin)' }}
                                    >
                                        Tümü
                                    </button>
                                }
                            />
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
                                                'w-full text-left px-5 sm:px-6 py-3 min-h-[60px] flex items-center gap-3',
                                                'transition-colors duration-hizli active:bg-surface-3 hover:bg-surface-2',
                                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset',
                                                bitti && 'bg-ok-soft/40'
                                            )}
                                        >
                                            <OnayKutusu isaretli={bitti} yeni={yeniIsaret} boyut={24} />

                                            {/* Ders rengi şeridi — programdaki hücreyle aynı renk */}
                                            <span
                                                aria-hidden="true"
                                                className="w-1 self-stretch rounded-full shrink-0"
                                                style={{ backgroundColor: e.renk?.accent || 'transparent' }}
                                            />

                                            <span className="min-w-0 flex-1">
                                                <span className={cn(
                                                    'tip-small block truncate',
                                                    bitti ? 'text-ink-3 line-through' : 'text-ink font-bold'
                                                )}>
                                                    {e.konu}
                                                </span>
                                                {e.ders && e.ders !== e.konu && (
                                                    <span className="tip-caption block truncate">{e.ders}</span>
                                                )}
                                            </span>

                                            <span className="tip-mini text-ink-3 shrink-0 tabular-nums">{e.sira + 1}. etüt</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
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
                        </div>
                    </Card>
                )}

                {/* ── GÖREVLER ────────────────────────────────────── */}
                {acikGorevler.length > 0 && (
                    <Card dolgu="yok">
                        <div className="px-5 pt-5 pb-3 sm:px-6">
                            <KartBasligi
                                simge={Target}
                                baslik="Görevlerin"
                                alt={`${acikGorevler.length} açık görev`}
                                eylem={
                                    <button
                                        type="button"
                                        onClick={() => onGit?.('tasks')}
                                        className="tip-caption font-bold hover:underline min-h-[44px] px-2 -mr-2 rounded-dsm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                                        style={{ color: 'var(--brand-metin)' }}
                                    >
                                        Tümü
                                    </button>
                                }
                            />
                        </div>
                        <ul className="divide-y divide-line border-t border-line">
                            {acikGorevler.map((g) => (
                                <li key={g.id}>
                                    <button
                                        type="button"
                                        onClick={() => onGorevTamamla?.(g.id)}
                                        className={cn(
                                            'w-full text-left px-5 sm:px-6 py-3 min-h-[56px] flex items-center gap-3',
                                            'transition-colors duration-hizli active:bg-surface-3 hover:bg-surface-2',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset'
                                        )}
                                    >
                                        <OnayKutusu isaretli={false} boyut={24} />
                                        <span className="min-w-0 flex-1">
                                            <span className="tip-small block truncate text-ink font-bold">
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

                {/* ── KOÇUNDAN / ÜZERİNE GİDİLECEK ────────────────── */}
                {(koctanSon || zayifDers) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {koctanSon && (
                            <Card tiklanabilir onClick={() => onGit?.('messages')} role="button" tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onGit?.('messages'); } }}>
                                <div className="flex items-start gap-3">
                                    <span className="shrink-0 w-9 h-9 rounded-dmd bg-brand-soft inline-flex items-center justify-center"
                                        style={{ color: 'var(--brand-metin)' }}>
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
                )}
            </div>

            {/* ═══════════════ SAĞ: GÜNÜN ÖLÇÜSÜ ═══════════════ */}
            <aside className="lg:col-span-5 xl:col-span-4 space-y-4 lg:space-y-5 min-w-0">

                {/* ── HAFTALIK TEMPO ──────────────────────────────── */}
                {tempo?.uyum?.veri && (
                    <Card>
                        <KartBasligi
                            simge={BarChart3}
                            baslik="Bu Haftaki Tempon"
                            alt={`Günü gelen ${tempo.uyum.planlanan} etüdün ${tempo.uyum.tamamlanan} tanesi tamam`}
                        />
                        <div className="mt-4 flex items-center gap-4">
                            <UyumHalkasi
                                oran={tempo.uyum.oran}
                                tamamlanan={tempo.uyum.tamamlanan}
                                planlanan={tempo.uyum.planlanan}
                                boyut={86}
                                className="shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                                <Button varyant="outline" simge={ArrowRight} simgeSagda onClick={() => onGit?.('program')}>
                                    Programım
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Motivasyon — YALNIZCA gerçekten olmuş bir başarı varsa */}
                <MotivasyonSeridi metin={tempo?.mesaj} />

                {/* ── ÇALIŞMA SÜREKLİLİĞİ — 28 günlük ısı haritası ──
                    Süreklilik bir DESENDİR; deseni ancak takvim gösterir.
                    Kayıt olmayan gün ile sıfır çözülen gün ayrı çizilir —
                    "girmedim" ile "çalışmadım" aynı şey değildir. */}
                {aktivite.some((g) => g.kayit) && (
                    <Card>
                        <KartBasligi
                            simge={Flame}
                            baslik={`Çalışma Serin · ${tempo?.istikrar?.guncelZincir ?? seri} gün`}
                            alt={`Son ${ISI_GUN} günün ${tempo?.istikrar?.aktifGun ?? aktivite.filter((g) => g.kayit).length}'inde kayıt var${tempo?.istikrar?.enUzunZincir > 0 ? ` · en uzun ${tempo.istikrar.enUzunZincir} gün` : ''}`}
                        />
                        <IsiHaritasi seri={aktivite} alan="soru" className="mt-4" />
                    </Card>
                )}

                {/* ── BU HAFTA ────────────────────────────────────── */}
                {hafta && hafta.entries > 0 && (
                    <Card>
                        <KartBasligi
                            simge={PencilLine}
                            baslik="Bu Hafta"
                            alt="Son 7 günün çalışma özeti"
                            eylem={
                                <button
                                    type="button"
                                    onClick={() => onGit?.('daily-log')}
                                    className="tip-caption font-bold hover:underline min-h-[44px] px-2 -mr-2 rounded-dsm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                                    style={{ color: 'var(--brand-metin)' }}
                                >
                                    Kayıt gir
                                </button>
                            }
                        />
                        <div className="mt-4 grid grid-cols-2 gap-2.5">
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
                        {gelisim && (
                            <p className={cn(
                                'mt-3 rounded-dsm px-3 py-2 tip-small font-semibold',
                                gelisim.fark > 0 ? 'text-ok bg-ok-soft/50' : gelisim.fark < 0 ? 'text-warn bg-warn-soft/40' : 'text-ink-2 bg-surface-2'
                            )}>
                                {gelisim.mesaj}
                            </p>
                        )}
                    </Card>
                )}


                {/* ── GÜNÜN ODAK ÖZETİ ────────────────────────────── */}
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
            </aside>
        </div>
    );
}
