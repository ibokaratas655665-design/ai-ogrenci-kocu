/**
 * 📅 SINAV TAKVİMİ
 * v2_trials_data'dan yaklaşan denemeleri interaktif takvimde gösterir
 */
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, BookOpen, Plus, X, Check } from 'lucide-react';

const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const DAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const ExamCalendar = ({ userId }) => {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDay, setSelectedDay] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', type: 'TYT', time: '09:00', note: '' });

    // Kayıtlı etkinlikleri yükle
    const [customEvents, setCustomEvents] = useState(() => {
        try { return JSON.parse(localStorage.getItem(`calendar_events_${userId || 'student'}`) || '[]'); }
        catch { return []; }
    });

    // v2_trials_data'dan gerçek denemeleri çek
    const trialEvents = useMemo(() => {
        try {
            const trials = JSON.parse(localStorage.getItem('v2_trials_data') || '[]');
            return trials.map(t => ({
                id: `trial_${t.id}`,
                date: t.date ? new Date(t.date).toISOString().split('T')[0] : null,
                title: t.name || 'Deneme',
                type: t.examType || 'TYT',
                source: 'trial',
                color: t.examType === 'AYT' ? 'bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] text-c4 border-[color-mix(in_srgb,var(--c4)_35%,transparent)]' : 'bg-brand-soft text-brand border-brand-line'
            })).filter(e => e.date);
        } catch { return []; }
    }, []);

    const allEvents = [...trialEvents, ...customEvents];

    const saveCustomEvents = (events) => {
        setCustomEvents(events);
        localStorage.setItem(`calendar_events_${userId || 'student'}`, JSON.stringify(events));
    };

    const handleAddEvent = () => {
        if (!newEvent.title.trim() || !selectedDay) return;
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
        const evt = {
            id: `custom_${Date.now()}`,
            date: dateStr,
            title: newEvent.title,
            type: newEvent.type,
            time: newEvent.time,
            note: newEvent.note,
            source: 'custom',
            color: 'bg-ok-soft text-ok border-ok'
        };
        saveCustomEvents([...customEvents, evt]);
        setNewEvent({ title: '', type: 'TYT', time: '09:00', note: '' });
        setShowAddForm(false);
    };

    const handleDeleteEvent = (id) => {
        saveCustomEvents(customEvents.filter(e => e.id !== id));
    };

    // Takvim grid hesapla
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Pazartesi = 0
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const getEventsForDay = (day) => {
        if (!day) return [];
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return allEvents.filter(e => e.date === dateStr);
    };

    const selectedDateStr = selectedDay
        ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
        : null;
    const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];

    // Yaklaşan denemeler (sonraki 30 gün)
    const upcomingEvents = allEvents
        .filter(e => {
            const d = new Date(e.date);
            const diff = (d - today) / (1000 * 60 * 60 * 24);
            return diff >= 0 && diff <= 30;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);

    const isToday = (day) => {
        return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
    };

    const prevMonth = () => {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
        else setCurrentMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
        else setCurrentMonth(m => m + 1);
    };

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-ink flex items-center gap-2">
                    <Calendar size={22} className="text-brand" />
                    Sınav Takvimim
                </h2>
                <span className="text-xs text-ink-3 bg-surface-3 px-3 py-1.5 rounded-full">
                    Güncellendi: Bugün
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Takvim */}
                <div className="lg:col-span-2 bg-surface rounded-2xl shadow-sm border border-line overflow-hidden">
                    {/* Month Nav */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-gradient-to-r from-indigo-50 to-purple-50">
                        <button onClick={prevMonth} className="p-2 hover:bg-surface rounded-xl transition text-ink-2 hover:text-brand">
                            <ChevronLeft size={18} />
                        </button>
                        <h3 className="font-black text-ink text-base">
                            {MONTHS_TR[currentMonth]} {currentYear}
                        </h3>
                        <button onClick={nextMonth} className="p-2 hover:bg-surface rounded-xl transition text-ink-2 hover:text-brand">
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 border-b border-line">
                        {DAYS_TR.map(d => (
                            <div key={d} className="py-2 text-center text-xs font-bold text-ink-3 uppercase">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Day Grid */}
                    <div className="grid grid-cols-7">
                        {cells.map((day, idx) => {
                            const events = day ? getEventsForDay(day) : [];
                            const isSelected = day === selectedDay;
                            const isTodayDay = isToday(day);
                            return (
                                <div
                                    key={idx}
                                    onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                                    className={`min-h-[68px] p-1.5 border-b border-r border-gray-50 flex flex-col transition-all
                                        ${day ? 'cursor-pointer hover:bg-brand-soft/40' : ''}
                                        ${isSelected ? 'bg-brand-soft ring-2 ring-inset ring-indigo-400' : ''}
                                    `}
                                >
                                    {day && (
                                        <>
                                            <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 flex-shrink-0
                                                ${isTodayDay ? 'bg-brand text-white' : 'text-ink-2'}
                                            `}>
                                                {day}
                                            </span>
                                            <div className="space-y-0.5 overflow-hidden">
                                                {events.slice(0, 2).map(e => (
                                                    <div key={e.id} className={`text-[9px] font-bold px-1 py-0.5 rounded truncate border ${e.color}`}>
                                                        {e.type}
                                                    </div>
                                                ))}
                                                {events.length > 2 && (
                                                    <div className="text-[9px] text-ink-3 font-medium pl-1">+{events.length - 2}</div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sağ Panel */}
                <div className="space-y-4">
                    {/* Seçili Gün */}
                    {selectedDay && (
                        <div className="bg-surface rounded-2xl shadow-sm border border-line p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-black text-ink text-sm">
                                    {selectedDay} {MONTHS_TR[currentMonth]}
                                </h4>
                                <button
                                    onClick={() => setShowAddForm(true)}
                                    className="flex items-center gap-1 text-xs bg-brand text-white px-2.5 py-1.5 rounded-lg hover:bg-brand-hover transition font-bold"
                                >
                                    <Plus size={12} /> Ekle
                                </button>
                            </div>
                            {selectedEvents.length === 0 ? (
                                <p className="text-xs text-ink-3 text-center py-4">Bu günde etkinlik yok</p>
                            ) : (
                                <div className="space-y-2">
                                    {selectedEvents.map(e => (
                                        <div key={e.id} className={`flex items-start gap-2 p-2.5 rounded-xl border ${e.color}`}>
                                            <BookOpen size={14} className="mt-0.5 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold truncate">{e.title}</p>
                                                {e.time && <p className="text-[10px] opacity-70 flex items-center gap-1"><Clock size={9} /> {e.time}</p>}
                                                {e.note && <p className="text-[10px] opacity-70 mt-0.5">{e.note}</p>}
                                            </div>
                                            {e.source === 'custom' && (
                                                <button onClick={() => handleDeleteEvent(e.id)} className="opacity-50 hover:opacity-100 transition">
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {/* Etkinlik Ekleme Formu */}
                            {showAddForm && (
                                <div className="mt-3 pt-3 border-t border-line space-y-2">
                                    <input
                                        value={newEvent.title}
                                        onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))}
                                        placeholder="Etkinlik adı..."
                                        className="w-full text-xs border border-line rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
                                    />
                                    <div className="flex gap-2">
                                        <select value={newEvent.type} onChange={e => setNewEvent(p => ({ ...p, type: e.target.value }))}
                                            className="flex-1 text-xs border border-line rounded-lg px-2 py-2 bg-surface outline-none">
                                            <option>TYT</option><option>AYT</option><option>Konu</option><option>Diğer</option>
                                        </select>
                                        <input type="time" value={newEvent.time} onChange={e => setNewEvent(p => ({ ...p, time: e.target.value }))}
                                            className="flex-1 text-xs border border-line rounded-lg px-2 py-2 outline-none" />
                                    </div>
                                    <input value={newEvent.note} onChange={e => setNewEvent(p => ({ ...p, note: e.target.value }))}
                                        placeholder="Not (isteğe bağlı)" className="w-full text-xs border border-line rounded-lg px-3 py-2 outline-none" />
                                    <div className="flex gap-2">
                                        <button onClick={() => setShowAddForm(false)} className="flex-1 text-xs py-2 border border-line rounded-lg text-ink-2 hover:bg-surface-2">İptal</button>
                                        <button onClick={handleAddEvent} className="flex-1 text-xs py-2 bg-brand text-white rounded-lg font-bold flex items-center justify-center gap-1">
                                            <Check size={12} /> Ekle
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Yaklaşan Etkinlikler */}
                    <div className="bg-surface rounded-2xl shadow-sm border border-line p-4">
                        <h4 className="font-black text-ink text-sm mb-3 flex items-center gap-2">
                            <Clock size={14} className="text-warn" /> Yaklaşan (30 Gün)
                        </h4>
                        {upcomingEvents.length === 0 ? (
                            <p className="text-xs text-ink-3 text-center py-4">Yaklaşan etkinlik yok</p>
                        ) : (
                            <div className="space-y-2">
                                {upcomingEvents.map(e => {
                                    const d = new Date(e.date);
                                    const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
                                    return (
                                        <div key={e.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-2 transition">
                                            <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-center flex-shrink-0 ${e.color}`}>
                                                <span className="text-[9px] font-bold">{MONTHS_TR[d.getMonth()].slice(0, 3).toUpperCase()}</span>
                                                <span className="text-base font-black leading-tight">{d.getDate()}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-ink truncate">{e.title}</p>
                                                <p className="text-[10px] text-ink-3">{e.type} • {diff === 0 ? 'Bugün!' : diff === 1 ? 'Yarın' : `${diff} gün sonra`}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamCalendar;
