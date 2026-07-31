import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, Image, Platform, ActivityIndicator, Modal } from 'react-native';
import { Minus, Plus, Clock, MapPin, AlertCircle, CheckCircle, Calendar } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
// Lazy-loaded so Expo Go doesn't crash on missing native CalendarNext module
let ExpoCalendar: typeof import('expo-calendar') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ExpoCalendar = require('expo-calendar');
} catch {
  // not available in Expo Go
}

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
import type { Order, Listing } from '@/src/types';

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
  const [calendarAdded, setCalendarAdded] = useState(false);
  const [upsellListings, setUpsellListings] = useState<Listing[]>([]);
  const [showUpsell, setShowUpsell] = useState(false);

  const handleAddToCalendar = async (o: Order) => {
    if (Platform.OS === 'web' || !ExpoCalendar) return;
    try {
      const { status } = await ExpoCalendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') return;
      const calendars = await ExpoCalendar.getCalendarsAsync(ExpoCalendar.EntityTypes.EVENT);
      const writable = calendars.find((c) => c.allowsModifications);
      if (!writable) return;
      await ExpoCalendar.createEventAsync(writable.id, {
        title: `Pickup: ${o.merchantName}`,
        startDate: new Date(o.pickupWindowStart),
        endDate: new Date(o.pickupWindowEnd),
        notes: `Pickup code: ${o.pickupCode}`,
        location: o.merchantName,
      });
      setCalendarAdded(true);
      setTimeout(() => setCalendarAdded(false), 2000);
    } catch {
      // silently ignore calendar write failures
    }
  };

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
      mockRepositories.listings.getListings().then((all) => {
        const nearby = all
          .filter(
            (l) =>
              l.merchantId !== newOrder.merchantId &&
              l.status === 'active' &&
              l.quantityRemaining > 0
          )
          .slice(0, 3);
        setUpsellListings(nearby);
        setShowUpsell(true);
      });
      mockRepositories.wallet.addPurchasePoints(user.id, newOrder.total).then(() => {
        queryClient.invalidateQueries({ queryKey: ['wallet-rewards', user.id] });
      });
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

      const pickupStart = new Date(newOrder.pickupWindowStart);
      const reminderTime = new Date(pickupStart.getTime() - 30 * 60 * 1000);
      if (reminderTime > new Date()) {
        scheduleNotificationAtDate(
          'Pickup reminder',
          `Your pickup at ${merchant.name} is in 30 minutes! Code: ${newOrder.pickupCode}`,
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
        <Modal
          visible={showUpsell}
          animationType="slide"
          transparent
          onRequestClose={() => setShowUpsell(false)}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="rounded-t-3xl bg-background px-5 pb-8 pt-5">
              <Text variant="h3" className="mb-4 text-center">
                Rescue more food nearby 🌍
              </Text>
              {upsellListings.map((item) => {
                const discountPct = Math.round(
                  ((item.originalPrice - item.salePrice) / item.originalPrice) * 100
                );
                return (
                  <PressableScale
                    key={item.id}
                    scale={0.97}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowUpsell(false);
                      router.push(`/(customer)/listing/${item.id}`);
                    }}
                    className="mb-3 flex-row items-center rounded-2xl border border-border bg-card p-3"
                  >
                    <Image
                      source={{ uri: item.images[0] }}
                      className="h-16 w-16 rounded-xl"
                      resizeMode="cover"
                    />
                    <View className="ml-3 flex-1">
                      <Text variant="body-sm" className="font-semibold" numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text variant="caption" className="text-muted" numberOfLines={1}>
                        {item.category}
                      </Text>
                      <View className="mt-1 flex-row items-center">
                        <Text variant="body-sm" className="font-bold text-primary">
                          {formatCurrency(item.salePrice)}
                        </Text>
                        <Text
                          variant="caption"
                          className="ml-2 text-muted line-through"
                        >
                          {formatCurrency(item.originalPrice)}
                        </Text>
                        <Badge variant="success" className="ml-2">
                          -{discountPct}%
                        </Badge>
                      </View>
                    </View>
                  </PressableScale>
                );
              })}
              <Button
                variant="outline"
                fullWidth
                onPress={() => setShowUpsell(false)}
                className="mt-2"
              >
                No thanks
              </Button>
            </View>
          </View>
        </Modal>
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
          {Platform.OS !== 'web' && (
            <View className="mt-3 w-full">
              <Button
                variant="outline"
                fullWidth
                onPress={() => handleAddToCalendar(order)}
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
