/**
 * 🧾 SINAV OLUŞTUR — uygulama içi deneme tanımlama ekranı (koç)
 *
 * Akış: PDF kitapçık yükle → cevap anahtarını gir (elle "Ders: ABCDE" /
 * "Ders | Konu: ABCDE", ya da fotoğraf/PDF'ten AI ile okut) → kaydet →
 * öğrencilere ata (istersen ileri tarihli: o güne kadar öğrencide
 * görünmez, günü gelince kendiliğinden açılır).
 *
 * Kitapçık + anahtar birlikte AI'ya verilirse her soruya KONU atanır;
 * sonuçlar konu kırılımlı gelir ve konu motoru/Hata Defteri beslenir.
 */
import React, { useMemo, useState } from 'react';
import {
    Upload, Camera, Sparkles, FileText, X, Loader2, CheckCircle2, Check,
    Users, Send, Undo2, ClipboardList, KeyRound,
} from 'lucide-react';
import denemeMotoru, { SINAV_TURLERI } from '../../services/denemeMotoru';
import {
    geminiAnahtariVar, cevapAnahtariOku, kitapciktanKonular, kitapcikVeAnahtarEsle,
} from '../../services/geminiOkuma';

/** Şık dizisini A-E dışından arındırır. */
const sikTemizle = (s) => String(s || '').toUpperCase().replace(/[^A-E]/g, '');

/** Ders adı doğrulama — "Q10 (p.37)" gibi çöp başlıkların anahtara sızmasını önler. */
const GECERLI_DERSLER = [
    'türkçe', 'matematik', 'geometri', 'fizik', 'kimya', 'biyoloji', 'tarih',
    'coğrafya', 'felsefe', 'din', 'edebiyat', 'ingilizce', 'i̇ngilizce',
    'sosyal bilimler', 'sosyal', 'fen bilimleri', 'fen', 'türk dili',
];
const dersGecerliMi = (ad) => {
    const t = String(ad || '').toLocaleLowerCase('tr-TR').trim();
    return !!t && GECERLI_DERSLER.some((d) => t === d || t.startsWith(d));
};

const bugunISO = () => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

