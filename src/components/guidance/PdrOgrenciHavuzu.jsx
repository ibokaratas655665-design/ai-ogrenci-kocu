/**
 * 🏫 PDR Öğrenci Havuzu sekmesi (V1.1)
 *
 * Okul kapsamlı öğrenci listesi: elle ekleme, toplu yapıştırma,
 * arama ve silme. Havuzdaki öğrenciler PDR modüllerinde (görüşme,
 * envanter, risk, BEP) ve PDR gruplarında kullanılabilir; koçluk
 * öğrenci listesine ASLA karışmaz (bkz. services/pdrOgrencileri).
 */
import React, { useMemo, useState } from 'react';
import { Users, UserPlus, Upload, Trash2, Search } from 'lucide-react';
import Modal from '../ui/Modal';
import { bildir, onayla } from '../../services/uiGeriBildirim';
import pdrHavuz from '../../services/pdrOgrencileri';

const GIRDI_SINIF = 'w-full bg-surface border border-line rounded-xl px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand/40';

export default function PdrOgrenciHavuzu({ onDegisti }) {
    const [surum, setSurum] = useState(0);
    const [arama, setArama] = useState('');
    const [pencere, setPencere] = useState(null); // null | 'tek' | 'toplu'
    const [form, setForm] = useState({ name: '', schoolNumber: '', grade: '', section: '' });
    const [topluMetin, setTopluMetin] = useState('');

    // eslint-disable-next-line react-hooks/exhaustive-deps -- surum bilinçli: listele() reaktif değil, ekleme/silme sonrası yeniden okutur
    const liste = useMemo(() => pdrHavuz.listele(), [surum]);
    const suzulmus = useMemo(() => {
        const q = arama.trim().toLocaleLowerCase('tr-TR');
        if (!q) return liste;
        return liste.filter((o) =>
            `${o.name} ${o.schoolNumber} ${o.grade}${o.section}`.toLocaleLowerCase('tr-TR').includes(q));
    }, [liste, arama]);

    const yenile = () => { setSurum((v) => v + 1); onDegisti?.(); };

    const tekEkle = () => {
        const sonuc = pdrHavuz.ekle(form);
        if (!sonuc.basarili) { bildir(sonuc.hata, 'uyari'); return; }
        bildir(`${sonuc.kayit.name} havuza eklendi.`, 'basari');
        setForm({ name: '', schoolNumber: '', grade: '', section: '' });
        setPencere(null);
        yenile();
    };

    const topluYukle = () => {
        const { eklenen, atlanan } = pdrHavuz.topluEkle(topluMetin);
        if (!eklenen && !atlanan.length) { bildir('Yüklenecek satır bulunamadı.', 'uyari'); return; }
        bildir(
            atlanan.length
                ? `${eklenen} öğrenci eklendi, ${atlanan.length} satır atlandı (${atlanan[0].sebep}${atlanan.length > 1 ? '…' : ''}).`
                : `${eklenen} öğrenci eklendi.`,
            eklenen ? 'basari' : 'uyari'
        );
        if (eklenen) { setTopluMetin(''); setPencere(null); yenile(); }
    };

    const ogrenciSil = async (o) => {
        const onay = await onayla({
            mesaj: `${o.name} PDR havuzundan silinsin mi? Bu işlem öğrencinin havuz kaydını kaldırır; koçluk verilerine dokunmaz.`,
            tehlikeli: true,
        });
        if (!onay) return;
        const sonuc = pdrHavuz.sil(o.id);
        if (!sonuc.basarili) { bildir(sonuc.hata, 'hata'); return; }
        bildir(`${o.name} havuzdan silindi.`, 'basari');
        yenile();
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="tip-h3 flex items-center gap-2">
                        <Users size={20} className="text-brand" /> PDR Öğrenci Havuzu
                    </h2>
                    <p className="tip-caption mt-1">
                        Okul kapsamlı liste — koçluk öğrencilerinden ayrı tutulur; PDR modülleri ve gruplar bu havuzu görür.
                    </p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => setPencere('toplu')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-3 text-ink-2 text-xs font-bold hover:bg-surface-2 transition"
                    >
                        <Upload size={14} /> Toplu Yükle
                    </button>
                    <button
                        type="button"
                        onClick={() => setPencere('tek')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-hover transition"
                    >
                        <UserPlus size={14} /> Öğrenci Ekle
                    </button>
                </div>
            </div>

            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
                <input
                    value={arama}
                    onChange={(e) => setArama(e.target.value)}
                    placeholder="Ad, numara veya sınıf ara…"
                    className={`${GIRDI_SINIF} pl-9`}
                />
            </div>

            {suzulmus.length === 0 ? (
                <div className="text-center py-14 text-ink-3 border border-dashed border-line rounded-2xl">
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">
                        {liste.length === 0 ? 'Havuz boş — toplu liste yükleyin veya öğrenci ekleyin.' : 'Aramaya uyan öğrenci yok.'}
                    </p>
                </div>
            ) : (
                <div className="border border-line rounded-2xl overflow-hidden divide-y divide-line">
                    {suzulmus.map((o) => (
                        <div key={o.id} className="flex items-center gap-3 px-4 py-3 bg-surface hover:bg-surface-2 transition">
                            <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand flex items-center justify-center font-black shrink-0">
                                {o.name.charAt(0).toLocaleUpperCase('tr-TR')}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-ink truncate">{o.name}</p>
                                <p className="text-xs text-ink-3">
                                    {[o.schoolNumber && `No: ${o.schoolNumber}`, (o.grade || o.section) && `${o.grade}${o.section ? `-${o.section}` : ''}`]
                                        .filter(Boolean).join(' · ') || 'Bilgi girilmemiş'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => ogrenciSil(o)}
                                aria-label={`${o.name} kaydını sil`}
                                className="p-2 rounded-lg text-ink-3 hover:text-danger hover:bg-danger/10 transition"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <p className="tip-caption text-ink-3">{liste.length} öğrenci havuzda.</p>

            {pencere === 'tek' && (
                <Modal acik onClose={() => setPencere(null)} baslik="PDR Havuzuna Öğrenci Ekle" genislik="md"
                    altCubuk={(
                        <>
                            <button type="button" onClick={() => setPencere(null)} className="px-4 py-2 rounded-xl bg-surface-3 text-ink-2 text-sm font-bold">İptal</button>
                            <button type="button" onClick={tekEkle} className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-bold">Ekle</button>
                        </>
                    )}
                >
                    <div className="space-y-3">
                        <div>
                            <label className="tip-label text-ink-3 block mb-1" htmlFor="pdr-ad">Ad Soyad *</label>
                            <input id="pdr-ad" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={GIRDI_SINIF} />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="tip-label text-ink-3 block mb-1" htmlFor="pdr-no">Okul No</label>
                                <input id="pdr-no" value={form.schoolNumber} onChange={(e) => setForm((p) => ({ ...p, schoolNumber: e.target.value }))} className={GIRDI_SINIF} />
                            </div>
                            <div>
                                <label className="tip-label text-ink-3 block mb-1" htmlFor="pdr-sinif">Sınıf</label>
                                <input id="pdr-sinif" value={form.grade} onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value }))} placeholder="11" className={GIRDI_SINIF} />
                            </div>
                            <div>
                                <label className="tip-label text-ink-3 block mb-1" htmlFor="pdr-sube">Şube</label>
                                <input id="pdr-sube" value={form.section} onChange={(e) => setForm((p) => ({ ...p, section: e.target.value }))} placeholder="A" className={GIRDI_SINIF} />
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {pencere === 'toplu' && (
                <Modal acik onClose={() => setPencere(null)} baslik="Toplu Öğrenci Yükle" genislik="lg"
                    aciklama="Her satır bir öğrenci: Ad Soyad; Okul No; Sınıf; Şube (No/Sınıf/Şube isteğe bağlı). Excel'den kopyalayıp yapıştırabilirsiniz."
                    altCubuk={(
                        <>
                            <button type="button" onClick={() => setPencere(null)} className="px-4 py-2 rounded-xl bg-surface-3 text-ink-2 text-sm font-bold">İptal</button>
                            <button type="button" onClick={topluYukle} className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-bold">Yükle</button>
                        </>
                    )}
                >
                    <textarea
                        value={topluMetin}
                        onChange={(e) => setTopluMetin(e.target.value)}
                        rows={10}
                        placeholder={'Ayşe Yılmaz; 245; 11; A\nMehmet Demir; 246; 11; A'}
                        className={`${GIRDI_SINIF} font-mono`}
                    />
                </Modal>
            )}
        </div>
    );
}
