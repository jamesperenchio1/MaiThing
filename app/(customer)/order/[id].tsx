import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Image, Alert, Platform } from 'react-native';
import {
  Clock,
  QrCode,
  Hash,
  CheckCircle,
  ChefHat,
  Bell,
  Check,
  Star,
  Calendar,
  type LucideIcon,
} from 'lucide-react-native';
let ExpoCalendar: typeof import('expo-calendar') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ExpoCalendar = require('expo-calendar');
} catch {
  // not available in Expo Go
}

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Input } from '@/src/components/ui/Input';
import { Screen } from '@/src/components/layout/Screen';
import { Header } from '@/src/components/layout/Header';
import { QRCode } from '@/src/components/ui/QRCode';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useCancelOrder, useOrder, useReorder } from '@/src/hooks/useOrders';
import { useReviews, useSubmitReview } from '@/src/hooks/useReviews';
import { scheduleLocalNotification } from '@/src/services/notifications';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useAuthStore } from '@/src/stores/auth';
import { formatCurrency, formatPickupWindow } from '@/src/lib/utils';
import type { Order } from '@/src/types';

const statusSteps: {
  status: Order['status'];
  Icon: LucideIcon;
}[] = [
  { status: 'pending', Icon: Clock },
  { status: 'confirmed', Icon: CheckCircle },
  { status: 'preparing', Icon: ChefHat },
  { status: 'ready', Icon: Bell },
  { status: 'picked_up', Icon: Check },
];

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
    <View className="flex-1 flex-row items-center">
      <View className="flex-1 items-center">
        <View className={`mb-2 h-9 w-9 items-center justify-center rounded-full ${circleColor}`}>
          <Icon size={16} color={iconColor} />
        </View>
        <Text
          variant="caption"
          className={`text-center ${active || completed ? 'text-foreground' : 'text-muted'}`}
        >
          {label}
        </Text>
      </View>
      {!isLast && (
        <View
          className={`mx-1 h-0.5 flex-1 ${completed ? 'bg-primary' : 'bg-muted/20'}`}
          style={{ marginTop: -18 }}
        />
      )}
    </View>
  );
}

