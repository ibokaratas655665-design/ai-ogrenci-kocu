import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Target, Brain, TrendingUp, Users } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 font-sans">
            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-indigo-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                                <Brain size={24} />
                            </div>
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 text-sm md:text-2xl">
                                EĞİTİM KOÇU İBRAHİM KARATAŞ
                            </span>
                        </div>
                        <div className="hidden md:flex space-x-8">
                            <a href="#features" className="text-gray-600 hover:text-indigo-600 font-medium transition">Özellikler</a>
                            <a href="#how-it-works" className="text-gray-600 hover:text-indigo-600 font-medium transition">Nasıl Çalışır?</a>
                            <a href="#pricing" className="text-gray-600 hover:text-indigo-600 font-medium transition">Paketler</a>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button onClick={() => navigate('/login')} className="text-gray-600 font-semibold hover:text-indigo-600 transition">
                                Giriş Yap
                            </button>
                            <button onClick={() => navigate('/register')} className="btn-primary text-sm px-5 py-2">
                                Ücretsiz Dene
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
                <div className="animate-fade-in-up">
                    <span className="inline-block py-1 px-3 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold mb-6">
                        🚀 YKS ve LGS Hazırlığında Yeni Dönem
                    </span>
                    <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8 leading-tight">
                        Yapay Zeka Destekli <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            Koç İbrahim Karataş
                        </span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-xl text-gray-600 mb-10 leading-relaxed">
                        Sana özel ders çalışma programı hazırlayan, deneme analizlerini yapan ve rehberlik testleriyle seni tanıyan akıllı asistanınla tanış.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
                        <button
                            onClick={() => navigate('/register')}
                            className="btn-primary flex items-center justify-center space-x-2 shadow-xl shadow-indigo-300/40"
                        >
                            <span>Hemen Başla</span>
                            <ArrowRight size={20} />
                        </button>
                        <button className="btn-secondary flex items-center justify-center space-x-2">
                            <span>Örnek Programı İncele</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Preview */}
            <section id="features" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Senin İçin Neler Yapabilir?</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">Sıradan koçluk sistemlerinden farklı olarak, İbrahim Karataş Eğitim Koçluğu seni 7/24 analiz eder ve ihtiyaçlarına anında cevap verir.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="p-8 bg-indigo-50 rounded-3xl hover:shadow-xl transition duration-300 border border-indigo-100 group">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 mb-6 shadow-md group-hover:scale-110 transition">
                                <Target size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Akıllı Program Oluşturucu</h3>
                            <p className="text-gray-600">Hedefine ve seviyene uygun, haftalık güncellenen dinamik ders çalışma programı.</p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-8 bg-purple-50 rounded-3xl hover:shadow-xl transition duration-300 border border-purple-100 group">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-purple-600 mb-6 shadow-md group-hover:scale-110 transition">
                                <TrendingUp size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Gelişmiş Deneme Analizi</h3>
                            <p className="text-gray-600">Deneme sonuçlarını yükle, eksik konularını nokta atışı tespit edelim ve netlerini artıralım.</p>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-8 bg-pink-50 rounded-3xl hover:shadow-xl transition duration-300 border border-pink-100 group">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-pink-600 mb-6 shadow-md group-hover:scale-110 transition">
                                <Users size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Dijital Rehberlik</h3>
                            <p className="text-gray-600">Sınav kaygısı, meslek seçimi ve dikkat testleriyle psikolojik süreçlerini yönet.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats / Social Proof */}
            <section className="py-20 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-extrabold text-indigo-600 mb-2">10 Bin+</div>
                            <div className="text-gray-500 font-medium">Oluşturulan Program</div>
                        </div>
                        <div>
                            <div className="text-4xl font-extrabold text-indigo-600 mb-2">%95</div>
                            <div className="text-gray-500 font-medium">Kullanıcı Memnuniyeti</div>
                        </div>
                        <div>
                            <div className="text-4xl font-extrabold text-indigo-600 mb-2">50+</div>
                            <div className="text-gray-500 font-medium">Rehberlik Envanteri</div>
                        </div>
                        <div>
                            <div className="text-4xl font-extrabold text-indigo-600 mb-2">7/24</div>
                            <div className="text-gray-500 font-medium">Yapay Zeka Desteği</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="max-w-5xl mx-auto bg-[#1e1b4b] rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 relative z-10">Hayallerindeki Üniversiteye <br /> Bir Adım Uzaktasın</h2>
                    <p className="text-indigo-200 text-lg mb-10 max-w-2xl mx-auto relative z-10">Sınav maratonunda kaybolma. İbrahim Karataş ile rotanı çiz, hedefine en kısa yoldan ulaş.</p>
                    <button
                        onClick={() => navigate('/register')}
                        className="btn-accent text-xl px-12 py-4 shadow-xl shadow-orange-500/30"
                    >
                        Ücretsiz Kayıt Ol
                    </button>
                    <p className="mt-6 text-indigo-300 text-sm relative z-10 opacity-70">Kredi kartı gerekmez • 7 gün ücretsiz deneme</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-50 py-12 border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <Brain size={24} className="text-indigo-600" />
                        <span className="text-xl font-bold text-gray-900">EĞİTİM KOÇU İBRAHİM KARATAŞ</span>
                    </div>
                    <p className="text-gray-500 text-sm">© 2024 İbrahim Karataş. Tüm hakları saklıdır.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
