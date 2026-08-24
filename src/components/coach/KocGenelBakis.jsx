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
    Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend, AreaChart, Area,
} from 'recharts';
import { listeOku } from '../../services/veriDeposu';
import { buildClassReport } from '../../services/reportService';
import { cn } from '../../lib/cn';
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

/**
 * YILDIZ — sınıf içi göreli konum.
 *
 * Referanstaki beş yıldız "Achieved" etiketiyle birlikte duruyor.
 * Bizde mutlak bir hedef yok, dolayısıyla yıldızı uydurmak yerine
 * SINIF İÇİ konuma bağladım: en yüksek nete göre oran. Beş yıldız
 * "mükemmel" demez, "sınıfın en üstü" der — ve bu ölçülebilir bir
 * ifadedir. Alt metinde sıra numarası da yazılı ki yıldızın neyi
 * temsil ettiği tahmine kalmasın.
 */
const Yildizlar = ({ oran }) => {
    const dolu = Math.max(1, Math.min(5, Math.round((oran || 0) * 5)));
    return (
        <span className="inline-flex gap-0.5" aria-label={`5 üzerinden ${dolu}`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className="text-[10px] leading-none"
                    style={{ color: i <= dolu ? 'var(--brand)' : 'var(--line-2)' }}>★</span>
            ))}
        </span>
    );
};

/**
 * AY TAKVİMİ — randevusu olan günler işaretli.
 *
 * Referansın sağ sütunundaki takvim. Salt görsel bir süs değil:
 * randevu kayıtlarını okuyup dolu günleri noktalıyor, böylece koç
 * "bu ay hangi günler doluyum" sorusunu listeyi okumadan yanıtlıyor.
 */
