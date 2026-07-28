import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, Image, Platform, ActivityIndicator } from 'react-native';
import { Minus, Plus, Clock, MapPin, AlertCircle, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Button } from '@/src/components/ui/Button';
import { Text } from '@/src/components/ui/Text';
import { Badge } from '@/src/components/ui/Badge';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/layout/Screen';
import { Header } from '@/src/components/layout/Header';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useListing } from '@/src/hooks/useListings';
import { useMerchant } from '@/src/hooks/useMerchants';
import { useNotificationPreferences } from '@/src/hooks/useNotifications';
import { useAuthStore } from '@/src/stores/auth';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import {
  formatCurrency,
  formatDistance,
  calculateDistance,
  generatePickupCode,
  formatPickupWindow,
} from '@/src/lib/utils';
import { DEFAULT_USER_LOCATION } from '@/src/lib/constants';
import { mockRepositories } from '@/src/repositories/mock';
import {
  scheduleLocalNotification,
  scheduleNotificationAtDate,
} from '@/src/services/notifications';
import type { Order } from '@/src/types';

export default function ConfirmOrderScreen() {
  const router = useRouter();
  const { id, quantity: quantityParam } = useLocalSearchParams<{
    id: string;
    quantity?: string;
  }>();
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();
  const { data: listing, isLoading: listingLoading } = useListing(id);
  const { data: merchant } = useMerchant(listing?.merchantId ?? '');
  const { data: preferences } = useNotificationPreferences(user?.id ?? '');
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(Math.max(1, Number(quantityParam) || 1));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (listing) {
      setQuantity((q) => Math.max(1, Math.min(q, listing.quantityRemaining)));
    }
  }, [listing]);

  if (listingLoading || !listing) {
    return (
      <Screen>
        <Header title="Confirm order" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  const isMystery = listing.type === 'mystery_box';
  const discount = listing.originalPrice - listing.salePrice;
  const subtotal = listing.salePrice * quantity;
  const totalDiscount = discount * quantity;
  const total = subtotal;
  const isSoldOut = listing.quantityRemaining === 0;
  const distance = merchant
    ? formatDistance(calculateDistance(DEFAULT_USER_LOCATION, merchant.coordinates))
    : null;

  const handleConfirm = async () => {
    if (!user || !merchant) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSubmitting(true);
    try {
      const newOrder = await mockRepositories.orders.createOrder({
        customerId: user.id,
        merchantId: merchant.id,
        merchantName: merchant.name,
        merchantLogoUrl: merchant.logoUrl,
        items: [
          {
            listingId: listing.id,
            title: listing.title,
            quantity,
            unitPrice: listing.salePrice,
            totalPrice: total,
            imageUrl: listing.images[0],
          },
        ],
        subtotal,
        discount: totalDiscount,
        total,
        status: 'confirmed',
        pickupCode: generatePickupCode(),
        pickupWindowStart: listing.pickupWindowStart,
        pickupWindowEnd: listing.pickupWindowEnd,
      });
      setOrder(newOrder);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      scheduleLocalNotification(
        'Order confirmed',
        `Your order from ${merchant.name} has been confirmed. Pickup code: ${newOrder.pickupCode}`,
        { orderId: newOrder.id, type: 'order_confirmed' },
        preferences,
        'order_update',
        `/(customer)/order/${newOrder.id}`
      ).catch(() => {});
      scheduleLocalNotification(
        'New order received',
        `You have a new order from ${user.name} for ${formatCurrency(newOrder.total)}`,
        { orderId: newOrder.id, type: 'new_order' },
        undefined,
        undefined,
        `/(merchant)/(tabs)/orders`
      ).catch(() => {});

      const pickupEnd = new Date(newOrder.pickupWindowEnd);
      const reminderTime = new Date(pickupEnd.getTime() - 30 * 60 * 1000);
      if (reminderTime > new Date() && preferences?.orderUpdates) {
        scheduleNotificationAtDate(
          'Pickup reminder',
          `Your order from ${merchant.name} is ready for pickup soon. Code: ${newOrder.pickupCode}`,
          reminderTime,
          { orderId: newOrder.id, type: 'pickup_reminder' },
          `/(customer)/order/${newOrder.id}`
        ).catch(() => {});
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (order) {
    return (
      <Screen className="bg-background">
        <Header title="Order confirmed" />
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-6 rounded-full bg-primary/10 p-4">
            <CheckCircle size={48} color={colors.primary} />
          </View>
          <Text variant="h2" className="mb-2 text-center">
            Order confirmed!
          </Text>
          <Text className="mb-6 text-center text-muted">
            Show your pickup code at {merchant?.name}
          </Text>
          <Card className="mb-6 items-center bg-primary p-6">
            <Text variant="caption" className="mb-1 text-white/80">
              Pickup code
            </Text>
            <Text className="text-3xl font-mono font-bold tracking-widest text-white">
              {order.pickupCode}
            </Text>
          </Card>
          <Button fullWidth onPress={() => router.replace(`/(customer)/order/${order.id}` as any)}>
            View order details
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen className="bg-background">
      <Header title="Confirm order" />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <View className="px-6 pt-4">
          <View className="mb-4 flex-row items-start">
            <Image
              source={{ uri: listing.images[0] }}
              className="h-24 w-24 rounded-2xl"
              resizeMode="cover"
            />
            <View className="ml-4 flex-1">
              <Badge variant={isMystery ? 'warning' : 'info'} className="mb-2 self-start">
                {isMystery ? 'Mystery Box' : 'Fixed Item'}
              </Badge>
              <Text variant="body-sm" className="font-semibold" numberOfLines={2}>
                {listing.title}
              </Text>
              <Text variant="caption" className="text-muted">
                {merchant?.name}
                {distance ? ` · ${distance} away` : ''}
              </Text>
            </View>
          </View>

          <Card variant="outlined" className="mb-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text variant="body-sm" className="text-muted">
                Unit price
              </Text>
              <Text variant="body-sm">{formatCurrency(listing.salePrice)}</Text>
            </View>
            <View className="mb-3 flex-row items-center justify-between">
              <Text variant="body-sm" className="text-muted">
                Quantity
              </Text>
              <View className="flex-row items-center">
                <PressableScale
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="rounded-xl bg-muted/10 p-2"
                  scale={0.9}
                  disabled={quantity <= 1}
                >
                  <Minus size={18} color={colors.foreground} />
                </PressableScale>
                <Text className="mx-4 w-6 text-center font-semibold">{quantity}</Text>
                <PressableScale
                  onPress={() => setQuantity((q) => Math.min(q + 1, listing.quantityRemaining))}
                  className="rounded-xl bg-muted/10 p-2"
                  scale={0.9}
                  disabled={quantity >= listing.quantityRemaining}
                >
                  <Plus size={18} color={colors.foreground} />
                </PressableScale>
              </View>
            </View>
            <View className="mb-3 flex-row items-center justify-between">
              <Text variant="body-sm" className="text-muted">
                You save
              </Text>
              <Text variant="body-sm" className="text-success">
                -{formatCurrency(totalDiscount)}
              </Text>
            </View>
            <View className="border-t border-border pt-3 flex-row items-center justify-between">
              <Text className="font-semibold">Total</Text>
              <Text className="text-xl font-bold text-primary">{formatCurrency(total)}</Text>
            </View>
          </Card>

          <Card variant="outlined" className="mb-4">
            <View className="mb-3 flex-row items-center">
              <Clock size={18} color={colors.primary} className="mr-3" />
              <View className="flex-1">
                <Text variant="body-sm" className="font-semibold">
                  Pickup window
                </Text>
                <Text variant="caption" className="text-muted">
                  {formatPickupWindow(
                    listing.pickupWindowStart,
                    listing.pickupWindowEnd,
                    i18n.language
                  )}
                </Text>
              </View>
            </View>
            {merchant && (
              <>
                <View className="mb-3 flex-row items-start">
                  <MapPin size={18} color={colors.primary} className="mr-3 mt-0.5" />
                  <View className="flex-1">
                    <Text variant="body-sm" className="font-semibold">
                      Pickup location
                    </Text>
                    <Text variant="caption" className="text-muted">
                      {merchant.name} · {merchant.address.street}, {merchant.address.district}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-start">
                  <AlertCircle size={18} color={colors.muted} className="mr-3 mt-0.5" />
                  <Text variant="caption" className="flex-1 text-muted">
                    {merchant.pickupInstructions}
                  </Text>
                </View>
              </>
            )}
          </Card>

          <Card variant="outlined" className="mb-4">
            <Text variant="body-sm" className="text-muted">
              Payment will be deducted from your wallet balance. You can cancel anytime before
              pickup.
            </Text>
          </Card>
        </View>
      </ScrollView>

      <View className="border-t border-border bg-background px-6 py-4">
        <Button
          testID="confirm-order-button"
          fullWidth
          disabled={isSoldOut || isSubmitting}
          loading={isSubmitting}
          onPress={handleConfirm}
        >
          Confirm order · {formatCurrency(total)}
        </Button>
      </View>
    </Screen>
  );
}
