import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { QrCode } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatPickupWindow } from '@/src/lib/utils';
import type { Order } from '@/src/types';

export function OrderPickupRow({
  order,
  onPress,
  onScan,
}: {
  order: Order;
  onPress?: () => void;
  onScan?: () => void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColor();

  return (
    <PressableScale key={order.id} onPress={onPress} scale={0.98}>
      <Card variant="outlined" className="mb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <View className="mb-1 flex-row items-center">
              <Text variant="body-sm" className="font-semibold">
                {order.customerName ?? order.customerPhone ?? 'Customer'}
              </Text>
              <Text variant="caption" className="ml-2 text-muted">
                · {order.items.reduce((sum, i) => sum + i.quantity, 0)} items
              </Text>
            </View>
            <Text variant="caption" className="text-muted">
              {formatPickupWindow(order.pickupWindowStart, order.pickupWindowEnd)}
            </Text>
          </View>
          <View className="items-end">
            <Badge variant={order.status === 'ready' ? 'success' : 'warning'}>
              {t(`customer.orders.status.${order.status}`)}
            </Badge>
            <View className="mt-1 flex-row items-center gap-2">
              <Text className="font-mono text-primary">{order.pickupCode}</Text>
              {onScan && (
                <PressableScale
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onScan();
                  }}
                  scale={0.85}
                  hitSlop={8}
                  className="rounded-lg bg-primary/10 p-2"
                >
                  <QrCode size={18} color={colors.primary} />
                </PressableScale>
              )}
            </View>
          </View>
        </View>
      </Card>
    </PressableScale>
  );
}
