import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { useMerchantOrg } from '../../../src/hooks/useProfile';
import { useSlotTemplates } from '../../../src/hooks/useSlotTemplates';
import {
  FOOD_CATEGORIES,
  createListingSchema,
  createPickupSlotSchema,
  fulfillmentTypeSchema,
} from '@maithing/shared';
import type { z } from 'zod';

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
  const { locations } = useMerchantOrg();
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
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const { data: slotTemplates = [] } = useSlotTemplates(locationId);

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
      listing_id: '', // will be set after listing insert
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('merchant.publishListing')}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>{t('merchant.location')}</Text>
        <View style={styles.chipRow}>
          {locations.map((loc) => (
            <TouchableOpacity
              key={loc.id}
              style={[styles.chip, locationId === loc.id && styles.chipSelected]}
              onPress={() => setLocationId(loc.id)}
            >
              <Text style={[styles.chipText, locationId === loc.id && styles.chipTextSelected]}>
                {loc.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('merchant.fulfillmentType')}</Text>
        <View style={styles.chipRow}>
          {(['surprise_bag', 'pick_your_own'] as FulfillmentType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.chip, fulfillmentType === type && styles.chipSelected]}
              onPress={() => setFulfillmentType(type)}
            >
              <Text style={[styles.chipText, fulfillmentType === type && styles.chipTextSelected]}>
                {t(`listing.${type}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('merchant.listingTitle')}</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder={t('merchant.listingTitlePlaceholder')}
        />
      </View>

      <Text style={styles.label}>{t('merchant.category')}</Text>
      <View style={styles.chipRow}>
        {FOOD_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, category === cat && styles.chipSelected]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.chipText, category === cat && styles.chipTextSelected]}>
              {t(`categories.${cat}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('merchant.description')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder={t('merchant.descriptionPlaceholder')}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>{t('merchant.originalValue')}</Text>
          <TextInput
            style={styles.input}
            value={originalValue}
            onChangeText={setOriginalValue}
            placeholder="฿"
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>{t('merchant.price')}</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="฿"
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>{t('merchant.quantity')}</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>{t('merchant.slotCapacity')}</Text>
          <TextInput
            style={styles.input}
            value={slotCapacity}
            onChangeText={setSlotCapacity}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('merchant.allergens')}</Text>
        <TextInput
          style={styles.input}
          value={allergens}
          onChangeText={setAllergens}
          placeholder={t('merchant.allergensPlaceholder')}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('merchant.bestBefore')}</Text>
        <TextInput
          style={styles.input}
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
          thumbColor={autoRepeat ? '#16a34a' : '#f3f4f6'}
        />
      </View>

      <View style={styles.slotHeader}>
        <Text style={styles.label}>{t('merchant.pickupSlot')}</Text>
        {slotTemplates.length > 0 && (
          <TouchableOpacity
            onPress={() => setShowTemplatePicker(true)}
            accessibilityRole="button"
          >
            <Text style={styles.loadTemplateText}>{t('merchant.loadTemplate')}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.half]}
          value={slotStart}
          onChangeText={setSlotStart}
        />
        <TextInput style={[styles.input, styles.half]} value={slotEnd} onChangeText={setSlotEnd} />
      </View>

      {/* Template picker modal */}
      <Modal
        visible={showTemplatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTemplatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{t('merchant.selectTemplate')}</Text>
            {slotTemplates.map((tmpl) => (
              <TouchableOpacity
                key={tmpl.id}
                style={styles.templateRow}
                onPress={() => {
                  const today = new Date().toISOString().slice(0, 10);
                  setSlotStart(`${today}T${tmpl.start_time}`);
                  setSlotEnd(`${today}T${tmpl.end_time}`);
                  setShowTemplatePicker(false);
                }}
                accessibilityRole="button"
              >
                <Text style={styles.templateName}>{tmpl.label}</Text>
                <Text style={styles.templateTime}>
                  {tmpl.start_time.slice(0, 5)} – {tmpl.end_time.slice(0, 5)}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowTemplatePicker(false)}
              accessibilityRole="button"
            >
              <Text style={styles.modalCloseText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {fulfillmentType === 'pick_your_own' && (
        <View style={styles.field}>
          <View style={styles.itemHeader}>
            <Text style={styles.label}>{t('merchant.items')}</Text>
            <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
              <Text style={styles.addItemText}>+ {t('merchant.addItem')}</Text>
            </TouchableOpacity>
          </View>
          {items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <TextInput
                style={[styles.input, styles.itemInput]}
                value={item.name}
                onChangeText={(v) => updateItem(item.id, 'name', v)}
                placeholder={t('merchant.itemName')}
              />
              <View style={styles.itemRow}>
                <TextInput
                  style={[styles.input, styles.itemSmall]}
                  value={item.available_qty}
                  onChangeText={(v) => updateItem(item.id, 'available_qty', v)}
                  placeholder={t('merchant.itemQty')}
                  keyboardType="number-pad"
                />
                <TextInput
                  style={[styles.input, styles.itemSmall]}
                  value={item.price_thb}
                  onChangeText={(v) => updateItem(item.id, 'price_thb', v)}
                  placeholder={t('merchant.itemPrice')}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  style={[styles.input, styles.itemSmall]}
                  value={item.original_price_thb}
                  onChangeText={(v) => updateItem(item.id, 'original_price_thb', v)}
                  placeholder={t('merchant.itemOriginalPrice')}
                  keyboardType="decimal-pad"
                />
              </View>
              <TouchableOpacity onPress={() => removeItem(item.id)}>
                <Text style={styles.removeItem}>{t('common.remove')}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.btn, (!canSubmit || isSubmitting) && styles.btnDisabled]}
        onPress={() => void submit()}
        disabled={!canSubmit || isSubmitting}
        accessibilityRole="button"
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>{t('merchant.publish')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, backgroundColor: '#f9fafb', flexGrow: 1 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  half: { flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipSelected: { backgroundColor: '#dcfce7', borderColor: '#16a34a' },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextSelected: { color: '#15803d', fontWeight: '600' },
  rowSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addItemBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addItemText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  itemCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12 },
  itemInput: { marginBottom: 8 },
  itemRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  itemSmall: { flex: 1 },
  removeItem: { color: '#dc2626', fontSize: 13, fontWeight: '600' },
  error: { color: '#dc2626', marginBottom: 16 },
  btn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  btnDisabled: { backgroundColor: '#9ca3af' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  loadTemplateText: { fontSize: 13, color: '#16a34a', fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 16 },
  templateRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  templateName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  templateTime: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  modalClose: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  modalCloseText: { color: '#374151', fontWeight: '600', fontSize: 15 },
});
