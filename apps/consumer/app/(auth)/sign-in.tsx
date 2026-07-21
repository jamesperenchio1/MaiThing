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

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailSignIn = async () => {
    console.log('[Auth] email sign-in attempt:', email);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      console.error('[Auth] email sign-in error:', error.message, error.status);
      Alert.alert(t('common.error'), error.message);
    } else {
      console.log('[Auth] email sign-in success, user:', data.user?.id);
      router.replace('/(buyer)/discover');
    }
  };

  const handleGoogleSignIn = async () => {
    // In Expo Go, Linking.createURL gives exp://IP:PORT/--/...
    // In a dev/prod build it gives maithing://...
    const redirectTo = Linking.createURL('auth/callback');
    console.log('[Auth] Google OAuth redirectTo:', redirectTo);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true, // We open the browser manually below
      },
    });

    if (error) {
      console.error('[Auth] Google OAuth URL error:', error.message);
      Alert.alert(t('common.error'), error.message);
      return;
    }

    const authUrl = data?.url;
    if (!authUrl) {
      console.error('[Auth] Google OAuth: no URL returned from Supabase');
      Alert.alert(t('common.error'), 'Could not start Google sign-in.');
      return;
    }

    console.log('[Auth] Opening Google auth URL in browser...');
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo);
    console.log('[Auth] WebBrowser result type:', result.type);

    if (result.type === 'success' && 'url' in result) {
      console.log('[Auth] OAuth callback URL:', result.url);
      // Parse tokens from fragment (#access_token=...&refresh_token=...)
      const parsed = new URL(result.url);
      const params = new URLSearchParams(parsed.hash.slice(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        console.log('[Auth] Setting session from OAuth tokens');
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) {
          console.error('[Auth] setSession error:', sessionError.message);
          Alert.alert(t('common.error'), sessionError.message);
        } else {
          console.log('[Auth] Google sign-in success');
          router.replace('/(buyer)/discover');
        }
      } else {
        // Supabase PKCE flow — the auth state change listener will pick it up
        console.log('[Auth] No fragment tokens; relying on onAuthStateChange');
      }
    } else if (result.type === 'cancel') {
      console.log('[Auth] Google OAuth cancelled by user');
    } else {
      console.log('[Auth] Google OAuth unexpected result:', JSON.stringify(result));
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
    console.log('[Auth] Opening LINE auth URL...');
    const result = await WebBrowser.openAuthSessionAsync(lineAuthUrl, redirectTo);
    console.log('[Auth] LINE WebBrowser result type:', result.type);
    if ((result.type as string) === 'cancel') return;
    if ((result.type as string) === 'success' && 'url' in result && (result as { url: string }).url.includes('error')) {
      Alert.alert(t('common.error'), t('auth.lineSignInFailed'));
    }
  };


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>🌿 MaiThing</Text>
        <Text style={styles.tagline}>ช่วยโลก ประหยัดเงิน อร่อยมาก</Text>

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
            <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
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
  eyeText: { fontSize: 18 },
});
