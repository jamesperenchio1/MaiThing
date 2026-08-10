import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, TextInput, Alert, Modal, Platform, Switch } from 'react-native';
import { Image } from '@/src/components/ui/Image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Camera,
  Plus,
  X,
  Check,
  Image as ImageIcon,
  FileText,
  ChevronDown,
  AlertTriangle,
  Zap,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
let ImagePicker: typeof import('expo-image-picker') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ImagePicker = require('expo-image-picker');
} catch {
  // not available in Expo Go
}

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Screen } from '@/src/components/layout/Screen';
import { Header } from '@/src/components/layout/Header';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { DateTimePickerField } from '@/src/components/ui/DateTimePickerField';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { createListingSchema, type CreateListingForm } from '@/src/features/listings/schemas';
import { useCategories, useMerchantByOwner } from '@/src/hooks/useMerchants';
import {
  useCreateListing,
  useUpdateListing,
  useListing,
  useListingTemplates,
  useCreateListingTemplate,
} from '@/src/hooks/useListings';
import { scheduleLocalNotification } from '@/src/services/notifications';
import { CATEGORIES, DIETARY_TAGS, ALLERGENS, BOX_SIZES } from '@/src/lib/constants';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useAuthStore } from '@/src/stores/auth';
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

function parseArrayParam(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value ? value.split(',').filter(Boolean) : [];
  }
}

function buildListingPayload(
  data: CreateListingForm,
  images: string[],
  merchantId: string,
  status: Listing['status']
): Omit<Listing, 'id' | 'createdAt'> {
  const base = {
    merchantId,
    type: data.type,
    title: data.title,
    description: data.description,
    images:
      images.length > 0
        ? images
        : [`https://placehold.co/600x400/F97316/FFFFFF/png?text=${encodeURIComponent(data.title)}`],
    category: data.category,
    originalPrice: data.originalPrice,
    salePrice: data.salePrice,
    quantity: data.quantity,
    quantityRemaining: data.quantity,
    pickupWindowStart: data.pickupWindowStart.toISOString(),
    pickupWindowEnd: data.pickupWindowEnd.toISOString(),
    dietaryTags: data.dietaryTags,
    allergens: data.allergens,
    status,
    lowStockThreshold: data.lowStockThreshold,
  } as Omit<Listing, 'id' | 'createdAt'>;

  if (data.type === 'mystery_box') {
    return {
      ...base,
      boxSize: data.boxSize ?? 'medium',
      estimatedRetailValue: data.originalPrice,
    } as Omit<Listing, 'id' | 'createdAt'>;
  }

  return base;
}

