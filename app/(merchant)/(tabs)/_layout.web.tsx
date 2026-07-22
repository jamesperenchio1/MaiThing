import { Stack } from 'expo-router';
import { View } from 'react-native';
import { LayoutDashboard, ClipboardList, Package, Settings } from 'lucide-react-native';

import { BottomTabBar } from '@/src/components/navigation/BottomTabBar';
import type { TabItem } from '@/src/components/navigation/BottomTabBar';

const tabs: TabItem[] = [
  { name: '/', label: 'Dashboard', icon: LayoutDashboard },
  { name: '/orders', label: 'Orders', icon: ClipboardList },
  { name: '/inventory', label: 'Inventory', icon: Package },
  { name: '/settings', label: 'Settings', icon: Settings },
];

export default function MerchantTabsWebLayout() {
  return (
    <View className="flex-1">
      <View className="flex-1">
        <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="orders" />
          <Stack.Screen name="inventory" />
          <Stack.Screen name="settings" />
        </Stack>
      </View>
      <BottomTabBar tabs={tabs} />
    </View>
  );
}
