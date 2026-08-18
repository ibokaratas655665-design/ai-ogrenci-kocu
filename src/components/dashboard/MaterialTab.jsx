import React, { useState, useMemo, useCallback } from 'react';
import {
    FileText, Download, Trash2, Search, Sparkles, Archive,
    AlertTriangle, Eye, X, Copy,
} from 'lucide-react';
import { MATERYAL_TURLERI, turBul, satirlar } from '../../data/materialTemplates';
import { belgeUret, parca, kurumUyarisi } from '../../utils/mebDocument';
import { klasorBul } from '../../data/pdrDecimalPlan';
import arsiv from '../../services/pdrArchiveService';
import Modal from '../ui/Modal';

/**
 * 🎨 REHBERLİK MATERYAL ÜRETİCİ
 *
 * Bu ekran eskiden bir maketti: "Oluştur" düğmesi üç saniye bekleyip
 * listeye satır ekliyor, indirme ve silme düğmeleri hiçbir şey yapmıyor,
 * hiçbir kayıt saklanmıyordu. Artık:
 *
 *   · Materyal, seçilen şablonun alanlarından GERÇEK bir belge gövdesi
 *     üretir ve resmî yazı düzeninde PDF olarak iner.
 *   · Üretilen materyaller localStorage'da saklanır; yeniden indirilebilir,
 *     düzenlenmek üzere geri yüklenebilir, silinebilir.
 *   · Her materyal ait olduğu desimal dosyaya tek tıkla kaydedilir —
 *     ayrıca "dosyala" işi kalmaz.
 */

const KEY = 'pdr_materials';

const depoOku = () => {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw || !raw.trim()) return [];
        const v = JSON.parse(raw);
        return Array.isArray(v) ? v : [];
    } catch {
        return [];
    }
};

const depoYaz = (liste) => {
    localStorage.setItem(KEY, JSON.stringify(liste));
    try { window.firebaseSync?.syncKey?.(KEY); } catch { /* senkron yoksa sorun değil */ }
};

/** Şablon + form verisinden resmî belge gövdesi üretir. */
const govdeUret = (tur, f) => {
    const p = [];

    p.push(parca.alanlar([
        ['Materyal Türü', tur.ad],
        ['Konu', f.konu || '—'],
        f.hedef ? ['Hedef Kitle', f.hedef] : null,
        f.sure ? ['Süre', f.sure] : null,
        ['Hazırlanma Tarihi', new Date().toLocaleDateString('tr-TR')],
    ].filter(Boolean)));

    if (f.kazanim) p.push(parca.bolum('Kazanımlar / Amaç', parca.liste(satirlar(f.kazanim))));
    if (f.mesajlar) p.push(parca.bolum('Ana Mesajlar', parca.liste(satirlar(f.mesajlar))));
    if (f.materyal) p.push(parca.bolum('Kullanılacak Materyaller', parca.liste(satirlar(f.materyal))));
    if (f.surec) p.push(parca.bolum('Etkinlik Süreci', parca.liste(satirlar(f.surec))));
    if (f.yonerge) p.push(parca.bolum('Yönerge', parca.kutu(f.yonerge)));

    // Çalışma kâğıdında öğrencinin YAZACAĞI yer olmalı — sorular boş
    // cevap kutusuyla birlikte basılır, yoksa kâğıt kullanılamaz.
    if (f.sorular) {
        p.push(parca.bolum('Sorular', parca.tablo(
            ['#', 'Soru', 'Cevap'],
            satirlar(f.sorular).map((s, i) => [String(i + 1), s, '']),
            ['6%', '48%', '46%']
        )));
    }

    if (f.slaytlar) {
        p.push(parca.bolum('Sunum Akışı', parca.tablo(
            ['Slayt', 'Başlık'],
            satirlar(f.slaytlar).map((s, i) => [String(i + 1), s]),
            ['15%', '85%']
        )));
    }

    if (f.oneriler) p.push(parca.bolum('Öneriler', parca.liste(satirlar(f.oneriler))));
    if (f.degerlendirme) p.push(parca.bolum('Değerlendirme', parca.kutu(f.degerlendirme)));
    if (f.iletisim) p.push(parca.bolum('İletişim', parca.kutu(f.iletisim)));

    return p.join('');
};

