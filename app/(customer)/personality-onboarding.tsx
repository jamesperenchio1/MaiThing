import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { FadeInRight, FadeInLeft } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { cn } from '@/src/lib/utils';
import {
  Coffee,
  Cookie,
  UtensilsCrossed,
  ShoppingBag,
  Flame,
  IceCream,
  Leaf,
  ShieldCheck,
  Sparkles,
  Utensils,
  Carrot,
  Moon,
  AlertCircle,
  Ban,
  Milk,
  Wallet,
  Coins,
  CreditCard,
  Gem,
  Infinity,
  Package,
  ClipboardList,
  Shuffle,
  Check,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react-native';

import { Screen } from '@/src/components/layout/Screen';
import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useScaledSize } from '@/src/lib/responsive';
import { useUpsertUserPersonality } from '@/src/hooks/usePersonality';
import { useAuthStore } from '@/src/stores/auth';
import {
  usePersonalityStore,
  type PriceRange,
  type DiscoveryStyle,
} from '@/src/stores/personality';

const TOTAL_STEPS = 4;

interface IconProps {
  size?: number;
  color?: string;
}

type IconComponent = React.ComponentType<IconProps>;

/* ------------------------------------------------------------------ */
/*  Data definitions                                                  */
/* ------------------------------------------------------------------ */

const CATEGORY_OPTIONS = [
  { key: 'cafes', icon: Coffee },
  { key: 'bakeries', icon: Cookie },
  { key: 'restaurants', icon: UtensilsCrossed },
  { key: 'grocery', icon: ShoppingBag },
  { key: 'streetFood', icon: Flame },
  { key: 'desserts', icon: IceCream },
  { key: 'healthy', icon: Leaf },
  { key: 'halal', icon: ShieldCheck },
  { key: 'everything', icon: Sparkles },
] as const;

type CategoryKey = (typeof CATEGORY_OPTIONS)[number]['key'];

const DIETARY_OPTIONS = [
  { key: 'noRestrictions', icon: Utensils },
  { key: 'vegetarian', icon: Leaf },
  { key: 'vegan', icon: Carrot },
  { key: 'halal', icon: Moon },
  { key: 'nutFree', icon: AlertCircle },
  { key: 'glutenFree', icon: Ban },
  { key: 'dairyFree', icon: Milk },
] as const;

type DietaryKey = (typeof DIETARY_OPTIONS)[number]['key'];

const PRICE_OPTIONS = [
  { key: 'under50', value: 'budget' as PriceRange, icon: Wallet },
  { key: 'mid', value: 'mid' as PriceRange, icon: Coins },
  { key: 'premium', value: 'premium' as PriceRange, icon: CreditCard },
  { key: 'luxury', value: 'luxury' as PriceRange, icon: Gem },
  { key: 'any', value: 'any' as PriceRange, icon: Infinity },
] as const;

type PriceKey = (typeof PRICE_OPTIONS)[number]['key'];

const DISCOVERY_OPTIONS = [
  { key: 'mystery', value: 'mystery' as DiscoveryStyle, icon: Package },
  { key: 'fixed', value: 'fixed' as DiscoveryStyle, icon: ClipboardList },
  { key: 'both', value: 'both' as DiscoveryStyle, icon: Shuffle },
] as const;

type DiscoveryKey = (typeof DISCOVERY_OPTIONS)[number]['key'];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */

interface SelectableChipProps {
  label: string;
  icon: IconComponent;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

function SelectableChip({
  label,
  icon: Icon,
  selected,
  onPress,
  accessibilityLabel,
}: SelectableChipProps) {
  const colors = useThemeColor();

  return (
    <PressableScale
      onPress={onPress}
      className={cn(
        'flex-row items-center rounded-full border px-4 py-2.5',
        selected ? 'border-primary bg-primary' : 'border-border bg-transparent'
      )}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Icon size={16} color={selected ? colors.white : colors.foreground} />
      <Text className={cn('ml-2', selected ? 'text-white' : 'text-foreground')}>{label}</Text>
    </PressableScale>
  );
}

interface SelectableCardProps {
  title: string;
  description: string;
  icon: IconComponent;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

function SelectableCard({
  title,
  description,
  icon: Icon,
  selected,
  onPress,
  accessibilityLabel,
}: SelectableCardProps) {
  const colors = useThemeColor();
  const { s } = useScaledSize();

  return (
    <PressableScale
      onPress={onPress}
      className={cn(
        'mb-3 w-full rounded-2xl border p-4',
        selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
      )}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? title}
    >
      <View className="flex-row items-center">
        <View
          className={cn(
            'mr-4 items-center justify-center rounded-xl',
            selected ? 'bg-primary' : 'bg-primary/10'
          )}
          style={{ width: s(48), height: s(48) }}
        >
          <Icon size={s(24)} color={selected ? colors.white : colors.primary} />
        </View>
        <View className="flex-1">
          <Text variant="h4">{title}</Text>
          <Text variant="body-sm" className="text-muted">
            {description}
          </Text>
        </View>
        {selected && <Check size={20} color={colors.primary} />}
      </View>
    </PressableScale>
  );
}

/* ------------------------------------------------------------------ */
/*  Main screen                                                       */
/* ------------------------------------------------------------------ */

export default function PersonalityOnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();
  const { s } = useScaledSize();
  const user = useAuthStore((s) => s.user);
  const upsertPersonality = useUpsertUserPersonality();

