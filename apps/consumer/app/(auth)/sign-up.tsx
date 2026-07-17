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
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../src/lib/supabase';

export default function SignUpScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!pdpaConsent) {
      Alert.alert(t('common.error'), t('auth.pdpaConsent'));
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
    setLoading(false);
    if (error) {
      Alert.alert(t('common.error'), error.message);
    } else {
      router.replace('/(buyer)/discover');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>{t('auth.signUp')}</Text>

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

        <View style={styles.consentRow}>
          <Switch
            value={pdpaConsent}
            onValueChange={setPdpaConsent}
            trackColor={{ true: '#16a34a' }}
            accessibilityLabel={t('auth.pdpaConsent')}
          />
          <Text style={styles.consentText}>{t('auth.pdpaConsent')}</Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, !pdpaConsent && styles.primaryBtnDisabled]}
          onPress={() => void handleSignUp()}
          disabled={loading || !pdpaConsent}
          accessibilityRole="button"
          accessibilityLabel={t('auth.signUp')}
        >
          <Text style={styles.primaryBtnText}>
            {loading ? t('common.loading') : t('auth.signUp')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.linkBtn}>
          <Text style={styles.linkText}>{t('auth.signIn')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8, color: '#111827' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 52,
  },
  consentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  consentText: { flex: 1, fontSize: 13, color: '#374151' },
  primaryBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 52,
  },
  primaryBtnDisabled: { backgroundColor: '#d1fae5' },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  linkBtn: { alignItems: 'center', padding: 8, minHeight: 44 },
  linkText: { color: '#16a34a', fontSize: 14 },
});
