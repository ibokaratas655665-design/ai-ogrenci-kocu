/**
 * 📊 SOSYOMETRİ ANALİZ MOTORU
 * Sınıf içi ilişkileri matematiksel olarak modeller ve rolleri belirler.
 */

export const analyzeSociometry = (submissions, studentsInClass = []) => {
    if (!submissions || submissions.length === 0) return null;

    // 1. Tüm öğrencileri belirle (Testi çözenler + sınıf listesi)
    const allNamesSet = new Set(studentsInClass.map(s => s.name));
    submissions.forEach(sub => {
        if (sub.studentInfo?.name) allNamesSet.add(sub.studentInfo.name);
        // Gönderen öğrencinin adı bazen studentName içinde olabilir
        if (sub.studentName && !sub.studentName.includes('Açık Link')) allNamesSet.add(sub.studentName);
    });

    // Temiz isim listesi
    const names = Array.from(allNamesSet).sort();
    const matrix = {};

    // 2. Matrisi ve Puanları Sıfırla
    names.forEach(n => {
        matrix[n] = {
            received: [], // Kimler onu seçti
            given: [],    // Kendisi kimleri seçti
            score: 0,     // Toplam ağırlıklı puan
            totalChoices: 0, // Kaç kişi tarafından seçildi
            stars: false,
            isolates: false,
            mutuals: []
        };
    });

    // 3. Verileri İşle (Puanlama: 1. tercih=3, 2. tercih=2, 3. tercih=1)
    submissions.forEach(sub => {
        const giver = sub.studentInfo?.name || sub.studentName?.split(' (')[0];
        if (!matrix[giver]) return;

        const data = sub.rawData || sub.answers || {};

        // Her soru için seçimleri topla
        Object.values(data).forEach(choices => {
            if (Array.isArray(choices)) {
                choices.forEach((receiver, index) => {
                    if (matrix[receiver] && matrix[giver]) {
                        const points = 3 - index; // 3, 2, 1
                        matrix[receiver].score += Math.max(0, points);
                        matrix[receiver].totalChoices += 1;
                        matrix[receiver].received.push(giver);
                        matrix[giver].given.push(receiver);
                    }
                });
            }
        });
    });

    // 4. Karşılıklı Seçimleri (Mutuals) Bul
    names.forEach(n1 => {
        matrix[n1].given.forEach(n2 => {
            if (matrix[n2] && matrix[n2].given.includes(n1)) {
                if (!matrix[n1].mutuals.includes(n2)) matrix[n1].mutuals.push(n2);
            }
        });
    });

    // 5. Rolleri Sosyometrik Kriterlere Göre Belirle
    const avgChoices = submissions.length > 0 ? names.reduce((acc, n) => acc + matrix[n].totalChoices, 0) / names.length : 0;

    names.forEach(n => {
        const student = matrix[n];
        // Yıldız: Ortalama seçim sayısının 2 katından fazlası veya ağırlıklı puanı çok yüksekse
        if (student.totalChoices > avgChoices * 1.8 && student.totalChoices > 2) {
            student.stars = true;
        }
        // Yalnız (İzole): Kimse tarafından seçilmemişse
        if (student.totalChoices === 0) {
            student.isolates = true;
        }
    });

    // 6. Özet İstatistikler
    const stars = names.filter(n => matrix[n].stars);
    const isolates = names.filter(n => matrix[n].isolates);

    // Gruplaşmaları Bul (Basit 3'lü döngüler)
    const cliques = [];
    for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
            for (let k = j + 1; k < names.length; k++) {
                const n1 = names[i], n2 = names[j], n3 = names[k];
                if (matrix[n1].mutuals.includes(n2) && matrix[n2].mutuals.includes(n3) && matrix[n3].mutuals.includes(n1)) {
                    cliques.push([n1, n2, n3]);
                }
            }
        }
    }

    return {
        matrix,
        names,
        stats: {
            totalStudents: names.length,
            submittedCount: submissions.length,
            stars,
            isolates,
            cliques,
            cohesionIndex: (names.reduce((acc, n) => acc + matrix[n].mutuals.length, 0) / (names.length || 1)).toFixed(2)
        }
    };
};
