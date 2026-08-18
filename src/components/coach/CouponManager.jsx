import React, { useState, useMemo, useCallback } from 'react';
import {
    Ticket, Plus, Copy, Trash2, Check, X, Power, AlertTriangle,
} from 'lucide-react';
import coupons from '../../services/couponService';
import { PLANLAR, tl } from '../../data/pricingPlans';
import Modal from '../ui/Modal';

/**
 * 🎟️ KUPON YÖNETİMİ
 *
 * Koç, kendi çevresine dağıtacağı indirim kuponlarını buradan üretir
 * ve kullanımını izler. Kupon kayıt ekranında girilir; paket ücreti
 * kupon oranında düşer.
 *
 * Kupon kodu otomatik üretilir ama koç kendi ön ekini verebilir
 * (örn. "IBK" → IBK7F2QK) — telefonda söylemesi kolay olsun diye
 * karışan harfler (O/0, I/1, L) alfabeden çıkarılmıştır.
 */

const CouponManager = ({ user, setToast }) => {
    const [formAcik, setFormAcik] = useState(false);
    const [surum, setSurum] = useState(0);
    const yenile = useCallback(() => setSurum((v) => v + 1), []);

    const liste = useMemo(
        // eslint-disable-next-line react-hooks/exhaustive-deps
        () => coupons.kocKuponlari(user?.id), [user?.id, surum]
    );
    const ozet = useMemo(
        // eslint-disable-next-line react-hooks/exhaustive-deps
        () => coupons.kocOzeti(user?.id), [user?.id, surum]
    );

    const kopyala = async (kod) => {
        try {
            await navigator.clipboard.writeText(kod);
            setToast?.(`${kod} panoya kopyalandı`);
        } catch {
            // Pano izni yoksa kullanıcı kodu elle okuyabilsin
            setToast?.(`Kupon kodu: ${kod}`);
        }
    };

    const durumCevir = (k) => {
        coupons.durumDegistir(k.kod, !k.aktif);
        yenile();
        setToast?.(k.aktif ? 'Kupon kapatıldı' : 'Kupon açıldı');
    };

    const sil = (kod) => {
        coupons.sil(kod);
        yenile();
        setToast?.('Kupon silindi');
    };

    return (
        <div className="space-y-4">

            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                    <span className="sec-icon" style={{ '--acc': 'var(--highlight)' }}>
                        <Ticket size={16} />
                    </span>
                    <div className="min-w-0">
                        <h3 className="h3">İndirim Kuponları</h3>
                        <p className="text-[11px] text-ink-3 leading-snug">
                            Ürettiğiniz kupon kayıt ekranında girilir; paket ücreti kupon
                            oranında düşer.
                        </p>
                    </div>
                </div>
                <button onClick={() => setFormAcik(true)} className="b b-fill b-brand">
                    <Plus size={14} /> Kupon Üret
                </button>
            </div>

            {/* Özet */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <Kutu etiket="Toplam Kupon" deger={ozet.toplam} renk="var(--brand)" />
                <Kutu etiket="Açık" deger={ozet.aktif} renk="var(--ok)" />
                <Kutu etiket="Kullanım" deger={ozet.kullanim} renk="var(--info)" />
                <Kutu etiket="Verilen İndirim" deger={tl(ozet.indirim)} renk="var(--highlight)" kucuk />
            </div>

            {/* Liste */}
            {liste.length === 0 ? (
                <div className="srf p-10 text-center">
                    <Ticket size={28} className="text-ink-3 mx-auto mb-2" />
                    <p className="text-xs font-bold text-ink-3">Henüz kupon üretmediniz</p>
                    <p className="text-[11px] text-ink-3 mt-1 max-w-xs mx-auto leading-snug">
                        "Kupon Üret" ile bir indirim kodu oluşturun ve öğrenci velilerine
                        ya da tanıdığınız koçlara verin.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {liste.map((k) => {
                        const bitti = k.kullanimlar.length >= k.kullanimHakki;
                        const suresiDoldu = k.sonTarih && k.sonTarih < new Date().toISOString().slice(0, 10);
                        return (
                            <div
                                key={k.kod}
                                className="srf srf-accent p-4"
                                style={{ '--acc': !k.aktif || bitti || suresiDoldu ? 'var(--ink-3)' : 'var(--ok)' }}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="num text-lg tracking-[0.15em]">{k.kod}</p>
                                        <p className="text-[11px] font-bold text-ink-2 mt-0.5">
                                            {k.oran ? `%${k.oran} indirim` : `${tl(k.tutar)} indirim`}
                                        </p>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button onClick={() => kopyala(k.kod)} aria-label="Kodu kopyala" title="Kopyala" className="b b-bare b-icon b-sm">
                                            <Copy size={13} />
                                        </button>
                                        <button onClick={() => durumCevir(k)} aria-label={k.aktif ? 'Kapat' : 'Aç'} title={k.aktif ? 'Kapat' : 'Aç'} className="b b-bare b-icon b-sm">
                                            <Power size={13} className={k.aktif ? 'text-ok' : 'text-ink-3'} />
                                        </button>
                                        <button onClick={() => sil(k.kod)} aria-label="Sil" title="Sil" className="b b-bare b-icon b-sm">
                                            <Trash2 size={13} className="text-danger" />
                                        </button>
                                    </div>
                                </div>

                                {k.aciklama && (
                                    <p className="text-[11px] text-ink-3 mt-1.5 leading-snug">{k.aciklama}</p>
                                )}

                                <div className="flex flex-wrap gap-1.5 mt-2.5">
                                    <span className="badge">
                                        {k.kullanimlar.length}/{k.kullanimHakki} kullanım
                                    </span>
                                    {k.sonTarih && (
                                        <span className={`badge ${suresiDoldu ? 'badge-danger' : ''}`}>
                                            Son: {k.sonTarih.split('-').reverse().join('.')}
                                        </span>
                                    )}
                                    {k.planlar && (
                                        <span className="badge">
                                            {k.planlar.map((p) => PLANLAR.find((x) => x.id === p)?.ad || p).join(', ')}
                                        </span>
                                    )}
                                    {!k.aktif && <span className="badge badge-danger">Kapalı</span>}
                                    {bitti && <span className="badge badge-warn">Hak doldu</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {formAcik && (
                <KuponFormu
                    user={user}
                    onKapat={() => setFormAcik(false)}
                    onUret={(veri) => {
                        const k = coupons.uret({ ...veri, uretenKoc: user });
                        if (!k) {
                            setToast?.('Kupon üretilemedi — kod çakışıyor ya da değerler geçersiz.');
                            return;
                        }
                        setFormAcik(false);
                        yenile();
                        setToast?.(`Kupon üretildi: ${k.kod}`);
                    }}
                />
            )}
        </div>
    );
};

const Kutu = ({ etiket, deger, renk, kucuk }) => (
    <div className="srf srf-accent p-3.5" style={{ '--acc': renk }}>
        <p className="eyebrow">{etiket}</p>
        <p className={`num mt-1 ${kucuk ? 'text-lg' : 'text-2xl'}`} style={{ color: renk }}>{deger}</p>
    </div>
);

const KuponFormu = ({ onKapat, onUret }) => {
    const [f, setF] = useState({
        tur: 'oran', oran: 20, tutar: 500,
        kullanimHakki: 1, sonTarih: '', aciklama: '', onEk: '',
        planlar: [],
    });
    const yaz = (k, v) => setF((p) => ({ ...p, [k]: v }));

    const planCevir = (id) => setF((p) => ({
        ...p,
        planlar: p.planlar.includes(id)
            ? p.planlar.filter((x) => x !== id)
            : [...p.planlar, id],
    }));

    const gecerli = f.tur === 'oran'
        ? (f.oran > 0 && f.oran <= 100)
        : (f.tutar > 0);

    return (
        <Modal
            acik
            onClose={onKapat}
            baslikGizle
            genislik="lg"
            govdeClassName="p-0 flex flex-col overflow-hidden"
        >

            <div className="shrink-0 flex items-start gap-3 p-5 border-b border-line">
                <span className="sec-icon" style={{ '--acc': 'var(--highlight)' }}>
                    <Ticket size={16} />
                </span>
                <div className="min-w-0 flex-1">
                    <h3 className="h2">Kupon Üret</h3>
                    <p className="text-[11px] text-ink-3 mt-0.5 leading-snug">
                        Kod otomatik üretilir; ön ek verirseniz kodun başına eklenir.
                    </p>
                </div>
                <button onClick={onKapat} aria-label="Kapat" className="b b-bare b-icon shrink-0">
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">

                <div className="tabbar">
                    <button
                        onClick={() => yaz('tur', 'oran')}
                        aria-selected={f.tur === 'oran'}
                        className={`tb ${f.tur === 'oran' ? 'is-on' : ''}`}
                    >
                        Yüzde İndirim
                    </button>
                    <button
                        onClick={() => yaz('tur', 'tutar')}
                        aria-selected={f.tur === 'tutar'}
                        className={`tb ${f.tur === 'tutar' ? 'is-on' : ''}`}
                    >
                        Sabit Tutar
                    </button>
                </div>

                {f.tur === 'oran' ? (
                    <label className="block">
                        <span className="eyebrow block mb-1">İndirim Oranı (%)</span>
                        <input
                            type="number" min="1" max="100"
                            className="fld w-full"
                            value={f.oran}
                            onChange={(e) => yaz('oran', parseInt(e.target.value, 10) || 0)}
                        />
                    </label>
                ) : (
                    <label className="block">
                        <span className="eyebrow block mb-1">İndirim Tutarı (TL)</span>
                        <input
                            type="number" min="1"
                            className="fld w-full"
                            value={f.tutar}
                            onChange={(e) => yaz('tutar', parseInt(e.target.value, 10) || 0)}
                        />
                    </label>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block">
                        <span className="eyebrow block mb-1">Kaç Kez Kullanılabilir</span>
                        <input
                            type="number" min="1"
                            className="fld w-full"
                            value={f.kullanimHakki}
                            onChange={(e) => yaz('kullanimHakki', parseInt(e.target.value, 10) || 1)}
                        />
                    </label>
                    <label className="block">
                        <span className="eyebrow block mb-1">Son Kullanma (isteğe bağlı)</span>
                        <input
                            type="date"
                            className="fld w-full"
                            value={f.sonTarih}
                            onChange={(e) => yaz('sonTarih', e.target.value)}
                        />
                    </label>
                </div>

                <label className="block">
                    <span className="eyebrow block mb-1">Kod Ön Eki (isteğe bağlı)</span>
                    <input
                        className="fld w-full tracking-widest font-bold"
                        maxLength={4}
                        value={f.onEk}
                        onChange={(e) => yaz('onEk', e.target.value.toLocaleUpperCase('tr-TR'))}
                        placeholder="Örn. IBK"
                    />
                </label>

                <label className="block">
                    <span className="eyebrow block mb-1">Açıklama</span>
                    <input
                        className="fld w-full"
                        value={f.aciklama}
                        onChange={(e) => yaz('aciklama', e.target.value)}
                        placeholder="Örn. Kardeş indirimi"
                    />
                </label>

                <div>
                    <p className="eyebrow mb-2">
                        Geçerli Paketler <span className="text-ink-3 normal-case">(boş = tümü)</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {PLANLAR.filter((p) => p.fiyat > 0).map((p) => {
                            const on = f.planlar.includes(p.id);
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => planCevir(p.id)}
                                    aria-pressed={on}
                                    className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition ${
                                        on ? 'border-brand text-brand bg-brand-soft' : 'border-line text-ink-2 hover:border-line-2'
                                    }`}
                                >
                                    {on && <Check size={10} className="inline mr-1" />}
                                    {p.ad}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {!gecerli && (
                    <div className="flex items-start gap-2 rounded-xl border border-warn-line bg-warn-soft p-2.5">
                        <AlertTriangle size={13} className="text-warn shrink-0 mt-0.5" />
                        <p className="text-[11px] text-ink-2 leading-snug">
                            {f.tur === 'oran'
                                ? 'İndirim oranı 1 ile 100 arasında olmalı.'
                                : 'İndirim tutarı sıfırdan büyük olmalı.'}
                        </p>
                    </div>
                )}
            </div>

            <div className="pencere-alt-cubuk bg-surface flex items-center gap-2 p-4 border-t border-line">
                <button onClick={onKapat} className="b b-line flex-1">İptal</button>
                <button
                    onClick={() => onUret({
                        oran: f.tur === 'oran' ? f.oran : undefined,
                        tutar: f.tur === 'tutar' ? f.tutar : undefined,
                        kullanimHakki: f.kullanimHakki,
                        sonTarih: f.sonTarih || null,
                        aciklama: f.aciklama,
                        onEk: f.onEk,
                        planlar: f.planlar,
                    })}
                    disabled={!gecerli}
                    className="b b-fill b-brand flex-1 disabled:opacity-50"
                >
                    Kuponu Üret
                </button>
            </div>
        </Modal>
    );
};

export default CouponManager;
