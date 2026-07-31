import { Tabs, useRouter } from 'expo-router';
import { View, Pressable, Platform } from 'react-native';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  QrCode,
  MessageSquare,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';

import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useOrders } from '@/src/hooks/useOrders';
import { useAuthStore } from '@/src/stores/auth';
import { useConversations } from '@/src/hooks/useMessages';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { Text } from '@/src/components/ui/Text';

const ACTIONABLE_STATUSES = new Set(['pending', 'confirmed', 'preparing', 'ready']);

function MerchantTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const colors = useThemeColor();
  const insets = useSafeAreaInsets();

  const leftRoutes = state.routes.slice(0, 2); // Dashboard (0), Orders (1)
  // Right side: Inventory + Messages; Settings is hidden from tab bar but remains a valid route
  const rightRoutes = state.routes.filter(
    (r) => r.name === 'inventory' || r.name === 'messages'
  );

  const renderTab = (route: (typeof state.routes)[number], routeIndex: number) => {
    const descriptor = descriptors[route.key];
    const isFocused = state.index === routeIndex;
    const { options } = descriptor;
    const color = isFocused ? colors.primary : colors.muted;
    const badge = options.tabBarBadge;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    const onLongPress = () => {
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });
    };

    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        testID={options.tabBarButtonTestID}
        onPress={onPress}
        onLongPress={onLongPress}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 8 }}
        android_ripple={{ color: colors.primary + '20', borderless: false }}
      >
        <View style={{ position: 'relative' }}>
          {options.tabBarIcon?.({ focused: isFocused, color, size: 24 })}
          {badge !== undefined && badge !== null && (
            <View
              style={{
                position: 'absolute',
                top: -4,
                right: -8,
                backgroundColor: colors.danger,
                borderRadius: 9,
                minWidth: 18,
                height: 18,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 3,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', lineHeight: 14 }}>
                {String(badge)}
              </Text>
            </View>
          )}
        </View>
        <Text
          variant="caption"
          style={{ color, marginTop: 2 }}
          numberOfLines={1}
        >
          {String(options.title ?? route.name)}
        </Text>
      </Pressable>
    );
  };

  const handleQRPress = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.push('/(merchant)/scanner');
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        height: 70 + insets.bottom,
        paddingBottom: insets.bottom,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.background,
        alignItems: 'center',
      }}
    >
      {leftRoutes.map((route) => renderTab(route, state.routes.indexOf(route)))}

      {/* QR FAB — not a real tab, floating above the bar */}
      <View style={{ width: 70, alignItems: 'center', justifyContent: 'center' }}>
        <PressableScale
          onPress={handleQRPress}
          scale={0.92}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: -20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <QrCode size={28} color="#fff" />
        </PressableScale>
      </View>

      {rightRoutes.map((route) => renderTab(route, state.routes.indexOf(route)))}
    </View>
  );
}

export default function MerchantTabsLayout() {
  const colors = useThemeColor();
  const user = useAuthStore((s) => s.user);
  const { data: orders } = useOrders(user?.id ?? '', 'merchant');
  const pendingCount = orders?.filter((o) => ACTIONABLE_STATUSES.has(o.status)).length ?? 0;

  const { data: conversations } = useConversations(user?.id ?? '');
  const unreadCount =
    conversations?.filter((c) => !c.read && c.sentBy === 'customer').length ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // tabBarStyle unused when custom tabBar is provided; kept for safety
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}
      tabBar={(props) => <MerchantTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarButtonTestID: 'merchant-dashboard-tab',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarButtonTestID: 'merchant-orders-tab',
          tabBarIcon: ({ color, size }) => <ShoppingBag size={size} color={color} />,
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: { fontSize: 11, minWidth: 18, height: 18 },
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarButtonTestID: 'merchant-inventory-tab',
          tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarButtonTestID: 'merchant-messages-tab',
          tabBarIcon: ({ color, size }) => <MessageSquare size={size} color={color} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { fontSize: 11, minWidth: 18, height: 18 },
        }}
      />
      {/* Settings is no longer shown in the tab bar — accessible via the merchant identity card on the Dashboard */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}
