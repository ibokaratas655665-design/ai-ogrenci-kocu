/**
 * 🎨 GÖRÜNÜM KATALOĞU
 *
 * Ayarlar → Görünüm bölümünün seçenek kaynağı: kurumsal renk paletleri,
 * ekran zemini tonları ve yazı tipi aileleri.
 *
 * Yazı tipleri Google Fonts'tan İHTİYAÇ ANINDA yüklenir (seçilmeyen aile
 * indirilmez). Sistem yazı tipleri hiç indirme gerektirmez — kurum ağı
 * kısıtlıysa veya çevrimdışı çalışılıyorsa güvenli seçimdir.
 */

// ══════════════════════════════════════════════════════════════
//  1. KURUMSAL RENK PALETLERİ
// ══════════════════════════════════════════════════════════════

export const PALETLER = [
    { ad: 'Lacivert – Turkuaz', marka: '#1E3A8A', vurgu: '#0F766E' },
    { ad: 'Petrol – Amber', marka: '#155E75', vurgu: '#B45309' },
    { ad: 'Bordo – Altın', marka: '#9F1239', vurgu: '#A16207' },
    { ad: 'Mor – Fuşya', marka: '#5B21B6', vurgu: '#BE185D' },
    { ad: 'Orman – Zeytin', marka: '#166534', vurgu: '#4D7C0F' },
    { ad: 'Antrasit – Mavi', marka: '#334155', vurgu: '#1D4ED8' },
    { ad: 'İndigo – Menekşe', marka: '#3730A3', vurgu: '#7C3AED' },
    { ad: 'Okyanus – Deniz', marka: '#0E7490', vurgu: '#0D9488' },
    { ad: 'Kiremit – Kahve', marka: '#B91C1C', vurgu: '#78350F' },
    { ad: 'Gece – Gümüş', marka: '#1E293B', vurgu: '#475569' },
    { ad: 'Zümrüt – Deniz', marka: '#047857', vurgu: '#0E7490' },
    { ad: 'Şarap – Gül', marka: '#831843', vurgu: '#9D174D' },
];

// ══════════════════════════════════════════════════════════════
//  2. EKRAN ZEMİNİ
//  Sayfanın tamamını kaplayan renk. Kart yüzeyleri ve kenarlar
//  bu tondan türetilir; koyu bir zemin seçilirse yazı renkleri
//  otomatik olarak açık tonlara döner (ThemeContext).
// ══════════════════════════════════════════════════════════════

export const ZEMINLER = [
    { ad: 'Kar Beyazı', renk: '#FFFFFF', not: 'En yüksek kontrast' },
    { ad: 'Bulut Grisi', renk: '#F7F9FC', not: 'Varsayılan' },
    { ad: 'Sis', renk: '#F1F5F9', not: 'Hafif gri' },
    { ad: 'Fildişi', renk: '#FAF8F3', not: 'Sıcak ton' },
    { ad: 'Kum', renk: '#F6F2EA', not: 'Bej' },
    { ad: 'Nane', renk: '#F2F8F5', not: 'Yeşilimsi' },
    { ad: 'Gökyüzü', renk: '#F1F6FC', not: 'Mavimsi' },
    { ad: 'Lavanta', renk: '#F6F4FC', not: 'Morumsu' },
    { ad: 'Gül', renk: '#FCF4F5', not: 'Pembemsi' },
    { ad: 'Kömür', renk: '#1B1F2A', not: 'Koyu — yazılar açılır' },
    { ad: 'Gece Mavisi', renk: '#111827', not: 'Koyu' },
    { ad: 'Kadife', renk: '#0B0D14', not: 'En koyu' },
];

// ══════════════════════════════════════════════════════════════
//  3. YAZI TİPLERİ
//  `google` alanı olan aileler seçildiğinde indirilir; olmayanlar
//  cihazda zaten kurulu sistem yazı tipleridir.
// ══════════════════════════════════════════════════════════════

const SISTEM = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export const YAZI_TIPLERI = [
    {
        id: 'jakarta',
        ad: 'Plus Jakarta Sans',
        aile: `'Plus Jakarta Sans', ${SISTEM}`,
        google: 'Plus+Jakarta+Sans:wght@300;400;500;600;700;800',
        tur: 'Modern · yuvarlak',
    },
    {
        id: 'inter',
        ad: 'Inter',
        aile: `'Inter', ${SISTEM}`,
        google: 'Inter:wght@300;400;500;600;700;800',
        tur: 'Nötr · ekran için',
    },
    {
        id: 'manrope',
        ad: 'Manrope',
        aile: `'Manrope', ${SISTEM}`,
        google: 'Manrope:wght@300;400;500;600;700;800',
        tur: 'Geniş · ferah',
    },
    {
        id: 'figtree',
        ad: 'Figtree',
        aile: `'Figtree', ${SISTEM}`,
        google: 'Figtree:wght@300;400;500;600;700;800',
        tur: 'Sıcak · dostane',
    },
    {
        id: 'sora',
        ad: 'Sora',
        aile: `'Sora', ${SISTEM}`,
        google: 'Sora:wght@300;400;500;600;700;800',
        tur: 'Teknik · geometrik',
    },
    {
        id: 'outfit',
        ad: 'Outfit',
        aile: `'Outfit', ${SISTEM}`,
        google: 'Outfit:wght@300;400;500;600;700;800',
        tur: 'Sade · geometrik',
    },
    {
        id: 'syne',
        ad: 'Syne',
        aile: `'Syne', ${SISTEM}`,
        google: 'Syne:wght@400;500;600;700;800',
        tur: 'Karakterli · başlıklık',
        yalnizBaslik: true,
    },
    {
        id: 'lora',
        ad: 'Lora',
        aile: `'Lora', Georgia, 'Times New Roman', serif`,
        google: 'Lora:wght@400;500;600;700',
        tur: 'Tırnaklı · resmî',
    },
    {
        id: 'merriweather',
        ad: 'Merriweather',
        aile: `'Merriweather', Georgia, serif`,
        google: 'Merriweather:wght@300;400;700',
        tur: 'Tırnaklı · okunaklı',
    },
    {
        id: 'sistem',
        ad: 'Sistem Yazı Tipi',
        aile: SISTEM,
        google: null,
        tur: 'İndirme yok · en hızlı',
    },
    {
        id: 'georgia',
        ad: 'Georgia',
        aile: `Georgia, 'Times New Roman', serif`,
        google: null,
        tur: 'Tırnaklı · sistemde kurulu',
    },
];

export const yaziTipiBul = (id) => YAZI_TIPLERI.find((f) => f.id === id) || null;

// ══════════════════════════════════════════════════════════════
//  4. PUNTO ÖLÇEĞİ
// ══════════════════════════════════════════════════════════════

export const PUNTOLAR = [
    { id: 'kucuk', ad: 'Küçük', deger: '0.9375rem', not: 'Daha çok bilgi sığar' },
    { id: 'normal', ad: 'Normal', deger: '1rem', not: 'Varsayılan' },
    { id: 'buyuk', ad: 'Büyük', deger: '1.0625rem', not: 'Daha rahat okunur' },
    { id: 'cokBuyuk', ad: 'Çok Büyük', deger: '1.125rem', not: 'Görme zorluğu için' },
];

export const puntoBul = (id) => PUNTOLAR.find((p) => p.id === id) || PUNTOLAR[1];

export default { PALETLER, ZEMINLER, YAZI_TIPLERI, PUNTOLAR, yaziTipiBul, puntoBul };
