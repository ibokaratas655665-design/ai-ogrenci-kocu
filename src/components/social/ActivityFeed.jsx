import React, { useState } from 'react';
import { Award, TrendingUp, Flame, BookOpen, Trophy, MessageCircle, Clock } from 'lucide-react';

const ActivityFeed = ({ activities = [], maxItems = 10 }) => {
    const [filter, setFilter] = useState('all'); // all, achievements, study, social

    // Default activities if none provided
    const defaultActivities = [
        {
            id: 1,
            type: 'achievement',
            icon: Award,
            title: 'Yeni Rozet Kazandın!',
            description: '"İlk 50 Saat" rozetini kazandın',
            time: '5 dakika önce',
            color: 'gold'
        },
        {
            id: 2,
            type: 'streak',
            icon: Flame,
            title: '7 Günlük Seri!',
            description: 'Harika! Art arda 7 gün çalışma gerçekleştirdin',
            time: '1 saat önce',
            color: 'orange'
        },
        {
            id: 3,
            type: 'study',
            icon: BookOpen,
            title: 'Matematik Konusu Tamamlandı',
            description: 'Türev konusunu başarıyla tamamladın',
            time: '3 saat önce',
            color: 'blue'
        },
        {
            id: 4,
            type: 'level',
            icon: TrendingUp,
            title: 'Seviye Atladın!',
            description: 'Seviye 8\'e yükseldin! 🎉',
            time: 'Dün',
            color: 'purple'
        },
        {
            id: 5,
            type: 'social',
            icon: MessageCircle,
            title: 'Koçundan Mesaj',
            description: 'Koçun sana yeni bir mesaj gönderdi',
            time: 'Dün',
            color: 'green'
        }
    ];

    const feedData = activities.length > 0 ? activities : defaultActivities;

    const filteredActivities = filter === 'all'
        ? feedData
        : feedData.filter(a => a.type === filter);

    const colorConfig = {
        gold: { bg: 'bg-warn-soft', border: 'border-warn', text: 'text-warn', icon: 'text-warn' },
        orange: { bg: 'bg-warn-soft', border: 'border-warn', text: 'text-warn', icon: 'text-warn' },
        blue: { bg: 'bg-info-soft', border: 'border-info', text: 'text-info', icon: 'text-info' },
        purple: { bg: 'bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))]', border: 'border-[color-mix(in_srgb,var(--c4)_35%,transparent)]', text: 'text-c4', icon: 'text-c4' },
        green: { bg: 'bg-ok-soft', border: 'border-ok', text: 'text-ok', icon: 'text-ok' }
    };

    return (
        <div className="activity-feed-container">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold text-ink">Aktivite Akışı</h3>
                    <p className="text-sm text-ink-2 mt-1">Son başarıların ve aktivitelen</p>
                </div>
                <Trophy className="text-brand" size={28} />
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
                {[
                    { id: 'all', label: 'Hepsi', count: feedData.length },
                    { id: 'achievement', label: 'Rozetler', count: feedData.filter(a => a.type === 'achievement' || a.type === 'level').length },
                    { id: 'study', label: 'Çalışma', count: feedData.filter(a => a.type === 'study').length },
                    { id: 'social', label: 'Sosyal', count: feedData.filter(a => a.type === 'social').length }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${filter === tab.id
                                ? 'bg-brand text-white shadow-md'
                                : 'bg-surface border border-line text-ink-2 hover:border-brand-line hover:text-brand'
                            }`}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {/* Activity List */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto analytics-scroll pr-2">
                {filteredActivities.slice(0, maxItems).map((activity) => {
                    const Icon = activity.icon;
                    const colors = colorConfig[activity.color] || colorConfig.blue;

                    return (
                        <div
                            key={activity.id}
                            className={`activity-card ${colors.bg} ${colors.border} border-2 rounded-xl p-4 hover:shadow-md transition-all duration-yavas analytics-fade-in`}
                        >
                            <div className="flex items-start space-x-3">
                                <div className={`p-2 ${colors.bg} rounded-lg ${colors.icon}`}>
                                    <Icon size={20} />
                                </div>
                                <div className="flex-1">
                                    <h4 className={`font-bold text-sm ${colors.text} mb-1`}>
                                        {activity.title}
                                    </h4>
                                    <p className="text-ink-2 text-xs mb-2">
                                        {activity.description}
                                    </p>
                                    <div className="flex items-center text-xs text-ink-3">
                                        <Clock size={12} className="mr-1" />
                                        {activity.time}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredActivities.length === 0 && (
                    <div className="text-center py-12 text-ink-3">
                        <Trophy size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="font-medium">Henüz {filter === 'all' ? 'aktivite' : 'bu kategoride içerik'} yok</p>
                        <p className="text-xs mt-2">Çalışmaya başla ve ilk başarını kazan!</p>
                    </div>
                )}
            </div>

            {/* View All Button */}
            {filteredActivities.length > maxItems && (
                <button className="w-full mt-4 py-2 bg-surface-2 border border-line rounded-lg text-sm font-bold text-ink-2 hover:bg-surface-3 transition">
                    Tümünü Gör ({filteredActivities.length - maxItems} daha)
                </button>
            )}
        </div>
    );
};

export default ActivityFeed;
