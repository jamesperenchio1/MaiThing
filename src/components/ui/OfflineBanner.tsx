import { View } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { Text } from './Text';
import { PressableScale } from './PressableScale';
import { useNetworkState } from '@/src/hooks/useNetworkState';
import { useThemeColor } from '@/src/hooks/useThemeColor';

export function OfflineBanner() {
  const { isOffline, checkNetwork } = useNetworkState();
  const { t } = useTranslation();
  const colors = useThemeColor();

  if (!isOffline) {
    return null;
  }

  const handleRetry = () => {
    if (typeof Haptics !== 'undefined' && Haptics.impactAsync) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    checkNetwork();
  };

  return (
    <View
      testID="offline-banner"
      className="flex-row items-center bg-primary px-4 py-2.5"
      accessibilityRole="alert"
      accessibilityLabel={t('common.offlineBanner')}
    >
      <WifiOff size={16} color={colors.white} />
      <Text className="ml-2 flex-1 text-white">{t('common.offlineBanner')}</Text>
      <PressableScale onPress={handleRetry} scale={0.95} className="ml-2 px-2 py-1">
        <Text className="font-semibold text-white">{t('common.retry')}</Text>
      </PressableScale>
    </View>
  );
}
