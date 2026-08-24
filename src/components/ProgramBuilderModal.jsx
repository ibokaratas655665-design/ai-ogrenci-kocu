import React, { useState, useEffect } from 'react';
import {
    Calendar, Clock, Settings, Download, Save, CheckCircle, X,
    Layers, Minus, Plus, Shuffle, Book, Trash2, Share2, RefreshCw,
    CheckSquare, Square, PlusCircle, Globe, ChevronDown,
    Unlock, CalendarDays, CalendarRange,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import MARKA from '../data/marka';
import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';
import { ACTIVITY_TYPES, STANDALONE_ACTIVITIES, getCellColor, getSubjectColor, getSubjectLabel, isActivityBlock, buildLegend } from '../data/programColors';
import { programUret, KRITER_VARSAYILANLARI, konuEtutIhtiyaci, soruEtutIhtiyaci } from '../utils/programMotoru';
import { SINAVLAR, dersAdi, ogrencininSinavi, ogrencininAlani, ogrencininBolumleri } from '../data/examTopics';
import topics from '../services/topicProgressService';
import programProgress from '../services/programProgressService';
import firebaseSync from '../services/firebaseSync';
import { yaz as veriYaz } from '../services/veriDeposu';
import { bildir, onayla } from '../services/uiGeriBildirim';
import ProgramHafizaPaneli from './program/ProgramHafizaPaneli';
import Modal from './ui/Modal';

/** Hazır aktivite fırçalarına tıklanınca hücreye yazılacak varsayılan açıklama. */
const DEFAULT_ACTIVITY_TOPIC = {
    tekrar: 'Konu tekrarı',
    deneme: 'Deneme Sınavı',
    analiz: 'Yanlış analizi + hata defteri',
    paragraf: 'Günlük paragraf (20 soru)',
    kitap: 'Serbest okuma (30 dk)',
    mola: 'Yetişemediklerini tamamla',
};

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, errorInfo) { console.error('FATAL ERROR:', error, errorInfo); }
    render() {
        if (this.state.hasError) {
            return React.createElement('div', { className: 'flex flex-col items-center justify-center h-full w-full bg-surface p-8 absolute inset-0 z-50' }, [
                React.createElement('h2', { className: 'text-2xl font-bold text-danger mb-4' }, '⚠️ Kritik Hata'),
                React.createElement('p', { className: 'text-ink-2 mb-6 text-center max-w-md' }, this.state.error?.message),
                React.createElement('button', { onClick: this.props.onClose, className: 'px-6 py-3 bg-brand text-white font-bold rounded-xl shadow-lg hover:bg-brand-hover transition' }, 'Pencereyi Kapat ve Yenile')
            ]);
        }
        return this.props.children;
    }
}

/**
 * Program altındaki renk açıklaması.
 * Hangi rengin hangi derse/aktiviteye ait olduğunu gösterir —
 * renk kodlu bir programın okunabilir olması buna bağlı.
 */
