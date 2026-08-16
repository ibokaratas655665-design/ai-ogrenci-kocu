import React from 'react';
import { Users, Video, Clock, TrendingUp } from 'lucide-react';

const StudyRoomCard = ({ room, onJoin }) => {
    const {
        id,
        name = 'Matematik Çalışma Odası',
        subject = 'Matematik',
        currentUsers = 3,
        maxUsers = 8,
        status = 'active', // active, full, scheduled
        startTime,
        topic = 'Türev ve İntegral'
    } = room || {};

    const occupancyRate = (currentUsers / maxUsers) * 100;

    const statusConfig = {
        active: { bg: 'bg-ok-soft', border: 'border-ok', text: 'text-ok', badge: 'Aktif' },
        full: { bg: 'bg-danger-soft', border: 'border-danger', text: 'text-danger', badge: 'Dolu' },
        scheduled: { bg: 'bg-warn-soft', border: 'border-warn', text: 'text-warn', badge: 'Planlanmış' }
    };

    const config = statusConfig[status];

    return (
        <div className={`study-room-card ${config.bg} ${config.border} border-2 rounded-2xl p-5 hover:shadow-lg transition-all duration-300`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-lg font-black text-ink">{name}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${config.bg} ${config.text} border ${config.border}`}>
                            {config.badge}
                        </span>
                    </div>
                    <p className="text-sm text-ink-2 font-medium">{topic}</p>
                </div>
                <div className={`p-3 rounded-full ${config.bg}`}>
                    <Video className={config.text} size={24} />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-surface/60 backdrop-blur-sm rounded-lg p-3 border border-line">
                    <div className="flex items-center justify-between mb-1">
                        <Users size={16} className="text-ink-3" />
                        <span className="text-xs font-bold text-ink-2">{currentUsers}/{maxUsers}</span>
                    </div>
                    <div className="text-xs text-ink-2 font-medium">Katılımcı</div>
                    <div className="w-full bg-surface-3 rounded-full h-1.5 mt-2">
                        <div
                            className={`h-full rounded-full transition-all ${occupancyRate >= 80 ? 'bg-danger' : 'bg-brand'}`}
                            style={{ width: `${occupancyRate}%` }}
                        />
                    </div>
                </div>

                <div className="bg-surface/60 backdrop-blur-sm rounded-lg p-3 border border-line">
                    <div className="flex items-center justify-between mb-1">
                        <Clock size={16} className="text-ink-3" />
                        <span className="text-xs font-bold text-ink-2">
                            {startTime || 'Şimdi'}
                        </span>
                    </div>
                    <div className="text-xs text-ink-2 font-medium">Başlangıç</div>
                </div>
            </div>

            {/* Subject Tag */}
            <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-brand-soft text-brand rounded-full text-xs font-bold">
                    📚 {subject}
                </span>
            </div>

            {/* Action Button */}
            <button
                onClick={() => onJoin && onJoin(room)}
                disabled={status === 'full'}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${status === 'full'
                        ? 'bg-surface-3 text-ink-3 cursor-not-allowed'
                        : 'bg-brand text-white hover:bg-brand-hover hover:shadow-lg active:scale-95'
                    }`}
            >
                {status === 'full' ? 'Oda Dolu' : status === 'scheduled' ? 'Hatırlat' : 'Odaya Katıl'}
            </button>
        </div>
    );
};

export default StudyRoomCard;
