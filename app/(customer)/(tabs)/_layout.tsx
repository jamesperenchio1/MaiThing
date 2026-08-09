import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Home, Search, MapPin, ShoppingBag, Wallet, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { TutorialOverlay } from '@/src/components/tutorial/TutorialOverlay';
import { useTutorialStore } from '@/src/stores/tutorial';
import { usePersonalityStore } from '@/src/stores/personality';
import { getScale } from '@/src/lib/responsive';

export default function CustomerTabsLayout() {
  const router = useRouter();
  const colors = useThemeColor();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const scale = getScale(width);
  const { hasSeenTutorial, isActive, startTutorial } = useTutorialStore();
  const { onboardingCompleted } = usePersonalityStore();

  useEffect(() => {
    if (!onboardingCompleted) {
      router.replace('/personality-onboarding' as never);
      return;
    }

    if (!hasSeenTutorial && !isActive) {
      const timer = setTimeout(startTutorial, 600);
      return () => clearTimeout(timer);
    }
  }, [onboardingCompleted, hasSeenTutorial, isActive, router, startTutorial]);

  const tabBarHeight = Math.round(72 * scale) + insets.bottom;
  const iconSize = Math.round(24 * scale);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            height: tabBarHeight,
            paddingTop: Math.round(10 * scale),
            paddingBottom: insets.bottom + Math.round(6 * scale),
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('common.home'),
            tabBarButtonTestID: 'home-tab',
            tabBarIcon: ({ color }) => <Home size={iconSize} color={color} />,
          }}
        />
        <Tabs.Screen
          name="discover"
          options={{
            title: t('common.discover'),
            tabBarButtonTestID: 'discover-tab',
            tabBarIcon: ({ color }) => <Search size={iconSize} color={color} />,
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: t('common.map'),
            tabBarButtonTestID: 'map-tab',
            tabBarIcon: ({ color }) => <MapPin size={iconSize} color={color} />,
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: t('common.orders'),
            tabBarButtonTestID: 'orders-tab',
            tabBarIcon: ({ color }) => <ShoppingBag size={iconSize} color={color} />,
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            title: t('common.wallet'),
            tabBarButtonTestID: 'wallet-tab',
            tabBarIcon: ({ color }) => <Wallet size={iconSize} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('common.profile'),
            tabBarButtonTestID: 'profile-tab',
            tabBarIcon: ({ color }) => <User size={iconSize} color={color} />,
          }}
        />
      </Tabs>
      <TutorialOverlay />
    </>
  );
}
