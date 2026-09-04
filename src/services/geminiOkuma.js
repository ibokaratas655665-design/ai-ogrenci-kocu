/**
 * 🤖 GEMİNİ OKUMA SERVİSİ
 *
 * Deneme kitapçığı ve cevap anahtarı PDF/görüntülerini Gemini'ye okutur.
 * Üç iş yapar:
 *   1. cevapAnahtariOku      → anahtar görselinden "Ders: ABCDE..." satırları
 *   2. kitapciktanKonular    → kitapçıktan soru→konu listesi
 *   3. kitapcikVeAnahtarEsle → ikisini birleştirip soru kaydı üretir
 *
 * Anahtar, Koçluk Asistanı'nın kullandığı `gemini_api_key` ile ORTAKTIR:
 * koç anahtarı bir kez girer, iki özellik birden çalışır.
 *
 * Bütün fonksiyonlar {basarili, ...} döner; hata fırlatmaz — arayüz
 * hata metnini olduğu gibi gösterebilir.
 */

const ANAHTAR_DEPO = 'gemini_api_key';
const MODEL_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent';

/** data: URI'yi Gemini'nin beklediği {base64, mimeType} çiftine ayırır. */
export const dataUrlAyristir = (dataUrl) => {
    const s = String(dataUrl || '');
    const virgul = s.indexOf(',');
    if (virgul < 0) return null;
    const mimeType = s.slice(5, virgul).split(';')[0] || 'application/octet-stream';
    return { base64: s.slice(virgul + 1), mimeType };
};

export const geminiAnahtariVar = () => {
    try { return !!localStorage.getItem(ANAHTAR_DEPO); } catch { return false; }
};

/**
 * Tek giriş noktası: parts dizisini modele gönderir.
 * responseSchema verilirse JSON modu açılır (model şemaya uymak zorunda).
 */
export const geminiIstek = async (parts, { maxOutputTokens = 2048, responseSchema = null } = {}) => {
    let anahtar;
    try { anahtar = localStorage.getItem(ANAHTAR_DEPO); } catch { anahtar = null; }
    if (!anahtar) {
        return { basarili: false, hata: 'Gemini API anahtarı yok. Koçluk Asistanı’nı açıp ücretsiz anahtarını girince AI okuma aktifleşir.' };
    }

    const generationConfig = { temperature: 0.1, maxOutputTokens };
    if (responseSchema) {
        generationConfig.responseMimeType = 'application/json';
        generationConfig.responseSchema = responseSchema;
    }

    let cevap;
    try {
        cevap = await fetch(MODEL_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': anahtar },
            body: JSON.stringify({ contents: [{ parts }], generationConfig }),
        });
    } catch (e) {
        return { basarili: false, hata: `Ağ hatası: ${e?.message || 'bağlanılamadı'}` };
    }

    if (!cevap.ok) {
        let hata = `HTTP ${cevap.status}`;
        try {
            const govde = await cevap.json();
            hata = govde.error?.message || hata;
        } catch { /* gövde okunamadı, HTTP kodu kalır */ }
        if (/API_KEY_INVALID/.test(hata)) hata = 'API anahtarı geçersiz. Koçluk Asistanı ayarlarından yenileyin.';
        else if (/RESOURCE_EXHAUSTED/.test(hata)) hata = 'Günlük Gemini limiti doldu. Yarın tekrar deneyin.';
        return { basarili: false, hata };
    }

    let govde;
    try { govde = await cevap.json(); } catch { return { basarili: false, hata: 'AI yanıtı çözümlenemedi.' }; }

    const metin = govde.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return metin
        ? { basarili: true, metin }
        : { basarili: false, hata: 'AI boş yanıt verdi. Görüntü net değilse tekrar çekin.' };
};

/** Sınav türüne göre modelin kullanmasına izin verilen bölüm adları. */
const dersListesiMetni = (tur) => (String(tur || 'TYT').startsWith('AYT')
    ? 'Matematik, Fizik, Kimya, Biyoloji, Edebiyat, Tarih, Coğrafya'
    : 'Türkçe, Sosyal Bilimler, Matematik, Fen Bilimleri');

