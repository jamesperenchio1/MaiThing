import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowRight, Check } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Text } from '@/src/components/ui/Text';
import { Screen } from '@/src/components/layout/Screen';
import { Header } from '@/src/components/layout/Header';
import { forgotPasswordSchema, type ForgotPasswordForm } from '@/src/features/auth/schemas';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { repositories } from '@/src/repositories';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    await repositories.auth.resetPassword(data.email);
    setLoading(false);
    setSent(true);
  };

  return (
    <Screen scrollable={false} keyboardAvoiding>
      <Header title={t('auth.forgotPassword')} />
      <View className="flex-1 justify-center px-6">
        <Animated.View entering={FadeInUp.duration(500)}>
          {!sent ? (
            <>
              <Text variant="h1" className="mb-2">
                {t('auth.forgotPassword')}
              </Text>
              <Text variant="body" className="mb-8 text-muted">
                Enter your email and we'll send you a link to reset your password.
              </Text>

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Input
                    label={t('auth.email')}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    leftIcon={<Mail size={20} color={colors.muted} />}
                    value={value}
                    onChangeText={onChange}
                    error={error?.message}
                  />
                )}
              />

              <Button
                fullWidth
                loading={loading}
                onPress={handleSubmit(onSubmit)}
                rightIcon={<ArrowRight size={18} color={colors.white} />}
              >
                Send Reset Link
              </Button>
            </>
          ) : (
            <View className="items-center">
              <View className="mb-6 rounded-full bg-primary/10 p-4">
                <Check size={32} color={colors.primary} />
              </View>
              <Text variant="h2" className="mb-2 text-center">
                Check your email
              </Text>
              <Text variant="body" className="mb-8 text-center text-muted">
                We've sent a password reset link to your email address.
              </Text>
              <Button fullWidth onPress={() => router.replace('/(auth)/sign-in' as any)}>
                Back to Sign In
              </Button>
            </View>
          )}
        </Animated.View>
      </View>
    </Screen>
  );
}
