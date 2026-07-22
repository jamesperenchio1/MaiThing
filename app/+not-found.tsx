import { Link, Stack } from 'expo-router';
import { View } from 'react-native';
import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text variant="h1" className="mb-4">
          404
        </Text>
        <Text variant="body" className="mb-8 text-center text-muted">
          This screen doesn't exist.
        </Text>
        <Link href="/" asChild>
          <Button>Go Home</Button>
        </Link>
      </View>
    </>
  );
}
