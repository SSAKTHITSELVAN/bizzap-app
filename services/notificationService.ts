// services/notificationService.ts - CHECK YOUR CURRENT FILE
// 
// ⚠️ YOUR CURRENT FILE IS MISSING THESE METHODS:
// 1. initialize()
// 2. getDiagnostics()
// 3. setupNotificationHandler()
// 4. setupAndroidChannel()
// 5. validateProjectId()
// 6. shouldRefreshToken()
//
// 🔧 TO FIX: Replace your entire services/notificationService.ts with this version

// services/notificationService.ts - COMPLETE FIXED VERSION
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCall } from './apiClient';

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
  private isInitialized = false;

  /**
   * ✅ NEW METHOD: Initialize notification system
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      if (!this.isAndroid) {
        console.log('[NotificationService] Not Android, skipping');
        return false;
      }

      if (Constants.appOwnership === 'expo') {
        console.log('[NotificationService] Expo Go detected, skipping');
        return false;
      }

      if (!Device.isDevice) {
        console.log('[NotificationService] Emulator detected, skipping');
        return false;
      }

      const loaded = await this.loadNotificationsModule();
      if (!loaded) return false;

      await this.setupNotificationHandler();
      await this.setupAndroidChannel();

      this.isInitialized = true;
      console.log('[NotificationService] ✅ Initialized successfully');
      return true;
    } catch (error) {
      console.error('[NotificationService] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Load expo-notifications module safely
   */
  private async loadNotificationsModule(): Promise<boolean> {
    try {
      if (this.notificationsModule) return true;
      
      const Notifications = await import('expo-notifications');
      this.notificationsModule = Notifications;
      
      console.log('[NotificationService] ✅ Module loaded');
      return true;
    } catch (error) {
      console.error('[NotificationService] Failed to load module:', error);
      return false;
    }
  }

  /**
   * ✅ NEW METHOD: Set notification handler
   */
  private async setupNotificationHandler(): Promise<void> {
    if (!this.notificationsModule) return;

    try {
      const Notifications = this.notificationsModule;
      
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      console.log('[NotificationService] ✅ Notification handler configured');
    } catch (error) {
      console.error('[NotificationService] Failed to set handler:', error);
    }
  }

  /**
   * ✅ NEW METHOD: Create Android notification channel
   */
  private async setupAndroidChannel(): Promise<void> {
    if (!this.isAndroid || !this.notificationsModule) return;

    try {
      const Notifications = this.notificationsModule;
      
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#01BE8B',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
        enableLights: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });

      console.log('[NotificationService] ✅ Android channel created');
    } catch (error) {
      console.error('[NotificationService] Failed to create Android channel:', error);
      throw error;
    }
  }

  /**
   * ✅ NEW METHOD: Validate project ID
   */
  private validateProjectId(): string | null {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    if (!projectId) {
      console.error('[NotificationService] ❌ CRITICAL: No project ID found!');
      console.error('[NotificationService] Add this to app.json:');
      console.error('"extra": { "eas": { "projectId": "926c2cb4-a532-4ac8-ac3b-d5e3b893978d" } }');
      return null;
    }

    console.log('[NotificationService] ✅ Project ID found:', projectId);
    return projectId;
  }

  /**
   * Register for push notifications
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) return null;
      }

      if (!this.notificationsModule) {
        console.log('[NotificationService] Module not available');
        return null;
      }

      const Notifications = this.notificationsModule;

      // Step 1: Check permissions
      console.log('[NotificationService] Step 1: Checking permissions...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        console.log('[NotificationService] Requesting permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[NotificationService] ❌ Permission denied:', finalStatus);
        return null;
      }

      console.log('[NotificationService] ✅ Permission granted');

      // Step 2: Validate project ID
      const projectId = this.validateProjectId();
      if (!projectId) return null;

      // Step 3: Get push token
      console.log('[NotificationService] Step 3: Getting push token...');
      let token = null;
      
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        token = tokenData.data;
        console.log('[NotificationService] ✅ Token obtained:', token.substring(0, 30) + '...');
      } catch (tokenError: any) {
        console.error('[NotificationService] ❌ Token error:', tokenError.message);
        return null;
      }

      // Step 4: Store token
      try {
        await AsyncStorage.setItem('notification_token', token);
        await AsyncStorage.setItem('notification_token_timestamp', Date.now().toString());
      } catch {
        console.log('[NotificationService] Storage save failed (non-critical)');
      }

      return token;
    } catch (error: any) {
      console.error('[NotificationService] ❌ Registration failed:', error.message);
      return null;
    }
  }

  /**
   * Register token with backend
   */
  async registerTokenWithBackend(token: string, retries = 3): Promise<boolean> {
    if (!token) return false;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const deviceId = await this.getDeviceId();
        
        console.log(`[NotificationService] Registering with backend (attempt ${attempt}/${retries})...`);

        await apiCall(
          '/notifications/register-token',
          'POST',
          {
            token,
            deviceId,
            platform: 'android',
          },
          true
        );

        console.log('[NotificationService] ✅ Backend registration successful');
        await AsyncStorage.setItem('backend_registration_timestamp', Date.now().toString());
        
        return true;
      } catch (error: any) {
        console.error(`[NotificationService] Backend registration attempt ${attempt} failed:`, error.message);
        
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          console.log('[NotificationService] Auth error - stopping retries');
          return false;
        }
        
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`[NotificationService] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.log('[NotificationService] ❌ All backend registration attempts failed');
    return false;
  }

  /**
   * Unregister token
   */
  async unregisterToken(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('notification_token');
      if (!token) return true;

      try {
        await apiCall('/notifications/unregister-token', 'POST', { token }, true);
      } catch {}

      await AsyncStorage.multiRemove([
        'notification_token',
        'notification_token_timestamp',
        'backend_registration_timestamp'
      ]);
      
      console.log('[NotificationService] ✅ Token unregistered');
      return true;
    } catch (error: any) {
      console.error('[NotificationService] Unregister error:', error.message);
      return false;
    }
  }

  /**
   * ✅ NEW METHOD: Check if token needs refresh
   */
  async shouldRefreshToken(): Promise<boolean> {
    try {
      const timestamp = await AsyncStorage.getItem('notification_token_timestamp');
      if (!timestamp) return true;

      const age = Date.now() - parseInt(timestamp);
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      
      return age > thirtyDays;
    } catch {
      return true;
    }
  }

  // ========== DATABASE METHODS ==========

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

  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiCall<{ data: { count: number } }>(
        '/notifications/unread-count',
        'GET',
        null,
        true
      );

      return response?.data?.count || 0;
    } catch (error: any) {
      console.error('[NotificationService] Count error:', error.message);
      return 0;
    }
  }

  async markAsRead(notificationIds: string[]): Promise<boolean> {
    if (!notificationIds?.length) return false;

    try {
      await apiCall('/notifications/mark-read', 'POST', { notificationIds }, true);
      return true;
    } catch (error: any) {
      console.error('[NotificationService] Mark read error:', error.message);
      return false;
    }
  }

  async markAllAsRead(): Promise<boolean> {
    try {
      await apiCall('/notifications/mark-all-read', 'POST', {}, true);
      return true;
    } catch (error: any) {
      console.error('[NotificationService] Mark all error:', error.message);
      return false;
    }
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    if (!notificationId) return false;

    try {
      await apiCall(`/notifications/${notificationId}`, 'DELETE', null, true);
      return true;
    } catch (error: any) {
      console.error('[NotificationService] Delete error:', error.message);
      return false;
    }
  }

  async deleteAllNotifications(): Promise<boolean> {
    try {
      await apiCall('/notifications', 'DELETE', null, true);
      return true;
    } catch (error: any) {
      console.error('[NotificationService] Delete all error:', error.message);
      return false;
    }
  }

  async clearAllDeliveredNotifications(): Promise<boolean> {
    try {
      if (!this.isAndroid || !this.notificationsModule) return false;

      await this.notificationsModule.dismissAllNotificationsAsync();
      console.log('[NotificationService] ✅ Cleared delivered');
      return true;
    } catch (error: any) {
      console.log('[NotificationService] Clear error:', error.message);
      return false;
    }
  }

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

  async areNotificationsEnabled(): Promise<boolean> {
    try {
      if (!this.isAndroid || !this.notificationsModule) return false;
      
      const { status } = await this.notificationsModule.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      return false;
    }
  }

  /**
   * ✅ NEW METHOD: Get diagnostic info
   */
  async getDiagnostics(): Promise<any> {
    const diagnostics: any = {
      platform: Platform.OS,
      isDevice: Device.isDevice,
      isExpoGo: Constants.appOwnership === 'expo',
      projectId: Constants.expoConfig?.extra?.eas?.projectId || null,
      moduleLoaded: !!this.notificationsModule,
      isInitialized: this.isInitialized,
    };

    try {
      diagnostics.storedToken = !!(await AsyncStorage.getItem('notification_token'));
      diagnostics.tokenAge = await AsyncStorage.getItem('notification_token_timestamp');
      diagnostics.backendRegistered = !!(await AsyncStorage.getItem('backend_registration_timestamp'));
      
      if (this.notificationsModule) {
        const { status } = await this.notificationsModule.getPermissionsAsync();
        diagnostics.permissionStatus = status;
      }
    } catch (error: any) {
      diagnostics.error = error.message;
    }

    return diagnostics;
  }
}

export const notificationService = new NotificationService();