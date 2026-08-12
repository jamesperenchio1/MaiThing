import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Alert, Platform, ScrollView } from 'react-native';
import { Image } from '@/src/components/ui/Image';
import * as Haptics from 'expo-haptics';
import {
  Clock,
  CheckCircle,
  ChefHat,
  Bell,
  Check,
  Phone,
  Printer,
  Share2,
  FileText,
  Calendar,
  QrCode,
  MessageSquare,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Screen } from '@/src/components/layout/Screen';
import { Header } from '@/src/components/layout/Header';
import { Avatar } from '@/src/components/ui/Avatar';
import { PressableScale } from '@/src/components/ui/PressableScale';
import {
  useOrder,
  useUpdateOrderStatus,
  useCancelOrder,
  useRefundOrder,
} from '@/src/hooks/useOrders';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useNetworkState } from '@/src/hooks/useNetworkState';
import { formatCurrency, formatPickupWindow } from '@/src/lib/utils';
import type { Order } from '@/src/types';

const statusSteps: { status: Order['status']; Icon: LucideIcon }[] = [
  { status: 'pending', Icon: Clock },
  { status: 'confirmed', Icon: CheckCircle },
  { status: 'preparing', Icon: ChefHat },
  { status: 'ready', Icon: Bell },
  { status: 'picked_up', Icon: Check },
  { status: 'completed', Icon: CheckCircle },
];

const STEP_WIDTH = 80;

function StatusStep({
  Icon,
  label,
  active,
  completed,
  isLast,
}: {
  Icon: LucideIcon;
  label: string;
  active: boolean;
  completed: boolean;
  isLast: boolean;
}) {
  const colors = useThemeColor();
  const circleColor = completed || active ? 'bg-primary' : 'bg-muted/20';
  const iconColor = completed || active ? '#fff' : colors.muted;

  return (
    <View className="w-[80px] items-center">
      <View className={`mb-2 h-9 w-9 items-center justify-center rounded-full ${circleColor}`}>
        <Icon size={16} color={iconColor} />
      </View>
      <Text
        variant="caption"
        className={`text-center ${active || completed ? 'text-foreground' : 'text-muted'}`}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {label}
      </Text>
      {!isLast && (
        <View
          className={`absolute left-[58px] top-[18px] h-0.5 w-[44px] ${completed ? 'bg-primary' : 'bg-muted/20'}`}
        />
      )}
    </View>
  );
}

function buildOrderSummary(order: Order) {
  const items = order.items.map((i) => `${i.quantity}x ${i.title}`).join('\n');
  return [
    `Order #${order.pickupCode}`,
    `Customer: ${order.customerName ?? 'Guest'}`,
    `Status: ${order.status}`,
    '',
    items,
    '',
    `Subtotal: ${formatCurrency(order.subtotal)}`,
    `Discount: ${formatCurrency(order.discount)}`,
    `Total: ${formatCurrency(order.total)}`,
  ].join('\n');
}

