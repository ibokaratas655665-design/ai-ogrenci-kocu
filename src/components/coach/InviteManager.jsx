import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Link2, Plus, Copy, Trash2, Power, X, QrCode, Users, Download } from 'lucide-react';
import invites from '../../services/inviteService';

/**
 * 🔗 ÖĞRENCİ DAVETLERİ
 *
 * Koç bir kod üretir, öğrenciye linki ya da QR'ı gönderir; öğrenci kendi
 * bilgilerini girip listeye düşer. Eskiden öğrenciyi yalnızca koç elle
 * ya da Excel ile ekleyebiliyordu.
 *
 * Katılan her öğrenci ONAY BEKLER — link bir sınıf grubuna düşse bile
 * listeye habersiz kayıt giremez.
 */

const InviteManager = ({ user, setToast }) => {
    const [formAcik, setFormAcik] = useState(false);
    const [qrKod, setQrKod] = useState(null);
    const [surum, setSurum] = useState(0);
    const yenile = useCallback(() => setSurum((v) => v + 1), []);

    const liste = useMemo(
        // eslint-disable-next-line react-hooks/exhaustive-deps
        () => invites.kocDavetleri(user?.id), [user?.id, surum]
    );

    const kopyala = async (metin, mesaj) => {
        try {
            await navigator.clipboard.writeText(metin);
            setToast?.(mesaj);
        } catch {
            setToast?.(metin);   // Pano izni yoksa kullanıcı elle kopyalasın
        }
    };

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

            {liste.length === 0 ? (
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
                        const bugun = new Date().toISOString().slice(0, 10);
                        const doldu = d.katilanlar.length >= d.kullanimHakki;
                        const suresiGecti = d.sonTarih < bugun;
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
                                            Son: {d.sonTarih.split('-').reverse().join('.')}
                                        </p>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button onClick={() => setQrKod(d.kod)} aria-label="QR göster" title="QR kod" className="b b-bare b-icon b-sm">
                                            <QrCode size={13} />
                                        </button>
                                        <button
                                            onClick={() => kopyala(invites.davetLinki(d.kod), 'Davet linki kopyalandı')}
                                            aria-label="Linki kopyala" title="Linki kopyala"
                                            className="b b-bare b-icon b-sm"
                                        >
                                            <Copy size={13} />
                                        </button>
                                        <button
                                            onClick={() => { invites.durumDegistir(d.kod, !d.aktif); yenile(); }}
                                            aria-label={d.aktif ? 'Kapat' : 'Aç'} title={d.aktif ? 'Kapat' : 'Aç'}
                                            className="b b-bare b-icon b-sm"
                                        >
                                            <Power size={13} className={d.aktif ? 'text-ok' : 'text-ink-3'} />
                                        </button>
                                        <button
                                            onClick={() => { invites.sil(d.kod); yenile(); setToast?.('Davet silindi'); }}
                                            aria-label="Sil" title="Sil" className="b b-bare b-icon b-sm"
                                        >
                                            <Trash2 size={13} className="text-danger" />
                                        </button>
                                    </div>
                                </div>

                                {d.not && <p className="text-[11px] text-ink-3 mt-1.5 leading-snug">{d.not}</p>}

                                <div className="flex flex-wrap gap-1.5 mt-2.5">
                                    <span className="badge">
                                        <Users size={10} /> {d.katilanlar.length}/{d.kullanimHakki} katıldı
                                    </span>
                                    {d.sinif && <span className="badge">{d.sinif}. sınıf</span>}
                                    {!d.aktif && <span className="badge badge-danger">Kapalı</span>}
                                    {doldu && <span className="badge badge-warn">Hak doldu</span>}
                                    {suresiGecti && <span className="badge badge-danger">Süresi geçti</span>}
                                </div>

                                {d.katilanlar.length > 0 && (
                                    <div className="mt-2.5 pt-2.5 border-t border-line">
                                        <p className="eyebrow mb-1">Katılanlar</p>
                                        <div className="space-y-0.5">
                                            {d.katilanlar.map((k) => (
                                                <p key={k.ogrenciId} className="text-[11px] text-ink-2">
                                                    {k.ad}
                                                    <span className="text-ink-3">
                                                        {' · '}{new Date(k.tarih).toLocaleDateString('tr-TR')}
                                                    </span>
                                                </p>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-warn font-bold mt-1.5">
                                            Onaylar sekmesinden kabul etmeniz gerekiyor.
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {formAcik && (
                <DavetFormu
                    onKapat={() => setFormAcik(false)}
                    onUret={(veri) => {
                        const d = invites.uret({ ...veri, koc: user });
                        if (!d) { setToast?.('Davet oluşturulamadı.'); return; }
                        setFormAcik(false);
                        yenile();
                        setQrKod(d.kod);
                        setToast?.(`Davet oluşturuldu: ${d.kod}`);
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
    const yaz = (k, v) => setF((p) => ({ ...p, [k]: v }));

    return (
        <div className="fixed inset-0 z-modal-base bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="srf srf-4 w-full max-w-md p-5 space-y-4">
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
                    <button onClick={() => onUret(f)} className="b b-fill b-brand flex-1">Oluştur</button>
                </div>
            </div>
        </div>
    );
};

const QrPenceresi = ({ kod, onKapat, setToast }) => {
    const canvasRef = useRef(null);
    const link = invites.davetLinki(kod);

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
        <div className="fixed inset-0 z-modal-high bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="srf srf-4 w-full max-w-sm p-5 space-y-3 text-center">
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
            </div>
        </div>
    );
};

export default InviteManager;
