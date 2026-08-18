/**
 * 📊 Deneme Analizi görünümü (V1.1)
 *
 * Üç mevcut kaynağı tek ekranda birleştirir: denemeler (trend + ders
 * D/Y/B/net), hata defteri (konu hataları, tekrar edenler, hata türleri)
 * ve günlük soru kayıtları (haftalık çözüm/isabet serisi).
 *
 * İki bağlamda aynı bileşen çalışır:
 *  · Öğrenci (bakis="ogrenci"): "Ben nasıl gelişiyorum?"
 *  · Koç (bakis="koc"):        "Bu öğrencinin performansı neden değişiyor?"
 * Veri okuma yolları aynıdır; yalnızca başlık/çerçeve metni değişir.
 *
 * Grafikler projedeki mevcut recharts ile çizilir — yeni kütüphane yok.
 */
import React, { useMemo, useState } from 'react';
import {
    ResponsiveContainer, LineChart, Line, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Target, AlertCircle, BarChart2 } from 'lucide-react';
import { listeOku } from '../../services/veriDeposu';
import {
    ogrencininDenemeleri, dersOzeti, trendSerisi,
    gucluZayifAnalizi, konuHatalari, calismaOncelikleri, gunlukSeri,
} from '../../utils/denemeAnalizi';

const TUR_ADI = {
    knowledge: 'Bilgi Eksiği', misread: 'Soruyu Yanlış Okuma',
    time: 'Zaman Yetmedi', calculation: 'İşlem Hatası', careless: 'Dikkatsizlik',
};

const Rozet = ({ renk, children }) => (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: `color-mix(in srgb, ${renk} 12%, transparent)`, color: renk }}>
        {children}
    </span>
);

const Bolum = ({ baslik, ikon: Ikon, children }) => (
    <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5">
        <h4 className="tip-h4 flex items-center gap-2 mb-3">
            {Ikon && <Ikon size={16} className="text-brand" />} {baslik}
        </h4>
        {children}
    </div>
);

