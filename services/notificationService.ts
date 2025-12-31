// // services/notificationService.ts
// import * as Notifications from 'expo-notifications';
// import * as Device from 'expo-device';
// import { Platform } from 'react-native';
// import Constants from 'expo-constants';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const API_URL = process.env.EXPO_PUBLIC_API_URL || 'YOUR_API_URL';

// export interface NotificationData {
//   id: string;
//   type: string;
//   title: string;
//   body: string;
//   data: any;
//   isRead: boolean;
//   createdAt: string;
//   leadId?: string;
// }

// // Configure how notifications are displayed
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

// class NotificationService {
//   /**
//    * Register for push notifications
//    * Returns token for mobile, placeholder for web
//    */
//   async registerForPushNotifications(): Promise<string | null> {
//     try {
//       // Check if we're on a physical device (required for push notifications)
//       if (!Device.isDevice && Platform.OS !== 'web') {
//         console.log('Must use physical device for Push Notifications');
//         return null;
//       }

//       // For web, return a placeholder token
//       if (Platform.OS === 'web') {
//         console.log('[Web] Creating placeholder token for web platform');
//         const webToken = `web-${Date.now()}-${Math.random().toString(36).substring(7)}`;
//         await AsyncStorage.setItem('notification_token', webToken);
//         return webToken;
//       }

//       // Check existing permissions
//       const { status: existingStatus } = await Notifications.getPermissionsAsync();
//       let finalStatus = existingStatus;

//       // Request permissions if not granted
//       if (existingStatus !== 'granted') {
//         const { status } = await Notifications.requestPermissionsAsync();
//         finalStatus = status;
//       }

//       if (finalStatus !== 'granted') {
//         console.log('Failed to get push token for push notification!');
//         return null;
//       }

//       // Get the Expo push token
//       const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
//       if (!projectId) {
//         console.error('Project ID not found in app.json');
//         return null;
//       }

//       const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
//       console.log('[Mobile] Expo push token:', token);

//       // Configure Android notification channel
//       if (Platform.OS === 'android') {
//         await Notifications.setNotificationChannelAsync('default', {
//           name: 'default',
//           importance: Notifications.AndroidImportance.MAX,
//           vibrationPattern: [0, 250, 250, 250],
//           lightColor: '#FF231F7C',
//           sound: 'default',
//           enableVibrate: true,
//           showBadge: true,
//         });
//         console.log('[Android] Notification channel configured');
//       }

//       return token;
//     } catch (error) {
//       console.error('Error registering for push notifications:', error);
//       return null;
//     }
//   }

//   /**
//    * Register token with backend
//    */
//   async registerTokenWithBackend(token: string): Promise<void> {
//     try {
//       const authToken = await AsyncStorage.getItem('auth_token');
//       if (!authToken) {
//         console.log('No auth token found, skipping token registration');
//         return;
//       }

//       const deviceId = await this.getDeviceId();
//       const platform = Platform.OS;

//       console.log(`Registering token with backend - Platform: ${platform}`);

//       await axios.post(
//         `${API_URL}/notifications/register-token`,
//         {
//           token,
//           deviceId,
//           platform,
//         },
//         {
//           headers: { Authorization: `Bearer ${authToken}` },
//         }
//       );

//       console.log('✅ Token registered with backend successfully');
//     } catch (error) {
//       console.error('❌ Error registering token with backend:', error);
//     }
//   }

//   /**
//    * Unregister token when logging out
//    */
//   async unregisterToken(): Promise<void> {
//     try {
//       const token = await AsyncStorage.getItem('notification_token');
//       const authToken = await AsyncStorage.getItem('auth_token');

//       if (!token || !authToken) return;

//       await axios.post(
//         `${API_URL}/notifications/unregister-token`,
//         { token },
//         {
//           headers: { Authorization: `Bearer ${authToken}` },
//         }
//       );

//       await AsyncStorage.removeItem('notification_token');
//       console.log('✅ Token unregistered successfully');
//     } catch (error) {
//       console.error('❌ Error unregistering token:', error);
//     }
//   }

//   /**
//    * Get all notifications for user
//    */
//   async getAllNotifications(): Promise<NotificationData[]> {
//     try {
//       const authToken = await AsyncStorage.getItem('auth_token');
//       if (!authToken) return [];

//       const response = await axios.get(`${API_URL}/notifications`, {
//         headers: { Authorization: `Bearer ${authToken}` },
//       });

//       return response.data.data || [];
//     } catch (error) {
//       console.error('Error fetching notifications:', error);
//       return [];
//     }
//   }

