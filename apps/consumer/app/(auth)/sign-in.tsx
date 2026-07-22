import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../../src/lib/supabase';
import { Icon } from '../../src/components/ui';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert(t('common.error'), error.message);
    } else {
      router.replace('/(buyer)/discover');
    }
  };

  const handleGoogleSignIn = async () => {
    const redirectTo = Linking.createURL('auth/callback');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      Alert.alert(t('common.error'), error.message);
      return;
    }

    const authUrl = data?.url;
    if (!authUrl) {
      Alert.alert(t('common.error'), 'Could not start Google sign-in.');
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo);

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
        if (sessionError) {
          Alert.alert(t('common.error'), sessionError.message);
        } else {
          router.replace('/(buyer)/discover');
        }
      }
    }
  };

  const handleLineSignIn = async () => {
    const redirectTo = Linking.createURL('auth/callback');
    const callbackUrl = 'https://bvvsuollejcndcjjveal.supabase.co/functions/v1/line-callback';
    const lineAuthUrl =
      `https://access.line.me/oauth2/v2.1/authorize` +
      `?response_type=code` +
      `&client_id=2010768189` +
      `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
      `&state=${Math.random().toString(36).slice(2)}` +
      `&scope=profile%20openid%20email`;
    const result = await WebBrowser.openAuthSessionAsync(lineAuthUrl, redirectTo);
    if ((result.type as string) === 'cancel') return;
    if (
      (result.type as string) === 'success' &&
      'url' in result &&
      (result as { url: string }).url.includes('error')
    ) {
      Alert.alert(t('common.error'), t('auth.lineSignInFailed'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <View style={styles.logoRow}>
          <Icon name="leaf-outline" size={36} color="#16a34a" />
          <Text style={styles.logo}>MaiThing</Text>
        </View>
        <Text style={styles.tagline}>{t('auth.tagline')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          accessibilityLabel={t('auth.email')}
        />
        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            accessibilityLabel={t('auth.password')}
          />
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eyeBtn}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Icon
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#6b7280"
            />
          </Pressable>
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => void handleEmailSignIn()}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={t('auth.signIn')}
        >
          <Text style={styles.primaryBtnText}>
            {loading ? t('common.loading') : t('auth.signIn')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.googleBtn}
          onPress={() => void handleGoogleSignIn()}
          accessibilityRole="button"
          accessibilityLabel={t('auth.continueWithGoogle')}
        >
          <Text style={styles.googleBtnText}>{t('auth.continueWithGoogle')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.lineBtn}
          onPress={() => void handleLineSignIn()}
          accessibilityRole="button"
          accessibilityLabel={t('auth.continueWithLine')}
        >
          <Text style={styles.lineBtnText}>{t('auth.continueWithLine')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')} style={styles.linkBtn}>
          <Text style={styles.linkText}>{t('auth.signUp')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logo: { fontSize: 32, fontWeight: '700', textAlign: 'center', color: '#16a34a' },
  tagline: { fontSize: 14, textAlign: 'center', color: '#6b7280', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 52,
  },
  primaryBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 52,
  },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  googleBtn: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 52,
  },
  googleBtnText: { fontWeight: '600', fontSize: 16 },
  lineBtn: {
    backgroundColor: '#06C755',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 52,
  },
  lineBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  linkBtn: { alignItems: 'center', padding: 8, minHeight: 44 },
  linkText: { color: '#16a34a', fontSize: 14 },
  passwordRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    minHeight: 52,
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
