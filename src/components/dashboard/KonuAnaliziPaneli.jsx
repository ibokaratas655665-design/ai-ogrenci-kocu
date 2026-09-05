/**
 * 🎯 KONU DAĞILIMI ANALİZİ
 *
 * Uygulama içi denemelerin (deneme motoru) konu-etiketli sonuçlarından
 * beslenir: deneme_analizleri kayıtlarındaki degerlendirme.istatistik.konular.
 *
 * İki kapsam: Sınıf Geneli (tüm öğrencilerin konu toplulaştırması) ve tek
 * öğrenci. Tek öğrenci + "Tüm Denemeler" seçiliyken KONU × DENEME isabet
 * matrisi çizilir (eksik konunun sonraki denemelerde kapanışı görünür) ve
 * "zayıf konular düzelirse net kaç olurdu" simülasyonu gösterilir. Koç,
 * analizden çıkan tavsiyesini DÖNÜT olarak öğrenciye tek tıkla gönderir —
 * öğrenci bunu Deneme Çöz ekranında "Koç Dönütü" olarak görür.
 *
 * Veri yoksa uydurma gösterilmez: konu-etiketli deneme üretmenin yolu
 * anlatılır (Sınav Oluştur → kitapçık + anahtar → "AI ile Oku").
 */
import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Lightbulb } from 'lucide-react';
import denemeKayitlari from '../../services/denemeKayitlari';
import denemeMotoru from '../../services/denemeMotoru';
import { notify } from '../../services/notificationService';

const RENKLER = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--brand)'];

/** İsabet yüzdesine trafik-ışığı rengi. */
const isabetRengi = (v) => (v == null ? 'var(--ink-3)' : v >= 75 ? 'var(--ok)' : v >= 50 ? 'var(--warn)' : 'var(--danger)');

/** Kaydın toplam neti (ders netlerinin toplamı). */
const kayitNeti = (k) => Object.values(k?.dersler || {}).reduce((t, d) => t + (Number(d?.net) || 0), 0);

