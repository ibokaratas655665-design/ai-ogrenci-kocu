import { nesneOku } from '../services/veriDeposu';
/**
 * 🏛️ MEB BELGE VE VERİ STANDARTLARI
 *
 * PDR bölümündeki her form, kayıt ve PDF çıktısı MEBBİS / e-Okul
 * belgeleriyle uyumlu olmak zorunda. Bu dosya o uyumun tek kaynağıdır:
 *
 *   · Resmî yazı başlığı (T.C. → Valilik → Müdürlük → Okul)
 *   · Evrak sayı/tarih düzeni
 *   · e-Okul öğrenci kimlik alanları ve doğrulama kuralları
 *   · MEB terminolojisi (sınıf düzeyi, şube, dönem, kurum türü)
 *   · İmza blokları ve onay makamları
 *
 * Kurum bilgileri (il, ilçe, okul adı, kurum kodu) Ayarlar → Kurum
 * bölümünden bir kez girilir; tüm belgeler oradan beslenir.
 */

// ══════════════════════════════════════════════════════════════
//  1. KURUM BİLGİLERİ
// ══════════════════════════════════════════════════════════════

const KURUM_KEY = 'meb_institution';

export const BOS_KURUM = {
    il: '',
    ilce: '',
    okulAdi: '',
    kurumKodu: '',          // MEBBİS kurum kodu (genelde 6 hane)
    okulTuru: 'Anadolu Lisesi',
    mudur: '',
    mudurYardimcisi: '',
    rehberOgretmen: '',
    telefon: '',
    eposta: '',
    adres: '',
};

export const kurumBilgisi = () => {
    try {
        const raw = localStorage.getItem(KURUM_KEY);
        if (!raw || !raw.trim()) return { ...BOS_KURUM };
        return { ...BOS_KURUM, ...(JSON.parse(raw) || {}) };
    } catch {
        return { ...BOS_KURUM };
    }
};

export const kurumKaydet = (bilgi) => {
    const temiz = { ...BOS_KURUM, ...bilgi };
    localStorage.setItem(KURUM_KEY, JSON.stringify(temiz));
    try { window.dispatchEvent(new Event('institution-updated')); } catch { /* ignore */ }
    try { window.firebaseSync?.syncKey?.(KURUM_KEY); } catch { /* ignore */ }
    return temiz;
};

/** Resmî yazı başlığındaki üç satır. */
export const resmiBaslik = (k = kurumBilgisi()) => {
    const satirlar = ['T.C.'];
    if (k.il) satirlar.push(`${k.il.toLocaleUpperCase('tr-TR')} VALİLİĞİ`);
    if (k.ilce) satirlar.push(`${k.ilce.toLocaleUpperCase('tr-TR')} İLÇE MİLLÎ EĞİTİM MÜDÜRLÜĞÜ`);
    else if (k.il) satirlar.push('İL MİLLÎ EĞİTİM MÜDÜRLÜĞÜ');
    if (k.okulAdi) satirlar.push(k.okulAdi.toLocaleUpperCase('tr-TR'));
    return satirlar;
};

export const kurumEksikAlanlar = (k = kurumBilgisi()) =>
    ['il', 'okulAdi'].filter((a) => !String(k[a] || '').trim());

// ══════════════════════════════════════════════════════════════
//  2. EVRAK SAYI VE TARİH
// ══════════════════════════════════════════════════════════════

const SAYAC_KEY = 'meb_evrak_sayac';

/**
 * Resmî evrak sayısı üretir.
 * Biçim:  <kurumKodu>-<yıl>/<sıra>     (kurum kodu yoksa yıl/sıra)
 * MEB yazışmalarında kullanılan düzene uyar; sıra numarası kurum
 * içinde artan tek numaradır.
 */
export const evrakSayisiUret = () => {
    const k = kurumBilgisi();
    const yil = new Date().getFullYear();
    let sayac = {};
    try { sayac = nesneOku(SAYAC_KEY); } catch { sayac = {}; }
    const sira = (sayac[yil] || 0) + 1;
    sayac[yil] = sira;
    localStorage.setItem(SAYAC_KEY, JSON.stringify(sayac));
    const on = k.kurumKodu ? `${k.kurumKodu}-` : '';
    return `${on}${yil}/${String(sira).padStart(4, '0')}`;
};

/** MEB yazışmalarında kullanılan tarih biçimi: 16.08.2026 */
export const resmiTarih = (d = new Date()) => {
    const g = String(d.getDate()).padStart(2, '0');
    const a = String(d.getMonth() + 1).padStart(2, '0');
    return `${g}.${a}.${d.getFullYear()}`;
};

// ══════════════════════════════════════════════════════════════
//  3. e-OKUL ÖĞRENCİ KİMLİK ALANLARI
//     e-Okul'dan alınan listelerde bulunan sütunlar ve doğrulama
//     kuralları. İçe aktarma ve form doğrulaması bunu kullanır.
// ══════════════════════════════════════════════════════════════

