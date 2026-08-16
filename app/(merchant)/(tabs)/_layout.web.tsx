import { Stack, useRouter } from 'expo-router';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  MessageSquare,
  QrCode,
} from 'lucide-react-native';

import { BottomTabBar } from '@/src/components/navigation/BottomTabBar';
import type { TabItem } from '@/src/components/navigation/BottomTabBar';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useThemeColor } from '@/src/hooks/useThemeColor';

const tabs: TabItem[] = [
  { name: '/', label: 'Dashboard', icon: LayoutDashboard },
  { name: '/orders', label: 'Orders', icon: ClipboardList },
  { name: '/inventory', label: 'Inventory', icon: Package },
  { name: '/messages', label: 'Messages', icon: MessageSquare },
];

export default function MerchantTabsWebLayout() {
  const router = useRouter();
  const colors = useThemeColor();

  const handleQRPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(merchant)/scanner');
  };

  return (
    <View className="flex-1">
      <View className="flex-1">
        <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="orders" />
          <Stack.Screen name="inventory" />
          <Stack.Screen name="messages" />
        </Stack>
      </View>

      {/* Existing tab bar (absolute bottom-0) */}
      <BottomTabBar tabs={tabs} />

      {/* QR FAB — centered above the tab bar, elevated with negative bottom offset */}
      <View
        style={{
          position: 'absolute',
          bottom: 24,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
        pointerEvents="box-none"
      >
        <PressableScale
          onPress={handleQRPress}
          scale={0.92}
          // eslint-disable-next-line react-native/no-color-literals -- shadow is deliberately black in both themes
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <QrCode size={28} color={colors.white} />
        </PressableScale>
      </View>
    </View>
  );
}
