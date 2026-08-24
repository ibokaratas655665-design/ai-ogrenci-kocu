/**
 * 📊 KOÇ GENEL BAKIŞ — profesyonel analiz merkezi (23.08.2026 tasarım)
 *
 * Referans tasarımın koç panosu: koç bir öğrenci seçer, öğrencinin son
 * 30 günü TEK ekranda görselleşir — KPI şeridi, net gelişimi, ders ve
 * hata dağılımları, çalışma istikrarı, son 5 deneme, koç dönütü ve
 * riskli alanlar. Öğrenci seçilmediyse sınıf kesiti gösterilir.
 *
 * Veri kaynakları mevcut motorlar: studyLogService, denemeAnalizi,
 * denemeKayitlari, reportService. Yeni veri üretilmez; sahte sayı yok —
 * veri olmayan bölüm boş durum mesajı gösterir.
 */
import React, { useMemo, useState, useEffect } from 'react';
import {
    ChevronDown, FileText, Send, AlertTriangle,
    ClipboardList, TrendingUp, BookX, Clock, BarChart2, Activity,
} from 'lucide-react';
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import { listeOku } from '../../services/veriDeposu';
import { getSummary } from '../../services/studyLogService';
import denemeKayitlari from '../../services/denemeKayitlari';
import {
    birlesikDenemeler, dersOzeti, konuHatalari, calismaOncelikleri,
} from '../../utils/denemeAnalizi';
import { buildClassReport } from '../../services/reportService';
import { api } from '../../services/api';
import { bildir } from '../../services/uiGeriBildirim';
import { cn } from '../../lib/cn';
import { hataTuruAdi } from '../../data/hataTurleri';
import { MiniSeri } from '../charts/Analitik';

/* Hata türü adları data/hataTurleri'nden — bkz. o dosyadaki not. */
const PASTA_RENKLERI = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)'];

/**
 * DURUM KARTI — referanstaki "Present Class / Home Work / Project Submit"
 * üçlüsünün karşılığı.
 *
 * Kalıbın işe yarayan yanı yüzdenin YANINDA bir yargı bulunması:
 * "%60" tek başına iyi mi kötü mü söylemez, "Zayıf" söyler. Eşikler
 * tek yerde tanımlı ki üç kart aynı ölçüyle konuşsun.
 *
 * Halka rengi durumu taşır (iyi/uyarı/kötü); bu bir DEĞERLENDİRME
 * göstergesidir, gün içi sayaç değil — kırmızı burada doğrudur.
 */
const DURUM_ESIK = [
    { alt: 80, ad: 'Çok iyi', renk: 'var(--ok)' },
    { alt: 55, ad: 'Geliştirilmeli', renk: 'var(--warn)' },
    { alt: -1, ad: 'Zayıf', renk: 'var(--danger)' },
];
const durumBul = (oran) => DURUM_ESIK.find((d) => oran >= d.alt) || DURUM_ESIK[2];

const DurumKarti = ({ baslik, aciklama, oran, altMetin }) => {
    if (oran == null || !Number.isFinite(Number(oran))) return null;
    const o = Math.max(0, Math.min(100, Math.round(Number(oran))));
    const d = durumBul(o);
    const R = 34, C = 2 * Math.PI * R;

    return (
        <div className="card p-4 flex items-center gap-4">
            <div className="min-w-0 flex-1">
                <h4 className="text-[15px] font-black text-ink leading-tight m-0">{baslik}</h4>
                <p className="tip-caption mt-1 leading-snug">{aciklama}</p>
                <span className="inline-flex items-center gap-1.5 mt-2.5 text-[11.5px] font-black"
                    style={{ color: d.renk }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.renk }} />
                    {d.ad}
                </span>
            </div>
            <div className="relative shrink-0" style={{ width: 84, height: 84 }}>
                <svg width="84" height="84" className="-rotate-90" aria-hidden="true">
                    <circle cx="42" cy="42" r={R} fill="none" stroke="var(--surface-3)" strokeWidth="11" />
                    <circle cx="42" cy="42" r={R} fill="none" stroke={d.renk} strokeWidth="11" strokeLinecap="round"
                        strokeDasharray={C} strokeDashoffset={C - (C * o) / 100}
                        style={{ transition: 'stroke-dashoffset .6s ease' }} />
                </svg>
                <span className="absolute inset-0 grid place-items-center text-[17px] font-black tabular-nums"
                    style={{ color: d.renk }}>%{o}</span>
            </div>
            {altMetin && <span className="sr-only">{altMetin}</span>}
        </div>
    );
};
const GRAFIK_STIL = { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12 };
const GUN_KISA = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

