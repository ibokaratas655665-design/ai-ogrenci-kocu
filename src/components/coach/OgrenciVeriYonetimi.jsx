/**
 * 🗑️ Öğrenci Veri Yönetimi — KOÇ silme yetkisi (V1.1)
 *
 * YENİ MEKANİZMA — NEDEN ZORUNLU?
 * Günlük kayıt, hata defteri ve deneme kayıtları koç silmedikçe
 * sistemde kalmalı; ama koçun HİÇ silme aracı yoktu — yanlış girilen
 * bir deneme sonsuza dek analizleri bozuyordu. Burada koç, YALNIZCA
 * baktığı öğrencinin kayıtlarını tek tek, onay penceresiyle siler.
 *
 * GÜVENLİK / SENKRON:
 *  · Sayfa koç rotasında (RouteGuard) ve tek öğrenciye bağlı; her
 *    filtre `studentId` ile — başka öğrencinin kaydı listeye giremez.
 *  · Koçlar arası izolasyon Firestore kurallarında: yazma zaten yalnız
 *    kendi `syncData` kovasına gider, yeni kural gerekmez.
 *  · Silme `yaz(..., { zorla: true })` ile buluta da gider — yoksa
 *    kayıt bir sonraki senkron turunda GERİ GELİR (ölçülmüş hata
 *    sınıfı). Boş kalan liste de bilerek zorla gönderilir.
 *  · Deneme kayıtları adla eşleşir (v2 veri modeli); silinecek kayıt
 *    liste İNDEKSİ değil, alan karşılaştırmasıyla bulunur.
 */
import React, { useMemo, useState } from 'react';
import { Trash2, Database, ChevronDown } from 'lucide-react';
import { listeOku, yaz } from '../../services/veriDeposu';
import { bildir, onayla } from '../../services/uiGeriBildirim';
import { ogrencininDenemeleri } from '../../utils/denemeAnalizi';
import denemeKayitlari from '../../services/denemeKayitlari';

const tarihLabel = (t) => {
    const d = new Date(t || 0);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
};

const Satir = ({ baslik, altyazi, onSil }) => (
    <div className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
        <div className="min-w-0">
            <p className="font-medium text-ink truncate">{baslik}</p>
            {altyazi && <p className="text-xs text-ink-3">{altyazi}</p>}
        </div>
        <button
            type="button"
            onClick={onSil}
            aria-label={`${baslik} kaydını sil`}
            className="shrink-0 p-1.5 rounded-lg text-ink-3 hover:text-danger hover:bg-danger/10 transition"
        >
            <Trash2 size={14} />
        </button>
    </div>
);

