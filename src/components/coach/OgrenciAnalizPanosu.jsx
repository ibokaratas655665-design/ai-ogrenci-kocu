/**
 * 🔬 ÖĞRENCİ ANALİZ PANOSU — koç
 *
 * Öğrenci panosunun büyütülmüş hâli DEĞİLDİR.
 *
 *   ÖĞRENCİ  → gelişim + motivasyon (az ama anlamlı veri)
 *   KOÇ      → veri + analiz + karar desteği (ayrıntı ve gerekçe)
 *
 * Bu yüzden burada öğrencide bilinçli olarak GÖSTERİLMEYEN şeyler var:
 * risk sinyalleri, ders bazlı gerekçe kırılımı, ham sayılar. Buna
 * karşılık motivasyon şeridi burada YOKTUR — koçun karara ihtiyacı var,
 * cesaretlendirmeye değil.
 *
 * Akran/sınıf kıyası yalnızca burada anlamlıdır: koç için bir karar
 * girdisi, öğrenci için kaygı kaynağı olurdu.
 *
 * ⚠️ VERİ YAZMAZ. Program çizelgesine, etüt tamamlama kayıtlarına ve
 * öğrenci kayıtlarına yalnızca okuma amaçlı erişir.
 */

import React, { useMemo, useState } from 'react';
import {
    Target, BookOpenCheck, Flame, TrendingUp, AlertTriangle, Clock,
} from 'lucide-react';
import Grafik from '../charts/Grafik';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
    ResponsiveContainer, Cell,
} from 'recharts';
import {
    OlcumKarti, UyumHalkasi, IsiHaritasi, DersCubuklari, SayiCubuklari,
    GelisimZinciri, RiskListesi, Yorum, VeriYok,
} from '../charts/Analitik';
import { SegmentliSecim } from '../ui/Gelisim';
import {
    calismaOzeti, gunlukSeri, istikrar, programUyumu, uyumSerisi,
    netTrendi, hataOzeti, dersRiskleri, gelisimZinciri, yorumla,
} from '../../services/gelisimAnalitik';
import { hucreTarihi, programBaslangici } from '../../services/programProgressService';
import { izgaraOzellikleri, eksenOzellikleri, ANLAM_RENKLERI, dersRengi } from '../charts/grafikTemasi';

const PENCERELER = [
    { id: 14, etiket: '14 gün' },
    { id: 30, etiket: '30 gün' },
    { id: 90, etiket: '90 gün' },
];

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

const Bolum = ({ no, baslik, aciklama, children }) => (
    <section className="srf p-4 sm:p-5 flex flex-col gap-3.5">
        <div className="flex items-baseline gap-2.5">
            <span className="tip-mini font-black text-brand tabular-nums shrink-0">{no}</span>
            <div className="min-w-0">
                <h3 className="tip-h4 m-0">{baslik}</h3>
                {aciklama && <p className="tip-caption m-0 mt-0.5">{aciklama}</p>}
            </div>
        </div>
        {children}
    </section>
);

