/**
 * 💬 WHATSAPP SERVİSİ
 *
 * Şu anki sağlayıcı: "deeplink" (wa.me) — sunucu gerektirmez, ücretsiz,
 * anında çalışır. Mesaj koçun kendi WhatsApp hesabından, onun onayıyla gider.
 *
 * İleride WhatsApp Cloud API'ye geçilmek istenirse SADECE `sendMessage`
 * fonksiyonunun içindeki provider dalı değişir; şablonlar, değişken motoru,
 * telefon normalizasyonu ve gönderim kaydı aynen kullanılabilir.
 * (Cloud API için Meta Business doğrulaması + sunucu tarafı token gerekir —
 *  token asla tarayıcıya konulmamalı.)
 */

import { DEFAULT_TEMPLATES } from '../data/whatsappTemplates';

const LOG_KEY = 'whatsapp_message_log';
const CUSTOM_TEMPLATES_KEY = 'whatsapp_custom_templates';
const SETTINGS_KEY = 'whatsapp_settings';
const MAX_LOG_ENTRIES = 500;

const safeParse = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw || !raw.trim()) return fallback;
        return JSON.parse(raw) ?? fallback;
    } catch {
        return fallback;
    }
};

// ════════════════════════════════════════════════════════════
//  Telefon numarası normalizasyonu (Türkiye)
// ════════════════════════════════════════════════════════════

/**
 * Türkiye formatındaki her türlü yazımı wa.me'nin beklediği
 * uluslararası biçime çevirir: "0555 123 45 67" → "905551234567"
 *
 * @returns {string|null} normalize edilmiş numara veya geçersizse null
 */
export const normalizePhone = (raw, defaultCountryCode = '90') => {
    if (!raw) return null;

    let digits = String(raw).replace(/[^\d+]/g, '');
    if (digits.startsWith('+')) digits = digits.slice(1);
    digits = digits.replace(/\D/g, '');
    if (!digits) return null;

    // 00 ile başlayan uluslararası önek
    if (digits.startsWith('00')) digits = digits.slice(2);

    // Zaten ülke kodu ile başlıyorsa (90 + 10 hane = 12)
    if (digits.startsWith(defaultCountryCode) && digits.length === defaultCountryCode.length + 10) {
        return digits;
    }

    // Başında 0 olan yerel format: 0555... → 555...
    if (digits.startsWith('0')) digits = digits.slice(1);

    // Türkiye cep numaraları 10 hane ve 5 ile başlar
    if (digits.length === 10) return defaultCountryCode + digits;

    // Başka ülke kodu ile gelmiş olabilir — 11–15 hane arası kabul et
    if (digits.length >= 11 && digits.length <= 15) return digits;

    return null;
};

