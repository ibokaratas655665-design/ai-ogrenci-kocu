/**
 * 📈 GELİŞİM PANOSU — öğrenci
 *
 * Öz düzenlemeli öğrenmenin DEĞERLENDİRME ayağı: "ne yaptım, işe
 * yaradı mı?" Hazırlık ayağı BUGÜN, performans ayağı PROGRAM ve
 * ÇALIŞMALARIM ekranlarındadır.
 *
 * ── BU EKRANIN KURALLARI ───────────────────────────────────────
 * 1. Bütün karşılaştırmalar ÖĞRENCİNİN KENDİ GEÇMİŞİYLEDİR.
 *    Sınıf ortalaması, sıralama, akran kıyası burada YOKTUR —
 *    bunlar koç panelinde, karar desteği olarak durur.
 * 2. Her sayı bir cümleyle gelir; yorumsuz grafik bilişsel yüktür.
 * 3. Veri yoksa sıfır değil sebep yazar.
 * 4. Motivasyon yalnızca gerçekten olmuş bir şeyi anlatır.
 *
 * Bu bileşen VERİ YAZMAZ. Program motoruna, çizelgeye ve etüt
 * tamamlama kayıtlarına yalnızca okuma amaçlı erişir.
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
    Target, BookOpenCheck, Flame, TrendingUp, ClipboardList, AlertCircle,
} from 'lucide-react';
import Grafik from '../charts/Grafik';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
    ResponsiveContainer, Cell,
} from 'recharts';
import {
    OlcumKarti, UyumHalkasi, IsiHaritasi, DersCubuklari,
    GelisimZinciri, MotivasyonSeridi, Yorum, VeriYok,
} from '../charts/Analitik';
import { SegmentliSecim } from '../ui/Gelisim';
import {
    calismaOzeti, gunlukSeri, istikrar, programUyumu, uyumSerisi,
    netTrendi, hataOzeti, gelisimZinciri, yorumla, motivasyon,
} from '../../services/gelisimAnalitik';
import { hucreTarihi, programBaslangici } from '../../services/programProgressService';
import { izgaraOzellikleri, eksenOzellikleri, ANLAM_RENKLERI } from '../charts/grafikTemasi';

const PENCERELER = [
    { id: 7, etiket: '7 gün' },
    { id: 30, etiket: '30 gün' },
    { id: 90, etiket: '90 gün' },
];

/** Grafik ipucu kutusu — tema renkleriyle. */
const Ipucu = ({ active, payload, label, birim = '' }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-surface border border-line rounded-dsm shadow-lg px-3 py-2">
            <p className="tip-mini font-bold text-ink-2 m-0 mb-0.5">{label}</p>
            {payload.map((p) => (
                <p key={p.dataKey} className="tip-small font-bold m-0" style={{ color: p.color }}>
                    {p.name}: {p.value}{birim}
                </p>
            ))}
        </div>
    );
};

