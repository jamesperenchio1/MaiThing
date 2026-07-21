import { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../../src/lib/supabase';
import { Button, Card, Icon, Input, Screen } from '../../src/components/ui';
import { useTheme } from '../../src/theme';
import { getIcon, icons } from '../../src/icons';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { t } = useTranslation();
  const { colors, spacing, fontSizes, fontWeights } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const styles = makeStyles({ colors, spacing, fontSizes, fontWeights });

  const handleEmailSignIn = async () => {
    setErrorMessage(null);
    if (!email.trim() || !password) {
      setErrorMessage(t('common.error'));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setErrorMessage(error.message);
    } else {
      router.replace('/(buyer)/discover');
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setGoogleLoading(true);
    const redirectTo = Linking.createURL('auth/callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) {
      setGoogleLoading(false);
      setErrorMessage(error.message);
      return;
    }
    if (!data?.url) {
      setGoogleLoading(false);
      setErrorMessage(t('auth.googleSignInFailed'));
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'success' && 'url' in result) {
      const parsed = new URL(result.url);
      const params = new URLSearchParams(parsed.hash.slice(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        setGoogleLoading(false);
        if (sessionError) {
          setErrorMessage(sessionError.message);
        } else {
          router.replace('/(buyer)/discover');
        }
      } else {
        setGoogleLoading(false);
        setErrorMessage(t('auth.googleSignInFailed'));
      }
    } else {
      setGoogleLoading(false);
    }
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
              editable={!loading && !googleLoading}
            />

            <View style={styles.passwordContainer}>
              <Input
                label={t('auth.password')}
                placeholder={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                textContentType="password"
                editable={!loading && !googleLoading}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eye}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                <Icon
                  name={showPassword ? icons.eyeOff : icons.eye}
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>

            {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

            <Button
              onPress={() => void handleEmailSignIn()}
              loading={loading}
              disabled={!email.trim() || !password || googleLoading}
            >
              {t('auth.signIn')}
            </Button>

            <Button
              onPress={() => void handleGoogleSignIn()}
              variant="secondary"
              loading={googleLoading}
              disabled={loading || googleLoading}
            >
              {t('auth.continueWithGoogle')}
            </Button>

            <Button
              onPress={() => router.push('/(auth)/sign-up')}
              variant="ghost"
              disabled={loading || googleLoading}
            >
              {t('auth.signUp')}
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
  fontSizes,
  fontWeights,
}: {
  colors: ReturnType<typeof import('../../src/theme').useTheme>['colors'];
  spacing: ReturnType<typeof import('../../src/theme').useTheme>['spacing'];
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
    passwordContainer: {
      position: 'relative',
    },
    eye: {
      position: 'absolute',
      right: spacing[3],
      top: spacing[7] + 2,
      padding: spacing[2],
    },
    error: {
      color: colors.danger,
      fontSize: fontSizes.sm,
      textAlign: 'center',
    },
  });
}
