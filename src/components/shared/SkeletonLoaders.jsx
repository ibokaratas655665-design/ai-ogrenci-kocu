/**
 * ⚡ SKELETON LOADING COMPONENTS
 * Veri yüklenirken shimmer animasyonlu placeholder bileşenler
 */
import React from 'react';

// ─── Shimmer Animasyon CSS ────────────────────────────────────
const shimmerClass = 'animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%]';
const darkShimmerClass = 'animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%]';

// ─── Base Skeleton ────────────────────────────────────────────
export const SkeletonBox = ({ className = '', dark = false }) => (
    <div className={`rounded-lg ${dark ? darkShimmerClass : shimmerClass} ${className}`} />
);

// ─── Öğrenci Dashboard Yükleme ────────────────────────────────
export const StudentDashboardSkeleton = () => (
    <div className="min-h-screen bg-surface-2">
        {/* Header */}
        <div className="bg-surface border-b border-line sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <SkeletonBox className="w-10 h-10 rounded-xl" />
                    <div className="space-y-1.5">
                        <SkeletonBox className="h-4 w-32" />
                        <SkeletonBox className="h-3 w-24" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <SkeletonBox className="h-8 w-24 rounded-xl" />
                    <SkeletonBox className="h-8 w-24 rounded-xl" />
                    <SkeletonBox className="h-8 w-8 rounded-xl" />
                    <SkeletonBox className="h-8 w-8 rounded-xl" />
                </div>
            </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-surface border-b border-line px-4">
            <div className="max-w-7xl mx-auto flex gap-4 py-2 overflow-x-auto">
                {[80, 72, 90, 70, 80, 68, 85, 70, 82].map((w, i) => (
                    <SkeletonBox key={i} className={`h-8 w-${w > 80 ? '[90px]' : '[70px]'} rounded-lg flex-shrink-0`} style={{ width: w }} />
                ))}
            </div>
        </div>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sol sütun */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Stat kartları */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-surface rounded-2xl p-4 shadow-sm border border-line">
                                <SkeletonBox className="h-3 w-20 mb-2" />
                                <SkeletonBox className="h-7 w-12" />
                            </div>
                        ))}
                    </div>

                    {/* Büyük kart */}
                    <div className="bg-surface rounded-2xl p-5 shadow-sm border border-line">
                        <SkeletonBox className="h-5 w-40 mb-4" />
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-3">
                                    <SkeletonBox className="w-10 h-10 rounded-xl" />
                                    <div className="flex-1 space-y-1.5">
                                        <SkeletonBox className="h-3.5 w-full" />
                                        <SkeletonBox className="h-3 w-2/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Grafik alanı */}
                    <div className="bg-surface rounded-2xl p-5 shadow-sm border border-line">
                        <SkeletonBox className="h-5 w-48 mb-4" />
                        <SkeletonBox className="h-48 w-full rounded-xl" />
                    </div>
                </div>

                {/* Sağ sütun */}
                <div className="space-y-4">
                    <div className="bg-surface rounded-2xl p-5 shadow-sm border border-line">
                        <SkeletonBox className="h-32 w-full rounded-xl mb-3" />
                        <SkeletonBox className="h-4 w-full mb-2" />
                        <SkeletonBox className="h-4 w-3/4" />
                    </div>
                    <div className="bg-surface rounded-2xl p-5 shadow-sm border border-line">
                        <SkeletonBox className="h-5 w-32 mb-3" />
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                <SkeletonBox className="h-3 w-24" />
                                <SkeletonBox className="h-5 w-12 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    </div>
);

