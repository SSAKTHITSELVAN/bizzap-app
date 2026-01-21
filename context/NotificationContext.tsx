// // contexts/NotificationContext.tsx - FULLY CRASH-PROOF VERSION
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Constants from 'expo-constants';
// import { router } from 'expo-router';
// import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
// import { AppState, AppStateStatus, Platform } from 'react-native';

// interface NotificationContextType {
//   notifications: NotificationData[];
//   unreadCount: number;
//   isLoading: boolean;
//   refreshNotifications: () => Promise<void>;
//   markAsRead: (notificationIds: string[]) => Promise<void>;
//   markAllAsRead: () => Promise<void>;
//   deleteNotification: (notificationId: string) => Promise<void>;
//   deleteAllNotifications: () => Promise<void>;
//   pushPermissionStatus: 'granted' | 'denied' | 'undetermined' | 'unavailable';
//   requestPushPermission: () => Promise<boolean>;
// }

// const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// export const useNotifications = () => {
//   const context = useContext(NotificationContext);
//   if (!context) {
//     throw new Error('useNotifications must be used within NotificationProvider');
//   }
//   return context;
// };

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

// export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [notifications, setNotifications] = useState<NotificationData[]>([]);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isInitialized, setIsInitialized] = useState(false);
//   const [pushPermissionStatus, setPushPermissionStatus] = useState<'granted' | 'denied' | 'undetermined' | 'unavailable'>('undetermined');
  
//   const notificationListener = useRef<any>(null);
//   const responseListener = useRef<any>(null);
//   const notificationsModuleRef = useRef<any>(null);
//   const serviceRef = useRef<any>(null);
//   const appState = useRef(AppState.currentState);
//   const initAttempts = useRef(0);
//   const MAX_INIT_ATTEMPTS = 3;

//   // Initialize notifications
//   useEffect(() => {
//     const initializeNotifications = async () => {
//       try {
//         initAttempts.current += 1;
//         console.log(`[NotificationProvider] Init attempt ${initAttempts.current}/${MAX_INIT_ATTEMPTS}`);

//         // Wait for AsyncStorage to be ready
//         await new Promise(resolve => setTimeout(resolve, 500));

//         // Check if we're in Expo Go - completely skip push notifications
//         const isExpoGo = Constants.appOwnership === 'expo';
//         if (isExpoGo) {
//           console.log('[NotificationProvider] Expo Go detected - using in-app notifications only');
//           setPushPermissionStatus('unavailable');
//           await initializeInAppNotifications();
//           return;
//         }

//         // Check for auth token
//         const authToken = (await AsyncStorage.getItem('authToken')) || (await AsyncStorage.getItem('auth_token'));
//         if (!authToken) {
//           console.log('[NotificationProvider] No auth token, retrying...');
//           if (initAttempts.current < MAX_INIT_ATTEMPTS) {
//             setTimeout(initializeNotifications, 2000);
//           } else {
//             console.log('[NotificationProvider] Max attempts reached, skipping push setup');
//             await initializeInAppNotifications();
//           }
//           return;
//         }

//         console.log('[NotificationProvider] Auth token found, setting up...');

//         // Try to load notification modules
//         const modulesLoaded = await loadNotificationModules();
//         if (!modulesLoaded) {
//           console.log('[NotificationProvider] Could not load push modules, using in-app only');
//           setPushPermissionStatus('unavailable');
//           await initializeInAppNotifications();
//           return;
//         }

//         // Check current permission status
//         await checkPushPermissionStatus();

//         // Try to register for push (non-blocking)
//         registerForPushNotifications().catch(err => {
//           console.log('[NotificationProvider] Push registration failed, continuing with in-app');
//         });

//         // Load notifications from server (always works regardless of push)
//         await loadNotifications();
        
//         setIsInitialized(true);
//         setupNotificationListeners();

//       } catch (error) {
//         console.error('[NotificationProvider] Init error:', error);
//         // Still initialize in-app notifications even if push fails
//         await initializeInAppNotifications().catch(err => {
//           console.error('[NotificationProvider] Even in-app init failed:', err);
//         });
//       }
//     };

//     initializeNotifications();

//     // App state listener
//     const subscription = AppState.addEventListener('change', handleAppStateChange);

