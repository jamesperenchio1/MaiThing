import { View } from 'react-native';
import { AlertTriangle, RotateCcw } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { useThemeColor } from '@/src/hooks/useThemeColor';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Retry',
}: ErrorStateProps) {
  const colors = useThemeColor();

  return (
    <View className="items-center px-6 py-12">
      <View className="mb-4 rounded-full bg-danger/10 p-4">
        <AlertTriangle size={32} color={colors.danger} />
      </View>
      <Text variant="h3" className="mb-2 text-center">
        {title}
      </Text>
      {message && (
        <Text variant="body" className="mb-6 text-center text-muted">
          {message}
        </Text>
      )}
      {onRetry && (
        <Button
          variant="outline"
          onPress={onRetry}
          leftIcon={<RotateCcw size={16} color={colors.foreground} />}
        >
          {retryLabel}
        </Button>
      )}
    </View>
  );
}
