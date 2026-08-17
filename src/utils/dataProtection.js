// ═══════════════════════════════════════════════════════════════
//  Veri Koruma Yardımcısı
//  Geri alınamaz işlemler için yazılı onay ister
// ═══════════════════════════════════════════════════════════════

/**
 * Onay için yazılması gereken söz.
 *
 * Eskiden kurucunun kişi adı beklenirdi ve beklenen ad zaten ekranda
 * yazılıydı — yani güvenlik değil, yalnızca yanlışlıkla tıklamayı
 * engelleyen bir adımdı. Uygulama artık birçok koçun kullandığı bir
 * ürün; kimsenin kişi adı koda gömülmez.
 */
const ONAY_SOZU = 'ONAYLIYORUM';

/**
 * Kritik veri işlemi için yazılı onay ister.
 * @param {string} actionDescription - Yapılacak işlemin açıklaması
 * @param {Function} onConfirm - Onay verilince çalışacak fonksiyon
 * @returns {boolean} - Onaylandı mı?
 */
export const requireOwnerConfirmation = (actionDescription, onConfirm) => {
    const entered = window.prompt(
        `🔒 VERİ KORUMA — ONAY GEREKLİ\n\n` +
        `İşlem: "${actionDescription}"\n\n` +
        `Bu işlem GERİ ALINAMAZ.\n` +
        `Devam etmek için "${ONAY_SOZU}" yazın:`
    );

    if (entered === null) return false; // İptal

    if (entered.trim().toLocaleUpperCase('tr-TR') === ONAY_SOZU) {
        onConfirm();
        return true;
    } else {
        window.alert(`❌ Onay başarısız!\nGirilen: "${entered}"\nBeklenen: "${ONAY_SOZU}"\n\nİşlem iptal edildi.`);
        return false;
    }
};

/**
 * Standart onay (geri alınamaz silmeler için, isim gerekmez)
 * @param {string} message - Onay mesajı
 * @param {Function} onConfirm - Onay verilince çalışacak fonksiyon
 */
export const safeConfirm = (message, onConfirm) => {
    if (window.confirm(message)) {
        onConfirm();
        return true;
    }
    return false;
};
