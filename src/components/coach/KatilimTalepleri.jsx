import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, CheckCircle2, XCircle, Loader2, CloudOff, Inbox, Trash2, RefreshCw } from 'lucide-react';
import sunucu from '../../services/kayitSunucu';
import subscription from '../../services/subscriptionService';

/**
 * 📥 KATILIM TALEPLERİ
 *
 * Davet linkiyle katılan öğrenciler buraya düşer.
 *
 * ⚠️ ÖNCEDEN BU EKRAN YOKTU VE OLAMAZDI: katılım öğrencinin kendi
 * tarayıcısındaki localStorage'a yazılıyor, koça hiçbir zaman
 * ulaşmıyordu. Koç panelinde "1 kayıt onayınızı bekliyor" yazıp
 * tıklayınca boş liste çıkmasının sebebi buydu — sayaç yerel listedeki
 * eski/ret edilmiş kayıtları sayıyordu, gerçek katılım ise ortada yoktu.
 *
 * Talepler artık sunucudan CANLI geliyor: öğrenci telefonundan katıldığı
 * anda koçun ekranında beliriyor.
 *
 * Onay iki yere birden yazılır:
 *   · koçun öğrenci listesine (uygulamanın çalıştığı veri)
 *   · sunucudaki kimlik kaydına (öğrenci giriş yapabilsin diye)
 * İkincisi olmadan öğrenci onaylanmış görünür ama giriş yapamaz.
 */

const safeParse = (key, def = []) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw || !raw.trim()) return def;
        const v = JSON.parse(raw);
        return Array.isArray(v) ? v : def;
    } catch {
        return def;
    }
};

