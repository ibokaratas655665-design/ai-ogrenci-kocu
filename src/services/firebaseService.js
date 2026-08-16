// 🔥 Firebase Service Layer - Tüm Firebase işlemleri buradan
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    onSnapshot,
    serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

// 🔑 AUTHENTICATION
export const firebaseAuth = {
    // Giriş yap
    async signIn(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Firebase signIn error:', error);
            return { success: false, error: error.message };
        }
    },

    // Kayıt ol
    async signUp(email, password, userData) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            // Kullanıcı bilgilerini Firestore'a kaydet
            await setDoc(doc(db, 'users', uid), {
                ...userData,
                uid,
                email,
                createdAt: serverTimestamp(),
                approved: userData.role === 'admin' ? true : false
            });

            return { success: true, user: userCredential.user, uid };
        } catch (error) {
            console.error('Firebase signUp error:', error);
            return { success: false, error: error.message };
        }
    },

    // Çıkış yap
    async signOut() {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            console.error('Firebase signOut error:', error);
            return { success: false, error: error.message };
        }
    },

    // Auth state listener
    onAuthChange(callback) {
        return onAuthStateChanged(auth, callback);
    },

    // Mevcut kullanıcı
    getCurrentUser() {
        return auth.currentUser;
    }
};

// 📊 FIRESTORE DATA OPERATIONS
export const firebaseDB = {
    // Koleksiyon oluştur/güncelle
    async setDocument(collectionName, docId, data) {
        try {
            await setDoc(doc(db, collectionName, docId), {
                ...data,
                updatedAt: serverTimestamp()
            }, { merge: true });
            return { success: true };
        } catch (error) {
            console.error('Firebase setDocument error:', error);
            return { success: false, error: error.message };
        }
    },

    // Döküman oku
    async getDocument(collectionName, docId) {
        try {
            const docRef = doc(db, collectionName, docId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
            } else {
                return { success: false, error: 'Document not found' };
            }
        } catch (error) {
            console.error('Firebase getDocument error:', error);
            return { success: false, error: error.message };
        }
    },

    // Koleksiyonun tamamını oku
    async getCollection(collectionName) {
        try {
            const querySnapshot = await getDocs(collection(db, collectionName));
            const data = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, data };
        } catch (error) {
            console.error('Firebase getCollection error:', error);
            return { success: false, error: error.message };
        }
    },

    // Sorgu ile veri çek
    async queryDocuments(collectionName, field, operator, value) {
        try {
            const q = query(collection(db, collectionName), where(field, operator, value));
            const querySnapshot = await getDocs(q);
            const data = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, data };
        } catch (error) {
            console.error('Firebase queryDocuments error:', error);
            return { success: false, error: error.message };
        }
    },

    // Döküman güncelle
    async updateDocument(collectionName, docId, data) {
        try {
            const docRef = doc(db, collectionName, docId);
            await updateDoc(docRef, {
                ...data,
                updatedAt: serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Firebase updateDocument error:', error);
            return { success: false, error: error.message };
        }
    },

    // Döküman sil
    async deleteDocument(collectionName, docId) {
        try {
            await deleteDoc(doc(db, collectionName, docId));
            return { success: true };
        } catch (error) {
            console.error('Firebase deleteDocument error:', error);
            return { success: false, error: error.message };
        }
    },

    // Real-time listener
    subscribeToCollection(collectionName, callback) {
        const unsubscribe = onSnapshot(collection(db, collectionName), (snapshot) => {
            const data = [];
            snapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });
            callback(data);
        });
        return unsubscribe;
    },

    // Real-time document listener
    subscribeToDocument(collectionName, docId, callback) {
        const unsubscribe = onSnapshot(doc(db, collectionName, docId), (doc) => {
            if (doc.exists()) {
                callback({ id: doc.id, ...doc.data() });
            } else {
                callback(null);
            }
        });
        return unsubscribe;
    }
};

// 🎓 ÖĞRENCİ İŞLEMLERİ
export const firebaseStudents = {
    async addStudent(coachId, studentData) {
        const studentId = `student_${Date.now()}`;
        return await firebaseDB.setDocument('students', studentId, {
            ...studentData,
            coachId,
            createdAt: serverTimestamp()
        });
    },

    async getStudentsByCoach(coachId) {
        return await firebaseDB.queryDocuments('students', 'coachId', '==', coachId);
    },

    async updateStudent(studentId, data) {
        return await firebaseDB.updateDocument('students', studentId, data);
    },

    async deleteStudent(studentId) {
        return await firebaseDB.deleteDocument('students', studentId);
    }
};

