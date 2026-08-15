import { useRouter, usePathname } from 'expo-router';
import React from 'react';
import { Pressable, View, Platform, LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';
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
  const reducedMotion = useReducedMotion();
  const [containerWidth, setContainerWidth] = React.useState(0);

  const isTabRoute = tabs.some(
    (tab) => pathname === tab.name || pathname.startsWith(`${tab.name}/`)
  );
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => pathname === tab.name || pathname.startsWith(`${tab.name}/`))
  );
  const tabWidth = tabs.length > 0 ? containerWidth / tabs.length : 0;

  const indicatorStyle = useAnimatedStyle(() => {
    const targetX = activeIndex * tabWidth + tabWidth * 0.1;
    const targetWidth = tabWidth * 0.8;
    return {
      transform: [
        {
          translateX: reducedMotion
            ? targetX
            : withSpring(targetX, { damping: 20, stiffness: 250 }),
        },
      ],
      width: reducedMotion ? targetWidth : withSpring(targetWidth, { damping: 20, stiffness: 250 }),
    };
  }, [activeIndex, tabWidth, reducedMotion]);

  const handlePress = (tab: TabItem) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (tab.name === tabs[activeIndex]?.name) return;
    router.replace(tab.name as any);
  };

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  if (!isTabRoute) return null;

  return (
    <View
      onLayout={handleLayout}
      className={cn(
        'absolute bottom-0 left-0 right-0 flex-row border-t border-border bg-background/80',
        Platform.OS === 'web' && 'backdrop-blur-xl'
      )}
      style={{ paddingBottom: insets.bottom, height: 64 + insets.bottom }}
    >
      {tabWidth > 0 && (
        <Animated.View
          className="absolute top-2 h-10 rounded-2xl bg-primary/10"
          style={[{ position: 'absolute' }, indicatorStyle]}
          pointerEvents="none"
        />
      )}
      {tabs.map((tab) => {
        const isActive = tabs[activeIndex]?.name === tab.name;
        const Icon = tab.icon;
        return (
          <Pressable
            key={tab.name}
            className="flex-1 items-center justify-center pt-2"
            onPress={() => handlePress(tab)}
            android_ripple={{ color: colors.primary + '20' }}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
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
