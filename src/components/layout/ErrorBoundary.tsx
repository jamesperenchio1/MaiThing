import React from 'react';
import { View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

import { Button } from '@/src/components/ui/Button';
import { Text } from '@/src/components/ui/Text';
import { useThemeColor } from '@/src/hooks/useThemeColor';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // In production this would go to Sentry / crash reporting; only log locally in dev.
    if (__DEV__) {
      console.error('[ErrorBoundary]', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ error, onRetry }: { error?: Error; onRetry: () => void }) {
  const colors = useThemeColor();
  return (
    <View className="flex-1 items-center justify-center bg-background px-8">
      <View className="mb-6 rounded-full bg-danger/10 p-4">
        <AlertTriangle size={40} color={colors.danger} />
      </View>
      <Text variant="h2" className="mb-2 text-center">
        Something went wrong
      </Text>
      <Text className="mb-8 text-center text-muted">
        The app hit an unexpected error. You can try again or restart the app.
      </Text>
      {__DEV__ && error?.message && (
        <View className="mb-6 w-full rounded-2xl bg-muted/10 p-4">
          <Text variant="caption" className="text-danger">
            {error.message}
          </Text>
        </View>
      )}
      <Button onPress={onRetry} fullWidth>
        Try again
      </Button>
    </View>
  );
}
