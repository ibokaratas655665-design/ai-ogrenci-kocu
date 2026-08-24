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
            {/* Sol renk şeridi kaldırıldı: aynı ders rengini hem şerit
                hem de başlıktaki nokta taşıyordu. Referansta kimlik
                noktada; hücre içi yatay alan da şeride harcanmıyor. */}

            {closed ? (
                <div className="h-full w-full flex flex-col items-center justify-center text-danger">
                    <span style={{ fontSize: s.topic + 8 }}>🔒</span>
                </div>
            ) : cell ? (
                <div className="flex flex-col h-full">
                    {/* SATIR 1 — nokta + ders adı, referanstaki gibi.
                        Ders rengi hem noktada hem yazıda; etkinlik türü
                        (konu/soru/tekrar) sağ uçta yalnız ikonuyla durur.
                        Eskiden tür, ders adının ÜSTÜNDE dolgulu bir rozetti
                        ve iki satır yer kaplayıp asıl bilgiyi aşağı itiyordu. */}
                    <div className="flex items-center gap-1.5" style={{ marginBottom: 3 }}>
                        <span
                            aria-hidden="true"
                            style={{
                                width: s.badge - 1, height: s.badge - 1, borderRadius: 999,
                                backgroundColor: c.border, flex: 'none',
                            }}
                        />
                        <span
                            className="font-black tracking-tight leading-none truncate"
                            style={{ fontSize: s.subject, color: c.border }}
                        >
                            {getSubjectLabel(toStr(cell.subject))}
                        </span>
                        {showActivityBadge && (
                            <span
                                className="ml-auto leading-none"
                                style={{ fontSize: s.badge + 2, opacity: 0.75 }}
                                title={activity.label || activity.short}
                            >
                                {activity.icon}
                            </span>
                        )}
                    </div>

                    {cell.topic && (
                        <span
                            className="font-bold break-words"
                            style={{ fontSize: s.topic, lineHeight: 1.25, color: c.text }}
                        >
                            {toStr(cell.topic)}
                        </span>
                    )}

                    {cell.exam && (
                        <span
                            className="mt-auto font-black tracking-wide self-start rounded"
                            style={{
                                fontSize: s.badge, padding: '1px 4px', marginTop: 3,
                                backgroundColor: 'rgba(255,255,255,.72)', color: '#64748B',
                            }}
                        >
                            {cell.exam}
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
