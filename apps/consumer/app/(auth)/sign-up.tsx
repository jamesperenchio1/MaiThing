import { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../src/lib/supabase';
import { useApplyReferralCode } from '../../src/hooks/useReferral';
import { Button, Card, Icon, Input, Screen } from '../../src/components/ui';
import { useTheme } from '../../src/theme';
import { getIcon, icons } from '../../src/icons';

export default function SignUpScreen() {
  const { t } = useTranslation();
  const { colors, spacing, radii, fontSizes, fontWeights } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const applyReferral = useApplyReferralCode();

  const styles = makeStyles({ colors, spacing, radii, fontSizes, fontWeights });

  const handleSignUp = async () => {
    setErrorMessage(null);
    if (!email.trim() || !password) {
      setErrorMessage(t('common.error'));
      return;
    }
    if (!pdpaConsent) {
      setErrorMessage(t('auth.pdpaRequired'));
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { pdpa_consented_at: new Date().toISOString() },
      },
    });
    if (error) {
      setLoading(false);
      setErrorMessage(error.message);
      return;
    }

    const trimmedCode = referralCode.trim().toUpperCase();
    if (trimmedCode) {
      try {
        await applyReferral.mutateAsync(trimmedCode);
      } catch {
        // Ignore referral errors so they do not block sign-up.
      }
    }
    setLoading(false);
    router.replace('/(buyer)/discover');
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inner}>
          <View style={styles.logo}>
            <Icon name={getIcon('logo')} size={48} color={colors.primary} />
            <Text style={styles.logoText}>MaiThing</Text>
          </View>

          <Card padding="lg" style={styles.card}>
            <Input
              label={t('auth.email')}
              placeholder={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              editable={!loading}
            />

            <Input
              label={t('auth.password')}
              placeholder={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
              editable={!loading}
            />

            <Input
              label={t('auth.referralCode')}
              placeholder={t('auth.referralCode')}
              value={referralCode}
              onChangeText={setReferralCode}
              autoCapitalize="characters"
              maxLength={6}
              editable={!loading}
            />

            <Pressable
              onPress={() => setPdpaConsent((v) => !v)}
              style={styles.consentRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: pdpaConsent }}
              disabled={loading}
            >
              <View
                style={[
                  styles.checkbox,
                  pdpaConsent && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                {pdpaConsent ? (
                  <Icon name={icons.check} size={16} color={colors.textInverse} />
                ) : null}
              </View>
              <Text style={styles.consentText}>{t('auth.pdpaConsent')}</Text>
            </Pressable>

            {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

            <Button
              onPress={() => void handleSignUp()}
              loading={loading}
              disabled={!pdpaConsent || !email.trim() || !password}
            >
              {t('auth.signUp')}
            </Button>

            <Button onPress={() => router.back()} variant="ghost" disabled={loading}>
              {t('auth.signIn')}
            </Button>
          </Card>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function makeStyles({
  colors,
  spacing,
  radii,
  fontSizes,
  fontWeights,
}: {
  colors: ReturnType<typeof import('../../src/theme').useTheme>['colors'];
  spacing: ReturnType<typeof import('../../src/theme').useTheme>['spacing'];
  radii: ReturnType<typeof import('../../src/theme').useTheme>['radii'];
  fontSizes: ReturnType<typeof import('../../src/theme').useTheme>['fontSizes'];
  fontWeights: ReturnType<typeof import('../../src/theme').useTheme>['fontWeights'];
}) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    inner: {
      flex: 1,
      justifyContent: 'center',
      padding: spacing[6],
      gap: spacing[6],
    },
    logo: {
      alignItems: 'center',
      gap: spacing[2],
    },
    logoText: {
      fontSize: fontSizes['3xl'],
      fontWeight: fontWeights.bold,
      color: colors.text,
    },
    card: {
      gap: spacing[4],
    },
    consentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    consentText: {
      flex: 1,
      fontSize: fontSizes.sm,
      color: colors.text,
      lineHeight: 20,
    },
    error: {
      color: colors.danger,
      fontSize: fontSizes.sm,
      textAlign: 'center',
    },
  });
}
