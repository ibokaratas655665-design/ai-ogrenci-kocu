/**
 * 📅 KOÇ RANDEVU SİSTEMİ (Madde 3)
 * Koç müsait saatlerini belirler → Öğrenci slot seçer → İki tarafa bildirim
 */
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, X, Plus, Trash2, User, Users, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { sendRealtimeNotification } from '../shared/RealtimeNotifications';
import Modal from '../ui/Modal';
import { listeOku, nesneOku, yaz } from '../../services/veriDeposu';

const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
/* substring(0,3) kısaltması ÇAKIŞIYORDU: Pazartesi→"Paz" (Pazar ile),
   Cumartesi→"Cum" (Cuma ile). Takvimde hafta "Paz Sal Çar Per Cum Cum
   Paz" görünüyordu. Standart Türkçe kısaltmalar elle verilir. */
const DAYS_KISA = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const getWeekDates = (offset = 0) => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff + offset * 7);
    return DAYS.map((_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
    });
};

/**
 * Slot deposu koç kimliğine göre ayrılır. Ancak eski sürümde her iki
 * taraf da `coachId` göndermiyordu; bütün saatler `appt_slots_undefined`
 * altında birikmişti. O kayıtları çöpe atmamak için okurken ikisi de
 * birleştirilir, yazma her zaman doğru anahtara yapılır.
 */
const ANAHTAR_RANDEVU = 'appointments';
const SLOT_ANAHTAR = (coachId) => `appt_slots_${coachId || 'undefined'}`;

/*
 * Randevu yazımı `veriDeposu.yaz` üzerinden gider.
 *
 * ⚠️ Burası eskiden doğrudan localStorage'a yazıyordu ve senkronu HİÇ
 * tetiklemiyordu. `appointments` SYNC_KEYS listesinde olduğu için veri
 * er geç gidiyordu — ama yalnızca 2 dakikalık toplu turda. Öğrenci
 * randevu alıp sekmeyi kapattığında randevu hiç gitmiyor, koç panelinde
 * görünmüyordu. Ölçülerek doğrulandı: 6 saniye sonra bulutta yoktu.
 */

const slotOku = (coachId) => {
    const birlestir = (key) => {
        return nesneOku(key);
    };
    const eski = birlestir('appt_slots_undefined');
    const kendi = coachId ? birlestir(SLOT_ANAHTAR(coachId)) : {};
    return { ...eski, ...kendi };
};

// ─── KOÇ: Müsait Saatleri Belirle ────────────────────────────────
/**
 * Randevu takvimi hem koçluk hem rehberlik mesaisinde kullanılıyor ama
 * bunlar ayrı işler: koçluk görüşmesi ile rehberlik servisi görüşmesi
 * aynı takvimde karışmamalı. Saatler `bolum` etiketiyle saklanır,
 * ekranda yalnızca içinde bulunulan bölümün saatleri görünür.
 * Öğrenci tarafı ise ayrım gözetmeden hepsini görür — öğrenci için
 * ikisi de "koçumla görüşme".
 */
