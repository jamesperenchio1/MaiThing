import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, Image } from 'react-native';
import { Minus, Plus, Heart, Share2, Clock, MapPin, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Button } from '@/src/components/ui/Button';
import { Text } from '@/src/components/ui/Text';
import { Badge } from '@/src/components/ui/Badge';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/layout/Screen';
import { Header } from '@/src/components/layout/Header';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useListing } from '@/src/hooks/useListings';
import { useMerchant } from '@/src/hooks/useMerchants';
import { useCartStore } from '@/src/stores/cart';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatCurrency } from '@/src/lib/utils';

export default function ListingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { data: listing, isLoading } = useListing(id);
  const { data: merchant } = useMerchant(listing?.merchantId ?? '');
  const [quantity, setQuantity] = useState(1);
  const colors = useThemeColor();
  const addItem = useCartStore((s) => s.addItem);

  if (isLoading || !listing) {
    return (
      <Screen>
        <Header />
        <View className="flex-1 items-center justify-center">
          <Text variant="body" className="text-muted">
            {t('common.loading')}
          </Text>
        </View>
      </Screen>
    );
  }

  const isMystery = listing.type === 'mystery_box';
  const discount = Math.round((1 - listing.salePrice / listing.originalPrice) * 100);
  const isSoldOut = listing.quantityRemaining === 0;

  const handleAddToCart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addItem(listing, quantity);
    router.push('/(customer)/(tabs)/orders' as any);
  };

  return (
    <Screen testID="listing-detail-screen" scrollable={false}>
      <Header testID="listing-detail-header" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="relative h-72 w-full">
          <Image source={{ uri: listing.images[0] }} className="h-full w-full" resizeMode="cover" />
          <View className="absolute left-4 top-4">
            <Badge variant={isMystery ? 'warning' : 'info'}>
              {isMystery ? 'Mystery Box' : 'Fixed Item'}
            </Badge>
          </View>
          <View className="absolute right-4 top-4 flex-row space-x-2">
            <PressableScale
              onPress={() => {}}
              className="rounded-full bg-black/30 p-2"
              scale={0.9}
            >
              <Heart size={20} color="#fff" />
            </PressableScale>
            <PressableScale
              onPress={() => {}}
              className="rounded-full bg-black/30 p-2"
              scale={0.9}
            >
              <Share2 size={20} color="#fff" />
            </PressableScale>
          </View>
        </View>

        <View className="-mt-6 rounded-t-3xl bg-background px-6 pt-6">
          <View className="mb-4 flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Text variant="h2" className="mb-1">
                {listing.title}
              </Text>
              <Text variant="body" className="text-muted">
                {merchant?.name}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-2xl font-bold text-primary">
                {formatCurrency(listing.salePrice)}
              </Text>
              <Text className="text-sm text-muted line-through">
                {formatCurrency(listing.originalPrice)}
              </Text>
              <Text className="text-sm font-semibold text-primary">-{discount}%</Text>
            </View>
          </View>

          <Card variant="outlined" className="mb-6">
            <View className="flex-row items-center">
              <Clock size={20} color={colors.primary} />
              <View className="ml-3 flex-1">
                <Text variant="body-sm" className="font-semibold">
                  {t('customer.listing.pickupWindow')}
                </Text>
                <Text variant="caption" className="text-muted">
                  {new Date(listing.pickupWindowStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(listing.pickupWindowEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          </Card>

          <View testID="listing-description-section" className="mb-6">
            <Text testID="listing-description-title" variant="h3" className="mb-2">
              {t('customer.listing.description')}
            </Text>
            <Text testID="listing-description-text" variant="body" className="text-muted">
              {listing.description}
            </Text>
          </View>

          {listing.allergens.length > 0 && (
            <View className="mb-6">
              <Text variant="h3" className="mb-2">
                {t('customer.listing.allergens')}
              </Text>
              <View className="flex-row flex-wrap">
                {listing.allergens.map((a) => (
                  <Badge key={a} variant="danger" className="mr-2 mb-2">
                    {a}
                  </Badge>
                ))}
              </View>
            </View>
          )}

          {listing.dietaryTags.length > 0 && (
            <View className="mb-6">
              <Text variant="h3" className="mb-2">
                {t('customer.listing.dietary')}
              </Text>
              <View className="flex-row flex-wrap">
                {listing.dietaryTags.map((tag) => (
                  <Badge key={tag} variant="success" className="mr-2 mb-2">
                    {tag}
                  </Badge>
                ))}
              </View>
            </View>
          )}

          <View className="mb-6 rounded-2xl bg-muted/10 p-4">
            <View className="flex-row items-start">
              <AlertCircle size={20} color={colors.muted} className="mr-3 mt-0.5" />
              <Text variant="body-sm" className="flex-1 text-muted">
                {merchant?.pickupInstructions}
              </Text>
            </View>
          </View>

          <View className="mb-6 flex-row items-center justify-center">
            <PressableScale
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              className="rounded-2xl bg-muted/10 p-3"
              scale={0.9}
              disabled={quantity <= 1}
            >
              <Minus size={20} color={colors.foreground} />
            </PressableScale>
            <Text variant="h2" className="mx-6 w-8 text-center">
              {quantity}
            </Text>
            <PressableScale
              onPress={() => setQuantity((q) => Math.min(q + 1, listing.quantityRemaining))}
              className="rounded-2xl bg-muted/10 p-3"
              scale={0.9}
              disabled={quantity >= listing.quantityRemaining}
            >
              <Plus size={20} color={colors.foreground} />
            </PressableScale>
          </View>
        </View>
      </ScrollView>

      <View className="border-t border-border bg-background px-6 py-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text variant="body-sm" className="text-muted">
            {listing.quantityRemaining} left
          </Text>
          <Text className="text-xl font-bold">
            {formatCurrency(listing.salePrice * quantity)}
          </Text>
        </View>
        <Button
          testID="buy-now-button"
          fullWidth
          disabled={isSoldOut}
          loading={false}
          onPress={handleAddToCart}
        >
          {isSoldOut ? t('customer.listing.soldOut') : t('customer.listing.buyNow')}
        </Button>
      </View>
    </Screen>
  );
}
