import React, { useMemo, useState } from 'react';
import { BarChart2, ClipboardList, MessageSquare, Users } from 'lucide-react';
import TabBadge from '../shared/TabBadge';
import rozetServisi from '../../services/tabBadgeService';

/**
 * 🔔 VELİ PORTALI YENİLİK ŞERİDİ
 *
 * Veli portalı sekmeli değil, tek sayfalık bir rapordur; bu yüzden
 * "sekme rozeti" karşılığı burada bir şerittir: koçun/rehberlik
 * servisinin yaptığı yeni çalışmalar sayaçla gösterilir, tıklanınca
 * sayfa ilgili bölüme kayar ve o sayaç kaybolur.
 *
 * Sayaçlar öğrenci verisinden hesaplanır — ayrı bir bildirim tablosu
 * tutulmaz, dolayısıyla veriyle her zaman tutarlıdır.
 */

const OGELER = [
    { id: 'exams', ad: 'Yeni Deneme', icon: BarChart2, hedef: 'bolum-deneme', renk: 'var(--accent)' },
    { id: 'tasks', ad: 'Yeni Görev', icon: ClipboardList, hedef: 'bolum-gorev', renk: 'var(--highlight)' },
    { id: 'meetings', ad: 'Görüşme', icon: Users, hedef: 'bolum-iletisim', renk: 'var(--brand)' },
    { id: 'messages', ad: 'Mesaj', icon: MessageSquare, hedef: 'bolum-iletisim', renk: 'var(--c4)' },
];

const ParentBadgeStrip = ({ user }) => {
    const [surum, setSurum] = useState(0);

    const rozetler = useMemo(() => {
        try {
            return rozetServisi.veliRozetleri(user);
        } catch {
            return {};
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, user?.studentId, surum]);

    const gorunen = OGELER.filter((o) => rozetler[o.id] > 0);
    if (!gorunen.length) return null;

    const git = (oge) => {
        rozetServisi.ziyaretIsaretle('parent', user?.id, oge.id);
        setSurum((v) => v + 1);
        document.getElementById(oge.hedef)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="srf p-3 mt-4">
            <p className="eyebrow mb-2">Son Ziyaretinizden Bu Yana</p>
            <div className="flex flex-wrap gap-2">
                {gorunen.map((o) => (
                    <button
                        key={o.id}
                        onClick={() => git(o)}
                        className="relative flex items-center gap-2 px-3 py-2 rounded-xl border border-line bg-surface-2 hover:bg-surface-3 transition text-[11px] font-bold text-ink"
                    >
                        <o.icon size={14} style={{ color: o.renk }} />
                        {o.ad}
                        <TabBadge sayi={rozetler[o.id]} renk={o.renk} />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ParentBadgeStrip;
