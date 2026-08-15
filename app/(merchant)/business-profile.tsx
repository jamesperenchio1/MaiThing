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
import { useMerchantByOwner, useUpdateMerchant } from '@/src/hooks/useMerchants';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  phone: z.string().min(1, 'Phone is required'),
  pickupInstructions: z.string().min(1, 'Pickup instructions are required'),
});

type FormData = z.infer<typeof schema>;

export default function BusinessProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { data: merchant, isLoading, isError, refetch } = useMerchantByOwner(user?.id ?? '');
  const update = useUpdateMerchant(merchant?.id ?? '');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      phone: '',
      pickupInstructions: '',
    },
  });

  useEffect(() => {
    if (merchant) {
      reset({
        name: merchant.name,
        description: merchant.description,
        phone: merchant.phone,
        pickupInstructions: merchant.pickupInstructions ?? '',
      });
    }
  }, [merchant, reset]);

  const onSubmit = async (data: FormData) => {
    if (!merchant) return;
    try {
      await update.mutateAsync(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Your business profile has been updated.');
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save changes. Please try again.');
    }
  };

  if (isError) {
    return (
      <Screen scrollable className="bg-background">
        <Header title={t('merchant.businessProfile.title')} />
        <View className="px-6 py-4">
          <ErrorState
            title={t('common.error')}
            message="We couldn't load your business profile."
            onRetry={refetch}
            retryLabel={t('common.retry')}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen testID="business-profile-screen" scrollable keyboardAvoiding className="bg-background">
      <Header title={t('merchant.businessProfile.title')} />
      <View className="px-6 py-4 pb-12">
        <Text variant="body" className="mb-6 text-muted">
          Update your shop name, description, contact number, and pickup instructions.
        </Text>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Input
              testID="business-name-input"
              label="Business Name"
              placeholder={t('merchant.businessProfile.namePlaceholder')}
              value={value}
              onChangeText={onChange}
              error={error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Input
              testID="business-description-input"
              label="Description"
              placeholder={t('merchant.businessProfile.descriptionPlaceholder')}
              value={value}
              onChangeText={onChange}
              multiline
              numberOfLines={3}
              inputClassName="min-h-[80px] py-3"
              error={error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Input
              testID="business-phone-input"
              label="Phone"
              placeholder="02-123-4567"
              value={value}
              onChangeText={onChange}
              keyboardType="phone-pad"
              error={error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="pickupInstructions"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Input
              testID="business-pickup-instructions-input"
              label="Pickup Instructions"
              placeholder={t('merchant.businessProfile.pickupInstructionsPlaceholder')}
              value={value}
              onChangeText={onChange}
              multiline
              numberOfLines={3}
              inputClassName="min-h-[80px] py-3"
              error={error?.message}
            />
          )}
        />

        <Button
          testID="save-business-profile-button"
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
