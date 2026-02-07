export const getEstimatedDuration = (topic) => {
    const t = topic.toLowerCase();

    // --- MATHEMATICS (TYT/AYT) ---
    // Heavy (3-4 Slots)
    if (t.includes('türev')) return 4;
    if (t.includes('integral')) return 4;
    if (t.includes('limit')) return 3;
    if (t.includes('trigonometri')) return 3;
    if (t.includes('fonksiyon')) return 3;
    if (t.includes('polinom')) return 3;
    if (t.includes('olasılık')) return 3;
    if (t.includes('permütasyon')) return 3;
    if (t.includes('kombinasyon')) return 3;
    if (t.includes('problemler')) return 3;

    // Medium (2 Slots)
    if (t.includes('logaritma')) return 2;
    if (t.includes('dizi')) return 2;
    if (t.includes('parabol')) return 2;
    if (t.includes('denklem')) return 2;
    if (t.includes('eşitsizlik')) return 2;
    if (t.includes('üçgen')) return 2;
    if (t.includes('dörtgen')) return 2;
    if (t.includes('katı cisim')) return 2;
    if (t.includes('analitik')) return 2;
    if (t.includes('çarpanlara ayırma')) return 2;
    if (t.includes('köklü')) return 2;
    if (t.includes('üslü')) return 2;
    if (t.includes('mutlak değer')) return 2;

    // Light (1 Slot)
    if (t.includes('küme')) return 1;
    if (t.includes('mantık')) return 1;
    if (t.includes('vektör')) return 1;
    if (t.includes('matris')) return 1;
    if (t.includes('rasyonel')) return 1;
    if (t.includes('temel kavram')) return 1;

    // --- SCIENCE (Physics, Chemistry, Biology) ---
    // Heavy
    if (t.includes('elektrik')) return 3;
    if (t.includes('manyetizma')) return 3;
    if (t.includes('optik')) return 3;
    if (t.includes('hareket')) return 3;
    if (t.includes('iş güç enerji')) return 3;
    if (t.includes('atışlar')) return 3;
    if (t.includes('organik')) return 4;
    if (t.includes('denge')) return 3;
    if (t.includes('hız')) return 2; // Reaaksiyon hızı
    if (t.includes('elektroliz')) return 3;
    if (t.includes('bitki')) return 3; // Bitki biyolojisi
    if (t.includes('sistemler')) return 3; // İnsan fizyolojisi
    if (t.includes('solunum')) return 3;
    if (t.includes('fotosentez')) return 3;

    // Medium
    if (t.includes('gazlar')) return 2;
    if (t.includes('çözelti')) return 2;
    if (t.includes('atom')) return 2;
    if (t.includes('periyodik')) return 2;
    if (t.includes('asit')) return 2; // Asit baz
    if (t.includes('hücre')) return 2;
    if (t.includes('kalıtım')) return 2;
    if (t.includes('ekoloji')) return 2;
    if (t.includes('madde')) return 2;
    if (t.includes('basınç')) return 2;
    if (t.includes('kaldırma')) return 2;
    if (t.includes('dalga')) return 2;

    // --- TURKISH & SOCIAL ---
    if (t.includes('paragraf')) return 3; // Süreklilik ister
    if (t.includes('dil bilgisi')) return 2;
    if (t.includes('yazım')) return 2;
    if (t.includes('noktalama')) return 2;
    if (t.includes('osmanlı')) return 3;
    if (t.includes('inkılap')) return 2;
    if (t.includes('devrim')) return 2;
    if (t.includes('coğrafi konum')) return 2;
    if (t.includes('iklim')) return 2;
    if (t.includes('nüfus')) return 2;

    // Default
    return 1;
};
