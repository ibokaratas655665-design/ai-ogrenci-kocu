/**
 * 📁 REHBERLİK SERVİSİ DESİMAL DOSYA PLANI
 *
 * MEB Rehberlik ve Psikolojik Danışma Hizmetleri Yönetmeliği gereği okul
 * rehberlik servisi, evrakını Standart Dosya Planı (desimal sistem) düzeninde
 * tutmak zorundadır. Müfettiş denetiminde arşiv düzeni bu plana göre kontrol
 * edilir.
 *
 * Aşağıdaki 10 dosyalık düzen, rehberlik servisinin fiilen tutması gereken
 * resmî dosya listesidir. Dosya adları ve açıklamaları bu listeden alınmıştır.
 *
 * Her klasörde:
 *   no             → dosya sırası (klasör sırtlığında yazan)
 *   ad             → dosya adı
 *   aciklama       → dosyanın resmî tanımı: içine ne konur
 *   belgeler       → o dosyada bulunması BEKLENEN evrak (eksik denetimi için)
 *   kaynak         → uygulamada bu belgeyi üreten modül (otomatik bağlanır)
 *   zorunlu        → denetimde aranan, eksikse uyarı verilir
 *   donem          → 'yillik' (her yıl yenilenir) | 'surekli' (biriken arşiv)
 *   gizli          → mesleki gizlilik kapsamında; PDF'e gizlilik ibaresi basılır
 *   eRehberlik     → 'ciktiGerekli' (imza için çıktı şart) |
 *                    'ciktiGerekmez' (sistemde üretilir, dosyalamaya gerek yok)
 *   ileGoreDegisir → içerik il rehberlik danışma komisyonu kararına bağlı
 *   sinifBazli     → her şube için ayrı bölüm tutulur
 *   ogrenciBazli   → her öğrenci için ayrı bölüm tutulur
 */

/**
 * ══════════════════════════════════════════════════════════════
 *  EĞİTİM KADEMELERİ
 *
 *  Rehberlik çalışmaları kademeye göre değişir: okul öncesinde gelişim
 *  gözlemi ve okula uyum, ilkokulda oryantasyon ve okuma-yazma izleme,
 *  ortaokulda LGS ve ergenlik, lisede YKS ve meslek seçimi öne çıkar.
 *  Desimal klasörlerin adı aynı kalır; İÇİNDEKİ belgeler kademeye göre
 *  farklılaşır. `kademe` alanı olmayan belge her kademede geçerlidir.
 * ══════════════════════════════════════════════════════════════
 */
export const KADEMELER = {
    anasinifi: {
        id: 'anasinifi',
        ad: 'Anasınıfı / Okul Öncesi',
        kisa: 'Anasınıfı',
        icon: '🧸',
        siniflar: ['Ana', '1. Yaş Grubu', '2. Yaş Grubu'],
        odak: 'Okula uyum, gelişim gözlemi, aile katılımı',
    },
    ilkokul: {
        id: 'ilkokul',
        ad: 'İlkokul',
        kisa: 'İlkokul',
        icon: '✏️',
        siniflar: ['1', '2', '3', '4'],
        odak: 'Oryantasyon, okuma-yazma izleme, sosyal beceri',
    },
    ortaokul: {
        id: 'ortaokul',
        ad: 'Ortaokul',
        kisa: 'Ortaokul',
        icon: '📗',
        siniflar: ['5', '6', '7', '8'],
        odak: 'LGS süreci, ergenlik, yöneltme',
    },
    lise: {
        id: 'lise',
        ad: 'Lise',
        kisa: 'Lise',
        icon: '🎓',
        siniflar: ['9', '10', '11', '12'],
        odak: 'YKS süreci, meslek seçimi, kariyer planlama',
    },
};

export const KADEME_LISTESI = Object.values(KADEMELER);

/** Kurum türünden kademeyi çıkarır (Ayarlar → Kurum Bilgileri). */
export const kurumTurundenKademe = (okulTuru = '') => {
    const t = String(okulTuru).toLocaleLowerCase('tr-TR');
    // 'ana' geçen her şeyi okul öncesi saymak yanlış: "Anadolu Lisesi"
    // de 'ana' içeriyor. Bu yüzden tam terimler aranır.
    if (/anaokul|ana ?sınıf|anasınıf|okul öncesi|kreş|gündüz bakım/.test(t)) return 'anasinifi';
    if (t.includes('ortaokul') || t.includes('imam hatip ortaokulu')) return 'ortaokul';
    if (t.includes('ilkokul')) return 'ilkokul';
    return 'lise';
};