const bosForm = (tur) =>
    Object.fromEntries(tur.alanlar.map((a) => [a.k, '']));

const MaterialTab = ({ setToast }) => {
    const [turId, setTurId] = useState(MATERYAL_TURLERI[0].id);
    const tur = turBul(turId);

    const [form, setForm] = useState(() => bosForm(MATERYAL_TURLERI[0]));
    const [arama, setArama] = useState('');
    const [uretiliyor, setUretiliyor] = useState(false);
    const [onizleme, setOnizleme] = useState(null);
    const [surum, setSurum] = useState(0);

    const yenile = useCallback(() => setSurum((v) => v + 1), []);

    const materyaller = useMemo(() => {
        const hepsi = depoOku();
        const q = arama.trim().toLocaleLowerCase('tr-TR');
        if (!q) return hepsi;
        return hepsi.filter((m) =>
            [m.baslik, m.turAd, m.hedef].join(' ').toLocaleLowerCase('tr-TR').includes(q));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [arama, surum]);

    const turDegistir = (id) => {
        setTurId(id);
        setForm(bosForm(turBul(id)));
    };

    const yaz = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const eksikAlanlar = tur.alanlar.filter((a) => a.zorunlu && !String(form[a.k] || '').trim());

    // ── Üretim ────────────────────────────────────────────
    const uret = async () => {
        if (eksikAlanlar.length) {
            setToast?.(`Zorunlu alan eksik: ${eksikAlanlar.map((a) => a.ad).join(', ')}`);
            return;
        }
        setUretiliyor(true);
        try {
            const uyari = kurumUyarisi();
            if (uyari) setToast?.(uyari);

            const govde = govdeUret(tur, form);
            const dosyaAdi = `${tur.ad.replace(/\s+/g, '_')}_${(form.konu || '').slice(0, 30).replace(/\s+/g, '_')}.pdf`;

            await belgeUret({
                belgeAdi: tur.ad,
                konu: form.konu,
                govde,
                kvkk: false,
                belgeKodu: tur.dosya,
                dosyaAdi,
            });

            const kayit = {
                id: `mat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                turId: tur.id,
                turAd: tur.ad,
                icon: tur.icon,
                dosya: tur.dosya,
                baslik: form.konu,
                hedef: form.hedef || '',
                veri: { ...form },
                tarih: new Date().toISOString(),
                arsivlendi: false,
            };
            depoYaz([kayit, ...depoOku()]);
            yenile();
            setToast?.('Materyal üretildi ve PDF indirildi');
        } catch (e) {
            setToast?.(`Materyal üretilemedi: ${e?.message || 'bilinmeyen hata'}`);
        } finally {
            setUretiliyor(false);
        }
    };

    // ── Kayıtlı materyal işlemleri ────────────────────────
    const tekrarIndir = async (m) => {
        const t = turBul(m.turId);
        await belgeUret({
            belgeAdi: t.ad,
            konu: m.baslik,
            govde: govdeUret(t, m.veri || {}),
            kvkk: false,
            belgeKodu: t.dosya,
            dosyaAdi: `${t.ad.replace(/\s+/g, '_')}_${String(m.baslik).slice(0, 30).replace(/\s+/g, '_')}.pdf`,
        });
        setToast?.('PDF yeniden indirildi');
    };

    const dosyala = (m) => {
        const klasor = klasorBul(m.dosya);
        const eklendi = arsiv.ekle({
            klasor: m.dosya,
            baslik: `${m.turAd} — ${m.baslik}`,
            aciklama: m.hedef ? `Hedef: ${m.hedef}` : '',
            kaynak: 'plan',
            kaynakId: `materyal_${m.id}`,
        });
        if (!eklendi) {
            setToast?.('Bu materyal zaten dosyalanmış');
            return;
        }
        depoYaz(depoOku().map((x) => (x.id === m.id ? { ...x, arsivlendi: true } : x)));
        yenile();
        setToast?.(`${klasor?.no}. ${klasor?.ad} dosyasına kaydedildi`);
    };

    const duzenlemeyeAl = (m) => {
        setTurId(m.turId);
        setForm({ ...bosForm(turBul(m.turId)), ...(m.veri || {}) });
        setOnizleme(null);
        setToast?.('Materyal forma yüklendi — düzenleyip yeniden üretebilirsiniz');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const sil = (id) => {
        depoYaz(depoOku().filter((m) => m.id !== id));
        yenile();
        setToast?.('Materyal silindi');
    };

    return (
        <div className="space-y-5">

            {/* ── Başlık ─────────────────────────────────── */}
            <div className="flex items-start gap-3">
                <span className="sec-icon" style={{ '--acc': 'var(--c4)' }}>
                    <Sparkles size={16} />
                </span>
                <div className="min-w-0">
                    <h3 className="h3">Rehberlik Materyal Üreticisi</h3>
                    <p className="text-[11px] text-ink-3 leading-snug">
                        Broşür, pano metni, etkinlik planı ve çalışma kâğıdı üretir; çıktı resmî
                        yazı düzeninde PDF olarak iner ve ilgili desimal dosyaya kaydedilir.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                {/* ── Üretim formu ───────────────────────── */}
                <div className="lg:col-span-2 space-y-3">
                    <div className="srf p-4 space-y-3">
                        <p className="eyebrow">Materyal Türü</p>
                        <div className="grid grid-cols-2 gap-2">
                            {MATERYAL_TURLERI.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => turDegistir(t.id)}
                                    className={`flex flex-col items-start gap-1 p-2.5 rounded-xl border text-left transition ${
                                        turId === t.id
                                            ? 'bg-brand-soft border-brand-line'
                                            : 'bg-surface-2 border-line hover:bg-surface-3'
                                    }`}
                                >
                                    <span className="text-base leading-none">{t.icon}</span>
                                    <span className={`text-[11px] font-bold leading-tight ${turId === t.id ? 'text-brand' : 'text-ink-2'}`}>
                                        {t.ad}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <p className="text-[11px] text-ink-3 leading-snug">
                            {tur.aciklama}
                        </p>
                    </div>

                    <div className="srf p-4 space-y-3">
                        {tur.alanlar.map((a) => (
                            <label key={a.k} className="block">
                                <span className="eyebrow block mb-1">
                                    {a.ad}{a.zorunlu && <span className="text-danger"> *</span>}
                                </span>
                                {a.cokSatir ? (
                                    <textarea
                                        className="fld w-full min-h-[72px]"
                                        value={form[a.k] || ''}
                                        placeholder={a.ipucu || 'Her satıra bir madde'}
                                        onChange={(e) => yaz(a.k, e.target.value)}
                                    />
                                ) : (
                                    <input
                                        className="fld w-full"
                                        value={form[a.k] || ''}
                                        placeholder={a.ipucu || ''}
                                        onChange={(e) => yaz(a.k, e.target.value)}
                                    />
                                )}
                            </label>
                        ))}

                        {eksikAlanlar.length > 0 && (
                            <div className="flex items-start gap-2 rounded-xl border border-warn-line bg-warn-soft p-2.5">
                                <AlertTriangle size={13} className="text-warn shrink-0 mt-0.5" />
                                <p className="text-[11px] text-ink-2 leading-snug">
                                    Doldurulması gereken: {eksikAlanlar.map((a) => a.ad).join(', ')}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={uret}
                            disabled={uretiliyor || eksikAlanlar.length > 0}
                            className="b b-fill b-brand w-full disabled:opacity-50"
                        >
                            {uretiliyor ? 'Üretiliyor…' : <><Sparkles size={14} /> Materyali Üret ve PDF İndir</>}
                        </button>
                    </div>
                </div>

                {/* ── Üretilen materyaller ───────────────── */}
                <div className="lg:col-span-3 space-y-3">
                    <div className="srf p-3 flex flex-wrap items-center gap-2">
                        <span className="eyebrow">Üretilen Materyaller</span>
                        <span className="badge">{materyaller.length}</span>
                        <div className="relative flex-1 min-w-[150px]">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
                            <input
                                value={arama}
                                onChange={(e) => setArama(e.target.value)}
                                placeholder="Materyal ara…"
                                className="fld pl-8"
                            />
                        </div>
                    </div>

                    {materyaller.length === 0 ? (
                        <div className="srf p-10 text-center">
                            <FileText size={28} className="text-ink-3 mx-auto mb-2" />
                            <p className="text-xs font-bold text-ink-3">Henüz materyal üretilmedi</p>
                            <p className="text-[11px] text-ink-3 mt-1 max-w-xs mx-auto leading-snug">
                                Soldaki formu doldurup üretin; çıktı hem PDF olarak iner hem burada
                                saklanır, sonra tekrar indirilebilir.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {materyaller.map((m) => {
                                const klasor = klasorBul(m.dosya);
                                return (
                                    <div key={m.id} className="srf srf-accent p-4" style={{ '--acc': 'var(--c4)' }}>
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <span className="text-lg leading-none">{m.icon}</span>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => setOnizleme(m)}
                                                    aria-label="Önizle"
                                                    title="Önizle"
                                                    className="b b-bare b-icon b-sm"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button
                                                    onClick={() => tekrarIndir(m)}
                                                    aria-label="PDF indir"
                                                    title="PDF indir"
                                                    className="b b-bare b-icon b-sm"
                                                >
                                                    <Download size={14} />
                                                </button>
                                                <button
                                                    onClick={() => sil(m.id)}
                                                    aria-label="Sil"
                                                    title="Sil"
                                                    className="b b-bare b-icon b-sm"
                                                >
                                                    <Trash2 size={14} className="text-danger" />
                                                </button>
                                            </div>
                                        </div>

                                        <p className="eyebrow">{m.turAd}</p>
                                        <p className="t-title text-[13px] leading-tight">{m.baslik}</p>
                                        {m.hedef && (
                                            <p className="text-[11px] text-ink-3 mt-0.5">{m.hedef}</p>
                                        )}
                                        <p className="text-[10px] text-ink-3 mt-1">
                                            {new Date(m.tarih).toLocaleDateString('tr-TR')}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-1.5 mt-3">
                                            {m.arsivlendi ? (
                                                <span className="badge badge-ok">
                                                    <Archive size={10} /> {klasor?.no}. dosyada
                                                </span>
                                            ) : (
                                                <button onClick={() => dosyala(m)} className="b b-line b-sm">
                                                    <Archive size={12} /> {klasor?.no}. Dosyaya Kaydet
                                                </button>
                                            )}
                                            <button onClick={() => duzenlemeyeAl(m)} className="b b-bare b-sm">
                                                <Copy size={12} /> Kopyala / Düzenle
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Önizleme penceresi ─────────────────────── */}
            {onizleme && (
                <Modal
                    acik
                    onClose={() => setOnizleme(null)}
                    baslikGizle
                    genislik="lg"
                    govdeClassName="p-0 flex flex-col overflow-hidden"
                >
                    <div className="shrink-0 flex items-start gap-3 p-5 border-b border-line">
                        <span className="text-2xl leading-none">{onizleme.icon}</span>
                        <div className="min-w-0 flex-1">
                            <p className="eyebrow">{onizleme.turAd}</p>
                            <h3 className="h2">{onizleme.baslik}</h3>
                        </div>
                        <button
                            onClick={() => setOnizleme(null)}
                            aria-label="Kapat"
                            className="b b-bare b-icon shrink-0"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-3">
                        {turBul(onizleme.turId).alanlar.map((a) => {
                            const v = onizleme.veri?.[a.k];
                            if (!String(v || '').trim()) return null;
                            return (
                                <div key={a.k}>
                                    <p className="eyebrow mb-1">{a.ad}</p>
                                    {a.cokSatir ? (
                                        <ul className="list-disc pl-5 space-y-0.5">
                                            {satirlar(v).map((s, i) => (
                                                <li key={i} className="text-[12px] text-ink leading-snug">{s}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-[12px] text-ink leading-snug">{v}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-2 p-4 border-t border-line">
                        <button onClick={() => duzenlemeyeAl(onizleme)} className="b b-line flex-1">
                            Düzenle
                        </button>
                        <button onClick={() => tekrarIndir(onizleme)} className="b b-fill b-brand flex-1">
                            <Download size={14} /> PDF İndir
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default MaterialTab;
