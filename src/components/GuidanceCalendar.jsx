import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Plus, ChevronLeft, ChevronRight, X, CheckCircle, Video, Users } from 'lucide-react';
import { pdrService } from '../services/pdrService';

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

const GuidanceCalendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        type: 'Seminer', // Seminer, Veli Toplantisi, Sinif Ziyareti, Bireysel Gorusme
        description: '',
        location: 'Konferans Salonu'
    });

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        const data = await pdrService.getEvents();
        setEvents(data);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        await pdrService.addEvent(newEvent);
        setShowModal(false);
        loadEvents();
        setNewEvent({ title: '', date: new Date().toISOString().split('T')[0], time: '09:00', type: 'Seminer', description: '', location: 'Konferans Salonu' });
        alert('Etkinlik takvime eklendi.');
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu etkinliği silmek istediğinize emin misiniz?')) {
            await pdrService.deleteEvent(id);
            loadEvents();
        }
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
        // Adjust for Monday start (Turkish system)
        const startDay = firstDay === 0 ? 6 : firstDay - 1;
        return { days, startDay };
    };

    const changeMonth = (delta) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
    };

    const { days, startDay } = getDaysInMonth(currentDate);
    const today = new Date();

    const getEventsForDay = (day) => {
        const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day + 1).toISOString().split('T')[0];
        // Fix for timezone offset issues in simple comparison? 
        // Better: Construct date string manually from year-month-day to match input type='date'
        const m = currentDate.getMonth() + 1;
        const dStr = `${currentDate.getFullYear()}-${m < 10 ? '0' + m : m}-${day < 10 ? '0' + day : day}`;
        return events.filter(e => e.date === dStr);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center bg-surface p-6 rounded-2xl border border-line shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-ink flex items-center">
                        <Calendar className="mr-2 text-brand" />
                        Rehberlik Etkinlik Takvimi
                    </h2>
                    <p className="text-ink-2 mt-1">
                        Okul genelindeki rehberlik çalışmalarını, seminerleri ve toplantıları planlayın.
                    </p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary mt-4 md:mt-0 flex items-center">
                    <Plus size={20} className="mr-2" /> Yeni Etkinlik
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar View */}
                <div className="lg:col-span-2 bg-surface p-6 rounded-2xl border border-line shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-ink uppercase tracking-wide">
                            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h3>
                        <div className="flex space-x-2">
                            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-surface-3 rounded-full transition"><ChevronLeft /></button>
                            <button onClick={() => setCurrentDate(new Date())} className="text-sm font-bold text-brand px-3 hover:bg-brand-soft rounded-lg">Bugün</button>
                            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-surface-3 rounded-full transition"><ChevronRight /></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                        {DAYS.map(day => <div key={day} className="text-xs font-bold text-ink-3 uppercase py-2">{day.substring(0, 3)}</div>)}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} className="h-24 md:h-32 bg-surface-2/50 rounded-xl"></div>)}

                        {Array.from({ length: days }).map((_, i) => {
                            const day = i + 1;
                            const dayEvents = getEventsForDay(day);
                            const isToday = today.getDate() === day && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();

                            return (
                                <div key={day} className={`h-24 md:h-32 border ${isToday ? 'border-brand bg-brand-soft/10' : 'border-line bg-surface'} rounded-xl p-2 relative group hover:shadow-md transition overflow-hidden`}>
                                    <span className={`text-sm font-bold ${isToday ? 'text-brand bg-brand-soft w-6 h-6 rounded-full flex items-center justify-center' : 'text-ink-2'}`}>
                                        {day}
                                    </span>

                                    <div className="mt-1 space-y-1 overflow-y-auto max-h-[80%] custom-scrollbar">
                                        {dayEvents.map(ev => (
                                            <div key={ev.id} className={`text-[10px] p-1 rounded truncate font-medium cursor-pointer flex items-center ${ev.type === 'Seminer' ? 'bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] text-c4' :
                                                    ev.type === 'Veli Toplantisi' ? 'bg-warn-soft text-warn' :
                                                        'bg-info-soft text-info'
                                                }`} title={ev.title}>
                                                {ev.time} {ev.title}
                                            </div>
                                        ))}
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Upcoming Events List */}
                <div className="bg-surface p-6 rounded-2xl border border-line shadow-sm h-full flex flex-col">
                    <h3 className="font-bold text-ink mb-4 flex items-center">
                        <Clock className="mr-2 text-ok" size={20} />
                        Yaklaşan Etkinlikler
                    </h3>

                    <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                        {events.sort((a, b) => new Date(a.date) - new Date(b.date)).filter(e => new Date(e.date) >= new Date().setHours(0, 0, 0, 0)).length === 0 ? (
                            <p className="text-ink-3 text-center py-8 text-sm italic">Planlanmış yakın tarihli etkinlik yok.</p>
                        ) : (
                            events.sort((a, b) => new Date(a.date) - new Date(b.date))
                                .filter(e => new Date(e.date) >= new Date().setHours(0, 0, 0, 0))
                                .slice(0, 5)
                                .map(ev => (
                                    <div key={ev.id} className="p-4 rounded-xl border border-line hover:border-brand-line hover:shadow-sm transition bg-surface-2/50 group relative">
                                        <button
                                            onClick={() => handleDelete(ev.id)}
                                            className="absolute top-2 right-2 text-ink-3 hover:text-danger opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <X size={16} />
                                        </button>
                                        <div className="flex items-center mb-2">
                                            <div className={`p-2 rounded-lg mr-3 ${ev.type === 'Seminer' ? 'bg-[color-mix(in_srgb,var(--c4)_14%,var(--surface))] text-c4' :
                                                    ev.type === 'Veli Toplantisi' ? 'bg-warn-soft text-warn' :
                                                        'bg-info-soft text-info'
                                                }`}>
                                                {ev.type === 'Seminer' ? <Video size={18} /> :
                                                    ev.type === 'Veli Toplantisi' ? <Users size={18} /> :
                                                        <CheckCircle size={18} />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-ink text-sm">{ev.title}</h4>
                                                <span className="text-xs text-ink-2 font-medium">{ev.type}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center text-xs text-ink-2 mt-2 space-x-3">
                                            <span className="flex items-center"><Calendar size={12} className="mr-1" /> {new Date(ev.date).toLocaleDateString()}</span>
                                            <span className="flex items-center"><Clock size={12} className="mr-1" /> {ev.time}</span>
                                            <span className="flex items-center"><MapPin size={12} className="mr-1" /> {ev.location}</span>
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </div>
            </div>

            {/* Add Event Modal */}
            {showModal && (
                <div className="fixed inset-0 z-modal-high bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-line flex justify-between items-center bg-surface-2">
                            <h3 className="font-bold text-lg text-ink">Yeni Etkinlik Planla</h3>
                            <button onClick={() => setShowModal(false)} className="text-ink-3 hover:text-ink-2"><X /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-ink-2 mb-1">Etkinlik Başlığı</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border border-line rounded-lg outline-none focus:ring-2 focus:ring-brand"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    placeholder="Örn: Sınav Kaygısı Semineri"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-ink-2 mb-1">Tarih</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-2 border border-line rounded-lg outline-none"
                                        value={newEvent.date}
                                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-ink-2 mb-1">Saat</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full p-2 border border-line rounded-lg outline-none"
                                        value={newEvent.time}
                                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-ink-2 mb-1">Etkinlik Türü</label>
                                <select
                                    className="w-full p-2 border border-line rounded-lg outline-none bg-surface"
                                    value={newEvent.type}
                                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                                >
                                    <option value="Seminer">Seminer / Konferans</option>
                                    <option value="Veli Toplantisi">Veli Toplantısı</option>
                                    <option value="Sinif Ziyareti">Sınıf Rehberliği</option>
                                    <option value="Sosyal Etkinlik">Sosyal Etkinlik</option>
                                    <option value="Hizmetici">Hizmetİçi Eğitim</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-ink-2 mb-1">Yer / Salon</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-line rounded-lg outline-none"
                                    value={newEvent.location}
                                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-ink-2 mb-1">Açıklama (Opsiyonel)</label>
                                <textarea
                                    className="w-full p-2 border border-line rounded-lg outline-none h-24 resize-none"
                                    value={newEvent.description}
                                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                    placeholder="Detaylar..."
                                />
                            </div>

                            <button type="submit" className="w-full py-3 bg-brand text-white rounded-xl font-bold hover:bg-brand-hover transition shadow-lg">
                                Kaydet
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GuidanceCalendar;