/** Sınıf düzeyinden kademe. */
export const siniftanKademe = (sinif) => {
    const n = parseInt(String(sinif).replace(/\D/g, ''), 10);
    if (!Number.isFinite(n)) return 'anasinifi';
    if (n <= 4) return 'ilkokul';
    if (n <= 8) return 'ortaokul';
    return 'lise';
};

/**
 * ══════════════════════════════════════════════════════════════
 *  RESMÎ REHBERLİK SERVİSİ DOSYA DÜZENİ — 10 DOSYA
 *
 *  Aşağıdaki liste, okul rehberlik servisinin fiilen tutmak zorunda
 *  olduğu dosyaların resmî tanımıdır. Her dosyanın `aciklama` alanı
 *  o dosyanın ne için tutulduğunu, `belgeler` alanı içinde bulunması
 *  gereken evrakı verir.
 *
 *  e-Rehberlik notu: Okul RPD Programı ve yıl sonu faaliyet raporu
 *  e-Rehberlik sisteminde üretilir. Programın ÇIKTISI komisyon
 *  imzaları için gereklidir; yıl sonu raporunun çıktısı gerekmez.
 *  Sınıf rehberlik planları ve sınıf faaliyet raporları henüz
 *  e-Rehberlik'te olmadığı için elle dosyalanır. Bu ayrım aşağıda
 *  `eRehberlik` alanıyla işaretlidir ve arayüzde uyarı olarak çıkar.
 * ══════════════════════════════════════════════════════════════
 */
