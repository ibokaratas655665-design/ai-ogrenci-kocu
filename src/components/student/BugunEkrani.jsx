import React, { useMemo, useState, useEffect } from 'react';
import {
    Play, ArrowRight, MessageSquare, Flame, CalendarCheck, Sparkles, Target, ChevronRight, PencilLine, BookX, BarChart3, Clock, Timer, BookOpen, AlertTriangle,
    AlignLeft, Calculator, RotateCcw, GraduationCap, CheckCircle2, BookMarked,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Progress from '../ui/Progress';
import OnayKutusu from '../ui/OnayKutusu';
import KartBasligi from '../ui/KartBasligi';
import { getProgress, setCellStatus } from '../../services/programProgressService';
import { getCellColor, ACTIVITY_TYPES } from '../../data/programColors';
import { hucreTarihi, programBaslangici } from '../../services/programProgressService';
import { programUyumu, calismaOzeti, istikrar, motivasyon, gunlukSeri } from '../../services/gelisimAnalitik';
import { MotivasyonSeridi, UyumHalkasi, IsiHaritasi } from '../charts/Analitik';
import { getSummary, getToday } from '../../services/studyLogService';
import { bildir, onayla } from '../../services/uiGeriBildirim';
import { bugunOnerileri } from '../../services/bugunOnerileri';
import { anahtar } from '../../services/topicProgressService';

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
                topicId: v.topicId,
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

    /**
     * "Şimdi neye bakmalısın?" önerileri — programın DIŞINDAN gelen en fazla
     * üç kart: denemede dökülen "bitmiş" konu, tekrar vadesi gelen hata,
     * konu motorunun en acil önerisi. Bugünkü programda zaten görünen konu
     * önerilmez (aynı işi iki kez söylemek güven kaybettirir).
     */
    const oneriler = useMemo(() => {
        try {
            return bugunOnerileri(kullanici, {
                programBugunVar: bugunEtutleri.some((e) => e.durum !== 'done'),
                programKonular: new Set(
                    bugunEtutleri.map((e) => anahtar(e.konu)).filter(Boolean)
                ),
            });
        } catch {
            return { items: [], reviewToplam: 0, reviewFazla: 0 };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [kullanici?.id, bugunEtutleri]);

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

    /* YKS'ye kalan gün — mobil panelin kırmızı balonu. Sınav günü olarak
       haziranın 20'si esas alınır; geçtiyse gelecek yıl sayılır. */
    const yksKalanGun = useMemo(() => {
        const bugunTarih = new Date();
        let sinav = new Date(bugunTarih.getFullYear(), 5, 20);
        if (sinav < bugunTarih) sinav = new Date(bugunTarih.getFullYear() + 1, 5, 20);
        return Math.max(0, Math.ceil((sinav - bugunTarih) / 86400000));
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        /* 04.09 (canlı eşleme): plan-dışı öneriler ayrı kart değil, bu
           listenin devamıdır — "öneri" rozetiyle işaretlenir. */
        const oneriHedef = { 'tekrar-et': 'error-notebook', calis: 'topics', 'hata-analizi': 'deneme-analizi' };
        const oneriSimge = { 'review-due': BookX, 'oncelik-onerisi': Target, dikkat: BarChart3 };
        oneriler.items.forEach((o, i) => {
            if (o.type === 'bos') return;
            const baslik = o.topic ? `${o.subject ? `${o.subject} · ` : ''}${o.topic}` : o.reason;
            liste.push({
                id: `oneri-${o.type}-${i}`,
                simge: oneriSimge[o.type] || Sparkles,
                baslik,
                alt: o.reason,
                git: oneriHedef[o.action] || 'program',
                oneri: true,
            });
        });
        if (oneriler.reviewFazla > 0) {
            liste.push({
                id: 'oneri-review-fazla', simge: BookX,
                baslik: `${oneriler.reviewFazla} tekrar daha bekliyor`,
                alt: 'Hata defterinde zamanı gelen tekrarlar',
                git: 'error-notebook', oneri: true,
            });
        }
        return liste;
    }, [bugunEtutleri, acikGorevler, oneriler]);

    /* gelisim memosu kaldirildi (06.09): tuketen "Bu Hafta" karti silindi. */

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

    const etutIsaretle = async (etut) => {
        const yeniDurum = etut.durum === 'done' ? null : 'done';
        /* 05.09 talimatı: yapıldı/geri alındı ONAYDAN geçer — yanlış
           dokunuş işareti sessizce değiştirmesin. */
        const onaylandi = await onayla({
            mesaj: yeniDurum === 'done'
                ? `"${etut.ders} · ${etut.konu}" YAPILDI olarak işaretlenecek. Onaylıyor musun?`
                : `"${etut.ders} · ${etut.konu}" işaretin geri alınacak. Onaylıyor musun?`,
        });
        if (!onaylandi) return;
        /* 04.09: işarete konu bilgisi gömülür — "programda hangi konular
           çalışıldı" kaydı (getStudiedTopics) buradan beslenir. */
        setIlerleme(setCellStatus(kullanici?.id, etut.key, yeniDurum, undefined, {
            topicId: etut.topicId, topic: etut.konu, subject: etut.ders, type: etut.tur,
        }));
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

    /* 05.09: hızlı eylem paleti artık ACTIVITY_TYPES ile aynı kaynaktan —
       blok türünün rengi programda neyse burada da o (elle yazılmış
       palet program renkleriyle tutmuyordu). Konu/Soru derse bağlı
       olduğu için (sabit blok rengi yok) kendi nötr tonlarını korur. */
    const blokRenk = (tip) => ACTIVITY_TYPES[tip]?.color || {};
    const hizliEylemler = [
        { et: 'Paragraf', I: AlignLeft, bg: blokRenk('paragraf').accent, bg2: blokRenk('paragraf').bg, fg: '#fff', git: 'daily-log' },
        { et: 'Problem', I: Calculator, bg: blokRenk('problem').accent, bg2: blokRenk('problem').bg, fg: '#fff', git: 'daily-log' },
        { et: 'Konu', I: BookOpen, bg: '#2563EB', bg2: '#93C5FD', fg: '#fff', git: 'topics' },
        { et: 'Soru', I: PencilLine, bg: '#DC2626', bg2: '#FCA5A5', fg: '#fff', git: 'daily-log' },
        { et: 'Deneme', I: BarChart3, bg: blokRenk('deneme').accent, bg2: blokRenk('deneme').bg, fg: '#fff', git: 'deneme-analizi' },
        { et: 'Kitap', I: BookMarked, bg: blokRenk('kitap').accent, bg2: blokRenk('kitap').bg, fg: '#fff', git: 'daily-log' },
        { et: 'Tekrar', I: RotateCcw, bg: blokRenk('tekrar').accent, bg2: blokRenk('tekrar').bg, fg: '#fff', git: 'error-notebook' },
    ];

    return (
        <>
            {/* ══════════════════════════════════════════════════════════
                TELEFON MİNİ PANELİ (lg altı) — tek bakışta gün:
                selamlama + seri, 4 yuvarlak gösterge, 7 hızlı eylem,
                "dokun & başla" kompakt etüt listesi. Masaüstü düzeni
                telefonda ezilerek değil, bu ayrı yüzeyle karşılanır.
                ══════════════════════════════════════════════════════════ */}
            <div className="lg:hidden space-y-3">
                <div className="flex items-center gap-2">
                    <div className="min-w-0">
                        <p className="text-[15px] font-black text-ink leading-tight m-0">
                            Merhaba, {kullanici?.name?.split(' ')[0] || 'Öğrenci'}
                        </p>
                        <p className="text-[10px] font-semibold m-0" style={{ color: '#D85A30' }}>{gunlukMotivasyon}</p>
                    </div>
                    <span className="ml-auto shrink-0 inline-flex items-center gap-1 text-[11px] font-black px-2 py-1 rounded-full"
                        style={{ background: '#FAECE7', color: '#993C1D' }}>
                        <Flame size={12} />
                        {tempo?.istikrar?.guncelZincir ?? seri ?? 0}
                    </span>
                </div>

                <div className="flex items-start justify-between pt-3">
                    <div className="flex flex-col items-center gap-1">
                        <div className="relative w-14 h-14 rounded-full grid place-items-center"
                            style={{
                                background: 'radial-gradient(circle at 34% 28%, #ECFDF5, #86EFAC 78%)',
                                boxShadow: 'inset 0 2px 3px rgba(255,255,255,.7), 0 5px 10px -3px rgba(0,0,0,.32)',
                            }}>
                            <svg className="absolute inset-0" width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
                                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="5" />
                                <circle cx="28" cy="28" r="22" fill="none" stroke="#15803D" strokeWidth="5" strokeLinecap="round"
                                    strokeDasharray="138" strokeDashoffset={138 * (1 - (toplam ? biten / toplam : 0))}
                                    transform="rotate(-90 28 28)" />
                            </svg>
                            <span className="relative text-[13px] font-black leading-none" style={{ color: '#14532D' }}>
                                {biten}/{toplam || 0}
                            </span>
                        </div>
                        <span className="text-[8.5px] font-bold inline-flex items-center gap-1" style={{ color: '#166534' }}>
                            Günlük hedef <CheckCircle2 size={11} />
                        </span>
                    </div>

                    <div className="w-[52px] h-[52px] rounded-full flex flex-col items-center justify-center"
                        style={{
                            background: 'radial-gradient(circle at 34% 28%, #F0F7FF, #85B7EB 80%)',
                            boxShadow: 'inset 0 2px 3px rgba(255,255,255,.7), 0 5px 10px -3px rgba(0,0,0,.32)',
                        }}>
                        <span className="text-[13px] font-black leading-none" style={{ color: '#0C447C' }}>{hafta?.questions ?? 0}</span>
                        <span className="text-[7px] mt-0.5" style={{ color: '#0C447C' }}>soru·hafta</span>
                    </div>

                    <div className="w-[52px] h-[52px] rounded-full flex flex-col items-center justify-center"
                        style={{
                            background: 'radial-gradient(circle at 34% 28%, #F0F7FF, #85B7EB 80%)',
                            boxShadow: 'inset 0 2px 3px rgba(255,255,255,.7), 0 5px 10px -3px rgba(0,0,0,.32)',
                        }}>
                        <span className="text-[12px] font-black leading-none" style={{ color: '#0C447C' }}>
                            {haftalikDurum?.toplam ?? toplam}/{haftalikDurum?.tamamlanan ?? biten}
                        </span>
                        <span className="text-[7px] mt-0.5" style={{ color: '#0C447C' }}>etüt·hafta</span>
                    </div>

                    <div className="relative w-[52px] h-[52px] shrink-0">
                        <GraduationCap size={26} className="absolute z-10"
                            style={{ top: -12, left: '50%', transform: 'translateX(-50%) rotate(15deg)', color: '#1E293B' }}
                            aria-hidden="true" />
                        <div className="w-[52px] h-[52px] rounded-full flex flex-col items-center justify-center"
                            style={{
                                background: 'radial-gradient(circle at 34% 30%, #FCA5A5, #DC2626 80%)',
                                boxShadow: 'inset 0 2px 3px rgba(255,255,255,.5), 0 6px 12px -3px rgba(220,38,38,.5)',
                            }}>
                            <span className="text-[14px] font-black leading-none text-white">{yksKalanGun}</span>
                            <span className="text-[7px] font-bold mt-0.5" style={{ color: '#FEE2E2' }}>gün·YKS</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-1 pt-2">
                    {hizliEylemler.map((h) => (
                        <button key={h.et} type="button" onClick={() => onGit?.(h.git)}
                            className="flex-1 min-w-0 flex flex-col items-center gap-1">
                            <span className="w-[33px] h-[33px] rounded-[10px] grid place-items-center"
                                style={{
                                    background: `radial-gradient(circle at 38% 25%, ${h.bg2}, ${h.bg} 85%)`,
                                    color: h.fg,
                                    boxShadow: 'inset 0 2px 2px rgba(255,255,255,.7), 0 4px 8px -3px rgba(0,0,0,.32)',
                                }}>
                                <h.I size={16} />
                            </span>
                            <span className="text-[7.5px] font-bold text-ink-3">{h.et}</span>
                        </button>
                    ))}
                </div>

                <div className="pt-1">
                    <p className="text-[8.5px] font-black text-ink-3 uppercase tracking-wider mb-1.5 m-0">
                        bugünün programı · {toplam} etüt · dokun & başla
                    </p>
                    {toplam === 0 ? (
                        <div className="rounded-xl border border-line bg-surface p-3 text-[11px] text-ink-3">
                            Bugün için planlı etüt yok.{' '}
                            <button type="button" onClick={() => onGit?.('daily-log')} className="font-bold"
                                style={{ color: 'var(--brand-metin)' }}>
                                Çalışmanı kaydet
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {bugunEtutleri.map((e) => {
                                const bitti = e.durum === 'done';
                                const sirada = !bitti && sonraki?.key === e.key;
                                const renk = e.renk || {};
                                return (
                                    <button key={e.key} type="button" onClick={() => etutIsaretle(e)}
                                        className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition"
                                        style={{
                                            background: `color-mix(in srgb, ${renk.accent || 'var(--ink-3)'} 12%, var(--surface))`,
                                            borderLeft: `3px solid ${renk.accent || 'var(--line-2)'}`,
                                        }}>
                                        <span className="w-[18px] h-[18px] rounded-[5px] grid place-items-center shrink-0"
                                            style={{
                                                background: `color-mix(in srgb, ${renk.accent || 'var(--ink-3)'} 22%, transparent)`,
                                                color: renk.accent || 'var(--ink-3)',
                                            }}>
                                            <BookMarked size={11} />
                                        </span>
                                        <span className="flex-1 min-w-0 text-[10px] font-bold truncate"
                                            style={{
                                                color: renk.text || 'var(--ink)',
                                                textDecoration: bitti ? 'line-through' : 'none',
                                                opacity: bitti ? 0.7 : 1,
                                            }}>
                                            {e.konu}
                                        </span>
                                        {bitti ? (
                                            <CheckCircle2 size={15} style={{ color: '#16A34A' }} aria-hidden="true" />
                                        ) : sirada ? (
                                            <span className="shrink-0 text-[9px] font-black px-2 py-1 rounded-full text-white inline-flex items-center gap-1"
                                                style={{ background: 'var(--brand)' }}>
                                                <Play size={9} />başla
                                            </span>
                                        ) : (
                                            <span className="shrink-0 text-[8px] text-ink-3">bekliyor</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
                MASAÜSTÜ (lg ve üstü) — kokpit düzeni
                ══════════════════════════════════════════════════════════ */}
            <div className="hidden lg:block space-y-4 lg:space-y-5 xl:flex-1 xl:min-h-0 xl:flex xl:flex-col xl:overflow-hidden">

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

            {/* ══ 1b. SIRADAKİ ADIMIN — günün tek birincil eylemi ═════ */}
            {sonraki ? (
                <Card dolgu="yok" className="overflow-hidden">
                    <div className="flex items-center gap-3 p-4 sm:p-5"
                        style={{ background: `color-mix(in srgb, ${sonraki.renk?.accent || 'var(--brand)'} 8%, transparent)` }}>
                        <span aria-hidden="true" className="shrink-0 w-12 h-12 rounded-2xl grid place-items-center"
                            style={{
                                background: `color-mix(in srgb, ${sonraki.renk?.accent || 'var(--brand)'} 18%, transparent)`,
                                color: sonraki.renk?.accent || 'var(--brand)',
                            }}>
                            <BookMarked size={22} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="tip-mini font-black uppercase tracking-wider m-0" style={{ color: 'var(--brand-metin)' }}>
                                Sıradaki adımın
                            </p>
                            <p className="tip-small font-black text-ink truncate m-0 mt-0.5">{sonraki.konu}</p>
                            <p className="tip-mini text-ink-3 truncate m-0 mt-0.5">
                                {sonraki.ders} · {ACTIVITY_ETIKET[sonraki.tur] || 'Çalışma'}
                            </p>
                        </div>
                        <button type="button" onClick={() => etutIsaretle(sonraki)}
                            className="shrink-0 rounded-full px-5 py-2.5 text-sm font-black text-white transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                            style={{ background: 'var(--brand)' }}>
                            Başla
                        </button>
                    </div>
                </Card>
            ) : toplam > 0 ? (
                <Card dolgu="md" className="flex items-center gap-3">
                    <span aria-hidden="true" className="shrink-0 w-11 h-11 rounded-2xl grid place-items-center bg-ok-soft text-ok">
                        <CheckCircle2 size={22} />
                    </span>
                    <div className="min-w-0">
                        <p className="tip-small font-black text-ink m-0">Bugünün programını bitirdin 🎉</p>
                        <p className="tip-mini text-ink-3 m-0 mt-0.5">Dilersen ek çalışma kaydı girebilirsin.</p>
                    </div>
                </Card>
            ) : null}

            {/* ══ 2. ÖLÇÜM ŞERİDİ ═══════════════════════════════════
                06.09 SADELEŞTİRME: "Günün Uyumu" kartı kaldırıldı —
                soldaki "Günlük Hedef" kartıyla birebir aynı iki sayıyı
                (biten/toplam) yalnızca yüzde olarak tekrarlıyordu. */}
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
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

            {/* ══ 3. ANA IZGARA — masaüstünde iki sütun kendi içinde kayar ══ */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 xl:gap-5 items-start xl:items-stretch xl:flex-1 xl:min-h-0 xl:overflow-hidden xl:[grid-template-rows:minmax(0,1fr)]">

                {/* ─── SOL: BUGÜNKÜ ÇALIŞMA PLANIN ─── */}
                <div className="xl:col-span-8 min-w-0 space-y-4 xl:min-h-0 xl:overflow-y-auto xl:pr-1.5 tek-ekran-govde">
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
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="tip-small font-bold text-ink truncate">{b.baslik}</span>
                                                        {b.oneri && (
                                                            <span className="shrink-0 tip-mini font-semibold px-1.5 py-[1px] rounded-full"
                                                                style={{ background: 'var(--brand-soft)', color: 'var(--brand-metin)' }}>
                                                                öneri
                                                            </span>
                                                        )}
                                                    </span>
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
                <aside className="xl:col-span-4 min-w-0 space-y-4 xl:min-h-0 xl:overflow-y-auto xl:pr-1.5 tek-ekran-govde">
                    {/* 06.09 SADELEŞTİRME: "Bu Haftaki Programın" halka+kova
                        bloğu kaldırıldı — aynı programUyumu(7) verisi Program
                        sekmesindeki ProgramKarnem'de ders kırılımıyla birlikte
                        zaten var. Buradan tek tıkla oraya gidilir. */}
                    {haftalikDurum && (
                        <Card>
                            <p className="tip-label text-ink-3 m-0">Bu Haftaki Programın</p>
                            <p className="tip-caption mt-1 m-0">
                                {haftalikDurum.tamamlanan} etüt tamamlandı · %{haftalikDurum.oran} uyum
                            </p>
                            <Button varyant="outline" simge={ArrowRight} simgeSagda className="mt-2.5 w-full"
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

                    {/* 06.09 SADELEŞTİRME: "Bu Hafta" ozet karti kaldirildi — dort sayi da Calismalarim > Gunluk Kayit istatistiklerinde ayni kaynaktan (getSummary) goruluyor. */}
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
        </>
    );
}
