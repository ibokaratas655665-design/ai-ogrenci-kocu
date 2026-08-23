/**
 * 🧠 PROGRAM HAFIZA PANELİ — koçun karar desteği
 *
 * Yeni hafta programı kurulurken geçmişi hatırlatır:
 *   · önceki haftalardan kalan SORU
 *   · yapılmamış ETÜT
 *   · tekrar zamanı gelen KONU
 *   · geçen haftanın tamamlanma oranı
 *
 * ── KARAR KOÇUNDUR (§7, §12, §14, §35) ────────────────────────
 * Hiçbir satır programa OTOMATİK eklenmez. Her satırın yanında
 * "+ Ekle" düğmesi vardır; koç istediğini dağıtım listesine alır.
 * Panel öneri sunar, karar vermez.
 *
 * ── SAHTE VERİ YOK (§48) ──────────────────────────────────────
 * Geçmiş veri yoksa sayı uydurulmaz; "Yeterli geçmiş veri yok"
 * yazılır ve panel kapalı kalır.
 */
import React, { useMemo, useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Plus, AlertTriangle, RotateCcw, Target } from 'lucide-react';
import hafiza from '../../services/programHafizasi';
import { hucreTarihi, programBaslangici } from '../../services/programProgressService';

const Rozet = ({ simge: Simge, deger, etiket, ton }) => (
    <span
        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
        style={{ background: `${ton}1A`, color: ton }}
    >
        <Simge size={11} />
        {deger} {etiket}
    </span>
);

/** Tek bir öneri satırı — sağında "+ Ekle". */
const Satir = ({ birincil, ikincil, vurgu, vurguTon, onEkle }) => (
    <div className="flex items-center gap-2 px-2.5 py-2 bg-surface border border-line rounded-lg">
        <div className="min-w-0 flex-1">
            <p className="text-[11.5px] font-bold text-ink truncate">{birincil}</p>
            {ikincil && <p className="text-[10px] text-ink-3 truncate">{ikincil}</p>}
        </div>
        {vurgu && (
            <span className="text-[10.5px] font-black shrink-0" style={{ color: vurguTon }}>
                {vurgu}
            </span>
        )}
        <button
            type="button"
            onClick={onEkle}
            title="Dağıtım listesine ekle"
            className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-brand text-white text-[10px] font-bold hover:bg-brand-hover transition min-h-[28px]"
        >
            <Plus size={11} /> Ekle
        </button>
    </div>
);

const Bolum = ({ baslik, simge: Simge, ton, satirlar, bosMetin, cizer }) => {
    if (!satirlar.length) {
        return (
            <div className="px-2.5 py-2">
                <p className="text-[10.5px] text-ink-3 italic">{bosMetin}</p>
            </div>
        );
    }
    return (
        <div className="space-y-1.5">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider" style={{ color: ton }}>
                <Simge size={11} /> {baslik}
            </p>
            {satirlar.map(cizer)}
        </div>
    );
};

