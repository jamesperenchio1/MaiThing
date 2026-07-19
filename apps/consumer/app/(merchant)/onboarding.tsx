import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useProfile } from '../../src/hooks/useProfile';
import { capture } from '../../src/lib/posthog';
import { FOOD_CATEGORIES, subscriptionTierSchema } from '@maithing/shared';
import type { z } from 'zod';

type SubscriptionTier = z.infer<typeof subscriptionTierSchema>;

export default function MerchantOnboardingScreen() {
  const { t } = useTranslation();
  const { data: profile, refetch } = useProfile();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim() || !category) return;
    setIsSubmitting(true);
    setError(null);

    const userId = profile?.id;
    if (!userId) {
      setError(t('common.error'));
      setIsSubmitting(false);
      return;
    }

    const { error: orgError } = await supabase.from('merchant_orgs').insert({
      owner_id: userId,
      name: name.trim(),
      description: description.trim() || null,
      category,
      subscription_tier: tier,
      subscription_status: 'active',
    });

    if (orgError) {
      setError(orgError.message);
      setIsSubmitting(false);
      return;
    }

    if (profile?.role !== 'merchant') {
      const { error: roleError } = await supabase
        .from('profiles')
        .update({ role: 'merchant' })
        .eq('id', userId);
      if (roleError) {
        setError(roleError.message);
        setIsSubmitting(false);
        return;
      }
    }

    await refetch();
    capture('merchant_onboarding_complete', { org_name: name.trim(), category, tier });
    setIsSubmitting(false);
    router.replace('/(merchant)/dashboard');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('merchant.onboardingTitle')}</Text>
      <Text style={styles.subtitle}>{t('merchant.onboardingSubtitle')}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>{t('merchant.orgName')}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={t('merchant.orgNamePlaceholder')}
          accessibilityLabel={t('merchant.orgName')}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('merchant.description')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder={t('merchant.descriptionPlaceholder')}
          multiline
          numberOfLines={4}
          accessibilityLabel={t('merchant.description')}
        />
      </View>

      <Text style={styles.label}>{t('merchant.category')}</Text>
      <View style={styles.chipRow}>
        {FOOD_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, category === cat && styles.chipSelected]}
            onPress={() => setCategory(cat)}
            accessibilityRole="button"
            accessibilityState={{ selected: category === cat }}
          >
            <Text style={[styles.chipText, category === cat && styles.chipTextSelected]}>
              {t(`categories.${cat}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t('merchant.subscriptionTier')}</Text>
      <View style={styles.tierRow}>
        {(['free', 'pro'] as SubscriptionTier[]).map((tierOption) => (
          <TouchableOpacity
            key={tierOption}
            style={[styles.tierCard, tier === tierOption && styles.tierCardSelected]}
            onPress={() => setTier(tierOption)}
            accessibilityRole="button"
            accessibilityState={{ selected: tier === tierOption }}
          >
            <Text style={[styles.tierTitle, tier === tierOption && styles.tierTextSelected]}>
              {t(`merchant.tier.${tierOption}`)}
            </Text>
            <Text style={styles.tierPrice}>
              {tierOption === 'free' ? t('merchant.tier.freePrice') : t('merchant.tier.proPrice')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.btn, (!name.trim() || !category || isSubmitting) && styles.btnDisabled]}
        onPress={() => void submit()}
        disabled={!name.trim() || !category || isSubmitting}
        accessibilityRole="button"
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>{t('common.save')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, backgroundColor: '#f9fafb', flexGrow: 1 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  textArea: { height: 90, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipSelected: { backgroundColor: '#dcfce7', borderColor: '#16a34a' },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextSelected: { color: '#15803d', fontWeight: '600' },
  tierRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  tierCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  tierCardSelected: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  tierTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  tierPrice: { fontSize: 13, color: '#6b7280' },
  tierTextSelected: { color: '#15803d' },
  error: { color: '#dc2626', marginBottom: 16 },
  btn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { backgroundColor: '#9ca3af' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
