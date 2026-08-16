import React, { useState, useEffect } from 'react';
import { Calendar, Users, FileText, Download, Plus, Edit, Trash2, Save, X, Briefcase, CheckCircle, Target, ClipboardList } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { savePDF } from '../utils/pdfSave';

const PDRWorkflowModule = () => {
    const [activeTab, setActiveTab] = useState('meetings');

    // Clear old data first time
    useEffect(() => {
        const version = localStorage.getItem('pdr_version');
        if (version !== '2.0') {
            localStorage.removeItem('pdr_meetings');
            localStorage.removeItem('pdr_committees');
            localStorage.setItem('pdr_version', '2.0');
        }
    }, []);

    const [meetings, setMeetings] = useState(() => {
        const saved = localStorage.getItem('pdr_meetings');
        if (saved) return JSON.parse(saved);

        return {
            seneBaslangic: {
                id: 'seneBaslangic', title: 'Sene Başı Toplantısı', date: '2024-09-15', location: 'Rehberlik Servisi',
                agenda: [
                    'Yıllık çalışma planının sunumu ve onaylanması',
                    'Eğitim-öğretim yılı hedeflerinin belirlenmesi',
                    'Görev ve sorumluluk dağılımı',
                    'BEP öğrencilerinin tespiti'
                ],
                attendees: ['Okul Müdürü', 'Müdür Yardımcısı', 'PDR Öğretmeni', 'Sınıf Rehber Öğretmenleri']
            },
            donemSonu1: {
                id: 'donemSonu1', title: '1. Dönem Sonu Toplantısı', date: '2025-01-20', location: 'Rehberlik Servisi',
                agenda: [
                    'Birinci dönem çalışmalarının değerlendirilmesi',
                    'Öğrenci başarı durumlarının analizi',
                    'BEP gelişim raporları'
                ],
                attendees: ['PDR Öğretmeni', 'Sınıf Öğretmenleri', 'Müdür Yardımcısı']
            },
            donemBaslangic2: {
                id: 'donemBaslangic2', title: '2. Dönem Başı Toplantısı', date: '2025-02-10', location: 'Rehberlik Servisi',
                agenda: [
                    'İkinci dönem çalışma programı',
                    'Üniversite rehberlik çalışmaları',
                    'Veli görüşmeleri planı'
                ],
                attendees: ['Okul Müdürü', 'PDR Öğretmeni', '12. Sınıf Öğretmenleri']
            },
            seneSonu: {
                id: 'seneSonu', title: 'Sene Sonu Toplantısı', date: '2025-06-15', location: 'Rehberlik Servisi',
                agenda: [
                    'Yıllık değerlendirme',
                    'BEP yıllık raporları',
                    'Gelecek yıl planlaması'
                ],
                attendees: ['Tüm Öğretmenler', 'Okul İdaresi', 'PDR Ekibi']
            },
            bepToplanti: {
                id: 'bepToplanti', title: 'BEP Değerlendirme Toplantısı', date: '2024-11-15', location: 'Rehberlik Servisi',
                agenda: [
                    'BEP öğrencilerinin gelişim durumlarının değerlendirilmesi',
                    'BEP uygulamalarında karşılaşılan sorunlar',
                    'Ders öğretmenlerinin BEP raporları',
                    'Veli görüşmeleri değerlendirmesi',
                    'Ara dönem BEP revizyon ihtiyaçları'
                ],
                attendees: ['BEP Koordinatörü', 'Sınıf Öğretmenleri', 'Branş Öğretmenleri', 'PDR Öğretmeni', 'Okul İdaresi']
            }
        };
    });

    const [committees, setCommittees] = useState(() => {
        const saved = localStorage.getItem('pdr_committees');
        if (saved) return JSON.parse(saved);

        return {
            ram: {
                id: 'ram', title: 'RAM Yönlendirme Kurulu',
                members: ['Okul Müdürü', 'PDR Öğretmeni', 'Sınıf Öğretmeni', 'Veli'],
                agenda: ['Özel eğitim değerlendirme', 'Yönlendirme kararı']
            },
            bep: {
                id: 'bep', title: 'BEP Hazırlama Kurulu',
                members: ['BEP Koordinatörü', 'Sınıf Öğretmeni', 'Branş Öğretmenleri', 'Veli'],
                agenda: ['BEP hazırlama', 'Gelişim takibi', 'Dönem değerlendirme']
            },
            ozel: {
                id: 'ozel', title: 'Özel Yetenekli Kurul',
                members: ['Okul Müdürü', 'PDR Öğretmeni', 'Sınıf Öğretmeni'],
                agenda: ['Üstün zeka tespiti', 'Özel program hazırlama']
            }
        };
    });

    const [editMode, setEditMode] = useState({ type: null, id: null });
    const [tempData, setTempData] = useState({});

    useEffect(() => {
        localStorage.setItem('pdr_meetings', JSON.stringify(meetings));
    }, [meetings]);

    useEffect(() => {
        localStorage.setItem('pdr_committees', JSON.stringify(committees));
    }, [committees]);

    const downloadMeetingPDF = (meeting) => {
        const doc = new jsPDF();

        doc.setFontSize(10);
        doc.text('T.C.', 105, 15, { align: 'center' });
        doc.text('MİLLİ EĞİTİM BAKANLIĞI', 105, 20, { align: 'center' });
        doc.text('.............................. OKULU', 105, 25, { align: 'center' });

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(meeting.title.toUpperCase(), 105, 35, { align: 'center' });
        doc.line(20, 40, 190, 40);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Tarih: ${meeting.date}`, 20, 50);
        doc.text(`Yer: ${meeting.location}`, 20, 57);

        doc.setFont('helvetica', 'bold');
        doc.text('GÜNDEM:', 20, 70);
        doc.setFont('helvetica', 'normal');

        let y = 78;
        meeting.agenda.forEach((item, i) => {
            const lines = doc.splitTextToSize(`${i + 1}. ${item}`, 170);
            doc.text(lines, 25, y);
            y += lines.length * 7;
        });

        y += 10;
        doc.setFont('helvetica', 'bold');
        doc.text('KATILIMCILAR:', 20, y);
        y += 8;

        doc.setFont('helvetica', 'normal');
        meeting.attendees.forEach((att, i) => {
            doc.text(`${i + 1}. ${att}`, 25, y);
            doc.text('İmza: _______________', 120, y);
            y += 10;
        });

        y += 15;
        doc.setFont('helvetica', 'bold');
        doc.text('KARARLAR:', 20, y);
        y += 8;
        doc.setFont('helvetica', 'normal');
        for (let i = 0; i < 5; i++) {
            doc.text('_____________________________________________________________________', 20, y);
            y += 8;
        }

        doc.setFontSize(9);
        doc.text('PDR Öğretmeni', 30, 270);
        doc.text('Müdür', 160, 270);

        savePDF(doc, meeting.title.replace(/\s+/g, '_'));
    };

    const MeetingCard = ({ meeting }) => {
        const isEditing = editMode.type === 'meeting' && editMode.id === meeting.id;

        return (
            <div className="bg-surface rounded-xl shadow-lg p-6 border border-line">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-ink">{meeting.title}</h3>
                    <button
                        onClick={() => {
                            setEditMode({ type: 'meeting', id: meeting.id });
                            setTempData({ ...meeting });
                        }}
                        className="p-2 hover:bg-brand-soft rounded-lg transition"
                    >
                        <Edit size={18} className="text-brand" />
                    </button>
                </div>

                {isEditing ? (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-bold text-ink-2">Tarih:</label>
                            <input
                                type="date"
                                value={tempData.date || ''}
                                onChange={(e) => setTempData({ ...tempData, date: e.target.value })}
                                className="w-full mt-1 p-2 border rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-bold text-ink-2">Gündem Maddeleri:</label>
                            {tempData.agenda?.map((item, i) => (
                                <div key={i} className="flex gap-2 mt-2">
                                    <input
                                        value={item}
                                        onChange={(e) => {
                                            const newAgenda = [...tempData.agenda];
                                            newAgenda[i] = e.target.value;
                                            setTempData({ ...tempData, agenda: newAgenda });
                                        }}
                                        className="flex-1 p-2 border rounded-lg text-sm"
                                    />
                                    <button
                                        onClick={() => {
                                            const newAgenda = tempData.agenda.filter((_, idx) => idx !== i);
                                            setTempData({ ...tempData, agenda: newAgenda });
                                        }}
                                        className="p-2 text-danger hover:bg-danger-soft rounded"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => setTempData({ ...tempData, agenda: [...(tempData.agenda || []), ''] })}
                                className="mt-2 text-sm text-brand flex items-center gap-1 hover:text-brand"
                            >
                                <Plus size={14} /> Gündem Ekle
                            </button>
                        </div>

                        <div>
                            <label className="text-sm font-bold text-ink-2">Katılımcılar:</label>
                            {tempData.attendees?.map((att, i) => (
                                <div key={i} className="flex gap-2 mt-2">
                                    <input
                                        value={att}
                                        onChange={(e) => {
                                            const newAtt = [...tempData.attendees];
                                            newAtt[i] = e.target.value;
                                            setTempData({ ...tempData, attendees: newAtt });
                                        }}
                                        className="flex-1 p-2 border rounded-lg text-sm"
                                    />
                                    <button
                                        onClick={() => {
                                            const newAtt = tempData.attendees.filter((_, idx) => idx !== i);
                                            setTempData({ ...tempData, attendees: newAtt });
                                        }}
                                        className="p-2 text-danger hover:bg-danger-soft rounded"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => setTempData({ ...tempData, attendees: [...(tempData.attendees || []), ''] })}
                                className="mt-2 text-sm text-brand flex items-center gap-1 hover:text-brand"
                            >
                                <Plus size={14} /> Katılımcı Ekle
                            </button>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <button
                                onClick={() => {
                                    setMeetings({ ...meetings, [meeting.id]: tempData });
                                    setEditMode({ type: null, id: null });
                                }}
                                className="px-4 py-2 bg-ok text-white rounded-lg flex items-center gap-2 hover:bg-ok"
                            >
                                <Save size={16} /> Kaydet
                            </button>
                            <button
                                onClick={() => setEditMode({ type: null, id: null })}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-surface-inv"
                            >
                                <X size={16} /> İptal
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm text-ink-2 mb-2">📅 Tarih: {meeting.date}</p>
                        <p className="text-sm text-ink-2 mb-2">📍 Yer: {meeting.location}</p>
                        <p className="text-sm text-ink-2 mb-4">👥 Katılımcı: {meeting.attendees?.length || 0}</p>
                        <button
                            onClick={() => downloadMeetingPDF(meeting)}
                            className="w-full py-3 bg-brand text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-hover transition"
                        >
                            <Download size={18} /> Tutanak İndir (PDF)
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const downloadCommitteePDF = (committee) => {
        const doc = new jsPDF();

        doc.setFontSize(10);
        doc.text('T.C.', 105, 15, { align: 'center' });
        doc.text('MİLLİ EĞİTİM BAKANLIĞI', 105, 20, { align: 'center' });
        doc.text('.............................. OKULU', 105, 25, { align: 'center' });

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(committee.title.toUpperCase(), 105, 35, { align: 'center' });
        doc.line(20, 40, 190, 40);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('Tarih: ....../....../......', 20, 50);
        doc.text('Saat: .....:...... ', 20, 57);

        doc.setFont('helvetica', 'bold');
        doc.text('KURUL ÜYELERİ:', 20, 70);
        doc.setFont('helvetica', 'normal');

        let y = 78;
        committee.members.forEach((member, i) => {
            doc.text(`${i + 1}. ${member}`, 25, y);
            doc.text('İmza: _______________', 120, y);
            y += 10;
        });

        y += 10;
        doc.setFont('helvetica', 'bold');
        doc.text('GÜNDEM:', 20, y);
        y += 8;
        doc.setFont('helvetica', 'normal');

        committee.agenda.forEach((item, i) => {
            const lines = doc.splitTextToSize(`${i + 1}. ${item}`, 170);
            doc.text(lines, 25, y);
            y += lines.length * 7;
        });

        y += 15;
        doc.setFont('helvetica', 'bold');
        doc.text('ALINAN KARARLAR:', 20, y);
        y += 8;
        doc.setFont('helvetica', 'normal');
        for (let i = 0; i < 5; i++) {
            doc.text('_____________________________________________________________________', 20, y);
            y += 8;
        }

        doc.setFontSize(9);
        doc.text('Kurul Başkanı', 30, 270);
        doc.text('Müdür', 160, 270);

        savePDF(doc, committee.title.replace(/\s+/g, '_'));
    };

    const CommitteeCard = ({ committee }) => {
        const isEditing = editMode.type === 'committee' && editMode.id === committee.id;

        return (
            <div className="bg-surface rounded-xl shadow-lg p-6 border border-line">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-ink">{committee.title}</h3>
                    <button
                        onClick={() => {
                            setEditMode({ type: 'committee', id: committee.id });
                            setTempData({ ...committee });
                        }}
                        className="p-2 hover:bg-brand-soft rounded-lg transition"
                    >
                        <Edit size={18} className="text-brand" />
                    </button>
                </div>

                {isEditing ? (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-bold text-ink-2">Kurul Üyeleri:</label>
                            {tempData.members?.map((member, i) => (
                                <div key={i} className="flex gap-2 mt-2">
                                    <input
                                        value={member}
                                        onChange={(e) => {
                                            const newMembers = [...tempData.members];
                                            newMembers[i] = e.target.value;
                                            setTempData({ ...tempData, members: newMembers });
                                        }}
                                        className="flex-1 p-2 border rounded-lg text-sm"
                                    />
                                    <button
                                        onClick={() => {
                                            const newMembers = tempData.members.filter((_, idx) => idx !== i);
                                            setTempData({ ...tempData, members: newMembers });
                                        }}
                                        className="p-2 text-danger hover:bg-danger-soft rounded"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => setTempData({ ...tempData, members: [...(tempData.members || []), ''] })}
                                className="mt-2 text-sm text-brand flex items-center gap-1 hover:text-brand"
                            >
                                <Plus size={14} /> Üye Ekle
                            </button>
                        </div>

                        <div>
                            <label className="text-sm font-bold text-ink-2">Gündem:</label>
                            {tempData.agenda?.map((item, i) => (
                                <div key={i} className="flex gap-2 mt-2">
                                    <input
                                        value={item}
                                        onChange={(e) => {
                                            const newAgenda = [...tempData.agenda];
                                            newAgenda[i] = e.target.value;
                                            setTempData({ ...tempData, agenda: newAgenda });
                                        }}
                                        className="flex-1 p-2 border rounded-lg text-sm"
                                    />
                                    <button
                                        onClick={() => {
                                            const newAgenda = tempData.agenda.filter((_, idx) => idx !== i);
                                            setTempData({ ...tempData, agenda: newAgenda });
                                        }}
                                        className="p-2 text-danger hover:bg-danger-soft rounded"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => setTempData({ ...tempData, agenda: [...(tempData.agenda || []), ''] })}
                                className="mt-2 text-sm text-brand flex items-center gap-1 hover:text-brand"
                            >
                                <Plus size={14} /> Gündem Ekle
                            </button>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <button
                                onClick={() => {
                                    setCommittees({ ...committees, [committee.id]: tempData });
                                    setEditMode({ type: null, id: null });
                                }}
                                className="px-4 py-2 bg-ok text-white rounded-lg flex items-center gap-2 hover:bg-ok"
                            >
                                <Save size={16} /> Kaydet
                            </button>
                            <button
                                onClick={() => setEditMode({ type: null, id: null })}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-surface-inv"
                            >
                                <X size={16} /> İptal
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="mb-4">
                            <p className="text-sm font-bold text-ink-2 mb-2">Kurul Üyeleri:</p>
                            {committee.members.map((m, i) => (
                                <p key={i} className="text-sm text-ink-2 ml-2">• {m}</p>
                            ))}
                        </div>
                        <div className="mb-4">
                            <p className="text-sm font-bold text-ink-2 mb-2">Gündem:</p>
                            {committee.agenda.map((a, i) => (
                                <p key={i} className="text-sm text-ink-2 ml-2">• {a}</p>
                            ))}
                        </div>
                        <button
                            onClick={() => downloadCommitteePDF(committee)}
                            className="w-full py-3 bg-c4 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-c4 transition"
                        >
                            <Download size={18} /> Tutanak İndir (PDF)
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="on-color bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-8 text-ink shadow-2xl">
                <div className="flex items-center gap-4">
                    <Briefcase size={48} />
                    <div>
                        <h1 className="text-4xl font-black">PDR İş Akışı Yönetimi</h1>
                        <p className="text-info">MEB Standartlarında Profesyonel Evrak Sistemi</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-surface p-2 rounded-xl shadow-sm">
                <button
                    onClick={() => setActiveTab('meetings')}
                    className={`flex-1 py-3 px-4 rounded-lg font-bold transition flex items-center justify-center gap-2 ${activeTab === 'meetings' ? 'bg-brand text-ink' : 'text-ink-2 hover:bg-surface-3'
                        }`}
                >
                    <Calendar size={18} /> Toplantılar
                </button>
                <button
                    onClick={() => setActiveTab('committees')}
                    className={`flex-1 py-3 px-4 rounded-lg font-bold transition flex items-center justify-center gap-2 ${activeTab === 'committees' ? 'bg-brand text-ink' : 'text-ink-2 hover:bg-surface-3'
                        }`}
                >
                    <Users size={18} /> Kurullar
                </button>
            </div>

            {/* Content */}
            {activeTab === 'meetings' && (
                <div>
                    <div className="mb-4 flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-ink">Yıllık Toplantılar ({Object.keys(meetings).length})</h2>
                        <button
                            onClick={() => {
                                localStorage.removeItem('pdr_meetings');
                                localStorage.removeItem('pdr_committees');
                                localStorage.removeItem('pdr_version');
                                window.location.reload();
                            }}
                            className="px-4 py-2 bg-danger text-white rounded-lg text-sm"
                        >
                            Sıfırla & Yenile
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.values(meetings).map(meeting => (
                            <MeetingCard key={meeting.id} meeting={meeting} />
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'committees' && (
                <div>
                    <h2 className="text-2xl font-bold text-ink mb-4">Kurullar ({Object.keys(committees).length})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.values(committees).map(committee => (
                            <CommitteeCard key={committee.id} committee={committee} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PDRWorkflowModule;
