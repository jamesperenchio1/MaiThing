import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react-native';
import { Text } from '@/src/components/ui/Text';
import { useThemeColor } from '@/src/hooks/useThemeColor';

export function PriceBumpWarning({ visible }: { visible: boolean }) {
  const { t } = useTranslation();
  const colors = useThemeColor();

  if (!visible) return null;

  return (
    <View className="mb-4 flex-row rounded-2xl border border-warning bg-warning/10 p-4">
      <AlertTriangle size={18} color={colors.warning} style={{ marginTop: 1 }} />
      <View className="ml-3 flex-1">
        <Text variant="body-sm" className="font-semibold text-warning">
          {t('merchant.createListing.priceBumpFlaggedTitle')}
        </Text>
        <Text variant="caption" className="mt-0.5 text-warning">
          {t('merchant.createListing.priceBumpFlaggedBody')}
        </Text>
      </View>
    </View>
  );
}
