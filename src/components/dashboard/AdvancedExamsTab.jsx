import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { requireOwnerConfirmation } from '../../utils/dataProtection';
import {
    BarChart2, TrendingUp, Activity, Upload, FileText, Plus, X,
    ChevronDown, Trash2, Download, School, Users, BookOpen,
    CheckCircle, AlertCircle, ChevronRight, Layers, Filter, Edit2,
    FlaskConical, GraduationCap, ListChecks, Clock, Timer, RefreshCw, AlertTriangle
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
    CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, Cell, Legend,
    AreaChart, Area
} from 'recharts';
import { parseExcelExamData, normalizeName } from '../../utils/excelParser';
import { parseTYTExcel } from '../../utils/tytExcelParser';
import { parseAYTExcel } from '../../utils/aytExcelParser';
import { downloadTemplate } from '../../utils/templateGenerator';
import { generateBulkExamReport, generateStudentReport } from '../../utils/pdfGenerator';
import { calculateEstimatedScore, getAYTAreaNets, getAYTMaxScoreArea, getOBPScore, normalizeSchoolNumber, clearScoreCache } from '../../utils/scoreCalculator';
import ReportCard from '../reports/ReportCard';
import firebaseSync from '../../services/firebaseSync';
import { getCustomCurriculum, saveCustomTopics, getExamResources, saveExamResources, removeExamResource } from '../../data/curriculum';
import ClassInstantAnalysis from '../coach/ClassInstantAnalysis';
import KonuAnaliziPaneli from './KonuAnaliziPaneli';
import birlesikDeneme from '../../services/birlesikDeneme';
import { bildir } from '../../services/uiGeriBildirim';
import { hataAnlat } from '../../services/hataMesaji';
import Modal from '../ui/Modal';
import { nesneOku, listeOku } from '../../services/veriDeposu';

