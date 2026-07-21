import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Redirect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuthStore } from '../../src/stores/auth';
import { useProfile } from '../../src/hooks/useProfile';
import { useTheme } from '../../src/theme';
import { LoadingState } from '../../src/components/ui';
import { getIcon } from '../../src/icons';

export default function MerchantLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const session = useAuthStore((s) => s.session);
  const { data: profile, isLoading } = useProfile();

  if (!session) return <Redirect href="/(auth)/sign-in" />;
  if (isLoading) return <LoadingState />;
  if (profile?.role !== 'merchant') return <Redirect href="/(buyer)/discover" />;
  if (!profile?.merchant_org) return <Redirect href="/(merchant)/onboarding" />;

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
        name="dashboard"
        options={{
          title: t('merchant.dashboard'),
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={getIcon(focused ? 'dashboardFilled' : 'dashboard')}
              color={color}
              size={size ?? 24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="today"
        options={{
          title: t('merchant.today'),
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={getIcon(focused ? 'todayFilled' : 'today')}
              color={color}
              size={size ?? 24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="listings/index"
        options={{
          title: t('merchant.listings'),
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={getIcon(focused ? 'listingsFilled' : 'listings')}
              color={color}
              size={size ?? 24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="locations/index"
        options={{
          title: t('merchant.locations'),
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={getIcon(focused ? 'locationsFilled' : 'locations')}
              color={color}
              size={size ?? 24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('merchant.settings'),
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={getIcon(focused ? 'settingsFilled' : 'settings')}
              color={color}
              size={size ?? 24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