export const DESIMAL_PLAN = [

    // ══════════════════════════════════════════════════════════
    {
        no: '1',
        ad: 'Plan-Program Dosyası',
        icon: '🗂️',
        renk: 'var(--c1)',
        donem: 'yillik',
        aciklama:
            'Okul RPD Programı ve sınıf rehberlik planlarının yer aldığı dosyadır. ' +
            'Okul RPD Programı e-Rehberlik üzerinde kayıtlı olsa da RPD Hizmetleri ' +
            'Yürütme Komisyonu üyeleri tarafından imzalanması gerektiği için çıktı ' +
            'alınır, imzalar tamamlanır ve dosyalanır.',
        eRehberlik: 'ciktiGerekli',
        belgeler: [
            {
                ad: 'Okul RPD Programı (imzalı çıktı)',
                zorunlu: true, kaynak: 'plan',
                not: 'e-Rehberlik\'ten çıktı alınır, Yürütme Komisyonu üyelerince imzalanır.',
            },
            { ad: 'RPD Hizmetleri Yürütme Komisyonu üye listesi', zorunlu: true, kaynak: 'tutanak' },
            { ad: 'Sınıf rehberlik planları (tüm şubeler)', zorunlu: true, kaynak: 'plan' },
            { ad: 'Rehberlik servisi haftalık çalışma programı', zorunlu: true, kaynak: 'plan' },
            { ad: 'Sınıf rehber öğretmenleri görevlendirme listesi', zorunlu: false, kaynak: 'evrak' },

            // Kademeye özgü planlar
            { ad: 'Okula uyum (oryantasyon) programı', zorunlu: true, kaynak: 'plan', kademe: ['anasinifi', 'ilkokul'] },
            { ad: 'Gelişimsel destek etkinlik planı', zorunlu: false, kaynak: 'plan', kademe: ['anasinifi'] },
            { ad: 'LGS bilgilendirme ve yöneltme planı', zorunlu: true, kaynak: 'plan', kademe: ['ortaokul'] },
            { ad: 'YKS bilgilendirme ve tercih danışmanlığı planı', zorunlu: true, kaynak: 'plan', kademe: ['lise'] },
            { ad: 'Mesleki rehberlik yıllık plan', zorunlu: false, kaynak: 'plan', kademe: ['ortaokul', 'lise'] },
        ],
    },

    // ══════════════════════════════════════════════════════════
    {
        no: '2',
        ad: 'Yıl Sonu Raporları Dosyası',
        icon: '📈',
        renk: 'var(--c2)',
        donem: 'yillik',
        aciklama:
            'e-Rehberlik öncesinde RPD hizmetleri faaliyet raporunun konulduğu dosyadır. ' +
            'Artık yıl sonu faaliyet raporu e-Rehberlik\'te oluşturulduğu için çıktı ' +
            'alınarak dosyalanmasına gerek yoktur. Ancak sınıf rehberlik planları ve ' +
            'raporlamaları henüz e-Rehberlik\'te olmadığı için dönem sonu ve yıl sonunda ' +
            'sınıf rehber öğretmenlerince hazırlanan faaliyet raporları bu dosyaya eklenmelidir.',
        eRehberlik: 'ciktiGerekmez',
        belgeler: [
            {
                ad: 'Sınıf rehberlik faaliyet raporu — I. Dönem',
                zorunlu: true, kaynak: 'rapor',
                not: 'Sınıf rehber öğretmenlerince hazırlanır; e-Rehberlik kapsamında değildir.',
            },
            {
                ad: 'Sınıf rehberlik faaliyet raporu — II. Dönem',
                zorunlu: true, kaynak: 'rapor',
                not: 'Sınıf rehber öğretmenlerince hazırlanır; e-Rehberlik kapsamında değildir.',
            },
            {
                ad: 'RPD hizmetleri yıl sonu faaliyet raporu',
                zorunlu: false, kaynak: 'rapor',
                not: 'e-Rehberlik\'te üretilir — çıktı alıp dosyalamak ZORUNLU DEĞİLDİR.',
            },
            { ad: 'Grup rehberliği çalışmaları değerlendirme raporu', zorunlu: false, kaynak: 'rapor' },
        ],
    },

    // ══════════════════════════════════════════════════════════
    {
        no: '3',
        ad: 'Eylem Planları Dosyası',
        icon: '🎯',
        renk: 'var(--c3)',
        donem: 'yillik',
        aciklama:
            'Bağımlılıkla mücadele, şiddet eylem planı vb. il danışma komisyonları ' +
            'tarafından okullarda uygulanması planlanan ve çalışması yürütülecek olan ' +
            'çalışmalara ait planların bulunduğu dosyadır. Bu çalışmalar her ilde il ' +
            'rehberlik danışma komisyonlarınca belirlenir ve okullara millî eğitim ' +
            'müdürlükleri aracılığıyla duyurulur. Her ilde yapılmayabilir ya da iller ' +
            'arasında çalışılan konu farklılık gösterebilir.',
        ileGoreDegisir: true,
        belgeler: [
            {
                ad: 'İl rehberlik danışma komisyonu kararı / duyuru yazısı',
                zorunlu: true, kaynak: 'evrak',
                not: 'Hangi eylem planlarının yürütüleceğini bu yazı belirler.',
            },
            { ad: 'Bağımlılıkla mücadele eylem planı ve uygulama raporu', zorunlu: false, kaynak: 'plan' },
            { ad: 'Şiddetin önlenmesi eylem planı ve uygulama raporu', zorunlu: false, kaynak: 'plan' },
            { ad: 'Psikososyal koruma ve krize müdahale eylem planı', zorunlu: false, kaynak: 'plan' },
            { ad: 'Okul güvenliği / akran zorbalığı çalışma planı', zorunlu: false, kaynak: 'plan' },
            { ad: 'Eylem planı kapsamında yapılan etkinlik tutanak ve fotoğrafları', zorunlu: false, kaynak: 'rapor' },
            { ad: 'Ekran bağımlılığı ve güvenli internet farkındalık çalışması', zorunlu: false, kaynak: 'plan', kademe: ['ilkokul', 'ortaokul', 'lise'] },
        ],
    },

    // ══════════════════════════════════════════════════════════
    {
        no: '4',
        ad: 'Gelen-Giden Evrak Dosyası',
        icon: '📨',
        renk: 'var(--c4)',
        donem: 'surekli',
        aciklama:
            'Okul idaresi ya da okul içerisindeki kurul/komisyonlar tarafından size ' +
            'tebliğ edilen ve sizin okul idaresi ya da okuldaki kurul/komisyonlara ' +
            'gönderdiğiniz yazıları muhafaza etmeniz gereken dosyadır.',
        belgeler: [
            { ad: 'Gelen evrak kayıt defteri / listesi', zorunlu: true, kaynak: 'evrak' },
            { ad: 'Giden evrak kayıt defteri / listesi', zorunlu: true, kaynak: 'evrak' },
            { ad: 'Okul idaresinden tebliğ edilen yazılar', zorunlu: false, kaynak: 'evrak' },
            { ad: 'İlçe/İl MEM ve RAM yazışmaları', zorunlu: false, kaynak: 'evrak' },
            { ad: 'Kurul ve komisyonlara gönderilen yazılar', zorunlu: false, kaynak: 'evrak' },
        ],
    },

    // ══════════════════════════════════════════════════════════
    {
        no: '5',
        ad: 'Komisyon Tutanakları Dosyası',
        icon: '📝',
        renk: 'var(--c5)',
        donem: 'yillik',
        aciklama:
            'Bu dosya içerisinde "Rehberlik ve Psikolojik Danışma Hizmetleri Yürütme ' +
            'Komisyonu" ve okulunuzda varsa RPD hizmetlerine yönelik diğer dâhil ' +
            'olduğunuz komisyonlara ilişkin toplantı tutanakları yer alır.',
        belgeler: [
            { ad: 'RPD Hizmetleri Yürütme Komisyonu I. toplantı tutanağı (yıl başı)', zorunlu: true, kaynak: 'tutanak' },
            { ad: 'RPD Hizmetleri Yürütme Komisyonu II. toplantı tutanağı (I. dönem sonu)', zorunlu: true, kaynak: 'tutanak' },
            { ad: 'RPD Hizmetleri Yürütme Komisyonu III. toplantı tutanağı (yıl sonu)', zorunlu: true, kaynak: 'tutanak' },
            { ad: 'Komisyon üye görevlendirme onayı', zorunlu: true, kaynak: 'evrak' },
            { ad: 'Okul gelişim yönetim ekibi (OGYE) toplantı tutanakları', zorunlu: false, kaynak: 'tutanak' },
            { ad: 'Sosyal etkinlikler kurulu tutanakları', zorunlu: false, kaynak: 'tutanak' },
            { ad: 'BEP geliştirme birimi toplantı tutanakları', zorunlu: false, kaynak: 'bep' },
            { ad: 'Öğrenci davranışlarını değerlendirme kurulu tutanakları', zorunlu: false, kaynak: 'tutanak', kademe: ['ortaokul', 'lise'] },
        ],
    },

    // ══════════════════════════════════════════════════════════
    {
        no: '6',
        ad: 'Görüşme Dosyası',
        icon: '💬',
        renk: 'var(--brand)',
        donem: 'surekli',
        gizli: true,
        aciklama:
            'Öğrenciler ve veliler ile yapılan bireysel görüşmeler sonrası doldurulan ' +
            'görüşme formlarının bulunduğu dosyadır.',
        belgeler: [
            { ad: 'Öğrenci görüşme formları', zorunlu: true, kaynak: 'gorusme' },
            { ad: 'Veli görüşme formları', zorunlu: true, kaynak: 'gorusme' },
            { ad: 'Öğretmen görüşme formları', zorunlu: false, kaynak: 'gorusme' },
            { ad: 'Görüşme randevu ve takip çizelgesi', zorunlu: false, kaynak: 'gorusme' },
            { ad: 'RAM / hastane yönlendirme yazıları', zorunlu: false, kaynak: 'evrak' },
            { ad: 'Veli bilgilendirme ve onam formları', zorunlu: false, kaynak: 'onam' },
        ],
    },

    // ══════════════════════════════════════════════════════════
    {
        no: '7',
        ad: 'Sınıf Dosyası',
        icon: '🏫',
        renk: 'var(--accent)',
        donem: 'yillik',
        sinifBazli: true,
        aciklama:
            'Her sınıfa ait RPD Servisi tarafından yapılan çalışmaların muhafaza ' +
            'edildiği dosyadır.',
        belgeler: [
            { ad: 'Sınıf öğrenci listesi', zorunlu: true, kaynak: 'evrak' },
            { ad: 'Sınıfa uygulanan grup rehberliği etkinlikleri', zorunlu: true, kaynak: 'plan' },
            { ad: 'Sınıfa uygulanan envanter/ölçek sonuç raporları', zorunlu: true, kaynak: 'test' },
            { ad: 'Öğrenci tanıma formları', zorunlu: true, kaynak: 'test' },
            { ad: 'Sosyometri uygulaması ve sonuç şeması', zorunlu: false, kaynak: 'test' },
            { ad: 'Sınıf rehber öğretmeni görüşme notları', zorunlu: false, kaynak: 'gorusme' },

            // Kademeye özgü sınıf çalışmaları
            { ad: 'Gelişim gözlem formu', zorunlu: true, kaynak: 'test', kademe: ['anasinifi'] },
            { ad: 'Okula uyum etkinlik kayıtları', zorunlu: true, kaynak: 'plan', kademe: ['anasinifi', 'ilkokul'] },
            { ad: 'Okuma-yazma ve akademik izleme kayıtları', zorunlu: false, kaynak: 'rapor', kademe: ['ilkokul'] },
            { ad: 'LGS deneme takip ve tercih çalışmaları', zorunlu: true, kaynak: 'plan', kademe: ['ortaokul'] },
            { ad: 'Ergenlik ve akran ilişkileri grup çalışması', zorunlu: false, kaynak: 'plan', kademe: ['ortaokul'] },
            { ad: 'YKS deneme takip ve tercih danışmanlığı kayıtları', zorunlu: true, kaynak: 'plan', kademe: ['lise'] },
            { ad: 'Alan/ders seçimi yöneltme çalışmaları', zorunlu: true, kaynak: 'plan', kademe: ['lise'] },
        ],
    },

    // ══════════════════════════════════════════════════════════
    {
        no: '8',
        ad: 'Okul / Sınıf Risk Haritaları Dosyası',
        icon: '🗺️',
        renk: 'var(--warn)',
        donem: 'yillik',
        gizli: true,
        aciklama:
            'Sınıf öğretmenlerince hazırlanan sınıf risk haritaları ve psikolojik ' +
            'danışman/rehber öğretmen tarafından hazırlanan okul risk haritalarının ' +
            'bulunması gereken dosyadır.',
        belgeler: [
            { ad: 'Okul risk haritası', zorunlu: true, kaynak: 'risk', not: 'Psikolojik danışman/rehber öğretmen hazırlar.' },
            { ad: 'Sınıf risk haritaları (tüm şubeler)', zorunlu: true, kaynak: 'risk', not: 'Sınıf öğretmenlerince hazırlanır.' },
            { ad: 'Risk grubu öğrenci izleme çizelgesi', zorunlu: false, kaynak: 'risk' },
            { ad: 'Alınan tedbir ve müdahale kayıtları', zorunlu: false, kaynak: 'risk' },
            { ad: 'Psikososyal müdahale ekibi çalışma kaydı', zorunlu: false, kaynak: 'risk' },
        ],
    },

    // ══════════════════════════════════════════════════════════
    {
        no: '9',
        ad: 'Kaynaştırma Öğrenci Dosyası',
        icon: '🧩',
        renk: 'var(--c4)',
        donem: 'surekli',
        gizli: true,
        ogrenciBazli: true,
        aciklama:
            'Özel eğitim gereksinimli öğrencilere ait evrakların bulunması gereken ' +
            'dosyadır. Her öğrenci için ayrı bölüm tutulur.',
        belgeler: [
            { ad: 'Sağlık kurulu raporu', zorunlu: true, kaynak: 'evrak' },
            { ad: 'Özel eğitim değerlendirme kurulu kararı', zorunlu: true, kaynak: 'evrak' },
            { ad: 'BEP (Bireyselleştirilmiş Eğitim Planı)', zorunlu: true, kaynak: 'bep' },
            { ad: 'Destek eğitim odası çalışma planları', zorunlu: true, kaynak: 'bep' },
            { ad: 'Diğer kurumlardan gelen rapor ve evraklar', zorunlu: false, kaynak: 'evrak' },
            { ad: 'BEP geliştirme birimi toplantı tutanağı', zorunlu: false, kaynak: 'bep' },
            { ad: 'Eğitsel performans değerlendirme formu', zorunlu: false, kaynak: 'bep' },
            { ad: 'Veli bilgilendirme ve onay formu', zorunlu: false, kaynak: 'onam' },
        ],
    },

    // ══════════════════════════════════════════════════════════
    {
        no: '10',
        ad: 'Mevzuat Dosyası',
        icon: '📜',
        renk: 'var(--ink-3)',
        donem: 'surekli',
        aciklama:
            'Hizmetlerin yasal çerçevesini belirleyen yönetmelik ve yönergelerin ' +
            'bulunduğu dosyadır. Güncel sürümler saklanır, yürürlükten kalkanlar ' +
            'ayrı bölümde tutulur.',
        belgeler: [
            { ad: 'Rehberlik ve Psikolojik Danışma Hizmetleri Yönetmeliği', zorunlu: true, kaynak: 'evrak' },
            { ad: 'Rehberlik ve Psikolojik Danışma Etik Yönergesi', zorunlu: true, kaynak: 'evrak' },
            { ad: 'Özel Eğitim Hizmetleri Yönetmeliği', zorunlu: true, kaynak: 'evrak' },
            { ad: 'Psikososyal Koruma, Önleme ve Krize Müdahale Hizmetleri Yönergesi', zorunlu: true, kaynak: 'evrak' },
            {
                ad: 'Millî Eğitim Bakanlığı Okul Öncesi Eğitim ve İlköğretim Kurumları Yönetmeliği',
                zorunlu: true, kaynak: 'evrak',
                kademe: ['anasinifi', 'ilkokul', 'ortaokul'],
                not: 'Hizmet verilen okul türüne göre bulundurulur.',
            },
            {
                ad: 'Millî Eğitim Bakanlığı Ortaöğretim Kurumları Yönetmeliği',
                zorunlu: true, kaynak: 'evrak',
                kademe: ['lise'],
                not: 'Hizmet verilen okul türüne göre bulundurulur.',
            },
            { ad: 'Güncel genelge ve resmî yazılar', zorunlu: false, kaynak: 'evrak' },
        ],
    },
];

