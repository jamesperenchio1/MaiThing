import { View } from 'react-native';
import { Text } from '@/src/components/ui/Text';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <View className="items-center px-6 py-12">
      <View className="mb-4 rounded-full bg-muted/10 p-4">{icon}</View>
      <Text variant="h3" className="mb-2 text-center">
        {title}
      </Text>
      {description && (
        <Text variant="body" className="text-center text-muted">
          {description}
        </Text>
      )}
    </View>
  );
}
