/**
 * 📝 Deneme Analizi Girişi — 4 adımlı sihirbaz (Deneme Analizi sistemi)
 *
 * Akış (araştırma temelli, form yükü bilinçli düşük):
 *   1. Deneme bilgisi (ad, tür, tarih, süre)
 *   2. Ders sonuçları — öğrencinin ALANINA uygun dersler, D/Y/B girilir,
 *      net OTOMATİK hesaplanır (4 yanlış = 1 doğru)
 *   3. Konu hataları — Ders → Konu → adet → HATA NEDENİ (manuel!)
 *   4. Öz değerlendirme — süre/odak/duygu/memnuniyet + sonraki hedef
 *
 * Otomatik/manuel ayrımı: sayısal sonuç otomatik hesaplanır; "neden
 * yanlış yaptım" bilgisi ASLA otomatik üretilmez, yalnız öğrenci girer.
 */
import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, ClipboardList } from 'lucide-react';
import Modal from '../ui/Modal';
import { bildir } from '../../services/uiGeriBildirim';
import { ogrencininDersleri, dersinKonulari } from '../../utils/dersKonu';
import { HATA_NEDENLERI } from '../../data/hataNedenleri';
import denemeKayitlari, { netHesapla } from '../../services/denemeKayitlari';

const GIRDI = 'w-full bg-surface border border-line rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand/40';
const ETIKET = 'tip-label text-ink-3 block mb-1';

