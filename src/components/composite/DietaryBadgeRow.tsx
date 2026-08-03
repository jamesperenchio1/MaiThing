import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/src/components/ui/Badge';
import { DIETARY_TAGS } from '@/src/lib/constants';

interface DietaryBadgeRowProps {
  tags: string[];
  max?: number;
}

export function DietaryBadgeRow({ tags, max = 2 }: DietaryBadgeRowProps) {
  const { i18n } = useTranslation();
  if (!tags.length) return null;
  const visible = tags.slice(0, max);
  const remaining = tags.length - visible.length;
  const isThai = i18n.language === 'th';

  return (
    <View className="mt-1.5 flex-row flex-wrap">
      {visible.map((tag) => {
        const match = DIETARY_TAGS.find((t) => t.id === tag);
        const label = match ? (isThai ? match.nameTh : match.name) : tag;
        return (
          <Badge key={tag} variant="success" className="mr-1.5 mb-1">
            {label}
          </Badge>
        );
      })}
      {remaining > 0 && (
        <Badge variant="muted" className="mb-1">
          +{remaining}
        </Badge>
      )}
    </View>
  );
}
