/**
 * 🎓 ÖĞRENCİ GELİŞİM MERKEZİ
 *
 * YENİ MEKANİZMA — NEDEN ZORUNLU?
 * Öğrencinin ürettiği üç kayıt türü (günlük kayıt, hata defteri, deneme
 * analizi) koç panelinde ÜÇ AYRI menü girişi olarak duruyordu ve sınıf
 * geneli kesit hiç yoktu: "bu hafta kim kayıt girmedi", "sınıfın
 * ortalaması nereye gidiyor" sorularının cevabı ekranda değildi.
 * reportService.buildClassReport motoru yazılmış ama HİÇBİR ekrana
 * bağlanmamıştı. Bu bileşen üçünü tek merkezde toplar ve hazır sınıf
 * raporu motorunu ilk kez ekrana bağlar. Yeni veri üretmez — yalnızca
 * mevcut anahtarları okur.
 */
import React, { useMemo } from 'react';
import { LayoutGrid, PencilLine, BookX, BarChart2, ChevronRight } from 'lucide-react';
import SectionTabs from '../shared/SectionTabs';
import KocDegerlendirme from './KocDegerlendirme';
import { buildClassReport, buildRosterStatus } from '../../services/reportService';

const StatKart = ({ etiket, deger, altyazi, vurgu }) => (
    <div className="bg-surface border border-line rounded-2xl p-4">
        <p className="tip-label text-ink-3">{etiket}</p>
        <p className="text-2xl font-black mt-1" style={{ color: vurgu || 'var(--ink)' }}>{deger}</p>
        {altyazi && <p className="text-xs text-ink-3 mt-0.5">{altyazi}</p>}
    </div>
);

const OgrenciSatiri = ({ ad, sag, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-2 transition text-left min-h-[44px]"
    >
        <span className="text-sm font-semibold text-ink truncate">{ad}</span>
        <span className="flex items-center gap-1 text-xs font-bold text-ink-2 shrink-0">
            {sag}
            {onClick && <ChevronRight size={14} className="text-ink-3" />}
        </span>
    </button>
);

const ListeKarti = ({ baslik, bos, children }) => (
    <div className="bg-surface border border-line rounded-2xl p-4">
        <h4 className="tip-h4 mb-2">{baslik}</h4>
        {bos ? <p className="text-sm text-ink-3 py-4 text-center">{bos}</p> : <div className="space-y-0.5">{children}</div>}
    </div>
);

export default function OgrenciGelisimMerkezi({ students = [], onOgrenciAc }) {
    /* Sınıf raporu — hazır motor (buildClassReport) ilk kez ekranda. */
    const sinif = useMemo(() => {
        try { return buildClassReport(students); } catch { return null; }
    }, [students]);

    /* Haftalık kayıt kesiti — "kim bu hafta hiç günlük kayıt girmedi?" */
    const roster = useMemo(() => {
        try { return buildRosterStatus(students); } catch { return []; }
    }, [students]);
    const kayitsizlar = useMemo(() => {
        const adlar = new Map(students.map((s) => [String(s.id), s.name]));
        return roster
            .filter((r) => !r.questions && !r.pages)
            .map((r) => ({ id: r.id, ad: adlar.get(String(r.id)) || '?' }));
    }, [roster, students]);

    const sections = [
        { id: 'genel', icon: LayoutGrid, label: 'Genel Bakış', title: 'Sınıf Geneli', description: 'Tüm öğrencilerin haftalık kesiti: aktiflik, ortalama net, risk ve yükselenler' },
        { id: 'gunluk', icon: PencilLine, label: 'Günlük Kayıt', title: 'Günlük Kayıt Değerlendirmesi', description: 'Öğrencinin soru çözüm düzeni ve ders dağılımı' },
        { id: 'hata', icon: BookX, label: 'Hata Defteri', title: 'Hata Defteri Değerlendirmesi', description: 'Hata trendi, tekrar eden konular ve öğrencinin açıklamaları' },
        { id: 'deneme', icon: BarChart2, label: 'Deneme Analizi', title: 'Deneme Analizi Değerlendirmesi', description: 'Net gelişimi, güçlü/zayıf dersler ve hata nedenleri' },
    ];

    return (
        <SectionTabs id="gelisim-merkezi" sections={sections} accent="var(--brand)">
            {(active) => (
                <>
                    {active === 'genel' && sinif && (
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                                <StatKart etiket="Öğrenci" deger={sinif.studentCount} />
                                <StatKart etiket="Bu hafta aktif" deger={sinif.activeCount}
                                    altyazi={`${sinif.studentCount - sinif.activeCount} sessiz`} />
                                <StatKart etiket="Ort. son net" deger={sinif.avgNet ?? '—'} />
                                <StatKart etiket="Görev tamamlama" deger={sinif.avgCompletionPct != null ? `%${sinif.avgCompletionPct}` : '—'} />
                                <StatKart etiket="Riskli öğrenci" deger={sinif.atRisk.length}
                                    vurgu={sinif.atRisk.length ? 'var(--danger)' : 'var(--ok)'} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <ListeKarti
                                    baslik="⚠️ Bu hafta hiç kayıt girmeyenler"
                                    bos={kayitsizlar.length ? null : 'Herkes bu hafta kayıt girmiş 🎉'}
                                >
                                    {kayitsizlar.map((o) => (
                                        <OgrenciSatiri key={o.id} ad={o.ad} sag="0 soru"
                                            onClick={onOgrenciAc ? () => onOgrenciAc(o.id) : undefined} />
                                    ))}
                                </ListeKarti>

                                <ListeKarti
                                    baslik="📈 En çok gelişenler"
                                    bos={sinif.mostImproved.length ? null : 'Kıyaslanacak ikinci deneme bekleniyor.'}
                                >
                                    {sinif.mostImproved.map((r) => (
                                        <OgrenciSatiri key={r.student.id} ad={r.student.name}
                                            sag={<span style={{ color: 'var(--ok)' }}>+{r.exams.netTrend} net</span>}
                                            onClick={onOgrenciAc ? () => onOgrenciAc(r.student.id) : undefined} />
                                    ))}
                                </ListeKarti>

                                <ListeKarti
                                    baslik="🔔 Yüksek riskli öğrenciler"
                                    bos={sinif.atRisk.length ? null : 'Yüksek riskli öğrenci yok.'}
                                >
                                    {sinif.atRisk.map((r) => (
                                        <OgrenciSatiri key={r.student.id} ad={r.student.name}
                                            sag={<span style={{ color: 'var(--danger)' }}>{r.risk.reasons?.[0] || 'risk'}</span>}
                                            onClick={onOgrenciAc ? () => onOgrenciAc(r.student.id) : undefined} />
                                    ))}
                                </ListeKarti>
                            </div>
                        </div>
                    )}

                    {active === 'gunluk' && <KocDegerlendirme students={students} tur="gunluk" />}
                    {active === 'hata' && <KocDegerlendirme students={students} tur="hata" />}
                    {active === 'deneme' && <KocDegerlendirme students={students} tur="deneme" />}
                </>
            )}
        </SectionTabs>
    );
}
