// app/(app)/posts/_layout.tsx

import { Stack } from 'expo-router';

// Simple stack layout - header is managed by individual screen components
export default function PostsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}