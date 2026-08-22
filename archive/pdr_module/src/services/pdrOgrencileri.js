/**
 * 🏫 PDR ÖĞRENCİ HAVUZU (V1.1)
 *
 * YENİ MEKANİZMA — NEDEN ZORUNLU?
 * PDR (okul rehberliği) çalışması OKUL KAPSAMLI öğrenci listesiyle
 * yürür; koçluk öğrenci listesi ise ücretli/davetli dar bir kümedir.
 * PDR öğrencisini koçluk listesine eklemek hem kontenjan sayacını hem
 * davet/kimlik akışını kirletirdi. Bu havuz o yüzden AYRI anahtarda
 * (`pdr_students`) ve AYRI kimlik uzayında tutulur.
 *
 * İZOLASYON GARANTİLERİ:
 *  · Kimlikler `pdr_` önekiyle üretilir — koçluk `student_*`/sayısal
 *    kimlikleriyle asla çakışmaz; yanlışlıkla birleşme olamaz.
 *  · Havuz koçun kendi `syncData` kovasında yaşar: koçlar arası
 *    izolasyonu mevcut Firestore kuralları zaten zorlar, yeni koleksiyon
 *    ve yeni kural GEREKMEZ.
 *  · Koçluk ekranları bu havuzu hiç okumaz; havuz yalnızca PDR bölümü
 *    modüllerine verilir.
 *
 * Kayıt: { id, name, schoolNumber, grade, section, olusturma }
 */
import { listeOku, yaz } from './veriDeposu';

const ANAHTAR = 'pdr_students';

const kimlikUret = () =>
    `pdr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const normalize = (s) => String(s || '').trim();

export const listele = () => listeOku(ANAHTAR);

/**
 * Aynı öğrencinin ikinci kez eklenmesini engeller.
 * Okul numarası varsa numaradan; yoksa ad+sınıf ikilisinden karşılaştırır.
 */
const zatenVar = (liste, aday) => {
    const no = normalize(aday.schoolNumber);
    if (no) return liste.some((o) => normalize(o.schoolNumber) === no);
    const ad = normalize(aday.name).toLocaleLowerCase('tr-TR');
    const sinif = normalize(aday.grade);
    return liste.some((o) =>
        normalize(o.name).toLocaleLowerCase('tr-TR') === ad && normalize(o.grade) === sinif);
};

/** Tek öğrenci ekler. Dönen: { basarili, hata?, kayit? } */
export const ekle = ({ name, schoolNumber = '', grade = '', section = '' }) => {
    const ad = normalize(name);
    if (!ad) return { basarili: false, hata: 'Öğrenci adı zorunludur.' };
    const liste = listele();
    const aday = { name: ad, schoolNumber: normalize(schoolNumber), grade: normalize(grade), section: normalize(section) };
    if (zatenVar(liste, aday)) return { basarili: false, hata: `${ad} zaten havuzda.` };
    const kayit = { id: kimlikUret(), ...aday, olusturma: new Date().toISOString() };
    yaz(ANAHTAR, [...liste, kayit]);
    return { basarili: true, kayit };
};

/**
 * Toplu yükleme — her satır bir öğrenci.
 * Ayırıcı: sekme, noktalı virgül veya virgül.
 * Sütun sırası: Ad Soyad [; Okul No [; Sınıf [; Şube]]]
 * Dönen: { eklenen, atlanan: [{satir, sebep}] }
 */
export const topluEkle = (metin) => {
    const satirlar = String(metin || '').split('\n').map((s) => s.trim()).filter(Boolean);
    let liste = listele();
    const eklenenler = [];
    const atlanan = [];
    satirlar.forEach((satir) => {
        const p = satir.split(/[\t;,]/).map(normalize);
        const aday = { name: p[0] || '', schoolNumber: p[1] || '', grade: p[2] || '', section: p[3] || '' };
        if (!aday.name) { atlanan.push({ satir, sebep: 'ad yok' }); return; }
        if (zatenVar([...liste, ...eklenenler], aday)) { atlanan.push({ satir, sebep: 'zaten var' }); return; }
        eklenenler.push({ id: kimlikUret(), ...aday, olusturma: new Date().toISOString() });
    });
    if (eklenenler.length) {
        liste = [...liste, ...eklenenler];
        yaz(ANAHTAR, liste);
    }
    return { eklenen: eklenenler.length, atlanan };
};

/**
 * Havuzdan siler. `zorla`: son kayıt silinince boş liste de buluta
 * gitsin — yoksa silinen öğrenci senkron turunda geri gelir.
 */
export const sil = (id) => {
    const liste = listele();
    const yeni = liste.filter((o) => o.id !== id);
    if (yeni.length === liste.length) return { basarili: false, hata: 'Kayıt bulunamadı.' };
    yaz(ANAHTAR, yeni, { zorla: true });
    return { basarili: true };
};

export default { listele, ekle, topluEkle, sil };
