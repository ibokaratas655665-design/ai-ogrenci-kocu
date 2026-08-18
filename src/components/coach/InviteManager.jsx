import React, { useState, useRef, useEffect } from 'react';
import { Link2, Plus, Copy, Trash2, Power, X, QrCode, Users, Download, Loader2, CloudOff } from 'lucide-react';
import sunucu from '../../services/kayitSunucu';
import Modal from '../ui/Modal';

/**
 * 🔗 ÖĞRENCİ DAVETLERİ
 *
 * Koç bir kod üretir, öğrenciye linki ya da QR'ı gönderir; öğrenci kendi
 * bilgilerini girip koçun onay listesine düşer.
 *
 * ⚠️ DAVETLER ARTIK SUNUCUDA. Eskiden `student_invites` anahtarıyla
 * koçun localStorage'ında duruyorlardı ve o anahtar senkronize bile
 * edilmiyordu; öğrencinin cihazı daveti hiçbir zaman göremiyordu. Liste
 * artık Firestore'dan canlı geliyor — koç telefondan davet üretip
 * bilgisayardan yönetebiliyor, öğrenci de linki herhangi bir cihazda
 * açabiliyor.
 */

const InviteManager = ({ user, setToast }) => {
    const [formAcik, setFormAcik] = useState(false);
    const [qrKod, setQrKod] = useState(null);
    const [liste, setListe] = useState([]);
    const [kocUid, setKocUid] = useState(sunucu.benimUid());
    const [yukleniyor, setYukleniyor] = useState(true);

    // Firebase kimliği açılışta gecikebilir; değiştikçe izlenir.
    useEffect(() => sunucu.uidIzle(setKocUid), []);

    useEffect(() => {
        if (!kocUid) { setListe([]); setYukleniyor(false); return undefined; }
        setYukleniyor(true);
        const bitir = sunucu.davetleriIzle(kocUid, (d) => {
            setListe(d);
            setYukleniyor(false);
        });
        return bitir;
    }, [kocUid]);

    const kopyala = async (metin, mesaj) => {
        try {
            await navigator.clipboard.writeText(metin);
            setToast?.(mesaj);
        } catch {
            setToast?.(metin);   // Pano izni yoksa kullanıcı elle kopyalasın
        }
    };

    /**
     * Bulut oturumu yoksa davet üretilemez — davetin sunucuda durması
     * akışın temeli. Sessizce başarısız olmak yerine açıkça söylenir.
     */
    if (!kocUid && !yukleniyor) {
        return (
            <div className="srf p-8 text-center">
                <CloudOff size={26} className="text-warn mx-auto mb-2" />
                <p className="text-xs font-bold text-ink">Bulut oturumu açık değil</p>
                <p className="text-[11px] text-ink-3 mt-1 max-w-sm mx-auto leading-snug">
                    Davetler sunucuda tutulduğu için bu bölüm bulut bağlantısı ister.
                    Çıkış yapıp tekrar giriş yapın; sorun sürerse internet bağlantınızı kontrol edin.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">

            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                    <span className="sec-icon" style={{ '--acc': 'var(--accent)' }}>
                        <Link2 size={16} />
                    </span>
                    <div className="min-w-0">
                        <h3 className="h3">Öğrenci Davetleri</h3>
                        <p className="text-[11px] text-ink-3 leading-snug">
                            Davet linki ya da QR gönderin; öğrenci kendi bilgilerini girsin.
                            Katılım onayınıza düşer.
                        </p>
                    </div>
                </div>
                <button onClick={() => setFormAcik(true)} className="b b-fill b-brand">
                    <Plus size={14} /> Davet Oluştur
                </button>
            </div>

            {yukleniyor ? (
                <div className="srf p-10 text-center">
                    <Loader2 size={24} className="text-ink-3 mx-auto mb-2 animate-spin" />
                    <p className="text-[11px] text-ink-3">Davetler yükleniyor…</p>
                </div>
            ) : liste.length === 0 ? (
                <div className="srf p-10 text-center">
                    <Link2 size={28} className="text-ink-3 mx-auto mb-2" />
                    <p className="text-xs font-bold text-ink-3">Henüz davet oluşturmadınız</p>
                    <p className="text-[11px] text-ink-3 mt-1 max-w-xs mx-auto leading-snug">
                        Bir davet oluşturup linkini paylaşın; öğrenciler kendileri katılsın,
                        siz tek tek eklemeyin.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {liste.map((d) => {
                        const doldu = d.kullanilan >= d.kullanimHakki;
                        const suresiGecti = d.sonZaman ? d.sonZaman.getTime() < Date.now() : false;
                        const kullanilabilir = d.aktif && !doldu && !suresiGecti;
                        return (
                            <div
                                key={d.kod}
                                className="srf srf-accent p-4"
                                style={{ '--acc': kullanilabilir ? 'var(--ok)' : 'var(--ink-3)' }}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="num text-xl tracking-[0.25em]">{d.kod}</p>
                                        <p className="text-[10px] text-ink-3 mt-0.5">
                                            Son: {d.sonTarih ? d.sonTarih.split('-').reverse().join('.') : '—'}
                                        </p>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button onClick={() => setQrKod(d.kod)} aria-label="QR göster" title="QR kod" className="b b-bare b-icon b-sm">
                                            <QrCode size={13} />
                                        </button>
                                        <button
                                            onClick={() => kopyala(sunucu.davetLinki(d.kod), 'Davet linki kopyalandı')}
                                            aria-label="Linki kopyala" title="Linki kopyala"
                                            className="b b-bare b-icon b-sm"
                                        >
                                            <Copy size={13} />
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const r = await sunucu.davetDurumDegistir(d.kod, !d.aktif);
                                                if (!r.basarili) setToast?.(r.hata);
                                            }}
                                            aria-label={d.aktif ? 'Kapat' : 'Aç'} title={d.aktif ? 'Kapat' : 'Aç'}
                                            className="b b-bare b-icon b-sm"
                                        >
                                            <Power size={13} className={d.aktif ? 'text-ok' : 'text-ink-3'} />
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const r = await sunucu.davetSil(d.kod);
                                                setToast?.(r.basarili ? 'Davet silindi' : r.hata);
                                            }}
                                            aria-label="Sil" title="Sil" className="b b-bare b-icon b-sm"
                                        >
                                            <Trash2 size={13} className="text-danger" />
                                        </button>
                                    </div>
                                </div>

                                {d.not && <p className="text-[11px] text-ink-3 mt-1.5 leading-snug">{d.not}</p>}

                                <div className="flex flex-wrap gap-1.5 mt-2.5">
                                    <span className="badge">
                                        <Users size={10} /> {d.kullanilan}/{d.kullanimHakki} katıldı
                                    </span>
                                    {d.sinif && <span className="badge">{d.sinif}. sınıf</span>}
                                    {!d.aktif && <span className="badge badge-danger">Kapalı</span>}
                                    {doldu && <span className="badge badge-warn">Hak doldu</span>}
                                    {suresiGecti && <span className="badge badge-danger">Süresi geçti</span>}
                                </div>

                                {d.kullanilan > 0 && (
                                    <p className="text-[10px] text-warn font-bold mt-2.5 pt-2.5 border-t border-line">
                                        Katılanları Onaylar sekmesinden kabul etmeniz gerekiyor.
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {formAcik && (
                <DavetFormu
                    onKapat={() => setFormAcik(false)}
                    onUret={async (veri) => {
                        const r = await sunucu.davetOlustur({ ...veri, koc: user });
                        if (!r.basarili) { setToast?.(r.hata); return; }
                        setFormAcik(false);
                        setQrKod(r.davet.kod);
                        setToast?.(`Davet oluşturuldu: ${r.davet.kod}`);
                    }}
                />
            )}

            {qrKod && <QrPenceresi kod={qrKod} onKapat={() => setQrKod(null)} setToast={setToast} />}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════

const DavetFormu = ({ onKapat, onUret }) => {
    const [f, setF] = useState({ kullanimHakki: 1, gecerlilikGun: 14, sinif: '', not: '' });
    const [gonderiliyor, setGonderiliyor] = useState(false);
    const yaz = (k, v) => setF((p) => ({ ...p, [k]: v }));

    const uret = async () => {
        setGonderiliyor(true);
        try { await onUret(f); } finally { setGonderiliyor(false); }
    };

    return (
        <Modal
            acik
            onClose={onKapat}
            baslikGizle
            genislik="md"
            govdeClassName="p-5 space-y-4"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="h2">Davet Oluştur</h3>
                    <p className="text-[11px] text-ink-3 mt-0.5 leading-snug">
                        Tek öğrenci için 1 hak, bir sınıf için sınıf mevcudu kadar hak verin.
                    </p>
                </div>
                <button onClick={onKapat} aria-label="Kapat" className="b b-bare b-icon shrink-0">
                    <X size={17} />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <label className="block">
                    <span className="eyebrow block mb-1">Kaç Öğrenci Katılabilir</span>
                    <input type="number" min="1" className="fld w-full" value={f.kullanimHakki}
                        onChange={(e) => yaz('kullanimHakki', parseInt(e.target.value, 10) || 1)} />
                </label>
                <label className="block">
                    <span className="eyebrow block mb-1">Geçerlilik (gün)</span>
                    <input type="number" min="1" className="fld w-full" value={f.gecerlilikGun}
                        onChange={(e) => yaz('gecerlilikGun', parseInt(e.target.value, 10) || 14)} />
                </label>
            </div>

            <label className="block">
                <span className="eyebrow block mb-1">Sınıf (isteğe bağlı)</span>
                <input className="fld w-full" value={f.sinif} placeholder="Örn. 11"
                    onChange={(e) => yaz('sinif', e.target.value)} />
            </label>

            <label className="block">
                <span className="eyebrow block mb-1">Not (öğrenciye görünür)</span>
                <input className="fld w-full" value={f.not} placeholder="Örn. 11-A koçluk grubu"
                    onChange={(e) => yaz('not', e.target.value)} />
            </label>

            <div className="pencere-alt-cubuk bg-surface flex gap-2 pt-1">
                <button onClick={onKapat} className="b b-line flex-1">İptal</button>
                <button onClick={uret} disabled={gonderiliyor} className="b b-fill b-brand flex-1 disabled:opacity-50">
                    {gonderiliyor ? <><Loader2 size={13} className="animate-spin" /> Oluşturuluyor…</> : 'Oluştur'}
                </button>
            </div>
        </Modal>
    );
};

const QrPenceresi = ({ kod, onKapat, setToast }) => {
    const canvasRef = useRef(null);
    const link = sunucu.davetLinki(kod);

    useEffect(() => {
        let iptal = false;
        (async () => {
            try {
                const QRCode = (await import('qrcode')).default;
                if (iptal || !canvasRef.current) return;
                await QRCode.toCanvas(canvasRef.current, link, { width: 220, margin: 1 });
            } catch {
                // QR üretilemezse link metni yine ekranda duruyor
            }
        })();
        return () => { iptal = true; };
    }, [link]);

    const indir = () => {
        if (!canvasRef.current) return;
        const a = document.createElement('a');
        a.download = `davet_${kod}.png`;
        a.href = canvasRef.current.toDataURL('image/png');
        a.click();
    };

    return (
        <Modal
            acik
            onClose={onKapat}
            baslikGizle
            genislik="sm"
            katmanClassName="z-modal-high"
            govdeClassName="p-5 space-y-3 text-center"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 text-left">
                    <p className="eyebrow">Davet Kodu</p>
                    <h3 className="num text-2xl tracking-[0.25em]">{kod}</h3>
                </div>
                <button onClick={onKapat} aria-label="Kapat" className="b b-bare b-icon shrink-0">
                    <X size={17} />
                </button>
            </div>

            <div className="bg-white rounded-xl p-3 inline-block mx-auto">
                <canvas ref={canvasRef} />
            </div>

            <p className="text-[11px] text-ink-3 break-all leading-snug">{link}</p>

            <div className="flex gap-2">
                <button
                    onClick={async () => {
                        try {
                            await navigator.clipboard.writeText(link);
                            setToast?.('Davet linki kopyalandı');
                        } catch { setToast?.(link); }
                    }}
                    className="b b-line flex-1"
                >
                    <Copy size={13} /> Linki Kopyala
                </button>
                <button onClick={indir} className="b b-fill b-brand flex-1">
                    <Download size={13} /> QR İndir
                </button>
            </div>
        </Modal>
    );
};

export default InviteManager;