/**
 * Cevap anahtarı görüntüsünden ders bazlı şık dizileri okur.
 * Başarıda metin: her satır "Ders: ABCDEX..." biçimindedir (X = okunamadı).
 */
export const cevapAnahtariOku = async ({ dataUrl, tur = 'TYT' }) => {
    const dosya = dataUrlAyristir(dataUrl);
    if (!dosya) return { basarili: false, hata: 'Geçersiz görüntü verisi.' };

    const istem = `Bu bir ${tur} sınavına ait CEVAP ANAHTARI (görüntü ya da PDF). Ana cevap tablosundaki doğru şıkları (A,B,C,D,E) SIRAYLA oku ve DERSE göre grupla. Çıktıyı SADECE istenen JSON şemasında ver, başka açıklama/yorum EKLEME.

KURALLAR:
- Her ders için "cevaplar" alanı, soruların şıklarının BİTİŞİK dizisidir (ör. "ABCDEACBD"). Sadece A-E harfleri, boşluk/numara/virgül YOK.
- "ders" adı yalnız şu bölümlerden biri: ${dersListesiMetni(tur)}. (Soru no, sayfa "Q10 (p.37)", "Periyodik" gibi başlıkları ASLA ders adı yapma.)
- BİRLEŞTİR: cevaplar numara/sayfa başlıklarıyla parçalara bölünmüşse ait oldukları derste tek dizide birleştir. Fen'in tüm parçaları (Fizik/Kimya/Biyoloji dahil) tek "Fen Bilimleri" altında toplanır.
- Her şıkkı yalnız BİR KEZ say (aynı soru iki tabloda görünürse tekrar ekleme).
- Okunamayan cevap için "X" koy (sıra bozulmasın).`;

    const sonuc = await geminiIstek(
        [{ text: istem }, { inline_data: { mime_type: dosya.mimeType, data: dosya.base64 } }],
        {
            maxOutputTokens: 4096,
            responseSchema: {
                type: 'object',
                properties: {
                    dersler: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: { ders: { type: 'string' }, cevaplar: { type: 'string' } },
                            required: ['ders', 'cevaplar'],
                        },
                    },
                },
                required: ['dersler'],
            },
        },
    );
    if (!sonuc.basarili) return sonuc;

    try {
        const satirlar = (JSON.parse(sonuc.metin).dersler || [])
            .map((d) => {
                const ders = String(d.ders || '').trim();
                const cevaplar = String(d.cevaplar || '').toUpperCase().replace(/[^A-EX]/g, '');
                return ders && cevaplar ? `${ders}: ${cevaplar}` : null;
            })
            .filter(Boolean);
        return satirlar.length
            ? { basarili: true, metin: satirlar.join('\n') }
            : { basarili: false, hata: 'AI anahtarı okuyamadı. Daha net bir fotoğraf deneyin.' };
    } catch {
        // Şemalı modda bile ham metin gelebilir; olduğu gibi göster
        return { basarili: true, metin: sonuc.metin };
    }
};

/** Kitapçıktan "Ders | SoruNo | Konu" listesi çıkarır (serbest metin). */
export const kitapciktanKonular = async ({ dataUrl, tur = 'TYT', dersler = [] }) => {
    const dosya = dataUrlAyristir(dataUrl);
    if (!dosya) return { basarili: false, hata: 'Geçersiz görüntü verisi.' };

    const dersNotu = dersler.length ? `Bu denemedeki dersler: ${dersler.join(', ')}.` : '';
    return geminiIstek([
        {
            text: `Bu bir ${tur} sınavının SORU KİTAPÇIĞI (görüntü ya da PDF). ${dersNotu}
Görevin: her sorunun HANGİ KONU/KAZANIM ile ilgili olduğunu belirle.

ÇIKTI KURALLARI (çok önemli):
- SADECE liste yaz, başka açıklama yazma.
- Her satır: "Ders | SoruNo | Konu"  (örn: "Matematik | 12 | Türev").
- Konu adını YKS müfredatındaki bilinen kısa adla yaz (Paragraf, Türev, Limit, Hareket, Periyodik Sistem, Hücre, ...).
- Soru numarasını kitapçıktaki numarayla ver.`,
        },
        { inline_data: { mime_type: dosya.mimeType, data: dosya.base64 } },
    ], { maxOutputTokens: 4096 });
};

