import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { PressableScale } from '@/src/components/ui/PressableScale';

export interface QuickAction {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  color: string;
  bg: string;
  route: string;
  testID: string;
}

export function QuickActionsGrid({
  quickActions,
  onActionPress,
}: {
  quickActions: QuickAction[];
  onActionPress: (route: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <View className="mb-6">
      <Text variant="body-sm" className="mb-3 font-semibold text-muted">
        {t('merchant.dashboard.quickActions')}
      </Text>
      <View className="flex-row flex-wrap" style={{ gap: 12 }}>
        {quickActions.map(({ icon: Icon, label, color, bg, route, testID }) => (
          <PressableScale
            key={label}
            testID={testID}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onActionPress(route);
            }}
            scale={0.95}
            style={{ width: '47%' }}
          >
            <Card variant="elevated" className="items-center py-4">
              <View className={`rounded-2xl p-3 mb-2 ${bg}`}>
                <Icon size={22} color={color} />
              </View>
              <Text variant="body-sm" className="font-medium text-center">
                {label}
              </Text>
            </Card>
          </PressableScale>
        ))}
      </View>
    </View>
  );
}
