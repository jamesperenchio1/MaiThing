import { Stack } from 'expo-router';

export default function MerchantLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="listings/new" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="business-profile" />
      <Stack.Screen name="store-hours" />
      <Stack.Screen name="pickup-management" />
      <Stack.Screen name="scanner" />
      <Stack.Screen name="order/[id]" />
      <Stack.Screen name="payouts/index" />
      <Stack.Screen name="payouts/bank-account" />
      <Stack.Screen name="staff" />
      <Stack.Screen name="promotions" />
      <Stack.Screen name="messages/index" />
      <Stack.Screen name="messages/[customerId]" />
      <Stack.Screen name="reviews" />
    </Stack>
  );
}
