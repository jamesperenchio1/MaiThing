import { Stack } from 'expo-router';

export default function CustomerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="listing/[id]" />
      <Stack.Screen name="merchant/[id]" />
      <Stack.Screen name="order/[id]" />
      <Stack.Screen name="notifications/index" />
    </Stack>
  );
}
