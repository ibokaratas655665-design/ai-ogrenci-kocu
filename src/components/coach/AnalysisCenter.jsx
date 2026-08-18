/**
 * 📊 ANALİZ MERKEZİ
 *
 * Eskiden üst navigasyonda 6 ayrı sekme vardı: Özet, Risk, Kıyasla,
 * Sıralama, Hedefler, Analytics. Hepsi aynı veriyi farklı kesitlerle
 * gösteriyordu ve aralarında çakışmalar vardı:
 *
 *   - Sıralama ile Kıyasla ikisi de nete göre öğrenci diziyordu
 *   - Özet, Risk ve Analytics üç ayrı "riskli öğrenci" tanımı kullanıyordu
 *   - Sınıf ortalaması üç yerde ayrı ayrı hesaplanıyordu
 *
 * Artık tek bir üst sekme altında alt bölümler halinde ve risk tanımı
 * tek yerden (reportService) geliyor.
 */
import React, { useMemo } from 'react';
import {
    LayoutGrid, Bell, ArrowUpDown, Trophy, Target, Activity,
} from 'lucide-react';
import SectionTabs from '../shared/SectionTabs';
import { buildRosterStatus } from '../../services/reportService';
import { listeOku } from '../../services/veriDeposu';

const AnalysisCenter = (props) => {
    const { students, setToast, renderOverview } = props;

    // Bölümlerin içine giren bileşenler dışarıdan verilir; böylece
    // CoachDashboard'daki mevcut prop akışı bozulmuyor.
    const {
        RiskAlarmPanel,
        StudentComparisonTable,
        StudentProgressComparison,
        ClassRanking,
        GoalComparisonPanel,
        StudentGoalsPanel,
        AnalyticsTab,
        AICoachButton,
    } = props;

    // Rozet sayıları — koç hangi bölümde iş olduğunu şeritten görsün
    const counts = useMemo(() => {
        const roster = buildRosterStatus(students || []);
        return {
            risk: roster.filter((s) => s.risk.level === 'high').length,
            lagging: roster.filter((s) => s.programRate != null && s.programRate < 60).length,
        };
    }, [students]);

    const v2 = useMemo(() => {
        const read = (k) => { try { return listeOku(k); } catch { return []; } };
        return { results: read('v2_results_data'), trials: read('v2_trials_data') };
    }, [students]);

    const sections = [
        {
            id: 'overview',
            icon: LayoutGrid,
            label: 'Genel Bakış',
            title: 'Genel Bakış',
            description: 'Öğrenci listesi, program uyumu ve haftalık çalışma göstergeleri',
        },
        {
            id: 'risk',
            icon: Bell,
            label: 'Risk',
            badge: counts.risk,
            title: 'Risk Kontrol Merkezi',
            description: 'Program uyumu, net gerilemesi ve hareketsizlik sinyallerine göre öne çıkan öğrenciler',
        },
        {
            id: 'ranking',
            icon: Trophy,
            label: 'Sıralama & Kıyas',
            title: 'Sıralama ve Karşılaştırma',
            description: 'Sınıf içi sıralama, öğrenci matrisi ve dönemsel gelişim karşılaştırması',
        },
        {
            id: 'goals',
            icon: Target,
            label: 'Hedefler',
            title: 'Hedef Takibi',
            description: 'Öğrencilerin hedef netleri ile mevcut durumlarının karşılaştırması',
        },
        {
            id: 'charts',
            icon: Activity,
            label: 'Grafikler',
            title: 'Sınıf Grafikleri',
            description: 'Ders bazlı radar, net trendi ve sınıf geneli dağılımlar',
        },
    ];

    return (
        <SectionTabs id="analysis" sections={sections} accent="var(--brand)">
            {(active) => (
                <>
                    {active === 'overview' && renderOverview?.()}

                    {active === 'risk' && (
                        <div className="space-y-5">
                            <div className="flex justify-end">
                                <AICoachButton className="text-sm shadow-2xl" />
                            </div>
                            <RiskAlarmPanel students={students} setToast={setToast} />
                        </div>
                    )}

                    {active === 'ranking' && (
                        <div className="space-y-6">
                            <ClassRanking students={students} />
                            <StudentComparisonTable students={students} />
                            <StudentProgressComparison
                                students={students}
                                trials={v2.trials}
                                results={v2.results}
                            />
                        </div>
                    )}

                    {active === 'goals' && (
                        <div className="space-y-6">
                            <GoalComparisonPanel students={students} />
                            <StudentGoalsPanel students={students} />
                        </div>
                    )}

                    {active === 'charts' && <AnalyticsTab students={students} />}
                </>
            )}
        </SectionTabs>
    );
};

export default AnalysisCenter;
