// app/(app)/chat/_layout.tsx

import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function ChatLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Chats',
          }} 
        />
        <Stack.Screen 
          name="[companyId]" 
          options={{ 
            title: 'Chat',
          }} 
        />
      </Stack>
    </View>
  );
}