export const EOKUL_ALANLARI = [
    { id: 'tcKimlik', ad: 'T.C. Kimlik No', eokul: 'TC Kimlik No', tip: 'tc', zorunlu: false },
    { id: 'schoolNumber', ad: 'Okul Numarası', eokul: 'Öğrenci No', tip: 'sayi', zorunlu: true },
    { id: 'name', ad: 'Adı Soyadı', eokul: 'Adı Soyadı', tip: 'metin', zorunlu: true },
    { id: 'grade', ad: 'Sınıf Düzeyi', eokul: 'Sınıfı', tip: 'sinif', zorunlu: true },
    { id: 'section', ad: 'Şubesi', eokul: 'Şubesi', tip: 'sube', zorunlu: false },
    { id: 'gender', ad: 'Cinsiyet', eokul: 'Cinsiyeti', tip: 'cinsiyet', zorunlu: false },
    { id: 'birthDate', ad: 'Doğum Tarihi', eokul: 'Doğum Tarihi', tip: 'tarih', zorunlu: false },
    { id: 'parentName', ad: 'Veli Adı Soyadı', eokul: 'Veli Adı', tip: 'metin', zorunlu: false },
    { id: 'parentPhone', ad: 'Veli Telefonu', eokul: 'Veli Cep Tel', tip: 'telefon', zorunlu: false },
    { id: 'parentRelation', ad: 'Yakınlık Derecesi', eokul: 'Yakınlığı', tip: 'yakinlik', zorunlu: false },
    { id: 'address', ad: 'Adres', eokul: 'Adres', tip: 'metin', zorunlu: false },
];

export const CINSIYET = ['Kız', 'Erkek'];
export const YAKINLIK = ['Anne', 'Baba', 'Vasi', 'Diğer'];

/** MEB sınıf düzeyleri — kurum türüne göre. */
export const SINIF_DUZEYLERI = {
    'İlkokul': ['1', '2', '3', '4'],
    'Ortaokul': ['5', '6', '7', '8'],
    'İmam Hatip Ortaokulu': ['5', '6', '7', '8'],
    'Anadolu Lisesi': ['9', '10', '11', '12'],
    'Fen Lisesi': ['9', '10', '11', '12'],
    'Sosyal Bilimler Lisesi': ['9', '10', '11', '12'],
    'Anadolu İmam Hatip Lisesi': ['9', '10', '11', '12'],
    'Mesleki ve Teknik Anadolu Lisesi': ['9', '10', '11', '12'],
    'Çok Programlı Anadolu Lisesi': ['9', '10', '11', '12'],
    'Özel Eğitim Uygulama Okulu': ['1', '2', '3', '4', '5', '6', '7', '8'],
};

export const OKUL_TURLERI = Object.keys(SINIF_DUZEYLERI);

/** MEB dönem adlandırması. */
export const DONEMLER = ['I. Dönem', 'II. Dönem'];

/** T.C. kimlik numarası algoritmik doğrulama. */
export const tcGecerliMi = (tc) => {
    const s = String(tc || '').trim();
    if (!/^[1-9][0-9]{10}$/.test(s)) return false;
    const d = s.split('').map(Number);
    const tek = d[0] + d[2] + d[4] + d[6] + d[8];
    const cift = d[1] + d[3] + d[5] + d[7];
    if ((tek * 7 - cift) % 10 !== d[9]) return false;
    if (d.slice(0, 10).reduce((a, b) => a + b, 0) % 10 !== d[10]) return false;
    return true;
};

/** e-Okul biçiminde sınıf/şube gösterimi: "9/A" */
export const sinifSube = (ogrenci) => {
    const g = String(ogrenci?.grade ?? '').trim();
    const s = String(ogrenci?.section ?? '').trim().toLocaleUpperCase('tr-TR');
    if (g && s) return `${g}/${s}`;
    return g || s || '';
};

// ══════════════════════════════════════════════════════════════
//  4. İMZA BLOKLARI
//     Belge türüne göre altında kimin imzası olacağı.
// ══════════════════════════════════════════════════════════════

export const IMZA_SETLERI = {
    rehberlik: ['Rehber Öğretmen / Psikolojik Danışman', 'Okul Müdürü'],
    komisyon: ['Rehber Öğretmen', 'Müdür Yardımcısı', 'Okul Müdürü'],
    bep: ['Rehber Öğretmen', 'Sınıf/Ders Öğretmeni', 'Veli', 'Okul Müdürü'],
    veli: ['Veli', 'Rehber Öğretmen'],
    ogrenci: ['Öğrenci', 'Rehber Öğretmen'],
    yoneltme: ['Sınıf Rehber Öğretmeni', 'Rehber Öğretmen', 'Okul Müdürü'],
};

/** İmza bloğunu kurum bilgisindeki isimlerle doldurur. */
export const imzaBloklari = (set = 'rehberlik', k = kurumBilgisi()) => {
    const unvanlar = IMZA_SETLERI[set] || IMZA_SETLERI.rehberlik;
    const isimler = {
        'Okul Müdürü': k.mudur,
        'Müdür Yardımcısı': k.mudurYardimcisi,
        'Rehber Öğretmen': k.rehberOgretmen,
        'Rehber Öğretmen / Psikolojik Danışman': k.rehberOgretmen,
    };
    return unvanlar.map((u) => ({ unvan: u, isim: isimler[u] || '' }));
};

// ══════════════════════════════════════════════════════════════
//  5. GİZLİLİK İBARELERİ
//     Görüşme kayıtları ve risk belgeleri resmî olarak gizlidir.
// ══════════════════════════════════════════════════════════════

export const GIZLILIK_IBARESI =
    'Bu belge Rehberlik ve Psikolojik Danışma Hizmetleri Yönetmeliği gereği GİZLİDİR. '
    + 'Yalnızca psikolojik danışman ve yetkili makamlarca görülebilir.';

export const KVKK_IBARESI =
    'Bu belgedeki kişisel veriler 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında '
    + 'işlenmekte olup üçüncü kişilerle paylaşılamaz.';

export default {
    BOS_KURUM, kurumBilgisi, kurumKaydet, resmiBaslik, kurumEksikAlanlar,
    evrakSayisiUret, resmiTarih,
    EOKUL_ALANLARI, CINSIYET, YAKINLIK, SINIF_DUZEYLERI, OKUL_TURLERI, DONEMLER,
    tcGecerliMi, sinifSube,
    IMZA_SETLERI, imzaBloklari, GIZLILIK_IBARESI, KVKK_IBARESI,
};
