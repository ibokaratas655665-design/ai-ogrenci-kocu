// Default izinler (tüm özellikler açık)
const DEFAULT_PERMISSIONS = {
    canUseStudyPlanner: true,
    canUseAIChat: true,
    canViewAnalytics: true,
    canUploadTrials: true,
    canViewGuidance: true,
    canAccessInventories: true,
    canDownloadReports: true,
    canEditProfile: true,
    canViewMessages: true,
    canViewTasks: true
};

// Student Permissions Helper
export const getStudentPermissions = () => {
    const settings = localStorage.getItem('app_settings');
    if (!settings) {
        return { ...DEFAULT_PERMISSIONS };
    }

    try {
        const parsed = JSON.parse(settings);
        // studentPermissions varsa onunla default'u birleştir (eksik alanlar default'tan gelsin)
        if (parsed.studentPermissions && Object.keys(parsed.studentPermissions).length > 0) {
            return { ...DEFAULT_PERMISSIONS, ...parsed.studentPermissions };
        }
        // yoksa tüm default'ları döndür
        return { ...DEFAULT_PERMISSIONS };
    } catch (error) {
        console.error('Permissions parse error:', error);
        return { ...DEFAULT_PERMISSIONS };
    }
};

export const checkPermission = (permissionKey) => {
    const permissions = getStudentPermissions();
    return permissions[permissionKey] !== false; // Default true
};

export const isSystemLocked = () => {
    const settings = localStorage.getItem('app_settings');
    if (!settings) return false;

    try {
        const parsed = JSON.parse(settings);
        return parsed.systemLocked === true;
    } catch (error) {
        return false;
    }
};

export const isMaintenanceMode = () => {
    const settings = localStorage.getItem('app_settings');
    if (!settings) return false;

    try {
        const parsed = JSON.parse(settings);
        return parsed.maintenanceMode === true;
    } catch (error) {
        return false;
    }
};
