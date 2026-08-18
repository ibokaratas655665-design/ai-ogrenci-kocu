/**
 * Senkron kaybı tarayıcısı — "setItem var, senkron yok" sınıfı.
 *
 * localStorage.setItem çağrısının ±25 satırında senkron tetikleyicisi
 * (yaz / syncKey / firebaseSync / notifySync / halkaAcik) yoksa aday
 * olarak listeler. İki biçimi de tarar:
 *   · sabit anahtar:    setItem('student_tasks', ...)
 *   · değişken anahtar: setItem(LOG_KEY(id), ...), setItem(`x_${id}`, ...)
 * ⚠️ Değişken biçim 18.08.2026'ya kadar taranmıyordu — 11 gerçek kopukluk
 * (öz değerlendirme, pomodoro, konu ilerleme, test sonuçları, hedefler…)
 * bu kör nokta yüzünden gözden kaçmıştı.
 *
 * Her aday HATA DEĞİLDİR — bilinçli cihaz-yerel anahtarlar (güvenlik
 * sayaçları, UI durumu, rozet işaretleri) burada da çıkar. Karar ölçütü:
 * anahtar SYNC_KEYS/DYNAMIC_KEY_PATTERNS kapsamında mı ve veriyi başka
 * cihaz/kişi okuyor mu?
 *
 * Çalıştırma:  node scripts/senkron-tara.mjs
 */
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const dosyalar = execSync('git ls-files "src/*.jsx" "src/*.js" "src/**/*.jsx" "src/**/*.js"', { encoding: 'utf8' })
    .split('\n').map((s) => s.trim()).filter(Boolean).filter((f) => !f.includes('.test.'));

const TETIK = /firebaseSync|syncKey|writeKeyToFirebase|veriDeposu|halkaAcik|notifySync|\byaz\(|\.sync\(/;

// Bilinçli cihaz-yerel anahtarlar (sabit biçimde elenir)
const KAPSAMDISI = /user_session|device_id|theme_mode|magic_link|gemini_api_key|admin_master_password|pwa_install|dismissed|coach_active_section|section_tab|user_role|yks_date|dataEpoch|_epoch|sb_last|last_sync|_fbtime_/;

let n = 0;
for (const f of dosyalar) {
    const satirlar = readFileSync(f, 'utf8').split('\n');
    satirlar.forEach((s, i) => {
        const sabit = s.match(/localStorage\.setItem\(['"]([^'"]+)/);
        const degisken = !sabit && s.match(/localStorage\.setItem\(([^'"\s][^,]*),/);
        if (!sabit && !degisken) return;
        if (sabit && KAPSAMDISI.test(sabit[1])) return;
        const pencere = satirlar.slice(Math.max(0, i - 25), i + 26).join('\n');
        if (TETIK.test(pencere)) return;
        console.log(`${f}:${i + 1}  [${(sabit ? sabit[1] : degisken[1]).trim()}]`);
        n++;
    });
}
console.log(n === 0 ? '✓ Aday yok.' : `\n${n} aday — her biri kapsam/okuyucu ölçütüyle tek tek değerlendirilmeli.`);
