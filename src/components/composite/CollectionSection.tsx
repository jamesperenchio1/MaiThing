import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
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
        className="px-4"
        contentContainerStyle={{ alignItems: 'flex-start' }}
      >
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} width={260} height={280} className="mr-3 rounded-3xl" />
            ))
          : listings.slice(0, 6).map((listing) => (
              <View key={listing.id} className="mr-3 w-64" style={{ minHeight: 280 }}>
                <ListingCard listing={listing} variant="vertical" />
              </View>
            ))}
      </ScrollView>
    </View>
  );
}
