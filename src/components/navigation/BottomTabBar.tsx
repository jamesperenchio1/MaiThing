import { useRouter, usePathname } from 'expo-router';
import { Pressable, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { cn } from '@/src/lib/utils';

export interface TabItem {
  name: string;
  label: string;
  icon: LucideIcon;
}

interface BottomTabBarProps {
  tabs: TabItem[];
}

export function BottomTabBar({ tabs }: BottomTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const colors = useThemeColor();

  const isTabRoute = tabs.some((tab) => pathname === tab.name || pathname.startsWith(`${tab.name}/`));
  if (!isTabRoute) return null;

  const activeTab = tabs.find((tab) => pathname === tab.name || pathname.startsWith(`${tab.name}/`)) ?? tabs[0];

  const handlePress = (tab: TabItem) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (tab.name === activeTab.name) return;
    router.replace(tab.name as any);
  };

  return (
    <View
      className={cn(
        'absolute bottom-0 left-0 right-0 flex-row border-t border-border bg-background/80',
        Platform.OS === 'web' && 'backdrop-blur-xl'
      )}
      style={{ paddingBottom: insets.bottom, height: 64 + insets.bottom }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab.name === tab.name;
        const Icon = tab.icon;
        return (
          <Pressable
            key={tab.name}
            className="flex-1 items-center justify-center pt-2"
            onPress={() => handlePress(tab)}
            android_ripple={{ color: colors.primary + '20' }}
          >
            <Icon size={24} color={isActive ? colors.primary : colors.muted} />
            <Text
              variant="caption"
              className={cn('mt-1', isActive ? 'text-primary' : 'text-muted')}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
