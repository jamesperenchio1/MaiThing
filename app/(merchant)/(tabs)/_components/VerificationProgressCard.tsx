import { View } from 'react-native';
import { ShieldAlert } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import type { Merchant } from '@/src/types';

export function VerificationProgressCard({
  merchant,
  onPress,
}: {
  merchant: Merchant;
  onPress: () => void;
}) {
  const colors = useThemeColor();

  return (
    <PressableScale scale={0.98} onPress={onPress} className="mb-6">
      <Card variant="elevated">
        <View className="flex-row items-center">
          <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
            <ShieldAlert size={22} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text variant="body-sm" className="font-semibold">
              Get Verified
            </Text>
            {(() => {
              const completedOrders = merchant.completedOrders ?? 0;
              const doneCount = [
                completedOrders >= 10,
                merchant.rating >= 4.0,
                (merchant.refundDisputes ?? 0) === 0,
              ].filter(Boolean).length;
              return (
                <View className="mt-1.5 flex-row items-center">
                  {[
                    completedOrders >= 10,
                    merchant.rating >= 4.0,
                    (merchant.refundDisputes ?? 0) === 0,
                  ].map((done, i) => (
                    <View
                      key={i}
                      className={`mr-1 h-2 w-2 rounded-full ${done ? 'bg-primary' : 'bg-muted/30'}`}
                    />
                  ))}
                  <Text variant="caption" className="ml-1.5 text-muted">
                    {doneCount}/3 steps complete
                  </Text>
                </View>
              );
            })()}
          </View>
          <View className="flex-row items-center">
            <Text variant="caption" className="mr-1 font-semibold text-primary">
              Get verified →
            </Text>
          </View>
        </View>
      </Card>
    </PressableScale>
  );
}
