import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { Image } from '@/src/components/ui/Image';
import { Minus, Plus, Trash2, ShoppingCart, Clock, MapPin, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Button } from '@/src/components/ui/Button';
import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/layout/Screen';
import { Header } from '@/src/components/layout/Header';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useMerchant } from '@/src/hooks/useMerchants';
import { useCreateOrder } from '@/src/hooks/useOrders';
import { useAuthStore } from '@/src/stores/auth';
import { useCartStore } from '@/src/stores/cart';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import {
  formatCurrency,
  formatDistance,
  calculateDistance,
  formatPickupWindow,
  generatePickupCode,
} from '@/src/lib/utils';
import { DEFAULT_USER_LOCATION } from '@/src/lib/constants';
import { repositories } from '@/src/repositories';
import { scheduleLocalNotification, schedulePickupReminder } from '@/src/services/notifications';
import type { OrderItem } from '@/src/types';

export default function CartScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();

  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clear);
  const cartSubtotal = useCartStore((s) => s.subtotal());

  const createOrder = useCreateOrder();
  const [note, setNote] = useState('');

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const merchantId = item.listing.merchantId;
    if (!acc[merchantId]) acc[merchantId] = [];
    acc[merchantId].push(item);
    return acc;
  }, {});

  const merchantIds = Object.keys(grouped);
  const firstMerchantId = merchantIds[0] ?? '';
  const { data: merchant, isLoading: merchantLoading } = useMerchant(firstMerchantId);

  const discount = items.reduce(
    (sum, item) => sum + (item.listing.originalPrice - item.listing.salePrice) * item.quantity,
    0
  );
  const total = cartSubtotal;

  const firstListing = items[0]?.listing;

  const handleConfirm = async () => {
    if (!user || !merchant || items.length === 0 || createOrder.isPending) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const orderItems: OrderItem[] = items.map((item) => ({
      listingId: item.listing.id,
      title: item.listing.title,
      quantity: item.quantity,
      unitPrice: item.listing.salePrice,
      totalPrice: item.listing.salePrice * item.quantity,
      imageUrl: item.listing.images[0],
    }));

    const orderData = {
      customerId: user.id,
      merchantId: merchant.id,
      merchantName: merchant.name,
      merchantLogoUrl: merchant.logoUrl,
      items: orderItems,
      subtotal: cartSubtotal,
      discount,
      couponDiscount: 0,
      total,
      status: 'pending' as const,
      pickupCode: generatePickupCode(),
      pickupWindowStart: firstListing?.pickupWindowStart ?? new Date().toISOString(),
      pickupWindowEnd: firstListing?.pickupWindowEnd ?? new Date().toISOString(),
      notes: note.trim() || undefined,
    };

    createOrder.mutate(orderData, {
      onSuccess: (order) => {
        if (!order) {
          // Offline: order was enqueued and will sync later.
          clearCart();
          router.replace('/(customer)/(tabs)/orders' as any);
          return;
        }

        repositories.wallet
          .spend(user.id, total, t('customer.cart.purchaseNote', { merchant: merchant.name }))
          .catch(() => {});

        clearCart();

        scheduleLocalNotification(
          t('customer.notifications.orderConfirmed.title'),
          t('customer.notifications.orderConfirmed.body', {
            merchant: merchant.name,
            code: order.pickupCode,
          }),
          { orderId: order.id, type: 'order_confirmed' },
          undefined,
          'order_update',
          `/(customer)/order/${order.id}`
        ).catch(() => {});

        scheduleLocalNotification(
          t('merchant.notifications.newOrder.title'),
          t('merchant.notifications.newOrder.body', {
            customer: user.name,
            total: formatCurrency(order.total),
          }),
          { orderId: order.id, type: 'new_order' },
          undefined,
          undefined,
          `/(merchant)/(tabs)/orders`
        ).catch(() => {});

        schedulePickupReminder(merchant.name, order.pickupWindowEnd, order.id).catch(() => {});

        router.replace(`/(customer)/order/${order.id}` as any);
      },
    });
  };

  if (items.length === 0) {
    return (
      <Screen className="bg-background">
        <Header title={t('customer.cart.title')} />
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-6 rounded-full bg-muted/10 p-6">
            <ShoppingCart size={48} color={colors.muted} />
          </View>
          <Text variant="h2" className="mb-2 text-center">
            {t('customer.cart.emptyTitle')}
          </Text>
          <Text className="mb-8 text-center text-muted">{t('customer.cart.emptySubtitle')}</Text>
          <Button fullWidth onPress={() => router.replace('/(customer)/(tabs)/discover' as any)}>
            {t('customer.cart.browseDeals')}
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen className="bg-background">
      <Header title={t('customer.cart.title')} />
      {merchantLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <>
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 160 }}
          >
            <View className="px-6 py-4">
              {merchant && (
                <Card variant="outlined" className="mb-4">
                  <View className="mb-3 flex-row items-start">
                    <MapPin size={18} color={colors.primary} className="mr-3 mt-0.5" />
                    <View className="flex-1">
                      <Text variant="body-sm" className="font-semibold">
                        {merchant.name}
                      </Text>
                      <Text variant="caption" className="text-muted">
                        {merchant.address.street}, {merchant.address.district}
                      </Text>
                      <Text variant="caption" className="text-muted">
                        {t('customer.merchant.distance', {
                          distance: formatDistance(
                            calculateDistance(DEFAULT_USER_LOCATION, merchant.coordinates)
                          ),
                        })}{' '}
                        · {merchant.address.district}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-start">
                    <AlertCircle size={18} color={colors.muted} className="mr-3 mt-0.5" />
                    <Text variant="caption" className="flex-1 text-muted">
                      {merchant.pickupInstructions}
                    </Text>
                  </View>
                </Card>
              )}

              <Card variant="outlined" className="mb-4">
                {merchantIds.map((merchantId) =>
                  grouped[merchantId].map((item, index) => {
                    const isLast =
                      index === grouped[merchantId].length - 1 &&
                      merchantId === merchantIds[merchantIds.length - 1];
                    return (
                      <View
                        key={item.listing.id}
                        className={`flex-row items-center py-3 ${
                          !isLast ? 'border-b border-border' : ''
                        }`}
                      >
                        <Image
                          source={{ uri: item.listing.images[0] }}
                          className="h-20 w-20 rounded-2xl"
                          resizeMode="cover"
                        />
                        <View className="ml-4 flex-1">
                          <Text variant="body-sm" className="font-semibold" numberOfLines={2}>
                            {item.listing.title}
                          </Text>
                          <Text variant="caption" className="text-muted">
                            {formatCurrency(item.listing.salePrice)} {t('customer.cart.each')}
                          </Text>
                          <Text className="mt-1 font-semibold text-primary">
                            {formatCurrency(item.listing.salePrice * item.quantity)}
                          </Text>
                        </View>
                        <View className="items-end">
                          <View className="mb-3 flex-row items-center">
                            <PressableScale
                              onPress={() => updateQuantity(item.listing.id, item.quantity - 1)}
                              className="rounded-xl bg-muted/10 p-2"
                              scale={0.9}
                              disabled={item.quantity <= 1}
                              accessibilityLabel={t('customer.cart.decreaseQuantity')}
                              hitSlop={8}
                            >
                              <Minus size={16} color={colors.foreground} />
                            </PressableScale>
                            <Text className="mx-3 w-5 text-center font-semibold">
                              {item.quantity}
                            </Text>
                            <PressableScale
                              onPress={() =>
                                updateQuantity(
                                  item.listing.id,
                                  Math.min(item.quantity + 1, item.listing.quantityRemaining)
                                )
                              }
                              className="rounded-xl bg-muted/10 p-2"
                              scale={0.9}
                              disabled={item.quantity >= item.listing.quantityRemaining}
                              accessibilityLabel={t('customer.cart.increaseQuantity')}
                              hitSlop={8}
                            >
                              <Plus size={16} color={colors.foreground} />
                            </PressableScale>
                          </View>
                          <PressableScale
                            onPress={() => removeItem(item.listing.id)}
                            className="rounded-xl bg-danger/10 p-2"
                            scale={0.9}
                            accessibilityLabel={t('customer.cart.removeItem')}
                            hitSlop={8}
                          >
                            <Trash2 size={16} color={colors.danger} />
                          </PressableScale>
                        </View>
                      </View>
                    );
                  })
                )}
              </Card>

              {firstListing && (
                <Card variant="outlined" className="mb-4">
                  <View className="flex-row items-center">
                    <Clock size={18} color={colors.primary} className="mr-3" />
                    <View className="flex-1">
                      <Text variant="body-sm" className="font-semibold">
                        {t('customer.listing.pickupWindow')}
                      </Text>
                      <Text variant="caption" className="text-muted">
                        {formatPickupWindow(
                          firstListing.pickupWindowStart,
                          firstListing.pickupWindowEnd,
                          i18n.language
                        )}
                      </Text>
                    </View>
                  </View>
                </Card>
              )}

              <Card variant="outlined" className="mb-4">
                <View className="mb-3 flex-row items-center justify-between">
                  <Text variant="body-sm" className="text-muted">
                    {t('customer.cart.subtotal')}
                  </Text>
                  <Text variant="body-sm">{formatCurrency(cartSubtotal)}</Text>
                </View>
                <View className="mb-3 flex-row items-center justify-between">
                  <Text variant="body-sm" className="text-muted">
                    {t('customer.cart.youSave')}
                  </Text>
                  <Text variant="body-sm" className="text-success">
                    -{formatCurrency(discount)}
                  </Text>
                </View>
                <View className="border-t border-border pt-3 flex-row items-center justify-between">
                  <Text className="font-semibold">{t('customer.cart.total')}</Text>
                  <Text className="text-xl font-bold text-primary">{formatCurrency(total)}</Text>
                </View>
              </Card>

              <Card variant="outlined">
                <Text variant="body-sm" className="text-muted">
                  {t('customer.cart.paymentNote')}
                </Text>
              </Card>
            </View>
          </ScrollView>

          <View className="border-t border-border bg-background px-6 py-4">
            <View className="mb-3">
              <Text variant="label" className="mb-2 text-muted">
                {t('customer.cart.orderNote')}
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder={t('customer.cart.orderNotePlaceholder')}
                placeholderTextColor={colors.muted}
                multiline
                maxLength={200}
                style={{
                  minHeight: 60,
                  textAlignVertical: 'top',
                  color: colors.foreground,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  fontFamily: 'Inter',
                  fontSize: 14,
                }}
              />
            </View>
            <Button
              fullWidth
              loading={createOrder.isPending}
              disabled={createOrder.isPending || !merchant}
              onPress={handleConfirm}
            >
              {t('customer.cart.confirmOrder')} · {formatCurrency(total)}
            </Button>
          </View>
        </>
      )}
    </Screen>
  );
}
