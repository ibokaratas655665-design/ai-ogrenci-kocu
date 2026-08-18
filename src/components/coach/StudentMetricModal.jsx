import React, { useMemo } from 'react';
import {
    X, BookOpen, PencilLine, CheckCircle2, Circle, RotateCcw,
    BarChart2, TrendingUp, Calendar,
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import topics, { DURUMLAR } from '../../services/topicProgressService';
import { matchResultsForStudent } from '../../services/reportService';
import { lightAxis, lightGrid, lightTooltip } from '../charts/chartTheme';
import Modal from '../ui/Modal';

/**
 * 📋 ÖĞRENCİ ÖLÇÜT DETAYI
 *
 * Öğrenci listesindeki ölçüt butonlarına tıklanınca açılan pencere.
 * Her ölçüt kendi ayrıntısını gösterir; hepsi öğrencinin GERÇEK
 * kaydından okunur:
 *
 *   soru    → günlük çalışma kaydı (study_log), gün gün ve ders ders
 *   kitap   → aynı kaydın kitap satırları
 *   cozulen → konu takibi motorundan tamamlanan konular
 *   kalan   → çalışılan + tekrar isteyen + başlanmayan konular
 *   net     → koçun yüklediği deneme sonuçları
 *   grafik  → aynı sonuçların net gelişim eğrisi
 *
 * Ayrıntı yalnızca pencere açıldığında ve TEK öğrenci için hesaplanır;
 * listede 50 öğrencinin ayrıntısını önden üretmek gereksiz yük olurdu.
 */

const safeParse = (key, def = []) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw || !raw.trim()) return def;
        const v = JSON.parse(raw);
        return v ?? def;
    } catch {
        return def;
    }
};

const trTarih = (d) => (d ? String(d).split('-').reverse().join('.') : '—');

const OLCUT_BASLIK = {
    soru: { ad: 'Soru Çalışması', icon: PencilLine, renk: 'var(--brand)' },
    kitap: { ad: 'Kitap Okuma', icon: BookOpen, renk: 'var(--info)' },
    cozulen: { ad: 'Çözülen Konular', icon: CheckCircle2, renk: 'var(--ok)' },
    kalan: { ad: 'Kalan Konular', icon: Circle, renk: 'var(--warn)' },
    net: { ad: 'Deneme Sonuçları', icon: TrendingUp, renk: 'var(--c4)' },
    grafik: { ad: 'Deneme Gelişim Grafiği', icon: BarChart2, renk: 'var(--c5)' },
};

const StudentMetricModal = ({ student, olcut, onKapat }) => {
    const baslik = OLCUT_BASLIK[olcut];

    /** Günlük çalışma kaydı — soru ve kitap sekmeleri bunu kullanır. */
    const kayitlar = useMemo(() => {
        const hepsi = safeParse('study_log', []);
        return (Array.isArray(hepsi) ? hepsi : [])
            .filter((e) => String(e.studentId) === String(student?.id))
            .sort((a, b) => String(b.date).localeCompare(String(a.date)));
    }, [student?.id]);

    /** Konu takibi — öğrencinin kendi sınav ve alanına göre. */
    const konular = useMemo(() => {
        if (olcut !== 'cozulen' && olcut !== 'kalan') return [];
        const olcutler = topics.olcutOku();
        const sinav = topics.ogrencininSinavi(student);
        return topics.ogrencininBolumleri(student, sinav).flatMap((b) =>
            topics.konuHaritasi(student?.id, sinav, olcutler, b.id).dersler
                .flatMap((d) => d.konular.map((k) => ({ ...k, ders: d.ad, bolum: b.ad }))));
    }, [student, olcut]);

    /** Deneme sonuçları. */
    const denemeler = useMemo(() => {
        if (olcut !== 'net' && olcut !== 'grafik') return [];
        return matchResultsForStudent(student, safeParse('v2_results_data'))
            .map((r) => ({
                ad: r.examName || r.trialName || r.name || 'Deneme',
                net: Number(r.totalNet) || 0,
                tarih: (r.uploadedAt || r.date || '').slice(0, 10),
                zaman: new Date(r.uploadedAt || r.date || 0).getTime(),
                ham: r,
            }))
            .sort((a, b) => a.zaman - b.zaman);
    }, [student, olcut]);

    if (!student || !baslik) return null;
    const Icon = baslik.icon;

    return (
        <Modal
            acik
            onClose={onKapat}
            baslikGizle
            genislik="xl"
            govdeClassName="p-0 flex flex-col overflow-hidden"
        >

            {/* Başlık */}
            <div className="shrink-0 flex items-start gap-3 p-5 border-b border-line">
                <span className="sec-icon" style={{ '--acc': baslik.renk }}>
                    <Icon size={17} />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="eyebrow">{student.name}</p>
                    <h3 className="h2">{baslik.ad}</h3>
                </div>
                <button onClick={onKapat} aria-label="Kapat" className="b b-bare b-icon shrink-0">
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-5">
                {olcut === 'soru' && <SoruDetay kayitlar={kayitlar} />}
                {olcut === 'kitap' && <KitapDetay kayitlar={kayitlar} />}
                {olcut === 'cozulen' && <KonuDetay konular={konular} mod="cozulen" />}
                {olcut === 'kalan' && <KonuDetay konular={konular} mod="kalan" />}
                {olcut === 'net' && <NetDetay denemeler={denemeler} />}
                {olcut === 'grafik' && <GrafikDetay denemeler={denemeler} />}
            </div>
        </Modal>
    );
};

