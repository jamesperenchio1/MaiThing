import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { Card, Input, Button, Badge } from '../ui';
import { useMapStore } from '../../stores/map';
import { FOOD_CATEGORIES } from '@maithing/shared';

const MAX_PRICE_STEP = 10;
const MAX_PRICE_LIMIT = 500;

interface Props {
  onClose: () => void;
}

export default function FiltersPanel({ onClose }: Props) {
  const { t } = useTranslation();
  const { colors, spacing, radii, fontSizes, fontWeights } = useTheme();
  const { filters, setFilters } = useMapStore();
  const [search, setSearch] = useState('');
  const [maxPrice, setMaxPrice] = useState(filters.max_price_thb ?? MAX_PRICE_LIMIT);
  const [category, setCategory] = useState(filters.category ?? '');
  const [fulfillment, setFulfillment] = useState<'all' | 'surprise_bag' | 'pick_your_own'>(
    filters.fulfillment_type ?? 'all',
  );
  const [availableNow, setAvailableNow] = useState(filters.available_now ?? false);

  const styles = makeStyles(colors, spacing, radii, fontSizes, fontWeights);

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
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('common.filter')}</Text>
        <Button variant="ghost" size="sm" onPress={clear}>
          {t('common.clear')}
        </Button>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Input
          label={t('common.search')}
          value={search}
          onChangeText={setSearch}
          placeholder={t('discover.searchPlaceholder')}
          accessibilityLabel={t('common.search')}
        />

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

        <Text style={styles.sectionTitle}>
          {t('discover.filters.maxPrice')}:{' '}
          {t('discover.filters.maxPriceValue', { price: maxPrice })}
        </Text>
        <View style={styles.priceRow}>
          <Button
            size="sm"
            onPress={() => setMaxPrice((p) => Math.max(10, p - MAX_PRICE_STEP))}
            testID="decrease-price"
          >
            −
          </Button>
          <Text style={styles.priceValue}>฿{maxPrice}</Text>
          <Button
            size="sm"
            onPress={() => setMaxPrice((p) => Math.min(MAX_PRICE_LIMIT, p + MAX_PRICE_STEP))}
            testID="increase-price"
          >
            +
          </Button>
        </View>

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

        <View style={styles.toggleRow}>
          <Text style={styles.sectionTitle}>{t('discover.filters.availableNow')}</Text>
          <Switch
            value={availableNow}
            onValueChange={setAvailableNow}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={availableNow ? colors.primary : colors.surfaceElevated}
            ios_backgroundColor={colors.border}
          />
        </View>
      </ScrollView>

      <Button size="lg" onPress={apply} testID="apply-filters">
        {t('common.apply')}
      </Button>
    </Card>
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
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Badge variant={selected ? 'primary' : 'default'}>{label}</Badge>
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
    container: {
      maxHeight: 480,
      padding: spacing[4],
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing[4],
    },
    title: {
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.bold,
      color: colors.text,
    },
    sectionTitle: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.semibold,
      color: colors.text,
      marginTop: spacing[4],
      marginBottom: spacing[2],
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing[2],
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[4],
      marginBottom: spacing[2],
    },
    priceValue: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.semibold,
      color: colors.text,
      minWidth: 60,
      textAlign: 'center',
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing[2],
      marginBottom: spacing[4],
    },
  });
}
