import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { RotateCcw } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import type { PendingAction } from './types';

export function PendingActionBanner({
  pendingAction,
  countdown,
  onUndo,
}: {
  pendingAction: PendingAction;
  countdown: number;
  onUndo: () => void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColor();

  return (
    <View className="px-6 pt-4">
      <Card className="border-l-4 border-primary bg-primary/5 p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center">
            <RotateCcw size={18} color={colors.primary} />
            <View className="ml-3 flex-1">
              <Text variant="body-sm" className="font-semibold" numberOfLines={1}>
                {pendingAction.type === 'delete'
                  ? t('merchant.inventory.willBeDeleted', { title: pendingAction.title })
                  : t('merchant.inventory.willBeMarked', {
                      title: pendingAction.title,
                      status: (pendingAction.nextStatus === 'sold_out'
                        ? t('merchant.inventory.soldOut')
                        : t('merchant.inventory.active')
                      ).toLowerCase(),
                    })}
              </Text>
              <Text variant="caption" className="text-muted">
                {t('merchant.inventory.undoIn', { count: countdown })}
              </Text>
            </View>
          </View>
          <Button size="sm" variant="outline" onPress={onUndo}>
            {t('merchant.inventory.undo')}
          </Button>
        </View>
      </Card>
    </View>
  );
}
