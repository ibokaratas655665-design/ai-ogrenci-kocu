/**
 * 📄 BEP BELGE ÜRETİCİSİ
 *
 * BEP sürecinin resmî çıktılarını PDF olarak üretir:
 *   - BEP Planı
 *   - BEP Geliştirme Birimi Toplantı Tutanağı
 *   - Performans Değerlendirme Formu
 *   - Bireysel Gelişim Raporu
 *   - BEP Öğrenci Listesi (okul geneli)
 *
 * jsPDF'in yerleşik fontları Türkçe karakterleri tam desteklemediği için
 * belgeler HTML olarak kurulup html2canvas ile görüntüye çevriliyor.
 * Böylece ş/ğ/ı/İ sorunsuz çıkıyor ve düzen birebir korunuyor.
 */

const A4 = { w: 210, h: 297 };

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const styles = `
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #0F172A; }
  .doc { width: 794px; padding: 36px 40px; background: #fff; }
  .band { background: linear-gradient(115deg,#4338CA 0%,#6D28D9 50%,#A21CAF 100%);
          color: #fff; border-radius: 14px; padding: 16px 20px; margin-bottom: 18px; }
  .band .kicker { font-size: 9px; letter-spacing: .28em; font-weight: 800; opacity: .7; text-transform: uppercase; }
  .band h1 { font-size: 20px; font-weight: 900; margin-top: 3px; letter-spacing: -.3px; }
  .band .meta { font-size: 10.5px; opacity: .85; margin-top: 5px; }
  h2 { font-size: 11px; text-transform: uppercase; letter-spacing: .16em; color: #64748B;
       font-weight: 800; margin: 18px 0 8px; padding-bottom: 5px; border-bottom: 2px solid #E2E8F0; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #F1F5F9; color: #334155; font-weight: 800; text-align: left;
       padding: 7px 9px; border: 1px solid #E2E8F0; font-size: 10px; text-transform: uppercase; letter-spacing: .04em; }
  td { padding: 7px 9px; border: 1px solid #E2E8F0; vertical-align: top; }
  .kv { display: grid; grid-template-columns: 170px 1fr; gap: 0; font-size: 11px; }
  .kv > div { padding: 6px 9px; border-bottom: 1px solid #EEF2F6; }
  .kv > div:nth-child(odd) { background: #F8FAFC; font-weight: 700; color: #475569; }
  ul { margin-left: 16px; font-size: 11px; }
  li { margin-bottom: 4px; line-height: 1.45; }
  .note { font-size: 11px; line-height: 1.6; background: #F8FAFC; border: 1px solid #E2E8F0;
          border-radius: 10px; padding: 10px 12px; white-space: pre-wrap; }
  .pill { display: inline-block; font-size: 9.5px; font-weight: 800; padding: 2px 8px;
          border-radius: 6px; background: #EEF2FF; color: #4338CA; }
  .sign { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 30px; }
  .sign div { text-align: center; font-size: 10px; color: #475569; }
  .sign .line { border-top: 1px solid #94A3B8; margin-top: 42px; padding-top: 5px; }
  .foot { margin-top: 26px; padding-top: 8px; border-top: 1px solid #E2E8F0;
          display: flex; justify-content: space-between; font-size: 8.5px;
          color: #94A3B8; text-transform: uppercase; letter-spacing: .18em; font-weight: 700; }
</style>`;

const header = (kicker, title, metaParts) => `
<div class="band">
  <div class="kicker">${esc(kicker)}</div>
  <h1>${esc(title)}</h1>
  <div class="meta">${metaParts.filter(Boolean).map(esc).join(' &nbsp;·&nbsp; ')}</div>
</div>`;

const footer = () => `
<div class="foot">
  <span>Bireyselleştirilmiş Eğitim Programı</span>
  <span>${new Date().toLocaleDateString('tr-TR')}</span>
</div>`;

