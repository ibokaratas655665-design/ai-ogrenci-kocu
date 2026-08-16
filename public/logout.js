// LOGOUT SCRIPT - Tarayıcı konsolunda çalıştır
// Veya terminal'de bu script ile localStorage temizle

localStorage.clear();
sessionStorage.clear();
window.location.reload();

console.log("✅ Tüm oturumlar temizlendi! Sayfa yenileniyor...");
