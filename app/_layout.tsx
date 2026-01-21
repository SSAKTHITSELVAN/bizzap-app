// app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useAuth();
  const navigationAttempted = useRef(false);

  // Enhanced deep link handling
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      console.log('Deep link received:', url);
      
      try {
        // Parse the URL to extract parameters
        const urlObj = new URL(url);
        
        // Handle different URL patterns
        // 1. https://bizzap.app/dashboard?leadId=xxx
        // 2. https://bizzap.app?leadId=xxx
        // 3. bizzap://dashboard?leadId=xxx
        
        const leadId = urlObj.searchParams.get('leadId');
        const pathname = urlObj.pathname;
        
        if (!isLoading) {
          if (leadId) {
            // Lead-specific deep link
            if (isAuthenticated) {
              router.push({
                pathname: '/(app)/dashboard',
                params: { leadId }
              });
            } else {
              // Store the deep link for after authentication
              await AsyncStorage.setItem('pendingDeepLink', JSON.stringify({ leadId }));
              router.push('/(auth)/phone-entry');
            }
          } else if (pathname.includes('/dashboard')) {
            // General dashboard link
            if (isAuthenticated) {
              router.push('/(app)/dashboard');
            } else {
              router.push('/(auth)/phone-entry');
            }
          } else {
            // Root link - go to appropriate home screen
            if (isAuthenticated) {
              router.push('/(app)/dashboard');
            } else {
              router.push('/(auth)/phone-entry');
            }
          }
        }
      } catch (error) {
        console.error('Error parsing deep link:', error);
        // Fallback: just navigate to appropriate home screen
        if (!isLoading) {
          if (isAuthenticated) {
            router.push('/(app)/dashboard');
          } else {
            router.push('/(auth)/phone-entry');
          }
        }
      }
    };

    // Handle initial URL when app is opened from a link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial URL:', url);
        handleDeepLink({ url });
      }
    });

    // Handle URLs when app is already open
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, isLoading]);

  // Check for pending deep links after authentication
  useEffect(() => {
    const checkPendingDeepLink = async () => {
      if (isAuthenticated && !isLoading) {
        try {
          const pendingLink = await AsyncStorage.getItem('pendingDeepLink');
          if (pendingLink) {
            const { leadId } = JSON.parse(pendingLink);
            await AsyncStorage.removeItem('pendingDeepLink');
            
            // Small delay to ensure navigation is ready
            setTimeout(() => {
              router.push({
                pathname: '/(app)/dashboard',
                params: { leadId }
              });
            }, 500);
          }
        } catch (error) {
          console.error('Error checking pending deep link:', error);
        }
      }
    };

    checkPendingDeepLink();
  }, [isAuthenticated, isLoading]);

  // Auth-based navigation with gesture support
  useEffect(() => {
    if (isLoading) {
      navigationAttempted.current = false;
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';
    const isIndexRoute = segments.length === 0 || segments[0] === 'index';

    if (navigationAttempted.current && !isIndexRoute) {
      return;
    }

    if (!isAuthenticated) {
      if (inAppGroup) {
        console.log('Redirecting to phone-entry screen after logout');
        navigationAttempted.current = true;
        router.replace('/(auth)/phone-entry');
      } else if (isIndexRoute) {
        navigationAttempted.current = true;
        router.replace('/(auth)/phone-entry');
      }
    } else {
      if (inAuthGroup) {
        console.log('Redirecting to dashboard after login');
        navigationAttempted.current = true;
        router.replace('/(app)/dashboard');
      } else if (isIndexRoute) {
        navigationAttempted.current = true;
        router.replace('/(app)/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'default',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="(auth)" 
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="(app)" 
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="modal" 
        options={{ 
          presentation: 'modal',
          gestureEnabled: true,
        }} 
      />
    </Stack>
  );
}

function AuthenticatedRoot() {
  const { isAuthenticated, isLoading } = useAuth();

  const notificationProvider = useMemo(() => {
    if (isLoading) {
      return <RootLayoutNav />;
    }
    if (isAuthenticated) {
      return <NotificationProvider><RootLayoutNav /></NotificationProvider>;
    }
    return <RootLayoutNav />;
  }, [isLoading, isAuthenticated]);

  return notificationProvider;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthenticatedRoot />
    </AuthProvider>
  );
}