const Kaynak = ({ baslik, sayi, children }) => {
    const [acik, setAcik] = useState(false);
    return (
        <div className="border border-line rounded-2xl overflow-hidden">
            <button
                type="button"
                onClick={() => setAcik((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-surface-2 transition text-sm font-bold text-ink"
            >
                <span>{baslik} <span className="text-ink-3 font-medium">({sayi})</span></span>
                <ChevronDown size={16} className={`text-ink-3 transition-transform ${acik ? 'rotate-180' : ''}`} />
            </button>
            {acik && <div className="divide-y divide-line border-t border-line bg-surface-2/40">{children}</div>}
        </div>
    );
};

export default function OgrenciVeriYonetimi({ student }) {
    const [surum, setSurum] = useState(0);
    const kimlik = String(student?.id ?? '');

    const gunlukler = useMemo(
        () => listeOku('study_log').filter((g) => String(g.studentId) === kimlik),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- surum bilinçli: listeOku reaktif değil, silme sonrası yeniden okutur
        [kimlik, surum]
    );
    const hatalar = useMemo(
        () => listeOku('error_notebook').filter((h) => String(h.studentId) === kimlik),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- surum bilinçli: listeOku reaktif değil, silme sonrası yeniden okutur
        [kimlik, surum]
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- surum bilinçli (üstteki not)
    const analizKayitlari = useMemo(() => denemeKayitlari.ogrencininKayitlari(kimlik), [kimlik, surum]);
    const denemeler = useMemo(
        () => ogrencininDenemeleri(listeOku('v2_results_data'), student?.name, 'all'),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- surum bilinçli (üstteki not)
        [student?.name, surum]
    );

    const listedenSil = async (anahtar, esit, aciklama) => {
        const onay = await onayla({
            mesaj: `${aciklama} silinsin mi? Bu işlem geri alınamaz ve tüm cihazlara yansır.`,
            tehlikeli: true,
        });
        if (!onay) return;
        const liste = listeOku(anahtar);
        const yeni = liste.filter((k) => !esit(k));
        if (yeni.length === liste.length) { bildir('Kayıt bulunamadı.', 'hata'); return; }
        if (liste.length - yeni.length > 1) { bildir('Birden çok kayıt eşleşti, silinmedi.', 'hata'); return; }
        yaz(anahtar, yeni, { zorla: true });
        bildir('Kayıt silindi ve buluta işlendi.', 'basari');
        setSurum((v) => v + 1);
    };

    return (
        <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-ink mb-1 flex items-center">
                <Database className="mr-2 text-brand" size={18} /> Veri Yönetimi
            </h3>
            <p className="text-xs text-ink-3 mb-4">
                Kayıtlar siz silmedikçe sistemde kalır. Silme yalnızca bu öğrencinin
                seçtiğiniz kaydını kaldırır ve senkronla tüm cihazlara yansır.
            </p>
            <div className="space-y-3">
                <Kaynak baslik="Günlük Kayıtlar" sayi={gunlukler.length}>
                    {gunlukler.length === 0 && <p className="px-3 py-2 text-xs text-ink-3">Kayıt yok.</p>}
                    {gunlukler.map((g) => (
                        <Satir
                            key={g.id}
                            baslik={`${g.subject}${g.topic ? ` · ${g.topic}` : ''}`}
                            altyazi={`${tarihLabel(g.date)} · ${g.kind === 'kitap' ? `${g.pages || 0} sayfa` : `${g.correct || 0}D ${g.wrong || 0}Y ${g.blank || 0}B`}`}
                            onSil={() => listedenSil('study_log', (k) => k.id === g.id, `${tarihLabel(g.date)} tarihli günlük kayıt`)}
                        />
                    ))}
                </Kaynak>
                <Kaynak baslik="Hata Defteri" sayi={hatalar.length}>
                    {hatalar.length === 0 && <p className="px-3 py-2 text-xs text-ink-3">Kayıt yok.</p>}
                    {hatalar.map((h) => (
                        <Satir
                            key={h.id}
                            baslik={`${h.subject} · ${h.topic}`}
                            altyazi={tarihLabel(h.createdAt)}
                            onSil={() => listedenSil('error_notebook', (k) => k.id === h.id, `"${h.topic}" hata kaydı`)}
                        />
                    ))}
                </Kaynak>
                <Kaynak baslik="Deneme Analizleri (öğrenci girişli)" sayi={analizKayitlari.length}>
                    {analizKayitlari.length === 0 && <p className="px-3 py-2 text-xs text-ink-3">Kayıt yok.</p>}
                    {analizKayitlari.map((k) => (
                        <Satir
                            key={k.id}
                            baslik={k.ad + ' (' + k.tur + ')'}
                            altyazi={tarihLabel(k.tarih)}
                            onSil={async () => {
                                const onay = await onayla({ mesaj: '"' + k.ad + '" deneme analizi silinsin mi? Bu işlem geri alınamaz ve tüm cihazlara yansır.', tehlikeli: true });
                                if (!onay) return;
                                const sonuc = denemeKayitlari.sil(k.id, kimlik);
                                if (!sonuc.basarili) { bildir(sonuc.hata, 'hata'); return; }
                                bildir('Kayıt silindi ve buluta işlendi.', 'basari');
                                setSurum((v) => v + 1);
                            }}
                        />
                    ))}
                </Kaynak>
                <Kaynak baslik="Deneme Kayıtları (koç yüklemesi)" sayi={denemeler.length}>
                    {denemeler.length === 0 && <p className="px-3 py-2 text-xs text-ink-3">Kayıt yok.</p>}
                    {denemeler.map((d, i) => (
                        <Satir
                            key={`${d.uploadedAt}-${i}`}
                            baslik={`${d.examName || d.name || `Deneme ${i + 1}`} (${d.examType || 'TYT'})`}
                            altyazi={`${tarihLabel(d.uploadedAt)} · ${d.totalNet ?? '—'} net`}
                            onSil={() => listedenSil(
                                'v2_results_data',
                                (k) => k.uploadedAt === d.uploadedAt && k.student === d.student && k.examType === d.examType && k.totalNet === d.totalNet,
                                `${tarihLabel(d.uploadedAt)} tarihli deneme kaydı`
                            )}
                        />
                    ))}
                </Kaynak>
            </div>
        </div>
    );
}