const KatilimTalepleri = ({ user, setToast, onDegisim }) => {
    const [kocUid, setKocUid] = useState(sunucu.benimUid());
    const [talepler, setTalepler] = useState([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [islemde, setIslemde] = useState(null);
    // Dinleyici hatası ayrı tutulur; "talep yok" ile karıştırılmamalı.
    const [dinleyiciHatasi, setDinleyiciHatasi] = useState(null);
    const [yenilemeSayaci, setYenilemeSayaci] = useState(0);

    useEffect(() => sunucu.uidIzle(setKocUid), []);

    useEffect(() => {
        if (!kocUid) { setTalepler([]); setYukleniyor(false); return undefined; }
        setYukleniyor(true);
        let iptal = false;

        /**
         * ⚠️ TEK BAŞINA CANLI DİNLEYİCİYE GÜVENİLMİYOR.
         *
         * Gerçek kullanımda şu yaşandı: öğrencinin katılım talebi sunucuya
         * yazıldı (durum 'bekliyor', doğru koça bağlı) ama koçun ekranında
         * HİÇ görünmedi. Aynı sorgu `getDocs` ile sorunsuz okunuyordu —
         * yani kural doğru, sorun `onSnapshot` tarafındaydı. Bu uygulamada
         * kalıcı önbellek + çok sekmeli yönetici + birden fazla eşzamanlı
         * dinleyici birleşince Firestore SDK'sı sessizce veri vermeyebiliyor.
         *
         * Artık liste ÖNCE tek seferlik okumayla doldurulur; dinleyici
         * yalnızca üzerine canlı güncelleme getirir. Dinleyici hiç
         * çalışmasa bile koç talebi görür.
         */
        sunucu.talepleriOku(kocUid).then((ilk) => {
            if (iptal) return;
            setTalepler((onceki) => (onceki.length ? onceki : ilk));
            setYukleniyor(false);
        });

        const bitir = sunucu.talepleriIzle(kocUid, (t, hata) => {
            if (iptal) return;
            // Dinleyici hata verirse tek seferlik okumanın sonucunu SİLME
            if (hata) { setDinleyiciHatasi(hata); setYukleniyor(false); return; }
            setTalepler(t);
            setDinleyiciHatasi(null);
            setYukleniyor(false);
        });

        return () => { iptal = true; bitir(); };
    }, [kocUid, yenilemeSayaci]);

    /** Koçun elle tazeleyebilmesi — dinleyiciye bağlı kalmamak için. */
    const yenile = () => { setYenilemeSayaci((v) => v + 1); };

    const bekleyen = useMemo(
        () => talepler.filter((t) => t.durum === 'bekliyor')
            .sort((a, b) => String(b.olusturma || '').localeCompare(String(a.olusturma || ''))),
        [talepler]
    );
    const karara_baglanan = useMemo(
        () => talepler.filter((t) => t.durum !== 'bekliyor'),
        [talepler]
    );

    const onayla = async (talep) => {
        setIslemde(talep.uid);
        try {
            const liste = safeParse('coach_students');
            const kocId = String(talep.kocId ?? user?.id ?? '');

            /**
             * BAĞLI DAVET — mevcut öğrenciye giriş açma
             *
             * Koçun elle eklediği öğrencinin sunucu kimliği yoktu; kendi
             * cihazından giriş yapamıyordu. Bağlı davetle katıldığında YENİ
             * kayıt açılmaz: var olan kaydı güncellenir ve kimliği bağlanır.
             * Böylece geçmiş verisi (program, görev, deneme, not) korunur.
             */
            if (talep.ogrenciId) {
                const mevcut = liste.find((s) => String(s.id) === String(talep.ogrenciId));
                if (!mevcut) {
                    setToast?.('Bu davetin bağlı olduğu öğrenci kaydı bulunamadı.');
                    return;
                }
                const guncel = liste.map((s) => (String(s.id) === String(talep.ogrenciId)
                    ? {
                        ...s,
                        // Öğrencinin katılırken girdiği bilgiler eksikleri tamamlar,
                        // mevcut dolu alanların ÜZERİNE YAZMAZ.
                        schoolNumber: String(s.schoolNumber || '').trim() || String(talep.okulNo || ''),
                        grade: s.grade || talep.sinif || '',
                        section: s.section || talep.sube || '',
                        parentName: s.parentName || talep.veliAd || '',
                        parentPhone: s.parentPhone || talep.veliTel || '',
                        approved: true,
                        approvalStatus: 'onayli',
                        onboardingDurumu: 'aktif',
                        sunucuUid: talep.uid,
                        katildigiDavet: talep.kod,
                    }
                    : s));
                localStorage.setItem('coach_students', JSON.stringify(guncel));
                try { window.dispatchEvent(new StorageEvent('storage', { key: 'coach_students' })); } catch { /* ignore */ }
                try { await window.firebaseSync?.syncKey?.('coach_students'); } catch { /* ignore */ }

                const r = await sunucu.talepOnayla(talep, talep.ogrenciId);
                setToast?.(r.basarili
                    ? `${mevcut.name} artık kendi cihazından giriş yapabilir.`
                    : `Kayıt güncellendi ama girişi açılamadı: ${r.hata}`);
                onDegisim?.();
                return;
            }

            // Aynı koçta aynı okul numarası iki kez olmasın
            const cakisma = liste.find((s) =>
                String(s.ownerCoachId ?? s.coachId) === kocId
                && String(s.schoolNumber || '').trim() === String(talep.okulNo).trim());
            if (cakisma) {
                // Kayıt zaten var: yalnızca sunucudaki kimliği bağla
                const r = await sunucu.talepOnayla(talep, cakisma.id);
                setToast?.(r.basarili
                    ? `${talep.ad} zaten listenizde — girişi açıldı.`
                    : r.hata);
                onDegisim?.();
                return;
            }

            // Paket kontenjanı — davet üzerinden limit aşılmasın
            const mevcutSayi = liste.filter(
                (s) => String(s.ownerCoachId ?? s.coachId) === kocId
            ).length;
            const paket = await subscription.ogrenciEklenebilirGuvenli(kocId, mevcutSayi);
            if (!paket.izin) {
                setToast?.('Öğrenci kontenjanınız dolu. Paketinizi yükseltmeniz gerekiyor.');
                return;
            }

            const ogrenciId = `ogr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            const kayit = {
                id: ogrenciId,
                name: talep.ad,
                schoolNumber: String(talep.okulNo || ''),
                grade: talep.sinif || '',
                section: talep.sube || '',
                class: [talep.sinif, talep.sube].filter(Boolean).join('/'),
                parentName: talep.veliAd || '',
                parentPhone: talep.veliTel || '',
                /**
                 * Şifre özeti YAZILMAZ. Bu öğrencinin şifresini Firebase
                 * tutuyor; ikinci bir kopya hem gereksiz hem de yerel
                 * doğrulamanın sunucu doğrulamasını gölgelemesine yol açar.
                 */
                status: 'Aktif',
                progress: 0,
                lastAction: 'Davetle katıldı',
                ownerCoachId: kocId,
                ownerCoachName: talep.kocAd || user?.name || '',
                coachId: kocId,
                coachName: talep.kocAd || user?.name || '',
                approved: true,
                approvalStatus: 'onayli',
                katildigiDavet: talep.kod,
                sunucuUid: talep.uid,
                createdAt: new Date().toISOString(),
            };

            localStorage.setItem('coach_students', JSON.stringify([...liste, kayit]));
            try {
                window.dispatchEvent(new StorageEvent('storage', { key: 'coach_students' }));
            } catch { /* ignore */ }
            try { await window.firebaseSync?.syncKey?.('coach_students'); } catch { /* ignore */ }

            const r = await sunucu.talepOnayla(talep, ogrenciId);
            if (!r.basarili) {
                setToast?.(`Öğrenci listenize eklendi ama girişi açılamadı: ${r.hata}`);
            } else {
                setToast?.(`${talep.ad} onaylandı — artık giriş yapabilir.`);
            }
            onDegisim?.();
        } finally {
            setIslemde(null);
        }
    };

    const reddet = async (talep) => {
        setIslemde(talep.uid);
        try {
            const r = await sunucu.talepReddet(talep);
            setToast?.(r.basarili ? `${talep.ad} reddedildi.` : r.hata);
            onDegisim?.();
        } finally {
            setIslemde(null);
        }
    };

    const sil = async (talep) => {
        setIslemde(talep.uid);
        try {
            const r = await sunucu.talepSil(talep.uid);
            setToast?.(r.basarili ? 'Kayıt silindi.' : r.hata);
        } finally {
            setIslemde(null);
        }
    };

    if (!kocUid && !yukleniyor) {
        return (
            <div className="srf p-8 text-center">
                <CloudOff size={26} className="text-warn mx-auto mb-2" />
                <p className="text-xs font-bold text-ink">Bulut oturumu açık değil</p>
                <p className="text-[11px] text-ink-3 mt-1 max-w-sm mx-auto leading-snug">
                    Katılım talepleri sunucudan geldiği için bu bölüm bulut bağlantısı ister.
                    Çıkış yapıp tekrar giriş yapın.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-start gap-3">
                <span className="sec-icon" style={{ '--acc': 'var(--brand)' }}>
                    <UserPlus size={16} />
                </span>
                <div className="min-w-0 flex-1">
                    <h3 className="h3">Katılım Talepleri</h3>
                    <p className="text-[11px] text-ink-3 leading-snug">
                        Davet linkinizi kullanan öğrenciler burada belirir. Onayladığınızda
                        listenize eklenir ve giriş yapabilirler.
                    </p>
                </div>
                <button onClick={yenile} className="b b-line b-sm shrink-0" title="Listeyi yenile">
                    <RefreshCw size={13} /> Yenile
                </button>
            </div>

            {dinleyiciHatasi && (
                <div className="srf srf-accent p-4" style={{ '--acc': 'var(--danger)' }}>
                    <p className="text-[12px] font-bold text-danger">Katılım talepleri okunamadı</p>
                    <p className="text-[11px] text-ink-2 mt-1 leading-snug">
                        Sunucu bu listeyi vermedi ({dinleyiciHatasi}). Bu ekranda talep
                        görünmemesi, öğrencinin katılmadığı anlamına gelmez. Çıkış yapıp
                        tekrar giriş yapın; sorun sürerse bildirin.
                    </p>
                </div>
            )}

            {yukleniyor ? (
                <div className="srf p-10 text-center">
                    <Loader2 size={24} className="text-ink-3 mx-auto mb-2 animate-spin" />
                    <p className="text-[11px] text-ink-3">Talepler yükleniyor…</p>
                </div>
            ) : bekleyen.length === 0 ? (
                <div className="srf p-10 text-center">
                    <Inbox size={28} className="text-ink-3 mx-auto mb-2" />
                    <p className="text-xs font-bold text-ink-3">Bekleyen katılım talebi yok</p>
                    <p className="text-[11px] text-ink-3 mt-1 max-w-xs mx-auto leading-snug">
                        Davetler sekmesinden bir davet oluşturup linkini paylaşın;
                        katılan öğrenciler burada görünür.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {bekleyen.map((t) => (
                        <div key={t.uid} className="srf srf-accent p-4" style={{ '--acc': 'var(--warn)' }}>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[13px] font-bold text-ink leading-snug">{t.ad}</p>
                                    <p className="text-[11px] text-ink-3 mt-0.5">
                                        {[
                                            t.okulNo && `No: ${t.okulNo}`,
                                            [t.sinif, t.sube].filter(Boolean).join('/'),
                                            t.veliTel && `Veli: ${t.veliTel}`,
                                        ].filter(Boolean).join(' · ') || '—'}
                                    </p>
                                    <p className="text-[10px] text-ink-3 mt-0.5">
                                        {t.kod} kodlu davetle
                                        {t.olusturma && ` · ${new Date(t.olusturma).toLocaleString('tr-TR')}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => reddet(t)}
                                        disabled={islemde === t.uid}
                                        className="b b-line b-sm disabled:opacity-50"
                                    >
                                        <XCircle size={13} className="text-danger" /> Reddet
                                    </button>
                                    <button
                                        onClick={() => onayla(t)}
                                        disabled={islemde === t.uid}
                                        className="b b-fill b-ok b-sm disabled:opacity-50"
                                    >
                                        {islemde === t.uid
                                            ? <><Loader2 size={13} className="animate-spin" /> İşleniyor…</>
                                            : <><CheckCircle2 size={13} /> Onayla</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {karara_baglanan.length > 0 && (
                <details className="srf p-4">
                    <summary className="text-[12px] font-bold text-ink-2 cursor-pointer">
                        Karara bağlananlar ({karara_baglanan.length})
                    </summary>
                    <div className="mt-3 divide-y divide-line">
                        {karara_baglanan.map((t) => (
                            <div key={t.uid} className="flex items-center gap-3 py-2">
                                <div className="min-w-0 flex-1">
                                    <p className="text-[12px] font-bold text-ink truncate">{t.ad}</p>
                                    <p className="text-[10px] text-ink-3">No: {t.okulNo} · {t.kod}</p>
                                </div>
                                <span className={`badge shrink-0 ${t.durum === 'onaylandi' ? 'badge-ok' : 'badge-danger'}`}>
                                    {t.durum === 'onaylandi' ? 'Onaylandı' : 'Reddedildi'}
                                </span>
                                <button
                                    onClick={() => sil(t)}
                                    disabled={islemde === t.uid}
                                    aria-label={`${t.ad} kaydını sil`}
                                    title="Kaydı sil"
                                    className="b b-bare b-icon b-sm shrink-0 disabled:opacity-50"
                                >
                                    <Trash2 size={13} className="text-danger" />
                                </button>
                            </div>
                        ))}
                    </div>
                </details>
            )}
        </div>
    );
};

export default KatilimTalepleri;
