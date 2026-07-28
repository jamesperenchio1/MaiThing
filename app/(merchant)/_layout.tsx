import { Stack } from 'expo-router';

export default function MerchantLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="listings/new" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="business-profile" />
      <Stack.Screen name="store-hours" />
      <Stack.Screen name="pickup-management" />
    </Stack>
  );
}
