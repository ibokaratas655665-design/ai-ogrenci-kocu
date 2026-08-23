/**
 * 📋 PROGRAM KARNEM — öğrencinin kendi program uyumu
 *
 * Program sekmesi bugüne kadar yalnızca ÇİZELGEYİ gösteriyordu: hangi
 * gün hangi etüt var. "Ne kadarına uydum, nerede geride kaldım, geçen
 * haftadan bana ne devretti?" sorularının cevabı yalnızca koç
 * panelindeydi. Öğrenci kendi uyumunu göremeden kendini düzenleyemez.
 *
 * ── DÖRT SORU, DÖRT GÖRSEL ────────────────────────────────────
 *   1. Genel olarak ne kadar uydum?   → halka (vadesi gelmiş etütler)
 *   2. Hangi derste geride kaldım?    → ders çubukları, ders renkleriyle
 *   3. Zaman içinde nasıl gidiyorum?  → haftalık uyum çizgisi
 *   4. Bana ne devretti?              → hafıza kartları (salt okunur)
 *
 * ── SALT OKUNUR ───────────────────────────────────────────────
 * Bu panel HİÇBİR ŞEY YAZMAZ. Program çizelgesi, tamamlama kayıtları
 * ve konu geçmişi yalnızca okunur; hepsi mevcut servislerden türetilir.
 * Öğrenci buradan programa satır ekleyemez — program yazmak koçun
 * işidir ve o yetki koç panelindedir.
 *
 * ── KIYAS YOK ─────────────────────────────────────────────────
 * Bütün karşılaştırmalar öğrencinin KENDİ geçmişiyledir. Akran
 * kıyası öğrenci ekranında yoktur; norm referanslı geri bildirim
 * geride olan öğrenciyi düşürür, kıyas koç panelinde kalır.
 */
import React, { useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Target, AlertTriangle, RotateCcw } from 'lucide-react';
import Card from '../ui/Card';
import { UyumHalkasi, DersCubuklari, VeriYok, Yorum } from '../charts/Analitik';
import { izgaraOzellikleri, eksenOzellikleri, ANIMASYON, renkOku } from '../charts/grafikTemasi';
import { programUyumu, uyumSerisi } from '../../services/gelisimAnalitik';
import { hafizaOzeti } from '../../services/programHafizasi';
import { hucreTarihi, programBaslangici } from '../../services/programProgressService';

/** Devreden iş kartı — sayı + ne olduğu. Eylem yok, bilgi var. */
const DevirKarti = ({ simge: Simge, sayi, baslik, alt, ton }) => (
    <div className="rounded-dmd border border-line bg-surface-2 px-3 py-2.5 flex items-start gap-2.5">
        <span
            className="shrink-0 w-8 h-8 rounded-dsm inline-flex items-center justify-center"
            style={{ background: `color-mix(in srgb, ${ton} 14%, transparent)`, color: ton }}
        >
            <Simge size={15} />
        </span>
        <div className="min-w-0">
            <p className="text-lg font-black text-ink leading-none tabular-nums" style={{ color: ton }}>{sayi}</p>
            <p className="tip-mini font-bold text-ink mt-1">{baslik}</p>
            {alt && <p className="tip-mini text-ink-3 mt-0.5 leading-snug">{alt}</p>}
        </div>
    </div>
);