/** "905551234567" → "+90 555 123 45 67" */
export const formatPhoneDisplay = (raw) => {
    const n = normalizePhone(raw);
    if (!n) return raw || '—';
    if (n.startsWith('90') && n.length === 12) {
        const d = n.slice(2);
        return `+90 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
    }
    return `+${n}`;
};

export const isValidPhone = (raw) => normalizePhone(raw) !== null;

// ════════════════════════════════════════════════════════════
//  Şablon değişkenleri
// ════════════════════════════════════════════════════════════

export const TEMPLATE_VARIABLES = [
    { key: 'ad', label: 'Öğrenci adı (ilk isim)', example: 'Mehmet' },
    { key: 'ogrenciAdi', label: 'Öğrenci tam adı', example: 'Mehmet Öz' },
    { key: 'veliAdi', label: 'Veli adı', example: 'Ayşe Hanım' },
    { key: 'kocAdi', label: 'Koç adı', example: 'İbrahim Karataş' },
    { key: 'okulNo', label: 'Okul numarası', example: '123' },
    { key: 'sinif', label: 'Sınıf / şube', example: '12-A' },
    { key: 'hedef', label: 'Hedef bölüm/üniversite', example: 'Tıp' },
    { key: 'sonNet', label: 'Son deneme neti', example: '78.5' },
    { key: 'oncekiNet', label: 'Önceki deneme neti', example: '74.0' },
    { key: 'netDegisim', label: 'Net değişimi (sayı)', example: '+4.5' },
    { key: 'netDegisimMetin', label: 'Net değişimi (cümle)', example: '4.5 net artış' },
    { key: 'ortalamaNet', label: 'Ortalama net', example: '72.3' },
    { key: 'enIyiNet', label: 'En yüksek net', example: '81.0' },
    { key: 'denemeAdi', label: 'Son deneme adı', example: '3. TYT Denemesi' },
    { key: 'denemeSayisi', label: 'Girilen deneme sayısı', example: '6' },
    { key: 'sinifSira', label: 'Sınıf sıralaması', example: '4' },
    { key: 'gucluDers', label: 'En güçlü ders', example: 'Türkçe' },
    { key: 'zayifDers', label: 'En zayıf ders', example: 'Matematik' },
    { key: 'gelisenDers', label: 'En çok gelişen ders', example: 'Fizik' },
    { key: 'gerileyenDers', label: 'En çok gerileyen ders', example: 'Kimya' },
    { key: 'calismaDakika', label: 'Çalışma süresi (dakika)', example: '420' },
    { key: 'calismaSaati', label: 'Çalışma süresi (saat)', example: '7' },
    { key: 'gorevTamam', label: 'Tamamlanan görev', example: '8' },
    { key: 'gorevToplam', label: 'Toplam görev', example: '10' },
    { key: 'gorevYuzde', label: 'Görev tamamlama yüzdesi', example: '80' },
    { key: 'gecikenGorev', label: 'Geciken görev sayısı', example: '2' },
    { key: 'gecikenGorevListesi', label: 'Geciken görevlerin listesi', example: '• Matematik testi' },
    { key: 'seri', label: 'Günlük çalışma serisi', example: '12' },
    { key: 'xp', label: 'Toplam XP', example: '1450' },
    { key: 'aktifsizGun', label: 'Kaç gündür aktivite yok', example: '5' },
    { key: 'riskDurumu', label: 'Risk durumu', example: 'İyi Durumda' },
    { key: 'riskNedenleri', label: 'Risk gerekçeleri (liste)', example: '• Görev tamamlama düşük' },
    { key: 'veliLinki', label: 'Veli portalı bağlantısı', example: 'https://...' },
    { key: 'motivasyonCumlesi', label: 'Duruma göre motivasyon cümlesi', example: 'Tempoyu koru!' },
    { key: 'gorusmeTarihi', label: 'Görüşme tarihi', example: 'Çarşamba 15:00' },
    { key: 'gorusmeYeri', label: 'Görüşme yeri', example: 'Rehberlik Servisi' },
    { key: 'tarih', label: 'Bugünün tarihi', example: '16.08.2026' },
];

const MOTIVATION_LINES = {
    improving: 'Grafik yukarı gidiyor — yaptığın şey işe yarıyor, aynen devam.',
    stable: 'İstikrar en zor kısmıydı, onu hallettin. Şimdi tempoyu bir tık artırma zamanı.',
    declining: 'Bu hafta biraz düştü ama panik yok. Tek bir haftanın sonucu, trendi değiştirmez — planı toparlayalım.',
    noData: 'Henüz yeterli veri yok. Bu hafta düzenli giriş yaparsan ilerlemeni birlikte takip edebiliriz.',
};

/** Veli portalı için paylaşılabilir bağlantı üretir. */
export const buildParentPortalLink = (studentId) => {
    if (typeof window === 'undefined' || !studentId) return '';
    const base = window.location.origin + window.location.pathname;
    return `${base}#/veli/${encodeURIComponent(studentId)}`;
};

/**
 * Rapor nesnesinden şablon değişkenlerini üretir.
 *
 * @param {object} report - reportService.buildStudentReport çıktısı
 * @param {object} [extra] - koçAdi, görüşme tarihi gibi ek değerler
 */
export const buildVariables = (report, extra = {}) => {
    const r = report || {};
    const s = r.student || {};
    const e = r.exams || {};
    const t = r.tasks || {};
    const st = r.study || {};
    const g = r.gamification || {};
    const h = r.highlights || {};

    const netDelta = e.netTrend;
    const netDeltaText =
        netDelta == null
            ? 'ilk deneme'
            : netDelta > 0
                ? `${netDelta} net artış 📈`
                : netDelta < 0
                    ? `${Math.abs(netDelta)} net düşüş 📉`
                    : 'değişim yok';

    const motivationKey =
        netDelta == null ? 'noData' : netDelta > 0.5 ? 'improving' : netDelta < -0.5 ? 'declining' : 'stable';

    const overdueList = (t.overdueTitles || []).map((title) => `• ${title}`).join('\n') || '• (liste boş)';
    const riskReasons = (r.risk?.reasons || []).map((x) => `• ${x}`).join('\n') || '• Belirgin bir sorun görünmüyor';

    return {
        ad: s.firstName || s.name || 'Öğrenci',
        ogrenciAdi: s.name || 'Öğrenci',
        veliAdi: s.parentName || 'Sayın Velimiz',
        kocAdi: extra.kocAdi || 'Koçunuz',
        okulNo: s.schoolNumber || '—',
        sinif: [s.grade, s.section].filter(Boolean).join('-') || '—',
        hedef: s.target || 'belirlenmedi',

        sonNet: e.lastNet != null ? String(e.lastNet) : '—',
        oncekiNet: e.prevNet != null ? String(e.prevNet) : '—',
        netDegisim: netDelta == null ? '—' : `${netDelta > 0 ? '+' : ''}${netDelta}`,
        netDegisimMetin: netDeltaText,
        ortalamaNet: e.avgNet != null ? String(e.avgNet) : '—',
        enIyiNet: e.bestNet != null ? String(e.bestNet) : '—',
        denemeAdi: e.lastExamName || 'son deneme',
        denemeSayisi: String(e.count ?? 0),
        sinifSira: e.classRank ? String(e.classRank) : '—',

        gucluDers: h.strongest?.label || '—',
        zayifDers: h.weakest?.label || '—',
        gelisenDers: h.mostImproved?.label || h.strongest?.label || '—',
        gerileyenDers: h.mostDropped?.label || '—',

        calismaDakika: String(st.minutes ?? 0),
        calismaSaati: String(st.hours ?? 0),

        gorevTamam: String(t.done ?? 0),
        gorevToplam: String(t.total ?? 0),
        gorevYuzde: t.completionPct != null ? String(t.completionPct) : '0',
        gecikenGorev: String(t.overdue ?? 0),
        gecikenGorevListesi: overdueList,

        seri: String(g.streak ?? 0),
        xp: String(g.xp ?? 0),
        aktifsizGun: r.activity?.daysSinceActivity != null ? String(r.activity.daysSinceActivity) : '—',

        riskDurumu: r.risk?.levelLabel || '—',
        riskNedenleri: riskReasons,

        veliLinki: extra.veliLinki || buildParentPortalLink(s.id),
        motivasyonCumlesi: extra.motivasyonCumlesi || MOTIVATION_LINES[motivationKey],

        gorusmeTarihi: extra.gorusmeTarihi || '(tarih belirtiniz)',
        gorusmeYeri: extra.gorusmeYeri || 'Rehberlik Servisi',
        tarih: new Date().toLocaleDateString('tr-TR'),

        ...(extra.overrides || {}),
    };
};

/** {degisken} yer tutucularını doldurur. Bilinmeyen değişken olduğu gibi kalır. */
export const renderTemplate = (body, variables = {}) => {
    if (!body) return '';
    return String(body).replace(/\{(\w+)\}/g, (match, key) =>
        Object.prototype.hasOwnProperty.call(variables, key) ? String(variables[key]) : match
    );
};

/** Şablonda kullanılan, ancak değeri "—" olan değişkenleri bulur (eksik veri uyarısı). */
export const findMissingVariables = (body, variables = {}) => {
    const used = [...String(body || '').matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
    return [...new Set(used)].filter(
        (k) => !(k in variables) || variables[k] === '—' || variables[k] === ''
    );
};

// ════════════════════════════════════════════════════════════
//  Şablon yönetimi
// ════════════════════════════════════════════════════════════

export const getTemplates = () => {
    const custom = safeParse(CUSTOM_TEMPLATES_KEY, []);
    const overrides = new Map(custom.filter((t) => t.overridesId).map((t) => [t.overridesId, t]));

    const base = DEFAULT_TEMPLATES.map((t) => {
        const o = overrides.get(t.id);
        return o ? { ...t, body: o.body, label: o.label || t.label, edited: true } : t;
    });

    const userTemplates = custom.filter((t) => !t.overridesId).map((t) => ({ ...t, custom: true }));
    return [...base, ...userTemplates];
};

export const saveTemplate = (template) => {
    const custom = safeParse(CUSTOM_TEMPLATES_KEY, []);
    const isBuiltIn = DEFAULT_TEMPLATES.some((t) => t.id === template.id);

    let next;
    if (isBuiltIn) {
        // Yerleşik şablonun üzerine yazma kaydı
        next = [
            ...custom.filter((t) => t.overridesId !== template.id),
            { id: `override_${template.id}`, overridesId: template.id, body: template.body, label: template.label },
        ];
    } else {
        const exists = custom.some((t) => t.id === template.id);
        next = exists
            ? custom.map((t) => (t.id === template.id ? { ...t, ...template } : t))
            : [...custom, { ...template, id: template.id || `tpl_${Date.now()}` }];
    }

    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(next));
    notifySync(CUSTOM_TEMPLATES_KEY);
    return next;
};

export const deleteTemplate = (templateId) => {
    const custom = safeParse(CUSTOM_TEMPLATES_KEY, []);
    const next = custom.filter((t) => t.id !== templateId && t.overridesId !== templateId);
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(next));
    notifySync(CUSTOM_TEMPLATES_KEY);
    return next;
};

