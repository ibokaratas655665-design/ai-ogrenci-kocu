import React from 'react';

/**
 * 🎨 MODÜL SİMGELERİ
 *
 * Sekmelerde tek renkli çizgi ikonlar (lucide) kullanılıyordu; hepsi
 * aynı görünüyor ve konuyu anlatmıyordu. Bunlar her modülün İŞİNİ
 * gösteren, çok renkli ve hacimli küçük illüstrasyonlar.
 *
 * Tasarım kuralları:
 *   · 24×24 kutu, 1.5px kontur — küçük boyutta bile okunur
 *   · her simgede en fazla 3 renk: ana / vurgu / nötr
 *   · renkler tema değişkenlerinden gelir (currentColor DEĞİL),
 *     böylece açık ve koyu temada aynı canlılıkta durur
 *   · üstte açık, altta koyu ton — ışık yukarıdan gelir kuralı
 *
 * Dış bağımlılık yok: hepsi satır içi SVG, ağ isteği gerektirmez.
 */

const Svg = ({ size = 22, children, ...rest }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...rest}
    >
        {children}
    </svg>
);

/* ── 📊 Analiz — büyüteç altında yükselen sütunlar ───────────── */
export const IconAnalysis = (p) => (
    <Svg {...p}>
        <rect x="2.5" y="14" width="4" height="7" rx="1.2" fill="var(--c1)" opacity=".35" />
        <rect x="8" y="10" width="4" height="11" rx="1.2" fill="var(--c1)" opacity=".6" />
        <rect x="13.5" y="6" width="4" height="15" rx="1.2" fill="var(--c1)" />
        <path d="M3 9.5 8 6l4 2 6.5-4.5" stroke="var(--c3)" strokeWidth="1.7" />
        <circle cx="18.5" cy="3.5" r="1.8" fill="var(--c3)" />
    </Svg>
);

/* ── 📝 Denemeler — optik form ve kalem ──────────────────────── */
export const IconExams = (p) => (
    <Svg {...p}>
        <rect x="3" y="2.5" width="13" height="19" rx="2.4" fill="var(--surface)" stroke="var(--ink-3)" strokeWidth="1.4" />
        <circle cx="6.6" cy="7" r="1.5" fill="var(--ok)" />
        <circle cx="6.6" cy="11.5" r="1.5" fill="var(--ink-3)" opacity=".35" />
        <circle cx="6.6" cy="16" r="1.5" fill="var(--ok)" />
        <path d="M9.8 7h3.4M9.8 11.5h3.4M9.8 16h3.4" stroke="var(--ink-3)" strokeWidth="1.4" opacity=".55" />
        <path d="m18.4 8.6 2.9 2.9-6.1 6.1-3.5.6.6-3.5 6.1-6.1Z" fill="var(--c3)" />
        <path d="m18.4 8.6 2.9 2.9" stroke="var(--surface)" strokeWidth="1.2" />
    </Svg>
);

/* ── 📅 Programlar — haftalık takvim ızgarası ────────────────── */
export const IconProgram = (p) => (
    <Svg {...p}>
        <rect x="2.5" y="4" width="19" height="17" rx="2.6" fill="var(--surface)" stroke="var(--ink-3)" strokeWidth="1.4" />
        <path d="M2.5 9h19" stroke="var(--ink-3)" strokeWidth="1.4" />
        <path d="M2.5 6.6a2.6 2.6 0 0 1 2.6-2.6h13.8a2.6 2.6 0 0 1 2.6 2.6V9h-19V6.6Z" fill="var(--c2)" />
        <path d="M7.5 2v3.4M16.5 2v3.4" stroke="var(--ink-2)" strokeWidth="1.6" />
        <rect x="5" y="11.5" width="4.5" height="3" rx="1" fill="var(--c1)" opacity=".75" />
        <rect x="11" y="11.5" width="8" height="3" rx="1" fill="var(--c3)" opacity=".7" />
        <rect x="5" y="16.2" width="8" height="3" rx="1" fill="var(--c4)" opacity=".7" />
        <rect x="14.5" y="16.2" width="4.5" height="3" rx="1" fill="var(--c2)" opacity=".75" />
    </Svg>
);

