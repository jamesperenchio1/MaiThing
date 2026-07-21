import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useMerchantOrg } from '../../src/hooks/useProfile';
import { useMerchantOrders, type OrderWithDetails } from '../../src/hooks/useMerchant';
import { collectOrder } from '../../src/lib/merchant';
import { formatThb } from '@maithing/shared';
import { useTheme } from '../../src/theme';
import {
  Screen,
  Card,
  LoadingState,
  ErrorState,
  EmptyState,
  Button,
} from '../../src/components/ui';

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function TodayScreen() {
  const { t } = useTranslation();
  const { colors, spacing, fontSizes, fontWeights } = useTheme();
  const queryClient = useQueryClient();
  const { locations, isLoading: orgLoading, error: orgError } = useMerchantOrg();
  const locationIds = locations.map((l) => l.id);
  const {
    data: orders = [],
    isLoading: ordersLoading,
    error: ordersError,
  } = useMerchantOrders(locationIds);

  const todayOrders = orders.filter(
    (o) =>
      isToday(o.pickup_slot?.starts_at ?? o.created_at) && ['reserved', 'paid'].includes(o.status),
  );

  const [collectingId, setCollectingId] = useState<string | null>(null);

  const markCollected = async (order: OrderWithDetails) => {
    setCollectingId(order.id);
    try {
      await collectOrder(order.id, order.pickup_code);
      await queryClient.invalidateQueries({ queryKey: ['merchant-orders'] });
    } finally {
      setCollectingId(null);
    }
  };

  const styles = makeStyles(colors, spacing, fontSizes, fontWeights);

  if (orgLoading || ordersLoading) {
    return <LoadingState />;
  }

  if (orgError || ordersError) {
    return (
      <Screen>
        <ErrorState
          title={t('common.error')}
          description={orgError?.message ?? ordersError?.message ?? t('common.unknownError')}
          onRetry={() => {
            void queryClient.invalidateQueries();
          }}
          retryLabel={t('common.retry')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('merchant.today')}</Text>
          <Button variant="secondary" size="sm" onPress={() => router.push('/(merchant)/collect')}>
            {t('merchant.scanQr')}
          </Button>
        </View>

        {todayOrders.length === 0 ? (
          <EmptyState
            title={t('merchant.noOrdersToday')}
            description={t('merchant.collectSubtitle')}
            icon="calendar-outline"
            action={{
              label: t('merchant.scanQr'),
              onPress: () => router.push('/(merchant)/collect'),
            }}
          />
        ) : (
          todayOrders.map((order) => (
            <Card key={order.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.buyerName}>
                  {order.buyer?.display_name ?? t('merchant.anonymousBuyer')}
                </Text>
                <Text style={styles.code}>{order.pickup_code}</Text>
              </View>
              <Text style={styles.listingTitle}>{order.listing?.title ?? '—'}</Text>
              {order.pickup_slot && (
                <Text style={styles.slotText}>
                  {formatTime(order.pickup_slot.starts_at)} –{' '}
                  {formatTime(order.pickup_slot.ends_at)}
                </Text>
              )}
              {order.items && order.items.length > 0 && (
                <View style={styles.items}>
                  {order.items.map((item) => (
                    <Text key={item.id} style={styles.itemText}>
                      {item.qty}x {item.name_snapshot}
                    </Text>
                  ))}
                </View>
              )}
              <View style={styles.cardBottom}>
                <Text style={styles.amount}>{formatThb(order.amount_thb)}</Text>
                <Button
                  size="sm"
                  loading={collectingId === order.id}
                  disabled={collectingId !== null}
                  onPress={() => {
                    void markCollected(order);
                  }}
                >
                  {t('merchant.markCollected')}
                </Button>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function makeStyles(
  colors: ReturnType<typeof import('../../src/theme').useTheme>['colors'],
  spacing: ReturnType<typeof import('../../src/theme').useTheme>['spacing'],
  fontSizes: ReturnType<typeof import('../../src/theme').useTheme>['fontSizes'],
  fontWeights: ReturnType<typeof import('../../src/theme').useTheme>['fontWeights'],
) {
  return StyleSheet.create({
    container: {
      padding: spacing[5],
      paddingTop: spacing[7],
      flexGrow: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing[5],
    },
    title: {
      fontSize: fontSizes['2xl'],
      fontWeight: fontWeights.bold,
      color: colors.text,
    },
    card: {
      marginBottom: spacing[3],
    },
    cardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing[2],
    },
    buyerName: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.bold,
      color: colors.text,
    },
    code: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.bold,
      color: colors.primary,
      letterSpacing: 2,
    },
    listingTitle: {
      fontSize: fontSizes.base,
      color: colors.textMuted,
      marginBottom: spacing[1],
    },
    slotText: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
      marginBottom: spacing[3],
    },
    items: {
      marginBottom: spacing[3],
      gap: spacing[1],
    },
    itemText: {
      fontSize: fontSizes.sm,
      color: colors.text,
    },
    cardBottom: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing[2],
    },
    amount: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.bold,
      color: colors.primary,
    },
  });
}
