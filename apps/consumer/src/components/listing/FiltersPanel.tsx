import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMapStore } from '../../stores/map';
import { FOOD_CATEGORIES } from '@maithing/shared';

const MAX_PRICE_STEP = 10;
const MAX_PRICE_LIMIT = 500;

interface Props {
  onClose: () => void;
}

export default function FiltersPanel({ onClose }: Props) {
  const { t } = useTranslation();
  const { filters, setFilters } = useMapStore();
  const [search, setSearch] = useState('');
  const [maxPrice, setMaxPrice] = useState(filters.max_price_thb ?? MAX_PRICE_LIMIT);
  const [category, setCategory] = useState(filters.category ?? '');
  const [fulfillment, setFulfillment] = useState<'all' | 'surprise_bag' | 'pick_your_own'>(
    filters.fulfillment_type ?? 'all',
  );
  const [availableNow, setAvailableNow] = useState(filters.available_now ?? false);

  const apply = useCallback(() => {
    setFilters({
      category: category || undefined,
      max_price_thb: maxPrice < MAX_PRICE_LIMIT ? maxPrice : undefined,
      fulfillment_type: fulfillment === 'all' ? undefined : fulfillment,
      available_now: availableNow || undefined,
    });
    onClose();
  }, [setFilters, category, maxPrice, fulfillment, availableNow, onClose]);

  const clear = useCallback(() => {
    setSearch('');
    setMaxPrice(MAX_PRICE_LIMIT);
    setCategory('');
    setFulfillment('all');
    setAvailableNow(false);
    setFilters({
      category: undefined,
      max_price_thb: undefined,
      fulfillment_type: undefined,
      available_now: undefined,
    });
  }, [setFilters]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('common.filter')}</Text>
        <TouchableOpacity onPress={clear} accessibilityRole="button">
          <Text style={styles.clear}>{t('common.clear')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Text search */}
        <Text style={styles.sectionTitle}>{t('common.search')}</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={t('discover.searchPlaceholder')}
          accessibilityLabel={t('common.search')}
        />

        {/* Category chips */}
        <Text style={styles.sectionTitle}>{t('discover.filters.category')}</Text>
        <View style={styles.chipRow}>
          <Chip
            label={t('common.all')}
            selected={category === ''}
            onPress={() => setCategory('')}
          />
          {FOOD_CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              label={t(`categories.${cat}`)}
              selected={category === cat}
              onPress={() => setCategory(cat)}
            />
          ))}
        </View>

        {/* Max price */}
        <Text style={styles.sectionTitle}>
          {t('discover.filters.maxPrice')}:{' '}
          {t('discover.filters.maxPriceValue', { price: maxPrice })}
        </Text>
        <View style={styles.priceRow}>
          <TouchableOpacity
            style={styles.priceBtn}
            onPress={() => setMaxPrice((p) => Math.max(10, p - MAX_PRICE_STEP))}
            accessibilityRole="button"
          >
            <Text style={styles.priceBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.priceValue}>฿{maxPrice}</Text>
          <TouchableOpacity
            style={styles.priceBtn}
            onPress={() => setMaxPrice((p) => Math.min(MAX_PRICE_LIMIT, p + MAX_PRICE_STEP))}
            accessibilityRole="button"
          >
            <Text style={styles.priceBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Fulfillment type */}
        <Text style={styles.sectionTitle}>{t('discover.filters.fulfillmentType')}</Text>
        <View style={styles.chipRow}>
          <Chip
            label={t('common.all')}
            selected={fulfillment === 'all'}
            onPress={() => setFulfillment('all')}
          />
          <Chip
            label={t('discover.filters.surpriseBag')}
            selected={fulfillment === 'surprise_bag'}
            onPress={() => setFulfillment('surprise_bag')}
          />
          <Chip
            label={t('discover.filters.pickYourOwn')}
            selected={fulfillment === 'pick_your_own'}
            onPress={() => setFulfillment('pick_your_own')}
          />
        </View>

        {/* Available now */}
        <View style={styles.toggleRow}>
          <Text style={styles.sectionTitle}>{t('discover.filters.availableNow')}</Text>
          <Switch
            value={availableNow}
            onValueChange={setAvailableNow}
            trackColor={{ true: '#16a34a' }}
          />
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.applyBtn} onPress={apply} accessibilityRole="button">
        <Text style={styles.applyBtnText}>{t('common.apply')}</Text>
      </TouchableOpacity>
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    maxHeight: 480,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  clear: { fontSize: 14, color: '#16a34a', fontWeight: '600' },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 4,
  },
  chipSelected: { backgroundColor: '#dcfce7' },
  chipText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  chipTextSelected: { color: '#15803d', fontWeight: '600' },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  priceBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    minWidth: 60,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  applyBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  applyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
