import React from 'react';
import { Check, RotateCcw, Type, Palette, Monitor, AlignLeft } from 'lucide-react';
import {
    PALETLER, ZEMINLER, YAZI_TIPLERI, PUNTOLAR, yaziTipiBul, puntoBul,
} from '../../data/appearanceCatalog';
import AppearancePreview from './AppearancePreview';

/**
 * 🎨 GÖRÜNÜM AYARLARI
 *
 * Kurumsal renk, ekran zemini, yazı tipi ve punto tek yerde toplandı.
 * Her değişiklik ANINDA hem gerçek uygulamaya hem de sağdaki önizlemeye
 * yansır; Kaydet kalıcı yapar, İptal açılıştaki hâle döndürür.
 */

const gecerliHex = (v) => (typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(v).trim()));

const parlaklik = (hex) => {
    let h = String(hex).replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const [r, g, b] = [0, 2, 4].map((i) => {
        const v = parseInt(h.slice(i, i + 2), 16) / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const kontrast = (a, b) => {
    const L1 = parlaklik(a);
    const L2 = parlaklik(b);
    return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
};

/** Bölüm başlığı */
const Bolum = ({ icon, baslik, aciklama, children }) => {
    const Icon = icon;
    return (
        <div>
            <div className="flex items-start gap-2.5 mb-3">
                <span className="sec-icon shrink-0"><Icon size={15} /></span>
                <div className="min-w-0">
                    <h4 className="text-sm font-black text-ink leading-tight">{baslik}</h4>
                    {aciklama && <p className="text-[11px] text-ink-3 mt-0.5 leading-snug">{aciklama}</p>}
                </div>
            </div>
            {children}
        </div>
    );
};

const AppearancePanel = ({ general, degistir, sifirla }) => {
    const marka = gecerliHex(general.themeColor) ? general.themeColor : '#1E3A8A';
    const vurgu = gecerliHex(general.themeAccentColor) ? general.themeAccentColor : '#0F766E';
    const zemin = gecerliHex(general.screenBg) ? general.screenBg : '#F7F9FC';
    const govdeId = general.fontBody || 'jakarta';
    const baslikId = general.fontDisplay || 'syne';
    const puntoId = general.fontScale || 'normal';

    const markaOkunur = kontrast(marka, '#FFFFFF');
    const zeminKoyu = parlaklik(zemin) < 0.35;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

            {/* ══════════ SOL: SEÇENEKLER ══════════ */}
            <div className="space-y-6">

                {/* ── Kurumsal renk ─────────────────────── */}
                <Bolum
                    icon={Palette}
                    baslik="Kurumsal Renk"
                    aciklama="Butonlar, sekmeler, grafikler, rozetler ve PDF başlıkları bu renkten üretilir."
                >
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {PALETLER.map((p) => {
                            const secili = marka.toLowerCase() === p.marka.toLowerCase()
                                && vurgu.toLowerCase() === p.vurgu.toLowerCase();
                            return (
                                <button
                                    key={p.ad}
                                    onClick={() => degistir({ themeColor: p.marka, themeAccentColor: p.vurgu })}
                                    title={p.ad}
                                    className={`relative flex items-center gap-1.5 pl-1.5 pr-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition ${
                                        secili ? 'border-brand bg-brand-soft text-brand' : 'border-line text-ink-2 hover:border-line-2'
                                    }`}
                                >
                                    <span className="flex rounded-full overflow-hidden shrink-0">
                                        <span className="w-4 h-4" style={{ background: p.marka }} />
                                        <span className="w-4 h-4" style={{ background: p.vurgu }} />
                                    </span>
                                    {p.ad}
                                    {secili && <Check size={11} />}
                                </button>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                                type="color"
                                value={marka}
                                onChange={(e) => degistir({ themeColor: e.target.value })}
                                className="w-10 h-10 rounded-xl cursor-pointer border border-line p-0.5 bg-surface shrink-0"
                            />
                            <span className="min-w-0">
                                <span className="block text-xs font-bold text-ink">Ana Renk</span>
                                <span className="block text-[11px] text-ink-3 font-mono">{marka}</span>
                            </span>
                        </label>
                        <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                                type="color"
                                value={vurgu}
                                onChange={(e) => degistir({ themeAccentColor: e.target.value })}
                                className="w-10 h-10 rounded-xl cursor-pointer border border-line p-0.5 bg-surface shrink-0"
                            />
                            <span className="min-w-0">
                                <span className="block text-xs font-bold text-ink">Vurgu Rengi</span>
                                <span className="block text-[11px] text-ink-3 font-mono">{vurgu}</span>
                            </span>
                        </label>
                    </div>

                    <p className={`text-[11px] mt-2 flex items-start gap-1.5 ${markaOkunur >= 4.5 ? 'text-ok' : 'text-warn'}`}>
                        <span>{markaOkunur >= 4.5 ? '✓' : '⚠'}</span>
                        <span>
                            {markaOkunur >= 4.5
                                ? 'Bu renk yazı ve zemin olarak okunur.'
                                : 'Açık bir renk — düz yazıda soluk kalabilir. Butonlarda yazı otomatik koyulaştırılır.'}
                        </span>
                    </p>
                </Bolum>

                {/* ── Ekran zemini ──────────────────────── */}
                <Bolum
                    icon={Monitor}
                    baslik="Ekran Zemini"
                    aciklama="Tüm ekranı kaplayan renk. Kart yüzeyleri, kenarlar ve yazı tonları buradan türetilir."
                >
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3">
                        {ZEMINLER.map((z) => {
                            const secili = zemin.toLowerCase() === z.renk.toLowerCase();
                            return (
                                <button
                                    key={z.ad}
                                    onClick={() => degistir({ screenBg: z.renk })}
                                    title={`${z.ad} — ${z.not}`}
                                    className={`group rounded-xl border-2 p-1.5 transition ${
                                        secili ? 'border-brand' : 'border-line hover:border-line-2'
                                    }`}
                                >
                                    <span
                                        className="block w-full h-9 rounded-lg border border-line relative"
                                        style={{ background: z.renk }}
                                    >
                                        {secili && (
                                            <Check
                                                size={14}
                                                className="absolute inset-0 m-auto"
                                                style={{ color: parlaklik(z.renk) < 0.35 ? '#fff' : '#0F172A' }}
                                            />
                                        )}
                                    </span>
                                    <span className="block text-[10px] font-bold text-ink-2 mt-1 truncate">{z.ad}</span>
                                </button>
                            );
                        })}
                    </div>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                            type="color"
                            value={zemin}
                            onChange={(e) => degistir({ screenBg: e.target.value })}
                            className="w-10 h-10 rounded-xl cursor-pointer border border-line p-0.5 bg-surface shrink-0"
                        />
                        <span className="min-w-0">
                            <span className="block text-xs font-bold text-ink">Özel Zemin</span>
                            <span className="block text-[11px] text-ink-3 font-mono">{zemin}</span>
                        </span>
                    </label>

                    {zeminKoyu && (
                        <p className="text-[11px] text-info mt-2 flex items-start gap-1.5">
                            <span>ℹ</span>
                            <span>Koyu zemin seçtiniz — yazılar ve kart yüzeyleri otomatik olarak açık tonlara döndü.</span>
                        </p>
                    )}
                </Bolum>

                {/* ── Yazı tipi ─────────────────────────── */}
                <Bolum
                    icon={Type}
                    baslik="Yazı Tipi"
                    aciklama="Gövde metni ve başlıklar için ayrı aile seçilebilir. Seçilmeyen yazı tipi indirilmez."
                >
                    <div className="space-y-3">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-ink-3 mb-1.5">Gövde Metni</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                {YAZI_TIPLERI.filter((f) => !f.yalnizBaslik).map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => degistir({ fontBody: f.id })}
                                        className={`text-left px-2.5 py-2 rounded-xl border transition ${
                                            govdeId === f.id ? 'border-brand bg-brand-soft' : 'border-line hover:border-line-2'
                                        }`}
                                    >
                                        <span
                                            className={`block text-[13px] font-bold truncate ${govdeId === f.id ? 'text-brand' : 'text-ink'}`}
                                            style={{ fontFamily: f.aile }}
                                        >
                                            {f.ad}
                                        </span>
                                        <span className="block text-[10px] text-ink-3 truncate">{f.tur}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-ink-3 mb-1.5">Başlıklar</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                {YAZI_TIPLERI.map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => degistir({ fontDisplay: f.id })}
                                        className={`text-left px-2.5 py-2 rounded-xl border transition ${
                                            baslikId === f.id ? 'border-brand bg-brand-soft' : 'border-line hover:border-line-2'
                                        }`}
                                    >
                                        <span
                                            className={`block text-[13px] font-bold truncate ${baslikId === f.id ? 'text-brand' : 'text-ink'}`}
                                            style={{ fontFamily: f.aile }}
                                        >
                                            {f.ad}
                                        </span>
                                        <span className="block text-[10px] text-ink-3 truncate">{f.tur}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Bolum>

                {/* ── Punto ─────────────────────────────── */}
                <Bolum
                    icon={AlignLeft}
                    baslik="Yazı Boyutu"
                    aciklama="Tüm ekrandaki yazılar bu orana göre ölçeklenir."
                >
                    <div className="flex flex-wrap gap-1.5">
                        {PUNTOLAR.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => degistir({ fontScale: p.id })}
                                className={`px-3 py-2 rounded-xl border text-left transition ${
                                    puntoId === p.id ? 'border-brand bg-brand-soft text-brand' : 'border-line text-ink-2 hover:border-line-2'
                                }`}
                            >
                                <span className="block font-bold" style={{ fontSize: p.deger }}>{p.ad}</span>
                                <span className="block text-[10px] text-ink-3">{p.not}</span>
                            </button>
                        ))}
                    </div>
                </Bolum>

                <button onClick={sifirla} className="b b-line b-sm">
                    <RotateCcw size={13} /> Görünümü Varsayılana Döndür
                </button>
            </div>

            {/* ══════════ SAĞ: CANLI ÖNİZLEME ══════════ */}
            <div className="lg:sticky lg:top-2 h-fit">
                <AppearancePreview
                    marka={marka}
                    vurgu={vurgu}
                    zemin={zemin}
                    govde={yaziTipiBul(govdeId)?.aile}
                    baslik={yaziTipiBul(baslikId)?.aile}
                    punto={puntoBul(puntoId).deger}
                />
            </div>
        </div>
    );
};

export default AppearancePanel;
