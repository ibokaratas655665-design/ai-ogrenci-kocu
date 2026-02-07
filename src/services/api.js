// Mock Service Layer - Gelecekte gerçek API'ye dönüşecek yapı
// Tüm veri işlemleri buradan yönetilir. Şu an localStorage kullanıyor.

const DB_KEYS = {
    USER: 'user_session',
    USERS: 'users_db',
    STUDENTS: 'students_db',
    TEST_RESULTS: 'student_guidance_results',
    EXAMS: 'student_exam_results',
    PROGRAMS: 'student_programs'
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const api = {
    auth: {
        async login(email, password, role) {
            await delay(100); // Gecikmeyi düşürdük

            const users = JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');

            // Admin kontrolü (Hardcoded admin)
            if (email === 'admin@admin.com' && password === 'admin123') {
                const adminUser = {
                    id: 'admin_master',
                    name: 'Sistem Yöneticisi',
                    email: 'admin@admin.com',
                    role: 'admin',
                    approved: true
                };
                // Eğer admin yoksa kaydet
                if (!users.some(u => u.email === 'admin@admin.com')) {
                    users.push({ ...adminUser, password: 'admin123' });
                    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
                }

                const sessionUser = {
                    ...adminUser,
                    token: 'mock-jwt-token-admin-' + Date.now()
                };
                localStorage.setItem(DB_KEYS.USER, JSON.stringify(sessionUser));
                return { success: true, user: sessionUser };
            }

            // Normal kullanıcı girişi (Koç veya Admin)
            let user = users.find(u => u.email === email && u.password === password);

            // ÖĞRENCİ GİRİŞİ (Okul Numarası ile)
            if (!user && role === 'student') {
                const students = JSON.parse(localStorage.getItem('coach_students') || '[]');
                // E-posta yerine Okul Numarası giriliyor
                // Şifre olarak da Okul Numarası bekleniyor (Geçici Güvenlik)
                const studentUser = students.find(s =>
                    String(s.schoolNumber) === String(email) &&
                    String(s.schoolNumber) === String(password)
                );

                if (studentUser) {
                    // Öğrenci bulundu, oturum nesnesi oluştur
                    const sessionUser = {
                        id: studentUser.id,
                        name: studentUser.name,
                        email: studentUser.schoolNumber, // Email yerine okul no taşıyoruz
                        role: 'student',
                        schoolNumber: studentUser.schoolNumber,
                        grade: studentUser.grade,
                        section: studentUser.section,
                        token: 'mock-jwt-token-student-' + Date.now()
                    };
                    localStorage.setItem(DB_KEYS.USER, JSON.stringify(sessionUser));
                    return { success: true, user: sessionUser };
                }
            }

            if (!user) {
                if (role === 'student') {
                    return { success: false, error: 'Okul numarası veya şifre hatalı. (Şifreniz okul numaranızdır)' };
                }
                return { success: false, error: 'E-posta veya şifre hatalı.' };
            }

            // Rol kontrolü
            if (user.role !== 'admin' && user.role !== role) {
                const correctRole = user.role === 'student' ? 'Öğrenci' : 'Koç';
                return { success: false, error: `Bu hesaba sadece '${correctRole}' girişinden erişebilirsiniz.` };
            }

            // Sistem kilit durumu
            const isSystemLocked = localStorage.getItem('SYSTEM_LOCKED') === 'true';
            if (isSystemLocked && user.role !== 'admin') {
                return { success: false, error: 'Sistem şu anda bakımda. Sadece yöneticiler giriş yapabilir.' };
            }

            // Onay bekleme durumu
            if (user.role !== 'admin' && !user.approved) {
                return { success: false, error: 'Hesabınız henüz yönetici tarafından onaylanmadı.' };
            }

            const { password: _, ...userWithoutPassword } = user;
            const sessionUser = {
                ...userWithoutPassword,
                token: 'mock-jwt-token-' + Date.now()
            };
            localStorage.setItem(DB_KEYS.USER, JSON.stringify(sessionUser));
            return { success: true, user: sessionUser };
        },



        async register(name, email, password, role) {
            await delay(100);

            const users = JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');

            if (users.some(u => u.email === email)) {
                return { success: false, error: 'Bu e-posta adresi zaten kayıtlı.' };
            }

            // İlk kullanıcı admin olsun mu? İptal edildi. Sadece explicit admin var.
            // Her yeni kayıt onay bekler.

            const newUser = {
                id: Date.now(),
                name,
                email,
                password,
                role,
                approved: false, // Herkes onay bekler
                registeredAt: new Date().toISOString()
            };

            users.push(newUser);
            localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));

            // Öğrenciyse listeye ekle (Onay Bekliyor)
            if (role === 'student') {
                const students = JSON.parse(localStorage.getItem(DB_KEYS.STUDENTS) || '[]');
                students.push({ ...newUser, progress: 0, status: 'Onay Bekliyor' });
                localStorage.setItem(DB_KEYS.STUDENTS, JSON.stringify(students));
            }

            return {
                success: true,
                requireApproval: true, // Frontend'i uyar: Kullanıcı beklemeye alındı
                message: 'Kaydınız alındı. Yönetici onayı bekleniyor.'
            };
        },

        logout() {
            localStorage.removeItem(DB_KEYS.USER);
        },

        getCurrentUser() {
            const userStr = localStorage.getItem(DB_KEYS.USER);
            return userStr ? JSON.parse(userStr) : null;
        }
    },

    messages: {
        async getMessages(studentId) {
            await delay(100);
            const allMessages = JSON.parse(localStorage.getItem('student_messages') || '{}');
            return allMessages[studentId] || [];
        },

        async sendMessage(studentId, message) {
            await delay(100);
            const allMessages = JSON.parse(localStorage.getItem('student_messages') || '{}');
            if (!allMessages[studentId]) allMessages[studentId] = [];

            const newMessage = {
                id: Date.now(),
                ...message, // { sender: 'coach'|'student', text: '...', timestamp: ... }
                timestamp: new Date().toISOString()
            };

            allMessages[studentId].push(newMessage);
            localStorage.setItem('student_messages', JSON.stringify(allMessages));
            return newMessage;
        }
    },

    admin: {
        async getPendingUsers() {
            await delay(300);
            const users = JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
            return users.filter(u => !u.approved && u.role !== 'admin');
        },

        async getAllUsers() {
            await delay(300);
            const users = JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
            return users.filter(u => u.role !== 'admin'); // Admin kendisi hariç diğerlerini görsün
        },

        async approveUser(userId) {
            await delay(300);
            const users = JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
            const userIndex = users.findIndex(u => u.id === userId);

            if (userIndex !== -1) {
                users[userIndex].approved = true;
                localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));

                // Öğrenciyse student db'sini de güncelle
                if (users[userIndex].role === 'student') {
                    const students = JSON.parse(localStorage.getItem(DB_KEYS.STUDENTS) || '[]');
                    const studentIndex = students.findIndex(s => s.id === userId);
                    if (studentIndex !== -1) {
                        students[studentIndex].status = 'Aktif';
                        localStorage.setItem(DB_KEYS.STUDENTS, JSON.stringify(students));
                    }
                }
                return true;
            }
            return false;
        },

        async startSystemLock() {
            localStorage.setItem('SYSTEM_LOCKED', 'true');
            return true;
        },

        async stopSystemLock() {
            localStorage.setItem('SYSTEM_LOCKED', 'false');
            return true;
        },

        getSystemLockStatus() {
            return localStorage.getItem('SYSTEM_LOCKED') === 'true';
        },
        async deleteUser(userId) {
            await delay(300);
            // Users DB'den sil
            let users = JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
            users = users.filter(u => u.id !== userId);
            localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));

            // Students DB'den sil
            let students = JSON.parse(localStorage.getItem(DB_KEYS.STUDENTS) || '[]');
            students = students.filter(s => s.id !== userId);
            localStorage.setItem(DB_KEYS.STUDENTS, JSON.stringify(students));

            return true;
        }
    },

    tests: {
        async saveResult(studentId, testType, result) {
            await delay(300);
            const allResults = JSON.parse(localStorage.getItem(DB_KEYS.TEST_RESULTS) || '{}');
            if (!allResults[studentId]) allResults[studentId] = [];

            const newResult = {
                id: Date.now(),
                testType,
                ...result,
                date: new Date().toISOString()
            };

            allResults[studentId].push(newResult);
            localStorage.setItem(DB_KEYS.TEST_RESULTS, JSON.stringify(allResults));
            return newResult;
        },

        async getResults(studentId) {
            await delay(300);
            const allResults = JSON.parse(localStorage.getItem(DB_KEYS.TEST_RESULTS) || '{}');
            return allResults[studentId] || [];
        },

        async deleteResult(studentId, resultId) {
            await delay(300);
            const allResults = JSON.parse(localStorage.getItem(DB_KEYS.TEST_RESULTS) || '{}');
            if (allResults[studentId]) {
                allResults[studentId] = allResults[studentId].filter(r => r.id !== resultId);
                localStorage.setItem(DB_KEYS.TEST_RESULTS, JSON.stringify(allResults));
                return true;
            }
            return false;
        }
    },

    exams: {
        async addExam(studentId, examData) {
            await delay(300);
            const allExams = JSON.parse(localStorage.getItem(DB_KEYS.EXAMS) || '[]');
            const newExam = { id: Date.now(), studentId, ...examData };
            allExams.push(newExam);
            localStorage.setItem(DB_KEYS.EXAMS, JSON.stringify(allExams));
            return newExam;
        },

        async getStudentExams(studentId) {
            const allExams = JSON.parse(localStorage.getItem(DB_KEYS.EXAMS) || '[]');
            return allExams.filter(e => e.studentId === studentId);
        },

        async deleteExam(examId) {
            await delay(300);
            const allExams = JSON.parse(localStorage.getItem(DB_KEYS.EXAMS) || '[]');
            const newExams = allExams.filter(e => e.id !== examId);
            localStorage.setItem(DB_KEYS.EXAMS, JSON.stringify(newExams));
            return true;
        }
    }
};

export { api };
