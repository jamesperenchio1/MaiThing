import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/auth';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { session, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <Redirect href="/(buyer)/discover" />;
}
