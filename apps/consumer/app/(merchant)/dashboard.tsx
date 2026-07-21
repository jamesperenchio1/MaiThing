import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMerchantOrg } from '../../src/hooks/useProfile';
import { useMerchantListings, useMerchantOrders } from '../../src/hooks/useMerchant';
import { useTheme } from '../../src/theme';
import { Screen, Card, LoadingState, Icon } from '../../src/components/ui';

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function MerchantDashboardScreen() {
  const { t } = useTranslation();
  const { colors, spacing, fontSizes, fontWeights } = useTheme();
  const { org, locations, isLoading: orgLoading } = useMerchantOrg();
  const locationIds = locations.map((l) => l.id);
  const { data: listings = [], isLoading: listingsLoading } = useMerchantListings(locationIds);
  const { data: orders = [], isLoading: ordersLoading } = useMerchantOrders(locationIds);

  const activeListings = listings.filter((l) => l.status === 'active').length;
  const todayReservations = orders.filter(
    (o) =>
      isToday(o.pickup_slot?.starts_at ?? o.created_at) && ['reserved', 'paid'].includes(o.status),
  ).length;

  if (orgLoading || listingsLoading || ordersLoading) {
    return <LoadingState />;
  }

  const styles = makeStyles(colors, spacing, fontSizes, fontWeights);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.greeting}>{t('merchant.welcome')}</Text>
        <Text style={styles.orgName}>{org?.name ?? '—'}</Text>
        <Text style={styles.orgStatus}>
          {org?.verified_at ? t('merchant.verified') : t('merchant.pendingVerification')}
        </Text>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{activeListings}</Text>
            <Text style={styles.statLabel}>{t('merchant.activeListings')}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{todayReservations}</Text>
            <Text style={styles.statLabel}>{t('merchant.todayReservations')}</Text>
          </Card>
        </View>

        <Text style={styles.sectionTitle}>{t('merchant.quickActions')}</Text>
        <View style={styles.actionsGrid}>
          <ActionTile
            icon="restaurant"
            label={t('merchant.publishListing')}
            onPress={() => router.push('/(merchant)/listings/new')}
          />
          <ActionTile
            icon="calendar"
            label={t('merchant.todayView')}
            onPress={() => router.push('/(merchant)/today')}
          />
          <ActionTile
            icon="location"
            label={t('merchant.addLocation')}
            onPress={() => router.push('/(merchant)/locations/new')}
          />
          <ActionTile
            icon="bar-chart"
            label={t('merchant.analytics')}
            onPress={() => router.push('/(merchant)/analytics')}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function ActionTile({
  icon,
  label,
  onPress,
}: {
  icon: import('../../src/components/ui/Icon').IconName;
  label: string;
  onPress: () => void;
}) {
  const { colors, spacing, fontSizes, fontWeights } = useTheme();
  const styles = makeTileStyles(colors, spacing, fontSizes, fontWeights);

  return (
    <Card style={styles.tile}>
      <Pressable onPress={onPress} style={styles.tilePress} accessibilityRole="button">
        <Icon name={icon} size={28} color={colors.primary} style={styles.tileIcon} />
        <Text style={styles.tileLabel}>{label}</Text>
      </Pressable>
    </Card>
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
    greeting: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
      marginBottom: spacing[1],
    },
    orgName: {
      fontSize: fontSizes['2xl'],
      fontWeight: fontWeights.bold,
      color: colors.text,
      marginBottom: spacing[2],
    },
    orgStatus: {
      fontSize: fontSizes.sm,
      color: colors.primary,
      marginBottom: spacing[6],
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing[3],
      marginBottom: spacing[7],
    },
    statCard: {
      flex: 1,
    },
    statNumber: {
      fontSize: fontSizes['2xl'],
      fontWeight: fontWeights.bold,
      color: colors.primary,
      marginBottom: spacing[1],
    },
    statLabel: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
    },
    sectionTitle: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.bold,
      color: colors.text,
      marginBottom: spacing[3],
    },
    actionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing[3],
    },
  });
}

function makeTileStyles(
  colors: ReturnType<typeof import('../../src/theme').useTheme>['colors'],
  spacing: ReturnType<typeof import('../../src/theme').useTheme>['spacing'],
  fontSizes: ReturnType<typeof import('../../src/theme').useTheme>['fontSizes'],
  fontWeights: ReturnType<typeof import('../../src/theme').useTheme>['fontWeights'],
) {
  return StyleSheet.create({
    tile: {
      width: '47%',
      padding: 0,
      overflow: 'hidden',
    },
    tilePress: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing[4],
    },
    tileIcon: {
      marginBottom: spacing[2],
    },
    tileLabel: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.semibold,
      color: colors.text,
      textAlign: 'center',
    },
  });
}
