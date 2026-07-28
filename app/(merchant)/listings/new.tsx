import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, Image, TextInput } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, Plus, X, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Screen } from '@/src/components/layout/Screen';
import { Header } from '@/src/components/layout/Header';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { DateTimePickerField } from '@/src/components/ui/DateTimePickerField';
import { createListingSchema, type CreateListingForm } from '@/src/features/listings/schemas';
import { useCategories } from '@/src/hooks/useMerchants';
import { mockRepositories } from '@/src/repositories/mock';
import { scheduleLocalNotification } from '@/src/services/notifications';
import { CATEGORIES, DIETARY_TAGS, ALLERGENS, BOX_SIZES } from '@/src/lib/constants';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { cn, formatCurrency } from '@/src/lib/utils';
import type { Listing } from '@/src/types';

function ToggleChip({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <PressableScale testID={testID} onPress={onPress} scale={0.95}>
      <View
        className={`mr-2 mb-2 rounded-full px-4 py-2 ${
          selected ? 'bg-primary' : 'bg-muted/10 border border-border'
        }`}
      >
        <Text variant="body-sm" className={selected ? 'text-white' : 'text-foreground'}>
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}

export default function CreateListingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: categories } = useCategories();
  const colors = useThemeColor();
  const queryClient = useQueryClient();
  const [images, setImages] = useState<string[]>([]);
  const [isOriginalPriceFocused, setIsOriginalPriceFocused] = useState(false);
  const [isSalePriceFocused, setIsSalePriceFocused] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  const [customAllergenInput, setCustomAllergenInput] = useState('');

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateListingForm>({
    resolver: zodResolver(createListingSchema),
    mode: 'onChange',
    defaultValues: {
      type: 'mystery_box',
      title: '',
      description: '',
      category: 'bakery',
      boxSize: 'medium',
      originalPrice: 300,
      salePrice: 99,
      quantity: 5,
      pickupWindowStart: new Date(new Date().setHours(18, 0, 0, 0)),
      pickupWindowEnd: new Date(new Date().setHours(20, 0, 0, 0)),
      dietaryTags: [],
      allergens: [],
    },
  });

  const type = watch('type');
  const dietaryTags = watch('dietaryTags') ?? [];
  const allergens = watch('allergens') ?? [];

  const createListing = useMutation({
    mutationFn: async (data: CreateListingForm) => {
      const listing = {
        merchantId: 'merchant-1',
        type: data.type,
        title: data.title,
        description: data.description,
        images: images.length
          ? images
          : [
              `https://placehold.co/600x400/F97316/FFFFFF/png?text=${encodeURIComponent(data.title)}`,
            ],
        category: data.category,
        originalPrice: data.originalPrice,
        salePrice: data.salePrice,
        quantity: data.quantity,
        quantityRemaining: data.quantity,
        pickupWindowStart: data.pickupWindowStart.toISOString(),
        pickupWindowEnd: data.pickupWindowEnd.toISOString(),
        dietaryTags: data.dietaryTags,
        allergens: data.allergens,
        status: 'active' as const,
        ...(data.type === 'mystery_box'
          ? { boxSize: data.boxSize ?? 'medium', estimatedRetailValue: data.originalPrice }
          : {}),
      } as Omit<Listing, 'id' | 'createdAt'>;
      return mockRepositories.listings.createListing(listing);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      scheduleLocalNotification(
        'Listing published',
        `"${data.title}" is now live and visible to customers.`,
        { listingId: data.id, type: 'listing_published' },
        undefined,
        'new_deal',
        `/(merchant)/(tabs)/inventory`
      ).catch(() => {});
      router.replace('/(merchant)/(tabs)/inventory' as any);
    },
  });

  const addImage = () => {
    setImages((prev) => [
      ...prev,
      `https://placehold.co/600x400/F97316/FFFFFF/png?text=${encodeURIComponent('Photo ' + (prev.length + 1))}`,
    ]);
  };

  const toggleArray = (field: 'dietaryTags' | 'allergens', value: string) => {
    const current = watch(field) ?? [];
    if (current.includes(value)) {
      setValue(
        field,
        current.filter((v) => v !== value)
      );
    } else {
      setValue(field, [...current, value]);
    }
  };

  const addCustomTag = () => {
    const value = customTagInput.trim();
    if (!value) return;
    const current = dietaryTags;
    if (!current.includes(value)) {
      setValue('dietaryTags', [...current, value]);
    }
    setCustomTagInput('');
  };

  const addCustomAllergen = () => {
    const value = customAllergenInput.trim();
    if (!value) return;
    const current = allergens;
    if (!current.includes(value)) {
      setValue('allergens', [...current, value]);
    }
    setCustomAllergenInput('');
  };

  const onSubmit = (data: CreateListingForm) => {
    createListing.mutate(data);
  };

  return (
    <Screen testID="create-listing-screen" scrollable keyboardAvoiding>
      <Header testID="create-listing-header" title={t('merchant.createListing.title')} />
      <View className="px-6 py-4 pb-12">
        <Text variant="h2" className="mb-6">
          {t('merchant.createListing.chooseType')}
        </Text>

        <Controller
          control={control}
          name="type"
          render={({ field: { onChange, value } }) => (
            <View className="mb-6 flex-row gap-3">
              {(['mystery_box', 'fixed_item'] as const).map((t) => (
                <PressableScale
                  key={t}
                  testID={t === 'mystery_box' ? 'mystery-box-option' : 'fixed-item-option'}
                  onPress={() => onChange(t)}
                  scale={0.98}
                  className="flex-1"
                >
                  <Card
                    variant={value === t ? 'elevated' : 'outlined'}
                    className="items-center p-4"
                    style={
                      value === t ? { borderWidth: 2, borderColor: colors.primary } : undefined
                    }
                  >
                    <View className="mb-2 rounded-full bg-primary/10 p-3">
                      <Camera size={24} color={colors.primary} />
                    </View>
                    <Text variant="body-sm" className="font-semibold">
                      {t === 'mystery_box' ? 'Mystery Box' : 'Fixed Item'}
                    </Text>
                    <Text variant="caption" className="text-center text-muted">
                      {t === 'mystery_box'
                        ? 'A surprise bag of surplus food'
                        : 'A specific dish or product'}
                    </Text>
                  </Card>
                </PressableScale>
              ))}
            </View>
          )}
        />

        {type === 'mystery_box' && (
          <Controller
            control={control}
            name="boxSize"
            render={({ field: { onChange, value } }) => (
              <View className="mb-6">
                <Text variant="h3" className="mb-3">
                  Box Size
                </Text>
                <View className="flex-row flex-wrap">
                  {BOX_SIZES.map((size) => (
                    <ToggleChip
                      key={size.id}
                      testID={`box-size-${size.id}`}
                      label={size.name}
                      selected={value === size.id}
                      onPress={() => onChange(size.id)}
                    />
                  ))}
                </View>
              </View>
            )}
          />
        )}

        <View className="mb-6">
          <Text variant="h3" className="mb-3">
            {t('merchant.createListing.photos')}
          </Text>
          <View className="flex-row flex-wrap">
            {images.map((uri, index) => (
              <View key={index} className="relative mr-2 mb-2">
                <Image source={{ uri }} className="h-24 w-24 rounded-2xl" resizeMode="cover" />
                <PressableScale
                  onPress={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                  className="absolute -right-1 -top-1 rounded-full bg-danger p-1"
                  scale={0.9}
                >
                  <X size={12} color={colors.white} />
                </PressableScale>
              </View>
            ))}
            <PressableScale
              onPress={addImage}
              className="h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/10"
              scale={0.95}
            >
              <Plus size={24} color={colors.muted} />
            </PressableScale>
          </View>
        </View>

        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Input
              testID="listing-title-input"
              label="Title"
              placeholder="e.g., Surplus Bread Box"
              value={value}
              onChangeText={onChange}
              onEndEditing={(e) => onChange(e.nativeEvent.text)}
              error={error?.message}
              maxLength={60}
              showCharacterCount
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value }, fieldState: { error } }) => {
            const descriptionLength = value?.length ?? 0;
            const descriptionNearLimit = descriptionLength >= 150;
            const descriptionAtLimit = descriptionLength >= 300;
            return (
              <View className="mb-4">
                <Text testID="listing-description-label" variant="label" className="mb-2 ml-1">
                  Description
                </Text>
                <TextInput
                  testID="listing-description-input"
                  className="min-h-[100] rounded-2xl border border-border bg-card p-4 text-base text-foreground"
                  placeholder="Describe what's inside..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  value={value}
                  onChangeText={onChange}
                  onEndEditing={(e) => onChange(e.nativeEvent.text)}
                  maxLength={300}
                />
                <View className="mt-1.5 ml-1 flex-row justify-between">
                  {error ? (
                    <Text variant="caption" className="text-danger">
                      {error.message}
                    </Text>
                  ) : (
                    <View />
                  )}
                  <Text
                    variant="caption"
                    className={cn(
                      'text-right',
                      descriptionAtLimit ? 'text-danger' : descriptionNearLimit ? 'text-amber-500' : 'text-muted'
                    )}
                  >
                    {descriptionLength}/300
                  </Text>
                </View>
              </View>
            );
          }}
        />

        <Controller
          control={control}
          name="category"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View className="mb-6">
              <Text variant="h3" className="mb-3">
                {t('merchant.createListing.category')}
              </Text>
              <View className="flex-row flex-wrap">
                {categories?.map((category) => (
                  <ToggleChip
                    key={category.id}
                    testID={`category-${category.id}`}
                    label={category.name}
                    selected={value === category.id}
                    onPress={() => onChange(category.id)}
                  />
                ))}
              </View>
              {error && (
                <Text variant="caption" className="mt-1 text-danger">
                  {error.message}
                </Text>
              )}
            </View>
          )}
        />

        <View className="mb-6 flex-row space-x-3">
          <Controller
            control={control}
            name="originalPrice"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Input
                containerClassName="flex-1"
                testID="original-price-input"
                label={t('merchant.createListing.originalPrice')}
                placeholder="300"
                keyboardType="number-pad"
                value={value ? (isOriginalPriceFocused ? String(value) : formatCurrency(value)) : ''}
                onChangeText={(text) => onChange(Number(text.replace(/\D/g, '')) || 0)}
                onFocus={() => setIsOriginalPriceFocused(true)}
                onBlur={() => setIsOriginalPriceFocused(false)}
                error={error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="salePrice"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Input
                containerClassName="flex-1"
                testID="sale-price-input"
                label={t('merchant.createListing.salePrice')}
                placeholder="99"
                keyboardType="number-pad"
                value={value ? (isSalePriceFocused ? String(value) : formatCurrency(value)) : ''}
                onChangeText={(text) => onChange(Number(text.replace(/\D/g, '')) || 0)}
                onFocus={() => setIsSalePriceFocused(true)}
                onBlur={() => setIsSalePriceFocused(false)}
                error={error?.message}
              />
            )}
          />
        </View>

        <Controller
          control={control}
          name="quantity"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Input
              testID="quantity-input"
              label={t('merchant.createListing.quantity')}
              placeholder="5"
              keyboardType="number-pad"
              value={value ? String(value) : ''}
              onChangeText={(text) => onChange(Number(text.replace(/\D/g, '')) || 0)}
              error={error?.message}
            />
          )}
        />

        <View className="mb-6">
          <Text variant="h3" className="mb-3">
            {t('merchant.createListing.pickupWindow')}
          </Text>
          <View className="flex-row space-x-3">
            <Controller
              control={control}
              name="pickupWindowStart"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View className="flex-1">
                  <DateTimePickerField
                    testID="start-time-input"
                    label="Start"
                    value={value}
                    onChange={onChange}
                    minimumDate={new Date()}
                    error={error?.message}
                  />
                </View>
              )}
            />
            <Controller
              control={control}
              name="pickupWindowEnd"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View className="flex-1">
                  <DateTimePickerField
                    testID="end-time-input"
                    label="End"
                    value={value}
                    onChange={onChange}
                    minimumDate={value}
                    error={error?.message}
                  />
                </View>
              )}
            />
          </View>
        </View>

        <View className="mb-6">
          <Text variant="h3" className="mb-3">
            {t('merchant.createListing.tags')}
          </Text>
          <View className="flex-row flex-wrap">
            {DIETARY_TAGS.map((tag) => (
              <ToggleChip
                key={tag.id}
                label={tag.name}
                selected={dietaryTags.includes(tag.id)}
                onPress={() => toggleArray('dietaryTags', tag.id)}
              />
            ))}
            {dietaryTags
              .filter((id) => !DIETARY_TAGS.some((t) => t.id === id))
              .map((tag) => (
                <ToggleChip
                  key={tag}
                  label={tag}
                  selected
                  onPress={() => toggleArray('dietaryTags', tag)}
                />
              ))}
          </View>
          <View className="mt-3 flex-row items-center space-x-2">
            <Input
              containerClassName="flex-1"
              testID="custom-tag-input"
              placeholder="Add custom tag"
              value={customTagInput}
              onChangeText={setCustomTagInput}
              onSubmitEditing={addCustomTag}
            />
            <Button
              testID="add-custom-tag-button"
              variant="secondary"
              size="sm"
              onPress={addCustomTag}
              disabled={!customTagInput.trim()}
            >
              Add
            </Button>
          </View>
        </View>

        <View className="mb-6">
          <Text variant="h3" className="mb-3">
            {t('merchant.createListing.allergens')}
          </Text>
          <View className="flex-row flex-wrap">
            {ALLERGENS.map((allergen) => (
              <ToggleChip
                key={allergen.id}
                label={allergen.name}
                selected={allergens.includes(allergen.id)}
                onPress={() => toggleArray('allergens', allergen.id)}
              />
            ))}
            {allergens
              .filter((id) => !ALLERGENS.some((a) => a.id === id))
              .map((allergen) => (
                <ToggleChip
                  key={allergen}
                  label={allergen}
                  selected
                  onPress={() => toggleArray('allergens', allergen)}
                />
              ))}
          </View>
          <View className="mt-3 flex-row items-center space-x-2">
            <Input
              containerClassName="flex-1"
              testID="custom-allergen-input"
              placeholder="Add custom allergen"
              value={customAllergenInput}
              onChangeText={setCustomAllergenInput}
              onSubmitEditing={addCustomAllergen}
            />
            <Button
              testID="add-custom-allergen-button"
              variant="secondary"
              size="sm"
              onPress={addCustomAllergen}
              disabled={!customAllergenInput.trim()}
            >
              Add
            </Button>
          </View>
        </View>

        <Button
          testID="publish-button"
          fullWidth
          loading={createListing.isPending}
          onPress={handleSubmit(onSubmit)}
          leftIcon={<Check size={18} color={colors.white} />}
        >
          {t('merchant.createListing.publish')}
        </Button>
      </View>
    </Screen>
  );
}