/** KPI kartı — sayı + önceki döneme göre değişim. */
const Kpi = ({ etiket, deger, fark, birim = '', iyiYon = 1, simge: Simge }) => {
    const yon = fark == null ? null : Math.sign(fark) * iyiYon; // 1 iyi, -1 kötü
    return (
        <div className="card p-4">
            <div className="flex items-center justify-between gap-2">
                <p className="tip-label text-ink-3">{etiket}</p>
                {Simge && <Simge size={15} className="text-ink-3" />}
            </div>
            <p className="text-2xl font-black text-ink syne rakam mt-1.5">{deger}</p>
            {fark != null && fark !== 0 && (
                <p className={cn('text-[11px] font-bold mt-0.5', yon > 0 ? 'text-ok' : 'text-danger')}>
                    {fark > 0 ? '↑' : '↓'} {Math.abs(fark)}{birim}
                    <span className="text-ink-3 font-semibold"> önceki 30 güne göre</span>
                </p>
            )}
        </div>
    );
};

const Bolum = ({ baslik, aksiyon, children, className }) => (
    /* min-w-0: grid içinde recharts kabının daralabilmesi için şart —
       yoksa grafik kartı komşusunu itip yatay taşma yaratıyor. */
    <div className={cn('card p-4 sm:p-5 min-w-0 overflow-hidden', className)}>
        <div className="flex items-center justify-between gap-3 mb-3">
            <h4 className="tip-h4">{baslik}</h4>
            {aksiyon}
        </div>
        {children}
    </div>
);

const BosVeri = ({ metin }) => (
    <div className="h-40 flex items-center justify-center text-sm text-ink-3 text-center px-4">{metin}</div>
);

