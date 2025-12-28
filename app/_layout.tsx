// app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
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
      router.replace('/(auth)/phone-entry');
    } else if (isAuthenticated && inAuthGroup) {
      // Logged in but in auth flow, redirect to app
      router.replace('/(app)/dashboard');
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

export default function RootLayout() {
  return (
    <AuthProvider>
      <ConditionalNotificationProvider>
        <RootLayoutNav />
      </ConditionalNotificationProvider>
    </AuthProvider>
  );
}

// Wrapper component that only renders NotificationProvider when authenticated
function ConditionalNotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Don't render NotificationProvider until auth check is complete
  if (isLoading) {
    return <>{children}</>;
  }

  // Only wrap with NotificationProvider if user is authenticated
  if (isAuthenticated) {
    return <NotificationProvider>{children}</NotificationProvider>;
  }

  // For unauthenticated users, render children without NotificationProvider
  return <>{children}</>;
}