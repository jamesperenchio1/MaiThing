import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Image, RefreshControl, Alert, Modal, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Package,
  Plus,
  Copy,
  Pencil,
  Trash2,
  Search,
  X,
  FileText,
  ChevronRight,
  Clock,
  Check,
  Pause,
  Tag,
} from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Screen } from '@/src/components/layout/Screen';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { FlashList } from '@shopify/flash-list';
import {
  useListings,
  useUpdateListing,
  useDeleteListing,
  useListingTemplates,
  useDeleteListingTemplate,
} from '@/src/hooks/useListings';
import { useMerchantByOwner } from '@/src/hooks/useMerchants';
import { useCoupons } from '@/src/hooks/useCoupons';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useAuthStore } from '@/src/stores/auth';
import { formatCurrency } from '@/src/lib/utils';
import type { Listing, ListingStatus } from '@/src/types';

const TABS: ListingStatus[] = ['active', 'sold_out', 'expired', 'draft'];

const statusVariantMap: Record<
  ListingStatus,
  'default' | 'warning' | 'success' | 'danger' | 'info'
> = {
  active: 'success',
  sold_out: 'warning',
  expired: 'danger',
  draft: 'info',
};

function shiftWindowToToday(isoString: string): string {
  const original = new Date(isoString);
  const today = new Date();
  today.setHours(original.getHours(), original.getMinutes(), original.getSeconds(), 0);
  return today.toISOString();
}

