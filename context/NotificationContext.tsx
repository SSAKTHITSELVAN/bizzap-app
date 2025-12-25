// contexts/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { AppState, AppStateStatus } from 'react-native';
import { notificationService, NotificationData } from '../services/notificationService';

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

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const appState = useRef(AppState.currentState);

  // Register for push notifications on mount
  useEffect(() => {
    registerForPushNotifications();
    loadNotifications();

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
        await notificationService.registerTokenWithBackend(token);
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
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
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationReceived = async (notification: Notifications.Notification) => {
    console.log('Notification received in foreground:', notification);
    
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
    console.log('Notification tapped:', response);
    
    const data = response.notification.request.content.data;
    
    // Navigate based on notification type
    if (data?.type === 'NEW_LEAD' && data?.leadId) {
      router.push(`/(app)/leads/${data.leadId}`);
    } else if (data?.type === 'LEAD_CONSUMED') {
      router.push('/(app)/dashboard/my-leads');
    } else if (data?.screen) {
      router.push(data.screen);
    } else {
      router.push('/(app)/dashboard/notifications');
    }
  };

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App came to foreground, refresh notifications
      console.log('App came to foreground, refreshing notifications');
      await loadNotifications();
    }
    appState.current = nextAppState;
  };

  const refreshNotifications = async () => {
    await loadNotifications();
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      await notificationService.markAsRead(notificationIds);
      
      setNotifications(prev =>
        prev.map(notif =>
          notificationIds.includes(notif.id) ? { ...notif, isRead: true } : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      const deletedNotif = notifications.find(n => n.id === notificationId);
      
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      if (deletedNotif && !deletedNotif.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await notificationService.deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      
      // Also clear from notification center
      await notificationService.clearAllDeliveredNotifications();
    } catch (error) {
      console.error('Error deleting all notifications:', error);
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