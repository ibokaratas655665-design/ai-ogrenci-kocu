/**
 * 🎨 UYGULAMA İKONLARINI ÜRETİR
 *
 * Kaynak: public/logo-basari-kampi.jpeg (marka görseli)
 * Çıktı:  public/ altındaki favicon ve uygulama ikonları
 *
 * Logo değişirse kaynağı değiştirip `npm run ikonlar` çalıştırmak yeterli.
 *
 * İki tür ikon üretilir:
 *
 *   · "any"      — logonun tamamı, kenarlarda boşlukla. Tarayıcı sekmesi
 *                  ve masaüstü kısayolu bunu kullanır.
 *   · "maskable" — Android ikonu daire/kare/damla şeklinde kırpar. Kırpma
 *                  payı bırakılmazsa yazı kesilir, o yüzden logo %70'e
 *                  küçültülüp beyaz zemine ortalanır.
 *
 * Amblem ve yazı birlikte küçük boyutta okunmuyor; 32px ve altındaki
 * favicon için logonun yalnızca AMBLEM kısmı (üst kare bölge) kırpılır.
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');
const KAYNAK = join(kok, 'public', 'logo-basari-kampi.jpeg');
const CIKTI = join(kok, 'public');

mkdirSync(CIKTI, { recursive: true });

const meta = await sharp(KAYNAK).metadata();
console.log(`Kaynak: ${meta.width}×${meta.height}\n`);

/** Amblem, karenin üst ~%70'inde; yazı altta kalıyor. */
const amblemAlani = {
    left: Math.round(meta.width * 0.17),
    top: Math.round(meta.height * 0.05),
    width: Math.round(meta.width * 0.66),
    height: Math.round(meta.height * 0.60),
};

/**
 * "Başarı Kampı" yazısının bulunduğu alt bölge.
 *
 * Bu yazı el yazısı bir fırça yazı tipiyle çizilmiş; sistemde böyle bir
 * yazı tipi yok ve metinle taklit edilemez. Arayüzde adın logodaki
 * hâliyle görünmesi için yazı GÖRSEL olarak kırpılıp kullanılıyor.
 */
const yaziAlani = {
    left: Math.round(meta.width * 0.18),
    top: Math.round(meta.height * 0.685),
    width: Math.round(meta.width * 0.65),
    height: Math.round(meta.height * 0.255),
};

const BEYAZ = { r: 255, g: 255, b: 255, alpha: 1 };

/** Logonun tamamı, kenar boşluklu. */
async function tamLogo(boyut, dosya, doluluk = 0.92) {
    const ic = Math.round(boyut * doluluk);
    const tampon = await sharp(KAYNAK)
        .resize(ic, ic, { fit: 'contain', background: BEYAZ })
        .toBuffer();
    await sharp({
        create: { width: boyut, height: boyut, channels: 4, background: BEYAZ },
    })
        .composite([{ input: tampon, gravity: 'center' }])
        .png()
        .toFile(join(CIKTI, dosya));
    console.log(`  ${dosya}  ${boyut}×${boyut}`);
}

/** Yalnızca amblem — küçük boyutlarda yazı okunmadığı için. */
async function sadeceAmblem(boyut, dosya) {
    await sharp(KAYNAK)
        .extract(amblemAlani)
        .resize(boyut, boyut, { fit: 'contain', background: BEYAZ })
        .flatten({ background: BEYAZ })
        .png()
        .toFile(join(CIKTI, dosya));
    console.log(`  ${dosya}  ${boyut}×${boyut} (amblem)`);
}

console.log('Uygulama ikonları:');
await tamLogo(512, 'icon-512.png');
await tamLogo(192, 'icon-192.png');
await tamLogo(180, 'apple-touch-icon.png');
await tamLogo(152, 'apple-touch-icon-152.png');
await tamLogo(120, 'apple-touch-icon-120.png');

console.log('\nAndroid maskeli ikonlar (kırpma payı bırakılmış):');
await tamLogo(512, 'icon-512-maskable.png', 0.70);
await tamLogo(192, 'icon-192-maskable.png', 0.70);

console.log('\nFavicon (yazı küçükte okunmadığı için yalnızca amblem):');
await sadeceAmblem(32, 'favicon-32.png');
await sadeceAmblem(16, 'favicon-16.png');
await sadeceAmblem(64, 'favicon-64.png');

console.log('\nPDF başlığı için:');
await sadeceAmblem(256, 'amblem-256.png');

