import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { cn } from '@/src/lib/utils';
import { ListingCard } from '@/src/components/composite/ListingCard';
import { SectionHeader } from '@/src/components/composite/SectionHeader';
import { Skeleton } from '@/src/components/ui/Skeleton';
import type { Listing } from '@/src/types';

interface CollectionSectionProps {
  title: string;
  listings: Listing[];
  isLoading?: boolean;
  onSeeAll?: () => void;
}

export function CollectionSection({
  title,
  listings,
  isLoading,
  onSeeAll,
}: CollectionSectionProps) {
  const { t } = useTranslation();
  const visibleListings = listings.slice(0, 6);
  return (
    <View className="mb-6">
      <SectionHeader
        title={title}
        action={onSeeAll ? t('common.seeAll') : undefined}
        onPress={onSeeAll}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ alignItems: 'flex-start' }}
      >
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} width={260} height={280} className="mr-3 rounded-3xl" />
            ))
          : visibleListings.map((listing, index) => (
              <View
                key={listing.id}
                className={cn('w-64', index !== visibleListings.length - 1 && 'mr-3')}
              >
                <ListingCard listing={listing} variant="vertical" />
              </View>
            ))}
      </ScrollView>
    </View>
  );
}