const ScheduleLegend = ({ schedule, month, week }) => {
    const weekSchedule = React.useMemo(() => {
        const prefix = `m${month}-w${week}-`;
        const out = {};
        for (const [k, v] of Object.entries(schedule || {})) {
            if (k.startsWith(prefix)) out[k] = v;
        }
        return out;
    }, [schedule, month, week]);

    const legend = React.useMemo(() => buildLegend(weekSchedule), [weekSchedule]);

    if (legend.subjects.length === 0 && legend.activities.length === 0) return null;

    const Chip = ({ color, label, count, icon }) => (
        <span
            className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg text-[10px] font-bold"
            style={{ backgroundColor: color.bg, color: color.text, border: `1px solid ${color.border}44` }}
        >
            <span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ backgroundColor: color.border }} />
            {icon && <span className="leading-none">{icon}</span>}
            {label}
            <span className="opacity-50 font-black">{count}</span>
        </span>
    );

    return (
        <div className="mt-6 pt-5 border-t-2 border-line">
            <div className="flex flex-col gap-3">
                {legend.subjects.length > 0 && (
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-ink-3 mb-2">Dersler</p>
                        <div className="flex flex-wrap gap-1.5">
                            {legend.subjects.map(s => (
                                <Chip key={s.key} color={s.color} label={s.label} count={s.count} />
                            ))}
                        </div>
                    </div>
                )}
                {legend.activities.length > 0 && (
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-ink-3 mb-2">Program Blokları</p>
                        <div className="flex flex-wrap gap-1.5">
                            {legend.activities.map(a => (
                                <Chip key={a.key} color={a.color} label={a.label} count={a.count} icon={a.icon} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/** PDF sayfasının alt kısmındaki kompakt renk açıklaması. */
const PdfLegend = ({ schedule, month, week }) => {
    const prefix = `m${month}-w${week}-`;
    const weekSchedule = {};
    for (const [k, v] of Object.entries(schedule || {})) {
        if (k.startsWith(prefix)) weekSchedule[k] = v;
    }
    const legend = buildLegend(weekSchedule);
    const items = [...legend.subjects, ...legend.activities];
    if (!items.length) return null;

    return (
        <div className="mt-2.5 pt-2 flex flex-wrap gap-1" style={{ borderTop: '1px solid #E2E8F0' }}>
            {items.map(i => (
                <span
                    key={i.key}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-bold"
                    style={{
                        backgroundColor: i.color.bg,
                        color: i.color.text,
                        border: `1px solid ${i.color.border}44`,
                        borderRadius: '5px',
                    }}
                >
                    <span style={{ width: '7px', height: '7px', borderRadius: '2px', backgroundColor: i.color.border, display: 'inline-block' }} />
                    {i.icon ? `${i.icon} ` : ''}{i.label}
                </span>
            ))}
        </div>
    );
};

const ProgramBuilderContent = ({ studentId, studentName, onClose }) => {


    // Portal kaldırıldı - direkt render

    // --- State Management ---
    const [title, setTitle] = useState(`${studentName || 'Öğrenci'} - YKS Çalışma Programı`);
    const [programDurationMonths, setProgramDurationMonths] = useState(1); // 1-12 Months
    const [dailySlotCount, setDailySlotCount] = useState(6); // 1-10 Slots/Day
    const [weeklyMode, setWeeklyMode] = useState(false); // Tek haftalık program modu

    const [activeMonth, setActiveMonth] = useState(1);
    const [activeWeek, setActiveWeek] = useState(1);

    // Selection State
    // ⚠️ 23.08.2026: konu kaynağı curriculum.js'ten examTopics.js'e taşındı.
    // Gerekçe: konu takibi, günlük kayıt, hata defteri ve deneme analizi
    // examTopics adlarını kullanıyor; program curriculum adlarını yazınca
    // TYT'de adların yalnız 60/197'si eşleşiyordu — programa yazılan
    // konuların çoğu konu takibinde HİÇ sayılmıyordu.
    const [selectedExam, setSelectedExam] = useState('');   // bölüm id: TYT | AYT_SAY | ...
    const [gradeLevel, setGradeLevel] = useState('grade11'); // (eski curriculum kalıntısı, YDT/AYT için)
    const [selectedSubject, setSelectedSubject] = useState('');
    const [availableTopics, setAvailableTopics] = useState([]);
    const [selectedTopics, setSelectedTopics] = useState([]);

    // Tools
    const [activeTool, setActiveTool] = useState(null); // { subject, topic, color } OR 'eraser'

    // Manual Entry States
    const [manualSubject, setManualSubject] = useState('');
    const [manualTopic, setManualTopic] = useState('');
    const [manualExam, setManualExam] = useState('');

    // Selection Mode States
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedCells, setSelectedCells] = useState([]);

    /**
     * 🧠 Program kriterleri — Program Motoru 2.0'a geçilir ve
     * `program_kriterleri_<id>` anahtarında SAKLANIR (eskiden modal
     * kapanınca kayboluyordu; koç her açılışta baştan ayarlıyordu).
     */
    const [kriterler, setKriterler] = useState(KRITER_VARSAYILANLARI);
    const [showPlanSettings, setShowPlanSettings] = useState(true);
    const [sidebarTab, setSidebarTab] = useState('icerik');
    const [lastStats, setLastStats] = useState(null);
    const [programUyarilari, setProgramUyarilari] = useState([]);

    const kriterDegistir = (alan, deger) => setKriterler((k) => ({ ...k, [alan]: deger }));

    /**
     * 📱 MOBİL DÜZEN
     *
     * Bu pencere masaüstü için yazılmıştı: 384 piksellik sabit kenar
     * çubuğu + yanında takvim. 375 piksellik telefonda kenar çubuğu tek
     * başına ekrandan geniş kaldığı için takvime 0 piksel kalıyor ve
     * ızgara hiç çizilmiyordu; başlıktaki altı düğme de tek sıraya
     * dizildiği için "Kaydet" ekranın 500 piksel sağında kalıyordu.
     *
     * Telefonda artık iki bölme aynı anda değil, sırayla gösteriliyor;
     * ikincil araçlar başlıkta gizlenip "Araçlar" düğmesine alınıyor.
     * Masaüstü düzeni (lg ve üzeri) hiç değişmiyor.
     */
    const [mobilBolme, setMobilBolme] = useState('icerik'); // 'icerik' | 'takvim'
    const [araclarAcik, setAraclarAcik] = useState(false);

    // Data Stores
    const [distributionQueue, setDistributionQueue] = useState([]); // Array of topics waiting to be placed
    const [schedule, setSchedule] = useState({}); // Key: "mX-wY-Day-Slot", Value: { subject, topic, color }
    const [closedSlots, setClosedSlots] = useState({}); // Kapalı etütler: { 'Pazartesi': [0, 2], 'Salı': [1] }

    // Constants
    const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

    // Güvenli string dönüşümü - eski localStorage {name, weight} nesnelerini handle eder
    const toStr = (val) => {
        if (!val) return '';
        if (typeof val === 'string') return val;
        if (typeof val === 'object' && val.name) return val.name;
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
    };

    // Load Initial Data (if any saved)
    useEffect(() => {
        const savedSchedule = localStorage.getItem(`program_schedule_${studentId}`);
        const savedClosedSlots = localStorage.getItem(`program_closed_slots_${studentId}`);
        const savedMeta = localStorage.getItem(`program_meta_${studentId}`);

        if (savedSchedule) {
            try {
                setSchedule(JSON.parse(savedSchedule));
            } catch (error) {
                console.error("Error loading schedule:", error);
            }
        }

        if (savedClosedSlots) {
            try {
                setClosedSlots(JSON.parse(savedClosedSlots));
            } catch (error) {
                console.error("Error loading closed slots:", error);
            }
        }

        if (savedMeta) {
            try {
                const meta = JSON.parse(savedMeta);
                if (meta.programDurationMonths) setProgramDurationMonths(meta.programDurationMonths);
                if (meta.dailySlotCount) setDailySlotCount(meta.dailySlotCount);
                if (meta.title) setTitle(meta.title);
                if (meta.weeklyMode !== undefined) setWeeklyMode(meta.weeklyMode);
            } catch (e) {
                console.error("Error loading meta:", e);
            }
        }

        // Program kriterleri kalıcı — koç ayarı bir daha kaybolmasın
        try {
            const kayitli = localStorage.getItem(`program_kriterleri_${studentId}`);
            if (kayitli) setKriterler({ ...KRITER_VARSAYILANLARI, ...JSON.parse(kayitli) });
        } catch { /* bozuksa varsayılanla devam */ }
    }, [studentId]);

    /* ══ KONU KAYNAĞI — examTopics + öğrencinin konu durumu ══════
       Öğrencinin sınavı/alanı kaydından okunur; yalnız o alanın
       bölümleri gösterilir (Sözel öğrencisine Fizik konuları düşmez).
       Her konuya öğrencinin GERÇEK durumu (bitti mi, kaç soru kaldı)
       iliştirilir — "bitenler" uyarısı ve soru etüdü hesabı bundan. */
    const [ogrenci, setOgrenci] = useState(null);
    const [konuDurumHaritasi, setKonuDurumHaritasi] = useState({});

    useEffect(() => {
        try {
            const liste = JSON.parse(localStorage.getItem('coach_students') || '[]');
            const bulunan = liste.find((s) => String(s.id) === String(studentId));
            setOgrenci(bulunan || { id: studentId, name: studentName });
        } catch {
            setOgrenci({ id: studentId, name: studentName });
        }
    }, [studentId, studentName]);

    const sinavId = React.useMemo(() => ogrencininSinavi(ogrenci || {}), [ogrenci]);
    const alanId = React.useMemo(() => ogrencininAlani(ogrenci || {}, sinavId), [ogrenci, sinavId]);
    const bolumler = React.useMemo(
        () => (ogrenci ? ogrencininBolumleri(ogrenci, sinavId) : (SINAVLAR[sinavId]?.bolumler || [])),
        [ogrenci, sinavId],
    );

    /* İlk açılışta bölüm seçili gelsin: seçim yapılmadan ders listesi
       boş kalıyor ve koç "ders listesi çalışmıyor" sanıyordu. Öğrencinin
       ilk bölümü (TYT) otomatik seçilir; koç istediğinde değiştirir. */
    useEffect(() => {
        if (!selectedExam && bolumler.length) setSelectedExam(bolumler[0].id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bolumler]);

    /** Öğrencinin konu durumu: `${bolum}|${konuAnahtarı}` → satır. */
    useEffect(() => {
        if (!studentId || !bolumler.length) return;
        const harita = {};
        for (const b of bolumler) {
            try {
                const h = topics.konuHaritasi(studentId, sinavId, undefined, b.id);
                for (const ders of h.dersler) {
                    for (const satir of ders.konular) {
                        harita[`${b.id}|${ders.ders}|${satir.konu}`] = satir;
                    }
                }
            } catch { /* konu haritası okunamazsa uyarısız devam */ }
        }
        setKonuDurumHaritasi(harita);
    }, [studentId, sinavId, bolumler]);

    /** Seçili bölümün ders listesi (anahtar + görünen ad). */
    const dersSecenekleri = React.useMemo(() => {
        const b = bolumler.find((x) => x.id === selectedExam);
        if (!b) return [];
        return Object.keys(b.dersler).map((anahtar) => ({ anahtar, ad: dersAdi(anahtar) }));
    }, [bolumler, selectedExam]);

    // Bölüm/ders değişince konu listesi — examTopics'ten, öğrencinin
    // durumu iliştirilmiş hâlde
    useEffect(() => {
        if (!selectedExam || !selectedSubject) {
            setAvailableTopics([]);
            setSelectedTopics([]);
            return;
        }
        const b = bolumler.find((x) => x.id === selectedExam);
        const ham = b?.dersler?.[selectedSubject] || [];
        setAvailableTopics(ham.map((k) => {
            const durum = konuDurumHaritasi[`${selectedExam}|${selectedSubject}|${k.ad}`];
            return {
                ad: k.ad, agirlik: k.a, zorluk: k.z,
                bitti: !!durum?.tamam,
                durum: durum?.durum || 'baslanmadi',
                hedef: durum?.hedef ?? null,
                kalanSoru: durum?.kalan ?? durum?.hedef ?? null,
                soru: durum?.soru ?? 0,
                basari: durum?.basari ?? null,
            };
        }));
        setSelectedTopics([]);
    }, [selectedExam, selectedSubject, bolumler, konuDurumHaritasi]);

    // --- Action Handlers ---

    const [saveSuccess, setSaveSuccess] = React.useState(false);

    const handleSave = () => {
        if (!studentId) {
            bildir('Kaydetmek için bir öğrenci seçilmeli. Lütfen "Ders Programları" sekmesinden öğrenciye tıklayarak açın.', 'uyari');
            return;
        }
        /**
         * ⚠️ PROGRAM KAYDI `veriDeposu.yaz()` ÜZERİNDEN GİTMEK ZORUNDA.
         *
         * Eskiden burada ham `localStorage.setItem` kullanılıyordu ve
         * kaydedilen program SAYFA YENİLENİNCE ESKİ HÂLİNE DÖNÜYORDU.
         * Zinciri izleyince sebep şu:
         *
         *   `yaz()` → buluta() → firebaseSync.syncKey() → bulut yazımı
         *   ve `_fbtime_{anahtar}` zaman damgası
         *
         * Ham `setItem` bu zincirin tamamını atlıyor, dolayısıyla
         * `_fbtime_` damgası hiç oluşmuyordu. Açılışta senkron katmanı
         * `localTime === 0` görüp kaydı "bu cihazda hiç yok" sayıyor
         * (isNewDevice kuralı) ve BULUTTAKİ ESKİ KOPYAYI yerelin üstüne
         * yazıyordu. Yani veri kaybı yenilemede değil, açılıştaki
         * çekme adımında oluyordu.
         *
         * `yaz()` hem damgayı hem storage olayını üretir; olay sayesinde
         * açık duran öğrenci paneli de anında güncellenir.
         */
        veriYaz(`program_schedule_${studentId}`, schedule);
        veriYaz(`program_closed_slots_${studentId}`, closedSlots);

        /* baslangicTarihi: tarih kilidinin (§3) dayanağı — programın
           1. ay 1. haftası hangi takvim haftasına denk geliyor.
           Var olan programda korunur; yoksa bu haftadan başlar. */
        let baslangicTarihi;
        try {
            baslangicTarihi = JSON.parse(localStorage.getItem(`program_meta_${studentId}`) || '{}').baslangicTarihi;
        } catch { /* yoksa aşağıda üretilir */ }
        veriYaz(`program_meta_${studentId}`, {
            programDurationMonths,
            dailySlotCount,
            title,
            weeklyMode,
            baslangicTarihi: baslangicTarihi || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        veriYaz(`program_kriterleri_${studentId}`, kriterler);
        /* ⚠️ Konu takibi köprüsü: topicProgressService `student_programs_*`
           okuyor, program `program_schedule_*`'e yazıyordu — "programda"
           durumu ve program borcu önceliği ölüydü. Aynı içerik ikinci
           anahtara da yazılarak eşgüdüm kuruluyor. */
        veriYaz(`student_programs_${studentId}`, schedule);

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);

        /* Tam senkron da tetiklenir (öğrenci mobilde anlık görsün).
           Hata SESSİZCE yutulmaz: koç kaydın buluta gitmediğini bilmeli,
           yoksa "kaydettim" sanıp veriyi kaybeder. */
        firebaseSync.sync().catch((e) => {
            bildir(`Program bu cihaza kaydedildi ama buluta gönderilemedi: ${e?.message || 'bağlantı yok'}. İnternet gelince tekrar kaydedin.`, 'uyari');
        });
    };

    const handleCellClick = async (day, slotIndex) => {
        // KAPALI SLOT KONTROLÜ - İsteğe bağlı açma seçeneği
        const dayClosedSlots = closedSlots[day] || [];
        if (dayClosedSlots.includes(slotIndex)) {
            if (await onayla({ mesaj: 'Bu etüt kapalı! Açmak ister misiniz?', tehlikeli: false })) {
                // Slot'u aç
                const newClosedSlots = { ...closedSlots };
                newClosedSlots[day] = dayClosedSlots.filter(i => i !== slotIndex);
                if (newClosedSlots[day].length === 0) delete newClosedSlots[day];
                setClosedSlots(newClosedSlots);
                // Şimdi kullanıcı tekrar tıklayabilir veya otomatik atama yapabiliriz
                return;
            }
            return;
        }

        const cellKey = `m${activeMonth}-w${activeWeek}-${day}-${slotIndex}`;

        if (selectionMode) {
            setSelectedCells(prev =>
                prev.includes(cellKey) ? prev.filter(k => k !== cellKey) : [...prev, cellKey]
            );
            return;
        }

        if (activeTool === 'eraser') {
            const newSchedule = { ...schedule };
            delete newSchedule[cellKey];
            setSchedule(newSchedule);
            return;
        }

        if (activeTool && (activeTool.subject || activeTool.topic)) {
            setSchedule({
                ...schedule,
                [cellKey]: {
                    subject: activeTool.subject,
                    topic: activeTool.topic,
                    type: activeTool.type || 'konu',
                    color: activeTool.color,
                    exam: activeTool.exam
                }
            });
        }
    };

    const toggleTopicSelection = (topic) => {
        setSelectedTopics((prev) => (
            prev.some((t) => t.ad === topic.ad)
                ? prev.filter((t) => t.ad !== topic.ad)
                : [...prev, topic]
        ));
    };

    const handleSelectAll = () => {
        if (selectedTopics.length === availableTopics.length) {
            setSelectedTopics([]);
        } else {
            setSelectedTopics([...availableTopics]);
        }
    };

    /**
     * Seçilen konuları dağıtım listesine ekler. Motorun beklediği
     * biçim: {bolum, ders, dersAd, konu, agirlik, zorluk, hedef,
     * kalanSoru, bitti}. Etüt sayıları burada ÖNİZLEME olarak
     * hesaplanır; koç tek tek değiştirebilir.
     */
    /**
     * PROGRAM HAFIZASINDAN EKLEME (§7, §12).
     *
     * Koç hafıza panelinden "+ Ekle" dediğinde çalışır. Otomatik
     * çağrılmaz — öneri ile karar arasındaki sınır burada durur.
     *
     * Aynı konu listede zaten varsa ikinci kez eklenmez; eksik soru
     * çift sayılmasın diye (§8) kalan soru güncellenir.
     */
    const hafizadanEkle = (kayit, tur) => {
        if (!kayit?.konu) return;
        setDistributionQueue((onceki) => {
            const i = onceki.findIndex(
                (q) => q.konu === kayit.konu && (q.dersAd || q.ders) === (kayit.dersAd || kayit.ders),
            );
            if (i >= 0) {
                const kopya = [...onceki];
                kopya[i] = {
                    ...kopya[i],
                    // Kalan soru bilgisi hafızadan tazelenir, TOPLANMAZ
                    ...(kayit.kalanSoru != null ? { kalanSoru: kayit.kalanSoru } : {}),
                    hafizadan: tur,
                };
                bildir(`${kayit.konu} listede zaten vardı, bilgileri güncellendi.`, 'bilgi');
                return kopya;
            }
            const etiket = tur === 'soru' ? 'eksik soru'
                : tur === 'etut' ? 'eksik etüt' : 'tekrar';
            bildir(`${kayit.konu} (${etiket}) dağıtım listesine eklendi.`, 'basari');
            return [...onceki, { ...kayit, konuEtut: tur === 'tekrar' ? 1 : undefined }];
        });
    };

    const addSelectedToQueue = () => {
        const yeni = selectedTopics.map((t) => {
            const kayit = {
                bolum: selectedExam,
                ders: selectedSubject,
                dersAd: dersAdi(selectedSubject),
                konu: t.ad,
                agirlik: t.agirlik,
                zorluk: t.zorluk,
                hedef: t.hedef,
                kalanSoru: t.kalanSoru,
                bitti: t.bitti,
                // geriye dönük alanlar (eski kuyruk görünümleri için)
                subject: dersAdi(selectedSubject),
                topic: t.ad,
                exam: selectedExam,
            };
            kayit.konuEtut = konuEtutIhtiyaci(kayit);
            kayit.soruEtut = soruEtutIhtiyaci(kayit, kriterler);
            return kayit;
        });
        // Aynı konu iki kez eklenmesin
        const varOlan = new Set(distributionQueue.map((q) => `${q.bolum}|${q.ders}|${q.konu}`));
        const suzulmus = yeni.filter((k) => !varOlan.has(`${k.bolum}|${k.ders}|${k.konu}`));
        setDistributionQueue([...distributionQueue, ...suzulmus]);
        setSelectedTopics([]);
        if (suzulmus.length < yeni.length) {
            bildir(`${yeni.length - suzulmus.length} konu listede zaten vardı, tekrar eklenmedi.`, 'bilgi');
        }
    };

    const removeFromQueue = (index) => {
        const newQueue = [...distributionQueue];
        newQueue.splice(index, 1);
        setDistributionQueue(newQueue);
    };

    /** Koç konunun etüt sayısını elle değiştirebilir (koçun kararı üstün). */
    const updateQueueItemWeight = (index, delta) => {
        const newQueue = [...distributionQueue];
        const k = newQueue[index];
        k.konuEtut = Math.max(1, (k.konuEtut ?? 1) + delta);
        setDistributionQueue(newQueue);
    };

    /**
     * 🧠 AKILLI DAĞITIM — Program Motoru 2.0 (utils/programMotoru.js)
     *
     * Motor: YKS ders ağırlıkları + konu zorluk/kapsam + öğrencinin
     * hedef soru sayısı + soru başına çözüm süresi + aralıklı tekrar
     * ile dağıtır; günlük ders/konu limitlerine kesin uyar ve
     * üretim sonrası QA uyarıları döner.
     */
    const handleAutoDistribute = () => {
        if (!distributionQueue.length) {
            bildir('Önce dağıtılacak ders/konu ekleyin! Soldaki listeden konu seçip "Listeye Ekle" deyin.', 'uyari');
            return;
        }

        const { schedule: uretilen, stats, uyarilar } = programUret({
            konular: distributionQueue.map((k) => ({
                ...k,
                // Koç elle değiştirdiyse onun sayısı geçerli
                sabitKonuEtut: k.konuEtut,
            })),
            alanId,
            kriterler,
            aylar: weeklyMode ? 1 : programDurationMonths,
            haftaPerAy: weeklyMode ? 1 : 4,
            gunlukEtut: dailySlotCount,
            gunler: DAYS,
            kapaliEtutler: closedSlots,
            mevcutSchedule: schedule,
        });

        if (!uretilen || Object.keys(uretilen).length === 0) {
            bildir('Boş etüt kalmamış. Önce "Temizle" ile programı sıfırlayın ya da etüt sayısını artırın.', 'uyari');
            return;
        }

        setSchedule({ ...schedule, ...uretilen });
        setDistributionQueue([]);
        setSelectedTopics([]);
        setLastStats(stats);
        setProgramUyarilari(uyarilar);
        const ihlal = uyarilar.filter((u) => u.tur.startsWith('limit-')).length;
        bildir(
            ihlal
                ? `Program oluşturuldu ama ${ihlal} kriter ihlali var — uyarı panelini inceleyin.`
                : `Program oluşturuldu: ${stats.toplamYerlesen} etüt yerleşti.`,
            ihlal ? 'uyari' : 'basari',
        );
    };




    /**
     * 📄 PDF ÇIKTISI
     *
     * @param {'week'|'each'|'all'} mode
     *   'week' → yalnızca ekranda açık olan hafta, tek dosya
     *   'each' → her hafta AYRI bir PDF dosyası olarak iner
     *   'all'  → tüm haftalar tek dosyada, her hafta bir sayfa
     */
    const handleDownloadPDF = async (mode = 'week') => {
        const weekDivs = [...document.querySelectorAll('[data-pdf-week]')];
        if (weekDivs.length === 0) {
            bildir('Önce program oluşturun / kaydedin.');
            return;
        }

        const safeName = (studentName || 'Ogrenci')
            .replace(/[^\wçğıöşüÇĞİÖŞÜ ]/g, '')
            .trim()
            .replace(/\s+/g, '_');

        /** Bir hafta div'ini A4 yatay sayfaya çizer. */
        const renderInto = async (doc, div, addPage) => {
            const prevDisplay = div.style.display;
            div.style.display = 'block';
            const canvas = await html2canvas(div, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                width: 1120,
                windowWidth: 1120,
            });
            div.style.display = prevDisplay;

            const pdfW = doc.internal.pageSize.getWidth();
            const pdfH = doc.internal.pageSize.getHeight();
            const margin = 5;
            const imgW = pdfW - margin * 2;
            const imgH = pdfH - margin * 2;

            const ratio = Math.min(imgW / canvas.width, imgH / canvas.height);
            const drawW = canvas.width * ratio;
            const drawH = canvas.height * ratio;

            if (addPage) doc.addPage();
            doc.addImage(
                canvas.toDataURL('image/jpeg', 0.95),
                'JPEG',
                margin + (imgW - drawW) / 2,
                margin + (imgH - drawH) / 2,
                drawW,
                drawH
            );
        };

        const newDoc = () => new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        // ── Yalnızca açık hafta ──────────────────────────────
        if (mode === 'week') {
            const key = `${activeMonth}-${activeWeek}`;
            const div = weekDivs.find(d => d.dataset.pdfWeek === key);
            if (!div) {
                bildir('Bu hafta için içerik bulunamadı.', 'hata');
                return;
            }
            const doc = newDoc();
            await renderInto(doc, div, false);
            doc.save(
                weeklyMode
                    ? `${safeName}_Haftalik_Program.pdf`
                    : `${safeName}_${activeMonth}.Ay_${activeWeek}.Hafta.pdf`
            );
            return;
        }

        // ── Her hafta ayrı dosya ─────────────────────────────
        if (mode === 'each') {
            for (const div of weekDivs) {
                const [m, w] = String(div.dataset.pdfWeek).split('-');
                const doc = newDoc();
                await renderInto(doc, div, false);
                doc.save(`${safeName}_${m}.Ay_${w}.Hafta.pdf`);
                // Tarayıcı arka arkaya inen dosyaları bazen bloke ediyor;
                // aralarında kısa bir nefes payı bırak.
                await new Promise(r => setTimeout(r, 400));
            }
            return;
        }

        // ── Hepsi tek dosyada ────────────────────────────────
        const doc = newDoc();
        let first = true;
        for (const div of weekDivs) {
            await renderInto(doc, div, !first);
            first = false;
        }
        doc.save(`${safeName}_Tum_Program.pdf`);
    };

    const handleToolSelect = (topic) => {
        setActiveTool({
            subject: dersAdi(selectedSubject),
            topic: topic.ad,
            type: 'konu',
            exam: selectedExam || '',
        });
    };

    /**
     * 🔁 Öğrencinin yapamadığı/işaretlemediği konuları dağıtım listesine alır.
     * Böylece yeni program, önceki dönemin gerçekleşmesiyle endekslenir:
     * yapılanlar tekrar yazılmaz, eksikler öne alınır.
     */
    const handleAddCarryOver = () => {
        if (!carryOver.length) return;
        const items = carryOver.map((c) => {
            const kayit = {
                bolum: c.exam || selectedExam || 'TYT',
                ders: c.subject,
                dersAd: dersAdi(c.subject),
                konu: c.topic,
                agirlik: c.weight || 1,
                zorluk: 2,
                bitti: false,
                carriedOver: true,
                subject: dersAdi(c.subject), topic: c.topic, exam: c.exam || '',
            };
            // "Yapamadım" işaretli konu bir etüt fazla alır
            kayit.konuEtut = konuEtutIhtiyaci(kayit) + (c.missedCount > 0 ? 1 : 0);
            kayit.soruEtut = 0;   // eksik kapatma turu; soru etüdü koçun kararı
            return kayit;
        });
        setDistributionQueue((prev) => [...items, ...prev]);
    };

    /** Seçili dersin TÜM konularını listeye ekler. */
    const handleAddSubjectTopics = () => {
        if (!selectedSubject || !availableTopics.length) return;
        const varOlan = new Set(distributionQueue.map((q) => `${q.bolum}|${q.ders}|${q.konu}`));
        const yeni = availableTopics
            .filter((t) => !varOlan.has(`${selectedExam}|${selectedSubject}|${t.ad}`))
            .map((t) => {
                const kayit = {
                    bolum: selectedExam, ders: selectedSubject, dersAd: dersAdi(selectedSubject),
                    konu: t.ad, agirlik: t.agirlik, zorluk: t.zorluk,
                    hedef: t.hedef, kalanSoru: t.kalanSoru, bitti: t.bitti,
                    subject: dersAdi(selectedSubject), topic: t.ad, exam: selectedExam,
                };
                kayit.konuEtut = konuEtutIhtiyaci(kayit);
                kayit.soruEtut = soruEtutIhtiyaci(kayit, kriterler);
                return kayit;
            });
        setDistributionQueue([...distributionQueue, ...yeni]);
    };

    // 🔁 Önceki dönemden tamamlanmayan konular (öğrencinin işaretlemelerinden)
    const carryOver = React.useMemo(
        () => (studentId ? programProgress.getCarryOverQueue(studentId, schedule) : []),
        [studentId, schedule]
    );
    const carryOverMissed = carryOver.filter((c) => c.missedCount > 0).length;

    // Metrics for Queue
    /** Listedeki toplam etüt ihtiyacı (konu + soru) — kapasite göstergesi. */
    const totalWeights = distributionQueue.reduce(
        (acc, i) => acc + (i.konuEtut ?? 1) + (i.soruEtut ?? 0), 0,
    );

    /**
     * İkincil araçlar (paylaş / temizle / etütleri aç / PDF).
     *
     * Masaüstünde başlık satırının içinde durur. Telefonda o satıra
     * sığmadığı ve "Kaydet"i ekran dışına ittiği için başlığın altında
     * ayrı bir satırda, "Araçlar" düğmesiyle açılıp kapanır.
     * İki yerde de aynı JSX kullanılır; aynı anda yalnızca biri görünür.
     */
    const ikincilAraclar = (
        <>
            <button onClick={() => {
                let url = window.location.href;
                if (url.includes('localhost') || url.includes('127.0.0.1') || url.startsWith('file://')) {
                    const newUrl = prompt(
                        "Yerel moddasınız. Paylaşılacak Web Linkini giriniz (Örn: https://google.com):",
                        "https://"
                    );
                    if (newUrl && newUrl !== "https://") url = newUrl;
                    else { bildir("Link girilmedi."); return; }
                }
                navigator.clipboard.writeText(url).then(() => {
                    bildir("Link kopyalandı! \n\n" + url);
                });
            }} className="px-3 py-2 bg-info hover:bg-blue-400 text-white rounded-lg text-sm font-bold transition flex items-center shadow-lg hover:shadow-blue-500/30">
                <Share2 size={16} className="mr-2" /> Sistemi Paylaş
            </button>
            <button onClick={ async () => {
                if (!await onayla({ mesaj: 'Tüm program silinecek. Emin misiniz?', tehlikeli: true })) return;
                /**
                 * ⚠️ TEMİZLEME DEPOYA DA YAZILMALI.
                 *
                 * Eskiden burada yalnızca `setSchedule({})` vardı: ekran
                 * boşalıyor ama depo dokunulmadan kalıyordu. Sayfa
                 * yenilenince yükleme etkisi eski programı geri okuyor,
                 * koç da "temizle çalışmıyor" diyordu. Temizleme, tıpkı
                 * kaydetme gibi kalıcı bir işlemdir; boş çizelge
                 * `veriYaz` ile yazılır ki buluta da gitsin ve öğrenci
                 * panelindeki program da temizlensin.
                 */
                setSchedule({});
                setDistributionQueue([]);
                if (!studentId) return;
                veriYaz(`program_schedule_${studentId}`, {}, { zorla: true });
                veriYaz(`student_programs_${studentId}`, {}, { zorla: true });
                firebaseSync.sync().catch((e) => {
                    bildir(`Program bu cihazda temizlendi ama buluta bildirilemedi: ${e?.message || 'bağlantı yok'}.`, 'uyari');
                });
                bildir('Program temizlendi.', 'basari');
            }} className="px-3 py-2 bg-danger/20 hover:bg-danger text-white rounded-lg text-sm font-bold transition">
                Temizle
            </button>
            <button
                onClick={ async () => {
                    const closedCount = Object.values(closedSlots).reduce((acc, arr) => acc + arr.length, 0);
                    if (closedCount === 0) {
                        bildir('Kapalı etüt yok!', 'uyari');
                        return;
                    }
                    if (await onayla({ mesaj: `${closedCount} kapalı etüt açılacak. Devam?`, tehlikeli: false })) {
                        setClosedSlots({}); // Tüm kapalı etütleri aç
                        bildir('✅ Tüm kapalı etütler açıldı!\n\nŞimdi yeni konular seçip ikinci dağıtım yapabilirsiniz.', 'basari');
                    }
                }}
                className="px-3 py-2 bg-warn hover:bg-orange-400 text-white rounded-lg text-sm font-bold transition flex items-center shadow-lg hover:shadow-orange-500/30"
            >
                <Unlock size={16} className="mr-2" /> Etütleri Aç
            </button>
            {/* PDF: tek hafta modunda tek dosya, ay modunda seçenekli.
                Açılır menü fareyle üzerine gelmeye bağlı olduğu için
                dokunmatikte açılmaz; oradaki asıl düğme yine çalışır. */}
            <div className="relative group/pdf">
                <button
                    onClick={() => handleDownloadPDF('week')}
                    className="px-3 py-2 bg-brand hover:bg-indigo-400 text-white rounded-lg text-sm font-bold transition flex items-center shadow-lg hover:shadow-indigo-500/30"
                >
                    <Download size={16} className="mr-2" />
                    {weeklyMode ? 'PDF İndir' : `${activeWeek}. Hafta PDF`}
                    {!weeklyMode && <ChevronDown size={14} className="ml-1.5 opacity-70" />}
                </button>

                {!weeklyMode && (
                    <div className="absolute right-0 top-full pt-1 hidden group-hover/pdf:block z-50">
                        <div className="bg-surface rounded-xl shadow-2xl border border-line overflow-hidden w-60">
                            <button
                                onClick={() => handleDownloadPDF('each')}
                                className="w-full text-left px-3 py-2.5 hover:bg-brand-soft transition"
                            >
                                <span className="block text-xs font-black text-ink">Her Hafta Ayrı PDF</span>
                                <span className="block text-[10px] text-ink-3 leading-tight">
                                    Her hafta kendi dosyası olarak iner
                                </span>
                            </button>
                            <button
                                onClick={() => handleDownloadPDF('all')}
                                className="w-full text-left px-3 py-2.5 hover:bg-brand-soft transition border-t border-line"
                            >
                                <span className="block text-xs font-black text-ink">Tümü Tek PDF</span>
                                <span className="block text-[10px] text-ink-3 leading-tight">
                                    Her hafta bir sayfa, tek dosya
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );

    return (
        <div
            /* `pencere-tam-ekran`: yükseklik dvh ile ölçülür, yoksa
               adres çubuğu pencerenin altını kesiyor (bkz. styles/mobil.css) */
            className="pencere-tam-ekran fixed bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 lg:p-4 overflow-hidden"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                zIndex: 1300, // katman merdiveni: program-builder (bkz. tailwind.config.js)
                pointerEvents: 'auto'
            }}
        >
            {/* `pencere-kendi-duzeni`: bu pencere başlığı sabit tutup yalnızca
                gövdesini kaydırır; mobil.css'teki genel dıştan-kaydırma kuralı
                burada devre dışı bırakılır (bkz. styles/mobil.css). */}
            <div className="pencere-kendi-duzeni bg-surface w-full h-full max-w-full lg:max-w-[95vw] max-h-full lg:max-h-[95dvh] rounded-none lg:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* 1. Header & Toolbar */}
                <div className="on-color bg-gradient-to-r from-indigo-900 to-indigo-800 text-ink p-4 shrink-0 shadow-md">
                    <div className="flex justify-between items-center mb-2 gap-2">
                        <div className="flex items-center gap-2 lg:space-x-4 min-w-0 flex-1">
                            <Calendar size={28} className="text-brand hidden sm:block shrink-0" />
                            <div className="min-w-0 flex-1">
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="bg-transparent text-base lg:text-xl font-bold focus:outline-none focus:border-b border-indigo-400 placeholder-indigo-300 w-full lg:w-96"
                                />
                                {/* Ölçü ayarları Ayarlar sekmesine taşındı; burada
                                    yalnızca mevcut durumun özeti gösterilir. */}
                                <div className="flex flex-wrap items-center mt-1.5 gap-1.5 lg:gap-2 text-[11px] text-brand">
                                    <span className="px-2 py-0.5 rounded-md bg-surface/10 font-bold">
                                        {studentName || 'Öğrenci'}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md bg-surface/10 font-bold">
                                        {weeklyMode ? 'Tek hafta' : `${programDurationMonths} ay`}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md bg-surface/10 font-bold">
                                        Günde {dailySlotCount} etüt
                                    </span>
                                    <button
                                        onClick={() => setSidebarTab('ayarlar')}
                                        className="px-2 py-0.5 rounded-md text-brand hover:text-ink hover:bg-surface/10 font-bold flex items-center gap-1 transition"
                                    >
                                        <Settings size={11} /> Değiştir
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 lg:space-x-3 shrink-0">
                            {/* Masaüstünde araçlar satır içinde durur */}
                            <div className="hidden lg:flex lg:space-x-3 lg:items-center">
                                {ikincilAraclar}
                            </div>

                            {/* Telefonda araçlar alttaki satıra iner */}
                            <button
                                onClick={() => setAraclarAcik((v) => !v)}
                                aria-expanded={araclarAcik}
                                className="lg:hidden px-3 py-2 rounded-lg text-sm font-bold bg-surface/10 hover:bg-surface/20 transition flex items-center gap-1"
                            >
                                <Settings size={16} /> Araçlar
                            </button>

                            {/* Kaydet ve Kapat HER ZAMAN görünür kalır */}
                            <button onClick={handleSave} className={`px-3 lg:px-4 py-2 rounded-lg text-sm font-bold transition flex items-center shadow-lg shrink-0 ${saveSuccess ? 'bg-green-400 text-white' : 'bg-ok hover:bg-ok text-white hover:shadow-green-500/30'}`}>
                                <CheckCircle size={16} className="lg:mr-2" />
                                <span className="hidden sm:inline">{saveSuccess ? '✓ Kaydedildi!' : 'Kaydet'}</span>
                            </button>
                            <button onClick={onClose} aria-label="Kapat" className="p-2 hover:bg-surface/10 rounded-full shrink-0"><X size={24} /></button>
                        </div>
                    </div>

                    {/* Telefonda açılan ikincil araç satırı */}
                    {araclarAcik && (
                        <div className="lg:hidden flex flex-wrap gap-2 mt-2 pt-2 border-t border-white/10">
                            {ikincilAraclar}
                        </div>
                    )}

                    {/* Telefonda iki bölme yan yana sığmadığı için sırayla gösterilir */}
                    <div className="lg:hidden flex gap-1 mt-3 p-1 rounded-xl bg-black/25">
                        {[
                            { id: 'icerik', label: 'Konu Seçimi' },
                            { id: 'takvim', label: 'Program' },
                        ].map((b) => (
                            <button
                                key={b.id}
                                onClick={() => setMobilBolme(b.id)}
                                className={`flex-1 py-2 rounded-lg text-xs font-black transition ${
                                    mobilBolme === b.id
                                        ? 'bg-surface text-brand shadow'
                                        : 'text-white/70 hover:text-white'
                                }`}
                            >
                                {b.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden min-h-0">
                    {/* 2. Sidebar (Subject/Topic Selector) */}
                    {/* 2. Kenar Çubuğu — sekmeli.
                        Telefonda tam genişlik kaplar ve yalnızca "Konu Seçimi"
                        bölmesi seçiliyken görünür; masaüstünde eskisi gibi
                        384 piksellik sabit sütun. */}
                    <div className={`w-full lg:w-96 bg-surface border-r border-line flex-col shrink-0 min-h-0 ${
                        mobilBolme === 'icerik' ? 'flex' : 'hidden'
                    } lg:flex`}>
                        {/* ── Kenar çubuğu sekmeleri ─────────────────── */}
                        <div className="grid grid-cols-3 shrink-0 bg-surface-3 border-b border-line">
                            {[
                                { id: 'icerik', label: 'İçerik', icon: Book },
                                { id: 'bloklar', label: 'Bloklar', icon: Layers },
                                { id: 'ayarlar', label: 'Ayarlar', icon: Settings },
                            ].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setSidebarTab(t.id)}
                                    className={`flex items-center justify-center gap-1.5 py-3 text-xs font-black uppercase tracking-wide transition border-b-2 ${
                                        sidebarTab === t.id
                                            ? 'bg-surface text-brand border-indigo-600'
                                            : 'text-ink-3 border-transparent hover:text-ink-2 hover:bg-surface-2'
                                    }`}
                                >
                                    <t.icon size={14} /> {t.label}
                                </button>
                            ))}
                        </div>

                        {/* ══ İÇERİK: müfredat seçimi ve dağıtım listesi ══ */}
                        <div className={sidebarTab === 'icerik' ? 'flex-1 flex flex-col overflow-hidden' : 'hidden'}>
                        {/* TOPIC SELECTOR - SCROLLABLE */}
                        <div className="flex-1 overflow-y-auto p-3 border-b border-line bg-surface">
                            <div className="space-y-2">
                                {/* Bölümler öğrencinin ALANINDAN gelir — Sözel
                                    öğrencisine AYT Fen konuları düşmez. */}
                                <div className="flex gap-1 bg-surface-3 p-1 rounded-lg flex-wrap">
                                    {bolumler.map(b => (
                                        <button
                                            key={b.id}
                                            onClick={() => { setSelectedExam(b.id); setSelectedSubject(''); }}
                                            className={`flex-1 py-1.5 px-2 text-[10px] font-bold rounded-md transition whitespace-nowrap ${selectedExam === b.id ? 'bg-surface text-brand shadow-sm' : 'text-ink-2 hover:text-ink'}`}
                                        >
                                            {b.ad}
                                        </button>
                                    ))}
                                </div>
                                {ogrenci && (
                                    <p className="text-[10px] text-ink-3 px-0.5">
                                        {sinavId}{alanId ? ` · ${alanId}` : ''} — konular öğrencinin alanına göre listeleniyor.
                                    </p>
                                )}

                                <div className="flex gap-1">
                                    <select
                                        value={selectedSubject}
                                        onChange={(e) => setSelectedSubject(e.target.value)}
                                        className="flex-1 p-2 border border-line-2 rounded-lg text-xs font-medium outline-none focus:border-brand"
                                    >
                                        <option value="">Ders Seçiniz...</option>
                                        {dersSecenekleri.map(d => (
                                            <option key={d.anahtar} value={d.anahtar}>{d.ad}</option>
                                        ))}
                                    </select>
                                    {selectedSubject && (
                                        <button
                                            onClick={handleAddSubjectTopics}
                                            className="px-2 bg-brand-soft text-brand rounded-lg border border-brand-line hover:bg-brand-soft transition"
                                            title={`Tüm ${dersAdi(selectedSubject)} konularını ekle`}
                                        >
                                            <Book size={16} />
                                        </button>
                                    )}
                                </div>

                                {/* 🔁 Geçen dönemin eksikleri — programı öğrencinin
                                    gerçekte yaptıklarıyla endekslemenin yolu */}
                                {carryOver.length > 0 && (
                                    <div className="rounded-xl border-2 border-warn bg-warn-soft p-3">
                                        <div className="flex items-start gap-2 mb-2">
                                            <RefreshCw size={14} className="text-warn shrink-0 mt-0.5" />
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-black text-warn leading-tight">
                                                    Tamamlanmayan {carryOver.length} konu var
                                                </p>
                                                <p className="text-[10px] text-warn/80 leading-snug mt-0.5">
                                                    {carryOverMissed > 0
                                                        ? `${carryOverMissed} tanesini öğrenci "yapamadım" olarak işaretledi.`
                                                        : 'Öğrenci bu etütleri hiç işaretlemedi.'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-1 mb-2 max-h-20 overflow-y-auto">
                                            {carryOver.slice(0, 12).map((c, i) => (
                                                <span
                                                    key={i}
                                                    className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface text-warn border border-warn"
                                                >
                                                    {c.missedCount > 0 ? '✗' : '○'} {getSubjectLabel(c.subject)} · {c.topic}
                                                </span>
                                            ))}
                                            {carryOver.length > 12 && (
                                                <span className="text-[9px] font-bold text-warn px-1">
                                                    +{carryOver.length - 12} konu
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            onClick={handleAddCarryOver}
                                            className="w-full py-2 rounded-lg bg-warn text-white text-xs font-black hover:bg-warn transition flex items-center justify-center gap-1.5 active:scale-95"
                                        >
                                            <RefreshCw size={13} /> Eksikleri Listeye Ekle
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bulk Selection Actions */}
                        <div className="px-3 pt-2 pb-1 flex justify-between items-center bg-surface-2">
                            <div className="flex space-x-2">
                                <button onClick={handleSelectAll} className="text-[10px] text-brand font-bold hover:underline">
                                    {selectedTopics.length === availableTopics.length ? 'Seçimi Kaldır' : 'Dersi Seç'}
                                </button>
                            </div>
                            {selectedTopics.length > 0 && (
                                <button onClick={addSelectedToQueue} className="px-2 py-1 bg-ok text-white rounded text-[10px] font-bold hover:bg-ok transition shadow-sm">
                                    {selectedTopics.length} Ekle
                                </button>
                            )}
                        </div>

                        {/* ══ PROGRAM HAFIZASI ══════════════════════════
                            Geçmiş haftaların eksikleri ve tekrar zamanı
                            gelen konular. ÖNERİDİR: hiçbiri otomatik
                            eklenmez, koç tek tek "+ Ekle" der (§7, §12). */}
                        <ProgramHafizaPaneli
                            studentId={studentId}
                            konular={distributionQueue}
                            onEkle={hafizadanEkle}
                        />

                        {/* Queue Section */}
                        <div className="p-4 bg-brand-soft border-b border-brand-line flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-brand text-sm flex items-center">
                                    <Layers size={16} className="mr-2" /> Dağıtım Listesi
                                </h3>
                                <span className="text-[10px] font-bold text-brand bg-brand-soft px-2 py-0.5 rounded-full">
                                    {totalWeights} etüt
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 max-h-[30dvh]">
                                {distributionQueue.length === 0 && <p className="text-xs text-brand italic text-center mt-4">Henüz ders eklenmedi.</p>}

                                {distributionQueue.map((item, idx) => (
                                    <div key={`${item.bolum}|${item.ders}|${item.konu}|${idx}`} className="bg-surface border border-line rounded-lg p-2 shadow-sm flex flex-col relative group">
                                        <button onClick={() => removeFromQueue(idx)} className="absolute top-1 right-1 text-ink-3 hover:text-danger"><X size={12} /></button>
                                        <div className="flex items-center mb-1">
                                            <div className="flex flex-col truncate w-full pr-4">
                                                <div className="flex items-center gap-1 flex-wrap">
                                                    <span className="text-[8px] font-black text-brand uppercase">{item.bolum || item.exam}</span>
                                                    <span className="text-[9px] font-bold text-ink-2">{item.dersAd || item.subject}</span>
                                                    {item.bitti && <span className="text-[8px] font-black text-ok">✓ bitti</span>}
                                                    {item.carriedOver && <span className="text-[8px] font-black text-warn">↻ eksik</span>}
                                                </div>
                                                <span className="text-[10px] font-bold text-ink-2 truncate">{item.konu || item.topic}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between bg-surface-2 rounded px-1.5 py-0.5">
                                            <span className="text-[9px] text-ink-2 font-medium">
                                                Konu etüdü
                                                {item.soruEtut > 0 && <span className="text-ink-3"> · +{item.soruEtut} soru</span>}
                                            </span>
                                            <div className="flex items-center space-x-1">
                                                <button onClick={() => updateQueueItemWeight(idx, -1)} className="p-0.5 hover:bg-surface-3 rounded" aria-label="Azalt"><Minus size={10} /></button>
                                                <span className="text-[10px] font-bold text-brand w-4 text-center">{item.konuEtut ?? 1}</span>
                                                <button onClick={() => updateQueueItemWeight(idx, 1)} className="p-0.5 hover:bg-surface-3 rounded" aria-label="Artır"><Plus size={10} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* DAĞIT BUTONU - STICKY */}
                            <button
                                onClick={handleAutoDistribute}
                                disabled={distributionQueue.length === 0}
                                className="on-color w-full py-3 mt-3 bg-gradient-to-r from-brand to-indigo-700 text-white rounded-xl text-sm font-bold hover:from-indigo-700 hover:to-indigo-800 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border-2 border-indigo-400"
                            >
                                <Shuffle size={16} className="mr-2" /> AKILLI DAĞIT
                            </button>

                            {lastStats && (
                                <div className="mt-2 rounded-xl bg-surface border border-line p-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-ink-3 mb-1.5">
                                        Son dağıtım · {lastStats.toplamYerlesen} etüt
                                        {lastStats.bosEtut > 0 && <span className="text-ink-3 normal-case"> ({lastStats.bosEtut} boş)</span>}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {['konu', 'soru', 'tekrar', 'deneme', 'analiz', 'paragraf', 'kitap', 'mola']
                                            .filter(k => (lastStats.turler?.[k] || 0) > 0)
                                            .map(k => {
                                                const a = ACTIVITY_TYPES[k];
                                                const c = a.color || getSubjectColor('genel');
                                                return (
                                                    <span
                                                        key={k}
                                                        className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                                                        style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}33` }}
                                                    >
                                                        {a.icon} {a.short} {lastStats.turler[k]}
                                                    </span>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}

                            {/* ══ PROGRAM UYARI PANELİ (QA) ══════════════════
                                Motor üretimden sonra kuralları denetler; koç
                                programı yine de elle değiştirebilir. */}
                            {programUyarilari.length > 0 && (
                                <div className="mt-2 rounded-xl border-2 border-warn bg-warn-soft p-2.5">
                                    <p className="text-[10px] font-black text-warn uppercase tracking-wider mb-1.5">
                                        ⚠ Program Uyarıları ({programUyarilari.length})
                                    </p>
                                    <ul className="space-y-1 max-h-40 overflow-y-auto">
                                        {programUyarilari.slice(0, 12).map((u, i) => (
                                            <li key={i} className="text-[10px] leading-snug text-ink-2 flex gap-1.5">
                                                <span className={u.tur.startsWith('limit-') ? 'text-danger font-black' : 'text-warn font-black'}>
                                                    {u.tur.startsWith('limit-') ? '✕' : '•'}
                                                </span>
                                                <span>{u.mesaj}</span>
                                            </li>
                                        ))}
                                        {programUyarilari.length > 12 && (
                                            <li className="text-[10px] text-ink-3">+{programUyarilari.length - 12} uyarı daha</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                        </div>

                        {/* ══ BLOKLAR: hazır fırçalar ve elle boyama ══ */}
                        <div className={sidebarTab === 'bloklar' ? 'flex-1 flex flex-col overflow-y-auto' : 'hidden'}>
                        {/* 🎨 HAZIR AKTİVİTE FIRÇALARI */}
                        <div className="p-3 bg-surface border-b border-line">
                            <p className="text-[10px] font-black uppercase tracking-widest text-ink-3 mb-2">
                                Hazır Bloklar — tıkla, sonra hücreye boya
                            </p>
                            <div className="grid grid-cols-2 gap-1.5">
                                {STANDALONE_ACTIVITIES.map(id => {
                                    const a = ACTIVITY_TYPES[id];
                                    const c = a.color;
                                    const isActive = activeTool?.type === id;
                                    return (
                                        <button
                                            key={id}
                                            title={a.description}
                                            onClick={() => setActiveTool({
                                                subject: a.label,
                                                topic: DEFAULT_ACTIVITY_TOPIC[id] || '',
                                                type: id,
                                                exam: '',
                                            })}
                                            className="flex items-center gap-1.5 px-2 py-2 rounded-lg text-left transition active:scale-95"
                                            style={{
                                                backgroundColor: isActive ? c.border : c.bg,
                                                color: isActive ? '#fff' : c.text,
                                                border: `1.5px solid ${c.border}${isActive ? '' : '55'}`,
                                                boxShadow: isActive ? `0 0 0 3px ${c.border}33` : 'none',
                                            }}
                                        >
                                            <span className="text-sm leading-none">{a.icon}</span>
                                            <span className="text-[10px] font-black leading-tight">{a.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Manual Entry Section */}
                        <div className="p-3 bg-surface border-b border-line">
                            <details className="group">
                                <summary className="text-xs font-bold text-brand cursor-pointer flex items-center justify-between outline-none">
                                    <span className="flex items-center"><PlusCircle size={14} className="mr-1" /> Özel Ders / Konu Ekle</span>
                                    <ChevronDown size={14} className="group-open:rotate-180 transition" />
                                </summary>
                                <div className="mt-2 space-y-2">
                                    <input
                                        type="text"
                                        value={manualSubject}
                                        onChange={e => setManualSubject(e.target.value)}
                                        placeholder="Örn: Tekrar, Etüt, Okuma"
                                        className="w-full text-xs p-1.5 border border-brand-line rounded outline-none focus:border-indigo-400"
                                    />
                                    <input
                                        type="text"
                                        value={manualTopic}
                                        onChange={e => setManualTopic(e.target.value)}
                                        placeholder="Konu veya açıklama..."
                                        className="w-full text-xs p-1.5 border border-brand-line rounded outline-none focus:border-indigo-400"
                                    />
                                    <select
                                        value={manualExam}
                                        onChange={e => setManualExam(e.target.value)}
                                        className="w-full text-xs p-1.5 border border-brand-line rounded outline-none focus:border-indigo-400 bg-surface"
                                    >
                                        <option value="">Bölüm Seç (isteğe bağlı)</option>
                                        {bolumler.map(b => (
                                            <option key={b.id} value={b.id}>{b.ad}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => {
                                            if (!manualSubject) return bildir("Ders adı girmelisiniz.");
                                            setActiveTool({
                                                subject: manualSubject,
                                                topic: manualTopic || '', // Boş bırakılabilsin
                                                color: 'bg-brand-soft border-brand-line text-brand',
                                                exam: manualExam || ''
                                            });
                                            setManualSubject('');
                                            setManualTopic('');
                                            setManualExam('');
                                        }}
                                        className="w-full py-1.5 bg-brand-soft text-brand text-xs font-bold rounded hover:bg-brand-soft transition border border-brand-line"
                                    >
                                        Manuel Fırça Olarak Seç
                                    </button>
                                </div>
                            </details>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            <button
                                onClick={() => setActiveTool('eraser')}
                                className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition flex items-center font-bold mb-4 ${activeTool === 'eraser' ? 'border-danger bg-danger-soft text-danger' : 'border-dashed border-line-2 text-ink-2 hover:bg-surface-3'}`}
                            >
                                <Trash2 size={16} className="mr-3" /> Silgi
                            </button>

                            {/* Konu satırı: zorluk, sınav ağırlığı, öğrencinin
                                durumu ve BİTEN UYARISI. Uyarı seçimi ENGELLEMEZ —
                                tekrar/pekiştirme için koç yine seçebilir. */}
                            {availableTopics && availableTopics.length > 0 && availableTopics.map((topic, idx) => {
                                const isActive = activeTool?.topic === topic.ad;
                                const isSelected = selectedTopics.some((t) => t.ad === topic.ad);
                                const kuyruktaVar = distributionQueue.some(
                                    (q) => q.bolum === selectedExam && q.ders === selectedSubject && q.konu === topic.ad,
                                );
                                const zorlukEtiketi = { 1: 'Kolay', 2: 'Orta', 3: 'Zor' }[topic.zorluk] || 'Orta';
                                const zorlukRengi = { 1: 'text-ok', 2: 'text-warn', 3: 'text-danger' }[topic.zorluk] || 'text-warn';

                                return (
                                    <div key={topic.ad || idx} className="flex gap-1 group">
                                        <div className="flex items-center justify-center pl-1">
                                            <button
                                                onClick={() => toggleTopicSelection(topic)}
                                                className={`p-1 rounded hover:bg-surface-3 transition ${isSelected ? 'text-brand' : 'text-ink-3'}`}
                                                aria-label={`${topic.ad} seç`}
                                            >
                                                {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => handleToolSelect(topic)}
                                            className={`flex-1 text-left px-2.5 py-2 rounded-lg text-[11px] font-semibold transition border min-w-0 ${isActive ? 'bg-brand text-white border-brand shadow-md' : 'bg-surface text-ink-2 border-line hover:bg-brand-soft hover:border-brand-line'}`}
                                        >
                                            <span className="flex items-center gap-1.5 min-w-0">
                                                <span className="truncate">{topic.ad}</span>
                                                {topic.bitti && (
                                                    <span
                                                        className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-ok-soft text-ok border border-ok/30"
                                                        title="Öğrenci bu konuyu tamamladı — tekrar/pekiştirme için yine seçebilirsiniz"
                                                    >
                                                        ✓ BİTTİ
                                                    </span>
                                                )}
                                                {!topic.bitti && topic.durum === 'tekrar' && (
                                                    <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-warn-soft text-warn border border-warn/30" title="Hedef soru doldu ama isabet düşük — tekrar gerekiyor">
                                                        ⚠ TEKRAR
                                                    </span>
                                                )}
                                            </span>
                                            <span className={`block mt-0.5 text-[9px] font-bold ${isActive ? 'text-white/80' : 'text-ink-3'}`}>
                                                <span className={isActive ? '' : zorlukRengi}>{zorlukEtiketi}</span>
                                                {' · '}sınavda ~{topic.agirlik} soru
                                                {topic.hedef != null && (
                                                    <> · {topic.soru}/{topic.hedef} soru çözüldü</>
                                                )}
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (kuyruktaVar) return;
                                                const kayit = {
                                                    bolum: selectedExam, ders: selectedSubject,
                                                    dersAd: dersAdi(selectedSubject), konu: topic.ad,
                                                    agirlik: topic.agirlik, zorluk: topic.zorluk,
                                                    hedef: topic.hedef, kalanSoru: topic.kalanSoru, bitti: topic.bitti,
                                                    subject: dersAdi(selectedSubject), topic: topic.ad, exam: selectedExam,
                                                };
                                                kayit.konuEtut = konuEtutIhtiyaci(kayit);
                                                kayit.soruEtut = soruEtutIhtiyaci(kayit, kriterler);
                                                setDistributionQueue([...distributionQueue, kayit]);
                                            }}
                                            disabled={kuyruktaVar}
                                            className="px-2 bg-brand-soft text-brand rounded-lg border border-brand-line hover:bg-brand-soft flex items-center justify-center font-bold disabled:opacity-40"
                                            title={kuyruktaVar ? 'Bu konu listede zaten var' : 'Listeye Ekle'}
                                        >
                                            +
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        </div>

                        {/* ══ AYARLAR: ölçü, kriterler, etüt saatleri ══ */}
                        <div className={sidebarTab === 'ayarlar' ? 'flex-1 overflow-y-auto p-3 space-y-3 bg-surface-2' : 'hidden'}>
                        {/* ── Program ölçüsü ─────────────────────────── */}
                        <div className="rounded-xl border border-line bg-surface p-3 space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-ink-3">Program Ölçüsü</p>

                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => { setWeeklyMode(true); setActiveMonth(1); setActiveWeek(1); }}
                                    className={`flex-1 py-2.5 rounded-lg text-xs font-black transition ${weeklyMode ? 'bg-ok text-ink shadow' : 'bg-surface-3 text-ink-2 hover:bg-surface-3'}`}
                                >
                                    <CalendarDays size={14} className="mr-1.5" /> Tek Hafta
                                </button>
                                <button
                                    onClick={() => setWeeklyMode(false)}
                                    className={`flex-1 py-2.5 rounded-lg text-xs font-black transition ${!weeklyMode ? 'bg-brand text-ink shadow' : 'bg-surface-3 text-ink-2 hover:bg-surface-3'}`}
                                >
                                    <CalendarRange size={14} className="mr-1.5" /> Ay Bazlı
                                </button>
                            </div>

                            {!weeklyMode && (
                                <label className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-ink-2">Süre</span>
                                    <select
                                        value={programDurationMonths}
                                        onChange={(e) => setProgramDurationMonths(Number(e.target.value))}
                                        className="text-xs font-bold border border-line rounded-lg px-2 py-1.5 bg-surface outline-none focus:border-indigo-400"
                                    >
                                        {[...Array(12).keys()].map(n => <option key={n + 1} value={n + 1}>{n + 1} Ay</option>)}
                                    </select>
                                </label>
                            )}

                            <label className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-ink-2">Günlük etüt sayısı</span>
                                <select
                                    value={dailySlotCount}
                                    onChange={(e) => setDailySlotCount(Number(e.target.value))}
                                    className="text-xs font-bold border border-line rounded-lg px-2 py-1.5 bg-surface outline-none focus:border-indigo-400"
                                >
                                    {[...Array(11).keys()].slice(1).map(n => <option key={n} value={n}>{n} etüt</option>)}
                                </select>
                            </label>
                        </div>

                            {/* 🧠 VERİMLİ PROGRAM KRİTERLERİ */}
                            <div className="mt-3 rounded-xl border border-brand-line bg-brand-soft/60 overflow-hidden">
                                <button
                                    onClick={() => setShowPlanSettings(v => !v)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-black text-brand uppercase tracking-wide"
                                >
                                    <span className="flex items-center gap-1.5">
                                        <Settings size={13} /> Program Kriterleri
                                    </span>
                                    <ChevronDown size={14} className={`transition ${showPlanSettings ? 'rotate-180' : ''}`} />
                                </button>

                                {showPlanSettings && (
                                    <div className="px-3 pb-3 space-y-2">
                                        {[
                                            { key: 'soruEtutleriAcik', label: 'Konu → Soru çözümü', hint: 'Konu bitince hedef soruya göre soru etüdü' },
                                            { key: 'tekrarAcik', label: 'Aralıklı tekrar', hint: `+${kriterler.tekrarAraliklari.join(', +')}. günlerde geri getirme` },
                                            { key: 'denemeAcik', label: 'Haftalık deneme + analiz', hint: 'Süre gerçek sınavdan hesaplanır' },
                                            { key: 'paragrafAcik', label: 'Günlük paragraf', hint: 'Hafta içi, günün ilk yarısı' },
                                            { key: 'kitapAcik', label: 'Kitap okuma', hint: 'Günün son etüdü' },
                                            { key: 'gunTekrariAcik', label: 'Günün tekrarı', hint: 'Gün sonunda o günün geri getirme provası' },
                                        ].map(o => (
                                            <label key={o.key} className="flex items-start gap-2 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={!!kriterler[o.key]}
                                                    onChange={e => kriterDegistir(o.key, e.target.checked)}
                                                    className="mt-0.5 accent-indigo-600 shrink-0"
                                                />
                                                <span className="min-w-0">
                                                    <span className="block text-[11px] font-bold text-ink-2 leading-tight">{o.label}</span>
                                                    <span className="block text-[9px] text-ink-3 leading-tight">{o.hint}</span>
                                                </span>
                                            </label>
                                        ))}

                                        {kriterler.denemeAcik && (
                                            <div className="flex items-center gap-2 pt-1">
                                                <span className="text-[10px] font-bold text-ink-2 shrink-0">Deneme günü:</span>
                                                <select
                                                    value={kriterler.denemeGunu}
                                                    onChange={e => kriterDegistir('denemeGunu', e.target.value)}
                                                    className="flex-1 text-[11px] p-1 border border-brand-line rounded bg-surface outline-none focus:border-brand"
                                                >
                                                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                                </select>
                                            </div>
                                        )}

                                        {/* ⚠️ Bu iki sınır motorda KESİN uygulanır; ihlal olursa
                                            üretim sonrası uyarı paneli gösterir. */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-ink-2 shrink-0">Günde en çok:</span>
                                            <select
                                                value={kriterler.gunlukMaxDers}
                                                onChange={e => kriterDegistir('gunlukMaxDers', Number(e.target.value))}
                                                className="flex-1 text-[11px] p-1 border border-brand-line rounded bg-surface outline-none focus:border-brand"
                                            >
                                                {[1, 2, 3, 4, 5].map(n => (
                                                    <option key={n} value={n}>{n} ders{n === 3 ? ' (önerilen)' : ''}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-ink-2 shrink-0">Günde en çok:</span>
                                            <select
                                                value={kriterler.gunlukMaxKonu}
                                                onChange={e => kriterDegistir('gunlukMaxKonu', Number(e.target.value))}
                                                className="flex-1 text-[11px] p-1 border border-brand-line rounded bg-surface outline-none focus:border-brand"
                                            >
                                                {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} yeni konu</option>)}
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-ink-2 shrink-0">Esnek/telafi:</span>
                                            <select
                                                value={kriterler.esnekHaftalik}
                                                onChange={e => kriterDegistir('esnekHaftalik', Number(e.target.value))}
                                                className="flex-1 text-[11px] p-1 border border-brand-line rounded bg-surface outline-none focus:border-brand"
                                            >
                                                {[0, 1, 2, 3, 4].map(n => (
                                                    <option key={n} value={n}>{n === 0 ? 'yok' : `haftada ${n} etüt`}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-ink-2 shrink-0">Etüt süresi:</span>
                                            <select
                                                value={kriterler.etutSuresiDk}
                                                onChange={e => kriterDegistir('etutSuresiDk', Number(e.target.value))}
                                                className="flex-1 text-[11px] p-1 border border-brand-line rounded bg-surface outline-none focus:border-brand"
                                            >
                                                {[30, 40, 45, 50, 60, 75, 90].map(n => <option key={n} value={n}>{n} dakika</option>)}
                                            </select>
                                        </div>

                                        <p className="text-[9px] text-ink-3 leading-snug pt-1 border-t border-brand-line/50">
                                            Ders sayımına yalnız konu/soru/tekrar girer; paragraf, kitap,
                                            deneme, analiz ve esnek etüt <strong>ekstra</strong> sayılır.
                                            Deneme etüdü gerçek sınav süresinden (TYT 165 dk, AYT 180 dk,
                                            YDT 120 dk) hesaplanır. Soru etüdü, konunun kalan hedef sorusu ×
                                            ders bazlı soru süresinden çıkar.
                                        </p>
                                    </div>
                                )}
                            </div>

                        {/* ── Etüt açma/kapama ───────────────────────── */}
                        <div className="rounded-xl border border-line bg-surface overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-2.5 bg-surface-2 border-b border-line">
                                <p className="text-[10px] font-black uppercase tracking-widest text-ink-2">Etüt Saatleri</p>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setClosedSlots({})}
                                        className="text-[9px] font-bold px-2 py-1 rounded bg-ok-soft text-ok hover:bg-emerald-200"
                                    >
                                        Tümünü Aç
                                    </button>
                                    <button
                                        onClick={() => {
                                            const all = {};
                                            DAYS.forEach(d => { all[d] = [...Array(dailySlotCount).keys()]; });
                                            setClosedSlots(all);
                                        }}
                                        className="text-[9px] font-bold px-2 py-1 rounded bg-danger-soft text-danger hover:bg-red-200"
                                    >
                                        Tümünü Kapat
                                    </button>
                                </div>
                            </div>

                            <p className="px-3 pt-2 text-[10px] text-ink-3 leading-snug">
                                Kapalı etütlere otomatik dağıtım ders atamaz. Öğrencinin okulda/serviste
                                olduğu saatleri kapatın.
                            </p>

                            <div className="p-3 space-y-1.5">
                                {DAYS.map(day => {
                                    const daySlots = closedSlots[day] || [];
                                    const allClosed = daySlots.length === dailySlotCount;
                                    return (
                                        <div key={day} className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    const next = { ...closedSlots };
                                                    if (allClosed) delete next[day];
                                                    else next[day] = [...Array(dailySlotCount).keys()];
                                                    setClosedSlots(next);
                                                }}
                                                className="w-20 shrink-0 text-left text-[11px] font-bold text-ink-2 hover:text-brand truncate"
                                                title={allClosed ? 'Günü aç' : 'Günü kapat'}
                                            >
                                                {day}
                                            </button>
                                            <div className="flex gap-1 flex-wrap">
                                                {[...Array(dailySlotCount)].map((_, idx) => {
                                                    const isClosed = daySlots.includes(idx);
                                                    return (
                                                        <button
                                                            key={idx}
                                                            onClick={() => {
                                                                const next = { ...closedSlots };
                                                                const cur = next[day] ? [...next[day]] : [];
                                                                const at = cur.indexOf(idx);
                                                                if (at > -1) cur.splice(at, 1); else cur.push(idx);
                                                                if (cur.length) next[day] = cur; else delete next[day];
                                                                setClosedSlots(next);
                                                            }}
                                                            title={`${idx + 1}. etüt — ${isClosed ? 'kapalı' : 'açık'}`}
                                                            className={`w-7 h-7 rounded-lg text-[10px] font-black transition ${
                                                                isClosed
                                                                    ? 'bg-danger-soft text-danger border border-danger'
                                                                    : 'bg-ok-soft text-ok border border-ok hover:bg-ok-soft'
                                                            }`}
                                                        >
                                                            {idx + 1}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        </div>
                    </div>

                    {/* 3. Main Schedule Grid — telefonda yalnızca "Program"
                        bölmesi seçiliyken görünür */}
                    <div className={`flex-1 flex-col bg-surface-2 min-w-0 min-h-0 ${
                        mobilBolme === 'takvim' ? 'flex' : 'hidden'
                    } lg:flex`}>
                        {/* Month Tabs - Tek Hafta modunda gizlenir */}
                        {weeklyMode ? (
                            <div className="flex border-b border-line bg-surface px-2 pt-2 gap-1">
                                <span className="px-4 py-2 font-bold text-xs rounded-t-lg bg-surface-inv text-white flex items-center gap-1">
                                    <CalendarDays size={14} className="mr-1.5" /> Tek Haftalık Program
                                </span>
                            </div>
                        ) : (
                            <div className="flex border-b border-line bg-surface px-2 pt-2 gap-1 overflow-x-auto">
                                {[...Array(12).keys()].filter(m => m < programDurationMonths).map(m => (
                                    <button
                                        key={m + 1}
                                        onClick={() => { setActiveMonth(m + 1); setActiveWeek(1); }}
                                        className={`px-4 py-2 font-bold text-xs rounded-t-lg transition ${activeMonth === m + 1 ? 'bg-surface-inv text-ink' : 'bg-surface-3 text-ink-2 hover:bg-surface-3'}`}
                                    >
                                        {m + 1}. Ay
                                    </button>
                                ))}
                            </div>
                        )}
                        {/* Week Tabs - Tek Hafta modunda sadece 1 hafta görünür */}
                        <div className="flex flex-wrap gap-2 border-b border-line bg-surface-2 px-3 lg:px-8 pt-2 pb-2 justify-between items-end">
                            <div className="flex overflow-x-auto">
                                {(weeklyMode ? [1] : [1, 2, 3, 4]).map(week => (
                                    <button
                                        key={week}
                                        onClick={() => setActiveWeek(week)}
                                        className={`px-4 lg:px-8 py-2 font-bold text-sm border-b-2 transition -mb-[10px] shrink-0 ${activeWeek === week ? 'border-indigo-600 text-brand bg-surface rounded-t-lg shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10' : 'border-transparent text-ink-3 hover:text-ink-2'}`}
                                    >
                                        {week}. Hafta
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => {
                                        setSelectionMode(!selectionMode);
                                        setSelectedCells([]);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${selectionMode ? 'bg-brand text-ink' : 'bg-surface border border-line-2 text-ink-2 hover:bg-surface-3'}`}
                                >
                                    <CheckSquare size={14} />
                                    {selectionMode ? 'Seçim Modundan Çık' : 'Seçim Modu (Manuel Seçim)'}
                                </button>
                                {selectionMode && (
                                    <>
                                        <button
                                            onClick={() => {
                                                if (selectedCells.length === 0) return bildir('Hücre seçilmedi!');
                                                if (!activeTool) return bildir('Lütfen soldan bir ders aracı/silgi seçin!');
                                                const newSchedule = { ...schedule };
                                                selectedCells.forEach(key => {
                                                    if (activeTool === 'eraser') {
                                                        delete newSchedule[key];
                                                    } else {
                                                        newSchedule[key] = {
                                                            subject: activeTool.subject,
                                                            topic: activeTool.topic,
                                                            type: activeTool.type || 'konu',
                                                            color: activeTool.color,
                                                            exam: activeTool.exam
                                                        };
                                                    }
                                                });
                                                setSchedule(newSchedule);
                                                setSelectedCells([]);
                                                setSelectionMode(false);
                                            }}
                                            className="px-3 py-1.5 bg-ok text-white hover:bg-ok rounded-lg text-xs font-bold transition flex items-center"
                                        >
                                            Seçili Hücrelere Ata
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (selectedCells.length === 0) return bildir('Hücre seçilmedi!');
                                                if (!activeTool) return bildir('Lütfen soldan bir ders aracı/silgi seçin!');
                                                const newSchedule = { ...schedule };
                                                selectedCells.forEach(key => {
                                                    const parts = key.split('-');
                                                    const d = parts[2];
                                                    const s = parts[3];
                                                    for (let month = 1; month <= programDurationMonths; month++) {
                                                        for (let week = 1; week <= 4; week++) {
                                                            const allRangeKey = `m${month}-w${week}-${d}-${s}`;
                                                            if (activeTool === 'eraser') {
                                                                delete newSchedule[allRangeKey];
                                                            } else {
                                                                newSchedule[allRangeKey] = {
                                                                    subject: activeTool.subject,
                                                                    topic: activeTool.topic,
                                                                    type: activeTool.type || 'konu',
                                                                    color: activeTool.color,
                                                                    exam: activeTool.exam
                                                                };
                                                            }
                                                        }
                                                    }
                                                });
                                                setSchedule(newSchedule);
                                                setSelectedCells([]);
                                                setSelectionMode(false);
                                            }}
                                            className="px-3 py-1.5 bg-info text-white hover:bg-info rounded-lg text-xs font-bold transition flex items-center"
                                        >
                                            <Globe size={14} className="mr-1" /> Tüm Haftalara Ata
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start bg-surface-3">
                            <div id="printable-schedule" className="bg-surface shadow-2xl rounded-2xl border border-line p-5 sm:p-8 min-w-[1000px] w-full max-w-[1400px] mx-auto">

                                {/* ── Başlık ────────────────────────────── */}
                                <div className="text-center mb-6 pb-5 border-b-2 border-line relative">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-soft text-brand text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                                        <Calendar size={11} /> Haftalık Çalışma Programı
                                    </div>
                                    <h2 className="text-[26px] leading-tight font-black text-ink tracking-tight">{title}</h2>
                                    <p className="text-brand font-black text-xs mt-1.5 uppercase tracking-[0.25em]">
                                        {activeMonth}. AY · {activeWeek}. HAFTA
                                    </p>
                                </div>

                                {/* ── Izgara ────────────────────────────── */}
                                <div className="grid grid-cols-8 gap-1.5">
                                    {/* Başlık satırı */}
                                    <div className="rounded-xl bg-surface-inv text-white font-black py-3 text-center flex items-center justify-center text-[10px] tracking-[0.2em]">
                                        ETÜT
                                    </div>
                                    {DAYS.map(day => {
                                        const weekend = day === 'Cumartesi' || day === 'Pazar';
                                        return (
                                            <div
                                                key={day}
                                                className={`rounded-xl py-3 text-center font-black uppercase text-[11px] tracking-wide notranslate ${
                                                    weekend
                                                        ? 'bg-brand text-white'
                                                        : 'bg-surface-3 text-ink-2'
                                                }`}
                                                translate="no"
                                            >
                                                {day}
                                            </div>
                                        );
                                    })}

                                    {/* Etüt satırları */}
                                    {Array.from({ length: dailySlotCount }).map((_, slotIndex) => (
                                        <React.Fragment key={slotIndex}>
                                            <div className="rounded-xl bg-surface-2 border border-line flex flex-col items-center justify-center py-2">
                                                <span className="text-[19px] font-black text-ink leading-none">{slotIndex + 1}</span>
                                                <span className="text-[8px] font-black text-ink-3 uppercase tracking-widest mt-1">Etüt</span>
                                            </div>

                                            {DAYS.map(day => {
                                                const cellKey = `m${activeMonth}-w${activeWeek}-${day}-${slotIndex}`;
                                                const cellData = schedule[cellKey];
                                                const isClosed = (closedSlots[day] || []).includes(slotIndex);
                                                const isSelected = selectedCells.includes(cellKey);
                                                const c = cellData ? getCellColor(cellData) : null;
                                                const activity = ACTIVITY_TYPES[cellData?.type || 'konu'];

                                                return (
                                                    <div
                                                        key={`${day}-${slotIndex}`}
                                                        onClick={() => handleCellClick(day, slotIndex)}
                                                        className={`min-h-[118px] cursor-pointer rounded-xl p-2.5 transition-all relative group overflow-hidden ${
                                                            isClosed ? 'cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-md'
                                                        }`}
                                                        style={{
                                                            backgroundColor: isClosed ? '#FEF2F2' : (c ? c.bg : '#FAFAFA'),
                                                            border: isClosed
                                                                ? '1.5px solid #FECACA'
                                                                : c
                                                                    ? `${isActivityBlock(cellData) ? '2px' : '1.5px'} solid ${isActivityBlock(cellData) ? c.border : `${c.border}55`}`
                                                                    : '1.5px solid #E5E7EB',
                                                            opacity: isClosed ? 0.5 : 1,
                                                            boxShadow: isSelected ? 'inset 0 0 0 3px #4F46E5' : undefined,
                                                        }}
                                                    >
                                                        {/* Sol kenar renk şeridi — dersi tek bakışta ayırır */}
                                                        {cellData && !isClosed && (
                                                            <span
                                                                className="absolute left-0 top-0 bottom-0 w-[5px]"
                                                                style={{ backgroundColor: c.border }}
                                                            />
                                                        )}

                                                        {isClosed ? (
                                                            <div className="h-full w-full flex flex-col items-center justify-center text-danger">
                                                                <span className="text-2xl">🔒</span>
                                                                <span className="text-[8px] font-black mt-1 tracking-widest">KAPALI</span>
                                                            </div>
                                                        ) : cellData ? (
                                                            <div className="h-full w-full flex flex-col pl-1.5">
                                                                {/* Üst satır: aktivite rozeti + sınav */}
                                                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                                                    <span
                                                                        className="inline-flex items-center gap-1 text-[8px] font-black px-1.5 py-0.5 rounded-md tracking-wider"
                                                                        style={{ backgroundColor: `${c.border}22`, color: c.text }}
                                                                    >
                                                                        <span className="text-[9px] leading-none">{activity.icon}</span>
                                                                        {activity.short}
                                                                    </span>
                                                                    {cellData.exam && (
                                                                        <span className="text-[8px] font-black px-1 py-0.5 rounded bg-surface/70 text-ink-2 tracking-wide">
                                                                            {cellData.exam}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Ders adı */}
                                                                <span
                                                                    className="text-[11px] font-black uppercase tracking-tight leading-none mb-1"
                                                                    style={{ color: c.border }}
                                                                >
                                                                    {getSubjectLabel(toStr(cellData.subject))}
                                                                </span>

                                                                {/* Konu */}
                                                                {cellData.topic && (
                                                                    <span
                                                                        className="text-[12px] font-bold leading-[1.25] break-words"
                                                                        style={{ color: c.text }}
                                                                    >
                                                                        {toStr(cellData.topic)}
                                                                    </span>
                                                                )}

                                                                {/* Tekrar turu bilgisi */}
                                                                {cellData.type === 'tekrar' && cellData.round && (
                                                                    <span className="mt-auto pt-1 text-[8px] font-black opacity-50" style={{ color: c.text }}>
                                                                        {cellData.round}. GÜN TEKRARI
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-30 transition">
                                                                <PlusCircle size={18} className="text-ink-3" />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </div>

                                {/* ── Lejant ────────────────────────────── */}
                                <ScheduleLegend schedule={schedule} month={activeMonth} week={activeWeek} />

                        </div>
                    </div>

                    {/* 📄 Gizli Yazdırma Alanı — Her hafta ayrı div (data-pdf-week) ile render edilir */}
                    <div style={{ position: 'absolute', left: '-9999px', top: '0', pointerEvents: 'none' }}>
                        {Array.from({ length: weeklyMode ? 1 : programDurationMonths }).map((_, mIdx) => (
                            Array.from({ length: weeklyMode ? 1 : 4 }).map((_, wIdx) => {
                                const m = mIdx + 1;
                                const w = wIdx + 1;
                                const hasDataInWeek = Object.keys(schedule).some(k => k.startsWith(`m${m}-w${w}-`));
                                if (!hasDataInWeek && !(m === 1 && w === 1)) return null;

                                const initials = (studentName || 'Ö')
                                    .split(' ').slice(0, 2).map(p => p.charAt(0)).join('').toLocaleUpperCase('tr-TR');

                                return (
                                    <div
                                        key={`${m}-${w}`}
                                        data-pdf-week={`${m}-${w}`}
                                        style={{
                                            width: '1120px',
                                            backgroundColor: 'white',
                                            padding: '16px',
                                            boxSizing: 'border-box',
                                            display: 'block'
                                        }}
                                    >
                                        {/* ── Renkli başlık bandı ─────────────────── */}
                                        <div
                                            className="flex items-center gap-4 mb-3"
                                            style={{
                                                background: 'linear-gradient(115deg, #4338CA 0%, #6D28D9 45%, #A21CAF 100%)',
                                                borderRadius: '14px',
                                                padding: '14px 18px',
                                                color: '#fff',
                                            }}
                                        >
                                            {/* Öğrenci baş harfleri */}
                                            <div
                                                className="shrink-0 flex items-center justify-center font-black"
                                                style={{
                                                    width: '46px', height: '46px', borderRadius: '13px',
                                                    backgroundColor: 'rgba(255,255,255,0.18)',
                                                    border: '1.5px solid rgba(255,255,255,0.35)',
                                                    fontSize: '17px', letterSpacing: '0.5px',
                                                }}
                                            >
                                                {initials}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p
                                                    className="font-black uppercase"
                                                    style={{ fontSize: '9px', letterSpacing: '0.28em', color: 'rgba(255,255,255,0.65)' }}
                                                >
                                                    Kişisel Çalışma Programı
                                                </p>
                                                <h1
                                                    className="font-black leading-tight"
                                                    style={{ fontSize: '23px', letterSpacing: '-0.4px', marginTop: '1px' }}
                                                >
                                                    {studentName || 'Öğrenci'}
                                                </h1>
                                                <p style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.72)', marginTop: '1px' }}>
                                                    {title}
                                                </p>
                                            </div>

                                            {/* Hafta rozeti */}
                                            <div
                                                className="shrink-0 text-center"
                                                style={{
                                                    backgroundColor: 'rgba(255,255,255,0.16)',
                                                    border: '1.5px solid rgba(255,255,255,0.3)',
                                                    borderRadius: '12px',
                                                    padding: '8px 16px',
                                                }}
                                            >
                                                {weeklyMode ? (
                                                    <>
                                                        <p style={{ fontSize: '20px', fontWeight: 900, lineHeight: 1 }}>1</p>
                                                        <p style={{ fontSize: '8px', letterSpacing: '0.2em', fontWeight: 800, opacity: 0.75, marginTop: '2px' }}>
                                                            HAFTALIK
                                                        </p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p style={{ fontSize: '20px', fontWeight: 900, lineHeight: 1 }}>{w}</p>
                                                        <p style={{ fontSize: '8px', letterSpacing: '0.2em', fontWeight: 800, opacity: 0.75, marginTop: '2px' }}>
                                                            {m}. AY / HAFTA
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-8" style={{ gap: '4px' }}>
                                            <div className="text-ink font-black py-2 text-center flex items-center justify-center text-[9px] tracking-[0.2em]"
                                                style={{ backgroundColor: 'var(--ink)', borderRadius: '8px' }}>ETÜT</div>
                                            {DAYS.map(day => {
                                                const weekend = day === 'Cumartesi' || day === 'Pazar';
                                                return (
                                                    <div key={day} className="font-black py-2 text-center uppercase text-[10px]"
                                                        style={{
                                                            backgroundColor: weekend ? '#4F46E5' : '#F1F5F9',
                                                            color: weekend ? '#fff' : '#334155',
                                                            borderRadius: '8px',
                                                        }}>{day}</div>
                                                );
                                            })}

                                            {[...Array(dailySlotCount)].map((_, sIdx) => (
                                                <React.Fragment key={sIdx}>
                                                    <div className="p-1 text-center flex flex-col items-center justify-center min-h-[62px]"
                                                        style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                                                        <span className="text-[15px] font-black text-ink leading-none">{sIdx + 1}</span>
                                                        <span className="text-[7px] font-black text-ink-3 uppercase tracking-widest">Etüt</span>
                                                    </div>
                                                    {DAYS.map(day => {
                                                        const key = `m${m}-w${w}-${day}-${sIdx}`;
                                                        const data = schedule[key];
                                                        const closed = (closedSlots[day] || []).includes(sIdx);
                                                        const c = data ? getCellColor(data) : null;
                                                        const act = ACTIVITY_TYPES[data?.type || 'konu'];
                                                        return (
                                                            <div key={day} className="min-h-[62px] p-1.5 flex flex-col relative overflow-hidden"
                                                                style={{
                                                                    backgroundColor: closed ? '#FEF2F2' : (c ? c.bg : '#FCFCFD'),
                                                                    border: closed
                                                                        ? '1px solid #FECACA'
                                                                        : c
                                                                            ? `${isActivityBlock(data) ? '1.8px' : '1px'} solid ${isActivityBlock(data) ? c.border : `${c.border}55`}`
                                                                            : '1px solid #EEF0F3',
                                                                    borderRadius: '8px',
                                                                }}>
                                                                {data && !closed && (
                                                                    <span style={{
                                                                        position: 'absolute', left: 0, top: 0, bottom: 0,
                                                                        width: '4px', backgroundColor: c.border,
                                                                    }} />
                                                                )}
                                                                {closed ? (
                                                                    <span className="text-lg m-auto">🔒</span>
                                                                ) : data ? (
                                                                    <div className="flex flex-col w-full" style={{ paddingLeft: '4px' }}>
                                                                        <span className="text-[7px] font-black uppercase tracking-wider leading-none mb-0.5"
                                                                            style={{ color: c.border }}>
                                                                            {act.icon} {act.short}
                                                                        </span>
                                                                        <span className="text-[8px] font-black uppercase leading-none" style={{ color: c.border }}>
                                                                            {getSubjectLabel(data.subject)}
                                                                        </span>
                                                                        <span className="text-[9px] font-bold leading-tight break-words" style={{ color: c.text }}>
                                                                            {data.topic}
                                                                        </span>
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            ))}
                                        </div>

                                        <PdfLegend schedule={schedule} month={m} week={w} />

                                        <div className="mt-3 flex justify-between text-[8px] text-ink-3 font-bold uppercase tracking-[0.2em]">
                                            <span>{MARKA.tamAd.toLocaleUpperCase('tr-TR')}</span>
                                            <span className="text-ink-3 italic">HER HAFTA YENİ BİR BAŞLANGIÇTIR!</span>
                                        </div>
                                    </div>
                                );
                            })
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
);
};

// --- Main Wrapper Component (Exports as ProgramBuilderModal) ---
const ProgramBuilderModal = ({ studentId, studentName, onClose }) => (
    /*
     * Ortak Modal bileşenine taşındı — Escape, odak tuzağı, arka sayfa
     * kilidi ve dvh yüksekliği artık orada bir kez çözülüyor.
     * Kendi başlığı (ve kapatma düğmesi) içerikte olduğu için
     * Modal'ın başlık çubuğu gizlendi.
     */
    <Modal
        acik
        onClose={onClose}
        genislik="tam"
        baslikGizle
        katmanClassName="z-program-builder"
        className="notranslate"
        govdeClassName="p-0 flex flex-col overflow-hidden"
    >
        <div className="w-full h-full flex flex-col overflow-hidden relative notranslate" translate="no">
            <ErrorBoundary onClose={onClose}>
                <ProgramBuilderContent studentId={studentId} studentName={studentName} onClose={onClose} />
            </ErrorBoundary>
        </div>
    </Modal>
);

export default ProgramBuilderModal;
