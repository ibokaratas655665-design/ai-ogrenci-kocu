import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * 🌗 AÇIK / KOYU TEMA DÜĞMESİ
 *
 * Renkler artık tek bir değişken setinden geldiği için (styles/theme.css)
 * tema değişimi tüm uygulamada aynı anda geçerli olur. Seçim
 * localStorage'da saklanır (ThemeContext).
 */
const ThemeToggle = ({ className = '' }) => {
    const { isDark, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            title={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
            aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
            className={`relative w-14 h-8 rounded-full border transition-colors shrink-0 ${className}`}
            style={{
                backgroundColor: isDark ? 'var(--surface-3)' : 'var(--brand-soft)',
                borderColor: isDark ? 'var(--line-2)' : 'var(--brand-line)',
            }}
        >
            <span
                className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                    left: isDark ? 'calc(100% - 1.75rem)' : '0.25rem',
                    backgroundColor: isDark ? 'var(--surface)' : 'var(--brand)',
                    color: isDark ? 'var(--highlight)' : '#fff',
                    boxShadow: 'var(--sh-1)',
                }}
            >
                {isDark ? <Moon size={13} /> : <Sun size={13} />}
            </span>
        </button>
    );
};

export default ThemeToggle;