const signatures = (roles) => `
<div class="sign">
  ${roles.map((r) => `<div><div class="line">${esc(r)}</div></div>`).join('')}
</div>`;

/** HTML'i geçici bir konteynere basıp PDF'e çevirir. */
const renderToPdf = async (html, filename) => {
    const [{ jsPDF }, html2canvas] = await Promise.all([
        import('jspdf'),
        import('html2canvas').then((m) => m.default),
    ]);

    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#fff;';
    host.innerHTML = styles + `<div class="doc">${html}</div>`;
    document.body.appendChild(host);

    try {
        const target = host.querySelector('.doc');
        const canvas = await html2canvas(target, {
            scale: 2, backgroundColor: '#ffffff', useCORS: true,
            width: 794, windowWidth: 794,
        });

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const margin = 6;
        const imgW = A4.w - margin * 2;
        const imgH = (canvas.height * imgW) / canvas.width;
        const pageH = A4.h - margin * 2;
        const img = canvas.toDataURL('image/jpeg', 0.95);

        let offset = 0;
        let page = 0;
        while (offset < imgH) {
            if (page > 0) doc.addPage();
            doc.addImage(img, 'JPEG', margin, margin - offset, imgW, imgH);
            offset += pageH;
            page++;
            if (page > 30) break; // güvenlik freni
        }

        doc.save(filename);
    } finally {
        host.remove();
    }
};

const safeName = (s) =>
    String(s || 'Belge').replace(/[^\wçğıöşüÇĞİÖŞÜ ]/g, '').trim().replace(/\s+/g, '_');

// ══════════════════════════════════════════════════════════════
//  1. BEP PLANI
// ══════════════════════════════════════════════════════════════
export const exportBepPlan = async ({ student, plan, teachers = [], school = {} }) => {
    const goals = (arr) =>
        arr?.length
            ? `<ul>${arr.map((g) => `<li>${esc(typeof g === 'string' ? g : g.text)}</li>`).join('')}</ul>`
            : '<p style="font-size:11px;color:#94A3B8">Belirtilmemiş</p>';

    const html = `
${header('Bireyselleştirilmiş Eğitim Programı', 'BEP PLANI', [
        school.name, `${student.name}`, plan.course, `${plan.startDate || ''} – ${plan.endDate || ''}`,
    ])}

<h2>Öğrenci Bilgileri</h2>
<div class="kv">
  <div>Adı Soyadı</div><div>${esc(student.name)}</div>
  <div>Sınıf / Şube</div><div>${esc(student.class)}</div>
  <div>Yetersizlik Türü</div><div>${esc(student.disabilityType)}</div>
  <div>Kaynaştırma Türü</div><div>${esc(student.inclusionType)}</div>
  <div>RAM Raporu</div><div>${esc(student.ramReport || '-')} ${student.ramDate ? `(${esc(student.ramDate)})` : ''}</div>
  <div>BEP Başlangıç Tarihi</div><div>${esc(student.iepStartDate || '-')}</div>
  <div>Ders</div><div>${esc(plan.course)}</div>
</div>

<h2>Uzun Dönemli Amaçlar</h2>
${goals(plan.longTermGoals)}

<h2>Kısa Dönemli Amaçlar (Davranışsal)</h2>
${goals(plan.shortTermGoals)}

<h2>Öğretim Yöntem ve Teknikleri</h2>
<div class="note">${esc(plan.methods || 'Belirtilmemiş')}</div>

<h2>Kullanılacak Araç ve Materyaller</h2>
<div class="note">${esc(plan.materials || 'Belirtilmemiş')}</div>

<h2>Değerlendirme Yöntemi</h2>
<div class="note">${esc(plan.evaluation || 'Belirtilmemiş')}</div>

${teachers.length ? `
<h2>BEP Geliştirme Birimi</h2>
<table>
  <tr><th>Adı Soyadı</th><th>Branş</th><th>Görevi</th></tr>
  ${teachers.map((t) => `<tr><td>${esc(t.name)}</td><td>${esc(t.branch)}</td><td>${esc(t.role)}</td></tr>`).join('')}
</table>` : ''}

${signatures(['BEP Birimi Başkanı', 'Rehber Öğretmen', 'Veli'])}
${footer()}`;

    await renderToPdf(html, `BEP_Plani_${safeName(student.name)}_${safeName(plan.course)}.pdf`);
};

