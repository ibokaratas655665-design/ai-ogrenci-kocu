import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight, CheckCircle2, AlertTriangle, Lock, Loader2 } from 'lucide-react';
import sunucu from '../services/kayitSunucu';
import credential from '../services/credentialService';

/**
 * 🎓 DAVETLE KATILIM
 *
 * Koçun paylaştığı bağlantı ya da QR bu sayfayı açar.
 *
 * ⚠️ BU SAYFA ÖNCEDEN HİÇBİR ZAMAN ÇALIŞMADI. Davet kaydı koçun
 * tarayıcısındaki localStorage'daydı; öğrenci linki kendi telefonunda
 * açtığında o cihazda kayıt bulunmadığı için hep "Böyle bir davet
 * bulunamadı" diyordu. Katılım da öğrencinin kendi tarayıcısına yazılıp
 * orada kalıyor, koça asla ulaşmıyordu.
 *
 * Artık davet SUNUCUDAN okunuyor, öğrenciye gerçek bir hesap açılıyor ve
 * katılım talebi doğrudan veritabanına yazılıyor. Aradaki hiçbir adım
 * öğrencinin cihazına bağlı değil.
 *
 * Kayıt her hâlükârda ONAY BEKLER: davet bağlantısı bir grup sohbetine
 * düşerse tanımadığı kişiler koçun listesine sızmasın diye.
 */