function ReviewSection({ order }: { order: Order }) {
  const colors = useThemeColor();
  const user = useAuthStore((s) => s.user);
  const { data: reviews } = useReviews(order.merchantId);
  const submitReview = useSubmitReview();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isEligible =
    (order.status === 'completed' || order.status === 'picked_up') &&
    new Date().getTime() - new Date(order.createdAt).getTime() >= 3600000;

  if (!isEligible) return null;

  const alreadyReviewed = reviews?.some((r) => r.orderId === order.id);

  if (alreadyReviewed || submitted) {
    return (
      <Card variant="outlined" className="mb-6 items-center">
        <Text variant="body-sm" className="text-center text-muted">
          {submitted ? 'Thank you for your review! ⭐' : 'You reviewed this order'}
        </Text>
      </Card>
    );
  }

  return (
    <Card variant="outlined" className="mb-6">
      <Text variant="h3" className="mb-4">
        Leave a review
      </Text>
      <View className="mb-4 flex-row justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <PressableScale key={star} onPress={() => setRating(star)} scale={0.85}>
            <Star
              size={32}
              color={star <= rating ? '#F59E0B' : colors.muted}
              fill={star <= rating ? '#F59E0B' : 'transparent'}
            />
          </PressableScale>
        ))}
      </View>
      <Input
        placeholder="How was your order?"
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        inputClassName="min-h-[72px]"
        containerClassName="mb-2"
      />
      <Button
        fullWidth
        disabled={rating === 0 || submitReview.isPending}
        loading={submitReview.isPending}
        onPress={() => {
          if (!user || rating === 0) return;
          submitReview.mutate(
            {
              orderId: order.id,
              customerId: user.id,
              customerName: user.name,
              merchantId: order.merchantId,
              listingId: order.items[0]?.listingId,
              rating,
              comment,
            },
            { onSuccess: () => setSubmitted(true) }
          );
        }}
      >
        Submit review
      </Button>
    </Card>
  );
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const colors = useThemeColor();
  const { data: order, isLoading } = useOrder(id);
  const cancelOrder = useCancelOrder();
  const reorder = useReorder();
  const [showQR, setShowQR] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [calendarAdded, setCalendarAdded] = useState(false);
  const prevStatusRef = useRef<Order['status'] | undefined>(undefined);

  useEffect(() => {
    if (order && prevStatusRef.current !== undefined && prevStatusRef.current !== 'ready' && order.status === 'ready' && Platform.OS !== 'web') {
      scheduleLocalNotification(
        'Your order is ready!',
        `Pick up at ${order.merchantName} now. Code: ${order.pickupCode}`
      );
    }
    if (order) {
      prevStatusRef.current = order.status;
    }
  }, [order]);

  const handleAddToCalendar = async () => {
    if (!order || Platform.OS === 'web' || !ExpoCalendar) return;
    try {
      const { status } = await ExpoCalendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') return;
      const calendars = await ExpoCalendar.getCalendarsAsync(ExpoCalendar.EntityTypes.EVENT);
      const writable = calendars.find((c) => c.allowsModifications);
      if (!writable) return;
      await ExpoCalendar.createEventAsync(writable.id, {
        title: `Pickup: ${order.merchantName}`,
        startDate: new Date(order.pickupWindowStart),
        endDate: new Date(order.pickupWindowEnd),
        notes: `Pickup code: ${order.pickupCode}`,
        location: order.merchantName,
      });
      setCalendarAdded(true);
      setTimeout(() => setCalendarAdded(false), 2000);
    } catch {
      // silently ignore calendar write failures
    }
  };

  useEffect(() => {
    setCancelSuccess(false);
  }, [id]);

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

  const normalizedStatus: Order['status'] =
    order.status === 'completed' ? 'picked_up' : order.status;
  const activeIndex = statusSteps.findIndex((s) => s.status === normalizedStatus);

  return (
    <Screen scrollable>
      <Header title={`Order #${order.id.split('-').pop()}`} />
      <View className="px-6 py-4">
        <Card variant="elevated" className="mb-6 items-center p-6">
          <View className="mb-3 flex-row">
            <PressableScale
              onPress={() => setShowQR(false)}
              className={`flex-row items-center rounded-xl px-4 py-2 mr-2 ${!showQR ? 'bg-primary' : 'bg-muted/10'}`}
              scale={0.95}
            >
              <Hash size={16} color={!showQR ? '#fff' : colors.muted} />
              <Text
                variant="body-sm"
                className={`ml-1.5 font-semibold ${!showQR ? 'text-white' : 'text-muted'}`}
              >
                Code
              </Text>
            </PressableScale>
            <PressableScale
              onPress={() => setShowQR(true)}
              className={`flex-row items-center rounded-xl px-4 py-2 ${showQR ? 'bg-primary' : 'bg-muted/10'}`}
              scale={0.95}
            >
              <QrCode size={16} color={showQR ? '#fff' : colors.muted} />
              <Text
                variant="body-sm"
                className={`ml-1.5 font-semibold ${showQR ? 'text-white' : 'text-muted'}`}
              >
                QR
              </Text>
            </PressableScale>
          </View>
          {showQR ? (
            <View className="items-center">
              <View className="rounded-2xl bg-white p-4">
                <QRCode value={order.pickupCode} size={160} />
              </View>
              <Text variant="caption" className="mt-3 text-muted">
                Show QR code to merchant
              </Text>
            </View>
          ) : (
            <View className="items-center">
              <Text variant="caption" className="mb-2 text-muted">
                {t('customer.orders.pickupCode')}
              </Text>
              <Text className="text-3xl font-mono font-bold tracking-widest text-primary">
                {order.pickupCode}
              </Text>
            </View>
          )}
        </Card>

        {order.status === 'cancelled' ? (
          <Card variant="outlined" className="mb-6 border-danger/30 bg-danger/10">
            <Text variant="body-sm" className="text-center font-semibold text-danger">
              {t('customer.orders.status.cancelled')}
            </Text>
          </Card>
        ) : (
          <View className="mb-6 flex-row">
            {statusSteps.map((step, index) => (
              <StatusStep
                key={step.status}
                Icon={step.Icon}
                label={t(`customer.orders.status.${step.status}`)}
                active={index === activeIndex}
                completed={index < activeIndex}
                isLast={index === statusSteps.length - 1}
              />
            ))}
          </View>
        )}

        <ReviewSection order={order} />

        <Card variant="outlined" className="mb-6">
          <Text variant="h3" className="mb-4">
            Order Summary
          </Text>
          {order.items.map((item) => (
            <View key={item.listingId} className="mb-3 flex-row items-center">
              {item.imageUrl && (
                <Image
                  source={{ uri: item.imageUrl }}
                  className="mr-3 h-14 w-14 rounded-xl"
                  resizeMode="cover"
                />
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

        {order.notes ? (
          <Card variant="outlined" className="mb-4">
            <Text variant="label" className="mb-1 text-muted">
              {t('merchant.orders.notes')}
            </Text>
            <Text variant="body-sm">{order.notes}</Text>
          </Card>
        ) : null}

        <Card variant="outlined">
          <View className="flex-row items-start">
            <Clock size={20} color={colors.muted} className="mr-3 mt-0.5" />
            <View className="flex-1">
              <Text variant="body-sm" className="font-semibold">
                Pickup Window
              </Text>
              <Text variant="body-sm" className="text-muted">
                {formatPickupWindow(order.pickupWindowStart, order.pickupWindowEnd, i18n.language)}
              </Text>
            </View>
          </View>
        </Card>

        {Platform.OS !== 'web' &&
          order.status !== 'completed' &&
          order.status !== 'cancelled' && (
            <View className="mt-4">
              <Button
                variant="outline"
                fullWidth
                onPress={handleAddToCalendar}
                leftIcon={<Calendar size={18} color={colors.primary} />}
              >
                Add to Calendar
              </Button>
              {calendarAdded && (
                <Text variant="caption" className="mt-2 text-center text-success">
                  Added to calendar ✓
                </Text>
              )}
            </View>
          )}

        {['completed', 'picked_up'].includes(order.status) && (
          <Button
            fullWidth
            className="mt-6"
            loading={reorder.isPending}
            onPress={() => reorder.mutate(order)}
          >
            Reorder
          </Button>
        )}

        {['pending', 'confirmed', 'preparing'].includes(order.status) && (
          <Button
            variant="outline"
            fullWidth
            className="mt-6"
            loading={cancelOrder.isPending}
            onPress={() => {
              const reasons = [
                'Changed my mind',
                'Ordered by mistake',
                "Pickup time doesn't work",
                'Other',
              ];
              Alert.alert('Cancel order', 'Why are you cancelling this order?', [
                ...reasons.map((reason) => ({
                  text: reason,
                  onPress: () => {
                    Alert.alert(
                      'Confirm cancellation',
                      `Your wallet will be refunded ${formatCurrency(order.total)}.`,
                      [
                        { text: 'Never mind', style: 'cancel' },
                        {
                          text: 'Confirm',
                          style: 'destructive',
                          onPress: () =>
                            cancelOrder.mutate(
                              { id: order.id, reason },
                              { onSuccess: () => setCancelSuccess(true) }
                            ),
                        },
                      ]
                    );
                  },
                })),
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
          >
            Cancel order
          </Button>
        )}

        {cancelSuccess && (
          <Card variant="outlined" className="mt-4 border-success/30 bg-success/10">
            <Text variant="body-sm" className="text-center font-semibold text-success">
              Order cancelled and refunded.
            </Text>
          </Card>
        )}
      </View>
    </Screen>
  );
}