/* ── 🧠 Rehberlik — konuşma balonu içinde kalp ───────────────── */
export const IconGuidance = (p) => (
    <Svg {...p}>
        <path d="M3 6.4A3.4 3.4 0 0 1 6.4 3h11.2A3.4 3.4 0 0 1 21 6.4v6.7a3.4 3.4 0 0 1-3.4 3.4H10l-4.6 3.7a.7.7 0 0 1-1.1-.55V16.5H6.4A3.4 3.4 0 0 1 3 13.1V6.4Z"
            fill="var(--c4)" opacity=".18" stroke="var(--c4)" strokeWidth="1.4" />
        <path d="M12 13.4s-3.6-2.3-3.6-4.7A2.2 2.2 0 0 1 12 7.3a2.2 2.2 0 0 1 3.6 1.4c0 2.4-3.6 4.7-3.6 4.7Z"
            fill="var(--c5)" />
    </Svg>
);

/* ── 👥 Gruplar — üç kişilik kadro ───────────────────────────── */
export const IconGroups = (p) => (
    <Svg {...p}>
        <circle cx="7" cy="8" r="2.9" fill="var(--c2)" />
        <path d="M2 20.2c0-2.9 2.2-5 5-5s5 2.1 5 5" fill="var(--c2)" opacity=".45" />
        <circle cx="16.6" cy="7.2" r="2.4" fill="var(--c1)" />
        <path d="M12.4 19.4c0-2.5 1.9-4.4 4.2-4.4s4.2 1.9 4.2 4.4" fill="var(--c1)" opacity=".4" />
        <circle cx="12" cy="4.6" r="2" fill="var(--c3)" opacity=".9" />
    </Svg>
);

/* ── 💬 WhatsApp — mesaj balonu ve onay ──────────────────────── */
export const IconWhatsApp = (p) => (
    <Svg {...p}>
        <path d="M12 2.6a9 9 0 0 0-7.8 13.5L3 21.4l5.4-1.1A9 9 0 1 0 12 2.6Z"
            fill="var(--ok)" opacity=".2" stroke="var(--ok)" strokeWidth="1.5" />
        <path d="m8.4 12.3 2.4 2.4 4.8-4.9" stroke="var(--ok)" strokeWidth="2" />
    </Svg>
);

/* ── ✨ Materyal — kitap yığını ve ışıltı ────────────────────── */
export const IconMaterial = (p) => (
    <Svg {...p}>
        <rect x="3" y="15.5" width="15.5" height="4" rx="1.2" fill="var(--c1)" />
        <rect x="4.4" y="11.2" width="15.5" height="4" rx="1.2" fill="var(--c2)" />
        <rect x="3" y="6.9" width="15.5" height="4" rx="1.2" fill="var(--c3)" />
        <path d="M20.4 3.2l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8.8-1.9Z" fill="var(--c5)" />
    </Svg>
);

/* ── 🚀 Projeler — kalkan ateşi olan roket ───────────────────── */
export const IconProjects = (p) => (
    <Svg {...p}>
        <path d="M12 2c3.2 2 5 5.5 5 9.3v3.3l-2.4 2.1h-5.2L7 14.6v-3.3C7 7.5 8.8 4 12 2Z"
            fill="var(--c1)" />
        <circle cx="12" cy="9.4" r="2.1" fill="var(--surface)" />
        <path d="M7 12.6 4.2 15v3.1L7 16.4M17 12.6 19.8 15v3.1L17 16.4" fill="var(--c1)" opacity=".55" />
        <path d="M12 17.6c1 1.3 1.5 2.6 1.5 3.9-.5-.4-1-.6-1.5-.6s-1 .2-1.5.6c0-1.3.5-2.6 1.5-3.9Z"
            fill="var(--c3)" />
    </Svg>
);

/* ── 🧑‍🏫 Öğretmen — sunum tahtası ──────────────────────────── */
export const IconTeacher = (p) => (
    <Svg {...p}>
        <rect x="2.6" y="3" width="18.8" height="12.4" rx="2.2" fill="var(--surface)" stroke="var(--ink-3)" strokeWidth="1.4" />
        <path d="M5.6 12.2 8.9 8.6l2.6 2.4 4.3-5" stroke="var(--c2)" strokeWidth="1.8" />
        <path d="M12 15.4V18" stroke="var(--ink-3)" strokeWidth="1.5" />
        <path d="M8.4 21.4 12 18l3.6 3.4" stroke="var(--ink-3)" strokeWidth="1.5" />
        <circle cx="16.2" cy="6" r="1.4" fill="var(--c3)" />
    </Svg>
);