// ══════════════════════════════════════════════════════════════
//  2. TOPLANTI TUTANAĞI
// ══════════════════════════════════════════════════════════════
export const exportMeetingMinutes = async ({ student, meeting, school = {} }) => {
    const html = `
${header('BEP Geliştirme Birimi', 'TOPLANTI TUTANAĞI', [
        school.name, student.name, meeting.date, meeting.type,
    ])}

<h2>Toplantı Bilgileri</h2>
<div class="kv">
  <div>Öğrenci</div><div>${esc(student.name)} — ${esc(student.class)}</div>
  <div>Toplantı Türü</div><div>${esc(meeting.type)}</div>
  <div>Tarih</div><div>${esc(meeting.date)}</div>
  <div>Bir Sonraki Toplantı</div><div>${esc(meeting.nextDate || '-')}</div>
</div>

<h2>Katılımcılar</h2>
<table>
  <tr><th style="width:38%">Adı Soyadı</th><th>Görevi</th><th style="width:22%">İmza</th></tr>
  ${(meeting.attendees || []).map((a) =>
        `<tr><td>${esc(a.name || a)}</td><td>${esc(a.role || '')}</td><td></td></tr>`
    ).join('') || '<tr><td colspan="3">Katılımcı girilmemiş</td></tr>'}
</table>

<h2>Gündem</h2>
<div class="note">${esc(meeting.agenda || 'Belirtilmemiş')}</div>

<h2>Alınan Kararlar</h2>
<div class="note">${esc(meeting.decisions || 'Belirtilmemiş')}</div>

${signatures(['Birim Başkanı', 'Rehber Öğretmen', 'Veli'])}
${footer()}`;

    await renderToPdf(html, `BEP_Tutanak_${safeName(student.name)}_${safeName(meeting.date)}.pdf`);
};

// ══════════════════════════════════════════════════════════════
//  3. PERFORMANS DEĞERLENDİRME FORMU
// ══════════════════════════════════════════════════════════════
export const exportPerformance = async ({ student, performances = [], school = {} }) => {
    const html = `
${header('Özel Eğitim', 'EĞİTSEL PERFORMANS DEĞERLENDİRME FORMU', [
        school.name, student.name, student.class,
    ])}

<h2>Öğrenci Bilgileri</h2>
<div class="kv">
  <div>Adı Soyadı</div><div>${esc(student.name)}</div>
  <div>Sınıf</div><div>${esc(student.class)}</div>
  <div>Yetersizlik Türü</div><div>${esc(student.disabilityType)}</div>
</div>

<h2>Ders Bazlı Performans</h2>
<table>
  <tr><th style="width:20%">Ders</th><th style="width:12%">Dönem</th><th>Mevcut Performans Düzeyi</th><th style="width:22%">Değerlendiren</th></tr>
  ${performances.map((p) => `
    <tr>
      <td>${esc(p.course)}</td>
      <td>${esc(p.term || '-')}</td>
      <td>${esc(p.level)}</td>
      <td>${esc(p.assessedBy || '-')}<br><span style="font-size:9px;color:#94A3B8">${esc(p.date || '')}</span></td>
    </tr>`).join('') || '<tr><td colspan="4">Performans kaydı yok</td></tr>'}
</table>

${performances.some((p) => (p.skills || []).length) ? `
<h2>Beceri / Kazanım Bazlı Değerlendirme</h2>
<table>
  <tr>
    <th style="width:18%">Gelişim Alanı</th>
    <th>Beceri / Kazanım</th>
    <th style="width:26%">Performans Düzeyi</th>
  </tr>
  ${performances.flatMap((p) => (p.skills || []).map((s) => `
    <tr>
      <td>${esc(s.areaLabel || p.areaLabel || '-')}</td>
      <td>${esc(s.topic)}${s.note ? `<br><span style="font-size:9px;color:#94A3B8">${esc(s.note)}</span>` : ''}</td>
      <td style="font-weight:800;color:${s.color || '#334155'}">${esc(s.levelLabel)}</td>
    </tr>`)).join('')}
</table>
<p style="font-size:9px;color:#94A3B8;margin-top:6px;line-height:1.5">
  Düzey ölçeği: 1 Yapamıyor · 2 Fiziksel yardımla · 3 Model olunduğunda · 4 Sözel ipucuyla · 5 Bağımsız
</p>` : ''}

${performances.some((p) => p.strengths || p.needs) ? `
<h2>Güçlü Yönler ve İhtiyaçlar</h2>
${performances.filter((p) => p.strengths || p.needs).map((p) => `
  <p style="font-size:11px;margin:8px 0 3px"><span class="pill">${esc(p.course)}</span></p>
  ${p.strengths ? `<div class="note" style="margin-bottom:5px"><strong>Güçlü yönler:</strong> ${esc(p.strengths)}</div>` : ''}
  ${p.needs ? `<div class="note"><strong>İhtiyaçlar:</strong> ${esc(p.needs)}</div>` : ''}
`).join('')}` : ''}

${signatures(['Ders Öğretmeni', 'Rehber Öğretmen', 'Okul Müdürü'])}
${footer()}`;

    await renderToPdf(html, `BEP_Performans_${safeName(student.name)}.pdf`);
};