export default function DenemeAnalizi({ ogrenci, studentId, bakis = 'ogrenci', sinavTuru = 'all' }) {
    const [tur, setTur] = useState(sinavTuru);

    const v2Results = useMemo(() => listeOku('v2_results_data'), []);
    const hatalar = useMemo(
        () => listeOku('error_notebook').filter((h) => String(h.studentId) === String(studentId)),
        [studentId]
    );
    const gunlukler = useMemo(
        () => listeOku('study_log').filter((g) => String(g.studentId) === String(studentId)),
        [studentId]
    );

    const denemeler = useMemo(
        () => ogrencininDenemeleri(v2Results, ogrenci?.name, tur),
        [v2Results, ogrenci?.name, tur]
    );
    const seri = useMemo(() => trendSerisi(denemeler), [denemeler]);
    const dersler = useMemo(() => dersOzeti(denemeler), [denemeler]);
    const guc = useMemo(() => gucluZayifAnalizi(denemeler), [denemeler]);
    const konu = useMemo(() => konuHatalari(hatalar), [hatalar]);
    const oncelik = useMemo(() => calismaOncelikleri(denemeler, hatalar), [denemeler, hatalar]);
    const haftalik = useMemo(() => gunlukSeri(gunlukler), [gunlukler]);

    const sonDegisim = seri.length >= 2
        ? +(seri[seri.length - 1].toplamNet - seri[seri.length - 2].toplamNet).toFixed(2)
        : null;

    const hicVeriYok = !denemeler.length && !hatalar.length && !haftalik.length;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="tip-h3 flex items-center gap-2">
                        <BarChart2 size={20} className="text-brand" /> Deneme Analizi
                    </h3>
                    <p className="tip-caption mt-0.5">
                        {bakis === 'koc'
                            ? 'Bu öğrencinin performansı neden değişiyor?'
                            : 'Ben nasıl gelişiyorum?'}
                    </p>
                </div>
                <select
                    value={tur}
                    onChange={(e) => setTur(e.target.value)}
                    aria-label="Sınav türü"
                    className="bg-surface border border-line rounded-xl px-3 py-2 text-sm text-ink"
                >
                    <option value="all">Tüm denemeler</option>
                    <option value="TYT">TYT</option>
                    <option value="AYT">AYT</option>
                </select>
            </div>

            {hicVeriYok && (
                <div className="text-center py-12 text-ink-3 border border-dashed border-line rounded-2xl">
                    <BarChart2 size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">Henüz analiz edilecek veri yok — deneme sonucu, hata kaydı veya günlük kayıt girildikçe burası dolar.</p>
                </div>
            )}

            {/* ── Net trendi ─────────────────────────────────────── */}
            {seri.length >= 2 && (
                <Bolum baslik={`Net Gelişimi (${seri.length} deneme)`} ikon={TrendingUp}>
                    {sonDegisim !== null && (
                        <p className="tip-caption mb-2">
                            Son denemede önceki denemeye göre{' '}
                            <strong style={{ color: sonDegisim >= 0 ? 'var(--ok)' : 'var(--danger)' }}>
                                {sonDegisim >= 0 ? `+${sonDegisim}` : sonDegisim} net
                            </strong>.
                        </p>
                    )}
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={seri} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                                <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
                                <XAxis dataKey="tarih" tick={{ fill: 'var(--ink-3)', fontSize: 11 }} />
                                <YAxis tick={{ fill: 'var(--ink-3)', fontSize: 11 }} />
                                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12 }} />
                                <Line type="monotone" dataKey="toplamNet" name="Toplam Net" stroke="var(--brand)" strokeWidth={2.5} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Bolum>
            )}

            {/* ── Ders bazlı D/Y/B/net ───────────────────────────── */}
            {dersler.length > 0 && (
                <Bolum baslik="Son Deneme — Ders Dökümü" ikon={Target}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-ink-3 text-xs uppercase tracking-wider">
                                    <th className="py-2 pr-3">Ders</th>
                                    <th className="py-2 pr-3 text-right">D</th>
                                    <th className="py-2 pr-3 text-right">Y</th>
                                    <th className="py-2 pr-3 text-right">B</th>
                                    <th className="py-2 pr-3 text-right">Net</th>
                                    <th className="py-2 text-right">Ort. Net</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {dersler.map((d) => (
                                    <tr key={d.anahtar}>
                                        <td className="py-2 pr-3 font-bold text-ink">{d.ad}</td>
                                        <td className="py-2 pr-3 text-right" style={{ color: 'var(--ok)' }}>{d.son?.dogru ?? '—'}</td>
                                        <td className="py-2 pr-3 text-right" style={{ color: 'var(--danger)' }}>{d.son?.yanlis ?? '—'}</td>
                                        <td className="py-2 pr-3 text-right text-ink-3">{d.son?.bos ?? '—'}</td>
                                        <td className="py-2 pr-3 text-right font-black text-ink">{d.son?.net ?? '—'}</td>
                                        <td className="py-2 text-right text-ink-2">{d.ortalamaNet}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Bolum>
            )}

            {/* ── Güçlü / zayıf / gelişen / gerileyen ────────────── */}
            {(guc.guclu.length > 0 || guc.gelisen.length > 0 || guc.gerileyen.length > 0) && (
                <Bolum baslik="Güçlü ve Gelişime Açık Alanlar" ikon={TrendingUp}>
                    <div className="flex flex-wrap gap-2">
                        {guc.guclu.map((d) => <Rozet key={`g${d.anahtar}`} renk="var(--ok)">💪 {d.ad} · ort {d.ortalamaNet}</Rozet>)}
                        {guc.zayif.map((d) => <Rozet key={`z${d.anahtar}`} renk="var(--danger)">🎯 {d.ad} · ort {d.ortalamaNet}</Rozet>)}
                        {guc.gelisen.map((d) => <Rozet key={`+${d.anahtar}`} renk="var(--info)">📈 {d.ad} +{d.degisim}</Rozet>)}
                        {guc.gerileyen.map((d) => <Rozet key={`-${d.anahtar}`} renk="var(--warn)">📉 {d.ad} {d.degisim}</Rozet>)}
                    </div>
                </Bolum>
            )}

            {/* ── Konu hataları ──────────────────────────────────── */}
            {konu.konular.length > 0 && (
                <Bolum baslik="Hata Defterinden Konu Analizi" ikon={AlertCircle}>
                    <div className="space-y-1.5">
                        {konu.konular.slice(0, 8).map((k) => (
                            <div key={`${k.ders}|${k.konu}`} className="flex items-center justify-between text-sm">
                                <span className="text-ink font-medium truncate">
                                    {k.ders} · {k.konu}
                                    {k.sayi >= 2 && <span className="ml-2 text-xs font-bold" style={{ color: 'var(--warn)' }}>tekrar eden</span>}
                                </span>
                                <span className="text-ink-2 font-bold shrink-0 ml-3">{k.sayi} hata{k.cozulen ? ` · ${k.cozulen} çözüldü` : ''}</span>
                            </div>
                        ))}
                    </div>
                    {konu.turDagilimi.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-line">
                            {konu.turDagilimi.map((t) => (
                                <Rozet key={t.tur} renk="var(--ink-3)">{TUR_ADI[t.tur] || t.tur}: {t.adet}</Rozet>
                            ))}
                        </div>
                    )}
                </Bolum>
            )}

            {/* ── Haftalık çözüm serisi ──────────────────────────── */}
            {haftalik.length >= 2 && (
                <Bolum baslik="Haftalık Soru Çözümü" ikon={TrendingDown}>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={haftalik} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                                <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
                                <XAxis dataKey="etiket" tick={{ fill: 'var(--ink-3)', fontSize: 11 }} />
                                <YAxis tick={{ fill: 'var(--ink-3)', fontSize: 11 }} />
                                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12 }} />
                                <Legend />
                                <Area type="monotone" dataKey="cozulen" name="Çözülen" stroke="var(--brand)" fill="var(--brand)" fillOpacity={0.15} strokeWidth={2} />
                                <Area type="monotone" dataKey="yanlis" name="Yanlış" stroke="var(--danger)" fill="var(--danger)" fillOpacity={0.1} strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Bolum>
            )}

            {/* ── Çalışma öncelikleri ────────────────────────────── */}
            {oncelik.length > 0 && (
                <Bolum baslik="Çalışma Öncelikleri" ikon={Target}>
                    <ol className="space-y-2">
                        {oncelik.map((o, i) => (
                            <li key={`${o.tur}-${o.baslik}`} className="flex items-start gap-3 text-sm">
                                <span className="shrink-0 w-6 h-6 rounded-lg bg-brand-soft text-brand flex items-center justify-center text-xs font-black">{i + 1}</span>
                                <div>
                                    <p className="font-bold text-ink">{o.baslik}</p>
                                    <p className="text-xs text-ink-3">{o.sebep}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </Bolum>
            )}
        </div>
    );
}
