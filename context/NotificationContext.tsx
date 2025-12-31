// contexts/NotificationContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  body: string;
  data: any;
  isRead: boolean;
  createdAt: string;
  leadId?: string;
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const notificationsModuleRef = useRef<any>(null);
  const serviceRef = useRef<any>(null);
  const appState = useRef(AppState.currentState);

  // Initialize notifications after ensuring auth token exists
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Wait a bit for AsyncStorage to be ready
        await new Promise(resolve => setTimeout(resolve, 500));
        // If running inside Expo Go, skip notifications (expo-notifications remote push removed in Expo Go)
        if (Constants.appOwnership === 'expo') {
          console.log('[NotificationProvider] Running in Expo Go — skipping push/notification initialization');
          return;
        }

        // Check if auth token exists (support both key variants)
        const authToken = (await AsyncStorage.getItem('authToken')) || (await AsyncStorage.getItem('auth_token'));

        if (authToken) {
          console.log('[NotificationProvider] Auth token found, initializing...');
          // Dynamically import modules to avoid loading expo-notifications in Expo Go
          try {
            const Notifications = await import('expo-notifications');
            notificationsModuleRef.current = Notifications;
            const svc = await import('../services/notificationService');
            serviceRef.current = svc.notificationService;
          } catch (impErr) {
            console.error('[NotificationProvider] Failed to load notification modules:', impErr);
            return;
          }

          await registerForPushNotifications();
          await loadNotifications();
          setIsInitialized(true);
        } else {
          console.log('[NotificationProvider] No auth token yet, will retry...');
          // Retry after 2 seconds
          setTimeout(initializeNotifications, 2000);
        }
      } catch (error) {
        console.error('[NotificationProvider] Initialization error:', error);
        // Retry on error
        setTimeout(initializeNotifications, 2000);
      }
    };

    initializeNotifications();

    // Listen for foreground notifications and taps only if notifications module loaded
    try {
      const Notifications = notificationsModuleRef.current;
      if (Notifications) {
        notificationListener.current = Notifications.addNotificationReceivedListener(
          handleNotificationReceived
        );

        responseListener.current = Notifications.addNotificationResponseReceivedListener(
          handleNotificationResponse
        );
      }
    } catch (err) {
      console.warn('[NotificationProvider] Notification listeners not attached:', err);
    }

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
      subscription.remove();
    };
  }, []);

  const registerForPushNotifications = async () => {
    try {
      const svc = serviceRef.current;
      if (!svc) {
        console.warn('[NotificationProvider] Notification service not available');
        return;
      }

      const token = await svc.registerForPushNotifications();
      if (token) {
        console.log('[NotificationProvider] Registering token with backend...');
        await svc.registerTokenWithBackend(token);
        console.log('[NotificationProvider] ✅ Token registered successfully');
      }
    } catch (error) {
      console.error('[NotificationProvider] Error registering push notifications:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const svc = serviceRef.current;
      if (!svc) {
        console.warn('[NotificationProvider] Notification service not available');
        setIsLoading(false);
        return;
      }

      const [notifs, count] = await Promise.all([
        svc.getAllNotifications(),
        svc.getUnreadCount(),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
      
      if (Platform.OS === 'web') {
        console.log(`[Web] Loaded ${notifs.length} notifications, ${count} unread`);
      }
    } catch (error) {
      console.error('[NotificationProvider] Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationReceived = async (notification: any) => {
    console.log('[NotificationProvider] Notification received in foreground:', notification?.request?.content?.title);
    
    // Add to local notifications list immediately
    const newNotification: NotificationData = {
      id: notification.request?.identifier,
      type: notification.request?.content?.data?.type || 'SYSTEM',
      title: notification.request?.content?.title || '',
      body: notification.request?.content?.body || '',
      data: notification.request?.content?.data || {},
      isRead: false,
      createdAt: new Date().toISOString(),
      leadId: notification.request?.content?.data?.leadId,
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Optionally refresh from server after a delay (only if needed)
    // Removed the loadNotifications call here to prevent unnecessary rerenders
  };

  const handleNotificationResponse = (response: any) => {
    console.log('[NotificationProvider] Notification tapped:', response?.notification?.request?.content?.title);
    
    const data = response?.notification?.request?.content?.data;
    
    // Navigate based on notification type
    if (data?.type === 'NEW_LEAD' && data?.leadId) {
      router.push((`/(app)/leads/${data.leadId}`) as any);
    } else if (data?.type === 'LEAD_CONSUMED') {
      router.push(("/(app)/dashboard/my-leads") as any);
    } else if (data?.screen) {
      router.push(data.screen as any);
    } else {
      router.push('/(app)/notification');
    }
  };

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App came to foreground, refresh notifications
      console.log('[NotificationProvider] App came to foreground, refreshing notifications');
      if (isInitialized) {
        await loadNotifications();
      }
    }
    appState.current = nextAppState;
  };

  const refreshNotifications = async () => {
    if (!isInitialized) {
      console.log('[NotificationProvider] Not initialized yet, skipping refresh');
      return;
    }
    await loadNotifications();
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      // Optimistically update UI
      setNotifications(prev =>
        prev.map(notif =>
          notificationIds.includes(notif.id) ? { ...notif, isRead: true } : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));

      // Then update backend
      const svc = serviceRef.current;
      if (svc) await svc.markAsRead(notificationIds);
    } catch (error) {
      console.error('[NotificationProvider] Error marking as read:', error);
      // Revert on error
      await loadNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      // Optimistically update UI
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      
      setUnreadCount(0);

      // Then update backend
      const svc = serviceRef.current;
      if (svc) await svc.markAllAsRead();
    } catch (error) {
      console.error('[NotificationProvider] Error marking all as read:', error);
      // Revert on error
      await loadNotifications();
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const deletedNotif = notifications.find(n => n.id === notificationId);
      
      // Optimistically update UI
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      if (deletedNotif && !deletedNotif.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Then update backend
      const svc = serviceRef.current;
      if (svc) await svc.deleteNotification(notificationId);
    } catch (error) {
      console.error('[NotificationProvider] Error deleting notification:', error);
      // Revert on error
      await loadNotifications();
      throw error;
    }
  };

  const deleteAllNotifications = async () => {
    try {
      // Optimistically update UI
      setNotifications([]);
      setUnreadCount(0);

      // Then update backend
      const svc = serviceRef.current;
      if (svc) await svc.deleteAllNotifications();
      
      // Also clear from notification center (mobile only)
      if (Platform.OS !== 'web') {
        const svc2 = serviceRef.current;
        if (svc2) await svc2.clearAllDeliveredNotifications();
      }
    } catch (error) {
      console.error('[NotificationProvider] Error deleting all notifications:', error);
      // Revert on error
      await loadNotifications();
      throw error;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};