/* ── 🎓 Taban Puan — mezuniyet kepi ──────────────────────────── */
export const IconScores = (p) => (
    <Svg {...p}>
        <path d="M12 3.4 22 8l-10 4.6L2 8l10-4.6Z" fill="var(--c1)" />
        <path d="M6.2 10.6v4.2c0 1.8 2.6 3.2 5.8 3.2s5.8-1.4 5.8-3.2v-4.2" fill="var(--c1)" opacity=".4" />
        <path d="M20.4 9.1v5.4" stroke="var(--c3)" strokeWidth="1.6" />
        <circle cx="20.4" cy="16" r="1.6" fill="var(--c3)" />
    </Svg>
);

/* ── 🗓️ Randevular — saatli takvim ──────────────────────────── */
export const IconAppointments = (p) => (
    <Svg {...p}>
        <rect x="2.6" y="4" width="14.8" height="16" rx="2.4" fill="var(--surface)" stroke="var(--ink-3)" strokeWidth="1.4" />
        <path d="M2.6 6.4A2.4 2.4 0 0 1 5 4h10a2.4 2.4 0 0 1 2.4 2.4v2.2H2.6V6.4Z" fill="var(--c4)" />
        <path d="M6.4 2.2v3.2M13.6 2.2v3.2" stroke="var(--ink-2)" strokeWidth="1.6" />
        <circle cx="16.8" cy="16.2" r="5" fill="var(--surface)" stroke="var(--c2)" strokeWidth="1.6" />
        <path d="M16.8 13.6v2.8l2 1.2" stroke="var(--c2)" strokeWidth="1.6" />
    </Svg>
);

/* ── 🛡️ Koç Yönetimi — kalkan ve kişi ───────────────────────── */
export const IconCoaches = (p) => (
    <Svg {...p}>
        <path d="M12 2.4 20 5.2v5.9c0 4.6-3.2 8.6-8 10.5-4.8-1.9-8-5.9-8-10.5V5.2L12 2.4Z"
            fill="var(--c1)" opacity=".22" stroke="var(--c1)" strokeWidth="1.5" />
        <circle cx="12" cy="10" r="2.4" fill="var(--c1)" />
        <path d="M8 17.2c0-2.2 1.8-3.8 4-3.8s4 1.6 4 3.8" fill="var(--c1)" opacity=".65" />
    </Svg>
);

/* ── 📈 Öğrenci karnesi / genel bakış ───────────────────────── */
export const IconOverview = (p) => (
    <Svg {...p}>
        <rect x="3" y="2.6" width="14.6" height="18.8" rx="2.4" fill="var(--surface)" stroke="var(--ink-3)" strokeWidth="1.4" />
        <path d="M6.4 7.4h7.8M6.4 11h5.4" stroke="var(--ink-3)" strokeWidth="1.5" opacity=".6" />
        <path d="M6.4 15.4 9 12.9l2.2 2 3.4-3.6" stroke="var(--ok)" strokeWidth="1.8" />
        <circle cx="18.6" cy="17.6" r="3.6" fill="var(--c3)" />
        <path d="M17.2 17.6l1 1 2.2-2.2" stroke="var(--surface)" strokeWidth="1.5" />
    </Svg>
);

/* ══════════════════════════════════════════════════════════
   ÖĞRENCİ PANELİ SİMGELERİ
   ══════════════════════════════════════════════════════════ */

/* ── 🏠 Giriş — çatı ve pencere ─────────────────────────────── */
export const IconHome = (p) => (
    <Svg {...p}>
        <path d="M12 2.8 21.4 10v10.2a1.4 1.4 0 0 1-1.4 1.4h-4.6v-6.2H8.6v6.2H4a1.4 1.4 0 0 1-1.4-1.4V10L12 2.8Z"
            fill="var(--c1)" opacity=".25" stroke="var(--c1)" strokeWidth="1.5" />
        <path d="M2 10.6 12 2.8l10 7.8" stroke="var(--c3)" strokeWidth="1.8" />
        <rect x="10.4" y="10.6" width="3.2" height="3.2" rx=".7" fill="var(--c3)" />
    </Svg>
);

/* ── ✅ Görevler — işaretli kontrol listesi ─────────────────── */
export const IconTasks = (p) => (
    <Svg {...p}>
        <rect x="3.4" y="2.6" width="17.2" height="18.8" rx="2.4" fill="var(--surface)" stroke="var(--ink-3)" strokeWidth="1.4" />
        <rect x="6.2" y="6" width="3.2" height="3.2" rx=".9" fill="var(--ok)" />
        <path d="m6.9 7.6.8.8 1.4-1.5" stroke="var(--surface)" strokeWidth="1.2" />
        <rect x="6.2" y="11" width="3.2" height="3.2" rx=".9" fill="var(--ok)" />
        <path d="m6.9 12.6.8.8 1.4-1.5" stroke="var(--surface)" strokeWidth="1.2" />
        <rect x="6.2" y="16" width="3.2" height="3.2" rx=".9" fill="none" stroke="var(--ink-3)" strokeWidth="1.2" />
        <path d="M11.4 7.6h6M11.4 12.6h6M11.4 17.6h4" stroke="var(--ink-3)" strokeWidth="1.4" opacity=".6" />
    </Svg>
);

