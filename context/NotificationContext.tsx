// contexts/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { notificationService, NotificationData } from '../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const appState = useRef(AppState.currentState);

  // Initialize notifications after ensuring auth token exists
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Wait a bit for AsyncStorage to be ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if auth token exists
        const authToken = await AsyncStorage.getItem('auth_token');
        
        if (authToken) {
          console.log('[NotificationProvider] Auth token found, initializing...');
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

    // Listen for foreground notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(
      handleNotificationReceived
    );

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

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
      const token = await notificationService.registerForPushNotifications();
      if (token) {
        console.log('[NotificationProvider] Registering token with backend...');
        await notificationService.registerTokenWithBackend(token);
        console.log('[NotificationProvider] ✅ Token registered successfully');
      }
    } catch (error) {
      console.error('[NotificationProvider] Error registering push notifications:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const [notifs, count] = await Promise.all([
        notificationService.getAllNotifications(),
        notificationService.getUnreadCount(),
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

  const handleNotificationReceived = async (notification: Notifications.Notification) => {
    console.log('[NotificationProvider] Notification received in foreground:', notification.request.content.title);
    
    // Add to local notifications list immediately
    const newNotification: NotificationData = {
      id: notification.request.identifier,
      type: notification.request.content.data?.type || 'SYSTEM',
      title: notification.request.content.title || '',
      body: notification.request.content.body || '',
      data: notification.request.content.data || {},
      isRead: false,
      createdAt: new Date().toISOString(),
      leadId: notification.request.content.data?.leadId,
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Refresh from server to get the actual notification
    setTimeout(() => loadNotifications(), 1000);
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    console.log('[NotificationProvider] Notification tapped:', response.notification.request.content.title);
    
    const data = response.notification.request.content.data;
    
    // Navigate based on notification type
    if (data?.type === 'NEW_LEAD' && data?.leadId) {
      router.push(`/(app)/leads/${data.leadId}`);
    } else if (data?.type === 'LEAD_CONSUMED') {
      router.push('/(app)/dashboard/my-leads');
    } else if (data?.screen) {
      router.push(data.screen);
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
      await notificationService.markAsRead(notificationIds);
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
      await notificationService.markAllAsRead();
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
      await notificationService.deleteNotification(notificationId);
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
      await notificationService.deleteAllNotifications();
      
      // Also clear from notification center (mobile only)
      if (Platform.OS !== 'web') {
        await notificationService.clearAllDeliveredNotifications();
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