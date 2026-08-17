import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Sınıf birleştirici.
 *
 * `clsx` koşullu sınıfları çözer, `twMerge` çakışan Tailwind sınıflarından
 * sonuncuyu kazandırır — böylece bir bileşene dışarıdan `className` geçmek
 * varsayılanı gerçekten ezer:
 *
 *   cn('px-4 py-2', 'px-6')  →  'py-2 px-6'
 *
 * İki paket de zaten package.json'da kuruluydu ama hiç kullanılmıyordu.
 */
export function cn(...girdiler) {
    return twMerge(clsx(girdiler));
}

export default cn;
