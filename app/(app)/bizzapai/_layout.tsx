// app/(app)/bizzapai/_layout.tsx

import { Stack } from 'expo-router';

export default function BizzapAILayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="create-post" />
        </Stack>
    );
}