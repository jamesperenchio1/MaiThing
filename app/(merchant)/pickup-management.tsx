import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as Haptics from 'expo-haptics';

import { Text } from '@/src/components/ui/Text';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Header } from '@/src/components/layout/Header';
import { Screen } from '@/src/components/layout/Screen';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { useAuthStore } from '@/src/stores/auth';
import { useMerchantByOwner, useUpdatePickupInstructions } from '@/src/hooks/useMerchants';

const schema = z.object({
  pickupInstructions: z.string().min(5, 'Pickup instructions must be at least 5 characters'),
});

type FormData = z.infer<typeof schema>;

export default function PickupManagementScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { data: merchant, isLoading, isError, refetch } = useMerchantByOwner(user?.id ?? '');
  const update = useUpdatePickupInstructions(merchant?.id ?? '');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { pickupInstructions: '' },
  });

  useEffect(() => {
    if (merchant) {
      reset({ pickupInstructions: merchant.pickupInstructions ?? '' });
    }
  }, [merchant, reset]);

  const onSubmit = async (data: FormData) => {
    if (!merchant) return;
    try {
      await update.mutateAsync(data.pickupInstructions);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Pickup instructions have been updated.');
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save pickup instructions. Please try again.');
    }
  };

  if (isError) {
    return (
      <Screen scrollable className="bg-background">
        <Header title={t('merchant.businessProfile.pickupManagement')} />
        <View className="px-6 py-4">
          <ErrorState
            title={t('common.error')}
            message="We couldn't load your pickup settings."
            onRetry={refetch}
            retryLabel={t('common.retry')}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen testID="pickup-management-screen" scrollable keyboardAvoiding className="bg-background">
      <Header title={t('merchant.businessProfile.pickupManagement')} />
      <View className="px-6 py-4 pb-12">
        <Text variant="body" className="mb-6 text-muted">
          Let customers know exactly where and how to collect their orders.
        </Text>

        <Controller
          control={control}
          name="pickupInstructions"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Input
              testID="pickup-instructions-input"
              label="Pickup Instructions"
              placeholder="Pick up at the counter. Show your pickup code when you arrive."
              value={value}
              onChangeText={onChange}
              multiline
              numberOfLines={5}
              inputClassName="min-h-[120px] py-3"
              error={error?.message}
            />
          )}
        />

        <Button
          testID="save-pickup-management-button"
          fullWidth
          loading={update.isPending || isLoading}
          disabled={!isDirty}
          onPress={handleSubmit(onSubmit)}
        >
          {t('common.save')}
        </Button>
      </View>
    </Screen>
  );
}
