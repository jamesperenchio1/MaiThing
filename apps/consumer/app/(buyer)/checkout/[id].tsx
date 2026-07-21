import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import { supabase } from '../../../src/lib/supabase';
import { capture } from '../../../src/lib/posthog';
import { useListingStore } from '../../../src/stores/listing';
import { formatThb } from '@maithing/shared';
import { Screen, Card, Button, Icon, LoadingState, ErrorState } from '../../../src/components/ui';
import { useTheme } from '../../../src/theme';
import { icons } from '../../../src/icons';

type ReserveOrderResponse = {
  order_id: string;
  pickup_code: string;
  qr_payload: string;
};

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors, spacing, fontSizes, fontWeights } = theme;
  const qc = useQueryClient();
  const { selectedSlot, pickedItems, reset } = useListingStore();
  const [orderId, setOrderId] = useState<string | null>(null);

  const {
    data: listing,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, price_thb, fulfillment_type, qty_remaining, location_id')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });

  const reserveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSlot) throw new Error('No slot selected');
      const items =
        pickedItems.length > 0
          ? pickedItems.map((i) => ({ listing_item_id: i.itemId, qty: i.qty }))
          : undefined;

      const { data, error } = await supabase.rpc('reserve_order', {
        p_listing_id: id,
        p_slot_id: selectedSlot.id,
        p_items: items as unknown as null,
      });
      if (error) throw error;
      const result = (data as unknown as ReserveOrderResponse[])[0];
      if (!result) throw new Error('Reservation returned no order');
      return result;
    },
    onSuccess: (order) => {
      setOrderId(order.order_id);
      capture('listing_reserved', { listing_id: id, order_id: order.order_id });
    },
    onError: (err: Error) => {
      Alert.alert(t('order.reservationFailed'), err.message);
    },
  });

  const createPaymentIntent = async (reservedOrderId: string): Promise<string> => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
    if (!supabaseUrl) throw new Error('Missing Supabase URL');

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) throw new Error('Not authenticated');

    const response = await fetch(`${supabaseUrl}/functions/v1/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.session.access_token}`,
      },
      body: JSON.stringify({ order_id: reservedOrderId }),
    });

    const result = (await response.json()) as { client_secret?: string; error?: string };
    if (!response.ok || !result.client_secret) {
      throw new Error(result.error ?? 'Could not create payment intent');
    }
    return result.client_secret;
  };

  const handlePayment = useCallback(
    async (reservedOrderId: string) => {
      const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY as string;
      if (!publishableKey) {
        Alert.alert(t('order.stripeNotConfigured'), t('order.paymentKeyMissing'));
        return;
      }

      try {
        const clientSecret = await createPaymentIntent(reservedOrderId);

        const { error: initError } = await initPaymentSheet({
          merchantDisplayName: 'MaiThing',
          paymentIntentClientSecret: clientSecret,
          defaultBillingDetails: { name: 'MaiThing Buyer' },
          allowsDelayedPaymentMethods: true,
        });
        if (initError) throw new Error(initError.message);

        const { error: paymentError } = await presentPaymentSheet();
        if (paymentError) throw new Error(paymentError.message);

        void qc.invalidateQueries({ queryKey: ['listing', id] });
        void qc.invalidateQueries({ queryKey: ['orders'] });
        reset();
        router.replace(`/(buyer)/order/${reservedOrderId}`);
      } catch (err) {
        Alert.alert(
          t('order.paymentFailed'),
          err instanceof Error ? err.message : t('common.unknownError'),
        );
      }
    },
    [id, qc, reset, t],
  );

  const handleConfirm = useCallback(() => {
    if (!selectedSlot) {
      Alert.alert(t('order.selectSlot'), t('order.selectSlot'));
      return;
    }
    if (orderId) {
      void handlePayment(orderId);
      return;
    }
    reserveMutation.mutate(undefined, {
      onSuccess: (order) => {
        void handlePayment(order.order_id);
      },
    });
  }, [selectedSlot, orderId, reserveMutation, handlePayment, t]);

  const styles = makeStyles(colors, spacing, fontSizes, fontWeights);

  if (isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (error || !listing) {
    return (
      <Screen>
        <ErrorState
          title={t('common.error')}
          description={error?.message}
          onRetry={() => void refetch()}
          retryLabel={t('common.retry')}
        />
      </Screen>
    );
  }

  const total = listing.price_thb;
  const isPending = reserveMutation.isPending;

  return (
    <Screen style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Icon name={icons.back} size={24} />
        </TouchableOpacity>

        <Text style={styles.heading}>{t('order.selectSlot')}</Text>

        {/* Listing summary */}
        <Card>
          <Text style={styles.listingTitle}>{listing.title}</Text>
          <Text style={styles.listingPrice}>
            {formatThb(listing.price_thb)} {t('listing.perBag')}
          </Text>
        </Card>

        {/* Slot summary */}
        {selectedSlot && (
          <Card>
            <Text style={styles.slotLabel}>{t('listing.pickupWindow')}</Text>
            <Text style={styles.slotValue}>
              {new Date(selectedSlot.starts_at).toLocaleString('th-TH', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
              {' – '}
              {new Date(selectedSlot.ends_at).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </Card>
        )}

        {/* Order total */}
        <Card style={styles.totalCard}>
          <Text style={styles.totalLabel}>{t('listing.total')}</Text>
          <Text style={styles.totalAmount}>{formatThb(total)}</Text>
        </Card>

        <Text style={styles.cancelPolicy}>{t('order.cancelPolicy')}</Text>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <Button size="lg" onPress={handleConfirm} loading={isPending} disabled={!selectedSlot}>
          {t('order.pay', { amount: total })}
        </Button>
      </View>
    </Screen>
  );
}

function makeStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  fontSizes: ReturnType<typeof useTheme>['fontSizes'],
  fontWeights: ReturnType<typeof useTheme>['fontWeights'],
) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    scroll: {
      padding: spacing[4],
    },
    backBtn: {
      marginBottom: spacing[4],
      padding: spacing[2],
      alignSelf: 'flex-start',
    },
    heading: {
      fontSize: fontSizes.xl,
      fontWeight: fontWeights.bold,
      color: colors.text,
      marginBottom: spacing[5],
    },
    listingTitle: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.semibold,
      color: colors.text,
      marginBottom: spacing[1],
    },
    listingPrice: {
      fontSize: fontSizes.base,
      color: colors.textMuted,
    },
    slotLabel: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
      marginBottom: spacing[2],
    },
    slotValue: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.semibold,
      color: colors.text,
    },
    totalCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing[3],
      backgroundColor: colors.successMuted,
      borderColor: colors.success,
    },
    totalLabel: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.semibold,
      color: colors.success,
    },
    totalAmount: {
      fontSize: fontSizes.xl,
      fontWeight: fontWeights.bold,
      color: colors.success,
    },
    cancelPolicy: {
      fontSize: fontSizes.xs,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing[3],
    },
    bottomSpacer: {
      height: spacing[8],
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surfaceElevated,
      padding: spacing[4],
      paddingBottom: spacing[6],
      borderTopWidth: 1,
      borderTopColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
  });
}
