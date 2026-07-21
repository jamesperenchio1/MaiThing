import { View, Text, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../src/lib/supabase';
import { formatThb } from '@maithing/shared';
import type { Tables } from '@maithing/shared';
import {
  Screen,
  Card,
  Badge,
  Button,
  EmptyState,
  LoadingState,
  ErrorState,
} from '../../src/components/ui';
import { useTheme } from '../../src/theme';
import { icons } from '../../src/icons';
import type { BadgeVariant } from '../../src/components/ui/Badge';

type OrderStatus = Tables<'orders'>['status'];

type OrderRow = {
  id: string;
  status: OrderStatus;
  amount_thb: number;
  pickup_code: string;
  created_at: string;
  listing: { title: string } | null;
  location: { name: string } | null;
  pickup_slot: { starts_at: string; ends_at: string } | null;
};

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  reserved: 'warning',
  paid: 'success',
  collected: 'muted',
  cancelled: 'danger',
  refunded: 'default',
  no_show: 'danger',
};

function useOrders() {
  return useQuery<OrderRow[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          id, status, amount_thb, pickup_code, created_at,
          listing:listings(title),
          location:locations(name),
          pickup_slot:pickup_slots(starts_at, ends_at)
        `,
        )
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });
}

export default function OrdersScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors, spacing, fontSizes } = theme;
  const { data: orders = [], isLoading, error, refetch } = useOrders();

  const styles = makeStyles(colors, spacing, fontSizes);

  if (isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState
          title={t('common.error')}
          description={error.message}
          onRetry={() => void refetch()}
          retryLabel={t('common.retry')}
        />
      </Screen>
    );
  }

  if (orders.length === 0) {
    return (
      <Screen>
        <EmptyState
          title={t('order.noOrders')}
          icon={icons.bag}
          action={{
            label: t('discover.title'),
            onPress: () => router.push('/(buyer)/discover'),
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <Text style={styles.title}>{t('order.myOrders')}</Text>
      <FlashList
        data={orders}
        estimatedItemSize={110}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderCard order={item} t={t} colors={colors} spacing={spacing} fontSizes={fontSizes} />
        )}
        contentContainerStyle={styles.list}
      />
    </Screen>
  );
}

function OrderCard({
  order,
  t,
  colors,
  spacing,
  fontSizes,
}: {
  order: OrderRow;
  t: (key: string) => string;
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  fontSizes: ReturnType<typeof useTheme>['fontSizes'];
}) {
  const styles = makeCardStyles(colors, spacing, fontSizes);
  const variant = STATUS_VARIANT[order.status] ?? 'default';
  const isActive = order.status === 'reserved' || order.status === 'paid';

  return (
    <Card style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.listingTitle} numberOfLines={1}>
          {order.listing?.title ?? '—'}
        </Text>
        <Badge variant={variant} size="sm">
          {t(`order.status.${order.status}`)}
        </Badge>
      </View>
      <Text style={styles.locationName}>{order.location?.name ?? '—'}</Text>
      {order.pickup_slot && (
        <Text style={styles.slotText}>
          {new Date(order.pickup_slot.starts_at).toLocaleString('th-TH', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      )}
      <View style={styles.cardBottom}>
        <Text style={styles.amount}>{formatThb(order.amount_thb)}</Text>
        {isActive ? (
          <Text style={styles.codeLabel}>
            {t('order.pickupCode')}: <Text style={styles.code}>{order.pickup_code}</Text>
          </Text>
        ) : null}
      </View>
      <Button
        variant="secondary"
        size="sm"
        onPress={() => router.push(`/(buyer)/order/${order.id}`)}
        testID={`order-card-${order.id}`}
      >
        {t('common.next')}
      </Button>
    </Card>
  );
}

function makeStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  fontSizes: ReturnType<typeof useTheme>['fontSizes'],
) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    title: {
      fontSize: fontSizes.xl,
      fontWeight: '700',
      color: colors.text,
      padding: spacing[4],
      paddingBottom: spacing[2],
    },
    list: {
      padding: spacing[3],
    },
  });
}

function makeCardStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  fontSizes: ReturnType<typeof useTheme>['fontSizes'],
) {
  return StyleSheet.create({
    card: {
      marginBottom: spacing[3],
    },
    cardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing[1],
    },
    listingTitle: {
      fontSize: fontSizes.md,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      marginRight: spacing[2],
    },
    locationName: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
      marginBottom: spacing[1],
    },
    slotText: {
      fontSize: fontSizes.xs,
      color: colors.textMuted,
      marginBottom: spacing[2],
    },
    cardBottom: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing[3],
    },
    amount: {
      fontSize: fontSizes.md,
      fontWeight: '700',
      color: colors.primary,
    },
    codeLabel: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
    },
    code: {
      fontWeight: '700',
      color: colors.text,
      letterSpacing: 2,
    },
  });
}
