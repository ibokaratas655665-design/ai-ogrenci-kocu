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
    LayoutGrid, Bell, Trophy, Target,
} from 'lucide-react';
import SectionTabs from '../shared/SectionTabs';
import { buildRosterStatus } from '../../services/reportService';

const AnalysisCenter = (props) => {
    const { students, setToast, renderOverview } = props;

    // Bölümlerin içine giren bileşenler dışarıdan verilir; böylece
    // CoachDashboard'daki mevcut prop akışı bozulmuyor.
    /* 06.09 SADELEŞTİRME: ClassRanking, StudentProgressComparison ve
       AnalyticsTab kaldırıldı. "Sıralama & Kıyas" altında ÜÇ ayrı
       sıralama tablosu peş peşe duruyordu (üçü de Son/Ort/Maks
       Net + Trend); en bilgilendiricisi (görev yüzdesi + tablo/grafik
       anahtarlı StudentComparisonTable) kaldı. "Grafikler" alt sekmesi
       ise Genel Bakış KPI'larının ve trend grafiğinin kopyasıydı. */
    const {
        RiskAlarmPanel,
        StudentComparisonTable,
        GoalComparisonPanel,
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
                            <StudentComparisonTable students={students} />
                        </div>
                    )}

                    {active === 'goals' && (
                        <div className="space-y-6">
                            {/* StudentGoalsPanel kaldırıldı (06.09): hiçbir ekranın
                                yazmadığı `goals_<id>` (düz liste) anahtarını okuyordu —
                                her zaman "0 hedef" gösteren ölü paneldi. Gerçek hedef
                                verisi (goals_<id>_tyt) GoalComparisonPanel'de. */}
                            <GoalComparisonPanel students={students} />
                        </div>
                    )}

                </>
            )}
        </SectionTabs>
    );
};

export default AnalysisCenter;
