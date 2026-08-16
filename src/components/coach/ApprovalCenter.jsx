import React, { useState, useMemo, useCallback } from 'react';
import {
    CheckCircle2, XCircle, Clock, Search, ShieldCheck, Users,
} from 'lucide-react';
import onay, { TUR_LISTESI, TURLER } from '../../services/approvalService';
import { ONAY, onayDurumu, isAnaKoc, sahipKoc } from '../../services/accessControl';

/**
 * ✅ ONAY MERKEZİ
 *
 * Ana koç; eklenen koçları, öğrencileri ve velileri buradan onaylar.
 * Her satırda tekil onay/ret düğmesi, üstte seçilenler için toplu işlem
 * vardır. Alt koçların eklediği kayıtlar "bekliyor" ile başlar; onay
 * verilene kadar o kişi sisteme giriş yapamaz.
 *
 * Onay yalnızca ana koça açıktır — alt koç kendi eklediği kaydı
 * kendisi onaylayabilseydi onayın anlamı kalmazdı.
 */

const DURUM_SIRA = ['bekliyor', 'onayli', 'reddedildi'];

const ApprovalCenter = ({ user, setToast }) => {
    const [tur, setTur] = useState('ogrenci');
    const [suzgec, setSuzgec] = useState('bekliyor');
    const [arama, setArama] = useState('');
    const [secili, setSecili] = useState(() => new Set());
    const [surum, setSurum] = useState(0);

    const yenile = useCallback(() => { setSurum((v) => v + 1); setSecili(new Set()); }, []);

    const anaKoc = isAnaKoc(user);

    const kayitlar = useMemo(() => {
        const hepsi = onay.liste(tur);
        const q = arama.trim().toLocaleLowerCase('tr-TR');
        return hepsi.filter((k) => {
            if (suzgec !== 'hepsi' && onayDurumu(k) !== suzgec) return false;
            if (!q) return true;
            return [k.name, k.email, k.phone, k.grade, k.class]
                .join(' ').toLocaleLowerCase('tr-TR').includes(q);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tur, suzgec, arama, surum]);

    const ozetler = useMemo(
        () => Object.fromEntries(TUR_LISTESI.map((t) => [t.id, onay.ozet(t.id)])),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [surum]
    );

    const tekil = (id, durum) => {
        if (onay.durumDegistir(tur, id, durum, user)) {
            yenile();
            setToast?.(durum === 'onayli' ? 'Onaylandı' : durum === 'reddedildi' ? 'Reddedildi' : 'Onay geri alındı');
        }
    };

    const toplu = (durum) => {
        if (!secili.size) {
            setToast?.('Önce işlem yapılacak kayıtları seçin');
            return;
        }
        const n = onay.topluDurum(tur, [...secili], durum, user);
        yenile();
        setToast?.(`${n} kayıt ${durum === 'onayli' ? 'onaylandı' : durum === 'reddedildi' ? 'reddedildi' : 'beklemeye alındı'}`);
    };

    const tumunuSec = () => {
        setSecili((s) => (s.size === kayitlar.length
            ? new Set()
            : new Set(kayitlar.map((k) => String(k.id)))));
    };

    const secimDegistir = (id) => {
        setSecili((s) => {
            const y = new Set(s);
            const k = String(id);
            if (y.has(k)) y.delete(k); else y.add(k);
            return y;
        });
    };

    if (!anaKoc) {
        return (
            <div className="srf p-8 text-center">
                <ShieldCheck size={30} className="mx-auto text-ink-3 mb-3" />
                <p className="t-title text-sm">Onay yetkisi ana koça aittir</p>
                <p className="text-[11px] text-ink-3 mt-1 leading-snug">
                    Eklediğiniz kayıtlar ana koç onayına düşer. Onaylanana kadar ilgili
                    kişi sisteme giriş yapamaz.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">

            {/* ── Başlık ─────────────────────────────────── */}
            <div className="flex items-start gap-3">
                <span className="sec-icon" style={{ '--acc': 'var(--ok)' }}>
                    <ShieldCheck size={16} />
                </span>
                <div className="min-w-0">
                    <h3 className="h3">Onay Merkezi</h3>
                    <p className="text-[11px] text-ink-3 leading-snug">
                        Koç, öğrenci ve veli kayıtlarını tek tek ya da toplu onaylayın.
                        Onaysız kayıtlar giriş yapamaz.
                    </p>
                </div>
            </div>

            {/* ── Tür sekmeleri ──────────────────────────── */}
            <div className="tabbar">
                {TUR_LISTESI.map((t) => {
                    const o = ozetler[t.id] || { bekliyor: 0 };
                    const on = tur === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => { setTur(t.id); setSecili(new Set()); }}
                            aria-selected={on}
                            className={`tb ${on ? 'is-on' : ''}`}
                        >
                            <span>{t.icon}</span> {t.ad}
                            {o.bekliyor > 0 && (
                                <span className="badge badge-warn ml-1">{o.bekliyor}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Süzgeç ve toplu işlem ──────────────────── */}
            <div className="srf p-3 flex flex-wrap items-center gap-2">
                <div className="tabbar">
                    {['bekliyor', 'onayli', 'reddedildi', 'hepsi'].map((d) => (
                        <button
                            key={d}
                            onClick={() => { setSuzgec(d); setSecili(new Set()); }}
                            aria-selected={suzgec === d}
                            className={`tb ${suzgec === d ? 'is-on' : ''}`}
                        >
                            {d === 'hepsi' ? 'Tümü' : ONAY[d].ad}
                            <span className="badge ml-1">
                                {d === 'hepsi'
                                    ? (ozetler[tur]?.toplam ?? 0)
                                    : (ozetler[tur]?.[d] ?? 0)}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="relative flex-1 min-w-[150px]">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
                    <input
                        value={arama}
                        onChange={(e) => setArama(e.target.value)}
                        placeholder="Ad, telefon veya e-posta ara…"
                        className="fld pl-8"
                    />
                </div>
            </div>

            {/* Toplu işlem şeridi — yalnızca seçim varken görünür,
                boşken ekranda gereksiz düğme durmasın */}
            {secili.size > 0 && (
                <div className="srf srf-accent p-3 flex flex-wrap items-center gap-2" style={{ '--acc': 'var(--brand)' }}>
                    <span className="text-[12px] font-bold text-ink">
                        {secili.size} kayıt seçili
                    </span>
                    <div className="flex-1" />
                    <button onClick={() => toplu('onayli')} className="b b-fill b-ok b-sm">
                        <CheckCircle2 size={13} /> Toplu Onayla
                    </button>
                    <button onClick={() => toplu('reddedildi')} className="b b-line b-sm">
                        <XCircle size={13} /> Toplu Reddet
                    </button>
                    <button onClick={() => toplu('bekliyor')} className="b b-line b-sm">
                        <Clock size={13} /> Beklemeye Al
                    </button>
                    <button onClick={() => setSecili(new Set())} className="b b-bare b-sm">
                        Seçimi Temizle
                    </button>
                </div>
            )}

            {/* ── Liste ──────────────────────────────────── */}
            <div className="srf overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-2.5 border-b border-line bg-surface-2">
                    <input
                        type="checkbox"
                        checked={kayitlar.length > 0 && secili.size === kayitlar.length}
                        onChange={tumunuSec}
                        aria-label="Tümünü seç"
                        className="accent-indigo-600"
                    />
                    <span className="eyebrow">
                        {TURLER[tur].ad} — {kayitlar.length} kayıt
                    </span>
                </div>

                {kayitlar.length === 0 ? (
                    <div className="p-10 text-center">
                        <Users size={26} className="mx-auto text-ink-3 mb-2" />
                        <p className="text-xs text-ink-3">
                            {suzgec === 'bekliyor'
                                ? 'Onay bekleyen kayıt yok — hepsi işlenmiş.'
                                : 'Bu süzgeçte kayıt bulunmuyor.'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-line">
                        {kayitlar.map((k) => {
                            const d = onayDurumu(k);
                            const sahip = sahipKoc(k);
                            return (
                                <div key={k.id} className="flex items-center gap-3 px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={secili.has(String(k.id))}
                                        onChange={() => secimDegistir(k.id)}
                                        aria-label={`${k.name} seç`}
                                        className="accent-indigo-600 shrink-0"
                                    />

                                    <div className="min-w-0 flex-1">
                                        <p className="text-[13px] font-bold text-ink leading-snug truncate">
                                            {k.name || k.email || `#${k.id}`}
                                        </p>
                                        <p className="text-[10px] text-ink-3 truncate">
                                            {[k.phone, k.email, k.grade && `${k.grade}${k.class || ''}`]
                                                .filter(Boolean).join(' · ') || '—'}
                                            {k.ownerCoachName && ` · Ekleyen: ${k.ownerCoachName}`}
                                            {!k.ownerCoachName && sahip && ` · Koç #${sahip}`}
                                        </p>
                                    </div>

                                    <span
                                        className={`badge shrink-0 ${d === 'onayli' ? 'badge-ok' : d === 'reddedildi' ? 'badge-danger' : 'badge-warn'}`}
                                    >
                                        {ONAY[d].ad}
                                    </span>

                                    <div className="flex items-center gap-1 shrink-0">
                                        {d !== 'onayli' && (
                                            <button
                                                onClick={() => tekil(k.id, 'onayli')}
                                                className="b b-line b-icon b-sm"
                                                title="Onayla"
                                                aria-label={`${k.name} onayla`}
                                            >
                                                <CheckCircle2 size={14} className="text-ok" />
                                            </button>
                                        )}
                                        {d !== 'reddedildi' && (
                                            <button
                                                onClick={() => tekil(k.id, 'reddedildi')}
                                                className="b b-line b-icon b-sm"
                                                title="Reddet"
                                                aria-label={`${k.name} reddet`}
                                            >
                                                <XCircle size={14} className="text-danger" />
                                            </button>
                                        )}
                                        {d !== 'bekliyor' && (
                                            <button
                                                onClick={() => tekil(k.id, 'bekliyor')}
                                                className="b b-line b-icon b-sm"
                                                title="Beklemeye al"
                                                aria-label={`${k.name} beklemeye al`}
                                            >
                                                <Clock size={14} className="text-warn" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <p className="text-[11px] text-ink-3 leading-snug">
                Onay durumu hem yönetim listesine hem giriş kaydına yazılır; reddedilen
                ya da beklemedeki kişi sisteme giriş yapamaz.
                Sıra: {DURUM_SIRA.map((d) => ONAY[d].ad).join(' → ')}
            </p>
        </div>
    );
};

export default ApprovalCenter;
