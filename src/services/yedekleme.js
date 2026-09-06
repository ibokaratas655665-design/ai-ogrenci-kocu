/**
 * 💾 YEDEKLEME VE GERİ YÜKLEME
 *
 * Neden var: uygulamanın verisi öncelikle TARAYICIDA (localStorage)
 * yaşıyor; bulut senkronu ancak internet ve oturum varken çalışıyor.
 * Bilgisayar çökerse, disk formatlanırsa ya da tarayıcı verisi
 * temizlenirse koçun bütün öğrenci kayıtları, programları ve deneme
 * sonuçları gider. Bu servis tek tıkla TAM YEDEK dosyası üretir ve
 * o dosyadan geri yükler.
 *
 * Yedek dosyası düz JSON'dur: kullanıcı içeriğini gözüyle görebilir,
 * başka bir bilgisayara taşıyabilir, bulut diskte saklayabilir.
 *
 * Dışarıda bırakılanlar: oturum anahtarları (başka cihazda geçersiz)
 * ve `_fbtime_` senkron damgaları (geri yüklemede yeni damga üretilir —
 * yoksa bulut, yerel kopyayı "eski" sanıp üzerine yazabilirdi).
 */

const OTURUM_ANAHTARLARI = ['user_session', 'current_user', 'USER', 'auth_token'];
const SURUM = 1;

/** Yedeğe girmeyecek anahtar mı? */
const atlanir = (anahtar) =>
    !anahtar ||
    anahtar.startsWith('_fbtime_') ||
    OTURUM_ANAHTARLARI.includes(anahtar) ||
    anahtar.startsWith('firebase:') ||
    anahtar.startsWith('vite') ||
    anahtar === 'debug';

/**
 * Tüm uygulama verisini tek nesnede toplar.
 * @returns {{surum:number, tarih:string, anahtarSayisi:number, veri:Object}}
 */
export const yedekOlustur = () => {
    const veri = {};
    for (let i = 0; i < localStorage.length; i += 1) {
        const anahtar = localStorage.key(i);
        if (atlanir(anahtar)) continue;
        try { veri[anahtar] = localStorage.getItem(anahtar); } catch { /* okunamayan anahtar atlanır */ }
    }
    return {
        surum: SURUM,
        uygulama: 'Basari Kampi Kocluk Platformu',
        tarih: new Date().toISOString(),
        anahtarSayisi: Object.keys(veri).length,
        veri,
    };
};

const SON_YEDEK_ANAHTARI = 'son_yedek_tarihi';
const HATIRLATMA_GUN = 14;

/** Son yedeğin üzerinden geçen gün; hiç yedek yoksa null. */
export const sonYedektenBeriGun = () => {
    try {
        const ham = localStorage.getItem(SON_YEDEK_ANAHTARI);
        if (!ham) return null;
        const fark = Date.now() - new Date(ham).getTime();
        if (Number.isNaN(fark)) return null;
        return Math.floor(fark / 86400000);
    } catch { return null; }
};

/**
 * Kullanıcıya yedek hatırlatılmalı mı?
 * Hiç yedek alınmamışsa da hatırlatılır — asıl riskli durum odur.
 */
export const yedekHatirlatilsinMi = () => {
    const gun = sonYedektenBeriGun();
    return gun === null || gun >= HATIRLATMA_GUN;
};

/** Yedeği .json dosyası olarak indirir. */
export const yedegiIndir = () => {
    const yedek = yedekOlustur();
    const metin = JSON.stringify(yedek, null, 2);
    const bugun = new Date().toISOString().slice(0, 10);
    const blob = new Blob([metin], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `basari-kampi-yedek-${bugun}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    try { localStorage.setItem(SON_YEDEK_ANAHTARI, new Date().toISOString()); } catch { /* yoksay */ }
    return yedek.anahtarSayisi;
};

/**
 * Yedek dosyasını doğrular ve içeriğini özetler (geri yüklemeden ÖNCE
 * kullanıcıya ne geleceğini göstermek için).
 */
export const yedegiCozumle = (metin) => {
    let nesne;
    try { nesne = JSON.parse(metin); } catch { return { gecerli: false, hata: 'Dosya okunamadı — geçerli bir yedek dosyası değil.' }; }
    if (!nesne || typeof nesne !== 'object' || !nesne.veri || typeof nesne.veri !== 'object') {
        return { gecerli: false, hata: 'Dosya bir Başarı Kampı yedeği değil.' };
    }
    const anahtarlar = Object.keys(nesne.veri);
    const sayi = (a) => { try { const d = JSON.parse(nesne.veri[a] || 'null'); return Array.isArray(d) ? d.length : null; } catch { return null; } };
    return {
        gecerli: true,
        tarih: nesne.tarih || null,
        anahtarSayisi: anahtarlar.length,
        ozet: {
            ogrenci: sayi('coach_students'),
            denemeSonucu: sayi('v2_results_data'),
            deneme: sayi('v2_trials_data'),
            program: anahtarlar.filter((a) => a.startsWith('program_schedule_')).length,
        },
        nesne,
    };
};

/**
 * Yedeği localStorage'a yazar.
 *
 * `birlestir` true ise yalnız yedekte olan anahtarlar yazılır (mevcut
 * fazlalık korunur); false ise uygulama anahtarları önce temizlenir —
 * "bu cihazı yedekteki hâle döndür" davranışı.
 *
 * Her yazılan anahtara TAZE `_fbtime_` damgası basılır: aksi hâlde
 * buluttaki eski kopya, yeni geri yüklenen veriyi ezebilirdi.
 */
export const yedegiGeriYukle = (nesne, { birlestir = false } = {}) => {
    if (!nesne?.veri) return { basarili: false, hata: 'Geçersiz yedek.' };

    if (!birlestir) {
        const silinecek = [];
        for (let i = 0; i < localStorage.length; i += 1) {
            const a = localStorage.key(i);
            if (!atlanir(a)) silinecek.push(a);
        }
        silinecek.forEach((a) => { try { localStorage.removeItem(a); } catch { /* yoksay */ } });
    }

    const damga = String(Date.now());
    let yazilan = 0;
    Object.entries(nesne.veri).forEach(([anahtar, deger]) => {
        if (atlanir(anahtar) || typeof deger !== 'string') return;
        try {
            localStorage.setItem(anahtar, deger);
            localStorage.setItem(`_fbtime_${anahtar}`, damga);
            yazilan += 1;
        } catch (e) {
            /* Kota dolduysa döngüyü kırmak yerine devam: kalanlar yazılsın */
            console.warn('Geri yükleme: anahtar yazılamadı', anahtar, e?.name);
        }
    });

    return { basarili: true, yazilan };
};

export default {
    yedekOlustur, yedegiIndir, yedegiCozumle, yedegiGeriYukle,
    sonYedektenBeriGun, yedekHatirlatilsinMi,
};
