import React, { useState, useMemo, useCallback } from 'react';
import {
    ClipboardList, Plus, X, CheckCircle2, PlayCircle, Trash2,
    AlertTriangle, Inbox, Send,
} from 'lucide-react';
import gorevler, { DURUMLAR, ONCELIKLER } from '../../services/coachTaskService';
import { BOLUMLER, BOLUM_LISTESI, isAnaKoc, erisilenBolumler } from '../../services/accessControl';
import Modal from '../ui/Modal';

/**
 * 🧑‍🏫 KOÇ GÖREV MERKEZİ
 *
 * İki yüzü var:
 *   · Ana koç → "Atadıklarım": koçlara iş verir, ilerlemeyi izler
 *   · Her koç → "Bana Atananlar": kendine düşen işi görür, durumunu günceller
 *
 * Görev bir BÖLÜM ve SEKME ile birlikte atanır. Böylece koç "PDR
 * bölümü → Desimal Dosya sekmesinde eksik belgeleri tamamla" gibi
 * yerini belli bir iş alır; görev kartındaki düğme doğrudan o sekmeyi açar.
 */

const safeParse = (key, def = []) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw || !raw.trim()) return def;
        const v = JSON.parse(raw);
        return Array.isArray(v) ? v : def;
    } catch {
        return def;
    }
};

