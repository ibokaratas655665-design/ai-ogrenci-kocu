import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { listeOku } from '../services/veriDeposu';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

const STORAGE_KEY = 'app_notifications';

const loadNotifications = () => {
    try {
        return listeOku(STORAGE_KEY);
    } catch {
        return [];
    }
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState(loadNotifications);
    const [isOpen, setIsOpen] = useState(false);

    const saveNotifications = (notifs) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs.slice(0, 50))); // Max 50
    };

    const addNotification = useCallback(({ type = 'info', title, message, icon = null }) => {
        const newNotif = {
            id: Date.now() + Math.random(),
            type, // 'info' | 'success' | 'warning' | 'achievement' | 'task' | 'system'
            title,
            message,
            icon,
            createdAt: new Date().toISOString(),
            read: false,
        };
        setNotifications(prev => {
            const updated = [newNotif, ...prev];
            saveNotifications(updated);
            return updated;
        });
        return newNotif.id;
    }, []);

    const markAsRead = useCallback((id) => {
        setNotifications(prev => {
            const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
            saveNotifications(updated);
            return updated;
        });
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => {
            const updated = prev.map(n => ({ ...n, read: true }));
            saveNotifications(updated);
            return updated;
        });
    }, []);

    const deleteNotification = useCallback((id) => {
        setNotifications(prev => {
            const updated = prev.filter(n => n.id !== id);
            saveNotifications(updated);
            return updated;
        });
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            addNotification,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            clearAll,
            unreadCount,
            isOpen,
            setIsOpen,
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext;
