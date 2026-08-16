import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';
import invites from '../services/inviteService';
import credential from '../services/credentialService';

/**
 * 🎓 DAVETLE KATILIM
 *
 * Koçun paylaştığı bağlantı ya da QR bu sayfayı açar. Öğrenci kendi
 * bilgilerini girer, şifresini belirler ve koçun listesine düşer.
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
    const [gonderiliyor, setGonderiliyor] = useState(false);

    const [f, setF] = useState({
        name: '', schoolNumber: '', grade: '', section: '',
        parentName: '', parentPhone: '', sifre: '',
    });
    const yaz = (k, v) => setF((p) => ({ ...p, [k]: v }));
    const sifreDurumu = credential.sifreGucu(f.sifre);

    // Bağlantıdaki kodu otomatik dener
    useEffect(() => {
        const q = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const k = q.get('kod');
        if (k) {
            setKod(k.toLocaleUpperCase('tr-TR'));
            const r = invites.dogrula(k);
            if (r.gecerli) {
                setDavet(r.davet);
                if (r.davet.sinif) yaz('grade', r.davet.sinif);
            } else {
                setHata(r.hata);
            }
        }
    }, []);

    const koduDogrula = () => {
        setHata('');
        const r = invites.dogrula(kod);
        if (!r.gecerli) { setHata(r.hata); setDavet(null); return; }
        setDavet(r.davet);
        if (r.davet.sinif) yaz('grade', r.davet.sinif);
    };

    const katil = async () => {
        setHata('');
        if (!f.name.trim() || !f.schoolNumber.trim()) {
            setHata('Ad soyad ve okul numarası zorunludur.');
            return;
        }
        if (!sifreDurumu.gecerli) {
            setHata(`Şifre yeterince güçlü değil: ${sifreDurumu.sorunlar[0]}`);
            return;
        }

        setGonderiliyor(true);
        try {
            // Şifre düz metin saklanmaz; yalnızca PBKDF2 özeti gider
            const sifreOzeti = await credential.hashle(f.sifre);
            const sonuc = invites.katil(davet.kod, { ...f, sifreOzeti });
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
                        <strong className="text-ink">{davet.kocAd || 'Koçunuz'}</strong> onayladıktan
                        sonra giriş yapabilirsiniz. Onay geldiğinde okul numaranız ve belirlediğiniz
                        şifreyle giriş yapın.
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
                                onChange={(e) => setKod(e.target.value.toLocaleUpperCase('tr-TR'))}
                                onKeyDown={(e) => e.key === 'Enter' && koduDogrula()}
                                placeholder="ABC123"
                            />
                        </label>
                        <button onClick={koduDogrula} disabled={kod.length < 6} className="b b-fill b-brand w-full disabled:opacity-50">
                            Devam Et <ArrowRight size={15} />
                        </button>
                    </>
                )}

                {/* ── Bilgi adımı ───────────────────────── */}
                {davet && (
                    <>
                        <div className="rounded-xl border border-ok bg-ok-soft p-3">
                            <p className="text-[12px] text-ink leading-snug">
                                <strong>{davet.kocAd || 'Koçunuza'}</strong> katılıyorsunuz.
                                {davet.not && <span className="block text-ink-2 mt-0.5">{davet.not}</span>}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="block sm:col-span-2">
                                <span className="eyebrow block mb-1">Ad Soyad *</span>
                                <input className="fld w-full" value={f.name}
                                    onChange={(e) => yaz('name', e.target.value)} />
                            </label>
                            <label className="block">
                                <span className="eyebrow block mb-1">Okul Numarası *</span>
                                <input className="fld w-full" value={f.schoolNumber}
                                    onChange={(e) => yaz('schoolNumber', e.target.value)} />
                            </label>
                            <label className="block">
                                <span className="eyebrow block mb-1">Sınıf</span>
                                <input className="fld w-full" value={f.grade} placeholder="Örn. 11"
                                    onChange={(e) => yaz('grade', e.target.value)} />
                            </label>
                            <label className="block">
                                <span className="eyebrow block mb-1">Şube</span>
                                <input className="fld w-full" value={f.section} placeholder="Örn. A"
                                    onChange={(e) => yaz('section', e.target.value)} />
                            </label>
                            <label className="block">
                                <span className="eyebrow block mb-1">Veli Adı</span>
                                <input className="fld w-full" value={f.parentName}
                                    onChange={(e) => yaz('parentName', e.target.value)} />
                            </label>
                            <label className="block sm:col-span-2">
                                <span className="eyebrow block mb-1">Veli Telefonu</span>
                                <input className="fld w-full" value={f.parentPhone} placeholder="0555 555 55 55"
                                    onChange={(e) => yaz('parentPhone', e.target.value)} />
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
                            {gonderiliyor ? 'Gönderiliyor…' : 'Katılım Talebi Gönder'}
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