export default function CreateListingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    duplicateId?: string;
    templateId?: string;
    title?: string;
    description?: string;
    type?: 'mystery_box' | 'fixed_item';
    originalPrice?: string;
    salePrice?: string;
    category?: string;
    quantity?: string;
    boxSize?: 'small' | 'medium' | 'large' | 'xl';
    images?: string;
    dietaryTags?: string;
    allergens?: string;
    pickupWindowStart?: string;
    pickupWindowEnd?: string;
  }>();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { data: merchant } = useMerchantByOwner(user?.id ?? '');
  const merchantId = merchant?.id ?? '';

  const { data: categories } = useCategories();
  const colors = useThemeColor();
  const [images, setImages] = useState<string[]>(parseArrayParam(params.images));
  const [isOriginalPriceFocused, setIsOriginalPriceFocused] = useState(false);
  const [isSalePriceFocused, setIsSalePriceFocused] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  const [customAllergenInput, setCustomAllergenInput] = useState('');
  const [autoExpiry, setAutoExpiry] = useState(false);
  const [autoDelistWhenSoldOut, setAutoDelistWhenSoldOut] = useState(false);
  const [flashSaleEnabled, setFlashSaleEnabled] = useState(false);
  const [flashSalePrice, setFlashSalePrice] = useState('');
  const [flashSaleHours, setFlashSaleHours] = useState('2');
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const isEditMode = !!params.id;
  const isDuplicateMode = !!params.duplicateId || !!params.templateId;

  const { data: existingListing } = useListing(params.id ?? '');
  const { data: templates } = useListingTemplates(merchantId);
  const createListing = useCreateListing();
  const updateListing = useUpdateListing();
  const createTemplate = useCreateListingTemplate(merchantId);

  const defaultValues: CreateListingForm = useMemo(
    () => ({
      type: params.type ?? 'mystery_box',
      title: params.title ?? '',
      description: params.description ?? '',
      category: params.category ?? 'bakery',
      boxSize: params.boxSize ?? 'medium',
      originalPrice: Number(params.originalPrice) || 300,
      salePrice: Number(params.salePrice) || 99,
      quantity: Number(params.quantity) || 5,
      lowStockThreshold: 3,
      pickupWindowStart: params.pickupWindowStart
        ? new Date(params.pickupWindowStart)
        : new Date(new Date().setHours(18, 0, 0, 0)),
      pickupWindowEnd: params.pickupWindowEnd
        ? new Date(params.pickupWindowEnd)
        : new Date(new Date().setHours(20, 0, 0, 0)),
      dietaryTags: parseArrayParam(params.dietaryTags),
      allergens: parseArrayParam(params.allergens),
    }),
    [params]
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<CreateListingForm>({
    resolver: zodResolver(createListingSchema),
    mode: 'onChange',
    defaultValues,
  });

  useEffect(() => {
    if (isEditMode && existingListing) {
      setImages(existingListing.images);
      reset({
        type: existingListing.type,
        title: existingListing.title,
        description: existingListing.description,
        category: existingListing.category,
        boxSize: existingListing.type === 'mystery_box' ? existingListing.boxSize : undefined,
        originalPrice: existingListing.originalPrice,
        salePrice: existingListing.salePrice,
        quantity: existingListing.quantity,
        lowStockThreshold: existingListing.lowStockThreshold ?? 3,
        pickupWindowStart: new Date(existingListing.pickupWindowStart),
        pickupWindowEnd: new Date(existingListing.pickupWindowEnd),
        dietaryTags: existingListing.dietaryTags,
        allergens: existingListing.allergens,
      });
    }
  }, [existingListing, isEditMode, reset]);

  useEffect(() => {
    if (params.templateId && templates) {
      const template = templates.find((t) => t.id === params.templateId);
      if (template) {
        loadTemplate(template);
      }
    }
  }, [params.templateId, templates]);

  const type = watch('type');
  const dietaryTags = watch('dietaryTags') ?? [];
  const allergens = watch('allergens') ?? [];
  const currentOriginalPrice = watch('originalPrice');

  // Source price for anti-inflation guard: compare against the template or duplicated listing
  const sourceOriginalPrice = useMemo(() => {
    if (params.templateId && templates) {
      const tpl = templates.find((t) => t.id === params.templateId);
      return tpl?.originalPrice ?? null;
    }
    if (params.duplicateId && params.originalPrice) {
      const parsed = Number(params.originalPrice);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }, [params.templateId, params.duplicateId, params.originalPrice, templates]);

  // Flag if original price is >10% higher than the source listing/template price
  const isPriceBumpFlagged =
    sourceOriginalPrice !== null &&
    currentOriginalPrice > sourceOriginalPrice * 1.1;

  const loadTemplate = (template: {
    name?: string;
    type: Listing['type'];
    title: string;
    description: string;
    category: string;
    originalPrice: number;
    salePrice: number;
    quantity: number;
    boxSize?: 'small' | 'medium' | 'large' | 'xl';
    estimatedRetailValue?: number;
    dietaryTags: string[];
    allergens: string[];
    images: string[];
    pickupWindowDurationHours?: number;
    autoExpiry?: boolean;
  }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const start = new Date();
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 1);
    const durationHours = template.pickupWindowDurationHours ?? 2;
    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

    setImages(template.images ?? []);
    setAutoExpiry(template.autoExpiry ?? false);
    reset({
      type: template.type,
      title: template.title,
      description: template.description,
      category: template.category,
      boxSize: template.boxSize,
      originalPrice: template.originalPrice,
      salePrice: template.salePrice,
      quantity: template.quantity,
      pickupWindowStart: start,
      pickupWindowEnd: end,
      dietaryTags: template.dietaryTags,
      allergens: template.allergens,
    });
    setShowTemplatePicker(false);
  };

  const handleImagePick = async (source: 'camera' | 'library') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (Platform.OS === 'web') {
      Alert.alert('Photo picker unavailable', 'Add a placeholder image instead?', [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () =>
            setImages((prev) => [
              ...prev,
              `https://placehold.co/600x400/F97316/FFFFFF/png?text=${encodeURIComponent('Photo ' + (prev.length + 1))}`,
            ]),
        },
      ]);
      return;
    }

    if (!ImagePicker) return;

    try {
      let permissionResult;
      if (source === 'camera') {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission required', 'Add a placeholder image instead?', [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirm'),
            onPress: () =>
              setImages((prev) => [
                ...prev,
                `https://placehold.co/600x400/F97316/FFFFFF/png?text=${encodeURIComponent('Photo ' + (prev.length + 1))}`,
              ]),
          },
        ]);
        return;
      }

      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3] as [number, number],
        quality: 0.8 as number,
      };

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (uri) {
          setImages((prev) => [...prev, uri]);
        }
      }
    } catch {
      Alert.alert('Error', 'Could not pick image. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
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
    if (!dietaryTags.includes(value)) {
      setValue('dietaryTags', [...dietaryTags, value]);
    }
    setCustomTagInput('');
  };

  const addCustomAllergen = () => {
    const value = customAllergenInput.trim();
    if (!value) return;
    if (!allergens.includes(value)) {
      setValue('allergens', [...allergens, value]);
    }
    setCustomAllergenInput('');
  };

  const handleSaveAsTemplate = () => {
    handleSubmit((data) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const durationHours = Math.max(
        1,
        Math.round((data.pickupWindowEnd.getTime() - data.pickupWindowStart.getTime()) / 3600000)
      );
      createTemplate.mutate(
        {
          name: data.title,
          type: data.type,
          title: data.title,
          description: data.description,
          category: data.category,
          originalPrice: data.originalPrice,
          salePrice: data.salePrice,
          quantity: data.quantity,
          boxSize: data.type === 'mystery_box' ? data.boxSize : undefined,
          estimatedRetailValue: data.type === 'mystery_box' ? data.originalPrice : undefined,
          dietaryTags: data.dietaryTags,
          allergens: data.allergens,
          images: images.length > 0 ? images : [],
          pickupWindowDurationHours: durationHours,
          autoExpiry,
          isFlagged: isPriceBumpFlagged || undefined,
          flagReason: isPriceBumpFlagged ? 'Price increase exceeds 10% of source listing' : undefined,
        },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Saved', 'Listing saved as template.');
          },
        }
      );
    })();
  };

  const onSubmit = (data: CreateListingForm, status: Listing['status']) => {
    if (!merchantId) return;

    const isEditing = isEditMode && !!params.id;
    const resolvedStatus = isEditing && existingListing ? existingListing.status : status;
    const flashSalePriceNum = flashSaleEnabled ? Number(flashSalePrice) || 0 : undefined;
    const flashSaleEndsAtStr =
      flashSaleEnabled && Number(flashSaleHours) > 0
        ? new Date(Date.now() + Number(flashSaleHours) * 3600000).toISOString()
        : undefined;
    const payload: Omit<Listing, 'id' | 'createdAt'> = {
      ...buildListingPayload(data, images, merchantId, resolvedStatus),
      autoDelistWhenSoldOut,
      ...(flashSaleEnabled && flashSalePriceNum && flashSaleEndsAtStr
        ? { flashSalePrice: flashSalePriceNum, flashSaleEndsAt: flashSaleEndsAtStr }
        : {}),
      quantityRemaining:
        isEditing && existingListing
          ? Math.min(
              data.quantity,
              existingListing.quantityRemaining + (data.quantity - existingListing.quantity)
            )
          : data.quantity,
    };

    if (isEditing) {
      updateListing.mutate(
        { id: params.id!, data: payload },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/(merchant)/(tabs)/inventory' as any);
          },
        }
      );
      return;
    }

    createListing.mutate(payload, {
      onSuccess: (created) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const notificationType = status === 'draft' ? 'listing_draft' : 'listing_published';
        scheduleLocalNotification(
          status === 'draft' ? 'Listing saved as draft' : 'Listing published',
          `"${created.title}" is ${status === 'draft' ? 'saved as a draft' : 'now live and visible to customers'}.`,
          {
            listingId: created.id,
            type: notificationType,
          },
          undefined,
          'new_deal',
          `/(merchant)/(tabs)/inventory`
        ).catch(() => {});
        router.replace('/(merchant)/(tabs)/inventory' as any);
      },
    });
  };

  const isPending = createListing.isPending || updateListing.isPending;

  return (
    <Screen testID="create-listing-screen" scrollable keyboardAvoiding>
      <Header
        testID="create-listing-header"
        title={
          isEditMode ? t('merchant.createListing.editTitle') : t('merchant.createListing.title')
        }
      />
      <View className="px-6 py-4 pb-12">
        <Text variant="h2" className="mb-6">
          {t('merchant.createListing.chooseType')}
        </Text>

        <Controller
          control={control}
          name="type"
          render={({ field: { onChange, value } }) => (
            <View className="mb-6 flex-row gap-3">
              {(['mystery_box', 'fixed_item'] as const).map((item) => (
                <PressableScale
                  key={item}
                  testID={item === 'mystery_box' ? 'mystery-box-option' : 'fixed-item-option'}
                  onPress={() => onChange(item)}
                  scale={0.98}
                  className="flex-1"
                >
                  <Card
                    variant={value === item ? 'elevated' : 'outlined'}
                    className="items-center p-4"
                    style={
                      value === item ? { borderWidth: 2, borderColor: colors.primary } : undefined
                    }
                  >
                    <View className="mb-2 rounded-full bg-primary/10 p-3">
                      <Camera size={24} color={colors.primary} />
                    </View>
                    <Text variant="body-sm" className="font-semibold">
                      {item === 'mystery_box'
                        ? t('merchant.createListing.mysteryBox')
                        : t('merchant.createListing.fixedItem')}
                    </Text>
                    <Text variant="caption" className="text-center text-muted">
                      {item === 'mystery_box'
                        ? t('merchant.createListing.mysteryBoxDesc')
                        : t('merchant.createListing.fixedItemDesc')}
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
                  {t('merchant.createListing.boxSize')}
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
          <View className="mb-3 flex-row items-center justify-between">
            <Text variant="h3">{t('merchant.createListing.photos')}</Text>
            <View className="flex-row items-center">
              <PressableScale
                onPress={() => handleImagePick('camera')}
                scale={0.95}
                className="mr-3"
              >
                <View className="flex-row items-center">
                  <Camera size={16} color={colors.primary} />
                  <Text variant="caption" className="ml-1 text-primary">
                    {t('merchant.createListing.takePhoto')}
                  </Text>
                </View>
              </PressableScale>
              <PressableScale onPress={() => handleImagePick('library')} scale={0.95}>
                <View className="flex-row items-center">
                  <ImageIcon size={16} color={colors.primary} />
                  <Text variant="caption" className="ml-1 text-primary">
                    {t('merchant.createListing.chooseFromLibrary')}
                  </Text>
                </View>
              </PressableScale>
            </View>
          </View>
          <View className="flex-row flex-wrap">
            {images.map((uri, index) => (
              <View key={`${uri}-${index}`} className="relative mr-2 mb-2">
                <Image source={{ uri }} className="h-24 w-24 rounded-2xl" resizeMode="cover" />
                <PressableScale
                  onPress={() => removeImage(index)}
                  className="absolute -right-1 -top-1 rounded-full bg-danger p-1"
                  scale={0.9}
                >
                  <X size={12} color={colors.white} />
                </PressableScale>
              </View>
            ))}
            <PressableScale
              onPress={() => handleImagePick('library')}
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
              label={t('merchant.createListing.listingDetails')}
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
                      descriptionAtLimit
                        ? 'text-danger'
                        : descriptionNearLimit
                          ? 'text-amber-500'
                          : 'text-muted'
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
                {!categories &&
                  CATEGORIES.map((category) => (
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
                value={
                  value ? (isOriginalPriceFocused ? String(value) : formatCurrency(value)) : ''
                }
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

        <Controller
          control={control}
          name="lowStockThreshold"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View className="mb-4">
              <Input
                testID="low-stock-threshold-input"
                label="Low stock alert"
                placeholder="3"
                keyboardType="number-pad"
                value={value ? String(value) : ''}
                onChangeText={(text) => onChange(Number(text.replace(/\D/g, '')) || 0)}
                error={error?.message}
                maxLength={3}
                containerClassName="mb-1.5"
              />
              {!error && (
                <Text variant="caption" className="ml-1 text-muted">
                  Alert when fewer than this many remain
                </Text>
              )}
            </View>
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

        <View className="mb-6 flex-row items-center justify-between rounded-2xl border border-border bg-card p-4">
          <View className="flex-1 pr-4">
            <Text variant="body-sm" className="font-semibold">
              {t('merchant.createListing.autoExpiry')}
            </Text>
            <Text variant="caption" className="text-muted">
              Automatically mark as expired after pickup window ends
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
              Auto-delist when sold out
            </Text>
            <Text variant="caption" className="text-muted">
              Automatically remove listing when stock reaches zero
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
                  Flash Sale
                </Text>
              </View>
              <Text variant="caption" className="text-muted">
                Temporarily lower the price to boost last-minute sales
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
                label="Flash Price (฿)"
                placeholder="59"
                keyboardType="number-pad"
                value={flashSalePrice}
                onChangeText={setFlashSalePrice}
                maxLength={6}
              />
              <Input
                containerClassName="flex-1"
                label="Duration (hours)"
                placeholder="2"
                keyboardType="number-pad"
                value={flashSaleHours}
                onChangeText={setFlashSaleHours}
                maxLength={2}
              />
            </View>
          )}
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
              placeholder={t('merchant.createListing.customTag')}
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
              placeholder={t('merchant.createListing.customAllergen')}
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

        {isPriceBumpFlagged && (
          <View className="mb-4 flex-row rounded-2xl border border-warning bg-warning/10 p-4">
            <AlertTriangle size={18} color={colors.warning} style={{ marginTop: 1 }} />
            <View className="ml-3 flex-1">
              <Text variant="body-sm" className="font-semibold text-warning">
                Price increase flagged
              </Text>
              <Text variant="caption" className="mt-0.5 text-warning">
                Listings must offer genuine discounts. A significant price increase has been noted
                and may be reviewed by our team.
              </Text>
            </View>
          </View>
        )}

        <View className="mb-4 flex-row space-x-3">
          <Button
            testID="save-template-button"
            variant="secondary"
            className="flex-1"
            onPress={handleSaveAsTemplate}
            loading={createTemplate.isPending}
            leftIcon={<FileText size={18} color={colors.foreground} />}
          >
            {t('merchant.inventory.saveAsTemplate')}
          </Button>
          <Button
            testID="load-template-button"
            variant="outline"
            className="flex-1"
            onPress={() => setShowTemplatePicker(true)}
            leftIcon={<ChevronDown size={18} color={colors.foreground} />}
          >
            {t('merchant.inventory.useTemplate')}
          </Button>
        </View>

        <View className="flex-row space-x-3">
          <Button
            testID="save-draft-button"
            variant="outline"
            className="flex-1"
            onPress={handleSubmit((data) => onSubmit(data, 'draft'))}
            disabled={isPending}
          >
            {t('merchant.createListing.saveDraft')}
          </Button>
          <Button
            testID="publish-button"
            className="flex-1"
            loading={isPending}
            onPress={handleSubmit((data) => onSubmit(data, 'active'))}
            leftIcon={<Check size={18} color={colors.white} />}
          >
            {isEditMode ? t('common.save') : t('merchant.createListing.publish')}
          </Button>
        </View>
      </View>

      <Modal
        visible={showTemplatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTemplatePicker(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[70%] rounded-t-3xl bg-card px-4 pb-8 pt-4">
            <View className="mb-4 flex-row items-center justify-between">
              <Button variant="ghost" onPress={() => setShowTemplatePicker(false)}>
                {t('common.cancel')}
              </Button>
              <Text variant="h3">{t('merchant.inventory.templates')}</Text>
              <View className="w-12" />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {templates && templates.length > 0 ? (
                templates.map((template) => (
                  <PressableScale
                    key={template.id}
                    onPress={() => loadTemplate(template)}
                    scale={0.98}
                  >
                    <Card
                      variant="outlined"
                      className="mb-3 flex-row items-center justify-between p-3"
                    >
                      <View className="flex-1">
                        <Text variant="body-sm" className="font-semibold" numberOfLines={1}>
                          {template.name || template.title}
                        </Text>
                        <Text variant="caption" className="text-muted">
                          {formatCurrency(template.salePrice)} · {template.category}
                        </Text>
                      </View>
                      <Badge variant="info">{t('merchant.inventory.useTemplate')}</Badge>
                    </Card>
                  </PressableScale>
                ))
              ) : (
                <EmptyState
                  icon={<FileText size={32} color={colors.muted} />}
                  title={t('merchant.inventory.noListings')}
                />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