/**
 * Kitapçık + anahtar birlikte: her soru için {no, ders, konu, dogru} üretir.
 * Deneme kaynağının "sorular" alanını tek adımda doldurmanın yolu.
 */
export const kitapcikVeAnahtarEsle = async ({ soruDataUrl, anahtarDataUrl, tur = 'TYT' }) => {
    const kitapcik = dataUrlAyristir(soruDataUrl);
    const anahtar = dataUrlAyristir(anahtarDataUrl);
    if (!kitapcik) return { basarili: false, hata: 'Soru kitapçığı (PDF/görüntü) gerekli.' };
    if (!anahtar) return { basarili: false, hata: 'Cevap anahtarı görüntüsü gerekli.' };

    const bolumler = String(tur || 'TYT').startsWith('AYT')
        ? 'Matematik, Fizik, Kimya, Biyoloji, Edebiyat, Tarih, Coğrafya'
        : 'Türkçe, Sosyal Bilimler (Tarih/Coğrafya/Felsefe/Din), Matematik, Fen Bilimleri (Fizik/Kimya/Biyoloji)';

    const istem = `Sana bir ${tur} sınavının SORU KİTAPÇIĞI ve ayrıca CEVAP ANAHTARI görseli veriliyor.
Her soru için şunları eşleştir ve SADECE istenen JSON şemasında ver:
- "no": kitapçıktaki soru numarası (sıralı, eksiksiz).
- "ders": şu bölümlerden biri — ${bolumler}.
- "konu": o sorunun YKS müfredatındaki kısa konu adı (Paragraf, Sözcükte Anlam, Türev, Limit, Hareket, Periyodik Sistem, Hücre, Osmanlı, ...). Konuyu SORUNUN İÇERİĞİNDEN belirle; emin değilsen dersin makul bir konusunu yaz, ASLA boş bırakma.
- "dogru": CEVAP ANAHTARINDAKİ doğru şık (A-E). Okunamazsa "X".
Soru sırasını kitapçıktaki gibi koru.`;

    const sonuc = await geminiIstek([
        { text: istem },
        { text: 'SORU KİTAPÇIĞI:' },
        { inline_data: { mime_type: kitapcik.mimeType, data: kitapcik.base64 } },
        { text: 'CEVAP ANAHTARI:' },
        { inline_data: { mime_type: anahtar.mimeType, data: anahtar.base64 } },
    ], {
        maxOutputTokens: 8192,
        responseSchema: {
            type: 'object',
            properties: {
                sorular: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            no: { type: 'integer' },
                            ders: { type: 'string' },
                            konu: { type: 'string' },
                            dogru: { type: 'string' },
                        },
                        required: ['ders', 'konu', 'dogru'],
                    },
                },
            },
            required: ['sorular'],
        },
    });
    if (!sonuc.basarili) return sonuc;

    try {
        const sorular = (JSON.parse(sonuc.metin).sorular || [])
            .map((s, i) => ({
                no: Number(s.no) || i + 1,
                ders: String(s.ders || '').trim(),
                konu: (s.konu && String(s.konu).trim()) || null,
                dogru: String(s.dogru || '').toUpperCase().replace(/[^A-E]/g, '').slice(0, 1),
            }))
            .filter((s) => s.ders && s.dogru);
        return sorular.length
            ? { basarili: true, sorular }
            : { basarili: false, hata: 'AI soruları eşleştiremedi. Daha net görüntü deneyin.' };
    } catch {
        return { basarili: false, hata: 'AI yanıtı çözümlenemedi.' };
    }
};

export default {
    dataUrlAyristir, geminiAnahtariVar, geminiIstek,
    cevapAnahtariOku, kitapciktanKonular, kitapcikVeAnahtarEsle,
};
