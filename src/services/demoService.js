import { oku } from './veriDeposu';
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
 *
 * 04.09 (canlı eşleme): tohum verisi tüm analiz ekranlarını dolduracak
 * kadar zengin — v2 deneme sonuçları (TYT+AYT), öğrenci deneme
 * analizleri (konu hatalı), günlük çalışma, hata defteri, haftalık öz
 * değerlendirme, pomodoro, haftalık program + ilerleme ve UYGULAMA İÇİ
 * deneme motoru kaynak/atama örnekleri (Elif'in çözülmüş istatistikli
 * 3 denemesi dahil).
 */

const BAYRAK = 'demo_aktif';
const YEDEK = 'demo_yedek';

/** Demonun dokunduğu depo anahtarları. */
const ANAHTARLAR = [
    'coach_students', 'users_db', 'student_tasks', 'exam_results',
    'v2_results_data', 'v2_trials_data',
    'student_groups', 'guidance_sessions', 'pdr_archive', 'coach_tasks',
    'managed_coaches', 'appointments', 'whatsapp_messages', 'user_session',
    'coach_active_section', 'pdr_materials', 'coach_subscriptions',
    'study_log', 'error_notebook', 'deneme_analizleri',
    'all_self_assessments', 'messages', 'student_messages',
    'program_progress', 'deneme_kaynaklari', 'deneme_atamalari', 'deneme_oturumlari',
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
    try { yedek = oku(YEDEK, null); } catch { yedek = null; }
    if (!yedek) return false;

    ANAHTARLAR.forEach((k) => {
        const v = yedek[k];
        if (v == null) localStorage.removeItem(k);
        else localStorage.setItem(k, v);
    });
    // Öğrenci-başına anahtarlar yedek listesinde yok — demo kalıntısı bırakma
    OGRENCILER.forEach((_, i) => {
        localStorage.removeItem(`program_schedule_demo_ogr_${i + 1}`);
        localStorage.removeItem(`program_meta_demo_ogr_${i + 1}`);
        localStorage.removeItem(`pomodoro_log_demo_ogr_${i + 1}`);
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

    // Eski basit deneme kayıtları (exam_results) — geriye dönük ekranlar için
    const denemeler = [];
    ogrenciler.forEach((s, i) => {
        for (let t = 0; t < 4; t += 1) {
            denemeler.push({
                id: `demo_dnm_${s.id}_${t}`,
                studentId: s.id,
                studentName: s.name,
                examName: `TYT Deneme ${t + 1}`,
                date: bugun(t * 7 - 28),
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

    /* ── v2 deneme motoru: TYT ders dağılımı + gerçekçi netler ── */
    const TYT_DERSLER = [
        { ad: 'Türkçe', key: 'turkce', soru: 40, off: 0.05 },
        { ad: 'Tarih', key: 'tarih', soru: 5, off: -0.02 },
        { ad: 'Coğrafya', key: 'cografya', soru: 5, off: -0.05 },
        { ad: 'Felsefe', key: 'felsefe', soru: 5, off: 0 },
        { ad: 'Din', key: 'din', soru: 5, off: 0.04 },
        { ad: 'Matematik', key: 'mat', soru: 40, off: -0.08 },
        { ad: 'Fizik', key: 'fizik', soru: 7, off: -0.1 },
        { ad: 'Kimya', key: 'kimya', soru: 7, off: -0.05 },
        { ad: 'Biyoloji', key: 'biyoloji', soru: 6, off: 0.02 },
    ];
    const KONULAR = {
        Matematik: 'Problemler', 'Türkçe': 'Paragraf', Fizik: 'Kuvvet ve Hareket',
        Kimya: 'Mol Kavramı', Biyoloji: 'Hücre', Tarih: 'İlk Türk Devletleri',
        'Coğrafya': 'İklim Bilgisi', Felsefe: 'Bilgi Felsefesi', Din: 'İbadetler',
    };
    const sinirla = (x) => Math.max(0, Math.min(0.96, x));

    const v2Sonuclar = [];
    const denemeAnalizleri = [];
    const denemeTanimlari = [];

    ['TYT', 'AYT'].forEach((tur) => {
        for (let t = 0; t < 3; t += 1) {
            const gunOnce = 28 - t * 10;
            denemeTanimlari.push({
                id: `demo_trial_${tur}_${t + 1}`,
                name: `${t + 1}. ${tur} Denemesi`,
                examType: tur,
                date: bugun(-gunOnce),
                createdAt: new Date(Date.now() - 86400000 * gunOnce).toISOString(),
            });
        }
    });

    ogrenciler.forEach((s, i) => {
        for (let t = 0; t < 3; t += 1) {
            const gunOnce = 28 - t * 10;
            const tarih = bugun(-gunOnce);
            const olusturma = new Date(Date.now() - 86400000 * gunOnce).toISOString();
            const taban = sinirla(0.45 + 0.045 * i + 0.08 * t);
            const subjects = {};
            const dersler = {};
            const konuHatalari = [];
            let toplamNet = 0;
            TYT_DERSLER.forEach((d) => {
                const oran = sinirla(taban + d.off);
                const dogru = Math.round(d.soru * oran);
                const yanlis = Math.round(0.45 * (d.soru - dogru));
                const bos = Math.max(0, d.soru - dogru - yanlis);
                const net = +(dogru - yanlis / 4).toFixed(2);
                toplamNet += net;
                subjects[d.key] = { d: dogru, y: yanlis, net };
                dersler[d.ad] = { dogru, yanlis, bos, net };
                if (yanlis >= 3 && KONULAR[d.ad]) {
                    konuHatalari.push({ ders: d.ad, konu: KONULAR[d.ad], adet: Math.min(yanlis, 5), nedenler: [], not: '' });
                }
            });
            toplamNet = +toplamNet.toFixed(2);
            const netOku = (k) => subjects[k]?.net || 0;
            subjects.tyt_turkce = { net: netOku('turkce') };
            subjects.tyt_mat = { net: netOku('mat') };
            subjects.tyt_fen = { net: +(netOku('fizik') + netOku('kimya') + netOku('biyoloji')).toFixed(2) };
            subjects.tyt_sosyal = { net: +(netOku('tarih') + netOku('cografya') + netOku('felsefe') + netOku('din')).toFixed(2) };
            v2Sonuclar.push({
                id: `demo_v2_${s.id}_${t}`,
                studentId: s.id, student: s.name, number: s.schoolNumber,
                trialId: `demo_trial_TYT_${t + 1}`,
                examName: `TYT Deneme ${t + 1}`, examType: 'TYT',
                date: tarih, examDate: tarih, createdAt: olusturma,
                totalNet: toplamNet, subjects,
            });
            denemeAnalizleri.push({
                id: `demo_da_${s.id}_${t}`,
                studentId: s.id, studentName: s.name,
                ad: `TYT Deneme ${t + 1}`, tur: 'TYT', alan: null,
                tarih, sureDk: 135, dersler, konuHatalari,
                degerlendirme: '', olusturma,
            });
        }
    });

    const AYT_DERSLER = [
        { ad: 'Matematik', key: 'mat', soru: 40, off: -0.05 },
        { ad: 'Fizik', key: 'fizik', soru: 14, off: -0.08 },
        { ad: 'Kimya', key: 'kimya', soru: 13, off: -0.04 },
        { ad: 'Biyoloji', key: 'biyoloji', soru: 13, off: 0.02 },
    ];
    ogrenciler.forEach((s, i) => {
        for (let t = 0; t < 3; t += 1) {
            const gunOnce = 24 - t * 9;
            const tarih = bugun(-gunOnce);
            const olusturma = new Date(Date.now() - 86400000 * gunOnce).toISOString();
            const taban = sinirla(0.4 + 0.05 * i + 0.07 * t);
            const subjects = {};
            let toplamNet = 0;
            AYT_DERSLER.forEach((d) => {
                const oran = sinirla(taban + d.off);
                const dogru = Math.round(d.soru * oran);
                const yanlis = Math.round(0.4 * (d.soru - dogru));
                const net = +(dogru - yanlis / 4).toFixed(2);
                toplamNet += net;
                subjects[d.key] = { d: dogru, y: yanlis, net };
            });
            toplamNet = +toplamNet.toFixed(2);
            subjects.ayt_mat = { net: subjects.mat?.net || 0 };
            subjects.ayt_fen = { net: +((subjects.fizik?.net || 0) + (subjects.kimya?.net || 0) + (subjects.biyoloji?.net || 0)).toFixed(2) };
            v2Sonuclar.push({
                id: `demo_v2ayt_${s.id}_${t}`,
                studentId: s.id, student: s.name, number: s.schoolNumber,
                trialId: `demo_trial_AYT_${t + 1}`,
                examName: `AYT Deneme ${t + 1}`, examType: 'AYT',
                date: tarih, examDate: tarih, createdAt: olusturma,
                totalNet: toplamNet, subjects,
            });
        }
    });

    /* ── Günlük çalışma kayıtları (study_log) ── */
    const studyLog = [];
    ogrenciler.forEach((s, i) => {
        for (let g = 0; g < 12; g += 1) {
            if ((g + i) % 3 === 0) continue; // bazı günler kayıt yok — ısı haritası gerçekçi
            const ders = TYT_DERSLER[(g + i) % 4];
            const soru = 20 + ((i * 7 + g * 5) % 40);
            const dogru = Math.round(soru * (0.55 + ((i + g) % 4) * 0.07));
            const yanlis = Math.round(0.6 * (soru - dogru));
            const bos = Math.max(0, soru - dogru - yanlis);
            studyLog.push({
                id: `demo_sl_${s.id}_${g}`,
                studentId: s.id,
                date: bugun(-g),
                kind: 'soru',
                subject: ders.ad,
                topic: KONULAR[ders.ad] || '',
                questions: soru, correct: dogru, wrong: yanlis, blank: bos,
                minutes: 30 + ((i * 11 + g * 13) % 90),
                note: '',
                createdAt: new Date(Date.now() - 86400000 * g).toISOString(),
            });
        }
    });

    /* ── Hata defteri ── */
    const HATA_TURLERI = ['knowledge', 'careless', 'interpretation', 'time', 'calculation'];
    const HATA_NOTLARI = [
        'Konuyu tam bilmiyordum.', 'Biliyordum ama yanlış işaretledim.',
        'Soruyu yanlış anladım.', 'Süre yetmedi, boş bıraktım.', 'İşlemde hata yaptım.',
    ];
    const errorNotebook = [];
    ogrenciler.forEach((s, i) => {
        const adet = 4 + (i % 4);
        for (let h = 0; h < adet; h += 1) {
            const ders = TYT_DERSLER[(h + i) % 4];
            const gunOnce = (h * 2 + i) % 14;
            errorNotebook.push({
                id: `demo_err_${s.id}_${h}`,
                studentId: s.id,
                subject: ders.ad,
                topic: KONULAR[ders.ad] || `${ders.ad} konu ${h + 1}`,
                errorType: HATA_TURLERI[(h + i) % HATA_TURLERI.length],
                mastered: h % 3 === 0,
                note: HATA_NOTLARI[(h + i) % HATA_NOTLARI.length],
                correctApproach: '',
                createdAt: new Date(Date.now() - 86400000 * gunOnce).toISOString(),
            });
        }
    });

    /* ── Haftalık öz değerlendirme ── */
    const OZ_NOTLAR = [
        'Bu hafta düzenli çalıştım.', 'Motivasyonum düşüktü ama toparladım.',
        'Deneme netlerim yükseldi.', 'Matematik konularında zorlandım.',
        'Programa büyük ölçüde uydum.',
    ];
    const selfAssessments = [];
    ogrenciler.forEach((s, i) => {
        for (let h = 0; h < 2; h += 1) {
            const tarih = new Date(Date.now() - 7 * h * 86400000);
            const haftaNo = Math.ceil(tarih.getDate() / 7);
            const hafta = `self_assessment_${tarih.getFullYear()}_${tarih.getMonth()}_w${haftaNo}`;
            const puan = 3 + ((i + (1 - h)) % 3);
            selfAssessments.push({
                userId: s.id, userName: s.name,
                scores: {
                    motivation: Math.min(5, puan),
                    study: Math.min(5, Math.max(2, puan)),
                    understand: Math.min(5, 3 + (i % 3)),
                    stress: 2 + ((i + h) % 3),
                    confidence: Math.min(5, 3 + ((i + 1) % 3)),
                },
                note: OZ_NOTLAR[(i + h) % OZ_NOTLAR.length],
                week: hafta,
                submittedAt: tarih.toISOString(),
            });
        }
    });

    /* ── Pomodoro geçmişi ── */
    const pomodoroLoglari = {};
    ogrenciler.forEach((s, i) => {
        const kayitlar = [];
        const adet = 4 + (i % 5);
        for (let p = 0; p < adet; p += 1) {
            const gun = p % 7;
            kayitlar.push({
                startedAt: new Date(Date.now() - 86400000 * gun - 3600000 * p).toISOString(),
                subject: TYT_DERSLER[(p + i) % 4].ad,
                minutes: 25,
            });
        }
        pomodoroLoglari[s.id] = kayitlar;
    });

    /* ── Haftalık program + ilerleme ── */
    const GUNLER = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    const PROGRAM_DERSLERI = [
        { ad: 'Matematik', renk: 'bg-brand-soft' }, { ad: 'Türkçe', renk: 'bg-ok-soft' },
        { ad: 'Fizik', renk: 'bg-warn-soft' }, { ad: 'Kimya', renk: 'bg-info-soft' },
        { ad: 'Biyoloji', renk: 'bg-ok-soft' }, { ad: 'Tarih', renk: 'bg-danger-soft' },
        { ad: 'Coğrafya', renk: 'bg-brand-soft' }, { ad: 'Geometri', renk: 'bg-info-soft' },
    ];
    const UYUM_ORANLARI = [0.9, 0.75, 0.6, 0.5, 0.4, 0.3];
    const programlar = {};
    const programIlerlemeleri = {};
    const programMetalar = {};
    ogrenciler.forEach((s, i) => {
        const schedule = {};
        const ilerleme = {};
        const uyum = UYUM_ORANLARI[i % UYUM_ORANLARI.length];
        let sira = 0;
        GUNLER.forEach((gun, gi) => {
            const slot = gi < 5 ? 5 : 3;
            for (let e = 0; e < slot; e += 1) {
                const ders = PROGRAM_DERSLERI[(sira + i) % PROGRAM_DERSLERI.length];
                const hucre = `m1-w1-${gun}-${e}`;
                schedule[hucre] = { type: 'konu', subject: ders.ad, topic: `${ders.ad} — Konu ${e + 1}`, color: ders.renk };
                const zar = ((sira * 3 + i * 2) % 10) / 10;
                ilerleme[hucre] = {
                    status: zar < uyum ? 'done' : zar < uyum + 0.3 ? 'missed' : 'pending',
                    at: bugun(-(7 - gi)),
                };
                sira += 1;
            }
        });
        programlar[s.id] = schedule;
        programIlerlemeleri[s.id] = ilerleme;
        programMetalar[s.id] = { programDurationMonths: 1, dailySlotCount: 6, title: `${s.name} Haftalık Program` };
    });

    /* ── Uygulama içi deneme motoru: kaynaklar + atamalar ── */
    const anahtardanSorular = (dersDizileri) => {
        const sorular = [];
        dersDizileri.forEach(([ders, dizi]) => {
            String(dizi).replace(/[^A-E]/g, '').split('').forEach((harf) => {
                sorular.push({
                    id: `s${sorular.length + 1}`,
                    ders,
                    no: sorular.filter(x => x.ders === ders).length + 1,
                    dogru: harf,
                });
            });
        });
        return sorular;
    };
    const denemeMotorKaynaklari = [
        {
            id: 'dk_demo_tyt1', ad: 'Uygulama İçi TYT Deneme', tur: 'TYT', alan: null,
            olusturanId: 'demo_coach', olusturanAd: 'Demo Koç', sureDk: 135,
            sorular: anahtardanSorular([
                ['Türkçe', 'ABCDEABCDE'], ['Matematik', 'CDBAECDBAE'], ['Fen', 'ABCDE'], ['Sosyal', 'EDCBA'],
            ]),
            otomatikPuan: true,
            pdfAd: null, pdfData: null, pdfCevapAd: null, pdfCevapData: null,
            createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        },
        {
            id: 'dk_demo_ayt1', ad: 'Uygulama İçi AYT Sayısal', tur: 'AYT', alan: null,
            olusturanId: 'demo_coach', olusturanAd: 'Demo Koç', sureDk: 180,
            sorular: anahtardanSorular([['Matematik', 'ABCDEABCDE'], ['Fizik', 'CDBAE']]),
            otomatikPuan: true,
            pdfAd: null, pdfData: null, pdfCevapAd: null, pdfCevapData: null,
            createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
    ];
    denemeMotorKaynaklari.forEach((k) => { k.toplamSoru = k.sorular.length; });

    const denemeMotorAtamalari = [
        {
            id: 'at_demo_1', kaynakId: 'dk_demo_tyt1',
            studentIds: ['demo_ogr_1', 'demo_ogr_2', 'demo_ogr_3'],
            atayanId: 'demo_coach', atayanAd: 'Demo Koç',
            acilisTarihi: bugun(0), sonTarih: null,
            createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
        {
            id: 'at_demo_2', kaynakId: 'dk_demo_ayt1',
            studentIds: ['demo_ogr_1'],
            atayanId: 'demo_coach', atayanAd: 'Demo Koç',
            acilisTarihi: bugun(3), sonTarih: null,
            createdAt: new Date().toISOString(),
        },
    ];

    /* ── Elif'in ÇÖZÜLMÜŞ uygulama içi denemeleri (istatistikli) ──
       Çözüm Davranışı panellerinin (koç + öğrenci) boş görünmemesi için:
       süre/soru, cevap değişimi, en uzun soru, konu kırılımı dolu. */
    {
        const elif = ogrenciler.find(o => o.id === 'demo_ogr_1') || ogrenciler[0];
        const dersAnahtar = {
            'Türkçe': 'turkce', Matematik: 'mat', Fizik: 'fizik', Kimya: 'kimya',
            Biyoloji: 'biyoloji', Tarih: 'tarih', 'Coğrafya': 'cografya',
            Felsefe: 'felsefe', 'Din K.': 'din',
        };
        for (let t = 0; t < 3; t += 1) {
            const kalanYanlisCarpani = 3 - t;
            const dersler = {
                'Türkçe': { dogru: 12 + t, yanlis: Math.max(1, 5 - t), bos: 2, net: +(12 + t - Math.max(1, 5 - t) / 4).toFixed(2) },
                Matematik: { dogru: 7 + t, yanlis: Math.max(1, 4 - t), bos: 3, net: +(7 + t - Math.max(1, 4 - t) / 4).toFixed(2) },
                Fizik: { dogru: 4 + (t > 1 ? 1 : 0), yanlis: kalanYanlisCarpani > 2 ? 2 : 1, bos: 1, net: +(4 + (t > 1 ? 1 : 0) - (kalanYanlisCarpani > 2 ? 2 : 1) / 4).toFixed(2) },
                Kimya: { dogru: 3 + t, yanlis: Math.max(0, 2 - t), bos: 1, net: +(3 + t - Math.max(0, 2 - t) / 4).toFixed(2) },
                Biyoloji: { dogru: 4 + (t > 0 ? 1 : 0), yanlis: 1, bos: 0, net: +(4 + (t > 0 ? 1 : 0) - 0.25).toFixed(2) },
                Tarih: { dogru: 3 + t, yanlis: Math.max(0, 2 - t), bos: 0, net: +(3 + t - Math.max(0, 2 - t) / 4).toFixed(2) },
                'Coğrafya': { dogru: 3, yanlis: 1, bos: 1, net: 2.75 },
                Felsefe: { dogru: 3, yanlis: Math.max(1, 2 - t), bos: 0, net: +(3 - Math.max(1, 2 - t) / 4).toFixed(2) },
                'Din K.': { dogru: 4, yanlis: 1, bos: 0, net: 3.75 },
            };
            const dersSureMs = {
                turkce: 450000 - 30000 * t, mat: 630000 - 40000 * t,
                fizik: 216000 - 12000 * t, kimya: 270000 - 15000 * t,
                biyoloji: 180000, tarih: 162000, cografya: 144000,
                felsefe: 153000, din: 108000,
            };
            const yanlisSorular = [];
            let soruNo = 1;
            Object.entries(dersler).forEach(([dersAdi, v]) => {
                for (let y = 0; y < v.yanlis; y += 1) {
                    yanlisSorular.push({
                        no: soruNo,
                        ders: dersAnahtar[dersAdi],
                        verilen: 'ABCDE'[(soruNo + y) % 5],
                        dogru: 'ABCDE'[(soruNo + y + 2) % 5],
                    });
                    soruNo += 1;
                }
            });
            const toplamSureMs = Object.values(dersSureMs).reduce((a, b) => a + b, 0);
            const konular = [
                { ders: 'turkce', konu: 'Sözcükte Anlam', d: 5, y: 2 },
                { ders: 'turkce', konu: 'Paragraf', d: 7, y: 3 },
                { ders: 'mat', konu: 'Türev', d: 3, y: 2 },
                { ders: 'mat', konu: 'Limit', d: 4, y: 2 },
                { ders: 'fizik', konu: 'Kuvvet ve Hareket', d: 4, y: 1 },
                { ders: 'kimya', konu: 'Asit-Baz', d: 3, y: 2 },
                { ders: 'biyoloji', konu: 'Hücre Bölünmesi', d: 5, y: 1 },
                { ders: 'tarih', konu: 'İnkılap Tarihi', d: 3, y: 1 },
            ].map((k, n) => {
                const yanlis = Math.max(0, k.y - t);
                const dogru = k.d + (t > 0 ? 1 : 0);
                const sureMs = 140000 - 12000 * t + 8000 * n;
                return {
                    ders: k.ders, konu: k.konu, dogru, yanlis, bos: 1,
                    net: +(dogru - yanlis / 4).toFixed(2),
                    sureMs, sureDk: +(sureMs / 60000).toFixed(1),
                };
            });
            const konuHatalari = konular.filter(k => k.yanlis > 0)
                .map(k => ({ ders: k.ders, konu: k.konu, adet: k.yanlis, nedenler: [], not: '' }));
            const gunOnce = 18 - 8 * t;
            denemeAnalizleri.push({
                id: `demo_da_motor_elif_${t + 1}`,
                studentId: elif.id, studentName: elif.name,
                ad: `Uygulama İçi TYT Deneme ${t + 1}`, tur: 'TYT', alan: null,
                tarih: bugun(-gunOnce),
                sureDk: Math.round(toplamSureMs / 60000),
                dersler, konuHatalari,
                degerlendirme: {
                    kaynak: 'uygulama-ici-deneme',
                    motorOturumId: `demo_oturum_elif_${t + 1}`,
                    istatistik: {
                        ilkDers: ['Türkçe', 'Matematik', 'Türkçe'][t],
                        toplamSureMs,
                        toplamSureDk: +(toplamSureMs / 60000).toFixed(1),
                        ortSoruSaniye: +(toplamSureMs / 30 / 1000).toFixed(1),
                        dersSureMs,
                        enUzunSoru: { no: 12 - t, ders: t === 1 ? 'Fizik' : 'Matematik', ms: 168000 - 18000 * t },
                        toplamDegisim: 13 - 3 * t,
                        yanlisSorular,
                        konular,
                    },
                },
                olusturma: new Date(Date.now() - 86400000 * gunOnce).toISOString(),
            });
        }
    }

    return {
        ogrenciler, denemeler, gorevler,
        v2Sonuclar, denemeAnalizleri, studyLog,
        programlar, programIlerlemeleri, programMetalar,
        denemeTanimlari, denemeMotorKaynaklari, denemeMotorAtamalari,
        errorNotebook, selfAssessments, pomodoroLoglari,
    };
};

// ══════════════════════════════════════════════════════════════
//  GİRİŞ / ÇIKIŞ
// ══════════════════════════════════════════════════════════════

export const DEMO_KULLANICI = {
    coach: {
        id: 'demo_coach', uid: 'demo_coach',
        name: 'Demo Koç', role: 'coach', coachRole: 'masterCoach',
        sections: ['kocluk'],
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

        const {
            ogrenciler, denemeler, gorevler,
            v2Sonuclar, denemeAnalizleri, studyLog,
            programlar, programIlerlemeleri, programMetalar,
            denemeTanimlari, denemeMotorKaynaklari, denemeMotorAtamalari,
            errorNotebook, selfAssessments, pomodoroLoglari,
        } = demoVerisiUret();

        localStorage.setItem('coach_students', JSON.stringify(ogrenciler));
        localStorage.setItem('exam_results', JSON.stringify(denemeler));
        localStorage.setItem('v2_results_data', JSON.stringify(v2Sonuclar));
        localStorage.setItem('v2_trials_data', JSON.stringify(denemeTanimlari));
        localStorage.setItem('deneme_analizleri', JSON.stringify(denemeAnalizleri));
        localStorage.setItem('study_log', JSON.stringify(studyLog));
        localStorage.setItem('error_notebook', JSON.stringify(errorNotebook));
        localStorage.setItem('all_self_assessments', JSON.stringify(selfAssessments));
        Object.entries(pomodoroLoglari).forEach(([sid, kayitlar]) =>
            localStorage.setItem(`pomodoro_log_${sid}`, JSON.stringify(kayitlar)));
        Object.entries(programlar).forEach(([sid, schedule]) =>
            localStorage.setItem(`program_schedule_${sid}`, JSON.stringify(schedule)));
        Object.entries(programMetalar).forEach(([sid, meta]) =>
            localStorage.setItem(`program_meta_${sid}`, JSON.stringify(meta)));
        localStorage.setItem('program_progress', JSON.stringify(programIlerlemeleri));
        localStorage.setItem('deneme_kaynaklari', JSON.stringify(denemeMotorKaynaklari));
        localStorage.setItem('deneme_atamalari', JSON.stringify(denemeMotorAtamalari));
        localStorage.setItem('deneme_oturumlari', JSON.stringify([]));
        localStorage.setItem('student_tasks', JSON.stringify(gorevler));
        localStorage.setItem('managed_coaches', JSON.stringify([]));
        localStorage.setItem('coach_tasks', JSON.stringify([]));
        localStorage.setItem('student_groups', JSON.stringify([]));
        localStorage.setItem('coach_subscriptions', JSON.stringify({
            demo_coach: {
                planId: 'koc20', baslangic: bugun(), bitis: bugun(30),
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
