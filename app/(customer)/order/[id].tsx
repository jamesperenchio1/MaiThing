import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Image } from 'react-native';
import { Clock } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Screen } from '@/src/components/layout/Screen';
import { Header } from '@/src/components/layout/Header';
import { useOrder } from '@/src/hooks/useOrders';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatCurrency } from '@/src/lib/utils';
import type { Order } from '@/src/types';

const statusSteps: { status: Order['status']; label: string }[] = [
  { status: 'pending', label: 'Pending' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'preparing', label: 'Preparing' },
  { status: 'ready', label: 'Ready' },
  { status: 'picked_up', label: 'Picked Up' },
];

function StatusStep({ status, active }: { status: string; active: boolean }) {
  return (
    <View className="flex-1 items-center">
      <View
        className={`mb-2 h-8 w-8 items-center justify-center rounded-full ${
          active ? 'bg-primary' : 'bg-muted/20'
        }`}
      >
        <Text className={`text-xs font-bold ${active ? 'text-white' : 'text-muted'}`}>
          {status.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text variant="caption" className={`text-center ${active ? 'text-foreground' : 'text-muted'}`}>
        {status}
      </Text>
    </View>
  );
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const colors = useThemeColor();
  const { data: order, isLoading } = useOrder(id);

  if (isLoading || !order) {
    return (
      <Screen>
        <Header />
        <View className="flex-1 items-center justify-center">
          <Text variant="body" className="text-muted">
            {t('common.loading')}
          </Text>
        </View>
      </Screen>
    );
  }

  const activeIndex = statusSteps.findIndex((s) => s.status === order.status);

  return (
    <Screen scrollable>
      <Header title={`Order #${order.id.split('-').pop()}`} />
      <View className="px-6 py-4">
        <Card variant="elevated" className="mb-6 items-center p-6">
          <Text variant="caption" className="mb-2 text-muted">
            {t('customer.orders.pickupCode')}
          </Text>
          <Text className="text-3xl font-mono font-bold tracking-widest text-primary">
            {order.pickupCode}
          </Text>
        </Card>

        <View className="mb-6 flex-row">
          {statusSteps.map((step, index) => (
            <StatusStep key={step.status} status={step.label} active={index <= activeIndex} />
          ))}
        </View>

        <Card variant="outlined" className="mb-6">
          <Text variant="h3" className="mb-4">
            Order Summary
          </Text>
          {order.items.map((item) => (
            <View key={item.listingId} className="mb-3 flex-row items-center">
              {item.imageUrl && (
                <Image source={{ uri: item.imageUrl }} className="mr-3 h-14 w-14 rounded-xl" />
              )}
              <View className="flex-1">
                <Text variant="body-sm" className="font-semibold" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text variant="caption" className="text-muted">
                  {item.quantity}x {formatCurrency(item.unitPrice)}
                </Text>
              </View>
              <Text className="font-semibold">{formatCurrency(item.totalPrice)}</Text>
            </View>
          ))}
          <View className="mt-4 border-t border-border pt-4">
            <View className="mb-2 flex-row justify-between">
              <Text variant="body-sm" className="text-muted">
                Subtotal
              </Text>
              <Text variant="body-sm">{formatCurrency(order.subtotal)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text variant="body" className="font-semibold">
                Total
              </Text>
              <Text className="font-bold">{formatCurrency(order.total)}</Text>
            </View>
          </View>
        </Card>

        <Card variant="outlined">
          <View className="flex-row items-start">
            <Clock size={20} color={colors.muted} className="mr-3 mt-0.5" />
            <View className="flex-1">
              <Text variant="body-sm" className="font-semibold">
                Pickup Window
              </Text>
              <Text variant="body-sm" className="text-muted">
                {new Date(order.pickupWindowStart).toLocaleString()} - {new Date(order.pickupWindowEnd).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        </Card>
      </View>
    </Screen>
  );
}
