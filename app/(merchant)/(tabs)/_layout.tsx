import { Tabs, useRouter } from 'expo-router';
import { View, Pressable, Platform, useWindowDimensions } from 'react-native';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  QrCode,
  MessageSquare,
  Settings,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';

import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useOrders } from '@/src/hooks/useOrders';
import { useAuthStore } from '@/src/stores/auth';
import { useConversations } from '@/src/hooks/useMessages';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { Text } from '@/src/components/ui/Text';
import { getScale, getFontScale } from '@/src/lib/responsive';

const ACTIONABLE_STATUSES = new Set(['pending', 'confirmed', 'preparing', 'ready']);

function MerchantTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const colors = useThemeColor();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { width, fontScale } = useWindowDimensions();
  const scale = getScale(width);
  const fontScaleFactor = getFontScale(width, fontScale);

  const leftRoutes = state.routes.slice(0, 2); // Dashboard (0), Orders (1)
  // Right side: Inventory, Messages, and Settings
  const rightRoutes = state.routes.filter(
    (r) => r.name === 'inventory' || r.name === 'messages' || r.name === 'settings'
  );

  const tabBarHeight = Math.round(70 * scale) + insets.bottom;
  const iconSize = Math.round(24 * scale);
  const fabSize = Math.round(60 * scale);
  const badgeSize = Math.round(18 * scale);

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
          {options.tabBarIcon?.({ focused: isFocused, color, size: iconSize })}
          {badge !== undefined && badge !== null && (
            <View
              style={{
                position: 'absolute',
                top: -4,
                right: -8,
                backgroundColor: colors.danger,
                borderRadius: badgeSize / 2,
                minWidth: badgeSize,
                height: badgeSize,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 3,
              }}
            >
              <Text
                variant="caption"
                style={{
                  color: colors.white,
                  fontSize: Math.round(11 * fontScaleFactor),
                  fontWeight: '700',
                  lineHeight: Math.round(14 * fontScaleFactor),
                }}
              >
                {String(badge)}
              </Text>
            </View>
          )}
        </View>
        <Text variant="caption" style={{ color, marginTop: 2 }} numberOfLines={1}>
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
        height: tabBarHeight,
        paddingBottom: insets.bottom,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.background,
        alignItems: 'center',
      }}
    >
      {leftRoutes.map((route) => renderTab(route, state.routes.indexOf(route)))}

      {/* QR FAB — not a real tab, floating above the bar */}
      <View style={{ width: fabSize + 10, alignItems: 'center', justifyContent: 'center' }}>
        <PressableScale
          onPress={handleQRPress}
          scale={0.92}
          style={{
            width: fabSize,
            height: fabSize,
            borderRadius: fabSize / 2,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: -Math.round(20 * scale),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <QrCode size={Math.round(28 * scale)} color={colors.white} />
        </PressableScale>
      </View>

      {rightRoutes.map((route) => renderTab(route, state.routes.indexOf(route)))}
    </View>
  );
}

export default function MerchantTabsLayout() {
  const colors = useThemeColor();
  const { t } = useTranslation();
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
          title: t('common.dashboard'),
          tabBarButtonTestID: 'merchant-dashboard-tab',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t('common.orders'),
          tabBarButtonTestID: 'merchant-orders-tab',
          tabBarIcon: ({ color, size }) => <ShoppingBag size={size} color={color} />,
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: { fontSize: 11, minWidth: 18, height: 18 },
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: t('common.inventory'),
          tabBarButtonTestID: 'merchant-inventory-tab',
          tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('common.messages'),
          tabBarButtonTestID: 'merchant-messages-tab',
          tabBarIcon: ({ color, size }) => <MessageSquare size={size} color={color} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { fontSize: 11, minWidth: 18, height: 18 },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('common.settings'),
          tabBarButtonTestID: 'merchant-settings-tab',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