//   /**
//    * Get unread notification count
//    */
//   async getUnreadCount(): Promise<number> {
//     try {
//       const authToken = await AsyncStorage.getItem('auth_token');
//       if (!authToken) return 0;

//       const response = await axios.get(`${API_URL}/notifications/unread-count`, {
//         headers: { Authorization: `Bearer ${authToken}` },
//       });

//       return response.data.data?.count || 0;
//     } catch (error) {
//       console.error('Error fetching unread count:', error);
//       return 0;
//     }
//   }

//   /**
//    * Mark notifications as read
//    */
//   async markAsRead(notificationIds: string[]): Promise<void> {
//     try {
//       const authToken = await AsyncStorage.getItem('auth_token');
//       if (!authToken) return;

//       await axios.post(
//         `${API_URL}/notifications/mark-read`,
//         { notificationIds },
//         {
//           headers: { Authorization: `Bearer ${authToken}` },
//         }
//       );
//     } catch (error) {
//       console.error('Error marking as read:', error);
//       throw error;
//     }
//   }

//   /**
//    * Mark all notifications as read
//    */
//   async markAllAsRead(): Promise<void> {
//     try {
//       const authToken = await AsyncStorage.getItem('auth_token');
//       if (!authToken) return;

//       await axios.post(
//         `${API_URL}/notifications/mark-all-read`,
//         {},
//         {
//           headers: { Authorization: `Bearer ${authToken}` },
//         }
//       );
//     } catch (error) {
//       console.error('Error marking all as read:', error);
//       throw error;
//     }
//   }

//   /**
//    * Delete a notification
//    */
//   async deleteNotification(notificationId: string): Promise<void> {
//     try {
//       const authToken = await AsyncStorage.getItem('auth_token');
//       if (!authToken) return;

//       await axios.delete(`${API_URL}/notifications/${notificationId}`, {
//         headers: { Authorization: `Bearer ${authToken}` },
//       });
//     } catch (error) {
//       console.error('Error deleting notification:', error);
//       throw error;
//     }
//   }

//   /**
//    * Delete all notifications
//    */
//   async deleteAllNotifications(): Promise<void> {
//     try {
//       const authToken = await AsyncStorage.getItem('auth_token');
//       if (!authToken) return;

//       await axios.delete(`${API_URL}/notifications`, {
//         headers: { Authorization: `Bearer ${authToken}` },
//       });
//     } catch (error) {
//       console.error('Error deleting all notifications:', error);
//       throw error;
//     }
//   }

//   /**
//    * Clear all delivered notifications from notification center
//    * (Mobile only - removes notifications from the notification tray)
//    */
//   async clearAllDeliveredNotifications(): Promise<void> {
//     try {
//       if (Platform.OS !== 'web') {
//         await Notifications.dismissAllNotificationsAsync();
//         console.log('✅ Cleared all delivered notifications');
//       }
//     } catch (error) {
//       console.error('Error clearing delivered notifications:', error);
//     }
//   }

//   /**
//    * Get device ID for tracking
//    */
//   private async getDeviceId(): Promise<string> {
//     try {
//       let deviceId = await AsyncStorage.getItem('device_id');
      
//       if (!deviceId) {
//         deviceId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
//         await AsyncStorage.setItem('device_id', deviceId);
//       }
      
//       return deviceId;
//     } catch (error) {
//       console.error('Error getting device ID:', error);
//       return `${Platform.OS}-${Date.now()}`;
//     }
//   }
// }

