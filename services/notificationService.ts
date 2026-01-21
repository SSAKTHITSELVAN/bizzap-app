// services/notificationService.ts - ANDROID-FOCUSED, CRASH-PROOF
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCall } from './apiClient'; // Use existing API client

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

class NotificationService {
  private notificationsModule: any = null;
  private isAndroid = Platform.OS === 'android';

  /**
   * Load expo-notifications module safely
   */
  private async loadNotificationsModule(): Promise<boolean> {
    try {
      if (!this.isAndroid) {
        console.log('[NotificationService] Not Android, skipping');
        return false;
      }

      if (this.notificationsModule) return true;

      // Skip in Expo Go
      if (Constants.appOwnership === 'expo') {
        console.log('[NotificationService] Expo Go detected, skipping');
        return false;
      }
      
      const Notifications = await import('expo-notifications');
      this.notificationsModule = Notifications;
      
      // Configure notification handler for Android
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    
      console.log('[NotificationService] ✅ Module loaded');
      return true;
    } catch (error) {
      console.log('[NotificationService] Could not load module:', error.message);
      return false;
    }
  }

  /**
   * Register for push notifications - ANDROID ONLY
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Only work on Android
      if (!this.isAndroid) {
        console.log('[NotificationService] Not Android');
        return null;
      }

      // Must be physical device
      if (!Device.isDevice) {
        console.log('[NotificationService] Emulator detected');
        return null;
      }

      // Load module
      const loaded = await this.loadNotificationsModule();
      if (!loaded || !this.notificationsModule) {
        console.log('[NotificationService] Module not available');
        return null;
      }

      const Notifications = this.notificationsModule;

      // Get permission
      let permissionStatus = 'undetermined';
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        permissionStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          permissionStatus = status;
        }
      } catch (permError) {
        console.error('[NotificationService] Permission error:', permError);
        return null;
      }

      if (permissionStatus !== 'granted') {
        console.log('[NotificationService] Permission denied:', permissionStatus);
        return null;
      }

      // Get project ID
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.error('[NotificationService] No project ID found');
        console.error('[NotificationService] Add this to app.json:');
        console.error('"extra": { "eas": { "projectId": "your-project-id" } }');
        return null;
      }

      // Get push token
      let token = null;
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        token = tokenData.data;
        console.log('[NotificationService] ✅ Token obtained:', token.substring(0, 20) + '...');
      } catch (tokenError) {
        console.error('[NotificationService] Token error:', tokenError);
        return null;
      }

      // Configure Android notification channel
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#01BE8B',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });
        console.log('[NotificationService] ✅ Android channel configured');
      } catch (channelError) {
        console.log('[NotificationService] Channel config failed (non-critical)');
      }

      // Store token
      try {
        await AsyncStorage.setItem('notification_token', token);
      } catch {}

      return token;
    } catch (error) {
      console.error('[NotificationService] Registration error:', error);
      return null;
    }
  }

  /**
   * Register token with backend
   */
  async registerTokenWithBackend(token: string): Promise<boolean> {
    try {
      if (!token) return false;

      const deviceId = await this.getDeviceId();
      
      console.log('[NotificationService] Registering with backend...');

      // Use apiCall instead of direct axios
      await apiCall(
        '/notifications/register-token',
        'POST',
        {
          token,
          deviceId,
          platform: 'android',
        },
        true // requires auth
      );

      console.log('[NotificationService] ✅ Backend registration successful');
      return true;
    } catch (error: any) {
      console.error('[NotificationService] Backend error:', error.message);
      return false;
    }
  }

  /**
   * Unregister token
   */
  async unregisterToken(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('notification_token');
      if (!token) return true;

      try {
        await apiCall(
          '/notifications/unregister-token',
          'POST',
          { token },
          true
        );
      } catch {}

      await AsyncStorage.removeItem('notification_token');
      console.log('[NotificationService] ✅ Token unregistered');
      return true;
    } catch (error: any) {
      console.error('[NotificationService] Unregister error:', error.message);
      return false;
    }
  }

  /**
   * Get all notifications - ALWAYS WORKS
   */
  async getAllNotifications(): Promise<NotificationData[]> {
    try {
      const response = await apiCall<{ message: string; data: NotificationData[] }>(
        '/notifications',
        'GET',
        null,
        true
      );

      if (response && Array.isArray(response.data)) {
        console.log(`[NotificationService] ✅ Loaded ${response.data.length} notifications`);
        return response.data;
      }

      return [];
    } catch (error: any) {
      console.error('[NotificationService] Get error:', error.message);
      return [];
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiCall<{ data: { count: number } }>(
        '/notifications/unread-count',
        'GET',
        null,
        true
      );

      const count = response?.data?.count || 0;
      console.log(`[NotificationService] Unread count: ${count}`);
      return count;
    } catch (error: any) {
      console.error('[NotificationService] Count error:', error.message);
      return 0;
    }
  }

  /**
   * Mark as read
   */
  async markAsRead(notificationIds: string[]): Promise<boolean> {
    if (!notificationIds?.length) return false;

    try {
      await apiCall(
        '/notifications/mark-read',
        'POST',
        { notificationIds },
        true
      );
      return true;
    } catch (error: any) {
      console.error('[NotificationService] Mark read error:', error.message);
      return false;
    }
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      await apiCall(
        '/notifications/mark-all-read',
        'POST',
        {},
        true
      );
      return true;
    } catch (error: any) {
      console.error('[NotificationService] Mark all error:', error.message);
      return false;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    if (!notificationId) return false;

    try {
      await apiCall(
        `/notifications/${notificationId}`,
        'DELETE',
        null,
        true
      );
      return true;
    } catch (error: any) {
      console.error('[NotificationService] Delete error:', error.message);
      return false;
    }
  }

  /**
   * Delete all
   */
  async deleteAllNotifications(): Promise<boolean> {
    try {
      await apiCall(
        '/notifications',
        'DELETE',
        null,
        true
      );
      return true;
    } catch (error: any) {
      console.error('[NotificationService] Delete all error:', error.message);
      return false;
    }
  }

  /**
   * Clear delivered notifications
   */
  async clearAllDeliveredNotifications(): Promise<boolean> {
    try {
      if (!this.isAndroid) return false;

      const loaded = await this.loadNotificationsModule();
      if (!loaded || !this.notificationsModule) return false;

      await this.notificationsModule.dismissAllNotificationsAsync();
      console.log('[NotificationService] ✅ Cleared delivered');
      return true;
    } catch (error: any) {
      console.log('[NotificationService] Clear error:', error.message);
      return false;
    }
  }

  /**
   * Get device ID
   */
  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      
      if (!deviceId) {
        deviceId = `android-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        await AsyncStorage.setItem('device_id', deviceId);
      }
      
      return deviceId;
    } catch (error) {
      return `android-${Date.now()}`;
    }
  }

  /**
   * Check if push is enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      if (!this.isAndroid) return false;

      const loaded = await this.loadNotificationsModule();
      if (!loaded || !this.notificationsModule) return false;
      
      const { status } = await this.notificationsModule.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      return false;
    }
  }
}

export const notificationService = new NotificationService();