export default function KocGenelBakis({ students = [], user, onKarneAc }) {
    const [seciliId, setSeciliId] = useState(() => {
        try { return localStorage.getItem('genel_bakis_ogrenci') || ''; } catch { return ''; }
    });
    useEffect(() => {
        try { localStorage.setItem('genel_bakis_ogrenci', seciliId); } catch { /* ignore */ }
    }, [seciliId]);

    const secili = students.find((s) => String(s.id) === String(seciliId)) || null;

    /* Öğrenci verisi kaydedildikçe tazelen (storage olayı). */
    const [surum, setSurum] = useState(0);
    useEffect(() => {
        const tetik = () => setSurum((v) => v + 1);
        window.addEventListener('storage', tetik);
        return () => window.removeEventListener('storage', tetik);
    }, []);

    /* ── Seçili öğrencinin 30 günlük kesiti ─────────────────── */
    const veri = useMemo(() => {
        if (!secili) return null;
        const kimlik = String(secili.id);

        let o30 = null, o60 = null;
        try { o30 = getSummary(kimlik, 30); o60 = getSummary(kimlik, 60); } catch { /* boş */ }
        const oncekiSoru = o60 ? o60.questions - (o30?.questions || 0) : 0;
        const oncekiDakika = o60 ? o60.minutes - (o30?.minutes || 0) : 0;

        const esik30 = Date.now() - 30 * 86400000;
        const esik60 = Date.now() - 60 * 86400000;
        const hatalar = listeOku('error_notebook').filter((h) => String(h.studentId) === kimlik);
        const hata30 = hatalar.filter((h) => new Date(h.date || h.createdAt || 0).getTime() >= esik30).length;
        const hataOnceki = hatalar.filter((h) => {
            const t = new Date(h.date || h.createdAt || 0).getTime();
            return t >= esik60 && t < esik30;
        }).length;

        const v2 = listeOku('v2_results_data');
        const manuel = denemeKayitlari.ogrencininKayitlari(kimlik);
        const birlesik = birlesikDenemeler(v2, manuel, secili.name);
        const deneme30 = birlesik.filter((d) => d.tarihMs >= esik30);

        const netSerisi = birlesik.slice(-8).map((d) => ({
            ad: d.ad?.length > 12 ? `${d.ad.slice(0, 12)}…` : (d.ad || 'Deneme'),
            net: +(+d.totalNet).toFixed(2),
        }));
        const sonNet = birlesik.length ? +(+birlesik[birlesik.length - 1].totalNet).toFixed(2) : null;
        const oncekiNet = birlesik.length > 1 ? +(+birlesik[birlesik.length - 2].totalNet).toFixed(2) : null;
        const netFark = sonNet != null && oncekiNet != null ? +(sonNet - oncekiNet).toFixed(2) : null;

        // Derslere göre net (son deneme) — pasta
        const dersler = dersOzeti(birlesik);
        const dersPasta = dersler
            .filter((d) => d.son && d.son.net > 0)
            .map((d) => ({ ad: d.ad, deger: +d.son.net.toFixed(2) }));

        // Ders bazlı net değişimi — önceki / son deneme çubukları
        const sonIki = birlesik.slice(-2);
        const dersDegisim = sonIki.length === 2
            ? dersOzeti([sonIki[1]]).map((d) => {
                const onceki = dersOzeti([sonIki[0]]).find((x) => x.ad === d.ad);
                return { ad: d.ad, onceki: onceki ? +onceki.son.net.toFixed(2) : 0, son: +d.son.net.toFixed(2) };
            })
            : [];

        // Hata türleri — hata defteri + öğrenci deneme nedenleri
        const { turDagilimi } = konuHatalari(hatalar);
        const hataPasta = turDagilimi.map((t) => ({ ad: hataTuruAdi(t.tur), deger: t.adet }));

        // Günlük çalışma istikrarı — 4 hafta × 7 gün ısı haritası
        const gunHarita = new Map();
        try {
            getSummary(kimlik, 28).byDay.forEach((g) => gunHarita.set(g.date, g.questions));
        } catch { /* boş */ }
        const bugun = new Date();
        const pazartesiKaydir = (d) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }; // eslint-disable-line no-unused-vars
        const haftalar = [];
        for (let h = 3; h >= 0; h--) {
            const satir = [];
            for (let g = 0; g < 7; g++) {
                const t = new Date(bugun);
                t.setDate(bugun.getDate() - ((bugun.getDay() + 6) % 7) - h * 7 + g);
                const anahtar = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
                satir.push({ anahtar, soru: gunHarita.get(anahtar) || 0, gelecek: t > bugun });
            }
            haftalar.push(satir);
        }
        const tavan = Math.max(1, ...haftalar.flat().map((g) => g.soru));

        const aktifGun = o30 ? o30.activeDays : 0;
        const istikrar = Math.round((aktifGun / 30) * 100);

        const oncelikler = calismaOncelikleri(birlesik, hatalar, 5);

        const son5 = [...birlesik].slice(-5).reverse().map((d, i, dizi) => {
            const oncekiD = dizi[i + 1];
            /* Koç yüklemesi correct/wrong/blank, öğrenci girişi
               dogru/yanlis/bos yazar — ikisi de okunur. */
            const toplamlar = Object.values(d.subjects || {}).reduce(
                (a, s) => ({
                    d: a.d + (+s?.correct || +s?.dogru || 0),
                    y: a.y + (+s?.wrong || +s?.yanlis || 0),
                    b: a.b + (+s?.blank || +s?.bos || 0),
                }),
                { d: 0, y: 0, b: 0 }
            );
            return {
                ad: d.ad, tarih: d.tarihMs ? new Date(d.tarihMs).toLocaleDateString('tr-TR') : '—',
                net: +(+d.totalNet).toFixed(2), ...toplamlar,
                fark: oncekiD ? +(+d.totalNet - +oncekiD.totalNet).toFixed(2) : null,
            };
        });

        return {
            o30, soruFark: o30 && oncekiSoru ? o30.questions - oncekiSoru : null,
            dakikaFark: o30 && oncekiDakika ? o30.minutes - oncekiDakika : null,
            hata30, hataFark: hataOnceki ? hata30 - hataOnceki : null,
            deneme30: deneme30.length, toplamDeneme: birlesik.length,
            sonNet, netFark, netSerisi, dersPasta, dersDegisim, hataPasta,
            haftalar, tavan, istikrar, aktifGun, oncelikler, son5,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- surum bilinçli: storage olayı yerel kayıtları tazeler
    }, [secili, surum]);

    /* ── Sınıf kesiti (öğrenci seçilmediyse) ────────────────── */
    const sinif = useMemo(() => {
        if (secili || !students.length) return null;
        try { return buildClassReport(students); } catch { return null; }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [students, secili, surum]);

    /* ── Koç dönütü ─────────────────────────────────────────── */
    const [donut, setDonut] = useState('');
    const [gonderiliyor, setGonderiliyor] = useState(false);
    const donutGonder = async () => {
        if (!donut.trim() || !secili) return;
        setGonderiliyor(true);
        try {
            await api.messages.sendMessage(secili.id, {
                text: donut.trim(),
                sender: 'coach',
                senderName: user?.name || 'Koç',
                timestamp: new Date().toISOString(),
            });
            setDonut('');
            bildir(`Dönüt ${secili.name} adlı öğrenciye gönderildi.`, 'basari');
        } catch {
            bildir('Dönüt gönderilemedi. Tekrar deneyin.', 'hata');
        } finally {
            setGonderiliyor(false);
        }
    };

    const sureMetni = (dk) => (dk >= 60 ? `${Math.floor(dk / 60)}s ${dk % 60}dk` : `${dk}dk`);

    return (
        <div className="space-y-5">
            {/* ── Araç çubuğu ──────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                <div className="relative">
                    <select
                        value={seciliId}
                        onChange={(e) => setSeciliId(e.target.value)}
                        aria-label="Öğrenci seç"
                        className="appearance-none bg-surface border border-line rounded-xl pl-3 pr-9 py-2.5 text-sm font-bold text-ink focus:outline-none focus:border-brand/50 min-w-[190px]"
                    >
                        <option value="">Sınıf Geneli</option>
                        {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3" />
                </div>
                <span className="badge badge-neutral">Son 30 Gün</span>
                <div className="flex-1" />
                {secili && (
                    <button
                        type="button"
                        onClick={() => onKarneAc?.(secili.id)}
                        className="btn btn-primary"
                    >
                        <FileText size={15} /> Rapor Oluştur
                    </button>
                )}
            </div>

            {/* ══ ÖĞRENCİ SEÇİLİ: kişisel analiz merkezi ══ */}
            {secili && veri && (
                <>
                    {/* KPI şeridi */}
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                        <Kpi etiket="Toplam Soru" deger={veri.o30?.questions ?? 0} fark={veri.soruFark} simge={ClipboardList} />
                        <Kpi etiket="Net" deger={veri.sonNet ?? '—'} fark={veri.netFark} simge={TrendingUp} />
                        <Kpi etiket="Hata Kaydı" deger={veri.hata30} fark={veri.hataFark} iyiYon={-1} simge={BookX} />
                        <Kpi etiket="Çalışma Süresi" deger={sureMetni(veri.o30?.minutes ?? 0)} fark={veri.dakikaFark} birim="dk" simge={Clock} />
                        <Kpi etiket="Deneme Sayısı" deger={veri.deneme30} simge={BarChart2} />
                        <div className="card p-4">
                            <p className="tip-label text-ink-3">İstikrar Oranı</p>
                            <div className="flex items-center gap-3 mt-1.5">
                                <div className="relative w-12 h-12">
                                    <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                                        <circle cx="18" cy="18" r="15" fill="none" stroke="var(--surface-3)" strokeWidth="4" />
                                        <circle cx="18" cy="18" r="15" fill="none" stroke={veri.istikrar >= 60 ? 'var(--ok)' : veri.istikrar >= 30 ? 'var(--warn)' : 'var(--danger)'}
                                            strokeWidth="4" strokeLinecap="round"
                                            strokeDasharray={`${(veri.istikrar / 100) * 94.2} 94.2`} />
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-ink">%{veri.istikrar}</span>
                                </div>
                                <p className="tip-caption">{veri.aktifGun}/30 gün aktif</p>
                            </div>
                        </div>
                    </div>

                    {/* Net gelişimi + derslere göre net */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Bolum baslik={`Net Gelişim Grafiği (Son ${veri.netSerisi.length} Deneme)`}>
                            {veri.netSerisi.length >= 2 ? (
                                <div className="h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={veri.netSerisi} margin={{ top: 6, right: 10, bottom: 0, left: -16 }}>
                                            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="ad" tick={{ fill: 'var(--ink-3)', fontSize: 10 }} tickLine={false} axisLine={false} />
                                            <YAxis tick={{ fill: 'var(--ink-3)', fontSize: 10 }} tickLine={false} axisLine={false} />
                                            <Tooltip contentStyle={GRAFIK_STIL} />
                                            <Line type="monotone" dataKey="net" name="Toplam Net" stroke="var(--c1)" strokeWidth={3} dot={{ r: 4, fill: 'var(--c1)' }} activeDot={{ r: 6 }} animationDuration={300} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : <BosVeri metin="En az iki deneme sonucu girildiğinde net gelişimi burada çizilir." />}
                        </Bolum>

                        <Bolum baslik="Derslere Göre Net (Son Deneme)">
                            {veri.dersPasta.length ? (
                                <div className="h-56 flex items-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={veri.dersPasta} dataKey="deger" nameKey="ad"
                                                innerRadius="55%" outerRadius="80%" paddingAngle={3} animationDuration={300}>
                                                {veri.dersPasta.map((g, i) => (
                                                    <Cell key={g.ad} fill={PASTA_RENKLERI[i % PASTA_RENKLERI.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={GRAFIK_STIL} />
                                            <Legend formatter={(v) => <span style={{ color: 'var(--ink-2)', fontSize: 12 }}>{v}</span>} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : <BosVeri metin="Ders bazlı net verisi olan bir deneme bulunmuyor." />}
                        </Bolum>
                    </div>

                    {/* Hata türleri + ders bazlı değişim */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Bolum baslik="Hata Türleri Dağılımı">
                            {veri.hataPasta.length ? (
                                <div className="h-56 flex items-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={veri.hataPasta} dataKey="deger" nameKey="ad"
                                                innerRadius="55%" outerRadius="80%" paddingAngle={3} animationDuration={300}>
                                                {veri.hataPasta.map((g, i) => (
                                                    <Cell key={g.ad} fill={PASTA_RENKLERI[i % PASTA_RENKLERI.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={GRAFIK_STIL} />
                                            <Legend formatter={(v) => <span style={{ color: 'var(--ink-2)', fontSize: 12 }}>{v}</span>} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : <BosVeri metin="Öğrenci hata defterine kayıt girdikçe tür dağılımı burada oluşur." />}
                        </Bolum>

                        <Bolum baslik="Ders Bazlı Net Değişimi (Önceki → Son Deneme)">
                            {veri.dersDegisim.length ? (
                                <div className="h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={veri.dersDegisim} margin={{ top: 6, right: 10, bottom: 0, left: -16 }}>
                                            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="ad" tick={{ fill: 'var(--ink-3)', fontSize: 10 }} tickLine={false} axisLine={false} />
                                            <YAxis tick={{ fill: 'var(--ink-3)', fontSize: 10 }} tickLine={false} axisLine={false} />
                                            <Tooltip contentStyle={GRAFIK_STIL} />
                                            <Legend formatter={(v) => <span style={{ color: 'var(--ink-2)', fontSize: 12 }}>{v}</span>} />
                                            <Bar dataKey="onceki" name="Önceki" fill="var(--line-2)" radius={[4, 4, 0, 0]} animationDuration={300} />
                                            <Bar dataKey="son" name="Son" fill="var(--c1)" radius={[4, 4, 0, 0]} animationDuration={300} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : <BosVeri metin="Karşılaştırma için en az iki deneme gerekir." />}
                        </Bolum>
                    </div>

                    {/* İstikrar ısı haritası + son 5 deneme */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Bolum baslik="Günlük Çalışma İstikrarı (Son 4 Hafta)">
                            <div className="flex gap-2">
                                <div className="flex flex-col justify-between py-0.5">
                                    {GUN_KISA.map((g) => (
                                        <span key={g} className="text-[9px] font-bold text-ink-3 h-5 flex items-center">{g}</span>
                                    ))}
                                </div>
                                <div className="flex gap-1.5 flex-1">
                                    {veri.haftalar.map((hafta, hi) => (
                                        <div key={hi} className="flex flex-col gap-1 flex-1">
                                            {hafta.map((g) => (
                                                <div
                                                    key={g.anahtar}
                                                    title={g.gelecek ? '' : `${g.anahtar}: ${g.soru} soru`}
                                                    className="h-5 rounded-[5px] border border-line"
                                                    style={{
                                                        background: g.gelecek
                                                            ? 'transparent'
                                                            : g.soru === 0
                                                                ? 'var(--surface-2)'
                                                                : `color-mix(in srgb, var(--ok) ${Math.max(18, Math.round((g.soru / veri.tavan) * 90))}%, var(--surface))`,
                                                        borderStyle: g.gelecek ? 'dashed' : 'solid',
                                                    }}
                                                />
                                            ))}
                                            <span className="text-[9px] font-bold text-ink-3 text-center">{hi + 1}. Hafta</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-3 justify-end">
                                <span className="text-[10px] text-ink-3 font-bold">Düşük</span>
                                {[18, 40, 65, 90].map((y) => (
                                    <span key={y} className="w-4 h-4 rounded-[4px]" style={{ background: `color-mix(in srgb, var(--ok) ${y}%, var(--surface))` }} />
                                ))}
                                <span className="text-[10px] text-ink-3 font-bold">Yüksek</span>
                            </div>
                        </Bolum>

                        <Bolum baslik="Son 5 Deneme Karşılaştırması">
                            {veri.son5.length ? (
                                <div className="overflow-x-auto">
                                    <table className="tbl">
                                        <thead>
                                            <tr><th>Deneme</th><th>Tarih</th><th>Net</th><th>D</th><th>Y</th><th>B</th><th>Değişim</th></tr>
                                        </thead>
                                        <tbody>
                                            {veri.son5.map((d, i) => (
                                                <tr key={`${d.ad}-${i}`}>
                                                    <td className="font-bold text-ink whitespace-nowrap">{d.ad}</td>
                                                    <td className="whitespace-nowrap">{d.tarih}</td>
                                                    <td className="font-black text-ink rakam">{d.net}</td>
                                                    <td className="rakam">{d.d}</td>
                                                    <td className="rakam">{d.y}</td>
                                                    <td className="rakam">{d.b}</td>
                                                    <td>
                                                        {d.fark == null ? '—' : (
                                                            <span className={cn('font-black', d.fark > 0 ? 'text-ok' : d.fark < 0 ? 'text-danger' : 'text-ink-3')}>
                                                                {d.fark > 0 ? '↑' : d.fark < 0 ? '↓' : '—'} {Math.abs(d.fark) || ''}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : <BosVeri metin="Henüz deneme sonucu yok." />}
                        </Bolum>
                    </div>

                    {/* Koç dönütü + riskli alanlar */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Bolum baslik="Koç Dönütü">
                            <p className="tip-caption mb-2">
                                Yazdığın dönüt {secili.name.split(' ')[0]} adlı öğrencinin Mesajlar bölümüne ve
                                Bugün ekranındaki "Koçundan" kartına düşer.
                            </p>
                            <textarea
                                value={donut}
                                onChange={(e) => setDonut(e.target.value)}
                                rows={4}
                                placeholder={`${secili.name.split(' ')[0]} için değerlendirme ve öneri yaz…`}
                                className="field resize-none"
                            />
                            <div className="flex justify-end mt-2">
                                <button
                                    type="button"
                                    className="btn btn-accent"
                                    disabled={!donut.trim() || gonderiliyor}
                                    onClick={donutGonder}
                                >
                                    <Send size={14} /> {gonderiliyor ? 'Gönderiliyor…' : 'Dönüt Gönder'}
                                </button>
                            </div>
                        </Bolum>

                        <Bolum baslik="Riskli Alanlar">
                            {veri.oncelikler.length ? (
                                <div className="space-y-2">
                                    {veri.oncelikler.map((o) => (
                                        <div key={`${o.tur}-${o.baslik}`} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-surface-2 border border-line">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <AlertTriangle size={15} className={o.tur === 'gerileyen-ders' ? 'text-danger' : 'text-warn'} />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-ink truncate">{o.baslik}</p>
                                                    <p className="tip-mini text-ink-3">{o.sebep}</p>
                                                </div>
                                            </div>
                                            <span className={cn('badge shrink-0', o.tur === 'gerileyen-ders' ? 'badge-danger' : o.tur === 'zayif-ders' ? 'badge-warn' : 'badge-info')}>
                                                {o.tur === 'gerileyen-ders' ? 'Yüksek' : o.tur === 'zayif-ders' ? 'Orta' : 'Konu'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : <BosVeri metin="Şu an öne çıkan risk yok — veri geldikçe burada belirir." />}
                        </Bolum>
                    </div>
                </>
            )}

            {/* ══ SINIF GENELİ (öğrenci seçilmemiş) ══ */}
            {!secili && sinif && (
                <>
                    {/* ── ÜÇ DURUM KARTI ────────────────────────────
                        Beş sayaç vardı: "Öğrenci 12", "Aktif 8", "Risk 3"…
                        Her biri doğru ama hiçbiri YARGI içermiyordu; koç
                        "8 aktif" görüp bunun iyi mi kötü mü olduğunu kendi
                        hesaplıyordu. Referanstaki kalıpta yüzde, halka ve
                        sözlü değerlendirme bir arada.

                        Üç oran birbirinden bağımsız; toplamları anlamsızdır,
                        bu yüzden üç ayrı halka — tek donut değil. */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <DurumKarti
                            baslik="Haftalık Katılım"
                            aciklama={`${sinif.studentCount} öğrencinin ${sinif.activeCount} tanesi son 7 günde kayıt girdi.`}
                            oran={sinif.studentCount ? (sinif.activeCount / sinif.studentCount) * 100 : null}
                        />
                        <DurumKarti
                            baslik="Görev Tamamlama"
                            aciklama="Atanan görevlerin sınıf ortalamasındaki tamamlanma oranı."
                            oran={sinif.avgCompletionPct}
                        />
                        <DurumKarti
                            baslik="Risk Dışı Öğrenci"
                            aciklama={sinif.atRisk.length
                                ? `${sinif.atRisk.length} öğrenci yüksek riskli; ilk bakılacak yer burası.`
                                : 'Yüksek riskli öğrenci yok.'}
                            oran={sinif.studentCount
                                ? ((sinif.studentCount - sinif.atRisk.length) / sinif.studentCount) * 100
                                : null}
                        />
                    </div>

                    {/* ── EN İYİ BEŞ ÖĞRENCİ ────────────────────────
                        Referanstaki "Top Student's Progress" şeridi.
                        buildClassReport zaten topPerformers üretiyordu ama
                        hiçbir ekran okumuyordu — hesaplanıp atılan bir
                        listeydi. Kart başına: net, öğrenci, deneme sayısı ve
                        net serisinin şekli. */}
                    {sinif.topPerformers?.length > 0 && (
                        <Bolum baslik="En Yüksek Netler">
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                                {sinif.topPerformers.map((r) => {
                                    /* Seri kaynağı exams.history: rapor zaten son on
                                       denemeyi eskiden yeniye sıralı tutuyor. */
                                    const seri = (r.exams?.history || [])
                                        .map((x) => (typeof x === 'number' ? x : Number(x?.net)))
                                        .filter((x) => Number.isFinite(x));
                                    return (
                                        <div key={r.student?.id || r.student?.name}
                                            className="rounded-dmd border border-line bg-surface p-3 flex flex-col gap-1.5">
                                            <p className="tip-mini text-ink-3 uppercase tracking-wider m-0">Son Net</p>
                                            <p className="text-2xl font-black tabular-nums leading-none m-0"
                                                style={{ color: 'var(--brand-metin)' }}>
                                                {r.exams?.lastNet ?? '—'}
                                            </p>
                                            <p className="tip-small font-bold text-ink truncate m-0" title={r.student?.name}>
                                                {r.student?.name || '—'}
                                            </p>
                                            {seri.length >= 2
                                                ? <MiniSeri seri={seri} tur="dolgu" renk="var(--brand)" yukseklik={26} className="mt-auto" />
                                                : <p className="tip-mini text-ink-3 m-0 mt-auto">tek deneme</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        </Bolum>
                    )}

                    {/* Riskli öğrenciler — eylem gerektiren tek liste */}
                    {sinif.atRisk.length > 0 && (
                        <Bolum baslik={`Öncelikli Öğrenciler · ${sinif.atRisk.length}`}>
                            <div className="flex flex-col divide-y divide-line">
                                {sinif.atRisk.slice(0, 6).map((r) => (
                                    <button
                                        key={r.student?.id}
                                        type="button"
                                        onClick={() => setSeciliId(String(r.student?.id || ''))}
                                        className="flex items-center gap-3 py-2.5 text-left hover:bg-surface-2 transition-colors rounded-dsm px-1 min-h-[48px]"
                                    >
                                        <span className="w-8 h-8 rounded-full bg-danger-soft text-danger grid place-items-center text-[12px] font-black shrink-0">
                                            {(r.student?.name || '?').charAt(0).toUpperCase()}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="tip-small font-bold text-ink block truncate">{r.student?.name}</span>
                                            <span className="tip-mini text-ink-3 block truncate">
                                                {r.risk?.reasons?.[0] || 'Risk gerekçesi kayıtlı değil'}
                                            </span>
                                        </span>
                                        <span className="badge badge-danger shrink-0">risk {r.risk?.score ?? '—'}</span>
                                    </button>
                                ))}
                            </div>
                        </Bolum>
                    )}
                </>
            )}
            {!secili && (
                <p className="tip-caption text-center">
                    Bir öğrencinin 30 günlük analiz merkezini görmek için yukarıdan öğrenci seçin.
                </p>
            )}
        </div>
    );
}
