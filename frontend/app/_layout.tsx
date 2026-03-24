import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0a0e27' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="message-detection" />
        <Stack.Screen name="voice-detection" />
        <Stack.Screen name="history" />
        <Stack.Screen name="result" />
      </Stack>
    </>
  );
}