export default function ProgramKarnem({ studentId }) {
    /**
     * Tarih çözücü — hücre anahtarından takvim gününe. Program başlangıcı
     * yoksa uyum hesaplanamaz; o zaman "vadesi gelmiş etüt" kavramı da
     * yoktur ve panel kendini gizler (sahte %0 göstermez).
     */
    const veri = useMemo(() => {
        if (!studentId) return null;
        try {
            const bas = programBaslangici(studentId);
            const tarihCoz = bas ? (k) => hucreTarihi(k, bas) : null;
            const uyum = programUyumu(studentId, { tarihCoz });
            return {
                uyum,
                seri: tarihCoz ? uyumSerisi(studentId, { tarihCoz, hafta: 8 }) : [],
                hafiza: hafizaOzeti(studentId, [], { tarihCoz }),
            };
        } catch {
            return null;
        }
    }, [studentId]);

    if (!veri) return null;
    const { uyum, seri, hafiza } = veri;

    /* Program hiç yoksa bu panelin gösterecek bir şeyi yok; çizelgenin
       kendi "henüz program oluşturulmadı" mesajı zaten görünüyor. */
    if (!uyum.veri && uyum.sebep === 'program-yok') return null;

    const rozet = hafiza?.rozet || {};
    const devirVar = (rozet.eksikSoru > 0) || (rozet.eksikEtut > 0) || (rozet.tekrarSayisi > 0);

    return (
        <div className="space-y-4">

            {/* ══ 1. UYUM: halka + ders kırılımı ═══════════════════ */}
            <Card>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                        <h3 className="tip-h4 m-0">Program Uyumum</h3>
                        <p className="tip-caption mt-0.5">
                            Günü gelmiş etütler üzerinden — gelecek etütler sayılmaz
                        </p>
                    </div>
                </div>

                {uyum.veri ? (
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-5">
                        <UyumHalkasi
                            oran={uyum.oran}
                            tamamlanan={uyum.tamamlanan}
                            planlanan={uyum.planlanan}
                            boyut={104}
                            className="shrink-0 self-center sm:self-auto"
                        />
                        <div className="flex-1 min-w-0">
                            {/* Halkanın anlatmadığı üçüncü sayı: bekleyen.
                                Planlanan ve tamamlanan zaten halkanın içinde. */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="rounded-dmd bg-surface-2 border border-line px-3 py-2">
                                    <p className="tip-mini text-ink-3 uppercase tracking-wider">Yetişmedi</p>
                                    <p className="tip-h4 text-ink rakam mt-0.5">{uyum.kacirilan}</p>
                                </div>
                                <div className="rounded-dmd bg-surface-2 border border-line px-3 py-2">
                                    <p className="tip-mini text-ink-3 uppercase tracking-wider">Sırada</p>
                                    <p className="tip-h4 text-ink rakam mt-0.5">{uyum.bekleyen}</p>
                                </div>
                            </div>
                            <p className="tip-label text-ink-3 mb-2">Derslere Göre</p>
                            <DersCubuklari dersler={uyum.dersler} enFazla={6} />
                        </div>
                    </div>
                ) : (
                    <VeriYok sebep={uyum.sebep} className="mt-4" />
                )}
            </Card>

            {/* ══ 2. HAFTALIK UYUM ÇİZGİSİ ═════════════════════════
                Tek bir yüzde "şu an" der, eğri "yön" der. Öz düzenlemede
                yön tek ölçümden daha kullanışlıdır. En az iki hafta
                gerekir; tek noktalı çizgi bir eğilim göstermez. */}
            {seri.length >= 2 && (
                <Card>
                    <h3 className="tip-h4 m-0">Haftalık Uyumum</h3>
                    <p className="tip-caption mt-0.5 mb-3">Son {seri.length} hafta · her hafta günü gelen etütlerin yüzdesi</p>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={seri} margin={{ top: 6, right: 10, bottom: 0, left: -20 }}>
                                <CartesianGrid {...izgaraOzellikleri()} />
                                <XAxis dataKey="etiket" {...eksenOzellikleri()} />
                                <YAxis domain={[0, 100]} {...eksenOzellikleri()} />
                                {/* %80 sağlıklı uyum sınırı — eğrinin nereye göre
                                    okunacağını gösterir; olmayınca yüzdeler havada kalıyor. */}
                                <ReferenceLine y={80} stroke={renkOku('--ok', '#15803D')}
                                    strokeDasharray="4 4" strokeOpacity={0.7} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, fontSize: 12 }}
                                    formatter={(v, ad, o) => [`%${v} · ${o?.payload?.tamamlanan}/${o?.payload?.planlanan} etüt`, 'Uyum']}
                                />
                                <Line
                                    type="monotone" dataKey="oran" name="Uyum"
                                    stroke="var(--brand)" strokeWidth={2.5}
                                    dot={{ r: 3.5, fill: 'var(--brand)' }} activeDot={{ r: 5.5 }}
                                    animationDuration={ANIMASYON}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="tip-mini text-ink-3 mt-1">Kesikli yeşil çizgi: %80 — sağlıklı uyum sınırı</p>
                </Card>
            )}

            {/* ══ 3. BU HAFTAYA DEVREDENLER ════════════════════════
                Koç panelindeki program hafızası öğrenciye de açılıyor —
                ama SALT OKUNUR. Öğrenci neyin devrettiğini bilmeden
                haftasını planlayamaz; programa satır eklemek ise koçun
                işidir, o düğme burada yoktur. */}
            {devirVar && (
                <Card>
                    <h3 className="tip-h4 m-0">Bu Haftaya Devredenler</h3>
                    <p className="tip-caption mt-0.5 mb-3">
                        Geçmiş haftalardan kalanlar — koçun programı kurarken gördüğü liste
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {rozet.eksikSoru > 0 && (
                            <DevirKarti
                                simge={Target} ton="var(--warn)"
                                sayi={rozet.eksikSoru}
                                baslik="eksik soru"
                                alt={`${rozet.eksikKonu} konuda hedefin altındasın`}
                            />
                        )}
                        {rozet.eksikEtut > 0 && (
                            <DevirKarti
                                simge={AlertTriangle} ton="var(--danger)"
                                sayi={rozet.eksikEtut}
                                baslik="yapılmamış etüt"
                                alt="günü geçti, işaretlenmedi"
                            />
                        )}
                        {rozet.tekrarSayisi > 0 && (
                            <DevirKarti
                                simge={RotateCcw} ton="var(--brand)"
                                sayi={rozet.tekrarSayisi}
                                baslik="tekrar zamanı gelen konu"
                                alt="aralıklı tekrar takvimine göre"
                            />
                        )}
                    </div>
                    {rozet.gecenHaftaOran != null && (
                        <Yorum ton={rozet.gecenHaftaOran >= 80 ? 'iyi' : rozet.gecenHaftaOran >= 60 ? 'notr' : 'dikkat'} className="mt-3">
                            {/* Ek uydurmuyoruz: "%76'ini" ile "%80'ini" ayrı ek ister.
                                Sayıdan sonra ek almayan bir kuruluş seçildi. */}
                            Geçen hafta programını %{rozet.gecenHaftaOran} tamamladın.
                        </Yorum>
                    )}
                </Card>
            )}
        </div>
    );
}
