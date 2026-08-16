/**
 * 🧠 REHBERLİK MERKEZİ
 *
 * Rehberlik servisi, testler/envanterler, sosyometri, PDR iş akışı ve BEP
 * tek üst sekme altında toplandı. Bunlar zaten aynı işin parçaları:
 * öğrenciyi tanıma → değerlendirme → müdahale planı.
 *
 * Çakışma notu: sosyometri hem "Testler" içinde bir envanter olarak hem de
 * ayrı bir üst sekme olarak duruyordu. Artık uygulama Testler'de, sonuç
 * haritası Sosyometri bölümünde — aynı veriyi kullanıyorlar.
 */
import React, { useMemo } from 'react';
import { Brain, ClipboardList, Share2, Briefcase, FileText } from 'lucide-react';
import SectionTabs from '../shared/SectionTabs';
import BEPCenter from '../guidance/bep/BEPCenter';

const GuidanceCenter = (props) => {
    const { students, setToast, onAssignTask } = props;
    const {
        GuidanceServiceTab,
        TestsTab,
        SociometryNetworkMap,
        WorkflowTab,
        BEPGenerator,
        AICoachButton,
    } = props;

    // Sosyometri sonuçları — testlerden gelen ham veriyi haritaya çevir
    const sociometryResults = useMemo(() => {
        const out = [];
        for (const s of students || []) {
            const raw = localStorage.getItem(`test_result_sociometry_${s.id}`);
            if (!raw) continue;
            try {
                const parsed = JSON.parse(raw);
                out.push({ name: s.name, choices: parsed.choices || [] });
            } catch { /* bozuk kayıt atlanır */ }
        }
        return out;
    }, [students]);

    const pendingTests = useMemo(() => {
        try {
            const assigned = JSON.parse(localStorage.getItem('assigned_tests') || '[]');
            return assigned.filter((t) => t.status === 'pending').length;
        } catch {
            return 0;
        }
    }, []);

    const sections = [
        {
            id: 'service',
            icon: Brain,
            label: 'Rehberlik Servisi',
            title: 'Rehberlik Servisi',
            description: 'Görüşme kayıtları, veli görüşmeleri ve rehberlik planı',
        },
        {
            id: 'tests',
            icon: ClipboardList,
            label: 'Test & Envanter',
            badge: pendingTests,
            title: 'Testler ve Envanterler',
            description: 'Envanter atama, uygulama takibi, sonuç değerlendirme ve sosyometri haritası',
        },
        {
            id: 'pdr',
            icon: Briefcase,
            label: 'PDR İş Akışı',
            title: 'PDR İş Akışı',
            description: 'Vaka takibi, yönlendirme ve müdahale süreçleri',
        },
        {
            id: 'bep',
            icon: FileText,
            label: 'BEP',
            title: 'Bireyselleştirilmiş Eğitim Programı',
            description: 'Özel eğitim öğrencileri için BEP hazırlama süreci ve belgeleri',
        },
    ];

    return (
        <SectionTabs id="guidance" sections={sections} accent="var(--accent)">
            {(active) => (
                <>
                    {active === 'service' && <GuidanceServiceTab students={students} />}

                    {active === 'tests' && (
                        <div className="space-y-6">
                            <TestsTab students={students} setToast={setToast} onAssignTask={onAssignTask} />

                            {/* Sosyometri, ayrı bir sekme değil — bir envanterin sonuç
                                görünümü. Uygulaması yukarıdaki test listesinden atanır. */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Share2 size={16} className="text-accent" />
                                    <h3 className="text-sm font-black text-ink syne uppercase tracking-tight">
                                        Sosyometri Haritası
                                    </h3>
                                    <div className="h-px flex-1 bg-surface/10" />
                                    {sociometryResults.length > 0 && (
                                        <span className="text-[10px] font-black text-accent bg-accent/10 px-2 py-1 rounded-lg">
                                            {sociometryResults.length} yanıt
                                        </span>
                                    )}
                                </div>

                                {sociometryResults.length === 0 ? (
                                    <div className="premium-card p-8 text-center">
                                        <Share2 size={28} className="text-ink-3 mx-auto mb-2" />
                                        <p className="text-ink-3 text-xs font-bold">Henüz sosyometri yanıtı yok</p>
                                        <p className="text-ink-3 text-[11px] mt-1 max-w-sm mx-auto leading-relaxed">
                                            Yukarıdaki listeden sınıfa "Sosyometri" envanterini atayın;
                                            öğrenciler doldurdukça ilişki haritası burada oluşur.
                                        </p>
                                    </div>
                                ) : (
                                    <SociometryNetworkMap results={sociometryResults} />
                                )}
                            </div>
                        </div>
                    )}

                    {active === 'pdr' && <WorkflowTab students={students} setToast={setToast} />}

                    {active === 'bep' && <BEPCenter students={students} setToast={setToast} />}
                </>
            )}
        </SectionTabs>
    );
};

export default GuidanceCenter;
