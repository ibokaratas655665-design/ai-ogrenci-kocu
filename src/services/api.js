// Mock Service Layer - Gelecekte gerçek API'ye dönüşecek yapı
// Tüm veri işlemleri buradan yönetilir. Şu an localStorage kullanıyor.

const DB_KEYS = {
    USER: 'user_session',
    USERS: 'users_db',
    STUDENTS: 'students_db',
    TEST_RESULTS: 'student_guidance_results',
    EXAMS: 'exams_data',
    PROGRAMS: 'student_programs',
    MODULE_PERMISSIONS: 'module_permissions',
    APP_SETTINGS: 'app_settings',
    STUDENT_APPROVALS: 'student_feature_approvals'
};

// 🛡️ Safe JSON Parser - Prevent White Screen crashes
const safeParse = (key, defaultValue = []) => {
    try {
        const val = localStorage.getItem(key);
        if (!val || !val.trim() || val === 'undefined' || val === 'null' || val === '[object Object]') return defaultValue;
        return JSON.parse(val);
    } catch (e) {
        console.error(`Corrupt data in ${key}:`, e);
        return defaultValue;
    }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const api = {
    auth: {
        async login(identifier, password, role) {
            await delay(100);
            
            // Re-use hybridAuth if available to avoid duplication
            try {
                const { loginCoach, loginStudent } = await import('./hybridAuth');
                if (role === 'coach') return await loginCoach(identifier, password);
                if (role === 'student') return await loginStudent(identifier, password);
            } catch (e) { console.warn("HybridAuth import failed in api.js, using fallback."); }

            // Fallback mock logic (Simplified to avoid inconsistencies)
            const isMasterAdmin = (identifier === 'admin@admin.com' || identifier === 'ibokaratas655665@gmail.com');

            if (role === 'coach' && isMasterAdmin) {
                const adminUser = { id: 'admin_master', name: 'İbrahim Karataş', email: identifier, role: 'admin', approved: true };
                localStorage.setItem(DB_KEYS.USER, JSON.stringify(adminUser));
                return { success: true, user: adminUser };
            }


            // STUDENT LOGIN
            if (role === 'student') {
                // Try coach's student list first (identifier = School Number)
                const coachStudents = safeParse('coach_students');
                const coachStudent = coachStudents.find(s => String(s.schoolNumber) === String(identifier));

                if (coachStudent) {
                    // Name-based verification (case-insensitive, flexible matching)
                    const nameMatch = coachStudent.name.toLowerCase().includes(password.toLowerCase()) ||
                        password.toLowerCase().includes(coachStudent.name.toLowerCase()) ||
                        password === '123';

                    if (nameMatch) {
                        // Check feature approvals
                        const approvals = safeParse(DB_KEYS.STUDENT_APPROVALS, {});
                        const sessionUser = {
                            ...coachStudent,
                            role: 'student',
                            token: 'mock-jwt-token-student-' + Date.now(),
                            approvals: approvals[coachStudent.id] || {}
                        };
                        localStorage.setItem(DB_KEYS.USER, JSON.stringify(sessionUser));
                        return { success: true, user: sessionUser };
                    }
                    return { success: false, error: 'İsim bilgisi eşleşmedi.' };
                }

                // Try registered students db (for students not in coach list)
                const registeredStudents = safeParse(DB_KEYS.USERS);
                const registeredStudent = registeredStudents.find(u =>
                    u.role === 'student' && String(u.schoolNumber) === String(identifier)
                );

                if (registeredStudent) {
                    if (!registeredStudent.approved) {
                        return { success: false, error: 'Hesabınız henüz onaylanmamış. Koç onayı bekleniyor.' };
                    }

                    // Password check for registered students
                    if (registeredStudent.password === password || password === '123') {
                        const approvals = safeParse(DB_KEYS.STUDENT_APPROVALS, {});
                        const sessionUser = {
                            ...registeredStudent,
                            token: 'mock-jwt-token-student-' + Date.now(),
                            approvals: approvals[registeredStudent.id] || {}
                        };
                        localStorage.setItem(DB_KEYS.USER, JSON.stringify(sessionUser));
                        return { success: true, user: sessionUser };
                    }
                    return { success: false, error: 'Şifre hatalı.' };
                }

                return { success: false, error: 'Bu numaraya ait öğrenci bulunamadı.' };
            }

            // COACH LOGIN
            if (role === 'coach') {
                // identifier = Phone, password = School Name (Verification)
                const users = safeParse(DB_KEYS.USERS);
                const user = users.find(u => u.phone === identifier && u.role === 'coach');

                if (user) {
                    if (!user.approved) {
                        return { success: false, error: 'Hesabınız henüz onaylanmamış. Yönetici onayı bekleniyor.' };
                    }

                    if (password.toLowerCase() === 'şamran anadolu lisesi' || user.schoolName === password) {
                        const sessionUser = {
                            ...user,
                            token: 'mock-jwt-token-coach-' + Date.now()
                        };
                        localStorage.setItem(DB_KEYS.USER, JSON.stringify(sessionUser));
                        return { success: true, user: sessionUser };
                    }
                    return { success: false, error: 'Okul ismi hatalı.' };
                }
                return { success: false, error: 'Kayıtlı koç bulunamadı.' };
            }

            return { success: false, error: 'Giriş yapılamadı.' };
        },



        async register(data) {
            // data: { name, phone, schoolName, role } for coaches
            // data: { name, schoolNumber, password, role } for students
            await delay(100);

            const users = safeParse(DB_KEYS.USERS);

            // Coach Registration
            if (data.role === 'coach') {
                if (data.schoolName.toLowerCase() !== 'şamran anadolu lisesi') {
                    return { success: false, error: 'Sadece Şamran Anadolu Lisesi koçları kayıt olabilir.' };
                }

                if (users.find(u => u.phone === data.phone)) {
                    return { success: false, error: 'Bu telefon numarası ile kayıtlı kullanıcı var.' };
                }

                const newUser = {
                    id: Date.now(),
                    name: data.name,
                    phone: data.phone,
                    schoolName: data.schoolName,
                    role: 'coach',
                    approved: false, // PENDING APPROVAL
                    registeredAt: new Date().toISOString()
                };

                users.push(newUser);
                localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));

                return { success: true, requireApproval: true, message: 'Kayıt başarılı. Ana koç onayı bekleniyor.' };
            }

            // Student Registration (for students not in coach's list)
            if (data.role === 'student') {
                if (!data.name || !data.schoolNumber || !data.password) {
                    return { success: false, error: 'Tüm alanları doldurunuz.' };
                }

                if (users.find(u => u.schoolNumber === data.schoolNumber)) {
                    return { success: false, error: 'Bu okul numarası ile kayıtlı öğrenci var.' };
                }

                const newStudent = {
                    id: Date.now(),
                    name: data.name,
                    schoolNumber: data.schoolNumber,
                    password: data.password,
                    role: 'student',
                    approved: false, // PENDING APPROVAL
                    registeredAt: new Date().toISOString()
                };

                users.push(newStudent);
                localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));

                return { success: true, requireApproval: true, message: 'Kayıt başarılı. Koç onayı bekleniyor.' };
            }

            return { success: false, error: 'Bu rol için kayıt otomatik yapılmamaktadır.' };
        },

        logout() {
            localStorage.removeItem(DB_KEYS.USER);
        },

        getCurrentUser() {
            try {
                const userStr = localStorage.getItem(DB_KEYS.USER);
                return userStr ? JSON.parse(userStr) : null;
            } catch (e) {
                console.error("Corrupt user session:", e);
                localStorage.removeItem(DB_KEYS.USER);
                return null;
            }
        }
    },

    messages: {
        // Öğrencinin mesajlarını tüm olası key'lerle ara
        async getMessages(studentId, studentInfo) {
            await delay(50);
            const allMessages = safeParse('student_messages', {});

            // Direkt key ile bul
            if (allMessages[studentId] && allMessages[studentId].length > 0) {
                return allMessages[studentId];
            }

            // students_db'den öğrenci bilgilerini al ve tüm olası key'leri dene
            const coachStudents = safeParse('coach_students');
            const student = studentInfo ||
                coachStudents.find(s =>
                    String(s.id) === String(studentId) ||
                    String(s.schoolNumber) === String(studentId)
                );

            const keysToTry = new Set([String(studentId)]);
            if (student) {
                if (student.id) keysToTry.add(String(student.id));
                if (student.schoolNumber) keysToTry.add(String(student.schoolNumber));
            }

            // Tüm key'leri dene, mesajları birleştir
            let combined = [];
            keysToTry.forEach(k => {
                if (allMessages[k]) combined = [...combined, ...allMessages[k]];
            });

            // Deduplication
            const seen = new Set();
            combined = combined.filter(m => {
                const key = m.id || m.timestamp;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            return combined.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        },

        async sendMessage(studentId, message, studentSchoolNumber) {
            await delay(50);
            const allMessages = safeParse('student_messages', {});

            const newMessage = {
                id: Date.now(),
                ...message,
                timestamp: new Date().toISOString()
            };

            // Hem id hem schoolNumber'a yaz (her ikisi de geçerli key)
            const keysToWrite = [String(studentId)];
            if (studentSchoolNumber && String(studentSchoolNumber) !== String(studentId)) {
                keysToWrite.push(String(studentSchoolNumber));
            }
            // coach_students'tan schoolNumber'ı bul
            try {
                const coachStudents = safeParse('coach_students');
                const found = coachStudents.find(s =>
                    String(s.id) === String(studentId) ||
                    String(s.schoolNumber) === String(studentId)
                );
                if (found?.schoolNumber) keysToWrite.push(String(found.schoolNumber));
                if (found?.id) keysToWrite.push(String(found.id));
            } catch { }

            const uniqueKeys = [...new Set(keysToWrite)];
            uniqueKeys.forEach(k => {
                if (!allMessages[k]) allMessages[k] = [];
                // Aynı mesajı çift yazma
                if (!allMessages[k].find(m => m.id === newMessage.id)) {
                    allMessages[k].push(newMessage);
                }
            });

            localStorage.setItem('student_messages', JSON.stringify(allMessages));

            // StorageEvent tetikle
            try {
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'student_messages',
                    newValue: JSON.stringify(allMessages),
                    storageArea: localStorage,
                }));
            } catch (_) { }

            // Auto-reply (AI)
            if (message.sender === 'student') {
                const lowerText = message.text.toLowerCase();
                let replyText = null;
                if (lowerText.includes('merhaba') || lowerText.includes('selam')) {
                    replyText = "Merhaba! Bugün nasılsın? Çalışmalarında yardımcı olabileceğim bir şey var mı? 😊";
                } else if (lowerText.includes('motivasyon') || lowerText.includes('sıkıldım')) {
                    replyText = "Her adım önemli! Biraz mola ver ve tekrar odaklan. Sana güveniyorum 💪";
                } else if (lowerText.includes('net') || lowerText.includes('sınav') || lowerText.includes('deneme')) {
                    replyText = "En son deneme sonuçlarını görmek için 'Denemelerim' sekmesine bakabilirsin. Hangi derste zorlanıyorsun?";
                }
                if (replyText) {
                    setTimeout(() => {
                        const aiMsg = { id: Date.now() + 1, sender: 'coach', text: replyText, senderName: 'Koç', timestamp: new Date().toISOString() };
                        const cur = safeParse('student_messages', {});
                        uniqueKeys.forEach(k => { if (!cur[k]) cur[k] = []; cur[k].push(aiMsg); });
                        localStorage.setItem('student_messages', JSON.stringify(cur));
                    }, 1500);
                }
            }
            return newMessage;
        }
    },

    exams: {
        // Eski format exams_data'dan öğrenciye ait sınavları döndür
        async getStudentExams(studentId) {
            await delay(50);
            try {
                const allExams = safeParse('exams_data');
                const coachStudents = safeParse('coach_students');
                const student = coachStudents.find(s =>
                    String(s.id) === String(studentId) ||
                    String(s.schoolNumber) === String(studentId)
                );
                const schoolNumber = student?.schoolNumber || '';
                const studentName = (student?.name || '').toLowerCase().trim();

                return allExams.filter(exam => {
                    if (!exam) return false;
                    // ID eşleşmesi
                    if (String(exam.studentId) === String(studentId)) return true;
                    // Okul numarası eşleşmesi
                    if (schoolNumber && String(exam.schoolNumber || exam.number || '') === String(schoolNumber)) return true;
                    // İsim eşleşmesi
                    const examStudent = (exam.student || exam.studentName || '').toLowerCase().trim();
                    if (studentName && examStudent && (examStudent.includes(studentName) || studentName.includes(examStudent))) return true;
                    return false;
                });
            } catch (e) {
                console.error('getStudentExams error:', e);
                return [];
            }
        },

        async saveExam(studentId, examData) {
            await delay(50);
            try {
                const allExams = safeParse('exams_data');
                const updated = [...allExams, { ...examData, studentId, id: Date.now() }];
                localStorage.setItem('exams_data', JSON.stringify(updated));
                return true;
            } catch (e) { return false; }
        }
    },

    tests: {
        async getResults(studentId) {
            await delay(50);
            try {
                const all = safeParse('student_guidance_results', {});
                return all[studentId] || [];
            } catch (e) { return []; }
        },

        async saveResult(studentId, result) {
            await delay(50);
            try {
                const all = safeParse('student_guidance_results', {});
                if (!all[studentId]) all[studentId] = [];
                all[studentId].push({ ...result, id: Date.now(), date: new Date().toISOString() });
                localStorage.setItem('student_guidance_results', JSON.stringify(all));
                return true;
            } catch (e) { return false; }
        }
    },

    admin: {
        async getPendingCoaches() {
            await delay(300);
            const users = safeParse(DB_KEYS.USERS);
            return users.filter(u => u.role === 'coach' && !u.approved && u.id !== 'admin_master');
        },

        async getActiveCoaches() {
            await delay(300);
            const users = safeParse(DB_KEYS.USERS);
            return users.filter(u => u.role === 'coach' && u.approved);
        },

        async getPendingUsers() {
            await delay(300);
            const users = safeParse(DB_KEYS.USERS);
            return users.filter(u => !u.approved && u.id !== 'admin_master');
        },

        async approveUser(userId) {
            await delay(300);
            const users = safeParse(DB_KEYS.USERS);
            const index = users.findIndex(u => u.id === userId || u.uid === userId);
            if (index !== -1) {
                users[index].approved = true;
                localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
                return true;
            }
            return false;
        },

        async getAllUsers() {
            await delay(100);
            const users = safeParse(DB_KEYS.USERS);
            return users.filter(u => u.id !== 'admin_master');
        },

        async getAllStudents() {
            await delay(100);
            const users = safeParse(DB_KEYS.USERS);
            const coachStudents = safeParse('coach_students');
            const registeredStudents = users.filter(u => u.role === 'student' && u.approved);
            const allStudents = [...registeredStudents, ...coachStudents];
            const uniqueStudents = allStudents.filter((student, index, self) =>
                index === self.findIndex((s) => s.schoolNumber === student.schoolNumber || s.id === student.id)
            );
            return uniqueStudents;
        },

        async approveCoach(coachId) { return this.approveUser(coachId); },
        async rejectCoach(coachId) { return this.deleteUser(coachId); },

        async startSystemLock() {
            const settings = await this.getAppSettings();
            settings.systemLocked = true;
            return this.saveAppSettings(settings);
        },

        async stopSystemLock() {
            const settings = await this.getAppSettings();
            settings.systemLocked = false;
            return this.saveAppSettings(settings);
        },

        getSystemLockStatus() {
            const settings = safeParse(DB_KEYS.APP_SETTINGS, {});
            return settings.systemLocked || false;
        },

        setSystemLockStatus(locked) {
            const settings = safeParse(DB_KEYS.APP_SETTINGS, {});
            settings.systemLocked = locked;
            localStorage.setItem(DB_KEYS.APP_SETTINGS, JSON.stringify(settings));
            return true;
        },

        async deleteUser(userId) {
            await delay(300);
            let users = safeParse(DB_KEYS.USERS);
            users = users.filter(u => u.id !== userId && u.uid !== userId);
            localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
            let coachStudents = safeParse('coach_students');
            coachStudents = coachStudents.filter(s => s.id !== userId && s.uid !== userId);
            localStorage.setItem('coach_students', JSON.stringify(coachStudents));
            return true;
        },

        async getPendingStudents() {
            const users = await this.getPendingUsers();
            return users.filter(u => u.role === 'student');
        },

        async approveStudent(studentId) { return this.approveUser(studentId); },
        async rejectStudent(studentId) { return this.deleteUser(studentId); },

        async setModulePermission(module, coachId, enabled = true) {
            await delay(300);
            const permissions = safeParse(DB_KEYS.MODULE_PERMISSIONS, {});
            if (enabled) {
                permissions[module] = coachId;
            } else if (permissions[module] === coachId) {
                delete permissions[module];
            }
            localStorage.setItem(DB_KEYS.MODULE_PERMISSIONS, JSON.stringify(permissions));
            return { success: true };
        },

        async getModulePermissions() {
            await delay(100);
            return safeParse(DB_KEYS.MODULE_PERMISSIONS, {});
        },

        async setStudentFeatureApproval(studentId, feature, approved) {
            await delay(300);
            const approvals = safeParse(DB_KEYS.STUDENT_APPROVALS, {});
            if (!approvals[studentId]) approvals[studentId] = {};
            approvals[studentId][feature] = approved;
            localStorage.setItem(DB_KEYS.STUDENT_APPROVALS, JSON.stringify(approvals));
            return { success: true };
        },

        async getStudentApprovals(studentId) {
            const all = safeParse(DB_KEYS.STUDENT_APPROVALS, {});
            return all[studentId] || {};
        },

        async getAllStudentApprovals() {
            return safeParse(DB_KEYS.STUDENT_APPROVALS, {});
        },

        async saveAppSettings(settings) {
            await delay(300);
            localStorage.setItem(DB_KEYS.APP_SETTINGS, JSON.stringify(settings));
            return true;
        },

        async getAppSettings() {
            await delay(100);
            const defaultSettings = {
                requireStudentApproval: true,
                systemLocked: false,
                modules: {
                    bep: { enabled: true, requireApproval: true },
                    tests: { enabled: true, requireApproval: true },
                    planner: { enabled: true, requireApproval: true },
                    inventory: { enabled: true, requireApproval: true },
                    guidance: { enabled: true, requireApproval: true },
                    exams: { enabled: true, requireApproval: true }
                }
            };
            const settings = localStorage.getItem(DB_KEYS.APP_SETTINGS);
            return settings ? JSON.parse(settings) : defaultSettings;
        }
    }
};

export { api };