export default function MerchantOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const colors = useThemeColor();
  const { isOffline } = useNetworkState();
  const { data: order, isLoading } = useOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const cancelOrder = useCancelOrder();
  const refundOrder = useRefundOrder();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setSuccessMessage(null);
  }, [id]);

  const summary = useMemo(() => (order ? buildOrderSummary(order) : ''), [order]);
  const stepperRef = useRef<ScrollView>(null);
  const displayIndex = useMemo(() => {
    if (!order) return 0;
    const idx = statusSteps.findIndex((s) => s.status === order.status);
    return idx >= 0 ? idx : statusSteps.length - 1;
  }, [order]);

  useEffect(() => {
    if (!stepperRef.current) return;
    const offset = Math.max(0, displayIndex * STEP_WIDTH - 40);
    stepperRef.current.scrollTo({ x: offset, animated: true });
  }, [displayIndex]);

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Order #${order?.pickupCode ?? ''}`,
          text: summary,
        });
        return;
      } catch {
        // fall through to alert
      }
    }
    Alert.alert(t('merchant.orders.share'), summary);
  };

  const handlePrint = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: `Print Order #${order?.pickupCode ?? ''}`,
          text: summary,
        })
        .catch(() => {});
    } else {
      Alert.alert(t('merchant.orders.print'), summary);
    }
  };

  const handleMarkReady = () => {
    if (!order) return;
    updateStatus.mutate(
      { id: order.id, status: 'ready' },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setSuccessMessage(t('customer.orders.status.ready'));
        },
      }
    );
  };

  const handleMarkPickedUp = () => {
    if (!order) return;
    updateStatus.mutate(
      { id: order.id, status: 'picked_up' },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setSuccessMessage(t('customer.orders.status.picked_up'));
        },
      }
    );
  };

  const handleCancel = () => {
    if (!order) return;
    const reasons = ['Items sold out', 'Customer request', 'Shop closed / emergency', 'Other'];
    Alert.alert(t('merchant.orders.cancel'), t('merchant.orders.cancelReason'), [
      ...reasons.map((reason) => ({
        text: reason,
        onPress: () => {
          Alert.alert(
            t('merchant.orders.cancel'),
            `Refund ${formatCurrency(order.total)} to the customer?`,
            [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('common.confirm'),
                style: 'destructive',
                onPress: () =>
                  cancelOrder.mutate(
                    { id: order.id, reason },
                    {
                      onSuccess: () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        setSuccessMessage(t('customer.orders.status.cancelled'));
                      },
                    }
                  ),
              },
            ]
          );
        },
      })),
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const handleRefund = () => {
    if (!order) return;
    const reasons = ['Customer complaint', 'Items unavailable', 'Other'];
    Alert.alert(t('merchant.orders.refund'), t('merchant.orders.refundReason'), [
      ...reasons.map((reason) => ({
        text: reason,
        onPress: () => {
          Alert.alert(
            t('merchant.orders.refund'),
            `Refund ${formatCurrency(order.total)} to the customer?`,
            [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('common.confirm'),
                style: 'destructive',
                onPress: () =>
                  refundOrder.mutate(
                    { id: order.id, reason },
                    {
                      onSuccess: () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        setSuccessMessage(t('customer.orders.status.cancelled'));
                      },
                    }
                  ),
              },
            ]
          );
        },
      })),
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

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

  return (
    <Screen scrollable>
      <Header title={t('merchant.orders.orderDetail')} />
      {isOffline && (
        <View className="mx-6 mt-4 flex-row items-center rounded-2xl bg-amber-500/10 px-4 py-3">
          <AlertTriangle size={18} color={colors.warning} />
          <Text variant="body-sm" className="ml-2 flex-1 text-amber-700 dark:text-amber-300">
            {t('common.noConnection')}
          </Text>
        </View>
      )}
      <View className="px-6 py-4">
        <Card variant="elevated" className="mb-4 flex-row items-center p-4">
          <Avatar
            uri={order.customerAvatarUrl}
            name={order.customerName ?? t('merchant.orders.customer')}
            size="lg"
            className="mr-4"
          />
          <View className="flex-1">
            <Text variant="h4" numberOfLines={1}>
              {order.customerName ?? t('merchant.orders.customer')}
            </Text>
            {order.customerPhone && (
              <View className="mt-1 flex-row items-center">
                <Phone size={14} color={colors.muted} />
                <Text variant="body-sm" className="ml-1.5 text-muted">
                  {order.customerPhone}
                </Text>
              </View>
            )}
          </View>
          <Badge variant={order.status === 'cancelled' ? 'danger' : 'success'}>
            {t(`customer.orders.status.${order.status}`)}
          </Badge>
        </Card>

        {order.notes ? (
          <Card variant="outlined" className="mb-4 border-warning/40 bg-warning/5">
            <View className="mb-1 flex-row items-center">
              <MessageSquare size={14} color={colors.warning} />
              <Text variant="label" className="ml-1.5 text-warning">
                {t('merchant.orders.notes')}
              </Text>
            </View>
            <Text variant="body-sm">{order.notes}</Text>
          </Card>
        ) : null}

        <Card variant="outlined" className="mb-4 items-center p-6">
          <QrCode size={24} color={colors.muted} />
          <Text variant="caption" className="mb-2 mt-2 text-muted">
            {t('customer.orders.pickupCode')}
          </Text>
          <Text className="text-3xl font-mono font-bold tracking-widest text-primary">
            {order.pickupCode}
          </Text>
        </Card>

        {order.status === 'cancelled' ? (
          <Card variant="outlined" className="mb-4 border-danger/30 bg-danger/10">
            <Text variant="body-sm" className="text-center font-semibold text-danger">
              {t('customer.orders.status.cancelled')}
              {order.cancellationReason ? ` — ${order.cancellationReason}` : ''}
            </Text>
          </Card>
        ) : (
          <ScrollView
            ref={stepperRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            {statusSteps.map((step, index) => (
              <StatusStep
                key={step.status}
                Icon={step.Icon}
                label={t(`customer.orders.status.${step.status}`)}
                active={index === displayIndex}
                completed={index < displayIndex}
                isLast={index === statusSteps.length - 1}
              />
            ))}
          </ScrollView>
        )}

        <Card variant="outlined" className="mb-4">
          <Text variant="h4" className="mb-4">
            {t('merchant.orders.orderDetail')}
          </Text>
          {order.items.map((item) => (
            <View key={item.listingId} className="mb-3 flex-row items-center">
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  className="mr-3 h-14 w-14 rounded-xl"
                  resizeMode="cover"
                />
              ) : (
                <View className="mr-3 h-14 w-14 rounded-xl bg-muted/20" />
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
            <View className="mb-2 flex-row justify-between">
              <Text variant="body-sm" className="text-muted">
                Discount
              </Text>
              <Text variant="body-sm">{formatCurrency(order.discount)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text variant="body" className="font-semibold">
                {t('merchant.orders.orderTotal')}
              </Text>
              <Text className="font-bold">{formatCurrency(order.total)}</Text>
            </View>
          </View>
        </Card>

        <Card variant="outlined" className="mb-4">
          <View className="mb-3 flex-row items-start">
            <Calendar size={20} color={colors.muted} className="mr-3 mt-0.5" />
            <View className="flex-1">
              <Text variant="body-sm" className="font-semibold">
                {t('merchant.orders.pickupWindow')}
              </Text>
              <Text variant="body-sm" className="text-muted">
                {formatPickupWindow(order.pickupWindowStart, order.pickupWindowEnd, i18n.language)}
              </Text>
            </View>
          </View>
          {order.notes && (
            <View className="flex-row items-start">
              <FileText size={20} color={colors.muted} className="mr-3 mt-0.5" />
              <View className="flex-1">
                <Text variant="body-sm" className="font-semibold">
                  {t('merchant.orders.notes')}
                </Text>
                <Text variant="body-sm" className="text-muted">
                  {order.notes}
                </Text>
              </View>
            </View>
          )}
        </Card>

        <View className="mb-4 flex-row space-x-3">
          <PressableScale onPress={handlePrint} className="flex-1" scale={0.97}>
            <Card variant="outlined" className="items-center p-3">
              <Printer size={20} color={colors.foreground} />
              <Text variant="body-sm" className="mt-1 font-semibold">
                {t('merchant.orders.print')}
              </Text>
            </Card>
          </PressableScale>
          <PressableScale onPress={handleShare} className="flex-1" scale={0.97}>
            <Card variant="outlined" className="items-center p-3">
              <Share2 size={20} color={colors.foreground} />
              <Text variant="body-sm" className="mt-1 font-semibold">
                {t('merchant.orders.share')}
              </Text>
            </Card>
          </PressableScale>
        </View>

        <View className="space-y-3">
          {['pending', 'confirmed', 'preparing'].includes(order.status) && (
            <Button
              fullWidth
              onPress={handleMarkReady}
              loading={updateStatus.isPending}
              leftIcon={<Bell size={18} color={colors.white} />}
            >
              {t('merchant.orders.markReady')}
            </Button>
          )}
          {order.status === 'ready' && (
            <Button
              fullWidth
              onPress={handleMarkPickedUp}
              loading={updateStatus.isPending}
              leftIcon={<Check size={18} color={colors.white} />}
            >
              {t('merchant.orders.markPickedUp')}
            </Button>
          )}
          {order.status !== 'cancelled' && (
            <Button
              variant="outline"
              fullWidth
              leftIcon={<MessageSquare size={18} color={colors.primary} />}
              onPress={() => router.push(`/(merchant)/messages/${order.customerId}` as never)}
            >
              Chat with customer
            </Button>
          )}
          {['pending', 'confirmed', 'preparing', 'ready'].includes(order.status) && (
            <Button
              variant="outline"
              fullWidth
              onPress={handleCancel}
              loading={cancelOrder.isPending}
            >
              {t('merchant.orders.cancel')}
            </Button>
          )}
          {['picked_up', 'completed'].includes(order.status) && (
            <Button
              variant="outline"
              fullWidth
              onPress={handleRefund}
              loading={refundOrder.isPending}
            >
              {t('merchant.orders.refund')}
            </Button>
          )}
        </View>

        {successMessage && (
          <Card variant="outlined" className="mt-4 border-success/30 bg-success/10">
            <Text variant="body-sm" className="text-center font-semibold text-success">
              {successMessage}
            </Text>
          </Card>
        )}
      </View>
    </Screen>
  );
}
