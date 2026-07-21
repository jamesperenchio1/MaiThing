import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useMerchantOrg } from '../../../src/hooks/useProfile';
import { useMerchantListings } from '../../../src/hooks/useMerchant';
import { formatThb } from '@maithing/shared';
import { useTheme } from '../../../src/theme';
import {
  Screen,
  Card,
  Button,
  LoadingState,
  ErrorState,
  EmptyState,
  Badge,
} from '../../../src/components/ui';

const statusVariant: Record<string, import('../../../src/components/ui/Badge').BadgeVariant> = {
  active: 'success',
  pending: 'warning',
  paused: 'muted',
  draft: 'default',
  sold_out: 'danger',
  expired: 'muted',
  cancelled: 'danger',
};

export default function ListingsScreen() {
  const { t } = useTranslation();
  const { colors, spacing, fontSizes, fontWeights } = useTheme();
  const {
    locations,
    isLoading: orgLoading,
    error: orgError,
    refetch: refetchOrg,
  } = useMerchantOrg();
  const locationIds = locations.map((l) => l.id);
  const {
    data: listings = [],
    isLoading: listingsLoading,
    error: listingsError,
    refetch: refetchListings,
  } = useMerchantListings(locationIds);

  if (orgLoading || listingsLoading) {
    return <LoadingState />;
  }

  if (orgError || listingsError) {
    return (
      <Screen>
        <ErrorState
          title={t('common.error')}
          description={orgError?.message ?? listingsError?.message ?? t('common.unknownError')}
          onRetry={() => {
            void refetchOrg();
            void refetchListings();
          }}
          retryLabel={t('common.retry')}
        />
      </Screen>
    );
  }

  const styles = makeStyles(colors, spacing, fontSizes, fontWeights);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('merchant.listings')}</Text>
          <Button size="sm" onPress={() => router.push('/(merchant)/listings/new')}>
            {t('merchant.publish')}
          </Button>
        </View>

        {listings.length === 0 ? (
          <EmptyState
            title={t('merchant.noListings')}
            description={t('merchant.publishFirstListing')}
            icon="restaurant-outline"
            action={{
              label: t('merchant.publishFirstListing'),
              onPress: () => router.push('/(merchant)/listings/new'),
            }}
          />
        ) : (
          listings.map((listing) => (
            <Card key={listing.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{listing.title}</Text>
                <Badge variant={statusVariant[listing.status] ?? 'default'} size="sm">
                  {t(`merchant.status.${listing.status}`)}
                </Badge>
              </View>
              <Text style={styles.cardType}>{t(`listing.${listing.fulfillment_type}`)}</Text>
              <View style={styles.cardBottom}>
                <Text style={styles.cardPrice}>{formatThb(listing.price_thb)}</Text>
                <Text style={styles.cardRemaining}>
                  {t('listing.remaining', { count: listing.qty_remaining })}
                </Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function makeStyles(
  colors: ReturnType<typeof import('../../../src/theme').useTheme>['colors'],
  spacing: ReturnType<typeof import('../../../src/theme').useTheme>['spacing'],
  fontSizes: ReturnType<typeof import('../../../src/theme').useTheme>['fontSizes'],
  fontWeights: ReturnType<typeof import('../../../src/theme').useTheme>['fontWeights'],
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
      alignItems: 'flex-start',
      marginBottom: spacing[1],
    },
    cardTitle: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.bold,
      color: colors.text,
      flex: 1,
      marginRight: spacing[2],
    },
    cardType: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
      marginBottom: spacing[3],
    },
    cardBottom: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardPrice: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.bold,
      color: colors.primary,
    },
    cardRemaining: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
    },
  });
}
