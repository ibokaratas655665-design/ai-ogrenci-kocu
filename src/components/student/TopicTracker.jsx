import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    CheckCircle2, Circle, RotateCcw, Calendar, Target, Search, Flame, Trophy,
    Clock, BarChart3,
} from 'lucide-react';
import topics, { DURUMLAR } from '../../services/topicProgressService';
import { DersCubuklari } from '../charts/Analitik';
import {
    sinavBul, ogrencininSinavi, ogrencininAlani, ogrencininBolumleri, alanListesi,
} from '../../data/examTopics';

/**
 * 🎯 SINAV KONU LİSTESİ
 *
 * Düzen: SINAV → BÖLÜM → DERS → KONULAR
 * Her konu satırında solda konu adı, sağda çözülen/hedef soru sayısı
 * ve tamamlanma butonu bulunur.
 *
 * Durum, ders programı ve soru takibinden HESAPLANIR:
 *   📅 Programda      → koç bu konuyu programa yazdı
 *   📖 Çalışılıyor    → soru çözülmüş ama hedefe ulaşılmamış
 *   ✅ Tamamlandı     → hedef soru sayısı + başarı eşiği tutuyor
 *   🔁 Tekrar gerekli → hedef doldu ama isabet düşük
 *
 * Hedef soru sayısı her konu için AYRI hesaplanır: konunun sınavdaki
 * ağırlığı ve zorluğu. TYT Paragraf'ta 60, Din Kültürü'nde 20 gibi.
 * Bu bir üst sınır değil, "bu kadarını çözmeden bitmiş sayma" eşiğidir.
 */

/**
 * @param {object}  user            Öğrenci kaydı
 * @param {boolean} [saltGorunum]   Koç karnesinde açıldığında true:
 *                                  işaretleme kapalı, sınav başlığı kısalır
 * @param {string}  [baslangicBolum] Dışarıdan seçilen bölüm
 */
