import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Switch, Alert, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Text } from '@/src/components/ui/Text';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Header } from '@/src/components/layout/Header';
import { Screen } from '@/src/components/layout/Screen';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { Card } from '@/src/components/ui/Card';
import { useAuthStore } from '@/src/stores/auth';
import { useMerchantByOwner, useUpdateBusinessHours } from '@/src/hooks/useMerchants';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import type { BusinessHours } from '@/src/types';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEFAULT_OPEN = '07:00';
const DEFAULT_CLOSE = '21:00';
const WEEKDAYS = [1, 2, 3, 4, 5];

function parseTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export default function StoreHoursScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();
  const { data: merchant, isLoading, isError, refetch } = useMerchantByOwner(user?.id ?? '');
  const update = useUpdateBusinessHours(merchant?.id ?? '');
  const [hours, setHours] = useState<BusinessHours[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1);

  useEffect(() => {
    if (merchant) {
      setHours(merchant.businessHours.map((h) => ({ ...h })));
    }
  }, [merchant]);

  const toggleDay = (day: number) => {
    setHours((prev) =>
      prev.map((h) =>
        h.day === day
          ? { ...h, open: h.open ? '' : DEFAULT_OPEN, close: h.close ? '' : DEFAULT_CLOSE }
          : h
      )
    );
    setSelectedDay(day);
  };

  const updateTime = (day: number, field: 'open' | 'close', value: string) => {
    const cleaned = value.replace(/[^0-9:]/g, '').slice(0, 5);
    setHours((prev) => prev.map((h) => (h.day === day ? { ...h, [field]: cleaned } : h)));
    setSelectedDay(day);
  };

  const getDayHours = (day: number) => hours.find((h) => h.day === day);

  const applyToAllDays = () => {
    const source = getDayHours(selectedDay);
    if (!source) return;
    setHours((prev) =>
      prev.map((h) =>
        h.day === selectedDay ? h : { ...h, open: source.open, close: source.close }
      )
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const copyMondayToWeekdays = () => {
    const monday = getDayHours(1);
    if (!monday) return;
    setHours((prev) =>
      prev.map((h) =>
        h.day === 1 || !WEEKDAYS.includes(h.day)
          ? h
          : { ...h, open: monday.open, close: monday.close }
      )
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const resetToDefault = () => {
    setHours(
      DAY_LABELS.map((_, day) => ({
        day,
        open: DEFAULT_OPEN,
        close: DEFAULT_CLOSE,
      }))
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const validate = () => {
    for (const h of hours) {
      if (!h.open || !h.close) continue;
      if (parseTime(h.open) >= parseTime(h.close)) {
        Alert.alert('Invalid hours', `${DAY_LABELS[h.day]} close time must be after open time.`);
        return false;
      }
    }
    return true;
  };

  const onSave = async () => {
    if (!merchant || !validate()) return;
    try {
      await update.mutateAsync(hours);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Store hours have been updated.');
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save store hours. Please try again.');
    }
  };

  const confirmAction = (title: string, message: string, action: () => void) => {
    Alert.alert(title, message, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), onPress: action },
    ]);
  };

  if (isError) {
    return (
      <Screen scrollable className="bg-background">
        <Header title={t('merchant.businessProfile.storeHours')} />
        <View className="px-6 py-4">
          <ErrorState
            title={t('common.error')}
            message="We couldn't load your store hours."
            onRetry={refetch}
            retryLabel={t('common.retry')}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen testID="store-hours-screen" scrollable className="bg-background">
      <Header title={t('merchant.businessProfile.storeHours')} />
      <View className="px-6 py-4 pb-12">
        <Text variant="body" className="mb-2 text-muted">
          Set open and close times for each day. Toggle a day off when your shop is closed. Tap a
          day to select it for bulk actions.
        </Text>

        <View className="mb-4">
          <Text variant="label" className="mb-2">
            {t('merchant.storeHours.helperHint')}
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            <Button
              testID="apply-all-days-button"
              size="sm"
              variant="outline"
              onPress={() =>
                confirmAction(
                  t('merchant.storeHours.applyToAll'),
                  t('merchant.storeHours.applyToAllConfirm'),
                  applyToAllDays
                )
              }
            >
              {t('merchant.storeHours.applyToAll')}
            </Button>
            <Button
              testID="copy-monday-weekdays-button"
              size="sm"
              variant="outline"
              onPress={() =>
                confirmAction(
                  t('merchant.storeHours.copyMondayToWeekdays'),
                  t('merchant.storeHours.copyMondayConfirm'),
                  copyMondayToWeekdays
                )
              }
            >
              {t('merchant.storeHours.copyMondayToWeekdays')}
            </Button>
            <Button
              testID="reset-default-hours-button"
              size="sm"
              variant="outline"
              onPress={() =>
                confirmAction(
                  t('merchant.storeHours.resetToDefault'),
                  t('merchant.storeHours.resetConfirm'),
                  resetToDefault
                )
              }
            >
              {t('merchant.storeHours.resetToDefault')}
            </Button>
          </View>
        </View>

        {hours.map((h) => {
          const isOpen = !!h.open && !!h.close;
          const isSelected = selectedDay === h.day;
          return (
            <Pressable
              key={h.day}
              testID={`store-hours-day-${h.day}-card`}
              onPress={() => setSelectedDay(h.day)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Card
                variant="outlined"
                className={`mb-3 ${isSelected ? 'border-primary bg-primary/5' : ''}`}
              >
                <View className="flex-row items-center justify-between">
                  <Text variant="body" className="font-semibold">
                    {DAY_LABELS[h.day]}
                  </Text>
                  <Switch
                    testID={`store-hours-day-${h.day}-switch`}
                    value={isOpen}
                    onValueChange={() => toggleDay(h.day)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                {isOpen && (
                  <View className="mt-3 flex-row space-x-3">
                    <Input
                      containerClassName="flex-1"
                      testID={`store-hours-day-${h.day}-open`}
                      label="Open"
                      placeholder={DEFAULT_OPEN}
                      value={h.open}
                      onChangeText={(text) => updateTime(h.day, 'open', text)}
                      maxLength={5}
                    />
                    <Input
                      containerClassName="flex-1"
                      testID={`store-hours-day-${h.day}-close`}
                      label="Close"
                      placeholder={DEFAULT_CLOSE}
                      value={h.close}
                      onChangeText={(text) => updateTime(h.day, 'close', text)}
                      maxLength={5}
                    />
                  </View>
                )}
              </Card>
            </Pressable>
          );
        })}

        <Button
          testID="save-store-hours-button"
          fullWidth
          loading={update.isPending || isLoading}
          onPress={onSave}
          className="mt-4"
        >
          {t('common.save')}
        </Button>
      </View>
    </Screen>
  );
}
