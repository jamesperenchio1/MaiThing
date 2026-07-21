import { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Tables } from '@maithing/shared';
import { formatThb } from '@maithing/shared';
import { useTheme } from '../../theme';
import { Card, Button } from '../ui';
import { useListingStore } from '../../stores/listing';

type ListingItem = Tables<'listing_items'>;

interface Props {
  items: ListingItem[];
}

export default function PickYourOwnBuilder({ items }: Props) {
  const { t } = useTranslation();
  const { colors, spacing, radii, fontSizes, fontWeights } = useTheme();
  const setPickedItems = useListingStore((s) => s.setPickedItems);
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.map((i) => [i.id, 0])),
  );

  const change = useCallback(
    (id: string, delta: number, maxQty: number) => {
      setQuantities((prev) => {
        const next = Math.max(0, Math.min(maxQty, (prev[id] ?? 0) + delta));
        const updated = { ...prev, [id]: next };
        setPickedItems(
          items
            .filter((item) => (updated[item.id] ?? 0) > 0)
            .map((item) => ({ itemId: item.id, qty: updated[item.id] ?? 0 })),
        );
        return updated;
      });
    },
    [items, setPickedItems],
  );

  const total = items.reduce((sum, item) => sum + item.price_thb * (quantities[item.id] ?? 0), 0);

  const styles = makeStyles(colors, spacing, radii, fontSizes, fontWeights);

  return (
    <Card>
      <Text style={styles.header}>{t('listing.pickYourOwn')}</Text>
      {items.map((item) => {
        const qty = quantities[item.id] ?? 0;
        const avail = item.available_qty - item.reserved_qty;
        return (
          <View key={item.id} style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.itemName}>{item.name}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.itemPrice}>{formatThb(item.price_thb)}</Text>
                {item.original_price_thb > item.price_thb && (
                  <Text style={styles.itemOriginal}>{formatThb(item.original_price_thb)}</Text>
                )}
              </View>
              <Text style={styles.itemStock}>{t('listing.available', { count: avail })}</Text>
            </View>
            <View style={styles.stepper}>
              <Button
                size="sm"
                variant={qty === 0 ? 'secondary' : 'primary'}
                onPress={() => change(item.id, -1, avail)}
                disabled={qty === 0}
              >
                −
              </Button>
              <Text style={styles.qty}>{qty}</Text>
              <Button
                size="sm"
                variant={qty >= avail ? 'secondary' : 'primary'}
                onPress={() => change(item.id, +1, avail)}
                disabled={qty >= avail}
              >
                +
              </Button>
            </View>
          </View>
        );
      })}
      {total > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('listing.total')}</Text>
          <Text style={styles.totalAmount}>{formatThb(total)}</Text>
        </View>
      )}
    </Card>
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
    header: {
      fontSize: fontSizes.base,
      fontWeight: fontWeights.bold,
      color: colors.text,
      marginBottom: spacing[3],
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing[2],
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    info: { flex: 1 },
    itemName: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.medium,
      color: colors.text,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[1],
      marginTop: spacing[0],
    },
    itemPrice: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.semibold,
      color: colors.primary,
    },
    itemOriginal: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
      textDecorationLine: 'line-through',
    },
    itemStock: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
      marginTop: spacing[0],
    },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    qty: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.bold,
      color: colors.text,
      minWidth: spacing[5],
      textAlign: 'center',
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing[3],
      paddingTop: spacing[3],
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    totalLabel: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.semibold,
      color: colors.text,
    },
    totalAmount: {
      fontSize: fontSizes.xl,
      fontWeight: fontWeights.bold,
      color: colors.primary,
    },
  });
}
