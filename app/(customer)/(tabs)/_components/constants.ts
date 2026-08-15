import type { ListingFilters } from '@/src/hooks/useListings';

export type SortOption = NonNullable<ListingFilters['sortBy']>;

export const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'distance', label: 'Nearest' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
  { id: 'discount', label: 'Biggest Discount' },
  { id: 'newest', label: 'Newest' },
  { id: 'top_rated', label: 'Top Rated' },
  { id: 'going_fast', label: 'Going Fast' },
];

export const QUICK_SORT: { id: SortOption; label: string }[] = [
  { id: 'distance', label: 'Nearest' },
  { id: 'top_rated', label: 'Top Rated' },
  { id: 'going_fast', label: 'Going Fast' },
  { id: 'newest', label: 'New' },
];

export const RATING_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Any' },
  { value: 3, label: '3+' },
  { value: 4, label: '4+' },
  { value: 4.5, label: '4.5+' },
];

export const PRICE_MIN = 0;
export const PRICE_MAX = 500;
export const PRICE_STEP = 10;
