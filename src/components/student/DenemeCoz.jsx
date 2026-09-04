/**
 * 📝 DENEME ÇÖZ — öğrencinin uygulama içi deneme ekranı
 *
 * Üç görünüm, tek bileşen:
 *   1. Liste    → koçun atadığı denemeler (+ koç dönütü kartı)
 *   2. Çözüm    → PDF kitapçık + optik form + karalama tuvali
 *   3. Sonuç    → net, ders kırılımı, çözüm istatistiği, cevap anahtarı
 *
 * Çözüm sırasında sistem sessizce üç şey ölçer: soru başına süre,
 * cevap değiştirme sayısı ve ilk cevaplanan ders. Bunlar sonuçla birlikte
 * deneme_analizleri merkezine gider — koç yalnız neti değil, çözüm
 * DAVRANIŞINI da görür.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    CheckCircle2, Clock, Loader2, FileText, Maximize2, PencilLine, Eraser,
    ChevronLeft, ChevronRight, Send, RotateCcw, ClipboardList, MessageSquare,
    AlertTriangle, Timer, BookOpen,
} from 'lucide-react';
import denemeMotoru from '../../services/denemeMotoru';

const SIKLAR = ['A', 'B', 'C', 'D', 'E'];

/** pdfjs yükleyici — utils/pdfParser ile aynı desen, bir kez yüklenir. */
let pdfjsYukleme = null;
const pdfjsAl = () => {
    if (!pdfjsYukleme) {
        pdfjsYukleme = (async () => {
            const [pdfjs, worker] = await Promise.all([
                import('pdfjs-dist'),
                import('pdfjs-dist/build/pdf.worker.mjs?url'),
            ]);
            pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
            return pdfjs;
        })();
    }
    return pdfjsYukleme;
};

const dataUriBaytlari = (dataUri) => {
    const base64 = String(dataUri).split(',')[1] || '';
    const ham = atob(base64);
    const dizi = new Uint8Array(ham.length);
    for (let i = 0; i < ham.length; i++) dizi[i] = ham.charCodeAt(i);
    return dizi;
};

/**
 * PDF'i sayfa sayfa tuvale çizer. iframe yerine bunun sebebi: data-URI
 * PDF'ler mobil WebView'da iframe içinde AÇILMAZ; pdfjs her yerde çalışır.
 */
function KitapcikGoruntuleyici({ src, className }) {
    const kapRef = useRef(null);
    const [durum, setDurum] = useState('yukleniyor');

    useEffect(() => {
        let iptal = false;
        const kap = kapRef.current;
        if (!src || !kap) return undefined;
        setDurum('yukleniyor');
        kap.innerHTML = '';
        (async () => {
            try {
                const pdfjs = await pdfjsAl();
                const kaynak = String(src).startsWith('data:') ? { data: dataUriBaytlari(src) } : src;
                const belge = await pdfjs.getDocument(kaynak).promise;
                if (iptal) return;
                const genislik = kap.clientWidth || 360;
                const oran = Math.min(window.devicePixelRatio || 1, 2);
                for (let sayfaNo = 1; sayfaNo <= belge.numPages; sayfaNo++) {
                    if (iptal) return;
                    const sayfa = await belge.getPage(sayfaNo);
                    const olcek = (genislik / sayfa.getViewport({ scale: 1 }).width) * oran;
                    const gorunum = sayfa.getViewport({ scale: olcek });
                    const tuval = document.createElement('canvas');
                    tuval.width = Math.floor(gorunum.width);
                    tuval.height = Math.floor(gorunum.height);
                    tuval.style.width = '100%';
                    tuval.style.height = 'auto';
                    tuval.style.display = 'block';
                    tuval.style.marginBottom = '6px';
                    tuval.style.borderRadius = '6px';
                    tuval.style.background = '#fff';
                    kap.appendChild(tuval);
                    await sayfa.render({ canvasContext: tuval.getContext('2d'), viewport: gorunum }).promise;
                    if (sayfaNo === 1 && !iptal) setDurum('hazir');
                }
                if (!iptal) setDurum('hazir');
            } catch {
                if (!iptal) setDurum('hata');
            }
        })();
        return () => { iptal = true; };
    }, [src]);

    return (
        <div className={className}>
            {durum === 'yukleniyor' && (
                <div className="flex items-center justify-center gap-2 py-8 text-ink-3 text-sm">
                    <Loader2 size={16} className="animate-spin" /> Kitapçık yükleniyor…
                </div>
            )}
            {durum === 'hata' && (
                <div className="flex items-center justify-center gap-2 py-8 text-danger text-sm text-center">
                    <AlertTriangle size={16} /> Kitapçık gösterilemedi — "Tam ekran" ile açmayı deneyin.
                </div>
            )}
            <div ref={kapRef} />
        </div>
    );
}