/* ── ✏️ Günlük Kayıt — defter ve kalem ──────────────────────── */
export const IconDailyLog = (p) => (
    <Svg {...p}>
        <path d="M4.4 3.6A1.6 1.6 0 0 1 6 2h11.2a1.6 1.6 0 0 1 1.6 1.6v16.8a1.6 1.6 0 0 1-1.6 1.6H6a1.6 1.6 0 0 1-1.6-1.6V3.6Z"
            fill="var(--surface)" stroke="var(--ink-3)" strokeWidth="1.4" />
        <path d="M4.4 3.6A1.6 1.6 0 0 1 6 2h2.2v20H6a1.6 1.6 0 0 1-1.6-1.6V3.6Z" fill="var(--c2)" />
        <path d="M11 7.2h4.6M11 11h4.6M11 14.8h3" stroke="var(--ink-3)" strokeWidth="1.4" opacity=".6" />
        <path d="m17.8 15.6 2.6 2.6-3.6 3.6-3.2.6.6-3.2 3.6-3.6Z" fill="var(--c3)" />
    </Svg>
);

/* ── ❌ Hata Defteri — hatalı soru işareti ──────────────────── */
export const IconErrorBook = (p) => (
    <Svg {...p}>
        <path d="M4 4.4A2.4 2.4 0 0 1 6.4 2h11.2A2.4 2.4 0 0 1 20 4.4v15.2a2.4 2.4 0 0 1-2.4 2.4H6.4A2.4 2.4 0 0 1 4 19.6V4.4Z"
            fill="var(--surface)" stroke="var(--ink-3)" strokeWidth="1.4" />
        <circle cx="12" cy="10.4" r="4.4" fill="var(--danger)" opacity=".2" />
        <path d="m10.2 8.6 3.6 3.6M13.8 8.6l-3.6 3.6" stroke="var(--danger)" strokeWidth="1.9" />
        <path d="M7.8 17.4h8.4" stroke="var(--ink-3)" strokeWidth="1.4" opacity=".55" />
    </Svg>
);

/* ── 📈 Trend Matrix — yükselen çizgi ───────────────────────── */
export const IconTrend = (p) => (
    <Svg {...p}>
        <path d="M3 20.4V4" stroke="var(--ink-3)" strokeWidth="1.5" />
        <path d="M3 20.4h18" stroke="var(--ink-3)" strokeWidth="1.5" />
        <path d="M5.6 16.6 9.4 12l3.2 2.6 5.8-7.4" stroke="var(--c1)" strokeWidth="2" />
        <circle cx="9.4" cy="12" r="1.8" fill="var(--c1)" />
        <circle cx="12.6" cy="14.6" r="1.8" fill="var(--c1)" />
        <circle cx="18.4" cy="7.2" r="2.2" fill="var(--ok)" />
    </Svg>
);

/* ── ⚡ Akıllı Plan — şimşek ve rota ────────────────────────── */
export const IconSmartPlan = (p) => (
    <Svg {...p}>
        <rect x="2.8" y="3.4" width="18.4" height="17.2" rx="2.6" fill="var(--surface)" stroke="var(--ink-3)" strokeWidth="1.4" />
        <path d="M2.8 6a2.6 2.6 0 0 1 2.6-2.6h13.2A2.6 2.6 0 0 1 21.2 6v1.8H2.8V6Z" fill="var(--c4)" />
        <path d="m13.2 10-4 5.2h2.8l-1.2 3.6 4.2-5.4h-2.9L13.2 10Z" fill="var(--c3)" />
    </Svg>
);

/* ── ⏱️ Odaklan — kronometre ───────────────────────────────── */
export const IconFocus = (p) => (
    <Svg {...p}>
        <circle cx="12" cy="13.6" r="8" fill="var(--surface)" stroke="var(--c2)" strokeWidth="1.6" />
        <path d="M12 13.6V8.8" stroke="var(--c2)" strokeWidth="1.9" />
        <path d="M12 13.6l3.2 2.4" stroke="var(--c3)" strokeWidth="1.9" />
        <path d="M9.6 2.4h4.8" stroke="var(--ink-2)" strokeWidth="1.8" />
        <path d="M12 2.4v3.2" stroke="var(--ink-2)" strokeWidth="1.8" />
        <circle cx="12" cy="13.6" r="1.5" fill="var(--c3)" />
    </Svg>
);