export default function ProgramHafizaPaneli({ studentId, konular = [], onEkle }) {
    const [acik, setAcik] = useState(false);

    const ozet = useMemo(() => {
        if (!studentId) return null;
        try {
            const bas = programBaslangici(studentId);
            const tarihCoz = bas ? (k) => hucreTarihi(k, bas) : null;
            return hafiza.hafizaOzeti(studentId, konular, { tarihCoz });
        } catch {
            return null;
        }
        // Dağıtım listesi değişince hedefler de değişir
    }, [studentId, konular]);

    if (!ozet) return null;

    const { rozet, eksikSoru, eksikEtut, tekrar, gecenHafta } = ozet;

    /* Geçmiş veri yoksa panel açılmaz — boş kutu göstermenin anlamı yok. */
    if (!ozet.veri) {
        return (
            <div className="px-4 py-2.5 bg-surface-2 border-b border-line">
                <p className="flex items-center gap-2 text-[11px] text-ink-3">
                    <Brain size={13} />
                    Program hafızası: yeterli geçmiş veri yok.
                </p>
            </div>
        );
    }

    const ekle = (satir, tur) => onEkle?.(hafiza.listeyeCevir(satir, tur), tur);

    return (
        <div className="bg-warn-soft border-b border-warn/30">
            <button
                type="button"
                onClick={() => setAcik((v) => !v)}
                className="w-full flex items-center justify-between gap-2 px-4 py-2.5 min-h-[44px]"
                aria-expanded={acik}
            >
                <span className="flex items-center gap-2 min-w-0">
                    <Brain size={15} className="text-warn shrink-0" />
                    <span className="text-[12px] font-black text-ink">Program Hafızası</span>
                </span>
                <span className="flex items-center gap-1.5 flex-wrap justify-end">
                    {rozet.eksikSoru > 0 && (
                        <Rozet simge={Target} deger={rozet.eksikSoru} etiket="eksik soru" ton="var(--warn)" />
                    )}
                    {rozet.eksikEtut > 0 && (
                        <Rozet simge={AlertTriangle} deger={rozet.eksikEtut} etiket="eksik etüt" ton="var(--danger)" />
                    )}
                    {rozet.tekrarSayisi > 0 && (
                        <Rozet simge={RotateCcw} deger={rozet.tekrarSayisi} etiket="tekrar" ton="var(--brand)" />
                    )}
                    {acik ? <ChevronUp size={15} className="text-ink-3" /> : <ChevronDown size={15} className="text-ink-3" />}
                </span>
            </button>

            {acik && (
                <div className="px-4 pb-3 space-y-3 max-h-[38dvh] overflow-y-auto custom-scrollbar">
                    {gecenHafta.veri && (
                        <p className="text-[11px] text-ink-2">
                            Geçen hafta planlanan {gecenHafta.planlanan} etüdün{' '}
                            <strong>{gecenHafta.tamamlanan}</strong> tanesi yapıldı
                            {' '}(%{gecenHafta.oran}).
                        </p>
                    )}

                    <Bolum
                        baslik="Önceki haftadan kalan soru"
                        simge={Target} ton="var(--warn)"
                        satirlar={eksikSoru.eksigiOlan.slice(0, 8)}
                        bosMetin="Eksik soru yok."
                        cizer={(s) => (
                            <Satir
                                key={`soru-${s.ders}-${s.konu}`}
                                birincil={s.konu}
                                ikincil={`${s.ders} · hedef ${s.hedef}, çözülen ${s.cozulen}`}
                                vurgu={`${s.eksik} eksik`}
                                vurguTon="var(--warn)"
                                onEkle={() => ekle(s, 'soru')}
                            />
                        )}
                    />

                    <Bolum
                        baslik="Yapılmamış etüt"
                        simge={AlertTriangle} ton="var(--danger)"
                        satirlar={eksikEtut.satirlar.slice(0, 8)}
                        bosMetin="Yapılmamış etüt yok."
                        cizer={(s) => (
                            <Satir
                                key={`etut-${s.ders}-${s.konu}`}
                                birincil={s.konu}
                                ikincil={s.ders}
                                vurgu={`${s.eksikEtut} etüt`}
                                vurguTon="var(--danger)"
                                onEkle={() => ekle(s, 'etut')}
                            />
                        )}
                    />

                    <Bolum
                        baslik="Tekrar zamanı geldi"
                        simge={RotateCcw} ton="var(--brand)"
                        satirlar={tekrar.satirlar.slice(0, 8)}
                        bosMetin="Tekrar zamanı gelen konu yok."
                        cizer={(s) => (
                            <Satir
                                key={`tekrar-${s.ders}-${s.konu}`}
                                birincil={s.konu}
                                ikincil={`${s.ders} · ${s.gecenGun} gündür çalışılmadı`
                                    + (s.isabet !== null ? ` · isabet %${s.isabet}` : '')}
                                vurgu={`${s.onerilenAralik} günde bir`}
                                vurguTon="var(--brand)"
                                onEkle={() => ekle(s, 'tekrar')}
                            />
                        )}
                    />

                    <p className="text-[10px] text-ink-3 pt-1 border-t border-warn/20">
                        Bu bilgiler geçmiş kayıtlardan hesaplanır. Hiçbiri programa
                        otomatik eklenmez — kararı siz verirsiniz.
                    </p>
                </div>
            )}
        </div>
    );
}