/**
 * Ad yazısı (wordmark) — GERÇEKTEN saydam zeminli.
 *
 * Kaynak bir JPEG ve zemini saf beyaz değil, hafif gri bir degrade.
 * Sadece kırpıp PNG'ye çevirmek yetmiyordu: yazı, koyu başlıklarda
 * gri bir kutu içinde duruyor ve bulanık görünüyordu.
 *
 * Burada piksel piksel geçip beyaza yakın olanların saydamlığını
 * açıyoruz. Eşik yumuşak tutuldu (235–250 arası kısmi saydam) ki
 * harflerin kenarları tırtıklı çıkmasın.
 */
console.log('\nAd yazısı (logodaki el yazısı stili, saydam zemin):');
{
    const ham = await sharp(KAYNAK)
        .extract(yaziAlani)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    /**
     * Zemini parlaklığa göre ayıklamak YETMİYOR: logonun zemini düz beyaz
     * değil, aşağı doğru koyulaşan gri bir degrade. Eşik ne konursa
     * konsun ya köşelerde gri kutu kalıyor ya da yazının açık tonları
     * siliniyor.
     *
     * Renk doygunluğuna bakmak ayrımı net yapıyor:
     *   · zemin GRİ   → R≈G≈B (fark küçük)
     *   · "Başarı"    → lacivert, koyu (parlaklık düşük)
     *   · "Kampı"     → turuncu, çok doygun (R ile B arası ~210 fark)
     *
     * Yani "gri VE açık" olan her piksel zemindir.
     */
    const { data, info } = ham;
    for (let i = 0; i < data.length; i += info.channels) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const enBuyuk = Math.max(r, g, b);
        const enKucuk = Math.min(r, g, b);
        const doygunluk = enBuyuk - enKucuk;      // gri ise ~0
        const parlaklik = (r + g + b) / 3;

        if (doygunluk < 22 && parlaklik > 205) {
            data[i + 3] = 0;                      // gri ve açık → zemin
        } else if (doygunluk < 22 && parlaklik > 170) {
            // yazı kenarlarındaki yumuşak geçiş: kademeli saydamlık
            data[i + 3] = Math.round(255 * (205 - parlaklik) / 35);
        }
    }

    /**
     * Saydam kenar payını kırp.
     *
     * Kırpma alanı yazının etrafında boşluk bırakıyor; bu boşluk görselin
     * oranını gereksiz yere uzatıyordu. Arayüzde genişliği alt başlığa
     * eşitleyince yükseklik 73 pikseli buluyor ve 72 piksellik başlık
     * çubuğundan taşıyordu. Sıkı kırpma oranı yatığa çeviriyor.
     */
    const saydam = await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
        .png()
        .trim({ threshold: 1 })
        .toBuffer();

    const kirpilmis = await sharp(saydam).metadata();
    const oran = kirpilmis.width / kirpilmis.height;
    console.log(`  kırpıldı: ${info.width}×${info.height} → ${kirpilmis.width}×${kirpilmis.height} (oran ${oran.toFixed(2)})`);
    // 256 ve 512: yüksek yoğunluklu ekranlarda (2x/3x) keskin dursun diye
    for (const h of [128, 256, 512]) {
        const w = Math.round(h * oran);
        await sharp(saydam)
            .resize(w, h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: 'lanczos3' })
            .png({ compressionLevel: 9 })
            .toFile(join(CIKTI, `ad-yazisi-${h}.png`));
        console.log(`  ad-yazisi-${h}.png  ${w}×${h}`);
    }
}

/**
 * PDF'ler jsPDF ile üretiliyor ve `addImage` yüklenmiş bir görsel ister.
 * Çalışma anında dosya indirmek yerine amblemi base64 olarak koda gömüyoruz:
 * PDF üretimi ağdan bağımsız çalışsın, çevrimdışıyken de logo çıksın.
 * 96px yeterli — PDF'te 12-16 mm genişlikte basılıyor.
 */
const gomulu = await sharp(KAYNAK)
    .extract(amblemAlani)
    .resize(96, 96, { fit: 'contain', background: BEYAZ })
    .flatten({ background: BEYAZ })
    .png({ compressionLevel: 9 })
    .toBuffer();

const modul = `/**
 * Amblemin PDF'lere gömülen küçük sürümü — base64.
 *
 * ⚠️ ELLE DÜZENLEMEYİN. \`npm run ikonlar\` bu dosyayı yeniden üretir.
 * Kaynak: public/logo-basari-kampi.jpeg
 */
export const AMBLEM_BASE64 = 'data:image/png;base64,${gomulu.toString('base64')}';

export default AMBLEM_BASE64;
`;
const { writeFileSync } = await import('node:fs');
writeFileSync(join(kok, 'src', 'data', 'amblemBase64.js'), modul, 'utf8');
console.log(`  src/data/amblemBase64.js  (${(gomulu.length / 1024).toFixed(1)} KB gömülü)`);

console.log('\nBitti.');