function InventoryCard({
  listing,
  merchantId,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onDelete,
  isSelecting,
  isSelected,
  onLongPress,
  onSelect,
}: {
  listing: Listing;
  merchantId: string;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  isSelecting: boolean;
  isSelected: boolean;
  onLongPress: () => void;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColor();
  const updateListing = useUpdateListing();
  const [showPromoModal, setShowPromoModal] = useState(false);

  const { data: coupons } = useCoupons(merchantId);

  const attachedCoupon = coupons?.find((c) => c.id === listing.couponId) ?? null;

  const isActive = listing.status === 'active';
  const pickupStart = new Date(listing.pickupWindowStart).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const pickupEnd = new Date(listing.pickupWindowEnd).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const statusLabelKey: Record<ListingStatus, string> = {
    active: 'active',
    sold_out: 'soldOut',
    expired: 'expired',
    draft: 'drafts',
  };

  return (
    <PressableScale
      onPress={
        isSelecting
          ? () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect();
            }
          : undefined
      }
      onLongPress={
        !isSelecting
          ? () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onLongPress();
            }
          : undefined
      }
      scale={0.98}
    >
      <Card variant="elevated" className="mb-3 flex-row overflow-hidden p-0">
        {isSelecting && (
          <View className="items-center justify-center px-3">
            {isSelected ? (
              <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                <Check size={14} color={colors.white} />
              </View>
            ) : (
              <View className="w-6 h-6 rounded-full border-2 border-primary bg-transparent" />
            )}
          </View>
        )}
        <Image
          source={{ uri: listing.images[0] }}
          className="h-full w-28"
          resizeMode="cover"
          style={{ backgroundColor: colors.border }}
        />
        <View className="flex-1 p-3">
          <View className="mb-1 flex-row items-center justify-between">
            <Text variant="body-sm" className="flex-1 font-semibold" numberOfLines={1}>
              {listing.title}
            </Text>
            <Badge variant={statusVariantMap[listing.status]} className="ml-2">
              {t(`merchant.inventory.${statusLabelKey[listing.status]}`)}
            </Badge>
          </View>
          <Text variant="body-sm" className="mb-1 text-muted">
            {formatCurrency(listing.salePrice)} ·{' '}
            {t('merchant.inventory.lowStock', { count: listing.quantityRemaining })}
            {listing.quantityRemaining > 0 && listing.quantityRemaining <= (listing.lowStockThreshold ?? 3) && (
              <Text variant="body-sm" className="font-semibold text-danger">
                {' '}
                · Low stock
              </Text>
            )}
          </Text>
          <View className="mb-2 flex-row items-center text-muted">
            <Clock size={12} color={colors.muted} />
            <Text variant="caption" className="ml-1 text-muted">
              {pickupStart} – {pickupEnd}
            </Text>
          </View>
          {attachedCoupon && (
            <View className="mb-2 flex-row items-center">
              <View className="flex-row items-center rounded-full bg-primary/10 px-2 py-0.5">
                <Tag size={10} color={colors.primary} />
                <Text variant="caption" className="ml-1 font-semibold text-primary">
                  {attachedCoupon.code}
                </Text>
              </View>
            </View>
          )}
          {!isSelecting && (
            <View className="mt-auto flex-row items-center justify-between border-t border-border pt-2">
              <View className="flex-row items-center">
                <PressableScale
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onEdit();
                  }}
                  scale={0.95}
                  className="mr-3"
                >
                  <View className="flex-row items-center">
                    <Pencil size={14} color={colors.muted} />
                    <Text variant="caption" className="ml-1 text-muted">
                      {t('merchant.inventory.edit')}
                    </Text>
                  </View>
                </PressableScale>
                <PressableScale
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onDuplicate();
                  }}
                  scale={0.9}
                  className="mr-3 p-1"
                >
                  <Copy size={16} color={colors.muted} />
                </PressableScale>
                <PressableScale
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onDelete();
                  }}
                  scale={0.9}
                  className="p-1 mr-3"
                >
                  <Trash2 size={16} color={colors.danger} />
                </PressableScale>
                <PressableScale
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowPromoModal(true);
                  }}
                  scale={0.9}
                  className="p-1"
                >
                  <Tag size={16} color={listing.couponId ? colors.primary : colors.muted} />
                </PressableScale>
              </View>
              <PressableScale
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onToggleStatus();
                }}
                scale={0.95}
                disabled={updateListing.isPending}
              >
                <View
                  className={`rounded-full px-3 py-1 ${isActive ? 'bg-danger/10' : 'bg-primary/10'}`}
                >
                  <Text
                    variant="caption"
                    className={`font-semibold ${isActive ? 'text-danger' : 'text-primary'}`}
                  >
                    {isActive ? t('merchant.inventory.markSoldOut') : t('merchant.inventory.restock')}
                  </Text>
                </View>
              </PressableScale>
            </View>
          )}
        </View>
      </Card>

      <Modal
        visible={showPromoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPromoModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[70%] rounded-t-3xl bg-card px-4 pb-8 pt-4">
            <View className="mb-4 flex-row items-center justify-between">
              <PressableScale
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowPromoModal(false);
                }}
                scale={0.95}
              >
                <X size={22} color={colors.muted} />
              </PressableScale>
              <Text variant="h3">Attach promotion</Text>
              <View style={{ width: 22 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {coupons && coupons.length > 0 ? (
                coupons.map((coupon) => {
                  const isAttached = listing.couponId === coupon.id;
                  return (
                    <PressableScale
                      key={coupon.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        updateListing.mutate(
                          { id: listing.id, data: { couponId: coupon.id } },
                          { onSuccess: () => setShowPromoModal(false) }
                        );
                      }}
                      scale={0.98}
                      className="mb-3"
                    >
                      <View
                        className={`rounded-xl border p-3 ${
                          isAttached ? 'border-primary bg-primary/10' : 'border-border bg-background'
                        }`}
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1">
                            <Text variant="body-sm" className="font-semibold">
                              {coupon.code}
                            </Text>
                            <Text variant="caption" className="text-muted">
                              {coupon.discountType === 'percentage'
                                ? `${coupon.discountValue}% off`
                                : `฿${coupon.discountValue} off`}
                              {coupon.minOrderAmount
                                ? ` · min ฿${coupon.minOrderAmount}`
                                : ''}
                            </Text>
                            {coupon.description ? (
                              <Text variant="caption" className="mt-0.5 text-muted" numberOfLines={1}>
                                {coupon.description}
                              </Text>
                            ) : null}
                          </View>
                          {isAttached && <Check size={18} color={colors.primary} />}
                        </View>
                      </View>
                    </PressableScale>
                  );
                })
              ) : (
                <Text variant="body-sm" className="text-center text-muted py-6">
                  No active promotions. Create one in the Promotions tab.
                </Text>
              )}

              {listing.couponId && (
                <PressableScale
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    updateListing.mutate(
                      { id: listing.id, data: { couponId: undefined } },
                      { onSuccess: () => setShowPromoModal(false) }
                    );
                  }}
                  scale={0.97}
                  className="mt-2"
                >
                  <View className="rounded-xl border border-danger/30 bg-danger/5 p-3 items-center">
                    <Text variant="body-sm" className="font-semibold text-danger">
                      Remove promo
                    </Text>
                  </View>
                </PressableScale>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </PressableScale>
  );
}

