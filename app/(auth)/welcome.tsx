import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Image } from '@/src/components/ui/Image';
import {
  Leaf,
  Utensils,
  Wallet,
  Search,
  ShoppingBag,
  MapPin,
  BadgeCheck,
  ShieldCheck,
  Users,
  UtensilsCrossed,
  Store,
  ArrowRight,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Button } from '@/src/components/ui/Button';
import { Text } from '@/src/components/ui/Text';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { Screen } from '@/src/components/layout/Screen';
import { useAuth } from '@/src/hooks/useAuth';
import { useAuthStore } from '@/src/stores/auth';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { APP_NAME } from '@/src/lib/constants';
import { APP_STATS } from '@/src/lib/constants';
import { formatCompactNumber } from '@/src/lib/utils';

const FOOD_HERO_IMAGES = [
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1517244683847-7456b63c5969?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop',
];

function getHowItWorksSteps(t: (key: string, options?: Record<string, unknown>) => string) {
  return [
    {
      icon: Search,
      title: t('auth.onboarding.howItWorks.browse.title'),
      description: t('auth.onboarding.howItWorks.browse.desc'),
    },
    {
      icon: ShoppingBag,
      title: t('auth.onboarding.howItWorks.reserve.title'),
      description: t('auth.onboarding.howItWorks.reserve.desc'),
    },
    {
      icon: MapPin,
      title: t('auth.onboarding.howItWorks.pickup.title'),
      description: t('auth.onboarding.howItWorks.pickup.desc'),
    },
  ];
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();
  const { continueAsTest } = useAuth();
  const user = useAuthStore((s) => s.user);
  const selectedRole = useAuthStore((s) => s.selectedRole);

  const handleContinueAsCustomer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    continueAsTest('customer');
  };

  const handleContinueAsMerchant = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    continueAsTest('merchant');
  };

  const handleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(auth)/sign-in' as any);
  };

  const handleSignUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(auth)/sign-up' as any);
  };

  const handleSellOnMaithing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (user && selectedRole === 'merchant') {
      router.push('/(merchant)/(tabs)' as any);
    } else {
      router.push('/(merchant)/onboarding' as any);
    }
  };

  return (
    <Screen testID="welcome-screen" className="bg-background">
      <View className="px-6 pt-6 pb-10">
        <Animated.View entering={FadeInUp.duration(600).delay(100)} className="items-center">
          <View className="mb-6 h-24 w-24 items-center justify-center rounded-3xl bg-primary/10">
            <Leaf size={48} color={colors.primary} />
          </View>

          <View className="mb-6 flex-row justify-center space-x-2">
            {FOOD_HERO_IMAGES.map((uri, index) => (
              <View
                key={uri}
                className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-background shadow-sm"
                style={{ marginLeft: index > 0 ? -12 : 0, zIndex: index }}
              >
                <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />
              </View>
            ))}
          </View>

          <Text testID="welcome-title" variant="h1" className="mb-3 text-center text-primary">
            {APP_NAME}
          </Text>
          <Text testID="welcome-subtitle" variant="h2" className="mb-3 text-center">
            {t('auth.welcome')}
          </Text>
          <Text variant="body" className="mb-8 max-w-xs text-center text-muted">
            {t('app.tagline')}
          </Text>

          <View className="mb-8 w-full rounded-3xl bg-primary p-6">
            <Text variant="h3" className="mb-4 text-center text-white">
              {t('auth.onboarding.stats.title')}
            </Text>
            <View className="flex-row justify-between">
              <View className="flex-1 items-center px-1">
                <Users size={24} color={colors.white} />
                <Text className="mt-2 text-xl font-bold text-white">
                  {formatCompactNumber(APP_STATS.totalRescuers)}
                </Text>
                <Text variant="caption" className="text-white/80">
                  {t('auth.onboarding.stats.rescuers')}
                </Text>
              </View>
              <View className="flex-1 items-center px-1">
                <UtensilsCrossed size={24} color={colors.white} />
                <Text className="mt-2 text-xl font-bold text-white">
                  {formatCompactNumber(APP_STATS.totalMealsSaved)}
                </Text>
                <Text variant="caption" className="text-white/80">
                  {t('auth.onboarding.stats.mealsSaved')}
                </Text>
              </View>
              <View className="flex-1 items-center px-1">
                <BadgeCheck size={24} color={colors.white} />
                <Text className="mt-2 text-xl font-bold text-white">
                  {APP_STATS.totalMerchantPartners}+
                </Text>
                <Text variant="caption" className="text-white/80">
                  {t('auth.onboarding.stats.partners')}
                </Text>
              </View>
            </View>
          </View>

          <View className="mb-8 w-full space-y-3">
            {getHowItWorksSteps(t).map((step, index) => (
              <View key={step.title} className="flex-row items-center rounded-2xl bg-card p-4">
                <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <step.icon size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <View className="mb-0.5 flex-row items-center">
                    <Text variant="caption" className="mr-2 text-primary">
                      {t('auth.onboarding.step', { step: index + 1 })}
                    </Text>
                    <Text variant="h4">{step.title}</Text>
                  </View>
                  <Text variant="body-sm" className="text-muted">
                    {step.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View className="mb-8 w-full items-center rounded-2xl bg-muted/10 px-4 py-3">
            <View className="flex-row items-center justify-center gap-4">
              <View className="flex-row items-center">
                <ShieldCheck size={16} color={colors.success} />
                <Text variant="body-sm" className="ml-1.5">
                  {t('auth.onboarding.trust.pickupGuarantee')}
                </Text>
              </View>
              <View className="flex-row items-center">
                <BadgeCheck size={16} color={colors.success} />
                <Text variant="body-sm" className="ml-1.5">
                  {t('auth.onboarding.trust.verifiedShops')}
                </Text>
              </View>
            </View>
            <Text variant="caption" className="mt-1.5 text-center text-muted">
              {t('auth.onboarding.context')}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(600).delay(400)} className="w-full space-y-3">
          <Button testID="sign-up-button" fullWidth onPress={handleSignUp}>
            {t('auth.signUp')}
          </Button>
          <Button testID="sign-in-button" variant="secondary" fullWidth onPress={handleSignIn}>
            {t('auth.signIn')}
          </Button>

          {__DEV__ && (
            <>
              <View className="my-4 flex-row items-center justify-center space-x-4">
                <View className="h-px flex-1 bg-border" />
                <Text variant="caption">{t('common.or')}</Text>
                <View className="h-px flex-1 bg-border" />
              </View>

              <Button
                testID="test-customer-button"
                variant="outline"
                fullWidth
                onPress={handleContinueAsCustomer}
                leftIcon={<Wallet size={18} color={colors.foreground} />}
              >
                {t('auth.continueAsTestCustomer')}
              </Button>
              <Button
                testID="test-merchant-button"
                variant="outline"
                fullWidth
                onPress={handleContinueAsMerchant}
                leftIcon={<Utensils size={18} color={colors.foreground} />}
              >
                {t('auth.continueAsTestMerchant')}
              </Button>
            </>
          )}

          {/* Merchant pitch */}
          <PressableScale
            testID="sell-on-maithing-button"
            onPress={handleSellOnMaithing}
            scale={0.98}
            className="mt-4 overflow-hidden rounded-3xl bg-card"
          >
            <View className="flex-row items-center p-4">
              <View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Store size={24} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text variant="h4" className="mb-0.5">
                  {t('auth.sellOnMaithing')}
                </Text>
                <Text variant="body-sm" className="text-muted">
                  {t('auth.sellOnMaithingDesc')}
                </Text>
              </View>
              <ArrowRight size={20} color={colors.primary} />
            </View>
          </PressableScale>
        </Animated.View>
      </View>
    </Screen>
  );
}
