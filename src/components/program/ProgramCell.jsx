/**
 * 🎨 PROGRAM HÜCRESİ (ortak)
 *
 * Koç paneli, öğrenci görünümü ve paylaşılan program aynı hücreyi kullanır;
 * böylece öğrencinin telefonunda gördüğü renk, koçun ekranındakiyle ve
 * PDF çıktısındakiyle birebir aynı olur.
 */
import React from 'react';
import { ACTIVITY_TYPES, getCellColor, getSubjectLabel, isActivityBlock } from '../../data/programColors';

const toStr = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && val.name) return val.name;
    return String(val);
};

const SIZES = {
    sm: { minH: 56, pad: 5, badge: 7, subject: 8, topic: 9, stripe: 3 },
    md: { minH: 78, pad: 7, badge: 8, subject: 9, topic: 11, stripe: 4 },
    lg: { minH: 118, pad: 10, badge: 8, subject: 11, topic: 12, stripe: 5 },
};

const ProgramCell = ({
    cell,
    closed = false,
    selected = false,
    size = 'md',
    onClick,
    className = '',
    showActivityBadge = true,
}) => {
    const s = SIZES[size] || SIZES.md;
    const c = cell ? getCellColor(cell) : null;
    const activity = ACTIVITY_TYPES[cell?.type || 'konu'];
    const isBlock = isActivityBlock(cell);

    return (
        <div
            onClick={onClick}
            className={`relative overflow-hidden rounded-xl transition-all ${onClick ? 'cursor-pointer' : ''} ${
                onClick && !closed ? 'hover:-translate-y-0.5 hover:shadow-md' : ''
            } ${className}`}
            style={{
                minHeight: s.minH,
                padding: s.pad,
                backgroundColor: closed ? '#FEF2F2' : (c ? c.bg : '#FAFAFA'),
                // Program blokları (deneme, tekrar, kitap...) tam opak ve kalın
                // kenarlıkla çizilir; ders hücreleri soluk kenarlıkla. Renk tonları
                // yakın düşse bile ikisi bu sayede karışmaz.
                border: closed
                    ? '1.5px solid #FECACA'
                    : c
                        ? `${isBlock ? '2px' : '1.5px'} solid ${isBlock ? c.border : `${c.border}55`}`
                        : '1.5px solid #E5E7EB',
                opacity: closed ? 0.5 : 1,
                boxShadow: selected ? 'inset 0 0 0 3px #4F46E5' : undefined,
            }}
        >
            {cell && !closed && (
                <span
                    style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0,
                        width: s.stripe, backgroundColor: c.border,
                    }}
                />
            )}

            {closed ? (
                <div className="h-full w-full flex flex-col items-center justify-center text-danger">
                    <span style={{ fontSize: s.topic + 8 }}>🔒</span>
                </div>
            ) : cell ? (
                <div className="flex flex-col h-full" style={{ paddingLeft: s.stripe + 2 }}>
                    {showActivityBadge && (
                        <div className="flex items-center justify-between gap-1" style={{ marginBottom: 3 }}>
                            <span
                                className="inline-flex items-center gap-1 font-black rounded-md tracking-wider"
                                style={{
                                    fontSize: s.badge,
                                    padding: '1px 4px',
                                    backgroundColor: `${c.border}22`,
                                    color: c.text,
                                }}
                            >
                                <span style={{ fontSize: s.badge + 1, lineHeight: 1 }}>{activity.icon}</span>
                                {activity.short}
                            </span>
                            {cell.exam && (
                                <span
                                    className="font-black rounded tracking-wide"
                                    style={{ fontSize: s.badge, padding: '1px 3px', backgroundColor: 'rgba(255,255,255,0.7)', color: '#64748B' }}
                                >
                                    {cell.exam}
                                </span>
                            )}
                        </div>
                    )}

                    <span
                        className="font-black uppercase tracking-tight leading-none"
                        style={{ fontSize: s.subject, color: c.border, marginBottom: 2 }}
                    >
                        {getSubjectLabel(toStr(cell.subject))}
                    </span>

                    {cell.topic && (
                        <span
                            className="font-bold break-words"
                            style={{ fontSize: s.topic, lineHeight: 1.25, color: c.text }}
                        >
                            {toStr(cell.topic)}
                        </span>
                    )}

                    {cell.type === 'tekrar' && cell.round && (
                        <span
                            className="mt-auto font-black"
                            style={{ fontSize: s.badge, opacity: 0.5, color: c.text, paddingTop: 2 }}
                        >
                            {cell.round}. GÜN TEKRARI
                        </span>
                    )}
                </div>
            ) : null}
        </div>
    );
};

export default ProgramCell;