export default function GelisimPanosu({ user }) {
    const studentId = user?.id;
    const [gun, setGun] = useState(30);
    const [surum, setSurum] = useState(0);

    // Kayıt değişince yeniden hesapla — veri yazmayız, yalnızca dinleriz
    useEffect(() => {
        const yenile = () => setSurum((s) => s + 1);
        const olaylar = ['storage', 'study-log-updated', 'topic-progress-updated', 'program-progress-updated'];
        olaylar.forEach((o) => window.addEventListener(o, yenile));
        return () => olaylar.forEach((o) => window.removeEventListener(o, yenile));
    }, []);

    /**
     * Hücre anahtarını takvime çeviren çözücü. Program servisinin
     * kendi mantığı kullanılır — burada ikinci bir tarih kuralı
     * TANIMLANMAZ, yoksa iki yerde iki farklı takvim oluşurdu.
     */
    const tarihCoz = useMemo(() => {
        if (!studentId) return null;
        const baslangic = programBaslangici(studentId);
        if (!baslangic) return null;
        return (cellKey) => hucreTarihi(cellKey, baslangic);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentId, surum]);

    const olcumler = useMemo(() => {
        if (!studentId) return null;
        const calisma = calismaOzeti(studentId, gun);
        const ist = istikrar(studentId, Math.min(gun, 56));
        const uyum = programUyumu(studentId, { tarihCoz, gun });
        const net = netTrendi(studentId, user?.name);
        const hata = hataOzeti(studentId, gun);
        return {
            calisma, ist, uyum, net, hata,
            seri: gunlukSeri(studentId, Math.min(gun, 56)),
            uyumSeri: uyumSerisi(studentId, { tarihCoz, hafta: 6 }),
            zincir: gelisimZinciri(studentId, user?.name, { tarihCoz, gun }),
            motivasyon: motivasyon({ uyum, calisma, net, istikrar: ist }),
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentId, user?.name, gun, tarihCoz, surum]);

    if (!studentId || !olcumler) {
        return <VeriYok metin="Öğrenci bilgisi yüklenemedi." />;
    }

    const { calisma, ist, uyum, net, hata, seri, uyumSeri, zincir } = olcumler;
    const renkler = ANLAM_RENKLERI();
    const izgara = izgaraOzellikleri();
    const eksen = eksenOzellikleri();

    const netYorum = yorumla('net', net);
    const uyumYorum = yorumla('programUyumu', uyum);
    const calismaYorum = yorumla('calisma', calisma);
    const istYorum = yorumla('istikrar', ist);
    const hataYorum = yorumla('hata', hata);

    return (
        <div className="space-y-6">

            {/* ══ Pencere seçimi ══════════════════════════════════ */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h2 className="tip-h4 m-0">Gelişim Panom</h2>
                    <p className="tip-caption m-0 mt-0.5">Kendi geçmişinle karşılaştırma</p>
                </div>
                <SegmentliSecim
                    ogeler={PENCERELER}
                    deger={gun}
                    onSec={setGun}
                    etiket="Zaman aralığı"
                />
            </div>

            {/* ══ Motivasyon — yalnızca gerçek başarı varsa ═══════ */}
            <MotivasyonSeridi metin={olcumler.motivasyon} />

            {/* ══ 1. ÖLÇÜMLER ════════════════════════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <OlcumKarti
                    etiket="Program Uyumu" simge={Target} ton="marka"
                    veri={uyum.veri} sebep={uyum.sebep}
                    deger={uyum.oran ?? '—'} birim="%"
                    alt={uyum.veri ? `${uyum.tamamlanan}/${uyum.planlanan} etüt · ${uyum.bekleyen} bekliyor` : null}
                />
                <OlcumKarti
                    etiket="Çözülen Soru" simge={BookOpenCheck} ton="mor"
                    veri={calisma.veri} sebep="calisma-yok"
                    deger={calisma.soru} degisim={calisma.soruDegisim}
                    alt={calisma.isabet !== null ? `İsabet %${calisma.isabet}` : `Son ${gun} gün`}
                />
                <OlcumKarti
                    etiket="Çalışma İstikrarı" simge={Flame} ton="uyari"
                    veri={ist.veri} sebep="calisma-yok"
                    deger={ist.aktifGun} birim={` / ${ist.gun} gün`}
                    alt={ist.guncelZincir > 0 ? `${ist.guncelZincir} gündür aralıksız` : `En uzun seri ${ist.enUzunZincir} gün`}
                />
                <OlcumKarti
                    etiket="Son Net" simge={TrendingUp} ton="iyi"
                    veri={net.veri} sebep={net.sebep}
                    deger={net.sonNet ?? '—'}
                    degisim={net.degisim} degisimBirimi=" net"
                    alt={`${net.adet} deneme kayıtlı`}
                />
            </div>

            {/* ══ 2. GELİŞİM ZİNCİRİ ═════════════════════════════ */}
            <div className="srf p-4 sm:p-5">
                <h3 className="tip-h4 m-0 mb-1">Çalışmam sonuç veriyor mu?</h3>
                <p className="tip-caption m-0 mb-3">
                    Program → çalışma → deneme → net zinciri
                </p>
                <GelisimZinciri zincir={zincir} />
            </div>

            {/* ══ 3. PROGRAM UYUMU ═══════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="srf p-4 sm:p-5 flex flex-col gap-4">
                    <div>
                        <h3 className="tip-h4 m-0">Programıma ne kadar uyuyorum?</h3>
                        <p className="tip-caption m-0 mt-0.5">
                            Yalnızca günü gelmiş etütler sayılır
                        </p>
                    </div>
                    {uyum.veri ? (
                        <>
                            <div className="flex flex-col sm:flex-row items-center gap-5">
                                <UyumHalkasi
                                    oran={uyum.oran}
                                    planlanan={uyum.planlanan}
                                    tamamlanan={uyum.tamamlanan}
                                />
                                <div className="flex-1 w-full min-w-0">
                                    <DersCubuklari dersler={uyum.dersler} />
                                </div>
                            </div>
                            {uyumYorum && <Yorum ton={uyumYorum.ton}>{uyumYorum.metin}</Yorum>}
                        </>
                    ) : (
                        <VeriYok
                            sebep={uyum.sebep}
                            ipucu="Koçun program oluşturduğunda uyum oranın burada görünecek."
                        />
                    )}
                </div>

                <Grafik
                    baslik="Haftalık program uyumu"
                    aciklama="Her hafta planının yüzde kaçını tamamladın"
                    boy="normal"
                    veriVar={uyumSeri.length >= 2}
                    bosBaslik="Uyum eğilimi için yeterli hafta yok"
                    bosAciklama="En az iki haftalık program verisi gerekiyor."
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={uyumSeri} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
                            <CartesianGrid {...izgara} />
                            <XAxis dataKey="etiket" {...eksen} />
                            <YAxis domain={[0, 100]} {...eksen} />
                            <Tooltip content={<Ipucu birim="%" />} cursor={{ fill: 'var(--surface-2)' }} />
                            <Bar dataKey="oran" name="Uyum" radius={[5, 5, 0, 0]}>
                                {uyumSeri.map((d, i) => (
                                    <Cell key={i} fill={
                                        d.oran >= 80 ? renkler.iyi : d.oran >= 60 ? renkler.uyari : renkler.kotu
                                    } />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Grafik>
            </div>

            {/* ══ 4. ÇALIŞMA İSTİKRARI ═══════════════════════════ */}
            <div className="srf p-4 sm:p-5 flex flex-col gap-4">
                <div>
                    <h3 className="tip-h4 m-0">Ne kadar düzenli çalışıyorum?</h3>
                    <p className="tip-caption m-0 mt-0.5">
                        Her kare bir gün · koyu renk daha çok soru
                    </p>
                </div>
                <IsiHaritasi seri={seri} alan="soru" />
                {istYorum && <Yorum ton={istYorum.ton}>{istYorum.metin}</Yorum>}
            </div>

            {/* ══ 5. NET TRENDİ ══════════════════════════════════ */}
            <Grafik
                baslik="Net gelişimim"
                aciklama="Kayıtlı denemelerinin toplam neti"
                boy="normal"
                veriVar={net.veri && net.adet >= 2}
                bosBaslik={net.adet === 1 ? 'Trend için bir deneme yetmiyor' : 'Henüz deneme kaydın yok'}
                bosAciklama={
                    net.adet === 1
                        ? 'İkinci denemeni girdiğinde değişimi burada göreceksin.'
                        : 'Deneme Analizi ekranından ilk denemeni ekleyebilirsin.'
                }
            >
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={net.seri} margin={{ top: 6, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid {...izgara} />
                        <XAxis dataKey="kisaAd" {...eksen} />
                        <YAxis {...eksen} />
                        <Tooltip content={<Ipucu birim=" net" />} />
                        <Line
                            type="monotone" dataKey="net" name="Net"
                            stroke="var(--brand)" strokeWidth={2.5}
                            dot={{ r: 3.5, fill: 'var(--brand)' }}
                            activeDot={{ r: 5.5 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Grafik>
            {netYorum && <Yorum ton={netYorum.ton}>{netYorum.metin}</Yorum>}

            {/* ══ 6. ÇALIŞMA VE HATA ═════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Grafik
                    baslik="Günlük soru çözümüm"
                    aciklama={`Son ${Math.min(gun, 56)} gün`}
                    boy="kisa"
                    veriVar={calisma.veri}
                    bosBaslik="Çalışma kaydın yok"
                    bosAciklama="Günlük Kayıt ekranından çözdüğün soruları girebilirsin."
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={seri} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                            <CartesianGrid {...izgara} />
                            <XAxis dataKey="gunAdi" {...eksen} interval="preserveStartEnd" />
                            <YAxis {...eksen} />
                            <Tooltip content={<Ipucu birim=" soru" />} cursor={{ fill: 'var(--surface-2)' }} />
                            <Bar dataKey="soru" name="Soru" fill="var(--brand)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Grafik>

                <div className="srf p-4 sm:p-5 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="text-warn" />
                        <h3 className="tip-h4 m-0">En çok nerede hata yapıyorum?</h3>
                    </div>
                    {hata.veri ? (
                        <>
                            <div className="flex flex-col gap-2">
                                {hata.derslere.slice(0, 5).map((d) => (
                                    <div key={d.ad} className="flex items-center gap-3">
                                        <span className="tip-small text-ink-2 w-[92px] shrink-0 truncate">{d.ad}</span>
                                        <div className="flex-1 h-2 rounded-full bg-surface-3 overflow-hidden min-w-[50px]">
                                            <div className="h-full rounded-full bg-warn transition-all duration-yavas"
                                                style={{ width: `${d.oran ?? 0}%` }} />
                                        </div>
                                        <span className="tip-mini font-bold text-ink-2 tabular-nums w-[34px] text-right shrink-0">
                                            {d.adet}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {hataYorum && <Yorum ton={hataYorum.ton}>{hataYorum.metin}</Yorum>}
                        </>
                    ) : (
                        <VeriYok
                            sebep="hata-kaydi-yok"
                            ipucu="Hata Defteri'ne kayıt girdikçe zayıf alanların burada belirginleşir."
                        />
                    )}
                </div>
            </div>

            {calismaYorum && <Yorum ton={calismaYorum.ton}>{calismaYorum.metin}</Yorum>}

            {/* ══ Kaynak notu — şeffaflık ════════════════════════ */}
            <p className="tip-mini text-ink-3 flex items-start gap-1.5 px-1">
                <ClipboardList size={12} className="shrink-0 mt-0.5" />
                Buradaki bütün sayılar senin girdiğin kayıtlardan ve koçunun programından
                anlık hesaplanır. Karşılaştırmalar kendi önceki dönemine göredir.
            </p>
        </div>
    );
}
