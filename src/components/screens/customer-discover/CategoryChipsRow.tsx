import { ScrollView } from 'react-native';

import { CategoryChip } from '@/src/components/composite/CategoryChip';
import type { Category } from '@/src/types';

interface CategoryChipsRowProps {
  categories: Category[] | undefined;
  selectedCategory: string | null;
  onSelect: (id: string) => void;
  locale: 'en' | 'th';
}

export function CategoryChipsRow({
  categories,
  selectedCategory,
  onSelect,
  locale,
}: CategoryChipsRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-2"
      contentContainerStyle={{ paddingHorizontal: 16, paddingRight: 24 }}
    >
      {categories?.map((category) => (
        <CategoryChip
          key={category.id}
          category={category}
          isActive={selectedCategory === category.id}
          onPress={() => onSelect(category.id)}
          locale={locale}
        />
      ))}
    </ScrollView>
  );
}