/** Yerleşik şablonu fabrika ayarına döndürür (override kaydını siler). */
export const resetTemplate = (templateId) => {
    const custom = safeParse(CUSTOM_TEMPLATES_KEY, []);
    const next = custom.filter((t) => t.overridesId !== templateId);
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(next));
    notifySync(CUSTOM_TEMPLATES_KEY);
    return next;
};

// ════════════════════════════════════════════════════════════
//  Ayarlar
// ════════════════════════════════════════════════════════════

export const getSettings = () =>
    safeParse(SETTINGS_KEY, {
        coachName: '',
        signature: '',
        sendDelayMs: 1200,
        preferParentForParentTemplates: true,
    });

export const saveSettings = (settings) => {
    const next = { ...getSettings(), ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    notifySync(SETTINGS_KEY);
    return next;
};

// ════════════════════════════════════════════════════════════
//  Gönderim
// ════════════════════════════════════════════════════════════

/** wa.me bağlantısı üretir. Numara geçersizse null döner. */
export const buildWhatsAppLink = (phone, message) => {
    const n = normalizePhone(phone);
    if (!n) return null;
    return `https://wa.me/${n}?text=${encodeURIComponent(message || '')}`;
};

/**
 * Mesajı gönderir. Deeplink modunda WhatsApp'ı yeni sekmede açar;
 * gönderim tuşuna koç basar (istenmeyen mesaj riski yok).
 *
 * @returns {{success: boolean, error?: string, link?: string}}
 */
export const sendMessage = ({ phone, message, studentId, studentName, templateId, audience }) => {
    const link = buildWhatsAppLink(phone, message);

    if (!link) {
        const entry = logMessage({
            studentId, studentName, templateId, audience, phone, message,
            status: 'failed', error: 'Geçersiz telefon numarası',
        });
        return { success: false, error: 'Geçersiz telefon numarası', entry };
    }

    let opened = null;
    try {
        opened = window.open(link, '_blank', 'noopener,noreferrer');
    } catch {
        opened = null;
    }

    if (!opened) {
        // Popup engellendi — kullanıcı bağlantıyı elle açabilsin
        const entry = logMessage({
            studentId, studentName, templateId, audience, phone, message,
            status: 'blocked', error: 'Tarayıcı yeni sekmeyi engelledi',
        });
        return { success: false, error: 'Tarayıcı açılır pencereyi engelledi. Bağlantıyı elle açın.', link, entry };
    }

    const entry = logMessage({
        studentId, studentName, templateId, audience, phone, message, status: 'opened',
    });
    return { success: true, link, entry };
};

/**
 * Toplu gönderim. WhatsApp aynı anda çok sekme açılmasını sevmediği için
 * gönderimler arasına gecikme konur ve her adım geri bildirilir.
 *
 * @param {Array} items - [{ phone, message, studentId, studentName, templateId, audience }]
 * @param {object} options - { delayMs, onProgress(index, total, result) }
 */
export const sendBulk = async (items = [], options = {}) => {
    const { delayMs = getSettings().sendDelayMs || 1200, onProgress } = options;
    const results = [];

    for (let i = 0; i < items.length; i++) {
        const result = sendMessage(items[i]);
        results.push({ ...result, item: items[i] });
        onProgress?.(i + 1, items.length, result);
        if (i < items.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }

    return {
        total: items.length,
        sent: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
    };
};

// ════════════════════════════════════════════════════════════
//  Gönderim kaydı
// ════════════════════════════════════════════════════════════

export const logMessage = (entry) => {
    const log = safeParse(LOG_KEY, []);
    const record = {
        id: `wa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        sentAt: new Date().toISOString(),
        ...entry,
    };
    const next = [record, ...log].slice(0, MAX_LOG_ENTRIES);
    localStorage.setItem(LOG_KEY, JSON.stringify(next));
    notifySync(LOG_KEY);
    return record;
};

export const getMessageLog = (filter = {}) => {
    let log = safeParse(LOG_KEY, []);
    if (filter.studentId) log = log.filter((l) => String(l.studentId) === String(filter.studentId));
    if (filter.templateId) log = log.filter((l) => l.templateId === filter.templateId);
    if (filter.since) log = log.filter((l) => new Date(l.sentAt).getTime() >= filter.since);
    return log;
};

export const clearMessageLog = () => {
    localStorage.removeItem(LOG_KEY);
    notifySync(LOG_KEY);
};

/** Bir öğrenciye en son ne zaman mesaj gidildiğini döner. */
export const getLastContact = (studentId) => {
    const log = getMessageLog({ studentId });
    return log.length ? new Date(log[0].sentAt).getTime() : null;
};

// ── Firebase senkronizasyonunu tetikle ───────────────────────
const notifySync = (key) => {
    try {
        window.dispatchEvent(new StorageEvent('storage', { key }));
        window.firebaseSync?.syncKey?.(key);
    } catch { /* senkron yoksa sorun değil */ }
};

export default {
    normalizePhone,
    formatPhoneDisplay,
    isValidPhone,
    buildVariables,
    renderTemplate,
    findMissingVariables,
    buildWhatsAppLink,
    buildParentPortalLink,
    sendMessage,
    sendBulk,
    getTemplates,
    saveTemplate,
    deleteTemplate,
    getSettings,
    saveSettings,
    getMessageLog,
    clearMessageLog,
    getLastContact,
    TEMPLATE_VARIABLES,
};
