/**
 * 💳 PAKET VE ÜCRETLENDİRME
 *
 * Model, Türkiye'deki koçluk takip sistemlerinde yerleşmiş olan yapıyı
 * izler (Canlıkoç, DB Takip, NetKoç, Kocpit, Medyan Online):
 *
 *   · ÜCRETİ KOÇ ÖDER — öğrenci ve veli hesapları her zaman ücretsizdir.
 *   · Fiyat ÖĞRENCİ SAYISINA göre kademelenir, özelliklere göre değil;
 *     böylece küçük koç da tam sistemi kullanır.
 *   · Dönem SEZONLUKtur (1 Temmuz – 30 Haziran), otomatik yenileme yoktur.
 *   · Ücretsiz kademe süresizdir ve kart bilgisi istemez.
 *
 * Bu uygulamanın rakiplerde bulunmayan yanı okul rehberlik servisi (PDR)
 * tarafıdır: desimal dosya düzeni, MEB formatlı belge üretimi, BEP.
 * Bunun için ayrı bir "Rehberlik Servisi" paketi tanımlıdır.
 *
 * ⚠️ Fiyatlar kurumun kendi ticari kararıdır. Buradaki değerler
 * piyasadaki yaygın aralığa göre konulmuş BAŞLANGIÇ değerleridir;
 * yayına almadan önce gözden geçirin.
 */

/** Sezon: 1 Temmuz'da başlar, 30 Haziran'da biter. */
export const sezonBilgisi = (d = new Date()) => {
    const y = d.getFullYear();
    // Temmuz (6) ve sonrası yeni sezon
    const baslangicYil = d.getMonth() >= 6 ? y : y - 1;
    return {
        etiket: `${baslangicYil}-${baslangicYil + 1}`,
        baslangic: `${baslangicYil}-07-01`,
        bitis: `${baslangicYil + 1}-06-30`,
    };
};

/** Sezon bitişine kalan gün. */
export const sezonKalanGun = (d = new Date()) => {
    const bitis = new Date(`${sezonBilgisi(d).bitis}T23:59:59`);
    return Math.max(0, Math.ceil((bitis - d) / 86400000));
};

export const DENEME_GUN = 7;    // ücretsiz deneme süresi

export const PLANLAR = [
    {
        id: 'ucretsiz',
        ad: 'Ücretsiz',
        rozet: 'Kart gerekmez',
        vurgu: false,
        fiyat: 0,
        ogrenciLimiti: 3,
        sure: 'Süresiz',
        aciklama: 'Sistemi gerçek öğrencilerle denemek için. Süre sınırı yok.',
        ozellikler: [
            'En fazla 3 öğrenci',
            'Öğrenci takip paneli',
            'Görev atama ve takibi',
            'Deneme sonucu yükleme ve analiz',
            'Öğrenci ve veli hesapları ücretsiz',
        ],
        yok: ['Rehberlik (PDR) modülleri', 'Ek koç hesabı'],
    },
    {
        id: 'koc5',
        ad: 'Koç 5',
        fiyat: 3500,
        ogrenciLimiti: 5,
        sure: 'Sezonluk',
        aciklama: 'Bireysel çalışan koçlar için giriş paketi.',
        ozellikler: [
            'En fazla 5 öğrenci',
            'Tüm koçluk modülleri',
            'Ders programı oluşturucu',
            'Deneme analizi ve gelişim raporu',
            'Veli paneli ve raporlama',
            'WhatsApp toplu mesaj',
            'Mobil ve web erişim',
        ],
    },
    {
        id: 'koc10',
        ad: 'Koç 10',
        rozet: 'En çok tercih edilen',
        vurgu: true,
        fiyat: 5900,
        ogrenciLimiti: 10,
        sure: 'Sezonluk',
        aciklama: 'Öğrenci sayısı artan koçlar için en dengeli paket.',
        ozellikler: [
            'En fazla 10 öğrenci',
            'Koç 5 paketindeki her şey',
            'Grup ve proje çalışmaları',
            'Risk alarm paneli',
            'Sınıf anlık analiz',
            'Liderlik tablosu',
        ],
    },
    {
        id: 'koc20',
        ad: 'Koç 20',
        fiyat: 9900,
        ogrenciLimiti: 20,
        sure: 'Sezonluk',
        aciklama: 'Yoğun öğrenci portföyü olan koçlar için.',
        ozellikler: [
            'En fazla 20 öğrenci',
            'Koç 10 paketindeki her şey',
            'Yardımcı koç hesabı (2 adet)',
            'Koça görev atama',
            'Onay ve yetki yönetimi',
        ],
    },
    {
        id: 'rehberlik',
        ad: 'Rehberlik Servisi',
        rozet: 'Okullara özel',
        fiyat: 3000,
        ogrenciLimiti: null,          // okul geneli
        sure: 'Sezonluk',
        /**
         * Yalnızca kurumsal (okul rehberlik servisi) hesaplara açıktır.
         *
         * Bu paket öğrenci sayısı sınırsız olduğu hâlde Koç 20'den ucuz;
         * kurum kısıtı olmasaydı 20+ öğrencisi olan bireysel koç için
         * Koç 20 almanın hiçbir anlamı kalmazdı. Ayrım fiyatta değil,
         * kimin alabildiğinde: okul rehberlik servisi ile bireysel koç
         * farklı pazarlar.
         */
        kurumsal: true,
        aciklama:
            'Okul psikolojik danışmanları için. Koçluk modüllerine ek olarak '
            + 'rehberlik servisinin resmî dosya düzeni ve belge üretimi.',
        ozellikler: [
            'Öğrenci sayısı sınırsız',
            'Tüm koçluk modülleri',
            '10 resmî rehberlik dosyası (desimal düzen)',
            'MEB formatında belge ve PDF üretimi',
            'BEP ve kaynaştırma dosyası',
            'Risk haritaları ve komisyon tutanakları',
            'Envanter uygulama ve sosyometri',
            'Materyal üretici (broşür, pano, etkinlik planı)',
        ],
    },
];

export const planBul = (id) => PLANLAR.find((p) => p.id === id) || PLANLAR[0];

/** Öğrenci başına aylık maliyet — paketleri karşılaştırmayı kolaylaştırır. */
export const ogrenciBasiAylik = (plan) => {
    if (!plan.fiyat || !plan.ogrenciLimiti) return null;
    return Math.round(plan.fiyat / plan.ogrenciLimiti / 12);
};

export const tl = (n) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })
        .format(n || 0);

export default { PLANLAR, planBul, ogrenciBasiAylik, sezonBilgisi, sezonKalanGun, DENEME_GUN, tl };
