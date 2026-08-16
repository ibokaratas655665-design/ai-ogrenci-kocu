import React, { useMemo } from 'react';
import { Share2 } from 'lucide-react';
import SociometryNetworkMap from '../coach/SociometryNetworkMap';

/**
 * 🔗 SOSYOMETRİ HARİTASI
 *
 * Sınıf dosyasının (7) bir parçası. Sosyometri envanteri "Envanter
 * Uygulama" alt sekmesinden atanır; öğrenciler doldurdukça ilişki
 * haritası burada oluşur — aynı veri, iki görünüm.
 */
const SosyometriPaneli = ({ students = [] }) => {
    const sonuclar = useMemo(() => {
        const out = [];
        for (const s of students) {
            const raw = localStorage.getItem(`test_result_sociometry_${s.id}`);
            if (!raw) continue;
            try {
                const parsed = JSON.parse(raw);
                out.push({ name: s.name, choices: parsed.choices || [] });
            } catch { /* bozuk kayıt atlanır */ }
        }
        return out;
    }, [students]);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <span className="sec-icon" style={{ '--acc': 'var(--accent)' }}>
                    <Share2 size={15} />
                </span>
                <h3 className="h3">Sosyometri Haritası</h3>
                {sonuclar.length > 0 && (
                    <span className="badge badge-ok">{sonuclar.length} yanıt</span>
                )}
            </div>

            {sonuclar.length === 0 ? (
                <div className="srf p-8 text-center">
                    <Share2 size={28} className="text-ink-3 mx-auto mb-2" />
                    <p className="text-xs font-bold text-ink-3">Henüz sosyometri yanıtı yok</p>
                    <p className="text-[11px] text-ink-3 mt-1 max-w-sm mx-auto leading-snug">
                        “Envanter Uygulama” alt sekmesinden sınıfa Sosyometri envanterini atayın;
                        öğrenciler doldurdukça ilişki haritası burada oluşur.
                    </p>
                </div>
            ) : (
                <SociometryNetworkMap results={sonuclar} />
            )}
        </div>
    );
};

export default SosyometriPaneli;
