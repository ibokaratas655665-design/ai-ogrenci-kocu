import React, { useState, useMemo, useCallback } from 'react';
import {
    Plus, Trash2, Download, X, Search, AlertTriangle, CheckCircle2,
    Link2, FileText, FolderOpen, Printer,
} from 'lucide-react';
import {
    KAYNAK_ETIKET, KADEME_LISTESI, KADEMELER,
    kurumTurundenKademe, ogretimYili, klasorBul,
} from '../../data/pdrDecimalPlan';
import arsiv from '../../services/pdrArchiveService';
import { belgeUret, parca, kurumUyarisi } from '../../utils/mebDocument';
import { kurumBilgisi } from '../../data/mebStandards';

/**
 * 🗂️ DESİMAL DOSYA ÇALIŞMA EKRANI
 *
 * Rehberlik servisinin 10 resmî dosyasından HER BİRİ için kullanılan
 * ortak çalışma ekranı. Her dosya kendi sekmesinde açılır ve iki şey
 * bir arada sunulur:
 *
 *   1. DOSYA — o dosyada bulunması gereken belgeler, hangileri var,
 *      hangileri eksik; kayıt ekleme, silme, PDF çıktısı
 *   2. ÇALIŞMA MODÜLLERİ — o dosyayı besleyen uygulama araçları
 *      (Görüşme dosyasında randevu ve görüşme kaydı, Kaynaştırma
 *      dosyasında BEP motoru, Sınıf dosyasında envanterler…)
 *
 * Böylece danışman "önce çalışmayı yap, sonra ayrıca dosyala" döngüsüne
 * girmez; çalışma ile arşiv aynı ekranda durur.
 *
 * Modüller `moduller` prop'u ile dışarıdan verilir:
 *   [{ id, label, icon, render: () => <JSX/> }]
 */