// 📝 GÖREV İŞLEMLERİ
export const firebaseTasks = {
    async addTask(studentId, taskData) {
        const taskId = `task_${Date.now()}`;
        return await firebaseDB.setDocument('tasks', taskId, {
            ...taskData,
            studentId,
            createdAt: serverTimestamp()
        });
    },

    async getTasksByStudent(studentId) {
        return await firebaseDB.queryDocuments('tasks', 'studentId', '==', studentId);
    },

    async updateTask(taskId, data) {
        return await firebaseDB.updateDocument('tasks', taskId, data);
    },

    async deleteTask(taskId) {
        return await firebaseDB.deleteDocument('tasks', taskId);
    }
};

// 💬 MESAJLAŞMA
export const firebaseMessages = {
    async sendMessage(studentId, messageData) {
        const messageId = `msg_${Date.now()}`;
        return await firebaseDB.setDocument('messages', messageId, {
            ...messageData,
            studentId,
            timestamp: serverTimestamp()
        });
    },

    async getMessagesByStudent(studentId) {
        return await firebaseDB.queryDocuments('messages', 'studentId', '==', studentId);
    },

    subscribeToMessages(studentId, callback) {
        const q = query(collection(db, 'messages'), where('studentId', '==', studentId));
        return onSnapshot(q, (snapshot) => {
            const messages = [];
            snapshot.forEach((doc) => {
                messages.push({ id: doc.id, ...doc.data() });
            });
            callback(messages);
        });
    }
};

// 📊 DENEME SINAVLARI
export const firebaseExams = {
    async addExam(studentId, examData) {
        const examId = `exam_${Date.now()}`;
        return await firebaseDB.setDocument('exams', examId, {
            ...examData,
            studentId,
            date: serverTimestamp()
        });
    },

    async getExamsByStudent(studentId) {
        return await firebaseDB.queryDocuments('exams', 'studentId', '==', studentId);
    },

    async deleteExam(examId) {
        return await firebaseDB.deleteDocument('exams', examId);
    }
};

// 📅 PROGRAMLAR
export const firebasePrograms = {
    async saveProgram(studentId, programData) {
        return await firebaseDB.setDocument('programs', studentId, programData);
    },

    async getProgram(studentId) {
        return await firebaseDB.getDocument('programs', studentId);
    }
};

// 📝 DENEMELER (TRIALS)
export const firebaseTrials = {
    async addTrial(coachId, trialData) {
        const trialId = `trial_${Date.now()}`;
        const data = {
            ...trialData,
            coachId,
            createdAt: new Date().toISOString()
        };
        const result = await firebaseDB.setDocument('trials', trialId, data);
        return { ...result, id: trialId };
    },

    async getTrialsByCoach(coachId) {
        return await firebaseDB.queryDocuments('trials', 'coachId', '==', coachId);
    },

    async deleteTrial(trialId) {
        // Also delete all exam results for this trial
        const examsResult = await firebaseDB.queryDocuments('examResults', 'trialId', '==', trialId);
        if (examsResult.success && examsResult.data) {
            for (const exam of examsResult.data) {
                await firebaseDB.deleteDocument('examResults', exam.id);
            }
        }
        return await firebaseDB.deleteDocument('trials', trialId);
    },

    // Add exam results to a trial
    async addExamResults(trialId, results) {
        const savedResults = [];
        for (const result of results) {
            const examId = `exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const data = {
                ...result,
                trialId,
                createdAt: new Date().toISOString()
            };
            const saveResult = await firebaseDB.setDocument('examResults', examId, data);
            if (saveResult.success) {
                savedResults.push({ id: examId, ...data });
            }
        }
        return { success: true, data: savedResults };
    },

    async getExamResultsByTrial(trialId) {
        return await firebaseDB.queryDocuments('examResults', 'trialId', '==', trialId);
    }
};

export default {
    auth: firebaseAuth,
    db: firebaseDB,
    students: firebaseStudents,
    tasks: firebaseTasks,
    messages: firebaseMessages,
    exams: firebaseExams,
    programs: firebasePrograms,
    trials: firebaseTrials
};
