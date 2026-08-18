/**
 * Android başlatıcı ikonlarını marka görselinden üretir.
 *
 * Neden: APK, Capacitor'un VARSAYILAN ikonuyla (mavi X) çıkıyordu —
 * telefondaki tek kalıcı marka yüzeyi buydu ve markasızdı (16. faz
 * ölçümünde yakalandı, 19.08.2026).
 *
 * Kaynaklar:
 *   public/icon-512.png          → köşeli eski (legacy) ikon
 *   public/icon-512-maskable.png → adaptive ön katman + yuvarlak ikon
 *     (güvenli alan payı hazır; PWA maskable ile Android adaptive'in
 *      güvenli bölgesi aynı mantık)
 *
 * Çalıştırma:  node scripts/android-ikon.mjs   (sonra APK yeniden derlenir)
 */
import sharp from 'sharp';
import { mkdirSync } from 'fs';

const RES = 'android/app/src/main/res';
const YOGUNLUK = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

const daire = (boy) => Buffer.from(
    `<svg width="${boy}" height="${boy}"><circle cx="${boy / 2}" cy="${boy / 2}" r="${boy / 2}" fill="#fff"/></svg>`
);

for (const [ad, carpan] of Object.entries(YOGUNLUK)) {
    const dizin = `${RES}/mipmap-${ad}`;
    mkdirSync(dizin, { recursive: true });

    const ikon = Math.round(48 * carpan);      // legacy başlatıcı
    const onKatman = Math.round(108 * carpan); // adaptive ön katman (108dp)

    await sharp('public/icon-512.png').resize(ikon, ikon).png()
        .toFile(`${dizin}/ic_launcher.png`);

    await sharp('public/icon-512-maskable.png').resize(onKatman, onKatman).png()
        .toFile(`${dizin}/ic_launcher_foreground.png`);

    // Yuvarlak ikon: maskable kaynağın dairesel kırpımı (güvenli alan payı
    // olduğu için içerik daireden taşmaz)
    await sharp('public/icon-512-maskable.png').resize(ikon, ikon)
        .composite([{ input: daire(ikon), blend: 'dest-in' }]).png()
        .toFile(`${dizin}/ic_launcher_round.png`);

    console.log(`${ad}: ikon ${ikon}px, ön katman ${onKatman}px`);
}
console.log('✓ Android ikonları üretildi — APK yeniden derlenmeli.');
