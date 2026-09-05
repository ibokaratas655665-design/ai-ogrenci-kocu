import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, Plus, Trash2, Edit2, X, GraduationCap, Building2, Award, Save, CheckCircle, BookOpen, Star, ChevronDown, ChevronUp, Rocket } from 'lucide-react';
import jsPDF from 'jspdf';
import { AYT_PROGRAMS, TYT_PROGRAMS, YDT_PROGRAMS, GELECEK_PROGRAMS } from '../../data/universityScoresData';
import { AMBLEM_BASE64 } from '../../data/amblemBase64';
import { bildir, onayla } from '../../services/uiGeriBildirim';
import Modal from '../ui/Modal';

const STORAGE_KEY = 'university_scores_v2';
const YEAR_KEY = 'university_scores_year';

const PUAN_COLORS = {
  SAY: { card:'from-blue-600/20 to-cyan-500/10', border:'border-info/30', badge:'bg-info/20 text-info', accent:'var(--info)' },
  EA: { card:'from-purple-600/20 to-fuchsia-500/10', border:'border-purple-500/30', badge:'bg-c4/20 text-c4', accent:'var(--c4)' },
  'SÖZ': { card:'from-amber-600/20 to-orange-500/10', border:'border-warn/30', badge:'bg-warn/20 text-warn', accent:'var(--warn)' },
  TYT: { card:'from-emerald-600/20 to-teal-500/10', border:'border-ok/30', badge:'bg-ok/20 text-ok', accent:'var(--ok)' },
  'DİL': { card:'from-rose-600/20 to-pink-500/10', border:'border-danger/30', badge:'bg-danger/20 text-danger', accent:'var(--c5)' },
};
const gc = (t) => PUAN_COLORS[t] || PUAN_COLORS.TYT;

const StatBox = ({ icon: I, label, value, color }) => (
  <div className={`bg-gradient-to-br ${color} border border-line rounded-3xl p-5`}>
    <div className="flex items-center justify-between mb-2"><I size={18} className="opacity-60 text-ink" /><span className="text-3xl font-black text-ink syne">{value}</span></div>
    <p className="text-[10px] font-black text-ink-3 uppercase tracking-widest">{label}</p>
  </div>
);

const NetChip = ({ label, value, color = 'text-ink' }) => value != null ? (
  <div className="bg-surface/5 rounded-xl px-3 py-2 text-center min-w-[60px]">
    <p className="text-[8px] text-ink-3 font-bold uppercase mb-0.5">{label}</p>
    <p className={`text-sm font-black ${color}`}>{value}</p>
  </div>
) : null;

