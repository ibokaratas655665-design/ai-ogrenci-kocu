/**
 * 💬 MESAJ KANALI — yönlere ayrılmış koç↔öğrenci mesajlaşması
 *
 * ESKİ SORUN: iki taraf da aynı `student_messages` bloğuna yazıyordu;
 * senkron yarışında bir tarafın mesajı diğerinin yazımıyla siliniyordu.
 *
 * YENİ DÜZEN (04.09, canlı eşleme): her öğrenci için DÖRT anahtar —
 *   · `msg_c2s_<sid>`    koçun gönderdikleri (yalnız koç yazar)
 *   · `msg_s2c_<sid>`    öğrencinin gönderdikleri (yalnız öğrenci yazar)
 *   · `msg_seen_s_<sid>` öğrencinin okudukları (koç mesajlarının id'leri)
 *   · `msg_seen_c_<sid>` koçun okudukları (öğrenci mesajlarının id'leri)
 * Okuma birleşiktir ve eski `student_messages` kayıtları da (id çakışmasız)
 * sohbete katılır — geçmiş kaybolmaz.
 */

const kocKanal = (sid) => `msg_c2s_${sid}`;
const ogrenciKanal = (sid) => `msg_s2c_${sid}`;
const ogrenciGorduAnahtar = (sid) => `msg_seen_s_${sid}`;
const kocGorduAnahtar = (sid) => `msg_seen_c_${sid}`;

const guvenliOku = (anahtar, varsayilan) => {
    try {
        const ham = localStorage.getItem(anahtar);
        return ham == null ? varsayilan : JSON.parse(ham);
    } catch {
        return varsayilan;
    }
};

const yazVeYay = (anahtar, deger) => {
    try {
        localStorage.setItem(anahtar, JSON.stringify(deger));
        /* Damga (bkz. veriDeposu.damgala — döngüsel import olmasın diye
           satır burada tekrarlanır): damgasız kayıt, bulut yazımı o an
           düşerse sonraki açılışta buluttaki ESKİ kopyayla ezilir. */
        localStorage.setItem(`_fbtime_${anahtar}`, String(Date.now()));
        window.dispatchEvent(new StorageEvent('storage', { key: anahtar, newValue: JSON.stringify(deger) }));
        window.firebaseSync?.syncKey?.(anahtar);
    } catch { /* sessiz */ }
};

const listeOku = (anahtar) => {
    const liste = guvenliOku(anahtar, []);
    return Array.isArray(liste) ? liste : [];
};

const nesneOku = (anahtar) => {
    const nesne = guvenliOku(anahtar, {});
    return nesne && typeof nesne === 'object' && !Array.isArray(nesne) ? nesne : {};
};

const mesajId = () => `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/** Öğrencinin görmediği koç mesajlarının rozet id'leri. */
const ogrenciOkunmamisIdler = (sid) => {
    const s = String(sid);
    const goruldu = nesneOku(ogrenciGorduAnahtar(s));
    return listeOku(kocKanal(s))
        .filter((m) => !goruldu[String(m.id)])
        .map((m) => `msj:${m.id}`);
};

/** Mesaj kanalı olan tüm öğrenci kimlikleri. */
const tumSidler = () => {
    const sidler = new Set();
    try {
        for (let i = 0; i < localStorage.length; i += 1) {
            const anahtar = localStorage.key(i);
            if (anahtar && (anahtar.startsWith('msg_s2c_') || anahtar.startsWith('msg_c2s_'))) {
                sidler.add(anahtar.slice(8));
            }
        }
    } catch { /* erişim yoksa boş */ }
    return [...sidler];
};

/** Eski student_messages bloğundan bu öğrencinin kayıtları. */
const eskiKayitlar = (sid) => {
    const blob = guvenliOku('student_messages', {});
    if (!blob || typeof blob !== 'object' || Array.isArray(blob)) return [];
    const liste = blob[String(sid)];
    return Array.isArray(liste) ? liste : [];
};

const mesajKanali = {
    kocMesajEkle: (sid, { text, senderName }) => {
        const s = String(sid);
        const mesaj = {
            id: mesajId(), sender: 'coach', text,
            senderName: senderName || 'Koç',
            timestamp: new Date().toISOString(),
        };
        yazVeYay(kocKanal(s), [...listeOku(kocKanal(s)), mesaj]);
        return mesaj;
    },

    ogrenciMesajEkle: (sid, { text, senderName }) => {
        const s = String(sid);
        const mesaj = {
            id: mesajId(), sender: 'student', text,
            senderName: senderName || 'Öğrenci',
            timestamp: new Date().toISOString(),
        };
        yazVeYay(ogrenciKanal(s), [...listeOku(ogrenciKanal(s)), mesaj]);
        return mesaj;
    },

    /** Koç, öğrencinin tüm mesajlarını okudu olarak işaretler. */
    kocOkudu: (sid) => {
        const s = String(sid);
        const idler = listeOku(ogrenciKanal(s)).map((m) => String(m.id));
        if (idler.length === 0) return false;
        const goruldu = nesneOku(kocGorduAnahtar(s));
        let degisti = false;
        idler.forEach((id) => {
            if (!goruldu[id]) { goruldu[id] = true; degisti = true; }
        });
        if (degisti) yazVeYay(kocGorduAnahtar(s), goruldu);
        return degisti;
    },

    /** Öğrenci, koçun tüm mesajlarını okudu olarak işaretler. */
    ogrenciOkudu: (sid) => {
        const s = String(sid);
        const idler = listeOku(kocKanal(s)).map((m) => String(m.id));
        if (idler.length === 0) return false;
        const goruldu = nesneOku(ogrenciGorduAnahtar(s));
        let degisti = false;
        idler.forEach((id) => {
            if (!goruldu[id]) { goruldu[id] = true; degisti = true; }
        });
        if (degisti) yazVeYay(ogrenciGorduAnahtar(s), goruldu);
        return degisti;
    },

    /** İki yön + eski kayıtlar, zaman sıralı tek sohbet. */
    konusmaOku: (sid) => {
        const s = String(sid);
        const ogrenciGordu = nesneOku(ogrenciGorduAnahtar(s));
        const kocGordu = nesneOku(kocGorduAnahtar(s));
        const kocMesajlari = listeOku(kocKanal(s))
            .map((m) => ({ ...m, sender: 'coach', read: !!ogrenciGordu[String(m.id)] }));
        const ogrenciMesajlari = listeOku(ogrenciKanal(s))
            .map((m) => ({ ...m, sender: 'student', read: !!kocGordu[String(m.id)] }));
        const bilinen = new Set([...kocMesajlari, ...ogrenciMesajlari].map((m) => String(m.id)));
        const eski = eskiKayitlar(s).filter((m) => m && m.id != null && !bilinen.has(String(m.id)));
        return [...kocMesajlari, ...ogrenciMesajlari, ...eski]
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    },

    ogrenciOkunmamis: (sid) => ogrenciOkunmamisIdler(sid).length,
    ogrenciOkunmamisIdler,

    /** Koçun görmediği tüm öğrenci mesajlarının rozet id'leri. */
    kocOkunmamisIdler: () => {
        const idler = [];
        tumSidler().forEach((sid) => {
            const goruldu = nesneOku(kocGorduAnahtar(sid));
            listeOku(ogrenciKanal(sid)).forEach((m) => {
                if (!goruldu[String(m.id)]) idler.push(`msj:${m.id}`);
            });
        });
        return idler;
    },

    tumSidler,
};

export default mesajKanali;
