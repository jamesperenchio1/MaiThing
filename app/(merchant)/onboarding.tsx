import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInRight, FadeInLeft } from 'react-native-reanimated';
import {
  Store,
  HeartHandshake,
  Percent,
  CalendarClock,
  PackagePlus,
  BadgeCheck,
  ArrowRight,
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  Landmark,
  CreditCard,
  SkipForward,
} from 'lucide-react-native';

import { Screen } from '@/src/components/layout/Screen';
import { Header } from '@/src/components/layout/Header';
import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useAuthStore } from '@/src/stores/auth';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { mockRepositories } from '@/src/repositories/mock';
import { TEST_MERCHANT_USER } from '@/src/repositories/seed';
import { formatCurrency } from '@/src/lib/utils';

const COMMISSION_RATE = 0.15;
const PAYOUT_DAY = 'Tuesday';

const STEPS = [
  { key: 'value', icon: HeartHandshake },
  { key: 'pricing', icon: Percent },
  { key: 'payouts', icon: CalendarClock },
  { key: 'business', icon: Building2 },
  { key: 'bank', icon: Landmark },
  { key: 'firstListing', icon: PackagePlus },
  { key: 'complete', icon: BadgeCheck },
] as const;

type StepKey = (typeof STEPS)[number]['key'];

