import { Stack } from 'expo-router';
import { View } from 'react-native';
import { Home, Search, MapPin, ShoppingBag, Wallet, User } from 'lucide-react-native';

import { BottomTabBar } from '@/src/components/navigation/BottomTabBar';
import type { TabItem } from '@/src/components/navigation/BottomTabBar';

const tabs: TabItem[] = [
  { name: '/', label: 'Home', icon: Home },
  { name: '/discover', label: 'Discover', icon: Search },
  { name: '/map', label: 'Map', icon: MapPin },
  { name: '/orders', label: 'Orders', icon: ShoppingBag },
  { name: '/wallet', label: 'Wallet', icon: Wallet },
  { name: '/profile', label: 'Profile', icon: User },
];

export default function CustomerTabsWebLayout() {
  return (
    <View className="flex-1">
      <View className="flex-1">
        <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="discover" />
          <Stack.Screen name="map" />
          <Stack.Screen name="orders" />
          <Stack.Screen name="wallet" />
          <Stack.Screen name="profile" />
        </Stack>
      </View>
      <BottomTabBar tabs={tabs} />
    </View>
  );
}
