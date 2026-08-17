import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * 🖼️ GÖRSEL OPTİMİZASYONU
 *
 * Marka görselleri düz renkli çizimler (yazı + amblem). Bunlar tam renkli
 * PNG olarak kaydedildiğinde gereksiz büyük oluyor: `ad-yazisi-512.png`
 * 519 KB'ydi ve arayüzde en fazla 168 piksel genişlikte gösteriliyor.
 *
 * Palet (8-bit) PNG düz renkli grafikte görsel kayıp olmadan büyük kazanç
 * verir. Ayrıca her dosyanın WebP eşi üretilir; `<picture>` ile
 * desteklenen tarayıcıda o iner.
 *
 * Çalıştırma:  node scripts/gorsel-optimize.mjs
 */

const KLASOR = 'public';
const kb = (n) => Math.round(n / 1024);

const dosyalar = fs.readdirSync(KLASOR)
    .filter((f) => /\.(png|jpe?g)$/i.test(f))
    .map((f) => path.join(KLASOR, f));

let oncekiToplam = 0, sonrakiToplam = 0;
const rapor = [];

for (const f of dosyalar) {
    const once = fs.statSync(f).size;
    oncekiToplam += once;

    const meta = await sharp(f).metadata();
    const png = /\.png$/i.test(f);

    // Geçici dosyaya yaz, küçüldüyse değiştir
    const gecici = f + '.tmp';
    if (png) {
        await sharp(f)
            .png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 })
            .toFile(gecici);
    } else {
        await sharp(f).jpeg({ quality: 82, mozjpeg: true }).toFile(gecici);
    }

    const sonra = fs.statSync(gecici).size;
    if (sonra < once) {
        fs.renameSync(gecici, f);
        sonrakiToplam += sonra;
        rapor.push(`${path.basename(f).padEnd(28)} ${String(kb(once)).padStart(4)}KB → ${String(kb(sonra)).padStart(4)}KB  (%${Math.round((1 - sonra / once) * 100)})`);
    } else {
        fs.unlinkSync(gecici);
        sonrakiToplam += once;
        rapor.push(`${path.basename(f).padEnd(28)} ${String(kb(once)).padStart(4)}KB  (değişmedi)`);
    }

    // WebP eşi — modern tarayıcı bunu indirir
    const webp = f.replace(/\.(png|jpe?g)$/i, '.webp');
    await sharp(f).webp({ quality: 88, effort: 6 }).toFile(webp);
    rapor[rapor.length - 1] += `  · webp ${kb(fs.statSync(webp).size)}KB`;

    void meta;
}

console.log(rapor.join('\n'));
console.log(`\nTOPLAM  ${kb(oncekiToplam)}KB → ${kb(sonrakiToplam)}KB  (%${Math.round((1 - sonrakiToplam / oncekiToplam) * 100)} küçüldü)`);
