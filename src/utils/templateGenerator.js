import * as XLSX from 'xlsx';

export const EXAM_TEMPLATES = {
    TYT: [
        "Sıralama", "Öğrenci No", "Ad Soyad", "Sınıf",
        "Türkçe D", "Türkçe Y", "Türkçe Net",
        "Matematik D", "Matematik Y", "Matematik Net",
        "Geometri D", "Geometri Y", "Geometri Net",
        "Fizik D", "Fizik Y", "Fizik Net",
        "Kimya D", "Kimya Y", "Kimya Net",
        "Biyoloji D", "Biyoloji Y", "Biyoloji Net",
        "Tarih D", "Tarih Y", "Tarih Net",
        "Coğrafya D", "Coğrafya Y", "Coğrafya Net",
        "Felsefe D", "Felsefe Y", "Felsefe Net",
        "Din D", "Din Y", "Din Net",
        "Puan"
    ],
    AYT: [
        "Sıralama", "Öğrenci No", "Ad Soyad", "Sınıf",
        "Edebiyat D", "Edebiyat Y", "Edebiyat Net",
        "Tarih-1 D", "Tarih-1 Y", "Tarih-1 Net",
        "Coğrafya-1 D", "Coğrafya-1 Y", "Coğrafya-1 Net",
        "Tarih-2 D", "Tarih-2 Y", "Tarih-2 Net",
        "Coğrafya-2 D", "Coğrafya-2 Y", "Coğrafya-2 Net",
        "Felsefe D", "Felsefe Y", "Felsefe Net",
        "Din D", "Din Y", "Din Net",
        "Matematik D", "Matematik Y", "Matematik Net",
        "Fizik D", "Fizik Y", "Fizik Net",
        "Kimya D", "Kimya Y", "Kimya Net",
        "Biyoloji D", "Biyoloji Y", "Biyoloji Net",
        "Puan"
    ],
    LGS: [
        "Sıralama", "Öğrenci No", "Ad Soyad", "Sınıf",
        "Türkçe D", "Türkçe Y", "Türkçe Net",
        "Matematik D", "Matematik Y", "Matematik Net",
        "Fen D", "Fen Y", "Fen Net",
        "İnkılap D", "İnkılap Y", "İnkılap Net",
        "Din D", "Din Y", "Din Net",
        "İngilizce D", "İngilizce Y", "İngilizce Net",
        "Puan"
    ],
    YDT: [
        "Sıralama", "Öğrenci No", "Ad Soyad", "Sınıf",
        "Dil D", "Dil Y", "Dil Net",
        "Puan"
    ]
};

export const downloadTemplate = (examType) => {
    const headers = EXAM_TEMPLATES[examType] || EXAM_TEMPLATES.TYT;

    // Create a dummy row for example
    const exampleRow = headers.map((h, i) => {
        if (h.includes("Ad")) return "Örnek Öğrenci";
        if (h.includes("No")) return "12345";
        if (h.includes("Sınıf")) return "12/A";
        if (h.includes("Sıralama")) return "1";
        if (h.includes("Puan")) return "350.00";
        return 0; // Default score
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);

    // Adjust column widths
    const wscols = headers.map(h => ({ wch: h.length + 5 }));
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${examType} Şablonu`);

    XLSX.writeFile(wb, `AiKoc_${examType}_Sablonu.xlsx`);
};