const JoinPage = () => {
    const navigate = useNavigate();

    const [kod, setKod] = useState('');
    const [davet, setDavet] = useState(null);
    const [hata, setHata] = useState('');
    const [tamam, setTamam] = useState(false);
    const [araniyor, setAraniyor] = useState(false);
    const [gonderiliyor, setGonderiliyor] = useState(false);

    const [f, setF] = useState({
        ad: '', okulNo: '', sinif: '', sube: '',
        veliAd: '', veliTel: '', sifre: '',
    });
    const yaz = (k, v) => setF((p) => ({ ...p, [k]: v }));
    const sifreDurumu = credential.sifreGucu(f.sifre);

    /** Kodu sunucuda arar. */
    const koduDogrula = useCallback(async (girilen) => {
        const temiz = sunucu.normalize(girilen);
        if (temiz.length < 6) { setHata('Davet kodu 6 karakter olmalı.'); return; }

        setHata('');
        setAraniyor(true);
        try {
            const bulunan = await sunucu.davetOku(temiz);
            const r = sunucu.davetDogrula(bulunan);
            if (!r.gecerli) { setHata(r.hata); setDavet(null); return; }
            setDavet(r.davet);
            if (r.davet.sinif) yaz('sinif', r.davet.sinif);
        } catch {
            setHata('Davet bilgisi alınamadı. İnternet bağlantınızı kontrol edin.');
        } finally {
            setAraniyor(false);
        }
    }, []);

    // Bağlantıdaki kodu otomatik dener
    useEffect(() => {
        const q = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const k = q.get('kod');
        if (!k) return;
        setKod(sunucu.normalize(k));
        koduDogrula(k);
    }, [koduDogrula]);

    const katil = async () => {
        setHata('');
        if (!f.ad.trim() || !String(f.okulNo).trim()) {
            setHata('Ad soyad ve okul numarası zorunludur.');
            return;
        }
        if (!sifreDurumu.gecerli) {
            setHata(`Şifre yeterince güçlü değil: ${sifreDurumu.sorunlar[0]}`);
            return;
        }

        setGonderiliyor(true);
        try {
            const sonuc = await sunucu.katilimGonder({
                davet,
                ogrenci: {
                    ad: f.ad, okulNo: f.okulNo, sinif: f.sinif, sube: f.sube,
                    veliAd: f.veliAd, veliTel: f.veliTel,
                },
                sifre: f.sifre,
            });
            if (!sonuc.basarili) { setHata(sonuc.hata); return; }
            setTamam(true);
        } catch (e) {
            setHata(e?.message || 'Katılım tamamlanamadı.');
        } finally {
            setGonderiliyor(false);
        }
    };

    // ── Başarı ekranı ───────────────────────────────
    if (tamam) {
        return (
            <div className="min-h-screen bg-page flex items-center justify-center p-4">
                <div className="srf srf-3 max-w-md w-full p-7 text-center space-y-3">
                    <span className="sec-icon mx-auto" style={{ '--acc': 'var(--ok)' }}>
                        <CheckCircle2 size={18} />
                    </span>
                    <h1 className="h2">Kaydınız Alındı</h1>
                    <p className="text-[12px] text-ink-2 leading-snug">
                        <strong className="text-ink">{davet?.kocAd || 'Koçunuz'}</strong> onayladıktan
                        sonra giriş yapabilirsiniz. Onay geldiğinde <strong className="text-ink">{f.okulNo}</strong> okul
                        numaranız ve belirlediğiniz şifreyle giriş yapın.
                    </p>
                    <button onClick={() => navigate('/login')} className="b b-fill b-brand w-full">
                        Giriş Ekranına Git <ArrowRight size={15} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-page flex items-center justify-center p-4">
            <div className="srf srf-3 max-w-lg w-full p-7 space-y-4">

                <div className="flex items-start gap-3">
                    <span className="sec-icon" style={{ '--acc': 'var(--brand)' }}>
                        <GraduationCap size={17} />
                    </span>
                    <div className="min-w-0">
                        <h1 className="h2">Koçuna Katıl</h1>
                        <p className="text-[11px] text-ink-3 mt-0.5 leading-snug">
                            Koçunuzun verdiği davet kodunu girin, bilgilerinizi tamamlayın.
                        </p>
                    </div>
                </div>

                {/* ── Kod adımı ─────────────────────────── */}
                {!davet && (
                    <>
                        <label className="block">
                            <span className="eyebrow block mb-1">Davet Kodu</span>
                            <input
                                className="fld w-full tracking-[0.3em] font-black text-center text-lg"
                                maxLength={6}
                                value={kod}
                                disabled={araniyor}
                                onChange={(e) => setKod(sunucu.normalize(e.target.value))}
                                onKeyDown={(e) => e.key === 'Enter' && koduDogrula(kod)}
                                placeholder="ABC123"
                            />
                        </label>
                        <button
                            onClick={() => koduDogrula(kod)}
                            disabled={kod.length < 6 || araniyor}
                            className="b b-fill b-brand w-full disabled:opacity-50"
                        >
                            {araniyor
                                ? <><Loader2 size={15} className="animate-spin" /> Davet aranıyor…</>
                                : <>Devam Et <ArrowRight size={15} /></>}
                        </button>
                    </>
                )}

                {/* ── Bilgi adımı ───────────────────────── */}
                {davet && (
                    <>
                        <div className="rounded-xl border border-ok bg-ok-soft p-3">
                            <p className="text-[12px] text-ink leading-snug">
                                <strong>{davet.kocAd || 'Koçunuza'}</strong> katılıyorsunuz.
                                {/* Bağlı davet: koçun elle eklediği mevcut kayda giriş açılıyor.
                                    Öğrenci kime ait bir bağlantı kullandığını görmeli. */}
                                {davet.ogrenciId && davet.ogrenciAd && (
                                    <span className="block text-ink-2 mt-0.5">
                                        Bu bağlantı <strong className="text-ink">{davet.ogrenciAd}</strong> için
                                        oluşturuldu; mevcut kaydınız korunacak.
                                    </span>
                                )}
                                {davet.not && !davet.ogrenciId && (
                                    <span className="block text-ink-2 mt-0.5">{davet.not}</span>
                                )}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="block sm:col-span-2">
                                <span className="eyebrow block mb-1">Ad Soyad *</span>
                                <input className="fld w-full" value={f.ad}
                                    name="ad" autoComplete="off" data-lpignore="true"
                                    onChange={(e) => yaz('ad', e.target.value)} />
                            </label>
                            <label className="block">
                                <span className="eyebrow block mb-1">Okul Numarası *</span>
                                {/* ⚠️ AUTOFILL KORUMASI
                                    Bu alan öğrencinin GİRİŞ KİMLİĞİ oluyor. Koruma yokken
                                    tarayıcı otomatik doldurma buraya telefon numarası
                                    yazabiliyordu; öğrenci farkında olmadan yanlış bir
                                    kullanıcı adıyla kaydoluyor ve sonra giriş yapamıyordu. */}
                                <input className="fld w-full" value={f.okulNo}
                                    name="okulNo"
                                    autoComplete="off"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    data-lpignore="true"
                                    onChange={(e) => yaz('okulNo', e.target.value)} />
                                <span className="text-[10px] text-ink-3 block mt-1 leading-snug">
                                    <strong className="text-ink-2">Giriş kullanıcı adınız bu olacak.</strong>{' '}
                                    Telefon numarası değil, okul numaranızı yazın.
                                </span>
                            </label>
                            <label className="block">
                                <span className="eyebrow block mb-1">Sınıf</span>
                                <input className="fld w-full" value={f.sinif} placeholder="Örn. 11"
                                    onChange={(e) => yaz('sinif', e.target.value)} />
                            </label>
                            <label className="block">
                                <span className="eyebrow block mb-1">Şube</span>
                                <input className="fld w-full" value={f.sube} placeholder="Örn. A"
                                    onChange={(e) => yaz('sube', e.target.value)} />
                            </label>
                            <label className="block">
                                <span className="eyebrow block mb-1">Veli Adı</span>
                                <input className="fld w-full" value={f.veliAd}
                                    onChange={(e) => yaz('veliAd', e.target.value)} />
                            </label>
                            <label className="block sm:col-span-2">
                                <span className="eyebrow block mb-1">Veli Telefonu</span>
                                <input className="fld w-full" value={f.veliTel} placeholder="0555 555 55 55"
                                    type="tel" inputMode="tel" name="veliTel" autoComplete="tel"
                                    onChange={(e) => yaz('veliTel', e.target.value)} />
                            </label>
                            <label className="block sm:col-span-2">
                                <span className="eyebrow block mb-1">Şifreniz *</span>
                                <div className="relative">
                                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
                                    <input
                                        type="password"
                                        className="fld w-full pl-9"
                                        value={f.sifre}
                                        onChange={(e) => yaz('sifre', e.target.value)}
                                        autoComplete="new-password"
                                        placeholder="En az 8 karakter, büyük/küçük harf ve rakam"
                                    />
                                </div>
                                {f.sifre && (
                                    <p className={`text-[11px] font-bold mt-1 ${
                                        sifreDurumu.seviye === 'güçlü' ? 'text-ok'
                                            : sifreDurumu.seviye === 'orta' ? 'text-warn' : 'text-danger'
                                    }`}>
                                        Şifre gücü: {sifreDurumu.seviye}
                                        {sifreDurumu.sorunlar[0] && ` — ${sifreDurumu.sorunlar[0]}`}
                                    </p>
                                )}
                            </label>
                        </div>

                        <button
                            onClick={katil}
                            disabled={gonderiliyor}
                            className="b b-fill b-brand w-full disabled:opacity-50"
                        >
                            {gonderiliyor
                                ? <><Loader2 size={15} className="animate-spin" /> Gönderiliyor…</>
                                : 'Katılım Talebi Gönder'}
                        </button>

                        <p className="text-[11px] text-ink-3 leading-snug">
                            Kaydınız koç onayına düşer; onaylanana kadar giriş yapamazsınız.
                        </p>
                    </>
                )}

                {hata && (
                    <div className="flex items-start gap-2 rounded-xl border border-danger bg-danger-soft p-3">
                        <AlertTriangle size={14} className="text-danger shrink-0 mt-0.5" />
                        <p className="text-[11px] font-bold text-danger leading-snug">{hata}</p>
                    </div>
                )}

                <button onClick={() => navigate('/login')} className="b b-bare b-sm w-full">
                    Zaten hesabım var — giriş yap
                </button>
            </div>
        </div>
    );
};

export default JoinPage;
