import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Tables } from '@maithing/shared';
import { formatThb } from '@maithing/shared';
import { useListingStore } from '../../stores/listing';

type ListingItem = Tables<'listing_items'>;

interface Props {
  items: ListingItem[];
}

export default function PickYourOwnBuilder({ items }: Props) {
  const { t } = useTranslation();
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

  return (
    <View style={styles.container}>
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
              <TouchableOpacity
                style={[styles.stepBtn, qty === 0 && styles.stepBtnDisabled]}
                onPress={() => change(item.id, -1, avail)}
                disabled={qty === 0}
                accessibilityRole="button"
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qty}>{qty}</Text>
              <TouchableOpacity
                style={[styles.stepBtn, qty >= avail && styles.stepBtnDisabled]}
                onPress={() => change(item.id, +1, avail)}
                disabled={qty >= avail}
                accessibilityRole="button"
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  info: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '500', color: '#111827' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#16a34a' },
  itemOriginal: { fontSize: 12, color: '#9ca3af', textDecorationLine: 'line-through' },
  itemStock: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnDisabled: { backgroundColor: '#e5e7eb' },
  stepBtnText: { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 22 },
  qty: { fontSize: 16, fontWeight: '700', color: '#111827', minWidth: 20, textAlign: 'center' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  totalAmount: { fontSize: 18, fontWeight: '700', color: '#16a34a' },
});