export default function MerchantOnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setRole = useAuthStore((s) => s.setRole);

  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'back'>('next');
  const [isRegistering, setIsRegistering] = useState(false);

  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [password, setPassword] = useState('');

  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const currentStep = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  const isFirstStep = stepIndex === 0;

  const isTestAccount = user?.id === TEST_MERCHANT_USER.id;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLastStep) {
      finishOnboarding();
      return;
    }
    setDirection('next');
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDirection('back');
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const handleSkipToDashboard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(merchant)/(tabs)' as any);
  };

  const finishOnboarding = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (user) {
      router.replace('/(merchant)/(tabs)' as any);
      return;
    }

    setIsRegistering(true);
    try {
      const registeredUser = await mockRepositories.auth.registerMerchant({
        email: email || `${Date.now()}@partner.test`,
        password: password || 'password',
        name: ownerName || businessName || 'Partner',
        businessName: businessName || 'My Shop',
        phone: phone || '081-234-5678',
      });
      setUser(registeredUser);
      setRole('merchant');
      router.replace('/(merchant)/(tabs)' as any);
    } catch (err) {
      // If registration fails, still let the user into the dashboard for demo purposes
      router.replace('/(merchant)/(tabs)' as any);
    } finally {
      setIsRegistering(false);
    }
  };

  const renderStepContent = (key: StepKey) => {
    switch (key) {
      case 'value':
        return (
          <View className="items-center">
            <View className="mb-6 h-24 w-24 items-center justify-center rounded-3xl bg-primary/10">
              <HeartHandshake size={48} color={colors.primary} />
            </View>
            <Text variant="h2" className="mb-3 text-center">
              {t('merchant.onboarding.title')}
            </Text>
            <Text variant="body" className="mb-8 text-center text-muted">
              {t('merchant.onboarding.subtitle')}
            </Text>
            <Card variant="outlined" className="w-full">
              <View className="mb-3 flex-row items-center">
                <View className="mr-3 rounded-xl bg-primary/10 p-2">
                  <Store size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text variant="h4">{t('merchant.onboarding.stepValue')}</Text>
                  <Text variant="body-sm" className="text-muted">
                    {t('merchant.onboarding.stepValueDesc')}
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        );

      case 'pricing':
        return (
          <View className="items-center">
            <View className="mb-6 h-24 w-24 items-center justify-center rounded-3xl bg-primary/10">
              <Percent size={48} color={colors.primary} />
            </View>
            <Text variant="h2" className="mb-3 text-center">
              {t('merchant.onboarding.stepPricing')}
            </Text>
            <Text variant="body" className="mb-8 text-center text-muted">
              {t('merchant.onboarding.stepPricingDesc')}
            </Text>
            <Card variant="outlined" className="w-full items-center py-8">
              <Text className="text-5xl font-bold text-primary">{COMMISSION_RATE * 100}%</Text>
              <Text variant="body" className="mt-2 text-muted">
                commission per sale
              </Text>
              <View className="mt-6 w-full space-y-2">
                {['No monthly fees', 'No setup costs', 'Cancel anytime'].map((item) => (
                  <View key={item} className="flex-row items-center justify-center">
                    <BadgeCheck size={16} color={colors.success} />
                    <Text variant="body-sm" className="ml-2">
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        );

      case 'payouts':
        return (
          <View className="items-center">
            <View className="mb-6 h-24 w-24 items-center justify-center rounded-3xl bg-primary/10">
              <CalendarClock size={48} color={colors.primary} />
            </View>
            <Text variant="h2" className="mb-3 text-center">
              {t('merchant.onboarding.stepPayout')}
            </Text>
            <Text variant="body" className="mb-8 text-center text-muted">
              {t('merchant.onboarding.stepPayoutDesc')}
            </Text>
            <Card variant="outlined" className="w-full">
              <View className="mb-4 flex-row items-center justify-between border-b border-border pb-4">
                <Text variant="body-sm" className="text-muted">
                  Payout schedule
                </Text>
                <Text variant="body-sm" className="font-semibold">
                  Every {PAYOUT_DAY}
                </Text>
              </View>
              <View className="mb-4 flex-row items-center justify-between border-b border-border pb-4">
                <Text variant="body-sm" className="text-muted">
                  Minimum payout
                </Text>
                <Text variant="body-sm" className="font-semibold">
                  {formatCurrency(500)}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text variant="body-sm" className="text-muted">
                  Settlement
                </Text>
                <Text variant="body-sm" className="font-semibold">
                  Bank transfer
                </Text>
              </View>
            </Card>
          </View>
        );

      case 'business':
        return (
          <View>
            <Text variant="h2" className="mb-2 text-center">
              {t('merchant.onboarding.businessInfo')}
            </Text>
            <Text variant="body" className="mb-6 text-center text-muted">
              Tell us about your shop so we can verify your partnership.
            </Text>
            <Input
              label="Business Name"
              placeholder="Sukhumvit Bakery"
              value={businessName}
              onChangeText={setBusinessName}
              leftIcon={<Building2 size={20} color={colors.muted} />}
            />
            <Input
              label="Owner Name"
              placeholder="Kornchai Srisuk"
              value={ownerName}
              onChangeText={setOwnerName}
              leftIcon={<User size={20} color={colors.muted} />}
            />
            <Input
              label="Email"
              placeholder="shop@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              leftIcon={<Mail size={20} color={colors.muted} />}
            />
            <Input
              label="Phone"
              placeholder="081-234-5678"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              leftIcon={<Phone size={20} color={colors.muted} />}
            />
            {!user && (
              <Input
                label="Create Password"
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                leftIcon={<Lock size={20} color={colors.muted} />}
              />
            )}
          </View>
        );

      case 'bank':
        return (
          <View>
            <Text variant="h2" className="mb-2 text-center">
              {t('merchant.onboarding.bankAccount')}
            </Text>
            <Text variant="body" className="mb-6 text-center text-muted">
              Add the account where you want to receive payouts.
            </Text>
            <Input
              label="Bank Name"
              placeholder="Siam Commercial Bank"
              value={bankName}
              onChangeText={setBankName}
              leftIcon={<Landmark size={20} color={colors.muted} />}
            />
            <Input
              label="Account Name"
              placeholder="Kornchai Srisuk"
              value={accountName}
              onChangeText={setAccountName}
              leftIcon={<User size={20} color={colors.muted} />}
            />
            <Input
              label="Account Number"
              placeholder="123-4-56789-0"
              keyboardType="number-pad"
              value={accountNumber}
              onChangeText={setAccountNumber}
              leftIcon={<CreditCard size={20} color={colors.muted} />}
            />
          </View>
        );

      case 'firstListing':
        return (
          <View className="items-center">
            <View className="mb-6 h-24 w-24 items-center justify-center rounded-3xl bg-primary/10">
              <PackagePlus size={48} color={colors.primary} />
            </View>
            <Text variant="h2" className="mb-3 text-center">
              {t('merchant.onboarding.stepListing')}
            </Text>
            <Text variant="body" className="mb-8 text-center text-muted">
              {t('merchant.onboarding.stepListingDesc')}
            </Text>
            <Card variant="outlined" className="w-full">
              <View className="mb-3 flex-row items-center">
                <View className="mr-3 h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <PackagePlus size={28} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text variant="h4">Mystery Box</Text>
                  <Text variant="body-sm" className="text-muted">
                    A surprise bag of surplus food — most popular with rescuers.
                  </Text>
                </View>
              </View>
              <Button
                fullWidth
                variant="outline"
                onPress={() => router.push('/(merchant)/listings/new' as any)}
              >
                Create your first listing
              </Button>
            </Card>
          </View>
        );

      case 'complete':
        return (
          <View className="items-center">
            <View className="mb-6 h-24 w-24 items-center justify-center rounded-3xl bg-primary/10">
              <BadgeCheck size={48} color={colors.primary} />
            </View>
            <Text variant="h2" className="mb-3 text-center">
              {t('merchant.onboarding.complete')}
            </Text>
            <Text variant="body" className="mb-8 text-center text-muted">
              {t('merchant.onboarding.completeDesc')}
            </Text>
            <Card variant="outlined" className="w-full">
              <View className="space-y-3">
                {[
                  t('merchant.onboarding.stepValue'),
                  t('merchant.onboarding.stepPricing'),
                  t('merchant.onboarding.stepPayout'),
                  t('merchant.onboarding.businessInfo'),
                  t('merchant.onboarding.bankAccount'),
                ].map((label) => (
                  <View key={label} className="flex-row items-center">
                    <BadgeCheck size={18} color={colors.success} />
                    <Text variant="body-sm" className="ml-3">
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        );
    }
  };

  return (
    <Screen scrollable keyboardAvoiding className="bg-background">
      <Header
        title={t('merchant.onboarding.title')}
        showBack={isFirstStep}
        onBack={isFirstStep ? () => router.back() : undefined}
        right={
          <PressableScale onPress={handleSkipToDashboard} scale={0.95}>
            <View className="flex-row items-center">
              <SkipForward size={18} color={colors.muted} />
              <Text variant="caption" className="ml-1 text-muted">
                {t('merchant.onboarding.skipForNow')}
              </Text>
            </View>
          </PressableScale>
        }
      />

      <View className="px-6 pb-10">
        {/* Progress dots */}
        <View className="mb-6 flex-row justify-center space-x-2">
          {STEPS.map((s, i) => (
            <View
              key={s.key}
              className={`h-2 rounded-full ${
                i <= stepIndex ? 'w-6 bg-primary' : 'w-2 bg-muted/30'
              }`}
            />
          ))}
        </View>

        <Animated.View
          key={currentStep.key}
          entering={direction === 'next' ? FadeInRight.duration(250) : FadeInLeft.duration(250)}
          className="min-h-[420px] justify-center"
        >
          {renderStepContent(currentStep.key)}
        </Animated.View>

        <View className="mt-8 flex-row items-center space-x-3">
          {!isFirstStep && (
            <Button
              variant="outline"
              onPress={handleBack}
              leftIcon={<ArrowLeft size={18} color={colors.foreground} />}
              className="flex-1"
            >
              Back
            </Button>
          )}
          <Button
            fullWidth={isFirstStep}
            className={isFirstStep ? 'w-full' : 'flex-1'}
            onPress={handleNext}
            loading={isRegistering}
            rightIcon={!isLastStep ? <ArrowRight size={18} color={colors.white} /> : undefined}
          >
            {isLastStep ? t('merchant.onboarding.goToDashboard') : 'Next'}
          </Button>
        </View>

        {isTestAccount && (
          <Button variant="ghost" className="mt-3" onPress={handleSkipToDashboard}>
            <Text variant="body-sm" className="text-muted">
              Continue with test merchant account
            </Text>
          </Button>
        )}
      </View>
    </Screen>
  );
}