//     return () => {
//       cleanupListeners();
//       subscription.remove();
//     };
//   }, []);

//   // Load notification modules safely
//   const loadNotificationModules = async (): Promise<boolean> => {
//     try {
//       const Notifications = await import('expo-notifications');
//       notificationsModuleRef.current = Notifications;
      
//       const svc = await import('../services/notificationService');
//       serviceRef.current = svc.notificationService;
      
//       console.log('[NotificationProvider] Modules loaded successfully');
//       return true;
//     } catch (error) {
//       console.error('[NotificationProvider] Failed to load modules:', error);
//       return false;
//     }
//   };

//   // Initialize in-app notifications (always works)
//   const initializeInAppNotifications = async () => {
//     try {
//       console.log('[NotificationProvider] Initializing in-app notifications');
//       const svc = await import('../services/notificationService');
//       serviceRef.current = svc.notificationService;
//       await loadNotifications();
//       setIsInitialized(true);
//       console.log('[NotificationProvider] In-app notifications ready');
//     } catch (error) {
//       console.error('[NotificationProvider] In-app init error:', error);
//       setIsInitialized(true); // Still mark as initialized to prevent blocking
//     }
//   };

//   // Check push permission status
//   const checkPushPermissionStatus = async () => {
//     try {
//       if (Platform.OS === 'web') {
//         setPushPermissionStatus('unavailable');
//         return;
//       }

//       const Notifications = notificationsModuleRef.current;
//       if (!Notifications) {
//         setPushPermissionStatus('unavailable');
//         return;
//       }

//       const { status } = await Notifications.getPermissionsAsync();
//       if (status === 'granted') {
//         setPushPermissionStatus('granted');
//       } else if (status === 'denied') {
//         setPushPermissionStatus('denied');
//       } else {
//         setPushPermissionStatus('undetermined');
//       }
      
//       console.log('[NotificationProvider] Permission status:', status);
//     } catch (error) {
//       console.error('[NotificationProvider] Error checking permissions:', error);
//       setPushPermissionStatus('unavailable');
//     }
//   };

//   // Request push permission
//   const requestPushPermission = async (): Promise<boolean> => {
//     try {
//       if (Platform.OS === 'web') {
//         console.log('[NotificationProvider] Web platform - no push needed');
//         return false;
//       }

//       const Notifications = notificationsModuleRef.current;
//       if (!Notifications) {
//         console.log('[NotificationProvider] Notifications module not available');
//         return false;
//       }

//       console.log('[NotificationProvider] Requesting push permission...');
//       const { status } = await Notifications.requestPermissionsAsync();
      
//       if (status === 'granted') {
//         setPushPermissionStatus('granted');
//         console.log('[NotificationProvider] Permission granted');
        
//         // Try to register token
//         await registerForPushNotifications();
//         return true;
//       } else {
//         setPushPermissionStatus('denied');
//         console.log('[NotificationProvider] Permission denied');
//         return false;
//       }
//     } catch (error) {
//       console.error('[NotificationProvider] Error requesting permission:', error);
//       setPushPermissionStatus('unavailable');
//       return false;
//     }
//   };

//   // Register for push notifications
//   const registerForPushNotifications = async () => {
//     try {
//       const svc = serviceRef.current;
//       if (!svc) {
//         console.log('[NotificationProvider] Service not available for push registration');
//         return;
//       }

//       const token = await svc.registerForPushNotifications();
//       if (!token) {
//         console.log('[NotificationProvider] Could not get push token');
//         return;
//       }

//       console.log('[NotificationProvider] Got push token, registering with backend...');
//       const success = await svc.registerTokenWithBackend(token);
      
//       if (success) {
//         console.log('[NotificationProvider] ✅ Push token registered');
//       } else {
//         console.log('[NotificationProvider] ⚠️ Backend registration failed, but continuing');
//       }
//     } catch (error) {
//       console.error('[NotificationProvider] Push registration error:', error);
//       // Don't throw - app should continue working
//     }
//   };

//   // Setup notification listeners
//   const setupNotificationListeners = () => {
//     try {
//       const Notifications = notificationsModuleRef.current;
//       if (!Notifications) return;

//       notificationListener.current = Notifications.addNotificationReceivedListener(
//         handleNotificationReceived
//       );

