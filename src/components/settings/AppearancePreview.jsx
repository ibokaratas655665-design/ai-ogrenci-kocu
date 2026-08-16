import React from 'react';
import { TrendingUp, Users, ClipboardList, Bell, Settings } from 'lucide-react';

/**
 * 🔍 GÖRÜNÜM ÖNİZLEMESİ
 *
 * Ayarlar değiştikçe uygulamanın nasıl görüneceğini gösteren küçük maket:
 * üst şerit, sekmeler, KPI kartı, grafik, tablo, buton ve rozetler.
 *
 * Önemli: önizleme gerçek uygulamanın CSS değişkenlerini KULLANMAZ —
 * kendi kapsamında (`style`) kendi değişkenlerini tanımlar. Böylece
 * kaydetmeden önce seçimlerin sonucu güvenle görülebilir; asıl arayüz
 * yalnızca Kaydet'e basıldığında kalıcı olarak değişir.
 */

const parlaklik = (hex) => {
    let h = String(hex || '#ffffff').replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const [r, g, b] = [0, 2, 4].map((i) => {
        const v = parseInt(h.slice(i, i + 2), 16) / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const AppearancePreview = ({ marka, vurgu, zemin, govde, baslik, punto }) => {
    const koyu = parlaklik(zemin) < 0.35;

    // Maket kendi renk kapsamını kurar — gerçek uygulamadan bağımsız
    const kapsam = {
        '--p-bg': zemin,
        '--p-surface': koyu ? `color-mix(in srgb, ${zemin} 88%, white)` : `color-mix(in srgb, ${zemin} 35%, white)`,
        '--p-surface-2': koyu ? `color-mix(in srgb, ${zemin} 94%, white)` : `color-mix(in srgb, ${zemin} 80%, white)`,
        '--p-line': koyu ? `color-mix(in srgb, ${zemin} 78%, white)` : `color-mix(in srgb, ${zemin} 82%, black 9%)`,
        '--p-ink': koyu ? '#F1F5F9' : '#0F172A',
        '--p-ink-2': koyu ? '#AEB6C6' : '#475569',
        '--p-ink-3': koyu ? '#8892A6' : '#5B6779',
        '--p-brand': marka,
        '--p-accent': vurgu,
        '--p-on': parlaklik(marka) > 0.42 ? '#0B0D14' : '#FFFFFF',
        '--p-on-accent': parlaklik(vurgu) > 0.42 ? '#0B0D14' : '#FFFFFF',
        fontFamily: govde,
        fontSize: punto,
    };

    const kart = {
        background: 'var(--p-surface)',
        border: '1px solid var(--p-line)',
        borderRadius: 14,
    };

    return (
        <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-ink-3 mb-2">
                Canlı Önizleme
            </p>

            <div
                className="rounded-2xl overflow-hidden border border-line shadow-e2"
                style={{ ...kapsam, background: 'var(--p-bg)' }}
            >
                {/* ── Üst şerit ────────────────────────── */}
                <div
                    className="flex items-center justify-between px-3 py-2.5"
                    style={{
                        background: 'color-mix(in srgb, var(--p-surface) 82%, transparent)',
                        borderBottom: '1px solid var(--p-line)',
                    }}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <span
                            className="w-7 h-7 rounded-lg grid place-items-center shrink-0"
                            style={{
                                background: `linear-gradient(180deg, color-mix(in srgb, ${marka} 84%, white), ${marka})`,
                                color: 'var(--p-on)',
                            }}
                        >
                            <TrendingUp size={14} />
                        </span>
                        <span
                            className="text-[11px] font-black tracking-wide truncate"
                            style={{ color: 'var(--p-ink)', fontFamily: baslik }}
                        >
                            KOÇLUK SİSTEMİ
                        </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <Bell size={13} style={{ color: 'var(--p-ink-3)' }} />
                        <Settings size={13} style={{ color: 'var(--p-ink-3)' }} />
                    </div>
                </div>

                {/* ── Sekmeler ─────────────────────────── */}
                <div className="px-3 pt-2.5">
                    <div
                        className="inline-flex gap-1 p-1 rounded-xl"
                        style={{ background: 'var(--p-surface-2)', border: '1px solid var(--p-line)' }}
                    >
                        {['Analiz', 'Program', 'Rehberlik'].map((t, i) => (
                            <span
                                key={t}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                                style={
                                    i === 0
                                        ? { background: 'var(--p-surface)', color: 'var(--p-ink)', border: '1px solid var(--p-line)' }
                                        : { color: 'var(--p-ink-3)' }
                                }
                            >
                                {t}
                            </span>
                        ))}
                    </div>
                </div>

                {/* ── İçerik ───────────────────────────── */}
                <div className="p-3 space-y-2.5">

                    {/* KPI kartları */}
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { et: 'ÖĞRENCİ', d: '128', ikon: Users, renk: 'var(--p-brand)' },
                            { et: 'GÖREV', d: '46', ikon: ClipboardList, renk: 'var(--p-accent)' },
                        ].map((k) => {
                            const Icon = k.ikon;
                            return (
                                <div key={k.et} style={{ ...kart, padding: 10, position: 'relative', overflow: 'hidden' }}>
                                    <span
                                        className="absolute inset-x-0 top-0 h-[2px]"
                                        style={{ background: k.renk }}
                                    />
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-[8px] font-black tracking-widest" style={{ color: 'var(--p-ink-3)' }}>
                                                {k.et}
                                            </p>
                                            <p
                                                className="text-lg font-black leading-none mt-1"
                                                style={{ color: 'var(--p-ink)', fontFamily: baslik }}
                                            >
                                                {k.d}
                                            </p>
                                        </div>
                                        <span
                                            className="w-6 h-6 rounded-lg grid place-items-center shrink-0"
                                            style={{
                                                color: k.renk,
                                                background: `color-mix(in srgb, ${k.renk === 'var(--p-brand)' ? marka : vurgu} 12%, transparent)`,
                                            }}
                                        >
                                            <Icon size={12} />
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Mini grafik */}
                    <div style={{ ...kart, padding: 10 }}>
                        <p className="text-[9px] font-black mb-2" style={{ color: 'var(--p-ink-2)', fontFamily: baslik }}>
                            Sınıf Net Ortalaması
                        </p>
                        <div className="flex items-end gap-1 h-12">
                            {[38, 52, 45, 66, 58, 78, 71].map((h, i) => (
                                <span
                                    key={i}
                                    className="flex-1 rounded-t"
                                    style={{
                                        height: `${h}%`,
                                        background: i % 2 ? 'var(--p-accent)' : 'var(--p-brand)',
                                        opacity: 0.55 + (h / 200),
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Tablo satırı + rozetler */}
                    <div style={{ ...kart, overflow: 'hidden' }}>
                        <div
                            className="px-2.5 py-1.5 text-[8px] font-black tracking-widest"
                            style={{ background: 'var(--p-surface-2)', color: 'var(--p-ink-3)', borderBottom: '1px solid var(--p-line)' }}
                        >
                            ÖĞRENCİ · DURUM
                        </div>
                        {[
                            { ad: 'Ayşe Yılmaz', durum: 'İyi', renk: '#15803D', zemin: '#DCFCE7' },
                            { ad: 'Mert Kaya', durum: 'Takip', renk: '#B45309', zemin: '#FEF3C7' },
                        ].map((s, i) => (
                            <div
                                key={s.ad}
                                className="flex items-center justify-between px-2.5 py-1.5"
                                style={{ borderTop: i ? '1px solid var(--p-line)' : 'none' }}
                            >
                                <span className="text-[10px] font-bold" style={{ color: 'var(--p-ink-2)' }}>{s.ad}</span>
                                <span
                                    className="text-[9px] font-black px-1.5 py-0.5 rounded"
                                    style={{ color: s.renk, background: s.zemin }}
                                >
                                    {s.durum}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Butonlar */}
                    <div className="flex flex-wrap gap-1.5">
                        <span
                            className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                            style={{
                                background: `linear-gradient(180deg, color-mix(in srgb, ${marka} 84%, white), ${marka})`,
                                color: 'var(--p-on)',
                                border: `1px solid color-mix(in srgb, ${marka} 76%, black)`,
                            }}
                        >
                            Kaydet
                        </span>
                        <span
                            className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                            style={{
                                background: `linear-gradient(180deg, color-mix(in srgb, ${vurgu} 84%, white), ${vurgu})`,
                                color: 'var(--p-on-accent)',
                                border: `1px solid color-mix(in srgb, ${vurgu} 76%, black)`,
                            }}
                        >
                            Program Ata
                        </span>
                        <span
                            className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                            style={{ background: 'var(--p-surface)', color: 'var(--p-ink-2)', border: '1px solid var(--p-line)' }}
                        >
                            İptal
                        </span>
                    </div>

                    {/* Yazı örneği */}
                    <div style={{ ...kart, padding: 10 }}>
                        <p className="text-xs font-black" style={{ color: 'var(--p-ink)', fontFamily: baslik }}>
                            Başlık Yazı Tipi Örneği
                        </p>
                        <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--p-ink-2)' }}>
                            Gövde metni böyle görünür. Öğrencinin haftalık programı, deneme
                            analizleri ve rehberlik notları bu yazı tipiyle okunacak.
                        </p>
                        <p className="text-[10px] mt-1" style={{ color: 'var(--p-ink-3)' }}>
                            Yardımcı açıklama satırı · 0123456789 · ĞÜŞİÖÇ ğüşıöç
                        </p>
                    </div>
                </div>
            </div>

            <p className="text-[11px] text-ink-3 mt-2 leading-snug">
                Önizleme seçimlerinizi anında gösterir. <strong className="text-ink-2">Kaydet</strong>'e
                basana kadar gerçek arayüz kalıcı olarak değişmez.
            </p>
        </div>
    );
};

export default AppearancePreview;
