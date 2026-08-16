import React, { createContext, useState, useContext, useEffect } from 'react';
import { yaziTipiBul, puntoBul } from '../data/appearanceCatalog';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

/**
 * Ayarlar kaydında renk alanı bozuk olabilir (eski sürümlerde CSS
 * değişkeni adı yazılmıştı). Yalnızca geçerli hex kabul edilir; aksi
 * halde varsayılan palet korunur.
 */
const normalizeHex = (v) => {
    if (typeof v !== 'string') return null;
    const s = v.trim();
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s) ? s : null;
};

/** Hex → bağıl parlaklık (WCAG). */
const luminance = (hex) => {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const [r, g, b] = [0, 2, 4].map((i) => {
        const v = parseInt(h.slice(i, i + 2), 16) / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Dolu renkli zeminlerin ÜSTÜNDEKİ yazı rengi.
 *
 * Kullanıcı Ayarlar'dan açık bir kurumsal renk seçebiliyor (ör. sarı).
 * Böyle bir zeminde beyaz yazı okunmaz. Seçilen rengin parlaklığına
 * bakılarak beyaz mı koyu mu yazılacağına karar verilir — böylece
 * hangi renk seçilirse seçilsin butonlar okunur kalır.
 */
const okunurYazi = (hex) => (luminance(hex) > 0.42 ? '#0B0D14' : '#FFFFFF');

/**
 * Seçilen ekran zemininden tüm yüzey ve yazı katmanlarını türetir.
 *
 * Zemin tek başına değişemez: kart yüzeyi, girinti, kenar çizgisi ve
 * üç yazı kademesi hep onunla ilişkilidir. Kullanıcı koyu bir zemin
 * seçerse yazılar açık tonlara döner — böylece hangi renk seçilirse
 * seçilsin ekran okunur kalır.
 */
const zeminTuret = (root, zemin) => {
    const L = luminance(zemin);
    const koyuZemin = L < 0.35;

    /* Yüzeyin koyu olduğunu CSS'e bildirir. `data-theme` kullanıcının
       tema düğmesine bağlı; kullanıcı açık temada koyu bir ZEMİN seçmiş
       olabilir. Koyu yüzeye göre davranması gereken kurallar (dolu durum
       renklerinin üstündeki yazı gibi) bu niteliği dinler. */
    root.setAttribute('data-surface', koyuZemin ? 'dark' : 'light');

    root.style.setProperty('--bg', zemin);

    if (koyuZemin) {
        // Yüzeyler zeminden AÇILIR, yazılar aydınlanır
        root.style.setProperty('--surface', `color-mix(in srgb, ${zemin} 88%, white)`);
        root.style.setProperty('--surface-2', `color-mix(in srgb, ${zemin} 94%, white)`);
        root.style.setProperty('--surface-3', `color-mix(in srgb, ${zemin} 80%, white)`);
        root.style.setProperty('--surface-inv', '#F1F5F9');
        root.style.setProperty('--line', `color-mix(in srgb, ${zemin} 78%, white)`);
        root.style.setProperty('--line-2', `color-mix(in srgb, ${zemin} 66%, white)`);
        root.style.setProperty('--ink', '#F1F5F9');
        root.style.setProperty('--ink-2', '#AEB6C6');
        root.style.setProperty('--ink-3', '#8892A6');
        root.style.setProperty('--sheen', 'rgba(255,255,255,.055)');
        root.style.setProperty('--lit', 'rgba(255,255,255,.07)');
        root.style.setProperty('--lit-soft', 'rgba(255,255,255,.04)');
        root.style.setProperty('--cast', '0, 0, 0');
        root.style.setProperty('color-scheme', 'dark');

        /* Durum ve grafik renkleri de koyu zemine göre açılmalı.
           Bunlar `:root[data-theme="dark"]` altında tanımlı; ama kullanıcı
           koyu ZEMİN seçtiğinde tema hâlâ "light" olabiliyor ve renkler
           koyu kalıp okunmuyordu (İZLE, sayaç rozetleri vb. 65 yerde). */
        root.style.setProperty('--ok', '#4ADE80');
        root.style.setProperty('--ok-soft', '#10291A');
        root.style.setProperty('--warn', '#F0AB3C');
        root.style.setProperty('--warn-soft', '#33260F');
        root.style.setProperty('--danger', '#F87171');
        root.style.setProperty('--danger-soft', '#351718');
        root.style.setProperty('--info', '#7CA6F5');
        root.style.setProperty('--info-soft', '#17223D');
        root.style.setProperty('--highlight', '#F0AB3C');
        root.style.setProperty('--highlight-soft', '#33260F');
        root.style.setProperty('--c3', '#F0AB3C');
        root.style.setProperty('--c4', '#BFA8FF');
        root.style.setProperty('--c5', '#F78FC5');
    } else {
        // Yüzeyler zeminden hafifçe beyaza, yazılar koyu
        root.style.setProperty('--surface', `color-mix(in srgb, ${zemin} 35%, white)`);
        root.style.setProperty('--surface-2', `color-mix(in srgb, ${zemin} 80%, white)`);
        root.style.setProperty('--surface-3', `color-mix(in srgb, ${zemin} 88%, black 4%)`);
        root.style.setProperty('--surface-inv', '#0F172A');
        root.style.setProperty('--line', `color-mix(in srgb, ${zemin} 82%, black 9%)`);
        root.style.setProperty('--line-2', `color-mix(in srgb, ${zemin} 70%, black 18%)`);
        root.style.setProperty('--ink', '#0F172A');
        root.style.setProperty('--ink-2', '#475569');
        root.style.setProperty('--ink-3', '#5B6779');
        root.style.setProperty('--sheen', 'transparent');
        root.style.setProperty('--lit', 'rgba(255,255,255,.9)');
        root.style.setProperty('--lit-soft', 'rgba(255,255,255,.55)');
        root.style.setProperty('--cast', '15, 23, 42');
        root.style.setProperty('color-scheme', 'light');
    }
};

const zeminTemizle = (root) => {
    root.removeAttribute('data-surface');
    [
        '--bg', '--surface', '--surface-2', '--surface-3', '--surface-inv',
        '--line', '--line-2', '--ink', '--ink-2', '--ink-3',
        '--sheen', '--lit', '--lit-soft', '--cast', 'color-scheme',
        '--ok', '--ok-soft', '--warn', '--warn-soft',
        '--danger', '--danger-soft', '--info', '--info-soft',
        '--highlight', '--highlight-soft', '--c3', '--c4', '--c5',
    ].forEach((t) => root.style.removeProperty(t));
};

/** Google Fonts bağlantısını yalnızca gerektiğinde ve bir kez ekler. */
const fontYukle = (googleSpec) => {
    if (!googleSpec) return;
    const id = `gf-${googleSpec.replace(/[^\w]/g, '')}`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${googleSpec}&display=swap`;
    document.head.appendChild(link);
};

export const ThemeProvider = ({ children }) => {
    /**
     * Varsayılan AÇIK tema.
     * Eskiden işletim sisteminin koyu mod tercihi devralınıyordu; bu yüzden
     * uygulama ilk açılışta koyu geliyordu. Uygulamanın tasarım dili açık
     * zemin üzerine kurulu — koyu tema yalnızca kullanıcı düğmeden
     * seçtiğinde devreye girer.
     */
    const [isDark, setIsDark] = useState(() => localStorage.getItem('theme_mode') === 'dark');

    useEffect(() => {
        const applyTheme = () => {
            const root = document.documentElement;
            if (isDark) {
                root.classList.add('dark');
                root.setAttribute('data-theme', 'dark');
            } else {
                root.classList.remove('dark');
                root.setAttribute('data-theme', 'light');
            }
            localStorage.setItem('theme_mode', isDark ? 'dark' : 'light');

            /**
             * Ayarlar'dan seçilen kurumsal renk TÜM sisteme uygulanır.
             *
             * Eskiden yalnızca `--user-primary` yazılıyordu; renk sistemi
             * (styles/theme.css) `--brand` üzerinden çalıştığı için seçim
             * hiçbir yerde görünmüyordu. Artık markanın tüm türevleri
             * (hover, yumuşak zemin, kenar) seçilen renkten üretiliyor.
             */
            try {
                const appSettings = JSON.parse(localStorage.getItem('app_settings') || '{}');
                const marka = normalizeHex(appSettings?.general?.themeColor);
                const vurgu = normalizeHex(appSettings?.general?.themeAccentColor);

                const markaTokenleri = [
                    '--brand', '--brand-hover', '--brand-soft', '--brand-line',
                    '--user-primary', '--color-primary-500', '--color-primary-600', '--color-primary-700',
                    '--c1',
                ];
                const vurguTokenleri = ['--accent', '--accent-soft', '--accent-line', '--c2'];

                if (marka) {
                    root.style.setProperty('--brand', marka);
                    // Hover bir ton koyu, yumuşak zemin yüzeyle karıştırılmış
                    root.style.setProperty('--brand-hover', `color-mix(in srgb, ${marka} 86%, black)`);
                    root.style.setProperty('--brand-soft', `color-mix(in srgb, ${marka} 12%, var(--surface))`);
                    root.style.setProperty('--brand-line', `color-mix(in srgb, ${marka} 34%, transparent)`);
                    root.style.setProperty('--user-primary', marka);
                    root.style.setProperty('--color-primary-500', marka);
                    root.style.setProperty('--color-primary-600', marka);
                    root.style.setProperty('--color-primary-700', `color-mix(in srgb, ${marka} 86%, black)`);
                    root.style.setProperty('--c1', marka);
                    // Dolu zeminlerde yazı okunur kalsın (açık renk seçilirse koyu yazı)
                    root.style.setProperty('--ink-on', okunurYazi(marka));
                    // Açık bir marka rengi düz yazı olarak da kullanılıyor;
                    // metin için okunur bir koyu türev üretilir.
                    root.style.setProperty(
                        '--brand-text',
                        luminance(marka) > 0.42 ? `color-mix(in srgb, ${marka} 62%, black)` : marka
                    );
                } else {
                    markaTokenleri.forEach((t) => root.style.removeProperty(t));
                    root.style.removeProperty('--ink-on');
                    root.style.removeProperty('--brand-text');
                }

                if (vurgu) {
                    root.style.setProperty('--accent', vurgu);
                    root.style.setProperty('--accent-soft', `color-mix(in srgb, ${vurgu} 12%, var(--surface))`);
                    root.style.setProperty('--accent-line', `color-mix(in srgb, ${vurgu} 34%, transparent)`);
                    root.style.setProperty('--c2', vurgu);
                } else {
                    vurguTokenleri.forEach((t) => root.style.removeProperty(t));
                }

                /* ── Ekran zemini ─────────────────────────────────
                   Kullanıcı seçtiyse tüm yüzey ve yazı katmanları
                   ondan türetilir; seçmediyse temanın kendi zemini. */
                const zemin = normalizeHex(appSettings?.general?.screenBg);
                if (zemin) zeminTuret(root, zemin);
                else zeminTemizle(root);

                /**
                 * Marka ve vurgu renkleri hem DOLU ZEMİN hem de DÜZ YAZI
                 * olarak kullanılıyor. Bu ikisi çelişebilir: koyu bir zemine
                 * koyu bir marka rengi seçilirse buton iyi görünür ama
                 * `text-brand` yazılar okunmaz olur (69 yerde ölçüldü).
                 *
                 * Bu yüzden yazı için ayrı bir türev üretilir: renk, üzerinde
                 * durduğu yüzeye göre gerektiği kadar açılır ya da koyulaşır.
                 * Dolu zeminler `--brand`i kullanmaya devam eder.
                 */
                const yuzey = zemin
                    ? (luminance(zemin) < 0.35
                        ? `color-mix(in srgb, ${zemin} 88%, white)`
                        : `color-mix(in srgb, ${zemin} 35%, white)`)
                    : null;
                const yuzeyKoyu = zemin ? luminance(zemin) < 0.35 : isDark;

                const yaziTonu = (renk) => {
                    if (!renk) return null;
                    const L = luminance(renk);
                    if (yuzeyKoyu) {
                        // Koyu yüzey: renk yeterince açık değilse beyaza doğru aç
                        return L < 0.28 ? `color-mix(in srgb, ${renk} 55%, white)` : renk;
                    }
                    // Açık yüzey: renk fazla açıksa siyaha doğru koyult
                    return L > 0.42 ? `color-mix(in srgb, ${renk} 62%, black)` : renk;
                };

                if (marka) root.style.setProperty('--brand-text', yaziTonu(marka));
                else root.style.removeProperty('--brand-text');

                if (vurgu) root.style.setProperty('--accent-text', yaziTonu(vurgu));
                else root.style.removeProperty('--accent-text');

                // Grafik serileri de yüzeye göre okunur kalmalı
                if (marka) root.style.setProperty('--c1', yaziTonu(marka));
                if (vurgu) root.style.setProperty('--c2', yaziTonu(vurgu));
                void yuzey;

                /* ── Yazı tipi ve punto ───────────────────────────── */
                const govde = appSettings?.general?.fontBody;
                const baslik = appSettings?.general?.fontDisplay;
                const punto = appSettings?.general?.fontScale;

                if (govde) {
                    const f = yaziTipiBul(govde);
                    if (f) { fontYukle(f.google); root.style.setProperty('--font-body', f.aile); }
                } else {
                    root.style.removeProperty('--font-body');
                }

                if (baslik) {
                    const f = yaziTipiBul(baslik);
                    if (f) { fontYukle(f.google); root.style.setProperty('--font-display', f.aile); }
                } else {
                    root.style.removeProperty('--font-display');
                }

                if (punto) root.style.setProperty('--font-size', puntoBul(punto).deger);
                else root.style.removeProperty('--font-size');

                // Uygulama adı sekme başlığına da yansısın
                const ad = appSettings?.general?.appName;
                if (ad && typeof ad === 'string' && ad.trim()) document.title = ad.trim();
            } catch {
                /* bozuk ayar kaydı varsa varsayılan renkler kalsın */
            }
        };

        applyTheme();

        const handleSettingsUpdated = () => applyTheme();
        window.addEventListener('settings-updated', handleSettingsUpdated);
        // Dispatch one manually on mount
        window.dispatchEvent(new Event('settings-updated'));

        return () => window.removeEventListener('settings-updated', handleSettingsUpdated);
    }, [isDark]);

    const toggleTheme = () => setIsDark(prev => !prev);

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