const SinavOlusturTab = ({ user, students = [], setToast }) => {
    // ── Form durumu ──────────────────────────────────────────
    const [ad, setAd] = useState('');
    const [tur, setTur] = useState('TYT');
    const [sureDk, setSureDk] = useState('');
    const [kitapcik, setKitapcik] = useState(null);       // kayda gömülür / Storage'a gider
    const [cevapPdf, setCevapPdf] = useState(null);       // öğrencinin bakacağı anahtar PDF'i
    const [anahtarFoto, setAnahtarFoto] = useState(null); // yalnız AI okumaya girer
    const [anahtarMetin, setAnahtarMetin] = useState('');
    const [dersAnahtarlari, setDersAnahtarlari] = useState([]); // [{ders, konu, anahtar}]
    const [aiSorular, setAiSorular] = useState(null);     // AI eşleştirmesinden gelen tam soru listesi
    const [anahtarOkunuyor, setAnahtarOkunuyor] = useState(false);
    const [konularOkunuyor, setKonularOkunuyor] = useState(false);
    const [kaydediliyor, setKaydediliyor] = useState(false);
    const [geminiVar, setGeminiVar] = useState(geminiAnahtariVar);
    const [geminiGiris, setGeminiGiris] = useState('');
    const [tetik, setTetik] = useState(0);
    const tazele = () => setTetik((t) => t + 1);

    // ── Atama modalı ─────────────────────────────────────────
    const [atamaKaynagi, setAtamaKaynagi] = useState(null);
    const [seciliOgrenciler, setSeciliOgrenciler] = useState([]);
    const [acilisTarihi, setAcilisTarihi] = useState(bugunISO());

    const kaynaklar = useMemo(() => denemeMotoru.kaynaklariListele(), [tetik]);
    const atamalar = useMemo(() => denemeMotoru.atamalariListele(), [tetik]);
    const oturumlar = useMemo(() => denemeMotoru.oturumlariListele(), [tetik]);
    const toplamSoru = dersAnahtarlari.reduce((t, d) => t + sikTemizle(d.anahtar).length, 0);
    const kaydedilebilir = ad.trim() && (toplamSoru > 0 || !!cevapPdf);

    /** Dosya girişi → {ad, data(dataURL), boyut}; girişi sıfırlar ki aynı dosya yeniden seçilebilsin. */
    const dosyaSec = (e, setter) => {
        const dosya = e.target.files?.[0];
        e.target.value = '';
        if (!dosya) return;
        if (dosya.size > 20000000) return void setToast?.('PDF çok büyük (en fazla ~20MB).', 'error');
        const okuyucu = new FileReader();
        okuyucu.onload = () => setter({ ad: dosya.name, data: okuyucu.result, boyut: dosya.size });
        okuyucu.onerror = () => setToast?.('Dosya okunamadı, tekrar deneyin.', 'error');
        okuyucu.readAsDataURL(dosya);
    };

    /**
     * PDF'i Storage'a yükler; Storage yoksa küçük dosya (≤~900KB) kayda
     * gömülür, büyüğü reddedilir. {ok, ad?, data?, url?, yol?, hata?}
     */
    const pdfHazirla = async (dosya, klasor) => {
        if (!dosya?.data) return { ok: true };
        const sonuc = await denemeMotoru.pdfYukle({ dataUrl: dosya.data, ad: dosya.ad, klasor });
        if (sonuc.basarili) return { ok: true, ad: dosya.ad, url: sonuc.url, yol: sonuc.yol };
        if (dosya.boyut <= 900000) return { ok: true, ad: dosya.ad, data: dosya.data };
        return { ok: false, hata: sonuc.hata };
    };

    /** "Ders: ABCDE" / "Ders | Konu: ABCDE" satırlarını ayrıştırır. */
    const anahtariAyristir = () => {
        setAiSorular(null);
        const esit = (a, b) => String(a || '').toLocaleLowerCase('tr-TR') === String(b || '').toLocaleLowerCase('tr-TR');
        const sonuc = [];
        let copSatir = 0;

        anahtarMetin.split(/\n+/).map((s) => s.trim()).filter(Boolean).forEach((ham) => {
            const satir = ham.replace(/^[\s*\->•#·.]+/, '').trim();
            if (!satir) return;

            let baslik; let sikDizisi;
            const ikiNokta = satir.indexOf(':');
            if (ikiNokta > 0) {
                baslik = satir.slice(0, ikiNokta).trim();
                sikDizisi = sikTemizle(satir.slice(ikiNokta + 1));
            } else {
                const parcalar = satir.split(/\s+/);
                sikDizisi = sikTemizle(parcalar.pop());
                baslik = parcalar.join(' ').trim();
            }
            if (!baslik || !sikDizisi) return;

            let ders = baslik;
            let konu = null;
            const boru = baslik.indexOf('|');
            if (boru > 0) {
                ders = baslik.slice(0, boru).trim();
                konu = baslik.slice(boru + 1).trim() || null;
            }
            if (!ders) return;
            if (!dersGecerliMi(ders)) { copSatir++; return; }

            const varolan = sonuc.findIndex((s) => esit(s.ders, ders) && esit(s.konu, konu));
            if (varolan >= 0) sonuc[varolan].anahtar = sikDizisi;
            else sonuc.push({ ders, konu, anahtar: sikDizisi });
        });

        if (sonuc.length === 0) {
            return void setToast?.('Anahtar ayrıştırılamadı. Format: "Ders: ABCDE" (ör. "Matematik: ABCDE")', 'error');
        }
        setDersAnahtarlari(sonuc);
        const konulu = sonuc.some((s) => s.konu);
        const soru = sonuc.reduce((t, s) => t + sikTemizle(s.anahtar).length, 0);
        setToast?.(`✅ ${sonuc.length} ders · ${soru} soru${konulu ? ' (konu etiketli)' : ''}${copSatir ? ` · ${copSatir} çöp satır elendi` : ''}`);
    };

    /** AI okuma: kitapçık da yüklüyse soru-konu-cevap birlikte, yoksa yalnız anahtar. */
    const aiIleOku = async () => {
        if (!anahtarFoto?.data) return void setToast?.('Önce cevap anahtarı fotoğrafı/PDF yükleyin.', 'error');
        setAnahtarOkunuyor(true);
        if (kitapcik?.data) {
            const sonuc = await kitapcikVeAnahtarEsle({ soruDataUrl: kitapcik.data, anahtarDataUrl: anahtarFoto.data, tur });
            setAnahtarOkunuyor(false);
            if (!sonuc.basarili) return void setToast?.(sonuc.hata, 'error');
            setAiSorular(sonuc.sorular);
            // Önizleme için soruları ders||konu gruplarına indir
            const gruplar = new Map();
            sonuc.sorular.forEach((s) => {
                const anahtar = `${s.ders}||${s.konu || '—'}`;
                const grup = gruplar.get(anahtar) || { ders: s.ders, konu: s.konu || null, anahtar: '' };
                grup.anahtar += s.dogru;
                gruplar.set(anahtar, grup);
            });
            setDersAnahtarlari([...gruplar.values()]);
            setAnahtarMetin('');
            const dersKonu = new Set(sonuc.sorular.map((s) => `${s.ders}|${s.konu}`)).size;
            return void setToast?.(`✅ ${sonuc.sorular.length} soru okundu · KONU DAĞILIMI AKTİF (${dersKonu} ders-konu). Kaydedebilirsiniz.`);
        }
        const sonuc = await cevapAnahtariOku({ dataUrl: anahtarFoto.data, tur });
        setAnahtarOkunuyor(false);
        if (sonuc.basarili) {
            setAiSorular(null);
            setAnahtarMetin(sonuc.metin);
            setToast?.('✅ Cevap anahtarı okundu. (Konu dağılımı için Soru Kitapçığı da yükleyip tekrar okutun.) "Anahtarı Ayrıştır"a basın.');
        } else {
            setToast?.(sonuc.hata, 'error');
        }
    };

    const kaydet = async () => {
        if (kaydediliyor) return;
        setKaydediliyor(true);
        try {
            const kitapcikPdf = await pdfHazirla(kitapcik, 'deneme-kitapcik');
            if (!kitapcikPdf.ok) return void setToast?.(`Soru kitapçığı yüklenemedi: ${kitapcikPdf.hata}. Storage etkin değilse kurulmalı.`, 'error');
            const anahtarPdf = await pdfHazirla(cevapPdf, 'deneme-cevap');
            if (!anahtarPdf.ok) return void setToast?.(`Cevap anahtarı PDF yüklenemedi: ${anahtarPdf.hata}.`, 'error');

            const sonuc = denemeMotoru.kaynakOlustur({
                ad, tur, sureDk,
                dersAnahtarlari,
                sorular: Array.isArray(aiSorular) && aiSorular.length ? aiSorular : undefined,
                pdfAd: kitapcikPdf.ad, pdfData: kitapcikPdf.data, pdfUrl: kitapcikPdf.url, pdfYol: kitapcikPdf.yol,
                pdfCevapAd: anahtarPdf.ad, pdfCevapData: anahtarPdf.data, pdfCevapUrl: anahtarPdf.url, pdfCevapYol: anahtarPdf.yol,
                olusturanId: user?.id, olusturanAd: user?.name || 'Koç',
            });
            if (!sonuc.basarili) return void setToast?.(sonuc.hata, 'error');
            setToast?.(`✅ "${ad}" oluşturuldu${toplamSoru ? ` (${toplamSoru} soru)` : ' (PDF referanslı)'}`);
            setAd(''); setDersAnahtarlari([]); setKitapcik(null); setCevapPdf(null);
            setAnahtarMetin(''); setAiSorular(null); setAnahtarFoto(null);
            tazele();
        } finally {
            setKaydediliyor(false);
        }
    };

    const kaynakIstatistik = (kaynakId) => ({
        atanan: atamalar.filter((a) => a.kaynakId === kaynakId).reduce((t, a) => t + a.studentIds.length, 0),
        cozen: oturumlar.filter((o) => o.kaynakId === kaynakId && o.durum === 'bitti').length,
    });

    return (
        <div className="space-y-4 xl:flex-1 xl:min-h-0 xl:flex xl:flex-col xl:overflow-hidden">
            <div className="xl:shrink-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-ink syne tracking-tight uppercase m-0">Sınav Oluştur</h2>
                <p className="text-brand text-[10px] font-black tracking-[0.2em] mt-1 uppercase">PDF KİTAPÇIK YÜKLE · CEVAP ANAHTARI GİR · ÖĞRENCİYE ATA</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 xl:gap-5 xl:flex-1 xl:min-h-0 xl:overflow-hidden xl:items-stretch">
                {/* ── SOL: tanım formu ── */}
                <div className="xl:col-span-7 min-w-0 space-y-4 xl:min-h-0 xl:overflow-y-auto xl:pr-1.5">

                    <div className="card p-4 sm:p-5 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <label className="sm:col-span-2 block">
                                <span className="tip-mini font-black uppercase tracking-wider text-ink-3">Deneme Adı</span>
                                <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Örn: 1. TYT Genel Deneme"
                                    className="mt-1 w-full px-3 py-2 rounded-xl border border-line bg-surface text-sm" />
                            </label>
                            <label className="block">
                                <span className="tip-mini font-black uppercase tracking-wider text-ink-3">Süre (dk)</span>
                                <input type="number" value={sureDk} onChange={(e) => setSureDk(e.target.value)}
                                    className="mt-1 w-full px-3 py-2 rounded-xl border border-line bg-surface text-sm" />
                            </label>
                        </div>
                        <div>
                            <span className="tip-mini font-black uppercase tracking-wider text-ink-3">Sınav Tipi</span>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                                {SINAV_TURLERI.map((t) => (
                                    <button key={t} type="button" onClick={() => setTur(t)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${tur === t ? 'bg-brand text-white' : 'bg-surface-2 text-ink-2 border border-line'}`}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Soru kitapçığı */}
                    <div className="card p-4 sm:p-5 space-y-3">
                        <p className="tip-h4 m-0 flex items-center gap-2"><Upload size={16} className="text-brand" /> Soru Kitapçığı (PDF)</p>
                        {kitapcik ? (
                            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 border border-line">
                                <span className="w-9 h-9 rounded-lg bg-danger-soft text-danger grid place-items-center shrink-0"><FileText size={16} /></span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-xs font-bold text-ink truncate">{kitapcik.ad}</span>
                                    <span className="block tip-mini text-ink-3">{(kitapcik.boyut / 1024).toFixed(0)} KB</span>
                                </span>
                                <button onClick={() => setKitapcik(null)} className="p-1.5 rounded-lg text-danger hover:bg-danger-soft transition"><X size={14} /></button>
                            </div>
                        ) : (
                            <label className="flex items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-line text-ink-3 hover:border-brand-line hover:text-brand transition cursor-pointer text-sm font-bold">
                                <Upload size={16} /> PDF Seç (en fazla ~20MB)
                                <input type="file" accept="application/pdf" onChange={(e) => dosyaSec(e, setKitapcik)} className="hidden" />
                            </label>
                        )}
                        <p className="tip-mini text-ink-3">Öğrenci denemeyi çözerken bu PDF'i uygulamada görür; cevaplarını optik forma işaretler.</p>
                        {kitapcik && (
                            <button type="button" disabled={konularOkunuyor}
                                onClick={async () => {
                                    if (!kitapcik?.data) return void setToast?.('Önce Soru Kitapçığı PDF/görüntüsünü yükleyin.', 'error');
                                    setKonularOkunuyor(true);
                                    const sonuc = await kitapciktanKonular({ dataUrl: kitapcik.data, tur, dersler: dersAnahtarlari.map((d) => d.ders) });
                                    setKonularOkunuyor(false);
                                    if (sonuc.basarili) {
                                        setAnahtarMetin((m) => `${m ? `${m}\n\n` : ''}# AI konu analizi (soru → konu):\n${sonuc.metin}`);
                                        setToast?.('✅ AI konu analizini ekledi. Anahtarla eşleştirip düzenleyebilirsiniz.');
                                    } else setToast?.(sonuc.hata, 'error');
                                }}
                                className="w-full h-9 rounded-lg border border-brand-line text-brand text-xs font-bold disabled:opacity-40 transition flex items-center justify-center gap-1.5 hover:bg-brand-soft">
                                {konularOkunuyor
                                    ? <><Loader2 size={14} className="animate-spin" /> Sorular okunuyor…</>
                                    : <><Sparkles size={14} /> Sorulardan Konuları AI ile Çıkar</>}
                            </button>
                        )}
                    </div>

                    {/* Cevap anahtarı */}
                    <div className="card p-4 sm:p-5 space-y-3">
                        <p className="tip-h4 m-0 flex items-center gap-2"><Check size={16} className="text-ok" /> Cevap Anahtarı</p>

                        {/* AI ile okuma kutusu */}
                        <div className="rounded-xl p-3 border border-brand-line" style={{ background: 'color-mix(in srgb, var(--brand) 7%, var(--surface))' }}>
                            <p className="tip-mini font-black uppercase tracking-wider text-brand flex items-center gap-1.5 m-0">
                                <Sparkles size={13} /> Fotoğraf/PDF'ten AI ile Oku (en kolay)
                            </p>
                            {!geminiVar && (
                                <div className="mt-2 rounded-lg p-2.5 bg-surface border border-line">
                                    <p className="tip-mini text-ink-2 m-0 mb-1.5">
                                        AI okuma için <span className="font-bold">ücretsiz Gemini anahtarı</span> gerekli —{' '}
                                        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-brand font-bold underline">aistudio.google.com/apikey</a>
                                        'den al, buraya yapıştır:
                                    </p>
                                    <div className="flex gap-1.5">
                                        <input type="password" value={geminiGiris} onChange={(e) => setGeminiGiris(e.target.value)}
                                            placeholder="AIza… (Gemini API anahtarı)"
                                            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-line bg-surface text-xs font-mono" />
                                        <button type="button"
                                            onClick={() => {
                                                const anahtar = geminiGiris.trim();
                                                if (!anahtar) return void setToast?.('Gemini anahtarını yapıştırın.', 'error');
                                                try { localStorage.setItem('gemini_api_key', anahtar); } catch { /* özel modda sorun değil */ }
                                                setGeminiVar(true); setGeminiGiris('');
                                                setToast?.('✅ Gemini anahtarı kaydedildi. Artık "AI ile Oku" çalışır.');
                                            }}
                                            className="px-3 h-8 rounded-lg bg-brand text-white text-xs font-bold shrink-0 flex items-center gap-1">
                                            <KeyRound size={12} /> Kaydet
                                        </button>
                                    </div>
                                </div>
                            )}

                            {anahtarFoto ? (
                                <div className="flex items-center gap-2.5 mt-2 rounded-lg px-2.5 py-2 bg-surface border border-line">
                                    <span className="w-8 h-8 rounded-lg bg-brand-soft text-brand grid place-items-center shrink-0"><FileText size={15} /></span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-xs font-bold text-ink truncate">{anahtarFoto.ad}</span>
                                        <span className="block tip-mini text-ink-3">{(anahtarFoto.boyut / 1024).toFixed(0)} KB</span>
                                    </span>
                                    <button onClick={() => setAnahtarFoto(null)} className="p-1.5 rounded-lg text-danger hover:bg-danger-soft transition shrink-0"><X size={14} /></button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <label className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 border-dashed border-brand-line text-brand hover:bg-brand-soft transition cursor-pointer text-xs font-bold">
                                        <Upload size={14} /> Dosya Seç
                                        <input type="file" accept="image/*,application/pdf" onChange={(e) => dosyaSec(e, setAnahtarFoto)} className="hidden" />
                                    </label>
                                    <label className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 border-dashed border-brand-line text-brand hover:bg-brand-soft transition cursor-pointer text-xs font-bold">
                                        <Camera size={14} /> Fotoğraf Çek
                                        <input type="file" accept="image/*" capture="environment" onChange={(e) => dosyaSec(e, setAnahtarFoto)} className="hidden" />
                                    </label>
                                </div>
                            )}

                            <button type="button" onClick={aiIleOku} disabled={!anahtarFoto || anahtarOkunuyor}
                                className="w-full mt-2 h-9 rounded-lg bg-brand text-white text-sm font-bold disabled:opacity-40 transition flex items-center justify-center gap-1.5">
                                {anahtarOkunuyor
                                    ? <><Loader2 size={15} className="animate-spin" /> Okunuyor…</>
                                    : <><Sparkles size={15} /> AI ile Oku</>}
                            </button>
                            <p className="tip-mini text-ink-3 mt-1.5 m-0">
                                {kitapcik
                                    ? '🎯 Soru Kitapçığı da yüklü — AI her soruya KONU atayıp cevapla eşleştirir (konu dağılımı aktif olur). Okuyunca doğrudan kaydedebilirsiniz.'
                                    : 'Anahtarı Gemini okur, aşağıdaki kutuya yazar; "Anahtarı Ayrıştır"a basarsınız. Konu dağılımı için Soru Kitapçığı PDF\'ini de yükleyin.'}
                            </p>
                        </div>

                        {/* Öğrencinin göreceği cevap anahtarı PDF'i */}
                        {cevapPdf ? (
                            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 border border-line">
                                <span className="w-9 h-9 rounded-lg bg-ok-soft text-ok grid place-items-center shrink-0"><FileText size={16} /></span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-xs font-bold text-ink truncate">{cevapPdf.ad}</span>
                                    <span className="block tip-mini text-ink-3">{(cevapPdf.boyut / 1024).toFixed(0)} KB · cevap anahtarı PDF</span>
                                </span>
                                <button onClick={() => setCevapPdf(null)} className="p-1.5 rounded-lg text-danger hover:bg-danger-soft transition"><X size={14} /></button>
                            </div>
                        ) : (
                            <label className="flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-line text-ink-3 hover:border-ok hover:text-ok transition cursor-pointer text-sm font-bold">
                                <Upload size={16} /> Cevap Anahtarı PDF Yükle
                                <input type="file" accept="application/pdf" onChange={(e) => dosyaSec(e, setCevapPdf)} className="hidden" />
                            </label>
                        )}

                        <p className="tip-mini text-ink-3">
                            — ya da OTOMATİK puanlama + optik form için tek satırlık anahtar (isteğe bağlı):{' '}
                            <span className="font-mono text-ink-2">Ders: ABCDE</span> veya konu bazlı analiz için{' '}
                            <span className="font-mono text-ink-2">Ders | Konu: ABCDE</span>
                        </p>
                        <textarea value={anahtarMetin} onChange={(e) => setAnahtarMetin(e.target.value)} rows={5}
                            placeholder={'Türkçe | Sözcükte Anlam: ABCDE\nTürkçe | Paragraf: ABCDE\nMatematik | Türev: CDBAE\nMatematik | Limit: ABCDE\nFizik: ABCDE'}
                            className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-sm font-mono leading-relaxed" />
                        <div className="flex gap-2">
                            <button type="button" onClick={anahtariAyristir}
                                className="flex-1 h-9 px-4 rounded-xl bg-ok text-white text-sm font-bold hover:opacity-90 transition flex items-center justify-center gap-1.5">
                                <Check size={15} /> Anahtarı Ayrıştır
                            </button>
                            {dersAnahtarlari.length > 0 && (
                                <button type="button" onClick={() => { setDersAnahtarlari([]); setAnahtarMetin(''); }}
                                    className="px-4 h-9 rounded-xl bg-surface-2 border border-line text-ink-2 text-sm font-bold">
                                    Temizle
                                </button>
                            )}
                        </div>

                        {/* Ayrıştırılan anahtar önizlemesi — satır içinde düzeltilebilir */}
                        {dersAnahtarlari.length > 0 && (
                            <div className="space-y-1.5">
                                {dersAnahtarlari.map((satir, i) => (
                                    <div key={`${satir.ders}-${satir.konu || ''}-${i}`} className="flex items-center gap-2.5 rounded-xl px-3 py-2 border border-line">
                                        <span className="w-24 shrink-0 min-w-0">
                                            <span className="block text-xs font-black text-ink truncate">{satir.ders}</span>
                                            {satir.konu && <span className="block tip-mini text-brand font-bold truncate">{satir.konu}</span>}
                                        </span>
                                        <input value={sikTemizle(satir.anahtar)} spellCheck={false}
                                            aria-label={`${satir.ders} cevap dizisi`}
                                            onChange={(e) => {
                                                setAiSorular(null);
                                                const deger = e.target.value;
                                                setDersAnahtarlari((liste) => liste.map((s, j) => (j === i ? { ...s, anahtar: sikTemizle(deger) } : s)));
                                            }}
                                            className="flex-1 min-w-0 text-[11px] font-mono tracking-widest text-ink-2 bg-transparent border-b border-line focus:border-brand focus:outline-none px-0.5 py-0.5" />
                                        <span className="tip-mini font-black text-ok shrink-0">{sikTemizle(satir.anahtar).length} soru</span>
                                        <button type="button"
                                            onClick={() => { setAiSorular(null); setDersAnahtarlari((liste) => liste.filter((_, j) => j !== i)); }}
                                            className="p-1.5 rounded-lg text-danger hover:bg-danger-soft transition"><X size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button type="button" disabled={!kaydedilebilir || kaydediliyor} onClick={kaydet}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-brand text-white font-black text-sm disabled:opacity-40 transition flex items-center justify-center gap-2">
                            {kaydediliyor
                                ? <><Loader2 size={16} className="animate-spin" /> Kaydediliyor…</>
                                : <><CheckCircle2 size={16} /> Denemeyi Kaydet ({toplamSoru} soru)</>}
                        </button>
                    </div>
                </div>

                {/* ── SAĞ: oluşturulan denemeler ── */}
                <aside className="xl:col-span-5 min-w-0 space-y-3 xl:min-h-0 xl:overflow-y-auto xl:pr-1.5">
                    <p className="tip-mini font-black uppercase tracking-wider text-ink-3">Oluşturulan Denemeler ({kaynaklar.length})</p>
                    {kaynaklar.length === 0 ? (
                        <div className="card p-6 text-center">
                            <ClipboardList size={28} className="mx-auto text-ink-3 mb-2" />
                            <p className="tip-small text-ink-2 m-0">Henüz deneme yok. Soldan PDF yükleyip cevap anahtarını girerek deneme hazırlayın.</p>
                        </div>
                    ) : Object.entries(
                        [...kaynaklar]
                            .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
                            .reduce((gruplar, k) => { (gruplar[k.tur] = gruplar[k.tur] || []).push(k); return gruplar; }, {}),
                    ).map(([grupTur, liste]) => (
                        <div key={grupTur} className="space-y-2">
                            <p className="tip-mini font-black uppercase tracking-wider text-brand flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-brand" /> {grupTur} · {liste.length} deneme
                            </p>
                            {liste.map((kaynak) => {
                                const { atanan, cozen } = kaynakIstatistik(kaynak.id);
                                return (
                                    <div key={kaynak.id} className="card p-4 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-ink truncate m-0">{kaynak.ad}</p>
                                                <p className="tip-mini text-ink-3 m-0">
                                                    {kaynak.tur} · {kaynak.toplamSoru} soru
                                                    {kaynak.sureDk ? ` · ${kaynak.sureDk} dk` : ''}
                                                    {kaynak.pdfAd ? ' · 📄 PDF' : ''}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (kaynak.pdfYol) denemeMotoru.pdfSil(kaynak.pdfYol);
                                                    if (kaynak.pdfCevapYol) denemeMotoru.pdfSil(kaynak.pdfCevapYol);
                                                    denemeMotoru.kaynakSil(kaynak.id);
                                                    tazele();
                                                }}
                                                className="p-1.5 rounded-lg text-danger hover:bg-danger-soft transition shrink-0"><X size={14} /></button>
                                        </div>
                                        <div className="flex items-center gap-3 tip-mini text-ink-3">
                                            <span className="inline-flex items-center gap-1"><Users size={12} /> {atanan} atandı</span>
                                            <span className="inline-flex items-center gap-1"><CheckCircle2 size={12} className="text-ok" /> {cozen} çözdü</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { setAtamaKaynagi(kaynak); setSeciliOgrenciler([]); setAcilisTarihi(bugunISO()); }}
                                                className="flex-1 py-2 rounded-xl bg-brand-soft text-brand font-bold text-xs hover:bg-brand hover:text-white transition flex items-center justify-center gap-1.5">
                                                <Send size={14} /> Öğrenciye Ata
                                            </button>
                                            {atanan > 0 && (
                                                <button
                                                    onClick={() => {
                                                        denemeMotoru.atamalariGeriAl(kaynak.id);
                                                        tazele();
                                                        setToast?.(`↩️ "${kaynak.ad}" ataması geri alındı (${atanan} öğrenci). Çözülmüş sonuçlar korunur.`);
                                                    }}
                                                    title="Bu denemeyi tüm öğrencilerden geri al"
                                                    className="px-3 py-2 rounded-xl bg-surface-2 border border-line text-ink-2 font-bold text-xs hover:bg-danger-soft hover:text-danger transition flex items-center justify-center gap-1.5 shrink-0">
                                                    <Undo2 size={14} /> Geri Al
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </aside>
            </div>

            {/* ── ATAMA MODALI ── */}
            {atamaKaynagi && (
                <div className="fixed inset-0 z-modal grid place-items-center bg-black/50 p-4" onClick={() => setAtamaKaynagi(null)}>
                    <div className="w-full max-w-md rounded-2xl bg-surface border border-line shadow-2xl p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="tip-h4 m-0">"{atamaKaynagi.ad}" — Öğrenci Seç</h3>
                            <button onClick={() => setAtamaKaynagi(null)} className="p-1.5 rounded-lg hover:bg-surface-2"><X size={16} /></button>
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                            {students.length === 0 ? (
                                <p className="tip-small text-ink-3">Önce öğrenci ekleyin.</p>
                            ) : students.map((ogr) => {
                                const secili = seciliOgrenciler.includes(ogr.id);
                                return (
                                    <button key={ogr.id}
                                        onClick={() => setSeciliOgrenciler((liste) => (secili ? liste.filter((x) => x !== ogr.id) : [...liste, ogr.id]))}
                                        className={`w-full text-left rounded-xl px-3 py-2 flex items-center gap-2.5 transition border ${secili ? 'bg-brand-soft border-brand-line' : 'bg-surface-2 border-line hover:bg-surface-3'}`}>
                                        <span className={`w-5 h-5 rounded-md grid place-items-center shrink-0 ${secili ? 'bg-brand text-white' : 'bg-surface-3'}`}>
                                            {secili && <CheckCircle2 size={13} />}
                                        </span>
                                        <span className="text-sm font-bold text-ink truncate">{ogr.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <label className="block">
                            <span className="tip-mini font-black uppercase tracking-wider text-ink-3">Açılış Tarihi (kontrollü)</span>
                            <input type="date" value={acilisTarihi} onChange={(e) => setAcilisTarihi(e.target.value)}
                                className="mt-1 w-full px-3 py-2 rounded-xl border border-line bg-surface text-sm" />
                            <span className="tip-mini text-ink-3 mt-1 block">Deneme bu tarihe kadar öğrencide görünmez; o gün otomatik açılır.</span>
                        </label>
                        <button disabled={seciliOgrenciler.length === 0}
                            onClick={() => {
                                const sonuc = denemeMotoru.ata({
                                    kaynakId: atamaKaynagi.id, studentIds: seciliOgrenciler,
                                    atayanId: user?.id, atayanAd: user?.name, acilisTarihi,
                                });
                                if (!sonuc.basarili) return void setToast?.(sonuc.hata, 'error');
                                const hemenAcik = acilisTarihi <= bugunISO();
                                setToast?.(`✅ ${seciliOgrenciler.length} öğrenciye ${hemenAcik ? 'açıldı' : `${acilisTarihi} tarihinde açılacak`}`);
                                setAtamaKaynagi(null);
                                tazele();
                            }}
                            className="w-full py-2.5 rounded-xl bg-brand text-white font-black text-sm disabled:opacity-40 transition flex items-center justify-center gap-2">
                            <Send size={16} /> {seciliOgrenciler.length} Öğrenciye Ata
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SinavOlusturTab;
