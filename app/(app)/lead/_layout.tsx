// app/(app)/lead/_layout.tsx

import { Stack } from 'expo-router';

export default function LeadLayout() {
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