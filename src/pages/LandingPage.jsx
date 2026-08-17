import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight, Check, X as XIcon, Target, TrendingUp, Users, FolderOpen,
    ClipboardList, MessageSquare, ShieldCheck, Sparkles, PlayCircle,
    GraduationCap, UserCog, Home, Download, Smartphone, Monitor, Apple,
    MessageCircle,
} from 'lucide-react';
import { PLANLAR, ogrenciBasiAylik, sezonBilgisi, DENEME_GUN, tl } from '../data/pricingPlans';
import MARKA from '../data/marka';

/**
 * 🏠 KARŞILAMA SAYFASI
 *
 * Önceki sürümde sayfada yer alan ama gerçeği karşılamayan öğeler
 * kaldırıldı:
 *   · "10 Bin+ oluşturulan program", "%95 kullanıcı memnuniyeti",
 *     "50+ rehberlik envanteri" gibi doğrulanamayan sayılar,
 *   · var olmayan bir bölüme giden "#pricing" bağlantısı,
 *   · karşılığı olmayan "7 gün ücretsiz deneme / kredi kartı gerekmez"
 *     vaadi.
 *
 * Yerlerine uygulamanın GERÇEKTEN yaptığı işler ve gerçek paket
 * yapısı kondu. Uygulamanın iki tarafı var — özel koçluk ve okul
 * rehberlik servisi — sayfa da bu ikisini ayrı ayrı anlatıyor.
 */

const KOCLUK = [
    { icon: Target, ad: 'Ders Programı', not: 'Haftalık program oluşturucu, öğrenciye anında düşer.' },
    { icon: TrendingUp, ad: 'Deneme Analizi', not: 'Excel/PDF yükle; net, konu ve gelişim analizi çıksın.' },
    { icon: ClipboardList, ad: 'Görev Takibi', not: 'Görev ata, öğrenci tamamlayınca panelinde görün.' },
    { icon: MessageSquare, ad: 'Veli İletişimi', not: 'Veli portalı ve WhatsApp toplu mesaj.' },
];

const REHBERLIK = [
    { icon: FolderOpen, ad: '10 Resmî Dosya', not: 'Rehberlik servisinin desimal dosya düzeni ekranda.' },
    { icon: ShieldCheck, ad: 'MEB Formatlı Belge', not: 'T.C. başlıklı, imza bloklu, evrak sayılı PDF çıktısı.' },
    { icon: Users, ad: 'Envanter ve Sosyometri', not: 'Uygula, sonucu dosyaya otomatik bağla.' },
    { icon: Sparkles, ad: 'BEP ve Materyal', not: 'Kaynaştırma dosyası, broşür ve etkinlik planı üretici.' },
];

const ROLLER = [
    {
        id: 'coach', icon: UserCog, ad: 'Koç / Rehber Öğretmen',
        not: 'Öğrenci ekle, program yaz, dosya tut. Ücreti yalnızca siz ödersiniz.',
    },
    {
        id: 'student', icon: GraduationCap, ad: 'Öğrenci',
        not: 'Programını, görevlerini ve deneme analizini gör. Her zaman ücretsiz.',
    },
    {
        /**
         * Velinin GİRİŞİ YOKTUR — bilinçli bir tercih.
         *
         * Veli, koçun WhatsApp'tan gönderdiği bağlantıyla raporu açar;
         * kullanıcı adı ve şifre istenmez. Pratikte veliye şifre vermek,
         * kimsenin kullanmadığı bir adım oluyor.
         *
         * Kart eskiden "Giriş yap" diyordu; karşılığı olmayan bir yönlendirme
         * idi. Artık gerçekte ne olduğunu anlatıyor.
         */
        id: 'parent', icon: Home, ad: 'Veli',
        not: 'Koçun gönderdiği bağlantıyla çocuğunuzun gelişimini görün. Şifre gerekmez, ücretsizdir.',
        girisYok: true,
        eylemNotu: 'Bağlantı koçtan gelir',
    },
];

