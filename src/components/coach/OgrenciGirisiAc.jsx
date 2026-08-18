import React, { useState, useEffect } from 'react';
import { KeyRound, Copy, QrCode, Loader2, CheckCircle2, X } from 'lucide-react';
import sunucu from '../../services/kayitSunucu';
import Modal from '../ui/Modal';

/**
 * 🔑 ÖĞRENCİ GİRİŞİ AÇ
 *
 * ⚠️ ÇÖZDÜĞÜ PROBLEM:
 *
 * Koçun elle eklediği öğrencilerin SUNUCU KİMLİĞİ yoktu. Kayıt yalnızca
 * koçun veri havuzunda bir satırdı; öğrencinin Firebase hesabı, dolayısıyla
 * kendi cihazından giriş yapma imkânı bulunmuyordu. Davetle katılan
 * öğrencilerle elle eklenenler iki farklı dünyada yaşıyordu.
 *
 * Çözüm yeni bir öğrenci sistemi kurmak DEĞİL: mevcut davet makinesi
 * genişletildi. Bu bileşen, seçili öğrenciye BAĞLI tek kullanımlık bir
 * davet üretir. Öğrenci o bağlantıyla katıldığında yeni kayıt açılmaz —
 * var olan kaydına kimlik bağlanır ve geçmiş verisi (program, görev,
 * deneme, not) olduğu gibi korunur.
 *
 * Katılım yine koç onayına düşer.
 */

const OgrenciGirisiAc = ({ ogrenci, onKapat, setToast }) => {
    const [kod, setKod] = useState(null);
    const [uretiliyor, setUretiliyor] = useState(false);
    const [hata, setHata] = useState('');
    const [kocUid, setKocUid] = useState(sunucu.benimUid());

    useEffect(() => sunucu.uidIzle(setKocUid), []);

    const uret = async () => {
        setHata('');
        setUretiliyor(true);
        try {
            const r = await sunucu.davetOlustur({
                koc: { id: ogrenci.ownerCoachId ?? ogrenci.coachId, name: ogrenci.ownerCoachName || '' },
                ogrenciId: ogrenci.id,
                ogrenciAd: ogrenci.name,
                sinif: ogrenci.grade || '',
                gecerlilikGun: 14,
                not: `${ogrenci.name} için giriş bağlantısı`,
            });
            if (!r.basarili) { setHata(r.hata); return; }
            setKod(r.davet.kod);
        } finally {
            setUretiliyor(false);
        }
    };

    const link = kod ? sunucu.davetLinki(kod) : '';

    const kopyala = async () => {
        try {
            await navigator.clipboard.writeText(link);
            setToast?.('Giriş bağlantısı kopyalandı');
        } catch { setToast?.(link); }
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
                <div className="flex items-start gap-3 min-w-0">
                    <span className="sec-icon" style={{ '--acc': 'var(--brand)' }}>
                        <KeyRound size={16} />
                    </span>
                    <div className="min-w-0">
                        <h3 className="h2">Öğrenci Girişi Aç</h3>
                        <p className="text-[11px] text-ink-3 mt-0.5 leading-snug">
                            <strong className="text-ink">{ogrenci.name}</strong> kendi telefonundan
                            giriş yapabilsin diye kişiye özel bağlantı.
                        </p>
                    </div>
                </div>
                <button onClick={onKapat} aria-label="Kapat" className="b b-bare b-icon shrink-0">
                    <X size={17} />
                </button>
            </div>

            {!kocUid && (
                <div className="rounded-xl border border-warn bg-warn-soft p-3">
                    <p className="text-[11px] text-ink-2 leading-snug">
                        Bulut oturumu açık değil. Çıkış yapıp tekrar giriş yapın.
                    </p>
                </div>
            )}

            {!kod ? (
                <>
                    <div className="rounded-xl border border-line bg-surface-2 p-3 space-y-1.5">
                        <p className="text-[11px] text-ink-2 leading-snug">
                            Bağlantı <strong className="text-ink">tek kullanımlıktır</strong> ve
                            yalnızca bu öğrenciye bağlıdır. Öğrenci kendi şifresini belirler.
                        </p>
                        <p className="text-[11px] text-ink-2 leading-snug">
                            Mevcut kaydı <strong className="text-ink">korunur</strong> — programı,
                            görevleri ve deneme geçmişi silinmez.
                        </p>
                        {!String(ogrenci.schoolNumber || '').trim() && (
                            <p className="text-[11px] text-warn font-bold leading-snug">
                                Bu öğrencinin okul numarası boş. Katılırken kendisi girecek ve
                                giriş kimliği o numara olacak.
                            </p>
                        )}
                    </div>

                    <button
                        onClick={uret}
                        disabled={uretiliyor || !kocUid}
                        className="b b-fill b-brand w-full disabled:opacity-50"
                    >
                        {uretiliyor
                            ? <><Loader2 size={15} className="animate-spin" /> Oluşturuluyor…</>
                            : <><KeyRound size={15} /> Giriş Bağlantısı Oluştur</>}
                    </button>
                </>
            ) : (
                <>
                    <div className="rounded-xl border border-ok bg-ok-soft p-3 flex items-start gap-2">
                        <CheckCircle2 size={15} className="text-ok shrink-0 mt-0.5" />
                        <p className="text-[11px] text-ink-2 leading-snug">
                            Bağlantı hazır. Öğrenciye gönderin; katıldığında
                            <strong className="text-ink"> Davetler</strong> sekmesinde onayınıza düşecek.
                        </p>
                    </div>

                    <div>
                        <p className="eyebrow mb-1">Davet Kodu</p>
                        <p className="num text-2xl tracking-[0.25em]">{kod}</p>
                    </div>

                    <p className="text-[11px] text-ink-3 break-all leading-snug">{link}</p>

                    <div className="flex gap-2">
                        <button onClick={kopyala} className="b b-line flex-1">
                            <Copy size={13} /> Bağlantıyı Kopyala
                        </button>
                        <button onClick={onKapat} className="b b-fill b-brand flex-1">
                            <QrCode size={13} /> Tamam
                        </button>
                    </div>
                </>
            )}

            {hata && (
                <p className="text-[11px] font-bold text-danger leading-snug">{hata}</p>
            )}
        </Modal>
    );
};

export default OgrenciGirisiAc;
