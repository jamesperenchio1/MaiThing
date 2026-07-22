import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { ListingPin } from '@maithing/shared';
import { formatThb, discountPercent } from '@maithing/shared';
import { useTheme } from '../../theme';
import { Icon } from '../ui';
import { getIcon } from '../../icons';
import FavoriteButton from './FavoriteButton';

interface Props {
  listing: ListingPin;
}

export default function ListingRow({ listing }: Props) {
  const { t } = useTranslation();
  const { colors, spacing, radii, fontSizes, fontWeights } = useTheme();
  const pct = discountPercent(listing.original_value_thb, listing.price_thb);

  const styles = makeStyles(colors, spacing, radii, fontSizes, fontWeights);

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/(buyer)/listing/${listing.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${listing.title}, ${formatThb(listing.price_thb)}`}
    >
      <View style={styles.rowLeft}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {listing.title}
        </Text>
        <Text style={styles.rowStore} numberOfLines={1}>
          {listing.location_name}
        </Text>
        <View style={styles.ratingRow}>
          <Icon name={getIcon('star')} size={12} color={colors.warning} />
          <Text style={styles.rowRating}>{listing.rating_avg.toFixed(1)}</Text>
        </View>
      </View>
      <View style={styles.rowRight}>
        <FavoriteButton locationId={listing.location_id} size={22} />
        <Text style={styles.rowPrice}>{formatThb(listing.price_thb)}</Text>
        {pct > 0 && (
          <View style={styles.savedBadge}>
            <Text style={styles.rowSaved}>-{pct}%</Text>
          </View>
        )}
        <Text style={styles.rowQty}>
          {t('listing.remaining', { count: listing.qty_remaining })}
        </Text>
      </View>
    </TouchableOpacity>
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
    row: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: radii.lg,
      padding: spacing[4],
      marginBottom: spacing[2],
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 2,
    },
    rowLeft: { flex: 1 },
    rowTitle: {
      fontSize: fontSizes.base,
      fontWeight: fontWeights.semibold,
      color: colors.text,
    },
    rowStore: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
      marginTop: spacing[0],
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[1],
      marginTop: spacing[1],
    },
    rowRating: {
      fontSize: fontSizes.xs,
      color: colors.warning,
    },
    rowRight: { alignItems: 'flex-end', gap: spacing[0] },
    rowPrice: {
      fontSize: fontSizes.xl,
      fontWeight: fontWeights.bold,
      color: colors.primary,
    },
    savedBadge: {
      backgroundColor: colors.warning,
      borderRadius: radii.md,
      paddingHorizontal: spacing[1],
      paddingVertical: spacing[0],
    },
    rowSaved: {
      fontSize: fontSizes.xs,
      color: colors.textInverse,
      fontWeight: fontWeights.bold,
    },
    rowQty: {
      fontSize: fontSizes.xs,
      color: colors.textMuted,
    },
  });
}