const LandingPage = () => {
    const navigate = useNavigate();
    const [taraf, setTaraf] = useState('kocluk');
    const sezon = sezonBilgisi();

    const girisAc = (rol) => navigate(`/login?rol=${rol}`);

    return (
        <div className="min-h-screen bg-page text-ink">

            {/* ── Üst çubuk ──────────────────────────────── */}
            <nav className="fixed w-full z-40 bg-surface/85 backdrop-blur-md border-b border-line">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                    {/* Üst çubukta yalnızca amblem — logonun yazı kısmı bu
                        boyutta okunmuyor, ad zaten yanında metin olarak var. */}
                    <div className="flex items-center gap-2 min-w-0">
                        <img src={MARKA.amblem} alt="" width="36" height="36"
                            className="w-9 h-9 shrink-0 object-contain" />
                        <span className="font-black text-sm sm:text-base truncate">{MARKA.ad}</span>
                    </div>

                    <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-ink-2">
                        <a href="#neler-yapar" className="hover:text-brand transition">Neler Yapar</a>
                        <a href="#paketler" className="hover:text-brand transition">Paketler</a>
                        <a href="#kimler" className="hover:text-brand transition">Kimler Kullanır</a>
                        <a href="#indir" className="hover:text-brand transition">İndir</a>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => navigate('/login?demo=1')} className="b b-line b-sm">
                            <PlayCircle size={14} /> Demo
                        </button>
                        <button onClick={() => navigate('/login')} className="b b-fill b-brand b-sm">
                            Giriş Yap
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── Giriş bölümü ───────────────────────────── */}
            <section className="pt-28 pb-14 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <span className="badge badge-ok mb-5">
                        {sezon.etiket} sezonu · Öğrenci ve veli hesapları ücretsiz
                    </span>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.08] mb-5">
                        Koçluk çalışmanız ve rehberlik dosyanız
                        <span className="text-brand"> tek uygulamada</span>
                    </h1>
                    <p className="text-lg text-ink-2 max-w-2xl mx-auto leading-relaxed mb-8">
                        Özel öğrenci koçluğu için program, deneme analizi ve görev takibi;
                        okul rehberlik servisi için MEB düzenine uygun dosya ve belge yönetimi.
                        İkisi ayrı bölüm, aynı sistem.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-2.5">
                        <button onClick={() => navigate('/login?demo=1')} className="b b-fill b-brand b-lg">
                            <PlayCircle size={18} /> Demo Sürümü Dene
                        </button>
                        <button onClick={() => navigate('/login?kayit=1')} className="b b-line b-lg">
                            Ücretsiz Hesap Aç <ArrowRight size={16} />
                        </button>
                    </div>
                    <p className="text-xs text-ink-3 mt-4">
                        Demo gerçek ekranları örnek veriyle açar · Ücretsiz paket süresizdir, kart istemez
                    </p>
                </div>
            </section>

            {/* ── Neler yapar ────────────────────────────── */}
            <section id="neler-yapar" className="py-14 px-4 bg-surface border-y border-line">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl md:text-3xl font-black mb-2">Uygulama Ne Yapıyor?</h2>
                        <p className="text-ink-2 text-sm">İki ayrı iş, iki ayrı bölüm.</p>
                    </div>

                    <div className="tabbar mx-auto w-fit mb-6">
                        <button
                            onClick={() => setTaraf('kocluk')}
                            aria-selected={taraf === 'kocluk'}
                            className={`tb ${taraf === 'kocluk' ? 'is-on' : ''}`}
                        >
                            Koçluk Çalışmaları
                        </button>
                        <button
                            onClick={() => setTaraf('pdr')}
                            aria-selected={taraf === 'pdr'}
                            className={`tb ${taraf === 'pdr' ? 'is-on' : ''}`}
                            style={taraf === 'pdr' ? { '--brand': 'var(--accent)' } : undefined}
                        >
                            Rehberlik (PDR)
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {(taraf === 'kocluk' ? KOCLUK : REHBERLIK).map((o) => (
                            <div
                                key={o.ad}
                                className="srf srf-accent p-4"
                                style={{ '--acc': taraf === 'kocluk' ? 'var(--brand)' : 'var(--accent)' }}
                            >
                                <span
                                    className="sec-icon mb-2"
                                    style={{ '--acc': taraf === 'kocluk' ? 'var(--brand)' : 'var(--accent)' }}
                                >
                                    <o.icon size={16} />
                                </span>
                                <p className="t-title text-[13px] leading-tight">{o.ad}</p>
                                <p className="text-[11px] text-ink-3 mt-1 leading-snug">{o.not}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Kimler kullanır ────────────────────────── */}
            <section id="kimler" className="py-14 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl md:text-3xl font-black mb-2">Kimler Kullanır?</h2>
                        <p className="text-ink-2 text-sm">Üç ayrı panel; koç ve öğrenci girişiyle, veli bağlantıyla.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {ROLLER.map((r) => {
                            /* Velinin girişi yok: kart tıklanabilir olmamalı,
                               yoksa kullanıcı olmayan bir giriş ekranı arar. */
                            const Etiket = r.girisYok ? 'div' : 'button';
                            return (
                                <Etiket
                                    key={r.id}
                                    {...(r.girisYok ? {} : { onClick: () => girisAc(r.id) })}
                                    className={`srf p-5 text-left ${r.girisYok ? '' : 'srf-hover'}`}
                                >
                                    <span className="sec-icon mb-3" style={{ '--acc': 'var(--brand)' }}>
                                        <r.icon size={17} />
                                    </span>
                                    <p className="t-title text-sm">{r.ad}</p>
                                    <p className="text-[11px] text-ink-3 mt-1 leading-snug">{r.not}</p>
                                    {r.girisYok ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ink-3 mt-3">
                                            <MessageCircle size={12} /> {r.eylemNotu}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand mt-3">
                                            Giriş yap <ArrowRight size={12} />
                                        </span>
                                    )}
                                </Etiket>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── Paketler ───────────────────────────────── */}
            <section id="paketler" className="py-14 px-4 bg-surface border-y border-line">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-3">
                        <h2 className="text-2xl md:text-3xl font-black mb-2">Paketler</h2>
                        <p className="text-ink-2 text-sm max-w-xl mx-auto leading-relaxed">
                            Ücreti yalnızca koç öder. Öğrenci ve veli hesapları her pakette ücretsizdir.
                            Fiyat öğrenci sayısına göre değişir — özellikler her pakette aynıdır.
                        </p>
                    </div>
                    <p className="text-center text-[11px] text-ink-3 mb-8">
                        Sezon: {sezon.baslangic.split('-').reverse().join('.')} –{' '}
                        {sezon.bitis.split('-').reverse().join('.')} · Otomatik yenileme yok
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {PLANLAR.map((p) => {
                            const aylik = ogrenciBasiAylik(p);
                            return (
                                <div
                                    key={p.id}
                                    className={`srf p-5 flex flex-col ${p.vurgu ? 'srf-3' : ''}`}
                                    style={p.vurgu ? { borderColor: 'var(--brand)' } : undefined}
                                >
                                    {p.rozet && (
                                        <span className={`badge mb-2 self-start ${p.vurgu ? 'badge-ok' : ''}`}>
                                            {p.rozet}
                                        </span>
                                    )}
                                    <p className="t-title text-sm">{p.ad}</p>

                                    <p className="num text-2xl mt-2">
                                        {p.fiyat === 0 ? 'Ücretsiz' : tl(p.fiyat)}
                                    </p>
                                    <p className="text-[11px] text-ink-3">
                                        {p.fiyat === 0 ? 'Süresiz' : `${p.sure} · ${sezon.etiket}`}
                                    </p>
                                    {aylik && (
                                        <p className="text-[10px] text-ink-3 mt-0.5">
                                            ≈ öğrenci başına aylık {tl(aylik)}
                                        </p>
                                    )}

                                    <p className="text-[11px] text-ink-2 mt-3 leading-snug">{p.aciklama}</p>

                                    <ul className="space-y-1.5 mt-3 flex-1">
                                        {p.ozellikler.map((o) => (
                                            <li key={o} className="flex items-start gap-1.5 text-[11px] text-ink leading-snug">
                                                <Check size={12} className="text-ok shrink-0 mt-0.5" /> {o}
                                            </li>
                                        ))}
                                        {p.yok?.map((o) => (
                                            <li key={o} className="flex items-start gap-1.5 text-[11px] text-ink-3 leading-snug">
                                                <XIcon size={12} className="shrink-0 mt-0.5" /> {o}
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => navigate(`/login?kayit=1&plan=${p.id}`)}
                                        className={`b b-sm w-full mt-4 ${p.vurgu ? 'b-fill b-brand' : 'b-line'}`}
                                    >
                                        {p.fiyat === 0 ? 'Ücretsiz Başla' : 'Bu Paketi Seç'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="srf srf-accent p-4 mt-5" style={{ '--acc': 'var(--highlight)' }}>
                        <p className="text-[12px] text-ink leading-snug">
                            <strong>İndirim kuponunuz var mı?</strong> Koçunuzdan aldığınız kupon kodunu
                            kayıt ekranında girin; paket ücreti kupon oranında düşer.
                            Ayrıca ücretli paketleri {DENEME_GUN} gün ücretsiz deneyebilirsiniz.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── İndir ──────────────────────────────────── */}
            <section id="indir" className="py-14 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl md:text-3xl font-black mb-2">Uygulamayı İndir</h2>
                    <p className="text-ink-2 text-sm mb-8">
                        Tarayıcıdan kullanabilir ya da cihazınıza kurabilirsiniz.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { icon: Smartphone, ad: 'Android', not: 'APK ile kurulum', renk: 'var(--ok)' },
                            { icon: Monitor, ad: 'Windows', not: 'ZIP ile kurulum', renk: 'var(--info)' },
                            { icon: Apple, ad: 'iPhone / iPad', not: 'Safari → Ana Ekrana Ekle', renk: 'var(--ink-3)' },
                        ].map((c) => (
                            <button
                                key={c.ad}
                                onClick={() => navigate('/download')}
                                className="srf srf-hover p-5 flex flex-col items-center gap-2"
                            >
                                <span className="sec-icon" style={{ '--acc': c.renk }}>
                                    <c.icon size={17} />
                                </span>
                                <span className="t-title text-[13px]">{c.ad}</span>
                                <span className="text-[11px] text-ink-3">{c.not}</span>
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => navigate('/download')}
                        className="b b-bare b-sm mt-5 mx-auto"
                    >
                        <Download size={13} /> Kurulum adımlarının tamamı
                    </button>
                </div>
            </section>

            {/* ── Alt bilgi ──────────────────────────────── */}
            <footer className="bg-surface-2 border-t border-line py-8 px-4">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <GraduationCap size={18} className="text-brand" />
                        <span className="font-black text-sm">Başarı Kampı</span>
                    </div>
                    <p className="text-[11px] text-ink-3 text-center">
                        Öğrenci ve veli verileri KVKK kapsamındadır; rehberlik kayıtları
                        mesleki gizlilik altındadır.
                    </p>
                    <p className="text-[11px] text-ink-3">
                        © {new Date().getFullYear()} Başarı Kampı
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
