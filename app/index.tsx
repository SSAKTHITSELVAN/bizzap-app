// ==========================================
// FILE 1: app/index.tsx
// ==========================================

import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return; // Wait for auth check to complete

    if (isAuthenticated) {
      // User is authenticated, go to dashboard (inside app tabs)
      router.replace('/(app)/dashboard');
    } else {
      // User is not authenticated, go to phone entry
      router.replace('/(auth)/phone-entry');
    }
  }, [isAuthenticated, isLoading]);

  // Show loading while checking auth
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