export default function OgrenciAnalizPanosu({ ogrenci }) {
    const studentId = ogrenci?.id;
    const [gun, setGun] = useState(30);

    const tarihCoz = useMemo(() => {
        if (!studentId) return null;
        const baslangic = programBaslangici(studentId);
        if (!baslangic) return null;
        return (cellKey) => hucreTarihi(cellKey, baslangic);
    }, [studentId]);

    const o = useMemo(() => {
        if (!studentId) return null;
        const calisma = calismaOzeti(studentId, gun);
        const ist = istikrar(studentId, Math.min(gun, 56));
        const uyum = programUyumu(studentId, { tarihCoz, gun });
        const net = netTrendi(studentId, ogrenci?.name);
        const hata = hataOzeti(studentId, gun);
        return {
            calisma, ist, uyum, net, hata,
            seri: gunlukSeri(studentId, Math.min(gun, 56)),
            uyumSeri: uyumSerisi(studentId, { tarihCoz, hafta: 8 }),
            risk: dersRiskleri(studentId, { tarihCoz, gun }),
            zincir: gelisimZinciri(studentId, ogrenci?.name, { tarihCoz, gun }),
        };
    }, [studentId, ogrenci?.name, gun, tarihCoz]);

    if (!studentId || !o) return <VeriYok metin="Analiz için öğrenci seçilmedi." />;

    const { calisma, ist, uyum, net, hata, seri, uyumSeri, risk, zincir } = o;

    /** En az bir risk sinyali yanan ders sayısı (orta + yüksek). */
    const sinyalliDers = (risk.dersler || []).filter((d) => d.sinyal > 0).length;

    const renkler = ANLAM_RENKLERI();
    const izgara = izgaraOzellikleri();
    const eksen = eksenOzellikleri();

    const saat = Math.floor(calisma.dakika / 60);
    const dk = calisma.dakika % 60;

    return (
        <div className="space-y-4">

            {/* ══ Başlık + pencere ═══════════════════════════════ */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                    <h2 className="tip-h4 m-0 truncate">{ogrenci?.name || 'Öğrenci'}</h2>
                    <p className="tip-caption m-0 mt-0.5">Gelişim analizi · son {gun} gün</p>
                </div>
                <SegmentliSecim ogeler={PENCERELER} deger={gun} onSec={setGun} etiket="Zaman aralığı" />
            </div>

            {/* ══ ÜST ÖLÇÜMLER ═══════════════════════════════════ */}
            <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-3">
                <OlcumKarti
                    etiket="Çalışma" simge={Clock} ton="bilgi"
                    veri={calisma.veri} sebep="calisma-yok"
                    deger={saat > 0 ? `${saat}s ${dk}` : calisma.dakika} birim={saat > 0 ? 'dk' : ' dk'}
                    degisim={calisma.dakikaDegisim}
                />
                <OlcumKarti
                    etiket="Çözülen Soru" simge={BookOpenCheck} ton="mor"
                    veri={calisma.veri} sebep="calisma-yok"
                    deger={calisma.soru} degisim={calisma.soruDegisim}
                    alt={calisma.isabet !== null ? `İsabet %${calisma.isabet}` : null}
                />
                <OlcumKarti
                    etiket="Program Uyumu" simge={Target} ton="marka"
                    veri={uyum.veri} sebep={uyum.sebep}
                    deger={uyum.oran ?? '—'} birim="%"
                    alt={uyum.veri ? `${uyum.kacirilan} etüt açıkta` : null}
                />
                <OlcumKarti
                    etiket="Net Değişimi" simge={TrendingUp} ton="iyi"
                    veri={net.veri && net.adet >= 2} sebep={net.sebep}
                    deger={net.sonNet ?? '—'} degisim={net.degisim} degisimBirimi=" net"
                    alt={`${net.adet} deneme`}
                />
                <OlcumKarti
                    etiket="İstikrar" simge={Flame} ton="uyari"
                    veri={ist.veri} sebep="calisma-yok"
                    deger={ist.oran ?? '—'} birim="%"
                    alt={`${ist.aktifGun}/${ist.gun} gün aktif`}
                />
                {/**
                  * SİNYAL VEREN ders sayısı — yalnızca "yüksek" olanlar değil.
                  *
                  * Önceden burada `risk.yuksek` vardı: altındaki risk haritası
                  * altı dersi ORTA seviyede listelerken bu kart "0" diyordu.
                  * Koç bir bakışta "risk yok" sanıyordu. Kart artık en az bir
                  * sinyali yanan her dersi sayar; kaçı yüksek olduğu alt
                  * satırda ayrıca yazar.
                  */}
                <OlcumKarti
                    etiket="Sinyal Veren Ders" simge={AlertTriangle}
                    ton={risk.yuksek > 0 ? 'kotu' : sinyalliDers > 0 ? 'uyari' : 'iyi'}
                    veri={risk.veri} bosMetin="Sinyal yok"
                    deger={sinyalliDers}
                    alt={risk.veri
                        ? (risk.yuksek > 0
                            ? `${risk.yuksek} yüksek · ${risk.dersler.length} ders izleniyor`
                            : `${risk.dersler.length} ders izleniyor`)
                        : null}
                />
            </div>

            {/* ══ 1. ÇALIŞMA TRENDİ ══════════════════════════════ */}
            <Bolum no="01" baslik="Çalışma trendi" aciklama="Günlük soru çözümü ve düzen">
                {/* TEK GÖRSEL, TEK SERİ.
                    Burada AYNI diziden AYNI alan iki kez çiziliyordu: önce
                    günlük çubuk grafiği, hemen altında aynı günlerin ısı
                    haritası. İkisi de "gün gün kaç soru" diyordu.

                    Kalan ısı haritasıdır, çünkü çubuğun söyleyemediği bir
                    şey söyler: kayıt OLMAYAN gün ile SIFIR çözülen günü
                    ayırır. Çubukta ikisi de sıfır yüksekliktedir ve
                    "çalışmadı" ile "girmedi" aynı görünür. Toplam ve
                    günlük ortalama zaten yukarıdaki ölçüm kartlarında. */}
                {calisma.veri ? (
                    <IsiHaritasi seri={seri} alan="soru" />
                ) : (
                    <VeriYok sebep="calisma-yok" />
                )}
                {yorumla('istikrar', ist, 'koc') && (
                    <Yorum ton={yorumla('istikrar', ist, 'koc').ton}>{yorumla('istikrar', ist, 'koc').metin}</Yorum>
                )}
            </Bolum>

            {/* ══ 2. PROGRAM UYUMU ═══════════════════════════════ */}
            <Bolum no="02" baslik="Program uyumu"
                aciklama="Yalnızca günü gelmiş etütler paydaya girer">
                {uyum.veri ? (
                    <>
                        <div className="flex flex-col lg:flex-row gap-5">
                            <UyumHalkasi oran={uyum.oran} planlanan={uyum.planlanan} tamamlanan={uyum.tamamlanan} />
                            <div className="flex-1 min-w-0">
                                <DersCubuklari dersler={uyum.dersler} enFazla={10} />
                            </div>
                        </div>
                        {uyumSeri.length >= 2 && (
                            <Grafik baslik="" boy="kisa" veriVar>
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
                        )}
                        {yorumla('programUyumu', uyum, 'koc') && (
                            <Yorum ton={yorumla('programUyumu', uyum, 'koc').ton}>
                                {yorumla('programUyumu', uyum, 'koc').metin}
                            </Yorum>
                        )}
                    </>
                ) : (
                    <VeriYok sebep={uyum.sebep} ipucu="Program oluşturulduğunda uyum burada ölçülür." />
                )}
            </Bolum>

            {/* ══ 3. DENEME TRENDİ ═══════════════════════════════ */}
            <Bolum no="03" baslik="Deneme ve net trendi"
                aciklama="Eğilim için en az 3 deneme gerekir">
                <Grafik
                    baslik="" boy="normal"
                    veriVar={net.veri && net.adet >= 2}
                    bosBaslik={net.adet === 1 ? 'Tek deneme — trend yok' : 'Deneme kaydı yok'}
                    bosAciklama="Deneme girildikçe net eğilimi burada oluşur."
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={net.seri} margin={{ top: 6, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid {...izgara} />
                            <XAxis dataKey="kisaAd" {...eksen} />
                            <YAxis {...eksen} />
                            <Tooltip content={<Ipucu birim=" net" />} />
                            <Line type="monotone" dataKey="net" name="Net"
                                stroke="var(--brand)" strokeWidth={2.5}
                                dot={{ r: 3.5, fill: 'var(--brand)' }} activeDot={{ r: 5.5 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </Grafik>
                {yorumla('net', net, 'koc') && (
                    <Yorum ton={yorumla('net', net, 'koc').ton}>{yorumla('net', net, 'koc').metin}</Yorum>
                )}
            </Bolum>

            {/* ══ 4. HATA ANALİZİ ════════════════════════════════ */}
            <Bolum no="04" baslik="Hata analizi" aciklama="Ders ve tür kırılımı">
                {hata.veri ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <p className="tip-mini font-black uppercase tracking-wider text-ink-3 mb-2">Derslere göre</p>
                            {/* Çubuk rengi = programdaki ders rengi. Eskiden
                                bütün dersler aynı amber tondaydı; koç
                                "Matematik" satırını programdaki maviyle
                                eşleştiremiyordu. */}
                            <SayiCubuklari
                                satirlar={hata.derslere.map((d) => ({
                                    ad: d.ad, deger: d.adet, renk: dersRengi(d.ad),
                                }))}
                                enFazla={6}
                            />
                        </div>
                        <div>
                            <p className="tip-mini font-black uppercase tracking-wider text-ink-3 mb-2">Hata türüne göre</p>
                            {/* Tür çubukları NÖTR: yanındaki panel ders
                                kimliğini renkle taşıyor, aynı kartta ikinci
                                bir renk sözlüğü kurmak iki anlamı aynı tona
                                bindirirdi. */}
                            <SayiCubuklari
                                satirlar={hata.turlere.map((d) => ({ ad: d.ad, deger: d.adet }))}
                                enFazla={6}
                            />
                        </div>
                    </div>
                ) : (
                    <VeriYok sebep="hata-kaydi-yok" />
                )}
                {yorumla('hata', hata, 'koc') && (
                    <Yorum ton={yorumla('hata', hata, 'koc').ton}>{yorumla('hata', hata, 'koc').metin}</Yorum>
                )}
            </Bolum>

            {/* ══ 5. RİSK HARİTASI ═══════════════════════════════ */}
            <Bolum no="05" baslik="Risk haritası"
                aciklama="Kestirim değil — yanan sinyallerin özeti">
                <RiskListesi riskler={risk} enFazla={8} />
            </Bolum>

            {/* ══ 6. GELİŞİM ZİNCİRİ ═════════════════════════════ */}
            <Bolum no="06" baslik="Çalışma sonuca dönüyor mu?"
                aciklama="Program → çalışma → deneme → net">
                <GelisimZinciri zincir={zincir} />
            </Bolum>
        </div>
    );
}
