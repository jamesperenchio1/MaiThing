import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { useThemeColor } from '@/src/hooks/useThemeColor';

export function OfflineBanner() {
  const { t } = useTranslation();
  const colors = useThemeColor();

  return (
    <View className="mb-4 flex-row items-center rounded-2xl bg-amber-500/10 px-4 py-3">
      <AlertTriangle size={18} color={colors.warning} />
      <Text variant="body-sm" className="ml-2 flex-1 text-amber-700 dark:text-amber-300">
        {t('common.noConnection')}
      </Text>
    </View>
  );
}
