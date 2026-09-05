/**
 * 📕 E-HATA DEFTERİ
 *
 * Yanlış yapılan soruların dijital kaydı + aralıklı tekrar planı.
 * Bir soruyu kaydettiğinizde sistem 1 gün / 1 hafta / 1 ay sonrasına
 * tekrar hatırlatması koyar (aralıklı tekrar / spaced repetition).
 *
 * Koç da aynı veriyi okuyabildiği için `error_notebook` tek bir dizide
 * tutulur ve kayıtlar studentId ile ayrılır.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { onayla } from '../../services/uiGeriBildirim';
import {
    BookX, Plus, X, Search, Trash2, RotateCcw, CheckCircle2, Clock,
    AlertTriangle, Brain, Target, Zap, TrendingUp, Filter, ChevronDown,
} from 'lucide-react';
import Modal from '../ui/Modal';
import { ogrencininDersleri, dersinKonulari } from '../../utils/dersKonu';
import { HATA_TURLERI } from '../../data/hataTurleri';
import DenemeAnalizi from './DenemeAnalizi';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend as GrafikEfsane, ResponsiveContainer,
} from 'recharts';
import { SayiCubuklari } from '../charts/Analitik';
import { SegmentliDonut, CokSegmentliCubuk } from '../charts/Dagilim';
import { izgaraOzellikleri, eksenOzellikleri, ANIMASYON, dersRengi } from '../charts/grafikTemasi';
import { hataTrendi, konuHatalari } from '../../utils/denemeAnalizi';

const LS_KEY = 'error_notebook';

/** Aralıklı tekrar aşamaları (gün) */
const REVIEW_STAGES = [1, 3, 7, 21, 60];

/**
 * Tür listesi ARTIK BURADA TANIMLI DEĞİL: kimlik, ad, renk ve ipucu
 * data/hataTurleri'nden gelir. Aynı liste dört dosyada kopyalanmıştı
 * ve kopyalar birbirini tutmuyordu (bkz. o dosyadaki not). Yalnızca
 * ikon eşlemesi burada kalır — data katmanı React bileşeni taşımaz.
 */
const TUR_IKONU = {
    knowledge: Brain, careless: Zap, interpretation: Target,
    time: Clock, calculation: AlertTriangle,
};
const ERROR_TYPES = HATA_TURLERI.map((t) => ({ ...t, icon: TUR_IKONU[t.id] || Brain }));

/* V1.1: dersler öğrencinin alanından türetilir (utils/dersKonu);
   bu liste yalnızca katalog çözülemezse devreye giren yedektir. */
const YEDEK_DERSLER = [
    'Matematik', 'Geometri', 'Türkçe', 'Fizik', 'Kimya', 'Biyoloji',
    'Tarih', 'Coğrafya', 'Felsefe', 'Din Kültürü', 'İngilizce', 'Edebiyat',
];

