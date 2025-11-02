// ============================================
// FILE 1: app/(app)/profile/_layout.tsx
// ============================================

import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="accounts-center" />
      <Stack.Screen name="my_leads" />
      <Stack.Screen name="saved" />
      <Stack.Screen name="payment_history" />
    </Stack>
  );
}

