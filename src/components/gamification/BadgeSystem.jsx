import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Star, Zap, Flame, Lock, CheckCircle, X, Sparkles } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

// ── Rozet tanımları ─────────────────────────────────────────────
/**
 * KATEGORİLER — referanstaki gruplama.
 *
 * On dokuz rozet düz bir ızgarada duruyordu; hangisinin neyle
 * ilgili olduğu ancak adından anlaşılıyordu. Referans rozetleri
 * konularına göre grupluyor ve her grubun başına "2/4" sayacı
 * koyuyor: öğrenci hangi alanda ilerlediğini, hangisinde hiç
 * başlamadığını tek bakışta görüyor.
 *
 * `olc` ve `hedef` alanları rozetin İLERLEMESİNİ ölçer. Eskiden
 * yalnızca `req` vardı — kilitli bir rozette "ne kadar kaldı"
 * bilinmiyordu, rozet ya vardı ya yoktu.
 */
export const KATEGORILER = [
    { id: 'baslangic', ad: 'Başlangıç' },
    { id: 'calisma', ad: 'Çalışma' },
    { id: 'süreklilik', ad: 'Süreklilik' },
    { id: 'deneme', ad: 'Denemeler' },
    { id: 'gorev', ad: 'Görevler' },
    { id: 'odak', ad: 'Odak' },
    { id: 'seviye', ad: 'Seviye' },
];