// export const notificationService = new NotificationService();


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
   * Register for push notifications with comprehensive error handling
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
        console.log('Push notification permission denied');
        return null;
      }

      // Get the Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        console.error('Project ID not found in app.json');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = tokenData.data;
      
      console.log('[Mobile] Expo push token obtained successfully');

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
   * Register token with backend with retry logic
   */
  async registerTokenWithBackend(token: string, retries: number = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const authToken = await AsyncStorage.getItem('auth_token');
        if (!authToken) {
          console.log('No auth token found, skipping token registration');
          return false;
        }

        const deviceId = await this.getDeviceId();
        const platform = Platform.OS;

        console.log(`Registering token with backend (Attempt ${attempt}/${retries})`);

        await axios.post(
          `${API_URL}/notifications/register-token`,
          { token, deviceId, platform },
          {
            headers: { Authorization: `Bearer ${authToken}` },
            timeout: 10000, // 10 second timeout
          }
        );

        console.log('✅ Token registered with backend successfully');
        return true;
      } catch (error: any) {
        console.error(`❌ Error registering token (Attempt ${attempt}/${retries}):`, error.message);
        
        if (attempt === retries) {
          return false;
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    return false;
  }

  /**
   * Unregister token when logging out
   */
  async unregisterToken(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('notification_token');
      const authToken = await AsyncStorage.getItem('auth_token');

      if (!token || !authToken) {
        console.log('No token to unregister');
        return true;
      }

      await axios.post(
        `${API_URL}/notifications/unregister-token`,
        { token },
        {
          headers: { Authorization: `Bearer ${authToken}` },
          timeout: 5000,
        }
      );

      await AsyncStorage.removeItem('notification_token');
      console.log('✅ Token unregistered successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Error unregistering token:', error.message);
      // Still remove local token even if API call fails
      try {
        await AsyncStorage.removeItem('notification_token');
      } catch {}
      return false;
    }
  }

  /**
   * Get all notifications for user with error handling
   */
  async getAllNotifications(): Promise<NotificationData[]> {
    try {
      const authToken = await AsyncStorage.getItem('auth_token');
      if (!authToken) {
        console.log('No auth token, returning empty notifications');
        return [];
      }

      const response = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 10000,
      });

      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      return [];
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.error('Unauthorized - token may be expired');
      } else if (error.code === 'ECONNABORTED') {
        console.error('Request timeout - network may be slow');
      } else {
        console.error('Error fetching notifications:', error.message);
      }
      return [];
    }
  }

  /**
   * Get unread notification count with error handling
   */
  async getUnreadCount(): Promise<number> {
    try {
      const authToken = await AsyncStorage.getItem('auth_token');
      if (!authToken) return 0;

      const response = await axios.get(`${API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 5000,
      });

      return response.data.data?.count || 0;
    } catch (error: any) {
      console.error('Error fetching unread count:', error.message);
      return 0;
    }
  }

  /**
   * Mark notifications as read with error handling
   */
  async markAsRead(notificationIds: string[]): Promise<boolean> {
    if (!notificationIds || notificationIds.length === 0) {
      console.log('No notification IDs provided');
      return false;
    }

    try {
      const authToken = await AsyncStorage.getItem('auth_token');
      if (!authToken) {
        console.log('No auth token');
        return false;
      }

      await axios.post(
        `${API_URL}/notifications/mark-read`,
        { notificationIds },
        {
          headers: { Authorization: `Bearer ${authToken}` },
          timeout: 5000,
        }
      );

      console.log(`✅ Marked ${notificationIds.length} notification(s) as read`);
      return true;
    } catch (error: any) {
      console.error('Error marking as read:', error.message);
      return false;
    }
  }

  /**
   * Mark all notifications as read with error handling
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      const authToken = await AsyncStorage.getItem('auth_token');
      if (!authToken) {
        console.log('No auth token');
        return false;
      }

      await axios.post(
        `${API_URL}/notifications/mark-all-read`,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` },
          timeout: 5000,
        }
      );

      console.log('✅ Marked all notifications as read');
      return true;
    } catch (error: any) {
      console.error('Error marking all as read:', error.message);
      return false;
    }
  }

  /**
   * Delete a notification with error handling
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    if (!notificationId) {
      console.log('No notification ID provided');
      return false;
    }

    try {
      const authToken = await AsyncStorage.getItem('auth_token');
      if (!authToken) {
        console.log('No auth token');
        return false;
      }

      await axios.delete(`${API_URL}/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 5000,
      });

      console.log('✅ Notification deleted successfully');
      return true;
    } catch (error: any) {
      console.error('Error deleting notification:', error.message);
      return false;
    }
  }

  /**
   * Delete all notifications with error handling
   */
  async deleteAllNotifications(): Promise<boolean> {
    try {
      const authToken = await AsyncStorage.getItem('auth_token');
      if (!authToken) {
        console.log('No auth token');
        return false;
      }

      await axios.delete(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 10000,
      });

      console.log('✅ All notifications deleted successfully');
      return true;
    } catch (error: any) {
      console.error('Error deleting all notifications:', error.message);
      return false;
    }
  }

  /**
   * Clear all delivered notifications from notification center
   * (Mobile only - removes notifications from the notification tray)
   */
  async clearAllDeliveredNotifications(): Promise<boolean> {
    try {
      if (Platform.OS !== 'web') {
        await Notifications.dismissAllNotificationsAsync();
        console.log('✅ Cleared all delivered notifications');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error clearing delivered notifications:', error.message);
      return false;
    }
  }

  /**
   * Get device ID for tracking with error handling
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
      // Fallback to temporary ID
      return `${Platform.OS}-${Date.now()}`;
    }
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') return true;
      
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();