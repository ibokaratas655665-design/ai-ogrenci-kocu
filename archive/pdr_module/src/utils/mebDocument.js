/**
 * 📄 MEB RESMÎ BELGE ÜRETİCİSİ
 *
 * PDR bölümündeki TÜM PDF çıktıları buradan geçer. Amaç, üretilen her
 * belgenin MEBBİS/e-Okul evrak düzeniyle uyumlu olması:
 *
 *   · T.C. → Valilik → İlçe MEM → Okul başlığı
 *   · Sağ üstte Sayı ve Tarih
 *   · Konu satırı
 *   · Gövde (tablo, alan-değer listesi, serbest metin)
 *   · Gizlilik / KVKK ibaresi (gereken belgelerde)
 *   · İmza blokları — belge türüne göre doğru makamlar
 *   · Alt bilgi: belge kodu, sayfa, oluşturma zamanı
 *
 * jsPDF'in yerleşik fontları Türkçe karakterleri tam desteklemediği için
 * belge HTML olarak kurulur, html2canvas ile görüntüye çevrilir. Böylece
 * ş/ğ/ı/İ sorunsuz çıkar ve düzen birebir korunur.
 */

import {
    kurumBilgisi, resmiBaslik, evrakSayisiUret, resmiTarih,
    imzaBloklari, GIZLILIK_IBARESI, KVKK_IBARESI,
} from '../data/mebStandards';

const A4 = { w: 210, h: 297 };

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
}[c]));

/**
 * Resmî yazı düzeni. Renk kullanılmaz — MEB evrakı siyah-beyaz basılır ve
 * fotokopide okunabilir olmalıdır. Yazı tipi Times benzeri tırnaklıdır;
 * resmî yazışmalarda beklenen görünüm budur.
 */
const STIL = `
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', Georgia, serif; color: #000; }
  .sayfa { width: 794px; padding: 48px 64px 40px; background: #fff; }

  .ust { text-align: center; line-height: 1.45; margin-bottom: 6px; }
  .ust .tc { font-size: 13px; font-weight: 700; letter-spacing: .5px; }
  .ust .kurum { font-size: 12.5px; font-weight: 700; text-transform: uppercase; }

  .sayi-satir { display: flex; justify-content: space-between; align-items: flex-end;
                font-size: 11.5px; margin: 18px 0 4px; }
  .sayi-satir .sol { text-align: left; }
  .sayi-satir .sag { text-align: right; }
  .sayi-satir b { font-weight: 700; }

  .konu { font-size: 11.5px; margin-bottom: 18px; }
  .konu b { font-weight: 700; }

  h1.belge-adi { font-size: 14px; font-weight: 700; text-align: center;
                 text-transform: uppercase; letter-spacing: .4px;
                 margin: 10px 0 16px; padding-bottom: 6px;
                 border-bottom: 1.5px solid #000; }

  h2 { font-size: 11.5px; font-weight: 700; text-transform: uppercase;
       letter-spacing: .05em; margin: 16px 0 7px;
       padding-bottom: 3px; border-bottom: 1px solid #000; }

  p { font-size: 11.5px; line-height: 1.65; text-align: justify; margin-bottom: 8px; }

  table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 10px; }
  th { border: 1px solid #000; padding: 5px 7px; text-align: left;
       font-weight: 700; background: #EDEDED; }
  td { border: 1px solid #000; padding: 5px 7px; vertical-align: top; line-height: 1.45; }

  .kv { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 10px; }
  .kv td { border: 1px solid #000; padding: 5px 8px; }
  .kv td.etiket { width: 200px; font-weight: 700; background: #F5F5F5; }

  ul { margin: 0 0 8px 20px; font-size: 11px; }
  li { margin-bottom: 3px; line-height: 1.5; }

  .kutu { border: 1px solid #000; padding: 9px 11px; font-size: 11px;
          line-height: 1.6; margin-bottom: 10px; white-space: pre-wrap; min-height: 46px; }

  .ibare { border: 1px solid #000; padding: 7px 10px; font-size: 9.5px;
           line-height: 1.5; margin: 12px 0; text-align: justify; }
  .ibare b { font-weight: 700; }

  .imzalar { display: flex; justify-content: space-around; gap: 24px; margin-top: 42px; }
  .imzalar .kutu-imza { text-align: center; font-size: 10.5px; flex: 1; }
  .imzalar .isim { font-weight: 700; margin-bottom: 2px; min-height: 14px; }
  .imzalar .cizgi { border-top: 1px solid #000; margin-top: 40px; padding-top: 4px; }

  .alt { margin-top: 30px; padding-top: 6px; border-top: 1px solid #000;
         display: flex; justify-content: space-between; font-size: 8.5px; }
</style>`;

