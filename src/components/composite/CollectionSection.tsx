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
  variant?: 'default' | 'featured' | 'compact';
}

export function CollectionSection({
  title,
  listings,
  isLoading,
  onSeeAll,
  variant = 'default',
}: CollectionSectionProps) {
  const { t } = useTranslation();
  const visibleListings = listings.slice(0, variant === 'compact' ? 4 : 6);
  return (
    <View
      className={cn(
        variant === 'compact' ? 'mb-4' : 'mb-6',
        variant === 'featured' && 'bg-primary/5 rounded-3xl py-4'
      )}
    >
      <SectionHeader
        title={title}
        action={onSeeAll ? t('common.seeAll') : undefined}
        onPress={onSeeAll}
        size={variant === 'compact' ? 'compact' : 'default'}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ alignItems: 'stretch' }}
      >
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} width={260} height={280} className="mr-3 rounded-3xl" />
            ))
          : visibleListings.map((listing, index) => (
              <View
                key={listing.id}
                className={cn('w-64 flex-1', index !== visibleListings.length - 1 && 'mr-3')}
              >
                <ListingCard listing={listing} variant="vertical" />
              </View>
            ))}
      </ScrollView>
    </View>
  );
}