export const BADGES = [
    // Başlangıç rozetleri
    { id: 'first_login', icon: '🌟', name: 'İlk Adım', desc: 'İlk kez giriş yaptın!', xp: 50, tier: 'bronze', req: s => s.totalLogins >= 1 , kategori: 'baslangic', olc: s => Math.min(1, s.totalLogins || 0), hedef: 1 },
    { id: 'first_exam', icon: '📝', name: 'İlk Deneme', desc: 'İlk deneme sonucunu görüntüledin.', xp: 100, tier: 'bronze', req: s => s.examsCompleted >= 1 , kategori: 'baslangic', olc: s => Math.min(1, s.examsCompleted || 0), hedef: 1 },
    { id: 'first_task', icon: '✅', name: 'Görevci', desc: 'İlk görevi tamamladın.', xp: 75, tier: 'bronze', req: s => s.tasksCompleted >= 1 , kategori: 'baslangic', olc: s => Math.min(1, s.tasksCompleted || 0), hedef: 1 },
    { id: 'first_pomodoro', icon: '🍅', name: 'Odak Ustası', desc: 'İlk pomodoro seansını bitirdin.', xp: 60, tier: 'bronze', req: s => s.pomodorosCompleted >= 1 , kategori: 'baslangic', olc: s => Math.min(1, s.pomodorosCompleted || 0), hedef: 1 },
    // Çalışma rozetleri
    { id: 'study_10h', icon: '⏱️', name: '10 Saat Çalışma', desc: 'Toplam 10 saat çalıştın.', xp: 200, tier: 'silver', req: s => s.totalStudyHours >= 10 , kategori: 'calisma', olc: s => s.totalStudyHours || 0, hedef: 10 },
    { id: 'study_50h', icon: '📚', name: '50 Saat Çalışma', desc: 'Toplam 50 saat çalıştın!', xp: 500, tier: 'gold', req: s => s.totalStudyHours >= 50 , kategori: 'calisma', olc: s => s.totalStudyHours || 0, hedef: 50 },
    { id: 'study_100h', icon: '🎓', name: 'Eğitim Kafası', desc: 'Toplam 100 saat çalışma!', xp: 1000, tier: 'platinum', req: s => s.totalStudyHours >= 100 , kategori: 'calisma', olc: s => s.totalStudyHours || 0, hedef: 100 },
    // Seri rozetleri
    { id: 'streak_3', icon: '🔥', name: '3 Günlük Seri', desc: '3 gün üst üste çalıştın.', xp: 150, tier: 'bronze', req: s => s.currentStreak >= 3 , kategori: 'süreklilik', olc: s => s.currentStreak || 0, hedef: 3 },
    { id: 'streak_7', icon: '⚡', name: 'Haftalık Azim', desc: '7 gün üst üste çalıştın!', xp: 350, tier: 'silver', req: s => s.currentStreak >= 7 , kategori: 'süreklilik', olc: s => s.currentStreak || 0, hedef: 7 },
    { id: 'streak_30', icon: '💎', name: 'Aylık Çalışkan', desc: '30 gün üst üste! İnanılmaz!', xp: 1500, tier: 'platinum', req: s => s.currentStreak >= 30 , kategori: 'süreklilik', olc: s => s.currentStreak || 0, hedef: 30 },
    // Deneme rozetleri
    { id: 'exams_5', icon: '🏅', name: '5 Deneme', desc: '5 sınav sonucunu inceledik.', xp: 200, tier: 'silver', req: s => s.examsCompleted >= 5 , kategori: 'deneme', olc: s => s.examsCompleted || 0, hedef: 5 },
    { id: 'exams_10', icon: '🥇', name: 'Sınav Deneyimi', desc: '10 sınav analizi tamamlandı.', xp: 400, tier: 'gold', req: s => s.examsCompleted >= 10 , kategori: 'deneme', olc: s => s.examsCompleted || 0, hedef: 10 },
    // XP rozetleri
    { id: 'xp_500', icon: '⭐', name: 'Yükselen Yıldız', desc: '500 XP topladın!', xp: 0, tier: 'bronze', req: s => s.totalXP >= 500 , kategori: 'seviye', olc: s => s.totalXP || 0, hedef: 500 },
    { id: 'xp_2000', icon: '🌙', name: 'Parlayan Ay', desc: '2000 XP topladın!', xp: 0, tier: 'silver', req: s => s.totalXP >= 2000 , kategori: 'seviye', olc: s => s.totalXP || 0, hedef: 2000 },
    { id: 'xp_5000', icon: '🌟', name: 'Süpernova', desc: '5000 XP! Efsanesin!', xp: 0, tier: 'gold', req: s => s.totalXP >= 5000 , kategori: 'seviye', olc: s => s.totalXP || 0, hedef: 5000 },
    // Görev rozetleri
    { id: 'tasks_10', icon: '📋', name: 'Görev Ustası', desc: '10 görevi tamamladın.', xp: 300, tier: 'silver', req: s => s.tasksCompleted >= 10 , kategori: 'gorev', olc: s => s.tasksCompleted || 0, hedef: 10 },
    { id: 'tasks_50', icon: '🦁', name: 'Aslan Yürekli', desc: '50 görevi tamamladın!', xp: 750, tier: 'gold', req: s => s.tasksCompleted >= 50 , kategori: 'gorev', olc: s => s.tasksCompleted || 0, hedef: 50 },
    // Pomodoro rozetleri
    { id: 'pomodoro_10', icon: '🎯', name: 'Odaklı Kahraman', desc: '10 pomodoro tamamladın.', xp: 250, tier: 'silver', req: s => s.pomodorosCompleted >= 10 , kategori: 'odak', olc: s => s.pomodorosCompleted || 0, hedef: 10 },
    { id: 'pomodoro_50', icon: '🧠', name: 'Beyin Fırtınası', desc: '50 pomodoro seansi!', xp: 600, tier: 'gold', req: s => s.pomodorosCompleted >= 50 , kategori: 'odak', olc: s => s.pomodorosCompleted || 0, hedef: 50 },
];

// Tier renkleri
const TIER_STYLES = {
    bronze: { bg: 'from-amber-700 to-amber-500', ring: 'ring-amber-400', badge: 'bg-warn-soft text-warn' },
    silver: { bg: 'from-slate-500 to-slate-400', ring: 'ring-slate-300', badge: 'bg-surface-3 text-ink-2' },
    gold: { bg: 'from-yellow-500 to-amber-400', ring: 'ring-yellow-400', badge: 'bg-warn-soft text-warn' },
    platinum: { bg: 'from-violet-600 to-indigo-500', ring: 'ring-violet-400', badge: 'bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] text-c4' },
};

