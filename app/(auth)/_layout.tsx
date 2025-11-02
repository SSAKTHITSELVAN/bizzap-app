// app/(auth)/_layout.tsx

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="phone-entry" 
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="otp-verification"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="gst-entry"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="complete-profile"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}