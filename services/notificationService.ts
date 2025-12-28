// services/notificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'YOUR_API_URL';

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

// Configure how notifications are displayed
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  /**
   * Register for push notifications
   * Returns token for mobile, placeholder for web
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Check if we're on a physical device (required for push notifications)
      if (!Device.isDevice && Platform.OS !== 'web') {
        console.log('Must use physical device for Push Notifications');
        return null;
      }

      // For web, return a placeholder token
      if (Platform.OS === 'web') {
        console.log('[Web] Creating placeholder token for web platform');
        const webToken = `web-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        await AsyncStorage.setItem('notification_token', webToken);
        return webToken;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      // Get the Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        console.error('Project ID not found in app.json');
        return null;
      }

      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('[Mobile] Expo push token:', token);

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });
        console.log('[Android] Notification channel configured');
      }

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Register token with backend
   */
  async registerTokenWithBackend(token: string): Promise<void> {
    try {
      const authToken = await AsyncStorage.getItem('auth_token');
      if (!authToken) {
        console.log('No auth token found, skipping token registration');
        return;
      }

      const deviceId = await this.getDeviceId();
      const platform = Platform.OS;

      console.log(`Registering token with backend - Platform: ${platform}`);

      await axios.post(
        `${API_URL}/notifications/register-token`,
        {
          token,
          deviceId,
          platform,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      console.log('✅ Token registered with backend successfully');
    } catch (error) {
      console.error('❌ Error registering token with backend:', error);
    }
  }

  /**
   * Unregister token when logging out
   */
  async unregisterToken(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('notification_token');
      const authToken = await AsyncStorage.getItem('auth_token');

      if (!token || !authToken) return;

      await axios.post(
        `${API_URL}/notifications/unregister-token`,
        { token },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      await AsyncStorage.removeItem('notification_token');
      console.log('✅ Token unregistered successfully');
    } catch (error) {
      console.error('❌ Error unregistering token:', error);
    }
  }

  /**
   * Get all notifications for user
   */
  async getAllNotifications(): Promise<NotificationData[]> {
    try {
      const authToken = await AsyncStorage.getItem('auth_token');
      if (!authToken) return [];

      const response = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const authToken = await AsyncStorage.getItem('auth_token');
      if (!authToken) return 0;

      const response = await axios.get(`${API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      return response.data.data?.count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(notificationIds: string[]): Promise<void> {
    try {
      const authToken = await AsyncStorage.getItem('auth_token');
      if (!authToken) return;

      await axios.post(
        `${API_URL}/notifications/mark-read`,
        { notificationIds },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
    } catch (error) {
      console.error('Error marking as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      const authToken = await AsyncStorage.getItem('auth_token');
      if (!authToken) return;

      await axios.post(
        `${API_URL}/notifications/mark-all-read`,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const authToken = await AsyncStorage.getItem('auth_token');
      if (!authToken) return;

      await axios.delete(`${API_URL}/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Delete all notifications
   */
  async deleteAllNotifications(): Promise<void> {
    try {
      const authToken = await AsyncStorage.getItem('auth_token');
      if (!authToken) return;

      await axios.delete(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }

  /**
   * Clear all delivered notifications from notification center
   * (Mobile only - removes notifications from the notification tray)
   */
  async clearAllDeliveredNotifications(): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        await Notifications.dismissAllNotificationsAsync();
        console.log('✅ Cleared all delivered notifications');
      }
    } catch (error) {
      console.error('Error clearing delivered notifications:', error);
    }
  }

  /**
   * Get device ID for tracking
   */
  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      
      if (!deviceId) {
        deviceId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        await AsyncStorage.setItem('device_id', deviceId);
      }
      
      return deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      return `${Platform.OS}-${Date.now()}`;
    }
  }
}

export const notificationService = new NotificationService();