// app/index.tsx

import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const navigationState = useRootNavigationState();
  const hasNavigated = useRef(false);

  useEffect(() => {
    // Wait for navigation to be ready and auth check to complete
    if (!navigationState?.key || isLoading || hasNavigated.current) {
      return;
    }

    // Mark as navigated to prevent multiple navigation attempts
    hasNavigated.current = true;

    // Small delay to ensure navigation state is stable
    const timeoutId = setTimeout(() => {
      if (isAuthenticated) {
        router.replace('/(app)/dashboard');
      } else {
        router.replace('/(auth)/phone-entry');
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, isLoading, navigationState?.key]);

  // Show loading while checking auth or waiting for navigation
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4C1D95" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
});