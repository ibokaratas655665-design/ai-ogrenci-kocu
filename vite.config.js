import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base: '/'   → Netlify / web sunucusu için (npm run build:web)
// base: './'  → Electron / yerel dosya açma için (npm run build:electron)
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'electron' ? './' : '/',
  server: {
    host: true
  },
  build: {
    /**
     * Üretim çıktısından console/debugger temizlenir.
     *
     * Kodda 140'tan fazla `console.log` var ve bunların bir kısmı
     * kullanıcı kaydı, telefon numarası ve oturum bilgisi yazdırıyor.
     * Tarayıcı konsolu son kullanıcıya açık olduğu için bu, canlıda
     * kişisel veri sızıntısıdır. `console.error`/`warn` bırakılır —
     * hata takibi için gerekli.
     */
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        pure_funcs: ['console.log', 'console.debug', 'console.info'],
      },
    },
    // Kaynak haritası üretimde yayımlanmaz: kaynak kodun tamamını
    // ve iş mantığını olduğu gibi açığa çıkarır.
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Büyük satıcı kütüphaneleri ayrı parçalara alınır; ilk açılış
        // tek 1 MB'lık dosyayı beklemez.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          pdf: ['jspdf', 'html2canvas'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
}))
