import 'leaflet/dist/leaflet.css';
import React, { useEffect, useMemo } from 'react';
import { View, ScrollView, Text, Pressable } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { DivIcon, LatLngBounds, latLng } from 'leaflet';
import { MapPin, Navigation } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { MerchantCard } from '@/src/components/composite/MerchantCard';
import { useAuthStore } from '@/src/stores/auth';
import { useCustomerProfile, useToggleFavorite } from '@/src/hooks/useFavorites';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { openDirections } from '@/src/lib/maps';
import { formatDistance } from '@/src/lib/utils';
import type { Merchant, Coordinates } from '@/src/types';

interface MapProps {
  merchants: Merchant[];
  userLocation?: Coordinates;
  selectedMerchantId?: string;
  onSelectMerchant?: (merchant: Merchant) => void;
}

function BoundsFitter({
  merchants,
  userLocation,
}: {
  merchants: Merchant[];
  userLocation?: Coordinates;
}) {
  const map = useMap();
  useEffect(() => {
    if (merchants.length === 0 && !userLocation) return;
    const bounds = new LatLngBounds([]);
    merchants.forEach((m) =>
      bounds.extend(latLng(m.coordinates.latitude, m.coordinates.longitude))
    );
    if (userLocation) bounds.extend(latLng(userLocation.latitude, userLocation.longitude));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, merchants, userLocation]);
  return null;
}

function SelectedMerchantFlyTo({
  selected,
  merchants,
}: {
  selected?: string;
  merchants: Merchant[];
}) {
  const map = useMap();
  useEffect(() => {
    if (!selected) return;
    const merchant = merchants.find((m) => m.id === selected);
    if (!merchant) return;
    map.flyTo([merchant.coordinates.latitude, merchant.coordinates.longitude], 16, {
      duration: 0.4,
    });
  }, [map, selected, merchants]);
  return null;
}

const merchantIconHtml =
  '<div style="width:32px;height:32px;border-radius:50%;background:#EF4444;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>';
const selectedIconHtml =
  '<div style="width:36px;height:36px;border-radius:50%;background:#10B981;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);"></div>';
const userIconHtml =
  '<div style="width:18px;height:18px;border-radius:50%;background:#3B82F6;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>';

function WebFavoriteButton({ merchantId }: { merchantId: string }) {
  const user = useAuthStore((s) => s.user);
  const { data: profile } = useCustomerProfile(user?.id ?? '');
  const toggle = useToggleFavorite();
  const isFavorite = profile?.favorites.includes(merchantId) ?? false;

  return (
    <button
      type="button"
      onClick={() => user && toggle.mutate({ userId: user.id, merchantId, isFavorite })}
      disabled={!user || toggle.isPending}
      // eslint-disable-next-line react-native/no-color-literals -- Leaflet popup renders as a fixed light-themed overlay over map tiles, independent of app dark/light mode
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '8px 12px',
        borderRadius: 8,
        border: 'none',
        backgroundColor: isFavorite ? '#FEE2E2' : '#F3F4F6',
        color: isFavorite ? '#EF4444' : '#374151',
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
      }}
    >
      {isFavorite ? 'Saved' : 'Save'}
    </button>
  );
}

export function LeafletMap({
  merchants,
  userLocation,
  selectedMerchantId,
  onSelectMerchant,
}: MapProps) {
  const colors = useThemeColor();
  const { t } = useTranslation();

  const merchantIcon = useMemo(
    () =>
      new DivIcon({
        className: 'custom-merchant-marker',
        html: merchantIconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      }),
    []
  );

  const selectedIcon = useMemo(
    () =>
      new DivIcon({
        className: 'custom-merchant-marker-selected',
        html: selectedIconHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      }),
    []
  );

  const userIcon = useMemo(
    () =>
      new DivIcon({
        className: 'custom-user-marker',
        html: userIconHtml,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
    []
  );

  const selected = merchants.find((m) => m.id === selectedMerchantId);

  const center: [number, number] = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : [13.7462, 100.5347];

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 overflow-hidden rounded-b-3xl bg-card">
        <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <BoundsFitter merchants={merchants} userLocation={userLocation} />
          <SelectedMerchantFlyTo selected={selectedMerchantId} merchants={merchants} />
          {userLocation && (
            <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon} />
          )}
          {merchants.map((merchant) => (
            <Marker
              key={merchant.id}
              position={[merchant.coordinates.latitude, merchant.coordinates.longitude]}
              icon={selectedMerchantId === merchant.id ? selectedIcon : merchantIcon}
              eventHandlers={{
                click: () => onSelectMerchant?.(merchant),
              }}
            >
              <Popup>
                <div style={{ minWidth: 180, padding: 4 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                    {merchant.name}
                  </div>
                  <div
                    // eslint-disable-next-line react-native/no-color-literals -- Leaflet popup renders as a fixed light-themed overlay over map tiles, independent of app dark/light mode
                    style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}
                  >
                    {merchant.address.street}, {merchant.address.district}
                  </div>
                  {merchant.distance != null && (
                    <div
                      // eslint-disable-next-line react-native/no-color-literals -- Leaflet popup renders as a fixed light-themed overlay over map tiles, independent of app dark/light mode
                      style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}
                    >
                      {formatDistance(merchant.distance)} {t('customer.merchant.away')}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <WebFavoriteButton merchantId={merchant.id} />
                    <button
                      type="button"
                      onClick={() => openDirections(merchant.coordinates, merchant.name)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: 'none',
                        backgroundColor: `${colors.primary}15`,
                        color: colors.primary,
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Get directions
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </View>

      {selected && (
        <View className="px-4 py-3">
          <Pressable
            onPress={() => onSelectMerchant?.(selected)}
            className="rounded-2xl bg-card p-4 shadow-sm"
            style={{ borderWidth: 1, borderColor: colors.border }}
            accessibilityRole="button"
            accessibilityLabel={selected.name}
            accessibilityHint={t('customer.merchant.viewMerchantHint')}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-semibold text-foreground">{selected.name}</Text>
                <Text className="text-sm text-muted" numberOfLines={1}>
                  {selected.address.street}, {selected.address.district}
                </Text>
              </View>
              <Navigation size={20} color={colors.primary} />
            </View>
          </Pressable>
        </View>
      )}

      <View className="px-4 pb-4">
        <Text className="mb-2 text-sm font-semibold text-muted">Nearby merchants</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
          {merchants.map((merchant) => (
            <View key={merchant.id} className="mr-3 w-72">
              <MerchantCard
                merchant={merchant}
                testID={selectedMerchantId === merchant.id ? 'selected-merchant-card' : undefined}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
