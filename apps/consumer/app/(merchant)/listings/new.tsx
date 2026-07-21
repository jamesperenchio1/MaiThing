import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { useMerchantOrg } from '../../../src/hooks/useProfile';
import {
  FOOD_CATEGORIES,
  createListingSchema,
  createPickupSlotSchema,
  fulfillmentTypeSchema,
} from '@maithing/shared';
import type { z } from 'zod';
import { useTheme } from '../../../src/theme';
import { Screen, Card, Input, Button, ErrorState, LoadingState } from '../../../src/components/ui';

type FulfillmentType = z.infer<typeof fulfillmentTypeSchema>;

type ItemDraft = {
  id: string;
  name: string;
  available_qty: string;
  price_thb: string;
  original_price_thb: string;
};

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

function nowRounded(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d.toISOString().slice(0, 16);
}

function addHours(iso: string, hours: number): string {
  const d = new Date(iso);
  d.setHours(d.getHours() + hours);
  return d.toISOString().slice(0, 16);
}

export default function NewListingScreen() {
  const { t } = useTranslation();
  const { colors, spacing, fontSizes, fontWeights } = useTheme();
  const { locations, isLoading: orgLoading } = useMerchantOrg();
  const [locationId, setLocationId] = useState(locations[0]?.id ?? '');
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('surprise_bag');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [originalValue, setOriginalValue] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [allergens, setAllergens] = useState('');
  const [bestBefore, setBestBefore] = useState('');
  const [autoRepeat, setAutoRepeat] = useState(false);
  const [slotStart, setSlotStart] = useState(nowRounded());
  const [slotEnd, setSlotEnd] = useState(addHours(nowRounded(), 2));
  const [slotCapacity, setSlotCapacity] = useState('');
  const [items, setItems] = useState<ItemDraft[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: makeId(), name: '', available_qty: '', price_thb: '', original_price_thb: '' },
    ]);
  };

  const updateItem = (id: string, key: keyof ItemDraft, value: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [key]: value } : i)));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const submit = async () => {
    setTouched({
      locationId: true,
      title: true,
      category: true,
      originalValue: true,
      price: true,
      quantity: true,
      slotCapacity: true,
    });

    if (!locationId) {
      setError(t('merchant.selectLocation'));
      return;
    }

    const listingParsed = createListingSchema.safeParse({
      location_id: locationId,
      title: title.trim(),
      category,
      description: description.trim() || undefined,
      fulfillment_type: fulfillmentType,
      original_value_thb: parseFloat(originalValue),
      price_thb: parseFloat(price),
      qty_total: parseInt(quantity, 10),
      allergens: allergens
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      best_before_note: bestBefore.trim() || undefined,
      auto_repeat: autoRepeat,
    });

    if (!listingParsed.success) {
      setError(listingParsed.error.errors[0]?.message ?? t('common.error'));
      return;
    }

    const slotParsed = createPickupSlotSchema.safeParse({
      listing_id: '',
      starts_at: new Date(slotStart).toISOString(),
      ends_at: new Date(slotEnd).toISOString(),
      capacity: parseInt(slotCapacity, 10) || parseInt(quantity, 10),
    });

    if (!slotParsed.success) {
      setError(slotParsed.error.errors[0]?.message ?? t('common.error'));
      return;
    }

    if (fulfillmentType === 'pick_your_own' && items.length === 0) {
      setError(t('merchant.addAtLeastOneItem'));
      return;
    }

    const itemErrors = items
      .map((item) => ({
        name: item.name.trim(),
        available_qty: parseInt(item.available_qty, 10),
        price_thb: parseFloat(item.price_thb),
        original_price_thb: parseFloat(item.original_price_thb),
      }))
      .filter(
        (item) =>
          !item.name ||
          item.available_qty <= 0 ||
          item.price_thb <= 0 ||
          item.original_price_thb <= 0,
      );

    if (fulfillmentType === 'pick_your_own' && itemErrors.length > 0) {
      setError(t('merchant.invalidItems'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .insert({
        location_id: listingParsed.data.location_id,
        title: listingParsed.data.title,
        category: listingParsed.data.category,
        description: listingParsed.data.description ?? null,
        fulfillment_type: listingParsed.data.fulfillment_type,
        original_value_thb: listingParsed.data.original_value_thb,
        price_thb: listingParsed.data.price_thb,
        qty_total: listingParsed.data.qty_total,
        qty_remaining: listingParsed.data.qty_total,
        allergens: listingParsed.data.allergens ?? [],
        best_before_note: listingParsed.data.best_before_note ?? null,
        auto_repeat: listingParsed.data.auto_repeat ?? false,
        status: 'active',
      })
      .select('id')
      .single();

    if (listingError || !listing) {
      setError(listingError?.message ?? t('common.error'));
      setIsSubmitting(false);
      return;
    }

    const { error: slotError } = await supabase.from('pickup_slots').insert({
      ...slotParsed.data,
      listing_id: listing.id,
    });

    if (slotError) {
      setError(slotError.message);
      setIsSubmitting(false);
      return;
    }

    if (fulfillmentType === 'pick_your_own') {
      const itemInserts = items.map((item) => ({
        listing_id: listing.id,
        name: item.name.trim(),
        available_qty: parseInt(item.available_qty, 10),
        price_thb: parseFloat(item.price_thb),
        original_price_thb: parseFloat(item.original_price_thb),
      }));
      const { error: itemsError } = await supabase.from('listing_items').insert(itemInserts);
      if (itemsError) {
        setError(itemsError.message);
        setIsSubmitting(false);
        return;
      }
    }

    setIsSubmitting(false);
    router.replace('/(merchant)/listings');
  };

  const canSubmit =
    locationId && title.trim() && category && originalValue && price && quantity && slotCapacity;

  if (orgLoading) {
    return <LoadingState />;
  }

  const styles = makeStyles(colors, spacing, fontSizes, fontWeights);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('merchant.publishListing')}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>{t('merchant.location')}</Text>
          <View style={styles.chipRow}>
            {locations.map((loc) => (
              <Chip
                key={loc.id}
                selected={locationId === loc.id}
                onPress={() => setLocationId(loc.id)}
                label={loc.name}
              />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('merchant.fulfillmentType')}</Text>
          <View style={styles.chipRow}>
            {(['surprise_bag', 'pick_your_own'] as FulfillmentType[]).map((type) => (
              <Chip
                key={type}
                selected={fulfillmentType === type}
                onPress={() => setFulfillmentType(type)}
                label={t(`listing.${type}`)}
              />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Input
            label={t('merchant.listingTitle')}
            value={title}
            onChangeText={(v) => {
              setTitle(v);
              setError(null);
            }}
            placeholder={t('merchant.listingTitlePlaceholder')}
            error={touched.title && !title.trim() ? t('merchant.required') : undefined}
            onBlur={() => setTouched((p) => ({ ...p, title: true }))}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('merchant.category')}</Text>
          <View style={styles.chipRow}>
            {FOOD_CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                selected={category === cat}
                onPress={() => setCategory(cat)}
                label={t(`categories.${cat}`)}
              />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Input
            label={t('merchant.description')}
            value={description}
            onChangeText={setDescription}
            placeholder={t('merchant.descriptionPlaceholder')}
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <Input
              label={t('merchant.originalValue')}
              value={originalValue}
              onChangeText={setOriginalValue}
              placeholder="฿"
              keyboardType="decimal-pad"
              error={touched.originalValue && !originalValue ? t('merchant.required') : undefined}
              onBlur={() => setTouched((p) => ({ ...p, originalValue: true }))}
            />
          </View>
          <View style={styles.half}>
            <Input
              label={t('merchant.price')}
              value={price}
              onChangeText={setPrice}
              placeholder="฿"
              keyboardType="decimal-pad"
              error={touched.price && !price ? t('merchant.required') : undefined}
              onBlur={() => setTouched((p) => ({ ...p, price: true }))}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <Input
              label={t('merchant.quantity')}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
              error={touched.quantity && !quantity ? t('merchant.required') : undefined}
              onBlur={() => setTouched((p) => ({ ...p, quantity: true }))}
            />
          </View>
          <View style={styles.half}>
            <Input
              label={t('merchant.slotCapacity')}
              value={slotCapacity}
              onChangeText={setSlotCapacity}
              keyboardType="number-pad"
              error={touched.slotCapacity && !slotCapacity ? t('merchant.required') : undefined}
              onBlur={() => setTouched((p) => ({ ...p, slotCapacity: true }))}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Input
            label={t('merchant.allergens')}
            value={allergens}
            onChangeText={setAllergens}
            placeholder={t('merchant.allergensPlaceholder')}
          />
        </View>

        <View style={styles.field}>
          <Input
            label={t('merchant.bestBefore')}
            value={bestBefore}
            onChangeText={setBestBefore}
            placeholder={t('merchant.bestBeforePlaceholder')}
          />
        </View>

        <View style={styles.rowSwitch}>
          <Text style={styles.label}>{t('merchant.autoRepeat')}</Text>
          <Switch
            value={autoRepeat}
            onValueChange={setAutoRepeat}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surfaceElevated}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('merchant.pickupSlot')}</Text>
          <View style={styles.row}>
            <Input value={slotStart} onChangeText={setSlotStart} style={styles.half} />
            <Input value={slotEnd} onChangeText={setSlotEnd} style={styles.half} />
          </View>
        </View>

        {fulfillmentType === 'pick_your_own' && (
          <View style={styles.field}>
            <View style={styles.itemHeader}>
              <Text style={styles.label}>{t('merchant.items')}</Text>
              <Button size="sm" onPress={addItem}>
                {t('merchant.addItem')}
              </Button>
            </View>
            {items.map((item) => (
              <Card key={item.id} style={styles.itemCard}>
                <Input
                  value={item.name}
                  onChangeText={(v) => updateItem(item.id, 'name', v)}
                  placeholder={t('merchant.itemName')}
                  style={styles.itemInput}
                />
                <View style={styles.itemRow}>
                  <Input
                    value={item.available_qty}
                    onChangeText={(v) => updateItem(item.id, 'available_qty', v)}
                    placeholder={t('merchant.itemQty')}
                    keyboardType="number-pad"
                    style={styles.itemSmall}
                  />
                  <Input
                    value={item.price_thb}
                    onChangeText={(v) => updateItem(item.id, 'price_thb', v)}
                    placeholder={t('merchant.itemPrice')}
                    keyboardType="decimal-pad"
                    style={styles.itemSmall}
                  />
                  <Input
                    value={item.original_price_thb}
                    onChangeText={(v) => updateItem(item.id, 'original_price_thb', v)}
                    placeholder={t('merchant.itemOriginalPrice')}
                    keyboardType="decimal-pad"
                    style={styles.itemSmall}
                  />
                </View>
                <Button variant="ghost" size="sm" onPress={() => removeItem(item.id)}>
                  {t('common.remove')}
                </Button>
              </Card>
            ))}
          </View>
        )}

        {error && <ErrorState title={t('common.error')} description={error} style={styles.error} />}

        <Button
          onPress={() => void submit()}
          loading={isSubmitting}
          disabled={!canSubmit || isSubmitting}
          size="lg"
        >
          {t('merchant.publish')}
        </Button>
      </ScrollView>
    </Screen>
  );
}

function Chip({
  selected,
  onPress,
  label,
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
}) {
  const { colors, spacing, radii, fontSizes, fontWeights } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          borderRadius: radii.full,
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[2],
          borderWidth: 1,
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primaryMuted : colors.surfaceElevated,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text
        style={{
          fontSize: fontSizes.sm,
          fontWeight: selected ? fontWeights.semibold : fontWeights.normal,
          color: selected ? colors.primaryHover : colors.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
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
    title: {
      fontSize: fontSizes['2xl'],
      fontWeight: fontWeights.bold,
      color: colors.text,
      marginBottom: spacing[5],
    },
    field: {
      marginBottom: spacing[4],
    },
    label: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.semibold,
      color: colors.text,
      marginBottom: spacing[2],
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    row: {
      flexDirection: 'row',
      gap: spacing[3],
      marginBottom: spacing[4],
      alignItems: 'flex-start',
    },
    half: {
      flex: 1,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing[2],
    },
    rowSwitch: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing[4],
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing[3],
    },
    itemCard: {
      marginBottom: spacing[3],
    },
    itemInput: {
      marginBottom: spacing[2],
    },
    itemRow: {
      flexDirection: 'row',
      gap: spacing[2],
      marginBottom: spacing[2],
    },
    itemSmall: {
      flex: 1,
    },
    error: {
      marginBottom: spacing[4],
    },
  });
}
