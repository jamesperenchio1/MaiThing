import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useAuthStore } from '../../src/stores/auth';
import { Redirect } from 'expo-router';
import { Text } from 'react-native';
import { registerForPushNotifications, addPushTokenListener } from '../../src/lib/notifications';

export default function BuyerLayout() {
  const { t } = useTranslation();
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
        tabBarActiveTintColor: '#16a34a',
        tabBarStyle: { paddingBottom: 4 },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: t('discover.title'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🗺️</Text>,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t('order.myOrders'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🛍️</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile.title'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
