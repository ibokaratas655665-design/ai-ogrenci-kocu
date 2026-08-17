import React, { useState, useMemo } from 'react';
import { ArrowUp, ArrowDown, ChevronsUpDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';
import { BosDurum } from './Durumlar';
import Button from './Button';

/**
 * 📋 VERİ TABLOSU
 *
 * Kod tabanında 16 dosyada ham `<table>` vardı; sıralama, arama ve
 * sayfalama her birinde ayrı yazılmış ya da hiç yoktu.
 *
 * Mobil çözümü de kabaydı: `styles/mobil.css` tabloyu
 * `display:block; white-space:nowrap` yapıp yatay kaydırılabilir
 * kılıyordu — ama kaydırınca BAŞLIK SATIRI kayboluyor, kullanıcı hangi
 * sütuna baktığını bilemiyordu.
 *
 * Burada tablo dar ekranda sıkıştırılmaz; KART listesine dönüşür.
 * Her kart, tablodaki satırın aynısını etiketleriyle birlikte taşır.
 *
 * Sütun tanımı:
 *   { anahtar, baslik, hizala, siralanabilir, genislik,
 *     bicim: (satir) => ReactNode,
 *     mobilGizle: kartta gösterme }
 */
export default function DataTable({
    sutunlar = [],
    satirlar = [],
    anahtarAlan = 'id',
    arama = true,
    aramaAlanlari,
    aramaIpucu = 'Ara…',
    sayfaBoyutu = 0,          // 0 = sayfalama yok
    onSatirTikla,
    bosBaslik = 'Kayıt yok',
    bosAciklama,
    ustEk,
    className,
}) {
    const [sorgu, setSorgu] = useState('');
    const [sirala, setSirala] = useState({ alan: null, yon: 'asc' });
    const [sayfa, setSayfa] = useState(0);

    /** Arama — belirtilen alanlarda, Türkçe karakterlere duyarsız. */
    const sadelestir = (v) => String(v ?? '')
        .replace(/[İI]/g, 'i').toLocaleLowerCase('tr-TR');

    const suzulmus = useMemo(() => {
        if (!sorgu.trim()) return satirlar;
        const alanlar = aramaAlanlari || sutunlar.map((s) => s.anahtar);
        const q = sadelestir(sorgu);
        return satirlar.filter((r) => alanlar.some((a) => sadelestir(r[a]).includes(q)));
    }, [satirlar, sorgu, aramaAlanlari, sutunlar]);

    const sirali = useMemo(() => {
        if (!sirala.alan) return suzulmus;
        const kopya = [...suzulmus];
        kopya.sort((a, b) => {
            const x = a[sirala.alan], y = b[sirala.alan];
            if (x == null && y == null) return 0;
            if (x == null) return 1;          // boşlar hep sonda
            if (y == null) return -1;
            if (typeof x === 'number' && typeof y === 'number') return x - y;
            return String(x).localeCompare(String(y), 'tr');
        });
        return sirala.yon === 'desc' ? kopya.reverse() : kopya;
    }, [suzulmus, sirala]);

    const sayfaSayisi = sayfaBoyutu ? Math.ceil(sirali.length / sayfaBoyutu) : 1;
    const guvenliSayfa = Math.min(sayfa, Math.max(0, sayfaSayisi - 1));
    const gosterilen = sayfaBoyutu
        ? sirali.slice(guvenliSayfa * sayfaBoyutu, (guvenliSayfa + 1) * sayfaBoyutu)
        : sirali;

    const siralamaDegistir = (alan) => {
        setSayfa(0);
        setSirala((o) => o.alan === alan
            ? { alan, yon: o.yon === 'asc' ? 'desc' : 'asc' }
            : { alan, yon: 'asc' });
    };

    const hucre = (sutun, satir) => (sutun.bicim ? sutun.bicim(satir) : satir[sutun.anahtar] ?? '—');

    return (
        <div className={cn('w-full', className)}>

            {/* ── Araç çubuğu ─────────────────────────────────────── */}
            {(arama || ustEk) && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                    {arama && (
                        <div className="relative flex-1 min-w-0">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" aria-hidden="true" />
                            <input
                                type="search"
                                value={sorgu}
                                onChange={(e) => { setSorgu(e.target.value); setSayfa(0); }}
                                placeholder={aramaIpucu}
                                aria-label={aramaIpucu}
                                className="w-full pl-9"
                            />
                        </div>
                    )}
                    {ustEk}
                </div>
            )}

            {!gosterilen.length ? (
                <BosDurum
                    baslik={sorgu ? 'Eşleşen kayıt yok' : bosBaslik}
                    aciklama={sorgu ? `"${sorgu}" için sonuç bulunamadı.` : bosAciklama}
                    eylem={sorgu ? <Button varyant="outline" onClick={() => setSorgu('')}>Aramayı temizle</Button> : null}
                />
            ) : (
                <>
                    {/* ── MOBİL: kart listesi ─────────────────────────
                        Tablo sıkıştırılmaz; satır kart olur ve her değer
                        kendi etiketiyle gelir. */}
                    <ul className="lg:hidden divide-y divide-line border-y border-line">
                        {gosterilen.map((satir) => (
                            <li key={satir[anahtarAlan]}>
                                {React.createElement(
                                    onSatirTikla ? 'button' : 'div',
                                    {
                                        ...(onSatirTikla ? {
                                            type: 'button',
                                            onClick: () => onSatirTikla(satir),
                                            className: 'w-full text-left px-4 py-3.5 min-h-[64px] transition-colors duration-hizli hover:bg-surface-3 active:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset',
                                        } : { className: 'px-4 py-3.5' }),
                                    },
                                    <>
                                        <p className="tip-small font-bold text-ink mb-1.5">
                                            {hucre(sutunlar[0], satir)}
                                        </p>
                                        <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
                                            {sutunlar.slice(1).filter((s) => !s.mobilGizle).map((s) => (
                                                <div key={s.anahtar} className="min-w-0">
                                                    <dt className="tip-mini text-ink-3">{s.baslik}</dt>
                                                    <dd className="tip-caption text-ink-2 truncate">{hucre(s, satir)}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>

                    {/* ── MASAÜSTÜ: tam tablo ─────────────────────────
                        Başlık satırı yapışık — uzun listede kaydırırken
                        hangi sütuna bakıldığı kaybolmasın. */}
                    <div className="hidden lg:block overflow-x-auto rounded-dlg border border-line">
                        <table className="min-w-full border-collapse">
                            <thead className="bg-surface-2 sticky top-0 z-10">
                                <tr>
                                    {sutunlar.map((s) => {
                                        const aktif = sirala.alan === s.anahtar;
                                        const Ok = !aktif ? ChevronsUpDown : sirala.yon === 'asc' ? ArrowUp : ArrowDown;
                                        return (
                                            <th
                                                key={s.anahtar}
                                                scope="col"
                                                style={s.genislik ? { width: s.genislik } : undefined}
                                                aria-sort={aktif ? (sirala.yon === 'asc' ? 'ascending' : 'descending') : undefined}
                                                className={cn(
                                                    'tip-mini text-ink-3 px-4 py-3 border-b border-line whitespace-nowrap',
                                                    s.hizala === 'sag' ? 'text-right' : s.hizala === 'orta' ? 'text-center' : 'text-left'
                                                )}
                                            >
                                                {s.siralanabilir === false ? s.baslik : (
                                                    <button
                                                        type="button"
                                                        onClick={() => siralamaDegistir(s.anahtar)}
                                                        className={cn(
                                                            'inline-flex items-center gap-1 hover:text-ink transition-colors duration-hizli rounded-dsm',
                                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                                                            aktif && 'text-brand'
                                                        )}
                                                    >
                                                        {s.baslik}
                                                        <Ok size={12} aria-hidden="true" />
                                                    </button>
                                                )}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {gosterilen.map((satir) => (
                                    <tr
                                        key={satir[anahtarAlan]}
                                        onClick={onSatirTikla ? () => onSatirTikla(satir) : undefined}
                                        className={cn(
                                            'transition-colors duration-hizli',
                                            onSatirTikla && 'cursor-pointer hover:bg-surface-3'
                                        )}
                                    >
                                        {sutunlar.map((s) => (
                                            <td
                                                key={s.anahtar}
                                                className={cn(
                                                    'px-4 py-3 tip-small text-ink-2 align-middle',
                                                    s.hizala === 'sag' ? 'text-right rakam' : s.hizala === 'orta' ? 'text-center' : 'text-left'
                                                )}
                                            >
                                                {hucre(s, satir)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Sayfalama ───────────────────────────────── */}
                    {sayfaBoyutu > 0 && sayfaSayisi > 1 && (
                        <nav className="flex items-center justify-between gap-3 mt-3" aria-label="Sayfalama">
                            <p className="tip-caption">
                                {guvenliSayfa * sayfaBoyutu + 1}–{Math.min((guvenliSayfa + 1) * sayfaBoyutu, sirali.length)}
                                {' / '}{sirali.length} kayıt
                            </p>
                            <div className="flex items-center gap-1.5">
                                <Button
                                    varyant="ghost" boyut="sm" yalnizSimge etiket="Önceki sayfa" simge={ChevronLeft}
                                    disabled={guvenliSayfa === 0}
                                    onClick={() => setSayfa((s) => Math.max(0, s - 1))}
                                />
                                <span className="tip-caption rakam px-1">{guvenliSayfa + 1} / {sayfaSayisi}</span>
                                <Button
                                    varyant="ghost" boyut="sm" yalnizSimge etiket="Sonraki sayfa" simge={ChevronRight}
                                    disabled={guvenliSayfa >= sayfaSayisi - 1}
                                    onClick={() => setSayfa((s) => Math.min(sayfaSayisi - 1, s + 1))}
                                />
                            </div>
                        </nav>
                    )}
                </>
            )}
        </div>
    );
}
