// services/notificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiCall } from './apiClient';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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

export const notificationService = {
  /**
   * Register for push notifications and get token
   */
  async registerForPushNotifications(): Promise<string | null> {
    let token: string | null = null;

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('Expo Push Token:', token);
      } catch (error) {
        console.error('Error getting push token:', error);
        return null;
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    // Configure notification channels for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  },

  /**
   * Register token with backend
   */
  async registerTokenWithBackend(token: string): Promise<void> {
    try {
      const deviceId = Constants.sessionId;
      const platform = Platform.OS;

      await apiCall('notifications/register-token', 'POST', {
        token,
        deviceId,
        platform,
      });

      console.log('Token registered with backend successfully');
    } catch (error) {
      console.error('Failed to register token with backend:', error);
    }
  },

  /**
   * Get all notifications
   */
  async getAllNotifications(): Promise<NotificationData[]> {
    try {
      const response: any = await apiCall('notifications', 'GET');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  },

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response: any = await apiCall('notifications/unread-count', 'GET');
      return response.data?.count || 0;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      return 0;
    }
  },

  /**
   * Mark notifications as read
   */
  async markAsRead(notificationIds: string[]): Promise<void> {
    try {
      await apiCall('notifications/mark-read', 'POST', { notificationIds });
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      await apiCall('notifications/mark-all-read', 'POST');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await apiCall(`notifications/${notificationId}`, 'DELETE');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  },

  /**
   * Delete all notifications
   */
  async deleteAllNotifications(): Promise<void> {
    try {
      await apiCall('notifications', 'DELETE');
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
      throw error;
    }
  },

  /**
   * Clear all delivered notifications from notification center
   */
  async clearAllDeliveredNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
  },

  /**
   * Clear specific notification from notification center
   */
  async clearNotification(notificationId: string): Promise<void> {
    await Notifications.dismissNotificationAsync(notificationId);
  },
};