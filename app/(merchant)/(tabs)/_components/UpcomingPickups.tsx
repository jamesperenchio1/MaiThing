import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Clock } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import type { Order } from '@/src/types';

import { OrderPickupRow } from './OrderPickupRow';

export function UpcomingPickups({
  actionableOrders,
  nowOrders,
  upcomingOrders,
  onSeeAll,
  onOrderPress,
  onOrderScan,
}: {
  actionableOrders: Order[];
  nowOrders: Order[];
  upcomingOrders: Order[];
  onSeeAll: () => void;
  onOrderPress: (order: Order) => void;
  onOrderScan: (order: Order) => void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColor();

  return (
    <View className="mb-6">
      <View className="mb-3 flex-row items-center justify-between">
        <Text variant="body-sm" className="font-semibold text-muted">
          {t('merchant.dashboard.upcomingPickups')}
        </Text>
        <PressableScale onPress={onSeeAll} scale={0.95}>
          <Text variant="caption" className="text-primary">
            {t('common.seeAll')}
          </Text>
        </PressableScale>
      </View>

      {actionableOrders.length === 0 ? (
        <EmptyState
          icon={<Clock size={32} color={colors.muted} />}
          title={t('merchant.dashboard.noUpcomingPickups')}
          description="New orders will appear here when customers make purchases."
        />
      ) : (
        <>
          {nowOrders.length > 0 && (
            <View className="mb-3">
              <Text
                variant="caption"
                className="mb-2 font-semibold uppercase tracking-wider text-muted"
              >
                {t('merchant.orders.groupNow')}
              </Text>
              {nowOrders.map((order) => (
                <OrderPickupRow
                  key={order.id}
                  order={order}
                  onPress={() => onOrderPress(order)}
                  onScan={() => onOrderScan(order)}
                />
              ))}
            </View>
          )}
          {upcomingOrders.length > 0 && (
            <View>
              <Text
                variant="caption"
                className="mb-2 font-semibold uppercase tracking-wider text-muted"
              >
                {t('merchant.orders.groupUpcoming')}
              </Text>
              {upcomingOrders.map((order) => (
                <OrderPickupRow
                  key={order.id}
                  order={order}
                  onPress={() => onOrderPress(order)}
                  onScan={() => onOrderScan(order)}
                />
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}
