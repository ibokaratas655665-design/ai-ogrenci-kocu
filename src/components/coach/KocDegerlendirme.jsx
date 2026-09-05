/**
 * 🧑‍🏫 KOÇ DEĞERLENDİRME EKRANLARI (Günlük Kayıt · Hata Defteri · Deneme)
 *
 * YENİ MEKANİZMA — NEDEN ZORUNLU?
 * Öğrencinin girdiği günlük kayıt / hata defteri / deneme analizi verisi
 * senkronla koçun cihazına İNİYORDU ama koç panelinde bu veriyi
 * DEĞERLENDİREN hiçbir ekran yoktu (yalnızca öğrenci detayının Akademik
 * sekmesinde deneme analizi vardı). "Veri koça ulaşmıyor" şikâyetinin
 * kök nedenlerinden biri bu görünürlük boşluğu. Bu bileşen üç
 * değerlendirme tabını TEK gövdede toplar; veri modeli değişmez, yeni
 * veri üretmez, yalnızca mevcut anahtarları okur.
 *
 * Öğrenci ekranlarının KOPYASI değildir: koç seçtiği öğrencinin zaman
 * içindeki değişimini görür (haftalık seriler, ders dağılımı, tekrar
 * eden hatalar, öğrencinin kendi açıklamaları).
 */
