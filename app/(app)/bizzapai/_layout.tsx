// app/(app)/bizzapai/_layout.tsx
import { Stack } from 'expo-router';

export default function BizzapAILayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: '#020618' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}