// ─── Öğrenci Kart Skeleton ──────────────────────────────────
export const StudentCardSkeleton = ({ count = 3 }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(count)].map((_, i) => (
            <div key={i} className="bg-surface rounded-2xl p-5 shadow-sm border border-line">
                <div className="flex items-center gap-3 mb-4">
                    <SkeletonBox className="w-12 h-12 rounded-2xl" />
                    <div className="flex-1 space-y-1.5">
                        <SkeletonBox className="h-4 w-28" />
                        <SkeletonBox className="h-3 w-20" />
                    </div>
                    <SkeletonBox className="h-6 w-16 rounded-full" />
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                    {[1, 2, 3].map(j => (
                        <div key={j} className="bg-surface-2 rounded-xl p-2.5 text-center">
                            <SkeletonBox className="h-5 w-8 mx-auto mb-1" />
                            <SkeletonBox className="h-2.5 w-12 mx-auto" />
                        </div>
                    ))}
                </div>
                <div className="space-y-1.5">
                    <SkeletonBox className="h-2 w-full rounded-full" />
                    <SkeletonBox className="h-2 w-5/6 rounded-full" />
                </div>
            </div>
        ))}
    </div>
);

// ─── Tablo Skeleton ──────────────────────────────────────────
export const TableSkeleton = ({ rows = 5, cols = 6 }) => (
    <div className="bg-surface rounded-2xl border border-line overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-surface-2 border-b flex gap-4">
            {[...Array(cols)].map((_, i) => (
                <SkeletonBox key={i} className="h-3 flex-1" />
            ))}
        </div>
        {/* Rows */}
        {[...Array(rows)].map((_, i) => (
            <div key={i} className="px-4 py-3.5 border-b border-gray-50 flex gap-4 items-center">
                <SkeletonBox className="h-3 w-6 flex-shrink-0" />
                <div className="flex items-center gap-2 flex-shrink-0 w-32">
                    <SkeletonBox className="w-7 h-7 rounded-lg" />
                    <SkeletonBox className="h-3 flex-1" />
                </div>
                {[...Array(cols - 2)].map((_, j) => (
                    <SkeletonBox key={j} className="h-3 flex-1" />
                ))}
            </div>
        ))}
    </div>
);

// ─── Koç Dashboard Skeleton ──────────────────────────────────
export const CoachDashboardSkeleton = () => (
    <div className="min-h-screen bg-surface-2">
        {/* Header */}
        <div className="on-color bg-gradient-to-r from-indigo-700 to-purple-800 px-6 py-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="space-y-2">
                    <SkeletonBox dark className="h-7 w-48" />
                    <SkeletonBox dark className="h-4 w-72" />
                </div>
                <div className="flex gap-2">
                    {[1, 2, 3, 4].map(i => <SkeletonBox key={i} dark className="h-9 w-24 rounded-xl" />)}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mt-4">
                {[1, 2, 3, 4].map(i => <SkeletonBox key={i} dark className="h-20 w-[110px] rounded-2xl" />)}
            </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-surface rounded-2xl p-4 border border-line">
                            <SkeletonBox className="h-4 w-24 mb-3" />
                            <SkeletonBox className="h-8 w-16 mb-1" />
                            <SkeletonBox className="h-3 w-full" />
                        </div>
                    ))}
                </div>
                <div className="lg:col-span-3">
                    <StudentCardSkeleton count={6} />
                </div>
            </div>
        </div>
    </div>
);

// ─── Chat Bubble Skeleton ────────────────────────────────────
export const ChatSkeleton = () => (
    <div className="space-y-4 p-4">
        {[false, true, false, true, false].map((isRight, i) => (
            <div key={i} className={`flex ${isRight ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[60%] space-y-1.5 ${isRight ? 'items-end' : 'items-start'} flex flex-col`}>
                    <SkeletonBox className={`h-10 ${[120, 180, 150, 200, 130][i]}px rounded-2xl`} style={{ width: [120, 180, 150, 200, 130][i] }} />
                    <SkeletonBox className="h-2.5 w-12" />
                </div>
            </div>
        ))}
    </div>
);

// ─── Inline Loading ──────────────────────────────────────────
export const InlineLoader = ({ text = 'Yükleniyor...' }) => (
    <div className="flex items-center gap-3 py-8 justify-center">
        <div className="flex gap-1">
            {[0, 1, 2].map(i => (
                <div
                    key={i}
                    className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s` }}
                />
            ))}
        </div>
        <span className="text-sm text-ink-2 font-medium">{text}</span>
    </div>
);

// Default export en yaygın kullanılan
export default StudentDashboardSkeleton;
