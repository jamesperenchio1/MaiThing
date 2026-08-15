import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User, Phone, ArrowRight } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Text } from '@/src/components/ui/Text';
import { Screen } from '@/src/components/layout/Screen';
import { Header } from '@/src/components/layout/Header';
import { SocialAuthButtons } from '@/src/components/auth/SocialAuthButtons';
import { useAuth } from '@/src/hooks/useAuth';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { signUpSchema, type SignUpForm } from '@/src/features/auth/schemas';

export default function SignUpScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();
  const { signUp, signUpLoading, signUpError, signInWithProvider } = useAuth();

  const { control, handleSubmit } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '' },
  });

  const onSubmit = (data: SignUpForm) => {
    signUp({ email: data.email, password: data.password, name: data.name, phone: data.phone });
  };

  return (
    <Screen scrollable keyboardAvoiding>
      <Header title={t('auth.signUp')} />
      <View className="px-6 pb-10">
        <Animated.View entering={FadeInUp.duration(500)}>
          <Text variant="h1" className="mb-2 mt-4">
            {t('auth.welcome')}
          </Text>
          <Text variant="body" className="mb-6 text-muted">
            {t('auth.subtitle')}
          </Text>

          <SocialAuthButtons onPress={signInWithProvider} />

          <View className="my-6 flex-row items-center gap-3">
            <View className="h-px flex-1 bg-border" />
            <Text variant="caption" className="text-muted">
              or continue with email
            </Text>
            <View className="h-px flex-1 bg-border" />
          </View>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Input
                label={t('auth.name')}
                placeholder={t('auth.namePlaceholder')}
                textContentType="name"
                autoComplete="name"
                leftIcon={<User size={20} color={colors.muted} />}
                value={value}
                onChangeText={onChange}
                error={error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Input
                label={t('auth.email')}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
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
            name="phone"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Input
                label={t('auth.phone')}
                placeholder="081-234-5678"
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                leftIcon={<Phone size={20} color={colors.muted} />}
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
                textContentType="newPassword"
                autoComplete="new-password"
                leftIcon={<Lock size={20} color={colors.muted} />}
                value={value}
                onChangeText={onChange}
                error={error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Input
                label={t('auth.confirmPassword')}
                placeholder="••••••••"
                secureTextEntry
                textContentType="newPassword"
                autoComplete="new-password"
                leftIcon={<Lock size={20} color={colors.muted} />}
                value={value}
                onChangeText={onChange}
                error={error?.message}
              />
            )}
          />

          {signUpError && (
            <Text variant="caption" className="mb-4 text-danger">
              {signUpError.message}
            </Text>
          )}

          <Button
            fullWidth
            loading={signUpLoading}
            onPress={handleSubmit(onSubmit)}
            rightIcon={<ArrowRight size={18} color={colors.white} />}
          >
            {t('auth.signUp')}
          </Button>

          <Button
            variant="ghost"
            className="mt-4"
            onPress={() => router.push('/(auth)/sign-in' as any)}
          >
            <Text variant="body-sm" className="text-muted">
              {t('auth.alreadyHaveAccount')}{' '}
            </Text>
            <Text variant="body-sm" className="text-primary">
              {t('auth.signInLink')}
            </Text>
          </Button>
        </Animated.View>
      </View>
    </Screen>
  );
}
