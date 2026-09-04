/**
 * 📊 KOÇ GENEL BAKIŞ — sınıf panosu (04.09 canlı eşleme)
 *
 * Sol sütun sınıfın GİDİŞATI: üçlü durum şeridi (tıkla → açıklama),
 * öğrenci gelişim eğrisi (ortalama + açıklık bandı), son denemede net
 * değişimi (satıra tıkla → ders bazlı son 3 deneme barları), en yüksek
 * netler. Sağ sütun koçun GÜNÜ: kompakt profil, "Bugün Dikkat
 * Gerekenler" triyajı (dikkat/tekrar/geciken rozetleriyle),
 * Öğrencilerim (renkli kartlar + öne çıkan konu), Görevlerim ve
 * akademik takvimli randevu takvimi (resmî tatiller işaretli).
 *
 * Veri kaynakları mevcut motorlar: buildClassReport, topluOzet,
 * vadesiGelenSayilari, gorevleriGetir, akademikTakvim. Yeni veri
 * üretilmez; sahte sayı yok — veri olmayan bölüm boş durum gösterir.
 * Masaüstünde (xl) kokpit: sayfa değil sütunlar kayar.
 */
import React, { useMemo, useState, useEffect } from 'react';
import {
    ResponsiveContainer, XAxis, YAxis, CartesianGrid,
    Tooltip, Cell, BarChart, Bar, Legend, AreaChart, Area, LabelList,
} from 'recharts';
import { AlertTriangle, RotateCcw, Clock } from 'lucide-react';
import { listeOku, gorevleriGetir } from '../../services/veriDeposu';
import { buildClassReport } from '../../services/reportService';
import { topluOzet, olcutOku } from '../../services/topicProgressService';
import { vadesiGelenSayilari } from '../../services/bugunOnerileri';
import { gunBilgisi, ogretimTakvimi } from '../../services/akademikTakvim';
import { cn } from '../../lib/cn';
import { MiniSeri } from '../charts/Analitik';

const GRAFIK_STIL = { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12 };
const KART_RENKLERI = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--brand)'];

/* Ders anahtarı → görünen ad ve sabit renk (deneme detay barları). */
const DERS_ADLARI = {
    turkce: 'Türkçe', tarih: 'Tarih', cografya: 'Coğrafya', felsefe: 'Felsefe', din: 'Din',
    mat: 'Matematik', fizik: 'Fizik', kimya: 'Kimya', biyoloji: 'Biyoloji', edebiyat: 'Edebiyat',
    tarih1: 'Tarih', cografya1: 'Coğrafya', sosyal: 'Sosyal', fen: 'Fen',
};
const DERS_RENKLERI = {
    turkce: '#EF4444', tarih: '#F59E0B', cografya: '#84CC16', felsefe: '#14B8A6', din: '#06B6D4',
    mat: '#3B82F6', fizik: '#8B5CF6', kimya: '#EC4899', biyoloji: '#22C55E', edebiyat: '#F43F5E',
    tarih1: '#F59E0B', cografya1: '#84CC16', sosyal: 'var(--c3)', fen: 'var(--c4)',
};
const DERS_SIRASI = ['turkce', 'edebiyat', 'tarih', 'cografya', 'felsefe', 'din', 'sosyal', 'mat', 'fizik', 'kimya', 'biyoloji', 'fen', 'tarih1', 'cografya1'];

const DURUM_ESIK = [
    { alt: 80, ad: 'Çok iyi', renk: 'var(--ok)' },
    { alt: 55, ad: 'Geliştirilmeli', renk: 'var(--warn)' },
    { alt: -1, ad: 'Zayıf', renk: 'var(--danger)' },
];
const durumBul = (oran) => DURUM_ESIK.find((d) => oran >= d.alt) || DURUM_ESIK[2];

/** "3 gün önce" biçiminde göreli tarih — rozet başlıkları için. */
const neKadarOnce = (tarih, simdi = Date.now()) => {
    if (!tarih) return null;
    const ms = Date.parse(tarih);
    if (Number.isNaN(ms)) return null;
    const gun = Math.floor((simdi - ms) / 86400000);
    if (gun < 0) return null;
    if (gun === 0) return 'bugün';
    if (gun === 1) return 'dün';
    if (gun < 30) return `${gun} gün önce`;
    if (gun < 365) return `${Math.floor(gun / 30)} ay önce`;
    return `${Math.floor(gun / 365)} yıl önce`;
};

/**
 * Geciken görev sayacı — öğrenci başına tamamlanmamış + tarihi geçmiş
 * görev adedi. Birleşik görev deposundan tek geçişte sayılır.
 */
const gecikenGorevSayilari = (students = [], simdi = Date.now()) => {
    const kimlikler = new Set((students || []).filter(s => s && s.id != null).map(s => String(s.id)));
    const harita = new Map();
    if (!kimlikler.size) return harita;
    const bitti = (g) => Boolean(g?.completed || g?.done || g?.status === 'Tamamlandı' || g?.status === 'completed');
    gorevleriGetir().forEach((g) => {
        if (!g || g.studentId == null) return;
        const sid = String(g.studentId);
        if (!kimlikler.has(sid) || bitti(g) || !g.dueDate) return;
        const ms = new Date(g.dueDate).getTime();
        if (Number.isNaN(ms) || ms >= simdi) return;
        harita.set(sid, (harita.get(sid) || 0) + 1);
    });
    return harita;
};

/** Yıldız — öğrenciler arası göreli konum (en yüksek nete oran). */
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

/**
 * AKADEMİK RANDEVU TAKVİMİ — randevular + resmî takvim tek görünümde.
 *
 * Günler tatil türüne göre renklenir (ulusal/dinî kırmızı, okul/ara
 * tatil mavi); randevulu günde nokta. Güne tıklayınca detay kutusu
 * (tatil adı + o günün randevuları). Altta eğitim-öğretim takvimi
 * (Ayarlar'dan güncellenen tarihler; tahminî olanlar işaretli) ve
 * bu ayın randevu listesi.
 */
