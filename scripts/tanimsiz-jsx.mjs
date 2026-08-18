/**
 * Tanımsız JSX bileşeni tarayıcısı.
 *
 * ⚠️ NEDEN GEREKLİ — ESLint BU HATAYI YAKALAYAMAZ:
 * `no-undef` yalnızca `Identifier` düğümlerine bakar. JSX'teki `<User />`
 * ise `JSXIdentifier`'dır ve kuralın kapsamı dışında kalır. Vite/Rollup da
 * çözemediği ismi global sanıp sessizce derler. Sonuç: build temiz, lint
 * temiz — ama o satır tarayıcıda render edilince
 * `ReferenceError: User is not defined` fırlar ve BÜTÜN sekme çöker.
 *
 * Canlıda üç tane vardı: StudentDashboard'da <User> (mesaj sekmesi
 * öğrenciyi uygulamadan atıyordu), NetProgressChart'ta <Cell>,
 * CoachDashboard'da <ReferenceLine>.
 *
 * Asıl çözüm eslint-plugin-react'in `react/jsx-no-undef` kuralıdır; o
 * eklenti projede kurulu değil ve yalnızca bu kural için bağımlılık
 * eklemek istemedik. Bu betik aynı işi bağımlılıksız yapar.
 *
 * Çalıştırma:  npm run tanimsiz-jsx    (çıkış 0 = temiz, 1 = hata var)
 */
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const dosyalar = execSync('git ls-files "src/*.jsx" "src/*.js" "src/**/*.jsx" "src/**/*.js"', { encoding: 'utf8' })
    .split('\n').map((s) => s.trim()).filter(Boolean);

// Bileşen gibi görünen ama tanımlı olan tarayıcı/JS globalleri
const GLOBAL = new Set(['React', 'Math', 'JSON', 'Object', 'Array', 'String', 'Number',
    'Boolean', 'Date', 'Promise', 'Map', 'Set', 'WeakMap', 'Error', 'Intl', 'RegExp',
    'Symbol', 'BigInt', 'Image', 'Audio', 'Blob', 'File', 'FileReader', 'FormData',
    'URL', 'URLSearchParams', 'Notification', 'Worker', 'Event', 'CustomEvent',
    'AbortController', 'Proxy', 'Reflect']);

let toplam = 0;

for (const f of dosyalar) {
    let src;
    try { src = readFileSync(f, 'utf8'); } catch { continue; }
    if (!/<[A-Z]/.test(src)) continue;

    // Yorumları çıkar — yorumdaki örnek JSX yanlış pozitif üretmesin
    const kod = src
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

    const tanimli = new Set(GLOBAL);

    // import edilenler
    for (const m of kod.matchAll(/import\s+([\s\S]*?)\s+from\s*['"]/g)) {
        for (const ad of m[1].matchAll(/[A-Za-z_$][\w$]*/g)) tanimli.add(ad[0]);
    }
    // yerel bildirimler
    for (const m of kod.matchAll(/\b(?:const|let|var|function|class)\s+([A-Z][\w$]*)/g)) {
        tanimli.add(m[1]);
    }
    // yıkımla gelenler:  const { A, B } = ...
    for (const m of kod.matchAll(/(?:const|let|var)\s*\{([^}]*)\}\s*=/g)) {
        for (const ad of m[1].matchAll(/[A-Za-z_$][\w$]*/g)) tanimli.add(ad[0]);
    }
    // prop yeniden adlandırma:  simge: Simge = null   /   ikon: Bilesen,
    for (const m of kod.matchAll(/[\w$]+\s*:\s*([A-Z][\w$]*)\s*(?:=|,|\})/g)) {
        tanimli.add(m[1]);
    }
    // parametre olarak gelen bileşenler:  ({ Icon, ... }) =>
    for (const m of kod.matchAll(/\(\s*\{([^}]*)\}\s*\)\s*=>/g)) {
        for (const ad of m[1].matchAll(/[A-Za-z_$][\w$]*/g)) tanimli.add(ad[0]);
    }

    // JSX'te kullanılan bileşen adları (ilk geçtikleri satırla)
    const kullanilan = new Map();
    for (const m of kod.matchAll(/<([A-Z][\w$]*)(?:\.[\w$]+)*[\s/>]/g)) {
        if (!kullanilan.has(m[1])) {
            kullanilan.set(m[1], kod.slice(0, m.index).split('\n').length);
        }
    }

    for (const [ad, satir] of kullanilan) {
        if (!tanimli.has(ad)) {
            console.log(`${f}:${satir}  <${ad}>  TANIMSIZ`);
            toplam++;
        }
    }
}

if (toplam === 0) {
    console.log('✓ Tanımsız JSX bileşeni yok.');
} else {
    console.log(`\n✖ ${toplam} tanımsız JSX bileşeni — bunlar tarayıcıda ReferenceError fırlatır.`);
    process.exit(1);
}
