import { Tabs } from 'expo-router';
import { LayoutDashboard, ShoppingBag, Package, Settings } from 'lucide-react-native';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useOrders } from '@/src/hooks/useOrders';
import { useAuthStore } from '@/src/stores/auth';

const ACTIONABLE_STATUSES = new Set(['pending', 'confirmed', 'preparing', 'ready']);

export default function MerchantTabsLayout() {
  const colors = useThemeColor();
  const user = useAuthStore((s) => s.user);
  const { data: orders } = useOrders(user?.id ?? '', 'merchant');
  const pendingCount = orders?.filter((o) => ACTIONABLE_STATUSES.has(o.status)).length ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
        },
      }}
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
        name="settings"
        options={{
          title: 'Settings',
          tabBarButtonTestID: 'merchant-settings-tab',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
