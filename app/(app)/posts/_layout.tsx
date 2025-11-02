// app/(app)/posts/_layout.tsx

import { Stack } from 'expo-router';

// Simple stack layout without header - header will be managed in index.tsx
export default function PostsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}