  const store = usePersonalityStore();
  const isEditMode = store.onboardingCompleted;

  const setOnboardingCompleted = usePersonalityStore((s) => s.setOnboardingCompleted);
  const setPreferredCategories = usePersonalityStore((s) => s.setPreferredCategories);
  const setDietaryPreferences = usePersonalityStore((s) => s.setDietaryPreferences);
  const setPriceRange = usePersonalityStore((s) => s.setPriceRange);
  const setDiscoveryStyle = usePersonalityStore((s) => s.setDiscoveryStyle);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'next' | 'back'>('next');

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<PriceRange | null>(null);
  const [selectedDiscovery, setSelectedDiscovery] = useState<DiscoveryStyle | null>(null);

  // Pre-populate from store when in edit mode
  useEffect(() => {
    if (isEditMode) {
      setSelectedCategories(store.preferredCategories ?? []);
      setSelectedDietary(store.dietaryPreferences ?? []);
      setSelectedPrice(store.priceRange);
      setSelectedDiscovery(store.discoveryStyle);
    }
  }, [isEditMode]);

  const isFirstStep = step === 0;
  const isLastStep = step === TOTAL_STEPS - 1;

  /* ---- label maps (type-safe) ---- */
  const categoryLabels: Record<CategoryKey, string> = {
    cafes: t('personality.screen1.cafes'),
    bakeries: t('personality.screen1.bakeries'),
    restaurants: t('personality.screen1.restaurants'),
    grocery: t('personality.screen1.grocery'),
    streetFood: t('personality.screen1.streetFood'),
    desserts: t('personality.screen1.desserts'),
    healthy: t('personality.screen1.healthy'),
    halal: t('personality.screen1.halal'),
    everything: t('personality.screen1.everything'),
  };

  const dietaryLabels: Record<DietaryKey, string> = {
    noRestrictions: t('personality.screen2.noRestrictions'),
    vegetarian: t('personality.screen2.vegetarian'),
    vegan: t('personality.screen2.vegan'),
    halal: t('personality.screen2.halal'),
    nutFree: t('personality.screen2.nutFree'),
    glutenFree: t('personality.screen2.glutenFree'),
    dairyFree: t('personality.screen2.dairyFree'),
  };

  const priceLabels: Record<PriceKey, string> = {
    under50: t('personality.screen3.under50'),
    mid: t('personality.screen3.mid'),
    premium: t('personality.screen3.premium'),
    luxury: t('personality.screen3.luxury'),
    any: t('personality.screen3.any'),
  };

  const priceDescriptions: Record<PriceKey, string> = {
    under50: t('personality.screen3.under50Desc'),
    mid: t('personality.screen3.midDesc'),
    premium: t('personality.screen3.premiumDesc'),
    luxury: t('personality.screen3.luxuryDesc'),
    any: t('personality.screen3.anyDesc'),
  };

  const discoveryLabels: Record<DiscoveryKey, string> = {
    mystery: t('personality.screen4.mystery'),
    fixed: t('personality.screen4.fixed'),
    both: t('personality.screen4.both'),
  };

  const discoveryDescriptions: Record<DiscoveryKey, string> = {
    mystery: t('personality.screen4.mysteryDesc'),
    fixed: t('personality.screen4.fixedDesc'),
    both: t('personality.screen4.bothDesc'),
  };

  /* ---- handlers ---- */
  const toggleCategory = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleDietary = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDietary((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectPrice = (value: PriceRange) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPrice((prev) => (prev === value ? null : value));
  };

  const selectDiscovery = (value: DiscoveryStyle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDiscovery((prev) => (prev === value ? null : value));
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLastStep) {
      finishOnboarding();
      return;
    }
    setDirection('next');
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isFirstStep) {
      setDirection('back');
      setStep((s) => Math.max(s - 1, 0));
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    finishOnboarding();
  };

