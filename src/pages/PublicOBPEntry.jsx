import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Award, ChevronRight, Loader2 } from 'lucide-react';
import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { bildir } from '../services/uiGeriBildirim';
import { hataAnlat } from '../services/hataMesaji';
import halkaAcik from '../services/halkaAcikGonderim';
import { nesneOku } from '../services/veriDeposu';

const PublicOBPEntry = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const coachId = query.get('c') || 'default';

    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('form');
    const [studentName, setStudentName] = useState('');
    const [schoolNumber, setSchoolNumber] = useState('');
    const [diplomaScore, setDiplomaScore] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        let score = parseFloat(diplomaScore);
        if (isNaN(score) || score < 0 || score > 100) {
            bildir("Lütfen 0 ile 100 arasında geçerli bir diploma notu giriniz.", 'uyari');
            return;
        }

        if (!studentName.trim() || !schoolNumber.trim()) {
            bildir("Lütfen Ad Soyad ve Okul Numarası giriniz.", 'uyari');
            return;
        }

        const calculatedObp = parseFloat((score * 5 * 0.12).toFixed(2));

        try {
            const key = 'v2_obp_data';
            const docId = `u_${coachId}_${key.replace(/[^a-zA-Z0-9_]/g, '_')}`;
            const docRef = doc(db, 'syncData', docId);

            // Fetch existing OBP data from Firebase instead of just localStorage
            // (since the student might be on a different device than the coach)
            let currentObpData = {};
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().value) {
                try { currentObpData = JSON.parse(docSnap.data().value); } catch { }
            } else {
                // fallback to localStorage if firebase not available or empty
                try { currentObpData = nesneOku('v2_obp_data'); } catch { }
            }

            const normName = studentName.trim().toUpperCase();
            currentObpData[normName] = {
                obp: calculatedObp,
                diploma: score,
                number: schoolNumber.trim(),
                student: normName,
                updatedAt: new Date().toISOString()
            };

            const newValue = JSON.stringify(currentObpData);

            // Write to Firebase
            await setDoc(docRef, {
                key,
                value: newValue,
                updatedAt: serverTimestamp(),
                updatedBy: coachId
            }, { merge: true });

            /**
             * ⚠️ Yukarıdaki `syncData` yazımı oturumsuz cihazda kural
             * gereği REDDEDİLİYOR (ölçüldü: permission-denied) ve hata
             * yutulduğu için öğrenci "kaydedildi" görüyordu. Gönderim
             * artık halka açık kutuya da bırakılıyor; koç kendi
             * havuzuna oradan aktarıyor.
             */
            await halkaAcik.gonder(coachId, 'obp', {
                student: normName, number: schoolNumber.trim(),
                obp: calculatedObp, diploma: score,
            });

            // Aynı cihazda koç da varsa yerel kopya işine yarar
            localStorage.setItem('v2_obp_data', newValue);
            window.dispatchEvent(new StorageEvent('storage', { key: 'v2_obp_data', newValue }));

            setStep('success');
        } catch (err) {
            bildir(hataAnlat(err), 'hata');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-soft flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md bg-surface rounded-3xl shadow-xl overflow-hidden border border-brand-line">
                <div className="on-color bg-gradient-to-r from-purple-600 to-brand p-6 text-white text-center relative overflow-hidden">
                    <Award size={48} className="mx-auto mb-3" />
                    <h1 className="text-2xl font-black relative z-10">Diploma Notu Girişi</h1>
                    <p className="text-brand mt-1 relative z-10">YKS Denemelerin İçin Ek Puan (OBP)</p>
                </div>

                {step === 'form' && (
                    <div className="p-8 text-center animate-fade-in">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-left text-sm font-bold text-ink-2 mb-1">Ad Soyad <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    value={studentName}
                                    onChange={e => setStudentName(e.target.value)}
                                    placeholder="Örn: Ali Yılmaz"
                                    className="w-full border-2 border-line rounded-xl px-4 py-3 focus:outline-none focus:border-brand font-bold"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-left text-sm font-bold text-ink-2 mb-1">Okul Numarası <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    value={schoolNumber}
                                    onChange={e => setSchoolNumber(e.target.value)}
                                    placeholder="Örn: 1453"
                                    className="w-full border-2 border-line rounded-xl px-4 py-3 focus:outline-none focus:border-brand font-bold"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-left text-sm font-bold text-ink-2 mb-1">Diploma Notu (0-100) <span className="text-danger">*</span></label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={diplomaScore}
                                    onChange={e => setDiplomaScore(e.target.value)}
                                    placeholder="Örn: 85.50"
                                    className="w-full border-2 border-line rounded-xl px-4 py-3 focus:outline-none focus:border-brand font-bold"
                                    required
                                />
                                <p className="text-xs text-ink-3 mt-2 text-left">Girdiğiniz not sistem tarafından formüle (Not × 5 × 0.12) göre OBP'ye dönüştürülecektir.</p>
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-brand disabled:opacity-50 text-white font-bold rounded-xl py-4 mt-4 hover:bg-brand-hover transition flex justify-center items-center gap-2 shadow-lg">
                                {loading ? <Loader2 className="animate-spin" /> : <>Gönder <ChevronRight size={18} /></>}
                            </button>
                        </form>
                    </div>
                )}

                {step === 'success' && (
                    <div className="p-10 text-center animate-fade-in">
                        <div className="w-24 h-24 bg-ok-soft rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-100">
                            <CheckCircle size={56} className="text-ok" />
                        </div>
                        <h2 className="text-2xl font-black text-ink mb-2">Başarılı!</h2>
                        <p className="text-ink-2 mb-6">OBP bilgin kaydedildi. Artık deneme sonuçlarına otomatik eklenecek.</p>
                        <button onClick={() => window.close()} className="w-full border-2 border-line text-ink-2 font-bold rounded-xl py-3 hover:bg-surface-2 transition">
                            Sayfayı Kapat
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicOBPEntry;
