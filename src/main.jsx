import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Renk sistemi index.css'ten SONRA yuklenir ki eski sabit renkleri ezebilsin
import './styles/theme.css'
// Derinlik ve yuzey sistemi — tema degiskenlerini kullanir
import './styles/surface.css'
import './styles/depth.css'
import './styles/vivid.css'
// Mobil uyum en sonda: pencere ve dokunma hedefi kurallarını ezmesin diye
import './styles/mobil.css'
import App from './App.jsx'
import { donemKontrol, markaGocu } from './services/dataEpoch'
import MARKA from './data/marka'

/**
 * Yerel veri temizliği React kurulmadan ve senkronizasyon başlamadan
 * ÖNCE çalışır. Sonraya kalsaydı tarayıcıdaki test verisi sunucuya
 * çoktan yüklenmiş olurdu — Firestore'u temizlemenin anlamı kalmazdı.
 */
donemKontrol()

/** Ayarlarda kalmış eski uygulama adını yeni markaya çevirir. */
markaGocu(MARKA.ad)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
