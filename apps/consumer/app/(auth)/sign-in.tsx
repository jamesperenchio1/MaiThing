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
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../src/lib/supabase';

export default function SignInScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'maithing://auth/callback' },
    });
    if (error) Alert.alert(t('common.error'), error.message);
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
        <TextInput
          style={styles.input}
          placeholder={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel={t('auth.password')}
        />

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
  linkBtn: { alignItems: 'center', padding: 8, minHeight: 44 },
  linkText: { color: '#16a34a', fontSize: 14 },
});
