/**
 * 🗄️ PDR DESİMAL DOSYA ARŞİVİ
 *
 * Rehberlik servisinin tutmak zorunda olduğu desimal klasörleri uygulamada
 * yaşayan bir arşive dönüştürür:
 *
 *   · Her klasöre belge kaydı eklenir (dosya değil KAYIT — ne, ne zaman,
 *     kim tarafından, hangi öğrenci/sınıf için).
 *   · Uygulamanın kendi modülleri (görüşme, envanter, BEP, risk haritası)
 *     ürettikleri kayıtları OTOMATİK olarak ilgili klasöre bağlar; danışman
 *     aynı şeyi iki kez girmez.
 *   · Zorunlu belgelerden eksik olanlar denetim öncesi listelenir.
 *   · Öğretim yılı bazlı arşivlenir; yıl değişince klasörler sıfırlanmaz,
 *     yeni yıl ayrı görünür.
 */

import { DESIMAL_PLAN, planKademeye, ogretimYili } from '../data/pdrDecimalPlan';

const KEY = 'pdr_archive';

const bosDepo = () => ({ kayitlar: [], notlar: {} });

const oku = () => {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw || !raw.trim()) return bosDepo();
        const v = JSON.parse(raw);
        return { ...bosDepo(), ...(v || {}) };
    } catch {
        return bosDepo();
    }
};

let syncTimer = null;
const yaz = (depo) => {
    localStorage.setItem(KEY, JSON.stringify(depo));
    try { window.dispatchEvent(new StorageEvent('storage', { key: KEY })); } catch { /* ignore */ }
    try { window.dispatchEvent(new Event('pdr-archive-updated')); } catch { /* ignore */ }
    // Arka arkaya kayıt girilirken tek bulut yazımı yeter
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
        syncTimer = null;
        try { window.firebaseSync?.syncKey?.(KEY); } catch { /* senkron yoksa sorun değil */ }
    }, 1500);
};

