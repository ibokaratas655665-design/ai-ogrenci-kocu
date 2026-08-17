export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            /**
             * Anlamlı renk adları — hepsi styles/theme.css'teki değişkenlere
             * bağlıdır, dolayısıyla açık/koyu temada kendiliğinden değişir.
             * Yeni kod `bg-white` / `text-gray-500` yerine bunları kullanmalı:
             *   bg-surface, bg-page, text-ink, text-ink-2, border-line …
             */
            colors: {
                page: 'var(--bg)',
                surface: {
                    DEFAULT: 'var(--surface)',
                    2: 'var(--surface-2)',
                    3: 'var(--surface-3)',
                    e: 'var(--surface-e)',      // yükseltilmiş: modal, dropdown, tooltip
                    inv: 'var(--surface-inv)',
                },
                // Devre dışı öğeler — `opacity-50` taklidi yerine gerçek renk
                disabled: {
                    DEFAULT: 'var(--disabled)',
                    ink: 'var(--disabled-ink)',
                },
                line: {
                    DEFAULT: 'var(--line)',
                    2: 'var(--line-2)',
                },
                ink: {
                    DEFAULT: 'var(--ink)',
                    2: 'var(--ink-2)',
                    3: 'var(--ink-3)',
                    on: 'var(--ink-on)',
                },
                brand: {
                    DEFAULT: 'var(--brand)',
                    soft: 'var(--brand-soft)',
                    line: 'var(--brand-line)',
                    hover: 'var(--brand-hover)',
                },
                accent: {
                    DEFAULT: 'var(--accent)',
                    soft: 'var(--accent-soft)',
                    line: 'var(--accent-line)',
                },
                highlight: {
                    DEFAULT: 'var(--highlight)',
                    soft: 'var(--highlight-soft)',
                    line: 'var(--highlight-line)',
                },
                // Grafik/kategori serileri — mor ve pembe aileleri buraya bağlı
                c4: 'var(--c4)',
                c5: 'var(--c5)',

                ok: { DEFAULT: 'var(--ok)', soft: 'var(--ok-soft)' },
                warn: { DEFAULT: 'var(--warn)', soft: 'var(--warn-soft)' },
                danger: { DEFAULT: 'var(--danger)', soft: 'var(--danger-soft)' },
                info: { DEFAULT: 'var(--info)', soft: 'var(--info-soft)' },

                // Eski `primary-*` kullanımları kırılmasın diye markaya bağlandı
                primary: {
                    50: 'var(--brand-soft)',
                    100: 'var(--brand-soft)',
                    500: 'var(--brand)',
                    600: 'var(--brand)',
                    700: 'var(--brand-hover)',
                },
                secondary: {
                    500: 'var(--accent)',
                    600: 'var(--accent)',
                },
            },
            /**
             * Yükseklik merdiveni. `e1/e2/e3` eski adlar (korunuyor);
             * yeni kod ne olduğunu söyleyen adı kullanır: `shadow-kart`,
             * `shadow-modal`. Böylece bir kartın gölgesi projenin her
             * yerinde aynı olur.
             */
            boxShadow: {
                e1: 'var(--sh-1)',
                e2: 'var(--sh-2)',
                e3: 'var(--sh-3)',
                kart: 'var(--yukseklik-kart)',
                acilir: 'var(--yukseklik-acilir)',
                yuzen: 'var(--yukseklik-yuzen)',
                modal: 'var(--yukseklik-modal)',
            },

            /**
             * ⚠️ Tailwind'in kendi `rounded-lg/xl/2xl` sınıfları
             * DEĞİŞTİRİLMEDİ — kodda 1700'den fazla yerde kullanılıyor
             * ve hepsini kırardı. Bunlar ek, anlamlı adlar.
             */
            borderRadius: {
                dsm: 'var(--yaricap-sm)',     // rozet, küçük etiket
                dmd: 'var(--yaricap-md)',     // düğme, giriş alanı
                dlg: 'var(--yaricap-lg)',     // kart, panel, modal
                pill: 'var(--yaricap-pill)',  // sekme hapı, avatar
            },

            /** Anlamlı boşluk adları — `p-kart`, `gap-alan` gibi. */
            spacing: {
                sikisik: 'var(--bosluk-2)',
                alan: 'var(--bosluk-3)',      // form alanları arası
                kart: 'var(--bosluk-5)',      // kart iç dolgusu
                bolum: 'var(--bosluk-8)',     // bölümler arası
                sayfa: 'var(--bosluk-12)',
            },

            /**
             * DEFAULT de belirtece bağlı: süre yazılmadan kullanılan
             * `transition-colors` / `transition-all` sınıfları Tailwind'in
             * 150 ms varsayılanını getiriyordu ve ölçümde dördüncü bir
             * süre değeri olarak görünüyordu. Artık üç basamak dışında
             * süre üretmek mümkün değil.
             */
            transitionDuration: {
                DEFAULT: 'var(--sure-hizli)',
                hizli: 'var(--sure-hizli)',
                normal: 'var(--sure-normal)',
                yavas: 'var(--sure-yavas)',
            },

            /** Tek yumuşama eğrisi — her hareket aynı fizikle çalışsın. */
            transitionTimingFunction: {
                DEFAULT: 'var(--egri)',
                dizge: 'var(--egri)',
            },
            /**
             * ⚠️ Burada Inter ve Outfit yazıyordu ama index.css bu iki fontu
             * HİÇ yüklemiyor; yüklenen fontlar Plus Jakarta Sans ve Syne.
             * Yani `font-sans` ve `font-display` sessizce sistem yazı tipine
             * düşüyordu — kodun 84 yerde kullandığı `syne` sınıfı ise CSS'ten
             * geliyordu. Üç ayrı tipografi aynı anda yaşıyordu.
             *
             * Artık tanım gerçekten yüklenen fontlarla aynı.
             */
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
                display: ['Syne', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
            },
            animation: {
                'blob': 'blob 7s infinite',
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
                'scale-in': 'scaleIn 0.3s ease-out forwards',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                },
                fadeIn: {
                    'from': { opacity: '0' },
                    'to': { opacity: '1' },
                },
                fadeInUp: {
                    'from': { opacity: '0', transform: 'translateY(20px)' },
                    'to': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    'from': { opacity: '0', transform: 'scale(0.95)' },
                    'to': { opacity: '1', transform: 'scale(1)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            },

            /**
             * ⚠️ KATMAN SIRASI — extend İÇİNDE olmalı.
             *
             * Bu tanım daha önce `theme` altında (extend DIŞINDA) duruyordu.
             * Tailwind'de bunu yapmak varsayılan ölçeği tamamen SİLER: kod
             * genelindeki z-10 / z-20 / z-40 / z-50 sınıfları hiç üretilmiyor,
             * dolayısıyla modallar z-index'siz kalıp DOM sırasına göre üst üste
             * biniyordu ("çakışan pencereler"). extend altına alınarak varsayılan
             * ölçek geri kazanıldı ve anlamlı katman adları eklendi.
             *
             * Merdiven:  içerik(0-30) < sticky başlık(40) < mobil menü(50)
             *            < modal(1000) < iç içe modal(1100) < form(1200)
             *            < program oluşturucu(1300) < toast/bildirim(2000)
             *            < ayarlar(2500)
             */
            zIndex: {
                'overlay': '900',          // Modal arkaplan perdesi
                'modal-base': '1000',      // Temel modallar
                'modal-high': '1100',      // Modal içinden açılan modallar
                'modal-top': '1200',       // Rehberlik / test formları
                'program-builder': '1300', // Program oluşturucu (tam ekran)
                'search-progress': '1400', // Araştırma yükleme perdesi
                'toast': '2000',           // Bildirim paneli perdesi
                'settings': '2500',        // Ayarlar
                'notify': '3000',          // Toast / anlık bildirim (en üst)
            },
        },
    },
    plugins: [],
}
