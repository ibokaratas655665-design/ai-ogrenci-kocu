import React from 'react';
import { Settings, LogOut, Sun, Moon, ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/cn';
import Avatar from '../ui/Avatar';
import Dropdown from '../ui/Dropdown';

/**
 * Kullanıcı menüsü — üst şeritteki dağınık simgelerin tek toplandığı yer.
 *
 * Üst şeritte yan yana 4–5 simge duruyordu (tema, bildirim, ayarlar,
 * çıkış, koçta ayrıca "bulut kurtarma"). Hepsi eşit ağırlıktaydı; oysa
 * bunlar günde bir kez bile kullanılmayan işler. Dahası çıkış düğmesi
 * dar ekranda dışarı taşıyordu.
 *
 * Artık üst şeritte kullanıcının kim olduğu ve tek bir menü var. Sık
 * kullanılan eylemler (öğrenci ekle, bildirim) şeritte kalır; ayarlar,
 * tema ve çıkış buraya iner.
 */
export default function KullaniciMenusu({
    kullanici,
    rolEtiketi,
    ekOgeler = [],
    onAyarlar,
    onCikis,
    className,
}) {
    const { isDark, toggleTheme } = useTheme();

    const ogeler = [
        {
            id: 'tema',
            etiket: isDark ? 'Aydınlık temaya geç' : 'Karanlık temaya geç',
            simge: isDark ? Sun : Moon,
            onSec: toggleTheme,
        },
        ...(onAyarlar ? [{ id: 'ayarlar', etiket: 'Ayarlar', simge: Settings, onSec: onAyarlar }] : []),
        ...(ekOgeler.length ? [{ ayrac: true }, ...ekOgeler] : []),
        { ayrac: true },
        { id: 'cikis', etiket: 'Çıkış yap', simge: LogOut, onSec: onCikis, tehlikeli: true },
    ];

    return (
        <Dropdown
            hiza="sag"
            className={className}
            tetik={
                <button
                    type="button"
                    className={cn(
                        'flex items-center gap-2 pl-1 pr-2 py-1 rounded-pill min-h-[44px]',
                        'border border-line bg-surface hover:bg-surface-3',
                        'transition-colors duration-hizli',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-page'
                    )}
                >
                    <Avatar ad={kullanici?.name || ''} boyut="sm" />
                    {/* Ad yalnızca yer varken; dar ekranda avatar yeter */}
                    <span className="hidden md:flex flex-col items-start leading-none min-w-0">
                        <span className="tip-small font-bold text-ink truncate max-w-[140px]">
                            {kullanici?.name || 'Hesap'}
                        </span>
                        {rolEtiketi && <span className="tip-mini text-ink-3 mt-0.5">{rolEtiketi}</span>}
                    </span>
                    <ChevronDown size={15} className="text-ink-3 shrink-0" aria-hidden="true" />
                    <span className="sr-only">Hesap menüsü</span>
                </button>
            }
            ogeler={ogeler}
        />
    );
}