/** HTML'i geçici konteynere basıp çok sayfalı PDF'e çevirir. */
const pdfeCevir = async (html, dosyaAdi) => {
    const [{ jsPDF }, html2canvas] = await Promise.all([
        import('jspdf'),
        import('html2canvas').then((m) => m.default),
    ]);

    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#fff;';
    host.innerHTML = STIL + `<div class="sayfa">${html}</div>`;
    document.body.appendChild(host);

    try {
        const hedef = host.querySelector('.sayfa');
        const canvas = await html2canvas(hedef, {
            scale: 2, backgroundColor: '#ffffff', useCORS: true,
            width: 794, windowWidth: 794,
        });

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const kenar = 0;
        const imgW = A4.w - kenar * 2;
        const imgH = (canvas.height * imgW) / canvas.width;
        const sayfaY = A4.h;
        const img = canvas.toDataURL('image/jpeg', 0.95);

        let kaydirma = 0;
        let sayfa = 0;
        while (kaydirma < imgH) {
            if (sayfa > 0) doc.addPage();
            doc.addImage(img, 'JPEG', kenar, kenar - kaydirma, imgW, imgH);
            kaydirma += sayfaY;
            sayfa++;
            if (sayfa > 40) break;   // güvenlik freni
        }

        doc.save(dosyaAdi);
        return true;
    } finally {
        host.remove();
    }
};

const dosyaAdiTemizle = (s) =>
    String(s || 'Belge').replace(/[^\wçğıöşüÇĞİÖŞÜ ]/g, '').trim().replace(/\s+/g, '_');

// ══════════════════════════════════════════════════════════════
//  GÖVDE PARÇALARI
//  Belge içeriği bu yardımcılarla kurulur; her belge aynı düzeni
//  kullanır, böylece çıktılar birbirine benzer ve resmî durur.
// ══════════════════════════════════════════════════════════════

export const parca = {
    /** Alan–değer tablosu (öğrenci bilgileri, form üst kısmı). */
    alanlar: (ciftler = []) => `
<table class="kv">
  ${ciftler.filter(Boolean).map(([e, d]) => `
    <tr><td class="etiket">${esc(e)}</td><td>${esc(d ?? '')}</td></tr>`).join('')}
</table>`,

    /** Başlıklı bölüm. */
    bolum: (baslik, icerik) => `<h2>${esc(baslik)}</h2>${icerik}`,

    /** Serbest metin kutusu (görüşme özeti, değerlendirme). */
    kutu: (metin) => `<div class="kutu">${esc(metin || '')}</div>`,

    /** Paragraf. */
    metin: (m) => `<p>${esc(m)}</p>`,

    /** Tablo. */
    tablo: (basliklar = [], satirlar = [], genislikler = []) => `
<table>
  <tr>${basliklar.map((b, i) => `<th${genislikler[i] ? ` style="width:${genislikler[i]}"` : ''}>${esc(b)}</th>`).join('')}</tr>
  ${satirlar.length
        ? satirlar.map((s) => `<tr>${s.map((h) => `<td>${esc(h ?? '')}</td>`).join('')}</tr>`).join('')
        : `<tr><td colspan="${basliklar.length}">Kayıt bulunmamaktadır.</td></tr>`}
</table>`,

    /** Madde listesi. */
    liste: (maddeler = []) => maddeler.length
        ? `<ul>${maddeler.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`
        : '<p>—</p>',
};

