import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, RefreshControl, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Package, Plus, Search, X, FileText, ChevronRight } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Screen } from '@/src/components/layout/Screen';
import { Header } from '@/src/components/layout/Header';
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
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useAuthStore } from '@/src/stores/auth';
import type { Listing, ListingStatus } from '@/src/types';

import { InventoryCard } from './_components-inventory/InventoryCard';
import { InventoryTabs } from './_components-inventory/InventoryTabs';
import { TemplateSheet } from './_components-inventory/TemplateSheet';
import { DuplicatePickupSheet } from './_components-inventory/DuplicatePickupSheet';
import { BulkAdjustPriceSheet } from './_components-inventory/BulkAdjustPriceSheet';
import { BulkActionBar } from './_components-inventory/BulkActionBar';
import { PendingActionBanner } from './_components-inventory/PendingActionBanner';
import { shiftWindowToToday } from './_components-inventory/utils';
import type { PendingAction } from './_components-inventory/types';

export default function InventoryScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
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

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [countdown, setCountdown] = useState(5);

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

  useEffect(() => {
    if (!pendingAction) {
      setCountdown(5);
      return;
    }
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pendingAction]);

  useEffect(() => {
    if (countdown !== 0 || !pendingAction) return;
    if (pendingAction.type === 'delete') {
      deleteListing.mutate(pendingAction.id);
    } else {
      updateListing.mutate({ id: pendingAction.id, data: pendingAction.data });
    }
    setPendingAction(null);
  }, [countdown, pendingAction, deleteListing, updateListing]);

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
      t('merchant.inventory.deleteConfirmCount', { count: selectedIds.size }),
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
      const listing = (listings ?? []).find((l) => l.id === id);
      if (listing && price < listing.originalPrice) {
        updateListing.mutate({ id, data: { salePrice: price } });
      }
    });
    setShowAdjustPriceModal(false);
    exitSelectionMode();
  };

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetch();
  };

  const handleToggleStatus = (listing: Listing) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const nextStatus = listing.status === 'active' ? 'sold_out' : 'active';
    setPendingAction({
      type: 'status',
      id: listing.id,
      title: listing.title,
      nextStatus,
      data: {
        status: nextStatus,
        quantityRemaining: nextStatus === 'sold_out' ? 0 : listing.quantity,
      },
    });
  };

  const handleDelete = (listing: Listing) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPendingAction({
      type: 'delete',
      id: listing.id,
      title: listing.title,
    });
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

  const handleTabPress = (tab: ListingStatus) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSelecting) exitSelectionMode();
    setActiveTab(tab);
  };

  const handleDeleteTemplate = (templateId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    deleteTemplate.mutate(templateId);
  };

  const handleCloseDuplicateModal = () => {
    setShowDuplicateModal(false);
    setDuplicateListing(null);
  };

  const handleCancelSelection = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    exitSelectionMode();
  };

  const handleUndoPendingAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPendingAction(null);
  };

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString(i18n.language, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const ribbonVisible = isSelecting && selectedIds.size > 0;

  const listHeader = (
    <View className="pt-4 pb-2">
      <View className="mb-4 flex-row items-center justify-end">
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

      <InventoryTabs activeTab={activeTab} onTabPress={handleTabPress} />

      {lastUpdated && (
        <Text variant="caption" className="mb-2 text-muted">
          {t('merchant.inventory.lastUpdated', { time: lastUpdated })}
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
      <Header title={t('merchant.inventory.title')} titleTestID="inventory-title" />
      {pendingAction && (
        <PendingActionBanner
          pendingAction={pendingAction}
          countdown={countdown}
          onUndo={handleUndoPendingAction}
        />
      )}
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
        <BulkActionBar
          selectedCount={selectedIds.size}
          onPause={handleBulkPause}
          onDelete={handleBulkDelete}
          onAdjustPrice={handleBulkAdjustPrice}
          onCancel={handleCancelSelection}
        />
      )}

      <TemplateSheet
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        isLoadingTemplates={isLoadingTemplates}
        templates={templates}
        onUseTemplate={handleUseTemplate}
        onDeleteTemplate={handleDeleteTemplate}
      />

      <DuplicatePickupSheet
        isOpen={showDuplicateModal}
        onClose={handleCloseDuplicateModal}
        duplicateListing={duplicateListing}
        onSameTimeToday={handleSameTimeToday}
        onChooseNewWindow={handleChooseNewWindow}
      />

      <BulkAdjustPriceSheet
        isOpen={showAdjustPriceModal}
        onClose={() => setShowAdjustPriceModal(false)}
        selectedCount={selectedIds.size}
        value={adjustPriceValue}
        onChangeValue={setAdjustPriceValue}
        onApply={handleApplyAdjustPrice}
      />
    </Screen>
  );
}
