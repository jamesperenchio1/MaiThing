import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuthStore } from '../../src/stores/auth';
import { Redirect } from 'expo-router';
import { registerForPushNotifications, addPushTokenListener } from '../../src/lib/notifications';
import { useTheme } from '../../src/theme';

export default function BuyerLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const session = useAuthStore((s) => s.session);

  useEffect(() => {
    if (!session) return;
    void registerForPushNotifications();
    const subscription = addPushTokenListener();
    return () => {
      if (subscription) subscription.remove();
    };
  }, [session]);

  if (!session) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          paddingBottom: 4,
          backgroundColor: colors.surfaceElevated,
          borderTopColor: colors.border,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: t('discover.title'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" color={color} size={size ?? 24} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t('order.myOrders'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bag-outline" color={color} size={size ?? 24} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile.title'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size ?? 24} />
          ),
        }}
      />
    </Tabs>
  );
}