const safeParse = () => {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw || !raw.trim()) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const persist = (entries) => {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
    /* Damga (05.09 — bkz. veriDeposu.damgala): damgasız kayıt, bulut
       yazımı yetişmeden yapılan yenilemede eski kopyayla ezilir. */
    try { localStorage.setItem(`_fbtime_${LS_KEY}`, String(Date.now())); } catch { /* ignore */ }
    try {
        window.dispatchEvent(new StorageEvent('storage', { key: LS_KEY }));
        window.firebaseSync?.syncKey?.(LS_KEY);
    } catch { /* senkron yoksa sorun değil */ }
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Bir sonraki tekrar tarihini hesaplar. */
const nextReviewAt = (stage) => {
    const days = REVIEW_STAGES[Math.min(stage, REVIEW_STAGES.length - 1)];
    return Date.now() + days * DAY_MS;
};

const typeById = (id) => ERROR_TYPES.find((t) => t.id === id) || ERROR_TYPES[0];

// ════════════════════════════════════════════════════════════
const ErrorNotebook = ({ studentId, readOnly = false, ogrenci = null }) => {
    const [entries, setEntries] = useState(safeParse);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [view, setView] = useState('due'); // 'due' | 'all' | 'mastered'

    // Tüm "vadesi geldi mi" hesapları aynı ana göre yapılsın; render sırasında
    // saat okumak hem tutarsızlık hem de gereksiz yeniden render sebebi.
    const [now] = useState(() => Date.now());

    const myEntries = useMemo(
        () => entries.filter((e) => String(e.studentId) === String(studentId)),
        [entries, studentId]
    );

    const update = useCallback((updater) => {
        setEntries((prev) => {
            const next = updater(prev);
            persist(next);
            return next;
        });
    }, []);

    // ── Filtreleme ───────────────────────────────────────────
    const filtered = useMemo(() => {
        const q = search.trim().toLocaleLowerCase('tr-TR');

        return myEntries
            .filter((e) => {
                if (view === 'due') return !e.mastered && (e.nextReviewAt ?? 0) <= now;
                if (view === 'mastered') return e.mastered;
                return true;
            })
            .filter((e) => subjectFilter === 'all' || e.subject === subjectFilter)
            .filter((e) => typeFilter === 'all' || e.errorType === typeFilter)
            .filter((e) => {
                if (!q) return true;
                return `${e.subject} ${e.topic} ${e.note} ${e.source}`.toLocaleLowerCase('tr-TR').includes(q);
            })
            .sort((a, b) => (a.nextReviewAt ?? 0) - (b.nextReviewAt ?? 0));
    }, [myEntries, view, subjectFilter, typeFilter, search, now]);

    // ── İstatistik ───────────────────────────────────────────
    const stats = useMemo(() => {
        const active = myEntries.filter((e) => !e.mastered);
        const due = active.filter((e) => (e.nextReviewAt ?? 0) <= now);

        const byType = ERROR_TYPES.map((t) => ({
            ...t,
            count: active.filter((e) => e.errorType === t.id).length,
        })).sort((a, b) => b.count - a.count);

        const bySubject = [...new Set(active.map((e) => e.subject))]
            .map((s) => ({ subject: s, count: active.filter((e) => e.subject === s).length }))
            .sort((a, b) => b.count - a.count);

        return {
            total: myEntries.length,
            active: active.length,
            due: due.length,
            mastered: myEntries.filter((e) => e.mastered).length,
            topType: byType[0]?.count > 0 ? byType[0] : null,
            byType: byType.filter((t) => t.count > 0),
            topSubject: bySubject[0] || null,
            bySubject: bySubject.slice(0, 5),
        };
    }, [myEntries, now]);

    /**
     * HAFTALIK HATA TRENDİ.
     *
     * `hataTrendi` aylar önce yazılmış ve yalnızca koç panelinde
     * kullanılıyordu; hatanın sahibi olan öğrenci kendi eğilimini
     * göremiyordu. Aynı hesap, ikinci bir veri kaynağı açılmadan
     * buraya da bağlandı.
     *
     * Bu grafik iki şeyi birlikte gösterir: o hafta KAÇ yeni hata
     * girildi ve KAÇI çözüldü. Yalnız hata sayısı ceza gibi okunur;
     * çözülen çizgisi olmadan çabanın karşılığı görünmez.
     */
    const trend = useMemo(() => hataTrendi(myEntries), [myEntries]);

    /**
     * KONU KIRILIMI — hangi konuda kaç hata, kaçı çözüldü.
     *
     * `konuHatalari` aylar önce yazılmıştı ve yalnızca Deneme Analizi
     * ile koç panelinde kullanılıyordu; hatanın girildiği ekranda
     * konu dökümü yoktu. Öğrenci "Türkçe'de 9 hatam var" görüyor ama
     * "hangi konuda" sorusunu ancak listeyi tek tek okuyarak
     * yanıtlayabiliyordu.
     *
     * Yeni hesap kurulmadı, mevcut fonksiyon bağlandı.
     */
    const konu = useMemo(() => konuHatalari(myEntries), [myEntries]);

    /**
     * DURUM DAĞILIMI — üç kova, bir bütün.
     *
     * Üstteki dört sayaç (tekrar / aktif / öğrenildi / toplam) bu
     * bütünü sayı olarak veriyor ama ORANINI vermiyordu: 38 kaydın
     * 9'unun öğrenilmiş olması iyi mi kötü mü, sayıya bakarak
     * anlaşılmıyor. Donut payları tek bakışta gösterir.
     *
     * Kovalar ÖRTÜŞMEZ: bir kayıt ya öğrenilmiştir, ya tekrar zamanı
     * gelmiştir, ya da beklemededir. Örtüşseler toplam yanlış olurdu.
     */
    const durumDagilimi = useMemo(() => {
        const ogrenildi = myEntries.filter((e) => e.mastered).length;
        const vadesi = myEntries.filter((e) => !e.mastered && (e.nextReviewAt ?? 0) <= now).length;
        const bekleyen = myEntries.length - ogrenildi - vadesi;
        return [
            { ad: 'Tekrar zamanı geldi', deger: vadesi, renk: 'var(--danger)' },
            { ad: 'Sırada bekliyor', deger: bekleyen, renk: 'var(--warn)' },
            { ad: 'Kalıcı öğrenildi', deger: ogrenildi, renk: 'var(--ok)' },
        ];
    }, [myEntries, now]);

    // ── Eylemler ─────────────────────────────────────────────
    const addEntry = (form) => {
        const entry = {
            id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            studentId,
            ...form,
            stage: 0,
            reviewCount: 0,
            mastered: false,
            createdAt: new Date().toISOString(),
            nextReviewAt: nextReviewAt(0),
        };
        update((prev) => [entry, ...prev]);
        setShowForm(false);
    };

    /** Tekrar yapıldı: doğru çözdüyse bir sonraki aşamaya, çözemediyse başa döner. */
    const reviewEntry = (id, solved) => {
        update((prev) =>
            prev.map((e) => {
                if (e.id !== id) return e;
                const stage = solved ? e.stage + 1 : 0;
                const mastered = solved && stage >= REVIEW_STAGES.length;
                return {
                    ...e,
                    stage,
                    mastered,
                    reviewCount: (e.reviewCount || 0) + 1,
                    lastReviewedAt: new Date().toISOString(),
                    nextReviewAt: mastered ? null : nextReviewAt(stage),
                };
            })
        );
    };

    const removeEntry = async (id) => {
        if (!(await onayla({ mesaj: 'Bu hata kaydı silinecek. Emin misiniz?', tehlikeli: true }))) return;
        update((prev) => prev.filter((e) => e.id !== id));
    };

    const resetEntry = (id) => {
        update((prev) =>
            prev.map((e) =>
                e.id === id ? { ...e, stage: 0, mastered: false, nextReviewAt: nextReviewAt(0) } : e
            )
        );
    };

    // ════════════════════════════════════════════════════════
    return (
        <div className="space-y-5">

            {/* ── Özet ───────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Tekrar Zamanı', value: stats.due, color: 'var(--danger)', icon: Clock },
                    { label: 'Aktif Kayıt', value: stats.active, color: 'var(--highlight)', icon: BookX },
                    { label: 'Kalıcı Öğrenildi', value: stats.mastered, color: 'var(--accent)', icon: CheckCircle2 },
                    { label: 'Toplam', value: stats.total, color: 'var(--info)', icon: TrendingUp },
                ].map((s) => (
                    <div key={s.label} className="premium-card p-4">
                        <div className="flex items-center gap-2 mb-1.5">
                            <s.icon size={13} style={{ color: s.color }} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-ink-3">
                                {s.label}
                            </span>
                        </div>
                        <p className="text-2xl font-black syne" style={{ color: s.color }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* ── Öne çıkan tespit ───────────────────────── */}
            {stats.topType && stats.active >= 3 && (
                <div className="premium-card p-4 border-l-2" style={{ borderLeftColor: stats.topType.color }}>
                    <div className="flex items-start gap-3">
                        <stats.topType.icon size={18} style={{ color: stats.topType.color }} className="shrink-0 mt-0.5" />
                        <div>
                            <p className="text-ink font-bold text-sm">
                                Hatalarının çoğu: {stats.topType.label}
                            </p>
                            <p className="text-ink-3 text-xs mt-1 leading-relaxed">
                                {stats.topType.count} kayıt bu tipte
                                {stats.topSubject ? ` · en çok ${stats.topSubject.subject} dersinde (${stats.topSubject.count})` : ''}.
                                {stats.topType.id === 'careless' && ' Soru çözerken hız yerine doğruluğa odaklan.'}
                                {stats.topType.id === 'knowledge' && ' Bu konuların anlatımını tekrar izlemen faydalı olur.'}
                                {stats.topType.id === 'time' && ' Deneme çözerken soru başına süre tutmayı dene.'}
                                {stats.topType.id === 'interpretation' && ' Soruyu iki kez oku, ne istediğinin altını çiz.'}
                                {stats.topType.id === 'calculation' && ' İşlemleri kâğıda daha düzenli yazmayı dene.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {view === 'analiz' ? (
                <>
                    {/* Görünüm değiştirici analizde de kalsın */}
                    <div className="flex gap-1 bg-surface/[0.03] p-1 rounded-2xl border border-line w-fit">
                        {[
                            { id: 'due', label: `Tekrar (${stats.due})` },
                            { id: 'all', label: 'Tümü' },
                            { id: 'mastered', label: 'Öğrenildi' },
                            { id: 'analiz', label: 'Deneme Analizi' },
                        ].map((v) => (
                            <button key={v.id} onClick={() => setView(v.id)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${view === v.id ? 'bg-brand text-ink-on' : 'text-ink-3 hover:text-ink-2'}`}>
                                {v.label}
                            </button>
                        ))}
                    </div>
                    <DenemeAnalizi ogrenci={ogrenci} studentId={studentId} bakis={readOnly ? 'koc' : 'ogrenci'} />
                </>
            ) : (
            <>
            {/* ── Araç çubuğu ────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex gap-1 bg-surface/[0.03] p-1 rounded-2xl border border-line">
                    {[
                        { id: 'due', label: `Tekrar (${stats.due})` },
                        { id: 'all', label: 'Tümü' },
                        { id: 'mastered', label: 'Öğrenildi' },
                        /* V1.1: hata defteri verisi deneme + günlük
                           kayıtla birleşip analiz görünümüne dönüşür */
                        { id: 'analiz', label: 'Deneme Analizi' },
                    ].map((v) => (
                        <button
                            key={v.id}
                            onClick={() => setView(v.id)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                                view === v.id ? 'bg-brand text-ink-on' : 'text-ink-3 hover:text-ink-2'
                            }`}
                        >
                            {v.label}
                        </button>
                    ))}
                </div>

                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Konu, kaynak veya not içinde ara..."
                        className="w-full bg-surface/[0.04] border border-line rounded-2xl pl-9 pr-3 py-2.5 text-sm text-ink placeholder-white/30 focus:outline-none focus:border-brand/40"
                    />
                </div>

                {!readOnly && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-brand text-ink-on font-black text-sm active:scale-95 transition whitespace-nowrap"
                    >
                        <Plus size={16} /> Hata Ekle
                    </button>
                )}
            </div>

            {/* ── HATA DESENİM ───────────────────────────────
                Dağılımlar buraya gelene kadar yalnızca katlanmış
                filtre panelinde, parantez içi sayı olarak duruyordu:
                "Dikkatsizlik (12), Bilgi Eksiği (9)". Sayı okunuyor
                ama oran görünmüyordu ve panel varsayılan olarak
                KAPALI olduğu için çoğu öğrenci hiç açmıyordu.
                Desen artık listeden önce, açık hâlde duruyor. */}
            {stats.active >= 3 && (stats.byType.length > 1 || stats.bySubject.length > 1) && (
                <div className="premium-card p-4 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-ink-3">
                        Hata Desenim · {stats.active} açık kayıt
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Durum donutu: dört sayaç bütünü sayıyla veriyor,
                            oranını vermiyordu. */}
                        <SegmentliDonut
                            parcalar={durumDagilimi}
                            ortaEtiket="Kayıt"
                            boyut={118}
                            kalinlik={16}
                        />
                        {stats.byType.length > 1 && (
                            <div>
                                <p className="text-[11px] font-bold text-ink-2 mb-2">Hata Tipine Göre</p>
                                {/* Tip kimliği NOKTAYA, çubuk nötr.
                                    Ölçüldü: hata tipi paleti ders paletiyle
                                    çakışıyor — "Bilgi Eksiği" ile Türkçe aynı
                                    kırmızı, "Zaman Yetmedi" ile Matematik aynı
                                    mavi. Yandaki panel ders renklerini kimlik
                                    olarak kullandığı için, aynı kartta iki
                                    kırmızı çubuk iki ayrı şeyi anlatıyordu.
                                    Tipin rengi filtre çiplerindeki gibi korunur,
                                    yalnızca çubuğa taşınmaz. */}
                                <SayiCubuklari
                                    satirlar={stats.byType.map((t) => ({ ad: t.label, deger: t.count, nokta: t.color }))}
                                    enFazla={5}
                                />
                            </div>
                        )}
                        {stats.bySubject.length > 1 && (
                            <div>
                                <p className="text-[11px] font-bold text-ink-2 mb-2">Derse Göre</p>
                                {/* Renk = programdaki ders rengi. Matematik burada
                                    da programdaki mavisiyle görünür. */}
                                <SayiCubuklari
                                    satirlar={stats.bySubject.map((x) => ({
                                        ad: x.subject, deger: x.count, renk: dersRengi(x.subject),
                                    }))}
                                    enFazla={5}
                                />
                            </div>
                        )}
                    </div>

                    {/* KONUYA GÖRE — açık / öğrenildi kırılımı.
                        Ders kırılımı "nerede zorlanıyorum"u ders düzeyinde
                        yanıtlıyor; çalışılacak şey ise konudur. Segmentler
                        aynı ölçekte: 2 hatalı bir konu 9 hatalı konudan
                        kısa görünür, oranları değil miktarları karşılaştırılır. */}
                    {konu.konular.length > 1 && (
                        <div>
                            <p className="text-[11px] font-bold text-ink-2 mb-2">Konuya Göre</p>
                            <CokSegmentliCubuk
                                satirlar={konu.konular.slice(0, 6).map((k) => ({
                                    ad: k.konu,
                                    segmentler: [
                                        { ad: 'Açık', deger: k.sayi - k.cozulen, renk: 'var(--danger)' },
                                        { ad: 'Öğrenildi', deger: k.cozulen, renk: 'var(--ok)' },
                                    ],
                                }))}
                                adGenislik={116}
                                efsane={[
                                    { ad: 'Açık', renk: 'var(--danger)' },
                                    { ad: 'Öğrenildi', renk: 'var(--ok)' },
                                ]}
                            />
                        </div>
                    )}

                    {/* İYİLEŞTİRME ALANLARI — referanstaki tablo.
                        İki ve daha fazla kez tekrar eden konular; tek seferlik
                        hata dikkatsizlik olabilir, tekrar edeni konu eksiğidir.
                        Satırdaki düğme o konuyu listede süzer — öneri değil,
                        doğrudan eylem. */}
                    {konu.tekrarEden.length > 0 && (
                        <div>
                            <p className="text-[11px] font-bold text-ink-2 mb-2">
                                İyileştirme Alanları · tekrar eden {konu.tekrarEden.length} konu
                            </p>
                            <div className="overflow-x-auto rounded-dmd border border-line">
                                <table className="w-full text-left" style={{ minWidth: 420 }}>
                                    <thead>
                                        <tr className="bg-surface-2">
                                            <th className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-ink-3 w-10">#</th>
                                            <th className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-ink-3">Ders</th>
                                            <th className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-ink-3">Konu</th>
                                            <th className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-ink-3 text-right">Açık</th>
                                            <th className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-ink-3 text-right">Eylem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line">
                                        {konu.tekrarEden.slice(0, 8).map((k, i) => (
                                            <tr key={`${k.ders}|${k.konu}`} className="bg-surface">
                                                <td className="px-3 py-2 text-[11px] text-ink-3 tabular-nums">{i + 1}</td>
                                                <td className="px-3 py-2">
                                                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-ink">
                                                        <span className="w-2 h-2 rounded-full shrink-0"
                                                            style={{ background: dersRengi(k.ders) }} />
                                                        {k.ders || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-[11.5px] text-ink-2">{k.konu}</td>
                                                <td className="px-3 py-2 text-right">
                                                    <span className="text-[11px] font-black tabular-nums"
                                                        style={{ color: k.sayi - k.cozulen > 0 ? 'var(--danger)' : 'var(--ok)' }}>
                                                        {k.sayi - k.cozulen}/{k.sayi}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setSubjectFilter(k.ders || 'all'); setSearch(k.konu); setView('all'); }}
                                                        className="text-[11px] font-bold hover:underline min-h-[32px] px-1"
                                                        style={{ color: 'var(--brand-metin)' }}
                                                    >
                                                        Listede aç
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {trend.length >= 2 && (
                        <div>
                            <p className="text-[11px] font-bold text-ink-2 mb-1">Haftalık Seyir</p>
                            <div className="h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={trend} margin={{ top: 6, right: 8, bottom: 0, left: -24 }}>
                                        <CartesianGrid {...izgaraOzellikleri()} />
                                        <XAxis dataKey="etiket" {...eksenOzellikleri()} />
                                        <YAxis allowDecimals={false} {...eksenOzellikleri()} />
                                        <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, fontSize: 12 }} />
                                        {/* İki seri var — efsane burada gerçekten gerekli */}
                                        <GrafikEfsane iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                                        <Line type="monotone" dataKey="adet" name="Yeni hata"
                                            stroke="var(--danger)" strokeWidth={2.5} dot={{ r: 3 }} animationDuration={ANIMASYON} />
                                        <Line type="monotone" dataKey="cozulen" name="Çözülen"
                                            stroke="var(--ok)" strokeWidth={2.5} dot={{ r: 3 }} animationDuration={ANIMASYON} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Filtreler ──────────────────────────────── */}
            {(stats.bySubject.length > 1 || stats.byType.length > 1) && (
                <details className="premium-card">
                    <summary className="px-4 py-2.5 text-xs font-bold text-ink-3 cursor-pointer select-none flex items-center gap-2">
                        <Filter size={13} /> Filtrele
                        {(subjectFilter !== 'all' || typeFilter !== 'all') && (
                            <span className="text-[10px] font-black text-brand bg-brand/10 px-2 py-0.5 rounded">
                                AKTİF
                            </span>
                        )}
                    </summary>
                    <div className="px-4 pb-4 space-y-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-ink-3 mb-1.5">Ders</p>
                            <div className="flex flex-wrap gap-1">
                                <FilterChip active={subjectFilter === 'all'} onClick={() => setSubjectFilter('all')}>
                                    Tümü
                                </FilterChip>
                                {stats.bySubject.map((s) => (
                                    <FilterChip
                                        key={s.subject}
                                        active={subjectFilter === s.subject}
                                        onClick={() => setSubjectFilter(s.subject)}
                                    >
                                        {s.subject} ({s.count})
                                    </FilterChip>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-ink-3 mb-1.5">Hata Tipi</p>
                            <div className="flex flex-wrap gap-1">
                                <FilterChip active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>
                                    Tümü
                                </FilterChip>
                                {stats.byType.map((t) => (
                                    <FilterChip
                                        key={t.id}
                                        active={typeFilter === t.id}
                                        onClick={() => setTypeFilter(t.id)}
                                        color={t.color}
                                    >
                                        {t.label} ({t.count})
                                    </FilterChip>
                                ))}
                            </div>
                        </div>
                    </div>
                </details>
            )}

            {/* ── Liste ──────────────────────────────────── */}
            {filtered.length === 0 ? (
                <div className="premium-card p-12 text-center">
                    <BookX size={36} className="text-ink-3 mx-auto mb-3" />
                    <p className="text-ink-3 text-sm font-bold">
                        {myEntries.length === 0
                            ? 'Hata defterin henüz boş'
                            : view === 'due'
                                ? 'Şu an tekrar edilecek soru yok 🎉'
                                : 'Bu filtreye uyan kayıt yok'}
                    </p>
                    {myEntries.length === 0 && !readOnly && (
                        <p className="text-ink-3 text-xs mt-2 max-w-sm mx-auto leading-relaxed">
                            Yanlış yaptığın her soruyu buraya kaydet. Sistem seni 1 gün, 3 gün, 1 hafta,
                            3 hafta ve 2 ay sonra o soruya geri getirir — böylece kalıcı öğrenirsin.
                        </p>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((e) => (
                        <EntryCard
                            key={e.id}
                            entry={e}
                            readOnly={readOnly}
                            now={now}
                            onReview={reviewEntry}
                            onRemove={removeEntry}
                            onReset={resetEntry}
                        />
                    ))}
                </div>
            )}

            </>
            )}

            {showForm && <EntryForm ogrenci={ogrenci} onSave={addEntry} onClose={() => setShowForm(false)} />}
        </div>
    );
};

// ════════════════════════════════════════════════════════════
const FilterChip = ({ active, onClick, color, children }) => (
    <button
        onClick={onClick}
        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
            active ? 'text-ink-on' : 'bg-surface/5 text-ink-3 hover:text-ink-2'
        }`}
        style={active ? { backgroundColor: color || 'var(--highlight)' } : undefined}
    >
        {children}
    </button>
);

// ════════════════════════════════════════════════════════════
const EntryCard = ({ entry, readOnly, now, onReview, onRemove, onReset }) => {
    const [expanded, setExpanded] = useState(false);
    const type = typeById(entry.errorType);
    const isDue = !entry.mastered && (entry.nextReviewAt ?? 0) <= now;

    const dueLabel = entry.mastered
        ? 'Kalıcı öğrenildi'
        : isDue
            ? 'Şimdi tekrar et'
            : `${Math.ceil((entry.nextReviewAt - now) / DAY_MS)} gün sonra`;

    return (
        <div className={`premium-card overflow-hidden transition ${isDue ? 'border-danger/25' : ''}`}>
            <button
                onClick={() => setExpanded((x) => !x)}
                className="w-full p-4 flex items-start gap-3 text-left"
            >
                <div
                    className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border"
                    style={{ backgroundColor: `${type.color}15`, borderColor: `${type.color}35` }}
                >
                    <type.icon size={16} style={{ color: type.color }} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-ink font-bold text-sm">{entry.subject}</span>
                        {entry.topic && (
                            <span className="text-ink-3 text-xs truncate">· {entry.topic}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded" style={{ backgroundColor: `${type.color}15`, color: type.color }}>
                            {type.label}
                        </span>
                        <span className={`text-[11px] font-bold ${
                            entry.mastered ? 'text-accent' : isDue ? 'text-danger' : 'text-ink-3'
                        }`}>
                            {dueLabel}
                        </span>
                        {entry.reviewCount > 0 && (
                            <span className="text-[11px] text-ink-3">{entry.reviewCount} tekrar</span>
                        )}
                    </div>
                </div>

                <ChevronDown
                    size={16}
                    className={`text-ink-3 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
                />
            </button>

            {expanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-line pt-3">
                    {entry.source && (
                        <Field label="Kaynak" value={entry.source} />
                    )}
                    {entry.note && (
                        <Field label="Neden yanlış yaptım" value={entry.note} multiline />
                    )}
                    {entry.correctApproach && (
                        <Field label="Doğru yaklaşım" value={entry.correctApproach} multiline />
                    )}

                    {/* Aşama göstergesi */}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-ink-3 mb-1.5">
                            Tekrar Aşaması
                        </p>
                        <div className="flex gap-1">
                            {REVIEW_STAGES.map((days, i) => (
                                <div
                                    key={i}
                                    title={`${days} gün`}
                                    className={`flex-1 h-1.5 rounded-full ${
                                        i < entry.stage ? 'bg-accent' : 'bg-surface/8'
                                    }`}
                                />
                            ))}
                        </div>
                        <p className="text-[10px] text-ink-3 mt-1">
                            {entry.stage}/{REVIEW_STAGES.length} aşama tamamlandı
                        </p>
                    </div>

                    {!readOnly && (
                        <div className="flex gap-2 pt-1">
                            {!entry.mastered ? (
                                <>
                                    <button
                                        onClick={() => onReview(entry.id, true)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent text-white font-bold text-xs active:scale-95 transition"
                                    >
                                        <CheckCircle2 size={13} /> Şimdi çözebildim
                                    </button>
                                    <button
                                        onClick={() => onReview(entry.id, false)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-danger/15 border border-danger/30 text-danger font-bold text-xs active:scale-95 transition"
                                    >
                                        <RotateCcw size={13} /> Hâlâ yapamıyorum
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => onReset(entry.id)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-line text-ink-3 font-bold text-xs hover:bg-surface/5 transition"
                                >
                                    <RotateCcw size={13} /> Tekrar döngüsüne al
                                </button>
                            )}
                            <button
                                onClick={() => onRemove(entry.id)}
                                className="px-3 rounded-xl text-ink-3 hover:text-danger hover:bg-danger/10 transition"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const Field = ({ label, value, multiline }) => (
    <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-ink-3 mb-1">{label}</p>
        <p className={`text-sm text-ink/75 leading-relaxed ${multiline ? 'whitespace-pre-wrap' : ''}`}>
            {value}
        </p>
    </div>
);

// ════════════════════════════════════════════════════════════
const EntryForm = ({ onSave, onClose, ogrenci = null }) => {
    const dersler = useMemo(() => ogrencininDersleri(ogrenci), [ogrenci]);
    const dersAdlari = dersler.length ? dersler.map((d) => d.ad) : YEDEK_DERSLER;
    const [konuSerbest, setKonuSerbest] = useState(false);
    const [form, setForm] = useState({
        subject: undefined,
        topic: '',
        source: '',
        errorType: 'knowledge',
        note: '',
        correctApproach: '',
    });

    const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
    const seciliDers = form.subject ?? dersAdlari[0] ?? '';
    const konular = dersinKonulari(dersler, seciliDers);
    const valid = seciliDers && form.topic.trim();

    return (
        <Modal
            acik
            onClose={onClose}
            baslikGizle
            genislik="lg"
            govdeClassName="p-0 flex flex-col overflow-hidden"
        >
            <div className="shrink-0 bg-surface flex items-center justify-between px-5 py-4 border-b border-line">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-brand/15 border border-brand/30 flex items-center justify-center">
                        <BookX size={17} className="text-brand" />
                    </div>
                    <h3 className="text-ink font-black text-base syne">Hata Kaydı Ekle</h3>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl text-ink-3 hover:text-ink hover:bg-surface/10 transition">
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label>Ders *</Label>
                        <select
                            value={seciliDers}
                            onChange={(e) => { setForm((p) => ({ ...p, subject: e.target.value, topic: '' })); setKonuSerbest(false); }}
                            className="w-full bg-surface/[0.04] border border-line rounded-xl px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand/40"
                        >
                            {dersAdlari.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <Label>Konu *</Label>
                        {konular.length > 0 && !konuSerbest ? (
                            <select
                                value={form.topic}
                                onChange={(e) => {
                                    if (e.target.value === '__diger__') { setKonuSerbest(true); setForm((p) => ({ ...p, topic: '' })); return; }
                                    setForm((p) => ({ ...p, topic: e.target.value }));
                                }}
                                className="w-full bg-surface/[0.04] border border-line rounded-xl px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand/40"
                            >
                                <option value="">— Konu seç —</option>
                                {konular.map((kAd) => <option key={kAd} value={kAd}>{kAd}</option>)}
                                <option value="__diger__">Diğer…</option>
                            </select>
                        ) : (
                            <input
                                value={form.topic}
                                onChange={set('topic')}
                                placeholder="Türev - Zincir kuralı"
                                className="w-full bg-surface/[0.04] border border-line rounded-xl px-3 py-2.5 text-sm text-ink placeholder-white/25 focus:outline-none focus:border-brand/40"
                            />
                        )}
                    </div>
                </div>

                <div>
                    <Label>Kaynak</Label>
                    <input
                        value={form.source}
                        onChange={set('source')}
                        placeholder="3. TYT Denemesi - Soru 27"
                        className="w-full bg-surface/[0.04] border border-line rounded-xl px-3 py-2.5 text-sm text-ink placeholder-white/25 focus:outline-none focus:border-brand/40"
                    />
                </div>

                <div>
                    <Label>Neden yanlış yaptın? *</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ERROR_TYPES.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setForm((p) => ({ ...p, errorType: t.id }))}
                                className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition ${
                                    form.errorType === t.id
                                        ? 'bg-surface/[0.06] border-line-2'
                                        : 'bg-surface/[0.02] border-line hover:border-white/12'
                                }`}
                            >
                                <t.icon size={16} style={{ color: t.color }} className="shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                    <p className="text-ink text-xs font-bold">{t.label}</p>
                                    <p className="text-ink-3 text-[10px] leading-snug">{t.hint}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <Label>Notun</Label>
                    <textarea
                        value={form.note}
                        onChange={set('note')}
                        rows={2}
                        placeholder="Hangi adımda takıldın?"
                        className="w-full bg-surface/[0.04] border border-line rounded-xl px-3 py-2.5 text-sm text-ink placeholder-white/25 focus:outline-none focus:border-brand/40 resize-none"
                    />
                </div>

                <div>
                    <Label>Doğru yaklaşım</Label>
                    <textarea
                        value={form.correctApproach}
                        onChange={set('correctApproach')}
                        rows={2}
                        placeholder="Bu soruyu bir daha görsem nasıl çözerim?"
                        className="w-full bg-surface/[0.04] border border-line rounded-xl px-3 py-2.5 text-sm text-ink placeholder-white/25 focus:outline-none focus:border-brand/40 resize-none"
                    />
                    <p className="text-ink-3 text-[11px] mt-1.5">
                        Bunu yazmak, tekrar ettiğinde en çok işine yarayan kısım olacak.
                    </p>
                </div>
            </div>

            <div className="sticky bottom-0 bg-surface flex gap-2 px-5 py-4 border-t border-line">
                <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl text-ink-3 font-bold text-sm hover:bg-surface/5 transition"
                >
                    Vazgeç
                </button>
                <button
                    onClick={() => valid && onSave({ ...form, subject: seciliDers })}
                    disabled={!valid}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand text-ink-on font-black text-sm disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition"
                >
                    <Plus size={16} /> Kaydet ve tekrar planına al
                </button>
            </div>
        </Modal>
    );
};

const Label = ({ children }) => (
    <label className="block text-[10px] font-black uppercase tracking-widest text-ink-3 mb-1.5">
        {children}
    </label>
);

export default ErrorNotebook;
