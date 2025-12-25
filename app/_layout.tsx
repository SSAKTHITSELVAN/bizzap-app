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
      
      // Parse the URL
      // Format: bizzap://dashboard?leadId={leadId} or https://bizzap.app/dashboard?leadId={leadId}
      const leadMatch = url.match(/[?&]leadId=([a-zA-Z0-9-]+)/);
      
      if (leadMatch && leadMatch[1]) {
        const leadId = leadMatch[1];
        
        // Check if user is authenticated
        if (!isLoading) {
          if (isAuthenticated) {
            // User is logged in - navigate to dashboard with leadId param
            router.push({
              pathname: '/(app)/dashboard',
              params: { leadId }
            });
          } else {
            // User not logged in - navigate to auth flow
            router.push('/(auth)/phone-entry');
          }
        }
      }
    };

    // Get initial URL (app opened via link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Listen for incoming links (app already open)
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
      <NotificationProvider>
        <RootLayoutNav />
      </NotificationProvider>
    </AuthProvider>
  );
}