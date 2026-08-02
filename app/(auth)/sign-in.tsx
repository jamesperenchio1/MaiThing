import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, ArrowRight } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Text } from '@/src/components/ui/Text';
import { Screen } from '@/src/components/layout/Screen';
import { Header } from '@/src/components/layout/Header';
import { SocialAuthButtons } from '@/src/components/auth/SocialAuthButtons';
import { useAuth } from '@/src/hooks/useAuth';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { signInSchema, type SignInForm } from '@/src/features/auth/schemas';

export default function SignInScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();
  const { signIn, signInLoading, signInError, continueAsTest } = useAuth();

  const { control, handleSubmit } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: SignInForm) => {
    signIn(data);
  };

  return (
    <Screen scrollable keyboardAvoiding>
      <Header title={t('auth.signIn')} />
      <View className="px-6 pb-10">
        <Animated.View entering={FadeInUp.duration(500)}>
          <Text variant="h1" className="mb-2 mt-4">
            {t('auth.welcome')}
          </Text>
          <Text variant="body" className="mb-6 text-muted">
            {t('auth.subtitle')}
          </Text>

          <SocialAuthButtons onPress={() => continueAsTest('customer')} />

          <View className="my-6 flex-row items-center gap-3">
            <View className="h-px flex-1 bg-border" />
            <Text variant="caption" className="text-muted">
              or continue with email
            </Text>
            <View className="h-px flex-1 bg-border" />
          </View>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Input
                label={t('auth.email')}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                autoComplete="email"
                leftIcon={<Mail size={20} color={colors.muted} />}
                value={value}
                onChangeText={onChange}
                error={error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Input
                label={t('auth.password')}
                placeholder="••••••••"
                secureTextEntry
                textContentType="password"
                autoComplete="current-password"
                leftIcon={<Lock size={20} color={colors.muted} />}
                value={value}
                onChangeText={onChange}
                error={error?.message}
              />
            )}
          />

          {signInError && (
            <Text variant="caption" className="mb-4 text-danger">
              {signInError.message}
            </Text>
          )}

          <Button
            fullWidth
            loading={signInLoading}
            onPress={handleSubmit(onSubmit)}
            rightIcon={<ArrowRight size={18} color={colors.white} />}
          >
            {t('auth.signIn')}
          </Button>

          <Button
            variant="ghost"
            className="mt-2"
            onPress={() => router.push('/(auth)/forgot-password' as any)}
          >
            <Text variant="body-sm" className="text-primary">
              {t('auth.forgotPassword')}
            </Text>
          </Button>
        </Animated.View>
      </View>
    </Screen>
  );
}
