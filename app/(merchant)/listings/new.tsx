import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Alert, Platform } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
let ImagePicker: typeof import('expo-image-picker') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ImagePicker = require('expo-image-picker');
} catch {
  // not available in Expo Go
}

import { Text } from '@/src/components/ui/Text';
import { Screen } from '@/src/components/layout/Screen';
import { Header } from '@/src/components/layout/Header';
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
import { useAuthStore } from '@/src/stores/auth';
import type { Listing, ListingTemplate } from '@/src/types';
import { ListingTypeSection } from '@/src/components/screens/merchant-listing-form/ListingTypeSection';
import { PhotoUploadGrid } from '@/src/components/screens/merchant-listing-form/PhotoUploadGrid';
import { TitleDescriptionFields } from '@/src/components/screens/merchant-listing-form/TitleDescriptionFields';
import { CategoryPicker } from '@/src/components/screens/merchant-listing-form/CategoryPicker';
import { PricingFields } from '@/src/components/screens/merchant-listing-form/PricingFields';
import { QuantityFields } from '@/src/components/screens/merchant-listing-form/QuantityFields';
import { PickupWindowFields } from '@/src/components/screens/merchant-listing-form/PickupWindowFields';
import { AutoSettingsToggles } from '@/src/components/screens/merchant-listing-form/AutoSettingsToggles';
import { DietaryAllergenFields } from '@/src/components/screens/merchant-listing-form/DietaryAllergenFields';
import { PriceBumpWarning } from '@/src/components/screens/merchant-listing-form/PriceBumpWarning';
import {
  TemplateActionsBar,
  SubmitActionsBar,
} from '@/src/components/screens/merchant-listing-form/ListingFormActionBars';
import { TemplatePickerModal } from '@/src/components/screens/merchant-listing-form/TemplatePickerModal';
import {
  parseArrayParam,
  buildListingPayload,
} from '@/src/components/screens/merchant-listing-form/helpers';

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
    sourceOriginalPrice !== null && currentOriginalPrice > sourceOriginalPrice * 1.1;

  const loadTemplate = (template: ListingTemplate) => {
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
      Alert.alert(
        t('customer.orders.review.photoPickerUnavailableTitle'),
        t('customer.orders.review.addPlaceholderImagePrompt'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirm'),
            onPress: () =>
              setImages((prev) => [
                ...prev,
                `https://placehold.co/600x400/F97316/FFFFFF/png?text=${encodeURIComponent('Photo ' + (prev.length + 1))}`,
              ]),
          },
        ]
      );
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
        Alert.alert(
          t('customer.orders.review.permissionRequiredTitle'),
          t('customer.orders.review.addPlaceholderImagePrompt'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('common.confirm'),
              onPress: () =>
                setImages((prev) => [
                  ...prev,
                  `https://placehold.co/600x400/F97316/FFFFFF/png?text=${encodeURIComponent('Photo ' + (prev.length + 1))}`,
                ]),
            },
          ]
        );
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
      Alert.alert(t('common.errorTitle'), t('customer.orders.review.imagePickError'));
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
          flagReason: isPriceBumpFlagged
            ? 'Price increase exceeds 10% of source listing'
            : undefined,
        },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
              t('merchant.createListing.savedTitle'),
              t('merchant.createListing.savedAsTemplateMessage')
            );
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
        // Defer navigation one frame so the success state settles and the router
        // context is stable (avoids the rare "NavigationContainer" error).
        setTimeout(() => {
          try {
            router.replace('/(merchant)/(tabs)/inventory' as any);
          } catch {
            // Last-resort fallback if the router context is transiently unavailable.
          }
        }, 0);
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

        <ListingTypeSection control={control} type={type} />

        <PhotoUploadGrid
          images={images}
          onTakePhoto={() => handleImagePick('camera')}
          onPickLibrary={() => handleImagePick('library')}
          onRemoveImage={removeImage}
        />

        <TitleDescriptionFields control={control} />

        <CategoryPicker control={control} categories={categories} />

        <PricingFields
          control={control}
          isOriginalPriceFocused={isOriginalPriceFocused}
          setIsOriginalPriceFocused={setIsOriginalPriceFocused}
          isSalePriceFocused={isSalePriceFocused}
          setIsSalePriceFocused={setIsSalePriceFocused}
        />

        <QuantityFields control={control} />

        <PickupWindowFields control={control} />

        <AutoSettingsToggles
          autoExpiry={autoExpiry}
          setAutoExpiry={setAutoExpiry}
          autoDelistWhenSoldOut={autoDelistWhenSoldOut}
          setAutoDelistWhenSoldOut={setAutoDelistWhenSoldOut}
          flashSaleEnabled={flashSaleEnabled}
          setFlashSaleEnabled={setFlashSaleEnabled}
          flashSalePrice={flashSalePrice}
          setFlashSalePrice={setFlashSalePrice}
          flashSaleHours={flashSaleHours}
          setFlashSaleHours={setFlashSaleHours}
        />

        <DietaryAllergenFields
          dietaryTags={dietaryTags}
          allergens={allergens}
          customTagInput={customTagInput}
          setCustomTagInput={setCustomTagInput}
          customAllergenInput={customAllergenInput}
          setCustomAllergenInput={setCustomAllergenInput}
          onToggleArray={toggleArray}
          onAddCustomTag={addCustomTag}
          onAddCustomAllergen={addCustomAllergen}
        />

        <PriceBumpWarning visible={isPriceBumpFlagged} />

        <TemplateActionsBar
          onSaveAsTemplate={handleSaveAsTemplate}
          isSavingTemplate={createTemplate.isPending}
          onShowTemplatePicker={() => setShowTemplatePicker(true)}
        />

        <SubmitActionsBar
          onSaveDraft={handleSubmit((data) => onSubmit(data, 'draft'))}
          onPublish={handleSubmit((data) => onSubmit(data, 'active'))}
          isPending={isPending}
          isEditMode={isEditMode}
        />
      </View>

      <TemplatePickerModal
        visible={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        templates={templates}
        onSelectTemplate={loadTemplate}
      />
    </Screen>
  );
}
