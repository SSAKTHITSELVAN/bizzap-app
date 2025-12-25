// app/(app)/notification/_layout.tsx
import { Stack } from 'expo-router';

export default function NotificationLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}