/* 04.09: Ayarlar'daki "Deneme Kaynakları" kartı da kullanır — export edildi. */
export const CurriculumManager = () => {
    const [selectedExam, setSelectedExam] = useState('TYT');
    const [resources, setResources] = useState({});
    const [curriculum, setCurriculum] = useState({});
    const [newTitle, setNewTitle] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [newTopic, setNewTopic] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    useEffect(() => {
        setResources(getExamResources());
        setCurriculum(getCustomCurriculum());
    }, [selectedExam]);

    const handleAddResource = () => {
        if (!newTitle || !newUrl) return;
        const res = saveExamResources(selectedExam, { id: Date.now(), title: newTitle, url: newUrl });
        setResources(res);
        setNewTitle(''); setNewUrl('');
    };

    const handleDeleteResource = (id) => {
        setResources(removeExamResource(selectedExam, id));
    };

    const handleAddTopic = () => {
        if (!newTopic || !selectedCategory) return;
        const currentTopics = curriculum[selectedExam]?.[selectedCategory] || [];
        const newTopicObj = { name: newTopic, weight: 2 };
        saveCustomTopics(selectedExam, selectedCategory, [...currentTopics, newTopicObj]);
        setCurriculum(getCustomCurriculum());
        setNewTopic('');
    };

    const handleDeleteTopic = (category, topicIndex) => {
        const currentTopics = [...(curriculum[selectedExam]?.[category] || [])];
        currentTopics.splice(topicIndex, 1);
        saveCustomTopics(selectedExam, category, currentTopics);
        setCurriculum(getCustomCurriculum());
    };

    return (
        <div className="bg-surface rounded-2xl border border-line p-6 space-y-6">
            <h3 className="text-lg font-bold text-ink">Müfredat ve Kaynak Yönetimi</h3>
            <div className="flex gap-5 border-b border-line overflow-x-auto">
                {EXAM_TYPES.map(type => (
                    <button key={type} onClick={() => setSelectedExam(type)}
                        className={`-mb-px px-0.5 py-2.5 border-b-2 text-sm whitespace-nowrap transition ${selectedExam === type ? 'border-brand text-brand font-semibold' : 'border-transparent text-ink-3 hover:text-ink-2 font-medium'}`}>
                        {type}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* PDF Resources */}
                <div className="space-y-4">
                    <h4 className="font-bold text-brand">📚 Ekipman & Kaynaklar (PDF, Deneme, vb.)</h4>
                    <div className="bg-surface-2 p-4 rounded-xl space-y-3 border border-line">
                        <input type="text" placeholder="Kaynak Adı (örn: Matematik Soru Bankası)" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full text-sm p-2 border border-line rounded-lg" />
                        <input type="text" placeholder="URL Bağlantısı" value={newUrl} onChange={e => setNewUrl(e.target.value)} className="w-full text-sm p-2 border border-line rounded-lg" />
                        <button onClick={handleAddResource} className="w-full bg-brand text-white text-sm font-bold py-2 rounded-lg hover:bg-brand-hover transition">Kaynak Ekle</button>
                    </div>
                    <ul className="space-y-2">
                        {(resources[selectedExam] || []).map(r => (
                            <li key={r.id} className="flex justify-between items-center bg-surface p-3 rounded-xl border border-line shadow-sm">
                                <a href={r.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-info hover:underline flex items-center gap-2">
                                    <FileText size={16} /> {r.title}
                                </a>
                                <button onClick={() => handleDeleteResource(r.id)} className="text-danger hover:bg-danger-soft p-1.5 rounded-lg"><Trash2 size={16} /></button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Topics */}
                <div className="space-y-4">
                    <h4 className="font-bold text-c4">📝 Ders Konuları (Çalışma Planı Entegrasyonu)</h4>
                    <div className="bg-surface-2 p-4 rounded-xl space-y-3 border border-line">
                        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full p-2 text-sm border border-line rounded-lg">
                            <option value="">-- Ders / Kategori Seç --</option>
                            {Object.keys(curriculum[selectedExam] || {}).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <input type="text" placeholder="Yeni Konu Adı" value={newTopic} onChange={e => setNewTopic(e.target.value)} className="w-full text-sm p-2 border border-line rounded-lg" />
                        <button onClick={handleAddTopic} className="w-full bg-c4 text-white text-sm font-bold py-2 rounded-lg hover:bg-c4 transition">Konu Ekle</button>
                    </div>
                    {selectedCategory && curriculum[selectedExam]?.[selectedCategory] && (
                        <div className="max-h-60 overflow-y-auto pr-2 rounded-xl">
                            <ul className="space-y-2">
                                {curriculum[selectedExam][selectedCategory].map((t, idx) => (
                                    <li key={idx} className="flex justify-between items-center text-sm bg-surface p-2.5 rounded-xl border border-line shadow-sm">
                                        <span className="truncate">{typeof t === 'object' ? t.name : t}</span>
                                        <button onClick={() => handleDeleteTopic(selectedCategory, idx)} className="text-danger p-1.5 hover:bg-danger-soft rounded-lg"><X size={14} /></button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── OBP Yönetimi ─────────────────────────────────────────────────────────────
export const OBPManager = () => {
    const [obpData, setObpData] = useState(() => {
        try { return nesneOku('v2_obp_data'); } catch { return {}; }
    });
    const [newStudent, setNewStudent] = useState('');
    const [newNumber, setNewNumber] = useState('');
    const [newScore, setNewScore] = useState('');

    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === 'v2_obp_data') {
                try { setObpData(JSON.parse(e.newValue || '{}')); } catch { }
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const handleSave = () => {
        if (!newStudent.trim() || !newScore || !newNumber.trim()) {
            bildir("Lütfen Ad Soyad, Okul No ve Diploma Notu alanlarını doldurun.", 'uyari');
            return;
        }
        const score = parseFloat(newScore);
        if (score < 0 || score > 100) {
            bildir("Lütfen 0-100 arası geçerli bir diploma notu girin.", 'uyari');
            return;
        }

        const calculatedObp = parseFloat((score * 5 * 0.12).toFixed(2));

        const updated = {
            ...obpData, [newStudent.trim().toUpperCase()]: {
                obp: calculatedObp,
                diploma: score,
                number: normalizeSchoolNumber(newNumber)
            }
        };
        setObpData(updated);
        localStorage.setItem('v2_obp_data', JSON.stringify(updated));
        firebaseSync.syncKey('v2_obp_data').catch(() => { });

        // Notify other components
        window.dispatchEvent(new StorageEvent('storage', { key: 'v2_obp_data', newValue: JSON.stringify(updated) }));

        setNewStudent('');
        setNewScore('');
        setNewNumber('');
    };

    const handleDelete = (name) => {
        const updated = { ...obpData };
        delete updated[name];
        setObpData(updated);
        localStorage.setItem('v2_obp_data', JSON.stringify(updated));
        firebaseSync.syncKey('v2_obp_data').catch(() => { });
        window.dispatchEvent(new StorageEvent('storage', { key: 'v2_obp_data', newValue: JSON.stringify(updated) }));
    };

    const { user } = useAuth();
    const handleCopyLink = () => {
        const coachId = user?.id || 'default';
        const link = window.location.origin + window.location.pathname + `#/obp-girisi?c=${coachId}`;
        navigator.clipboard.writeText(link);
        bildir('Bağlantı kopyalandı:\n' + link + '\n\nÖğrencilerinizle paylaşabilirsiniz.');
    };

    const handleExcelUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const XLSX = await import('xlsx');
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (jsonData.length < 2) {
                bildir("Excel dosyası boş veya beklenen formatta değil.", 'uyari');
                return;
            }

            // Find headers dynamically (scan up to first 10 rows)
            let headerRowIndex = 0;
            let headers = [];
            let nameIdx = -1;
            let studentNoIdx = -1;
            let obpIdx = -1;

            for (let r = 0; r < Math.min(10, jsonData.length); r++) {
                const rowHeaders = (jsonData[r] || []).map(h => String(h || '').trim().toUpperCase().replace(/\s+/g, ''));
                
                const nIdx = rowHeaders.findIndex(h => h.includes('AD') || h.includes('İSİM') || h.includes('ISIM') || h === 'ÖĞRENCİ');
                const oIdx = rowHeaders.findIndex(h => h === 'OBP' || h.includes('DİPLOMA') || h.includes('DIPLOMA') || h.includes('NOT') || h.includes('PUAN'));
                
                if (nIdx !== -1 && oIdx !== -1) {
                    headers = rowHeaders;
                    nameIdx = nIdx;
                    obpIdx = oIdx;
                    studentNoIdx = rowHeaders.findIndex(h => h.includes('NO') || h.includes('NUMARA') || h.includes('ÖĞRENCİNO'));
                    headerRowIndex = r;
                    break;
                }
            }

            if (nameIdx === -1 || obpIdx === -1) {
                bildir("Excel formatı geçersiz. 'AD SOYAD' ve 'OBP' (veya Diploma Notu) sütunları bulunamadı. Lütfen başlıkları kontrol edin.", 'hata');
                return;
            }

            let uploadedCount = 0;
            const updated = { ...obpData };

            // Start parsing from the row after headers
            for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row) continue;
                
                // Allow fuzzy fallback to adjacent cells if name is somehow misaligned
                const rawName = row[nameIdx] || row[nameIdx - 1] || row[nameIdx + 1];
                if (!rawName) continue;

                const name = String(rawName).trim().toUpperCase();
                const schoolNo = studentNoIdx !== -1 ? normalizeSchoolNumber(row[studentNoIdx]) : '';
                const diplomaScoreStr = String(row[obpIdx] || '0').replace(',', '.');
                const score = parseFloat(diplomaScoreStr);

                if (name && !isNaN(score) && score >= 0 && score <= 100) {
                    const calculatedObp = parseFloat((score * 5 * 0.12).toFixed(2));
                    
                    // Priority: Use number as a secondary key or ensure it's stored for lookup
                    updated[name] = {
                        obp: calculatedObp,
                        diploma: score,
                        number: schoolNo,
                        student: name, // store name inside too
                        updatedAt: new Date().toISOString()
                    };
                    uploadedCount++;
                }
            }

            setObpData(updated);
            localStorage.setItem('v2_obp_data', JSON.stringify(updated));
            firebaseSync.syncKey('v2_obp_data').catch(() => { });
            window.dispatchEvent(new StorageEvent('storage', { key: 'v2_obp_data', newValue: JSON.stringify(updated) }));

            bildir(`${uploadedCount} öğrencinin OBP/Diploma Notu başarıyla aktarıldı!`, 'basari');

        } catch (error) {
            bildir(hataAnlat(error, 'excel'), 'hata');
        }
        e.target.value = null; // reset file input
    };

    return (
        <div className="bg-surface rounded-2xl border border-line p-6 space-y-6">
            <div className="flex justify-between items-center bg-brand-soft p-4 rounded-xl">
                <div>
                    <h3 className="text-lg font-bold text-brand">OBP (Diploma Notu) Yönetimi</h3>
                    <p className="text-sm text-brand">Öğrencilerin Diploma notlarını girip OBP'ye dönüştürün. Otomatik hesaplanan ek puanlar YKS deneme sonuçlarına yansır.</p>
                </div>
                <button onClick={handleCopyLink} className="flex items-center gap-2 bg-brand text-white font-bold px-4 py-2 rounded-xl shadow-lg hover:bg-brand-hover">
                    <CheckCircle size={18} /> Paylaşılabilir Link Kopyala
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h4 className="font-bold text-ink">Manuel OBP Ekle</h4>
                    <div className="bg-surface-2 p-4 rounded-xl space-y-3 border border-line">
                        <input type="text" placeholder="Öğrenci Adı Soyadı (Karnedeki adıyla tam eşleşmeli)" value={newStudent} onChange={e => setNewStudent(e.target.value)} className="w-full text-sm p-2 border border-line rounded-lg" />
                        <input type="text" placeholder="Okul Numarası" value={newNumber} onChange={e => setNewNumber(e.target.value)} className="w-full text-sm p-2 border border-line rounded-lg" />
                        <input type="number" placeholder="Diploma Notu (100 Üzerinden)" value={newScore} onChange={e => setNewScore(e.target.value)} min="0" max="100" step="0.01" className="w-full text-sm p-2 border border-line rounded-lg" />
                        <button onClick={handleSave} className="w-full bg-brand text-white text-sm font-bold py-2 rounded-lg hover:bg-brand-hover transition">Kaydet</button>
                        <p className="text-xs text-ink-2 mt-2">* Öğrenci diploma notunu (örn: 100) girin, sistem OBP Puanını (60) hesaplayacaktır.</p>
                    </div>

                    <div className="bg-brand-soft p-4 rounded-xl border border-brand-line mt-4 space-y-3">
                        <label className="text-sm font-black text-brand flex items-center gap-2">
                            <Upload size={16} className="text-brand" /> Toplu Excel Yükleme
                        </label>
                        <div className="flex items-center gap-2">
                            <input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} className="hidden" id="obp-excel-upload" />
                            <label htmlFor="obp-excel-upload" className="w-full flex items-center justify-center gap-2 bg-ok text-white text-sm font-bold py-3 rounded-lg hover:bg-ok transition cursor-pointer shadow-lg shadow-emerald-200">
                                Excel Dosyası Seç (.xlsx)
                            </label>
                        </div>
                        <p className="text-xs text-brand mt-2 opacity-80">* Excel dosyanızın başlıklarında "AD SOYAD", "Öğrenci No" ve "OBP" veya "Diploma" olmalıdır. Girdiğiniz OBP veya Diploma notu (0-100) otomatik hesaplanır.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="font-bold text-ink">Sistemdeki OBP Puanları</h4>
                    <div className="max-h-[300px] overflow-y-auto">
                        <ul className="space-y-2">
                            {Object.entries(obpData).length === 0 && (
                                <p className="text-sm text-ink-3 p-4 text-center border-2 border-dashed rounded-xl">Henüz eklenmiş OBP bulunmuyor.</p>
                            )}
                            {Object.entries(obpData).sort((a, b) => a[0].localeCompare(b[0])).map(([name, data]) => {
                                const score = typeof data === 'object' ? data.obp : data;
                                const tooltipInfo = typeof data === 'object' && data.diploma ? `Diploma: ${data.diploma} | No: ${data.number}` : 'Eski Kayıt';
                                return (
                                    <li key={name} className="flex justify-between items-center bg-surface p-3 rounded-xl border border-line shadow-sm" title={tooltipInfo}>
                                        <span className="text-sm font-bold text-ink-2">
                                            {name}
                                            {typeof data === 'object' && data.number && <span className="ml-2 text-xs text-ink-3 font-normal">({data.number})</span>}
                                        </span>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-black text-brand">+{score} OBP Puanı</span>
                                            <button onClick={() => handleDelete(name)} className="text-danger hover:bg-danger-soft p-1.5 rounded-lg"><Trash2 size={16} /></button>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Sabitler ─────────────────────────────────────────────────────────────────
const GRADE_LEVELS = [
    { id: '9', label: '9. Sınıf', color: 'blue', bg: 'bg-info-soft', text: 'text-info', border: 'border-info', badge: 'bg-info-soft text-info' },
    { id: '10', label: '10. Sınıf', color: 'emerald', bg: 'bg-ok-soft', text: 'text-ok', border: 'border-ok', badge: 'bg-ok-soft text-ok' },
    { id: '11', label: '11. Sınıf', color: 'violet', bg: 'bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))]', text: 'text-c4', border: 'border-[color-mix(in_srgb,var(--c4)_35%,transparent)]', badge: 'bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] text-c4' },
    { id: '12', label: '12. Sınıf', color: 'rose', bg: 'bg-danger-soft', text: 'text-danger', border: 'border-danger', badge: 'bg-danger-soft text-danger' },
];

/* 04.09 (canlı eşleme): tür sırası canlıdaki gibi; YDS/OBP tür listesinden
   çıktı (OBP & Müfredat yönetimi Ayarlar'a taşınıyor). */
const EXAM_TYPES = ['TYT', 'AYT', 'YDT', 'TYT+AYT', 'TYT+YDT', 'LGS', 'KPSS', 'AGS'];
const YKS_TURLERI = new Set(['TYT', 'AYT', 'YDT', 'TYT+AYT', 'TYT+YDT']);
const TUR_RENKLERI = {
    TYT: 'var(--c1)', AYT: 'var(--c4)', YDT: 'var(--c5)', 'TYT+AYT': 'var(--info)',
    'TYT+YDT': 'var(--ok)', LGS: 'var(--warn)', KPSS: 'var(--brand)', AGS: 'var(--c2)',
};

/* 3B görünümlü sınav türü çipi — sayaçlı */
const ExamTypeChip = ({ type, count = 0, secili, onClick }) => {
    const renk = TUR_RENKLERI[type] || 'var(--brand)';
    return (
        <button type="button" onClick={onClick} aria-pressed={secili}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-black whitespace-nowrap transition-all hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            style={secili ? {
                color: '#fff',
                background: `linear-gradient(180deg, color-mix(in srgb, ${renk} 88%, white 12%), ${renk})`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,.35), 0 2px 6px -1px color-mix(in srgb, ${renk} 55%, transparent), 0 8px 16px -8px color-mix(in srgb, ${renk} 60%, transparent)`,
            } : {
                color: 'var(--ink-2)',
                background: `linear-gradient(180deg, color-mix(in srgb, ${renk} 12%, var(--surface)), var(--surface))`,
                border: `1px solid color-mix(in srgb, ${renk} 32%, var(--line))`,
                boxShadow: 'inset 0 1px 0 var(--lit), 0 1px 2px -1px rgba(var(--cast), .2), 0 4px 10px -7px rgba(var(--cast), .4)',
            }}>
            {type}
            {count > 0 && (
                <span className="text-[10px] px-1.5 rounded-full font-black"
                    style={secili ? { background: 'rgba(255,255,255,.25)', color: '#fff' } : { background: `color-mix(in srgb, ${renk} 16%, var(--surface))`, color: renk }}>
                    {count}
                </span>
            )}
        </button>
    );
};

// Net puanını güvenli şekilde hesapla
const getNet = (val) => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'object' && val !== null) return parseFloat(val.net) || 0;
    return parseFloat(val) || 0;
};

// Toplam net'i hesapla - birden fazla kaynaktan düzgün okuma
const getTotalNet = (result) => {
    if (!result) return 0;
    const type = result.examType || result.type || 'TYT';
    
    if (['AYT', 'TYT+AYT', 'TYT+YDT', 'TYT+YDS'].includes(type)) {
        const { sayNet, eaNet, sozNet, dilNet } = getAYTAreaNets(result);
        
        let aytPart = 0;
        if (type === 'TYT+YDT' || type === 'TYT+YDS') aytPart = dilNet;
        else aytPart = Math.max(sayNet, eaNet, sozNet, dilNet);
        
        if (type === 'AYT') return aytPart;
        
        // TYT Part
        let tytPart = parseFloat(result.tyt || 0);
        if (tytPart === 0 && result.subjects) {
            tytPart = getNet(result.subjects.tyt_turkce) + 
                      getNet(result.subjects.tyt_matematik || result.subjects.tyt_mat) + 
                      getNet(result.subjects.tyt_fen) + 
                      getNet(result.subjects.tyt_sosyal);
        }
        return parseFloat((aytPart + tytPart).toFixed(2));
    }
    
    if (result.totalNet !== undefined && result.totalNet !== null && !isNaN(parseFloat(result.totalNet))) {
        return parseFloat(result.totalNet);
    }
    // 2. tyt field’i varsa (eski format)
    if (result.tyt !== undefined && result.tyt !== null && !isNaN(parseFloat(result.tyt))) {
        return parseFloat(result.tyt);
    }
    // 3. subjects’ten hesapla
    if (result && result.subjects && typeof result.subjects === 'object') {
        const total = Object.values(result.subjects).reduce((sum, subj) => {
            return sum + getNet(subj);
        }, 0);
        if (total > 0) return parseFloat(total.toFixed(2));
    }
    return 0;
};

// AYT için puan türü etiketini döndür (SAY/EA/SÖZ/DİL)
const getAYTScoreLabel = (result) => {
    return getAYTMaxScoreArea(result);
};

// ─── Sınav & Sınıf Grafik Paneli ────────────────────────────────────────────
/* 04.09 (canlı eşleme): panel canlıdaki son haline getirildi — ders
   setleri sınav türüne göre gerçek ders listeleri; "Öğrenci
   Karşılaştırması" öğrenci bazlı; yeni "Öğrenci Bazında" görünümü
   (sol renkli listeler + net gelişimi + ders kırılımı + çözüm
   davranışı); PDF raporu Türkçe-sanitize + özet/öğrenci/konu
   tablolarıyla yeniden yazıldı. */
const PANEL_RENK = ['var(--c1)', 'var(--ok)', 'var(--warn)', 'var(--c5)', 'var(--info)', 'var(--c4)'];
const LISTE_RENK = ['var(--c1)', 'var(--ok)', 'var(--warn)', 'var(--c4)', 'var(--c5)', 'var(--info)', 'var(--c2)', 'var(--brand)', 'var(--danger)'];
const DERS_AD = {
    turkce: 'Türkçe', mat: 'Matematik', fizik: 'Fizik', kimya: 'Kimya', biyoloji: 'Biyoloji',
    tarih: 'Tarih', cografya: 'Coğrafya', felsefe: 'Felsefe', din: 'Din K.', edebiyat: 'Edebiyat', ydil: 'Yabancı Dil',
};
const DERS_SETLERI = {
    TYT: [['Türkçe', 'turkce'], ['Matematik', 'mat'], ['Fizik', 'fizik'], ['Kimya', 'kimya'], ['Biyoloji', 'biyoloji'], ['Tarih', 'tarih'], ['Coğrafya', 'cografya'], ['Felsefe', 'felsefe'], ['Din K.', 'din']],
    AYT: [['Matematik', 'mat'], ['Fizik', 'fizik'], ['Kimya', 'kimya'], ['Biyoloji', 'biyoloji'], ['Edebiyat', 'edebiyat'], ['Tarih', 'tarih'], ['Coğrafya', 'cografya'], ['Felsefe', 'felsefe']],
    YDT: [['Yabancı Dil', 'ydil']],
    LGS: [['Türkçe', 'turkce'], ['Matematik', 'mat'], ['Fen', 'fen'], ['İnkılap', 'inkilap'], ['Din K.', 'din'], ['İngilizce', 'ing']],
    KPSS: [['Genel Yetenek', 'gy'], ['Genel Kültür', 'gk']],
    AGS: [['Genel Yetenek', 'gy'], ['Genel Kültür', 'gk'], ['Eğitim Bil.', 'egitim']],
};
const dersSeti = (tur) => DERS_SETLERI[tur]
    ? DERS_SETLERI[tur]
    : tur === 'TYT+AYT' ? [...DERS_SETLERI.TYT, ...DERS_SETLERI.AYT.map(([l, k]) => [`AYT ${l}`, `ayt_${k}`])]
        : tur === 'TYT+YDT' ? [...DERS_SETLERI.TYT, ...DERS_SETLERI.YDT]
            : [['Genel Net', 'totalNet']];
/* jsPDF gömülü fontları Türkçe karakter taşımıyor — rapor ASCII'ye indirgenir. */
const pdfAscii = (v) => String(v ?? '')
    .replace(/ı/g, 'i').replace(/İ/g, 'I').replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G').replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O').replace(/ç/g, 'c').replace(/Ç/g, 'C');

const ExamAnalyticsPanel = ({ trials, results, activeCategory, expandedTrialId, setExpandedTrialId, setToast }) => {
    const [activeExamType, setActiveExamType] = React.useState(activeCategory || 'TYT');
    const [activeMetric, setActiveMetric] = React.useState('trend'); // trend | class | subject | konu | student
    const [analizMod, setAnalizMod] = React.useState('sinif'); // 'sinif' | 'bireysel'
    const modDegistir = (mod) => {
        setAnalizMod(mod);
        setActiveMetric(mod === 'sinif' ? 'trend' : 'student');
    };
    const [seciliOgrenciId, setSeciliOgrenciId] = React.useState(null);
    const [pdfLoading, setPdfLoading] = React.useState(false);
    const [cozumSecim, setCozumSecim] = React.useState('toplu'); // 'toplu' | sonuç id
    const [acikDers, setAcikDers] = React.useState(null);
    /* Konu sekmesindeki güncel seçim (kapsam/matris/dönüt) — PDF raporunun
       kişiye özel bölümleri buradan okur. Render tetiklemesin diye ref. */
    const konuDurumu = React.useRef(null);

    React.useEffect(() => {
        if (activeCategory && EXAM_TYPES.includes(activeCategory)) setActiveExamType(activeCategory);
    }, [activeCategory]);

    const filteredTrials = [...trials.filter(t => t.examType === activeExamType)]
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    // Sonuçlar üst bileşende deneme üyeliğine göre süzülmüş geliyor (birleşik hat dahil).
    const filteredResults = results;

    const O = dersSeti(activeExamType);
    const V = [...LISTE_RENK, 'var(--c3)'];
    const subjectColors = Object.fromEntries(O.map(([label], i) => [label, V[i % V.length]]));
    const subjectLabels = O.map(([label]) => label);

    const subjAvg = (tRes, key) => {
        const vals = tRes
            .map(r => parseFloat(r[key] ?? r.subjects?.[key]?.net ?? r.subjects?.[key] ?? 0) || 0)
            .filter(v => v > 0);
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    // ── Deneme trendi (tüm dersler sütun olarak) ──────────────────
    const trendData = filteredTrials.map(trial => {
        const tRes = filteredResults.filter(r => String(r.trialId) === String(trial.id));
        const avg = tRes.length > 0 ? tRes.reduce((a, r) => a + getTotalNet(r), 0) / tRes.length : 0;
        const row = {
            name: trial.name.length > 14 ? trial.name.slice(0, 14) + '…' : trial.name,
            tarih: trial.date ? new Date(trial.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '',
            'Ort. Net': parseFloat(avg.toFixed(1)),
            katilimci: tRes.length,
        };
        O.forEach(([label, key]) => { row[label] = parseFloat(subjAvg(tRes, key).toFixed(1)); });
        return row;
    });

    // ── Sınıf/şube eşleme (yalnız PDF "Sinif Karsilastirma" bölümünde) ──
    const students = listeOku('coach_students');
    const normName = (s) => String(s || '').toLowerCase()
        .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ö/g, 'o').replace(/Ö/g, 'o')
        .replace(/ü/g, 'u').replace(/Ü/g, 'u').replace(/ş/g, 's').replace(/Ş/g, 's')
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'g').replace(/ç/g, 'c').replace(/Ç/g, 'c').trim();
    const getStudentClass = (studentName) => {
        const nName = normName(studentName);
        const found = students.find(s => {
            const sn = normName(s.name);
            return sn === nName || sn.includes(nName.split(' ')[0]) || nName.includes(sn.split(' ')[0]);
        });
        if (!found) return null;
        const grade = found.grade || '';
        const section = found.section || '';
        if (grade && section) return `${grade}/${section}`;
        return grade || null;
    };
    const classMap = {};
    filteredResults.forEach(r => {
        const cls = getStudentClass(r.student) || r.gradeLevel || 'Bilinmiyor';
        if (!classMap[cls]) classMap[cls] = [];
        classMap[cls].push(getTotalNet(r));
    });
    const classColors = ['var(--info)', 'var(--ok)', 'var(--c4)', 'var(--c5)', 'var(--warn)', 'var(--info)', 'var(--c2)'];
    const classData = Object.entries(classMap).map(([cls, nets], i) => ({
        name: cls,
        ortalama: parseFloat((nets.reduce((a, b) => a + b, 0) / nets.length).toFixed(1)),
        max: parseFloat(Math.max(...nets).toFixed(1)),
        sayi: nets.length,
        renk: classColors[i % classColors.length],
    })).sort((a, b) => a.name.localeCompare(b.name, 'tr'));

    // ── Öğrenci bazlı istatistik (Karşılaştırma + Öğrenci Bazında) ──
    const ogrenciMap = new Map();
    filteredResults.forEach(r => {
        const key = String(r.studentId ?? r.student ?? '');
        if (!key) return;
        if (!ogrenciMap.has(key)) ogrenciMap.set(key, { id: key, name: r.student || 'Öğrenci', sonuclar: [] });
        ogrenciMap.get(key).sonuclar.push(r);
    });
    const ogrenciListesi = [...ogrenciMap.values()].map(o => {
        const sonuclar = [...o.sonuclar].sort((a, b) => new Date(a.date || a.examDate || 0) - new Date(b.date || b.examDate || 0));
        const nets = sonuclar.map(getTotalNet);
        const avg = nets.length ? nets.reduce((a, b) => a + b, 0) / nets.length : 0;
        return {
            ...o, sonuclar,
            avg: +avg.toFixed(1),
            last: nets.length ? +nets[nets.length - 1].toFixed(1) : 0,
            best: nets.length ? +Math.max(...nets).toFixed(1) : 0,
            examCount: nets.length,
        };
    }).sort((a, b) => b.avg - a.avg);

    const kiyasRenk = ['var(--c1)', 'var(--ok)', 'var(--warn)', 'var(--c5)', 'var(--info)', 'var(--brand)', 'var(--c4)'];
    const ogrenciKiyas = ogrenciListesi.map((o, i) => {
        const parcalar = o.name.split(' ');
        return {
            ad: parcalar[0] + (parcalar[1] ? ' ' + parcalar[1][0] + '.' : ''),
            ortalama: o.avg, max: o.best,
            renk: kiyasRenk[i % kiyasRenk.length],
        };
    });

    // ── Ders son durumu (ilk deneme → son deneme değişimi) ─────────
    const dersSonDurum = (() => {
        const ilk = filteredTrials[0];
        const son = filteredTrials[filteredTrials.length - 1];
        const ortOku = (trial, key) => {
            if (!trial) return null;
            const vals = filteredResults
                .filter(r => String(r.trialId) === String(trial.id))
                .map(r => Number(r.subjects?.[key]?.net ?? r.subjects?.[key] ?? 0))
                .filter(v => v > 0);
            return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
        };
        return O.map(([label, key], i) => {
            const ilkOrt = ortOku(ilk, key);
            const sonOrt = ortOku(son, key);
            return {
                ders: label,
                son: sonOrt ?? 0,
                delta: ilkOrt != null && sonOrt != null ? +(sonOrt - ilkOrt).toFixed(1) : null,
                renk: PANEL_RENK[i % PANEL_RENK.length],
            };
        }).filter(d => d.son > 0).sort((a, b) => b.son - a.son);
    })();

    // ── Öğrenci Bazında görünümü ───────────────────────────────────
    const seciliId = seciliOgrenciId != null && ogrenciListesi.some(o => o.id === seciliOgrenciId)
        ? seciliOgrenciId
        : ogrenciListesi[0]?.id ?? null;
    const seciliOgrenci = ogrenciListesi.find(o => o.id === seciliId) || null;

    const netGelisimi = filteredTrials.map(trial => {
        const kendi = seciliOgrenci?.sonuclar.find(r => String(r.trialId) === String(trial.id));
        const tRes = filteredResults.filter(r => String(r.trialId) === String(trial.id));
        const sinifOrt = tRes.length ? tRes.reduce((a, r) => a + getTotalNet(r), 0) / tRes.length : null;
        return {
            id: trial.id,
            aktif: expandedTrialId != null && String(expandedTrialId) === String(trial.id),
            name: trial.name.length > 12 ? trial.name.slice(0, 12) + '…' : trial.name,
            'Öğrenci': kendi ? +getTotalNet(kendi).toFixed(1) : null,
            'Sınıf Ort.': sinifOrt != null ? +sinifOrt.toFixed(1) : null,
        };
    });

    const seciliDeneme = expandedTrialId
        ? seciliOgrenci?.sonuclar.find(r => String(r.trialId) === String(expandedTrialId))
        : null;
    const kirilimSonuc = seciliDeneme || seciliOgrenci?.sonuclar[seciliOgrenci.sonuclar.length - 1];
    const kirilimBaslik = seciliDeneme
        ? `${seciliDeneme.examName || 'Seçili deneme'} — Ders Kırılımı`
        : 'Son Denemede Güçlü / Zayıf Dersler';
    const dersNetleri = (() => {
        if (!kirilimSonuc?.subjects) return [];
        const subs = kirilimSonuc.subjects;
        const oku = (...keys) => {
            for (const k of keys) {
                const v = subs[k]?.net ?? subs[k];
                if (v != null) return +Number(v).toFixed(1);
            }
            return 0;
        };
        return O.map(([label, key], i) => ({ ders: label, net: oku(key), renk: PANEL_RENK[i % PANEL_RENK.length] }))
            .filter(d => d.net > 0).sort((a, b) => b.net - a.net);
    })();

    // ── Çözüm davranışı (uygulama-içi motor istatistiği) ──────────
    const cozumDetay = (sonuc) => {
        const ist = sonuc.istatistik || {};
        const dersSureBar = Object.entries(ist.dersSureMs || {})
            .map(([ders, ms], i) => ({ ders: DERS_AD[ders] || ders, dk: +((Number(ms) || 0) / 60000).toFixed(1), renk: PANEL_RENK[i % PANEL_RENK.length] }))
            .filter(d => d.dk > 0).sort((a, b) => b.dk - a.dk);
        const hataSayaci = {};
        (Array.isArray(ist.yanlisSorular) ? ist.yanlisSorular : []).forEach(s => {
            const d = s.ders || 'diğer';
            hataSayaci[d] = (hataSayaci[d] || 0) + 1;
        });
        const hataDersDagilim = Object.entries(hataSayaci)
            .map(([ders, adet]) => ({ ders: DERS_AD[ders] || ders, adet }))
            .sort((a, b) => b.adet - a.adet);
        const konuGrup = {};
        (Array.isArray(ist.konular) ? ist.konular : []).forEach(k => {
            (konuGrup[k.ders] = konuGrup[k.ders] || []).push({
                konu: k.konu || '—', dogru: k.dogru ?? 0, yanlis: k.yanlis ?? 0, bos: k.bos ?? 0,
                net: k.net ?? 0, dk: +((Number(k.sureMs) || 0) / 60000).toFixed(1),
            });
        });
        const sureler = ist.dersSureMs || {};
        const dersDetay = Object.entries(sonuc.subjects || {}).map(([key, v]) => {
            const dogru = Number(v?.d) || 0, yanlis = Number(v?.y) || 0, bos = Number(v?.b) || 0;
            const net = Number(v?.net) || 0;
            const dk = +((Number(sureler[key]) || 0) / 60000).toFixed(1);
            return { dersKey: key, ders: DERS_AD[key] || key, dogru, yanlis, bos, net, dk, konular: konuGrup[key] || [] };
        }).filter(d => d.dogru + d.yanlis + d.bos > 0 || d.net !== 0 || d.dk > 0)
            .sort((a, b) => b.net - a.net)
            .map((d, i) => ({ ...d, renk: PANEL_RENK[i % PANEL_RENK.length] }));
        return {
            id: sonuc.id,
            ad: sonuc.examName || 'Deneme',
            tarih: sonuc.date || null,
            net: +getTotalNet(sonuc).toFixed(1),
            ilkDers: ist.ilkDers || '—',
            sureDk: ist.toplamSureDk ?? 0,
            ortSaniye: ist.ortSoruSaniye ?? 0,
            degisim: ist.toplamDegisim ?? 0,
            enUzunSoru: ist.enUzunSoru || null,
            hataAdet: (ist.yanlisSorular || []).length,
            dersSureBar, hataDersDagilim, dersDetay,
        };
    };
    const motorGecmis = (seciliOgrenci?.sonuclar || []).filter(r => r?.istatistik)
        .slice().sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
        .map((r, i) => ({ ...cozumDetay(r), sira: i + 1 }));
    const cozumVar = motorGecmis.length > 0;
    const seciliCozum = cozumSecim !== 'toplu' && motorGecmis.find(m => m.id === cozumSecim)
        ? motorGecmis.find(m => m.id === cozumSecim)
        : motorGecmis[motorGecmis.length - 1];
    const topluKiyas = motorGecmis.map(m => ({
        name: m.ad.length > 12 ? m.ad.slice(0, 12) + '…' : m.ad,
        Net: m.net, 'Süre (dk)': m.sureDk, 'Ort. Soru (sn)': m.ortSaniye, 'Değişim': m.degisim, Hata: m.hataAdet,
    }));
    const denemeListesi = filteredTrials.map((trial, i) => {
        const tRes = filteredResults.filter(r => String(r.trialId) === String(trial.id));
        const ort = tRes.length ? tRes.reduce((a, r) => a + getTotalNet(r), 0) / tRes.length : 0;
        return {
            id: trial.id, no: i + 1, ad: trial.name, tur: trial.examType,
            ort: +ort.toFixed(1), katilimci: tRes.length,
            renk: LISTE_RENK[i % LISTE_RENK.length],
        };
    });

    // ── PDF raporu ─────────────────────────────────────────────────
    const handlePDFExport = async () => {
        setPdfLoading(true);
        try {
            const { jsPDF } = await import('jspdf');
            await import('jspdf-autotable');
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            const a = pdfAscii;
            const bugun = a(new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }));

            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(a(`${activeExamType} - Deneme Analiz Raporu`), 14, 18);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(120);
            doc.text(`Rapor tarihi: ${bugun}`, 14, 25);
            doc.setTextColor(0);

            const nets = filteredResults.map(r => getTotalNet(r)).filter(n => Number.isFinite(n));
            const ortNet = nets.length ? nets.reduce((x, y) => x + y, 0) / nets.length : 0;
            const ogrSayi = new Set(filteredResults.map(r => String(r.studentId ?? r.student ?? ''))).size;
            const ozet = [
                ['Deneme sayisi', String(filteredTrials.length)],
                ['Ogrenci sayisi', String(ogrSayi)],
                ['Toplam sonuc', String(filteredResults.length)],
                ['Sinif ort. net', ortNet.toFixed(1)],
                ['En yuksek net', (nets.length ? Math.max(...nets) : 0).toFixed(1)],
                ['En dusuk net', (nets.length ? Math.min(...nets) : 0).toFixed(1)],
            ];
            doc.autoTable({
                body: ozet, startY: 30, theme: 'plain',
                styles: { fontSize: 9, cellPadding: 1.5 },
                columnStyles: { 0: { fontStyle: 'bold', textColor: [90, 90, 90] }, 1: { fontStyle: 'bold' } },
                margin: { left: 14 }, tableWidth: 90,
            });

            let y = doc.lastAutoTable.finalY + 8;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Deneme Bazli Gelisim Ozeti', 14, y);
            doc.autoTable({
                head: [['Deneme', 'Tarih', 'Ort. Net', ...subjectLabels.map(a), 'Katilimci']],
                body: trendData.map(row => [a(row.name), a(row.tarih), row['Ort. Net'], ...subjectLabels.map(s => row[s] ?? 0), row.katilimci]),
                startY: y + 4, styles: { fontSize: 9, cellPadding: 2 }, headStyles: { fillColor: [99, 102, 241] },
            });

            if (ogrenciListesi.length > 0) {
                const y2 = doc.lastAutoTable.finalY + 10;
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text('Ogrenci Ozeti', 14, y2);
                const satirlar = [...ogrenciListesi].sort((x, z) => (z.last ?? z.avg ?? 0) - (x.last ?? x.avg ?? 0)).map(o => {
                    const netler = (o.sonuclar || []).map(getTotalNet).filter(n => Number.isFinite(n));
                    const ilk = netler[0];
                    const son = netler[netler.length - 1];
                    const fark = ilk != null && son != null ? son - ilk : null;
                    const ort = netler.length ? netler.reduce((x, z) => x + z, 0) / netler.length : 0;
                    return [a(o.name), String(netler.length), ort.toFixed(1), (son ?? 0).toFixed(1), fark == null ? '-' : `${fark > 0 ? '+' : ''}${fark.toFixed(1)}`];
                });
                doc.autoTable({
                    head: [['Ogrenci', 'Deneme', 'Ort. Net', 'Son Net', 'Degisim']],
                    body: satirlar, startY: y2 + 5,
                    styles: { fontSize: 9, cellPadding: 2 }, headStyles: { fillColor: [217, 119, 6] },
                });
            }

            if (classData.length > 0) {
                const y3 = doc.lastAutoTable.finalY + 10;
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text('Sinif Karsilastirma', 14, y3);
                doc.autoTable({
                    head: [['Sinif', 'Ort. Net', 'En Yuksek', 'Ogrenci Sayisi']],
                    body: classData.map(d => [a(d.name), d.ortalama, d.max, d.sayi]),
                    startY: y3 + 5, styles: { fontSize: 9, cellPadding: 2 }, headStyles: { fillColor: [16, 185, 129] },
                });
            }

            // Konu dağılımı (sınıf geneli) — motor istatistiği taşıyan sonuçlardan
            const konuToplam = new Map();
            filteredResults.forEach(r => {
                const konular = r?.istatistik?.konular;
                if (!Array.isArray(konular)) return;
                konular.forEach(k => {
                    const ders = DERS_AD[k.ders] || k.ders || 'Diğer';
                    const konu = (k.konu && String(k.konu).trim()) || '—';
                    if (konu === '—') return;
                    const anahtar = `${ders}||${konu}`;
                    const kayit = konuToplam.get(anahtar) || { ders, konu, dogru: 0, yanlis: 0, bos: 0 };
                    kayit.dogru += Number(k.dogru) || 0;
                    kayit.yanlis += Number(k.yanlis) || 0;
                    kayit.bos += Number(k.bos) || 0;
                    konuToplam.set(anahtar, kayit);
                });
            });
            if (konuToplam.size > 0) {
                const y4 = doc.lastAutoTable.finalY + 10;
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text('Konu Dagilimi (Sinif Geneli)', 14, y4);
                const konuSatir = [...konuToplam.values()]
                    .sort((x, z) => z.yanlis - x.yanlis)
                    .map(k => {
                        const cevapli = k.dogru + k.yanlis;
                        return [a(k.ders), a(k.konu), k.dogru, k.yanlis, k.bos, cevapli > 0 ? `%${Math.round(k.dogru / cevapli * 100)}` : '-'];
                    });
                doc.autoTable({
                    head: [['Ders', 'Konu', 'D', 'Y', 'B', 'Isabet']],
                    body: konuSatir, startY: y4 + 5,
                    styles: { fontSize: 8, cellPadding: 1.5 }, headStyles: { fillColor: [168, 85, 247] },
                });
            }

            /* Kişiye özel bölüm — Konu Dağılımı sekmesinde bir öğrenci
               seçiliyken: KONU × DENEME isabet matrisi + koç dönütü. */
            const konu = konuDurumu.current;
            if (konu && konu.kapsam !== 'sinif' && konu.matris?.varMi) {
                let yKisi = doc.lastAutoTable.finalY + 10;
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text(a(`Konu Gelisimi - ${konu.ogrenciAdi || 'Ogrenci'}`), 14, yKisi);
                doc.autoTable({
                    head: [['Konu', ...konu.matris.denemeler.map((d, i) => `D${i + 1}`), 'Trend']],
                    body: konu.matris.satirlar.map((s) => [
                        a(`${s.ders} - ${s.konu}`),
                        ...s.seri.map((v) => (v != null ? `%${v}` : '-')),
                        s.trend == null ? '-' : `${s.trend > 0 ? '+' : ''}${s.trend}`,
                    ]),
                    startY: yKisi + 5,
                    styles: { fontSize: 8, cellPadding: 1.5 },
                    headStyles: { fillColor: [59, 130, 246] },
                });
                if (konu.donutMetin?.trim()) {
                    yKisi = doc.lastAutoTable.finalY + 8;
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Koc Donutu', 14, yKisi);
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'normal');
                    doc.text(doc.splitTextToSize(a(konu.donutMetin.trim()), 265), 14, yKisi + 6);
                }
            }

            doc.save(`${activeExamType}_analiz_raporu_${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (e) {
            if (setToast) setToast('PDF oluşturulamadı: ' + e.message); else bildir('PDF oluşturulamadı: ' + e.message);
        } finally {
            setPdfLoading(false);
        }
    };

    if (trials.length === 0) return null;

    const seciliStil = (renk) => ({
        color: '#fff',
        background: `linear-gradient(180deg, color-mix(in srgb, ${renk} 88%, white 12%), ${renk})`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,.35), 0 9px 20px -9px color-mix(in srgb, ${renk} 60%, transparent)`,
    });
    const pasifStil = {
        background: 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 100%, white 3%), var(--surface))',
        border: '1px solid var(--line)',
        boxShadow: 'inset 0 1px 0 var(--lit-soft), 0 4px 10px -7px rgba(var(--cast), .4)',
    };

    return (
        <div className="rounded-2xl border border-line p-5 space-y-4 kutu-3b">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                    <Activity size={18} className="text-brand" />
                    Sınav & Sınıf Analizi
                </h3>
                <div className="flex gap-2 flex-wrap">
                    {EXAM_TYPES.filter(et => trials.some(t => t.examType === et)).map(et => (
                        <button key={et} onClick={() => setActiveExamType(et)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${activeExamType === et ? 'bg-brand text-ink' : 'bg-surface-3 text-ink-2 hover:bg-surface-3'}`}>
                            {et}
                        </button>
                    ))}
                    <button
                        onClick={handlePDFExport}
                        disabled={pdfLoading}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-danger-soft text-danger hover:bg-rose-200 transition disabled:opacity-50"
                    >
                        <Download size={13} /> {pdfLoading ? 'Hazırlanıyor...' : 'PDF'}
                    </button>
                </div>
            </div>

            {/* Mod seçici: sınıf geneli ↔ bireysel */}
            <div className="flex gap-2 p-1 rounded-xl bg-surface-2 border border-line w-fit">
                <button onClick={() => modDegistir('sinif')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${analizMod === 'sinif' ? 'bg-brand text-white shadow' : 'text-ink-2 hover:text-ink'}`}>
                    📊 Sınıf Analizi
                </button>
                <button onClick={() => modDegistir('bireysel')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${analizMod === 'bireysel' ? 'bg-brand text-white shadow' : 'text-ink-2 hover:text-ink'}`}>
                    👤 Bireysel Analiz
                </button>
            </div>

            {/* Sekme seçici — moda göre */}
            <div className="flex gap-2 border-b border-line pb-3 flex-wrap">
                {(analizMod === 'sinif' ? [
                    { id: 'trend', label: '📈 Deneme Trendi' },
                    { id: 'class', label: '👥 Öğrenci Karşılaştırması' },
                    { id: 'subject', label: (activeExamType === 'AYT' || activeExamType === 'TYT+AYT') ? '📊 Puan Türleri' : '📚 Ders Gelişimi' },
                    { id: 'konu', label: '🎯 Konu Dağılımı' },
                ] : [
                    { id: 'student', label: '👤 Öğrenci Bazında' },
                    { id: 'konu', label: '🎯 Konu Dağılımı' },
                ]).map(m => (
                    <button key={m.id} onClick={() => setActiveMetric(m.id)}
                        className={`text-xs px-3 py-1 rounded-full font-semibold transition ${activeMetric === m.id ? 'bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] text-c4' : 'text-ink-3 hover:text-ink-2'}`}>
                        {m.label}
                    </button>
                ))}
            </div>

            {/* ── Konu Dağılımı (her iki modda; bireyselde matris+dönüt açılır) ── */}
            {activeMetric === 'konu' && (
                <KonuAnaliziPaneli students={students} onDurum={(d) => { konuDurumu.current = d; }} />
            )}

            {/* ── Deneme Trendi ── */}
            {activeMetric === 'trend' && (
                trendData.length > 0 ? (
                    <div>
                        {(() => {
                            const ilkOrt = trendData[0]?.['Ort. Net'] ?? 0;
                            const sonOrt = trendData[trendData.length - 1]?.['Ort. Net'] ?? 0;
                            const degisim = +(sonOrt - ilkOrt).toFixed(1);
                            const kutular = [
                                { et: 'Son Ortalama', d: sonOrt, birim: 'net', renk: 'var(--c4)' },
                                { et: 'Değişim', d: degisim >= 0 ? `+${degisim}` : `${degisim}`, birim: 'net', renk: degisim >= 0 ? 'var(--ok)' : 'var(--danger)' },
                                { et: 'En Yüksek Deneme', d: Math.max(...trendData.map((r) => r['Ort. Net'] || 0)), birim: 'net', renk: 'var(--brand)' },
                                { et: 'Toplam Sonuç', d: trendData.reduce((t, r) => t + (r.katilimci || 0), 0), birim: 'kayıt', renk: 'var(--info)' },
                            ];
                            return (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                                    {kutular.map((k) => (
                                        <div key={k.et} className="rounded-xl p-2.5 kutu-3b border border-line">
                                            <p className="text-[9px] font-black uppercase tracking-wider text-ink-3">{k.et}</p>
                                            <p className="text-lg font-black tabular-nums leading-none mt-0.5" style={{ color: k.renk }}>
                                                {k.d}<span className="text-[10px] font-bold text-ink-3 ml-1">{k.birim}</span>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                        <p className="text-xs text-ink-3 mb-2">{activeExamType} − sınıf net ortalamasının denemeler boyunca seyri (ders kırılımı için "Ders Gelişimi" sekmesi).</p>
                        <div className="h-56 rounded-2xl p-3 kutu-3b">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData} margin={{ top: 10, right: 12, bottom: 0, left: -10 }}>
                                    <defs>
                                        <linearGradient id="trendAlan" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--c4)" stopOpacity={0.45} />
                                            <stop offset="100%" stopColor="var(--c4)" stopOpacity={0} />
                                        </linearGradient>
                                        <filter id="trendCizgiGolge" x="-10%" y="-20%" width="120%" height="150%">
                                            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.22" />
                                        </filter>
                                    </defs>
                                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--line)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--ink-3)' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--ink-3)' }} width={34} />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: 14, border: '1px solid var(--line)', background: 'var(--surface)', boxShadow: '0 14px 34px -14px rgba(0,0,0,.45)', fontSize: 12, color: 'var(--ink)' }}
                                        labelStyle={{ color: 'var(--ink-2)', fontWeight: 800 }}
                                        formatter={(v) => [`${v} net`, 'Sınıf ort.']}
                                        labelFormatter={(l, payload) => `${l} · ${payload?.[0]?.payload?.katilimci ?? 0} kayıt`}
                                    />
                                    <Area type="monotone" dataKey="Ort. Net" stroke="var(--c4)" strokeWidth={3}
                                        filter="url(#trendCizgiGolge)" fill="url(#trendAlan)"
                                        dot={{ r: 4, fill: 'var(--surface)', stroke: 'var(--c4)', strokeWidth: 2 }}
                                        activeDot={{ r: 6, strokeWidth: 0 }} animationDuration={350} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Tablo */}
                        <div className="mt-3 overflow-x-auto">
                            <table className="min-w-full text-xs">
                                <thead><tr className="bg-surface-2 border-b border-line">
                                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-3">Deneme</th>
                                    <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-3">Tarih</th>
                                    <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-c4">Ort. Net</th>
                                    {subjectLabels.map(s => (
                                        <th key={s} className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider" style={{ color: subjectColors[s] || 'var(--ink-3)' }}>{s}</th>
                                    ))}
                                    <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-3">Katılımcı</th>
                                </tr></thead>
                                <tbody className="divide-y divide-line-subtle">
                                    {trendData.map((row, i) => (
                                        <tr key={i} className="hover:bg-surface-2">
                                            <td className="px-3 py-2 font-medium text-ink-2 max-w-[140px] truncate">{row.name}</td>
                                            <td className="px-3 py-2 text-center text-ink-3">{row.tarih}</td>
                                            <td className="px-3 py-2 text-center font-black text-c4">{row['Ort. Net']}</td>
                                            {subjectLabels.map(s => (
                                                <td key={s} className="px-3 py-2 text-center font-semibold" style={{ color: subjectColors[s] || 'var(--ink-3)' }}>{row[s]}</td>
                                            ))}
                                            <td className="px-3 py-2 text-center text-ink-3">{row.katilimci} kişi</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-ink-3 text-center py-6">{activeExamType} türünde henüz deneme yüklenmedi.</p>
                )
            )}

            {/* ── Öğrenci Karşılaştırması ── */}
            {activeMetric === 'class' && (
                ogrenciKiyas.length > 0 ? (
                    <div>
                        <p className="text-xs text-ink-3 mb-3">{activeExamType} − öğrenci bazında net ortalaması (dolu) ve en yüksek net (kesikli çerçeve)</p>
                        <div className="h-64 rounded-2xl p-3 kutu-3b">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ogrenciKiyas} margin={{ top: 12, right: 8, bottom: 0, left: -12 }}
                                    barSize={Math.max(18, Math.min(46, 360 / Math.max(ogrenciKiyas.length, 1)))}>
                                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--line)" />
                                    <XAxis dataKey="ad" axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={52}
                                        tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--ink-2)' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--ink-3)' }} width={34} />
                                    <RechartsTooltip
                                        cursor={{ fill: 'color-mix(in srgb, var(--brand) 8%, transparent)' }}
                                        contentStyle={{ borderRadius: 14, border: '1px solid var(--line)', background: 'var(--surface)', boxShadow: '0 14px 34px -14px rgba(0,0,0,.45)', fontSize: 12, color: 'var(--ink)' }}
                                        formatter={(v, name) => [`${v} net`, name === 'ortalama' ? 'Ortalama' : 'En Yüksek']}
                                    />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                                    <Bar dataKey="ortalama" name="Ortalama" radius={[8, 8, 0, 0]} animationDuration={350}>
                                        {ogrenciKiyas.map((entry, index) => (
                                            <Cell key={index} fill={entry.renk} />
                                        ))}
                                    </Bar>
                                    <Bar dataKey="max" name="En Yüksek" radius={[4, 4, 0, 0]} fill="transparent"
                                        stroke="var(--ink-3)" strokeWidth={1.5} strokeDasharray="3 2" animationDuration={350} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-3">
                            {ogrenciKiyas.map(d => (
                                <div key={d.ad} className="rounded-xl p-3 kutu-3b border border-line">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.renk }} />
                                        <span className="text-xs font-black text-ink-2 truncate">{d.ad}</span>
                                    </div>
                                    <div className="text-lg font-black tabular-nums" style={{ color: d.renk }}>{d.ortalama}</div>
                                    <div className="text-[11px] text-ink-3">ort. • en iyi: {d.max}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-ink-3 text-center py-6">Bu sınav türünde öğrenci sonucu yok.</p>
                )
            )}

            {/* ── Ders Gelişimi ── */}
            {activeMetric === 'subject' && (
                dersSonDurum.length > 0 ? (
                    <div>
                        <p className="text-xs text-ink-3 mb-3">
                            {activeExamType} − her dersin sınıf ortalaması (en güçlü → en zayıf) ve ilk denemeye göre değişim. <span className="text-danger font-bold">Kırmızı</span> = gerileyen ders.
                        </p>
                        <div className="space-y-2">
                            {dersSonDurum.map(d => {
                                const enYuksek = Math.max(...dersSonDurum.map(x => x.son), 1);
                                const oran = Math.max(6, Math.round(d.son / enYuksek * 100));
                                return (
                                    <div key={d.ders} className="flex items-center gap-3 rounded-xl p-2.5 kutu-3b border border-line">
                                        <span className="w-16 sm:w-20 shrink-0 text-xs font-black text-ink truncate">{d.ders}</span>
                                        <div className="flex-1 h-3.5 rounded-full overflow-hidden"
                                            style={{ background: 'var(--surface-3)', boxShadow: 'inset 0 1px 2px rgba(var(--cast), .22)' }}>
                                            <div className="h-full rounded-full transition-all"
                                                style={{ width: `${oran}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${d.renk} 65%, transparent), ${d.renk})`, boxShadow: `0 0 8px -1px ${d.renk}` }} />
                                        </div>
                                        <span className="w-11 shrink-0 text-right text-sm font-black tabular-nums" style={{ color: d.renk }}>{d.son}</span>
                                        <span className="w-14 shrink-0 text-right text-[11px] font-black"
                                            style={{ color: d.delta > 0 ? 'var(--ok)' : d.delta < 0 ? 'var(--danger)' : 'var(--ink-3)' }}>
                                            {d.delta == null ? '—' : d.delta > 0 ? `▲+${d.delta}` : d.delta < 0 ? `▼${d.delta}` : '—'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Tablo — deneme × ders, önceki denemeye göre değişimle */}
                        <div className="mt-3 overflow-x-auto">
                            <table className="min-w-full text-xs">
                                <thead><tr className="bg-surface-2 border-b border-line">
                                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-3">Deneme</th>
                                    <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-3">Tarih</th>
                                    {subjectLabels.map(s => (
                                        <th key={s} className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider" style={{ color: subjectColors[s] || '#6b7280' }}>{s}</th>
                                    ))}
                                </tr></thead>
                                <tbody className="divide-y divide-line-subtle">
                                    {trendData.map((row, i, arr) => (
                                        <tr key={i} className="hover:bg-surface-2">
                                            <td className="px-3 py-2 font-medium text-ink-2 max-w-[140px] truncate">{row.name}</td>
                                            <td className="px-3 py-2 text-center text-ink-3">{row.tarih}</td>
                                            {subjectLabels.map(s => {
                                                const prev = i > 0 ? arr[i - 1][s] : null;
                                                const delta = prev !== null ? row[s] - prev : null;
                                                return (
                                                    <td key={s} className="px-3 py-2 text-center">
                                                        <span className="font-black" style={{ color: subjectColors[s] || '#6b7280' }}>{row[s]}</span>
                                                        {delta !== null && delta !== 0 && (
                                                            <span className={`ml-1 text-[10px] font-bold ${delta > 0 ? 'text-ok' : 'text-danger'}`}>
                                                                {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
                                                            </span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-ink-3 text-center py-6">Ders verisi bulunamadı.</p>
                )
            )}

            {/* ── Öğrenci Bazında ── */}
            {activeMetric === 'student' && (
                ogrenciListesi.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Sol: deneme + öğrenci listeleri */}
                        <div className="lg:col-span-1 space-y-1.5 lg:max-h-[560px] lg:overflow-y-auto pr-1 tek-ekran-govde">
                            <p className="text-[11px] font-black uppercase tracking-wider text-ink-3 px-1 mb-1">Denemeler · sınıf ort.</p>
                            {denemeListesi.map(d => {
                                const aktif = expandedTrialId === d.id;
                                return (
                                    <button key={d.id} type="button" onClick={() => setExpandedTrialId?.(aktif ? null : d.id)} aria-pressed={aktif}
                                        className="w-full text-left rounded-xl pl-2.5 pr-3 py-2.5 flex items-center gap-2.5 transition-all hover:-translate-y-px kutu-3b-hover"
                                        style={aktif ? seciliStil(d.renk) : pasifStil}>
                                        <span className="w-1.5 self-stretch rounded-full shrink-0" style={{ background: aktif ? 'rgba(255,255,255,.55)' : d.renk }} />
                                        <span className="grid place-items-center w-7 h-7 rounded-lg text-xs font-black shrink-0"
                                            style={aktif ? { background: 'rgba(255,255,255,.22)', color: '#fff' } : { background: `color-mix(in srgb, ${d.renk} 15%, var(--surface))`, color: d.renk }}>
                                            {d.no}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-bold truncate" style={{ color: aktif ? '#fff' : 'var(--ink)' }}>{d.ad}</span>
                                            <span className="block text-[10px]" style={{ color: aktif ? 'rgba(255,255,255,.82)' : 'var(--ink-3)' }}>{d.tur} · {d.katilimci} öğrenci</span>
                                        </span>
                                        <span className="text-lg font-black tabular-nums shrink-0" style={{ color: aktif ? '#fff' : d.renk }}>{d.ort}</span>
                                    </button>
                                );
                            })}
                            <p className="text-[11px] font-black uppercase tracking-wider text-ink-3 px-1 mb-1 mt-3">Öğrenciler · net ort.</p>
                            {ogrenciListesi.map((o, i) => {
                                const aktif = o.id === seciliId;
                                const renk = LISTE_RENK[i % LISTE_RENK.length];
                                return (
                                    <button key={o.id} type="button" onClick={() => setSeciliOgrenciId(o.id)} aria-pressed={aktif}
                                        className="w-full text-left rounded-xl pl-2.5 pr-3 py-2.5 flex items-center gap-2.5 transition-all hover:-translate-y-px kutu-3b-hover"
                                        style={aktif ? seciliStil(renk) : pasifStil}>
                                        <span className="w-1.5 self-stretch rounded-full shrink-0" style={{ background: aktif ? 'rgba(255,255,255,.55)' : renk }} />
                                        <span className="grid place-items-center w-7 h-7 rounded-lg text-xs font-black shrink-0"
                                            style={aktif ? { background: 'rgba(255,255,255,.22)', color: '#fff' } : { background: `color-mix(in srgb, ${renk} 15%, var(--surface))`, color: renk }}>
                                            {i + 1}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-bold truncate" style={{ color: aktif ? '#fff' : 'var(--ink)' }}>{o.name}</span>
                                            <span className="block text-[10px]" style={{ color: aktif ? 'rgba(255,255,255,.82)' : 'var(--ink-3)' }}>{o.examCount} deneme · son {o.last}</span>
                                        </span>
                                        <span className="text-lg font-black tabular-nums shrink-0" style={{ color: aktif ? '#fff' : renk }}>{o.avg}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Sağ: grafikler + çözüm davranışı */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* Net Gelişimi */}
                            <div className="rounded-2xl p-4 kutu-3b">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                    <h4 className="text-sm font-black text-ink truncate">{seciliOgrenci?.name} — Net Gelişimi</h4>
                                    <span className="text-[11px] text-ink-3 shrink-0">{activeExamType} · {seciliOgrenci?.examCount} deneme</span>
                                </div>
                                <p className="text-[11px] text-ink-3 mb-2 leading-snug">Mor çizgi öğrenci, kesikli çizgi sınıf ortalaması — öğrenci sınıfın üstünde mi altında mı bir bakışta görünür.</p>
                                <div className="h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={netGelisimi} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                                            <defs>
                                                <filter id="ogrGolge" x="-10%" y="-20%" width="120%" height="150%">
                                                    <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.25" />
                                                </filter>
                                            </defs>
                                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--line)" />
                                            <XAxis dataKey="name" axisLine={{ stroke: 'var(--line)' }} tickLine={false} tick={{ fontSize: 10, fill: 'var(--ink-3)' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--ink-3)' }} width={38} />
                                            <RechartsTooltip
                                                contentStyle={{ borderRadius: 14, border: '1px solid var(--line)', background: 'var(--surface)', boxShadow: '0 14px 34px -14px rgba(0,0,0,.45)', fontSize: 12, color: 'var(--ink)' }}
                                                labelStyle={{ color: 'var(--ink-2)', fontWeight: 800 }}
                                                formatter={(v, name) => [`${v} net`, name]}
                                            />
                                            <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                                            <Line type="monotone" dataKey="Öğrenci" stroke="var(--brand)" strokeWidth={3}
                                                filter="url(#ogrGolge)" connectNulls
                                                dot={(props) => {
                                                    const { cx, cy, payload } = props;
                                                    if (cx == null || cy == null) return null;
                                                    const aktif = payload?.aktif;
                                                    return <circle key={payload?.id || cx} cx={cx} cy={cy} r={aktif ? 7 : 4}
                                                        fill={aktif ? 'var(--brand)' : 'var(--surface)'} stroke="var(--brand)" strokeWidth={aktif ? 3 : 2} />;
                                                }}
                                                activeDot={{ r: 6, strokeWidth: 0 }} animationDuration={350} />
                                            <Line type="monotone" dataKey="Sınıf Ort." stroke="var(--ink-3)" strokeWidth={2}
                                                strokeDasharray="5 4" connectNulls dot={false} animationDuration={350} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Ders kırılımı — son/seçili deneme */}
                            <div className="rounded-2xl p-4 kutu-3b">
                                <h4 className="text-sm font-black text-ink mb-0.5">{kirilimBaslik}</h4>
                                <p className="text-[11px] text-ink-3 mb-2 leading-snug">
                                    {seciliDeneme ? 'Seçili denemedeki' : 'Son denemedeki'} net'ler en yüksekten en düşüğe — en alttaki dersler öncelikli çalışma hedefi.
                                </p>
                                {dersNetleri.length > 0 ? (
                                    <div style={{ height: Math.max(160, 28 * dersNetleri.length + 16) }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={dersNetleri} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 4 }} barCategoryGap="24%">
                                                <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="var(--line)" />
                                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--ink-3)' }} />
                                                <YAxis type="category" dataKey="ders" width={80} axisLine={false} tickLine={false}
                                                    tick={{ fontSize: 10.5, fontWeight: 700, fill: 'var(--ink-2)' }} />
                                                <RechartsTooltip
                                                    cursor={{ fill: 'color-mix(in srgb, var(--brand) 8%, transparent)' }}
                                                    contentStyle={{ borderRadius: 14, border: '1px solid var(--line)', background: 'var(--surface)', boxShadow: '0 14px 34px -14px rgba(0,0,0,.45)', fontSize: 12, color: 'var(--ink)' }}
                                                    formatter={(v) => [`${v} net`, 'Net']}
                                                />
                                                <Bar dataKey="net" radius={[0, 8, 8, 0]} maxBarSize={22} animationDuration={350}
                                                    label={{ position: 'right', fontSize: 10.5, fontWeight: 800, fill: 'var(--ink-2)' }}>
                                                    {dersNetleri.map((entry, index) => (
                                                        <Cell key={index} fill={entry.renk} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <p className="text-xs text-ink-3 text-center py-8">Bu öğrencinin son denemesinde ders kırılımı verisi yok.</p>
                                )}
                            </div>

                            {/* Çözüm Davranışı — uygulama-içi motor istatistiği */}
                            {cozumVar && (() => {
                                const cipSecili = {
                                    color: '#fff',
                                    background: 'linear-gradient(180deg, color-mix(in srgb, var(--c4) 88%, white 12%), var(--c4))',
                                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3), 0 7px 16px -8px color-mix(in srgb, var(--c4) 60%, transparent)',
                                };
                                const cipPasif = {
                                    background: 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 100%, white 3%), var(--surface))',
                                    border: '1px solid var(--line)', color: 'var(--ink-2)',
                                    boxShadow: 'inset 0 1px 0 var(--lit-soft), 0 3px 8px -6px rgba(var(--cast), .4)',
                                };
                                const topluMu = cozumSecim === 'toplu';
                                return (
                                    <div className="rounded-2xl p-4 kutu-3b">
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <h4 className="text-sm font-black text-ink flex items-center gap-1.5">
                                                <Activity size={15} className="text-c4" /> Çözüm Davranışı
                                            </h4>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                style={{ background: 'color-mix(in srgb, var(--c4) 16%, var(--surface))', color: 'var(--c4)' }}>
                                                Uygulama-içi · {motorGecmis.length} deneme
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            <button type="button" onClick={() => setCozumSecim('toplu')} aria-pressed={topluMu}
                                                className="text-[11px] font-black px-2.5 py-1.5 rounded-lg transition-all hover:-translate-y-px"
                                                style={topluMu ? cipSecili : cipPasif}>
                                                📊 Toplu Kıyas
                                            </button>
                                            {motorGecmis.map(m => {
                                                const aktif = !topluMu && seciliCozum?.id === m.id;
                                                return (
                                                    <button key={m.id} type="button" onClick={() => setCozumSecim(m.id)} aria-pressed={aktif}
                                                        className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all hover:-translate-y-px"
                                                        style={aktif ? cipSecili : cipPasif}>
                                                        {m.sira}. {m.ad.length > 16 ? m.ad.slice(0, 16) + '…' : m.ad}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {topluMu ? (motorGecmis.length > 1 ? (
                                            <div className="space-y-3">
                                                <p className="text-[11px] text-ink-3 leading-snug">Öğrencinin uygulama-içi tüm denemelerinin çözüm davranışı yan yana — net ve tempo (soru başına süre) denemeden denemeye nasıl değişmiş.</p>
                                                <div className="h-52">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={topluKiyas} margin={{ top: 8, right: 6, bottom: 0, left: -14 }}>
                                                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--line)" />
                                                            <XAxis dataKey="name" axisLine={{ stroke: 'var(--line)' }} tickLine={false} tick={{ fontSize: 9.5, fill: 'var(--ink-3)' }} />
                                                            <YAxis yAxisId="net" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--brand)' }} width={34} />
                                                            <YAxis yAxisId="sn" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--warn)' }} width={34} />
                                                            <RechartsTooltip
                                                                contentStyle={{ borderRadius: 14, border: '1px solid var(--line)', background: 'var(--surface)', boxShadow: '0 14px 34px -14px rgba(0,0,0,.45)', fontSize: 12, color: 'var(--ink)' }}
                                                                labelStyle={{ color: 'var(--ink-2)', fontWeight: 800 }}
                                                            />
                                                            <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
                                                            <Line yAxisId="net" type="monotone" dataKey="Net" stroke="var(--brand)" strokeWidth={3}
                                                                dot={{ r: 4, fill: 'var(--surface)', stroke: 'var(--brand)', strokeWidth: 2 }} activeDot={{ r: 6 }} animationDuration={350} />
                                                            <Line yAxisId="sn" type="monotone" dataKey="Ort. Soru (sn)" stroke="var(--warn)" strokeWidth={2.5}
                                                                strokeDasharray="5 4" dot={{ r: 3, fill: 'var(--warn)' }} animationDuration={350} />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full text-xs liste-3b">
                                                        <thead><tr className="text-[10px] uppercase tracking-wider text-ink-3">
                                                            <th className="px-2 py-1.5 text-left">Deneme</th>
                                                            <th className="px-2 py-1.5 text-center text-brand">Net</th>
                                                            <th className="px-2 py-1.5 text-center text-info">Süre dk</th>
                                                            <th className="px-2 py-1.5 text-center text-warn">Ort.Soru sn</th>
                                                            <th className="px-2 py-1.5 text-center text-c5">Değişim</th>
                                                            <th className="px-2 py-1.5 text-center text-danger">Hata</th>
                                                        </tr></thead>
                                                        <tbody>
                                                            {motorGecmis.map((m, i) => {
                                                                const onceki = motorGecmis[i - 1];
                                                                const fark = onceki ? +(m.net - onceki.net).toFixed(1) : null;
                                                                return (
                                                                    <tr key={m.id}>
                                                                        <td className="px-2 py-1.5 font-bold text-ink-2 max-w-[130px] truncate">{m.sira}. {m.ad}</td>
                                                                        <td className="px-2 py-1.5 text-center font-black text-brand">
                                                                            {m.net}
                                                                            {fark != null && fark !== 0 && (
                                                                                <span className={fark > 0 ? 'text-ok' : 'text-danger'}> {fark > 0 ? '▲' : '▼'}{Math.abs(fark)}</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-2 py-1.5 text-center text-ink-2">{m.sureDk}</td>
                                                                        <td className="px-2 py-1.5 text-center text-ink-2">{m.ortSaniye}</td>
                                                                        <td className="px-2 py-1.5 text-center text-ink-2">{m.degisim}</td>
                                                                        <td className="px-2 py-1.5 text-center font-bold text-danger">{m.hataAdet}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-ink-3 text-center py-6">Kıyas için en az 2 uygulama-içi deneme gerekli. Tek denemeyi görmek için üstteki çipe tıkla.</p>
                                        )) : seciliCozum && (
                                            <div>
                                                <p className="text-[11px] text-ink-3 mb-2.5 leading-snug">
                                                    <b className="text-ink-2">{seciliCozum.ad}</b> · {seciliCozum.tarih ? new Date(seciliCozum.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : ''} — sistem çözerken otomatik topladı.
                                                </p>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                                                    {[
                                                        { I: BookOpen, et: 'İlk Ders', d: seciliCozum.ilkDers, c: 'var(--c1)' },
                                                        { I: Clock, et: 'Toplam Süre', d: `${seciliCozum.sureDk} dk`, c: 'var(--info)' },
                                                        { I: Timer, et: 'Ort. Soru', d: `${seciliCozum.ortSaniye} sn`, c: 'var(--ok)' },
                                                        { I: RefreshCw, et: 'Cevap Değişimi', d: `${seciliCozum.degisim}`, c: 'var(--warn)' },
                                                    ].map(({ I, et, d, c }) => (
                                                        <div key={et} className="rounded-xl px-2.5 py-2 text-center kutu-3b"
                                                            style={{ background: `color-mix(in srgb, ${c} 10%, var(--surface))` }}>
                                                            <I size={14} className="mx-auto mb-1" style={{ color: c }} />
                                                            <div className="text-[9px] font-black uppercase tracking-wide text-ink-3">{et}</div>
                                                            <div className="text-sm font-black truncate" style={{ color: c }}>{d}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                                {seciliCozum.enUzunSoru && (
                                                    <div className="rounded-xl px-3 py-2 mb-3 flex items-center gap-2 text-xs kutu-3b"
                                                        style={{ background: 'color-mix(in srgb, var(--danger) 9%, var(--surface))' }}>
                                                        <AlertTriangle size={14} className="text-danger shrink-0" />
                                                        <span className="text-ink-2">
                                                            En uzun süre: <b className="text-danger">{seciliCozum.enUzunSoru.no}. soru</b> ({seciliCozum.enUzunSoru.ders}) · {(seciliCozum.enUzunSoru.ms / 1000).toFixed(0)} sn
                                                        </span>
                                                    </div>
                                                )}
                                                {seciliCozum.hataDersDagilim.length > 0 && (
                                                    <div>
                                                        <p className="text-[11px] font-black uppercase tracking-wider text-ink-3 mb-1.5">Hata Dağılımı (ders · adet)</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {seciliCozum.hataDersDagilim.map(h => (
                                                                <span key={h.ders} className="text-[11px] font-bold px-2 py-1 rounded-lg kutu-3b"
                                                                    style={{ background: 'color-mix(in srgb, var(--danger) 10%, var(--surface))', color: 'var(--danger)' }}>
                                                                    {h.ders} <b>{h.adet}</b>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {seciliCozum.dersDetay.length > 0 && (
                                                    <div className="mt-3">
                                                        <p className="text-[11px] font-black uppercase tracking-wider text-ink-3 mb-1.5">Ders Bazında (tıkla → konular)</p>
                                                        <div className="space-y-1">
                                                            {seciliCozum.dersDetay.map(d => {
                                                                const acik = acikDers === d.dersKey;
                                                                const konuluMu = d.konular.length > 0;
                                                                return (
                                                                    <div key={d.dersKey} className="rounded-xl overflow-hidden kutu-3b">
                                                                        <button type="button" disabled={!konuluMu}
                                                                            onClick={() => setAcikDers(acik ? null : d.dersKey)}
                                                                            className={`w-full flex items-center gap-2 px-3 py-2 text-left transition ${konuluMu ? 'hover:bg-surface-2 cursor-pointer' : 'cursor-default'}`}>
                                                                            <span className="w-4 shrink-0 grid place-items-center text-ink-3">
                                                                                {konuluMu ? (acik ? <ChevronDown size={13} /> : <ChevronRight size={13} />) : null}
                                                                            </span>
                                                                            <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: d.renk }} />
                                                                            <span className="flex-1 min-w-0 text-xs font-black text-ink truncate">
                                                                                {d.ders}
                                                                                {konuluMu && <span className="ml-1.5 text-[10px] font-bold text-ink-3">· {d.konular.length} konu</span>}
                                                                            </span>
                                                                            <span className="text-[11px] tabular-nums shrink-0 flex items-center gap-2">
                                                                                <span className="text-ok font-bold">{d.dogru}D</span>
                                                                                <span className="text-danger font-bold">{d.yanlis}Y</span>
                                                                                <span className="text-ink-3">{d.bos}B</span>
                                                                                <span className="text-brand font-black w-10 text-right">{d.net} net</span>
                                                                                <span className="text-warn w-12 text-right">{d.dk} dk</span>
                                                                            </span>
                                                                        </button>
                                                                        {acik && konuluMu && (
                                                                            <div className="bg-surface-2/60 border-t border-line px-2 py-1.5">
                                                                                <table className="min-w-full text-xs">
                                                                                    <thead><tr className="text-[9px] uppercase tracking-wider text-ink-3">
                                                                                        <th className="px-2 py-1 text-left">Konu (denemede çıkan)</th>
                                                                                        <th className="px-2 py-1 text-center text-ok">D</th>
                                                                                        <th className="px-2 py-1 text-center text-danger">Y</th>
                                                                                        <th className="px-2 py-1 text-center text-ink-3">B</th>
                                                                                        <th className="px-2 py-1 text-center text-brand">Net</th>
                                                                                        <th className="px-2 py-1 text-center text-warn">dk</th>
                                                                                    </tr></thead>
                                                                                    <tbody>
                                                                                        {d.konular.map((k, ki) => (
                                                                                            <tr key={`${k.konu}-${ki}`} className="border-t border-line-subtle">
                                                                                                <td className="px-2 py-1 font-bold text-ink-2 max-w-[160px] truncate">{k.konu}</td>
                                                                                                <td className="px-2 py-1 text-center text-ok">{k.dogru}</td>
                                                                                                <td className="px-2 py-1 text-center text-danger">{k.yanlis}</td>
                                                                                                <td className="px-2 py-1 text-center text-ink-3">{k.bos}</td>
                                                                                                <td className="px-2 py-1 text-center font-black text-brand">{k.net}</td>
                                                                                                <td className="px-2 py-1 text-center text-ink-2">{k.dk}</td>
                                                                                            </tr>
                                                                                        ))}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        <p className="tip-mini text-ink-3 mt-1.5">Konusu etiketli derslerde satıra tıklayınca o denemede çıkan konular açılır.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-ink-3 text-center py-6">Bu sınav türünde öğrenci sonucu yok.</p>
                )
            )}
        </div>
    );
};






// ─── Yeni Deneme Modal ────────────────────────────────────────────────────────
const NewTrialModal = ({ onClose, onCreate, initialExamType }) => {
    const [name, setName] = useState('');
    const [examType, setExamType] = useState(initialExamType || 'TYT');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onCreate({ name: name.trim(), examType, date });
        onClose();
    };

    return (
        <Modal
            acik
            onClose={onClose}
            baslik={<span className="flex items-center"><Plus size={20} className="mr-2 text-c4" />Yeni Deneme Sınavı Oluştur</span>}
            genislik="md"
            govdeClassName="p-0"
        >
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-ink-2 mb-1.5">Deneme Adı *</label>
                    <input
                        autoFocus
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="örn: 1. Okul Denemesi, Kasım Branşman..."
                        className="w-full border border-line rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-ink"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-ink-2 mb-1.5">Sınav Türü</label>
                        <select
                            value={examType}
                            onChange={e => setExamType(e.target.value)}
                            className="w-full border border-line rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none text-ink"
                        >
                            {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            <option value="Kazanım">Kazanım Testi</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-ink-2 mb-1.5">Tarih</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full border border-line rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-ink"
                        />
                    </div>
                </div>
                <div className="pencere-alt-cubuk bg-surface flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 border border-line text-ink-2 py-3 rounded-xl font-semibold hover:bg-surface-2 transition">İptal</button>
                    <button type="submit" className="on-color flex-1 bg-gradient-to-r from-purple-600 to-brand text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition shadow-lg shadow-purple-200">
                        Deneme Oluştur
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// ─── Bireysel Sonuç Ekleme Modal ─────────────────────────────────────────────
// TYT/AYT alt ders yapısı: her ders için D / Y / Net (otomatik hesap)
const TYT_SUBJECTS = [
    { key: 'tyt_turkce', label: 'Türkçe', maxD: 40, group: 'Sözel' },
    { key: 'tyt_matematik', label: 'Matematik', maxD: 40, group: 'Sayısal' },
    { key: 'tyt_fizik', label: 'Fizik', maxD: 7, group: 'Fen' },
    { key: 'tyt_kimya', label: 'Kimya', maxD: 7, group: 'Fen' },
    { key: 'tyt_biyoloji', label: 'Biyoloji', maxD: 6, group: 'Fen' },
    { key: 'tyt_tarih', label: 'Tarih', maxD: 5, group: 'Sosyal' },
    { key: 'tyt_cografya', label: 'Coğrafya', maxD: 5, group: 'Sosyal' },
    { key: 'tyt_felsefe', label: 'Felsefe', maxD: 5, group: 'Sosyal' },
    { key: 'tyt_din', label: 'Din Kültürü', maxD: 5, group: 'Sosyal' },
];

const AYT_SUBJECTS = [
    { key: 'ayt_edebiyat', label: 'Türk Dili ve Ed.', maxD: 24, group: 'Sözel/EA' },
    { key: 'ayt_tarih1', label: 'Tarih-1', maxD: 10, group: 'Sözel/EA' },
    { key: 'ayt_cografya1', label: 'Coğrafya-1', maxD: 6, group: 'Sözel/EA' },
    { key: 'ayt_matematik', label: 'Matematik', maxD: 30, group: 'Sayısal/EA' },
    { key: 'ayt_geometri', label: 'Geometri', maxD: 10, group: 'Ortak' },
    { key: 'ayt_fizik', label: 'Fizik', maxD: 14, group: 'Sayısal' },
    { key: 'ayt_kimya', label: 'Kimya', maxD: 13, group: 'Sayısal' },
    { key: 'ayt_biyoloji', label: 'Biyoloji', maxD: 13, group: 'Sayısal' },
    { key: 'ayt_tarih2', label: 'Tarih-2', maxD: 11, group: 'Sözel' },
    { key: 'ayt_cografya2', label: 'Coğrafya-2', maxD: 11, group: 'Sözel' },
    { key: 'ayt_felsefe', label: 'Felsefe Grubu', maxD: 12, group: 'Sözel' },
    { key: 'ayt_din', label: 'Din Kültürü', maxD: 6, group: 'Sözel' },
];

const LGS_SUBJECTS = [
    { key: 'turkce', label: 'Türkçe', maxD: 20, group: 'Sözel' },
    { key: 'inkilap', label: 'İnkılap Tarihi', maxD: 10, group: 'Sözel' },
    { key: 'din', label: 'Din Kültürü', maxD: 10, group: 'Sözel' },
    { key: 'ingilizce', label: 'Yabancı Dil', maxD: 10, group: 'Sözel' },
    { key: 'mat', label: 'Matematik', maxD: 20, group: 'Sayısal' },
    { key: 'fen', label: 'Fen Bilimleri', maxD: 20, group: 'Sayısal' }
];

const KPSS_SUBJECTS = [
    { key: 'gy_turkce', label: 'Türkçe', maxD: 30, group: 'Genel Yetenek' },
    { key: 'gy_mat', label: 'Matematik', maxD: 30, group: 'Genel Yetenek' },
    { key: 'gk_tarih', label: 'Tarih', maxD: 27, group: 'Genel Kültür' },
    { key: 'gk_cografya', label: 'Coğrafya', maxD: 18, group: 'Genel Kültür' },
    { key: 'gk_vatandaslik', label: 'Vatandaşlık', maxD: 15, group: 'Genel Kültür' }
];

const YDT_SUBJECTS = [{ key: 'yabanci_dil', label: 'Yabancı Dil', maxD: 80, group: 'Dil' }];
const YDS_SUBJECTS = [{ key: 'yabanci_dil', label: 'Yabancı Dil', maxD: 80, group: 'Dil' }];

const TYT_AYT_SUBJECTS = [
    ...TYT_SUBJECTS.map(s => ({ ...s, group: 'TYT - ' + s.group })),
    ...AYT_SUBJECTS.map(s => ({ ...s, group: 'AYT - ' + s.group }))
];
const TYT_YDT_SUBJECTS = [
    ...TYT_SUBJECTS.map(s => ({ ...s, group: 'TYT - ' + s.group })),
    ...YDT_SUBJECTS.map(s => ({ ...s, group: 'YDT' }))
];

const GROUP_COLORS = {
    'Sözel': 'bg-info-soft border-info text-info',
    'Sayısal': 'bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] border-[color-mix(in_srgb,var(--c4)_35%,transparent)] text-c4',
    'Fen': 'bg-ok-soft border-ok text-ok',
    'Sosyal': 'bg-warn-soft border-warn text-warn',
    'Ortak': 'bg-surface-2 border-line text-ink-2', // Added for AYT Geometri
    'Sözel/EA': 'bg-info-soft border-info text-info',
    'Sayısal/EA': 'bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] border-[color-mix(in_srgb,var(--c4)_35%,transparent)] text-c4',
    'Genel Yetenek': 'bg-brand-soft border-brand-line text-brand',
    'Genel Kültür': 'bg-[color-mix(in_srgb,var(--c5)_14%,var(--surface))] border-[color-mix(in_srgb,var(--c5)_35%,transparent)] text-c5',
    'Dil': 'bg-danger-soft border-danger text-danger',
    'YDT': 'bg-danger-soft border-danger text-danger',
    'TYT - Sözel': 'bg-info-soft/70 border-info text-info',
    'TYT - Sayısal': 'bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))]/70 border-[color-mix(in_srgb,var(--c4)_35%,transparent)] text-c4',
    'TYT - Fen': 'bg-ok-soft/70 border-ok text-ok',
    'TYT - Sosyal': 'bg-warn-soft/70 border-warn text-warn',
    'AYT - Sözel/EA': 'bg-info-soft border-info text-info',
    'AYT - Sözel': 'bg-warn-soft border-warn text-warn',
    'AYT - Sayısal/EA': 'bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] border-[color-mix(in_srgb,var(--c4)_35%,transparent)] text-c4',
    'AYT - Sayısal': 'bg-ok-soft border-ok text-ok',
    'AYT - Ortak': 'bg-surface-2 border-line text-ink-2',
};

const calcNet = (d, y) => {
    const dd = parseFloat(d) || 0;
    const yy = parseFloat(y) || 0;
    return parseFloat((dd - yy * 0.25).toFixed(2));
};

const ManualResultModal = ({ onClose, onSave, trials, initialData }) => {
    const isEdit = !!initialData;

    // Mod: 'existing' = mevcut denemeye ekle, 'new' = yeni deneme oluştur
    const [trialMode, setTrialMode] = useState(isEdit ? 'existing' : (trials.length > 0 ? 'existing' : 'new'));

    // Mevcut deneme seçimi
    const initTrialId = initialData?.trialId || trials[0]?.id || '';
    const [trialId, setTrialId] = useState(initTrialId);

    // Yeni deneme alanları
    const [newTrialName, setNewTrialName] = useState('');
    const [newTrialExamType, setNewTrialExamType] = useState('TYT');
    const [newTrialDate, setNewTrialDate] = useState(new Date().toISOString().slice(0, 10));

    const [gradeLevel, setGradeLevel] = useState(initialData?.gradeLevel || '12');
    const [student, setStudent] = useState(initialData?.student || '');
    const [number, setNumber] = useState(initialData?.number || '');
    // Manuel OBP girişi — koçun düzenleme sırasında override etmesi için
    const [manualObp, setManualObp] = useState(() => {
        if (initialData?.obpScore !== undefined && initialData?.obpScore !== null && initialData?.obpScore > 0) return String(initialData.obpScore);
        // Fallback to lookup for initial display if editing
        if (isEdit) {
            const look = typeof getOBPScore === 'function' ? getOBPScore(initialData.student, initialData.number) : 0;
            return look > 0 ? String(look) : '';
        }
        return '';
    });

    const selectedTrial = trials.find(t => t.id === Number(trialId) || t.id === trialId);
    const examType = trialMode === 'existing'
        ? (selectedTrial?.examType || initialData?.examType || 'TYT')
        : newTrialExamType;

    let subjectList = TYT_SUBJECTS;
    if (examType === 'AYT') subjectList = AYT_SUBJECTS;
    else if (examType === 'YDT') subjectList = YDT_SUBJECTS;
    else if (examType === 'YDS') subjectList = YDS_SUBJECTS;
    else if (examType === 'LGS') subjectList = LGS_SUBJECTS;
    else if (examType === 'KPSS') subjectList = KPSS_SUBJECTS;
    else if (examType === 'TYT+AYT') subjectList = TYT_AYT_SUBJECTS;
    else if (examType === 'TYT+YDT' || examType === 'TYT+YDS') subjectList = TYT_YDT_SUBJECTS;

    // Her ders için {d: '', y: '' }
    const [scores, setScores] = useState(() => {
        if (!initialData?.subjects) return {};
        const init = {};
        
        // recognize both prefixed and non-prefixed keys for backward compatibility
        Object.entries(initialData.subjects).forEach(([key, val]) => {
            let targetKey = key;
            // if we are in TYT mode and key is 'turkce', map it to 'tyt_turkce' if needed
            // But actually we now use prefixed keys in the lists, so we can just use the key as is
            // unless it's an old record.
            if (!key.startsWith('tyt_') && !key.startsWith('ayt_') && !key.startsWith('yabanci_')) {
                if (initialData.examType === 'TYT') targetKey = `tyt_${key}`;
                else if (initialData.examType === 'AYT') targetKey = `ayt_${key}`;
            }

            init[targetKey] = {
                d: val?.d !== undefined && val?.d !== '-' ? String(val.d) : '',
                y: val?.y !== undefined && val?.y !== '-' ? String(val.y) : '',
            };
        });
        return init;
    });

    const setScore = (key, field, val) => {
        setScores(prev => ({
            ...prev,
            [key]: { ...(prev[key] || { d: '', y: '' }), [field]: val }
        }));
    };

    const getSubjectNet = (key) => {
        const s = scores[key] || {};
        if (!s.d && !s.y) return null;
        return calcNet(s.d, s.y);
    };

    const totalNet = subjectList.reduce((sum, subj) => {
        const n = getSubjectNet(subj.key);
        return sum + (n !== null ? n : 0);
    }, 0);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!student.trim()) return;
        if (trialMode === 'existing' && !trialId) return;
        if (trialMode === 'new' && !newTrialName.trim()) return;

        // Start with existing subjects to preserve those not in the current subjectList
        const subjectsObj = { ...(initialData?.subjects || {}) };
        
        subjectList.forEach(({ key }) => {
            const s = scores[key] || {};
            const d = s.d !== '' ? parseFloat(s.d) : 0;
            const y = s.y !== '' ? parseFloat(s.y) : 0;
            const net = calcNet(d, y);
            if (s.d !== '' || s.y !== '') {
                subjectsObj[key] = { d, y, net };
            } else if (isEdit) {
                // If explicitly cleared in modal, remove it
                delete subjectsObj[key];
            }
        });

        // Yeni deneme mi oluşturuyoruz?
        let resolvedTrialId = selectedTrial?.id || initialData?.trialId;
        let createdTrial = null;

        if (trialMode === 'new') {
            resolvedTrialId = `trial-${Date.now()}`;
            createdTrial = {
                id: resolvedTrialId,
                name: newTrialName.trim(),
                examType: newTrialExamType,
                date: newTrialDate,
                createdAt: new Date().toISOString(),
            };
        }

        const totalNetRaw = parseFloat(totalNet.toFixed(2));
        const resolvedObpScore = manualObp !== '' ? parseFloat(manualObp) : (initialData?.obpScore || 0);
        const newResult = {
            id: isEdit ? initialData.id : `manual-${Date.now()}`,
            trialId: resolvedTrialId,
            trialName: trialMode === 'new' ? newTrialName.trim() : (selectedTrial?.name || ''),
            gradeLevel,
            student: student.trim(),
            number: number.trim(),
            examType,
            obpScore: resolvedObpScore,

            uploadedAt: new Date().toISOString(),
            fileName: 'Elle girildi',
            subjects: subjectsObj,
            totalNet: totalNetRaw,
            tyt: ['TYT', 'TYT+AYT', 'TYT+YDT', 'TYT+YDS'].includes(examType) 
                    ? TYT_SUBJECTS.reduce((s, subj) => s + (subjectsObj[subj.key]?.net || 0), 0)
                    : undefined,
        };

        if (examType === 'AYT' || examType === 'TYT+AYT') {
            const { sayNet, eaNet, sozNet, dilNet } = getAYTAreaNets(newResult);
            newResult.sayNet = sayNet;
            newResult.eaNet = eaNet;
            newResult.sozNet = sozNet;
            newResult.dilNet = dilNet;
            // Eger TYT+AYT ise max alip ustune TYT kismini ekliyoruz:
            let maxAyt = Math.max(sayNet, eaNet, sozNet, dilNet);
            let tytEkleme = 0;
            if (examType === 'TYT+AYT') {
                // Sadece TYT derslerinin toplam neti 
                const tytNet = TYT_SUBJECTS.reduce((s, subj) => s + (subjectsObj[subj.key]?.net || 0), 0);
                tytEkleme = tytNet;
            }
            newResult.totalNet = parseFloat((maxAyt + tytEkleme).toFixed(2));
        } else if (examType === 'TYT+YDT' || examType === 'TYT+YDS') {
            const tytNet = TYT_SUBJECTS.reduce((s, subj) => s + (subjectsObj[subj.key]?.net || 0), 0);
            const dilNet = subjectsObj['yabanci_dil']?.net || subjectsObj['ydt']?.net || subjectsObj['yds']?.net || 0;
            newResult.totalNet = parseFloat((tytNet + dilNet).toFixed(2));
            newResult.tyt = parseFloat(tytNet.toFixed(2));
            newResult.dilNet = parseFloat(dilNet.toFixed(2));
        }

        onSave(newResult, createdTrial);
        onClose();
    };

    const inputCls = "w-full bg-surface border border-line rounded-lg px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none transition text-ink";
    const labelCls = "block text-xs font-bold text-ink-2 mb-1";

    // Grupları birleştir
    const groups = [...new Set(subjectList.map(s => s.group))];

    return (
        <Modal
            acik
            onClose={onClose}
            baslikGizle
            genislik="lg"
            govdeClassName="p-0 flex flex-col overflow-hidden"
        >
            {/* Header — her zaman görünür */}
            <div className="on-color p-5 border-b border-line flex justify-between items-center bg-gradient-to-r from-indigo-500 to-purple-600 flex-shrink-0">
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                    {isEdit ? <Edit2 size={18} /> : <FileText size={18} />}
                    {isEdit ? 'Sonucu Düzenle' : 'Bireysel Sonuç Gir'}
                </h3>
                <button onClick={onClose} className="p-1.5 hover:bg-surface/20 rounded-full transition"><X size={18} className="text-ink" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
                {/* ── Deneme Modu Seçici ── */}
                {!isEdit && (
                    <div>
                        <label className={labelCls}>Deneme Seçimi *</label>
                        <div className="flex gap-2">
                            <button type="button"
                                onClick={() => setTrialMode('existing')}
                                disabled={trials.length === 0}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition
                                    ${trialMode === 'existing'
                                        ? 'bg-brand text-white border-indigo-600 shadow-md'
                                        : 'bg-surface text-ink-2 border-line hover:bg-brand-soft disabled:opacity-40'}`}
                            >
                                📋 Mevcut Denemeye Ekle
                                {trials.length === 0 && <span className="block text-[10px] opacity-60">Henüz deneme yok</span>}
                            </button>
                            <button type="button"
                                onClick={() => setTrialMode('new')}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition
                                    ${trialMode === 'new'
                                        ? 'bg-ok text-white border-emerald-600 shadow-md'
                                        : 'bg-surface text-ink-2 border-line hover:bg-ok-soft'}`}
                            >
                                ✨ Yeni Deneme Oluştur
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Mevcut Deneme Seçici ── */}
                {(trialMode === 'existing' || isEdit) && (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Deneme *</label>
                            <select value={trialId} onChange={e => setTrialId(e.target.value)}
                                className="w-full border-2 border-brand-line rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-ink bg-surface font-bold">
                                {trials.map(t => <option key={t.id} value={t.id} className="text-ink">{t.name} ({t.examType})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Sınıf</label>
                            <select value={gradeLevel} onChange={e => setGradeLevel(e.target.value)}
                                className="w-full border-2 border-brand-line rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-ink bg-surface font-bold">
                                {GRADE_LEVELS.map(g => <option key={g.id} value={g.id} className="text-ink">{g.label}</option>)}
                            </select>
                        </div>
                    </div>
                )}

                {/* ── Yeni Deneme Oluşturma Alanları ── */}
                {trialMode === 'new' && !isEdit && (
                    <div className="bg-ok-soft border border-ok rounded-xl p-4 space-y-3">
                        <p className="text-xs font-black text-ok uppercase tracking-wide">✨ Yeni Deneme Bilgileri</p>
                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <label className={labelCls}>Deneme Adı *</label>
                                <input type="text" value={newTrialName}
                                    onChange={e => setNewTrialName(e.target.value)}
                                    placeholder="Örn: TYT Deneme 5, Nisan Denemesi..."
                                    className="w-full border border-line rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-ink" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>Sınav Türü</label>
                                    <select value={newTrialExamType} onChange={e => setNewTrialExamType(e.target.value)}
                                        className="w-full border border-line rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-ink">
                                        {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Tarih</label>
                                    <input type="date" value={newTrialDate}
                                        onChange={e => setNewTrialDate(e.target.value)}
                                        className="w-full border border-line rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-ink" />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Sınıf</label>
                                <select value={gradeLevel} onChange={e => setGradeLevel(e.target.value)}
                                    className="w-full border border-line rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-ink">
                                    {GRADE_LEVELS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Öğrenci bilgisi */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={labelCls}>Öğrenci Adı *</label>
                        <input autoFocus type="text" value={student} onChange={e => setStudent(e.target.value)}
                            placeholder="Ad Soyad"
                            className="w-full border border-line rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-ink" />
                    </div>
                    <div>
                        <label className={labelCls}>Numara</label>
                        <input type="text" value={number} onChange={e => setNumber(e.target.value)}
                            placeholder="okul no (opt.)"
                            className="w-full border border-line rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-ink" />
                    </div>
                </div>

                {/* OBP Manuel Giriş — Öğrenci bilgisinin hemen altında */}
                <div className="bg-warn-soft border-2 border-warn rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">🎓</span>
                        <label className="text-sm font-black text-warn">OBP (Diploma Notu) Ek Puanı</label>
                        <span className="text-xs bg-amber-200 text-warn font-bold px-2 py-0.5 rounded-full">0 – 60</span>
                    </div>
                    <input
                        type="number"
                        min="0"
                        max="60"
                        step="0.01"
                        value={manualObp}
                        onChange={e => setManualObp(e.target.value)}
                        placeholder="Boş bırakırsanız sistem OBP verisinden otomatik alır"
                        className="w-full border-2 border-warn rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-surface font-semibold text-ink"
                    />
                    <p className="text-xs text-warn mt-1.5">💡 Diploma notu sisteme OBP sekmesinden girilmişse boş bırakın — otomatik uygulanır. Buraya girdiğiniz değer önceliklidir.</p>
                </div>


                {/* Ders bazlı doğru/yanlış/net */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-ink-2 uppercase tracking-wide">{examType} — Ders Detayları</p>
                        <div className="flex gap-4 text-xs font-bold text-ink-3 pr-1">
                            <span className="w-20 text-center text-ok">Doğru</span>
                            <span className="w-20 text-center text-danger">Yanlış</span>
                            <span className="w-20 text-center text-brand">Net</span>
                        </div>
                    </div>

                    {groups.map(group => (
                        <div key={group} className={`rounded-xl border p-3 space-y-2 ${GROUP_COLORS[group] || 'bg-surface-2 border-line'}`}>
                            <p className="text-xs font-black uppercase tracking-wider opacity-70">{group}</p>
                            {subjectList.filter(s => s.group === group).map(({ key, label, maxD }) => {
                                const s = scores[key] || {};
                                const net = getSubjectNet(key);
                                return (
                                    <div key={key} className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-ink-2 w-28 shrink-0">{label}</span>
                                        <span className="text-xs text-ink-3 shrink-0">/{maxD}</span>
                                        <div className="flex gap-2 ml-auto">
                                            <input
                                                type="number" min="0" max={maxD} step="1"
                                                value={s.d || ''}
                                                onChange={e => setScore(key, 'd', e.target.value)}
                                                placeholder="D"
                                                className={inputCls + " border-ok focus:ring-green-400"}
                                            />
                                            <input
                                                type="number" min="0" max={maxD} step="1"
                                                value={s.y || ''}
                                                onChange={e => setScore(key, 'y', e.target.value)}
                                                placeholder="Y"
                                                className={inputCls + " border-danger focus:ring-red-400"}
                                            />
                                            <div className={`w-20 text-center py-1.5 rounded-lg text-sm font-black ${net === null ? 'bg-surface-3 text-ink-3' :
                                                net >= 0 ? 'bg-brand-soft text-brand' : 'bg-danger-soft text-danger'
                                                }`}>
                                                {net !== null ? net.toFixed(2) : '—'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Toplam net */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-brand-line rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-brand">
                        {examType === 'AYT' ? 'Hesaplanan Netler (SAY/EA/SÖZ)' : 'Toplam Net'}
                    </span>
                    {examType === 'AYT' ? (
                        <div className="flex gap-3 text-xs font-bold">
                            {['SAY', 'EA', 'SÖZ'].map(type => (
                                <span key={type} className="bg-surface border border-brand-line px-2 py-1 rounded-lg text-brand">
                                    {type}: {
                                        type === 'SAY' ? (
                                            ((scores.ayt_matematik ? calcNet(scores.ayt_matematik.d, scores.ayt_matematik.y) : 0) +
                                                (scores.ayt_geometri ? calcNet(scores.ayt_geometri.d, scores.ayt_geometri.y) : 0) +
                                                (scores.ayt_fizik ? calcNet(scores.ayt_fizik.d, scores.ayt_fizik.y) : 0) +
                                                (scores.ayt_kimya ? calcNet(scores.ayt_kimya.d, scores.ayt_kimya.y) : 0) +
                                                (scores.ayt_biyoloji ? calcNet(scores.ayt_biyoloji.d, scores.ayt_biyoloji.y) : 0)
                                            ).toFixed(2)
                                        ) : type === 'EA' ? (
                                            ((scores.ayt_edebiyat ? calcNet(scores.ayt_edebiyat.d, scores.ayt_edebiyat.y) : 0) +
                                                (scores.ayt_matematik ? calcNet(scores.ayt_matematik.d, scores.ayt_matematik.y) : 0) +
                                                (scores.ayt_geometri ? calcNet(scores.ayt_geometri.d, scores.ayt_geometri.y) : 0)
                                            ).toFixed(2)
                                        ) : (
                                            ((scores.ayt_edebiyat ? calcNet(scores.ayt_edebiyat.d, scores.ayt_edebiyat.y) : 0) +
                                                (scores.ayt_tarih1 ? calcNet(scores.ayt_tarih1.d, scores.ayt_tarih1.y) : 0) +
                                                (scores.ayt_cografya1 ? calcNet(scores.ayt_cografya1.d, scores.ayt_cografya1.y) : 0) +
                                                (scores.ayt_tarih2 ? calcNet(scores.ayt_tarih2.d, scores.ayt_tarih2.y) : 0) +
                                                (scores.ayt_cografya2 ? calcNet(scores.ayt_cografya2.d, scores.ayt_cografya2.y) : 0) +
                                                (scores.ayt_felsefe ? calcNet(scores.ayt_felsefe.d, scores.ayt_felsefe.y) : 0) +
                                                (scores.ayt_din ? calcNet(scores.ayt_din.d, scores.ayt_din.y) : 0)
                                            ).toFixed(2)
                                        )
                                    }
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="text-xl font-black text-brand">{totalNet.toFixed(2)}</span>
                    )}
                </div>

                <div className="pencere-alt-cubuk bg-surface flex gap-3 pt-1">
                    <button type="button" onClick={onClose} className="flex-1 border border-line text-ink-2 py-3 rounded-xl font-semibold hover:bg-surface-2 transition">İptal</button>
                    <button type="submit" disabled={!student.trim() || !trialId}
                        className="on-color flex-1 bg-gradient-to-r from-brand to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-40 disabled:cursor-not-allowed">
                        Kaydet
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// ─── Sınıf Yükleme Kartı ─────────────────────────────────────────────────────
const GradeUploadCard = ({ grade, trial, results, onUpload, onDelete, loading }) => {
    const hasData = results.length > 0;
    const avgNet = hasData
        ? (results.reduce((a, r) => a + getTotalNet(r), 0) / results.length).toFixed(1)
        : null;
    const top3 = hasData ? [...results].sort((a, b) => getTotalNet(b) - getTotalNet(a)).slice(0, 3) : [];

    return (
        <div className={`rounded-xl border-2 ${hasData ? `${grade.border} bg-surface` : 'border-dashed border-line bg-surface-2/50'} overflow-hidden transition-all hover:shadow-md`}>
            {/* Header */}
            <div className={`px-4 py-3 flex justify-between items-center ${hasData ? grade.bg : 'bg-transparent'}`}>
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${hasData ? `${grade.bg} ${grade.text}` : 'bg-surface-3 text-ink-3'} flex items-center justify-center font-black text-sm`}>
                        {grade.id}
                    </div>
                    <div>
                        <p className="font-bold text-ink text-sm">{grade.label}</p>
                        {hasData && <p className="text-xs text-ink-2">{results.length} öğrenci</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {hasData && (
                        <>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${grade.badge}`}>Ort: {avgNet}</span>
                            <button
                                onClick={() => onDelete(grade.id)}
                                className="p-1.5 text-danger hover:text-danger hover:bg-danger-soft rounded-lg transition"
                                title="Bu sınıfın verilerini sil"
                            >
                                <Trash2 size={14} />
                            </button>
                        </>
                    )}
                    {/* Special Case: TYT+AYT or TYT+YDT */}
                    {['TYT+AYT', 'TYT+YDT'].includes(trial.examType) ? (
                        <div className="flex gap-2">
                            {/* TYT Button */}
                            <label
                                className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${results.some(r => r.tyt > 0)
                                    ? 'bg-ok-soft text-ok hover:bg-green-200'
                                    : 'bg-c4 text-white hover:bg-c4'
                                    } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                                title="TYT Excel Yükle"
                            >
                                <Upload size={12} />
                                {loading ? '...' : (results.some(r => r.tyt > 0) ? 'TYT ✓' : 'TYT Yükle')}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".xlsx,.xls"
                                    onChange={(e) => onUpload(e, grade.id, 'TYT')}
                                    disabled={loading}
                                />
                            </label>

                            {/* AYT/YDT Button */}
                            <label
                                className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${results.some(r => r && r.subjects && Object.keys(r.subjects).some(k => !['tyt_turkce', 'tyt_matematik', 'tyt_fizik', 'tyt_kimya', 'tyt_biyoloji', 'tyt_tarih', 'tyt_cografya', 'tyt_felsefe', 'tyt_din'].includes(k.toLowerCase())))
                                    ? 'bg-info-soft text-info hover:bg-blue-200'
                                    : 'bg-c4 text-white hover:bg-c4'
                                    } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                                title={`${trial.examType.includes('AYT') ? 'AYT' : 'YDT'} Excel Yükle`}
                            >
                                <Upload size={12} />
                                {loading ? '...' : (results.some(r => r && r.subjects && Object.keys(r.subjects).some(k => !['tyt_turkce', 'tyt_matematik', 'tyt_fizik', 'tyt_kimya', 'tyt_biyoloji', 'tyt_tarih', 'tyt_cografya', 'tyt_felsefe', 'tyt_din'].includes(k.toLowerCase()))) ? (trial.examType.includes('AYT') ? 'AYT ✓' : 'YDT ✓') : (trial.examType.includes('AYT') ? 'AYT Yükle' : 'YDT Yükle'))}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".xlsx,.xls"
                                    onChange={(e) => onUpload(e, grade.id, trial.examType.includes('AYT') ? 'AYT' : 'YDT')}
                                    disabled={loading}
                                />
                            </label>
                        </div>
                    ) : (
                        <label
                            className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${hasData
                                ? 'bg-surface border border-line text-ink-2 hover:border-line-2'
                                : 'bg-c4 text-white hover:bg-c4'
                                } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                            title={hasData ? 'Veriyi güncelle' : 'Excel yükle'}
                        >
                            <Upload size={12} />
                            {loading ? 'Yükleniyor...' : hasData ? 'Güncelle' : 'Excel Yükle'}
                            <input
                                type="file"
                                className="hidden"
                                accept=".xlsx,.xls"
                                onChange={(e) => onUpload(e, grade.id, trial.examType)}
                                disabled={loading}
                            />
                        </label>
                    )}
                </div>
            </div>

            {/* Content */}
            {hasData ? (
                <div className="px-4 pb-3 pt-2">
                    <div className="flex gap-2">
                        {top3.map((r, i) => (
                            <div key={i} className="flex-1 bg-surface-2 rounded-lg p-2 text-center min-w-0">
                                <div className="text-xs text-ink-3 font-medium truncate">#{i + 1}</div>
                                <div className="text-xs font-bold text-ink-2 truncate">{(r.student || r.name || 'Öğrenci').split(' ')[0]}</div>
                                <div className={`text-sm font-black ${grade.text}`}>{parseFloat(getTotalNet(r) || 0).toFixed(1)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="px-4 pb-4 pt-2 text-center">
                    <p className="text-xs text-ink-3">Henüz veri yüklenmedi</p>
                </div>
            )}
        </div>
    );
};

// ─── Deneme Kart (Açılır-Kapanır) ────────────────────────────────────────────
const TrialCard = ({ trial, allResults, students, calculationContext, onDelete, onUploadGrade, onDeleteGrade, onViewStudent, onDeleteResult, onEditResult, loadingGrade, setToast, defaultExpanded = true }) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [activeGrade, setActiveGrade] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [expandedRow, setExpandedRow] = useState(null);
    const [studentSearch, setStudentSearch] = useState('');

    // 🚀 Performance Optimization: Memoize all heavy calculations
    const { 
        totalStudents, 
        avgNet, 
        gradeCompareData, 
        uploadedGrades,
        resultsByGrade 
    } = useMemo(() => {
        const total = allResults.length;
        
        // Group by grade in one pass
        const byGrade = {};
        let totalNetSum = 0;
        
        allResults.forEach(r => {
            if (!byGrade[r.gradeLevel]) byGrade[r.gradeLevel] = [];
            byGrade[r.gradeLevel].push(r);
            // Optimization: calculationContext is already memoized, but we can also use a simple cache if needed
            totalNetSum += calculateEstimatedScore(r, calculationContext);
        });

        const avg = total > 0 ? (totalNetSum / total).toFixed(1) : '-';

        const compareData = GRADE_LEVELS.map(g => {
            const gRes = byGrade[g.id] || [];
            if (gRes.length === 0) return null;
            const gSum = gRes.reduce((a, r) => a + calculateEstimatedScore(r, calculationContext), 0);
            return {
                name: g.label.replace('. Sınıf', '.'),
                ortalama: (gSum / gRes.length).toFixed(1),
            };
        }).filter(Boolean);


        const uploaded = GRADE_LEVELS.filter(g => !!byGrade[g.id]);

        return { 
            totalStudents: total, 
            avgNet: avg, 
            gradeCompareData: compareData, 
            uploadedGrades: uploaded,
            resultsByGrade: byGrade
        };
    }, [allResults, calculationContext]);

    const gradeResults = (gradeId) => resultsByGrade[gradeId] || [];
    const baseResults = useMemo(() =>
        activeGrade ? gradeResults(activeGrade) : allResults
    , [activeGrade, resultsByGrade, allResults]);

    // 🔍 Öğrenci arama filtresi (Türkçe karakter duyarlı)
    const normSearch = (s) => String(s || '').toLowerCase()
        .replace(/ı/g,'i').replace(/İ/g,'i').replace(/ö/g,'o').replace(/Ö/g,'o')
        .replace(/ü/g,'u').replace(/Ü/g,'u').replace(/ş/g,'s').replace(/Ş/g,'s')
        .replace(/ğ/g,'g').replace(/Ğ/g,'g').replace(/ç/g,'c').replace(/Ç/g,'c');

    const activeResults = useMemo(() => {
        if (!studentSearch.trim()) return baseResults;
        const q = normSearch(studentSearch);
        return baseResults.filter(r => normSearch(r.student || r.name || '').includes(q));
    }, [baseResults, studentSearch]);

    return (
        <div className="bg-surface rounded-2xl border border-line overflow-hidden shadow-sm hover:shadow-md transition-all">
            {/* Trial Header */}
            <div
                className="px-5 py-4 flex justify-between items-center cursor-pointer hover:bg-surface-2/80 transition"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    <div className={`transition-transform duration-yavas ${expanded ? 'rotate-90' : ''}`}>
                        <ChevronRight size={20} className="text-ink-3" />
                    </div>
                    <div>
                        <h4 className="font-bold text-ink text-base flex items-center gap-2">
                            {trial.name}
                            <span className="px-2 py-0.5 text-xs bg-brand-soft text-brand rounded-full font-semibold">{trial.examType}</span>
                        </h4>
                        <p className="text-xs text-ink-2 mt-0.5">
                            {new Date(trial.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {uploadedGrades.length > 0 && ` • ${uploadedGrades.length} sınıf yüklendi`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Grade badges */}
                    <div className="hidden md:flex gap-1">
                        {GRADE_LEVELS.map(g => {
                            const has = !!resultsByGrade[g.id];
                            return (
                                <span key={g.id} className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center transition ${has ? `${g.bg} ${g.text}` : 'bg-surface-3 text-ink-3'}`}>
                                    {g.id}
                                </span>
                            );
                        })}
                    </div>
                    <span className="bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] text-c4 text-xs font-bold px-3 py-1.5 rounded-full">
                        {totalStudents} öğrenci
                    </span>
                    {totalStudents > 0 && (
                        <span className="bg-ok-soft text-ok text-xs font-bold px-3 py-1.5 rounded-full">
                            Ort: {avgNet}
                        </span>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(trial.id); }}
                        className="p-2 text-danger hover:text-danger hover:bg-danger-soft rounded-full transition"
                        title="Denemeyi sil"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Expanded Content */}
            {expanded && (
                <div className="border-t border-line animate-fade-in">
                    {/* Sınıf Yükleme Grid */}
                    <div className="p-5 pb-3">
                        <div className="flex items-center gap-2 mb-3">
                            <School size={16} className="text-ink-3" />
                            <h5 className="text-sm font-bold text-ink-2 uppercase tracking-wide">Sınıf Bazlı Veri Yükleme</h5>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {GRADE_LEVELS.map(grade => (
                                <GradeUploadCard
                                    key={grade.id}
                                    grade={grade}
                                    trial={trial}
                                    results={gradeResults(grade.id)}
                                    onUpload={(e, gId, examType) => onUploadGrade(e, trial.id, gId, examType)}
                                    onDelete={(gId) => onDeleteGrade(trial.id, gId)}
                                    loading={loadingGrade === `${trial.id}-${grade.id}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Sınıf Karşılaştırma Grafik */}
                    {gradeCompareData.length > 0 && (
                        <div className="px-5 pb-4">
                            <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-xl p-4">
                                <h5 className="text-sm font-bold text-ink-2 mb-3 flex items-center gap-2">
                                    <BarChart2 size={15} className="text-brand" />
                                    Sınıf Karşılaştırması
                                </h5>
                                <div className="h-32">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={gradeCompareData} barSize={40}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                            <RechartsTooltip
                                                contentStyle={{ borderRadius: '10px', border: 'none', fontSize: 12 }}
                                                formatter={(v) => [`${v} net`, 'Ortalama']}
                                            />
                                            <Bar dataKey="ortalama" fill="url(#gradientBar)" radius={[6, 6, 0, 0]}  animationDuration={300} />
                                            <defs>
                                                <linearGradient id="gradientBar" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="var(--c4)" />
                                                    <stop offset="100%" stopColor="var(--c1)" />
                                                </linearGradient>
                                            </defs>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tablo – Sınıf filtreli */}
                    {totalStudents > 0 && (
                        <div className="border-t border-line">
                            {/* Sınıf Sekmeler, Arama ve PDF İndir Butonu */}
                            <div className="px-5 pt-4 flex flex-col gap-3">
                                <div className="flex justify-between items-center flex-wrap gap-2">
                                    <div className="flex gap-2 flex-wrap">
                                        <button
                                            onClick={() => setActiveGrade(null)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeGrade === null ? 'bg-surface-inv text-ink' : 'bg-surface-3 text-ink-2 hover:bg-surface-3'}`}
                                        >
                                            Tümü ({totalStudents})
                                        </button>
                                        {GRADE_LEVELS.filter(g => gradeResults(g.id).length > 0).map(g => (
                                            <button
                                                key={g.id}
                                                onClick={() => setActiveGrade(g.id)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeGrade === g.id ? `${g.bg} ${g.text}` : 'bg-surface-3 text-ink-2 hover:bg-surface-3'}`}
                                            >
                                                {g.label} ({gradeResults(g.id).length})
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            try {
                                                generateBulkExamReport(trial, activeResults, students);
                                            } catch (err) {
                                                if (setToast) setToast(hataAnlat(err, 'pdf'));
                                            }
                                        }}
                                        className="flex items-center gap-1.5 bg-brand-soft text-brand px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-200 transition"
                                    >
                                        <Download size={14} /> Toplu PDF İndir
                                    </button>
                                </div>
                                {/* 🔍 Öğrenci Arama */}
                                <div className="relative max-w-sm">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                                    <input
                                        type="text"
                                        value={studentSearch}
                                        onChange={e => setStudentSearch(e.target.value)}
                                        placeholder="Öğrenci adı ara..."
                                        className="pl-9 pr-4 py-2 w-full border border-line rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 text-ink-2"
                                    />
                                    {studentSearch && (
                                        <button onClick={() => setStudentSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-2">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                                        </button>
                                    )}
                                </div>
                                {studentSearch && (
                                    <p className="text-xs text-ink-3">
                                        {activeResults.length === 0
                                            ? `“${studentSearch}” ile eşleşen öğrenci bulunamadı.`
                                            : `${activeResults.length} sonuç gösteriliyor`}
                                    </p>
                                )}
                            </div>

                            {/* Tablo */}
                            <div className="overflow-x-auto mt-3">
                                <table className="min-w-full divide-y divide-line">
                                    <thead className="bg-surface-2">
                                        <tr>
                                            <th className="px-4 py-2.5 text-left text-xs font-bold text-ink-2 w-10">#</th>
                                            <th className="px-4 py-2.5 text-left text-xs font-bold text-ink-2">Öğrenci</th>
                                            <th className="px-4 py-2.5 text-center text-xs font-bold text-ink-2">Sınıf</th>
                                            {trial.examType === 'TYT' && <>
                                                <th className="px-3 py-2.5 text-center text-xs font-bold text-ink-3 hidden md:table-cell">Türkçe</th>
                                                <th className="px-3 py-2.5 text-center text-xs font-bold text-ink-3 hidden md:table-cell">Mat</th>
                                                <th className="px-3 py-2.5 text-center text-xs font-bold text-ink-3 hidden md:table-cell">Fen</th>
                                                <th className="px-3 py-2.5 text-center text-xs font-bold text-ink-3 hidden md:table-cell">Sosyal</th>
                                            </>}
                                            {trial.examType === 'AYT' && <>
                                                <th className="px-3 py-2.5 text-center text-xs font-bold text-warn hidden md:table-cell">Edebiyat</th>
                                                <th className="px-3 py-2.5 text-center text-xs font-bold text-warn hidden md:table-cell">Sos.AYT</th>
                                                <th className="px-3 py-2.5 text-center text-xs font-bold text-warn hidden md:table-cell">Mat</th>
                                                <th className="px-3 py-2.5 text-center text-xs font-bold text-warn hidden md:table-cell">Fen</th>
                                                <th className="px-3 py-2.5 text-center text-xs font-bold text-warn hidden md:table-cell">Dil</th>
                                                <th className="px-3 py-2.5 text-center text-xs font-bold text-c4 hidden md:table-cell">SAY</th>
                                                <th className="px-3 py-2.5 text-center text-xs font-bold text-info hidden md:table-cell">EA</th>
                                                <th className="px-3 py-2.5 text-center text-xs font-bold text-ok hidden md:table-cell">SÖZ</th>
                                            </>}
                                            {trial.examType === 'TYT+AYT' && <>
                                                <th className="px-3 py-2.5 text-center text-xs font-bold text-ink-3 hidden md:table-cell">TYT Net</th>
                                                <th className="px-3 py-2.5 text-center text-xs font-bold text-c4 hidden md:table-cell">SAY</th>
                                                <th className="px-3 py-2.5 text-center text-xs font-bold text-info hidden md:table-cell">EA</th>
                                                <th className="px-3 py-2.5 text-center text-xs font-bold text-ok hidden md:table-cell">SÖZ</th>
                                            </>}
                                            {trial.examType === 'TYT+YDT' && <>
                                                <th className="px-3 py-2.5 text-center text-xs font-bold text-ink-3 hidden md:table-cell">TYT Net</th>
                                                <th className="px-3 py-2.5 text-center text-xs font-bold text-info hidden md:table-cell">YDT Net</th>
                                            </>}                                            {trial.examType === 'LGS' && <>
                                                <th className="px-3 py-2.5 text-center text-xs font-bold text-ink-3 hidden md:table-cell">Türkçe</th>
                                                <th className="px-3 py-2.5 text-center text-xs font-bold text-ink-3 hidden md:table-cell">Mat</th>
                                                <th className="px-3 py-2.5 text-center text-xs font-bold text-ink-3 hidden md:table-cell">Fen</th>
                                                <th className="px-3 py-2.5 text-center text-xs font-bold text-ink-3 hidden md:table-cell">İnk</th>
                                                <th className="px-3 py-2.5 text-center text-xs font-bold text-ink-3 hidden md:table-cell">İng</th>
                                            </>}
                                            <th className="px-3 py-2.5 text-center text-xs font-bold text-ok">Toplam Net</th>
                                            <th className="px-3 py-2.5 text-center text-xs font-bold text-ok hidden sm:table-cell">OBP</th>
                                            <th className="px-3 py-2.5 text-center text-xs font-bold text-c4 text-nowrap">Puan (OBP Dahil)</th>
                                            <th className="px-3 py-2.5 text-right text-xs font-bold text-ink-3">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line text-sm bg-surface">
                                        {[...activeResults]
                                            .sort((a, b) => {
                                                if (!a || !b) return 0;
                                                const safeCalc = (res) => {
                                                    try {
                                                        const fn = typeof calculateEstimatedScore === 'function' ? calculateEstimatedScore : (window.calculateEstimatedScore || null);
                                                        return fn ? (parseFloat(fn(res)) || 0) : 0;
                                                    } catch (e) { return 0; }
                                                };
                                                const puanB = safeCalc(b);
                                                const puanA = safeCalc(a);
                                                if (puanB !== puanA) return puanB - puanA;
                                                return (parseFloat(getTotalNet(b)) || 0) - (parseFloat(getTotalNet(a)) || 0);
                                            })
                                            .map((result, idx) => {
                                                const gradeInfo = GRADE_LEVELS.find(g => g.id === result.gradeLevel);
                                                const rowId = result.id || idx;
                                                const isRowExpanded = expandedRow === rowId;
                                                return (
                                                    <React.Fragment key={rowId}>
                                                    <tr
                                                        className={`transition cursor-pointer ${isRowExpanded ? 'bg-brand-soft/60' : 'hover:bg-brand-soft/30'}`}
                                                        onClick={() => setExpandedRow(isRowExpanded ? null : rowId)}
                                                    >
                                                        <td className="px-4 py-2.5 text-ink-3 font-bold text-xs">{idx + 1}</td>
                                                        <td className="px-4 py-2.5 font-semibold text-ink">
                                                            <div className="flex items-center gap-1">
                                                                <span className={`text-[10px] transition-transform duration-normal ${isRowExpanded ? 'rotate-90' : ''} text-brand`}>▶</span>
                                                                {result.student}
                                                                {result.number && <span className="ml-2 text-xs text-ink-3">#{result.number}</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-center">
                                                            {gradeInfo ? (
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${gradeInfo.badge}`}>{gradeInfo.label}</span>
                                                            ) : <span className="text-ink-3 text-xs">-</span>}
                                                        </td>
                                                        {trial.examType === 'TYT' && <>
                                                            <td className="px-3 py-2.5 text-center text-ink-2 hidden md:table-cell">{(typeof result.turkce === 'number' ? result.turkce : getNet(result.subjects?.tyt_turkce ?? result.subjects?.turkce)).toFixed(1)}</td>
                                                            <td className="px-3 py-2.5 text-center text-ink-2 hidden md:table-cell">{(typeof result.mat === 'number' ? result.mat : getNet(result.subjects?.tyt_mat_toplam ?? result.subjects?.tyt_matematik ?? result.subjects?.mat_toplam ?? result.subjects?.mat)).toFixed(1)}</td>
                                                            <td className="px-3 py-2.5 text-center text-ink-2 hidden md:table-cell">{(typeof result.fen === 'number' ? result.fen : getNet(result.subjects?.tyt_fen_toplam ?? result.subjects?.fen_toplam ?? result.subjects?.fen)).toFixed(1)}</td>
                                                            <td className="px-3 py-2.5 text-center text-ink-2 hidden md:table-cell">{(typeof result.sosyal === 'number' ? result.sosyal : getNet(result.subjects?.tyt_sosyal_toplam ?? result.subjects?.sosyal_toplam ?? result.subjects?.sosyal)).toFixed(1)}</td>
                                                        </>}
                                                        {trial.examType === 'AYT' && (() => {
                                                            const nets = getAYTAreaNets(result);
                                                            return (
                                                                <>
                                                                    <td className="px-3 py-2.5 text-center text-warn hidden md:table-cell">{(typeof result.edebiyat === 'number' ? result.edebiyat : getNet(result.subjects?.ayt_edebiyat || result.subjects?.edebiyat)).toFixed(1)}</td>
                                                                    <td className="px-3 py-2.5 text-center text-warn hidden md:table-cell">{(typeof result.sosyalAYT === 'number' ? result.sosyalAYT : (getNet(result.subjects?.ayt_tarih1) + getNet(result.subjects?.ayt_cografya1) + getNet(result.subjects?.ayt_tarih2) + getNet(result.subjects?.ayt_cografya2) + getNet(result.subjects?.ayt_felsefe) + getNet(result.subjects?.ayt_din))).toFixed(1)}</td>
                                                                    <td className="px-3 py-2.5 text-center text-warn hidden md:table-cell">{(typeof result.aytMat === 'number' ? result.aytMat : getNet(result.subjects?.ayt_matematik || result.subjects?.ayt_mat)).toFixed(1)}</td>
                                                                    <td className="px-3 py-2.5 text-center text-warn hidden md:table-cell">{(typeof result.fen === 'number' ? result.fen : (getNet(result.subjects?.ayt_fizik) + getNet(result.subjects?.ayt_kimya) + getNet(result.subjects?.ayt_biyoloji))).toFixed(1)}</td>
                                                                    <td className="px-3 py-2.5 text-center text-warn hidden md:table-cell">{(typeof result.dil === 'number' ? result.dil : getNet(result.subjects?.yabanci_dil || result.subjects?.ayt_dil_toplam)).toFixed(1)}</td>
                                                                    <td className="px-3 py-2.5 text-center font-bold text-c4 hidden md:table-cell">{(nets.sayNet || 0).toFixed(1)}</td>
                                                                    <td className="px-3 py-2.5 text-center font-bold text-info hidden md:table-cell">{(nets.eaNet || 0).toFixed(1)}</td>
                                                                    <td className="px-3 py-2.5 text-center font-bold text-ok hidden md:table-cell">{(nets.sozNet || 0).toFixed(1)}</td>
                                                                </>
                                                            );
                                                        })()}
                                                        {trial.examType === 'TYT+AYT' && (() => {
                                                            const nets = getAYTAreaNets(result);
                                                            // TYT neti doğrudan result.tyt alanından oku (merge sırasında buraya yazılıyor)
                                                            const tytNet = parseFloat(result.tyt || 0) || 
                                                                (getNet(result.subjects?.tyt_turkce) + getNet(result.subjects?.tyt_mat_toplam ?? result.subjects?.tyt_matematik) + getNet(result.subjects?.tyt_fen_toplam) + getNet(result.subjects?.tyt_sosyal_toplam));
                                                            return (
                                                                <>
                                                                    <td className="px-3 py-2.5 text-center text-ink-2 hidden md:table-cell">{(tytNet || 0).toFixed(1)}</td>
                                                                    <td className="px-3 py-2.5 text-center font-bold text-c4 hidden md:table-cell">{(nets.sayNet || 0).toFixed(1)}</td>
                                                                    <td className="px-3 py-2.5 text-center font-bold text-info hidden md:table-cell">{(nets.eaNet || 0).toFixed(1)}</td>
                                                                    <td className="px-3 py-2.5 text-center font-bold text-ok hidden md:table-cell">{(nets.sozNet || 0).toFixed(1)}</td>
                                                                </>
                                                            );
                                                        })()}
                                                        {(trial.examType === 'TYT+YDT') && (() => {
                                                            const nets = getAYTAreaNets(result);
                                                            const tytNet = parseFloat(result.tyt || 0) ||
                                                                (getNet(result.subjects?.tyt_turkce) + getNet(result.subjects?.tyt_mat_toplam ?? result.subjects?.tyt_matematik) + getNet(result.subjects?.tyt_fen_toplam) + getNet(result.subjects?.tyt_sosyal_toplam));
                                                            const ydtNet = parseFloat(result.dil || 0) || getNet(result.subjects?.yabanci_dil || result.subjects?.ayt_dil_toplam);
                                                            return (
                                                                <>
                                                                    <td className="px-3 py-2.5 text-center text-ink-2 hidden md:table-cell font-medium">{(tytNet || 0).toFixed(1)}</td>
                                                                    <td className="px-3 py-2.5 text-center font-bold text-info hidden md:table-cell">{(ydtNet || nets.dilNet || 0).toFixed(1)}</td>
                                                                </>
                                                            );
                                                        })()}                                                        {trial.examType === 'LGS' && <>
                                                            <td className="px-3 py-2.5 text-center text-ink-2 hidden md:table-cell">{getNet(result.subjects?.turkce).toFixed(1)}</td>
                                                            <td className="px-3 py-2.5 text-center text-ink-2 hidden md:table-cell">{getNet(result.subjects?.mat).toFixed(1)}</td>
                                                            <td className="px-3 py-2.5 text-center text-ink-2 hidden md:table-cell">{getNet(result.subjects?.fen).toFixed(1)}</td>
                                                            <td className="px-3 py-2.5 text-center text-ink-2 hidden md:table-cell">{getNet(result.subjects?.inkilap).toFixed(1)}</td>
                                                            <td className="px-3 py-2.5 text-center text-ink-2 hidden md:table-cell">{getNet(result.subjects?.ingilizce).toFixed(1)}</td>
                                                        </>}
                                                        <td className="px-3 py-2.5 text-center font-bold text-ok">
                                                            {getTotalNet(result).toFixed(1)}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center text-ok hidden sm:table-cell font-bold">
                                                            {(() => {
                                                                // Her zaman canlı OBP hesapla (stored 0 değerlerine güvenme)
                                                                try {
                                                                    const liveObp = getOBPScore(result.student || result.studentName || result.name || '', result.number || result.schoolNumber, calculationContext);
                                                                    if (liveObp > 0) return parseFloat(liveObp).toFixed(2);
                                                                    if (result.obpScore && parseFloat(result.obpScore) > 0) return parseFloat(result.obpScore).toFixed(2);
                                                                    return "0.00";
                                                                } catch (e) {
                                                                    return "0.00";
                                                                }
                                                            })()}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center font-black text-c4 text-[15px]">
                                                            {(() => {
                                                                try {
                                                                    const calcFn = typeof calculateEstimatedScore === 'function' ? calculateEstimatedScore : (window.calculateEstimatedScore || (() => 0));
                                                                    const resPuan = parseFloat(calcFn(result));
                                                                    return resPuan > 0 ? resPuan.toFixed(2) : "-";
                                                                } catch (e) {
                                                                    return "-";
                                                                }
                                                            })()}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right w-24">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button
                                                                    onClick={e => { e.stopPropagation(); onEditResult && onEditResult(result); }}
                                                                    className="p-1.5 text-brand hover:text-brand hover:bg-brand-soft rounded-lg transition"
                                                                    title="Sonucu düzenle"
                                                                >
                                                                    <Edit2 size={13} />
                                                                </button>
                                                                <button
                                                                    onClick={e => { e.stopPropagation(); onDeleteResult && onDeleteResult(result.id, trial.id); }}
                                                                    className="p-1.5 text-danger hover:text-danger hover:bg-danger-soft rounded-lg transition"
                                                                    title="Sonucu sil"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                                <span
                                                                    onClick={e => { e.stopPropagation(); setSelectedStudent({ result, trial }); }}
                                                                    className="text-xs bg-brand-soft text-brand px-2 py-1 rounded-lg hover:bg-brand-soft transition cursor-pointer"
                                                                >Karne</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {/* Genişletilmiş Detay Satırı */}
                                                    {isRowExpanded && result.subjects && (
                                                        <tr className="bg-brand-soft/40 border-b border-brand-line">
                                                            <td colSpan={20} className="px-6 py-3">
                                                                <div className="flex flex-wrap gap-2">
                                                                    {Object.entries(result.subjects).map(([key, val]) => {
                                                                        if (!val || (val.net === undefined && typeof val !== 'number')) return null;
                                                                        const net = typeof val === 'number' ? val : (val.net ?? 0);
                                                                        const d = val.d ?? '-';
                                                                        const y = val.y ?? '-';
                                                                        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                                                        return (
                                                                            <div key={key} className="flex flex-col items-center bg-surface rounded-xl px-3 py-2 border border-brand-line shadow-sm min-w-[80px]">
                                                                                <span className="text-[10px] font-bold text-ink-2 uppercase tracking-wide truncate max-w-[90px]">{label}</span>
                                                                                <span className={`text-base font-black mt-0.5 ${net >= 0 ? 'text-brand' : 'text-danger'}`}>{parseFloat(net).toFixed(1)}</span>
                                                                                <span className="text-[10px] text-ink-3 mt-0.5">
                                                                                    <span className="text-ok font-bold">{d}D</span>
                                                                                    <span className="mx-0.5 text-ink-3">|</span>
                                                                                    <span className="text-danger font-bold">{y}Y</span>
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                    </React.Fragment>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {/* Anlık Sınıf Analizi - İçeride (Kullanıcı Talebi) */}
                    <div className="p-5 border-t border-line bg-surface-2/20">
                        <ClassInstantAnalysis
                            students={students}
                            trials={[trial]}
                            results={allResults}
                        />
                    </div>
                </div>
            )}

            {/* Student Karne Modal */}
            {selectedStudent && (
                <Modal
                    acik
                    onClose={() => setSelectedStudent(null)}
                    baslikGizle
                    genislik="xl"
                    govdeClassName="p-0 flex flex-col overflow-hidden"
                >
                    <div className="p-6 border-b border-line flex justify-between items-center shrink-0 bg-surface">
                        <div>
                            <h3 className="text-xl font-bold text-ink">{selectedStudent.result.student}</h3>
                            <p className="text-sm text-ink-2">{selectedStudent.trial.name} • {(() => { const g = GRADE_LEVELS.find(g => g.id === selectedStudent.result.gradeLevel); return g ? g.label : ''; })()}</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { try { generateStudentReport(selectedStudent.result, selectedStudent.trial, allResults); } catch (e) { setToast && setToast('PDF oluşturulurken hata: ' + e.message); } }}
                                className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-xl hover:bg-brand-hover transition text-sm font-semibold"
                            >
                                <Download size={16} /> PDF Karne
                            </button>
                            <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-surface-3 rounded-full"><X size={20} className="text-ink-2" /></button>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto p-6">
                        <ReportCard studentResults={[selectedStudent.result]} userName={selectedStudent.result.student} />
                    </div>
                </Modal>
            )}
        </div>
    );
};

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
const AdvancedExamsTab = ({ students, setToast, onOpenProgramBuilder }) => {
    const [showNewTrial, setShowNewTrial] = useState(false);
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [loadingGrade, setLoadingGrade] = useState(null); // "trialId-gradeId"
    const [editingResult, setEditingResult] = useState(null);
    const [obpUpdateToggle, setObpUpdateToggle] = useState(0); // Trigger re-render for scores

    // Veri Yapısı:
    // trials: [{id, name, examType, date}]
    // results: [{id, trialId, gradeLevel, student, subjects, totalNet, tyt, ... }]

    const [trials, setTrials] = useState(() => {
        try { return listeOku('v2_trials_data'); } catch { return []; }
    });
    const [results, setResults] = useState(() => {
        try { return listeOku('v2_results_data'); } catch { return []; }
    });

    /* ── BİRLEŞİK DENEME HATTI (04.09) ──
       Analiz OKUMA yolları koç verisi + uygulama içi deneme motorunun
       sonuçlarını tek listede görür (services/birlesikDeneme). YAZMA
       yolları (silme, Excel yükleme) yalnız v2 depolarına dokunmaya
       devam eder — motor kayıtlarının sahibi deneme_analizleri'dir. */
    const [motorTetik, setMotorTetik] = useState(0);
    useEffect(() => {
        const dinle = (e) => { if (!e?.key || e.key === 'deneme_analizleri') setMotorTetik((t) => t + 1); };
        window.addEventListener('storage', dinle);
        return () => window.removeEventListener('storage', dinle);
    }, []);
    const motorVerisi = useMemo(() => birlesikDeneme.motorKayitlari(), [motorTetik]);
    const birlesikResults = useMemo(
        () => birlesikDeneme.birlesikSonuclar(results, motorVerisi),
        [results, motorVerisi],
    );
    const birlesikTrials = useMemo(
        () => birlesikDeneme.birlesikDenemeler(trials, birlesikResults, motorVerisi),
        [trials, birlesikResults, motorVerisi],
    );

    // Prevent immediate overwrite of existing DB data on first mount
    const isFirstMountTrials = useRef(true);
    const isFirstMountResults = useRef(true);

    // 💾 Trials/Results değişince localStorage + Firebase'e yaz
    useEffect(() => {
        if (isFirstMountTrials.current) {
            isFirstMountTrials.current = false;
            return;
        }
        localStorage.setItem('v2_trials_data', JSON.stringify(trials));
        firebaseSync.syncKey('v2_trials_data').catch(() => { });
    }, [trials]);

    useEffect(() => {
        if (isFirstMountResults.current) {
            isFirstMountResults.current = false;
            return;
        }
        localStorage.setItem('v2_results_data', JSON.stringify(results));
        firebaseSync.syncKey('v2_results_data').catch(() => { });
    }, [results]);

    // 📡 Firebase real-time: başka cihazdan veri gelince state'i güncelle
    useEffect(() => {
        const handleStorageSync = (e) => {
            if (e.key === 'v2_trials_data' && e.newValue) {
                try {
                    const fresh = JSON.parse(e.newValue);
                    if (Array.isArray(fresh) && (fresh.length >= trials.length || trials.length === 0)) {
                        setTrials(fresh);
                    }
                } catch { /* ignore */ }
            }
            if (e.key === 'v2_results_data' && e.newValue) {
                try {
                    const fresh = JSON.parse(e.newValue);
                    if (Array.isArray(fresh) && (fresh.length >= results.length || results.length === 0)) {
                        setResults(fresh);
                    }
                } catch { /* ignore */ }
            }
            if (e.key === 'v2_obp_data') {
                setObpUpdateToggle(prev => prev + 1);
            }
        };

        window.addEventListener('storage', handleStorageSync);
        return () => window.removeEventListener('storage', handleStorageSync);
    }, [trials.length, results.length]); // dep olarak length kullan — sonsuz döngü önle


    // ── Yeni Deneme Oluştur ──
    const handleCreateTrial = ({ name, examType, date }) => {
        const newTrial = {
            id: Date.now(),
            name,
            examType,
            date,
            createdAt: new Date().toISOString(),
        };
        setTrials(prev => [newTrial, ...prev]);
        if (setToast) setToast(`"${name}" denemesi oluşturuldu. Şimdi sınıf listelerini yükleyebilirsiniz.`);
    };

    // ── Bireysel Sonuç Ekle ──
    const handleAddManualResult = (newResult, newTrial) => {
        // Eğer yeni deneme oluşturulduysa önce onu ekle
        if (newTrial) {
            setTrials(prev => [newTrial, ...prev]);
        }
        setResults(prev => [newResult, ...prev]);
        if (setToast) setToast(`✅ ${newResult.student} için sonuç eklendi.`);
    };

    // ── Excel Yükle (trialId + gradeId) ──
    const handleUploadGrade = async (e, trialId, gradeId, examType) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';

        const key = `${trialId}-${gradeId}`;
        setLoadingGrade(key);

        if (setToast) setToast(`${gradeId}. Sınıf listesi analiz ediliyor...`);

        try {
            let parsedOutput;

            // Use specialized parsers for TYT and AYT to handle complex multi-row headers
            if (examType === 'TYT') {
                console.log(`📊 TYT özel ayrıştırıcı kullanılıyor...`);
                parsedOutput = await parseTYTExcel(file);
            } else if (examType === 'AYT') {
                console.log(`📊 AYT özel ayrıştırıcı kullanılıyor...`);
                parsedOutput = await parseAYTExcel(file);
            } else {
                console.log(`📊 ${examType} için genel ayrıştırıcı kullanılıyor...`);
                parsedOutput = await parseExcelExamData(file, examType || 'TYT');
            }

            const rawResults = Array.isArray(parsedOutput) ? parsedOutput : parsedOutput.results;

            if (!rawResults || rawResults.length === 0) {
                bildir('Excel dosyasında öğrenci verisi bulunamadı.\n\nLütfen dosyanızı kontrol edin:\n• Öğrenci adları dolu mu?\n• D, Y, N sütunları var mı?\n• Dosya TYT formatında mı?', 'hata');
                setLoadingGrade(null);
                return;
            }

            // Debug: ilk sonucu logla
            if (rawResults[0]) {
                console.log('🔍 İlk öğrenci örneği:', {
                    student: rawResults[0].student,
                    totalNet: rawResults[0].totalNet,
                    turkce: rawResults[0].turkce || rawResults[0].subjects?.turkce?.net,
                    mat: rawResults[0].mat || rawResults[0].subjects?.mat_toplam?.net || rawResults[0].subjects?.matematik?.net,
                    fen: rawResults[0].fen || rawResults[0].subjects?.fen_toplam?.net,
                    sosyal: rawResults[0].sosyal || rawResults[0].subjects?.sosyal_toplam?.net,
                });
            }

            // Extract trial type for metadata
            const currentTrial = trials.find(t => String(t.id) === String(trialId));
            const trialExamType = currentTrial?.examType || 'TYT';

            // OBP skorunu her zaman canlı olarak hesapla (obpScore null olabilir)
            const enriched = rawResults.map((r, i) => {
                const schoolNumber = normalizeSchoolNumber(r.number || r.metadata?.['No'] || r.metadata?.['Öğrenci No'] || r.metadata?.['Okul No'] || '');
                // Her zaman canlı OBP hesapla - depolanmış null değerlere güvenme
                const obpScore = getOBPScore(r.student, schoolNumber) || 0;
                
                return {
                    ...r,
                    id: `${trialId}-${gradeId}-${Date.now()}-${i}`,
                    trialId: String(trialId),
                    gradeLevel: String(gradeId),
                    examType: String(trialExamType), // ← Her zaman trial'ın examType'ını kullan
                    uploadedAt: new Date().toISOString(),
                    fileName: file.name,
                    number: schoolNumber,
                    obpScore: obpScore
                };
            });

            // 🎯 ROBUST MERGING LOGIC (Handles multiples files, TYT+AYT, and prevents zero-overwrites)
            setResults(prevArray => {
                const resultsArray = Array.isArray(prevArray) ? prevArray : [];
                // Group results by trial and grade
                const mergedGroup = resultsArray.filter(r => String(r.trialId) === String(trialId) && String(r.gradeLevel) === String(gradeId));
                const otherResults = resultsArray.filter(r => !(String(r.trialId) === String(trialId) && String(r.gradeLevel) === String(gradeId)));
                const isCombined = ['TYT+AYT', 'TYT+YDT', 'TYT+YDS'].includes(trialExamType);

                enriched.forEach(newStud => {
                    const newNum = normalizeSchoolNumber(newStud.number);
                    const newNameNorm = normalizeName(newStud.student || newStud.name);
                    const newNameSquash = newNameNorm.replace(/\s+/g, '');
                    
                    let existingIdx = mergedGroup.findIndex(r => {
                        // 🚀 1. School Number Priority match (The ultimate source of truth)
                        const rNum = normalizeSchoolNumber(r.number || r.studentNo);
                        if (newNum && rNum && newNum === rNum) {
                            console.log(`🎯 Match found by Number: ${newNum}`, r.student);
                            return true;
                        }
                        
                        // 2. Full Name Squash match
                        const rNameNorm = normalizeName(r.student || r.name);
                        const rNameSquash = rNameNorm.replace(/\s+/g, '');
                        if (newNameSquash && rNameSquash === newNameSquash) {
                            console.log(`🎯 Match found by Name Squash: ${newNameSquash}`);
                            return true;
                        }
                        
                        // 3. Fuzzy name match (at least 2 words match)
                        const rParts = rNameNorm.split(/\s+/).filter(p => ![' ', ''].includes(p) && p.length >= 2);
                        const nParts = newNameNorm.split(/\s+/).filter(p => ![' ', ''].includes(p) && p.length >= 2);
                        const common = nParts.filter(n => rParts.some(rp => rp === n || rp.startsWith(n) || n.startsWith(rp)));
                        const isFuzzyMatch = (common.length >= 2) || (common.length >= 1 && (rParts.length === 1 || nParts.length === 1));
                        
                        // ONLY allow fuzzy name matching IF neither student has a number
                        // (prevents matching different students who share parts of names but have different numbers)
                        if (isFuzzyMatch) {
                            if (!newNum || !rNum || newNum === rNum) return true;
                        }
                        return false;
                    });

                    if (existingIdx !== -1) {
                        const existing = { ...mergedGroup[existingIdx] };
                        
                        // --- 1. Selective Subject Merge ---
                        const mergedSubjects = { ...(existing.subjects || {}) };
                        Object.entries(newStud.subjects || {}).forEach(([sKey, sVal]) => {
                            // Only overwrite IF new data has marks OR if existing was empty
                            const hasData = (sVal.d > 0 || sVal.y > 0 || sVal.net > 0);
                            const wasEmptyOrZero = !mergedSubjects[sKey] || (mergedSubjects[sKey].d === 0 && mergedSubjects[sKey].y === 0);
                            if (hasData || wasEmptyOrZero) {
                                mergedSubjects[sKey] = sVal;
                            }
                        });
                        existing.subjects = mergedSubjects;

                        // --- 2. Update Fields ---
                        if (newNum) existing.number = newNum;
                        if (newStud.obpScore > 0) existing.obpScore = newStud.obpScore;
                        
                        Object.keys(newStud).forEach(k => {
                            const isNumeric = ['tyt', 'turkce', 'mat', 'fen', 'sosyal', 'edebiyat', 'aytMat', 'geometri', 'fizik', 'kimya', 'biyoloji', 'sosyalAYT', 'dil', 'sayNet', 'eaNet', 'sozNet', 'dilNet'].includes(k);
                            if (isNumeric) {
                                if (parseFloat(newStud[k]) > 0 || existing[k] === undefined) {
                                    existing[k] = newStud[k];
                                }
                            } else if (typeof newStud[k] === 'string' && newStud[k] && !['id', 'trialId', 'gradeLevel', 'examType', 'student', 'name', 'number', 'obpScore'].includes(k)) {
                                existing[k] = newStud[k];
                            }
                        });

                        // --- 3. Recalculate Totals ---
                        if (isCombined) {
                            if (String(examType) === 'TYT') {
                                existing.tyt = parseFloat(newStud.totalNet || 0);
                            }
                            if (existing.tyt === undefined) existing.tyt = 0;
                            
                            const { sayNet, eaNet, sozNet, dilNet } = getAYTAreaNets(existing);
                            const aytMax = Math.max(sayNet, eaNet, sozNet, dilNet);
                            existing.totalNet = parseFloat(((parseFloat(existing.tyt) || 0) + aytMax).toFixed(2));
                        } else {
                            existing.totalNet = parseFloat(newStud.totalNet || 0) || existing.totalNet;
                        }

                        existing.examType = trialExamType;
                        mergedGroup[existingIdx] = existing;
                    } else {
                        // --- New Student in this grade ---
                        const brandNew = { ...newStud, examType: trialExamType };
                        if (isCombined) {
                            if (String(examType) === 'TYT') {
                                brandNew.tyt = parseFloat(newStud.totalNet || 0);
                            } else {
                                brandNew.tyt = 0;
                            }
                        }
                        mergedGroup.push(brandNew);
                    }
                });

                return [...otherResults, ...mergedGroup];
            });

            if (setToast) setToast(`✅ ${gradeId}. Sınıf - ${enriched.length} öğrenci yüklendi ve OBP eşleştirmeleri yapıldı!`);

        } catch (err) {
            console.error('Grade upload error:', err);
            bildir(hataAnlat(err, 'excel'), 'hata');
            if (setToast) setToast('❌ Yükleme sırasında hata oluştu.');
        } finally {
            setLoadingGrade(null);
        }
    };

    // ── Deneme Sil ──
    const handleDeleteTrial = (trialId) => {
        requireOwnerConfirmation('Denemeyi ve tüm sınıf verilerini sil', () => {
            setTrials(prev => prev.filter(t => String(t.id) !== String(trialId)));
            setResults(prev => prev.filter(r => String(r.trialId) !== String(trialId)));
            if (setToast) setToast('Deneme silindi.');
        });
    };

    // ── Sınıf Verisi Sil ──
    const handleDeleteGrade = (trialId, gradeId) => {
        const gradeLabel = GRADE_LEVELS.find(g => g.id === String(gradeId))?.label;
        requireOwnerConfirmation(`${gradeLabel} verilerini sil`, () => {
            setResults(prev => prev.filter(r => !(String(r.trialId) === String(trialId) && String(r.gradeLevel) === String(gradeId))));
            if (setToast) setToast(`${gradeLabel} verileri silindi.`);
        });
    };

    // ── Bireysel Sonuç Sil ──
    const handleDeleteResult = (resultId, trialId) => {
        requireOwnerConfirmation('Bu öğrencinin sonucunu sil', () => {
            const updated = results.filter(r => r.id !== resultId);
            setResults(updated);
            localStorage.setItem('v2_results_data', JSON.stringify(updated));
            firebaseSync.syncKey('v2_results_data').catch(() => { });
            if (setToast) setToast('Öğrenci sonucu silindi.');
        });
    };

    // ── Bireysel Sonuç Düzenle ──
    const handleEditResult = (result) => {
        setEditingResult(result);
    };

    const handleSaveEditedResult = (updatedResult) => {
        const updated = results.map(r => r.id === updatedResult.id ? { ...r, ...updatedResult, _v: (r._v || 0) + 1 } : r);
        setResults(updated);
        localStorage.setItem('v2_results_data', JSON.stringify(updated));
        firebaseSync.syncKey('v2_results_data').catch(() => { });
        setEditingResult(null);
        if (setToast) setToast('Sonuç güncellendi.');
        
        // Invalidate internal cache for this specific result
        clearScoreCache();
        
        // Force a storage event to sync other components if needed
        window.dispatchEvent(new StorageEvent('storage', { key: 'v2_results_data', newValue: JSON.stringify(updated) }));
    };

    // ── Kategori sistemi: TYT+AYT, Kazanım Testi, LGS
    const [examCategory, setExamCategory] = useState('TYT'); // Default to TYT
    const [kazanimGrade, setKazanimGrade] = useState('9');       // '9' | '10' | '11'
    const [expandedTrialId, setExpandedTrialId] = useState(null);
    const [trialSearchQuery, setTrialSearchQuery] = useState('');

    // Deneme tipine göre numaralandır (1.TYT, 2.TYT...) — BİRLEŞİK liste
    const numberedTrials = useMemo(() => {
        const counters = {};
        if (!Array.isArray(birlesikTrials)) return [];
        return [...birlesikTrials].filter(t => t && typeof t === 'object' && t.id).reverse().map(t => {
            const key = t.examType || 'TYT';
            counters[key] = (counters[key] || 0) + 1;
            return { ...t, number: counters[key] };
        }).reverse();
    }, [birlesikTrials]);

    // Kategoriye ve Arama Sorgusuna göre filtrele
    const filteredTrials = useMemo(() => {
        if (!numberedTrials) return [];
        let base = [];
        const isExamTypeMatch = Array.isArray(EXAM_TYPES) && EXAM_TYPES.includes(examCategory);

        if (isExamTypeMatch) {
            base = numberedTrials.filter(t => t.examType === examCategory);
        } else if (examCategory === 'kazanim') {
            const kazanimTypes = ['Kazanım', 'KAZANİM', 'kazanim', 'Kazanim', 'Sınav'];
            base = numberedTrials.filter(t =>
                t && t.examType && (kazanimTypes.some(k => t.examType.toLowerCase().includes(k.toLowerCase()) || (t.name && t.name.toLowerCase().includes(k.toLowerCase()))))
            );
        }

        if (trialSearchQuery && trialSearchQuery.trim()) {
            const q = trialSearchQuery.toLowerCase().trim();
            base = base.filter(t => t && (t.name || '').toLowerCase().includes(q));
        }
        return base;
    }, [numberedTrials, examCategory, trialSearchQuery]);

    // ── Filtrelenmiş Sonuçlar — BİRLEŞİK liste (koç + motor) ──
    const filteredResults = useMemo(() => {
        if (!Array.isArray(filteredTrials) || !Array.isArray(birlesikResults)) return [];
        const trialIds = new Set(filteredTrials.map(t => t && String(t.id)).filter(Boolean));
        let base = birlesikResults.filter(r => r && trialIds.has(String(r.trialId)));
        if (examCategory === 'kazanim') {
            base = base.filter(r => r && String(r.gradeLevel) === String(kazanimGrade));
        }
        return base;
    }, [birlesikResults, filteredTrials, examCategory, kazanimGrade]);

    // ── calculationContext: Pass once to avoid localStorage lookup in loops ──
    const calculationContext = useMemo(() => {
        let obpData = {};
        try {
            const obpRaw = localStorage.getItem('v2_obp_data');
            obpData = (obpRaw && obpRaw !== 'undefined') ? JSON.parse(obpRaw) : {};
        } catch (e) { console.error("OBP Parse Error", e); }
        return { students: Array.isArray(students) ? students : [], obpData };
    }, [students, results, obpUpdateToggle]);

    // ── Pre-group results by Trial ID for O(1) lookup — BİRLEŞİK liste ──
    const resultsByTrial = useMemo(() => {
        const map = {};
        if (!Array.isArray(birlesikResults)) return map;
        birlesikResults.forEach(r => {
            if (!r || !r.trialId) return;
            const tid = String(r.trialId);
            if (!map[tid]) map[tid] = [];
            map[tid].push(r);
        });
        return map;
    }, [birlesikResults]);


    // ── Genel İstatistikler (Filtrelenmiş) ──
    const stats = useMemo(() => {
        const totalStudents = filteredResults.length;
        
        // Group filtered results by grade
        const byGrade = {};
        filteredResults.forEach(r => {
            if (!byGrade[r.gradeLevel]) byGrade[r.gradeLevel] = 0;
            byGrade[r.gradeLevel]++;
        });

        const gradeBreakdown = GRADE_LEVELS.map(g => ({
            ...g,
            count: byGrade[g.id] || 0,
        }));

        // Deneme başarı trendi (Optimized: O(N) instead of O(N*M))
        const trendData = [...filteredTrials].filter(t => t && t.id).reverse().map(t => {
            const tResults = resultsByTrial[String(t.id)] || [];
            const avg = tResults.length > 0 
                ? (tResults.reduce((a, r) => a + (parseFloat(calculateEstimatedScore(r, calculationContext)) || 0), 0) / tResults.length)
                : 0;
            
            return {
                name: (t.name || 'Sınav').length > 12 ? (t.name || 'Sınav').slice(0, 12) + '…' : (t.name || 'Sınav'),
                ortalama: parseFloat(avg.toFixed(1))
            };
        });



        return { totalStudents, gradeBreakdown, trendData };
    }, [filteredResults, filteredTrials, resultsByTrial]);


    const tytCount = numberedTrials.filter(t => t.examType === 'TYT').length;
    const aytCount = numberedTrials.filter(t => t.examType === 'AYT').length;
    const lgsCount = numberedTrials.filter(t => t.examType === 'LGS').length;

    /* 04.09 (canlı eşleme): kokpit düzeni — başlık/çipler sabit, içerik
       kendi içinde kayar; YKS türlerinde kart-grid + arama kaldırıldı
       (gezinme, analiz panelindeki "Denemeler" listesinden). */
    return (
        <div className="space-y-6 animate-fade-in pb-20 xl:pb-0 xl:flex-1 xl:min-h-0 xl:flex xl:flex-col xl:overflow-hidden">

            {/* ── Üst Bar ── */}
            <div className="xl:shrink-0 flex justify-between items-start flex-wrap gap-3">
                <div>
                    <h2 className="text-xl font-bold text-ink flex items-center gap-2">
                        <BarChart2 className="text-c4" size={24} />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-brand">
                            Deneme Merkezi
                        </span>
                    </h2>
                    <p className="text-sm text-ink-2 mt-0.5">
                        {filteredTrials.length} {examCategory} denemesi • {stats.totalStudents} öğrenci sonucu
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setShowManualEntry(true)}
                        className="flex items-center gap-2 bg-surface border border-brand-line text-brand px-4 py-2.5 rounded-xl hover:bg-brand-soft transition font-semibold text-sm"
                    >
                        <FileText size={16} />
                        Bireysel Ekle
                    </button>
                    <button
                        onClick={() => setShowNewTrial(true)}
                        className="on-color flex items-center gap-2 bg-gradient-to-r from-purple-600 to-brand text-white px-5 py-2.5 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition shadow-lg shadow-purple-200 font-semibold"
                    >
                        <Plus size={18} />
                        Yeni Deneme Oluştur
                    </button>
                </div>
            </div>

            {/* ── Tür çipleri: YKS grubu + diğerleri + şablonlar ── */}
            <div className="xl:shrink-0 flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl"
                    style={{ background: 'color-mix(in srgb, var(--c1) 6%, var(--surface))', border: '1px solid var(--line)', boxShadow: 'inset 0 1px 0 var(--lit-soft)' }}>
                    <span className="text-[9px] font-black uppercase tracking-wider text-ink-3 px-1 hidden sm:inline">YKS</span>
                    {EXAM_TYPES.filter(t => YKS_TURLERI.has(t)).map(t => (
                        <ExamTypeChip key={t} type={t} secili={examCategory === t}
                            count={numberedTrials.filter(x => x.examType === t).length}
                            onClick={() => { setExamCategory(t); setExpandedTrialId(null); }} />
                    ))}
                </div>
                {EXAM_TYPES.filter(t => !YKS_TURLERI.has(t)).map(t => (
                    <ExamTypeChip key={t} type={t} secili={examCategory === t}
                        count={numberedTrials.filter(x => x.examType === t).length}
                        onClick={() => { setExamCategory(t); setExpandedTrialId(null); }} />
                ))}
                <div className="ml-auto flex items-center gap-2 text-xs text-ink-3">
                    <span>Şablon:</span>
                    {['TYT', 'AYT', 'LGS'].map(t => (
                        <button key={t} onClick={() => downloadTemplate(t)} className="text-brand hover:underline flex items-center gap-1">
                            <FileText size={11} /> {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Kazanım Testi: Sınıf Alt Filtresi ── */}
            {examCategory === 'kazanim' && (
                <div className="xl:shrink-0 flex items-center gap-2">
                    <span className="text-xs font-bold text-ink-2 uppercase tracking-wide">Sınıf Filtresi:</span>
                    {['9', '10', '11'].map(grade => (
                        <button
                            key={grade}
                            onClick={() => setKazanimGrade(grade)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition border-2 ${kazanimGrade === grade
                                ? 'bg-ok text-white border-emerald-600'
                                : 'bg-surface text-ink-2 border-line hover:border-ok'
                                }`}
                        >
                            {grade}. Sınıf
                        </button>
                    ))}
                    <span className="text-xs text-ink-3 ml-2">
                        {filteredTrials.length} deneme görüntüleniyor
                    </span>
                </div>
            )}

            {/* ── İçerik — masaüstünde kendi içinde kayar ── */}
            <div className="xl:flex-1 xl:min-h-0 xl:overflow-y-auto tek-ekran-govde space-y-6 xl:pr-1.5">
                {examCategory === 'curriculum' ? (
                    <CurriculumManager />
                ) : examCategory === 'OBP' ? (
                    <OBPManager />
                ) : filteredTrials.length === 0 ? (
                    <div className="text-center py-16 bg-surface rounded-2xl border-2 border-dashed border-line">
                        <div className="w-16 h-16 bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <BarChart2 size={32} className="text-c4" />
                        </div>
                        <h3 className="text-lg font-bold text-ink-2 mb-2">
                            {examCategory === 'kazanim' ? `${kazanimGrade}. Sınıf kazanım testi yok` : `${examCategory} denemesi yok`}
                        </h3>
                        <p className="text-ink-3 text-sm mb-5">Yeni deneme oluşturarak başla.</p>
                        <button
                            onClick={() => setShowNewTrial(true)}
                            className="inline-flex items-center gap-2 bg-c4 text-white px-6 py-3 rounded-xl font-semibold hover:bg-c4 transition"
                        >
                            <Plus size={18} /> Deneme Oluştur
                        </button>
                    </div>
                ) : EXAM_TYPES.includes(examCategory) ? null : (
                    // Kazanım — düz kart grid (YKS türlerinde gezinme analiz panelinde)
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-3">
                            {filteredTrials.map(trial => {
                                const trialFullResults = resultsByTrial[String(trial.id)] || [];
                                const trialResults = examCategory === 'kazanim'
                                    ? trialFullResults.filter(r => String(r.gradeLevel) === String(kazanimGrade))
                                    : trialFullResults;

                                const avgNet = trialResults.length > 0
                                    ? (trialResults.reduce((a, r) => a + (parseFloat(getTotalNet(r)) || 0), 0) / trialResults.length).toFixed(1)
                                    : null;
                                const isExpanded = expandedTrialId === trial.id;
                                const accentColor = examCategory === 'lgs' ? 'amber' : 'emerald';

                                return (
                                    <button
                                        key={trial.id}
                                        onClick={() => setExpandedTrialId(isExpanded ? null : trial.id)}
                                        className={`relative rounded-2xl p-4 text-left border-2 transition-all hover:shadow-md ${isExpanded
                                            ? `bg-${accentColor}-600 border-${accentColor}-600 text-ink shadow-lg`
                                            : `bg-surface border-line hover:border-${accentColor}-300`
                                            }`}
                                    >
                                        <div className={`text-xs font-black uppercase mb-2 ${isExpanded ? `text-${accentColor}-200` : `text-${accentColor}-600`
                                            }`}>{trial.number}. {trial.examType}</div>
                                        <div className={`text-sm font-bold truncate mb-1 ${isExpanded ? 'text-ink' : 'text-ink'
                                            }`}>{trial.name}</div>
                                        <div className={`text-xs ${isExpanded ? `text-${accentColor}-200` : 'text-ink-3'
                                            }`}>
                                            {trialFullResults.length > 0 ? `${trialFullResults.length} öğrenci` : 'Veri yok'}
                                        </div>

                                        {avgNet && (
                                            <div className={`mt-2 text-lg font-black ${isExpanded ? 'text-ink' : `text-${accentColor}-600`
                                                }`}>
                                                {avgNet} <span className="text-xs font-normal">ort.</span>
                                            </div>
                                        )}
                                        {isExpanded && (
                                            <div className="absolute top-2 right-2 w-5 h-5 bg-surface/20 rounded-full flex items-center justify-center">
                                                <ChevronDown size={12} className="text-ink" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {filteredTrials.length > 0 && examCategory !== 'curriculum' && examCategory !== 'OBP' && (
                    <div className="space-y-6">
                        <ExamAnalyticsPanel
                            trials={filteredTrials}
                            results={filteredResults}
                            activeCategory={examCategory}
                            expandedTrialId={expandedTrialId}
                            setExpandedTrialId={setExpandedTrialId}
                            setToast={setToast}
                        />

                        {/* ── Seçili Deneme Açılır Detayı ── */}
                        {expandedTrialId && (() => {
                            const trial = trials.find(t => t.id === expandedTrialId);
                            if (!trial) return null;
                            return (
                                <div className="animate-fade-in border-2 border-brand-line rounded-2xl overflow-hidden shadow-lg">
                                    <div className="on-color bg-gradient-to-r from-brand to-purple-600 px-5 py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <BarChart2 size={18} className="text-ink-2" />
                                            <h3 className="text-ink font-bold">{trial.name}</h3>
                                            <span className="bg-surface/20 text-ink text-xs font-bold px-2 py-0.5 rounded-full">{trial.examType}</span>
                                        </div>
                                        <button
                                            onClick={() => setExpandedTrialId(null)}
                                            className="p-1.5 bg-surface/10 hover:bg-surface/30 rounded-full transition"
                                        >
                                            <X size={16} className="text-ink" />
                                        </button>
                                    </div>
                                    <div className="bg-surface">
                                        <TrialCard
                                            trial={trial}
                                            allResults={resultsByTrial[String(trial.id)] || []}
                                            students={students}
                                            calculationContext={calculationContext}
                                            onDelete={(id) => { handleDeleteTrial(id); setExpandedTrialId(null); }}
                                            onUploadGrade={handleUploadGrade}
                                            onDeleteGrade={handleDeleteGrade}
                                            onDeleteResult={handleDeleteResult}
                                            onEditResult={handleEditResult}
                                            onViewStudent={(s) => { }}
                                            loadingGrade={loadingGrade}
                                            setToast={setToast}
                                            defaultExpanded={true}
                                        />
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* ── Modals ── */}
            {showNewTrial && (
                <NewTrialModal
                    onClose={() => setShowNewTrial(false)}
                    onCreate={handleCreateTrial}
                    initialExamType={EXAM_TYPES.includes(examCategory) ? examCategory : 'TYT'}
                />
            )}
            {showManualEntry && (
                <ManualResultModal
                    onClose={() => setShowManualEntry(false)}
                    onSave={handleAddManualResult}
                    trials={trials}
                    initialExamType={EXAM_TYPES.includes(examCategory) ? examCategory : 'TYT'}
                />
            )}
            {editingResult && (
                <ManualResultModal
                    onClose={() => setEditingResult(null)}
                    onSave={handleSaveEditedResult}
                    trials={trials}
                    initialData={editingResult}
                />
            )}
        </div>
    );
};

export default AdvancedExamsTab;
