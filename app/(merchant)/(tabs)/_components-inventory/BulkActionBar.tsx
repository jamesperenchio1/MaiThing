import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Pause, Trash2, Tag, X } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useThemeColor } from '@/src/hooks/useThemeColor';

export function BulkActionBar({
  selectedCount,
  onPause,
  onDelete,
  onAdjustPrice,
  onCancel,
}: {
  selectedCount: number;
  onPause: () => void;
  onDelete: () => void;
  onAdjustPrice: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColor();

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-card border-t border-border px-4 pt-3 pb-8">
      <View className="mb-3 items-center">
        <Text variant="body-sm" className="font-semibold text-foreground">
          {t('merchant.inventory.selectedCount', { count: selectedCount })}
        </Text>
      </View>
      <View className="flex-row items-center justify-around">
        <PressableScale onPress={onPause} scale={0.95} className="items-center px-2">
          <Pause size={22} color={colors.muted} />
          <Text variant="caption" className="mt-1 text-muted">
            {t('merchant.inventory.pause')}
          </Text>
        </PressableScale>
        <PressableScale onPress={onDelete} scale={0.95} className="items-center px-2">
          <Trash2 size={22} color={colors.danger} />
          <Text variant="caption" className="mt-1 text-danger">
            {t('common.delete')}
          </Text>
        </PressableScale>
        <PressableScale onPress={onAdjustPrice} scale={0.95} className="items-center px-2">
          <Tag size={22} color={colors.primary} />
          <Text variant="caption" className="mt-1 text-primary">
            {t('merchant.inventory.adjustPrice')}
          </Text>
        </PressableScale>
        <PressableScale onPress={onCancel} scale={0.95} className="items-center px-2">
          <X size={22} color={colors.muted} />
          <Text variant="caption" className="mt-1 text-muted">
            {t('common.cancel')}
          </Text>
        </PressableScale>
      </View>
    </View>
  );
}
