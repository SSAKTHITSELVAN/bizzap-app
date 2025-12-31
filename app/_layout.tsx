// app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Linking } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useAuth();

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

  // Auth-based navigation
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Not logged in, redirect to auth
      if (segments[0] !== '(auth)') {
        console.log('Redirecting to phone-entry screen after logout');
        router.replace('/(auth)/phone-entry');
      }
    } else if (isAuthenticated && inAuthGroup) {
      // Logged in but in auth flow, redirect to app
      if (segments[0] !== '(app)') {
        console.log('Redirecting to dashboard after login');
        router.replace('/(app)/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
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