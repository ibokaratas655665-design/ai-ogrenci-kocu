/**
 * §24 KONU KİMLİĞİ testleri.
 *
 * Konular eskiden yalnızca ADIYLA saklanıyordu; aynı adı taşıyan farklı
 * sınav konuları tek ilerleme satırına biniyordu. Buradaki testler hem
 * ayrışmayı hem de ESKİ KAYITLARIN KAYBOLMADIĞINI kanıtlar.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { konuKimligi, kimlikCoz, tumKonular } from '../data/examTopics';
import { elleIsaretle, elleIsaretliMi, anahtar, isaretBul } from './topicProgressService';

const OGR = 'test_kimlik_ogr';

describe('konu kimliği', () => {
    beforeEach(() => localStorage.clear());

    it('sınav bağlamını taşır ve Türkçe karakterleri katlar', () => {
        expect(konuKimligi('YKS', 'TYT', 'matematik', 'Üslü Sayılar'))
            .toBe('yks:tyt:matematik:uslu-sayilar');
        expect(konuKimligi('LGS', 'SAYISAL', 'matematik', 'Üslü İfadeler'))
            .toBe('lgs:sayisal:matematik:uslu-ifadeler');
    });

    it('aynı adlı konu farklı sınavlarda farklı kimlik alır', () => {
        const a = konuKimligi('YKS', 'TYT', 'matematik', 'Çarpanlara Ayırma');
        const b = konuKimligi('LGS', 'SAYISAL', 'matematik', 'Çarpanlara Ayırma');
        expect(a).not.toBe(b);
    });

    it('aynı ad aynı bağlamda HER ZAMAN aynı kimliği verir (kararlı)', () => {
        const a = konuKimligi('YKS', 'AYT_SAY', 'fizik', 'Düzgün Çembersel Hareket');
        const b = konuKimligi('yks', 'ayt_say', 'fizik', 'düzgün çembersel hareket');
        expect(a).toBe(b);
    });

    it('kimlik dört parçaya çözülür', () => {
        expect(kimlikCoz('yks:tyt:matematik:turev'))
            .toEqual({ sinav: 'yks', bolum: 'tyt', ders: 'matematik', konu: 'turev' });
        expect(kimlikCoz('bozuk-kimlik')).toBeNull();
    });

    it('boş konu adı kimlik üretmez', () => {
        expect(konuKimligi('YKS', 'TYT', 'matematik', '   ')).toBeNull();
    });

    it('katalogdaki her konu benzersiz bir kimlik alır', () => {
        for (const sinav of ['YKS', 'LGS', 'KPSS', 'AGS']) {
            const liste = tumKonular(sinav);
            expect(liste.length).toBeGreaterThan(0);
            const kimlikler = liste.map((t) => t.topicId);
            expect(kimlikler.every(Boolean)).toBe(true);
            expect(new Set(kimlikler).size).toBe(kimlikler.length);
        }
    });
});

describe('kimlikli işaretleme', () => {
    beforeEach(() => localStorage.clear());

    it('kimlikle işaretlenen konu yalnızca kendi bağlamında bitmiş sayılır', () => {
        const tyt = { topicId: konuKimligi('YKS', 'TYT', 'matematik', 'Fonksiyonlar') };
        const ayt = { topicId: konuKimligi('YKS', 'AYT_SAY', 'matematik', 'Fonksiyonlar') };

        elleIsaretle(OGR, 'Fonksiyonlar', true, 'ogrenci', tyt);

        expect(elleIsaretliMi(OGR, 'Fonksiyonlar', tyt)).toBe(true);
        expect(elleIsaretliMi(OGR, 'Fonksiyonlar', ayt)).toBe(false);
    });

    it('ESKİ isim kaydı kaybolmaz — kimlik yokken okunmaya devam eder', () => {
        // Kimlik sisteminden ÖNCE yazılmış bir kayıt taklit edilir
        localStorage.setItem('topic_progress', JSON.stringify({
            [OGR]: { [anahtar('Türev')]: { tamam: true, konu: 'Türev', kaynak: 'ogrenci' } },
        }));

        const baglam = { topicId: konuKimligi('YKS', 'AYT_SAY', 'matematik', 'Türev') };
        // Kimlik kaydı yok ama eski isim kaydı var → hâlâ bitmiş görünür
        expect(elleIsaretliMi(OGR, 'Türev', baglam)).toBe(true);
    });

    it('işaret kaldırılınca hem kimlik hem eski isim kaydı temizlenir', () => {
        const baglam = { topicId: konuKimligi('YKS', 'TYT', 'turkce', 'Paragrafta Anlam') };
        localStorage.setItem('topic_progress', JSON.stringify({
            [OGR]: {
                [anahtar('Paragrafta Anlam')]: { tamam: true, konu: 'Paragrafta Anlam' },
                [baglam.topicId]: { tamam: true, konu: 'Paragrafta Anlam' },
            },
        }));

        elleIsaretle(OGR, 'Paragrafta Anlam', false, 'ogrenci', baglam);
        expect(elleIsaretliMi(OGR, 'Paragrafta Anlam', baglam)).toBe(false);
    });

    it('bağlamsız eski çağrı isim anahtarını kullanmayı sürdürür', () => {
        elleIsaretle(OGR, 'Limit', true);
        expect(elleIsaretliMi(OGR, 'Limit')).toBe(true);
    });

    it('isaretBul önce kimliğe, sonra isme bakar', () => {
        const depo = { 'yks:tyt:matematik:turev': { tamam: true }, turev: { tamam: false } };
        expect(isaretBul(depo, 'yks:tyt:matematik:turev', 'turev').tamam).toBe(true);
        expect(isaretBul(depo, 'lgs:sayisal:matematik:turev', 'turev').tamam).toBe(false);
    });
});
