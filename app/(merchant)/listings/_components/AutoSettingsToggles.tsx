import { View, Platform, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Zap } from 'lucide-react-native';
import { Text } from '@/src/components/ui/Text';
import { Input } from '@/src/components/ui/Input';
import { useThemeColor } from '@/src/hooks/useThemeColor';

export function AutoSettingsToggles({
  autoExpiry,
  setAutoExpiry,
  autoDelistWhenSoldOut,
  setAutoDelistWhenSoldOut,
  flashSaleEnabled,
  setFlashSaleEnabled,
  flashSalePrice,
  setFlashSalePrice,
  flashSaleHours,
  setFlashSaleHours,
}: {
  autoExpiry: boolean;
  setAutoExpiry: (value: boolean) => void;
  autoDelistWhenSoldOut: boolean;
  setAutoDelistWhenSoldOut: (value: boolean) => void;
  flashSaleEnabled: boolean;
  setFlashSaleEnabled: (value: boolean) => void;
  flashSalePrice: string;
  setFlashSalePrice: (value: string) => void;
  flashSaleHours: string;
  setFlashSaleHours: (value: string) => void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColor();

  return (
    <>
      <View className="mb-6 flex-row items-center justify-between rounded-2xl border border-border bg-card p-4">
        <View className="flex-1 pr-4">
          <Text variant="body-sm" className="font-semibold">
            {t('merchant.createListing.autoExpiry')}
          </Text>
          <Text variant="caption" className="text-muted">
            {t('merchant.createListing.autoExpiryHint')}
          </Text>
        </View>
        <Switch
          value={autoExpiry}
          onValueChange={setAutoExpiry}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={Platform.OS === 'ios' ? undefined : colors.white}
        />
      </View>

      <View className="mb-6 flex-row items-center justify-between rounded-2xl border border-border bg-card p-4">
        <View className="flex-1 pr-4">
          <Text variant="body-sm" className="font-semibold">
            {t('merchant.createListing.autoDelist')}
          </Text>
          <Text variant="caption" className="text-muted">
            {t('merchant.createListing.autoDelistHint')}
          </Text>
        </View>
        <Switch
          value={autoDelistWhenSoldOut}
          onValueChange={setAutoDelistWhenSoldOut}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={Platform.OS === 'ios' ? undefined : colors.white}
        />
      </View>

      <View className="mb-6 rounded-2xl border border-border bg-card p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <View className="flex-row items-center">
              <Zap size={16} color={colors.primary} fill={colors.primary} />
              <Text variant="body-sm" className="ml-2 font-semibold">
                {t('merchant.createListing.flashSale')}
              </Text>
            </View>
            <Text variant="caption" className="text-muted">
              {t('merchant.createListing.flashSaleHint')}
            </Text>
          </View>
          <Switch
            value={flashSaleEnabled}
            onValueChange={setFlashSaleEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={Platform.OS === 'ios' ? undefined : colors.white}
          />
        </View>
        {flashSaleEnabled && (
          <View className="flex-row space-x-3">
            <Input
              containerClassName="flex-1"
              label={t('merchant.createListing.flashPriceLabel')}
              placeholder="59"
              keyboardType="number-pad"
              value={flashSalePrice}
              onChangeText={setFlashSalePrice}
              maxLength={6}
            />
            <Input
              containerClassName="flex-1"
              label={t('merchant.createListing.durationHoursLabel')}
              placeholder="2"
              keyboardType="number-pad"
              value={flashSaleHours}
              onChangeText={setFlashSaleHours}
              maxLength={2}
            />
          </View>
        )}
      </View>
    </>
  );
}
