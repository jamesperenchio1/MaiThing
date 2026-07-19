import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useListingDetail } from '../../../src/hooks/useListing';
import { useCreateThread } from '../../../src/hooks/useChat';
import { useListingStore } from '../../../src/stores/listing';
import { useRealtimeStock } from '../../../src/hooks/useRealtimeStock';
import { formatThb, discountPercent } from '@maithing/shared';
import type { Tables } from '@maithing/shared';
import SlotPicker from '../../../src/components/listing/SlotPicker';
import PickYourOwnBuilder from '../../../src/components/listing/PickYourOwnBuilder';
import FavoriteButton from '../../../src/components/listing/FavoriteButton';

type PickupSlot = Tables<'pickup_slots'>;

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { data: listing, isLoading, error, refetch } = useListingDetail(id);
  const createThread = useCreateThread();
  const setSelectedSlot = useListingStore((s) => s.setSelectedSlot);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  useRealtimeStock(id);

  const handleSlotSelect = useCallback(
    (slot: PickupSlot) => {
      setSelectedSlotId(slot.id);
      setSelectedSlot(slot);
    },
    [setSelectedSlot],
  );

  const handleReserve = useCallback(() => {
    if (!selectedSlotId) {
      Alert.alert(t('order.selectSlot'), t('order.selectSlot'));
      return;
    }
    router.push(`/(buyer)/checkout/${id}`);
  }, [selectedSlotId, id, t]);

  const openDirections = useCallback(() => {
    if (!listing?.location.address_text) return;
    const query = encodeURIComponent(listing.location.address_text);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    void Linking.openURL(url);
  }, [listing]);

  const handleMessageStore = useCallback(async () => {
    if (!listing) return;
    const threadId = await createThread.mutateAsync({ locationId: listing.location_id });
    router.push(`/(buyer)/chat/${threadId}`);
  }, [listing, createThread]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('common.error')}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => void refetch()}>
          <Text style={styles.retryText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pct = discountPercent(listing.original_value_thb, listing.price_thb);
  const isPickYourOwn = listing.fulfillment_type === 'pick_your_own';
  const availableSlots = listing.slots.filter((s) => s.reserved_count < s.capacity);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
          >
            <Text style={styles.backText}>{'←'}</Text>
          </TouchableOpacity>
          <FavoriteButton locationId={listing.location_id} size={26} />
        </View>

        {/* Store name + type badge */}
        <View style={styles.storeRow}>
          <Text style={styles.locationName}>{listing.location.name}</Text>
          <View style={[styles.typeBadge, isPickYourOwn && styles.typeBadgePyo]}>
            <Text style={styles.typeBadgeText}>
              {isPickYourOwn ? t('listing.pickYourOwn') : t('listing.surpriseBag')}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{listing.title}</Text>

        {/* Ratings */}
        {listing.location.rating_count > 0 && (
          <View style={styles.ratingsRow}>
            <Text style={styles.ratingItem}>
              ★ {listing.location.rating_avg.toFixed(1)}{' '}
              <Text style={styles.ratingLabel}>{t('listing.overallRating')}</Text>
            </Text>
            <Text style={styles.ratingDot}>·</Text>
            <Text style={styles.ratingItem}>
              💰 {listing.location.value_rating_avg.toFixed(1)}{' '}
              <Text style={styles.ratingLabel}>{t('listing.valueRating')}</Text>
            </Text>
            <Text style={styles.ratingDot}>·</Text>
            <Text style={styles.ratingCount}>({listing.location.rating_count})</Text>
          </View>
        )}

        {/* Price block */}
        <View style={styles.priceBlock}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatThb(listing.price_thb)}</Text>
            {pct > 0 && (
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>{t('listing.saved', { percent: pct })}</Text>
              </View>
            )}
          </View>
          {listing.original_value_thb > 0 && (
            <Text style={styles.originalValue}>
              {t('listing.originalValue', { value: listing.original_value_thb })}
            </Text>
          )}
          <Text style={styles.remaining}>
            {t('listing.remaining', { count: listing.qty_remaining })}
          </Text>
        </View>

        {listing.description ? <Text style={styles.description}>{listing.description}</Text> : null}

        {/* Allergens */}
        {listing.allergens && listing.allergens.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('listing.allergens')}</Text>
            <Text style={styles.sectionBody}>{listing.allergens.join(', ')}</Text>
          </View>
        )}

        {/* Best before */}
        {listing.best_before_note ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('listing.bestBefore')}</Text>
            <Text style={styles.sectionBody}>{listing.best_before_note}</Text>
          </View>
        ) : null}

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 {t('listing.address')}</Text>
          <Text style={styles.sectionBody}>{listing.location.address_text}</Text>
          <View style={styles.addressActions}>
            <TouchableOpacity
              style={styles.directionsBtn}
              onPress={openDirections}
              accessibilityRole="button"
            >
              <Text style={styles.directionsBtnText}>{t('listing.directions')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.messageBtn}
              onPress={() => void handleMessageStore()}
              accessibilityRole="button"
            >
              <Text style={styles.messageBtnText}>{t('listing.messageStore')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pick your own item builder */}
        {isPickYourOwn && listing.items.length > 0 && <PickYourOwnBuilder items={listing.items} />}

        {/* Slot picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('listing.pickupWindow')}</Text>
          <SlotPicker
            slots={availableSlots}
            selectedSlotId={selectedSlotId}
            onSelect={handleSlotSelect}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Reserve CTA */}
      <View style={styles.footer}>
        <Text style={styles.cancelPolicy}>{t('order.cancelPolicy')}</Text>
        <TouchableOpacity
          style={[styles.reserveBtn, !selectedSlotId && styles.reserveBtnDisabled]}
          onPress={handleReserve}
          accessibilityRole="button"
        >
          <Text style={styles.reserveBtnText}>{t('listing.reserve')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { fontSize: 16, color: '#6b7280' },
  retryBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  scroll: { padding: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  backText: { fontSize: 22, color: '#374151' },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  locationName: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  typeBadge: {
    backgroundColor: '#f59e0b',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeBadgePyo: { backgroundColor: '#3b82f6' },
  typeBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  ratingsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  ratingItem: { fontSize: 13, color: '#374151' },
  ratingLabel: { color: '#9ca3af', fontWeight: '400' },
  ratingDot: { color: '#d1d5db' },
  ratingCount: { fontSize: 12, color: '#9ca3af' },
  priceBlock: {
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
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  price: { fontSize: 28, fontWeight: '700', color: '#16a34a' },
  saveBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  saveBadgeText: { color: '#16a34a', fontWeight: '700', fontSize: 14 },
  originalValue: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  remaining: { fontSize: 14, color: '#f59e0b', fontWeight: '600' },
  description: { fontSize: 15, color: '#374151', lineHeight: 22, marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  sectionBody: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  directionsBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  directionsBtnText: { color: '#2563eb', fontWeight: '600', fontSize: 13 },
  addressActions: { flexDirection: 'row', gap: 10 },
  messageBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  messageBtnText: { color: '#16a34a', fontWeight: '600', fontSize: 13 },
  bottomSpacer: { height: 100 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  cancelPolicy: { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginBottom: 10 },
  reserveBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  reserveBtnDisabled: { backgroundColor: '#d1d5db' },
  reserveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
