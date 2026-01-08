// app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Linking } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useAuth();
  const navigationAttempted = useRef(false);

  // Handle deep links
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      console.log('Deep link received:', url);
      
      const leadMatch = url.match(/[?&]leadId=([a-zA-Z0-9-]+)/);
      
      if (leadMatch && leadMatch[1]) {
        const leadId = leadMatch[1];
        
        if (!isLoading) {
          if (isAuthenticated) {
            router.push({
              pathname: '/(app)/dashboard',
              params: { leadId }
            });
          } else {
            router.push('/(auth)/phone-entry');
          }
        }
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
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

    // Prevent navigation loops by checking if we've already attempted navigation
    if (navigationAttempted.current && !isIndexRoute) {
      return;
    }

    if (!isAuthenticated) {
      // User is not authenticated
      if (inAppGroup) {
        // Only redirect if in app group, allow gesture back to auth
        console.log('Redirecting to phone-entry screen after logout');
        navigationAttempted.current = true;
        router.replace('/(auth)/phone-entry');
      } else if (isIndexRoute) {
        // Handle index route
        navigationAttempted.current = true;
        router.replace('/(auth)/phone-entry');
      }
      // If already in auth group, do nothing (allow free navigation within auth)
    } else {
      // User is authenticated
      if (inAuthGroup) {
        // Only redirect if in auth group, allow gesture navigation in app
        console.log('Redirecting to dashboard after login');
        navigationAttempted.current = true;
        router.replace('/(app)/dashboard');
      } else if (isIndexRoute) {
        // Handle index route
        navigationAttempted.current = true;
        router.replace('/(app)/dashboard');
      }
      // If already in app group, do nothing (allow free navigation within app)
    }
  }, [isAuthenticated, isLoading, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true, // Enable gestures
        animation: 'default', // Use default animation for gestures
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="(auth)" 
        options={{
          gestureEnabled: false, // Disable gesture back from auth
        }}
      />
      <Stack.Screen 
        name="(app)" 
        options={{
          gestureEnabled: true, // Enable gestures in app
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

// Wrapper component that uses useAuth and conditionally renders NotificationProvider
function AuthenticatedRoot() {
  const { isAuthenticated, isLoading } = useAuth();

  // Only create NotificationProvider once when authenticated, don't remount it
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