  const handleSkipAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Defaults: all categories, no restrictions, any price, both styles
    setSelectedCategories([]);
    setSelectedDietary(['noRestrictions']);
    setSelectedPrice('any');
    setSelectedDiscovery('both');
    finishOnboarding();
  };

  const finishOnboarding = () => {
    const prefs = {
      preferredCategories: selectedCategories,
      dietaryPreferences: selectedDietary.length > 0 ? selectedDietary : ['noRestrictions'],
      priceRange: selectedPrice ?? 'any',
      discoveryStyle: selectedDiscovery ?? 'both',
      onboardingCompleted: true,
    };
    setPreferredCategories(selectedCategories);
    setDietaryPreferences(selectedDietary.length > 0 ? selectedDietary : ['noRestrictions']);
    if (selectedPrice) setPriceRange(selectedPrice);
    if (selectedDiscovery) setDiscoveryStyle(selectedDiscovery);
    setOnboardingCompleted(true);
    // Sync to Supabase if online
    if (user?.id) {
      upsertPersonality.mutate({ userId: user.id, data: prefs });
    }
    router.replace('/(customer)/(tabs)' as never);
  };

  /* ---- step renderers ---- */
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View className="flex-1">
            <Text variant="h2" className="mb-2 text-center">
              {t('personality.screen1.title')}
            </Text>
            <Text variant="body" className="mb-8 text-center text-muted">
              {t('personality.screen1.subtitle')}
            </Text>
            <View className="flex-row flex-wrap justify-center gap-3">
              {CATEGORY_OPTIONS.map((option) => (
                <SelectableChip
                  key={option.key}
                  label={categoryLabels[option.key]}
                  icon={option.icon}
                  selected={selectedCategories.includes(option.key)}
                  onPress={() => toggleCategory(option.key)}
                />
              ))}
            </View>
            {!isEditMode && (
              <View className="mt-6 items-center">
                <Button variant="ghost" onPress={handleSkipAll}>
                  <Text variant="body-sm" className="text-primary font-semibold">
                    {t('personality.skipAll')}
                  </Text>
                </Button>
              </View>
            )}
          </View>
        );

      case 1:
        return (
          <View className="flex-1">
            <Text variant="h2" className="mb-2 text-center">
              {t('personality.screen2.title')}
            </Text>
            <Text variant="body" className="mb-8 text-center text-muted">
              {t('personality.screen2.subtitle')}
            </Text>
            <View className="flex-row flex-wrap justify-center gap-3">
              {DIETARY_OPTIONS.map((option) => (
                <SelectableChip
                  key={option.key}
                  label={dietaryLabels[option.key]}
                  icon={option.icon}
                  selected={selectedDietary.includes(option.key)}
                  onPress={() => toggleDietary(option.key)}
                />
              ))}
            </View>
          </View>
        );

      case 2:
        return (
          <View className="flex-1">
            <Text variant="h2" className="mb-2 text-center">
              {t('personality.screen3.title')}
            </Text>
            <Text variant="body" className="mb-8 text-center text-muted">
              {t('personality.screen3.subtitle')}
            </Text>
            <View>
              {PRICE_OPTIONS.map((option) => (
                <SelectableCard
                  key={option.key}
                  title={priceLabels[option.key]}
                  description={priceDescriptions[option.key]}
                  icon={option.icon}
                  selected={selectedPrice === option.value}
                  onPress={() => selectPrice(option.value)}
                />
              ))}
            </View>
          </View>
        );

      case 3:
        return (
          <View className="flex-1">
            <Text variant="h2" className="mb-2 text-center">
              {t('personality.screen4.title')}
            </Text>
            <Text variant="body" className="mb-8 text-center text-muted">
              {t('personality.screen4.subtitle')}
            </Text>
            <View>
              {DISCOVERY_OPTIONS.map((option) => (
                <SelectableCard
                  key={option.key}
                  title={discoveryLabels[option.key]}
                  description={discoveryDescriptions[option.key]}
                  icon={option.icon}
                  selected={selectedDiscovery === option.value}
                  onPress={() => selectDiscovery(option.value)}
                />
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Screen scrollable edges={['top', 'bottom']}>
      <View className="flex-1 px-6 pb-10" style={{ paddingTop: s(24) }}>
        {/* Progress */}
        <View className="mb-6 flex-row items-center justify-between">
          <Text variant="caption">
            {t('personality.stepCounter', {
              current: step + 1,
              total: TOTAL_STEPS,
            })}
          </Text>
          <View className="flex-row space-x-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                className={cn(
                  'h-2 rounded-full',
                  i === step ? 'w-6 bg-primary' : 'w-2 bg-muted/30'
                )}
              />
            ))}
          </View>
        </View>

        {/* Step content */}
        <Animated.View
          key={`step-${step}`}
          entering={direction === 'next' ? FadeInRight.duration(300) : FadeInLeft.duration(300)}
          className="flex-1"
        >
          {renderStep()}
        </Animated.View>

        {/* Actions */}
        <View className="mt-8 space-y-3">
          <View className="flex-row space-x-3">
            {!isFirstStep && (
              <Button
                variant="outline"
                onPress={handleBack}
                leftIcon={<ArrowLeft size={18} color={colors.foreground} />}
                className="flex-1"
              >
                {t('personality.back')}
              </Button>
            )}
            <Button
              fullWidth={isFirstStep}
              className={isFirstStep ? 'w-full' : 'flex-1'}
              onPress={handleNext}
              rightIcon={!isLastStep ? <ArrowRight size={18} color={colors.white} /> : undefined}
            >
              {isLastStep
                ? isEditMode
                  ? t('personality.saveChanges')
                  : t('personality.getStarted')
                : t('personality.next')}
            </Button>
          </View>

          {!isEditMode && (
            <Button variant="ghost" onPress={handleSkip}>
              <Text variant="body-sm" className="text-muted">
                {t('personality.skip')}
              </Text>
            </Button>
          )}
        </View>
      </View>
    </Screen>
  );
}
