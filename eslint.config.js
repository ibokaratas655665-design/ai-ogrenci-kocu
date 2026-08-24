import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

/**
 * Denetim 375 sorun bildiriyordu ve bunun 213'ü "kullanılmayan değişken"di.
 * Bu kadar gürültüde kimse lint çalıştırmıyor; nitekim koç panelini tamamen
 * çökerten eksik `import` (accessControl.js → yoneticiHesabiMi) derlemeyi
 * geçip canlıya çıktı.
 *
 * Kurallar iki kümeye ayrıldı:
 *
 *   HATA  → uygulamayı çalışma anında bozan şeyler. Bunlar sıfır olmalı ve
 *           `npm run lint` bunlarda başarısız olur.
 *   UYARI → temizlik borcu. Görünür ama yayını engellemez.
 */
export default defineConfig([
    globalIgnores(['node_modules', 'dist', 'dist-electron', 'android', 'android/**', 'electron', 'archive', 'yedek', 'docs']),
    {
        files: ['**/*.{js,jsx}'],
        extends: [
            js.configs.recommended,
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
        ],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
            parserOptions: {
                ecmaVersion: 'latest',
                ecmaFeatures: { jsx: true },
                sourceType: 'module',
            },
        },
        rules: {
            // ── ÇALIŞMA ANINDA BOZAN — hata ──────────────────────────
            'no-undef': 'error',              // tanımsız değişken/eksik import
            'no-const-assign': 'error',
            'no-dupe-keys': 'error',
            'no-dupe-args': 'error',
            'no-unreachable': 'error',
            'no-obj-calls': 'error',
            'use-isnan': 'error',
            'valid-typeof': 'error',

            // ── TEMİZLİK BORCU — uyarı ───────────────────────────────
            'no-unused-vars': ['warn', {
                varsIgnorePattern: '^[A-Z_]',
                argsIgnorePattern: '^_',
                caughtErrors: 'none',         // catch(e) yakalanan hata kullanılmasa da sorun değil
            }],
            'no-empty': ['warn', { allowEmptyCatch: true }],
            'no-useless-escape': 'warn',
            'react-hooks/exhaustive-deps': 'warn',
            'react-hooks/purity': 'warn',
            'react-hooks/set-state-in-effect': 'warn',
            'react-hooks/immutability': 'warn',
            'react-hooks/static-components': 'warn',
            'react-hooks/error-boundaries': 'warn',
            'react-hooks/preserve-manual-memoization': 'warn',
            'react-refresh/only-export-components': 'warn',
        },
    },
])