// ══════════════════════════════════════════════════════════════
//  ANA ÜRETİCİ
// ══════════════════════════════════════════════════════════════

/**
 * MEB düzeninde resmî belge üretir.
 *
 * @param {object} p
 * @param {string} p.belgeAdi   Belgenin başlığı (ör. "BİREYSEL GÖRÜŞME FORMU")
 * @param {string} [p.konu]     "Konu:" satırı
 * @param {string} p.govde      parca.* ile kurulmuş HTML
 * @param {string} [p.imzaSeti] 'rehberlik' | 'komisyon' | 'bep' | 'veli' | 'ogrenci' | 'yoneltme'
 * @param {boolean} [p.gizli]   Gizlilik ibaresi eklensin mi
 * @param {boolean} [p.kvkk]    KVKK ibaresi eklensin mi (kişisel veri içeriyorsa)
 * @param {string} [p.sayi]     Verilmezse otomatik üretilir
 * @param {string} [p.belgeKodu] Alt bilgide görünen kod (ör. desimal no)
 * @param {string} [p.dosyaAdi] PDF dosya adı
 */
export const belgeUret = async ({
    belgeAdi,
    konu = '',
    govde = '',
    imzaSeti = 'rehberlik',
    gizli = false,
    kvkk = true,
    sayi = null,
    belgeKodu = '',
    dosyaAdi = null,
}) => {
    const k = kurumBilgisi();
    const basliklar = resmiBaslik(k);
    const evrakSayi = sayi || evrakSayisiUret();
    const tarih = resmiTarih();
    const imzalar = imzaBloklari(imzaSeti, k);

    const html = `
<div class="ust">
  ${basliklar.map((b, i) => `<div class="${i === 0 ? 'tc' : 'kurum'}">${esc(b)}</div>`).join('')}
</div>

<div class="sayi-satir">
  <div class="sol"><b>Sayı :</b> ${esc(evrakSayi)}</div>
  <div class="sag"><b>Tarih :</b> ${esc(tarih)}</div>
</div>

${konu ? `<div class="konu"><b>Konu :</b> ${esc(konu)}</div>` : ''}

<h1 class="belge-adi">${esc(belgeAdi)}</h1>

${govde}

${gizli ? `<div class="ibare"><b>GİZLİDİR — </b>${esc(GIZLILIK_IBARESI)}</div>` : ''}
${kvkk ? `<div class="ibare">${esc(KVKK_IBARESI)}</div>` : ''}

<div class="imzalar">
  ${imzalar.map((i) => `
    <div class="kutu-imza">
      <div class="cizgi">
        <div class="isim">${esc(i.isim || '')}</div>
        <div>${esc(i.unvan)}</div>
      </div>
    </div>`).join('')}
</div>

<div class="alt">
  <span>${esc(belgeKodu ? `Desimal: ${belgeKodu}` : 'Rehberlik ve Psikolojik Danışma Hizmetleri')}</span>
  <span>${esc(k.okulAdi || '')}</span>
  <span>${esc(tarih)}</span>
</div>`;

    const ad = dosyaAdi || `${dosyaAdiTemizle(belgeAdi)}_${tarih.replace(/\./g, '-')}.pdf`;
    await pdfeCevir(html, ad);
    return { sayi: evrakSayi, tarih, dosyaAdi: ad };
};

/** Kurum bilgisi eksikse belge üretmeden önce uyarı metni. */
export const kurumUyarisi = () => {
    const k = kurumBilgisi();
    const eksik = [];
    if (!k.il) eksik.push('İl');
    if (!k.okulAdi) eksik.push('Okul adı');
    if (!eksik.length) return null;
    return `Belge başlığının resmî düzene uyması için ${eksik.join(' ve ')} bilgisi gerekiyor. `
        + 'Ayarlar → Kurum Bilgileri bölümünden girebilirsiniz.';
};

export default { belgeUret, parca, kurumUyarisi };