const DecimalFolderTab = ({ klasorNo, moduller = [], setToast, user }) => {
    const tanim0 = klasorBul(klasorNo);

    const [yil, setYil] = useState(ogretimYili());
    const [kademe, setKademe] = useState(() => kurumTurundenKademe(kurumBilgisi().okulTuru));
    const [altSekme, setAltSekme] = useState('dosya');
    const [arama, setArama] = useState('');
    const [formAcik, setFormAcik] = useState(false);
    const [surum, setSurum] = useState(0);

    const yenile = useCallback(() => setSurum((v) => v + 1), []);

    const durum = useMemo(
        () => arsiv.klasorDurumu(klasorNo, yil, kademe),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [klasorNo, yil, kademe, surum]
    );

    const kayitlar = useMemo(() => {
        const liste = arsiv.klasorKayitlari(klasorNo, yil);
        if (!arama.trim()) return liste;
        const q = arama.toLocaleLowerCase('tr-TR');
        return liste.filter((k) =>
            [k.baslik, k.aciklama, k.ogrenci, k.sinif].join(' ').toLocaleLowerCase('tr-TR').includes(q)
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [klasorNo, yil, arama, surum]);

    const yilSecenekleri = useMemo(() => arsiv.yillar(), [surum]);

    if (!tanim0 || !durum) {
        return (
            <div className="srf p-8 text-center">
                <p className="text-xs text-ink-3">Dosya tanımı bulunamadı ({klasorNo}).</p>
            </div>
        );
    }

    const t = durum.tanim;
    const kurum = kurumBilgisi();
    const kurumEksik = !kurum.il || !kurum.okulAdi;

    // ── Modüllerden otomatik bağlama ──────────────────────
    const otomatikBagla = () => {
        const n = arsiv.otomatikBagla(user?.name || '');
        yenile();
        setToast?.(n > 0
            ? `${n} kayıt ilgili dosyalara bağlandı`
            : 'Bağlanacak yeni kayıt bulunamadı — dosya güncel');
    };

    // ── PDF çıktıları ─────────────────────────────────────
    const icerikPdf = async () => {
        const uyari = kurumUyarisi();
        if (uyari) setToast?.(uyari);
        const hepsi = arsiv.klasorKayitlari(klasorNo, yil);

        await belgeUret({
            belgeAdi: `${t.no} — ${t.ad}`,
            konu: `${yil} Eğitim-Öğretim Yılı · ${KADEMELER[kademe]?.ad} içerik dökümü`,
            gizli: Boolean(t.gizli),
            govde: [
                parca.alanlar([
                    ['Dosya No', t.no],
                    ['Dosya Adı', t.ad],
                    ['Öğretim Yılı', yil],
                    ['Eğitim Kademesi', KADEMELER[kademe]?.ad || '—'],
                    ['Kayıt Sayısı', String(hepsi.length)],
                    ['Zorunlu Belge Durumu', `${durum.tamamlanan}/${durum.zorunluSayisi} tamamlandı`],
                ]),
                parca.bolum('Dosya İçeriği', parca.tablo(
                    ['Tarih', 'Belge / Çalışma', 'İlgili Öğrenci', 'Sınıf'],
                    hepsi.map((k) => [k.tarih, k.baslik, k.ogrenci || '—', k.sinif || '—']),
                    ['14%', '46%', '25%', '15%']
                )),
                durum.eksikler.length
                    ? parca.bolum('Eksik Zorunlu Belgeler', parca.liste(durum.eksikler.map((e) => e.ad)))
                    : parca.bolum('Eksik Belge', parca.metin('Zorunlu belgelerin tamamı mevcuttur.')),
            ].join(''),
            belgeKodu: t.no,
            dosyaAdi: `Dosya_${t.no}_${yil}.pdf`,
        });
        setToast?.('İçerik dökümü indirildi');
    };

    const sirtlikPdf = async () => {
        await belgeUret({
            belgeAdi: 'Dosya Sırtlığı',
            konu: `${t.no} — ${t.ad}`,
            kvkk: false,
            govde: [
                parca.alanlar([
                    ['Dosya No', t.no],
                    ['Dosya Adı', t.ad],
                    ['Öğretim Yılı', yil],
                    ['Dosya Türü', t.donem === 'surekli' ? 'Sürekli arşiv' : 'Yıllık'],
                    ['Gizlilik', t.gizli ? 'Gizli — kilitli dolapta saklanır' : 'Normal'],
                ]),
                parca.bolum('Dosya İçeriği', parca.metin(t.aciklama)),
                parca.bolum('Bulunması Gereken Belgeler', parca.liste(
                    t.belgeler.map((b) => `${b.ad}${b.zorunlu ? ' (zorunlu)' : ''}`)
                )),
            ].join(''),
            gizli: Boolean(t.gizli),
            belgeKodu: t.no,
            dosyaAdi: `Sirtlik_${t.no}.pdf`,
        });
        setToast?.('Dosya sırtlığı indirildi');
    };

    const sekmeler = [{ id: 'dosya', label: 'Dosya İçeriği' }, ...moduller];

    return (
        <div className="space-y-4">

            {/* ── Dosya başlığı ──────────────────────────── */}
            <div className="srf srf-accent p-4" style={{ '--acc': t.renk }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                        <span className="text-2xl leading-none">{t.icon}</span>
                        <div className="min-w-0">
                            <p className="eyebrow">{t.no}. Dosya · {yil}</p>
                            <h3 className="h2">{t.ad}</h3>
                            <p className="text-[11px] text-ink-3 mt-1 leading-snug max-w-3xl">{t.aciklama}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={kademe}
                            onChange={(e) => setKademe(e.target.value)}
                            className="fld w-auto"
                            aria-label="Eğitim kademesi"
                        >
                            {KADEME_LISTESI.map((k) => (
                                <option key={k.id} value={k.id}>{k.icon} {k.ad}</option>
                            ))}
                        </select>
                        <select
                            value={yil}
                            onChange={(e) => setYil(e.target.value)}
                            className="fld w-auto"
                            aria-label="Öğretim yılı"
                        >
                            {yilSecenekleri.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                {/* Dosyaya özgü resmî kurallar */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                    {t.gizli && <span className="badge badge-danger">🔒 Gizli</span>}
                    {t.eRehberlik === 'ciktiGerekli' && <span className="badge badge-warn">🖨️ Çıktı + imza şart</span>}
                    {t.eRehberlik === 'ciktiGerekmez' && <span className="badge badge-ok">☁️ e-Rehberlik'te üretilir</span>}
                    {t.ileGoreDegisir && <span className="badge">📍 İle göre değişir</span>}
                    {t.sinifBazli && <span className="badge">🏫 Sınıf bazlı</span>}
                    {t.ogrenciBazli && <span className="badge">👤 Öğrenci bazlı</span>}
                    {t.donem === 'surekli' && <span className="badge">♾️ Sürekli arşiv</span>}
                </div>

                {t.eRehberlik === 'ciktiGerekli' && (
                    <p className="text-[11px] text-warn font-bold mt-2 leading-snug">
                        e-Rehberlik'te kayıtlı olsa da imzalar için çıktı alınıp dosyalanması gerekir.
                    </p>
                )}
                {t.eRehberlik === 'ciktiGerekmez' && (
                    <p className="text-[11px] text-ok font-bold mt-2 leading-snug">
                        e-Rehberlik'te üretilen rapor için çıktı alıp dosyalamaya gerek yoktur —
                        yalnızca sınıf rehber öğretmenlerinin faaliyet raporları elle dosyalanır.
                    </p>
                )}
                {t.ileGoreDegisir && (
                    <p className="text-[11px] text-ink-2 mt-2 leading-snug">
                        İçerik il rehberlik danışma komisyonu kararına bağlıdır; iller arasında
                        farklılık gösterir, her ilde yapılmayabilir.
                    </p>
                )}
            </div>

            {kurumEksik && (
                <div className="flex items-start gap-2 rounded-xl border border-warn-line bg-warn-soft p-3">
                    <AlertTriangle size={15} className="text-warn shrink-0 mt-px" />
                    <p className="text-[11px] text-ink-2 leading-snug">
                        <strong className="text-ink">Kurum bilgileri eksik.</strong> PDF çıktılarının
                        resmî yazı başlığı doldurulamıyor. Ayarlar → Kurum Bilgileri bölümünden
                        il, ilçe, okul adı ve kurum kodunu girin.
                    </p>
                </div>
            )}

            {/* ── Alt sekmeler: dosya + çalışma modülleri ── */}
            {sekmeler.length > 1 && (
                <div className="tabbar">
                    {sekmeler.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setAltSekme(s.id)}
                            aria-selected={altSekme === s.id}
                            className={`tb ${altSekme === s.id ? 'is-on' : ''}`}
                            style={altSekme === s.id ? { '--brand': t.renk } : undefined}
                        >
                            {s.icon && <s.icon size={15} />}
                            {s.label}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Çalışma modülü içeriği ─────────────────── */}
            {altSekme !== 'dosya' && (
                <div>
                    {moduller.find((m) => m.id === altSekme)?.render?.()}
                </div>
            )}

            {/* ── Dosya içeriği ──────────────────────────── */}
            {altSekme === 'dosya' && (
                <div className="space-y-4">

                    {/* Durum göstergesi */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <Kutu etiket="Dosyadaki Kayıt" deger={durum.kayitSayisi} renk="var(--brand)" />
                        <Kutu etiket="Zorunlu Belge" deger={durum.zorunluSayisi} renk="var(--ink-3)" />
                        <Kutu etiket="Tamamlanan" deger={durum.tamamlanan} renk="var(--ok)" />
                        <Kutu
                            etiket="Eksik"
                            deger={durum.eksikler.length}
                            renk={durum.eksikler.length ? 'var(--danger)' : 'var(--ok)'}
                        />
                    </div>

                    <div className="srf p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="eyebrow">Denetime Hazırlık</span>
                            <span className="num text-sm">%{durum.oran}</span>
                        </div>
                        <div
                            className="bar"
                            style={{ '--acc': durum.oran >= 90 ? 'var(--ok)' : durum.oran >= 60 ? 'var(--warn)' : 'var(--danger)' }}
                        >
                            <i style={{ width: `${durum.oran}%` }} />
                        </div>
                    </div>

                    {/* Araç çubuğu */}
                    <div className="srf p-3 flex flex-wrap items-center gap-2">
                        <button onClick={() => setFormAcik(true)} className="b b-fill b-brand b-sm">
                            <Plus size={13} /> Belge Kaydı Ekle
                        </button>
                        <button onClick={otomatikBagla} className="b b-line b-sm">
                            <Link2 size={13} /> Modülleri Bağla
                        </button>
                        <button onClick={icerikPdf} className="b b-line b-sm">
                            <Download size={13} /> İçerik Dökümü
                        </button>
                        <button onClick={sirtlikPdf} className="b b-line b-sm">
                            <Printer size={13} /> Sırtlık PDF
                        </button>
                        <div className="relative flex-1 min-w-[150px]">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
                            <input
                                value={arama}
                                onChange={(e) => setArama(e.target.value)}
                                placeholder="Dosyada ara…"
                                className="fld pl-8"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Aranan belgeler */}
                        <div className="srf p-4">
                            <p className="eyebrow mb-2">Denetimde Aranan Belgeler</p>
                            <div className="space-y-1.5">
                                {t.belgeler.map((b) => {
                                    const eksikMi = durum.eksikler.some((e) => e.ad === b.ad);
                                    return (
                                        <div
                                            key={b.ad}
                                            className={`flex items-start gap-2 rounded-xl border p-2.5 ${
                                                !b.zorunlu ? 'border-line bg-surface-2'
                                                    : eksikMi ? 'border-danger bg-danger-soft' : 'border-ok bg-ok-soft'
                                            }`}
                                        >
                                            {b.zorunlu
                                                ? (eksikMi
                                                    ? <AlertTriangle size={13} className="text-danger shrink-0 mt-0.5" />
                                                    : <CheckCircle2 size={13} className="text-ok shrink-0 mt-0.5" />)
                                                : <FileText size={13} className="text-ink-3 shrink-0 mt-0.5" />}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[12px] font-bold text-ink leading-snug">{b.ad}</p>
                                                <p className="text-[10px] text-ink-3">
                                                    {b.zorunlu ? 'Zorunlu' : 'İsteğe bağlı'}
                                                    {b.kaynak && ` · ${KAYNAK_ETIKET[b.kaynak] || b.kaynak}`}
                                                </p>
                                                {b.not && (
                                                    <p className="text-[10px] text-ink-2 mt-1 leading-snug italic">{b.not}</p>
                                                )}
                                            </div>
                                            {b.zorunlu && eksikMi && (
                                                <button
                                                    onClick={() => { setFormAcik(b.ad); }}
                                                    className="b b-line b-sm shrink-0"
                                                    title="Bu belgeyi dosyaya ekle"
                                                >
                                                    Ekle
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Dosyadaki kayıtlar */}
                        <div className="srf p-4">
                            <p className="eyebrow mb-2">Dosyadaki Kayıtlar ({kayitlar.length})</p>
                            {kayitlar.length === 0 ? (
                                <div className="srf-in p-8 text-center">
                                    <FolderOpen size={26} className="text-ink-3 mx-auto mb-2" />
                                    <p className="text-xs text-ink-3 leading-snug">
                                        Bu dosyada henüz kayıt yok. Belge ekleyin ya da
                                        “Modülleri Bağla” ile mevcut çalışmaları aktarın.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
                                    {kayitlar.map((k) => (
                                        <div key={k.id} className="srf-in p-3 flex items-start gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[12px] font-bold text-ink leading-snug">{k.baslik}</p>
                                                {k.aciklama && (
                                                    <p className="text-[11px] text-ink-2 mt-0.5 leading-snug">{k.aciklama}</p>
                                                )}
                                                <p className="text-[10px] text-ink-3 mt-1">
                                                    {k.tarih}
                                                    {k.ogrenci && ` · ${k.ogrenci}`}
                                                    {k.sinif && ` (${k.sinif})`}
                                                    {k.kaynak !== 'elle' && ` · ${KAYNAK_ETIKET[k.kaynak] || k.kaynak}`}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => { arsiv.sil(k.id); yenile(); setToast?.('Kayıt silindi'); }}
                                                aria-label="Sil"
                                                className="b b-bare b-icon shrink-0"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {formAcik && (
                <KayitFormu
                    klasor={t}
                    yil={yil}
                    hazirBaslik={typeof formAcik === 'string' ? formAcik : ''}
                    onKapat={() => setFormAcik(false)}
                    onKaydet={(veri) => {
                        arsiv.ekle({ ...veri, klasor: klasorNo, yil, ekleyen: user?.name || '' });
                        setFormAcik(false);
                        yenile();
                        setToast?.('Belge kaydı eklendi');
                    }}
                />
            )}
        </div>
    );
};

// ── Küçük parçalar ────────────────────────────────────────
const Kutu = ({ etiket, deger, renk }) => (
    <div className="srf srf-accent p-3.5" style={{ '--acc': renk }}>
        <p className="eyebrow">{etiket}</p>
        <p className="num text-2xl mt-1" style={{ color: renk }}>{deger}</p>
    </div>
);

const KayitFormu = ({ klasor, yil, hazirBaslik = '', onKapat, onKaydet }) => {
    const [f, setF] = useState({
        // Eksik belge satırındaki "Ekle" düğmesinden gelindiyse başlık
        // hazır dolu gelir — danışman aynı adı elle yazmak zorunda kalmaz.
        baslik: hazirBaslik,
        aciklama: '', ogrenci: '', sinif: '',
        tarih: new Date().toISOString().slice(0, 10),
    });
    const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

    return (
        <div className="fixed inset-0 z-modal-high bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="srf srf-4 w-full max-w-md max-h-[88vh] overflow-y-auto p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="eyebrow">{klasor.no}. Dosya · {yil}</p>
                        <h3 className="h3">{klasor.ad}</h3>
                    </div>
                    <button onClick={onKapat} aria-label="Kapat" className="b b-bare b-icon shrink-0">
                        <X size={17} />
                    </button>
                </div>

                <div>
                    <label className="eyebrow block mb-1">Belge / Çalışma Adı *</label>
                    <input value={f.baslik} onChange={set('baslik')} className="fld" placeholder="Örn: I. dönem faaliyet raporu" />
                    {/* Hazır etiketler: eksik denetimi ad eşleşmesine baktığı için
                        buradan seçmek en güvenli yol */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                        {klasor.belgeler.slice(0, 8).map((b) => (
                            <button
                                key={b.ad}
                                onClick={() => setF((p) => ({ ...p, baslik: b.ad }))}
                                className="text-[10px] font-bold px-2 py-1 rounded-lg border border-line text-ink-2 hover:border-brand hover:text-brand transition"
                            >
                                {b.ad.length > 28 ? `${b.ad.slice(0, 28)}…` : b.ad}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="eyebrow block mb-1">Açıklama</label>
                    <textarea value={f.aciklama} onChange={set('aciklama')} rows={2} className="fld" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="eyebrow block mb-1">İlgili Öğrenci</label>
                        <input value={f.ogrenci} onChange={set('ogrenci')} className="fld" />
                    </div>
                    <div>
                        <label className="eyebrow block mb-1">Sınıf / Şube</label>
                        <input value={f.sinif} onChange={set('sinif')} className="fld" placeholder="9/A" />
                    </div>
                </div>

                <div>
                    <label className="eyebrow block mb-1">Tarih</label>
                    <input type="date" value={f.tarih} onChange={set('tarih')} className="fld" />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                    <button onClick={onKapat} className="b b-line">İptal</button>
                    <button
                        onClick={() => f.baslik.trim() && onKaydet(f)}
                        disabled={!f.baslik.trim()}
                        className="b b-fill b-brand"
                    >
                        Kaydet
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DecimalFolderTab;