export const CoachAppointmentManager = ({ coachId, coachName, students, bolum = 'kocluk' }) => {
    const [weekOffset, setWeekOffset] = useState(0);
    const [slots, setSlots] = useState(() => {
        return slotOku(coachId);
    });
    const [showAddModal, setShowAddModal] = useState(false);
    const [newSlot, setNewSlot] = useState({ dayIndex: 0, hour: '09:00', duration: 30 });

    const weekDates = getWeekDates(weekOffset);
    const [appointments, setAppointments] = useState(() => {
        return listeOku(ANAHTAR_RANDEVU);
    });

    const saveSlots = (updated) => {
        setSlots(updated);
        /* 05.09 denetimi — `zorla` ŞART: son müsait saat silindiğinde
           `updated === {}` olur; veriDeposu boş değeri buluta göndermeyi
           atlar ve öğrencinin cihazındaki eski saatler ASLA silinmezdi
           (öğrenci kapalı saate randevu alıyordu). */
        yaz(SLOT_ANAHTAR(coachId), updated, { zorla: true });
    };

    const addSlot = () => {
        const date = weekDates[newSlot.dayIndex];
        const dateStr = date.toISOString().split('T')[0];
        const key = `${dateStr}_${newSlot.hour}`;
        const updated = { ...slots, [key]: { date: dateStr, hour: newSlot.hour, duration: newSlot.duration, available: true, coachId, coachName, bolum } };
        saveSlots(updated);
        setShowAddModal(false);
        setNewSlot({ dayIndex: 0, hour: '09:00', duration: 30 });
    };

    const removeSlot = (key) => {
        const updated = { ...slots };
        delete updated[key];
        saveSlots(updated);
    };

    // Etiketsiz eski kayıtlar koçluk sayılır — geçmiş veri kaybolmaz
    const buBolum = ([, slot]) => (slot?.bolum || 'kocluk') === bolum;
    const bolumSlotlari = Object.fromEntries(Object.entries(slots).filter(buBolum));

    const weekAppts = appointments.filter(a => {
        const slot = slots[`${a.date}_${a.hour}`];
        if ((slot?.bolum || a.bolum || 'kocluk') !== bolum) return false;
        const d = new Date(a.date);
        return weekDates.some(wd => wd.toDateString() === d.toDateString());
    });

    return (
        /* 05.09: kokpit zinciri (canlı 04.09) — başlık sabit, takvim kayar */
        <div className="space-y-5 xl:flex-1 xl:min-h-0 xl:flex xl:flex-col xl:overflow-hidden">
            {/* Header */}
            <div className="xl:shrink-0 flex items-center justify-between">
                <h3 className="font-bold text-ink flex items-center gap-2">
                    <Calendar size={18} className="text-brand" />
                    {bolum === 'pdr' ? 'Rehberlik Görüşme Takvimi' : 'Koçluk Randevu Takvimi'}
                </h3>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-brand text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-brand-hover transition"
                >
                    <Plus size={14} /> Müsait Saat Ekle
                </button>
            </div>

            <div className="xl:flex-1 xl:min-h-0 xl:overflow-y-auto tek-ekran-govde space-y-5 xl:pr-1.5">
            {/* Ölçüm şeridi — Tasarım 2.0 kalıbı: bu haftanın özeti */}
            <div className="grid grid-cols-3 gap-3">
                {(() => {
                    const haftaAnahtarlari = new Set(weekDates.map((d) => d.toISOString().split('T')[0]));
                    const haftaSlotlari = Object.entries(bolumSlotlari)
                        .filter(([k]) => haftaAnahtarlari.has(k.split('_')[0]));
                    const dolu = haftaSlotlari.filter(([, slot]) =>
                        appointments.some((a) => a.date === slot.date && a.hour === slot.hour)).length;
                    return [
                        { etiket: 'Bu Hafta Müsait Saat', deger: haftaSlotlari.length, renk: 'var(--brand)' },
                        { etiket: 'Alınan Randevu', deger: weekAppts.length, renk: 'var(--ok)' },
                        { etiket: 'Boş Saat', deger: Math.max(0, haftaSlotlari.length - dolu), renk: 'var(--info)' },
                    ].map((k) => (
                        <div key={k.etiket} className="bg-surface border border-line rounded-2xl px-4 py-3">
                            <p className="text-[10px] font-black uppercase tracking-wider text-ink-3">{k.etiket}</p>
                            <p className="text-2xl font-black tabular-nums mt-0.5" style={{ color: k.renk }}>{k.deger}</p>
                        </div>
                    ));
                })()}
            </div>

            {/* Hafta Navigasyon */}
            <div className="flex items-center justify-between bg-surface-2 rounded-2xl p-3">
                <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 rounded-xl hover:bg-surface transition">
                    <ChevronLeft size={18} className="text-ink-2" />
                </button>
                <div className="text-center">
                    <p className="font-bold text-ink text-sm">
                        {weekDates[0]?.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} — {weekDates[6]?.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    {weekOffset === 0 && <p className="text-xs text-brand font-bold">Bu Hafta</p>}
                </div>
                <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 rounded-xl hover:bg-surface transition">
                    <ChevronRight size={18} className="text-ink-2" />
                </button>
            </div>

            {/* Müsait Slotlar */}
            <div className="grid grid-cols-7 gap-1.5">
                {weekDates.map((date, i) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const daySlots = Object.entries(bolumSlotlari).filter(([k]) => k.startsWith(dateStr));
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                        <div key={i} className={`rounded-xl border ${isToday ? 'border-brand-line bg-brand-soft' : 'border-line bg-surface'} p-2 min-h-20`}>
                            <p className={`text-[10px] font-black text-center mb-1 ${isToday ? 'text-brand' : 'text-ink-2'}`}>
                                {DAYS_KISA[i]}<br />
                                <span className="text-xs">{date.getDate()}</span>
                            </p>
                            <div className="space-y-0.5">
                                {daySlots.map(([key, slot]) => {
                                    const booked = appointments.find(a => a.date === slot.date && a.hour === slot.hour);
                                    return (
                                        <div key={key} className={`text-[9px] font-bold px-1 py-0.5 rounded flex items-center justify-between group ${booked ? 'bg-ok-soft text-ok' : 'bg-brand-soft text-brand'}`}>
                                            <span>{slot.hour}</span>
                                            {booked ? <CheckCircle size={9} /> : (
                                                <button onClick={() => removeSlot(key)} className="opacity-0 group-hover:opacity-100">
                                                    <X size={9} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bu Haftaki Randevular */}
            {weekAppts.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-bold text-ink-2 text-sm">Bu Haftaki Randevular</h4>
                    {weekAppts.map((a, i) => (
                        <div key={i} className="flex items-center gap-3 bg-ok-soft border border-ok rounded-xl p-3">
                            <CheckCircle size={18} className="text-ok shrink-0" />
                            <div className="flex-1">
                                <p className="font-bold text-ink text-sm">{a.studentName}</p>
                                <p className="text-xs text-ink-2">{new Date(a.date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })} • {a.hour}</p>
                                {a.note && <p className="text-xs text-ink-3 italic mt-0.5">"{a.note}"</p>}
                            </div>
                            <button
                                onClick={() => {
                                    /* ⚠️ i, HAFTALIK listenin indeksi — ana
                                       `appointments` dizisinin değil. İndeksle
                                       silmek başka haftanın randevusunu
                                       siliyordu; kayıt kimliğiyle silinir. */
                                    const updated = appointments.filter((x) => x !== a);
                                    setAppointments(updated);
                                    yaz(ANAHTAR_RANDEVU, updated);
                                }}
                                className="text-danger hover:text-danger p-1"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            </div>

            {/* Slot Ekleme Modal */}
            {showAddModal && (
                <Modal
                    acik
                    onClose={() => setShowAddModal(false)}
                    baslikGizle
                    genislik="sm"
                    govdeClassName="p-6 space-y-4"
                >
                    {/* Bu pencerede kapatma butonu yoktu; yalnızca alttaki
                        "İptal" ile kapanıyordu ve ESC de çalışmıyordu. */}
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="font-black text-ink text-lg">Müsait Saat Ekle</h3>
                        <button
                            onClick={() => setShowAddModal(false)}
                            aria-label="Kapat"
                            className="b b-bare b-icon -mt-1 -mr-1"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-ink-2 uppercase tracking-wider block mb-2">Gün</label>
                        <div className="grid grid-cols-4 gap-1.5">
                            {weekDates.map((d, i) => (
                                <button
                                    key={i}
                                    onClick={() => setNewSlot(s => ({ ...s, dayIndex: i }))}
                                    className={`text-xs py-2 rounded-xl font-bold transition ${newSlot.dayIndex === i ? 'bg-brand text-ink' : 'bg-surface-3 text-ink-2 hover:bg-surface-3'}`}
                                >
                                    {DAYS_KISA[i]}<br />
                                    <span className="text-[10px] opacity-70">{d.getDate()}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-ink-2 uppercase tracking-wider block mb-2">Saat</label>
                        <select
                            value={newSlot.hour}
                            onChange={e => setNewSlot(s => ({ ...s, hour: e.target.value }))}
                            className="w-full p-3 border border-line rounded-xl text-sm focus:ring-2 focus:ring-brand outline-none bg-surface-2"
                        >
                            {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-ink-2 uppercase tracking-wider block mb-2">Süre</label>
                        <div className="flex gap-2">
                            {[15, 30, 45, 60].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setNewSlot(s => ({ ...s, duration: d }))}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${newSlot.duration === d ? 'bg-brand text-ink' : 'bg-surface-3 text-ink-2 hover:bg-surface-3'}`}
                                >
                                    {d} dk
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="pencere-alt-cubuk bg-surface flex gap-2 pt-2">
                        <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-surface-3 text-ink-2 rounded-xl font-bold text-sm hover:bg-surface-3 transition">İptal</button>
                        <button onClick={addSlot} className="flex-1 py-3 bg-brand text-white rounded-xl font-bold text-sm hover:bg-brand-hover transition">Ekle</button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// ─── ÖĞRENCİ: Randevu Al ─────────────────────────────────────────
export const StudentAppointmentBooker = ({ studentId, studentName, coachId, coachName }) => {
    const [slots, setSlots] = useState({});
    const [appointments, setAppointments] = useState([]);
    const [note, setNote] = useState('');
    const [booked, setBooked] = useState(false);
    const [weekOffset, setWeekOffset] = useState(0);
    const weekDates = getWeekDates(weekOffset);

    useEffect(() => {
        try {
            setSlots(slotOku(coachId));
            setAppointments(listeOku(ANAHTAR_RANDEVU));
        } catch { }
    }, [coachId]);

    const myAppointments = appointments.filter(a => a.studentId === studentId);

    const bookSlot = async (key, slot) => {
        const newAppt = {
            id: Date.now().toString(),
            studentId, studentName, coachId, coachName,
            date: slot.date, hour: slot.hour, duration: slot.duration,
            note, createdAt: new Date().toISOString()
        };
        const updated = [...appointments, newAppt];
        setAppointments(updated);
        yaz(ANAHTAR_RANDEVU, updated);
        setBooked(true);
        setNote('');

        // Koça bildirim gönder
        await sendRealtimeNotification({
            toUserId: coachId,
            type: 'appt',
            title: `📅 ${studentName} randevu aldı`,
            body: `${new Date(slot.date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })} ${slot.hour} için randevu talebi.`,
            action: 'appointments'
        });

        // Öğrenciye bildirim gönder (kendine)
        await sendRealtimeNotification({
            toUserId: studentId,
            type: 'appt',
            title: '✅ Randevunuz Oluşturuldu',
            body: `${new Date(slot.date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })} ${slot.hour} • ${coachName}`,
            action: null
        });
    };

    const availableSlots = Object.entries(slots).filter(([k, s]) => {
        const d = new Date(s.date);
        const inWeek = weekDates.some(wd => wd.toDateString() === d.toDateString());
        const notBooked = !appointments.some(a => a.date === s.date && a.hour === s.hour);
        const future = new Date(`${s.date}T${s.hour}`) > new Date();
        return inWeek && notBooked && future;
    });

    return (
        <div className="space-y-5">
            <h3 className="font-bold text-ink flex items-center gap-2">
                <Calendar size={18} className="text-brand" />
                Koçumdan Randevu Al
            </h3>

            {/* Mevcut randevularım */}
            {myAppointments.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-bold text-ink-2 uppercase tracking-wider">Randevularım</p>
                    {myAppointments.slice(-3).map((a, i) => (
                        <div key={i} className="flex items-center gap-3 bg-brand-soft border border-brand-line rounded-xl p-3">
                            <CheckCircle size={16} className="text-brand shrink-0" />
                            <div>
                                <p className="font-bold text-ink text-sm">{new Date(a.date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                <p className="text-xs text-brand">{a.hour} • {a.duration} dk • {a.coachName}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Hafta Navigasyon */}
            <div className="flex items-center justify-between bg-surface-2 rounded-2xl p-3">
                <button onClick={() => setWeekOffset(w => Math.max(0, w - 1))} className="p-2 rounded-xl hover:bg-surface transition disabled:opacity-30" disabled={weekOffset === 0}>
                    <ChevronLeft size={18} className="text-ink-2" />
                </button>
                <p className="font-bold text-ink-2 text-sm">
                    {weekDates[0]?.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} — {weekDates[6]?.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                </p>
                <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 rounded-xl hover:bg-surface transition">
                    <ChevronRight size={18} className="text-ink-2" />
                </button>
            </div>

            {availableSlots.length === 0 ? (
                <div className="text-center py-10 text-ink-3">
                    <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">Bu hafta müsait saat yok</p>
                    <p className="text-xs mt-1">Sonraki haftayı kontrol edin veya koçunuzla iletişime geçin.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-xs font-bold text-ink-2 uppercase tracking-wider">{availableSlots.length} müsait saat</p>
                    <div className="grid grid-cols-2 gap-2">
                        {availableSlots.map(([key, slot]) => (
                            <div key={key} className="bg-surface border-2 border-brand-line rounded-2xl p-4 hover:border-indigo-400 transition group">
                                <p className="font-black text-brand text-base">{slot.hour}</p>
                                <p className="text-xs text-ink-2 mb-3">
                                    {new Date(slot.date).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })} • {slot.duration} dk
                                </p>
                                <button
                                    onClick={() => bookSlot(key, slot)}
                                    className="w-full py-2 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-hover transition"
                                >
                                    Randevu Al
                                </button>
                            </div>
                        ))}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-ink-2 uppercase tracking-wider block mb-2">Görüşme Notu (İsteğe Bağlı)</label>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Görüşmek istediğiniz konuyu belirtin..."
                            className="w-full p-3 border border-line rounded-xl text-sm resize-none bg-surface-2 focus:ring-2 focus:ring-indigo-400 outline-none"
                            rows={2}
                        />
                    </div>
                </div>
            )}

            {booked && (
                <div className="bg-ok-soft border border-ok rounded-xl p-4 flex items-center gap-3 animate-fade-in">
                    <CheckCircle size={20} className="text-ok shrink-0" />
                    <div>
                        <p className="font-bold text-ok text-sm">Randevu Oluşturuldu!</p>
                        <p className="text-xs text-ok">Koçunuza bildirim gönderildi.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoachAppointmentManager;
