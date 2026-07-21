import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useMerchantOrg } from '../../src/hooks/useProfile';
import { collectOrder } from '../../src/lib/merchant';
import { formatThb } from '@maithing/shared';
import { useTheme } from '../../src/theme';
import { Screen, Card, Input, Button, ErrorState } from '../../src/components/ui';
import type { Tables } from '@maithing/shared';

type OrderRow = Tables<'orders'> & {
  buyer: { display_name: string | null } | null;
  listing: { title: string } | null;
  pickup_slot: Tables<'pickup_slots'> | null;
  location: { name: string } | null;
};

export default function CollectScreen() {
  const { t } = useTranslation();
  const { colors, spacing, fontSizes, fontWeights } = useTheme();
  const { locations } = useMerchantOrg();
  const locationIds = locations.map((l) => l.id);
  const [code, setCode] = useState('');
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const codeError = touched && !code.trim() ? t('merchant.required') : undefined;

  const search = async () => {
    setTouched(true);
    if (!code.trim() || locationIds.length === 0) return;
    setIsSearching(true);
    setError(null);
    setOrder(null);

    const { data, error: searchError } = await supabase
      .from('orders')
      .select(
        `
        *,
        buyer:profiles(display_name),
        listing:listings(title),
        pickup_slot:pickup_slots(*),
        location:locations(name)
      `,
      )
      .eq('pickup_code', code.trim().toUpperCase())
      .in('location_id', locationIds)
      .in('status', ['reserved', 'paid'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (searchError) {
      setError(searchError.message);
      setIsSearching(false);
      return;
    }

    if (!data || data.length === 0) {
      setError(t('merchant.orderNotFound'));
    } else {
      setOrder(data[0] as unknown as OrderRow);
    }
    setIsSearching(false);
  };

  const confirmCollect = async () => {
    if (!order) return;
    setIsCollecting(true);
    setError(null);
    try {
      await collectOrder(order.id, order.pickup_code);
      router.replace('/(merchant)/today');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
      setIsCollecting(false);
    }
  };

  const styles = makeStyles(colors, spacing, fontSizes, fontWeights);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('merchant.confirmPickup')}</Text>
        <Text style={styles.subtitle}>{t('merchant.collectSubtitle')}</Text>

        <View style={styles.row}>
          <View style={styles.codeInput}>
            <Input
              value={code}
              onChangeText={(v) => {
                setCode(v.toUpperCase());
                setError(null);
              }}
              placeholder={t('merchant.enterPickupCode')}
              autoCapitalize="characters"
              maxLength={6}
              error={codeError}
              onBlur={() => setTouched(true)}
            />
          </View>
          <Button
            onPress={() => void search()}
            loading={isSearching}
            disabled={!code.trim() || isSearching}
            size="lg"
          >
            {t('common.search')}
          </Button>
        </View>

        {error && <ErrorState title={t('common.error')} description={error} style={styles.error} />}

        {order && (
          <Card style={styles.orderCard}>
            <Text style={styles.orderTitle}>{order.listing?.title ?? '—'}</Text>
            <Text style={styles.orderDetail}>{order.location?.name ?? '—'}</Text>
            <Text style={styles.orderDetail}>
              {order.buyer?.display_name ?? t('merchant.anonymousBuyer')}
            </Text>
            <Text style={styles.orderCode}>
              {t('order.pickupCode')}: {order.pickup_code}
            </Text>
            <Text style={styles.orderAmount}>{formatThb(order.amount_thb)}</Text>

            <Button
              onPress={() => void confirmCollect()}
              loading={isCollecting}
              disabled={isCollecting}
              size="lg"
            >
              {t('merchant.confirmCollect')}
            </Button>
          </Card>
        )}

        <Button variant="ghost" onPress={() => router.back()}>
          {t('common.cancel')}
        </Button>
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
    title: {
      fontSize: fontSizes['2xl'],
      fontWeight: fontWeights.bold,
      color: colors.text,
      marginBottom: spacing[2],
    },
    subtitle: {
      fontSize: fontSizes.base,
      color: colors.textMuted,
      marginBottom: spacing[5],
    },
    row: {
      flexDirection: 'row',
      gap: spacing[3],
      marginBottom: spacing[4],
      alignItems: 'flex-start',
    },
    codeInput: {
      flex: 1,
    },
    error: {
      marginBottom: spacing[4],
    },
    orderCard: {
      marginBottom: spacing[5],
    },
    orderTitle: {
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.bold,
      color: colors.text,
      marginBottom: spacing[1],
    },
    orderDetail: {
      fontSize: fontSizes.base,
      color: colors.textMuted,
      marginBottom: spacing[1],
    },
    orderCode: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.bold,
      color: colors.primary,
      marginTop: spacing[3],
      letterSpacing: 2,
    },
    orderAmount: {
      fontSize: fontSizes['2xl'],
      fontWeight: fontWeights.bold,
      color: colors.primary,
      marginTop: spacing[2],
      marginBottom: spacing[4],
    },
  });
}
