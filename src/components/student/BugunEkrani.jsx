import React, { useMemo, useState, useEffect } from 'react';
import {
    Play, ArrowRight, MessageSquare, Flame, CalendarCheck, Sparkles, Target, ChevronRight, PencilLine, BookX, BarChart3, Clock, Timer, BookOpen,
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

/** Etüt türünün okunur karşılığı — satırın ikincil açıklaması. */
const ACTIVITY_ETIKET = {
    konu: 'Konu anlatımı', soru: 'Soru çözümü', tekrar: 'Tekrar',
    deneme: 'Deneme', analiz: 'Deneme analizi', paragraf: 'Paragraf',
    kitap: 'Kitap okuma', mola: 'Mola',
};

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

    /**
     * GÜNÜN BİTMESİNE KALAN SÜRE.
     *
     * Dakikada bir yenilenir: saat 23:58'de "14 sa 32 dk" yazması
     * ekranın donduğu izlenimi verirdi. Saniyede bir yenilemek ise
     * bütün ekranı gereksiz yere yeniden çizerdi.
     */
    const [simdi, setSimdi] = useState(() => new Date());
    useEffect(() => {
        const t = setInterval(() => setSimdi(new Date()), 60000);
        return () => clearInterval(t);
    }, []);

    const kalanSure = useMemo(() => {
        const bitis = new Date(simdi);
        bitis.setHours(23, 59, 59, 999);
        const dk = Math.max(0, Math.round((bitis - simdi) / 60000));
        return { saat: Math.floor(dk / 60), dakika: dk % 60 };
    }, [simdi]);

    /**
     * NOT — SAAT SÜTUNU YOK.
     *
     * Referans görselde etüt satırlarında saat aralığı vardı
     * (09:00-10:00, 60 dk) ve bir süre varsayılan bir şemadan
     * türetiliyordu. Kaldırıldı: programda etüt SAATİ tutulmuyor,
     * yalnızca gün ve sıra var (m1-w1-Pazartesi-0). Türetilmiş saat
     * öğrenciye kesin bir randevu gibi görünür ve olmayan bir
     * taahhüdü varmış gibi gösterirdi. Yerine gerçek olan yazılıyor:
     * kaçıncı etüt olduğu.
     */

    /**
     * HAFTALIK PROGRAM DURUMU — üç kova, örtüşmez.
     *
     * "Devam eden" = günü gelmiş ama işaretlenmemiş etüt.
     * "Kalan" = günü henüz gelmemiş. Toplamları haftanın tamamını verir.
     */
    const haftalikDurum = useMemo(() => {
        const u = tempo?.uyum;
        if (!u?.veri) return null;
        return {
            tamamlanan: u.tamamlanan,
            devamEden: u.kacirilan,
            kalan: u.bekleyen,
            toplam: u.tamamlanan + u.kacirilan + u.bekleyen,
            oran: u.oran,
        };
    }, [tempo]);

    /** Son 7 günün aktiflik deseni — odak serisi şeridi. */
    const haftaSeridi = useMemo(() => {
        const gunAd = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
        const son7 = aktivite.slice(-7);
        return son7.map((g, i) => ({ ad: gunAd[i] || '', aktif: Boolean(g?.kayit), tarih: g?.tarih }));
    }, [aktivite]);

    /**
     * BUGÜN SENİ BEKLEYENLER — programdan ve kayıtlardan türetilir.
     * Uydurma öneri yok: her satırın arkasında gerçek bir sayı var.
     */
    const bekleyenler = useMemo(() => {
        const liste = [];
        const yapilmamis = bugunEtutleri.filter((e) => e.durum !== 'done');
        const deneme = yapilmamis.filter((e) => e.tur === 'deneme');
        const tekrar = yapilmamis.filter((e) => e.tur === 'tekrar');
        if (deneme.length) {
            liste.push({ id: 'deneme', simge: BarChart3, baslik: `${deneme.length} deneme çözümü`,
                alt: deneme.map((d) => d.ders).filter(Boolean).join(', ') || 'Programında planlı', git: 'deneme-analizi' });
        }
        if (tekrar.length) {
            liste.push({ id: 'tekrar', simge: CalendarCheck, baslik: `${tekrar.length} konu tekrarı`,
                alt: tekrar.map((t) => t.konu).slice(0, 2).join(', '), git: 'program' });
        }
        if (acikGorevler.length) {
            liste.push({ id: 'gorev', simge: Target, baslik: `${acikGorevler.length} açık görev`,
                alt: acikGorevler[0]?.title || acikGorevler[0]?.baslik || '', git: 'tasks' });
        }
        return liste;
    }, [bugunEtutleri, acikGorevler]);

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

            {/* ══ 1. SELAMLAMA ═══════════════════════════════════════ */}
            <div>
                <p className="tip-label" style={{ color: 'var(--brand-metin)' }}>
                    Merhaba {kullanici?.name?.split(' ')[0] || 'Öğrenci'} 👋
                </p>
                <h2 className="text-2xl sm:text-[2rem] font-black text-ink syne tracking-tight leading-[1.1] mt-1">
                    Bugün senin günün!
                </h2>
                <p className="tip-small text-ink-2 mt-1.5">{gunlukMotivasyon}</p>
            </div>

            {/* ══ 2. DÖRT ÖLÇÜM ══════════════════════════════════════
                Referanstaki KPI şeridi. Dördü de BUGÜNE ait ve
                birbirinden farklı soruyu yanıtlıyor: ne kadar iş var,
                ne kadarı programa uygun gitti, ne kadar zaman kaldı,
                ne kadar çalıştım. */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                <Card dolgu="md" className="flex items-center gap-3">
                    <span className="shrink-0 w-11 h-11 rounded-2xl grid place-items-center"
                        style={{ background: 'var(--brand-soft)', color: 'var(--brand-metin)' }}>
                        <Target size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="tip-mini text-ink-3 uppercase tracking-wider m-0">Günlük Hedef</p>
                        <p className="text-xl font-black text-ink rakam leading-none mt-0.5 m-0">
                            {toplam}<span className="tip-mini text-ink-3 font-bold ml-1">etüt</span>
                        </p>
                        <p className="tip-mini text-ink-3 m-0 mt-0.5">{biten} / {toplam} tamamlandı</p>
                        <Progress deger={biten} enFazla={Math.max(1, toplam)} ton="marka" kalinlik="sm" className="mt-1.5" />
                    </div>
                </Card>

                <Card dolgu="md" className="flex items-center gap-3">
                    <UyumHalkasi
                        oran={toplam ? Math.round((biten / toplam) * 100) : 0}
                        tamamlanan={biten} planlanan={toplam}
                        altMetin="" ton="marka" boyut={44}
                        className="shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                        <p className="tip-mini text-ink-3 uppercase tracking-wider m-0">Günün Uyumu</p>
                        <p className="text-xl font-black text-ink rakam leading-none mt-0.5 m-0">
                            %{toplam ? Math.round((biten / toplam) * 100) : 0}
                        </p>
                        <p className="tip-mini text-ink-3 m-0 mt-0.5">Programına göre</p>
                    </div>
                </Card>

                <Card dolgu="md" className="flex items-center gap-3">
                    <span className="shrink-0 w-11 h-11 rounded-2xl grid place-items-center bg-warn-soft text-warn">
                        <Clock size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="tip-mini text-ink-3 uppercase tracking-wider m-0">Kalan Süre</p>
                        <p className="text-xl font-black text-ink rakam leading-none mt-0.5 m-0">
                            {kalanSure.saat}<span className="tip-mini text-ink-3 font-bold mx-1">sa</span>
                            {kalanSure.dakika}<span className="tip-mini text-ink-3 font-bold ml-1">dk</span>
                        </p>
                        <p className="tip-mini text-ink-3 m-0 mt-0.5">Günün bitmesine</p>
                    </div>
                </Card>

                <Card dolgu="md" className="flex items-center gap-3">
                    <span className="shrink-0 w-11 h-11 rounded-2xl grid place-items-center bg-ok-soft text-ok">
                        <Timer size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="tip-mini text-ink-3 uppercase tracking-wider m-0">Toplam Süre</p>
                        <p className="text-xl font-black text-ink rakam leading-none mt-0.5 m-0">
                            {bugunToplam.minutes || 0}<span className="tip-mini text-ink-3 font-bold ml-1">dk</span>
                        </p>
                        <p className="tip-mini text-ink-3 m-0 mt-0.5">Bugün çalıştığın</p>
                    </div>
                </Card>
            </div>

            {/* ══ 3. ANA IZGARA ══════════════════════════════════════ */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 xl:gap-5 items-start">

                {/* ─── SOL: BUGÜNKÜ ÇALIŞMA PLANIN ─── */}
                <div className="xl:col-span-8 min-w-0 space-y-4">
                    <Card dolgu="yok">
                        <div className="px-5 pt-5 pb-3 sm:px-6 flex items-center justify-between gap-3">
                            <h3 className="text-[13px] sm:text-sm font-black text-ink uppercase tracking-[0.06em] m-0">
                                Bugünkü Çalışma Planın
                            </h3>
                            <button type="button" onClick={() => onGit?.('program')}
                                className="tip-caption font-bold hover:underline min-h-[44px] px-2 -mr-2 rounded-dsm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                                style={{ color: 'var(--brand-metin)' }}>
                                Tümünü Gör →
                            </button>
                        </div>

                        {toplam === 0 ? (
                            <div className="px-5 sm:px-6 pb-6 pt-2">
                                <p className="tip-small font-black text-ink m-0">Bugün için planlı etüt yok</p>
                                <p className="tip-caption mt-1">
                                    {hicVeriYok
                                        ? 'Koçun program atadığında günün burada görünecek. O zamana kadar kendi çalışmanı kaydedebilirsin.'
                                        : 'Koçun program yüklediğinde günün burada görünür.'}
                                </p>
                                <div className="mt-3">
                                    <Button varyant="outline" onClick={() => onGit?.('daily-log')}>Çalışmamı kaydet</Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <ul className="giris-sirali divide-y divide-line border-t border-line">
                                    {bugunEtutleri.map((e) => {
                                        const bitti = e.durum === 'done';
                                        const yeniIsaret = sonIsaretlenen === e.key;
                                        const sirada = !bitti && sonraki?.key === e.key;
                                        return (
                                            <li key={e.key} className={cn('px-5 sm:px-6 py-3 flex items-center gap-3', bitti && 'bg-ok-soft/30')}>
                                                {/* Ders rengi kare — programdaki hücreyle aynı renk */}
                                                <span aria-hidden="true"
                                                    className="shrink-0 w-11 h-11 rounded-dmd grid place-items-center"
                                                    style={{
                                                        background: `color-mix(in srgb, ${e.renk?.accent || 'var(--ink-3)'} 14%, transparent)`,
                                                        color: e.renk?.accent || 'var(--ink-3)',
                                                    }}>
                                                    <BookOpen size={18} />
                                                </span>

                                                <span className="min-w-0 flex-1">
                                                    <span className="tip-mini font-black uppercase tracking-wider block truncate"
                                                        style={{ color: e.renk?.accent || 'var(--ink-3)' }}>
                                                        {e.ders || 'ETÜT'}
                                                    </span>
                                                    <span className={cn('tip-small block truncate',
                                                        bitti ? 'text-ink-3 line-through' : 'text-ink font-bold')}>
                                                        {e.konu}
                                                    </span>
                                                    <span className="tip-mini text-ink-3 block truncate">
                                                        {ACTIVITY_ETIKET[e.tur] || 'Çalışma'}
                                                    </span>
                                                </span>

                                                {/* Kaçıncı etüt — programda tutulan gerçek bilgi.
                                                    Saat aralığı yok çünkü kaydedilmiyor. */}
                                                <span className="hidden sm:block shrink-0 text-right">
                                                    <span className="tip-mini text-ink-2 block tabular-nums font-bold">{e.sira + 1}. etüt</span>
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() => etutIsaretle(e)}
                                                    aria-pressed={bitti}
                                                    className={cn(
                                                        'shrink-0 rounded-full px-4 py-2 text-[12px] font-black transition-all min-h-[40px]',
                                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                                                        bitti && 'bg-ok-soft text-ok',
                                                        !bitti && sirada && 'text-white',
                                                        !bitti && !sirada && 'border text-ink-2 hover:bg-surface-2',
                                                        yeniIsaret && 'scale-105'
                                                    )}
                                                    style={!bitti && sirada
                                                        ? { background: 'var(--brand)' }
                                                        : !bitti ? { borderColor: 'var(--line)' } : undefined}
                                                >
                                                    {bitti ? 'Bitti ✓' : sirada ? 'Başla' : 'Bekliyor'}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>

                                <div className="px-5 sm:px-6 py-3 border-t border-line flex items-center gap-3">
                                    <span className="tip-mini text-ink-3 shrink-0">Tamamlanan etüt {biten} / {toplam}</span>
                                    <Progress deger={biten} enFazla={toplam} ton={biten === toplam ? 'basari' : 'marka'}
                                        kalinlik="sm" className="flex-1" />
                                    <span className="tip-mini font-black tabular-nums shrink-0"
                                        style={{ color: 'var(--brand-metin)' }}>
                                        %{toplam ? Math.round((biten / toplam) * 100) : 0}
                                    </span>
                                </div>
                            </>
                        )}
                    </Card>

                    {/* ─── ALT ÜÇLÜ: koç notu · bekleyenler · hızlı işlemler ─── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Koçun GERÇEKTEN yazdığı not; sistem cümlesi değil.
                            Koç yazmadıysa kart hiç çıkmaz — sahte bir
                            "koçun diyor ki" cümlesi üretilmez. */}
                        {koctanSon ? (
                            <Card tiklanabilir onClick={() => onGit?.('messages')} role="button" tabIndex={0}
                                onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onGit?.('messages'); } }}>
                                <p className="tip-label text-ink-3 m-0">Koçundan Günün Notu</p>
                                <p className="tip-small text-ink mt-2 line-clamp-4 m-0">
                                    <span className="text-2xl leading-none align-top mr-1" style={{ color: 'var(--brand-line)' }}>“</span>
                                    {koctanSon.text || koctanSon.content}
                                </p>
                                <p className="tip-mini text-ink-3 mt-2 m-0">— {koctanSon.senderName || 'Koçun'}</p>
                            </Card>
                        ) : (
                            <Card>
                                <p className="tip-label text-ink-3 m-0">Koçundan Günün Notu</p>
                                <p className="tip-caption mt-2 m-0">Koçun bugün not bırakmadı.</p>
                            </Card>
                        )}

                        <Card dolgu="yok">
                            <div className="px-4 pt-4 pb-2">
                                <p className="tip-label text-ink-3 m-0">Bugün Seni Bekleyenler</p>
                            </div>
                            {bekleyenler.length === 0 ? (
                                <p className="tip-caption px-4 pb-4 m-0">Bekleyen iş yok — liste temiz.</p>
                            ) : (
                                <ul className="divide-y divide-line border-t border-line">
                                    {bekleyenler.map((b) => (
                                        <li key={b.id}>
                                            <button type="button" onClick={() => onGit?.(b.git)}
                                                className="w-full text-left px-4 py-2.5 min-h-[52px] flex items-center gap-2.5 hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset">
                                                <span className="shrink-0 w-8 h-8 rounded-dsm grid place-items-center"
                                                    style={{ background: 'var(--brand-soft)', color: 'var(--brand-metin)' }}>
                                                    <b.simge size={15} />
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="tip-small font-bold text-ink block truncate">{b.baslik}</span>
                                                    {b.alt && <span className="tip-mini text-ink-3 block truncate">{b.alt}</span>}
                                                </span>
                                                <ChevronRight size={15} className="text-ink-3 shrink-0" aria-hidden="true" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>

                        <Card dolgu="yok">
                            <div className="px-4 pt-4 pb-2">
                                <p className="tip-label text-ink-3 m-0">Hızlı İşlemler</p>
                            </div>
                            <ul className="divide-y divide-line border-t border-line">
                                {[
                                    { id: 'daily-log', simge: PencilLine, baslik: 'Günlük Kayıt', alt: 'Çalışmanı kaydet' },
                                    { id: 'error-notebook', simge: BookX, baslik: 'Hata Defteri', alt: 'Hatalarını gözden geçir' },
                                    { id: 'deneme-analizi', simge: BarChart3, baslik: 'Deneme Analizi', alt: 'Sonuçlarını incele' },
                                ].map((k) => (
                                    <li key={k.id}>
                                        <button type="button" onClick={() => onGit?.(k.id)}
                                            className="w-full text-left px-4 py-2.5 min-h-[52px] flex items-center gap-2.5 hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset">
                                            <span className="shrink-0 w-8 h-8 rounded-dsm grid place-items-center bg-surface-2 text-ink-2">
                                                <k.simge size={15} />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="tip-small font-bold text-ink block truncate">{k.baslik}</span>
                                                <span className="tip-mini text-ink-3 block truncate">{k.alt}</span>
                                            </span>
                                            <ChevronRight size={15} className="text-ink-3 shrink-0" aria-hidden="true" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    </div>
                </div>

                {/* ─── SAĞ SÜTUN ─── */}
                <aside className="xl:col-span-4 min-w-0 space-y-4">
                    {/* BU HAFTAKİ PROGRAMIN — üç kova, örtüşmez:
                        tamamlanan + günü geçmiş + günü gelmemiş = hafta. */}
                    {haftalikDurum && (
                        <Card>
                            <p className="tip-label text-ink-3 m-0 mb-3">Bu Haftaki Programın</p>
                            <div className="flex items-center gap-4">
                                <UyumHalkasi
                                    oran={haftalikDurum.oran}
                                    tamamlanan={haftalikDurum.tamamlanan}
                                    planlanan={haftalikDurum.tamamlanan + haftalikDurum.devamEden}
                                    altMetin="" ton="marka" boyut={84}
                                    className="shrink-0"
                                />
                                <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                                    {[
                                        { ad: 'Tamamlanan', sayi: haftalikDurum.tamamlanan, renk: 'var(--ok)' },
                                        { ad: 'Yetişmedi', sayi: haftalikDurum.devamEden, renk: 'var(--warn)' },
                                        { ad: 'Sırada', sayi: haftalikDurum.kalan, renk: 'var(--brand)' },
                                    ].map((x) => (
                                        <div key={x.ad} className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: x.renk }} />
                                            <span className="tip-small text-ink-2 flex-1 min-w-0 truncate">{x.ad}</span>
                                            <span className="tip-small font-black text-ink tabular-nums shrink-0">{x.sayi}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Button varyant="outline" simge={ArrowRight} simgeSagda className="mt-3 w-full"
                                onClick={() => onGit?.('program')}>
                                Programımı Gör
                            </Button>
                        </Card>
                    )}

                    {/* ODAK SERİN — sayı + haftanın deseni.
                        Tek sayı "kaç gün" der, şerit hangi günlerin boş
                        kaldığını gösterir. */}
                    <Card>
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="tip-label text-ink-3 m-0">Odak Serin</p>
                                <p className="text-2xl font-black text-ink rakam leading-none mt-1 m-0">
                                    {tempo?.istikrar?.guncelZincir ?? seri}
                                    <span className="tip-mini text-ink-3 font-bold ml-1.5">gün</span>
                                </p>
                                <p className="tip-mini text-ink-3 mt-1 m-0">
                                    En uzun serin: {tempo?.istikrar?.enUzunZincir ?? 0} gün
                                </p>
                            </div>
                            <span className="shrink-0 w-11 h-11 rounded-2xl grid place-items-center bg-warn-soft text-warn">
                                <Flame size={22} />
                            </span>
                        </div>
                        <div className="grid grid-cols-7 gap-1.5 mt-4">
                            {haftaSeridi.map((g, i) => (
                                <div key={g.tarih || i} className="text-center">
                                    <span
                                        aria-hidden="true"
                                        className="block w-full aspect-square rounded-full mx-auto"
                                        style={{
                                            background: g.aktif ? 'var(--brand)' : 'var(--surface-3)',
                                            maxWidth: 26,
                                        }}
                                        title={g.tarih ? `${g.tarih} · ${g.aktif ? 'çalışma var' : 'kayıt yok'}` : undefined}
                                    />
                                    <span className="tip-mini text-ink-3 block mt-1">{g.ad}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Motivasyon — YALNIZCA gerçekten olmuş bir başarı varsa */}
                    <MotivasyonSeridi metin={tempo?.mesaj} />

                    {/* BUGÜN ODAKLAN */}
                    <Card className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="tip-label text-ink-3 m-0">Bugün Odaklan</p>
                            <p className="tip-caption mt-1 m-0">
                                {dailyPomodoros > 0
                                    ? `Bugün ${dailyPomodoros} odak seansı yaptın.`
                                    : 'Odaklanma süreni planla, verimini artır.'}
                            </p>
                            <Button varyant="outline" simge={ArrowRight} simgeSagda className="mt-2.5"
                                onClick={() => onGit?.('pomodoro')}>
                                Odaklan
                            </Button>
                        </div>
                        <span className="shrink-0 w-14 h-14 rounded-full grid place-items-center"
                            style={{ background: 'var(--brand-soft)', color: 'var(--brand-metin)' }}>
                            <Target size={26} />
                        </span>
                    </Card>

                    {/* Bu hafta özeti — günlük kayıtlardan */}
                    {hafta && hafta.entries > 0 && (
                        <Card>
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <p className="tip-label text-ink-3 m-0">Bu Hafta</p>
                                <button type="button" onClick={() => onGit?.('daily-log')}
                                    className="tip-caption font-bold hover:underline"
                                    style={{ color: 'var(--brand-metin)' }}>Kayıt gir</button>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                {[
                                    { etiket: 'Soru', deger: hafta.questions },
                                    { etiket: 'Süre', deger: hafta.minutes >= 60 ? `${Math.floor(hafta.minutes / 60)}s ${hafta.minutes % 60}d` : `${hafta.minutes}d` },
                                    { etiket: 'İsabet', deger: hafta.accuracy != null ? `%${hafta.accuracy}` : '—' },
                                    { etiket: 'Aktif Gün', deger: `${hafta.activeDays}/7` },
                                ].map((x) => (
                                    <div key={x.etiket} className="rounded-dmd bg-surface-2 border border-line px-3 py-2.5">
                                        <p className="tip-mini text-ink-3 uppercase tracking-wider m-0">{x.etiket}</p>
                                        <p className="tip-h4 text-ink rakam mt-0.5 m-0">{x.deger}</p>
                                    </div>
                                ))}
                            </div>
                            {gelisim && (
                                <p className={cn('mt-3 rounded-dsm px-3 py-2 tip-small font-semibold',
                                    gelisim.fark > 0 ? 'text-ok bg-ok-soft/50' : gelisim.fark < 0 ? 'text-warn bg-warn-soft/40' : 'text-ink-2 bg-surface-2')}>
                                    {gelisim.mesaj}
                                </p>
                            )}
                        </Card>
                    )}
                </aside>
            </div>

            {/* ══ 4. ALT ŞERİT ═══════════════════════════════════════ */}
            <div className="rounded-dlg px-5 py-4 sm:px-7 sm:py-5 flex items-center gap-4"
                style={{ background: 'var(--krem)', border: '1px solid var(--krem-line)' }}>
                <div className="min-w-0 flex-1">
                    <p className="tip-caption m-0">Unutma {kullanici?.name?.split(' ')[0] || ''},</p>
                    <p className="text-lg sm:text-xl font-black text-ink syne tracking-tight m-0 mt-0.5">
                        İstikrar, başarıyı getirir! 💪
                    </p>
                </div>
                <Sparkles size={30} className="shrink-0" style={{ color: 'var(--brand)' }} aria-hidden="true" />
            </div>
        </div>
    );
}
