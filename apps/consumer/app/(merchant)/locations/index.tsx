import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useMerchantOrg } from '../../../src/hooks/useProfile';
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

export default function LocationsScreen() {
  const { t } = useTranslation();
  const { colors, spacing, fontSizes, fontWeights } = useTheme();
  const { locations, isLoading, error, refetch } = useMerchantOrg();

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <Screen>
        <ErrorState
          title={t('common.error')}
          description={error.message ?? t('common.unknownError')}
          onRetry={() => {
            void refetch();
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
          <Text style={styles.title}>{t('merchant.locations')}</Text>
          <Button size="sm" onPress={() => router.push('/(merchant)/locations/new')}>
            {t('merchant.addLocation')}
          </Button>
        </View>

        {locations.length === 0 ? (
          <EmptyState
            title={t('merchant.noLocations')}
            description={t('merchant.addFirstLocation')}
            icon="location-outline"
            action={{
              label: t('merchant.addFirstLocation'),
              onPress: () => router.push('/(merchant)/locations/new'),
            }}
          />
        ) : (
          locations.map((location) => (
            <Card key={location.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardName}>{location.name}</Text>
                <Badge variant={statusVariant[location.status] ?? 'default'} size="sm">
                  {t(`merchant.status.${location.status}`)}
                </Badge>
              </View>
              <Text style={styles.cardAddress}>{location.address_text}</Text>
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
    cardName: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.bold,
      color: colors.text,
      flex: 1,
      marginRight: spacing[2],
    },
    cardAddress: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
    },
  });
}