export default function InventoryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();
  const [activeTab, setActiveTab] = useState<ListingStatus>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [duplicateListing, setDuplicateListing] = useState<Listing | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAdjustPriceModal, setShowAdjustPriceModal] = useState(false);
  const [adjustPriceValue, setAdjustPriceValue] = useState('');

  const { data: merchant, isLoading: isLoadingMerchant } = useMerchantByOwner(user?.id ?? '');
  const merchantId = merchant?.id;

  const {
    data: listings,
    isLoading: isLoadingListings,
    isRefetching,
    isError,
    refetch,
    dataUpdatedAt,
  } = useListings({
    merchantId,
    status: activeTab,
    query: searchQuery.trim() || undefined,
  });

  const { data: templates, isLoading: isLoadingTemplates } = useListingTemplates(merchantId ?? '');
  const updateListing = useUpdateListing();
  const deleteListing = useDeleteListing();
  const deleteTemplate = useDeleteListingTemplate();

  const isLoading = isLoadingMerchant || isLoadingListings;

  const enterSelectionMode = (listingId: string) => {
    setIsSelecting(true);
    setSelectedIds(new Set([listingId]));
  };

  const toggleSelection = (listingId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(listingId)) {
        next.delete(listingId);
      } else {
        next.add(listingId);
      }
      return next;
    });
  };

  const exitSelectionMode = () => {
    setIsSelecting(false);
    setSelectedIds(new Set());
  };

  const handleBulkPause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectedIds.forEach((id) => {
      updateListing.mutate({ id, data: { status: 'draft' } });
    });
    exitSelectionMode();
  };

  const handleBulkDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      t('common.delete'),
      `Delete ${selectedIds.size} listing(s)?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            selectedIds.forEach((id) => deleteListing.mutate(id));
            exitSelectionMode();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleBulkAdjustPrice = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAdjustPriceValue('');
    setShowAdjustPriceModal(true);
  };

  const handleApplyAdjustPrice = () => {
    const price = parseFloat(adjustPriceValue);
    if (isNaN(price) || price <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectedIds.forEach((id) => {
      updateListing.mutate({ id, data: { salePrice: price } });
    });
    setShowAdjustPriceModal(false);
    exitSelectionMode();
  };

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetch();
  };

  const handleToggleStatus = (listing: Listing) => {
    const nextStatus = listing.status === 'active' ? 'sold_out' : 'active';
    updateListing.mutate({
      id: listing.id,
      data: {
        status: nextStatus,
        quantityRemaining: nextStatus === 'sold_out' ? 0 : listing.quantity,
      },
    });
  };

  const handleDelete = (listing: Listing) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      t('common.delete'),
      `${t('merchant.inventory.delete')} "${listing.title}"?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteListing.mutate(listing.id),
        },
      ],
      { cancelable: true }
    );
  };

  const handleDuplicate = (listing: Listing) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDuplicateListing(listing);
    setShowDuplicateModal(true);
  };

  const handleSameTimeToday = () => {
    if (!duplicateListing) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const shiftedStart = shiftWindowToToday(duplicateListing.pickupWindowStart);
    const shiftedEnd = shiftWindowToToday(duplicateListing.pickupWindowEnd);

    setShowDuplicateModal(false);
    setDuplicateListing(null);

    router.push({
      pathname: '/(merchant)/listings/new',
      params: {
        duplicateId: duplicateListing.id,
        title: duplicateListing.title,
        description: duplicateListing.description,
        type: duplicateListing.type,
        originalPrice: String(duplicateListing.originalPrice),
        salePrice: String(duplicateListing.salePrice),
        category: duplicateListing.category,
        quantity: String(duplicateListing.quantity),
        boxSize: duplicateListing.type === 'mystery_box' ? duplicateListing.boxSize : undefined,
        images: JSON.stringify(duplicateListing.images),
        dietaryTags: JSON.stringify(duplicateListing.dietaryTags),
        allergens: JSON.stringify(duplicateListing.allergens),
        pickupWindowStart: shiftedStart,
        pickupWindowEnd: shiftedEnd,
      },
    } as any);
  };

  const handleChooseNewWindow = () => {
    if (!duplicateListing) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setShowDuplicateModal(false);
    setDuplicateListing(null);

    router.push({
      pathname: '/(merchant)/listings/new',
      params: {
        duplicateId: duplicateListing.id,
        title: duplicateListing.title,
        description: duplicateListing.description,
        type: duplicateListing.type,
        originalPrice: String(duplicateListing.originalPrice),
        salePrice: String(duplicateListing.salePrice),
        category: duplicateListing.category,
        quantity: String(duplicateListing.quantity),
        boxSize: duplicateListing.type === 'mystery_box' ? duplicateListing.boxSize : undefined,
        images: JSON.stringify(duplicateListing.images),
        dietaryTags: JSON.stringify(duplicateListing.dietaryTags),
        allergens: JSON.stringify(duplicateListing.allergens),
      },
    } as any);
  };

  const handleEdit = (listing: Listing) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/(merchant)/listings/new',
      params: { id: listing.id },
    } as any);
  };

  const handleUseTemplate = (templateId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowTemplates(false);
    router.push({
      pathname: '/(merchant)/listings/new',
      params: { templateId },
    } as any);
  };

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const ribbonVisible = isSelecting && selectedIds.size > 0;

  const listHeader = (
    <View className="pt-4 pb-2">
      <View className="mb-4 flex-row items-center justify-between">
        <Text testID="inventory-title" variant="h1">
          {t('merchant.inventory.title')}
        </Text>
        <Button
          testID="new-listing-button"
          size="sm"
          leftIcon={<Plus size={16} color={colors.white} />}
          onPress={() => router.push('/(merchant)/listings/new' as any)}
        >
          {t('merchant.createListing.title')}
        </Button>
      </View>

      <Input
        testID="inventory-search-input"
        placeholder={t('merchant.inventory.search')}
        value={searchQuery}
        onChangeText={setSearchQuery}
        leftIcon={<Search size={18} color={colors.muted} />}
        rightIcon={
          searchQuery ? (
            <PressableScale onPress={() => setSearchQuery('')} scale={0.9}>
              <X size={18} color={colors.muted} />
            </PressableScale>
          ) : undefined
        }
        containerClassName="mb-4"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 8 }}
        className="mb-2"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <PressableScale
              key={tab}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (isSelecting) exitSelectionMode();
                setActiveTab(tab);
              }}
              scale={0.97}
            >
              <View
                className={`mr-2 rounded-full px-4 py-2 ${
                  isActive ? 'bg-primary' : 'bg-muted/10 border border-border'
                }`}
              >
                <Text
                  variant="body-sm"
                  className={`font-semibold ${isActive ? 'text-white' : 'text-foreground'}`}
                >
                  {t(`merchant.inventory.${tab === 'sold_out' ? 'soldOut' : tab === 'draft' ? 'drafts' : tab}`)}
                </Text>
              </View>
            </PressableScale>
          );
        })}
      </ScrollView>

      {lastUpdated && (
        <Text variant="caption" className="mb-2 text-muted">
          Last updated: {lastUpdated}
        </Text>
      )}

      <PressableScale
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowTemplates(true);
        }}
        scale={0.98}
        className="mb-2"
      >
        <Card variant="outlined" className="flex-row items-center justify-between py-3">
          <View className="flex-row items-center">
            <FileText size={18} color={colors.primary} />
            <Text variant="body-sm" className="ml-2 font-semibold">
              {t('merchant.inventory.templates')}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.muted} />
        </Card>
      </PressableScale>
    </View>
  );

  return (
    <Screen testID="inventory-screen" scrollable={false} className="bg-background">
      {isError || isLoading ? (
        <View className="flex-1 px-6 pb-6">
          {listHeader}
          {isError ? (
            <ErrorState
              title={t('common.error')}
              message={t('common.error')}
              onRetry={refetch}
              retryLabel={t('common.retry')}
            />
          ) : (
            <>
              <Skeleton width="100%" height={92} className="mb-3 rounded-2xl" />
              <Skeleton width="100%" height={92} className="mb-3 rounded-2xl" />
              <Skeleton width="100%" height={92} className="mb-3 rounded-2xl" />
            </>
          )}
        </View>
      ) : (
        <FlashList
          className="flex-1"
          data={listings ?? []}
          renderItem={({ item }) => (
            <InventoryCard
              listing={item}
              merchantId={merchantId ?? ''}
              onEdit={() => handleEdit(item)}
              onDuplicate={() => handleDuplicate(item)}
              onToggleStatus={() => handleToggleStatus(item)}
              onDelete={() => handleDelete(item)}
              isSelecting={isSelecting}
              isSelected={selectedIds.has(item.id)}
              onLongPress={() => enterSelectionMode(item.id)}
              onSelect={() => toggleSelection(item.id)}
            />
          )}
          keyExtractor={(item) => item.id}
          estimatedItemSize={140}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <EmptyState
              icon={<Package size={32} color={colors.muted} />}
              title={t('merchant.inventory.noListings')}
              description={t('merchant.createListing.title')}
            />
          }
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: ribbonVisible ? 120 : 24,
          }}
        />
      )}

      {ribbonVisible && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-card border-t border-border px-4 pt-3 pb-8"
        >
          <View className="mb-3 items-center">
            <Text variant="body-sm" className="font-semibold text-foreground">
              {selectedIds.size} selected
            </Text>
          </View>
          <View className="flex-row items-center justify-around">
            <PressableScale
              onPress={handleBulkPause}
              scale={0.95}
              className="items-center px-2"
            >
              <Pause size={22} color={colors.muted} />
              <Text variant="caption" className="mt-1 text-muted">
                Pause
              </Text>
            </PressableScale>
            <PressableScale
              onPress={handleBulkDelete}
              scale={0.95}
              className="items-center px-2"
            >
              <Trash2 size={22} color={colors.danger} />
              <Text variant="caption" className="mt-1 text-danger">
                Delete
              </Text>
            </PressableScale>
            <PressableScale
              onPress={handleBulkAdjustPrice}
              scale={0.95}
              className="items-center px-2"
            >
              <Tag size={22} color={colors.primary} />
              <Text variant="caption" className="mt-1 text-primary">
                Adjust price
              </Text>
            </PressableScale>
            <PressableScale
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                exitSelectionMode();
              }}
              scale={0.95}
              className="items-center px-2"
            >
              <X size={22} color={colors.muted} />
              <Text variant="caption" className="mt-1 text-muted">
                Cancel
              </Text>
            </PressableScale>
          </View>
        </View>
      )}

      <Modal
        visible={showTemplates}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTemplates(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[80%] rounded-t-3xl bg-card px-4 pb-8 pt-4">
            <View className="mb-4 flex-row items-center justify-between">
              <Button variant="ghost" onPress={() => setShowTemplates(false)}>
                {t('common.cancel')}
              </Button>
              <Text variant="h3">{t('merchant.inventory.templates')}</Text>
              <View className="w-12" />
            </View>
            {isLoadingTemplates ? (
              <Skeleton width="100%" height={80} className="mb-3 rounded-2xl" />
            ) : templates && templates.length > 0 ? (
              <View className="flex-1">
                <FlashList
                  data={templates}
                  keyExtractor={(item) => item.id}
                  estimatedItemSize={80}
                  renderItem={({ item }) => (
                    <Card
                      variant="outlined"
                      className="mb-3 flex-row items-center justify-between p-3"
                    >
                      <View className="flex-1">
                        <Text variant="body-sm" className="font-semibold" numberOfLines={1}>
                          {item.name || item.title}
                        </Text>
                        <Text variant="caption" className="text-muted">
                          {formatCurrency(item.salePrice)} · {item.category}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Button
                          size="sm"
                          onPress={() => handleUseTemplate(item.id)}
                          className="mr-2"
                        >
                          {t('merchant.inventory.useTemplate')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onPress={() => deleteTemplate.mutate(item.id)}
                        >
                          <Trash2 size={16} color={colors.danger} />
                        </Button>
                      </View>
                    </Card>
                  )}
                  ListEmptyComponent={
                    <EmptyState
                      icon={<FileText size={32} color={colors.muted} />}
                      title={t('merchant.inventory.noListings')}
                    />
                  }
                />
              </View>
            ) : (
              <EmptyState
                icon={<FileText size={32} color={colors.muted} />}
                title={t('merchant.inventory.noListings')}
                description={t('merchant.createListing.title')}
              />
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDuplicateModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowDuplicateModal(false);
          setDuplicateListing(null);
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-background px-5 pb-8 pt-5">
            <Text variant="h3" className="mb-5">
              When is pickup?
            </Text>

            {duplicateListing && (
              <>
                <PressableScale
                  onPress={handleSameTimeToday}
                  scale={0.98}
                  className="mb-3"
                >
                  <View className="flex-row items-center border-l-4 border-primary rounded-lg bg-primary/5 p-4">
                    <View className="flex-1">
                      <Text variant="body-sm" className="font-semibold text-foreground">
                        Same time today
                      </Text>
                      <Text variant="caption" className="mt-1 text-muted">
                        {new Date(duplicateListing.pickupWindowStart).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        –{' '}
                        {new Date(duplicateListing.pickupWindowEnd).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        today
                      </Text>
                    </View>
                    <Check size={20} color={colors.primary} />
                  </View>
                </PressableScale>

                <PressableScale onPress={handleChooseNewWindow} scale={0.98} className="mb-6">
                  <View className="flex-row items-center rounded-lg border border-border p-4">
                    <View className="flex-1">
                      <Text variant="body-sm" className="font-semibold text-foreground">
                        Choose new window
                      </Text>
                      <Text variant="caption" className="mt-1 text-muted">
                        Set a different pickup time
                      </Text>
                    </View>
                  </View>
                </PressableScale>
              </>
            )}

            <Button
              variant="ghost"
              className="w-full"
              onPress={() => {
                setShowDuplicateModal(false);
                setDuplicateListing(null);
              }}
            >
              {t('common.cancel')}
            </Button>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAdjustPriceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdjustPriceModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-card px-5 pb-8 pt-5">
            <Text variant="h3" className="mb-1">
              Adjust sale price
            </Text>
            <Text variant="body-sm" className="mb-4 text-muted">
              Applied to {selectedIds.size} selected listing(s)
            </Text>
            <Input
              placeholder="New sale price (THB)"
              value={adjustPriceValue}
              onChangeText={setAdjustPriceValue}
              keyboardType="numeric"
              containerClassName="mb-4"
            />
            <View className="flex-row gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAdjustPriceModal(false);
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                className="flex-1"
                onPress={handleApplyAdjustPrice}
                disabled={!adjustPriceValue || isNaN(parseFloat(adjustPriceValue)) || parseFloat(adjustPriceValue) <= 0}
              >
                Apply
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
