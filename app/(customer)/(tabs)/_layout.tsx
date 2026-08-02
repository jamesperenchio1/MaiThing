import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Home, Search, MapPin, ShoppingBag, Wallet, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { TutorialOverlay } from '@/src/components/tutorial/TutorialOverlay';
import { useTutorialStore } from '@/src/stores/tutorial';

export default function CustomerTabsLayout() {
  const colors = useThemeColor();
  const insets = useSafeAreaInsets();
  const { hasSeenTutorial, isActive, startTutorial } = useTutorialStore();

  useEffect(() => {
    if (!hasSeenTutorial && !isActive) {
      const timer = setTimeout(startTutorial, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 72 + insets.bottom,
          paddingTop: 10,
          paddingBottom: insets.bottom + 6,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarButtonTestID: 'home-tab',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarButtonTestID: 'discover-tab',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarButtonTestID: 'map-tab',
          tabBarIcon: ({ color, size }) => <MapPin size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarButtonTestID: 'orders-tab',
          tabBarIcon: ({ color, size }) => <ShoppingBag size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarButtonTestID: 'wallet-tab',
          tabBarIcon: ({ color, size }) => <Wallet size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarButtonTestID: 'profile-tab',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
    <TutorialOverlay />
    </>
  );
}