import React, { useMemo, useState } from 'react';
import {
    ResponsiveContainer, LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { PencilLine, BookX, ChevronDown } from 'lucide-react';
import { listeOku } from '../../services/veriDeposu';
import { gunlukSeri, gunlukDersDagilimi, hataTrendi, konuHatalari } from '../../utils/denemeAnalizi';
import DenemeAnalizi from '../student/DenemeAnalizi';
import { hataTuruAdi } from '../../data/hataTurleri';

/* Hata türü adları data/hataTurleri'nden — bkz. o dosyadaki not. */

const Kart = ({ baslik, deger, altyazi }) => (
    <div className="bg-surface border border-line rounded-2xl p-3">
        <p className="tip-label text-ink-3">{baslik}</p>
        <p className="text-lg font-black text-ink mt-0.5">{deger}</p>
        {altyazi && <p className="text-xs text-ink-3">{altyazi}</p>}
    </div>
);

const Bolum = ({ baslik, children }) => (
    <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5">
        <h4 className="tip-h4 mb-3">{baslik}</h4>
        {children}
    </div>
);

const GRAFIK_STIL = { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12 };

/** Öğrenci seçici — üç değerlendirme tabının ortak başlığı. */
const OgrenciSecici = ({ students, secili, onSec }) => (
    <div className="relative inline-block">
        <select
            value={secili?.id ?? ''}
            onChange={(e) => onSec(students.find((s) => String(s.id) === e.target.value) || null)}
            aria-label="Öğrenci seç"
            className="appearance-none bg-surface border border-line rounded-xl pl-3 pr-9 py-2 text-sm font-bold text-ink focus:outline-none focus:border-brand/40"
        >
            <option value="">— Öğrenci seç —</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3" />
    </div>
);

const BosDurumMesaji = ({ metin }) => (
    <div className="text-center py-12 text-ink-3 border border-dashed border-line rounded-2xl">
        <p className="text-sm font-medium">{metin}</p>
    </div>
);

export default function KocDegerlendirme({ students = [], tur }) {
    const [secili, setSecili] = useState(students.length === 1 ? students[0] : null);
    const kimlik = String(secili?.id ?? '');

    /* 05.09 denetimi: öğrenci kayıt girdiğinde koçun açık ekranı
       tazelenmiyordu — buluttan/aynı cihazdan gelen storage olayı
       dinlenip veriler yeniden okunur. */
    const [tazelik, setTazelik] = useState(0);
    React.useEffect(() => {
        const dinle = (e) => {
            if (!e?.key || ['study_log', 'error_notebook', 'deneme_analizleri'].includes(e.key)) {
                setTazelik((t) => t + 1);
            }
        };
        window.addEventListener('storage', dinle);
        return () => window.removeEventListener('storage', dinle);
    }, []);

    const gunlukler = useMemo(
        () => (kimlik ? listeOku('study_log').filter((g) => String(g.studentId) === kimlik) : []),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [kimlik, tazelik]
    );
    const hatalar = useMemo(
        () => (kimlik ? listeOku('error_notebook').filter((h) => String(h.studentId) === kimlik) : []),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [kimlik, tazelik]
    );

    const haftalik = useMemo(() => gunlukSeri(gunlukler), [gunlukler]);
    const dersDagilimi = useMemo(() => gunlukDersDagilimi(gunlukler), [gunlukler]);
    const hTrend = useMemo(() => hataTrendi(hatalar), [hatalar]);
    const konu = useMemo(() => konuHatalari(hatalar), [hatalar]);

    /* Haftalar arası değişim: son hafta − önceki hafta (çözülen soru) */
    const haftaDegisim = haftalik.length >= 2
        ? haftalik[haftalik.length - 1].cozulen - haftalik[haftalik.length - 2].cozulen
        : null;
    const hataDegisim = hTrend.length >= 2
        ? hTrend[hTrend.length - 1].adet - hTrend[hTrend.length - 2].adet
        : null;

    const baslik = tur === 'gunluk' ? 'Günlük Kayıt Değerlendirmesi'
        : tur === 'hata' ? 'Hata Defteri Değerlendirmesi'
        : 'Deneme Analizi Değerlendirmesi';
    const Ikon = tur === 'gunluk' ? PencilLine : BookX;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="tip-h3 flex items-center gap-2">
                        <Ikon size={20} className="text-brand" /> {baslik}
                    </h3>
                    <p className="tip-caption mt-0.5">Öğrencinin girdiği kayıtların zaman içindeki değişimi.</p>
                </div>
                <OgrenciSecici students={students} secili={secili} onSec={setSecili} />
            </div>

            {!secili && <BosDurumMesaji metin="Değerlendirmek için yukarıdan bir öğrenci seçin." />}

            {/* ── DENEME: öğrenci detayındaki koç analizi burada da ── */}
            {secili && tur === 'deneme' && (
                <DenemeAnalizi ogrenci={secili} studentId={secili.id} bakis="koc" />
            )}

            {/* ── GÜNLÜK KAYIT ─────────────────────────────────── */}
            {secili && tur === 'gunluk' && (
                gunlukler.length === 0 ? (
                    <BosDurumMesaji metin={`${secili.name} henüz günlük kayıt girmemiş. Kayıtlar telefondan girildikçe burada birikir.`} />
                ) : (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <Kart baslik="Toplam kayıt" deger={gunlukler.length} />
                            <Kart baslik="Bu hafta çözülen" deger={haftalik.length ? haftalik[haftalik.length - 1].cozulen : 0}
                                altyazi={haftaDegisim !== null ? (haftaDegisim >= 0 ? `önceki haftadan +${haftaDegisim}` : `önceki haftadan ${haftaDegisim}`) : undefined} />
                            <Kart baslik="İsabet (son hafta)" deger={haftalik.length && haftalik[haftalik.length - 1].isabet !== null ? `%${haftalik[haftalik.length - 1].isabet}` : '—'} />
                            <Kart baslik="En çok çalışılan" deger={dersDagilimi[0]?.ders || '—'}
                                altyazi={dersDagilimi[0] ? `${dersDagilimi[0].cozulen} soru` : undefined} />
                        </div>

                        {haftalik.length >= 2 && (
                            <Bolum baslik="Haftalık Soru Çözümü ve Yanlış Değişimi">
                                {haftaDegisim !== null && haftaDegisim < 0 && (
                                    <p className="text-xs font-bold mb-2" style={{ color: 'var(--warn)' }}>
                                        ⚠️ Son hafta çözüm {Math.abs(haftaDegisim)} soru azaldı — belirgin düşüş.
                                    </p>
                                )}
                                <div className="h-52">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={haftalik} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                                            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
                                            <XAxis dataKey="etiket" tick={{ fill: 'var(--ink-3)', fontSize: 11 }} />
                                            <YAxis tick={{ fill: 'var(--ink-3)', fontSize: 11 }} />
                                            <Tooltip contentStyle={GRAFIK_STIL} />
                                            <Legend />
                                            <Line type="monotone" dataKey="cozulen" name="Çözülen" stroke="var(--brand)" strokeWidth={2} dot={{ r: 3 }} />
                                            <Line type="monotone" dataKey="yanlis" name="Yanlış" stroke="var(--danger)" strokeWidth={2} dot={{ r: 3 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </Bolum>
                        )}

                        <Bolum baslik="Ders Dağılımı">
                            <div className="h-52">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dersDagilimi} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                                        <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
                                        <XAxis dataKey="ders" tick={{ fill: 'var(--ink-3)', fontSize: 11 }} />
                                        <YAxis tick={{ fill: 'var(--ink-3)', fontSize: 11 }} />
                                        <Tooltip contentStyle={GRAFIK_STIL} />
                                        <Legend />
                                        <Bar dataKey="dogru" name="Doğru" fill="var(--ok)" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="yanlis" name="Yanlış" fill="var(--danger)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-2 space-y-1">
                                {dersDagilimi.map((d) => (
                                    <p key={d.ders} className="text-xs text-ink-3">
                                        <strong className="text-ink">{d.ders}</strong>: {d.cozulen} soru{d.isabet !== null ? ` · %${d.isabet} isabet` : ''}
                                    </p>
                                ))}
                            </div>
                        </Bolum>
                    </>
                )
            )}

            {/* ── HATA DEFTERİ ─────────────────────────────────── */}
            {secili && tur === 'hata' && (
                hatalar.length === 0 ? (
                    <BosDurumMesaji metin={`${secili.name} henüz hata kaydı girmemiş.`} />
                ) : (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <Kart baslik="Toplam hata kaydı" deger={hatalar.length} />
                            <Kart baslik="Öğrenildi" deger={hatalar.filter((h) => h.mastered).length} />
                            <Kart baslik="Tekrar eden konu" deger={konu.tekrarEden.length} />
                            <Kart baslik="Bu hafta" deger={hTrend.length ? hTrend[hTrend.length - 1].adet : 0}
                                altyazi={hataDegisim !== null ? (hataDegisim <= 0 ? `önceki haftadan ${hataDegisim}` : `önceki haftadan +${hataDegisim} ⚠️`) : undefined} />
                        </div>

                        {hTrend.length >= 2 && (
                            <Bolum baslik="Hata Sayısının Zaman İçindeki Değişimi">
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={hTrend} margin={{ top: 4, right: 8, bottom: 0, left: -22 }}>
                                            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
                                            <XAxis dataKey="etiket" tick={{ fill: 'var(--ink-3)', fontSize: 11 }} />
                                            <YAxis allowDecimals={false} tick={{ fill: 'var(--ink-3)', fontSize: 11 }} />
                                            <Tooltip contentStyle={GRAFIK_STIL} />
                                            <Legend />
                                            <Line type="monotone" dataKey="adet" name="Yeni hata" stroke="var(--danger)" strokeWidth={2} dot={{ r: 3 }} />
                                            <Line type="monotone" dataKey="cozulen" name="Öğrenilen" stroke="var(--ok)" strokeWidth={2} dot={{ r: 3 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </Bolum>
                        )}

                        <Bolum baslik="Ders / Konu Yoğunluğu">
                            <div className="space-y-1.5">
                                {konu.konular.slice(0, 10).map((k) => (
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
                                        <span key={t.tur} className="px-2.5 py-1 rounded-full text-xs font-bold bg-surface-3 text-ink-2">
                                            {hataTuruAdi(t.tur)}: {t.adet}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </Bolum>

                        {/* Öğrencinin kendi açıklamaları — koç ham sesi duysun */}
                        {hatalar.some((h) => h.note || h.correctApproach) && (
                            <Bolum baslik="Öğrencinin Kendi Açıklamaları">
                                <div className="space-y-2">
                                    {hatalar.filter((h) => h.note || h.correctApproach).slice(0, 8).map((h) => (
                                        <div key={h.id} className="border border-line rounded-xl p-3 bg-surface-2/40">
                                            <p className="text-xs font-bold text-ink">{h.subject} · {h.topic}</p>
                                            {h.note && <p className="text-xs text-ink-2 mt-1">“{h.note}”</p>}
                                            {h.correctApproach && <p className="text-xs text-ink-3 mt-1">Doğru yaklaşım: {h.correctApproach}</p>}
                                        </div>
                                    ))}
                                </div>
                            </Bolum>
                        )}
                    </>
                )
            )}
        </div>
    );
}