const AyTakvimi = ({ isaretliGunler = new Set(), ay, onAy }) => {
    const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
    const yil = ay.getFullYear(), ayNo = ay.getMonth();
    const ilk = new Date(yil, ayNo, 1);
    /* Pazartesi = 0 olacak şekilde kaydır; Türkiye'de hafta pazartesi başlar. */
    const bosluk = (ilk.getDay() + 6) % 7;
    const gunSayisi = new Date(yil, ayNo + 1, 0).getDate();
    const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const pad = (x) => String(x).padStart(2, '0');

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <span className="tip-small font-black text-ink">{AYLAR[ayNo]} {yil}</span>
                <span className="flex gap-1">
                    <button type="button" onClick={() => onAy(new Date(yil, ayNo - 1, 1))}
                        aria-label="Önceki ay"
                        className="w-7 h-7 rounded-dsm border border-line text-ink-3 hover:text-ink hover:bg-surface-2 grid place-items-center">‹</button>
                    <button type="button" onClick={() => onAy(new Date(yil, ayNo + 1, 1))}
                        aria-label="Sonraki ay"
                        className="w-7 h-7 rounded-dsm border border-line text-ink-3 hover:text-ink hover:bg-surface-2 grid place-items-center">›</button>
                </span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map((g, i) => (
                    <span key={g} className="tip-mini font-black uppercase pb-1"
                        style={{ color: i >= 5 ? 'var(--brand-metin)' : 'var(--ink-3)' }}>{g}</span>
                ))}
                {Array.from({ length: bosluk }).map((_, i) => <span key={`b${i}`} />)}
                {Array.from({ length: gunSayisi }, (_, i) => i + 1).map((g) => {
                    const anahtar = `${yil}-${pad(ayNo + 1)}-${pad(g)}`;
                    const bugunMu = new Date(yil, ayNo, g).getTime() === bugun.getTime();
                    const dolu = isaretliGunler.has(anahtar);
                    return (
                        <span key={g}
                            title={dolu ? `${g} ${AYLAR[ayNo]} · randevu var` : undefined}
                            className="relative h-8 grid place-items-center rounded-dsm tabular-nums text-[12px] font-bold"
                            style={{
                                background: bugunMu ? 'var(--brand)' : 'transparent',
                                color: bugunMu ? '#fff' : 'var(--ink-2)',
                            }}
                        >
                            {g}
                            {dolu && !bugunMu && (
                                <span className="absolute bottom-1 w-1 h-1 rounded-full"
                                    style={{ background: 'var(--brand)' }} />
                            )}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

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

export default function KocGenelBakis({ students = [], user }) {
    /* Öğrenci seçici bu ekrandan kaldırıldı — ekran yalnızca SINIFA bakıyor.
       Tek öğrenci analizi Öğrenci Gelişim Analizi sekmesinde duruyor;
       aynı ekranın dropdown'a göre iki farklı şey göstermesi, koçun
       neye baktığını seçicinin durumundan çıkarmasını gerektiriyordu. */

    

    /* Öğrenci verisi kaydedildikçe tazelen (storage olayı). */
    const [surum, setSurum] = useState(0);

    /* Sınıf grafiğinin penceresi — referanstaki Haftalık/Aylık/Yıllık
       seçicisinin karşılığı. Bizde ölçü birimi hafta değil DENEME:
       sınıf neti takvimle değil deneme yapıldıkça değişir. */
    const [donemAdet, setDonemAdet] = useState(6);

    /* Takvimde görüntülenen ay; bugünün ayıyla başlar. */
    const [takvimAy, setTakvimAy] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });

    const kocId = user?.id;
    useEffect(() => {
        const tetik = () => setSurum((v) => v + 1);
        window.addEventListener('storage', tetik);
        return () => window.removeEventListener('storage', tetik);
    }, []);

    /* ── Seçili öğrencinin 30 günlük kesiti ─────────────────── */

    /* ── Sınıf kesiti (öğrenci seçilmediyse) ────────────────── */
    const sinif = useMemo(() => {
        if (!students.length) return null;
        try { return buildClassReport(students); } catch { return null; }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [students, surum]);

    /**
     * SINIF NET SERİSİ — referanstaki büyük çok serili grafik.
     *
     * `buildClassReport` sınıf ortalamasını TEK sayı olarak veriyor
     * (avgNet); zaman içindeki seyri vermiyordu. Koç "sınıf yükseliyor
     * mu" sorusunu ancak öğrencileri tek tek açarak yanıtlayabiliyordu.
     *
     * Üç seri bilinçli: ortalama tek başına dağılımı gizler. Aynı 45
     * ortalama, herkesin 45 aldığı bir sınıftan da gelir, yarısının 20
     * yarısının 70 aldığı sınıftan da; ikisi bambaşka durumlardır.
     * En yüksek ile en düşük arasındaki açıklık bunu gösterir.
     *
     * Kaynak mevcut deneme kayıtları; yeni depo yok, yazma yok.
     */
    const sinifSerisi = useMemo(() => {
        const adlar = new Set(students.map((x) => String(x.name || '').trim().toLocaleLowerCase('tr-TR')));
        const kovalar = new Map();
        listeOku('v2_results_data').forEach((r) => {
            const ogrAd = String(r.student || r.studentName || '').trim().toLocaleLowerCase('tr-TR');
            if (adlar.size && !adlar.has(ogrAd)) return;
            const net = Number(r.totalNet);
            if (!Number.isFinite(net)) return;
            const anahtar = String(r.examName || r.name || 'Deneme').trim();
            if (!kovalar.has(anahtar)) {
                kovalar.set(anahtar, { ad: anahtar, netler: [], zaman: new Date(r.uploadedAt || 0).getTime() });
            }
            kovalar.get(anahtar).netler.push(net);
        });
        return [...kovalar.values()]
            .filter((k) => k.netler.length)
            .sort((a, b) => a.zaman - b.zaman)
            .slice(-donemAdet)
            .map((k) => ({
                ad: k.ad.length > 14 ? `${k.ad.slice(0, 13)}…` : k.ad,
                ortalama: Math.round((k.netler.reduce((t, x) => t + x, 0) / k.netler.length) * 10) / 10,
                enYuksek: Math.max(...k.netler),
                enDusuk: Math.min(...k.netler),
                kisi: k.netler.length,
            }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [students, surum, donemAdet]);

    /**
     * YAKLAŞAN RANDEVULAR — bugünden sonrası, en yakın önce.
     * Geçmiş randevu "yaklaşan" değildir; listeye alınmaz.
     */
    const randevular = useMemo(() => {
        const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
        return listeOku('appointments')
            .filter((r) => {
                if (kocId && r.coachId && String(r.coachId) !== String(kocId)) return false;
                const t = new Date(`${r.date}T00:00:00`);
                return !Number.isNaN(t.getTime()) && t.getTime() >= bugun.getTime();
            })
            .sort((a, b) => String(a.date).localeCompare(String(b.date)) || (a.hour ?? 0) - (b.hour ?? 0));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [kocId, surum]);

    const randevuGunleri = useMemo(
        () => new Set(randevular.map((r) => String(r.date))),
        [randevular]
    );



    return (
        <div className="space-y-5">

            {/* ══ ÖĞRENCİ SEÇİLİ: kişisel analiz merkezi ══ */}

            {/* ══ GENEL BAKIŞ — referans düzeni ══════════════════
                  Bu ekranda eskiden dört ayrı katman vardı: öğrenci
                  seçici araç çubuğu, seçili öğrencinin on bölümlük
                  analiz merkezi, sınıf özeti ve bir yönlendirme metni.
                  Aynı ekran hem sınıfa hem tek öğrenciye bakıyordu ve
                  hangisini gördüğünüz dropdown'ın durumuna bağlıydı.

                  Tek öğrenci analizi zaten ayrı bir sekmede (Öğrenci
                  Gelişim Analizi) duruyor; burada yalnızca SINIF var. */}
            <div>
                <h2 className="text-2xl sm:text-3xl font-black text-ink syne tracking-tight uppercase m-0">Genel Bakış</h2>
                <p className="text-brand text-[10px] font-black tracking-[0.2em] mt-1 uppercase">SINIFIN GİDİŞATI VE GÜNÜN PLANI</p>
            </div>
            {sinif && (
                /* İKİ SÜTUN — referansın yerleşimi.
                   Solda sınıfın GİDİŞATI (durum kartları, gelişim grafiği,
                   en iyiler), sağda koçun GÜNÜ (profil, takvim, randevular).
                   Tek sütunda hepsi alt alta diziliyor ve koç randevusunu
                   görmek için grafiklerin altına kadar kaydırıyordu. */
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 xl:gap-5 items-start">

                    {/* ═══ SOL: SINIFIN GİDİŞATI ═══ */}
                    <div className="xl:col-span-8 min-w-0 space-y-4">

                        {/* ── Üç durum kartı ─────────────────────────
                            Beş sayaç vardı — "Öğrenci 12", "Aktif 8" — her
                            biri doğru ama hiçbiri YARGI içermiyordu; koç
                            "8 aktif"in iyi mi kötü mü olduğunu kendi
                            hesaplıyordu. Üç oran bağımsız, toplamları
                            anlamsız: bu yüzden üç ayrı halka, tek donut değil. */}
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

                        {/* ── Sınıf gelişimi: ortalama + açıklık ─────
                            Ortalama tek başına dağılımı gizler. Aynı 45
                            ortalama herkesin 45 aldığı sınıftan da gelir,
                            yarısının 20 yarısının 70 aldığı sınıftan da.
                            En yüksek ile en düşük arasındaki bant bunu açar. */}
                        {sinifSerisi.length >= 2 ? (
                            <div className="card p-4 sm:p-5">
                                <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                                    <div className="min-w-0">
                                        <h3 className="tip-h4 m-0">Sınıf Gelişimi</h3>
                                        <p className="tip-caption mt-0.5">
                                            Son {sinifSerisi.length} deneme · ortalama ve sınıf içi açıklık
                                        </p>
                                    </div>
                                    <div className="segmentli shrink-0" role="group" aria-label="Deneme penceresi">
                                        {[6, 10, 20].map((x) => (
                                            <button key={x} type="button" onClick={() => setDonemAdet(x)}
                                                aria-pressed={donemAdet === x}
                                                className={cn('sg', donemAdet === x && 'is-on')}>
                                                Son {x}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={sinifSerisi} margin={{ top: 6, right: 10, bottom: 0, left: -18 }}>
                                            <defs>
                                                <linearGradient id="sinifOrt" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.3} />
                                                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="ad" tick={{ fill: 'var(--ink-3)', fontSize: 10 }} tickLine={false} axisLine={false} />
                                            <YAxis tick={{ fill: 'var(--ink-3)', fontSize: 10 }} tickLine={false} axisLine={false} />
                                            <Tooltip contentStyle={GRAFIK_STIL}
                                                formatter={(v, ad) => [v, ad]}
                                                labelFormatter={(l, y) => `${l} · ${y?.[0]?.payload?.kisi ?? 0} öğrenci`} />
                                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                                            {/* Açıklık bandı önce çizilir ki ortalama çizgisi üstte kalsın */}
                                            <Area type="monotone" dataKey="enYuksek" name="En yüksek"
                                                stroke="var(--ok)" strokeWidth={1.5} strokeDasharray="4 3"
                                                fill="transparent" dot={false} animationDuration={300} />
                                            <Area type="monotone" dataKey="enDusuk" name="En düşük"
                                                stroke="var(--danger)" strokeWidth={1.5} strokeDasharray="4 3"
                                                fill="transparent" dot={false} animationDuration={300} />
                                            <Area type="monotone" dataKey="ortalama" name="Sınıf ortalaması"
                                                stroke="var(--brand)" strokeWidth={3} fill="url(#sinifOrt)"
                                                dot={{ r: 3.5, fill: 'var(--brand)' }} activeDot={{ r: 5.5 }}
                                                animationDuration={300} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : (
                            <div className="card p-6 text-center">
                                <p className="tip-small text-ink-2 m-0">
                                    Sınıf gelişim eğrisi için en az iki ortak deneme gerekiyor.
                                </p>
                            </div>
                        )}

                        {/* ── En yüksek netler ────────────────────────
                            buildClassReport zaten topPerformers üretiyordu
                            ama hiçbir ekran okumuyordu: hesaplanıp atılan
                            bir listeydi. */}
                        {sinif.topPerformers?.length > 0 && (
                            <Bolum baslik="En Yüksek Netler">
                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                                    {sinif.topPerformers.map((r, sira) => {
                                        const seri = (r.exams?.history || [])
                                            .map((x) => (typeof x === 'number' ? x : Number(x?.net)))
                                            .filter((x) => Number.isFinite(x));
                                        const enUst = sinif.topPerformers[0]?.exams?.lastNet || 1;
                                        const ad = r.student?.name || '—';
                                        return (
                                            <div key={r.student?.id || ad}
                                                className="rounded-dmd border border-line bg-surface p-3 flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-8 h-8 rounded-full grid place-items-center text-[12px] font-black shrink-0"
                                                        style={{ background: 'var(--brand-soft)', color: 'var(--brand-metin)' }}>
                                                        {ad.charAt(0).toUpperCase()}
                                                    </span>
                                                    <span className="min-w-0">
                                                        <span className="tip-mini text-ink-3 uppercase tracking-wider block">
                                                            {sira + 1}. sırada
                                                        </span>
                                                        <span className="tip-small font-bold text-ink block truncate" title={ad}>{ad}</span>
                                                    </span>
                                                </div>
                                                <p className="text-2xl font-black tabular-nums leading-none m-0"
                                                    style={{ color: 'var(--brand-metin)' }}>
                                                    {r.exams?.lastNet ?? '—'}
                                                    <span className="tip-mini text-ink-3 font-bold ml-1">net</span>
                                                </p>
                                                {/* Yıldız sınıf içi konumdur, mutlak başarı değil */}
                                                <Yildizlar oran={(r.exams?.lastNet || 0) / (enUst || 1)} />
                                                {seri.length >= 2
                                                    ? <MiniSeri seri={seri} tur="dolgu" renk="var(--brand)" yukseklik={26} className="mt-auto" />
                                                    : <p className="tip-mini text-ink-3 m-0 mt-auto">tek deneme</p>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </Bolum>
                        )}
                    </div>

                    {/* ═══ SAĞ: KOÇUN GÜNÜ ═══ */}
                    <aside className="xl:col-span-4 min-w-0 space-y-4">

                        {/* ── Koç profil kartı ──────────────────────── */}
                        <div className="card p-5 text-center">
                            <span className="w-16 h-16 rounded-full mx-auto grid place-items-center text-xl font-black"
                                style={{ background: 'var(--brand)', color: '#fff' }}>
                                {(user?.name || 'K').charAt(0).toUpperCase()}
                            </span>
                            <p className="text-base font-black text-ink mt-3 m-0">{user?.name || 'Koç'}</p>
                            <p className="tip-caption m-0 mt-0.5">Koç</p>
                            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-line">
                                <div>
                                    <p className="tip-mini text-ink-3 uppercase tracking-wider m-0">Öğrenci</p>
                                    <p className="text-lg font-black text-ink tabular-nums m-0 mt-0.5">{sinif.studentCount}</p>
                                </div>
                                <div>
                                    <p className="tip-mini text-ink-3 uppercase tracking-wider m-0">Bu Hafta Aktif</p>
                                    <p className="text-lg font-black tabular-nums m-0 mt-0.5"
                                        style={{ color: 'var(--brand-metin)' }}>{sinif.activeCount}</p>
                                </div>
                            </div>
                        </div>

                        {/* ── Takvim ────────────────────────────────── */}
                        <div className="card p-4">
                            <AyTakvimi isaretliGunler={randevuGunleri} ay={takvimAy} onAy={setTakvimAy} />
                        </div>

                        {/* ── Yaklaşan randevular ───────────────────── */}
                        <div className="card p-4">
                            <h3 className="tip-h4 m-0 mb-3">Yaklaşan Randevular</h3>
                            {randevular.length === 0 ? (
                                <p className="tip-caption m-0">Planlanmış randevu yok.</p>
                            ) : (
                                <div className="flex flex-col gap-2.5">
                                    {randevular.slice(0, 4).map((r) => {
                                        const t = new Date(`${r.date}T00:00:00`);
                                        const AY = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
                                        return (
                                            <div key={r.id} className="flex items-center gap-3">
                                                <span className="shrink-0 w-12 rounded-dmd text-center py-1.5"
                                                    style={{ background: 'var(--brand-soft)' }}>
                                                    <span className="block text-base font-black tabular-nums leading-none"
                                                        style={{ color: 'var(--brand-metin)' }}>{t.getDate()}</span>
                                                    <span className="block tip-mini font-bold"
                                                        style={{ color: 'var(--brand-metin)' }}>{AY[t.getMonth()]}</span>
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="tip-small font-bold text-ink block truncate">
                                                        {r.studentName || 'Öğrenci'}
                                                    </span>
                                                    <span className="tip-mini text-ink-3 block truncate">
                                                        {r.hour != null ? `${String(r.hour).padStart(2, '0')}:00` : ''}
                                                        {r.duration ? ` · ${r.duration} dk` : ''}
                                                        {r.note ? ` · ${r.note}` : ''}
                                                    </span>
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* ── Öncelikli öğrenciler ──────────────────── */}
                    </aside>
                </div>
            )}
        </div>
    );
}