//       responseListener.current = Notifications.addNotificationResponseReceivedListener(
//         handleNotificationResponse
//       );

//       console.log('[NotificationProvider] Listeners attached');
//     } catch (error) {
//       console.error('[NotificationProvider] Error setting up listeners:', error);
//     }
//   };

//   // Cleanup listeners
//   const cleanupListeners = () => {
//     try {
//       notificationListener.current?.remove();
//       responseListener.current?.remove();
//     } catch (error) {
//       console.error('[NotificationProvider] Error cleaning up listeners:', error);
//     }
//   };

//   // Load notifications from server
//   const loadNotifications = async () => {
//     try {
//       setIsLoading(true);
//       const svc = serviceRef.current;
//       if (!svc) {
//         console.log('[NotificationProvider] Service not available');
//         setIsLoading(false);
//         return;
//       }

//       const [notifs, count] = await Promise.all([
//         svc.getAllNotifications(),
//         svc.getUnreadCount(),
//       ]);
      
//       setNotifications(notifs || []);
//       setUnreadCount(count || 0);
      
//       console.log(`[NotificationProvider] Loaded ${notifs?.length || 0} notifications, ${count || 0} unread`);
//     } catch (error) {
//       console.error('[NotificationProvider] Error loading notifications:', error);
//       // Set empty arrays instead of crashing
//       setNotifications([]);
//       setUnreadCount(0);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Handle foreground notification
//   const handleNotificationReceived = async (notification: any) => {
//     try {
//       console.log('[NotificationProvider] Notification received:', notification?.request?.content?.title);
      
//       const newNotification: NotificationData = {
//         id: notification.request?.identifier || `local-${Date.now()}`,
//         type: notification.request?.content?.data?.type || 'SYSTEM',
//         title: notification.request?.content?.title || '',
//         body: notification.request?.content?.body || '',
//         data: notification.request?.content?.data || {},
//         isRead: false,
//         createdAt: new Date().toISOString(),
//         leadId: notification.request?.content?.data?.leadId,
//       };

//       setNotifications(prev => [newNotification, ...prev]);
//       setUnreadCount(prev => prev + 1);
//     } catch (error) {
//       console.error('[NotificationProvider] Error handling notification:', error);
//     }
//   };

//   // Handle notification tap
//   const handleNotificationResponse = (response: any) => {
//     try {
//       console.log('[NotificationProvider] Notification tapped');
      
//       const data = response?.notification?.request?.content?.data;
      
//       if (data?.type === 'NEW_LEAD' && data?.leadId) {
//         router.push(`/(app)/leads/${data.leadId}` as any);
//       } else if (data?.type === 'LEAD_CONSUMED') {
//         router.push('/(app)/dashboard/my-leads' as any);
//       } else if (data?.screen) {
//         router.push(data.screen as any);
//       } else {
//         router.push('/(app)/notification' as any);
//       }
//     } catch (error) {
//       console.error('[NotificationProvider] Error handling tap:', error);
//     }
//   };

//   // Handle app state changes
//   const handleAppStateChange = async (nextAppState: AppStateStatus) => {
//     try {
//       if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
//         console.log('[NotificationProvider] App foregrounded, refreshing');
//         if (isInitialized) {
//           await loadNotifications();
//         }
//       }
//       appState.current = nextAppState;
//     } catch (error) {
//       console.error('[NotificationProvider] Error handling app state:', error);
//     }
//   };

//   // Public methods
//   const refreshNotifications = async () => {
//     try {
//       if (!isInitialized) {
//         console.log('[NotificationProvider] Not initialized, skipping refresh');
//         return;
//       }
//       await loadNotifications();
//     } catch (error) {
//       console.error('[NotificationProvider] Refresh error:', error);
//     }
//   };

//   const markAsRead = async (notificationIds: string[]) => {
//     try {
//       // Optimistic update
//       setNotifications(prev =>
//         prev.map(notif =>
//           notificationIds.includes(notif.id) ? { ...notif, isRead: true } : notif
//         )
//       );
      
//       setUnreadCount(prev => Math.max(0, prev - notificationIds.length));