const DenemeCoz = ({ user, setToast }) => {
    const studentId = user?.id;
    const [tetik, setTetik] = useState(0);
    const tazele = () => setTetik((t) => t + 1);

    const atananlar = useMemo(() => denemeMotoru.ogrenciyeAtananlar(studentId), [studentId, tetik]);
    const donut = useMemo(() => denemeMotoru.donutOku(studentId), [studentId, tetik]);

    useEffect(() => {
        const dinle = (e) => {
            if (e?.key && !/deneme_(atamalari|kaynaklari|oturumlari)|koc_donutleri/.test(e.key)) return;
            tazele();
        };
        window.addEventListener('storage', dinle);
        return () => window.removeEventListener('storage', dinle);
    }, []);

    // ── Çözüm oturumu durumu ─────────────────────────────────
    const [oturum, setOturum] = useState(null);
    const [kaynak, setKaynak] = useState(null);
    const [cevaplar, setCevaplar] = useState({});
    const [soruSira, setSoruSira] = useState(0);
    const [sonuc, setSonuc] = useState(null);
    const [cizimAcik, setCizimAcik] = useState(false);
    const [kitapcikAcik, setKitapcikAcik] = useState(true);

    // Davranış ölçümleri — render'a girmez, ref'te birikir
    const sureler = useRef({});
    const degisimler = useRef({});
    const ilkDers = useRef(null);
    const soruBaslangici = useRef(Date.now());
    const tuvalRef = useRef(null);
    const ciziyor = useRef(false);

    /** Aktif soruda geçen süreyi kapatıp sayaçı sıfırlar. */
    const sureKapat = () => {
        const soruId = kaynak?.sorular[soruSira]?.id;
        if (soruId) sureler.current[soruId] = (sureler.current[soruId] || 0) + (Date.now() - soruBaslangici.current);
        soruBaslangici.current = Date.now();
    };

    const soruyaGit = (yeni) => { sureKapat(); setSoruSira(yeni); };

    const cevapla = (soruId, sik) => {
        const onceki = cevaplar[soruId];
        if (onceki != null && onceki !== '' && onceki !== sik) {
            degisimler.current[soruId] = (degisimler.current[soruId] || 0) + 1;
        }
        if (!ilkDers.current && sik) {
            ilkDers.current = kaynak?.sorular.find((s) => s.id === soruId)?.ders || null;
        }
        setCevaplar((c) => ({ ...c, [soruId]: sik }));
        denemeMotoru.cevapKaydet(oturum.id, soruId, sik);
    };

    const cozmeyeBasla = (satir) => {
        const acilan = denemeMotoru.oturumBaslat(satir.kaynak.id, studentId);
        if (!acilan.basarili) return void setToast?.(acilan.hata, 'error');
        setOturum(acilan.oturum);
        setKaynak(satir.kaynak);
        setCevaplar(acilan.oturum.cevaplar || {});
        setSoruSira(0);
        setSonuc(null);
        sureler.current = {};
        degisimler.current = {};
        ilkDers.current = null;
        soruBaslangici.current = Date.now();
        setCizimAcik(false);
    };

    const bitir = () => {
        sureKapat();
        let cizim = null;
        try { if (tuvalRef.current) cizim = tuvalRef.current.toDataURL('image/png'); } catch { cizim = null; }
        const kapanis = denemeMotoru.oturumBitir(oturum.id, {
            studentName: user?.name,
            davranis: { sureler: sureler.current, degisimler: degisimler.current, ilkDers: ilkDers.current },
            cizim,
        });
        if (kapanis.basarili) {
            setSonuc(kapanis);
            setToast?.(`✅ Deneme bitti · ${kapanis.netSonuc} net`);
            tazele();
        } else setToast?.(kapanis.hata, 'error');
    };

    const kapat = () => {
        setOturum(null); setKaynak(null); setCevaplar({});
        setSonuc(null); setSoruSira(0); setCizimAcik(false);
    };

    // ── Karalama tuvali ──────────────────────────────────────
    const cizimBasla = (e) => { ciziyor.current = true; ciz(e); };
    const cizimBitir = () => {
        ciziyor.current = false;
        tuvalRef.current?.getContext('2d').beginPath();
    };
    const ciz = (e) => {
        if (!ciziyor.current || !tuvalRef.current) return;
        const tuval = tuvalRef.current;
        const kutu = tuval.getBoundingClientRect();
        const x = ((e.touches?.[0]?.clientX ?? e.clientX) - kutu.left) * (tuval.width / kutu.width);
        const y = ((e.touches?.[0]?.clientY ?? e.clientY) - kutu.top) * (tuval.height / kutu.height);
        const kalem = tuval.getContext('2d');
        kalem.lineWidth = 2.5;
        kalem.lineCap = 'round';
        kalem.strokeStyle = '#eab308';
        kalem.lineTo(x, y);
        kalem.stroke();
        kalem.beginPath();
        kalem.moveTo(x, y);
    };
    const cizimTemizle = () => {
        const tuval = tuvalRef.current;
        if (tuval) tuval.getContext('2d').clearRect(0, 0, tuval.width, tuval.height);
    };

    // ══ 3. GÖRÜNÜM: SONUÇ ═══════════════════════════════════
    if (sonuc && kaynak) {
        return (
            <div className="space-y-4 max-w-xl mx-auto">
                <div className="card p-6 text-center space-y-2">
                    <span className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-ok-soft text-ok mx-auto"><CheckCircle2 size={26} /></span>
                    <h2 className="tip-h3 m-0">{kaynak.ad} tamamlandı</h2>
                    <p className="text-4xl font-black text-brand tabular-nums">
                        {sonuc.netSonuc}<span className="text-sm text-ink-3 font-bold ml-1">net</span>
                    </p>
                    <div className="flex items-center justify-center gap-4 tip-small">
                        <span className="text-ok font-black">{sonuc.dogruSayisi} doğru</span>
                        <span className="text-danger font-black">{sonuc.yanlisSayisi} yanlış</span>
                        <span className="text-ink-3 font-black">{sonuc.bosSayisi} boş</span>
                    </div>
                </div>

                <div className="card p-4">
                    <p className="tip-mini font-black uppercase tracking-wider text-ink-3 mb-2">Ders Bazında</p>
                    <div className="space-y-1.5">
                        {Object.entries(sonuc.dersler).map(([ders, d]) => (
                            <div key={ders} className="flex items-center gap-3 rounded-xl px-3 py-2 border border-line">
                                <span className="text-xs font-bold text-ink flex-1">{ders}</span>
                                <span className="tip-mini text-ink-3">{d.dogru}D · {d.yanlis}Y · {d.bos}B</span>
                                <span className="text-sm font-black text-brand tabular-nums w-12 text-right">{d.net}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {sonuc.istatistik && (
                    <div className="card p-4 space-y-2">
                        <p className="tip-mini font-black uppercase tracking-wider text-ink-3 flex items-center gap-1.5">
                            <Timer size={12} /> Çözüm İstatistiği
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                                { etiket: 'İlk Ders', deger: sonuc.istatistik.ilkDers || '—' },
                                { etiket: 'Toplam Süre', deger: `${sonuc.istatistik.toplamSureDk} dk` },
                                { etiket: 'Ort. Soru', deger: `${sonuc.istatistik.ortSoruSaniye} sn` },
                                { etiket: 'Değişiklik', deger: `${sonuc.istatistik.toplamDegisim}` },
                            ].map((k) => (
                                <div key={k.etiket} className="rounded-xl p-2.5 border border-line">
                                    <p className="text-[9px] font-black uppercase tracking-wider text-ink-3">{k.etiket}</p>
                                    <p className="text-sm font-black text-ink mt-0.5 truncate">{k.deger}</p>
                                </div>
                            ))}
                        </div>
                        {Object.keys(sonuc.istatistik.dersSureMs || {}).length > 0 && (
                            <div className="space-y-1 pt-1">
                                {Object.entries(sonuc.istatistik.dersSureMs).map(([ders, ms]) => (
                                    <div key={ders} className="flex items-center gap-2 tip-mini">
                                        <span className="w-16 sm:w-20 text-ink-2 font-bold truncate shrink-0">{ders}</span>
                                        <div className="flex-1 h-2 rounded-full bg-surface-3 overflow-hidden">
                                            <div className="h-full bg-brand rounded-full"
                                                style={{ width: `${Math.min(100, Math.round((ms / (sonuc.istatistik.toplamSureMs || 1)) * 100))}%` }} />
                                        </div>
                                        <span className="text-ink-3 tabular-nums shrink-0 w-10 text-right">{Math.round(ms / 1000)} sn</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {(kaynak.pdfCevapUrl || kaynak.pdfCevapData) && (
                    <button onClick={() => window.open(kaynak.pdfCevapUrl || kaynak.pdfCevapData, '_blank', 'noopener')}
                        className="w-full py-2.5 rounded-xl bg-ok-soft text-ok font-black text-sm flex items-center justify-center gap-2">
                        <FileText size={16} /> Cevap Anahtarını Gör (PDF)
                    </button>
                )}
                <p className="tip-mini text-ink-3 text-center">Sonucun (net + süre/hata istatistikleri) koçunun paneline otomatik iletildi.</p>
                <button onClick={kapat} className="w-full py-2.5 rounded-xl bg-brand text-white font-black text-sm flex items-center justify-center gap-2">
                    <ChevronLeft size={16} /> Denemelere Dön
                </button>
            </div>
        );
    }

    // ══ 2. GÖRÜNÜM: ÇÖZÜM ═══════════════════════════════════
    if (oturum && kaynak) {
        const soru = kaynak.sorular[soruSira];
        const isaretli = Object.keys(cevaplar).filter((k) => cevaplar[k]).length;
        const sonSoru = soruSira === kaynak.sorular.length - 1;
        const kitapcikAdres = kaynak.pdfUrl || kaynak.pdfData;

        return (
            <div className="space-y-4 max-w-3xl mx-auto">
                <div className="card p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-sm font-black text-ink truncate m-0">{kaynak.ad}</p>
                        <p className="tip-mini text-ink-3 m-0 flex items-center gap-1">
                            <Clock size={11} /> {kaynak.sureDk || '—'} dk · {kaynak.tur}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {kitapcikAdres && (
                            <>
                                <button onClick={() => setKitapcikAcik((a) => !a)}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition ${kitapcikAcik ? 'bg-danger text-white' : 'bg-danger-soft text-danger'}`}>
                                    <FileText size={13} /> {kitapcikAcik ? 'Kitapçığı Gizle' : 'Kitapçık'}
                                </button>
                                <button onClick={() => window.open(kitapcikAdres, '_blank', 'noopener')} title="Tam ekran aç"
                                    className="px-2 py-1.5 rounded-lg bg-surface-2 text-ink-2 border border-line text-xs font-bold inline-flex items-center gap-1">
                                    <Maximize2 size={13} />
                                </button>
                            </>
                        )}
                        <button onClick={() => setCizimAcik((a) => !a)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition ${cizimAcik ? 'bg-brand text-white' : 'bg-surface-2 text-ink-2 border border-line'}`}>
                            <PencilLine size={13} /> Çizim
                        </button>
                        <span className="tip-small font-black text-brand">{isaretli}/{kaynak.sorular.length}</span>
                    </div>
                </div>

                {kitapcikAdres && kitapcikAcik && (
                    <div className="card p-1.5">
                        {String(kitapcikAdres).startsWith('data:') ? (
                            <div className="overflow-y-auto rounded-lg border border-line bg-white" style={{ maxHeight: '52vh' }}>
                                <KitapcikGoruntuleyici src={kitapcikAdres} className="p-1" />
                            </div>
                        ) : (
                            <iframe src={kitapcikAdres} title="Soru Kitapçığı"
                                className="w-full rounded-lg border border-line bg-white" style={{ height: '70vh' }} />
                        )}
                        <p className="tip-mini text-ink-3 text-center mt-1">
                            Soruları yukarıda oku (kaydır), cevabını aşağıda işaretle. ⤢ ile tam ekran açabilirsin.
                        </p>
                    </div>
                )}

                <div className="card p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="tip-mini font-black uppercase tracking-wider text-ink-3">Soru {soruSira + 1} / {kaynak.sorular.length}</span>
                        <span className="tip-mini font-black px-2 py-0.5 rounded-full bg-brand-soft text-brand">{soru.ders}</span>
                    </div>
                    {soru.metin
                        ? <p className="text-sm text-ink leading-relaxed">{soru.metin}</p>
                        : <p className="text-sm text-ink-3 italic">Soru {soruSira + 1} — cevabını işaretle.</p>}
                    <div className="grid grid-cols-5 gap-2">
                        {(soru.secenekler || SIKLAR).map((sik) => {
                            const secili = cevaplar[soru.id] === sik;
                            return (
                                <button key={sik} onClick={() => cevapla(soru.id, sik)}
                                    className={`h-12 rounded-xl text-base font-black transition-all ${secili ? 'bg-brand text-white shadow-lg scale-105' : 'bg-surface-2 text-ink-2 border border-line hover:border-brand-line'}`}>
                                    {sik}
                                </button>
                            );
                        })}
                    </div>
                    <button onClick={() => cevapla(soru.id, '')} className="tip-mini text-ink-3 hover:text-ink-2 transition">Boş bırak</button>
                </div>

                {cizimAcik && (
                    <div className="card p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="tip-mini font-black uppercase tracking-wider text-ink-3 flex items-center gap-1.5">
                                <PencilLine size={12} /> Karalama
                            </span>
                            <button onClick={cizimTemizle} className="tip-mini font-bold text-danger inline-flex items-center gap-1">
                                <Eraser size={12} /> Temizle
                            </button>
                        </div>
                        <canvas ref={tuvalRef} width={640} height={360}
                            onMouseDown={cizimBasla} onMouseMove={ciz} onMouseUp={cizimBitir} onMouseLeave={cizimBitir}
                            onTouchStart={cizimBasla} onTouchMove={ciz} onTouchEnd={cizimBitir}
                            className="w-full rounded-xl border border-line bg-surface touch-none cursor-crosshair"
                            style={{ aspectRatio: '16 / 9' }} />
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <button onClick={() => soruyaGit(Math.max(0, soruSira - 1))} disabled={soruSira === 0}
                        className="flex-1 py-2.5 rounded-xl bg-surface-2 border border-line text-ink-2 font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-1.5">
                        <ChevronLeft size={15} /> Önceki
                    </button>
                    {sonSoru ? (
                        <button onClick={bitir}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-ok text-white font-black text-sm flex items-center justify-center gap-1.5">
                            <Send size={15} /> Bitir & Gönder
                        </button>
                    ) : (
                        <button onClick={() => soruyaGit(Math.min(kaynak.sorular.length - 1, soruSira + 1))}
                            className="flex-1 py-2.5 rounded-xl bg-brand text-white font-bold text-sm flex items-center justify-center gap-1.5">
                            Sonraki <ChevronRight size={15} />
                        </button>
                    )}
                </div>
                <button onClick={kapat} className="w-full tip-mini text-ink-3 hover:text-danger transition">Vazgeç (cevaplar kaydedildi)</button>
            </div>
        );
    }

    // ══ 1. GÖRÜNÜM: LİSTE ═══════════════════════════════════
    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-ink syne tracking-tight uppercase m-0">Deneme Çöz</h2>
                <p className="text-brand text-[10px] font-black tracking-[0.2em] mt-1 uppercase">KOÇUNUN ATADIĞI DENEMELERİ UYGULAMADA ÇÖZ</p>
            </div>

            {donut?.metin && (
                <div className="card p-4 border-l-4" style={{ borderLeftColor: 'var(--brand)', background: 'color-mix(in srgb, var(--brand) 6%, var(--surface))' }}>
                    <p className="tip-mini font-black uppercase tracking-wider text-brand m-0 mb-1 flex items-center gap-1.5">
                        <MessageSquare size={13} /> Koç Dönütü
                    </p>
                    <p className="text-sm text-ink leading-relaxed m-0 whitespace-pre-line">{donut.metin}</p>
                    <p className="tip-mini text-ink-3 m-0 mt-1.5">— {donut.kocAd || 'Koç'}</p>
                </div>
            )}

            {atananlar.length === 0 ? (
                <div className="card p-8 text-center">
                    <ClipboardList size={30} className="mx-auto text-ink-3 mb-3" />
                    <p className="tip-small text-ink-2 m-0">Şu an atanmış deneme yok. Koçun bir deneme atadığında burada görünür.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {atananlar.map((satir) => (
                        <div key={satir.atama.id} className={`card p-4 space-y-2 ${satir.acik ? '' : 'opacity-70'}`}>
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-sm font-black text-ink truncate m-0">{satir.kaynak.ad}</p>
                                    <p className="tip-mini text-ink-3 m-0">
                                        {satir.kaynak.tur} · {satir.kaynak.toplamSoru} soru
                                        {satir.kaynak.sureDk ? ` · ${satir.kaynak.sureDk} dk` : ''}
                                    </p>
                                </div>
                                {satir.cozuldu ? (
                                    <span className="tip-mini font-black text-ok inline-flex items-center gap-1 shrink-0">
                                        <CheckCircle2 size={12} /> Çözüldü
                                    </span>
                                ) : !satir.acik && (
                                    <span className="tip-mini font-black text-warn inline-flex items-center gap-1 shrink-0">
                                        <Clock size={12} /> {satir.acilisTarihi}
                                    </span>
                                )}
                            </div>
                            {satir.acik ? (
                                <button onClick={() => cozmeyeBasla(satir)}
                                    className={`w-full py-2 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${satir.cozuldu ? 'bg-surface-2 text-ink-2 border border-line hover:bg-surface-3' : 'bg-brand text-white hover:opacity-90'}`}>
                                    {satir.cozuldu
                                        ? <><RotateCcw size={13} /> Tekrar Çöz</>
                                        : <><BookOpen size={14} /> Çöz</>}
                                </button>
                            ) : (
                                <div className="w-full py-2 rounded-xl bg-surface-2 border border-line text-ink-3 font-bold text-xs flex items-center justify-center gap-1.5">
                                    <Clock size={13} /> {satir.acilisTarihi} tarihinde açılacak
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DenemeCoz;
