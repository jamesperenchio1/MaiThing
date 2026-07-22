import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { cn } from '@/src/lib/utils';

interface SkeletonProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  circle?: boolean;
}

export function Skeleton({ className, width, height, circle }: SkeletonProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={{ width: width as number, height: height as number }}
      className={cn(
        'animate-pulse bg-muted/20',
        circle && 'rounded-full',
        className
      )}
    />
  );
}

export function SkeletonList({ count = 3, children }: { count?: number; children: React.ReactNode }) {
  return (
    <View className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i}>{children}</View>
      ))}
    </View>
  );
}
