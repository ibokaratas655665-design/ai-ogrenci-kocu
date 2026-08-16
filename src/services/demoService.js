/**
 * 🎬 DEMO SÜRÜM
 *
 * Ziyaretçi kayıt olmadan gerçek ekranları örnek veriyle gezer.
 * Rakip sistemlerde yerleşmiş olan "tek tıkla demo hesap" yaklaşımı.
 *
 * Kritik kural: DEMO GERÇEK VERİYE DOKUNMAZ.
 * Uygulama localStorage'ı veritabanı gibi kullanıyor; demo verisi
 * doğrudan aynı anahtarlara yazılırsa kurumun 50 öğrencilik kaydı
 * ezilir. Bu yüzden demo başlarken:
 *
 *   1. Gerçek veri `demo_yedek` altına bir kez yedeklenir,
 *   2. Demo verisi yazılır,
 *   3. Demodan çıkışta yedek AYNEN geri yüklenir.
 *
 * Sekme kapansa bile `demo_aktif` bayrağı kaldığı için uygulama
 * bir sonraki açılışta yedeği geri yükler (bkz. `demoyuTemizle`).
 */

const BAYRAK = 'demo_aktif';
const YEDEK = 'demo_yedek';

/** Demonun dokunduğu depo anahtarları. */
const ANAHTARLAR = [
    'coach_students', 'users_db', 'student_tasks', 'exam_results',
    'student_groups', 'guidance_sessions', 'pdr_archive', 'coach_tasks',
    'managed_coaches', 'appointments', 'whatsapp_messages', 'user_session',
    'coach_active_section', 'pdr_materials', 'coach_subscriptions',
];

export const demoAktifMi = () => {
    try { return localStorage.getItem(BAYRAK) === '1'; } catch { return false; }
};

const yedekle = () => {
    const yedek = {};
    ANAHTARLAR.forEach((k) => { yedek[k] = localStorage.getItem(k); });
    localStorage.setItem(YEDEK, JSON.stringify(yedek));
};

const yedegiGeriYukle = () => {
    let yedek = null;
    try { yedek = JSON.parse(localStorage.getItem(YEDEK) || 'null'); } catch { yedek = null; }
    if (!yedek) return false;

    ANAHTARLAR.forEach((k) => {
        const v = yedek[k];
        if (v == null) localStorage.removeItem(k);
        else localStorage.setItem(k, v);
    });
    localStorage.removeItem(YEDEK);
    return true;
};

// ══════════════════════════════════════════════════════════════
//  ÖRNEK VERİ
// ══════════════════════════════════════════════════════════════

const bugun = (gunFarki = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + gunFarki);
    return d.toISOString().slice(0, 10);
};

const OGRENCILER = [
    { ad: 'Elif Yıldız', sinif: '12', sube: 'A', no: '101', hedef: 'Tıp' },
    { ad: 'Mert Kaya', sinif: '12', sube: 'A', no: '102', hedef: 'Bilgisayar Müh.' },
    { ad: 'Zeynep Aslan', sinif: '11', sube: 'B', no: '203', hedef: 'Hukuk' },
    { ad: 'Ahmet Demir', sinif: '11', sube: 'B', no: '204', hedef: 'Öğretmenlik' },
    { ad: 'Selin Çetin', sinif: '10', sube: 'C', no: '305', hedef: 'Mimarlık' },
    { ad: 'Burak Şahin', sinif: '9', sube: 'A', no: '401', hedef: 'Henüz belirsiz' },
];

const demoVerisiUret = () => {
    const ogrenciler = OGRENCILER.map((o, i) => ({
        id: `demo_ogr_${i + 1}`,
        name: o.ad,
        grade: o.sinif,
        section: o.sube,
        class: `${o.sinif}/${o.sube}`,
        schoolNumber: o.no,
        goal: o.hedef,
        status: 'Aktif',
        progress: 35 + ((i * 11) % 55),
        lastAction: 'Demo kaydı',
        parentName: `${o.ad.split(' ')[0]} velisi`,
        parentPhone: `05${(300000000 + i * 111111).toString().slice(0, 9)}`,
        ownerCoachId: 'demo_coach',
        ownerCoachName: 'Demo Koç',
        approvalStatus: 'onayli',
        createdAt: new Date().toISOString(),
    }));

    // Deneme sonuçları — grafiklerin boş görünmemesi için birkaç tur
    const denemeler = [];
    ogrenciler.forEach((s, i) => {
        for (let t = 0; t < 4; t += 1) {
            denemeler.push({
                id: `demo_dnm_${s.id}_${t}`,
                studentId: s.id,
                studentName: s.name,
                examName: `TYT Deneme ${t + 1}`,
                date: bugun(-28 + t * 7),
                createdAt: new Date(Date.now() - (28 - t * 7) * 86400000).toISOString(),
                net: 55 + i * 2 + t * 3,
                totalNet: 55 + i * 2 + t * 3,
            });
        }
    });

    const gorevler = {};
    ogrenciler.forEach((s, i) => {
        gorevler[s.id] = [
            {
                id: `demo_gorev_${s.id}_1`,
                studentId: s.id,
                title: 'Paragraf — 40 soru çöz',
                description: 'Yanlışlarını hata defterine işle.',
                dueDate: bugun(2),
                priority: 'yuksek',
                status: 'pending',
                completed: false,
                assignedBy: 'demo_coach',
                assignedByName: 'Demo Koç',
                assignedAt: new Date(Date.now() - 86400000).toISOString(),
            },
            {
                id: `demo_gorev_${s.id}_2`,
                studentId: s.id,
                title: 'Matematik — Türev tekrar',
                dueDate: bugun(5),
                priority: 'normal',
                status: i % 2 === 0 ? 'done' : 'pending',
                completed: i % 2 === 0,
                assignedBy: 'demo_coach',
                assignedByName: 'Demo Koç',
                assignedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
            },
        ];
    });

    // Rehberlik tarafı boş kalmasın — birkaç dosya kaydı
    const arsiv = {
        kayitlar: [
            {
                id: 'demo_pa_1', klasor: '1', baslik: 'Okul RPD Programı (imzalı çıktı)',
                aciklama: 'Yürütme komisyonunca imzalandı', tarih: bugun(-40),
                yil: '2025-2026', kaynak: 'plan', ekleyen: 'Demo Koç',
                olusturma: new Date(Date.now() - 40 * 86400000).toISOString(),
            },
            {
                id: 'demo_pa_2', klasor: '5', baslik: 'RPD Hizmetleri Yürütme Komisyonu I. toplantı tutanağı (yıl başı)',
                tarih: bugun(-38), yil: '2025-2026', kaynak: 'tutanak', ekleyen: 'Demo Koç',
                olusturma: new Date(Date.now() - 38 * 86400000).toISOString(),
            },
            {
                id: 'demo_pa_3', klasor: '6', baslik: 'Öğrenci görüşme formları',
                aciklama: 'Sınav kaygısı görüşmesi', ogrenci: 'Elif Yıldız', sinif: '12/A',
                tarih: bugun(-10), yil: '2025-2026', kaynak: 'gorusme', ekleyen: 'Demo Koç',
                olusturma: new Date(Date.now() - 10 * 86400000).toISOString(),
            },
            {
                id: 'demo_pa_4', klasor: '8', baslik: 'Okul risk haritası',
                tarih: bugun(-20), yil: '2025-2026', kaynak: 'risk', ekleyen: 'Demo Koç',
                olusturma: new Date(Date.now() - 20 * 86400000).toISOString(),
            },
        ],
        notlar: {},
    };

    return { ogrenciler, denemeler, gorevler, arsiv };
};