// ══════════════════════════════════════════════════════════════
//  4. BİREYSEL GELİŞİM RAPORU
// ══════════════════════════════════════════════════════════════
export const exportProgressReport = async ({ student, report, progress, school = {} }) => {
    const statusLabel = { achieved: 'Kazanıldı', partial: 'Kısmen', pending: 'Devam ediyor' };
    const statusColor = { achieved: '#16A34A', partial: '#F59E0B', pending: '#94A3B8' };

    const html = `
${header('Özel Eğitim', 'BİREYSEL GELİŞİM RAPORU', [
        school.name, student.name, report.term, report.period,
    ])}

<h2>Öğrenci Bilgileri</h2>
<div class="kv">
  <div>Adı Soyadı</div><div>${esc(student.name)}</div>
  <div>Sınıf</div><div>${esc(student.class)}</div>
  <div>Yetersizlik Türü</div><div>${esc(student.disabilityType)}</div>
  <div>Dönem</div><div>${esc(report.term)} — ${esc(report.period)}</div>
</div>

${progress?.total ? `
<h2>Amaç Gerçekleşme Durumu</h2>
<p style="font-size:12px;font-weight:800;color:#4338CA;margin-bottom:8px">
  ${progress.achieved} / ${progress.total} amaç kazanıldı (%${progress.percent})
</p>
<table>
  <tr><th style="width:18%">Ders</th><th>Kısa Dönemli Amaç</th><th style="width:18%">Durum</th></tr>
  ${progress.goals.map((g) => `
    <tr>
      <td>${esc(g.plan)}</td>
      <td>${esc(g.goal)}</td>
      <td style="color:${statusColor[g.status] || '#94A3B8'};font-weight:800">
        ${esc(statusLabel[g.status] || 'Devam ediyor')}
      </td>
    </tr>`).join('')}
</table>` : ''}

<h2>Dönem Değerlendirmesi</h2>
<div class="note">${esc(report.summary || 'Belirtilmemiş')}</div>

<h2>Öneriler ve Sonraki Dönem Planı</h2>
<div class="note">${esc(report.recommendation || 'Belirtilmemiş')}</div>

${signatures(['Rehber Öğretmen', 'Sınıf Öğretmeni', 'Veli'])}
${footer()}`;

    await renderToPdf(html, `BEP_Gelisim_Raporu_${safeName(student.name)}_${safeName(report.term)}.pdf`);
};