const CoachTaskCenter = ({ user, setToast, sekmeler = [], onSekmeyeGit }) => {
    const anaKoc = isAnaKoc(user);
    const [gorunum, setGorunum] = useState(anaKoc ? 'atadiklarim' : 'banaAtanan');
    const [formAcik, setFormAcik] = useState(false);
    const [surum, setSurum] = useState(0);

    const yenile = useCallback(() => setSurum((v) => v + 1), []);

    const koclar = useMemo(
        () => safeParse('managed_coaches').filter((c) => String(c.id) !== String(user?.id)),
        [user?.id]
    );

    const atadiklarim = useMemo(
        // eslint-disable-next-line react-hooks/exhaustive-deps
        () => gorevler.atananlar(user?.id), [user?.id, surum]
    );
    const banaAtanan = useMemo(
        // eslint-disable-next-line react-hooks/exhaustive-deps
        () => gorevler.kocGorevleri(user?.id), [user?.id, surum]
    );

    const liste = gorunum === 'atadiklarim' ? atadiklarim : banaAtanan;

    const durumGuncelle = (id, durum) => {
        if (gorevler.durumDegistir(id, durum)) {
            yenile();
            setToast?.(`Görev durumu: ${DURUMLAR[durum].ad}`);
        }
    };

    const gorevSil = (id) => {
        gorevler.sil(id);
        yenile();
        setToast?.('Görev silindi');
    };

    return (
        <div className="space-y-4">

            {/* ── Başlık ─────────────────────────────────── */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                    <span className="sec-icon" style={{ '--acc': 'var(--c4)' }}>
                        <ClipboardList size={16} />
                    </span>
                    <div className="min-w-0">
                        <h3 className="h3">Koç Görev Merkezi</h3>
                        <p className="text-[11px] text-ink-3 leading-snug">
                            Görevler bölüm ve sekmeye bağlı atanır; koç işin nerede
                            yapılacağını görev kartından açar.
                        </p>
                    </div>
                </div>

                {anaKoc && (
                    <button onClick={() => setFormAcik(true)} className="b b-fill b-brand">
                        <Plus size={14} /> Görev Ata
                    </button>
                )}
            </div>

            {/* ── Görünüm anahtarı ───────────────────────── */}
            <div className="tabbar">
                {anaKoc && (
                    <button
                        onClick={() => setGorunum('atadiklarim')}
                        aria-selected={gorunum === 'atadiklarim'}
                        className={`tb ${gorunum === 'atadiklarim' ? 'is-on' : ''}`}
                    >
                        <Send size={15} /> Atadıklarım
                        <span className="badge ml-1">{atadiklarim.length}</span>
                    </button>
                )}
                <button
                    onClick={() => setGorunum('banaAtanan')}
                    aria-selected={gorunum === 'banaAtanan'}
                    className={`tb ${gorunum === 'banaAtanan' ? 'is-on' : ''}`}
                >
                    <Inbox size={15} /> Bana Atanan Görevler
                    <span className="badge ml-1">{banaAtanan.length}</span>
                </button>
            </div>

            {/* ── Görev listesi ──────────────────────────── */}
            {liste.length === 0 ? (
                <div className="srf p-10 text-center">
                    <ClipboardList size={28} className="mx-auto text-ink-3 mb-2" />
                    <p className="text-xs text-ink-3">
                        {gorunum === 'atadiklarim'
                            ? 'Henüz görev atamadınız. "Görev Ata" ile başlayın.'
                            : 'Size atanmış görev yok.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {liste.map((g) => {
                        const d = DURUMLAR[g.durum] || DURUMLAR.atandi;
                        const o = ONCELIKLER[g.oncelik] || ONCELIKLER.normal;
                        const bugun = new Date().toISOString().slice(0, 10);
                        const gecikti = g.sonTarih && g.sonTarih < bugun && g.durum !== 'tamam' && g.durum !== 'iptal';

                        return (
                            <div
                                key={g.id}
                                className="srf srf-accent p-4"
                                style={{ '--acc': gecikti ? 'var(--danger)' : d.renk }}
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex flex-wrap gap-1.5">
                                        <span
                                            className="badge"
                                            style={{ color: d.renk, borderColor: d.renk }}
                                        >
                                            {d.ad}
                                        </span>
                                        <span className="badge" style={{ color: o.renk, borderColor: o.renk }}>
                                            {o.ad}
                                        </span>
                                        <span className="badge">
                                            {BOLUMLER[g.bolum]?.kisa || g.bolum}
                                        </span>
                                        {g.sekmeAd && <span className="badge">{g.sekmeAd}</span>}
                                        {gecikti && (
                                            <span className="badge badge-danger">
                                                <AlertTriangle size={10} /> Gecikti
                                            </span>
                                        )}
                                    </div>

                                    {anaKoc && gorunum === 'atadiklarim' && (
                                        <button
                                            onClick={() => gorevSil(g.id)}
                                            aria-label="Görevi sil"
                                            className="b b-bare b-icon b-sm shrink-0"
                                        >
                                            <Trash2 size={13} className="text-danger" />
                                        </button>
                                    )}
                                </div>

                                <p className="t-title text-[13px] leading-tight">{g.baslik}</p>
                                {g.aciklama && (
                                    <p className="text-[11px] text-ink-2 mt-1 leading-snug">{g.aciklama}</p>
                                )}

                                <p className="text-[10px] text-ink-3 mt-2">
                                    {gorunum === 'atadiklarim'
                                        ? `Atanan: ${g.kocAd || `#${g.kocId}`}`
                                        : `Atayan: ${g.atayanAd || 'Ana koç'}`}
                                    {g.sonTarih && ` · Son tarih: ${g.sonTarih}`}
                                </p>

                                {/* İşlem düğmeleri */}
                                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                                    {g.sekme && onSekmeyeGit && (
                                        <button
                                            onClick={() => onSekmeyeGit(g.bolum, g.sekme)}
                                            className="b b-line b-sm"
                                        >
                                            Sekmeye Git
                                        </button>
                                    )}
                                    {gorunum === 'banaAtanan' && g.durum === 'atandi' && (
                                        <button onClick={() => durumGuncelle(g.id, 'basladi')} className="b b-line b-sm">
                                            <PlayCircle size={13} /> Başladım
                                        </button>
                                    )}
                                    {gorunum === 'banaAtanan' && g.durum !== 'tamam' && (
                                        <button onClick={() => durumGuncelle(g.id, 'tamam')} className="b b-fill b-ok b-sm">
                                            <CheckCircle2 size={13} /> Tamamlandı
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {formAcik && (
                <GorevFormu
                    koclar={koclar}
                    sekmeler={sekmeler}
                    user={user}
                    onKapat={() => setFormAcik(false)}
                    onKaydet={(veri) => {
                        const n = gorevler.ata({ ...veri, atayan: user });
                        setFormAcik(false);
                        yenile();
                        setToast?.(n ? `${n} koça görev atandı` : 'Görev atanamadı');
                    }}
                />
            )}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════

const GorevFormu = ({ koclar, sekmeler, user, onKapat, onKaydet }) => {
    const bolumler = erisilenBolumler(user);
    const [form, setForm] = useState({
        baslik: '', aciklama: '', bolum: bolumler[0] || 'kocluk',
        sekme: '', sonTarih: '', oncelik: 'normal',
    });
    const [secili, setSecili] = useState(() => new Set());

    const yaz = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    // Sekme listesi bölüme göre süzülür: koçluk görevine PDR sekmesi,
    // PDR görevine koçluk sekmesi atanamaz.
    const bolumSekmeleri = sekmeler.filter(
        (s) => !s.bolumler || s.bolumler.includes(form.bolum)
    );

    const kocSec = (id) => setSecili((s) => {
        const y = new Set(s);
        const k = String(id);
        if (y.has(k)) y.delete(k); else y.add(k);
        return y;
    });

    const kaydet = () => {
        const sekmeAd = bolumSekmeleri.find((s) => s.id === form.sekme)?.label || null;
        const kocAdlari = Object.fromEntries(
            koclar.map((c) => [String(c.id), c.name || ''])
        );
        onKaydet({ ...form, sekmeAd, kocIdler: [...secili], kocAdlari });
    };

    const gecerli = form.baslik.trim() && secili.size > 0;

    return (
        <Modal
            acik
            onClose={onKapat}
            baslikGizle
            genislik="lg"
            govdeClassName="p-0 flex flex-col overflow-hidden"
        >

            <div className="shrink-0 flex items-start gap-3 p-5 border-b border-line">
                <span className="sec-icon" style={{ '--acc': 'var(--brand)' }}>
                    <ClipboardList size={16} />
                </span>
                <div className="min-w-0 flex-1">
                    <h3 className="h2">Koça Görev Ata</h3>
                    <p className="text-[11px] text-ink-3 mt-0.5 leading-snug">
                        Görevi bir bölüm ve sekmeye bağlayın; koç işi nerede yapacağını görsün.
                    </p>
                </div>
                <button onClick={onKapat} aria-label="Kapat" className="b b-bare b-icon shrink-0">
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">

                <label className="block">
                    <span className="eyebrow block mb-1">Görev Başlığı *</span>
                    <input
                        className="fld w-full"
                        value={form.baslik}
                        onChange={(e) => yaz('baslik', e.target.value)}
                        placeholder="Örn. 9. sınıf risk haritalarını tamamla"
                    />
                </label>

                <label className="block">
                    <span className="eyebrow block mb-1">Açıklama</span>
                    <textarea
                        className="fld w-full min-h-[70px]"
                        value={form.aciklama}
                        onChange={(e) => yaz('aciklama', e.target.value)}
                        placeholder="Ne yapılacak, nelere dikkat edilecek?"
                    />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block">
                        <span className="eyebrow block mb-1">Bölüm</span>
                        <select
                            className="fld w-full"
                            value={form.bolum}
                            onChange={(e) => { yaz('bolum', e.target.value); yaz('sekme', ''); }}
                        >
                            {BOLUM_LISTESI.filter((b) => bolumler.includes(b.id)).map((b) => (
                                <option key={b.id} value={b.id}>{b.ad}</option>
                            ))}
                        </select>
                    </label>

                    <label className="block">
                        <span className="eyebrow block mb-1">Sekme (isteğe bağlı)</span>
                        <select
                            className="fld w-full"
                            value={form.sekme}
                            onChange={(e) => yaz('sekme', e.target.value)}
                        >
                            <option value="">Sekmeye bağlama</option>
                            {bolumSekmeleri.map((s) => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                        </select>
                    </label>

                    <label className="block">
                        <span className="eyebrow block mb-1">Son Tarih</span>
                        <input
                            type="date"
                            className="fld w-full"
                            value={form.sonTarih}
                            onChange={(e) => yaz('sonTarih', e.target.value)}
                        />
                    </label>

                    <label className="block">
                        <span className="eyebrow block mb-1">Öncelik</span>
                        <select
                            className="fld w-full"
                            value={form.oncelik}
                            onChange={(e) => yaz('oncelik', e.target.value)}
                        >
                            {Object.values(ONCELIKLER).map((o) => (
                                <option key={o.id} value={o.id}>{o.ad}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="eyebrow">Görevi Alacak Koçlar *</span>
                        {koclar.length > 0 && (
                            <button
                                onClick={() => setSecili((s) => (
                                    s.size === koclar.length ? new Set() : new Set(koclar.map((c) => String(c.id)))
                                ))}
                                className="text-[11px] font-bold text-brand hover:underline"
                            >
                                {secili.size === koclar.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                            </button>
                        )}
                    </div>

                    {koclar.length === 0 ? (
                        <div className="srf-in p-6 text-center">
                            <p className="text-xs text-ink-3">
                                Henüz koç eklenmemiş. Koç Yönetimi sekmesinden koç ekleyin.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                            {koclar.map((c) => {
                                const on = secili.has(String(c.id));
                                // Koçun bu bölüme erişimi yoksa görev anlamsız olur
                                const kocBolumleri = c.sections || ['kocluk'];
                                const erisimVar = kocBolumleri.includes(form.bolum);
                                return (
                                    <label
                                        key={c.id}
                                        className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer text-xs transition ${on ? 'bg-brand-soft border-brand-line' : 'bg-surface-2 border-line hover:bg-surface-3'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={on}
                                            onChange={() => kocSec(c.id)}
                                            className="accent-indigo-600 mt-0.5"
                                        />
                                        <span className="min-w-0">
                                            <span className="font-bold text-ink block truncate">{c.name}</span>
                                            <span className="text-ink-3 block truncate">
                                                {c.coachRole === 'masterCoach' ? 'Yönetici Koç' : 'Standart Koç'}
                                            </span>
                                            {!erisimVar && (
                                                <span className="text-warn block mt-0.5 leading-snug">
                                                    ⚠️ Bu koçun {BOLUMLER[form.bolum]?.kisa} bölümüne erişimi yok
                                                </span>
                                            )}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="pencere-alt-cubuk bg-surface flex items-center gap-2 p-4 border-t border-line">
                <button onClick={onKapat} className="b b-line flex-1">İptal</button>
                <button
                    onClick={kaydet}
                    disabled={!gecerli}
                    className="b b-fill b-brand flex-1 disabled:opacity-50"
                >
                    Görevi Ata ({secili.size})
                </button>
            </div>
        </Modal>
    );
};

export default CoachTaskCenter;