const KonuAnaliziPaneli = ({ students = [], onDurum }) => {
    const [tetik, setTetik] = useState(0);
    const [denemeSecim, setDenemeSecim] = useState('hepsi'); // 'hepsi' | deneme anahtarı
    const [kapsam, setKapsam] = useState('sinif');           // 'sinif' | studentId
    const [donutMetin, setDonutMetin] = useState('');
    const [donutDurum, setDonutDurum] = useState('');

    useEffect(() => {
        const dinle = (e) => {
            if (e?.key && !/deneme_analizleri|koc_donutleri/.test(e.key)) return;
            setTetik((t) => t + 1);
        };
        window.addEventListener('storage', dinle);
        return () => window.removeEventListener('storage', dinle);
    }, []);

    /** Konu-etiketli kayıtlar: {studentId, student, examName, date, istatistik}. */
    const kayitlar = useMemo(() => {
        const adlar = new Map(students.map((s) => [String(s.id), s.name]));
        return denemeKayitlari.tumunuListele()
            .filter((k) => Array.isArray(k?.degerlendirme?.istatistik?.konular)
                && k.degerlendirme.istatistik.konular.length)
            .map((k) => ({
                studentId: String(k.studentId),
                student: adlar.get(String(k.studentId)) || k.studentName || String(k.studentId),
                examName: k.ad || 'Deneme',
                anahtar: `${k.ad || '?'}`,
                date: k.tarih || k.olusturma || null,
                dersler: k.dersler || {},
                istatistik: k.degerlendirme.istatistik,
            }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [students, tetik]);

    /** Deneme filtresi seçenekleri (konu verisi olan denemeler, tarih sıralı). */
    const denemeler = useMemo(() => {
        const m = new Map();
        kayitlar.forEach((k) => {
            if (!m.has(k.anahtar)) m.set(k.anahtar, { id: k.anahtar, ad: k.examName, tarih: k.date });
        });
        return [...m.values()].sort((a, b) => new Date(a.tarih || 0) - new Date(b.tarih || 0));
    }, [kayitlar]);

    /** Konu verisi olan öğrenciler (kapsam seçici). */
    const ogrenciler = useMemo(() => {
        const m = new Map();
        kayitlar.forEach((k) => { if (!m.has(k.studentId)) m.set(k.studentId, k.student); });
        return [...m.entries()].map(([id, ad]) => ({ id, ad }));
    }, [kayitlar]);

    /** Seçime uyan kayıtlar. */
    const secilen = useMemo(() => kayitlar.filter((k) => (
        (denemeSecim === 'hepsi' || k.anahtar === denemeSecim)
        && (kapsam === 'sinif' || k.studentId === String(kapsam))
    )), [kayitlar, denemeSecim, kapsam]);

    /** Ders → konu toplulaştırması + en zayıf 8 konu. */
    const analiz = useMemo(() => {
        const konuHarita = new Map();
        secilen.forEach((kayit) => {
            kayit.istatistik.konular.forEach((k) => {
                const ders = k.ders || 'Diğer';
                const konu = (k.konu && String(k.konu).trim()) || '—';
                const anahtar = `${ders}||${konu}`;
                const v = konuHarita.get(anahtar) || { ders, konu, dogru: 0, yanlis: 0, bos: 0, ogr: new Set() };
                v.dogru += Number(k.dogru) || 0;
                v.yanlis += Number(k.yanlis) || 0;
                v.bos += Number(k.bos) || 0;
                v.ogr.add(kayit.studentId);
                konuHarita.set(anahtar, v);
            });
        });
        const satirlar = [...konuHarita.values()].map((v) => {
            const cevaplanan = v.dogru + v.yanlis;
            return {
                ders: v.ders, konu: v.konu, dogru: v.dogru, yanlis: v.yanlis, bos: v.bos,
                ogrenciSayisi: v.ogr.size,
                toplam: v.dogru + v.yanlis + v.bos,
                isabet: cevaplanan > 0 ? Math.round((v.dogru / cevaplanan) * 100) : null,
                net: +(v.dogru - v.yanlis / 4).toFixed(2),
            };
        });
        const dersGrup = {};
        satirlar.forEach((s) => { (dersGrup[s.ders] = dersGrup[s.ders] || []).push(s); });
        Object.keys(dersGrup).forEach((d) => dersGrup[d].sort((a, b) => b.yanlis - a.yanlis));
        const dersler = Object.entries(dersGrup)
            .map(([ders, konular], i) => ({
                ders, konular, renk: RENKLER[i % RENKLER.length],
                yanlis: konular.reduce((t, k) => t + k.yanlis, 0),
                konuSayisi: konular.length,
            }))
            .sort((a, b) => b.yanlis - a.yanlis);
        const enZayif = satirlar
            .filter((s) => s.isabet != null && s.dogru + s.yanlis >= 2 && s.konu !== '—')
            .sort((a, b) => a.isabet - b.isabet)
            .slice(0, 8);
        return { dersler, enZayif, varMi: satirlar.length > 0, konuluVeri: satirlar.some((s) => s.konu !== '—') };
    }, [secilen]);

    /**
     * Tek öğrenci + Tüm Denemeler: KONU × DENEME isabet matrisi ve
     * "zayıf konular düzelirse" net simülasyonu (her düzelen yanlış
     * neti 1.25 artırır: +1 doğru, −0.25 götüren gider).
     */
    const matris = useMemo(() => {
        if (kapsam === 'sinif') return null;
        const kayitlarim = kayitlar
            .filter((k) => k.studentId === String(kapsam))
            .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
        if (!kayitlarim.length) return { denemeler: [], satirlar: [], varMi: false };

        const basliklar = kayitlarim.map((k, i) => ({ i, ad: k.examName || `Deneme ${i + 1}` }));
        const harita = new Map();
        kayitlarim.forEach((kayit, i) => {
            kayit.istatistik.konular.forEach((k) => {
                const ders = k.ders || 'Diğer';
                const konu = (k.konu && String(k.konu).trim()) || '—';
                const anahtar = `${ders}||${konu}`;
                const cevaplanan = (Number(k.dogru) || 0) + (Number(k.yanlis) || 0);
                const isabet = cevaplanan > 0 ? Math.round(((Number(k.dogru) || 0) / cevaplanan) * 100) : null;
                const v = harita.get(anahtar) || { ders, konu, hucre: {} };
                v.hucre[i] = { isabet, dogru: Number(k.dogru) || 0, yanlis: Number(k.yanlis) || 0 };
                harita.set(anahtar, v);
            });
        });
        const satirlar = [...harita.values()].map((v) => {
            const seri = basliklar.map((b) => v.hucre[b.i]?.isabet ?? null);
            const dolu = seri.filter((x) => x != null);
            const ilk = dolu[0] ?? null;
            const son = dolu[dolu.length - 1] ?? null;
            const trend = ilk != null && son != null && dolu.length > 1 ? son - ilk : null;
            return { ...v, seri, ilk, son, trend, gorunum: dolu.length };
        }).sort((a, b) => b.gorunum - a.gorunum || (a.son ?? 999) - (b.son ?? 999));

        const sonKayit = kayitlarim[kayitlarim.length - 1];
        const sonNet = +kayitNeti(sonKayit).toFixed(1);
        const zayiflar = (sonKayit.istatistik.konular || [])
            .map((k) => {
                const cevaplanan = (Number(k.dogru) || 0) + (Number(k.yanlis) || 0);
                return {
                    ders: k.ders, konu: (k.konu && String(k.konu).trim()) || '—',
                    yanlis: Number(k.yanlis) || 0,
                    isabet: cevaplanan > 0 ? Math.round(((Number(k.dogru) || 0) / cevaplanan) * 100) : null,
                };
            })
            .filter((k) => k.isabet != null && k.isabet < 60 && k.yanlis > 0 && k.konu !== '—')
            .sort((a, b) => b.yanlis - a.yanlis);
        const yanlisTop = zayiflar.reduce((t, k) => t + k.yanlis, 0);
        const kazanc = +(1.25 * yanlisTop).toFixed(2);

        return {
            denemeler: basliklar, satirlar, varMi: satirlar.length > 0,
            simulasyon: {
                sonNet, sonDenemeAd: sonKayit.examName || 'Son deneme',
                zayif: zayiflar.slice(0, 6), yanlisTop, kazanc,
                hedefNet: +(sonNet + kazanc).toFixed(1),
            },
        };
    }, [kayitlar, kapsam]);

    /* 04.09: PDF raporu "kişi seçiliyken konu gelişimi + koç dönütü"
       bölümünü basabilsin diye güncel seçim üst bileşene bildirilir.
       Panel davranışı değişmez; onDurum verilmemişse hiçbir şey olmaz. */
    useEffect(() => {
        if (!onDurum) return;
        const ogrenciAdi = kapsam === 'sinif'
            ? null
            : (ogrenciler.find((o) => String(o.id) === String(kapsam))?.ad || 'Ogrenci');
        onDurum({ kapsam, ogrenciAdi, matris, donutMetin });
    }, [onDurum, kapsam, ogrenciler, matris, donutMetin]);

    const donutGonder = () => {
        let kocAd = 'Koç';
        try { kocAd = JSON.parse(localStorage.getItem('user_session'))?.name || 'Koç'; } catch { /* oturum yoksa varsayılan */ }
        denemeMotoru.donutYaz({ studentId: kapsam, metin: donutMetin, kocAd });
        /* 05.09: dönüt bildirimsizdi — öğrenci paneli açık değilse koç
           dönütünden haberi olmuyordu. */
        try {
            notify({
                toUserId: kapsam, type: 'feedback',
                title: '🍩 Koçundan dönüt var',
                body: 'Deneme Çöz sekmesinde seni bekliyor.',
                action: { tab: 'deneme-coz' },
            });
        } catch { /* bildirim düşmezse dönüt yine kayıtlı */ }
        setDonutDurum('kaydedildi');
        setTimeout(() => setDonutDurum(''), 2500);
    };

    const zayifKonulariEkle = () => {
        const zayif = (analiz.enZayif || []).slice(0, 6);
        if (!zayif.length) {
            return void setDonutMetin((m) => `${m ? `${m.trim()}\n` : ''}Bu denemede belirgin zayıf konu görünmüyor — tempoyu koru! 👏`);
        }
        const cumle = `Öncelikle çalışman gereken konular: ${zayif.map((k) => `${k.konu} (%${k.isabet})`).join(', ')}.`;
        setDonutMetin((m) => `${m ? `${m.trim()}\n` : ''}${cumle}`);
    };

    // ── Hiç konu-etiketli deneme yoksa: dürüst yönlendirme ──
    if (kayitlar.length === 0) {
        return (
            <div className="rounded-xl border border-line p-5 text-center space-y-2">
                <p className="text-sm font-bold text-ink m-0">Konu-etiketli deneme verisi yok</p>
                <p className="tip-small text-ink-2 m-0 max-w-lg mx-auto">
                    Konu dağılımı için deneme <b>konu etiketli</b> olmalı. <b>Sınav Oluştur</b>'da{' '}
                    <b>Soru Kitapçığı + Cevap Anahtarı</b>'nı birlikte <b>"AI ile Oku"</b> ile yükleyip
                    YENİ deneme oluştur (AI her soruya konu atar). Eski/konusuz denemeler bu listede görünmez.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Deneme filtresi */}
            <div className="flex flex-wrap items-center gap-1.5">
                <span className="tip-mini font-black uppercase tracking-wider text-ink-3 mr-1">Deneme:</span>
                <button onClick={() => setDenemeSecim('hepsi')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${denemeSecim === 'hepsi' ? 'bg-c4 text-white' : 'bg-surface-2 text-ink-2 border border-line hover:border-brand-line'}`}>
                    Tüm Denemeler
                </button>
                {denemeler.map((d) => (
                    <button key={d.id} onClick={() => setDenemeSecim(d.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${denemeSecim === d.id ? 'bg-c4 text-white' : 'bg-surface-2 text-ink-2 border border-line hover:border-brand-line'}`}>
                        {d.ad}
                    </button>
                ))}
            </div>

            {/* Kapsam: sınıf geneli / tek öğrenci */}
            <div className="flex flex-wrap items-center gap-1.5">
                <span className="tip-mini font-black uppercase tracking-wider text-ink-3 mr-1">Kapsam:</span>
                <button onClick={() => setKapsam('sinif')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${kapsam === 'sinif' ? 'bg-brand text-white' : 'bg-surface-2 text-ink-2 border border-line hover:border-brand-line'}`}>
                    Sınıf Geneli
                </button>
                {ogrenciler.map((o) => (
                    <button key={o.id} onClick={() => setKapsam(o.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${String(kapsam) === String(o.id) ? 'bg-brand text-white' : 'bg-surface-2 text-ink-2 border border-line hover:border-brand-line'}`}>
                        {o.ad}
                    </button>
                ))}
            </div>

            {/* KONU × DENEME matrisi — tek öğrenci + Tüm Denemeler */}
            {kapsam !== 'sinif' && denemeSecim === 'hepsi' && matris && (matris.varMi ? (
                <div className="space-y-2">
                    <p className="tip-mini text-ink-3 m-0">
                        Her konunun denemeler boyunca <b>isabet %</b> seyri — önceki eksik konunun
                        sonraki denemelerde ne ölçüde kapatıldığı görülür. Son sütun ilk→son değişimidir.
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-line">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="bg-surface-2">
                                    <th className="text-left font-black text-ink px-2.5 py-2 sticky left-0 bg-surface-2">Konu</th>
                                    {matris.denemeler.map((d) => (
                                        <th key={d.i} className="font-bold text-ink-2 px-2 py-2 text-center whitespace-nowrap" title={d.ad}>D{d.i + 1}</th>
                                    ))}
                                    <th className="font-black text-ink px-2 py-2 text-center">Trend</th>
                                </tr>
                            </thead>
                            <tbody>
                                {matris.satirlar.map((s) => (
                                    <tr key={`${s.ders}-${s.konu}`} className="border-t border-line">
                                        <td className="px-2.5 py-1.5 sticky left-0 bg-surface min-w-0">
                                            <span className="block font-bold text-ink truncate max-w-[160px]" title={`${s.ders} · ${s.konu}`}>{s.konu}</span>
                                            <span className="block tip-mini text-ink-3 truncate">{s.ders}</span>
                                        </td>
                                        {s.seri.map((v, i) => (
                                            <td key={i} className="px-2 py-1.5 text-center font-black" style={{ color: isabetRengi(v) }}>
                                                {v != null ? `%${v}` : '·'}
                                            </td>
                                        ))}
                                        <td className="px-2 py-1.5 text-center font-black whitespace-nowrap"
                                            style={{ color: s.trend == null ? 'var(--ink-3)' : s.trend > 0 ? 'var(--ok)' : s.trend < 0 ? 'var(--danger)' : 'var(--ink-3)' }}>
                                            {s.trend == null ? '—' : `${s.trend > 0 ? '▲' : s.trend < 0 ? '▼' : '='}${s.trend > 0 ? '+' : ''}${s.trend}`}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="tip-mini text-ink-3 m-0">🟢 ≥%75 · 🟡 %50–74 · 🔴 &lt;%50 · ▲ gelişme ▼ gerileme · «·» o denemede o konu yok</p>

                    {matris.simulasyon && matris.simulasyon.kazanc > 0 && (
                        <div className="rounded-xl border p-3"
                            style={{ borderColor: 'color-mix(in srgb, var(--ok) 35%, var(--line))', background: 'color-mix(in srgb, var(--ok) 7%, var(--surface))' }}>
                            <p className="tip-mini font-black uppercase tracking-wider text-ok m-0 mb-1.5 flex items-center gap-1.5">
                                <Lightbulb size={13} /> Simülasyon — Net Potansiyeli
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm text-ink">Son deneme neti <b>{matris.simulasyon.sonNet}</b></span>
                                <span className="text-ink-3">→</span>
                                <span className="text-sm font-black" style={{ color: 'var(--ok)' }}>
                                    zayıf konular düzelirse ~{matris.simulasyon.hedefNet}{' '}
                                    <span className="text-xs">(+{matris.simulasyon.kazanc})</span>
                                </span>
                            </div>
                            <p className="tip-mini text-ink-3 m-0 mt-1">
                                Son denemede isabeti &lt;%60 olan {matris.simulasyon.zayif.length} konudaki{' '}
                                {matris.simulasyon.yanlisTop} yanlış düzelirse tahmini kazanç. Öncelik:{' '}
                                {matris.simulasyon.zayif.map((z) => z.konu).join(', ')}.
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-sm text-ink-3 text-center py-6">Bu öğrencinin konu-etiketli motor-çözümü yok.</p>
            ))}

            {/* Koç Dönütü — tek öğrenci seçiliyken */}
            {kapsam !== 'sinif' && (
                <div className="rounded-xl border border-line p-3 space-y-2"
                    style={{ background: 'color-mix(in srgb, var(--brand) 5%, var(--surface))' }}>
                    <div className="flex items-center justify-between gap-2">
                        <p className="tip-mini font-black uppercase tracking-wider text-brand m-0 flex items-center gap-1.5">
                            <MessageSquare size={13} /> Koç Dönütü
                        </p>
                        {donutDurum === 'kaydedildi' && (
                            <span className="tip-mini font-bold text-ok">Kaydedildi ✓ (öğrenci sonucunda görür)</span>
                        )}
                    </div>
                    <textarea value={donutMetin} onChange={(e) => setDonutMetin(e.target.value)} rows={3}
                        placeholder="Bu öğrenciye özel tavsiye/geri bildirim yaz — öğrenci deneme sonucunda 'Koç Dönütü' olarak görecek. (Boş bırakıp kaydedersen dönüt silinir.)"
                        className="w-full px-3 py-2 rounded-lg border border-line bg-surface text-sm leading-relaxed" />
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={zayifKonulariEkle}
                            className="px-3 h-8 rounded-lg bg-surface-2 border border-brand-line text-brand text-xs font-bold hover:bg-brand-soft transition flex items-center gap-1.5">
                            🎯 Zayıf konuları ekle
                        </button>
                        <button type="button" onClick={donutGonder}
                            className="px-4 h-8 rounded-lg bg-brand text-white text-xs font-bold hover:opacity-90 transition">
                            Öğrenciye Gönder
                        </button>
                    </div>
                </div>
            )}

            {/* Konu dağılımı: en zayıflar + ders tabloları */}
            {!(denemeSecim === 'hepsi' && kapsam !== 'sinif') || analiz.varMi ? (analiz.varMi ? (
                <div className="space-y-4">
                    {analiz.enZayif.length > 0 && (
                        <div>
                            <p className="tip-mini font-black uppercase tracking-wider text-danger mb-2">
                                🔻 En Zayıf Konular{kapsam === 'sinif' ? ' (sınıf geneli)' : ''}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {analiz.enZayif.map((k) => (
                                    <span key={`${k.ders}-${k.konu}`}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                                        style={{
                                            background: 'color-mix(in srgb, var(--danger) 10%, var(--surface))',
                                            color: 'var(--danger)',
                                            border: '1px solid color-mix(in srgb, var(--danger) 28%, var(--line))',
                                        }}>
                                        {k.ders} · {k.konu} <b>%{k.isabet}</b>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {analiz.dersler.map((d) => (
                        <div key={d.ders} className="rounded-xl border border-line overflow-hidden">
                            <div className="flex items-center gap-2 px-3 py-2 bg-surface-2">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.renk }} />
                                <span className="text-sm font-black text-ink flex-1">{d.ders}</span>
                                <span className="tip-mini text-ink-3">{d.konuSayisi} konu · {d.yanlis} yanlış</span>
                            </div>
                            <div>
                                {d.konular.map((k) => (
                                    <div key={k.konu} className="flex items-center gap-3 px-3 py-2 border-t border-line">
                                        <span className="text-xs font-bold text-ink flex-1 min-w-0 truncate" title={k.konu}>{k.konu}</span>
                                        <span className="tip-mini text-ink-3 shrink-0 hidden sm:inline w-28 text-right">
                                            D{k.dogru}·Y{k.yanlis}·B{k.bos}
                                        </span>
                                        <div className="w-20 sm:w-24 h-2 rounded-full bg-surface-3 overflow-hidden shrink-0">
                                            <div className="h-full rounded-full" style={{ width: `${k.isabet ?? 0}%`, background: isabetRengi(k.isabet) }} />
                                        </div>
                                        <span className="tip-mini font-black shrink-0 w-10 text-right" style={{ color: isabetRengi(k.isabet) }}>
                                            {k.isabet != null ? `%${k.isabet}` : '—'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-ink-3 text-center py-6">Bu seçimde konu verisi yok. Farklı bir deneme/öğrenci seçin.</p>
            )) : null}
        </div>
    );
};

export default KonuAnaliziPaneli;