// ── Rozet Pop-up ─────────────────────────────────────────────────
export const BadgePopup = ({ badge, onClose }) => {
    const tier = TIER_STYLES[badge.tier] || TIER_STYLES.bronze;
    useEffect(() => {
        const t = setTimeout(onClose, 4000);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="fixed bottom-6 right-6 z-notify animate-slide-in-right">
            <div className={`bg-gradient-to-br ${tier.bg} text-ink rounded-2xl p-4 shadow-2xl max-w-xs flex items-center gap-3 ring-2 ${tier.ring}`}>
                <div className="text-4xl flex-shrink-0">{badge.icon}</div>
                <div className="flex-1">
                    <div className="flex items-center gap-1 mb-0.5">
                        <Sparkles size={12} className="text-warn" />
                        <span className="text-xs font-bold opacity-80">YENİ ROZET!</span>
                    </div>
                    <p className="font-black text-sm">{badge.name}</p>
                    <p className="text-xs opacity-80 mt-0.5">{badge.desc}</p>
                    {badge.xp > 0 && (
                        <span className="inline-block mt-1 text-xs font-bold bg-surface/20 px-2 py-0.5 rounded-full">
                            +{badge.xp} XP
                        </span>
                    )}
                </div>
                <button onClick={onClose} className="p-1 hover:bg-surface/20 rounded-full">
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};

// ── Rozet Koleksiyonu (StudentDashboard'a entegre) ────────────────
const BadgeCollection = ({ userStats = {}, earnedBadgeIds = [] }) => {
    const [filter, setFilter] = useState('all');
    const [hovered, setHovered] = useState(null);

    const filtered = BADGES.filter(b => {
        if (filter === 'earned') return earnedBadgeIds.includes(b.id);
        if (filter === 'locked') return !earnedBadgeIds.includes(b.id);
        if (filter !== 'all') return b.tier === filter;
        return true;
    });

    const earnedCount = BADGES.filter(b => earnedBadgeIds.includes(b.id)).length;
    const totalXP = BADGES.filter(b => earnedBadgeIds.includes(b.id)).reduce((s, b) => s + b.xp, 0);

    /**
     * SIRADAKİ HEDEF — referanstaki "NEXT TARGET" kartı.
     *
     * Kilitli rozetler arasında hedefe EN YAKIN olan. Ölçüt yüzde:
     * "50 saatin 48'i" ile "30 günün 5'i" arasında ilkine daha yakınız.
     * Rozet listesi tek başına "neyi kaçırdığımı" söyler ama "hangisine
     * bir adım kaldığını" söylemez; asıl motive eden o.
     */
    const sonrakiHedef = BADGES
        .filter((b) => !earnedBadgeIds.includes(b.id) && typeof b.olc === 'function' && b.hedef)
        .map((b) => {
            const su = Number(b.olc(userStats)) || 0;
            return { ...b, su, oran: Math.min(100, Math.round((su / b.hedef) * 100)) };
        })
        .sort((a, b) => b.oran - a.oran)[0] || null;

    /* Kategori grupları — her birinde kazanılan/toplam sayacı */
    const gruplar = KATEGORILER.map((k) => {
        const uyeler = BADGES.filter((b) => b.kategori === k.id);
        return { ...k, uyeler, kazanilan: uyeler.filter((b) => earnedBadgeIds.includes(b.id)).length };
    }).filter((g) => g.uyeler.length);

    const FILTERS = [
        { id: 'all', label: `Tümü (${BADGES.length})` },
        { id: 'earned', label: `Kazanıldı (${earnedCount})` },
        { id: 'locked', label: `Kilitli (${BADGES.length - earnedCount})` },
    ];

    return (
        <div className="space-y-5">
            {/* Başlık + özet */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-ink flex items-center gap-2">
                        <Trophy size={22} className="text-warn" />
                        Rozetlerim
                    </h2>
                    <p className="text-sm text-ink-2 mt-0.5">{earnedCount}/{BADGES.length} rozet · {totalXP.toLocaleString('tr-TR')} XP kazanıldı</p>
                </div>
                <div className="flex gap-3">
                    <div className="text-center">
                        <div className="text-2xl font-black text-brand">{earnedCount}</div>
                        <div className="text-xs text-ink-2">Rozet</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-black text-warn">{Math.round(earnedCount / BADGES.length * 100)}%</div>
                        <div className="text-xs text-ink-2">Tamamlandı</div>
                    </div>
                </div>
            </div>

            {/* İlerleme çubuğu.
                Degrade indigo-mor eski tema kalıntısıydı; marka rengine alındı. */}
            <div className="bg-surface-3 rounded-full h-2.5 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-yavas"
                    style={{ width: `${(earnedCount / BADGES.length) * 100}%`, background: 'var(--brand)' }}
                />
            </div>

            {/* SIRADAKİ HEDEF — referanstaki "NEXT TARGET".
                Rozet listesi "neyi kaçırdığımı" söyler ama "hangisine bir
                adım kaldığını" söylemez; asıl motive eden odur. Hedefe en
                YAKIN kilitli rozet, ilerlemesiyle birlikte. */}
            {sonrakiHedef && (
                <div
                    className="rounded-dlg p-4 flex items-center gap-4"
                    style={{ background: 'var(--krem)', border: '1px solid var(--krem-line)' }}
                >
                    <span
                        className="shrink-0 w-14 h-14 rounded-full grid place-items-center text-2xl"
                        style={{ background: 'var(--surface)', border: '2px dashed var(--brand-line)' }}
                    >
                        {sonrakiHedef.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest m-0"
                            style={{ color: 'var(--brand-metin)' }}>Sıradaki Hedef</p>
                        <p className="text-base font-black text-ink m-0 mt-0.5">{sonrakiHedef.name}</p>
                        <p className="tip-caption m-0 mt-0.5">{sonrakiHedef.desc}</p>
                        <div className="mt-2 h-2 rounded-full bg-surface-3 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-yavas"
                                style={{ width: `${sonrakiHedef.oran}%`, background: 'var(--brand)' }} />
                        </div>
                    </div>
                    <div className="shrink-0 text-right">
                        <p className="text-lg font-black tabular-nums m-0" style={{ color: 'var(--brand-metin)' }}>
                            {sonrakiHedef.su} / {sonrakiHedef.hedef}
                        </p>
                        {sonrakiHedef.xp > 0 && (
                            <p className="tip-mini text-ink-3 m-0">+{sonrakiHedef.xp} XP</p>
                        )}
                    </div>
                </div>
            )}

            {/* KATEGORİ SAYAÇLARI — referanstaki grup başlıkları.
                On dokuz rozet düz bir ızgaradaydı; hangisinin neyle ilgili
                olduğu ancak adından anlaşılıyordu. Bu şerit "hangi alanda
                ilerledim, hangisinde hiç başlamadım" sorusunu yanıtlar. */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {gruplar.map((g) => {
                    const tam = g.kazanilan === g.uyeler.length;
                    return (
                        <div key={g.id} className="rounded-dmd border border-line bg-surface px-3 py-2.5 text-center">
                            <p className="tip-mini text-ink-3 uppercase tracking-wider m-0 truncate">{g.ad}</p>
                            <p className="text-base font-black tabular-nums m-0 mt-0.5"
                                style={{ color: tam ? 'var(--ok)' : 'var(--ink)' }}>
                                {g.kazanilan}<span className="text-ink-3 text-[12px]">/{g.uyeler.length}</span>
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Filtreler */}
            <div className="flex gap-2 flex-wrap">
                {FILTERS.map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filter === f.id
                            ? 'bg-brand text-white shadow-md'
                            : 'bg-surface-3 text-ink-2 hover:bg-surface-3'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Rozet Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {filtered.map(badge => {
                    const isEarned = earnedBadgeIds.includes(badge.id);
                    const tier = TIER_STYLES[badge.tier] || TIER_STYLES.bronze;
                    return (
                        <div
                            key={badge.id}
                            className={`relative rounded-2xl p-3 text-center transition-all duration-normal cursor-pointer group
                                ${isEarned
                                    ? `bg-gradient-to-br ${tier.bg} ring-2 ${tier.ring} shadow-lg hover:scale-105`
                                    : 'bg-surface-3 opacity-40 hover:opacity-60'
                                }`}
                            onMouseEnter={() => setHovered(badge.id)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <div className={`text-3xl mb-1 ${isEarned ? '' : 'grayscale'}`}>
                                {isEarned ? badge.icon : '🔒'}
                            </div>
                            <p className={`text-[10px] font-bold leading-tight ${isEarned ? 'text-ink' : 'text-ink-2'}`}>
                                {badge.name}
                            </p>
                            {badge.xp > 0 && isEarned && (
                                <span className="text-[9px] bg-surface/20 text-ink px-1.5 py-0.5 rounded-full font-bold mt-0.5 inline-block">
                                    +{badge.xp}XP
                                </span>
                            )}

                            {/* Tooltip */}
                            {hovered === badge.id && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-44 bg-surface-inv text-white text-xs rounded-xl p-2 shadow-xl pointer-events-none">
                                    <p className="font-bold mb-0.5">{badge.name}</p>
                                    <p className="opacity-80">{badge.desc}</p>
                                    {!isEarned && (
                                        <p className="mt-1 text-warn font-semibold flex items-center gap-1">
                                            <Lock size={10} /> Henüz kazanılmadı
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ── XP & Seviye Bar'ı (kompakt) ──────────────────────────────────
export const XPBar = ({ totalXP = 0 }) => {
    const level = Math.floor(totalXP / 500) + 1;
    const xpInLevel = totalXP % 500;
    const progress = (xpInLevel / 500) * 100;

    const levelTitles = ['Çaylak', 'Öğrenci', 'Azimli', 'Kararlı', 'Odaklı',
        'Yetenekli', 'Uzman', 'Usta', 'Elit', 'Efsane'];
    const title = levelTitles[Math.min(level - 1, levelTitles.length - 1)];

    return (
        <div className="on-color bg-gradient-to-br from-brand to-violet-700 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-surface/20 rounded-xl flex items-center justify-center font-black text-lg border border-white/30">
                        {level}
                    </div>
                    <div>
                        <p className="font-black text-sm">Seviye {level}</p>
                        <p className="text-xs opacity-75">{title}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-black text-lg">{totalXP.toLocaleString('tr-TR')} <span className="text-xs opacity-75">XP</span></p>
                    <p className="text-xs opacity-75">{500 - xpInLevel} XP kaldı</p>
                </div>
            </div>
            <div className="bg-surface/20 rounded-full h-2.5 overflow-hidden">
                <div
                    className="on-color h-full bg-gradient-to-r from-yellow-300 to-amber-400 rounded-full transition-all duration-yavas"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

// ── Seri Takibi (kompakt güncellenmiş) ────────────────────────────
export const StreakCard = ({ currentStreak = 0, maxStreak = 0 }) => {
    const days = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
    const today = new Date().getDay();
    const todayIdx = today === 0 ? 6 : today - 1;

    return (
        <div className="bg-surface rounded-2xl p-5 shadow-sm border border-line">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-ink flex items-center gap-2">
                    <Flame size={18} className="text-warn" />
                    Çalışma Serisi
                </h3>
                <div className="flex items-center gap-1 bg-warn-soft px-3 py-1 rounded-xl">
                    <Flame size={14} className="text-warn" />
                    <span className="font-black text-warn">{currentStreak}</span>
                    <span className="text-xs text-warn">gün</span>
                </div>
            </div>

            <div className="flex gap-2 justify-between mb-4">
                {days.map((day, i) => {
                    const isActive = i <= todayIdx && currentStreak > 0 && (todayIdx - i) < currentStreak;
                    const isToday = i === todayIdx;
                    return (
                        <div key={day} className="flex flex-col items-center gap-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all
                                ${isToday ? 'ring-2 ring-orange-400' : ''}
                                ${isActive
                                    ? 'bg-gradient-to-br from-orange-500 to-red-500 text-ink shadow-md'
                                    : 'bg-surface-3 text-ink-3'
                                }`}
                            >
                                {isActive ? '🔥' : day}
                            </div>
                            <span className={`text-[9px] font-bold ${isToday ? 'text-warn' : 'text-ink-3'}`}>{day}</span>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center justify-between text-sm">
                <span className="text-ink-2">En uzun seri:</span>
                <span className="font-black text-ink">{maxStreak} gün 🏆</span>
            </div>
        </div>
    );
};

export default BadgeCollection;
