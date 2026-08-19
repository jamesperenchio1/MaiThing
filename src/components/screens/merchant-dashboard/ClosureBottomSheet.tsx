import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Minus, Plus, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useThemeColor } from '@/src/hooks/useThemeColor';

import type { ClosureOption } from './types';

export function ClosureBottomSheet({
  isOpen,
  onClose,
  selectedOption,
  onSelectOption,
  customDays,
  customDate,
  onDecrementDays,
  onIncrementDays,
  onConfirm,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedOption: ClosureOption | null;
  onSelectOption: (option: ClosureOption) => void;
  customDays: number;
  customDate: Date;
  onDecrementDays: () => void;
  onIncrementDays: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const colors = useThemeColor();
  const { t, i18n } = useTranslation();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      {/* Sheet header */}
      <View className="mb-6 flex-row items-center justify-between">
        <Text variant="h3">{t('merchant.dashboard.closeStoreTitle')}</Text>
        <PressableScale onPress={onClose} scale={0.9}>
          <View className="h-8 w-8 items-center justify-center rounded-full bg-muted/10">
            <X size={18} color={colors.muted} />
          </View>
        </PressableScale>
      </View>

      {/* Option: Tonight */}
      <PressableScale
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSelectOption('tonight');
        }}
        scale={0.98}
        className="mb-3"
      >
        <View
          className={`rounded-2xl border p-4 ${
            selectedOption === 'tonight' ? 'border-primary bg-primary/5' : 'border-border bg-card'
          }`}
        >
          <Text variant="body-sm" className="font-semibold">
            {t('merchant.dashboard.tonightOption')}
          </Text>
          <Text variant="caption" className="mt-0.5 text-muted">
            {t('merchant.dashboard.untilTonight')}
          </Text>
        </View>
      </PressableScale>

      {/* Option: Tomorrow */}
      <PressableScale
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSelectOption('tomorrow');
        }}
        scale={0.98}
        className="mb-3"
      >
        <View
          className={`rounded-2xl border p-4 ${
            selectedOption === 'tomorrow' ? 'border-primary bg-primary/5' : 'border-border bg-card'
          }`}
        >
          <Text variant="body-sm" className="font-semibold">
            {t('merchant.dashboard.tomorrowOption')}
          </Text>
          <Text variant="caption" className="mt-0.5 text-muted">
            {t('merchant.dashboard.untilTomorrow')}
          </Text>
        </View>
      </PressableScale>

      {/* Option: Custom date */}
      <PressableScale
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSelectOption('custom');
        }}
        scale={0.98}
        className={selectedOption === 'custom' ? 'mb-0' : 'mb-6'}
      >
        <View
          className={`border p-4 ${
            selectedOption === 'custom'
              ? 'rounded-t-2xl border-b-0 border-primary bg-primary/5'
              : 'rounded-2xl border-border bg-card'
          }`}
        >
          <Text variant="body-sm" className="font-semibold">
            {t('merchant.dashboard.customDateOption')}
          </Text>
          {selectedOption !== 'custom' && (
            <Text variant="caption" className="mt-0.5 text-muted">
              {t('merchant.dashboard.pickDaysToClose')}
            </Text>
          )}
        </View>
      </PressableScale>

      {/* Custom day counter (shown below when custom selected) */}
      {selectedOption === 'custom' && (
        <View className="mb-6 rounded-b-2xl border border-t-0 border-primary bg-primary/5 px-4 pb-4 pt-3">
          <View className="flex-row items-center justify-between">
            <PressableScale
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onDecrementDays();
              }}
              scale={0.9}
            >
              <View className="h-9 w-9 items-center justify-center rounded-full bg-background">
                <Minus size={16} color={colors.primary} />
              </View>
            </PressableScale>
            <View className="items-center">
              <Text variant="body-sm" className="font-semibold">
                {customDate.toLocaleDateString(i18n.language, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <Text variant="caption" className="text-muted">
                {t('merchant.dashboard.daysFromNow', { count: customDays })}
              </Text>
            </View>
            <PressableScale
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onIncrementDays();
              }}
              scale={0.9}
            >
              <View className="h-9 w-9 items-center justify-center rounded-full bg-background">
                <Plus size={16} color={colors.primary} />
              </View>
            </PressableScale>
          </View>
        </View>
      )}

      {/* Actions */}
      <Button
        variant="primary"
        onPress={onConfirm}
        disabled={!selectedOption || isPending}
        className="mb-2"
      >
        {t('merchant.dashboard.closeStoreButton')}
      </Button>
      <Button variant="ghost" onPress={onClose}>
        {t('common.cancel')}
      </Button>
    </BottomSheet>
  );
}