// ══════════════════════════════════════════════════════════════
//  5. BEP ÖĞRENCİ LİSTESİ (okul geneli)
// ══════════════════════════════════════════════════════════════
export const exportStudentList = async ({ rows = [], school = {} }) => {
    const html = `
${header('Özel Eğitim', 'BEP ÖĞRENCİ LİSTESİ', [
        school.name, `${rows.length} öğrenci`, new Date().toLocaleDateString('tr-TR'),
    ])}

<table>
  <tr>
    <th style="width:5%">#</th>
    <th style="width:24%">Adı Soyadı</th>
    <th style="width:10%">Sınıf</th>
    <th>Yetersizlik Türü</th>
    <th style="width:18%">Kaynaştırma</th>
    <th style="width:12%">Süreç</th>
  </tr>
  ${rows.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${esc(r.name)}</td>
      <td>${esc(r.class)}</td>
      <td>${esc(r.disabilityType)}</td>
      <td>${esc(r.inclusionType)}</td>
      <td style="font-weight:800;color:${r.status?.completion === 100 ? '#16A34A' : '#F59E0B'}">
        %${r.status?.completion ?? 0}
      </td>
    </tr>`).join('') || '<tr><td colspan="6">Kayıtlı öğrenci yok</td></tr>'}
</table>

${signatures(['Rehber Öğretmen', 'Okul Müdürü'])}
${footer()}`;

    await renderToPdf(html, `BEP_Ogrenci_Listesi_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// ══════════════════════════════════════════════════════════════
//  6. BEP GELİŞTİRME BİRİMİ ÜYE LİSTESİ
// ══════════════════════════════════════════════════════════════
export const exportTeamList = async ({ student, teachers = [], school = {} }) => {
    const html = `
${header('Özel Eğitim', 'BEP GELİŞTİRME BİRİMİ ÜYE LİSTESİ', [
        school.name, student.name, student.class,
    ])}

<div class="kv">
  <div>Öğrenci</div><div>${esc(student.name)}</div>
  <div>Sınıf</div><div>${esc(student.class)}</div>
  <div>Yetersizlik Türü</div><div>${esc(student.disabilityType)}</div>
  <div>Üye Sayısı</div><div>${teachers.length}</div>
</div>

<h2>Birim Üyeleri</h2>
<table>
  <tr>
    <th style="width:5%">#</th>
    <th style="width:26%">Adı Soyadı</th>
    <th>Görevi</th>
    <th style="width:20%">Girdiği Ders</th>
    <th style="width:18%">İletişim</th>
  </tr>
  ${teachers.map((t, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${esc(t.name)}</td>
      <td>${esc(t.role)}</td>
      <td>${esc(t.branch || '—')}</td>
      <td>${esc(t.phone || '')}${t.email ? `<br><span style="font-size:9px;color:#94A3B8">${esc(t.email)}</span>` : ''}</td>
    </tr>`).join('') || '<tr><td colspan="5">Birim üyesi kaydı yok</td></tr>'}
</table>

<p style="font-size:9px;color:#94A3B8;margin-top:8px;line-height:1.5">
  Not: Rehber öğretmen/psikolojik danışman, birim başkanı (müdür/müdür yardımcısı), veli ve öğrenci
  derse girmediği için "Girdiği Ders" sütunu bu roller için boş bırakılır.
</p>

${signatures(['Birim Başkanı', 'Rehber Öğretmen', 'Okul Müdürü'])}
${footer()}`;

    await renderToPdf(html, `BEP_Birim_Listesi_${safeName(student.name)}.pdf`);
};

export default {
    exportBepPlan,
    exportMeetingMinutes,
    exportPerformance,
    exportProgressReport,
    exportStudentList,
    exportTeamList,
};
