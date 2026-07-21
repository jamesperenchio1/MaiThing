import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
  Platform,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useCreateThread } from '../../../src/hooks/useChat';
import { supabase } from '../../../src/lib/supabase';
import { formatThb } from '@maithing/shared';
import type { Tables } from '@maithing/shared';
import {
  Screen,
  Card,
  Button,
  Badge,
  Icon,
  LoadingState,
  ErrorState,
} from '../../../src/components/ui';
import { useTheme } from '../../../src/theme';
import { icons } from '../../../src/icons';
import type { BadgeVariant } from '../../../src/components/ui/Badge';

type OrderRow = Tables<'orders'>;
type OrderItemRow = Tables<'order_items'>;

type OrderDetail = {
  order: OrderRow;
  listing: { title: string } | null;
  location: { name: string; address_text: string } | null;
  pickup_slot: { starts_at: string; ends_at: string } | null;
  order_items: OrderItemRow[];
  has_review: boolean;
};

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  reserved: 'warning',
  paid: 'success',
  collected: 'muted',
  cancelled: 'danger',
  refunded: 'default',
  no_show: 'danger',
};

function useOrderDetail(id: string) {
  return useQuery<OrderDetail>({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(
          `
          *,
          listing:listings(title),
          location:locations(name, address_text),
          pickup_slot:pickup_slots(starts_at, ends_at),
          order_items:order_items(*)
        `,
        )
        .eq('id', id)
        .single();
      if (orderError) throw orderError;

      const { count, error: reviewError } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('order_id', id);
      if (reviewError) throw reviewError;

      const raw = order as unknown as {
        order_items: OrderItemRow[] | OrderItemRow;
        listing: { title: string } | null;
        location: { name: string; address_text: string } | null;
        pickup_slot:
          { starts_at: string; ends_at: string } | null | { starts_at: string; ends_at: string }[];
      } & OrderRow;

      const orderItems = Array.isArray(raw.order_items)
        ? raw.order_items
        : raw.order_items
          ? [raw.order_items]
          : [];
      const pickupSlot = Array.isArray(raw.pickup_slot) ? raw.pickup_slot[0] : raw.pickup_slot;

      return {
        order: raw,
        listing: raw.listing,
        location: raw.location,
        pickup_slot: pickupSlot ?? null,
        order_items: orderItems,
        has_review: (count ?? 0) > 0,
      };
    },
    staleTime: 30_000,
  });
}

