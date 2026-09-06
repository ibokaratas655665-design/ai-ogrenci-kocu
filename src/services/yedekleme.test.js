import { describe, it, expect, beforeEach } from 'vitest';
import { yedekOlustur, yedegiCozumle, yedegiGeriYukle } from './yedekleme';

describe('yedekleme', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('uygulama verisini toplar, oturum ve damga anahtarlarını dışarıda bırakır', () => {
        localStorage.setItem('coach_students', JSON.stringify([{ id: 1, name: 'Ali' }]));
        localStorage.setItem('program_schedule_1', JSON.stringify({ 'm1-w1-Pazartesi-0': { subject: 'Mat' } }));
        localStorage.setItem('user_session', 'gizli');
        localStorage.setItem('_fbtime_coach_students', '123');

        const y = yedekOlustur();

        expect(y.veri.coach_students).toBeDefined();
        expect(y.veri.program_schedule_1).toBeDefined();
        expect(y.veri.user_session).toBeUndefined();
        expect(y.veri._fbtime_coach_students).toBeUndefined();
        expect(y.anahtarSayisi).toBe(2);
    });

    it('bozuk dosyayı reddeder', () => {
        expect(yedegiCozumle('{bu json degil').gecerli).toBe(false);
        expect(yedegiCozumle(JSON.stringify({ baska: 'sey' })).gecerli).toBe(false);
    });

    it('geçerli yedeği çözümleyip içeriğini özetler', () => {
        localStorage.setItem('coach_students', JSON.stringify([{ id: 1 }, { id: 2 }]));
        localStorage.setItem('v2_results_data', JSON.stringify([{ id: 'a' }]));
        const metin = JSON.stringify(yedekOlustur());

        const c = yedegiCozumle(metin);

        expect(c.gecerli).toBe(true);
        expect(c.ozet.ogrenci).toBe(2);
        expect(c.ozet.denemeSonucu).toBe(1);
    });

    it('geri yükleme veriyi aynen döndürür ve taze senkron damgası basar', () => {
        localStorage.setItem('coach_students', JSON.stringify([{ id: 7, name: 'Zeynep' }]));
        const yedek = yedekOlustur();
        localStorage.clear();

        const sonuc = yedegiGeriYukle(yedek);

        expect(sonuc.basarili).toBe(true);
        expect(JSON.parse(localStorage.getItem('coach_students'))[0].name).toBe('Zeynep');
        // Damga olmadan buluttaki eski kopya geri yüklenen veriyi ezebilirdi
        expect(localStorage.getItem('_fbtime_coach_students')).toBeTruthy();
    });

    it('varsayılan geri yükleme cihazdaki fazlalık kaydı temizler', () => {
        localStorage.setItem('coach_students', JSON.stringify([{ id: 1 }]));
        const yedek = yedekOlustur();
        localStorage.setItem('sonradan_eklenen', 'x');

        yedegiGeriYukle(yedek);

        expect(localStorage.getItem('sonradan_eklenen')).toBeNull();
    });

    it('birlestir seçeneğinde mevcut kayıtlar korunur', () => {
        localStorage.setItem('coach_students', JSON.stringify([{ id: 1 }]));
        const yedek = yedekOlustur();
        localStorage.setItem('sonradan_eklenen', 'x');

        yedegiGeriYukle(yedek, { birlestir: true });

        expect(localStorage.getItem('sonradan_eklenen')).toBe('x');
        expect(localStorage.getItem('coach_students')).toBeTruthy();
    });
});
