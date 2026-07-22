import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Leaf, Utensils, Wallet } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Button } from '@/src/components/ui/Button';
import { Text } from '@/src/components/ui/Text';
import { useAuth } from '@/src/hooks/useAuth';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { APP_NAME } from '@/src/lib/constants';

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();
  const { continueAsTest } = useAuth();

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

  return (
    <View testID="welcome-screen" className="flex-1 bg-background px-6 pt-20 pb-10">
      <Animated.View
        entering={FadeInUp.duration(600).delay(100)}
        className="flex-1 items-center justify-center"
      >
        <View className="mb-8 h-32 w-32 items-center justify-center rounded-3xl bg-primary/10">
          <Leaf size={64} color={colors.primary} />
        </View>

        <Text testID="welcome-title" variant="h1" className="mb-4 text-center text-primary">
          {APP_NAME}
        </Text>
        <Text testID="welcome-subtitle" variant="h2" className="mb-4 text-center">
          {t('auth.welcome')}
        </Text>
        <Text variant="body" className="mb-12 text-center text-muted">
          {t('app.tagline')}
        </Text>

        <View className="w-full space-y-4">
          <View className="flex-row items-center rounded-2xl bg-muted/10 p-4">
            <View className="mr-4 rounded-xl bg-primary/10 p-2">
              <Wallet size={24} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text variant="h4">{t('auth.onboarding.saveMoney')}</Text>
              <Text variant="body-sm" className="text-muted">
                {t('auth.onboarding.saveMoneyDesc')}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center rounded-2xl bg-muted/10 p-4">
            <View className="mr-4 rounded-xl bg-primary/10 p-2">
              <Utensils size={24} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text variant="h4">{t('auth.onboarding.saveFood')}</Text>
              <Text variant="body-sm" className="text-muted">
                {t('auth.onboarding.saveFoodDesc')}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeIn.duration(600).delay(400)} className="w-full space-y-3">
        <Button testID="sign-up-button" fullWidth onPress={handleSignUp}>
          {t('auth.signUp')}
        </Button>
        <Button testID="sign-in-button" variant="secondary" fullWidth onPress={handleSignIn}>
          {t('auth.signIn')}
        </Button>

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
      </Animated.View>
    </View>
  );
}
