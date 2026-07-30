import { View } from 'react-native';
import { Badge } from '@/src/components/ui/Badge';
import type { ListingUrgency } from '@/src/lib/utils';

interface UrgencyBadgeProps {
  urgency: ListingUrgency | null;
}

export function UrgencyBadge({ urgency }: UrgencyBadgeProps) {
  if (!urgency) return null;
  return (
    <View className="self-start">
      <Badge variant={urgency.color}>{urgency.label}</Badge>
    </View>
  );
}