const uid = () => `pa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// ══════════════════════════════════════════════════════════════
//  KAYIT İŞLEMLERİ
// ══════════════════════════════════════════════════════════════

/**
 * Klasöre belge kaydı ekler.
 * @param {object} p
 * @param {string} p.klasor    Dosya numarası ('1'–'10')
 * @param {string} p.baslik    Belge adı
 * @param {string} [p.aciklama]
 * @param {string} [p.ogrenci] İlgili öğrenci adı (varsa)
 * @param {string} [p.sinif]   İlgili sınıf (varsa)
 * @param {string} [p.tarih]   ISO tarih; yoksa bugün
 * @param {string} [p.kaynak]  Otomatik bağlanan modül anahtarı
 * @param {string} [p.kaynakId] Kaynak kayıt kimliği (tekrarı önler)
 * @param {string} [p.ekleyen]
 */
export const ekle = (p) => {
    if (!p?.klasor || !p?.baslik) return null;
    const depo = oku();

    // Aynı kaynak kaydı iki kez bağlanmasın
    if (p.kaynakId && depo.kayitlar.some((k) => k.kaynakId === p.kaynakId)) {
        return null;
    }

    const kayit = {
        id: uid(),
        klasor: String(p.klasor),
        baslik: p.baslik,
        aciklama: p.aciklama || '',
        ogrenci: p.ogrenci || '',
        sinif: p.sinif || '',
        tarih: p.tarih || new Date().toISOString().slice(0, 10),
        yil: p.yil || ogretimYili(),
        kaynak: p.kaynak || 'elle',
        kaynakId: p.kaynakId || null,
        ekleyen: p.ekleyen || '',
        olusturma: new Date().toISOString(),
    };

    depo.kayitlar = [kayit, ...depo.kayitlar];
    yaz(depo);
    return kayit;
};

export const sil = (id) => {
    const depo = oku();
    depo.kayitlar = depo.kayitlar.filter((k) => k.id !== id);
    yaz(depo);
};

export const guncelle = (id, yama) => {
    const depo = oku();
    depo.kayitlar = depo.kayitlar.map((k) => (k.id === id ? { ...k, ...yama } : k));
    yaz(depo);
};

/** Klasör için serbest not (danışmanın kendi hatırlatması). */
export const notAl = (klasor) => oku().notlar[String(klasor)] || '';
export const notYaz = (klasor, metin) => {
    const depo = oku();
    depo.notlar = { ...depo.notlar, [String(klasor)]: metin };
    yaz(depo);
};

// ══════════════════════════════════════════════════════════════
//  SORGULAR
// ══════════════════════════════════════════════════════════════

export const tumKayitlar = (yil = null) => {
    const liste = oku().kayitlar;
    return yil ? liste.filter((k) => k.yil === yil) : liste;
};

/**
 * Başlığı karşılaştırılabilir kelimelere ayırır.
 * Noktalama atılır, çok geçen dolgu kelimeleri ("formu", "çalışması")
 * elenir — bunlar neredeyse her belge adında var, ayırt edici değil.
 */
const DOLGU = new Set([
    'formu', 'form', 've', 'ile', 'çalışması', 'çalışma', 'raporu', 'rapor',
    'listesi', 'liste', 'belgesi', 'belge', 'kaydı', 'kayıt', 'planı', 'plan',
]);

const kelimeler = (metin) =>
    String(metin || '')
        .toLocaleLowerCase('tr-TR')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter((k) => k.length > 2 && !DOLGU.has(k));

export const klasorKayitlari = (klasor, yil = null) =>
    tumKayitlar(yil)
        .filter((k) => k.klasor === String(klasor))
        .sort((a, b) => String(b.tarih).localeCompare(String(a.tarih)));

/** Arşivde kayıt bulunan öğretim yılları (yeniden eskiye). */
export const yillar = () => {
    const set = new Set(oku().kayitlar.map((k) => k.yil).filter(Boolean));
    set.add(ogretimYili());
    return [...set].sort().reverse();
};

/**
 * Bir klasörün denetim durumu.
 * Zorunlu belgelerden hangileri var, hangileri eksik.
 */
export const klasorDurumu = (klasor, yil = null, kademe = null) => {
    // Belge listesi kademeye gore suzulur: anasinifinda LGS belgesi aranmaz
    const tanim = planKademeye(kademe).find((k) => k.no === String(klasor));
    if (!tanim) return null;

    const kayitlar = klasorKayitlari(klasor, yil);
    const basliklar = kayitlar.map((k) => kelimeler(k.baslik));

    /**
     * Zorunlu belge "var mı?" kararı.
     *
     * Tam metin karşılaştırması işe yaramıyor: danışman hazır etiketi
     * seçmeyip "9-A otobiyografi çalışması" gibi serbest başlık yazınca
     * belge var olduğu hâlde eksik görünüyordu. Bu yüzden anlamlı
     * kelimeler üzerinden örtüşme aranır — belgenin ayırt edici
     * kelimelerinin çoğu başlıkta geçiyorsa belge mevcut sayılır.
     */
    const eslesme = (belgeAdi) => {
        const hedef = kelimeler(belgeAdi);
        if (!hedef.length) return false;
        return basliklar.some((b) => {
            if (!b.length) return false;
            const ortak = hedef.filter((k) => b.includes(k)).length;
            return ortak / hedef.length >= 0.6;
        });
    };

    const zorunlular = tanim.belgeler.filter((b) => b.zorunlu);
    const eksikler = zorunlular.filter((b) => !eslesme(b.ad));

    return {
        tanim,
        kayitSayisi: kayitlar.length,
        zorunluSayisi: zorunlular.length,
        tamamlanan: zorunlular.length - eksikler.length,
        eksikler,
        oran: zorunlular.length
            ? Math.round(((zorunlular.length - eksikler.length) / zorunlular.length) * 100)
            : 100,
    };
};

/** Tüm arşivin denetime hazırlık özeti. */
export const genelDurum = (yil = null, kademe = null) => {
    const satirlar = DESIMAL_PLAN.map((k) => klasorDurumu(k.no, yil, kademe)).filter(Boolean);
    const zorunlu = satirlar.reduce((t, s) => t + s.zorunluSayisi, 0);
    const tamam = satirlar.reduce((t, s) => t + s.tamamlanan, 0);
    return {
        satirlar,
        toplamKayit: tumKayitlar(yil).length,
        zorunlu,
        tamam,
        eksik: zorunlu - tamam,
        oran: zorunlu ? Math.round((tamam / zorunlu) * 100) : 100,
    };
};

// ══════════════════════════════════════════════════════════════
//  OTOMATİK BAĞLAMA
//  Uygulamanın diğer modüllerindeki kayıtları desimal klasörlere
//  bağlar. Danışman aynı belgeyi ikinci kez girmek zorunda kalmaz.
// ══════════════════════════════════════════════════════════════

const guvenliJson = (key, def = []) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw || !raw.trim()) return def;
        return JSON.parse(raw) ?? def;
    } catch {
        return def;
    }
};

/**
 * Mevcut modül kayıtlarını tarar ve arşive bağlar.
 * Tekrar çalıştırılabilir — `kaynakId` sayesinde aynı kayıt iki kez eklenmez.
 * @returns {number} eklenen kayıt sayısı
 */
export const otomatikBagla = (kullaniciAdi = '') => {
    let eklenen = 0;
    const yil = ogretimYili();

    // ── 9: Kaynaştırma Öğrenci Dosyası — BEP kayıtları ────
    try {
        const bep = guvenliJson('bep_data', {});
        (bep.plans || []).forEach((p) => {
            const ogr = (bep.students || []).find((s) => s.id === p.bepStudentId);
            if (ekle({
                klasor: '9',
                baslik: `BEP planı — ${p.course || 'ders'}`,
                aciklama: `${(p.longTermGoals || []).length} uzun, ${(p.shortTermGoals || []).length} kısa dönemli amaç`,
                ogrenci: ogr?.name || '',
                sinif: ogr?.class || '',
                tarih: (p.createdAt || '').slice(0, 10),
                kaynak: 'bep',
                kaynakId: `bep_plan_${p.id}`,
                ekleyen: kullaniciAdi,
                yil,
            })) eklenen++;
        });

        (bep.meetings || []).forEach((m) => {
            const ogr = (bep.students || []).find((s) => s.id === m.bepStudentId);
            if (ekle({
                klasor: '9',
                baslik: 'BEP geliştirme birimi toplantı tutanağı',
                aciklama: m.type || '',
                ogrenci: ogr?.name || '',
                tarih: m.date || (m.createdAt || '').slice(0, 10),
                kaynak: 'bep',
                kaynakId: `bep_meeting_${m.id}`,
                ekleyen: kullaniciAdi,
                yil,
            })) eklenen++;
        });

        (bep.performances || []).forEach((p) => {
            const ogr = (bep.students || []).find((s) => s.id === p.bepStudentId);
            if (ekle({
                klasor: '9',
                baslik: 'Eğitsel performans değerlendirme formu',
                aciklama: p.course || '',
                ogrenci: ogr?.name || '',
                tarih: p.date || (p.createdAt || '').slice(0, 10),
                kaynak: 'bep',
                kaynakId: `bep_perf_${p.id}`,
                ekleyen: kullaniciAdi,
                yil,
            })) eklenen++;
        });
    } catch { /* bep verisi yoksa geç */ }

    // ── 7: Sınıf Dosyası — envanter ve test sonuçları ─────
    try {
        Object.keys(localStorage)
            .filter((k) => k.startsWith('test_results_') || k.startsWith('test_result_'))
            .forEach((k) => {
                const sonuc = guvenliJson(k, null);
                const liste = Array.isArray(sonuc) ? sonuc : (sonuc ? [sonuc] : []);
                liste.forEach((r, i) => {
                    if (!r?.testName && !r?.testId) return;
                    if (ekle({
                        klasor: '7',
                        baslik: r.testName || r.testId,
                        aciklama: 'Envanter uygulama sonucu',
                        ogrenci: r.studentName || '',
                        tarih: (r.completedAt || r.date || '').slice(0, 10),
                        kaynak: 'test',
                        kaynakId: `${k}_${r.id || i}`,
                        ekleyen: kullaniciAdi,
                        yil,
                    })) eklenen++;
                });
            });
    } catch { /* test verisi yoksa geç */ }

    // ── 6: Görüşme Dosyası — öğrenci ve veli görüşmeleri ──
    try {
        const gorusmeler = guvenliJson('guidance_sessions', []);
        gorusmeler.forEach((g) => {
            const veliMi = /veli|aile|anne|baba/i.test(g.type || g.category || '');
            if (ekle({
                // Öğrenci de veli de aynı dosyada: 6 — Görüşme Dosyası
                klasor: '6',
                baslik: veliMi ? 'Veli görüşme kayıt formu' : 'Bireysel görüşme kayıt formu',
                aciklama: g.topic || g.subject || '',
                ogrenci: g.studentName || '',
                tarih: (g.date || g.createdAt || '').slice(0, 10),
                kaynak: 'gorusme',
                kaynakId: `gorusme_${g.id}`,
                ekleyen: kullaniciAdi,
                yil,
            })) eklenen++;
        });
    } catch { /* görüşme verisi yoksa geç */ }

    return eklenen;
};

export default {
    ekle, sil, guncelle, notAl, notYaz,
    tumKayitlar, klasorKayitlari, yillar,
    klasorDurumu, genelDurum, otomatikBagla,
};
