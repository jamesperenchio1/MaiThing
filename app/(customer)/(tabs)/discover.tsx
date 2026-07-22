import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, ScrollView } from 'react-native';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Screen } from '@/src/components/layout/Screen';
import { SearchBar } from '@/src/components/layout/SearchBar';
import { ListingCard } from '@/src/components/composite/ListingCard';
import { CategoryChip } from '@/src/components/composite/CategoryChip';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { useListings } from '@/src/hooks/useListings';
import { useCategories } from '@/src/hooks/useMerchants';

export default function DiscoverScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { query } = useLocalSearchParams<{ query?: string }>();
  const [searchQuery, setSearchQuery] = useState(query ?? '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [listingType, setListingType] = useState<'all' | 'mystery_box' | 'fixed_item'>('all');

  const { data: listings, isLoading } = useListings({
    query: searchQuery || undefined,
    category: selectedCategory ?? undefined,
    type: listingType === 'all' ? undefined : listingType,
    lat: 13.7462,
    lng: 100.5347,
    radius: 50000,
  });

  const { data: categories } = useCategories();

  return (
    <Screen testID="discover-screen" scrollable className="bg-background">
      <View className="px-6 pt-4 pb-2">
        <Text testID="discover-title" variant="h1" className="mb-4">
          {t('common.discover')}
        </Text>
        <SearchBar
          testID="discover-search-bar"
          placeholder={t('common.search')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmit={setSearchQuery}
          className="mb-4"
        />

        <View className="mb-4 flex-row items-center">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
            {categories?.map((category) => (
              <CategoryChip
                key={category.id}
                category={category}
                isActive={selectedCategory === category.id}
                onPress={() =>
                  setSelectedCategory((prev) => (prev === category.id ? null : category.id))
                }
                locale={i18n.language as 'en' | 'th'}
              />
            ))}
          </ScrollView>
        </View>

        <View className="mb-4 flex-row space-x-2">
          {(['all', 'mystery_box', 'fixed_item'] as const).map((type) => (
            <Button
              key={type}
              variant={listingType === type ? 'primary' : 'secondary'}
              size="sm"
              onPress={() => setListingType(type)}
            >
              {type === 'all' ? 'All' : type === 'mystery_box' ? 'Mystery Box' : 'Fixed Item'}
            </Button>
          ))}
        </View>
      </View>

      <View className="px-6 pb-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={140} className="mb-3 rounded-3xl" />
            ))
          : listings?.map((listing) => (
              <ListingCard key={listing.id} listing={listing} variant="horizontal" />
            ))}

        {!isLoading && listings?.length === 0 && (
          <View className="items-center py-12">
            <Text variant="h3" className="mb-2 text-center">
              No deals found
            </Text>
            <Text variant="body" className="text-center text-muted">
              Try a different search or category
            </Text>
          </View>
        )}
      </View>
    </Screen>
  );
}