const AkademikTakvim = ({ randevular = [], ay, onAy, onGit }) => {
    const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
    const yil = ay.getFullYear(), ayNo = ay.getMonth();
    const bosluk = (new Date(yil, ayNo, 1).getDay() + 6) % 7;
    const gunSayisi = new Date(yil, ayNo + 1, 0).getDate();
    const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const AY_KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const pad = (x) => String(x).padStart(2, '0');
    const ayOneki = `${yil}-${pad(ayNo + 1)}`;
    const buAyinRandevulari = randevular
        .filter((r) => String(r.date || '').startsWith(ayOneki))
        .sort((a, b) => String(a.date).localeCompare(String(b.date)) || (a.hour ?? 0) - (b.hour ?? 0));
    const randevuluGunler = new Set(buAyinRandevulari.map((r) => Number(String(r.date).slice(-2))));
    const [seciliGun, setSeciliGun] = useState(null);
    const donemTakvimi = ogretimTakvimi('2026-2027');
    const kisaTarih = (t) => {
        const [, a, g] = String(t).split('-').map(Number);
        return `${g} ${AY_KISA[a - 1]}`;
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <span className="tip-small font-black text-ink">{AYLAR[ayNo]} {yil}</span>
                <span className="flex gap-1">
                    <button type="button" onClick={() => onAy(new Date(yil, ayNo - 1, 1))} aria-label="Önceki ay"
                        className="w-7 h-7 rounded-dsm border border-line text-ink-3 hover:text-ink hover:bg-surface-2 grid place-items-center">‹</button>
                    <button type="button" onClick={() => onAy(new Date(yil, ayNo + 1, 1))} aria-label="Sonraki ay"
                        className="w-7 h-7 rounded-dsm border border-line text-ink-3 hover:text-ink hover:bg-surface-2 grid place-items-center">›</button>
                </span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map((g, i) => (
                    <span key={g} className="tip-mini font-black uppercase h-7 grid place-items-center rounded-lg mb-1"
                        style={{
                            color: i >= 5 ? '#fff' : 'var(--ink-2)',
                            background: i >= 5 ? 'var(--brand)' : 'var(--surface-2)',
                            boxShadow: i >= 5
                                ? 'inset 0 1px 0 rgba(255,255,255,.3), 0 3px 8px -2px color-mix(in srgb, var(--brand) 50%, transparent)'
                                : 'inset 0 1px 0 var(--lit), 0 1px 3px rgba(var(--cast), .16)',
                        }}>{g}</span>
                ))}
                {Array.from({ length: bosluk }).map((_, i) => <span key={`b${i}`} />)}
                {Array.from({ length: gunSayisi }, (_, i) => i + 1).map((g) => {
                    const tarihStr = `${yil}-${pad(ayNo + 1)}-${pad(g)}`;
                    const tarih = new Date(yil, ayNo, g);
                    const bugunMu = tarih.getTime() === bugun.getTime();
                    const bilgi = gunBilgisi(tarihStr);
                    const randevuVar = randevuluGunler.has(g);
                    let zemin = 'var(--surface-2)';
                    let yazi = 'var(--ink-2)';
                    let golge = '0 1px 2px rgba(var(--cast), .1)';
                    let kenar = '1px solid transparent';
                    if (bugunMu) {
                        zemin = 'var(--brand)'; yazi = '#fff';
                        golge = 'inset 0 1px 0 rgba(255,255,255,.3), 0 4px 10px -2px color-mix(in srgb, var(--brand) 55%, transparent)';
                    } else if (bilgi?.tur === 'ulusal' || bilgi?.tur === 'dini') {
                        zemin = 'var(--danger-soft)'; yazi = 'var(--danger)';
                        kenar = '1px solid color-mix(in srgb, var(--danger) 30%, transparent)';
                    } else if (bilgi) {
                        zemin = 'var(--info-soft)'; yazi = 'var(--info)';
                        kenar = '1px solid color-mix(in srgb, var(--info) 30%, transparent)';
                    } else if ([0, 6].includes(tarih.getDay())) {
                        yazi = 'var(--brand-metin)';
                    }
                    const ipucu = [
                        bilgi ? `${bilgi.ad}${bilgi.tahmini ? ' (tahmini)' : ''}` : null,
                        randevuVar ? 'Randevu var' : null,
                    ].filter(Boolean).join(' · ') || undefined;
                    const secili = seciliGun === g;
                    return (
                        <button key={g} type="button" title={ipucu}
                            onClick={() => setSeciliGun(secili ? null : g)}
                            className="relative h-9 grid place-items-center rounded-lg tabular-nums text-[12px] font-bold transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                            style={{ background: zemin, color: yazi, boxShadow: golge, border: secili ? '2px solid var(--brand)' : kenar }}>
                            {g}
                            {randevuVar && (
                                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full"
                                    style={{ background: bugunMu ? '#fff' : 'var(--brand)' }} />
                            )}
                        </button>
                    );
                })}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 tip-mini text-ink-3">
                <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded" style={{ background: 'var(--brand)' }} />Bugün
                </span>
                <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded" style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)' }} />Resmî tatil
                </span>
                <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded" style={{ background: 'var(--info-soft)', border: '1px solid var(--info)' }} />Okul/ara tatil
                </span>
                <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand)' }} />Randevu
                </span>
            </div>

            {seciliGun && (() => {
                const bilgi = gunBilgisi(`${yil}-${pad(ayNo + 1)}-${pad(seciliGun)}`);
                const gunRandevulari = buAyinRandevulari.filter((r) => Number(String(r.date).slice(-2)) === seciliGun);
                const renk = bilgi
                    ? (bilgi.tur === 'ulusal' || bilgi.tur === 'dini' ? 'var(--danger)' : 'var(--info)')
                    : 'var(--ink-2)';
                return (
                    <div className="mt-3 p-3 rounded-xl"
                        style={{ background: 'var(--surface-2)', boxShadow: 'inset 0 1px 0 var(--lit), 0 2px 6px -2px rgba(var(--cast), .18)' }}>
                        <p className="tip-small font-black text-ink m-0">{seciliGun} {AYLAR[ayNo]} {yil}</p>
                        {bilgi && (
                            <p className="tip-caption m-0 mt-1 font-bold" style={{ color: renk }}>
                                {bilgi.tur === 'ulusal' || bilgi.tur === 'dini' ? '🎌' : '🏫'} {bilgi.ad}{bilgi.tahmini ? ' · tahmini' : ''}
                            </p>
                        )}
                        {gunRandevulari.map((r) => (
                            <p key={r.id || r.hour} className="tip-caption m-0 mt-1 text-ink-2">
                                🕐 {r.hour != null ? `${pad(r.hour)}:00` : ''} · {r.studentName || 'Öğrenci'}{r.note ? ` · ${r.note}` : ''}
                            </p>
                        ))}
                        {!bilgi && gunRandevulari.length === 0 && (
                            <p className="tip-caption m-0 mt-1 text-ink-3">Bu gün için tatil/randevu kaydı yok.</p>
                        )}
                    </div>
                );
            })()}

            {donemTakvimi.length > 0 && (
                <div className="mt-3 pt-3 border-t border-line-subtle">
                    <p className="tip-mini font-black uppercase tracking-wider text-ink-3 m-0 mb-2">
                        Eğitim-Öğretim Takvimi 2026-2027{' '}
                        <span className="font-semibold normal-case">(tahmini · MEB ile doğrulayın)</span>
                    </p>
                    <div className="flex flex-col gap-1.5">
                        {donemTakvimi.map((k) => (
                            <div key={k.ad} className="flex items-center gap-2 tip-mini">
                                <span className="w-2 h-2 rounded shrink-0"
                                    style={{ background: k.tur === 'aratatil' ? 'var(--info)' : 'var(--ok)' }} />
                                <span className="text-ink-2 flex-1 truncate">{k.ad}</span>
                                <span className="text-ink-3 tabular-nums shrink-0">
                                    {k.bas === k.son ? kisaTarih(k.bas) : `${kisaTarih(k.bas)} – ${kisaTarih(k.son)}`}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {buAyinRandevulari.length > 0 && (
                <div className="mt-3 pt-3 border-t border-line-subtle flex flex-col gap-2">
                    <p className="tip-mini font-black uppercase tracking-wider text-ink-3 m-0">Bu ayın randevuları</p>
                    {buAyinRandevulari.slice(0, 6).map((r) => {
                        const gun = Number(String(r.date).slice(-2));
                        return (
                            <button key={r.id || `${r.date}-${r.hour}`} type="button" title="Randevuları yönet"
                                onClick={() => onGit?.('appointments')}
                                className="flex items-center gap-2.5 text-left w-full rounded-lg -mx-1 px-1 py-0.5 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                                <span className="shrink-0 w-11 rounded-lg text-center py-1 shadow-sm" style={{ background: 'var(--brand-soft)' }}>
                                    <span className="block text-sm font-black tabular-nums leading-none" style={{ color: 'var(--brand-metin)' }}>{gun}</span>
                                    <span className="block tip-mini font-bold" style={{ color: 'var(--brand-metin)' }}>{AY_KISA[ayNo]}</span>
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="tip-small font-bold text-ink block truncate">{r.studentName || 'Öğrenci'}</span>
                                    <span className="tip-mini text-ink-3 block truncate">
                                        {r.hour != null ? `${pad(r.hour)}:00` : ''}
                                        {r.duration ? ` · ${r.duration} dk` : ''}
                                        {r.note ? ` · ${r.note}` : ''}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default function KocGenelBakis({ students = [], user, gorevler = [], onOgrenciAc, onGit }) {
    /* Öğrenci verisi kaydedildikçe tazelen (storage olayı). */
    const [surum, setSurum] = useState(0);
    const [donemAdet, setDonemAdet] = useState(6);
    const [takvimAy, setTakvimAy] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
    /* Üçlü durum şeridinde açık olan bölme. */
    const [acikDurum, setAcikDurum] = useState(null);
    /* "Son Denemede Net Değişimi" listesinde genişleyen öğrenci. */
    const [acikOgrenci, setAcikOgrenci] = useState(null);

    const kocId = user?.id;
    useEffect(() => {
        const tetik = () => setSurum((v) => v + 1);
        window.addEventListener('storage', tetik);
        return () => window.removeEventListener('storage', tetik);
    }, []);

    const sinif = useMemo(() => {
        if (!students.length) return null;
        try { return buildClassReport(students); } catch { return null; }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [students, surum]);

    /* ── Triyaj sinyalleri: konu haritası + hata defteri + görevler ── */
    const konuOzetleri = useMemo(() => {
        try { return topluOzet(students, olcutOku()); } catch { return new Map(); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [students, surum]);

    const vadesiGelenler = useMemo(() => {
        try { return vadesiGelenSayilari(students.map((s) => s.id)); } catch { return new Map(); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [students, surum]);

    const gecikenler = useMemo(() => {
        try { return gecikenGorevSayilari(students); } catch { return new Map(); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [students, surum]);

    /**
     * BUGÜN DİKKAT GEREKENLER — triyaj sırası:
     * 1) "dikkat": tamamlandı işaretli ama denemede hata üreten konu,
     * 2) "tekrar": vadesi gelen hata defteri tekrarı,
     * 3) yalnız geciken görevi olanlar (operasyonel) listenin sonuna.
     */
    const dikkatGerekenler = useMemo(() => {
        const sinyaller = [];
        students.forEach((o) => {
            if (!o || o.id == null) return;
            const sid = String(o.id);
            const hatali = konuOzetleri.get(sid)?.tamamHatali?.[0];
            if (hatali && hatali.denemeHatasi > 0) {
                sinyaller.push({ id: o.id, name: o.name, grade: o.grade, tur: 'dikkat', sayi: hatali.denemeHatasi, sonHataTarihi: hatali.sonHataTarihi || null });
                return;
            }
            const vade = vadesiGelenler.get(sid)?.count || 0;
            if (vade > 0) sinyaller.push({ id: o.id, name: o.name, grade: o.grade, tur: 'tekrar', sayi: vade });
        });
        sinyaller.sort((a, b) => (a.tur !== b.tur ? (a.tur === 'dikkat' ? -1 : 1) : b.sayi - a.sayi));
        const listede = new Set(sinyaller.map((s) => String(s.id)));
        return [
            ...sinyaller.map((s) => ({ ...s, geciken: gecikenler.get(String(s.id)) || 0 })),
            ...students
                .filter((o) => o && o.id != null && !listede.has(String(o.id)) && (gecikenler.get(String(o.id)) || 0) > 0)
                .map((o) => ({ id: o.id, name: o.name, grade: o.grade, tur: null, sayi: 0, geciken: gecikenler.get(String(o.id)) || 0 }))
                .sort((a, b) => b.geciken - a.geciken),
        ];
    }, [students, konuOzetleri, vadesiGelenler, gecikenler]);

    /* ── Sınıf net serisi (ortalama + açıklık) ─────────────────── */
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

    /* ── Net değişimi (yükselen + düşen tek listede) ───────────── */
    const netDegisimleri = useMemo(() => {
        if (!sinif) return [];
        const hepsi = [...(sinif.topPerformers || []), ...(sinif.atRisk || [])];
        const gorulen = new Set();
        return hepsi
            .filter((r) => {
                const k = String(r.student?.id ?? r.student?.name ?? '');
                if (!k || gorulen.has(k)) return false;
                gorulen.add(k);
                return Number.isFinite(Number(r.exams?.lastNet)) && Number.isFinite(Number(r.exams?.prevNet));
            })
            .map((r) => ({
                id: r.student?.id ?? r.student?.name,
                ad: r.student?.name || '—',
                once: Number(r.exams.prevNet),
                sonra: Number(r.exams.lastNet),
            }));
    }, [sinif]);

    /**
     * SEÇİLİ ÖĞRENCİ DENEME DETAYI — "Net Değişimi" satırına tıklanınca
     * son 3 denemenin ders bazlı netleri açık→koyu barlarla açılır.
     */
    const ogrenciDetayi = useMemo(() => {
        if (!acikOgrenci) return { ad: '', dersler: [], sonNet: null, fark: null, barlar: [], denemeAdlari: [] };
        const kayit = students.find((s) => String(s.id) === String(acikOgrenci) || String(s.name) === String(acikOgrenci));
        const ad = kayit?.name || String(acikOgrenci);
        const normAd = String(ad).trim().toLocaleLowerCase('tr-TR');
        const sonuclar = listeOku('v2_results_data')
            .filter((r) => (kayit && String(r.studentId || '') === String(kayit.id))
                || String(r.student || r.studentName || '').trim().toLocaleLowerCase('tr-TR') === normAd)
            .map((r) => ({ r, net: Number(r.totalNet), t: new Date(r.examDate || r.date || r.uploadedAt || 0).getTime(), ham: String(r.examName || r.name || 'Deneme') }))
            .filter((x) => Number.isFinite(x.net))
            .sort((a, b) => a.t - b.t);
        const dersSeti = new Set();
        const seri = sonuclar.map((x) => {
            const satir = { ad: x.ham.length > 10 ? `${x.ham.slice(0, 9)}…` : x.ham, net: x.net };
            const subjects = x.r.subjects || {};
            Object.keys(subjects).forEach((k) => {
                const v = Number(subjects[k]?.net ?? subjects[k]);
                if (Number.isFinite(v)) { satir[k] = v; dersSeti.add(k); }
            });
            return satir;
        });
        const dersler = [...dersSeti]
            .sort((a, b) => ((DERS_SIRASI.indexOf(a) + 1 || 99) - (DERS_SIRASI.indexOf(b) + 1 || 99)))
            .map((k, i) => ({ key: k, ad: DERS_ADLARI[k] || k, renk: DERS_RENKLERI[k] || KART_RENKLERI[i % KART_RENKLERI.length] }));
        const sonNet = seri.length ? seri[seri.length - 1].net : null;
        const fark = seri.length > 1 ? Math.round(10 * (sonNet - seri[seri.length - 2].net)) / 10 : null;
        const son3 = seri.slice(-3);
        const sayi = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
        const barlar = dersler.map((d) => ({
            ad: d.ad, renk: d.renk,
            e1: son3[0] ? sayi(son3[0][d.key]) : null,
            e2: son3[1] ? sayi(son3[1][d.key]) : null,
            e3: son3[2] ? sayi(son3[2][d.key]) : null,
        }));
        return { ad, dersler, sonNet, fark, barlar, denemeAdlari: sonuclar.slice(-3).map((x) => x.ham) };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [acikOgrenci, students, surum]);

    /** Koçun kendi açık görevleri. */
    const acikGorevler = useMemo(() => (
        (gorevler || [])
            .filter((g) => !g.completed && g.status !== 'Tamamlandı')
            .sort((a, b) => String(a.sonTarih || a.dueDate || '9999').localeCompare(String(b.sonTarih || b.dueDate || '9999')))
    ), [gorevler]);

    /** Bugünden itibaren randevular — takvim ve ay listesi bunları okur. */
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

    const durumlar = sinif ? [
        {
            baslik: 'Haftalık Katılım', kisa: 'Katılım', renk: 'var(--c5)',
            oran: sinif.studentCount ? (sinif.activeCount / sinif.studentCount) * 100 : null,
            aciklama: `${sinif.studentCount} öğrencinin ${sinif.activeCount} tanesi son 7 günde kayıt girdi.`,
        },
        {
            baslik: 'Görev Tamamlama', kisa: 'Görev', renk: 'var(--c4)',
            oran: sinif.avgCompletionPct,
            aciklama: 'Atanan görevlerin sınıf ortalamasındaki tamamlanma oranı.',
        },
        {
            baslik: 'Risk Dışı Öğrenci', kisa: 'Risk Dışı', renk: 'var(--c1)',
            oran: sinif.studentCount ? ((sinif.studentCount - sinif.atRisk.length) / sinif.studentCount) * 100 : null,
            aciklama: sinif.atRisk.length
                ? `${sinif.atRisk.length} öğrenci yüksek riskli; ilk bakılacak yer burası.`
                : 'Yüksek riskli öğrenci yok.',
        },
    ] : [];
    const halkaCevre = 2 * Math.PI * 22;

    return (
        <div className="gb-kok space-y-4 xl:space-y-3 xl:flex-1 xl:min-h-0 xl:flex xl:flex-col xl:overflow-hidden">
            {sinif && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 xl:gap-5 items-start xl:items-stretch xl:flex-1 xl:min-h-0 xl:overflow-hidden xl:[grid-template-rows:minmax(0,1fr)]">

                    {/* ═══ SOL: ÖĞRENCİLERİN GİDİŞATI ═══ */}
                    <div className="xl:col-span-8 min-w-0 space-y-4 order-2 xl:order-1 xl:min-h-0 xl:overflow-y-auto xl:pr-1.5 tek-ekran-govde">

                        {/* ── Üçlü durum şeridi — tıkla → açıklama ── */}
                        <div className="card p-0 overflow-hidden"
                            style={{ boxShadow: 'inset 0 1px 0 var(--lit), 0 2px 6px -2px rgba(var(--cast), .18), 0 14px 30px -14px rgba(var(--cast), .45)' }}>
                            <div className="grid grid-cols-3 divide-x divide-line-subtle">
                                {durumlar.map((d, i) => {
                                    const veriVar = d.oran != null && Number.isFinite(Number(d.oran));
                                    const oran = veriVar ? Math.max(0, Math.min(100, Math.round(Number(d.oran)))) : 0;
                                    const acik = acikDurum === i;
                                    return (
                                        <button key={d.baslik} type="button" onClick={() => setAcikDurum(acik ? null : i)}
                                            aria-expanded={acik}
                                            className="relative py-4 px-2 flex flex-col items-center gap-1.5 text-center transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
                                            style={{
                                                background: `color-mix(in srgb, ${d.renk} ${acik ? 15 : 6}%, var(--surface))`,
                                                boxShadow: acik ? `inset 0 -3px 0 ${d.renk}` : 'none',
                                            }}>
                                            <span className="relative grid place-items-center" style={{ width: 54, height: 54 }}>
                                                <svg width="54" height="54" className="-rotate-90" aria-hidden="true">
                                                    <circle cx="27" cy="27" r={22} fill="none" stroke="var(--surface-3)" strokeWidth="6" />
                                                    {veriVar && (
                                                        <circle cx="27" cy="27" r={22} fill="none" stroke={d.renk} strokeWidth="6" strokeLinecap="round"
                                                            strokeDasharray={halkaCevre} strokeDashoffset={halkaCevre - halkaCevre * oran / 100}
                                                            style={{ transition: 'stroke-dashoffset .6s ease' }} />
                                                    )}
                                                </svg>
                                                <span className="absolute text-[13px] font-black tabular-nums" style={{ color: d.renk }}>
                                                    {veriVar ? `%${oran}` : '—'}
                                                </span>
                                            </span>
                                            <span className="tip-mini font-black text-ink leading-tight">{d.kisa}</span>
                                            <span className="tip-mini text-ink-3 leading-none">detay ▾</span>
                                        </button>
                                    );
                                })}
                            </div>
                            {acikDurum != null && (() => {
                                const d = durumlar[acikDurum];
                                const veriVar = d.oran != null && Number.isFinite(Number(d.oran));
                                const oran = veriVar ? Math.max(0, Math.min(100, Math.round(Number(d.oran)))) : 0;
                                const durum = veriVar ? durumBul(oran) : { ad: 'Kayıt yok', renk: 'var(--ink-3)' };
                                return (
                                    <div className="border-t p-4"
                                        style={{
                                            borderColor: `color-mix(in srgb, ${d.renk} 25%, transparent)`,
                                            background: `color-mix(in srgb, ${d.renk} 7%, var(--surface))`,
                                        }}>
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-black text-ink m-0">{d.baslik}</p>
                                            <span className="inline-flex items-center gap-1.5 text-[11px] font-black" style={{ color: durum.renk }}>
                                                <span className="w-2 h-2 rounded-full" style={{ background: durum.renk }} />
                                                {durum.ad} · %{oran}
                                            </span>
                                        </div>
                                        <p className="tip-caption mt-1.5 leading-snug">{d.aciklama}</p>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* ── Sınıf gelişimi: ortalama + açıklık ── */}
                        {sinifSerisi.length >= 2 ? (
                            <div className="card p-4 sm:p-5">
                                <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                                    <div className="min-w-0">
                                        <h3 className="tip-h4 m-0">Öğrenci Gelişimi</h3>
                                        <p className="tip-caption mt-0.5">
                                            Son {sinifSerisi.length} deneme · ortalama ve öğrenciler arası açıklık
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
                                            <Area type="monotone" dataKey="enYuksek" name="En yüksek"
                                                stroke="var(--ok)" strokeWidth={1.5} strokeDasharray="4 3"
                                                fill="transparent" dot={false} animationDuration={300} />
                                            <Area type="monotone" dataKey="enDusuk" name="En düşük"
                                                stroke="var(--danger)" strokeWidth={1.5} strokeDasharray="4 3"
                                                fill="transparent" dot={false} animationDuration={300} />
                                            <Area type="monotone" dataKey="ortalama" name="Öğrenci ortalaması"
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

                        {/* ── Net değişimi — satıra tıkla → ders detayı ── */}
                        {netDegisimleri.length > 0 && (
                            <Bolum baslik="Son Denemede Net Değişimi">
                                <div className="flex flex-col">
                                    {[...netDegisimleri]
                                        .sort((a, b) => Math.abs(b.sonra - b.once) - Math.abs(a.sonra - a.once))
                                        .slice(0, 6)
                                        .map((r) => {
                                            const fark = Math.round(10 * (r.sonra - r.once)) / 10;
                                            const renk = fark === 0 ? 'var(--ink-3)' : fark > 0 ? 'var(--ok)' : 'var(--danger)';
                                            const acik = String(acikOgrenci) === String(r.id);
                                            return (
                                                <button key={r.id || r.ad} type="button"
                                                    onClick={() => setAcikOgrenci(acik ? null : r.id)}
                                                    aria-expanded={acik}
                                                    className="flex items-center gap-2 py-2 border-b border-line last:border-0 text-left transition-colors rounded-dsm px-1 hover:bg-surface-2 min-h-[40px]"
                                                    style={acik ? { background: 'var(--brand-soft)' } : undefined}>
                                                    <span className="tip-small text-ink-2 flex-1 min-w-0 truncate">{r.ad}</span>
                                                    <span className="tip-small text-ink-3 tabular-nums shrink-0">{r.once}</span>
                                                    <span className="text-ink-3 shrink-0" aria-hidden="true">→</span>
                                                    <span className="tip-small font-bold text-ink tabular-nums shrink-0 w-[46px] text-right">{r.sonra}</span>
                                                    <span className="tip-mini font-black tabular-nums shrink-0 rounded-full px-2 py-0.5 inline-flex items-center gap-1"
                                                        style={{ background: `color-mix(in srgb, ${renk} 14%, transparent)`, color: renk }}>
                                                        {fark > 0 ? '↑' : fark < 0 ? '↓' : '–'}{Math.abs(fark)}
                                                    </span>
                                                    <span className="tip-mini text-ink-3 shrink-0 w-3 text-center" aria-hidden="true">{acik ? '▾' : '▸'}</span>
                                                </button>
                                            );
                                        })}
                                </div>
                                {acikOgrenci && (
                                    <div className="mt-3 rounded-2xl overflow-hidden"
                                        style={{
                                            background: 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 100%, white 5%), var(--surface))',
                                            boxShadow: 'inset 0 1px 0 var(--lit), 0 2px 6px -2px rgba(var(--cast), .2), 0 14px 30px -14px rgba(var(--cast), .5)',
                                            border: '1px solid var(--line)',
                                        }}>
                                        {ogrenciDetayi.barlar.length > 0 ? (
                                            <>
                                                <div className="flex items-center justify-between gap-2 p-3 sm:p-4 border-b border-line-subtle">
                                                    <div className="min-w-0">
                                                        <p className="tip-small font-black text-ink m-0 truncate">{ogrenciDetayi.ad}</p>
                                                        <p className="tip-mini text-ink-3 m-0">Son {ogrenciDetayi.denemeAdlari.length} deneme · ders bazında net</p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-xl font-black text-ink tabular-nums m-0 leading-none">{ogrenciDetayi.sonNet}</p>
                                                        {ogrenciDetayi.fark != null && (
                                                            <p className="tip-mini font-black m-0 mt-0.5"
                                                                style={{ color: ogrenciDetayi.fark >= 0 ? 'var(--ok)' : 'var(--danger)' }}>
                                                                {ogrenciDetayi.fark >= 0 ? '↑' : '↓'} {Math.abs(ogrenciDetayi.fark)} net · öncekine göre
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="h-72 p-2 pr-3">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={ogrenciDetayi.barlar}
                                                            margin={{ top: 26, right: 6, bottom: 4, left: -16 }} barGap={1} barCategoryGap="22%">
                                                            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
                                                            <XAxis dataKey="ad" hide />
                                                            <YAxis tick={{ fill: 'var(--ink-3)', fontSize: 10 }} tickLine={false} axisLine={false} />
                                                            <Tooltip cursor={{ fill: 'color-mix(in srgb, var(--brand) 8%, transparent)' }} contentStyle={GRAFIK_STIL} />
                                                            <Bar dataKey="e1" name={ogrenciDetayi.denemeAdlari[0] || 'Deneme 1'} fillOpacity={0.4}
                                                                radius={[3, 3, 0, 0]} maxBarSize={15} animationDuration={350}>
                                                                {ogrenciDetayi.barlar.map((b, i) => <Cell key={`e1${i}`} fill={b.renk} />)}
                                                            </Bar>
                                                            <Bar dataKey="e2" name={ogrenciDetayi.denemeAdlari[1] || 'Deneme 2'} fillOpacity={0.68}
                                                                radius={[3, 3, 0, 0]} maxBarSize={15} animationDuration={350}>
                                                                {ogrenciDetayi.barlar.map((b, i) => <Cell key={`e2${i}`} fill={b.renk} />)}
                                                            </Bar>
                                                            <Bar dataKey="e3" name={ogrenciDetayi.denemeAdlari[2] || 'Deneme 3'} fillOpacity={1}
                                                                radius={[3, 3, 0, 0]} maxBarSize={15} animationDuration={350}>
                                                                {ogrenciDetayi.barlar.map((b, i) => <Cell key={`e3${i}`} fill={b.renk} />)}
                                                                <LabelList dataKey="ad" position="top" angle={-32} offset={12}
                                                                    style={{ fontSize: 9, fill: 'var(--ink-2)', fontWeight: 700 }} />
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <p className="tip-mini text-ink-3 px-3 pb-3 m-0">Son 3 deneme (açık→koyu: eski→yeni)</p>
                                            </>
                                        ) : (
                                            <p className="tip-caption text-ink-3 m-0 p-4">{ogrenciDetayi.ad} için deneme verisi yok.</p>
                                        )}
                                    </div>
                                )}
                            </Bolum>
                        )}

                        {/* ── En yüksek netler ── */}
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
                                            <button key={r.student?.id || ad} type="button"
                                                onClick={() => onOgrenciAc?.(r.student?.id)}
                                                className="text-left rounded-dmd border border-line bg-surface p-3 flex flex-col gap-2 transition-all hover:-translate-y-px hover:border-brand-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-8 h-8 rounded-full grid place-items-center text-[12px] font-black shrink-0"
                                                        style={{ background: 'var(--brand-soft)', color: 'var(--brand-metin)' }}>
                                                        {ad.charAt(0).toUpperCase()}
                                                    </span>
                                                    <span className="min-w-0">
                                                        <span className="tip-mini text-ink-3 uppercase tracking-wider block">{sira + 1}. sırada</span>
                                                        <span className="tip-small font-bold text-ink block truncate" title={ad}>{ad}</span>
                                                    </span>
                                                </div>
                                                <p className="text-2xl font-black tabular-nums leading-none m-0"
                                                    style={{ color: 'var(--brand-metin)' }}>
                                                    {r.exams?.lastNet ?? '—'}
                                                    <span className="tip-mini text-ink-3 font-bold ml-1">net</span>
                                                </p>
                                                <Yildizlar oran={(r.exams?.lastNet || 0) / (enUst || 1)} />
                                                {seri.length >= 2
                                                    ? <MiniSeri seri={seri} tur="dolgu" renk="var(--brand)" yukseklik={26} className="mt-auto" />
                                                    : <p className="tip-mini text-ink-3 m-0 mt-auto">tek deneme</p>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </Bolum>
                        )}
                    </div>

                    {/* ═══ SAĞ: KOÇUN GÜNÜ ═══ */}
                    <aside className="xl:col-span-4 min-w-0 space-y-4 order-1 xl:order-2 xl:min-h-0 xl:overflow-y-auto xl:pr-1.5 tek-ekran-govde">

                        {/* ── Kompakt koç kartı ── */}
                        <div className="card p-3.5 flex items-center gap-3.5"
                            style={{
                                background: 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 100%, white 6%), var(--surface))',
                                boxShadow: 'inset 0 1px 0 var(--lit), 0 2px 6px -2px rgba(var(--cast), .2), 0 12px 26px -12px rgba(var(--cast), .45)',
                            }}>
                            <span className="w-14 h-14 rounded-2xl grid place-items-center text-lg font-black shrink-0 shadow-md ring-1 ring-black/5"
                                style={{ background: 'linear-gradient(135deg, var(--brand), var(--accent))', color: '#fff' }}>
                                {(user?.name || 'K').charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-base font-black text-ink m-0 truncate">{user?.name || 'Koç'}</p>
                                <p className="tip-caption m-0 mt-0.5">Koç</p>
                            </div>
                            <div className="shrink-0 flex flex-col gap-2 items-end">
                                <div className="flex items-center gap-2 rounded-lg px-2.5 py-1" style={{ background: 'var(--surface-2)' }}>
                                    <span className="tip-mini text-ink-3 uppercase tracking-wider">Öğrenci</span>
                                    <span className="text-base font-black text-ink tabular-nums leading-none">{sinif.studentCount}</span>
                                </div>
                                <div className="flex items-center gap-2 rounded-lg px-2.5 py-1" style={{ background: 'var(--brand-soft)' }}>
                                    <span className="tip-mini uppercase tracking-wider" style={{ color: 'var(--brand-metin)' }}>Bu Hafta Aktif</span>
                                    <span className="text-base font-black tabular-nums leading-none" style={{ color: 'var(--brand-metin)' }}>{sinif.activeCount}</span>
                                </div>
                            </div>
                        </div>

                        {/* ── Bugün Dikkat Gerekenler — triyaj ── */}
                        {dikkatGerekenler.length > 0 && (
                            <div className="card p-4">
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <h3 className="tip-h4 m-0">Bugün Dikkat Gerekenler</h3>
                                    <span className="badge badge-neutral">{dikkatGerekenler.length}</span>
                                </div>
                                <div className="flex flex-col divide-y divide-line-subtle">
                                    {dikkatGerekenler.slice(0, 5).map((o) => (
                                        <button key={o.id} type="button" onClick={() => onOgrenciAc?.(o.id)}
                                            className="flex items-center gap-3 py-2.5 text-left hover:bg-surface-2 transition-colors rounded-dsm px-1 min-h-[44px]">
                                            <span className="w-8 h-8 rounded-full grid place-items-center text-[12px] font-black shrink-0"
                                                style={{ background: 'var(--brand-soft)', color: 'var(--brand-metin)' }}>
                                                {String(o.name || '?').charAt(0).toUpperCase()}
                                            </span>
                                            <span className="min-w-0 flex-1 flex flex-col gap-0.5">
                                                <span className="tip-small font-bold text-ink truncate">{o.name}</span>
                                                {o.tur === 'dikkat' && (() => {
                                                    const sonHata = neKadarOnce(o.sonHataTarihi);
                                                    return (
                                                        <span className="tip-mini flex items-center gap-1 w-fit max-w-full px-1.5 py-[1px] rounded-full font-semibold bg-warn-soft text-warn"
                                                            title={`Tamamlandı ama denemede ${o.sayi} hata${sonHata ? ` · son hata: ${sonHata}` : ''}`}>
                                                            <AlertTriangle size={11} className="shrink-0" aria-hidden="true" />
                                                            <span className="truncate">
                                                                Dikkat · Tamamlandı ama {o.sayi} hata{sonHata ? ` · son hata ${sonHata}` : ''}
                                                            </span>
                                                        </span>
                                                    );
                                                })()}
                                                {o.tur === 'tekrar' && (
                                                    <span className="tip-mini flex items-center gap-1 w-fit max-w-full px-1.5 py-[1px] rounded-full font-semibold"
                                                        style={{ background: 'var(--brand-soft)', color: 'var(--brand-metin)' }}
                                                        title={`${o.sayi} hatanın tekrar zamanı geldi`}>
                                                        <RotateCcw size={11} className="shrink-0" aria-hidden="true" />
                                                        <span className="truncate">Tekrar · {o.sayi}</span>
                                                    </span>
                                                )}
                                                {o.geciken > 0 && (
                                                    <span className="tip-mini flex items-center gap-1 w-fit max-w-full px-1.5 py-[1px] rounded-full font-semibold bg-surface-2 text-ink-2"
                                                        title={`${o.geciken} görevin süresi geçmiş (tamamlanmamış) — operasyonel`}>
                                                        <Clock size={11} className="shrink-0" aria-hidden="true" />
                                                        <span className="truncate">Geciken görev · {o.geciken}</span>
                                                    </span>
                                                )}
                                            </span>
                                            <span className="tip-mini shrink-0 self-start mt-0.5" style={{ color: 'var(--brand-metin)' }}>Karne →</span>
                                        </button>
                                    ))}
                                </div>
                                {dikkatGerekenler.length > 5 && (
                                    <button type="button" onClick={() => onGit?.('analysis')}
                                        className="tip-caption font-bold mt-2 hover:underline"
                                        style={{ color: 'var(--brand-metin)' }}>
                                        +{dikkatGerekenler.length - 5} öğrenci daha →
                                    </button>
                                )}
                            </div>
                        )}

                        {/* ── Öğrencilerim — renkli kartlar + öne çıkan konu ── */}
                        {students.length > 0 && (
                            <div className="card p-4"
                                style={{ boxShadow: 'inset 0 1px 0 var(--lit), 0 2px 6px -2px rgba(var(--cast), .18), 0 12px 26px -14px rgba(var(--cast), .4)' }}>
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <h3 className="tip-h4 m-0">Öğrencilerim</h3>
                                    <span className="badge badge-neutral">{students.length}</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {students.slice(0, 6).map((o, i) => {
                                        const renk = KART_RENKLERI[i % KART_RENKLERI.length];
                                        return (
                                            <button key={o.id} type="button" onClick={() => onOgrenciAc?.(o.id)}
                                                className="flex items-center gap-3 py-2.5 text-left transition-all rounded-xl px-2.5 min-h-[44px] border hover:-translate-y-px"
                                                style={{
                                                    background: `color-mix(in srgb, ${renk} 7%, var(--surface))`,
                                                    borderColor: `color-mix(in srgb, ${renk} 28%, transparent)`,
                                                    borderLeftWidth: '4px',
                                                    borderLeftColor: renk,
                                                    boxShadow: '0 1px 2px rgba(var(--cast), .12), 0 6px 14px -8px rgba(var(--cast), .3)',
                                                }}>
                                                <span className="w-9 h-9 rounded-xl grid place-items-center text-[13px] font-black shrink-0 shadow-sm"
                                                    style={{ background: `color-mix(in srgb, ${renk} 16%, var(--surface))`, color: renk }}>
                                                    {String(o.name || '?').charAt(0).toUpperCase()}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="tip-small font-bold text-ink block truncate">{o.name}</span>
                                                    {o.grade && <span className="tip-mini text-ink-3 block">{o.grade}. sınıf</span>}
                                                    {(() => {
                                                        const oncelik = konuOzetleri.get(String(o.id))?.topOncelik?.[0];
                                                        return oncelik?.neden ? (
                                                            <span className="tip-mini block truncate"
                                                                style={{ color: 'var(--warn-metin, var(--warn))' }} title={oncelik.neden}>
                                                                Öne çıkan: {oncelik.ders} · {oncelik.konu}
                                                            </span>
                                                        ) : null;
                                                    })()}
                                                    {(() => {
                                                        const hatali = konuOzetleri.get(String(o.id))?.tamamHatali?.[0];
                                                        if (hatali && hatali.denemeHatasi > 0) {
                                                            const sonHata = neKadarOnce(hatali.sonHataTarihi);
                                                            return (
                                                                <span className="tip-mini flex items-center gap-1 mt-0.5 w-fit max-w-full px-1.5 py-[1px] rounded-full font-semibold bg-warn-soft text-warn"
                                                                    title={`${hatali.ders} · ${hatali.konu} — tamamlandı ama denemede ${hatali.denemeHatasi} hata${sonHata ? ` · son hata: ${sonHata}` : ''}`}>
                                                                    <AlertTriangle size={11} className="shrink-0" aria-hidden="true" />
                                                                    <span className="truncate">Dikkat · Tamamlandı ama {hatali.denemeHatasi} hata</span>
                                                                </span>
                                                            );
                                                        }
                                                        const vade = vadesiGelenler.get(String(o.id))?.count || 0;
                                                        return vade > 0 ? (
                                                            <span className="tip-mini flex items-center gap-1 mt-0.5 w-fit max-w-full px-1.5 py-[1px] rounded-full font-semibold"
                                                                style={{ background: 'var(--brand-soft)', color: 'var(--brand-metin)' }}
                                                                title={`${vade} hatanın tekrar zamanı geldi`}>
                                                                <RotateCcw size={11} className="shrink-0" aria-hidden="true" />
                                                                <span className="truncate">Tekrar · {vade} hata</span>
                                                            </span>
                                                        ) : null;
                                                    })()}
                                                </span>
                                                <span className="tip-mini shrink-0" style={{ color: 'var(--brand-metin)' }}>Karne →</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {students.length > 6 && (
                                    <button type="button" onClick={() => onGit?.('students')}
                                        className="tip-caption font-bold mt-2 hover:underline"
                                        style={{ color: 'var(--brand-metin)' }}>
                                        {students.length - 6} öğrenci daha →
                                    </button>
                                )}
                            </div>
                        )}

                        {/* ── Görevlerim ── */}
                        {acikGorevler.length > 0 && (
                            <div className="card p-4">
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <h3 className="tip-h4 m-0">Görevlerim</h3>
                                    <button type="button" onClick={() => onGit?.('coach-tasks')}
                                        className="tip-caption font-bold hover:underline"
                                        style={{ color: 'var(--brand-metin)' }}>Tümü</button>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {acikGorevler.slice(0, 4).map((g) => (
                                        <div key={g.id} className="flex items-start gap-2.5">
                                            <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--brand)' }} />
                                            <span className="min-w-0 flex-1">
                                                <span className="tip-small font-bold text-ink block truncate">{g.title || g.baslik || 'Görev'}</span>
                                                {(g.sonTarih || g.dueDate) && (
                                                    <span className="tip-mini text-ink-3 block">son tarih {g.sonTarih || g.dueDate}</span>
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Akademik takvim + bu ayın randevuları ── */}
                        <div className="card p-4"
                            style={{ boxShadow: 'inset 0 1px 0 var(--lit), 0 2px 6px -2px rgba(var(--cast), .18), 0 12px 26px -14px rgba(var(--cast), .4)' }}>
                            <AkademikTakvim randevular={randevular} ay={takvimAy} onAy={setTakvimAy} onGit={onGit} />
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
}
