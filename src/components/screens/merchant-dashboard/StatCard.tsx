import { View } from 'react-native';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { PressableScale } from '@/src/components/ui/PressableScale';

export function StatCard({
  label,
  value,
  icon,
  iconBg = 'bg-primary/10',
  onPress,
  testID,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg?: string;
  onPress?: () => void;
  testID?: string;
}) {
  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      className="flex-1"
      scale={0.98}
      disabled={!onPress}
    >
      <Card variant="elevated" className="min-h-[104px] justify-between">
        <View className={`rounded-xl p-1.5 self-start ${iconBg}`}>{icon}</View>
        <View>
          <Text variant="caption" className="mb-0.5 text-muted">
            {label}
          </Text>
          <Text variant="h3">{value}</Text>
        </View>
      </Card>
    </PressableScale>
  );
}