//       // Backend update
//       const svc = serviceRef.current;
//       if (svc) {
//         await svc.markAsRead(notificationIds);
//       }
//     } catch (error) {
//       console.error('[NotificationProvider] Mark as read error:', error);
//       await loadNotifications(); // Revert on error
//     }
//   };

//   const markAllAsRead = async () => {
//     try {
//       // Optimistic update
//       setNotifications(prev =>
//         prev.map(notif => ({ ...notif, isRead: true }))
//       );
      
//       setUnreadCount(0);

//       // Backend update
//       const svc = serviceRef.current;
//       if (svc) {
//         await svc.markAllAsRead();
//       }
//     } catch (error) {
//       console.error('[NotificationProvider] Mark all read error:', error);
//       await loadNotifications();
//     }
//   };

//   const deleteNotification = async (notificationId: string) => {
//     try {
//       const deletedNotif = notifications.find(n => n.id === notificationId);
      
//       // Optimistic update
//       setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
//       if (deletedNotif && !deletedNotif.isRead) {
//         setUnreadCount(prev => Math.max(0, prev - 1));
//       }

//       // Backend update
//       const svc = serviceRef.current;
//       if (svc) {
//         await svc.deleteNotification(notificationId);
//       }
//     } catch (error) {
//       console.error('[NotificationProvider] Delete error:', error);
//       await loadNotifications();
//       throw error;
//     }
//   };

//   const deleteAllNotifications = async () => {
//     try {
//       // Optimistic update
//       setNotifications([]);
//       setUnreadCount(0);

//       // Backend update
//       const svc = serviceRef.current;
//       if (svc) {
//         await svc.deleteAllNotifications();
        
//         if (Platform.OS !== 'web') {
//           await svc.clearAllDeliveredNotifications();
//         }
//       }
//     } catch (error) {
//       console.error('[NotificationProvider] Delete all error:', error);
//       await loadNotifications();
//       throw error;
//     }
//   };

//   return (
//     <NotificationContext.Provider
//       value={{
//         notifications,
//         unreadCount,
//         isLoading,
//         refreshNotifications,
//         markAsRead,
//         markAllAsRead,
//         deleteNotification,
//         deleteAllNotifications,
//         pushPermissionStatus,
//         requestPushPermission,
//       }}
//     >
//       {children}
//     </NotificationContext.Provider>
//   );
// };