function formatCountdown(target: Date): string {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return '0h 0m';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors, spacing, fontSizes, fontWeights } = theme;
  const qc = useQueryClient();
  const createThread = useCreateThread();
  const [now, setNow] = useState(new Date());
  const { data: orderDetail, isLoading, error, refetch } = useOrderDetail(id);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const cancelMutation = useMutation({
    mutationFn: async (order: OrderRow) => {
      const { error } = await supabase.rpc('cancel_order', { p_order_id: id });
      if (error) throw error;

      if (order.stripe_payment_intent_id) {
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) throw new Error('Not authenticated');

        const response = await fetch(`${supabaseUrl}/functions/v1/refund-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({ order_id: id }),
        });

        const result = (await response.json()) as {
          status?: string;
          refund_id?: string;
          error?: string;
        };
        if (!response.ok) {
          throw new Error(result.error ?? 'Refund failed');
        }
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['orders'] });
      void qc.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: (err: Error) => {
      Alert.alert(t('common.error'), err.message);
    },
  });

  const handleCancel = () => {
    Alert.alert(t('order.cancelTitle'), t('order.cancelConfirm'), [
      { text: t('common.back'), style: 'cancel' },
      {
        text: t('order.cancelConfirmBtn'),
        style: 'destructive',
        onPress: () => cancelMutation.mutate(order),
      },
    ]);
  };

  const openDirections = useCallback(() => {
    const address = orderDetail?.location?.address_text;
    if (!address) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    void Linking.openURL(url);
  }, [orderDetail]);

  const handleContactMerchant = useCallback(async () => {
    if (!orderDetail) return;
    const threadId = await createThread.mutateAsync({
      locationId: orderDetail.order.location_id,
      orderId: id,
    });
    router.push(`/(buyer)/chat/${threadId}`);
  }, [orderDetail, createThread, id]);

  const styles = makeStyles(colors, spacing, fontSizes, fontWeights);

  if (isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (error || !orderDetail) {
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

  const { order, listing, location, pickup_slot, order_items, has_review } = orderDetail;

  const variant = STATUS_VARIANT[order.status] ?? 'default';
  const isActive = order.status === 'reserved' || order.status === 'paid';
  const canCancel = isActive;
  const isCollected = order.status === 'collected';
  const slotStart = pickup_slot ? new Date(pickup_slot.starts_at) : null;
  const slotEnd = pickup_slot ? new Date(pickup_slot.ends_at) : null;
  const deadline = slotStart ? new Date(slotStart.getTime() - 2 * 60 * 60 * 1000) : null;
  const isCancelDeadlinePassed = deadline ? now > deadline : false;

  const qrUrl =
    Platform.OS === 'web'
      ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(order.qr_payload)}`
      : null;

  let pickupCountdown = '';
  if (slotStart) {
    if (now < slotStart) {
      pickupCountdown = t('order.timeRemaining', { time: formatCountdown(slotStart) });
    } else if (slotEnd && now < slotEnd) {
      pickupCountdown = t('order.pickupWindowEnds', {
        time: slotEnd.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      });
    }
  }

  return (
    <Screen style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Icon name={icons.back} size={24} />
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>

        {/* Status badge */}
        <View style={styles.statusBadge}>
          <Badge variant={variant} size="md">
            {t(`order.status.${order.status}`)}
          </Badge>
        </View>

        {/* Pickup code / QR */}
        {isActive && (
          <Card style={styles.codeCard}>
            <Text style={styles.codeLabel}>{t('order.pickupCode')}</Text>
            <Text style={styles.codeValue}>{order.pickup_code}</Text>
            {qrUrl && (
              <Image
                source={{ uri: qrUrl }}
                style={{ width: 120, height: 120, marginTop: 12, borderRadius: 8 }}
                accessibilityLabel={t('order.qrCode')}
              />
            )}
            <Text style={styles.codeHint}>{t('order.showToStaff')}</Text>
            {pickupCountdown ? <Text style={styles.countdown}>{pickupCountdown}</Text> : null}
          </Card>
        )}

        {/* Refund note */}
        {(order.status === 'refunded' || order.status === 'cancelled') && (
          <Card style={styles.refundCard}>
            <Text style={styles.refundText}>
              {order.status === 'refunded'
                ? t('order.refundProcessed')
                : t('order.cancelledNoRefund')}
            </Text>
          </Card>
        )}

        {/* Listing */}
        <Card>
          <Text style={styles.cardHeading}>{t('order.item')}</Text>
          <Text style={styles.cardBody}>{listing?.title ?? '—'}</Text>
          <Text style={styles.cardSub}>{formatThb(order.amount_thb)}</Text>
        </Card>

        {/* Location */}
        <Card>
          <Text style={styles.cardHeading}>{t('order.location')}</Text>
          <Text style={styles.cardBody}>{location?.name ?? '—'}</Text>
          {location?.address_text ? (
            <Text style={styles.cardSub}>{location.address_text}</Text>
          ) : null}
          <Button
            variant="secondary"
            size="sm"
            onPress={() => void handleContactMerchant()}
            loading={createThread.isPending}
            style={styles.contactBtn}
          >
            {t('chat.contactMerchant')}
          </Button>
        </Card>

        {/* Pickup window */}
        {slotStart && slotEnd && (
          <Card>
            <Text style={styles.cardHeading}>{t('order.pickupWindow')}</Text>
            <Text style={styles.cardBody}>
              {slotStart.toLocaleString('th-TH', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <Text style={styles.cardSub}>
              {'– '}
              {slotEnd.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {pickupCountdown ? <Text style={styles.countdown}>{pickupCountdown}</Text> : null}
          </Card>
        )}

        {/* Order items */}
        {order_items.length > 0 && (
          <Card>
            <Text style={styles.cardHeading}>{t('order.items')}</Text>
            {order_items.map((item) => (
              <Text key={item.id} style={styles.cardSub}>
                {item.qty}x {item.name_snapshot}
              </Text>
            ))}
          </Card>
        )}

        {/* Directions */}
        {location?.address_text && (
          <Button variant="secondary" size="md" onPress={openDirections}>
            {t('order.directions')}
          </Button>
        )}

        {/* Cancel */}
        {canCancel && (
          <View>
            {deadline && (
              <Text style={styles.deadlineText}>
                {t('order.cancelDeadline', {
                  time: deadline.toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                })}
              </Text>
            )}
            <Button
              variant="danger"
              size="md"
              onPress={handleCancel}
              disabled={isCancelDeadlinePassed || cancelMutation.isPending}
              loading={cancelMutation.isPending}
            >
              {isCancelDeadlinePassed ? t('order.cancelTooLate') : t('order.cancel')}
            </Button>
          </View>
        )}

        {/* Post-pickup actions */}
        {isCollected && (
          <View style={styles.postActions}>
            {has_review ? (
              <Text style={styles.reviewedText}>{t('order.reviewed')}</Text>
            ) : (
              <Button size="md" onPress={() => router.push(`/(buyer)/review/${id}`)}>
                {t('order.review')}
              </Button>
            )}
            <Button variant="danger" size="md" onPress={() => router.push(`/(buyer)/issue/${id}`)}>
              {t('order.reportIssue')}
            </Button>
          </View>
        )}
      </ScrollView>
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
      paddingBottom: spacing[9],
    },
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
      marginBottom: spacing[4],
    },
    backText: {
      fontSize: fontSizes.md,
      color: colors.text,
    },
    statusBadge: {
      alignSelf: 'center',
      marginBottom: spacing[4],
    },
    codeCard: {
      backgroundColor: colors.text,
      borderColor: colors.border,
      alignItems: 'center',
      marginBottom: spacing[4],
    },
    codeLabel: {
      fontSize: fontSizes.xs,
      color: colors.textInverse,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: spacing[2],
    },
    codeValue: {
      fontSize: 40,
      fontWeight: fontWeights.bold,
      color: colors.textInverse,
      letterSpacing: 6,
      marginBottom: spacing[2],
    },
    codeHint: {
      fontSize: fontSizes.xs,
      color: colors.textMuted,
      marginTop: spacing[3],
    },
    countdown: {
      fontSize: fontSizes.base,
      color: colors.primary,
      fontWeight: '600',
      marginTop: spacing[3],
    },
    refundCard: {
      backgroundColor: colors.borderSubtle,
      borderColor: colors.border,
      alignItems: 'center',
      marginBottom: spacing[4],
    },
    refundText: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.semibold,
      color: colors.textMuted,
    },
    cardHeading: {
      fontSize: fontSizes.xs,
      color: colors.textMuted,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: spacing[2],
    },
    cardBody: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.semibold,
      color: colors.text,
      marginBottom: spacing[1],
    },
    cardSub: {
      fontSize: fontSizes.base,
      color: colors.textMuted,
    },
    contactBtn: {
      marginTop: spacing[3],
    },
    deadlineText: {
      fontSize: fontSizes.xs,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: spacing[2],
    },
    postActions: {
      gap: spacing[3],
      marginTop: spacing[3],
    },
    reviewedText: {
      fontSize: fontSizes.base,
      color: colors.primary,
      fontWeight: '600',
      textAlign: 'center',
    },
  });
}
