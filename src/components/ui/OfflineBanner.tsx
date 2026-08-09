import { View, Pressable } from 'react-native';
import { WifiOff } from 'lucide-react-native';

import { Text } from './Text';
import { useNetworkState } from '@/src/hooks/useNetworkState';

export function OfflineBanner() {
  const { isOffline, checkNetwork } = useNetworkState();

  if (!isOffline) {
    return null;
  }

  return (
    <View className="flex-row items-center bg-[#16A34A] px-4 py-2.5">
      <WifiOff size={16} color="#FFFFFF" />
      <Text className="ml-2 flex-1 text-white">
        You are offline. Some features may be limited.
      </Text>
      <Pressable onPress={checkNetwork} className="ml-2 px-2 py-1">
        <Text className="font-semibold text-white">Retry</Text>
      </Pressable>
    </View>
  );
}