/** Uygulamadaki modüllerin hangi klasörü beslediği. */
export const KAYNAK_ETIKET = {
    plan: 'Plan modülü',
    test: 'Test & Envanter',
    gorusme: 'Görüşme kayıtları',
    bep: 'BEP merkezi',
    risk: 'Risk haritası',
    onam: 'Veli onam formları',
    tutanak: 'Komisyon tutanakları',
    evrak: 'Evrak defteri',
    rapor: 'Raporlar',
};

export const klasorBul = (no) => DESIMAL_PLAN.find((k) => k.no === String(no)) || null;

/**
 * Bir belgenin verilen kademede geçerli olup olmadığı.
 * `kademe` alanı yoksa belge her kademede aranır.
 */
export const belgeKademeyeUygun = (belge, kademe) =>
    !belge.kademe || !kademe || belge.kademe.includes(kademe);

/** Klasörü verilen kademeye göre süzülmüş belge listesiyle döndürür. */
export const klasorKademeye = (klasor, kademe) => ({
    ...klasor,
    belgeler: klasor.belgeler.filter((b) => !b.kademe || !kademe || b.kademe.includes(kademe)),
});

/** Tüm planı kademeye göre süzer. */
export const planKademeye = (kademe) => DESIMAL_PLAN.map((k) => klasorKademeye(k, kademe));

/** Denetimde aranan zorunlu belge sayısı (kademeye göre). */
export const zorunluBelgeSayisi = (kademe = null) =>
    planKademeye(kademe).reduce((t, k) => t + k.belgeler.filter((b) => b.zorunlu).length, 0);

/** Eğitim-öğretim yılı etiketi (Eylül'de yeni yıl başlar). */
export const ogretimYili = (d = new Date()) => {
    const y = d.getFullYear();
    return d.getMonth() >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
};

export default {
    DESIMAL_PLAN, KAYNAK_ETIKET, KADEMELER, KADEME_LISTESI,
    klasorBul, klasorKademeye, planKademeye, belgeKademeyeUygun,
    kurumTurundenKademe, siniftanKademe,
    zorunluBelgeSayisi, ogretimYili,
};