const ProgramCard = ({ item, onEdit, onDelete, idx }) => {
  const [open, setOpen] = useState(false);
  const c = gc(item.puan);
  return (
    <div className={`bg-gradient-to-br ${c.card} border ${c.border} rounded-3xl overflow-hidden transition-all duration-yavas hover:border-line-2 group`}>
      <div className="flex items-center gap-4 p-5 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="w-11 h-11 bg-surface/5 rounded-2xl flex items-center justify-center flex-shrink-0"><span className="text-lg font-black text-ink-2">{idx+1}</span></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${c.badge}`}>{item.puan}</span>
            <span className="text-[10px] text-ink-3 flex items-center gap-1"><Building2 size={10}/>{item.sehir}</span>
          </div>
          <p className="font-black text-ink text-sm truncate">{item.bolum}</p>
          <p className="text-[11px] text-ink-3 truncate">{item.uni}</p>
        </div>
        <div className="hidden md:flex items-center gap-5 flex-shrink-0">
          <div className="text-right"><p className="text-[9px] text-ink-3 uppercase font-bold">Taban</p><p className="text-xl font-black" style={{color:c.accent}}>{item.taban?.toFixed(2)}</p></div>
          <div className="text-right"><p className="text-[9px] text-ink-3 uppercase font-bold">Sıralama</p><p className="text-xl font-black text-ink">{item.siralama?.toLocaleString('tr-TR')}</p></div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
          <button onClick={e=>{e.stopPropagation();onEdit(item)}} className="p-2 hover:bg-surface/10 rounded-xl text-ink-3 hover:text-ink transition"><Edit2 size={14}/></button>
          <button onClick={e=>{e.stopPropagation();onDelete(item.id)}} className="p-2 hover:bg-danger/10 rounded-xl text-ink-3 hover:text-danger transition"><Trash2 size={14}/></button>
        </div>
        <div className="flex-shrink-0">{open?<ChevronUp size={16} className="text-ink-3"/>:<ChevronDown size={16} className="text-ink-3"/>}</div>
      </div>
      {open && (
        <div className="px-5 pb-5 border-t border-line animate-fade-in">
          <div className="mt-4 bg-page/50 rounded-2xl p-4">
            <h4 className="text-[9px] font-black text-brand uppercase tracking-[0.2em] mb-3">{item.uni} — SON YERLEŞENİN BİLGİLERİ</h4>
            <div className="flex flex-wrap gap-2">
              <NetChip label="TYT Türkçe" value={item.tytTurkce} color="text-danger"/>
              <NetChip label="TYT Mat" value={item.tytMat} color="text-info"/>
              <NetChip label="TYT Fen" value={item.tytFen} color="text-ok"/>
              <NetChip label="TYT Sosyal" value={item.tytSosyal} color="text-warn"/>
              <NetChip label="AYT Mat" value={item.aytMat} color="text-brand"/>
              <NetChip label="AYT Fen" value={item.aytFen} color="text-info"/>
              <NetChip label="AYT Edeb." value={item.aytEdebiyat} color="text-c5"/>
              <NetChip label="AYT Tarih" value={item.aytTarih} color="text-warn"/>
              <NetChip label="YDT Net" value={item.ydtNet} color="text-danger"/>
              <NetChip label="OBP" value={item.obp} color="text-brand"/>
              <NetChip label="Puan" value={item.taban?.toFixed(2)} color="text-ink"/>
              <NetChip label="Sıralama" value={item.siralama?.toLocaleString('tr-TR')} color="text-c4"/>
              <NetChip label="Kontenjan" value={item.kontenjan} color="text-ink-3"/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Section = ({ title, subtitle, color, data, search, onEdit, onDelete }) => {
  const f = data.filter(d => !search || d.bolum.toLowerCase().includes(search.toLowerCase()) || d.uni.toLowerCase().includes(search.toLowerCase()) || d.sehir?.toLowerCase().includes(search.toLowerCase()));
  if (f.length === 0 && search) return null;
  return (
    <div>
      <div className="flex items-center gap-3 mb-4"><div className={`w-1.5 h-8 rounded-full ${color}`}/><div><h3 className="text-lg font-black text-ink syne uppercase">{title}</h3><p className="text-[10px] text-ink-3 font-bold tracking-wider">{subtitle}</p></div></div>
      <div className="space-y-3">{f.map((item,idx)=><ProgramCard key={item.id} item={item} idx={idx} onEdit={onEdit} onDelete={onDelete}/>)}</div>
    </div>
  );
};

const trToEn = (text) => {
  if (!text) return '';
  const charMap = { 'ğ':'g', 'Ğ':'G', 'ü':'u', 'Ü':'U', 'ş':'s', 'Ş':'S', 'ı':'i', 'İ':'I', 'ö':'o', 'Ö':'O', 'ç':'c', 'Ç':'C' };
  return text.toString().replace(/[ğĞüÜşŞıİöÖçÇ]/g, match => charMap[match]);
};

// ─── PDF: Kutucuklu Tasarım ───
const generateCardPDF = (allData, year, stats) => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297;
  const today = new Date().toLocaleDateString('tr-TR');

  const CARD_COLORS = [
    [59, 130, 246],  // blue
    [16, 185, 129],  // emerald
    [139, 92, 246],  // violet
    [245, 158, 11],  // amber
    [236, 72, 153],  // pink
    [14, 165, 233],  // sky
    [249, 115, 22],  // orange
    [34, 197, 94],   // green
    [99, 102, 241],  // indigo
    [244, 63, 94]    // rose
  ];

  // Header
  pdf.setFillColor(7, 8, 15); pdf.rect(0, 0, W, 28, 'F');
  pdf.setFillColor(201, 168, 76); pdf.rect(0, 26, W, 2, 'F');
  pdf.setTextColor(201, 168, 76); pdf.setFontSize(16); pdf.setFont('helvetica', 'bold');
  pdf.text(`UNIVERSITE TABAN PUANLARI - ${year} YKS`, 15, 14);
  pdf.setFontSize(8); pdf.setTextColor(180,180,180);
  pdf.text(`${stats.total} Bolum | ${today}`, 15, 22);
  // Sağ üstte marka amblemi — koçluk çıktısı, resmî evrak değil
  pdf.setFillColor(255, 255, 255); pdf.circle(W - 22, 12, 7, 'F');
  try { pdf.addImage(AMBLEM_BASE64, 'PNG', W - 27, 7, 10, 10); } catch { /* amblemsiz de basılır */ }
  pdf.setFontSize(6.5); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(255, 255, 255);
  pdf.text('Basari Kampi Kocluk Platformu', W - 22, 24, { align: 'center' });

  let y = 34;
  const cardW = W - 20;
  const cardH = 38;

  const drawCard = (item, idx, baseColorIndex) => {
    if (y + cardH > H - 15) { pdf.addPage(); y = 15; }
    
    // Choose dynamic color
    const sectionColor = CARD_COLORS[(baseColorIndex + idx) % CARD_COLORS.length];

    // Card background
    pdf.setFillColor(243, 244, 250); pdf.roundedRect(10, y, cardW, cardH, 3, 3, 'F');
    pdf.setDrawColor(...sectionColor); pdf.setLineWidth(0.8);
    pdf.roundedRect(10, y, cardW, cardH, 3, 3, 'S');

    // Left: number badge
    pdf.setFillColor(...sectionColor); pdf.roundedRect(12, y+2, 12, 12, 2, 2, 'F');
    pdf.setTextColor(255,255,255); pdf.setFontSize(9); pdf.setFont('helvetica', 'bold');
    pdf.text(String(idx+1), 18, y+9.5, {align:'center'});

    // Bolum & Uni (Fix TR chars)
    pdf.setTextColor(20,20,40); pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
    pdf.text(trToEn(item.bolum || '').substring(0, 40), 28, y+7);
    pdf.setTextColor(100,100,120); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal');
    pdf.text(trToEn(`${item.uni||''} - ${item.sehir||''}`), 28, y+12);

    // Puan type badge
    pdf.setFillColor(230,230,240); pdf.roundedRect(28, y+14, 14, 5, 1, 1, 'F');
    pdf.setTextColor(80,80,120); pdf.setFontSize(5.5); pdf.setFont('helvetica', 'bold');
    pdf.text(trToEn(item.puan || ''), 35, y+17.5, {align:'center'});

    // Taban & Siralama (right side, prominent)
    pdf.setTextColor(...sectionColor); pdf.setFontSize(14); pdf.setFont('helvetica', 'bold');
    pdf.text(item.taban ? item.taban.toFixed(2) : '-', cardW - 5, y+8, {align:'right'});
    pdf.setTextColor(80,80,120); pdf.setFontSize(7);
    pdf.text(`Siralama: ${item.siralama ? item.siralama.toLocaleString('tr-TR') : '-'}`, cardW - 5, y+13, {align:'right'});

    // Net boxes - ALL subjects
    const netY = y + 20;
    const allNets = [
      { l:'TYT Trk', v:item.tytTurkce },
      { l:'TYT Mat', v:item.tytMat },
      { l:'TYT Fen', v:item.tytFen },
      { l:'TYT Sos', v:item.tytSosyal },
      { l:'AYT Mat', v:item.aytMat },
      { l:'AYT Fen', v:item.aytFen },
      { l:'AYT Ed', v:item.aytEdebiyat },
      { l:'AYT Tar', v:item.aytTarih },
      { l:'YDT', v:item.ydtNet },
      { l:'OBP', v:item.obp },
      { l:'Kont.', v:item.kontenjan },
    ].filter(n => n.v != null);

    const boxW = Math.min(16, (cardW - 10) / allNets.length);
    let bx = 12;
    allNets.forEach(n => {
      pdf.setFillColor(230, 235, 250); pdf.roundedRect(bx, netY, boxW - 1, 14, 1.5, 1.5, 'F');
      pdf.setTextColor(120,120,140); pdf.setFontSize(4.5); pdf.setFont('helvetica', 'bold');
      pdf.text(n.l, bx + (boxW-1)/2, netY + 4, {align:'center'});
      pdf.setTextColor(30,30,60); pdf.setFontSize(8); pdf.setFont('helvetica', 'bold');
      pdf.text(String(n.v), bx + (boxW-1)/2, netY + 11, {align:'center'});
      bx += boxW;
    });

    y += cardH + 4;
  };

  const drawSectionTitle = (title, color) => {
    if (y + 12 > H - 15) { pdf.addPage(); y = 15; }
    pdf.setFillColor(...color); pdf.roundedRect(10, y, cardW, 10, 2, 2, 'F');
    pdf.setTextColor(255,255,255); pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
    pdf.text(trToEn(title), 15, y+7);
    y += 14;
  };

  drawSectionTitle(`AYT - 4 YILLIK BOLUMLER (${allData.ayt.length})`, [59, 130, 246]);
  allData.ayt.forEach((item, i) => drawCard(item, i, 0));

  drawSectionTitle(`TYT - 2 YILLIK BOLUMLER (${allData.tyt.length})`, [16, 185, 129]);
  allData.tyt.forEach((item, i) => drawCard(item, i, 3));

  drawSectionTitle(`YDT - YABANCI DIL BOLUMLERI (${allData.ydt.length})`, [244, 63, 94]);
  allData.ydt.forEach((item, i) => drawCard(item, i, 6));

  drawSectionTitle(`GELECEGIN BOLUMLERI (${allData.gelecek.length})`, [168, 85, 247]);
  allData.gelecek.forEach((item, i) => drawCard(item, i, 2));

  // Footer on last page
  pdf.setFontSize(6); pdf.setTextColor(150,150,150);
  pdf.text(trToEn('Bu rapor Basari Kampi Kocluk Platformu tarafindan olusturulmustur. YOK Atlas verilerine dayanmaktadir.'), W/2, H-5, {align:'center'});

  pdf.save(`Taban_Puanlari_${year}_Rapor.pdf`);
};

// ─── MAIN ───
const UniversityScoresTab = () => {
  const [year, setYear] = useState(() => localStorage.getItem(YEAR_KEY) || '2025');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editSection, setEditSection] = useState('ayt');

  const [allData, setAllData] = useState(() => {
    try { 
      const s = localStorage.getItem(STORAGE_KEY); 
      if (s) { 
        const p = JSON.parse(s); 
        if (p.ayt) {
          // Sync missing defaults if default array grew
          const checkAndMerge = (localArr, defArr) => {
            if (!localArr) return defArr;
            const merged = [...localArr];
            defArr.forEach(def => { if (!merged.find(m => m.id === def.id)) merged.push(def); });
            return merged;
          };
          return { 
            ...p, 
            ayt: checkAndMerge(p.ayt, AYT_PROGRAMS),
            tyt: checkAndMerge(p.tyt, TYT_PROGRAMS),
            ydt: checkAndMerge(p.ydt, YDT_PROGRAMS),
            gelecek: checkAndMerge(p.gelecek, GELECEK_PROGRAMS)
          }; 
        } 
      } 
    } catch {}
    return { ayt: AYT_PROGRAMS, tyt: TYT_PROGRAMS, ydt: YDT_PROGRAMS, gelecek: GELECEK_PROGRAMS };
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(allData)); }, [allData]);
  useEffect(() => { localStorage.setItem(YEAR_KEY, year); }, [year]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  const stats = useMemo(() => ({ ayt: allData.ayt.length, tyt: allData.tyt.length, ydt: allData.ydt.length, gelecek: allData.gelecek.length, total: allData.ayt.length + allData.tyt.length + allData.ydt.length + allData.gelecek.length }), [allData]);

  const handleDelete = async (id) => {
    if (!(await onayla({ mesaj: 'Silmek istediğinize emin misiniz?', tehlikeli: true }))) return;
    setAllData(p => ({ ayt: p.ayt.filter(d=>d.id!==id), tyt: p.tyt.filter(d=>d.id!==id), ydt: p.ydt.filter(d=>d.id!==id), gelecek: p.gelecek.filter(d=>d.id!==id) }));
    setToast('Silindi.');
  };

  const handleEdit = (item) => {
    const section = allData.ayt.find(d=>d.id===item.id)?'ayt':allData.tyt.find(d=>d.id===item.id)?'tyt':allData.ydt.find(d=>d.id===item.id)?'ydt':'gelecek';
    setEditItem(item); setEditSection(section); setShowModal(true);
  };

  const handleSave = (data, section) => {
    if (editItem) { setAllData(p => ({ ...p, [section]: p[section].map(d => d.id === editItem.id ? { ...d, ...data } : d) })); setToast('Güncellendi!'); }
    else { setAllData(p => ({ ...p, [section]: [...p[section], { ...data, id: `${section}_${Date.now()}` }] })); setToast('Eklendi!'); }
    setShowModal(false); setEditItem(null);
  };

  return (
    /* 05.09: kokpit zinciri (canlı 04.09) — başlık/istatistik/arama sabit,
       bölüm listeleri kendi gövdesinde kayar. */
    <div className="space-y-6 animate-fade-in xl:flex-1 xl:min-h-0 xl:flex xl:flex-col xl:overflow-hidden">
      {toast && <div className="fixed top-8 left-1/2 -translate-x-1/2 z-notify px-6 py-3 rounded-full bg-surface border border-line text-ink text-sm font-bold flex items-center gap-2 shadow-2xl"><CheckCircle size={16} className="text-ok"/>{toast}</div>}

      <div className="xl:shrink-0 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-surface/40 backdrop-blur-xl border border-line p-8 rounded-[2rem]">
        <div className="min-w-0">
          {/* flex-wrap ŞART: sarımsız flex üç sözcüğü tek satıra kilitleyip
              375px'te sayfayı ~490px yana taşırıyordu (ölçüldü). */}
          <h2 className="text-2xl sm:text-3xl font-black text-ink syne flex flex-wrap items-center gap-3 uppercase">
            <div className="w-10 h-10 bg-gradient-to-br from-brand/20 to-accent/20 rounded-xl flex items-center justify-center"><GraduationCap className="text-brand" size={20}/></div>
            ÜNİVERSİTE <em className="not-italic text-brand">TABAN</em> PUANLARI
          </h2>
          <p className="text-[10px] text-accent font-black tracking-[0.2em] mt-1 lg:ml-12 uppercase">{year} YKS — HER BÖLÜMÜN EN DÜŞÜK PUANLA ALIM YAPAN ÜNİVERSİTESİ</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={year} onChange={e=>setYear(e.target.value)} className="px-4 py-2.5 bg-surface/5 border border-line rounded-2xl text-sm text-ink outline-none cursor-pointer">
            <option value="2025">2025</option><option value="2024">2024</option><option value="2023">2023</option>
          </select>
          <button onClick={()=>{setEditItem(null);setEditSection('ayt');setShowModal(true)}} className="px-5 py-2.5 bg-brand text-ink-on rounded-2xl font-black text-[10px] tracking-widest uppercase flex items-center gap-2 hover:scale-105 transition shadow-lg shadow-e2"><Plus size={14}/>EKLE</button>
          <button onClick={()=>{generateCardPDF(allData, year, stats); setToast('PDF indirildi!')}} className="px-5 py-2.5 bg-surface/5 border border-line text-ink rounded-2xl font-black text-[10px] tracking-widest uppercase flex items-center gap-2 hover:border-accent/40 transition"><Download size={14}/>PDF İNDİR</button>
        </div>
      </div>

      <div className="xl:shrink-0 grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatBox icon={BookOpen} label="Toplam" value={stats.total} color="from-brand/20 to-brand/5"/>
        <StatBox icon={GraduationCap} label="AYT (4 Yıllık)" value={stats.ayt} color="from-blue-500/20 to-blue-500/5"/>
        <StatBox icon={Award} label="TYT (2 Yıllık)" value={stats.tyt} color="from-emerald-500/20 to-emerald-500/5"/>
        <StatBox icon={Star} label="YDT (Dil)" value={stats.ydt} color="from-rose-500/20 to-rose-500/5"/>
        <StatBox icon={Rocket} label="Gelecek" value={stats.gelecek} color="from-purple-500/20 to-purple-500/5"/>
      </div>

      <div className="xl:shrink-0 relative"><Search size={16} className="absolute left-4 top-3.5 text-ink-3"/>
        <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Bölüm, üniversite veya şehir ara..."
          className="w-full pl-11 pr-4 py-3 bg-surface/40 border border-line rounded-2xl text-sm text-ink placeholder-white/20 outline-none focus:border-brand/40 transition"/>
      </div>

      <div className="xl:flex-1 xl:min-h-0 xl:overflow-y-auto tek-ekran-govde space-y-6 xl:pr-1.5">
      <Section title="AYT — 4 Yıllık Bölümler" subtitle={`En çok tercih edilen ${allData.ayt.length} lisans programı`} color="bg-info" data={allData.ayt} search={search} onEdit={handleEdit} onDelete={handleDelete}/>
      <Section title="TYT — 2 Yıllık Bölümler" subtitle={`En çok tercih edilen ${allData.tyt.length} ön lisans programı`} color="bg-ok" data={allData.tyt} search={search} onEdit={handleEdit} onDelete={handleDelete}/>
      <Section title="YDT — Yabancı Dil Bölümleri" subtitle={`En çok tercih edilen ${allData.ydt.length} dil programı`} color="bg-danger" data={allData.ydt} search={search} onEdit={handleEdit} onDelete={handleDelete}/>
      <Section title="Geleceğin Bölümleri" subtitle={`Yükselen trendler — ${allData.gelecek.length} yeni nesil program`} color="bg-c4" data={allData.gelecek} search={search} onEdit={handleEdit} onDelete={handleDelete}/>
      </div>

      {showModal && <EditModal item={editItem} section={editSection} onSave={handleSave} onClose={()=>{setShowModal(false);setEditItem(null)}} onSectionChange={setEditSection}/>}
    </div>
  );
};

const EditModal = ({ item, section, onSave, onClose, onSectionChange }) => {
  const [s, setS] = useState(section);
  const [f, setF] = useState({
    bolum:item?.bolum||'', uni:item?.uni||'', sehir:item?.sehir||'', puan:item?.puan||'SAY',
    taban:item?.taban||'', siralama:item?.siralama||'', kontenjan:item?.kontenjan||'',
    tytTurkce:item?.tytTurkce??'', tytMat:item?.tytMat??'', tytFen:item?.tytFen??'', tytSosyal:item?.tytSosyal??'',
    aytMat:item?.aytMat??'', aytFen:item?.aytFen??'', aytEdebiyat:item?.aytEdebiyat??'', aytTarih:item?.aytTarih??'',
    ydtNet:item?.ydtNet??'', obp:item?.obp??'',
  });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const ic = "w-full px-3 py-2 bg-surface/5 border border-line rounded-xl text-sm text-ink placeholder-white/20 outline-none focus:border-brand/40";
  const lc = "text-[9px] font-black text-ink-3 uppercase tracking-wider mb-1 block";

  const submit = () => {
    if (!f.bolum||!f.uni) { bildir('Bölüm ve üniversite adı zorunludur!'); return; }
    const d = { ...f, taban:parseFloat(f.taban)||0, siralama:parseInt(f.siralama)||0, kontenjan:parseInt(f.kontenjan)||0,
      tytTurkce:f.tytTurkce!==''?parseFloat(f.tytTurkce):null, tytMat:f.tytMat!==''?parseFloat(f.tytMat):null,
      tytFen:f.tytFen!==''?parseFloat(f.tytFen):null, tytSosyal:f.tytSosyal!==''?parseFloat(f.tytSosyal):null,
      aytMat:f.aytMat!==''?parseFloat(f.aytMat):null, aytFen:f.aytFen!==''?parseFloat(f.aytFen):null,
      aytEdebiyat:f.aytEdebiyat!==''?parseFloat(f.aytEdebiyat):null, aytTarih:f.aytTarih!==''?parseFloat(f.aytTarih):null,
      ydtNet:f.ydtNet!==''?parseFloat(f.ydtNet):null, obp:f.obp!==''?parseFloat(f.obp):null };
    onSave(d, s);
  };

  return (
    <Modal
        acik
        onClose={onClose}
        baslikGizle
        genislik="lg"
        govdeClassName="p-6"
    >
    <div className="flex items-center justify-between mb-5">
      <h3 className="text-lg font-black text-ink syne uppercase flex items-center gap-2"><GraduationCap className="text-brand" size={20}/>{item?'DÜZENLE':'YENİ EKLE'}</h3>
      <button onClick={onClose} className="p-2 hover:bg-surface/10 rounded-xl text-ink-3 hover:text-ink"><X size={18}/></button>
    </div>
    {!item && (
      <div className="flex gap-2 mb-4 flex-wrap">
        {[['ayt','AYT'],['tyt','TYT'],['ydt','YDT'],['gelecek','Gelecek']].map(([k,l])=>(
          <button key={k} onClick={()=>{setS(k);onSectionChange(k)}} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition ${s===k?'bg-brand text-ink-on':'bg-surface/5 text-ink-3 hover:text-ink'}`}>{l}</button>
        ))}
      </div>
    )}
    <div className="grid grid-cols-2 gap-3 mb-4">
      <div><label className={lc}>Bölüm *</label><input value={f.bolum} onChange={e=>set('bolum',e.target.value)} className={ic}/></div>
      <div><label className={lc}>Üniversite *</label><input value={f.uni} onChange={e=>set('uni',e.target.value)} className={ic}/></div>
      <div><label className={lc}>Şehir</label><input value={f.sehir} onChange={e=>set('sehir',e.target.value)} className={ic}/></div>
      <div className="flex gap-2">
        <div className="flex-1"><label className={lc}>Puan</label><select value={f.puan} onChange={e=>set('puan',e.target.value)} className={ic}><option value="SAY">SAY</option><option value="EA">EA</option><option value="SÖZ">SÖZ</option><option value="TYT">TYT</option><option value="DİL">DİL</option></select></div>
        <div className="flex-1"><label className={lc}>Kont.</label><input type="number" value={f.kontenjan} onChange={e=>set('kontenjan',e.target.value)} className={ic}/></div>
      </div>
      <div><label className={lc}>Taban Puan</label><input type="number" step="0.01" value={f.taban} onChange={e=>set('taban',e.target.value)} className={ic}/></div>
      <div><label className={lc}>Sıralama</label><input type="number" value={f.siralama} onChange={e=>set('siralama',e.target.value)} className={ic}/></div>
    </div>
    <p className="text-[9px] font-black text-brand uppercase tracking-[0.15em] mb-2">SON YERLEŞENİN NETLERİ</p>
    <div className="grid grid-cols-4 gap-2 mb-4">
      {[['tytTurkce','TYT Trk'],['tytMat','TYT Mat'],['tytFen','TYT Fen'],['tytSosyal','TYT Sos'],['aytMat','AYT Mat'],['aytFen','AYT Fen'],['aytEdebiyat','AYT Ed'],['aytTarih','AYT Tar'],['ydtNet','YDT'],['obp','OBP']].map(([k,l])=>(
        <div key={k}><label className={lc}>{l}</label><input type="number" step="0.5" value={f[k]} onChange={e=>set(k,e.target.value)} placeholder="-" className={ic}/></div>
      ))}
    </div>
    <div className="pencere-alt-cubuk bg-surface flex justify-end gap-3 pt-3 border-t border-line">
      <button onClick={onClose} className="px-5 py-2.5 bg-surface/5 border border-line text-ink-2 rounded-2xl font-bold text-sm hover:text-ink transition">İptal</button>
      <button onClick={submit} className="px-6 py-2.5 bg-brand text-ink-on rounded-2xl font-black text-sm hover:scale-105 transition flex items-center gap-2 shadow-lg shadow-e2"><Save size={14}/>{item?'GÜNCELLE':'KAYDET'}</button>
    </div>
    </Modal>
  );
};

export default UniversityScoresTab;
