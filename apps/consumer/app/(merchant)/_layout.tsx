import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth';
import { useProfile } from '../../src/hooks/useProfile';

export default function MerchantLayout() {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const { data: profile, isLoading } = useProfile();

  if (!session) return <Redirect href="/(auth)/sign-in" />;
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }
  if (profile?.role !== 'merchant') return <Redirect href="/(buyer)/discover" />;
  if (!profile?.merchant_org) return <Redirect href="/(merchant)/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#16a34a',
        tabBarStyle: { paddingBottom: 4 },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('merchant.dashboard'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="today"
        options={{
          title: t('merchant.today'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📅</Text>,
        }}
      />
      <Tabs.Screen
        name="listings/index"
        options={{
          title: t('merchant.listings'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🍱</Text>,
        }}
      />
      <Tabs.Screen
        name="locations/index"
        options={{
          title: t('merchant.locations'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📍</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('merchant.settings'),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⚙️</Text>,
        }}
      />
    </Tabs>
  );
}