const SECENEK = ({ deger, secili, onSec, children }) => (
    <button
        type="button"
        onClick={() => onSec(deger)}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
            secili === deger ? 'bg-brand text-white border-brand' : 'bg-surface text-ink-2 border-line hover:bg-surface-2'
        }`}
    >
        {children}
    </button>
);

const ADIMLAR = ['Deneme', 'Ders Sonuçları', 'Konu Hataları', 'Değerlendirme'];

export default function DenemeAnaliziGiris({ ogrenci, onKapat, onKaydedildi }) {
    const [adim, setAdim] = useState(0);
    const [bilgi, setBilgi] = useState({
        ad: '', tur: 'TYT', tarih: new Date().toISOString().slice(0, 10), sureDk: '',
    });
    const [dersSonuc, setDersSonuc] = useState({});   // { <dersAd>: {dogru,yanlis,bos} }
    const [hatalar, setHatalar] = useState([]);        // [{ders,konu,adet,nedenler,not}]
    const [degerlendirme, setDegerlendirme] = useState({
        sure: null, odak: null, duygu: null, zorlanilanDers: '',
        memnuniyet: 0, sonrakiHedef: '', not: '',
    });

    const dersler = useMemo(() => ogrencininDersleri(ogrenci), [ogrenci]);
    const girilenDersler = Object.entries(dersSonuc)
        .filter(([, s]) => (Number(s.dogru) || 0) + (Number(s.yanlis) || 0) + (Number(s.bos) || 0) > 0)
        .map(([ad]) => ad);

    const dersGuncelle = (ad, alan, deger) =>
        setDersSonuc((p) => ({ ...p, [ad]: { ...p[ad], [alan]: deger } }));

    const hataEkle = () => setHatalar((p) => [...p, { ders: girilenDersler[0] || dersler[0]?.ad || '', konu: '', adet: 1, nedenler: [], not: '' }]);
    const hataGuncelle = (i, degisim) => setHatalar((p) => p.map((h, j) => (j === i ? { ...h, ...degisim } : h)));
    const hataSil = (i) => setHatalar((p) => p.filter((_, j) => j !== i));

    const nedenAcKapa = (i, nedenId) => {
        const h = hatalar[i];
        const yeni = h.nedenler.includes(nedenId)
            ? h.nedenler.filter((n) => n !== nedenId)
            : [...h.nedenler, nedenId].slice(-2); // en fazla 2 neden: analiz değeri düşmeden form yükü sınırlı
        hataGuncelle(i, { nedenler: yeni });
    };

    const ileriOlur = adim === 0 ? bilgi.ad.trim().length > 0
        : adim === 1 ? girilenDersler.length > 0
        : true;

    const kaydet = () => {
        const sonuc = denemeKayitlari.kaydet({
            studentId: ogrenci?.id,
            studentName: ogrenci?.name,
            ...bilgi,
            dersler: dersSonuc,
            konuHatalari: hatalar,
            degerlendirme,
        });
        if (!sonuc.basarili) { bildir(sonuc.hata, 'uyari'); return; }
        bildir('Deneme analizi kaydedildi ve buluta gönderildi.', 'basari');
        onKaydedildi?.(sonuc.kayit);
        onKapat?.();
    };

    return (
        <Modal
            acik
            onClose={onKapat}
            baslik={(
                <span className="flex items-center gap-2">
                    <ClipboardList size={18} className="text-brand" />
                    Deneme Analizi — {ADIMLAR[adim]} ({adim + 1}/4)
                </span>
            )}
            genislik="lg"
            govdeClassName="p-5"
            altCubuk={(
                <>
                    {adim > 0 && (
                        <button type="button" onClick={() => setAdim((a) => a - 1)}
                            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-surface-3 text-ink-2 text-sm font-bold">
                            <ChevronLeft size={14} /> Geri
                        </button>
                    )}
                    {adim < 3 ? (
                        <button type="button" disabled={!ileriOlur} onClick={() => setAdim((a) => a + 1)}
                            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-brand text-white text-sm font-bold disabled:opacity-40">
                            İleri <ChevronRight size={14} />
                        </button>
                    ) : (
                        <button type="button" onClick={kaydet}
                            className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-bold">
                            Kaydet
                        </button>
                    )}
                </>
            )}
        >
            {/* ── 1. Deneme bilgisi ─────────────────────────────── */}
            {adim === 0 && (
                <div className="space-y-3">
                    <div>
                        <label className={ETIKET} htmlFor="da-ad">Deneme adı *</label>
                        <input id="da-ad" value={bilgi.ad} placeholder="Örn. 3D 5. TYT Denemesi"
                            onChange={(e) => setBilgi((p) => ({ ...p, ad: e.target.value }))} className={GIRDI} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className={ETIKET} htmlFor="da-tur">Tür</label>
                            <select id="da-tur" value={bilgi.tur}
                                onChange={(e) => setBilgi((p) => ({ ...p, tur: e.target.value }))} className={GIRDI}>
                                <option>TYT</option><option>AYT</option><option>Branş</option><option>Diğer</option>
                            </select>
                        </div>
                        <div>
                            <label className={ETIKET} htmlFor="da-tarih">Tarih</label>
                            <input id="da-tarih" type="date" value={bilgi.tarih} max={new Date().toISOString().slice(0, 10)}
                                onChange={(e) => setBilgi((p) => ({ ...p, tarih: e.target.value }))} className={GIRDI} />
                        </div>
                        <div>
                            <label className={ETIKET} htmlFor="da-sure">Süre (dk)</label>
                            <input id="da-sure" type="number" min="0" inputMode="numeric" value={bilgi.sureDk} placeholder="165"
                                onChange={(e) => setBilgi((p) => ({ ...p, sureDk: e.target.value }))} className={GIRDI} />
                        </div>
                    </div>
                </div>
            )}

            {/* ── 2. Ders sonuçları ─────────────────────────────── */}
            {adim === 1 && (
                <div className="space-y-2">
                    <p className="tip-caption mb-2">Girdiğin derslerin neti otomatik hesaplanır (4 yanlış = 1 doğru). Boş bıraktığın ders kaydedilmez.</p>
                    <div className="grid grid-cols-[1fr_repeat(4,3.2rem)] gap-2 items-center text-xs font-bold text-ink-3 px-1">
                        <span>Ders</span><span className="text-center">D</span><span className="text-center">Y</span><span className="text-center">B</span><span className="text-center">Net</span>
                    </div>
                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                        {dersler.map((d) => {
                            const s = dersSonuc[d.ad] || {};
                            const net = netHesapla(s.dogru, s.yanlis);
                            return (
                                <div key={d.ad} className="grid grid-cols-[1fr_repeat(4,3.2rem)] gap-2 items-center">
                                    <span className="text-sm font-medium text-ink truncate">{d.ad}</span>
                                    {['dogru', 'yanlis', 'bos'].map((alan) => (
                                        <input key={alan} type="number" min="0" inputMode="numeric"
                                            aria-label={`${d.ad} ${alan}`}
                                            value={s[alan] ?? ''}
                                            onChange={(e) => dersGuncelle(d.ad, alan, e.target.value)}
                                            className="bg-surface border border-line rounded-lg px-1 py-1.5 text-sm text-ink text-center focus:outline-none focus:border-brand/40" />
                                    ))}
                                    <span className={`text-sm font-black text-center ${net > 0 ? 'text-ink' : 'text-ink-3'}`}>
                                        {(Number(s.dogru) || 0) + (Number(s.yanlis) || 0) + (Number(s.bos) || 0) > 0 ? net : '—'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── 3. Konu hataları + NEDENLER (manuel) ──────────── */}
            {adim === 2 && (
                <div className="space-y-3">
                    <p className="tip-caption">
                        Yanlış/boş bıraktığın konuları ekle ve <strong>nedenini sen seç</strong> — sistem neden tahmin etmez. (Her hata için en fazla 2 neden.)
                    </p>
                    {hatalar.map((h, i) => {
                        const konular = dersinKonulari(dersler, h.ders);
                        return (
                            <div key={i} className="border border-line rounded-2xl p-3 space-y-2 bg-surface-2/40">
                                <div className="flex items-center gap-2">
                                    <select value={h.ders} aria-label="Ders"
                                        onChange={(e) => hataGuncelle(i, { ders: e.target.value, konu: '' })}
                                        className={`${GIRDI} flex-1`}>
                                        {(girilenDersler.length ? girilenDersler : dersler.map((d) => d.ad)).map((ad) => <option key={ad}>{ad}</option>)}
                                    </select>
                                    <select value={h.konu} aria-label="Konu"
                                        onChange={(e) => hataGuncelle(i, { konu: e.target.value })}
                                        className={`${GIRDI} flex-1`}>
                                        <option value="">— Konu seç —</option>
                                        {konular.map((k) => <option key={k}>{k}</option>)}
                                    </select>
                                    <input type="number" min="1" aria-label="Hata adedi" value={h.adet}
                                        onChange={(e) => hataGuncelle(i, { adet: e.target.value })}
                                        className="w-16 bg-surface border border-line rounded-xl px-2 py-2 text-sm text-ink text-center" />
                                    <button type="button" onClick={() => hataSil(i)} aria-label="Hatayı sil"
                                        className="p-2 rounded-lg text-ink-3 hover:text-danger hover:bg-danger/10">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {HATA_NEDENLERI.map((n) => (
                                        <button key={n.id} type="button" onClick={() => nedenAcKapa(i, n.id)}
                                            className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition ${
                                                h.nedenler.includes(n.id)
                                                    ? 'bg-brand text-white border-brand'
                                                    : 'bg-surface text-ink-3 border-line hover:text-ink-2'
                                            }`}>
                                            {n.ad}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    <button type="button" onClick={hataEkle}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-3 text-ink-2 text-xs font-bold hover:bg-surface-2">
                        <Plus size={14} /> Konu Hatası Ekle
                    </button>
                </div>
            )}

            {/* ── 4. Öz değerlendirme ───────────────────────────── */}
            {adim === 3 && (
                <div className="space-y-4">
                    <div>
                        <p className={ETIKET}>Süre yetti mi?</p>
                        <div className="flex gap-2">
                            {[['evet', 'Evet'], ['kismen', 'Kısmen'], ['hayir', 'Hayır']].map(([v, l]) => (
                                <SECENEK key={v} deger={v} secili={degerlendirme.sure} onSec={(x) => setDegerlendirme((p) => ({ ...p, sure: x }))}>{l}</SECENEK>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className={ETIKET}>Odak / dikkat durumun?</p>
                        <div className="flex gap-2">
                            {[['iyi', 'İyiydi'], ['orta', 'Dalgalıydı'], ['daginik', 'Dağınıktı']].map(([v, l]) => (
                                <SECENEK key={v} deger={v} secili={degerlendirme.odak} onSec={(x) => setDegerlendirme((p) => ({ ...p, odak: x }))}>{l}</SECENEK>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className={ETIKET}>Sınav sırasında nasıl hissettin?</p>
                        <div className="flex gap-2">
                            {[['sakin', 'Sakin'], ['normal', 'Normal'], ['kaygili', 'Kaygılı']].map(([v, l]) => (
                                <SECENEK key={v} deger={v} secili={degerlendirme.duygu} onSec={(x) => setDegerlendirme((p) => ({ ...p, duygu: x }))}>{l}</SECENEK>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={ETIKET} htmlFor="da-zor">En çok zorlandığın ders</label>
                            <select id="da-zor" value={degerlendirme.zorlanilanDers}
                                onChange={(e) => setDegerlendirme((p) => ({ ...p, zorlanilanDers: e.target.value }))} className={GIRDI}>
                                <option value="">— Seç —</option>
                                {(girilenDersler.length ? girilenDersler : dersler.map((d) => d.ad)).map((ad) => <option key={ad}>{ad}</option>)}
                            </select>
                        </div>
                        <div>
                            <p className={ETIKET}>Sonuçtan memnuniyet</p>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((y) => (
                                    <button key={y} type="button" aria-label={`${y} yıldız`}
                                        onClick={() => setDegerlendirme((p) => ({ ...p, memnuniyet: y }))}
                                        className={`text-xl leading-none ${y <= degerlendirme.memnuniyet ? '' : 'opacity-25'}`}>⭐</button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className={ETIKET} htmlFor="da-hedef">Bir sonraki denemede neyi değiştireceksin?</label>
                        <input id="da-hedef" value={degerlendirme.sonrakiHedef} placeholder="Örn. Türkçe'ye 5 dk fazla ayıracağım"
                            onChange={(e) => setDegerlendirme((p) => ({ ...p, sonrakiHedef: e.target.value }))} className={GIRDI} />
                    </div>
                    <div>
                        <label className={ETIKET} htmlFor="da-not">Deneme sonu notu (isteğe bağlı)</label>
                        <textarea id="da-not" rows={2} value={degerlendirme.not}
                            onChange={(e) => setDegerlendirme((p) => ({ ...p, not: e.target.value }))} className={GIRDI} />
                    </div>
                </div>
            )}
        </Modal>
    );
}