/* ── 🏆 Portfolyo — kupa ────────────────────────────────────── */
export const IconPortfolio = (p) => (
    <Svg {...p}>
        <path d="M7 3.4h10v5.4a5 5 0 0 1-10 0V3.4Z" fill="var(--c3)" />
        <path d="M7 5h-2a2.4 2.4 0 0 0 2.4 2.4H7M17 5h2a2.4 2.4 0 0 1-2.4 2.4H17" stroke="var(--c3)" strokeWidth="1.5" />
        <path d="M12 13.8v3.6" stroke="var(--ink-3)" strokeWidth="1.7" />
        <path d="M8.4 21h7.2a1 1 0 0 0-1-1.4H9.4A1 1 0 0 0 8.4 21Z" fill="var(--ink-3)" opacity=".7" />
        <circle cx="12" cy="6.4" r="1.6" fill="var(--surface)" opacity=".7" />
    </Svg>
);

/* ── 💬 Mesajlar — iki balon ────────────────────────────────── */
export const IconMessages = (p) => (
    <Svg {...p}>
        <path d="M2.6 6.4A2.6 2.6 0 0 1 5.2 3.8h9.2a2.6 2.6 0 0 1 2.6 2.6v4.8a2.6 2.6 0 0 1-2.6 2.6H8l-3.6 2.8a.6.6 0 0 1-1-.5v-2.3H5.2a2.6 2.6 0 0 1-2.6-2.6V6.4Z"
            fill="var(--c1)" opacity=".2" stroke="var(--c1)" strokeWidth="1.4" />
        <path d="M19.6 9.4h-.8v2.2a4 4 0 0 1-4 4h-4v.9a2.4 2.4 0 0 0 2.4 2.4h4.4l2.9 2.2a.5.5 0 0 0 .8-.4V18a2.4 2.4 0 0 0 .3-1.2v-5a2.4 2.4 0 0 0-2-2.4Z"
            fill="var(--c2)" />
    </Svg>
);

/* ── 🧭 Değerlendirme — pusula/onay ─────────────────────────── */
export const IconAssessment = (p) => (
    <Svg {...p}>
        <circle cx="12" cy="12" r="9" fill="var(--ok)" opacity=".18" stroke="var(--ok)" strokeWidth="1.5" />
        <path d="m7.8 12.2 2.9 2.9 5.5-6" stroke="var(--ok)" strokeWidth="2.1" />
    </Svg>
);

/* Konu listesi: üstü işaretlenmiş bir müfredat listesi */
export const IconTopics = (p) => (
    <Svg {...p}>
        <rect x="3.5" y="3.5" width="17" height="17" rx="3"
            fill="var(--brand)" opacity=".14" stroke="var(--brand)" strokeWidth="1.5" />
        <path d="m6.8 8.4 1.5 1.5 2.6-2.8" stroke="var(--ok)" strokeWidth="2" />
        <path d="m6.8 13.4 1.5 1.5 2.6-2.8" stroke="var(--ok)" strokeWidth="2" />
        <path d="M13.2 8.6h4.2M13.2 13.6h4.2M6.6 18.2h10.8"
            stroke="var(--brand)" strokeWidth="1.6" opacity=".75" />
    </Svg>
);

/* Sekme kimliğinden simgeye eşleme — CoachDashboard bunu kullanır */
export const MODULE_ICONS = {
    analysis: IconAnalysis,
    exams: IconExams,
    programs: IconProgram,
    guidance: IconGuidance,
    groups: IconGroups,
    whatsapp: IconWhatsApp,
    material: IconMaterial,
    projects: IconProjects,
    'teacher-scheduler': IconTeacher,
    'university-scores': IconScores,
    appointments: IconAppointments,
    coaches: IconCoaches,
    overview: IconOverview,

    // Öğrenci paneli
    home: IconHome,
    tasks: IconTasks,
    'daily-log': IconDailyLog,
    'error-notebook': IconErrorBook,
    matrix: IconTrend,
    program: IconProgram,
    'smart-plan': IconSmartPlan,
    pomodoro: IconFocus,
    assessment: IconAssessment,
    portfolio: IconPortfolio,
    tests: IconGuidance,
    messages: IconMessages,
    topics: IconTopics,
};

export default MODULE_ICONS;
