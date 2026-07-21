import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMerchantOrg } from '../../src/hooks/useProfile';
import { useMerchantOrders } from '../../src/hooks/useMerchant';
import { formatThb } from '@maithing/shared';
import { useTheme } from '../../src/theme';
import { Screen, Card, LoadingState, EmptyState, Icon, Badge } from '../../src/components/ui';

export default function AnalyticsScreen() {
  const { t } = useTranslation();
  const { colors, spacing, fontSizes, fontWeights } = useTheme();
  const { locations, isLoading: orgLoading } = useMerchantOrg();
  const locationIds = locations.map((l) => l.id);
  const { data: orders = [], isLoading: ordersLoading } = useMerchantOrders(locationIds);

  const collectedOrders = orders.filter((o) => o.status === 'collected');
  const totalSales = collectedOrders.reduce((sum, o) => sum + o.amount_thb, 0);
  const mealsSaved = collectedOrders.reduce((sum, o) => sum + o.qty, 0);
  const avgRating =
    locations.length > 0
      ? locations.reduce((sum, l) => sum + l.rating_avg, 0) / locations.length
      : 0;
  const recentOrders = orders.slice(0, 5);

  if (orgLoading || ordersLoading) {
    return <LoadingState />;
  }

  const styles = makeStyles(colors, spacing, fontSizes, fontWeights);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('merchant.analytics')}</Text>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{formatThb(totalSales)}</Text>
            <Text style={styles.statLabel}>{t('merchant.totalSales')}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{mealsSaved}</Text>
            <Text style={styles.statLabel}>{t('merchant.mealsSaved')}</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.ratingRow}>
              <Text style={styles.statValue}>{avgRating.toFixed(1)}</Text>
              <Icon name="star" size={18} color={colors.warning} style={styles.star} />
            </View>
            <Text style={styles.statLabel}>{t('merchant.ratingAverage')}</Text>
          </Card>
        </View>

        <Text style={styles.sectionTitle}>{t('merchant.recentOrders')}</Text>
        {recentOrders.length === 0 ? (
          <EmptyState title={t('merchant.noOrdersYet')} icon="receipt-outline" />
        ) : (
          recentOrders.map((order) => (
            <Card key={order.id} style={styles.orderCard}>
              <View style={styles.orderRow}>
                <Text style={styles.orderListing}>{order.listing?.title ?? '—'}</Text>
                <Text style={styles.orderAmount}>{formatThb(order.amount_thb)}</Text>
              </View>
              <Text style={styles.orderMeta}>
                {order.buyer?.display_name ?? t('merchant.anonymousBuyer')}
              </Text>
              <Badge variant={order.status === 'collected' ? 'success' : 'muted'} size="sm">
                {t(`order.status.${order.status}`)}
              </Badge>
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
    title: {
      fontSize: fontSizes['2xl'],
      fontWeight: fontWeights.bold,
      color: colors.text,
      marginBottom: spacing[5],
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing[3],
      marginBottom: spacing[7],
    },
    statCard: {
      flex: 1,
      minWidth: '30%',
    },
    statValue: {
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.bold,
      color: colors.primary,
      marginBottom: spacing[1],
    },
    statLabel: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    star: {
      marginLeft: spacing[1],
    },
    sectionTitle: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.bold,
      color: colors.text,
      marginBottom: spacing[3],
    },
    orderCard: {
      marginBottom: spacing[3],
    },
    orderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing[1],
    },
    orderListing: {
      fontSize: fontSizes.base,
      fontWeight: fontWeights.semibold,
      color: colors.text,
      flex: 1,
      marginRight: spacing[2],
    },
    orderAmount: {
      fontSize: fontSizes.base,
      fontWeight: fontWeights.bold,
      color: colors.primary,
    },
    orderMeta: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
      marginBottom: spacing[2],
    },
  });
}