// ══════════════════════════════════════════════════════════════

const Bos = ({ metin }) => (
    <div className="srf-in p-10 text-center">
        <p className="text-xs text-ink-3 leading-snug max-w-sm mx-auto">{metin}</p>
    </div>
);

const Kutu = ({ etiket, deger, renk, alt }) => (
    <div className="srf srf-accent p-3.5" style={{ '--acc': renk }}>
        <p className="eyebrow">{etiket}</p>
        <p className="num text-2xl mt-1" style={{ color: renk }}>{deger}</p>
        {alt && <p className="text-[10px] text-ink-3 mt-0.5">{alt}</p>}
    </div>
);

// ── Soru detayı ───────────────────────────────────────────────
const SoruDetay = ({ kayitlar }) => {
    const soru = kayitlar.filter((e) => !e.kind || e.kind === 'soru');
    if (soru.length === 0) {
        return <Bos metin="Öğrenci henüz günlük kayda soru girmemiş. Öğrenci panelindeki “Günlük Kayıt” ekranından girdiği her soru buraya düşer." />;
    }

    const topla = (f) => soru.reduce((t, e) => t + (Number(e[f]) || 0), 0);
    const dogru = topla('correct'), yanlis = topla('wrong'), bos = topla('blank');
    const toplam = dogru + yanlis + bos;
    const isabet = (dogru + yanlis) > 0 ? Math.round((dogru / (dogru + yanlis)) * 100) : null;

    // Ders bazlı dağılım — koçun "hangi derse ağırlık veriyor" sorusu
    const dersler = new Map();
    soru.forEach((e) => {
        const d = e.subject || 'Belirtilmemiş';
        const m = dersler.get(d) || { soru: 0, dogru: 0, yanlis: 0 };
        m.soru += (Number(e.correct) || 0) + (Number(e.wrong) || 0) + (Number(e.blank) || 0);
        m.dogru += Number(e.correct) || 0;
        m.yanlis += Number(e.wrong) || 0;
        dersler.set(d, m);
    });
    const dersListesi = [...dersler.entries()].sort((a, b) => b[1].soru - a[1].soru);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <Kutu etiket="Toplam Soru" deger={toplam} renk="var(--brand)" />
                <Kutu etiket="Doğru" deger={dogru} renk="var(--ok)" />
                <Kutu etiket="Yanlış" deger={yanlis} renk="var(--danger)" />
                <Kutu etiket="İsabet" deger={isabet != null ? `%${isabet}` : '—'}
                    renk={isabet == null ? 'var(--ink-3)' : isabet >= 70 ? 'var(--ok)' : isabet >= 50 ? 'var(--warn)' : 'var(--danger)'} />
            </div>

            <div>
                <p className="eyebrow mb-2">Ders Bazlı Dağılım</p>
                <div className="space-y-1.5">
                    {dersListesi.map(([ders, m]) => {
                        const oran = toplam ? Math.round((m.soru / toplam) * 100) : 0;
                        const isb = (m.dogru + m.yanlis) > 0 ? Math.round((m.dogru / (m.dogru + m.yanlis)) * 100) : null;
                        return (
                            <div key={ders} className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-ink-2 w-28 shrink-0 truncate">{ders}</span>
                                <div className="bar flex-1" style={{ '--acc': 'var(--brand)', height: 7 }}>
                                    <i style={{ width: `${oran}%` }} />
                                </div>
                                <span className="text-[10px] font-black text-ink-3 tabular-nums w-24 text-right shrink-0">
                                    {m.soru} soru{isb != null ? ` · %${isb}` : ''}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div>
                <p className="eyebrow mb-2">Kayıt Dökümü ({soru.length})</p>
                <div className="srf overflow-hidden">
                    <div className="flex items-center gap-3 px-3 py-1.5 bg-surface-2 border-b border-line">
                        <span className="eyebrow w-20 shrink-0">Tarih</span>
                        <span className="eyebrow flex-1">Ders / Konu</span>
                        <span className="eyebrow w-28 text-right shrink-0">D / Y / B</span>
                    </div>
                    <div className="divide-y divide-line max-h-72 overflow-y-auto">
                        {soru.map((e) => (
                            <div key={e.id} className="flex items-center gap-3 px-3 py-2">
                                <span className="text-[11px] text-ink-3 w-20 shrink-0">{trTarih(e.date)}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[12px] font-bold text-ink truncate">{e.topic || '—'}</p>
                                    <p className="text-[10px] text-ink-3">{e.subject || 'Ders belirtilmemiş'}</p>
                                </div>
                                <span className="text-[11px] font-black tabular-nums w-28 text-right shrink-0">
                                    <span className="text-ok">{e.correct || 0}</span>
                                    <span className="text-ink-3"> / </span>
                                    <span className="text-danger">{e.wrong || 0}</span>
                                    <span className="text-ink-3"> / {e.blank || 0}</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Kitap detayı ──────────────────────────────────────────────
const KitapDetay = ({ kayitlar }) => {
    const kitap = kayitlar.filter((e) => e.kind === 'kitap');
    if (kitap.length === 0) {
        return <Bos metin="Öğrenci henüz kitap kaydı girmemiş. Günlük Kayıt ekranından okuduğu sayfa sayısını girdiğinde buraya düşer." />;
    }

    const toplamSayfa = kitap.reduce((t, e) => t + (Number(e.pages) || 0), 0);
    const kitaplar = new Map();
    kitap.forEach((e) => {
        const ad = e.subject || 'Kitap adı yok';
        kitaplar.set(ad, (kitaplar.get(ad) || 0) + (Number(e.pages) || 0));
    });

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <Kutu etiket="Toplam Sayfa" deger={toplamSayfa} renk="var(--info)" />
                <Kutu etiket="Kayıt Sayısı" deger={kitap.length} renk="var(--brand)" />
                <Kutu etiket="Kitap Sayısı" deger={kitaplar.size} renk="var(--c4)" />
            </div>

            <div>
                <p className="eyebrow mb-2">Kitap Bazlı</p>
                <div className="space-y-1.5">
                    {[...kitaplar.entries()].sort((a, b) => b[1] - a[1]).map(([ad, sayfa]) => (
                        <div key={ad} className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-ink-2 flex-1 truncate">{ad}</span>
                            <div className="bar w-32" style={{ '--acc': 'var(--info)', height: 7 }}>
                                <i style={{ width: `${toplamSayfa ? Math.round((sayfa / toplamSayfa) * 100) : 0}%` }} />
                            </div>
                            <span className="text-[10px] font-black text-ink-3 tabular-nums w-16 text-right shrink-0">
                                {sayfa} sf
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <p className="eyebrow mb-2">Kayıt Dökümü</p>
                <div className="srf divide-y divide-line max-h-72 overflow-y-auto">
                    {kitap.map((e) => (
                        <div key={e.id} className="flex items-center gap-3 px-3 py-2">
                            <span className="text-[11px] text-ink-3 w-20 shrink-0">{trTarih(e.date)}</span>
                            <span className="text-[12px] font-bold text-ink flex-1 truncate">{e.subject || '—'}</span>
                            <span className="text-[11px] font-black text-info tabular-nums shrink-0">{e.pages || 0} sayfa</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ── Konu detayı ───────────────────────────────────────────────
const KonuDetay = ({ konular, mod }) => {
    const liste = mod === 'cozulen'
        ? konular.filter((k) => k.tamam)
        : konular.filter((k) => !k.tamam);

    if (liste.length === 0) {
        return (
            <Bos metin={mod === 'cozulen'
                ? 'Henüz tamamlanan konu yok. Konu, hedef soru sayısı çözülüp isabet eşiği tutunca tamamlanmış sayılır.'
                : 'Bütün konular tamamlanmış görünüyor.'} />
        );
    }

    // Kalan konular durumuna göre gruplanır: önce tekrar, sonra devam
    const gruplar = mod === 'cozulen'
        ? [{ id: 'tamamlandi', liste }]
        : ['tekrar', 'calisiliyor', 'planlandi', 'baslanmadi']
            .map((id) => ({ id, liste: liste.filter((k) => k.durum === id) }))
            .filter((g) => g.liste.length > 0);

    return (
        <div className="space-y-4">
            {gruplar.map((g) => {
                const d = DURUMLAR[g.id];
                return (
                    <div key={g.id}>
                        <p className="eyebrow mb-2" style={{ color: d.renk }}>
                            {d.ikon} {d.ad} ({g.liste.length})
                        </p>
                        <div className="srf divide-y divide-line max-h-80 overflow-y-auto">
                            {g.liste.map((k) => (
                                <div key={`${k.bolum}-${k.ders}-${k.konu}`} className="flex items-center gap-3 px-3 py-2">
                                    <span className="shrink-0">
                                        {k.tamam
                                            ? <CheckCircle2 size={15} className="text-ok" />
                                            : k.durum === 'tekrar'
                                                ? <RotateCcw size={15} className="text-danger" />
                                                : <Circle size={15} className="text-ink-3" />}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[12px] font-bold text-ink truncate">{k.konu}</p>
                                        <p className="text-[10px] text-ink-3">{k.bolum} · {k.ders}</p>
                                    </div>
                                    <span className="text-[11px] font-black tabular-nums shrink-0 text-right">
                                        <span className={k.soru > 0 ? 'text-ink' : 'text-ink-3'}>{k.soru}</span>
                                        <span className="text-ink-3"> / {k.hedef}</span>
                                        {k.basari != null && (
                                            <span className="block text-[10px] font-bold"
                                                style={{ color: k.basari >= 60 ? 'var(--ok)' : k.basari >= 50 ? 'var(--warn)' : 'var(--danger)' }}>
                                                %{k.basari}
                                            </span>
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// ── Deneme listesi ────────────────────────────────────────────
const NetDetay = ({ denemeler }) => {
    if (denemeler.length === 0) {
        return <Bos metin="Bu öğrenci için yüklenmiş deneme sonucu yok. Denemeler sekmesinden Excel/PDF yüklediğinizde sonuçlar okul numarasına göre eşleşir." />;
    }

    const sonrakiEski = [...denemeler].reverse();
    const netler = denemeler.map((d) => d.net);
    const enYuksek = Math.max(...netler);
    const enDusuk = Math.min(...netler);
    const ortalama = Math.round((netler.reduce((a, b) => a + b, 0) / netler.length) * 10) / 10;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <Kutu etiket="Deneme" deger={denemeler.length} renk="var(--brand)" />
                <Kutu etiket="Son Net" deger={denemeler[denemeler.length - 1].net} renk="var(--c4)" />
                <Kutu etiket="En Yüksek" deger={enYuksek} renk="var(--ok)" />
                <Kutu etiket="Ortalama" deger={ortalama} renk="var(--info)" alt={`en düşük ${enDusuk}`} />
            </div>

            <div className="srf overflow-hidden">
                <div className="flex items-center gap-3 px-3 py-1.5 bg-surface-2 border-b border-line">
                    <span className="eyebrow w-20 shrink-0">Tarih</span>
                    <span className="eyebrow flex-1">Deneme</span>
                    <span className="eyebrow w-24 text-right shrink-0">Net</span>
                </div>
                <div className="divide-y divide-line max-h-80 overflow-y-auto">
                    {sonrakiEski.map((d, i) => {
                        const oncekiIdx = denemeler.length - 1 - i - 1;
                        const fark = oncekiIdx >= 0 ? Math.round((d.net - denemeler[oncekiIdx].net) * 10) / 10 : null;
                        return (
                            <div key={`${d.tarih}-${d.ad}-${i}`} className="flex items-center gap-3 px-3 py-2">
                                <span className="text-[11px] text-ink-3 w-20 shrink-0">{trTarih(d.tarih)}</span>
                                <span className="text-[12px] font-bold text-ink flex-1 truncate">{d.ad}</span>
                                <span className="text-[12px] font-black tabular-nums w-24 text-right shrink-0">
                                    {d.net}
                                    {fark != null && fark !== 0 && (
                                        <span className="ml-1 text-[10px]"
                                            style={{ color: fark > 0 ? 'var(--ok)' : 'var(--danger)' }}>
                                            {fark > 0 ? '▲' : '▼'}{Math.abs(fark)}
                                        </span>
                                    )}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// ── Deneme grafiği ────────────────────────────────────────────
const GrafikDetay = ({ denemeler }) => {
    if (denemeler.length === 0) {
        return <Bos metin="Grafik çizmek için yüklenmiş deneme sonucu gerekiyor." />;
    }
    if (denemeler.length === 1) {
        return (
            <Bos metin={`Tek deneme sonucu var (${denemeler[0].net} net). Gelişim eğrisi için en az iki deneme gerekiyor.`} />
        );
    }

    const veri = denemeler.map((d, i) => ({
        ad: `D${i + 1}`,
        net: d.net,
        tarih: trTarih(d.tarih),
        tam: d.ad,
    }));

    const ilk = denemeler[0].net;
    const son = denemeler[denemeler.length - 1].net;
    const degisim = Math.round((son - ilk) * 10) / 10;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2.5">
                <Kutu etiket="İlk Net" deger={ilk} renk="var(--ink-3)" />
                <Kutu etiket="Son Net" deger={son} renk="var(--c4)" />
                <Kutu
                    etiket="Toplam Değişim"
                    deger={`${degisim > 0 ? '+' : ''}${degisim}`}
                    renk={degisim > 0 ? 'var(--ok)' : degisim < 0 ? 'var(--danger)' : 'var(--ink-3)'}
                    alt={`${denemeler.length} deneme`}
                />
            </div>

            <div className="srf p-4">
                <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={veri} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
                        <CartesianGrid {...lightGrid}  vertical={false} />
                        <XAxis dataKey="ad" {...lightAxis} />
                        <YAxis {...lightAxis} />
                        <Tooltip
                            {...lightTooltip}
                            formatter={(v) => [`${v} net`, 'Net']}
                            labelFormatter={(_, p) => {
                                const d = p?.[0]?.payload;
                                return d ? `${d.tam} · ${d.tarih}` : '';
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="net"
                            stroke="var(--brand)"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: 'var(--brand)' }}
                            activeDot={{ r: 6 }}
                         animationDuration={300} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <p className="text-[11px] text-ink-3 leading-snug flex items-start gap-1.5">
                <Calendar size={12} className="shrink-0 mt-0.5" />
                Grafik, Denemeler sekmesinden yüklediğiniz sonuçlardan çizilir; sonuçlar
                öğrencinin okul numarası ya da adıyla eşleştirilir.
            </p>
        </div>
    );
};

export default StudentMetricModal;
