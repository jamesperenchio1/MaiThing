import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
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
import {
  Screen,
  Card,
  Button,
  Badge,
  Icon,
  LoadingState,
  ErrorState,
} from '../../../src/components/ui';
import { useTheme } from '../../../src/theme';
import { icons } from '../../../src/icons';

type PickupSlot = Tables<'pickup_slots'>;

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors, spacing, fontSizes, fontWeights } = theme;
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

  const styles = makeStyles(colors, spacing, fontSizes, fontWeights);

  if (isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (error || !listing) {
    return (
      <Screen>
        <ErrorState
          title={t('common.error')}
          description={error?.message}
          onRetry={() => void refetch()}
          retryLabel={t('common.retry')}
        />
      </Screen>
    );
  }

  const pct = discountPercent(listing.original_value_thb, listing.price_thb);
  const isPickYourOwn = listing.fulfillment_type === 'pick_your_own';
  const availableSlots = listing.slots.filter((s) => s.reserved_count < s.capacity);

  return (
    <Screen style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Icon name={icons.back} size={24} />
          </TouchableOpacity>
          <FavoriteButton locationId={listing.location_id} size={26} />
        </View>

        {/* Store name + type badge */}
        <View style={styles.storeRow}>
          <Text style={styles.locationName}>{listing.location.name}</Text>
          <Badge variant={isPickYourOwn ? 'primary' : 'warning'} size="sm">
            {isPickYourOwn ? t('listing.pickYourOwn') : t('listing.surpriseBag')}
          </Badge>
        </View>

        <Text style={styles.title}>{listing.title}</Text>

        {/* Ratings */}
        {listing.location.rating_count > 0 && (
          <View style={styles.ratingsRow}>
            <Icon name={icons.star} size={14} color={colors.warning} />
            <Text style={styles.ratingItem}>
              {listing.location.rating_avg.toFixed(1)}{' '}
              <Text style={styles.ratingLabel}>{t('listing.overallRating')}</Text>
            </Text>
            <Text style={styles.ratingDot}>·</Text>
            <Icon name={icons.card} size={14} />
            <Text style={styles.ratingItem}>
              {listing.location.value_rating_avg.toFixed(1)}{' '}
              <Text style={styles.ratingLabel}>{t('listing.valueRating')}</Text>
            </Text>
            <Text style={styles.ratingDot}>·</Text>
            <Text style={styles.ratingCount}>({listing.location.rating_count})</Text>
          </View>
        )}

        {/* Price block */}
        <Card style={styles.priceBlock}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatThb(listing.price_thb)}</Text>
            {pct > 0 && (
              <Badge variant="success" size="md">
                {t('listing.saved', { percent: pct })}
              </Badge>
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
        </Card>

        {listing.description ? <Text style={styles.description}>{listing.description}</Text> : null}

        {/* Allergens */}
        {listing.allergens && listing.allergens.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>{t('listing.allergens')}</Text>
            <Text style={styles.sectionBody}>{listing.allergens.join(', ')}</Text>
          </Card>
        )}

        {/* Best before */}
        {listing.best_before_note ? (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>{t('listing.bestBefore')}</Text>
            <Text style={styles.sectionBody}>{listing.best_before_note}</Text>
          </Card>
        ) : null}

        {/* Address */}
        <Card style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Icon name={icons.mapPin} size={14} />
            <Text style={styles.sectionTitle}>{t('listing.address')}</Text>
          </View>
          <Text style={styles.sectionBody}>{listing.location.address_text}</Text>
          <View style={styles.addressActions}>
            <Button variant="secondary" size="sm" onPress={openDirections}>
              {t('listing.directions')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => void handleMessageStore()}
              loading={createThread.isPending}
            >
              {t('listing.messageStore')}
            </Button>
          </View>
        </Card>

        {/* Pick your own item builder */}
        {isPickYourOwn && listing.items.length > 0 && <PickYourOwnBuilder items={listing.items} />}

        {/* Slot picker */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('listing.pickupWindow')}</Text>
          <SlotPicker
            slots={availableSlots}
            selectedSlotId={selectedSlotId}
            onSelect={handleSlotSelect}
          />
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Reserve CTA */}
      <View style={styles.footer}>
        <Text style={styles.cancelPolicy}>{t('order.cancelPolicy')}</Text>
        <Button size="lg" onPress={handleReserve} disabled={!selectedSlotId}>
          {t('listing.reserve')}
        </Button>
      </View>
    </Screen>
  );
}

function makeStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  fontSizes: ReturnType<typeof useTheme>['fontSizes'],
  fontWeights: ReturnType<typeof useTheme>['fontWeights'],
) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    scroll: {
      padding: spacing[4],
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing[3],
    },
    backBtn: {
      padding: spacing[2],
      marginLeft: -spacing[2],
    },
    storeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
      marginBottom: spacing[1],
    },
    locationName: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
      fontWeight: '500',
    },
    title: {
      fontSize: fontSizes['2xl'],
      fontWeight: fontWeights.bold,
      color: colors.text,
      marginBottom: spacing[3],
    },
    ratingsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
      marginBottom: spacing[3],
    },
    ratingItem: {
      fontSize: fontSizes.sm,
      color: colors.text,
    },
    ratingLabel: {
      color: colors.textMuted,
      fontWeight: '400',
    },
    ratingDot: {
      color: colors.border,
    },
    ratingCount: {
      fontSize: fontSizes.xs,
      color: colors.textMuted,
    },
    priceBlock: {
      marginBottom: spacing[4],
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      marginBottom: spacing[1],
    },
    price: {
      fontSize: fontSizes['3xl'],
      fontWeight: fontWeights.bold,
      color: colors.primary,
    },
    originalValue: {
      fontSize: fontSizes.base,
      color: colors.textMuted,
      textDecorationLine: 'line-through',
      marginBottom: spacing[1],
    },
    remaining: {
      fontSize: fontSizes.base,
      color: colors.warning,
      fontWeight: '600',
    },
    description: {
      fontSize: fontSizes.md,
      color: colors.text,
      lineHeight: 22,
      marginBottom: spacing[4],
    },
    section: {
      marginBottom: spacing[4],
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
      marginBottom: spacing[2],
    },
    sectionTitle: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.semibold,
      color: colors.text,
    },
    sectionBody: {
      fontSize: fontSizes.base,
      color: colors.textMuted,
      marginBottom: spacing[3],
    },
    addressActions: {
      flexDirection: 'row',
      gap: spacing[3],
    },
    bottomSpacer: {
      height: spacing[8],
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surfaceElevated,
      padding: spacing[4],
      paddingBottom: spacing[6],
      borderTopWidth: 1,
      borderTopColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    cancelPolicy: {
      fontSize: fontSizes.xs,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: spacing[3],
    },
  });
}
