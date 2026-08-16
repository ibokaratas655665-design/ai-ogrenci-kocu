export const UNIVERSITY_TARGETS = [
    {
        id: 'tip',
        name: 'Tıp Fakültesi (Devlet)',
        type: 'SAY',
        minNet: {
            tyt: { turkce: 30, mat: 30, fen: 15, sosyal: 10 },
            ayt: { mat: 35, fiz: 10, kim: 10, biy: 10 }
        },
        totalTyt: 85,
        totalAyt: 65
    },
    {
        id: 'dis',
        name: 'Diş Hekimliği',
        type: 'SAY',
        minNet: {
            tyt: { turkce: 28, mat: 25, fen: 12, sosyal: 10 },
            ayt: { mat: 30, fiz: 8, kim: 8, biy: 8 }
        },
        totalTyt: 75,
        totalAyt: 54
    },
    {
        id: 'mühendislik_pc',
        name: 'Bilgisayar Mühendisliği (İyi Üniversiteler)',
        type: 'SAY',
        minNet: {
            tyt: { turkce: 30, mat: 35, fen: 15, sosyal: 10 },
            ayt: { mat: 38, fiz: 12, kim: 10, biy: 5 }
        },
        totalTyt: 90,
        totalAyt: 65
    },
    {
        id: 'hukuk',
        name: 'Hukuk Fakültesi',
        type: 'EA',
        minNet: {
            tyt: { turkce: 32, mat: 20, fen: 5, sosyal: 15 },
            ayt: { mat: 25, edb: 20, tar1: 8, cog1: 5 }
        },
        totalTyt: 72,
        totalAyt: 58
    },
    {
        id: 'psikoloji',
        name: 'Psikoloji',
        type: 'EA',
        minNet: {
            tyt: { turkce: 30, mat: 15, fen: 2, sosyal: 15 },
            ayt: { mat: 20, edb: 18, tar1: 6, cog1: 4 }
        },
        totalTyt: 62,
        totalAyt: 48
    },
    {
        id: 'yönetim_bilişim',
        name: 'Yönetim Bilişim Sistemleri',
        type: 'EA',
        minNet: {
            tyt: { turkce: 25, mat: 15, fen: 2, sosyal: 12 },
            ayt: { mat: 15, edb: 15, tar1: 5, cog1: 4 }
        },
        totalTyt: 55,
        totalAyt: 40
    }
];