// ══════════════════════════════════════════════════════════════
//  GİRİŞ / ÇIKIŞ
// ══════════════════════════════════════════════════════════════

export const DEMO_KULLANICI = {
    coach: {
        id: 'demo_coach', uid: 'demo_coach',
        name: 'Demo Koç', role: 'coach', coachRole: 'masterCoach',
        sections: ['kocluk', 'pdr'],
        email: 'demo@ornek.app', phone: '05000000000',
        schoolName: 'Demo Anadolu Lisesi',
        approved: true, demo: true,
    },
    student: {
        id: 'demo_ogr_1', uid: 'demo_ogr_1',
        name: 'Elif Yıldız', role: 'student',
        grade: '12', section: 'A', schoolNumber: '101',
        coachId: 'demo_coach', coachName: 'Demo Koç',
        approved: true, demo: true,
    },
    parent: {
        id: 'demo_veli_1', uid: 'demo_veli_1',
        name: 'Elif Yıldız velisi', role: 'parent',
        studentId: 'demo_ogr_1',
        approved: true, demo: true,
    },
};

/**
 * Demoyu başlatır.
 * @param {'coach'|'student'|'parent'} rol
 * @returns {{basarili:boolean, kullanici?:object, hata?:string}}
 */
export const girisDemo = (rol = 'coach') => {
    const kullanici = DEMO_KULLANICI[rol];
    if (!kullanici) return { basarili: false, hata: 'Bilinmeyen demo rolü' };

    try {
        // Demo zaten açıksa ikinci kez yedek ALMA — yedeğin üzerine
        // demo verisi yazılırsa gerçek veri geri getirilemez.
        if (!demoAktifMi()) yedekle();

        const { ogrenciler, denemeler, gorevler, arsiv } = demoVerisiUret();

        localStorage.setItem('coach_students', JSON.stringify(ogrenciler));
        localStorage.setItem('exam_results', JSON.stringify(denemeler));
        localStorage.setItem('student_tasks', JSON.stringify(gorevler));
        localStorage.setItem('pdr_archive', JSON.stringify(arsiv));
        localStorage.setItem('managed_coaches', JSON.stringify([]));
        localStorage.setItem('coach_tasks', JSON.stringify([]));
        localStorage.setItem('student_groups', JSON.stringify([]));
        localStorage.setItem('pdr_materials', JSON.stringify([]));
        localStorage.setItem('coach_subscriptions', JSON.stringify({
            demo_coach: {
                planId: 'rehberlik', baslangic: bugun(), bitis: bugun(30),
                deneme: true, durum: 'aktif', odenen: 0,
            },
        }));
        localStorage.setItem('users_db', JSON.stringify([DEMO_KULLANICI.coach]));
        localStorage.setItem('user_session', JSON.stringify(kullanici));
        localStorage.setItem('coach_active_section', 'kocluk');
        localStorage.setItem(BAYRAK, '1');

        // Demo sırasında buluta yazmak gerçek hesabın verisini bozar
        try { window.firebaseSync?.pause?.(); } catch { /* senkron yoksa sorun değil */ }

        return { basarili: true, kullanici };
    } catch (e) {
        return { basarili: false, hata: e?.message || 'Demo başlatılamadı' };
    }
};

/**
 * Demodan çıkar ve gerçek veriyi geri yükler.
 * Uygulama açılışında da çağrılmalıdır: kullanıcı demo içindeyken
 * sekmeyi kapatmışsa veri demo hâlinde kalmasın.
 */
export const demoyuTemizle = () => {
    if (!demoAktifMi()) return false;
    const geri = yedegiGeriYukle();
    localStorage.removeItem(BAYRAK);
    try { window.firebaseSync?.resume?.(); } catch { /* ignore */ }
    return geri;
};

export default { girisDemo, demoyuTemizle, demoAktifMi, DEMO_KULLANICI };
