
const DB_KEYS = {
    INTERVIEWS: 'pdr_interviews',
    FORMS: 'pdr_student_forms',
    INVENTORIES: 'pdr_inventories'
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const pdrService = {
    // --- GÖRÜŞME KAYITLARI (INTERVIEWS) ---
    async addInterview(studentId, interviewData) {
        await delay(200);
        const allInterviews = JSON.parse(localStorage.getItem(DB_KEYS.INTERVIEWS) || '[]');
        const newInterview = {
            id: Date.now(),
            studentId,
            ...interviewData, // date, type, subject, notes, privacyLevel
            createdAt: new Date().toISOString()
        };
        allInterviews.push(newInterview);
        localStorage.setItem(DB_KEYS.INTERVIEWS, JSON.stringify(allInterviews));
        return newInterview;
    },

    async getStudentInterviews(studentId) {
        await delay(200);
        const allInterviews = JSON.parse(localStorage.getItem(DB_KEYS.INTERVIEWS) || '[]');
        return allInterviews.filter(i => i.studentId === studentId).sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    async deleteInterview(id) {
        await delay(200);
        const allInterviews = JSON.parse(localStorage.getItem(DB_KEYS.INTERVIEWS) || '[]');
        const filtered = allInterviews.filter(i => i.id !== id);
        localStorage.setItem(DB_KEYS.INTERVIEWS, JSON.stringify(filtered));
        return true;
    },

    // --- ÖĞRENCİ TANIMA FORMLARI (DEMOGRAPHICS) ---
    async saveStudentForm(studentId, formData) {
        await delay(300);
        const allForms = JSON.parse(localStorage.getItem(DB_KEYS.FORMS) || '{}');
        allForms[studentId] = {
            ...formData,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem(DB_KEYS.FORMS, JSON.stringify(allForms));
        return true;
    },

    async getStudentForm(studentId) {
        await delay(200);
        const allForms = JSON.parse(localStorage.getItem(DB_KEYS.FORMS) || '{}');
        return allForms[studentId] || null;
    },

    // --- ENVANTERLER VE TESTLER ---
    async assignInventory(studentId, inventoryType) {
        // Öğrenciye envanter atama (Dashboard'da bildirim olarak düşebilir)
        await delay(200);
        // Bu kısım api.js'deki test altyapısıyla entegre çalışabilir
        return true;
    },

    // --- TAKVİM ETKİNLİKLERİ ---
    async getEvents() {
        await delay(200);
        return JSON.parse(localStorage.getItem('pdr_events') || '[]');
    },

    async addEvent(event) {
        await delay(200);
        const events = JSON.parse(localStorage.getItem('pdr_events') || '[]');
        const newEvent = { ...event, id: Date.now() };
        events.push(newEvent);
        localStorage.setItem('pdr_events', JSON.stringify(events));
        return newEvent;
    },

    async deleteEvent(id) {
        await delay(200);
        const events = JSON.parse(localStorage.getItem('pdr_events') || '[]');
        const filtered = events.filter(e => e.id !== id);
        localStorage.setItem('pdr_events', JSON.stringify(filtered));
        return true;
    }
};