// contexts/NotificationContext.tsx - FIXED VERSION
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
  pushPermissionStatus: 'granted' | 'denied' | 'undetermined' | 'unavailable';
  requestPushPermission: () => Promise<boolean>;
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
  const [pushPermissionStatus, setPushPermissionStatus] = useState<'granted' | 'denied' | 'undetermined' | 'unavailable'>('undetermined');
  
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const notificationsModuleRef = useRef<any>(null);
  const serviceRef = useRef<any>(null);
  const appState = useRef(AppState.currentState);
  const isInitializing = useRef(false);

  // ✅ Initialize on mount
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (isInitializing.current) return;
      isInitializing.current = true;

      try {
        console.log('[NotificationProvider] Starting initialization...');

        // ✅ Step 1: Wait for auth token
        const authToken = await waitForAuthToken();
        if (!mounted || !authToken) {
          console.log('[NotificationProvider] No auth token, skipping push setup');
          // Still load notifications from database
          await initializeInAppNotifications();
          return;
        }

        console.log('[NotificationProvider] ✅ Auth token found');

        // ✅ Step 2: Load notification service
        const svc = await import('../services/notificationService');
        if (!mounted) return;
        serviceRef.current = svc.notificationService;

        // ✅ Step 3: Initialize the service (creates Android channel, etc.)
        const initialized = await serviceRef.current.initialize();
        if (!mounted) return;

        if (!initialized) {
          console.log('[NotificationProvider] Push not available, using in-app only');
          setPushPermissionStatus('unavailable');
          await loadNotifications();
          return;
        }

        // ✅ Step 4: Load Expo Notifications module
        const Notifications = await import('expo-notifications');
        if (!mounted) return;
        notificationsModuleRef.current = Notifications;

        // ✅ Step 5: Check permission status
        await checkPushPermissionStatus();
        if (!mounted) return;

        // ✅ Step 6: Try to register for push (non-blocking)
        registerForPushNotifications().catch(err => {
          console.log('[NotificationProvider] Push registration failed:', err.message);
        });

        // ✅ Step 7: Load notifications from server
        await loadNotifications();
        if (!mounted) return;

        // ✅ Step 8: Setup listeners
        setupNotificationListeners();

        console.log('[NotificationProvider] ✅ Initialization complete');
      } catch (error) {
        console.error('[NotificationProvider] Initialization error:', error);
        await initializeInAppNotifications();
      } finally {
        isInitializing.current = false;
      }
    };

    initialize();

    // App state listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      mounted = false;
      cleanupListeners();
      subscription.remove();
    };
  }, []);

  /**
   * ✅ Wait for auth token with timeout
   */
  const waitForAuthToken = async (maxAttempts = 5): Promise<string | null> => {
    for (let i = 0; i < maxAttempts; i++) {
      const token = (await AsyncStorage.getItem('authToken')) || (await AsyncStorage.getItem('auth_token'));
      if (token) return token;
      
      console.log(`[NotificationProvider] Waiting for auth token (${i + 1}/${maxAttempts})...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return null;
  };

  /**
   * Initialize in-app notifications only
   */
  const initializeInAppNotifications = async () => {
    try {
      console.log('[NotificationProvider] Initializing in-app notifications');
      const svc = await import('../services/notificationService');
      serviceRef.current = svc.notificationService;
      await loadNotifications();
      console.log('[NotificationProvider] In-app notifications ready');
    } catch (error) {
      console.error('[NotificationProvider] In-app init error:', error);
    }
  };

  /**
   * Check push permission status
   */
  const checkPushPermissionStatus = async () => {
    try {
      if (Platform.OS === 'web') {
        setPushPermissionStatus('unavailable');
        return;
      }

      const Notifications = notificationsModuleRef.current;
      if (!Notifications) {
        setPushPermissionStatus('unavailable');
        return;
      }

      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') {
        setPushPermissionStatus('granted');
      } else if (status === 'denied') {
        setPushPermissionStatus('denied');
      } else {
        setPushPermissionStatus('undetermined');
      }
      
      console.log('[NotificationProvider] Permission status:', status);
    } catch (error) {
      console.error('[NotificationProvider] Error checking permissions:', error);
      setPushPermissionStatus('unavailable');
    }
  };

  /**
   * Request push permission
   */
  const requestPushPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') {
        console.log('[NotificationProvider] Web platform - no push needed');
        return false;
      }

      const Notifications = notificationsModuleRef.current;
      if (!Notifications) {
        console.log('[NotificationProvider] Notifications module not available');
        return false;
      }

      console.log('[NotificationProvider] Requesting push permission...');
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status === 'granted') {
        setPushPermissionStatus('granted');
        console.log('[NotificationProvider] Permission granted');
        
        // Try to register token
        await registerForPushNotifications();
        return true;
      } else {
        setPushPermissionStatus('denied');
        console.log('[NotificationProvider] Permission denied');
        return false;
      }
    } catch (error) {
      console.error('[NotificationProvider] Error requesting permission:', error);
      setPushPermissionStatus('unavailable');
      return false;
    }
  };

  /**
   * ✅ Register for push notifications with better error handling
   */
  const registerForPushNotifications = async () => {
    try {
      const svc = serviceRef.current;
      if (!svc) {
        console.log('[NotificationProvider] Service not available');
        return;
      }

      console.log('[NotificationProvider] Getting push token...');
      const token = await svc.registerForPushNotifications();
      
      if (!token) {
        console.log('[NotificationProvider] Could not get push token');
        
        // Show diagnostics
        const diagnostics = await svc.getDiagnostics();
        console.log('[NotificationProvider] Diagnostics:', diagnostics);
        return;
      }

      console.log('[NotificationProvider] ✅ Got push token');

      // Register with backend (with retry)
      console.log('[NotificationProvider] Registering with backend...');
      const success = await svc.registerTokenWithBackend(token);
      
      if (success) {
        console.log('[NotificationProvider] ✅ Backend registration successful');
      } else {
        console.log('[NotificationProvider] ⚠️ Backend registration failed');
      }
    } catch (error: any) {
      console.error('[NotificationProvider] Push registration error:', error.message);
    }
  };

  /**
   * Setup notification listeners
   */
  const setupNotificationListeners = () => {
    try {
      const Notifications = notificationsModuleRef.current;
      if (!Notifications) return;

      notificationListener.current = Notifications.addNotificationReceivedListener(
        handleNotificationReceived
      );

      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse
      );

      console.log('[NotificationProvider] ✅ Listeners attached');
    } catch (error) {
      console.error('[NotificationProvider] Error setting up listeners:', error);
    }
  };

  /**
   * Cleanup listeners
   */
  const cleanupListeners = () => {
    try {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    } catch (error) {
      console.error('[NotificationProvider] Error cleaning up listeners:', error);
    }
  };

  /**
   * Load notifications from server
   */
  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const svc = serviceRef.current;
      if (!svc) {
        console.log('[NotificationProvider] Service not available');
        setIsLoading(false);
        return;
      }

      const [notifs, count] = await Promise.all([
        svc.getAllNotifications(),
        svc.getUnreadCount(),
      ]);
      
      setNotifications(notifs || []);
      setUnreadCount(count || 0);
      
      console.log(`[NotificationProvider] Loaded ${notifs?.length || 0} notifications, ${count || 0} unread`);
    } catch (error) {
      console.error('[NotificationProvider] Error loading notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle foreground notification
   */
  const handleNotificationReceived = async (notification: any) => {
    try {
      console.log('[NotificationProvider] Notification received:', notification?.request?.content?.title);
      
      const newNotification: NotificationData = {
        id: notification.request?.identifier || `local-${Date.now()}`,
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
    } catch (error) {
      console.error('[NotificationProvider] Error handling notification:', error);
    }
  };

  /**
   * Handle notification tap
   */
  const handleNotificationResponse = (response: any) => {
    try {
      console.log('[NotificationProvider] Notification tapped');
      
      const data = response?.notification?.request?.content?.data;
      
      if (data?.type === 'NEW_LEAD' && data?.leadId) {
        router.push(`/(app)/posts/${data.leadId}` as any);
      } else if (data?.type === 'LEAD_CONSUMED') {
        router.push('/(app)/dashboard/my-leads' as any);
      } else if (data?.screen) {
        router.push(data.screen as any);
      } else {
        router.push('/(app)/notification' as any);
      }
    } catch (error) {
      console.error('[NotificationProvider] Error handling tap:', error);
    }
  };

  /**
   * Handle app state changes
   */
  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    try {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[NotificationProvider] App foregrounded, refreshing');
        await loadNotifications();
      }
      appState.current = nextAppState;
    } catch (error) {
      console.error('[NotificationProvider] Error handling app state:', error);
    }
  };

  // Public methods
  const refreshNotifications = async () => {
    try {
      await loadNotifications();
    } catch (error) {
      console.error('[NotificationProvider] Refresh error:', error);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      setNotifications(prev =>
        prev.map(notif =>
          notificationIds.includes(notif.id) ? { ...notif, isRead: true } : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));

      const svc = serviceRef.current;
      if (svc) {
        await svc.markAsRead(notificationIds);
      }
    } catch (error) {
      console.error('[NotificationProvider] Mark as read error:', error);
      await loadNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      
      setUnreadCount(0);

      const svc = serviceRef.current;
      if (svc) {
        await svc.markAllAsRead();
      }
    } catch (error) {
      console.error('[NotificationProvider] Mark all read error:', error);
      await loadNotifications();
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const deletedNotif = notifications.find(n => n.id === notificationId);
      
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      if (deletedNotif && !deletedNotif.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      const svc = serviceRef.current;
      if (svc) {
        await svc.deleteNotification(notificationId);
      }
    } catch (error) {
      console.error('[NotificationProvider] Delete error:', error);
      await loadNotifications();
      throw error;
    }
  };

  const deleteAllNotifications = async () => {
    try {
      setNotifications([]);
      setUnreadCount(0);

      const svc = serviceRef.current;
      if (svc) {
        await svc.deleteAllNotifications();
        
        if (Platform.OS !== 'web') {
          await svc.clearAllDeliveredNotifications();
        }
      }
    } catch (error) {
      console.error('[NotificationProvider] Delete all error:', error);
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
        pushPermissionStatus,
        requestPushPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};