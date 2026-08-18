import { describe, it, expect, beforeEach } from 'vitest';
import {
    isAnaKoc, sahipKoc, gorebilir, filtrele, onayDurumu, sahiplikEkle,
} from './accessControl';

/**
 * Erişim katmanı testleri.
 *
 * ⚠️ BU KATMAN GÜVENLİK SINIRI DEĞİLDİR — yalnızca arayüz görünürlüğünü
 * belirler. Gerçek yaptırım Firestore kurallarındadır
 * (bkz. dogrulama-izolasyon.mjs). Buradaki testler, arayüzün yanlış
 * kaydı GÖSTERMEMESİNİ garanti eder.
 */

const KOC_A = { id: 'coach_a', role: 'coach', coachRole: 'subCoach' };
const KOC_B = { id: 'coach_b', role: 'coach', coachRole: 'subCoach' };
const ANA_KOC = { id: 'coach_ana', role: 'coach', coachRole: 'masterCoach' };

const ogrenci = (sahip) => ({ id: 1, name: 'Test', ownerCoachId: sahip });

beforeEach(() => localStorage.clear());

describe('ana koç tespiti', () => {
    it('masterCoach ana koçtur', () => expect(isAnaKoc(ANA_KOC)).toBe(true));
    it('subCoach ana koç DEĞİLDİR', () => expect(isAnaKoc(KOC_A)).toBe(false));
    it('admin rolü ana koç sayılır', () => expect(isAnaKoc({ role: 'admin' })).toBe(true));
    it('boş kullanıcı ana koç değildir', () => expect(isAnaKoc(null)).toBe(false));
});

describe('sahiplik çözümleme', () => {
    it('ownerCoachId önceliklidir', () => {
        expect(sahipKoc({ ownerCoachId: 'a', coachId: 'b' })).toBe('a');
    });
    it('ownerCoachId yoksa coachId kullanılır', () => {
        expect(sahipKoc({ coachId: 'b' })).toBe('b');
    });
    it('hiçbiri yoksa null döner', () => {
        expect(sahipKoc({ name: 'x' })).toBeNull();
    });
});

describe('KOÇ İZOLASYONU — arayüz katmanı', () => {
    it('Koç A kendi öğrencisini görür', () => {
        expect(gorebilir(KOC_A, ogrenci('coach_a'))).toBe(true);
    });

    it('Koç A, Koç Bnin öğrencisini GÖREMEZ', () => {
        expect(gorebilir(KOC_A, ogrenci('coach_b'))).toBe(false);
    });

    it('Koç B, Koç Anın öğrencisini GÖREMEZ', () => {
        expect(gorebilir(KOC_B, ogrenci('coach_a'))).toBe(false);
    });

    it('ana koç her ikisini de görür', () => {
        expect(gorebilir(ANA_KOC, ogrenci('coach_a'))).toBe(true);
        expect(gorebilir(ANA_KOC, ogrenci('coach_b'))).toBe(true);
    });

    it('sahipsiz kayıt alt koça görünmez', () => {
        // Eski Excel yüklemelerinde sahip damgası yok; kurumsal sayılır
        expect(gorebilir(KOC_A, { id: 9, name: 'Eski' })).toBe(false);
    });

    it('liste süzgeci yalnızca kendi kayıtlarını bırakır', () => {
        const liste = [ogrenci('coach_a'), { id: 2, ownerCoachId: 'coach_b' }];
        expect(filtrele(KOC_A, liste)).toHaveLength(1);
        expect(filtrele(ANA_KOC, liste)).toHaveLength(2);
    });
});

describe('onay durumu', () => {
    it('alan yoksa onaylı sayılır (geriye uyum)', () => {
        expect(onayDurumu({ id: 1 })).toBe('onayli');
    });
    it('approved:false bekliyor demektir', () => {
        expect(onayDurumu({ approved: false })).toBe('bekliyor');
    });
    it('reddedildi, approved:false ile birlikte bile REDDEDİLDİ kalır', () => {
        // Bu ayrım kaçırılınca panelde hayalet "1 onay bekliyor" çıkıyordu
        expect(onayDurumu({ approved: false, approvalStatus: 'reddedildi' })).toBe('reddedildi');
    });
});

describe('sahiplik damgası', () => {
    it('yeni kayda sahip ve tarih ekler', () => {
        const k = sahiplikEkle(KOC_A, { id: 5, name: 'Yeni' });
        expect(k.ownerCoachId).toBe('coach_a');
        expect(k.createdAt).toBeTruthy();
    });
    it('mevcut sahibi EZMEZ', () => {
        const k = sahiplikEkle(KOC_A, { id: 5, ownerCoachId: 'coach_b' });
        expect(k.ownerCoachId).toBe('coach_b');
    });
});
