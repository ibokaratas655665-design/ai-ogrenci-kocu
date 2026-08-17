import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Renk sistemi index.css'ten SONRA yuklenir ki eski sabit renkleri ezebilsin
import './styles/theme.css'
// Derinlik ve yuzey sistemi — tema degiskenlerini kullanir
import './styles/surface.css'
import './styles/depth.css'
import './styles/vivid.css'
import App from './App.jsx'
import { donemKontrol } from './services/dataEpoch'

/**
 * Yerel veri temizliği React kurulmadan ve senkronizasyon başlamadan
 * ÖNCE çalışır. Sonraya kalsaydı tarayıcıdaki test verisi sunucuya
 * çoktan yüklenmiş olurdu — Firestore'u temizlemenin anlamı kalmazdı.
 */
donemKontrol()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