const TopicTracker = ({ user, setToast, saltGorunum = false, baslangicBolum = null }) => {
    const studentId = user?.id;
    const [bildirim, setBildirim] = useState(null);

    const haberVer = useCallback((mesaj) => {
        if (setToast) { setToast(mesaj); return; }
        setBildirim(mesaj);
        setTimeout(() => setBildirim(null), 2500);
    }, [setToast]);

    /** Sınav türü öğrenci kaydından gelir (koç eklerken seçtiği tür). */
    const sinav = useMemo(() => ogrencininSinavi(user), [user]);
    const sinavTanim = sinavBul(sinav);

    /**
     * Öğrenci sınavın TAMAMINI çözmez; alanına düşen bölümleri çözer.
     * Sözel öğrencisine AYT Sayısal ve YDT konuları gösterilmez —
     * 271 konu içinde kendi 138 konusunu aramak listeyi kullanılmaz kılar.
     * Alan seçilmemiş eski kayıtlarda sınavın tamamı gösterilir.
     */
    const gorunenBolumler = useMemo(() => ogrencininBolumleri(user, sinav), [user, sinav]);
    const alanId = useMemo(() => ogrencininAlani(user, sinav), [user, sinav]);
    const alanTanim = alanListesi(sinav).find((a) => a.id === alanId) || null;

    const [bolum, setBolum] = useState(
        () => baslangicBolum || ogrencininBolumleri(user)?.[0]?.id || null
    );

    // Alan değişirse (koç kaydı güncelledi) seçili bölüm listede kalmalı
    useEffect(() => {
        if (!gorunenBolumler.some((b) => b.id === bolum)) {
            setBolum(gorunenBolumler[0]?.id || null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gorunenBolumler]);
    const [arama, setArama] = useState('');
    const [suzgec, setSuzgec] = useState('hepsi');
    const [surum, setSurum] = useState(0);

    const yenile = useCallback(() => setSurum((v) => v + 1), []);

    // Soru kaydı ya da program başka ekranda değişince liste tazelensin
    useEffect(() => {
        const olaylar = ['storage', 'topic-progress-updated', 'focus'];
        olaylar.forEach((o) => window.addEventListener(o, yenile));
        return () => olaylar.forEach((o) => window.removeEventListener(o, yenile));
    }, [yenile]);

    const olcut = useMemo(() => topics.olcutOku(), [surum]);

    const { dersler } = useMemo(
        () => topics.konuHaritasi(studentId, sinav, olcut, bolum),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [studentId, sinav, bolum, surum]
    );

    /** Sınavın tamamı — üstteki genel ilerleme bunu gösterir. */
    const genel = useMemo(() => {
        const t = gorunenBolumler
            .map((x) => topics.konuHaritasi(studentId, sinav, olcut, x.id).ozet);
        const topla = (alan) => t.reduce((a, o) => a + (o[alan] || 0), 0);
        const toplamKonu = topla('toplamKonu');
        const tamam = topla('tamam');
        return {
            toplamKonu, tamam,
            tekrar: topla('tekrar'),
            calisilan: topla('calisilan'),
            kalan: toplamKonu - tamam,
            toplamSoru: topla('toplamSoru'),
            toplamHedef: topla('toplamHedef'),
            oran: toplamKonu ? Math.round((tamam / toplamKonu) * 100) : 0,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentId, sinav, gorunenBolumler, surum]);

    const sonraki = useMemo(
        () => topics.sonrakiKonular(studentId, sinav, 3, olcut, gorunenBolumler),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [studentId, sinav, gorunenBolumler, surum]
    );

    /**
     * @param {object} satir konuHaritasi satırı — `topicId` sınav bağlamını
     *   taşır (§24), böylece aynı adlı LGS/TYT konuları ayrı kaydedilir.
     */
    const isaretle = (satir, tamam) => {
        // Koç, öğrenci adına konu işaretleyemez — kayıt öğrencinin beyanıdır
        if (saltGorunum) { haberVer('Bu görünümde işaretleme yapılamaz.'); return; }
        const konu = satir.konu;
        topics.elleIsaretle(studentId, konu, tamam, 'ogrenci', { topicId: satir.topicId });
        yenile();
        haberVer(tamam
            ? `${konu} tamamlandı olarak işaretlendi`
            : `${konu} işareti kaldırıldı`);
    };

    // Süzgeç + arama
    const gorunen = useMemo(() => {
        const q = arama.trim().toLocaleLowerCase('tr-TR');
        return dersler
            .map((d) => ({
                ...d,
                konular: d.konular.filter((k) => {
                    if (suzgec === 'kalan' && k.tamam) return false;
                    if (suzgec === 'tamam' && !k.tamam) return false;
                    if (suzgec === 'tekrar' && k.durum !== 'tekrar') return false;
                    if (!q) return true;
                    return k.konu.toLocaleLowerCase('tr-TR').includes(q);
                }),
            }))
            .filter((d) => d.konular.length > 0);
    }, [dersler, arama, suzgec]);

    return (
        <div className="space-y-4">

            {bildirim && (
                <div className="srf srf-accent p-3" style={{ '--acc': 'var(--ok)' }}>
                    <p className="text-[12px] font-bold text-ink">{bildirim}</p>
                </div>
            )}

            {/* ══ SINAV BAŞLIĞI ═══════════════════════════ */}
            <div className="srf srf-accent p-5" style={{ '--acc': 'var(--brand)' }}>
                <div className="flex items-start gap-3">
                    <span className="text-3xl leading-none shrink-0">{sinavTanim?.icon}</span>
                    <div className="min-w-0">
                        <h2 className="h1 leading-tight">{sinavTanim?.kisa || sinav}</h2>
                        <p className="text-[12px] text-ink-2 mt-0.5">{sinavTanim?.ad}</p>
                        <p className="text-[11px] text-ink-3 mt-0.5">{sinavTanim?.aciklama}</p>
                        {alanTanim && (
                            <span className="badge badge-ok mt-1.5">{alanTanim.ad} alanı</span>
                        )}
                    </div>
                </div>

                <div className="bar mt-4" style={{ '--acc': 'var(--ok)', height: 10 }}>
                    <i style={{ width: `${genel.oran}%` }} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                    <div>
                        <span className="num text-xl">%{genel.oran}</span>
                        <span className="text-[11px] text-ink-3 ml-2">
                            {genel.tamam}/{genel.toplamKonu} konu · {genel.toplamSoru}/{genel.toplamHedef} soru
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <span className="badge badge-ok">✅ {genel.tamam}</span>
                        {genel.calisilan > 0 && <span className="badge badge-warn">📖 {genel.calisilan}</span>}
                        {genel.tekrar > 0 && <span className="badge badge-danger">🔁 {genel.tekrar}</span>}
                        <span className="badge">⚪ {genel.kalan}</span>
                    </div>
                </div>

                {/* Sınavın oturumları */}
                {gorunenBolumler.length > 1 && (
                    <div className="tabbar mt-4">
                        {gorunenBolumler.map((b) => (
                            <button
                                key={b.id}
                                onClick={() => setBolum(b.id)}
                                aria-selected={bolum === b.id}
                                className={`tb ${bolum === b.id ? 'is-on' : ''}`}
                            >
                                {b.ad}
                                {b.soru ? <span className="badge ml-1">{b.soru}</span> : null}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── DERSLERE GÖRE KONU TAMAMLAMA ───────────────
                Ders başına oran şimdiye kadar yalnızca her ders
                bloğunun kendi başlığında, sayfaya dağılmış hâlde
                duruyordu: "hangi dersim geride?" sorusunu yanıtlamak
                için sayfayı baştan sona kaydırmak gerekiyordu.
                Tek yerde, sıralı ve programdaki ders renkleriyle. */}
            {dersler.length > 1 && (
                <div className="srf p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <BarChart3 size={15} className="text-brand" />
                        <span className="eyebrow">Derslere Göre</span>
                    </div>
                    <DersCubuklari
                        dersler={dersler.map((d) => ({
                            ders: d.ad,
                            oran: d.oran,
                            tamamlanan: d.tamam,
                            planlanan: d.toplam,
                        }))}
                        enFazla={dersler.length}
                    />
                </div>
            )}

            {/* ── Sıradaki konular ───────────────────────── */}
            {sonraki.length > 0 && (
                <div className="srf p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Flame size={15} className="text-highlight" />
                        <span className="eyebrow">Şimdi Buna Odaklan</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {sonraki.map((k) => {
                            const d = DURUMLAR[k.durum];
                            return (
                                <div
                                    key={`${k.bolum}-${k.ders}-${k.konu}`}
                                    className="srf-in p-3"
                                    style={{ borderLeft: `3px solid ${d.renk}` }}
                                >
                                    <p className="eyebrow">{k.bolum} · {k.ders}</p>
                                    <p className="t-title text-[13px] leading-tight">{k.konu}</p>

                                    {/* Konu neden önerildi? Program borcu olan konu
                                        listenin başına geçiyor; öğrenci sebebini
                                        görmezse sıralamayı rastgele sanır. */}
                                    {k.programda > 0 && (
                                        <span className="badge badge-info mt-1.5">
                                            <Calendar size={10} />
                                            {k.programYapildi < k.programda
                                                ? 'Programında — henüz işaretlemedin'
                                                : 'Programında'}
                                        </span>
                                    )}

                                    <div className="bar mt-2" style={{ '--acc': d.renk, height: 5 }}>
                                        <i style={{ width: `${k.oran}%` }} />
                                    </div>
                                    <p className="text-[11px] font-bold mt-1.5" style={{ color: d.renk }}>
                                        {k.durum === 'tekrar'
                                            ? `İsabet %${k.basari} — tekrar et`
                                            : `${k.kalan} soru kaldı (hedef ${k.hedef})`}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Süzgeç ─────────────────────────────────── */}
            <div className="srf p-3 flex flex-wrap items-center gap-2">
                <div className="tabbar">
                    {[
                        { id: 'hepsi', ad: 'Tümü' },
                        { id: 'kalan', ad: 'Kalanlar' },
                        { id: 'tamam', ad: 'Bitenler' },
                        { id: 'tekrar', ad: 'Tekrar' },
                    ].map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setSuzgec(s.id)}
                            aria-selected={suzgec === s.id}
                            className={`tb ${suzgec === s.id ? 'is-on' : ''}`}
                        >
                            {s.ad}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 min-w-[150px]">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
                    <input
                        value={arama}
                        onChange={(e) => setArama(e.target.value)}
                        placeholder="Konu ara…"
                        className="fld pl-8"
                    />
                </div>
            </div>

            {/* ══ DERS → KONU LİSTESİ ═════════════════════ */}
            {gorunen.length === 0 ? (
                <div className="srf p-10 text-center">
                    <Target size={28} className="text-ink-3 mx-auto mb-2" />
                    <p className="text-xs text-ink-3">
                        {suzgec === 'tamam'
                            ? 'Henüz tamamlanan konu yok. İlk tiki almak için bir konuya başla.'
                            : 'Bu süzgeçte konu bulunmuyor.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {gorunen.map((d) => (
                        <DersBlogu key={d.ders} d={d} onIsaretle={isaretle} />
                    ))}
                </div>
            )}

            <p className="text-[11px] text-ink-3 leading-snug">
                Hedef soru sayısı her konu için ayrı hesaplanır: konunun sınavdaki ağırlığı
                ve zorluğu. Bu sayı çözülebilecek en alt sınırdır — daha fazlası her zaman
                iyidir. Durumlar ders programın ve günlük soru kaydından otomatik gelir.
            </p>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════
//  DERS BLOĞU — ders adı, altında konu tablosu
// ══════════════════════════════════════════════════════════════

const DersBlogu = ({ d, onIsaretle }) => (
    <div className="srf overflow-hidden">

        {/* Ders başlığı */}
        <div className="flex items-center gap-3 px-4 py-3 bg-surface-2 border-b border-line">
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <h3 className="t-title text-sm">{d.ad}</h3>
                    {d.oran === 100 && <Trophy size={14} className="text-ok" />}
                </div>
                <div className="bar mt-1.5" style={{ '--acc': 'var(--ok)', height: 6 }}>
                    <i style={{ width: `${d.oran}%` }} />
                </div>
            </div>
            <div className="text-right shrink-0">
                <p className="num text-base">%{d.oran}</p>
                <p className="text-[10px] text-ink-3">
                    {d.tamam}/{d.toplam} konu · {d.toplamSoru}/{d.toplamHedef} soru
                </p>
            </div>
        </div>

        {/* Sütun başlıkları — dar ekranda gizlenir */}
        <div className="hidden sm:flex items-center gap-3 px-4 py-1.5 border-b border-line">
            <span className="eyebrow flex-1">Konu</span>
            <span className="eyebrow w-24 text-center shrink-0">Çözülen / Hedef</span>
            <span className="eyebrow w-20 text-center shrink-0">Durum</span>
        </div>

        {/* Konu satırları */}
        <div className="divide-y divide-line">
            {d.konular.map((k) => (
                <KonuSatiri key={k.konu} k={k} onIsaretle={onIsaretle} />
            ))}
        </div>
    </div>
);

// ══════════════════════════════════════════════════════════════
//  KONU SATIRI — sol: konu · orta: soru sayısı · sağ: tamamlama
// ══════════════════════════════════════════════════════════════

/**
 * "Kaç gün önce" — sonTarih'in okunabilir hâli.
 *
 * Tarih damgası `konuDurumu` içinde hep hesaplanıyordu ama hiçbir
 * ekranda gösterilmiyordu. Oysa aralıklı tekrarda en kritik bilgi
 * budur: 40 soru çözülmüş ama üstünden iki ay geçmiş bir konu,
 * 20 soru çözülmüş taze bir konudan daha risklidir.
 */
const gunFarkiMetni = (sonTarih) => {
    if (!sonTarih) return null;
    const t = new Date(sonTarih);
    if (Number.isNaN(t.getTime())) return null;
    const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
    t.setHours(0, 0, 0, 0);
    const fark = Math.round((bugun - t) / 86400000);
    if (fark <= 0) return 'bugün';
    if (fark === 1) return 'dün';
    if (fark < 30) return `${fark} gün önce`;
    const ay = Math.round(fark / 30);
    return ay === 1 ? '1 ay önce' : `${ay} ay önce`;
};

const KonuSatiri = ({ k, onIsaretle }) => {
    const d = DURUMLAR[k.durum];

    return (
        <div className="flex items-center gap-3 px-4 py-2.5">

            {/* Sol: konu adı ve ilerleme */}
            <div className="min-w-0 flex-1">
                <p className={`text-[13px] font-bold leading-snug ${k.tamam ? 'text-ink-3 line-through' : 'text-ink'}`}>
                    {k.konu}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="badge" title={`Sınavda yaklaşık ${k.agirlik} soru`}>
                        {k.zorlukAdi}
                    </span>
                    {/* İSABET + HAM SAYILAR.
                        `dogru`, `yanlis`, `bos` hesaplanıyor ama hiçbir yerde
                        görünmüyordu; yalnızca bunlardan türetilen yüzde vardı.
                        "%50 isabet" iki doğru iki yanlıştan da gelebilir,
                        yirmi doğru yirmi yanlıştan da — ikisi aynı şey değil. */}
                    {k.basari != null && (
                        <span className={`badge ${k.basari >= 60 ? 'badge-ok' : k.basari >= 50 ? 'badge-warn' : 'badge-danger'}`}
                            title={`${k.dogru} doğru · ${k.yanlis} yanlış · ${k.bos} boş`}>
                            %{k.basari} · {k.dogru}D {k.yanlis}Y{k.bos > 0 ? ` ${k.bos}B` : ''}
                        </span>
                    )}
                    {k.dakika > 0 && (
                        <span className="badge" title="Bu konuya ayırdığın toplam süre">
                            <Clock size={10} /> {k.dakika >= 60 ? `${Math.floor(k.dakika / 60)}s ${k.dakika % 60}d` : `${k.dakika}d`}
                        </span>
                    )}
                    {gunFarkiMetni(k.sonTarih) && (
                        <span className="badge" title="Bu konuya en son ne zaman çalıştın">
                            son: {gunFarkiMetni(k.sonTarih)}
                        </span>
                    )}
                    {k.programda > 0 && (
                        <span className="badge" title="Programdaki etüt sayısı">
                            <Calendar size={10} /> {k.programYapildi}/{k.programda}
                        </span>
                    )}
                    {k.elleIsaretli && <span className="badge">✋ Kendin işaretledin</span>}
                </div>

                {!k.tamam && (
                    <div className="bar mt-1.5 max-w-xs" style={{ '--acc': d.renk, height: 4 }}>
                        <i style={{ width: `${k.oran}%` }} />
                    </div>
                )}
            </div>

            {/* Orta: çözülen / hedef soru */}
            <div className="w-24 text-center shrink-0">
                <p className="num text-sm leading-none">
                    <span style={{ color: k.soru > 0 ? 'var(--ink)' : 'var(--ink-3)' }}>{k.soru}</span>
                    <span className="text-ink-3"> / {k.hedef}</span>
                </p>
                <p className="text-[10px] text-ink-3 mt-0.5">
                    {k.tamam ? 'tamamlandı' : `${k.kalan} kaldı`}
                </p>
            </div>

            {/* Sağ: tamamlama butonu */}
            <div className="w-20 flex justify-center shrink-0">
                <button
                    onClick={() => onIsaretle(k, !k.tamam)}
                    aria-label={k.tamam ? `${k.konu} işaretini kaldır` : `${k.konu} tamamlandı işaretle`}
                    title={
                        k.durum === 'tekrar'
                            ? `Hedef doldu ama isabet %${k.basari} — tekrar önerilir`
                            : k.tamam ? 'İşareti kaldır' : 'Tamamlandı işaretle'
                    }
                    className="flex flex-col items-center gap-0.5"
                >
                    {k.tamam
                        ? <CheckCircle2 size={22} className="text-ok" />
                        : k.durum === 'tekrar'
                            ? <RotateCcw size={22} className="text-danger" />
                            : <Circle size={22} className="text-ink-3" />}
                    <span className="text-[9px] font-black leading-none" style={{ color: d.renk }}>
                        {d.ad}
                    </span>
                </button>
            </div>
        </div>
    );
};

export default TopicTracker;
