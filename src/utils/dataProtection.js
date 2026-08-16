// ═══════════════════════════════════════════════════════════════
//  Veri Koruma Yardımcısı
//  Kritik işlemler için İbrahim Karataş onayı zorunlu
// ═══════════════════════════════════════════════════════════════

const OWNER_NAME = 'İbrahim Karataş';

/**
 * Kritik veri işlemi için admin onayı ister.
 * Kullanıcı doğru ismi yazarsa callback çalışır.
 * @param {string} actionDescription - Yapılacak işlemin açıklaması
 * @param {Function} onConfirm - Onay verilince çalışacak fonksiyon
 * @returns {boolean} - Onaylandı mı?
 */
export const requireOwnerConfirmation = (actionDescription, onConfirm) => {
    const entered = window.prompt(
        `🔒 VERİ KORUMA - YÖNETİCİ ONAYI GEREKLİ\n\n` +
        `İşlem: "${actionDescription}"\n\n` +
        `Bu işlem GERİ ALINAMAZDIR.\n` +
        `Devam etmek için tam adınızı girin:\n` +
        `(${OWNER_NAME})`
    );

    if (entered === null) return false; // İptal

    if (entered.trim() === OWNER_NAME) {
        onConfirm();
        return true;
    } else {
        window.alert(`❌ Onay başarısız!\nGirilen: "${entered}"\nBeklenen: "${OWNER_NAME}"\n\nİşlem iptal edildi.`);
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
