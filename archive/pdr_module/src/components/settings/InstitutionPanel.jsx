import React, { useState } from 'react';
import { Building2, Save, AlertTriangle, CheckCircle2, FileSignature } from 'lucide-react';
import {
    BOS_KURUM, kurumBilgisi, kurumKaydet, resmiBaslik,
    kurumEksikAlanlar, OKUL_TURLERI, evrakSayisiUret, resmiTarih,
} from '../../data/mebStandards';
import { KADEMELER, kurumTurundenKademe } from '../../data/pdrDecimalPlan';

/**
 * 🏛️ KURUM BİLGİLERİ
 *
 * PDR bölümünden çıkan her belge resmî yazı düzeninde üretiliyor:
 * T.C. → Valilik → İlçe MEM → Okul adı başlığı, kurum kodlu evrak sayısı,
 * müdür/rehber öğretmen imza bloğu. Bu bilgiler bir kez buraya girilir,
 * bütün çıktılar aynı kaynaktan beslenir.
 *
 * Kurum türü aynı zamanda rehberlik kademesini belirler — anasınıfında
 * LGS yöneltme belgesi, lisede okula uyum oyunu aranmaz.
 */

const ALANLAR = [
    { k: 'il', ad: 'İl', zorunlu: true, ipucu: 'Örn. Ankara' },
    { k: 'ilce', ad: 'İlçe', ipucu: 'Örn. Çankaya' },
    { k: 'okulAdi', ad: 'Okul / Kurum Adı', zorunlu: true, genis: true },
    { k: 'kurumKodu', ad: 'MEBBİS Kurum Kodu', ipucu: 'Genelde 6 hane' },
    { k: 'mudur', ad: 'Okul Müdürü' },
    { k: 'mudurYardimcisi', ad: 'Müdür Yardımcısı' },
    { k: 'rehberOgretmen', ad: 'Rehber Öğretmen / Psikolojik Danışman', genis: true },
    { k: 'telefon', ad: 'Telefon' },
    { k: 'eposta', ad: 'Kurum E-postası' },
    { k: 'adres', ad: 'Adres', genis: true },
];

const InstitutionPanel = ({ setToast }) => {
    const [form, setForm] = useState(() => kurumBilgisi());
    const [kaydedildi, setKaydedildi] = useState(false);

    const yaz = (k, v) => {
        setForm((f) => ({ ...f, [k]: v }));
        setKaydedildi(false);
    };

    const eksikler = kurumEksikAlanlar(form);
    const kademe = kurumTurundenKademe(form.okulTuru);

    const kaydet = () => {
        if (eksikler.length) {
            setToast?.('İl ve okul adı girilmeden resmî belge başlığı oluşturulamaz');
            return;
        }
        kurumKaydet(form);
        setKaydedildi(true);
        setToast?.('Kurum bilgileri kaydedildi — tüm PDR belgeleri bu başlığı kullanacak');
    };

    const sifirla = () => {
        setForm({ ...BOS_KURUM });
        setKaydedildi(false);
    };

    return (
        <div className="space-y-5">

            {/* ── Başlık ─────────────────────────────────── */}
            <div className="flex items-start gap-3">
                <span className="sec-icon" style={{ '--acc': 'var(--brand)' }}>
                    <Building2 size={16} />
                </span>
                <div className="min-w-0">
                    <h3 className="h3">Kurum Bilgileri</h3>
                    <p className="text-[11px] text-ink-3 leading-snug">
                        MEBBİS ve e-Okul düzenine uygun resmî yazı başlığı, evrak sayısı ve
                        imza bloğu buradan üretilir.
                    </p>
                </div>
            </div>

            {eksikler.length > 0 && (
                <div className="flex items-start gap-2 rounded-xl border border-warn-line bg-warn-soft p-3">
                    <AlertTriangle size={15} className="text-warn shrink-0 mt-0.5" />
                    <p className="text-[11px] text-ink-2 leading-snug">
                        <strong className="text-ink">İl</strong> ve{' '}
                        <strong className="text-ink">okul adı</strong> girilmeden üretilen belgelerde
                        resmî başlık eksik kalır; denetimde geçerli sayılmaz.
                    </p>
                </div>
            )}

            {/* ── Form ───────────────────────────────────── */}
            <div className="srf p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ALANLAR.map((a) => (
                    <label key={a.k} className={a.genis ? 'sm:col-span-2' : ''}>
                        <span className="eyebrow block mb-1">
                            {a.ad}{a.zorunlu && <span className="text-danger"> *</span>}
                        </span>
                        <input
                            className="fld w-full"
                            value={form[a.k] || ''}
                            placeholder={a.ipucu || ''}
                            onChange={(e) => yaz(a.k, e.target.value)}
                        />
                    </label>
                ))}

                <label>
                    <span className="eyebrow block mb-1">Kurum Türü</span>
                    <select
                        className="fld w-full"
                        value={form.okulTuru}
                        onChange={(e) => yaz('okulTuru', e.target.value)}
                    >
                        {OKUL_TURLERI.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                </label>

                <div className="flex items-end">
                    <p className="text-[11px] text-ink-3 leading-snug">
                        Rehberlik kademesi:{' '}
                        <strong className="text-ink">{KADEMELER[kademe]?.ad}</strong>
                        {' — '}{KADEMELER[kademe]?.odak}
                    </p>
                </div>
            </div>

            {/* ── Belge önizleme ─────────────────────────── */}
            <div className="srf p-4">
                <div className="flex items-center gap-2 mb-3">
                    <FileSignature size={14} className="text-accent" />
                    <span className="eyebrow">Belge Başlığı Önizlemesi</span>
                </div>

                {/* Resmî yazı düzeni siyah-beyaz ve serif; önizleme de öyle olmalı
                    ki danışman çıktının nasıl görüneceğini burada görsün. */}
                <div
                    className="rounded-xl border border-line bg-white p-5 text-center"
                    style={{ fontFamily: '"Times New Roman", Times, serif', color: '#000' }}
                >
                    {resmiBaslik(form).map((s, i) => (
                        <p key={i} style={{ fontSize: 13, fontWeight: i === 0 ? 700 : 600, lineHeight: 1.5 }}>
                            {s || '—'}
                        </p>
                    ))}
                    <div style={{ borderTop: '1px solid #000', margin: '10px 0' }} />
                    <div className="flex justify-between" style={{ fontSize: 11 }}>
                        <span>Sayı : {evrakSayisiUret().replace(/\/\d+$/, '/____')}</span>
                        <span>{resmiTarih()}</span>
                    </div>
                    <p style={{ fontSize: 11, marginTop: 14, fontWeight: 700 }}>
                        {form.rehberOgretmen || 'Rehber Öğretmen'}
                    </p>
                    <p style={{ fontSize: 10 }}>Psikolojik Danışman</p>
                </div>
            </div>

            {/* ── İşlemler ───────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2">
                <button onClick={kaydet} className="b b-fill flex items-center gap-2">
                    <Save size={14} /> Kaydet
                </button>
                <button onClick={sifirla} className="b b-line">Temizle</button>
                {kaydedildi && (
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-ok">
                        <CheckCircle2 size={13} /> Kaydedildi
                    </span>
                )}
            </div>
        </div>
    );
};

export default InstitutionPanel;
