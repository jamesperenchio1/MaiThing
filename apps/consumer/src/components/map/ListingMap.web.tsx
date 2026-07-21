import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { ListingPin, Bounds } from '@maithing/shared';
import { formatThb } from '@maithing/shared';
import { useTheme } from '../../theme';
import { Card, Button, Icon } from '../ui';
import { getIcon } from '../../icons';

interface Props {
  listings: ListingPin[];
  onRegionChange: (bounds: Bounds) => void;
}

const THAILAND_BOUNDS: Bounds = {
  min_lat: 5.0,
  min_lng: 97.0,
  max_lat: 21.0,
  max_lng: 106.0,
};

export default function ListingMap({ listings, onRegionChange }: Props) {
  const { t } = useTranslation();
  const { colors, spacing, radii, fontSizes, fontWeights } = useTheme();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    onRegionChange(THAILAND_BOUNDS);
  }, [onRegionChange]);

  const styles = makeStyles(colors, spacing, radii, fontSizes, fontWeights);

  return (
    <View style={styles.container}>
      <Card style={styles.fallbackCard}>
        <View style={styles.fallbackHeader}>
          <Icon name={getIcon('mapPin')} size={32} color={colors.primary} />
          <View style={styles.fallbackText}>
            <Text style={styles.title}>{t('listing.mapFallback')}</Text>
            <Text style={styles.subtitle}>
              {t('listing.nearbyListings', { count: listings.length })}
            </Text>
          </View>
        </View>
        <Button
          variant="secondary"
          onPress={() => {
            void Linking.openURL('https://maithing.app');
          }}
        >
          {t('listing.mapFallbackAction')}
        </Button>
      </Card>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {listings.map((listing) => (
          <Pressable
            key={listing.id}
            style={[styles.card, selectedId === listing.id && styles.cardSelected]}
            onPress={() => {
              setSelectedId(listing.id);
              router.push(`/(buyer)/listing/${listing.id}`);
            }}
          >
            <Text style={styles.cardTitle} numberOfLines={1}>
              {listing.title}
            </Text>
            <Text style={styles.cardPrice}>{formatThb(listing.price_thb)}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function makeStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  radii: ReturnType<typeof useTheme>['radii'],
  fontSizes: ReturnType<typeof useTheme>['fontSizes'],
  fontWeights: ReturnType<typeof useTheme>['fontWeights'],
) {
  return StyleSheet.create({
    container: { flex: 1, padding: spacing[4], backgroundColor: colors.background },
    fallbackCard: {
      marginBottom: spacing[4],
    },
    fallbackHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      marginBottom: spacing[4],
    },
    fallbackText: { flex: 1 },
    title: {
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.bold,
      color: colors.text,
      marginBottom: spacing[1],
    },
    subtitle: {
      fontSize: fontSizes.base,
      color: colors.textMuted,
    },
    list: { flex: 1 },
    listContent: { paddingBottom: spacing[4] },
    card: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: radii.lg,
      padding: spacing[4],
      marginBottom: spacing[2],
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardSelected: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    cardTitle: {
      flex: 1,
      fontSize: fontSizes.base,
      fontWeight: fontWeights.semibold,
      color: colors.text,
      marginRight: spacing[3],
    },
    cardPrice: {
      fontSize: fontSizes.base,
      fontWeight: fontWeights.bold,
      color: colors.primary,
    },
  });
}
